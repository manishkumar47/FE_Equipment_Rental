import { URL } from '../routes/url-constant';
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useToast } from '../context/ToastContext';
import { authApi } from '../api/auth.api';
import { getErrorMessage } from '../api/client';
import { Input } from '../components/atoms/Input';
import { Button } from '../components/atoms/Button';
import { Mail, ArrowLeft, Send, CheckCircle2 } from 'lucide-react';

export const ForgotPassword: React.FC = () => {
  const { showToast } = useToast();
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const trimmedEmail = email.trim();
    if (!trimmedEmail || !/\S+@\S+\.\S+/.test(trimmedEmail)) {
      setError('Please enter a valid email address');
      return;
    }

    setIsLoading(true);
    try {
      await authApi.forgotPassword(trimmedEmail);
      setIsSubmitted(true);
      showToast(t('PASSWORD_RESET_LINK_SENT'), 'success');
    } catch (err: unknown) {
      const msg = getErrorMessage(err);
      setError(msg);
      showToast(msg, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className="bg-white p-8 rounded-xl border border-slate-200/90 shadow-sm text-center">
        <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-4 border border-emerald-100">
          <CheckCircle2 className="w-6 h-6" />
        </div>
        <h2 className="text-xl font-bold text-slate-900 mb-2">Check Your Email</h2>
        <p className="text-sm text-slate-600 mb-6 max-w-sm mx-auto leading-relaxed">
          A reset link has been sent to <span className="font-semibold text-slate-800">{email}</span>. Please check your inbox and spam folder for instructions.
        </p>

        <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 text-xs text-slate-600 mb-6 text-left space-y-2">
          <p className="font-semibold text-slate-800">Security note:</p>
          <ul className="list-disc pl-4 space-y-1">
            <li>The reset link expires in 15 minutes.</li>
            <li>Each reset link can only be used once.</li>
          </ul>
        </div>

        <div className="flex flex-col gap-2">
          <Link to={URL.LOGIN}>
            <Button variant="primary" size="md" className="w-full" leftIcon={<ArrowLeft className="w-4 h-4" />}>
              Back to Sign In
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white p-8 rounded-xl border border-slate-200/90 shadow-sm">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-slate-900 tracking-tight">
          Forgot Password
        </h2>
        <p className="text-xs text-slate-500 mt-1">
          Enter your registered email address and we'll send you a password reset link.
        </p>
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-md bg-rose-50 border border-rose-200 text-xs text-rose-700 font-medium">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Registered Email"
          type="email"
          placeholder="name@company.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          leftIcon={<Mail className="w-4 h-4" />}
          autoFocus
        />

        <Button
          type="submit"
          variant="primary"
          size="md"
          className="w-full mt-2"
          isLoading={isLoading}
          leftIcon={<Send className="w-4 h-4" />}
        >
          Send Reset Link
        </Button>
      </form>

      <div className="mt-6 pt-6 border-t border-slate-100 text-center">
        <Link
          to={URL.LOGIN}
          className="text-xs text-slate-500 hover:text-slate-800 font-medium inline-flex items-center gap-1"
        >
          <ArrowLeft className="w-3 h-3" /> Back to Sign In
        </Link>
      </div>
    </div>
  );
};
