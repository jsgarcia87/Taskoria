import React from 'react';
import { useGame } from '../context/GameContext';
import GardenView from './dashboard/GardenView';
import FocusHero from './dashboard/FocusHero';
import BossBattle from './dashboard/BossBattle';
import EpicBossCard from './dashboard/EpicBossCard';
import TaskList from './dashboard/TaskList';
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

                {/* Banner cloth */}
                <div
                    className="relative flex-1 max-w-4xl flex flex-col items-center justify-center text-center py-2 md:py-3 px-4 md:px-6 my-3 md:my-[15px] border-t-[4px] border-b-[4px] md:border-t-[5px] md:border-b-[5px]"
                    style={{
                        backgroundColor: '#fdef3f',
                        borderColor: '#111',
                        imageRendering: 'pixelated',
                    }}
                >
                    <div className="relative font-pixel text-[14px] md:text-[16px] leading-none tracking-[0.2em] text-[#111] mb-1 uppercase">HELLO</div>
                    <h2 className="relative font-heading font-extrabold text-2xl md:text-4xl text-[#111] tracking-tight my-0">
                        {character?.name || 'Adventurer'}
                    </h2>
                    <p className="relative text-[10px] md:text-xs font-bold text-[#111] tracking-wide mt-1">
                        {capitalizedDay} - Lv. {character?.level || 1} - A great day to adventure.
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
                            <div className="glass-card p-6 relative overflow-hidden group">
                                <div className="absolute -top-10 -right-10 w-32 h-32 bg-rpg-gold/10 rounded-full blur-3xl group-hover:bg-rpg-gold/20 transition-all duration-500"></div>

                                <div className="flex justify-between items-center mb-4 relative z-10">
                                    <h3 className="text-gray-400 font-bold uppercase text-xs tracking-wider">Session Overview</h3>
                                    <button className="text-xs text-rpg-gold hover:text-white transition-colors font-bold" onClick={() => setActiveView('profile')}>View Sheet</button>
                                </div>

                                <div className="grid grid-cols-3 gap-3 relative z-10">
                                    <div className="bg-black/40 p-3 rounded-xl border border-white/5 text-center backdrop-blur-sm">
                                        <div className="text-xl md:text-2xl font-bold text-rpg-blue mb-1 text-shadow-glow">00:00</div>
                                        <div className="text-[10px] text-gray-500 uppercase font-bold tracking-wider">Focus</div>
                                    </div>
                                    <div className="bg-black/40 p-3 rounded-xl border border-white/5 text-center backdrop-blur-sm">
                                        <div className="text-xl md:text-2xl font-bold text-rpg-green mb-1 text-shadow-glow">{character?.inventory?.length || 0}</div>
                                        <div className="text-[10px] text-gray-500 uppercase font-bold tracking-wider">Items</div>
                                    </div>
                                    <div className="bg-black/40 p-3 rounded-xl border border-white/5 text-center backdrop-blur-sm">
                                        <div className="text-xl md:text-2xl font-bold text-rpg-red mb-1 text-shadow-glow">{(state.log || []).filter(l => l.type === 'damage').length}</div>
                                        <div className="text-[10px] text-gray-500 uppercase font-bold tracking-wider">Battles</div>
                                    </div>
                                </div>
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

                {/* Sidebar (Quest Log + Daily Missions) — visible from md+ so iPad portrait has it too */}
                <div className="hidden md:block col-span-4 space-y-4">
                    <DailyMissions />
                    <div className="glass-panel mt-0 p-0 rounded-2xl overflow-hidden flex flex-col border border-white/10 shadow-glass">
                        <div className="p-4 border-b border-white/10 bg-white/5 flex justify-between items-center backdrop-blur-md">
                            <h2 className="text-sm font-bold text-rpg-gold uppercase tracking-wider flex items-center gap-2 font-heading">
                                <PixelIcon name="checkSquare" size={16} /> Quest Log
                            </h2>
                            <span className="text-[10px] bg-rpg-gold/20 text-rpg-gold px-2 py-0.5 rounded-full border border-rpg-gold/30 font-bold">{activeTasks.length} Active</span>
                        </div>
                        <div className="flex-1 overflow-y-auto p-4 custom-scrollbar bg-black/20">
                            <TaskList isSidebar={true} />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
