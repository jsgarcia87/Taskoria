import React, { useState, useEffect } from 'react';
import PixelIcon from './PixelIcon';
import { useGame } from '../../context/GameContext';

const Screensaver = ({ onDismiss }) => {
    const { state } = useGame();
    const { tasks } = state;
    const [currentTime, setCurrentTime] = useState(new Date());

    // --- SCREEN WAKE LOCK ---
    useEffect(() => {
        let wakeLock = null;

        const requestWakeLock = async () => {
            if ('wakeLock' in navigator) {
                try {
                    wakeLock = await navigator.wakeLock.request('screen');
                    // console.log('Screen Wake Lock is active');
                    
                    // Listen for release
                    wakeLock.addEventListener('release', () => {
                        // console.log('Screen Wake Lock was released');
                    });
                } catch (err) {
                    console.error(`${err.name}, ${err.message}`);
                }
            }
        };

        requestWakeLock();

        // Release on unmount
        return () => {
            if (wakeLock !== null) {
                wakeLock.release().then(() => {
                    wakeLock = null;
                });
            }
        };
    }, []);

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    // Get up to 5 pending tasks
    const pendingTasks = tasks.filter(t => !t.completed).slice(0, 5);

    const timeString = currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const secondsString = currentTime.toLocaleTimeString([], { second: '2-digit' });
    const dateString = currentTime.toLocaleDateString('es-ES', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    });

    return (
        <div 
            className="fixed inset-0 z-[9999] bg-[#0a0510] flex flex-col items-center justify-center p-8 animate-in fade-in duration-1000 cursor-none select-none overflow-hidden"
            onClick={onDismiss}
            onMouseMove={onDismiss}
            onTouchStart={onDismiss}
        >
            {/* Ambient Background Glows */}
            <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-purple-900/10 blur-[120px] rounded-full animate-pulse" />
            <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-blue-900/10 blur-[120px] rounded-full animate-pulse duration-[3000ms]" />

            <div className="relative z-10 flex flex-col items-center text-center max-w-4xl w-full">
                {/* Time Display */}
                <div className="flex items-baseline gap-2 mb-2">
                    <h1 className="text-8xl md:text-[10rem] font-bold font-heading text-white drop-shadow-[0_0_30px_rgba(255,255,255,0.3)] tracking-tighter">
                        {timeString.split(' ')[0]}
                    </h1>
                    <span className="text-3xl md:text-5xl font-mono text-rpg-gold/60 mb-4 animate-pulse">
                        {secondsString}
                    </span>
                </div>

                {/* Date Display */}
                <p className="text-xl md:text-3xl font-heading text-rpg-gold uppercase tracking-widest mb-16 opacity-80 decoration-rpg-gold/30 underline-offset-8 underline decoration-2">
                    {dateString}
                </p>

                {/* Tasks Section */}
                {pendingTasks.length > 0 && (
                    <div className="w-full max-w-2xl bg-white/5 backdrop-blur-md border border-white/10 rounded-3xl p-8 shadow-2xl animate-in slide-in-from-bottom-10 duration-1000">
                        <h2 className="text-sm font-bold text-gray-400 uppercase tracking-[0.3em] mb-6 flex items-center justify-center gap-3">
                            <PixelIcon name="checkSquare" size={16} color="#fbbf24" />
                            Pending Quests
                        </h2>
                        
                        <div className="space-y-4">
                            {pendingTasks.map((task, idx) => (
                                <div key={task.id} className="flex items-center gap-4 text-left group">
                                    <div className="w-2 h-2 rounded-full bg-rpg-gold shadow-[0_0_8px_rgba(251,191,36,0.6)] group-hover:scale-125 transition-transform" />
                                    <p className="text-lg md:text-xl text-gray-100 font-medium truncate group-hover:text-white transition-colors">
                                        {task.title}
                                    </p>
                                    {task.dueDate && (
                                        <span className="ml-auto text-xs font-mono text-gray-500 bg-black/30 px-2 py-1 rounded border border-white/5">
                                            {task.dueDate}
                                        </span>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Interaction Hint */}
                <p className="fixed bottom-12 text-gray-600 font-mono text-[10px] tracking-[0.5em] uppercase animate-pulse">
                    Tap anywhere to return to adventure
                </p>
            </div>

            {/* Floating Pixel Elements (Decorative) */}
            <div className="absolute top-[10%] left-[15%] opacity-20 animate-bounce transition-all duration-[4000ms]">
                <PixelIcon name="heart" size={24} color="#f87171" className="fill-current" />
            </div>
            <div className="absolute bottom-[20%] right-[10%] opacity-20 animate-bounce transition-all duration-[5000ms]">
                <PixelIcon name="coins" size={24} color="#fbbf24" className="fill-current" />
            </div>
            <div className="absolute top-[30%] right-[20%] opacity-10 animate-pulse">
                <PixelIcon name="shield" size={48} color="#60a5fa" />
            </div>
        </div>
    );
};

export default Screensaver;
