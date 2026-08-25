import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

interface ProtectedRouteProps {
  children: React.ReactElement;
  requireAdmin?: boolean;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requireAdmin = false,
}) => {
  const { isAuthenticated, isAdmin } = useAuth();
  const location = useLocation();
  const { showToast } = useToast();

  if (!isAuthenticated) {
    showToast('Please sign in to access this page', 'info');
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (requireAdmin && !isAdmin) {
    showToast('Access restricted: Administrator privileges required', 'error');
    return <Navigate to="/equipment" replace />;
  }

  return children;
};
