import { useState } from 'react';
import { Link } from 'react-router-dom';
import { HandHeart, Search, Users } from 'lucide-react';
import useFetch from '../hooks/useFetch';
import { useAuth } from '../context/AuthContext';
import AlumniCard from '../components/AlumniCard';
import RequestList from '../components/RequestList';
import { MentorshipModal } from '../components/RequestModals';
import { CardSkeletons, EmptyState, ErrorState, PageHeader, PageLoader, Pagination, Tabs } from '../components/ui';

function FindMentor() {
  const [q, setQ] = useState('');
  const [page, setPage] = useState(1);
  const [target, setTarget] = useState(null);
  const { data, loading, error, reload } = useFetch('/alumni/search', { availableForMentorship: true, limit: 9, page, ...(q && { q }) });
  const list = data?.data || [];

  return (
    <>
      <div className="relative mb-5 max-w-xl">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input className="input pl-9" placeholder="Search mentors by skill, company, domain…" value={q} onChange={(e) => { setQ(e.target.value); setPage(1); }} aria-label="Search mentors" />
      </div>
      {loading && !data ? <CardSkeletons /> : error ? <ErrorState message={error} onRetry={reload} /> : list.length === 0 ? (
        <EmptyState icon={Users} title="No mentors found" message="Try a different search term." />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {list.map((a) => (
            <AlumniCard
              key={a._id}
              alumni={a}
              footer={
                <div className="space-y-2">
                  {a.preferredMentorshipTopics?.length > 0 && (
                    <p className="text-xs text-slate-500"><b>Topics:</b> {a.preferredMentorshipTopics.slice(0, 3).join(' · ')}</p>
                  )}
                  <div className="flex gap-2">
                    <button className="btn-accent btn-sm flex-1" onClick={() => setTarget(a)}><HandHeart className="h-3.5 w-3.5" /> Request mentorship</button>
                    <Link to={`/alumni/${a._id}`} className="btn-secondary btn-sm">Profile</Link>
                  </div>
                </div>
              }
            />
          ))}
        </div>
      )}
      <Pagination page={data?.page || 1} pages={data?.pages || 1} onChange={setPage} />
      {target && <MentorshipModal key={target._id} open alumni={target} onClose={() => setTarget(null)} onDone={reload} />}
    </>
  );
}

function MyRequests({ role }) {
  const [status, setStatus] = useState('');
  const { data, loading, error, reload } = useFetch('/mentorship', status ? { status } : undefined);
  const items = data?.data || [];
  return (
    <>
      <div className="mb-4 flex flex-wrap gap-2">
        {['', 'pending', 'accepted', 'rejected', 'completed'].map((s) => (
          <button key={s || 'all'} onClick={() => setStatus(s)} className={`chip capitalize ${status === s ? '!bg-teal-600 dark:!bg-teal-500 !text-white' : 'hover:bg-slate-100 dark:hover:bg-slate-800'}`}>{s || 'All'}</button>
        ))}
      </div>
      {loading && !data ? <PageLoader /> : error ? <ErrorState message={error} onRetry={reload} /> : items.length === 0 ? (
        <EmptyState icon={HandHeart} title="No mentorship requests" message={role === 'student' ? 'Find a mentor and send your first request.' : 'Requests from students will appear here.'} />
      ) : <RequestList kind="mentorship" items={items} role={role} onChange={reload} />}
    </>
  );
}

export default function Mentors() {
  const { user } = useAuth();
  const [tab, setTab] = useState(user.role === 'student' ? 'find' : 'requests');

  return (
    <div className="page">
      <PageHeader
        title={user.role === 'student' ? 'Find a Mentor' : 'Mentorship Requests'}
        subtitle={user.role === 'student' ? 'Alumni who are open to mentoring students like you.' : 'Students asking for your guidance.'}
      />
      {user.role === 'student' && (
        <Tabs tabs={[{ value: 'find', label: 'Find a mentor' }, { value: 'requests', label: 'My requests' }]} value={tab} onChange={setTab} />
      )}
      {tab === 'find' && user.role === 'student' ? <FindMentor /> : <MyRequests role={user.role} />}
    </div>
  );
}
