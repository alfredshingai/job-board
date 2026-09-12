import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('candidate@example.com');
  const [password, setPassword] = useState('Candidate123!');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login(email, password);
      navigate('/jobs');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-md space-y-6">
      <div className="rounded-3xl border border-zinc-200 bg-white p-6 sm:p-8">
        <h1 className="text-xl font-bold">Welcome back</h1>
        <p className="mt-1 text-sm text-zinc-600">Demo: candidate@example.com / Candidate123! — or use the seeded accounts below.</p>
        <form onSubmit={submit} className="mt-6 space-y-4">
          <label className="block space-y-1">
            <span className="text-xs font-medium text-zinc-700">Email</span>
            <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" required className="w-full rounded-xl border border-zinc-200 px-3 py-2.5 text-sm outline-none focus:border-zinc-400" />
          </label>
          <label className="block space-y-1">
            <span className="text-xs font-medium text-zinc-700">Password</span>
            <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" required className="w-full rounded-xl border border-zinc-200 px-3 py-2.5 text-sm outline-none focus:border-zinc-400" />
          </label>
          {error && <div className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700 border border-red-200">{error}</div>}
          <button disabled={loading} className="w-full rounded-full bg-zinc-900 py-3 text-sm font-semibold text-white hover:bg-zinc-800 disabled:opacity-50">
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
        <p className="mt-4 text-center text-sm text-zinc-600">
          No account? <Link to="/register" className="font-medium text-zinc-900 underline underline-offset-4">Create one</Link>
        </p>
        <div className="mt-6 rounded-2xl bg-zinc-50 p-4 text-xs leading-relaxed text-zinc-600">
          <div className="font-mono font-medium text-zinc-900">Seeded demo accounts</div>
          <div>admin@devhire.dev / Admin123! (admin)</div>
          <div>recruiter@nimbuslabs.io / Company123! (company)</div>
          <div>candidate@example.com / Candidate123! (seeker)</div>
        </div>
      </div>
    </div>
  );
}

export function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'USER' });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await register(form);
      navigate(form.role === 'COMPANY' ? '/dashboard' : '/jobs');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-md space-y-6">
      <div className="rounded-3xl border border-zinc-200 bg-white p-6 sm:p-8">
        <h1 className="text-xl font-bold">Create your account</h1>
        <p className="mt-1 text-sm text-zinc-600">Companies can post jobs after creating a company profile.</p>
        <form onSubmit={submit} className="mt-6 space-y-4">
          <label className="block space-y-1">
            <span className="text-xs font-medium text-zinc-700">Full name</span>
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required className="w-full rounded-xl border border-zinc-200 px-3 py-2.5 text-sm" />
          </label>
          <label className="block space-y-1">
            <span className="text-xs font-medium text-zinc-700">Email</span>
            <input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} type="email" required className="w-full rounded-xl border border-zinc-200 px-3 py-2.5 text-sm" />
          </label>
          <label className="block space-y-1">
            <span className="text-xs font-medium text-zinc-700">Password</span>
            <input value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} type="password" required minLength={8} className="w-full rounded-xl border border-zinc-200 px-3 py-2.5 text-sm" />
            <span className="text-xs text-zinc-500">Min 8 chars, mix of upper/lower/number</span>
          </label>
          <label className="block space-y-1">
            <span className="text-xs font-medium text-zinc-700">I am a…</span>
            <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} className="w-full rounded-xl border border-zinc-200 px-3 py-2.5 text-sm bg-white">
              <option value="USER">Job seeker</option>
              <option value="COMPANY">Company / recruiter</option>
            </select>
          </label>
          {error && <div className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700 border border-red-200">{error}</div>}
          <button disabled={loading} className="w-full rounded-full bg-zinc-900 py-3 text-sm font-semibold text-white hover:bg-zinc-800 disabled:opacity-50">
            {loading ? 'Creating…' : 'Create account'}
          </button>
        </form>
        <p className="mt-4 text-center text-sm text-zinc-600">
          Already have an account? <Link to="/login" className="font-medium text-zinc-900 underline underline-offset-4">Log in</Link>
        </p>
      </div>
    </div>
  );
}
