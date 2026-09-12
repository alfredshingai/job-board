import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../api/client';
import type { Job } from '../api/types';
import { useAuth } from '../context/AuthContext';

export default function JobDetail() {
  const { id } = useParams();
  const { token } = useAuth();
  const [job, setJob] = useState<Job | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    api
      .get<{ job: Job }>(`/api/jobs/${id}`, token)
      .then((r) => setJob(r.job))
      .catch((e: Error) => setError(e.message));
  }, [id, token]);

  if (error) return <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-sm text-red-700">{error}</div>;
  if (!job) return <div className="rounded-2xl border border-zinc-200 bg-white p-8 text-center text-sm text-zinc-600">Loading…</div>;

  const salary =
    job.salaryMin != null || job.salaryMax != null
      ? `${job.salaryMin ? `$${(job.salaryMin / 1000).toFixed(0)}k` : '—'} – ${job.salaryMax ? `$${(job.salaryMax / 1000).toFixed(0)}k` : '—'} ${job.currency}`
      : 'Not disclosed';

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Link to="/jobs" className="text-sm text-zinc-600 hover:text-zinc-900">← Back to jobs</Link>

      <div className="rounded-3xl border border-zinc-200 bg-white p-6 sm:p-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">{job.title}</h1>
            <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-zinc-600">
              <span className="font-medium text-zinc-900">{job.company.name}</span>
              {job.company.verified && <span className="rounded-full bg-sky-500 px-2 py-0.5 text-xs font-medium text-white">Verified</span>}
              <span>· {job.location}</span>
              <span className="rounded-full bg-zinc-100 px-2.5 py-1 text-xs font-medium">{job.workplace}</span>
              <span className="rounded-full bg-zinc-100 px-2.5 py-1 text-xs font-mono">{job.status}</span>
            </div>
          </div>
          <a href={job.applyUrl} target="_blank" rel="noreferrer" className="rounded-full bg-zinc-900 px-6 py-3 text-sm font-semibold text-white hover:bg-zinc-800">
            Apply ↗
          </a>
        </div>

        <div className="mt-6 grid gap-6 sm:grid-cols-3 text-sm">
          <div className="rounded-2xl bg-zinc-50 p-4">
            <div className="text-xs font-medium uppercase tracking-wide text-zinc-500">Salary</div>
            <div className="mt-1 font-medium">{salary}</div>
          </div>
          <div className="rounded-2xl bg-zinc-50 p-4">
            <div className="text-xs font-medium uppercase tracking-wide text-zinc-500">Location</div>
            <div className="mt-1 font-medium">{job.location}</div>
          </div>
          <div className="rounded-2xl bg-zinc-50 p-4">
            <div className="text-xs font-medium uppercase tracking-wide text-zinc-500">Posted</div>
            <div className="mt-1 font-medium">{new Date(job.createdAt).toLocaleDateString()}</div>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap gap-2">
          {job.tags.map((t) => (
            <span key={t} className="rounded-full bg-zinc-900 px-3 py-1 text-xs font-mono text-white">#{t}</span>
          ))}
        </div>

        <div className="prose prose-zinc mt-8 max-w-none">
          <h3 className="text-lg font-semibold">About the role</h3>
          <p className="mt-2 whitespace-pre-wrap leading-relaxed text-zinc-700">{job.description}</p>
        </div>

        <div className="mt-8 rounded-2xl border border-zinc-200 p-4 flex items-center justify-between gap-4">
          <div className="text-sm">
            <div className="font-medium">{job.company.name}</div>
            {job.company.website && (
              <a href={job.company.website} target="_blank" rel="noreferrer" className="text-zinc-600 hover:text-zinc-900 underline underline-offset-4">
                {job.company.website}
              </a>
            )}
          </div>
          <a href={job.applyUrl} target="_blank" rel="noreferrer" className="rounded-full border border-zinc-200 px-5 py-2 text-sm font-medium hover:bg-zinc-50">Apply on company site ↗</a>
        </div>
      </div>
    </div>
  );
}
