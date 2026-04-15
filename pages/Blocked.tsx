import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useI18n } from '../shared/i18n';

/**
 * Blocked Page - Shown to blocked users
 * صفحة الحظر - تظهر للمستخدمين المحظورين
 */
const BlockedPage: React.FC = () => {
    const navigate = useNavigate();
    const [countdown, setCountdown] = useState(5);
    const [debugInfo, setDebugInfo] = useState<any>(null);
    const { t, isRTL } = useI18n();

    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        if (params.get('debug') === '1') {
            const raw = sessionStorage.getItem('v_safety_geo_debug');
            if (raw) {
                try {
                    setDebugInfo(JSON.parse(raw));
                } catch {
                    setDebugInfo({ raw });
                }
            }
        }

        const timer = setInterval(() => {
            setCountdown(prev => {
                if (prev <= 1) {
                    clearInterval(timer);
                    // Redirect to Google after countdown
                    window.location.href = 'https://www.google.com';
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, []);

    return (
        <div className={`min-h-screen bg-gradient-to-br from-red-900 via-red-800 to-gray-900 flex items-center justify-center p-4`} dir={isRTL ? 'rtl' : 'ltr'}>
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 max-w-md w-full text-center border border-red-500/30">
                <div className="text-6xl mb-6">🚫</div>

                <h1 className="text-2xl font-bold text-white mb-4">
                    {t('blockedTitle')}
                </h1>

                <p className="text-gray-300 mb-6 leading-relaxed">
                    {t('blockedMessage')}
                </p>

                <div className="bg-red-500/20 rounded-lg p-4 mb-6">
                    <p className="text-red-200 text-sm">
                        You must be in Saudi Arabia to use this service.
                    </p>
                </div>

                <div className="text-gray-400 text-sm">
                    {t('redirectingIn')} <span className="text-white font-bold">{countdown}</span> {t('seconds')}...
                </div>

                {debugInfo && (
                    <div className="mt-4 text-left bg-black/30 border border-white/10 rounded-lg p-3 text-xs text-gray-200 break-all">
                        <div className="font-bold mb-2">Geo Debug</div>
                        <pre>{JSON.stringify(debugInfo, null, 2)}</pre>
                    </div>
                )}
            </div>
        </div>
    );
};

export default BlockedPage;
