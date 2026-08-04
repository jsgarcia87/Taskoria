import React from 'react';
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

    const now = new Date();
    const todayLocalDate = now.toLocaleDateString('en-CA');
    const weekDay = now.toLocaleDateString('en-US', { weekday: 'long' });
    const capitalizedDay = weekDay.charAt(0).toUpperCase() + weekDay.slice(1);
    const greeting = getGreeting(
        character?.name || 'Adventurer',
        activeTasks.length,
        character?.level || 1,
        now.getDay(),
    );

    const overdueTasks = activeTasks.filter(t => t.dueDate && t.dueDate < todayLocalDate);
    const dueTodayTasks = activeTasks.filter(t => t.dueDate && t.dueDate === todayLocalDate);
    const urgentTasks = [...overdueTasks, ...dueTodayTasks];
    const upcomingSorted = [...activeTasks].sort((a, b) => {
        if (a.dueDate && b.dueDate) return a.dueDate.localeCompare(b.dueDate);
        if (a.dueDate) return -1;
        if (b.dueDate) return 1;
        return 0;
    });
    const peekTasks = upcomingSorted.slice(0, 3);

    const shouldReduce = useReducedMotion();
    const { scrollY } = useScroll();
    const bannerScaleX = useTransform(scrollY, [0, 160], [1, 0.12]);
    const bannerScaleY = useTransform(scrollY, [0, 160], [1, 0.55]);
    const bannerOpacity = useTransform(scrollY, [30, 150], [1, 0]);
    const bannerWrapperY = useTransform(scrollY, [0, 160], [0, -32]);
    const scrollStyle = shouldReduce ? {} : {
        y: bannerWrapperY,
        scaleX: bannerScaleX,
        scaleY: bannerScaleY,
        opacity: bannerOpacity,
        transformOrigin: 'center top',
        willChange: 'transform, opacity',
    };
    const clothStyle = { backgroundColor: '#fedf8c', borderColor: '#111', imageRendering: 'pixelated' };

    const stagger = (i) => shouldReduce ? {} : {
        initial: { opacity: 0, y: 16 },
        animate: { opacity: 1, y: 0 },
        transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1], delay: i * 0.09 },
    };

    return (
        <div className="col-span-12 space-y-6 pb-20 md:pb-0">

            {/* ── SCROLL BANNER — pergamino con info del dia integrada ── */}
            <motion.div
                style={scrollStyle}
                className="relative flex items-center justify-center animate-in fade-in slide-in-from-top-2 duration-700 px-2 md:px-0"
            >
                <div className="relative shrink-0 self-stretch flex flex-col w-6 md:w-[30px]">
                    <BannerHolderContent />
                </div>

                <div
                    className="relative flex-1 max-w-4xl flex flex-col items-center justify-center text-center py-3 md:py-4 px-4 md:px-6 my-3 md:my-[15px] border-t-[4px] border-b-[4px] md:border-t-[5px] md:border-b-[5px]"
                    style={clothStyle}
                >
                    <h2
                        className="relative font-heading font-extrabold text-[#111] my-0 leading-[0.9]"
                        style={{
                            fontSize: 'clamp(24px, 6vw, 52px)',
                            letterSpacing: '-0.03em',
                        }}
                    >
                        {character?.name || 'Adventurer'}
                    </h2>
                    <div className="relative flex items-center justify-center gap-2 mt-1.5 flex-wrap">
                        <span className="text-[#111] text-[11px] font-bold uppercase tracking-wider opacity-60">{capitalizedDay}</span>
                        <span className="text-[#111] opacity-30">·</span>
                        <span className="text-[#111] text-[11px] font-bold uppercase tracking-wider opacity-60">Lv. {character?.level || 1}</span>
                        <span className="text-[#111] opacity-30">·</span>
                        <span className="text-[11px] font-bold uppercase tracking-wider" style={{ color: activeTasks.length === 0 ? '#166534' : '#92400e' }}>
                            {activeTasks.length === 0 ? 'All clear' : `${activeTasks.length} quest${activeTasks.length !== 1 ? 's' : ''}`}
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
                </div>

                <div className="relative shrink-0 self-stretch flex flex-col w-6 md:w-[30px]">
                    <BannerHolderContent />
                </div>
            </motion.div>

            {/* ── MOBILE: task peek — top urgent/active quests ─────────── */}
            {peekTasks.length > 0 && (
                <div className="md:hidden glass-card border-white/10 overflow-hidden">
                    <div className="flex items-center justify-between px-4 pt-3 pb-2">
                        <h3 className="text-[10px] text-gray-400 uppercase tracking-widest font-bold">
                            {urgentTasks.length > 0 ? 'Needs attention' : 'Active quests'}
                        </h3>
                        <button
                            onClick={() => setActiveView('tasks')}
                            className="text-[10px] text-rpg-gold font-bold uppercase tracking-wider hover:text-white transition-colors"
                        >
                            See all ({activeTasks.length})
                        </button>
                    </div>
                    <div className="divide-y divide-white/5">
                        {peekTasks.map(task => (
                            <button
                                key={task.id}
                                onClick={() => setActiveView('tasks')}
                                className="w-full text-left px-4 py-2.5 flex items-center gap-3 hover:bg-white/5 transition-colors"
                            >
                                <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${task.dueDate && task.dueDate < todayLocalDate ? 'bg-red-400' : task.dueDate === todayLocalDate ? 'bg-amber-400' : 'bg-gray-500'}`} />
                                <span className="text-sm text-gray-200 truncate flex-1">{task.title}</span>
                                {task.dueDate && task.dueDate <= todayLocalDate && (
                                    <span className={`text-[9px] font-bold uppercase tracking-wider shrink-0 ${task.dueDate < todayLocalDate ? 'text-red-400' : 'text-amber-400'}`}>
                                        {task.dueDate < todayLocalDate ? 'Overdue' : 'Today'}
                                    </span>
                                )}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                {/* Main Content (Left/Center) — 8 cols from md+ so tablet portrait gets the sidebar */}
                <div className="col-span-12 md:col-span-8 flex flex-col gap-6">

                    {/* ── Mobile: DailyMissions + Habits inline (before garden) ── */}
                    <motion.div {...stagger(0)} className="md:hidden order-1 space-y-4">
                        <DailyMissions />
                    </motion.div>

                    {/* Upper Row: Garden + Stats — on mobile, pushed after tasks */}
                    <motion.div {...stagger(0)} className="grid grid-cols-1 xl:grid-cols-2 gap-6 order-2">
                        <div className="grid grid-cols-1 gap-6">
                            <div
                                className="glass-card p-6 overflow-hidden relative group border-white/10 hover:border-white/20 transition-all min-h-[300px] flex flex-col justify-center"
                            >
                                <GardenView setActiveView={setActiveView} />
                            </div>
                        </div>

                        <div className="space-y-6">
                            {/* Today's Ledger */}
                            <div className="glass-card p-6 relative overflow-hidden group">
                                <div className="absolute -top-10 -right-10 w-32 h-32 bg-rpg-gold/10 rounded-full blur-3xl group-hover:bg-rpg-gold/20 transition-all duration-500"></div>

                                <div className="flex justify-between items-center mb-4 relative z-10">
                                    <h3 className="text-gray-400 font-bold uppercase text-xs tracking-wider">Today's Ledger</h3>
                                    <button className="text-xs text-rpg-gold hover:text-white transition-colors font-bold" onClick={() => setActiveView('profile')}>View Sheet</button>
                                </div>

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
                                    const focusTime = `${String(Math.floor(focusMins / 60)).padStart(2, '0')}:${String(focusMins % 60).padStart(2, '0')}`;
                                    return (
                                        <div className="relative z-10 grid grid-cols-3 gap-2 mt-1">
                                            <div className="flex flex-col items-center justify-center text-center rounded-xl py-3 px-1 bg-rpg-blue/10">
                                                <span
                                                    className="font-bold text-rpg-blue text-shadow-glow block"
                                                    style={{ fontFamily: "'VT323', monospace", fontSize: '2rem', lineHeight: 1.15 }}
                                                >
                                                    {focusTime}
                                                </span>
                                                <span className="text-gray-400 font-bold uppercase tracking-wider mt-1" style={{ fontSize: 10, letterSpacing: '0.05em' }}>Focus Time</span>
                                            </div>
                                            <div className="flex flex-col items-center justify-center text-center rounded-xl py-3 px-1 bg-rpg-red/10">
                                                <span
                                                    className="font-bold text-rpg-red text-shadow-glow block"
                                                    style={{ fontFamily: "'VT323', monospace", fontSize: '2rem', lineHeight: 1.15 }}
                                                >
                                                    {battles}
                                                </span>
                                                <span className="text-gray-400 font-bold uppercase tracking-wider mt-1" style={{ fontSize: 10, letterSpacing: '0.05em' }}>Battles Fought</span>
                                            </div>
                                            <div className="flex flex-col items-center justify-center text-center rounded-xl py-3 px-1 bg-rpg-green/10">
                                                <span
                                                    className="font-bold text-rpg-green text-shadow-glow block"
                                                    style={{ fontFamily: "'VT323', monospace", fontSize: '2rem', lineHeight: 1.15 }}
                                                >
                                                    {items}
                                                </span>
                                                <span className="text-gray-400 font-bold uppercase tracking-wider mt-1" style={{ fontSize: 10, letterSpacing: '0.05em' }}>Items Gathered</span>
                                            </div>
                                        </div>
                                    );
                                })()}
                            </div>

                            <FocusHero />
                        </div>
                    </motion.div>

                    {/* EPIC QUEST SECTION */}
                    <motion.div {...stagger(1)} className="mb-6 grid grid-cols-1 xl:grid-cols-2 gap-6 order-3">
                        <EpicBossCard />
                        <ProductivityHeatmap />
                    </motion.div>

                    {/* BOSS BATTLE SECTION */}
                    <motion.div {...stagger(2)} className="glass-card p-1 border-white/5 min-h-[200px] order-4">
                        <BossBattle />
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
