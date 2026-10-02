import { useState } from 'react';
import { Search } from 'lucide-react';

// Mock data: asli project mein ye API se aata
const alumni = [
  { id: 1, name: 'Rahul Patil', company: 'TCS', batch: 2022, skills: 'React, Node.js' },
  { id: 2, name: 'Sneha Kulkarni', company: 'Persistent', batch: 2021, skills: 'Java, Spring' },
  { id: 3, name: 'Amit Deshmukh', company: 'Infosys', batch: 2023, skills: 'Python, SQL' },
  { id: 4, name: 'Priya Joshi', company: 'Accenture', batch: 2020, skills: 'React, AWS' },
  { id: 5, name: 'Omkar Shinde', company: 'TCS', batch: 2021, skills: 'DevOps, Docker' },
];

const box = 'rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm';

export default function Network() {
  const [search, setSearch] = useState('');
  const [company, setCompany] = useState('All');
  const [sortBy, setSortBy] = useState('name');

  const companies = ['All', ...new Set(alumni.map((a) => a.company))];

  // pehle search, phir company filter, phir sort
  const result = alumni
    .filter((a) => `${a.name} ${a.company} ${a.skills}`.toLowerCase().includes(search.toLowerCase()))
    .filter((a) => company === 'All' || a.company === company)
    .sort((a, b) => (sortBy === 'name' ? a.name.localeCompare(b.name) : b.batch - a.batch));

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-slate-900">Find Alumni</h1>

      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-56">
          <Search size={16} className="absolute left-3 top-3 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, company or skill"
            className={`${box} w-full pl-9`}
          />
        </div>
        <select value={company} onChange={(e) => setCompany(e.target.value)} className={box}>
          {companies.map((c) => <option key={c}>{c}</option>)}
        </select>
        <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className={box}>
          <option value="name">Sort: Name</option>
          <option value="batch">Sort: Newest batch</option>
        </select>
      </div>

      <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
        {result.map((a) => (
          <div key={a.id} className="flex gap-4 rounded-2xl border border-slate-200 bg-white p-5">
            <div className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-brand-800 font-bold text-white">
              {a.name.split(' ').map((w) => w[0]).join('')}
            </div>
            <div>
              <h3 className="font-bold text-slate-900">{a.name}</h3>
              <p className="text-sm text-slate-500">{a.company} • Batch {a.batch}</p>
              <p className="mt-2 text-sm text-brand-700">{a.skills}</p>
            </div>
          </div>
        ))}
      </div>

      {result.length === 0 && <p className="text-slate-500">No alumni found.</p>}
    </div>
  );
}