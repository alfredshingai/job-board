import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <header className="sticky top-0 z-40 backdrop-blur bg-white/80 border-b border-zinc-200">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 h-14 flex items-center justify-between gap-4">
        <Link to="/" className="flex items-center gap-2 font-semibold tracking-tight">
          <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-zinc-900 text-white text-[11px] font-mono font-bold">DH</span>
          <span>DevHire</span>
          <span className="hidden sm:inline text-zinc-500 font-normal">— jobs for engineers</span>
        </Link>

        <nav className="flex items-center gap-1 sm:gap-2 text-sm">
          <Link to="/jobs" className="px-3 py-1.5 rounded-full hover:bg-zinc-100">Jobs</Link>

          {user?.role === 'COMPANY' && (
            <Link to="/dashboard" className="px-3 py-1.5 rounded-full bg-zinc-900 text-white hover:bg-zinc-800">Dashboard</Link>
          )}
          {user?.role === 'ADMIN' && (
            <Link to="/admin" className="px-3 py-1.5 rounded-full bg-amber-500 text-zinc-900 hover:bg-amber-400 font-medium">Admin</Link>
          )}

          {!user ? (
            <>
              <Link to="/login" className="px-3 py-1.5 rounded-full hover:bg-zinc-100">Log in</Link>
              <Link to="/register" className="px-4 py-1.5 rounded-full bg-zinc-900 text-white hover:bg-zinc-800">Sign up</Link>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <span className="hidden sm:inline text-zinc-500 max-w-[14ch] truncate">{user.email}</span>
              <span className="inline-flex items-center rounded-full bg-zinc-100 px-2.5 py-1 text-xs font-medium">{user.role}</span>
              <button
                onClick={() => {
                  logout();
                  navigate('/');
                }}
                className="px-3 py-1.5 rounded-full hover:bg-zinc-100"
              >
                Log out
              </button>
            </div>
          )}
        </nav>
      </div>
    </header>
  );
}
