import React from 'react';
import { useI18n } from '../../shared/i18n';

interface InspectionStatusModalProps {
    show?: boolean;
    isOpen?: boolean;
    onClose: () => void;
}

const InspectionStatusModal: React.FC<InspectionStatusModalProps> = ({ show, isOpen, onClose }) => {
    const { t } = useI18n();
    const isVisible = typeof isOpen === 'boolean' ? isOpen : !!show;

    if (!isVisible) return null;

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl animate-fade-in text-center">
                <div className="w-16 h-16 bg-green-50 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                </div>

                <h3 className="text-xl font-bold text-gray-800 mb-3">{t('inspectionStatusTitle')}</h3>
                <p className="text-gray-600 mb-6 leading-relaxed">
                    {t('noInspectionScheduled')}
                </p>

                <button
                    onClick={onClose}
                    className="w-full bg-green-600 text-white px-4 py-2.5 rounded-lg font-semibold hover:bg-green-700 transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
                >
                    {t('close')}
                </button>
            </div>
        </div>
    );
};

export default InspectionStatusModal;
