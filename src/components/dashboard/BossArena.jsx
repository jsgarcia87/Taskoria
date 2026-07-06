import React from 'react';
import { useGame } from '../../context/GameContext';
import Sprite from '../common/Sprite';
import PixelIcon from '../common/PixelIcon';
import FloatingTextLayer from '../common/FloatingTextLayer';

const BossArena = () => {
    const { state } = useGame();
    const { activeWorldBoss } = state;

    if (!activeWorldBoss || !activeWorldBoss.isActive) {
        return (
            <div className="glass-panel text-center py-20 px-6 rounded-3xl min-h-[400px] flex flex-col justify-center items-center border border-white/5 relative overflow-hidden">
                <div className="absolute inset-0 bg-[url('/img/pattern.png')] bg-repeat opacity-5"></div>
                <div className="relative z-10 space-y-4">
                    <PixelIcon name="star" size={64} className="text-gray-700 mx-auto" />
                    <h2 className="text-3xl font-heading font-bold text-gray-500">The Realm is Safe</h2>
                    <p className="text-gray-600 text-sm max-w-md mx-auto">
                        No World Bosses currently threaten Taskoria. Rest up, brave warriors, for the next challenge approaches.
                    </p>
                </div>
            </div>
        );
    }

    const hpPercent = Math.max(0, (activeWorldBoss.hp.current / activeWorldBoss.hp.max) * 100);
    const hpColor = hpPercent > 50 ? 'from-green-500 to-emerald-400' : hpPercent > 20 ? 'from-yellow-500 to-orange-400' : 'from-red-600 to-red-400';

    return (
        <div className="bg-rpg-panel/80 backdrop-blur-xl border border-red-900/40 rounded-3xl shadow-2xl p-6 sm:p-10 relative overflow-hidden min-h-[500px] flex flex-col">

            {/* Dark magical background effects */}
            <div className="absolute top-0 left-0 w-full h-full pointer-events-none opacity-20 bg-[radial-gradient(circle_at_50%_40%,rgba(185,28,28,0.2),transparent_70%)]"></div>
            <div className="absolute -top-40 -right-40 w-96 h-96 bg-red-900/30 rounded-full blur-3xl pointer-events-none animate-pulse"></div>

            {/* Header */}
            <div className="text-center relative z-10 mb-8">
                <span className="text-red-500 text-[10px] font-bold uppercase tracking-widest border border-red-500/30 bg-red-500/10 px-4 py-1.5 rounded-full inline-block mb-3 shadow-[0_0_15px_rgba(239,68,68,0.2)]">
                    Active Threat
                </span>
                <h2 className="text-3xl sm:text-5xl font-display font-bold text-red-50 text-shadow-glow tracking-wide">
                    {activeWorldBoss.name}
                </h2>
                <p className="text-gray-400 text-sm mt-3 font-sans italic max-w-lg mx-auto leading-relaxed">
                    Complete Tasks and Habits to deal damage. Your <span className="text-red-400 font-bold">Strength</span> stat determines your impact!
                </p>
            </div>

            {/* Boss Arena Display */}
            <div className="flex-1 flex flex-col items-center justify-center relative z-10">
                <div className="relative w-48 h-48 sm:w-64 sm:h-64 flex items-center justify-center -mt-8 mb-6 group">
                    {/* Boss Shadow/Aura */}
                    <div className="absolute inset-0 bg-red-600/20 blur-2xl rounded-full scale-75 group-hover:scale-100 transition-transform duration-1000"></div>
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 w-32 h-6 bg-black/60 rounded-[100%] blur-sm"></div>

                    {/* Boss Sprite Render (Using absolute placeholder logic if missing sprite, or a real sprite if available) */}
                    <div className={`relative z-10 transform scale-150 sm:scale-[2] hover:scale-[2.1] transition-transform duration-500 ${hpPercent < 20 ? 'animate-bounce' : 'animate-breathe'}`}>
                        {activeWorldBoss.sprite ? (
                            <Sprite
                                src={activeWorldBoss.sprite.src}
                                x={activeWorldBoss.sprite.x}
                                y={activeWorldBoss.sprite.y}
                                width={activeWorldBoss.sprite.width}
                                height={activeWorldBoss.sprite.height}
                                scale={2}
                            />
                        ) : (
                            <div className="w-24 h-24 bg-red-900/80 rounded-xl border-4 border-red-950 flex flex-col justify-center items-center shadow-[0_0_30px_rgba(255,0,0,0.3)]">
                                <span className="text-3xl">🐲</span>
                            </div>
                        )}
                    </div>

                    <FloatingTextLayer />
                </div>

                {/* Massive HP Bar */}
                <div className="w-full max-w-2xl bg-black/60 rounded-2xl border-4 border-rpg-panelDark overflow-hidden p-1 shadow-2xl relative mb-8">
                    {/* Tick marks behind bar */}
                    <div className="absolute inset-0 w-full h-full flex justify-between px-1 pointer-events-none opacity-20">
                        {Array.from({ length: 10 }).map((_, i) => (
                            <div key={i} className="h-full w-px bg-white"></div>
                        ))}
                    </div>

                    <div
                        className={`h-6 sm:h-8 rounded-xl bg-gradient-to-r ${hpColor} transition-all duration-1000 ease-out flex items-center justify-end pr-3 shadow-inner relative`}
                        style={{ width: `${hpPercent}%` }}
                    >
                        {/* Shimmer effect inside health bar */}
                        <div className="absolute top-0 bottom-0 left-0 w-full bg-gradient-to-t from-black/20 to-transparent"></div>
                    </div>
                </div>

                {/* Exact HP Numbers & Rewards */}
                <div className="w-full max-w-2xl flex flex-col sm:flex-row justify-between items-center gap-4 bg-black/40 border border-white/5 rounded-2xl p-4 sm:px-6">
                    <div className="text-center sm:text-left">
                        <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest block mb-1">Health Remaining</span>
                        <div className="text-xl sm:text-2xl font-mono font-bold text-white tracking-wider flex items-center gap-2">
                            {activeWorldBoss.hp.current.toLocaleString()}
                            <span className="text-gray-600 text-sm">/ {activeWorldBoss.hp.max.toLocaleString()}</span>
                        </div>
                    </div>

                    <div className="flex gap-4">
                        <div className="text-center bg-yellow-500/10 border border-yellow-500/20 rounded-xl px-4 py-2">
                            <span className="text-[10px] text-yellow-600/80 font-bold uppercase tracking-widest block mb-1">Bounty Gold</span>
                            <span className="text-rpg-gold font-bold flex items-center justify-center gap-1">
                                <PixelIcon name="coins" size={14} /> {activeWorldBoss.rewards.gold}
                            </span>
                        </div>
                        <div className="text-center bg-amber-500/10 border border-amber-500/20 rounded-xl px-4 py-2">
                            <span className="text-[10px] text-amber-600/80 font-bold uppercase tracking-widest block mb-1">Bounty XP</span>
                            <span className="text-amber-400 font-bold flex items-center justify-center gap-1">
                                <PixelIcon name="star" size={14} /> {activeWorldBoss.rewards.xp}
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BossArena;
