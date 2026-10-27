import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import api, { errorMessage } from '../api/client';
import { useToast } from '../context/ToastContext';
import { Field, Modal } from './ui';

function FormModal({ open, onClose, title, submitLabel, onSubmit, children }) {
  const toast = useToast();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      await onSubmit();
    } catch (err) {
      const msg = errorMessage(err);
      setError(msg);
      toast.error(msg);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      footer={
        <>
          <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
          <button type="submit" form="request-form" className="btn-primary" disabled={busy}>
            {busy && <Loader2 className="h-4 w-4 animate-spin" />} {submitLabel}
          </button>
        </>
      }
    >
      <form id="request-form" onSubmit={submit} className="space-y-4">
        {error && <p role="alert" className="rounded-lg border border-red-200 bg-red-50 p-2.5 text-sm text-red-700">{error}</p>}
        {children}
      </form>
    </Modal>
  );
}

export function ConnectModal({ open, onClose, alumni, onDone }) {
  const toast = useToast();
  const [message, setMessage] = useState('');
  return (
    <FormModal
      open={open}
      onClose={onClose}
      title={`Connect with ${alumni?.fullName}`}
      submitLabel="Send request"
      onSubmit={async () => {
        await api.post('/connections', { recipientId: alumni.user, message });
        toast.success('Connection request sent');
        setMessage('');
        onDone?.();
        onClose();
      }}
    >
      <Field label="Add a note (optional)" hint="Introduce yourself and say why you'd like to connect.">
        <textarea className="input min-h-[110px]" maxLength={500} value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Hi, I'm a third-year CSE student interested in…" />
      </Field>
    </FormModal>
  );
}

export function MentorshipModal({ open, onClose, alumni, onDone }) {
  const toast = useToast();
  const topics = alumni?.preferredMentorshipTopics || [];
  const [form, setForm] = useState({ topic: '', message: '', goals: '' });
  return (
    <FormModal
      open={open}
      onClose={onClose}
      title={`Request mentorship from ${alumni?.fullName}`}
      submitLabel="Request mentorship"
      onSubmit={async () => {
        await api.post('/mentorship', { alumniId: alumni.user, ...form });
        toast.success('Mentorship request sent');
        setForm({ topic: '', message: '', goals: '' });
        onDone?.();
        onClose();
      }}
    >
      <Field label="Topic">
        <input className="input" required list="mentorship-topics" maxLength={150} value={form.topic} onChange={(e) => setForm({ ...form, topic: e.target.value })} placeholder="e.g. System design roadmap" />
        <datalist id="mentorship-topics">{topics.map((t) => <option key={t} value={t} />)}</datalist>
      </Field>
      <Field label="Your message">
        <textarea className="input min-h-[110px]" required maxLength={1500} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} placeholder="Tell them where you are right now and what help you need." />
      </Field>
      <Field label="Your goals (optional)">
        <input className="input" maxLength={600} value={form.goals} onChange={(e) => setForm({ ...form, goals: e.target.value })} placeholder="e.g. Land a product-company internship by January" />
      </Field>
    </FormModal>
  );
}

export function ReferralModal({ open, onClose, alumni, job, onDone }) {
  const toast = useToast();
  const [form, setForm] = useState({ role: job?.title || '', message: '', resumeUrl: '' });
  return (
    <FormModal
      open={open}
      onClose={onClose}
      title={`Request a referral from ${alumni?.fullName}`}
      submitLabel="Request referral"
      onSubmit={async () => {
        await api.post('/referrals', { alumniId: alumni.user, jobId: job?._id, company: job?.company || alumni.currentCompany, ...form });
        toast.success('Referral request sent');
        onDone?.();
        onClose();
      }}
    >
      <p className="rounded-lg bg-slate-100 dark:bg-slate-800 p-3 text-sm text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700">
        Company: <b>{job?.company || alumni?.currentCompany}</b>
      </p>
      <Field label="Role you are applying for">
        <input className="input" required value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} placeholder="e.g. Software Engineer Intern" />
      </Field>
      <Field label="Why are you a good fit?">
        <textarea className="input min-h-[110px]" required maxLength={1500} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} placeholder="Share your relevant skills, projects and experience." />
      </Field>
      <Field label="Resume link (optional)">
        <input className="input" type="url" value={form.resumeUrl} onChange={(e) => setForm({ ...form, resumeUrl: e.target.value })} placeholder="https://drive.google.com/…" />
      </Field>
    </FormModal>
  );
}

export function MessageModal({ open, onClose, alumni, onDone }) {
  const toast = useToast();
  const [text, setText] = useState('');
  return (
    <FormModal
      open={open}
      onClose={onClose}
      title={`Message ${alumni?.fullName}`}
      submitLabel="Send message"
      onSubmit={async () => {
        await api.post('/messages', { recipientId: alumni.user, text });
        toast.success('Message sent');
        setText('');
        onDone?.();
        onClose();
      }}
    >
      <Field label="Message">
        <textarea className="input min-h-[130px]" required maxLength={2000} value={text} onChange={(e) => setText(e.target.value)} placeholder="Write your message…" />
      </Field>
    </FormModal>
  );
}
