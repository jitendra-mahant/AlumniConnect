import { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import {
  AlertCircle,
  Award,
  CheckCircle2,
  Eye,
  EyeOff,
  GraduationCap,
  KeyRound,
  Loader2,
  Lock,
  Mail,
  Moon,
  ShieldCheck,
  Sun,
  User as UserIcon,
  Users,
} from 'lucide-react';
import { Logo } from '../components/Layout';
import { useAuth } from '../context/AuthContext';
import api, { errorMessage } from '../api/client';
import { useToast } from '../context/ToastContext';
import { applyTheme, getInitialTheme } from '../utils/theme';

/**
 * Validates official institutional email domain: username@kkwagh.edu.in
 */
export function validateInstitutionalEmail(email) {
  const normalized = String(email || '').trim().toLowerCase();
  const regex = /^[a-zA-Z0-9._%+-]+@kkwagh\.edu\.in$/i;
  return {
    valid: regex.test(normalized),
    normalized,
  };
}

function AuthShell({ title, subtitle, children, footer }) {
  const [theme, setTheme] = useState(getInitialTheme);

  useEffect(() => {
    setTheme(getInitialTheme());
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    applyTheme(nextTheme);
  };

  return (
    <div className="relative min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors overflow-x-hidden">
      {/* Viewport Extreme Upper-Right Theme Toggle */}
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

      <div className="grid min-h-screen lg:grid-cols-2">
        {/* Left Brand Showcase Column (Desktop Only) */}
        <div className="relative hidden flex-col justify-between overflow-hidden bg-gradient-to-br from-navy-950 via-navy-900 to-navy-700 p-12 text-white lg:flex">
          <div className="pointer-events-none absolute -right-20 top-20 h-80 w-80 rounded-full bg-brand-500/20 blur-3xl" />
          <Link to="/" aria-label="AlumniConnect KKWAGH Home">
            <Logo light />
          </Link>
          <div className="relative">
            <GraduationCap className="mb-6 h-12 w-12 text-brand-300" />
            <h2 className="text-4xl font-extrabold leading-tight text-white">
              Learn from the alumni who walked your path.
            </h2>
            <p className="mt-4 max-w-md text-navy-100">
              Mentorship, referrals and opportunities from verified graduates of K.K. Wagh Institute of Engineering Education & Research (KKWAGH).
            </p>
          </div>
          <p className="relative text-xs text-navy-200">
            A trusted, college-specific professional network · KKWAGH Nashik.
          </p>
        </div>

        {/* Right Form Column */}
        <div className="flex flex-col justify-center items-center px-4 py-12 sm:px-6 lg:px-12 transition-colors min-h-screen">
          {/* Mobile-Only Logo Header */}
          <div className="w-full max-w-[480px] flex items-center justify-start mb-6 lg:hidden">
            <Link to="/" aria-label="AlumniConnect KKWAGH Home">
              <Logo />
            </Link>
          </div>

          {/* Form Card Container */}
          <div className="w-full max-w-[480px]">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              {title}
            </h1>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
              {subtitle}
            </p>
            <div className="card mt-6 p-6 sm:p-7 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-card">
              {children}
            </div>
            {footer && (
              <div className="mt-5 text-center text-sm text-slate-600 dark:text-slate-400">
                {footer}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function IconInput({ icon: Icon, ...props }) {
  return (
    <div className="relative">
      <Icon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
      <input className="input pl-9" {...props} />
    </div>
  );
}

export function PasswordInput({
  id = 'password',
  value,
  onChange,
  placeholder = '••••••••',
  autoComplete = 'current-password',
  required = true,
  minLength,
  className = '',
  ...props
}) {
  const [showPassword, setShowPassword] = useState(false);
  const inputRef = useRef(null);

  const toggleVisibility = () => {
    setShowPassword((prev) => !prev);
    if (inputRef.current) {
      const len = inputRef.current.value.length;
      requestAnimationFrame(() => {
        if (inputRef.current) {
          inputRef.current.setSelectionRange(len, len);
          inputRef.current.focus();
        }
      });
    }
  };

  return (
    <div className="relative">
      <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
      <input
        ref={inputRef}
        id={id}
        name={id}
        type={showPassword ? 'text' : 'password'}
        required={required}
        minLength={minLength}
        autoComplete={autoComplete}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        className={`input pl-9 pr-10 ${className}`}
        {...props}
      />
      <button
        type="button"
        tabIndex={0}
        onClick={toggleVisibility}
        aria-label={showPassword ? 'Hide password' : 'Show password'}
        title={showPassword ? 'Hide password' : 'Show password'}
        className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500 rounded transition"
      >
        {showPassword ? (
          <EyeOff className="h-4 w-4" aria-hidden="true" />
        ) : (
          <Eye className="h-4 w-4" aria-hidden="true" />
        )}
      </button>
    </div>
  );
}

export function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [params] = useSearchParams();
  const toast = useToast();

  const [form, setForm] = useState({ email: params.get('email') || '', password: '' });
  const [error, setError] = useState(params.get('expired') ? 'Your session expired. Please log in again.' : '');
  const [busy, setBusy] = useState(false);

  // Mandatory password change modal state for temporary credential sign-ins
  const [mustChangeModal, setMustChangeModal] = useState({ open: false, user: null });
  const [newPasswordForm, setNewPasswordForm] = useState({ password: '', confirmPassword: '' });
  const [updatingPassword, setUpdatingPassword] = useState(false);
  const [passwordChangeError, setPasswordChangeError] = useState('');

  useEffect(() => {
    const qEmail = params.get('email');
    if (qEmail) setForm((f) => ({ ...f, email: qEmail }));
  }, [params]);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError('');

    const { valid, normalized } = validateInstitutionalEmail(form.email);
    if (!valid) {
      setError('Please enter a valid official institutional email address (@kkwagh.edu.in).');
      setBusy(false);
      return;
    }

    try {
      const user = await login(normalized, form.password);
      if (user.mustChangePassword) {
        setMustChangeModal({ open: true, user });
        return;
      }
      const defaultTarget =
        user.role === 'admin'
          ? '/admin'
          : user.role === 'teacher'
          ? '/teacher/dashboard'
          : '/dashboard';
      navigate(location.state?.from || defaultTarget, { replace: true });
    } catch (err) {
      const code = err.response?.data?.code || err.response?.data?.details?.code;
      if (code === 'EMAIL_NOT_VERIFIED') {
        const unverifiedEmail = err.response?.data?.details?.email || normalized;
        toast.info('Please verify your institutional email address with the 6-digit code.');
        navigate(`/verify-email?email=${encodeURIComponent(unverifiedEmail)}`);
        return;
      }
      setError(errorMessage(err, 'Invalid institutional email or password.'));
    } finally {
      setBusy(false);
    }
  };

  const handleCompletePasswordChange = async (e) => {
    e.preventDefault();
    setPasswordChangeError('');
    if (newPasswordForm.password.length < 6) {
      setPasswordChangeError('Password must be at least 6 characters long.');
      return;
    }
    if (newPasswordForm.password !== newPasswordForm.confirmPassword) {
      setPasswordChangeError('Passwords do not match. Please re-enter.');
      return;
    }

    setUpdatingPassword(true);
    try {
      await api.put('/auth/change-password', {
        newPassword: newPasswordForm.password,
      });
      toast.success('Your permanent password has been set successfully!');
      setMustChangeModal({ open: false, user: null });
      const user = mustChangeModal.user;
      const defaultTarget =
        user?.role === 'admin'
          ? '/admin'
          : user?.role === 'teacher'
          ? '/teacher/dashboard'
          : '/dashboard';
      navigate(location.state?.from || defaultTarget, { replace: true });
    } catch (err) {
      setPasswordChangeError(errorMessage(err, 'Failed to update permanent password.'));
    } finally {
      setUpdatingPassword(false);
    }
  };

  // Autofill credentials without submitting automatically
  const fill = (email, password) => {
    setForm({ email, password });
    setError('');
  };

  return (
    <AuthShell
      title="Welcome back"
      subtitle="Log in to continue to AlumniConnect KKWAGH."
      footer={
        <div className="space-y-2 text-center text-sm text-slate-600 dark:text-slate-300">
          <div>
            New to AlumniConnect?{' '}
            <Link to="/register" className="font-bold text-brand-700 dark:text-brand-400 hover:underline">
              Create an account
            </Link>
          </div>
          <div>
            <Link
              to="/forgot-password"
              className="text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-brand-600 dark:hover:text-brand-400 hover:underline"
            >
              Forgot your password?
            </Link>
          </div>
        </div>
      }
    >
      <form onSubmit={submit} className="space-y-4">
        {error && (
          <div
            role="alert"
            className="rounded-lg border border-red-200 dark:border-red-900/60 bg-red-50 dark:bg-red-950/40 p-3 text-sm text-red-700 dark:text-red-300 flex items-start gap-2"
          >
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-600 dark:text-red-400" />
            <span>{error}</span>
          </div>
        )}

        <div>
          <label className="label" htmlFor="email">
            College Email (@kkwagh.edu.in)
          </label>
          <IconInput
            icon={Mail}
            id="email"
            type="email"
            required
            autoComplete="email"
            placeholder="username@kkwagh.edu.in"
            value={form.email}
            onChange={(e) => {
              setForm({ ...form, email: e.target.value });
              if (error) setError('');
            }}
          />
        </div>

        <div>
          <label className="label" htmlFor="password">
            Password
          </label>
          <PasswordInput
            id="password"
            required
            autoComplete="current-password"
            placeholder="••••••••"
            value={form.password}
            onChange={(e) => {
              setForm({ ...form, password: e.target.value });
              if (error) setError('');
            }}
          />
        </div>

        <button className="btn-primary w-full py-2.5 font-bold shadow-sm" disabled={busy} type="submit">
          {busy && <Loader2 className="h-4 w-4 animate-spin" />} Log in
        </button>
      </form>

      {/* Verified Demo Accounts Section (Click to fill credentials) */}
      <div className="mt-5 border-t border-slate-200 dark:border-slate-800 pt-4">
        <p className="mb-2.5 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
          Demo Accounts (Click to fill credentials)
        </p>
        <div className="grid grid-cols-2 gap-2.5">
          <button
            type="button"
            className="btn-secondary btn-sm flex items-center justify-center gap-1.5 py-2 px-3 text-xs font-semibold"
            onClick={() => fill('student@kkwagh.edu.in', 'student@123')}
            title="Autofill Student Demo Account"
          >
            <UserIcon className="h-3.5 w-3.5 text-brand-600 dark:text-brand-400 shrink-0" />
            <span className="truncate">Student</span>
          </button>
          <button
            type="button"
            className="btn-secondary btn-sm flex items-center justify-center gap-1.5 py-2 px-3 text-xs font-semibold"
            onClick={() => fill('alumni@kkwagh.edu.in', 'alumni@123')}
            title="Autofill Alumnus Demo Account"
          >
            <Award className="h-3.5 w-3.5 text-brand-600 dark:text-brand-400 shrink-0" />
            <span className="truncate">Alumni</span>
          </button>
          <button
            type="button"
            className="btn-secondary btn-sm flex items-center justify-center gap-1.5 py-2 px-3 text-xs font-semibold"
            onClick={() => fill('guide@kkwagh.edu.in', 'guide@123')}
            title="Autofill Placement Office & Faculty Guide Account"
          >
            <GraduationCap className="h-3.5 w-3.5 text-brand-600 dark:text-brand-400 shrink-0" />
            <span className="truncate">Placement / Guide</span>
          </button>
          <button
            type="button"
            className="btn-secondary btn-sm flex items-center justify-center gap-1.5 py-2 px-3 text-xs font-semibold"
            onClick={() => fill('admin@kkwagh.edu.in', 'admin@123')}
            title="Autofill Administrator Account"
          >
            <Users className="h-3.5 w-3.5 text-brand-600 dark:text-brand-400 shrink-0" />
            <span className="truncate">Administrator</span>
          </button>
        </div>
      </div>

      {/* Mandatory Password Change Modal for Temporary Credentials */}
      {mustChangeModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm">
          <div className="card w-full max-w-md p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl">
            <div className="flex items-center gap-3 text-amber-600 dark:text-amber-400 mb-4">
              <KeyRound className="h-6 w-6 shrink-0" />
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">Set Your Permanent Password</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  You signed in using a temporary credential. Please choose a new permanent password.
                </p>
              </div>
            </div>

            {passwordChangeError && (
              <div className="mb-4 rounded-lg bg-red-50 dark:bg-red-950/40 p-3 text-xs text-red-700 dark:text-red-300">
                {passwordChangeError}
              </div>
            )}

            <form onSubmit={handleCompletePasswordChange} className="space-y-4">
              <div>
                <label className="label" htmlFor="modal-new-password">New Password</label>
                <PasswordInput
                  id="modal-new-password"
                  required
                  minLength={6}
                  placeholder="At least 6 characters"
                  value={newPasswordForm.password}
                  onChange={(e) => setNewPasswordForm({ ...newPasswordForm, password: e.target.value })}
                />
              </div>

              <div>
                <label className="label" htmlFor="modal-confirm-password">Confirm Password</label>
                <PasswordInput
                  id="modal-confirm-password"
                  required
                  minLength={6}
                  placeholder="Re-enter password"
                  value={newPasswordForm.confirmPassword}
                  onChange={(e) => setNewPasswordForm({ ...newPasswordForm, confirmPassword: e.target.value })}
                />
              </div>

              <button
                type="submit"
                disabled={updatingPassword}
                className="btn-primary w-full py-2.5 font-bold flex items-center justify-center gap-2"
              >
                {updatingPassword && <Loader2 className="h-4 w-4 animate-spin" />}
                Save Permanent Password & Continue
              </button>
            </form>
          </div>
        </div>
      )}
    </AuthShell>
  );
}

export function Register() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { register } = useAuth();
  const toast = useToast();

  const [form, setForm] = useState({
    name: '',
    email: params.get('email') || '',
    password: '',
    role: params.get('role') === 'alumni' ? 'alumni' : params.get('role') === 'teacher' ? 'teacher' : 'student',
  });
  const [error, setError] = useState('');
  const [duplicateAccount, setDuplicateAccount] = useState(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setDuplicateAccount(null);

    const { valid, normalized } = validateInstitutionalEmail(form.email);
    if (!valid) {
      setError('Registration is restricted to official college email addresses (@kkwagh.edu.in). Personal and external email addresses are not permitted.');
      return;
    }

    if (!form.name.trim()) {
      setError('Please enter your full name.');
      return;
    }

    if (form.password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    setBusy(true);
    try {
      const res = await register({
        name: form.name.trim(),
        email: normalized,
        password: form.password,
        role: form.role,
      });

      if (res?.requiresVerification) {
        toast.success(res.message || 'Verification code sent to your official college email.');
        navigate(`/verify-email?email=${encodeURIComponent(normalized)}`, { replace: true });
      } else {
        const user = res?.user || res;
        toast.success('Account created successfully! Welcome to AlumniConnect.');
        const defaultTarget =
          user?.role === 'admin'
            ? '/admin'
            : user?.role === 'teacher'
            ? '/teacher/dashboard'
            : '/dashboard';
        navigate(defaultTarget, { replace: true });
      }
    } catch (err) {
      const status = err.response?.status;
      const data = err.response?.data;
      const code = data?.code || data?.details?.code;
      const isDuplicate = status === 409 || code === 'DUPLICATE_EMAIL';

      if (isDuplicate) {
        setDuplicateAccount({ email: normalized });
        setError('An account with this institutional email already exists. Please log in or reset your password.');
      } else {
        setDuplicateAccount(null);
        setError(errorMessage(err, 'Registration failed. Please check your details.'));
      }
    } finally {
      setBusy(false);
    }
  };

  const roles = [
    { value: 'student', label: 'Student', icon: GraduationCap, text: 'Find mentors & jobs' },
    { value: 'alumni', label: 'Alumnus', icon: Users, text: 'Guide & hire students' },
    { value: 'teacher', label: 'Teacher / Guide', icon: Award, text: 'Guide student projects' },
  ];

  return (
    <AuthShell
      title="Create your account"
      subtitle="Join K.K. Wagh's official professional network."
      footer={
        <>
          Already have an account?{' '}
          <Link to="/login" className="font-semibold text-brand-700 dark:text-brand-400 hover:underline">
            Log in
          </Link>
        </>
      }
    >
      <form onSubmit={submit} className="space-y-4">
        {error && (
          <div
            role="alert"
            className="rounded-lg border border-red-200 dark:border-red-900/60 bg-red-50 dark:bg-red-950/40 p-3.5 text-sm text-red-700 dark:text-red-300 space-y-2.5"
          >
            <div className="flex items-start gap-2">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-600 dark:text-red-400" />
              <p className="font-medium leading-relaxed">{error}</p>
            </div>

            {duplicateAccount && (
              <div className="border-t border-red-200/70 dark:border-red-800/60 pt-2.5">
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
                  <span className="text-slate-600 dark:text-slate-400 font-semibold">Options:</span>
                  <Link
                    to={`/login?email=${encodeURIComponent(duplicateAccount.email)}`}
                    className="font-bold text-brand-700 dark:text-brand-400 hover:underline inline-flex items-center gap-1"
                  >
                    Log in &rarr;
                  </Link>
                  <span className="text-slate-300 dark:text-slate-700">&bull;</span>
                  <Link
                    to={`/forgot-password?email=${encodeURIComponent(duplicateAccount.email)}`}
                    className="font-bold text-brand-700 dark:text-brand-400 hover:underline inline-flex items-center gap-1"
                  >
                    Reset password &rarr;
                  </Link>
                </div>
              </div>
            )}
          </div>
        )}

        <div>
          <span className="label">I am a</span>
          <div className="grid grid-cols-3 gap-2">
            {roles.map(({ value, label, icon: Icon, text }) => (
              <button
                key={value}
                type="button"
                onClick={() => setForm({ ...form, role: value })}
                className={`rounded-lg border p-2.5 text-left transition ${
                  form.role === value
                    ? 'border-brand-600 bg-brand-50/60 dark:bg-brand-950/40 dark:border-brand-500 ring-2 ring-brand-500/20'
                    : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700'
                }`}
                aria-pressed={form.role === value}
              >
                <Icon
                  className={`mb-1 h-4 w-4 ${
                    form.role === value
                      ? 'text-brand-600 dark:text-brand-400'
                      : 'text-slate-500 dark:text-slate-400'
                  }`}
                />
                <p className="text-xs font-bold text-slate-900 dark:text-slate-100">{label}</p>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 line-clamp-1">{text}</p>
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="label" htmlFor="name">
            Full name
          </label>
          <IconInput
            icon={UserIcon}
            id="name"
            required
            placeholder="Your full name"
            value={form.name}
            onChange={(e) => {
              setForm({ ...form, name: e.target.value });
              if (error) setError('');
            }}
          />
        </div>

        <div>
          <label className="label" htmlFor="email">
            College email (@kkwagh.edu.in)
          </label>
          <IconInput
            icon={Mail}
            id="email"
            type="email"
            required
            autoComplete="email"
            placeholder="username@kkwagh.edu.in"
            value={form.email}
            onChange={(e) => {
              setForm({ ...form, email: e.target.value });
              if (duplicateAccount) setDuplicateAccount(null);
              if (error) setError('');
            }}
          />
          <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
            Only official @kkwagh.edu.in addresses are accepted.
          </p>
        </div>

        <div>
          <label className="label" htmlFor="password">
            Password
          </label>
          <PasswordInput
            id="password"
            required
            minLength={6}
            autoComplete="new-password"
            placeholder="Choose a secure password (min 6 characters)"
            value={form.password}
            onChange={(e) => {
              setForm({ ...form, password: e.target.value });
              if (error) setError('');
            }}
          />
        </div>

        {form.role === 'alumni' && (
          <p className="rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 p-2.5 text-xs text-amber-800 dark:text-amber-300">
            Alumni profiles are reviewed by college administrators before they appear in the public directory.
          </p>
        )}

        <button className="btn-primary w-full py-2.5 font-bold shadow-sm" disabled={busy} type="submit">
          {busy && <Loader2 className="h-4 w-4 animate-spin" />} Create account
        </button>
      </form>
    </AuthShell>
  );
}

export function ForgotPassword() {
  const [params] = useSearchParams();
  const [mode, setMode] = useState('email_otp'); // 'email_otp' | 'enter_temp' | 'admin_request'
  const [email, setEmail] = useState(params.get('email') || '');
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);
  const [submittedMessage, setSubmittedMessage] = useState('');
  const [error, setError] = useState('');

  // Fields for OTP password reset
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [otpCountdown, setOtpCountdown] = useState(60);
  const [canResendOtp, setCanResendOtp] = useState(false);

  // Fields for entering temporary credential or setting new password
  const [tempCredential, setTempCredential] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [resetSuccess, setResetSuccess] = useState(false);

  const toast = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    const qEmail = params.get('email');
    if (qEmail) setEmail(qEmail);
  }, [params]);

  // Resend countdown timer for OTP
  useEffect(() => {
    if (otpSent && otpCountdown > 0) {
      setCanResendOtp(false);
      const timer = setInterval(() => {
        setOtpCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            setCanResendOtp(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    } else if (otpSent) {
      setCanResendOtp(true);
    }
  }, [otpSent, otpCountdown]);

  // Request 6-digit OTP via Brevo SMTP
  const handleSendOtp = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError('');

    const { valid, normalized } = validateInstitutionalEmail(email);
    if (!valid) {
      setError('Please enter a valid official institutional email address (@kkwagh.edu.in).');
      setBusy(false);
      return;
    }

    try {
      const res = await api.post('/auth/forgot-password', { email: normalized });
      setOtpSent(true);
      setOtpCountdown(res.data.cooldown || 60);
      toast.success(res.data.message || 'Recovery code sent to your email.');
    } catch (err) {
      setError(errorMessage(err, 'Failed to send recovery code. Please try again.'));
    } finally {
      setBusy(false);
    }
  };

  // Submit 6-digit OTP + New Password
  const handleResetWithOtp = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError('');

    const { valid, normalized } = validateInstitutionalEmail(email);
    if (!valid) {
      setError('Please enter a valid official institutional email address (@kkwagh.edu.in).');
      setBusy(false);
      return;
    }

    if (!otpCode.trim() || !/^\d{6}$/.test(otpCode.trim())) {
      setError('Please enter the 6-digit recovery code.');
      setBusy(false);
      return;
    }

    if (newPassword.length < 6) {
      setError('New password must be at least 6 characters long.');
      setBusy(false);
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match. Please re-enter.');
      setBusy(false);
      return;
    }

    try {
      const res = await api.post('/auth/reset-password', {
        email: normalized,
        otp: otpCode.trim(),
        newPassword,
      });

      setResetSuccess(true);
      toast.success(res.data.message || 'Password reset successfully!');
      setTimeout(() => navigate('/login'), 2000);
    } catch (err) {
      setError(errorMessage(err, 'Invalid or expired recovery code.'));
    } finally {
      setBusy(false);
    }
  };

  // Legacy Admin-Assisted Request
  const handleRequestSubmit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    setSubmittedMessage('');

    const { valid, normalized } = validateInstitutionalEmail(email);
    if (!valid) {
      setError('Please enter a valid official institutional email address (@kkwagh.edu.in).');
      setBusy(false);
      return;
    }

    try {
      const res = await api.post('/auth/recovery-request', {
        email: normalized,
        reason,
      });

      setSubmittedMessage(
        res.data.message ||
          'Your request has been submitted. Follow the instructions provided by your college administrator.'
      );
      toast.success('Password recovery request recorded.');
    } catch (err) {
      setError(errorMessage(err, 'Failed to submit recovery request.'));
    } finally {
      setBusy(false);
    }
  };

  // Temporary Credential Submit
  const handleTempCredentialSubmit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError('');

    const { valid, normalized } = validateInstitutionalEmail(email);
    if (!valid) {
      setError('Please enter your valid institutional email address (@kkwagh.edu.in).');
      setBusy(false);
      return;
    }

    if (!tempCredential.trim()) {
      setError('Please enter the temporary credential provided by your college administrator.');
      setBusy(false);
      return;
    }

    if (newPassword.length < 6) {
      setError('New password must be at least 6 characters long.');
      setBusy(false);
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match. Please re-enter.');
      setBusy(false);
      return;
    }

    try {
      const res = await api.post('/auth/reset-password', {
        email: normalized,
        temporaryCredential: tempCredential.trim(),
        password: newPassword,
      });

      setResetSuccess(true);
      toast.success(res.data.message || 'Password reset successfully!');
      setTimeout(() => navigate('/login'), 2000);
    } catch (err) {
      setError(errorMessage(err, 'Invalid temporary credential or recovery error.'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthShell
      title="Recover Your Account"
      subtitle="Reset your password using an email verification code or administrator assistance."
      footer={
        <div className="space-y-2 text-center text-sm text-slate-600 dark:text-slate-400">
          <div>
            Remember your credentials?{' '}
            <Link to="/login" className="font-semibold text-brand-700 dark:text-brand-400 hover:underline">
              Back to Login
            </Link>
          </div>
        </div>
      }
    >
      {/* Tab Switcher */}
      <div className="mb-5 flex rounded-lg bg-slate-100 p-1 dark:bg-slate-800">
        <button
          type="button"
          onClick={() => {
            setMode('email_otp');
            setError('');
          }}
          className={`flex-1 rounded-md py-1.5 text-xs font-semibold transition ${
            mode === 'email_otp'
              ? 'bg-white text-slate-900 shadow-sm dark:bg-slate-900 dark:text-white'
              : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
          }`}
        >
          1. Email Code (Brevo)
        </button>
        <button
          type="button"
          onClick={() => {
            setMode('enter_temp');
            setError('');
          }}
          className={`flex-1 rounded-md py-1.5 text-xs font-semibold transition ${
            mode === 'enter_temp'
              ? 'bg-white text-slate-900 shadow-sm dark:bg-slate-900 dark:text-white'
              : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
          }`}
        >
          2. Temp Credential
        </button>
        <button
          type="button"
          onClick={() => {
            setMode('admin_request');
            setError('');
          }}
          className={`flex-1 rounded-md py-1.5 text-xs font-semibold transition ${
            mode === 'admin_request'
              ? 'bg-white text-slate-900 shadow-sm dark:bg-slate-900 dark:text-white'
              : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
          }`}
        >
          3. Admin Help
        </button>
      </div>

      {resetSuccess ? (
        <div className="py-4 space-y-4 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 className="h-8 w-8" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">Password Reset Complete!</h2>
          <p className="text-sm text-slate-600 dark:text-slate-300">
            Your new permanent password is active. Redirecting you to login...
          </p>
          <div className="pt-2">
            <Link to="/login" className="btn-primary w-full py-2.5">
              Proceed to Login
            </Link>
          </div>
        </div>
      ) : mode === 'email_otp' ? (
        !otpSent ? (
          <form onSubmit={handleSendOtp} className="space-y-4">
            {error && (
              <div
                role="alert"
                className="rounded-lg border border-red-200 dark:border-red-900/60 bg-red-50 dark:bg-red-950/40 p-3 text-sm text-red-700 dark:text-red-300 flex items-start gap-2"
              >
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-600 dark:text-red-400" />
                <span>{error}</span>
              </div>
            )}

            <div className="rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/50 p-3 text-xs text-blue-800 dark:text-blue-200 space-y-1">
              <p className="font-bold flex items-center gap-1.5">
                <Mail className="h-4 w-4 text-brand-600 dark:text-brand-400" />
                <span>Instant Brevo OTP Password Recovery</span>
              </p>
              <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                Enter your official college email below. We'll send a secure 6-digit one-time code to reset your password.
              </p>
            </div>

            <div>
              <label className="label" htmlFor="recovery-email-otp">
                College Email (@kkwagh.edu.in)
              </label>
              <IconInput
                icon={Mail}
                id="recovery-email-otp"
                type="email"
                required
                placeholder="username@kkwagh.edu.in"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (error) setError('');
                }}
              />
            </div>

            <button className="btn-primary w-full py-2.5 font-bold shadow-sm" disabled={busy} type="submit">
              {busy && <Loader2 className="h-4 w-4 animate-spin" />} Send 6-Digit Recovery Code
            </button>
          </form>
        ) : (
          <form onSubmit={handleResetWithOtp} className="space-y-4">
            {error && (
              <div
                role="alert"
                className="rounded-lg border border-red-200 dark:border-red-900/60 bg-red-50 dark:bg-red-950/40 p-3 text-sm text-red-700 dark:text-red-300 flex items-start gap-2"
              >
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-600 dark:text-red-400" />
                <span>{error}</span>
              </div>
            )}

            <div className="rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/50 p-3 text-xs text-emerald-800 dark:text-emerald-200">
              <p className="font-semibold">
                Recovery code sent to <strong>{email}</strong>
              </p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                Code expires in 5 minutes. Enter the code and your new password below.
              </p>
            </div>

            <div>
              <label className="label" htmlFor="otp-code-input">
                6-Digit Recovery Code
              </label>
              <IconInput
                icon={KeyRound}
                id="otp-code-input"
                type="text"
                required
                maxLength={6}
                placeholder="123456"
                value={otpCode}
                onChange={(e) => {
                  setOtpCode(e.target.value.replace(/\D/g, ''));
                  if (error) setError('');
                }}
              />
            </div>

            <div>
              <label className="label" htmlFor="otp-new-password">
                New Permanent Password
              </label>
              <PasswordInput
                id="otp-new-password"
                required
                minLength={6}
                placeholder="At least 6 characters"
                value={newPassword}
                onChange={(e) => {
                  setNewPassword(e.target.value);
                  if (error) setError('');
                }}
              />
            </div>

            <div>
              <label className="label" htmlFor="otp-confirm-password">
                Confirm Permanent Password
              </label>
              <PasswordInput
                id="otp-confirm-password"
                required
                minLength={6}
                placeholder="Re-enter your new password"
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  if (error) setError('');
                }}
              />
            </div>

            <button className="btn-primary w-full py-2.5 font-bold shadow-sm" disabled={busy} type="submit">
              {busy && <Loader2 className="h-4 w-4 animate-spin" />} Reset Password & Continue
            </button>

            <div className="text-center pt-2">
              {canResendOtp ? (
                <button
                  type="button"
                  onClick={handleSendOtp}
                  className="text-xs font-semibold text-brand-600 dark:text-brand-400 hover:underline"
                >
                  Resend recovery code
                </button>
              ) : (
                <span className="text-xs text-slate-400">
                  Resend available in {otpCountdown}s
                </span>
              )}
            </div>
          </form>
        )
      ) : mode === 'admin_request' ? (
        submittedMessage ? (
          <div className="space-y-4 py-2">
            <div className="rounded-lg border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/40 p-4 text-emerald-900 dark:text-emerald-100 text-sm space-y-2">
              <div className="flex items-center gap-2 font-bold">
                <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span>Recovery Request Recorded</span>
              </div>
              <p className="font-medium text-emerald-800 dark:text-emerald-200 leading-relaxed">
                {submittedMessage}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setMode('enter_temp')}
              className="btn-primary w-full py-2.5 text-xs font-semibold"
            >
              Enter Temporary Credential &rarr;
            </button>
          </div>
        ) : (
          <form onSubmit={handleRequestSubmit} className="space-y-4">
            {error && (
              <div
                role="alert"
                className="rounded-lg border border-red-200 dark:border-red-900/60 bg-red-50 dark:bg-red-950/40 p-3 text-sm text-red-700 dark:text-red-300 flex items-start gap-2"
              >
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-600 dark:text-red-400" />
                <span>{error}</span>
              </div>
            )}

            <div>
              <label className="label" htmlFor="admin-recovery-email">
                College Email (@kkwagh.edu.in)
              </label>
              <IconInput
                icon={Mail}
                id="admin-recovery-email"
                type="email"
                required
                placeholder="username@kkwagh.edu.in"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (error) setError('');
                }}
              />
            </div>

            <div>
              <label className="label" htmlFor="admin-recovery-reason">
                Notes / Department Details (Optional)
              </label>
              <textarea
                id="admin-recovery-reason"
                rows={2}
                placeholder="e.g. Computer Dept, Roll 4101"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="input resize-none py-2 text-xs"
              />
            </div>

            <button className="btn-primary w-full py-2.5 font-bold shadow-sm" disabled={busy} type="submit">
              {busy && <Loader2 className="h-4 w-4 animate-spin" />} Submit Admin Recovery Request
            </button>
          </form>
        )
      ) : (
        <form onSubmit={handleTempCredentialSubmit} className="space-y-4">
          {error && (
            <div
              role="alert"
              className="rounded-lg border border-red-200 dark:border-red-900/60 bg-red-50 dark:bg-red-950/40 p-3 text-sm text-red-700 dark:text-red-300 flex items-start gap-2"
            >
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-600 dark:text-red-400" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="label" htmlFor="reset-email">
              College Email (@kkwagh.edu.in)
            </label>
            <IconInput
              icon={Mail}
              id="reset-email"
              type="email"
              required
              placeholder="username@kkwagh.edu.in"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (error) setError('');
              }}
            />
          </div>

          <div>
            <label className="label" htmlFor="temp-credential">
              Temporary Credential Provided by Administrator
            </label>
            <IconInput
              icon={KeyRound}
              id="temp-credential"
              type="text"
              required
              placeholder="e.g. KKWAGH#4B9F2A@721"
              value={tempCredential}
              onChange={(e) => {
                setTempCredential(e.target.value);
                if (error) setError('');
              }}
            />
          </div>

          <div>
            <label className="label" htmlFor="reset-new-password">
              New Permanent Password
            </label>
            <PasswordInput
              id="reset-new-password"
              required
              minLength={6}
              placeholder="At least 6 characters"
              value={newPassword}
              onChange={(e) => {
                setNewPassword(e.target.value);
                if (error) setError('');
              }}
            />
          </div>

          <div>
            <label className="label" htmlFor="reset-confirm-password">
              Confirm Permanent Password
            </label>
            <PasswordInput
              id="reset-confirm-password"
              required
              minLength={6}
              placeholder="Re-enter your new password"
              value={confirmPassword}
              onChange={(e) => {
                setConfirmPassword(e.target.value);
                if (error) setError('');
              }}
            />
          </div>

          <button className="btn-primary w-full py-2.5 font-bold shadow-sm" disabled={busy} type="submit">
            {busy && <Loader2 className="h-4 w-4 animate-spin" />} Set New Permanent Password
          </button>
        </form>
      )}
    </AuthShell>
  );
}

export function ResetPassword() {
  const [params] = useSearchParams();
  const token = params.get('token');
  const navigate = useNavigate();
  const toast = useToast();

  const [email, setEmail] = useState(params.get('email') || '');
  const [tempCredential, setTempCredential] = useState(params.get('credential') || '');
  const [form, setForm] = useState({ password: '', confirmPassword: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [success, setSuccess] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (form.password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }
    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match. Please re-enter.');
      return;
    }

    setBusy(true);
    setError('');
    try {
      const payload = token
        ? { token, password: form.password }
        : { email: email.trim().toLowerCase(), temporaryCredential: tempCredential.trim(), password: form.password };

      const res = await api.post('/auth/reset-password', payload);
      setSuccess(true);
      toast.success(res.data.message || 'Password reset successfully!');
      setTimeout(() => navigate('/login'), 2000);
    } catch (err) {
      setError(errorMessage(err, 'Failed to reset password. The link or temporary credential may be invalid or expired.'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthShell
      title="Set New Permanent Password"
      subtitle="Enter and confirm your new secure password."
      footer={
        <Link to="/login" className="font-semibold text-brand-700 dark:text-brand-400 hover:underline">
          Back to Login
        </Link>
      }
    >
      {success ? (
        <div className="py-4 space-y-4 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 className="h-8 w-8" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">Password Reset Complete!</h2>
          <p className="text-sm text-slate-600 dark:text-slate-300">
            Your password has been securely updated. Redirecting you to the login screen...
          </p>
          <div className="pt-2">
            <Link to="/login" className="btn-primary w-full py-2.5">
              Go to Login
            </Link>
          </div>
        </div>
      ) : (
        <form onSubmit={submit} className="space-y-4">
          {error && (
            <div
              role="alert"
              className="rounded-lg border border-red-200 dark:border-red-900/60 bg-red-50 dark:bg-red-950/40 p-3 text-sm text-red-700 dark:text-red-300 space-y-2"
            >
              <div className="flex items-start gap-2">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-600 dark:text-red-400" />
                <span>{error}</span>
              </div>
            </div>
          )}

          {!token && (
            <>
              <div>
                <label className="label" htmlFor="reset-email-input">
                  College Email (@kkwagh.edu.in)
                </label>
                <IconInput
                  icon={Mail}
                  id="reset-email-input"
                  type="email"
                  required
                  placeholder="username@kkwagh.edu.in"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              <div>
                <label className="label" htmlFor="reset-temp-cred">
                  Temporary Credential Provided by Administrator
                </label>
                <IconInput
                  icon={KeyRound}
                  id="reset-temp-cred"
                  type="text"
                  required
                  placeholder="e.g. KKWAGH#4B9F2A@721"
                  value={tempCredential}
                  onChange={(e) => setTempCredential(e.target.value)}
                />
              </div>
            </>
          )}

          <div>
            <label className="label" htmlFor="new-password">
              New Permanent Password
            </label>
            <PasswordInput
              id="new-password"
              required
              minLength={6}
              autoComplete="new-password"
              placeholder="At least 6 characters"
              value={form.password}
              onChange={(e) => {
                setForm({ ...form, password: e.target.value });
                if (error) setError('');
              }}
            />
          </div>

          <div>
            <label className="label" htmlFor="confirm-password">
              Confirm Permanent Password
            </label>
            <PasswordInput
              id="confirm-password"
              required
              minLength={6}
              autoComplete="new-password"
              placeholder="Re-enter your new password"
              value={form.confirmPassword}
              onChange={(e) => {
                setForm({ ...form, confirmPassword: e.target.value });
                if (error) setError('');
              }}
            />
          </div>

          <button
            className="btn-primary w-full py-2.5 font-bold shadow-sm"
            disabled={busy}
            type="submit"
          >
            {busy && <Loader2 className="h-4 w-4 animate-spin" />} Update Permanent Password
          </button>
        </form>
      )}
    </AuthShell>
  );
}
