import React, { useState, useEffect, useCallback } from 'react';

const API_BASE = './api';

const PRIORITY_COLORS = {
  urgent: 'bg-red-500/15 text-red-400',
  high: 'bg-orange-500/15 text-orange-400',
  normal: 'bg-blue-500/15 text-blue-400',
  low: 'bg-neutral-500/15 text-neutral-400',
};

const STATUS_COLORS = {
  open: 'bg-emerald-500/15 text-emerald-400',
  in_progress: 'bg-yellow-500/15 text-yellow-400',
  resolved: 'bg-blue-500/15 text-blue-400',
  closed: 'bg-neutral-500/15 text-neutral-400',
};

const STATUS_LABELS = {
  open: 'Open',
  in_progress: 'In Progress',
  resolved: 'Resolved',
  closed: 'Closed',
};

const CATEGORY_LABELS = {
  bug: 'Bug',
  feature: 'Feature',
  account: 'Account',
  other: 'Other',
};

const TicketsSection = ({ adminFetch }) => {
  const [tickets, setTickets] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [selected, setSelected] = useState(null);
  const [reply, setReply] = useState('');
  const [replyStatus, setReplyStatus] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchTickets = useCallback(async () => {
    try {
      const data = await adminFetch('list', {}, 'tickets');
      setTickets(data.tickets || []);
    } catch { setTickets([]); }
  }, [adminFetch]);

  const fetchStats = useCallback(async () => {
    try {
      const data = await adminFetch('stats', {}, 'tickets');
      setStats(data);
    } catch { setStats(null); }
  }, [adminFetch]);

  useEffect(() => {
    Promise.all([fetchTickets(), fetchStats()]).finally(() => setLoading(false));
  }, [fetchTickets, fetchStats]);

  const handleReply = async () => {
    if (!reply.trim() || !selected) return;
    setSubmitting(true);
    try {
      await adminFetch('reply', {
        ticket_id: selected.id,
        reply: reply.trim(),
        ...(replyStatus ? { status: replyStatus } : {}),
      }, 'tickets');
      setReply('');
      setReplyStatus('');
      setSelected(null);
      await Promise.all([fetchTickets(), fetchStats()]);
    } catch { /* handled */ }
    setSubmitting(false);
  };

  const handleStatusChange = async (ticketId, status) => {
    try {
      await adminFetch('update_status', { ticket_id: ticketId, status }, 'tickets');
      await Promise.all([fetchTickets(), fetchStats()]);
    } catch { /* handled */ }
  };

  const handleDelete = async (ticketId) => {
    try {
      await adminFetch('delete', { ticket_id: ticketId }, 'tickets');
      if (selected?.id === ticketId) setSelected(null);
      await Promise.all([fetchTickets(), fetchStats()]);
    } catch { /* handled */ }
  };

  const filtered = filter === 'all' ? tickets : tickets.filter(t => t.status === filter);

  const statCounts = {};
  if (stats?.by_status) stats.by_status.forEach(s => { statCounts[s.status] = parseInt(s.count); });
  const totalOpen = (statCounts.open || 0) + (statCounts.in_progress || 0);

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-sm text-neutral-400 py-12 justify-center">
        <div className="w-4 h-4 border-2 border-purple-500/30 border-t-purple-500 rounded-full animate-spin" />
        Loading tickets...
      </div>
    );
  }

  return (
    <div className="max-w-5xl space-y-5">
      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Open', count: statCounts.open || 0, color: 'text-emerald-400' },
          { label: 'In Progress', count: statCounts.in_progress || 0, color: 'text-yellow-400' },
          { label: 'Resolved', count: statCounts.resolved || 0, color: 'text-blue-400' },
          { label: 'Closed', count: statCounts.closed || 0, color: 'text-neutral-400' },
        ].map(s => (
          <div key={s.label} className="rounded-xl p-4 border border-white/[0.04]" style={{ background: 'var(--admin-card)' }}>
            <div className={`text-2xl font-bold font-['VT323'] ${s.color}`}>{s.count}</div>
            <div className="text-[11px] text-neutral-500 mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1 text-xs">
        {['all', 'open', 'in_progress', 'resolved', 'closed'].map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-lg transition-colors ${
              filter === f
                ? 'bg-purple-500/15 text-purple-400'
                : 'text-neutral-500 hover:text-neutral-300 hover:bg-white/[0.03]'
            }`}
          >
            {f === 'all' ? `All (${tickets.length})` : `${STATUS_LABELS[f]} (${statCounts[f] || 0})`}
          </button>
        ))}
      </div>

      {/* Ticket list + detail split */}
      <div className="flex gap-4">
        {/* List */}
        <div className={`space-y-2 ${selected ? 'w-1/2' : 'w-full'} transition-all`}>
          {filtered.length === 0 ? (
            <div className="rounded-xl border border-dashed border-white/[0.08] p-10 text-center" style={{ background: 'var(--admin-card)' }}>
              <div className="text-sm text-neutral-500">
                {tickets.length === 0 ? 'No tickets yet' : 'No tickets match this filter'}
              </div>
            </div>
          ) : (
            filtered.map(t => (
              <button
                key={t.id}
                onClick={() => { setSelected(t); setReply(''); setReplyStatus(''); }}
                className={`w-full text-left rounded-xl p-4 border transition-colors ${
                  selected?.id === t.id
                    ? 'border-purple-500/30 bg-purple-500/[0.06]'
                    : 'border-white/[0.04] hover:border-white/[0.08]'
                }`}
                style={selected?.id !== t.id ? { background: 'var(--admin-card)' } : {}}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium text-neutral-200 truncate">{t.subject}</div>
                    <div className="text-[11px] text-neutral-500 mt-1 flex items-center gap-2 flex-wrap">
                      <span>{t.username}</span>
                      <span>#{t.id}</span>
                      <span>{new Date(t.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className={`text-[10px] px-2 py-0.5 rounded-full ${PRIORITY_COLORS[t.priority]}`}>
                      {t.priority}
                    </span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full ${STATUS_COLORS[t.status]}`}>
                      {STATUS_LABELS[t.status]}
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-neutral-700/30 text-neutral-400">
                      {CATEGORY_LABELS[t.category]}
                    </span>
                  </div>
                </div>
                {!selected && (
                  <div className="text-xs text-neutral-500 mt-2 line-clamp-2">{t.message}</div>
                )}
              </button>
            ))
          )}
        </div>

        {/* Detail panel */}
        {selected && (
          <div className="w-1/2 rounded-xl border border-white/[0.06] p-5 space-y-4 sticky top-4 self-start" style={{ background: 'var(--admin-card)' }}>
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-sm font-semibold text-neutral-200">{selected.subject}</h3>
                <div className="text-[11px] text-neutral-500 mt-1">
                  {selected.username} · #{selected.id} · {new Date(selected.created_at).toLocaleString()}
                </div>
              </div>
              <button
                onClick={() => setSelected(null)}
                className="text-neutral-500 hover:text-neutral-300 text-lg leading-none"
              >
                &times;
              </button>
            </div>

            <div className="flex gap-1.5">
              <span className={`text-[10px] px-2 py-0.5 rounded-full ${PRIORITY_COLORS[selected.priority]}`}>
                {selected.priority}
              </span>
              <span className={`text-[10px] px-2 py-0.5 rounded-full ${STATUS_COLORS[selected.status]}`}>
                {STATUS_LABELS[selected.status]}
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-neutral-700/30 text-neutral-400">
                {CATEGORY_LABELS[selected.category]}
              </span>
            </div>

            <div className="text-xs text-neutral-300 leading-relaxed whitespace-pre-wrap bg-black/20 rounded-lg p-3 max-h-48 overflow-y-auto">
              {selected.message}
            </div>

            {selected.admin_reply && (
              <div className="border-l-2 border-purple-500/40 pl-3 space-y-1">
                <div className="text-[10px] text-purple-400/70">
                  Admin reply · {selected.replied_at ? new Date(selected.replied_at).toLocaleString() : ''}
                </div>
                <div className="text-xs text-neutral-300 leading-relaxed whitespace-pre-wrap">
                  {selected.admin_reply}
                </div>
              </div>
            )}

            {/* Quick status buttons */}
            <div className="flex gap-1.5">
              {['open', 'in_progress', 'resolved', 'closed'].map(s => (
                <button
                  key={s}
                  disabled={selected.status === s}
                  onClick={() => handleStatusChange(selected.id, s)}
                  className={`text-[10px] px-2.5 py-1 rounded-lg transition-colors ${
                    selected.status === s
                      ? 'bg-purple-500/20 text-purple-400'
                      : 'text-neutral-500 hover:text-neutral-300 bg-white/[0.03] hover:bg-white/[0.06]'
                  }`}
                >
                  {STATUS_LABELS[s]}
                </button>
              ))}
            </div>

            {/* Reply form */}
            <div className="space-y-2">
              <textarea
                value={reply}
                onChange={e => setReply(e.target.value)}
                placeholder="Write a reply..."
                rows={3}
                className="w-full bg-black/20 border border-white/[0.06] rounded-lg px-3 py-2 text-xs text-neutral-200 placeholder:text-neutral-600 focus:outline-none focus:border-purple-500/40 resize-none"
              />
              <div className="flex items-center gap-2">
                <select
                  value={replyStatus}
                  onChange={e => setReplyStatus(e.target.value)}
                  className="bg-black/20 border border-white/[0.06] rounded-lg px-2 py-1.5 text-[11px] text-neutral-400 focus:outline-none focus:border-purple-500/40"
                >
                  <option value="">No status change</option>
                  <option value="in_progress">Mark In Progress</option>
                  <option value="resolved">Mark Resolved</option>
                  <option value="closed">Mark Closed</option>
                </select>
                <button
                  onClick={handleReply}
                  disabled={!reply.trim() || submitting}
                  className="ml-auto px-4 py-1.5 text-xs font-medium rounded-lg bg-purple-600 text-white hover:bg-purple-500 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  {submitting ? 'Sending...' : 'Reply'}
                </button>
              </div>
            </div>

            {/* Delete */}
            <button
              onClick={() => handleDelete(selected.id)}
              className="text-[10px] text-red-400/50 hover:text-red-400 transition-colors"
            >
              Delete ticket
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default TicketsSection;
