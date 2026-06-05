import React, { useState } from 'react';
import { useGame } from '../../context/GameContext';
import PixelIcon from '../common/PixelIcon';
import Sprite from '../common/Sprite';
import { useToast } from '../common/Toast';

const BOSS_TYPES = [
    { id: 'dragon', src: '/assets/sprites_items.png', x: -160, y: -64, width: 32, height: 32 },
    { id: 'demon', src: '/assets/sprites_items.png', x: -192, y: -64, width: 32, height: 32 },
    { id: 'golem', src: '/assets/sprites_items.png', x: -224, y: -64, width: 32, height: 32 },
];

const ProjectModal = ({ onClose, initialBoss = null }) => {
    const toast = useToast();
    const { state, actions, familyData, activeProfileId } = useGame();

    // Modes: 'wild' or 'project'
    const [mode, setMode] = useState(initialBoss ? (initialBoss.isProject ? 'project' : 'wild') : 'project');

    // General Boss State
    const [title, setTitle] = useState(initialBoss ? initialBoss.title : '');
    const [hpStr, setHpStr] = useState(initialBoss ? initialBoss.maxHp.toString() : '1000');

    // Project Specific State
    const [tasks, setTasks] = useState(() => {
        if (initialBoss && initialBoss.isProject) {
            // Find tasks for this project across all accessible state (simplifying to current profile's tasks for edit)
            const projectTasks = (state.tasks || []).filter(t => t.projectId === initialBoss.projectId);
            if (projectTasks.length > 0) {
                return projectTasks.map(t => ({ id: t.id, title: t.title, assigneeId: t.assigneeId || 'self' }));
            }
        }
        return [{ title: '', assigneeId: 'self' }];
    });

    // Gather all possible assignees (Family members + Friends)
    const partyMembers = [];
    partyMembers.push({ id: 'self', name: 'Me (Current Hero)' });

    if (familyData && familyData.profiles) {
        familyData.profiles.forEach(p => {
            if (p.id !== activeProfileId) {
                partyMembers.push({ id: p.id, name: p.name + " (Family)" });
            }
        });
    }

    if (familyData && familyData.friends) {
        familyData.friends.forEach(f => {
            // Note: Currently we only really support cross-assigning to local family profiles easily
            // For external friends, it would require a network call. Let's keep it simple for now,
            // or if we support it, just list them and warn it's local only for now.
            // Actually, my GameContext implementation only injects into `familyData.profiles`. Let's restrict to Family.
        });
    }

    const handleAddTask = () => {
        setTasks([...tasks, { title: '', assigneeId: 'self' }]);
    };

    const handleRemoveTask = (idx) => {
        setTasks(tasks.filter((_, i) => i !== idx));
    };

    const handleTaskChange = (idx, field, value) => {
        const newTasks = [...tasks];
        newTasks[idx][field] = value;
        setTasks(newTasks);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!title.trim()) return;

        const hp = parseInt(hpStr) || 1000;
        const xp = Math.floor(hp * 0.5);
        const gold = Math.floor(hp * 0.1);
        const randomSprite = BOSS_TYPES[Math.floor(Math.random() * BOSS_TYPES.length)].id;

        if (initialBoss) {
            actions.editEpicQuest(initialBoss.id, { title, maxHp: hp });
            // For simplicity in this edit, we don't fully orchestrate updating all cross-profile task assignments
            // if they were changed, to avoid massive complexity. We just update the Boss metadata.
            // If they need to change tasks fundamentally, they can delete and recreate.
        } else {
            if (mode === 'wild') {
                actions.addEpicQuest(title, hp, xp, gold, randomSprite);
            } else {
                // Filter out empty tasks
                const validTasks = tasks.filter(t => t.title.trim() !== '');
                if (validTasks.length === 0) {
                    toast.error("Please add at least one task for the project.");
                    return;
                }
                actions.addEpicProject(title, hp, xp, gold, randomSprite, validTasks);
            }
        }

        onClose();
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose}></div>

            <div className="relative glass-panel bg-[#130b14]/95 p-6 w-full max-w-lg rounded-3xl border-2 border-red-900/50 shadow-[0_0_50px_rgba(220,38,38,0.2)] animate-in zoom-in-95 duration-200 h-full max-h-[90vh] flex flex-col">
                <div className="flex justify-between items-center mb-6 shrink-0">
                    <h2 className="text-2xl font-heading font-black text-white uppercase tracking-wider flex items-center gap-3">
                        <PixelIcon name="sword" className="text-red-500" />
                        Summon Threat
                    </h2>
                    <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors">
                        <PixelIcon name="x" />
                    </button>
                </div>

                <div className="flex gap-2 mb-6 shrink-0">
                    <button
                        type="button"
                        onClick={() => !initialBoss && setMode('project')}
                        className={`flex-1 py-2 font-bold text-xs uppercase tracking-widest rounded-xl border transition-all ${mode === 'project' ? 'bg-red-600/20 border-red-500 text-red-400' : 'bg-black/40 border-white/10 text-gray-400 opacity-50 cursor-not-allowed'}`}
                        disabled={!!initialBoss}
                    >
                        Project Boss
                    </button>
                    <button
                        type="button"
                        onClick={() => !initialBoss && setMode('wild')}
                        className={`flex-1 py-2 font-bold text-xs uppercase tracking-widest rounded-xl border transition-all ${mode === 'wild' ? 'bg-red-600/20 border-red-500 text-red-400' : 'bg-black/40 border-white/10 text-gray-400 opacity-50 cursor-not-allowed'}`}
                        disabled={!!initialBoss}
                    >
                        Wild Boss
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 pb-4">
                    <form id="bossForm" onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Threat Name</label>
                            <input
                                type="text"
                                placeholder={mode === 'project' ? "e.g. Build the new App" : "e.g. Master Thesis"}
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-white outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500/50"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Boss Max HP</label>
                            <input
                                type="number"
                                placeholder="Difficulty: 500-5000"
                                value={hpStr}
                                onChange={(e) => setHpStr(e.target.value)}
                                className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-white outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500/50"
                                min="100"
                                required
                            />
                            {mode === 'project' && (
                                <p className="text-[10px] text-gray-500 mt-1.5 mx-1 font-mono">
                                    Project boss HP reduces automatically based on task completion %.
                                </p>
                            )}
                        </div>

                        {mode === 'project' && (
                            <div className="pt-4 border-t border-white/10 mt-6 !mb-2">
                                <div className="flex justify-between items-center mb-3">
                                    <label className="block text-xs font-bold text-red-400 uppercase tracking-widest ml-1">Project Tasks</label>
                                    <button
                                        type="button"
                                        onClick={handleAddTask}
                                        className="text-[10px] bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white transition-colors px-2 py-1 rounded-lg uppercase tracking-wider font-bold border border-red-500/30"
                                    >
                                        + Add Task
                                    </button>
                                </div>

                                <div className="space-y-3">
                                    {tasks.map((task, idx) => (
                                        <div key={idx} className="flex gap-2 items-start bg-white/5 p-2 rounded-xl border border-white/5">
                                            <div className="flex-1 space-y-2">
                                                <input
                                                    type="text"
                                                    placeholder="Task description..."
                                                    value={task.title}
                                                    onChange={(e) => handleTaskChange(idx, 'title', e.target.value)}
                                                    className="w-full bg-black/40 border border-transparent rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-red-500"
                                                    required
                                                />
                                                <div className="flex items-center gap-2 px-1">
                                                    <PixelIcon name="user" size={12} className="text-gray-500" />
                                                    <select
                                                        value={task.assigneeId}
                                                        onChange={(e) => handleTaskChange(idx, 'assigneeId', e.target.value)}
                                                        className="bg-transparent text-xs text-amber-400 font-bold outline-none cursor-pointer"
                                                    >
                                                        {partyMembers.map(member => (
                                                            <option key={member.id} value={member.id} className="bg-[#1a102e]">{member.name}</option>
                                                        ))}
                                                    </select>
                                                </div>
                                            </div>
                                            {tasks.length > 1 && (
                                                <button
                                                    type="button"
                                                    onClick={() => handleRemoveTask(idx)}
                                                    className="p-2 text-gray-500 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors mt-1"
                                                >
                                                    <PixelIcon name="trash" size={16} />
                                                </button>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </form>
                </div>

                <div className="pt-4 border-t border-white/10 shrink-0">
                    <button
                        type="submit"
                        form="bossForm"
                        className="w-full bg-red-600 hover:bg-red-500 text-white font-bold py-4 rounded-xl shadow-[0_0_15px_rgba(220,38,38,0.4)] hover:shadow-[0_0_20px_rgba(220,38,38,0.6)] transition-all uppercase tracking-widest"
                    >
                        {initialBoss ? 'Save Changes' : 'Summon Threat'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ProjectModal;
