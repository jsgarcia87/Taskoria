import React from 'react';
import { useGame } from '../../context/GameContext';

const ProductivityHeatmap = () => {
    const { state } = useGame();
    const history = state.character?.activityHistory || {};

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

        let points = 0;
        if (typeof data === 'object') {
            points = (data.tasks || 0) * 10 + (data.minutes || 0);
        } else {
            points = data * 10;
        }

        if (points === 0) return 0;
        if (points < 15) return 1;
        if (points < 40) return 2;
        if (points < 80) return 3;
        return 4;
    };

    const lvlNames = ['Fallow', 'Seedling', 'Growing', 'Flourishing', 'Golden'];

    const tileStyles = [
        { bg: '#2a1f14', border: '#3d2e1f', shadow: 'none' },
        { bg: '#2f3b1a', border: '#4a5a28', shadow: 'none' },
        { bg: '#2d5a1e', border: '#4a8a30', shadow: 'none' },
        { bg: '#3a8a28', border: '#5cb840', shadow: '0 0 4px rgba(74,222,128,0.25)' },
        { bg: '#c8a832', border: '#e8c840', shadow: '0 0 6px rgba(253,223,140,0.4)' },
    ];

    return (
        <div className="glass-card relative overflow-hidden border-white/10 hover:border-rpg-gold/30 transition-all duration-500">
            {/* Soil gradient at the bottom */}
            <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-[#1a1208]/40 to-transparent pointer-events-none" />

            <div className="p-5 relative">
                <div className="flex justify-between items-center mb-4">
                    <div className="flex flex-col">
                        <h3 className="text-gray-400 font-bold uppercase text-[10px] tracking-[0.2em]">The Fields</h3>
                        <p className="text-[9px] text-gray-500 font-medium">12 weeks of growth</p>
                    </div>
                    <div className="flex items-center gap-1.5 text-[8px] text-gray-500 bg-black/40 px-2 py-1 rounded-full border border-white/5">
                        <span className="opacity-60 uppercase tracking-tighter">Fallow</span>
                        <div className="flex gap-0.5">
                            {tileStyles.map((s, i) => (
                                <div
                                    key={i}
                                    className="w-2 h-2 rounded-sm"
                                    style={{
                                        backgroundColor: s.bg,
                                        border: `1px solid ${s.border}`,
                                        boxShadow: s.shadow,
                                    }}
                                />
                            ))}
                        </div>
                        <span className="opacity-60 uppercase tracking-tighter">Golden</span>
                    </div>
                </div>

                <div className="flex flex-wrap gap-[3px] justify-start">
                    {days.map(day => {
                        const level = getIntensity(day);
                        const data = history[day];
                        const s = tileStyles[level];
                        const [y, m, d] = day.split('-');
                        const label = new Date(+y, +m - 1, +d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                        const tooltip = typeof data === 'object'
                            ? `${label}: ${data.tasks || 0} quests · ${data.minutes || 0}m focus — ${lvlNames[level]}`
                            : `${label}: ${data || 0} quests — ${lvlNames[level]}`;

                        return (
                            <div
                                key={day}
                                title={tooltip}
                                className="w-[11px] h-[11px] rounded-sm transition-all hover:scale-150 hover:z-20 cursor-crosshair"
                                style={{
                                    backgroundColor: s.bg,
                                    border: `1px solid ${s.border}`,
                                    boxShadow: s.shadow,
                                }}
                            />
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

export default ProductivityHeatmap;
