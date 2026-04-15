import React from 'react';
import { useLocation, Link } from 'react-router-dom';
import { LanguageToggle, useI18n } from '../../shared/i18n';

import HomeFooter from './HomeFooter';

const ClientLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();
  const isHome = location.pathname === '/' || location.pathname === '/home';
  const { t, isRTL } = useI18n();

  return (
    <div className={`min-h-screen flex flex-col font-cairo bg-gray-50 text-${isRTL ? 'right' : 'left'}`} dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-40">
        <div className="container mx-auto px-3 sm:px-4 py-3 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div className="font-bold text-lg sm:text-xl text-brand">{t('appName')}</div>
          </div>
          <nav className="hidden md:flex gap-6 text-sm font-medium text-gray-600">
            <Link to="/home" className="hover:text-brand transition-colors">{t('homeTitle')}</Link>
            <a href="#" className="hover:text-brand transition-colors">{t('aboutService')}</a>
            <a href="#" className="hover:text-brand transition-colors">{t('inspectionCenters')}</a>
            <a href="#" className="hover:text-brand transition-colors">{t('contactUs')}</a>
          </nav>
          <LanguageToggle className="text-gray-500 hover:text-brand" />
        </div>
      </header>

      {/* Hero for Home only */}
      {isHome && (
        <div className="bg-brand text-white py-8 sm:py-12 md:py-20 relative overflow-hidden">
          <div className="container mx-auto px-3 sm:px-4 relative z-10">
            <h1 className="text-2xl sm:text-3xl md:text-5xl font-bold mb-3 sm:mb-4">{t('periodicTechnicalInspection')}</h1>
            <p className="text-sm sm:text-lg opacity-90 max-w-xl mb-6 sm:mb-8">
              {t('appDescription')}
            </p>
          </div>
          <div className="absolute top-0 left-0 w-full h-full opacity-10 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]"></div>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-grow w-full max-w-[1500px] mx-auto px-3 sm:px-4 py-6 sm:py-8">
        {children}
      </main>

      {/* Footer */}
      <HomeFooter />
    </div>
  );
};

export default ClientLayout;