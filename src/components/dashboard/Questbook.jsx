import React, { useCallback, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useGame } from '../../context/GameContext';
import { PeacefulRealm } from '../common/PixelEmpty';
import TaskForm from './TaskForm';

// One display font stack (Outfit) for the wordmark, Inter for everything else,
// VT323 pixel monospace kept only for numerals — matches the app's existing
// 3-font vocabulary. No italics, no serif — keeps mobile legibility clean.
const PIXEL = { fontFamily: "'VT323', 'Courier New', monospace" };

// Parchment surface tokens
const PARCHMENT = '#FDF6E3';
const INK = '#3a2a15';
const INK_MID = '#78350f';
const INK_SEAL = '#b91c1c';

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

const QuestRow = ({ task, onComplete, onEdit, onDelete }) => (
    <motion.div
        layout
        initial={{ opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, x: 20, transition: { duration: 0.25, ease: [0.22, 1, 0.36, 1] } }}
        transition={{ type: 'spring', stiffness: 300, damping: 32 }}
        className="group grid grid-cols-[18px_1fr_auto] gap-3 items-baseline py-2.5 border-b border-dotted border-[#78350f]/30 last:border-b-0"
    >
        <motion.button
            onClick={(e) => onComplete(task.id, e.clientX, e.clientY)}
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.9 }}
            transition={{ type: 'spring', stiffness: 340, damping: 26 }}
            className="w-3.5 h-3.5 border-2 border-[#78350f] rounded-sm mt-1 hover:bg-[#78350f]/15 transition-colors"
            title="Mark complete"
            aria-label={`Complete quest: ${task.title}`}
        />
        <button
            onClick={() => onEdit(task)}
            className="text-left leading-snug text-[15px] md:text-[15px] hover:text-[#78350f] transition-colors font-medium"
            style={{ color: INK }}
            title="Tap to edit"
        >
            {task.title}
            {task.difficulty === 3 && (
                <span className="ml-2 text-[10px] font-bold uppercase tracking-widest text-[#b91c1c]/80">
                    HARD
                </span>
            )}
        </button>
        <div className="flex flex-col items-end">
            <span
                className="text-right whitespace-nowrap font-bold leading-none"
                style={{ ...PIXEL, fontSize: 15, color: INK_MID, letterSpacing: '0.03em' }}
            >
                +{task.difficulty === 3 ? '40' : '20'} xp
            </span>
            <span
                className="text-right whitespace-nowrap font-bold leading-none mt-0.5"
                style={{ ...PIXEL, fontSize: 15, color: INK_MID, letterSpacing: '0.03em' }}
            >
                +{task.difficulty === 3 ? '20' : '10'} g
            </span>
            <button
                onClick={() => onDelete(task.id)}
                className="opacity-0 group-hover:opacity-70 hover:!opacity-100 text-[10px] font-bold uppercase tracking-wider text-[#b91c1c] mt-1 transition-opacity"
                title="Delete quest"
            >
                strike
            </button>
        </div>
    </motion.div>
);

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
    const activeTasks = (state.tasks || []).filter(
        (t) => !t.completed && t.category !== 'chore' && !t.projectId
    );
    const [editingTask, setEditingTask] = useState(null);
    const [isCreating, setIsCreating] = useState(false);

    const openNewQuest = () => setIsCreating(true);

    const handleComplete = useCallback(
        (id, x, y) => actions.completeTask(id, x, y),
        [actions]
    );
    const handleDelete = useCallback(
        (id) => {
            if (window.confirm('Strike this quest from the book?')) {
                actions.deleteTask(id);
            }
        },
        [actions]
    );

    const dayLabel = new Date().toLocaleDateString('en-US', { weekday: 'long' });

    return (
        <div className="relative">
            <TornEdgeTop />
            <div
                className="px-5 pt-4 pb-3 relative"
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
                            className="mt-1 font-heading font-extrabold uppercase leading-none"
                            style={{ color: INK, fontSize: 20, letterSpacing: '-0.01em' }}
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
                            The realm is peaceful.
                        </div>
                        <button
                            onClick={openNewQuest}
                            className="text-[11px] font-bold uppercase tracking-widest border border-[#78350f]/40 hover:border-[#78350f] hover:bg-[#78350f]/5 px-3 py-1.5 rounded-sm transition-colors"
                            style={{ color: INK_MID }}
                        >
                            Write a new quest
                        </button>
                    </div>
                ) : (
                    <>
                        <AnimatePresence mode="popLayout" initial={false}>
                            {activeTasks.map((task) => (
                                <QuestRow
                                    key={task.id}
                                    task={task}
                                    onComplete={handleComplete}
                                    onEdit={setEditingTask}
                                    onDelete={handleDelete}
                                />
                            ))}
                        </AnimatePresence>

                        {/* Footer — new quest CTA */}
                        <div className="mt-3 pt-3 border-t border-dashed border-[#3a2a15]/25 flex items-center justify-between">
                            <button
                                onClick={openNewQuest}
                                className="text-[11px] font-bold uppercase tracking-widest hover:text-[#3a2a15] transition-colors"
                                style={{ color: INK_MID }}
                            >
                                + Write a new quest
                            </button>
                            <span
                                className="text-[11px] font-bold uppercase tracking-wider"
                                style={{ color: INK_MID, opacity: 0.7 }}
                            >
                                {activeTasks.length} open
                            </span>
                        </div>
                    </>
                )}
            </div>
            <TornEdgeBottom />

            {/* Create / edit modal — reuses TaskForm */}
            {(editingTask || isCreating) && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
                    <div className="w-full max-w-md max-h-[90vh] overflow-y-auto custom-scrollbar">
                        <TaskForm
                            onClose={() => {
                                setEditingTask(null);
                                setIsCreating(false);
                            }}
                            initialData={editingTask}
                        />
                    </div>
                </div>
            )}
        </div>
    );
};

export default Questbook;
