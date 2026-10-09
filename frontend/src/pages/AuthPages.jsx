import { useState } from 'react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { AlertCircle, GraduationCap, Loader2, Lock, Mail, User as UserIcon, Users } from 'lucide-react';
import { Logo } from '../components/Layout';
import { useAuth } from '../context/AuthContext';
import { errorMessage } from '../api/client';

function AuthShell({ title, subtitle, children, footer }) {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="relative hidden flex-col justify-between overflow-hidden bg-gradient-to-br from-navy-950 via-navy-900 to-navy-700 p-12 text-white lg:flex">
        <div className="pointer-events-none absolute -right-20 top-20 h-80 w-80 rounded-full bg-brand-500/20 blur-3xl" />
        <Link to="/"><Logo light /></Link>
        <div className="relative">
          <GraduationCap className="mb-6 h-12 w-12 text-brand-300" />
          <h2 className="text-4xl font-extrabold leading-tight text-white">Learn from the alumni who walked your path.</h2>
          <p className="mt-4 max-w-md text-navy-100">Mentorship, referrals and opportunities from verified graduates of your own college.</p>
        </div>
        <p className="relative text-xs text-navy-200">A trusted, college-specific professional network.</p>
      </div>

      <div className="flex items-center justify-center bg-slate-50 px-4 py-10">
        <div className="w-full max-w-md">
          <Link to="/" className="mb-8 block lg:hidden"><Logo /></Link>
          <h1 className="text-3xl font-extrabold tracking-tight">{title}</h1>
          <p className="mt-1 text-sm text-slate-500">{subtitle}</p>
          <div className="card mt-6 p-6">{children}</div>
          <p className="mt-5 text-center text-sm text-slate-500">{footer}</p>
        </div>
      </div>
    </div>
  );
}

function IconInput({ icon: Icon, ...props }) {
  return (
    <div className="relative">
      <Icon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
      <input className="input pl-9" {...props} />
    </div>
  );
}

export function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [params] = useSearchParams();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState(params.get('expired') ? 'Your session expired. Please log in again.' : '');
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      const user = await login(form.email, form.password);
      navigate(location.state?.from || (user.role === 'admin' ? '/admin' : '/dashboard'), { replace: true });
    } catch (err) {
      setError(errorMessage(err, 'Login failed'));
    } finally {
      setBusy(false);
    }
  };

  const fill = (email, password) => setForm({ email, password });

  return (
    <AuthShell
      title="Welcome back"
      subtitle="Log in to continue to AlumniConnect."
      footer={<>New here? <Link to="/register" className="font-semibold text-brand-700 hover:underline">Create an account</Link></>}
    >
      <form onSubmit={submit} className="space-y-4">
        {error && (
          <div role="alert" className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /> {error}
          </div>
        )}
        <div>
          <label className="label" htmlFor="email">Email</label>
          <IconInput icon={Mail} id="email" type="email" required autoComplete="email" placeholder="you@college.edu" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        </div>
        <div>
          <label className="label" htmlFor="password">Password</label>
          <IconInput icon={Lock} id="password" type="password" required autoComplete="current-password" placeholder="••••••••" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
        </div>
        <button className="btn-primary w-full py-2.5" disabled={busy} type="submit">
          {busy && <Loader2 className="h-4 w-4 animate-spin" />} Log in
        </button>
      </form>

      <div className="mt-5 border-t border-slate-100 pt-4">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">Demo accounts (seed data)</p>
        <div className="flex flex-wrap gap-2">
          <button type="button" className="btn-secondary btn-sm" onClick={() => fill('student1@alumniconnect.edu', 'Password@123')}>Student</button>
          <button type="button" className="btn-secondary btn-sm" onClick={() => fill('priya.sharma@alumniconnect.edu', 'Password@123')}>Alumni</button>
          <button type="button" className="btn-secondary btn-sm" onClick={() => fill('admin@alumniconnect.edu', 'Admin@123')}>Admin</button>
        </div>
      </div>
    </AuthShell>
  );
}

export function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [form, setForm] = useState({ name: '', email: '', password: '', role: params.get('role') === 'alumni' ? 'alumni' : 'student' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      const user = await register(form);
      // New alumni must complete their profile to be reviewed by an admin.
      navigate(user.role === 'alumni' ? '/profile' : '/dashboard', { replace: true });
    } catch (err) {
      setError(errorMessage(err, 'Registration failed'));
    } finally {
      setBusy(false);
    }
  };

  const roles = [
    { value: 'student', label: 'Student', icon: GraduationCap, text: 'Find mentors & jobs' },
    { value: 'alumni', label: 'Alumnus', icon: Users, text: 'Guide & hire students' },
  ];

  return (
    <AuthShell
      title="Create your account"
      subtitle="Join your college's professional network."
      footer={<>Already have an account? <Link to="/login" className="font-semibold text-brand-700 hover:underline">Log in</Link></>}
    >
      <form onSubmit={submit} className="space-y-4">
        {error && (
          <div role="alert" className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /> {error}
          </div>
        )}
        <div>
          <span className="label">I am a</span>
          <div className="grid grid-cols-2 gap-3">
            {roles.map(({ value, label, icon: Icon, text }) => (
              <button
                key={value}
                type="button"
                onClick={() => setForm({ ...form, role: value })}
                className={`rounded-lg border p-3 text-left transition ${
                  form.role === value ? 'border-navy-700 bg-navy-50 ring-2 ring-navy-700/20' : 'border-slate-200 hover:border-navy-300'
                }`}
                aria-pressed={form.role === value}
              >
                <Icon className="mb-1 h-5 w-5 text-navy-700" />
                <p className="text-sm font-bold text-navy-900">{label}</p>
                <p className="text-xs text-slate-500">{text}</p>
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="label" htmlFor="name">Full name</label>
          <IconInput icon={UserIcon} id="name" required placeholder="Your full name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        </div>
        <div>
          <label className="label" htmlFor="email">Email</label>
          <IconInput icon={Mail} id="email" type="email" required autoComplete="email" placeholder="you@college.edu" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        </div>
        <div>
          <label className="label" htmlFor="password">Password</label>
          <IconInput icon={Lock} id="password" type="password" required minLength={6} autoComplete="new-password" placeholder="At least 6 characters" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
        </div>
        {form.role === 'alumni' && (
          <p className="rounded-lg bg-amber-50 p-3 text-xs text-amber-800">
            Alumni profiles are reviewed by a college admin before they appear in the directory.
          </p>
        )}
        <button className="btn-primary w-full py-2.5" disabled={busy} type="submit">
          {busy && <Loader2 className="h-4 w-4 animate-spin" />} Create account
        </button>
      </form>
    </AuthShell>
  );
}
