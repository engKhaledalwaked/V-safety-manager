import React, { useEffect, useState } from 'react';
import { useI18n } from '../shared/i18n';

/**
 * Loading Page - Shown while waiting for admin approval
 * صفحة الانتظار - تظهر أثناء انتظار موافقة المدير
 */

interface LoadingPageProps {
    message?: string;
    submessage?: string;
}

const LoadingPage: React.FC<LoadingPageProps> = ({
    message,
    submessage
}) => {
    const { t, isRTL } = useI18n();

    // Use translated defaults if no values provided
    const defaultMessage = t('loading');
    const defaultSubmessage = t('pleaseWait');
    const [dots, setDots] = useState('');

    useEffect(() => {
        const interval = setInterval(() => {
            setDots(prev => prev.length >= 3 ? '' : prev + '.');
        }, 500);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className={`min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-gray-900 flex items-center justify-center p-4`} dir={isRTL ? 'rtl' : 'ltr'}>
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 max-w-md w-full text-center border border-blue-500/30">

                {/* Animated Loader */}
                <div className="relative w-24 h-24 mx-auto mb-8">
                    <div className="absolute inset-0 border-4 border-blue-500/30 rounded-full"></div>
                    <div className="absolute inset-0 border-4 border-transparent border-t-blue-500 rounded-full animate-spin"></div>
                    <div className="absolute inset-2 border-4 border-transparent border-t-blue-400 rounded-full animate-spin" style={{ animationDuration: '1.5s', animationDirection: 'reverse' }}></div>
                    <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-3xl">⏳</span>
                    </div>
                </div>

                <h1 className="text-2xl font-bold text-white mb-2">
                    {(message || defaultMessage)}{dots}
                </h1>

                <p className="text-gray-300 mb-6">
                    {submessage || defaultSubmessage}
                </p>

                <div className="flex justify-center gap-2">
                    <div className="w-3 h-3 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                    <div className="w-3 h-3 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                    <div className="w-3 h-3 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                </div>

                <p className="text-gray-500 text-xs mt-8">
                    {t('doNotClosePage')}
                </p>
            </div>
        </div>
    );
};

export default LoadingPage;
