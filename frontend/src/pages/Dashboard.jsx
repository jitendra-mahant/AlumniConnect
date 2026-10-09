import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertTriangle, ArrowRight, BriefcaseBusiness, Check, Clock, HandHeart, Handshake, HelpCircle, Loader2, MessageSquare, ShieldCheck, UserCheck, Users, X,
} from 'lucide-react';
import api, { errorMessage } from '../api/client';
import useFetch from '../hooks/useFetch';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import AlumniCard from '../components/AlumniCard';
import { Avatar, CardSkeletons, EmptyState, ErrorState, Skeleton, StatusBadge } from '../components/ui';
import { daysLeft, timeAgo } from '../utils/format';

function Stat({ icon: Icon, label, value, to, tone = 'bg-navy-50 text-navy-700' }) {
  const body = (
    <div className="card-hover flex items-center gap-4 p-5">
      <div className={`rounded-xl p-3 ${tone}`}><Icon className="h-5 w-5" /></div>
      <div>
        <p className="font-display text-2xl font-extrabold text-navy-950">{value ?? <Skeleton className="h-7 w-8" />}</p>
        <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</p>
      </div>
    </div>
  );
  return to ? <Link to={to}>{body}</Link> : body;
}

function ConnectionRequests({ items, onChange }) {
  const toast = useToast();
  const [busy, setBusy] = useState('');
  const respond = async (c, status) => {
    setBusy(c._id + status);
    try {
      await api.put(`/connections/${c._id}`, { status });
      toast.success(status === 'accepted' ? 'Connection accepted' : 'Request declined');
      onChange();
    } catch (e) {
      toast.error(errorMessage(e));
    } finally {
      setBusy('');
    }
  };
  if (items.length === 0) return <p className="py-6 text-center text-sm text-slate-400">No pending connection requests.</p>;
  return (
    <ul className="divide-y divide-slate-100">
      {items.map((c) => (
        <li key={c._id} className="flex flex-wrap items-center gap-3 py-3">
          <Avatar name={c.requester.name} src={c.requester.photo} size="sm" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-bold text-slate-900">{c.requester.name}</p>
            <p className="truncate text-xs text-slate-500">{c.requester.headline || 'Student'}</p>
            {c.message && <p className="mt-1 line-clamp-2 text-xs italic text-slate-500">“{c.message}”</p>}
          </div>
          <div className="flex gap-2">
            <button className="btn-accent btn-sm" disabled={!!busy} onClick={() => respond(c, 'accepted')}>
              {busy === c._id + 'accepted' ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />} Accept
            </button>
            <button className="btn-secondary btn-sm" disabled={!!busy} onClick={() => respond(c, 'rejected')}><X className="h-3.5 w-3.5" /> Decline</button>
          </div>
        </li>
      ))}
    </ul>
  );
}

function AlumniStatusBanner({ profile }) {
  if (!profile) {
    return (
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-blue-200 bg-blue-50 p-4">
        <div className="flex items-start gap-3 text-sm text-blue-900"><AlertTriangle className="mt-0.5 h-5 w-5" /> <p><b>Complete your profile.</b> Students can't find you until you submit your professional profile for verification.</p></div>
        <Link to="/profile" className="btn-primary btn-sm">Create profile</Link>
      </div>
    );
  }
  if (profile.verificationStatus === 'pending') {
    return <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900"><Clock className="mt-0.5 h-5 w-5" /> <p><b>Your profile is awaiting admin verification.</b> You'll be notified once it's approved and visible to students.</p></div>;
  }
  if (profile.verificationStatus === 'rejected') {
    return (
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-red-200 bg-red-50 p-4">
        <p className="text-sm text-red-900"><b>Your profile needs changes.</b> {profile.verificationNote}</p>
        <Link to="/profile" className="btn-danger btn-sm">Update profile</Link>
      </div>
    );
  }
  return <div className="flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900"><ShieldCheck className="h-5 w-5" /> <p><b>You're a Verified Alumnus.</b> Students can discover you in the directory.</p></div>;
}

export default function Dashboard() {
  const { user, profile } = useAuth();
  const isStudent = user.role === 'student';

  const conns = useFetch('/connections');
  const mentorship = useFetch('/mentorship');
  const referrals = useFetch('/referrals');
  const qa = useFetch('/qa/questions', { limit: 3, sort: 'popular' });
  const interest = profile?.interests?.[0];
  const recs = useFetch('/alumni/search', { limit: 3, sort: 'experience', ...(interest && { q: interest }) }, { enabled: isStudent });
  const jobs = useFetch('/jobs', { limit: 3 }, { enabled: isStudent });

  const all = conns.data?.data || [];
  const incoming = all.filter((c) => c.status === 'pending' && c.direction === 'received');
  const sentPending = all.filter((c) => c.status === 'pending' && c.direction === 'sent');
  const accepted = all.filter((c) => c.status === 'accepted');
  const mActive = (mentorship.data?.data || []).filter((m) => ['pending', 'accepted'].includes(m.status));
  const rPending = (referrals.data?.data || []).filter((r) => r.status === 'pending');

  return (
    <div className="page space-y-8">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">Hello, {(profile?.fullName || user.name).split(' ')[0]} 👋</h1>
        <p className="mt-1 text-slate-500">{isStudent ? "Here's what's happening in your network." : 'Here are the students who need your guidance.'}</p>
      </div>

      {!isStudent && <AlumniStatusBanner profile={profile} />}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat icon={UserCheck} label="Connections" value={conns.loading ? undefined : accepted.length} to="/messages" tone="bg-emerald-50 text-emerald-600" />
        <Stat icon={Users} label={isStudent ? 'Requests sent' : 'Requests received'} value={conns.loading ? undefined : isStudent ? sentPending.length : incoming.length} tone="bg-blue-50 text-blue-600" />
        <Stat icon={HandHeart} label={isStudent ? 'Open mentorships' : 'Mentorship requests'} value={mentorship.loading ? undefined : mActive.length} to="/mentors" tone="bg-violet-50 text-violet-600" />
        <Stat icon={Handshake} label="Pending referrals" value={referrals.loading ? undefined : rPending.length} to="/referrals" tone="bg-amber-50 text-amber-600" />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <section className="card p-5 lg:col-span-2">
          <h2 className="mb-1 flex items-center gap-2 text-lg font-bold">
            {isStudent ? 'Track your requests' : 'Connection requests'}
            {incoming.length > 0 && <span className="rounded-full bg-brand-600 px-2 py-0.5 text-xs text-white">{incoming.length}</span>}
          </h2>
          {conns.error ? <ErrorState message={conns.error} onRetry={conns.reload} /> : conns.loading && !conns.data ? <div className="space-y-3 py-3"><Skeleton className="h-12" /><Skeleton className="h-12" /></div> : isStudent ? (
            all.length === 0 ? (
              <EmptyState icon={Users} title="No connections yet" message="Find alumni in your field and send your first connection request." action={<Link to="/alumni" className="btn-primary btn-sm">Browse alumni</Link>} />
            ) : (
              <ul className="divide-y divide-slate-100">
                {all.map((c) => {
                  const p = c.direction === 'sent' ? c.recipient : c.requester;
                  return (
                    <li key={c._id} className="flex items-center gap-3 py-3">
                      <Avatar name={p.name} src={p.photo} size="sm" />
                      <div className="min-w-0 flex-1">
                        {p.profileId ? <Link to={`/alumni/${p.profileId}`} className="block truncate text-sm font-bold text-slate-900 hover:text-brand-700">{p.name}</Link> : <p className="truncate text-sm font-bold">{p.name}</p>}
                        <p className="truncate text-xs text-slate-500">{p.headline}</p>
                      </div>
                      <StatusBadge status={c.status} />
                      {c.status === 'accepted' && <Link to={`/messages?with=${p.id}`} className="btn-secondary btn-sm" aria-label={`Message ${p.name}`}><MessageSquare className="h-3.5 w-3.5" /></Link>}
                    </li>
                  );
                })}
              </ul>
            )
          ) : <ConnectionRequests items={incoming} onChange={conns.reload} />}
        </section>

        <section className="card p-5">
          <h2 className="mb-3 text-lg font-bold">{isStudent ? 'Quick actions' : 'Needs your attention'}</h2>
          <div className="space-y-2">
            {isStudent ? (
              <>
                <Link to="/alumni" className="btn-secondary w-full justify-between">Search alumni <ArrowRight className="h-4 w-4" /></Link>
                <Link to="/qa" className="btn-secondary w-full justify-between">Q&A Forum <ArrowRight className="h-4 w-4" /></Link>
                <Link to="/mentors" className="btn-secondary w-full justify-between">Find a mentor <ArrowRight className="h-4 w-4" /></Link>
                <Link to="/jobs" className="btn-secondary w-full justify-between">Browse opportunities <ArrowRight className="h-4 w-4" /></Link>
                <Link to="/profile" className="btn-secondary w-full justify-between">Improve my profile <ArrowRight className="h-4 w-4" /></Link>
              </>
            ) : (
              <>
                <Link to="/mentors" className="btn-secondary w-full justify-between">Mentorship requests <span className="chip">{mActive.filter((m) => m.status === 'pending').length}</span></Link>
                <Link to="/referrals" className="btn-secondary w-full justify-between">Referral requests <span className="chip">{rPending.length}</span></Link>
                <Link to="/qa" className="btn-secondary w-full justify-between">Answer student questions <ArrowRight className="h-4 w-4" /></Link>
                <Link to="/jobs" className="btn-secondary w-full justify-between">Post an opportunity <ArrowRight className="h-4 w-4" /></Link>
                <Link to="/messages" className="btn-secondary w-full justify-between">Messages <ArrowRight className="h-4 w-4" /></Link>
              </>
            )}
          </div>
        </section>
      </div>

      {/* Trending Q&A Section */}
      <section>
        <div className="mb-3 flex items-end justify-between">
          <div>
            <h2 className="text-xl font-bold flex items-center gap-2">
              <HelpCircle className="h-5 w-5 text-brand-600" /> Trending Alumni Q&A
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">Explore active discussions and answers from verified alumni</p>
          </div>
          <Link to="/qa" className="text-sm font-semibold text-brand-700 hover:underline">
            Visit forum →
          </Link>
        </div>

        {qa.error ? (
          <ErrorState message={qa.error} onRetry={qa.reload} />
        ) : qa.loading && !qa.data ? (
          <div className="grid gap-3 sm:grid-cols-3">
            <Skeleton className="h-28" />
            <Skeleton className="h-28" />
            <Skeleton className="h-28" />
          </div>
        ) : (qa.data?.data || []).length === 0 ? (
          <div className="card p-6 text-center text-sm text-slate-500">
            No questions yet. <Link to="/qa" className="font-semibold text-brand-600">Be the first to ask!</Link>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-3">
            {qa.data.data.slice(0, 3).map((q) => (
              <Link
                key={q._id}
                to={`/qa/${q._id}`}
                className="card p-4 hover:border-slate-300 transition hover:shadow-card flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
                    <span className="font-medium text-slate-600 bg-slate-100 rounded px-1.5 py-0.5">{q.category}</span>
                    <span>{timeAgo(q.createdAt)}</span>
                  </div>
                  <h3 className="font-bold text-sm text-navy-950 line-clamp-2 hover:text-brand-600 transition mb-2">
                    {q.title}
                  </h3>
                </div>
                <div className="flex items-center justify-between border-t border-slate-100 pt-2 text-xs text-slate-500">
                  <span>{q.answersCount || 0} answers</span>
                  <span className="font-semibold text-brand-600">View →</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      {isStudent && (
        <>
          <section>
            <div className="mb-3 flex items-end justify-between">
              <h2 className="text-xl font-bold">{interest ? `Alumni in ${interest}` : 'Alumni you may want to meet'}</h2>
              <Link to="/alumni" className="text-sm font-semibold text-brand-700 hover:underline">View all</Link>
            </div>
            {recs.error ? <ErrorState message={recs.error} onRetry={recs.reload} /> : recs.loading && !recs.data ? <CardSkeletons count={3} /> : (
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{(recs.data?.data || []).map((a) => <AlumniCard key={a._id} alumni={a} />)}</div>
            )}
          </section>

          <section>
            <div className="mb-3 flex items-end justify-between">
              <h2 className="text-xl font-bold">Top opportunities for you</h2>
              <Link to="/jobs" className="text-sm font-semibold text-brand-700 hover:underline">View all</Link>
            </div>
            {jobs.error ? <ErrorState message={jobs.error} onRetry={jobs.reload} /> : jobs.loading && !jobs.data ? <Skeleton className="h-28 w-full" /> : (jobs.data?.data || []).length === 0 ? (
              <EmptyState icon={BriefcaseBusiness} title="No opportunities yet" />
            ) : (
              <ul className="card divide-y divide-slate-100">
                {jobs.data.data.map((j) => {
                  const left = daysLeft(j.deadline);
                  return (
                    <li key={j._id}>
                      <Link to={`/jobs?open=${j._id}`} className="flex items-center gap-4 px-5 py-4 transition hover:bg-slate-50">
                        <div className="rounded-lg bg-navy-50 p-2.5 text-navy-700"><BriefcaseBusiness className="h-5 w-5" /></div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate font-bold text-slate-900">{j.title}</p>
                          <p className="truncate text-sm text-slate-500">{j.company}{j.location ? ` · ${j.location}` : ''} · <span className="capitalize">{j.type}</span></p>
                        </div>
                        {j.matchedSkills?.length > 0 && <span className="badge hidden bg-amber-50 text-amber-700 sm:inline-flex">{j.matchedSkills.length} skills match</span>}
                        {left !== null && left >= 0 && <span className="hidden text-xs text-slate-400 sm:block">{left}d left</span>}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        </>
      )}
    </div>
  );
}
