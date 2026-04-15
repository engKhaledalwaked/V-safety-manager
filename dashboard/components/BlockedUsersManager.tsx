import React, { useState, useEffect } from 'react';
import { db } from '../../firebaseConfig';
import { ref, onValue, remove, update } from 'firebase/database';
import { BlockedUser } from '../../shared/types';
import { AdminAPI } from '../../services/server';
import ConfirmationModal from './ConfirmationModal';
import ToastMessage from './ToastMessage';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  dashboardService: AdminAPI;
}

const td = (ar: string, en: string) => ar; // Default to Arabic

const BlockedUsersManager: React.FC<Props> = ({ isOpen, onClose, dashboardService }) => {
  const [blockedUsers, setBlockedUsers] = useState<BlockedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [pendingAction, setPendingAction] = useState<{ type: 'unblock' | 'remove'; user: BlockedUser } | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [toastState, setToastState] = useState<{ isOpen: boolean; message: string; type: 'success' | 'error' | 'info' }>({
    isOpen: false,
    message: '',
    type: 'info'
  });

  useEffect(() => {
    if (!isOpen) return;
    
    setLoading(true);
    const blockedRef = ref(db, 'blockedUsers');
    const unsubscribe = onValue(blockedRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const usersList: BlockedUser[] = Object.keys(data).map(key => ({
          ...data[key],
          id: key // using the Firebase key which is usually safeIp
        }));
        
        usersList.sort((a, b) => b.blockedAt - a.blockedAt);
        setBlockedUsers(usersList);
      } else {
        setBlockedUsers([]);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [isOpen]);

  const handleUnblock = (user: BlockedUser) => {
    setPendingAction({ type: 'unblock', user });
  };

  const handleRemoveRecord = (user: BlockedUser) => {
    setPendingAction({ type: 'remove', user });
  };

  const handleConfirmAction = async () => {
    if (!pendingAction) return;

    setIsProcessing(true);
    try {
      if (pendingAction.type === 'unblock') {
        const safeIp = pendingAction.user.id;
        if (db) {
          await update(ref(db, `users/${safeIp}`), {
            isBlocked: false
          });
        }
        const targetIp = pendingAction.user.privateIp || safeIp.replace(/_/g, '.');
        dashboardService.unblockUser(targetIp);
        setToastState({ isOpen: true, message: td('تم إلغاء الحظر بنجاح', 'Unblocked successfully'), type: 'success' });
      } else {
        await remove(ref(db, `blockedUsers/${pendingAction.user.id}`));
        setToastState({ isOpen: true, message: td('تم حذف السجل بنجاح', 'Record deleted successfully'), type: 'success' });
      }
    } catch (error) {
      console.error('Blocked user action failed:', error);
      setToastState({ isOpen: true, message: td('حدث خطأ أثناء تنفيذ العملية', 'Action failed'), type: 'error' });
    } finally {
      setIsProcessing(false);
      setPendingAction(null);
    }
  };

  if (!isOpen) return null;

  const formatDate = (ts: number) => {
    if (!ts) return '-';
    return new Date(ts).toLocaleString('en-US', {
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit'
    });
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black/60 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[85vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-5 border-b">
          <div>
            <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
              <span className="text-2xl">⛔</span>
              {td('إدارة الأشخاص المحظورين', 'Blocked Users Management')}
            </h3>
            <p className="text-sm text-gray-500 mt-1">
              {td('هؤلاء الأشخاص محظورون بناءً على IP العام الخاص بهم', 'These individuals are blocked based on their public IPs')}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-red-500 text-2xl leading-none transition-colors"
          >
            ×
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 bg-gray-50">
          {loading ? (
            <div className="flex justify-center items-center h-32">
              <div className="w-8 h-8 border-4 border-red-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : blockedUsers.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
              <div className="text-5xl mb-4">👍</div>
              <h3 className="text-lg font-bold text-gray-700">{td('لا يوجد مستخدمون محظورون', 'No blocked users')}</h3>
            </div>
          ) : (
            <div className="grid gap-4">
              {blockedUsers.map((user) => (
                <div key={user.id} className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm hover:shadow transition-shadow flex items-start justify-between flex-wrap gap-4">
                  <div className="flex-1 min-w-[250px]">
                    <div className="flex items-center gap-2 mb-2">
                      <h4 className="font-bold text-gray-800 text-lg">{user.name || td('غير معروف', 'Unknown Name')}</h4>
                      <span className="px-2 py-1 bg-red-100 text-red-800 text-xs font-bold rounded-full">
                        {td('محظور', 'Blocked')}
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2 mb-2">
                      <div className="text-sm">
                        <span className="text-gray-500">{td('IP الخاص:', 'Private IP:')}</span>
                        <span className="ml-2 font-mono text-gray-700">{user.privateIp || '-'}</span>
                      </div>
                      <div className="text-sm">
                        <span className="text-gray-500">{td('تاريخ الحظر:', 'Blocked At:')}</span>
                        <span className="ml-2 text-gray-700">{formatDate(user.blockedAt)}</span>
                      </div>
                      <div className="text-sm">
                        <span className="text-gray-500">{td('IP (IPv4):', 'IPv4:')}</span>
                        <span className="ml-2 font-mono font-bold text-red-600">{user.publicIpv4 || '-'}</span>
                      </div>
                      <div className="text-sm">
                        <span className="text-gray-500">{td('IP (IPv6):', 'IPv6:')}</span>
                        <span className="ml-2 font-mono font-bold text-red-600">{user.publicIpv6 || '-'}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex flex-col gap-2 min-w-[140px]">
                    <button
                      onClick={() => handleUnblock(user)}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm transition-colors text-center"
                    >
                      {td('إلغاء الحظر', 'Unblock')}
                    </button>
                    <button
                      onClick={() => handleRemoveRecord(user)}
                      className="w-full bg-red-100 hover:bg-red-200 text-red-700 px-4 py-2 rounded-lg text-sm transition-colors text-center"
                    >
                      {td('حذف السجل', 'Delete Record')}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <ConfirmationModal
        isOpen={!!pendingAction}
        title={pendingAction?.type === 'unblock' ? td('تأكيد إلغاء الحظر', 'Confirm Unblock') : td('تأكيد حذف السجل', 'Confirm Delete Record')}
        message={pendingAction?.type === 'unblock'
          ? td('هل أنت متأكد من إلغاء حظر هذا المستخدم؟', 'Are you sure you want to unblock this user?')
          : td('هل أنت متأكد من إزالة هذا السجل نهائياً؟', 'Are you sure you want to remove this record permanently?')}
        confirmLabel={pendingAction?.type === 'unblock' ? td('إلغاء الحظر', 'Unblock') : td('حذف', 'Delete')}
        cancelLabel={td('إلغاء', 'Cancel')}
        isProcessing={isProcessing}
        onConfirm={handleConfirmAction}
        onCancel={() => setPendingAction(null)}
      />

      <ToastMessage
        isOpen={toastState.isOpen}
        message={toastState.message}
        type={toastState.type}
        onClose={() => setToastState({ isOpen: false, message: '', type: 'info' })}
      />
    </div>
  );
};

export default BlockedUsersManager;
