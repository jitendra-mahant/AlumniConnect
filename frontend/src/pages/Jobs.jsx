import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Bookmark, BookmarkCheck, BriefcaseBusiness, Building2, CalendarClock, ExternalLink, Handshake, Loader2, MapPin, Plus, Search, Sparkles, Trash2, Wallet,
} from 'lucide-react';
import api, { errorMessage } from '../api/client';
import useFetch from '../hooks/useFetch';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Avatar, CardSkeletons, EmptyState, ErrorState, Field, Modal, PageHeader, Pagination, StatusBadge, Tabs } from '../components/ui';
import { ReferralModal } from '../components/RequestModals';
import { daysLeft, formatDate, timeAgo } from '../utils/format';

function JobCard({ job, user, onOpen, onToggleSave }) {
  const left = daysLeft(job.deadline);
  return (
    <article className="card-hover flex cursor-pointer flex-col p-5" onClick={() => onOpen(job)}>
      <div className="flex items-start gap-3">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-700 dark:bg-brand-950/40 dark:text-brand-300">
          <Building2 className="h-6 w-6" />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="truncate font-display text-base font-bold text-slate-900 dark:text-slate-100">{job.title}</h3>
          <p className="truncate text-sm font-semibold text-brand-600 dark:text-brand-400">{job.company}</p>
        </div>
        {user.role === 'student' && (
          <button
            onClick={(e) => { e.stopPropagation(); onToggleSave(job); }}
            className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-brand-600 dark:hover:bg-slate-800"
            aria-label={job.saved ? 'Remove from saved' : 'Save opportunity'}
          >
            {job.saved ? <BookmarkCheck className="h-5 w-5 text-brand-600" /> : <Bookmark className="h-5 w-5" />}
          </button>
        )}
      </div>

      <div className="mt-3 flex flex-wrap gap-2 text-xs">
        <span className={`badge ${job.type === 'internship' ? 'bg-violet-50 text-violet-700' : 'bg-blue-50 text-blue-700'} capitalize`}>{job.type}</span>
        <span className="badge bg-slate-100 capitalize text-slate-600">{job.workMode}</span>
        {job.referralAvailable && <span className="badge bg-emerald-50 text-emerald-700"><Handshake className="h-3 w-3" /> Referral available</span>}
        {job.status === 'closed' && <StatusBadge status="closed" />}
        {job.matchScore !== undefined && job.matchedSkills?.length > 0 && (
          <span className="badge bg-amber-50 text-amber-700"><Sparkles className="h-3 w-3" /> {job.matchedSkills.length} skill match{job.matchedSkills.length > 1 ? 'es' : ''}</span>
        )}
      </div>

      <div className="mt-3 space-y-1 text-xs text-slate-500">
        {job.location && <p className="flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5" /> {job.location}</p>}
        {job.compensation && <p className="flex items-center gap-1.5"><Wallet className="h-3.5 w-3.5" /> {job.compensation}</p>}
        {left !== null && (
          <p className={`flex items-center gap-1.5 ${left <= 7 && left >= 0 ? 'font-semibold text-amber-600' : ''}`}>
            <CalendarClock className="h-3.5 w-3.5" /> {left < 0 ? 'Deadline passed' : left === 0 ? 'Closes today' : `${left} days left`}
          </p>
        )}
      </div>

      <div className="mt-3 flex flex-wrap gap-1.5">
        {(job.requiredSkills || []).slice(0, 4).map((s) => (
          <span key={s} className={`chip ${job.matchedSkills?.some((m) => m.toLowerCase() === s.toLowerCase()) ? '!bg-emerald-100 !text-emerald-800' : ''}`}>{s}</span>
        ))}
      </div>

      <div className="mt-4 flex items-center gap-2 border-t border-slate-100 pt-3 text-xs text-slate-400">
        <Avatar name={job.postedBy?.name} size="sm" className="!h-6 !w-6 !text-[10px]" />
        <span className="truncate">Posted by {job.postedBy?.name} · {timeAgo(job.createdAt)}</span>
      </div>
    </article>
  );
}

function PostJobModal({ open, onClose, onDone, company }) {
  const toast = useToast();
  const empty = { title: '', company: company || '', type: 'job', domain: '', location: '', workMode: 'onsite', requiredSkills: '', experienceRequired: '', compensation: '', applyUrl: '', deadline: '', referralAvailable: false, description: '' };
  const [form, setForm] = useState(empty);
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      await api.post('/jobs', form);
      toast.success('Opportunity posted. Students have been notified.');
      setForm(empty);
      onDone();
      onClose();
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      wide
      title="Post a job or internship"
      footer={<>
        <button className="btn-secondary" onClick={onClose}>Cancel</button>
        <button className="btn-primary" type="submit" form="job-form" disabled={busy}>{busy && <Loader2 className="h-4 w-4 animate-spin" />} Post opportunity</button>
      </>}
    >
      <form id="job-form" onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
        <Field label="Title" className="sm:col-span-2"><input className="input" required value={form.title} onChange={set('title')} placeholder="e.g. Software Engineering Intern" /></Field>
        <Field label="Company"><input className="input" required value={form.company} onChange={set('company')} /></Field>
        <Field label="Type">
          <select className="input" value={form.type} onChange={set('type')}><option value="job">Job</option><option value="internship">Internship</option></select>
        </Field>
        <Field label="Domain"><input className="input" value={form.domain} onChange={set('domain')} placeholder="Software Engineering" /></Field>
        <Field label="Location"><input className="input" value={form.location} onChange={set('location')} placeholder="Bengaluru" /></Field>
        <Field label="Work mode">
          <select className="input" value={form.workMode} onChange={set('workMode')}><option value="onsite">On-site</option><option value="hybrid">Hybrid</option><option value="remote">Remote</option></select>
        </Field>
        <Field label="Compensation"><input className="input" value={form.compensation} onChange={set('compensation')} placeholder="₹60,000 / month" /></Field>
        <Field label="Required skills" hint="Comma separated" className="sm:col-span-2"><input className="input" value={form.requiredSkills} onChange={set('requiredSkills')} placeholder="React, Node.js, SQL" /></Field>
        <Field label="Experience required"><input className="input" value={form.experienceRequired} onChange={set('experienceRequired')} placeholder="0-2 years" /></Field>
        <Field label="Application deadline"><input className="input" type="date" value={form.deadline} onChange={set('deadline')} /></Field>
        <Field label="Apply link" className="sm:col-span-2"><input className="input" type="url" value={form.applyUrl} onChange={set('applyUrl')} placeholder="https://…" /></Field>
        <Field label="Description" className="sm:col-span-2"><textarea className="input min-h-[120px]" required maxLength={4000} value={form.description} onChange={set('description')} /></Field>
        <label className="flex items-center gap-2 text-sm text-slate-700 sm:col-span-2">
          <input type="checkbox" className="h-4 w-4 rounded border-slate-300 text-navy-700" checked={form.referralAvailable} onChange={set('referralAvailable')} /> I can provide a referral for this role
        </label>
      </form>
    </Modal>
  );
}

function JobDetail({ job, onClose, user, onToggleSave, onRefer, onDelete }) {
  if (!job) return null;
  const mine = job.postedBy?.id === user._id;
  return (
    <Modal
      open
      onClose={onClose}
      wide
      title={job.title}
      footer={<>
        {(mine || user.role === 'admin') && <button className="btn-danger mr-auto" onClick={() => onDelete(job)}><Trash2 className="h-4 w-4" /> Delete</button>}
        {user.role === 'student' && job.referralAvailable && <button className="btn-secondary" onClick={() => onRefer(job)}><Handshake className="h-4 w-4" /> Ask for referral</button>}
        {user.role === 'student' && <button className="btn-secondary" onClick={() => onToggleSave(job)}>{job.saved ? <BookmarkCheck className="h-4 w-4 text-brand-600" /> : <Bookmark className="h-4 w-4" />} {job.saved ? 'Saved' : 'Save'}</button>}
        {job.applyUrl && <a href={job.applyUrl} target="_blank" rel="noreferrer noopener" className="btn-primary">Apply <ExternalLink className="h-4 w-4" /></a>}
      </>}
    >
      <p className="text-base font-semibold text-navy-700">{job.company}</p>
      <div className="mt-3 flex flex-wrap gap-2 text-xs">
        <span className="badge bg-blue-50 capitalize text-blue-700">{job.type}</span>
        <span className="badge bg-slate-100 capitalize text-slate-600">{job.workMode}</span>
        {job.location && <span className="badge bg-slate-100 text-slate-600"><MapPin className="h-3 w-3" /> {job.location}</span>}
        {job.compensation && <span className="badge bg-slate-100 text-slate-600"><Wallet className="h-3 w-3" /> {job.compensation}</span>}
        {job.experienceRequired && <span className="badge bg-slate-100 text-slate-600">{job.experienceRequired}</span>}
        {job.deadline && <span className="badge bg-amber-50 text-amber-700"><CalendarClock className="h-3 w-3" /> Apply by {formatDate(job.deadline)}</span>}
      </div>
      <p className="mt-4 whitespace-pre-line text-sm leading-relaxed text-slate-600">{job.description}</p>
      {job.requiredSkills?.length > 0 && (
        <div className="mt-4">
          <p className="label">Required skills</p>
          <div className="flex flex-wrap gap-1.5">{job.requiredSkills.map((s) => <span key={s} className="chip">{s}</span>)}</div>
        </div>
      )}
      <p className="mt-4 text-xs text-slate-400">Posted by {job.postedBy?.name} · {timeAgo(job.createdAt)}</p>
    </Modal>
  );
}

export default function Jobs() {
  const { user, profile } = useAuth();
  const toast = useToast();
  const [sp, setSp] = useSearchParams();
  const [tab, setTab] = useState('all');
  const [q, setQ] = useState('');
  const [page, setPage] = useState(1);
  const [detail, setDetail] = useState(null);
  const [posting, setPosting] = useState(false);
  const [referFor, setReferFor] = useState(null);

  const isStudent = user.role === 'student';
  const canPost = user.role === 'alumni' || user.role === 'admin';

  const params = tab === 'saved' ? undefined : {
    page, limit: 9, ...(q && { q }),
    ...(tab === 'internship' && { type: 'internship' }),
    ...(tab === 'job' && { type: 'job' }),
    ...(tab === 'mine' && { mine: true }),
  };
  const path = tab === 'saved' ? '/jobs/saved' : '/jobs';
  const { data, loading, error, reload, setData } = useFetch(path, params);
  const jobs = data?.data || [];

  // Deep link from notifications: /jobs?open=<id>
  useEffect(() => {
    const id = sp.get('open');
    if (!id) return;
    api.get(`/jobs/${id}`).then((r) => setDetail(r.data.data)).catch(() => toast.error('That opportunity is no longer available.'));
    const next = new URLSearchParams(sp); next.delete('open'); setSp(next, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const toggleSave = async (job) => {
    try {
      const { data: r } = await api.post(`/jobs/${job._id}/save`);
      const patch = (j) => (j._id === job._id ? { ...j, saved: r.saved } : j);
      if (tab === 'saved' && !r.saved) setData({ ...data, data: jobs.filter((j) => j._id !== job._id) });
      else setData({ ...data, data: jobs.map(patch) });
      setDetail((d) => (d && d._id === job._id ? { ...d, saved: r.saved } : d));
      toast.success(r.saved ? 'Saved to your list' : 'Removed from saved');
    } catch (e) { toast.error(errorMessage(e)); }
  };

  const remove = async (job) => {
    if (!window.confirm(`Delete "${job.title}"?`)) return;
    try {
      await api.delete(`/jobs/${job._id}`);
      toast.success('Opportunity deleted');
      setDetail(null);
      reload();
    } catch (e) { toast.error(errorMessage(e)); }
  };

  const tabs = [
    { value: 'all', label: 'All' },
    { value: 'internship', label: 'Internships' },
    { value: 'job', label: 'Jobs' },
    ...(isStudent ? [{ value: 'saved', label: 'Saved' }] : []),
    ...(user.role === 'alumni' ? [{ value: 'mine', label: 'My postings' }] : []),
  ];

  return (
    <div className="page">
      <PageHeader
        title="Jobs & Internships"
        subtitle={isStudent ? 'Opportunities shared by your alumni, ranked by how well they match your skills.' : 'Opportunities shared by alumni.'}
        action={canPost && <button className="btn-primary" onClick={() => setPosting(true)}><Plus className="h-4 w-4" /> Post opportunity</button>}
      />

      <Tabs tabs={tabs} value={tab} onChange={(t) => { setTab(t); setPage(1); }} />

      {tab !== 'saved' && (
        <form onSubmit={(e) => { e.preventDefault(); setPage(1); }} className="relative mb-5 max-w-xl" role="search">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input className="input pl-9" placeholder="Search title, company, skill or domain…" value={q} onChange={(e) => { setQ(e.target.value); setPage(1); }} aria-label="Search opportunities" />
        </form>
      )}

      {isStudent && data?.ranked && tab !== 'saved' && jobs.length > 0 && (
        <p className="mb-4 flex items-center gap-2 text-xs text-slate-500"><Sparkles className="h-4 w-4 text-amber-500" /> Sorted by relevance using your profile skills and interests{profile?.skills?.length ? '' : '. Add skills to your profile for better matches.'}</p>
      )}

      {loading && !data ? <CardSkeletons /> : error ? <ErrorState message={error} onRetry={reload} /> : jobs.length === 0 ? (
        <EmptyState icon={BriefcaseBusiness} title={tab === 'saved' ? 'No saved opportunities' : 'No opportunities found'} message={tab === 'saved' ? 'Tap the bookmark on any job to save it here.' : 'Try a different search or check back soon.'} />
      ) : (
        <div className={`grid gap-4 sm:grid-cols-2 xl:grid-cols-3 ${loading ? 'opacity-60' : ''}`}>
          {jobs.map((j) => <JobCard key={j._id} job={j} user={user} onOpen={setDetail} onToggleSave={toggleSave} />)}
        </div>
      )}
      {tab !== 'saved' && <Pagination page={data?.page || 1} pages={data?.pages || 1} onChange={setPage} />}

      <JobDetail job={detail} onClose={() => setDetail(null)} user={user} onToggleSave={toggleSave} onDelete={remove} onRefer={(j) => { setReferFor(j); setDetail(null); }} />
      {canPost && <PostJobModal open={posting} onClose={() => setPosting(false)} onDone={() => { setTab('all'); reload(); }} company={user.role === 'alumni' ? profile?.currentCompany : ''} />}
      {referFor && (
        <ReferralModal
          open
          job={referFor}
          alumni={{ user: referFor.postedBy.id, fullName: referFor.postedBy.name, currentCompany: referFor.company }}
          onClose={() => setReferFor(null)}
        />
      )}
    </div>
  );
}
