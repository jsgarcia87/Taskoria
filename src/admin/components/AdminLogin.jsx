import React, { useState } from 'react';

const AdminLogin = ({ onLogin, loading, error }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (username && password) onLogin(username, password);
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: 'var(--admin-bg)' }}>
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-[#1c1c26] border border-white/5 mb-4">
            <img src="/Icono_taskoria.svg" alt="" className="w-8 h-8" />
          </div>
          <h1 className="text-xl font-heading font-bold text-white tracking-tight">Taskoria Admin</h1>
          <p className="text-xs text-[var(--admin-text-muted)] mt-1">Control Panel</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-[var(--admin-text-muted)] mb-1.5">
              Username
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--admin-card)] border border-white/5 text-white text-sm placeholder:text-white/20 focus:outline-none focus:border-[var(--admin-accent)]/40 transition-colors"
              placeholder="admin"
              autoFocus
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-[var(--admin-text-muted)] mb-1.5">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--admin-card)] border border-white/5 text-white text-sm placeholder:text-white/20 focus:outline-none focus:border-[var(--admin-accent)]/40 transition-colors"
              placeholder="Password"
            />
          </div>

          {error && (
            <p className="text-red-400 text-xs bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading || !username || !password}
            className="w-full py-2.5 rounded-xl bg-[var(--admin-accent)] text-white text-sm font-semibold hover:brightness-110 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AdminLogin;
