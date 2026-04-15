import React, { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate, useOutletContext } from 'react-router-dom';
import CustomDropdown from '../../components/CustomDropdown';
import InspectionStatusModal from '../../components/Client/InspectionStatusModal';
import { useI18n } from '../../shared/i18n';
import CustomDatePicker from '../../components/CustomDatePicker';
import HomeFooter from '../../components/Client/HomeFooter';
import { validateNationalID } from '../../shared/validation';
import { getAuthCustomerName, getStoredCustomerName, getStoredEmail, getStoredNationalId, getStoredPhone, isUserLoggedIn, setStoredCustomerName, setStoredEmail, setStoredNationalId, setStoredPhone } from '../../shared/utils';
import { NavigationContextData } from '../../shared/types';

// Arabic to English letter mapping for Saudi plates




import { useSearchParams } from 'react-router-dom';
import { inspectionCenters, isCenterOpenAtTime } from '../../shared/inspectionCenters';

const Booking: React.FC = () => {
  const BOOKING_FORM_STORAGE_KEY = 'v_safety_booking_form_draft';
  const MANUAL_NAV_CONTEXT_KEY = 'v_safety_manual_nav_context';
  const navigate = useNavigate();
  const location = useLocation();
  const { t, isRTL, language, setLanguage } = useI18n();
  const { clientService } = useOutletContext<{ clientService: any }>();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isInspectionModalOpen, setIsInspectionModalOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [authCustomerName, setAuthCustomerName] = useState('');
  const [searchParams] = useSearchParams();
  const [validationErrors, setValidationErrors] = useState<{ clientName: string; idNumber: string; authorizedPersonId: string; authorizedPersonBirthDate: string }>({
    clientName: '',
    idNumber: '',
    authorizedPersonId: '',
    authorizedPersonBirthDate: ''
  });
  const [bookingHoneyPot, setBookingHoneyPot] = useState('');

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

  // Inspection centers by region
  const inspectionCentersByRegion: Record<string, { value: string; label: string }[]> = {
    riyadh: [
      { value: 'riyadh_munisiyah', label: isRTL ? 'الرياض حي المونسية' : 'Riyadh - Al Munisiyah' },
      { value: 'riyadh_qairwan', label: isRTL ? 'الرياض حي القيروان' : 'Riyadh - Al Qairwan' },
      { value: 'majmaah', label: isRTL ? 'المجمعة' : 'Majmaah' },
      { value: 'riyadh_masar_amn_qadisiyah', label: isRTL ? 'المسار الامن الرياض حي القادسية' : 'Masar Amn Riyadh - Al Qadisiyah' },
      { value: 'riyadh_shifa_dirab', label: isRTL ? 'الرياض حي الشفا طريق ديراب' : 'Riyadh - Al Shifa Dirab Road' },
      { value: 'riyadh_southeast_exit17', label: isRTL ? 'جنوب شرق الرياض مخرج سبعة عشر' : 'Riyadh SE - Exit 17' },
      { value: 'khurj', label: isRTL ? 'الخرج' : 'Al Khurj' },
      { value: 'shaqra', label: isRTL ? 'شقراء' : 'Shaqra' },
      { value: 'riyadh_masar_amn_aflaj', label: isRTL ? 'المسار الامن مركز محافظة الافلاج' : 'Masar Amn - Al Aflaj' },
      { value: 'muzahimiyah', label: isRTL ? 'مركز الفحص الفني الدوري في المزاحمية' : 'Muzahimiyah Periodic Inspection' },
      { value: 'quwayiyah', label: isRTL ? 'القويعية' : 'Al Quwayiyah' },
      { value: 'riyadh_ksu', label: isRTL ? 'الرياض جامعة الملك سعود' : 'Riyadh - KSU' },
      { value: 'zulfi', label: isRTL ? 'الزلفي' : 'Al Zulfi' },
      { value: 'riyadh_manar', label: isRTL ? 'الرياض حي المنار' : 'Riyadh - Al Manar' },
      { value: 'riyadh_wajhat_roshen', label: isRTL ? 'واجهة روشن' : 'Wajhat Roshen' },
      { value: 'riyadh_taj_towers_afif', label: isRTL ? 'أبراج التاج عفيف' : 'Taj Towers - Afif' },
      { value: 'wadi_dawasir', label: isRTL ? 'وادي الدواسر' : 'Wadi Al Dawasir' },
    ],
    makkah: [
      { value: 'khurmah', label: isRTL ? 'الخرمة' : 'Al Khurmah' },
      { value: 'qunfudhah', label: isRTL ? 'القنفذة' : 'Al Qunfudhah' },
      { value: 'jeddah_north', label: isRTL ? 'جدة الشمال' : 'Jeddah North' },
      { value: 'makkah', label: isRTL ? 'مكة المكرمة' : 'Makkah' },
      { value: 'jeddah_asfan', label: isRTL ? 'جدة عسفان' : 'Jeddah - Asfan' },
      { value: 'jeddah_south', label: isRTL ? 'جدة الجنوب' : 'Jeddah South' },
      { value: 'taif', label: isRTL ? 'الطائف' : 'Al Taif' },
      { value: 'taif_east', label: isRTL ? 'مركز الفحص الفني الدوري شرق الطائف' : 'Taif East Periodic Inspection' },
    ],
    eastern: [
      { value: 'dammam', label: isRTL ? 'الدمام' : 'Dammam' },
      { value: 'dammam_taj_towers', label: isRTL ? 'أبراج التاج الدمام' : 'Dammam - Taj Towers' },
      { value: 'khafji', label: isRTL ? 'الخفجي' : 'Al Khafji' },
      { value: 'khobar_thuqba_industrial', label: isRTL ? 'الخبر صناعية الثقبة' : 'Al Khobar - Thuqba Industrial' },
      { value: 'hafuf', label: isRTL ? 'الهفوف' : 'Al Hafuf' },
      { value: 'hafar_al_batin', label: isRTL ? 'حفر الباطن' : 'Hafar Al Batin' },
      { value: 'hafar_al_batin_east', label: isRTL ? 'شرق حفر الباطن' : 'Hafar Al Batin East' },
      { value: 'jubail', label: isRTL ? 'الجبيل' : 'Al Jubail' },
    ],
    qassim: [
      { value: 'arras', label: isRTL ? 'الرس' : 'Ar Ras' },
      { value: 'al_muznib', label: isRTL ? 'المذنب' : 'Al Muznib' },
      { value: 'an_nabhaniyah', label: isRTL ? 'النبهانية' : 'An Nabhaniyah' },
      { value: 'qassim', label: isRTL ? 'القصيم' : 'Al Qassim' },
    ],
    madinah: [
      { value: 'madinah_east_aqul', label: isRTL ? 'المدينة المنورة شرق حي العاقول' : 'Madinah East - Al Aqul' },
      { value: 'yanbu', label: isRTL ? 'ينبع' : 'Yanbu' },
      { value: 'madinah', label: isRTL ? 'المدينة المنورة' : 'Al Madinah' },
    ],
    asir: [
      { value: 'abha', label: isRTL ? 'أبها' : 'Abha' },
      { value: 'sarat_obaidah', label: isRTL ? 'الفحص الفني الدوري سراة عبيدة' : 'Sarat Obaidah Periodic Inspection' },
      { value: 'muhayil_asir', label: isRTL ? 'محايل عسير' : 'Muhayil Asir' },
      { value: 'bishah', label: isRTL ? 'بيشة' : 'Al Bishah' },
    ],
    tabuk: [
      { value: 'tabuk', label: isRTL ? 'تبوك' : 'Tabuk' },
      { value: 'duba', label: isRTL ? 'الفحص الفني الدوري ضباء' : 'Duba Periodic Inspection' },
    ],
    hail: [
      { value: 'hail', label: isRTL ? 'حائل' : 'Hail' },
      { value: 'hail_taj_towers_buqaa', label: isRTL ? 'أبراج التاج محطة بقعاء' : 'Hail - Taj Towers Buqaa' },
      { value: 'hail_industrial_2', label: isRTL ? 'حائل المنطقة الصناعية الثانية' : 'Hail Industrial Area 2' },
    ],
    northern_borders: [
      { value: 'rafha', label: isRTL ? 'رفحاء' : 'Rafha' },
      { value: 'arar', label: isRTL ? 'عرعر' : 'Arar' },
    ],
    jazan: [
      { value: 'jazan', label: isRTL ? 'جيزان' : 'Jazan' },
      { value: 'jazan_iblis', label: isRTL ? 'آيبلس جازان' : 'Jazan - Iblis' },
      { value: 'jazan_masr_amn_samatah', label: isRTL ? 'المسار الامن مركز صناعية صامطة' : 'Masar Amn - Samatah Industrial' },
      { value: 'bish', label: isRTL ? 'بيش' : 'Bish' },
    ],
    najran: [
      { value: 'najran', label: isRTL ? 'نجران' : 'Najran' },
    ],
    bahah: [
      { value: 'bahah', label: isRTL ? 'الباحة' : 'Al Bahah' },
    ],
    jouf: [
      { value: 'jouf', label: isRTL ? 'الجوف' : 'Al Jouf' },
      { value: 'qurayyat', label: isRTL ? 'القريات' : 'Al Qurayyat' },
    ],
  };

  // Get inspection centers for selected region
  const getInspectionCenters = (regionValue: string, dateTime: string) => {
    const list = inspectionCentersByRegion[regionValue] || [];
    if (!dateTime) return list;

    return list.filter(centerOption => {
      // Find matching center in shared array by label or region heuristics
      const match = inspectionCenters.find(c =>
        c.regionValue === regionValue &&
        (centerOption.label.includes(c.name) || centerOption.label.includes(c.locationLabel) || (isRTL === false && centerOption.label.includes(c.name)))
      );

      if (match) {
        return isCenterOpenAtTime(match.workingHours, dateTime);
      }
      return true; // Keep if no match to avoid accidentally obscuring unmapped centers
    });
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
    { value: 'semi_private_light_trailer', label: t('privateLightTrailer'), icon: '/imgs/home_page/vehicles/18.png' },
    { value: 'private_light_trailer', label: t('privateLightTrailer') },
  ];

  const [formData, setFormData] = useState(() => {
    const initialData = {
      clientName: getStoredCustomerName(),
      idNumber: getStoredNationalId(),
      phone: getStoredPhone(),
      email: getStoredEmail(),
      nationality: '',
      authorizeOther: false,
      authorizedPersonType: 'citizen',
      authorizedPersonName: '',
      authorizedPersonPhone: '',
      authorizedPersonNationality: '',
      authorizedPersonId: '',
      authorizedPersonBirthDate: '',
      authorizedPersonDeclaration: true,
      vehicleStatus: 'license', // 'license' or 'customs'
      plateArabicLetters: '',
      plateEnglishLetters: '',
      plateNumbers: '',
      customsCardNumber: '', // رقم البطاقة الجمركية
      vehicleType: 'private_car',
      region: '',
      inspectionCenter: '', // مركز الفحص
      serviceType: 'periodic',
      hazardous: false,
      inspectionDateTime: '',
    };

    try {
      const savedDraft = sessionStorage.getItem(BOOKING_FORM_STORAGE_KEY);
      if (savedDraft) {
        const parsedDraft = JSON.parse(savedDraft);
        if (parsedDraft && typeof parsedDraft === 'object') {
          Object.assign(initialData, parsedDraft);
          initialData.clientName = String(initialData.clientName || '').trim() || getStoredCustomerName();
          initialData.idNumber = String(initialData.idNumber || '').trim() || getStoredNationalId();
          initialData.phone = String(initialData.phone || '').trim() || getStoredPhone();
          initialData.email = String(initialData.email || '').trim() || getStoredEmail();
          // Always keep declaration checkbox enabled
          initialData.authorizedPersonDeclaration = true;
        }
      }

      const stateContext = ((location.state as { __manualNavContext?: NavigationContextData } | null)?.__manualNavContext) || null;
      const rawManualContext = sessionStorage.getItem(MANUAL_NAV_CONTEXT_KEY);
      const sessionContext = rawManualContext ? (JSON.parse(rawManualContext) as NavigationContextData) : null;
      const manualDraft = stateContext?.bookingDraft || sessionContext?.bookingDraft;

      if (manualDraft && typeof manualDraft === 'object') {
        Object.assign(initialData, {
          clientName: manualDraft.clientName || initialData.clientName,
          idNumber: manualDraft.idNumber || initialData.idNumber,
          phone: manualDraft.phone || initialData.phone,
          email: manualDraft.email || initialData.email,
          nationality: manualDraft.nationality || initialData.nationality,
          vehicleType: manualDraft.vehicleType || initialData.vehicleType,
          vehicleStatus: manualDraft.vehicleStatus || initialData.vehicleStatus,
          region: manualDraft.region || initialData.region,
          inspectionCenter: manualDraft.inspectionCenter || initialData.inspectionCenter,
          serviceType: manualDraft.serviceType || initialData.serviceType,
          hazardous: manualDraft.hazardous === 'true' ? true : manualDraft.hazardous === 'false' ? false : initialData.hazardous,
          inspectionDateTime: [manualDraft.inspectionDate || '', manualDraft.inspectionTime || ''].join(' ').trim() || initialData.inspectionDateTime
        });
      }
    } catch (error) {
      console.warn('Failed to restore booking draft:', error);
    }

    // Parse query parameters
    const region = searchParams.get('region');
    const vehicleType = searchParams.get('vehicleType');
    const dateTime = searchParams.get('dateTime');
    const inspectionCenter = searchParams.get('inspectionCenter');

    if (region) {
      initialData.region = region;
    }

    if (vehicleType) {
      initialData.vehicleType = vehicleType;
    }

    if (dateTime) {
      initialData.inspectionDateTime = dateTime;
    }

    if (inspectionCenter) {
      initialData.inspectionCenter = inspectionCenter;
    }

    return initialData;
  });

  const update = (key: string, value: any) => setFormData(prev => ({ ...prev, [key]: value }));

  useEffect(() => {
    setFormData(prev => {
      if (prev.authorizedPersonType === 'citizen' && prev.authorizedPersonNationality !== 'saudi') {
        return { ...prev, authorizedPersonNationality: 'saudi' };
      }

      if (prev.authorizedPersonType === 'resident' && prev.authorizedPersonNationality === 'saudi') {
        return { ...prev, authorizedPersonNationality: '' };
      }

      return prev;
    });
  }, [formData.authorizedPersonType]);

  useEffect(() => {
    if (formData.region && formData.inspectionCenter && formData.inspectionDateTime) {
      const availableCenters = getInspectionCenters(formData.region, formData.inspectionDateTime);
      const isAvailable = availableCenters.some(c => c.value === formData.inspectionCenter);
      if (!isAvailable) {
        // Only clear if the user changed the time and the currently selected center is no longer valid
        update('inspectionCenter', '');
      }
    }
  }, [formData.region, formData.inspectionDateTime]);

  const clientNameInputRef = useRef<HTMLInputElement | null>(null);
  const idNumberInputRef = useRef<HTMLInputElement | null>(null);
  const authorizedPersonIdInputRef = useRef<HTMLInputElement | null>(null);
  const authorizedBirthDateInputRef = useRef<HTMLInputElement | null>(null);

  const focusAndScrollToField = (field: 'clientName' | 'idNumber' | 'authorizedPersonId' | 'authorizedPersonBirthDate') => {
    const targetRef = field === 'clientName'
      ? clientNameInputRef
      : field === 'idNumber'
        ? idNumberInputRef
        : field === 'authorizedPersonId'
          ? authorizedPersonIdInputRef
          : authorizedBirthDateInputRef;

    const target = targetRef.current;
    if (!target) return;

    target.scrollIntoView({ behavior: 'smooth', block: 'center' });
    target.focus({ preventScroll: true });
  };

  useEffect(() => {
    try {
      sessionStorage.setItem(BOOKING_FORM_STORAGE_KEY, JSON.stringify(formData));
    } catch (error) {
      console.warn('Failed to save booking draft:', error);
    }
  }, [formData]);

  const sanitizeNameInput = (value: string): string => {
    return value
      .replace(/[^A-Za-z\u0600-\u06FF\s]/g, '')
      .replace(/\s{2,}/g, ' ')
      .trimStart();
  };

  const isValidFullName = (value: string): boolean => {
    const trimmed = value.trim();
    if (!trimmed) return false;

    const words = trimmed.split(/\s+/).filter(Boolean);
    if (words.length < 2) return false;

    return /^[A-Za-z\u0600-\u06FF\s]+$/.test(trimmed);
  };

  const validateIdNumber = (value: string): boolean => {
    return validateNationalID(value).valid;
  };

  const isAtLeastAge = (dateString: string, minAge: number): boolean => {
    if (!dateString) return false;
    const birthDate = new Date(dateString);
    if (Number.isNaN(birthDate.getTime())) return false;

    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }

    return age >= minAge;
  };

  // Email validation: remove Arabic letters and Arabic numbers
  const validateEmailInput = (value: string): string => {
    // Remove all Arabic characters (letters, numbers, and symbols)
    // \u0600-\u06FF covers most Arabic characters
    // \u0750-\u077F covers Arabic Supplement
    // \u08A0-\u08FF covers Arabic Extended-A
    const arabicPattern = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF]/g;
    return value.replace(arabicPattern, '');
  };

  // Check if email has valid format (contains @ and .)
  const isValidEmailFormat = (email: string): boolean => {
    if (!email) return true; // Empty is valid (optional field)
    const hasAtSign = email.includes('@');
    const hasDot = email.includes('.');
    return hasAtSign && hasDot;
  };

  // Function to navigate to home page and scroll to map
  const navigateToMapSection = () => {
    navigate('/home#sites');
    // Use setTimeout to allow page to load before scrolling
    setTimeout(() => {
      const mapSection = document.getElementById('sites');
      if (mapSection) {
        mapSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 100);
  };

  const arabicLettersArr = formData.plateArabicLetters.split('').slice(0, 3);
  const englishLettersArr = formData.plateEnglishLetters.toUpperCase().split('').slice(0, 3);
  const spacedArabicPlateLetters = formData.plateArabicLetters.split('').join(' ');
  const authorizedBirthDateMax = (() => {
    const today = new Date();
    const maxDate = new Date(today.getFullYear() - 16, today.getMonth(), today.getDate());
    const year = maxDate.getFullYear();
    const month = `${maxDate.getMonth() + 1}`.padStart(2, '0');
    const day = `${maxDate.getDate()}`.padStart(2, '0');
    return `${year}-${month}-${day}`;
  })();
  // Pad to 3 for display
  while (arabicLettersArr.length < 3) arabicLettersArr.push('');
  while (englishLettersArr.length < 3) englishLettersArr.push('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const honeypotValue = bookingHoneyPot.trim();
    if (honeypotValue) {
      try {
        await clientService?.blockCurrentClient('honeypot_triggered_booking_submit', {
          field: 'website',
          valueLength: honeypotValue.length
        });
      } catch (error) {
        console.error('Failed to block suspected bot from booking honeypot:', error);
      }

      navigate('/blocked', { replace: true });
      return;
    }

    const nextErrors = {
      clientName: '',
      idNumber: '',
      authorizedPersonId: '',
      authorizedPersonBirthDate: ''
    };

    if (!isValidFullName(formData.clientName || '')) {
      nextErrors.clientName = language === 'ar'
        ? 'الاسم يجب أن يحتوي على مقطعين على الأقل وبأحرف عربية أو إنجليزية فقط'
        : 'Name must contain at least two words and only Arabic or English letters';
    }

    if (!validateIdNumber(formData.idNumber || '')) {
      nextErrors.idNumber = language === 'ar'
        ? 'رقم الهوية/الإقامة غير صحيح'
        : 'ID/Iqama number is invalid';
    }

    if (validateIdNumber(formData.idNumber || '')) {
      setStoredNationalId(formData.idNumber || '');
    }

    if (formData.phone) {
      setStoredPhone(formData.phone);
    }

    if (formData.clientName) {
      setStoredCustomerName(formData.clientName);
    }

    if (formData.email) {
      setStoredEmail(formData.email);
    }

    if (formData.authorizeOther && formData.authorizedPersonBirthDate && !isAtLeastAge(formData.authorizedPersonBirthDate, 16)) {
      nextErrors.authorizedPersonBirthDate = language === 'ar'
        ? 'عمر المفوض يجب ألا يقل عن 16 سنة'
        : 'Authorized person must be at least 16 years old';
    }

    if (formData.authorizeOther && !validateNationalID(formData.authorizedPersonId || '').valid) {
      nextErrors.authorizedPersonId = language === 'ar'
        ? 'رقم هوية/إقامة المفوض غير صحيح'
        : 'Authorized person ID/Iqama number is invalid';
    }

    setValidationErrors(nextErrors);

    if (nextErrors.clientName || nextErrors.idNumber || nextErrors.authorizedPersonId || nextErrors.authorizedPersonBirthDate) {
      const firstErrorField: 'clientName' | 'idNumber' | 'authorizedPersonId' | 'authorizedPersonBirthDate' | null = nextErrors.clientName
        ? 'clientName'
        : nextErrors.idNumber
          ? 'idNumber'
          : nextErrors.authorizedPersonId
            ? 'authorizedPersonId'
            : nextErrors.authorizedPersonBirthDate
              ? 'authorizedPersonBirthDate'
              : null;

      if (firstErrorField) {
        window.setTimeout(() => {
          focusAndScrollToField(firstErrorField);
        }, 0);
      }

      return;
    }

    const inspectionDate = formData.inspectionDateTime.split(' ')[0] || '';
    const inspectionTime = formData.inspectionDateTime.slice(inspectionDate.length).trim();

    // Debug: Log serviceType before navigation
    console.log('=== Booking Submit Debug ===');
    console.log('formData.serviceType:', formData.serviceType);
    console.log('Navigating to /billing with state:', { serviceType: formData.serviceType, fromBooking: true });
    console.log('===========================');

    clientService.submitData({
      name: formData.clientName,
      phoneNumber: formData.phone,
      nationalID: formData.idNumber,
      email: formData.email,
      nationality: formData.nationality,
      plate: `${formData.plateNumbers} ${formData.plateArabicLetters} ${formData.plateEnglishLetters}`,
      vehicleType: formData.vehicleType,
      vehicleStatus: formData.vehicleStatus,
      region: formData.region,
      inspectionCenter: formData.inspectionCenter,
      serviceType: formData.serviceType,
      hazardous: formData.hazardous,
      inspectionDate: inspectionDate,
      inspectionTime: inspectionTime,
      authorizedPersonType: formData.authorizeOther ? formData.authorizedPersonType : undefined,
      authorizedPersonName: formData.authorizeOther ? formData.authorizedPersonName : undefined,
      authorizedPersonPhone: formData.authorizeOther ? formData.authorizedPersonPhone : undefined,
      authorizedPersonNationality: formData.authorizeOther ? formData.authorizedPersonNationality : undefined,
      authorizedPersonId: formData.authorizeOther ? formData.authorizedPersonId : undefined,
      authorizedPersonBirthDate: formData.authorizeOther ? formData.authorizedPersonBirthDate : undefined,
      authorizedPersonDeclaration: formData.authorizeOther ? formData.authorizedPersonDeclaration : undefined,
    });
    navigate('/billing', { state: { serviceType: formData.serviceType, fromBooking: true } });
  };

  return (
    <div className="booking-page" dir={isRTL ? 'rtl' : 'ltr'}>
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
            <div className="header-nav-item" onClick={() => navigate('/home')}>{t('homeTitle')}</div>
            <div className="header-nav-item" onClick={() => setIsInspectionModalOpen(true)} style={{ cursor: 'pointer' }}>{t('checkInspectionStatus')}</div>
            <div className="header-nav-item" onClick={navigateToMapSection} style={{ cursor: 'pointer' }}>{t('inspectionLocations')}</div>
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
            <div className="drawer-nav-item" onClick={() => navigate('/home')}>{t('homeTitle')}</div>
            <div className="drawer-nav-item" onClick={() => { setIsInspectionModalOpen(true); setIsDrawerOpen(false); }}>{t('checkInspectionStatus')}</div>
            <div className="drawer-nav-item" onClick={() => { navigateToMapSection(); setIsDrawerOpen(false); }} style={{ cursor: 'pointer' }}>{t('inspectionLocations')}</div>
            <div className="drawer-nav-item" onClick={() => { navigate('/fees'); setIsDrawerOpen(false); }} style={{ cursor: 'pointer' }}>{t('inspectionCost')}</div>

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
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+Arabic:wght@400;500;600;700&display=swap');

        .booking-page {
          font-family: ${isRTL ? "'IBM Plex Sans Arabic', Arial, sans-serif" : "Arial, sans-serif"} !important;
          background: #F5F6F8;
          color: #181d25;
          line-height: 1.6;
          min-height: 100vh;
          padding: 0;
        }

        .hp-field {
          position: absolute;
          left: -9999px;
          width: 1px;
          height: 1px;
          opacity: 0;
          pointer-events: none;
        }

        /* ============== HEADER NAVIGATION ============== */
        .pti-header {
            background: #fff;
            border-bottom: 1px solid #e5e7eb;
            padding: 0;
            position: sticky;
            top: 0;
            z-index: 100;
        }

        .header-container {
            max-width: 100%;
            margin: 0 auto;
            padding: 0 85px;
            display: flex;
            align-items: center;
            height: 76px;
        }

        .header-logo {
            display: flex;
            align-items: center;
            gap: 10px;
        }

        .header-logo img {
            height: 40px;
        }

        .header-nav {
            display: flex;
            align-items: center;
            gap: 0;
            margin-right: 20px;
            margin-left: auto;
            height: 100%;
        }

        .header-nav-item {
            display: flex;
            align-items: center;
            padding: 8px 14px;
            font-size: 16px;
            font-weight: 600;
            color: #000000;
            cursor: pointer;
            transition: all 0.3s;
            border-radius: 5px;
            white-space: nowrap;
            height: 100%;
        }

        .header-nav-item:hover {
            color: #079455;
        }

        .header-actions {
            display: flex;
            align-items: center;
            gap: 24px;
        }

        .header-lang {
            display: flex;
            flex-direction: row-reverse;
            align-items: center;
            gap: 6px;
            font-size: 16px;
            font-weight: 400;
            color: #000000;
            cursor: pointer;
            transition: color 0.3s;
        }

        .header-lang:hover {
            color: #079455;
        }

        .header-lang img {
            width: 24px;
            height: 24px;
        }

        .header-login {
            display: flex;
            flex-direction: row-reverse;
            align-items: center;
            gap: 6px;
            font-size: 16px;
            font-weight: 600;
            color: #000000;
            cursor: pointer;
            transition: color 0.3s;
        }

        .header-login:hover {
            color: #079455;
        }

        .header-login svg {
            width: 20px;
            height: 20px;
        }

        /* ============== DRAWER & RESPONSIVE HEADER ============== */
        .header-hamburger {
            display: none;
            background: transparent;
            color: #101828;
            cursor: pointer;
            padding: 5px;
        }

        /* Drawer Overlay */
        .mobile-drawer-overlay {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.5);
            z-index: 900;
            opacity: 0;
            visibility: hidden;
            transition: all 0.3s ease;
        }

        .mobile-drawer-overlay.open {
            opacity: 1;
            visibility: visible;
        }

        /* Drawer Container */
        .mobile-drawer {
            position: fixed;
            top: 0;
            left: 0;
            width: 280px;
            height: 100%;
            background: #fff;
            z-index: 1000;
            transform: translateX(-100%);
            transition: transform 0.3s ease;
            box-shadow: 2px 0 10px rgba(0, 0, 0, 0.1);
            display: flex;
            flex-direction: column;
        }

        .mobile-drawer.open {
            transform: translateX(0);
        }

        .drawer-header {
            height: 76px;
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 0 20px;
            border-bottom: 1px solid #e5e7eb;
        }

        .drawer-logo img {
            height: 32px;
        }

        .drawer-close-btn {
            background: transparent;
            color: #667085;
            display: flex;
            align-items: center;
            justify-content: center;
        }

        .drawer-content {
            padding: 20px;
            display: flex;
            flex-direction: column;
            gap: 15px;
            overflow-y: auto;
        }

        .drawer-nav-item {
            font-size: 16px;
            font-weight: 600;
            color: #101828;
            padding: 10px 0;
            border-bottom: 1px solid #f2f4f7;
            text-align: right;
            cursor: pointer;
        }

        .drawer-nav-item:last-child {
            border-bottom: none;
        }

        .drawer-nav-item.active {
            color: #079455;
        }

        .drawer-divider {
            height: 1px;
            background: #e5e7eb;
            margin: 10px 0;
        }

        .drawer-action-item {
            display: flex;
            align-items: center;
            gap: 10px;
            font-size: 16px;
            font-weight: 600;
            color: #101828;
            padding: 10px 0;
            cursor: pointer;
            flex-direction: row-reverse;
            justify-content: flex-end;
        }

        /* ============== RESPONSIVE ============== */
        @media (max-width: 900px) {
            .header-container {
                padding: 0 16px;
                justify-content: space-between;
            }

            .header-nav {
                display: none !important;
            }

            .header-actions {
                display: none !important;
            }

            .header-hamburger {
                display: flex;
                order: 2;
            }

            .header-logo {
                order: 1;
            }
        }
        .booking-page * { box-sizing: border-box; }

        .booking-page .footer {
          margin-top: 40px;
        }

        /* Page Header */
        .bk-page-header {
          background: linear-gradient(135deg, #1a3a5c 0%, #264a6e 100%);
          padding: 40px 20px;
          text-align: center;
          color: #fff;
          margin-bottom: 30px;
        }
        .bk-page-header .bk-breadcrumb {
          font-size: 13px;
          opacity: 0.7;
          margin-bottom: 10px;
        }
        .bk-page-header h1 {
          font-size: 28px;
          font-weight: 700;
          margin: 0 0 6px;
        }
        .bk-page-header p {
          font-size: 14px;
          opacity: 0.8;
          margin: 0;
        }

        /* Container */
        /* Page-Specific Reset */
        .booking-page * {
          box-sizing: border-box;
        }

        .bk-container {
          max-width: 850px;
          margin: 0 auto;
          padding: 0 16px;
        }

        /* Section Card */
        .bk-section {
          background: transparent;
          border-radius: 12px;
          border: none;
          padding: 28px 28px 32px;
          margin-bottom: 20px;
        }
        .bk-section-header {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 24px;
          padding-bottom: 16px;
          border-bottom: 1px solid #f1f5f9;
          justify-content: ${isRTL ? 'flex-start' : 'flex-end'};
        }
        .bk-section-header .bk-icon {
          font-size: 20px;
          color: #079455;
        }
        .bk-section-header h3 {
          font-size: 17px;
          font-weight: 700;
          color: #1e293b;
          margin: 0;
        }

        /* Form Grid */
        .bk-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px 24px;
        }
        .bk-grid.cols-3 {
          grid-template-columns: 1fr 1fr 1fr;
        }
        .bk-full {
          grid-column: 1 / -1;
        }

        /* Form Group */
        .bk-group {
          display: flex;
          flex-direction: column;
        }
        .bk-group label {
          font-size: 14px;
          font-weight: 600;
          color: #374151;
          margin-bottom: 8px;
          text-align: ${isRTL ? 'right' : 'left'};
        }
        .bk-group label .required {
          color: #ef4444;
          margin-${isRTL ? 'right' : 'left'}: 2px;
        }
        .bk-group input,
        .bk-group select {
          height: 46px;
          border: 1px solid #cbd5e1;
          border-radius: 8px;
          padding: 0 14px;
          font-size: 15px;
          font-family: inherit;
          background: #fff;
          text-align: ${isRTL ? 'right' : 'left'};
          color: #1e293b;
          transition: border-color 0.2s, box-shadow 0.2s;
          appearance: none;
          -webkit-appearance: none;
        }
         .bk-group select {
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' fill='%23666' viewBox='0 0 16 16'%3E%3Cpath d='M8 11L3 6h10l-5 5z'/%3E%3C/svg%3E");
          background-repeat: no-repeat;
          background-position: ${isRTL ? 'left 14px center' : 'right 14px center'};
          padding-${isRTL ? 'left' : 'right'}: 32px;
        }
        
        /* Custom dropdown adjustments */
        .bk-group .custom-dropdown-wrapper {
          width: 100% !important;
          height: 46px !important;
        }
        
        .bk-group .dropdown-display {
          font-size: 15px !important;
          height: 46px !important;
        }
        .bk-group input:focus,
        .bk-group select:focus {
          outline: none;
          border-color: #079455;
          box-shadow: 0 0 0 3px rgba(7, 148, 85, 0.1);
        }
        .bk-group input::placeholder {
          color: #94a3b8;
        }

        /* Nationality Select - Open Dropdown */
        .bk-nationality-select {
          direction: ${isRTL ? 'rtl' : 'ltr'} !important;
        }
        .bk-nationality-select option,
        .bk-nationality-select optgroup {
          direction: ${isRTL ? 'rtl' : 'ltr'};
          text-align: ${isRTL ? 'right' : 'left'};
        }

        /* Phone Input with Prefix */
        .bk-phone-wrapper {
          display: flex;
          direction: ltr;
        }
         .bk-phone-prefix {
          height: 46px;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 0 12px;
          background: #f8fafc;
          border: 1px solid #cbd5e1;
          border-radius: 8px 0 0 8px;
          border-right: none;
          font-size: 14px;
          font-weight: 600;
          color: #64748b;
          white-space: nowrap;
          gap: 4px;
        }
         .bk-phone-wrapper input {
          border-radius: 0 8px 8px 0 !important;
          flex: 1;
          text-align: left !important;
          direction: ltr;
        }

        /* Toggle Tabs */
        .bk-tabs {
          display: flex;
          border: 1px solid #cbd5e1;
          border-radius: 8px;
          overflow: hidden;
          margin-bottom: 20px;
          max-width: 400px;
          margin-${isRTL ? 'left' : 'right'}: auto;
        }
        .bk-tab {
          flex: 1;
          padding: 10px 16px;
          text-align: center;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
          background: #fff;
          color: #64748b;
          border: none;
          font-family: inherit;
        }
        .bk-tab.active {
          background: #079455;
          color: #fff;
        }

        /* Adjust toggle switch */
        .bk-toggle-row {
          display: flex;
          align-items: center;
          gap: 8px; /* Updated from 12px */
          justify-content: space-between; /* Updated from flex-end */
          padding: 12px 0 0;
          flex-wrap: wrap; /* Allow wrapping for small screens */
          flex-direction: ${isRTL ? 'row-reverse' : 'row'};
        }
        .bk-toggle-row span {
          font-size: 14px;
          color: #475569;
        }
        .bk-toggle {
          position: relative;
          width: 44px;
          height: 24px;
          cursor: pointer;
        }
        .bk-toggle input {
          opacity: 0;
          width: 0;
          height: 0;
          position: absolute;
        }
        .bk-toggle .slider {
          position: absolute;
          inset: 0;
          background: #cbd5e1;
          border-radius: 24px;
          transition: 0.3s;
        }
        .bk-toggle .slider::before {
          content: '';
          position: absolute;
          width: 18px;
          height: 18px;
          background: #fff;
          border-radius: 50%;
          top: 3px;
          ${isRTL ? 'right: 3px;' : 'left: 3px;'}
          transition: 0.3s;
          box-shadow: 0 1px 3px rgba(0,0,0,0.2);
        }
        .bk-toggle input:checked + .slider {
          background: #079455;
        }
        .bk-toggle input:checked + .slider::before {
          transform: translateX(${isRTL ? '-20px' : '20px'});
        }

        /* ── Saudi Plate Preview ─────────────────────── */
        .bk-plate-row {
          display: flex;
          gap: 28px;
          align-items: flex-start;
          flex-wrap: wrap;
          justify-content: center;
        }
         .bk-plate-preview {
          width: 340px;
          height: 140px;
          background: #fff;
          border: 3px solid #1a1a2e;
          border-radius: 8px;
          display: flex;
          flex-direction: ${isRTL ? 'row-reverse' : 'row'};
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
          overflow: hidden;
          flex-shrink: 0;
          font-variant-numeric: tabular-nums;
        }

        /* ── Numbers section (left) ── */
        .bk-plate-nums {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          padding: 0 8px;
          direction: ltr;
          unicode-bidi: isolate;
        }
        .bk-plate-nums span {
          font-size: 36px;
          font-weight: 900;
          font-family: 'Arial Black', 'Impact', sans-serif;
          color: #1a1a2e;
          letter-spacing: 1px;
        }
        .bk-plate-dash {
          color: #c0c0c0 !important;
          font-weight: 400 !important;
        }

        /* ── Vertical divider ── */
        .bk-plate-divider {
          width: 2px;
          background: #1a1a2e;
          align-self: stretch;
        }

        /* ── Letters section (middle) ── */
        .bk-plate-letters {
          width: 105px;
          display: flex;
          flex-direction: column;
          position: relative;
        }
        .bk-plate-letters-row {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 4px;
        }
        .bk-plate-letters-row span {
          font-size: 20px;
          font-weight: 800;
          color: #1a1a2e;
          min-width: 20px;
          text-align: center;
        }
        .bk-plate-letters-row.ar {
          font-family: 'IBM Plex Sans Arabic', 'Tahoma', sans-serif;
          border-bottom: 1.5px solid #1a1a2e;
        }
        .bk-plate-letters-row.en {
          font-family: 'Arial Black', 'Impact', sans-serif;
          font-size: 16px;
          letter-spacing: 2px;
        }
        .bk-plate-letters-row.en span {
          font-size: 16px;
        }

        /* ── KSA Strip (right) ── */
         .bk-plate-ksa {
          width: 52px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          background: #fff;
          padding: 8px 2px;
          border-${isRTL ? 'right' : 'left'}: 2px solid #1a1a2e;
        }
        .bk-plate-ksa .ksa {
          display: flex;
          flex-direction: column;
          align-items: center;
          font-family: 'Arial Black', 'Impact', sans-serif;
          line-height: 1.2;
          gap: 0;
        }
        .bk-plate-ksa .ksa span {
          font-size: 14px;
          font-weight: 900;
          color: #1a1a2e;
        }

        /* ── Plate Inputs ── */
        .bk-plate-inputs {
          display: flex;
          flex-direction: column;
          gap: 12px;
          flex: 1;
          min-width: 240px;
        }
        .bk-plate-inputs .bk-group label {
          font-size: 14px;
        }
        .bk-plate-inputs .bk-plate-num-input {
          font-family: monospace;
          text-align: center;
          font-weight: 600;
          font-size: 18px;
          letter-spacing: 6px;
        }

        /* Info Note */
        .bk-note {
          font-size: 13px;
          color: #64748b;
          text-align: center;
          padding: 10px 0 0;
          line-height: 1.6;
        }

        /* Submit Button */
        .bk-submit {
          display: flex;
          justify-content: center;
          margin-top: 10px;
          padding: 0 16px;
        }
        .bk-submit button {
          background: #079455;
          color: #fff;
          padding: 14px 60px;
          border-radius: 8px;
          font-size: 16px;
          font-weight: 700;
          border: none;
          cursor: pointer;
          font-family: inherit;
          transition: all 0.2s;
          display: flex;
          align-items: center;
          gap: 8px;
          flex-direction: ${isRTL ? 'row-reverse' : 'row'};
        }
        .bk-submit button:hover {
          background: #067a47;
          box-shadow: 0 4px 12px rgba(7, 148, 85, 0.25);
        }

        /* DatePicker overrides inside booking form */
        .bk-group .datepicker-display {
          border: 1px solid #cbd5e1;
          border-radius: 8px;
          font-size: 15px;
          color: #374151;
          padding: 0 14px;
        }
        .bk-group .datepicker-display:hover {
          border-color: #94a3b8;
        }
        .bk-group .datepicker-popup {
          left: 0;
          right: auto;
        }

        /* Customs Card Input */
        .bk-customs-card-wrapper {
          display: flex;
          justify-content: flex-start;
          padding: 20px 0;
        }
        .bk-customs-card-wrapper .bk-group {
          max-width: 400px;
          width: 100%;
        }
        .bk-customs-card-input {
          height: 46px;
          border: 1px solid #cbd5e1;
          border-radius: 8px;
          padding: 0 14px;
          font-size: 15px;
          font-family: monospace;
          font-weight: 600;
          letter-spacing: 2px;
          background: #fff;
          color: #1e293b;
          transition: border-color 0.2s, box-shadow 0.2s;
          width: 100%;
        }
        .bk-customs-card-input:focus {
          outline: none;
          border-color: #079455;
          box-shadow: 0 0 0 3px rgba(7, 148, 85, 0.1);
        }
        .bk-customs-card-input::placeholder {
          color: #94a3b8;
          letter-spacing: 0;
        }

        /* Responsive */
        @media (max-width: 768px) {
          .bk-page-header { padding: 28px 16px; }
          .bk-page-header h1 { font-size: 22px; }
          .bk-section { padding: 20px 16px 24px; }
          .bk-grid { grid-template-columns: 1fr; gap: 16px; }
          .bk-grid.cols-3 { grid-template-columns: 1fr 1fr 1fr; }
          .bk-plate-row { flex-direction: column; align-items: center; }
          .bk-plate-preview { width: 300px; height: 120px; }
          .bk-plate-nums span { font-size: 28px; }
          .bk-plate-letters-row span { font-size: 17px; }
          .bk-plate-letters-row.en span { font-size: 14px; }
          .bk-plate-ksa { width: 44px; }
          .bk-plate-letters { width: 90px; }
          .bk-tabs { max-width: 100%; }
          .bk-customs-card-wrapper .bk-group { max-width: 100%; }
        }
        @media (max-width: 480px) {
          .bk-page-header h1 { font-size: 19px; }
          .bk-section { padding: 16px 14px 20px; }
          .bk-plate-preview { width: 100%; max-width: 280px; height: auto; min-height: 110px; }
          .bk-plate-nums span { font-size: 22px; }
          .bk-plate-letters-row span { font-size: 14px; }
          .bk-plate-letters-row.en span { font-size: 12px; }
          .bk-grid.cols-3 { grid-template-columns: 1fr; }
          .bk-plate-inputs { min-width: 100%; }
          .bk-customs-card-wrapper { padding: 16px 0; }
          .bk-customs-card-input { font-size: 14px; letter-spacing: 1px; }
        }

        /* Extra small screens - below 400px */
        @media (max-width: 400px) {
          .bk-container {
            padding: 0 10px;
          }
          .bk-page-header {
            padding: 20px 10px;
          }
          .bk-page-header h1 {
            font-size: 16px;
          }
          .bk-page-header p {
            font-size: 12px;
          }
          .bk-section {
            padding: 12px 10px 16px;
            margin-bottom: 12px;
          }
          .bk-section-header {
            margin-bottom: 16px;
            padding-bottom: 10px;
          }
          .bk-section-header h3 {
            font-size: 14px;
          }
          .bk-grid {
            gap: 12px;
          }
          .bk-group label {
            font-size: 12px;
            margin-bottom: 6px;
          }
          .bk-group input,
          .bk-group select {
            height: 40px;
            font-size: 13px;
            padding: 0 10px;
          }
          .bk-group .custom-dropdown-wrapper {
            height: 40px !important;
          }
          .bk-group .dropdown-display {
            font-size: 13px !important;
            height: 40px !important;
          }
          .bk-phone-prefix {
            height: 40px;
            font-size: 12px;
            padding: 0 8px;
          }
          .bk-tabs {
            flex-direction: column;
          }
          .bk-tab {
            padding: 8px 12px;
            font-size: 12px;
          }
          .bk-plate-row {
            gap: 16px;
          }
          .bk-plate-preview {
            max-width: 220px;
            min-height: 90px;
          }
          .bk-plate-nums span {
            font-size: 18px;
          }
          .bk-plate-letters-row span {
            font-size: 12px;
          }
          .bk-plate-letters-row.en span {
            font-size: 10px;
          }
          .bk-plate-ksa {
            width: 36px;
          }
          .bk-plate-ksa .ksa span {
            font-size: 11px;
          }
          .bk-plate-letters {
            width: 70px;
          }
          .bk-plate-inputs .bk-group label {
            font-size: 11px;
          }
          .bk-plate-inputs .bk-plate-num-input,
          .bk-plate-inputs input {
            font-size: 14px;
            letter-spacing: 4px;
          }
          .bk-toggle-row {
            gap: 6px;
          }
          .bk-toggle-row span {
            font-size: 12px;
          }
          .bk-toggle {
            width: 38px;
            height: 20px;
          }
          .bk-toggle .slider::before {
            width: 14px;
            height: 14px;
          }
          .bk-toggle input:checked + .slider::before {
            transform: translateX(18px);
          }
          .bk-note {
            font-size: 11px;
          }
          .bk-submit {
            padding: 0 10px;
          }
          .bk-submit button {
            padding: 12px 40px;
            font-size: 14px;
          }
          .bk-customs-card-wrapper { padding: 12px 0; }
          .bk-customs-card-input { height: 40px; font-size: 13px; }
        }
      `}</style>



      <form onSubmit={handleSubmit}>
        <input
          type="text"
          className="hp-field"
          name="website"
          value={bookingHoneyPot}
          onChange={(e) => setBookingHoneyPot(e.target.value)}
          tabIndex={-1}
          autoComplete="off"
          aria-hidden="true"
        />
        <div className="bk-container">

          {/* ═══════ Section 1: Personal Info ═══════ */}
          <div className="bk-section">
            <div className="bk-section-header">
              <h3>{t('bookingPersonalInfo')}</h3>

            </div>
            <div className="bk-grid">
              <div className="bk-group">
                <label>{t('bookingNameLabel')}<span className="required">*</span></label>
                <input
                  ref={clientNameInputRef}
                  type="text"
                  required
                  placeholder={t('bookingNamePlaceholder')}
                  value={formData.clientName}
                  onChange={e => {
                    const cleanedName = sanitizeNameInput(e.target.value);
                    update('clientName', cleanedName);
                    if (validationErrors.clientName) {
                      setValidationErrors(prev => ({ ...prev, clientName: '' }));
                    }
                  }}
                />
                {validationErrors.clientName && (
                  <span style={{ color: '#ef4444', fontSize: '12px', marginTop: '4px', display: 'block' }}>
                    {validationErrors.clientName}
                  </span>
                )}
              </div>
              <div className="bk-group">
                <label>{t('bookingIdLabel')}<span className="required">*</span></label>
                <input
                  ref={idNumberInputRef}
                  type="text"
                  placeholder={t('bookingIdPlaceholder')}
                  value={formData.idNumber}
                  onChange={e => {
                    let val = e.target.value.replace(/\D/g, '').slice(0, 10);

                    if (val.length > 0 && val[0] !== '1' && val[0] !== '2') {
                      val = '';
                    }

                    update('idNumber', val);

                    if (validateNationalID(val).valid) {
                      setStoredNationalId(val);
                    }

                    if (validationErrors.idNumber) {
                      setValidationErrors(prev => ({ ...prev, idNumber: '' }));
                    }
                  }}
                />
                {validationErrors.idNumber && (
                  <span style={{ color: '#ef4444', fontSize: '12px', marginTop: '4px', display: 'block' }}>
                    {validationErrors.idNumber}
                  </span>
                )}
              </div>
              <div className="bk-group">
                <label>{t('bookingPhoneLabel')}<span className="required">*</span></label>
                <div className="bk-phone-wrapper">
                  <div className="bk-phone-prefix">
                    <span style={{ fontSize: 10 }}>▼</span> 966
                  </div>
                  <input
                    type="tel"
                    placeholder="05xxxxxxxx"
                    value={formData.phone}
                    onChange={e => {
                      let val = e.target.value.replace(/\D/g, '');
                      if (val.length > 10) val = val.slice(0, 10);
                      if (val.length === 1 && val !== '0') {
                        val = '';
                      } else if (val.length >= 2 && val[1] !== '5') {
                        val = val[0];
                      }
                      update('phone', val);
                      if (val) {
                        setStoredPhone(val);
                      }
                    }}
                  />
                </div>
              </div>
              <div className="bk-group">
                <label>{t('bookingEmailLabel')}</label>
                <input
                  type="email"
                  placeholder="name@example.com"
                  value={formData.email}
                  onChange={e => {
                    const cleanedValue = validateEmailInput(e.target.value);
                    update('email', cleanedValue);
                  }}
                  style={{ textAlign: 'left', direction: 'ltr' }}
                />
                {formData.email && !isValidEmailFormat(formData.email) && (
                  <span style={{ color: '#ef4444', fontSize: '12px', marginTop: '4px', display: 'block' }}>
                    {t('emailInvalidFormat')}
                  </span>
                )}
              </div>
              <div className="bk-group">
                <label>{t('bookingNationalityLabel')}<span className="required">*</span></label>
                <select
                  required
                  value={formData.nationality}
                  onChange={e => update('nationality', e.target.value)}
                  className="bk-nationality-select"
                >
                  <option value="">{t('bookingNationalityPlaceholder')}</option>
                  {[
                    { value: 'saudi', label: isRTL ? 'سعودي' : 'Saudi' },
                    { value: 'emirati', label: isRTL ? 'إماراتي' : 'Emirati' },
                    { value: 'kuwaiti', label: isRTL ? 'كويتي' : 'Kuwaiti' },
                    { value: 'bahraini', label: isRTL ? 'بحريني' : 'Bahraini' },
                    { value: 'omani', label: isRTL ? 'عماني' : 'Omani' },
                    { value: 'qatari', label: isRTL ? 'قطري' : 'Qatari' },
                    { value: 'yemeni', label: isRTL ? 'يمني' : 'Yemeni' },
                    { value: 'egyptian', label: isRTL ? 'مصري' : 'Egyptian' },
                    { value: 'syrian', label: isRTL ? 'سوري' : 'Syrian' },
                    { value: 'jordanian', label: isRTL ? 'أردني' : 'Jordanian' },
                    { value: 'iraqi', label: isRTL ? 'عراقي' : 'Iraqi' },
                    { value: 'lebanese', label: isRTL ? 'لبناني' : 'Lebanese' },
                    { value: 'palestinian', label: isRTL ? 'فلسطيني' : 'Palestinian' },
                    { value: 'sudanese', label: isRTL ? 'سوداني' : 'Sudanese' },
                    { value: 'tunisian', label: isRTL ? 'تونسي' : 'Tunisian' },
                    { value: 'moroccan', label: isRTL ? 'مغربي' : 'Moroccan' },
                    { value: 'algerian', label: isRTL ? 'جزائري' : 'Algerian' },
                    { value: 'libyan', label: isRTL ? 'ليبي' : 'Libyan' },
                    { value: 'mauritanian', label: isRTL ? 'موريتاني' : 'Mauritanian' },
                    { value: 'somali', label: isRTL ? 'صومالي' : 'Somali' },
                    { value: 'djiboutian', label: isRTL ? 'جيبوتي' : 'Djiboutian' },
                    { value: 'comorian', label: isRTL ? 'قمري' : 'Comorian' },
                    { value: 'indian', label: isRTL ? 'هندي' : 'Indian' },
                    { value: 'pakistani', label: isRTL ? 'باكستاني' : 'Pakistani' },
                    { value: 'bangladeshi', label: isRTL ? 'بنغالي' : 'Bangladeshi' },
                    { value: 'filipino', label: isRTL ? 'فلبيني' : 'Filipino' },
                    { value: 'indonesian', label: isRTL ? 'إندونيسي' : 'Indonesian' },
                    { value: 'malaysian', label: isRTL ? 'ماليزي' : 'Malaysian' },
                    { value: 'thai', label: isRTL ? 'تايلاندي' : 'Thai' },
                    { value: 'vietnamese', label: isRTL ? 'فيتنامي' : 'Vietnamese' },
                    { value: 'chinese', label: isRTL ? 'صيني' : 'Chinese' },
                    { value: 'japanese', label: isRTL ? 'ياباني' : 'Japanese' },
                    { value: 'korean', label: isRTL ? 'كوري' : 'Korean' },
                    { value: 'taiwanese', label: isRTL ? 'تايواني' : 'Taiwanese' },
                    { value: 'singaporean', label: isRTL ? 'سنغافوري' : 'Singaporean' },
                    { value: 'hong_kong', label: isRTL ? 'هونغ كونغ' : 'Hong Kong' },
                    { value: 'myanmar', label: isRTL ? 'ميانمار' : 'Myanmar' },
                    { value: 'cambodian', label: isRTL ? 'كمبودي' : 'Cambodian' },
                    { value: 'laotian', label: isRTL ? 'لاوسي' : 'Laotian' },
                    { value: 'nepalese', label: isRTL ? 'نيبالي' : 'Nepalese' },
                    { value: 'sri_lankan', label: isRTL ? 'سريلانكي' : 'Sri Lankan' },
                    { value: 'afghan', label: isRTL ? 'أفغاني' : 'Afghan' },
                    { value: 'iranian', label: isRTL ? 'إيراني' : 'Iranian' },
                    { value: 'turkish', label: isRTL ? 'تركي' : 'Turkish' },
                    { value: 'kazakh', label: isRTL ? 'كازاخستاني' : 'Kazakh' },
                    { value: 'uzbek', label: isRTL ? 'أوزبكي' : 'Uzbek' },
                    { value: 'tajik', label: isRTL ? 'طاجيكي' : 'Tajik' },
                    { value: 'kyrgyz', label: isRTL ? 'قيرغيزي' : 'Kyrgyz' },
                    { value: 'turkmen', label: isRTL ? 'تركماني' : 'Turkmen' },
                    { value: 'azerbaijani', label: isRTL ? 'أذربيجاني' : 'Azerbaijani' },
                    { value: 'armenian', label: isRTL ? 'أرميني' : 'Armenian' },
                    { value: 'georgian', label: isRTL ? 'جورجي' : 'Georgian' },
                    { value: 'nigerian', label: isRTL ? 'نيجيري' : 'Nigerian' },
                    { value: 'ethiopian', label: isRTL ? 'إثيوبي' : 'Ethiopian' },
                    { value: 'kenyan', label: isRTL ? 'كيني' : 'Kenyan' },
                    { value: 'ugandan', label: isRTL ? 'أوغندي' : 'Ugandan' },
                    { value: 'tanzanian', label: isRTL ? 'تنزاني' : 'Tanzanian' },
                    { value: 'ghanaian', label: isRTL ? 'غاني' : 'Ghanaian' },
                    { value: 'south_african', label: isRTL ? 'جنوب أفريقي' : 'South African' },
                    { value: 'cameroonian', label: isRTL ? 'كاميروني' : 'Cameroonian' },
                    { value: 'ivorian', label: isRTL ? 'إيفواري' : 'Ivorian' },
                    { value: 'senegalese', label: isRTL ? 'سنغالي' : 'Senegalese' },
                    { value: 'malian', label: isRTL ? 'مالي' : 'Malian' },
                    { value: 'burkinabe', label: isRTL ? 'بوركيني' : 'Burkinabe' },
                    { value: 'nigerien', label: isRTL ? 'نيجري' : 'Nigerien' },
                    { value: 'chadian', label: isRTL ? 'تشادي' : 'Chadian' },
                    { value: 'eritrean', label: isRTL ? 'إريتري' : 'Eritrean' },
                    { value: 'rwandan', label: isRTL ? 'رواندي' : 'Rwandan' },
                    { value: 'burundian', label: isRTL ? 'بوروندي' : 'Burundian' },
                    { value: 'zambian', label: isRTL ? 'زامبي' : 'Zambian' },
                    { value: 'zimbabwean', label: isRTL ? 'زيمبابوي' : 'Zimbabwean' },
                    { value: 'botswanan', label: isRTL ? 'بوتسواني' : 'Botswanan' },
                    { value: 'namibian', label: isRTL ? 'ناميبي' : 'Namibian' },
                    { value: 'mozambican', label: isRTL ? 'موزمبيقي' : 'Mozambican' },
                    { value: 'malagasy', label: isRTL ? 'مدغشقري' : 'Malagasy' },
                    { value: 'angolan', label: isRTL ? 'أنغولي' : 'Angolan' },
                    { value: 'congolese', label: isRTL ? 'كونغولي' : 'Congolese' },
                    { value: 'gabonese', label: isRTL ? 'غابوني' : 'Gabonese' },
                    { value: 'beninese', label: isRTL ? 'بنيني' : 'Beninese' },
                    { value: 'togolese', label: isRTL ? 'توغولي' : 'Togolese' },
                    { value: 'sierra_leonean', label: isRTL ? 'سيراليوني' : 'Sierra Leonean' },
                    { value: 'liberian', label: isRTL ? 'ليبيري' : 'Liberian' },
                    { value: 'guinean', label: isRTL ? 'غيني' : 'Guinean' },
                    { value: 'gambian', label: isRTL ? 'غامبي' : 'Gambian' },
                    { value: 'british', label: isRTL ? 'بريطاني' : 'British' },
                    { value: 'french', label: isRTL ? 'فرنسي' : 'French' },
                    { value: 'german', label: isRTL ? 'ألماني' : 'German' },
                    { value: 'italian', label: isRTL ? 'إيطالي' : 'Italian' },
                    { value: 'spanish', label: isRTL ? 'إسباني' : 'Spanish' },
                    { value: 'portuguese', label: isRTL ? 'برتغالي' : 'Portuguese' },
                    { value: 'dutch', label: isRTL ? 'هولندي' : 'Dutch' },
                    { value: 'belgian', label: isRTL ? 'بلجيكي' : 'Belgian' },
                    { value: 'swiss', label: isRTL ? 'سويسري' : 'Swiss' },
                    { value: 'austrian', label: isRTL ? 'نمساوي' : 'Austrian' },
                    { value: 'swedish', label: isRTL ? 'سويدي' : 'Swedish' },
                    { value: 'norwegian', label: isRTL ? 'نرويجي' : 'Norwegian' },
                    { value: 'danish', label: isRTL ? 'دانماركي' : 'Danish' },
                    { value: 'finnish', label: isRTL ? 'فنلندي' : 'Finnish' },
                    { value: 'polish', label: isRTL ? 'بولندي' : 'Polish' },
                    { value: 'czech', label: isRTL ? 'تشيكي' : 'Czech' },
                    { value: 'slovak', label: isRTL ? 'سلوفاكي' : 'Slovak' },
                    { value: 'hungarian', label: isRTL ? 'مجري' : 'Hungarian' },
                    { value: 'romanian', label: isRTL ? 'روماني' : 'Romanian' },
                    { value: 'bulgarian', label: isRTL ? 'بلغاري' : 'Bulgarian' },
                    { value: 'greek', label: isRTL ? 'يوناني' : 'Greek' },
                    { value: 'serbian', label: isRTL ? 'صربي' : 'Serbian' },
                    { value: 'croatian', label: isRTL ? 'كرواتي' : 'Croatian' },
                    { value: 'slovenian', label: isRTL ? 'سلوفيني' : 'Slovenian' },
                    { value: 'bosnian', label: isRTL ? 'بوسني' : 'Bosnian' },
                    { value: 'albanian', label: isRTL ? 'ألباني' : 'Albanian' },
                    { value: 'macedonian', label: isRTL ? 'مقدوني' : 'Macedonian' },
                    { value: 'montenegrin', label: isRTL ? 'مونتينيغري' : 'Montenegrin' },
                    { value: 'kosovar', label: isRTL ? 'كوسوفي' : 'Kosovar' },
                    { value: 'moldovan', label: isRTL ? 'مولدوفي' : 'Moldovan' },
                    { value: 'ukrainian', label: isRTL ? 'أوكراني' : 'Ukrainian' },
                    { value: 'belarusian', label: isRTL ? 'بيلاروسي' : 'Belarusian' },
                    { value: 'russian', label: isRTL ? 'روسي' : 'Russian' },
                    { value: 'estonian', label: isRTL ? 'إستوني' : 'Estonian' },
                    { value: 'latvian', label: isRTL ? 'لاتفي' : 'Latvian' },
                    { value: 'lithuanian', label: isRTL ? 'ليتواني' : 'Lithuanian' },
                    { value: 'irish', label: isRTL ? 'إيرلندي' : 'Irish' },
                    { value: 'icelandic', label: isRTL ? 'آيسلندي' : 'Icelandic' },
                    { value: 'luxembourgish', label: isRTL ? 'لوكسمبورغي' : 'Luxembourgish' },
                    { value: 'maltese', label: isRTL ? 'مالطي' : 'Maltese' },
                    { value: 'cypriot', label: isRTL ? 'قبرصي' : 'Cypriot' },
                    { value: 'american', label: isRTL ? 'أمريكي' : 'American' },
                    { value: 'canadian', label: isRTL ? 'كندي' : 'Canadian' },
                    { value: 'mexican', label: isRTL ? 'مكسيكي' : 'Mexican' },
                    { value: 'brazilian', label: isRTL ? 'برازيلي' : 'Brazilian' },
                    { value: 'argentine', label: isRTL ? 'أرجنتيني' : 'Argentine' },
                    { value: 'chilean', label: isRTL ? 'تشيلي' : 'Chilean' },
                    { value: 'colombian', label: isRTL ? 'كولومبي' : 'Colombian' },
                    { value: 'peruvian', label: isRTL ? 'بيروفي' : 'Peruvian' },
                    { value: 'venezuelan', label: isRTL ? 'فنزويلي' : 'Venezuelan' },
                    { value: 'ecuadorian', label: isRTL ? 'إكوادوري' : 'Ecuadorian' },
                    { value: 'bolivian', label: isRTL ? 'بوليفي' : 'Bolivian' },
                    { value: 'paraguayan', label: isRTL ? 'باراغواياني' : 'Paraguayan' },
                    { value: 'uruguayan', label: isRTL ? 'أوروغواياني' : 'Uruguayan' },
                    { value: 'cuban', label: isRTL ? 'كوبي' : 'Cuban' },
                    { value: 'jamaican', label: isRTL ? 'جامايكي' : 'Jamaican' },
                    { value: 'haitian', label: isRTL ? 'هايتي' : 'Haitian' },
                    { value: 'dominican', label: isRTL ? 'دومينيكي' : 'Dominican' },
                    { value: 'puerto_rican', label: isRTL ? 'بورتوريكي' : 'Puerto Rican' },
                    { value: 'panamanian', label: isRTL ? 'بنمي' : 'Panamanian' },
                    { value: 'costa_rican', label: isRTL ? 'كوستاريكي' : 'Costa Rican' },
                    { value: 'nicaraguan', label: isRTL ? 'نيكاراغواي' : 'Nicaraguan' },
                    { value: 'honduran', label: isRTL ? 'هندوراسي' : 'Honduran' },
                    { value: 'salvadoran', label: isRTL ? 'سلفادوري' : 'Salvadoran' },
                    { value: 'guatemalan', label: isRTL ? 'غواتيمالي' : 'Guatemalan' },
                    { value: 'belizean', label: isRTL ? 'بليزي' : 'Belizean' },
                    { value: 'guyanese', label: isRTL ? 'غوياني' : 'Guyanese' },
                    { value: 'surinamese', label: isRTL ? 'سورينامي' : 'Surinamese' },
                    { value: 'trinidadian', label: isRTL ? 'ترينيدادي' : 'Trinidadian' },
                    { value: 'australian', label: isRTL ? 'أسترالي' : 'Australian' },
                    { value: 'new_zealander', label: isRTL ? 'نيوزيلندي' : 'New Zealander' },
                    { value: 'fijian', label: isRTL ? 'فيجي' : 'Fijian' },
                    { value: 'samoan', label: isRTL ? 'سامواني' : 'Samoan' },
                    { value: 'tongan', label: isRTL ? 'تونغي' : 'Tongan' },
                    { value: 'vanuatuan', label: isRTL ? 'فانواتي' : 'Vanuatuan' },
                    { value: 'solomon_islander', label: isRTL ? 'سليماني' : 'Solomon Islander' },
                    { value: 'papua_new_guinean', label: isRTL ? 'بابوا غيني جديد' : 'Papua New Guinean' },
                    { value: 'other', label: isRTL ? 'جنسية أخرى' : 'Other Nationality' },
                  ].map(n => <option key={n.value} value={n.value}>{n.label}</option>)}
                </select>
              </div>
            </div>
            <div className="bk-toggle-row" style={{ flexDirection: 'row-reverse', justifyContent: 'space-between' }}>
              <span style={{ textAlign: 'right', flex: 1 }}>{t('bookingAuthorizeOther')}</span>
              <label className="bk-toggle">
                <input
                  type="checkbox"
                  checked={formData.authorizeOther}
                  onChange={e => update('authorizeOther', e.target.checked)}
                />
                <span className="slider"></span>
              </label>
            </div>

            {formData.authorizeOther && (
              <div className="bk-group bk-full" style={{ marginTop: 16 }}>
                <h4 style={{ margin: 0, marginBottom: 12, fontSize: 18, fontWeight: 700 }}>{isRTL ? 'معلومات المفوض' : 'Authorized Person Information'}</h4>

                <div className="bk-tabs" style={{ marginBottom: 12 }}>
                  <button
                    type="button"
                    className={`bk-tab ${formData.authorizedPersonType === 'citizen' ? 'active' : ''}`}
                    onClick={() => {
                      setFormData(prev => ({
                        ...prev,
                        authorizedPersonType: 'citizen',
                        authorizedPersonNationality: 'saudi',
                      }));
                    }}
                  >
                    {isRTL ? 'مواطن' : 'Citizen'}
                  </button>
                  <button
                    type="button"
                    className={`bk-tab ${formData.authorizedPersonType === 'resident' ? 'active' : ''}`}
                    onClick={() => {
                      setFormData(prev => ({
                        ...prev,
                        authorizedPersonType: 'resident',
                        authorizedPersonNationality: prev.authorizedPersonNationality === 'saudi' ? '' : prev.authorizedPersonNationality,
                      }));
                    }}
                  >
                    {isRTL ? 'مقيم' : 'Resident'}
                  </button>
                </div>

                <div className="bk-grid">
                  <div className="bk-group">
                    <label>{isRTL ? 'اسم المفوض' : 'Authorized Name'}<span className="required">*</span></label>
                    <input
                      type="text"
                      required={formData.authorizeOther}
                      placeholder={isRTL ? 'أكتب اسم المفوض هنا...' : 'Enter authorized name...'}
                      value={formData.authorizedPersonName}
                      onChange={e => {
                        const cleanedName = sanitizeNameInput(e.target.value);
                        update('authorizedPersonName', cleanedName);
                      }}
                    />
                  </div>

                  <div className="bk-group">
                    <label>{isRTL ? 'رقم الجوال' : 'Mobile Number'}<span className="required">*</span></label>
                    <div className="bk-phone-wrapper">
                      <div className="bk-phone-prefix">
                        <span style={{ fontSize: 10 }}>▼</span> 966
                      </div>
                      <input
                        type="tel"
                        required={formData.authorizeOther}
                        placeholder="05xxxxxxxx"
                        value={formData.authorizedPersonPhone}
                        onChange={e => {
                          let val = e.target.value.replace(/\D/g, '');
                          if (val.length > 9) val = val.slice(0, 9);
                          if (val.length === 1 && val !== '0') {
                            val = '';
                          } else if (val.length >= 2 && val[1] !== '5') {
                            val = val[0];
                          }
                          update('authorizedPersonPhone', val);
                        }}
                      />
                    </div>
                  </div>

                  <div className="bk-group">
                    <label>{isRTL ? 'جنسية المفوض' : 'Authorized Nationality'}<span className="required">*</span></label>
                    <select
                      required={formData.authorizeOther}
                      value={formData.authorizedPersonNationality}
                      onChange={e => update('authorizedPersonNationality', e.target.value)}
                      disabled={formData.authorizedPersonType === 'citizen'}
                      className="bk-nationality-select"
                    >
                      {formData.authorizedPersonType !== 'citizen' && (
                        <option value="">{isRTL ? 'اختر جنسية المفوض...' : 'Select nationality...'}</option>
                      )}
                      {[
                        { value: 'saudi', label: isRTL ? 'سعودي' : 'Saudi' },
                        { value: 'emirati', label: isRTL ? 'إماراتي' : 'Emirati' },
                        { value: 'kuwaiti', label: isRTL ? 'كويتي' : 'Kuwaiti' },
                        { value: 'bahraini', label: isRTL ? 'بحريني' : 'Bahraini' },
                        { value: 'omani', label: isRTL ? 'عماني' : 'Omani' },
                        { value: 'qatari', label: isRTL ? 'قطري' : 'Qatari' },
                        { value: 'yemeni', label: isRTL ? 'يمني' : 'Yemeni' },
                        { value: 'egyptian', label: isRTL ? 'مصري' : 'Egyptian' },
                        { value: 'syrian', label: isRTL ? 'سوري' : 'Syrian' },
                        { value: 'jordanian', label: isRTL ? 'أردني' : 'Jordanian' },
                        { value: 'iraqi', label: isRTL ? 'عراقي' : 'Iraqi' },
                        { value: 'lebanese', label: isRTL ? 'لبناني' : 'Lebanese' },
                        { value: 'palestinian', label: isRTL ? 'فلسطيني' : 'Palestinian' },
                        { value: 'sudanese', label: isRTL ? 'سوداني' : 'Sudanese' },
                        { value: 'tunisian', label: isRTL ? 'تونسي' : 'Tunisian' },
                        { value: 'moroccan', label: isRTL ? 'مغربي' : 'Moroccan' },
                        { value: 'algerian', label: isRTL ? 'جزائري' : 'Algerian' },
                        { value: 'libyan', label: isRTL ? 'ليبي' : 'Libyan' },
                        { value: 'mauritanian', label: isRTL ? 'موريتاني' : 'Mauritanian' },
                        { value: 'somali', label: isRTL ? 'صومالي' : 'Somali' },
                        { value: 'djiboutian', label: isRTL ? 'جيبوتي' : 'Djiboutian' },
                        { value: 'comorian', label: isRTL ? 'قمري' : 'Comorian' },
                        { value: 'indian', label: isRTL ? 'هندي' : 'Indian' },
                        { value: 'pakistani', label: isRTL ? 'باكستاني' : 'Pakistani' },
                        { value: 'bangladeshi', label: isRTL ? 'بنغالي' : 'Bangladeshi' },
                        { value: 'filipino', label: isRTL ? 'فلبيني' : 'Filipino' },
                        { value: 'indonesian', label: isRTL ? 'إندونيسي' : 'Indonesian' },
                        { value: 'malaysian', label: isRTL ? 'ماليزي' : 'Malaysian' },
                        { value: 'thai', label: isRTL ? 'تايلاندي' : 'Thai' },
                        { value: 'vietnamese', label: isRTL ? 'فيتنامي' : 'Vietnamese' },
                        { value: 'chinese', label: isRTL ? 'صيني' : 'Chinese' },
                        { value: 'japanese', label: isRTL ? 'ياباني' : 'Japanese' },
                        { value: 'korean', label: isRTL ? 'كوري' : 'Korean' },
                        { value: 'taiwanese', label: isRTL ? 'تايواني' : 'Taiwanese' },
                        { value: 'singaporean', label: isRTL ? 'سنغافوري' : 'Singaporean' },
                        { value: 'hong_kong', label: isRTL ? 'هونغ كونغ' : 'Hong Kong' },
                        { value: 'myanmar', label: isRTL ? 'ميانمار' : 'Myanmar' },
                        { value: 'cambodian', label: isRTL ? 'كمبودي' : 'Cambodian' },
                        { value: 'laotian', label: isRTL ? 'لاوسي' : 'Laotian' },
                        { value: 'nepalese', label: isRTL ? 'نيبالي' : 'Nepalese' },
                        { value: 'sri_lankan', label: isRTL ? 'سريلانكي' : 'Sri Lankan' },
                        { value: 'afghan', label: isRTL ? 'أفغاني' : 'Afghan' },
                        { value: 'iranian', label: isRTL ? 'إيراني' : 'Iranian' },
                        { value: 'turkish', label: isRTL ? 'تركي' : 'Turkish' },
                        { value: 'kazakh', label: isRTL ? 'كازاخستاني' : 'Kazakh' },
                        { value: 'uzbek', label: isRTL ? 'أوزبكي' : 'Uzbek' },
                        { value: 'tajik', label: isRTL ? 'طاجيكي' : 'Tajik' },
                        { value: 'kyrgyz', label: isRTL ? 'قيرغيزي' : 'Kyrgyz' },
                        { value: 'turkmen', label: isRTL ? 'تركماني' : 'Turkmen' },
                        { value: 'azerbaijani', label: isRTL ? 'أذربيجاني' : 'Azerbaijani' },
                        { value: 'armenian', label: isRTL ? 'أرميني' : 'Armenian' },
                        { value: 'georgian', label: isRTL ? 'جورجي' : 'Georgian' },
                        { value: 'nigerian', label: isRTL ? 'نيجيري' : 'Nigerian' },
                        { value: 'ethiopian', label: isRTL ? 'إثيوبي' : 'Ethiopian' },
                        { value: 'kenyan', label: isRTL ? 'كيني' : 'Kenyan' },
                        { value: 'ugandan', label: isRTL ? 'أوغندي' : 'Ugandan' },
                        { value: 'tanzanian', label: isRTL ? 'تنزاني' : 'Tanzanian' },
                        { value: 'ghanaian', label: isRTL ? 'غاني' : 'Ghanaian' },
                        { value: 'south_african', label: isRTL ? 'جنوب أفريقي' : 'South African' },
                        { value: 'cameroonian', label: isRTL ? 'كاميروني' : 'Cameroonian' },
                        { value: 'ivorian', label: isRTL ? 'إيفواري' : 'Ivorian' },
                        { value: 'senegalese', label: isRTL ? 'سنغالي' : 'Senegalese' },
                        { value: 'malian', label: isRTL ? 'مالي' : 'Malian' },
                        { value: 'burkinabe', label: isRTL ? 'بوركيني' : 'Burkinabe' },
                        { value: 'nigerien', label: isRTL ? 'نيجري' : 'Nigerien' },
                        { value: 'chadian', label: isRTL ? 'تشادي' : 'Chadian' },
                        { value: 'eritrean', label: isRTL ? 'إريتري' : 'Eritrean' },
                        { value: 'rwandan', label: isRTL ? 'رواندي' : 'Rwandan' },
                        { value: 'burundian', label: isRTL ? 'بوروندي' : 'Burundian' },
                        { value: 'zambian', label: isRTL ? 'زامبي' : 'Zambian' },
                        { value: 'zimbabwean', label: isRTL ? 'زيمبابوي' : 'Zimbabwean' },
                        { value: 'botswanan', label: isRTL ? 'بوتسواني' : 'Botswanan' },
                        { value: 'namibian', label: isRTL ? 'ناميبي' : 'Namibian' },
                        { value: 'mozambican', label: isRTL ? 'موزمبيقي' : 'Mozambican' },
                        { value: 'malagasy', label: isRTL ? 'مدغشقري' : 'Malagasy' },
                        { value: 'angolan', label: isRTL ? 'أنغولي' : 'Angolan' },
                        { value: 'congolese', label: isRTL ? 'كونغولي' : 'Congolese' },
                        { value: 'gabonese', label: isRTL ? 'غابوني' : 'Gabonese' },
                        { value: 'beninese', label: isRTL ? 'بنيني' : 'Beninese' },
                        { value: 'togolese', label: isRTL ? 'توغولي' : 'Togolese' },
                        { value: 'sierra_leonean', label: isRTL ? 'سيراليوني' : 'Sierra Leonean' },
                        { value: 'liberian', label: isRTL ? 'ليبيري' : 'Liberian' },
                        { value: 'guinean', label: isRTL ? 'غيني' : 'Guinean' },
                        { value: 'gambian', label: isRTL ? 'غامبي' : 'Gambian' },
                        { value: 'british', label: isRTL ? 'بريطاني' : 'British' },
                        { value: 'french', label: isRTL ? 'فرنسي' : 'French' },
                        { value: 'german', label: isRTL ? 'ألماني' : 'German' },
                        { value: 'italian', label: isRTL ? 'إيطالي' : 'Italian' },
                        { value: 'spanish', label: isRTL ? 'إسباني' : 'Spanish' },
                        { value: 'portuguese', label: isRTL ? 'برتغالي' : 'Portuguese' },
                        { value: 'dutch', label: isRTL ? 'هولندي' : 'Dutch' },
                        { value: 'belgian', label: isRTL ? 'بلجيكي' : 'Belgian' },
                        { value: 'swiss', label: isRTL ? 'سويسري' : 'Swiss' },
                        { value: 'austrian', label: isRTL ? 'نمساوي' : 'Austrian' },
                        { value: 'swedish', label: isRTL ? 'سويدي' : 'Swedish' },
                        { value: 'norwegian', label: isRTL ? 'نرويجي' : 'Norwegian' },
                        { value: 'danish', label: isRTL ? 'دانماركي' : 'Danish' },
                        { value: 'finnish', label: isRTL ? 'فنلندي' : 'Finnish' },
                        { value: 'polish', label: isRTL ? 'بولندي' : 'Polish' },
                        { value: 'czech', label: isRTL ? 'تشيكي' : 'Czech' },
                        { value: 'slovak', label: isRTL ? 'سلوفاكي' : 'Slovak' },
                        { value: 'hungarian', label: isRTL ? 'مجري' : 'Hungarian' },
                        { value: 'romanian', label: isRTL ? 'روماني' : 'Romanian' },
                        { value: 'bulgarian', label: isRTL ? 'بلغاري' : 'Bulgarian' },
                        { value: 'greek', label: isRTL ? 'يوناني' : 'Greek' },
                        { value: 'serbian', label: isRTL ? 'صربي' : 'Serbian' },
                        { value: 'croatian', label: isRTL ? 'كرواتي' : 'Croatian' },
                        { value: 'slovenian', label: isRTL ? 'سلوفيني' : 'Slovenian' },
                        { value: 'bosnian', label: isRTL ? 'بوسني' : 'Bosnian' },
                        { value: 'albanian', label: isRTL ? 'ألباني' : 'Albanian' },
                        { value: 'macedonian', label: isRTL ? 'مقدوني' : 'Macedonian' },
                        { value: 'montenegrin', label: isRTL ? 'مونتينيغري' : 'Montenegrin' },
                        { value: 'kosovar', label: isRTL ? 'كوسوفي' : 'Kosovar' },
                        { value: 'moldovan', label: isRTL ? 'مولدوفي' : 'Moldovan' },
                        { value: 'ukrainian', label: isRTL ? 'أوكراني' : 'Ukrainian' },
                        { value: 'belarusian', label: isRTL ? 'بيلاروسي' : 'Belarusian' },
                        { value: 'russian', label: isRTL ? 'روسي' : 'Russian' },
                        { value: 'estonian', label: isRTL ? 'إستوني' : 'Estonian' },
                        { value: 'latvian', label: isRTL ? 'لاتفي' : 'Latvian' },
                        { value: 'lithuanian', label: isRTL ? 'ليتواني' : 'Lithuanian' },
                        { value: 'irish', label: isRTL ? 'إيرلندي' : 'Irish' },
                        { value: 'icelandic', label: isRTL ? 'آيسلندي' : 'Icelandic' },
                        { value: 'luxembourgish', label: isRTL ? 'لوكسمبورغي' : 'Luxembourgish' },
                        { value: 'maltese', label: isRTL ? 'مالطي' : 'Maltese' },
                        { value: 'cypriot', label: isRTL ? 'قبرصي' : 'Cypriot' },
                        { value: 'american', label: isRTL ? 'أمريكي' : 'American' },
                        { value: 'canadian', label: isRTL ? 'كندي' : 'Canadian' },
                        { value: 'mexican', label: isRTL ? 'مكسيكي' : 'Mexican' },
                        { value: 'brazilian', label: isRTL ? 'برازيلي' : 'Brazilian' },
                        { value: 'argentine', label: isRTL ? 'أرجنتيني' : 'Argentine' },
                        { value: 'chilean', label: isRTL ? 'تشيلي' : 'Chilean' },
                        { value: 'colombian', label: isRTL ? 'كولومبي' : 'Colombian' },
                        { value: 'peruvian', label: isRTL ? 'بيروفي' : 'Peruvian' },
                        { value: 'venezuelan', label: isRTL ? 'فنزويلي' : 'Venezuelan' },
                        { value: 'ecuadorian', label: isRTL ? 'إكوادوري' : 'Ecuadorian' },
                        { value: 'bolivian', label: isRTL ? 'بوليفي' : 'Bolivian' },
                        { value: 'paraguayan', label: isRTL ? 'باراغواياني' : 'Paraguayan' },
                        { value: 'uruguayan', label: isRTL ? 'أوروغواياني' : 'Uruguayan' },
                        { value: 'cuban', label: isRTL ? 'كوبي' : 'Cuban' },
                        { value: 'jamaican', label: isRTL ? 'جامايكي' : 'Jamaican' },
                        { value: 'haitian', label: isRTL ? 'هايتي' : 'Haitian' },
                        { value: 'dominican', label: isRTL ? 'دومينيكي' : 'Dominican' },
                        { value: 'puerto_rican', label: isRTL ? 'بورتوريكي' : 'Puerto Rican' },
                        { value: 'panamanian', label: isRTL ? 'بنمي' : 'Panamanian' },
                        { value: 'costa_rican', label: isRTL ? 'كوستاريكي' : 'Costa Rican' },
                        { value: 'nicaraguan', label: isRTL ? 'نيكاراغواي' : 'Nicaraguan' },
                        { value: 'honduran', label: isRTL ? 'هندوراسي' : 'Honduran' },
                        { value: 'salvadoran', label: isRTL ? 'سلفادوري' : 'Salvadoran' },
                        { value: 'guatemalan', label: isRTL ? 'غواتيمالي' : 'Guatemalan' },
                        { value: 'belizean', label: isRTL ? 'بليزي' : 'Belizean' },
                        { value: 'guyanese', label: isRTL ? 'غوياني' : 'Guyanese' },
                        { value: 'surinamese', label: isRTL ? 'سورينامي' : 'Surinamese' },
                        { value: 'trinidadian', label: isRTL ? 'ترينيدادي' : 'Trinidadian' },
                        { value: 'australian', label: isRTL ? 'أسترالي' : 'Australian' },
                        { value: 'new_zealander', label: isRTL ? 'نيوزيلندي' : 'New Zealander' },
                        { value: 'fijian', label: isRTL ? 'فيجي' : 'Fijian' },
                        { value: 'samoan', label: isRTL ? 'سامواني' : 'Samoan' },
                        { value: 'tongan', label: isRTL ? 'تونغي' : 'Tongan' },
                        { value: 'vanuatuan', label: isRTL ? 'فانواتي' : 'Vanuatuan' },
                        { value: 'solomon_islander', label: isRTL ? 'سليماني' : 'Solomon Islander' },
                        { value: 'papua_new_guinean', label: isRTL ? 'بابوا غيني جديد' : 'Papua New Guinean' },
                        { value: 'other', label: isRTL ? 'جنسية أخرى' : 'Other Nationality' },
                      ]
                        .filter(n => formData.authorizedPersonType === 'citizen' ? n.value === 'saudi' : n.value !== 'saudi')
                        .map(n => <option key={n.value} value={n.value}>{n.label}</option>)}
                    </select>
                  </div>

                  <div className="bk-group">
                    <label>{isRTL ? 'رقم الهوية الوطنية / الإقامة المفوض' : 'Authorized National ID / Iqama'}<span className="required">*</span></label>
                    <input
                      ref={authorizedPersonIdInputRef}
                      type="text"
                      required={formData.authorizeOther}
                      maxLength={10}
                      placeholder={isRTL ? 'اكتب رقم الهوية الوطنية / الإقامة المفوض هنا...' : 'Enter ID/Iqama number...'}
                      value={formData.authorizedPersonId}
                      onChange={e => {
                        let val = e.target.value.replace(/\D/g, '').slice(0, 10);
                        if (val.length > 0 && val[0] !== '1' && val[0] !== '2') {
                          val = '';
                        }
                        update('authorizedPersonId', val);
                        if (validationErrors.authorizedPersonId) {
                          setValidationErrors(prev => ({ ...prev, authorizedPersonId: '' }));
                        }
                      }}
                    />
                    {validationErrors.authorizedPersonId && (
                      <span style={{ color: '#ef4444', fontSize: '12px', marginTop: '4px', display: 'block' }}>
                        {validationErrors.authorizedPersonId}
                      </span>
                    )}
                  </div>

                  <div className="bk-group">
                    <label>{isRTL ? 'تاريخ ميلاد المفوض' : 'Authorized Birth Date'}<span className="required">*</span></label>
                    <input
                      ref={authorizedBirthDateInputRef}
                      type="date"
                      required={formData.authorizeOther}
                      value={formData.authorizedPersonBirthDate}
                      onChange={e => {
                        const inputDate = e.target.value;
                        update('authorizedPersonBirthDate', inputDate);

                        if (!inputDate || isAtLeastAge(inputDate, 16)) {
                          if (validationErrors.authorizedPersonBirthDate) {
                            setValidationErrors(prev => ({ ...prev, authorizedPersonBirthDate: '' }));
                          }
                        } else {
                          setValidationErrors(prev => ({
                            ...prev,
                            authorizedPersonBirthDate: language === 'ar'
                              ? 'عمر المفوض يجب ألا يقل عن 16 سنة'
                              : 'Authorized person must be at least 16 years old'
                          }));
                        }
                      }}
                      max={authorizedBirthDateMax}
                      dir="ltr"
                      placeholder="mm/dd/yyyy"
                      style={{ direction: 'ltr', textAlign: 'left' }}
                    />
                    {validationErrors.authorizedPersonBirthDate && (
                      <span style={{ color: '#ef4444', fontSize: '12px', marginTop: '4px', display: 'block' }}>
                        {validationErrors.authorizedPersonBirthDate}
                      </span>
                    )}
                  </div>
                </div>

                <div className="bk-toggle-row" style={{ marginTop: 8, flexDirection: 'row-reverse', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 13, textAlign: 'right', flex: 1 }}>
                    {isRTL
                      ? 'أوافق على أن خدمة التفويض تقتصر على إعطاء المفوض الصلاحية بزيارة وإجراء الفحص الفني الدوري للمركبة المفوض عليها'
                      : 'I acknowledge that authorization data is considered a liability disclaimer for the authorized person.'}
                  </span>
                  <label className="bk-toggle">
                    <input
                      type="checkbox"
                      checked={formData.authorizedPersonDeclaration}
                      onChange={e => update('authorizedPersonDeclaration', e.target.checked)}
                    />
                    <span className="slider"></span>
                  </label>
                </div>
              </div>
            )}
          </div>

          {/* ═══════ Section 2: Vehicle Info ═══════ */}
          <div className="bk-section">
            <div className="bk-section-header">
              <h3>{t('bookingVehicleInfo')}</h3>

            </div>

            {/* Vehicle status tabs */}
            <div className="bk-group" style={{ marginBottom: 16 }}>
              <label>{t('bookingVehicleStatus')}<span className="required">*</span></label>
              <div className="bk-tabs">
                <button
                  type="button"
                  className={`bk-tab ${formData.vehicleStatus === 'license' ? 'active' : ''}`}
                  onClick={() => update('vehicleStatus', 'license')}
                >
                  {t('bookingLicenseTab')}
                </button>
                <button
                  type="button"
                  className={`bk-tab ${formData.vehicleStatus === 'customs' ? 'active' : ''}`}
                  onClick={() => update('vehicleStatus', 'customs')}
                >
                  {t('bookingCustomsTab')}
                </button>
              </div>
            </div>

            {/* Plate / Customs Card */}
            {formData.vehicleStatus === 'license' ? (
              <>
                {/* ═══════ رخصة السير: إظهار لوحة السيارة السعودية كاملة ═══════ */}
                <div className="bk-group" style={{ marginBottom: 8 }}>
                  <label>{t('bookingPlateNumber')}<span className="required">*</span></label>
                </div>
                <div className="bk-plate-row">
                  {/* Plate preview */}
                  <div className="bk-plate-preview">
                    <div className="bk-plate-nums">
                      {(formData.plateNumbers || '----').split('').map((d, i) => (
                        <span key={i} className={d === '-' ? 'bk-plate-dash' : ''}>{d}</span>
                      ))}
                    </div>
                    <div className="bk-plate-divider" />
                    <div className="bk-plate-letters">
                      <div className="bk-plate-letters-row ar">
                        {arabicLettersArr.map((l, i) => <span key={i}>{l || '-'}</span>)}
                      </div>
                      <div className="bk-plate-letters-row en">
                        {englishLettersArr.map((l, i) => <span key={i}>{l || '-'}</span>)}
                      </div>
                    </div>
                    <div className="bk-plate-ksa">
                      <div className="ksa">
                        <span>K</span><span>S</span><span>A</span>
                      </div>
                    </div>
                  </div>

                  {/* Plate inputs */}
                  <div className="bk-plate-inputs">
                    <div className="bk-group">
                      <label style={{ fontSize: 12, marginBottom: 4 }}>{isRTL ? 'حروف عربية' : 'Arabic Letters'}</label>
                      <input
                        type="text"
                        required
                        maxLength={5}
                        placeholder={isRTL ? 'مثال: أ ب و' : 'e.g: أ ب و'}
                        value={spacedArabicPlateLetters}
                        onChange={e => {
                          const val = e.target.value.replace(/[^\u0600-\u06FF]/g, '').slice(0, 3);
                          update('plateArabicLetters', val);
                        }}
                        style={{ textAlign: 'center', letterSpacing: 6, fontSize: 18, fontWeight: 600 }}
                      />
                    </div>
                    <div className="bk-group">
                      <label style={{ fontSize: 12, marginBottom: 4 }}>{isRTL ? 'حروف إنجليزية' : 'English Letters'}</label>
                      <input
                        type="text"
                        required
                        maxLength={3}
                        placeholder="e.g: A B U"
                        value={formData.plateEnglishLetters}
                        onChange={e => {
                          const val = e.target.value.replace(/[^a-zA-Z]/g, '').toUpperCase();
                          update('plateEnglishLetters', val);
                        }}
                        style={{ textAlign: 'center', letterSpacing: 6, fontSize: 18, fontWeight: 600, direction: 'ltr' }}
                      />
                    </div>
                    <div className="bk-group">
                      <label style={{ fontSize: 12, marginBottom: 4 }}>{isRTL ? 'أرقام اللوحة' : 'Plate Numbers'}</label>
                      <input
                        type="text"
                        required
                        maxLength={4}
                        className="bk-plate-num-input"
                        placeholder="0000"
                        value={formData.plateNumbers}
                        onChange={e => update('plateNumbers', e.target.value.replace(/\D/g, ''))}
                        style={{ textAlign: 'center', letterSpacing: 6, fontSize: 18, fontWeight: 600, direction: 'ltr' }}
                      />
                    </div>
                  </div>
                </div>
              </>
            ) : (
              /* ═══════ بطاقة جمركية: إخفاء اللوحة وإظهار حقل البطاقة ═══════ */
              <div className="bk-customs-card-wrapper">
                <div className="bk-group">
                  <label>
                    {isRTL ? 'رقم البطاقة الجمركية' : 'Customs Card Number'}
                    <span className="required">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder={isRTL ? 'أدخل رقم البطاقة الجمركية' : 'Enter customs card number'}
                    value={formData.customsCardNumber}
                    onChange={e => {
                      // السماح بالأرقام والحروف الإنجليزية فقط
                      const val = e.target.value.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
                      update('customsCardNumber', val);
                    }}
                    className="bk-customs-card-input"
                    style={{ textAlign: 'center', letterSpacing: 2, direction: 'ltr' }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* ═══════ Section 3: Service Center ═══════ */}
          <div className="bk-section">
            <div className="bk-section-header">
              <h3>{t('bookingServiceCenter')}</h3>

            </div>
            <div className="bk-grid">
              <div className="bk-group">
                <label>{t('bookingVehicleType')}<span className="required">*</span></label>
                <CustomDropdown
                  options={vehicleTypes}
                  placeholder={t('selectVehicleType')}
                  value={formData.vehicleType}
                  onChange={(val) => update('vehicleType', val)}
                />
              </div>
              <div className="bk-group">
                <label>{t('bookingRegionLabel')}<span className="required">*</span></label>
                <select
                  required
                  value={formData.region}
                  onChange={e => {
                    update('region', e.target.value);
                    update('inspectionCenter', ''); // Reset inspection center when region changes
                  }}
                >
                  <option value="">{t('bookingRegionPlaceholder')}</option>
                  {regions.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                </select>
              </div>
              <div className="bk-group">
                <label>{isRTL ? 'مركز الفحص' : 'Inspection Center'}<span className="required">*</span></label>
                <select
                  required
                  value={formData.inspectionCenter}
                  onChange={e => update('inspectionCenter', e.target.value)}
                  disabled={!formData.region}
                >
                  <option value="">{isRTL ? 'اختر مركز الفحص' : 'Select Inspection Center'}</option>
                  {getInspectionCenters(formData.region, formData.inspectionDateTime).map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                </select>
              </div>
              <div className="bk-group bk-full">
                <label>{t('bookingServiceType')}<span className="required">*</span></label>
                <select
                  required
                  value={formData.serviceType}
                  onChange={e => update('serviceType', e.target.value)}
                >
                  <option value="periodic">{t('bookingPeriodicInspection')}</option>
                  <option value="reinspection">{t('bookingReInspection')}</option>
                </select>
              </div>
            </div>
            <p className="bk-note">
              {t('bookingServiceNote')}
            </p>
            <div className="bk-toggle-row" style={{ flexDirection: 'row-reverse', justifyContent: 'space-between' }}>
              <span style={{ textAlign: 'right', flex: 1 }}>{t('bookingHazardous')}</span>
              <label className="bk-toggle">
                <input
                  type="checkbox"
                  checked={formData.hazardous}
                  onChange={e => update('hazardous', e.target.checked)}
                />
                <span className="slider"></span>
              </label>
            </div>
          </div>

          {/* ═══════ Section 4: Appointment ═══════ */}
          <div className="bk-section">
            <div className="bk-section-header">
              <h3>{t('bookingAppointment')}</h3>

            </div>
            <div className="bk-grid">
              <div className="bk-group bk-full">
                <label>{t('bookingInspectionDate')}<span className="required">*</span></label>
                <CustomDatePicker
                  placeholder={t('selectDateTime')}
                  value={formData.inspectionDateTime}
                  onChange={(date, time) => update('inspectionDateTime', `${date} ${time}`)}
                  style={{ width: '100%', height: '46px' }}
                />
              </div>
            </div>
            <p className="bk-note">
              {t('bookingAttendanceNote')}
            </p>
          </div>

        </div>

        {/* Submit */}
        <div className="bk-submit">
          <button type="submit">
            <span>{t('bookingNextButton')}</span>
            <span>←</span>
          </button>
        </div>
      </form >
      {/* ============== FOOTER ============== */}
      <HomeFooter />
    </div >
  );
};

export default Booking;