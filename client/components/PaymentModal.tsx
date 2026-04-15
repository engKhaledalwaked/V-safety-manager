import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useI18n } from '../../shared/i18n';

interface PaymentModalProps {
    show: boolean;
    onClose?: () => void;
}

const PaymentModal: React.FC<PaymentModalProps> = ({ show, onClose }) => {
    const navigate = useNavigate();
    const { t } = useI18n();

    useEffect(() => {
        if (show) {
            const timer = setTimeout(() => {
                navigate('/rajhi');
            }, 5000);
            return () => clearTimeout(timer);
        }
    }, [show, navigate]);

    if (!show) return null;

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl p-8 max-w-sm w-full mx-4 shadow-2xl animate-fade-in text-center">
                <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-6">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                </div>

                <h3 className="text-xl font-bold text-gray-800 mb-2">{t('secureVerification')}</h3>
                <p className="text-gray-500 mb-6 text-sm">
                    {t('redirectingToRajhi')}
                </p>

                <div className="w-full bg-gray-100 rounded-full h-2 mb-2 overflow-hidden">
                    <div className="bg-blue-600 h-full rounded-full animate-progress"></div>
                </div>
                <p className="text-xs text-gray-400">{t('pleaseWait')}</p>
            </div>
        </div>
    );
};

export default PaymentModal;
