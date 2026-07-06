import React, { useState } from 'react';
import PixelIcon from './common/PixelIcon';
import { useGame } from '../context/GameContext';
import { useToast } from './common/Toast';
import { Settings as SettingsIcon, X, Monitor, Clock, Mail, Send, Lightbulb } from 'lucide-react';

const SUPPORT_EMAIL = 'taskoriaapp@gmail.com';

const Settings = ({ onClose, currentUser }) => {
    const { state, dispatch } = useGame();
    const { screensaverSettings } = state;
    const toast = useToast();

    const [suggestion, setSuggestion] = useState('');
    const [sendingSuggestion, setSendingSuggestion] = useState(false);

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
                toast.success(data.message || 'Suggestion sent!');
                setSuggestion('');
            } else {
                toast.error(data.error || 'Could not send your suggestion.');
            }
        } catch (e) {
            toast.error('Could not reach the server. Try again later.');
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
            </div>

            <div className="mt-12 pt-6 border-t border-white/5 flex justify-between items-center text-[10px] text-gray-600 font-mono">
                <span>TASKORIA VERSION 1.0.4-BETA</span>
                <span className="text-rpg-gold/40">Sangar Studio © 2024</span>
            </div>
        </div>
    );
};

export default Settings;
