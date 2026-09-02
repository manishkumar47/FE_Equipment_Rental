import { URL } from '../routes/url-constant';
import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { authApi } from '../api/auth.api';
import { getErrorMessage } from '../api/client';
import { Input } from '../components/atoms/Input';
import { Button } from '../components/atoms/Button';
import { Mail, Lock, LogIn, ArrowRight } from 'lucide-react';

export const Login: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const { showToast } = useToast();
  const { t } = useTranslation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string; general?: string }>({});

  const from = (location.state as { from?: { pathname: string } })?.from?.pathname || URL.EQUIPMENT;

  const validate = () => {
    const errs: { email?: string; password?: string } = {};
    if (!email.trim()) {
      errs.email = 'Email address is required';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      errs.email = 'Please enter a valid email address';
    }
    if (!password) {
      errs.password = 'Password is required';
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
      const session = await authApi.login(email.trim(), password);
      login(session);
      showToast(t('LOGIN_WELCOME_BACK', { name: session.name }), 'success');

      if (session.role === 'ADMIN') {
        navigate(URL.ADMIN_DASHBOARD, { replace: true });
      } else {
        navigate(from, { replace: true });
      }
    } catch (err: unknown) {
      const msg = getErrorMessage(err);
      setErrors({ general: msg });
      showToast(msg, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white p-8 rounded-xl border border-slate-200/90 shadow-sm">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-slate-900 tracking-tight">
          Sign In to EquipFlow
        </h2>
        <p className="text-xs text-slate-500 mt-1">
          Enter your credentials to manage bookings and browse equipment
        </p>
      </div>

      {errors.general && (
        <div className="mb-4 p-3 rounded-md bg-rose-50 border border-rose-200 text-xs text-rose-700 font-medium">
          {errors.general}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Email Address"
          type="email"
          placeholder="name@company.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          error={errors.email}
          leftIcon={<Mail className="w-4 h-4" />}
          autoComplete="email"
          autoFocus
        />

        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-700 select-none">
              Password
            </label>
            <Link
              to={URL.FORGOT_PASSWORD}
              className="text-xs text-[#1E3A5F] hover:underline font-medium"
            >
              Forgot password?
            </Link>
          </div>
          <Input
            isPassword
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            error={errors.password}
            leftIcon={<Lock className="w-4 h-4" />}
            autoComplete="current-password"
          />
        </div>

        <Button
          type="submit"
          variant="primary"
          size="md"
          className="w-full mt-2"
          isLoading={isLoading}
          leftIcon={<LogIn className="w-4 h-4" />}
        >
          Sign In
        </Button>
      </form>

      <div className="mt-6 pt-6 border-t border-slate-100 text-center">
        <p className="text-xs text-slate-500">
          Don't have an account yet?{' '}
          <Link
            to={URL.REGISTER}
            className="text-[#1E3A5F] font-semibold hover:underline inline-flex items-center gap-1"
          >
            Create account <ArrowRight className="w-3 h-3" />
          </Link>
        </p>
      </div>
    </div>
  );
};
