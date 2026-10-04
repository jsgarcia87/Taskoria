import React, { useState, useEffect } from 'react';
import { useGame } from '../../context/GameContext';
import { TASK_DIFFICULTY } from '../../utils/gameUtils';
import { PressButton } from '../common/PressButton';

const TaskForm = ({ onClose, initialData = null }) => {
    const { actions, familyData, activeProfileId } = useGame();

    const [title, setTitle] = useState('');
    const [assigneeId, setAssigneeId] = useState('self'); // 'self' or a profile ID
    const [difficulty, setDifficulty] = useState(TASK_DIFFICULTY.NORMAL);
    const [dueDate, setDueDate] = useState('');
    const [category, setCategory] = useState('quest');
    const [extraInfo, setExtraInfo] = useState('');
    const [attribute, setAttribute] = useState('none');

    useEffect(() => {
        if (initialData) {
            setTitle(initialData.title || '');
            setDifficulty(initialData.difficulty || TASK_DIFFICULTY.NORMAL);
            setDueDate(initialData.dueDate || '');
            setCategory(initialData.category || 'quest');
            setExtraInfo(initialData.extraInfo || '');
            setAttribute(initialData.attribute || 'none');
            // assignerId is how it's saved in context (who assigned it)
            // But if there's no assignerId, it's either self or unassigned
            // Here we don't perfectly reverse engineer who owns it if cross-profile sync is complex, 
            // but for simplicity we assume 'self' if it's the active user.
            setAssigneeId('self'); // Edit cross-profile assignment logic can be tricky, keeping it simple
        }
    }, [initialData]);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (title.trim()) {
            if (initialData) {
                // Edit existing task
                actions.editTask(initialData.id, {
                    title,
                    difficulty: parseInt(difficulty),
                    dueDate: dueDate || null,
                    category,
                    extraInfo,
                    attribute
                });
            } else {
                // Create new task
                actions.addTask(title, difficulty, dueDate || null, 'none', category, extraInfo, assigneeId, null, attribute);

                // Trigger Push if Assigned to someone else locally
                if (assigneeId !== 'self' && assigneeId !== activeProfileId) {
                    const assignedProfile = familyData?.profiles?.find(p => p.id === assigneeId);
                    if (assignedProfile) {
                        actions.triggerPush('New Bounty Posted! 📜', `You have been assigned: "${title}" complete immediately!`);
                    }
                }
            }

            if (onClose) onClose();
        }
    };

    return (
        <div className="w-full max-w-md mx-auto glass-panel p-6 shadow-2xl ring-1 ring-white/10 animate-in fade-in zoom-in-95">
            <div className="flex justify-between items-center mb-6">
                <h3 className="font-herald text-2xl leading-none text-rpg-gold">
                    {initialData ? 'Edit quest' : 'New quest'}
                </h3>
                {onClose && (
                    <button onClick={onClose} aria-label="Close" className="w-9 h-9 -mr-2 flex items-center justify-center rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-colors">
                        ✕
                    </button>
                )}
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Quest</label>
                    <input
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="What is your mission?"
                        className="w-full bg-black/40 border border-white/10 rounded-xl text-white px-4 py-3 text-sm focus:border-rpg-gold/50 focus:ring-1 focus:ring-rpg-gold/50 outline-none font-sans placeholder:text-gray-600 transition-all"
                        autoFocus
                        required
                    />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Type</label>
                        <select
                            value={category}
                            onChange={(e) => setCategory(e.target.value)}
                            className="w-full bg-black/40 border border-white/10 rounded-xl text-white px-4 py-3 text-sm focus:border-rpg-gold/50 outline-none font-sans cursor-pointer hover:bg-white/5 transition-colors appearance-none"
                        >
                            <option value="quest">Quest</option>
                            <option value="chore">Chore</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Difficulty</label>
                        <select
                            value={difficulty}
                            onChange={(e) => setDifficulty(parseInt(e.target.value))}
                            className="w-full bg-black/40 border border-white/10 rounded-xl text-white px-4 py-3 text-sm focus:border-rpg-gold/50 outline-none font-sans cursor-pointer hover:bg-white/5 transition-colors appearance-none"
                        >
                            <option value={TASK_DIFFICULTY.NORMAL}>Normal</option>
                            <option value={TASK_DIFFICULTY.HARD}>Hard (×3 rewards)</option>
                        </select>
                    </div>
                </div>

                {!initialData && familyData && familyData.profiles && familyData.profiles.length > 1 && (
                    <div>
                        <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Assign to</label>
                        <select
                            value={assigneeId}
                            onChange={(e) => setAssigneeId(e.target.value)}
                            className="w-full bg-black/40 border border-rpg-gold/30 rounded-xl text-rpg-gold px-4 py-3 text-sm focus:border-rpg-gold hover:bg-white/5 outline-none font-sans cursor-pointer transition-colors appearance-none"
                        >
                            <option value="self">Myself (Personal Quest)</option>
                            {familyData.profiles.filter(p => p.id !== activeProfileId).map(profile => (
                                <option key={profile.id} value={profile.id}>{profile.name}</option>
                            ))}
                        </select>
                    </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Due date</label>
                        <input
                            type="date"
                            value={dueDate}
                            onChange={(e) => setDueDate(e.target.value)}
                            className="w-full bg-black/40 border border-white/10 rounded-xl text-white px-4 py-3 text-sm focus:border-rpg-gold/50 focus:ring-1 focus:ring-rpg-gold/50 outline-none font-sans cursor-pointer hover:bg-white/5 transition-colors"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Trains</label>
                        <select
                            value={attribute}
                            onChange={(e) => setAttribute(e.target.value)}
                            className="w-full bg-black/40 border border-white/10 rounded-xl text-white px-4 py-3 text-sm focus:border-rpg-gold/50 hover:bg-white/5 outline-none font-sans cursor-pointer transition-colors appearance-none"
                        >
                            <option value="none">No attribute</option>
                            <option value="str">Strength</option>
                            <option value="int">Intelligence</option>
                            <option value="dex">Dexterity</option>
                            <option value="con">Constitution</option>
                            <option value="cha">Charisma</option>
                            <option value="will">Willpower</option>
                        </select>
                        {attribute !== 'none' && (
                            <p className="mt-1.5 text-[11px] text-gray-500">+{difficulty === TASK_DIFFICULTY.HARD ? 2 : 1} {attribute.toUpperCase()} when completed</p>
                        )}
                    </div>
                </div>

                <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Notes</label>
                    <textarea
                        value={extraInfo}
                        onChange={(e) => setExtraInfo(e.target.value)}
                        placeholder="Sub-tasks, links or details (optional)"
                        className="w-full bg-black/40 border border-white/10 rounded-xl text-white px-4 py-3 text-sm focus:border-rpg-gold/50 focus:ring-1 focus:ring-rpg-gold/50 outline-none font-sans placeholder:text-gray-600 transition-all min-h-[100px] resize-y"
                    />
                </div>

                <div className="flex gap-3 pt-4">
                    {onClose && (
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-5 py-3 text-sm text-gray-300 hover:text-white font-semibold transition-colors rounded-xl hover:bg-white/5"
                        >
                            Cancel
                        </button>
                    )}
                    <PressButton
                        type="submit"
                        className="flex-1 px-4 py-3 text-sm bg-rpg-gold text-rpg-bg font-bold rounded-xl hover:brightness-105 transition-[filter] whitespace-nowrap"
                    >
                        {initialData ? 'Save changes' : 'Add quest'}
                    </PressButton>
                </div>
            </form>
        </div>
    );
};

export default TaskForm;
