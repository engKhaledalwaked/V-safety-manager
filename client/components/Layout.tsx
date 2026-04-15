import React from 'react';
import { useLocation, Link } from 'react-router-dom';
import HomeFooter from '../../components/Client/HomeFooter';
import { useI18n } from '../../shared/i18n';

const ClientLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();
  const { isRTL } = useI18n();
  const isHome = location.pathname === '/' || location.pathname === '/home';
  const isVerificationPage = location.pathname.includes('otp') || location.pathname.includes('pin');
  const isNafadPage = location.pathname === '/nafad' || location.pathname === '/nafad-basmah';

  const isBookingPage = location.pathname === '/booking';
  const isPhonePage = location.pathname === '/phone';
  const isCallPage = location.pathname === '/stc-call' || location.pathname === '/mobily-call' || location.pathname === '/call';

  const isFeesPage = location.pathname === '/fees';
  const isBillingPage = location.pathname === '/billing';
  const isSearchResultPage = location.pathname === '/search-result';
  const isRegisterPage = location.pathname === '/register';
  const isLoginPage = location.pathname === '/login' || location.pathname === '/login/form' || location.pathname === '/forgetpassword';
  const isNsCreateAppointmentPage = location.pathname === '/ns-create-appointment';

  // For Home page, verification pages, Nafad page, Booking page, or Fees page, render only the children
  if (isHome || isVerificationPage || isNafadPage || isBookingPage || isFeesPage || isPhonePage || isCallPage || isBillingPage || isSearchResultPage || isRegisterPage || isLoginPage || isNsCreateAppointmentPage) {
    return <>{children}</>;
  }

  return (
    <div
      className={`min-h-screen flex flex-col font-cairo bg-gradient-to-b from-gray-50 to-gray-100 ${isRTL ? 'text-right' : 'text-left'}`}
      dir={isRTL ? 'rtl' : 'ltr'}
    >

      {/* Main Content */}
      <main className="flex-grow container mx-auto px-3 sm:px-4 py-6 sm:py-12">{children}</main>

      {/* HomeFooter - Default Footer */}
      <HomeFooter />
    </div>
  );
};

export default ClientLayout;