import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useI18n } from '../../shared/i18n';
import InspectionStatusModal from '../../components/Client/InspectionStatusModal';
import HomeFooter from '../../components/Client/HomeFooter';

const Login: React.FC = () => {
  const navigate = useNavigate();
  const { isRTL, language, setLanguage } = useI18n();
  const isArabic = language === 'ar';

  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isInspectionModalOpen, setIsInspectionModalOpen] = useState(false);

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
            <div className="drawer-nav-item" onClick={() => { navigate('/'); setIsDrawerOpen(false); }}>{isArabic ? 'الرئيسية' : 'Home'}</div>
            <div className="drawer-nav-item" onClick={() => { setIsInspectionModalOpen(true); setIsDrawerOpen(false); }}>{isArabic ? 'استعلام عن حالة الفحص' : 'Check Inspection Status'}</div>
            <div className="drawer-nav-item" onClick={() => { navigate('/fees'); setIsDrawerOpen(false); }}>{isArabic ? 'المقابل المالي للفحص' : 'Inspection Fees'}</div>

            <div className="drawer-divider"></div>

            <div className="drawer-action-item" onClick={() => setLanguage(isArabic ? 'en' : 'ar')}>
              <img src="/imgs/home_page/lang-icon.svg" alt="Language" width="20" height="20" />
              <span>{isArabic ? 'English' : 'العربية'}</span>
            </div>
          </div>
        </div>
      </header>

      <div className="login-main-content">
        <div className="login-hero-section" style={{ paddingBottom: '36px' }}>
          <div className="login-header-container">
            <div className="login-breadcrumbs">
              <span onClick={() => navigate('/')} className="login-breadcrumb-link cursor-pointer">{isArabic ? 'الرئيسية' : 'Home'}</span>
              <span className="login-breadcrumb-separator">&lt;</span>
              <span className="login-breadcrumb-current">{isArabic ? 'تسجيل دخول' : 'Login'}</span>
            </div>
            <h1 className="login-main-title" style={{ fontSize: '27px' }}>{isArabic ? 'تسجيل الدخول' : 'Login'}</h1>
          </div>
        </div>

        <div className="login-content-section" style={{ paddingTop: '30px' }}>
          <div className="login-container">
            <h2 style={{ textAlign: 'center', marginBottom: '15px', color: '#1f2f4e', fontSize: '20px', fontWeight: 700 }}>
              {isArabic ? 'اختر نوع الحساب لتسجيل الدخول' : 'Choose account type to login'}
            </h2>

             <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(294px, 1fr))', gap: '20px', maxWidth: '673px', margin: '0 auto' }}>
               <button
                 type="button"
                 onClick={() => navigate('/login/form')}
                 style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '16px', padding: '40px 21px', textAlign: 'center', cursor: 'pointer' }}
               >
                  <div style={{ width: 50, height: 50, borderRadius: '50%', background: '#9ca3af', margin: '0 auto 13px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
                    <img src="/imgs/login/login-login-page.png" alt="تسجيل الدخول" style={{ width: '50%', height: '50%', objectFit: 'contain' }} />
                  </div>
                 <h3 style={{ margin: 0, color: '#12284a', fontSize: '16px', fontWeight: 700 }}>{isArabic ? 'تسجيل الدخول' : 'Login'}</h3>
                 <p style={{ marginTop: 9, color: '#374151', fontSize: '15px', lineHeight: '1.4' }}>{isArabic ? 'للأفراد والجهات المالكة للمركبات' : 'For individuals and vehicle owners'}</p>
               </button>

               <button
                 type="button"
                 onClick={() => navigate('/ns-create-appointment')}
                 style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '16px', padding: '40px 21px', textAlign: 'center', cursor: 'pointer' }}
               >
                  <div style={{ width: 50, height: 50, borderRadius: '50%', background: '#9ca3af', margin: '0 auto 13px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
                    <img src="/imgs/login/non-saudi vehicles.png" alt="للمركبات غير السعودية" style={{ width: '40%', height: '40%', objectFit: 'contain' }} />
                  </div>
                 <h3 style={{ margin: 0, color: '#12284a', fontSize: '16px', fontWeight: 700 }}>{isArabic ? 'للمركبات غير السعودية' : 'Non-Saudi Vehicles'}</h3>
                 <p style={{ marginTop: 9, color: '#374151', fontSize: '15px', lineHeight: '1.4' }}>{isArabic ? 'لغير المقيمين' : 'For non-residents'}</p>
               </button>
            </div>
          </div>
        </div>
      </div>

      <HomeFooter />

      <InspectionStatusModal isOpen={isInspectionModalOpen} onClose={() => setIsInspectionModalOpen(false)} />
    </div>
  );
};

export default Login;
