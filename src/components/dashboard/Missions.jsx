import React, { useState, useMemo, useCallback, useRef, memo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, Play, Pause, Check, Trash2, Edit2, Archive, X, Filter } from 'lucide-react';
import { useGame } from '../../context/GameContext';
import TaskForm from './TaskForm';
import PixelIcon from '../common/PixelIcon';
import { Modal } from '../common/Modal';
import { useConfirm } from '../../context/ConfirmContext';
import { estimateTaskRewards, taskAttributeGain } from '../../utils/gameUtils';

// ─── Date helpers ────────────────────────────────────────────────────────────
const startOfDay = (d) => {
    const x = new Date(d);
    x.setHours(0, 0, 0, 0);
    return x;
};

const parseDue = (dateStr) => {
    if (!dateStr) return null;
    return startOfDay(new Date(dateStr + 'T00:00:00'));
};

const isToday = (dateStr) => {
    const d = parseDue(dateStr);
    if (!d) return false;
    return d.getTime() === startOfDay(new Date()).getTime();
};

const isPast = (dateStr) => {
    const d = parseDue(dateStr);
    if (!d) return false;
    return d < startOfDay(new Date());
};

const formatDue = (dateStr) => {
    const d = parseDue(dateStr);
    if (!d) return null;
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

// ─── Column definitions ──────────────────────────────────────────────────────
const COLUMNS = [
    { id: 'in_progress', label: 'In Progress', accent: 'bg-blue-500',   dot: 'bg-blue-400',   hint: 'What you\'re working on right now' },
    { id: 'today',       label: 'Today',       accent: 'bg-rpg-gold',   dot: 'bg-rpg-gold',   hint: 'Due today or without a date' },
    { id: 'upcoming',    label: 'Upcoming',    accent: 'bg-purple-500', dot: 'bg-purple-400', hint: 'Later this week and beyond' },
];

// ─── Mission card ────────────────────────────────────────────────────────────
const MissionCard = memo(function MissionCard({ task, onStart, onPause, onComplete, onEdit, onDelete }) {
    const isInProgress = task.status === 'in_progress';
    const { state } = useGame();
    const { xp: xpReward, gold: goldReward } = estimateTaskRewards(task, state.character);
    const overdue = isPast(task.dueDate);
    const isHard = task.difficulty === 3;

    const handleDragStart = (e) => {
        e.dataTransfer.setData('text/plain', task.id);
        e.dataTransfer.effectAllowed = 'move';
        requestAnimationFrame(() => e.target.style.opacity = '0.4');
    };
    const handleDragEnd = (e) => { e.target.style.opacity = ''; };

    return (
        <motion.div
            layout
            draggable
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, x: 24, transition: { duration: 0.22 } }}
            transition={{ type: 'spring', stiffness: 320, damping: 28 }}
            className={`group relative bg-rpg-panel/70 hover:bg-rpg-panel border rounded-lg p-4 transition-colors cursor-grab active:cursor-grabbing ${
                isInProgress ? 'border-blue-500/40 shadow-[0_0_0_1px_rgba(59,130,246,0.15)]' : 'border-white/5 hover:border-rpg-gold/30'
            }`}
        >
            {/* Top accent — difficulty */}
            <div className={`absolute top-0 left-0 right-0 h-0.5 rounded-t-lg ${isHard ? 'bg-red-500/70' : 'bg-blue-500/40'}`} />

            {/* Title + type */}
            <div className="flex items-start gap-2 mb-2">
                <PixelIcon
                    name={task.category === 'chore' ? 'box' : 'sword'}
                    size={14}
                    color={task.category === 'chore' ? '#f97316' : '#9ca3af'}
                    className="mt-0.5 flex-shrink-0"
                />
                <h3 className="font-heading font-medium text-sm text-white leading-snug flex-1 break-words">{task.title}</h3>
            </div>

            {task.extraInfo && (
                <p className="text-xs text-gray-400 mb-3 line-clamp-2 leading-relaxed">{task.extraInfo}</p>
            )}

            {/* Meta row */}
            <div className="flex items-center gap-2 flex-wrap text-[10px]">
                <span className="font-pixel text-rpg-gold leading-none">+{xpReward} XP</span>
                <span className="font-pixel text-yellow-600/70 leading-none">+{goldReward} G</span>
                {task.attribute && task.attribute !== 'none' && (
                    <span className="uppercase tracking-widest text-blue-400 font-bold text-[10px]">+{taskAttributeGain(task)} {task.attribute}</span>
                )}
                {isHard && (
                    <span className="uppercase tracking-widest text-red-400/80 font-bold text-[9px] ml-auto">Hard</span>
                )}
                {task.dueDate && (
                    <span className={`ml-auto tabular-nums ${overdue ? 'text-red-400 font-bold' : 'text-gray-500'}`}>
                        {overdue ? 'Overdue' : formatDue(task.dueDate)}
                    </span>
                )}
            </div>

            {/* Action row — reveal on hover */}
            <div className="mt-3 pt-3 border-t border-white/5 flex items-center gap-1 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
                <button
                    onClick={() => onComplete(task.id)}
                    className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-md text-[11px] bg-green-500/10 hover:bg-green-500/20 text-green-400 font-bold uppercase tracking-widest transition-colors cursor-pointer"
                >
                    <Check size={12} strokeWidth={3} /> Complete
                </button>
                <button
                    onClick={() => isInProgress ? onPause(task.id, task.status) : onStart(task.id, task.status)}
                    className={`p-1.5 rounded-md transition-colors cursor-pointer ${isInProgress ? 'text-blue-400 bg-blue-500/10 hover:bg-blue-500/20' : 'text-gray-400 hover:text-blue-400 hover:bg-blue-500/10'}`}
                    title={isInProgress ? 'Pause' : 'Start'}
                >
                    {isInProgress ? <Pause size={14} /> : <Play size={14} />}
                </button>
                <button
                    onClick={() => onEdit(task)}
                    className="p-1.5 rounded-md text-gray-400 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
                    title="Edit"
                >
                    <Edit2 size={14} />
                </button>
                <button
                    onClick={() => onDelete(task.id)}
                    className="p-1.5 rounded-md text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer"
                    title="Delete"
                >
                    <Trash2 size={14} />
                </button>
            </div>
        </motion.div>
    );
});

// ─── Column ──────────────────────────────────────────────────────────────────
const Column = memo(function Column({ col, tasks, onStart, onPause, onComplete, onEdit, onDelete, onDrop, onCreate }) {
    const [dragOver, setDragOver] = useState(false);
    const dragCountRef = useRef(0);

    const handleDragEnter = (e) => {
        e.preventDefault();
        dragCountRef.current++;
        setDragOver(true);
    };
    const handleDragLeave = () => {
        dragCountRef.current--;
        if (dragCountRef.current <= 0) { dragCountRef.current = 0; setDragOver(false); }
    };
    const handleDragOver = (e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; };
    const handleDrop = (e) => {
        e.preventDefault();
        dragCountRef.current = 0;
        setDragOver(false);
        const taskId = e.dataTransfer.getData('text/plain');
        if (taskId) onDrop(taskId, col.id);
    };

    return (
        <div
            className={`flex flex-col min-w-0 h-full rounded-xl transition-colors duration-150 ${dragOver ? 'bg-white/[0.03] ring-1 ring-inset ring-white/10' : ''}`}
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
        >
            <div className="mb-3 pb-3 border-b border-white/5">
                <div className="flex items-center gap-2 mb-1">
                    <span className={`w-1.5 h-1.5 rounded-full ${col.dot}`} />
                    <h2 className="font-heading font-bold text-sm text-white uppercase tracking-widest">{col.label}</h2>
                    <span className="ml-auto text-[11px] font-pixel text-gray-500 tabular-nums">{tasks.length}</span>
                </div>
                <p className="text-[10px] text-gray-500 uppercase tracking-wider">{col.hint}</p>
            </div>

            <div className="flex-1 space-y-2.5 overflow-y-auto pr-1 -mr-1 min-h-0">
                <AnimatePresence mode="popLayout">
                    {tasks.map(task => (
                        <MissionCard
                            key={task.id}
                            task={task}
                            onStart={onStart}
                            onPause={onPause}
                            onComplete={onComplete}
                            onEdit={onEdit}
                            onDelete={onDelete}
                        />
                    ))}
                </AnimatePresence>
                {tasks.length === 0 && (
                    <div className={`flex flex-col items-center justify-center h-24 rounded-lg border transition-colors ${dragOver ? 'border-rpg-gold/40 text-rpg-gold/60 bg-rpg-gold/5 border-dashed' : 'border-white/[0.04] bg-white/[0.015]'}`}>
                        {dragOver ? (
                            <span className="text-[11px] uppercase tracking-widest">Drop here</span>
                        ) : (
                            <>
                                <span className="text-[11px] text-gray-500 uppercase tracking-wider">No quests yet</span>
                                <button
                                    onClick={onCreate}
                                    className="mt-1.5 text-[10px] text-rpg-gold/80 hover:text-rpg-gold font-bold uppercase tracking-widest transition-colors"
                                >
                                    + Create one
                                </button>
                            </>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
});

// ─── Done drawer ─────────────────────────────────────────────────────────────
const DoneDrawer = ({ open, onClose, doneTasks }) => (
    <AnimatePresence>
        {open && (
            <>
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
                    onClick={onClose}
                />
                <motion.div
                    initial={{ x: '100%' }}
                    animate={{ x: 0 }}
                    exit={{ x: '100%' }}
                    transition={{ type: 'spring', stiffness: 320, damping: 34 }}
                    className="fixed top-0 right-0 bottom-0 w-full max-w-md bg-rpg-panelDark border-l border-white/10 z-50 flex flex-col shadow-2xl"
                >
                    <div className="p-6 border-b border-white/5 flex items-center justify-between">
                        <div>
                            <div className="text-[10px] uppercase tracking-widest text-gray-500 font-bold mb-1">Archive</div>
                            <h2 className="font-heading font-bold text-xl text-white">Completed quests</h2>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 rounded-md hover:bg-white/5 text-gray-400 hover:text-white transition-colors cursor-pointer"
                        >
                            <X size={18} />
                        </button>
                    </div>
                    <div className="flex-1 overflow-y-auto p-6 space-y-2">
                        {doneTasks.length === 0 ? (
                            <div className="text-center text-sm text-gray-500 py-12">No completed quests yet.</div>
                        ) : (
                            doneTasks.map((task, idx) => (
                                <div key={`${task.id}-${idx}`} className="bg-rpg-panel/50 border border-white/5 rounded-lg p-3 opacity-70 hover:opacity-100 transition-opacity">
                                    <div className="flex items-start justify-between gap-3">
                                        <span className="text-sm text-gray-300 line-through leading-snug flex-1">{task.title}</span>
                                        <span className="text-[10px] font-pixel text-rpg-gold whitespace-nowrap">+{task.difficulty === 3 ? '40' : '20'} XP</span>
                                    </div>
                                    {task.lastCompleted && (
                                        <div className="text-[10px] text-gray-600 mt-1.5 uppercase tracking-wider">
                                            {new Date(task.lastCompleted).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                        </div>
                                    )}
                                </div>
                            ))
                        )}
                    </div>
                </motion.div>
            </>
        )}
    </AnimatePresence>
);

// ─── Main view ───────────────────────────────────────────────────────────────
const Missions = () => {
    const { state, actions } = useGame();
    const confirm = useConfirm();
    const [editingTask, setEditingTask] = useState(null);
    const [isCreating, setIsCreating] = useState(false);
    const [showDone, setShowDone] = useState(false);
    const [filter, setFilter] = useState('all'); // all | quest | chore

    const columns = useMemo(() => {
        const filtered = state.tasks.filter(t => {
            if (t.completed) return false;
            if (t.projectId) return false;
            if (filter === 'quest') return t.category !== 'chore';
            if (filter === 'chore') return t.category === 'chore';
            return true;
        });

        return {
            in_progress: filtered.filter(t => t.status === 'in_progress'),
            today:       filtered.filter(t => t.status !== 'in_progress' && (isToday(t.dueDate) || isPast(t.dueDate) || !t.dueDate)),
            upcoming:    filtered.filter(t => t.status !== 'in_progress' && t.dueDate && !isToday(t.dueDate) && !isPast(t.dueDate)),
        };
    }, [state.tasks, filter]);

    const doneTasks = useMemo(() =>
        [...(state.completedTasks || [])].reverse().slice(0, 30)
    , [state.completedTasks]);

    const totals = {
        in_progress: columns.in_progress.length,
        today: columns.today.length,
        upcoming: columns.upcoming.length,
        done: doneTasks.length,
    };

    const handleStart = useCallback((id, currentStatus) => {
        actions.updateTaskStatus(id, currentStatus === 'in_progress' ? null : 'in_progress');
    }, [actions]);
    const handlePause = handleStart;
    const handleComplete = useCallback((id) => {
        actions.completeTask(id);
    }, [actions]);
    const handleEdit = useCallback((task) => {
        setEditingTask(task);
        setIsCreating(true);
    }, []);
    const handleDelete = useCallback(async (id) => {
        if (await confirm({ title: 'Abort Mission?', message: 'This mission will be permanently removed from the board.', variant: 'danger', confirmText: 'Abort' })) {
            actions.deleteTask(id);
        }
    }, [actions, confirm]);
    const handleDrop = useCallback((taskId, targetCol) => {
        const task = state.tasks.find(t => String(t.id) === String(taskId));
        if (!task) return;

        const today = new Date().toLocaleDateString('en-CA');
        const tomorrow = (() => { const d = new Date(); d.setDate(d.getDate() + 1); return d.toLocaleDateString('en-CA'); })();

        if (targetCol === 'in_progress') {
            actions.editTask(task.id, { status: 'in_progress' });
        } else if (targetCol === 'today') {
            actions.editTask(task.id, { status: null, dueDate: today });
        } else if (targetCol === 'upcoming') {
            const keepDate = task.dueDate && !isToday(task.dueDate) && !isPast(task.dueDate) ? task.dueDate : tomorrow;
            actions.editTask(task.id, { status: null, dueDate: keepDate });
        }
    }, [state.tasks, actions]);
    const handleClose = useCallback(() => {
        setIsCreating(false);
        setEditingTask(null);
    }, []);

    return (
        <div className="h-[calc(100vh-140px)] flex flex-col">
            {/* Header */}
            <header className="flex items-center gap-6 pb-6 flex-wrap">
                <div>
                    <div className="text-[10px] uppercase tracking-[0.3em] text-gray-400 font-bold mb-1.5">Board</div>
                    <h1 className="font-herald text-3xl md:text-4xl leading-none text-rpg-gold">Quests</h1>
                </div>

                {/* Filter pills */}
                <div className="flex items-center gap-1 bg-white/5 border border-white/5 rounded-lg p-1">
                    {[
                        { id: 'all',   label: 'All' },
                        { id: 'quest', label: 'Quests' },
                        { id: 'chore', label: 'Chores' },
                    ].map(f => (
                        <button
                            key={f.id}
                            onClick={() => setFilter(f.id)}
                            className={`px-3 py-1.5 text-[11px] font-bold uppercase tracking-widest rounded-md transition-colors cursor-pointer ${
                                filter === f.id
                                    ? 'bg-rpg-panelLight text-white'
                                    : 'text-gray-400 hover:text-white'
                            }`}
                        >
                            {f.label}
                        </button>
                    ))}
                </div>

                {/* Totals */}
                <div className="hidden xl:flex items-center gap-4 text-[11px] font-heading font-bold uppercase tracking-widest text-gray-500">
                    <span><span className="font-pixel text-blue-400 text-base">{totals.in_progress}</span> Doing</span>
                    <span><span className="font-pixel text-rpg-gold text-base">{totals.today}</span> Today</span>
                    <span><span className="font-pixel text-purple-400 text-base">{totals.upcoming}</span> Upcoming</span>
                </div>

                <div className="ml-auto flex items-center gap-2">
                    <button
                        onClick={() => setShowDone(true)}
                        className="flex items-center gap-2 px-4 py-2 rounded-lg border border-white/10 hover:border-white/30 text-gray-400 hover:text-white text-[11px] font-bold uppercase tracking-widest transition-colors cursor-pointer"
                    >
                        <Archive size={14} /> Done ({totals.done})
                    </button>
                    <button
                        onClick={() => { setEditingTask(null); setIsCreating(true); }}
                        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-rpg-gold text-rpg-panel hover:bg-yellow-400 text-[11px] font-heading font-bold uppercase tracking-widest transition-colors cursor-pointer shadow-[0_4px_0_rgba(139,92,15,0.6)] active:translate-y-[2px] active:shadow-[0_2px_0_rgba(139,92,15,0.6)]"
                    >
                        <Plus size={14} strokeWidth={3} /> New quest
                    </button>
                </div>
            </header>

            {/* Board — 3 columns */}
            <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-6 min-h-0">
                {COLUMNS.map(col => (
                    <Column
                        key={col.id}
                        col={col}
                        tasks={columns[col.id]}
                        onStart={handleStart}
                        onPause={handlePause}
                        onComplete={handleComplete}
                        onEdit={handleEdit}
                        onDelete={handleDelete}
                        onDrop={handleDrop}
                        onCreate={() => { setEditingTask(null); setIsCreating(true); }}
                    />
                ))}
            </div>

            {/* Done drawer */}
            <DoneDrawer open={showDone} onClose={() => setShowDone(false)} doneTasks={doneTasks} />

            {/* Create / edit modal */}
            <Modal isOpen={isCreating} onClose={handleClose} wrapperClassName="w-full max-w-lg max-h-[90vh] overflow-y-auto custom-scrollbar">
                <TaskForm initialData={editingTask} onClose={handleClose} />
            </Modal>
        </div>
    );
};

export default Missions;
