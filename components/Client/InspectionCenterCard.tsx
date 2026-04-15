import React from 'react';
import { InspectionCenter } from '../../shared/inspectionCenters';
import { useI18n } from '../../shared/i18n';

interface InspectionCenterCardProps {
    center: InspectionCenter;
    onBook: () => void;
}

const InspectionCenterCard: React.FC<InspectionCenterCardProps> = ({ center, onBook }) => {
    const { language, isRTL } = useI18n();
    const isArabic = language === 'ar';
    const bookLabel = isArabic ? 'حجز موعد' : 'Book appointment';
    const displayEntity = isArabic
        ? center.entity
        : center.entity
            .replace('الجهة المرخصة ', 'Licensed entity: ')
            .replace('الفحص الفني الدوري للسيارات و المركبات', 'Periodic technical inspection for cars and vehicles')
            .replace('تكامل لخدمات النقل', 'Takamul Transport Services')
            .replace('شركة أيبلس العربية', 'Applus Arabia Company')
            .replace('شركة مسار المتحدة للفحص', 'Massar United Inspection Company')
            .replace('المسار الامن', 'Safe Path')
            .replace('شركة أبراج التاج للفحص', 'Abraj Al Taj Inspection Company');
    const displayWorkingHours = isArabic
        ? center.workingHours
        : center.workingHours
            .replace(/^من\s*/, 'From ')
            .replace(/\s+إلى\s+/g, ' to ')
            .replace(/صباحاً|صباحا/g, 'AM')
            .replace(/مساءً|مساء/g, 'PM');

    return (
        <div className="center-card">
            <div className="center-card-logo">
                <img src={center.logoUrl} alt={displayEntity} />
            </div>

            <h3 className="center-card-name">{center.name}</h3>

            <div className="center-card-details" dir={isRTL ? 'rtl' : 'ltr'}>
                <span className="entity-text">{displayEntity}</span>
                <span className="divider">/</span>
                <span className="hours-text">{displayWorkingHours}</span>
            </div>



            <button className="center-card-btn" onClick={onBook}>
                {bookLabel}
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
            </button>
        </div>
    );
};

export default InspectionCenterCard;
