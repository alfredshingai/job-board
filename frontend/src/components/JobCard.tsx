import { Link } from 'react-router-dom';
import type { Job } from '../api/types';

function salaryLabel(j: Job) {
  if (j.salaryMin == null && j.salaryMax == null) return '—';
  const fmt = (n: number) => `$${(n / 1000).toFixed(0)}k`;
  if (j.salaryMin != null && j.salaryMax != null) return `${fmt(j.salaryMin)} – ${fmt(j.salaryMax)}`;
  if (j.salaryMin != null) return `From ${fmt(j.salaryMin)}`;
  return `Up to ${fmt(j.salaryMax!)}`;
}

function workplaceBadge(w: Job['workplace']) {
  const map = { REMOTE: 'Remote', HYBRID: 'Hybrid', ONSITE: 'On-site' } as const;
  const color = w === 'REMOTE' ? 'bg-emerald-50 text-emerald-700 ring-emerald-200' : w === 'HYBRID' ? 'bg-amber-50 text-amber-700 ring-amber-200' : 'bg-zinc-100 text-zinc-700 ring-zinc-200';
  return <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ${color}`}>{map[w]}</span>;
}

export default function JobCard({ job }: { job: Job }) {
  return (
    <Link to={`/jobs/${job.id}`} className="group block rounded-2xl border border-zinc-200 bg-white p-4 sm:p-5 hover:border-zinc-300 hover:shadow-sm transition">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="font-semibold leading-tight group-hover:underline underline-offset-4 decoration-zinc-300 line-clamp-2">{job.title}</h3>
          <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-zinc-600">
            <span className="inline-flex items-center gap-1.5">
              {job.company.logoUrl ? <img src={job.company.logoUrl} alt="" className="h-4 w-4 rounded object-cover" /> : <span className="h-4 w-4 rounded bg-zinc-200 inline-block" />}
              <span className="font-medium text-zinc-900">{job.company.name}</span>
              {job.company.verified && <span title="Verified company" className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-sky-500 text-white text-[10px]">✓</span>}
            </span>
            <span className="text-zinc-300">·</span>
            <span className="truncate">{job.location}</span>
          </div>
        </div>
        {workplaceBadge(job.workplace)}
      </div>

      <p className="mt-3 line-clamp-2 text-sm leading-relaxed text-zinc-600">{job.description}</p>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        {job.tags.slice(0, 4).map((t) => (
          <span key={t} className="rounded-full bg-zinc-100 px-2.5 py-1 text-xs font-mono text-zinc-700">#{t}</span>
        ))}
        {job.tags.length > 4 && <span className="text-xs text-zinc-500">+{job.tags.length - 4}</span>}
        <span className="ml-auto text-sm font-medium text-zinc-900">{salaryLabel(job)}</span>
      </div>

      <div className="mt-2 text-xs text-zinc-500">{new Date(job.createdAt).toLocaleDateString()} · {job.currency}</div>
    </Link>
  );
}
