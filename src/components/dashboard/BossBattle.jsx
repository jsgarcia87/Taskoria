import React, { useState, useEffect, useRef } from 'react';
import { useGame } from '../../context/GameContext';
import { Skull, Trophy, AlertTriangle } from 'lucide-react';

const BossBattle = () => {
    const { state } = useGame();
    const { activeDungeon } = state;

    const prevHpRef = useRef(activeDungeon?.hp);
    const [popups, setPopups] = useState([]);

    useEffect(() => {
        if (activeDungeon && prevHpRef.current !== undefined) {
            if (activeDungeon.hp < prevHpRef.current) {
                const damage = prevHpRef.current - activeDungeon.hp;
                const newPopup = {
                    id: Date.now() + Math.random(),
                    damage: damage,
                    x: Math.floor(Math.random() * 60) + 20, // 20% to 80% left
                };
                setPopups(prev => [...prev, newPopup]);

                setTimeout(() => {
                    setPopups(prev => prev.filter(p => p.id !== newPopup.id));
                }, 1000);
            }
        }
        if (activeDungeon) {
            prevHpRef.current = activeDungeon.hp;
        }
    }, [activeDungeon?.hp]);


    if (!activeDungeon) return null;

    const hpPercent = Math.max(0, (activeDungeon.hp / activeDungeon.maxHp) * 100);

    return (
        <div className="glass-card p-6 relative overflow-hidden group min-h-[180px] flex flex-col justify-between shadow-2xl border-white/10 hover:border-rpg-red/30 transition-all duration-500">
            <style>
                {`
                @keyframes floatDamage {
                    0% { transform: translateY(0) scale(1); opacity: 1; }
                    50% { transform: translateY(-20px) scale(1.5); opacity: 1; }
                    100% { transform: translateY(-40px) scale(1); opacity: 0; }
                }
                .animate-float-damage {
                    animation: floatDamage 1s ease-out forwards;
                    text-shadow: 2px 2px 0 #000, -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000;
                }
                `}
            </style>

            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-20 pointer-events-none bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-rpg-red/20 to-transparent"></div>
            <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-rpg-red/10 rounded-full blur-3xl"></div>

            <div className="relative z-10">
                <div className="flex justify-between items-start mb-6">
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <span className="relative flex h-3 w-3">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rpg-red opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-3 w-3 bg-rpg-red"></span>
                            </span>
                            <h3 className="text-rpg-red font-bold uppercase tracking-[0.2em] text-[10px] font-heading">WEEKLY BOSS ENCOUNTER</h3>
                        </div>
                        <h2 className="text-3xl font-heading font-extrabold text-white text-shadow-glow uppercase leading-none tracking-tight">{activeDungeon.name}</h2>
                    </div>
                    <div className="glass-panel px-3 py-1.5 flex items-center gap-2 border border-rpg-gold/20 shadow-lg shadow-rpg-gold/10">
                        <Trophy size={16} className="text-rpg-gold drop-shadow-glow" />
                        <span className="text-xs text-rpg-gold font-bold font-heading uppercase tracking-wider">Bounty</span>
                    </div>
                </div>

                {/* HP BAR */}
                <div className="mb-2 flex justify-between text-xs font-bold font-mono tracking-wider items-end">
                    <span className="text-rpg-red flex items-center gap-1"><Skull size={12} /> HP</span>
                    <span className="text-white text-shadow-sm">{activeDungeon.hp} <span className="text-gray-500 mx-1">/</span> {activeDungeon.maxHp}</span>
                </div>
                <div className="w-full h-4 bg-black/40 rounded-full overflow-hidden border border-white/5 relative shadow-inner">
                    <div
                        className="h-full bg-gradient-to-r from-red-600 to-rpg-red transition-all duration-500 relative"
                        style={{ width: `${hpPercent}%` }}
                    >
                        <div className="absolute inset-0 bg-white/20 animate-[shimmer_2s_infinite]"></div>
                    </div>
                    {/* Floating Damage Text */}
                    {popups.map(popup => (
                        <div
                            key={popup.id}
                            className="absolute top-0 text-red-400 font-pixel font-bold text-lg pointer-events-none animate-float-damage z-50"
                            style={{ left: `${popup.x}%` }}
                        >
                            -{popup.damage}
                        </div>
                    ))}
                </div>

                <div className="mt-5 flex justify-between items-center text-xs">
                    <p className="text-gray-400 font-medium flex items-center gap-2">
                        <span className="w-1.5 h-1.5 bg-gray-500 rounded-full"></span>
                        Complete quests to deal damage!
                    </p>
                    <p className="uppercase tracking-widest font-bold text-rpg-red bg-rpg-red/5 px-3 py-1 rounded-lg border border-rpg-red/20 flex items-center gap-2">
                        <AlertTriangle size={12} /> High Danger
                    </p>
                </div>
            </div>
        </div>
    );
};

export default BossBattle;
