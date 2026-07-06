import React from 'react';
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
const BannerHolder = () => {
    return (
        <div className="relative shrink-0 self-stretch flex flex-col w-6 md:w-[30px]">
            {/* Top SVG */}
            <svg viewBox="0 0 6 4" className="w-full block shrink-0" shapeRendering="crispEdges">
                <rect x="0" y="0" width="6" height="1" fill="#111" />
                <rect x="0" y="1" width="1" height="1" fill="#111" />
                <rect x="1" y="1" width="4" height="1" fill="#fdef3f" />
                <rect x="5" y="1" width="1" height="1" fill="#111" />
                <rect x="1" y="2" width="1" height="1" fill="#111" />
                <rect x="2" y="2" width="2" height="1" fill="#fdef3f" />
                <rect x="4" y="2" width="1" height="1" fill="#111" />
                <rect x="0" y="3" width="6" height="1" fill="#111" />
            </svg>
            
            {/* Middle Shaft */}
            <svg viewBox="0 0 6 1" preserveAspectRatio="none" className="w-full flex-1 block" shapeRendering="crispEdges">
                <rect x="1" y="0" width="4" height="1" fill="#fdef3f" />
                <rect x="0" y="0" width="1" height="1" fill="#111" />
                <rect x="5" y="0" width="1" height="1" fill="#111" />
            </svg>

            {/* Bottom SVG */}
            <svg viewBox="0 0 6 4" className="w-full block shrink-0" shapeRendering="crispEdges">
                <rect x="0" y="0" width="6" height="1" fill="#111" />
                <rect x="1" y="1" width="1" height="1" fill="#111" />
                <rect x="2" y="1" width="2" height="1" fill="#fdef3f" />
                <rect x="4" y="1" width="1" height="1" fill="#111" />
                <rect x="0" y="2" width="1" height="1" fill="#111" />
                <rect x="1" y="2" width="4" height="1" fill="#fdef3f" />
                <rect x="5" y="2" width="1" height="1" fill="#111" />
                <rect x="0" y="3" width="6" height="1" fill="#111" />
            </svg>
        </div>
    );
};

const Dashboard = ({ setActiveView }) => {
    const { state, actions } = useGame();
    const { character, tasks } = state;
    const activeTasks = tasks.filter(t => !t.completed);

    const weekDay = new Date().toLocaleDateString('en-US', { weekday: 'long' });
    const capitalizedDay = weekDay.charAt(0).toUpperCase() + weekDay.slice(1);

    return (
        <div className="col-span-12 space-y-6 pb-20 md:pb-0">
            {/* PERSONALIZED GREETING — yellow pixel-art scroll banner */}
            <div className="relative flex items-center justify-center animate-in fade-in slide-in-from-top-2 duration-700 px-2 md:px-0">
                {/* Left pole holder (pixel art) */}
                <BannerHolder />

                {/* Banner cloth — refined hierarchy: pixel eyebrow, big display name, serif italic meta */}
                <div
                    className="relative flex-1 max-w-4xl flex flex-col items-center justify-center text-center py-3 md:py-4 px-4 md:px-6 my-3 md:my-[15px] border-t-[4px] border-b-[4px] md:border-t-[5px] md:border-b-[5px]"
                    style={{
                        backgroundColor: '#fdef3f',
                        borderColor: '#111',
                        imageRendering: 'pixelated',
                    }}
                >
                    <div
                        className="relative uppercase leading-none text-[#111] mb-1"
                        style={{
                            fontFamily: "'VT323', monospace",
                            fontSize: '15px',
                            letterSpacing: '0.28em',
                            opacity: 0.75,
                        }}
                    >
                        Hail
                    </div>
                    <h2
                        className="relative font-heading font-extrabold text-[#111] my-0 leading-[0.9]"
                        style={{
                            fontSize: 'clamp(28px, 6vw, 52px)',
                            letterSpacing: '-0.03em',
                        }}
                    >
                        {character?.name || 'Adventurer'}
                    </h2>
                    <p
                        className="relative text-[#111] mt-2"
                        style={{
                            fontFamily: "'EB Garamond', Georgia, serif",
                            fontSize: '13px',
                            fontStyle: 'italic',
                            opacity: 0.85,
                        }}
                    >
                        {capitalizedDay}, Lv. {character?.level || 1} — a fine day to adventure.
                    </p>
                </div>

                {/* Right pole holder (pixel art) */}
                <BannerHolder />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                {/* Main Content (Left/Center) — 8 cols from md+ so tablet portrait gets the sidebar */}
                <div className="col-span-12 md:col-span-8 space-y-6">
                    {/* Upper Row: Garden + Stats */}
                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                        <div className="grid grid-cols-1 gap-6">
                            <div className="glass-card p-6 overflow-hidden relative group border-white/10 hover:border-white/20 transition-all min-h-[300px] flex flex-col justify-center">
                                <GardenView setActiveView={setActiveView} />
                            </div>
                        </div>

                        <div className="space-y-6">
                            {/* Today's Ledger — narrative sentence (was: 3 stat cards) */}
                            <div className="glass-card p-6 relative overflow-hidden group">
                                <div className="absolute -top-10 -right-10 w-32 h-32 bg-rpg-gold/10 rounded-full blur-3xl group-hover:bg-rpg-gold/20 transition-all duration-500"></div>

                                <div className="flex justify-between items-center mb-4 relative z-10">
                                    <h3 className="text-gray-400 font-bold uppercase text-xs tracking-wider">Today's Ledger</h3>
                                    <button className="text-xs text-rpg-gold hover:text-white transition-colors font-bold" onClick={() => setActiveView('profile')}>View Sheet</button>
                                </div>

                                {(() => {
                                    const battles = (state.log || []).filter(l => l.type === 'damage').length;
                                    const items = character?.inventory?.length || 0;
                                    return (
                                        <p
                                            className="relative z-10 leading-relaxed text-gray-300"
                                            style={{
                                                fontFamily: "'EB Garamond', Georgia, serif",
                                                fontSize: '17px',
                                            }}
                                        >
                                            Today you have focused for{' '}
                                            <span
                                                className="font-bold text-rpg-blue text-shadow-glow inline-block align-baseline"
                                                style={{ fontFamily: "'VT323', monospace", fontSize: '24px', lineHeight: 1 }}
                                            >
                                                00:00
                                            </span>
                                            , fought{' '}
                                            <span
                                                className="font-bold text-rpg-red text-shadow-glow inline-block align-baseline"
                                                style={{ fontFamily: "'VT323', monospace", fontSize: '24px', lineHeight: 1 }}
                                            >
                                                {battles}
                                            </span>{' '}
                                            {battles === 1 ? 'battle' : 'battles'} and gathered{' '}
                                            <span
                                                className="font-bold text-rpg-green text-shadow-glow inline-block align-baseline"
                                                style={{ fontFamily: "'VT323', monospace", fontSize: '24px', lineHeight: 1 }}
                                            >
                                                {items}
                                            </span>{' '}
                                            {items === 1 ? 'item' : 'items'}.
                                        </p>
                                    );
                                })()}
                            </div>

                            <FocusHero />
                        </div>
                    </div>

                    {/* EPIC QUEST SECTION */}
                    <div className="mb-6 grid grid-cols-1 xl:grid-cols-2 gap-6">
                        <EpicBossCard />
                        <ProductivityHeatmap />
                    </div>

                    {/* BOSS BATTLE SECTION */}
                    <div className="glass-card p-1 border-white/5 min-h-[200px]">
                        <BossBattle />
                    </div>
                </div>

                {/* Sidebar — Daily Missions, then the Questbook parchment (quests only),
                    then TaskList carrying chores + habits + history in dark theme */}
                <div className="hidden md:block col-span-4 space-y-4">
                    <DailyMissions />
                    <Questbook />
                    <div className="glass-panel mt-0 p-4 rounded-2xl border border-white/10 shadow-glass bg-black/20">
                        <TaskList isSidebar={true} hideQuests={true} />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
