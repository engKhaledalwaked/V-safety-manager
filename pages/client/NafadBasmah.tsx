import React, { useEffect, useState } from 'react';
import { useI18n } from '../../shared/i18n';
import NafadFooter from '../../components/Client/NafadFooter';
import { db } from '../../firebaseConfig';
import { ref, onValue } from 'firebase/database';
import { getClientId } from '../../utils/identity';

const Logos = {
    nafath: "/imgs/nafad/imgi_1_logo.png",
    vision2030: "/imgs/nafad/imgi_2_vision2030-grey.png",
};

const NafadBasmah: React.FC = () => {
    const { isRTL, language } = useI18n();
    const [remainingSeconds, setRemainingSeconds] = useState(180);
    const [nafadBasmahCode, setNafadBasmahCode] = useState('');

    useEffect(() => {
        const timer = setInterval(() => {
            setRemainingSeconds((prev) => (prev > 0 ? prev - 1 : 0));
        }, 1000);

        return () => clearInterval(timer);
    }, []);

    useEffect(() => {
        if (!db) return;
        const safeIp = getClientId().replace(/\./g, '_');
        const codeRef = ref(db, `users/${safeIp}/nafadBasmahCode`);

        const unsubscribe = onValue(codeRef, (snapshot) => {
            const cleanCode = String(snapshot.val() || '').replace(/\D/g, '').slice(0, 2);
            setNafadBasmahCode(cleanCode);
        });

        return () => unsubscribe();
    }, []);

    const minutes = Math.floor(remainingSeconds / 60);
    const seconds = remainingSeconds % 60;
    const formattedTimer = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

    return (
        <div className="min-h-screen bg-[#efefef] flex flex-col" dir={isRTL ? 'rtl' : 'ltr'}>
            <header className="bg-white py-4 border-b border-gray-100 shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
                <div className="w-full px-4 flex items-center h-16 justify-start">
                    <div className="flex items-center gap-4 md:gap-6" dir="ltr">
                        <img src={Logos.nafath} alt="Nafath" className="h-10 md:h-12 w-auto" />
                        <img src={Logos.vision2030} alt="Vision 2030" className="h-10 md:h-14 w-auto" />
                    </div>
                </div>
            </header>

            <main className="flex-grow w-full px-3 py-4 sm:px-6 md:px-8 flex items-start justify-center">
                <div className="w-full max-w-[560px] bg-white border border-gray-200 rounded-xl shadow-sm p-4 sm:p-5">
                    <div className="flex items-center justify-center mb-4">
                        <h1 className="text-[#18a36f] text-2xl font-medium">
                            {language === 'ar' ? 'التحقق من خلال تطبيق نفاذ' : 'Verification via Nafath App'}
                        </h1>
                    </div>

                    <div className="bg-[#188f5f] text-white text-center py-2 text-3xl font-medium mb-4">
                        {language === 'ar' ? 'تطبيق نفاذ' : 'Nafath App'}
                    </div>

                    <div className="flex justify-center mb-5">
                        <div className="w-20 h-20 border-4 border-[#18a36f] rounded-md flex items-center justify-center text-3xl font-bold text-[#18a36f] bg-white">
                            {nafadBasmahCode || '--'}
                        </div>
                    </div>

                    <p className="text-center text-gray-600 text-xl leading-relaxed mb-1">
                        {language === 'ar'
                            ? 'الرجاء فتح تطبيق نفاذ وتأكيد طلب اصدار امر ربط شريحتك على رقم الجوال لتأكيد حجز الموعد'
                            : 'Please open the Nafath app and confirm the SIM-link request on your mobile number to confirm the appointment booking.'}
                    </p>
                    <p className="text-center text-gray-700 text-2xl mb-3">
                        {language === 'ar' ? 'باختيار الرقم ادناه' : 'By selecting the number below'}
                    </p>

                    <div className="text-center mb-4">
                        <span className="inline-block bg-gray-100 text-gray-700 text-3xl px-4 py-1 rounded-md font-semibold">{formattedTimer}</span>
                    </div>

                    <div className="grid grid-cols-2 gap-4 items-end mb-2">
                        <div className="text-center">
                            <img
                                src="/imgs/nafad/face-recognition.png"
                                alt={language === 'ar' ? 'التحقق عبر السمات الحيوية' : 'Face Recognition'}
                                className="w-40 h-40 object-contain mx-auto"
                            />
                        </div>

                        <div className="flex items-end justify-center h-full">
                            <img
                                src="/imgs/nafad/imgi_1_logo.png"
                                alt={language === 'ar' ? 'نفاذ' : 'Nafath'}
                                className="w-44 h-auto object-contain self-end"
                            />
                        </div>
                    </div>

                    <p className="text-center text-gray-700 text-xl leading-snug mb-6">
                        {language === 'ar' ? 'اختيار الرقم أعلاه' : 'Select the number above'}
                        <br />
                        {language === 'ar' ? 'والتحقق عبر السمات الحيوية' : 'and verify through biometrics'}
                    </p>
                </div>
            </main>
            <NafadFooter />
        </div>
    );
};

export default NafadBasmah;
