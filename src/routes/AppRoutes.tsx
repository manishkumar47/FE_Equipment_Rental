import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AppLayout } from '../components/layout/AppLayout';
import { AuthLayout } from '../components/layout/AuthLayout';
import { ProtectedRoute } from './ProtectedRoute';

// Auth Pages
import { Login } from '../pages/Login';
import { Register } from '../pages/Register';
import { ForgotPassword } from '../pages/ForgotPassword';
import { ResetPassword } from '../pages/ResetPassword';

// User Pages
import { Equipment } from '../pages/Equipment';
import { EquipmentDetails } from '../pages/EquipmentDetails';
import { MyRentals } from '../pages/MyRentals';
import { Profile } from '../pages/Profile';

// Admin Pages
import { AdminDashboard } from '../pages/admin/AdminDashboard';
import { AdminEquipment } from '../pages/admin/AdminEquipment';
import { AdminBookings } from '../pages/admin/AdminBookings';
import { AdminReturns } from '../pages/admin/AdminReturns';
import { AdminUsers } from '../pages/admin/AdminUsers';

// 404
import { NotFound } from '../pages/NotFound';

export const AppRoutes: React.FC = () => {
  return (
    <Routes>
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
