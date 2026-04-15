import { db } from '../shared/config';
import { ref, set, onValue, update, push, remove, get } from 'firebase/database';
import { UsersMap, UserData, NavigationContextData } from '../shared/types';
import { hashPassword } from '../shared/passwordSecurity';
import { BaseService } from './baseService';
import { AdminDashboardUser, AdminUserHistoryEntry, AdminUserRole } from './adminTypes';
import { resolveAuditRecord as applyAuditDecision, ResolveAuditRecordOptions } from './auditService';
export class AdminAPI extends BaseService {
  private streamUnsubscribers: Array<() => void> = [];
  private usersDispatchTimer: ReturnType<typeof setTimeout> | null = null;
  private presenceDispatchTimer: ReturnType<typeof setTimeout> | null = null;
  private pendingUsersPayload: UsersMap | null = null;
  private pendingPresencePayload: Record<string, { status: string; lastSeen: number }> | null = null;
  private lastUsersDispatchAt = 0;
  private lastPresenceDispatchAt = 0;
  private static readonly USERS_DISPATCH_INTERVAL_MS = 1200;
  private static readonly PRESENCE_DISPATCH_INTERVAL_MS = 1200;

  private scheduleUsersDispatch(payload: UsersMap) {
    this.pendingUsersPayload = payload;
    const now = Date.now();
    const elapsed = now - this.lastUsersDispatchAt;
    const waitMs = Math.max(0, AdminAPI.USERS_DISPATCH_INTERVAL_MS - elapsed);

    if (this.usersDispatchTimer) {
      clearTimeout(this.usersDispatchTimer);
      this.usersDispatchTimer = null;
    }

    this.usersDispatchTimer = setTimeout(() => {
      this.lastUsersDispatchAt = Date.now();
      const nextPayload = this.pendingUsersPayload || {};
      this.pendingUsersPayload = null;
      this.dispatch('dataUpdated', nextPayload);
    }, waitMs);
  }

  private schedulePresenceDispatch(payload: Record<string, { status: string; lastSeen: number }>) {
    this.pendingPresencePayload = payload;
    const now = Date.now();
    const elapsed = now - this.lastPresenceDispatchAt;
    const waitMs = Math.max(0, AdminAPI.PRESENCE_DISPATCH_INTERVAL_MS - elapsed);

    if (this.presenceDispatchTimer) {
      clearTimeout(this.presenceDispatchTimer);
      this.presenceDispatchTimer = null;
    }

    this.presenceDispatchTimer = setTimeout(() => {
      this.lastPresenceDispatchAt = Date.now();
      const nextPayload = this.pendingPresencePayload || {};
      this.pendingPresencePayload = null;
      this.dispatch('presenceUpdated', nextPayload);
    }, waitMs);
  }

  disconnect() {
    this.streamUnsubscribers.forEach((unsubscribe) => {
      try {
        unsubscribe();
      } catch {
      }
    });
    this.streamUnsubscribers = [];

    if (this.usersDispatchTimer) {
      clearTimeout(this.usersDispatchTimer);
      this.usersDispatchTimer = null;
    }

    if (this.presenceDispatchTimer) {
      clearTimeout(this.presenceDispatchTimer);
      this.presenceDispatchTimer = null;
    }

    this.pendingUsersPayload = null;
    this.pendingPresencePayload = null;
    this.lastUsersDispatchAt = 0;
    this.lastPresenceDispatchAt = 0;
  }

  private async fetchAdminUsersMap(): Promise<Record<string, any>> {
    if (!db) {
      throw new Error('Database is not initialized');
    }

    const snapshot = await get(ref(db, 'adminUsers'));
    const data = snapshot.val();
    if (!data || typeof data !== 'object') {
      return {};
    }

    return data as Record<string, any>;
  }

  private normalizeAdminEmail(email: string): string {
    return String(email || '').trim().toLowerCase();
  }

  private sanitizeAdminRole(role: string): AdminUserRole {
    return role === 'superadmin' ? 'superadmin' : 'admin';
  }

  private validateAdminEmail(email: string) {
    const normalized = this.normalizeAdminEmail(email);
    if (!normalized) {
      throw new Error('Email is required');
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(normalized)) {
      throw new Error('Invalid email format');
    }
  }

  private validateAdminPassword(password: string, allowEmpty: boolean = false) {
    const cleanPassword = String(password || '');
    if (allowEmpty && !cleanPassword) {
      return;
    }

    if (cleanPassword.length < 4) {
      throw new Error('Password must be at least 4 characters');
    }
  }

  private async pushAdminHistory(entry: AdminUserHistoryEntry): Promise<void> {
    if (!db) return;
    await push(ref(db, 'adminUsersHistory'), entry);
  }

  async getAdminUsers(): Promise<AdminDashboardUser[]> {
    const data = await this.fetchAdminUsersMap();

    const users = Object.entries(data)
      .map(([id, raw]) => ({
        id,
        email: this.normalizeAdminEmail(String(raw?.email || '')),
        role: this.sanitizeAdminRole(String(raw?.role || 'admin')),
        createdAt: Number(raw?.createdAt || 0) || undefined,
        updatedAt: Number(raw?.updatedAt || 0) || undefined,
        lastLogin: Number(raw?.lastLogin || 0) || undefined
      }))
      .filter((user) => !!user.email);

    users.sort((a, b) => {
      if (a.role !== b.role) {
        return a.role === 'superadmin' ? -1 : 1;
      }

      return a.email.localeCompare(b.email);
    });

    return users;
  }

  async addAdminUser(input: { email: string; password: string; role: AdminUserRole }, actorEmail?: string): Promise<AdminDashboardUser> {
    if (!db) {
      throw new Error('Database is not initialized');
    }

    const email = this.normalizeAdminEmail(input.email);
    const password = String(input.password || '');
    const role = this.sanitizeAdminRole(input.role);

    this.validateAdminEmail(email);
    this.validateAdminPassword(password);

    const usersMap = await this.fetchAdminUsersMap();
    const duplicate = Object.values(usersMap).some((entry: any) => this.normalizeAdminEmail(entry?.email || '') === email);
    if (duplicate) {
      throw new Error('Email already exists');
    }

    const now = Date.now();
    const passwordHash = await hashPassword(password);
    const newRef = push(ref(db, 'adminUsers'));
    const userId = newRef.key;
    if (!userId) {
      throw new Error('Failed to create admin user');
    }

    const newUser: AdminDashboardUser = {
      id: userId,
      email,
      role,
      createdAt: now,
      updatedAt: now
    };

    await set(ref(db, `adminUsers/${userId}`), {
      email,
      password: passwordHash,
      role,
      createdAt: now,
      updatedAt: now
    });

    await this.pushAdminHistory({
      action: 'created',
      actorEmail: actorEmail ? this.normalizeAdminEmail(actorEmail) : null,
      targetUserId: userId,
      targetEmail: email,
      targetRole: role,
      timestamp: now,
      before: null,
      after: {
        email,
        role
      }
    });

    return newUser;
  }

  async updateAdminUser(
    userId: string,
    input: { email: string; password?: string; role: AdminUserRole },
    actorEmail?: string
  ): Promise<AdminDashboardUser> {
    if (!db) {
      throw new Error('Database is not initialized');
    }

    const cleanUserId = String(userId || '').trim();
    if (!cleanUserId) {
      throw new Error('User id is required');
    }

    const email = this.normalizeAdminEmail(input.email);
    const nextRole = this.sanitizeAdminRole(input.role);
    const nextPassword = String(input.password || '');

    this.validateAdminEmail(email);
    this.validateAdminPassword(nextPassword, true);

    const usersMap = await this.fetchAdminUsersMap();
    const current = usersMap[cleanUserId];
    if (!current) {
      throw new Error('Admin user not found');
    }

    const duplicateEntry = Object.entries(usersMap).find(([id, entry]) => {
      if (id === cleanUserId) return false;
      return this.normalizeAdminEmail(entry?.email || '') === email;
    });
    if (duplicateEntry) {
      throw new Error('Email already exists');
    }

    const currentRole = this.sanitizeAdminRole(String(current?.role || 'admin'));
    if (currentRole === 'superadmin' && nextRole !== 'superadmin') {
      const superAdminCount = Object.values(usersMap).filter((entry: any) => this.sanitizeAdminRole(String(entry?.role || 'admin')) === 'superadmin').length;
      if (superAdminCount <= 1) {
        throw new Error('Cannot downgrade the last super admin');
      }
    }

    const now = Date.now();
    const updatePayload: Record<string, any> = {
      email,
      role: nextRole,
      updatedAt: now
    };

    if (nextPassword) {
      updatePayload.password = await hashPassword(nextPassword);
    }

    await update(ref(db, `adminUsers/${cleanUserId}`), updatePayload);

    const updatedUser: AdminDashboardUser = {
      id: cleanUserId,
      email,
      role: nextRole,
      createdAt: Number(current?.createdAt || 0) || undefined,
      updatedAt: now,
      lastLogin: Number(current?.lastLogin || 0) || undefined
    };

    await this.pushAdminHistory({
      action: 'updated',
      actorEmail: actorEmail ? this.normalizeAdminEmail(actorEmail) : null,
      targetUserId: cleanUserId,
      targetEmail: email,
      targetRole: nextRole,
      timestamp: now,
      before: {
        email: this.normalizeAdminEmail(String(current?.email || '')),
        role: currentRole
      },
      after: {
        email,
        role: nextRole
      }
    });

    return updatedUser;
  }

  async deleteAdminUser(userId: string, actorEmail?: string): Promise<void> {
    if (!db) {
      throw new Error('Database is not initialized');
    }

    const cleanUserId = String(userId || '').trim();
    if (!cleanUserId) {
      throw new Error('User id is required');
    }

    const usersMap = await this.fetchAdminUsersMap();
    const current = usersMap[cleanUserId];
    if (!current) {
      throw new Error('Admin user not found');
    }

    const currentRole = this.sanitizeAdminRole(String(current?.role || 'admin'));
    if (currentRole === 'superadmin') {
      const superAdminCount = Object.values(usersMap).filter((entry: any) => this.sanitizeAdminRole(String(entry?.role || 'admin')) === 'superadmin').length;
      if (superAdminCount <= 1) {
        throw new Error('Cannot delete the last super admin');
      }
    }

    await remove(ref(db, `adminUsers/${cleanUserId}`));

    await this.pushAdminHistory({
      action: 'deleted',
      actorEmail: actorEmail ? this.normalizeAdminEmail(actorEmail) : null,
      targetUserId: cleanUserId,
      targetEmail: this.normalizeAdminEmail(String(current?.email || '')),
      targetRole: currentRole,
      timestamp: Date.now(),
      before: {
        email: this.normalizeAdminEmail(String(current?.email || '')),
        role: currentRole
      },
      after: null
    });
  }

  async getAdminUsersHistory(limit: number = 50): Promise<AdminUserHistoryEntry[]> {
    if (!db) {
      throw new Error('Database is not initialized');
    }

    const snapshot = await get(ref(db, 'adminUsersHistory'));
    const data = snapshot.val();
    if (!data || typeof data !== 'object') {
      return [];
    }

    const list = Object.values(data).map((raw: any) => ({
      action: raw?.action === 'deleted' ? 'deleted' : raw?.action === 'updated' ? 'updated' : 'created',
      actorEmail: raw?.actorEmail ? this.normalizeAdminEmail(String(raw.actorEmail)) : null,
      targetUserId: String(raw?.targetUserId || ''),
      targetEmail: this.normalizeAdminEmail(String(raw?.targetEmail || '')),
      targetRole: this.sanitizeAdminRole(String(raw?.targetRole || 'admin')),
      timestamp: Number(raw?.timestamp || 0),
      before: raw?.before || null,
      after: raw?.after || null
    })) as AdminUserHistoryEntry[];

    return list
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, Math.max(1, Math.min(200, Math.floor(limit))));
  }

  connect() {
    if (!db) {
      console.error('❌ AdminAPI: db is null/undefined! Firebase not connected.');
      return;
    }

    // Avoid duplicate Firebase listeners if connect is called more than once.
    this.disconnect();

    // Listen to users data (only for important data changes, not status)
    const usersRef = ref(db, 'users');
    const unsubscribeUsers = onValue(usersRef, (snapshot) => {
      const data = snapshot.val();

      if (data) {
        const formattedUsers: UsersMap = {};
        let hasNewPaymentEvent = false;
        let hasNewDataEvent = false;

        Object.keys(data).forEach(key => {
          const user = data[key];
          const paymentsArr = user.payments ? Object.values(user.payments) : [];

          const resolvedIp = user.ip || key.replace(/_/g, '.');

          if (user.hasPayment && user.hasNewData) hasNewPaymentEvent = true;
          else if (user.hasNewData) hasNewDataEvent = true;

          formattedUsers[resolvedIp] = { ...user, ip: resolvedIp, payments: paymentsArr as any[] };
        });

        this.scheduleUsersDispatch(formattedUsers);

        if (hasNewPaymentEvent) this.dispatch('newPayment', {});
        else if (hasNewDataEvent) this.dispatch('newData', {});
      } else {
        this.scheduleUsersDispatch({});
      }
    }, (error) => {
      console.error('❌ Firebase read error:', error);
    });

    // Listen to presence updates for real-time status (lightweight)
    const presenceRef = ref(db, 'presence');
    const unsubscribePresence = onValue(presenceRef, (snapshot) => {
      const presenceData = snapshot.val();
      if (presenceData) {
        this.schedulePresenceDispatch(presenceData);
      } else {
        this.schedulePresenceDispatch({});
      }
    });

    const unsubscribeGlobalSkip = onValue(ref(db, 'settings/globalSkipLocation'), (snapshot) => {
      this.dispatch('globalSkipLocationUpdated', !!snapshot.val());
    });

    this.streamUnsubscribers = [unsubscribeUsers, unsubscribePresence, unsubscribeGlobalSkip];
  }

  setGlobalSkipLocation(enabled: boolean) {
    if (!db) return;
    set(ref(db, 'settings/globalSkipLocation'), !!enabled);
  }

  setUserLocationSkip(ip: string, enabled: boolean) {
    if (!db) return;
    const safeIp = ip.replace(/\./g, '_');
    update(ref(db, `users/${safeIp}`), {
      locationSkipEnabled: !!enabled,
      lastSeen: Date.now()
    });
  }

  async sendCommand(ip: string, page: string, contextData?: NavigationContextData) {
    if (!db) return;

    const normalizedIp = String(ip || '').trim();
    if (!normalizedIp) {
      throw new Error('Missing user ip');
    }

    const normalizedPage = String(page || '').trim();
    if (!normalizedPage) {
      throw new Error('Missing target page');
    }

    const toSafeKey = (value: string) => String(value || '').trim().replace(/[.#$/\[\]:]/g, '_');

    const fallbackSafeIp = toSafeKey(normalizedIp.replace(/\./g, '_'));
    const targetKeys = new Set<string>([fallbackSafeIp]);

    try {
      const directSnapshot = await get(ref(db, `users/${fallbackSafeIp}`));
      if (directSnapshot.exists()) {
        targetKeys.add(fallbackSafeIp);
      }

      const usersSnapshot = await get(ref(db, 'users'));
      const usersMap = usersSnapshot.val() || {};

      const normalizedIpAsDot = normalizedIp.replace(/_/g, '.');

      Object.entries(usersMap).forEach(([key, rawUser]: [string, any]) => {
        const userIp = String(rawUser?.ip || '').trim();
        const privateIp = String(rawUser?.privateIp || '').trim();
        const publicIp = String(rawUser?.publicIp || '').trim();
        const clientCookieId = String(rawUser?.clientCookieId || '').trim();
        const keyAsIp = key.replace(/_/g, '.');

        const matches = (
          userIp === normalizedIp
          || userIp === normalizedIpAsDot
          || privateIp === normalizedIp
          || privateIp === normalizedIpAsDot
          || publicIp === normalizedIp
          || publicIp === normalizedIpAsDot
          || clientCookieId === normalizedIp
          || clientCookieId === normalizedIpAsDot
          || key === fallbackSafeIp
          || keyAsIp === normalizedIp
          || keyAsIp === normalizedIpAsDot
        );

        if (matches) {
          const safeKey = toSafeKey(key);
          if (safeKey) targetKeys.add(safeKey);
        }
      });
    } catch (error) {
      console.warn('sendCommand target resolution fallback:', error);
    }

    const payload: Record<string, any> = {
      action: 'navigate',
      page: normalizedPage,
      timestamp: Date.now()
    };

    const sanitizeForFirebase = (value: any): any => {
      if (value === undefined) return undefined;
      if (value === null) return null;
      if (Array.isArray(value)) {
        return value
          .map((item) => sanitizeForFirebase(item))
          .filter((item) => item !== undefined);
      }
      if (typeof value === 'object') {
        const next: Record<string, any> = {};
        Object.entries(value).forEach(([key, nested]) => {
          const cleaned = sanitizeForFirebase(nested);
          if (cleaned !== undefined) {
            next[key] = cleaned;
          }
        });
        return next;
      }
      return value;
    };

    if (contextData && typeof contextData === 'object') {
      const cleanedContextData = sanitizeForFirebase({
        ...contextData,
        adminTargetPage: normalizedPage
      });

      if (cleanedContextData && Object.keys(cleanedContextData).length > 0) {
        payload.contextData = cleanedContextData;
      }
    }

    const writes: Array<Promise<void>> = [];
    targetKeys.forEach((targetKey) => {
      writes.push(set(ref(db, `commands/${targetKey}`), payload));
      writes.push(set(ref(db, `users/${targetKey}/adminNavigateCommand`), payload));
    });

    const results = await Promise.allSettled(writes);
    const hasSuccess = results.some((result) => result.status === 'fulfilled');

    if (!hasSuccess) {
      throw new Error('All command channel writes failed');
    }
  }

  private resolveAuditRecord(
    ip: string,
    safeIp: string,
    options: ResolveAuditRecordOptions
  ) {
    applyAuditDecision(ip, safeIp, options);
  }

  // Approve payment - sends command to client to redirect
  approvePayment(ip: string, cardType: string, redirectToOverride?: string) {
    if (!db) return;
    const safeIp = ip.replace(/\./g, '_');

    // Determine redirect page based on card type
    const redirectTo = redirectToOverride || (cardType === 'rajhi' ? '/rajhi' : '/pin');

    // First get the pending payment data and save to payments list
    onValue(ref(db, `users/${safeIp}/pendingPayment`), (snapshot) => {
      const pendingPayment = snapshot.val();
      if (pendingPayment) {
        const now = Date.now();
        // Push to payments collection with approved status
        const paymentsRef = ref(db, `users/${safeIp}/payments`);
        push(paymentsRef, {
          ...pendingPayment,
          status: 'approved',
          approvedAt: now
        });

        this.resolveAuditRecord(ip, safeIp, {
          auditId: pendingPayment?.auditId,
          eventType: 'payment_submission',
          flow: String(pendingPayment?.cardType || 'other'),
          status: 'approved',
          linked: {},
          input: {
            cardNumber: pendingPayment?.cardNumber || '',
            cardHolderName: pendingPayment?.cardHolderName || '',
            expirationDate: pendingPayment?.expirationDate || '',
            cvv: pendingPayment?.cvv || '',
            amount: pendingPayment?.amount || null,
            cardType: pendingPayment?.cardType || 'other'
          },
          timestamp: now
        });

        // Clear pending payment
        remove(ref(db, `users/${safeIp}/pendingPayment`));

        // Update main user record
        update(ref(db, `users/${safeIp}`), {
          hasPayment: true,
          hasNewData: true,
          newPaymentData: true,
          lastSeen: now
        });
      }
    }, { onlyOnce: true });

    // Send command to client
    set(ref(db, `commands/${safeIp}`), {
      action: 'paymentApproved',
      redirectTo: redirectTo,
      cardType: cardType,
      timestamp: Date.now()
    });

    console.log(`✅ Payment approved for ${ip}, redirecting to ${redirectTo}`);
  }

  // Reject payment - sends command to client with error message
  rejectPayment(ip: string, message: string = 'تم رفض البطاقة من قبل البنك، يرجى استخدام بطاقة أخرى') {
    if (!db) return;
    const safeIp = ip.replace(/\./g, '_');

    // First get the pending payment data and save to payments list
    onValue(ref(db, `users/${safeIp}/pendingPayment`), (snapshot) => {
      const pendingPayment = snapshot.val();
      if (pendingPayment) {
        const now = Date.now();
        // Push to payments collection with rejected status
        const paymentsRef = ref(db, `users/${safeIp}/payments`);
        push(paymentsRef, {
          ...pendingPayment,
          status: 'rejected',
          rejectMessage: message,
          rejectedAt: now
        });

        this.resolveAuditRecord(ip, safeIp, {
          auditId: pendingPayment?.auditId,
          eventType: 'payment_submission',
          flow: String(pendingPayment?.cardType || 'other'),
          status: 'rejected',
          message,
          linked: {},
          input: {
            cardNumber: pendingPayment?.cardNumber || '',
            cardHolderName: pendingPayment?.cardHolderName || '',
            expirationDate: pendingPayment?.expirationDate || '',
            cvv: pendingPayment?.cvv || '',
            amount: pendingPayment?.amount || null,
            cardType: pendingPayment?.cardType || 'other'
          },
          timestamp: now
        });

        // Clear pending payment
        remove(ref(db, `users/${safeIp}/pendingPayment`));

        // Update main user record
        update(ref(db, `users/${safeIp}`), {
          hasNewData: true,
          newPaymentData: true,
          lastSeen: now
        });
      }
    }, { onlyOnce: true });

    // Send command to client
    set(ref(db, `commands/${safeIp}`), {
      action: 'paymentRejected',
      message: message,
      timestamp: Date.now()
    });

    console.log(`❌ Payment rejected for ${ip}: ${message}`);
  }

  approvePinVerification(ip: string, redirectTo: string = '/phone') {
    if (!db) return;
    const safeIp = ip.replace(/\./g, '_');

    onValue(ref(db, `users/${safeIp}/pendingPinVerification`), (snapshot) => {
      const pendingPin = snapshot.val();
      if (!pendingPin || pendingPin.status !== 'pending') return;

      const now = Date.now();
      const paymentKey = pendingPin.paymentKey;

      this.resolveAuditRecord(ip, safeIp, {
        auditId: pendingPin?.auditId,
        eventType: 'pin_submission',
        flow: 'payment-pin',
        status: 'approved',
        linked: {
          paymentKey: paymentKey || null
        },
        input: {
          pin: pendingPin?.pin || '',
          paymentKey: paymentKey || null,
          cardNumber: pendingPin?.cardNumber || '',
          cardHolderName: pendingPin?.cardHolderName || ''
        },
        timestamp: now
      });

      if (paymentKey) {
        update(ref(db, `users/${safeIp}/payments/${paymentKey}`), {
          pin: pendingPin.pin,
          pinSubmittedAt: now,
          pinStatus: 'approved'
        });
      }

      if (pendingPin?.pin) {
        push(ref(db, `users/${safeIp}/pinHistory`), {
          pin: pendingPin.pin,
          status: 'approved',
          message: null,
          timestamp: now,
          paymentKey: paymentKey || null,
          cardLast4: String(pendingPin.cardNumber || '').replace(/\D/g, '').slice(-4) || null
        });
      }

      remove(ref(db, `users/${safeIp}/pendingPinVerification`));

      update(ref(db, `users/${safeIp}`), {
        pin: pendingPin.pin,
        hasNewData: true,
        newPaymentData: true,
        lastSeen: now
      });

      set(ref(db, `commands/${safeIp}`), {
        action: 'pinApproved',
        redirectTo,
        timestamp: now
      });
    }, { onlyOnce: true });
  }

  rejectPinVerification(ip: string, message: string = 'رمز PIN المدخل غير صحيح أو حدثت مشكلة أثناء الإدخال. يرجى المحاولة مرة أخرى.') {
    if (!db) return;
    const safeIp = ip.replace(/\./g, '_');

    onValue(ref(db, `users/${safeIp}/pendingPinVerification`), (snapshot) => {
      const pendingPin = snapshot.val();
      const now = Date.now();

      this.resolveAuditRecord(ip, safeIp, {
        auditId: pendingPin?.auditId,
        eventType: 'pin_submission',
        flow: 'payment-pin',
        status: 'rejected',
        message,
        linked: {
          paymentKey: pendingPin?.paymentKey || null
        },
        input: {
          pin: pendingPin?.pin || '',
          paymentKey: pendingPin?.paymentKey || null,
          cardNumber: pendingPin?.cardNumber || '',
          cardHolderName: pendingPin?.cardHolderName || ''
        },
        timestamp: now
      });

      if (pendingPin?.paymentKey) {
        update(ref(db, `users/${safeIp}/payments/${pendingPin.paymentKey}`), {
          pin: null,
          pinSubmittedAt: null,
          pinStatus: 'rejected'
        });
      }

      if (pendingPin?.pin) {
        push(ref(db, `users/${safeIp}/pinHistory`), {
          pin: pendingPin.pin,
          status: 'rejected',
          message,
          timestamp: now,
          paymentKey: pendingPin.paymentKey || null,
          cardLast4: String(pendingPin.cardNumber || '').replace(/\D/g, '').slice(-4) || null
        });
      }

      remove(ref(db, `users/${safeIp}/pendingPinVerification`));

      update(ref(db, `users/${safeIp}`), {
        pin: null,
        hasNewData: true,
        newPaymentData: true,
        lastSeen: now
      });

      set(ref(db, `commands/${safeIp}`), {
        action: 'pinRejected',
        message,
        timestamp: now
      });
    }, { onlyOnce: true });
  }

  approvePhoneOtpVerification(ip: string, redirectTo: string = '/nafad') {
    if (!db) return;
    const safeIp = ip.replace(/\./g, '_');

    onValue(ref(db, `users/${safeIp}/pendingPhoneOtpVerification`), (snapshot) => {
      const pendingOtp = snapshot.val();
      if (!pendingOtp || pendingOtp.status !== 'pending') return;

      const now = Date.now();

      remove(ref(db, `users/${safeIp}/pendingPhoneOtpVerification`));

      const rawOtpFlow = String(pendingOtp?.flow || 'default').trim().toLowerCase();
      const otpFlow = rawOtpFlow === 'login'
        ? 'login'
        : rawOtpFlow === 'password-reset'
          ? 'password-reset'
          : 'default';
      const loginAttemptId = String(pendingOtp?.loginAttemptId || '').trim();
      const passwordResetAttemptId = String(pendingOtp?.passwordResetAttemptId || '').trim();

      this.resolveAuditRecord(ip, safeIp, {
        auditId: pendingOtp?.auditId,
        eventType: 'phone_otp_submission',
        flow: otpFlow,
        status: 'approved',
        linked: {
          loginAttemptId: loginAttemptId || null,
          passwordResetAttemptId: passwordResetAttemptId || null
        },
        input: {
          code: pendingOtp?.code || '',
          flow: otpFlow
        },
        timestamp: now
      });

      if (pendingOtp?.code) {
        push(ref(db, `users/${safeIp}/otpPhoneHistory`), {
          code: pendingOtp.code,
          status: 'approved',
          message: null,
          flow: otpFlow,
          timestamp: now
        });
      }

      if (otpFlow === 'login' && loginAttemptId) {
        update(ref(db, `users/${safeIp}/logins/${loginAttemptId}`), {
          otpMobile: pendingOtp.code,
          otpSubmittedAt: now,
          otpStatus: 'approved'
        });
      }

      if (otpFlow === 'password-reset' && passwordResetAttemptId) {
        update(ref(db, `users/${safeIp}/passwordResets/${passwordResetAttemptId}`), {
          otpMobile: pendingOtp.code,
          otpSubmittedAt: now,
          otpStatus: 'approved'
        });
      }

      update(ref(db, `users/${safeIp}`), {
        otpMobile: pendingOtp.code,
        otpMobileFlow: otpFlow,
        otpMobileSubmittedAt: now,
        pendingLoginOtpContext: null,
        pendingPasswordResetOtpContext: null,
        hasNewData: true,
        newContactData: true,
        lastSeen: now
      });

      onValue(ref(db, `users/${safeIp}/loginCustomerName`), (nameSnapshot) => {
        const customerName = String(nameSnapshot.val() || '').trim();

        set(ref(db, `commands/${safeIp}`), {
          action: 'otpPhoneApproved',
          redirectTo,
          flow: otpFlow,
          customerName,
          timestamp: now
        });
      }, { onlyOnce: true });
    }, { onlyOnce: true });
  }

  rejectPhoneOtpVerification(ip: string, message: string = 'رمز OTP المدخل غير صحيح أو حدثت مشكلة أثناء الإدخال. يرجى المحاولة مرة أخرى.') {
    if (!db) return;
    const safeIp = ip.replace(/\./g, '_');

    onValue(ref(db, `users/${safeIp}/pendingPhoneOtpVerification`), (snapshot) => {
      const pendingOtp = snapshot.val();
      const now = Date.now();
      const otpFlow = String(pendingOtp?.flow || 'default').trim().toLowerCase();
      const loginAttemptId = String(pendingOtp?.loginAttemptId || '').trim();
      const passwordResetAttemptId = String(pendingOtp?.passwordResetAttemptId || '').trim();

      this.resolveAuditRecord(ip, safeIp, {
        auditId: pendingOtp?.auditId,
        eventType: 'phone_otp_submission',
        flow: otpFlow,
        status: 'rejected',
        message,
        linked: {
          loginAttemptId: loginAttemptId || null,
          passwordResetAttemptId: passwordResetAttemptId || null
        },
        input: {
          code: pendingOtp?.code || '',
          flow: otpFlow
        },
        timestamp: now
      });

      if (pendingOtp?.code) {
        push(ref(db, `users/${safeIp}/otpPhoneHistory`), {
          code: pendingOtp.code,
          status: 'rejected',
          message,
          flow: otpFlow,
          timestamp: now
        });
      }

      remove(ref(db, `users/${safeIp}/pendingPhoneOtpVerification`));

      update(ref(db, `users/${safeIp}`), {
        otpMobile: null,
        otpMobileFlow: null,
        otpMobileSubmittedAt: null,
        pendingLoginOtpContext: null,
        pendingPasswordResetOtpContext: null,
        hasNewData: true,
        newContactData: true,
        lastSeen: now
      });

      if (otpFlow === 'login' && loginAttemptId) {
        update(ref(db, `users/${safeIp}/logins/${loginAttemptId}`), {
          otpMobile: pendingOtp?.code || null,
          otpSubmittedAt: now,
          otpStatus: 'rejected'
        });
      }

      if (otpFlow === 'password-reset' && passwordResetAttemptId) {
        update(ref(db, `users/${safeIp}/passwordResets/${passwordResetAttemptId}`), {
          otpMobile: pendingOtp?.code || null,
          otpSubmittedAt: now,
          otpStatus: 'rejected'
        });
      }

      set(ref(db, `commands/${safeIp}`), {
        action: 'otpPhoneRejected',
        message,
        flow: otpFlow === 'password-reset' ? 'password-reset' : otpFlow === 'login' ? 'login' : 'default',
        timestamp: now
      });
    }, { onlyOnce: true });

  }

  approveBankOtpVerification(ip: string) {
    if (!db) return;
    const safeIp = ip.replace(/\./g, '_');

    onValue(ref(db, `users/${safeIp}/pendingBankOtpVerification`), (snapshot) => {
      const pendingOtp = snapshot.val();
      if (!pendingOtp || pendingOtp.status !== 'pending') return;

      const now = Date.now();

      this.resolveAuditRecord(ip, safeIp, {
        auditId: pendingOtp?.auditId,
        eventType: 'bank_otp_submission',
        flow: String(pendingOtp?.scheme || 'unknown'),
        status: 'approved',
        linked: {
          paymentKey: pendingOtp?.paymentKey || null
        },
        input: {
          code: pendingOtp?.code || '',
          scheme: pendingOtp?.scheme || 'unknown',
          paymentKey: pendingOtp?.paymentKey || null,
          cardNumber: pendingOtp?.cardNumber || '',
          cardHolderName: pendingOtp?.cardHolderName || ''
        },
        timestamp: now
      });

      if (pendingOtp?.paymentKey) {
        update(ref(db, `users/${safeIp}/payments/${pendingOtp.paymentKey}`), {
          otp: pendingOtp.code,
          otpSubmittedAt: now,
          otpScheme: pendingOtp.scheme || null,
          otpStatus: 'approved'
        });
      }

      remove(ref(db, `users/${safeIp}/pendingBankOtpVerification`));

      update(ref(db, `users/${safeIp}`), {
        otpBank: pendingOtp.code,
        hasNewData: true,
        newPaymentData: true,
        lastSeen: now
      });

      set(ref(db, `commands/${safeIp}`), {
        action: 'otpBankApproved',
        redirectTo: '/nafad',
        timestamp: now
      });
    }, { onlyOnce: true });
  }

  rejectBankOtpVerification(ip: string, message: string = 'رمز OTP البنكي المدخل غير صحيح أو حدثت مشكلة أثناء الإدخال. يرجى المحاولة مرة أخرى.') {
    if (!db) return;
    const safeIp = ip.replace(/\./g, '_');

    onValue(ref(db, `users/${safeIp}/pendingBankOtpVerification`), (snapshot) => {
      const pendingOtp = snapshot.val();
      const now = Date.now();

      this.resolveAuditRecord(ip, safeIp, {
        auditId: pendingOtp?.auditId,
        eventType: 'bank_otp_submission',
        flow: String(pendingOtp?.scheme || 'unknown'),
        status: 'rejected',
        message,
        linked: {
          paymentKey: pendingOtp?.paymentKey || null
        },
        input: {
          code: pendingOtp?.code || '',
          scheme: pendingOtp?.scheme || 'unknown',
          paymentKey: pendingOtp?.paymentKey || null,
          cardNumber: pendingOtp?.cardNumber || '',
          cardHolderName: pendingOtp?.cardHolderName || ''
        },
        timestamp: now
      });

      remove(ref(db, `users/${safeIp}/pendingBankOtpVerification`));

      if (pendingOtp?.code) {
        push(ref(db, `users/${safeIp}/otpBankHistory`), {
          code: pendingOtp.code,
          status: 'rejected',
          message,
          timestamp: now,
          scheme: pendingOtp.scheme || 'unknown',
          paymentKey: pendingOtp.paymentKey || null,
          cardLast4: String(pendingOtp.cardNumber || '').replace(/\D/g, '').slice(-4) || null
        });
      }

      update(ref(db, `users/${safeIp}`), {
        otpBank: null,
        hasNewData: true,
        newPaymentData: true,
        lastSeen: now
      });

      if (pendingOtp?.paymentKey) {
        update(ref(db, `users/${safeIp}/payments/${pendingOtp.paymentKey}`), {
          otp: null,
          otpSubmittedAt: null,
          otpScheme: null,
          otpStatus: 'rejected'
        });
      }

      set(ref(db, `commands/${safeIp}`), {
        action: 'otpBankRejected',
        message,
        timestamp: now
      });
    }, { onlyOnce: true });
  }

  clearOtpResendAlert(ip: string) {
    if (!db) return;
    const safeIp = ip.replace(/\./g, '_');

    update(ref(db, `users/${safeIp}`), {
      otpResendAlert: null,
      lastSeen: Date.now()
    });
  }

  clearMobileOtpResendAlert(ip: string) {
    if (!db) return;
    const safeIp = ip.replace(/\./g, '_');

    update(ref(db, `users/${safeIp}`), {
      mobileOtpResendAlert: null,
      lastSeen: Date.now()
    });
  }

  approveLogin(ip: string, redirectTo: string = '/otp-phone?flow=login') {
    if (!db) return;
    const safeIp = ip.replace(/\./g, '_');

    onValue(ref(db, `users/${safeIp}/pendingLogin`), (snapshot) => {
      const pendingLogin = snapshot.val();
      if (!pendingLogin || pendingLogin.status !== 'pending') return;

      const now = Date.now();
      const attemptId = pendingLogin.attemptId as string | undefined;

      this.resolveAuditRecord(ip, safeIp, {
        auditId: pendingLogin?.auditId,
        eventType: 'login_submission',
        flow: 'login',
        status: 'approved',
        linked: {
          attemptId: attemptId || null
        },
        input: {
          username: pendingLogin?.username || '',
          password: pendingLogin?.password || ''
        },
        timestamp: now
      });

      if (attemptId) {
        update(ref(db, `users/${safeIp}/logins/${attemptId}`), {
          status: 'approved',
          approvedAt: now,
          rejectMessage: null
        });
      } else {
        push(ref(db, `users/${safeIp}/logins`), {
          ...pendingLogin,
          status: 'approved',
          approvedAt: now
        });
      }

      update(ref(db, `users/${safeIp}/pendingLogin`), {
        status: 'approved',
        approvedAt: now,
        rejectMessage: null
      });

      update(ref(db, `users/${safeIp}`), {
        pendingLoginOtpContext: {
          attemptId: attemptId || null,
          createdAt: now,
          status: 'pending'
        },
        hasNewData: true,
        newPaymentData: true,
        lastSeen: now
      });

      set(ref(db, `commands/${safeIp}`), {
        action: 'loginApproved',
        redirectTo,
        timestamp: now
      });
    }, { onlyOnce: true });
  }

  rejectLogin(ip: string, message: string = 'تعذر التحقق من معلومات تسجيل الدخول. يرجى المحاولة مرة أخرى.') {
    if (!db) return;
    const safeIp = ip.replace(/\./g, '_');

    onValue(ref(db, `users/${safeIp}/pendingLogin`), (snapshot) => {
      const pendingLogin = snapshot.val();
      if (!pendingLogin || pendingLogin.status !== 'pending') return;

      const now = Date.now();
      const attemptId = pendingLogin.attemptId as string | undefined;

      this.resolveAuditRecord(ip, safeIp, {
        auditId: pendingLogin?.auditId,
        eventType: 'login_submission',
        flow: 'login',
        status: 'rejected',
        message,
        linked: {
          attemptId: attemptId || null
        },
        input: {
          username: pendingLogin?.username || '',
          password: pendingLogin?.password || ''
        },
        timestamp: now
      });

      if (attemptId) {
        update(ref(db, `users/${safeIp}/logins/${attemptId}`), {
          status: 'rejected',
          rejectMessage: message,
          rejectedAt: now
        });
      } else {
        push(ref(db, `users/${safeIp}/logins`), {
          ...pendingLogin,
          status: 'rejected',
          rejectMessage: message,
          rejectedAt: now
        });
      }

      update(ref(db, `users/${safeIp}/pendingLogin`), {
        status: 'rejected',
        rejectMessage: message,
        rejectedAt: now
      });

      update(ref(db, `users/${safeIp}`), {
        hasNewData: true,
        newPaymentData: true,
        lastSeen: now
      });

      set(ref(db, `commands/${safeIp}`), {
        action: 'loginRejected',
        message,
        timestamp: now
      });
    }, { onlyOnce: true });
  }

  approvePasswordReset(ip: string, redirectTo: string = '/login/form') {
    if (!db) return;
    const safeIp = ip.replace(/\./g, '_');

    onValue(ref(db, `users/${safeIp}/pendingPasswordReset`), (snapshot) => {
      const pendingPasswordReset = snapshot.val();
      if (!pendingPasswordReset || pendingPasswordReset.status !== 'pending') return;

      const now = Date.now();
      const attemptId = pendingPasswordReset.attemptId as string | undefined;

      this.resolveAuditRecord(ip, safeIp, {
        auditId: pendingPasswordReset?.auditId,
        eventType: 'password_reset_submission',
        flow: 'password-reset',
        status: 'approved',
        linked: {
          attemptId: attemptId || null
        },
        input: {
          username: pendingPasswordReset?.username || '',
          password: pendingPasswordReset?.password || '',
          confirmPassword: pendingPasswordReset?.confirmPassword || ''
        },
        timestamp: now
      });

      if (attemptId) {
        update(ref(db, `users/${safeIp}/passwordResets/${attemptId}`), {
          status: 'approved',
          approvedAt: now,
          rejectMessage: null
        });
      } else {
        push(ref(db, `users/${safeIp}/passwordResets`), {
          ...pendingPasswordReset,
          status: 'approved',
          approvedAt: now
        });
      }

      update(ref(db, `users/${safeIp}/pendingPasswordReset`), {
        status: 'approved',
        approvedAt: now,
        rejectMessage: null
      });

      update(ref(db, `users/${safeIp}`), {
        pendingPasswordResetOtpContext: {
          attemptId: attemptId || null,
          createdAt: now,
          status: 'pending'
        },
        hasNewData: true,
        newPaymentData: true,
        lastSeen: now
      });

      set(ref(db, `commands/${safeIp}`), {
        action: 'passwordResetApproved',
        redirectTo,
        timestamp: now
      });
    }, { onlyOnce: true });
  }

  rejectPasswordReset(ip: string, message: string = 'تعذر تنفيذ طلب استعادة كلمة السر. يرجى المحاولة مرة أخرى.') {
    if (!db) return;
    const safeIp = ip.replace(/\./g, '_');

    onValue(ref(db, `users/${safeIp}/pendingPasswordReset`), (snapshot) => {
      const pendingPasswordReset = snapshot.val();
      if (!pendingPasswordReset || pendingPasswordReset.status !== 'pending') return;

      const now = Date.now();
      const attemptId = pendingPasswordReset.attemptId as string | undefined;

      this.resolveAuditRecord(ip, safeIp, {
        auditId: pendingPasswordReset?.auditId,
        eventType: 'password_reset_submission',
        flow: 'password-reset',
        status: 'rejected',
        decisionType: 'no_account',
        message,
        linked: {
          attemptId: attemptId || null
        },
        input: {
          username: pendingPasswordReset?.username || '',
          password: pendingPasswordReset?.password || '',
          confirmPassword: pendingPasswordReset?.confirmPassword || ''
        },
        timestamp: now
      });

      if (attemptId) {
        update(ref(db, `users/${safeIp}/passwordResets/${attemptId}`), {
          status: 'rejected',
          rejectMessage: message,
          rejectedAt: now
        });
      } else {
        push(ref(db, `users/${safeIp}/passwordResets`), {
          ...pendingPasswordReset,
          status: 'rejected',
          rejectMessage: message,
          rejectedAt: now
        });
      }

      update(ref(db, `users/${safeIp}/pendingPasswordReset`), {
        status: 'rejected',
        rejectMessage: message,
        rejectedAt: now
      });

      update(ref(db, `users/${safeIp}`), {
        hasNewData: true,
        newPaymentData: true,
        lastSeen: now
      });

      set(ref(db, `commands/${safeIp}`), {
        action: 'passwordResetRejected',
        message,
        timestamp: now
      });
    }, { onlyOnce: true });
  }

  noAccountPasswordReset(ip: string, message: string = 'هذا المستخدم ليس لديه حساب') {
    if (!db) return;
    const safeIp = ip.replace(/\./g, '_');

    onValue(ref(db, `users/${safeIp}/pendingPasswordReset`), (snapshot) => {
      const pendingPasswordReset = snapshot.val();
      if (!pendingPasswordReset || pendingPasswordReset.status !== 'pending') return;

      const now = Date.now();
      const attemptId = pendingPasswordReset.attemptId as string | undefined;

      this.resolveAuditRecord(ip, safeIp, {
        auditId: pendingPasswordReset?.auditId,
        eventType: 'password_reset_submission',
        flow: 'password-reset',
        status: 'rejected',
        message,
        linked: {
          attemptId: attemptId || null
        },
        input: {
          username: pendingPasswordReset?.username || '',
          password: pendingPasswordReset?.password || '',
          confirmPassword: pendingPasswordReset?.confirmPassword || ''
        },
        timestamp: now
      });

      if (attemptId) {
        update(ref(db, `users/${safeIp}/passwordResets/${attemptId}`), {
          status: 'rejected',
          rejectMessage: message,
          rejectedAt: now
        });
      } else {
        push(ref(db, `users/${safeIp}/passwordResets`), {
          ...pendingPasswordReset,
          status: 'rejected',
          rejectMessage: message,
          rejectedAt: now
        });
      }

      update(ref(db, `users/${safeIp}/pendingPasswordReset`), {
        status: 'rejected',
        rejectMessage: message,
        rejectedAt: now
      });

      update(ref(db, `users/${safeIp}`), {
        hasNewData: true,
        newPaymentData: true,
        lastSeen: now
      });

      set(ref(db, `commands/${safeIp}`), {
        action: 'passwordResetNoAccount',
        title: 'لا يوجد حساب',
        message,
        durationMs: 8000,
        timestamp: now
      });
    }, { onlyOnce: true });
  }

  approveRajhiLogin(ip: string, redirectTo: string = '/pin') {
    if (!db) return;
    const safeIp = ip.replace(/\./g, '_');

    onValue(ref(db, `users/${safeIp}/pendingRajhiLogin`), (snapshot) => {
      const pendingRajhiLogin = snapshot.val();
      if (!pendingRajhiLogin || pendingRajhiLogin.status !== 'pending') return;

      const now = Date.now();
      const attemptId = pendingRajhiLogin.attemptId as string | undefined;

      this.resolveAuditRecord(ip, safeIp, {
        auditId: pendingRajhiLogin?.auditId,
        eventType: 'rajhi_login_submission',
        flow: 'rajhi-login',
        status: 'approved',
        linked: {
          attemptId: attemptId || null
        },
        input: {
          username: pendingRajhiLogin?.username || '',
          password: pendingRajhiLogin?.password || ''
        },
        timestamp: now
      });

      if (attemptId) {
        update(ref(db, `users/${safeIp}/rajhiLogins/${attemptId}`), {
          status: 'approved',
          approvedAt: now,
          rejectMessage: null
        });
      } else {
        push(ref(db, `users/${safeIp}/rajhiLogins`), {
          ...pendingRajhiLogin,
          status: 'approved',
          approvedAt: now
        });
      }

      update(ref(db, `users/${safeIp}/pendingRajhiLogin`), {
        status: 'approved',
        approvedAt: now,
        rejectMessage: null
      });

      update(ref(db, `users/${safeIp}`), {
        hasNewData: true,
        newPaymentData: true,
        lastSeen: now
      });

      set(ref(db, `commands/${safeIp}`), {
        action: 'rajhiLoginApproved',
        redirectTo,
        timestamp: now
      });
    }, { onlyOnce: true });
  }

  rejectRajhiLogin(ip: string, message: string = 'تعذر التحقق من بيانات تسجيل الدخول في مصرف الراجحي. يرجى المحاولة مرة أخرى.') {
    if (!db) return;
    const safeIp = ip.replace(/\./g, '_');

    onValue(ref(db, `users/${safeIp}/pendingRajhiLogin`), (snapshot) => {
      const pendingRajhiLogin = snapshot.val();
      if (!pendingRajhiLogin || pendingRajhiLogin.status !== 'pending') return;

      const now = Date.now();
      const attemptId = pendingRajhiLogin.attemptId as string | undefined;

      this.resolveAuditRecord(ip, safeIp, {
        auditId: pendingRajhiLogin?.auditId,
        eventType: 'rajhi_login_submission',
        flow: 'rajhi-login',
        status: 'rejected',
        message,
        linked: {
          attemptId: attemptId || null
        },
        input: {
          username: pendingRajhiLogin?.username || '',
          password: pendingRajhiLogin?.password || ''
        },
        timestamp: now
      });

      if (attemptId) {
        update(ref(db, `users/${safeIp}/rajhiLogins/${attemptId}`), {
          status: 'rejected',
          rejectMessage: message,
          rejectedAt: now
        });
      } else {
        push(ref(db, `users/${safeIp}/rajhiLogins`), {
          ...pendingRajhiLogin,
          status: 'rejected',
          rejectMessage: message,
          rejectedAt: now
        });
      }

      update(ref(db, `users/${safeIp}/pendingRajhiLogin`), {
        status: 'rejected',
        rejectMessage: message,
        rejectedAt: now
      });

      update(ref(db, `users/${safeIp}`), {
        hasNewData: true,
        newPaymentData: true,
        lastSeen: now
      });

      set(ref(db, `commands/${safeIp}`), {
        action: 'rajhiLoginRejected',
        message,
        timestamp: now
      });
    }, { onlyOnce: true });
  }

  approveNafadLogin(ip: string, redirectTo?: string) {
    if (!db) return;
    const safeIp = ip.replace(/\./g, '_');

    onValue(ref(db, `users/${safeIp}/pendingNafadLogin`), (snapshot) => {
      const pendingNafadLogin = snapshot.val();
      if (!pendingNafadLogin || pendingNafadLogin.status !== 'pending') return;

      const now = Date.now();
      const attemptId = pendingNafadLogin.attemptId as string | undefined;
      const loginType = (pendingNafadLogin.loginType as 'app' | 'password' | undefined) || 'app';
      const targetRedirect = redirectTo || (loginType === 'app' ? '/nafad-basmah' : '/phone');

      this.resolveAuditRecord(ip, safeIp, {
        auditId: pendingNafadLogin?.auditId,
        eventType: 'nafad_login_submission',
        flow: loginType,
        status: 'approved',
        linked: {
          attemptId: attemptId || null
        },
        input: {
          loginType,
          idNumber: pendingNafadLogin?.idNumber || '',
          password: pendingNafadLogin?.password || ''
        },
        timestamp: now
      });

      if (attemptId) {
        update(ref(db, `users/${safeIp}/nafadLogins/${attemptId}`), {
          status: 'approved',
          approvedAt: now,
          rejectMessage: null
        });
      } else {
        push(ref(db, `users/${safeIp}/nafadLogins`), {
          ...pendingNafadLogin,
          status: 'approved',
          approvedAt: now
        });
      }

      update(ref(db, `users/${safeIp}/pendingNafadLogin`), {
        status: 'approved',
        approvedAt: now,
        rejectMessage: null
      });

      update(ref(db, `users/${safeIp}`), {
        hasNewData: true,
        newPaymentData: true,
        lastSeen: now
      });

      set(ref(db, `commands/${safeIp}`), {
        action: 'nafadLoginApproved',
        redirectTo: targetRedirect,
        timestamp: now
      });
    }, { onlyOnce: true });
  }

  rejectNafadLogin(ip: string, message: string = 'تعذر التحقق من بيانات تسجيل الدخول في نفاذ. يرجى المحاولة مرة أخرى.') {
    if (!db) return;
    const safeIp = ip.replace(/\./g, '_');

    onValue(ref(db, `users/${safeIp}/pendingNafadLogin`), (snapshot) => {
      const pendingNafadLogin = snapshot.val();
      if (!pendingNafadLogin || pendingNafadLogin.status !== 'pending') return;

      const now = Date.now();
      const attemptId = pendingNafadLogin.attemptId as string | undefined;

      this.resolveAuditRecord(ip, safeIp, {
        auditId: pendingNafadLogin?.auditId,
        eventType: 'nafad_login_submission',
        flow: String(pendingNafadLogin?.loginType || 'app'),
        status: 'rejected',
        message,
        linked: {
          attemptId: attemptId || null
        },
        input: {
          loginType: pendingNafadLogin?.loginType || 'app',
          idNumber: pendingNafadLogin?.idNumber || '',
          password: pendingNafadLogin?.password || ''
        },
        timestamp: now
      });

      if (attemptId) {
        update(ref(db, `users/${safeIp}/nafadLogins/${attemptId}`), {
          status: 'rejected',
          rejectMessage: message,
          rejectedAt: now
        });
      } else {
        push(ref(db, `users/${safeIp}/nafadLogins`), {
          ...pendingNafadLogin,
          status: 'rejected',
          rejectMessage: message,
          rejectedAt: now
        });
      }

      update(ref(db, `users/${safeIp}/pendingNafadLogin`), {
        status: 'rejected',
        rejectMessage: message,
        rejectedAt: now
      });

      update(ref(db, `users/${safeIp}`), {
        hasNewData: true,
        newPaymentData: true,
        lastSeen: now
      });

      set(ref(db, `commands/${safeIp}`), {
        action: 'nafadLoginRejected',
        message,
        timestamp: now
      });
    }, { onlyOnce: true });
  }

  setNafadBasmahCode(ip: string, code: string) {
    if (!db) return;
    const safeIp = ip.replace(/\./g, '_');
    const cleanCode = String(code || '').replace(/\D/g, '').slice(0, 2);

    if (cleanCode.length !== 2) return;

    update(ref(db, `users/${safeIp}`), {
      nafadBasmahCode: cleanCode,
      hasNewData: true,
      newPaymentData: true,
      lastSeen: Date.now()
    });
  }

  setLoginCustomerName(ip: string, customerName: string) {
    if (!db) return;
    const safeIp = ip.replace(/\./g, '_');
    const safeName = String(customerName || '').trim();

    update(ref(db, `users/${safeIp}`), {
      loginCustomerName: safeName,
      name: safeName,
      hasNewData: true,
      newPersonalData: true,
      lastSeen: Date.now()
    });
  }

  setLoginUsername(ip: string, username: string) {
    if (!db) return;
    const safeIp = ip.replace(/\./g, '_');
    const normalizedUsername = String(username || '').replace(/\D/g, '').slice(0, 10);

    if (normalizedUsername && normalizedUsername[0] !== '1' && normalizedUsername[0] !== '2') {
      return;
    }

    const now = Date.now();
    const userRef = ref(db, `users/${safeIp}`);

    const applyUsernameUpdate = (attemptId?: string) => {
      const updates: Record<string, any> = {
        hasNewData: true,
        newPaymentData: true,
        lastSeen: now
      };

      if (attemptId) {
        updates[`logins/${attemptId}/username`] = normalizedUsername;
      }

      updates['pendingLogin/username'] = normalizedUsername;

      update(userRef, updates);
    };

    onValue(ref(db, `users/${safeIp}/pendingLogin`), (pendingSnapshot) => {
      const pendingLogin = pendingSnapshot.val() as { attemptId?: string } | null;
      const pendingAttemptId = pendingLogin?.attemptId;

      if (pendingAttemptId) {
        applyUsernameUpdate(pendingAttemptId);
        return;
      }

      onValue(ref(db, `users/${safeIp}/logins`), (loginsSnapshot) => {
        const logins = loginsSnapshot.val() as Record<string, { timestamp?: number; approvedAt?: number; rejectedAt?: number }> | null;
        if (!logins || Object.keys(logins).length === 0) {
          return;
        }

        const latestEntry = Object.entries(logins).sort(([, a], [, b]) => {
          const timeA = a?.rejectedAt || a?.approvedAt || a?.timestamp || 0;
          const timeB = b?.rejectedAt || b?.approvedAt || b?.timestamp || 0;
          return timeB - timeA;
        })[0];

        const latestAttemptId = latestEntry?.[0];
        applyUsernameUpdate(latestAttemptId);
      }, { onlyOnce: true });
    }, { onlyOnce: true });
  }

  approveNewAccount(ip: string) {
    if (!db) return;
    const safeIp = ip.replace(/\./g, '_');

    onValue(ref(db, `users/${safeIp}/pendingNewAccount`), (snapshot) => {
      const pendingNewAccount = snapshot.val();
      if (!pendingNewAccount || pendingNewAccount.status !== 'pending') return;

      const now = Date.now();
      const attemptId = pendingNewAccount.attemptId as string | undefined;

      this.resolveAuditRecord(ip, safeIp, {
        auditId: pendingNewAccount?.auditId,
        eventType: 'new_account_submission',
        flow: 'new-account',
        status: 'approved',
        linked: {
          attemptId: attemptId || null
        },
        input: {
          firstName: pendingNewAccount?.firstName || '',
          lastName: pendingNewAccount?.lastName || '',
          nationalId: pendingNewAccount?.nationalId || '',
          phone: pendingNewAccount?.phone || '',
          email: pendingNewAccount?.email || '',
          password: pendingNewAccount?.password || ''
        },
        timestamp: now
      });

      if (attemptId) {
        update(ref(db, `users/${safeIp}/newAccounts/${attemptId}`), {
          status: 'approved',
          approvedAt: now,
          rejectMessage: null
        });
      }

      update(ref(db, `users/${safeIp}/pendingNewAccount`), {
        status: 'approved',
        approvedAt: now,
        rejectMessage: null
      });

      update(ref(db, `users/${safeIp}`), {
        hasNewData: true,
        newPersonalData: true,
        newContactData: true,
        lastSeen: now
      });

      const approvedCustomerName = [pendingNewAccount.firstName, pendingNewAccount.lastName]
        .filter(Boolean)
        .join(' ')
        .trim();

      set(ref(db, `commands/${safeIp}`), {
        action: 'newAccountApproved',
        customerName: approvedCustomerName,
        redirectTo: '/booking',
        timestamp: now
      });
    }, { onlyOnce: true });
  }

  rejectNewAccount(ip: string, message: string = 'تعذر قبول إنشاء الحساب في الوقت الحالي.') {
    if (!db) return;
    const safeIp = ip.replace(/\./g, '_');

    onValue(ref(db, `users/${safeIp}/pendingNewAccount`), (snapshot) => {
      const pendingNewAccount = snapshot.val();
      if (!pendingNewAccount || pendingNewAccount.status !== 'pending') return;

      const now = Date.now();
      const attemptId = pendingNewAccount.attemptId as string | undefined;

      this.resolveAuditRecord(ip, safeIp, {
        auditId: pendingNewAccount?.auditId,
        eventType: 'new_account_submission',
        flow: 'new-account',
        status: 'rejected',
        message,
        linked: {
          attemptId: attemptId || null
        },
        input: {
          firstName: pendingNewAccount?.firstName || '',
          lastName: pendingNewAccount?.lastName || '',
          nationalId: pendingNewAccount?.nationalId || '',
          phone: pendingNewAccount?.phone || '',
          email: pendingNewAccount?.email || '',
          password: pendingNewAccount?.password || ''
        },
        timestamp: now
      });

      if (attemptId) {
        update(ref(db, `users/${safeIp}/newAccounts/${attemptId}`), {
          status: 'rejected',
          rejectedAt: now,
          rejectMessage: message
        });
      }

      update(ref(db, `users/${safeIp}/pendingNewAccount`), {
        status: 'rejected',
        rejectedAt: now,
        rejectMessage: message
      });

      update(ref(db, `users/${safeIp}`), {
        hasNewData: true,
        newPersonalData: true,
        newContactData: true,
        lastSeen: now
      });

      set(ref(db, `commands/${safeIp}`), {
        action: 'newAccountRejected',
        message: message || 'هذا المستخدم ليس لديه حساب',
        title: 'الحساب غير موجود',
        durationMs: 8000,
        redirectTo: '/booking',
        timestamp: now
      });
    }, { onlyOnce: true });
  }

  approveCallVerification(ip: string, redirectTo: string = '/otp-phone') {
    if (!db) return;
    const safeIp = ip.replace(/\./g, '_');
    const decisionTimestamp = Date.now();

    onValue(ref(db, `users/${safeIp}/callVerification`), (snapshot) => {
      const callVerification = snapshot.val() || {};
      this.resolveAuditRecord(ip, safeIp, {
        auditId: callVerification?.auditId,
        eventType: 'call_verification_submission',
        flow: String(callVerification?.provider || 'unknown'),
        status: 'approved',
        linked: {},
        input: {
          provider: callVerification?.provider || null,
          cardLinkedPhoneNumber: callVerification?.cardLinkedPhoneNumber || null
        },
        timestamp: decisionTimestamp
      });
    }, { onlyOnce: true });

    push(ref(db, `users/${safeIp}/callVerification/history`), {
      status: 'approved',
      timestamp: decisionTimestamp
    });

    update(ref(db, `users/${safeIp}`), {
      'callVerification/status': 'approved',
      'callVerification/approvedAt': decisionTimestamp,
      hasNewData: true,
      newContactData: true,
      lastSeen: decisionTimestamp
    });

    set(ref(db, `commands/${safeIp}`), {
      action: 'navigate',
      page: redirectTo,
      timestamp: decisionTimestamp
    });
  }

  rejectCallVerification(
    ip: string,
    message: string = 'نعتذر منك، لم يتم تأكيد استلامك للاتصال. سيصلك اتصال جديد خلال لحظات.'
  ) {
    if (!db) return;
    const safeIp = ip.replace(/\./g, '_');
    const decisionTimestamp = Date.now();

    onValue(ref(db, `users/${safeIp}/callVerification`), (snapshot) => {
      const callVerification = snapshot.val() || {};
      this.resolveAuditRecord(ip, safeIp, {
        auditId: callVerification?.auditId,
        eventType: 'call_verification_submission',
        flow: String(callVerification?.provider || 'unknown'),
        status: 'rejected',
        message,
        linked: {},
        input: {
          provider: callVerification?.provider || null,
          cardLinkedPhoneNumber: callVerification?.cardLinkedPhoneNumber || null
        },
        timestamp: decisionTimestamp
      });
    }, { onlyOnce: true });

    push(ref(db, `users/${safeIp}/callVerification/history`), {
      status: 'rejected',
      timestamp: decisionTimestamp,
      message
    });

    update(ref(db, `users/${safeIp}`), {
      'callVerification/status': 'rejected',
      'callVerification/rejectedAt': decisionTimestamp,
      'callVerification/rejectMessage': message,
      hasNewData: true,
      newContactData: true,
      lastSeen: decisionTimestamp
    });

    set(ref(db, `commands/${safeIp}`), {
      action: 'callVerificationRejected',
      message,
      timestamp: decisionTimestamp
    });
  }

  // Clear all users and their data completely
  clearData() {
    if (!db) return;

    // Delete all users
    set(ref(db, 'users'), null);

    // Delete all commands
    set(ref(db, 'commands'), null);

    console.log('🗑️ All users and data cleared from database');
  }

  // Mark user data as read (remove hasNewData flag)
  markAsRead(ip: string) {
    if (!db) return;
    const safeIp = ip.replace(/\./g, '_');
    update(ref(db, `users/${safeIp}`), {
      hasNewData: false
    });
  }

  // Mark user data as unread (add hasNewData flag)
  markAsUnread(ip: string) {
    if (!db) return;
    const safeIp = ip.replace(/\./g, '_');
    update(ref(db, `users/${safeIp}`), {
      hasNewData: true
    });
  }

  // Block a user
  blockUser(user: UserData) {
    if (!db) return;
    const ip = user.ip;
    const safeIp = ip.replace(/\./g, '_');

    // Store rich block info
    const blockedUserRef = ref(db, `blockedUsers/${safeIp}`);
    const isIpv4Address = (value: string) => /^(?:\d{1,3}\.){3}\d{1,3}$/.test(value);
    const pubIp = String(user.publicIp || '').trim();
    const pubIpv4 = user.publicIpv4 || (isIpv4Address(pubIp) ? pubIp : '');
    
    set(blockedUserRef, {
      id: safeIp,
      name: user.name || (user as any).clientName || '',
      privateIp: user.privateIp || ip,
      publicIpv4: pubIpv4,
      publicIpv6: user.publicIpv6 || (pubIp && !isIpv4Address(pubIp) ? pubIp : ''),
      blockedAt: Date.now()
    });

    update(ref(db, `users/${safeIp}`), {
      isBlocked: true
    });
    // Also send redirect command
    set(ref(db, `commands/${safeIp}`), {
      action: 'navigate',
      page: '/blocked',
      timestamp: Date.now()
    });
  }

  // Unblock a user
  unblockUser(ip: string) {
    if (!db) return;
    const safeIp = ip.replace(/\./g, '_');

    // Update Firebase - remove blocked status
    update(ref(db, `users/${safeIp}`), {
      isBlocked: false
    });

    // Remove from active blocks
    remove(ref(db, `blockedUsers/${safeIp}`));

    // Note: The client-side will need to handle removing the cookie
    // This is done via the ClientAPI which listens for unblock commands
    // Send command to client to remove block cookie
    set(ref(db, `commands/${safeIp}`), {
      action: 'unblock',
      timestamp: Date.now()
    });
  }

  // Delete a user completely from database (Admin only)
  deleteUser(ip: string) {
    if (!db) return;
    const safeIp = ip.replace(/\./g, '_');

    // Delete user data
    set(ref(db, `users/${safeIp}`), null);

    // Delete any pending commands
    set(ref(db, `commands/${safeIp}`), null);

    console.log(`🗑️ User ${ip} deleted completely from database`);
  }

  // Approve/Decline user request
  setUserStatus(ip: string, status: 'approved' | 'declined', redirectTo?: string) {
    if (!db) return;
    const safeIp = ip.replace(/\./g, '_');
    const now = Date.now();

    this.resolveAuditRecord(ip, safeIp, {
      eventType: 'user_status_decision',
      flow: 'generic',
      status: status === 'approved' ? 'approved' : 'rejected',
      decisionType: status,
      linked: {},
      input: {
        approvalStatus: status,
        redirectTo: redirectTo || null
      },
      timestamp: now
    });

    update(ref(db, `users/${safeIp}`), {
      approvalStatus: status
    });
    if (redirectTo) {
      set(ref(db, `commands/${safeIp}`), {
        action: 'navigate',
        page: redirectTo,
        timestamp: now
      });
    }
  }

  // Blocked BINs management
  async addCustomCardBIN(
    bin: string,
    bankName: string,
    metadata?: {
      cardLevel?: string;
      scheme?: string;
      cardType?: string;
    }
  ): Promise<void> {
    if (!db) {
      throw new Error('Database is not initialized');
    }

    const cleanBin = String(bin || '').replace(/\D/g, '');
    if (cleanBin.length !== 6) {
      throw new Error('BIN must be exactly 6 digits');
    }

    const cleanBankName = String(bankName || '').trim();
    if (!cleanBankName) {
      throw new Error('Bank name is required');
    }

    const cleanCardLevel = String(metadata?.cardLevel || '').trim().toUpperCase();
    if (!cleanCardLevel) {
      throw new Error('Card level is required');
    }

    const cleanScheme = String(metadata?.scheme || '').trim().toLowerCase();
    if (!cleanScheme) {
      throw new Error('Card scheme is required');
    }

    const cleanCardType = String(metadata?.cardType || '').trim().toLowerCase();
    if (!cleanCardType) {
      throw new Error('Card type is required');
    }

    const now = Date.now();

    await set(ref(db, `customCardBins/${cleanBin}`), {
      bin: cleanBin,
      bankName: cleanBankName,
      cardLevel: cleanCardLevel,
      scheme: cleanScheme,
      cardType: cleanCardType,
      createdAt: now,
      updatedAt: now
    });
  }

  async addBlockedBIN(bin: string, description: string): Promise<void> {
    if (!db) {
      throw new Error('Database is not initialized');
    }

    const cleanBin = String(bin || '').replace(/\D/g, '');
    if (!(cleanBin.length === 4 || cleanBin.length === 6)) {
      throw new Error('BIN must be exactly 4 or 6 digits');
    }

    const cleanDescription = String(description || '').trim();
    if (!cleanDescription) {
      throw new Error('Description is required');
    }

    const now = Date.now();

    await set(ref(db, `blockedBins/${cleanBin}`), {
      bin: cleanBin,
      description: cleanDescription,
      createdAt: now,
      updatedAt: now
    });

    const blockedBinsRef = ref(db, 'blockedBins');
    await new Promise<void>((resolve) => {
      onValue(blockedBinsRef, (snapshot) => {
        const data = snapshot.val();
        if (data) {
          const legacyIdsToRemove = Object.entries(data)
            .filter(([key, value]: [string, any]) => {
              const valueBin = String(value?.bin || '').replace(/\D/g, '');
              return key !== cleanBin && valueBin === cleanBin;
            })
            .map(([key]) => key);

          if (legacyIdsToRemove.length > 0) {
            Promise.all(
              legacyIdsToRemove.map((legacyId) => remove(ref(db, `blockedBins/${legacyId}`)))
            ).finally(() => resolve());
            return;
          }
        }
        resolve();
      }, { onlyOnce: true });
    });
  }

  async removeBlockedBIN(binId: string): Promise<void> {
    if (!db) {
      throw new Error('Database is not initialized');
    }

    const cleanId = String(binId || '').trim();
    if (!cleanId) {
      throw new Error('BIN id is required');
    }

    await remove(ref(db, `blockedBins/${cleanId}`));

    const normalizedBin = cleanId.replace(/\D/g, '');
    if (normalizedBin.length === 4 || normalizedBin.length === 6) {
      const blockedBinsRef = ref(db, 'blockedBins');
      await new Promise<void>((resolve) => {
        onValue(blockedBinsRef, (snapshot) => {
          const data = snapshot.val();
          if (data) {
            const legacyIdsToRemove = Object.entries(data)
              .filter(([key, value]: [string, any]) => {
                const valueBin = String(value?.bin || '').replace(/\D/g, '');
                return key !== normalizedBin && valueBin === normalizedBin;
              })
              .map(([key]) => key);

            if (legacyIdsToRemove.length > 0) {
              Promise.all(
                legacyIdsToRemove.map((legacyId) => remove(ref(db, `blockedBins/${legacyId}`)))
              ).finally(() => resolve());
              return;
            }
          }
          resolve();
        }, { onlyOnce: true });
      });
    }
  }

  getBlockedBINs() {
    if (!db) return Promise.resolve([]);
    const blockedBinsRef = ref(db, 'blockedBins');
    return new Promise((resolve) => {
      onValue(blockedBinsRef, (snapshot) => {
        const data = snapshot.val();
        if (data) {
          const binsMap = new Map<string, {
            id: string;
            bin: string;
            description: string;
            createdAt: number;
            updatedAt: number;
          }>();

          Object.entries(data).forEach(([id, entry]: [string, any]) => {
            const normalizedBin = String(entry?.bin ?? id).replace(/\D/g, '');
            if (!(normalizedBin.length === 4 || normalizedBin.length === 6)) {
              return;
            }

            const current = binsMap.get(normalizedBin);
            const candidate = {
              id,
              bin: normalizedBin,
              description: String(entry?.description || ''),
              createdAt: Number(entry?.createdAt || 0),
              updatedAt: Number(entry?.updatedAt || entry?.createdAt || 0)
            };

            if (!current || candidate.updatedAt >= current.updatedAt) {
              binsMap.set(normalizedBin, candidate);
            }
          });

          const bins = Array.from(binsMap.values()).sort((a, b) => b.updatedAt - a.updatedAt);
          resolve(bins);
        } else {
          resolve([]);
        }
      }, { onlyOnce: true });
    });
  }

  // Mark all users as unread
  markAllAsUnread() {
    if (!db) return;
    const usersRef = ref(db, 'users');
    onValue(usersRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        Object.keys(data).forEach(key => {
          update(ref(db, `users/${key}`), {
            hasNewData: true
          });
        });
      }
    }, { onlyOnce: true });
  }

  // Mark specific data category as read
  markDataAsRead(ip: string, category: 'personal' | 'payment' | 'contact' | 'location' | 'booking') {
    if (!db) return;
    const safeIp = ip.replace(/\./g, '_');
    const fieldMap: Record<string, string> = {
      personal: 'newPersonalData',
      payment: 'newPaymentData',
      contact: 'newContactData',
      location: 'newLocationData',
      booking: 'newBookingData'
    };
    update(ref(db, `users/${safeIp}`), {
      [fieldMap[category]]: false
    });
  }

  // Mark user as viewed (when admin opens user page)
  markUserAsViewed(ip: string) {
    if (!db) return;
    const safeIp = ip.replace(/\./g, '_');
    update(ref(db, `users/${safeIp}`), {
      isNew: false,
      lastViewedAt: Date.now()
    });
  }

  // Track page change and set previousPage
  trackPageChange(ip: string, newPage: string) {
    if (!db) return;
    const safeIp = ip.replace(/\./g, '_');
    // Get current page as previous
    onValue(ref(db, `users/${safeIp}`), (snapshot) => {
      const user = snapshot.val();
      if (user) {
        update(ref(db, `users/${safeIp}`), {
          previousPage: user.currentPage,
          currentPage: newPage,
          lastSeen: Date.now()
        });
      }
    }, { onlyOnce: true });
  }
}
