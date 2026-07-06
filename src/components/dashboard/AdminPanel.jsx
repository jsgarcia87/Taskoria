import React, { useState, useEffect } from 'react';
import { Trash2, UserPlus, Shield, ShieldOff, Search, Loader, Users as UsersIcon, Settings as SettingsIcon, Hammer, Palette, Lightbulb, Check } from 'lucide-react';
import PixelIcon from '../common/PixelIcon';
import CreationsModeration from './CreationsModeration';
import StudioAccessRequests from './StudioAccessRequests';
import AdminWorldTools from './AdminWorldTools';
import { useToast } from '../common/Toast';

const AdminPanel = ({ currentUser }) => {
    const toast = useToast();
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    // Sub-menu sections to declutter the panel
    const [activeSection, setActiveSection] = useState('users');

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
                console.error(data.error);
                if (data.error === "Unauthorized" || data.error === "Forbidden: Admins only") {
                    // Try to auto-upgrade for demo purposes if table was just created
                    await autoUpgradeAdmin();
                }
            }
        } catch (e) {
            console.error("Failed to fetch users", e);
        } finally {
            setLoading(false);
        }
    };

    const autoUpgradeAdmin = async () => {
        try {
            const res = await fetch(`api/admin.php?action=make_me_admin`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ admin_id: currentUser.id })
            });
            const data = await res.json();
            if (data.success) {
                toast.success("You have been granted Super-User rights. Refresh the page to update your session.", { duration: 7000 });
            } else {
                toast.error("You do not have Administrator privileges.");
            }
        } catch (e) { }
    }

    useEffect(() => {
        fetchUsers();
        fetchSettings();
        fetchWaitlist();
        fetchSuggestions();
    }, []);

    const toggleRegistration = async () => {
        const confirmMsg = allowRegistration
            ? "Are you sure you want to CLOSE public registration? New visitors won't be able to sign up."
            : "Are you sure you want to OPEN public registration? Anyone will be able to create an account.";

        if (!confirm(confirmMsg)) return;

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
        if (!confirm(`Delete ${email} from waitlist? This cannot be undone.`)) return;
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
        if (!confirm('Delete this suggestion? This cannot be undone.')) return;
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
        if (!confirm(`DANGER: Are you sure you want to permanently delete user '${username}' and all their saved data? This cannot be undone.`)) return;

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
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 glass-card p-6 border-b-2 border-rpg-gold relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-rpg-gold/5 blur-[80px] rounded-full pointer-events-none"></div>

                <div>
                    <h2 className="text-3xl font-heading font-bold text-rpg-gold flex items-center gap-3 drop-shadow-[0_0_10px_rgba(251,191,36,0.5)]">
                        <Shield className="text-rpg-gold" size={32} />
                        Super-User Realm
                    </h2>
                    <p className="text-gray-400 mt-2 text-sm max-w-xl">
                        Manage all citizens of Taskoria. You have the power to invite new heroes or banish them back to the void. With great power comes great responsibility.
                    </p>
                </div>

                <div className="shrink-0 flex items-center gap-3">
                    <div className="bg-black/40 border border-white/10 rounded-xl px-4 py-2 flex gap-3 text-sm">
                        <span className="text-gray-400">Total Citizens:</span>
                        <span className="font-bold text-white font-mono">{users.length}</span>
                    </div>
                </div>
            </div>

            {/* Sub-menu — section tabs */}
            <div className="glass-card p-1 border border-white/10 rounded-2xl flex gap-1 flex-wrap">
                {[
                    { id: 'users',  label: 'Users',         icon: UsersIcon,  hint: 'Citizens management' },
                    { id: 'server', label: 'Server',        icon: SettingsIcon, hint: 'Registration + waitlist' },
                    { id: 'feedback', label: 'Feedback',    icon: Lightbulb,  hint: 'Suggestion box from citizens' },
                    { id: 'studio', label: 'Pixel Studio',  icon: Palette,    hint: 'Access + creations moderation' },
                    { id: 'world',  label: 'World Tools',   icon: Hammer,     hint: 'House Builder + Map Editor + Library' },
                ].map(t => {
                    const Icon = t.icon;
                    const isActive = activeSection === t.id;
                    return (
                        <button
                            key={t.id}
                            onClick={() => setActiveSection(t.id)}
                            title={t.hint}
                            className={`flex-1 min-w-[140px] flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-xs font-heading font-bold uppercase tracking-widest transition-all ${
                                isActive
                                    ? 'bg-rpg-gold text-rpg-bg shadow-[0_0_15px_rgba(251,191,36,0.35)]'
                                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                            }`}
                        >
                            <Icon size={14}/> {t.label}
                        </button>
                    );
                })}
            </div>

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
                    <div className="glass-card p-0 overflow-hidden border border-white/10 rounded-2xl flex flex-col h-[500px]">
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
                                <div className="text-center text-gray-500 italic py-10">Nobody is waiting right now.</div>
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
                <div className="glass-card p-0 overflow-hidden border border-white/10 rounded-2xl flex flex-col h-[500px] animate-in fade-in duration-300">
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
                                <div className="text-center text-gray-500 italic py-10">No suggestions yet.</div>
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

            {/* === SECTION: USERS — table goes here (Toolbar was rendered up top) === */}
            {activeSection === 'users' && (
                <div className="glass-card p-0 overflow-hidden border border-white/10 rounded-2xl flex flex-col animate-in fade-in duration-300">
                    <div className="p-4 border-b border-white/10 bg-black/40">
                        <h3 className="text-xl font-bold text-rpg-gold">Active Citizens</h3>
                        <p className="text-xs text-gray-400">All registered users in the realm.</p>
                    </div>
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-20 text-rpg-gold gap-4">
                            <Loader className="animate-spin" size={32} />
                            <span className="font-heading uppercase tracking-widest text-sm animate-pulse">Scrying the Database...</span>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-black/40 border-b border-white/10">
                                        <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">ID</th>
                                        <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Username</th>
                                        <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Role</th>
                                        <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Joined At</th>
                                        <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {filteredUsers.map((user) => (
                                        <tr key={user.id} className="hover:bg-white/5 transition-colors group">
                                            <td className="px-6 py-4 text-gray-500 font-mono text-sm">#{user.id}</td>
                                            <td className="px-6 py-4 font-bold text-white flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-indigo-500/20 flex items-center justify-center border border-indigo-500/30 text-indigo-300">
                                                    {user.username.charAt(0).toUpperCase()}
                                                </div>
                                                {user.username}
                                            </td>
                                            <td className="px-6 py-4">
                                                {user.is_admin ? (
                                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rpg-gold/20 border border-rpg-gold/30 text-rpg-gold text-[10px] font-bold uppercase tracking-wider">
                                                        <Shield size={12} /> Super-User
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-gray-500/10 border border-gray-500/30 text-gray-400 text-[10px] font-bold uppercase tracking-wider">
                                                        Citizen
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 text-gray-400 text-sm">
                                                {new Date(user.created_at).toLocaleDateString()}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <button
                                                    disabled={user.id === currentUser.id}
                                                    onClick={() => handleDeleteUser(user.id, user.username)}
                                                    className={`p-2 rounded-xl transition-all ${user.id === currentUser.id
                                                        ? 'opacity-20 cursor-not-allowed'
                                                        : 'text-gray-500 hover:text-red-400 hover:bg-red-500/10'
                                                        }`}
                                                    title={user.id === currentUser.id ? "Cannot banish yourself" : "Banish User"}
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                    {filteredUsers.length === 0 && (
                                        <tr>
                                            <td colSpan="5" className="px-6 py-12 text-center text-gray-500 italic">
                                                No users found matching "{searchQuery}"
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}

            {/* === SECTION: PIXEL STUDIO (access requests + creations moderation) === */}
            {activeSection === 'studio' && (
                <div className="space-y-6 animate-in fade-in duration-300">
                    <StudioAccessRequests currentUser={currentUser} />
                    <CreationsModeration currentUser={currentUser} />
                </div>
            )}

            {/* === SECTION: WORLD TOOLS === */}
            {activeSection === 'world' && (
                <div className="animate-in fade-in duration-300">
                    <AdminWorldTools currentUser={currentUser} />
                </div>
            )}

            {/* Create Modal (always available regardless of section) */}
                {showCreateModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => !isCreating && setShowCreateModal(false)}></div>
                        <div className="relative bg-rpg-panel border border-rpg-gold/30 rounded-2xl w-full max-w-md p-6 shadow-2xl shadow-black/50 animate-in zoom-in-95 duration-200">
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
                                        <span className="text-sm font-bold text-white">Super-User Privileges</span>
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
                    </div>
                )}
        </div>
    );
};

export default AdminPanel;
