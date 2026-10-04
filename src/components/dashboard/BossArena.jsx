import React, { useState } from 'react';
import { useGame } from '../../context/GameContext';
import EnemySprite from '../common/EnemySprite';
import PixelIcon from '../common/PixelIcon';
import FloatingTextLayer from '../common/FloatingTextLayer';
import { bosses } from '../../data/bestiary';
import CardViewer from '../cards/CardViewer';
import { worldCardBase, resolveCard } from '../../utils/bossCards';

const BossArena = () => {
    const { state } = useGame();
    const { activeWorldBoss } = state;
    const [cardOpen, setCardOpen] = useState(false);

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

    const hpCurrent = typeof activeWorldBoss.hp === 'object' ? activeWorldBoss.hp.current : activeWorldBoss.hp;
    const hpMax = typeof activeWorldBoss.hp === 'object' ? activeWorldBoss.hp.max : activeWorldBoss.maxHp;
    const hpPercent = Math.max(0, (hpCurrent / hpMax) * 100);

    const spriteRef = activeWorldBoss.spriteRef
        || bosses.find(b => b.id === 'chaos_herald')?.spriteRef
        || bosses[0]?.spriteRef;

    const worldCard = worldCardBase({ ...activeWorldBoss, spriteRef });
    const stored = (state.character?.bossCards || []).find(c => c.id === worldCard.id);

    return (
        <div
            className="relative overflow-hidden rounded-3xl min-h-[500px] flex flex-col border border-red-900/40"
            style={{ background: 'linear-gradient(135deg, #0d0800 0%, #0a0510 50%, #050208 100%)' }}
        >
            <div
                className="absolute top-0 left-0 w-full h-full pointer-events-none"
                style={{ background: 'radial-gradient(circle at 50% 40%, rgba(185,28,28,0.08), transparent 70%)' }}
            />
            <div className="absolute -top-40 -right-40 w-96 h-96 bg-red-900/10 rounded-full blur-3xl pointer-events-none" />

            {/* Header */}
            <div className="text-center relative z-10 pt-8 pb-4 px-6">
                <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-red-300/60 bg-red-500/10 px-3 py-1 rounded-full border border-red-500/15 inline-block mb-4">
                    Active Threat
                </span>
                <h2 className="text-2xl sm:text-4xl font-display font-extrabold text-white/90 uppercase tracking-tight leading-tight">
                    {activeWorldBoss.name}
                </h2>
                <p className="text-white/30 text-xs mt-2 max-w-lg mx-auto leading-relaxed">
                    Complete Tasks and Habits to deal damage. Your <span className="text-red-400/70 font-bold">Strength</span> stat determines your impact!
                </p>
            </div>

            {/* Boss Arena Display */}
            <div className="flex-1 flex flex-col items-center justify-center relative z-10 px-6 pb-8">
                <div className="relative w-48 h-48 sm:w-64 sm:h-64 flex items-center justify-center mb-6">
                    {/* Boss glow */}
                    <div
                        className="absolute inset-0 rounded-full blur-2xl pointer-events-none"
                        style={{ background: 'radial-gradient(circle, rgba(239,68,68,0.12) 0%, transparent 70%)', transform: 'scale(1.5)' }}
                    />
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 w-32 h-6 bg-black/40 rounded-[100%] blur-sm"></div>

                    <button
                        type="button"
                        onClick={() => setCardOpen(true)}
                        aria-label={`View the ${activeWorldBoss.name} card`}
                        className="relative z-10 rounded-2xl transition-transform duration-200 hover:scale-[1.03] focus-visible:outline focus-visible:outline-2 focus-visible:outline-rpg-gold"
                        style={{ filter: 'drop-shadow(0 0 16px rgba(239,68,68,0.25))' }}
                    >
                        {spriteRef ? (
                            <EnemySprite blueprintKey={spriteRef} scale={3} />
                        ) : (
                            <div className="w-24 h-24 rounded-xl bg-red-900/20 border border-red-900/30 flex items-center justify-center">
                                <PixelIcon name="skull" size={48} className="text-red-400/40" />
                            </div>
                        )}
                    </button>

                    <FloatingTextLayer />
                </div>

                {/* HP Bar */}
                <div className="w-full max-w-md mb-4">
                    <div className="flex justify-between items-baseline mb-1.5">
                        <span className="text-[9px] font-bold uppercase tracking-wider text-red-400/60">HP</span>
                        <span className="font-pixel text-sm text-white/60">
                            {Math.ceil(hpCurrent).toLocaleString()}
                            <span className="text-white/15 mx-0.5">/</span>
                            {hpMax.toLocaleString()}
                        </span>
                    </div>
                    <div className="w-full h-3 bg-black/60 rounded-full overflow-hidden border border-white/5">
                        <div
                            className="h-full rounded-full transition-all duration-1000 ease-out relative bg-gradient-to-r from-red-800 to-red-500"
                            style={{ width: `${hpPercent}%` }}
                        >
                            {hpPercent > 2 && (
                                <div className="absolute right-0 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-red-300 shadow-[0_0_8px_2px_rgba(239,68,68,0.6)]" />
                            )}
                        </div>
                    </div>
                </div>

                {/* Rewards */}
                {activeWorldBoss.rewards && (
                    <div className="flex gap-4 text-[10px] font-bold tracking-wide">
                        <div className="flex items-center gap-1.5 bg-black/40 px-3 py-1.5 rounded-lg border border-white/5">
                            <PixelIcon name="coins" size={12} className="text-rpg-gold/70" />
                            <span className="text-rpg-gold/70">{activeWorldBoss.rewards.gold} G</span>
                        </div>
                        <div className="flex items-center gap-1.5 bg-black/40 px-3 py-1.5 rounded-lg border border-white/5">
                            <PixelIcon name="star" size={12} className="text-amber-400/70" />
                            <span className="text-amber-400/70">{activeWorldBoss.rewards.xp} XP</span>
                        </div>
                    </div>
                )}
            </div>
            {cardOpen && (
                <CardViewer
                    card={stored ? resolveCard(stored) : worldCard}
                    locked={!stored}
                    progress={!stored ? { hp: hpCurrent, maxHp: hpMax } : null}
                    onClose={() => setCardOpen(false)}
                />
            )}
        </div>
    );
};

export default BossArena;
