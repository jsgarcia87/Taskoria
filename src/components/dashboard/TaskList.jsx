import React, { useState, useCallback, memo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Edit2, Trash2, Clock, Play } from 'lucide-react';
import { useGame } from '../../context/GameContext';
import { TASK_DIFFICULTY } from '../../utils/gameUtils';
import TaskForm from './TaskForm';
import HabitForm from './HabitForm';
import PixelIcon from '../common/PixelIcon';
import Modal from '../common/Modal';
import { PeacefulRealm, CleanTavern, NoRituals } from '../common/PixelEmpty';

// Presets compartidos para la animación de cada quest.
// Salida corta (x: 24, no 60) y ease "gentle-out" → la tarea "se retira" en
// vez de "salir volando". El `layout` en el mismo motion.div hace que las
// tareas de debajo suban con spring al desaparecer una.
const TASK_MOTION = {
    layout: true,
    initial: { opacity: 0, y: 6 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, x: 24, transition: { duration: 0.28, ease: [0.22, 1, 0.36, 1] } },
    transition: { type: 'spring', stiffness: 300, damping: 32 },
};

const CHECK_SPRING = { type: 'spring', stiffness: 340, damping: 26 };

/**
 * TaskRow — extracted out of TaskList + wrapped in React.memo so a stats tick
 * (character.gold/hp/xp updates) doesn't re-render every task in the list.
 * Only re-renders when its own `task` reference changes, or when one of the
 * memoized callbacks identity changes (they're stable via useCallback below).
 */
const TaskRow = memo(function TaskRow({ task, assignerName, onComplete, onToggleStatus, onEdit, onDelete }) {
    const isInProgress = task.status === 'in_progress';
    const [checked, setChecked] = useState(false);
    const handleComplete = useCallback((e) => {
        setChecked(true);
        onComplete(task.id, e.clientX, e.clientY);
    }, [task.id, onComplete]);
    return (
        <div className={`glass-card p-4 group transition-all duration-300 hover:bg-white/5 border-l-4 ${isInProgress ? 'border-l-blue-500 bg-blue-900/10' : 'border-l-transparent hover:border-l-rpg-gold'}`}>
            <div className="flex justify-between items-start gap-4">
                <div className="flex items-start gap-3 w-full">
                    <motion.button
                        onClick={handleComplete}
                        whileHover={{ scale: 1.04 }}
                        whileTap={{ scale: 0.92 }}
                        transition={CHECK_SPRING}
                        className={`mt-0.5 w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-colors duration-150 ${checked ? 'border-rpg-green bg-rpg-green/20' : 'border-gray-500 hover:border-rpg-green hover:bg-rpg-green/20'}`}
                        title="Complete Quest"
                    >
                        {checked ? (
                            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                                <path d="M2.5 6.5L5 9L9.5 3.5" stroke="#4ade80" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" pathLength="1" className="check-draw" />
                            </svg>
                        ) : (
                            <div className="w-2.5 h-2.5 rounded-sm bg-transparent group-hover:bg-rpg-green transition-colors" />
                        )}
                    </motion.button>
                    <div className="flex-1">
                        <div className="flex justify-between items-start">
                            <span className="text-sm font-medium text-gray-200 group-hover:text-white transition-colors flex items-center gap-2 mb-1">
                                {task.assignerId
                                    ? <PixelIcon name="book" size={14} color="#fbbf24" />
                                    : task.category === 'chore'
                                        ? <PixelIcon name="box" size={14} color="#f97316" />
                                        : <PixelIcon name="sword" size={14} className="text-gray-400 group-hover:text-white" />}
                                <span className={isInProgress ? 'text-blue-300' : ''}>{task.title}</span>
                                {task.assignerId && <span className="ml-1 text-[9px] bg-red-900/40 text-red-400 px-2 py-0.5 rounded-full border border-red-500/30 uppercase tracking-wider font-bold shadow-[0_0_10px_rgba(239,68,68,0.3)]">Assigned by: {assignerName}</span>}
                                {isInProgress && <span className="ml-1 text-[9px] bg-blue-900/40 text-blue-400 px-2 py-0.5 rounded-full border border-blue-500/30 uppercase tracking-wider font-bold">In Progress</span>}
                            </span>
                            <div className="opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity flex items-center gap-1 shrink-0 bg-black/40 p-1 md:bg-black/40 md:p-1 rounded-lg backdrop-blur-sm border md:border-white/5 border-white/20">
                                <button
                                    onClick={() => onToggleStatus(task.id, task.status)}
                                    className={`p-2 md:p-1.5 rounded-md transition-colors ${isInProgress ? 'bg-blue-500/20 text-blue-400 hover:bg-blue-500/30' : 'text-gray-400 hover:text-blue-400 hover:bg-blue-500/10'}`}
                                    title={isInProgress ? "Pause work" : "Start working"}
                                >
                                    {isInProgress ? <Clock size={16} className="md:w-3 md:h-3" /> : <Play size={16} className="md:w-3 md:h-3" />}
                                </button>
                                <button
                                    onClick={() => onEdit(task)}
                                    className="p-2 md:p-1.5 text-gray-400 hover:text-white hover:bg-white/10 rounded-md transition-colors"
                                    title="Edit Quest"
                                >
                                    <Edit2 size={16} className="md:w-3 md:h-3" />
                                </button>
                                <button
                                    onClick={() => onDelete(task.id)}
                                    className="p-2 md:p-1.5 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-md transition-colors"
                                    title="Delete Quest"
                                >
                                    <Trash2 size={16} className="md:w-3 md:h-3" />
                                </button>
                            </div>
                        </div>
                        {task.extraInfo && (
                            <p className="text-xs text-gray-400 mb-2 truncate max-w-xs">{task.extraInfo}</p>
                        )}
                        <div className="flex items-center gap-2">
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${task.difficulty === 3 ? 'bg-red-500/10 text-red-400 border-red-500/20' : 'bg-blue-500/10 text-blue-400 border-blue-500/20'}`}>
                                {task.difficulty === 3 ? 'HARD' : 'NORMAL'}
                            </span>
                            <span className="text-[10px] text-rpg-gold flex items-center gap-1">
                                <span>+{task.difficulty === 3 ? '40' : '20'} XP</span>
                                <span>+{task.difficulty === 3 ? '20' : '10'} G</span>
                            </span>
                            {task.attribute && task.attribute !== 'none' && (
                                <span className="text-[10px] text-blue-300 font-bold bg-blue-900/40 px-2 py-0.5 rounded-full border border-blue-500/30">
                                    +1 {task.attribute.toUpperCase()}
                                </span>
                            )}
                            {task.dueDate && (
                                <span className="text-[10px] text-gray-400 flex items-center gap-1">
                                    <PixelIcon name="clock" size={10} color="#9ca3af" /> <span>{task.dueDate}</span>
                                </span>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
});

const TaskList = ({ isSidebar = false, setActiveView, hideQuests = false }) => {
    const { state, actions } = useGame();
    const { tasks } = state;
    const [isAddingTask, setIsAddingTask] = useState(false);
    const [editingTask, setEditingTask] = useState(null);
    const [isAddingHabit, setIsAddingHabit] = useState(false);
    const [editingHabit, setEditingHabit] = useState(null);
    const [showHistory, setShowHistory] = useState(false);

    // Helper to find profile name
    const getAssignerName = (id) => {
        if (!state.familyData?.profiles) return 'Unknown';
        const profile = state.familyData.profiles.find(p => p.id === id);
        return profile ? profile.name : 'Unknown';
    };

    const activeTasks = tasks.filter(t => !t.completed && t.category !== 'chore' && !t.projectId);
    const activeChores = tasks.filter(t => !t.completed && t.category === 'chore' && !t.projectId);

    const handleOpenTaskForm = () => {
        setEditingTask(null);
        if (window.innerWidth < 768 && setActiveView) {
            setActiveView('createTask');
        } else {
            setIsAddingTask(true);
        }
    };

    // useCallback stabilizes refs so the memoized TaskRow doesn't see new
    // handler identities on every parent render.
    const handleEditTask = useCallback((task) => {
        setEditingTask(task);
        setIsAddingTask(true);
    }, []);

    const handleDeleteTask = useCallback((taskId) => {
        if (window.confirm('Delete this task? This cannot be undone.')) {
            actions.deleteTask(taskId);
        }
    }, [actions]);

    const handleToggleStatus = useCallback((taskId, currentStatus) => {
        const newStatus = currentStatus === 'in_progress' ? 'pending' : 'in_progress';
        actions.updateTaskStatus(taskId, newStatus);
    }, [actions]);

    const handleCompleteTask = useCallback((id, x, y) => actions.completeTask(id, x, y), [actions]);

    const handleOpenHabitForm = () => {
        setEditingHabit(null);
        if (window.innerWidth < 768 && setActiveView) {
            setActiveView('createHabit');
        } else {
            setIsAddingHabit(true);
        }
    };

    const handleEditHabit = (habit) => {
        setEditingHabit(habit);
        if (window.innerWidth < 768 && setActiveView) {
            setIsAddingHabit(true);
        } else {
            setIsAddingHabit(true);
        }
    };

    // Pre-build a per-task renderer that pre-resolves the assigner name string.
    // The memoized TaskRow then skips re-render unless any of these props change.
    // motion.div envuelve TaskRow (fuera del memo) — el memo sigue evitando
    // re-renders internos por ticks de stats; el wrapper solo se ocupa de la
    // orquestación de layout/enter/exit.
    const renderTask = (task) => (
        <motion.div key={task.id} {...TASK_MOTION}>
            <TaskRow
                task={task}
                assignerName={task.assignerId ? getAssignerName(task.assignerId) : ''}
                onComplete={handleCompleteTask}
                onToggleStatus={handleToggleStatus}
                onEdit={handleEditTask}
                onDelete={handleDeleteTask}
            />
        </motion.div>
    );

    return (
        <div className={`space-y-4 ${!isSidebar ? 'max-w-2xl mx-auto' : ''}`}>
            {/* Modal para Crear/Editar Tarea — dismissable=false para no perder datos */}
            <Modal
                isOpen={isAddingTask}
                dismissable={false}
                onClose={() => { setIsAddingTask(false); setEditingTask(null); }}
            >
                <TaskForm
                    onClose={() => { setIsAddingTask(false); setEditingTask(null); }}
                    initialData={editingTask}
                />
            </Modal>

            {/* Modal para Crear/Editar Hábito */}
            <Modal
                isOpen={isAddingHabit}
                dismissable={false}
                onClose={() => { setIsAddingHabit(false); setEditingHabit(null); }}
            >
                <HabitForm
                    onClose={() => { setIsAddingHabit(false); setEditingHabit(null); }}
                    initialData={editingHabit}
                />
            </Modal>

            {/* ======= BLOQUE DE TAREAS (QUESTS) ======= */}
            {!hideQuests && <div className="mb-8">
                <div className="flex justify-between items-center mb-6">
                    {!isSidebar && (
                        <h3 className="font-bold text-white text-lg tracking-wide font-heading flex items-center gap-2">
                            <PixelIcon name="sword" size={20} className="text-rpg-gold" /> ACTIVE QUESTS
                        </h3>
                    )}
                    <button
                        onClick={handleOpenTaskForm}
                        className={`glass-btn-primary px-4 py-2 text-xs font-bold shadow-lg shadow-rpg-gold/20 flex items-center gap-2 ${isSidebar ? 'w-full justify-center' : ''}`}
                    >
                        <span>+</span> {isSidebar ? 'NEW QUEST' : 'NEW QUEST'}
                    </button>
                </div>

                {activeTasks.length === 0 ? (
                    <div className="text-center py-8 px-4 glass-panel border-dashed border-white/10 opacity-80 flex flex-col items-center justify-center group hover:opacity-100 transition-opacity">
                        <div className="mb-3 opacity-90 group-hover:opacity-100 transition-opacity">
                            <PeacefulRealm size={80} />
                        </div>
                        <div className="text-sm font-bold text-gray-300 uppercase tracking-widest">The Realm is Peaceful</div>
                        <div className="text-xs text-gray-500 mt-1">Ledgar's quill rests. Write a new quest to set it moving.</div>
                    </div>
                ) : (
                    <div className="space-y-3">
                        <AnimatePresence mode="popLayout" initial={false}>
                            {activeTasks.map(renderTask)}
                        </AnimatePresence>
                    </div>
                )}
            </div>}

            {/* ======= BLOQUE DE CHORES ======= */}
            <div className="mb-8">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="font-bold text-gray-300 text-sm tracking-wider font-heading flex items-center gap-2">
                        <span className="text-orange-500">🧹</span> HOUSEHOLD CHORES
                    </h3>
                </div>

                {activeChores.length === 0 ? (
                    <div className="text-center py-6 px-4 glass-panel border-dashed border-white/10 opacity-80 flex flex-col items-center justify-center">
                        <div className="mb-2">
                            <CleanTavern size={72} />
                        </div>
                        <div className="text-xs font-bold text-gray-300 uppercase tracking-widest">A Clean Tavern</div>
                        <div className="text-xs text-gray-500 mt-1">Every surface polished. The innkeeper nods with approval.</div>
                    </div>
                ) : (
                    <div className="space-y-3">
                        <AnimatePresence mode="popLayout" initial={false}>
                            {activeChores.map(renderTask)}
                        </AnimatePresence>
                    </div>
                )}
            </div>

            {/* ======= HISTORIAL ======= */}
            {state.completedTasks && state.completedTasks.length > 0 && (
                <div className="mt-8 pt-6 border-t border-white/10">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="font-bold text-gray-400 text-sm tracking-wider font-heading flex items-center gap-2">
                            <PixelIcon name="book" size={16} className="text-gray-500" /> QUEST HISTORY
                        </h3>
                        <button
                            onClick={() => setShowHistory(!showHistory)}
                            className="text-xs text-gray-500 hover:text-white transition-colors uppercase font-bold tracking-wider"
                        >
                            {showHistory ? 'Hide History' : `Show History (${state.completedTasks.length})`}
                        </button>
                    </div>

                    {showHistory && (
                        <div className="space-y-2 max-h-64 overflow-y-auto custom-scrollbar pr-2">
                            {state.completedTasks.filter(t => !t.projectId).map((task, idx) => (
                                <div key={`${task.id}-${idx}`} className="glass-card p-3 opacity-60 flex justify-between items-center">
                                    <div>
                                        <span className="text-sm font-medium text-gray-400 line-through block mb-1">{task.title}</span>
                                        <span className="text-xs text-gray-500">
                                            Completed: {new Date(task.lastCompleted).toLocaleDateString()}
                                        </span>
                                    </div>
                                    <span className="text-xs text-rpg-gold">
                                        +{task.difficulty === 3 ? '40' : '20'} XP
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* ======= BLOQUE DE HÁBITOS ======= */}
            <div className="mt-8 pt-6 border-t border-white/10">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="font-bold text-gray-300 text-sm tracking-wider font-heading flex items-center gap-2">
                        <PixelIcon name="clock" size={16} color="#60a5fa" /> DAILY HABITS
                    </h3>
                    <button onClick={handleOpenHabitForm} className="glass-btn-primary px-3 py-1.5 text-xs font-bold shadow-lg flex items-center gap-2 border border-white/20 hover:border-rpg-gold transition-colors">
                        <span>+</span> NEW HABIT
                    </button>
                </div>

                <div className="space-y-2">
                    {state.habits.length === 0 && (
                        <div className="text-center py-8 px-4 glass-panel border-dashed border-white/10 opacity-80 flex flex-col items-center justify-center group hover:opacity-100 transition-opacity mb-4">
                            <div className="mb-3">
                                <NoRituals size={80} />
                            </div>
                            <div className="text-sm font-bold text-gray-300 uppercase tracking-widest">No Daily Rituals</div>
                            <div className="text-[10px] text-gray-500 mt-1">A hero without habits is a blade without an edge. Begin one.</div>
                        </div>
                    )}

                    {state.habits.map(habit => (
                        <div key={habit.id} className="glass-btn p-3 flex justify-between items-center group rounded-xl hover:bg-white/5 border border-white/5 relative overflow-hidden">
                            <div className="flex items-center gap-3 relative z-10 w-full pr-20">
                                <div className={`w-1.5 h-8 rounded-full shrink-0 ${habit.completed ? 'bg-rpg-green shadow-[0_0_10px_rgba(45,204,112,0.4)]' : 'bg-gray-700'}`}></div>
                                <div className="min-w-0 pr-4">
                                    <span className={`text-sm block truncate ${habit.completed ? 'text-gray-500 line-through' : 'text-gray-200 font-medium'}`}>{habit.title}</span>
                                    <div className="flex items-center gap-2 mt-0.5">
                                        {habit.attribute && habit.attribute !== 'none' && (
                                            <span className="text-[9px] text-blue-300 font-bold bg-blue-900/40 px-1.5 py-0 rounded border border-blue-500/30">
                                                +1 {habit.attribute.toUpperCase()}
                                            </span>
                                        )}
                                        {habit.extraInfo && <span className="text-xs text-gray-500 truncate block">{habit.extraInfo}</span>}
                                    </div>
                                </div>
                            </div>

                            {/* Hover Actions specific to Habits */}
                            <div className="absolute right-12 top-1/2 -translate-y-1/2 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity flex items-center gap-1 bg-black/60 p-1 rounded-lg backdrop-blur-md border border-white/20 md:border-white/10 z-20">
                                <button
                                    onClick={() => handleEditHabit(habit)}
                                    className="p-2 md:p-1.5 text-gray-400 hover:text-white hover:bg-white/10 rounded-md transition-colors"
                                    title="Edit Habit"
                                >
                                    <Edit2 size={16} className="md:w-3 md:h-3" />
                                </button>
                                <button
                                    onClick={() => confirm('Delete this habit? This cannot be undone.') && actions.deleteHabit(habit.id)}
                                    className="p-2 md:p-1.5 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-md transition-colors"
                                    title="Delete Habit"
                                >
                                    <Trash2 size={16} className="md:w-3 md:h-3" />
                                </button>
                            </div>

                            <div className="flex items-center gap-2 relative z-10 shrink-0">
                                <span className="text-xs text-gray-500 font-bold mr-2"><span className="text-white">{habit.count}</span><span className="mx-0.5">/</span>{habit.target}</span>
                                <button
                                    onClick={(e) => actions.tickHabit(habit.id, e.clientX, e.clientY)}
                                    disabled={habit.completed}
                                    className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${habit.completed
                                        ? 'bg-white/5 text-gray-600 cursor-not-allowed'
                                        : 'bg-rpg-green text-black font-bold hover:scale-110 shadow-[0_0_10px_rgba(45,204,112,0.3)]'
                                        }`}
                                >
                                    +
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default TaskList;
