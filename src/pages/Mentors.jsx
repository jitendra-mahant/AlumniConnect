import { useState } from 'react';

const mentors = [
  { id: 1, name: 'Sneha Kulkarni', role: 'SDE II', company: 'Persistent', skills: 'Java, System Design' },
  { id: 2, name: 'Priya Joshi', role: 'Cloud Engineer', company: 'Accenture', skills: 'AWS, React' },
  { id: 3, name: 'Rahul Patil', role: 'Full Stack Developer', company: 'TCS', skills: 'Node.js, MongoDB' },
];

export default function Mentors() {
  const [selected, setSelected] = useState(null); // jis mentor ka modal khula hai
  const [requested, setRequested] = useState([]); // jinko request bhej di

  const send = (e) => {
    e.preventDefault();
    setRequested([...requested, selected.id]);
    setSelected(null);
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-slate-900">Mentorship</h1>

      <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
        {mentors.map((m) => (
          <div key={m.id} className="rounded-2xl border border-slate-200 bg-white p-5">
            <h3 className="font-bold text-slate-900">{m.name}</h3>
            <p className="text-sm text-slate-500">{m.role} • {m.company}</p>
            <p className="mt-2 text-sm text-brand-700">{m.skills}</p>
            <button
              disabled={requested.includes(m.id)}
              onClick={() => setSelected(m)}
              className="mt-4 w-full rounded-lg bg-brand-800 py-2 text-sm font-semibold text-white hover:bg-brand-900 disabled:bg-slate-300"
            >
              {requested.includes(m.id) ? 'Requested ✓' : 'Request Mentorship'}
            </button>
          </div>
        ))}
      </div>

      {/* Modal: selected null nahi hai tabhi dikhta hai */}
      {selected && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4">
          <form onSubmit={send} className="w-full max-w-md space-y-4 rounded-2xl bg-white p-6">
            <h2 className="text-lg font-bold">Request {selected.name}</h2>
            <textarea required rows="4" placeholder="Kis topic pe guidance chahiye?" className="w-full rounded-lg border border-slate-300 p-2 text-sm" />
            <div className="flex gap-3">
              <button className="flex-1 rounded-lg bg-brand-800 py-2 text-sm font-semibold text-white">Send</button>
              <button type="button" onClick={() => setSelected(null)} className="flex-1 rounded-lg border border-slate-300 py-2 text-sm font-semibold">Cancel</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}