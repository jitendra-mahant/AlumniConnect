import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  BadgeCheck, BriefcaseBusiness, Check, Flag, Handshake, HandHeart, HelpCircle, Loader2, MessageSquare, Search, ShieldAlert, Trash2, UserCheck, UserX, Users, X,
} from 'lucide-react';
import api, { errorMessage } from '../api/client';
import useFetch from '../hooks/useFetch';
import { useToast } from '../context/ToastContext';
import { Avatar, EmptyState, ErrorState, Field, Modal, PageHeader, PageLoader, Pagination, Skeleton, StatusBadge, Tabs } from '../components/ui';
import { formatDate, timeAgo } from '../utils/format';

function StatCard({ icon: Icon, label, value, sub, tone }) {
  return (
    <div className="card p-5">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
        <div className={`rounded-lg p-2 ${tone}`}><Icon className="h-4 w-4" /></div>
      </div>
      <p className="mt-2 font-display text-3xl font-extrabold text-navy-950">{value}</p>
      {sub && <p className="text-xs text-slate-500">{sub}</p>}
    </div>
  );
}

function BarList({ title, rows, labelKey = 'name' }) {
  const max = Math.max(1, ...rows.map((r) => r.count));
  return (
    <section className="card p-5">
      <h3 className="mb-4 text-base font-bold">{title}</h3>
      {rows.length === 0 ? <p className="text-sm text-slate-400">No data yet.</p> : (
        <ul className="space-y-3">
          {rows.map((r) => (
            <li key={r[labelKey]}>
              <div className="mb-1 flex justify-between text-sm"><span className="font-medium text-slate-700">{r[labelKey]}</span><span className="text-slate-500">{r.count}</span></div>
              <div className="h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-gradient-to-r from-navy-700 to-brand-500" style={{ width: `${(r.count / max) * 100}%` }} /></div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function Overview({ onGo }) {
  const { data, loading, error, reload } = useFetch('/admin/stats');
  if (loading && !data) return <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-28" />)}</div>;
  if (error) return <ErrorState message={error} onRetry={reload} />;
  const s = data.data;
  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={Users} label="Total users" value={s.users.total} sub={`${s.users.students} students · ${s.users.alumni} alumni`} tone="bg-blue-50 text-blue-600" />
        <StatCard icon={BadgeCheck} label="Verified alumni" value={s.alumniProfiles.verified} sub={`${s.alumniProfiles.rejected} rejected`} tone="bg-emerald-50 text-emerald-600" />
        <button className="text-left" onClick={() => onGo('verify')}><StatCard icon={ShieldAlert} label="Pending verification" value={s.alumniProfiles.pending} sub="Click to review" tone="bg-amber-50 text-amber-600" /></button>
        <button className="text-left" onClick={() => onGo('reports')}><StatCard icon={Flag} label="Open reports" value={s.openReports} sub="Click to review" tone="bg-red-50 text-red-600" /></button>
        <button className="text-left" onClick={() => onGo('qa')}><StatCard icon={HelpCircle} label="Q&A Forum" value={s.qa?.questions ?? 0} sub={`${s.qa?.answers ?? 0} answers posted`} tone="bg-indigo-50 text-indigo-600" /></button>
        <StatCard icon={BriefcaseBusiness} label="Active opportunities" value={s.jobs.active} sub={`${s.jobs.total} total · ${s.jobs.internships} internships`} tone="bg-navy-50 text-navy-700" />
        <StatCard icon={UserCheck} label="Connections" value={s.engagement.connections} sub="Accepted" tone="bg-emerald-50 text-emerald-600" />
        <StatCard icon={HandHeart} label="Mentorship requests" value={s.engagement.mentorshipRequests} tone="bg-violet-50 text-violet-600" />
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        <BarList title="Top companies" rows={s.topCompanies} />
        <BarList title="Top domains" rows={s.topDomains} />
        <BarList title="Alumni by graduation year" rows={s.alumniByYear.map((y) => ({ name: String(y.year), count: y.count }))} />
      </div>
    </div>
  );
}

function VerifyAlumni() {
  const toast = useToast();
  const [status, setStatus] = useState('pending');
  const { data, loading, error, reload } = useFetch('/admin/alumni', { status });
  const [rejecting, setRejecting] = useState(null);
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState('');

  const act = async (p, newStatus, noteText) => {
    setBusy(p._id);
    try {
      await api.put(`/admin/alumni/${p._id}/verify`, { status: newStatus, note: noteText });
      toast.success(`${p.fullName} ${newStatus}`);
      setRejecting(null);
      setNote('');
      reload();
    } catch (e) {
      toast.error(errorMessage(e));
    } finally {
      setBusy('');
    }
  };
  const list = data?.data || [];

  return (
    <>
      <div className="mb-4 flex gap-2">
        {['pending', 'verified', 'rejected'].map((s) => <button key={s} onClick={() => setStatus(s)} className={`chip capitalize ${status === s ? '!bg-navy-800 !text-white' : 'hover:bg-navy-100'}`}>{s}</button>)}
      </div>
      {loading && !data ? <PageLoader /> : error ? <ErrorState message={error} onRetry={reload} /> : list.length === 0 ? (
        <EmptyState icon={BadgeCheck} title={`No ${status} profiles`} message={status === 'pending' ? 'You are all caught up.' : undefined} />
      ) : (
        <ul className="space-y-3">
          {list.map((p) => (
            <li key={p._id} className="card flex flex-wrap items-start gap-4 p-5">
              <Avatar name={p.fullName} src={p.profilePhoto} />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <Link to={`/alumni/${p._id}`} className="font-display font-bold text-navy-950 hover:text-brand-700">{p.fullName}</Link>
                  <StatusBadge status={p.verificationStatus} />
                </div>
                <p className="text-sm text-slate-600">{p.currentJobTitle} at <b>{p.currentCompany}</b> · {p.professionalDomain}</p>
                <p className="text-xs text-slate-500">{p.department} · {p.degree} · Class of {p.graduationYear} · {p.email}</p>
                {p.bio && <p className="mt-2 line-clamp-2 text-sm text-slate-500">{p.bio}</p>}
                {p.verificationNote && <p className="mt-1 text-xs italic text-slate-400">Note: {p.verificationNote}</p>}
                <div className="mt-2 flex gap-3 text-xs">
                  {p.linkedinUrl && <a className="font-semibold text-brand-700 hover:underline" href={p.linkedinUrl} target="_blank" rel="noreferrer noopener">LinkedIn</a>}
                  <Link className="font-semibold text-brand-700 hover:underline" to={`/alumni/${p._id}`}>Full profile</Link>
                </div>
              </div>
              <div className="flex gap-2">
                {p.verificationStatus !== 'verified' && (
                  <button className="btn-accent btn-sm" disabled={busy === p._id} onClick={() => act(p, 'verified')}>{busy === p._id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />} Verify</button>
                )}
                {p.verificationStatus !== 'rejected' && (
                  <button className="btn-secondary btn-sm" disabled={busy === p._id} onClick={() => setRejecting(p)}><X className="h-3.5 w-3.5" /> Reject</button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
      <Modal
        open={!!rejecting}
        onClose={() => setRejecting(null)}
        title={`Reject ${rejecting?.fullName}`}
        footer={<>
          <button className="btn-secondary" onClick={() => setRejecting(null)}>Cancel</button>
          <button className="btn-danger" disabled={!note.trim() || !!busy} onClick={() => act(rejecting, 'rejected', note)}>Reject profile</button>
        </>}
      >
        <Field label="Reason (sent to the alumnus)">
          <textarea className="input min-h-[100px]" value={note} onChange={(e) => setNote(e.target.value)} placeholder="e.g. We couldn't match your graduation record." />
        </Field>
      </Modal>
    </>
  );
}

function ManageUsers() {
  const toast = useToast();
  const [q, setQ] = useState('');
  const [role, setRole] = useState('');
  const [page, setPage] = useState(1);
  const { data, loading, error, reload } = useFetch('/admin/users', { page, limit: 12, ...(q && { q }), ...(role && { role }) });
  const users = data?.data || [];

  const toggle = async (u) => {
    try {
      await api.put(`/admin/users/${u._id}`, { status: u.status === 'active' ? 'suspended' : 'active' });
      toast.success(u.status === 'active' ? `${u.name} suspended` : `${u.name} reactivated`);
      reload();
    } catch (e) { toast.error(errorMessage(e)); }
  };
  const remove = async (u) => {
    if (!window.confirm(`Permanently delete ${u.name} and all their data? This cannot be undone.`)) return;
    try { await api.delete(`/admin/users/${u._id}`); toast.success('User deleted'); reload(); } catch (e) { toast.error(errorMessage(e)); }
  };

  return (
    <>
      <div className="mb-4 flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1 sm:max-w-sm">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input className="input pl-9" placeholder="Search name or email…" value={q} onChange={(e) => { setQ(e.target.value); setPage(1); }} aria-label="Search users" />
        </div>
        <select className="input sm:w-44" value={role} onChange={(e) => { setRole(e.target.value); setPage(1); }} aria-label="Filter by role">
          <option value="">All roles</option><option value="student">Students</option><option value="alumni">Alumni</option><option value="admin">Admins</option>
        </select>
      </div>
      {loading && !data ? <PageLoader /> : error ? <ErrorState message={error} onRetry={reload} /> : users.length === 0 ? <EmptyState icon={Users} title="No users found" /> : (
        <div className="card overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr><th className="px-4 py-3">User</th><th className="px-4 py-3">Role</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">Joined</th><th className="px-4 py-3 text-right">Actions</th></tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {users.map((u) => (
                <tr key={u._id} className="hover:bg-slate-50/60">
                  <td className="px-4 py-3"><div className="flex items-center gap-3"><Avatar name={u.name} size="sm" /><div><p className="font-semibold text-slate-900">{u.name}</p><p className="text-xs text-slate-500">{u.email}</p></div></div></td>
                  <td className="px-4 py-3 capitalize">{u.role}</td>
                  <td className="px-4 py-3"><StatusBadge status={u.status} /></td>
                  <td className="px-4 py-3 text-slate-500">{formatDate(u.createdAt)}</td>
                  <td className="px-4 py-3">
                    {u.role !== 'admin' && (
                      <div className="flex justify-end gap-2">
                        <button className="btn-secondary btn-sm" onClick={() => toggle(u)}>{u.status === 'active' ? <><UserX className="h-3.5 w-3.5" /> Suspend</> : <><UserCheck className="h-3.5 w-3.5" /> Activate</>}</button>
                        <button className="btn-ghost btn-sm text-red-600 hover:bg-red-50" onClick={() => remove(u)} aria-label={`Delete ${u.name}`}><Trash2 className="h-3.5 w-3.5" /></button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <Pagination page={data?.page || 1} pages={data?.pages || 1} onChange={setPage} />
    </>
  );
}

function Reports() {
  const toast = useToast();
  const [status, setStatus] = useState('open');
  const { data, loading, error, reload } = useFetch('/admin/reports', { status });
  const list = data?.data || [];

  const resolve = async (r, s) => {
    try { await api.put(`/admin/reports/${r._id}`, { status: s }); toast.success(`Report ${s}`); reload(); } catch (e) { toast.error(errorMessage(e)); }
  };

  return (
    <>
      <div className="mb-4 flex gap-2">
        {['open', 'resolved', 'dismissed'].map((s) => <button key={s} onClick={() => setStatus(s)} className={`chip capitalize ${status === s ? '!bg-navy-800 !text-white' : 'hover:bg-navy-100'}`}>{s}</button>)}
      </div>
      {loading && !data ? <PageLoader /> : error ? <ErrorState message={error} onRetry={reload} /> : list.length === 0 ? <EmptyState icon={Flag} title={`No ${status} reports`} /> : (
        <ul className="space-y-3">
          {list.map((r) => (
            <li key={r._id} className="card p-5">
              <div className="flex flex-wrap items-center gap-2">
                <span className="badge bg-slate-100 capitalize text-slate-600">{r.targetType.replace('_', ' ')}</span>
                <StatusBadge status={r.status} />
                <span className="text-xs text-slate-400">{timeAgo(r.createdAt)}</span>
              </div>
              <p className="mt-2 text-sm font-bold text-slate-900">{r.targetLabel}</p>
              <p className="mt-1 text-sm text-slate-600">“{r.reason}”</p>
              <p className="mt-1 text-xs text-slate-400">Reported by {r.reporter.name}</p>
              {r.status === 'open' && (
                <div className="mt-3 flex gap-2">
                  <button className="btn-accent btn-sm" onClick={() => resolve(r, 'resolved')}>Mark resolved</button>
                  <button className="btn-secondary btn-sm" onClick={() => resolve(r, 'dismissed')}>Dismiss</button>
                  {r.targetType === 'alumni_profile' && <Link className="btn-ghost btn-sm" to={`/alumni/${r.targetId}`}>Open profile</Link>}
                  {r.targetType === 'question' && <Link className="btn-ghost btn-sm" to={`/qa/${r.targetId}`}>Open question</Link>}
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </>
  );
}

function AdminQA() {
  const toast = useToast();
  const { data, loading, error, reload } = useFetch('/qa/questions', { limit: 50 });
  const list = data?.data || [];

  const toggleHide = async (q) => {
    try {
      await api.put(`/qa/questions/${q._id}/moderate`, { isHidden: !q.isHidden });
      toast.success(q.isHidden ? 'Question unhidden' : 'Question hidden');
      reload();
    } catch (e) {
      toast.error(errorMessage(e));
    }
  };

  const remove = async (q) => {
    if (!window.confirm(`Delete question "${q.title}"?`)) return;
    try {
      await api.delete(`/qa/questions/${q._id}`);
      toast.success('Question deleted');
      reload();
    } catch (e) {
      toast.error(errorMessage(e));
    }
  };

  if (loading && !data) return <PageLoader />;
  if (error) return <ErrorState message={error} onRetry={reload} />;
  if (list.length === 0) return <EmptyState icon={HelpCircle} title="No questions posted yet" />;

  return (
    <div className="card overflow-x-auto">
      <table className="w-full min-w-[640px] text-left text-sm">
        <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
          <tr>
            <th className="px-4 py-3">Question</th>
            <th className="px-4 py-3">Category</th>
            <th className="px-4 py-3">Author</th>
            <th className="px-4 py-3">Answers</th>
            <th className="px-4 py-3">Status</th>
            <th className="px-4 py-3">Posted</th>
            <th className="px-4 py-3 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {list.map((q) => (
            <tr key={q._id} className="hover:bg-slate-50/60">
              <td className="px-4 py-3 max-w-xs">
                <Link to={`/qa/${q._id}`} className="font-semibold text-slate-900 hover:text-brand-600 line-clamp-1">
                  {q.title}
                </Link>
                {q.isHidden && (
                  <span className="inline-block rounded bg-red-100 px-1.5 py-0.5 text-[10px] font-bold text-red-700">
                    Hidden by mod
                  </span>
                )}
              </td>
              <td className="px-4 py-3">{q.category}</td>
              <td className="px-4 py-3">{q.author?.name}</td>
              <td className="px-4 py-3">{q.answersCount || 0}</td>
              <td className="px-4 py-3"><StatusBadge status={q.status} /></td>
              <td className="px-4 py-3 text-slate-500">{formatDate(q.createdAt)}</td>
              <td className="px-4 py-3 text-right">
                <div className="flex items-center justify-end gap-1">
                  <button
                    onClick={() => toggleHide(q)}
                    className="btn-ghost btn-sm text-slate-600"
                    title={q.isHidden ? 'Unhide' : 'Hide'}
                  >
                    {q.isHidden ? 'Unhide' : 'Hide'}
                  </button>
                  <button
                    onClick={() => remove(q)}
                    className="btn-ghost btn-sm text-red-600 hover:bg-red-50"
                    title="Delete"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function AdminJobs() {
  const toast = useToast();
  const { data, loading, error, reload } = useFetch('/admin/jobs');
  const list = data?.data || [];
  const remove = async (j) => {
    if (!window.confirm(`Delete "${j.title}"?`)) return;
    try { await api.delete(`/jobs/${j._id}`); toast.success('Deleted'); reload(); } catch (e) { toast.error(errorMessage(e)); }
  };
  if (loading && !data) return <PageLoader />;
  if (error) return <ErrorState message={error} onRetry={reload} />;
  if (list.length === 0) return <EmptyState icon={BriefcaseBusiness} title="No jobs posted yet" />;
  return (
    <div className="card overflow-x-auto">
      <table className="w-full min-w-[640px] text-left text-sm">
        <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
          <tr><th className="px-4 py-3">Opportunity</th><th className="px-4 py-3">Type</th><th className="px-4 py-3">Posted by</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">Posted</th><th className="px-4 py-3" /></tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {list.map((j) => (
            <tr key={j._id} className="hover:bg-slate-50/60">
              <td className="px-4 py-3"><p className="font-semibold text-slate-900">{j.title}</p><p className="text-xs text-slate-500">{j.company}{j.location ? ` · ${j.location}` : ''}</p></td>
              <td className="px-4 py-3 capitalize">{j.type}</td>
              <td className="px-4 py-3">{j.postedBy.name}</td>
              <td className="px-4 py-3"><StatusBadge status={j.status} /></td>
              <td className="px-4 py-3 text-slate-500">{formatDate(j.createdAt)}</td>
              <td className="px-4 py-3 text-right"><button className="btn-ghost btn-sm text-red-600 hover:bg-red-50" onClick={() => remove(j)} aria-label={`Delete ${j.title}`}><Trash2 className="h-3.5 w-3.5" /></button></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function Admin() {
  const [tab, setTab] = useState('overview');
  const pending = useFetch('/admin/alumni', { status: 'pending' });
  const open = useFetch('/admin/reports', { status: 'open' });

  return (
    <div className="page">
      <PageHeader title="Admin Dashboard" subtitle="Verify alumni, manage users and keep the network trustworthy." />
      <Tabs
        value={tab}
        onChange={setTab}
        tabs={[
          { value: 'overview', label: 'Overview' },
          { value: 'verify', label: 'Verify alumni', count: pending.data?.data?.length },
          { value: 'users', label: 'Users' },
          { value: 'reports', label: 'Reports', count: open.data?.data?.length },
          { value: 'qa', label: 'Q&A Forum' },
          { value: 'jobs', label: 'Jobs' },
        ]}
      />
      {tab === 'overview' && <Overview onGo={setTab} />}
      {tab === 'verify' && <VerifyAlumni />}
      {tab === 'users' && <ManageUsers />}
      {tab === 'reports' && <Reports />}
      {tab === 'qa' && <AdminQA />}
      {tab === 'jobs' && <AdminJobs />}
    </div>
  );
}
