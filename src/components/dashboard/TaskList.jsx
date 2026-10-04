import React, { useState, useCallback, memo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Edit2, Trash2, Clock, Play } from 'lucide-react';
import { useGame } from '../../context/GameContext';
import { estimateTaskRewards, getDueInfo, taskAttributeGain } from '../../utils/gameUtils';
import TaskForm from './TaskForm';
import HabitForm from './HabitForm';
import PixelIcon from '../common/PixelIcon';
import Modal from '../common/Modal';
import { PeacefulRealm, CleanTavern, NoRituals } from '../common/PixelEmpty';
import { useConfirm } from '../../context/ConfirmContext';

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
const DUE_STYLE = {
    overdue: 'text-red-200 bg-red-500/15 ring-1 ring-red-400/30',
    today: 'text-amber-200 bg-amber-500/10 ring-1 ring-amber-400/25',
    soon: 'text-gray-300 bg-white/[0.06]',
    later: 'text-gray-400 bg-white/[0.04]',
};

const ROW_ACTION = 'w-8 h-8 flex items-center justify-center rounded-lg text-gray-500 transition-colors';

const TaskRow = memo(function TaskRow({ task, xp, gold, assignerName, onComplete, onToggleStatus, onEdit, onDelete }) {
    const isInProgress = task.status === 'in_progress';
    const [checked, setChecked] = useState(false);
    const due = getDueInfo(task.dueDate);
    const handleComplete = useCallback((e) => {
        setChecked(true);
        onComplete(task.id, e.clientX, e.clientY);
    }, [task.id, onComplete]);
    const accent = due?.tone === 'overdue' ? 'border-l-red-400/70' : isInProgress ? 'border-l-blue-400 bg-blue-900/10' : 'border-l-transparent';
    return (
        <div className={`glass-card px-4 pt-3.5 pb-2.5 group transition-colors duration-200 hover:bg-white/[0.04] border-l-2 ${accent}`}>
            <div className="flex items-start gap-3">
                <motion.button
                    onClick={handleComplete}
                    whileTap={{ scale: 0.92 }}
                    transition={CHECK_SPRING}
                    className={`mt-0.5 w-6 h-6 rounded-md border-2 flex items-center justify-center shrink-0 transition-colors duration-150 ${checked ? 'border-rpg-green bg-rpg-green/20' : 'border-gray-500 hover:border-rpg-green hover:bg-rpg-green/15'}`}
                    aria-label={`Complete quest: ${task.title}`}
                >
                    {checked && (
                        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                            <path d="M2.5 6.5L5 9L9.5 3.5" stroke="#4ade80" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" pathLength="1" className="check-draw" />
                        </svg>
                    )}
                </motion.button>
                <div className="flex-1 min-w-0">
                    <button
                        onClick={() => onEdit(task)}
                        className={`block w-full text-left text-[15px] leading-snug font-medium transition-colors ${isInProgress ? 'text-blue-200' : 'text-gray-100 hover:text-white'}`}
                        title="Edit quest"
                    >
                        {task.title}
                    </button>
                    {(task.assignerId || isInProgress) && (
                        <div className="mt-1 flex flex-wrap gap-1.5">
                            {task.assignerId && <span className="text-[11px] font-semibold text-amber-300">Assigned by {assignerName}</span>}
                            {isInProgress && <span className="text-[11px] font-semibold text-blue-300">In progress</span>}
                        </div>
                    )}
                    {task.extraInfo && (
                        <p className="text-xs text-gray-400 mt-1 truncate">{task.extraInfo}</p>
                    )}
                    <div className="mt-2 flex flex-wrap items-center gap-x-2.5 gap-y-1.5">
                        {due && (
                            <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-md ${DUE_STYLE[due.tone]}`}>{due.label}</span>
                        )}
                        {task.difficulty === 3 && (
                            <span className="text-[11px] font-bold uppercase tracking-wider text-red-300">Hard</span>
                        )}
                        <span className="text-[11px] text-rpg-gold/90 tabular-nums">+{xp} XP · {gold} g</span>
                        {task.attribute && task.attribute !== 'none' && (
                            <span className="text-[11px] font-semibold text-blue-300">+{taskAttributeGain(task)} {task.attribute.toUpperCase()}</span>
                        )}
                        <div className="ml-auto -mr-1.5 flex items-center [@media(hover:hover)]:opacity-0 [@media(hover:hover)]:group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
                            <button
                                onClick={() => onToggleStatus(task.id, task.status)}
                                className={`${ROW_ACTION} ${isInProgress ? 'text-blue-300 bg-blue-500/15' : 'hover:text-blue-300 hover:bg-blue-500/10'}`}
                                aria-label={isInProgress ? 'Pause quest' : 'Mark as in progress'}
                                title={isInProgress ? 'Pause' : 'Start working'}
                            >
                                {isInProgress ? <Clock size={15} /> : <Play size={15} />}
                            </button>
                            <button
                                onClick={() => onEdit(task)}
                                className={`${ROW_ACTION} hover:text-white hover:bg-white/10`}
                                aria-label="Edit quest"
                                title="Edit"
                            >
                                <Edit2 size={15} />
                            </button>
                            <button
                                onClick={() => onDelete(task.id)}
                                className={`${ROW_ACTION} hover:text-red-300 hover:bg-red-500/10`}
                                aria-label="Delete quest"
                                title="Delete"
                            >
                                <Trash2 size={15} />
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
});

const TaskList = ({ isSidebar = false, setActiveView, hideQuests = false }) => {
    const { state, actions } = useGame();
    const confirm = useConfirm();
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

    const handleDeleteTask = useCallback(async (taskId) => {
        if (await confirm({ title: 'Abandon Quest?', message: 'This quest will be lost forever.', variant: 'danger', confirmText: 'Abandon' })) {
            actions.deleteTask(taskId);
        }
    }, [actions, confirm]);

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
    const renderTask = (task) => {
        const { xp, gold } = estimateTaskRewards(task, state.character);
        return (
        <motion.div key={task.id} {...TASK_MOTION}>
            <TaskRow
                task={task}
                xp={xp}
                gold={gold}
                assignerName={task.assignerId ? getAssignerName(task.assignerId) : ''}
                onComplete={handleCompleteTask}
                onToggleStatus={handleToggleStatus}
                onEdit={handleEditTask}
                onDelete={handleDeleteTask}
            />
        </motion.div>
        );
    };

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
                        <button
                            onClick={handleOpenTaskForm}
                            className="mt-3 glass-btn-primary px-4 py-2 text-xs font-bold shadow-lg shadow-rpg-gold/20"
                        >
                            + Write a quest
                        </button>
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
                        <PixelIcon name="broom" size={16} color="#f97316" /> HOUSEHOLD CHORES
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
                        <PixelIcon name="checkSquare" size={16} color="#60a5fa" /> DAILY HABITS
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
                            <div className="text-[10px] text-gray-500 mt-1">A hero without habits is a blade without an edge.</div>
                            <button
                                onClick={handleOpenHabitForm}
                                className="mt-3 px-4 py-2 rounded-lg bg-blue-500/20 border border-blue-500/30 text-blue-300 text-[11px] font-bold uppercase tracking-wider hover:bg-blue-500/30 hover:border-blue-400/40 transition-all"
                            >
                                Begin a ritual
                            </button>
                        </div>
                    )}

                    {state.habits.map(habit => (
                        <div key={habit.id} className="glass-btn px-3 py-2.5 flex items-center gap-3 group rounded-xl hover:bg-white/5 border border-white/5">
                            <div className={`w-1.5 h-8 rounded-full shrink-0 ${habit.completed ? 'bg-rpg-green' : 'bg-gray-700'}`} />
                            <button onClick={() => handleEditHabit(habit)} className="flex-1 min-w-0 text-left" title="Edit habit">
                                <span className={`text-sm block truncate ${habit.completed ? 'text-gray-500 line-through' : 'text-gray-100 font-medium'}`}>{habit.title}</span>
                                {((habit.attribute && habit.attribute !== 'none') || habit.extraInfo) && (
                                    <span className="flex items-center gap-2 mt-0.5 min-w-0">
                                        {habit.attribute && habit.attribute !== 'none' && (
                                            <span className="text-[11px] font-semibold text-blue-300 shrink-0">+1 {habit.attribute.toUpperCase()}</span>
                                        )}
                                        {habit.extraInfo && <span className="text-xs text-gray-500 truncate">{habit.extraInfo}</span>}
                                    </span>
                                )}
                            </button>
                            <div className="flex items-center shrink-0 [@media(hover:hover)]:opacity-0 [@media(hover:hover)]:group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
                                <button
                                    onClick={async () => { if (await confirm({ title: 'Break Ritual?', message: 'This daily ritual will be removed forever.', variant: 'danger', confirmText: 'Break It' })) actions.deleteHabit(habit.id); }}
                                    className={`${ROW_ACTION} hover:text-red-300 hover:bg-red-500/10`}
                                    aria-label={`Delete habit: ${habit.title}`}
                                    title="Delete"
                                >
                                    <Trash2 size={15} />
                                </button>
                            </div>
                            <span className="text-xs font-bold tabular-nums shrink-0 text-gray-500">
                                <span className="text-white">{habit.count}</span>/{habit.target}
                            </span>
                            <button
                                onClick={(e) => actions.tickHabit(habit.id, e.clientX, e.clientY)}
                                disabled={habit.completed}
                                aria-label={`Log habit: ${habit.title}`}
                                className={`w-9 h-9 shrink-0 rounded-lg flex items-center justify-center text-lg font-bold transition-colors ${habit.completed
                                    ? 'bg-white/5 text-gray-600 cursor-not-allowed'
                                    : 'bg-rpg-green/90 text-black hover:bg-rpg-green'
                                    }`}
                            >
                                +
                            </button>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default TaskList;
