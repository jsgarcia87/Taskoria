import React, { useState, useEffect, useCallback } from 'react';

const UsersSection = ({ adminFetch }) => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [newUser, setNewUser] = useState({ username: '', password: '', is_admin: false });
  const [actionError, setActionError] = useState(null);

  const loadUsers = useCallback(async () => {
    try {
      const data = await adminFetch('list_users');
      setUsers(data.users || []);
    } catch { /* silent */ }
    setLoading(false);
  }, [adminFetch]);

  useEffect(() => { loadUsers(); }, [loadUsers]);

  const handleAdd = async (e) => {
    e.preventDefault();
    setActionError(null);
    try {
      await adminFetch('add_user', newUser);
      setNewUser({ username: '', password: '', is_admin: false });
      setShowAdd(false);
      loadUsers();
    } catch (err) {
      setActionError(err.message);
    }
  };

  const handleDelete = async (id, username) => {
    if (!window.confirm(`Delete user "${username}"? This cannot be undone.`)) return;
    try {
      await adminFetch('delete_user', { target_id: id });
      loadUsers();
    } catch (err) {
      setActionError(err.message);
    }
  };

  const filtered = users.filter(u =>
    u.username.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-5 h-5 border-2 border-purple-500/30 border-t-purple-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl space-y-4">
      {/* Header row */}
      <div className="flex items-center justify-between gap-3">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search users..."
          className="flex-1 max-w-xs px-3 py-2 rounded-lg bg-[var(--admin-card)] border border-white/5 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-purple-500/40"
        />
        <button
          onClick={() => setShowAdd(!showAdd)}
          className="px-3 py-2 rounded-lg bg-purple-500/15 text-purple-400 text-xs font-semibold hover:bg-purple-500/25 transition-colors border border-purple-500/20"
        >
          {showAdd ? 'Cancel' : '+ Add User'}
        </button>
      </div>

      {/* Add user form */}
      {showAdd && (
        <form onSubmit={handleAdd} className="rounded-xl border border-white/[0.06] p-4 space-y-3" style={{ background: 'var(--admin-card)' }}>
          <div className="flex gap-3">
            <input
              type="text"
              value={newUser.username}
              onChange={(e) => setNewUser(p => ({ ...p, username: e.target.value }))}
              placeholder="Username"
              className="flex-1 px-3 py-2 rounded-lg bg-black/30 border border-white/5 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-purple-500/40"
              required
            />
            <input
              type="password"
              value={newUser.password}
              onChange={(e) => setNewUser(p => ({ ...p, password: e.target.value }))}
              placeholder="Password"
              className="flex-1 px-3 py-2 rounded-lg bg-black/30 border border-white/5 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-purple-500/40"
              required
            />
          </div>
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 text-xs text-[var(--admin-text-muted)] cursor-pointer">
              <input
                type="checkbox"
                checked={newUser.is_admin}
                onChange={(e) => setNewUser(p => ({ ...p, is_admin: e.target.checked }))}
                className="rounded"
              />
              Admin privileges
            </label>
            <button
              type="submit"
              className="px-4 py-1.5 rounded-lg bg-purple-500 text-white text-xs font-semibold hover:brightness-110 transition-all"
            >
              Create User
            </button>
          </div>
        </form>
      )}

      {actionError && (
        <p className="text-red-400 text-xs bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
          {actionError}
        </p>
      )}

      {/* Users table */}
      <div className="rounded-xl border border-white/[0.04] overflow-hidden" style={{ background: 'var(--admin-card)' }}>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/[0.04]">
              <th className="text-left px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-[var(--admin-text-muted)]">ID</th>
              <th className="text-left px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-[var(--admin-text-muted)]">Username</th>
              <th className="text-left px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-[var(--admin-text-muted)]">Role</th>
              <th className="text-left px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-[var(--admin-text-muted)]">Created</th>
              <th className="text-right px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-[var(--admin-text-muted)]">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(u => (
              <tr key={u.id} className="border-b border-white/[0.02] hover:bg-white/[0.02] transition-colors">
                <td className="px-4 py-3 font-pixel text-white/40">{u.id}</td>
                <td className="px-4 py-3 text-white font-medium">{u.username}</td>
                <td className="px-4 py-3">
                  {u.is_admin ? (
                    <span className="text-[10px] font-bold uppercase tracking-wider text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded-full border border-purple-500/20">Admin</span>
                  ) : (
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--admin-text-muted)]">User</span>
                  )}
                </td>
                <td className="px-4 py-3 text-white/40 text-xs">
                  {u.created_at ? new Date(u.created_at).toLocaleDateString() : '—'}
                </td>
                <td className="px-4 py-3 text-right">
                  <button
                    onClick={() => handleDelete(u.id, u.username)}
                    className="text-[11px] text-red-400/60 hover:text-red-400 transition-colors"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-[var(--admin-text-muted)] text-sm">
                  {search ? 'No users match your search' : 'No users found'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <p className="text-[11px] text-[var(--admin-text-muted)]">{users.length} total users</p>
    </div>
  );
};

export default UsersSection;
