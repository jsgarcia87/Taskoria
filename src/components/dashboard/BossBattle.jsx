import React, { useState, useEffect, useRef } from 'react';
import { useGame } from '../../context/GameContext';
import EnemySprite from '../common/EnemySprite';
import PixelIcon from '../common/PixelIcon';
import { bosses } from '../../data/bestiary';

const BossBattle = () => {
    const { state } = useGame();
    const { activeDungeon } = state;

    const prevHpRef = useRef(activeDungeon?.hp);
    const [popups, setPopups] = useState([]);

    useEffect(() => {
        if (activeDungeon && prevHpRef.current !== undefined) {
            if (activeDungeon.hp < prevHpRef.current) {
                const damage = prevHpRef.current - activeDungeon.hp;
                const id = Date.now() + Math.random();
                setPopups(prev => [...prev, { id, damage }]);
                setTimeout(() => setPopups(prev => prev.filter(p => p.id !== id)), 1200);
            }
        }
        if (activeDungeon) prevHpRef.current = activeDungeon.hp;
    }, [activeDungeon?.hp]);

    if (!activeDungeon) return null;

    const hpPercent = Math.max(0, (activeDungeon.hp / activeDungeon.maxHp) * 100);
    const bossData = bosses.find(b => b.id === activeDungeon.bossId);
    const spriteRef = activeDungeon.spriteRef || bossData?.spriteRef;
    const bossName = activeDungeon.name || bossData?.name || 'Weekly Boss';
    const bossTitle = bossData?.title;
    const dangerLabel = activeDungeon.dangerLabel || bossData?.dangerLabel || 'HIGH DANGER';
    const reward = bossData?.reward;

    return (
        <div
            className="relative overflow-hidden rounded-2xl"
            style={{ background: 'linear-gradient(135deg, #0d0800 0%, #0a0510 50%, #050208 100%)' }}
        >
            <style>{`
                @keyframes bossFloatDmg {
                    0% { transform: translate(-50%, 0) scale(1); opacity: 1; }
                    60% { transform: translate(-50%, -24px) scale(1.3); opacity: 0.9; }
                    100% { transform: translate(-50%, -40px) scale(1); opacity: 0; }
                }
            `}</style>

            <div
                className="absolute top-0 right-0 w-48 h-48 rounded-full blur-3xl pointer-events-none"
                style={{ background: 'radial-gradient(circle, rgba(239,68,68,0.06) 0%, transparent 70%)' }}
            />

            <div className="relative z-10 p-5 sm:p-6">
                {/* Header pills */}
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75" />
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500" />
                        </span>
                        <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-red-400/80">
                            Weekly Boss Encounter
                        </span>
                    </div>
                    <span className="text-[9px] font-bold uppercase tracking-[0.15em] text-red-300/60 bg-red-500/10 px-2.5 py-1 rounded-full border border-red-500/15">
                        {dangerLabel}
                    </span>
                </div>

                {/* Boss layout */}
                <div className="flex items-center gap-5 sm:gap-6">
                    {/* Sprite with ambient glow */}
                    <div className="relative shrink-0">
                        <div
                            className="absolute inset-0 rounded-full blur-2xl pointer-events-none -z-10"
                            style={{
                                background: 'radial-gradient(circle, rgba(239,68,68,0.12) 0%, transparent 70%)',
                                transform: 'scale(2)',
                            }}
                        />
                        <div style={{ filter: 'drop-shadow(0 0 10px rgba(239,68,68,0.2))' }}>
                            {spriteRef ? (
                                <EnemySprite blueprintKey={spriteRef} scale={2.5} />
                            ) : (
                                <div className="w-20 h-20 rounded-xl bg-red-900/20 border border-red-900/30 flex items-center justify-center">
                                    <PixelIcon name="skull" size={40} className="text-red-400/60" />
                                </div>
                            )}
                        </div>
                        {/* Floating damage popups */}
                        {popups.map(p => (
                            <div
                                key={p.id}
                                className="absolute left-1/2 top-0 font-pixel font-bold text-lg text-red-400 pointer-events-none z-50"
                                style={{
                                    animation: 'bossFloatDmg 1.2s ease-out forwards',
                                    textShadow: '1px 1px 0 #000, -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000',
                                }}
                            >
                                -{p.damage}
                            </div>
                        ))}
                    </div>

                    {/* Boss info */}
                    <div className="flex-1 min-w-0">
                        <h2 className="text-lg sm:text-xl font-display font-extrabold text-white/90 uppercase tracking-tight leading-none truncate">
                            {bossName}
                        </h2>
                        {bossTitle && (
                            <p className="text-[10px] text-red-300/40 uppercase tracking-wider mt-0.5 truncate">
                                {bossTitle}
                            </p>
                        )}

                        {/* HP bar with glow pip */}
                        <div className="mt-3 mb-1.5 flex justify-between items-baseline">
                            <span className="text-[9px] font-bold uppercase tracking-wider text-red-400/60">HP</span>
                            <span className="font-pixel text-sm text-white/60">
                                {activeDungeon.hp}
                                <span className="text-white/15 mx-0.5">/</span>
                                {activeDungeon.maxHp}
                            </span>
                        </div>
                        <div className="w-full h-2 bg-black/60 rounded-full overflow-hidden border border-white/5">
                            <div
                                className="h-full rounded-full transition-all duration-700 ease-out relative bg-gradient-to-r from-red-800 to-red-500"
                                style={{ width: `${hpPercent}%` }}
                            >
                                {hpPercent > 2 && (
                                    <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-red-300 shadow-[0_0_6px_2px_rgba(239,68,68,0.6)]" />
                                )}
                            </div>
                        </div>

                        {/* Footer: hint + rewards */}
                        <div className="flex items-center justify-between mt-3">
                            <span className="text-[10px] text-white/30">Complete quests to deal damage</span>
                            {reward && (
                                <div className="flex gap-2.5 text-[10px] font-bold tracking-wide">
                                    <span className="text-amber-400/70">{reward.xp} XP</span>
                                    <span className="text-rpg-gold/70">{reward.gold} G</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BossBattle;
