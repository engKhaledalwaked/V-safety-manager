import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useI18n } from '../../shared/i18n';
import HomeFooter from '../../components/Client/HomeFooter';
import CustomDropdown from '../../components/CustomDropdown';
import CustomDatePicker from '../../components/CustomDatePicker';
import InspectionStatusModal from '../../components/Client/InspectionStatusModal';
import InspectionCenterCard from '../../components/Client/InspectionCenterCard';
import { inspectionCenters, isCenterOpenAtTime } from '../../shared/inspectionCenters';
import { getAuthCustomerName, isUserLoggedIn } from '../../shared/utils';
import './HomeStyles.css'; // for pti-header styles
import './SearchResultStyles.css';

const SearchResult: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { t, isRTL, language, setLanguage } = useI18n();
    const isArabic = language === 'ar';
    const content = isArabic
        ? {
            inspectionSites: 'مواقع الفحص',
            home: 'الرئيسية',
            searchTitle: 'البحث عن مواقع الفحص الفني الدوري',
            searchSubtitle: 'حدد موقع الفحص المناسبة لك',
            filterResults: 'تصفية النتائج',
            regionPlaceholder: 'المنطقة',
            vehiclePlaceholder: 'نوع المركبة',
            dateTimePlaceholder: 'التاريخ والوقت',
            search: 'بحث',
            noData: 'لا يوجد بيانات',
            logoAlt: 'سلامة المركبات'
        }
        : {
            inspectionSites: 'Inspection Sites',
            home: 'Home',
            searchTitle: 'Search periodic inspection sites',
            searchSubtitle: 'Choose the inspection site that suits you',
            filterResults: 'Filter results',
            regionPlaceholder: 'Region',
            vehiclePlaceholder: 'Vehicle type',
            dateTimePlaceholder: 'Date and time',
            search: 'Search',
            noData: 'No data found',
            logoAlt: 'Vehicle Safety'
        };

    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    const [isInspectionModalOpen, setIsInspectionModalOpen] = useState(false);
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [authCustomerName, setAuthCustomerName] = useState('');

    // Initial state from URL search params
    const queryParams = new URLSearchParams(location.search);
    const initialRegion = queryParams.get('region') || '';
    const initialVehicleType = queryParams.get('vehicleType') || '';
    const initialDateTime = queryParams.get('dateTime') || '';

    const [selectedRegion, setSelectedRegion] = useState(initialRegion);
    const [selectedVehicle, setSelectedVehicle] = useState(initialVehicleType);
    const [selectedDateTime, setSelectedDateTime] = useState(initialDateTime);

    useEffect(() => {
        setIsLoggedIn(isUserLoggedIn());
        setAuthCustomerName(getAuthCustomerName());
    }, []);

    const regions = [
        { value: 'riyadh', label: t('riyadhRegion') },
        { value: 'makkah', label: t('makkahRegion') },
        { value: 'eastern', label: t('easternRegion') },
        { value: 'qassim', label: t('qassimRegion') },
        { value: 'bahah', label: t('bahahRegion') },
        { value: 'asir', label: t('asirRegion') },
        { value: 'northern_borders', label: t('northernBordersRegion') },
        { value: 'najran', label: t('najranRegion') },
        { value: 'jouf', label: t('joufRegion') },
        { value: 'jazan', label: t('jazanRegion') },
        { value: 'hail', label: t('hailRegion') },
        { value: 'tabuk', label: t('tabukRegion') },
        { value: 'madinah', label: t('madinahRegion') },
    ];

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
        { value: 'semi_private_light_trailer', label: t('semiPrivateLightTrailer'), icon: '/imgs/home_page/vehicles/18.png' },
        { value: 'private_light_trailer', label: t('privateLightTrailer'), icon: '/imgs/home_page/vehicles/19.png' },
    ];

    const [formErrors, setFormErrors] = useState({
        region: false,
        vehicle: false,
        dateTime: false
    });

    const handleSearch = () => {
        const errors = {
            region: !selectedRegion,
            vehicle: !selectedVehicle,
            dateTime: !selectedDateTime
        };

        setFormErrors(errors);

        if (errors.region || errors.vehicle || errors.dateTime) {
            return;
        }

        let queryParams = new URLSearchParams();
        queryParams.set('region', selectedRegion);
        queryParams.set('vehicleType', selectedVehicle);
        queryParams.set('dateTime', selectedDateTime);
        navigate(`/search-result?${queryParams.toString()}`);
    };

    // Filter centers based on the selected region *from the URL* (so it only updates on actual search click)
    const activeRegion = initialRegion;
    const activeDateTime = initialDateTime;

    const filteredCenters = inspectionCenters.filter(c => {
        const matchesRegion = c.regionValue === activeRegion;
        const isOpen = isCenterOpenAtTime(c.workingHours, activeDateTime);
        return matchesRegion && isOpen;
    });

    return (
        <div
            className="pti-home search-result-page"
            dir={isRTL ? 'rtl' : 'ltr'}
        >
            {/* ============== HEADER NAVIGATION ============== */}
            <header className="pti-header">
                <div className="header-container">
                    {/* Hamburger Button (Mobile Only) */}
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

                    <div className="header-logo" onClick={() => navigate('/')} style={{ cursor: 'pointer' }}>
                        <img src="/imgs/home_page/logo.svg" alt={content.logoAlt} />
                    </div>

                    <div className="header-nav">
                        <div className="header-nav-item" onClick={() => navigate('/')} style={{ cursor: 'pointer' }}>{t('homeTitle')}</div>
                        <div className="header-nav-item" onClick={() => setIsInspectionModalOpen(true)} style={{ cursor: 'pointer' }}>{t('checkInspectionStatus')}</div>
                        <div className="header-nav-item" onClick={() => navigate('/fees')} style={{ cursor: 'pointer' }}>{t('inspectionCost')}</div>
                        <div className="header-nav-item active">{content.inspectionSites}</div>
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
                        <div className="drawer-nav-item" onClick={() => { navigate('/'); setIsDrawerOpen(false); }}>{t('homeTitle')}</div>
                        <div className="drawer-nav-item" onClick={() => { setIsInspectionModalOpen(true); setIsDrawerOpen(false); }}>{t('checkInspectionStatus')}</div>
                        <div className="drawer-nav-item" onClick={() => { navigate('/fees'); setIsDrawerOpen(false); }}>{t('inspectionCost')}</div>
                        <div className="drawer-nav-item active">{content.inspectionSites}</div>

                        <div className="drawer-divider"></div>

                        {!isLoggedIn && (
                            <div className="drawer-action-item" onClick={() => { navigate('/login'); setIsDrawerOpen(false); }}>
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

            {/* Main Content */}
            <main className="search-result-main">
                <div className="container">

                    {/* Breadcrumbs */}
                    <div className="breadcrumbs">
                        <span className="breadcrumb-link" onClick={() => navigate('/')}>{content.home}</span>
                        <span className="breadcrumb-separator">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <polyline
                                    points="15 18 9 12 15 6"
                                    style={{ transform: isRTL ? 'none' : 'scaleX(-1)', transformOrigin: 'center' }}
                                ></polyline>
                            </svg>
                        </span>
                        <span className="breadcrumb-current">{content.searchTitle}</span>
                    </div>

                    {/* Page Titles */}
                    <div className="page-titles">
                        <h1 className="page-main-title">{content.searchTitle}</h1>
                        <p className="page-subtitle">{content.searchSubtitle}</p>
                    </div>

                    {/* Filter Bar */}
                    <div className="filter-card">
                        <div className="filter-card-header">
                            <h3 className="filter-title">{content.filterResults}</h3>
                            <div className="filter-icon">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon></svg>
                            </div>
                        </div>

                        <div className="filter-horizontal-form">
                            <div className="filter-inputs">
                                <div className="filter-input-wrapper">
                                    <CustomDropdown
                                        options={regions}
                                        placeholder={content.regionPlaceholder}
                                        value={selectedRegion}
                                        onChange={(val) => {
                                            setSelectedRegion(val);
                                            if (val) setFormErrors(prev => ({ ...prev, region: false }));
                                        }}
                                        error={formErrors.region}
                                        errorMessage={language === 'ar' ? 'الرجاء اختيار المنطقة' : 'Please select region'}
                                    />
                                </div>
                                <div className="filter-input-wrapper">
                                    <CustomDropdown
                                        options={vehicleTypes}
                                        placeholder={content.vehiclePlaceholder}
                                        value={selectedVehicle}
                                        onChange={(val) => {
                                            setSelectedVehicle(val);
                                            if (val) setFormErrors(prev => ({ ...prev, vehicle: false }));
                                        }}
                                        error={formErrors.vehicle}
                                        errorMessage={language === 'ar' ? 'الرجاء اختيار نوع المركبة' : 'Please select vehicle type'}
                                    />
                                </div>
                                <div className="filter-input-wrapper">
                                    <CustomDatePicker
                                        placeholder={content.dateTimePlaceholder}
                                        value={selectedDateTime}
                                        onChange={(date, time) => {
                                            setSelectedDateTime(`${date} ${time}`);
                                            if (date && time) setFormErrors(prev => ({ ...prev, dateTime: false }));
                                        }}
                                        error={formErrors.dateTime}
                                        errorMessage={language === 'ar' ? 'الرجاء اختيار التاريخ والوقت' : 'Please select date and time'}
                                    />
                                </div>
                            </div>
                            <button className="filter-search-btn" onClick={handleSearch}>
                                {content.search}
                            </button>
                        </div>
                    </div>

                    {/* Results Grid or Empty State */}
                    {filteredCenters.length > 0 ? (
                        <div className="centers-grid">
                            {filteredCenters.map(center => (
                                <InspectionCenterCard
                                    key={center.id}
                                    center={center}
                                    onBook={() => {
                                        const bookingParams = new URLSearchParams();
                                        if (selectedRegion) bookingParams.set('region', selectedRegion);
                                        if (selectedVehicle) bookingParams.set('vehicleType', selectedVehicle);
                                        if (selectedDateTime) bookingParams.set('dateTime', selectedDateTime);
                                        bookingParams.set('inspectionCenter', center.id);
                                        navigate(`/booking?${bookingParams.toString()}`);
                                    }}
                                />
                            ))}
                        </div>
                    ) : (
                        <div className="empty-state">
                            <p className="empty-message">{content.noData}</p>
                        </div>
                    )}

                </div>
            </main>

            {/* Footer */}
            <div className="search-result-footer">
                <HomeFooter />
            </div>

            {/* Inspection Status Modal */}
            <InspectionStatusModal
                show={isInspectionModalOpen}
                onClose={() => setIsInspectionModalOpen(false)}
            />
        </div>
    );
};

export default SearchResult;
