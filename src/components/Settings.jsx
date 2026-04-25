import React from 'react';
import PixelIcon from './common/PixelIcon';
import { useGame } from '../context/GameContext';
import { Settings as SettingsIcon, X, Monitor, Clock } from 'lucide-react';

const Settings = ({ onClose }) => {
    const { state, dispatch } = useGame();
    const { screensaverSettings } = state;

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
        <div className="bg-[#1a102e]/80 backdrop-blur-2xl border border-white/10 rounded-3xl p-6 md:p-8 shadow-2xl max-w-2xl mx-auto animate-in zoom-in-95 duration-300">
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

                {/* More settings placeholders can go here */}
                <div className="p-4 rounded-xl border border-dashed border-white/10 flex items-center justify-center opacity-40">
                    <p className="text-xs text-gray-500 italic font-mono uppercase tracking-[0.2em]">Future Updates Incoming...</p>
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
