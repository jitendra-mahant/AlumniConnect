import { useState, useEffect } from 'react';

// Slideshow ki images (public/images folder mein rakhi hain)
const images = ['/images/login1.jpg', '/images/login2.jpg', '/images/login3.jpg'];

const inputStyle = 'w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm focus:border-brand-600 focus:outline-none';

// Reusable input: label + input. Baaki props (name, type...) seedha input ko chale jaate hain
function Field({ label, ...props }) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-slate-700">{label}</span>
      <input {...props} className={inputStyle} />
    </label>
  );
}

// Saare registered users localStorage ki "users" list mein rehte hain
const getUsers = () => JSON.parse(localStorage.getItem('users')) || [];

export default function Login({ onLogin }) {
  const [mode, setMode] = useState('signin');   // 'signin' ya 'signup'
  const [role, setRole] = useState('student');  // 'student' ya 'alumni'
  const [error, setError] = useState('');
  const [slide, setSlide] = useState(0);        // kaunsi image dikh rahi hai
  const [remember, setRemember] = useState(!!localStorage.getItem('rememberedEmail'));
  const [form, setForm] = useState({
    name: '',
    email: localStorage.getItem('rememberedEmail') || '',
    password: '',
    confirm: '',
    company: '',
    gradYear: '',
    age: '',
  });

  // Har 4 second mein agli image
  useEffect(() => {
    const timer = setInterval(() => setSlide((s) => (s + 1) % images.length), 4000);
    return () => clearInterval(timer);
  }, []);

  // Ek hi function har input ke liye: input ka "name" batata hai kaunsi field badli
  const change = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const switchMode = (m) => {
    setMode(m);
    setError('');
  };

  // Login ke baad password hata ke user ko app mein bhejte hain
  const finish = (user) => {
    const safeUser = { ...user };
    delete safeUser.password;
    onLogin(safeUser);
  };

  const signIn = (email) => {
    const user = getUsers().find((u) => u.email === email && u.password === form.password);
    if (!user) return setError('Wrong email or password');

    if (remember) localStorage.setItem('rememberedEmail', email);
    else localStorage.removeItem('rememberedEmail');
    finish(user);
  };

  const signUp = (email) => {
    if (form.password.length < 6) return setError('Password must be at least 6 characters');
    if (form.password !== form.confirm) return setError('Passwords do not match');
    if (getUsers().some((u) => u.email === email)) return setError('This email is already registered');

    const newUser = { name: form.name, email, password: form.password, role };
    if (role === 'alumni') {
      newUser.company = form.company;
      newUser.gradYear = form.gradYear;
      newUser.age = form.age;
    }
    localStorage.setItem('users', JSON.stringify([...getUsers(), newUser]));
    finish(newUser);
  };

  const submit = (e) => {
    e.preventDefault();
    setError('');
    const email = form.email.trim().toLowerCase();
    if (mode === 'signin') signIn(email);
    else signUp(email);
  };

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* ===== LEFT: images slideshow ===== */}
      <div className="relative hidden overflow-hidden bg-brand-900 lg:block">
        {images.map((src, i) => (
          <img
            key={src}
            src={src}
            alt=""
            onError={(e) => (e.target.style.display = 'none')}
            className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-1000 ${i === slide ? 'opacity-100' : 'opacity-0'}`}
          />
        ))}
        {/* neeche se dark overlay, taaki text padhne mein aaye */}
        <div className="absolute inset-0 bg-gradient-to-t from-brand-900 via-brand-900/60 to-brand-900/30" />

        <div className="relative flex h-full flex-col justify-between p-12 text-white">
          <h1 className="text-2xl font-extrabold">Alumni<span className="text-brand-300">Connect</span></h1>
          <div>
            <h2 className="text-4xl font-extrabold leading-tight">Your college network,<br />one login away.</h2>
            <p className="mt-3 max-w-md text-brand-200">
              Find mentors, get referrals and stay connected with K. K. Wagh alumni.
            </p>
          </div>
        </div>
      </div>

      {/* ===== RIGHT: form ===== */}
      <div className="flex items-center justify-center bg-slate-50 p-6">
        <div className="w-full max-w-md">
          <h1 className="mb-6 text-2xl font-extrabold text-brand-800 lg:hidden">
            Alumni<span className="text-brand-500">Connect</span>
          </h1>
          <h2 className="text-3xl font-bold text-slate-900">
            {mode === 'signin' ? 'Welcome back' : 'Create your account'}
          </h2>
          <p className="mb-6 mt-1 text-slate-500">
            {mode === 'signin' ? 'Sign in to continue.' : 'Join the K. K. Wagh alumni community.'}
          </p>

          {/* Sign In / Sign Up tabs */}
          <div className="mb-5 grid grid-cols-2 rounded-lg bg-slate-200 p-1 text-sm font-semibold">
            {[['signin', 'Sign In'], ['signup', 'Sign Up']].map(([m, label]) => (
              <button
                key={m}
                type="button"
                onClick={() => switchMode(m)}
                className={`rounded-md py-2 ${mode === m ? 'bg-white text-brand-800 shadow-sm' : 'text-slate-500'}`}
              >
                {label}
              </button>
            ))}
          </div>

          <form onSubmit={submit} className="space-y-4">
            {/* Sirf Sign Up mein: role aur naam */}
            {mode === 'signup' && (
              <>
                <div className="grid grid-cols-2 gap-3">
                  {['student', 'alumni'].map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setRole(r)}
                      className={`rounded-lg border py-2 text-sm font-semibold capitalize ${
                        role === r ? 'border-brand-600 bg-brand-50 text-brand-800' : 'border-slate-300 bg-white text-slate-500'
                      }`}
                    >
                      {r}
                    </button>
                  ))}
                </div>
                <Field label="Full name" name="name" value={form.name} onChange={change} required />
              </>
            )}

            <Field label="Email" type="email" name="email" autoComplete="email" value={form.email} onChange={change} required />
            <Field
              label="Password"
              type="password"
              name="password"
              autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
              value={form.password}
              onChange={change}
              required
            />

            {/* Sirf Sign Up mein: password verify + alumni ki details */}
            {mode === 'signup' && (
              <>
                <Field label="Confirm password" type="password" name="confirm" autoComplete="new-password" value={form.confirm} onChange={change} required />

                {role === 'alumni' && (
                  <>
                    <Field label="Current company / startup" name="company" placeholder="e.g. TCS or your own startup" value={form.company} onChange={change} required />
                    <div className="grid grid-cols-2 gap-3">
                      <Field label="Graduation year" type="number" name="gradYear" min="1990" max={new Date().getFullYear()} value={form.gradYear} onChange={change} required />
                      <Field label="Age" type="number" name="age" min="20" max="70" value={form.age} onChange={change} required />
                    </div>
                  </>
                )}
              </>
            )}

            {/* Sirf Sign In mein: remember me */}
            {mode === 'signin' && (
              <label className="flex items-center gap-2 text-sm text-slate-600">
                <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} />
                Remember me
              </label>
            )}

            {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}

            <button className="w-full rounded-lg bg-brand-800 py-2.5 text-sm font-semibold text-white hover:bg-brand-900">
              {mode === 'signin' ? 'Sign In' : 'Create Account'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}