export interface InspectionCenter {
    id: string;
    regionValue: string; // e.g. 'riyadh', 'makkah'
    name: string;        // e.g. 'حي المونسية'
    entity: string;      // e.g. 'الفحص الفني الدوري للسيارات و المركبات'
    workingHours: string;
    locationLabel: string; // e.g. 'الرياض حي المونسية'
    logoUrl: string;       // path to the logo based on the entity
}

// Map entities to their respective logos
const getLogo = (entity: string) => {
    if (entity.includes('الفحص الفني الدوري')) {
        return '/imgs/mrakz_alfahs/alfahs_alfani_yellow_logo.png';
    } else if (entity.includes('تكامل')) {
        return '/imgs/mrakz_alfahs/slamh.jpg';
    } else if (entity.includes('أيبلس') || entity.includes('آيبلس')) {
        return '/imgs/mrakz_alfahs/applus_logo.png';
    } else if (entity.includes('المسار الامن')) {
        return '/imgs/mrakz_alfahs/the safe way.png';
    } else if (entity.includes('مسار')) {
        return '/imgs/mrakz_alfahs/massar_logo.png';
    } else if (entity.includes('أبراج') || entity.includes('التاج')) {
        // Dekra maybe? let's use dekra for أبراج التاج or al.png
        return '/imgs/mrakz_alfahs/Dekra_logo.jpg';
    }
    // Default logo (Aman Al Markaba / Fahas Fani)
    return '/imgs/mrakz_alfahs/alfahs_alfani_yellow_logo.png';
};

export const inspectionCenters: InspectionCenter[] = [
    // --- RIYADH REGION ---
    { id: 'r1', regionValue: 'riyadh', name: 'حي المونسية', entity: 'الجهة المرخصة الفحص الفني الدوري للسيارات و المركبات', workingHours: 'من 12:05 صباحاً إلى 11:55 مساءً', locationLabel: 'الرياض حي المونسية', logoUrl: getLogo('الفحص الفني الدوري') },
    { id: 'r2', regionValue: 'riyadh', name: 'حي الشفا', entity: 'الجهة المرخصة الفحص الفني الدوري للسيارات و المركبات', workingHours: 'من 12:05 صباحاً إلى 11:55 مساءً', locationLabel: 'الرياض حي الشفا', logoUrl: getLogo('الفحص الفني الدوري') },
    { id: 'r3', regionValue: 'riyadh', name: 'الخرج', entity: 'الجهة المرخصة الفحص الفني الدوري للسيارات و المركبات', workingHours: 'من 12:05 صباحاً إلى 11:55 مساءً', locationLabel: 'الخرج', logoUrl: getLogo('الفحص الفني الدوري') },
    { id: 'r4', regionValue: 'riyadh', name: 'المجمعة', entity: 'الجهة المرخصة الفحص الفني الدوري للسيارات و المركبات', workingHours: 'من 7:00 صباحاً إلى 3:30 مساءً', locationLabel: 'المجمعة', logoUrl: getLogo('الفحص الفني الدوري') },
    { id: 'r5', regionValue: 'riyadh', name: 'وادي الدواسر', entity: 'الجهة المرخصة الفحص الفني الدوري للسيارات و المركبات', workingHours: 'من 7:00 صباحاً إلى 3:30 مساءً', locationLabel: 'وادي الدواسر', logoUrl: getLogo('الفحص الفني الدوري') },
    { id: 'r6', regionValue: 'riyadh', name: 'حي القيروان', entity: 'الجهة المرخصة تكامل لخدمات النقل', workingHours: 'من 12:05 صباحاً إلى 11:55 مساءً', locationLabel: 'الرياض حي القيروان', logoUrl: getLogo('تكامل') },
    { id: 'r7', regionValue: 'riyadh', name: 'القويعية', entity: 'الجهة المرخصة الفحص الفني الدوري للسيارات و المركبات', workingHours: 'من 7:00 صباحاً إلى 3:30 مساءً', locationLabel: 'القويعية', logoUrl: getLogo('الفحص الفني الدوري') },
    { id: 'r8', regionValue: 'riyadh', name: 'الزلفي', entity: 'الجهة المرخصة شركة أيبلس العربية', workingHours: 'من 12:05 صباحاً إلى 11:55 مساءً', locationLabel: 'الزلفي', logoUrl: getLogo('أيبلس') },
    { id: 'r9', regionValue: 'riyadh', name: 'واجهة روشن', entity: 'الجهة المرخصة تكامل لخدمات النقل', workingHours: 'من 12:05 صباحاً إلى 11:55 مساءً', locationLabel: 'الرياض واجهة روشن', logoUrl: getLogo('تكامل') },
    { id: 'r10', regionValue: 'riyadh', name: 'المنار', entity: 'الجهة المرخصة شركة مسار المتحدة للفحص', workingHours: 'من 12:05 صباحاً إلى 11:55 مساءً', locationLabel: 'الرياض المنار', logoUrl: getLogo('مسار') },
    { id: 'r11', regionValue: 'riyadh', name: 'شقراء', entity: 'الجهة المرخصة شركة أيبلس العربية', workingHours: 'من 12:05 صباحاً إلى 11:55 مساءً', locationLabel: 'شقراء', logoUrl: getLogo('أيبلس') },
    { id: 'r12', regionValue: 'riyadh', name: 'سلامةالمزاحمية', entity: 'الجهة المرخصة تكامل لخدمات النقل', workingHours: 'من 12:05 صباحاً إلى 11:55 مساءً', locationLabel: 'المزاحمية', logoUrl: getLogo('تكامل') },
    { id: 'r13', regionValue: 'riyadh', name: 'أبراج عفيف', entity: 'الجهة المرخصة شركة أبراج التاج للفحص', workingHours: 'من 9:30 صباحاً إلى 6:00 مساءً', locationLabel: 'عفيف', logoUrl: getLogo('أبراج') },
    { id: 'r14', regionValue: 'riyadh', name: 'مخرج سبعة عشر', entity: 'الجهة المرخصة تكامل لخدمات النقل', workingHours: 'من 12:05 صباحاً إلى 11:55 مساءً', locationLabel: 'الرياض مخرج 17', logoUrl: getLogo('تكامل') },
    { id: 'r15', regionValue: 'riyadh', name: 'القادسية', entity: 'الجهة المرخصة المسار الامن', workingHours: 'من 12:05 صباحاً إلى 11:55 مساءً', locationLabel: 'الرياض القادسية', logoUrl: getLogo('المسار الامن') },
    { id: 'r16', regionValue: 'riyadh', name: 'الرياض سعود', entity: 'الجهة المرخصة شركة مسار المتحدة للفحص', workingHours: 'من 12:05 صباحاً إلى 11:55 مساءً', locationLabel: 'الرياض', logoUrl: getLogo('مسار') },

    // --- MAKKAH REGION ---
    { id: 'm1', regionValue: 'makkah', name: 'جدة واحد', entity: 'الجهة المرخصة الفحص الفني الدوري للسيارات و المركبات', workingHours: 'من 12:05 صباحاً إلى 11:55 مساءً', locationLabel: 'جدة', logoUrl: getLogo('الفحص الفني الدوري') },
    { id: 'm2', regionValue: 'makkah', name: 'جدة اثنين', entity: 'الجهة المرخصة الفحص الفني الدوري للسيارات و المركبات', workingHours: 'من 12:05 صباحاً إلى 11:30 مساءً', locationLabel: 'جدة', logoUrl: getLogo('الفحص الفني الدوري') },
    { id: 'm3', regionValue: 'makkah', name: 'الخرمة', entity: 'الجهة المرخصة الفحص الفني الدوري للسيارات و المركبات', workingHours: 'من 7:00 صباحاً إلى 3:00 مساءً', locationLabel: 'الخرمة', logoUrl: getLogo('الفحص الفني الدوري') },
    { id: 'm4', regionValue: 'makkah', name: 'مكة المكرمة', entity: 'الجهة المرخصة الفحص الفني الدوري للسيارات و المركبات', workingHours: 'من 12:05 صباحاً إلى 11:55 مساءً', locationLabel: 'مكة المكرمة', logoUrl: getLogo('الفحص الفني الدوري') },
    { id: 'm5', regionValue: 'makkah', name: 'الطائف', entity: 'الجهة المرخصة الفحص الفني الدوري للسيارات و المركبات', workingHours: 'من 12:05 صباحاً إلى 11:55 مساءً', locationLabel: 'الطائف', logoUrl: getLogo('الفحص الفني الدوري') },
    { id: 'm6', regionValue: 'makkah', name: 'جدة عسفان', entity: 'الجهة المرخصة الفحص الفني الدوري للسيارات و المركبات', workingHours: 'من 12:05 صباحاً إلى 11:55 مساءً', locationLabel: 'جدة عسفان', logoUrl: getLogo('الفحص الفني الدوري') },
    { id: 'm7', regionValue: 'makkah', name: 'القنفذة', entity: 'الجهة المرخصة شركة أيبلس العربية', workingHours: 'من 12:05 صباحاً إلى 11:55 مساءً', locationLabel: 'القنفذة', logoUrl: getLogo('أيبلس') },
    { id: 'm8', regionValue: 'makkah', name: 'شرق الطائف', entity: 'الجهة المرخصة تكامل لخدمات النقل', workingHours: 'من 12:05 صباحاً إلى 11:55 مساءً', locationLabel: 'الطائف', logoUrl: getLogo('تكامل') },

    // --- EASTERN REGION ---
    { id: 'e1', regionValue: 'eastern', name: 'الخفجي', entity: 'الجهة المرخصة الفحص الفني الدوري للسيارات و المركبات', workingHours: 'من 7:00 صباحاً إلى 11:00 مساءً', locationLabel: 'الخفجي', logoUrl: getLogo('الفحص الفني الدوري') },
    { id: 'e2', regionValue: 'eastern', name: 'الجبيل', entity: 'الجهة المرخصة الفحص الفني الدوري للسيارات و المركبات', workingHours: 'من 12:05 صباحاً إلى 11:55 مساءً', locationLabel: 'الجبيل', logoUrl: getLogo('الفحص الفني الدوري') },
    { id: 'e3', regionValue: 'eastern', name: 'الدمام', entity: 'الجهة المرخصة الفحص الفني الدوري للسيارات و المركبات', workingHours: 'من 12:05 صباحاً إلى 11:55 مساءً', locationLabel: 'الدمام', logoUrl: getLogo('الفحص الفني الدوري') },
    { id: 'e4', regionValue: 'eastern', name: 'حفر الباطن', entity: 'الجهة المرخصة الفحص الفني الدوري للسيارات و المركبات', workingHours: 'من 12:05 صباحاً إلى 11:55 مساءً', locationLabel: 'حفر الباطن', logoUrl: getLogo('الفحص الفني الدوري') },
    { id: 'e5', regionValue: 'eastern', name: 'الهفوف', entity: 'الجهة المرخصة الفحص الفني الدوري للسيارات و المركبات', workingHours: 'من 12:05 صباحاً إلى 11:55 مساءً', locationLabel: 'الهفوف', logoUrl: getLogo('الفحص الفني الدوري') },
    { id: 'e6', regionValue: 'eastern', name: 'الخبر مسار', entity: 'الجهة المرخصة شركة مسار المتحدة للفحص', workingHours: 'من 12:05 صباحاً إلى 11:55 مساءً', locationLabel: 'الخبر', logoUrl: getLogo('مسار') },
    { id: 'e7', regionValue: 'eastern', name: 'شرق حفر الباطن', entity: 'الجهة المرخصة تكامل لخدمات النقل', workingHours: 'من 12:05 صباحاً إلى 11:55 مساءً', locationLabel: 'حفر الباطن', logoUrl: getLogo('تكامل') },
    { id: 'e8', regionValue: 'eastern', name: 'أبراج الدمام', entity: 'الجهة المرخصة شركة أبراج التاج للفحص', workingHours: 'من 12:05 صباحاً إلى 11:55 مساءً', locationLabel: 'الدمام', logoUrl: getLogo('أبراج') },
    { id: 'e9', regionValue: 'eastern', name: 'آيبلس الاحساء', entity: 'الجهة المرخصة شركة أيبلس العربية', workingHours: 'من 12:05 صباحاً إلى 11:55 مساءً', locationLabel: 'الاحساء', logoUrl: getLogo('أيبلس') },

    // --- QASSIM REGION ---
    { id: 'q1', regionValue: 'qassim', name: 'القصيم', entity: 'الجهة المرخصة الفحص الفني الدوري للسيارات و المركبات', workingHours: 'من 12:05 صباحاً إلى 11:55 مساءً', locationLabel: 'القصيم', logoUrl: getLogo('الفحص الفني الدوري') },
    { id: 'q2', regionValue: 'qassim', name: 'الرس', entity: 'الجهة المرخصة الفحص الفني الدوري للسيارات و المركبات', workingHours: 'من 7:00 صباحاً إلى 3:30 مساءً', locationLabel: 'الرس', logoUrl: getLogo('الفحص الفني الدوري') },
    { id: 'q3', regionValue: 'qassim', name: 'النبهانية', entity: 'الجهة المرخصة شركة أيبلس العربية', workingHours: 'من 12:05 صباحاً إلى 11:55 مساءً', locationLabel: 'النبهانية', logoUrl: getLogo('أيبلس') },
    { id: 'q4', regionValue: 'qassim', name: 'المذنب', entity: 'الجهة المرخصة شركة أيبلس العربية', workingHours: 'من 12:05 صباحاً إلى 11:55 مساءً', locationLabel: 'المذنب', logoUrl: getLogo('أيبلس') },

    // --- BAHAH REGION ---
    { id: 'b1', regionValue: 'bahah', name: 'الباحة', entity: 'الجهة المرخصة الفحص الفني الدوري للسيارات و المركبات', workingHours: 'من 7:00 صباحاً إلى 3:30 مساءً', locationLabel: 'الباحة', logoUrl: getLogo('الفحص الفني الدوري') },

    // --- ASIR REGION ---
    { id: 'as1', regionValue: 'asir', name: 'محايل عسير', entity: 'الجهة المرخصة الفحص الفني الدوري للسيارات و المركبات', workingHours: 'من 7:00 صباحاً إلى 3:30 مساءً', locationLabel: 'محايل عسير', logoUrl: getLogo('الفحص الفني الدوري') },
    { id: 'as2', regionValue: 'asir', name: 'أبها', entity: 'الجهة المرخصة الفحص الفني الدوري للسيارات و المركبات', workingHours: 'من 12:05 صباحاً إلى 11:55 مساءً', locationLabel: 'أبها', logoUrl: getLogo('الفحص الفني الدوري') },
    { id: 'as3', regionValue: 'asir', name: 'بيشة', entity: 'الجهة المرخصة الفحص الفني الدوري للسيارات و المركبات', workingHours: 'من 7:00 صباحاً إلى 3:30 مساءً', locationLabel: 'بيشة', logoUrl: getLogo('الفحص الفني الدوري') },
    { id: 'as4', regionValue: 'asir', name: 'سراة عبيدة', entity: 'الجهة المرخصة الفحص الفني الدوري للسيارات و المركبات', workingHours: 'من 7:00 صباحاً إلى 3:30 مساءً', locationLabel: 'سراة عبيدة', logoUrl: getLogo('الفحص الفني الدوري') },

    // --- NORTHERN BORDERS REGION ---
    { id: 'nb1', regionValue: 'northern_borders', name: 'عرعر', entity: 'الجهة المرخصة الفحص الفني الدوري للسيارات و المركبات', workingHours: 'من 7:00 صباحاً إلى 4:30 مساءً', locationLabel: 'عرعر', logoUrl: getLogo('الفحص الفني الدوري') },
    { id: 'nb2', regionValue: 'northern_borders', name: 'رفحاء', entity: 'الجهة المرخصة الفحص الفني الدوري للسيارات و المركبات', workingHours: 'من 7:00 صباحاً إلى 3:30 مساءً', locationLabel: 'رفحاء', logoUrl: getLogo('الفحص الفني الدوري') },

    // --- NAJRAN REGION ---
    { id: 'nj1', regionValue: 'najran', name: 'نجران', entity: 'الجهة المرخصة الفحص الفني الدوري للسيارات و المركبات', workingHours: 'من 12:05 صباحاً إلى 11:55 مساءً', locationLabel: 'نجران', logoUrl: getLogo('الفحص الفني الدوري') },

    // --- JOUF REGION ---
    { id: 'jf1', regionValue: 'jouf', name: 'القريات', entity: 'الجهة المرخصة الفحص الفني الدوري للسيارات و المركبات', workingHours: 'من 8:00 صباحاً إلى 4:30 مساءً', locationLabel: 'القريات', logoUrl: getLogo('الفحص الفني الدوري') },
    { id: 'jf2', regionValue: 'jouf', name: 'الجوف', entity: 'الجهة المرخصة الفحص الفني الدوري للسيارات و المركبات', workingHours: 'من 7:00 صباحاً إلى 4:30 مساءً', locationLabel: 'الجوف', logoUrl: getLogo('الفحص الفني الدوري') },

    // --- JAZAN REGION ---
    { id: 'jz1', regionValue: 'jazan', name: 'أبو عريش جازان', entity: 'الجهة المرخصة الفحص الفني الدوري للسيارات و المركبات', workingHours: 'من 12:05 صباحاً إلى 11:55 مساءً', locationLabel: 'أبو عريش', logoUrl: getLogo('الفحص الفني الدوري') },
    { id: 'jz2', regionValue: 'jazan', name: 'بيش', entity: 'الجهة المرخصة الفحص الفني الدوري للسيارات و المركبات', workingHours: 'من 7:00 صباحاً إلى 3:30 مساءً', locationLabel: 'بيش', logoUrl: getLogo('الفحص الفني الدوري') },
    { id: 'jz3', regionValue: 'jazan', name: 'صناعية صامطة', entity: 'الجهة المرخصة المسار الامن', workingHours: 'من 12:05 صباحاً إلى 11:55 مساءً', locationLabel: 'صامطة', logoUrl: getLogo('المسار الامن') },
    { id: 'jz4', regionValue: 'jazan', name: 'آيبلس جازان', entity: 'الجهة المرخصة شركة أيبلس العربية', workingHours: 'من 12:05 صباحاً إلى 11:55 مساءً', locationLabel: 'جازان', logoUrl: getLogo('أيبلس') },

    // --- HAIL REGION ---
    { id: 'h1', regionValue: 'hail', name: 'حايل', entity: 'الجهة المرخصة الفحص الفني الدوري للسيارات و المركبات', workingHours: 'من 12:05 صباحاً إلى 11:55 مساءً', locationLabel: 'حايل', logoUrl: getLogo('الفحص الفني الدوري') },
    { id: 'h2', regionValue: 'hail', name: 'محطة بقعاء', entity: 'الجهة المرخصة شركة أبراج التاج للفحص', workingHours: 'من 9:30 صباحاً إلى 5:30 مساءً', locationLabel: 'بقعاء', logoUrl: getLogo('أبراج') },
    { id: 'h3', regionValue: 'hail', name: 'ٲبراج حائل', entity: 'الجهة المرخصة شركة أبراج التاج للفحص', workingHours: 'من 12:05 صباحاً إلى 11:55 مساءً', locationLabel: 'حائل', logoUrl: getLogo('أبراج') },

    // --- TABUK REGION ---
    { id: 't1', regionValue: 'tabuk', name: 'تبـــوك', entity: 'الجهة المرخصة الفحص الفني الدوري للسيارات و المركبات', workingHours: 'من 12:05 صباحاً إلى 11:55 مساءً', locationLabel: 'تبوك', logoUrl: getLogo('الفحص الفني الدوري') },
    { id: 't2', regionValue: 'tabuk', name: 'ضباء', entity: 'الجهة المرخصة الفحص الفني الدوري للسيارات و المركبات', workingHours: 'من 7:00 صباحاً إلى 3:30 مساءً', locationLabel: 'ضباء', logoUrl: getLogo('الفحص الفني الدوري') },

    // --- MADINAH REGION ---
    { id: 'md1', regionValue: 'madinah', name: 'المدينة المنورة', entity: 'الجهة المرخصة الفحص الفني الدوري للسيارات و المركبات', workingHours: 'من 12:05 صباحاً إلى 11:55 مساءً', locationLabel: 'المدينة المنورة', logoUrl: getLogo('الفحص الفني الدوري') },
    { id: 'md2', regionValue: 'madinah', name: 'ينبع', entity: 'الجهة المرخصة الفحص الفني الدوري للسيارات و المركبات', workingHours: 'من 12:05 صباحاً إلى 11:55 مساءً', locationLabel: 'ينبع', logoUrl: getLogo('الفحص الفني الدوري') },
    { id: 'md3', regionValue: 'madinah', name: 'مسار المدينة', entity: 'الجهة المرخصة شركة مسار المتحدة للفحص', workingHours: 'من 12:05 صباحاً إلى 11:55 مساءً', locationLabel: 'المدينة المنورة', logoUrl: getLogo('مسار') },
];

export const isCenterOpenAtTime = (workingHoursStr: string, selectedDateTime: string): boolean => {
    if (!selectedDateTime) return true;

    const parseSelectedTimeToMinutes = (value: string): number | null => {
        const trimmed = String(value || '').trim();
        if (!trimmed) return null;

        let rawTime = trimmed;

        if (trimmed.includes('T')) {
            rawTime = trimmed.split('T')[1].trim();
        } else {
            const datePrefixMatch = trimmed.match(/^\d{4}-\d{2}-\d{2}\s+(.+)$/);
            if (datePrefixMatch) {
                rawTime = datePrefixMatch[1].trim();
            }
        }

        const match = rawTime.match(/^(\d{1,2}):(\d{2})(?:\s*([A-Za-z\u0600-\u06FF]+))?$/);
        if (!match) return null;

        const hour = Number(match[1]);
        const minute = Number(match[2]);
        const suffixRaw = (match[3] || '').trim();

        if (Number.isNaN(hour) || Number.isNaN(minute) || minute < 0 || minute > 59 || hour < 0 || hour > 23) {
            return null;
        }

        if (!suffixRaw) {
            return hour * 60 + minute;
        }

        const suffix = suffixRaw
            .toLowerCase()
            .replace(/[\u064B-\u065F]/g, '')
            .replace(/أ|إ|آ/g, 'ا');

        const isPm = suffix.includes('pm') || suffix.includes('مساء');
        const isAm = suffix.includes('am') || suffix.includes('صباح');

        if (!isPm && !isAm) {
            return hour * 60 + minute;
        }

        let hour24 = hour % 12;
        if (isPm) hour24 += 12;
        return hour24 * 60 + minute;
    };

    const selMinutes = parseSelectedTimeToMinutes(selectedDateTime);
    if (selMinutes === null) return true;

    // Parse: "من 7:00 صباحاً إلى 3:30 مساءً"
    const regex = /من\s+(\d{1,2}):(\d{2})\s+(صباحاً|مساءً|صباحا|مساء)\s+إلى\s+(\d{1,2}):(\d{2})\s+(صباحاً|مساءً|صباحا|مساء)/;
    const match = workingHoursStr.match(regex);
    if (!match) return true; // If string is not standard, keep it visible

    const [, startH, startM, startAmPm, endH, endM, endAmPm] = match;

    const toMinutes = (hStr: string, mStr: string, ampm: string) => {
        let h = parseInt(hStr, 10);
        const m = parseInt(mStr, 10);
        if (ampm.includes('مساء') && h !== 12) h += 12;
        if (ampm.includes('صباح') && h === 12) h = 0;
        return h * 60 + m;
    };

    const startMinutes = toMinutes(startH, startM, startAmPm);
    const endMinutes = toMinutes(endH, endM, endAmPm);

    if (startMinutes <= endMinutes) {
        return selMinutes >= startMinutes && selMinutes <= endMinutes;
    } else {
        // Wraps around midnight (e.g. 10PM to 2AM)
        return selMinutes >= startMinutes || selMinutes <= endMinutes;
    }
};
