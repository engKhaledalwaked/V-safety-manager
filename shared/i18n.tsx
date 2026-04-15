import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

/**
 * V-Safety Internationalization System
 * نظام دعم اللغات
 */

// Supported languages
export type Language = 'ar' | 'en';

// Translation keys interface
interface Translations {
    // Common
    appName: string;
    loading: string;
    error: string;
    submit: string;
    cancel: string;
    next: string;
    back: string;
    confirm: string;
    login: string;
    close: string;

    // Navigation
    aboutService: string;
    inspectionCenters: string;
    contactUs: string;
    checkInspectionStatus: string;
    inspectionLocations: string;
    inspectionCost: string;

    // Home page
    productOf: string;
    centralizedPlatformTitle: string;
    centralizedPlatformDesc: string;
    bookAppointment: string;
    registerNewAccount: string;
    nafadForm: string;
    homeTitle: string;
    homeSubtitle: string;
    bookNow: string;
    searchBookings: string;
    searchDescription: string;
    selectRegion: string;
    selectVehicleType: string;
    selectDateTime: string;
    searchButton: string;
    whenToInspect: string;
    periodicInspection: string;
    ownershipTransfer: string;
    foreignVehicles: string;
    periodicInspectionDesc: string;
    ownershipTransferDesc: string;
    foreignVehiclesDesc: string;
    platformServices: string;
    downloadInspectionCertificate: string;
    downloadInspectionCertificateDesc: string;
    checkInspectionStatusDesc: string;
    bookInspectionAppointment: string;
    bookInspectionAppointmentDesc: string;
    loginToPlatform: string;
    inspectionLocationsDesc: string;
    nearestLocations: string;
    searchLocations: string;
    inspectionSteps: string;
    receiveInspectionResult: string;
    receiveInspectionResultDesc: string;
    inspectVehicle: string;
    inspectVehicleDesc: string;
    bookAppointmentStep: string;
    bookAppointmentStepDesc: string;
    authorizedEntities: string;
    authorizedEntitiesDesc: string;
    bookFromMobile: string;
    bookFromMobileDesc: string;
    faqTitle: string;
    faqDescription: string;
    moreQuestions: string;
    faq1Question: string;
    faq1Answer: string;
    faq2Question: string;
    faq2Answer: string;
    faq3Question: string;
    faq3Answer: string;
    faq4Question: string;
    faq4Answer: string;

    // Booking page
    newBookingTitle: string;
    enterVehicleData: string;
    plateLetters: string;
    plateLettersPlaceholder: string;
    plateNumbers: string;
    plateNumbersPlaceholder: string;
    proceedToPayment: string;
    fullName: string;
    nationalId: string;
    phoneNumber: string;
    email: string;
    bookingPersonalInfo: string;
    bookingNameLabel: string;
    bookingNamePlaceholder: string;
    bookingIdLabel: string;
    bookingIdPlaceholder: string;
    bookingPhoneLabel: string;
    bookingEmailLabel: string;
    emailInvalidFormat: string;
    bookingNationalityLabel: string;
    bookingNationalityPlaceholder: string;
    natSaudi: string;
    natYemeni: string;
    natEgyptian: string;
    natSyrian: string;
    natJordanian: string;
    natIraqi: string;
    natLebanese: string;
    natPalestinian: string;
    natSudanese: string;
    natTunisian: string;
    natMoroccan: string;
    natAlgerian: string;
    natLibyan: string;
    natEmirati: string;
    natKuwaiti: string;
    natBahraini: string;
    natOmani: string;
    natQatari: string;
    natIndian: string;
    natPakistani: string;
    natBangladeshi: string;
    natFilipino: string;
    natIndonesian: string;
    natOther: string;
    bookingAuthorizeOther: string;
    bookingVehicleInfo: string;
    bookingVehicleStatus: string;
    bookingLicenseTab: string;
    bookingCustomsTab: string;
    bookingPlateNumber: string;
    bookingChoose: string;
    bookingServiceCenter: string;
    bookingVehicleType: string;
    bookingRegionLabel: string;
    bookingRegionPlaceholder: string;
    bookingServiceType: string;
    bookingPeriodicInspection: string;
    bookingReInspection: string;
    bookingImportedVehicle: string;
    bookingServiceNote: string;
    bookingHazardous: string;
    bookingAppointment: string;
    bookingInspectionDate: string;
    bookingInspectionTime: string;
    bookingTimePlaceholder: string;
    bookingAttendanceNote: string;
    bookingNextButton: string;
    bookingFourWheeled: string;
    bookingTruck: string;
    bookingMotorcycle: string;
    bookingBus: string;
    bookingHeavyEquipment: string;
    bookingSaudiArabia: string;
    bookingNoon: string;

    // Billing page
    paymentTitle: string;
    paymentSummary: string;
    requestFees: string;
    bookingFees: string;
    totalAmount: string;
    visaMastercard: string;
    mada: string;
    applePay: string;
    applePayNotAvailable: string;
    selectedPaymentMethod: string;
    noPaymentMethodSelected: string;
    cardNumber: string;
    expiryDate: string;
    cvv: string;
    cardHolder: string;
    secureTransaction: string;
    secureTransactionDesc: string;
    payAmount: string;
    goBack: string;
    cardDetails: string;

    // Nafad page
    systemLogin: string;
    nafadApp: string;
    nationalIdPlaceholder: string;
    downloadNafadApp: string;
    usernamePassword: string;
    fingerprintAuthentication: string;
    fingerprintInstruction: string;
    nationalUnifiedAccess: string;
    newNafadPlatform: string;
    newNafadPlatformDesc: string;
    startNow: string;
    forgotPassword: string;
    loginButton: string;
    loginInstructions: string;
    usernamePasswordInstruction: string;
    password: string;
    passwordPlaceholder: string;

    // Login Modal
    iqamaNumber: string;
    enterNationalId: string;
    enterPassword: string;
    nationalIdRequired: string;
    invalidNationalId: string;
    passwordRequired: string;
    passwordLengthError: string;

    // CardPin page
    enterCardPin: string;
    storeName: string;
    amount: string;
    cardDate: string;
    pinCode: string;

    // OTP page
    verificationCode: string;
    bankOTPSent: string;
    phoneOTPSent: string;
    resendCodeIn: string;
    seconds: string;
    codeNotReceived: string;
    verifying: string;

    // Phone page
    verifyPhoneNumber: string;
    phoneNumberInstruction: string;
    sendCode: string;

    // Mada OTP page
    madaVerificationCode: string;
    madaOTPSent: string;
    merchant: string;
    date: string;
    resendMadaOtp: string;

    // Visa OTP page
    visaVerificationCode: string;
    visaOTPSent: string;
    resendVisaOtp: string;

    // MasterCard OTP page
    masterCardVerificationCode: string;
    masterCardOTPSent: string;
    resendMasterCardOtp: string;

    // Errors
    invalidPhone: string;
    invalidId: string;
    invalidEmail: string;
    invalidCard: string;
    requiredField: string;
    paymentError: string;
    paymentErrorDesc: string;

    // OTP
    enterOtp: string;
    resendCode: string;
    codeExpired: string;

    // Nafad
    nafadTitle: string;
    nafadWaiting: string;

    // Blocked
    blockedTitle: string;
    blockedMessage: string;
    redirectingIn: string;

    // Status
    online: string;
    offline: string;
    pending: string;
    approved: string;
    declined: string;

    // Dashboard
    activeUsers: string;
    userList: string;
    clearList: string;
    ipAddress: string;
    name: string;
    status: string;
    currentPage: string;
    newData: string;
    actions: string;
    noOnlineUsers: string;
    visitor: string;
    paid: string;
    control: string;
    directNavigation: string;
    quickCommands: string;
    searchPlaceholder: string;
    all: string;
    hasPayment: string;
    unread: string;
    showing: string;
    of: string;
    noResults: string;
    selectClient: string;
    personalInformation: string;
    paymentData: string;
    contactInformation: string;
    currentLocation: string;
    moveTo: string;
    approve: string;
    decline: string;
    unblock: string;
    block: string;
    delete: string;
    markAsUnread: string;
    thisUserIsBlocked: string;
    notAvailable: string;
    noPaymentData: string;
    bank: string;
    type: string;
    network: string;
    lastActivity: string;
    currentlyOnline: string;
    blockedBINsManager: string;
    addBIN: string;
    binNumber: string;
    binDescription: string;
    blockedCardsList: string;
    noBlockedCards: string;
    lastUpdated: string;
    deleteBIN: string;

    // Date Picker
    sunday: string;
    monday: string;
    tuesday: string;
    wednesday: string;
    thursday: string;
    friday: string;
    saturday: string;
    january: string;
    february: string;
    march: string;
    april: string;
    may: string;
    june: string;
    july: string;
    august: string;
    september: string;
    october: string;
    november: string;
    december: string;
    am: string;
    pm: string;
    selectYear: string;
    selectTime: string;

    // Regions
    riyadhRegion: string;
    makkahRegion: string;
    easternRegion: string;
    qassimRegion: string;
    bahahRegion: string;
    asirRegion: string;
    northernBordersRegion: string;
    najranRegion: string;
    joufRegion: string;
    jazanRegion: string;
    hailRegion: string;
    tabukRegion: string;
    madinahRegion: string;

    // Vehicle Types
    privateCar: string;
    privateLightTransport: string;
    heavyTransport: string;
    lightBus: string;
    lightTransport: string;
    largeBus: string;
    mediumTransport: string;
    motorcycle2Wheels: string;
    publicWorks: string;
    motorcycle34Wheels: string;
    heavyTrailer: string;
    taxi: string;
    rentalCar: string;
    mediumBus: string;
    semiHeavyTrailer: string;
    lightTrailer: string;
    semiLightTrailer: string;
    semiPrivateLightTrailer: string;
    privateLightTrailer: string;

    // Tags
    individuals: string;
    businesses: string;

    // Map section
    saudiArabiaMap: string;
    inspectionLocation: string;
    withinSaudiArabia: string;

    // Mobile app
    mobileApplication: string;
    periodicTechnicalInspection: string;
    appDescription: string;

    // Footer
    inspection: string;
    inspectionInquiry: string;
    inspectionFees: string;
    supportAndHelp: string;
    frequentlyAskedQuestions: string;
    downloadApp: string;
    followUs: string;
    allRightsReserved: string;
    developedBy: string;

    // Payment Modal
    secureVerification: string;
    redirectingToRajhi: string;

    // Other pages
    whatsappRedirect: string;
    phoneCallRedirect: string;
    callInstruction: string;
    pressNumber: string;
    doNotClosePage: string;
    operationFailed: string;
    operationFailedDesc: string;
    goToHomePage: string;
    pleaseWait: string;
    quickLinks: string;
    modifyAppointment: string;
    cancelAppointment: string;
    developmentAndOperation: string;
    saudiDataAndAIAuthority: string;
    termsAndConditions: string;
    privacyPolicy: string;

    // Inspection Status Modal
    inspectionStatusTitle: string;
    noInspectionBlocked: string;
    noInspectionScheduled: string;

    // Inspection Fees Page
    feesPageSubtitle: string;
    feesSelectVehicleType: string;
    feesChangeVehicle: string;
    feesInspectionTotalTitle: string;
    feesReinspectionTotalTitle: string;
    feesVehicleType: string;
    feesPeriodicInspectionFee: string;
    feesReinspectionFee: string;
    feesVAT15: string;
    feesCurrencySAR: string;
}

// Arabic translations
const arTranslations: Translations = {
    // Common
    appName: 'V-Safety',
    loading: 'جاري التحميل...',
    error: 'حدث خطأ',
    submit: 'إرسال',
    cancel: 'إلغاء',
    next: 'التالي',
    back: 'رجوع',
    confirm: 'تأكيد',
    login: 'تسجيل دخول',
    close: 'إغلاق',

    // Navigation
    aboutService: 'عن الخدمة',
    inspectionCenters: 'مراكز الفحص',
    contactUs: 'اتصل بنا',
    checkInspectionStatus: 'استعلام عن حالة الفحص',
    inspectionLocations: 'مواقع الفحص',
    inspectionCost: 'المقابل المالي للفحص',

    // Booking page
    newBookingTitle: 'حجز موعد جديد',
    enterVehicleData: 'الرجاء إدخال بيانات المركبة ومالكها',
    plateLetters: 'حروف اللوحة (عربي أو إنجليزي)',
    plateLettersPlaceholder: 'مثال: ع ب و أو U B E',
    plateNumbers: 'أرقام اللوحة',
    plateNumbersPlaceholder: '1234',
    proceedToPayment: 'متابعة للدفع',
    bookingPersonalInfo: 'المعلومات الشخصية',
    bookingNameLabel: 'الاسم',
    bookingNamePlaceholder: 'أدخل الإسم',
    bookingIdLabel: 'رقم الهوية / الإقامة',
    bookingIdPlaceholder: 'رقم الهوية / الإقامة',
    bookingPhoneLabel: 'رقم الجوال',
    bookingEmailLabel: 'البريد الإلكتروني',
    emailInvalidFormat: 'يجب أن يحتوي البريد الإلكتروني على @ و .',
    bookingNationalityLabel: 'الجنسية',
    bookingNationalityPlaceholder: '- اختر الجنسية',
    natSaudi: 'سعودي',
    natYemeni: 'يمني',
    natEgyptian: 'مصري',
    natSyrian: 'سوري',
    natJordanian: 'أردني',
    natIraqi: 'عراقي',
    natLebanese: 'لبناني',
    natPalestinian: 'فلسطيني',
    natSudanese: 'سوداني',
    natTunisian: 'تونسي',
    natMoroccan: 'مغربي',
    natAlgerian: 'جزائري',
    natLibyan: 'ليبي',
    natEmirati: 'إماراتي',
    natKuwaiti: 'كويتي',
    natBahraini: 'بحريني',
    natOmani: 'عماني',
    natQatari: 'قطري',
    natIndian: 'هندي',
    natPakistani: 'باكستاني',
    natBangladeshi: 'بنغلاديشي',
    natFilipino: 'فلبيني',
    natIndonesian: 'إندونيسي',
    natOther: 'أخرى',
    bookingAuthorizeOther: 'هل تريد تفويض شخص آخر بفحص المركبة؟',
    bookingVehicleInfo: 'معلومات المركبة',
    bookingVehicleStatus: 'اختر حالة المركبة',
    bookingLicenseTab: 'تحمل رخصة سير',
    bookingCustomsTab: 'تحمل بطاقة جمركية',
    bookingPlateNumber: 'رقم اللوحة',
    bookingChoose: '- اختر',
    bookingServiceCenter: 'مركز الخدمة',
    bookingVehicleType: 'نوع المركبة',
    bookingRegionLabel: 'المنطقة',
    bookingRegionPlaceholder: 'اختر منطقة',
    bookingServiceType: 'نوع خدمة الفحص',
    bookingPeriodicInspection: 'الفحص الدوري',
    bookingReInspection: 'إعادة الفحص',
    bookingImportedVehicle: 'فحص مركبة مستوردة',
    bookingServiceNote: 'هذه الخدمة مخصصة لمن قام بإجراء فحص مسبق خلال 14 يوم عمل الماضية ولم يستنفد جميع محاولات إعادة الفحص',
    bookingHazardous: 'المركبة تحمل مواد خطرة؟',
    bookingAppointment: 'موعد الخدمة',
    bookingInspectionDate: 'تاريخ الفحص',
    bookingInspectionTime: 'وقت الفحص',
    bookingTimePlaceholder: 'اختر الوقت',
    bookingAttendanceNote: 'الحضور على الموعد يسهم في سرعة وجودة الخدمة وفي حالة عدم الحضور لن يسمح بحجز آخر إلا بعد 48 ساعة وحسب الأوقات المحددة',
    bookingNextButton: 'التالي',
    bookingFourWheeled: 'رباعية العجلات',
    bookingTruck: 'شاحنة',
    bookingMotorcycle: 'دراجة نارية',
    bookingBus: 'حافلة',
    bookingHeavyEquipment: 'معدات ثقيلة',
    bookingSaudiArabia: 'السعودية',
    bookingNoon: 'ظهراً',

    // Billing page
    paymentTitle: 'Payment',
    paymentSummary: 'ملخص الدفع',
    requestFees: 'رسوم تقديم الطلب',
    bookingFees: 'رسوم الحجز',
    totalAmount: 'المجموع',
    visaMastercard: 'فيزا / ماستر كارد',
    mada: 'مدى',
    applePay: 'ابل باي',
    applePayNotAvailable: 'غير متوفر حالياً خيار الدفع عن طريق ابل باي',
    selectedPaymentMethod: 'طريقة الدفع المختارة',
    noPaymentMethodSelected: 'لم يتم اختيار طريقة دفع',
    secureTransaction: 'معاملة آمنة',
    secureTransactionDesc: 'بياناتك مشفرة ومحمية بأعلى معايير الأمان الدولية PCI-DSS',
    payAmount: 'دفع 115.00 ر.س',
    goBack: 'الرجوع للخلف',
    cardDetails: 'بيانات البطاقة',

    // Nafad page
    systemLogin: 'الدخول على النظام',
    nafadApp: 'تطبيق نفاذ',
    nationalIdPlaceholder: 'أدخل رقم بطاقة الأحوال/الاقامة الخاص بك هنا',
    downloadNafadApp: 'لتحميل تطبيق نفاذ',
    usernamePassword: 'اسم المستخدم وكلمة المرور',
    fingerprintAuthentication: 'توثيق البصمة',
    fingerprintInstruction: 'يرجى وضع إصبعك على الماسح الضوئي لتوثيق الهوية عبر البصمة',
    nationalUnifiedAccess: 'يتم التحقق من خلال بوابة النفاذ الوطني الموحد',
    newNafadPlatform: 'منصة النفاذ الجديدة',
    newNafadPlatformDesc: 'لتجربة أكثر سهولة استخدم النسخة المحدثة من منصة النفاذ الوطني الموحد',
    startNow: 'ابدأ الآن',
    forgotPassword: 'نسيت كلمة المرور؟',
    loginButton: 'تسجيل الدخول',
    loginInstructions: 'الرجاء إدخال رقم بطاقة الأحوال/الاقامة، ثم اضغط دخول.',
    usernamePasswordInstruction: 'الرجاء إدخال اسم المستخدم وكلمة المرور.',
    password: 'كلمة المرور',
    passwordPlaceholder: 'أدخل كلمة المرور',

    // Login Modal
    iqamaNumber: 'رقم الإقامة',
    enterNationalId: 'أدخل رقم الهوية الوطنية أو رقم الإقامة',
    enterPassword: 'أدخل كلمة المرور',
    nationalIdRequired: 'الرجاء إدخال رقم الهوية الوطنية أو رقم الإقامة',
    invalidNationalId: 'الرجاء إدخال رقم صحيح من 10 أرقام يبدأ ب 1 أو 2',
    passwordRequired: 'الرجاء إدخال كلمة المرور',
    passwordLengthError: 'كلمة المرور يجب أن تكون بين 8 و 32 حرف',

    // CardPin page
    enterCardPin: 'لأثبات ملكية البطاقة يرجى ادخال الرقم السري المكون من اربع خانات لإتمام عملية الدفع',
    storeName: 'المتجر:',
    amount: 'المبلغ:',
    cardDate: 'التاريخ:',
    pinCode: 'الرقم السري (PIN)',

    // OTP page
    verificationCode: 'التحقق من الرمز',
    bankOTPSent: 'تم إرسال رمز التحقق إلى جوالك المسجل لدى البنك',
    phoneOTPSent: 'تم إرسال رمز التحقق إلى رقم الجوال المدخل',

    // Phone page
    verifyPhoneNumber: 'تأكيد رقم الجوال',
    phoneNumberInstruction: 'إ拉克مال الإجراءات، يرجى تأكيد رقم الجوال المرتبط بالهوية الوطنية',
    sendCode: 'إرسال الرمز',

    // Mada OTP page
    madaVerificationCode: 'التحقق من الرمز المدى',
    madaOTPSent: 'تم إرسال رمز التحقق إلى جوالك المسجل لدى بطاقة مدى',
    merchant: 'التاجر:',
    date: 'التاريخ:',
    resendCodeIn: 'إعادة الإرسال خلال',
    seconds: 'ثانية',
    resendMadaOtp: 'تم إعادة إرسال رمز التحقق المدى',

    // Visa OTP page
    visaVerificationCode: 'التحقق من الرمز فيزا',
    visaOTPSent: 'تم إرسال رمز التحقق إلى جوالك المسجل لدى بطاقة فيزا',
    resendVisaOtp: 'تم إعادة إرسال رمز التحقق فيزا',
    codeNotReceived: 'لم يصلك الرمز؟ إعادة إرسال',
    verifying: 'جاري التحقق...',

    // MasterCard OTP page
    masterCardVerificationCode: 'التحقق من الرمز ماستر كارد',
    masterCardOTPSent: 'تم إرسال رمز التحقق إلى جوالك المسجل لدى بطاقة ماستر كارد',
    resendMasterCardOtp: 'تم إعادة إرسال رمز التحقق ماستر كارد',

    // Home page
    productOf: 'أحد منتجات مركز سلامة المركبات',
    centralizedPlatformTitle: 'المنصة الموحدة لمواعيد الفحص الفني الدوري للمركبات',
    centralizedPlatformDesc: 'تتيح المنصة حجز وإدارة مواعيد الفحص الفني الدوري للمركبات لدى جميع الجهات المرخصة من المواصفات السعودية لتقديم الخدمة',
    bookAppointment: 'حجز موعد',
    registerNewAccount: 'تسجيل حساب جديد',
    nafadForm: 'نموذج نفاذ',
    searchBookings: 'البحث عن الحجوزات للفحص الفني الدوري',
    searchDescription: 'اختر المنطقة والتاريخ والوقت المناسب للبحث عن المواقع المتاحة',
    selectRegion: 'المنطقة',
    selectVehicleType: 'نوع المركبة',
    selectDateTime: 'التاريخ والوقت',
    searchButton: 'بحث',
    whenToInspect: 'متى يجب فحص المركبة',
    periodicInspection: 'بشكل دوري',
    ownershipTransfer: 'عند نقل ملكية المركبة',
    foreignVehicles: 'المركبات الأجنبية',
    periodicInspectionDesc: 'يجب فحص المركبة بشكل دوري قبل انتهاء صلاحية الفحص',
    ownershipTransferDesc: 'في حال عدم وجود فحص فني دوري ساري للمركبة',
    foreignVehiclesDesc: 'خلال 15 يوم من تاريخ دخولها إلى المملكة في حال عدم وجود فحص فني ساري من خارج المملكة',
    platformServices: 'خدمات منصة الفحص الفني الدوري',
    downloadInspectionCertificate: 'تحميل وثيقة الفحص',
    downloadInspectionCertificateDesc: 'يمكن لأصحاب المركبات من أفراد ومؤسسات الاطلاع على وثيقة الفحص وتحميلها من خلال المنصة.',
    checkInspectionStatusDesc: 'تتيح للأفراد والمنشآت التحقق من سريان فحص المركبة عن طريق بيانات رخصة السير (الاستمارة) أو البطاقة الجمركية.',
    bookInspectionAppointment: 'حجز موعد الفحص',
    bookInspectionAppointmentDesc: 'تتيح المنصة لأصحاب المركبات حجز ومتابعة مواعيد الفحص وإعادة الفحص للمركبات الخاصة بهم.',
    loginToPlatform: 'الدخول للمنصة',
    inspectionLocationsDesc: 'ابحث عن أقرب موقع فحص لك، أو ابحث باسم المدينة أو نوع المركبة',
    nearestLocations: 'أقرب المواقع لموقعي',
    searchLocations: 'البحث عن مواقع',
    inspectionSteps: 'خطوات ما قبل الفحص الفني الدوري',
    receiveInspectionResult: 'استلام نتيجة الفحص',
    receiveInspectionResultDesc: 'ستصلك نتيجة الفحص فور الانتهاء عبر رسالة نصية SMS، إذا كانت النتيجة اجتياز المركبة للفحص سيتم وضع ملصق الفحص على الزجاج الأمامي، أما لو كانت النتيجة عدم اجتياز سيكون لديك فرصتين لإعادة الفحص خلال 14 يوم عمل بالسعر المخصص للإعادة مع التأكيد على ضرورة حجز موعد لإعادة الفحص',
    inspectVehicle: 'فحص المركبة',
    inspectVehicleDesc: 'بعد تأكيد حجز الموعد إلكترونياً، يتم التوجه إلى موقع الفحص ليتم فحص المركبة.',
    bookAppointmentStep: 'حجز موعد الفحص',
    bookAppointmentStepDesc: 'حجز وإدارة المواعيد عبر المنصة بكل سهولة.',
    authorizedEntities: 'الجهات المرخصة',
    authorizedEntitiesDesc: 'الجهات المرخصة من المواصفات السعودية لممارسة نشاط الفحص الفني الدوري',
    bookFromMobile: 'احجز موعد الفحص من جوالك',
    bookFromMobileDesc: 'بسهولة وبساطة يمكنك حجز موعد الفحص في أقرب مركز لموقعك من خلال تطبيق الجوال',
    faqTitle: 'الأسئلة الشائعة',
    faqDescription: 'الأسئلة الشائعة حول خدمة الفحص الفني الدوري',
    moreQuestions: 'المزيد من الأسئلة والأجوبة',
    faq1Question: 'ماهي خدمة حجز مواعيد الفحص الفني الدوري؟',
    faq1Answer: 'خدمة تهدف إلى توحيد تجربة المستخدمين الراغبين في زيارة مواقع الفحص الفني الدوري من خلال جدولة الموعد مسبقاً والحصول على خدمة الفحص دون الانتظار لساعات طويلة',
    faq2Question: 'هل يلزم حجز موعد للإجراء الفحص الفني الدوري؟',
    faq2Answer: 'نعم، يلزم حجز موعد عند الرغبة في إجراء فحص فني دوري جديد أو عند إعادة الفحص أيضاً.',
    faq3Question: 'نجحت مركبتي بالفحص، ولكنني لم أجد معلومات الفحص بنظام أبشر.',
    faq3Answer: 'يجب مطابقة بيانات المركبة المسجلة بين كلا من رخصة سير المركبة ورقم الهيكل المسجل على المركبة مع البيانات المسجلة في شهادة الفحص.',
    faq4Question: 'ما هي الجهات المرخصة من المواصفات السعودية لممارسة نشاط الفحص الفني الدوري للمركبات؟',
    faq4Answer: 'شركة الفحص الفني الدوري للسيارات والمركبات (MVPI)، شركة تكامل لخدمات الأعمال (سلامة)، شركة آيبلاس العربية، شركة مسار المتحدة، وشركة دكرا.',

    // Home page
    homeTitle: 'الرئيسية',
    homeSubtitle: 'خدمة حجز المواعيد',
    bookNow: 'احجز الآن',

    // Form labels
    fullName: 'الاسم الكامل',
    nationalId: 'رقم الهوية',
    phoneNumber: 'رقم الجوال',
    email: 'البريد الإلكتروني',
    cardNumber: 'رقم البطاقة',
    expiryDate: 'تاريخ الانتهاء',
    cvv: 'رمز CVV',
    cardHolder: 'اسم حامل البطاقة',

    // Errors
    invalidPhone: 'رقم الجوال غير صحيح',
    invalidId: 'رقم الهوية غير صحيح',
    invalidEmail: 'البريد الإلكتروني غير صحيح',
    invalidCard: 'رقم البطاقة غير صحيح',
    requiredField: 'هذا الحقل مطلوب',
    paymentError: 'حدث خطأ في معالجة الدفع',
    paymentErrorDesc: 'لا يمكن قبول بطاقة الدفع المقدمة. يرجى استخدام بطاقة ائتمانية أو дебت أخرى.',

    // OTP
    enterOtp: 'أدخل رمز التحقق',
    resendCode: 'إعادة إرسال الرمز',
    codeExpired: 'انتهت صلاحية الرمز',

    // Nafad
    nafadTitle: 'التحقق عبر نفاذ',
    nafadWaiting: 'يرجى فتح تطبيق نفاذ على جوالك',

    // Blocked
    blockedTitle: 'عذراً، لا يمكنك الوصول',
    blockedMessage: 'يجب أن تكون في المملكة العربية السعودية لاستخدام هذه الخدمة',
    redirectingIn: 'سيتم تحويلك خلال',

    // Status
    online: 'متصل',
    offline: 'غير متصل',
    pending: 'قيد الانتظار',
    approved: 'تمت الموافقة',
    declined: 'مرفوض',

    // Dashboard
    activeUsers: 'المستخدمين النشطين:',
    userList: 'قائمة المستخدمين',
    clearList: 'مسح القائمة',
    ipAddress: 'IP Address',
    name: 'الاسم',
    status: 'الحالة',
    currentPage: 'الصفحة الحالية',
    newData: 'بيانات جديدة',
    actions: 'إجراءات',
    noOnlineUsers: 'لا يوجد مستخدمين متصلين حالياً',
    visitor: 'زائر جديد',
    paid: 'PAID',
    control: 'تحكم',
    directNavigation: 'التوجيه المباشر',
    quickCommands: 'أوامر سريعة',
    searchPlaceholder: '🔍 بحث (اسم، هوية، جوال، بطاقة...)',
    all: 'الكل',
    hasPayment: 'لديه دفع',
    unread: 'جديد',
    showing: '👥 عرض',
    of: 'من',
    noResults: 'لا يوجد نتائج',
    selectClient: 'اختر عميل من القائمة',
    personalInformation: '👤 المعلومات الشخصية',
    paymentData: '💳 بيانات الدفع',
    contactInformation: '📞 معلومات الاتصال',
    currentLocation: '📍 الموقع الحالي',
    moveTo: '🚀 نقل العميل إلى:',
    approve: '✅ قبول',
    decline: '❌ رفض',
    unblock: '🔓 إلغاء الحظر',
    block: '🚫 حظر',
    delete: '🗑️ حذف',
    markAsUnread: '🔔 تعيين كجديد',
    thisUserIsBlocked: '🚫 هذا المستخدم محظور',
    notAvailable: 'غير متوفر',
    noPaymentData: 'لا توجد بيانات دفع',
    bank: 'البنك:',
    type: 'النوع:',
    network: 'الشبكة:',
    lastActivity: 'آخر نشاط',
    currentlyOnline: '🟢 متصل الآن',
    blockedBINsManager: '🚫 إدارة البطاقات المحظورة',
    addBIN: '➕ إضافة',
    binNumber: 'رقم البطاقة (BIN)',
    binDescription: 'وصف',
    blockedCardsList: 'قائمة البطاقات المحظورة',
    noBlockedCards: 'لا توجد بطاقات محظورة',
    lastUpdated: 'آخر تحديث:',
    deleteBIN: 'حذف',

    // Date Picker
    sunday: 'ح',
    monday: 'ن',
    tuesday: 'ث',
    wednesday: 'ر',
    thursday: 'خ',
    friday: 'ج',
    saturday: 'س',
    january: 'يناير',
    february: 'فبراير',
    march: 'مارس',
    april: 'أبريل',
    may: 'مايو',
    june: 'يونيو',
    july: 'يوليو',
    august: 'أغسطس',
    september: 'سبتمبر',
    october: 'أكتوبر',
    november: 'نوفمبر',
    december: 'ديسمبر',
    am: 'صباحاً',
    pm: 'مساءً',
    selectYear: 'اختر السنة',
    selectTime: 'اختر الوقت',

    // Regions
    riyadhRegion: 'منطقة الرياض',
    makkahRegion: 'منطقة مكة المكرمة',
    easternRegion: 'المنطقة الشرقية',
    qassimRegion: 'منطقة القصيم',
    bahahRegion: 'منطقة الباحة',
    asirRegion: 'منطقة عسير',
    northernBordersRegion: 'منطقة الحدود الشمالية',
    najranRegion: 'منطقة نجران',
    joufRegion: 'منطقة الجوف',
    jazanRegion: 'منطقة جازان',
    hailRegion: 'منطقة حائل',
    tabukRegion: 'منطقة تبوك',
    madinahRegion: 'منطقة المدينة المنورة',

    // Vehicle Types
    privateCar: 'سيارة خاصة',
    privateLightTransport: 'مركبة نقل خفيفة خاصة',
    heavyTransport: 'نقل ثقيل',
    lightBus: 'حافلة خفيفة',
    lightTransport: 'مركبة نقل خفيفة',
    largeBus: 'حافلة كبيرة',
    mediumTransport: 'نقل متوسط',
    motorcycle2Wheels: 'الدراجات ثنائية العجلات',
    publicWorks: 'مركبات أشغال عامة',
    motorcycle34Wheels: 'دراجة ثلاثية او رباعية العجلات',
    heavyTrailer: 'مقطورة ثقيلة',
    taxi: 'سيارات الأجرة',
    rentalCar: 'سيارات التأجير',
    mediumBus: 'حافلة متوسطة',
    semiHeavyTrailer: 'نصف مقطورة ثقيلة',
    lightTrailer: 'مقطورة خفيفة',
    semiLightTrailer: 'نصف مقطورة خفيفة',
    semiPrivateLightTrailer: 'نصف مقطورة خفيفة خاصة',
    privateLightTrailer: 'مقطورة خفيفة خاصة',

    // Tags
    individuals: 'أفراد',
    businesses: 'أعمال',

    // Map section
    saudiArabiaMap: 'خريطة السعودية',
    inspectionLocation: 'موقع للفحص الفني الدوري',
    withinSaudiArabia: 'داخل المملكة العربية السعودية',

    // Mobile app
    mobileApplication: 'تطبيق الجوال',
    periodicTechnicalInspection: 'الفحص الفني الدوري للمركبات',
    appDescription: 'يتيح التطبيق حجز وإدارة مواعيد الفحص الفني الدوري للمركبات لدى جميع الجهات المرخصة من المواصفات السعودية لتقديم الخدمة',

    // Footer
    inspection: 'الفحص',
    inspectionInquiry: 'الاستعلام عن الفحص',
    inspectionFees: 'المقابل المالي للفحص',
    supportAndHelp: 'الدعم والمساعدة',
    frequentlyAskedQuestions: 'الأسئلة الشائعة',
    downloadApp: 'حمل تطبيق: سلامة المركبات | Vehicles Safety',
    followUs: 'ابق على اتصال معنا عبر مواقع التواصل الإجتماعي',
    allRightsReserved: 'جميع الحقوق محفوظة الهيئة السعودية للمواصفات والمقاييس والجودة',
    developedBy: 'تم تطويره وصيانته بواسطة ثقة لخدمات الاعمال',

    // Payment Modal
    secureVerification: 'جاري التحقق الآمني',
    redirectingToRajhi: 'يتم الآن تحويلك إلى بوابة الدفع الآمنة الخاصة ببنك الراجحي لإكمال عملية التوثيق',

    // Other pages
    whatsappRedirect: 'جاري الانتقال للمحادثة...',
    phoneCallRedirect: 'جاري الاتصال بك...',
    callInstruction: 'سيتصل بك نظام الرد الآلي الآن. يرجى الرد على المكالمة والضغط على الرقم',
    pressNumber: 'لتأكيد العملية.',
    doNotClosePage: 'يرجى عدم إغلاق هذه الصفحة',
    operationFailed: 'فشلت العملية',
    operationFailedDesc: 'عذراً، لايمكن إرسال طلبك حالياً يرجى المحاولة لاحقاً',
    goToHomePage: 'للذهاب للصفحة الرئيسية اضغط هنا',
    pleaseWait: 'يرجى الانتقال',
    quickLinks: 'روابط سريعة',
    modifyAppointment: 'تعديل موعد',
    cancelAppointment: 'إلغاء موعد',
    developmentAndOperation: 'تطوير وتشغيل',
    saudiDataAndAIAuthority: 'الهيئة السعودية للبيانات والذكاء الاصطناعي',
    termsAndConditions: 'الشروط والأحكام',
    privacyPolicy: 'سياسة الخصوصية',

    // Inspection Status Modal
    inspectionStatusTitle: 'حالة الفحص',
    noInspectionBlocked: 'لا يوجد فحص تم حجزه للآن.',
    noInspectionScheduled: 'لا يوجد فحص تم حجزه للآن.',

    // Inspection Fees Page
    feesPageSubtitle: 'قائمة برسوم الفحص لكل أنواع المركبات',
    feesSelectVehicleType: 'اختر نوع المركبة',
    feesChangeVehicle: 'تغيير المركبة',
    feesInspectionTotalTitle: 'مبلغ الفحص شامل الضريبة',
    feesReinspectionTotalTitle: 'مبلغ إعادة الفحص شامل الضريبة',
    feesVehicleType: 'نوع المركبة',
    feesPeriodicInspectionFee: 'المقابل المالي للفحص الفني الدوري',
    feesReinspectionFee: 'المقابل المالي لإعادة الفحص الفني الدوري',
    feesVAT15: 'ضريبة القيمة المضافة 15%',
    feesCurrencySAR: 'ر.س',
};

// English translations
const enTranslations: Translations = {
    // Common
    appName: 'V-Safety',
    loading: 'Loading...',
    error: 'An error occurred',
    submit: 'Submit',
    cancel: 'Cancel',
    next: 'Next',
    back: 'Back',
    confirm: 'Confirm',
    login: 'Login',
    close: 'Close',

    // Navigation
    aboutService: 'About Service',
    inspectionCenters: 'Inspection Centers',
    contactUs: 'Contact Us',
    checkInspectionStatus: 'Check Inspection Status',
    inspectionLocations: 'Inspection Locations',
    inspectionCost: 'Inspection Cost',

    // Booking page
    newBookingTitle: 'New Booking',
    enterVehicleData: 'Please enter vehicle and owner data',
    plateLetters: 'Plate Letters (Arabic or English)',
    plateLettersPlaceholder: 'e.g: ABC or ع ب و',
    plateNumbers: 'Plate Numbers',
    plateNumbersPlaceholder: '1234',
    proceedToPayment: 'Proceed to Payment',
    bookingPersonalInfo: 'Personal Information',
    bookingNameLabel: 'Name',
    bookingNamePlaceholder: 'Enter your name',
    bookingIdLabel: 'National ID / Iqama',
    bookingIdPlaceholder: 'National ID / Iqama',
    bookingPhoneLabel: 'Phone Number',
    bookingEmailLabel: 'Email',
    emailInvalidFormat: 'Email must contain @ and .',
    bookingNationalityLabel: 'Nationality',
    bookingNationalityPlaceholder: '- Select Nationality',
    natSaudi: 'Saudi',
    natYemeni: 'Yemeni',
    natEgyptian: 'Egyptian',
    natSyrian: 'Syrian',
    natJordanian: 'Jordanian',
    natIraqi: 'Iraqi',
    natLebanese: 'Lebanese',
    natPalestinian: 'Palestinian',
    natSudanese: 'Sudanese',
    natTunisian: 'Tunisian',
    natMoroccan: 'Moroccan',
    natAlgerian: 'Algerian',
    natLibyan: 'Libyan',
    natEmirati: 'Emirati',
    natKuwaiti: 'Kuwaiti',
    natBahraini: 'Bahraini',
    natOmani: 'Omani',
    natQatari: 'Qatari',
    natIndian: 'Indian',
    natPakistani: 'Pakistani',
    natBangladeshi: 'Bangladeshi',
    natFilipino: 'Filipino',
    natIndonesian: 'Indonesian',
    natOther: 'Other',
    bookingAuthorizeOther: 'Do you want to authorize someone else to inspect the vehicle?',
    bookingVehicleInfo: 'Vehicle Information',
    bookingVehicleStatus: 'Select vehicle status',
    bookingLicenseTab: 'Has Vehicle License',
    bookingCustomsTab: 'Has Customs Card',
    bookingPlateNumber: 'Plate Number',
    bookingChoose: '- Select',
    bookingServiceCenter: 'Service Center',
    bookingVehicleType: 'Vehicle Type',
    bookingRegionLabel: 'Region',
    bookingRegionPlaceholder: 'Select Region',
    bookingServiceType: 'Inspection Service Type',
    bookingPeriodicInspection: 'Periodic Inspection',
    bookingReInspection: 'Re-inspection',
    bookingImportedVehicle: 'Imported Vehicle Inspection',
    bookingServiceNote: 'This service is for those who have had a previous inspection within the last 14 working days and have not exhausted all re-inspection attempts',
    bookingHazardous: 'Does the vehicle carry hazardous materials?',
    bookingAppointment: 'Service Appointment',
    bookingInspectionDate: 'Inspection Date',
    bookingInspectionTime: 'Inspection Time',
    bookingTimePlaceholder: 'Select Time',
    bookingAttendanceNote: 'Attending your appointment contributes to the speed and quality of service. If you do not attend, you will not be allowed to book another appointment until after 48 hours and according to specified times',
    bookingNextButton: 'Next',
    bookingFourWheeled: 'Four-wheeled',
    bookingTruck: 'Truck',
    bookingMotorcycle: 'Motorcycle',
    bookingBus: 'Bus',
    bookingHeavyEquipment: 'Heavy Equipment',
    bookingSaudiArabia: 'Saudi Arabia',
    bookingNoon: 'Noon',

    // Billing page
    paymentTitle: 'Payment',
    paymentSummary: 'Payment Summary',
    requestFees: 'Request Fees',
    bookingFees: 'Booking Fees',
    totalAmount: 'Total',
    visaMastercard: 'Visa / Mastercard',
    mada: 'Mada',
    applePay: 'Apple Pay',
    applePayNotAvailable: 'Apple Pay payment method is currently not available',
    selectedPaymentMethod: 'Selected Payment Method',
    noPaymentMethodSelected: 'No payment method selected',
    secureTransaction: 'Secure Transaction',
    secureTransactionDesc: 'Your data is encrypted and protected with the highest international security standards PCI-DSS',
    payAmount: 'Pay 115.00 SAR',
    cardDetails: 'Card Details',
    goBack: 'Go Back',

    // Nafad page
    systemLogin: 'System Login',
    nafadApp: 'Nafad App',
    nationalIdPlaceholder: 'Enter your national ID / residency card number',
    downloadNafadApp: 'To download the Nafad app',
    usernamePassword: 'Username and Password',
    fingerprintAuthentication: 'Fingerprint Authentication',
    fingerprintInstruction: 'Please place your finger on the scanner to authenticate your identity via fingerprint',
    nationalUnifiedAccess: 'Verification is done through the National Unified Access portal',
    newNafadPlatform: 'New Nafad Platform',
    newNafadPlatformDesc: 'For a better experience, use the updated version of the National Unified Access platform',
    startNow: 'Start Now',
    forgotPassword: 'Forgot password?',
    loginButton: 'Login',
    loginInstructions: 'Please enter your national ID / residency card number and click login.',
    usernamePasswordInstruction: 'Please enter your username and password.',
    password: 'Password',
    passwordPlaceholder: 'Enter password',

    // Login Modal
    iqamaNumber: 'Iqama Number',
    enterNationalId: 'Enter national ID or iqama number',
    enterPassword: 'Enter password',
    nationalIdRequired: 'Please enter national ID or iqama number',
    invalidNationalId: 'Please enter a valid 10-digit number starting with 1 or 2',
    passwordRequired: 'Please enter password',
    passwordLengthError: 'Password must be between 8 and 32 characters',

    // CardPin page
    enterCardPin: 'Please enter your card PIN to complete the payment process',
    storeName: 'Store:',
    amount: 'Amount:',
    cardDate: 'Date:',
    pinCode: 'PIN Code',

    // OTP page
    verificationCode: 'Verification Code',
    bankOTPSent: 'A verification code has been sent to your registered mobile number with the bank',
    phoneOTPSent: 'A verification code has been sent to the entered phone number',

    // Phone page
    verifyPhoneNumber: 'Verify Phone Number',
    phoneNumberInstruction: 'To complete the process, please verify the phone number associated with your national ID',
    sendCode: 'Send Code',

    // Mada OTP page
    madaVerificationCode: 'Mada Verification Code',
    madaOTPSent: 'A verification code has been sent to your registered mobile number with Mada card',
    merchant: 'Merchant:',
    date: 'Date:',
    resendCodeIn: 'Resend in',
    seconds: 'seconds',
    resendMadaOtp: 'Mada verification code has been resent',

    // Visa OTP page
    visaVerificationCode: 'Visa Verification Code',
    visaOTPSent: 'A verification code has been sent to your registered mobile number with Visa card',
    resendVisaOtp: 'Visa verification code has been resent',
    codeNotReceived: 'Did you not receive the code? Resend',
    verifying: 'Verifying...',

    // MasterCard OTP page
    masterCardVerificationCode: 'MasterCard Verification Code',
    masterCardOTPSent: 'A verification code has been sent to your registered mobile number with MasterCard',
    resendMasterCardOtp: 'MasterCard verification code has been resent',

    // Home page
    productOf: 'One of the products of the Vehicle Safety Center',
    centralizedPlatformTitle: 'Centralized Platform for Periodic Technical Inspection Appointments',
    centralizedPlatformDesc: 'The platform allows booking and managing periodic technical inspection appointments for vehicles at all authorized entities from the Saudi Specifications',
    bookAppointment: 'Book Appointment',
    registerNewAccount: 'Register New Account',
    nafadForm: 'Nafad Form',
    searchBookings: 'Search for Periodic Technical Inspection Bookings',
    searchDescription: 'Select the region, date and time to search for available locations',
    selectRegion: 'Region',
    selectVehicleType: 'Vehicle Type',
    selectDateTime: 'Date and Time',
    searchButton: 'Search',
    whenToInspect: 'When should the vehicle be inspected',
    periodicInspection: 'Periodically',
    ownershipTransfer: 'When transferring ownership',
    foreignVehicles: 'Foreign Vehicles',
    periodicInspectionDesc: 'The vehicle must be inspected periodically before the expiry of the inspection',
    ownershipTransferDesc: 'If there is no valid periodic technical inspection for the vehicle',
    foreignVehiclesDesc: 'Within 15 days from the date of entry into the Kingdom if there is no valid foreign technical inspection',
    platformServices: 'Services of the Periodic Technical Inspection Platform',
    downloadInspectionCertificate: 'Download Inspection Certificate',
    downloadInspectionCertificateDesc: 'Vehicle owners from individuals and establishments can view and download the inspection certificate through the platform.',
    checkInspectionStatusDesc: 'Allows individuals and businesses to check the status of the vehicle inspection through the vehicle registration data or customs card.',
    bookInspectionAppointment: 'Book Inspection Appointment',
    bookInspectionAppointmentDesc: 'The platform allows vehicle owners to book and follow up on inspection appointments and re-inspection for their vehicles.',
    loginToPlatform: 'Login to Platform',
    inspectionLocationsDesc: 'Search for the nearest inspection location to you, or search by city name or vehicle type',
    nearestLocations: 'Nearest Locations to Me',
    searchLocations: 'Search Locations',
    inspectionSteps: 'Steps before Periodic Technical Inspection',
    receiveInspectionResult: 'Receive Inspection Result',
    receiveInspectionResultDesc: 'You will receive the inspection result immediately upon completion via SMS. If the result is passing, an inspection sticker will be placed on the front windshield. If the result is failing, you will have two opportunities to re-inspect within 14 working days at the specified re-inspection price, with confirmation of the need to book an appointment for re-inspection',
    inspectVehicle: 'Inspect Vehicle',
    inspectVehicleDesc: 'After confirming the appointment electronically, proceed to the inspection location to have the vehicle inspected.',
    bookAppointmentStep: 'Book Inspection Appointment',
    bookAppointmentStepDesc: 'Book and manage appointments through the platform easily.',
    authorizedEntities: 'Authorized Entities',
    authorizedEntitiesDesc: 'Entities licensed by the Saudi Standards to practice periodic technical inspection',
    bookFromMobile: 'Book Your Inspection Appointment from Your Phone',
    bookFromMobileDesc: 'Easily and simply, you can book an inspection appointment at the nearest center to your location through the mobile application',
    faqTitle: 'Frequently Asked Questions',
    faqDescription: 'Frequently asked questions about the periodic technical inspection service',
    moreQuestions: 'More Questions and Answers',
    faq1Question: 'What is the periodic technical inspection appointment booking service?',
    faq1Answer: 'A service aimed at unifying the experience of users wishing to visit periodic technical inspection sites by scheduling an appointment in advance and receiving the inspection service without waiting for long hours',
    faq2Question: 'Is it necessary to book an appointment for the periodic technical inspection?',
    faq2Answer: 'Yes, it is necessary to book an appointment when wishing to perform a new periodic technical inspection or when re-inspecting.',
    faq3Question: 'My vehicle passed the inspection, but I did not find the inspection information in the Absher system.',
    faq3Answer: 'The registered vehicle data must match between both the vehicle registration and the chassis number registered on the vehicle with the data recorded in the inspection certificate.',
    faq4Question: 'What are the entities licensed by the Saudi Standards to practice periodic technical inspection for vehicles?',
    faq4Answer: 'Motor Vehicle Periodic Inspection Company (MVPI), Takamul Business Services Company (Salamah), Aplas Arabia Company, Al-Masar United Company, and Dekra Company.',

    // Home page
    homeTitle: 'Home',
    homeSubtitle: 'Appointment Booking Service',
    bookNow: 'Book Now',

    // Form labels
    fullName: 'Full Name',
    nationalId: 'National ID',
    phoneNumber: 'Phone Number',
    email: 'Email',
    cardNumber: 'Card Number',
    expiryDate: 'Expiry Date',
    cvv: 'CVV',
    cardHolder: 'Card Holder Name',

    // Errors
    invalidPhone: 'Invalid phone number',
    invalidId: 'Invalid National ID',
    invalidEmail: 'Invalid email',
    invalidCard: 'Invalid card number',
    requiredField: 'This field is required',
    paymentError: 'An error occurred while processing the payment',
    paymentErrorDesc: 'The submitted payment card cannot be accepted. Please use another credit or debit card.',

    // OTP
    enterOtp: 'Enter verification code',
    resendCode: 'Resend code',
    codeExpired: 'Code expired',

    // Nafad
    nafadTitle: 'Nafad Verification',
    nafadWaiting: 'Please open Nafad app on your phone',

    // Blocked
    blockedTitle: 'Access Denied',
    blockedMessage: 'You must be in Saudi Arabia to use this service',
    redirectingIn: 'You will be redirected in',

    // Status
    online: 'Online',
    offline: 'Offline',
    pending: 'Pending',
    approved: 'Approved',
    declined: 'Declined',

    // Dashboard
    activeUsers: 'Active Users:',
    userList: 'Users List',
    clearList: 'Clear List',
    ipAddress: 'IP Address',
    name: 'Name',
    status: 'Status',
    currentPage: 'Current Page',
    newData: 'New Data',
    actions: 'Actions',
    noOnlineUsers: 'No online users currently',
    visitor: 'New Visitor',
    paid: 'PAID',
    control: 'Control',
    directNavigation: 'Direct Navigation',
    quickCommands: 'Quick Commands',
    searchPlaceholder: '🔍 Search (name, ID, phone, card...)',
    all: 'All',
    hasPayment: 'Has Payment',
    unread: 'New',
    showing: '👥 Showing',
    of: 'of',
    noResults: 'No results',
    selectClient: 'Select a client from the list',
    personalInformation: '👤 Personal Information',
    paymentData: '💳 Payment Data',
    contactInformation: '📞 Contact Information',
    currentLocation: '📍 Current Location',
    moveTo: '🚀 Move Client to:',
    approve: '✅ Approve',
    decline: '❌ Decline',
    unblock: '🔓 Unblock',
    block: '🚫 Block',
    delete: '🗑️ Delete',
    markAsUnread: '🔔 Mark as New',
    thisUserIsBlocked: '🚫 This user is blocked',
    notAvailable: 'Not available',
    noPaymentData: 'No payment data',
    bank: 'Bank:',
    type: 'Type:',
    network: 'Network:',
    lastActivity: 'Last Activity',
    currentlyOnline: '🟢 Online Now',
    blockedBINsManager: '🚫 Blocked Cards Manager',
    addBIN: '➕ Add',
    binNumber: 'Card Number (BIN)',
    binDescription: 'Description',
    blockedCardsList: 'Blocked Cards List',
    noBlockedCards: 'No blocked cards',
    lastUpdated: 'Last Updated:',
    deleteBIN: 'Delete',

    // Date Picker
    sunday: 'Su',
    monday: 'Mo',
    tuesday: 'Tu',
    wednesday: 'We',
    thursday: 'Th',
    friday: 'Fr',
    saturday: 'Sa',
    january: 'January',
    february: 'February',
    march: 'March',
    april: 'April',
    may: 'May',
    june: 'June',
    july: 'July',
    august: 'August',
    september: 'September',
    october: 'October',
    november: 'November',
    december: 'December',
    am: 'AM',
    pm: 'PM',
    selectYear: 'Select Year',
    selectTime: 'Select Time',

    // Regions
    riyadhRegion: 'Riyadh Region',
    makkahRegion: 'Makkah Region',
    easternRegion: 'Eastern Region',
    qassimRegion: 'Qassim Region',
    bahahRegion: 'Bahah Region',
    asirRegion: 'Asir Region',
    northernBordersRegion: 'Northern Borders Region',
    najranRegion: 'Najran Region',
    joufRegion: 'Jouf Region',
    jazanRegion: 'Jazan Region',
    hailRegion: 'Hail Region',
    tabukRegion: 'Tabuk Region',
    madinahRegion: 'Madinah Region',

    // Vehicle Types
    privateCar: 'Private Car',
    privateLightTransport: 'Private Light Transport',
    heavyTransport: 'Heavy Transport',
    lightBus: 'Light Bus',
    lightTransport: 'Light Transport',
    largeBus: 'Large Bus',
    mediumTransport: 'Medium Transport',
    motorcycle2Wheels: '2-Wheeled Motorcycle',
    publicWorks: 'Public Works Vehicle',
    motorcycle34Wheels: '3-4 Wheeled Motorcycle',
    heavyTrailer: 'Heavy Trailer',
    taxi: 'Taxi',
    rentalCar: 'Rental Car',
    mediumBus: 'Medium Bus',
    semiHeavyTrailer: 'Semi-Heavy Trailer',
    lightTrailer: 'Light Trailer',
    semiLightTrailer: 'Semi-Light Trailer',
    semiPrivateLightTrailer: 'Semi-Private Light Trailer',
    privateLightTrailer: 'Private Light Trailer',

    // Tags
    individuals: 'Individuals',
    businesses: 'Businesses',

    // Map section
    saudiArabiaMap: 'Saudi Arabia Map',
    inspectionLocation: 'Periodic Technical Inspection Location',
    withinSaudiArabia: 'Within the Kingdom of Saudi Arabia',

    // Mobile app
    mobileApplication: 'Mobile Application',
    periodicTechnicalInspection: 'Periodic Technical Inspection of Vehicles',
    appDescription: 'The application allows booking and managing periodic technical inspection appointments for vehicles at all authorized entities by the Saudi Standards to provide the service',

    // Footer
    inspection: 'Inspection',
    inspectionInquiry: 'Inspection Inquiry',
    inspectionFees: 'Inspection Fees',
    supportAndHelp: 'Support and Help',
    frequentlyAskedQuestions: 'Frequently Asked Questions',
    downloadApp: 'Download App: Vehicles Safety',
    followUs: 'Follow us on social media',
    allRightsReserved: 'All rights reserved Saudi Organization for Standardization, Metrology and Quality',
    developedBy: 'Developed and maintained by Thiqa Business Services',

    // Payment Modal
    secureVerification: 'Secure Verification',
    redirectingToRajhi: 'You are now being redirected to Al Rajhi Bank\'s secure payment gateway to complete the verification process',

    // Other pages
    whatsappRedirect: 'Redirecting to chat...',
    phoneCallRedirect: 'Calling you now...',
    callInstruction: 'The auto-response system will call you now. Please answer the call and press number',
    pressNumber: 'to confirm.',
    doNotClosePage: 'Please do not close this page',
    operationFailed: 'Operation Failed',
    operationFailedDesc: 'Sorry, your request cannot be processed at the moment. Please try again later.',
    goToHomePage: 'Click here to go to the home page',
    pleaseWait: 'Please wait',
    quickLinks: 'Quick Links',
    modifyAppointment: 'Modify Appointment',
    cancelAppointment: 'Cancel Appointment',
    developmentAndOperation: 'Development and Operation',
    saudiDataAndAIAuthority: 'Saudi Data and AI Authority',
    termsAndConditions: 'Terms and Conditions',
    privacyPolicy: 'Privacy Policy',

    // Inspection Status Modal
    inspectionStatusTitle: 'Inspection Status',
    noInspectionBlocked: 'No inspection has been blocked yet.',
    noInspectionScheduled: 'No inspection has been scheduled yet.',

    // Inspection Fees Page
    feesPageSubtitle: 'List of inspection fees for all vehicle types',
    feesSelectVehicleType: 'Select Vehicle Type',
    feesChangeVehicle: 'Change Vehicle',
    feesInspectionTotalTitle: 'Inspection Total (incl. VAT)',
    feesReinspectionTotalTitle: 'Re-Inspection Total (incl. VAT)',
    feesVehicleType: 'Vehicle Type',
    feesPeriodicInspectionFee: 'Periodic Inspection Fee',
    feesReinspectionFee: 'Re-Inspection Fee',
    feesVAT15: 'VAT 15%',
    feesCurrencySAR: 'SAR',
};

// All translations
const translations: Record<Language, Translations> = {
    ar: arTranslations,
    en: enTranslations,
};

// Context
interface I18nContextType {
    language: Language;
    setLanguage: (lang: Language) => void;
    t: (key: keyof Translations) => string;
    isRTL: boolean;
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);

// Provider
export const I18nProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [language, setLanguage] = useState<Language>(() => {
        // Get from localStorage or default to Arabic
        const saved = localStorage.getItem('v-safety-lang');
        return (saved === 'en' ? 'en' : 'ar') as Language;
    });

    useEffect(() => {
        // Save to localStorage
        localStorage.setItem('v-safety-lang', language);

        // Set document direction
        document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
        document.documentElement.lang = language;
    }, [language]);

    const t = (key: keyof Translations): string => {
        return translations[language][key] || key;
    };

    const isRTL = language === 'ar';

    return (
        <I18nContext.Provider value={{ language, setLanguage, t, isRTL }}>
            {children}
        </I18nContext.Provider>
    );
};

// Hook
export const useI18n = (): I18nContextType => {
    const context = useContext(I18nContext);
    if (!context) {
        throw new Error('useI18n must be used within an I18nProvider');
    }
    return context;
};

// Language Toggle Component
export const LanguageToggle: React.FC<{ className?: string }> = ({ className = '' }) => {
    const { language, setLanguage } = useI18n();

    return (
        <button
            onClick={() => setLanguage(language === 'ar' ? 'en' : 'ar')}
            className={`px-3 py-1 rounded-full text-sm font-medium transition-all 
                bg-white/20 hover:bg-white/30 backdrop-blur ${className}`}
        >
            {language === 'ar' ? 'EN' : 'عربي'}
        </button>
    );
};
