import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  BadgeCheck,
  Briefcase,
  Building2,
  Check,
  CheckCircle2,
  Circle,
  Clock,
  ExternalLink,
  FileText,
  Handshake,
  Loader2,
  MessageSquare,
  Send,
  User,
  X,
  XCircle,
} from 'lucide-react';
import useFetch from '../hooks/useFetch';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import api, { errorMessage } from '../api/client';
import { Avatar, EmptyState, ErrorState, Field, Modal, PageHeader, PageLoader, StatusBadge } from '../components/ui';
import { timeAgo } from '../utils/format';

/* ─── Status Timeline Steps ─── */
const STUDENT_STEPS = ['pending', 'accepted', 'referred'];
const stepIndex = (status) => {
  if (status === 'cancelled' || status === 'rejected') return -1;
  return STUDENT_STEPS.indexOf(status);
};

function StatusTimeline({ status }) {
  const idx = stepIndex(status);
  const isCancelled = status === 'cancelled';
  const isRejected = status === 'rejected';

  if (isCancelled || isRejected) {
    return (
      <div className="mt-3 flex items-center gap-2 text-xs font-semibold text-rose-600 dark:text-rose-400">
        <XCircle className="h-4 w-4" />
        {isCancelled ? 'Request cancelled' : 'Request declined by alumni'}
      </div>
    );
  }

  return (
    <div className="mt-3 flex items-center gap-1">
      {STUDENT_STEPS.map((step, i) => {
        const done = idx >= i;
        const active = idx === i;
        return (
          <div key={step} className="flex items-center gap-1">
            <div
              className={`flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-bold ring-2 transition-all ${
                done
                  ? 'bg-teal-600 text-white ring-teal-200 dark:ring-teal-800'
                  : 'bg-slate-100 text-slate-400 ring-slate-200 dark:bg-slate-800 dark:ring-slate-700'
              } ${active ? 'scale-110' : ''}`}
            >
              {done ? <Check className="h-3 w-3" /> : <Circle className="h-2.5 w-2.5" />}
            </div>
            <span
              className={`text-[10px] font-semibold capitalize ${done ? 'text-teal-700 dark:text-teal-400' : 'text-slate-400 dark:text-slate-500'}`}
            >
              {step}
            </span>
            {i < STUDENT_STEPS.length - 1 && (
              <div className={`mx-1 h-px w-6 sm:w-10 ${done && idx > i ? 'bg-teal-500' : 'bg-slate-200 dark:bg-slate-700'}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ─── Single Referral Card ─── */
function ReferralCard({ item, role, onAction }) {
  const [busy, setBusy] = useState(false);
  const [respond, setRespond] = useState(null);
  const [note, setNote] = useState('');
  const toast = useToast();
  const person = role === 'student' ? item.alumni : item.student;

  const send = async (status, response) => {
    setBusy(true);
    try {
      await api.put(`/referrals/${item._id}`, { status, response: response || undefined });
      toast.success(
        status === 'referred'
          ? '🎉 Marked as referred!'
          : status === 'accepted'
          ? 'Request accepted'
          : status === 'rejected'
          ? 'Request declined'
          : 'Request cancelled',
      );
      setRespond(null);
      setNote('');
      onAction();
    } catch (e) {
      toast.error(errorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <div className="card p-5 transition-all hover:shadow-lift">
        {/* Header */}
        <div className="flex flex-wrap items-start gap-3">
          <Avatar name={person?.name} src={person?.photo} size="md" />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="font-bold text-slate-900 dark:text-white">
                {item.role}{' '}
                <span className="text-slate-400 dark:text-slate-500">at</span>{' '}
                <span className="text-teal-700 dark:text-teal-400">{item.company}</span>
              </h3>
              <StatusBadge status={item.status} />
            </div>
            <div className="mt-0.5 flex flex-wrap items-center gap-1.5 text-sm text-slate-600 dark:text-slate-300">
              <span className="text-slate-400 dark:text-slate-500">{role === 'student' ? 'To' : 'From'}</span>
              {person?.profileId ? (
                <Link to={`/alumni/${person.profileId}`} className="font-semibold text-brand-700 dark:text-brand-400 hover:underline">
                  {person?.name}
                </Link>
              ) : (
                <span className="font-semibold">{person?.name}</span>
              )}
              {person?.headline && <span className="text-slate-400 dark:text-slate-500">· {person.headline}</span>}
            </div>
            <p className="mt-0.5 text-xs text-slate-400 dark:text-slate-500">
              <Clock className="mr-1 inline h-3 w-3" />
              {timeAgo(item.createdAt)}
              {item.respondedAt && ` · Responded ${timeAgo(item.respondedAt)}`}
            </p>
          </div>
        </div>

        {/* Message */}
        <div className="mt-3 rounded-lg border border-slate-100 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-800/60">
          <p className="text-sm leading-relaxed text-slate-700 dark:text-slate-200">{item.message}</p>
        </div>

        {/* Resume Link */}
        {item.resumeUrl && (
          <a
            href={item.resumeUrl}
            target="_blank"
            rel="noreferrer noopener"
            className="mt-2 inline-flex items-center gap-1.5 text-sm font-semibold text-brand-700 hover:underline dark:text-brand-400"
          >
            <FileText className="h-3.5 w-3.5" /> View Resume <ExternalLink className="h-3 w-3" />
          </a>
        )}

        {/* Alumni Response */}
        {item.response && (
          <div className="mt-3 rounded-lg border border-teal-100 bg-teal-50/60 p-3 dark:border-teal-800/40 dark:bg-teal-950/30">
            <p className="mb-1 text-[11px] font-bold uppercase tracking-wider text-teal-700 dark:text-teal-400">
              {role === 'student' ? 'Alumni note' : 'Your note'}
            </p>
            <p className="text-sm text-slate-700 dark:text-slate-200">{item.response}</p>
          </div>
        )}

        {/* Status Timeline (student) */}
        {role === 'student' && <StatusTimeline status={item.status} />}

        {/* Action Buttons */}
        <div className="mt-4 flex flex-wrap gap-2">
          {role === 'alumni' && item.status === 'pending' && (
            <>
              <button className="btn-accent btn-sm" onClick={() => setRespond('accepted')}>
                <Check className="h-3.5 w-3.5" /> Accept
              </button>
              <button className="btn-secondary btn-sm" onClick={() => setRespond('rejected')}>
                <X className="h-3.5 w-3.5" /> Decline
              </button>
            </>
          )}
          {role === 'alumni' && item.status === 'accepted' && (
            <button className="btn-primary btn-sm" onClick={() => setRespond('referred')}>
              <CheckCircle2 className="h-3.5 w-3.5" /> Mark as Referred
            </button>
          )}
          {role === 'student' && item.status === 'pending' && (
            <button
              className="btn-secondary btn-sm"
              onClick={() => window.confirm('Cancel this referral request?') && send('cancelled')}
            >
              <X className="h-3.5 w-3.5" /> Cancel
            </button>
          )}
          {['accepted', 'referred'].includes(item.status) && (
            <Link to={`/messages?with=${person?.id}`} className="btn-secondary btn-sm">
              <MessageSquare className="h-3.5 w-3.5" /> Message
            </Link>
          )}
        </div>
      </div>

      {/* Response Modal */}
      <Modal
        open={!!respond}
        onClose={() => { setRespond(null); setNote(''); }}
        title={
          respond === 'accepted'
            ? 'Accept Referral Request'
            : respond === 'rejected'
            ? 'Decline Referral Request'
            : 'Mark as Referred'
        }
        footer={
          <>
            <button className="btn-secondary" onClick={() => { setRespond(null); setNote(''); }}>
              Cancel
            </button>
            <button className="btn-primary" disabled={busy} onClick={() => send(respond, note)}>
              {busy && <Loader2 className="h-4 w-4 animate-spin" />}
              {respond === 'accepted' ? 'Accept' : respond === 'rejected' ? 'Decline' : 'Confirm Referral'}
            </button>
          </>
        }
      >
        <div className="space-y-3">
          {respond === 'referred' && (
            <div className="flex items-start gap-2 rounded-lg border border-teal-200 bg-teal-50 p-3 dark:border-teal-800/40 dark:bg-teal-950/30">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-teal-600 dark:text-teal-400" />
              <p className="text-sm text-teal-800 dark:text-teal-300">
                You're confirming that you've submitted a referral for{' '}
                <strong>{item.student?.name || 'this student'}</strong> for the <strong>{item.role}</strong> role at{' '}
                <strong>{item.company}</strong>.
              </p>
            </div>
          )}
          <Field label="Add a note for the student (optional)">
            <textarea
              className="input min-h-[100px]"
              maxLength={1000}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder={
                respond === 'accepted'
                  ? 'Share what to expect, timeline, or next steps…'
                  : respond === 'rejected'
                  ? 'Optionally explain why or suggest alternatives…'
                  : 'Share any additional tips or confirmation details…'
              }
            />
          </Field>
        </div>
      </Modal>
    </>
  );
}

/* ─── Request Referral Modal (Student) ─── */
function RequestModal({ alumni, open, onClose, onSuccess }) {
  const [form, setForm] = useState({ role: '', message: '', resumeUrl: '' });
  const [busy, setBusy] = useState(false);
  const toast = useToast();

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const submit = async () => {
    if (!form.role.trim() || !form.message.trim()) {
      toast.error('Role and message are required');
      return;
    }
    setBusy(true);
    try {
      await api.post('/referrals', {
        alumniId: alumni._id,
        company: alumni.currentCompany || alumni.company,
        role: form.role,
        message: form.message,
        resumeUrl: form.resumeUrl || undefined,
      });
      toast.success('Referral request sent!');
      setForm({ role: '', message: '', resumeUrl: '' });
      onSuccess();
      onClose();
    } catch (e) {
      toast.error(errorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Request a Referral"
      footer={
        <>
          <button className="btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn-primary" disabled={busy} onClick={submit}>
            {busy && <Loader2 className="h-4 w-4 animate-spin" />}
            <Send className="h-4 w-4" /> Send Request
          </button>
        </>
      }
    >
      <div className="space-y-4">
        {/* Alumni context card */}
        <div className="flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-800/60">
          <Avatar name={alumni?.fullName || alumni?.name} src={alumni?.profilePhoto || alumni?.photo} size="sm" />
          <div>
            <p className="text-sm font-bold text-slate-900 dark:text-white">{alumni?.fullName || alumni?.name}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {alumni?.currentJobTitle || alumni?.role || ''}
              {(alumni?.currentCompany || alumni?.company) && ` at ${alumni.currentCompany || alumni.company}`}
            </p>
          </div>
        </div>

        <Field label="Target Role / Position *">
          <input
            className="input"
            value={form.role}
            onChange={(e) => set('role', e.target.value)}
            placeholder="e.g. Software Engineer Intern, Data Analyst"
            maxLength={100}
          />
        </Field>

        <Field label="Why you're a great fit *" hint="Max 1500 characters. Be specific about your skills and motivation.">
          <textarea
            className="input min-h-[120px]"
            value={form.message}
            onChange={(e) => set('message', e.target.value)}
            maxLength={1500}
            placeholder="Tell them about your background, relevant skills, and why you're excited about this role…"
          />
          <p className="mt-1 text-right text-[10px] text-slate-400">{form.message.length}/1500</p>
        </Field>

        <Field label="Resume Link (optional)" hint="Public Google Drive, Dropbox, or portfolio URL">
          <input
            className="input"
            value={form.resumeUrl}
            onChange={(e) => set('resumeUrl', e.target.value)}
            placeholder="https://drive.google.com/..."
          />
        </Field>
      </div>
    </Modal>
  );
}

/* ─── Alumni Discovery Card (Student view) ─── */
function AlumniReferralCard({ alumnus, onRequest }) {
  const name = alumnus.fullName || alumnus.name || 'Alumni';
  const company = alumnus.currentCompany || alumnus.company || '';
  const jobTitle = alumnus.currentJobTitle || alumnus.role || '';
  const photo = alumnus.profilePhoto || alumnus.photo;
  return (
    <div className="card-hover group p-4">
      <div className="flex items-start gap-3">
        <Avatar name={name} src={photo} size="sm" />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <p className="truncate text-sm font-bold text-slate-900 dark:text-white">{name}</p>
            <BadgeCheck className="h-3.5 w-3.5 shrink-0 text-teal-500" />
          </div>
          <p className="truncate text-xs text-slate-500 dark:text-slate-400">{jobTitle}</p>
          {company && (
            <p className="mt-0.5 flex items-center gap-1 text-xs font-semibold text-teal-700 dark:text-teal-400">
              <Building2 className="h-3 w-3" />
              {company}
            </p>
          )}
        </div>
      </div>
      {alumnus.skills?.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1">
          {alumnus.skills.slice(0, 4).map((s) => (
            <span key={s} className="chip text-[10px]">{s}</span>
          ))}
        </div>
      )}
      <button
        onClick={() => onRequest(alumnus)}
        className="btn-primary btn-sm mt-3 w-full group-hover:shadow-md"
      >
        <Handshake className="h-3.5 w-3.5" /> Request Referral
      </button>
    </div>
  );
}

/* ─── Status Filter Pills ─── */
const STATUS_FILTERS = [
  { value: '', label: 'All' },
  { value: 'pending', label: 'Pending' },
  { value: 'accepted', label: 'Accepted' },
  { value: 'referred', label: 'Referred' },
  { value: 'rejected', label: 'Declined' },
  { value: 'cancelled', label: 'Cancelled' },
];

/* ─── Main Page ─── */
export default function Referrals() {
  const { user } = useAuth();
  const [statusFilter, setStatusFilter] = useState('');
  const [requestTarget, setRequestTarget] = useState(null); // alumni to request from
  const isStudent = user.role === 'student';

  // My referral requests
  const {
    data: reqData,
    loading: reqLoading,
    error: reqError,
    reload: reloadReqs,
  } = useFetch('/referrals', statusFilter ? { status: statusFilter } : undefined);
  const requests = reqData?.data || [];

  // Alumni offering referrals (student discovery panel)
  const {
    data: alumniData,
    loading: alumniLoading,
  } = useFetch(isStudent ? '/alumni/search' : null, { availableForReferral: true, limit: 12 });
  const referralAlumni = alumniData?.data || [];

  const pendingCount = requests.filter((r) => r.status === 'pending').length;

  return (
    <div className="page">
      <PageHeader
        title="Referral Requests"
        subtitle={
          isStudent
            ? 'Get referred by verified alumni at top companies.'
            : 'Help students land their dream roles by referring them.'
        }
      />

      {/* ── Student: Alumni Discovery ── */}
      {isStudent && (
        <section className="mb-8">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-lg font-bold text-slate-900 dark:text-white">
              <Briefcase className="h-5 w-5 text-teal-600" />
              Alumni Offering Referrals
            </h2>
            <Link
              to="/alumni?availableForReferral=true"
              className="flex items-center gap-1 text-sm font-semibold text-brand-700 hover:underline dark:text-brand-400"
            >
              View all <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          {alumniLoading ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="card space-y-3 p-4">
                  <div className="flex items-center gap-2">
                    <div className="skeleton h-8 w-8 rounded-full" />
                    <div className="flex-1 space-y-1">
                      <div className="skeleton h-3 w-3/4" />
                      <div className="skeleton h-2.5 w-1/2" />
                    </div>
                  </div>
                  <div className="skeleton h-7 w-full rounded-lg" />
                </div>
              ))}
            </div>
          ) : referralAlumni.length === 0 ? (
            <div className="card flex items-center gap-3 p-5 text-slate-500 dark:text-slate-400">
              <User className="h-5 w-5 shrink-0" />
              <p className="text-sm">No alumni are currently offering referrals. Check back later!</p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {referralAlumni.map((a) => (
                <AlumniReferralCard
                  key={a._id}
                  alumnus={a}
                  onRequest={setRequestTarget}
                />
              ))}
            </div>
          )}
        </section>
      )}

      {/* ── My Requests / Incoming Requests ── */}
      <section>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 className="flex items-center gap-2 text-lg font-bold text-slate-900 dark:text-white">
            {isStudent ? (
              <>
                <FileText className="h-5 w-5 text-teal-600" /> My Requests
              </>
            ) : (
              <>
                <Handshake className="h-5 w-5 text-teal-600" /> Incoming Requests
                {pendingCount > 0 && (
                  <span className="rounded-full bg-teal-600 px-2 py-0.5 text-xs font-bold text-white">
                    {pendingCount}
                  </span>
                )}
              </>
            )}
          </h2>
        </div>

        {/* Filter Pills */}
        <div className="mb-4 flex flex-wrap gap-2">
          {STATUS_FILTERS.map(({ value, label }) => (
            <button
              key={value || 'all'}
              onClick={() => setStatusFilter(value)}
              className={`chip capitalize transition-all ${
                statusFilter === value
                  ? '!bg-teal-600 !text-white dark:!bg-teal-500 shadow-sm'
                  : 'hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {reqLoading && !reqData ? (
          <PageLoader />
        ) : reqError ? (
          <ErrorState message={reqError} onRetry={reloadReqs} />
        ) : requests.length === 0 ? (
          <EmptyState
            icon={Handshake}
            title="No referral requests"
            message={isStudent ? 'Find an alumni above and click Request Referral to get started.' : "When students request referrals, they'll appear here."}
            action={
              isStudent && (
                <Link to="/alumni?availableForReferral=true" className="btn-primary btn-sm">
                  <Briefcase className="h-4 w-4" /> Browse Alumni
                </Link>
              )
            }
          />

        ) : (
          <ul className="space-y-4">
            {requests.map((item) => (
              <li key={item._id}>
                <ReferralCard item={item} role={user.role} onAction={reloadReqs} />
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* ── Request Modal ── */}
      {requestTarget && (
        <RequestModal
          alumni={requestTarget}
          open={!!requestTarget}
          onClose={() => setRequestTarget(null)}
          onSuccess={reloadReqs}
        />
      )}
    </div>
  );
}
