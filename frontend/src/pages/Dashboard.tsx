import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import type { Job, Company } from '../api/types';

export default function Dashboard() {
  const { token, user } = useAuth();
  const [company, setCompany] = useState<Company | null>(null);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // company form
  const [form, setForm] = useState({ name: '', website: '', location: '', description: '' });
  const [creating, setCreating] = useState(false);

  // job form
  const [jobForm, setJobForm] = useState({
    title: '',
    description: '',
    location: 'Remote',
    workplace: 'REMOTE' as Job['workplace'],
    salaryMin: '',
    salaryMax: '',
    currency: 'USD',
    applyUrl: '',
    tags: '',
  });
  const [editingId, setEditingId] = useState<string | null>(null);

  const load = async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const c = await api.get<{ company: Company | null }>('/api/companies/me', token);
      setCompany(c.company);
      if (c.company) {
        setForm({ name: c.company.name, website: c.company.website ?? '', location: c.company.location ?? '', description: c.company.description ?? '' });
        const j = await api.get<{ data: Job[] }>('/api/companies/me/jobs', token);
        setJobs(j.data);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, [token]);

  if (!user) return <div className="rounded-2xl border border-zinc-200 bg-white p-6 text-sm">Please <Link to="/login" className="underline">log in</Link> as a company account.</div>;
  if (user.role !== 'COMPANY') return <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-sm text-amber-900">This dashboard is for <span className="font-mono font-medium">COMPANY</span> accounts. Your role is {user.role}. Create a company account to post jobs.</div>;
  if (loading) return <div className="rounded-2xl border border-zinc-200 bg-white p-8 text-center text-sm text-zinc-600">Loading…</div>;

  const saveCompany = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    setError(null);
    try {
      if (company) {
        const res = await api.patch<{ company: Company }>('/api/companies/me', form, token);
        setCompany(res.company);
      } else {
        const res = await api.post<{ company: Company }>('/api/companies', form, token);
        setCompany(res.company);
      }
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save company');
    } finally {
      setCreating(false);
    }
  };

  const submitJob = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const payload = {
      title: jobForm.title,
      description: jobForm.description,
      location: jobForm.location,
      workplace: jobForm.workplace,
      salaryMin: jobForm.salaryMin ? Number(jobForm.salaryMin) : undefined,
      salaryMax: jobForm.salaryMax ? Number(jobForm.salaryMax) : undefined,
      currency: jobForm.currency,
      applyUrl: jobForm.applyUrl,
      tags: jobForm.tags.split(',').map((t) => t.trim()).filter(Boolean),
    };
    try {
      if (editingId) {
        await api.patch(`/api/jobs/${editingId}`, payload, token);
        setEditingId(null);
      } else {
        await api.post('/api/jobs', payload, token);
      }
      setJobForm({ title: '', description: '', location: 'Remote', workplace: 'REMOTE', salaryMin: '', salaryMax: '', currency: 'USD', applyUrl: '', tags: '' });
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save job');
    }
  };

  const removeJob = async (id: string) => {
    if (!confirm('Delete this job?')) return;
    await api.del(`/api/jobs/${id}`, token);
    await load();
  };

  const startEdit = (j: Job) => {
    setEditingId(j.id);
    setJobForm({
      title: j.title,
      description: j.description,
      location: j.location,
      workplace: j.workplace,
      salaryMin: j.salaryMin ? String(j.salaryMin) : '',
      salaryMax: j.salaryMax ? String(j.salaryMax) : '',
      currency: j.currency,
      applyUrl: j.applyUrl,
      tags: j.tags.join(', '),
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-baseline justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Company dashboard</h1>
        {company && <span className="text-sm text-zinc-600">{company.verified ? 'Verified ✓' : 'Unverified'}</span>}
      </div>

      {error && <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>}

      <section className="rounded-3xl border border-zinc-200 bg-white p-6">
        <h2 className="font-semibold">{company ? 'Company profile' : 'Create your company profile'}</h2>
        <p className="text-sm text-zinc-600">This is required before you can post jobs.</p>
        <form onSubmit={saveCompany} className="mt-4 grid gap-4 sm:grid-cols-2">
          <label className="space-y-1">
            <span className="text-xs font-medium">Company name *</span>
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required className="w-full rounded-xl border border-zinc-200 px-3 py-2 text-sm" />
          </label>
          <label className="space-y-1">
            <span className="text-xs font-medium">Website</span>
            <input value={form.website} onChange={(e) => setForm({ ...form, website: e.target.value })} placeholder="https://example.com" className="w-full rounded-xl border border-zinc-200 px-3 py-2 text-sm" />
          </label>
          <label className="space-y-1">
            <span className="text-xs font-medium">Location</span>
            <input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} placeholder="Berlin, Germany" className="w-full rounded-xl border border-zinc-200 px-3 py-2 text-sm" />
          </label>
          <label className="space-y-1 sm:col-span-2">
            <span className="text-xs font-medium">Description</span>
            <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} className="w-full rounded-xl border border-zinc-200 px-3 py-2 text-sm" />
          </label>
          <div className="sm:col-span-2">
            <button disabled={creating} className="rounded-full bg-zinc-900 px-6 py-2.5 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50">
              {company ? 'Save profile' : 'Create profile'}
            </button>
          </div>
        </form>
      </section>

      {company && (
        <section className="rounded-3xl border border-zinc-200 bg-white p-6 space-y-4">
          <h2 className="font-semibold">{editingId ? 'Edit job' : 'Post a new job'}</h2>
          <p className="text-sm text-zinc-600">New jobs enter <span className="font-mono">PENDING_REVIEW</span> and appear publicly after admin approval.</p>
          <form onSubmit={submitJob} className="grid gap-4 sm:grid-cols-2">
            <label className="space-y-1 sm:col-span-2">
              <span className="text-xs font-medium">Title *</span>
              <input value={jobForm.title} onChange={(e) => setJobForm({ ...jobForm, title: e.target.value })} required className="w-full rounded-xl border border-zinc-200 px-3 py-2 text-sm" />
            </label>
            <label className="space-y-1 sm:col-span-2">
              <span className="text-xs font-medium">Description *</span>
              <textarea value={jobForm.description} onChange={(e) => setJobForm({ ...jobForm, description: e.target.value })} required rows={4} className="w-full rounded-xl border border-zinc-200 px-3 py-2 text-sm" />
            </label>
            <label className="space-y-1">
              <span className="text-xs font-medium">Location *</span>
              <input value={jobForm.location} onChange={(e) => setJobForm({ ...jobForm, location: e.target.value })} required className="w-full rounded-xl border border-zinc-200 px-3 py-2 text-sm" />
            </label>
            <label className="space-y-1">
              <span className="text-xs font-medium">Workplace</span>
              <select value={jobForm.workplace} onChange={(e) => setJobForm({ ...jobForm, workplace: e.target.value as Job['workplace'] })} className="w-full rounded-xl border border-zinc-200 px-3 py-2 text-sm bg-white">
                <option value="ONSITE">On-site</option>
                <option value="HYBRID">Hybrid</option>
                <option value="REMOTE">Remote</option>
              </select>
            </label>
            <label className="space-y-1">
              <span className="text-xs font-medium">Salary min</span>
              <input value={jobForm.salaryMin} onChange={(e) => setJobForm({ ...jobForm, salaryMin: e.target.value })} inputMode="numeric" className="w-full rounded-xl border border-zinc-200 px-3 py-2 text-sm" />
            </label>
            <label className="space-y-1">
              <span className="text-xs font-medium">Salary max</span>
              <input value={jobForm.salaryMax} onChange={(e) => setJobForm({ ...jobForm, salaryMax: e.target.value })} inputMode="numeric" className="w-full rounded-xl border border-zinc-200 px-3 py-2 text-sm" />
            </label>
            <label className="space-y-1">
              <span className="text-xs font-medium">Apply URL *</span>
              <input value={jobForm.applyUrl} onChange={(e) => setJobForm({ ...jobForm, applyUrl: e.target.value })} required placeholder="https://company.com/careers/..." className="w-full rounded-xl border border-zinc-200 px-3 py-2 text-sm" />
            </label>
            <label className="space-y-1">
              <span className="text-xs font-medium">Tags (comma-separated)</span>
              <input value={jobForm.tags} onChange={(e) => setJobForm({ ...jobForm, tags: e.target.value })} placeholder="react, typescript" className="w-full rounded-xl border border-zinc-200 px-3 py-2 text-sm" />
            </label>
            <div className="sm:col-span-2 flex gap-2">
              <button className="rounded-full bg-zinc-900 px-6 py-2.5 text-sm font-medium text-white hover:bg-zinc-800">{editingId ? 'Update job' : 'Publish job'}</button>
              {editingId && (
                <button type="button" onClick={() => { setEditingId(null); setJobForm({ title: '', description: '', location: 'Remote', workplace: 'REMOTE', salaryMin: '', salaryMax: '', currency: 'USD', applyUrl: '', tags: '' }); }} className="rounded-full border border-zinc-200 px-6 py-2.5 text-sm hover:bg-zinc-50">Cancel</button>
              )}
            </div>
          </form>
        </section>
      )}

      {company && (
        <section className="space-y-3">
          <h2 className="font-semibold">Your postings · {jobs.length}</h2>
          <div className="grid gap-3">
            {jobs.map((j) => (
              <div key={j.id} className="rounded-2xl border border-zinc-200 bg-white p-4 flex flex-wrap items-center gap-3">
                <div className="min-w-0 flex-1">
                  <div className="font-medium truncate">{j.title}</div>
                  <div className="text-xs text-zinc-600">{j.location} · {j.workplace} · <span className="font-mono">{j.status}</span> {j.flagged && '· flagged'}</div>
                </div>
                <div className="flex gap-2">
                  <Link to={`/jobs/${j.id}`} className="rounded-full border border-zinc-200 px-3 py-1.5 text-xs hover:bg-zinc-50">View</Link>
                  <button onClick={() => startEdit(j)} className="rounded-full border border-zinc-200 px-3 py-1.5 text-xs hover:bg-zinc-50">Edit</button>
                  <button onClick={() => void removeJob(j.id)} className="rounded-full bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-700">Delete</button>
                </div>
              </div>
            ))}
            {jobs.length === 0 && <div className="rounded-2xl border border-dashed border-zinc-300 p-8 text-center text-sm text-zinc-600">No jobs yet — post your first role above.</div>}
          </div>
        </section>
      )}
    </div>
  );
}
