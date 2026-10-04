import React, { useCallback, useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useGame } from '../../context/GameContext';
import { PeacefulRealm } from '../common/PixelEmpty';
import TaskForm from './TaskForm';
import Modal from '../common/Modal';
import { useConfirm } from '../../context/ConfirmContext';
import { estimateTaskRewards, getDueInfo } from '../../utils/gameUtils';

// One display font stack (Outfit) for the wordmark, Inter for everything else,
// VT323 pixel monospace kept only for numerals — matches the app's existing
// 3-font vocabulary. No italics, no serif — keeps mobile legibility clean.
const PIXEL = { fontFamily: "'VT323', 'Courier New', monospace" };

// Parchment surface tokens
const PARCHMENT = '#FDF6E3';
const INK = '#3a2a15';
const INK_MID = '#78350f';
const INK_SEAL = '#b91c1c';
const DUE_TONE = { overdue: INK_SEAL, today: '#b45309', soon: INK_MID, later: INK_MID };

// Jagged SVG top/bottom edges so the panel reads as torn parchment
const TornEdgeTop = () => (
    <svg viewBox="0 0 200 10" preserveAspectRatio="none" className="block w-full h-[10px]">
        <path
            d="M0,10 L0,4 L6,7 L12,3 L18,6 L26,2 L34,7 L42,4 L50,7 L58,3 L66,6 L74,4 L82,7 L92,2 L100,6 L110,3 L118,7 L128,4 L138,6 L146,3 L156,7 L166,4 L174,6 L184,3 L192,7 L200,4 L200,10 Z"
            fill={PARCHMENT}
        />
    </svg>
);

const TornEdgeBottom = () => (
    <svg viewBox="0 0 200 10" preserveAspectRatio="none" className="block w-full h-[10px]">
        <path
            d="M0,0 L0,6 L6,3 L14,7 L22,4 L30,8 L38,3 L46,7 L54,4 L62,8 L70,3 L78,7 L88,4 L96,8 L104,3 L114,6 L122,3 L132,7 L142,4 L152,8 L160,3 L168,7 L176,4 L184,8 L192,3 L200,6 L200,0 Z"
            fill={PARCHMENT}
        />
    </svg>
);

const QuestRow = ({ task, onComplete, onEdit, onDelete, character }) => {
    const [checked, setChecked] = React.useState(false);
    const rewards = estimateTaskRewards(task, character);
    const due = getDueInfo(task.dueDate);
    const handleComplete = React.useCallback((e) => {
        setChecked(true);
        onComplete(task.id, e.clientX, e.clientY);
    }, [task.id, onComplete]);
    return (
    <motion.div
        layout
        initial={{ opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, x: 20, transition: { duration: 0.25, ease: [0.22, 1, 0.36, 1] } }}
        transition={{ type: 'spring', stiffness: 300, damping: 32 }}
        className="group grid grid-cols-[18px_1fr_auto] gap-3 items-baseline py-2.5 border-b border-dotted border-[#78350f]/30 last:border-b-0"
    >
        <motion.button
            onClick={handleComplete}
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.9 }}
            transition={{ type: 'spring', stiffness: 340, damping: 26 }}
            className={`w-3.5 h-3.5 border-2 rounded-sm mt-1 transition-colors duration-150 ${checked ? 'border-[#78350f] bg-[#78350f]/20' : 'border-[#78350f] hover:bg-[#78350f]/15'}`}
            title="Mark complete"
            aria-label={`Complete quest: ${task.title}`}
        >
            {checked && (
                <svg width="10" height="10" viewBox="0 0 12 12" fill="none" className="block -mt-0.5 -ml-0.5">
                    <path d="M2.5 6.5L5 9L9.5 3.5" stroke="#78350f" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" pathLength="1" className="check-draw" />
                </svg>
            )}
        </motion.button>
        <button
            onClick={() => onEdit(task)}
            className="text-left leading-snug text-[15px] hover:text-[#78350f] transition-colors font-medium"
            style={{ color: INK }}
            title="Tap to edit"
        >
            {task.title}
            {task.difficulty === 3 && (
                <span className="ml-2 text-[10px] font-bold uppercase tracking-widest text-[#b91c1c]/80">
                    HARD
                </span>
            )}
            {due && (
                <span
                    className="block mt-0.5 text-[11px] font-semibold"
                    style={{ color: DUE_TONE[due.tone], opacity: due.tone === 'later' ? 0.6 : 1 }}
                >
                    {due.label}
                </span>
            )}
        </button>
        <div className="flex flex-col items-end">
            <span
                className="text-right whitespace-nowrap font-bold leading-none"
                style={{ ...PIXEL, fontSize: 15, color: INK_MID, letterSpacing: '0.03em' }}
            >
                +{rewards.xp} xp
            </span>
            <span
                className="text-right whitespace-nowrap font-bold leading-none mt-0.5"
                style={{ ...PIXEL, fontSize: 15, color: INK_MID, letterSpacing: '0.03em' }}
            >
                +{rewards.gold} g
            </span>
            <button
                onClick={() => onDelete(task.id)}
                className="hidden [@media(hover:hover)]:block opacity-0 group-hover:opacity-70 focus-visible:opacity-100 hover:!opacity-100 text-[10px] font-bold uppercase tracking-wider text-[#b91c1c] mt-1 transition-opacity"
                title="Delete quest"
            >
                strike
            </button>
        </div>
    </motion.div>
    );
};

/**
 * The Questbook — parchment-styled Quest Log for the dashboard sidebar.
 *
 * Renders active quests (excludes chores + habits, which stay in TaskList
 * below). Complete via the checkbox; tap the quest title to open the
 * edit modal; hover reveals a subtle "strike" delete affordance.
 *
 * Empty state uses the PeacefulRealm pixel-art illustration.
 */
const Questbook = () => {
    const { state, actions } = useGame();
    const confirm = useConfirm();
    const activeTasks = (state.tasks || []).filter(
        (t) => !t.completed && t.category !== 'chore' && !t.projectId
    );
    const [editingTask, setEditingTask] = useState(null);
    const [isCreating, setIsCreating] = useState(false);
    const [quickTitle, setQuickTitle] = useState('');
    const [prefilledTitle, setPrefilledTitle] = useState('');
    const quickAddRef = useRef(null);

    const openNewQuest = (title = '') => {
        setPrefilledTitle(title);
        setIsCreating(true);
    };

    const handleQuickKeyDown = (e) => {
        if (e.key === 'Escape') {
            setQuickTitle('');
            e.target.blur();
        }
        if (e.key === 'Enter') {
            e.preventDefault();
            const title = quickTitle.trim();
            if (e.shiftKey) {
                setQuickTitle('');
                openNewQuest(title);
            } else if (title) {
                actions.addTask(title, 1);
                setQuickTitle('');
            }
        }
    };

    useEffect(() => {
        const handleGlobalKey = (e) => {
            if (e.key !== 'n' && e.key !== 'N') return;
            if (e.metaKey || e.ctrlKey || e.altKey) return;
            const tag = document.activeElement?.tagName;
            if (tag === 'INPUT' || tag === 'TEXTAREA' || document.activeElement?.isContentEditable) return;
            e.preventDefault();
            quickAddRef.current?.focus();
        };
        window.addEventListener('keydown', handleGlobalKey);
        return () => window.removeEventListener('keydown', handleGlobalKey);
    }, []);

    const handleComplete = useCallback(
        (id, x, y) => actions.completeTask(id, x, y),
        [actions]
    );
    const handleDelete = useCallback(
        async (id) => {
            if (await confirm({ title: 'Strike from the Book?', message: 'This quest will be erased from your chronicle.', variant: 'danger', confirmText: 'Strike It' })) {
                actions.deleteTask(id);
            }
        },
        [actions, confirm]
    );

    const dayLabel = new Date().toLocaleDateString('en-US', { weekday: 'long' });

    return (
        <div className="relative">
            <TornEdgeTop />
            <div
                className="px-5 pt-4 pb-3 relative group"
                style={{
                    backgroundColor: PARCHMENT,
                    boxShadow: 'inset 0 0 40px rgba(120,53,15,0.08)',
                }}
            >
                {/* Header — eyebrow, title, wax seal */}
                <div className="flex justify-between items-start pb-3 mb-3 border-b border-dashed border-[#3a2a15]/25">
                    <div>
                        <div
                            className="uppercase font-bold text-[10px]"
                            style={{ letterSpacing: '0.18em', color: INK_MID, opacity: 0.7 }}
                        >
                            {dayLabel}
                        </div>
                        <h3
                            className="mt-1 font-herald leading-none"
                            style={{ color: INK, fontSize: 22, letterSpacing: '0.02em' }}
                        >
                            The Questbook
                        </h3>
                    </div>
                    {/* Wax seal — displays open quest count */}
                    <div
                        className="w-10 h-10 rounded-full flex items-center justify-center font-bold flex-shrink-0 mt-1"
                        style={{
                            backgroundColor: INK_SEAL,
                            color: '#FFD700',
                            boxShadow: 'inset 0 -3px 5px rgba(0,0,0,0.35), 0 2px 4px rgba(0,0,0,0.4)',
                            ...PIXEL,
                            fontSize: 22,
                        }}
                        aria-label={`${activeTasks.length} open quests`}
                    >
                        {activeTasks.length}
                    </div>
                </div>

                {/* Body */}
                {activeTasks.length === 0 ? (
                    <div className="py-5 text-center flex flex-col items-center gap-3">
                        <PeacefulRealm size={72} />
                        <div className="font-medium text-[14px]" style={{ color: INK }}>
                            Ledgar's pages lie blank.
                        </div>
                        <button
                            onClick={() => quickAddRef.current?.focus()}
                            className="mt-1 px-4 py-2 rounded-lg font-bold text-[12px] uppercase tracking-wider transition-all hover:scale-[1.02] active:scale-[0.98]"
                            style={{
                                backgroundColor: INK_MID,
                                color: PARCHMENT,
                                boxShadow: '0 2px 0 rgba(58,42,21,0.5)',
                            }}
                        >
                            Write your first quest
                        </button>
                    </div>
                ) : (
                    <AnimatePresence mode="popLayout" initial={false}>
                        {activeTasks.map((task) => (
                            <QuestRow
                                key={task.id}
                                task={task}
                                character={state.character}
                                onComplete={handleComplete}
                                onEdit={setEditingTask}
                                onDelete={handleDelete}
                            />
                        ))}
                    </AnimatePresence>
                )}

                {/* Quick-add input — desktop/tablet only (mobile has the big ADD QUEST button) */}
                <div className={`hidden md:block ${activeTasks.length > 0 ? 'mt-3 pt-3 border-t border-dashed border-[#3a2a15]/25' : 'mt-1'}`}>
                    <div className="flex items-center gap-2">
                        <span style={{ color: INK_MID }} className="text-[15px] opacity-50 leading-none select-none">+</span>
                        <input
                            ref={quickAddRef}
                            type="text"
                            value={quickTitle}
                            onChange={(e) => setQuickTitle(e.target.value)}
                            onKeyDown={handleQuickKeyDown}
                            placeholder="Write a quest…"
                            aria-label="Quick-add a quest"
                            className="flex-1 bg-transparent text-[14px] placeholder-[#78350f]/35 outline-none font-medium"
                            style={{ color: INK, caretColor: INK_MID }}
                        />
                        <button
                            type="button"
                            onClick={() => openNewQuest(quickTitle.trim())}
                            className="opacity-0 focus-visible:opacity-100 group-hover:opacity-100 hover:!opacity-100 text-[10px] font-bold uppercase tracking-widest transition-opacity"
                            style={{ color: INK_MID }}
                            title="Open full form (Shift+Enter)"
                        >
                            more
                        </button>
                    </div>
                    {activeTasks.length > 0 && (
                        <div className="flex items-center justify-between mt-1.5">
                            <span className="text-[9px] uppercase tracking-widest opacity-30 font-bold" style={{ color: INK_MID }}>
                                Press N to focus
                            </span>
                            <span className="text-[11px] font-bold uppercase tracking-wider" style={{ color: INK_MID, opacity: 0.5 }}>
                                {activeTasks.length} open
                            </span>
                        </div>
                    )}
                </div>
                {/* Mobile: just show open count */}
                {activeTasks.length > 0 && (
                    <div className="md:hidden mt-2 text-right">
                        <span className="text-[11px] font-bold uppercase tracking-wider" style={{ color: INK_MID, opacity: 0.5 }}>
                            {activeTasks.length} open
                        </span>
                    </div>
                )}
            </div>
            <TornEdgeBottom />

            {/* Create / edit modal — reuses TaskForm */}
            <Modal
                isOpen={!!(editingTask || isCreating)}
                dismissable={false}
                onClose={() => { setEditingTask(null); setIsCreating(false); setPrefilledTitle(''); }}
            >
                <TaskForm
                    onClose={() => { setEditingTask(null); setIsCreating(false); setPrefilledTitle(''); }}
                    initialData={editingTask || (prefilledTitle ? { title: prefilledTitle } : null)}
                />
            </Modal>
        </div>
    );
};

export default Questbook;
