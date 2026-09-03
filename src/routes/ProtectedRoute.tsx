import React, { useEffect, useRef } from 'react';
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
  const { isAuthenticated, isAdmin, consumeIntentionalLogout } = useAuth();
  const location = useLocation();
  const { showToast } = useToast();
  const { t } = useTranslation();
  const lastNoticeKeyRef = useRef<string | null>(null);

  useEffect(() => {
    const key = `${isAuthenticated}:${isAdmin}:${requireAdmin}`;
    // Guards against React StrictMode's dev-only double-invocation of effects
    // (mount -> cleanup -> mount) firing this toast twice for one transition.
    if (lastNoticeKeyRef.current === key) return;
    lastNoticeKeyRef.current = key;

    if (!isAuthenticated) {
      if (!consumeIntentionalLogout()) {
        showToast(t('SIGN_IN_REQUIRED'), 'info');
      }
    } else if (requireAdmin && !isAdmin) {
      showToast(t('ADMIN_ACCESS_REQUIRED'), 'error');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, isAdmin, requireAdmin]);

  if (!isAuthenticated) {
    return <Navigate to={URL.LOGIN} state={{ from: location }} replace />;
  }

  if (requireAdmin && !isAdmin) {
    return <Navigate to={URL.EQUIPMENT} replace />;
  }

  return children;
};
