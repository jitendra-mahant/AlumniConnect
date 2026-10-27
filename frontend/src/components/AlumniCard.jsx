import { Link } from 'react-router-dom';
import { Briefcase, Building2, ExternalLink, GraduationCap, HandHeart, Handshake, MapPin, Linkedin, ArrowRight, Lock } from 'lucide-react';
import { Avatar, VerifiedBadge } from './ui';

export default function AlumniCard({ alumni, footer }) {
  const name = alumni.fullName || alumni.name || 'Unknown Alumni';
  const company = alumni.currentCompany || alumni.company || 'Company Not Specified';
  const job = alumni.currentJobTitle || alumni.role || 'Role Not Specified';
  const linkedin = alumni.linkedinUrl || alumni.linkedin || alumni.linkedIn || '';

  const skills = [
    ...(alumni.skills || []),
    ...(alumni.technologies || [])
  ].filter((s, i, a) =>
    typeof s === 'string' &&
    a.findIndex(x => typeof x === 'string' && x.toLowerCase() === s.toLowerCase()) === i
  );

  return (
    <article className="card-hover flex flex-col justify-between p-5 bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-xl shadow-card transition-all duration-200">
      <div>
        <div className="flex items-start gap-3.5">
          <Avatar
            name={name}
            src={alumni.profilePhoto || alumni.photo}
            size="md"
            className="ring-2 ring-slate-100 dark:ring-slate-800 shadow-sm shrink-0"
          />

          <div className="min-w-0 flex-1">
            <Link
              to={`/alumni/${alumni._id || alumni.id}`}
              className="block truncate font-display text-base font-bold text-slate-900 dark:text-slate-100 hover:text-brand-600 dark:hover:text-brand-400 transition-colors"
            >
              {name}
            </Link>

            <p className="truncate text-xs font-medium text-slate-600 dark:text-slate-400 mt-0.5">
              {job || 'Alumni'}
            </p>

            {company && (
              <p className="flex items-center gap-1.5 truncate text-xs font-semibold text-brand-700 dark:text-brand-400 mt-0.5">
                <Building2 className="h-3 w-3 shrink-0" />
                {company}
              </p>
            )}
          </div>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-x-3.5 gap-y-1 text-xs text-slate-500 dark:text-slate-400">
          {(alumni.department || alumni.graduationYear || alumni.graduation_year) && (
            <span className="flex items-center gap-1">
              <GraduationCap className="h-3.5 w-3.5 shrink-0 text-slate-400" />
              <span>{alumni.department || 'Engineering'}</span>
              <span>·</span>
              <span>Class of {alumni.graduationYear || alumni.graduation_year || 'N/A'}</span>
            </span>
          )}

          {alumni.location && (
            <span className="flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5 shrink-0 text-slate-400" />
              {alumni.location}
            </span>
          )}
        </div>

        {skills.length > 0 && (
          <div className="mt-3.5 flex flex-wrap gap-1.5">
            {skills.slice(0, 4).map((skill, i) => (
              <span key={`${skill}-${i}`} className="chip text-[11px] font-medium">
                {skill}
              </span>
            ))}
            {skills.length > 4 && (
              <span className="chip text-[11px] font-medium bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                +{skills.length - 4}
              </span>
            )}
          </div>
        )}

        {linkedin ? (
          <a
            href={linkedin}
            target="_blank"
            rel="noreferrer noopener"
            onClick={(e) => e.stopPropagation()}
            className="mt-3.5 inline-flex items-center gap-1.5 rounded-lg border border-teal-200/90 bg-teal-50/80 px-2.5 py-1.5 text-xs font-semibold text-teal-700 hover:bg-teal-100 hover:text-teal-800 dark:border-teal-800/80 dark:bg-teal-950/40 dark:text-teal-300 dark:hover:bg-teal-900/60 transition focus-visible:ring-2 focus-visible:ring-teal-500"
            aria-label={`View ${name}'s LinkedIn Profile (opens in new tab)`}
          >
            <Linkedin className="h-3.5 w-3.5 text-teal-600 dark:text-teal-400 shrink-0" />
            <span>View LinkedIn Profile</span>
            <ExternalLink className="h-3 w-3 opacity-60 ml-0.5" />
          </a>
        ) : alumni.linkedinProtected ? (
          <span className="mt-3.5 inline-flex items-center gap-1.5 text-[11px] font-medium text-slate-500 dark:text-slate-400 py-1" title="LinkedIn profile link is private per alumnus preference">
            <Lock className="h-3 w-3 text-slate-400" />
            <span>LinkedIn (Private)</span>
          </span>
        ) : null}

        {alumni.matchReasons?.length > 0 && (
          <div className="mt-3 rounded-lg bg-teal-50/80 dark:bg-teal-950/30 px-2.5 py-1.5 text-xs text-teal-900 dark:text-teal-200 ring-1 ring-teal-200/60 dark:ring-teal-800/40">
            <span className="font-bold text-teal-700 dark:text-teal-300">Recommended: </span>
            {alumni.matchReasons.join(' · ')}
          </div>
        )}
      </div>

      <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-1.5">
            {alumni.verificationStatus === 'verified' ? (
              <VerifiedBadge />
            ) : (
              <span className="badge bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 ring-1 ring-amber-200 dark:ring-amber-800/60 text-[11px] capitalize">
                {alumni.verificationStatus || 'Member'}
              </span>
            )}

            {alumni.availableForMentorship && (
              <span className="badge bg-teal-50 text-teal-700 dark:bg-teal-950/40 dark:text-teal-300 ring-1 ring-teal-200 dark:ring-teal-800/60 text-[11px]">
                <HandHeart className="h-3 w-3" /> Mentor
              </span>
            )}

            {alumni.availableForReferral && (
              <span className="badge bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300 ring-1 ring-indigo-200 dark:ring-indigo-800/60 text-[11px]">
                <Handshake className="h-3 w-3" /> Referral
              </span>
            )}
          </div>

          <Link
            to={`/alumni/${alumni._id || alumni.id}`}
            className="text-xs font-semibold text-brand-600 dark:text-brand-400 hover:underline inline-flex items-center gap-1 ml-auto"
          >
            Profile <ArrowRight className="h-3 w-3" />
          </Link>
        </div>

        {footer && <div className="mt-3">{footer}</div>}
      </div>
    </article>
  );
}
