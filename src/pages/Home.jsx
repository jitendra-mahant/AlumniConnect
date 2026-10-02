import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Users, GraduationCap, Briefcase } from 'lucide-react';

// ---------- Data (sample, baad mein asli se badal lena) ----------
const features = [
  { title: 'Discover Alumni', text: 'Search alumni by company, batch and skills.', to: '/network', icon: Users },
  { title: 'Get Mentorship', text: 'Request guidance from experienced alumni.', to: '/mentors', icon: GraduationCap },
  { title: 'Find Opportunities', text: 'Explore jobs and referrals shared by alumni.', to: '/jobs', icon: Briefcase },
];

const alumni = [
  { name: 'Rahul Patil', role: 'Software Engineer', company: 'TCS', photo: 'https://i.pravatar.cc/300?img=12' },
  { name: 'Sneha Kulkarni', role: 'SDE II', company: 'Persistent', photo: 'https://i.pravatar.cc/300?img=47' },
  { name: 'Amit Deshmukh', role: 'Data Analyst', company: 'Infosys', photo: 'https://i.pravatar.cc/300?img=33' },
  { name: 'Priya Joshi', role: 'Cloud Engineer', company: 'Accenture', photo: 'https://i.pravatar.cc/300?img=45' },
];

const events = [
  { date: '12 Oct', title: 'Alumni Meet 2026', place: 'Seminar Hall' },
  { date: '25 Oct', title: 'Resume Review Session', place: 'Online' },
  { date: '08 Nov', title: 'Career Talk: Backend Engineering', place: 'Auditorium' },
];

// ---------- Scroll animation ----------
// Jab ye element screen par aata hai, "show" class lag jaati hai
function Reveal({ children }) {
  const ref = useRef(null);
  const [show, setShow] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) setShow(true);
    });
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return <div ref={ref} className={show ? 'reveal show' : 'reveal'}>{children}</div>;
}

// ---------- Page ----------
export default function Home() {
  return (
    <div className="space-y-16">
      {/* 1. Hero */}
      <section className="grid md:grid-cols-[1fr_300px] gap-10 items-center rounded-3xl border border-slate-200 bg-gradient-to-br from-brand-50 to-white p-10 md:p-14">
        <div>
          <span className="rounded-full bg-brand-100 px-3 py-1 text-xs font-semibold text-brand-800">
            K. K. Wagh Alumni Community
          </span>
          <h1 className="mt-5 text-4xl md:text-5xl font-extrabold text-brand-900">
            Connect with alumni.<br />Learn. Grow. Succeed.
          </h1>
          <p className="mt-4 max-w-xl text-slate-600">
            Build professional connections, find mentors and discover career opportunities.
          </p>
          <div className="mt-7 flex gap-3">
            <Link to="/network" className="rounded-lg bg-brand-800 px-5 py-2.5 text-sm font-semibold text-white">Find Alumni</Link>
            <Link to="/jobs" className="rounded-lg border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-brand-800">Explore Opportunities</Link>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 space-y-3">
          <h3 className="font-bold text-slate-900">Your Alumni Network</h3>
          <p className="flex justify-between"><b className="text-brand-800">1,248</b><span className="text-sm text-slate-500">Alumni</span></p>
          <p className="flex justify-between"><b className="text-brand-800">18</b><span className="text-sm text-slate-500">Mentors</span></p>
          <p className="flex justify-between"><b className="text-brand-800">42</b><span className="text-sm text-slate-500">Opportunities</span></p>
        </div>
      </section>

      {/* 2. Features */}
      <section>
        <Reveal><h2 className="mb-5 text-xl font-bold text-slate-900">What can you do?</h2></Reveal>
        <div className="grid gap-5 md:grid-cols-3">
          {features.map(({ title, text, to, icon: Icon }) => (
            <Reveal key={title}>
              <Link to={to} className="block rounded-2xl border border-slate-200 bg-white p-6 hover:border-brand-300">
                <Icon className="text-brand-700" size={24} />
                <h3 className="mt-3 font-bold text-slate-900">{title}</h3>
                <p className="mt-1 text-sm text-slate-500">{text}</p>
              </Link>
            </Reveal>
          ))}
        </div>
      </section>

      {/* 3. Alumni photos */}
      <section>
        <Reveal><h2 className="mb-5 text-2xl font-bold text-slate-900">Meet our Alumni</h2></Reveal>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {alumni.map((a) => (
            <Reveal key={a.name}>
              <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
                <img src={a.photo} alt={a.name} className="h-56 w-full object-cover" />
                <div className="p-4">
                  <h3 className="font-bold text-slate-900">{a.name}</h3>
                  <p className="text-sm text-slate-500">{a.role} • {a.company}</p>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* 4. Events */}
      <section>
        <Reveal><h2 className="mb-5 text-xl font-bold text-slate-900">Upcoming Events</h2></Reveal>
        <Reveal>
          <div className="divide-y divide-slate-100 rounded-2xl border border-slate-200 bg-white">
            {events.map((e) => (
              <div key={e.title} className="flex items-center gap-4 p-4">
                <span className="w-20 font-bold text-brand-800">{e.date}</span>
                <div>
                  <p className="font-semibold text-slate-900">{e.title}</p>
                  <p className="text-sm text-slate-500">{e.place}</p>
                </div>
              </div>
            ))}
          </div>
        </Reveal>
      </section>

      {/* 5. Connect section */}
      <Reveal>
        <section className="rounded-3xl bg-brand-900 p-12 text-center text-white">
          <h2 className="text-3xl font-extrabold">Connect with our Alumni Network</h2>
          <p className="mt-3 text-brand-200">Find mentors, get referrals and grow together.</p>
          <Link to="/network" className="mt-6 inline-block rounded-lg bg-white px-6 py-3 text-sm font-semibold text-brand-800">
            Browse all alumni
          </Link>
        </section>
      </Reveal>
    </div>
  );
}