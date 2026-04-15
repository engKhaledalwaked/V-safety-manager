import React from 'react';
import { useI18n } from '../../shared/i18n';

interface PaymentLoadingScreenProps {
    isVisible: boolean;
    onCancel?: () => void;
    title?: string;
    description?: string;
    steps?: readonly string[];
    theme?: 'default' | 'rajhi';
    logoSrc?: string;
    logoAlt?: string;
    countdownSeconds?: number;
    countdownLabel?: string;
}

const PaymentLoadingScreen: React.FC<PaymentLoadingScreenProps> = ({ isVisible, onCancel, title, description, steps, theme = 'default', logoSrc, logoAlt, countdownSeconds, countdownLabel }) => {
    if (!isVisible) return null;

    const { language, isRTL, t } = useI18n();
    const isArabic = language === 'ar';

    const isRajhiTheme = theme === 'rajhi';
    const displayTitle = title || (isArabic ? 'جاري معالجة الدفع' : 'Processing payment');
    const displayDescription = description || (isArabic
        ? 'يرجى الانتظار بينما يتم التحقق من بطاقتك...'
        : 'Please wait while your card is being verified...');
    const displaySteps = steps || (isArabic
        ? ['تحقق من صحة البيانات', 'التواصل مع البنك...', 'تأكيد العملية']
        : ['Validating details', 'Connecting to the bank...', 'Confirming transaction']);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Background Overlay */}
            <div className="absolute inset-0 bg-black/70 backdrop-blur-sm"></div>

            {/* Loading Card */}
            <div
                dir={isRTL ? 'rtl' : 'ltr'}
                className={`relative rounded-3xl shadow-2xl p-8 max-w-md w-full mx-4 animate-fadeInUp ${isRajhiTheme ? 'bg-gradient-to-b from-[#F8FCFA] to-white border border-[#117D48]/20' : 'bg-white'}`}
            >
                {isRajhiTheme && logoSrc && (
                    <div className="flex justify-center mb-4">
                        <img src={logoSrc} alt={logoAlt || 'Al Rajhi Bank'} className="h-12 object-contain" />
                    </div>
                )}

                {/* Animated Icon */}
                <div className="flex justify-center mb-6">
                    <div className="relative">
                        {/* Outer Ring */}
                        <div className={`w-24 h-24 border-4 rounded-full animate-pulse ${isRajhiTheme ? 'border-[#117D48]/20' : 'border-blue-100'}`}></div>
                        {/* Middle Ring */}
                        <div className={`absolute top-2 left-2 w-20 h-20 border-4 rounded-full animate-ping ${isRajhiTheme ? 'border-[#117D48]/35' : 'border-blue-200'}`}></div>
                        {/* Inner Circle with Icon */}
                        <div className={`absolute top-4 left-4 w-16 h-16 rounded-full flex items-center justify-center shadow-lg ${isRajhiTheme ? 'bg-gradient-to-br from-[#117D48] to-[#0D5C3A]' : 'bg-gradient-to-br from-blue-500 to-blue-700'}`}>
                            <svg className="w-8 h-8 text-white animate-spin" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                        </div>
                    </div>
                </div>

                {/* Title */}
                <h2 className="text-2xl font-bold text-center text-gray-800 mb-2">
                    {displayTitle}
                </h2>

                {/* Description */}
                <p className="text-center text-gray-500 mb-6">
                    {displayDescription}
                </p>

                {typeof countdownSeconds === 'number' && (
                    <div className="mb-6 flex items-center justify-center gap-3">
                        <div className={`w-12 h-12 rounded-full text-white font-extrabold text-lg flex items-center justify-center ${isRajhiTheme ? 'bg-[#117D48]' : 'bg-blue-600'}`}>
                            {Math.max(1, countdownSeconds)}
                        </div>
                        {countdownLabel && (
                            <span className="text-sm text-gray-600 font-medium">{countdownLabel}</span>
                        )}
                    </div>
                )}

                {/* Progress Bar */}
                <div className="w-full bg-gray-200 rounded-full h-2 mb-6 overflow-hidden">
                    <div className={`h-2 rounded-full animate-progress ${isRajhiTheme ? 'bg-gradient-to-r from-[#117D48] to-[#0D5C3A]' : 'bg-gradient-to-r from-blue-500 to-blue-700'}`}
                        style={{
                            width: '100%',
                            background: isRajhiTheme
                                ? 'linear-gradient(90deg, #117D48 0%, #2EA86A 50%, #117D48 100%)'
                                : 'linear-gradient(90deg, #3B82F6 0%, #60A5FA 50%, #3B82F6 100%)',
                            backgroundSize: '200% 100%',
                            animation: 'shimmer 1.5s infinite'
                        }}>
                    </div>
                </div>

                {/* Status Steps */}
                <div className="space-y-3">
                    <div className="flex items-center gap-3">
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center ${isRajhiTheme ? 'bg-[#117D48]' : 'bg-blue-500'}`}>
                            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                            </svg>
                        </div>
                        <span className="text-gray-600 text-sm">{displaySteps[0] || 'تحقق من صحة البيانات'}</span>
                    </div>

                    <div className="flex items-center gap-3">
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center animate-pulse ${isRajhiTheme ? 'bg-[#117D48]' : 'bg-blue-500'}`}>
                            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"></path>
                            </svg>
                        </div>
                        <span className="text-gray-600 text-sm">{displaySteps[1] || 'التواصل مع البنك...'}</span>
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center">
                            <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                        </div>
                        <span className="text-gray-400 text-sm">{displaySteps[2] || 'تأكيد العملية'}</span>
                    </div>
                </div>

                {/* Cancel Button */}
                {onCancel && (
                    <button
                        onClick={onCancel}
                        className="mt-6 w-full py-3 px-4 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-xl transition-colors text-sm font-medium"
                    >
                        {t('cancel')}
                    </button>
                )}
            </div>

            <style>{`
        @keyframes shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fadeInUp {
          animation: fadeInUp 0.3s ease-out;
        }
      `}</style>
        </div>
    );
};

export default PaymentLoadingScreen;
