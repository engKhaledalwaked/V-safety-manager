import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useI18n } from '../../shared/i18n';
import { socketService } from '../../services/socketService';
import InspectionStatusModal from '../../components/Client/InspectionStatusModal';
import HomeFooter from '../../components/Client/HomeFooter';
import { validateNationalID } from '../../shared/validation';
import { setAuthSession } from '../../shared/utils';
import './Login.css';

const passwordRule = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;
const arabicCharacterRule = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF]/;
const arabicDigitRule = /[٠-٩۰-۹]/;
const NO_ACCOUNT_POPUP_WIDTH = 320;
const NO_ACCOUNT_POPUP_MIN_HEIGHT = 100;

const toEnglishDigits = (value: string): string =>
  value
    .replace(/[٠-٩]/g, (digit) => String('٠١٢٣٤٥٦٧٨٩'.indexOf(digit)))
    .replace(/[۰-۹]/g, (digit) => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(digit)));

const normalizeNationalIdInput = (value: string): string => {
  const digitsOnly = toEnglishDigits(value).replace(/[^0-9]/g, '').slice(0, 10);
  if (digitsOnly.length > 0 && digitsOnly[0] !== '1' && digitsOnly[0] !== '2') {
    return '';
  }
  return digitsOnly;
};

const ForgetPassword: React.FC = () => {
  const navigate = useNavigate();
  const { isRTL, language, setLanguage } = useI18n();

  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isInspectionModalOpen, setIsInspectionModalOpen] = useState(false);

  const [nationalId, setNationalId] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [nationalIdError, setNationalIdError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [confirmPasswordError, setConfirmPasswordError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState('');

  const [showOtpModal, setShowOtpModal] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [otpError, setOtpError] = useState('');
  const [otpLoading, setOtpLoading] = useState(false);
  const [canResendOtp, setCanResendOtp] = useState(false);
  const [resendTimer, setResendTimer] = useState(180);
  const [showResetSuccessModal, setShowResetSuccessModal] = useState(false);
  const [resetSuccessCountdown, setResetSuccessCountdown] = useState(5);
  const [approvedCustomerName, setApprovedCustomerName] = useState('');
  const [showNoAccountPopup, setShowNoAccountPopup] = useState(false);
  const [noAccountMessage, setNoAccountMessage] = useState('');
  const [noAccountCountdown, setNoAccountCountdown] = useState(5);
  const [noAccountProgress, setNoAccountProgress] = useState(100);

  const isArabic = language === 'ar';

  const passwordHint = useMemo(
    () =>
      isArabic
        ? 'يجب أن تحتوي كلمة المرور على 8 أحرف أو أكثر مع حرف كبير وحرف صغير ورقم ورمز خاص، وأن تكون بدون أحرف أو أرقام عربية.'
        : 'Password must be at least 8 characters, include uppercase, lowercase, number, and special character, and must not contain Arabic letters or Arabic numerals.',
    [isArabic]
  );

  const validateNationalId = () => {
    const normalizedNationalId = normalizeNationalIdInput(nationalId);

    if (!normalizedNationalId) {
      setNationalIdError(isArabic ? 'رقم الهوية / رقم الإقامة مطلوب' : 'National ID / Iqama is required');
      return false;
    }

    if (normalizedNationalId.length !== 10) {
      setNationalIdError(isArabic ? 'رقم الهوية / الإقامة يجب أن يتكون من 10 أرقام' : 'National ID / Iqama must be 10 digits');
      return false;
    }

    const validation = validateNationalID(normalizedNationalId);
    if (!validation.valid) {
      setNationalIdError(validation.error || (isArabic ? 'رقم الهوية غير صالح' : 'Invalid ID number'));
      return false;
    }

    setNationalIdError('');
    return true;
  };

  const validatePassword = () => {
    if (!password) {
      setPasswordError(isArabic ? 'كلمة المرور الجديدة مطلوبة' : 'New password is required');
      return false;
    }

    if (arabicCharacterRule.test(password) || arabicDigitRule.test(password)) {
      setPasswordError(
        isArabic
          ? 'يجب إدخال كلمة المرور بأحرف وأرقام إنجليزية فقط، بدون أحرف أو أرقام عربية.'
          : 'Password must use English letters and numbers only, without Arabic letters or Arabic numerals.'
      );
      return false;
    }

    if (!passwordRule.test(password)) {
      setPasswordError(passwordHint);
      return false;
    }

    setPasswordError('');
    return true;
  };

  const validateConfirmPassword = () => {
    if (!confirmPassword) {
      setConfirmPasswordError(isArabic ? 'تأكيد كلمة المرور مطلوب' : 'Password confirmation is required');
      return false;
    }

    if (confirmPassword !== password) {
      setConfirmPasswordError(isArabic ? 'تأكيد كلمة المرور يجب أن يطابق كلمة المرور تمامًا' : 'Password confirmation must exactly match the password');
      return false;
    }

    setConfirmPasswordError('');
    return true;
  };

  useEffect(() => {
    socketService.connect();

    const handleApproved = () => {
      setLoading(false);
      setServerError('');
      setShowOtpModal(true);
      setResendTimer(180);
      setCanResendOtp(false);
    };

    const handleRejected = (data: { message?: string }) => {
      setLoading(false);
      setServerError(
        data?.message ||
          (isArabic
            ? 'تعذر تنفيذ طلب استعادة كلمة السر. يرجى المحاولة مرة أخرى.'
            : 'Unable to process the password reset request. Please try again.')
      );
    };

    socketService.on('passwordResetApproved', handleApproved);
    socketService.on('passwordResetRejected', handleRejected);

    return () => {
      socketService.off('passwordResetApproved', handleApproved);
      socketService.off('passwordResetRejected', handleRejected);
    };
  }, [isArabic]);

  useEffect(() => {
    const handleNoAccount = (data: { message?: string; durationMs?: number }) => {
      const durationMs = Number(data?.durationMs) > 0 ? Number(data.durationMs) : 8000;
      setLoading(false);
      setServerError('');
      setShowOtpModal(false);
      setOtpLoading(false);
      setOtpCode('');
      setNoAccountMessage(
        data?.message ||
          (isArabic
            ? 'هذا المستخدم ليس لديه حساب'
            : 'This user does not have an account')
      );
      setNoAccountCountdown(Math.max(1, Math.ceil(durationMs / 1000)));
      setNoAccountProgress(100);
      setShowNoAccountPopup(true);
    };

    socketService.on('passwordResetNoAccount', handleNoAccount);

    return () => {
      socketService.off('passwordResetNoAccount', handleNoAccount);
    };
  }, [isArabic]);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (showOtpModal && !canResendOtp && resendTimer > 0) {
      timer = setInterval(() => {
        setResendTimer((prev) => {
          if (prev <= 1) {
            setCanResendOtp(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [showOtpModal, canResendOtp, resendTimer]);

  useEffect(() => {
    const handleOtpApproved = (data: { flow?: string; customerName?: string }) => {
      if (String(data?.flow || 'default').trim().toLowerCase() !== 'password-reset') {
        return;
      }

      const safeCustomerName = String(data?.customerName || '').trim() || (isArabic ? 'العميل' : 'Customer');
      setOtpLoading(false);
      setShowOtpModal(false);
      setOtpCode('');
      setApprovedCustomerName(safeCustomerName);
      setResetSuccessCountdown(5);
      setShowResetSuccessModal(true);
    };

    const handleOtpRejected = (data: { message?: string; flow?: string }) => {
      if (String(data?.flow || 'default').trim().toLowerCase() !== 'password-reset') {
        return;
      }

      setOtpLoading(false);
      setOtpError(data?.message || (isArabic ? 'رمز OTP غير صحيح' : 'Invalid OTP code'));
      setOtpCode('');
    };

    socketService.on('otpPhoneApproved', handleOtpApproved);
    socketService.on('otpPhoneRejected', handleOtpRejected);

    return () => {
      socketService.off('otpPhoneApproved', handleOtpApproved);
      socketService.off('otpPhoneRejected', handleOtpRejected);
    };
  }, [isArabic]);

  useEffect(() => {
    if (!showResetSuccessModal) return;

    const intervalId = window.setInterval(() => {
      setResetSuccessCountdown((prev) => {
        if (prev <= 1) {
          window.clearInterval(intervalId);
          setAuthSession(approvedCustomerName || (isArabic ? 'العميل' : 'Customer'));
          navigate('/', { replace: true });
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [showResetSuccessModal, navigate, approvedCustomerName, isArabic]);

  useEffect(() => {
    if (!showNoAccountPopup) return;

    const startedAt = Date.now();
    const durationMs = 8000;

    const progressTimer = window.setInterval(() => {
      const elapsed = Date.now() - startedAt;
      const remaining = Math.max(0, durationMs - elapsed);
      setNoAccountProgress((remaining / durationMs) * 100);
      setNoAccountCountdown(Math.max(0, Math.ceil(remaining / 1000)));

      if (remaining <= 0) {
        window.clearInterval(progressTimer);
        setShowNoAccountPopup(false);
      }
    }, 100);

    return () => {
      window.clearInterval(progressTimer);
    };
  }, [showNoAccountPopup]);

  const handleOtpSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (otpCode.length !== 4) {
      setOtpError(isArabic ? 'يرجى إدخال رمز OTP من 4 أرقام' : 'Please enter a 4-digit OTP code');
      return;
    }

    setOtpError('');
    setOtpLoading(true);
    socketService.emitClientEvent('submitPhoneOtp', { code: otpCode, flow: 'password-reset' });
  };

  const handleResendOtp = () => {
    if (!canResendOtp) return;
    setCanResendOtp(false);
    setResendTimer(60);
    socketService.emitClientEvent('submitPhoneOtpResendNotification', {});
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const idValid = validateNationalId();
    const passwordValid = validatePassword();
    const confirmPasswordValid = validateConfirmPassword();

    if (!idValid || !passwordValid || !confirmPasswordValid) return;

    setLoading(true);
    setServerError('');

    const normalizedNationalId = normalizeNationalIdInput(nationalId);

    socketService.emitClientEvent('submitPasswordReset', {
      username: normalizedNationalId,
      password,
      confirmPassword
    });
  };

  return (
    <div className="login-page pti-home" dir={isRTL ? 'rtl' : 'ltr'}>
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
            <img src="/imgs/home_page/logo.svg" alt="سلامة المركبات" />
          </div>

          <div className="header-nav">
            <div className="header-nav-item" onClick={() => navigate('/')} style={{ cursor: 'pointer' }}>
              {isArabic ? 'الرئيسية' : 'Home'}
            </div>
            <div className="header-nav-item" onClick={() => setIsInspectionModalOpen(true)} style={{ cursor: 'pointer' }}>
              {isArabic ? 'استعلام عن حالة الفحص' : 'Check Inspection Status'}
            </div>
            <div className="header-nav-item" onClick={() => navigate('/fees')} style={{ cursor: 'pointer' }}>
              {isArabic ? 'المقابل المالي للفحص' : 'Inspection Fees'}
            </div>
          </div>

          <div className="header-actions">
            <div className="header-lang" onClick={() => setLanguage(isArabic ? 'en' : 'ar')} style={{ cursor: 'pointer' }}>
              <span>{isArabic ? 'English' : 'العربية'}</span>
              <img src="/imgs/home_page/lang-icon.svg" alt="Language" />
            </div>
          </div>
        </div>
      </header>

      <div className="login-main-content">
        <div className="login-hero-section form-hero">
          <div className="login-header-container">
            <div className="login-breadcrumbs">
              <span onClick={() => navigate('/')} className="login-breadcrumb-link cursor-pointer">
                {isArabic ? 'الرئيسية' : 'Home'}
              </span>
              <span className="login-breadcrumb-separator">&lt;</span>
              <span className="login-breadcrumb-current">{isArabic ? 'استعادة كلمة السر' : 'Password Reset'}</span>
            </div>
            <h1 className="login-main-title">{isArabic ? 'استعادة كلمة السر' : 'Password Reset'}</h1>
          </div>
        </div>

        <div className="login-content-section form-content">
          <div className="login-container">
            <div className="login-form-card">
              <div className="login-form-icon">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                  <circle cx="12" cy="7" r="4"></circle>
                </svg>
              </div>
              <h2 className="login-form-card-title">{isArabic ? 'استعادة كلمة السر' : 'Password Reset'}</h2>

              <form className="login-form" onSubmit={handleSubmit}>
                <div className="form-group">
                  <label>{isArabic ? 'رقم الهوية / رقم الإقامة' : 'National ID / Iqama'} <span className="required-star">*</span></label>
                  <input
                    type="text"
                    className={`form-input ${nationalIdError ? 'error' : ''}`}
                    value={nationalId}
                    maxLength={10}
                    onChange={(e) => {
                      const value = normalizeNationalIdInput(e.target.value);
                      setNationalId(value);
                      if (!value) {
                        setNationalIdError('');
                        return;
                      }

                      if (value.length < 10) {
                        setNationalIdError(isArabic ? 'رقم الهوية / الإقامة يجب أن يتكون من 10 أرقام' : 'National ID / Iqama must be 10 digits');
                        return;
                      }

                      const validation = validateNationalID(value);
                      if (!validation.valid) {
                        setNationalIdError(validation.error || (isArabic ? 'رقم الهوية غير صالح' : 'Invalid ID number'));
                        return;
                      }

                      setNationalIdError('');
                    }}
                    onBlur={validateNationalId}
                    dir="ltr"
                  />
                  {nationalIdError && <div className="error-text">{nationalIdError}</div>}
                </div>

                <div className="form-group mt-input">
                  <label>{isArabic ? 'كلمة المرور الجديدة' : 'New Password'} <span className="required-star">*</span></label>
                  <div className="password-input-wrap">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      className={`form-input password-field ${passwordError ? 'error' : ''}`}
                      value={password}
                      maxLength={64}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        if (passwordError) setPasswordError('');
                        if (confirmPasswordError && confirmPassword === e.target.value) setConfirmPasswordError('');
                      }}
                      onBlur={validatePassword}
                      dir="ltr"
                    />
                    <button type="button" className="toggle-password" onClick={() => setShowPassword(!showPassword)}>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
                  <div className="mt-2" style={{ color: passwordError ? '#ef4444' : '#6b7280', fontSize: '12px', lineHeight: '1.6', textAlign: isRTL ? 'right' : 'left' }}>
                    {passwordError || passwordHint}
                  </div>
                </div>

                <div className="form-group mt-input">
                  <label>{isArabic ? 'تأكيد كلمة المرور' : 'Confirm Password'} <span className="required-star">*</span></label>
                  <div className="password-input-wrap">
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      className={`form-input password-field ${confirmPasswordError ? 'error' : ''}`}
                      value={confirmPassword}
                      maxLength={64}
                      onChange={(e) => {
                        setConfirmPassword(e.target.value);
                        if (confirmPasswordError) setConfirmPasswordError('');
                      }}
                      onBlur={validateConfirmPassword}
                      dir="ltr"
                    />
                    <button type="button" className="toggle-password" onClick={() => setShowConfirmPassword(!showConfirmPassword)}>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
                  {confirmPasswordError && <div className="error-text">{confirmPasswordError}</div>}
                </div>

                {serverError && (
                  <div className="error-text" style={{ marginBottom: '12px', fontSize: '13px' }}>
                    {serverError}
                  </div>
                )}

                <button type="submit" className="login-submit-btn" disabled={loading}>
                  {loading ? (isArabic ? 'جاري الإرسال...' : 'Submitting...') : (isArabic ? 'استعادة كلمة السر' : 'Reset Password')}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>

      {showOtpModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[1000] p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full animate-fadeIn">
            <div className="p-6 text-center" style={{ background: 'linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%)' }}>
              <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 11c1.657 0 3-1.567 3-3.5S13.657 4 12 4 9 5.567 9 7.5 10.343 11 12 11zm-7 9a7 7 0 0114 0" />
                </svg>
              </div>

              <h3 className="text-xl font-bold text-gray-800 mb-2">
                {isArabic ? 'التحقق من رمز OTP' : 'OTP Verification'}
              </h3>
              <p className="text-gray-700 mb-6">
                {isArabic
                  ? 'تم إرسال رمز التحقق من 4 أرقام إلى رقم الجوال المسجل'
                  : 'A 4-digit verification code has been sent to your registered mobile number'}
              </p>

              <form onSubmit={handleOtpSubmit} className="space-y-4">
                <div className="flex justify-center gap-3" dir="ltr">
                  {[0, 1, 2, 3].map((index) => (
                    <input
                      key={index}
                      type="text"
                      maxLength={1}
                      value={otpCode[index] || ''}
                      onChange={(e) => {
                        const value = e.target.value.replace(/\D/g, '');
                        const newCode = otpCode.split('');
                        const targetInput = e.target as HTMLInputElement;
                        if (value.length > 0) {
                          newCode[index] = value;
                          setOtpCode(newCode.join(''));
                          if (index < 3 && value) {
                            const nextInput = targetInput.nextElementSibling as HTMLInputElement;
                            if (nextInput) {
                              nextInput.focus();
                            }
                          }
                        } else if (value === '') {
                          newCode[index] = '';
                          setOtpCode(newCode.join(''));
                        }
                        if (otpError) setOtpError('');
                      }}
                      onKeyDown={(e) => {
                        const targetInput = e.target as HTMLInputElement;
                        if (e.key === 'Backspace') {
                          e.preventDefault();
                          if (!otpCode[index] && index > 0) {
                            const prevInput = targetInput.previousElementSibling as HTMLInputElement;
                            if (prevInput) {
                              prevInput.focus();
                            }
                          } else if (otpCode[index]) {
                            const newCode = otpCode.split('');
                            newCode[index] = '';
                            setOtpCode(newCode.join(''));
                          }
                        } else if (e.key === 'ArrowLeft' && index > 0) {
                          e.preventDefault();
                          const prevInput = targetInput.previousElementSibling as HTMLInputElement;
                          if (prevInput) {
                            prevInput.focus();
                          }
                        } else if (e.key === 'ArrowRight' && index < 3) {
                          e.preventDefault();
                          const nextInput = targetInput.nextElementSibling as HTMLInputElement;
                          if (nextInput) {
                            nextInput.focus();
                          }
                        } else if (e.key.length === 1 && !/\d/.test(e.key)) {
                          e.preventDefault();
                        }
                      }}
                      className="w-16 h-16 border-2 border-gray-300 rounded-lg text-center text-xl font-mono bg-white focus:border-gray-500 focus:bg-gray-50 outline-none transition-all"
                    />
                  ))}
                </div>
                {otpError && <p className="mt-2 text-sm text-red-600">{otpError}</p>}

                <div className="flex items-center justify-center gap-2 text-sm text-gray-600">
                  {canResendOtp ? (
                    <button
                      type="button"
                      onClick={handleResendOtp}
                      className="text-gray-600 hover:text-gray-700 font-semibold underline"
                    >
                      {isArabic ? 'إعادة إرسال الرمز' : 'Resend Code'}
                    </button>
                  ) : (
                    <>
                      <span>{isArabic ? 'يمكن إعادة إرسال الرمز بعد' : 'Resend available in'}</span>
                      <span className="text-gray-700 font-bold">
                        {Math.floor(resendTimer / 60).toString().padStart(2, '0')}:
                        {(resendTimer % 60).toString().padStart(2, '0')}
                      </span>
                      <span>{isArabic ? 'دقيقة' : 'minutes'}</span>
                    </>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={otpLoading || otpCode.length !== 4}
                  className="w-full bg-gradient-to-r from-gray-100 to-gray-200 hover:from-gray-200 hover:to-gray-300 text-gray-800 font-bold py-3 rounded-xl shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  {otpLoading ? (isArabic ? 'جاري التحقق...' : 'Verifying...') : (isArabic ? 'تأكيد' : 'Confirm')}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      <div>
        <HomeFooter />
      </div>

      <InspectionStatusModal isOpen={isInspectionModalOpen} onClose={() => setIsInspectionModalOpen(false)} />

      {loading && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[9999] p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm text-center border border-gray-100">
            <div className="flex justify-center mb-4">
              <div className="w-14 h-14 rounded-full border-4 border-[#0A4D32] border-t-transparent animate-spin" />
            </div>
            <h3 className="text-lg font-bold text-gray-800 mb-2">{isArabic ? 'يرجى الانتظار' : 'Please wait'}</h3>
            <p className="text-sm text-gray-600">
              {isArabic ? 'جاري التحقق من طلب استعادة كلمة السر...' : 'Verifying the password reset request...'}
            </p>
          </div>
        </div>
      )}

      {showResetSuccessModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[10001] p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-emerald-100 animate-fadeIn">
            <div className="px-6 py-8 text-center">
              <p className="text-gray-800 text-xl font-bold mb-3">
                {isArabic ? 'تمت استعادة الحساب' : 'Account restored'}
              </p>
              <p className="text-gray-700 text-lg font-semibold">
                {isArabic
                  ? `مرحبا ${approvedCustomerName || 'العميل'}`
                  : `Welcome ${approvedCustomerName || 'Customer'}`}
              </p>
            </div>
          </div>
        </div>
      )}

      {showNoAccountPopup && (
        <div className="fixed inset-0 bg-black/35 flex items-center justify-center z-[10002] p-4">
          <div
            className="relative overflow-hidden rounded-lg border border-[#d8e6df] bg-white shadow-[0_22px_65px_rgba(15,23,42,0.18)]"
            style={{ width: `${NO_ACCOUNT_POPUP_WIDTH}px`, minHeight: `${NO_ACCOUNT_POPUP_MIN_HEIGHT}px` }}
          >
            <button
              type="button"
              onClick={() => setShowNoAccountPopup(false)}
              className="absolute left-3 top-3 text-[#6a7f77] hover:text-[#163029] text-lg leading-none"
              aria-label={isArabic ? 'إغلاق' : 'Close'}
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

export default ForgetPassword;
