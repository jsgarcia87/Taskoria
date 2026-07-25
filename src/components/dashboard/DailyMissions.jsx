import React from 'react';
import { Target, Sparkles, Check } from 'lucide-react';
import { useGame } from '../../context/GameContext';

/**
 * DailyMissions — compact panel showing the day's 3 missions.
 * Reads the character's `dailyMissions` array (auto-generated in CHECK_PENALTIES)
 * and lets the player CLAIM rewards once a mission's progress hits its target.
 */
const DailyMissions = () => {
    const { state, dispatch } = useGame();
    const missions = state.character?.dailyMissions || [];

    if (!missions.length) return null;

    const claimed = missions.filter(m => m.claimed).length;
    const allDone = claimed === missions.length;

    return (
        <div className="glass-card p-4 border border-white/10 rounded-2xl space-y-3">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <div className={`w-8 h-8 rounded-lg ${allDone ? 'bg-emerald-500/20 border border-emerald-500/40' : 'bg-rpg-gold/15 border border-rpg-gold/40'} flex items-center justify-center`}>
                        <Target size={16} className={allDone ? 'text-emerald-400' : 'text-rpg-gold'} />
                    </div>
                    <div>
                        <h3 className="text-sm font-heading font-bold text-white">Daily Missions</h3>
                        <p className="text-[10px] text-gray-500 uppercase tracking-widest">Resets at midnight</p>
                    </div>
                </div>
                <span className={`text-[10px] uppercase font-bold tracking-widest px-2 py-1 rounded-full border ${allDone ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300' : 'bg-white/5 border-white/10 text-gray-400'}`}>
                    {claimed}/{missions.length} done
                </span>
            </div>

            <div className="space-y-2">
                {missions.map(m => {
                    const ready = m.progress >= m.target && !m.claimed;
                    const pct = Math.min(100, Math.round((m.progress / m.target) * 100));
                    return (
                        <div
                            key={m.id}
                            className={`relative overflow-hidden rounded-xl p-3 border transition-all ${
                                m.claimed
                                    ? 'bg-emerald-500/5 border-emerald-500/20'
                                    : ready
                                        ? 'bg-rpg-gold/10 border-rpg-gold/40 shadow-[0_0_15px_rgba(251,191,36,0.15)]'
                                        : 'bg-black/30 border-white/5'
                            }`}
                        >
                            {/* Progress fill behind */}
                            <div
                                className={`absolute inset-y-0 left-0 ${
                                    m.claimed ? 'bg-emerald-500/10' : ready ? 'bg-rpg-gold/15' : 'bg-white/[0.03]'
                                }`}
                                style={{ width: `${pct}%`, transition: 'width 600ms cubic-bezier(0.22, 1, 0.36, 1)' }}
                            />
                            <div className="relative flex items-center justify-between gap-2">
                                <div className="flex-1 min-w-0">
                                    <div className={`text-sm font-bold truncate ${m.claimed ? 'text-emerald-300 line-through' : 'text-white'}`}>{m.title}</div>
                                    <div className="text-[11px] text-gray-400 flex items-center gap-2 mt-0.5">
                                        <span>{m.progress}/{m.target}</span>
                                        <span className="text-rpg-gold/80">+{m.rewardXp} XP</span>
                                        <span className="text-amber-400/80">+{m.rewardGold} G</span>
                                    </div>
                                </div>
                                {m.claimed ? (
                                    <div className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest text-emerald-400">
                                        <Check size={12} /> Claimed
                                    </div>
                                ) : ready ? (
                                    <button
                                        onClick={() => dispatch({ type: 'CLAIM_DAILY_MISSION', payload: m.id })}
                                        className="flex items-center gap-1 bg-rpg-gold text-rpg-bg hover:brightness-110 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all"
                                    >
                                        <Sparkles size={11} /> Claim
                                    </button>
                                ) : (
                                    <div className="text-[10px] font-mono text-gray-500">{pct}%</div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default DailyMissions;
