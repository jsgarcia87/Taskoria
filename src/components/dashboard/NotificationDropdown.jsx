import React from 'react';
import { Bell, AlertTriangle, CalendarX2 } from 'lucide-react';
import PixelIcon from '../common/PixelIcon';

const NotificationDropdown = ({ isOpen, onClose, overdueTasks = [], setActiveView }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-x-4 top-[80px] md:inset-auto md:absolute md:right-0 md:top-full md:mt-4 md:w-80 bg-[#1a102e]/95 backdrop-blur-xl border border-white/10 rounded-3xl overflow-hidden animate-in fade-in slide-in-from-top-2 z-50 shadow-2xl ring-1 ring-white/10 flex flex-col max-h-[70vh]">
            
            <div className="p-4 border-b border-white/10 bg-black/20 flex justify-between items-center">
                <h3 className="text-white font-bold font-heading flex items-center gap-2">
                    <Bell size={18} className="text-rpg-gold" />
                    Alerts
                </h3>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar p-2">
                {overdueTasks.length === 0 ? (
                    <div className="text-center p-6 text-gray-500 flex flex-col items-center gap-2">
                        <AlertTriangle size={32} className="opacity-20 mb-2" />
                        <p className="text-sm">You're all caught up!</p>
                        <p className="text-[10px] uppercase tracking-wider">No pending alerts</p>
                    </div>
                ) : (
                    <div className="space-y-2 p-2">
                        <div className="text-[10px] text-gray-500 uppercase font-bold tracking-widest pl-2 mb-2">Overdue Tasks</div>
                        {overdueTasks.map(task => (
                            <div 
                                key={task.id}
                                className="w-full text-left p-3 bg-red-950/20 border border-red-500/20 hover:bg-white/5 rounded-xl transition-colors flex items-start gap-3 group relative cursor-pointer"
                                onClick={() => {
                                    if(setActiveView) setActiveView('home');
                                    onClose();
                                }}
                            >
                                <div className="mt-0.5">
                                    <CalendarX2 size={16} className="text-red-400 opacity-80" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="text-sm font-bold text-red-200 truncate group-hover:text-red-100 transition-colors">
                                        {task.name}
                                    </div>
                                    <div className="text-[10px] text-red-400 font-bold tracking-wider mt-1">
                                        Due: {task.dueDate}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default NotificationDropdown;
