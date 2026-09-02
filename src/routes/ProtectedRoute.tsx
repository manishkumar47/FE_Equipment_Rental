import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { URL } from './url-constant';

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
  const { t } = useTranslation();

  if (!isAuthenticated) {
    showToast(t('SIGN_IN_REQUIRED'), 'info');
    return <Navigate to={URL.LOGIN} state={{ from: location }} replace />;
  }

  if (requireAdmin && !isAdmin) {
    showToast(t('ADMIN_ACCESS_REQUIRED'), 'error');
    return <Navigate to={URL.EQUIPMENT} replace />;
  }

  return children;
};
