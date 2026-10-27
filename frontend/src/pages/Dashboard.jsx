import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertTriangle,
  ArrowRight,
  BriefcaseBusiness,
  Building2,
  Check,
  Clock,
  Compass,
  GraduationCap,
  HandHeart,
  Handshake,
  HelpCircle,
  Loader2,
  MessageSquare,
  Search,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  UserCheck,
  Users,
  X,
} from 'lucide-react';
import api, { errorMessage } from '../api/client';
import useFetch from '../hooks/useFetch';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import AlumniCard from '../components/AlumniCard';
import { Avatar, CardSkeletons, EmptyState, ErrorState, Skeleton, StatusBadge } from '../components/ui';
import { daysLeft, timeAgo } from '../utils/format';

function MetricCard({ icon: Icon, label, value, sub, to, tone = 'bg-teal-50 text-teal-700 dark:bg-teal-950/40 dark:text-teal-400' }) {
  const content = (
    <div className="card-hover flex items-center justify-between p-5 bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-xl shadow-card transition-all min-w-0">
      <div className="space-y-1 min-w-0">
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 truncate">{label}</p>
        <p className="font-display text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white truncate">
          {value !== undefined ? value : <Skeleton className="h-8 w-12" />}
        </p>
        {sub && <p className="text-[11px] text-slate-400 dark:text-slate-500 truncate">{sub}</p>}
      </div>
      <div className={`rounded-xl p-3 ${tone} shrink-0`}>
        <Icon className="h-5 w-5" />
      </div>
    </div>
  );
  return to ? <Link to={to} className="min-w-0 block">{content}</Link> : content;
}

function ConnectionRequestsList({ items, onChange }) {
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

  if (items.length === 0) {
    return <p className="py-6 text-center text-sm text-slate-400">No pending connection requests.</p>;
  }

  return (
    <ul className="divide-y divide-slate-100 dark:divide-slate-800">
      {items.map((c) => (
        <li key={c._id} className="flex flex-wrap items-center gap-3 py-3">
          <Avatar name={c.requester.name} src={c.requester.photo} size="sm" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-bold text-slate-900 dark:text-slate-100">{c.requester.name}</p>
            <p className="truncate text-xs text-slate-500 dark:text-slate-400">{c.requester.headline || 'Student'}</p>
            {c.message && <p className="mt-1 line-clamp-2 text-xs italic text-slate-500">“{c.message}”</p>}
          </div>
          <div className="flex gap-2">
            <button
              className="btn-primary btn-sm !px-3 font-semibold"
              disabled={!!busy}
              onClick={() => respond(c, 'accepted')}
            >
              {busy === c._id + 'accepted' ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />} Accept
            </button>
            <button
              className="btn-secondary btn-sm"
              disabled={!!busy}
              onClick={() => respond(c, 'rejected')}
            >
              <X className="h-3.5 w-3.5" /> Decline
            </button>
          </div>
        </li>
      ))}
    </ul>
  );
}

function AlumniStatusBanner({ profile }) {
  if (!profile) {
    return (
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-teal-200 bg-teal-50/60 dark:border-teal-900 dark:bg-teal-950/30 p-4">
        <div className="flex items-start gap-3 text-sm text-teal-950 dark:text-teal-200">
          <AlertTriangle className="mt-0.5 h-5 w-5 text-teal-600 shrink-0" />
          <p>
            <b>Complete your profile.</b> Students can only discover you in the directory once your profile has been submitted and verified.
          </p>
        </div>
        <Link to="/profile" className="btn-primary btn-sm">
          Complete Profile
        </Link>
      </div>
    );
  }

  if (profile.verificationStatus === 'pending') {
    return (
      <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50/60 dark:border-amber-900/50 dark:bg-amber-950/30 p-4 text-sm text-amber-900 dark:text-amber-200">
        <Clock className="mt-0.5 h-5 w-5 text-amber-600 shrink-0" />
        <p>
          <b>Your profile is awaiting college administrator verification.</b> You will be notified as soon as it is approved.
        </p>
      </div>
    );
  }

  if (profile.verificationStatus === 'rejected') {
    return (
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-rose-200 bg-rose-50/60 dark:border-rose-900/50 dark:bg-rose-950/30 p-4">
        <p className="text-sm text-rose-900 dark:text-rose-200">
          <b>Your profile requires updates:</b> {profile.verificationNote}
        </p>
        <Link to="/profile" className="btn-danger btn-sm">
          Update Profile
        </Link>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3 rounded-xl border border-teal-200 bg-teal-50/60 dark:border-teal-900/50 dark:bg-teal-950/30 p-4 text-sm text-teal-900 dark:text-teal-200">
      <ShieldCheck className="h-5 w-5 text-teal-600 shrink-0" />
      <p>
        <b>Verified KKWAGH Alumnus.</b> Your profile is live in the directory and students can reach out to you.
      </p>
    </div>
  );
}

export default function Dashboard() {
  const { user, profile } = useAuth();
  const isStudent = user.role === 'student';

  // Real backend queries
  const conns = useFetch('/connections');
  const mentorship = useFetch('/mentorship');
  const referrals = useFetch('/referrals');
  const publicStats = useFetch('/public/stats');
  const qa = useFetch('/qa/questions', { limit: 3, sort: 'popular' });

  const interest = profile?.interests?.[0];
  const recs = useFetch(
    '/alumni/search',
    { limit: 3, sort: 'experience', ...(interest && { q: interest }) },
    { enabled: isStudent }
  );
  const jobs = useFetch('/jobs', { limit: 3 }, { enabled: isStudent });

  const all = conns.data?.data || [];
  const incoming = all.filter((c) => c.status === 'pending' && c.direction === 'received');
  const sentPending = all.filter((c) => c.status === 'pending' && c.direction === 'sent');
  const accepted = all.filter((c) => c.status === 'accepted');

  const mActive = (mentorship.data?.data || []).filter((m) => ['pending', 'accepted'].includes(m.status));
  const rPending = (referrals.data?.data || []).filter((r) => r.status === 'pending');

  const stats = publicStats.data?.data;

  return (
    <div className="page space-y-8">
      {/* Header Banner */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b border-slate-200/80 dark:border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl text-slate-900 dark:text-white">
              Hello, {(profile?.fullName || user.name).split(' ')[0]} 👋
            </h1>
            <span className="badge bg-teal-50 text-teal-800 dark:bg-teal-950/50 dark:text-teal-300 ring-1 ring-teal-200 dark:ring-teal-800 text-[11px] capitalize font-bold">
              {user.role}
            </span>
          </div>
          <p className="mt-1 text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            {isStudent
              ? "Here's what is happening across your KKWAGH campus network."
              : 'Here are the students and activities awaiting your guidance.'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link to="/alumni" className="btn-secondary btn-sm">
            <Search className="h-3.5 w-3.5" /> Find Alumni
          </Link>
          <Link to="/messages" className="btn-primary btn-sm">
            <MessageSquare className="h-3.5 w-3.5" /> Open Messages
          </Link>
        </div>
      </div>

      {!isStudent && <AlumniStatusBanner profile={profile} />}

      {/* 4 Metric Cards */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 min-w-0">
        <MetricCard
          icon={Users}
          label="Total Verified Alumni"
          value={stats?.alumni}
          sub="Registered graduates"
          to="/alumni"
          tone="bg-teal-50 text-teal-700 dark:bg-teal-950/40 dark:text-teal-400"
        />
        <MetricCard
          icon={HandHeart}
          label="Mentors Available"
          value={stats?.mentors ?? stats?.alumni}
          sub="Open for guidance"
          to="/mentors"
          tone="bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400"
        />
        <MetricCard
          icon={UserCheck}
          label={isStudent ? 'Requests Sent' : 'Requests Received'}
          value={conns.loading ? undefined : isStudent ? sentPending.length : incoming.length}
          sub={`${accepted.length} accepted connections`}
          tone="bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-400"
        />
        <MetricCard
          icon={Handshake}
          label="Pending Referrals"
          value={referrals.loading ? undefined : rPending.length}
          sub="Company referrals"
          to="/referrals"
          tone="bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400"
        />
      </div>

      {/* Main Content Two-Column Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left: Connection Requests / Network Activity */}
        <section className="card p-6 lg:col-span-2">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100 dark:border-slate-800">
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-brand-600" />
              {isStudent ? 'Track Network Requests' : 'Incoming Connection Requests'}
              {incoming.length > 0 && (
                <span className="rounded-full bg-brand-600 px-2 py-0.5 text-xs text-white">
                  {incoming.length}
                </span>
              )}
            </h2>
            <Link to="/alumni" className="text-xs font-semibold text-brand-600 hover:underline">
              Browse More →
            </Link>
          </div>

          {conns.error ? (
            <ErrorState message={conns.error} onRetry={conns.reload} />
          ) : conns.loading && !conns.data ? (
            <div className="space-y-3 py-3">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          ) : isStudent ? (
            all.length === 0 ? (
              <EmptyState
                icon={Users}
                title="No active requests yet"
                message="Connect with alumni in top companies to get mentorship, interview tips, and job referrals."
                action={
                  <Link to="/alumni" className="btn-primary btn-sm">
                    Browse Alumni Directory
                  </Link>
                }
              />
            ) : (
              <ul className="divide-y divide-slate-100 dark:divide-slate-800">
                {all.map((c) => {
                  const p = c.direction === 'sent' ? c.recipient : c.requester;
                  return (
                    <li key={c._id} className="flex items-center gap-3 py-3">
                      <Avatar name={p.name} src={p.photo} size="sm" />
                      <div className="min-w-0 flex-1">
                        {p.profileId ? (
                          <Link
                            to={`/alumni/${p.profileId}`}
                            className="block truncate text-sm font-bold text-slate-900 dark:text-slate-100 hover:text-brand-600"
                          >
                            {p.name}
                          </Link>
                        ) : (
                          <p className="truncate text-sm font-bold text-slate-900 dark:text-slate-100">{p.name}</p>
                        )}
                        <p className="truncate text-xs text-slate-500 dark:text-slate-400">{p.headline}</p>
                      </div>
                      <StatusBadge status={c.status} />
                      {c.status === 'accepted' && (
                        <Link
                          to={`/messages?with=${p.id}`}
                          className="btn-secondary btn-sm"
                          aria-label={`Message ${p.name}`}
                        >
                          <MessageSquare className="h-3.5 w-3.5" />
                        </Link>
                      )}
                    </li>
                  );
                })}
              </ul>
            )
          ) : (
            <ConnectionRequestsList items={incoming} onChange={conns.reload} />
          )}
        </section>

        {/* Right: Quick Guidance Actions */}
        <section className="card p-6">
          <h2 className="mb-4 pb-3 text-base font-bold text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800">
            {isStudent ? 'Quick Guidance Actions' : 'Faculty & Alumni Portal'}
          </h2>
          <div className="space-y-2.5">
            {isStudent ? (
              <>
                <Link to="/alumni" className="btn-secondary w-full justify-between text-xs py-2.5">
                  <span className="flex items-center gap-2">
                    <Search className="h-4 w-4 text-brand-600" /> Search Alumni Database
                  </span>
                  <ArrowRight className="h-3.5 w-3.5 text-slate-400" />
                </Link>
                <Link to="/qa" className="btn-secondary w-full justify-between text-xs py-2.5">
                  <span className="flex items-center gap-2">
                    <HelpCircle className="h-4 w-4 text-brand-600" /> Ask Alumni Q&A
                  </span>
                  <ArrowRight className="h-3.5 w-3.5 text-slate-400" />
                </Link>
                <Link to="/mentors" className="btn-secondary w-full justify-between text-xs py-2.5">
                  <span className="flex items-center gap-2">
                    <HandHeart className="h-4 w-4 text-brand-600" /> Book a Mentor Session
                  </span>
                  <ArrowRight className="h-3.5 w-3.5 text-slate-400" />
                </Link>
                <Link to="/jobs" className="btn-secondary w-full justify-between text-xs py-2.5">
                  <span className="flex items-center gap-2">
                    <BriefcaseBusiness className="h-4 w-4 text-brand-600" /> View Job Openings
                  </span>
                  <ArrowRight className="h-3.5 w-3.5 text-slate-400" />
                </Link>
                <Link to="/profile" className="btn-secondary w-full justify-between text-xs py-2.5">
                  <span className="flex items-center gap-2">
                    <GraduationCap className="h-4 w-4 text-brand-600" /> Edit Student Profile
                  </span>
                  <ArrowRight className="h-3.5 w-3.5 text-slate-400" />
                </Link>
              </>
            ) : (
              <>
                <Link to="/mentors" className="btn-secondary w-full justify-between text-xs py-2.5">
                  <span className="flex items-center gap-2">
                    <HandHeart className="h-4 w-4 text-brand-600" /> Mentorship Requests
                  </span>
                  <span className="chip text-[10px] font-bold">
                    {mActive.filter((m) => m.status === 'pending').length}
                  </span>
                </Link>
                <Link to="/referrals" className="btn-secondary w-full justify-between text-xs py-2.5">
                  <span className="flex items-center gap-2">
                    <Handshake className="h-4 w-4 text-brand-600" /> Referral Inquiries
                  </span>
                  <span className="chip text-[10px] font-bold">{rPending.length}</span>
                </Link>
                <Link to="/qa" className="btn-secondary w-full justify-between text-xs py-2.5">
                  <span className="flex items-center gap-2">
                    <HelpCircle className="h-4 w-4 text-brand-600" /> Answer Questions
                  </span>
                  <ArrowRight className="h-3.5 w-3.5 text-slate-400" />
                </Link>
                <Link to="/jobs" className="btn-secondary w-full justify-between text-xs py-2.5">
                  <span className="flex items-center gap-2">
                    <BriefcaseBusiness className="h-4 w-4 text-brand-600" /> Post an Opportunity
                  </span>
                  <ArrowRight className="h-3.5 w-3.5 text-slate-400" />
                </Link>
                <Link to="/messages" className="btn-secondary w-full justify-between text-xs py-2.5">
                  <span className="flex items-center gap-2">
                    <MessageSquare className="h-4 w-4 text-brand-600" /> Student Messages
                  </span>
                  <ArrowRight className="h-3.5 w-3.5 text-slate-400" />
                </Link>
              </>
            )}
          </div>
        </section>
      </div>

      {/* Trending Q&A Discussions */}
      <section className="space-y-3">
        <div className="flex items-end justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <HelpCircle className="h-5 w-5 text-brand-600" /> Trending Alumni Q&A Discussions
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Real advice on interview preparation, career paths, and technical stacks
            </p>
          </div>
          <Link to="/qa" className="text-xs font-semibold text-brand-600 hover:underline">
            View All Q&A →
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
                className="card p-4 hover:border-brand-500/30 transition hover:shadow-card flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
                    <span className="font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 rounded px-1.5 py-0.5 text-[11px]">
                      {q.category}
                    </span>
                    <span>{timeAgo(q.createdAt)}</span>
                  </div>
                  <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100 line-clamp-2 hover:text-brand-600 transition mb-2">
                    {q.title}
                  </h3>
                </div>
                <div className="flex items-center justify-between border-t border-slate-100 dark:border-slate-800 pt-2 text-xs text-slate-500 dark:text-slate-400">
                  <span>{q.answersCount || 0} answers</span>
                  <span className="font-semibold text-brand-600 dark:text-brand-400">Read Thread →</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* Recommended Alumni & Top Opportunities */}
      {isStudent && (
        <>
          <section className="space-y-3">
            <div className="flex items-end justify-between">
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-brand-600" />
                  {interest ? `Recommended Alumni in ${interest}` : 'Alumni Recommended for You'}
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Connect with verified KKWAGH alumni working in your target domain
                </p>
              </div>
              <Link to="/alumni" className="text-xs font-semibold text-brand-600 hover:underline">
                View All Directory →
              </Link>
            </div>

            {recs.error ? (
              <ErrorState message={recs.error} onRetry={recs.reload} />
            ) : recs.loading && !recs.data ? (
              <CardSkeletons count={3} />
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {(recs.data?.data || []).map((a) => (
                  <AlumniCard key={a._id} alumni={a} />
                ))}
              </div>
            )}
          </section>

          <section className="space-y-3">
            <div className="flex items-end justify-between">
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <BriefcaseBusiness className="h-5 w-5 text-brand-600" /> Top Opportunities for You
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Internships and job roles shared directly by verified alumni
                </p>
              </div>
              <Link to="/jobs" className="text-xs font-semibold text-brand-600 hover:underline">
                View All Jobs →
              </Link>
            </div>

            {jobs.error ? (
              <ErrorState message={jobs.error} onRetry={jobs.reload} />
            ) : jobs.loading && !jobs.data ? (
              <Skeleton className="h-28 w-full" />
            ) : (jobs.data?.data || []).length === 0 ? (
              <EmptyState icon={BriefcaseBusiness} title="No active job posts yet" />
            ) : (
              <ul className="card divide-y divide-slate-100 dark:divide-slate-800">
                {jobs.data.data.map((j) => {
                  const left = daysLeft(j.deadline);
                  return (
                    <li key={j._id}>
                      <Link
                        to={`/jobs?open=${j._id}`}
                        className="flex items-center gap-4 px-5 py-4 transition hover:bg-slate-50 dark:hover:bg-slate-800/60"
                      >
                        <div className="rounded-lg bg-teal-50 dark:bg-teal-950/40 p-2.5 text-teal-700 dark:text-teal-300">
                          <BriefcaseBusiness className="h-5 w-5" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate font-bold text-slate-900 dark:text-slate-100 text-sm">{j.title}</p>
                          <p className="truncate text-xs text-slate-500 dark:text-slate-400">
                            {j.company}
                            {j.location ? ` · ${j.location}` : ''} · <span className="capitalize">{j.type}</span>
                          </p>
                        </div>
                        {j.matchedSkills?.length > 0 && (
                          <span className="badge hidden bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 sm:inline-flex text-[11px]">
                            {j.matchedSkills.length} skills match
                          </span>
                        )}
                        {left !== null && left >= 0 && (
                          <span className="hidden text-xs text-slate-400 sm:block">{left}d left</span>
                        )}
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
