import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client';
import JobCard from '../components/JobCard';
import type { Job } from '../api/types';

export default function Home() {
  const [stats, setStats] = useState<{ jobs: number; companies: number } | null>(null);
  const [tags, setTags] = useState<{ name: string; count: number }[]>([]);
  const [latest, setLatest] = useState<Job[]>([]);

  useEffect(() => {
    api.get<{ jobs: number; companies: number }>('/api/stats').then(setStats).catch(() => {});
    api.get<{ data: { name: string; count: number }[] }>('/api/tags').then((r) => setTags(r.data)).catch(() => {});
    api.get<{ data: Job[]; meta: unknown }>('/api/jobs?pageSize=6&sort=newest').then((r) => setLatest(r.data)).catch(() => {});
  }, []);

  return (
    <div className="space-y-8">
      <section className="rounded-3xl bg-zinc-900 text-white p-6 sm:p-10 overflow-hidden relative">
        <div className="absolute inset-0 bg-gradient-to-br from-zinc-800 to-zinc-900" />
        <div className="relative max-w-3xl">
          <p className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-mono text-zinc-200 ring-1 ring-white/10">Trusted by {stats?.companies ?? '—'} companies · {stats?.jobs ?? '—'} open roles</p>
          <h1 className="mt-4 text-3xl sm:text-5xl font-bold tracking-tight leading-tight">Find your next engineering role — without the noise.</h1>
          <p className="mt-3 text-zinc-300 leading-relaxed max-w-2xl">Curated tech jobs with clear salary ranges, stack tags and remote filters. Built for engineers who want signal, not spam.</p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link to="/jobs" className="rounded-full bg-white px-6 py-3 text-sm font-semibold text-zinc-900 hover:bg-zinc-100">Browse jobs</Link>
            <Link to="/register" className="rounded-full bg-white/10 px-6 py-3 text-sm font-medium text-white ring-1 ring-white/20 hover:bg-white/15">For companies — post a job</Link>
          </div>
        </div>
      </section>

      {tags.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold tracking-wide text-zinc-600">POPULAR STACKS</h2>
          <div className="flex flex-wrap gap-2">
            {tags.map((t) => (
              <Link key={t.name} to={`/jobs?tags=${encodeURIComponent(t.name)}`} className="rounded-full border border-zinc-200 bg-white px-3 py-1.5 text-sm hover:border-zinc-300">
                #{t.name} <span className="text-zinc-500">· {t.count}</span>
              </Link>
            ))}
          </div>
        </section>
      )}

      <section className="space-y-4">
        <div className="flex items-baseline justify-between">
          <h2 className="text-xl font-semibold">Latest openings</h2>
          <Link to="/jobs" className="text-sm font-medium text-zinc-600 hover:text-zinc-900">View all →</Link>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          {latest.map((j) => (
            <JobCard key={j.id} job={j} />
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-zinc-200 bg-white p-6">
        <h3 className="font-semibold">How it works</h3>
        <ol className="mt-3 grid gap-4 sm:grid-cols-3 text-sm leading-relaxed text-zinc-600">
          <li><span className="font-mono text-zinc-900">01</span> — Companies post jobs (approved by an admin to keep spam out).</li>
          <li><span className="font-mono text-zinc-900">02</span> — Candidates filter by stack, location and salary.</li>
          <li><span className="font-mono text-zinc-900">03</span> — Apply via the company's external link or in-app.</li>
        </ol>
      </section>
    </div>
  );
}
