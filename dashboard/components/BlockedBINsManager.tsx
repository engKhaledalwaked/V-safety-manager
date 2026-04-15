import React, { useState, useEffect } from 'react';
import { AdminAPI } from '../../services/server';
import ConfirmationModal from './ConfirmationModal';
import ToastMessage from './ToastMessage';

const dashboardService = new AdminAPI();

interface BlockedBIN {
    id: string;
    bin: string;
    description: string;
    createdAt: number;
    updatedAt: number;
}

interface BlockedBINsManagerProps {
    isOpen: boolean;
    onClose: () => void;
}

const BlockedBINsManager: React.FC<BlockedBINsManagerProps> = ({ isOpen, onClose }) => {
    const [blockedBINs, setBlockedBINs] = useState<BlockedBIN[]>([]);
    const [newBIN, setNewBIN] = useState('');
    const [newDescription, setNewDescription] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [formError, setFormError] = useState('');
    const [statusMessage, setStatusMessage] = useState('');
    const [pendingBinDeleteId, setPendingBinDeleteId] = useState<string | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [toastState, setToastState] = useState<{ isOpen: boolean; message: string; type: 'success' | 'error' | 'info' }>({
        isOpen: false,
        message: '',
        type: 'info'
    });

    useEffect(() => {
        if (isOpen) {
            loadBlockedBINs();
        }
    }, [isOpen]);

    const loadBlockedBINs = async () => {
        setIsLoading(true);
        try {
            const bins = await dashboardService.getBlockedBINs();
            setBlockedBINs(bins as BlockedBIN[]);
        } catch (error) {
            console.error('Failed to load blocked BINs:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleAddBIN = async () => {
        const cleanBin = newBIN.replace(/\D/g, '');
        const cleanDescription = newDescription.trim();

        if (!(cleanBin.length === 4 || cleanBin.length === 6)) {
            setFormError('يرجى إدخال BIN مكوّن من 4 أو 6 أرقام فقط');
            setStatusMessage('');
            return;
        }

        if (!cleanDescription) {
            setFormError('يرجى إدخال سبب الحظر');
            setStatusMessage('');
            return;
        }

        try {
            setFormError('');
            await dashboardService.addBlockedBIN(cleanBin, cleanDescription);
            setNewBIN('');
            setNewDescription('');
            await loadBlockedBINs();
            setStatusMessage('تم حفظ BIN المحظور بنجاح');
        } catch (error) {
            console.error('Failed to add BIN:', error);
            setFormError('تعذر حفظ BIN، يرجى المحاولة مرة أخرى');
            setStatusMessage('');
        }
    };

    const handleRemoveBIN = (binId: string) => {
        setPendingBinDeleteId(binId);
    };

    const handleConfirmRemoveBIN = async () => {
        if (!pendingBinDeleteId) return;

        try {
            setIsDeleting(true);
            setFormError('');
            await dashboardService.removeBlockedBIN(pendingBinDeleteId);
            await loadBlockedBINs();
            setStatusMessage('تم حذف BIN المحظور بنجاح');
            setToastState({ isOpen: true, message: 'تم حذف BIN المحظور بنجاح', type: 'success' });
            setPendingBinDeleteId(null);
        } catch (error) {
            console.error('Failed to remove BIN:', error);
            setFormError('تعذر حذف BIN، يرجى المحاولة مرة أخرى');
            setStatusMessage('');
            setToastState({ isOpen: true, message: 'تعذر حذف BIN، يرجى المحاولة مرة أخرى', type: 'error' });
        } finally {
            setIsDeleting(false);
        }
    };

    if (!isOpen) {
        return null;
    }

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-y-auto animate-fadeIn">
                <div className="flex justify-between items-center p-6 border-b sticky top-0 bg-white">
                    <h3 className="text-xl font-bold text-gray-800">🚫 إدارة البطاقات المحظورة</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-red-500 text-2xl">&times;</button>
                </div>

                <div className="p-6 space-y-6">
                    {/* Add New BIN Section */}
                    <div className="bg-gray-50 p-4 rounded-xl">
                        <div className="grid grid-cols-2 gap-4 mb-4">
                            <div>
                                <label className="text-gray-500 text-sm mb-2 block">رقم البطاقة (BIN)</label>
                                <input
                                    type="text"
                                    placeholder="أربع أو ست أرقام"
                                    value={newBIN}
                                    onChange={(e) => {
                                        setNewBIN(e.target.value.replace(/\D/g, '').substring(0, 6));
                                        if (formError) setFormError('');
                                    }}
                                    maxLength={6}
                                    className="w-full bg-white text-gray-800 px-4 py-2 rounded-lg border border-gray-300 focus:border-blue-500 focus:outline-none"
                                />
                            </div>
                            <div>
                                <label className="text-gray-500 text-sm mb-2 block">وصف</label>
                                <input
                                    type="text"
                                    placeholder="وصف الحظر"
                                    value={newDescription}
                                    onChange={(e) => {
                                        setNewDescription(e.target.value);
                                        if (formError) setFormError('');
                                    }}
                                    className="w-full bg-white text-gray-800 px-4 py-2 rounded-lg border border-gray-300 focus:border-blue-500 focus:outline-none"
                                />
                            </div>
                        </div>
                        {formError && (
                            <div className="mb-3 text-sm text-red-600">{formError}</div>
                        )}
                        {statusMessage && (
                            <div className="mb-3 text-sm text-green-700">{statusMessage}</div>
                        )}
                        <button
                            onClick={handleAddBIN}
                            className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg flex items-center gap-2 transition-all"
                        >
                            <span>➕</span>
                            <span>إضافة</span>
                        </button>
                    </div>

                    {/* Blocked BINs List */}
                    <div>
                        <h4 className="text-lg font-semibold text-gray-800 mb-4">قائمة البطاقات المحظورة</h4>
                        <div className="space-y-2">
                            {isLoading ? (
                                <div className="text-gray-500 text-center py-4">جاري التحميل...</div>
                            ) : blockedBINs.length === 0 ? (
                                <div className="text-gray-500 text-center py-4">لا توجد بطاقات محظورة</div>
                            ) : (
                                blockedBINs.map((bin) => (
                                    <div key={bin.id} className="bg-gray-50 rounded-lg p-3 flex items-center justify-between">
                                        <div>
                                            <div className="font-mono text-lg text-gray-800">{bin.bin}</div>
                                            {bin.description && (
                                                <div className="text-gray-600 text-sm">{bin.description}</div>
                                            )}
                                            <div className="text-gray-500 text-xs mt-1">
                                                آخر تحديث: {new Date(bin.updatedAt).toLocaleDateString('ar-SA')}
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => handleRemoveBIN(bin.id)}
                                            className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded-lg text-sm transition-all"
                                        >
                                            حذف
                                        </button>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <ConfirmationModal
                isOpen={!!pendingBinDeleteId}
                title="تأكيد حذف BIN"
                message="هل أنت متأكد من حذف هذا BIN؟"
                confirmLabel="حذف"
                cancelLabel="إلغاء"
                isProcessing={isDeleting}
                onConfirm={handleConfirmRemoveBIN}
                onCancel={() => setPendingBinDeleteId(null)}
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

export default BlockedBINsManager;