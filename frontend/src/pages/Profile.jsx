import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Loader2, Plus, Save, Trash2 } from 'lucide-react';
import api, { errorMessage } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Avatar, Field, PageHeader, StatusBadge, VerifiedBadge } from '../components/ui';
import { HELP_AREAS } from '../utils/format';

const join = (a) => (Array.isArray(a) ? a.join(', ') : '');
const lines = (a) => (Array.isArray(a) ? a.join('\n') : '');
const csv = (s) => String(s || '').split(',').map((x) => x.trim()).filter(Boolean);
const nl = (s) => String(s || '').split('\n').map((x) => x.trim()).filter(Boolean);

function Card({ title, subtitle, children }) {
  return (
    <section className="card p-5 sm:p-6">
      <h2 className="text-lg font-bold">{title}</h2>
      {subtitle && <p className="mb-4 text-sm text-slate-500">{subtitle}</p>}
      <div className={`grid gap-4 sm:grid-cols-2 ${subtitle ? '' : 'mt-4'}`}>{children}</div>
    </section>
  );
}

function useForm(initial) {
  const [form, setForm] = useState(initial);
  const bind = (k) => ({ value: form[k] ?? '', onChange: (e) => setForm((f) => ({ ...f, [k]: e.target.value })) });
  const check = (k) => ({ checked: !!form[k], onChange: (e) => setForm((f) => ({ ...f, [k]: e.target.checked })) });
  return { form, setForm, bind, check };
}

/* ---------------- Student ---------------- */
function StudentForm() {
  const { profile, setProfile } = useAuth();
  const toast = useToast();
  const p = profile || {};
  const { form, bind } = useForm({
    fullName: p.fullName || '', profilePhoto: p.profilePhoto || '', department: p.department || '', degree: p.degree || '',
    currentYear: p.currentYear || '', graduationYear: p.graduationYear || '', location: p.location || '',
    skills: join(p.skills), interests: join(p.interests), careerGoals: p.careerGoals || '', bio: p.bio || '',
    resumeUrl: p.resumeUrl || '', linkedinUrl: p.linkedinUrl || '', githubUrl: p.githubUrl || '',
  });
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      const { data } = await api.put('/students/profile', { ...form, skills: csv(form.skills), interests: csv(form.interests) });
      setProfile(data.data);
      toast.success('Profile saved');
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-6">
      <Card title="About you">
        <Field label="Full name"><input className="input" required {...bind('fullName')} /></Field>
        <Field label="Profile photo URL"><input className="input" type="url" placeholder="https://…" {...bind('profilePhoto')} /></Field>
        <Field label="Department"><input className="input" {...bind('department')} placeholder="Computer Science & Engineering" /></Field>
        <Field label="Degree"><input className="input" {...bind('degree')} placeholder="B.Tech" /></Field>
        <Field label="Current year"><input className="input" type="number" min="1" max="6" {...bind('currentYear')} /></Field>
        <Field label="Graduation year"><input className="input" type="number" min="2000" max="2100" {...bind('graduationYear')} /></Field>
        <Field label="Location"><input className="input" {...bind('location')} /></Field>
        <Field label="Resume link"><input className="input" type="url" {...bind('resumeUrl')} /></Field>
      </Card>
      <Card title="Career interests" subtitle="Used to rank opportunities and suggest alumni for you.">
        <Field label="Skills" hint="Comma separated" className="sm:col-span-2"><input className="input" {...bind('skills')} placeholder="React, Python, SQL" /></Field>
        <Field label="Interested domains" hint="Comma separated" className="sm:col-span-2"><input className="input" {...bind('interests')} placeholder="Software Engineering, Data Science" /></Field>
        <Field label="Career goals" className="sm:col-span-2"><textarea className="input min-h-[90px]" maxLength={800} {...bind('careerGoals')} /></Field>
        <Field label="Bio" className="sm:col-span-2"><textarea className="input min-h-[90px]" maxLength={1000} {...bind('bio')} /></Field>
        <Field label="LinkedIn"><input className="input" type="url" {...bind('linkedinUrl')} /></Field>
        <Field label="GitHub"><input className="input" type="url" {...bind('githubUrl')} /></Field>
      </Card>
      <div className="flex justify-end"><button className="btn-primary px-6" disabled={busy}>{busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Save profile</button></div>
    </form>
  );
}

/* ---------------- Alumni ---------------- */
const EMPLOYMENT = ['Full-time', 'Part-time', 'Contract', 'Self-employed', 'Freelance', 'Internship'];

function AlumniForm() {
  const { user, profile, setProfile } = useAuth();
  const toast = useToast();
  const p = profile || {};
  const exists = !!profile;
  const { form, setForm, bind, check } = useForm({
    fullName: p.fullName || user.name, profilePhoto: p.profilePhoto || '', email: p.email || user.email, secondaryEmail: p.secondaryEmail || '', location: p.location || '',
    college: p.college || '', department: p.department || '', degree: p.degree || '', graduationYear: p.graduationYear || '', batch: p.batch || '',
    currentCompany: p.currentCompany || '', currentJobTitle: p.currentJobTitle || '', professionalDomain: p.professionalDomain || '',
    experienceYears: p.experienceYears ?? '', industry: p.industry || '', workLocation: p.workLocation || '', employmentType: p.employmentType || 'Full-time',
    skills: join(p.skills), technologies: join(p.technologies),
    experience: p.experience || [],
    linkedinUrl: p.linkedinUrl || '', linkedinVisibility: p.linkedinVisibility || 'private', linkedinConfirmed: !!p.linkedinConfirmed, githubUrl: p.githubUrl || '', portfolioUrl: p.portfolioUrl || '',
    availableForMentorship: !!p.availableForMentorship, availableForReferral: !!p.availableForReferral,
    availableForCareerGuidance: p.availableForCareerGuidance ?? true, availableForStudentQuestions: p.availableForStudentQuestions ?? true,
    preferredMentorshipTopics: join(p.preferredMentorshipTopics), areasOfGuidance: p.areasOfGuidance || [],
    bio: p.bio || '', achievements: lines(p.achievements), certifications: lines(p.certifications), languages: join(p.languages),
  });
  const [busy, setBusy] = useState(false);

  const setExp = (i, k, v) => setForm((f) => ({ ...f, experience: f.experience.map((e, idx) => (idx === i ? { ...e, [k]: v } : e)) }));
  const toggleArea = (a) => setForm((f) => ({ ...f, areasOfGuidance: f.areasOfGuidance.includes(a) ? f.areasOfGuidance.filter((x) => x !== a) : [...f.areasOfGuidance, a] }));

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      const payload = {
        ...form,
        graduationYear: Number(form.graduationYear),
        experienceYears: Number(form.experienceYears) || 0,
        skills: csv(form.skills), technologies: csv(form.technologies),
        preferredMentorshipTopics: csv(form.preferredMentorshipTopics), languages: csv(form.languages),
        achievements: nl(form.achievements), certifications: nl(form.certifications),
      };
      const { data } = exists ? await api.put('/alumni/profile', payload) : await api.post('/alumni/profile', payload);
      setProfile(data.data);
      toast.success(exists ? 'Profile updated' : 'Profile submitted for admin verification');
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-6">
      {exists ? (
        <div className="card flex flex-wrap items-center gap-4 p-5">
          <Avatar name={form.fullName} src={form.profilePhoto} size="lg" />
          <div className="min-w-0 flex-1">
            <p className="text-lg font-bold">{p.fullName}</p>
            <div className="mt-1 flex flex-wrap items-center gap-2">
              {p.verificationStatus === 'verified' ? <VerifiedBadge /> : <StatusBadge status={p.verificationStatus} />}
              {p.verificationNote && <span className="text-xs text-slate-500">{p.verificationNote}</span>}
            </div>
          </div>
          <Link to={`/alumni/${p._id}`} className="btn-secondary">View public profile</Link>
        </div>
      ) : (
        <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-900">
          Welcome! Fill in your professional details. An admin will verify your alumni status before students can see your profile.
        </div>
      )}

      <Card title="Personal">
        <Field label="Full name"><input className="input" required {...bind('fullName')} /></Field>
        <Field label="Profile photo URL"><input className="input" type="url" placeholder="https://…" {...bind('profilePhoto')} /></Field>
        <Field label="Email"><input className="input" type="email" {...bind('email')} /></Field>
        <Field label="Secondary email (optional)"><input className="input" type="email" placeholder="personal@email.com" {...bind('secondaryEmail')} /></Field>
        <Field label="Location" className="sm:col-span-2"><input className="input" placeholder="Nashik / Pune / Bengaluru" {...bind('location')} /></Field>
      </Card>

      <Card title="Education" subtitle="Shown on your public profile so students can verify the connection.">
        <Field label="College"><input className="input" required {...bind('college')} /></Field>
        <Field label="Department"><input className="input" required {...bind('department')} placeholder="Computer Science & Engineering" /></Field>
        <Field label="Degree"><input className="input" required {...bind('degree')} placeholder="B.Tech" /></Field>
        <Field label="Graduation year"><input className="input" type="number" required min="1950" max="2100" {...bind('graduationYear')} /></Field>
        <Field label="Batch"><input className="input" placeholder="2012-2016" {...bind('batch')} /></Field>
      </Card>

      <Card title="Current professional details">
        <Field label="Current company"><input className="input" required {...bind('currentCompany')} /></Field>
        <Field label="Job title"><input className="input" required {...bind('currentJobTitle')} /></Field>
        <Field label="Professional domain"><input className="input" required placeholder="Software Engineering" {...bind('professionalDomain')} /></Field>
        <Field label="Industry"><input className="input" placeholder="Technology" {...bind('industry')} /></Field>
        <Field label="Years of experience"><input className="input" type="number" min="0" max="60" {...bind('experienceYears')} /></Field>
        <Field label="Employment type">
          <select className="input" {...bind('employmentType')}>{EMPLOYMENT.map((t) => <option key={t}>{t}</option>)}</select>
        </Field>
        <Field label="Work location" className="sm:col-span-2"><input className="input" placeholder="Bengaluru, India" {...bind('workLocation')} /></Field>
        <Field label="Skills" hint="Comma separated" className="sm:col-span-2"><input className="input" placeholder="System Design, Data Structures" {...bind('skills')} /></Field>
        <Field label="Technologies" hint="Comma separated" className="sm:col-span-2"><input className="input" placeholder="React, Node.js, AWS" {...bind('technologies')} /></Field>
      </Card>

      <section className="card p-5 sm:p-6">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold">Previous experience</h2>
            <p className="text-sm text-slate-500">Past roles shown in your profile timeline.</p>
          </div>
          <button type="button" className="btn-secondary btn-sm" onClick={() => setForm((f) => ({ ...f, experience: [...f.experience, { company: '', title: '', startYear: '', endYear: '', description: '' }] }))}>
            <Plus className="h-3.5 w-3.5" /> Add role
          </button>
        </div>
        {form.experience.length === 0 && <p className="text-sm text-slate-400">No previous roles added.</p>}
        <div className="space-y-4">
          {form.experience.map((x, i) => (
            <div key={i} className="grid gap-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/60 p-4 sm:grid-cols-2">
              <Field label="Company"><input className="input" required value={x.company || ''} onChange={(e) => setExp(i, 'company', e.target.value)} /></Field>
              <Field label="Title"><input className="input" required value={x.title || ''} onChange={(e) => setExp(i, 'title', e.target.value)} /></Field>
              <Field label="From (year)"><input className="input" type="number" value={x.startYear || ''} onChange={(e) => setExp(i, 'startYear', e.target.value)} /></Field>
              <Field label="To (year)"><input className="input" type="number" value={x.endYear || ''} onChange={(e) => setExp(i, 'endYear', e.target.value)} /></Field>
              <Field label="What did you do?" className="sm:col-span-2"><textarea className="input" maxLength={600} value={x.description || ''} onChange={(e) => setExp(i, 'description', e.target.value)} /></Field>
              <div className="sm:col-span-2">
                <button type="button" className="btn-ghost btn-sm text-red-600" onClick={() => setForm((f) => ({ ...f, experience: f.experience.filter((_, idx) => idx !== i) }))}><Trash2 className="h-3.5 w-3.5" /> Remove</button>
              </div>
            </div>
          ))}
        </div>
      </section>

      <Card title="Professional links & privacy">
        <Field label="LinkedIn profile URL" className="sm:col-span-2">
          <input className="input" type="url" placeholder="https://linkedin.com/in/…" {...bind('linkedinUrl')} />
        </Field>

        <Field label="LinkedIn visibility setting">
          <select className="input" {...bind('linkedinVisibility')}>
            <option value="private">Private (hidden)</option>
            <option value="verified_alumni">Verified alumni only</option>
            <option value="verified_students_and_alumni">Verified students and alumni</option>
            <option value="all_authenticated">All authenticated users</option>
          </select>
        </Field>

        <div className="flex items-center gap-2 pt-6">
          <label className="flex cursor-pointer items-center gap-2 text-xs font-medium text-slate-700 dark:text-slate-300">
            <input type="checkbox" className="h-4 w-4 rounded border-slate-300 text-teal-600" {...check('linkedinConfirmed')} />
            Confirm and enable LinkedIn profile sharing
          </label>
        </div>

        <Field label="GitHub"><input className="input" type="url" {...bind('githubUrl')} /></Field>
        <Field label="Portfolio"><input className="input" type="url" {...bind('portfolioUrl')} /></Field>
      </Card>

      <section className="card p-5 sm:p-6">
        <h2 className="text-lg font-bold text-slate-900 dark:text-white">How can you help students?</h2>
        <p className="mb-4 text-sm text-slate-500 dark:text-slate-400">Students see this on your profile and use it to decide how to reach out.</p>
        <div className="grid gap-3 sm:grid-cols-2">
          {[
            ['availableForMentorship', 'Available for mentorship'],
            ['availableForReferral', 'Can provide referrals'],
            ['availableForCareerGuidance', 'Available for career guidance'],
            ['availableForStudentQuestions', 'Open to student questions (direct messages)'],
          ].map(([k, label]) => (
            <label key={k} className="flex cursor-pointer items-center gap-3 rounded-lg border border-slate-200 dark:border-slate-700 p-3 text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200">
              <input type="checkbox" className="h-4 w-4 rounded border-slate-300 dark:border-slate-600 text-brand-600 focus:ring-brand-500" {...check(k)} /> {label}
            </label>
          ))}
        </div>
        <div className="mt-4">
          <span className="label">Areas of guidance</span>
          <div className="flex flex-wrap gap-2">
            {HELP_AREAS.map((a) => (
              <button type="button" key={a} onClick={() => toggleArea(a)} aria-pressed={form.areasOfGuidance.includes(a)} className={`chip !px-3 !py-1.5 text-sm ${form.areasOfGuidance.includes(a) ? '!bg-brand-600 !text-white' : 'hover:bg-slate-100 dark:hover:bg-slate-800'}`}>{a}</button>
            ))}
          </div>
        </div>
        <Field label="Preferred mentorship topics" hint="Comma separated" className="mt-4"><input className="input" placeholder="System Design, Resume Review" {...bind('preferredMentorshipTopics')} /></Field>
      </section>

      <Card title="Additional information">
        <Field label="Bio" className="sm:col-span-2"><textarea className="input min-h-[110px]" maxLength={1500} {...bind('bio')} /></Field>
        <Field label="Achievements" hint="One per line" className="sm:col-span-2"><textarea className="input min-h-[80px]" {...bind('achievements')} /></Field>
        <Field label="Certifications" hint="One per line" className="sm:col-span-2"><textarea className="input min-h-[80px]" {...bind('certifications')} /></Field>
        <Field label="Languages" hint="Comma separated" className="sm:col-span-2"><input className="input" placeholder="English, Hindi" {...bind('languages')} /></Field>
      </Card>

      <div className="flex justify-end">
        <button className="btn-primary px-6" disabled={busy}>{busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} {exists ? 'Save changes' : 'Submit for verification'}</button>
      </div>
    </form>
  );
}

/* ---------------- Teacher ---------------- */
function TeacherForm() {
  const { profile, setProfile } = useAuth();
  const toast = useToast();
  const p = profile || {};
  const { form, bind } = useForm({
    fullName: p.fullName || '',
    department: p.department || 'Computer Engineering',
    designation: p.designation || 'Associate Professor & Capstone Project Guide',
    cabin: p.cabin || 'Dept of Computer Engg, 3rd Floor, Room 304',
    officeHours: p.officeHours || 'Monday - Friday, 2:30 PM - 5:00 PM',
    specialization: join(p.specialization),
  });
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      const { data } = await api.put('/teacher/profile', {
        ...form,
        specialization: csv(form.specialization),
      });
      setProfile(data.data);
      toast.success('Faculty profile saved successfully');
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-6">
      <Card title="Faculty Information" subtitle="Your official KKWAGH faculty information visible to students and guides.">
        <Field label="Full Name *"><input className="input" required {...bind('fullName')} /></Field>
        <Field label="Academic Department"><input className="input" required {...bind('department')} /></Field>
        <Field label="Academic Designation"><input className="input" required {...bind('designation')} /></Field>
        <Field label="Faculty Cabin / Office Location"><input className="input" {...bind('cabin')} /></Field>
        <Field label="Office / Consultation Hours"><input className="input" {...bind('officeHours')} /></Field>
        <Field label="Areas of Research & Specialization" hint="Comma separated"><input className="input" placeholder="Distributed Systems, Cloud Architecture, ML" {...bind('specialization')} /></Field>
      </Card>
      <div className="flex justify-end">
        <button className="btn-primary px-6" disabled={busy}>
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Save changes
        </button>
      </div>
    </form>
  );
}

export default function Profile() {
  const { user } = useAuth();
  const subtitle =
    user?.role === 'student'
      ? 'Tell alumni about your skills and goals.'
      : user?.role === 'teacher'
      ? 'Manage your faculty profile and consultation details.'
      : 'Your professional profile as students see it.';

  return (
    <div className="page max-w-4xl">
      <PageHeader title="My Profile" subtitle={subtitle} />
      {user?.role === 'student' ? <StudentForm /> : user?.role === 'teacher' ? <TeacherForm /> : <AlumniForm />}
    </div>
  );
}
