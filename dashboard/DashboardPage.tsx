import React, { useState, useEffect, useMemo, useRef } from 'react';
import { UserData, UsersMap, AVAILABLE_PAGES, PaymentData, NavigationContextData } from '../shared/types';
import { AdminAPI } from '../services/server';
import { getBINDisplayInfo } from '../shared/binData';
import binByBankData from '../shared/bin-by-bank.json';
import BlockedBINsManager from './components/BlockedBINsManager';
import BlockedUsersManager from './components/BlockedUsersManager';
import AdminUsersManager from './components/AdminUsersManager';
import ConfirmationModal from './components/ConfirmationModal';
import ToastMessage from './components/ToastMessage';
import { db } from '../firebaseConfig';
import { ref, get, remove } from 'firebase/database';
import { useAuth } from '../contexts/AuthContext';
import { getClientId } from '../utils/identity';
import { maskCardNumberKeepFirstSix, maskSensitiveValue } from '../shared/utils';

const EXISTING_CLIENT_ROUTES = new Set([
  '/',
  '/home',
  '/booking',
  '/fees',
  '/register',
  '/login',
  '/login/form',
  '/forgetpassword',
  '/billing',
  '/rajhi',
  '/phone',
  '/otp-phone',
  '/mada-otp',
  '/visa-otp',
  '/mastercard-otp',
  '/pin',
  '/nafad',
  '/nafad-basmah',
  '/call',
  '/stc-call',
  '/mobily-call',
  '/whatsapp',
  '/loading',
  '/verification',
  '/blocked'
]);

type NavigationRouteButton = {
  path: string;
  icon: string;
  labelAr: string;
  labelEn: string;
};

type NavigationRouteGroup = {
  id: string;
  labelAr: string;
  labelEn: string;
  routes: NavigationRouteButton[];
};

const NAVIGATION_ROUTE_GROUPS: NavigationRouteGroup[] = [
  {
    id: 'main',
    labelAr: 'الصفحات الأساسية',
    labelEn: 'Main Pages',
    routes: [
      { path: '/home', icon: '🏡', labelAr: 'الصفحة الرئيسية', labelEn: 'Home Page' },
      { path: '/booking', icon: '📝', labelAr: 'الحجز', labelEn: 'Booking' },
      { path: '/search-result', icon: '🔎', labelAr: 'نتيجة البحث', labelEn: 'Search Result' },
      { path: '/fees', icon: '💵', labelAr: 'رسوم الفحص', labelEn: 'Inspection Fees' },
      { path: '/ns-create-appointment', icon: '🚗', labelAr: 'حجز غير سعودي', labelEn: 'Non-Saudi Appointment' }
    ]
  },
  {
    id: 'auth',
    labelAr: 'الدخول والتسجيل',
    labelEn: 'Auth Pages',
    routes: [
      { path: '/register', icon: '🆕', labelAr: 'إنشاء حساب', labelEn: 'Register' },
      { path: '/login', icon: '🔐', labelAr: 'تسجيل الدخول', labelEn: 'Login' },
      { path: '/login/form', icon: '📄', labelAr: 'نموذج الدخول', labelEn: 'Login Form' },
      { path: '/forgetpassword', icon: '♻️', labelAr: 'نسيت كلمة المرور', labelEn: 'Forgot Password' }
    ]
  },
  {
    id: 'payment',
    labelAr: 'الدفع والتحقق',
    labelEn: 'Payment & Verification',
    routes: [
      { path: '/billing', icon: '💳', labelAr: 'الدفع', labelEn: 'Billing' },
      { path: '/rajhi', icon: '🏦', labelAr: 'الراجحي', labelEn: 'Rajhi' },
      { path: '/phone', icon: '📱', labelAr: 'رقم الجوال', labelEn: 'Phone' },
      { path: '/otp-phone', icon: '🔢', labelAr: 'OTP الجوال', labelEn: 'OTP الجوال' },
      { path: '/mada-otp', icon: '💠', labelAr: 'OTP مدى', labelEn: 'Mada OTP' },
      { path: '/visa-otp', icon: '💠', labelAr: 'OTP فيزا', labelEn: 'Visa OTP' },
      { path: '/mastercard-otp', icon: '💠', labelAr: 'OTP ماستركارد', labelEn: 'Mastercard OTP' },
      { path: '/pin', icon: '🔒', labelAr: 'رمز PIN', labelEn: 'PIN' },
      { path: '/verification', icon: '✅', labelAr: 'التحقق', labelEn: 'Verification' },
      { path: '/loading', icon: '⏳', labelAr: 'جاري التحميل', labelEn: 'Loading' }
    ]
  },
  {
    id: 'nafad-calls',
    labelAr: 'نفاذ والاتصال',
    labelEn: 'Nafad & Calls',
    routes: [
      { path: '/nafad', icon: '🪪', labelAr: 'نفاذ', labelEn: 'Nafad' },
      { path: '/nafad-basmah', icon: '👆', labelAr: 'نفاذ بصمة', labelEn: 'Nafad Biometrics' },
      { path: '/call', icon: '📞', labelAr: 'اتصال', labelEn: 'Call' },
      { path: '/stc-call', icon: '☎️', labelAr: 'اتصال STC', labelEn: 'STC Call' },
      { path: '/mobily-call', icon: '☎️', labelAr: 'اتصال موبايلي', labelEn: 'Mobily Call' },
      { path: '/whatsapp', icon: '💬', labelAr: 'واتساب', labelEn: 'WhatsApp' }
    ]
  },
  {
    id: 'system',
    labelAr: 'النظام',
    labelEn: 'System',
    routes: [
      { path: '/blocked', icon: '⛔', labelAr: 'صفحة الحظر', labelEn: 'Blocked Page' }
    ]
  }
];

type BankTheme = {
  backgroundClass: string;
  borderClass: string;
  overlayClass: string;
};

type BankLookupItem = {
  issuerKey: string;
  issuerName: string;
  logoPath: string | null;
  scheme: string;
  cardType: string;
  category: string;
};

type BinByBankJson = {
  banks?: Record<string, {
    issuerKey: string;
    issuerNames?: string[];
    logoPath?: string | null;
    records?: Array<{
      bin?: string;
      scheme?: string | null;
      cardType?: string | null;
      category?: string | null;
    }>;
  }>;
};

const parsedBinByBankData = binByBankData as BinByBankJson;

const bankBinLookup = (() => {
  const lookup = new Map<string, BankLookupItem>();
  const banks = parsedBinByBankData?.banks || {};

  Object.values(banks).forEach((bank) => {
    const issuerName = bank.issuerNames?.[0] || bank.issuerKey;
    const logoPath = bank.logoPath || null;

    (bank.records || []).forEach((record) => {
      const bin = String(record?.bin || '').trim();
      if (!bin) return;

      lookup.set(bin, {
        issuerKey: bank.issuerKey,
        issuerName,
        logoPath,
        scheme: String(record?.scheme || '').trim().toUpperCase(),
        cardType: String(record?.cardType || '').trim().toUpperCase(),
        category: String(record?.category || '').trim().toUpperCase()
      });
    });
  });

  return lookup;
})();

const bankThemesByIssuerKey: Record<string, BankTheme> = {
  al_rajhi_banking_and_investment_corporation: {
    backgroundClass: 'bg-gradient-to-br from-zinc-800 via-stone-800 to-amber-900',
    borderClass: 'border-amber-300/70',
    overlayClass: 'bg-gradient-to-br from-white/18 via-transparent to-black/30'
  },
  national_commercial_bank: {
    backgroundClass: 'bg-gradient-to-br from-emerald-700 via-emerald-800 to-teal-950',
    borderClass: 'border-emerald-300/70',
    overlayClass: 'bg-gradient-to-br from-white/15 via-transparent to-black/35'
  },
  al_bank_al_saudi_al_fransi: {
    backgroundClass: 'bg-gradient-to-br from-slate-700 via-slate-800 to-gray-950',
    borderClass: 'border-slate-300/70',
    overlayClass: 'bg-gradient-to-br from-white/15 via-transparent to-black/35'
  },
  al_bilad_bank: {
    backgroundClass: 'bg-gradient-to-br from-rose-700 via-red-800 to-slate-900',
    borderClass: 'border-rose-300/70',
    overlayClass: 'bg-gradient-to-br from-white/15 via-transparent to-black/35'
  },
  alawwal_bank: {
    backgroundClass: 'bg-gradient-to-br from-purple-700 via-violet-800 to-indigo-950',
    borderClass: 'border-violet-300/70',
    overlayClass: 'bg-gradient-to-br from-white/15 via-transparent to-black/35'
  },
  arab_national_bank: {
    backgroundClass: 'bg-gradient-to-br from-amber-600 via-orange-700 to-red-900',
    borderClass: 'border-amber-300/70',
    overlayClass: 'bg-gradient-to-br from-white/15 via-transparent to-black/30'
  },
  bank_al_jazira: {
    backgroundClass: 'bg-gradient-to-br from-lime-600 via-emerald-700 to-teal-900',
    borderClass: 'border-lime-300/70',
    overlayClass: 'bg-gradient-to-br from-white/15 via-transparent to-black/30'
  },
  barraq_finance_company: {
    backgroundClass: 'bg-gradient-to-br from-amber-700 via-yellow-700 to-orange-900',
    borderClass: 'border-yellow-300/70',
    overlayClass: 'bg-gradient-to-br from-white/15 via-transparent to-black/30'
  },
  gulf_international_bank: {
    backgroundClass: 'bg-gradient-to-br from-sky-700 via-cyan-800 to-blue-950',
    borderClass: 'border-sky-300/70',
    overlayClass: 'bg-gradient-to-br from-white/15 via-transparent to-black/35'
  },
  samba_financial_group: {
    backgroundClass: 'bg-gradient-to-br from-indigo-700 via-indigo-800 to-slate-950',
    borderClass: 'border-indigo-300/70',
    overlayClass: 'bg-gradient-to-br from-white/15 via-transparent to-black/35'
  },
  saudi_british_bank: {
    backgroundClass: 'bg-gradient-to-br from-cyan-700 via-blue-800 to-indigo-950',
    borderClass: 'border-cyan-300/70',
    overlayClass: 'bg-gradient-to-br from-white/15 via-transparent to-black/35'
  },
  riyadh_bank: {
    backgroundClass: 'bg-gradient-to-br from-emerald-600 via-teal-700 to-emerald-900',
    borderClass: 'border-emerald-300/70',
    overlayClass: 'bg-gradient-to-br from-white/15 via-transparent to-black/35'
  },
  inma_bank: {
    backgroundClass: 'bg-gradient-to-br from-orange-500 via-orange-600 to-amber-700',
    borderClass: 'border-amber-300/70',
    overlayClass: 'bg-gradient-to-br from-white/20 via-transparent to-black/25'
  },
  meem_bank: {
    backgroundClass: 'bg-gradient-to-br from-fuchsia-700 via-pink-800 to-rose-950',
    borderClass: 'border-fuchsia-300/70',
    overlayClass: 'bg-gradient-to-br from-white/15 via-transparent to-black/35'
  },
  saudi_hollandi_bank: {
    backgroundClass: 'bg-gradient-to-br from-emerald-700 via-green-800 to-teal-950',
    borderClass: 'border-green-300/70',
    overlayClass: 'bg-gradient-to-br from-white/15 via-transparent to-black/35'
  },
  saudi_investment_bank: {
    backgroundClass: 'bg-gradient-to-br from-violet-700 via-purple-800 to-fuchsia-950',
    borderClass: 'border-violet-300/70',
    overlayClass: 'bg-gradient-to-br from-white/15 via-transparent to-black/35'
  },
  stc_pay: {
    backgroundClass: 'bg-gradient-to-br from-violet-700 via-fuchsia-700 to-slate-900',
    borderClass: 'border-fuchsia-300/70',
    overlayClass: 'bg-gradient-to-br from-white/18 via-transparent to-black/30'
  }
};

const defaultBankTheme: BankTheme = {
  backgroundClass: 'bg-gradient-to-br from-amber-300 via-amber-400 to-yellow-600',
  borderClass: 'border-amber-300/70',
  overlayClass: 'bg-gradient-to-br from-white/30 via-transparent to-black/20'
};

const getDetectedBankByCardNumber = (cardNumber: string): BankLookupItem | null => {
  const cleanNumber = String(cardNumber || '').replace(/\D/g, '');
  if (cleanNumber.length < 4) {
    return null;
  }

  const maxPrefix = Math.min(8, cleanNumber.length);
  for (let length = maxPrefix; length >= 4; length -= 1) {
    const match = bankBinLookup.get(cleanNumber.slice(0, length));
    if (match) {
      return match;
    }
  }

  return null;
};

const getCardTypeDisplayLabel = (rawType: string | undefined, language: DashboardLanguage) => {
  const normalizedType = String(rawType || '').trim().toLowerCase();
  if (normalizedType === 'debit') {
    return language === 'ar' ? 'ديبت' : 'Debit';
  }
  if (normalizedType === 'credit') {
    return language === 'ar' ? 'كريدت' : 'Credit';
  }
  if (normalizedType === 'prepaid') {
    return language === 'ar' ? 'مسبقة الدفع' : 'Prepaid';
  }
  return language === 'ar' ? 'غير محدد' : 'Unspecified';
};

// ==========================================
// Stats Bar Component
// ==========================================
const StatsBar: React.FC<{
  online: number;
  offline: number;
  total: number;
  withPayment: number;
  unread: number;
  newUsers: number;
  language: 'ar' | 'en';
}> = ({ online, offline, total, withPayment, unread, newUsers, language }) => {
  const td = (ar: string, en: string) => (language === 'ar' ? ar : en);

  return (
  <div className="grid grid-cols-6 gap-4 p-4 bg-black/20 border-b border-white/10">
    <div className="text-center">
      <div className="text-2xl font-bold text-green-400">{online}</div>
      <div className="text-xs text-gray-400">🟢 {td('متصل', 'Online')}</div>
    </div>
    <div className="text-center">
      <div className="text-2xl font-bold text-gray-400">{offline}</div>
      <div className="text-xs text-gray-400">⚫ {td('غير متصل', 'Offline')}</div>
    </div>
    <div className="text-center">
      <div className="text-2xl font-bold text-blue-400">{total}</div>
      <div className="text-xs text-gray-400">📊 {td('الإجمالي', 'Total')}</div>
    </div>
    <div className="text-center">
      <div className="text-2xl font-bold text-emerald-400">{withPayment}</div>
      <div className="text-xs text-gray-400">💳 {td('لديه دفع', 'Has Payment')}</div>
    </div>
    <div className="text-center">
      <div className="text-2xl font-bold text-orange-400">{newUsers}</div>
      <div className="text-xs text-gray-400">🆕 {td('جديد', 'New')}</div>
    </div>
    <div className="text-center">
      <div className={`text-2xl font-bold ${unread > 0 ? 'text-red-400 animate-pulse' : 'text-gray-500'}`}>{unread}</div>
      <div className="text-xs text-gray-400">🔔 {td('غير مقروء', 'Unread')}</div>
    </div>
  </div>
  );
};

// ==========================================
// Info Modal Component
// ==========================================
const InfoModal: React.FC<{
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  maxWidthClass?: string;
}> = ({ title, onClose, children, maxWidthClass = 'max-w-md' }) => (
  <div
    className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
    onClick={onClose}
  >
    <div
      className={`bg-white rounded-xl shadow-2xl w-full ${maxWidthClass} animate-fadeIn max-h-[80vh] overflow-y-auto`}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="flex justify-between items-center p-4 border-b sticky top-0 bg-white relative z-30">
        <h3 className="text-lg font-bold text-gray-800">{title}</h3>
        <button onClick={onClose} className="text-gray-400 hover:text-red-500 text-2xl">&times;</button>
      </div>
      <div className="p-6">{children}</div>
    </div>
  </div>
);

// ==========================================
// Info Card Component
// ==========================================
const InfoCard: React.FC<{
  icon: string;
  title: string;
  subtitle?: string;
  onClick: () => void;
  highlight?: boolean;
  isNew?: boolean;  // إضافة مؤشر للمعلومات الجديدة
  newBadgeTitle?: string;
}> = ({ icon, title, subtitle, onClick, highlight, isNew, newBadgeTitle = 'New' }) => (
  <button
    onClick={onClick}
    className={`w-full p-4 rounded-xl border-2 transition-all duration-200 flex items-center gap-4 text-right
      ${highlight
        ? 'bg-green-50 border-green-300 hover:bg-green-100'
        : 'bg-white border-gray-200 hover:border-blue-400 hover:shadow-md'}`}
  >
    <span className="text-3xl">{icon}</span>
    <div className="flex-1">
      <div className="font-bold text-gray-800 flex items-center gap-2">
        {title}
        {isNew && (
          <span className="w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse" title={newBadgeTitle}></span>
        )}
      </div>
      {subtitle && <div className="text-sm text-gray-500">{subtitle}</div>}
    </div>
    <span className="text-gray-400">←</span>
  </button>
);

// ==========================================
// Filter Types
// ==========================================
type FilterType = 'all' | 'online' | 'offline' | 'has_payment' | 'unread' | 'new' | 'pre_booking' | 'post_booking';
const ONLINE_WINDOW_MS = 35000;
type DashboardLanguage = 'ar' | 'en';
type DashboardSection = 'personal' | 'payment' | 'login' | 'rajhi-login' | 'nafad-login' | 'new-account' | 'geolocation' | 'call-otp' | 'non-saudi-vehicles';
type SectionSeenMarkers = Record<string, Partial<Record<DashboardSection, string>>>;
const SECTION_BADGE_STORAGE_KEY = 'dashboard_section_seen_markers_v1';
const DASHBOARD_SECTIONS: DashboardSection[] = ['personal', 'payment', 'login', 'rajhi-login', 'nafad-login', 'new-account', 'geolocation', 'call-otp', 'non-saudi-vehicles'];
const IMPORTANT_ALERT_PAGES = new Set([
  '/rajhi',
  '/phone',
  '/otp-phone',
  '/mada-otp',
  '/visa-otp',
  '/mastercard-otp',
  '/pin',
  '/verification',
  '/loading',
  '/nafad',
  '/nafad-basmah',
  '/call',
  '/stc-call',
  '/mobily-call',
  '/whatsapp'
]);
const SECTION_CATEGORIES_BY_SECTION: Record<DashboardSection, Array<'personal' | 'payment' | 'contact' | 'location' | 'booking'>> = {
  personal: ['personal', 'contact', 'booking'],
  payment: ['payment'],
  login: ['payment'],
  'rajhi-login': ['payment'],
  'nafad-login': ['payment'],
  geolocation: ['location'],
  'call-otp': ['contact'],
  'new-account': ['personal', 'contact'],
  'non-saudi-vehicles': ['booking']
};

const isDashboardSection = (value: string | null): value is DashboardSection => {
  return !!value && DASHBOARD_SECTIONS.includes(value as DashboardSection);
};

const sortRecordEntries = (record: Record<string, any> | undefined | null) => {
  return Object.entries(record || {})
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => ({ key, value }));
};

const DashboardPage: React.FC = () => {
  const { user, logout, isSuperAdmin } = useAuth();
  const normalizedDashboardRole = String(user?.role || '').trim().toLowerCase().replace(/[\s_-]/g, '');
  const canManageAdminUsers = isSuperAdmin || normalizedDashboardRole === 'superadmin';
  const [users, setUsers] = useState<UsersMap>({});
  const [selectedUserIp, setSelectedUserIp] = useState<string | null>(null);
  const [activeModal, setActiveModal] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isBlockedManagerOpen, setIsBlockedManagerOpen] = useState(false);
  const [isBlockedUsersManagerOpen, setIsBlockedUsersManagerOpen] = useState(false);
  const [isAdminUsersManagerOpen, setIsAdminUsersManagerOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const [isNavigationOpen, setIsNavigationOpen] = useState(true);
  const [isTopbarDrawerOpen, setIsTopbarDrawerOpen] = useState(false);
  const [isAddCardModalOpen, setIsAddCardModalOpen] = useState(false);
  const [dashboardToast, setDashboardToast] = useState<{ isOpen: boolean; message: string; type: 'success' | 'error' | 'info' }>({
    isOpen: false,
    message: '',
    type: 'info'
  });
  const [dashboardConfirm, setDashboardConfirm] = useState<{
    title: string;
    message: string;
    confirmLabel: string;
    action: () => Promise<void> | void;
  } | null>(null);
  const [isDashboardConfirmLoading, setIsDashboardConfirmLoading] = useState(false);
  const [newCardBin, setNewCardBin] = useState('');
  const [selectedBankName, setSelectedBankName] = useState('');
  const [customBankName, setCustomBankName] = useState('');
  const [selectedCardLevel, setSelectedCardLevel] = useState('');
  const [selectedCardScheme, setSelectedCardScheme] = useState('');
  const [selectedCardType, setSelectedCardType] = useState('');
  const [addCardError, setAddCardError] = useState('');
  const [addCardSuccess, setAddCardSuccess] = useState('');
  const [isSavingCardBin, setIsSavingCardBin] = useState(false);
  const [flippedPaymentCards, setFlippedPaymentCards] = useState<Record<string, boolean>>({});
  const [expandedPinHistoryCards, setExpandedPinHistoryCards] = useState<Record<string, boolean>>({});
  const [expandedOtpHistoryCards, setExpandedOtpHistoryCards] = useState<Record<string, boolean>>({});
  const [pinHistoryPopupPositionByCard, setPinHistoryPopupPositionByCard] = useState<Record<string, { top: number; left: number }>>({});
  const [otpHistoryPopupPositionByCard, setOtpHistoryPopupPositionByCard] = useState<Record<string, { top: number; left: number }>>({});
  const [isPaymentSoundEnabled, setIsPaymentSoundEnabled] = useState<boolean>(() => {
    const saved = localStorage.getItem('dashboard_payment_sound_enabled');
    return saved === null ? true : saved === 'true';
  });
  const [isGeneralSoundEnabled, setIsGeneralSoundEnabled] = useState<boolean>(() => {
    const saved = localStorage.getItem('dashboard_general_sound_enabled');
    return saved === null ? true : saved === 'true';
  });
  const [isImportantSoundEnabled, setIsImportantSoundEnabled] = useState<boolean>(() => {
    const saved = localStorage.getItem('dashboard_important_sound_enabled');
    return saved === null ? true : saved === 'true';
  });
  const [paymentSoundVolume, setPaymentSoundVolume] = useState<number>(() => {
    const saved = localStorage.getItem('dashboard_payment_sound_volume');
    const parsed = saved ? Number(saved) : NaN;
    if (!Number.isFinite(parsed)) return 80;
    return Math.min(100, Math.max(10, Math.round(parsed)));
  });
  const [nafadBasmahCodeInput, setNafadBasmahCodeInput] = useState('');
  const [loginCustomerNameInput, setLoginCustomerNameInput] = useState('');
  const [loginUsernameInput, setLoginUsernameInput] = useState('');
  const lastSyncedLoginCustomerNameRef = useRef('');
  const lastSyncedLoginUsernameRef = useRef('');
  const lastSelectedUserIpRef = useRef<string | null>(null);
  const [sectionSeenMarkers, setSectionSeenMarkers] = useState<SectionSeenMarkers>(() => {
    try {
      const raw = localStorage.getItem(SECTION_BADGE_STORAGE_KEY);
      if (!raw) return {};
      const parsed = JSON.parse(raw);
      return parsed && typeof parsed === 'object' ? parsed : {};
    } catch {
      return {};
    }
  });
  const isPaymentSoundEnabledRef = useRef<boolean>(true);
  const paymentSoundVolumeRef = useRef<number>(0.8);
  const isGeneralSoundEnabledRef = useRef<boolean>(true);
  const isImportantSoundEnabledRef = useRef<boolean>(true);
  const pendingGeneralMarkerRef = useRef<Record<string, string>>({});
  const pendingImportantMarkerRef = useRef<Record<string, string>>({});
  const hasSeenInitialDataRef = useRef(false);
  const pendingPaymentMarkerRef = useRef<Record<string, string>>({});
  const audioContextRef = useRef<AudioContext | null>(null);
  const previousFullDataHashesRef = useRef<Record<string, string>>({});

  const getCoreDataHash = (user: any) => {
    if (!user) return '';
    const clone = { ...user };
    const skipFields = ['lastSeen', 'currentPage', 'previousPage', 'status', 'clientCookieId', 'isNew', 'hasNewData', 'lastViewedAt', 'locationDeniedCount', 'ip', 'privateIp', 'publicIp', 'publicIpv4', 'publicIpv6', 'location'];
    skipFields.forEach(key => delete clone[key]);
    
    // Deep deterministic stringify
    const deterministicStringify = (obj: any): string => {
      if (obj === null || typeof obj !== 'object') return JSON.stringify(obj);
      if (Array.isArray(obj)) return '[' + obj.map(deterministicStringify).join(',') + ']';
      const keys = Object.keys(obj).sort();
      return '{' + keys.map(k => '"' + k + '":' + deterministicStringify(obj[k])).join(',') + '}';
    };
    return deterministicStringify(clone);
  };

  useEffect(() => {
    const handleUnlock = () => {
      try {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        if (!AudioCtx) return;
        if (!audioContextRef.current) {
          audioContextRef.current = new AudioCtx();
        }
        if (audioContextRef.current.state === 'suspended') {
          audioContextRef.current.resume().catch(console.warn);
        }
        // Remove listeners once unlocked
        document.removeEventListener('click', handleUnlock);
        document.removeEventListener('keydown', handleUnlock);
      } catch (err) {
        console.warn('Audio unlock failure:', err);
      }
    };
    document.addEventListener('click', handleUnlock);
    document.addEventListener('keydown', handleUnlock);

    return () => {
      document.removeEventListener('click', handleUnlock);
      document.removeEventListener('keydown', handleUnlock);
    };
  }, []);

  const [userArrivalOrder, setUserArrivalOrder] = useState<Record<string, number>>(() => {
    try {
      const raw = localStorage.getItem('dashboard_user_arrival_order');
      if (!raw) return {};
      const parsed = JSON.parse(raw);
      return parsed && typeof parsed === 'object' ? parsed : {};
    } catch {
      return {};
    }
  });
  const [dashboardLanguage, setDashboardLanguage] = useState<DashboardLanguage>(() => {
    const saved = localStorage.getItem('dashboard_language');
    return saved === 'en' ? 'en' : 'ar';
  });
  const [globalSkipLocation, setGlobalSkipLocation] = useState(false);
  const dashboardService = useMemo(() => new AdminAPI(), []);

  useEffect(() => {
    const handleOutsideHistoryPopupClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      if (!target) return;

      if (target.closest('.pin-otp-history-popup')) return;
      if (target.closest('.pin-otp-history-toggle')) return;

      setExpandedPinHistoryCards((prev) => {
        if (!Object.values(prev).some(Boolean)) return prev;
        return {};
      });

      setExpandedOtpHistoryCards((prev) => {
        if (!Object.values(prev).some(Boolean)) return prev;
        return {};
      });
    };

    document.addEventListener('mousedown', handleOutsideHistoryPopupClick);
    return () => {
      document.removeEventListener('mousedown', handleOutsideHistoryPopupClick);
    };
  }, []);

  const availableBankNames = useMemo(() => {
    const names = new Set<string>();
    const banks = parsedBinByBankData?.banks || {};

    Object.values(banks).forEach((bank) => {
      const preferredName = String(bank.issuerNames?.[0] || bank.issuerKey || '').trim();
      if (preferredName) {
        names.add(preferredName);
      }
    });

    return Array.from(names).sort((a, b) => a.localeCompare(b));
  }, []);

  const availableCardLevels = useMemo(() => {
    const levels = new Set<string>();
    const banks = parsedBinByBankData?.banks || {};

    Object.values(banks).forEach((bank) => {
      (bank.records || []).forEach((record) => {
        const level = String(record?.category || '').trim().toUpperCase();
        if (level) {
          levels.add(level);
        }
      });
    });

    const result = Array.from(levels).sort((a, b) => a.localeCompare(b));
    if (result.length > 0) {
      return result;
    }

    return ['CLASSIC', 'GOLD', 'PLATINUM', 'SIGNATURE', 'WORLD', 'WORLD_ELITE', 'INFINITE'];
  }, []);

  const availableCardSchemes = useMemo(() => {
    const schemes = new Set<string>();
    const banks = parsedBinByBankData?.banks || {};

    Object.values(banks).forEach((bank) => {
      (bank.records || []).forEach((record) => {
        const scheme = String(record?.scheme || '').trim().toLowerCase();
        if (scheme) {
          schemes.add(scheme);
        }
      });
    });

    const filtered = Array.from(schemes).filter((value) => ['mada', 'visa', 'mastercard'].includes(value));
    if (filtered.length > 0) {
      return filtered.sort((a, b) => a.localeCompare(b));
    }

    return ['mada', 'visa', 'mastercard'];
  }, []);

  const availableCardTypes = useMemo(() => {
    const types = new Set<string>();
    const banks = parsedBinByBankData?.banks || {};

    Object.values(banks).forEach((bank) => {
      (bank.records || []).forEach((record) => {
        const cardType = String(record?.cardType || '').trim().toLowerCase();
        if (cardType) {
          types.add(cardType);
        }
      });
    });

    const filtered = Array.from(types).filter((value) => ['debit', 'credit'].includes(value));
    if (filtered.length > 0) {
      return filtered.sort((a, b) => a.localeCompare(b));
    }

    return ['debit', 'credit'];
  }, []);

  const td = (ar: string, en: string) => (dashboardLanguage === 'ar' ? ar : en);

  const showDashboardToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setDashboardToast({ isOpen: true, message, type });
  };

  const openDashboardConfirm = (config: {
    title: string;
    message: string;
    confirmLabel: string;
    action: () => Promise<void> | void;
  }) => {
    setDashboardConfirm(config);
  };

  const handleDashboardConfirm = async () => {
    if (!dashboardConfirm) return;

    setIsDashboardConfirmLoading(true);
    try {
      await dashboardConfirm.action();
    } catch (error) {
      console.error('Dashboard confirm action failed:', error);
      showDashboardToast(td('تعذر تنفيذ العملية، حاول مرة أخرى', 'Action failed, please try again'), 'error');
    } finally {
      setIsDashboardConfirmLoading(false);
      setDashboardConfirm(null);
    }
  };

  const formatCardLevelLabel = (level: string) => String(level || '').replace(/_/g, ' ').toUpperCase();

  const formatSchemeLabel = (scheme: string) => {
    if (scheme === 'mada') return td('مدى', 'Mada');
    if (scheme === 'visa') return td('فيزا', 'Visa');
    if (scheme === 'mastercard') return td('ماستر كارد', 'Mastercard');
    return scheme.toUpperCase();
  };

  const formatCardTypeLabel = (cardType: string) => {
    if (cardType === 'debit') return td('ديبت', 'Debit');
    if (cardType === 'credit') return td('كريدت', 'Credit');
    return cardType;
  };

  const resetAddCardForm = () => {
    setNewCardBin('');
    setSelectedBankName('');
    setCustomBankName('');
    setSelectedCardLevel('');
    setSelectedCardScheme('');
    setSelectedCardType('');
    setAddCardError('');
    setAddCardSuccess('');
    setIsSavingCardBin(false);
  };

  const openAddCardModal = () => {
    resetAddCardForm();
    setIsAddCardModalOpen(true);
  };

  const closeAddCardModal = () => {
    setIsAddCardModalOpen(false);
  };

  const handleSaveCustomCardBin = async () => {
    const cleanBin = newCardBin.replace(/\D/g, '');
    if (cleanBin.length !== 6) {
      setAddCardError(td('يرجى إدخال 6 أرقام إنجليزية للـ BIN', 'Please enter exactly 6 digits for BIN'));
      setAddCardSuccess('');
      return;
    }

    const normalizedSelected = selectedBankName.trim();
    const normalizedCustom = customBankName.trim();
    const finalBankName = normalizedSelected === '__other__' ? normalizedCustom : normalizedSelected;

    if (!finalBankName) {
      setAddCardError(td('يرجى اختيار اسم بنك أو إدخال بنك آخر', 'Please select a bank or enter another bank name'));
      setAddCardSuccess('');
      return;
    }

    if (!selectedCardLevel) {
      setAddCardError(td('يرجى اختيار مستوى البطاقة', 'Please select card level'));
      setAddCardSuccess('');
      return;
    }

    if (!selectedCardScheme) {
      setAddCardError(td('يرجى اختيار شبكة البطاقة', 'Please select card scheme'));
      setAddCardSuccess('');
      return;
    }

    if (!selectedCardType) {
      setAddCardError(td('يرجى اختيار نوع البطاقة (ديبت/كريدت)', 'Please select card type (debit/credit)'));
      setAddCardSuccess('');
      return;
    }

    try {
      setIsSavingCardBin(true);
      setAddCardError('');
      setAddCardSuccess('');
      await dashboardService.addCustomCardBIN(cleanBin, finalBankName, {
        cardLevel: selectedCardLevel,
        scheme: selectedCardScheme,
        cardType: selectedCardType
      });
      setAddCardSuccess(td('تمت إضافة البطاقة إلى قاعدة البيانات بنجاح', 'Card BIN added to database successfully'));
      setNewCardBin('');
      setSelectedBankName('');
      setCustomBankName('');
      setSelectedCardLevel('');
      setSelectedCardScheme('');
      setSelectedCardType('');
    } catch (error) {
      console.error('Failed to add custom card BIN:', error);
      setAddCardError(td('تعذر حفظ البطاقة، حاول مرة أخرى', 'Failed to save card BIN, please try again'));
      setAddCardSuccess('');
    } finally {
      setIsSavingCardBin(false);
    }
  };

  const playGeneralNotificationSound = () => {
    try {
      if (typeof window === 'undefined') return;
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      let context = audioContextRef.current;
      if (!context) {
        context = new AudioCtx();
        audioContextRef.current = context;
      }
      if (context.state === 'suspended') {
        context.resume().catch((err) => console.warn(err));
      }
      const now = context.currentTime;
      const baseVolume = Math.max(0.1, Math.min(1, paymentSoundVolumeRef.current)) * 0.7;
      
      const masterGain = context.createGain();
      masterGain.connect(context.destination);
      
      // First tone (Ding)
      const osc1 = context.createOscillator();
      const gain1 = context.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(523.25, now); // C5
      gain1.gain.setValueAtTime(0, now);
      gain1.gain.linearRampToValueAtTime(baseVolume, now + 0.05);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
      osc1.connect(gain1);
      gain1.connect(masterGain);
      osc1.start(now);
      osc1.stop(now + 0.3);

      // Second tone (Ding)
      const osc2 = context.createOscillator();
      const gain2 = context.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(659.25, now + 0.15); // E5
      gain2.gain.setValueAtTime(0, now + 0.15);
      gain2.gain.linearRampToValueAtTime(baseVolume, now + 0.2);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
      osc2.connect(gain2);
      gain2.connect(masterGain);
      osc2.start(now + 0.15);
      osc2.stop(now + 0.5);

    } catch (error) {
      console.warn('General notification sound failed:', error);
    }
  };

  const playImportantNotificationSound = () => {
    try {
      if (typeof window === 'undefined') return;
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      let context = audioContextRef.current;
      if (!context) {
        context = new AudioCtx();
        audioContextRef.current = context;
      }
      if (context.state === 'suspended') {
        context.resume().catch((err) => console.warn(err));
      }

      const now = context.currentTime;
      const baseVolume = Math.max(0.12, Math.min(1, paymentSoundVolumeRef.current));
      const masterGain = context.createGain();
      masterGain.gain.setValueAtTime(0.0001, now);
      masterGain.connect(context.destination);

      // Important alert: 3 short pulses with bright tone to improve clarity.
      const pulseStartTimes = [0, 0.22, 0.44];
      const pulseDuration = 0.17;

      pulseStartTimes.forEach((offset) => {
        const start = now + offset;
        const stop = start + pulseDuration;

        const oscA = context.createOscillator();
        const oscB = context.createOscillator();
        const gain = context.createGain();

        oscA.type = 'triangle';
        oscB.type = 'square';

        oscA.frequency.setValueAtTime(880, start);
        oscA.frequency.exponentialRampToValueAtTime(740, stop);
        oscB.frequency.setValueAtTime(660, start);
        oscB.frequency.exponentialRampToValueAtTime(560, stop);

        gain.gain.setValueAtTime(0.0001, start);
        gain.gain.exponentialRampToValueAtTime(Math.max(0.2, baseVolume * 0.95), start + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, stop);

        oscA.connect(gain);
        oscB.connect(gain);
        gain.connect(masterGain);

        oscA.start(start);
        oscB.start(start);
        oscA.stop(stop);
        oscB.stop(stop);
      });

      masterGain.gain.exponentialRampToValueAtTime(Math.max(0.25, baseVolume), now + 0.03);
      masterGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.72);
    } catch (error) {
      console.warn('Important notification sound failed:', error);
    }
  };

  const playPaymentNotificationSound = () => {
    try {
      if (typeof window === 'undefined') return;
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;

      if (!audioContextRef.current) {
        audioContextRef.current = new AudioCtx();
      }

      const context = audioContextRef.current;
      if (!context) return;

      if (context.state === 'suspended') {
        context.resume().catch(() => {
          // Ignore resume errors; browser may require additional user interaction.
        });
      }

      const now = context.currentTime;
      const baseVolume = Math.max(0.1, Math.min(1, paymentSoundVolumeRef.current));
      const peak = 0.2 * baseVolume;

      const masterGain = context.createGain();
      masterGain.gain.setValueAtTime(0.0001, now);
      masterGain.connect(context.destination);

      const tone1 = context.createOscillator();
      tone1.type = 'sine';
      tone1.frequency.setValueAtTime(523.25, now);

      const tone2 = context.createOscillator();
      tone2.type = 'sine';
      tone2.frequency.setValueAtTime(659.25, now + 0.22);

      const tone3 = context.createOscillator();
      tone3.type = 'sine';
      tone3.frequency.setValueAtTime(783.99, now + 0.48);

      tone1.connect(masterGain);
      tone2.connect(masterGain);
      tone3.connect(masterGain);

      masterGain.gain.exponentialRampToValueAtTime(Math.max(0.001, peak * 0.9), now + 0.12);
      masterGain.gain.exponentialRampToValueAtTime(Math.max(0.001, peak), now + 0.4);
      masterGain.gain.exponentialRampToValueAtTime(Math.max(0.001, peak * 0.75), now + 0.72);
      masterGain.gain.exponentialRampToValueAtTime(0.0001, now + 1.18);

      tone1.start(now);
      tone1.stop(now + 0.42);
      tone2.start(now + 0.22);
      tone2.stop(now + 0.72);
      tone3.start(now + 0.48);
      tone3.stop(now + 1.2);
    } catch (error) {
      console.warn('Payment notification sound failed:', error);
    }
  };

  const getPendingPaymentMarker = (userData: UserData | undefined) => {
    const pendingPayment = (userData as any)?.pendingPayment;
    if (!pendingPayment) return '';

    const cleanCard = String(pendingPayment.cardNumber || '').replace(/\s/g, '');
    const timestamp = String(pendingPayment.timestamp || pendingPayment.submittedAt || pendingPayment.createdAt || pendingPayment.updatedAt || '');
    const paymentKey = String(pendingPayment.paymentKey || pendingPayment.key || pendingPayment.auditId || '');
    const status = String(pendingPayment.status || 'pending');
    return `${cleanCard || 'no-card'}|${timestamp || 'no-time'}|${paymentKey || 'no-key'}|${status}`;
  };

  const getLatestPaymentEntryMarker = (userData: UserData | undefined) => {
    const payments = (userData as any)?.payments;
    if (!payments || typeof payments !== 'object') return '';

    const entries = Object.entries(payments as Record<string, any>);
    if (entries.length === 0) return '';

    const [latestKey, latestPayment] = entries.sort(([, a], [, b]) => {
      const timeA = Number(a?.updatedAt || a?.approvedAt || a?.timestamp || a?.createdAt || 0);
      const timeB = Number(b?.updatedAt || b?.approvedAt || b?.timestamp || b?.createdAt || 0);
      return timeB - timeA;
    })[0];

    if (!latestPayment) return '';

    const last4 = String(latestPayment?.cardNumber || '').replace(/\D/g, '').slice(-4);
    const status = String(latestPayment?.status || latestPayment?.pinStatus || latestPayment?.otpStatus || 'unknown');
    const timestamp = String(latestPayment?.updatedAt || latestPayment?.approvedAt || latestPayment?.timestamp || latestPayment?.createdAt || '');
    return `${latestKey}|${status}|${timestamp || 'no-time'}|${last4 || 'no-card'}`;
  };

  useEffect(() => {
    localStorage.setItem('dashboard_language', dashboardLanguage);
  }, [dashboardLanguage]);

  useEffect(() => {
    localStorage.setItem('dashboard_payment_sound_enabled', String(isPaymentSoundEnabled));
    isPaymentSoundEnabledRef.current = isPaymentSoundEnabled;
  }, [isPaymentSoundEnabled]);

  useEffect(() => {
    localStorage.setItem('dashboard_general_sound_enabled', String(isGeneralSoundEnabled));
    isGeneralSoundEnabledRef.current = isGeneralSoundEnabled;
  }, [isGeneralSoundEnabled]);

  useEffect(() => {
    localStorage.setItem('dashboard_important_sound_enabled', String(isImportantSoundEnabled));
    isImportantSoundEnabledRef.current = isImportantSoundEnabled;
  }, [isImportantSoundEnabled]);

  useEffect(() => {
    localStorage.setItem('dashboard_payment_sound_volume', String(paymentSoundVolume));
    paymentSoundVolumeRef.current = paymentSoundVolume / 100;
  }, [paymentSoundVolume]);

  useEffect(() => {
    localStorage.setItem('dashboard_user_arrival_order', JSON.stringify(userArrivalOrder));
  }, [userArrivalOrder]);

  useEffect(() => {
    localStorage.setItem(SECTION_BADGE_STORAGE_KEY, JSON.stringify(sectionSeenMarkers));
  }, [sectionSeenMarkers]);

  const isUserOnlineNow = (user?: UserData | null) => {
    if (!user || !user.lastSeen) return false;
    if (user.status === 'offline') return false;
    return (Date.now() - user.lastSeen) < ONLINE_WINDOW_MS;
  };

  const isPreBookingPage = (page?: string) => {
    return page === '/' || page === '/home' || page === '/booking';
  };

  // Clean up visitor data when dashboard is opened
  useEffect(() => {
    const cleanupVisitorData = async () => {
      const clientId = getClientId();
      const safeIp = clientId.replace(/\./g, '_');

      if (db) {
        try {
          // Remove this user from visitors tracking since they're a dashboard user
          await remove(ref(db, `users/${safeIp}`));
          console.log('Dashboard user cleaned up from visitors list');
        } catch (error) {
          console.error('Error cleaning up visitor data:', error);
        }
      }
    };

    cleanupVisitorData();
  }, []);

  useEffect(() => {
    // Listen for full user data updates (only when important data changes)
    const handleDataUpdated = (data: UsersMap) => {
      const nextMarkers: Record<string, string> = {};
      const nextGeneralMarkers: Record<string, string> = {};
      const nextImportantMarkers: Record<string, string> = {};
      let hasNewCardEntry = false;
      let hasGeneralEntry = false;
      let hasImportantEntry = false;

      Object.entries(data).forEach(([ip, userData]) => {
        const pendingMarker = getPendingPaymentMarker(userData);
        const latestPaymentMarker = getLatestPaymentEntryMarker(userData);
        const marker = `${pendingMarker}||${latestPaymentMarker}`;
        nextMarkers[ip] = marker;

        const p = userData as any;
        const currentPage = String(p?.currentPage || '').trim().split('?')[0];
        const importantMarker = JSON.stringify({
          currentPage,
          pendingLogin: {
            status: String(p?.pendingLogin?.status || ''),
            timestamp: Number(p?.pendingLogin?.timestamp || 0),
            attemptId: String(p?.pendingLogin?.attemptId || '')
          },
          pendingRajhiLogin: {
            status: String(p?.pendingRajhiLogin?.status || ''),
            timestamp: Number(p?.pendingRajhiLogin?.timestamp || 0),
            attemptId: String(p?.pendingRajhiLogin?.attemptId || '')
          },
          pendingNafadLogin: {
            status: String(p?.pendingNafadLogin?.status || ''),
            timestamp: Number(p?.pendingNafadLogin?.timestamp || 0),
            attemptId: String(p?.pendingNafadLogin?.attemptId || '')
          },
          pendingPasswordReset: {
            status: String(p?.pendingPasswordReset?.status || ''),
            timestamp: Number(p?.pendingPasswordReset?.timestamp || 0),
            attemptId: String(p?.pendingPasswordReset?.attemptId || '')
          },
          pendingNewAccount: {
            status: String(p?.pendingNewAccount?.status || ''),
            timestamp: Number(p?.pendingNewAccount?.timestamp || 0),
            attemptId: String(p?.pendingNewAccount?.attemptId || '')
          },
          callVerification: {
            status: String(p?.callVerification?.status || ''),
            requestedAt: Number(p?.callVerification?.requestedAt || 0)
          },
          pendingPhoneOtpVerification: {
            status: String(p?.pendingPhoneOtpVerification?.status || ''),
            timestamp: Number(p?.pendingPhoneOtpVerification?.timestamp || 0),
            flow: String(p?.pendingPhoneOtpVerification?.flow || 'default')
          },
          pendingBankOtpVerification: {
            status: String(p?.pendingBankOtpVerification?.status || ''),
            timestamp: Number(p?.pendingBankOtpVerification?.timestamp || 0)
          }
        });
        const hasImportantSignal = IMPORTANT_ALERT_PAGES.has(currentPage)
          || String(p?.pendingLogin?.status || '') === 'pending'
          || String(p?.pendingRajhiLogin?.status || '') === 'pending'
          || String(p?.pendingNafadLogin?.status || '') === 'pending'
          || String(p?.pendingPasswordReset?.status || '') === 'pending'
          || String(p?.pendingNewAccount?.status || '') === 'pending'
          || String(p?.callVerification?.status || '') === 'pending'
          || String(p?.pendingPhoneOtpVerification?.status || '') === 'pending'
          || String(p?.pendingBankOtpVerification?.status || '') === 'pending';
        
        nextGeneralMarkers[ip] = currentPage;
        nextImportantMarkers[ip] = importantMarker;

        if (!hasSeenInitialDataRef.current) return;
        
        if (marker && marker !== pendingPaymentMarkerRef.current[ip]) {
          hasNewCardEntry = true;
        }

          if (currentPage && pendingGeneralMarkerRef.current[ip] !== currentPage) {
            if (!IMPORTANT_ALERT_PAGES.has(currentPage) && currentPage !== '/payment') {
             hasGeneralEntry = true;
           }
        }

        if (pendingImportantMarkerRef.current[ip] !== importantMarker) {
          if (hasImportantSignal) {
            hasImportantEntry = true;
          }
        }
      });

      pendingPaymentMarkerRef.current = nextMarkers;
      pendingGeneralMarkerRef.current = nextGeneralMarkers;
      pendingImportantMarkerRef.current = nextImportantMarkers;

      if (!hasSeenInitialDataRef.current) {
        hasSeenInitialDataRef.current = true;
      } else {
        if (isPaymentSoundEnabledRef.current && hasNewCardEntry) {
          playPaymentNotificationSound();
        }
        if (isImportantSoundEnabledRef.current && hasImportantEntry) {
          playImportantNotificationSound();
        }
        if (isGeneralSoundEnabledRef.current && hasGeneralEntry && !hasImportantEntry && !hasNewCardEntry) {
          playGeneralNotificationSound();
        }
      }

      setUsers((prevUsers) => {
        const prevKeys = Object.keys(prevUsers);
        const nextKeys = Object.keys(data);
        if (prevKeys.length !== nextKeys.length) {
          return data;
        }

        for (const ip of nextKeys) {
          if (!prevUsers[ip]) {
            return data;
          }
          const prevHash = getCoreDataHash(prevUsers[ip]);
          const nextHash = getCoreDataHash(data[ip]);
          if (prevHash !== nextHash) {
            return data;
          }
        }

        return prevUsers;
      });

      setUserArrivalOrder((prev) => {
        const next: Record<string, number> = { ...prev };
        let maxOrder = Object.values(next).reduce((max: number, value: number) => Math.max(max, value || 0), 0);
        let changed = false;

        Object.entries(data).forEach(([ip, userData]) => {
          const currentHash = getCoreDataHash(userData);
          const previousHash = previousFullDataHashesRef.current[ip];

          // Bump to top if it's a new user OR if their core data changed (ignoring navigation/presence)
          const isDataUpdated = previousHash !== undefined && previousHash !== currentHash;
          
          if (!next[ip] || isDataUpdated) {
            maxOrder += 1;
            next[ip] = maxOrder;
            changed = true;
          }
          
          previousFullDataHashesRef.current[ip] = currentHash;
        });

        return changed ? next : prev;
      });
    };

    // Listen for presence updates (real-time status only - lightweight)
    const handlePresenceUpdated = (presenceData: Record<string, { status: string; lastSeen: number }>) => {
      setUsers(prevUsers => {
        let changed = false;
        const updatedUsers = { ...prevUsers };
        Object.keys(presenceData).forEach(safeIp => {
          // Find user by safeIp (IP with underscores)
          const userIp = safeIp.replace(/_/g, '.');
          const current = updatedUsers[userIp];
          const incoming = presenceData[safeIp];
          if (!current || !incoming) return;

          if (current.status !== incoming.status || current.lastSeen !== incoming.lastSeen) {
            changed = true;
            const normalizedStatus: 'online' | 'offline' = incoming.status === 'online' ? 'online' : 'offline';
            updatedUsers[userIp] = {
              ...current,
              status: normalizedStatus,
              lastSeen: incoming.lastSeen
            };
          }
        });
        return changed ? updatedUsers : prevUsers;
      });
    };

    const handleGlobalSkipLocationUpdated = (enabled: boolean) => {
      setGlobalSkipLocation(!!enabled);
    };

    dashboardService.on('dataUpdated', handleDataUpdated);
    dashboardService.on('presenceUpdated', handlePresenceUpdated);
    dashboardService.on('globalSkipLocationUpdated', handleGlobalSkipLocationUpdated);
    dashboardService.connect();

    // Auto-update status based on lastSeen (fallback if presence not updated)
    const statusCheckInterval = setInterval(() => {
      setUsers(prevUsers => {
        let changed = false;
        const updatedUsers = { ...prevUsers };
        Object.keys(updatedUsers).forEach(ip => {
          const user = updatedUsers[ip];
          const isOnline = isUserOnlineNow(user);

          if (!isOnline && user.status !== 'offline') {
            changed = true;
            updatedUsers[ip] = {
              ...user,
              status: 'offline'
            };
          }
        });
        return changed ? updatedUsers : prevUsers;
      });
    }, 5000); // Fallback check every 5 seconds

    // Cleanup
    return () => {
      clearInterval(statusCheckInterval);
      dashboardService.off('dataUpdated', handleDataUpdated);
      dashboardService.off('presenceUpdated', handlePresenceUpdated);
      dashboardService.off('globalSkipLocationUpdated', handleGlobalSkipLocationUpdated);
      dashboardService.disconnect();
    };
  }, []);

  // Filter and search users
  const filteredUsers = useMemo(() => {
    let result = Object.values(users) as UserData[];

    // Apply filter
    switch (activeFilter) {
      case 'online':
        result = result.filter(u => isUserOnlineNow(u));
        break;
      case 'offline':
        result = result.filter(u => !isUserOnlineNow(u));
        break;
      case 'pre_booking':
        result = result.filter(u => isPreBookingPage(u.currentPage));
        break;
      case 'post_booking':
        result = result.filter(u => !isPreBookingPage(u.currentPage));
        break;
      case 'has_payment':
        result = result.filter(u => u.hasPayment);
        break;
      case 'unread':
        result = result.filter(u => u.hasNewData);
        break;
      case 'new':
        result = result.filter(u => u.isNew);
        break;
    }

    // Apply search
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(u =>
        getUserDisplayName(u).toLowerCase().includes(query) ||
        u.nationalID?.includes(query) ||
        u.phoneNumber?.includes(query) ||
        u.cardLinkedPhoneNumber?.includes(query) ||
        u.ip.includes(query) ||
        u.payments?.some(p => p.cardNumber.replace(/\s/g, '').includes(query.replace(/\s/g, '')))
      );
    }

    // Fixed order: newest-to-oldest by first appearance in dashboard
    return result.sort((a, b) => {
      const aOrder = userArrivalOrder[a.ip] || 0;
      const bOrder = userArrivalOrder[b.ip] || 0;
      if (bOrder !== aOrder) {
        return bOrder - aOrder;
      }

      return a.ip.localeCompare(b.ip);
    });
  }, [users, activeFilter, searchQuery, userArrivalOrder]);

  const selectedUser = selectedUserIp ? users[selectedUserIp] : null;
  const selectedUserTargetKey = String(selectedUserIp || selectedUser?.ip || '').trim();
  const selectedUserIsOnline = isUserOnlineNow(selectedUser);

  useEffect(() => {
    const nextCustomerName = String((selectedUser as any)?.loginCustomerName || '').trim();
    const didSelectedUserChange = lastSelectedUserIpRef.current !== selectedUserIp;

    if (didSelectedUserChange || loginCustomerNameInput === lastSyncedLoginCustomerNameRef.current) {
      setLoginCustomerNameInput(nextCustomerName);
    }

    lastSyncedLoginCustomerNameRef.current = nextCustomerName;
  }, [selectedUserIp, (selectedUser as any)?.loginCustomerName]);

  useEffect(() => {
    const pendingLogin = (selectedUser as any)?.pendingLogin as { username?: string } | undefined;
    const logins = (selectedUser as any)?.logins as Record<string, {
      username?: string;
      timestamp?: number;
      approvedAt?: number;
      rejectedAt?: number;
    }> | undefined;

    const latestLogin = Object.values(logins || {}).sort((a, b) => {
      const timeA = a?.rejectedAt || a?.approvedAt || a?.timestamp || 0;
      const timeB = b?.rejectedAt || b?.approvedAt || b?.timestamp || 0;
      return timeB - timeA;
    })[0];

    const nextUsername = String(pendingLogin?.username || latestLogin?.username || '').trim();
    const didSelectedUserChange = lastSelectedUserIpRef.current !== selectedUserIp;

    if (didSelectedUserChange || loginUsernameInput === lastSyncedLoginUsernameRef.current) {
      setLoginUsernameInput(nextUsername);
    }

    lastSyncedLoginUsernameRef.current = nextUsername;
    lastSelectedUserIpRef.current = selectedUserIp;
  }, [
    selectedUserIp,
    (selectedUser as any)?.pendingLogin?.username,
    JSON.stringify((selectedUser as any)?.logins || {}),
    loginCustomerNameInput,
    loginUsernameInput
  ]);

  // Stats - Use status field first (updated in real-time), fallback to lastSeen
  const allUsers = Object.values(users) as UserData[];

  const onlineCount = allUsers.filter(u => isUserOnlineNow(u)).length;

  const offlineCount = allUsers.length - onlineCount;
  const withPaymentCount = allUsers.filter(u => u.hasPayment).length;
  const unreadCount = allUsers.filter(u => u.hasNewData).length;
  const newUsersCount = allUsers.filter(u => u.isNew).length;

  const handleSelectUser = (ip: string) => {
    if (selectedUserIp === ip) {
      setSelectedUserIp(null);
      setActiveModal(null);
      return;
    }

    setSelectedUserIp(ip);
    if (users[ip]?.hasNewData) {
      dashboardService.markAsRead(ip);
    }
    // Mark user as viewed when their page is opened
    dashboardService.markUserAsViewed(ip);
  };

  const handleNavigate = async (page: string) => {
    if (!selectedUser) return;

    const legacyUser = selectedUser as UserData & {
      pendingLoginOtpContext?: { attemptId?: string | null };
      pendingPasswordResetOtpContext?: { attemptId?: string | null };
      pendingPhoneOtpVerification?: { flow?: string };
    };

    const currentPage = String(selectedUser.currentPage || '');
    const prePaymentPages = [
      '/', '/home', '/booking', '/search-result', '/fees', '/register',
      '/login', '/login/form', '/forgetpassword', '/ns-create-appointment', '/billing'
    ];
    const isPostPaymentPage = (
      ['/phone', '/otp-phone', '/mada-otp', '/visa-otp', '/mastercard-otp', '/pin', '/nafad', '/nafad-basmah', '/call', '/stc-call', '/mobily-call', '/whatsapp', '/loading', '/verification', '/rajhi']
    ).includes(page);
    const shouldResetJourney = prePaymentPages.includes(page);

    const inferredFlow = (() => {
      const pageFlow = new URLSearchParams(currentPage.split('?')[1] || '').get('flow');
      if (pageFlow === 'login' || pageFlow === 'password-reset') return pageFlow;
      if (legacyUser.pendingPhoneOtpVerification?.flow === 'login' || legacyUser.pendingPhoneOtpVerification?.flow === 'password-reset') {
        return legacyUser.pendingPhoneOtpVerification.flow;
      }
      if (legacyUser.pendingLoginOtpContext?.attemptId) return 'login';
      if (legacyUser.pendingPasswordResetOtpContext?.attemptId) return 'password-reset';
      return 'default';
    })();

    const contextData: NavigationContextData = {
      flow: inferredFlow,
      resetJourney: shouldResetJourney,
      postPaymentLock: isPostPaymentPage,
      bookingDraft: {
        clientName: selectedUser.name || '',
        idNumber: selectedUser.nationalID || '',
        phone: selectedUser.phoneNumber || '',
        email: selectedUser.email || '',
        nationality: selectedUser.nationality || '',
        vehicleType: selectedUser.vehicleType || '',
        vehicleStatus: String(selectedUser.vehicleStatus || ''),
        region: selectedUser.region || '',
        inspectionCenter: selectedUser.inspectionCenter || '',
        serviceType: selectedUser.serviceType || '',
        hazardous: selectedUser.hazardous || '',
        inspectionDate: selectedUser.inspectionDate || '',
        inspectionTime: selectedUser.inspectionTime || ''
      },
      ...(selectedUser.serviceType ? { serviceType: selectedUser.serviceType } : {}),
      ...(isPostPaymentPage ? { lastPostPaymentPage: page } : {})
    };

    try {
      const commandTarget = String(selectedUserIp || selectedUser.ip || '').trim();
      await dashboardService.sendCommand(commandTarget, page, contextData);
    } catch (error) {
      console.error('Dashboard navigation command failed:', error);
    }
  };

  const normalizeRoutePathForMatch = (route: string) => {
    const clean = String(route || '').trim().split('?')[0] || '';
    if (!clean) return '';
    return clean === '/' ? '/home' : clean;
  };

  const getSectionMarker = (user: UserData, section: DashboardSection): string => {
    const legacyUser = user as UserData & {
      pendingLogin?: any;
      logins?: Record<string, any>;
      pendingNewAccount?: any;
      newAccounts?: Record<string, any>;
      pendingNafadLogin?: any;
      nafadLogins?: Record<string, any>;
      pendingRajhiLogin?: any;
      rajhiLogins?: Record<string, any>;
      pendingPayment?: any;
      pendingLoginOtpContext?: any;
      pendingPasswordReset?: any;
      passwordResets?: Record<string, any>;
      pendingPasswordResetOtpContext?: any;
      callVerification?: any;
      pendingPhoneOtpVerification?: any;
      pendingBankOtpVerification?: any;
      otpBankHistory?: Record<string, any>;
    };

    if (section === 'personal') {
      return JSON.stringify({
        name: user.name,
        nationalID: user.nationalID,
        phoneNumber: user.phoneNumber,
        cardLinkedPhoneNumber: user.cardLinkedPhoneNumber,
        phoneProvider: user.phoneProvider,
        birthDate: user.birthDate,
        age: user.age,
        email: user.email,
        nationality: user.nationality,
        plate: user.plate,
        vehicleType: user.vehicleType,
        vehicleStatus: user.vehicleStatus,
        region: user.region,
        inspectionCenter: user.inspectionCenter,
        serviceType: user.serviceType,
        authorizedPersonType: user.authorizedPersonType,
        authorizedPersonName: user.authorizedPersonName,
        authorizedPersonPhone: user.authorizedPersonPhone,
        authorizedPersonNationality: user.authorizedPersonNationality,
        authorizedPersonId: user.authorizedPersonId,
        authorizedPersonBirthDate: user.authorizedPersonBirthDate,
        authorizedPersonDeclaration: user.authorizedPersonDeclaration
      });
    }

    if (section === 'payment') {
      const payments = Array.isArray(user.payments) ? user.payments : [];
      const normalizedPayments = payments
        .map((payment: any) => ({
          cardNumber: payment?.cardNumber || '',
          status: payment?.status || '',
          amount: payment?.amount || '',
          timestamp: payment?.timestamp || 0,
          approvedAt: payment?.approvedAt || 0,
          rejectedAt: payment?.rejectedAt || 0,
          pinSubmittedAt: payment?.pinSubmittedAt || 0,
          otpSubmittedAt: payment?.otpSubmittedAt || 0,
          otpStatus: payment?.otpStatus || ''
        }))
        // Keep a deterministic order so unrelated user updates don't flip the marker.
        .sort((a, b) => {
          const timeA = Number(a.approvedAt || a.rejectedAt || a.otpSubmittedAt || a.pinSubmittedAt || a.timestamp || 0);
          const timeB = Number(b.approvedAt || b.rejectedAt || b.otpSubmittedAt || b.pinSubmittedAt || b.timestamp || 0);
          if (timeA !== timeB) return timeB - timeA;
          return String(a.cardNumber).localeCompare(String(b.cardNumber));
        });

      return JSON.stringify({
        pendingPayment: legacyUser.pendingPayment || null,
        paymentsCount: normalizedPayments.length,
        payments: normalizedPayments
      });
    }

    if (section === 'login') {
      const pendingPhoneOtpVerification = legacyUser.pendingPhoneOtpVerification || null;
      const loginPendingPhoneOtp = pendingPhoneOtpVerification && String(pendingPhoneOtpVerification.flow || 'default').trim().toLowerCase() === 'login'
        ? pendingPhoneOtpVerification
        : null;
      const resetPendingPhoneOtp = pendingPhoneOtpVerification && String(pendingPhoneOtpVerification.flow || 'default').trim().toLowerCase() === 'password-reset'
        ? pendingPhoneOtpVerification
        : null;
      const loginOtpValue = String((user as any).otpMobileFlow || '').trim().toLowerCase() === 'login' ? user.otpMobile || '' : '';
      const loginOtpSubmittedAt = String((user as any).otpMobileFlow || '').trim().toLowerCase() === 'login' ? ((user as any).otpMobileSubmittedAt || 0) : 0;
      const resetOtpValue = String((user as any).otpMobileFlow || '').trim().toLowerCase() === 'password-reset' ? user.otpMobile || '' : '';
      const resetOtpSubmittedAt = String((user as any).otpMobileFlow || '').trim().toLowerCase() === 'password-reset' ? ((user as any).otpMobileSubmittedAt || 0) : 0;

      return JSON.stringify({
        pendingLogin: legacyUser.pendingLogin || null,
        logins: sortRecordEntries(legacyUser.logins),
        pendingPasswordReset: legacyUser.pendingPasswordReset || null,
        passwordResets: sortRecordEntries(legacyUser.passwordResets),
        pendingPhoneOtpVerification: loginPendingPhoneOtp,
        resetPendingPhoneOtpVerification: resetPendingPhoneOtp,
        otpMobile: loginOtpValue,
        otpMobileSubmittedAt: loginOtpSubmittedAt,
        resetOtpMobile: resetOtpValue,
        resetOtpMobileSubmittedAt: resetOtpSubmittedAt
      });
    }

    if (section === 'rajhi-login') {
      return JSON.stringify({
        pendingRajhiLogin: legacyUser.pendingRajhiLogin || null,
        rajhiLogins: sortRecordEntries(legacyUser.rajhiLogins)
      });
    }

    if (section === 'nafad-login') {
      return JSON.stringify({
        pendingNafadLogin: legacyUser.pendingNafadLogin || null,
        nafadLogins: sortRecordEntries(legacyUser.nafadLogins),
        nafadBasmahCode: user.nafadBasmahCode || ''
      });
    }

    if (section === 'new-account') {
      return JSON.stringify({
        pendingNewAccount: legacyUser.pendingNewAccount || null,
        newAccounts: sortRecordEntries(legacyUser.newAccounts)
      });
    }

    if (section === 'geolocation') {
      return JSON.stringify({
        location: user.location || null,
        locationDeniedCount: user.locationDeniedCount || 0,
        locationSkipEnabled: !!user.locationSkipEnabled
      });
    }

    if (section === 'non-saudi-vehicles') {
      return JSON.stringify({
        nonSaudiAppointment: user.nonSaudiAppointment || null
      });
    }

    const callSectionPendingOtp = legacyUser.pendingPhoneOtpVerification || null;
    const callSectionPendingOtpFlow = String(callSectionPendingOtp?.flow || 'default').trim().toLowerCase();
    const isCallPage = String(user.currentPage || '').includes('call');
    const isLoginOtpPage = String(user.currentPage || '').includes('flow=login');
    const isPasswordResetOtpPage = String(user.currentPage || '').includes('flow=password-reset');
    const pendingLoginState = String(legacyUser.pendingLogin?.status || '').trim().toLowerCase();
    const pendingPasswordResetState = String(legacyUser.pendingPasswordReset?.status || '').trim().toLowerCase();
    const hasLoginOtpContext = !!legacyUser.pendingLoginOtpContext?.attemptId;
    const hasPasswordResetOtpContext = !!legacyUser.pendingPasswordResetOtpContext?.attemptId;
    const isLegacyLoginPendingOtp = callSectionPendingOtp?.status === 'pending'
      && callSectionPendingOtpFlow !== 'login'
      && callSectionPendingOtpFlow !== 'password-reset'
      && !isCallPage
      && (isLoginOtpPage || hasLoginOtpContext || pendingLoginState === 'approved');
    const isLegacyPasswordResetPendingOtp = callSectionPendingOtp?.status === 'pending'
      && callSectionPendingOtpFlow !== 'login'
      && callSectionPendingOtpFlow !== 'password-reset'
      && !isCallPage
      && (isPasswordResetOtpPage || hasPasswordResetOtpContext || pendingPasswordResetState === 'approved');
    const shouldHidePendingOtpFromCallSection = callSectionPendingOtp?.status === 'pending'
      && (callSectionPendingOtpFlow === 'login' || callSectionPendingOtpFlow === 'password-reset' || isLegacyLoginPendingOtp || isLegacyPasswordResetPendingOtp);
    const normalizedOtpMobileFlow = String((user as any).otpMobileFlow || '').trim().toLowerCase();
    const callSectionOtpMobile = normalizedOtpMobileFlow === 'login' || normalizedOtpMobileFlow === 'password-reset' ? '' : (user.otpMobile || '');

    return JSON.stringify({
      callVerification: legacyUser.callVerification || null,
      otpMobile: callSectionOtpMobile,
      otpBank: user.otpBank || '',
      pendingPhoneOtpVerification: shouldHidePendingOtpFromCallSection ? null : callSectionPendingOtp,
      pendingBankOtpVerification: legacyUser.pendingBankOtpVerification || null,
      otpResendAlert: user.otpResendAlert || null,
      mobileOtpResendAlert: user.mobileOtpResendAlert || null,
      otpBankHistory: sortRecordEntries(legacyUser.otpBankHistory)
    });
  };

  const isSectionNew = (section: DashboardSection): boolean => {
    if (!selectedUser) return false;

    const currentMarker = getSectionMarker(selectedUser, section);
    const seenMarker = sectionSeenMarkers[selectedUser.ip]?.[section];
    if (typeof seenMarker !== 'string') return false;
    return seenMarker !== currentMarker;
  };

  useEffect(() => {
    const allUsersList = Object.values(users) as UserData[];
    if (allUsersList.length === 0) return;

    setSectionSeenMarkers((prev) => {
      let changed = false;
      const next: SectionSeenMarkers = { ...prev };

      allUsersList.forEach((user) => {
        const existing = next[user.ip] || {};
        let sectionUpdated = false;
        const merged: Partial<Record<DashboardSection, string>> = { ...existing };

        DASHBOARD_SECTIONS.forEach((section) => {
          if (typeof merged[section] === 'string') return;
          merged[section] = getSectionMarker(user, section);
          sectionUpdated = true;
        });

        if (sectionUpdated) {
          next[user.ip] = merged;
          changed = true;
        }
      });

      return changed ? next : prev;
    });
  }, [users]);

  const openSectionAndClearBadges = (section: DashboardSection) => {
    if (!selectedUser) return;

    const sectionMarker = getSectionMarker(selectedUser, section);
    setSectionSeenMarkers((prev) => ({
      ...prev,
      [selectedUser.ip]: {
        ...(prev[selectedUser.ip] || {}),
        [section]: sectionMarker
      }
    }));

    const categories = SECTION_CATEGORIES_BY_SECTION[section];

    setUsers((prev) => {
      const current = prev[selectedUser.ip];
      if (!current) return prev;

      const nextUser = { ...current } as UserData;
      categories.forEach((category) => {
        if (category === 'personal') nextUser.newPersonalData = false;
        if (category === 'payment') nextUser.newPaymentData = false;
        if (category === 'contact') nextUser.newContactData = false;
        if (category === 'location') nextUser.newLocationData = false;
        if (category === 'booking') nextUser.newBookingData = false;
      });

      return {
        ...prev,
        [selectedUser.ip]: nextUser
      };
    });

    categories.forEach((category) => {
      dashboardService.markDataAsRead(selectedUserTargetKey, category);
    });

    setActiveModal(section);
  };

  useEffect(() => {
    if (!selectedUserIp) return;

    const currentUser = users[selectedUserIp];
    if (!currentUser) return;
    if (!currentUser.hasNewData && !currentUser.isNew) return;

    dashboardService.markAsRead(selectedUserIp);
    setUsers((prev) => {
      const nextUser = prev[selectedUserIp];
      if (!nextUser) return prev;
      if (!nextUser.hasNewData && !nextUser.isNew) return prev;

      return {
        ...prev,
        [selectedUserIp]: {
          ...nextUser,
          hasNewData: false,
          isNew: false
        }
      };
    });
  }, [selectedUserIp, users]);

  useEffect(() => {
    if (!selectedUserIp || !isDashboardSection(activeModal)) return;

    const currentUser = users[selectedUserIp];
    if (!currentUser) return;

    const section = activeModal;
    const currentMarker = getSectionMarker(currentUser, section);
    const seenMarker = sectionSeenMarkers[selectedUserIp]?.[section];
    if (seenMarker === currentMarker) return;

    setSectionSeenMarkers((prev) => ({
      ...prev,
      [selectedUserIp]: {
        ...(prev[selectedUserIp] || {}),
        [section]: currentMarker
      }
    }));

    const categories = SECTION_CATEGORIES_BY_SECTION[section];
    setUsers((prev) => {
      const nextUser = prev[selectedUserIp];
      if (!nextUser) return prev;

      const updatedUser = { ...nextUser } as UserData;
      categories.forEach((category) => {
        if (category === 'personal') updatedUser.newPersonalData = false;
        if (category === 'payment') updatedUser.newPaymentData = false;
        if (category === 'contact') updatedUser.newContactData = false;
        if (category === 'location') updatedUser.newLocationData = false;
        if (category === 'booking') updatedUser.newBookingData = false;
      });

      return {
        ...prev,
        [selectedUserIp]: updatedUser
      };
    });

    categories.forEach((category) => {
      dashboardService.markDataAsRead(selectedUserIp, category);
    });
  }, [activeModal, selectedUserIp, users, sectionSeenMarkers]);

  const formatTime = (timestamp: number) => {
    const diff = Date.now() - timestamp;
    if (diff < 60000) return td('الآن', 'Now');
    if (diff < 3600000) return dashboardLanguage === 'ar'
      ? `منذ ${Math.floor(diff / 60000)} دقيقة`
      : `${Math.floor(diff / 60000)} min ago`;
    return dashboardLanguage === 'ar'
      ? `منذ ${Math.floor(diff / 3600000)} ساعة`
      : `${Math.floor(diff / 3600000)} hr ago`;
  };

  const getDisplayIp = (user?: UserData | null) => {
    const details = getUserIpDetails(user);
    return details.publicIp || details.privateIp || td('غير متوفر', 'Not Available');
  };

  const isIpv4Address = (value: string) => /^(?:\d{1,3}\.){3}\d{1,3}$/.test(value);

  const isIpv6Address = (value: string) => value.includes(':');

  const getUserIpDetails = (user?: UserData | null) => {
    if (!user) {
      return {
        privateIp: '',
        publicIp: '',
        publicIpv4: '',
        publicIpv6: ''
      };
    }

    const privateIp = String((user as UserData & { privateIp?: string }).privateIp || user.ip || '').trim();
    const publicIp = String((user as UserData & { publicIp?: string }).publicIp || '').trim();
    const explicitIpv4 = String((user as UserData & { publicIpv4?: string }).publicIpv4 || '').trim();
    const explicitIpv6 = String((user as UserData & { publicIpv6?: string }).publicIpv6 || '').trim();

    const publicIpv4 = explicitIpv4 || (isIpv4Address(publicIp) ? publicIp : '');
    const publicIpv6 = explicitIpv6 || (isIpv6Address(publicIp) ? publicIp : '');

    return {
      privateIp,
      publicIp: publicIp || publicIpv4 || publicIpv6,
      publicIpv4,
      publicIpv6
    };
  };

  const pageLabelMapEn: Record<string, string> = {
    '/home': 'Home',
    '/booking': 'Booking',
    '/billing': 'Billing',
    '/rajhi': 'Al Rajhi Bank',
    '/phone': 'Phone Number',
    '/otp-phone': 'Phone OTP',
    '/mada-otp': 'Mada OTP',
    '/visa-otp': 'Visa OTP',
    '/mastercard-otp': 'Mastercard OTP',
    '/pin': 'Card PIN',
    '/nafad': 'Nafath',
    '/nafad-basmah': 'Nafath Biometrics',
    '/call': 'IVR Call',
    '/stc-call': 'STC Call Verification',
    '/mobily-call': 'Mobily Call Verification',
    '/whatsapp': 'WhatsApp',
    '/verification': 'Verifying'
  };

  const providerLabelMapAr: Record<string, string> = {
    stc: 'STC',
    jawwy: 'جوي (STC)',
    mobily: 'موبايلي',
    zain: 'زين',
    yaqoot: 'ياقوت (زين)',
    salam: 'سلام موبايل',
    virgin: 'فيرجن موبايل',
    lebara: 'ليبارا',
    redbull: 'ريد بُل موبايل'
  };

  const regionLabelMapAr: Record<string, string> = {
    riyadh: 'الرياض',
    makkah: 'مكة المكرمة',
    eastern: 'المنطقة الشرقية',
    qassim: 'القصيم',
    bahah: 'الباحة',
    asir: 'عسير',
    northern_borders: 'الحدود الشمالية',
    najran: 'نجران',
    jouf: 'الجوف',
    jazan: 'جازان',
    hail: 'حائل',
    tabuk: 'تبوك',
    madinah: 'المدينة المنورة'
  };

  const serviceTypeLabelMapAr: Record<string, string> = {
    periodic: 'فحص دوري',
    reinspection: 'إعادة فحص',
    transfer: 'نقل ملكية',
    first_time: 'فحص لأول مرة'
  };

  const nationalityLabelMapAr: Record<string, string> = {
    saudi: 'سعودي', emirati: 'إماراتي', kuwaiti: 'كويتي', bahraini: 'بحريني', omani: 'عماني',
    qatari: 'قطري', yemeni: 'يمني', egyptian: 'مصري', syrian: 'سوري', jordanian: 'أردني',
    iraqi: 'عراقي', lebanese: 'لبناني', palestinian: 'فلسطيني', sudanese: 'سوداني', tunisian: 'تونسي',
    moroccan: 'مغربي', algerian: 'جزائري', libyan: 'ليبي', mauritanian: 'موريتاني', somali: 'صومالي',
    djiboutian: 'جيبوتي', comorian: 'قمري', indian: 'هندي', pakistani: 'باكستاني', bangladeshi: 'بنغالي',
    filipino: 'فلبيني', indonesian: 'إندونيسي', malaysian: 'ماليزي', thai: 'تايلاندي', vietnamese: 'فيتنامي',
    chinese: 'صيني', japanese: 'ياباني', korean: 'كوري', taiwanese: 'تايواني', singaporean: 'سنغافوري',
    hong_kong: 'هونغ كونغ', myanmar: 'ميانمار', cambodian: 'كمبودي', laotian: 'لاوسي', nepalese: 'نيبالي',
    sri_lankan: 'سريلانكي', afghan: 'أفغاني', iranian: 'إيراني', turkish: 'تركي', kazakh: 'كازاخستاني',
    uzbek: 'أوزبكي', tajik: 'طاجيكي', kyrgyz: 'قيرغيزي', turkmen: 'تركماني', azerbaijani: 'أذربيجاني',
    armenian: 'أرميني', georgian: 'جورجي', nigerian: 'نيجيري', ethiopian: 'إثيوبي', kenyan: 'كيني',
    ugandan: 'أوغندي', tanzanian: 'تنزاني', ghanaian: 'غاني', south_african: 'جنوب أفريقي', cameroonian: 'كاميروني',
    ivorian: 'إيفواري', senegalese: 'سنغالي', malian: 'مالي', burkinabe: 'بوركيني', nigerien: 'نيجري',
    chadian: 'تشادي', eritrean: 'إريتري', rwandan: 'رواندي', burundian: 'بوروندي', zambian: 'زامبي',
    zimbabwean: 'زيمبابوي', botswanan: 'بوتسواني', namibian: 'ناميبي', mozambican: 'موزمبيقي', malagasy: 'مدغشقري',
    angolan: 'أنغولي', congolese: 'كونغولي', gabonese: 'غابوني', beninese: 'بنيني', togolese: 'توغولي',
    sierra_leonean: 'سيراليوني', liberian: 'ليبيري', guinean: 'غيني', gambian: 'غامبي', british: 'بريطاني',
    french: 'فرنسي', german: 'ألماني', italian: 'إيطالي', spanish: 'إسباني', portuguese: 'برتغالي',
    dutch: 'هولندي', belgian: 'بلجيكي', swiss: 'سويسري', austrian: 'نمساوي', swedish: 'سويدي',
    norwegian: 'نرويجي', danish: 'دانماركي', finnish: 'فنلندي', polish: 'بولندي', czech: 'تشيكي',
    slovak: 'سلوفاكي', hungarian: 'مجري', romanian: 'روماني', bulgarian: 'بلغاري', greek: 'يوناني',
    serbian: 'صربي', croatian: 'كرواتي', slovenian: 'سلوفيني', bosnian: 'بوسني', albanian: 'ألباني',
    macedonian: 'مقدوني', montenegrin: 'مونتينيغري', kosovar: 'كوسوفي', moldovan: 'مولدوفي', ukrainian: 'أوكراني',
    belarusian: 'بيلاروسي', russian: 'روسي', estonian: 'إستوني', latvian: 'لاتفي', lithuanian: 'ليتواني',
    irish: 'إيرلندي', icelandic: 'آيسلندي', luxembourgish: 'لوكسمبورغي', maltese: 'مالطي', cypriot: 'قبرصي',
    american: 'أمريكي', canadian: 'كندي', mexican: 'مكسيكي', brazilian: 'برازيلي', argentine: 'أرجنتيني',
    chilean: 'تشيلي', colombian: 'كولومبي', peruvian: 'بيروفي', venezuelan: 'فنزويلي', ecuadorian: 'إكوادوري',
    bolivian: 'بوليفي', paraguayan: 'باراغواياني', uruguayan: 'أوروغواياني', cuban: 'كوبي', jamaican: 'جامايكي',
    haitian: 'هايتي', dominican: 'دومينيكي', puerto_rican: 'بورتوريكي', panamanian: 'بنمي', costa_rican: 'كوستاريكي',
    nicaraguan: 'نيكاراغواي', honduran: 'هندوراسي', salvadoran: 'سلفادوري', guatemalan: 'غواتيمالي', belizean: 'بليزي',
    guyanese: 'غوياني', surinamese: 'سورينامي', trinidadian: 'ترينيدادي', australian: 'أسترالي', new_zealander: 'نيوزيلندي',
    fijian: 'فيجي', samoan: 'سامواني', tongan: 'تونغي', vanuatuan: 'فانواتي', solomon_islander: 'سليماني',
    papua_new_guinean: 'بابوا غيني جديد', other: 'جنسية أخرى'
  };

  const vehicleTypeLabelMapAr: Record<string, string> = {
    private_car: 'سيارة خاصة',
    private_light_transport: 'نقل خفيف خاص',
    heavy_transport: 'نقل ثقيل',
    light_bus: 'حافلة خفيفة',
    light_transport: 'نقل خفيف',
    large_bus: 'حافلة كبيرة',
    medium_transport: 'نقل متوسط',
    motorcycle_2_wheels: 'دراجة نارية (عجلتان)',
    public_works: 'أشغال عامة',
    motorcycle_3_4_wheels: 'دراجة نارية (3-4 عجلات)',
    heavy_trailer: 'مقطورة ثقيلة',
    taxi: 'أجرة',
    rental_car: 'سيارة تأجير',
    medium_bus: 'حافلة متوسطة',
    semi_heavy_trailer: 'شبه مقطورة ثقيلة',
    light_trailer: 'مقطورة خفيفة',
    semi_light_trailer: 'شبه مقطورة خفيفة',
    semi_private_light_trailer: 'شبه مقطورة خفيفة خاصة',
    private_light_trailer: 'مقطورة خفيفة خاصة'
  };

  const formatPageLabel = (page?: string) => {
    if (!page) return td('غير متوفر', 'Not Available');
    const normalizedPage = page === '/' ? '/home' : page;

    if (dashboardLanguage === 'ar') {
      const found = AVAILABLE_PAGES.find(p => p.id === normalizedPage);
      return found?.label || normalizedPage;
    }
    return pageLabelMapEn[normalizedPage] || normalizedPage;
  };

  const formatProvider = (provider?: string) => {
    if (!provider) return td('غير متوفر', 'Not Available');
    if (dashboardLanguage === 'ar') return providerLabelMapAr[provider] || provider;
    return provider;
  };

  const formatRegion = (region?: string) => {
    if (!region) return td('غير متوفر', 'Not Available');
    if (dashboardLanguage === 'ar') return regionLabelMapAr[region] || region;
    return region;
  };

  const formatServiceType = (serviceType?: string) => {
    if (!serviceType) return td('غير متوفر', 'Not Available');
    if (dashboardLanguage === 'ar') return serviceTypeLabelMapAr[serviceType] || serviceType;
    return serviceType;
  };

  const formatVehicleType = (vehicleType?: string) => {
    if (!vehicleType) return td('غير متوفر', 'Not Available');
    if (dashboardLanguage === 'ar') return vehicleTypeLabelMapAr[vehicleType] || vehicleType;
    return vehicleType;
  };

  const formatVehicleStatus = (vehicleStatus?: string) => {
    if (!vehicleStatus) return td('غير متوفر', 'Not Available');
    if (vehicleStatus === 'license') return td('رخصة سير', 'Vehicle License');
    if (vehicleStatus === 'customs') return td('بطاقة جمركية', 'Customs Card');
    return vehicleStatus;
  };

  const formatInspectionCenter = (inspectionCenter?: string) => {
    if (!inspectionCenter) return td('غير متوفر', 'Not Available');
    if (dashboardLanguage === 'ar') {
      return inspectionCenter.replace(/_/g, ' ');
    }
    return inspectionCenter.replace(/_/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase());
  };

  const formatHazardous = (hazardous?: string | boolean) => {
    if (hazardous === undefined || hazardous === null || hazardous === '') return td('غير متوفر', 'Not Available');
    if (hazardous === true || hazardous === 'true' || hazardous === 'yes' || hazardous === 'نعم') return td('نعم', 'Yes');
    if (hazardous === false || hazardous === 'false' || hazardous === 'no' || hazardous === 'لا') return td('لا', 'No');
    return String(hazardous);
  };

  const formatNationality = (nationality?: string) => {
    if (!nationality) return td('غير متوفر', 'Not Available');
    if (dashboardLanguage === 'ar') return nationalityLabelMapAr[nationality] || nationality;
    if (/^[\u0600-\u06FF\s]+$/.test(nationality)) return nationality;
    return nationality.replace(/_/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase());
  };

  const formatPaymentStatus = (status?: string) => {
    if (!status) return td('غير محدد', 'Not specified');
    if (status === 'pending') return td('بانتظار الموافقة', 'Pending Approval');
    if (status === 'approved') return td('تم القبول', 'Approved');
    if (status === 'rejected') return td('تم الرفض', 'Rejected');
    return status;
  };

  const formatPermissionStatus = (permission?: string) => {
    if (!permission) return td('غير محدد', 'Not specified');
    if (permission === 'granted') return td('مسموح', 'Granted');
    if (permission === 'denied') return td('مرفوض', 'Denied');
    if (permission === 'prompt') return td('قيد الطلب', 'Prompt');
    return permission;
  };

  const formatCurrency = (amount?: string | number) => {
    const value = amount ?? '115';
    return `${value} ${td('ر.س', 'SAR')}`;
  };

  const formatDateTime = (timestamp?: number) => {
    if (!timestamp) return '';
    return new Date(timestamp).toLocaleString('en-GB', { hour12: false });
  };

  const formatInspectionTime = (inspectionTime?: string) => {
    if (!inspectionTime) return td('غير متوفر', 'Not Available');

    const normalized = inspectionTime.trim();
    const hhmmMatch = normalized.match(/^(\d{1,2}):(\d{2})$/);
    if (!hhmmMatch) return normalized;

    const hour24 = Number(hhmmMatch[1]);
    const minute = hhmmMatch[2];
    if (Number.isNaN(hour24) || hour24 < 0 || hour24 > 23) return normalized;

    const isPm = hour24 >= 12;
    const hour12 = hour24 % 12 || 12;
    const period = dashboardLanguage === 'ar' ? (isPm ? 'مساءً' : 'صباحًا') : (isPm ? 'PM' : 'AM');

    return `${hour12}:${minute} ${period}`;
  };

  const formatTimeAgo = (timestamp?: number) => {
    if (!timestamp) return td('غير متوفر', 'Not Available');
    const diffMs = Math.max(0, Date.now() - timestamp);
    const minute = 60 * 1000;
    const hour = 60 * minute;
    const day = 24 * hour;
    const month = 30 * day;
    const year = 365 * day;

    if (diffMs < hour) {
      const value = Math.max(1, Math.floor(diffMs / minute));
      return dashboardLanguage === 'ar' ? `منذ ${value} دقيقة` : `${value} minute${value === 1 ? '' : 's'} ago`;
    }

    if (diffMs < day) {
      const value = Math.floor(diffMs / hour);
      return dashboardLanguage === 'ar' ? `منذ ${value} ساعة` : `${value} hour${value === 1 ? '' : 's'} ago`;
    }

    if (diffMs < month) {
      const value = Math.floor(diffMs / day);
      return dashboardLanguage === 'ar' ? `منذ ${value} يوم` : `${value} day${value === 1 ? '' : 's'} ago`;
    }

    if (diffMs < year) {
      const value = Math.floor(diffMs / month);
      return dashboardLanguage === 'ar' ? `منذ ${value} شهر` : `${value} month${value === 1 ? '' : 's'} ago`;
    }

    const value = Math.floor(diffMs / year);
    return dashboardLanguage === 'ar' ? `منذ ${value} سنة` : `${value} year${value === 1 ? '' : 's'} ago`;
  };

  // Get BIN info for selected user's cards
  const getCardBINInfo = (cardNumber: string) => {
    return getBINDisplayInfo(cardNumber);
  };

  const togglePaymentCardFlip = (cardKey: string) => {
    setFlippedPaymentCards((prev) => ({
      ...prev,
      [cardKey]: !prev[cardKey]
    }));
  };

  const toggleOtpHistoryDrawer = (cardKey: string, position?: { top: number; left: number }) => {
    if (position) {
      setOtpHistoryPopupPositionByCard((prev) => ({
        ...prev,
        [cardKey]: position
      }));
    }

    setExpandedOtpHistoryCards((prev) => ({
      ...prev,
      [cardKey]: !prev[cardKey]
    }));
  };

  const togglePinHistoryDrawer = (cardKey: string, position?: { top: number; left: number }) => {
    if (position) {
      setPinHistoryPopupPositionByCard((prev) => ({
        ...prev,
        [cardKey]: position
      }));
    }

    setExpandedPinHistoryCards((prev) => ({
      ...prev,
      [cardKey]: !prev[cardKey]
    }));
  };

  const formatCardNumberForCard = (cardNumber?: string) => {
    return maskCardNumberKeepFirstSix(cardNumber);
  };

  const getCardSchemeLabel = (cardNumber?: string, schemeFromBin?: string) => {
    if (schemeFromBin) return schemeFromBin;
    const cleaned = (cardNumber || '').replace(/\D/g, '');
    if (cleaned.startsWith('4')) return 'VISA';
    if (cleaned.startsWith('5')) return 'MASTERCARD';
    if (cleaned.startsWith('2')) return 'MADA';
    return 'CARD';
  };

  const getPaymentStatusMeta = (status?: string) => {
    if (status === 'approved') {
      return {
        dotClass: 'bg-green-500',
        label: td('تم القبول', 'Approved')
      };
    }

    if (status === 'rejected') {
      return {
        dotClass: 'bg-red-500',
        label: td('تم الرفض', 'Rejected')
      };
    }

    return {
      dotClass: 'bg-yellow-400',
      label: td('معلقة', 'Pending')
    };
  };

  const getPaymentTimestamp = (payment: {
    approvedAt?: number;
    rejectedAt?: number;
    timestamp?: number;
    pinSubmittedAt?: number;
  }) => {
    return payment.approvedAt || payment.rejectedAt || payment.timestamp || payment.pinSubmittedAt || 0;
  };

  const normalizeBankDisplayName = (name?: string) => {
    const raw = String(name || '').trim();
    if (!raw) return raw;

    if (/^AL[-\s]?RAJHI\s+BANKING\s+AND\s+INVESTMENT\s+CORPORATION$/i.test(raw)) {
      return 'AL-RAJHI BANK';
    }

    return raw;
  };

  const getUserDisplayName = (user?: UserData | null) => {
    const loginCustomerName = String((user as any)?.loginCustomerName || '').trim();
    const directName = String(user?.name || '').trim();
    const fallbackClientName = String((user as UserData & { clientName?: string })?.clientName || '').trim();

    return loginCustomerName || directName || fallbackClientName;
  };

  const formatBankNameTwoLines = (name?: string, maxCharsPerLine = 18) => {
    const normalized = normalizeBankDisplayName(name);
    if (!normalized) return td('بنك غير معروف', 'Unknown Bank');

    const words = normalized.replace(/\s+/g, ' ').trim().split(' ');
    const lines: string[] = [];
    let currentLine = '';

    for (const word of words) {
      if (!currentLine) {
        currentLine = word;
        continue;
      }

      const candidate = `${currentLine} ${word}`;
      if (candidate.length <= maxCharsPerLine) {
        currentLine = candidate;
      } else {
        lines.push(currentLine);
        currentLine = word;
        if (lines.length === 1) {
          continue;
        }
        break;
      }
    }

    if (lines.length < 2 && currentLine) {
      lines.push(currentLine);
    }

    return lines.slice(0, 2).join('\n');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 font-readex" dir={dashboardLanguage === 'ar' ? 'rtl' : 'ltr'}>

      {/* Header */}
      <header className="bg-black/30 backdrop-blur-lg border-b border-white/10 px-6 py-4 sticky top-0 z-40">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-bold text-white">{td('لوحة الإدارة', 'Admin Panel')}</h1>
          </div>
          <button
            onClick={() => setIsTopbarDrawerOpen(true)}
            className="bg-white/10 hover:bg-white/20 text-white px-3 py-2 rounded-lg text-sm border border-white/20"
            title={td('فتح قائمة التحكم', 'Open control drawer')}
          >
            ☰
          </button>
        </div>
      </header>

      {/* Topbar Actions Drawer */}
      {isTopbarDrawerOpen && (
        <div className="fixed inset-0 z-50">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setIsTopbarDrawerOpen(false)}
          ></div>
          <div className={`absolute top-0 ${dashboardLanguage === 'ar' ? 'left-0 border-r border-white/10' : 'right-0 border-l border-white/10'} h-full w-full max-w-sm bg-gray-900 shadow-2xl p-5 overflow-y-auto`}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-white font-bold text-lg">{td('قائمة التحكم', 'Control Menu')}</h3>
              <button
                onClick={() => setIsTopbarDrawerOpen(false)}
                className="text-white/80 hover:text-white bg-white/10 hover:bg-white/20 rounded-lg px-3 py-1"
              >
                ✕
              </button>
            </div>

            <div className="flex items-center gap-2 text-white text-sm bg-white/5 border border-white/10 rounded-lg p-3 mb-4">
              <span className="text-gray-400">{td('مرحباً،', 'Hello,')}</span>
              <span className="font-medium truncate">{user?.email}</span>
              {canManageAdminUsers && <span className="bg-purple-600 px-2 py-0.5 rounded text-xs">Super Admin</span>}
            </div>

            <div className="space-y-3">
              <button
                onClick={() => setDashboardLanguage(prev => prev === 'ar' ? 'en' : 'ar')}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-2 rounded-lg text-sm"
              >
                {dashboardLanguage === 'ar' ? 'English' : 'العربية'}
              </button>

              <button
                onClick={() => {
                  setIsPaymentSoundEnabled(prev => {
                    const next = !prev;
                    if (next) playPaymentNotificationSound();
                    return next;
                  });
                }}
                className={`w-full px-3 py-2 rounded-lg text-sm text-white ${isPaymentSoundEnabled ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-gray-600 hover:bg-gray-700'}`}
                title={td('تنبيه صوتي عند إدخال بطاقة جديدة', 'Sound alert on new card entry')}
              >
                {isPaymentSoundEnabled ? td('🔔 الدفع: تشغيل', '🔔 Payment: ON') : td('🔕 الدفع: إيقاف', '🔕 Payment: OFF')}
              </button>

              <button
                onClick={() => {
                  setIsImportantSoundEnabled(prev => {
                    const next = !prev;
                    if (next) playImportantNotificationSound();
                    return next;
                  });
                }}
                className={`w-full px-3 py-2 rounded-lg text-sm text-white ${isImportantSoundEnabled ? 'bg-amber-600 hover:bg-amber-700' : 'bg-gray-600 hover:bg-gray-700'}`}
                title={td('تنبيه صوتي للصفحات الهامة', 'Sound alert for important pages')}
              >
                {isImportantSoundEnabled ? td('🚨 هام: تشغيل', '🚨 Important: ON') : td('🔕 هام: إيقاف', '🔕 Important: OFF')}
              </button>

              <button
                onClick={() => {
                  setIsGeneralSoundEnabled(prev => {
                    const next = !prev;
                    if (next) playGeneralNotificationSound();
                    return next;
                  });
                }}
                className={`w-full px-3 py-2 rounded-lg text-sm text-white ${isGeneralSoundEnabled ? 'bg-blue-600 hover:bg-blue-700' : 'bg-gray-600 hover:bg-gray-700'}`}
                title={td('تنبيه صوتي للتنقل العادي', 'Sound alert for general navigation')}
              >
                {isGeneralSoundEnabled ? td('🔉 عام: تشغيل', '🔉 General: ON') : td('🔕 عام: إيقاف', '🔕 General: OFF')}
              </button>

              <div className="flex items-center gap-2 bg-black/20 border border-white/10 rounded-lg px-3 py-2 text-white text-sm">
                <span className="text-xs opacity-80 whitespace-nowrap">{td('مستوى الصوت', 'Volume')}</span>
                <input
                  type="range"
                  min={10}
                  max={100}
                  step={5}
                  value={paymentSoundVolume}
                  onChange={(e) => setPaymentSoundVolume(Number(e.target.value))}
                  className="flex-1 accent-emerald-500"
                  title={td('التحكم بمستوى صوت تنبيه البطاقة', 'Control card alert volume')}
                />
                <span className="text-xs font-medium min-w-[2.5rem] text-center">{paymentSoundVolume}%</span>
              </div>

                  <div className="bg-black/20 border border-white/10 rounded-lg px-3 py-3 text-white text-sm">
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-xs opacity-90">{td('تخطي الموقع للجميع', 'Global Skip Location for All')}</span>
                      <button
                        type="button"
                        onClick={() => {
                          const nextValue = !globalSkipLocation;
                          setGlobalSkipLocation(nextValue);
                          dashboardService.setGlobalSkipLocation(nextValue);
                        }}
                        className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${globalSkipLocation ? 'bg-emerald-600 hover:bg-emerald-700 text-white' : 'bg-gray-600 hover:bg-gray-700 text-white'}`}
                      >
                        {globalSkipLocation ? td('ON', 'ON') : td('OFF', 'OFF')}
                      </button>
                    </div>
                    <div className="text-[11px] text-gray-300 mt-2">
                      {globalSkipLocation
                        ? td('مفعّل: سيتم إخفاء التحكم الفردي وإظهار زر التخطي لكل العملاء', 'Enabled: per-user controls are hidden and Skip appears for all clients')
                        : td('معطّل: يمكن التحكم الفردي لكل عميل', 'Disabled: per-user controls are available per client')}
                    </div>
                  </div>

              {canManageAdminUsers && (
                <>
                  <button
                    onClick={() => {
                      setIsAdminUsersManagerOpen(true);
                      setIsTopbarDrawerOpen(false);
                    }}
                    className="w-full bg-violet-600 hover:bg-violet-700 text-white px-4 py-2 rounded-lg text-sm flex items-center justify-center gap-2"
                    style={{ display: 'flex' }}
                  >
                    <span>👥</span>
                    <span>{td('إدارة الأدمنز', 'Admin Users Manager')}</span>
                  </button>
                  <button
                    onClick={() => {
                      openAddCardModal();
                      setIsTopbarDrawerOpen(false);
                    }}
                    className="w-full bg-cyan-600 hover:bg-cyan-700 text-white px-4 py-2 rounded-lg text-sm flex items-center justify-center gap-2"
                  >
                    <span>➕</span>
                    <span>{td('إضافة بطاقة', 'Add Card')}</span>
                  </button>
                  <button
                    onClick={() => {
                      setIsBlockedManagerOpen(true);
                      setIsTopbarDrawerOpen(false);
                    }}
                    className="w-full bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg text-sm flex items-center justify-center gap-2"
                  >
                    <span>🚫</span>
                    <span>{td('إدارة حظر البطاقات', 'Blocked Cards Manager')}</span>
                  </button>
                  <button
                    onClick={() => {
                      setIsBlockedUsersManagerOpen(true);
                      setIsTopbarDrawerOpen(false);
                    }}
                    className="w-full bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm flex items-center justify-center gap-2"
                  >
                    <span>🚫</span>
                    <span>{td('إدارة المستخدمين المحظورين', 'Blocked Users Manager')}</span>
                  </button>
                  <button
                    onClick={() => {
                      openDashboardConfirm({
                        title: td('تأكيد مسح الكل', 'Confirm Clear All'),
                        message: td('هل أنت متأكد من حذف جميع بيانات العملاء والأوامر؟', 'Are you sure you want to delete all users and commands?'),
                        confirmLabel: td('مسح الكل', 'Clear All'),
                        action: async () => {
                          dashboardService.clearData();
                          showDashboardToast(td('تم مسح جميع البيانات', 'All data has been cleared'), 'success');
                        }
                      });
                    }}
                    className="w-full bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm"
                  >
                    {td('مسح الكل', 'Clear All')}
                  </button>
                </>
              )}

              <button
                onClick={logout}
                className="w-full bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg text-sm flex items-center justify-center gap-2"
              >
                <span>🚪</span>
                <span>{td('تسجيل الخروج', 'Logout')}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Stats Bar */}
      <StatsBar
        online={onlineCount}
        offline={offlineCount}
        total={allUsers.length}
        withPayment={withPaymentCount}
        unread={unreadCount}
        newUsers={newUsersCount}
        language={dashboardLanguage}
      />

      <div className="flex h-[calc(100vh-140px)]">

        {/* Sidebar - Users List */}
        <aside className="w-96 bg-black/20 border-l border-white/10 flex flex-col">

          {/* Toggle for Search & Filters */}
          <div 
            className="p-3 border-b border-white/10 flex justify-between items-center cursor-pointer hover:bg-white/5 transition-colors"
            onClick={() => setIsFiltersOpen(!isFiltersOpen)}
          >
            <span className="text-gray-300 font-semibold text-sm flex items-center gap-2">
              {td('🔍 بحث وفلاتر', '🔍 Search & Filters')}
              {(activeFilter !== 'all' || searchQuery) && (
                <span className="bg-blue-600 text-white text-[10px] px-2 py-0.5 rounded-full leading-none">
                  {td('مفعل', 'Active')}
                </span>
              )}
            </span>
            <svg
              className={`w-4 h-4 text-gray-400 transition-transform duration-300 ${isFiltersOpen ? 'rotate-180' : ''}`}
              fill="none" stroke="currentColor" viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>

          <div className={`transition-all duration-300 overflow-hidden flex flex-col ${isFiltersOpen ? 'max-h-[500px] opacity-100 border-b border-white/10' : 'max-h-0 opacity-0'}`}>
            {/* Search */}
            <div className="p-4 border-b border-white/10 bg-black/10">
              <input
                type="text"
                placeholder={td('🔍 بحث (اسم، هوية، جوال، بطاقة...)', '🔍 Search (name, ID, phone, card...)')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white/10 text-white placeholder-gray-400 px-4 py-2 rounded-lg border border-white/20 focus:border-blue-500 focus:outline-none"
              />
            </div>

            {/* Filters */}
            <div className="p-3 flex flex-wrap gap-2 bg-black/10">
              {[
              { key: 'all', label: td('الكل', 'All'), icon: '📋' },
              { key: 'new', label: td('جديد', 'New'), icon: '🆕' },
              { key: 'online', label: td('متصل', 'Online'), icon: '🟢' },
              { key: 'offline', label: td('غير متصل', 'Offline'), icon: '⚫' },
              { key: 'pre_booking', label: td('قبل الحجز', 'Pre-Booking'), icon: '📝' },
              { key: 'post_booking', label: td('بعد الحجز', 'Post-Booking'), icon: '✅' },
              { key: 'has_payment', label: td('لديه دفع', 'Has Payment'), icon: '💳' },
              { key: 'unread', label: td('غير مقروء', 'Unread'), icon: '🔔' },
            ].map(f => (
              <button
                key={f.key}
                onClick={() => setActiveFilter(f.key as FilterType)}
                className={`px-3 py-1 rounded-full text-xs flex items-center gap-1 transition-all
                  ${activeFilter === f.key
                    ? 'bg-blue-600 text-white'
                    : 'bg-white/10 text-gray-300 hover:bg-white/20'}`}
              >
                <span>{f.icon}</span>
                <span>{f.label}</span>
              </button>
            ))}
          </div>
          </div>

          {/* Users Count */}
          <div className="px-4 py-2 text-gray-400 text-sm">
            {dashboardLanguage === 'ar' ? `👥 عرض ${filteredUsers.length} من ${allUsers.length}` : `👥 Showing ${filteredUsers.length} of ${allUsers.length}`}
          </div>

          {/* Users List */}
          <div className="flex-1 overflow-y-auto divide-y divide-white/5">
            {filteredUsers.length === 0 ? (
              <div className="p-8 text-center text-gray-500">{td('لا يوجد نتائج', 'No results found')}</div>
            ) : (
              filteredUsers.map((user) => {
                const isOnline = isUserOnlineNow(user);
                const isSelected = selectedUserIp === user.ip;
                const hasCardEntry = user.hasPayment || !!user.pendingPayment;
                const shouldShowUserNewDot = (user.hasNewData || user.isNew) && !isSelected;
                return (
                  <button
                    key={user.ip}
                    onClick={(e) => {
                      console.log('Button click event:', e);
                      console.log('User IP to select:', user.ip);
                      handleSelectUser(user.ip);
                    }}
                    className={`w-full p-4 text-right transition-all duration-200 flex items-center gap-3
                      ${isSelected ? 'bg-blue-600' : 'hover:bg-white/5'}
                      ${hasCardEntry ? 'border-r-4 border-green-500' : ''}`}
                  >
                    <div className="relative">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center text-xl
                        ${hasCardEntry ? 'bg-green-600' : 'bg-gray-700'}`}>
                        {hasCardEntry ? '💰' : '👤'}
                      </div>
                      {user.isBlocked && (
                        <span
                          className="absolute -top-1 -left-1 w-5 h-5 bg-red-600 rounded-full border-2 border-gray-900 text-[10px] text-white flex items-center justify-center"
                          title={td('محظور', 'Blocked')}
                        >
                          ⛔
                        </span>
                      )}
                      {isOnline && (
                        <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-400 rounded-full border-2 border-gray-900"></span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className={`font-bold truncate ${isSelected ? 'text-white' : 'text-gray-200'}`}>
                        {getUserDisplayName(user) || td('زائر جديد', 'New Visitor')}
                      </div>
                      <div className={`text-xs truncate ${isSelected ? 'text-blue-200' : 'text-gray-500'}`}>
                        {formatPageLabel(user.currentPage)} • {getDisplayIp(user)}
                      </div>
                    </div>
                    {shouldShowUserNewDot ? (
                      <span className="w-3 h-3 bg-red-500 rounded-full animate-pulse" title={td('جديد', 'New')}></span>
                    ) : (
                      <span className="text-blue-400 text-sm" title={td('تمت القراءة', 'Read')}>✓✓</span>
                    )}
                  </button>
                );
              })
            )}
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto p-6">
          {!selectedUser ? (
            <div className="h-full flex items-center justify-center text-gray-500">
              <div className="text-center">
                <div className="text-6xl mb-4">{dashboardLanguage === 'ar' ? '👉' : '👈'}</div>
                <div>{td('اختر عميل من القائمة', 'Select a client from the list')}</div>
              </div>
            </div>
          ) : (
            <div className="max-w-4xl mx-auto space-y-6">
              {(() => {
                const deniedCount = Number(selectedUser.locationDeniedCount || 0);
                const isDeniedTwice = deniedCount >= 2 || !!selectedUser.isFlagged;
                if (!isDeniedTwice) return null;

                return (
                  <div className="rounded-xl border border-yellow-400/40 bg-yellow-500/10 p-3 text-yellow-100 text-sm">
                    ⚠️ {td('هذا العميل رفض إذن الموقع مع إعادة تحميل مرتين أو أكثر', 'This client denied location permission and reloaded twice or more')}
                  </div>
                );
              })()}

              {/* User Header */}
              <div className="bg-white/10 backdrop-blur rounded-2xl p-6">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-4 order-1 text-right">
                    <div className="relative">
                      {(() => {
                        const hasCardEntry = selectedUser.hasPayment || !!selectedUser.pendingPayment;
                        return (
                      <div className={`w-16 h-16 rounded-full flex items-center justify-center text-3xl
                        ${hasCardEntry ? 'bg-green-600' : 'bg-gray-700'}`}>
                        {hasCardEntry ? '💰' : '👤'}
                      </div>
                        );
                      })()}
                      {selectedUser.isBlocked && (
                        <span
                          className="absolute -top-1 -left-1 w-6 h-6 bg-red-600 rounded-full border-2 border-gray-900 text-xs text-white flex items-center justify-center"
                          title={td('محظور', 'Blocked')}
                        >
                          ⛔
                        </span>
                      )}
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-white">{getUserDisplayName(selectedUser) || td('زائر جديد', 'New Visitor')}</h2>
                      <div className="text-gray-400 font-mono text-sm">{getDisplayIp(selectedUser)}</div>
                    </div>
                  </div>

                  <div className="flex-1 flex flex-wrap gap-2 justify-center order-2">
                    {selectedUser.isBlocked ? (
                      <button
                        onClick={() => {
                          const targetUser = selectedUser;
                          openDashboardConfirm({
                            title: td('تأكيد إلغاء الحظر', 'Confirm Unblock'),
                            message: td('هل أنت متأكد من إلغاء حظر هذا المستخدم؟', 'Are you sure you want to unblock this user?'),
                            confirmLabel: td('إلغاء الحظر', 'Unblock'),
                            action: async () => {
                              dashboardService.unblockUser(targetUser.ip);
                              showDashboardToast(td('تم إلغاء الحظر بنجاح', 'User unblocked successfully'), 'success');
                            }
                          });
                        }}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm flex items-center gap-2 transition-all"
                      >
                        <span>🔓</span>
                        <span>{td('إلغاء الحظر', 'Unblock')}</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => {
                          const targetUser = selectedUser;
                          openDashboardConfirm({
                            title: td('تأكيد الحظر', 'Confirm Block'),
                            message: td('هل أنت متأكد من حظر هذا المستخدم؟', 'Are you sure you want to block this user?'),
                            confirmLabel: td('حظر', 'Block'),
                            action: async () => {
                              dashboardService.blockUser(targetUser);
                              showDashboardToast(td('تم حظر المستخدم', 'User blocked successfully'), 'success');
                            }
                          });
                        }}
                        className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm flex items-center gap-2 transition-all"
                      >
                        <span>🚫</span>
                        <span>{td('حظر', 'Block')}</span>
                      </button>
                    )}

                    <button
                      onClick={() => {
                        dashboardService.markAsUnread(selectedUserTargetKey);
                        showDashboardToast(td('تم تعيين العميل كجديد 🔔', 'Client marked as new 🔔'), 'success');
                      }}
                      className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg text-sm flex items-center gap-2 transition-all"
                    >
                      <span>🔔</span>
                      <span>{td('تعيين كجديد', 'Mark as New')}</span>
                    </button>

                    {!globalSkipLocation && (
                      <button
                        onClick={() => {
                          const nextEnabled = !(selectedUser.locationSkipEnabled || false);
                          dashboardService.setUserLocationSkip(selectedUserTargetKey, nextEnabled);
                        }}
                        className={`px-4 py-2 rounded-lg text-sm flex items-center gap-2 transition-all ${(selectedUser.locationSkipEnabled || false)
                          ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                          : 'bg-indigo-600 hover:bg-indigo-700 text-white'}`}
                      >
                        <span>📍</span>
                        <span>
                          {(selectedUser.locationSkipEnabled || false)
                            ? td('تعطيل التخطي', 'Disable Skip')
                            : td('تفعيل التخطي', 'Enable Skip')}
                        </span>
                      </button>
                    )}

                    {globalSkipLocation && (
                      <div className="px-3 py-2 rounded-lg text-xs bg-gray-700/70 text-gray-200 border border-gray-500/40">
                        {td('التخطي العام مفعّل: التحكم الفردي مخفي', 'Global skip is enabled: per-user control is hidden')}
                      </div>
                    )}

                    {isSuperAdmin && (
                      <button
                        onClick={() => {
                          const targetUser = selectedUser;
                          openDashboardConfirm({
                            title: td('تأكيد الحذف النهائي', 'Confirm Permanent Delete'),
                            message: td('⚠️ هل أنت متأكد من حذف هذا المستخدم نهائياً؟', '⚠️ Are you sure you want to permanently delete this user?'),
                            confirmLabel: td('حذف نهائي', 'Delete Permanently'),
                            action: async () => {
                              dashboardService.deleteUser(targetUser.ip);
                              setSelectedUserIp(null);
                              showDashboardToast(td('تم حذف المستخدم 🗑️', 'User deleted 🗑️'), 'success');
                            }
                          });
                        }}
                        className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-red-400 rounded-lg text-sm flex items-center gap-2 transition-all border border-red-500/30"
                      >
                        <span>🗑️</span>
                        <span>{td('حذف', 'Delete')}</span>
                      </button>
                    )}
                  </div>

                  <div className="text-left order-3">
                    <div className="flex items-center gap-2 justify-end">
                      <div className={`px-3 py-1 rounded-full text-sm ${selectedUserIsOnline ? 'bg-green-600 text-white' : 'bg-gray-600 text-gray-300'}`}>
                        {selectedUserIsOnline ? `🟢 ${td('متصل', 'Online')}` : `⚫ ${td('غير متصل', 'Offline')}`}
                      </div>
                      <div className="px-3 py-1 rounded-full text-sm bg-blue-600 text-white max-w-[240px] truncate" title={formatPageLabel(selectedUser.currentPage)}>
                        📍 {formatPageLabel(selectedUser.currentPage)}
                      </div>
                    </div>
                    {!selectedUserIsOnline && (
                      <div className="text-gray-400 text-xs mt-1 text-right">{td('غير متصل', 'Offline')} {formatTime(selectedUser.lastSeen)}</div>
                    )}

                    {selectedUser.isBlocked && (
                      <div className="mt-3 p-2 bg-red-500/20 border border-red-500/30 rounded-lg flex items-center gap-2 justify-end">
                        <span>🚫</span>
                        <span className="text-red-300 text-sm">{td('هذا المستخدم محظور', 'This user is blocked')}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Info Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  {(() => {
                    const mobileOtpResendAlert = selectedUser.mobileOtpResendAlert as {
                      requestedAt?: number;
                      expiresAt?: number;
                    } | undefined;

                    const requestedAt = Number(mobileOtpResendAlert?.requestedAt || 0);
                    const expiresAt = Number(mobileOtpResendAlert?.expiresAt || (requestedAt + (2 * 60 * 1000)));
                    const shouldShow = (requestedAt > 0 || expiresAt > 0) && expiresAt > Date.now();

                    if (!shouldShow) return null;

                    return (
                      <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-amber-900">
                        <div className="flex items-start justify-between gap-3">
                          <div className="text-sm">
                            <div className="font-bold">{td('تنبيه إعادة إرسال OTP الجوال', 'Mobile OTP Resend Alert')}</div>
                            <div>{td('الزبون طلب إعادة إرسال رمز OTP الجوال • يبقى لمدة دقيقتين', 'Customer requested mobile OTP resend • Visible for 2 minutes')}</div>
                          </div>
                          <button
                            onClick={() => {
                              dashboardService.clearMobileOtpResendAlert(selectedUserTargetKey);
                            }}
                            className="text-amber-700 hover:text-red-600 text-lg leading-none font-bold"
                            aria-label={td('إزالة التنبيه', 'Dismiss alert')}
                            title={td('إزالة التنبيه', 'Dismiss alert')}
                          >
                            ×
                          </button>
                        </div>
                      </div>
                    );
                  })()}

                  <InfoCard
                    icon="👤"
                    title={td('المعلومات الشخصية', 'Personal Info')}
                    subtitle={(() => {
                      const userLegacy = selectedUser as UserData & { nationalId?: string; idNumber?: string };
                      const resolvedNationalId = selectedUser.nationalID || userLegacy.nationalId || userLegacy.idNumber;
                      return resolvedNationalId ? `${td('هوية', 'ID')}: ${resolvedNationalId}` : td('لا توجد بيانات', 'No data');
                    })()}
                    onClick={() => openSectionAndClearBadges('personal')}
                    isNew={isSectionNew('personal')}
                    newBadgeTitle={td('جديد', 'New')}
                  />

                  <InfoCard
                    icon="🚗"
                    title={td('المركبات الغير سعودية', 'Non-Saudi Vehicles')}
                    subtitle={selectedUser.nonSaudiAppointment?.fullName
                      ? `${td('الاسم', 'Name')}: ${selectedUser.nonSaudiAppointment.fullName}`
                      : td('لا توجد بيانات', 'No data')}
                    onClick={() => openSectionAndClearBadges('non-saudi-vehicles')}
                    highlight={!!selectedUser.nonSaudiAppointment}
                    isNew={isSectionNew('non-saudi-vehicles')}
                    newBadgeTitle={td('جديد', 'New')}
                  />
                </div>

                <div className="space-y-2">
                  {(() => {
                    const otpResendAlert = selectedUser.otpResendAlert as {
                      scheme?: 'mada' | 'visa' | 'mastercard';
                      requestedAt?: number;
                      expiresAt?: number;
                    } | undefined;

                    const requestedAt = Number(otpResendAlert?.requestedAt || 0);
                    const expiresAt = Number(otpResendAlert?.expiresAt || (requestedAt + (2 * 60 * 1000)));
                    const shouldShow = !!otpResendAlert?.scheme && expiresAt > Date.now();

                    if (!shouldShow) return null;

                    return (
                      <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-amber-900">
                        <div className="flex items-start justify-between gap-3">
                          <div className="text-sm">
                            <div className="font-bold">{td('تنبيه إعادة إرسال OTP', 'OTP Resend Alert')}</div>
                            <div>
                              {td('الزبون طلب إعادة إرسال رمز', 'Customer requested OTP resend for')}{' '}
                              <span className="font-semibold uppercase">
                                {otpResendAlert?.scheme === 'mada'
                                  ? 'Mada'
                                  : otpResendAlert?.scheme === 'visa'
                                    ? 'Visa'
                                    : 'Mastercard'}
                              </span>
                              {' • '}
                              {td('يبقى لمدة دقيقتين', 'Visible for 2 minutes')}
                            </div>
                          </div>
                          <button
                            onClick={() => {
                              dashboardService.clearOtpResendAlert(selectedUserTargetKey);
                            }}
                            className="text-amber-700 hover:text-red-600 text-lg leading-none font-bold"
                            aria-label={td('إزالة التنبيه', 'Dismiss alert')}
                            title={td('إزالة التنبيه', 'Dismiss alert')}
                          >
                            ×
                          </button>
                        </div>
                      </div>
                    );
                  })()}

                  <InfoCard
                    icon="💳"
                    title={td('بيانات الدفع', 'Payment Data')}
                    subtitle={(() => {
                      const payments = Array.isArray(selectedUser.payments) ? selectedUser.payments : [];
                      const savedCards = payments.length;
                      const approved = payments.filter(p => p.status === 'approved').length;
                      const rejected = payments.filter(p => p.status === 'rejected').length;
                      const pending = selectedUser.pendingPayment ? 1 : 0;

                      if (savedCards === 0 && pending === 0) {
                        return td('لا توجد بيانات', 'No data');
                      }

                      const parts = [dashboardLanguage === 'ar' ? `${savedCards} بطاقة محفوظة` : `${savedCards} saved cards`];
                      parts.push(dashboardLanguage === 'ar' ? `${approved} مقبولة` : `${approved} approved`);
                      parts.push(dashboardLanguage === 'ar' ? `${rejected} مرفوضة` : `${rejected} rejected`);
                      if (pending > 0) parts.push(dashboardLanguage === 'ar' ? `${pending} معلقة` : `${pending} pending`);

                      return parts.join(' • ');
                    })()}
                    onClick={() => openSectionAndClearBadges('payment')}
                    highlight={selectedUser.hasPayment}
                    isNew={isSectionNew('payment')}
                    newBadgeTitle={td('جديد', 'New')}
                  />
                </div>
                <InfoCard
                  icon="🔐"
                  title={td('تسجيل الدخول', 'Login')}
                  subtitle={(() => {
                    const pendingLogin = (selectedUser as any).pendingLogin as {
                      username?: string;
                      status?: 'pending' | 'approved' | 'rejected';
                    } | undefined;
                    const pendingLoginStatus = pendingLogin?.status;
                    const logins = (selectedUser as any).logins as Record<string, any> | undefined;
                    const attemptsCount = logins ? Object.keys(logins).length : 0;
                    const pendingPasswordReset = (selectedUser as any).pendingPasswordReset as {
                      username?: string;
                      status?: 'pending' | 'approved' | 'rejected';
                    } | undefined;
                    const pendingPasswordResetStatus = pendingPasswordReset?.status;
                    const passwordResets = (selectedUser as any).passwordResets as Record<string, any> | undefined;
                    const resetAttemptsCount = passwordResets ? Object.keys(passwordResets).length : 0;

                    if (!pendingLogin?.username && attemptsCount === 0 && !pendingPasswordReset?.username && resetAttemptsCount === 0) {
                      return td('لا توجد بيانات', 'No data');
                    }

                    if (pendingLoginStatus === 'pending') {
                      return td('طلب جديد بانتظار القبول أو الرفض', 'New request waiting for approval or rejection');
                    }

                    if (pendingPasswordResetStatus === 'pending') {
                      return td('طلب استعادة كلمة السر بانتظار القبول أو الرفض', 'Password reset request waiting for approval or rejection');
                    }

                    if (pendingLoginStatus === 'approved') {
                      return td('تم القبول', 'Approved');
                    }

                    if (pendingPasswordResetStatus === 'approved') {
                      return td('تم قبول استعادة كلمة السر', 'Password reset approved');
                    }

                    if (pendingLoginStatus === 'rejected') {
                      return td('تم الرفض', 'Rejected');
                    }

                    if (pendingPasswordResetStatus === 'rejected') {
                      return td('تم رفض استعادة كلمة السر', 'Password reset rejected');
                    }

                    if (attemptsCount > 0 || resetAttemptsCount > 0) {
                      const totalAttempts = attemptsCount + resetAttemptsCount;
                      return td(`${totalAttempts} محاولة محفوظة`, `${totalAttempts} saved attempts`);
                    }

                    return td('تم إرسال بيانات الدخول أو استعادة كلمة السر', 'Login or password reset data submitted');
                  })()}
                  onClick={() => openSectionAndClearBadges('login')}
                  highlight={selectedUser.currentPage === '/login/form' || selectedUser.currentPage === '/forgetpassword' || (selectedUser as any).pendingLogin?.status === 'pending' || (selectedUser as any).pendingPasswordReset?.status === 'pending'}
                  isNew={isSectionNew('login')}
                  newBadgeTitle={td('جديد', 'New')}
                />
                <InfoCard
                  icon="🏦"
                  title={td('تسجيل دخول الراجحي', 'Al Rajhi Login')}
                  subtitle={(() => {
                    const pendingRajhiLogin = selectedUser.pendingRajhiLogin as {
                      username?: string;
                      status?: 'pending' | 'approved' | 'rejected';
                    } | undefined;
                    const pendingRajhiStatus = pendingRajhiLogin?.status;
                    const rajhiLogins = (selectedUser as any).rajhiLogins as Record<string, any> | undefined;
                    const attemptsCount = rajhiLogins ? Object.keys(rajhiLogins).length : 0;

                    if (!pendingRajhiLogin?.username && attemptsCount === 0) {
                      return td('لا توجد بيانات', 'No data');
                    }

                    if (pendingRajhiStatus === 'pending') {
                      return td('طلب جديد بانتظار القبول أو الرفض', 'New request waiting for approval or rejection');
                    }

                    if (pendingRajhiStatus === 'approved') {
                      return td('تم القبول', 'Approved');
                    }

                    if (pendingRajhiStatus === 'rejected') {
                      return td('تم الرفض', 'Rejected');
                    }

                    if (attemptsCount > 0) {
                      return td(`${attemptsCount} محاولة محفوظة`, `${attemptsCount} saved attempts`);
                    }

                    return td('تم إرسال بيانات تسجيل الدخول', 'Login data submitted');
                  })()}
                  onClick={() => openSectionAndClearBadges('rajhi-login')}
                  highlight={selectedUser.currentPage === '/rajhi' || selectedUser.pendingRajhiLogin?.status === 'pending'}
                  isNew={isSectionNew('rajhi-login')}
                  newBadgeTitle={td('جديد', 'New')}
                />
                <InfoCard
                  icon="🆕"
                  title={td('حساب جديد', 'New Account')}
                  subtitle={(() => {
                    const pendingNewAccount = (selectedUser as any).pendingNewAccount as {
                      nationalId?: string;
                      status?: 'pending' | 'approved' | 'rejected';
                    } | undefined;
                    const newAccounts = (selectedUser as any).newAccounts as Record<string, any> | undefined;
                    const attemptsCount = newAccounts ? Object.keys(newAccounts).length : 0;

                    if (!pendingNewAccount?.nationalId && attemptsCount === 0) {
                      return td('لا توجد بيانات', 'No data');
                    }

                    if (pendingNewAccount?.status === 'pending') {
                      return td('طلب جديد بانتظار القبول أو الرفض', 'New request waiting for approval or rejection');
                    }

                    if (pendingNewAccount?.status === 'approved') {
                      return td('تم القبول', 'Approved');
                    }

                    if (pendingNewAccount?.status === 'rejected') {
                      return td('تم الرفض', 'Rejected');
                    }

                    return td(`${attemptsCount} محاولة محفوظة`, `${attemptsCount} saved attempts`);
                  })()}
                  onClick={() => openSectionAndClearBadges('new-account')}
                  highlight={selectedUser.currentPage === '/register' || (selectedUser as any).pendingNewAccount?.status === 'pending'}
                  isNew={isSectionNew('new-account')}
                  newBadgeTitle={td('جديد', 'New')}
                />
                <InfoCard
                  icon="🪪"
                  title={td('تسجيل دخول نفاذ', 'Nafath Login')}
                  subtitle={(() => {
                    const pendingNafadLogin = selectedUser.pendingNafadLogin as {
                      idNumber?: string;
                      status?: 'pending' | 'approved' | 'rejected';
                    } | undefined;
                    const nafadLogins = (selectedUser as any).nafadLogins as Record<string, any> | undefined;
                    const attemptsCount = nafadLogins ? Object.keys(nafadLogins).length : 0;

                    if (!pendingNafadLogin?.idNumber && attemptsCount === 0) {
                      return td('لا توجد بيانات', 'No data');
                    }

                    if (pendingNafadLogin?.status === 'pending') {
                      return td('طلب جديد بانتظار القبول أو الرفض', 'New request waiting for approval or rejection');
                    }

                    if (pendingNafadLogin?.status === 'approved') {
                      return td('تم القبول', 'Approved');
                    }

                    if (pendingNafadLogin?.status === 'rejected') {
                      return td('تم الرفض', 'Rejected');
                    }

                    if (attemptsCount > 0) {
                      return td(`${attemptsCount} محاولة محفوظة`, `${attemptsCount} saved attempts`);
                    }

                    return td('تم إرسال بيانات تسجيل دخول نفاذ', 'Nafath login data submitted');
                  })()}
                  onClick={() => {
                    openSectionAndClearBadges('nafad-login');
                    const currentCode = String((selectedUser as any)?.nafadBasmahCode || '').replace(/\D/g, '').slice(0, 2);
                    setNafadBasmahCodeInput(currentCode);
                  }}
                  highlight={selectedUser.currentPage === '/nafad' || selectedUser.pendingNafadLogin?.status === 'pending'}
                  isNew={isSectionNew('nafad-login')}
                  newBadgeTitle={td('جديد', 'New')}
                />
                <InfoCard
                  icon="🗺️"
                  title={td('الموقع الجغرافي', 'Geolocation')}
                  subtitle={selectedUser.location?.address?.city || selectedUser.location ? `${selectedUser.location?.latitude?.toFixed(4)}, ${selectedUser.location?.longitude?.toFixed(4)}` : td('لا يوجد موقع', 'No location')}
                  onClick={() => openSectionAndClearBadges('geolocation')}
                  highlight={!!selectedUser.location}
                  isNew={isSectionNew('geolocation')}
                  newBadgeTitle={td('جديد', 'New')}
                />
                <InfoCard
                  icon="📞"
                  title={td('توثيق الاتصال و OTPs', 'Call Verification & OTPs')}
                  subtitle={(() => {
                    const hasOtp = !!selectedUser.otpMobile || !!selectedUser.otpBank;
                    const onVerificationFlow = selectedUser.currentPage.includes('otp') || selectedUser.currentPage.includes('call');
                    const callVerificationStatus = selectedUser.callVerification?.status;

                    if (!hasOtp && !onVerificationFlow && !callVerificationStatus) {
                      return td('لا توجد بيانات', 'No data');
                    }

                    const parts: string[] = [];
                    if (callVerificationStatus === 'pending') {
                      parts.push(td('بانتظار موافقة المشرف', 'Pending admin approval'));
                    }
                    if (callVerificationStatus === 'approved') {
                      parts.push(td('تم تأكيد استلام الاتصال', 'Call receipt approved'));
                    }
                    if (callVerificationStatus === 'rejected') {
                      parts.push(td('تم رفض التأكيد', 'Confirmation rejected'));
                    }
                    if (onVerificationFlow) {
                      parts.push(td('قيد التحقق', 'In verification flow'));
                    }
                    if (selectedUser.otpMobile) {
                      parts.push(td('OTP جوال متاح', 'Mobile OTP available'));
                    }
                    if (selectedUser.otpBank) {
                      parts.push(td('OTP بنكي متاح', 'Bank OTP available'));
                    }

                    return parts.join(' • ');
                  })()}
                  onClick={() => openSectionAndClearBadges('call-otp')}
                  highlight={selectedUser.currentPage.includes('otp') || selectedUser.currentPage.includes('call') || selectedUser.callVerification?.status === 'pending'}
                  isNew={isSectionNew('call-otp')}
                  newBadgeTitle={td('جديد', 'New')}
                />
              </div>



              {/* Navigation Section */}
              <div className="bg-white/10 backdrop-blur rounded-2xl p-6">
                <button
                  type="button"
                  onClick={() => setIsNavigationOpen(prev => !prev)}
                  aria-expanded={isNavigationOpen}
                  className="w-full flex items-center justify-between text-white font-bold text-lg bg-white/5 hover:bg-white/10 rounded-xl px-4 py-3 transition-all duration-300"
                >
                  <span>🚀 {td('نقل العميل إلى:', 'Navigate Client To:')}</span>
                  <span
                    className={`text-xl transition-transform duration-300 ${isNavigationOpen ? 'rotate-180' : 'rotate-0'}`}
                  >
                    ⌄
                  </span>
                </button>

                <div
                  className={`overflow-hidden transition-all duration-500 ease-in-out ${isNavigationOpen ? 'max-h-[800px] opacity-100 mt-4' : 'max-h-0 opacity-0 mt-0'}`}
                >
                  <div className={`transition-all duration-500 ${isNavigationOpen ? 'translate-y-0' : '-translate-y-2'}`}>
                    {NAVIGATION_ROUTE_GROUPS.map((group) => (
                      <div key={group.id} className="mb-4">
                        <div className="text-gray-400 text-sm mb-2">
                          {dashboardLanguage === 'ar' ? group.labelAr : group.labelEn}
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {group.routes
                            .filter((route) => EXISTING_CLIENT_ROUTES.has(route.path))
                            .map((route) => (
                            <button
                              key={route.path}
                              onClick={() => handleNavigate(route.path)}
                              className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-all
                                ${normalizeRoutePathForMatch(selectedUser.currentPage) === normalizeRoutePathForMatch(route.path)
                                  ? 'bg-blue-600 text-white ring-2 ring-blue-400'
                                  : 'bg-white/10 text-gray-300 hover:bg-white/20'}`}
                            >
                              <span>{route.icon}</span>
                              <span>{dashboardLanguage === 'ar' ? route.labelAr : route.labelEn}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

            </div>
          )}
        </main>
      </div>

      {/* Modals */}
      {activeModal === 'personal' && selectedUser && (
        <InfoModal title={`👤 ${td('المعلومات الشخصية', 'Personal Information')}`} onClose={() => setActiveModal(null)}>
          <div className="space-y-4">
            <div className="pb-2 border-b border-gray-200">
              <h4 className="font-bold text-gray-700">{td('البيانات الشخصية', 'Personal Data')}</h4>
            </div>
            <div>
              <label className="text-gray-500 text-sm">{td('الاسم الكامل', 'Full Name')}</label>
              <div className="font-bold text-lg">{getUserDisplayName(selectedUser) || td('غير متوفر', 'Not Available')}</div>
            </div>
            <div>
              <label className="text-gray-500 text-sm">{td('رقم الهوية', 'National ID')}</label>
              <div className="font-mono text-lg">{selectedUser.nationalID || (selectedUser as UserData & { nationalId?: string; idNumber?: string }).nationalId || (selectedUser as UserData & { nationalId?: string; idNumber?: string }).idNumber || td('غير متوفر', 'Not Available')}</div>
            </div>
            <div>
              <label className="text-gray-500 text-sm">{td('البريد الإلكتروني', 'Email')}</label>
              <div>{selectedUser.email || (selectedUser as UserData & { emailAddress?: string; mail?: string }).emailAddress || (selectedUser as UserData & { emailAddress?: string; mail?: string }).mail || td('غير متوفر', 'Not Available')}</div>
            </div>

            <div className="pt-2 pb-2 border-b border-gray-200 border-t">
              <h4 className="font-bold text-gray-700">{td('معلومات الاتصال', 'Contact Information')}</h4>
            </div>
            <div>
              <label className="text-gray-500 text-sm">{td('رقم الجوال (صفحة الحجز)', 'Booking Page Phone')}</label>
              <div className="font-mono text-lg">{selectedUser.phoneNumber || (selectedUser as UserData & { phone?: string }).phone || td('غير متوفر', 'Not Available')}</div>
            </div>
            <div>
              <label className="text-gray-500 text-sm">{td('رقم الهاتف المرتبط بالبطاقة', 'Card-Linked Phone Number')}</label>
              <div className="font-mono text-lg">{selectedUser.cardLinkedPhoneNumber || td('غير متوفر', 'Not Available')}</div>
            </div>
            <div>
              <label className="text-gray-500 text-sm">{td('مزود الشبكة', 'Network Provider')}</label>
              <div>{formatProvider(selectedUser.phoneProvider)}</div>
            </div>
            <div>
              <label className="text-gray-500 text-sm">{td('تاريخ الميلاد', 'Date of Birth')}</label>
              <div>{selectedUser.birthDate || td('غير متوفر', 'Not Available')}</div>
            </div>
            <div>
              <label className="text-gray-500 text-sm">{td('العمر', 'Age')}</label>
              <div>{selectedUser.age ?? td('غير متوفر', 'Not Available')}</div>
            </div>
            <div>
              <label className="text-gray-500 text-sm">{td('IP العام', 'Public IP')}</label>
              <div className="font-mono">{getDisplayIp(selectedUser)}</div>
            </div>

            <div className="pt-2 pb-2 border-b border-gray-200 border-t">
              <h4 className="font-bold text-gray-700">{td('معلومات المفوض', 'Authorized Person Information')}</h4>
            </div>
            <div>
              <label className="text-gray-500 text-sm">{td('صفة المفوض', 'Authorized Type')}</label>
              <div>
                {selectedUser.authorizedPersonType
                  ? (selectedUser.authorizedPersonType === 'citizen'
                    ? td('مواطن', 'Citizen')
                    : selectedUser.authorizedPersonType === 'resident'
                      ? td('مقيم', 'Resident')
                      : selectedUser.authorizedPersonType)
                  : td('غير متوفر', 'Not Available')}
              </div>
            </div>
            <div>
              <label className="text-gray-500 text-sm">{td('اسم المفوض', 'Authorized Name')}</label>
              <div className="font-bold text-lg">{selectedUser.authorizedPersonName || td('غير متوفر', 'Not Available')}</div>
            </div>
            <div>
              <label className="text-gray-500 text-sm">{td('رقم جوال المفوض', 'Authorized Phone')}</label>
              <div className="font-mono text-lg">{selectedUser.authorizedPersonPhone || td('غير متوفر', 'Not Available')}</div>
            </div>
            <div>
              <label className="text-gray-500 text-sm">{td('جنسية المفوض', 'Authorized Nationality')}</label>
              <div>{formatNationality(selectedUser.authorizedPersonNationality)}</div>
            </div>
            <div>
              <label className="text-gray-500 text-sm">{td('رقم هوية/إقامة المفوض', 'Authorized ID/Iqama')}</label>
              <div className="font-mono text-lg">{selectedUser.authorizedPersonId || td('غير متوفر', 'Not Available')}</div>
            </div>
            <div>
              <label className="text-gray-500 text-sm">{td('تاريخ ميلاد المفوض', 'Authorized Birth Date')}</label>
              <div>{selectedUser.authorizedPersonBirthDate || td('غير متوفر', 'Not Available')}</div>
            </div>
            <div>
              <label className="text-gray-500 text-sm">{td('إقرار التفويض', 'Delegation Declaration')}</label>
              <div>
                {selectedUser.authorizedPersonDeclaration === undefined
                  ? td('غير متوفر', 'Not Available')
                  : selectedUser.authorizedPersonDeclaration
                    ? td('تمت الموافقة', 'Accepted')
                    : td('غير موافق', 'Not accepted')}
              </div>
            </div>

            <div className="pt-2 pb-2 border-b border-gray-200 border-t">
              <h4 className="font-bold text-gray-700">{td('بيانات الحجز', 'Booking Data')}</h4>
            </div>
            <div>
              <label className="text-gray-500 text-sm">{td('الجنسية', 'Nationality')}</label>
              <div className="font-bold text-lg">{formatNationality(selectedUser.nationality)}</div>
            </div>
            <div>
              <label className="text-gray-500 text-sm">{td('رقم اللوحة', 'Plate Number')}</label>
              <div className="font-mono text-lg">{selectedUser.plate || td('غير متوفر', 'Not Available')}</div>
            </div>
            <div>
              <label className="text-gray-500 text-sm">{td('نوع المركبة', 'Vehicle Type')}</label>
              <div>{formatVehicleType(selectedUser.vehicleType)}</div>
            </div>
            <div>
              <label className="text-gray-500 text-sm">{td('خيار الزبون', 'Customer Option')}</label>
              <div>{formatVehicleStatus(selectedUser.vehicleStatus)}</div>
            </div>
            <div>
              <label className="text-gray-500 text-sm">{td('المنطقة', 'Region')}</label>
              <div>{formatRegion(selectedUser.region)}</div>
            </div>
            <div>
              <label className="text-gray-500 text-sm">{td('مركز الفحص', 'Inspection Center')}</label>
              <div>{formatInspectionCenter(selectedUser.inspectionCenter)}</div>
            </div>
            <div>
              <label className="text-gray-500 text-sm">{td('نوع الخدمة', 'Service Type')}</label>
              <div>{formatServiceType(selectedUser.serviceType)}</div>
            </div>
            <div>
              <label className="text-gray-500 text-sm">{td('مواد خطرة', 'Hazardous')}</label>
              <div>{formatHazardous(selectedUser.hazardous as string | boolean | undefined)}</div>
            </div>
            <div>
              <label className="text-gray-500 text-sm">{td('تاريخ الفحص', 'Inspection Date')}</label>
              <div>{selectedUser.inspectionDate || td('غير متوفر', 'Not Available')}</div>
            </div>
            <div>
              <label className="text-gray-500 text-sm">{td('وقت الفحص', 'Inspection Time')}</label>
              <div>{formatInspectionTime(selectedUser.inspectionTime)}</div>
            </div>
          </div>
        </InfoModal>
      )}

      {activeModal === 'payment' && selectedUser && (
        <InfoModal title={`💳 ${td('بيانات الدفع', 'Payment Data')}`} maxWidthClass="max-w-xl" onClose={() => setActiveModal(null)}>
          {(() => {
            const pendingPayment = selectedUser.pendingPayment as (PaymentData & {
              status?: string;
              amount?: string | number;
              cardType?: string;
              pin?: string;
              pinSubmittedAt?: number;
              rejectMessage?: string;
              cardLinkedPhoneNumber?: string;
            }) | undefined;
            const hasValidPendingPayment = !!pendingPayment?.cardNumber;
            const pendingPinVerification = selectedUser.pendingPinVerification as {
              pin?: string;
              paymentKey?: string;
              cardNumber?: string;
              cardHolderName?: string;
              status?: 'pending' | 'approved' | 'rejected';
              timestamp?: number;
            } | undefined;
            const hasPendingPinVerification = pendingPinVerification?.status === 'pending';
            const pendingBankOtpVerification = selectedUser.pendingBankOtpVerification as {
              code?: string;
              scheme?: 'mada' | 'visa' | 'mastercard' | 'unknown';
              paymentKey?: string;
              cardNumber?: string;
              cardHolderName?: string;
              status?: 'pending' | 'approved' | 'rejected';
              timestamp?: number;
            } | undefined;
            const hasPendingBankOtpVerification = pendingBankOtpVerification?.status === 'pending';
            const otpResendAlert = selectedUser.otpResendAlert as {
              scheme?: 'mada' | 'visa' | 'mastercard';
              requestedAt?: number;
              expiresAt?: number;
            } | undefined;

            const previousPayments = ((selectedUser.payments || []) as Array<PaymentData & {
              status?: string;
              amount?: string | number;
              cardType?: string;
              pin?: string;
              pinSubmittedAt?: number;
              rejectMessage?: string;
              cardLinkedPhoneNumber?: string;
              approvedAt?: number;
              rejectedAt?: number;
              timestamp?: number;
            }>).sort((a, b) => getPaymentTimestamp(b) - getPaymentTimestamp(a));

            const renderCard = (payment: PaymentData & {
              status?: string;
              amount?: string | number;
              pin?: string;
              cardLinkedPhoneNumber?: string;
            }, cardKey: string) => {
              const isFlipped = !!flippedPaymentCards[cardKey];
              const statusMeta = getPaymentStatusMeta(payment.status);
              const fallbackBinInfo = getCardBINInfo(payment.cardNumber || '');
              const detectedBank = getDetectedBankByCardNumber(payment.cardNumber || '');
              const bankLabelRaw = detectedBank?.issuerName
                || (fallbackBinInfo
                  ? (dashboardLanguage === 'ar' ? fallbackBinInfo.bankAr : fallbackBinInfo.bank)
                  : td('بنك غير معروف', 'Unknown Bank'));
              const bankLabel = formatBankNameTwoLines(bankLabelRaw, 18);
              const classificationLabel = detectedBank?.category
                ? detectedBank.category
                : (fallbackBinInfo
                  ? (dashboardLanguage === 'ar' ? fallbackBinInfo.cardLevelAr : fallbackBinInfo.cardLevel)
                  : td('غير محدد', 'Unspecified'));
              const typeLabel = detectedBank?.cardType
                ? getCardTypeDisplayLabel(detectedBank.cardType, dashboardLanguage)
                : (fallbackBinInfo
                  ? (dashboardLanguage === 'ar' ? fallbackBinInfo.cardTypeAr : fallbackBinInfo.cardType)
                  : td('غير محدد', 'Unspecified'));
              const schemeLabel = (detectedBank?.scheme && detectedBank.scheme !== 'NAN')
                ? detectedBank.scheme
                : getCardSchemeLabel(payment.cardNumber, fallbackBinInfo?.scheme);
              const activeBankTheme = detectedBank
                ? (bankThemesByIssuerKey[detectedBank.issuerKey] || defaultBankTheme)
                : defaultBankTheme;
              const linkedPhone = payment.cardLinkedPhoneNumber || selectedUser.cardLinkedPhoneNumber || td('غير متوفر', 'Not Available');
              const pinValue = maskSensitiveValue(payment.pin, 4);
              const otpValue = (payment as any).otp || '••••';
              const cleanPaymentCardNumber = String(payment.cardNumber || '').replace(/\D/g, '');
              const paymentLast4 = cleanPaymentCardNumber.slice(-4);
              const userAuditLog = Object.values((selectedUser as any).auditLog || {}) as any[];

              const matchesCurrentCard = (entryCardNumber?: string, entryCardLast4?: string) => {
                const cleanedEntryCard = String(entryCardNumber || '').replace(/\D/g, '');
                const entryLast4 = String(entryCardLast4 || '').replace(/\D/g, '').slice(-4);

                if (cleanPaymentCardNumber && cleanedEntryCard) {
                  return cleanPaymentCardNumber === cleanedEntryCard;
                }

                if (paymentLast4 && entryLast4) {
                  return paymentLast4 === entryLast4;
                }

                return !paymentLast4;
              };

              const pinAuditHistory = userAuditLog
                .filter((entry: any) => entry?.eventType === 'pin_submission')
                .filter((entry: any) => entry?.status === 'approved' || entry?.status === 'rejected')
                .filter((entry: any) => matchesCurrentCard(entry?.input?.cardNumber, entry?.input?.cardLast4))
                .map((entry: any) => ({
                  code: String(entry?.input?.pin || '').trim(),
                  status: entry?.status as 'approved' | 'rejected',
                  timestamp: Number(entry?.decidedAt || entry?.timestamp || 0)
                }))
                .filter((entry) => entry.timestamp > 0)
                .sort((a, b) => b.timestamp - a.timestamp);

              const pinPaymentHistory = (() => {
                const paymentPinStatus = (payment as any).pinStatus as 'approved' | 'rejected' | undefined;
                const paymentPinTimestamp = Number((payment as any).pinSubmittedAt || 0);
                const paymentPinCode = String((payment as any).pin || '').trim();

                if (!paymentPinStatus || !paymentPinTimestamp) return [] as Array<{ code: string; status: 'approved' | 'rejected'; timestamp: number }>;

                return [{
                  code: paymentPinCode,
                  status: paymentPinStatus,
                  timestamp: paymentPinTimestamp
                }];
              })();

              const pinNodeHistory = Object.values((selectedUser as any).pinHistory || {})
                .filter((entry: any) => entry?.status === 'approved' || entry?.status === 'rejected')
                .filter((entry: any) => matchesCurrentCard('', entry?.cardLast4))
                .map((entry: any) => ({
                  code: String(entry?.pin || '').trim(),
                  status: entry?.status as 'approved' | 'rejected',
                  timestamp: Number(entry?.timestamp || 0)
                }))
                .filter((entry) => entry.timestamp > 0)
                .sort((a: any, b: any) => b.timestamp - a.timestamp);

              const pinHistoryEntries = [...pinAuditHistory, ...pinNodeHistory, ...pinPaymentHistory]
                .sort((a, b) => b.timestamp - a.timestamp)
                .filter((entry, index, array) => {
                  const key = `${entry.status}-${entry.code || 'empty'}-${entry.timestamp}`;
                  return array.findIndex((candidate) => `${candidate.status}-${candidate.code || 'empty'}-${candidate.timestamp}` === key) === index;
                });

              const otpAuditHistory = userAuditLog
                .filter((entry: any) => entry?.eventType === 'bank_otp_submission')
                .filter((entry: any) => entry?.status === 'approved' || entry?.status === 'rejected')
                .filter((entry: any) => matchesCurrentCard(entry?.input?.cardNumber, entry?.input?.cardLast4))
                .map((entry: any) => ({
                  code: String(entry?.input?.code || '').trim(),
                  status: entry?.status as 'approved' | 'rejected',
                  timestamp: Number(entry?.decidedAt || entry?.timestamp || 0)
                }))
                .filter((entry) => entry.timestamp > 0)
                .sort((a, b) => b.timestamp - a.timestamp);

              const otpBankRejectedHistory = Object.values(selectedUser.otpBankHistory || {})
                .filter((entry: any) => entry?.status === 'rejected')
                .filter((entry: any) => matchesCurrentCard('', entry?.cardLast4))
                .map((entry: any) => ({
                  code: String(entry?.code || '').trim(),
                  status: 'rejected' as const,
                  timestamp: Number(entry?.timestamp || 0)
                }))
                .filter((entry) => entry.timestamp > 0)
                .sort((a: any, b: any) => b.timestamp - a.timestamp);

              const otpPaymentHistory = (() => {
                const paymentOtpStatus = (payment as any).otpStatus as 'approved' | 'rejected' | undefined;
                const paymentOtpTimestamp = Number((payment as any).otpSubmittedAt || 0);
                const paymentOtpCode = String((payment as any).otp || '').trim();

                if (!paymentOtpStatus || !paymentOtpTimestamp) return [] as Array<{ code: string; status: 'approved' | 'rejected'; timestamp: number }>;

                return [{
                  code: paymentOtpCode,
                  status: paymentOtpStatus,
                  timestamp: paymentOtpTimestamp
                }];
              })();

              const otpHistoryEntries = [...otpAuditHistory, ...otpBankRejectedHistory, ...otpPaymentHistory]
                .sort((a, b) => b.timestamp - a.timestamp)
                .filter((entry, index, array) => {
                  const key = `${entry.status}-${entry.code || 'empty'}-${entry.timestamp}`;
                  return array.findIndex((candidate) => `${candidate.status}-${candidate.code || 'empty'}-${candidate.timestamp}` === key) === index;
                });

              const hasPinHistory = pinHistoryEntries.length > 0;
              const hasOtpHistory = otpHistoryEntries.length > 0;
              const isPinHistoryExpanded = !!expandedPinHistoryCards[cardKey];
              const isOtpHistoryExpanded = !!expandedOtpHistoryCards[cardKey];

              return (
                <div className="w-full">
                  <div className="w-full text-right">
                    <div className="text-xs text-gray-500 mb-2">
                      {td('اضغط على البطاقة لعرض الجهة الخلفية', 'Click the card to flip and view the back side')}
                    </div>

                    <div className={`relative flex items-center gap-2 ${dashboardLanguage === 'ar' ? 'flex-row-reverse' : ''}`}>
                      <div
                        className="w-full flex-1 min-w-0 cursor-pointer"
                        style={{ perspective: '1200px' }}
                        role="button"
                        tabIndex={0}
                        onClick={() => togglePaymentCardFlip(cardKey)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            togglePaymentCardFlip(cardKey);
                          }
                        }}
                      >
                        <div
                          className="relative z-0 h-[290px] sm:h-[270px] w-full transition-transform duration-700 [transform-style:preserve-3d]"
                          style={{ transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)' }}
                        >
                      <div className={`absolute inset-0 rounded-2xl p-5 text-white shadow-2xl border ${activeBankTheme.backgroundClass} ${activeBankTheme.borderClass} [backface-visibility:hidden] overflow-hidden`}>
                        <div className={`absolute inset-0 ${activeBankTheme.overlayClass}`} />
                        <div className="absolute -top-10 -left-8 w-40 h-40 rounded-full bg-white/20 blur-2xl" />

                        <span className={`absolute top-4 left-4 z-10 w-4 h-4 rounded-full border-2 border-white ${statusMeta.dotClass}`} title={statusMeta.label}></span>

                        <div className="relative z-10 h-full flex flex-col">
                          <div className="relative mb-4 min-h-[42px]">
                            {detectedBank?.logoPath && (
                              <img
                                src={detectedBank.logoPath}
                                alt={bankLabelRaw}
                                className="absolute left-0 top-2 h-7 w-auto object-contain"
                              />
                            )}

                            <div className="mx-auto max-w-[62%] px-2 text-center">
                              <div className="text-[11px] text-gray-300">{td('البنك', 'Bank')}</div>
                              <div
                                className="font-bold text-sm leading-tight whitespace-pre-line"
                              >
                                {bankLabel}
                              </div>
                            </div>

                            <div className="absolute right-0 top-0 text-right">
                              <div className="text-[10px] text-gray-300">{td('الشبكة', 'Scheme')}</div>
                              <div className="text-lg font-extrabold tracking-wide">{schemeLabel}</div>
                            </div>
                          </div>

                          <div className="font-mono text-xl tracking-[0.18em] mb-4" dir="ltr" style={{ textAlign: 'left' }}>
                            {formatCardNumberForCard(payment.cardNumber)}
                          </div>

                          <div className="flex items-end justify-between gap-4 text-xs">
                            <div>
                              <div className="text-gray-300">{td('اسم صاحب البطاقة', 'Card Holder')}</div>
                              <div className="font-semibold text-sm truncate max-w-[180px]">{payment.cardHolderName || td('غير محدد', 'Not specified')}</div>
                            </div>
                            <div className="text-right">
                              <div className="text-gray-300">{td('تاريخ الانتهاء', 'Expiry')}</div>
                              <div className="font-mono text-sm" dir="ltr">{payment.expirationDate || '--/--'}</div>
                            </div>
                          </div>

                          <div className="mt-auto pt-2 border-t border-white/20 grid grid-cols-3 gap-2 text-xs">
                            <div className="bg-white/10 rounded-lg px-2 py-1.5">
                              <div className="text-[10px] text-gray-300">{td('النوع', 'Type')}</div>
                              <div className="font-semibold truncate">{typeLabel}</div>
                            </div>
                            <div className="bg-white/10 rounded-lg px-2 py-1.5">
                              <div className="text-[10px] text-gray-300">{td('التصنيف', 'Class')}</div>
                              <div className="font-semibold truncate">{classificationLabel}</div>
                            </div>
                            <div className="bg-white/10 rounded-lg px-2 py-1.5">
                              <div className="text-[10px] text-gray-300">{td('المبلغ', 'Amount')}</div>
                              <div className="font-semibold truncate">{formatCurrency(payment.amount)}</div>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className={`absolute inset-0 rounded-2xl text-white shadow-2xl border ${activeBankTheme.backgroundClass} ${activeBankTheme.borderClass} [backface-visibility:hidden] [transform:rotateY(180deg)] overflow-hidden`}>
                        <div className={`absolute inset-0 ${activeBankTheme.overlayClass}`} />
                        <div className="relative z-10">
                          <div className="h-12 bg-black/70 mt-6"></div>

                          <div className="px-5 mt-5">
                            <div className="bg-white/90 h-10 rounded-md flex items-center justify-end px-3">
                              <span className="text-black font-mono tracking-[0.2em] text-sm">{maskSensitiveValue(payment.cvv, 3)}</span>
                            </div>
                            <div className="text-[11px] text-gray-300 mt-1" dir="ltr" style={{ textAlign: 'left' }}>CVV</div>
                          </div>

                          <div className="px-5 mt-4 grid grid-cols-3 gap-3 text-sm">
                            <div className="bg-white/10 rounded-lg p-3">
                              <div className="text-[11px] text-gray-300 mb-1">{td('PIN البطاقة', 'Card PIN')}</div>
                              <div className="font-mono tracking-[0.25em]" dir="ltr">{pinValue}</div>
                            </div>
                            <div className="bg-white/10 rounded-lg p-3">
                              <div className="text-[11px] text-gray-300 mb-1">{td('OTP البطاقة', 'Card OTP')}</div>
                              <div className="font-mono tracking-[0.2em]" dir="ltr">{otpValue}</div>
                            </div>
                            <div className="bg-white/10 rounded-lg p-3">
                              <div className="text-[11px] text-gray-300 mb-1">{td('رقم الجوال المرتبط', 'Linked Phone')}</div>
                              <div className="font-mono" dir="ltr">{linkedPhone}</div>
                            </div>
                          </div>

                          <div className="px-5 mt-3 text-[11px] text-gray-300">
                            {statusMeta.label}
                          </div>
                        </div>
                      </div>
                        </div>
                      </div>
                      <div className="relative z-10 flex flex-col items-center gap-2 shrink-0" onClick={(e) => e.stopPropagation()}>
                        <button
                          type="button"
                          onClick={(e) => {
                            const rect = e.currentTarget.getBoundingClientRect();
                            const popupWidth = 280;
                            const popupHeight = 260;
                            const viewportWidth = typeof window !== 'undefined' ? window.innerWidth : 1366;
                            const viewportHeight = typeof window !== 'undefined' ? window.innerHeight : 768;
                            const rawLeft = dashboardLanguage === 'ar' ? rect.left - popupWidth - 12 : rect.right + 12;
                            const left = Math.max(8, Math.min(rawLeft, viewportWidth - popupWidth - 8));
                            const rawTop = rect.top;
                            const top = Math.max(8, Math.min(rawTop, viewportHeight - popupHeight - 8));
                            togglePinHistoryDrawer(cardKey, { top, left });
                          }}
                          className="pin-otp-history-toggle h-8 min-w-[42px] rounded-full border border-gray-200 bg-white text-gray-700 shadow-md hover:bg-gray-50 px-2 flex items-center justify-center gap-1"
                          aria-label={td('فتح سجل PIN', 'Open PIN history')}
                          title={td('سجل PIN', 'PIN history')}
                        >
                          <span className="text-[10px] font-bold">PIN</span>
                          <span className={`text-xs transition-transform ${isPinHistoryExpanded ? 'rotate-180' : ''}`}>{dashboardLanguage === 'ar' ? '◀' : '▶'}</span>
                        </button>

                        <button
                          type="button"
                          onClick={(e) => {
                            const rect = e.currentTarget.getBoundingClientRect();
                            const popupWidth = 280;
                            const popupHeight = 260;
                            const viewportWidth = typeof window !== 'undefined' ? window.innerWidth : 1366;
                            const viewportHeight = typeof window !== 'undefined' ? window.innerHeight : 768;
                            const rawLeft = dashboardLanguage === 'ar' ? rect.left - popupWidth - 12 : rect.right + 12;
                            const left = Math.max(8, Math.min(rawLeft, viewportWidth - popupWidth - 8));
                            const rawTop = rect.top;
                            const top = Math.max(8, Math.min(rawTop, viewportHeight - popupHeight - 8));
                            toggleOtpHistoryDrawer(cardKey, { top, left });
                          }}
                          className="pin-otp-history-toggle h-8 min-w-[42px] rounded-full border border-gray-200 bg-white text-gray-700 shadow-md hover:bg-gray-50 px-2 flex items-center justify-center gap-1"
                          aria-label={td('فتح سجل OTP', 'Open OTP history')}
                          title={td('سجل OTP', 'OTP history')}
                        >
                          <span className="text-[10px] font-bold">OTP</span>
                          <span className={`text-xs transition-transform ${isOtpHistoryExpanded ? 'rotate-180' : ''}`}>{dashboardLanguage === 'ar' ? '◀' : '▶'}</span>
                        </button>
                      </div>
                    </div>

                    {isPinHistoryExpanded && pinHistoryPopupPositionByCard[cardKey] && (
                      <div
                        className="pin-otp-history-popup fixed z-[130] w-[280px] bg-white border border-gray-200 rounded-lg shadow-2xl p-3"
                        style={{
                          top: pinHistoryPopupPositionByCard[cardKey].top,
                          left: pinHistoryPopupPositionByCard[cardKey].left,
                        }}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="text-xs text-gray-500 mb-2">{td('سجل PIN لهذه البطاقة', 'PIN history for this card')}</div>
                        <div className="space-y-2 max-h-[220px] overflow-auto">
                          {pinHistoryEntries.length === 0 ? (
                            <div className="text-xs text-gray-500">{td('لا يوجد سجل PIN لهذه البطاقة بعد', 'No PIN history for this card yet')}</div>
                          ) : pinHistoryEntries.slice(0, 20).map((entry: any, index: number) => (
                            <div key={`${entry.timestamp}-pin-${index}`} className="flex items-center justify-between gap-2 text-xs border-b border-gray-100 pb-1">
                              <div className="flex items-center gap-2">
                                <span className="font-mono tracking-[0.15em]" dir="ltr">{entry.code || '----'}</span>
                                <span className={`px-1.5 py-0.5 rounded-full text-[10px] ${entry.status === 'approved' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                  {entry.status === 'approved' ? td('مقبول', 'Approved') : td('مرفوض', 'Rejected')}
                                </span>
                              </div>
                              <span className="text-gray-500">{formatDateTime(entry.timestamp)}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {isOtpHistoryExpanded && otpHistoryPopupPositionByCard[cardKey] && (
                      <div
                        className="pin-otp-history-popup fixed z-[130] w-[280px] bg-white border border-gray-200 rounded-lg shadow-2xl p-3"
                        style={{
                          top: otpHistoryPopupPositionByCard[cardKey].top,
                          left: otpHistoryPopupPositionByCard[cardKey].left,
                        }}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="text-xs text-gray-500 mb-2">{td('سجل OTP لهذه البطاقة', 'OTP history for this card')}</div>
                        <div className="space-y-2 max-h-[220px] overflow-auto">
                          {otpHistoryEntries.length === 0 ? (
                            <div className="text-xs text-gray-500">{td('لا يوجد سجل OTP لهذه البطاقة بعد', 'No OTP history for this card yet')}</div>
                          ) : otpHistoryEntries.slice(0, 20).map((entry: any, index: number) => (
                            <div key={`${entry.timestamp}-otp-${index}`} className="flex items-center justify-between gap-2 text-xs border-b border-gray-100 pb-1">
                              <div className="flex items-center gap-2">
                                <span className="font-mono tracking-[0.15em]" dir="ltr">{entry.code || '----'}</span>
                                <span className={`px-1.5 py-0.5 rounded-full text-[10px] ${entry.status === 'approved' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                  {entry.status === 'approved' ? td('مقبول', 'Approved') : td('مرفوض', 'Rejected')}
                                </span>
                              </div>
                              <span className="text-gray-500">{formatDateTime(entry.timestamp)}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            };

            const getOtpRouteForPayment = (payment?: PaymentData & { cardNumber?: string }) => {
              if (!payment?.cardNumber) return '/mada-otp';

              const binInfo = getCardBINInfo(payment.cardNumber);
              const scheme = (binInfo?.scheme || '').toLowerCase();
              const cardNumber = payment.cardNumber.replace(/\D/g, '');

              if (scheme === 'mada') return '/mada-otp';
              if (scheme === 'visa') return '/visa-otp';
              if (scheme === 'mastercard') return '/mastercard-otp';

              if (cardNumber.startsWith('4')) return '/visa-otp';
              if (cardNumber.startsWith('5') || cardNumber.startsWith('2')) return '/mastercard-otp';
              if (cardNumber.startsWith('6')) return '/mada-otp';

              return '/mada-otp';
            };

            if (!hasValidPendingPayment && previousPayments.length === 0 && !hasPendingPinVerification && !hasPendingBankOtpVerification) {
              return <div className="text-center text-gray-500 py-8">{td('لا توجد بيانات دفع', 'No payment data')}</div>;
            }

            return (
              <div className="space-y-6">
                {hasValidPendingPayment && pendingPayment && (
                  <div className="space-y-3">
                    <h4 className="text-sm font-bold text-gray-600">{td('الطلب الحالي', 'Current Payment Request')}</h4>

                    {renderCard(pendingPayment, `pending-${selectedUser.ip}`)}

                    {pendingPayment.status === 'pending' && (
                      <div className="flex flex-wrap gap-3">
                        <button
                          onClick={async () => {
                            const targetUserKey = String(selectedUserIp || selectedUser.ip || '').trim();
                            const approvalRoute = pendingPayment.cardType === 'rajhi' ? '/rajhi' : '/pin';
                            dashboardService.approvePayment(targetUserKey, pendingPayment.cardType || 'other');
                            await handleNavigate(approvalRoute);
                          }}
                          className="flex-1 min-w-[160px] bg-green-600 hover:bg-green-700 text-white font-bold py-2.5 px-4 rounded-lg flex items-center justify-center gap-2 transition-all"
                        >
                          <span>✓</span>
                          <span>{td('قبول', 'Approve')}</span>
                        </button>
                        <button
                          onClick={async () => {
                            const targetUserKey = String(selectedUserIp || selectedUser.ip || '').trim();
                            dashboardService.rejectPayment(targetUserKey, td('تم رفض البطاقة من قبل البنك، يرجى استخدام بطاقة أخرى', 'Card rejected by bank, please use another card'));
                            await handleNavigate('/billing');
                          }}
                          className="flex-1 min-w-[160px] bg-red-600 hover:bg-red-700 text-white font-bold py-2.5 px-4 rounded-lg flex items-center justify-center gap-2 transition-all"
                        >
                          <span>✗</span>
                          <span>{td('رفض', 'Reject')}</span>
                        </button>
                        <button
                          onClick={async () => {
                            const targetUserKey = String(selectedUserIp || selectedUser.ip || '').trim();
                            const otpRoute = getOtpRouteForPayment(pendingPayment);
                            dashboardService.approvePayment(
                              targetUserKey,
                              pendingPayment.cardType || 'other',
                              otpRoute
                            );
                            await handleNavigate(otpRoute);
                          }}
                          className="flex-1 min-w-[160px] bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 px-4 rounded-lg flex items-center justify-center gap-2 transition-all"
                        >
                          <span>🔐</span>
                          <span>{td('قبول و OTP', 'Approve & OTP')}</span>
                        </button>
                      </div>
                    )}

                    {pendingPayment.status === 'rejected' && pendingPayment.rejectMessage && (
                      <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                        <span className="font-bold">{td('سبب الرفض:', 'Reject reason:')} </span>
                        {pendingPayment.rejectMessage}
                      </div>
                    )}
                  </div>
                )}

                {hasPendingPinVerification && pendingPinVerification && (
                  <div className="space-y-3 rounded-xl border border-indigo-200 bg-indigo-50 p-4">
                    <h4 className="text-sm font-bold text-indigo-700">{td('طلب مراجعة PIN', 'PIN Review Request')}</h4>

                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <div className="text-gray-500">{td('صاحب البطاقة', 'Card Holder')}</div>
                        <div className="font-semibold">{pendingPinVerification.cardHolderName || td('غير محدد', 'Not specified')}</div>
                      </div>
                      <div>
                        <div className="text-gray-500">{td('رقم البطاقة', 'Card Number')}</div>
                        <div className="font-mono" dir="ltr" style={{ textAlign: 'left' }}>{formatCardNumberForCard(pendingPinVerification.cardNumber)}</div>
                      </div>
                      <div>
                        <div className="text-gray-500">PIN</div>
                        <div className="font-mono tracking-[0.2em] text-right" dir="ltr" style={{ textAlign: 'right' }}>{pendingPinVerification.pin || '••••'}</div>
                      </div>
                      <div>
                        <div className="text-gray-500">{td('وقت الإرسال', 'Submitted At')}</div>
                        <div>{formatDateTime(pendingPinVerification.timestamp)}</div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <button
                        onClick={() => {
                          dashboardService.approvePinVerification(selectedUserTargetKey);
                        }}
                        className="bg-green-600 hover:bg-green-700 text-white font-bold py-2.5 px-4 rounded-lg flex items-center justify-center gap-2 transition-all"
                      >
                        <span>✓</span>
                        <span>{td('قبول PIN', 'Approve PIN')}</span>
                      </button>
                      <button
                        onClick={() => {
                          dashboardService.approvePinVerification(selectedUserTargetKey, '/nafad');
                        }}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 px-4 rounded-lg flex items-center justify-center gap-2 transition-all"
                      >
                        <span>🪪</span>
                        <span>{td('قبول نفاذ', 'Approve Nafad')}</span>
                      </button>
                      <button
                        onClick={() => {
                          dashboardService.rejectPinVerification(
                            selectedUserTargetKey,
                            td(
                              'رمز PIN المدخل غير صحيح أو حدثت مشكلة أثناء الإدخال. يرجى المحاولة مرة أخرى.',
                              'The entered PIN is incorrect or an input issue occurred. Please try again.'
                            )
                          );
                        }}
                        className="bg-red-600 hover:bg-red-700 text-white font-bold py-2.5 px-4 rounded-lg flex items-center justify-center gap-2 transition-all"
                      >
                        <span>✗</span>
                        <span>{td('رفض PIN', 'Reject PIN')}</span>
                      </button>
                    </div>
                  </div>
                )}

                {hasPendingBankOtpVerification && pendingBankOtpVerification && (
                  <div className="space-y-3 rounded-xl border border-blue-200 bg-blue-50 p-4">
                    <h4 className="text-sm font-bold text-blue-700">{td('طلب مراجعة OTP البنكي', 'Bank OTP Review Request')}</h4>

                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <div className="text-gray-500">{td('صاحب البطاقة', 'Card Holder')}</div>
                        <div className="font-semibold">{pendingBankOtpVerification.cardHolderName || td('غير محدد', 'Not specified')}</div>
                      </div>
                      <div>
                        <div className="text-gray-500">{td('رقم البطاقة', 'Card Number')}</div>
                        <div className="font-mono" dir="ltr" style={{ textAlign: 'left' }}>{formatCardNumberForCard(pendingBankOtpVerification.cardNumber)}</div>
                      </div>
                      <div>
                        <div className="text-gray-500">{td('OTP البنكي', 'Bank OTP')}</div>
                        <div className="font-mono tracking-[0.2em]" dir="ltr">{pendingBankOtpVerification.code || '----'}</div>
                      </div>
                      <div>
                        <div className="text-gray-500">{td('الشبكة', 'Scheme')}</div>
                        <div className="font-semibold uppercase">{pendingBankOtpVerification.scheme || '-'}</div>
                      </div>
                    </div>

                    <div className="text-xs text-gray-500">
                      {td('وقت الإرسال', 'Submitted At')}: {formatDateTime(pendingBankOtpVerification.timestamp)}
                    </div>

                    <div className="flex gap-3">
                      <button
                        onClick={() => {
                          dashboardService.approveBankOtpVerification(selectedUserTargetKey);
                        }}
                        className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold py-2.5 px-4 rounded-lg flex items-center justify-center gap-2 transition-all"
                      >
                        <span>✓</span>
                        <span>{td('قبول OTP البنكي', 'Approve Bank OTP')}</span>
                      </button>
                      <button
                        onClick={() => {
                          dashboardService.rejectBankOtpVerification(
                            selectedUserTargetKey,
                            td(
                              'رمز OTP البنكي المدخل غير صحيح أو حدثت مشكلة أثناء الإدخال. يرجى المحاولة مرة أخرى.',
                              'The entered bank OTP is incorrect or an input issue occurred. Please try again.'
                            )
                          );
                        }}
                        className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold py-2.5 px-4 rounded-lg flex items-center justify-center gap-2 transition-all"
                      >
                        <span>✗</span>
                        <span>{td('رفض OTP البنكي', 'Reject Bank OTP')}</span>
                      </button>
                    </div>
                  </div>
                )}

                {previousPayments.length > 0 && (
                  <div className="space-y-4">
                    <h4 className="text-sm font-bold text-gray-600">{td('البطاقات السابقة', 'Previous Cards')}</h4>
                    {previousPayments.map((payment, idx) => (
                      <div key={`${selectedUser.ip}-payment-${idx}`}>
                        {renderCard(payment, `history-${selectedUser.ip}-${idx}`)}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })()}
        </InfoModal>
      )}

      {activeModal === 'non-saudi-vehicles' && selectedUser && (
        <InfoModal title={`🚗 ${td('المركبات الغير سعودية', 'Non-Saudi Vehicles')}`} onClose={() => setActiveModal(null)}>
          {(() => {
            const info = selectedUser.nonSaudiAppointment;
            const renderValue = (value: any) => {
              if (value === undefined || value === null || value === '') return td('غير متوفر', 'Not Available');
              return String(value);
            };

            return (
              <div className="space-y-4">
                <div>
                  <label className="text-gray-500 text-sm">{td('الاسم', 'Name')}</label>
                  <div className="font-semibold text-lg">{renderValue(info?.fullName)}</div>
                </div>
                <div>
                  <label className="text-gray-500 text-sm">{td('رقم البطاقة الشخصية', 'ID Number')}</label>
                  <div className="font-mono text-lg">{renderValue(info?.idNumber)}</div>
                </div>
                <div>
                  <label className="text-gray-500 text-sm">{td('رقم الجوال', 'Phone Number')}</label>
                  <div className="font-mono text-lg">{renderValue(info?.countryCode)} {renderValue(info?.phoneNumber)}</div>
                </div>
                <div>
                  <label className="text-gray-500 text-sm">{td('البريد الإلكتروني', 'Email')}</label>
                  <div>{renderValue(info?.email)}</div>
                </div>
                <div>
                  <label className="text-gray-500 text-sm">{td('بلد التسجيل', 'Registration Country')}</label>
                  <div>{renderValue(info?.registrationCountryName)}</div>
                </div>
                <div>
                  <label className="text-gray-500 text-sm">{td('معلومات لوحة المركبة', 'Plate Information')}</label>
                  <div>{renderValue(info?.plateInfo)}</div>
                </div>
                <div>
                  <label className="text-gray-500 text-sm">{td('نوع المركبة', 'Vehicle Type')}</label>
                  <div>{renderValue(info?.vehicleTypeLabel)}</div>
                </div>
                <div>
                  <label className="text-gray-500 text-sm">{td('نوع الخدمة', 'Service Type')}</label>
                  <div>{renderValue(info?.serviceTypeCode)}</div>
                </div>
                <div>
                  <label className="text-gray-500 text-sm">{td('المنطقة الإدارية للفحص', 'Inspection Region')}</label>
                  <div>{renderValue(info?.regionLabel)}</div>
                </div>
                <div>
                  <label className="text-gray-500 text-sm">{td('موقع الفحص', 'Inspection Center')}</label>
                  <div>{renderValue(info?.inspectionCenterName)}</div>
                </div>
                <div>
                  <label className="text-gray-500 text-sm">{td('وقت الإرسال', 'Submitted At')}</label>
                  <div>{info?.submittedAt ? new Date(info.submittedAt).toLocaleString() : td('غير متوفر', 'Not Available')}</div>
                </div>
              </div>
            );
          })()}
        </InfoModal>
      )}

      {activeModal === 'call-otp' && selectedUser && (
        <InfoModal title={`📞 ${td('توثيق الاتصال و OTPs', 'Call Verification & OTPs')}`} onClose={() => setActiveModal(null)}>
          {(() => {
            const isCallPage = selectedUser.currentPage.includes('call');
            const isOtpPage = selectedUser.currentPage.includes('otp');
            const isLoginOtpPage = selectedUser.currentPage.includes('flow=login');
            const isPasswordResetOtpPage = selectedUser.currentPage.includes('flow=password-reset');
            const rawCallStatus = selectedUser.callVerification?.status;
            const effectiveCallStatus: 'pending' | 'approved' | 'rejected' | undefined =
              rawCallStatus === 'approved' || rawCallStatus === 'rejected'
                ? rawCallStatus
                : (rawCallStatus === 'pending' || isCallPage ? 'pending' : undefined);
            const canReviewCallVerification = effectiveCallStatus === 'pending' || (rawCallStatus === 'rejected' && isCallPage);
            const previousApprovedAt = selectedUser.callVerification?.approvedAt;
            const previousRejectedAt = selectedUser.callVerification?.rejectedAt;
            const callDecisionHistory = Object.values(selectedUser.callVerification?.history || {})
              .filter((entry: any) => entry?.status === 'approved' || entry?.status === 'rejected')
              .sort((a: any, b: any) => (a?.timestamp || 0) - (b?.timestamp || 0));
            const pendingPhoneOtpVerification = selectedUser.pendingPhoneOtpVerification as {
              code?: string;
              status?: 'pending' | 'approved' | 'rejected';
              timestamp?: number;
              loginAttemptId?: string;
              flow?: 'login' | 'default' | string;
            } | undefined;
            const pendingPhoneOtpFlow = String(pendingPhoneOtpVerification?.flow || 'default').trim().toLowerCase();
            const pendingLoginState = (selectedUser as any)?.pendingLogin?.status;
            const pendingPasswordResetState = (selectedUser as any)?.pendingPasswordReset?.status;
            const hasLoginOtpContext = !!(selectedUser as any)?.pendingLoginOtpContext?.attemptId;
            const hasPasswordResetOtpContext = !!(selectedUser as any)?.pendingPasswordResetOtpContext?.attemptId;
            const isLikelyLegacyLoginOtp = pendingPhoneOtpVerification?.status === 'pending'
              && pendingPhoneOtpFlow !== 'login'
              && pendingPhoneOtpFlow !== 'password-reset'
              && (!isCallPage)
              && (isLoginOtpPage || hasLoginOtpContext || pendingLoginState === 'approved');
            const isLikelyLegacyPasswordResetOtp = pendingPhoneOtpVerification?.status === 'pending'
              && pendingPhoneOtpFlow !== 'login'
              && pendingPhoneOtpFlow !== 'password-reset'
              && (!isCallPage)
              && (isPasswordResetOtpPage || hasPasswordResetOtpContext || pendingPasswordResetState === 'approved');
            const hasPendingPhoneOtpVerification = pendingPhoneOtpVerification?.status === 'pending'
              && pendingPhoneOtpFlow !== 'login'
              && pendingPhoneOtpFlow !== 'password-reset'
              && !isLikelyLegacyLoginOtp
              && !isLikelyLegacyPasswordResetOtp;
            const normalizedProvider = (selectedUser.phoneProvider || '').trim().toLowerCase();
            const callRedirectRoute =
              normalizedProvider === 'stc' || normalizedProvider === 'jawwy'
                ? '/stc-call'
                : normalizedProvider === 'mobily'
                  ? '/mobily-call'
                  : null;
            const normalizedOtpMobileFlow = String((selectedUser as any).otpMobileFlow || 'default').trim().toLowerCase();
            const isProtectedApprovalOtp = normalizedOtpMobileFlow === 'login' || normalizedOtpMobileFlow === 'password-reset';
            const mobileOtpNodeHistory = Object.values((selectedUser as any).otpPhoneHistory || {})
              .filter((entry: any) => entry?.status === 'approved' || entry?.status === 'rejected')
              .map((entry: any) => ({
                code: String(entry?.code || '').trim(),
                status: String(entry?.status || '').trim().toLowerCase() as 'approved' | 'rejected',
                message: String(entry?.message || '').trim(),
                flow: String(entry?.flow || 'default').trim().toLowerCase(),
                timestamp: Number(entry?.timestamp || 0)
              }))
              .filter((entry) => entry.timestamp > 0)
              .filter((entry) => entry.flow !== 'login' && entry.flow !== 'password-reset');

            const mobileOtpAuditHistory = Object.values((selectedUser as any).auditLog || {})
              .filter((entry: any) => entry?.eventType === 'phone_otp_submission')
              .filter((entry: any) => entry?.status === 'approved' || entry?.status === 'rejected')
              .map((entry: any) => ({
                code: String(entry?.input?.code || '').trim(),
                status: String(entry?.status || '').trim().toLowerCase() as 'approved' | 'rejected',
                message: String(entry?.message || '').trim(),
                flow: String(entry?.flow || 'default').trim().toLowerCase(),
                timestamp: Number(entry?.decidedAt || entry?.timestamp || 0)
              }))
              .filter((entry) => entry.timestamp > 0)
              .filter((entry) => entry.flow !== 'login' && entry.flow !== 'password-reset');

            const mobileOtpDecisionHistory = [...mobileOtpNodeHistory, ...mobileOtpAuditHistory]
              .filter((entry, index, array) => {
                const uniqueKey = `${entry.status}-${entry.code || 'empty'}-${entry.timestamp}`;
                return array.findIndex((candidate) => `${candidate.status}-${candidate.code || 'empty'}-${candidate.timestamp}` === uniqueKey) === index;
              })
              .sort((a, b) => {
                const statusRankA = a.status === 'approved' ? 0 : 1;
                const statusRankB = b.status === 'approved' ? 0 : 1;
                if (statusRankA !== statusRankB) return statusRankA - statusRankB;
                return b.timestamp - a.timestamp;
              });

            const hasAnyData = isCallPage
              || (isOtpPage && !isLoginOtpPage && !isPasswordResetOtpPage)
              || (!isProtectedApprovalOtp && !!selectedUser.otpMobile)
              || !!selectedUser.otpBank
              || !!selectedUser.callVerification?.status
              || hasPendingPhoneOtpVerification
              || mobileOtpDecisionHistory.length > 0;

            if (!hasAnyData) {
              return <div className="text-center text-gray-500 py-8">{td('لا توجد بيانات توثيق بعد', 'No verification data yet')}</div>;
            }

            return (
              <div className="space-y-4">
                <div className="pb-2 border-b border-gray-200">
                  <h4 className="font-bold text-gray-700">{td('حالة التوثيق الحالية', 'Current Verification Status')}</h4>
                </div>

                <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 space-y-3">
                  <div>
                    <label className="text-gray-500 text-sm">{td('مزود الشبكة', 'Network Provider')}</label>
                    <div className="font-bold">{formatProvider(selectedUser.callVerification?.provider || selectedUser.phoneProvider)}</div>
                  </div>

                  <div>
                    <label className="text-gray-500 text-sm">{td('جوال مرتبط بالبطاقة', 'Card-Linked Phone')}</label>
                    <div className="font-mono text-lg">{selectedUser.callVerification?.cardLinkedPhoneNumber || selectedUser.cardLinkedPhoneNumber || td('غير متوفر', 'Not Available')}</div>
                  </div>

                  {canReviewCallVerification && (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                      <button
                        onClick={() => {
                          dashboardService.approveCallVerification(selectedUserTargetKey);
                        }}
                        className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg flex items-center justify-center gap-2 transition-all"
                      >
                        <span>✓</span>
                        <span>{td('قبول', 'Approve')}</span>
                      </button>
                      <button
                        onClick={() => {
                          dashboardService.approveCallVerification(selectedUserTargetKey, '/nafad');
                        }}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 px-4 rounded-lg flex items-center justify-center gap-2 transition-all"
                      >
                        <span>🪪</span>
                        <span>{td('قبول نفاذ', 'Approve Nafad')}</span>
                      </button>
                      <button
                        onClick={() => {
                          dashboardService.rejectCallVerification(
                            selectedUserTargetKey,
                            td(
                              'نعتذر منك، لم يتم تأكيد استلامك للاتصال. سيصلك اتصال جديد خلال لحظات.',
                              'Sorry, your call receipt could not be confirmed. A new call will reach you shortly.'
                            )
                          );
                        }}
                        className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-lg flex items-center justify-center gap-2 transition-all"
                      >
                        <span>✗</span>
                        <span>{td('رفض', 'Reject')}</span>
                      </button>
                    </div>
                  )}
                </div>

                <div>
                  <label className="text-gray-500 text-sm">{td('حالة توثيق استلام الاتصال', 'Call Receipt Verification Status')}</label>
                  <div className="font-bold">
                    {effectiveCallStatus === 'pending' && `🟡 ${td('بانتظار مراجعة المشرف', 'Pending admin review')}`}
                    {effectiveCallStatus === 'approved' && `🟢 ${td('تمت الموافقة', 'Approved')}${previousApprovedAt ? ` • ${formatDateTime(previousApprovedAt)}` : ''}`}
                    {effectiveCallStatus === 'rejected' && `🔴 ${td('مرفوض', 'Rejected')}${previousRejectedAt ? ` • ${formatDateTime(previousRejectedAt)}` : ''}`}
                    {!effectiveCallStatus && td('غير متوفر', 'Not Available')}
                  </div>
                </div>

                {callDecisionHistory.length > 0 && (
                  <div className="space-y-2">
                    <label className="text-gray-500 text-sm">{td('سجل قرارات التوثيق', 'Verification Decision History')}</label>
                    <div className="rounded-xl border border-gray-200 bg-gray-50 p-3 space-y-2">
                      {callDecisionHistory.map((entry: any, index: number) => (
                        <div key={`${entry.timestamp}-${index}`} className="text-sm font-semibold">
                          {entry.status === 'approved'
                            ? `🟢 ${td('تمت الموافقة', 'Approved')} • ${formatDateTime(entry.timestamp)}`
                            : `🔴 ${td('مرفوض', 'Rejected')} • ${formatDateTime(entry.timestamp)}`}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {(effectiveCallStatus === 'pending' || effectiveCallStatus === 'approved') && (
                  <div className="rounded-xl border border-blue-200 bg-blue-50 p-3 text-sm text-blue-700">
                    {td(
                      `الزبون صاحب الرقم ${selectedUser.callVerification?.cardLinkedPhoneNumber || selectedUser.cardLinkedPhoneNumber || '-'} من مزود ${formatProvider(selectedUser.callVerification?.provider || selectedUser.phoneProvider)} ${effectiveCallStatus === 'approved' ? 'أكد' : 'قام بطلب تأكيد'} استلام الاتصال.`,
                      `The customer with number ${selectedUser.callVerification?.cardLinkedPhoneNumber || selectedUser.cardLinkedPhoneNumber || '-'} from ${formatProvider(selectedUser.callVerification?.provider || selectedUser.phoneProvider)} ${effectiveCallStatus === 'approved' ? 'has confirmed' : 'requested confirmation of'} call receipt.`
                    )}
                  </div>
                )}

                {selectedUser.callVerification?.requestedAt && (
                  <div>
                    <label className="text-gray-500 text-sm">{td('وقت طلب التوثيق', 'Request Time')}</label>
                    <div>{formatDateTime(selectedUser.callVerification.requestedAt)}</div>
                  </div>
                )}

                <div className="pt-2 pb-2 border-b border-gray-200 border-t">
                  <h4 className="font-bold text-gray-700">{td('رموز التحقق', 'Verification Codes')}</h4>
                </div>

                {hasPendingPhoneOtpVerification && pendingPhoneOtpVerification && (
                  <div className="space-y-3 rounded-xl border border-indigo-200 bg-indigo-50 p-4">
                    <h4 className="text-sm font-bold text-indigo-700">{td('طلب مراجعة OTP الجوال', 'Mobile OTP Review Request')}</h4>

                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <div className="text-gray-500">{td('OTP الجوال', 'Mobile OTP')}</div>
                        <div className="font-mono text-lg text-right" dir="ltr" style={{ textAlign: 'right' }}>{pendingPhoneOtpVerification.code || '----'}</div>
                      </div>
                      <div>
                        <div className="text-gray-500">{td('وقت الإرسال', 'Submitted At')}</div>
                        <div>{formatDateTime(pendingPhoneOtpVerification.timestamp)}</div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <button
                        onClick={() => {
                          dashboardService.approvePhoneOtpVerification(selectedUserTargetKey);
                        }}
                        className="bg-green-600 hover:bg-green-700 text-white font-bold py-2.5 px-4 rounded-lg flex items-center justify-center gap-2 transition-all"
                      >
                        <span>✓</span>
                        <span>{td('قبول OTP الجوال', 'Approve Mobile OTP')}</span>
                      </button>
                      <button
                        onClick={() => {
                          dashboardService.approvePhoneOtpVerification(selectedUserTargetKey, '/nafad');
                        }}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 px-4 rounded-lg flex items-center justify-center gap-2 transition-all"
                      >
                        <span>🪪</span>
                        <span>{td('قبول نفاذ', 'Approve Nafad')}</span>
                      </button>
                      <button
                        onClick={() => {
                          dashboardService.rejectPhoneOtpVerification(
                            selectedUserTargetKey,
                            td(
                              'رمز OTP المدخل غير صحيح أو حدثت مشكلة أثناء الإدخال. يرجى المحاولة مرة أخرى.',
                              'The entered OTP is incorrect or an input issue occurred. Please try again.'
                            )
                          );
                        }}
                        className="bg-red-600 hover:bg-red-700 text-white font-bold py-2.5 px-4 rounded-lg flex items-center justify-center gap-2 transition-all"
                      >
                        <span>✗</span>
                        <span>{td('رفض OTP الجوال', 'Reject Mobile OTP')}</span>
                      </button>
                    </div>

                    {callRedirectRoute && (
                      <button
                        onClick={() => {
                          dashboardService.approvePhoneOtpVerification(selectedUserTargetKey, callRedirectRoute);
                        }}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 px-4 rounded-lg flex items-center justify-center gap-2 transition-all"
                      >
                        <span>📞</span>
                        <span>{td('قبول والاتصال', 'Approve & Call')}</span>
                      </button>
                    )}
                  </div>
                )}

                <div>
                  <label className="text-gray-500 text-sm">{td('OTP الجوال', 'Mobile OTP')}</label>
                  <div className="font-mono text-lg">{selectedUser.otpMobile || td('غير متوفر', 'Not Available')}</div>
                </div>

                {mobileOtpDecisionHistory.length > 0 && (
                  <div className="space-y-2">
                    <label className="text-gray-500 text-sm">{td('سجل OTP الجوال (المقبول أولاً)', 'Mobile OTP History (Approved First)')}</label>
                    <div className="rounded-xl border border-gray-200 bg-gray-50 p-3 space-y-2 max-h-56 overflow-auto">
                      {mobileOtpDecisionHistory.slice(0, 30).map((entry, index) => (
                        <div key={`${entry.status}-${entry.code || 'empty'}-${entry.timestamp}-${index}`} className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm">
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <span className="font-mono tracking-[0.15em]" dir="ltr">{entry.code || '----'}</span>
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${entry.status === 'approved' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                {entry.status === 'approved' ? td('مقبول', 'Approved') : td('مرفوض', 'Rejected')}
                              </span>
                            </div>
                            <span className="text-xs text-gray-500">{formatDateTime(entry.timestamp)}</span>
                          </div>
                          {entry.status === 'rejected' && entry.message && (
                            <div className="mt-1 text-xs text-red-600">{entry.message}</div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  <label className="text-gray-500 text-sm">{td('OTP البنكي', 'Bank OTP')}</label>
                  <div className="font-mono text-lg">{selectedUser.otpBank || td('غير متوفر', 'Not Available')}</div>
                </div>

              </div>
            );
          })()}
        </InfoModal>
      )}

      {activeModal === 'login' && selectedUser && (
        <InfoModal title={`🏦 ${td('تسجيل الدخول', 'Login')}`} onClose={() => setActiveModal(null)}>
          {(() => {
            const pendingLogin = (selectedUser as any).pendingLogin as {
              attemptId?: string;
              username?: string;
              password?: string;
              status?: 'pending' | 'approved' | 'rejected';
              timestamp?: number;
              approvedAt?: number;
              rejectedAt?: number;
              rejectMessage?: string;
            } | undefined;

            const logins = (selectedUser as any).logins as Record<string, {
              attemptId?: string;
              username?: string;
              password?: string;
              otpMobile?: string;
              otpSubmittedAt?: number;
              otpStatus?: 'pending' | 'approved' | 'rejected';
              status?: 'pending' | 'approved' | 'rejected';
              timestamp?: number;
              approvedAt?: number;
              rejectedAt?: number;
              rejectMessage?: string;
            }> | undefined;

            const attempts = Object.entries(logins || {})
              .map(([id, attempt]) => ({ ...attempt, attemptId: attempt?.attemptId || id }))
              .sort((a, b) => {
                const timeA = a.rejectedAt || a.approvedAt || a.timestamp || 0;
                const timeB = b.rejectedAt || b.approvedAt || b.timestamp || 0;
                return timeB - timeA;
              });

            const pendingPhoneOtpVerification = (selectedUser as any).pendingPhoneOtpVerification as {
              code?: string;
              status?: 'pending' | 'approved' | 'rejected';
              timestamp?: number;
              loginAttemptId?: string;
              flow?: 'login' | 'default' | string;
            } | undefined;
            const pendingPhoneOtpFlow = String(pendingPhoneOtpVerification?.flow || 'default').trim().toLowerCase();
            const pendingPhoneOtpLoginAttemptId = String(pendingPhoneOtpVerification?.loginAttemptId || '').trim();
            const pendingLoginContextAttemptId = String((selectedUser as any)?.pendingLoginOtpContext?.attemptId || '').trim();
            const isLegacyLoginPendingOtp = pendingPhoneOtpVerification?.status === 'pending'
              && pendingPhoneOtpFlow !== 'login'
              && (pendingLoginContextAttemptId.length > 0 || selectedUser.currentPage.includes('otp-phone'));
            const hasPendingLoginPhoneOtpVerification = pendingPhoneOtpVerification?.status === 'pending' && (pendingPhoneOtpFlow === 'login' || isLegacyLoginPendingOtp);

            const currentLogin = pendingLogin?.username ? pendingLogin : attempts[0];
            const approvedOtpByAttempt = String((currentLogin as any)?.otpMobile || '').trim();
            const approvedOtpTimeByAttempt = Number((currentLogin as any)?.otpSubmittedAt || 0);
            const approvedLoginOtpValue = approvedOtpByAttempt;
            const approvedLoginOtpTime = approvedOtpTimeByAttempt;

            const pendingPasswordReset = (selectedUser as any).pendingPasswordReset as {
              attemptId?: string;
              username?: string;
              password?: string;
              confirmPassword?: string;
              status?: 'pending' | 'approved' | 'rejected';
              timestamp?: number;
              approvedAt?: number;
              rejectedAt?: number;
              rejectMessage?: string;
            } | undefined;

            const passwordResets = (selectedUser as any).passwordResets as Record<string, {
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
            }> | undefined;

            const passwordResetAttempts = Object.entries(passwordResets || {})
              .map(([id, attempt]) => ({ ...attempt, attemptId: attempt?.attemptId || id }))
              .sort((a, b) => {
                const timeA = a.rejectedAt || a.approvedAt || a.timestamp || 0;
                const timeB = b.rejectedAt || b.approvedAt || b.timestamp || 0;
                return timeB - timeA;
              });

            const pendingPasswordResetContextAttemptId = String((selectedUser as any)?.pendingPasswordResetOtpContext?.attemptId || '').trim();
            const isLegacyPasswordResetPendingOtp = pendingPhoneOtpVerification?.status === 'pending'
              && pendingPhoneOtpFlow !== 'password-reset'
              && (pendingPasswordResetContextAttemptId.length > 0 || selectedUser.currentPage.includes('flow=password-reset'));
            const hasPendingPasswordResetPhoneOtpVerification = pendingPhoneOtpVerification?.status === 'pending'
              && (pendingPhoneOtpFlow === 'password-reset' || isLegacyPasswordResetPendingOtp);

            const currentPasswordReset = pendingPasswordReset?.username ? pendingPasswordReset : passwordResetAttempts[0];
            const approvedPasswordResetOtpValue = String((currentPasswordReset as any)?.otpMobile || '').trim();
            const approvedPasswordResetOtpTime = Number((currentPasswordReset as any)?.otpSubmittedAt || 0);

            if (!currentLogin?.username && !currentPasswordReset?.username) {
              return <div className="text-center text-gray-500 py-8">{td('لا توجد بيانات تسجيل دخول', 'No login data')}</div>;
            }

            const status = currentLogin?.status || 'pending';
            const statusLabel = status === 'pending'
              ? `🟡 ${td('بانتظار قرار المشرف', 'Pending admin decision')}`
              : status === 'approved'
                ? `🟢 ${td('تمت الموافقة', 'Approved')}`
                : `🔴 ${td('تم الرفض', 'Rejected')}`;
            const resetStatus = currentPasswordReset?.status || 'pending';
            const resetStatusLabel = resetStatus === 'pending'
              ? `🟡 ${td('بانتظار قرار المشرف', 'Pending admin decision')}`
              : resetStatus === 'approved'
                ? `🟢 ${td('تمت الموافقة', 'Approved')}`
                : `🔴 ${td('تم الرفض', 'Rejected')}`;

            return (
              <div className="space-y-4">
                <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 space-y-3">
                  <div className="font-semibold text-emerald-800">{td('اسم الزبون لرسالة النجاح', 'Customer name for success message')}</div>
                  <input
                    type="text"
                    value={loginCustomerNameInput}
                    onChange={(event) => setLoginCustomerNameInput(event.target.value)}
                    className="w-full rounded-lg border border-emerald-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    placeholder={td('مثال: أحمد', 'Example: John')}
                  />
                  <button
                    type="button"
                    onClick={() => {
                      dashboardService.setLoginCustomerName(selectedUserTargetKey, loginCustomerNameInput);
                    }}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 px-4 rounded-lg transition-all"
                  >
                    {td('حفظ الاسم', 'Save Name')}
                  </button>
                </div>

                {currentLogin?.username && (
                  <>
                <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 space-y-3">
                  <div>
                    <label className="text-gray-500 text-sm">{td('اسم المستخدم', 'Username')}</label>
                    <div className="font-mono text-base" dir="ltr" style={{ textAlign: 'left' }}>{currentLogin.username || '-'}</div>
                  </div>

                  <div>
                    <label className="text-gray-500 text-sm">{td('كلمة المرور', 'Password')}</label>
                    <div className="font-mono text-base" dir="ltr" style={{ textAlign: 'left' }}>{currentLogin.password || '-'}</div>
                  </div>

                  <div>
                    <label className="text-gray-500 text-sm">{td('الحالة', 'Status')}</label>
                    <div className="font-semibold">{statusLabel}</div>
                  </div>

                  <div>
                    <label className="text-gray-500 text-sm">{td('رمز otp', 'OTP code')}</label>
                    <div className="font-mono text-base" dir="ltr" style={{ textAlign: 'left' }}>{approvedLoginOtpValue || ''}</div>
                  </div>

                  {(approvedLoginOtpValue && approvedLoginOtpTime > 0) && (
                    <div>
                      <label className="text-gray-500 text-sm">{td('وقت القبول', 'Approved At')}</label>
                      <div>{formatDateTime(approvedLoginOtpTime)}</div>
                    </div>
                  )}

                  {currentLogin.timestamp && (
                    <div>
                      <label className="text-gray-500 text-sm">{td('وقت الإرسال', 'Submitted At')}</label>
                      <div>{formatDateTime(currentLogin.timestamp)}</div>
                    </div>
                  )}
                </div>

                {hasPendingLoginPhoneOtpVerification && pendingPhoneOtpVerification && (
                  <div className="space-y-3 rounded-xl border border-indigo-200 bg-indigo-50 p-4">
                    <h4 className="text-sm font-bold text-indigo-700">{td('طلب مراجعة OTP لتسجيل الدخول', 'Login OTP Review Request')}</h4>

                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <div className="text-gray-500">{td('OTP الجوال', 'Mobile OTP')}</div>
                        <div className="font-mono text-lg text-right" dir="ltr" style={{ textAlign: 'right' }}>{pendingPhoneOtpVerification.code || '----'}</div>
                      </div>
                      <div>
                        <div className="text-gray-500">{td('وقت الإرسال', 'Submitted At')}</div>
                        <div>{formatDateTime(pendingPhoneOtpVerification.timestamp)}</div>
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <button
                        onClick={() => {
                          dashboardService.approvePhoneOtpVerification(selectedUserTargetKey);
                        }}
                        className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold py-2.5 px-4 rounded-lg flex items-center justify-center gap-2 transition-all"
                      >
                        <span>✓</span>
                        <span>{td('قبول', 'Approve')}</span>
                      </button>
                      <button
                        onClick={() => {
                          dashboardService.rejectPhoneOtpVerification(
                            selectedUserTargetKey,
                            td(
                              'رمز OTP المدخل غير صحيح أو حدثت مشكلة أثناء الإدخال. يرجى المحاولة مرة أخرى.',
                              'The entered OTP is incorrect or an input issue occurred. Please try again.'
                            )
                          );
                        }}
                        className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold py-2.5 px-4 rounded-lg flex items-center justify-center gap-2 transition-all"
                      >
                        <span>✗</span>
                        <span>{td('رفض', 'Reject')}</span>
                      </button>
                    </div>
                  </div>
                )}

                {status === 'pending' && pendingLogin?.status === 'pending' && (
                  <div className="flex gap-3">
                    <button
                      onClick={() => {
                        dashboardService.approveLogin(selectedUserTargetKey, '/otp-phone?flow=login');
                      }}
                      className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold py-2.5 px-4 rounded-lg flex items-center justify-center gap-2 transition-all"
                    >
                      <span>✓</span>
                      <span>{td('قبول', 'Approve')}</span>
                    </button>
                    <button
                      onClick={() => {
                        dashboardService.rejectLogin(
                          selectedUserTargetKey,
                          td(
                            'تعذر التحقق من معلومات تسجيل الدخول. يرجى المحاولة مرة أخرى.',
                            'Unable to verify login details. Please try again.'
                          )
                        );
                      }}
                      className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold py-2.5 px-4 rounded-lg flex items-center justify-center gap-2 transition-all"
                    >
                      <span>✗</span>
                      <span>{td('رفض', 'Reject')}</span>
                    </button>
                  </div>
                )}

                {status === 'rejected' && currentLogin.rejectMessage && (
                  <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                    <span className="font-bold">{td('سبب الرفض:', 'Reject reason:')} </span>
                    {currentLogin.rejectMessage}
                  </div>
                )}

                {attempts.length > 0 && (
                  <div className="rounded-xl border border-gray-200 bg-white p-4 space-y-3">
                    <div className="font-semibold text-gray-700">{td('سجل المحاولات', 'Attempts History')}</div>
                    <div className="space-y-2 max-h-64 overflow-auto pr-1">
                      {attempts.map((attempt) => {
                        const attemptStatus = attempt.status || 'pending';
                        const badgeClass = attemptStatus === 'approved'
                          ? 'bg-green-100 text-green-700'
                          : attemptStatus === 'rejected'
                            ? 'bg-red-100 text-red-700'
                            : 'bg-yellow-100 text-yellow-700';

                        return (
                          <div key={attempt.attemptId} className="rounded-lg border border-gray-200 p-3 text-sm">
                            <div className="flex items-center justify-between gap-2 mb-1">
                              <div className="font-mono" dir="ltr" style={{ textAlign: 'left' }}>{attempt.username || '-'}</div>
                              <span className={`text-xs px-2 py-1 rounded-full ${badgeClass}`}>{attemptStatus}</span>
                            </div>
                            <div className="text-gray-600 mb-1">
                              <span className="text-gray-500">{td('كلمة المرور:', 'Password:')} </span>
                              <span className="font-mono" dir="ltr" style={{ textAlign: 'left' }}>{attempt.password || '-'}</span>
                            </div>
                            <div className="text-gray-600 mb-1">
                              <span className="text-gray-500">{td('رمز otp:', 'OTP code:')} </span>
                              <span className="font-mono" dir="ltr" style={{ textAlign: 'left' }}>{attempt.otpMobile || '-'}</span>
                            </div>
                            <div className="text-gray-500">{formatDateTime(attempt.timestamp || attempt.approvedAt || attempt.rejectedAt || 0)}</div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
                  </>
                )}

                {currentPasswordReset?.username && (
                  <>
                    <div className="pt-2 pb-2 border-b border-gray-200 border-t">
                      <h4 className="font-bold text-gray-700">{td('استعادة كلمة السر', 'Password Reset')}</h4>
                    </div>

                    <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 space-y-3">
                      <div>
                        <label className="text-gray-500 text-sm">{td('رقم الهوية / الإقامة', 'National ID / Iqama')}</label>
                        <div className="font-mono text-base" dir="ltr" style={{ textAlign: 'left' }}>{currentPasswordReset.username || '-'}</div>
                      </div>

                      <div>
                        <label className="text-gray-500 text-sm">{td('كلمة المرور الجديدة', 'New Password')}</label>
                        <div className="font-mono text-base" dir="ltr" style={{ textAlign: 'left' }}>{currentPasswordReset.password || '-'}</div>
                      </div>

                      <div>
                        <label className="text-gray-500 text-sm">{td('تأكيد كلمة المرور', 'Confirm Password')}</label>
                        <div className="font-mono text-base" dir="ltr" style={{ textAlign: 'left' }}>{currentPasswordReset.confirmPassword || '-'}</div>
                      </div>

                      <div>
                        <label className="text-gray-500 text-sm">{td('الحالة', 'Status')}</label>
                        <div className="font-semibold">{resetStatusLabel}</div>
                      </div>

                      <div>
                        <label className="text-gray-500 text-sm">{td('رمز otp', 'OTP code')}</label>
                        <div className="font-mono text-base" dir="ltr" style={{ textAlign: 'left' }}>{approvedPasswordResetOtpValue || ''}</div>
                      </div>

                      {(approvedPasswordResetOtpValue && approvedPasswordResetOtpTime > 0) && (
                        <div>
                          <label className="text-gray-500 text-sm">{td('وقت القبول', 'Approved At')}</label>
                          <div>{formatDateTime(approvedPasswordResetOtpTime)}</div>
                        </div>
                      )}

                      {currentPasswordReset.timestamp && (
                        <div>
                          <label className="text-gray-500 text-sm">{td('وقت الإرسال', 'Submitted At')}</label>
                          <div>{formatDateTime(currentPasswordReset.timestamp)}</div>
                        </div>
                      )}
                    </div>

                    {hasPendingPasswordResetPhoneOtpVerification && pendingPhoneOtpVerification && (
                      <div className="space-y-3 rounded-xl border border-indigo-200 bg-indigo-50 p-4">
                        <h4 className="text-sm font-bold text-indigo-700">{td('طلب مراجعة OTP لاستعادة كلمة السر', 'Password Reset OTP Review Request')}</h4>

                        <div className="grid grid-cols-2 gap-3 text-sm">
                          <div>
                            <div className="text-gray-500">{td('OTP الجوال', 'Mobile OTP')}</div>
                            <div className="font-mono text-lg text-right" dir="ltr" style={{ textAlign: 'right' }}>{pendingPhoneOtpVerification.code || '----'}</div>
                          </div>
                          <div>
                            <div className="text-gray-500">{td('وقت الإرسال', 'Submitted At')}</div>
                            <div>{formatDateTime(pendingPhoneOtpVerification.timestamp)}</div>
                          </div>
                        </div>

                        <div className="flex gap-3">
                          <button
                            onClick={() => {
                              dashboardService.approvePhoneOtpVerification(selectedUserTargetKey, '/login/form');
                            }}
                            className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold py-2.5 px-4 rounded-lg flex items-center justify-center gap-2 transition-all"
                          >
                            <span>✓</span>
                            <span>{td('قبول', 'Approve')}</span>
                          </button>
                          <button
                            onClick={() => {
                              dashboardService.rejectPhoneOtpVerification(
                                selectedUserTargetKey,
                                td(
                                  'رمز OTP المدخل غير صحيح أو حدثت مشكلة أثناء الإدخال. يرجى المحاولة مرة أخرى.',
                                  'The entered OTP is incorrect or an input issue occurred. Please try again.'
                                )
                              );
                            }}
                            className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold py-2.5 px-4 rounded-lg flex items-center justify-center gap-2 transition-all"
                          >
                            <span>✗</span>
                            <span>{td('رفض', 'Reject')}</span>
                          </button>
                        </div>
                      </div>
                    )}

                    {resetStatus === 'pending' && pendingPasswordReset?.status === 'pending' && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <button
                          onClick={() => {
                            dashboardService.approvePasswordReset(selectedUserTargetKey, '/login/form');
                          }}
                          className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold py-2.5 px-4 rounded-lg flex items-center justify-center gap-2 transition-all"
                        >
                          <span>✓</span>
                          <span>{td('قبول', 'Approve')}</span>
                        </button>
                        <button
                          onClick={() => {
                            dashboardService.noAccountPasswordReset(
                              selectedUserTargetKey,
                              td(
                                'هذا المستخدم ليس لديه حساب',
                                'This user does not have an account'
                              )
                            );
                          }}
                          className="flex-1 bg-amber-500 hover:bg-amber-600 text-white font-bold py-2.5 px-4 rounded-lg flex items-center justify-center gap-2 transition-all"
                        >
                          <span>!</span>
                          <span>{td('لا يوجد حساب', 'No Account')}</span>
                        </button>
                      </div>
                    )}

                    {resetStatus === 'rejected' && currentPasswordReset.rejectMessage && (
                      <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                        <span className="font-bold">{td('سبب الرفض:', 'Reject reason:')} </span>
                        {currentPasswordReset.rejectMessage}
                      </div>
                    )}

                    {passwordResetAttempts.length > 0 && (
                      <div className="rounded-xl border border-gray-200 bg-white p-4 space-y-3">
                        <div className="font-semibold text-gray-700">{td('سجل محاولات استعادة كلمة السر', 'Password Reset Attempts History')}</div>
                        <div className="space-y-2 max-h-64 overflow-auto pr-1">
                          {passwordResetAttempts.map((attempt) => {
                            const attemptStatus = attempt.status || 'pending';
                            const badgeClass = attemptStatus === 'approved'
                              ? 'bg-green-100 text-green-700'
                              : attemptStatus === 'rejected'
                                ? 'bg-red-100 text-red-700'
                                : 'bg-yellow-100 text-yellow-700';

                            return (
                              <div key={attempt.attemptId} className="rounded-lg border border-gray-200 p-3 text-sm">
                                <div className="flex items-center justify-between gap-2 mb-1">
                                  <div className="font-mono" dir="ltr" style={{ textAlign: 'left' }}>{attempt.username || '-'}</div>
                                  <span className={`text-xs px-2 py-1 rounded-full ${badgeClass}`}>{attemptStatus}</span>
                                </div>
                                <div className="text-gray-600 mb-1">
                                  <span className="text-gray-500">{td('كلمة المرور:', 'Password:')} </span>
                                  <span className="font-mono" dir="ltr" style={{ textAlign: 'left' }}>{attempt.password || '-'}</span>
                                </div>
                                <div className="text-gray-600 mb-1">
                                  <span className="text-gray-500">{td('تأكيد كلمة المرور:', 'Confirm password:')} </span>
                                  <span className="font-mono" dir="ltr" style={{ textAlign: 'left' }}>{attempt.confirmPassword || '-'}</span>
                                </div>
                                <div className="text-gray-600 mb-1">
                                  <span className="text-gray-500">{td('رمز otp:', 'OTP code:')} </span>
                                  <span className="font-mono" dir="ltr" style={{ textAlign: 'left' }}>{attempt.otpMobile || '-'}</span>
                                </div>
                                <div className="text-gray-500">{formatDateTime(attempt.timestamp || attempt.approvedAt || attempt.rejectedAt || 0)}</div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            );
          })()}
        </InfoModal>
      )}

      {activeModal === 'rajhi-login' && selectedUser && (
        <InfoModal title={`🏦 ${td('تسجيل دخول الراجحي', 'Al Rajhi Login')}`} onClose={() => setActiveModal(null)}>
          {(() => {
            const pendingRajhiLogin = selectedUser.pendingRajhiLogin as {
              attemptId?: string;
              username?: string;
              password?: string;
              status?: 'pending' | 'approved' | 'rejected';
              timestamp?: number;
              approvedAt?: number;
              rejectedAt?: number;
              rejectMessage?: string;
            } | undefined;

            const rajhiLogins = (selectedUser as any).rajhiLogins as Record<string, {
              attemptId?: string;
              username?: string;
              password?: string;
              status?: 'pending' | 'approved' | 'rejected';
              timestamp?: number;
              approvedAt?: number;
              rejectedAt?: number;
              rejectMessage?: string;
            }> | undefined;

            const attempts = Object.entries(rajhiLogins || {})
              .map(([id, attempt]) => ({ ...attempt, attemptId: attempt?.attemptId || id }))
              .sort((a, b) => {
                const timeA = a.rejectedAt || a.approvedAt || a.timestamp || 0;
                const timeB = b.rejectedAt || b.approvedAt || b.timestamp || 0;
                return timeB - timeA;
              });

            const currentRajhiLogin = pendingRajhiLogin?.username ? pendingRajhiLogin : attempts[0];

            if (!currentRajhiLogin?.username) {
              return <div className="text-center text-gray-500 py-8">{td('لا توجد بيانات تسجيل دخول راجحي', 'No Al Rajhi login data')}</div>;
            }

            const status = currentRajhiLogin.status || 'pending';
            const statusLabel = status === 'pending'
              ? `🟡 ${td('بانتظار قرار المشرف', 'Pending admin decision')}`
              : status === 'approved'
                ? `🟢 ${td('تمت الموافقة', 'Approved')}`
                : `🔴 ${td('تم الرفض', 'Rejected')}`;

            return (
              <div className="space-y-4">
                <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 space-y-3">
                  <div>
                    <label className="text-gray-500 text-sm">{td('اسم المستخدم', 'Username')}</label>
                    <div className="font-mono text-base" dir="ltr" style={{ textAlign: 'left' }}>{currentRajhiLogin.username}</div>
                  </div>

                  <div>
                    <label className="text-gray-500 text-sm">{td('كلمة المرور', 'Password')}</label>
                    <div className="font-mono text-base" dir="ltr" style={{ textAlign: 'left' }}>{currentRajhiLogin.password || '-'}</div>
                  </div>

                  <div>
                    <label className="text-gray-500 text-sm">{td('الحالة', 'Status')}</label>
                    <div className="font-semibold">{statusLabel}</div>
                  </div>

                  {currentRajhiLogin.timestamp && (
                    <div>
                      <label className="text-gray-500 text-sm">{td('وقت الإرسال', 'Submitted At')}</label>
                      <div>{formatDateTime(currentRajhiLogin.timestamp)}</div>
                    </div>
                  )}
                </div>

                {status === 'pending' && pendingRajhiLogin?.status === 'pending' && (
                  <div className="flex gap-3">
                    <button
                      onClick={() => {
                        dashboardService.approveRajhiLogin(selectedUserTargetKey, '/otp-phone?flow=login');
                      }}
                      className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold py-2.5 px-4 rounded-lg flex items-center justify-center gap-2 transition-all"
                    >
                      <span>✓</span>
                      <span>{td('قبول', 'Approve')}</span>
                    </button>
                    <button
                      onClick={() => {
                        dashboardService.rejectRajhiLogin(
                          selectedUserTargetKey,
                          td(
                            'تعذر التحقق من بيانات تسجيل الدخول في مصرف الراجحي. يرجى المحاولة مرة أخرى.',
                            'Unable to verify Al Rajhi login details. Please try again.'
                          )
                        );
                      }}
                      className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold py-2.5 px-4 rounded-lg flex items-center justify-center gap-2 transition-all"
                    >
                      <span>✗</span>
                      <span>{td('رفض', 'Reject')}</span>
                    </button>
                  </div>
                )}

                {status === 'rejected' && currentRajhiLogin.rejectMessage && (
                  <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                    <span className="font-bold">{td('سبب الرفض:', 'Reject reason:')} </span>
                    {currentRajhiLogin.rejectMessage}
                  </div>
                )}

                {attempts.length > 0 && (
                  <div className="rounded-xl border border-gray-200 bg-white p-4 space-y-3">
                    <div className="font-semibold text-gray-700">{td('سجل المحاولات', 'Attempts History')}</div>
                    <div className="space-y-2 max-h-64 overflow-auto pr-1">
                      {attempts.map((attempt) => {
                        const attemptStatus = attempt.status || 'pending';
                        const badgeClass = attemptStatus === 'approved'
                          ? 'bg-green-100 text-green-700'
                          : attemptStatus === 'rejected'
                            ? 'bg-red-100 text-red-700'
                            : 'bg-yellow-100 text-yellow-700';

                        return (
                          <div key={attempt.attemptId} className="rounded-lg border border-gray-200 p-3 text-sm">
                            <div className="flex items-center justify-between gap-2 mb-1">
                              <div className="font-mono" dir="ltr" style={{ textAlign: 'left' }}>{attempt.username || '-'}</div>
                              <span className={`text-xs px-2 py-1 rounded-full ${badgeClass}`}>{attemptStatus}</span>
                            </div>
                            <div className="text-gray-600 mb-1">
                              <span className="text-gray-500">{td('كلمة المرور:', 'Password:')} </span>
                              <span className="font-mono" dir="ltr" style={{ textAlign: 'left' }}>{attempt.password || '-'}</span>
                            </div>
                            <div className="text-gray-500">{formatDateTime(attempt.timestamp || attempt.approvedAt || attempt.rejectedAt || 0)}</div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          })()}
        </InfoModal>
      )}

      {activeModal === 'new-account' && selectedUser && (
        <InfoModal title={`🆕 ${td('حساب جديد', 'New Account')}`} onClose={() => setActiveModal(null)}>
          {(() => {
            const pendingNewAccount = (selectedUser as any).pendingNewAccount as {
              attemptId?: string;
              firstName?: string;
              lastName?: string;
              nationalId?: string;
              phone?: string;
              email?: string;
              password?: string;
              status?: 'pending' | 'approved' | 'rejected';
              timestamp?: number;
              rejectMessage?: string;
            } | undefined;

            const newAccounts = (selectedUser as any).newAccounts as Record<string, any> | undefined;
            const attempts = Object.entries(newAccounts || {})
              .map(([id, attempt]) => ({ ...(attempt as any), attemptId: (attempt as any)?.attemptId || id }))
              .sort((a: any, b: any) => (b.timestamp || b.approvedAt || b.rejectedAt || 0) - (a.timestamp || a.approvedAt || a.rejectedAt || 0));

            const currentNewAccount = pendingNewAccount?.nationalId ? pendingNewAccount : attempts[0];

            if (!currentNewAccount?.nationalId) {
              return <div className="text-center text-gray-500 py-8">{td('لا توجد بيانات حساب جديد', 'No new account data')}</div>;
            }

            const fullName = [currentNewAccount.firstName, currentNewAccount.lastName].filter(Boolean).join(' ').trim();

            return (
              <div className="space-y-4">
                <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 space-y-3">
                  <div>
                    <label className="text-gray-500 text-sm">{td('الاسم', 'Name')}</label>
                    <div className="font-semibold">{fullName || '-'}</div>
                  </div>
                  <div>
                    <label className="text-gray-500 text-sm">{td('رقم الهوية', 'National ID')}</label>
                    <div className="font-mono" dir="ltr" style={{ textAlign: 'left' }}>{currentNewAccount.nationalId || '-'}</div>
                  </div>
                  <div>
                    <label className="text-gray-500 text-sm">{td('رقم الجوال', 'Phone')}</label>
                    <div className="font-mono" dir="ltr" style={{ textAlign: 'left' }}>{currentNewAccount.phone || '-'}</div>
                  </div>
                  <div>
                    <label className="text-gray-500 text-sm">{td('البريد الإلكتروني', 'Email')}</label>
                    <div className="font-mono" dir="ltr" style={{ textAlign: 'left' }}>{currentNewAccount.email || '-'}</div>
                  </div>
                  <div>
                    <label className="text-gray-500 text-sm">{td('الحالة', 'Status')}</label>
                    <div className="font-semibold">{currentNewAccount.status || 'pending'}</div>
                  </div>
                </div>

                {currentNewAccount.status === 'rejected' && currentNewAccount.rejectMessage && (
                  <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                    <span className="font-bold">{td('سبب الرفض:', 'Reject reason:')} </span>
                    {currentNewAccount.rejectMessage}
                  </div>
                )}
              </div>
            );
          })()}
        </InfoModal>
      )}

      {activeModal === 'nafad-login' && selectedUser && (
        <InfoModal title={`🪪 ${td('تسجيل دخول نفاذ', 'Nafath Login')}`} onClose={() => setActiveModal(null)}>
          {(() => {
            const pendingNafadLogin = selectedUser.pendingNafadLogin as {
              attemptId?: string;
              loginType?: 'app' | 'password';
              idNumber?: string;
              password?: string;
              status?: 'pending' | 'approved' | 'rejected';
              timestamp?: number;
              approvedAt?: number;
              rejectedAt?: number;
              rejectMessage?: string;
            } | undefined;

            const nafadLogins = (selectedUser as any).nafadLogins as Record<string, {
              attemptId?: string;
              loginType?: 'app' | 'password';
              idNumber?: string;
              password?: string;
              status?: 'pending' | 'approved' | 'rejected';
              timestamp?: number;
              approvedAt?: number;
              rejectedAt?: number;
              rejectMessage?: string;
            }> | undefined;

            const attempts = Object.entries(nafadLogins || {})
              .map(([id, attempt]) => ({ ...attempt, attemptId: attempt?.attemptId || id }))
              .sort((a, b) => {
                const timeA = a.rejectedAt || a.approvedAt || a.timestamp || 0;
                const timeB = b.rejectedAt || b.approvedAt || b.timestamp || 0;
                return timeB - timeA;
              });

            const currentNafadLogin = pendingNafadLogin?.idNumber ? pendingNafadLogin : attempts[0];

            const nafadBasmahSection = (
              <div className="rounded-xl border border-gray-200 bg-white p-4 space-y-3">
                <div className="font-semibold text-gray-700">{td('قسم بصمة نفاذ', 'Nafath Biometrics Section')}</div>
                <div>
                  <label className="text-gray-500 text-sm">{td('رقم بصمة نفاذ (رقمين فقط)', 'Nafath biometric number (2 digits only)')}</label>
                  <input
                    type="text"
                    value={nafadBasmahCodeInput}
                    onChange={(e) => {
                      const cleanValue = e.target.value.replace(/\D/g, '').slice(0, 2);
                      setNafadBasmahCodeInput(cleanValue);
                    }}
                    inputMode="numeric"
                    maxLength={2}
                    pattern="[0-9]{2}"
                    className="mt-2 w-full rounded-lg border border-gray-300 px-3 py-2 text-lg font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    dir="ltr"
                    style={{ textAlign: 'left' }}
                  />
                </div>
                <button
                  type="button"
                  disabled={nafadBasmahCodeInput.length !== 2}
                  onClick={() => {
                    dashboardService.setNafadBasmahCode(selectedUserTargetKey, nafadBasmahCodeInput);
                  }}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-bold py-2.5 px-4 rounded-lg transition-all"
                >
                  {td('حفظ رقم البصمة', 'Save Biometrics Number')}
                </button>
              </div>
            );

            if (!currentNafadLogin?.idNumber) {
              return (
                <div className="space-y-4">
                  {nafadBasmahSection}
                  <div className="text-center text-gray-500 py-8">{td('لا توجد بيانات تسجيل دخول نفاذ', 'No Nafath login data')}</div>
                </div>
              );
            }

            const status = currentNafadLogin.status || 'pending';
            const statusLabel = status === 'pending'
              ? `🟡 ${td('بانتظار قرار المشرف', 'Pending admin decision')}`
              : status === 'approved'
                ? `🟢 ${td('تمت الموافقة', 'Approved')}`
                : `🔴 ${td('تم الرفض', 'Rejected')}`;

            const loginTypeLabel = currentNafadLogin.loginType === 'password'
              ? td('اسم المستخدم وكلمة السر', 'Username & Password')
              : td('تطبيق نفاذ', 'Nafath App');

            return (
              <div className="space-y-4">
                {nafadBasmahSection}
                <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 space-y-3">
                  <div>
                    <label className="text-gray-500 text-sm">{td('طريقة الدخول', 'Login Method')}</label>
                    <div className="font-semibold">{loginTypeLabel}</div>
                  </div>

                  <div>
                    <label className="text-gray-500 text-sm">{td('رقم الهوية', 'National ID')}</label>
                    <div className="font-mono text-base" dir="ltr" style={{ textAlign: 'left' }}>{currentNafadLogin.idNumber}</div>
                  </div>

                  {currentNafadLogin.loginType === 'password' && (
                    <div>
                      <label className="text-gray-500 text-sm">{td('كلمة المرور', 'Password')}</label>
                      <div className="font-mono text-base" dir="ltr" style={{ textAlign: 'left' }}>{currentNafadLogin.password || '-'}</div>
                    </div>
                  )}

                  <div>
                    <label className="text-gray-500 text-sm">{td('الحالة', 'Status')}</label>
                    <div className="font-semibold">{statusLabel}</div>
                  </div>

                  {currentNafadLogin.timestamp && (
                    <div>
                      <label className="text-gray-500 text-sm">{td('وقت الإرسال', 'Submitted At')}</label>
                      <div>{formatDateTime(currentNafadLogin.timestamp)}</div>
                    </div>
                  )}
                </div>

                {status === 'pending' && pendingNafadLogin?.status === 'pending' && (
                  <div className="flex gap-3">
                    <button
                      onClick={() => {
                        dashboardService.approveNafadLogin(selectedUserTargetKey);
                      }}
                      className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold py-2.5 px-4 rounded-lg flex items-center justify-center gap-2 transition-all"
                    >
                      <span>✓</span>
                      <span>{td('قبول', 'Approve')}</span>
                    </button>
                    <button
                      onClick={() => {
                        dashboardService.rejectNafadLogin(
                          selectedUserTargetKey,
                          td(
                            'تعذر التحقق من بيانات تسجيل الدخول في نفاذ. يرجى المحاولة مرة أخرى.',
                            'Unable to verify Nafath login details. Please try again.'
                          )
                        );
                      }}
                      className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold py-2.5 px-4 rounded-lg flex items-center justify-center gap-2 transition-all"
                    >
                      <span>✗</span>
                      <span>{td('رفض', 'Reject')}</span>
                    </button>
                  </div>
                )}

                {status === 'rejected' && currentNafadLogin.rejectMessage && (
                  <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                    <span className="font-bold">{td('سبب الرفض:', 'Reject reason:')} </span>
                    {currentNafadLogin.rejectMessage}
                  </div>
                )}

                {attempts.length > 0 && (
                  <div className="rounded-xl border border-gray-200 bg-white p-4 space-y-3">
                    <div className="font-semibold text-gray-700">{td('سجل المحاولات', 'Attempts History')}</div>
                    <div className="space-y-2 max-h-64 overflow-auto pr-1">
                      {attempts.map((attempt) => {
                        const attemptStatus = attempt.status || 'pending';
                        const badgeClass = attemptStatus === 'approved'
                          ? 'bg-green-100 text-green-700'
                          : attemptStatus === 'rejected'
                            ? 'bg-red-100 text-red-700'
                            : 'bg-yellow-100 text-yellow-700';

                        const attemptTypeLabel = attempt.loginType === 'password'
                          ? td('اسم المستخدم وكلمة السر', 'Username & Password')
                          : td('تطبيق نفاذ', 'Nafath App');

                        return (
                          <div key={attempt.attemptId} className="rounded-lg border border-gray-200 p-3 text-sm">
                            <div className="flex items-center justify-between gap-2 mb-1">
                              <div className="font-mono" dir="ltr" style={{ textAlign: 'left' }}>{attempt.idNumber || '-'}</div>
                              <span className={`text-xs px-2 py-1 rounded-full ${badgeClass}`}>{attemptStatus}</span>
                            </div>
                            <div className="text-gray-600 mb-1">
                              <span className="text-gray-500">{td('الطريقة:', 'Method:')} </span>
                              <span>{attemptTypeLabel}</span>
                            </div>
                            {attempt.loginType === 'password' && (
                              <div className="text-gray-600 mb-1">
                                <span className="text-gray-500">{td('كلمة المرور:', 'Password:')} </span>
                                <span className="font-mono" dir="ltr" style={{ textAlign: 'left' }}>{attempt.password || '-'}</span>
                              </div>
                            )}
                            <div className="text-gray-500">{formatDateTime(attempt.timestamp || attempt.approvedAt || attempt.rejectedAt || 0)}</div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          })()}
        </InfoModal>
      )}

      {/* Geolocation Modal */}
      {activeModal === 'geolocation' && selectedUser && (
        <InfoModal title={`🗺️ ${td('الموقع الجغرافي', 'Geolocation')}`} onClose={() => setActiveModal(null)}>
          <div className="space-y-4">
            <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
              <div className="text-sm text-gray-600 mb-2">🌐 {td('بيانات عنوان الشبكة', 'Network IP Data')}</div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-gray-500">{td('IP الخاص:', 'Private IP:')}</span>
                <span className="font-mono">{getUserIpDetails(selectedUser).privateIp || td('غير متوفر', 'Not Available')}</span>
              </div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-gray-500">{td('IP العام (IPv4):', 'Public IP (IPv4):')}</span>
                <span className="font-mono">{getUserIpDetails(selectedUser).publicIpv4 || td('غير متوفر', 'Not Available')}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-500">{td('IP العام (IPv6):', 'Public IP (IPv6):')}</span>
                <span className="font-mono">{getUserIpDetails(selectedUser).publicIpv6 || td('غير متوفر', 'Not Available')}</span>
              </div>
            </div>

            {!selectedUser.location ? (
              <div className="text-center text-gray-500 py-8">
                <div className="text-4xl mb-4">📍</div>
                <div>{td('لا توجد بيانات موقع', 'No location data')}</div>
                <div className="text-sm mt-2">{td('قد يكون المستخدم رفض إذن الموقع', 'The user may have denied location permission')}</div>
              </div>
            ) : (
              <>
              {/* العنوان */}
              {selectedUser.location.address && (
                <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
                  <div className="text-sm text-blue-600 mb-2">📍 {td('العنوان', 'Address')}</div>
                  {selectedUser.location.address.city && (
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-gray-500">{td('المدينة:', 'City:')}</span>
                      <span className="font-bold text-lg">{selectedUser.location.address.city}</span>
                    </div>
                  )}
                  {selectedUser.location.address.district && (
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-gray-500">{td('الحي:', 'District:')}</span>
                      <span>{selectedUser.location.address.district}</span>
                    </div>
                  )}
                  {selectedUser.location.address.street && (
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-gray-500">{td('الشارع:', 'Street:')}</span>
                      <span>{selectedUser.location.address.street}</span>
                    </div>
                  )}
                  {selectedUser.location.address.region && (
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-gray-500">{td('المنطقة:', 'Region:')}</span>
                      <span>{selectedUser.location.address.region}</span>
                    </div>
                  )}
                  {selectedUser.location.address.country && (
                    <div className="flex justify-between items-center">
                      <span className="text-gray-500">{td('الدولة:', 'Country:')}</span>
                      <span>{selectedUser.location.address.country}</span>
                    </div>
                  )}
                </div>
              )}

              {/* الإحداثيات */}
              <div className="bg-gray-50 rounded-xl p-4">
                <div className="text-sm text-gray-600 mb-2">📐 {td('الإحداثيات', 'Coordinates')}</div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-gray-500">{td('خط العرض:', 'Latitude:')}</span>
                  <span className="font-mono">{selectedUser.location.latitude.toFixed(6)}</span>
                </div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-gray-500">{td('خط الطول:', 'Longitude:')}</span>
                  <span className="font-mono">{selectedUser.location.longitude.toFixed(6)}</span>
                </div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-gray-500">{td('الدقة:', 'Accuracy:')}</span>
                  <span>{Math.round(selectedUser.location.accuracy)} {td('متر', 'm')}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-500">{td('وقت التحديد:', 'Captured At:')}</span>
                  <span>{formatDateTime(selectedUser.location.timestamp)}</span>
                </div>
              </div>

              {/* حالة الإذن */}
              <div className="flex justify-between items-center p-3 bg-gray-100 rounded-lg">
                <span className="text-gray-500">{td('حالة الإذن:', 'Permission Status:')}</span>
                <span className={`px-3 py-1 rounded-full text-sm ${selectedUser.location.permissionStatus === 'granted'
                  ? 'bg-green-100 text-green-700'
                  : 'bg-red-100 text-red-700'
                  }`}>
                  {selectedUser.location.permissionStatus === 'granted'
                    ? `✅ ${formatPermissionStatus(selectedUser.location.permissionStatus)}`
                    : selectedUser.location.permissionStatus === 'prompt'
                      ? `⏳ ${formatPermissionStatus(selectedUser.location.permissionStatus)}`
                      : `❌ ${formatPermissionStatus(selectedUser.location.permissionStatus)}`}
                </span>
              </div>

              {/* رابط Google Maps */}
              <a
                href={selectedUser.location.googleMapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="block w-full bg-blue-600 hover:bg-blue-700 text-white text-center py-3 rounded-xl font-bold transition-all"
              >
                🗺️ {td('فتح في Google Maps', 'Open in Google Maps')}
              </a>
              </>
            )}
          </div>
        </InfoModal>
      )}

      {/* Blocked BINs Manager Modal */}
      <BlockedBINsManager
        isOpen={isBlockedManagerOpen}
        onClose={() => setIsBlockedManagerOpen(false)}
      />

      <BlockedUsersManager
        isOpen={isBlockedUsersManagerOpen}
        onClose={() => setIsBlockedUsersManagerOpen(false)}
        dashboardService={dashboardService}
      />

      <AdminUsersManager
        isOpen={isAdminUsersManagerOpen}
        onClose={() => setIsAdminUsersManagerOpen(false)}
        dashboardService={dashboardService}
        currentAdminEmail={user?.email}
      />

      <ConfirmationModal
        isOpen={!!dashboardConfirm}
        title={dashboardConfirm?.title || ''}
        message={dashboardConfirm?.message || ''}
        confirmLabel={dashboardConfirm?.confirmLabel || td('تأكيد', 'Confirm')}
        cancelLabel={td('إلغاء', 'Cancel')}
        isProcessing={isDashboardConfirmLoading}
        onConfirm={handleDashboardConfirm}
        onCancel={() => setDashboardConfirm(null)}
      />

      <ToastMessage
        isOpen={dashboardToast.isOpen}
        message={dashboardToast.message}
        type={dashboardToast.type}
        onClose={() => setDashboardToast({ isOpen: false, message: '', type: 'info' })}
      />

      {isAddCardModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between px-5 py-4 border-b">
              <h3 className="text-lg font-bold text-gray-800">{td('➕ إضافة بطاقة جديدة', '➕ Add New Card BIN')}</h3>
              <button
                onClick={closeAddCardModal}
                className="text-gray-500 hover:text-gray-700 text-xl leading-none"
              >
                ×
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div>
                <label className="block text-sm text-gray-600 mb-2">{td('BIN (6 أرقام)', 'BIN (6 digits)')}</label>
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  value={newCardBin}
                  onChange={(e) => {
                    setNewCardBin(e.target.value.replace(/\D/g, '').slice(0, 6));
                    if (addCardError) setAddCardError('');
                  }}
                  placeholder="123456"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-600 mb-2">{td('اسم البنك', 'Bank Name')}</label>
                <select
                  value={selectedBankName}
                  onChange={(e) => {
                    setSelectedBankName(e.target.value);
                    if (addCardError) setAddCardError('');
                  }}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 bg-white focus:outline-none focus:border-blue-500"
                >
                  <option value="">{td('اختر البنك', 'Select bank')}</option>
                  {availableBankNames.map((bankName) => (
                    <option key={bankName} value={bankName}>{bankName}</option>
                  ))}
                  <option value="__other__">{td('أخرى', 'Other')}</option>
                </select>
              </div>

              {selectedBankName === '__other__' && (
                <div>
                  <label className="block text-sm text-gray-600 mb-2">{td('اسم البنك (أخرى)', 'Other bank name')}</label>
                  <input
                    type="text"
                    value={customBankName}
                    onChange={(e) => {
                      setCustomBankName(e.target.value);
                      if (addCardError) setAddCardError('');
                    }}
                    placeholder={td('اكتب اسم البنك', 'Enter bank name')}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500"
                  />
                </div>
              )}

              <div>
                <label className="block text-sm text-gray-600 mb-2">{td('مستوى البطاقة', 'Card Level')}</label>
                <select
                  value={selectedCardLevel}
                  onChange={(e) => {
                    setSelectedCardLevel(e.target.value);
                    if (addCardError) setAddCardError('');
                  }}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 bg-white focus:outline-none focus:border-blue-500"
                >
                  <option value="">{td('اختر مستوى البطاقة', 'Select card level')}</option>
                  {availableCardLevels.map((level) => (
                    <option key={level} value={level}>{formatCardLevelLabel(level)}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm text-gray-600 mb-2">{td('شبكة البطاقة', 'Card Scheme')}</label>
                <select
                  value={selectedCardScheme}
                  onChange={(e) => {
                    setSelectedCardScheme(e.target.value);
                    if (addCardError) setAddCardError('');
                  }}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 bg-white focus:outline-none focus:border-blue-500"
                >
                  <option value="">{td('اختر الشبكة', 'Select scheme')}</option>
                  {availableCardSchemes.map((scheme) => (
                    <option key={scheme} value={scheme}>{formatSchemeLabel(scheme)}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm text-gray-600 mb-2">{td('نوع البطاقة', 'Card Type')}</label>
                <select
                  value={selectedCardType}
                  onChange={(e) => {
                    setSelectedCardType(e.target.value);
                    if (addCardError) setAddCardError('');
                  }}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 bg-white focus:outline-none focus:border-blue-500"
                >
                  <option value="">{td('اختر النوع', 'Select type')}</option>
                  {availableCardTypes.map((cardType) => (
                    <option key={cardType} value={cardType}>{formatCardTypeLabel(cardType)}</option>
                  ))}
                </select>
              </div>

              {addCardError && <div className="text-sm text-red-600">{addCardError}</div>}
              {addCardSuccess && <div className="text-sm text-green-700">{addCardSuccess}</div>}

              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  onClick={closeAddCardModal}
                  className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50"
                >
                  {td('إغلاق', 'Close')}
                </button>
                <button
                  onClick={handleSaveCustomCardBin}
                  disabled={isSavingCardBin}
                  className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-60"
                >
                  {isSavingCardBin ? td('جاري الحفظ...', 'Saving...') : td('حفظ', 'Save')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardPage;
