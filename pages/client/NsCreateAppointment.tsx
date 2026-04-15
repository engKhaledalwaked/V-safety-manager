import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { useI18n } from '../../shared/i18n';
import InspectionStatusModal from '../../components/Client/InspectionStatusModal';
import HomeFooter from '../../components/Client/HomeFooter';
import { inspectionCenters } from '../../shared/inspectionCenters';
import { getAuthCustomerName, isUserLoggedIn } from '../../shared/utils';
import CustomDropdown from '../../components/CustomDropdown';
import './NsCreateAppointment.css';

const NsCreateAppointment: React.FC = () => {
  const navigate = useNavigate();
  const { clientService } = useOutletContext<{ clientService: any }>();
  const { isRTL, language, setLanguage, t } = useI18n();
  const isArabic = language === 'ar';
  const content = isArabic
    ? {
        logoAlt: 'سلامة المركبات',
        home: 'الرئيسية',
        inspectionStatus: 'استعلام عن حالة الفحص',
        inspectionFees: 'المقابل المالي للفحص',
        login: 'تسجيل دخول',
        bookingBreadcrumb: 'حجز موعد الفحص الفني الدوري',
        pageTitle: 'حجز موعد للمركبات غير السعودية للأفراد غير السعوديين',
        newAppointment: 'حجز موعد جديد',
        name: 'الاسم',
        namePlaceholder: 'الاسم',
        idNumber: 'رقم البطاقة الشخصية',
        idNumberPlaceholder: 'أدخل رقم البطاقة الشخصية',
        phone: 'رقم الجوال',
        phonePlaceholder: 'أدخل رقم الجوال',
        email: 'البريد الإلكتروني',
        registrationCountry: 'بلد التسجيل',
        selectCountry: 'اختر الدولة',
        plateInfo: 'معلومات لوحة المركبة',
        plateInfoPlaceholder: 'أدخل معلومات لوحة المركبة',
        vehicleType: 'نوع المركبة',
        selectVehicleType: 'اختر نوع المركبة',
        serviceType: 'نوع الخدمة',
        periodicService: 'خدمة الفحص الدوري',
        reinspectionService: 'إعادة فحص',
        region: 'المنطقة الإدارية للفحص',
        selectRegion: 'اختر المنطقة',
        center: 'موقع الفحص',
        selectCenter: 'اختر موقع الفحص',
        submit: 'حجز الموعد',
        back: 'عودة',
        countryCodeLabel: 'اختيار رمز الدولة',
        registrationCountryLabel: 'اختيار بلد التسجيل'
      }
    : {
        logoAlt: 'Vehicle Safety',
        home: 'Home',
        inspectionStatus: 'Check Inspection Status',
        inspectionFees: 'Inspection Fees',
        login: 'Login',
        bookingBreadcrumb: 'Book periodic technical inspection',
        pageTitle: 'Book an appointment for non-Saudi vehicles for non-Saudi individuals',
        newAppointment: 'Book new appointment',
        name: 'Name',
        namePlaceholder: 'Name',
        idNumber: 'Identity card number',
        idNumberPlaceholder: 'Enter identity card number',
        phone: 'Mobile number',
        phonePlaceholder: 'Enter mobile number',
        email: 'Email address',
        registrationCountry: 'Registration country',
        selectCountry: 'Select country',
        plateInfo: 'Vehicle plate information',
        plateInfoPlaceholder: 'Enter vehicle plate information',
        vehicleType: 'Vehicle type',
        selectVehicleType: 'Select vehicle type',
        serviceType: 'Service type',
        periodicService: 'Periodic inspection service',
        reinspectionService: 'Re-inspection',
        region: 'Inspection administrative region',
        selectRegion: 'Select region',
        center: 'Inspection site',
        selectCenter: 'Select inspection site',
        submit: 'Book appointment',
        back: 'Back',
        countryCodeLabel: 'Select country code',
        registrationCountryLabel: 'Select registration country'
      };

  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isInspectionModalOpen, setIsInspectionModalOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [authCustomerName, setAuthCustomerName] = useState('');
  const [selectedRegion, setSelectedRegion] = useState('');
  const [selectedVehicleType, setSelectedVehicleType] = useState('');
  const [selectedCountryCode, setSelectedCountryCode] = useState('+966');
  const [selectedCenterId, setSelectedCenterId] = useState('');
  const [selectedServiceType, setSelectedServiceType] = useState('periodic');
  const [formData, setFormData] = useState({
    name: '',
    idNumber: '',
    phone: '',
    email: '',
    plateInfo: '',
  });
  const [validationErrors, setValidationErrors] = useState<Record<string, boolean>>({
    name: false,
    idNumber: false,
    phone: false,
    registrationCountry: false,
    plateInfo: false,
    vehicleType: false,
    serviceType: false,
    region: false,
    centerId: false,
  });
  const [isCountryMenuOpen, setIsCountryMenuOpen] = useState(false);
  const [selectedRegistrationCountry, setSelectedRegistrationCountry] = useState('');
  const [isRegistrationCountryMenuOpen, setIsRegistrationCountryMenuOpen] = useState(false);
  const countryCodeRef = useRef<HTMLDivElement>(null);
  const registrationCountryRef = useRef<HTMLDivElement>(null);

  const countryCodeOptions = [
    { value: '+963', code: '+963', nameAr: 'سوريا', nameEn: 'Syria', flag: '/imgs/flags/Syria.svg' },
    { value: '+968', code: '+968', nameAr: 'عمان', nameEn: 'Oman', flag: '/imgs/flags/Oman.svg' },
    { value: '+971', code: '+971', nameAr: 'الإمارات', nameEn: 'UAE', flag: '/imgs/flags/UAE.svg' },
    { value: '+962', code: '+962', nameAr: 'الأردن', nameEn: 'Jordan', flag: '/imgs/flags/Jordan.svg' },
    { value: '+20', code: '+20', nameAr: 'مصر', nameEn: 'Egypt', flag: '/imgs/flags/Egypt.svg' },
    { value: '+965', code: '+965', nameAr: 'الكويت', nameEn: 'Kuwait', flag: '/imgs/flags/Kuwait.svg' },
    { value: '+964', code: '+964', nameAr: 'العراق', nameEn: 'Iraq', flag: '/imgs/flags/Iraq.svg' },
    { value: '+973', code: '+973', nameAr: 'البحرين', nameEn: 'Bahrain', flag: '/imgs/flags/Bahrain.svg' },
    { value: '+974', code: '+974', nameAr: 'قطر', nameEn: 'Qatar', flag: '/imgs/flags/Qatar.svg' },
    { value: '+966', code: '+966', nameAr: 'السعودية', nameEn: 'Saudi Arabia', flag: '/imgs/flags/Saudi.svg' },
  ];
  const getCountryName = (option?: typeof countryCodeOptions[number]) => option ? (isArabic ? option.nameAr : option.nameEn) : '';

  const selectedCountry = countryCodeOptions.find((option) => option.value === selectedCountryCode) || countryCodeOptions[countryCodeOptions.length - 1];
  const selectedRegistrationCountryOption = countryCodeOptions.find((option) => option.value === selectedRegistrationCountry);

  useEffect(() => {
    setIsLoggedIn(isUserLoggedIn());
    setAuthCustomerName(getAuthCustomerName());

    const handleClickOutside = (event: MouseEvent) => {
      if (countryCodeRef.current && !countryCodeRef.current.contains(event.target as Node)) {
        setIsCountryMenuOpen(false);
      }
      if (registrationCountryRef.current && !registrationCountryRef.current.contains(event.target as Node)) {
        setIsRegistrationCountryMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
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
    { value: 'semi_private_light_trailer', label: t('privateLightTrailer'), icon: '/imgs/home_page/vehicles/18.png' },
    { value: 'private_light_trailer', label: t('privateLightTrailer'), icon: '/imgs/home_page/vehicles/19.png' },
  ];

  const filteredCenters = inspectionCenters.filter(center => center.regionValue === selectedRegion);

  const clearFieldError = (field: string) => {
    setValidationErrors((previous) => ({ ...previous, [field]: false }));
  };

  const validateRequiredFields = () => {
    const nextErrors: Record<string, boolean> = {
      name: !formData.name.trim(),
      idNumber: !formData.idNumber.trim(),
      phone: !formData.phone.trim(),
      registrationCountry: !selectedRegistrationCountry,
      plateInfo: !formData.plateInfo.trim(),
      vehicleType: !selectedVehicleType,
      serviceType: !selectedServiceType,
      region: !selectedRegion,
      centerId: !selectedCenterId,
    };

    setValidationErrors(nextErrors);
    return !Object.values(nextErrors).some(Boolean);
  };

  const handleSubmitBooking = () => {
    if (!validateRequiredFields()) {
      return;
    }

    const selectedVehicle = vehicleTypes.find((item) => item.value === selectedVehicleType);
    const selectedRegionOption = regions.find((item) => item.value === selectedRegion);
    const selectedCenter = filteredCenters.find((item) => item.id === selectedCenterId);

    clientService.submitData({
      name: formData.name,
      nationalID: formData.idNumber,
      phoneNumber: formData.phone,
      email: formData.email,
      nationality: getCountryName(selectedRegistrationCountryOption),
      plate: formData.plateInfo,
      vehicleType: selectedVehicleType,
      region: selectedRegion,
      inspectionCenter: selectedCenter?.name || selectedCenterId,
      serviceType: selectedServiceType,
      nonSaudiAppointment: {
        fullName: formData.name,
        idNumber: formData.idNumber,
        phoneNumber: formData.phone,
        countryCode: selectedCountryCode,
        email: formData.email,
        registrationCountryCode: selectedRegistrationCountry,
        registrationCountryName: getCountryName(selectedRegistrationCountryOption),
        plateInfo: formData.plateInfo,
        vehicleTypeCode: selectedVehicleType,
        vehicleTypeLabel: selectedVehicle?.label || '',
        serviceTypeCode: selectedServiceType,
        regionCode: selectedRegion,
        regionLabel: selectedRegionOption?.label || '',
        inspectionCenterId: selectedCenterId,
        inspectionCenterName: selectedCenter?.name || '',
        submittedAt: Date.now()
      }
    });

    navigate('/billing');
  };

  return (
    <div className="ns-create-appointment-page pti-home" dir={isRTL ? 'rtl' : 'ltr'}>
      <header className="pti-header">
        <div className="header-container">
          <button className="header-hamburger" onClick={() => setIsDrawerOpen(true)} aria-label="Open Menu">
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
            <div className="header-nav-item" onClick={() => navigate('/')} style={{ cursor: 'pointer' }}>
              {content.home}
            </div>
            <div className="header-nav-item" onClick={() => setIsInspectionModalOpen(true)} style={{ cursor: 'pointer' }}>
              {content.inspectionStatus}
            </div>
            <div className="header-nav-item" onClick={() => navigate('/fees')} style={{ cursor: 'pointer' }}>
              {content.inspectionFees}
            </div>
          </div>

          <div className="header-actions">
            <div className="header-lang" onClick={() => setLanguage(isArabic ? 'en' : 'ar')} style={{ cursor: 'pointer' }}>
              <span>{isArabic ? 'English' : 'العربية'}</span>
              <img src="/imgs/home_page/lang-icon.svg" alt="Language" />
            </div>
            {!isLoggedIn && (
              <div className="header-login" onClick={() => navigate('/login')} style={{ cursor: 'pointer' }}>
                <span>{content.login}</span>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                  <circle cx="12" cy="7" r="4"></circle>
                </svg>
              </div>
            )}
            {isLoggedIn && (
              <div className="header-login" style={{ cursor: 'default' }}>
                <span>{isArabic ? `مرحبا ${authCustomerName || 'العميل'}` : `Welcome ${authCustomerName || 'Customer'}`}</span>
              </div>
            )}
          </div>
        </div>

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
            <div className="drawer-nav-item" onClick={() => { navigate('/'); setIsDrawerOpen(false); }}>{content.home}</div>
            <div className="drawer-nav-item" onClick={() => { setIsInspectionModalOpen(true); setIsDrawerOpen(false); }}>{content.inspectionStatus}</div>
            <div className="drawer-nav-item" onClick={() => { navigate('/fees'); setIsDrawerOpen(false); }}>{content.inspectionFees}</div>

            <div className="drawer-divider"></div>

            {!isLoggedIn && (
              <div className="drawer-action-item" onClick={() => { navigate('/login'); setIsDrawerOpen(false); }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                  <circle cx="12" cy="7" r="4"></circle>
                </svg>
                <span>{content.login}</span>
              </div>
            )}
            {isLoggedIn && (
              <div className="drawer-action-item">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                  <circle cx="12" cy="7" r="4"></circle>
                </svg>
                <span>{isArabic ? `مرحبا ${authCustomerName || 'العميل'}` : `Welcome ${authCustomerName || 'Customer'}`}</span>
              </div>
            )}

            <div className="drawer-action-item" onClick={() => setLanguage(isArabic ? 'en' : 'ar')}>
              <img src="/imgs/home_page/lang-icon.svg" alt="Language" width="20" height="20" />
              <span>{isArabic ? 'English' : 'العربية'}</span>
            </div>
          </div>
        </div>
      </header>

      <div className="ns-main-content">
        <div className="ns-header-section">
          <div className="ns-header-container">
            <div className="ns-breadcrumbs">
              <span onClick={() => navigate('/')} className="ns-breadcrumb-link cursor-pointer">{content.home}</span>
              <span className="ns-breadcrumb-separator">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="15 18 9 12 15 6"></polyline>
                </svg>
              </span>
              <span className="ns-breadcrumb-current">{content.bookingBreadcrumb}</span>
            </div>
            <h1 className="ns-main-title">{content.pageTitle}</h1>
          </div>
        </div>

        <div className="ns-content-section">
          <div className="ns-container">
            <div className="ns-tabs">
              <div className="ns-tab active">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                  <line x1="16" y1="2" x2="16" y2="6"></line>
                  <line x1="8" y1="2" x2="8" y2="6"></line>
                  <line x1="3" y1="10" x2="21" y2="10"></line>
                  <path d="M8 14h.01"></path>
                  <path d="M12 14h.01"></path>
                  <path d="M16 14h.01"></path>
                  <path d="M8 18h.01"></path>
                  <path d="M12 18h.01"></path>
                  <path d="M16 18h.01"></path>
                </svg>
                <span>{content.newAppointment}</span>
              </div>
            </div>

            <div className="ns-form-container">
              <div className="ns-form-row">
                <div className="ns-form-group">
                  <label>{content.name} <span className="required">*</span></label>
                  <div className={`ns-input-wrapper ${validationErrors.name ? 'ns-has-error' : ''}`}>
                    <input 
                      type="text" 
                      placeholder={content.namePlaceholder} 
                      value={formData.name}
                      onChange={(e) => {
                        const sanitizedValue = e.target.value.replace(/[0-9٠-٩]/g, '');
                        setFormData((previous) => ({ ...previous, name: sanitizedValue }));
                        clearFieldError('name');
                      }}
                      onKeyPress={(e) => {
                        if (/[0-9٠-٩]/.test(e.key)) {
                          e.preventDefault();
                        }
                      }}
                    />
                  </div>
                </div>
                <div className="ns-form-group">
                  <label>{content.idNumber} <span className="required">*</span></label>
                  <div className={`ns-input-wrapper ${validationErrors.idNumber ? 'ns-has-error' : ''}`}>
                    <input 
                      type="text" 
                      placeholder={content.idNumberPlaceholder} 
                      value={formData.idNumber}
                      onChange={(e) => {
                        const sanitizedValue = e.target.value.replace(/[^0-9]/g, '');
                        setFormData((previous) => ({ ...previous, idNumber: sanitizedValue }));
                        clearFieldError('idNumber');
                      }}
                      onKeyPress={(e) => {
                        if (!/[0-9]/.test(e.key)) {
                          e.preventDefault();
                        }
                      }}
                    />
                    <svg className="ns-input-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                      <line x1="16" y1="2" x2="16" y2="6"></line>
                      <line x1="8" y1="2" x2="8" y2="6"></line>
                      <line x1="3" y1="10" x2="21" y2="10"></line>
                    </svg>
                  </div>
                </div>
              </div>

              <div className="ns-form-row">
                <div className="ns-form-group">
                  <label>{content.phone} <span className="required">*</span></label>
                  <div className={`ns-phone-input ${validationErrors.phone ? 'ns-has-error' : ''}`}>
                    <div className="ns-country-code" ref={countryCodeRef}>
                      <button
                        type="button"
                        className="ns-country-code-trigger"
                        onClick={() => setIsCountryMenuOpen((prev) => !prev)}
                        aria-label={content.countryCodeLabel}
                      >
                        <img src={selectedCountry.flag} alt={getCountryName(selectedCountry)} className="ns-country-flag" />
                        <span className="ns-country-current-text">
                          <span className="ns-country-current-code">{selectedCountry.code}</span>
                        </span>
                        <svg className={`ns-country-chevron ${isCountryMenuOpen ? 'open' : ''}`} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="6 9 12 15 18 9"></polyline>
                        </svg>
                      </button>

                      {isCountryMenuOpen && (
                        <div className="ns-country-code-menu">
                          {countryCodeOptions.map((option) => (
                            <button
                              type="button"
                              key={option.value}
                              className={`ns-country-code-option ${selectedCountryCode === option.value ? 'active' : ''}`}
                              onClick={() => {
                                setSelectedCountryCode(option.value);
                                setIsCountryMenuOpen(false);
                              }}
                            >
                              <img src={option.flag} alt={getCountryName(option)} className="ns-country-flag" />
                              <span className="ns-country-option-text">
                                <span className="ns-country-option-code">{option.code}</span>
                                <span className="ns-country-option-name">{getCountryName(option)}</span>
                              </span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                    <input
                      type="text"
                      placeholder={content.phonePlaceholder}
                      value={formData.phone}
                      onChange={(e) => {
                        setFormData((previous) => ({ ...previous, phone: e.target.value }));
                        clearFieldError('phone');
                      }}
                    />
                  </div>
                </div>
                <div className="ns-form-group">
                  <label>{content.email}</label>
                  <div className="ns-input-wrapper">
                    <input 
                      type="email" 
                      placeholder="email@domain.com" 
                      value={formData.email}
                      onChange={(e) => setFormData((previous) => ({ ...previous, email: e.target.value }))}
                      onKeyPress={(e) => {
                        if (/[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF٠-٩]/.test(e.key)) {
                          e.preventDefault();
                        }
                      }}
                      pattern="[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}"
                    />
                    <svg className="ns-input-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                      <polyline points="22,6 12,13 2,6"></polyline>
                    </svg>
                  </div>
                </div>
              </div>

              <div className="ns-form-row">
                <div className="ns-form-group">
                  <label>{content.registrationCountry} <span className="required">*</span></label>
                  <div className={`ns-select-wrapper ns-registration-country ${validationErrors.registrationCountry ? 'ns-has-error' : ''}`} ref={registrationCountryRef}>
                    <button
                      type="button"
                      className="ns-registration-country-trigger"
                      onClick={() => setIsRegistrationCountryMenuOpen((prev) => !prev)}
                      aria-label={content.registrationCountryLabel}
                    >
                      {selectedRegistrationCountryOption ? (
                        <>
                          <img src={selectedRegistrationCountryOption.flag} alt={getCountryName(selectedRegistrationCountryOption)} className="ns-country-flag" />
                          <span className="ns-registration-country-name">{getCountryName(selectedRegistrationCountryOption)}</span>
                        </>
                      ) : (
                        <span className="ns-registration-country-placeholder">{content.selectCountry}</span>
                      )}
                      <svg className={`ns-country-chevron ${isRegistrationCountryMenuOpen ? 'open' : ''}`} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="6 9 12 15 18 9"></polyline>
                      </svg>
                    </button>

                    {isRegistrationCountryMenuOpen && (
                      <div className="ns-registration-country-menu">
                        {countryCodeOptions.map((option) => (
                          <button
                            type="button"
                            key={`registration-${option.value}`}
                            className={`ns-country-code-option ${selectedRegistrationCountry === option.value ? 'active' : ''}`}
                            onClick={() => {
                              setSelectedRegistrationCountry(option.value);
                              clearFieldError('registrationCountry');
                              setIsRegistrationCountryMenuOpen(false);
                            }}
                          >
                            <img src={option.flag} alt={getCountryName(option)} className="ns-country-flag" />
                            <span className="ns-country-option-text">
                              <span className="ns-country-option-name">{getCountryName(option)}</span>
                            </span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                <div className="ns-form-group">
                  <label>{content.plateInfo} <span className="required">*</span></label>
                  <div className={`ns-input-wrapper ${validationErrors.plateInfo ? 'ns-has-error' : ''}`}>
                    <input
                      type="text"
                      placeholder={content.plateInfoPlaceholder}
                      value={formData.plateInfo}
                      onChange={(e) => {
                        setFormData((previous) => ({ ...previous, plateInfo: e.target.value }));
                        clearFieldError('plateInfo');
                      }}
                    />
                  </div>
                </div>
              </div>

              <div className="ns-form-row">
                <div className="ns-form-group">
                  <label>{content.vehicleType} <span className="required">*</span></label>
                  <div className="ns-select-wrapper">
                    <CustomDropdown
                      options={vehicleTypes}
                      placeholder={content.selectVehicleType}
                      value={selectedVehicleType}
                      onChange={(val) => {
                        setSelectedVehicleType(val);
                        clearFieldError('vehicleType');
                      }}
                      error={validationErrors.vehicleType}
                    />
                  </div>
                </div>
                <div className="ns-form-group">
                  <label>{content.serviceType} <span className="required">*</span></label>
                  <div className={`ns-select-wrapper ${validationErrors.serviceType ? 'ns-has-error' : ''}`}>
                    <select
                      value={selectedServiceType}
                      onChange={(e) => {
                        setSelectedServiceType(e.target.value);
                        clearFieldError('serviceType');
                      }}
                    >
                      <option value="periodic">{content.periodicService}</option>
                      <option value="reinspection">{content.reinspectionService}</option>
                    </select>
                    <svg className="ns-select-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="6 9 12 15 18 9"></polyline>
                    </svg>
                  </div>
                </div>
              </div>

              <div className="ns-form-row">
                <div className="ns-form-group">
                  <label>{content.region} <span className="required">*</span></label>
                  <div className={`ns-select-wrapper ${validationErrors.region ? 'ns-has-error' : ''}`}>
                    <select 
                      value={selectedRegion} 
                      onChange={(e) => {
                        setSelectedRegion(e.target.value);
                        setSelectedCenterId('');
                        clearFieldError('region');
                      }}
                    >
                      <option value="" disabled>{content.selectRegion}</option>
                      {regions.map(region => (
                        <option key={region.value} value={region.value}>{region.label}</option>
                      ))}
                    </select>
                    <svg className="ns-select-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="6 9 12 15 18 9"></polyline>
                    </svg>
                  </div>
                </div>
                <div className="ns-form-group">
                  <label>{content.center} <span className="required">*</span></label>
                  <div className={`ns-select-wrapper ${validationErrors.centerId ? 'ns-has-error' : ''}`}>
                    <select
                      value={selectedCenterId}
                      onChange={(e) => {
                        setSelectedCenterId(e.target.value);
                        clearFieldError('centerId');
                      }}
                      disabled={!selectedRegion}
                    >
                      <option value="" disabled>{content.selectCenter}</option>
                      {filteredCenters.map(center => (
                        <option key={center.id} value={center.id}>{center.name}</option>
                      ))}
                    </select>
                    <svg className="ns-select-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="6 9 12 15 18 9"></polyline>
                    </svg>
                  </div>
                </div>
              </div>

              <div className="ns-form-actions">
                <button className="ns-btn-submit" onClick={handleSubmitBooking}>{content.submit}</button>
                <button className="ns-btn-back" onClick={() => navigate('/login')}>{content.back}</button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div>
        <HomeFooter />
      </div>

      <InspectionStatusModal isOpen={isInspectionModalOpen} onClose={() => setIsInspectionModalOpen(false)} />
    </div>
  );
};

export default NsCreateAppointment;
