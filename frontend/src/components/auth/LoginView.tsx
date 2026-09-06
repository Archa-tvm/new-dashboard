import React, { useState } from 'react';
import { Cpu, LockKeyhole, UserRound } from 'lucide-react';
import { api } from '../../services/api';

interface LoginViewProps {
  onLogin: (username: string) => void;
}

export const LoginView: React.FC<LoginViewProps> = ({ onLogin }) => {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    try {
      const result = mode === 'login'
        ? await api.login(username, password)
        : await api.register(username, password);
      onLogin(result.username);
    } catch (err: any) {
      setError(err.message || (mode === 'login' ? 'Invalid username or password.' : 'Registration failed.'));
    }
  };

  return (
    <main className="min-h-screen bg-slate-950 flex items-center justify-center px-4 py-8">
      <section className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden">
        <div className="bg-[#0B132B] px-8 py-8 text-white">
          <div className="w-12 h-12 rounded-xl bg-blue-600 flex items-center justify-center mb-5 shadow-lg shadow-blue-950/40">
            <Cpu className="w-6 h-6" />
          </div>
          <p className="text-xs font-bold tracking-[0.2em] text-blue-300 uppercase">Production</p>
          <h1 className="text-2xl font-extrabold tracking-tight mt-1">Inspection Analytics</h1>
          <p className="text-sm text-slate-300 mt-2">{mode === 'login' ? 'Sign in to continue to the dashboard.' : 'Create an account to access the dashboard.'}</p>
        </div>
        <form onSubmit={handleSubmit} className="p-8 space-y-5">
          <label className="block">
            <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">Username</span>
            <span className="relative block mt-1.5">
              <UserRound className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input value={username} onChange={event => setUsername(event.target.value)} autoComplete="username" className="w-full pl-10 pr-3 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" required />
            </span>
          </label>
          <label className="block">
            <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">Password</span>
            <span className="relative block mt-1.5">
              <LockKeyhole className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input type="password" value={password} onChange={event => setPassword(event.target.value)} autoComplete="current-password" className="w-full pl-10 pr-3 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" required />
            </span>
          </label>
          {error && <p className="text-xs font-semibold text-rose-600">{error}</p>}
          <button type="submit" className="w-full py-2.5 rounded-lg bg-blue-600 text-white text-sm font-bold hover:bg-blue-700 transition-colors">{mode === 'login' ? 'Sign in' : 'Create account'}</button>
          <button type="button" onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError(''); }} className="w-full text-xs font-semibold text-blue-700 hover:text-blue-900">
            {mode === 'login' ? 'Create a new account' : 'Back to sign in'}
          </button>
          {mode === 'login' && <p className="text-center text-[11px] text-slate-500">Default account: admin / inspection123</p>}
        </form>
      </section>
    </main>
  );
};
