import React from 'react';
import { useGame } from '../../context/GameContext';

const ProductivityHeatmap = () => {
    const { state } = useGame();
    const history = state.character?.activityHistory || {};

    // Get last 12 weeks (84 days) to fit nicely
    const days = [];
    const now = new Date();
    for (let i = 83; i >= 0; i--) {
        const d = new Date();
        d.setDate(now.getDate() - i);
        days.push(d.toLocaleDateString('en-CA'));
    }

    const getIntensity = (day) => {
        const data = history[day];
        if (!data) return 0;
        
        // Intensity logic: tasks are worth 10 points, minutes are worth 1 point
        // This is flexible and can be tuned.
        let points = 0;
        if (typeof data === 'object') {
            points = (data.tasks || 0) * 10 + (data.minutes || 0);
        } else {
            // Support legacy simple counters
            points = data * 10;
        }

        if (points === 0) return 0;
        if (points < 15) return 1;  // Light activity
        if (points < 40) return 2;  // Moderate
        if (points < 80) return 3;  // High
        return 4;                   // Legendary
    };

    const colors = [
        'bg-white/5 border border-white/5',
        'bg-green-900/40 border border-green-800/20',
        'bg-green-700/60 border border-green-600/30',
        'bg-green-500/80 border border-green-400/40 shadow-[0_0_5px_rgba(34,197,94,0.3)]',
        'bg-green-400 border border-green-300 shadow-[0_0_8px_rgba(34,197,94,0.5)]'
    ];

    return (
        <div className="glass-card p-5 relative overflow-hidden group border-white/10 hover:border-rpg-gold/30 transition-all duration-500">
            <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-green-500/5 rounded-full blur-3xl group-hover:bg-green-500/10 transition-all duration-500"></div>
            
            <div className="flex justify-between items-center mb-4 relative z-10">
                <div className="flex flex-col">
                    <h3 className="text-gray-400 font-bold uppercase text-[10px] tracking-[0.2em]">Focus Consistency</h3>
                    <p className="text-[9px] text-gray-600 font-medium">Last 12 weeks of activity</p>
                </div>
                <div className="flex items-center gap-1.5 text-[8px] text-gray-500 bg-black/40 px-2 py-1 rounded-full border border-white/5">
                    <span className="opacity-60 uppercase tracking-tighter">Less</span>
                    <div className="flex gap-0.5">
                        {colors.map((c, i) => <div key={i} className={`w-1.5 h-1.5 rounded-xs ${c}`}></div>)}
                    </div>
                    <span className="opacity-60 uppercase tracking-tighter">More</span>
                </div>
            </div>
            
            <div className="flex flex-wrap gap-1 justify-start relative z-10">
                {days.map(day => {
                    const level = getIntensity(day);
                    const data = history[day];
                    const tooltip = typeof data === 'object' 
                        ? `${day}: ${data.tasks || 0} Quests, ${data.minutes || 0}m Focus`
                        : `${day}: ${data || 0} Quests Completed`;

                    return (
                        <div
                            key={day}
                            title={tooltip}
                            className={`w-[11px] h-[11px] rounded-sm ${colors[level]} transition-all hover:scale-150 hover:z-20 cursor-crosshair`}
                        />
                    );
                })}
            </div>
        </div>
    );
};

export default ProductivityHeatmap;
