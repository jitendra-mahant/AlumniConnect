import { Link } from 'react-router-dom';
import {
  Bell, BriefcaseBusiness, CheckCheck, HandHeart, Handshake, MessageSquare, ShieldCheck, UserCheck, UserPlus, UserX,
} from 'lucide-react';
import api from '../api/client';
import useFetch from '../hooks/useFetch';
import { EmptyState, ErrorState, PageHeader, PageLoader } from '../components/ui';
import { timeAgo } from '../utils/format';

const ICONS = {
  connection_request: [UserPlus, 'bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-300'],
  connection_accepted: [UserCheck, 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-300'],
  connection_rejected: [UserX, 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'],
  mentorship_request: [HandHeart, 'bg-violet-50 text-violet-600 dark:bg-violet-950/50 dark:text-violet-300'],
  mentorship_update: [HandHeart, 'bg-violet-50 text-violet-600 dark:bg-violet-950/50 dark:text-violet-300'],
  referral_request: [Handshake, 'bg-amber-50 text-amber-600 dark:bg-amber-950/50 dark:text-amber-300'],
  referral_update: [Handshake, 'bg-amber-50 text-amber-600 dark:bg-amber-950/50 dark:text-amber-300'],
  message: [MessageSquare, 'bg-sky-50 text-sky-600 dark:bg-sky-950/50 dark:text-sky-300'],
  job_posted: [BriefcaseBusiness, 'bg-teal-50 text-teal-700 dark:bg-teal-950/50 dark:text-teal-300'],
  profile_review: [ShieldCheck, 'bg-orange-50 text-orange-600 dark:bg-orange-950/50 dark:text-orange-300'],
  verification: [ShieldCheck, 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-300'],
};

export default function Notifications() {
  const { data, loading, error, reload, setData } = useFetch('/notifications');
  const items = data?.data || [];
  const changed = () => window.dispatchEvent(new Event('notifications:changed'));

  const markAll = async () => {
    await api.put('/notifications/read-all');
    setData({ ...data, unread: 0, data: items.map((n) => ({ ...n, read: true })) });
    changed();
  };

  const markOne = async (n) => {
    if (n.read) return;
    setData({ ...data, unread: Math.max(0, data.unread - 1), data: items.map((x) => (x._id === n._id ? { ...x, read: true } : x)) });
    api.put(`/notifications/${n._id}/read`).then(changed).catch(() => {});
  };

  return (
    <div className="page max-w-3xl">
      <PageHeader
        title="Notifications"
        subtitle={data ? `${data.unread} unread` : undefined}
        action={data?.unread > 0 && <button className="btn-secondary" onClick={markAll}><CheckCheck className="h-4 w-4" /> Mark all as read</button>}
      />
      {loading && !data ? <PageLoader /> : error ? <ErrorState message={error} onRetry={reload} /> : items.length === 0 ? (
        <EmptyState icon={Bell} title="You're all caught up" message="Connection requests, mentorship updates, messages and new jobs will appear here." />
      ) : (
        <ul className="card divide-y divide-slate-100 dark:divide-slate-800 overflow-hidden">
          {items.map((n) => {
            const [Icon, tone] = ICONS[n.type] || [Bell, 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'];
            const inner = (
              <div className={`flex items-start gap-3 px-4 py-3.5 transition hover:bg-slate-50/80 dark:hover:bg-slate-800/60 ${n.read ? '' : 'bg-brand-50/30 dark:bg-teal-950/20'}`}>
                <div className={`mt-0.5 rounded-lg p-2 ${tone}`}><Icon className="h-4 w-4" /></div>
                <div className="min-w-0 flex-1">
                  <p className={`text-sm ${n.read ? 'text-slate-700 dark:text-slate-200' : 'font-bold text-slate-900 dark:text-white'}`}>{n.title}</p>
                  {n.body && <p className="truncate text-sm text-slate-600 dark:text-slate-300 mt-0.5">{n.body}</p>}
                  <p className="mt-0.5 text-xs text-slate-400 dark:text-slate-400">{timeAgo(n.createdAt)}</p>
                </div>
                {!n.read && <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-brand-600 dark:bg-brand-400" aria-label="Unread" />}
              </div>
            );
            return (
              <li key={n._id}>
                {n.link ? <Link to={n.link} onClick={() => markOne(n)}>{inner}</Link> : <button className="block w-full text-left" onClick={() => markOne(n)}>{inner}</button>}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
