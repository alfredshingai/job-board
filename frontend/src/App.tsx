import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Jobs from './pages/Jobs';
import JobDetail from './pages/JobDetail';
import { Login, Register } from './pages/Auth';
import Dashboard from './pages/Dashboard';
import Admin from './pages/Admin';

function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="mx-auto max-w-6xl px-4 sm:px-6 py-6 sm:py-8">{children}</main>
      <footer className="mx-auto max-w-6xl px-4 sm:px-6 py-8 text-center text-xs text-zinc-500 border-t border-zinc-200 mt-8">
        DevHire — portfolio MVP · <a href="https://github.com" className="underline underline-offset-4">GitHub</a> · Built with Express + Prisma + React
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Layout>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/jobs" element={<Jobs />} />
            <Route path="/jobs/:id" element={<JobDetail />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/admin" element={<Admin />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Layout>
      </BrowserRouter>
    </AuthProvider>
  );
}
