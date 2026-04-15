import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import CustomDropdown from '../../components/CustomDropdown';
import InspectionStatusModal from '../../components/Client/InspectionStatusModal';
import { useI18n } from '../../shared/i18n';
import HomeFooter from '../../components/Client/HomeFooter';
import { getAuthCustomerName, isUserLoggedIn } from '../../shared/utils';
import './HomeStyles.css';
import './InspectionFees.css';

// Fee data per vehicle type (inspectionFee, reinspectionFee, vatRate = 15%)
const feeData: Record<string, { inspectionFee: number; reinspectionFee: number }> = {
    private_car: { inspectionFee: 100.00, reinspectionFee: 33.00 },
    private_light_transport: { inspectionFee: 100.00, reinspectionFee: 33.00 },
    heavy_transport: { inspectionFee: 150.00, reinspectionFee: 50.00 },
    light_bus: { inspectionFee: 120.00, reinspectionFee: 40.00 },
    light_transport: { inspectionFee: 100.00, reinspectionFee: 33.00 },
    large_bus: { inspectionFee: 180.00, reinspectionFee: 60.00 },
    medium_transport: { inspectionFee: 130.00, reinspectionFee: 43.00 },
    motorcycle_2_wheels: { inspectionFee: 50.00, reinspectionFee: 17.00 },
    public_works: { inspectionFee: 150.00, reinspectionFee: 50.00 },
    motorcycle_3_4_wheels: { inspectionFee: 60.00, reinspectionFee: 20.00 },
    heavy_trailer: { inspectionFee: 150.00, reinspectionFee: 50.00 },
    taxi: { inspectionFee: 100.00, reinspectionFee: 33.00 },
    rental_car: { inspectionFee: 100.00, reinspectionFee: 33.00 },
    medium_bus: { inspectionFee: 150.00, reinspectionFee: 50.00 },
    semi_heavy_trailer: { inspectionFee: 130.00, reinspectionFee: 43.00 },
    light_trailer: { inspectionFee: 80.00, reinspectionFee: 27.00 },
    semi_light_trailer: { inspectionFee: 80.00, reinspectionFee: 27.00 },
    semi_private_light_trailer: { inspectionFee: 80.00, reinspectionFee: 27.00 },
    private_light_trailer: { inspectionFee: 80.00, reinspectionFee: 27.00 },
};

const VAT_RATE = 0.15;

const InspectionFees: React.FC = () => {
    const navigate = useNavigate();
    const { t, isRTL, language, setLanguage } = useI18n();
    const isArabic = language === 'ar';
    const content = isArabic
        ? {
            logoAlt: 'سلامة المركبات',
            home: 'الرئيسية',
            inspectionFees: 'المقابل المالي للفحص',
            inspectionFeesDesc: 'قائمة برسوم الفحص لكل أنواع المركبات',
            selectVehicle: 'اختر نوع المركبة',
            changeVehicle: 'تغيير المركبة',
            inspectionWithVat: 'مبلغ الفحص شامل الضريبة',
            reinspectionWithVat: 'مبلغ إعادة الفحص شامل الضريبة',
            vehicleTypeLabel: 'نوع المركبة',
            periodicFee: 'المقابل المالي للفحص الفني الدوري',
            reinspectionFee: 'المقابل المالي لإعادة الفحص الفني الدوري',
            vat: 'ضريبة القيمة المضافة 15%',
            bookAppointment: 'حجز موعد',
            currency: 'ر.س'
        }
        : {
            logoAlt: 'Vehicle Safety',
            home: 'Home',
            inspectionFees: 'Inspection fees',
            inspectionFeesDesc: 'A list of inspection fees for all vehicle types',
            selectVehicle: 'Select vehicle type',
            changeVehicle: 'Change vehicle',
            inspectionWithVat: 'Inspection amount including VAT',
            reinspectionWithVat: 'Re-inspection amount including VAT',
            vehicleTypeLabel: 'Vehicle type',
            periodicFee: 'Periodic inspection fee',
            reinspectionFee: 'Re-inspection fee',
            vat: 'VAT 15%',
            bookAppointment: 'Book appointment',
            currency: 'SAR'
        };
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    const [isInspectionModalOpen, setIsInspectionModalOpen] = useState(false);
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [authCustomerName, setAuthCustomerName] = useState('');
    const [selectedVehicle, setSelectedVehicle] = useState('private_car');

    useEffect(() => {
        setIsLoggedIn(isUserLoggedIn());
        setAuthCustomerName(getAuthCustomerName());
    }, []);

    const vehicleTypes = [
        { value: 'private_car', label: t('privateCar'), icon: '/imgs/home_page/vehicles/1.png' },
        { value: 'private_light_transport', label: t('privateLightTransport'), icon: '/imgs/home_page/vehicles/2.png' },
        { value: 'heavy_transport', label: t('heavyTransport'), icon: '/imgs/home_page/vehicles/3.png' },
        { value: 'light_bus', label: t('lightBus'), icon: '/imgs/home_page/vehicles/4.png' },
        { value: 'light_transport', label: t('lightTransport'), icon: '/imgs/home_page/vehicles/5.png' },
        { value: 'large_bus', label: t('largeBus'), icon: '/imgs/home_page/vehicles/6.png' },
        { value: 'medium_transport', label: t('mediumTransport'), icon: '/imgs/home_page/vehicles/7.png' },
        { value: 'motorcycle_2_wheels', label: t('motorcycle2Wheels'), icon: '/imgs/home_page/vehicles/8.png' },
        { value: 'public_works', label: t('publicWorks'), icon: '/imgs/home_page/vehicles/9.png' },
        { value: 'motorcycle_3_4_wheels', label: t('motorcycle34Wheels'), icon: '/imgs/home_page/vehicles/10.png' },
        { value: 'heavy_trailer', label: t('heavyTrailer'), icon: '/imgs/home_page/vehicles/11.png' },
        { value: 'taxi', label: t('taxi'), icon: '/imgs/home_page/vehicles/12.png' },
        { value: 'rental_car', label: t('rentalCar'), icon: '/imgs/home_page/vehicles/13.png' },
        { value: 'medium_bus', label: t('mediumBus'), icon: '/imgs/home_page/vehicles/14.png' },
        { value: 'semi_heavy_trailer', label: t('semiHeavyTrailer'), icon: '/imgs/home_page/vehicles/15.png' },
        { value: 'light_trailer', label: t('lightTrailer'), icon: '/imgs/home_page/vehicles/16.png' },
        { value: 'semi_light_trailer', label: t('semiLightTrailer'), icon: '/imgs/home_page/vehicles/17.png' },
        { value: 'semi_private_light_trailer', label: t('privateLightTrailer'), icon: '/imgs/home_page/vehicles/18.png' },
        { value: 'private_light_trailer', label: t('privateLightTrailer'), icon: '/imgs/home_page/vehicles/19.png' },
    ];

    const scrollToMap = () => {
        navigate('/home#sites');
        setTimeout(() => {
            const mapSection = document.getElementById('sites');
            if (mapSection) {
                mapSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        }, 100);
    };

    const currentFees = feeData[selectedVehicle] || feeData.private_car;
    const inspectionVat = currentFees.inspectionFee * VAT_RATE;
    const inspectionTotal = currentFees.inspectionFee + inspectionVat;
    const reinspectionVat = currentFees.reinspectionFee * VAT_RATE;
    const reinspectionTotal = currentFees.reinspectionFee + reinspectionVat;

    const selectedVehicleObj = vehicleTypes.find(v => v.value === selectedVehicle);
    const selectedVehicleLabel = selectedVehicleObj?.label || '';

    return (
        <div
            className="fees-page pti-home"
            dir={isRTL ? 'rtl' : 'ltr'}
            style={{
                fontFamily: isRTL ? "'IBM Plex Sans Arabic', Arial, sans-serif" : "Arial, sans-serif",
                '--fees-row-direction': isRTL ? 'row-reverse' : 'row',
                '--fees-text-align': isRTL ? 'right' : 'left'
            } as React.CSSProperties}
        >
            {/* ============== HEADER (same as Home page) ============== */}
            <header className="pti-header">
                <div className="header-container">
                    {/* Hamburger Button (Mobile Only via CSS) */}
                    <button
                        className="header-hamburger"
                        onClick={() => setIsDrawerOpen(true)}
                        aria-label="Open Menu"
                    >
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="3" y1="12" x2="21" y2="12"></line>
                            <line x1="3" y1="6" x2="21" y2="6"></line>
                            <line x1="3" y1="18" x2="21" y2="18"></line>
                        </svg>
                    </button>

                    <div className="header-logo">
                        <img src="/imgs/home_page/logo.svg" alt={content.logoAlt} />
                    </div>

                    <div className="header-nav">
                        <div className="header-nav-item" onClick={() => navigate('/home')} style={{ cursor: 'pointer' }}>{t('homeTitle')}</div>
                        <div className="header-nav-item" onClick={() => setIsInspectionModalOpen(true)} style={{ cursor: 'pointer' }}>{t('checkInspectionStatus')}</div>
                        <div className="header-nav-item" onClick={scrollToMap} style={{ cursor: 'pointer' }}>{t('inspectionLocations')}</div>
                        <div className="header-nav-item active">{t('inspectionCost')}</div>
                    </div>

                    <div className="header-actions">
                        <div className="header-lang" onClick={() => setLanguage(language === 'ar' ? 'en' : 'ar')} style={{ cursor: 'pointer' }}>
                            <span>{language === 'ar' ? 'English' : 'العربية'}</span>
                            <img src="/imgs/home_page/lang-icon.svg" alt="Language" />
                        </div>
                        {!isLoggedIn && (
                            <div className="header-login" onClick={() => navigate('/login')}>
                                <span>{t('login')}</span>
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                            </div>
                        )}
                        {isLoggedIn && (
                            <div className="header-login" style={{ cursor: 'default' }}>
                                <span>{language === 'ar' ? `مرحبا ${authCustomerName || 'العميل'}` : `Welcome ${authCustomerName || 'Customer'}`}</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Mobile Drawer */}
                <div className={`mobile-drawer-overlay ${isDrawerOpen ? 'open' : ''}`} onClick={() => setIsDrawerOpen(false)}></div>
                <div className={`mobile-drawer ${isDrawerOpen ? 'open' : ''}`}>
                    <div className="drawer-header">
                        <button className="drawer-close-btn" onClick={() => setIsDrawerOpen(false)}>
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <line x1="18" y1="6" x2="6" y2="18"></line>
                                <line x1="6" y1="6" x2="18" y2="18"></line>
                            </svg>
                        </button>
                        <div className="drawer-logo">
                            <img src="/imgs/home_page/logo.svg" alt={content.logoAlt} />
                        </div>
                    </div>
                    <div className="drawer-content">
                        <div className="drawer-nav-item" onClick={() => { navigate('/home'); setIsDrawerOpen(false); }}>{t('homeTitle')}</div>
                        <div className="drawer-nav-item" onClick={() => { setIsInspectionModalOpen(true); setIsDrawerOpen(false); }}>{t('checkInspectionStatus')}</div>
                        <div className="drawer-nav-item" onClick={() => { scrollToMap(); setIsDrawerOpen(false); }} style={{ cursor: 'pointer' }}>{t('inspectionLocations')}</div>
                        <div className="drawer-nav-item active">{t('inspectionCost')}</div>

                        <div className="drawer-divider"></div>

                        {!isLoggedIn && (
                            <div className="drawer-action-item" onClick={() => navigate('/login')}>
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                                <span>{t('login')}</span>
                            </div>
                        )}
                        {isLoggedIn && (
                            <div className="drawer-action-item">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                                <span>{language === 'ar' ? `مرحبا ${authCustomerName || 'العميل'}` : `Welcome ${authCustomerName || 'Customer'}`}</span>
                            </div>
                        )}
                        <div className="drawer-action-item" onClick={() => setLanguage(language === 'ar' ? 'en' : 'ar')}>
                            <img src="/imgs/home_page/lang-icon.svg" alt="Language" width="20" height="20" />
                            <span>{language === 'ar' ? 'English' : 'العربية'}</span>
                        </div>
                    </div>
                </div>
            </header>

            {/* ============== BANNER ============== */}
            <section className="fees-banner">
                <div className="fees-breadcrumb">
                    <span onClick={() => navigate('/home')}>{content.home}</span> &lt; {content.inspectionFees}
                </div>
                <h1>{content.inspectionFees}</h1>
                <p>{content.inspectionFeesDesc}</p>
            </section>

            {/* ============== FEES CONTENT ============== */}
            <div className="fees-content">
                {/* Vehicle Type Selector */}
                <div className="fees-vehicle-selector">
                    <div className="fees-vehicle-selector-row">
                        <div className="fees-vehicle-selector-header">
                            <svg className="selector-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M12 2L2 7l10 5 10-5-10-5z"></path>
                                <path d="M2 17l10 5 10-5"></path>
                                <path d="M2 12l10 5 10-5"></path>
                            </svg>
                            <h3>{content.selectVehicle}</h3>
                        </div>
                    </div>
                    <div className="fees-vehicle-row">
                        <CustomDropdown
                            options={vehicleTypes}
                            placeholder={content.changeVehicle}
                            value={selectedVehicle}
                            onChange={(val) => setSelectedVehicle(val)}
                        />
                    </div>
                </div>

                {/* Fee Cards */}
                <div className="fees-cards-container">
                    {/* First Inspection Card (right in RTL) */}
                    <div className="fee-card">
                        <div className="fee-card-header">
                            <div className="fee-card-info">
                                <h3 className="fee-card-title">{content.inspectionWithVat}</h3>
                                <p className="fee-card-subtitle">{content.vehicleTypeLabel}: {selectedVehicleLabel}</p>
                            </div>
                            <div className="fee-card-total-price">
                                <span className="total-amount">{inspectionTotal.toFixed(2)}</span>
                                <span className="total-currency">{content.currency}</span>
                            </div>
                        </div>
                        <div className="fee-card-details">
                            <div className="fee-detail-row">
                                <span className="fee-label">{content.periodicFee}</span>
                                <span className="fee-value">{content.currency} {currentFees.inspectionFee.toFixed(2)}</span>
                            </div>
                            <div className="fee-detail-row">
                                <span className="fee-label">{content.vat}</span>
                                <span className="fee-value">{content.currency} {inspectionVat.toFixed(2)}</span>
                            </div>
                        </div>
                    </div>

                    {/* Re-Inspection Card (left in RTL) */}
                    <div className="fee-card">
                        <div className="fee-card-header">
                            <div className="fee-card-info">
                                <h3 className="fee-card-title">{content.reinspectionWithVat}</h3>
                                <p className="fee-card-subtitle">{content.vehicleTypeLabel}: {selectedVehicleLabel}</p>
                            </div>
                            <div className="fee-card-total-price">
                                <span className="total-amount">{reinspectionTotal.toFixed(2)}</span>
                                <span className="total-currency">{content.currency}</span>
                            </div>
                        </div>
                        <div className="fee-card-details">
                            <div className="fee-detail-row">
                                <span className="fee-label">{content.reinspectionFee}</span>
                                <span className="fee-value">{content.currency} {currentFees.reinspectionFee.toFixed(2)}</span>
                            </div>
                            <div className="fee-detail-row">
                                <span className="fee-label">{content.vat}</span>
                                <span className="fee-value">{content.currency} {reinspectionVat.toFixed(2)}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Book Appointment Button */}
                <div className="fees-book-btn-wrapper">
                    <button className="fees-book-btn" onClick={() => navigate('/booking')}>
                        {content.bookAppointment}
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                            <line x1="16" y1="2" x2="16" y2="6"></line>
                            <line x1="8" y1="2" x2="8" y2="6"></line>
                            <line x1="3" y1="10" x2="21" y2="10"></line>
                        </svg>
                    </button>
                </div>
            </div>

            {/* ============== FOOTER ============== */}
            <HomeFooter />

            {/* Inspection Status Modal */}
            <InspectionStatusModal
                show={isInspectionModalOpen}
                onClose={() => setIsInspectionModalOpen(false)}
            />
        </div>
    );
};

export default InspectionFees;
