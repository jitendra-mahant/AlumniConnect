import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Check, ExternalLink, Loader2, MessageSquare, X } from 'lucide-react';
import api, { errorMessage } from '../api/client';
import { useToast } from '../context/ToastContext';
import { Avatar, Field, Modal, StatusBadge } from './ui';
import { timeAgo } from '../utils/format';

/**
 * Shared list for mentorship + referral requests.
 * kind: 'mentorship' | 'referral'. Students can cancel pending ones; alumni respond.
 */
export default function RequestList({ kind, items, role, onChange }) {
  const toast = useToast();
  const [respond, setRespond] = useState(null); // { item, status }
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const base = kind === 'mentorship' ? '/mentorship' : '/referrals';

  const send = async (item, status, response) => {
    setBusy(true);
    try {
      await api.put(`${base}/${item._id}`, { status, response });
      toast.success(`Request ${status}`);
      setRespond(null);
      setText('');
      onChange();
    } catch (e) {
      toast.error(errorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  const other = (it) => (role === 'student' ? it.alumni : it.student);
  const finalLabel = kind === 'mentorship' ? { status: 'completed', label: 'Mark completed' } : { status: 'referred', label: 'Mark as referred' };

  return (
    <>
      <ul className="space-y-4">
        {items.map((it) => {
          const person = other(it);
          const title = kind === 'mentorship' ? it.topic : `${it.role} at ${it.company}`;
          return (
            <li key={it._id} className="card p-5">
              <div className="flex flex-wrap items-start gap-3">
                <Avatar name={person.name} src={person.photo} />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-display font-bold text-slate-900 dark:text-white">{title}</h3>
                    <StatusBadge status={it.status} />
                  </div>
                  <p className="text-sm text-slate-600 dark:text-slate-300">
                    {role === 'student' ? 'To' : 'From'}{' '}
                    {person.profileId ? <Link to={`/alumni/${person.profileId}`} className="font-semibold text-brand-700 dark:text-brand-400 hover:underline">{person.name}</Link> : <b>{person.name}</b>}
                    {person.headline && <span className="text-slate-400 dark:text-slate-500"> · {person.headline}</span>}
                  </p>
                  <p className="text-xs text-slate-400 dark:text-slate-500">{timeAgo(it.createdAt)}</p>
                </div>
              </div>

              <p className="mt-3 whitespace-pre-line rounded-lg bg-slate-50 dark:bg-slate-800/80 p-3 text-sm text-slate-700 dark:text-slate-200 border border-slate-100 dark:border-slate-700">{it.message}</p>
              {it.goals && <p className="mt-2 text-sm text-slate-600 dark:text-slate-300"><b>Goals:</b> {it.goals}</p>}
              {it.resumeUrl && (
                <a href={it.resumeUrl} target="_blank" rel="noreferrer noopener" className="mt-2 inline-flex items-center gap-1 text-sm font-semibold text-brand-700 dark:text-brand-400 hover:underline">
                  View resume <ExternalLink className="h-3.5 w-3.5" />
                </a>
              )}
              {it.response && (
                <div className="mt-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 p-3 text-sm">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-400">{role === 'student' ? 'Their response' : 'Your response'}</p>
                  <p className="mt-1 text-slate-700 dark:text-slate-200">{it.response}</p>
                </div>
              )}

              <div className="mt-4 flex flex-wrap gap-2">
                {role === 'alumni' && it.status === 'pending' && (
                  <>
                    <button className="btn-accent btn-sm" onClick={() => setRespond({ item: it, status: 'accepted' })}><Check className="h-3.5 w-3.5" /> Accept</button>
                    <button className="btn-secondary btn-sm" onClick={() => setRespond({ item: it, status: 'rejected' })}><X className="h-3.5 w-3.5" /> Decline</button>
                  </>
                )}
                {role === 'alumni' && it.status === 'accepted' && (
                  <button className="btn-primary btn-sm" onClick={() => setRespond({ item: it, status: finalLabel.status })}>{finalLabel.label}</button>
                )}
                {role === 'student' && it.status === 'pending' && (
                  <button className="btn-secondary btn-sm" onClick={() => window.confirm('Cancel this request?') && send(it, 'cancelled')}>Cancel request</button>
                )}
                {['accepted', 'referred', 'completed'].includes(it.status) && (
                  <Link to={`/messages?with=${person.id}`} className="btn-secondary btn-sm"><MessageSquare className="h-3.5 w-3.5" /> Message</Link>
                )}
              </div>
            </li>
          );
        })}
      </ul>

      <Modal
        open={!!respond}
        onClose={() => setRespond(null)}
        title={respond ? `${respond.status === 'rejected' ? 'Decline' : respond.status === 'accepted' ? 'Accept' : finalLabel.label} request` : ''}
        footer={<>
          <button className="btn-secondary" onClick={() => setRespond(null)}>Cancel</button>
          <button className="btn-primary" disabled={busy} onClick={() => send(respond.item, respond.status, text || undefined)}>
            {busy && <Loader2 className="h-4 w-4 animate-spin" />} Confirm
          </button>
        </>}
      >
        <Field label="Add a note for the student (optional)">
          <textarea className="input min-h-[110px]" maxLength={1000} value={text} onChange={(e) => setText(e.target.value)} placeholder="Share next steps, availability, or feedback…" />
        </Field>
      </Modal>
    </>
  );
}
