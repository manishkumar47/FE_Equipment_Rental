import { URL } from '../routes/url-constant';
import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { authApi } from '../api/auth.api';
import { getErrorMessage, getRetryAfterSeconds } from '../api/client';
import { Input } from '../components/atoms/Input';
import { Button } from '../components/atoms/Button';
import {
  Mail,
  Lock,
  User,
  UserPlus,
  ArrowLeft,
  KeyRound,
  RotateCw,
  Clock,
  AlertTriangle,
  Edit3,
  ShieldCheck,
} from 'lucide-react';

export const Register: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const { showToast } = useToast();
  const { t } = useTranslation();

  const from =
    (location.state as { from?: { pathname: string } })?.from?.pathname ||
    URL.EQUIPMENT;

  // Step state: 'form' (step 1) or 'otp' (step 2)
  const [step, setStep] = useState<'form' | 'otp'>('form');

  // Step 1 Form fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Step 2 OTP fields
  const [otpDigits, setOtpDigits] = useState<string[]>(['', '', '', '']);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Timers (in seconds)
  const [expirySeconds, setExpirySeconds] = useState(600); // 10 minutes
  const [resendCooldown, setResendCooldown] = useState(120); // 2 minutes

  // UI / Async states
  const [isLoading, setIsLoading] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [tooManyAttempts, setTooManyAttempts] = useState(false);
  const [sessionExpired, setSessionExpired] = useState(false);
  const [errors, setErrors] = useState<{
    name?: string;
    email?: string;
    password?: string;
    confirmPassword?: string;
    otp?: string;
    general?: string;
  }>({});

  // Countdown timer for OTP Expiry (10 minutes)
  useEffect(() => {
    if (step !== 'otp' || expirySeconds <= 0) return;

    const timer = setInterval(() => {
      setExpirySeconds((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [step, expirySeconds]);

  // Countdown timer for Resend Cooldown (2 minutes)
  useEffect(() => {
    if (step !== 'otp' || resendCooldown <= 0) return;

    const timer = setInterval(() => {
      setResendCooldown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [step, resendCooldown]);

  // Auto-focus first OTP input when transitioning to Step 2
  useEffect(() => {
    if (step === 'otp') {
      setTimeout(() => {
        inputRefs.current[0]?.focus();
      }, 50);
    }
  }, [step]);

  const formatTime = (totalSeconds: number) => {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  };

  // Step 1 Validation
  const validateForm = () => {
    const errs: typeof errors = {};
    if (!name.trim()) {
      errs.name = 'Full name is required';
    } else if (name.trim().length < 2) {
      errs.name = 'Name must be at least 2 characters';
    }

    if (!email.trim()) {
      errs.email = 'Email address is required';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      errs.email = 'Please enter a valid email address';
    }

    if (!password) {
      errs.password = 'Password is required';
    } else if (password.length < 8) {
      errs.password = 'Password must be at least 8 characters long';
    }

    if (password !== confirmPassword) {
      errs.confirmPassword = 'Passwords do not match';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // Submit Step 1: Initiate signup & send 4-digit OTP
  const handleInitiateSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    if (!validateForm()) return;

    setIsLoading(true);
    try {
      await authApi.signupInitiate(name.trim(), email.trim(), password);
      // Reset OTP state and timers for a fresh session
      setOtpDigits(['', '', '', '']);
      setExpirySeconds(600);
      setResendCooldown(120);
      setTooManyAttempts(false);
      setSessionExpired(false);
      setStep('otp');
      showToast(t('VERIFICATION_CODE_SENT'), 'success');
    } catch (err: unknown) {
      const retryAfter = getRetryAfterSeconds(err);
      const msg = retryAfter
        ? `Too many requests. Please try again in ${retryAfter} seconds.`
        : getErrorMessage(err);
      setErrors({ general: msg });
      showToast(msg, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle segmented OTP input changes
  const handleOtpChange = (index: number, value: string) => {
    if (tooManyAttempts || expirySeconds <= 0 || isVerifying) return;

    // Allow only numeric digits
    const cleaned = value.replace(/\D/g, '');
    const char = cleaned.slice(-1); // Take last entered digit

    const newDigits = [...otpDigits];
    newDigits[index] = char;
    setOtpDigits(newDigits);
    setErrors((prev) => ({ ...prev, otp: undefined, general: undefined }));

    // Auto-advance focus to next input
    if (char && index < 3) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-submit when all 4 digits are entered
    const fullOtp = newDigits.join('');
    if (fullOtp.length === 4 && newDigits.every((d) => d !== '')) {
      handleVerifyOtp(fullOtp);
    }
  };

  // Handle backspace navigation in OTP inputs
  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  // Handle pasting full 4-digit OTP
  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    if (tooManyAttempts || expirySeconds <= 0 || isVerifying) return;

    const pastedData = e.clipboardData.getData('text').trim().replace(/\D/g, '');
    if (!pastedData) return;

    const digits = pastedData.slice(0, 4).split('');
    const newDigits = ['', '', '', ''];
    digits.forEach((d, idx) => {
      if (idx < 4) newDigits[idx] = d;
    });

    setOtpDigits(newDigits);
    setErrors((prev) => ({ ...prev, otp: undefined, general: undefined }));

    // Focus last filled box
    const nextFocusIndex = Math.min(digits.length, 3);
    inputRefs.current[nextFocusIndex]?.focus();

    if (newDigits.every((d) => d !== '')) {
      handleVerifyOtp(newDigits.join(''));
    }
  };

  // Step 2 Verification Submission with concurrency guard
  const handleVerifyOtp = async (codeToVerify?: string) => {
    const fullCode = codeToVerify || otpDigits.join('');

    if (isVerifying || isLoading) return; // Prevent duplicate requests
    if (fullCode.length !== 4) {
      setErrors({ otp: 'Please enter all 4 digits of the verification code.' });
      return;
    }

    setIsVerifying(true);
    setErrors({});

    try {
      const session = await authApi.signupVerify(email.trim(), fullCode);
      login(session);
      showToast(t('REGISTER_WELCOME', { name: session.name }), 'success');

      if (session.role === 'ADMIN') {
        navigate(URL.ADMIN_DASHBOARD, { replace: true });
      } else {
        navigate(from, { replace: true });
      }
    } catch (err: unknown) {
      const msg = getErrorMessage(err);

      if (msg.toLowerCase().includes('too many failed attempts') || msg.toLowerCase().includes('too many attempts')) {
        setTooManyAttempts(true);
        setErrors({
          general: 'Maximum verification attempts exceeded. Please request a new code.',
        });
      } else if (msg.toLowerCase().includes('expired')) {
        setExpirySeconds(0);
        setErrors({ general: 'Verification code has expired. Please request a new code.' });
      } else if (msg.toLowerCase().includes('session') || msg.toLowerCase().includes('not found')) {
        setSessionExpired(true);
        setErrors({
          general: 'Your verification session expired or was not found. Please start signup again.',
        });
      } else {
        setErrors({ otp: msg });
      }
      showToast(msg, 'error');
    } finally {
      setIsVerifying(false);
    }
  };

  // Resend OTP code
  const handleResendOtp = async () => {
    if (resendCooldown > 0 || isResending) return;

    setIsResending(true);
    setErrors({});

    try {
      await authApi.signupResend(email.trim());
      setOtpDigits(['', '', '', '']);
      setExpirySeconds(600);
      setResendCooldown(120);
      setTooManyAttempts(false);
      setSessionExpired(false);
      showToast(t('VERIFICATION_CODE_RESENT'), 'success');
      setTimeout(() => {
        inputRefs.current[0]?.focus();
      }, 50);
    } catch (err: unknown) {
      const msg = getErrorMessage(err);
      if (msg.toLowerCase().includes('not found') || msg.toLowerCase().includes('no pending')) {
        setSessionExpired(true);
        setErrors({
          general: 'No pending signup session found. Please return to the form and sign up again.',
        });
      } else {
        setErrors({ general: msg });
      }
      showToast(msg, 'error');
    } finally {
      setIsResending(false);
    }
  };

  // ----------------------------------------------------
  // RENDER: STEP 2 - OTP Verification Screen
  // ----------------------------------------------------
  if (step === 'otp') {
    return (
      <div className="bg-white p-6 sm:p-8 rounded-xl border border-slate-200/90 shadow-sm max-w-md mx-auto">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="w-12 h-12 rounded-full bg-blue-50 text-[#1E3A5F] flex items-center justify-center mx-auto mb-3 border border-blue-100">
            <KeyRound className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">
            Verify Your Email
          </h2>
          <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
            We sent a 4-digit verification code to
            <br />
            <span className="font-semibold text-slate-800">{email}</span>
          </p>
        </div>

        {/* General / Critical Errors */}
        {errors.general && (
          <div className="mb-5 p-3.5 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-700 font-medium flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <div className="flex-1">
              {errors.general}
              {sessionExpired && (
                <div className="mt-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="text-xs py-1"
                    onClick={() => setStep('form')}
                  >
                    Return to Sign Up Form
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Expiry Alert */}
        {expirySeconds === 0 && !sessionExpired && (
          <div className="mb-5 p-3.5 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-800 font-medium flex items-start gap-2.5">
            <Clock className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              The verification code has expired. Please request a new code to complete registration.
            </div>
          </div>
        )}

        {/* Too Many Attempts Alert */}
        {tooManyAttempts && (
          <div className="mb-5 p-3.5 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-700 font-medium flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <div>
              Too many incorrect attempts. For security, please request a new verification code.
            </div>
          </div>
        )}

        {/* Segmented 4-Digit Inputs */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleVerifyOtp();
          }}
          className="space-y-6"
        >
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-2 text-center">
              Enter 4-Digit Code
            </label>
            <div className="flex justify-center items-center gap-3">
              {otpDigits.map((digit, idx) => (
                <input
                  key={idx}
                  ref={(el) => {
                    inputRefs.current[idx] = el;
                  }}
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={1}
                  value={digit}
                  disabled={tooManyAttempts || expirySeconds === 0 || isVerifying}
                  onChange={(e) => handleOtpChange(idx, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(idx, e)}
                  onPaste={idx === 0 ? handlePaste : undefined}
                  className={`w-13 h-14 text-center text-2xl font-bold font-mono rounded-lg border transition-all outline-none ${errors.otp
                      ? 'border-rose-400 focus:border-rose-500 focus:ring-2 focus:ring-rose-100 bg-rose-50/30'
                      : 'border-slate-300 focus:border-[#1E3A5F] focus:ring-2 focus:ring-[#1E3A5F]/20 bg-white'
                    } ${tooManyAttempts || expirySeconds === 0
                      ? 'bg-slate-100 text-slate-400 cursor-not-allowed border-slate-200'
                      : 'text-slate-900 shadow-sm'
                    }`}
                  aria-label={`Digit ${idx + 1}`}
                />
              ))}
            </div>

            {errors.otp && (
              <p className="mt-2 text-center text-xs text-rose-600 font-medium">
                {errors.otp}
              </p>
            )}
          </div>

          {/* Expiry Countdown & Resend Control */}
          <div className="flex flex-col items-center gap-2 pt-1">
            <div className="flex items-center gap-1.5 text-xs text-slate-500">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              <span>
                Code expires in{' '}
                <span className="font-mono font-semibold text-slate-700">
                  {formatTime(expirySeconds)}
                </span>
              </span>
            </div>

            <div className="text-xs">
              {resendCooldown > 0 ? (
                <span className="text-slate-400 font-medium">
                  Resend code in{' '}
                  <span className="font-mono font-semibold text-slate-600">
                    {formatTime(resendCooldown)}
                  </span>
                </span>
              ) : (
                <button
                  type="button"
                  onClick={handleResendOtp}
                  disabled={isResending}
                  className="text-[#1E3A5F] font-semibold hover:underline inline-flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
                >
                  <RotateCw className={`w-3.5 h-3.5 ${isResending ? 'animate-spin' : ''}`} />
                  {isResending ? 'Sending new code...' : 'Resend verification code'}
                </button>
              )}
            </div>
          </div>

          {/* Submit Verification Button */}
          <Button
            type="submit"
            variant="primary"
            size="md"
            className="w-full mt-2"
            isLoading={isVerifying}
            disabled={
              tooManyAttempts ||
              expirySeconds === 0 ||
              otpDigits.some((d) => !d)
            }
            leftIcon={<ShieldCheck className="w-4 h-4" />}
          >
            Verify & Create Account
          </Button>
        </form>

        {/* Change Email Action */}
        <div className="mt-6 pt-5 border-t border-slate-100 text-center">
          <button
            type="button"
            onClick={() => {
              setErrors({});
              setStep('form');
            }}
            className="text-xs text-slate-600 hover:text-slate-900 inline-flex items-center gap-1.5 font-medium transition-colors cursor-pointer"
          >
            <Edit3 className="w-3.5 h-3.5 text-slate-400" />
            Wrong email address? <span className="text-[#1E3A5F] font-semibold underline">Change it</span>
          </button>
        </div>
      </div>
    );
  }

  // ----------------------------------------------------
  // RENDER: STEP 1 - Sign Up Form
  // ----------------------------------------------------
  return (
    <div className="bg-white p-6 sm:p-8 rounded-xl border border-slate-200/90 shadow-sm max-w-md mx-auto">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-slate-900 tracking-tight">
          Create an Account
        </h2>
        <p className="text-xs text-slate-500 mt-1">
          Register to reserve equipment and manage your team's rentals
        </p>
      </div>

      {errors.general && (
        <div className="mb-4 p-3 rounded-md bg-rose-50 border border-rose-200 text-xs text-rose-700 font-medium">
          {errors.general}
        </div>
      )}

      <form onSubmit={handleInitiateSignup} className="space-y-4">
        <Input
          label="Full Name"
          placeholder="Jane Doe"
          value={name}
          onChange={(e) => setName(e.target.value)}
          error={errors.name}
          leftIcon={<User className="w-4 h-4" />}
          autoFocus
        />

        <Input
          label="Email Address"
          type="email"
          placeholder="name@company.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          error={errors.email}
          leftIcon={<Mail className="w-4 h-4" />}
          autoComplete="email"
        />

        <Input
          label="Password (min 8 characters)"
          isPassword
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          error={errors.password}
          leftIcon={<Lock className="w-4 h-4" />}
          autoComplete="new-password"
        />

        <Input
          label="Confirm Password"
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
          leftIcon={<UserPlus className="w-4 h-4" />}
        >
          Continue with Verification
        </Button>
      </form>

      <div className="mt-6 pt-6 border-t border-slate-100 text-center">
        <p className="text-xs text-slate-500">
          Already have an account?{' '}
          <Link
            to={URL.LOGIN}
            className="text-[#1E3A5F] font-semibold hover:underline inline-flex items-center gap-1"
          >
            <ArrowLeft className="w-3 h-3" /> Back to Sign In
          </Link>
        </p>
      </div>
    </div>
  );
};
