import React, { useState, useEffect } from 'react';

const StatCard = ({ label, value, subtext, accent }) => (
  <div className="rounded-xl border border-white/[0.04] p-4" style={{ background: 'var(--admin-card)' }}>
    <p className="text-[11px] font-semibold uppercase tracking-wider text-neutral-500 mb-2">{label}</p>
    <p className={`text-2xl font-['VT323'] ${accent || 'text-white'}`}>{value}</p>
    {subtext && <p className="text-[11px] text-neutral-500 mt-1">{subtext}</p>}
  </div>
);

const MiniTable = ({ title, emptyText, children, count }) => (
  <div className="rounded-xl border border-white/[0.04] p-4 space-y-3" style={{ background: 'var(--admin-card)' }}>
    <div className="flex items-center justify-between">
      <h3 className="text-xs font-semibold text-neutral-300">{title}</h3>
      {count != null && (
        <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-400">{count}</span>
      )}
    </div>
    {children || (
      <p className="text-[11px] text-neutral-600 py-4 text-center">{emptyText || 'No data'}</p>
    )}
  </div>
);

const DashboardHome = ({ adminFetch }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const results = {};
      const safe = async (fn) => { try { return await fn(); } catch { return null; } };

      const [users, ticketStats, posts, studioReqs, waitlist, suggestions] = await Promise.all([
        safe(() => adminFetch('list_users')),
        safe(() => adminFetch('stats', {}, 'tickets')),
        safe(() => adminFetch('list_posts', {}, 'cms')),
        safe(() => adminFetch('list_studio_requests')),
        safe(() => adminFetch('list_waitlist')),
        safe(() => adminFetch('list_suggestions')),
      ]);

      if (cancelled) return;

      const userList = users?.users || [];
      results.totalUsers = userList.length;
      results.admins = userList.filter(u => u.is_admin).length;
      results.recentSignups = userList.filter(u => {
        if (!u.created_at) return false;
        return Date.now() - new Date(u.created_at).getTime() < 7 * 24 * 60 * 60 * 1000;
      }).length;
      results.recentUsers = userList.slice(-5).reverse();

      const ticketCounts = {};
      if (ticketStats?.by_status) ticketStats.by_status.forEach(s => { ticketCounts[s.status] = parseInt(s.count); });
      results.openTickets = (ticketCounts.open || 0) + (ticketCounts.in_progress || 0);
      results.totalTickets = Object.values(ticketCounts).reduce((a, b) => a + b, 0);

      const postList = posts?.posts || [];
      results.publishedPosts = postList.filter(p => p.status === 'published').length;
      results.draftPosts = postList.filter(p => p.status === 'draft').length;
      results.recentPosts = postList.slice(0, 5);

      const reqs = studioReqs?.requests || [];
      results.pendingStudio = reqs.filter(r => r.status === 'pending' || r.status === 'requested').length;
      results.recentStudioReqs = reqs.filter(r => r.status === 'pending' || r.status === 'requested').slice(0, 5);

      results.waitlistCount = (waitlist?.waitlist || []).length;

      const suggList = suggestions?.suggestions || [];
      results.unreadSuggestions = suggList.filter(s => s.status !== 'read').length;
      results.recentSuggestions = suggList.slice(0, 5);

      setData(results);
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [adminFetch]);

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-sm text-neutral-400 py-12 justify-center">
        <div className="w-4 h-4 border-2 border-purple-500/30 border-t-purple-500 rounded-full animate-spin" />
        Loading dashboard...
      </div>
    );
  }

  return (
    <div className="space-y-5 max-w-6xl">
      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label="Total Users" value={data?.totalUsers ?? '—'} accent="text-purple-400" />
        <StatCard label="Admins" value={data?.admins ?? '—'} accent="text-amber-400" />
        <StatCard label="This Week" value={data?.recentSignups ?? '—'} subtext="new signups" accent="text-emerald-400" />
        <StatCard
          label="Open Tickets"
          value={data?.openTickets ?? '—'}
          subtext={data?.totalTickets ? `of ${data.totalTickets} total` : undefined}
          accent={data?.openTickets > 0 ? 'text-red-400' : 'text-emerald-400'}
        />
      </div>

      {/* Second stats row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label="Waitlist" value={data?.waitlistCount ?? '—'} accent="text-blue-400" />
        <StatCard label="Suggestions" value={data?.unreadSuggestions ?? '—'} subtext="unread" accent="text-orange-400" />
        <StatCard
          label="Blog"
          value={data?.publishedPosts ?? '—'}
          subtext={data?.draftPosts ? `+ ${data.draftPosts} drafts` : undefined}
          accent="text-cyan-400"
        />
        <StatCard label="Studio Queue" value={data?.pendingStudio ?? '—'} subtext="pending requests" accent="text-yellow-400" />
      </div>

      {/* Tables */}
      <div className="grid md:grid-cols-2 gap-4">
        {/* Recent users */}
        <MiniTable title="Recent Signups" count={data?.recentSignups} emptyText="No recent signups">
          {data?.recentUsers?.length > 0 && (
            <div className="space-y-1.5">
              {data.recentUsers.map(u => (
                <div key={u.id} className="flex items-center justify-between text-[11px] py-1 px-2 rounded-lg bg-white/[0.02]">
                  <div className="flex items-center gap-2">
                    <span className="text-neutral-300">{u.username}</span>
                    {u.is_admin ? <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-400">admin</span> : null}
                  </div>
                  <span className="text-neutral-600">{u.created_at ? new Date(u.created_at).toLocaleDateString() : '—'}</span>
                </div>
              ))}
            </div>
          )}
        </MiniTable>

        {/* Recent suggestions */}
        <MiniTable title="User Feedback" count={data?.unreadSuggestions} emptyText="No suggestions yet">
          {data?.recentSuggestions?.length > 0 && (
            <div className="space-y-1.5">
              {data.recentSuggestions.map(s => (
                <div key={s.id} className="text-[11px] py-1.5 px-2 rounded-lg bg-white/[0.02] flex items-start gap-2">
                  <span className={`mt-0.5 w-1.5 h-1.5 rounded-full shrink-0 ${s.status === 'read' ? 'bg-neutral-600' : 'bg-orange-400'}`} />
                  <div className="min-w-0">
                    <span className="text-neutral-400">{s.username}: </span>
                    <span className="text-neutral-300 line-clamp-2">{s.message}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </MiniTable>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        {/* Recent posts */}
        <MiniTable title="Blog Posts" count={data?.publishedPosts} emptyText="No posts yet">
          {data?.recentPosts?.length > 0 && (
            <div className="space-y-1.5">
              {data.recentPosts.map(p => (
                <div key={p.id} className="flex items-center justify-between text-[11px] py-1 px-2 rounded-lg bg-white/[0.02]">
                  <span className="text-neutral-300 truncate mr-2">{p.title}</span>
                  <span className={`text-[9px] px-1.5 py-0.5 rounded shrink-0 ${
                    p.status === 'published' ? 'bg-emerald-500/15 text-emerald-400' : 'bg-neutral-700/30 text-neutral-400'
                  }`}>{p.status}</span>
                </div>
              ))}
            </div>
          )}
        </MiniTable>

        {/* Studio requests */}
        <MiniTable title="Studio Queue" count={data?.pendingStudio} emptyText="No pending requests">
          {data?.recentStudioReqs?.length > 0 && (
            <div className="space-y-1.5">
              {data.recentStudioReqs.map(r => (
                <div key={r.id} className="flex items-center justify-between text-[11px] py-1 px-2 rounded-lg bg-white/[0.02]">
                  <span className="text-neutral-300">{r.username}</span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-yellow-500/15 text-yellow-400">pending</span>
                </div>
              ))}
            </div>
          )}
        </MiniTable>

        {/* Waitlist */}
        <MiniTable title="Waitlist" count={data?.waitlistCount} emptyText="Waitlist empty">
          {data?.waitlistCount > 0 && (
            <p className="text-[11px] text-neutral-400 text-center py-2">
              {data.waitlistCount} {data.waitlistCount === 1 ? 'person' : 'people'} waiting for access
            </p>
          )}
        </MiniTable>
      </div>
    </div>
  );
};

export default DashboardHome;
