import { useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  Building2, Filter, GraduationCap, HandHeart, Handshake, Linkedin, Lock, Search, SearchX, Sparkles, Users, X,
} from 'lucide-react';

import api from '../api/client';
import useFetch from '../hooks/useFetch';
import AlumniCard from '../components/AlumniCard';
import {
  Avatar, CardSkeletons, EmptyState, ErrorState, Pagination, PageHeader, PageLoader,
} from '../components/ui';
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

  // Tab state: 'all' | 'company' | 'years' | 'recommended'
  const [directoryTab, setDirectoryTab] = useState('all');

  // Search parameters for backend API
  const query = Object.fromEntries(params.entries());
  const { data: searchData, loading, error, reload } = useFetch('/alumni/search', { limit: 12, ...query });
  const { data: filterData } = useFetch('/alumni/filters');
  const options = filterData?.data || {};

  // Company directory query (using identical query filters dynamically)
  const {
    data: companyData,
    loading: compLoading,
    error: compError,
    reload: reloadCompanies,
  } = useFetch('/alumni/company-directory', query, { enabled: directoryTab === 'company' });

  // Year-wise overview query
  const [selectedBatchYear, setSelectedBatchYear] = useState('all');
  const {
    data: yearData,
    loading: yearLoading,
    error: yearError,
    reload: reloadYears,
  } = useFetch('/alumni/year-overview', {}, { enabled: directoryTab === 'years' });

  // Recommendations
  const [recommendations, setRecommendations] = useState([]);
  const [recLoading, setRecLoading] = useState(false);

  // Optional imported Compass data
  const [importedAlumni, setImportedAlumni] = useState([]);

  useEffect(() => {
    api.get('/alumni/imported')
      .then((res) => setImportedAlumni(Array.isArray(res.data?.data) ? res.data.data : []))
      .catch(() => setImportedAlumni([]));
  }, []);

  useEffect(() => {
    if (directoryTab === 'recommended') {
      setRecLoading(true);
      api.get('/alumni/recommendations')
        .then((res) => setRecommendations(res.data.data || []))
        .catch(() => setRecommendations([]))
        .finally(() => setRecLoading(false));
    }
  }, [directoryTab]);

  useEffect(() => setDraft(params.get('q') || ''), [params]);

  // Trie autocomplete
  useEffect(() => {
    const term = draft.trim();
    if (term.length < 2) {
      setSuggestions([]);
      return undefined;
    }

    const t = setTimeout(() => {
      api.get('/alumni/suggest', { params: { q: term } })
        .then((r) => setSuggestions(r.data.data || []))
        .catch(() => setSuggestions([]));
    }, 180);

    return () => clearTimeout(t);
  }, [draft]);

  useEffect(() => {
    const close = (e) =>
      boxRef.current &&
      !boxRef.current.contains(e.target) &&
      setShowSug(false);

    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);

  const update = (patch) => {
    const next = new URLSearchParams(params);
    Object.entries(patch).forEach(([k, v]) =>
      v === '' || v === undefined || v === false
        ? next.delete(k)
        : next.set(k, v)
    );
    if (!('page' in patch)) next.delete('page');
    setParams(next);
  };

  const submit = (e) => {
    e.preventDefault();
    setShowSug(false);
    update({ q: draft.trim() });
  };

  const pick = (label) => {
    setDraft(label);
    setShowSug(false);
    update({ q: label });
  };

  const activeKeys = [
    'q',
    ...SELECTS.map((s) => s.key),
    'minExperience',
    'availableForMentorship',
    'availableForReferral',
    'skill',
  ];
  const active = activeKeys.filter((k) => params.get(k));

  const verifiedAlumni = searchData?.data || [];
  const totalFound = searchData?.total ?? 0;
  const totalPages = searchData?.pages ?? 1;

  const filteredYearBatches = (yearData?.data || []).filter((b) => {
    if (selectedBatchYear === 'all') return true;
    return String(b.year) === String(selectedBatchYear);
  });

  return (
    <div className="page">
      <PageHeader
        title="Alumni Directory"
        subtitle={
          user?.role === 'admin'
            ? 'Explore, verify and connect with alumni from K.K. Wagh Institute of Engineering Education & Research.'
            : 'Explore alumni by name, company, role, skills or graduation year.'
        }
      />

      <div className="mb-5 flex flex-wrap gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
        <button
          onClick={() => {
            setDirectoryTab('all');
            if (params.get('graduationYear')) update({ graduationYear: '' });
          }}
          className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${
            directoryTab === 'all'
              ? 'bg-brand-600 text-white shadow-sm'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
          }`}
        >
          All Alumni {totalFound > 0 && `(${totalFound})`}
        </button>

        <button
          onClick={() => setDirectoryTab('company')}
          className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${
            directoryTab === 'company'
              ? 'bg-brand-600 text-white shadow-sm'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
          }`}
        >
          <Building2 className="mr-1.5 inline h-4 w-4" />
          Company Directory {companyData?.totalCompanies > 0 && `(${companyData.totalCompanies})`}
        </button>

        <button
          onClick={() => {
            setDirectoryTab('years');
          }}
          className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${
            directoryTab === 'years'
              ? 'bg-brand-600 text-white shadow-sm'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
          }`}
        >
          <GraduationCap className="mr-1.5 inline h-4 w-4" />
          Year-Wise Overview {yearData?.totalBatches > 0 && `(${yearData.totalBatches})`}
        </button>

        <button
          onClick={() => setDirectoryTab('recommended')}
          className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${
            directoryTab === 'recommended'
              ? 'bg-brand-600 text-white shadow-sm'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
          }`}
        >
          <span className="text-amber-400">★</span> Recommended For You
        </button>
      </div>

      <form
        onSubmit={submit}
        className="card relative z-10 p-3"
        role="search"
        ref={boxRef}
      >
        <div className="flex flex-col gap-2 sm:flex-row">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              className="input pl-9 bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700"
              placeholder="Search alumni by name, company, skill (e.g. “React”, “TCS”)..."
              value={draft}
              onChange={(e) => {
                setDraft(e.target.value);
                setShowSug(true);
              }}
              onFocus={() => setShowSug(true)}
              aria-label="Search alumni"
              autoComplete="off"
            />

            {showSug && suggestions.length > 0 && (
              <ul className="absolute inset-x-0 top-full mt-1 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 py-1 shadow-lg z-20">
                {suggestions.map((s) => (
                  <li key={s.label}>
                    <button
                      type="button"
                      className="flex w-full justify-between px-3 py-2 text-left text-sm hover:bg-slate-100 dark:hover:bg-slate-800"
                      onClick={() => pick(s.label)}
                    >
                      <span className="font-medium text-slate-800 dark:text-slate-100">{s.label}</span>
                      <span className="text-xs text-slate-400">
                        {s.count} match{s.count > 1 ? 'es' : ''}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <button type="submit" className="btn-primary px-6">
            Search
          </button>

          <button
            type="button"
            className="btn-secondary lg:hidden"
            onClick={() => setShowFilters((s) => !s)}
          >
            <Filter className="h-4 w-4" /> Filters
          </button>
        </div>
      </form>

      <div className="mt-6 grid gap-6 lg:grid-cols-[280px_1fr]">
        <aside
          className={`${showFilters ? 'block' : 'hidden'} lg:block`}
          aria-label="Filters"
        >
          <div className="card space-y-4 p-4 lg:sticky lg:top-20">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold uppercase text-slate-900 dark:text-slate-100">
                Filters
              </h2>

              {active.length > 0 && (
                <button
                  className="text-xs font-semibold text-brand-600 dark:text-brand-400 hover:underline"
                  onClick={() => {
                    setDraft('');
                    setParams({});
                  }}
                >
                  Clear all
                </button>
              )}
            </div>

            {SELECTS.map(({ key, label, source }) => (
              <div key={key}>
                <label className="label text-slate-700 dark:text-slate-300" htmlFor={`f-${key}`}>
                  {label}
                </label>
                <select
                  id={`f-${key}`}
                  className="input bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700"
                  value={params.get(key) || ''}
                  onChange={(e) => update({ [key]: e.target.value })}
                >
                  <option value="">All</option>
                  {(options[source] || []).map((o) => (
                    <option key={o} value={o}>{o}</option>
                  ))}
                </select>
              </div>
            ))}

            <div>
              <label className="label text-slate-700 dark:text-slate-300" htmlFor="f-exp">Experience</label>
              <select
                id="f-exp"
                className="input bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700"
                value={params.get('minExperience') || ''}
                onChange={(e) => update({ minExperience: e.target.value })}
              >
                {EXPERIENCE.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>

            <div className="space-y-2 border-t border-slate-200 dark:border-slate-800 pt-3">
              {[
                { key: 'availableForMentorship', label: 'Available for mentorship', icon: HandHeart },
                { key: 'availableForReferral', label: 'Can provide referrals', icon: Handshake },
              ].map(({ key, label, icon: Icon }) => (
                <label key={key} className="flex cursor-pointer items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
                  <input
                    type="checkbox"
                    className="rounded border-slate-300 dark:border-slate-700 text-brand-600 focus:ring-brand-500"
                    checked={params.get(key) === 'true'}
                    onChange={(e) =>
                      update({ [key]: e.target.checked ? 'true' : '' })
                    }
                  />
                  <Icon className="h-4 w-4 text-brand-600 dark:text-brand-400" /> {label}
                </label>
              ))}
            </div>

            {options.topSkills?.length > 0 && (
              <div className="border-t border-slate-200 dark:border-slate-800 pt-3">
                <p className="text-xs font-semibold uppercase text-slate-500 dark:text-slate-400">Popular Skills</p>
                <div className="flex flex-wrap gap-1 mt-1.5">
                  {options.topSkills.slice(0, 10).map((s) => (
                    <button
                      key={s.skill}
                      type="button"
                      onClick={() => update({ skill: params.get('skill') === s.skill ? '' : s.skill })}
                      className={`chip text-[11px] ${
                        params.get('skill') === s.skill
                          ? '!bg-navy-800 !text-white'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                      }`}
                    >
                      {s.skill}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </aside>

        <section aria-live="polite">
          {directoryTab === 'company' ? (
            <div className="space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-3">
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Grouped by company: <b className="text-slate-800 dark:text-slate-200">{companyData?.totalAlumni || 0}</b> alumni across <b className="text-slate-800 dark:text-slate-200">{companyData?.totalCompanies || 0}</b> companies
                </p>
                {params.get('company') && (
                  <button
                    onClick={() => update({ company: '' })}
                    className="text-xs font-semibold text-brand-600 dark:text-brand-400 hover:underline flex items-center gap-1"
                  >
                    Clear company filter ({params.get('company')}) <X className="h-3 w-3" />
                  </button>
                )}
              </div>

              {compLoading && !companyData ? (
                <CardSkeletons count={6} />
              ) : compError ? (
                <ErrorState message={compError} onRetry={reloadCompanies} />
              ) : (companyData?.data || []).length === 0 ? (
                <EmptyState
                  icon={Building2}
                  title="No companies found"
                  message="Try clearing your search or filter terms to see alumni companies."
                />
              ) : (
                <div className="space-y-6">
                  {companyData.data.map((grp) => (
                    <div
                      key={grp.company}
                      className="card p-5 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3 mb-4">
                        <div className="flex items-center gap-3">
                          <div
                            className={`flex h-10 w-10 items-center justify-center rounded-lg ${
                              grp.company === 'Company Not Specified'
                                ? 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                                : 'bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-300'
                            }`}
                          >
                            <Building2 className="h-5 w-5" />
                          </div>
                          <div>
                            <h3 className="font-display font-bold text-base text-slate-900 dark:text-slate-100">
                              {grp.company}
                            </h3>
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                              {grp.count} {grp.count === 1 ? 'alumnus' : 'alumni'} registered
                            </p>
                          </div>
                        </div>

                        {grp.company !== 'Company Not Specified' && (
                          <button
                            onClick={() => update({ company: grp.company })}
                            className="btn-secondary btn-sm text-xs"
                            title={`Filter entire directory by ${grp.company}`}
                          >
                            Filter by {grp.company}
                          </button>
                        )}
                      </div>

                      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                        {grp.alumni.map((a) => (
                          <div
                            key={a._id}
                            className="p-3.5 rounded-lg border border-slate-100 dark:border-slate-800/80 bg-slate-50/60 dark:bg-slate-900/60 flex flex-col justify-between"
                          >
                            <div>
                              <div className="flex items-start gap-2.5">
                                <Avatar name={a.fullName} src={a.profilePhoto} size="sm" />
                                <div className="min-w-0 flex-1">
                                  <Link
                                    to={`/alumni/${a._id}`}
                                    className="block truncate font-bold text-sm text-slate-900 dark:text-slate-100 hover:text-brand-600 dark:hover:text-brand-400"
                                  >
                                    {a.fullName}
                                  </Link>
                                  <p className="truncate text-xs text-slate-600 dark:text-slate-400">
                                    {a.currentJobTitle}
                                  </p>
                                </div>
                              </div>

                              <div className="mt-2.5 flex flex-wrap gap-1 text-[11px] text-slate-500 dark:text-slate-400">
                                <span className="inline-flex items-center gap-1 rounded bg-slate-200/60 dark:bg-slate-800 px-1.5 py-0.5">
                                  <GraduationCap className="h-3 w-3" /> Class of {a.graduationYear || '2022'}
                                </span>
                                {a.department && (
                                  <span className="truncate rounded bg-slate-200/60 dark:bg-slate-800 px-1.5 py-0.5">
                                    {a.department}
                                  </span>
                                )}
                              </div>

                              {a.skills?.length > 0 && (
                                <div className="mt-2 flex flex-wrap gap-1">
                                  {a.skills.slice(0, 3).map((s) => (
                                    <span
                                      key={s}
                                      className="text-[10px] px-1.5 py-0.5 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300"
                                    >
                                      {s}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>

                            <div className="mt-3 pt-2.5 border-t border-slate-200/60 dark:border-slate-800 flex items-center justify-between text-xs">
                              {a.linkedinUrl ? (
                                <a
                                  href={a.linkedinUrl}
                                  target="_blank"
                                  rel="noreferrer noopener"
                                  className="inline-flex items-center gap-1 font-semibold text-teal-600 dark:text-teal-400 hover:underline"
                                  aria-label={`View ${a.fullName}'s LinkedIn profile`}
                                >
                                  <Linkedin className="h-3.5 w-3.5" /> LinkedIn
                                </a>
                              ) : a.linkedinProtected ? (
                                <span
                                  className="inline-flex items-center gap-1 text-[11px] text-slate-400 dark:text-slate-500"
                                  title="LinkedIn visibility restricted by alumnus privacy settings"
                                >
                                  <Lock className="h-3 w-3" /> Private
                                </span>
                              ) : (
                                <span className="text-[11px] text-slate-400">Not linked</span>
                              )}

                              <Link
                                to={`/alumni/${a._id}`}
                                className="font-medium text-brand-600 dark:text-brand-400 hover:underline"
                              >
                                View Profile →
                              </Link>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : directoryTab === 'years' ? (
            <div className="space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-3">
                <div>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    Grouped by graduation batch: <b className="text-slate-800 dark:text-slate-200">{yearData?.totalAlumni || 0}</b> alumni across <b className="text-slate-800 dark:text-slate-200">{yearData?.totalBatches || 0}</b> recorded batches
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <label htmlFor="batch-select" className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                    Filter Batch:
                  </label>
                  <select
                    id="batch-select"
                    value={selectedBatchYear}
                    onChange={(e) => setSelectedBatchYear(e.target.value)}
                    className="input py-1 px-2.5 text-xs font-medium rounded-lg h-8 bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700"
                  >
                    <option value="all">All Batches</option>
                    {(yearData?.data || []).map((b) => (
                      <option key={b.year} value={b.year}>
                        {b.year === 'Year Not Specified' ? 'Year Not Specified' : `Class of ${b.year}`} ({b.count})
                      </option>
                    ))}
                  </select>

                  {selectedBatchYear !== 'all' && (
                    <button
                      type="button"
                      onClick={() => setSelectedBatchYear('all')}
                      className="text-xs font-semibold text-brand-600 dark:text-brand-400 hover:underline flex items-center gap-1"
                    >
                      Reset Filter <X className="h-3 w-3" />
                    </button>
                  )}
                </div>
              </div>

              {yearLoading && !yearData ? (
                <CardSkeletons count={6} />
              ) : yearError ? (
                <ErrorState message={yearError} onRetry={reloadYears} />
              ) : (filteredYearBatches || []).length === 0 ? (
                <EmptyState
                  icon={GraduationCap}
                  title="No batch records found"
                  message="No alumni found matching the selected graduation batch."
                />
              ) : (
                <div className="space-y-6">
                  {filteredYearBatches.map((grp) => (
                    <div
                      key={grp.year}
                      className="card p-5 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3 mb-4">
                        <div className="flex items-center gap-3">
                          <div
                            className={`flex h-10 w-10 items-center justify-center rounded-lg ${
                              grp.year === 'Year Not Specified'
                                ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400'
                                : 'bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-300'
                            }`}
                          >
                            <GraduationCap className="h-5 w-5" />
                          </div>
                          <div>
                            <h3 className="font-display font-bold text-base text-slate-900 dark:text-slate-100">
                              {grp.year === 'Year Not Specified' ? 'Year Not Specified' : `Class of ${grp.year}`}
                            </h3>
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                              {grp.count} {grp.count === 1 ? 'alumnus' : 'alumni'} · {grp.distinctCompanies} hiring {grp.distinctCompanies === 1 ? 'company' : 'companies'} · {grp.distinctRoles} distinct roles
                            </p>
                          </div>
                        </div>

                        {grp.topCompanies?.length > 0 && (
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span className="text-[11px] text-slate-400">Top Employers:</span>
                            {grp.topCompanies.map((c) => (
                              <span key={c} className="chip text-[11px] bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                                {c}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                        {grp.alumni.map((a) => (
                          <div
                            key={a._id}
                            className="p-3.5 rounded-lg border border-slate-100 dark:border-slate-800/80 bg-slate-50/60 dark:bg-slate-900/60 flex flex-col justify-between"
                          >
                            <div>
                              <div className="flex items-start gap-2.5">
                                <Avatar name={a.fullName} src={a.profilePhoto} size="sm" />
                                <div className="min-w-0 flex-1">
                                  <Link
                                    to={`/alumni/${a._id}`}
                                    className="block truncate font-bold text-sm text-slate-900 dark:text-slate-100 hover:text-brand-600 dark:hover:text-brand-400"
                                  >
                                    {a.fullName}
                                  </Link>
                                  <p className="truncate text-xs text-slate-600 dark:text-slate-400">
                                    {a.currentJobTitle} at <b className="text-slate-800 dark:text-slate-200">{a.currentCompany}</b>
                                  </p>
                                </div>
                              </div>

                              <div className="mt-2.5 flex flex-wrap gap-1 text-[11px] text-slate-500 dark:text-slate-400">
                                {a.department && (
                                  <span className="truncate rounded bg-slate-200/60 dark:bg-slate-800 px-1.5 py-0.5">
                                    {a.department}
                                  </span>
                                )}
                              </div>

                              {a.skills?.length > 0 && (
                                <div className="mt-2 flex flex-wrap gap-1">
                                  {a.skills.slice(0, 3).map((s) => (
                                    <span
                                      key={s}
                                      className="text-[10px] px-1.5 py-0.5 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300"
                                    >
                                      {s}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>

                            <div className="mt-3 pt-2.5 border-t border-slate-200/60 dark:border-slate-800 flex items-center justify-between text-xs">
                              {a.linkedinUrl ? (
                                <a
                                  href={a.linkedinUrl}
                                  target="_blank"
                                  rel="noreferrer noopener"
                                  className="inline-flex items-center gap-1 font-semibold text-teal-600 dark:text-teal-400 hover:underline"
                                  aria-label={`View ${a.fullName}'s LinkedIn profile`}
                                >
                                  <Linkedin className="h-3.5 w-3.5" /> View LinkedIn
                                </a>
                              ) : a.linkedinProtected ? (
                                <span
                                  className="inline-flex items-center gap-1 text-[11px] text-slate-400 dark:text-slate-500"
                                  title="LinkedIn visibility restricted by alumnus privacy settings"
                                >
                                  <Lock className="h-3 w-3" /> Private
                                </span>
                              ) : (
                                <span className="text-[11px] text-slate-400">Not linked</span>
                              )}

                              <Link
                                to={`/alumni/${a._id}`}
                                className="font-medium text-brand-600 dark:text-brand-400 hover:underline"
                              >
                                View Profile →
                              </Link>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : directoryTab === 'recommended' ? (
            <div>
              <h3 className="mb-4 font-bold text-lg text-slate-900 dark:text-white">Personalized Alumni Matches</h3>
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
          ) : directoryTab === 'imported' ? (
            <div>
              <h3 className="mb-4 font-bold text-lg text-slate-900 dark:text-white">Imported Alumni Records</h3>
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {importedAlumni.map((a, i) => (
                  <AlumniCard
                    key={a._id || i}
                    alumni={{
                      ...a,
                      name: a.name || a.fullName || 'Alumnus',
                      currentCompany: a.company || a.currentCompany,
                      currentJobTitle: a.role || a.currentJobTitle || 'Alumni',
                      graduationYear: a.graduationYear || a.batch,
                    }}
                  />
                ))}
              </div>
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
                        ? `${params.get(k)}+ yrs exp`
                        : params.get(k)}
                      <X className="h-3 w-3" />
                    </button>
                  ))}
                </div>
              )}

              {error && <ErrorState message={error} onRetry={reload} />}

              {!loading && !error && (
                <p className="mb-3 text-sm text-slate-500 dark:text-slate-400">
                  <b className="text-slate-800 dark:text-slate-200">{totalFound}</b> verified alumni found
                </p>
              )}

              {loading && !searchData ? (
                <CardSkeletons count={6} />
              ) : !error && verifiedAlumni.length === 0 ? (
                <EmptyState
                  icon={SearchX}
                  title="No alumni match your search"
                  message="Try clearing a filter or searching for a broader skill like “React” or “Python”."
                />
              ) : (
                <>
                  <div className={`grid gap-4 sm:grid-cols-2 xl:grid-cols-3 ${loading ? 'opacity-60' : ''}`}>
                    {verifiedAlumni.map((a) => (
                      <AlumniCard key={a._id} alumni={a} />
                    ))}
                  </div>
                  <Pagination page={searchData?.page || 1} pages={totalPages} onChange={(p) => update({ page: p })} />
                </>
              )}
            </>
          )}
        </section>
      </div>
    </div>
  );
}
