import React, { useState } from 'react';
import PixelIcon from './common/PixelIcon';
import { useGame } from '../context/GameContext';
import { useToast } from './common/Toast';
import { Settings as SettingsIcon, X, Monitor, Clock, Mail, Send, Lightbulb, Key, AlertTriangle, Loader2, Trash2, Download, Smartphone, CheckCircle2 } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

const SUPPORT_EMAIL = 'taskoriaapp@gmail.com';

const Settings = ({ onClose, currentUser, onLogout }) => {
    const { state, dispatch } = useGame();
    const { screensaverSettings } = state;
    const toast = useToast();
    const { canInstall, isInstalled, install } = usePWAInstall();

    // Platform detection for the manual-install fallback (iOS Safari never
    // fires beforeinstallprompt; some Android/desktop cases miss it too).
    const ua = typeof navigator !== 'undefined' ? navigator.userAgent : '';
    const isIOS = /iPad|iPhone|iPod/.test(ua) && !window.MSStream;
    const installHint = isIOS
        ? 'Tap the Share icon, then choose "Add to Home Screen".'
        : 'Open your browser menu (⋮) and choose "Install app" or "Add to Home screen".';

    const handleInstallPWA = async () => {
        const outcome = await install();
        if (outcome === 'accepted') {
            toast.success('Taskoria added to your device.');
        }
    };

    const [suggestion, setSuggestion] = useState('');
    const [sendingSuggestion, setSendingSuggestion] = useState(false);

    // Password change
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [changingPassword, setChangingPassword] = useState(false);

    // Delete account modal
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [deletePassword, setDeletePassword] = useState('');
    const [deleteConfirmText, setDeleteConfirmText] = useState('');
    const [deleting, setDeleting] = useState(false);

    const submitPasswordChange = async () => {
        if (!currentPassword || !newPassword || !confirmPassword) {
            toast.error('Fill every field to change your password.');
            return;
        }
        if (newPassword.length < 6) {
            toast.error('New password must be at least 6 characters.');
            return;
        }
        if (newPassword !== confirmPassword) {
            toast.error('New password and confirmation do not match.');
            return;
        }
        setChangingPassword(true);
        try {
            const res = await fetch('api/change_password.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    user_id: currentUser?.id,
                    current_password: currentPassword,
                    new_password: newPassword,
                }),
            });
            const data = await res.json();
            if (data.success) {
                toast.success('Password updated. Log in again next time with the new one.');
                setCurrentPassword(''); setNewPassword(''); setConfirmPassword('');
            } else {
                toast.error(data.error || 'Could not update the password.');
            }
        } catch (e) {
            toast.error('The Archive is beyond reach. Try again shortly.');
        } finally {
            setChangingPassword(false);
        }
    };

    const submitDeleteAccount = async () => {
        if (!deletePassword || deleteConfirmText !== 'DELETE') return;
        setDeleting(true);
        try {
            const res = await fetch('api/delete_account.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    user_id: currentUser?.id,
                    password: deletePassword,
                    confirm: 'DELETE',
                }),
            });
            const data = await res.json();
            if (data.success) {
                toast.success('Your account has been erased from the Archive.');
                setShowDeleteModal(false);
                // Give the toast a beat, then log out.
                setTimeout(() => { onLogout?.(); }, 800);
            } else {
                toast.error(data.error || 'Could not delete the account.');
                setDeleting(false);
            }
        } catch (e) {
            toast.error('The Archive is beyond reach. Try again shortly.');
            setDeleting(false);
        }
    };

    const submitSuggestion = async () => {
        const message = suggestion.trim();
        if (!message) return;
        setSendingSuggestion(true);
        try {
            const res = await fetch('api/admin.php?action=submit_suggestion', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ user_id: currentUser?.id, username: currentUser?.username, message }),
            });
            const data = await res.json();
            if (data.success) {
                toast.success(data.message || 'Ledgar has sealed your words in the Great Book.');
                setSuggestion('');
            } else {
                toast.error(data.error || 'Ledgar could not record your message.');
            }
        } catch (e) {
            toast.error('The Archive is beyond reach. Try again shortly.');
        } finally {
            setSendingSuggestion(false);
        }
    };

    const toggleScreensaver = () => {
        dispatch({
            type: 'UPDATE_SCREENSAVER_SETTINGS',
            payload: { enabled: !screensaverSettings.enabled }
        });
    };

    const updateTimeout = (e) => {
        dispatch({
            type: 'UPDATE_SCREENSAVER_SETTINGS',
            payload: { timeout: parseInt(e.target.value) }
        });
    };

    return (
        <div className="bg-rpg-panel/80 backdrop-blur-2xl border border-white/10 rounded-3xl p-6 md:p-8 shadow-2xl max-w-2xl mx-auto animate-in zoom-in-95 duration-300">
            <div className="flex items-center justify-between mb-8 pb-4 border-b border-white/5">
                <div className="flex items-center gap-3">
                    <div className="p-3 bg-purple-600/20 rounded-2xl border border-purple-500/30">
                        <SettingsIcon size={24} className="text-purple-400 drop-shadow-glow" />
                    </div>
                    <div>
                        <h2 className="text-xl font-heading font-bold text-white tracking-tight">App Settings</h2>
                        <p className="text-xs text-gray-500 font-mono uppercase tracking-wider">Configure your experience</p>
                    </div>
                </div>
                <button 
                    onClick={onClose}
                    className="p-2 hover:bg-white/5 rounded-xl transition-colors text-gray-400 hover:text-white"
                >
                    <X size={24} />
                </button>
            </div>

            <div className="space-y-6">
                {/* Install as app — always visible unless already installed.
                    Native prompt when available, manual instructions otherwise. */}
                <div className={`glass-panel p-6 rounded-2xl border ${isInstalled ? 'border-green-500/30 bg-green-500/5' : 'border-rpg-gold/30 bg-rpg-gold/5'}`}>
                    <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                        <div className="flex items-center gap-4 flex-1 min-w-0">
                            <div className={`p-2 rounded-xl border shrink-0 ${isInstalled ? 'bg-green-500/10 border-green-500/30' : 'bg-rpg-gold/10 border-rpg-gold/30'}`}>
                                {isInstalled
                                    ? <CheckCircle2 size={20} className="text-green-400" />
                                    : <Smartphone size={20} className="text-rpg-gold" />}
                            </div>
                            <div className="min-w-0">
                                <h3 className="font-bold text-white mb-0.5">
                                    {isInstalled ? 'Taskoria is installed' : 'Install Taskoria on your device'}
                                </h3>
                                <p className="text-xs text-gray-400 leading-relaxed">
                                    {isInstalled
                                        ? 'You\'re running the installed app — one-tap access from your home screen.'
                                        : canInstall
                                            ? 'One-tap access from your home screen. Works offline. No app store needed.'
                                            : installHint}
                                </p>
                            </div>
                        </div>
                        {!isInstalled && canInstall && (
                            <button
                                onClick={handleInstallPWA}
                                className="shrink-0 flex items-center justify-center gap-2 bg-rpg-gold hover:bg-yellow-400 text-rpg-bg px-5 py-2.5 rounded-xl font-bold uppercase tracking-widest text-xs transition-all shadow-glow-gold"
                            >
                                <Download size={14} /> Install App
                            </button>
                        )}
                    </div>
                </div>

                {/* Screensaver Section */}
                <div className="glass-panel p-6 rounded-2xl border border-white/5 bg-white/5 transition-all hover:bg-white/10 group">
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-4">
                            <div className="p-2 bg-rpg-gold/10 rounded-xl border border-rpg-gold/20">
                                <Monitor size={20} className="text-rpg-gold" />
                            </div>
                            <div>
                                <h3 className="font-bold text-white mb-0.5">Screensaver</h3>
                                <p className="text-xs text-gray-400">Keep screen active with time and tasks</p>
                            </div>
                        </div>
                        
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input 
                                type="checkbox" 
                                className="sr-only peer" 
                                checked={screensaverSettings.enabled}
                                onChange={toggleScreensaver}
                            />
                            <div className="w-14 h-7 bg-black/40 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:start-[4px] after:bg-gray-500 after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-purple-600 peer-checked:after:bg-white"></div>
                        </label>
                    </div>

                    {screensaverSettings.enabled && (
                        <div className="space-y-4 animate-in slide-in-from-top-2 duration-300">
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-gray-400 flex items-center gap-2">
                                    <Clock size={14} />
                                    Inactivity Timeout
                                </span>
                                <span className="text-rpg-gold font-mono font-bold">{screensaverSettings.timeout} seconds</span>
                            </div>
                            <input 
                                type="range" 
                                min="10" 
                                max="300" 
                                step="10"
                                value={screensaverSettings.timeout}
                                onChange={updateTimeout}
                                className="w-full h-2 bg-black/40 rounded-lg appearance-none cursor-pointer accent-purple-600"
                            />
                            <div className="flex justify-between text-[10px] text-gray-600 font-mono uppercase">
                                <span>10s</span>
                                <span>5m</span>
                            </div>
                        </div>
                    )}
                </div>

                {/* Suggestion Box */}
                <div className="glass-panel p-6 rounded-2xl border border-white/5 bg-white/5">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="p-2 bg-rpg-gold/10 rounded-xl border border-rpg-gold/20">
                            <Lightbulb size={20} className="text-rpg-gold" />
                        </div>
                        <div>
                            <h3 className="font-bold text-white mb-0.5">Suggestion Box</h3>
                            <p className="text-xs text-gray-400">Got an idea to make Taskoria better? The guild is listening.</p>
                        </div>
                    </div>
                    <textarea
                        value={suggestion}
                        onChange={(e) => setSuggestion(e.target.value)}
                        maxLength={2000}
                        rows={4}
                        placeholder="Tell us what you'd love to see next..."
                        className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-sm text-white placeholder-gray-500 focus:border-rpg-gold focus:outline-none focus:ring-1 focus:ring-rpg-gold transition-all resize-none"
                    />
                    <div className="flex items-center justify-between mt-3">
                        <span className="text-[10px] text-gray-600 font-mono">{suggestion.length}/2000</span>
                        <button
                            onClick={submitSuggestion}
                            disabled={!suggestion.trim() || sendingSuggestion}
                            className="flex items-center gap-2 bg-rpg-gold hover:bg-yellow-400 disabled:opacity-40 disabled:cursor-not-allowed text-rpg-bg px-5 py-2.5 rounded-xl font-bold uppercase tracking-widest text-xs transition-all shadow-glow-gold"
                        >
                            <Send size={14} /> {sendingSuggestion ? 'Sending...' : 'Send Suggestion'}
                        </button>
                    </div>
                </div>

                {/* Support */}
                <div className="glass-panel p-6 rounded-2xl border border-white/5 bg-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <div className="p-2 bg-blue-500/10 rounded-xl border border-blue-500/20">
                            <Mail size={20} className="text-blue-400" />
                        </div>
                        <div>
                            <h3 className="font-bold text-white mb-0.5">Need Help?</h3>
                            <p className="text-xs text-gray-400">Reach the support team directly.</p>
                        </div>
                    </div>
                    <a
                        href={`mailto:${SUPPORT_EMAIL}`}
                        className="shrink-0 bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 border border-blue-500/50 px-5 py-2.5 rounded-xl font-bold uppercase tracking-widest text-xs transition-all text-center"
                    >
                        {SUPPORT_EMAIL}
                    </a>
                </div>

                {/* Change Password */}
                <div className="glass-panel p-6 rounded-2xl border border-white/5 bg-white/5">
                    <div className="flex items-center gap-4 mb-5">
                        <div className="p-2 bg-blue-500/10 rounded-xl border border-blue-500/20">
                            <Key size={20} className="text-blue-400" />
                        </div>
                        <div>
                            <h3 className="font-bold text-white mb-0.5">Change Password</h3>
                            <p className="text-xs text-gray-400">Update your credentials for the Archive.</p>
                        </div>
                    </div>
                    <div className="space-y-3">
                        <input
                            type="password"
                            placeholder="Current password"
                            value={currentPassword}
                            onChange={(e) => setCurrentPassword(e.target.value)}
                            disabled={changingPassword}
                            autoComplete="current-password"
                            className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-400 transition-all"
                        />
                        <input
                            type="password"
                            placeholder="New password (min. 6 chars)"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            disabled={changingPassword}
                            autoComplete="new-password"
                            className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-400 transition-all"
                        />
                        <input
                            type="password"
                            placeholder="Confirm new password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            disabled={changingPassword}
                            autoComplete="new-password"
                            className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-400 transition-all"
                        />
                        <div className="flex justify-end pt-1">
                            <button
                                onClick={submitPasswordChange}
                                disabled={changingPassword || !currentPassword || !newPassword || !confirmPassword}
                                className="flex items-center gap-2 bg-blue-500/20 hover:bg-blue-500/30 disabled:opacity-40 disabled:cursor-not-allowed text-blue-300 border border-blue-500/50 px-5 py-2.5 rounded-xl font-bold uppercase tracking-widest text-xs transition-all"
                            >
                                {changingPassword ? <><Loader2 size={14} className="animate-spin" /> Updating…</> : <><Key size={14} /> Update Password</>}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Danger Zone */}
                <div className="glass-panel p-6 rounded-2xl border border-red-500/20 bg-red-500/5">
                    <div className="flex items-center gap-4 mb-5">
                        <div className="p-2 bg-red-500/10 rounded-xl border border-red-500/30">
                            <AlertTriangle size={20} className="text-red-400" />
                        </div>
                        <div>
                            <h3 className="font-bold text-white mb-0.5">Danger Zone</h3>
                            <p className="text-xs text-gray-400">Erase your account and all its data. This cannot be undone.</p>
                        </div>
                    </div>
                    <div className="flex justify-end">
                        <button
                            onClick={() => setShowDeleteModal(true)}
                            className="flex items-center gap-2 bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/50 px-5 py-2.5 rounded-xl font-bold uppercase tracking-widest text-xs transition-all"
                        >
                            <Trash2 size={14} /> Delete Account
                        </button>
                    </div>
                </div>
            </div>

            {/* Delete confirmation modal */}
            {showDeleteModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                    <div className="bg-rpg-panelDark border border-red-500/30 rounded-2xl p-6 md:p-8 max-w-md w-full shadow-2xl animate-in zoom-in-95 duration-200">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2 bg-red-500/20 rounded-xl border border-red-500/40">
                                <AlertTriangle size={22} className="text-red-400" />
                            </div>
                            <h3 className="text-lg font-heading font-bold text-white">Delete your account?</h3>
                        </div>
                        <p className="text-sm text-gray-400 leading-relaxed mb-5">
                            This permanently erases your hero, quests, pets, missions, family profiles and every trace of your kingdom.
                            <br />
                            <span className="text-red-400 font-bold">There is no undo.</span>
                        </p>
                        <div className="space-y-3">
                            <input
                                type="password"
                                placeholder="Your password"
                                value={deletePassword}
                                onChange={(e) => setDeletePassword(e.target.value)}
                                disabled={deleting}
                                autoComplete="current-password"
                                className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:border-red-400 focus:outline-none focus:ring-1 focus:ring-red-400 transition-all"
                            />
                            <input
                                type="text"
                                placeholder='Type "DELETE" to confirm'
                                value={deleteConfirmText}
                                onChange={(e) => setDeleteConfirmText(e.target.value)}
                                disabled={deleting}
                                className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:border-red-400 focus:outline-none focus:ring-1 focus:ring-red-400 transition-all uppercase tracking-widest font-mono"
                            />
                        </div>
                        <div className="flex justify-end gap-2 mt-6">
                            <button
                                onClick={() => { setShowDeleteModal(false); setDeletePassword(''); setDeleteConfirmText(''); }}
                                disabled={deleting}
                                className="px-4 py-2.5 rounded-xl text-sm font-bold uppercase tracking-widest text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={submitDeleteAccount}
                                disabled={deleting || !deletePassword || deleteConfirmText !== 'DELETE'}
                                className="flex items-center gap-2 bg-red-500/30 hover:bg-red-500/40 disabled:opacity-40 disabled:cursor-not-allowed text-red-200 border border-red-500/60 px-5 py-2.5 rounded-xl font-bold uppercase tracking-widest text-xs transition-all"
                            >
                                {deleting ? <><Loader2 size={14} className="animate-spin" /> Deleting…</> : <><Trash2 size={14} /> Delete Forever</>}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div className="mt-12 pt-6 border-t border-white/5 flex justify-between items-center text-[10px] text-gray-600 font-mono">
                <span>TASKORIA VERSION 1.0.4-BETA</span>
                <span className="text-rpg-gold/40">Sangar Studio © {new Date().getFullYear()}</span>
            </div>
        </div>
    );
};

export default Settings;
