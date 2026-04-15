/**
 * BIN Database for Saudi Banks
 * نظام التعرف على البنوك السعودية
 * 
 * Note: This is a placeholder. User will provide the complete BIN list.
 */

export interface BINInfo {
    bin: string;
    bank: string;
    bankAr: string;
    cardType: 'debit' | 'credit' | 'prepaid';
    cardLevel: 'classic' | 'gold' | 'platinum' | 'signature' | 'world' | 'world_elite' | 'infinite';
    scheme: 'visa' | 'mastercard' | 'mada' | 'amex';
}

// Placeholder BIN Database - User will provide complete list
const binDatabase: BINInfo[] = [
    // Al Rajhi Bank
    { bin: '409201', bank: 'Al Rajhi Bank', bankAr: 'مصرف الراجحي', cardType: 'debit', cardLevel: 'classic', scheme: 'mada' },
    { bin: '446204', bank: 'Al Rajhi Bank', bankAr: 'مصرف الراجحي', cardType: 'credit', cardLevel: 'platinum', scheme: 'visa' },
    { bin: '462220', bank: 'Al Rajhi Bank', bankAr: 'مصرف الراجحي', cardType: 'debit', cardLevel: 'gold', scheme: 'mada' },
    { bin: '468540', bank: 'Al Rajhi Bank', bankAr: 'مصرف الراجحي', cardType: 'credit', cardLevel: 'signature', scheme: 'visa' },
    { bin: '484783', bank: 'Al Rajhi Bank', bankAr: 'مصرف الراجحي', cardType: 'debit', cardLevel: 'classic', scheme: 'mada' },

    // Saudi National Bank (SNB / Alahli)
    { bin: '440795', bank: 'Saudi National Bank', bankAr: 'البنك الأهلي السعودي', cardType: 'debit', cardLevel: 'classic', scheme: 'mada' },
    { bin: '489318', bank: 'Saudi National Bank', bankAr: 'البنك الأهلي السعودي', cardType: 'debit', cardLevel: 'gold', scheme: 'mada' },
    { bin: '402360', bank: 'Saudi National Bank', bankAr: 'البنك الأهلي السعودي', cardType: 'credit', cardLevel: 'world', scheme: 'mastercard' },

    // Riyad Bank
    { bin: '457865', bank: 'Riyad Bank', bankAr: 'بنك الرياض', cardType: 'debit', cardLevel: 'classic', scheme: 'mada' },
    { bin: '536023', bank: 'Riyad Bank', bankAr: 'بنك الرياض', cardType: 'credit', cardLevel: 'platinum', scheme: 'mastercard' },

    // Saudi British Bank (SABB)
    { bin: '458456', bank: 'SABB', bankAr: 'ساب', cardType: 'debit', cardLevel: 'classic', scheme: 'mada' },
    { bin: '417633', bank: 'SABB', bankAr: 'ساب', cardType: 'credit', cardLevel: 'infinite', scheme: 'visa' },

    // Alinma Bank
    { bin: '440647', bank: 'Alinma Bank', bankAr: 'مصرف الإنماء', cardType: 'debit', cardLevel: 'classic', scheme: 'mada' },
    { bin: '521076', bank: 'Alinma Bank', bankAr: 'مصرف الإنماء', cardType: 'credit', cardLevel: 'platinum', scheme: 'mastercard' },

    // Bank Albilad
    { bin: '446404', bank: 'Bank Albilad', bankAr: 'بنك البلاد', cardType: 'debit', cardLevel: 'classic', scheme: 'mada' },

    // Arab National Bank
    { bin: '528847', bank: 'Arab National Bank', bankAr: 'البنك العربي الوطني', cardType: 'credit', cardLevel: 'world_elite', scheme: 'mastercard' },

    // Banque Saudi Fransi
    { bin: '543357', bank: 'Banque Saudi Fransi', bankAr: 'البنك السعودي الفرنسي', cardType: 'debit', cardLevel: 'gold', scheme: 'mada' },

    // STC Pay
    { bin: '604906', bank: 'STC Pay', bankAr: 'إس تي سي باي', cardType: 'prepaid', cardLevel: 'classic', scheme: 'mada' },
];

// Card level display names
export const cardLevelNames: Record<string, { en: string; ar: string }> = {
    classic: { en: 'Classic', ar: 'كلاسيك' },
    gold: { en: 'Gold', ar: 'ذهبية' },
    platinum: { en: 'Platinum', ar: 'بلاتينيوم' },
    signature: { en: 'Signature', ar: 'سيجنتشر' },
    world: { en: 'World', ar: 'وورلد' },
    world_elite: { en: 'World Elite', ar: 'وورلد إيليت' },
    infinite: { en: 'Infinite', ar: 'إنفينيت' },
};

// Card type display names
export const cardTypeNames: Record<string, { en: string; ar: string }> = {
    debit: { en: 'Debit', ar: 'مدى' },
    credit: { en: 'Credit', ar: 'ائتمانية' },
    prepaid: { en: 'Prepaid', ar: 'مسبقة الدفع' },
};

/**
 * Lookup BIN information
 */
export const lookupBIN = (cardNumber: string): BINInfo | null => {
    const cleaned = cardNumber.replace(/\D/g, '');

    if (cleaned.length < 6) return null;

    const bin = cleaned.substring(0, 6);

    // Exact match
    const exactMatch = binDatabase.find(b => b.bin === bin);
    if (exactMatch) return exactMatch;

    // Partial match (first 4 digits)
    const partialBin = bin.substring(0, 4);
    const partialMatch = binDatabase.find(b => b.bin.startsWith(partialBin));
    if (partialMatch) return partialMatch;

    return null;
};

/**
 * Get formatted BIN info for display
 */
export const getBINDisplayInfo = (cardNumber: string): {
    bank: string;
    bankAr: string;
    cardType: string;
    cardTypeAr: string;
    cardLevel: string;
    cardLevelAr: string;
    scheme: string;
} | null => {
    const info = lookupBIN(cardNumber);

    if (!info) return null;

    return {
        bank: info.bank,
        bankAr: info.bankAr,
        cardType: cardTypeNames[info.cardType]?.en || info.cardType,
        cardTypeAr: cardTypeNames[info.cardType]?.ar || info.cardType,
        cardLevel: cardLevelNames[info.cardLevel]?.en || info.cardLevel,
        cardLevelAr: cardLevelNames[info.cardLevel]?.ar || info.cardLevel,
        scheme: info.scheme.toUpperCase(),
    };
};

/**
 * Check if card is from Al Rajhi Bank (for special handling)
 */
export const isRajhiCard = (cardNumber: string): boolean => {
    const info = lookupBIN(cardNumber);
    return info?.bank === 'Al Rajhi Bank';
};

/**
 * Add custom BINs (for user to provide via Firebase later)
 */
export const addCustomBINs = (bins: BINInfo[]): void => {
    binDatabase.push(...bins);
};
