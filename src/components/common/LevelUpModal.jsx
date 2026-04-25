import React, { useEffect } from 'react';
import { ChevronUp } from 'lucide-react';
import { playLevelUpSound } from '../../utils/sound';

const LevelUpModal = ({ data, onClose }) => {

    useEffect(() => {
        try { playLevelUpSound(); } catch (e) { } // Play sound immediately on mount
    }, []);

    if (!data) return null;

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-md animate-in fade-in duration-500 overflow-hidden">
            <div className="relative z-10 w-full max-w-sm flex flex-col items-center">

                {/* Main Level Up Card - Minimalist */}
                <div className="w-full bg-[#1a102e]/80 border border-white/10 rounded-3xl p-8 backdrop-blur-xl shadow-2xl flex flex-col items-center animate-in slide-in-from-bottom-8 fade-in duration-700">

                    {/* Subtle Glow Behind Text */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 bg-purple-500/20 rounded-full blur-3xl pointer-events-none"></div>

                    <div className="text-gray-400 font-bold uppercase tracking-[0.3em] text-[10px] mb-1 z-10">Ascension</div>
                    <div className="text-5xl font-display font-light text-white tracking-widest z-10 mb-2">
                        LEVEL <span className="font-bold text-rpg-gold text-shadow-glow">{data.level}</span>
                    </div>

                    {/* Decorative Divider */}
                    <div className="flex items-center gap-4 w-full justify-center my-6 z-10">
                        <div className="h-px w-16 bg-gradient-to-r from-transparent to-white/20"></div>
                        <div className="w-2 h-2 rounded-full border border-rpg-gold shadow-[0_0_10px_rgba(251,191,36,0.6)]"></div>
                        <div className="h-px w-16 bg-gradient-to-l from-transparent to-white/20"></div>
                    </div>

                    <div className="text-xs text-gray-500 uppercase tracking-widest font-bold mb-4">Stat Increases</div>

                    {/* Stat Increases Grid */}
                    <div className="w-full grid grid-cols-3 gap-3 z-10">
                        {['str', 'int', 'dex', 'con', 'will', 'cha'].map((stat) => (
                            <div key={stat} className="bg-black/40 border border-white/5 rounded-xl p-3 flex flex-col items-center transition-all">
                                <span className="text-gray-500 text-[9px] font-bold uppercase tracking-widest">{stat}</span>
                                <div className="text-white font-mono text-lg mt-1 flex items-center gap-1">
                                    {data.stats[stat] || 10}
                                    <ChevronUp size={12} className="text-gray-400" />
                                </div>
                            </div>
                        ))}
                    </div>

                    <button
                        onClick={onClose}
                        className="mt-8 w-full bg-white/5 hover:bg-white/10 border border-white/10 py-3 text-sm text-gray-300 font-bold uppercase tracking-widest rounded-xl transition-all hover:text-white"
                    >
                        Continue Journey
                    </button>

                </div>
            </div>
        </div>
    );
};

export default LevelUpModal;
