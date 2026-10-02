import { useState } from 'react';
import { Search, Send, UserCheck } from 'lucide-react';

// ---------- Data (sample, baad mein asli se badal lena) ----------
// Company ke hisaab se roles. Nayi company jodni ho toh bas ek line add karo
const companyRoles = {
  TCS: ['Software Engineer', 'System Engineer', 'Data Analyst'],
  Infosys: ['Systems Engineer', 'Data Analyst', 'Test Engineer'],
  Persistent: ['Frontend Developer Intern', 'Backend Developer', 'QA Engineer'],
  Accenture: ['Associate Software Engineer', 'Cloud Engineer', 'Business Analyst'],
  Wipro: ['Project Engineer', 'Data Engineer'],
};

// Jo alumni referral de sakte hain
const referrers = [
  { name: 'Rahul Patil', company: 'TCS', role: 'Software Engineer', photo: 'https://i.pravatar.cc/300?img=12' },
  { name: 'Omkar Shinde', company: 'TCS', role: 'DevOps Engineer', photo: 'https://i.pravatar.cc/300?img=15' },
  { name: 'Sneha Kulkarni', company: 'Persistent', role: 'SDE II', photo: 'https://i.pravatar.cc/300?img=47' },
  { name: 'Amit Deshmukh', company: 'Infosys', role: 'Data Analyst', photo: 'https://i.pravatar.cc/300?img=33' },
  { name: 'Priya Joshi', company: 'Accenture', role: 'Cloud Engineer', photo: 'https://i.pravatar.cc/300?img=45' },
];

const steps = [
  { icon: Search, title: 'Choose company', text: 'Pick the company and role you are targeting.' },
  { icon: Send, title: 'Send request', text: 'Submit your request to alumni working there.' },
  { icon: UserCheck, title: 'Get referred', text: 'An alumnus reviews it and refers you.' },
];

const box = 'w-full rounded-lg border border-slate-300 p-2 text-sm';

export default function Referrals() {
  const [list, setList] = useState([]);   // bheji hui requests
  const [company, setCompany] = useState('');
  const [role, setRole] = useState('');

  // Jo company type ki, wo list mein hai? (capital/small ka farak nahi)
  const match = Object.keys(companyRoles).find((c) => c.toLowerCase() === company.toLowerCase());
  const roles = match ? companyRoles[match] : [];

  // Company type hui hai toh sirf uske alumni, warna sabhi
  const shown = referrers.filter((r) => r.company.toLowerCase().includes(company.toLowerCase()));

  const changeCompany = (e) => {
    setCompany(e.target.value);
    setRole(''); // company badli toh purana role hata do
  };

  const submit = (e) => {
    e.preventDefault();
    setList([{ id: Date.now(), company, role }, ...list]); // nayi request sabse upar
    setCompany('');
    setRole('');
  };

  return (
    <div className="space-y-10">
      {/* 1. Banner: image na ho toh bhi navy background dikhta hai */}
      <section
        className="rounded-3xl bg-brand-900 bg-cover bg-center p-10 text-white md:p-14"
        style={{ backgroundImage: "linear-gradient(to right, rgba(15,37,71,.92), rgba(15,37,71,.55)), url('/images/referral.jpg')" }}
      >
        <h1 className="text-3xl font-extrabold md:text-4xl">Get referred by alumni</h1>
        <p className="mt-3 max-w-xl text-brand-200">
          Choose your target company, send a request and let our alumni open the door for you.
        </p>
      </section>

      {/* 2. Form + steps */}
      <section className="grid gap-6 md:grid-cols-2">
        <form onSubmit={submit} className="space-y-3 rounded-2xl border border-slate-200 bg-white p-6">
          <h2 className="text-lg font-bold text-slate-900">Request a referral</h2>

          {/* Company: type karo ya list se chuno */}
          <input required list="companies" value={company} onChange={changeCompany} placeholder="Company" className={box} />
          <datalist id="companies">
            {Object.keys(companyRoles).map((c) => <option key={c} value={c} />)}
          </datalist>

          {/* Role: company ke hisaab se suggestions */}
          <input required list="roles" value={role} onChange={(e) => setRole(e.target.value)} placeholder="Role" className={box} />
          <datalist id="roles">
            {roles.map((r) => <option key={r} value={r} />)}
          </datalist>

          <button className="rounded-lg bg-brand-800 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-900">
            Request Referral
          </button>
        </form>

        <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6">
          <h2 className="text-lg font-bold text-slate-900">How it works</h2>
          {steps.map(({ icon: Icon, title, text }) => (
            <div key={title} className="flex gap-4">
              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-brand-50 text-brand-700">
                <Icon size={20} />
              </div>
              <div>
                <p className="font-semibold text-slate-900">{title}</p>
                <p className="text-sm text-slate-500">{text}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 3. Alumni jo refer kar sakte hain */}
      <section>
        <h2 className="mb-5 text-xl font-bold text-slate-900">
          {company ? `Alumni at ${company}` : 'Alumni who can refer you'}
        </h2>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {shown.map((r) => (
            <div key={r.name} className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
              <img src={r.photo} alt={r.name} className="h-40 w-full object-cover" />
              <div className="p-4">
                <h3 className="font-bold text-slate-900">{r.name}</h3>
                <p className="text-sm text-slate-500">{r.role}</p>
                <p className="text-sm font-semibold text-brand-700">{r.company}</p>
              </div>
            </div>
          ))}
        </div>
        {shown.length === 0 && <p className="text-slate-500">No alumni listed for this company yet.</p>}
      </section>

      {/* 4. Meri requests */}
      <section>
        <h2 className="mb-5 text-xl font-bold text-slate-900">Your requests</h2>
        <div className="space-y-3">
          {list.length === 0 && <p className="text-slate-500">No referral requests yet.</p>}
          {list.map((r) => (
            <div key={r.id} className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-4">
              <div className="flex items-center gap-4">
                <div className="grid h-11 w-11 place-items-center rounded-lg bg-brand-800 text-sm font-bold text-white">
                  {r.company.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <p className="font-bold text-slate-900">{r.role}</p>
                  <p className="text-sm text-slate-500">{r.company}</p>
                </div>
              </div>
              <span className="rounded-full bg-yellow-100 px-3 py-1 text-xs font-semibold text-yellow-800">Pending</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}