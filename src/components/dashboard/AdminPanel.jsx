import React, { useState, useEffect } from 'react';
import { Trash2, UserPlus, Shield, ShieldOff, Search, Loader } from 'lucide-react';
import PixelIcon from '../common/PixelIcon';

const AdminPanel = ({ currentUser }) => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

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
                alert("You have been granted Super-User rights! Please refresh the page completely to update your session.");
            } else {
                alert("You do not have Administrator privileges.");
            }
        } catch (e) { }
    }

    useEffect(() => {
        fetchUsers();
        fetchSettings();
        fetchWaitlist();
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
            alert("Error toggling registration");
        }
    };

    const handleDeleteWaitlist = async (id, email) => {
        if (!confirm(`Delete ${email} from waitlist?`)) return;
        try {
            const res = await fetch(`api/admin.php?action=delete_waitlist`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ admin_id: currentUser.id, target_id: id })
            });
            const data = await res.json();
            if (data.success) setWaitlist(waitlist.filter(w => w.id !== id));
        } catch (e) {
            alert("Error deleting from waitlist");
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
                alert(data.error || "Failed to delete user");
            }
        } catch (e) {
            alert("Network error deleting user");
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

            {/* Toolbar */}
            <div className="flex flex-col sm:flex-row gap-4 justify-between items-center">
                {/* Search */}
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

                {/* Actions */}
                <div className="flex gap-4 w-full sm:w-auto">
                    {/* Export Users Button */}
                    <a
                        href="api/export_csv.php"
                        className="flex-1 sm:flex-none bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 border border-blue-500/50 px-6 py-3 rounded-xl font-bold uppercase tracking-widest text-sm flex items-center justify-center gap-2 transition-all hover:-translate-y-1"
                        download
                    >
                        Export CSV
                    </a>

                    {/* Create Button */}
                    <button
                        onClick={() => setShowCreateModal(true)}
                        className="flex-1 sm:flex-none bg-rpg-gold hover:bg-yellow-400 text-rpg-bg px-6 py-3 rounded-xl font-bold uppercase tracking-widest text-sm flex items-center justify-center gap-2 transition-all shadow-[0_0_15px_rgba(251,191,36,0.3)] hover:shadow-[0_0_25px_rgba(251,191,36,0.5)] hover:-translate-y-1"
                    >
                        <UserPlus size={18} />
                        Summon Hero
                    </button>
                </div>
            </div>

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

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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

                {/* Users Table */}
                <div className="glass-card p-0 overflow-hidden border border-white/10 rounded-2xl flex flex-col h-[500px]">
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

                {/* Create Modal */}
                {showCreateModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => !isCreating && setShowCreateModal(false)}></div>
                        <div className="relative bg-[#1a102e] border border-rpg-gold/30 rounded-2xl w-full max-w-md p-6 shadow-2xl shadow-black/50 animate-in zoom-in-95 duration-200">
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
        </div>
    );
};

export default AdminPanel;
