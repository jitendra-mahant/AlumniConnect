import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  KeyRound,
  Loader2,
  Mail,
  Moon,
  RefreshCw,
  Sun,
} from 'lucide-react';
import { Logo } from '../components/Layout';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import api, { errorMessage } from '../api/client';
import { applyTheme, getInitialTheme } from '../utils/theme';

export default function VerifyEmail() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { verifyOtp } = useAuth();
  const toast = useToast();

  const [email, setEmail] = useState(params.get('email') || '');
  const [editingEmail, setEditingEmail] = useState(!params.get('email'));
  const [digits, setDigits] = useState(['', '', '', '', '', '']);
  const [busy, setBusy] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [countdown, setCountdown] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const [theme, setTheme] = useState(getInitialTheme);

  const inputRefs = useRef([]);

  // Setup theme
  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    applyTheme(nextTheme);
  };

  // Focus first input box on load if email exists
  useEffect(() => {
    if (email && inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, [email]);

  // Resend countdown timer
  useEffect(() => {
    if (countdown > 0) {
      setCanResend(false);
      const timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            setCanResend(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    } else {
      setCanResend(true);
    }
  }, [countdown]);

  // Handle single digit input
  const handleChange = (index, value) => {
    // Only accept numeric digit
    const cleaned = value.replace(/\D/g, '');
    if (!cleaned) {
      const newDigits = [...digits];
      newDigits[index] = '';
      setDigits(newDigits);
      return;
    }

    const lastChar = cleaned.slice(-1);
    const newDigits = [...digits];
    newDigits[index] = lastChar;
    setDigits(newDigits);
    setError('');

    // Advance to next input
    if (index < 5 && lastChar) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  // Handle Backspace and Navigation Keys
  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace') {
      if (!digits[index] && index > 0) {
        inputRefs.current[index - 1]?.focus();
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowRight' && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  // Handle Paste Event (Support pasting whole 6-digit code)
  const handlePaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').trim().replace(/\D/g, '');
    if (!pasted) return;

    const newDigits = [...digits];
    for (let i = 0; i < 6; i++) {
      newDigits[i] = pasted[i] || '';
    }
    setDigits(newDigits);
    setError('');

    const focusIndex = Math.min(pasted.length, 5);
    inputRefs.current[focusIndex]?.focus();

    // If a full 6-digit code was pasted and email is set, trigger verification
    if (pasted.length === 6 && email.trim()) {
      executeVerification(email.trim(), pasted.slice(0, 6));
    }
  };

  const executeVerification = async (targetEmail, otpCode) => {
    if (!targetEmail) {
      setError('Please provide your official college email address.');
      return;
    }
    if (otpCode.length !== 6) {
      setError('Please enter all 6 digits of the verification code.');
      return;
    }

    setBusy(true);
    setError('');

    try {
      const data = await verifyOtp(targetEmail, otpCode);
      setSuccess(true);
      toast.success(data.message || 'Email verified successfully! Welcome to AlumniConnect.');
      setTimeout(() => {
        const user = data.user;
        const target =
          user?.role === 'admin'
            ? '/admin'
            : user?.role === 'teacher'
            ? '/teacher/dashboard'
            : '/dashboard';
        navigate(target, { replace: true });
      }, 1500);
    } catch (err) {
      setError(errorMessage(err, 'Verification failed. Please check the code and try again.'));
    } finally {
      setBusy(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const code = digits.join('');
    executeVerification(email.trim(), code);
  };

  const handleResend = async () => {
    if (!canResend || resending) return;
    if (!email.trim()) {
      setError('Please enter your official college email address.');
      return;
    }

    setResending(true);
    setError('');

    try {
      const res = await api.post('/auth/resend-otp', { email: email.trim() });
      toast.success(res.data.message || 'New verification code dispatched to your inbox.');
      setCountdown(res.data.cooldown || 60);
      setDigits(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } catch (err) {
      setError(errorMessage(err, 'Failed to resend code. Please try again.'));
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center bg-slate-50 dark:bg-slate-950 px-4 py-12 transition-colors">
      {/* Theme Toggle Button at top-right */}
      <div className="fixed top-4 right-4 sm:top-5 sm:right-6 z-50">
        <button
          type="button"
          onClick={toggleTheme}
          aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          className="flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white/95 px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-md backdrop-blur hover:bg-slate-100 hover:text-slate-900 dark:border-slate-700 dark:bg-slate-800/95 dark:text-slate-200 dark:hover:bg-slate-700 dark:hover:text-white transition"
        >
          {theme === 'dark' ? (
            <>
              <Sun className="h-4 w-4 text-amber-400" />
              <span>Light mode</span>
            </>
          ) : (
            <>
              <Moon className="h-4 w-4 text-slate-600" />
              <span>Dark mode</span>
            </>
          )}
        </button>
      </div>

      <div className="mb-6">
        <Link to="/" aria-label="AlumniConnect KKWAGH Home">
          <Logo />
        </Link>
      </div>

      <div className="w-full max-w-md rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 sm:p-8 shadow-card transition-colors">
        {success ? (
          <div className="py-6 text-center space-y-4">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 animate-bounce">
              <CheckCircle2 className="h-10 w-10" />
            </div>
            <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">Email Verified!</h1>
            <p className="text-sm text-slate-600 dark:text-slate-300">
              Your official institutional email address has been successfully verified. Logging you in...
            </p>
            <div className="pt-2">
              <div className="h-1.5 w-full bg-emerald-100 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500 animate-pulse w-full"></div>
              </div>
            </div>
          </div>
        ) : (
          <div>
            <div className="text-center mb-6">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-brand-50 dark:bg-brand-950/60 text-brand-600 dark:text-brand-400">
                <KeyRound className="h-6 w-6" />
              </div>
              <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                Enter Verification Code
              </h1>
              <p className="mt-1.5 text-xs text-slate-600 dark:text-slate-300">
                We sent a 6-digit confirmation code via Brevo to your official college email.
              </p>

              {/* Email display / edit toggle */}
              <div className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-slate-100 dark:bg-slate-800 px-3 py-1 text-xs font-medium text-slate-700 dark:text-slate-300">
                <Mail className="h-3.5 w-3.5 text-brand-600 dark:text-brand-400 shrink-0" />
                <span className="font-semibold">{email || 'No email specified'}</span>
                <button
                  type="button"
                  onClick={() => setEditingEmail(!editingEmail)}
                  className="ml-1 text-[11px] text-brand-600 dark:text-brand-400 hover:underline"
                >
                  {editingEmail ? 'Hide' : 'Change'}
                </button>
              </div>

              {editingEmail && (
                <div className="mt-3">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="username@kkwagh.edu.in"
                    className="input text-xs text-center py-1.5"
                  />
                </div>
              )}
            </div>

            {error && (
              <div
                role="alert"
                className="mb-5 rounded-lg border border-red-200 dark:border-red-900/60 bg-red-50 dark:bg-red-950/40 p-3 text-xs text-red-700 dark:text-red-300 flex items-start gap-2"
              >
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-600 dark:text-red-400" />
                <span className="leading-relaxed">{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* 6-Digit OTP Box Grid */}
              <div className="flex justify-center items-center gap-2 sm:gap-3" onPaste={handlePaste}>
                {digits.map((digit, idx) => (
                  <input
                    key={idx}
                    ref={(el) => (inputRefs.current[idx] = el)}
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleChange(idx, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(idx, e)}
                    className="h-12 w-11 sm:h-14 sm:w-12 text-center text-xl sm:text-2xl font-extrabold rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 transition-all"
                    autoComplete="one-time-code"
                    required
                  />
                ))}
              </div>

              <div className="text-center text-xs text-slate-500 dark:text-slate-400">
                Code expires in <strong>5 minutes</strong>. Maximum 5 attempts.
              </div>

              <button
                type="submit"
                disabled={busy || digits.some((d) => !d) || !email}
                className="btn-primary w-full py-2.5 font-bold flex items-center justify-center gap-2 shadow-sm disabled:opacity-50"
              >
                {busy ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" /> Verifying Code...
                  </>
                ) : (
                  <>
                    Verify & Activate Account <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </form>

            {/* Resend Cooldown Section */}
            <div className="mt-6 border-t border-slate-200 dark:border-slate-800 pt-4 text-center">
              <p className="text-xs text-slate-600 dark:text-slate-400 mb-2">
                Didn't receive the email? Check spam or resend code:
              </p>
              {canResend ? (
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={resending || !email}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-brand-600 dark:text-brand-400 hover:underline disabled:opacity-50"
                >
                  <RefreshCw className={`h-3.5 w-3.5 ${resending ? 'animate-spin' : ''}`} />
                  Resend Verification Code
                </button>
              ) : (
                <span className="inline-flex items-center gap-1 text-xs text-slate-400 dark:text-slate-500 font-medium">
                  Resend available in <span className="font-bold text-slate-600 dark:text-slate-300">{countdown}s</span>
                </span>
              )}
            </div>

            <div className="mt-5 text-center">
              <Link
                to="/login"
                className="text-xs font-semibold text-slate-500 hover:text-brand-600 dark:text-slate-400 dark:hover:text-brand-400"
              >
                &larr; Back to Login
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
