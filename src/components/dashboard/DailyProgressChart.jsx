import React, { useMemo } from 'react';
import { useGame } from '../../context/GameContext';
import PixelIcon from '../common/PixelIcon';

const DailyProgressChart = () => {
    const { state } = useGame();
    const { completedTasks } = state;

    // Process data for the last 7 days
    const chartData = useMemo(() => {
        const today = new Date();
        const days = [];

        // Generate the last 7 days array (including today)
        for (let i = 6; i >= 0; i--) {
            const date = new Date(today);
            date.setDate(date.getDate() - i);
            const dateString = date.toLocaleDateString('en-CA'); // YYYY-MM-DD local format
            const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });

            days.push({
                date: dateString,
                label: dayName,
                completedNum: 0
            });
        }

        // Count completed tasks
        const activityHistory = state.character?.activityHistory || {};

        if (completedTasks) {
            completedTasks.forEach(task => {
                if (task.lastCompleted) {
                    const taskDateObj = new Date(task.lastCompleted);
                    const taskDate = taskDateObj.toLocaleDateString('en-CA'); // use local timezone
                    const dayMatch = days.find(d => d.date === taskDate);
                    // Only use legacy if activityHistory doesn't have an entry for that day
                    if (dayMatch && !activityHistory[taskDate]) {
                        dayMatch.completedNum++;
                    }
                }
            });
        }

        // Apply new activity history
        days.forEach(day => {
            if (activityHistory[day.date]) {
                const data = activityHistory[day.date];
                // Extract tasks count, supporting both legacy numbers and new objects
                day.completedNum = typeof data === 'object' ? (data.tasks || 0) : data;
            }
        });

        // Find the max value to scale the chart
        const maxValue = Math.max(...days.map(d => d.completedNum), 5); // Ensure at least scale of 5

        return { days, maxValue };
    }, [completedTasks, state.character?.activityHistory]);

    return (
        <div className="glass-panel p-5 mb-6 relative overflow-hidden">
            {/* Decorative corner */}
            <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-bl from-rpg-gold/20 to-transparent opacity-50 pointer-events-none"></div>

            <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-heading font-bold text-gray-300 uppercase tracking-widest flex items-center gap-2">
                    <PixelIcon name="star" size={18} className="text-rpg-gold" />
                    7-Day Quest Log
                </h2>
                <span className="text-xs font-bold text-rpg-gold tracking-widest bg-rpg-gold/10 px-3 py-1 rounded-sm border border-rpg-gold/20">
                    WEEKLY REPORT
                </span>
            </div>

            {/* The Pixel Chart Area */}
            <div className="h-40 flex items-end justify-between gap-2 px-2 mt-4 relative">
                {/* Background Grid Lines */}
                <div className="absolute inset-0 flex flex-col justify-between pointer-events-none opacity-10 z-0">
                    <div className="w-full h-px bg-white"></div>
                    <div className="w-full h-px bg-white"></div>
                    <div className="w-full h-px bg-white"></div>
                    <div className="w-full h-px bg-white"></div>
                    <div className="w-full h-px bg-white"></div>
                </div>

                {/* Bars */}
                {chartData.days.map((day, idx) => {
                    const heightPercentage = Math.max((day.completedNum / chartData.maxValue) * 100, 5); // 5% min height for visibility
                    const isToday = idx === 6;

                    return (
                        <div key={day.date} className="flex-1 flex flex-col items-center gap-2 z-10 group relative">
                            {/* Tooltip on hover */}
                            <div className="absolute -top-10 opacity-0 group-hover:opacity-100 transition-opacity bg-black/80 text-white text-[10px] font-bold px-2 py-1 rounded border border-white/20 whitespace-nowrap pointer-events-none">
                                {day.completedNum} Quests
                            </div>

                            {/* The actual bar */}
                            <div className="w-full max-w-[40px] relative flex items-end justify-center">
                                <div
                                    className={`w-full transition-all duration-1000 ease-in-out pixelated shadow-[0_0_10px_rgba(0,0,0,0.5)] ${isToday ? 'bg-rpg-gold' : 'bg-green-500 hover:bg-green-400'}`}
                                    style={{ height: `${heightPercentage}%`, minHeight: '8px', borderTopWidth: '4px', borderTopColor: isToday ? '#fff' : '#88f5a8' }}
                                >
                                    {/* Subtle pixel texture overlay inside the bar */}
                                    <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'linear-gradient(rgba(0,0,0,0.2) 2px, transparent 2px)', backgroundSize: '100% 4px' }}></div>
                                </div>
                            </div>

                            {/* Day Label */}
                            <span className={`text-[10px] font-bold uppercase tracking-wider ${isToday ? 'text-rpg-gold' : 'text-gray-400'}`}>
                                {day.label}
                            </span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default DailyProgressChart;
