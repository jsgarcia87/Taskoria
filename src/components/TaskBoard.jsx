import React, { useState } from 'react';
import { useGame } from '../context/GameContext';
import { Plus, Skull, Trash2, Sword, Flame } from 'lucide-react';

const TaskBoard = () => {
    const { state, actions } = useGame();
    const { tasks } = state;
    const [newTaskTitle, setNewTaskTitle] = useState('');
    const [difficulty, setDifficulty] = useState(1);
    const [dueDate, setDueDate] = useState('');
    const [recurrence, setRecurrence] = useState('none');
    const [isAdding, setIsAdding] = useState(false);
    const [confirmDeleteId, setConfirmDeleteId] = useState(null);

    const handleAddTask = (e) => {
        e.preventDefault();
        if (newTaskTitle.trim()) {
            actions.addTask(newTaskTitle, difficulty, dueDate, recurrence);
            setNewTaskTitle('');
            setDueDate(''); // Reset
            setRecurrence('none');
            setIsAdding(false);
        }
    };

    return (
        <div className="bg-dark-800 border-4 border-gray-700 p-4 h-full flex flex-col relative text-white">
            <div className="flex justify-between items-center mb-6 border-b-2 border-gray-600 pb-2">
                <h2 className="text-3xl font-pixel text-white">QUEST BOARD</h2>
                <button
                    onClick={() => setIsAdding(!isAdding)}
                    className="bg-rpg-green text-dark-900 p-2 hover:bg-green-400 active:translate-y-1 transition-all border-b-4 border-green-800 active:border-b-0"
                >
                    <Plus size={24} />
                </button>
            </div>

            {/* Add Task Form */}
            {isAdding && (
                <form onSubmit={handleAddTask} className="mb-6 bg-dark-900 p-4 border-2 border-dashed border-gray-600 animate-in slide-in-from-top-2">
                    <input
                        type="text"
                        value={newTaskTitle}
                        onChange={(e) => setNewTaskTitle(e.target.value)}
                        placeholder="New Quest Name..."
                        className="w-full bg-dark-800 border border-gray-600 p-2 mb-2 text-white outline-none focus:border-rpg-green"
                        autoFocus
                    />
                    <div className="flex gap-2 mb-2">
                        <input
                            type="date"
                            value={dueDate}
                            onChange={(e) => setDueDate(e.target.value)}
                            className="flex-grow bg-dark-800 border border-gray-600 p-2 text-white outline-none focus:border-rpg-green"
                        />
                        <select
                            value={recurrence}
                            onChange={(e) => setRecurrence(e.target.value)}
                            className="bg-dark-800 border border-gray-600 p-2 text-white outline-none focus:border-rpg-green"
                        >
                            <option value="none">One-off</option>
                            <option value="daily">Daily</option>
                            <option value="weekly">Weekly</option>
                        </select>
                    </div>

                    <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                            <span className="text-gray-400">Difficulty:</span>
                            {[1, 2, 3, 4, 5].map(lvl => (
                                <button
                                    key={lvl}
                                    type="button"
                                    onClick={() => setDifficulty(lvl)}
                                    className={`w-8 h-8 flex items-center justify-center border ${difficulty === lvl ? 'bg-red-900 border-red-500 text-white' : 'border-gray-600 text-gray-500'}`}
                                >
                                    {lvl}
                                </button>
                            ))}
                        </div>
                        <button type="submit" className="bg-rpg-green text-dark-900 px-4 py-1 font-bold hover:bg-green-400">
                            ADD
                        </button>
                    </div>
                </form>
            )}

            {/* Task List */}
            <div className="space-y-3 overflow-y-auto flex-grow pr-2 scrollbar-thin scrollbar-thumb-gray-600 text-white">
                {tasks.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-gray-500 opacity-60 min-h-[200px]">
                        <Sword size={48} className="mb-4 text-gray-600 drop-shadow-md" />
                        <p className="text-xl uppercase font-pixel tracking-widest text-shadow-sm text-center">No Active Quests</p>
                        <p className="text-xs uppercase mt-2 font-bold tracking-widest">Enjoy the peace.</p>
                    </div>
                ) : (
                    tasks.map(task => {
                        const isCompletedRecurrence = task.completed && task.recurrence !== 'none';
                        return (
                            <div key={task.id} className={`group relative bg-dark-900 border ${isCompletedRecurrence ? 'border-green-800 opacity-60' : 'border-gray-600 hover:border-gray-400'} p-3 transition-all flex justify-between items-center`}>
                                <div className="flex flex-col">
                                    <span className={`text-lg font-pixel tracking-wide ${isCompletedRecurrence ? 'line-through text-gray-500' : ''}`}>{task.title}</span>
                                    <div className="flex flex-wrap gap-2 text-xs text-gray-500 items-center">
                                        {task.dueDate && <span>Due: {task.dueDate}</span>}
                                        {task.recurrence && task.recurrence !== 'none' && <span className="text-rpg-green capitalize">({task.recurrence})</span>}
                                        {task.streakCount > 0 && (
                                            <span className="flex items-center gap-1 text-orange-400 font-bold ml-1 animate-pulse" title="Daily Streak!">
                                                <Flame size={12} fill="currentColor" />
                                                <span>{task.streakCount}</span>
                                            </span>
                                        )}
                                    </div>
                                    <div className="flex gap-1 mt-1">
                                        {Array.from({ length: task.difficulty }).map((_, i) => (
                                            <Skull key={i} size={14} className="text-red-500" />
                                        ))}
                                    </div>
                                </div>

                                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    {!isCompletedRecurrence && (
                                        <button
                                            onClick={(e) => actions.completeTask(task.id, e.clientX, e.clientY)}
                                            className="bg-red-600 text-white p-2 hover:bg-red-500 active:scale-95"
                                            title="Complete Task (Attack)"
                                        >
                                            <Sword size={20} />
                                        </button>
                                    )}
                                    {confirmDeleteId === task.id ? (
                                        <button
                                            onClick={() => { actions.deleteTask(task.id); setConfirmDeleteId(null); }}
                                            onMouseLeave={() => setConfirmDeleteId(null)}
                                            className="bg-red-900 border border-red-500 text-white px-3 py-1 text-xs font-bold font-pixel tracking-widest hover:bg-red-800 shadow-lg hover:shadow-red-900/50"
                                        >
                                            SURE?
                                        </button>
                                    ) : (
                                        <button
                                            onClick={() => setConfirmDeleteId(task.id)}
                                            className="bg-gray-700 text-gray-300 p-2 hover:bg-gray-600 active:scale-95"
                                        >
                                            <Trash2 size={20} />
                                        </button>
                                    )}
                                </div>
                            </div>
                        )
                    })
                )}
            </div>
        </div>
    );
};
export default TaskBoard;
