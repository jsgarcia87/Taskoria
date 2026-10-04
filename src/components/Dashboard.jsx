import React, { useRef, useState, useLayoutEffect } from 'react';
import { motion, useScroll, useTransform, useReducedMotion } from 'motion/react';
import { useGame } from '../context/GameContext';
import GardenView from './dashboard/GardenView';
import FocusHero from './dashboard/FocusHero';
import BossBattle from './dashboard/BossBattle';
import EpicBossCard from './dashboard/EpicBossCard';
import TaskList from './dashboard/TaskList';
import Questbook from './dashboard/Questbook';
import PixelIcon from './common/PixelIcon';
import ProductivityHeatmap from './dashboard/ProductivityHeatmap';
import DailyMissions from './dashboard/DailyMissions';

// Pixel-art scroll banner end-cap matching the reference image.
// Renderiza sólo los tres SVGs — el contenedor con `self-stretch flex flex-col
// w-6 md:w-[30px]` vive en el padre (así el wrapper puede ser un motion.div
// sin perder el estirado vertical dentro del flex).
const BannerHolderContent = () => (
    <>
        {/* Top SVG */}
        <svg viewBox="0 0 6 4" className="w-full block shrink-0" shapeRendering="crispEdges">
            <rect x="0" y="0" width="6" height="1" fill="#111" />
            <rect x="0" y="1" width="1" height="1" fill="#111" />
            <rect x="1" y="1" width="4" height="1" fill="#fedf8c" />
            <rect x="5" y="1" width="1" height="1" fill="#111" />
            <rect x="1" y="2" width="1" height="1" fill="#111" />
            <rect x="2" y="2" width="2" height="1" fill="#fedf8c" />
            <rect x="4" y="2" width="1" height="1" fill="#111" />
            <rect x="0" y="3" width="6" height="1" fill="#111" />
        </svg>

        {/* Middle Shaft */}
        <svg viewBox="0 0 6 1" preserveAspectRatio="none" className="w-full flex-1 block" shapeRendering="crispEdges">
            <rect x="1" y="0" width="4" height="1" fill="#fedf8c" />
            <rect x="0" y="0" width="1" height="1" fill="#111" />
            <rect x="5" y="0" width="1" height="1" fill="#111" />
        </svg>

        {/* Bottom SVG */}
        <svg viewBox="0 0 6 4" className="w-full block shrink-0" shapeRendering="crispEdges">
            <rect x="0" y="0" width="6" height="1" fill="#111" />
            <rect x="1" y="1" width="1" height="1" fill="#111" />
            <rect x="2" y="1" width="2" height="1" fill="#fedf8c" />
            <rect x="4" y="1" width="1" height="1" fill="#111" />
            <rect x="0" y="2" width="1" height="1" fill="#111" />
            <rect x="1" y="2" width="4" height="1" fill="#fedf8c" />
            <rect x="5" y="2" width="1" height="1" fill="#111" />
            <rect x="0" y="3" width="6" height="1" fill="#111" />
        </svg>
    </>
);

// Contextual greeting system — the scroll speaks differently based on
// time of day, pending quests, and day of the week.
const getGreeting = (name, pendingCount, level, dayIndex) => {
    const hour = new Date().getHours();
    const isWeekend = dayIndex === 0 || dayIndex === 6;

    if (hour >= 5 && hour < 12) {
        const eyebrow = hour < 8 ? 'The dawn breaks' : 'Good morning';
        const lines = pendingCount === 0
            ? 'A clean slate awaits your ambition.'
            : pendingCount <= 3
                ? `${pendingCount} quests lie ahead. A steady morning.`
                : `${pendingCount} quests demand your attention today.`;
        return { eyebrow, line: lines };
    }
    if (hour >= 12 && hour < 17) {
        const eyebrow = 'The sun stands high';
        const lines = pendingCount === 0
            ? 'All quests fulfilled. The realm is proud.'
            : isWeekend
                ? `Even heroes rest. ${pendingCount} quests remain when ready.`
                : `The day is yours. ${pendingCount} quests await.`;
        return { eyebrow, line: lines };
    }
    if (hour >= 17 && hour < 21) {
        const eyebrow = 'The golden hour';
        const lines = pendingCount === 0
            ? 'A day well spent. Rest with honor.'
            : pendingCount <= 2
                ? `Almost there. ${pendingCount} quests before nightfall.`
                : `${pendingCount} quests linger. The evening is still young.`;
        return { eyebrow, line: lines };
    }
    // Night: 21-4
    const eyebrow = 'The stars watch over you';
    const lines = pendingCount === 0
        ? 'The kingdom sleeps soundly tonight.'
        : `${pendingCount} quests for tomorrow. Rest well tonight.`;
    return { eyebrow, line: lines };
};

const Dashboard = ({ setActiveView }) => {
    const { state, actions } = useGame();
    const { character, tasks } = state;
    const activeTasks = tasks.filter(t => !t.completed);

    const [arenaOpen, setArenaOpen] = useState(false);

    const now = new Date();
    const todayLocalDate = now.toLocaleDateString('en-CA');
    const weekDay = now.toLocaleDateString('en-US', { weekday: 'long' });
    const capitalizedDay = weekDay.charAt(0).toUpperCase() + weekDay.slice(1);
    const overdueTasks = activeTasks.filter(t => t.dueDate && t.dueDate < todayLocalDate);
    // Same rule as the Questbook seal: chores and project steps are counted elsewhere.
    const openQuestCount = activeTasks.filter(t => t.category !== 'chore' && !t.projectId).length;

    const shouldReduce = useReducedMotion();
    const { scrollY } = useScroll();

    // Measure the paper's rest width so the holders can travel exactly to the
    // center as the paper winds shut — a real "scroll closing", not a squish.
    const clothRef = useRef(null);
    const [clothWidth, setClothWidth] = useState(0);
    useLayoutEffect(() => {
        const measure = () => setClothWidth(clothRef.current?.offsetWidth || 0);
        measure();
        window.addEventListener('resize', measure);
        return () => window.removeEventListener('resize', measure);
    }, []);

    // Single normalized scroll progress (0 → 1 over ~140px) drives every
    // channel of the "scroll rolls shut" animation so the timing stays coherent.
    const rollProgress = useTransform(scrollY, [0, 140], [0, 1], { clamp: true });
    // Slight lift + late fade — the whole thing quietly retreats.
    const bannerWrapperY = useTransform(rollProgress, [0, 1], [0, -12]);
    const bannerOpacity  = useTransform(rollProgress, [0.9, 1], [1, 0]);
    // Text disappears BEFORE the paper winds away, so no letters get clipped.
    const contentOpacity = useTransform(rollProgress, [0, 0.35], [1, 0]);
    // The paper itself winds onto the rolls: scaleX 1 → ~0 from the center.
    const clothScaleX = useTransform(rollProgress, [0, 1], [1, 0.015]);
    // Holders travel inward by half the paper width each, meeting at center.
    const leftHolderX  = useTransform(rollProgress, v => `${(v * clothWidth) / 2}px`);
    const rightHolderX = useTransform(rollProgress, v => `${-(v * clothWidth) / 2}px`);

    const scrollStyle = shouldReduce ? {} : {
        y: bannerWrapperY,
        opacity: bannerOpacity,
        willChange: 'transform, opacity',
    };
    const clothStyle = {
        backgroundColor: '#fedf8c',
        borderColor: '#111',
        imageRendering: 'pixelated',
        boxShadow: 'inset 0 6px 12px -2px rgba(120, 90, 40, 0.25), inset 0 -6px 12px -2px rgba(120, 90, 40, 0.2), inset 8px 0 16px -8px rgba(120, 90, 40, 0.15), inset -8px 0 16px -8px rgba(120, 90, 40, 0.15)',
        backgroundImage: `
            linear-gradient(180deg, rgba(180, 140, 60, 0.12) 0%, transparent 18%, transparent 82%, rgba(180, 140, 60, 0.10) 100%),
            linear-gradient(90deg, rgba(160, 120, 40, 0.08) 0%, transparent 12%, transparent 88%, rgba(160, 120, 40, 0.08) 100%)
        `,
    };

    const stagger = (i) => shouldReduce ? {} : {
        initial: { opacity: 0, y: 16 },
        animate: { opacity: 1, y: 0 },
        transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1], delay: i * 0.09 },
    };

    return (
        <div className="col-span-12 space-y-6 pb-20 md:pb-0 relative md:min-h-[calc(100vh-5rem)]">

            {/* ── SCROLL BANNER — pergamino con info del dia integrada ──
                On scroll the whole thing "rolls shut": two paper overlays
                sweep in from each side toward the center, holders converge
                slightly, text has already faded. Feels like closing a scroll. */}
            <motion.div
                style={scrollStyle}
                className="relative flex items-center justify-center animate-in fade-in slide-in-from-top-2 duration-700 px-2 md:px-0"
            >
                <motion.div
                    style={shouldReduce ? undefined : { x: leftHolderX }}
                    className="relative shrink-0 self-stretch flex flex-col w-6 md:w-[30px] z-20"
                >
                    <BannerHolderContent />
                </motion.div>

                <motion.div
                    ref={clothRef}
                    style={shouldReduce ? clothStyle : { ...clothStyle, scaleX: clothScaleX, transformOrigin: 'center center' }}
                    className="relative flex-1 max-w-4xl flex flex-col items-center justify-center text-center py-3 md:py-4 px-4 md:px-6 my-3 md:my-[15px] border-t-[4px] border-b-[4px] md:border-t-[5px] md:border-b-[5px] overflow-hidden"
                >
                    <motion.div
                        style={shouldReduce ? undefined : { opacity: contentOpacity }}
                        className="relative flex flex-col items-center justify-center"
                    >
                        <h2
                            className="relative font-herald text-[#111] my-0 leading-[0.9] whitespace-nowrap"
                            style={{
                                fontSize: 'clamp(24px, 6vw, 52px)',
                                letterSpacing: '-0.03em',
                                textShadow: '0 1px 0 rgba(180, 140, 60, 0.4), 0 2px 4px rgba(120, 80, 20, 0.12)',
                            }}
                        >
                            {character?.name || 'Adventurer'}
                        </h2>
                        {/* Pixel ornament divider */}
                        <svg viewBox="0 0 40 5" className="w-16 md:w-20 mt-1.5 mb-1 opacity-40" shapeRendering="crispEdges" style={{ imageRendering: 'pixelated' }}>
                            <rect x="0" y="2" width="12" height="1" fill="#8B7355" />
                            <rect x="14" y="1" width="1" height="3" fill="#8B7355" />
                            <rect x="16" y="0" width="2" height="1" fill="#8B7355" />
                            <rect x="15" y="1" width="4" height="1" fill="#8B7355" />
                            <rect x="16" y="2" width="8" height="1" fill="#8B7355" />
                            <rect x="21" y="1" width="4" height="1" fill="#8B7355" />
                            <rect x="22" y="0" width="2" height="1" fill="#8B7355" />
                            <rect x="25" y="1" width="1" height="3" fill="#8B7355" />
                            <rect x="28" y="2" width="12" height="1" fill="#8B7355" />
                            <rect x="18" y="3" width="4" height="1" fill="#8B7355" />
                            <rect x="19" y="4" width="2" height="1" fill="#8B7355" />
                        </svg>
                        <div className="relative flex items-center justify-center gap-2 mt-0.5 flex-nowrap whitespace-nowrap">
                            <span className="hidden sm:inline text-[11px] font-bold uppercase tracking-wider" style={{ color: '#6B5B3E' }}>{capitalizedDay}</span>
                            <span className="hidden sm:inline" style={{ color: '#6B5B3E', opacity: 0.4 }}>·</span>
                            <span className="text-[11px] font-bold uppercase tracking-wider" style={{ color: '#6B5B3E' }}>Lv. {character?.level || 1}</span>
                            <span style={{ color: '#6B5B3E', opacity: 0.4 }}>·</span>
                            <span className="text-[11px] font-bold uppercase tracking-wider" style={{ color: openQuestCount === 0 ? '#166534' : '#92400e' }}>
                                {openQuestCount === 0 ? 'All clear' : `${openQuestCount} quest${openQuestCount !== 1 ? 's' : ''}`}
                            </span>
                            {overdueTasks.length > 0 && (
                                <>
                                    <span className="text-[#111] opacity-30">·</span>
                                    <span className="text-[11px] font-bold uppercase tracking-wider" style={{ color: '#991b1b' }}>
                                        {overdueTasks.length} overdue
                                    </span>
                                </>
                            )}
                        </div>
                    </motion.div>
                </motion.div>

                <motion.div
                    style={shouldReduce ? undefined : { x: rightHolderX }}
                    className="relative shrink-0 self-stretch flex flex-col w-6 md:w-[30px] z-20"
                >
                    <BannerHolderContent />
                </motion.div>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                {/* Main Content (Left/Center) — 8 cols from md+ so tablet portrait gets the sidebar */}
                <div className="col-span-12 md:col-span-8 flex flex-col gap-6">

                    {/* ── Mobile: Questbook first (utility before scenery) ── */}
                    <motion.div {...stagger(0)} className="md:hidden order-1">
                        <Questbook />
                    </motion.div>

                    {/* Camp scene + the day's numbers, then Focus */}
                    <motion.div {...stagger(0)} className="order-2 flex flex-col gap-6">
                        <div className="glass-card p-3 sm:p-4 border-white/10">
                            <GardenView setActiveView={setActiveView} />
                            {(() => {
                                const battles = (state.log || []).filter(l => l.type === 'damage').length;
                                const items = character?.inventory?.length || 0;
                                const focusMins = Math.max(
                                    0,
                                    ...((character?.dailyMissions || [])
                                        .filter(m => m.kind === 'focus_minutes')
                                        .map(m => m.progress || 0)),
                                    0
                                );
                                const focusLabel = focusMins >= 60
                                    ? `${Math.floor(focusMins / 60)}h ${String(focusMins % 60).padStart(2, '0')}m`
                                    : `${focusMins}m`;
                                const stats = [
                                    { label: 'Focus today', value: focusLabel },
                                    { label: 'Battles', value: battles },
                                    { label: 'In satchel', value: items },
                                ];
                                return (
                                    <div className="mt-3 grid grid-cols-3 divide-x divide-white/10">
                                        {stats.map(stat => (
                                            <div key={stat.label} className="flex flex-col items-center py-1.5">
                                                <span className="font-pixel text-2xl text-white leading-none tabular-nums">{stat.value}</span>
                                                <span className="mt-1 text-[10px] font-bold uppercase tracking-wider text-gray-400">{stat.label}</span>
                                            </div>
                                        ))}
                                    </div>
                                );
                            })()}
                        </div>

                        <FocusHero />
                    </motion.div>

                    {/* Mobile: today's missions after the focus block */}
                    <motion.div {...stagger(1)} className="md:hidden order-3">
                        <DailyMissions />
                    </motion.div>

                    {/* ARENA — combat & analytics, collapsed by default */}
                    <motion.div {...stagger(1)} className="order-4">
                        <button
                            onClick={() => setArenaOpen(prev => !prev)}
                            className="w-full flex items-center justify-between px-1 py-2 group cursor-pointer"
                        >
                            <span className="text-[10px] text-gray-500 uppercase tracking-widest font-bold group-hover:text-gray-300 transition-colors">
                                The Arena
                            </span>
                            <span className={`text-gray-600 text-[10px] transition-transform duration-300 ${arenaOpen ? 'rotate-180' : ''}`}>▼</span>
                        </button>
                        {arenaOpen && (
                            <div className="space-y-6 animate-in fade-in slide-in-from-top-2 duration-300">
                                <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                                    <EpicBossCard />
                                    <ProductivityHeatmap />
                                </div>
                                <BossBattle />
                            </div>
                        )}
                    </motion.div>
                </div>

                {/* Sidebar (desktop only) — Questbook first, then chores + habits, then Daily Missions */}
                <div className="hidden md:block col-span-4 space-y-4">
                    <motion.div {...stagger(0)}><Questbook /></motion.div>
                    <motion.div {...stagger(1)} className="glass-panel mt-0 p-4 rounded-2xl border border-white/10 shadow-glass bg-black/20">
                        <TaskList isSidebar={true} hideQuests={true} />
                    </motion.div>
                    <motion.div {...stagger(2)}><DailyMissions /></motion.div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
