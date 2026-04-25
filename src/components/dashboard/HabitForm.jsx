import React, { useState, useEffect } from 'react';
import { useGame } from '../../context/GameContext';

const HabitForm = ({ onClose, initialData = null }) => {
    const { actions } = useGame();
    const [title, setTitle] = useState('');
    const [target, setTarget] = useState(1);
    const [extraInfo, setExtraInfo] = useState('');
    const [frequency, setFrequency] = useState('daily');
    const [attribute, setAttribute] = useState('none');

    useEffect(() => {
        if (initialData) {
            setTitle(initialData.title || '');
            setTarget(initialData.target || 1);
            setExtraInfo(initialData.extraInfo || '');
            setFrequency(initialData.frequency || 'daily');
            setAttribute(initialData.attribute || 'none');
        }
    }, [initialData]);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (title.trim()) {
            if (initialData) {
                actions.editHabit(initialData.id, {
                    title,
                    target: parseInt(target),
                    extraInfo,
                    frequency,
                    attribute
                });
            } else {
                actions.addHabit(title, target, extraInfo, frequency, attribute);
            }
            if (onClose) onClose();
        }
    };

    return (
        <div className="w-full max-w-md mx-auto glass-panel p-6 shadow-2xl ring-1 ring-white/10 animate-in fade-in zoom-in-95">
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-heading font-bold text-rpg-blue flex items-center gap-2">
                    <span>🔄</span> {initialData ? 'EDIT HABIT' : 'CREATE HABIT'}
                </h3>
                {onClose && (
                    <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
                        ✕
                    </button>
                )}
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Habit Name</label>
                    <input
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="E.g., Drink Water, Read 10 Pages..."
                        className="w-full bg-black/40 border border-white/10 rounded-xl text-white px-4 py-3 text-sm focus:border-rpg-blue/50 focus:ring-1 focus:ring-rpg-blue/50 outline-none font-sans placeholder:text-gray-600 transition-all"
                        autoFocus
                        required
                    />
                </div>

                <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Target per cycle</label>
                    <div className="flex items-center gap-4 bg-black/40 border border-white/10 rounded-xl px-4 py-2">
                        <input
                            type="range"
                            min="1"
                            max="10"
                            value={target}
                            onChange={(e) => setTarget(parseInt(e.target.value))}
                            className="flex-grow accent-rpg-blue"
                        />
                        <span className="text-xl font-bold text-rpg-blue min-w-[2rem] text-center">{target}</span>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Frequency</label>
                        <select
                            value={frequency}
                            onChange={(e) => setFrequency(e.target.value)}
                            className="w-full bg-black/40 border border-white/10 rounded-xl text-white px-4 py-3 text-sm focus:border-rpg-blue/50 focus:ring-1 focus:ring-rpg-blue/50 outline-none font-sans"
                        >
                            <option value="daily">Daily Reset</option>
                            <option value="weekly">Weekly Reset</option>
                            <option value="monthly">Monthly Reset</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-1">✨ Linked Stat</label>
                        <select
                            value={attribute}
                            onChange={(e) => setAttribute(e.target.value)}
                            className="w-full bg-black/40 border border-rpg-blue/30 rounded-xl text-blue-300 px-4 py-3 text-sm focus:border-rpg-blue hover:bg-white/5 outline-none font-sans cursor-pointer transition-colors appearance-none"
                        >
                            <option value="none">None</option>
                            <option value="str">💪 STR (Strength)</option>
                            <option value="int">🧠 INT (Intelligence)</option>
                            <option value="dex">⚡ DEX (Dexterity)</option>
                            <option value="con">🛡️ CON (Constitution)</option>
                            <option value="cha">🗣️ CHA (Charisma)</option>
                            <option value="will">🧘 WILL (Willpower)</option>
                        </select>
                    </div>
                </div>

                <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Extra Info / Checklist</label>
                    <textarea
                        value={extraInfo}
                        onChange={(e) => setExtraInfo(e.target.value)}
                        placeholder="Add sub-tasks, notes, or a checklist here..."
                        className="w-full bg-black/40 border border-white/10 rounded-xl text-white px-4 py-3 text-sm focus:border-rpg-blue/50 focus:ring-1 focus:ring-rpg-blue/50 outline-none font-sans placeholder:text-gray-600 transition-all min-h-[100px] resize-y"
                    />
                </div>

                <div className="flex gap-3 pt-4">
                    {onClose && (
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-3 text-sm text-gray-400 hover:text-white font-bold transition-colors bg-white/5 hover:bg-white/10 rounded-xl"
                        >
                            CANCEL
                        </button>
                    )}
                    <button
                        type="submit"
                        className="flex-1 px-4 py-3 text-sm bg-rpg-blue text-white font-bold rounded-xl hover:bg-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.4)] transition-all active:scale-95 uppercase tracking-wider"
                    >
                        {initialData ? 'SAVE CHANGES' : 'CREATE HABIT'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default HabitForm;
