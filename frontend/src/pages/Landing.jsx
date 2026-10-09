import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowRight, BadgeCheck, BriefcaseBusiness, Building2, Handshake, HandHeart, HelpCircle, MessageSquare, Search, ShieldCheck, Users, Network,
} from 'lucide-react';
import { Logo } from '../components/Layout';
import { useAuth } from '../context/AuthContext';
import useFetch from '../hooks/useFetch';

const FEATURES = [
  { icon: Search, title: 'Discover alumni', text: 'Search by company, domain, skill, graduation year or experience, with filters that come straight from the alumni database.' },
  { icon: HelpCircle, title: 'Alumni Q&A forum', text: 'Ask career, interview prep, and technical questions with answers and follow-ups from verified alumni.' },
  { icon: HandHeart, title: 'Find a mentor', text: 'See who is open to mentorship and career guidance, then send a focused request with your goals.' },
  { icon: Handshake, title: 'Ask for referrals', text: 'Request referrals from alumni inside the companies you are targeting, tied to real openings.' },
  { icon: BriefcaseBusiness, title: 'Jobs & internships', text: 'Opportunities posted by your own alumni, ranked by how well they match your skills.' },
  { icon: ShieldCheck, title: 'Verified & trusted', text: 'Every alumnus is reviewed by college admins, so you only talk to real graduates.' },
];

const STEPS = [
  { n: '1', title: 'Create your profile', text: 'Join as a student or alumnus with your college email.' },
  { n: '2', title: 'Search & connect', text: 'Find the right alumni and send a connection request.' },
  { n: '3', title: 'Grow together', text: 'Get guidance, referrals and opportunities from your network.' },
];

export default function Landing() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [q, setQ] = useState('');
  const { data } = useFetch('/public/stats');
  const stats = data?.data;
  const appHome = user ? (user.role === 'admin' ? '/admin' : '/dashboard') : '/login';

  const submit = (e) => {
    e.preventDefault();
    navigate(`/alumni${q.trim() ? `?q=${encodeURIComponent(q.trim())}` : ''}`);
  };

  return (
    <div className="min-h-screen bg-white">
      <header className="absolute inset-x-0 top-0 z-20">
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link to="/" aria-label="AlumniConnect"><Logo light /></Link>
          <div className="flex items-center gap-2">
            {user ? (
              <Link to={appHome} className="btn bg-white text-navy-800 hover:bg-navy-50">Go to app <ArrowRight className="h-4 w-4" /></Link>
            ) : (
              <>
                <Link to="/login" className="btn text-white hover:bg-white/10">Log in</Link>
                <Link to="/register" className="btn bg-white text-navy-800 hover:bg-navy-50">Join now</Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-navy-950 via-navy-900 to-navy-700 pb-24 pt-32 text-white">
        <div className="pointer-events-none absolute -right-24 -top-24 h-96 w-96 rounded-full bg-brand-500/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-32 left-10 h-80 w-80 rounded-full bg-sky-400/10 blur-3xl" />
        <div className="relative mx-auto grid max-w-7xl items-center gap-12 px-4 sm:px-6 lg:grid-cols-2 lg:px-8">
          <div className="animate-fade-up">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-semibold text-brand-200">
              <BadgeCheck className="h-4 w-4" /> Verified alumni only
            </span>
            <h1 className="mt-5 text-4xl font-extrabold leading-tight tracking-tight text-white sm:text-5xl">
              Your college network,<br />
              <span className="bg-gradient-to-r from-brand-300 to-sky-200 bg-clip-text text-transparent">working for your career.</span>
            </h1>
            <p className="mt-5 max-w-xl text-lg text-navy-100">
              Connect with graduates from your own college. Get mentorship, referrals, internships and honest career advice from people who walked the same corridors.
            </p>

            <form onSubmit={submit} className="mt-8 flex max-w-xl flex-col gap-2 rounded-xl bg-white p-2 shadow-2xl sm:flex-row" role="search">
              <div className="flex flex-1 items-center gap-2 px-3">
                <Search className="h-5 w-5 text-slate-400" />
                <input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Try “React”, “Alumni working at TCS” or “Data Science”"
                  className="w-full bg-transparent py-2 text-sm text-slate-900 placeholder-slate-400 focus:outline-none"
                  aria-label="Search alumni"
                />
              </div>
              <button className="btn-primary px-6 py-2.5" type="submit">Search alumni</button>
            </form>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/register" className="btn bg-brand-500 text-white hover:bg-brand-400">I'm a student <ArrowRight className="h-4 w-4" /></Link>
              <Link to="/register?role=alumni" className="btn border border-white/30 text-white hover:bg-white/10">I'm an alumnus</Link>
            </div>
          </div>

          {/* Decorative profile preview */}
          <div className="relative hidden lg:block" aria-hidden="true">
            <div className="absolute -inset-4 rounded-3xl bg-gradient-to-tr from-brand-500/30 to-transparent blur-2xl" />
            <div className="relative rotate-1 space-y-4 rounded-2xl border border-white/10 bg-white/10 p-5 backdrop-blur">
              {[
                { n: 'Priya Sharma', r: 'Senior Software Engineer · Google', y: '2016', t: ['System Design', 'Java'] },
                { n: 'Neha Kulkarni', r: 'Software Engineer II · Microsoft', y: '2019', t: ['React', 'TypeScript'] },
                { n: 'Karan Malhotra', r: 'Data Scientist · Amazon', y: '2018', t: ['Python', 'ML'] },
              ].map((p) => (
                <div key={p.n} className="flex items-center gap-4 rounded-xl bg-white p-4 shadow-lift">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-navy-800 to-brand-500 font-display font-bold text-white">
                    {p.n.split(' ').map((w) => w[0]).join('')}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="flex items-center gap-1.5 font-display font-bold text-navy-950">{p.n} <BadgeCheck className="h-4 w-4 text-emerald-500" /></p>
                    <p className="truncate text-xs text-slate-500">{p.r} · Class of {p.y}</p>
                    <div className="mt-1.5 flex gap-1.5">{p.t.map((t) => <span key={t} className="chip">{t}</span>)}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Live stats */}
      <section className="relative z-10 mx-auto -mt-12 max-w-5xl px-4 sm:px-6">
        <div className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-slate-200 bg-slate-200 shadow-lift sm:grid-cols-4">
          {[
            { icon: Users, label: 'Verified alumni', value: stats?.alumni },
            { icon: Building2, label: 'Companies', value: stats?.companies },
            { icon: BriefcaseBusiness, label: 'Open opportunities', value: stats?.jobs },
            { icon: Network, label: 'Students', value: stats?.students },
          ].map(({ icon: Icon, label, value }) => (
            <div key={label} className="flex flex-col items-center bg-white px-4 py-6 text-center">
              <Icon className="mb-2 h-5 w-5 text-brand-600" />
              <p className="font-display text-3xl font-extrabold text-navy-900">{value ?? '–'}</p>
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl">Built for career guidance, not noise</h2>
          <p className="mt-3 text-slate-500">Everything is designed around one goal: helping students learn from alumni who've been there.</p>
        </div>
        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map(({ icon: Icon, title, text }) => (
            <div key={title} className="card-hover p-6">
              <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-lg bg-navy-50 text-navy-700"><Icon className="h-5 w-5" /></div>
              <h3 className="text-lg font-bold">{title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-slate-500">{text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Steps */}
      <section className="border-y border-slate-200 bg-slate-50 py-20">
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          <h2 className="text-center text-3xl font-extrabold tracking-tight">How it works</h2>
          <div className="mt-10 grid gap-6 sm:grid-cols-3">
            {STEPS.map((s) => (
              <div key={s.n} className="text-center">
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-navy-800 font-display text-lg font-bold text-white">{s.n}</div>
                <h3 className="font-bold">{s.title}</h3>
                <p className="mt-1 text-sm text-slate-500">{s.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-4 py-20 sm:px-6">
        <div className="mx-auto max-w-4xl rounded-3xl bg-gradient-to-br from-navy-900 to-navy-700 px-6 py-14 text-center text-white shadow-lift">
          <h2 className="text-3xl font-extrabold text-white">Ready to meet your alumni?</h2>
          <p className="mx-auto mt-3 max-w-xl text-navy-100">Join today. It takes a minute and the network gets stronger with every graduate who gives back.</p>
          <div className="mt-7 flex flex-wrap justify-center gap-3">
            <Link to="/register" className="btn bg-white text-navy-800 hover:bg-navy-50">Create free account</Link>
            <Link to="/login" className="btn border border-white/30 text-white hover:bg-white/10">Log in</Link>
          </div>
        </div>
      </section>

      <footer className="border-t border-slate-200 py-6 text-center text-xs text-slate-400">
        © {new Date().getFullYear()} AlumniConnect · College-specific professional network
      </footer>
    </div>
  );
}
