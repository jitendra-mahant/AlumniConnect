import { Link } from 'react-router-dom';
import { Briefcase, GraduationCap, HandHeart, Handshake, MapPin } from 'lucide-react';
import { Avatar, VerifiedBadge } from './ui';

export default function AlumniCard({ alumni, footer }) {
  const skills = [...(alumni.skills || []), ...(alumni.technologies || [])].filter((s, i, a) => a.findIndex((x) => x.toLowerCase() === s.toLowerCase()) === i);
  return (
    <article className="card-hover flex flex-col p-5">
      <div className="flex items-start gap-3">
        <Avatar name={alumni.fullName} src={alumni.profilePhoto} />
        <div className="min-w-0 flex-1">
          <Link to={`/alumni/${alumni._id}`} className="block truncate font-display text-base font-bold text-navy-950 hover:text-brand-700">
            {alumni.fullName}
          </Link>
          <p className="truncate text-sm text-slate-600">{alumni.currentJobTitle}</p>
          <p className="flex items-center gap-1 truncate text-sm font-semibold text-navy-700">
            <Briefcase className="h-3.5 w-3.5 shrink-0" /> {alumni.currentCompany}
          </p>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
        <span className="flex items-center gap-1"><GraduationCap className="h-3.5 w-3.5" /> {alumni.department} · {alumni.graduationYear}</span>
        {alumni.location && <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" /> {alumni.location}</span>}
      </div>

      <div className="mt-3 flex flex-wrap gap-1.5">
        {skills.slice(0, 5).map((s) => <span key={s} className="chip">{s}</span>)}
        {skills.length > 5 && <span className="chip bg-slate-100 text-slate-500">+{skills.length - 5}</span>}
      </div>

      {alumni.matchReasons && alumni.matchReasons.length > 0 && (
        <div className="mt-3 rounded-lg bg-blue-50/80 px-2.5 py-1.5 text-xs text-navy-900 ring-1 ring-blue-200/60">
          <span className="font-bold text-brand-700">Recommended: </span>
          {alumni.matchReasons.join(' · ')}
        </div>
      )}

      <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-3">
        {alumni.verificationStatus === 'verified' ? <VerifiedBadge /> : (
          <span className="badge bg-amber-50 text-amber-700 ring-1 ring-amber-200 capitalize">{alumni.verificationStatus}</span>
        )}
        {alumni.availableForMentorship && (
          <span className="badge bg-blue-50 text-blue-700"><HandHeart className="h-3 w-3" /> Mentor</span>
        )}
        {alumni.availableForReferral && (
          <span className="badge bg-violet-50 text-violet-700"><Handshake className="h-3 w-3" /> Referral</span>
        )}
        <span className="ml-auto text-xs text-slate-400">{alumni.experienceYears} yrs exp</span>
      </div>
      {footer && <div className="mt-3">{footer}</div>}
    </article>
  );
}
