import React, { useState, useEffect } from 'react';
import { Trash2, UserPlus, Shield, ShieldOff, Search, Loader, Users as UsersIcon, Settings as SettingsIcon, Hammer, Palette, Lightbulb, Check, Library, FileText, Eye, Clock, Mail, Save, Send, ChevronDown, ChevronUp, BarChart3, Swords } from 'lucide-react';
import PixelIcon from '../common/PixelIcon';
import AdminWorldTools from './AdminWorldTools';
import AssetManager from './AssetManager';
import CmsManager from '../admin/CmsManager';
import GameMasterPanel from './GameMasterPanel';
import { useToast } from '../common/Toast';
import Modal from '../common/Modal';
import { useConfirm } from '../../context/ConfirmContext';

const AdminPanel = ({ currentUser }) => {
    const toast = useToast();
    const confirm = useConfirm();
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    // Sub-menu sections to declutter the panel
    const [activeSection, setActiveSection] = useState('overview');

    // Create User Form State
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [newUsername, setNewUsername] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [newIsAdmin, setNewIsAdmin] = useState(false);
    const [createError, setCreateError] = useState('');
    const [isCreating, setIsCreating] = useState(false);

    // Settings & Waitlist
    const [allowRegistration, setAllowRegistration] = useState(false);
    const [waitlist, setWaitlist] = useState([]);
    const [loadingWaitlist, setLoadingWaitlist] = useState(true);

    // Suggestion Box
    const [suggestions, setSuggestions] = useState([]);
    const [loadingSuggestions, setLoadingSuggestions] = useState(true);

    // Email Templates
    const [emailTemplates, setEmailTemplates] = useState([]);
    const [loadingEmails, setLoadingEmails] = useState(false);
    const [editingTemplate, setEditingTemplate] = useState(null);
    const [savingTemplate, setSavingTemplate] = useState(false);
    const [testEmailTo, setTestEmailTo] = useState('');

    const fetchSettings = async () => {
        try {
            const res = await fetch(`api/admin.php?action=get_settings`, { method: 'POST', body: JSON.stringify({ admin_id: currentUser.id }) });
            const data = await res.json();
            if (data.success) setAllowRegistration(data.allow_registration);
        } catch (e) { console.error("Error fetching settings"); }
    };

    const fetchWaitlist = async () => {
        setLoadingWaitlist(true);
        try {
            const res = await fetch(`api/admin.php?action=list_waitlist`, { method: 'POST', body: JSON.stringify({ admin_id: currentUser.id }) });
            const data = await res.json();
            if (data.success) setWaitlist(data.waitlist || []);
        } catch (e) { console.error("Error fetching waitlist"); }
        finally { setLoadingWaitlist(false); }
    };

    const fetchSuggestions = async () => {
        setLoadingSuggestions(true);
        try {
            const res = await fetch(`api/admin.php?action=list_suggestions`, { method: 'POST', body: JSON.stringify({ admin_id: currentUser.id }) });
            const data = await res.json();
            if (data.success) setSuggestions(data.suggestions || []);
        } catch (e) { console.error("Error fetching suggestions"); }
        finally { setLoadingSuggestions(false); }
    };

    const fetchEmailTemplates = async () => {
        setLoadingEmails(true);
        try {
            const res = await fetch(`api/email_templates.php?action=list`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ admin_id: currentUser.id })
            });
            const data = await res.json();
            if (data.success) setEmailTemplates(data.templates || []);
        } catch (e) { console.error("Error fetching email templates"); }
        finally { setLoadingEmails(false); }
    };

    const loadTemplate = async (slug) => {
        try {
            const res = await fetch(`api/email_templates.php?action=get`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ admin_id: currentUser.id, slug })
            });
            const data = await res.json();
            if (data.success) setEditingTemplate(data.template);
        } catch (e) { toast.error('Failed to load template'); }
    };

    const saveTemplate = async () => {
        if (!editingTemplate) return;
        setSavingTemplate(true);
        try {
            const res = await fetch(`api/email_templates.php?action=save`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    admin_id: currentUser.id,
                    slug: editingTemplate.slug,
                    name: editingTemplate.name,
                    subject: editingTemplate.subject,
                    body_html: editingTemplate.body_html,
                    variables: editingTemplate.variables || ''
                })
            });
            const data = await res.json();
            if (data.success) {
                toast.success('Template saved');
                fetchEmailTemplates();
            } else toast.error(data.error || 'Save failed');
        } catch (e) { toast.error('Failed to save template'); }
        finally { setSavingTemplate(false); }
    };

    const sendTestEmail = async () => {
        if (!editingTemplate || !testEmailTo) return;
        try {
            const res = await fetch(`api/email_templates.php?action=test_send`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ admin_id: currentUser.id, slug: editingTemplate.slug, to: testEmailTo })
            });
            const data = await res.json();
            if (data.success) toast.success('Test email sent to ' + testEmailTo);
            else toast.error(data.error || 'Failed to send');
        } catch (e) { toast.error('Failed to send test email'); }
    };

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const res = await fetch(`api/admin.php?action=list_users`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ admin_id: currentUser.id })
            });
            const data = await res.json();
            if (data.success) {
                setUsers(data.users || []);
            } else {
                // Server-side role check is the source of truth; no client-side
                // self-promotion (that path was a privilege-escalation hole).
                console.error(data.error);
            }
        } catch (e) {
            console.error("Failed to fetch users", e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
        fetchSettings();
        fetchWaitlist();
        fetchSuggestions();
    }, []);

    useEffect(() => {
        if (activeSection === 'emails' && emailTemplates.length === 0) fetchEmailTemplates();
    }, [activeSection]);

    const toggleRegistration = async () => {
        const confirmMsg = allowRegistration
            ? "Are you sure you want to CLOSE public registration? New visitors won't be able to sign up."
            : "Are you sure you want to OPEN public registration? Anyone will be able to create an account.";

        if (!await confirm({ title: allowRegistration ? 'Close Registration?' : 'Open Registration?', message: confirmMsg, variant: 'warning', confirmText: allowRegistration ? 'Close' : 'Open' })) return;

        const newStatus = !allowRegistration;
        try {
            const res = await fetch(`api/admin.php?action=toggle_registration`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ admin_id: currentUser.id, allow_registration: newStatus })
            });
            const data = await res.json();
            if (data.success) setAllowRegistration(newStatus);
        } catch (e) {
            toast.error("Error toggling registration");
        }
    };

    const handleDeleteWaitlist = async (id, email) => {
        if (!await confirm({ title: 'Remove from Waitlist?', message: `${email} will be permanently removed.`, variant: 'danger', confirmText: 'Remove' })) return;
        try {
            const res = await fetch(`api/admin.php?action=delete_waitlist`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ admin_id: currentUser.id, target_id: id })
            });
            const data = await res.json();
            if (data.success) setWaitlist(waitlist.filter(w => w.id !== id));
        } catch (e) {
            toast.error("Error deleting from waitlist");
        }
    };

    const handleMarkSuggestionRead = async (id) => {
        try {
            const res = await fetch(`api/admin.php?action=mark_suggestion_read`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ admin_id: currentUser.id, target_id: id })
            });
            const data = await res.json();
            if (data.success) setSuggestions(suggestions.map(s => s.id === id ? { ...s, status: 'read' } : s));
        } catch (e) {
            toast.error("Error updating suggestion");
        }
    };

    const handleDeleteSuggestion = async (id) => {
        if (!await confirm({ title: 'Delete Suggestion?', message: 'This suggestion will be permanently removed.', variant: 'danger', confirmText: 'Delete' })) return;
        try {
            const res = await fetch(`api/admin.php?action=delete_suggestion`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ admin_id: currentUser.id, target_id: id })
            });
            const data = await res.json();
            if (data.success) setSuggestions(suggestions.filter(s => s.id !== id));
        } catch (e) {
            toast.error("Error deleting suggestion");
        }
    };

    const handleDeleteUser = async (targetId, username) => {
        if (!await confirm({ title: 'Delete User?', message: `User '${username}' and all their saved data will be permanently destroyed.`, variant: 'danger', confirmText: 'Delete Forever' })) return;

        try {
            const res = await fetch(`api/admin.php?action=delete_user`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    admin_id: currentUser.id,
                    target_id: targetId
                })
            });
            const data = await res.json();
            if (data.success) {
                setUsers(users.filter(u => u.id !== targetId));
            } else {
                toast.error(data.error || "Failed to delete user");
            }
        } catch (e) {
            toast.error("Network error deleting user");
        }
    };

    const handleCreateUser = async (e) => {
        e.preventDefault();
        setCreateError('');
        setIsCreating(true);

        try {
            const res = await fetch(`api/admin.php?action=add_user`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    admin_id: currentUser.id,
                    username: newUsername,
                    password: newPassword,
                    is_admin: newIsAdmin
                })
            });
            const data = await res.json();
            if (data.success) {
                setShowCreateModal(false);
                setNewUsername('');
                setNewPassword('');
                setNewIsAdmin(false);
                fetchUsers(); // Refresh list
            } else {
                setCreateError(data.error || "Failed to create user");
            }
        } catch (e) {
            setCreateError("Network error creating user");
        } finally {
            setIsCreating(false);
        }
    };

    const filteredUsers = users.filter(u => u.username.toLowerCase().includes(searchQuery.toLowerCase()));

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header */}
            <div className="glass-card p-4 border border-white/10 rounded-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-48 h-48 bg-rpg-gold/5 blur-[60px] rounded-full pointer-events-none"></div>
                <div className="flex items-center gap-3 relative z-10">
                    <div className="w-10 h-10 rounded-xl bg-rpg-gold/10 border border-rpg-gold/30 flex items-center justify-center shrink-0">
                        <Shield className="text-rpg-gold" size={20} />
                    </div>
                    <div className="min-w-0">
                        <h2 className="text-lg font-heading font-black text-white tracking-wide">The Watchtower</h2>
                        <p className="text-[11px] text-gray-500 truncate">Overseeing {users.length} citizens across the realm</p>
                    </div>
                </div>
            </div>

            {/* Navigation — horizontal scroll strip */}
            <div className="-mx-4 px-4 overflow-x-auto scrollbar-hide">
                <div className="flex gap-2 pb-1 min-w-max">
                    {[
                        { id: 'overview',  label: 'Overview',  icon: Eye },
                        { id: 'users',     label: 'Citizens',  icon: UsersIcon },
                        { id: 'server',    label: 'Gates',     icon: SettingsIcon, badge: waitlist.length || 0 },
                        { id: 'feedback',  label: 'Whispers',  icon: Lightbulb,    badge: suggestions.filter(s => s.status === 'new').length },
                        { id: 'world',     label: 'World',     icon: Hammer },
                        { id: 'library',   label: 'Library',   icon: Library },
                        { id: 'emails',    label: 'Emails',    icon: Mail },
                        { id: 'cms',       label: 'Scrolls',   icon: FileText },
                        { id: 'bestiary',  label: 'Bestiary',  icon: Swords },
                    ].map(t => {
                        const Icon = t.icon;
                        const isActive = activeSection === t.id;
                        return (
                            <button
                                key={t.id}
                                onClick={() => setActiveSection(t.id)}
                                className={`relative flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-[11px] font-bold uppercase tracking-wider whitespace-nowrap transition-all ${
                                    isActive
                                        ? 'bg-rpg-gold/15 text-rpg-gold border border-rpg-gold/40'
                                        : 'text-gray-500 border border-transparent hover:text-white hover:bg-white/5'
                                }`}
                            >
                                <Icon size={13} /> {t.label}
                                {t.badge > 0 && (
                                    <span className="ml-1 min-w-[16px] h-4 px-1 rounded-full bg-rpg-gold/20 text-rpg-gold text-[9px] font-bold flex items-center justify-center">
                                        {t.badge}
                                    </span>
                                )}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* === SECTION: OVERVIEW (GM Dashboard) === */}
            {activeSection === 'overview' && (
                <div className="space-y-4 animate-in fade-in duration-300">
                    {/* Stat tiles */}
                    <div className="grid grid-cols-2 gap-3">
                        <div className="glass-card p-4 border border-white/10 rounded-xl">
                            <p className="text-[10px] text-gray-500 uppercase tracking-widest mb-1">Citizens</p>
                            <p className="text-2xl font-mono font-bold text-white">{loading ? '—' : users.length}</p>
                            <p className="text-[10px] text-gray-500 mt-1">{users.filter(u => u.is_admin).length} game masters</p>
                        </div>
                        <div className="glass-card p-4 border border-white/10 rounded-xl">
                            <p className="text-[10px] text-gray-500 uppercase tracking-widest mb-1">Whispers</p>
                            <p className="text-2xl font-mono font-bold text-rpg-gold">{loadingSuggestions ? '—' : suggestions.filter(s => s.status === 'new').length}</p>
                            <p className="text-[10px] text-gray-500 mt-1">{suggestions.length} total</p>
                        </div>
                        <div className="glass-card p-4 border border-white/10 rounded-xl">
                            <p className="text-[10px] text-gray-500 uppercase tracking-widest mb-1">At the gates</p>
                            <p className="text-2xl font-mono font-bold text-white">{loadingWaitlist ? '—' : waitlist.length}</p>
                            <p className="text-[10px] text-gray-500 mt-1">awaiting entry</p>
                        </div>
                        <div className="glass-card p-4 border border-white/10 rounded-xl">
                            <p className="text-[10px] text-gray-500 uppercase tracking-widest mb-1">Registration</p>
                            <p className={`text-lg font-bold ${allowRegistration ? 'text-green-400' : 'text-red-400'}`}>
                                {allowRegistration ? 'Open' : 'Closed'}
                            </p>
                            <button
                                onClick={toggleRegistration}
                                className="text-[10px] text-gray-400 hover:text-white underline underline-offset-2 mt-1"
                            >
                                {allowRegistration ? 'Close gates' : 'Open gates'}
                            </button>
                        </div>
                    </div>

                    {/* Mini analytics: citizen growth */}
                    {!loading && users.length > 0 && (() => {
                        const now = new Date();
                        const days = Array.from({ length: 14 }, (_, i) => {
                            const d = new Date(now);
                            d.setDate(d.getDate() - (13 - i));
                            return d.toISOString().slice(0, 10);
                        });
                        const counts = days.map(day => users.filter(u => u.created_at && u.created_at.startsWith(day)).length);
                        const max = Math.max(...counts, 1);
                        return (
                            <div className="glass-card border border-white/10 rounded-xl overflow-hidden">
                                <div className="px-4 py-3 border-b border-white/10 flex items-center gap-2">
                                    <BarChart3 size={14} className="text-rpg-gold" />
                                    <p className="text-xs font-bold text-white uppercase tracking-wider">New Citizens — Last 14 Days</p>
                                </div>
                                <div className="p-4">
                                    <div className="flex items-end gap-1 h-20">
                                        {counts.map((c, i) => (
                                            <div key={i} className="flex-1 flex flex-col items-center gap-1">
                                                <div
                                                    className="w-full rounded-sm transition-all duration-500"
                                                    style={{
                                                        height: `${Math.max((c / max) * 100, c > 0 ? 8 : 2)}%`,
                                                        background: c > 0 ? 'linear-gradient(180deg, #fedf8c 0%, #c9a84c 100%)' : 'rgba(255,255,255,0.05)',
                                                        minHeight: c > 0 ? '4px' : '2px'
                                                    }}
                                                    title={`${days[i]}: ${c} new`}
                                                />
                                            </div>
                                        ))}
                                    </div>
                                    <div className="flex justify-between mt-2">
                                        <span className="text-[9px] text-gray-600">{days[0].slice(5)}</span>
                                        <span className="text-[9px] text-gray-600">{days[6].slice(5)}</span>
                                        <span className="text-[9px] text-gray-600">{days[13].slice(5)}</span>
                                    </div>
                                    <p className="text-[10px] text-gray-500 mt-2 text-center">
                                        {counts.reduce((a, b) => a + b, 0)} new citizens in the last 2 weeks
                                    </p>
                                </div>
                            </div>
                        );
                    })()}

                    {/* Recent whispers (unread) */}
                    {suggestions.filter(s => s.status === 'new').length > 0 && (
                        <div className="glass-card border border-white/10 rounded-xl overflow-hidden">
                            <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between">
                                <p className="text-xs font-bold text-white uppercase tracking-wider">Unread whispers</p>
                                <button
                                    onClick={() => setActiveSection('feedback')}
                                    className="text-[10px] text-rpg-gold hover:text-yellow-300 uppercase tracking-wider"
                                >
                                    View all
                                </button>
                            </div>
                            <div className="divide-y divide-white/5">
                                {suggestions.filter(s => s.status === 'new').slice(0, 3).map(s => (
                                    <div key={s.id} className="px-4 py-3 flex items-start gap-3">
                                        <div className="w-6 h-6 rounded-full bg-rpg-gold/10 flex items-center justify-center shrink-0 mt-0.5">
                                            <Lightbulb size={12} className="text-rpg-gold" />
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-xs text-gray-400"><span className="text-white font-bold">{s.username}</span> · {new Date(s.created_at).toLocaleDateString()}</p>
                                            <p className="text-sm text-gray-300 truncate mt-0.5">{s.message}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Latest citizens */}
                    {users.length > 0 && (
                        <div className="glass-card border border-white/10 rounded-xl overflow-hidden">
                            <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between">
                                <p className="text-xs font-bold text-white uppercase tracking-wider">Latest citizens</p>
                                <button
                                    onClick={() => setActiveSection('users')}
                                    className="text-[10px] text-rpg-gold hover:text-yellow-300 uppercase tracking-wider"
                                >
                                    View all
                                </button>
                            </div>
                            <div className="divide-y divide-white/5">
                                {[...users].sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).slice(0, 4).map(u => (
                                    <div key={u.id} className="px-4 py-2.5 flex items-center gap-3">
                                        <div className="w-7 h-7 rounded-full bg-indigo-500/20 flex items-center justify-center border border-indigo-500/30 text-indigo-300 text-xs font-bold shrink-0">
                                            {u.username.charAt(0).toUpperCase()}
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <p className="text-sm text-white font-bold truncate">{u.username}</p>
                                        </div>
                                        {u.is_admin && (
                                            <Shield size={12} className="text-rpg-gold shrink-0" />
                                        )}
                                        <p className="text-[10px] text-gray-500 shrink-0">{new Date(u.created_at).toLocaleDateString()}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* === SECTION: USERS === */}
            {activeSection === 'users' && (
                <div className="space-y-6 animate-in fade-in duration-300">
                    {/* Toolbar (search + create + export) */}
                    <div className="flex flex-col sm:flex-row gap-4 justify-between items-center">
                        <div className="relative w-full sm:w-96">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                            <input
                                type="text"
                                placeholder="Search by username..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full bg-black/40 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white placeholder-gray-500 hover:border-rpg-gold/30 focus:border-rpg-gold focus:outline-none focus:ring-1 focus:ring-rpg-gold transition-all"
                            />
                        </div>
                        <div className="flex gap-4 w-full sm:w-auto">
                            <a
                                href="api/export_csv.php"
                                className="flex-1 sm:flex-none bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 border border-blue-500/50 px-6 py-3 rounded-xl font-bold uppercase tracking-widest text-sm flex items-center justify-center gap-2 transition-all hover:-translate-y-1"
                                download
                            >
                                Export CSV
                            </a>
                            <button
                                onClick={() => setShowCreateModal(true)}
                                className="flex-1 sm:flex-none bg-rpg-gold hover:bg-yellow-400 text-rpg-bg px-6 py-3 rounded-xl font-bold uppercase tracking-widest text-sm flex items-center justify-center gap-2 transition-all shadow-[0_0_15px_rgba(251,191,36,0.3)] hover:shadow-[0_0_25px_rgba(251,191,36,0.5)] hover:-translate-y-1"
                            >
                                <UserPlus size={18} />
                                Summon Hero
                            </button>
                        </div>
                    </div>

            {/* === SECTION: USERS — citizen list (mobile cards + desktop table) === */}
                <div className="glass-card p-0 overflow-hidden border border-white/10 rounded-2xl flex flex-col">
                    <div className="p-4 border-b border-white/10 bg-black/40">
                        <h3 className="text-xl font-bold text-rpg-gold">Active Citizens</h3>
                        <p className="text-xs text-gray-400">{filteredUsers.length} of {users.length} registered in the realm.</p>
                    </div>
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-20 text-rpg-gold gap-4">
                            <Loader className="animate-spin" size={32} />
                            <span className="font-heading uppercase tracking-widest text-sm animate-pulse">Scrying the Database...</span>
                        </div>
                    ) : (
                        <>
                            {/* Mobile: card layout */}
                            <div className="sm:hidden divide-y divide-white/5">
                                {filteredUsers.map((user) => (
                                    <div key={user.id} className="px-4 py-3 flex items-center gap-3">
                                        <div className="w-9 h-9 rounded-full bg-indigo-500/20 flex items-center justify-center border border-indigo-500/30 text-indigo-300 text-sm font-bold shrink-0">
                                            {user.username.charAt(0).toUpperCase()}
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <div className="flex items-center gap-2">
                                                <span className="font-bold text-white text-sm truncate">{user.username}</span>
                                                {user.is_admin && (
                                                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-rpg-gold/20 text-rpg-gold text-[9px] font-bold uppercase shrink-0">
                                                        <Shield size={10} /> GM
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-[11px] text-gray-500">{new Date(user.created_at).toLocaleDateString()}</p>
                                        </div>
                                        <button
                                            disabled={user.id === currentUser.id}
                                            onClick={() => handleDeleteUser(user.id, user.username)}
                                            className={`p-2 rounded-lg shrink-0 ${user.id === currentUser.id ? 'opacity-20 cursor-not-allowed' : 'text-gray-500 hover:text-red-400 hover:bg-red-500/10'}`}
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                ))}
                                {filteredUsers.length === 0 && (
                                    <div className="px-4 py-12 text-center text-gray-500 italic text-sm">
                                        No citizens found matching "{searchQuery}"
                                    </div>
                                )}
                            </div>
                            {/* Desktop: table layout */}
                            <div className="hidden sm:block overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="bg-black/40 border-b border-white/10">
                                            <th className="px-4 py-3 text-xs font-bold text-gray-400 uppercase tracking-widest">Username</th>
                                            <th className="px-4 py-3 text-xs font-bold text-gray-400 uppercase tracking-widest">Role</th>
                                            <th className="px-4 py-3 text-xs font-bold text-gray-400 uppercase tracking-widest">Joined</th>
                                            <th className="px-4 py-3 text-xs font-bold text-gray-400 uppercase tracking-widest text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/5">
                                        {filteredUsers.map((user) => (
                                            <tr key={user.id} className="hover:bg-white/5 transition-colors">
                                                <td className="px-4 py-3 font-bold text-white">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-7 h-7 rounded-full bg-indigo-500/20 flex items-center justify-center border border-indigo-500/30 text-indigo-300 text-xs">
                                                            {user.username.charAt(0).toUpperCase()}
                                                        </div>
                                                        {user.username}
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3">
                                                    {user.is_admin ? (
                                                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rpg-gold/20 border border-rpg-gold/30 text-rpg-gold text-[10px] font-bold uppercase tracking-wider">
                                                            <Shield size={12} /> Game Master
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-gray-500/10 border border-gray-500/30 text-gray-400 text-[10px] font-bold uppercase tracking-wider">
                                                            Citizen
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="px-4 py-3 text-gray-400 text-sm">
                                                    {new Date(user.created_at).toLocaleDateString()}
                                                </td>
                                                <td className="px-4 py-3 text-right">
                                                    <button
                                                        disabled={user.id === currentUser.id}
                                                        onClick={() => handleDeleteUser(user.id, user.username)}
                                                        className={`p-2 rounded-xl transition-all ${user.id === currentUser.id ? 'opacity-20 cursor-not-allowed' : 'text-gray-500 hover:text-red-400 hover:bg-red-500/10'}`}
                                                        title={user.id === currentUser.id ? "Cannot banish yourself" : "Banish User"}
                                                    >
                                                        <Trash2 size={18} />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                        {filteredUsers.length === 0 && (
                                            <tr>
                                                <td colSpan="4" className="px-4 py-12 text-center text-gray-500 italic">
                                                    No citizens found matching "{searchQuery}"
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </>
                    )}
                </div>
                </div>
            )}

            {/* === SECTION: SERVER (registration + waitlist) === */}
            {activeSection === 'server' && (
                <div className="space-y-6 animate-in fade-in duration-300">
                    {/* Server Settings */}
                    <div className="glass-card p-6 border border-white/10 rounded-2xl flex flex-col sm:flex-row justify-between items-center gap-4">
                        <div>
                            <h3 className="text-xl font-bold text-white mb-1">Public Registration</h3>
                            <p className="text-gray-400 text-sm">Control whether strangers can create accounts from the login screen.</p>
                        </div>
                        <button
                            onClick={toggleRegistration}
                            className={`px-6 py-3 rounded-xl font-bold uppercase tracking-widest text-sm transition-all flex items-center gap-2 ${allowRegistration ? 'bg-red-500/20 text-red-400 border border-red-500/50 hover:bg-red-500/30' : 'bg-green-500/20 text-green-400 border border-green-500/50 hover:bg-green-500/30'}`}
                        >
                            {allowRegistration ? <ShieldOff size={18} /> : <Shield size={18} />}
                            {allowRegistration ? 'Close Registration' : 'Open Registration'}
                        </button>
                    </div>

                    {/* Waitlist Table */}
                    <div className="glass-card p-0 overflow-hidden border border-white/10 rounded-2xl flex flex-col max-h-[60vh]">
                    <div className="p-4 border-b border-white/10 bg-black/40">
                        <h3 className="text-xl font-bold text-rpg-gold">Beta Waitlist</h3>
                        <p className="text-xs text-gray-400">Adventurers waiting to join.</p>
                    </div>
                    {loadingWaitlist ? (
                        <div className="flex-1 flex items-center justify-center text-rpg-gold">
                            <Loader className="animate-spin" size={32} />
                        </div>
                    ) : (
                        <div className="overflow-y-auto flex-1 p-4">
                            {waitlist.length === 0 ? (
                                <div className="text-center text-gray-500 italic py-10">The gates are quiet — no travelers await entry.</div>
                            ) : (
                                <div className="space-y-3">
                                    {waitlist.map((entry) => (
                                        <div key={entry.id} className="flex justify-between items-center bg-black/40 p-3 rounded-xl border border-white/5">
                                            <div>
                                                <div className="font-bold text-white flex items-center gap-2">
                                                    {entry.email}
                                                    {entry.temp_password && (
                                                        <span className="text-[10px] font-mono bg-blue-500/20 text-blue-300 border border-blue-500/30 px-2 py-0.5 rounded">
                                                            Pass: {entry.temp_password}
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="text-xs text-gray-500">{new Date(entry.created_at).toLocaleDateString()}</div>
                                            </div>
                                            <button
                                                onClick={() => handleDeleteWaitlist(entry.id, entry.email)}
                                                className="p-2 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                                                title="Delete from Waitlist"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                    </div>
                </div>
            )}

            {/* === SECTION: FEEDBACK (suggestion box) === */}
            {activeSection === 'feedback' && (
                <div className="glass-card p-0 overflow-hidden border border-white/10 rounded-2xl flex flex-col max-h-[60vh] animate-in fade-in duration-300">
                    <div className="p-4 border-b border-white/10 bg-black/40 flex items-center justify-between">
                        <div>
                            <h3 className="text-xl font-bold text-rpg-gold">Suggestion Box</h3>
                            <p className="text-xs text-gray-400">Ideas sent in by citizens.</p>
                        </div>
                        <span className="text-xs font-mono bg-rpg-gold/10 text-rpg-gold border border-rpg-gold/30 px-2 py-1 rounded-lg">
                            {suggestions.filter(s => s.status === 'new').length} new
                        </span>
                    </div>
                    {loadingSuggestions ? (
                        <div className="flex-1 flex items-center justify-center text-rpg-gold">
                            <Loader className="animate-spin" size={32} />
                        </div>
                    ) : (
                        <div className="overflow-y-auto flex-1 p-4">
                            {suggestions.length === 0 ? (
                                <div className="text-center text-gray-500 italic py-10">The whisper box is empty — the citizens have yet to speak.</div>
                            ) : (
                                <div className="space-y-3">
                                    {suggestions.map((s) => (
                                        <div key={s.id} className={`bg-black/40 p-4 rounded-xl border ${s.status === 'new' ? 'border-rpg-gold/40' : 'border-white/5'}`}>
                                            <div className="flex justify-between items-start gap-4">
                                                <div className="min-w-0">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <span className="font-bold text-white">{s.username}</span>
                                                        {s.status === 'new' && (
                                                            <span className="text-[9px] font-bold uppercase bg-rpg-gold/20 text-rpg-gold px-2 py-0.5 rounded-full">New</span>
                                                        )}
                                                        <span className="text-xs text-gray-500">{new Date(s.created_at).toLocaleDateString()}</span>
                                                    </div>
                                                    <p className="text-sm text-gray-300 whitespace-pre-wrap break-words">{s.message}</p>
                                                </div>
                                                <div className="flex gap-1 shrink-0">
                                                    {s.status === 'new' && (
                                                        <button
                                                            onClick={() => handleMarkSuggestionRead(s.id)}
                                                            className="p-2 text-gray-500 hover:text-green-400 hover:bg-green-500/10 rounded-lg transition-colors"
                                                            title="Mark as read"
                                                        >
                                                            <Check size={16} />
                                                        </button>
                                                    )}
                                                    <button
                                                        onClick={() => handleDeleteSuggestion(s.id)}
                                                        className="p-2 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                                                        title="Delete suggestion"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}


            {/* === SECTION: WORLD TOOLS === */}
            {activeSection === 'world' && (
                <div className="animate-in fade-in duration-300">
                    <AdminWorldTools currentUser={currentUser} />
                </div>
            )}

            {/* === SECTION: GLOBAL LIBRARY === */}
            {activeSection === 'library' && (
                <div className="glass-card p-4 overflow-hidden border border-white/10 rounded-2xl flex flex-col min-h-[500px] animate-in fade-in duration-300">
                    <div className="mb-4">
                        <h3 className="text-xl font-bold text-rpg-gold flex items-center gap-2">
                            <Library size={20} /> General Asset Library
                        </h3>
                        <p className="text-xs text-gray-400">View and manage all approved user creations and admin designs.</p>
                    </div>
                    <AssetManager currentUser={currentUser} />
                </div>
            )}

            {/* === SECTION: EMAILS (template editor) === */}
            {activeSection === 'emails' && (
                <div className="space-y-4 animate-in fade-in duration-300">
                    {!editingTemplate ? (
                        <div className="glass-card p-0 overflow-hidden border border-white/10 rounded-2xl">
                            <div className="p-4 border-b border-white/10 bg-black/40 flex items-center justify-between">
                                <div>
                                    <h3 className="text-xl font-bold text-rpg-gold">Realm Messengers</h3>
                                    <p className="text-xs text-gray-400">Email templates sent by the system.</p>
                                </div>
                            </div>
                            {loadingEmails ? (
                                <div className="flex items-center justify-center py-16 text-rpg-gold">
                                    <Loader className="animate-spin" size={28} />
                                </div>
                            ) : emailTemplates.length === 0 ? (
                                <div className="text-center text-gray-500 italic py-12 text-sm">No templates found. They will be created on first use.</div>
                            ) : (
                                <div className="divide-y divide-white/5">
                                    {emailTemplates.map(t => (
                                        <button
                                            key={t.slug}
                                            onClick={() => loadTemplate(t.slug)}
                                            className="w-full text-left px-4 py-3 hover:bg-white/5 transition-colors flex items-center gap-3"
                                        >
                                            <div className="w-9 h-9 rounded-lg bg-rpg-gold/10 border border-rpg-gold/30 flex items-center justify-center shrink-0">
                                                <Mail size={16} className="text-rpg-gold" />
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <p className="text-sm font-bold text-white truncate">{t.name}</p>
                                                <p className="text-[11px] text-gray-500 truncate">{t.subject}</p>
                                            </div>
                                            <div className="text-[10px] text-gray-600 shrink-0">
                                                {t.variables && t.variables.split(',').map(v => (
                                                    <span key={v} className="inline-block bg-white/5 rounded px-1.5 py-0.5 mr-1">{`{{${v.trim()}}}`}</span>
                                                ))}
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="glass-card border border-white/10 rounded-2xl overflow-hidden">
                            {/* Editor header */}
                            <div className="p-4 border-b border-white/10 bg-black/40 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <button
                                        onClick={() => setEditingTemplate(null)}
                                        className="text-gray-400 hover:text-white transition-colors"
                                    >
                                        ← Back
                                    </button>
                                    <div>
                                        <h3 className="text-lg font-bold text-rpg-gold">{editingTemplate.name}</h3>
                                        <p className="text-[10px] text-gray-500 font-mono">slug: {editingTemplate.slug}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={saveTemplate}
                                        disabled={savingTemplate}
                                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rpg-gold/20 text-rpg-gold border border-rpg-gold/30 text-xs font-bold hover:bg-rpg-gold/30 transition-colors disabled:opacity-50"
                                    >
                                        {savingTemplate ? <Loader className="animate-spin" size={14} /> : <Save size={14} />}
                                        Save
                                    </button>
                                </div>
                            </div>

                            {/* Editor fields */}
                            <div className="p-4 space-y-4">
                                <div>
                                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">Template Name</label>
                                    <input
                                        type="text"
                                        value={editingTemplate.name}
                                        onChange={(e) => setEditingTemplate({ ...editingTemplate, name: e.target.value })}
                                        className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-rpg-gold transition-colors"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">Subject Line</label>
                                    <input
                                        type="text"
                                        value={editingTemplate.subject}
                                        onChange={(e) => setEditingTemplate({ ...editingTemplate, subject: e.target.value })}
                                        className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-rpg-gold transition-colors"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">
                                        Variables <span className="text-gray-600 normal-case">(comma-separated)</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={editingTemplate.variables || ''}
                                        onChange={(e) => setEditingTemplate({ ...editingTemplate, variables: e.target.value })}
                                        placeholder="username,password,email"
                                        className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-white text-sm font-mono focus:outline-none focus:border-rpg-gold transition-colors"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">Body HTML</label>
                                    <textarea
                                        value={editingTemplate.body_html}
                                        onChange={(e) => setEditingTemplate({ ...editingTemplate, body_html: e.target.value })}
                                        rows={12}
                                        className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-white text-xs font-mono focus:outline-none focus:border-rpg-gold transition-colors resize-y"
                                    />
                                </div>

                                {/* Preview */}
                                <div>
                                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">Preview</label>
                                    <div className="bg-white rounded-lg overflow-hidden max-h-[40vh] overflow-y-auto">
                                        <iframe
                                            srcDoc={editingTemplate.body_html}
                                            title="Email preview"
                                            className="w-full h-64 border-0"
                                            sandbox=""
                                        />
                                    </div>
                                </div>

                                {/* Test send */}
                                <div className="flex items-end gap-2 pt-2 border-t border-white/5">
                                    <div className="flex-1">
                                        <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">Send Test Email</label>
                                        <input
                                            type="email"
                                            value={testEmailTo}
                                            onChange={(e) => setTestEmailTo(e.target.value)}
                                            placeholder="recipient@email.com"
                                            className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-rpg-gold transition-colors"
                                        />
                                    </div>
                                    <button
                                        onClick={sendTestEmail}
                                        disabled={!testEmailTo}
                                        className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-500/20 text-blue-400 border border-blue-500/30 text-xs font-bold hover:bg-blue-500/30 transition-colors disabled:opacity-30 shrink-0"
                                    >
                                        <Send size={14} /> Send Test
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* === SECTION: CMS === */}
            {activeSection === 'cms' && (
                <div className="animate-in fade-in duration-300">
                    <CmsManager currentUser={currentUser} />
                </div>
            )}

            {/* === SECTION: BESTIARY (Game Master) === */}
            {activeSection === 'bestiary' && (
                <div className="animate-in fade-in duration-300">
                    <GameMasterPanel currentUser={currentUser} />
                </div>
            )}

            {/* Create Modal (always available regardless of section) */}
            <Modal
                isOpen={showCreateModal}
                dismissable={!isCreating}
                onClose={() => setShowCreateModal(false)}
            >
                <div className="bg-rpg-panel border border-rpg-gold/30 rounded-2xl w-full p-6 shadow-2xl shadow-black/50">
                    <h3 className="text-xl font-heading font-bold text-rpg-gold flex items-center gap-2 mb-6 border-b border-white/10 pb-4">
                        <UserPlus size={20} /> Summon New Hero
                    </h3>

                            <form onSubmit={handleCreateUser} className="space-y-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Username</label>
                                    <input
                                        type="text"
                                        required
                                        value={newUsername}
                                        onChange={(e) => setNewUsername(e.target.value)}
                                        className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-rpg-gold focus:ring-1 focus:ring-rpg-gold transition-colors"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Password</label>
                                    <input
                                        type="password"
                                        required
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                        className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-rpg-gold focus:ring-1 focus:ring-rpg-gold transition-colors"
                                    />
                                </div>

                                <div className="flex items-center gap-3 bg-white/5 p-3 rounded-xl border border-white/10">
                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <input
                                            type="checkbox"
                                            className="sr-only peer"
                                            checked={newIsAdmin}
                                            onChange={(e) => setNewIsAdmin(e.target.checked)}
                                        />
                                        <div className="w-11 h-6 bg-gray-600 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-rpg-gold"></div>
                                    </label>
                                    <div className="flex flex-col">
                                        <span className="text-sm font-bold text-white">Game Master Privileges</span>
                                        <span className="text-[10px] text-gray-400 uppercase tracking-widest">Grants access to this panel</span>
                                    </div>
                                </div>

                                {createError && (
                                    <div className="p-3 bg-red-500/20 border border-red-500/50 rounded-xl text-red-400 text-sm font-bold text-center">
                                        {createError}
                                    </div>
                                )}

                                <div className="flex gap-3 pt-4 border-t border-white/10">
                                    <button
                                        type="button"
                                        onClick={() => setShowCreateModal(false)}
                                        disabled={isCreating}
                                        className="flex-1 px-4 py-3 rounded-xl border border-white/10 text-gray-400 hover:text-white hover:bg-white/5 font-bold uppercase tracking-widest text-sm transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={isCreating}
                                        className="flex-[2] bg-rpg-gold text-rpg-bg hover:bg-yellow-400 px-4 py-3 rounded-xl font-bold uppercase tracking-widest text-sm transition-all shadow-[0_0_15px_rgba(251,191,36,0.3)] hover:shadow-[0_0_20px_rgba(251,191,36,0.5)] disabled:opacity-50 flex items-center justify-center gap-2"
                                    >
                                        {isCreating ? <Loader className="animate-spin" size={16} /> : <UserPlus size={16} />}
                                        {isCreating ? 'Summoning...' : 'Create Citizen'}
                                    </button>
                                </div>
                    </form>
                </div>
            </Modal>
        </div>
    );
};

export default AdminPanel;
