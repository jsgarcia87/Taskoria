import React, { useState } from 'react';
import { useGame } from '../../context/GameContext';
import Sprite from '../common/Sprite';
import PixelIcon from '../common/PixelIcon';
import ProjectModal from './ProjectModal';
import { NoThreats } from '../common/PixelEmpty';

// Mock list of boss sprites available from the items sheet or custom
const BOSS_TYPES = [
    { id: 'dragon', src: '/assets/sprites_items.png', x: -160, y: -64, width: 32, height: 32 },
    { id: 'demon', src: '/assets/sprites_items.png', x: -192, y: -64, width: 32, height: 32 },
    { id: 'golem', src: '/assets/sprites_items.png', x: -224, y: -64, width: 32, height: 32 },
];

const EpicBossCard = () => {
    const { state, actions } = useGame();
    const { epicQuests } = state;
    const [isCreating, setIsCreating] = useState(false);
    const [editingBoss, setEditingBoss] = useState(null);

    // Form state
    const [title, setTitle] = useState('');
    const [hpStr, setHpStr] = useState('1000');

    const handleAdd = (e) => {
        e.preventDefault();
        const hp = parseInt(hpStr) || 1000;
        const xp = Math.floor(hp * 0.5);
        const gold = Math.floor(hp * 0.1);
        const randomSprite = BOSS_TYPES[Math.floor(Math.random() * BOSS_TYPES.length)].id;

        actions.addEpicQuest(title, hp, xp, gold, randomSprite);
        setTitle('');
        setHpStr('1000');
        setIsCreating(false);
    };

    if (!epicQuests || epicQuests.length === 0) {
        return (
            <div className="glass-panel p-6 rounded-2xl flex flex-col items-center justify-center text-center border border-white/10 hover:border-red-500/30 transition-all group relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-red-600/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
                <div className="mb-4 opacity-90 group-hover:opacity-100 transition-opacity">
                    <NoThreats size={96} />
                </div>
                <h3 className="text-xl font-heading font-black text-white tracking-wide mb-2 uppercase">No Active Threats</h3>
                <p className="text-gray-400 text-sm max-w-sm mb-6">The watchtower sees no danger on the horizon. Have a long-term challenge? Summon an Epic Boss to face it.</p>

                {isCreating || editingBoss ? (
                    <ProjectModal
                        onClose={() => {
                            setIsCreating(false);
                            setEditingBoss(null);
                        }}
                        initialBoss={editingBoss}
                    />
                ) : (
                    <button
                        onClick={() => setIsCreating(true)}
                        className="bg-red-600/20 text-red-400 border border-red-500/50 hover:bg-red-600 hover:text-white font-bold px-6 py-3 rounded-xl transition-all shadow-[0_0_15px_rgba(220,38,38,0.2)] uppercase tracking-widest text-xs"
                    >
                        Summon Epic Boss
                    </button>
                )}
            </div>
        );
    }

    const boss = epicQuests[0]; // For now, just show the first active boss
    const bossSpriteDef = BOSS_TYPES.find(b => b.id === boss.spriteType) || BOSS_TYPES[0];
    const hpPercent = (boss.currentHp / boss.maxHp) * 100;

    return (
        <div className="glass-panel rounded-3xl p-6 border-2 border-red-900/50 shadow-[0_0_30px_rgba(220,38,38,0.15)] relative overflow-hidden bg-[#130b14]/90 backdrop-blur-xl">
            {/* Background elements */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-red-600/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
            <div className="absolute bottom-0 left-0 w-40 h-40 bg-orange-600/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2 pointer-events-none"></div>

            <div className="flex items-center justify-between mb-2 relative z-10">
                <span className={`text-[10px] font-bold ${boss.isProject ? 'text-amber-500 border-amber-500/30 bg-amber-950/50' : 'text-red-500 border-red-500/30 bg-red-950/50'} uppercase tracking-widest px-2 py-0.5 border rounded-full`}>
                    {boss.isProject ? 'Epic Project Event' : 'Wild Boss Threat'}
                </span>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setEditingBoss(boss)}
                        className="text-gray-400 hover:text-white transition-colors bg-black/40 p-1 rounded border border-white/10"
                        title="Edit Threat"
                    >
                        <PixelIcon name="edit" size={14} />
                    </button>
                    <button
                        onClick={() => {
                            if (window.confirm("Are you sure you want to abandon this Epic Threat? All progress and related project tasks will be lost.")) {
                                actions.deleteEpicQuest(boss.id);
                            }
                        }}
                        className="text-red-400 hover:text-white hover:bg-red-500/20 transition-colors bg-black/40 p-1 rounded border border-white/10"
                        title="Delete Threat"
                    >
                        <PixelIcon name="trash" size={14} />
                    </button>
                    <span className="text-gray-400 text-xs font-mono font-bold ml-2">LVL ??</span>
                </div>
            </div>

            {/* If they click Edit from the card View, render it over the card */}
            {editingBoss && (
                <ProjectModal
                    onClose={() => setEditingBoss(null)}
                    initialBoss={editingBoss}
                />
            )}

            <div className="flex flex-col md:flex-row gap-6 relative z-10">
                <div className="flex-shrink-0 flex justify-center items-center">
                    <div className="w-28 h-28 bg-black/60 rounded-2xl border-2 border-red-900/40 shadow-inner flex items-center justify-center relative group">
                        <div className="absolute inset-0 bg-red-500/5 opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl"></div>
                        <Sprite
                            src={bossSpriteDef.src}
                            x={bossSpriteDef.x}
                            y={bossSpriteDef.y}
                            width={bossSpriteDef.width}
                            height={bossSpriteDef.height}
                            scale={2.5}
                        />
                    </div>
                </div>

                <div className="flex-grow flex flex-col justify-center">
                    <h3 className="text-2xl font-heading font-black text-white drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)] tracking-wider uppercase leading-none mb-1">
                        {boss.title}
                    </h3>
                    <p className="text-xs text-gray-400 font-mono mb-4">Complete habits and tasks to deal damage.</p>

                    <div className="space-y-1.5 w-full">
                        <div className="flex justify-between text-xs font-bold font-mono tracking-widest">
                            <span className="text-red-400">BOSS HP</span>
                            <span className="text-white drop-shadow-md">{Math.ceil(boss.currentHp)} / {boss.maxHp}</span>
                        </div>
                        <div className="h-4 w-full bg-black/80 rounded-full border border-white/10 overflow-hidden shadow-inner relative">
                            <div
                                className="absolute top-0 left-0 h-full bg-gradient-to-r from-red-800 to-red-500 transition-all duration-1000 ease-out"
                                style={{ width: `${hpPercent}%` }}
                            >
                                <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0IiBoZWlnaHQ9IjQiPgo8cmVjdCB3aWR0aD0iNCIgaGVpZ2h0PSI0IiBmaWxsPSIjZmZmIiBmaWxsLW9wYWNpdHk9IjAuMSIvPjwvc3ZnPg==')] opacity-50"></div>
                            </div>
                        </div>
                    </div>

                    <div className="flex gap-3 mt-4 text-[10px] uppercase font-bold tracking-widest text-gray-400">
                        <span className="bg-black/40 px-3 py-1.5 rounded-lg border border-white/5 flex items-center gap-1">
                            Reward: <span className="text-amber-400">{boss.rewardXp} XP</span>
                        </span>
                        <span className="bg-black/40 px-3 py-1.5 rounded-lg border border-white/5 flex items-center gap-1">
                            Loot: <span className="text-rpg-gold">{boss.rewardGold} G</span>
                        </span>
                    </div>
                </div>
            </div>

            {/* Subtasks for Project Bosses */}
            {boss.isProject && (
                <div className="mt-6 pt-4 border-t border-red-900/30 relative z-10">
                    <h4 className="text-xs font-bold text-red-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                        <PixelIcon name="checkSquare" size={14} /> Mission Objectives
                    </h4>

                    <div className="space-y-2 max-h-48 overflow-y-auto custom-scrollbar pr-2">
                        {state.tasks && state.tasks.filter(t => t.projectId === boss.projectId).map(t => {
                            const isAssignedToMe = !t.assigneeId || t.assigneeId === 'self' || t.assigneeId === state.activeProfileId;

                            return (
                                <div key={t.id} className={`flex items-center gap-3 p-3 rounded-xl border ${t.completed ? 'bg-red-900/20 border-red-500/30 opacity-60' : 'bg-black/40 border-white/5'}`}>
                                    <button
                                        onClick={() => isAssignedToMe && actions.completeTask(t.id)}
                                        disabled={t.completed || !isAssignedToMe}
                                        className={`shrink-0 w-6 h-6 rounded border flex items-center justify-center transition-all ${t.completed ? 'bg-red-500 border-red-400 text-white' :
                                            !isAssignedToMe ? 'bg-black/50 border-white/10 opacity-50 cursor-not-allowed' :
                                                'border-white/20 hover:border-red-400 hover:bg-red-900/30'
                                            }`}
                                    >
                                        {t.completed && <PixelIcon name="check" size={12} />}
                                    </button>
                                    <div className="flex-1">
                                        <p className={`text-sm ${t.completed ? 'text-gray-400 line-through' : 'text-gray-200'}`}>{t.title}</p>
                                    </div>
                                    {!isAssignedToMe && (
                                        <div className="shrink-0 flex items-center gap-1 bg-black/40 px-2 py-1 rounded text-[10px] text-gray-400 border border-white/5 uppercase font-bold tracking-wider">
                                            <PixelIcon name="user" size={10} />
                                            <span>Ally</span>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
};

export default EpicBossCard;
