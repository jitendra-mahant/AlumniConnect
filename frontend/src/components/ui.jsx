import { useEffect } from 'react';
import { AlertTriangle, BadgeCheck, ChevronLeft, ChevronRight, Inbox, Loader2, RefreshCw, X } from 'lucide-react';
import { initials } from '../utils/format';

export function Spinner({ className = 'h-5 w-5' }) {
  return <Loader2 className={`animate-spin ${className}`} aria-label="Loading" />;
}

export function PageLoader({ label = 'Loading…' }) {
  return (
    <div className="flex min-h-[40vh] flex-col items-center justify-center gap-3 text-slate-500">
      <Spinner className="h-8 w-8 text-navy-700" />
      <p className="text-sm">{label}</p>
    </div>
  );
}

export const Skeleton = ({ className = '' }) => <div className={`skeleton ${className}`} />;

export function CardSkeletons({ count = 6 }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="card space-y-4 p-5">
          <div className="flex items-center gap-3">
            <Skeleton className="h-12 w-12 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-2/3" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          </div>
          <Skeleton className="h-3 w-full" />
          <div className="flex gap-2">
            <Skeleton className="h-6 w-16 rounded-full" />
            <Skeleton className="h-6 w-20 rounded-full" />
            <Skeleton className="h-6 w-14 rounded-full" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function EmptyState({ title, message, icon: Icon = Inbox, action }) {
  return (
    <div className="card flex flex-col items-center justify-center px-6 py-12 text-center">
      <div className="mb-3 rounded-full bg-navy-50 p-3 text-navy-600">
        <Icon className="h-6 w-6" />
      </div>
      <h3 className="text-base font-semibold">{title}</h3>
      {message && <p className="mt-1 max-w-sm text-sm text-slate-500">{message}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function ErrorState({ message, onRetry }) {
  return (
    <div className="card flex flex-col items-center border-red-200 bg-red-50/40 px-6 py-10 text-center">
      <AlertTriangle className="mb-2 h-7 w-7 text-red-500" />
      <p className="text-sm font-medium text-red-700">{message || 'Something went wrong.'}</p>
      {onRetry && (
        <button onClick={onRetry} className="btn-secondary btn-sm mt-4">
          <RefreshCw className="h-3.5 w-3.5" /> Try again
        </button>
      )}
    </div>
  );
}

const GRADIENTS = [
  'from-navy-800 to-brand-500',
  'from-brand-700 to-cyan-500',
  'from-indigo-700 to-brand-400',
  'from-navy-700 to-sky-500',
  'from-blue-800 to-indigo-400',
];

export function Avatar({ name, src, size = 'md', className = '' }) {
  const sizes = { sm: 'h-8 w-8 text-xs', md: 'h-12 w-12 text-base', lg: 'h-20 w-20 text-2xl', xl: 'h-28 w-28 text-3xl' };
  const grad = GRADIENTS[(name || '').length % GRADIENTS.length];
  if (src) {
    return <img src={src} alt={name} className={`${sizes[size]} shrink-0 rounded-full object-cover ring-2 ring-white ${className}`} />;
  }
  return (
    <div
      className={`${sizes[size]} flex shrink-0 items-center justify-center rounded-full bg-gradient-to-br ${grad} font-display font-bold text-white ring-2 ring-white ${className}`}
      aria-label={name}
    >
      {initials(name)}
    </div>
  );
}

export function VerifiedBadge({ className = '' }) {
  return (
    <span className={`badge bg-teal-50 text-teal-700 ring-1 ring-teal-200/80 dark:bg-teal-950/40 dark:text-teal-300 dark:ring-teal-800/60 ${className}`}>
      <BadgeCheck className="h-3.5 w-3.5 text-teal-600 dark:text-teal-400" /> Verified Alumni
    </span>
  );
}

const STATUS_STYLES = {
  pending: 'bg-amber-50 text-amber-700 ring-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:ring-amber-800/60',
  accepted: 'bg-teal-50 text-teal-700 ring-teal-200 dark:bg-teal-950/40 dark:text-teal-300 dark:ring-teal-800/60',
  verified: 'bg-teal-50 text-teal-700 ring-teal-200 dark:bg-teal-950/40 dark:text-teal-300 dark:ring-teal-800/60',
  referred: 'bg-teal-50 text-teal-700 ring-teal-200 dark:bg-teal-950/40 dark:text-teal-300 dark:ring-teal-800/60',
  active: 'bg-teal-50 text-teal-700 ring-teal-200 dark:bg-teal-950/40 dark:text-teal-300 dark:ring-teal-800/60',
  completed: 'bg-sky-50 text-sky-700 ring-sky-200 dark:bg-sky-950/40 dark:text-sky-300 dark:ring-sky-800/60',
  resolved: 'bg-sky-50 text-sky-700 ring-sky-200 dark:bg-sky-950/40 dark:text-sky-300 dark:ring-sky-800/60',
  rejected: 'bg-rose-50 text-rose-700 ring-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:ring-rose-800/60',
  suspended: 'bg-rose-50 text-rose-700 ring-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:ring-rose-800/60',
  open: 'bg-amber-50 text-amber-700 ring-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:ring-amber-800/60',
  closed: 'bg-slate-100 text-slate-600 ring-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:ring-slate-700',
  cancelled: 'bg-slate-100 text-slate-600 ring-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:ring-slate-700',
  dismissed: 'bg-slate-100 text-slate-600 ring-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:ring-slate-700',
};

export function StatusBadge({ status }) {
  return <span className={`badge capitalize ring-1 ${STATUS_STYLES[status] || STATUS_STYLES.closed}`}>{status}</span>;
}

export function Modal({ open, onClose, title, children, footer, wide = false }) {
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-center sm:p-4" role="dialog" aria-modal="true" aria-label={title}>
      <div className="absolute inset-0 bg-navy-950/50 backdrop-blur-sm" onClick={onClose} />
      <div
        className={`relative flex max-h-[92vh] w-full animate-fade-up flex-col rounded-t-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl sm:rounded-2xl ${
          wide ? 'sm:max-w-2xl' : 'sm:max-w-lg'
        }`}
      >
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 px-5 py-4">
          <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">{title}</h2>
          <button onClick={onClose} aria-label="Close" className="rounded-md p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-600 dark:hover:text-slate-200">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="overflow-y-auto px-5 py-4 text-slate-700 dark:text-slate-200">{children}</div>
        {footer && <div className="flex justify-end gap-2 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-5 py-3 sm:rounded-b-2xl">{footer}</div>}
      </div>
    </div>
  );
}

export function Field({ label, hint, children, className = '' }) {
  return (
    <div className={className}>
      {label && <label className="label">{label}</label>}
      {children}
      {hint && <p className="mt-1 text-xs text-slate-400">{hint}</p>}
    </div>
  );
}

export function Pagination({ page, pages, onChange }) {
  if (pages <= 1) return null;
  return (
    <nav className="mt-6 flex items-center justify-center gap-3" aria-label="Pagination">
      <button className="btn-secondary btn-sm" disabled={page <= 1} onClick={() => onChange(page - 1)}>
        <ChevronLeft className="h-4 w-4" /> Prev
      </button>
      <span className="text-sm text-slate-500">
        Page <b className="text-slate-800">{page}</b> of {pages}
      </span>
      <button className="btn-secondary btn-sm" disabled={page >= pages} onClick={() => onChange(page + 1)}>
        Next <ChevronRight className="h-4 w-4" />
      </button>
    </nav>
  );
}

export function PageHeader({ title, subtitle, action }) {
  return (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100 sm:text-3xl">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-slate-500 dark:text-slate-400 sm:text-base">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

export function Tabs({ tabs, value, onChange }) {
  return (
    <div className="mb-5 flex gap-1 overflow-x-auto rounded-lg bg-slate-100 dark:bg-slate-800/80 p-1">
      {tabs.map((t) => (
        <button
          key={t.value}
          onClick={() => onChange(t.value)}
          className={`whitespace-nowrap rounded-md px-4 py-1.5 text-sm font-semibold transition ${
            value === t.value
              ? 'bg-white dark:bg-slate-900 text-teal-700 dark:text-teal-300 shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
          }`}
        >
          {t.label}
          {t.count !== undefined && t.count > 0 && (
            <span className="ml-2 rounded-full bg-teal-600 dark:bg-teal-500 px-1.5 py-0.5 text-[10px] text-white">{t.count}</span>
          )}
        </button>
      ))}
    </div>
  );
}
