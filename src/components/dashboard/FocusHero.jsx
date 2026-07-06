import React, { useState } from 'react';
import { Play, Settings, Coffee, ListTodo, X } from 'lucide-react';
import { useGame } from '../../context/GameContext';
import Pomodoro from '../../components/Pomodoro';
import ModernPixelPet from '../common/ModernPixelPet';
import { useToast } from '../common/Toast';

const FocusHero = () => {
    const { actions, state, dispatch } = useGame();
    const toast = useToast();
    // Simple state to track total focus time (could be from context later)
    const [stats, setStats] = useState({ todayFocusMinutes: 0 }); // Placeholder

    // Modal State
    const [showModal, setShowModal] = useState(false);
    const [settingsOpen, setSettingsOpen] = useState(false);
    const [duration, setDuration] = useState(20);
    const [breakDuration, setBreakDuration] = useState(5);
    const [focusMessage, setFocusMessage] = useState('');

    // Task Selection State
    const [selectedTasks, setSelectedTasks] = useState([]);
    const [showTaskSelector, setShowTaskSelector] = useState(false);

    // Egg Incubation State
    const [pomodoroMode, setPomodoroMode] = useState('battle'); // 'battle' | 'hatch'
    const [selectedEgg, setSelectedEgg] = useState(null);

    const inventoryEggs = state.character?.inventory?.filter(i => i.type === 'egg' || i.name.toLowerCase().includes('egg')) || [];
    const pendingTasks = state.tasks?.filter(t => !t.completed) || [];

    const toggleTaskSelection = (task) => {
        if (selectedTasks.find(t => t.id === task.id)) {
            setSelectedTasks(selectedTasks.filter(t => t.id !== task.id));
        } else {
            setSelectedTasks([...selectedTasks, task]);
        }
    };

    const handleEnterPortal = () => {
        if (pomodoroMode === 'hatch' && !selectedEgg) {
            toast.error("Please select an egg to incubate first.");
            return;
        }

        if (actions.setFocusMessage) {
            if (pomodoroMode === 'hatch') {
                actions.setFocusMessage(`INCUBATING: ${selectedEgg.name}`);
            } else if (selectedTasks.length > 0) {
                actions.setFocusMessage(selectedTasks.map(t => t.title).join(', '));
            } else if (focusMessage.trim() !== '') {
                actions.setFocusMessage(focusMessage.trim());
            } else {
                actions.setFocusMessage("ENTERING FOCUS DUNGEON");
            }
        }

        if (pomodoroMode === 'hatch') {
            dispatch({ type: 'START_INCUBATION', payload: { eggId: selectedEgg.id } });
        }

        setShowModal(true);
        setShowTaskSelector(false);
    };

    const onFinishSession = (result) => {
        const enemies = result?.enemiesDefeated || 0;
        const minutes = result?.totalMinutesWorked || 0;
        const quality = result?.focusQuality || 3;

        if (pomodoroMode === 'hatch' && minutes >= duration) {
            dispatch({ type: 'PROGRESS_INCUBATION' });
        }

        actions.finishPomodoro({ 
            enemiesDefeated: enemies, 
            totalMinutesWorked: minutes,
            focusQuality: quality
        });
        setShowModal(false);
    };

    const formatTime = (minutes) => {
        return `${minutes}:00`;
    };

    return (
        <>
            <div className="glass-card p-6 flex flex-col items-center justify-center gap-6 h-auto relative overflow-hidden group shadow-2xl transition-all hover:bg-white/5 border border-white/5 hover:border-red-500/30">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-red-500 to-transparent opacity-50"></div>

                {/* Status Header */}
                <div className="text-center space-y-2 z-10 w-full">
                    <div className="flex items-center justify-center gap-2 text-red-400 text-[10px] font-bold uppercase tracking-[0.2em] mb-4">
                        <div className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.8)]"></div>
                        POMODORO DUNGEON
                    </div>
                </div>

                {/* Mode Selector */}
                <div className="flex bg-black/40 p-1 rounded-xl border border-white/10 z-10">
                    <button 
                        onClick={() => setPomodoroMode('battle')}
                        className={`px-4 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all flex items-center gap-2 ${pomodoroMode === 'battle' ? 'bg-red-500 text-white shadow-glow-red' : 'text-gray-500 hover:text-gray-300'}`}
                    >
                        <Play size={10} fill="currentColor" /> Battle
                    </button>
                    <button 
                        onClick={() => setPomodoroMode('hatch')}
                        className={`px-4 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all flex items-center gap-2 ${pomodoroMode === 'hatch' ? 'bg-amber-500 text-white shadow-glow-amber' : 'text-gray-500 hover:text-gray-300'}`}
                    >
                        <div className="scale-75 origin-center"><ModernPixelPet type="dragon_egg" scale={0.5} isHatching /></div> Hatch
                    </button>
                </div>

                {/* Big Launch Button / Portal */}
                <div
                    className="relative group/portal cursor-pointer"
                    onClick={handleEnterPortal}
                    role="button"
                    tabIndex={0}
                    aria-label="Enter portal"
                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleEnterPortal(); } }}
                >
                    <div className={`relative z-10 bg-gradient-to-b from-gray-900 to-black w-24 h-24 rounded-full flex flex-col items-center justify-center transition-all duration-500 group-hover/portal:scale-110 shadow-[0_0_40px_rgba(239,68,68,0.2)] border-2 ${pomodoroMode === 'hatch' ? 'border-amber-900/50 group-hover/portal:border-amber-500/80 group-hover/portal:shadow-[0_0_60px_rgba(245,158,11,0.6)]' : 'border-red-900/50 group-hover/portal:border-red-500/80 group-hover/portal:shadow-[0_0_60px_rgba(239,68,68,0.6)]'} overflow-hidden`}>
                        <div className={`absolute inset-0 bg-[conic-gradient(from_0deg,transparent,${pomodoroMode === 'hatch' ? 'rgba(245,158,11,0.3)' : 'rgba(239,68,68,0.3)'},transparent)] animate-spin-slow opacity-0 group-hover/portal:opacity-100 transition-opacity duration-1000`}></div>
                        <Play size={32} fill="currentColor" className={`${pomodoroMode === 'hatch' ? 'text-amber-500 drop-shadow-[0_0_10px_rgba(245,158,11,0.8)]' : 'text-red-500 drop-shadow-[0_0_10px_rgba(239,68,68,0.8)]'} ml-1 z-10 group-hover/portal:scale-110 transition-transform`} />
                        <span className={`text-[8px] font-bold ${pomodoroMode === 'hatch' ? 'text-amber-500' : 'text-red-500'} tracking-widest mt-1 z-10 uppercase`}>Enter</span>
                    </div>
                    {/* Surrounding runes */}
                    <div className={`absolute inset-[-10px] rounded-full border border-dashed ${pomodoroMode === 'hatch' ? 'border-amber-500/20' : 'border-red-500/20'} animate-spin-slow pointer-events-none`}></div>
                </div>

                <div className="w-full max-w-[220px] z-20 relative">
                    {pomodoroMode === 'hatch' ? (
                        <div className="space-y-2">
                             <select 
                                value={selectedEgg?.id || ''}
                                onChange={(e) => setSelectedEgg(inventoryEggs.find(egg => egg.id === e.target.value))}
                                className="w-full bg-black/50 border border-white/10 rounded-lg py-2 px-3 text-xs text-center text-white font-sans outline-none hover:border-amber-500/50 hover:bg-black/70 transition-all appearance-none cursor-pointer"
                            >
                                <option value="">-- Select an Egg --</option>
                                {inventoryEggs.map(egg => (
                                    <option key={egg.id} value={egg.id}>{egg.name}</option>
                                ))}
                            </select>
                            {inventoryEggs.length === 0 && (
                                <p className="text-[10px] text-gray-500 mt-2 text-center italic">No eggs in inventory</p>
                            )}
                        </div>
                    ) : (
                        <>
                            <button
                                onClick={() => setShowTaskSelector(!showTaskSelector)}
                                className="w-full bg-black/50 border border-white/10 rounded-lg py-2 px-3 text-xs text-center text-white font-sans outline-none hover:border-red-500/50 hover:bg-black/70 transition-all flex items-center justify-between group"
                            >
                                <span className="truncate flex-1 text-center font-medium">
                                    {selectedTasks.length > 0
                                        ? `${selectedTasks.length} Quest(s) Selected`
                                        : (focusMessage || "Select Quests (Optional)")}
                                </span>
                                <ListTodo size={14} className="text-gray-500 group-hover:text-red-400 flex-shrink-0 ml-2" />
                            </button>

                            {showTaskSelector && (
                                <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 w-64 bg-rpg-panel border border-white/10 rounded-xl shadow-[0_10px_40px_rgba(0,0,0,0.8)] p-3 z-50 text-left h-auto max-h-64 flex flex-col animate-in fade-in slide-in-from-bottom-2">
                                    <div className="flex items-center justify-between mb-2 pb-2 border-b border-white/10">
                                        <div className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Active Quests</div>
                                        <button onClick={() => setShowTaskSelector(false)} className="text-gray-500 hover:text-white"><X size={14} /></button>
                                    </div>

                                    <div className="overflow-y-auto space-y-1 mb-2 pr-1 custom-scrollbar flex-1">
                                        {pendingTasks.length === 0 ? (
                                            <div className="text-xs text-gray-500 italic p-2 text-center">No pending quests.</div>
                                        ) : (
                                            pendingTasks.map(task => (
                                                <div
                                                    key={task.id}
                                                    onClick={() => toggleTaskSelection(task)}
                                                    className={`flex items-start gap-2 p-2 rounded-lg cursor-pointer transition-colors text-xs border border-transparent ${selectedTasks.find(t => t.id === task.id) ? 'bg-red-500/10 border-red-500/30 text-white' : 'hover:bg-white/5 text-gray-300'}`}
                                                >
                                                    <div className={`w-3 h-3 rounded flex-shrink-0 border mt-0.5 flex items-center justify-center ${selectedTasks.find(t => t.id === task.id) ? 'bg-red-500 border-red-500' : 'border-gray-500'}`}>
                                                        {selectedTasks.find(t => t.id === task.id) && <div className="w-1.5 h-1.5 bg-white rounded-sm"></div>}
                                                    </div>
                                                    <span className="line-clamp-2 leading-tight">{task.title}</span>
                                                </div>
                                            ))
                                        )}
                                    </div>

                                    <div className="mt-auto border-t border-white/10 pt-3">
                                        <input
                                            type="text"
                                            placeholder="Or enter custom focus..."
                                            value={focusMessage}
                                            onChange={(e) => { setFocusMessage(e.target.value); setSelectedTasks([]); }}
                                            className="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-xs text-white outline-none focus:border-red-500/50"
                                            onClick={(e) => e.stopPropagation()}
                                        />
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>

                <div className="text-center z-10 mt-2">
                    <div className="flex items-center justify-center gap-1.5 text-xs text-gray-400 font-mono bg-black/40 px-3 py-1 rounded-lg border border-white/5 w-fit mx-auto cursor-pointer hover:bg-white/10" onClick={() => setSettingsOpen(!settingsOpen)}>
                        <Settings size={12} />
                        {duration}m / {breakDuration}m
                    </div>
                </div>

                {/* Settings Popover */}
                {settingsOpen && (
                    <div className="absolute top-12 right-4 glass-panel p-4 rounded-xl z-30 w-52 animate-in fade-in slide-in-from-top-2 shadow-2xl border border-white/10 backdrop-blur-xl">
                        <div className="mb-3">
                            <label className="block text-[10px] text-gray-400 mb-1 uppercase font-bold tracking-wider">Work Phase (min)</label>
                            <input
                                type="number"
                                value={duration}
                                onChange={(e) => setDuration(parseInt(e.target.value) || 20)}
                                className="w-full bg-black/40 text-white border border-white/10 rounded-lg p-2 text-sm outline-none focus:border-red-500/50 transition-colors font-mono"
                            />
                        </div>
                        <div>
                            <label className="block text-[10px] text-gray-400 mb-1 uppercase font-bold tracking-wider">Break Phase (min)</label>
                            <input
                                type="number"
                                value={breakDuration}
                                onChange={(e) => setBreakDuration(parseInt(e.target.value) || 5)}
                                className="w-full bg-black/40 text-blue-300 border border-white/10 rounded-lg p-2 text-sm outline-none focus:border-blue-500/50 transition-colors font-mono"
                            />
                        </div>
                    </div>
                )}

                {/* Background Decoration */}
                <div className="absolute inset-0 bg-gradient-to-t from-red-900/10 to-transparent pointer-events-none mix-blend-overlay" />
            </div>

            {/* FULL SCREEN MODAL */}
            {showModal && (
                <Pomodoro
                    initialDuration={duration}
                    initialBreak={breakDuration}
                    selectedTaskIds={selectedTasks.map(t => t.id)}
                    isHatchMode={pomodoroMode === 'hatch'}
                    selectedEgg={selectedEgg}
                    onComplete={onFinishSession}
                    onCancel={() => setShowModal(false)}
                />
            )}
        </>
    );
};

export default FocusHero;
