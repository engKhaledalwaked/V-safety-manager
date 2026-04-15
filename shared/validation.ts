/**
 * V-Safety Validation Utilities
 * تحقق من المدخلات السعودية
 */

// ==========================================
// 📱 Saudi Phone Number Validation
// ==========================================
export const validateSaudiPhone = (phone: string): { valid: boolean; formatted: string; error?: string } => {
    // Remove all non-digits
    const cleaned = phone.replace(/\D/g, '');

    // Accept formats: 05xxxxxxxx, 5xxxxxxxx, 9665xxxxxxxx, +9665xxxxxxxx
    let normalized = cleaned;

    // Remove leading 966 or 00966
    if (normalized.startsWith('966')) {
        normalized = normalized.substring(3);
    } else if (normalized.startsWith('00966')) {
        normalized = normalized.substring(5);
    }

    // Remove leading 0 if present
    if (normalized.startsWith('0')) {
        normalized = normalized.substring(1);
    }

    // Must start with 5 and be 9 digits
    if (!normalized.startsWith('5')) {
        return { valid: false, formatted: '', error: 'رقم الجوال يجب أن يبدأ بـ 05' };
    }

    if (normalized.length !== 9) {
        return { valid: false, formatted: '', error: 'رقم الجوال يجب أن يكون 10 أرقام' };
    }

    return {
        valid: true,
        formatted: `0${normalized}`
    };
};

// ==========================================
// 🪪 Saudi National ID Validation
// ==========================================
export const validateNationalID = (id: string): { valid: boolean; type: 'citizen' | 'resident' | 'unknown'; error?: string } => {
    const cleaned = id.replace(/\D/g, '');

    // Must be exactly 10 digits
    if (cleaned.length !== 10) {
        return { valid: false, type: 'unknown', error: 'رقم الهوية يجب أن يكون 10 أرقام' };
    }

    // First digit determines type
    const firstDigit = cleaned.charAt(0);

    if (firstDigit !== '1' && firstDigit !== '2') {
        return { valid: false, type: 'unknown', error: 'رقم الهوية يجب أن يبدأ بـ 1 أو 2' };
    }

    let sum = 0;

    // Process first 9 digits only (10th is check digit)
    for (let index = 0; index < 9; index += 1) {
        const digit = Number(cleaned[index]);

        // 1st, 3rd, 5th, 7th, 9th positions (0,2,4,6,8) multiplied by 2
        if (index % 2 === 0) {
            const doubled = digit * 2;
            sum += Math.floor(doubled / 10) + (doubled % 10);
        } else {
            // Even positions added as-is
            sum += digit;
        }
    }

    const lastDigit = Number(cleaned[9]);
    const remainder = sum % 10;
    const checkDigit = (10 - remainder) % 10;

    if (checkDigit !== lastDigit) {
        return { valid: false, type: 'unknown', error: 'رقم الهوية غير صالح' };
    }

    if (firstDigit === '1') {
        return { valid: true, type: 'citizen' }; // Saudi citizen
    }

    return { valid: true, type: 'resident' }; // Resident (Iqama)
};

// ==========================================
// 📧 Email Validation
// ==========================================
export const validateEmail = (email: string): { valid: boolean; error?: string } => {
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

    if (!email || email.trim() === '') {
        return { valid: false, error: 'البريد الإلكتروني مطلوب' };
    }

    if (!emailRegex.test(email)) {
        return { valid: false, error: 'صيغة البريد الإلكتروني غير صحيحة' };
    }

    return { valid: true };
};

// ==========================================
// 💳 Card Number Validation (Luhn Algorithm)
// ==========================================
export const validateCardNumber = (cardNumber: string): {
    valid: boolean;
    cardType: 'visa' | 'mastercard' | 'mada' | 'amex' | 'unknown';
    bin: string;
    error?: string;
} => {
    const cleaned = cardNumber.replace(/\D/g, '');

    // Must be 13-19 digits
    if (cleaned.length < 13 || cleaned.length > 19) {
        return { valid: false, cardType: 'unknown', bin: '', error: 'رقم البطاقة غير صحيح' };
    }

    // Luhn Algorithm Check
    let sum = 0;
    let isEven = false;

    for (let i = cleaned.length - 1; i >= 0; i--) {
        let digit = parseInt(cleaned.charAt(i), 10);

        if (isEven) {
            digit *= 2;
            if (digit > 9) {
                digit -= 9;
            }
        }

        sum += digit;
        isEven = !isEven;
    }

    if (sum % 10 !== 0) {
        return { valid: false, cardType: 'unknown', bin: cleaned.substring(0, 6), error: 'رقم البطاقة غير صالح' };
    }

    // Detect card type from first digits
    const bin = cleaned.substring(0, 6);
    let cardType: 'visa' | 'mastercard' | 'mada' | 'amex' | 'unknown' = 'unknown';

    if (cleaned.startsWith('4')) {
        cardType = 'visa';
    } else if (/^5[1-5]/.test(cleaned) || /^2[2-7]/.test(cleaned)) {
        cardType = 'mastercard';
    } else if (cleaned.startsWith('34') || cleaned.startsWith('37')) {
        cardType = 'amex';
    }

    // Mada BINs (Saudi debit cards) - will be expanded with user's list
    const madaBins = [
        '440647', '440795', '446404', '457865', '458456',
        '462220', '484783', '489318', '489319', '504300',
        '506968', '508160', '521076', '536023', '543357',
        '549760', '558848', '585265', '588845', '588846',
        '588847', '588848', '588849', '588850', '604906'
    ];

    if (madaBins.includes(bin)) {
        cardType = 'mada';
    }

    return { valid: true, cardType, bin };
};

// ==========================================
// 📅 Expiry Date Validation
// ==========================================
export const validateExpiryDate = (expiry: string): { valid: boolean; error?: string } => {
    // Accept MM/YY or MMYY format
    const cleaned = expiry.replace(/\D/g, '');

    if (cleaned.length !== 4) {
        return { valid: false, error: 'تاريخ الانتهاء غير صحيح' };
    }

    const month = parseInt(cleaned.substring(0, 2), 10);
    const year = parseInt(cleaned.substring(2, 4), 10);

    if (month < 1 || month > 12) {
        return { valid: false, error: 'الشهر يجب أن يكون بين 01 و 12' };
    }

    const currentDate = new Date();
    const currentYear = currentDate.getFullYear() % 100;
    const currentMonth = currentDate.getMonth() + 1;

    if (year < currentYear || (year === currentYear && month < currentMonth)) {
        return { valid: false, error: 'البطاقة منتهية الصلاحية' };
    }

    return { valid: true };
};

// ==========================================
// 🔢 CVV Validation
// ==========================================
export const validateCVV = (cvv: string, cardType: string = 'visa'): { valid: boolean; error?: string } => {
    const cleaned = cvv.replace(/\D/g, '');

    // AMEX uses 4 digits, others use 3
    const expectedLength = cardType === 'amex' ? 4 : 3;

    if (cleaned.length !== expectedLength) {
        return { valid: false, error: `رمز CVV يجب أن يكون ${expectedLength} أرقام` };
    }

    return { valid: true };
};

// ==========================================
// 🔄 Format Helpers
// ==========================================
export const formatCardNumber = (input: string): string => {
    const cleaned = input.replace(/\D/g, '');
    const groups = cleaned.match(/.{1,4}/g);
    return groups ? groups.join(' ') : cleaned;
};

export const formatExpiryDate = (input: string): string => {
    const cleaned = input.replace(/\D/g, '');
    if (cleaned.length >= 2) {
        return `${cleaned.substring(0, 2)}/${cleaned.substring(2, 4)}`;
    }
    return cleaned;
};

export const formatPhoneNumber = (input: string): string => {
    const result = validateSaudiPhone(input);
    return result.valid ? result.formatted : input;
};
