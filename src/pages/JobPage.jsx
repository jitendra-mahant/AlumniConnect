import { useState, useEffect } from 'react';
import { Bookmark } from 'lucide-react';

const jobs = [
  { id: 1, title: 'Frontend Developer Intern', company: 'Persistent', type: 'Internship', location: 'Pune', daysAgo: 2 },
  { id: 2, title: 'Software Engineer', company: 'TCS', type: 'Full-time', location: 'Mumbai', daysAgo: 5 },
  { id: 3, title: 'Data Analyst', company: 'Infosys', type: 'Full-time', location: 'Bengaluru', daysAgo: 1 },
  { id: 4, title: 'Backend Intern', company: 'Accenture', type: 'Internship', location: 'Pune', daysAgo: 7 },
];

const box = 'rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm';

export default function JobPage() {
  const [search, setSearch] = useState('');
  const [type, setType] = useState('All');
  const [sortBy, setSortBy] = useState('newest');
  const [showSaved, setShowSaved] = useState(false);

  // saved jobs localStorage se aate hain, isliye refresh ke baad bhi bache rehte hain
  const [saved, setSaved] = useState(() => JSON.parse(localStorage.getItem('savedJobs')) || []);
  useEffect(() => {
    localStorage.setItem('savedJobs', JSON.stringify(saved));
  }, [saved]);

  const toggleSave = (id) =>
    setSaved(saved.includes(id) ? saved.filter((x) => x !== id) : [...saved, id]);

  const result = jobs
    .filter((j) => !showSaved || saved.includes(j.id))
    .filter((j) => `${j.title} ${j.company}`.toLowerCase().includes(search.toLowerCase()))
    .filter((j) => type === 'All' || j.type === type)
    .sort((a, b) => (sortBy === 'newest' ? a.daysAgo - b.daysAgo : a.title.localeCompare(b.title)));

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-slate-900">Opportunities</h1>

      <div className="flex gap-2">
        <button onClick={() => setShowSaved(false)} className={`rounded-lg px-4 py-2 text-sm font-semibold ${!showSaved ? 'bg-brand-800 text-white' : 'bg-white border border-slate-300'}`}>
          All Jobs
        </button>
        <button onClick={() => setShowSaved(true)} className={`rounded-lg px-4 py-2 text-sm font-semibold ${showSaved ? 'bg-brand-800 text-white' : 'bg-white border border-slate-300'}`}>
          Saved ({saved.length})
        </button>
      </div>

      <div className="flex flex-wrap gap-3">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search job or company"
          className={`${box} flex-1 min-w-56`}
        />
        <select value={type} onChange={(e) => setType(e.target.value)} className={box}>
          <option>All</option>
          <option>Internship</option>
          <option>Full-time</option>
        </select>
        <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className={box}>
          <option value="newest">Sort: Newest</option>
          <option value="title">Sort: Title</option>
        </select>
      </div>

      <div className="space-y-3">
        {result.map((j) => (
          <div key={j.id} className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-5">
            <div>
              <h3 className="font-bold text-slate-900">{j.title}</h3>
              <p className="text-sm text-slate-500">{j.company} • {j.location} • {j.type} • {j.daysAgo}d ago</p>
            </div>
            <button onClick={() => toggleSave(j.id)} aria-label="Save job">
              <Bookmark size={22} className={saved.includes(j.id) ? 'fill-brand-600 text-brand-600' : 'text-slate-400'} />
            </button>
          </div>
        ))}
        {result.length === 0 && <p className="text-slate-500">No jobs found.</p>}
      </div>
    </div>
  );
}