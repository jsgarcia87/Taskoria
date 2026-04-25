import React from 'react';
import { useGame } from '../context/GameContext';
import GardenView from './dashboard/GardenView';
import FocusHero from './dashboard/FocusHero';
import BossBattle from './dashboard/BossBattle';
import EpicBossCard from './dashboard/EpicBossCard';
import TaskList from './dashboard/TaskList';
import PixelIcon from './common/PixelIcon';
import ProductivityHeatmap from './dashboard/ProductivityHeatmap';

const Dashboard = ({ setActiveView }) => {
    const { state, actions } = useGame();
    const { character, tasks } = state;
    const activeTasks = tasks.filter(t => !t.completed);

    const weekDay = new Date().toLocaleDateString('en-US', { weekday: 'long' });
    const capitalizedDay = weekDay.charAt(0).toUpperCase() + weekDay.slice(1);

    return (
        <div className="col-span-12 space-y-6 pb-20 md:pb-0">
            {/* PERSONALIZED GREETING */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-rpg-gold/10 via-transparent to-transparent p-4 rounded-2xl border-l-4 border-rpg-gold backdrop-blur-sm animate-in fade-in slide-in-from-left duration-700">
                <div>
                    <h2 className="text-xl md:text-2xl font-heading font-bold text-white tracking-tight">
                        Hello, <span className="text-rpg-gold">{character?.name}</span>
                    </h2>
                    <p className="text-gray-400 text-sm mt-1">
                        Today is {weekDay}, it's a <span className="text-white font-bold">great day</span> to advance in your adventure.
                    </p>
                </div>
                <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-rpg-gold/60 bg-black/20 px-3 py-1.5 rounded-full border border-white/5">
                    <div className="w-1.5 h-1.5 bg-rpg-gold rounded-full animate-pulse"></div>
                    Current Realm: Taskoria Capital
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                {/* Main Content (Left/Center) */}
                <div className="col-span-12 lg:col-span-8 space-y-6">
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

                {/* Sidebar (Quest Log) - Integrated for perfect alignment */}
                <div className="hidden lg:block col-span-4">
                    <div className="glass-panel h-full mt-0 p-0 rounded-2xl overflow-hidden flex flex-col border border-white/10 shadow-glass">
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
