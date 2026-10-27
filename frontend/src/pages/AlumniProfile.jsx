import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  Award, BadgeCheck, BookOpen, Briefcase, Building2, Check, CheckCircle2, Clock, ExternalLink, Flag, Github, GraduationCap,
  Globe, HandHeart, Handshake, Languages, Linkedin, Loader2, Lock, MapPin, MessageSquare, Network, Pencil, UserPlus, XCircle, Mail,
} from 'lucide-react';
import api, { errorMessage } from '../api/client';
import useFetch from '../hooks/useFetch';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Avatar, ErrorState, Field, Modal, PageLoader, Skeleton, StatusBadge, VerifiedBadge } from '../components/ui';
import { ConnectModal, MentorshipModal, MessageModal, ReferralModal } from '../components/RequestModals';

function Section({ title, icon: Icon, children }) {
  return (
    <section className="card p-5 sm:p-6">
      <h2 className="mb-4 flex items-center gap-2 text-lg font-bold text-slate-900 dark:text-slate-100">
        {Icon && <Icon className="h-5 w-5 text-brand-600 dark:text-brand-400" />} {title}
      </h2>
      {children}
    </section>
  );
}

const Fact = ({ label, value }) =>
  value || value === 0 ? (
    <div className="flex justify-between gap-4 border-b border-slate-100 dark:border-slate-800 py-2 text-sm last:border-0">
      <dt className="text-slate-500 dark:text-slate-400">{label}</dt>
      <dd className="text-right font-semibold text-slate-800 dark:text-slate-200">{value}</dd>
    </div>
  ) : null;

function helpItems(a) {
  const g = a.areasOfGuidance || [];
  const has = (x) => g.includes(x);
  return [
    { label: 'Career Guidance', icon: Briefcase, on: a.availableForCareerGuidance || has('Career Guidance'), text: 'Advice on roles, paths and switching domains.' },
    { label: 'Mentorship', icon: HandHeart, on: a.availableForMentorship, text: 'Ongoing 1:1 mentoring toward your goals.' },
    { label: 'Referral', icon: Handshake, on: a.availableForReferral, text: `Referrals for openings at ${a.currentCompany}.` },
    { label: 'Internship Guidance', icon: GraduationCap, on: has('Internship Guidance'), text: 'How to find, apply for and land internships.' },
    { label: 'Interview Preparation', icon: BookOpen, on: has('Interview Preparation'), text: 'Mock interviews, question banks and feedback.' },
    { label: 'Technical Guidance', icon: Network, on: has('Technical Guidance'), text: 'Help with skills, projects and tech choices.' },
  ];
}

function ReportModal({ open, onClose, alumni }) {
  const toast = useToast();
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);
  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      await api.post('/reports', { targetType: 'alumni_profile', targetId: alumni._id, reason });
      toast.success('Thanks, an admin will review this report.');
      setReason('');
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
      title="Report this profile"
      footer={<>
        <button className="btn-secondary" onClick={onClose}>Cancel</button>
        <button className="btn-danger" form="report-form" type="submit" disabled={busy}>{busy && <Loader2 className="h-4 w-4 animate-spin" />} Submit report</button>
      </>}
    >
      <form id="report-form" onSubmit={submit}>
        <Field label="What's wrong?" hint="Reports are reviewed by college admins.">
          <textarea className="input min-h-[110px]" required maxLength={800} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g. Inaccurate details or inappropriate behaviour" />
        </Field>
      </form>
    </Modal>
  );
}

export default function AlumniProfile() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  const { data, loading, error, reload } = useFetch(`/alumni/${id}`);
  const [modal, setModal] = useState(null);
  const [busy, setBusy] = useState(false);

  const a = data?.data;
  const connection = data?.connection;
  const isStudent = user.role === 'student';
  const isOwner = a && a.user === user._id;
  const connected = connection?.status === 'accepted';

  const { data: pathData } = useFetch(a ? `/connections/path/${a.user}` : null, undefined, {
    enabled: !!a && !isOwner && !connected && user.role !== 'admin',
  });

  const adminVerify = async (status) => {
    let note;
    if (status === 'rejected') {
      note = window.prompt('Reason for rejection (shown to the alumnus):') ;
      if (note === null) return;
    }
    setBusy(true);
    try {
      await api.put(`/admin/alumni/${a._id}/verify`, { status, note });
      toast.success(`Profile ${status}`);
      reload();
    } catch (e) {
      toast.error(errorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  if (loading && !data) {
    return (
      <div className="page space-y-4">
        <Skeleton className="h-56 w-full rounded-xl" />
        <div className="grid gap-4 lg:grid-cols-3"><Skeleton className="h-64 lg:col-span-2" /><Skeleton className="h-64" /></div>
      </div>
    );
  }
  if (error) return <div className="page"><ErrorState message={error} onRetry={reload} /></div>;
  if (!a) return <PageLoader />;

  const skills = [...new Set([...(a.skills || []), ...(a.technologies || [])])];
  const experience = a.experience?.length
    ? a.experience
    : (a.previousCompanies || []).map((c, i) => ({ company: c, title: a.previousJobTitles?.[i] || '' }));
  const path = pathData?.path || [];

  const connectButton = !a.user ? (
    <button className="btn-secondary opacity-75 cursor-not-allowed" disabled title="This alumnus has not yet activated their portal login account.">
      <UserPlus className="h-4 w-4 text-slate-400" /> Account Unclaimed
    </button>
  ) : connected ? (
    <button className="btn-secondary" disabled><CheckCircle2 className="h-4 w-4 text-emerald-600" /> Connected</button>
  ) : connection?.status === 'pending' ? (
    <button className="btn-secondary" disabled><Clock className="h-4 w-4" /> {connection.direction === 'sent' ? 'Request sent' : 'Request received'}</button>
  ) : (
    <button className="btn-primary" onClick={() => setModal('connect')}><UserPlus className="h-4 w-4" /> Connect</button>
  );

  return (
    <div className="page space-y-6">
      {a.verificationStatus !== 'verified' && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          <p><b>Profile {a.verificationStatus}.</b> {isOwner ? 'It is only visible to you and admins until verified.' : 'Not visible to students yet.'} {a.verificationNote && <>Note: {a.verificationNote}</>}</p>
          {user.role === 'admin' && (
            <div className="flex gap-2">
              <button className="btn-accent btn-sm" disabled={busy} onClick={() => adminVerify('verified')}><Check className="h-3.5 w-3.5" /> Verify</button>
              <button className="btn-danger btn-sm" disabled={busy} onClick={() => adminVerify('rejected')}><XCircle className="h-3.5 w-3.5" /> Reject</button>
            </div>
          )}
        </div>
      )}

      {/* Header */}
      <div className="card overflow-hidden">
        <div className="h-28 bg-gradient-to-r from-navy-900 via-teal-800 to-brand-600 sm:h-36" />
        <div className="px-5 pb-6 sm:px-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start pt-1">
            <div className="-mt-14 sm:-mt-16 shrink-0">
              <Avatar name={a.fullName} src={a.profilePhoto} size="xl" className="!ring-4 ring-white dark:ring-slate-900 shadow-md" />
            </div>
            <div className="min-w-0 flex-1 pt-1">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100 sm:text-3xl">{a.fullName}</h1>
                {a.verificationStatus === 'verified' ? <VerifiedBadge /> : <StatusBadge status={a.verificationStatus} />}
              </div>
              <p className="mt-1 text-base font-semibold text-slate-700 dark:text-slate-300">
                {a.currentJobTitle} <span className="font-normal text-slate-500">at</span> <span className="text-brand-600 dark:text-brand-400 font-bold">{a.currentCompany}</span>
              </p>
              <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-sm text-slate-500 dark:text-slate-400">
                <span className="flex items-center gap-1.5"><GraduationCap className="h-4 w-4" /> {a.department} · Class of {a.graduationYear}</span>
                {a.location && <span className="flex items-center gap-1.5"><MapPin className="h-4 w-4" /> {a.location}</span>}
                <span className="flex items-center gap-1.5"><Briefcase className="h-4 w-4" /> {a.experienceYears} yrs experience</span>
                <span className="flex items-center gap-1.5"><Building2 className="h-4 w-4" /> {a.professionalDomain}</span>
              </div>
            </div>
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            {isStudent && (
              <>
                {connectButton}
                <button
                  className="btn-secondary"
                  onClick={() => setModal('message')}
                  disabled={!connected && !a.availableForStudentQuestions}
                  title={!connected && !a.availableForStudentQuestions ? 'Connect first. This alumnus is not open to direct questions.' : ''}
                >
                  <MessageSquare className="h-4 w-4" /> Message
                </button>
                <button className="btn-accent" onClick={() => setModal('mentorship')} disabled={!a.user || !a.availableForMentorship} title={!a.user ? 'Alumnus has not yet activated their portal account' : !a.availableForMentorship ? 'Not available for mentorship right now' : ''}>
                  <HandHeart className="h-4 w-4" /> Request Mentorship
                </button>
                <button className="btn-secondary" onClick={() => setModal('referral')} disabled={!a.user || !a.availableForReferral} title={!a.user ? 'Alumnus has not yet activated their portal account' : !a.availableForReferral ? 'Not offering referrals right now' : ''}>
                  <Handshake className="h-4 w-4" /> Request Referral
                </button>
              </>
            )}
            {connected && user.role === 'alumni' && !isOwner && (
              <button className="btn-secondary" onClick={() => navigate(`/messages?with=${a.user}`)}><MessageSquare className="h-4 w-4" /> Message</button>
            )}
            {isOwner && <Link to="/profile" className="btn-primary"><Pencil className="h-4 w-4" /> Edit my profile</Link>}
            {!isOwner && (
              <button className="btn-ghost ml-auto text-slate-400 hover:text-red-600" onClick={() => setModal('report')} aria-label="Report profile"><Flag className="h-4 w-4" /> Report</button>
            )}
          </div>

          {path.length > 2 && (
            <p className="mt-4 flex flex-wrap items-center gap-1.5 rounded-lg bg-navy-50 px-3 py-2 text-xs text-navy-800">
              <Network className="h-4 w-4" /> You're <b>{pathData.degrees} degrees</b> away:
              {path.map((p, i) => <span key={p.id}>{i > 0 && ' → '}<b>{p.name}</b></span>)}
            </p>
          )}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          {a.bio && <Section title="About" icon={BookOpen}><p className="whitespace-pre-line leading-relaxed text-slate-600 dark:text-slate-300">{a.bio}</p></Section>}

          <Section title="How this alumni can help you" icon={HandHeart}>
            <div className="grid gap-3 sm:grid-cols-2">
              {helpItems(a).map(({ label, icon: Icon, on, text }) => (
                <div key={label} className={`flex items-start gap-3 rounded-lg border p-3 ${on ? 'border-emerald-200 dark:border-emerald-800/60 bg-emerald-50/50 dark:bg-emerald-950/20' : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 opacity-60'}`}>
                  <div className={`mt-0.5 rounded-md p-1.5 ${on ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300' : 'bg-slate-200 dark:bg-slate-800 text-slate-500 dark:text-slate-400'}`}><Icon className="h-4 w-4" /></div>
                  <div>
                    <p className="flex items-center gap-1.5 text-sm font-bold text-slate-800 dark:text-slate-100">{label} {on ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <span className="text-[10px] font-medium uppercase text-slate-400">Not offered</span>}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{text}</p>
                  </div>
                </div>
              ))}
            </div>
            {a.preferredMentorshipTopics?.length > 0 && (
              <div className="mt-4">
                <p className="label">Preferred mentorship topics</p>
                <div className="flex flex-wrap gap-1.5">{a.preferredMentorshipTopics.map((t) => <span key={t} className="chip">{t}</span>)}</div>
              </div>
            )}
          </Section>

          <Section title="Experience" icon={Briefcase}>
            <ol className="relative space-y-6 border-l-2 border-slate-200 dark:border-slate-800 pl-6">
              <li className="relative">
                <span className="absolute -left-[31px] top-1 h-3.5 w-3.5 rounded-full border-2 border-white dark:border-slate-900 bg-brand-600 ring-2 ring-brand-200 dark:ring-brand-900" />
                <p className="font-bold text-slate-900 dark:text-slate-100">{a.currentJobTitle}</p>
                <p className="text-sm font-semibold text-brand-600 dark:text-brand-400">{a.currentCompany} · {a.employmentType}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">Current{a.workLocation ? ` · ${a.workLocation}` : ''}{a.industry ? ` · ${a.industry}` : ''}</p>
              </li>
              {experience.map((e, i) => (
                <li key={i} className="relative">
                  <span className="absolute -left-[31px] top-1 h-3.5 w-3.5 rounded-full border-2 border-white dark:border-slate-900 bg-slate-300 dark:bg-slate-700" />
                  <p className="font-bold text-slate-900 dark:text-slate-100">{e.title}</p>
                  <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">{e.company}</p>
                  {(e.startYear || e.endYear) && <p className="text-xs text-slate-500 dark:text-slate-400">{e.startYear || ''} – {e.endYear || ''}</p>}
                  {e.description && <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{e.description}</p>}
                </li>
              ))}
            </ol>
          </Section>

          {skills.length > 0 && (
            <Section title="Skills & technologies" icon={Network}>
              <div className="flex flex-wrap gap-2">
                {skills.map((s) => <Link key={s} to={`/alumni?skill=${encodeURIComponent(s)}`} className="chip !px-3 !py-1.5 text-sm hover:bg-navy-100">{s}</Link>)}
              </div>
            </Section>
          )}

          {(a.achievements?.length > 0 || a.certifications?.length > 0) && (
            <div className="grid gap-6 sm:grid-cols-2">
              {a.achievements?.length > 0 && (
                <Section title="Achievements" icon={Award}>
                  <ul className="space-y-2 text-sm text-slate-600">{a.achievements.map((x) => <li key={x} className="flex gap-2"><Award className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />{x}</li>)}</ul>
                </Section>
              )}
              {a.certifications?.length > 0 && (
                <Section title="Certifications" icon={BadgeCheck}>
                  <ul className="space-y-2 text-sm text-slate-600">{a.certifications.map((x) => <li key={x} className="flex gap-2"><BadgeCheck className="mt-0.5 h-4 w-4 shrink-0 text-brand-600" />{x}</li>)}</ul>
                </Section>
              )}
            </div>
          )}
        </div>

        <aside className="space-y-6">
          <section className="card p-5">
            <h2 className="mb-2 text-lg font-bold">Quick facts</h2>
            <dl>
              <Fact label="Degree" value={a.degree} />
              <Fact label="Department" value={a.department} />
              <Fact label="Graduated" value={a.graduationYear} />
              <Fact label="Batch" value={a.batch} />
              <Fact label="Industry" value={a.industry} />
              <Fact label="Experience" value={`${a.experienceYears} years`} />
              <Fact label="Work location" value={a.workLocation} />
              <Fact label="College" value={a.college} />
            </dl>
          </section>

          {(a.linkedinUrl || a.githubUrl || a.portfolioUrl || a.email || a.linkedinProtected) && (
            <section className="card p-5">
              <h2 className="mb-3 text-lg font-bold text-slate-900 dark:text-slate-100">Links & contact</h2>
              <div className="space-y-2 text-sm">
                {[
                  { href: a.linkedinUrl, label: 'LinkedIn', icon: Linkedin },
                  { href: a.githubUrl, label: 'GitHub', icon: Github },
                  { href: a.portfolioUrl, label: 'Portfolio', icon: Globe },
                ].filter((l) => l.href).map(({ href, label, icon: Icon }) => (
                  <a key={label} href={href} target="_blank" rel="noreferrer noopener" className="flex items-center gap-2 rounded-lg border border-slate-200 dark:border-slate-700 px-3 py-2 font-medium text-slate-700 dark:text-slate-200 hover:border-brand-500 hover:bg-brand-50/30 dark:hover:bg-slate-800">
                    <Icon className="h-4 w-4 text-brand-600 dark:text-brand-400" /> {label} <ExternalLink className="ml-auto h-3.5 w-3.5 text-slate-400" />
                  </a>
                ))}
                {a.linkedinProtected && (
                  <p className="flex items-center gap-2 text-xs text-slate-400 italic py-1">
                    <Lock className="h-3.5 w-3.5 text-slate-400" /> LinkedIn link is private per alumnus preference
                  </p>
                )}
                {a.email && <p className="flex items-center gap-2 text-slate-600 dark:text-slate-300"><Mail className="h-4 w-4" /> {a.email}</p>}
              </div>
              {!connected && !isOwner && user.role !== 'admin' && <p className="mt-3 text-xs text-slate-400">Institutional email is shared once you're connected.</p>}
            </section>
          )}

          {a.languages?.length > 0 && (
            <section className="card p-5">
              <h2 className="mb-3 flex items-center gap-2 text-lg font-bold"><Languages className="h-5 w-5 text-brand-600" /> Languages</h2>
              <div className="flex flex-wrap gap-1.5">{a.languages.map((l) => <span key={l} className="chip">{l}</span>)}</div>
            </section>
          )}
        </aside>
      </div>

      {isStudent && (
        <>
          <ConnectModal open={modal === 'connect'} onClose={() => setModal(null)} alumni={a} onDone={reload} />
          <MessageModal open={modal === 'message'} onClose={() => setModal(null)} alumni={a} onDone={reload} />
          <MentorshipModal open={modal === 'mentorship'} onClose={() => setModal(null)} alumni={a} />
          <ReferralModal open={modal === 'referral'} onClose={() => setModal(null)} alumni={a} />
        </>
      )}
      <ReportModal open={modal === 'report'} onClose={() => setModal(null)} alumni={a} />
    </div>
  );
}
