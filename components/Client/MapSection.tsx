import React from 'react';
import { useI18n } from '../../shared/i18n';
import './MapSection.css';

interface MapSectionProps {
    className?: string;
    backgroundColor?: string;
    height?: string;
}

const MapSection: React.FC<MapSectionProps> = ({
    className = '',
    backgroundColor = '#E8F0EA',
    height = 'auto'
}) => {
    const { t } = useI18n();

    // Helper function to get translated region name from Arabic name
    const getRegionName = (arabicName: string): string => {
        const regionMap: { [key: string]: string } = {
            'منطقة الرياض': t('riyadhRegion'),
            'منطقة مكة المكرمة': t('makkahRegion'),
            'المنطقة الشرقية': t('easternRegion'),
            'منطقة القصيم': t('qassimRegion'),
            'منطقة الباحة': t('bahahRegion'),
            'منطقة عسير': t('asirRegion'),
            'منطقة الحدود الشمالية': t('northernBordersRegion'),
            'منطقة نجران': t('najranRegion'),
            'منطقة الجوف': t('joufRegion'),
            'منطقة جازان': t('jazanRegion'),
            'منطقة حائل': t('hailRegion'),
            'منطقة تبوك': t('tabukRegion'),
            'منطقة المدينة المنورة': t('madinahRegion'),
        };
        return regionMap[arabicName] || arabicName;
    };

    const mapPins = [
        { top: '15%', left: '20%', name: 'منطقة الجوف' },
        { top: '16%', left: '40%', name: 'منطقة الحدود الشمالية' },
        { top: '26%', left: '12%', name: 'منطقة تبوك' }, // عدلت الـ left
        { top: '28%', left: '34%', name: 'منطقة حائل' },
        { top: '38%', left: '42%', name: 'منطقة القصيم' },
        { top: '45%', left: '23%', name: 'منطقة المدينة المنورة' },
        { top: '55%', left: '75%', name: 'المنطقة الشرقية' },
        { top: '55%', left: '52%', name: 'منطقة الرياض' },
        { top: '63%', left: '34%', name: 'منطقة مكة المكرمة' },
        { top: '73%', left: '33%', name: 'منطقة الباحة' },
        { top: '78%', left: '40%', name: 'منطقة عسير' },
        { top: '84%', left: '52%', name: 'منطقة نجران' },
        { top: '90%', left: '39%', name: 'منطقة جازان' },
    ];
    return (
        <div
            className={`search-map ${className}`}
            id="sites"
            style={{
                backgroundColor,
                minHeight: height === 'auto' ? '700px' : height
            }}
        >
            <div className="vtcSearch-container">
                <div className="vtcs-header">
                    <div className="vtcs-header-icon">
                        <img src="/imgs/home_page/search-pin.svg" alt="" width="40" height="40" />
                    </div>
                    <div className="vtcs-header-text">
                        <h3>{t('inspectionLocations')}</h3>
                    </div>
                </div>

            </div>
            <div className="map">
                <img src="/imgs/home_page/saudi_map.svg" alt={t('saudiArabiaMap')} className="map-bg" />
                {mapPins.map((pin, idx) => (
                    <div key={idx} className="point" style={{ top: pin.top, left: pin.left }}>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="#fff">
                            <circle cx="12" cy="12" r="10" fill="#fff" stroke="#067647" strokeWidth="2" />
                            <path d="M12 6C9.79 6 8 7.79 8 10c0 3 4 7 4 7s4-4 4-7c0-2.21-1.79-4-4-4zm0 5.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5z" fill="#067647" />
                        </svg>
                        <span>{getRegionName(pin.name)}</span>
                    </div>
                ))}
            </div>
            <div className="vtc-count">
                <span>58</span>
                <p>{t('inspectionLocation')}</p>
                <p>{t('withinSaudiArabia')}</p>
            </div>
        </div>
    );
};

export default MapSection;
