import React, { useEffect } from 'react';
import { useI18n } from '../../shared/i18n';

const WhatsApp: React.FC = () => {
    const { t } = useI18n();

    useEffect(() => {
        // Redirect logic
        window.location.href = "https://wa.me/966500000000"; // Replace with actual number
    }, []);

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#25D366] px-4">
            <div className="text-white text-center">
                <div className="text-5xl sm:text-6xl mb-4">💬</div>
                <h2 className="text-xl sm:text-2xl font-bold">{t('whatsappRedirect')}</h2>
            </div>
        </div>
    );
};

export default WhatsApp;
