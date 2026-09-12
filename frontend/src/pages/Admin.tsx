import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import type { Job } from '../api/types';

type Stats = { jobs: { pendingReview: number; approved: number; rejected: number; hidden: number }; companies: number; users: number; applications: number };

export default function Admin() {
  const { token, user } = useAuth();
  const [stats, setStats] = useState<Stats | null>(null);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [statusFilter, setStatusFilter] = useState('');
  const [q, setQ] = useState('');
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    if (!token) return;
    setError(null);
    try {
      const s = await api.get<Stats>('/api/admin/stats', token);
      setStats(s);
      const qs = new URLSearchParams();
      if (statusFilter) qs.set('status', statusFilter);
      if (q) qs.set('q', q);
      qs.set('pageSize', '50');
      const j = await api.get<{ data: Job[] }>(`/api/admin/jobs?${qs.toString()}`, token);
      setJobs(j.data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load admin data');
    }
  };

  useEffect(() => {
    void load();
  }, [token, statusFilter]);

  const mutate = async (id: string, body: unknown, path: string) => {
    await api.patch(`/api/admin/${path}`, body, token);
    await load();
  };

  if (!user) return <div className="rounded-2xl border border-zinc-200 bg-white p-6 text-sm">Please <Link to="/login" className="underline">log in</Link>.</div>;
  if (user.role !== 'ADMIN') return <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-sm text-amber-900">Admin only. Your role is {user.role}.</div>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">Admin panel</h1>
      {error && <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>}

      {stats && (
        <div className="grid gap-3 sm:grid-cols-4">
          <div className="rounded-2xl border border-zinc-200 bg-white p-4"><div className="text-xs uppercase tracking-wide text-zinc-500">Pending</div><div className="text-2xl font-bold">{stats.jobs.pendingReview}</div></div>
          <div className="rounded-2xl border border-zinc-200 bg-white p-4"><div className="text-xs uppercase tracking-wide text-zinc-500">Approved</div><div className="text-2xl font-bold">{stats.jobs.approved}</div></div>
          <div className="rounded-2xl border border-zinc-200 bg-white p-4"><div className="text-xs uppercase tracking-wide text-zinc-500">Rejected</div><div className="text-2xl font-bold">{stats.jobs.rejected}</div></div>
          <div className="rounded-2xl border border-zinc-200 bg-white p-4"><div className="text-xs uppercase tracking-wide text-zinc-500">Users / Companies</div><div className="text-2xl font-bold">{stats.users} / {stats.companies}</div></div>
        </div>
      )}

      <div className="flex flex-wrap gap-2 items-center">
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="rounded-xl border border-zinc-200 px-3 py-2 text-sm bg-white">
          <option value="">All statuses</option>
          <option value="PENDING_REVIEW">Pending review</option>
          <option value="APPROVED">Approved</option>
          <option value="REJECTED">Rejected</option>
          <option value="HIDDEN">Hidden</option>
        </select>
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search title/company" className="rounded-xl border border-zinc-200 px-3 py-2 text-sm" />
        <button onClick={() => void load()} className="rounded-full bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800">Search</button>
        <button onClick={() => { setQ(''); setStatusFilter(''); }} className="rounded-full border border-zinc-200 px-4 py-2 text-sm hover:bg-white">Reset</button>
      </div>

      <div className="grid gap-3">
        {jobs.map((j) => (
          <div key={j.id} className="rounded-2xl border border-zinc-200 bg-white p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="font-medium truncate">{j.title} <span className="text-zinc-500">— {j.company.name}</span></div>
                <div className="text-xs text-zinc-600">{j.location} · {j.workplace} · <span className="font-mono">{j.status}</span> {j.flagged && '· flagged'} · {new Date(j.createdAt).toLocaleDateString()}</div>
                <div className="mt-1 flex flex-wrap gap-1">{j.tags.map((t) => <span key={t} className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-mono">#{t}</span>)}</div>
              </div>
              <div className="flex flex-wrap gap-2">
                <button onClick={() => void mutate(j.id, { status: 'APPROVED' }, `jobs/${j.id}/status`)} className="rounded-full bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-700">Approve</button>
                <button onClick={() => void mutate(j.id, { status: 'REJECTED' }, `jobs/${j.id}/status`)} className="rounded-full bg-zinc-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-zinc-800">Reject</button>
                <button onClick={() => void mutate(j.id, { status: 'HIDDEN' }, `jobs/${j.id}/status`)} className="rounded-full border border-zinc-200 px-3 py-1.5 text-xs hover:bg-zinc-50">Hide</button>
                <button onClick={() => void mutate(j.id, { flagged: !j.flagged }, `jobs/${j.id}/flag`)} className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs hover:bg-amber-100">{j.flagged ? 'Unflag' : 'Flag spam'}</button>
                <Link to={`/jobs/${j.id}`} className="rounded-full border border-zinc-200 px-3 py-1.5 text-xs hover:bg-zinc-50">View</Link>
              </div>
            </div>
          </div>
        ))}
        {jobs.length === 0 && <div className="rounded-2xl border border-dashed border-zinc-300 p-8 text-center text-sm text-zinc-600">No jobs match this filter.</div>}
      </div>
    </div>
  );
}
