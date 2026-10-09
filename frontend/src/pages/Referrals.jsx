import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Handshake } from 'lucide-react';
import useFetch from '../hooks/useFetch';
import { useAuth } from '../context/AuthContext';
import RequestList from '../components/RequestList';
import { EmptyState, ErrorState, PageHeader, PageLoader } from '../components/ui';

export default function Referrals() {
  const { user } = useAuth();
  const [status, setStatus] = useState('');
  const { data, loading, error, reload } = useFetch('/referrals', status ? { status } : undefined);
  const items = data?.data || [];
  const isStudent = user.role === 'student';

  return (
    <div className="page">
      <PageHeader
        title="Referral Requests"
        subtitle={isStudent ? 'Track the referrals you have asked for.' : 'Students asking for a referral at your company.'}
        action={isStudent && <Link to="/alumni?availableForReferral=true" className="btn-primary">Find alumni offering referrals</Link>}
      />
      <div className="mb-4 flex flex-wrap gap-2">
        {['', 'pending', 'accepted', 'referred', 'rejected'].map((s) => (
          <button key={s || 'all'} onClick={() => setStatus(s)} className={`chip capitalize ${status === s ? '!bg-navy-800 !text-white' : 'hover:bg-navy-100'}`}>{s || 'All'}</button>
        ))}
      </div>
      {loading && !data ? <PageLoader /> : error ? <ErrorState message={error} onRetry={reload} /> : items.length === 0 ? (
        <EmptyState
          icon={Handshake}
          title="No referral requests"
          message={isStudent ? 'Open an alumni profile and tap “Request Referral”, or ask from a job posting.' : 'Referral requests will show up here.'}
        />
      ) : <RequestList kind="referral" items={items} role={user.role} onChange={reload} />}
    </div>
  );
}
