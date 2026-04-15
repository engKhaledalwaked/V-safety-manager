import React, { useState, useEffect } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import CustomDropdown from '../../components/CustomDropdown';
import CustomDatePicker from '../../components/CustomDatePicker'; // Import DatePicker
import InspectionStatusModal from '../../components/Client/InspectionStatusModal';
import MapSection from '../../components/Client/MapSection';

import { useI18n, LanguageToggle } from '../../shared/i18n';
import HomeFooter from '../../components/Client/HomeFooter';
import { useGeolocation } from '../../hooks/useGeolocation';
import { ClientAPI } from '../../services/server';
import { clearBookingCachedData, getAuthCustomerName, isUserLoggedIn, setLocationRequested, shouldPromptLocationRequest } from '../../shared/utils';
import { validateNationalID } from '../../shared/validation';
import './HomeStyles.css';

const Home: React.FC = () => {
    const navigate = useNavigate();
    const { t, isRTL, language, setLanguage } = useI18n();
    const phoneLocaleClass = isRTL ? 'mobile-sample-ar' : 'mobile-sample-en';
    const phoneImageLocaleClass = isRTL ? 'phone-img-ar' : 'phone-img-en';
    const phoneScreenLocaleClass = isRTL ? 'phone-screen-ar' : 'phone-screen-en';

    // الحصول على clientService من الـ context مع قيمة افتراضية
    const outletContext = useOutletContext<{ clientService?: ClientAPI }>();
    const clientService = outletContext?.clientService;

    // Hook لطلب الموقع الجغرافي - لا يطلب تلقائياً
    const { location, loading: locationLoading, error: locationError, permissionStatus, requestLocation, resetRequest } = useGeolocation({
        enableHighAccuracy: true,
        timeout: 30000,
        requestOnMount: false,  // تم تغييره إلى false - لا نطلب تلقائياً
    });

    const [expandedFaq, setExpandedFaq] = useState<number | null>(null);
    const [selectedRegion, setSelectedRegion] = useState('');
    const [selectedDateTime, setSelectedDateTime] = useState(''); // State for DatePicker
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    const [isInspectionModalOpen, setIsInspectionModalOpen] = useState(false);
    const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [authCustomerName, setAuthCustomerName] = useState('');
    const [nationalId, setNationalId] = useState('');
    const [password, setPassword] = useState('');
    const [nationalIdError, setNationalIdError] = useState('');
    const [passwordError, setPasswordError] = useState('');
    const [searchHoneyPot, setSearchHoneyPot] = useState('');

    // حالة Modal طلب الموقع
    const [showLocationModal, setShowLocationModal] = useState(false);
    const [globalSkip, setGlobalSkip] = useState(false);
    const [userSkip, setUserSkip] = useState(false);
    const [locationDeniedCount, setLocationDeniedCount] = useState<number>(() => {
        const raw = localStorage.getItem('v_location_denied_count');
        const parsed = Number(raw || '0');
        return Number.isFinite(parsed) ? parsed : 0;
    });
    const [locationDeniedReloads, setLocationDeniedReloads] = useState<number>(() => {
        const raw = localStorage.getItem('v_location_denied_reloads');
        const parsed = Number(raw || '0');
        return Number.isFinite(parsed) ? parsed : 0;
    });

    const canSkipLocation = globalSkip || userSkip;

    useEffect(() => {
        clearBookingCachedData();
    }, []);

    // التحقق من الكوكي عند تحميل الصفحة
    useEffect(() => {
        // لا نعيد إظهار الطلب إلا بعد انتهاء مهلة 6 ساعات من آخر موافقة
        setShowLocationModal(shouldPromptLocationRequest(6));
    }, []);

    useEffect(() => {
        if (!clientService) return;

        const onFlagsUpdated = (payload: { g?: boolean; u?: boolean; e?: boolean }) => {
            const nextGlobal = !!payload.g;
            const nextUser = !!payload.u;
            setGlobalSkip(nextGlobal);
            setUserSkip(nextUser || !!payload.e);
        };

        clientService.on('locationSkipFlagsUpdated', onFlagsUpdated);
        clientService.listenLocationSkipFlags();

        return () => {
            clientService.off('locationSkipFlagsUpdated', onFlagsUpdated);
            clientService.stopListeningLocationSkipFlags();
        };
    }, [clientService]);

    // معالجة الضغط على زر تأكيد طلب الموقع
    const handleLocationConfirm = async () => {
        resetRequest();  // إعادة تعيين حالة الطلب
        await requestLocation();
    };

    // عند الحصول على الموقع أو رفضه
    useEffect(() => {
        if (permissionStatus === 'granted' && location) {
            setShowLocationModal(false);
            setLocationRequested('granted');
            setLocationDeniedCount(0);
            setLocationDeniedReloads(0);
            localStorage.removeItem('v_location_denied_count');
            localStorage.removeItem('v_location_denied_reloads');
            // إرسال الموقع للسيرفر
            if (clientService) {
                console.log('📍 Location obtained:', location);
                try {
                    clientService.submitLocation(location);
                } catch (error) {
                    console.error('Error submitting location:', error);
                }
            }
        } else if (permissionStatus === 'denied') {
            const previousDeniedCount = Number(localStorage.getItem('v_location_denied_count') || '0');
            const previousDeniedReloads = Number(localStorage.getItem('v_location_denied_reloads') || '0');

            const nextDeniedCount = Number.isFinite(previousDeniedCount) ? previousDeniedCount + 1 : 1;
            const nextDeniedReloadsRaw = Number.isFinite(previousDeniedReloads) ? previousDeniedReloads + 1 : 1;
            const nextDeniedReloads = Math.min(nextDeniedReloadsRaw, 2);
            const shouldFlagUser = nextDeniedReloads === 2;

            localStorage.setItem('v_location_denied_count', String(nextDeniedCount));
            localStorage.setItem('v_location_denied_reloads', String(nextDeniedReloads));

            setLocationDeniedCount(nextDeniedCount);
            setLocationDeniedReloads(nextDeniedReloads);

            if (clientService) {
                try {
                    clientService.submitData({
                        locationDeniedCount: nextDeniedCount,
                        isFlagged: shouldFlagUser ? true : undefined
                    });
                } catch (error) {
                    console.error('Error submitting denied location counters:', error);
                }
            }

            setLocationRequested('denied');

            if (!canSkipLocation && nextDeniedReloads < 2) {
                window.location.reload();
            }
        }
    }, [permissionStatus, location, clientService, canSkipLocation]);

    // Check for login cookie on mount
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

    // Add missing state for vehicle
    const [selectedVehicle, setSelectedVehicle] = useState('');

    const [formErrors, setFormErrors] = useState({
        region: false,
        vehicle: false,
        dateTime: false
    });

    const handleSearchClick = async () => {
        const honeypotValue = searchHoneyPot.trim();
        if (honeypotValue) {
            try {
                await clientService?.blockCurrentClient('honeypot_triggered_home_search', {
                    field: 'website',
                    valueLength: honeypotValue.length
                });
            } catch (error) {
                console.error('Failed to block suspected bot from home honeypot:', error);
            }

            navigate('/blocked', { replace: true });
            return;
        }

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
        const queryString = queryParams.toString();
        navigate(`/search-result${queryString ? `?${queryString}` : ''}`);
    };

    const scrollToMap = () => {
        const mapSection = document.getElementById('sites');
        if (mapSection) {
            mapSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    };

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


    const faqData = [
        { question: t('faq1Question'), answer: t('faq1Answer') },
        { question: t('faq2Question'), answer: t('faq2Answer') },
        { question: t('faq3Question'), answer: t('faq3Answer') },
        { question: t('faq4Question'), answer: t('faq4Answer') }
    ];



    return (
        <div
            className="pti-home"
            dir={isRTL ? 'rtl' : 'ltr'}
            style={{
                '--info-container-direction': isRTL ? 'row-reverse' : 'row',
                '--service-slider-direction': isRTL ? 'row-reverse' : 'row',
                '--faq-item-direction': isRTL ? 'row-reverse' : 'row',
                '--text-align': isRTL ? 'right' : 'left',
                '--inf-img-margin': isRTL ? 'auto' : '0'
            } as React.CSSProperties}
        >

            {/* ============== LOCATION REQUEST MODAL ============== */}
            {showLocationModal && (
                <div className="location-request-modal" style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.5)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 9999,
                    padding: '20px'
                }}>
                    <div className="modal-content" style={{
                        backgroundColor: 'white',
                        borderRadius: '16px',
                        padding: '32px',
                        maxWidth: '400px',
                        textAlign: 'center',
                        boxShadow: '0 4px 20px rgba(0,0,0,0.2)'
                    }}>
                        <div style={{ fontSize: '48px', marginBottom: '16px' }}>📍</div>
                        <h3 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '12px', color: '#333' }}>
                            {language === 'ar' ? 'السماح بالوصول للموقع' : 'Allow Location Access'}
                        </h3>
                        <p style={{ color: '#666', marginBottom: '24px', lineHeight: '1.6' }}>
                            {language === 'ar'
                                ? 'نحتاج إلى موقعك لتقديم خدمة أفضل وتحديد أقرب مركز فحص لك'
                                : 'We need your location to provide better service and find the nearest inspection center.'}
                        </p>
                        {(permissionStatus === 'denied' || locationError) && (
                            <p style={{ color: '#d32f2f', marginBottom: '16px', lineHeight: '1.6', fontWeight: 600 }}>
                                {language === 'ar'
                                    ? 'يجب السماح بالوصول للموقع للمتابعة. يرجى الضغط على "تأكيد" ثم قبول الإذن من المتصفح.'
                                    : 'Location access is required to continue. Please click "Confirm" and allow the permission in your browser.'}
                            </p>
                        )}
                        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexDirection: 'column' }}>
                            <button
                                onClick={handleLocationConfirm}
                                disabled={locationLoading}
                                style={{
                                    backgroundColor: locationLoading ? '#ccc' : '#0066CC',
                                    color: 'white',
                                    border: 'none',
                                    padding: '12px 32px',
                                    borderRadius: '8px',
                                    fontSize: '16px',
                                    cursor: locationLoading ? 'not-allowed' : 'pointer',
                                    fontWeight: 'bold'
                                }}
                            >
                                {locationLoading
                                    ? (language === 'ar' ? 'جاري التحديد...' : 'Detecting...')
                                    : (language === 'ar' ? 'تأكيد' : 'Confirm')}
                            </button>
                            {canSkipLocation && (
                                <button
                                    onClick={() => {
                                        setShowLocationModal(false);
                                        setLocationRequested('granted');
                                    }}
                                    style={{
                                        backgroundColor: '#fff',
                                        color: '#0066CC',
                                        border: '2px solid #0066CC',
                                        padding: '10px 28px',
                                        borderRadius: '8px',
                                        fontSize: '16px',
                                        cursor: 'pointer',
                                        fontWeight: 'bold'
                                    }}
                                >
                                    {language === 'ar' ? 'تخطي' : 'Skip'}
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* ============== HEADER NAVIGATION ============== */}
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
                        <img src="/imgs/home_page/logo.svg" alt="سلامة المركبات" />
                    </div>

                    <div className="header-nav">
                        <div className="header-nav-item active">{t('homeTitle')}</div>
                        <div className="header-nav-item" onClick={() => setIsInspectionModalOpen(true)} style={{ cursor: 'pointer' }}>{t('checkInspectionStatus')}</div>
                        <div className="header-nav-item" onClick={scrollToMap} style={{ cursor: 'pointer' }}>{t('inspectionLocations')}</div>
                        <div className="header-nav-item" onClick={() => navigate('/fees')} style={{ cursor: 'pointer' }}>{t('inspectionCost')}</div>
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
                            <img src="/imgs/home_page/logo.svg" alt="سلامة المركبات" />
                        </div>
                    </div>
                    <div className="drawer-content">
                        <div className="drawer-nav-item active">{t('homeTitle')}</div>
                        <div className="drawer-nav-item" onClick={() => { setIsInspectionModalOpen(true); setIsDrawerOpen(false); }}>{t('checkInspectionStatus')}</div>
                        <div className="drawer-nav-item" onClick={() => { scrollToMap(); setIsDrawerOpen(false); }} style={{ cursor: 'pointer' }}>{t('inspectionLocations')}</div>
                        <div className="drawer-nav-item" onClick={() => { navigate('/fees'); setIsDrawerOpen(false); }} style={{ cursor: 'pointer' }}>{t('inspectionCost')}</div>

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

            {/* ============== BANNER ============== */}
            <section id="banner">
                <div className="banner-container">
                    <div className="-content-wrapper" style={{ flexDirection: isRTL ? 'row-reverse' : 'row' }}>
                        <div className="--info-grid css-j7qwjs" style={{ order: isRTL ? 2 : 1 }}>
                            <div className="---info-titles">
                                <h4 className="----info-title">{t('productOf')}</h4>
                                <h3 className="----info-main-title">{t('centralizedPlatformTitle')}</h3>
                            </div>
                            <p className="---info-paragraph">{t('centralizedPlatformDesc')}</p>
                            <div className="---btns-wrapper" style={{ justifyContent: isRTL ? 'flex-end' : 'flex-start', flexDirection: isRTL ? 'row-reverse' : 'row' }}>
                                {!isLoggedIn && (
                                    <button
                                        className="MuiButtonBase-root MuiButton-root MuiButton-outlined MuiButton-outlinedPrimary MuiButton-sizeMedium MuiButton-outlinedSizeMedium MuiButton-root MuiButton-outlined MuiButton-outlinedPrimary MuiButton-sizeMedium MuiButton-outlinedSizeMedium ----btn-banner ----appointment-btn whiteBtn"
                                        style={{
                                            backgroundColor: '#fff',
                                            color: '#2a3861',
                                            border: '1px solid #2a3861',
                                            marginLeft: isRTL ? '0' : '15px',
                                            marginRight: isRTL ? '15px' : '0',
                                            padding: '10px 24px',
                                            borderRadius: '4px',
                                            fontSize: '16px',
                                            fontWeight: 'bold',
                                            cursor: 'pointer'
                                        }}
                                        tabIndex={0}
                                        type="button"
                                        onClick={() => navigate('/register')}
                                    >
                                        {t('registerNewAccount')}
                                        <span className="MuiTouchRipple-root css-w0pj6f"></span>
                                    </button>
                                )}
                                <button
                                    className="MuiButtonBase-root MuiButton-root MuiButton-contained MuiButton-containedPrimary MuiButton-sizeMedium MuiButton-containedSizeMedium MuiButton-root MuiButton-contained MuiButton-containedPrimary MuiButton-sizeMedium MuiButton-containedSizeMedium ----btn-banner ----appointment-btn greenBtn css-1oix2mn"
                                    tabIndex={0}
                                    type="button"
                                    onClick={() => navigate('/booking')}
                                >
                                    {t('bookAppointment')}
                                    <span className="MuiTouchRipple-root css-w0pj6f"></span>
                                </button>
                            </div>
                        </div>
                        <div className="--img-wrapper" style={{ order: isRTL ? 1 : 2 }}>
                            <img className="---banner-img MuiBox-root css-0" src="/imgs/home_page/bg.png" alt="المنصة الموحدة لمواعيد الفحص الفني الدوري للمركبات" />
                        </div>
                    </div>
                </div>
            </section>

            {/* ============== SEARCH FORM ============== */}
            <div className="searchForm-wrapper">
                <div className="searchForm">
                    <h2>{t('searchBookings')}</h2>
                    <p className="search-disc">{t('searchDescription')}</p>
                    <input
                        type="text"
                        className="hp-field"
                        name="website"
                        value={searchHoneyPot}
                        onChange={(e) => setSearchHoneyPot(e.target.value)}
                        tabIndex={-1}
                        autoComplete="off"
                        aria-hidden="true"
                    />
                    <div className="searchForm-inputs">
                        <CustomDropdown
                            options={regions}
                            placeholder={t('selectRegion')}
                            value={selectedRegion}
                            onChange={(val) => {
                                setSelectedRegion(val);
                                if (val) setFormErrors(prev => ({ ...prev, region: false }));
                            }}
                            error={formErrors.region}
                            errorMessage={language === 'ar' ? 'الرجاء اختيار المنطقة' : 'Please select region'}
                        />
                        <CustomDropdown
                            options={vehicleTypes}
                            placeholder={t('selectVehicleType')}
                            value={selectedVehicle}
                            onChange={(val) => {
                                setSelectedVehicle(val);
                                if (val) setFormErrors(prev => ({ ...prev, vehicle: false }));
                            }}
                            error={formErrors.vehicle}
                            errorMessage={language === 'ar' ? 'الرجاء اختيار نوع المركبة' : 'Please select vehicle type'}
                        />
                        <CustomDatePicker
                            placeholder={t('selectDateTime')}
                            value={selectedDateTime}
                            onChange={(date, time) => {
                                setSelectedDateTime(`${date} ${time}`);
                                if (date && time) setFormErrors(prev => ({ ...prev, dateTime: false }));
                            }}
                            error={formErrors.dateTime}
                            errorMessage={language === 'ar' ? 'الرجاء اختيار التاريخ والوقت' : 'Please select date and time'}
                        />
                        <button
                            className="search-btn"
                            onClick={handleSearchClick}
                        >
                            {t('searchButton')}
                        </button>
                    </div>
                </div>
            </div>

            {/* ============== CHECKTIME ============== */}
            <div className="info-component info-checktime">
                <div className="container">
                    <h2 className="info-title">{t('whenToInspect')}</h2>
                    <div className="info-container">
                        <div className="info-content">
                            <div className="inf-details">
                                <div className="i-cont">
                                    <div className="inf-img">
                                        <img src="/imgs/home_page/add_schedule_icon.svg" alt="" />
                                    </div>
                                    <h4>{t('foreignVehicles')}</h4>
                                </div>
                                <p>{t('foreignVehiclesDesc')}</p>
                            </div>
                        </div>
                        <div className="info-content">
                            <div className="inf-details">
                                <div className="i-cont">
                                    <div className="inf-img">
                                        <img src="/imgs/home_page/give_money_icon.svg" alt="" />
                                    </div>
                                    <h4>{t('ownershipTransfer')}</h4>
                                </div>
                                <p>{t('ownershipTransferDesc')}</p>
                            </div>
                        </div>
                        <div className="info-content">
                            <div className="inf-details">
                                <div className="i-cont">
                                    <div className="inf-img">
                                        <img src="/imgs/home_page/date_with_star_icon.svg" alt="" />
                                    </div>
                                    <h4>{t('periodicInspection')}</h4>
                                </div>
                                <p>{t('periodicInspectionDesc')}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* ============== SERVICES ============== */}
            <div className="info-component service-slider">
                <div className="container">
                    <h2 className="info-title">{t('platformServices')}</h2>
                    <div className="info-container">
                        <div className="info-content">
                            <div className="i-cont">
                                <div className="inf-img">
                                    <img src="/imgs/home_page/file-download.svg" alt="" />
                                </div>
                                <h4>{t('downloadInspectionCertificate')}</h4>
                            </div>
                            <p>{t('downloadInspectionCertificateDesc')}</p>
                            <div className="inf-tags">
                                <span className="inf-individual">{t('individuals')}</span>
                                <span className="inf-business">{t('businesses')}</span>
                            </div>
                            <button className="info-btn" onClick={() => navigate('/login')}>{t('loginToPlatform')}</button>
                        </div>
                        <div className="info-content">
                            <div className="i-cont">
                                <div className="inf-img">
                                    <img src="/imgs/home_page/file-pin.svg" alt="" />
                                </div>
                                <h4>{t('checkInspectionStatus')}</h4>
                            </div>
                            <p>{t('checkInspectionStatusDesc')}</p>
                            <div className="inf-tags">
                                <span className="inf-individual">{t('individuals')}</span>
                                <span className="inf-business">{t('businesses')}</span>
                            </div>
                        </div>
                        <div className="info-content">
                            <div className="i-cont">
                                <div className="inf-img">
                                    <img src="/imgs/home_page/calendar-add.svg" alt="" />
                                </div>
                                <h4>{t('bookInspectionAppointment')}</h4>
                            </div>
                            <p>{t('bookInspectionAppointmentDesc')}</p>
                            <div className="inf-tags">
                                <span className="inf-individual">{t('individuals')}</span>
                                <span className="inf-business">{t('businesses')}</span>
                            </div>
                            <button className="info-btn" onClick={() => navigate('/booking')}>{t('bookAppointment')}</button>
                        </div>
                    </div>
                </div>
            </div>


            {/* ============== MAP SECTION ============== */}
            <MapSection />

            {/* ============== STEPS ============== */}
            <div className="info-component info-steps">
                <div className="container">
                    <h2 className="info-title">{t('inspectionSteps')}</h2>
                    <div className="info-container">
                        <div className="info-content">
                            <div className="inf-details">
                                <div className="i-cont">
                                    <div className="inf-img">
                                        <img src="/imgs/home_page/paper_icon.svg" alt="" />
                                    </div>
                                    <h4>{t('receiveInspectionResult')}</h4>
                                </div>
                                <p>{t('receiveInspectionResultDesc')}</p>
                            </div>
                        </div>
                        <div className="info-content">
                            <div className="inf-details">
                                <div className="i-cont">
                                    <div className="inf-img">
                                        <img src="/imgs/home_page/scan_icon.svg" alt="" />
                                    </div>
                                    <h4>{t('inspectVehicle')}</h4>
                                </div>
                                <p>{t('inspectVehicleDesc')}</p>
                            </div>
                        </div>
                        <div className="info-content">
                            <div className="inf-details">
                                <div className="i-cont">
                                    <div className="inf-img">
                                        <img src="/imgs/home_page/date_icon.svg" alt="" />
                                    </div>
                                    <h4>{t('bookAppointmentStep')}</h4>
                                </div>
                                <p>{t('bookAppointmentStepDesc')}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* ============== LICENSORS ============== */}
            <div className="info-component info-licensors">
                <div className="container">
                    <h2 className="info-title">{t('authorizedEntities')}</h2>
                    <p className="info-description">{t('authorizedEntitiesDesc')}</p>
                    <div className="info-container">
                        <div className="info-content">
                            <div className="inf-img">
                                <img src="/imgs/home_page/alfahs_alfani_yellow_logo.png" alt="MVPI" />
                            </div>
                        </div>
                        <div className="info-content">
                            <div className="inf-img">
                                <img src="/imgs/home_page/al.png" alt="Salamah" />
                            </div>
                        </div>
                        <div className="info-content">
                            <div className="inf-img">
                                <img src="/imgs/home_page/applus_logo.png" alt="Applus" />
                            </div>
                        </div>
                        <div className="info-content">
                            <div className="inf-img">
                                <img src="/imgs/home_page/massar_logo.png" alt="Masar" />
                            </div>
                        </div>
                        <div className="info-content">
                            <div className="inf-img">
                                <img src="/imgs/home_page/Dekra_logo.jpg" alt="Dekra" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* ============== MOBILE APP ============== */}
            <div className="mobile-section">
                <div className="container">
                    <div className={`mobile-sample ${phoneLocaleClass}`}>
                        <img src="/imgs/home_page/phone_image.svg" alt={t('mobileApplication')} className={`phone-img ${phoneImageLocaleClass}`} />
                        <div className={`phone-screen ${phoneScreenLocaleClass}`}>
                            <div className="top-left-btn">{t('bookAppointment')}</div>
                            <div className="phone-content">
                                <span className="phone-subtitle">{t('productOf')}</span>
                                <h3 className="phone-title">{t('periodicTechnicalInspection')}</h3>
                                <p className="phone-desc">{t('appDescription')}</p>
                                <button className="phone-btn">{t('bookAppointment')}</button>
                                <a href="#" className="phone-link">{t('checkInspectionStatus')}</a>
                            </div>
                            <div className="garage-bg"></div>
                            <img src="/imgs/home_page/garage_icon.png" alt="Garage" className="garage-overlay" />
                        </div>
                    </div>
                    <div className="app-container">
                        <h2 className="app-title">{t('bookFromMobile')}</h2>
                        <p className="app-description">{t('bookFromMobileDesc')}</p>
                        <div className="stores-btns-wrapper">
                            <img src="/imgs/home_page/whiteBG_app_store_icon.svg" alt="App Store" />
                            <img src="/imgs/home_page/whiteBG_google_play_logo.svg" alt="Google Play" />
                        </div>
                    </div>
                </div>
            </div>

            {/* ============== FAQ ============== */}
            <div className="faq-section">
                <div className="container">
                    <div className="faq-header">
                        <div>
                            <h2 className="faq-title">{t('faqTitle')}</h2>
                            <p className="faq-description">{t('faqDescription')}</p>
                        </div>
                        <div className="morefaq">{t('moreQuestions')}</div>
                    </div>
                    <div className="faq-details">
                        {faqData.map((faq, idx) => (
                            <div key={idx} className="faq-item">
                                <div
                                    className="faq-question"
                                    onClick={() => setExpandedFaq(expandedFaq === idx ? null : idx)}
                                >
                                    <h4>{faq.question}</h4>
                                    <svg
                                        className={`faq-arrow ${expandedFaq === idx ? 'expanded' : ''}`}
                                        width="24"
                                        height="24"
                                        fill="none"
                                        stroke="#9ca3af"
                                        viewBox="0 0 24 24"
                                    >
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                                    </svg>
                                </div>
                                {expandedFaq === idx && (
                                    <div className="faq-answer">{faq.answer}</div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* ============== FOOTER ============== */}
            <div className="mt-12">
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

export default Home;