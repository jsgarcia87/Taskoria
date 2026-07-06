import React, { useEffect, useState } from 'react';
import { Hammer, Loader, Lock, Clock, CheckCircle2, AlertTriangle, Send } from 'lucide-react';

/**
 * StudioAccessGate
 * Wraps CreationStudio: only renders children when the current user has
 * studio_access === 'approved'. Otherwise it shows the request flow:
 *   - 'none'     → "Request access" button
 *   - 'pending'  → "Your request is under review"
 *   - 'rejected' → show reason + "Request again" button
 *   - admin      → bypass (always approved)
 */
const StudioAccessGate = ({ currentUser, children }) => {
    const [status, setStatus] = useState(null);     // 'none'|'pending'|'approved'|'rejected'
    const [reason, setReason] = useState(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');

    const isAdmin = !!(currentUser?.is_admin);

    const load = async () => {
        if (isAdmin) { setStatus('approved'); setLoading(false); return; }
        setLoading(true);
        try {
            const res = await fetch('api/admin.php?action=my_studio_status', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ user_id: currentUser.id }),
            });
            const data = await res.json();
            if (data.success) {
                setStatus(data.status || 'none');
                setReason(data.reject_reason || null);
            } else {
                setStatus('none');
            }
        } catch (e) {
            setError('Could not load your access status.');
            setStatus('none');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { load(); }, [currentUser?.id]); // eslint-disable-line react-hooks/exhaustive-deps

    const requestAccess = async () => {
        setSubmitting(true);
        setError('');
        try {
            const res = await fetch('api/admin.php?action=request_studio_access', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ user_id: currentUser.id }),
            });
            const data = await res.json();
            if (data.success) setStatus(data.status || 'pending');
            else setError(data.error || 'Failed to send request.');
        } catch (e) {
            setError('Network error. Try again.');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20 text-rpg-gold">
                <Loader className="animate-spin" size={28} />
            </div>
        );
    }

    if (status === 'approved') return children;

    // Gate UI for not-yet-approved users
    return (
        <div className="max-w-2xl mx-auto px-4 py-12">
            <div className="glass-card border border-white/10 rounded-2xl p-8 text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-rpg-gold/10 border border-rpg-gold/30 flex items-center justify-center text-rpg-gold">
                    {status === 'pending' ? <Clock size={28}/> :
                     status === 'rejected' ? <AlertTriangle size={28}/> :
                     <Lock size={28}/>}
                </div>
                <h2 className="text-2xl font-heading text-white mb-2 flex items-center justify-center gap-2">
                    <Hammer size={20} className="text-rpg-gold"/> Pixel Studio
                </h2>

                {status === 'none' && (
                    <>
                        <p className="text-gray-300 leading-relaxed mb-6">
                            The Pixel Studio is invitation-only. Request access and an administrator will review your application.
                            Approved creators can design houses, castles, mounts, trees and props that live on the Taskoria map.
                        </p>
                        <button
                            onClick={requestAccess}
                            disabled={submitting}
                            className="inline-flex items-center gap-2 bg-rpg-gold text-rpg-panel hover:brightness-110 px-6 py-3 rounded-xl uppercase tracking-widest text-sm font-heading font-bold transition-all shadow-lg disabled:opacity-50"
                        >
                            {submitting ? <Loader className="animate-spin" size={16}/> : <Send size={16}/>}
                            Request access
                        </button>
                    </>
                )}

                {status === 'pending' && (
                    <>
                        <p className="text-gray-300 leading-relaxed mb-2">
                            Your request is <strong className="text-rpg-gold">under review</strong>.
                        </p>
                        <p className="text-sm text-gray-500">You'll get access here as soon as an administrator approves it.</p>
                        <div className="mt-6 inline-flex items-center gap-2 text-[11px] uppercase tracking-widest bg-amber-500/10 border border-amber-500/30 text-amber-400 px-3 py-1.5 rounded-full">
                            <Clock size={12}/> Pending review
                        </div>
                    </>
                )}

                {status === 'rejected' && (
                    <>
                        <p className="text-gray-300 leading-relaxed mb-3">
                            Your previous request was not approved.
                        </p>
                        {reason && (
                            <div className="bg-red-500/10 border border-red-500/30 text-red-300 text-sm rounded-lg p-3 text-left mb-4">
                                <div className="text-[10px] uppercase tracking-widest text-red-400 font-bold mb-1">Reason</div>
                                {reason}
                            </div>
                        )}
                        <button
                            onClick={requestAccess}
                            disabled={submitting}
                            className="inline-flex items-center gap-2 bg-rpg-gold text-rpg-panel hover:brightness-110 px-6 py-3 rounded-xl uppercase tracking-widest text-sm font-heading font-bold transition-all shadow-lg disabled:opacity-50"
                        >
                            {submitting ? <Loader className="animate-spin" size={16}/> : <Send size={16}/>}
                            Request again
                        </button>
                    </>
                )}

                {error && (
                    <div className="mt-4 text-xs text-red-400">{error}</div>
                )}
            </div>
        </div>
    );
};

export default StudioAccessGate;
