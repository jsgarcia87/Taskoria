import React, { useEffect, useState } from 'react';
import { Loader, Check, X, Hammer, RotateCcw } from 'lucide-react';

const STATUS_STYLES = {
    pending: 'bg-amber-500/10 border-amber-500/30 text-amber-400',
    approved: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400',
    rejected: 'bg-red-500/10 border-red-500/30 text-red-400',
};

const StudioAccessRequests = ({ currentUser }) => {
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [working, setWorking] = useState({});
    const [filter, setFilter] = useState('pending'); // pending | all

    const load = async () => {
        setLoading(true);
        try {
            const res = await fetch('api/admin.php?action=list_studio_requests', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ admin_id: currentUser.id }),
            });
            const data = await res.json();
            if (data.success) setRequests(data.requests || []);
            else setRequests([]);
        } catch (e) {
            setRequests([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { load(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

    const moderate = async (target_id, decision) => {
        let reason = null;
        if (decision === 'rejected') {
            reason = prompt('Reason for rejection (optional, shown to the user):') || '';
        }
        setWorking(w => ({ ...w, [target_id]: true }));
        try {
            const res = await fetch('api/admin.php?action=moderate_studio_request', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ admin_id: currentUser.id, target_id, decision, reason }),
            });
            const data = await res.json();
            if (data.success) {
                setRequests(prev => prev.map(r => r.id === target_id ? { ...r, status: decision, studio_reject_reason: decision === 'rejected' ? reason : null } : r));
            }
        } finally {
            setWorking(w => { const n = { ...w }; delete n[target_id]; return n; });
        }
    };

    const visible = filter === 'pending'
        ? requests.filter(r => r.status === 'pending')
        : requests;

    const counts = {
        pending: requests.filter(r => r.status === 'pending').length,
        approved: requests.filter(r => r.status === 'approved').length,
        rejected: requests.filter(r => r.status === 'rejected').length,
    };

    return (
        <div className="glass-card p-0 overflow-hidden border border-white/10 rounded-2xl flex flex-col">
            <div className="p-4 border-b border-white/10 bg-black/40 flex items-center justify-between flex-wrap gap-2">
                <div>
                    <h3 className="text-xl font-bold text-rpg-gold flex items-center gap-2"><Hammer size={18}/> Pixel Studio · Access Requests</h3>
                    <p className="text-xs text-gray-400">Approve users who can create world props.</p>
                </div>
                <div className="flex gap-1.5 items-center text-[10px] uppercase tracking-widest">
                    <button
                        onClick={() => setFilter('pending')}
                        className={`px-2 py-1 rounded border font-bold ${filter === 'pending' ? 'bg-amber-500/20 border-amber-500/40 text-amber-300' : 'bg-white/5 border-white/10 text-gray-400 hover:text-white'}`}
                    >{counts.pending} pending</button>
                    <button
                        onClick={() => setFilter('all')}
                        className={`px-2 py-1 rounded border font-bold ${filter === 'all' ? 'bg-white/15 border-white/30 text-white' : 'bg-white/5 border-white/10 text-gray-400 hover:text-white'}`}
                    >All ({requests.length})</button>
                </div>
            </div>

            <div className="p-4">
                {loading ? (
                    <div className="flex items-center justify-center py-10 text-rpg-gold"><Loader className="animate-spin" size={24}/></div>
                ) : visible.length === 0 ? (
                    <div className="text-center text-gray-500 italic py-10">
                        {filter === 'pending' ? 'No pending requests.' : 'No requests yet.'}
                    </div>
                ) : (
                    <div className="space-y-2">
                        {visible.map(r => {
                            const status = r.status || 'pending';
                            return (
                                <div key={r.id} className="bg-black/40 border border-white/10 rounded-xl p-3 flex items-center justify-between gap-3 flex-wrap">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                            <span className="font-bold text-white truncate">{r.username}</span>
                                            <span className={`text-[10px] uppercase tracking-widest font-bold px-2 py-0.5 rounded border ${STATUS_STYLES[status]}`}>{status}</span>
                                        </div>
                                        <div className="text-[10px] text-gray-500 mt-0.5">
                                            Requested {r.studio_requested_at ? new Date(r.studio_requested_at).toLocaleString() : '—'}
                                        </div>
                                        {status === 'rejected' && r.studio_reject_reason && (
                                            <div className="mt-1 text-xs text-red-300 italic">Reason: {r.studio_reject_reason}</div>
                                        )}
                                    </div>
                                    <div className="flex gap-1.5">
                                        {status !== 'approved' && (
                                            <button
                                                disabled={!!working[r.id]}
                                                onClick={() => moderate(r.id, 'approved')}
                                                className="flex items-center gap-1 text-[10px] uppercase tracking-widest font-bold bg-green-500/20 hover:bg-green-500/30 border border-green-500/40 text-green-400 px-2 py-1 rounded disabled:opacity-50"
                                            ><Check size={10}/> Approve</button>
                                        )}
                                        {status !== 'rejected' && (
                                            <button
                                                disabled={!!working[r.id]}
                                                onClick={() => moderate(r.id, 'rejected')}
                                                className="flex items-center gap-1 text-[10px] uppercase tracking-widest font-bold bg-red-500/20 hover:bg-red-500/30 border border-red-500/40 text-red-400 px-2 py-1 rounded disabled:opacity-50"
                                            ><X size={10}/> Reject</button>
                                        )}
                                        {status === 'approved' && (
                                            <button
                                                disabled={!!working[r.id]}
                                                onClick={() => moderate(r.id, 'none')}
                                                className="flex items-center gap-1 text-[10px] uppercase tracking-widest font-bold bg-white/5 hover:bg-white/10 border border-white/20 text-gray-300 px-2 py-1 rounded disabled:opacity-50"
                                            ><RotateCcw size={10}/> Revoke</button>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
};

export default StudioAccessRequests;
