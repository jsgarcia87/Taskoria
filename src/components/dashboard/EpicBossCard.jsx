import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { useGame } from '../../context/GameContext';
import EnemySprite from '../common/EnemySprite';
import PixelIcon from '../common/PixelIcon';
import ProjectModal from './ProjectModal';
import { NoThreats } from '../common/PixelEmpty';
import { useConfirm } from '../../context/ConfirmContext';
import { bosses, DUNGEON_ZONES } from '../../data/bestiary';

const ZONE_FRAME = {
    crypt:         { bg: '#1e1228', accent: '#8050a0', glow: 'rgba(128,80,160,0.25)' },
    cavern:        { bg: '#181510', accent: '#8a7860', glow: 'rgba(138,120,96,0.25)' },
    elvenRuins:    { bg: '#0c180c', accent: '#40c870', glow: 'rgba(64,200,112,0.20)' },
    dwarfFortress: { bg: '#181410', accent: '#c0a040', glow: 'rgba(192,160,64,0.25)' },
    chaosTemple:   { bg: '#180808', accent: '#d03020', glow: 'rgba(208,48,32,0.30)' },
    dragonLair:    { bg: '#1a0a04', accent: '#e06000', glow: 'rgba(224,96,0,0.30)' },
    sewer:         { bg: '#101408', accent: '#506830', glow: 'rgba(80,104,48,0.20)' },
};
const GOLD = '#c9a84c';
const GOLD_DIM = '#8a7030';

const DangerPips = ({ label }) => {
    const count = label === 'CATACLYSMIC' ? 4 : label === 'ABERRANT' ? 3 : 2;
    return (
        <div className="flex items-center gap-0.5">
            {Array.from({ length: count }).map((_, i) => (
                <div
                    key={i}
                    className="w-[18px] h-[18px] rounded-full border flex items-center justify-center text-[10px]"
                    style={{ borderColor: GOLD_DIM, background: 'rgba(0,0,0,0.5)', color: GOLD }}
                >
                    ☠
                </div>
            ))}
        </div>
    );
};

const Pinline = () => (
    <div className="w-full h-[1px] flex-shrink-0" style={{ background: `linear-gradient(90deg, transparent 0%, ${GOLD_DIM} 15%, ${GOLD} 50%, ${GOLD_DIM} 85%, transparent 100%)` }} />
);

const CardFront = ({ creatureData, zf, tierLabel }) => (
    <div className="absolute inset-0" style={{ backfaceVisibility: 'hidden' }}>
        {/* Outer black border */}
        <div className="absolute inset-0 rounded-[14px] bg-black" />

        {/* Zone-colored frame */}
        <div
            className="absolute rounded-[10px]"
            style={{
                inset: '5px',
                background: `linear-gradient(160deg, ${zf.accent}40 0%, ${zf.bg} 30%, ${zf.bg} 70%, ${zf.accent}30 100%)`,
            }}
        />

        {/* Inner card content */}
        <div className="absolute rounded-[7px] flex flex-col overflow-hidden" style={{ inset: '9px' }}>
            {/* NAME BAR */}
            <div
                className="flex items-center justify-between px-3 py-1.5 flex-shrink-0"
                style={{ background: 'linear-gradient(180deg, #2a2218 0%, #1a1610 100%)', borderBottom: `1px solid ${GOLD_DIM}` }}
            >
                <h3 className="font-heading font-black text-sm tracking-wide leading-tight truncate mr-2" style={{ color: '#e8dcc8' }}>
                    {creatureData.name}
                </h3>
                <DangerPips label={creatureData.dangerLabel} />
            </div>

            <Pinline />

            {/* ART BOX */}
            <div
                className="relative flex-[5] flex items-center justify-center overflow-hidden"
                style={{ background: `radial-gradient(ellipse at center, ${zf.accent}18 0%, ${zf.bg} 70%, #000 100%)` }}
            >
                <div className="absolute inset-0 pointer-events-none" style={{ background: `radial-gradient(circle at 50% 55%, ${zf.glow} 0%, transparent 60%)` }} />
                <div className="absolute bottom-[8%] left-1/2 -translate-x-1/2 w-3/5 h-[6%] rounded-full pointer-events-none" style={{ background: 'radial-gradient(ellipse, rgba(0,0,0,0.5) 0%, transparent 70%)' }} />
                <div className="relative z-10" style={{ filter: `drop-shadow(0 4px 20px ${zf.glow})` }}>
                    <EnemySprite blueprintKey={creatureData.spriteRef} scale={4} />
                </div>
                <div className="absolute inset-0 pointer-events-none" style={{ boxShadow: 'inset 0 0 40px rgba(0,0,0,0.6)' }} />
            </div>

            <Pinline />

            {/* TYPE LINE */}
            <div
                className="flex items-center justify-between px-3 py-1 flex-shrink-0"
                style={{ background: 'linear-gradient(180deg, #221e14 0%, #181510 100%)', borderTop: `1px solid ${GOLD_DIM}40`, borderBottom: `1px solid ${GOLD_DIM}40` }}
            >
                <span className="text-[11px] font-bold tracking-wide" style={{ color: '#c0b490' }}>{tierLabel}</span>
                <span className="text-[9px] font-bold uppercase tracking-widest" style={{ color: zf.accent }}>{creatureData.dangerLabel}</span>
            </div>

            <Pinline />

            {/* TEXT BOX */}
            <div className="flex-[3] flex flex-col px-3 py-2 overflow-y-auto custom-scrollbar gap-2" style={{ background: 'linear-gradient(180deg, #14120e 0%, #0e0c0a 100%)' }}>
                {creatureData.mechanic && (
                    <p className="text-[12px] leading-relaxed" style={{ color: '#c0b898' }}>{creatureData.mechanic}</p>
                )}
                {creatureData.mechanic && creatureData.lore && (
                    <div className="w-full flex items-center gap-2 py-0.5">
                        <div className="flex-1 h-[1px]" style={{ background: `${GOLD_DIM}40` }} />
                    </div>
                )}
                {creatureData.lore && (
                    <p className="text-[11px] leading-relaxed italic" style={{ color: '#908870' }}>"{creatureData.lore}"</p>
                )}
                {creatureData.title && (
                    <p className="text-[10px] text-right" style={{ color: '#605840' }}>— {creatureData.title}</p>
                )}
            </div>

            <Pinline />

            {/* BOTTOM BAR */}
            <div
                className="flex items-center justify-between px-3 py-1.5 flex-shrink-0"
                style={{ background: 'linear-gradient(180deg, #1a1610 0%, #0e0c08 100%)', borderTop: `1px solid ${GOLD_DIM}40` }}
            >
                <div className="flex items-center gap-3 text-[10px] font-bold tracking-wider">
                    {creatureData.reward && (
                        <>
                            <span style={{ color: '#a08040' }}>
                                <span className="uppercase" style={{ color: '#706040' }}>Bounty </span>
                                {creatureData.reward.xp} XP
                            </span>
                            <span style={{ color: GOLD }}>{creatureData.reward.gold} Gold</span>
                        </>
                    )}
                </div>
                <div
                    className="flex items-center justify-center px-3 py-1 rounded-sm font-pixel text-sm font-bold"
                    style={{ background: 'linear-gradient(135deg, #2a2218 0%, #1a1610 100%)', border: `1.5px solid ${GOLD_DIM}`, color: '#e8dcc8', minWidth: '52px' }}
                >
                    {creatureData.hp.toLocaleString()}
                </div>
            </div>
        </div>
    </div>
);

const CardBack = () => (
    <div
        className="absolute inset-0 rounded-[14px] flex items-center justify-center overflow-hidden"
        style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)', background: '#342c3e' }}
    >
        {/* Gold border inset */}
        <div
            className="absolute rounded-[10px] pointer-events-none"
            style={{ inset: '5px', border: `2px solid ${GOLD_DIM}`, background: 'transparent' }}
        />

        {/* Inner decorative border */}
        <div className="absolute pointer-events-none" style={{ inset: '14px', border: `1px solid ${GOLD_DIM}40`, borderRadius: '6px' }} />

        {/* Shield logo in gold */}
        <img
            src="/icono_taskoria_white.png"
            alt=""
            className="w-2/5"
            style={{
                imageRendering: 'pixelated',
                filter: `drop-shadow(0 0 40px ${GOLD}40) sepia(1) saturate(3) hue-rotate(10deg) brightness(1.1)`,
            }}
        />
    </div>
);

const BossInfoSheet = ({ creatureData, onClose }) => {
    const [flipped, setFlipped] = useState(false);
    const zone = creatureData.zone ? DUNGEON_ZONES[creatureData.zone] : null;
    const zf = ZONE_FRAME[creatureData.zone] || ZONE_FRAME.chaosTemple;
    const tierLabel = zone ? `Legendary Boss — ${zone.name}` : 'Legendary Boss';

    return createPortal(
        <div
            className="fixed inset-0 z-[9999] flex items-center justify-center p-3"
            onClick={onClose}
        >
            <div className="absolute inset-0 bg-black/92 backdrop-blur-md" />

            {/* 3D scene */}
            <div
                className="relative flex-shrink-0"
                style={{ height: '88vh', aspectRatio: '3/4', maxWidth: '92vw', maxHeight: '780px', perspective: '1200px' }}
                onClick={e => e.stopPropagation()}
            >
                {/* Flipper container */}
                <div
                    className="relative w-full h-full cursor-pointer"
                    style={{
                        transformStyle: 'preserve-3d',
                        transition: 'transform 0.7s cubic-bezier(0.4, 0, 0.2, 1)',
                        transform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
                    }}
                    onClick={() => setFlipped(f => !f)}
                >
                    <CardFront creatureData={creatureData} zf={zf} tierLabel={tierLabel} />
                    <CardBack />
                </div>

                {/* Close button — always visible, outside flip */}
                <button
                    onClick={e => { e.stopPropagation(); onClose(); }}
                    className="absolute -top-3 -right-3 w-8 h-8 rounded-full bg-black border border-white/20 flex items-center justify-center text-white/50 hover:text-white hover:border-white/40 transition-colors z-20"
                >
                    ✕
                </button>

                {/* Flip hint on front */}
                {!flipped && (
                    <p className="absolute -bottom-6 left-0 right-0 text-center text-[10px] text-white/25 tracking-widest uppercase pointer-events-none">
                        Tap card to flip
                    </p>
                )}
            </div>
        </div>,
        document.body
    );
};

const EpicBossCard = () => {
    const { state, actions } = useGame();
    const confirm = useConfirm();
    const { epicQuests } = state;
    const [isCreating, setIsCreating] = useState(false);
    const [editingBoss, setEditingBoss] = useState(null);
    const [showBossInfo, setShowBossInfo] = useState(false);

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

    const boss = epicQuests[0];
    const epicSpriteRef = (boss.spriteType && boss.spriteType.startsWith('boss_'))
        ? boss.spriteType
        : bosses[0]?.spriteRef;
    const hpPercent = (boss.currentHp / boss.maxHp) * 100;
    const creatureData = bosses.find(b => b.spriteRef === epicSpriteRef);

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
                        onClick={async () => {
                            if (await confirm({ title: 'Abandon Threat?', message: 'All progress and related project tasks will be lost.', variant: 'danger', confirmText: 'Abandon' })) {
                                actions.deleteEpicQuest(boss.id);
                            }
                        }}
                        className="text-red-400 hover:text-white hover:bg-red-500/20 transition-colors bg-black/40 p-1 rounded border border-white/10"
                        title="Delete Threat"
                    >
                        <PixelIcon name="trash" size={14} />
                    </button>
                </div>
            </div>

            {editingBoss && (
                <ProjectModal
                    onClose={() => setEditingBoss(null)}
                    initialBoss={editingBoss}
                />
            )}

            <div className="flex flex-col md:flex-row gap-6 relative z-10">
                <div className="flex-shrink-0 flex justify-center items-center">
                    <div
                        className="w-28 h-28 bg-black/60 rounded-2xl border-2 border-red-900/40 shadow-inner flex items-center justify-center relative group overflow-hidden cursor-pointer active:scale-95 transition-transform"
                        onClick={() => creatureData && setShowBossInfo(true)}
                    >
                        <div className="absolute inset-0 bg-red-500/5 opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl"></div>
                        <div style={{ filter: 'drop-shadow(0 0 8px rgba(239,68,68,0.2))' }}>
                            <EnemySprite blueprintKey={epicSpriteRef} scale={1.5} />
                        </div>
                        {creatureData && (
                            <div className="absolute bottom-1 right-1 text-white/20 group-hover:text-white/40 transition-colors">
                                <PixelIcon name="book" size={10} />
                            </div>
                        )}
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

            {/* Boss Info Sheet Modal */}
            {showBossInfo && creatureData && (
                <BossInfoSheet creatureData={creatureData} onClose={() => setShowBossInfo(false)} />
            )}
        </div>
    );
};

export default EpicBossCard;
