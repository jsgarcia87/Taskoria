import React, { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { useGame } from '../../context/GameContext';
import TaskForm from './TaskForm';
import PixelIcon from '../common/PixelIcon';

const CalendarView = () => {
    const { state, actions } = useGame();
    const { tasks } = state;

    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState(null);
    const [showTaskModal, setShowTaskModal] = useState(false);

    // Calculate days for the grid
    const daysInMonth = useMemo(() => {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        const firstDay = new Date(year, month, 1).getDay(); // 0 = Sunday
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        
        const days = [];
        // Add empty slots for days before the 1st
        for (let i = 0; i < firstDay; i++) {
            days.push(null);
        }
        
        for (let i = 1; i <= daysInMonth; i++) {
            const dateStr = new Date(year, month, i).toLocaleDateString('en-CA');
            days.push({
                day: i,
                dateStr: dateStr
            });
        }
        return days;
    }, [currentDate]);

    // Group tasks by date
    const tasksByDate = useMemo(() => {
        const grouped = {};
        tasks.forEach(task => {
            if (!task.completed && task.dueDate) {
                if (!grouped[task.dueDate]) grouped[task.dueDate] = [];
                grouped[task.dueDate].push(task);
            }
        });
        return grouped;
    }, [tasks]);

    const handlePrevMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    };

    const handleNextMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
    };

    const isToday = (dateStr) => {
        return dateStr === new Date().toLocaleDateString('en-CA');
    };

    const handleDayClick = (dayObj) => {
        if (!dayObj) return;
        setSelectedDate(dayObj.dateStr);
    };

    const handleAddTask = () => {
        if (!selectedDate) setSelectedDate(new Date().toLocaleDateString('en-CA'));
        setShowTaskModal(true);
    };

    const completeTaskFromCalendar = (task) => {
        actions.completeTask(task.id);
    };

    return (
        <div className="glass-panel p-4 md:p-6 mb-8 relative">
            {/* Header */}
            <div className="flex flex-col md:flex-row items-center justify-between mb-6 gap-4">
                <h2 className="text-xl font-heading font-bold text-gray-300 uppercase tracking-widest flex items-center gap-2">
                    <PixelIcon name="clock" size={24} className="text-rpg-gold" />
                    Event Calendar
                </h2>

                <div className="flex items-center gap-4 bg-black/40 rounded-xl p-2 border border-white/5">
                    <button onClick={handlePrevMonth} className="p-2 hover:bg-white/10 rounded-lg transition-colors text-gray-400 hover:text-white">
                        <ChevronLeft size={20} />
                    </button>
                    <span className="min-w-[140px] text-center font-bold text-rpg-gold font-heading tracking-widest">
                        {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                    </span>
                    <button onClick={handleNextMonth} className="p-2 hover:bg-white/10 rounded-lg transition-colors text-gray-400 hover:text-white">
                        <ChevronRight size={20} />
                    </button>
                </div>
            </div>

            {/* Grid */}
            <div className="grid grid-cols-7 gap-1 md:gap-2 mb-6">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                    <div key={day} className="text-center text-[10px] md:text-xs font-bold text-gray-500 uppercase tracking-widest py-2">
                        {day}
                    </div>
                ))}
                
                {daysInMonth.map((dayObj, i) => {
                    if (!dayObj) {
                        return <div key={`empty-${i}`} className="h-16 md:h-24 bg-black/10 rounded-xl border border-transparent"></div>;
                    }

                    const hasTasks = tasksByDate[dayObj.dateStr] || [];
                    const isSelected = selectedDate === dayObj.dateStr;
                    const today = isToday(dayObj.dateStr);

                    return (
                        <div 
                            key={i} 
                            onClick={() => handleDayClick(dayObj)}
                            className={`h-16 md:h-24 rounded-xl border p-1 md:p-2 cursor-pointer transition-all flex flex-col items-center md:items-start group
                            ${isSelected ? 'bg-indigo-900/40 border-indigo-500 shadow-[0_0_15px_rgba(99,102,241,0.3)] scale-105 z-10' : 
                              today ? 'bg-rpg-gold/10 border-rpg-gold/50' : 
                              'bg-black/40 border-white/5 hover:bg-white/5 hover:border-white/20'}`}
                        >
                            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold mb-1
                                ${today ? 'bg-rpg-gold text-black shadow-glow-gold' : 
                                  isSelected ? 'bg-indigo-500 text-white' : 'text-gray-400'}`}>
                                {dayObj.day}
                            </div>
                            
                            {hasTasks.length > 0 && (
                                <div className="w-full flex-1 overflow-y-auto custom-scrollbar no-scrollbar flex flex-col gap-1 items-center md:items-start">
                                    {hasTasks.slice(0, 3).map(task => (
                                        <div key={task.id} className="w-full text-[8px] md:text-[10px] bg-red-900/50 text-red-200 px-1 py-0.5 rounded truncate font-medium border border-red-500/20" title={task.name}>
                                            <span className="hidden md:inline">• </span>{task.name}
                                        </div>
                                    ))}
                                    {hasTasks.length > 3 && (
                                        <div className="text-[8px] text-gray-500 font-bold">+{hasTasks.length - 3} more</div>
                                    )}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Selected Day Details */}
            {selectedDate && (
                <div className="bg-black/40 border border-white/10 rounded-2xl p-4 md:p-6 animate-in fade-in slide-in-from-bottom-4">
                    <div className="flex items-center justify-between mb-4 border-b border-white/5 pb-4">
                        <h3 className="text-lg font-bold text-white flex items-center gap-2">
                            Events for {new Date(selectedDate).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
                        </h3>
                        <button 
                            onClick={handleAddTask}
                            className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-xl font-bold flex items-center gap-2 text-sm transition-all shadow-[0_0_15px_rgba(79,70,229,0.3)] hover:scale-105"
                        >
                            <Plus size={16} /> <span className="hidden sm:inline">Add Event / Quest</span>
                        </button>
                    </div>

                    <div className="space-y-2 max-h-[200px] overflow-y-auto custom-scrollbar">
                        {(tasksByDate[selectedDate] || []).length === 0 ? (
                            <div className="text-center text-gray-500 py-6 text-sm italic">
                                No events or quests scheduled for this day.
                            </div>
                        ) : (
                            (tasksByDate[selectedDate] || []).map(task => (
                                <div key={task.id} className="flex items-center justify-between bg-white/5 p-3 rounded-xl border border-white/5">
                                    <div className="flex items-center gap-3">
                                        <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></div>
                                        <div>
                                            <div className="font-bold text-sm text-gray-200">{task.name}</div>
                                            {task.extraInfo && <div className="text-xs text-gray-500">{task.extraInfo}</div>}
                                        </div>
                                    </div>
                                    <button 
                                        onClick={() => completeTaskFromCalendar(task)}
                                        className="text-[10px] font-bold uppercase tracking-wider bg-green-900/40 text-green-400 hover:bg-green-500 hover:text-white px-3 py-1.5 rounded-lg transition-colors border border-green-500/30"
                                    >
                                        Complete
                                    </button>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}

            {/* Modal Task Form */}
            {showTaskModal && (
                <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
                    <div className="w-full max-w-md animate-in slide-in-from-bottom-8 duration-300 relative">
                        {/* TaskForm doesn't have an x button inside by default to close if we bypass App.jsx's layout, but actually it handles its own styling. Wait, in App.jsx it just renders <TaskForm onClose />. */}
                        <TaskForm 
                            onClose={() => setShowTaskModal(false)}
                            initialData={{ dueDate: selectedDate }}
                        />
                    </div>
                </div>
            )}
        </div>
    );
};

export default CalendarView;
