import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Filter, HandHeart, Handshake, Search, SearchX, X } from 'lucide-react';
import api from '../api/client';
import useFetch from '../hooks/useFetch';
import AlumniCard from '../components/AlumniCard';
import { CardSkeletons, EmptyState, ErrorState, Pagination, PageHeader } from '../components/ui';
import { useAuth } from '../context/AuthContext';

const SELECTS = [
  { key: 'department', label: 'Department', source: 'departments' },
  { key: 'domain', label: 'Professional domain', source: 'domains' },
  { key: 'industry', label: 'Industry', source: 'industries' },
  { key: 'company', label: 'Company', source: 'companies' },
  { key: 'graduationYear', label: 'Graduation year', source: 'graduationYears' },
  { key: 'location', label: 'Location', source: 'locations' },
];

const EXPERIENCE = [
  { label: 'Any experience', value: '' },
  { label: '1+ years', value: '1' },
  { label: '3+ years', value: '3' },
  { label: '5+ years', value: '5' },
  { label: '8+ years', value: '8' },
];

export default function AlumniDirectory() {
  const { user } = useAuth();
  const [params, setParams] = useSearchParams();
  const [draft, setDraft] = useState(params.get('q') || '');
  const [suggestions, setSuggestions] = useState([]);
  const [showSug, setShowSug] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const boxRef = useRef(null);

  const query = Object.fromEntries(params.entries());
  const { data, loading, error, reload } = useFetch('/alumni/search', { limit: 12, ...query });
  const { data: filterData } = useFetch('/alumni/filters');
  const options = filterData?.data || {};

  useEffect(() => setDraft(params.get('q') || ''), [params]);

  // Trie-powered autocomplete (debounced).
  useEffect(() => {
    const term = draft.trim();
    if (term.length < 2) { setSuggestions([]); return undefined; }
    const t = setTimeout(() => {
      api.get('/alumni/suggest', { params: { q: term } }).then((r) => setSuggestions(r.data.data)).catch(() => setSuggestions([]));
    }, 180);
    return () => clearTimeout(t);
  }, [draft]);

  useEffect(() => {
    const close = (e) => boxRef.current && !boxRef.current.contains(e.target) && setShowSug(false);
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);

  const update = (patch) => {
    const next = new URLSearchParams(params);
    Object.entries(patch).forEach(([k, v]) => (v === '' || v === undefined || v === false ? next.delete(k) : next.set(k, v)));
    if (!('page' in patch)) next.delete('page');
    setParams(next);
  };

  const submit = (e) => { e.preventDefault(); setShowSug(false); update({ q: draft.trim() }); };
  const pick = (label) => { setDraft(label); setShowSug(false); update({ q: label }); };

  const activeKeys = ['q', ...SELECTS.map((s) => s.key), 'minExperience', 'availableForMentorship', 'availableForReferral', 'skill'];
  const active = activeKeys.filter((k) => params.get(k));
  const alumni = data?.data || [];

  const [directoryTab, setDirectoryTab] = useState('all');
  const [recommendations, setRecommendations] = useState([]);
  const [recLoading, setRecLoading] = useState(false);

  useEffect(() => {
    if (directoryTab === 'recommended') {
      setRecLoading(true);
      api
        .get('/alumni/recommendations')
        .then((res) => setRecommendations(res.data.data))
        .catch(() => setRecommendations([]))
        .finally(() => setRecLoading(false));
    }
  }, [directoryTab]);

  return (
    <div className="page">
      <PageHeader
        title="Alumni Directory"
        subtitle={
          user.role === 'admin'
            ? 'All alumni profiles, including pending ones.'
            : 'Search verified alumni by company, role, domain, skill, year or location.'
        }
      />

      {/* Directory Tab Switcher */}
      <div className="mb-5 flex gap-2 border-b border-slate-200 pb-3">
        <button
          onClick={() => setDirectoryTab('all')}
          className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${
            directoryTab === 'all'
              ? 'bg-navy-800 text-white shadow-sm'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          All Alumni
        </button>
        <button
          onClick={() => setDirectoryTab('recommended')}
          className={`rounded-lg px-4 py-2 text-sm font-semibold transition flex items-center gap-1.5 ${
            directoryTab === 'recommended'
              ? 'bg-navy-800 text-white shadow-sm'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          <span className="text-amber-400">★</span> Recommended For You
        </button>
      </div>

      <form onSubmit={submit} className="card relative z-10 p-3" role="search" ref={boxRef}>
        <div className="flex flex-col gap-2 sm:flex-row">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              className="input pl-9"
              placeholder="Search “React”, “Software Engineering”, “Alumni working at TCS”…"
              value={draft}
              onChange={(e) => { setDraft(e.target.value); setShowSug(true); }}
              onFocus={() => setShowSug(true)}
              aria-label="Search alumni"
              autoComplete="off"
            />
            {showSug && suggestions.length > 0 && (
              <ul className="absolute inset-x-0 top-full mt-1 overflow-hidden rounded-lg border border-slate-200 bg-white py-1 shadow-lift" role="listbox">
                {suggestions.map((s) => (
                  <li key={s.label}>
                    <button type="button" className="flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-navy-50" onClick={() => pick(s.label)}>
                      <span>{s.label}</span>
                      <span className="text-xs text-slate-400">{s.count} {s.count === 1 ? 'match' : 'matches'}</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <button type="submit" className="btn-primary px-6">Search</button>
          <button type="button" className="btn-secondary lg:hidden" onClick={() => setShowFilters((s) => !s)}>
            <Filter className="h-4 w-4" /> Filters
          </button>
        </div>
      </form>

      <div className="mt-6 grid gap-6 lg:grid-cols-[280px_1fr]">
        <aside className={`${showFilters ? 'block' : 'hidden'} lg:block`} aria-label="Filters">
          <div className="card space-y-4 p-4 lg:sticky lg:top-20">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold uppercase tracking-wide text-navy-900">Filters</h2>
              {active.length > 0 && (
                <button className="text-xs font-semibold text-brand-700 hover:underline" onClick={() => { setDraft(''); setParams({}); }}>
                  Clear all
                </button>
              )}
            </div>

            {SELECTS.map(({ key, label, source }) => (
              <div key={key}>
                <label className="label" htmlFor={`f-${key}`}>{label}</label>
                <select id={`f-${key}`} className="input" value={params.get(key) || ''} onChange={(e) => update({ [key]: e.target.value })}>
                  <option value="">All</option>
                  {(options[source] || []).map((o) => <option key={o} value={o}>{o}</option>)}
                </select>
              </div>
            ))}

            <div>
              <label className="label" htmlFor="f-exp">Experience</label>
              <select id="f-exp" className="input" value={params.get('minExperience') || ''} onChange={(e) => update({ minExperience: e.target.value })}>
                {EXPERIENCE.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>

            <div>
              <label className="label" htmlFor="f-sort">Sort by</label>
              <select id="f-sort" className="input" value={params.get('sort') || ''} onChange={(e) => update({ sort: e.target.value })}>
                <option value="">Most experienced</option>
                <option value="recent">Recent graduates</option>
                <option value="oldest">Earliest batch</option>
                <option value="name">Name (A–Z)</option>
              </select>
            </div>

            <div className="space-y-2 border-t border-slate-100 pt-3">
              {[
                { key: 'availableForMentorship', label: 'Available for mentorship', icon: HandHeart },
                { key: 'availableForReferral', label: 'Can provide referrals', icon: Handshake },
              ].map(({ key, label, icon: Icon }) => (
                <label key={key} className="flex cursor-pointer items-center gap-2 text-sm text-slate-700">
                  <input type="checkbox" className="h-4 w-4 rounded border-slate-300 text-navy-700 focus:ring-brand-500" checked={params.get(key) === 'true'} onChange={(e) => update({ [key]: e.target.checked ? 'true' : '' })} />
                  <Icon className="h-4 w-4 text-navy-600" /> {label}
                </label>
              ))}
            </div>

            {options.topSkills?.length > 0 && (
              <div className="border-t border-slate-100 pt-3">
                <span className="label">Popular skills</span>
                <div className="flex flex-wrap gap-1.5">
                  {options.topSkills.slice(0, 10).map((s) => (
                    <button key={s.skill} onClick={() => update({ skill: params.get('skill') === s.skill ? '' : s.skill })} className={`chip capitalize transition hover:bg-navy-100 ${params.get('skill') === s.skill ? '!bg-navy-800 !text-white' : ''}`}>
                      {s.skill} <span className="opacity-60">{s.count}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </aside>

        <section aria-live="polite">
          {directoryTab === 'recommended' ? (
            <div>
              <div className="mb-4 rounded-xl border border-blue-100 bg-blue-50/60 p-4">
                <h3 className="text-sm font-bold text-navy-950">Personalized Alumni Matches</h3>
                <p className="mt-0.5 text-xs text-slate-600">
                  Ranked by shared department, matching skillsets, and mentorship availability.
                </p>
              </div>
              {recLoading ? (
                <CardSkeletons count={6} />
              ) : recommendations.length === 0 ? (
                <EmptyState
                  icon={SearchX}
                  title="No recommendations found"
                  message="Update your profile department and skills to get personalized matches."
                />
              ) : (
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  {recommendations.map((a) => (
                    <AlumniCard key={a._id} alumni={a} />
                  ))}
                </div>
              )}
            </div>
          ) : (
            <>
              {active.length > 0 && (
                <div className="mb-4 flex flex-wrap items-center gap-2">
                  {active.map((k) => (
                    <button
                      key={k}
                      className="chip !bg-navy-800 !text-white"
                      onClick={() => {
                        if (k === 'q') setDraft('');
                        update({ [k]: '' });
                      }}
                    >
                      {k === 'availableForMentorship'
                        ? 'Mentorship'
                        : k === 'availableForReferral'
                        ? 'Referrals'
                        : k === 'minExperience'
                        ? `${params.get(k)}+ yrs`
                        : params.get(k)}
                      <X className="h-3 w-3" />
                    </button>
                  ))}
                </div>
              )}

              {!loading && !error && (
                <p className="mb-3 text-sm text-slate-500">
                  <b className="text-slate-800">{data?.total ?? 0}</b> alumni found
                </p>
              )}

              {loading && !data ? (
                <CardSkeletons />
              ) : error ? (
                <ErrorState message={error} onRetry={reload} />
              ) : alumni.length === 0 ? (
                <EmptyState
                  icon={SearchX}
                  title="No alumni match your search"
                  message="Try removing a filter or searching for a broader term like “Software” or “Data”."
                />
              ) : (
                <div className={`grid gap-4 sm:grid-cols-2 xl:grid-cols-3 ${loading ? 'opacity-60 transition' : ''}`}>
                  {alumni.map((a) => (
                    <AlumniCard key={a._id} alumni={a} />
                  ))}
                </div>
              )}
              <Pagination page={data?.page || 1} pages={data?.pages || 1} onChange={(p) => update({ page: p })} />
            </>
          )}
        </section>
      </div>
    </div>
  );
}
