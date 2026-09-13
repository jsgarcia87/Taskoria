import React, { useState, useEffect, useCallback } from 'react';

const SettingsSection = ({ adminFetch }) => {
  const [settings, setSettings] = useState({ allow_registration: false });
  const [waitlist, setWaitlist] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState(false);

  const load = useCallback(async () => {
    try {
      const [settingsData, waitlistData, suggestionsData] = await Promise.all([
        adminFetch('get_settings'),
        adminFetch('list_waitlist'),
        adminFetch('list_suggestions'),
      ]);
      setSettings({ allow_registration: settingsData.allow_registration });
      setWaitlist(waitlistData.waitlist || []);
      setSuggestions(suggestionsData.suggestions || []);
    } catch { /* silent */ }
    setLoading(false);
  }, [adminFetch]);

  useEffect(() => { load(); }, [load]);

  const toggleRegistration = async () => {
    setToggling(true);
    try {
      await adminFetch('toggle_registration', { allow_registration: !settings.allow_registration });
      setSettings(s => ({ ...s, allow_registration: !s.allow_registration }));
    } catch { /* silent */ }
    setToggling(false);
  };

  const deleteWaitlistEntry = async (id) => {
    await adminFetch('delete_waitlist', { target_id: id });
    setWaitlist(w => w.filter(e => e.id !== id));
  };

  const markRead = async (id) => {
    await adminFetch('mark_suggestion_read', { target_id: id });
    setSuggestions(s => s.map(x => x.id === id ? { ...x, status: 'read' } : x));
  };

  const deleteSuggestion = async (id) => {
    await adminFetch('delete_suggestion', { target_id: id });
    setSuggestions(s => s.filter(x => x.id !== id));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-5 h-5 border-2 border-purple-500/30 border-t-purple-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl space-y-6">
      {/* Registration toggle */}
      <div className="rounded-xl border border-white/[0.04] p-5" style={{ background: 'var(--admin-card)' }}>
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-white">Public Registration</h3>
            <p className="text-xs text-[var(--admin-text-muted)] mt-0.5">Allow new users to create accounts</p>
          </div>
          <button
            onClick={toggleRegistration}
            disabled={toggling}
            className={`relative w-11 h-6 rounded-full transition-colors ${settings.allow_registration ? 'bg-green-500' : 'bg-white/10'}`}
          >
            <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${settings.allow_registration ? 'translate-x-[22px]' : 'translate-x-0.5'}`} />
          </button>
        </div>
      </div>

      {/* Waitlist */}
      <div className="rounded-xl border border-white/[0.04]" style={{ background: 'var(--admin-card)' }}>
        <div className="px-5 py-3 border-b border-white/[0.04] flex items-center justify-between">
          <h3 className="text-sm font-semibold text-white">Waitlist</h3>
          <span className="text-[11px] text-[var(--admin-text-muted)]">{waitlist.length} entries</span>
        </div>
        {waitlist.length === 0 ? (
          <p className="px-5 py-8 text-center text-sm text-[var(--admin-text-muted)]">Waitlist is empty</p>
        ) : (
          <div className="divide-y divide-white/[0.02]">
            {waitlist.map(w => (
              <div key={w.id} className="px-5 py-3 flex items-center justify-between">
                <div>
                  <p className="text-sm text-white">{w.email}</p>
                  <p className="text-[11px] text-[var(--admin-text-muted)]">
                    {w.created_at ? new Date(w.created_at).toLocaleDateString() : ''}
                  </p>
                </div>
                <button
                  onClick={() => deleteWaitlistEntry(w.id)}
                  className="text-[11px] text-red-400/60 hover:text-red-400 transition-colors"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Suggestions / Feedback */}
      <div className="rounded-xl border border-white/[0.04]" style={{ background: 'var(--admin-card)' }}>
        <div className="px-5 py-3 border-b border-white/[0.04] flex items-center justify-between">
          <h3 className="text-sm font-semibold text-white">User Feedback</h3>
          <span className="text-[11px] text-[var(--admin-text-muted)]">
            {suggestions.filter(s => s.status === 'new').length} unread
          </span>
        </div>
        {suggestions.length === 0 ? (
          <p className="px-5 py-8 text-center text-sm text-[var(--admin-text-muted)]">No feedback received</p>
        ) : (
          <div className="divide-y divide-white/[0.02] max-h-96 overflow-y-auto admin-scrollbar">
            {suggestions.map(s => (
              <div key={s.id} className={`px-5 py-3 ${s.status === 'new' ? 'bg-purple-500/[0.03]' : ''}`}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-medium text-white">{s.username}</span>
                      {s.status === 'new' && (
                        <span className="text-[9px] font-bold uppercase tracking-wider text-purple-400 bg-purple-500/10 px-1.5 py-0.5 rounded-full">New</span>
                      )}
                    </div>
                    <p className="text-xs text-white/60 leading-relaxed">{s.message}</p>
                    <p className="text-[10px] text-[var(--admin-text-muted)] mt-1">
                      {s.created_at ? new Date(s.created_at).toLocaleString() : ''}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {s.status === 'new' && (
                      <button
                        onClick={() => markRead(s.id)}
                        className="text-[11px] text-white/40 hover:text-white transition-colors"
                      >
                        Mark read
                      </button>
                    )}
                    <button
                      onClick={() => deleteSuggestion(s.id)}
                      className="text-[11px] text-red-400/60 hover:text-red-400 transition-colors"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default SettingsSection;
