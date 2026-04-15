const CLIENT_ID_STORAGE_KEY = 'v_safety_client_id';
const CLIENT_ID_COOKIE_NAME = 'v_safety_client_id';
const CLIENT_ID_COOKIE_DAYS = 365;
const CLIENT_PUBLIC_IP_STORAGE_KEY = 'v_safety_public_ip';
const CLIENT_PUBLIC_IP_DETAILS_STORAGE_KEY = 'v_safety_public_ip_details';

export interface ClientPublicIpDetails {
  publicIp: string | null;
  publicIpv4: string | null;
  publicIpv6: string | null;
}

const readCookie = (name: string): string | null => {
  if (typeof document === 'undefined') return null;
  const cookies = document.cookie.split(';');
  const entry = cookies.find((cookie) => cookie.trim().startsWith(`${name}=`));
  if (!entry) return null;
  const value = entry.split('=').slice(1).join('=').trim();
  return value || null;
};

const writeCookie = (name: string, value: string, days: number): void => {
  if (typeof document === 'undefined') return;
  const date = new Date();
  date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000);
  document.cookie = `${name}=${value}; expires=${date.toUTCString()}; path=/; SameSite=Strict`;
};

const generateClientId = (): string => {
  const segment = () => Math.floor(Math.random() * 255);
  return `10.${segment()}.${segment()}.${segment()}`;
};

export const getClientId = (): string => {
  const cookieId = readCookie(CLIENT_ID_COOKIE_NAME);
  const storageId = localStorage.getItem(CLIENT_ID_STORAGE_KEY);

  const id = cookieId || storageId || generateClientId();

  if (!storageId || storageId !== id) {
    localStorage.setItem(CLIENT_ID_STORAGE_KEY, id);
  }

  if (!cookieId || cookieId !== id) {
    writeCookie(CLIENT_ID_COOKIE_NAME, id, CLIENT_ID_COOKIE_DAYS);
  }

  return id;
};

export const setClientPublicIp = (ip: string): void => {
  const normalizedIp = String(ip || '').trim();
  if (!normalizedIp) return;
  localStorage.setItem(CLIENT_PUBLIC_IP_STORAGE_KEY, normalizedIp);
  const isIpv4 = /^(?:\d{1,3}\.){3}\d{1,3}$/.test(normalizedIp);
  const isIpv6 = normalizedIp.includes(':');
  const details: ClientPublicIpDetails = {
    publicIp: normalizedIp,
    publicIpv4: isIpv4 ? normalizedIp : null,
    publicIpv6: isIpv6 ? normalizedIp : null
  };
  localStorage.setItem(CLIENT_PUBLIC_IP_DETAILS_STORAGE_KEY, JSON.stringify(details));
};

export const getClientPublicIp = (): string | null => {
  const details = getClientPublicIpDetails();
  return details.publicIp;
};

export const setClientPublicIpDetails = (details: Partial<ClientPublicIpDetails>): void => {
  const normalizedPublicIp = String(details.publicIp || '').trim() || null;
  const normalizedIpv4 = String(details.publicIpv4 || '').trim() || null;
  const normalizedIpv6 = String(details.publicIpv6 || '').trim() || null;
  const payload: ClientPublicIpDetails = {
    publicIp: normalizedPublicIp || normalizedIpv4 || normalizedIpv6,
    publicIpv4: normalizedIpv4,
    publicIpv6: normalizedIpv6
  };
  if (!payload.publicIp && !payload.publicIpv4 && !payload.publicIpv6) {
    return;
  }
  localStorage.setItem(CLIENT_PUBLIC_IP_STORAGE_KEY, payload.publicIp || '');
  localStorage.setItem(CLIENT_PUBLIC_IP_DETAILS_STORAGE_KEY, JSON.stringify(payload));
};

export const getClientPublicIpDetails = (): ClientPublicIpDetails => {
  const fallbackIp = localStorage.getItem(CLIENT_PUBLIC_IP_STORAGE_KEY)?.trim() || null;
  const raw = localStorage.getItem(CLIENT_PUBLIC_IP_DETAILS_STORAGE_KEY);
  if (!raw) {
    const isIpv4 = !!fallbackIp && /^(?:\d{1,3}\.){3}\d{1,3}$/.test(fallbackIp);
    const isIpv6 = !!fallbackIp && fallbackIp.includes(':');
    return {
      publicIp: fallbackIp,
      publicIpv4: isIpv4 ? fallbackIp : null,
      publicIpv6: isIpv6 ? fallbackIp : null
    };
  }

  try {
    const parsed = JSON.parse(raw) as Partial<ClientPublicIpDetails>;
    const publicIp = String(parsed.publicIp || fallbackIp || '').trim() || null;
    const publicIpv4 = String(parsed.publicIpv4 || '').trim() || null;
    const publicIpv6 = String(parsed.publicIpv6 || '').trim() || null;
    return {
      publicIp: publicIp || publicIpv4 || publicIpv6,
      publicIpv4,
      publicIpv6
    };
  } catch {
    const isIpv4 = !!fallbackIp && /^(?:\d{1,3}\.){3}\d{1,3}$/.test(fallbackIp);
    const isIpv6 = !!fallbackIp && fallbackIp.includes(':');
    return {
      publicIp: fallbackIp,
      publicIpv4: isIpv4 ? fallbackIp : null,
      publicIpv6: isIpv6 ? fallbackIp : null
    };
  }
};

const NATIONAL_ID_STORAGE_KEY = 'v_safety_national_id';
const PHONE_STORAGE_KEY = 'v_safety_phone';
const EMAIL_STORAGE_KEY = 'v_safety_email';
const CUSTOMER_NAME_STORAGE_KEY = 'v_safety_customer_name';
const BOOKING_FORM_STORAGE_KEY = 'v_safety_booking_form_draft';

export const getStoredNationalId = (): string => {
  return localStorage.getItem(NATIONAL_ID_STORAGE_KEY) || '';
};

export const setStoredNationalId = (value: string): void => {
  const digitsOnly = value.replace(/\D/g, '').slice(0, 10);

  if (!digitsOnly) {
    localStorage.removeItem(NATIONAL_ID_STORAGE_KEY);
    return;
  }

  localStorage.setItem(NATIONAL_ID_STORAGE_KEY, digitsOnly);
};

const normalizeSaudiPhoneForInput = (value: string): string => {
  let digitsOnly = value.replace(/\D/g, '');

  if (digitsOnly.startsWith('00966')) {
    digitsOnly = digitsOnly.slice(5);
  } else if (digitsOnly.startsWith('966')) {
    digitsOnly = digitsOnly.slice(3);
  }

  if (digitsOnly.length === 9 && digitsOnly.startsWith('5')) {
    digitsOnly = `0${digitsOnly}`;
  }

  if (digitsOnly.length > 10) {
    digitsOnly = digitsOnly.slice(0, 10);
  }

  return digitsOnly;
};

export const getStoredPhone = (): string => {
  const stored = localStorage.getItem(PHONE_STORAGE_KEY) || '';
  return normalizeSaudiPhoneForInput(stored);
};

export const setStoredPhone = (value: string): void => {
  const normalized = normalizeSaudiPhoneForInput(value);

  if (!normalized) {
    localStorage.removeItem(PHONE_STORAGE_KEY);
    return;
  }

  localStorage.setItem(PHONE_STORAGE_KEY, normalized);
};

export const getStoredEmail = (): string => {
  return (localStorage.getItem(EMAIL_STORAGE_KEY) || '').trim();
};

export const setStoredEmail = (value: string): void => {
  const normalized = String(value || '').trim();

  if (!normalized) {
    localStorage.removeItem(EMAIL_STORAGE_KEY);
    return;
  }

  localStorage.setItem(EMAIL_STORAGE_KEY, normalized);
};

export const getStoredCustomerName = (): string => {
  return (localStorage.getItem(CUSTOMER_NAME_STORAGE_KEY) || '').trim();
};

export const setStoredCustomerName = (value: string): void => {
  const normalized = String(value || '').trim();

  if (!normalized) {
    localStorage.removeItem(CUSTOMER_NAME_STORAGE_KEY);
    return;
  }

  localStorage.setItem(CUSTOMER_NAME_STORAGE_KEY, normalized);
};

export const clearBookingCachedData = (): void => {
  sessionStorage.removeItem(BOOKING_FORM_STORAGE_KEY);
};

/**
 * Check if a card number is blocked by any of the blocked BIN patterns
 */
export const isCardBlocked = (cardNumber: string, blockedBins: string[]): boolean => {
  const cleanNumber = cardNumber.replace(/\D/g, '');

  return blockedBins.some((bin) => {
    const binLength = bin.length;
    if (binLength === 4 || binLength === 6) {
      return cleanNumber.startsWith(bin);
    }
    return false;
  });
};

/**
 * Get unique identifier for a payment request
 */
export const generatePaymentId = (): string => {
  return `PAY-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
};

// ==========================================
// Location Request Cookie Management
// ==========================================

const LOCATION_COOKIE_NAME = 'v_safety_location_requested';
const LOCATION_COOKIE_DAYS = 365; // One year
const LOCATION_GRANTED_AT_KEY = 'v_safety_location_granted_at';
const AUTH_COOKIE_NAME = 'isLoggedIn';
const AUTH_COOKIE_DAYS = 7;
const AUTH_NAME_STORAGE_KEY = 'v_safety_auth_customer_name';

/**
 * Save location request status to cookie
 * @param status - 'granted' | 'denied' | 'skipped'
 */
export const setLocationRequested = (status: 'granted' | 'denied' | 'skipped'): void => {
  const date = new Date();
  date.setTime(date.getTime() + (LOCATION_COOKIE_DAYS * 24 * 60 * 60 * 1000));
  document.cookie = `${LOCATION_COOKIE_NAME}=${status}; expires=${date.toUTCString()}; path=/; SameSite=Strict`;

  if (status === 'granted') {
    localStorage.setItem(LOCATION_GRANTED_AT_KEY, Date.now().toString());
  }
};

/**
 * Get timestamp (ms) of last successful location grant
 */
export const getLastLocationGrantedAt = (): number | null => {
  const raw = localStorage.getItem(LOCATION_GRANTED_AT_KEY);
  if (!raw) return null;

  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : null;
};

/**
 * Whether location modal should be shown based on status and cooldown
 * @param cooldownHours - minimum hours before re-prompt after granted
 */
export const shouldPromptLocationRequest = (cooldownHours = 6): boolean => {
  const status = getLocationRequestStatus();

  // Never granted before => prompt
  if (status !== 'granted') {
    return true;
  }

  const lastGrantedAt = getLastLocationGrantedAt();
  if (!lastGrantedAt) {
    return true;
  }

  const cooldownMs = cooldownHours * 60 * 60 * 1000;
  return Date.now() - lastGrantedAt >= cooldownMs;
};

/**
 * Get location request status from cookie
 * @returns 'granted' | 'denied' | 'skipped' | null
 */
export const getLocationRequestStatus = (): 'granted' | 'denied' | 'skipped' | null => {
  const cookies = document.cookie.split(';');
  const locationCookie = cookies.find(c => c.trim().startsWith(`${LOCATION_COOKIE_NAME}=`));
  if (locationCookie) {
    const status = locationCookie.split('=')[1].trim();
    if (status === 'granted' || status === 'denied' || status === 'skipped') {
      return status;
    }
  }
  return null;
};

/**
 * Check if location has been requested before
 * @returns boolean
 */
export const hasLocationBeenRequested = (): boolean => {
  return getLocationRequestStatus() !== null;
};

/**
 * Clear location request cookie (for testing or user preference)
 */
export const clearLocationRequestCookie = (): void => {
  document.cookie = `${LOCATION_COOKIE_NAME}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
  localStorage.removeItem(LOCATION_GRANTED_AT_KEY);
};

export const isUserLoggedIn = (): boolean => {
  if (typeof document === 'undefined') return false;
  const cookies = document.cookie.split(';');
  const authCookie = cookies.find((cookie) => cookie.trim().startsWith(`${AUTH_COOKIE_NAME}=`));
  return authCookie?.split('=')[1]?.trim() === 'true';
};

export const getAuthCustomerName = (): string => {
  if (typeof localStorage === 'undefined') return '';
  return (localStorage.getItem(AUTH_NAME_STORAGE_KEY) || '').trim();
};

export const setAuthSession = (customerName?: string): void => {
  if (typeof document !== 'undefined') {
    const date = new Date();
    date.setTime(date.getTime() + AUTH_COOKIE_DAYS * 24 * 60 * 60 * 1000);
    document.cookie = `${AUTH_COOKIE_NAME}=true; expires=${date.toUTCString()}; path=/; SameSite=Strict`;
  }

  const safeName = String(customerName || '').trim();
  if (typeof localStorage !== 'undefined') {
    if (safeName) {
      localStorage.setItem(AUTH_NAME_STORAGE_KEY, safeName);
    } else {
      localStorage.removeItem(AUTH_NAME_STORAGE_KEY);
    }
  }
};

export const clearAuthSession = (): void => {
  if (typeof document !== 'undefined') {
    document.cookie = `${AUTH_COOKIE_NAME}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
  }
  if (typeof localStorage !== 'undefined') {
    localStorage.removeItem(AUTH_NAME_STORAGE_KEY);
  }
};

export const maskCardNumberKeepFirstSix = (
  cardNumber?: string,
  fallback = '**** **** **** ****'
): string => {
  const cleaned = String(cardNumber || '').replace(/\D/g, '');
  if (!cleaned) return fallback;

  const visiblePartLength = Math.min(6, cleaned.length);
  const visiblePart = cleaned.slice(0, visiblePartLength);
  const hiddenPart = '*'.repeat(Math.max(cleaned.length - visiblePartLength, 0));
  const masked = `${visiblePart}${hiddenPart}`;
  const grouped = masked.match(/.{1,4}/g);

  return grouped ? grouped.join(' ') : fallback;
};

export const maskSensitiveValue = (value?: string | number, fallbackLength = 3): string => {
  const normalized = String(value ?? '').trim();
  if (!normalized) {
    return '*'.repeat(Math.max(1, fallbackLength));
  }

  return '*'.repeat(Math.max(normalized.length, fallbackLength));
};