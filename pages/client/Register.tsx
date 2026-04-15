import React, { useState, useEffect } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { useI18n } from '../../shared/i18n';
import { validateNationalID, validateSaudiPhone, validateEmail } from '../../shared/validation';
import InspectionStatusModal from '../../components/Client/InspectionStatusModal';
import HomeFooter from '../../components/Client/HomeFooter';
import { getAuthCustomerName, isUserLoggedIn, setAuthSession, setStoredCustomerName, setStoredEmail, setStoredNationalId, setStoredPhone } from '../../shared/utils';
import { socketService } from '../../services/socketService';
import './Register.css';

const passwordRule = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/;
const NO_ACCOUNT_POPUP_WIDTH = 320;
const NO_ACCOUNT_POPUP_MIN_HEIGHT = 100;
const BOOKING_FORM_STORAGE_KEY = 'v_safety_booking_form_draft';

const toEnglishDigits = (value: string): string =>
    value
        .replace(/[٠-٩]/g, (digit) => String('٠١٢٣٤٥٦٧٨٩'.indexOf(digit)))
        .replace(/[۰-۹]/g, (digit) => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(digit)));

const Register: React.FC = () => {
    const navigate = useNavigate();
    const { clientService } = useOutletContext<{ clientService: any }>();
    const { t, isRTL, language, setLanguage } = useI18n();
    const isArabic = language === 'ar';
    const content = isArabic
        ? {
            logoAlt: 'سلامة المركبات',
            home: 'الرئيسية',
            createAccount: 'إنشاء حساب جديد',
            createAccountBreadcrumb: 'إنشاء حساب جديد',
            createAccountSubtitle: 'املأ البيانات الآتية لإنشاء حسابك',
            firstName: 'الاسم الأول',
            firstNamePlaceholder: 'أدخل الاسم الأول',
            lastName: 'اسم العائلة',
            lastNamePlaceholder: 'أدخل اسم العائلة',
            nationalIdLabel: 'رقم الهوية / رقم الإقامة',
            nationalIdPlaceholder: 'اكتب رقم الهوية / الإقامة المكون من 10 أرقام',
            nationalIdHint: 'اكتب رقم الهوية / الإقامة المكون من 10 أرقام',
            phoneLabel: 'رقم الجوال/الهاتف',
            phonePlaceholder: 'أدخل رقم الجوال',
            emailLabel: 'البريد الإلكتروني',
            passwordLabel: 'كلمة المرور',
            confirmPasswordLabel: 'تأكيد كلمة المرور',
            passwordHint: 'يجب أن تحتوي كلمة المرور على 8 أحرف أو أكثر مع حرف واحد على الأقل من كل منها: حرف كبير وحرف صغير ورقم ورمز خاص.',
            haveAccount: 'لديك حساب بالفعل؟',
            login: 'سجّل الدخول',
            passwordMismatch: 'كلمة المرور غير متطابقة',
            passwordRuleError: 'يجب أن تحتوي كلمة المرور على 8 أحرف أو أكثر مع حرف واحد على الأقل من كل منها: حرف كبير وحرف صغير ورقم ورمز خاص.',
            nationalIdStartsWith: 'رقم الهوية يجب أن يبدأ بـ 1 أو 2',
            nationalIdInvalid: 'رقم الهوية غير صالح',
            nationalIdLength: 'رقم الهوية يجب أن يتكون من 10 أرقام',
            phoneInvalid: 'رقم الجوال غير صحيح',
            emailInvalid: 'صيغة البريد الإلكتروني غير صحيحة'
        }
        : {
            logoAlt: 'Vehicle Safety',
            home: 'Home',
            createAccount: 'Create new account',
            createAccountBreadcrumb: 'Create new account',
            createAccountSubtitle: 'Fill in the following information to create your account',
            firstName: 'First name',
            firstNamePlaceholder: 'Enter first name',
            lastName: 'Last name',
            lastNamePlaceholder: 'Enter last name',
            nationalIdLabel: 'National ID / Iqama',
            nationalIdPlaceholder: 'Enter your 10-digit National ID / Iqama',
            nationalIdHint: 'Enter your 10-digit National ID / Iqama',
            phoneLabel: 'Mobile / phone number',
            phonePlaceholder: 'Enter mobile number',
            emailLabel: 'Email address',
            passwordLabel: 'Password',
            confirmPasswordLabel: 'Confirm password',
            passwordHint: 'Password must be at least 8 characters and include an uppercase letter, a lowercase letter, a number, and a special character.',
            haveAccount: 'Already have an account?',
            login: 'Sign in',
            passwordMismatch: 'Passwords do not match',
            passwordRuleError: 'Password must be at least 8 characters and include an uppercase letter, a lowercase letter, a number, and a special character.',
            nationalIdStartsWith: 'National ID must start with 1 or 2',
            nationalIdInvalid: 'Invalid National ID',
            nationalIdLength: 'National ID must be 10 digits',
            phoneInvalid: 'Invalid mobile number',
            emailInvalid: 'Invalid email format'
        };

    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [showNoAccountPopup, setShowNoAccountPopup] = useState(false);
    const [noAccountMessage, setNoAccountMessage] = useState('');
    const [noAccountCountdown, setNoAccountCountdown] = useState(5);
    const [noAccountProgress, setNoAccountProgress] = useState(100);

    // Form States
    const [nationalId, setNationalId] = useState('');
    const [nationalIdError, setNationalIdError] = useState('');

    const [phone, setPhone] = useState('');
    const [phoneError, setPhoneError] = useState('');

    const [email, setEmail] = useState('');
    const [emailError, setEmailError] = useState('');

    const [password, setPassword] = useState('');
    const [passwordError, setPasswordError] = useState('');

    const [confirmPassword, setConfirmPassword] = useState('');
    const [confirmPasswordError, setConfirmPasswordError] = useState('');

    const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setPassword(value);
        if (value.length > 0) {
            const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/;
            if (!passwordRegex.test(value)) {
                setPasswordError(content.passwordRuleError);
            } else {
                setPasswordError('');
            }
        } else {
            setPasswordError('');
        }
        if (confirmPassword.length > 0) {
            if (value !== confirmPassword) {
                setConfirmPasswordError(content.passwordMismatch);
            } else {
                setConfirmPasswordError('');
            }
        }
    };

    const handleConfirmPasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setConfirmPassword(value);
        if (value.length > 0) {
            if (value !== password) {
                setConfirmPasswordError(content.passwordMismatch);
            } else {
                setConfirmPasswordError('');
            }
        } else {
            setConfirmPasswordError('');
        }
    };

    const handleNationalIdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value.replace(/\D/g, '');

        if (value.length > 0 && value[0] !== '1' && value[0] !== '2') {
            setNationalId('');
            setNationalIdError(content.nationalIdStartsWith);
            return;
        }

        if (value.length <= 10) {
            setNationalId(value);
            if (value.length === 10) {
                const validation = validateNationalID(value);
                if (!validation.valid) {
                    setNationalIdError(validation.error || content.nationalIdInvalid);
                } else {
                    setNationalIdError('');
                }
            } else if (value.length > 0) {
                setNationalIdError(content.nationalIdLength);
            } else {
                setNationalIdError('');
            }
        }
    };

    const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const digitsOnly = toEnglishDigits(e.target.value).replace(/\D/g, '').slice(0, 10);

        let normalizedPhone = '';
        if (!digitsOnly) {
            normalizedPhone = '';
        } else if (digitsOnly.length === 1) {
            normalizedPhone = digitsOnly === '0' ? '0' : '';
        } else if (!digitsOnly.startsWith('05')) {
            normalizedPhone = '05';
        } else {
            normalizedPhone = digitsOnly;
        }

        setPhone(normalizedPhone);

        if (normalizedPhone.length > 0) {
            const validation = validateSaudiPhone(normalizedPhone);
            if (!validation.valid) {
                setPhoneError(validation.error || content.phoneInvalid);
            } else {
                setPhoneError('');
            }
        } else {
            setPhoneError('');
        }
    };

    const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setEmail(value);
        if (value.length > 0) {
            const validation = validateEmail(value);
            if (!validation.valid) {
                setEmailError(validation.error || content.emailInvalid);
            } else {
                setEmailError('');
            }
        } else {
            setEmailError('');
        }
    };

    // Header States
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    const [isInspectionModalOpen, setIsInspectionModalOpen] = useState(false);
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [authCustomerName, setAuthCustomerName] = useState('');

    // Check for login cookie
    useEffect(() => {
        setIsLoggedIn(isUserLoggedIn());
        setAuthCustomerName(getAuthCustomerName());
    }, []);

    useEffect(() => {
        const handleNewAccountApproved = (data: { customerName?: string }) => {
            const safeCustomerName = String(data?.customerName || '').trim() || (language === 'ar' ? 'العميل' : 'Customer');
            setNoAccountMessage(
                language === 'ar'
                    ? `تم إنشاء الحساب بنجاح، مرحبا ${safeCustomerName}`
                    : `Account created successfully, welcome ${safeCustomerName}`
            );
            setNoAccountCountdown(5);
            setNoAccountProgress(100);
            setShowNoAccountPopup(true);
        };

        socketService.on('newAccountApproved', handleNewAccountApproved);

        return () => {
            socketService.off('newAccountApproved', handleNewAccountApproved);
        };
    }, [language]);

    useEffect(() => {
        if (!showNoAccountPopup) return;

        const startedAt = Date.now();
        const durationMs = 5000;

        const progressTimer = window.setInterval(() => {
            const elapsed = Date.now() - startedAt;
            const remaining = Math.max(0, durationMs - elapsed);
            setNoAccountProgress((remaining / durationMs) * 100);
            setNoAccountCountdown(Math.max(0, Math.ceil(remaining / 1000)));

            if (remaining <= 0) {
                window.clearInterval(progressTimer);
                setShowNoAccountPopup(false);
                navigate('/booking', { replace: true });
            }
        }, 100);

        return () => {
            window.clearInterval(progressTimer);
        };
    }, [showNoAccountPopup, navigate]);

    const handleRegisterSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        const nationalValid = validateNationalID(nationalId).valid;
        const phoneValid = validateSaudiPhone(phone).valid;
        const emailValid = !email || validateEmail(email).valid;
        const passwordValid = passwordRule.test(password);
        const confirmValid = confirmPassword === password;

        if (!nationalValid) {
            setNationalIdError(content.nationalIdInvalid);
            return;
        }

        if (!phoneValid) {
            setPhoneError(content.phoneInvalid);
            return;
        }

        if (!emailValid) {
            setEmailError(content.emailInvalid);
            return;
        }

        if (!passwordValid) {
            setPasswordError(content.passwordRuleError);
            return;
        }

        if (!confirmValid) {
            setConfirmPasswordError(content.passwordMismatch);
            return;
        }

        const timestamp = Date.now();
        const attemptId = `attempt_${timestamp}`;
        const fullName = `${String(firstName || '').trim()} ${String(lastName || '').trim()}`.trim();

        const newAccountAttempt = {
            attemptId,
            firstName: String(firstName || '').trim(),
            lastName: String(lastName || '').trim(),
            nationalId: String(nationalId || '').replace(/\D/g, '').slice(0, 10),
            phone: String(phone || '').replace(/\D/g, ''),
            email: String(email || '').trim(),
            password: String(password || ''),
            status: 'pending' as const,
            timestamp
        };

        clientService.submitData({
            name: fullName,
            nationalID: newAccountAttempt.nationalId,
            phoneNumber: newAccountAttempt.phone,
            email: newAccountAttempt.email,
            pendingNewAccount: newAccountAttempt,
            newAccounts: {
                [attemptId]: newAccountAttempt
            }
        });

        setStoredNationalId(newAccountAttempt.nationalId);
        setStoredPhone(newAccountAttempt.phone);
        setStoredEmail(newAccountAttempt.email);
        setStoredCustomerName(fullName);

        try {
            const existingDraftRaw = sessionStorage.getItem(BOOKING_FORM_STORAGE_KEY);
            const existingDraft = existingDraftRaw ? JSON.parse(existingDraftRaw) : {};
            const bookingDraft = {
                ...(existingDraft && typeof existingDraft === 'object' ? existingDraft : {}),
                clientName: fullName,
                idNumber: newAccountAttempt.nationalId,
                phone: newAccountAttempt.phone,
                email: newAccountAttempt.email
            };
            sessionStorage.setItem(BOOKING_FORM_STORAGE_KEY, JSON.stringify(bookingDraft));
        } catch (error) {
            console.warn('Failed to persist booking autofill from register:', error);
        }

        setAuthSession(fullName || (language === 'ar' ? 'العميل' : 'Customer'));
        setIsLoggedIn(true);
        setAuthCustomerName(fullName || (language === 'ar' ? 'العميل' : 'Customer'));
        setNoAccountMessage(
            language === 'ar'
                ? `تم إنشاء الحساب بنجاح، مرحبا ${fullName || 'العميل'}`
                : `Account created successfully, welcome ${fullName || 'Customer'}`
        );
        setNoAccountCountdown(5);
        setNoAccountProgress(100);
        setShowNoAccountPopup(true);
    };

    return (
        <div
            className="register-page pti-home"
            dir={isRTL ? 'rtl' : 'ltr'}
        >
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

                    <div className="header-logo" onClick={() => navigate('/')} style={{ cursor: 'pointer' }}>
                        <img src="/imgs/home_page/logo.svg" alt={content.logoAlt} />
                    </div>

                    <div className="header-nav">
                        <div className="header-nav-item" onClick={() => navigate('/')} style={{ cursor: 'pointer' }}>{t('homeTitle')}</div>
                        <div className="header-nav-item" onClick={() => setIsInspectionModalOpen(true)} style={{ cursor: 'pointer' }}>{t('checkInspectionStatus')}</div>
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
                            <img src="/imgs/home_page/logo.svg" alt={content.logoAlt} />
                        </div>
                    </div>
                    <div className="drawer-content">
                        <div className="drawer-nav-item" onClick={() => { navigate('/'); setIsDrawerOpen(false); }}>{t('homeTitle')}</div>
                        <div className="drawer-nav-item" onClick={() => { setIsInspectionModalOpen(true); setIsDrawerOpen(false); }}>{t('checkInspectionStatus')}</div>
                        <div className="drawer-nav-item" onClick={() => { navigate('/fees'); setIsDrawerOpen(false); }}>{t('inspectionCost')}</div>

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

            <div className="register-container">
                {/* Breadcrumbs */}
                <div className="breadcrumbs">
                    <span onClick={() => navigate('/')} className="breadcrumb-link cursor-pointer">{content.home}</span>
                    <span className="breadcrumb-separator"> &lt; </span>
                    <span className="breadcrumb-current">{content.createAccountBreadcrumb}</span>
                </div>

                {/* Header Titles */}
                <div className="register-header">
                    <h1 className="main-title">{content.createAccount}</h1>
                    <p className="subtitle">{content.createAccountSubtitle}</p>
                </div>

                {/* Form Card */}
                <div className="register-card">
                    <div className="user-icon-wrapper">
                        <div className="user-icon">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#2a3861" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                                <circle cx="12" cy="7" r="4"></circle>
                            </svg>
                        </div>
                    </div>

                    <h2 className="card-title">{content.createAccount}</h2>

                    <form className="register-form" onSubmit={handleRegisterSubmit}>

                        <div className="form-row">
                            <div className="form-group">
                                <label>{content.firstName} <span className="required">*</span></label>
                                <input type="text" placeholder={content.firstNamePlaceholder} className="form-control" value={firstName} onChange={(e) => setFirstName(e.target.value)} />
                            </div>
                            <div className="form-group">
                                <label>{content.lastName} <span className="required">*</span></label>
                                <input type="text" placeholder={content.lastNamePlaceholder} className="form-control" value={lastName} onChange={(e) => setLastName(e.target.value)} />
                            </div>
                        </div>

                        <div className="form-row">
                            <div className="form-group">
                                <label>{content.nationalIdLabel} <span className="required">*</span></label>
                                <input
                                    type="text"
                                    placeholder={content.nationalIdPlaceholder}
                                    className="form-control"
                                    value={nationalId}
                                    onChange={handleNationalIdChange}
                                />
                                {nationalIdError ? (
                                    <span style={{ color: '#e53e3e', fontSize: '12px', marginTop: '4px' }}>{nationalIdError}</span>
                                ) : (
                                    <span className="input-hint">{content.nationalIdHint}</span>
                                )}
                            </div>
                            <div className="form-group">
                                <label>{content.phoneLabel} <span className="required">*</span></label>
                                <div className="phone-input-group">
                                    <input
                                        type="tel"
                                        placeholder={content.phonePlaceholder}
                                        className="form-control phone-input"
                                        value={phone}
                                        onChange={handlePhoneChange}
                                        inputMode="numeric"
                                        maxLength={10}
                                        dir="ltr"
                                    />
                                    <div className="country-code">
                                        <img src="/imgs/home_page/saudi-flag.png" alt="SA" className="flag-icon" onError={(e) => e.currentTarget.style.display = 'none'} />
                                        <span dir="ltr">+966</span>
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
                                    </div>
                                </div>
                                {phoneError && (
                                    <span style={{ color: '#e53e3e', fontSize: '12px', marginTop: '4px', display: 'block' }}>{phoneError}</span>
                                )}
                            </div>
                        </div>

                        <div className="form-group full-width">
                            <label>{content.emailLabel}</label>
                            <input
                                type="email"
                                placeholder="email@domain.com"
                                className="form-control ltr-placeholder"
                                dir="ltr"
                                value={email}
                                onChange={handleEmailChange}
                            />
                            {emailError && (
                                <span style={{ color: '#e53e3e', fontSize: '12px', marginTop: '4px', display: 'block' }}>{emailError}</span>
                            )}
                        </div>

                        <div className="form-row">
                            <div className="form-group">
                                <label>{content.passwordLabel} <span className="required">*</span></label>
                                <div className="password-input-group">
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        className="form-control"
                                        value={password}
                                        onChange={handlePasswordChange}
                                        dir="ltr"
                                    />
                                    <button
                                        type="button"
                                        className="toggle-password-btn"
                                        onClick={() => setShowPassword(!showPassword)}
                                    >
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            {showPassword ? (
                                                <>
                                                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                                                    <circle cx="12" cy="12" r="3"></circle>
                                                </>
                                            ) : (
                                                <>
                                                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                                                    <line x1="1" y1="1" x2="23" y2="23"></line>
                                                </>
                                            )}
                                        </svg>
                                    </button>
                                </div>
                                {passwordError ? (
                                    <span style={{ color: '#e53e3e', fontSize: '12px', marginTop: '4px', display: 'block' }}>{passwordError}</span>
                                ) : (
                                    <span className="input-hint">{content.passwordHint}</span>
                                )}
                            </div>
                            <div className="form-group">
                                <label>{content.confirmPasswordLabel} <span className="required">*</span></label>
                                <div className="password-input-group">
                                    <input
                                        type={showConfirmPassword ? "text" : "password"}
                                        className="form-control"
                                        value={confirmPassword}
                                        onChange={handleConfirmPasswordChange}
                                        dir="ltr"
                                    />
                                    <button
                                        type="button"
                                        className="toggle-password-btn"
                                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                    >
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            {showConfirmPassword ? (
                                                <>
                                                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                                                    <circle cx="12" cy="12" r="3"></circle>
                                                </>
                                            ) : (
                                                <>
                                                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                                                    <line x1="1" y1="1" x2="23" y2="23"></line>
                                                </>
                                            )}
                                        </svg>
                                    </button>
                                </div>
                                {confirmPasswordError && (
                                    <span style={{ color: '#e53e3e', fontSize: '12px', marginTop: '4px', display: 'block' }}>{confirmPasswordError}</span>
                                )}
                            </div>
                        </div>

                        <button type="submit" className="submit-btn">
                            {content.createAccount}
                        </button>

                        <div className="login-link-container">
                            <span className="text-gray">{content.haveAccount}</span>
                            <span className="login-link" onClick={() => navigate('/login')}>{content.login}</span>
                        </div>
                    </form>
                </div>
            </div>

            {/* ============== FOOTER ============== */}
            <div className="mt-12">
                <HomeFooter />
            </div>

            {/* Inspection Status Modal */}
            <InspectionStatusModal
                isOpen={isInspectionModalOpen}
                onClose={() => setIsInspectionModalOpen(false)}
            />

            {showNoAccountPopup && (
                <div className="fixed inset-0 bg-black/35 flex items-center justify-center z-[10002] p-4">
                    <div
                        className="relative overflow-hidden rounded-lg border border-[#d8e6df] bg-white shadow-[0_22px_65px_rgba(15,23,42,0.18)]"
                        style={{ width: `${NO_ACCOUNT_POPUP_WIDTH}px`, minHeight: `${NO_ACCOUNT_POPUP_MIN_HEIGHT}px` }}
                    >
                        <button
                            type="button"
                            onClick={() => {
                                setShowNoAccountPopup(false);
                                navigate('/booking', { replace: true });
                            }}
                            className="absolute left-3 top-3 text-[#6a7f77] hover:text-[#163029] text-lg leading-none"
                            aria-label={language === 'ar' ? 'إغلاق' : 'Close'}
                        >
                            ×
                        </button>

                        <div
                            className="flex items-center justify-center px-7 py-10 text-center"
                            style={{ minHeight: `${NO_ACCOUNT_POPUP_MIN_HEIGHT - 6}px` }}
                        >
                            <p className="text-base font-bold leading-8 text-[#163029]">
                                {noAccountMessage}
                            </p>
                        </div>

                        <div className="px-4 pb-3 text-center text-xs text-[#6a7f77]">
                            {language === 'ar'
                                ? `الانتقال إلى صفحة الحجز خلال ${noAccountCountdown} ثوانٍ`
                                : `Redirecting to booking in ${noAccountCountdown} seconds`}
                        </div>

                        <div className="h-1.5 w-full bg-red-100">
                            <div
                                className="h-full bg-red-600 transition-[width] duration-100 ease-linear"
                                style={{ width: `${noAccountProgress}%` }}
                            />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Register;
