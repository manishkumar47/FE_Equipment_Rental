import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import { authApi } from '../api/auth.api';
import { getErrorMessage } from '../api/client';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { Lock, ArrowLeft, CheckCircle2, AlertTriangle, KeyRound } from 'lucide-react';

export const ResetPassword: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { showToast } = useToast();
  const { logout } = useAuth();
  const { t } = useTranslation();

  const token = searchParams.get('token') || '';

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errors, setErrors] = useState<{
    password?: string;
    confirmPassword?: string;
    general?: string;
  }>({});

  // 1. Missing token state: if token query param is missing, do NOT render the form
  if (!token) {
    return (
      <div className="bg-white p-8 rounded-xl border border-slate-200/90 shadow-sm text-center">
        <div className="w-12 h-12 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center mx-auto mb-4 border border-amber-200">
          <AlertTriangle className="w-6 h-6" />
        </div>
        <h2 className="text-xl font-bold text-slate-900 mb-2">Invalid or Missing Link</h2>
        <p className="text-xs text-slate-600 mb-6 max-w-sm mx-auto leading-relaxed">
          This password reset link is missing a valid security token. Please click the full link in your reset email or request a new password reset.
        </p>

        <div className="flex flex-col gap-2">
          <Link to="/forgot-password">
            <Button variant="primary" size="md" className="w-full" leftIcon={<KeyRound className="w-4 h-4" />}>
              Request New Reset Link
            </Button>
          </Link>
          <Link to="/login">
            <Button variant="ghost" size="sm" className="w-full" leftIcon={<ArrowLeft className="w-4 h-4" />}>
              Back to Sign In
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  // 2. Success state
  if (isSuccess) {
    return (
      <div className="bg-white p-8 rounded-xl border border-slate-200/90 shadow-sm text-center">
        <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-4 border border-emerald-100">
          <CheckCircle2 className="w-6 h-6" />
        </div>
        <h2 className="text-xl font-bold text-slate-900 mb-2">Password Updated</h2>
        <p className="text-xs text-slate-600 mb-6 max-w-sm mx-auto leading-relaxed">
          Your password has been changed successfully. You can now use your new password to sign in.
        </p>
        <Button
          variant="primary"
          size="md"
          className="w-full"
          onClick={() => navigate('/login')}
        >
          Sign In Now
        </Button>
      </div>
    );
  }

  const validate = () => {
    const errs: typeof errors = {};

    if (!password) {
      errs.password = 'New password is required';
    } else if (password.length < 8) {
      errs.password = 'Password must be at least 8 characters long';
    }

    if (!confirmPassword) {
      errs.confirmPassword = 'Confirm your new password';
    } else if (password !== confirmPassword) {
      errs.confirmPassword = 'Passwords do not match';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    if (!validate()) return;

    setIsLoading(true);
    try {
      await authApi.resetPassword(password, token.trim());
      logout();
      setIsSuccess(true);
      showToast(t('PASSWORD_RESET_SUCCESSFULLY'), 'success');
    } catch (err: unknown) {
      const msg = getErrorMessage(err);
      setErrors({ general: msg });
      showToast(msg, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // 3. Valid token: Render reset password form
  return (
    <div className="bg-white p-8 rounded-xl border border-slate-200/90 shadow-sm">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-slate-900 tracking-tight">
          Reset Password
        </h2>
        <p className="text-xs text-slate-500 mt-1">
          Create a new, strong password for your account (minimum 8 characters).
        </p>
      </div>

      {errors.general && (
        <div className="mb-4 p-3 rounded-md bg-rose-50 border border-rose-200 text-xs text-rose-700 font-medium">
          {errors.general}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="New Password (min 8 characters)"
          isPassword
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          error={errors.password}
          leftIcon={<Lock className="w-4 h-4" />}
          autoComplete="new-password"
          autoFocus
        />

        <Input
          label="Confirm New Password"
          isPassword
          placeholder="••••••••"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          error={errors.confirmPassword}
          leftIcon={<Lock className="w-4 h-4" />}
          autoComplete="new-password"
        />

        <Button
          type="submit"
          variant="primary"
          size="md"
          className="w-full mt-2"
          isLoading={isLoading}
          leftIcon={<KeyRound className="w-4 h-4" />}
        >
          Update Password
        </Button>
      </form>

      <div className="mt-6 pt-6 border-t border-slate-100 text-center">
        <Link
          to="/login"
          className="text-xs text-slate-500 hover:text-slate-800 font-medium inline-flex items-center gap-1"
        >
          <ArrowLeft className="w-3 h-3" /> Back to Sign In
        </Link>
      </div>
    </div>
  );
};
