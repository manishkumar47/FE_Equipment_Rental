import React, { useEffect } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AppLayout } from '../components/layout/AppLayout';
import { AuthLayout } from '../components/layout/AuthLayout';
import { ProtectedRoute } from './ProtectedRoute';
import { useLocale } from '../i18n/useLocale';
import { isSupportedLocale, type LocaleCode } from '../i18n/locales';

// Auth Pages
import { Login } from '../pages/Login';
import { Register } from '../pages/Register';
import { ForgotPassword } from '../pages/ForgotPassword';
import { ResetPassword } from '../pages/ResetPassword';

// User Pages
import { Equipment } from '../pages/Equipment';
import { EquipmentDetails } from '../pages/EquipmentDetails';
import { MyRentals } from '../pages/MyRentals';
import { MyFines } from '../pages/MyFines';
import { Profile } from '../pages/Profile';

// Admin Pages
import { AdminDashboard } from '../pages/admin/AdminDashboard';
import { AdminEquipment } from '../pages/admin/AdminEquipment';
import { AdminBookings } from '../pages/admin/AdminBookings';
import { AdminBookingRequests } from '../pages/admin/AdminBookingRequests';
import { AdminReturns } from '../pages/admin/AdminReturns';
import { AdminUsers } from '../pages/admin/AdminUsers';

// 404
import { NotFound } from '../pages/NotFound';

/**
 * The single place locale is resolved from the URL (see i18n bug #4 - no
 * controller/page should re-derive it another way). A leading /en, /in or
 * /jp segment sets the active locale and is stripped before matching routes,
 * so every <Route path> below is written without a locale prefix. An
 * unprefixed path (e.g. /equipment) is left untouched and keeps whichever
 * locale is currently active (defaultLocale on first load) rather than
 * resetting on every internal navigation.
 */
function useLocaleResolvedLocation() {
  const location = useLocation();
  const { setLocale } = useLocale();

  const segments = location.pathname.split('/').filter(Boolean);
  const maybeLocale = segments[0];
  const hasLocalePrefix = maybeLocale !== undefined && isSupportedLocale(maybeLocale);

  useEffect(() => {
    if (hasLocalePrefix) setLocale(maybeLocale as LocaleCode);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasLocalePrefix, maybeLocale]);

  if (!hasLocalePrefix) return location;

  const strippedPathname = '/' + segments.slice(1).join('/');
  return { ...location, pathname: strippedPathname || '/' };
}

export const AppRoutes: React.FC = () => {
  const resolvedLocation = useLocaleResolvedLocation();
  return (
    <Routes location={resolvedLocation}>
      {/* Public Auth Routes */}
      <Route element={<AuthLayout />}>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
      </Route>

      {/* Main Application Routes */}
      <Route element={<AppLayout />}>
        {/* Default Landing */}
        <Route path="/" element={<Navigate to="/equipment" replace />} />

        {/* Public Browsing */}
        <Route path="/equipment" element={<Equipment />} />
        <Route path="/equipment/:id" element={<EquipmentDetails />} />

        {/* Protected User Routes */}
        <Route
          path="/rentals"
          element={
            <ProtectedRoute>
              <MyRentals />
            </ProtectedRoute>
          }
        />
        <Route
          path="/fines"
          element={
            <ProtectedRoute>
              <MyFines />
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          }
        />

        {/* Protected Admin Routes */}
        <Route
          path="/admin/dashboard"
          element={
            <ProtectedRoute requireAdmin>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/equipment"
          element={
            <ProtectedRoute requireAdmin>
              <AdminEquipment />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/bookings"
          element={
            <ProtectedRoute requireAdmin>
              <AdminBookings />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/booking-requests"
          element={
            <ProtectedRoute requireAdmin>
              <AdminBookingRequests />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/returns"
          element={
            <ProtectedRoute requireAdmin>
              <AdminReturns />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/users"
          element={
            <ProtectedRoute requireAdmin>
              <AdminUsers />
            </ProtectedRoute>
          }
        />

        {/* 404 Catch-all */}
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
};
