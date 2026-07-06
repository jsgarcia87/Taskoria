import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Play, Pause, Skull, XCircle, Coffee, CheckCircle } from 'lucide-react';
import AvatarBattle from './common/AvatarBattle';
import PixelIcon from './common/PixelIcon';
import ModernPixelPet from './common/ModernPixelPet';
import { useGame } from '../context/GameContext';

const Pomodoro = ({ initialDuration = 20, initialBreak = 5, selectedTaskIds = [], isHatchMode = false, selectedEgg = null, onComplete, onCancel }) => {
    const { state, actions } = useGame();

    const [mode, setMode] = useState('work');
    const [timeLeft, setTimeLeft] = useState(initialDuration * 60);
    const [isActive, setIsActive] = useState(true);
    const [currentTime, setCurrentTime] = useState(new Date());

    // Tracking
    const [enemiesDefeated, setEnemiesDefeated] = useState(0);
    const [totalWorkSeconds, setTotalWorkSeconds] = useState(0);

    // UI States
    const [showSummary, setShowSummary] = useState(false);
    const [isBossActive, setIsBossActive] = useState(false);
    const [focusQuality, setFocusQuality] = useState(3);

    // Live tasks
    const activeTasks = state?.tasks?.filter(t => selectedTaskIds.includes(t.id) && !t.completed) || [];

    const handleCompleteTask = (e, taskId) => {
        e.stopPropagation(); // prevent other clicks if any
        if (actions.completeTask) {
            actions.completeTask(taskId);
            setEnemiesDefeated(prev => prev + 1); // Extra reward!
        }
    };

    useEffect(() => {
        let interval = null;
        if (isActive && timeLeft > 0) {
            interval = setInterval(() => {
                setTimeLeft(prev => prev - 1);
                setCurrentTime(new Date());
                if (mode === 'work') {
                    setTotalWorkSeconds(prev => {
                        const newTotal = prev + 1;
                        // Trigger boss every 5 minutes (300 seconds)
                        if (newTotal > 0 && newTotal % 300 === 0) {
                            setIsBossActive(true);
                        }
                        return newTotal;
                    });
                }
            }, 1000);
        } else if (timeLeft === 0 && isActive) {
            // Cycle modes automatically
            if (mode === 'work') {
                setMode('break');
                setTimeLeft(initialBreak * 60);
            } else {
                setMode('work');
                setTimeLeft(initialDuration * 60);
            }
        } else {
            // Just update the clock even if paused
            interval = setInterval(() => {
                setCurrentTime(new Date());
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [isActive, timeLeft, mode, initialDuration, initialBreak]);

    // Manual mode switch to skip rest/work
    const handleSkipPhase = () => {
        if (mode === 'work') {
            setMode('break');
            setTimeLeft(initialBreak * 60);
        } else {
            setMode('work');
            setTimeLeft(initialDuration * 60);
        }
    };

    const handleFinishEarly = () => {
        setIsActive(false);
        setShowSummary(true);
    };

    const handleClaim = () => {
        // Pass total minutes completed + enemies + focus quality
        const totalMinutesWorked = Math.floor(totalWorkSeconds / 60);
        onComplete({ enemiesDefeated, totalMinutesWorked, focusQuality });
    };

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    const formatClock = (date) => {
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    // Calculate dynamic rewards based on actual time worked
    const totalMinutesWorked = Math.floor(totalWorkSeconds / 60);
    const xpEarned = Math.floor((totalWorkSeconds / 60 * 2) * (1 + Math.min(enemiesDefeated, 25) / 100));
    const goldEarned = (totalMinutesWorked * 1) + (enemiesDefeated * 3); // Nerfeado fuertemente

    if (showSummary) {
        return createPortal(
            <div className="fixed inset-0 z-[9999] p-4 flex items-center justify-center bg-black/90 backdrop-blur-sm animate-in zoom-in-95 duration-300">
                <div className={`w-full max-w-md glass-panel border border-rpg-gold shadow-glow-gold rounded-2xl relative p-6 sm:p-8 flex flex-col items-center gap-6 animate-in zoom-in-95 duration-300 overflow-y-auto max-h-full`}>
                    <div className="absolute -top-4 px-6 py-1 rounded-full font-heading font-bold text-sm tracking-widest shadow-lg bg-rpg-gold text-rpg-bg">
                        EXPEDITION CONCLUDED
                    </div>

                    <h2 className="text-2xl sm:text-3xl text-white font-heading font-bold text-shadow-glow uppercase text-center mt-4">
                        Rewards Secured!
                    </h2>

                    <div className="flex gap-4 w-full">
                        <div className="flex-1 bg-black/40 p-4 rounded-xl border border-white/10 text-center backdrop-blur-md">
                            <div className="text-gray-400 text-[10px] uppercase mb-1 font-bold tracking-wider">Total Focus Time</div>
                            <div className="text-white font-display text-2xl">{totalMinutesWorked}m</div>
                        </div>
                        <div className="flex-1 bg-black/40 p-4 rounded-xl border border-white/10 text-center backdrop-blur-md">
                            <div className="text-gray-400 text-[10px] uppercase mb-1 font-bold tracking-wider">Foes Defeated</div>
                            <div className="text-rpg-red font-display text-shadow-glow text-2xl">{enemiesDefeated}</div>
                        </div>
                    </div>

                    <div className="w-full space-y-3 bg-white/5 p-4 rounded-xl border border-white/10 flex flex-col items-center gap-3">
                        <h3 className="text-rpg-gold text-center text-[10px] uppercase tracking-widest font-bold mb-1 font-heading">Rate Your Focus</h3>
                        <div className="flex gap-2">
                            {[1, 2, 3, 4, 5].map(rating => {
                                const active = focusQuality >= rating;
                                const isPeak = focusQuality === rating && rating === 5;
                                return (
                                    <button
                                        key={rating}
                                        onClick={() => setFocusQuality(rating)}
                                        aria-label={`Focus quality ${rating}`}
                                        className={`w-8 h-8 font-pixel text-lg leading-none rounded-md border-2 transition-all ${
                                            active
                                                ? (isPeak
                                                    ? 'bg-orange-400 text-black border-orange-200 shadow-[0_0_10px_rgba(251,146,60,0.6)] scale-110'
                                                    : 'bg-rpg-gold text-rpg-bg border-yellow-200 shadow-[0_0_8px_rgba(251,191,36,0.5)]')
                                                : 'bg-black/40 text-gray-500 border-white/10 hover:border-white/30 hover:text-gray-300'
                                        }`}
                                    >
                                        {rating}
                                    </button>
                                );
                            })}
                        </div>
                        <div className="text-[10px] font-bold uppercase tracking-tighter h-4 flex items-center justify-center">
                            {focusQuality === 5 ? <span className="text-orange-400 animate-pulse">Legendary Focus! (+20% Rewards)</span> : 
                             focusQuality === 4 ? <span className="text-green-400">Great Work! (+10% Rewards)</span> : 
                             focusQuality === 3 ? <span className="text-blue-300">Steady Progress</span> : 
                             focusQuality === 2 ? <span className="text-yellow-600">A bit distracted (-10% Rewards)</span> : 
                             <span className="text-red-500">Back at it soon! (-20% Rewards)</span>}
                        </div>
                    </div>

                    <p className="text-xs text-gray-400 text-center">Even a short journey yields experience. Excellent work returning safely.</p>

                    <button
                        onClick={handleClaim}
                        className="w-full glass-btn-primary py-3 text-lg font-bold tracking-wider shadow-lg hover:translate-y-[-2px] hover:shadow-glow-gold"
                    >
                        CLAIM LOOT & EXIT
                    </button>
                    <button
                        onClick={onCancel}
                        className="w-full mt-2 py-2 text-gray-500 hover:text-white text-xs font-bold uppercase tracking-wider transition-colors"
                    >
                        Discard Loot (Exit)
                    </button>
                </div>
            </div>,
            document.body
        );
    }

    return createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-rpg-panelDark/90 backdrop-blur-md animate-in fade-in duration-300 sm:p-4">
            {/* RPG FRAME */}
            <div className={`w-full h-full sm:h-[85vh] sm:max-w-lg glass-panel overflow-hidden flex flex-col md:h-[650px] rounded-none sm:rounded-2xl relative shadow-2xl transition-all duration-500 ${mode === 'work' ? 'border-red-500/30 ring-red-500/5' : 'border-blue-500/30 ring-blue-500/5'} ring-1`}>

                {/* Header Decoration */}
                <div className={`absolute top-0 left-1/2 -translate-x-1/2 bg-black/80 border-b border-x px-6 py-1.5 z-20 rounded-b-xl backdrop-blur-md transition-colors duration-500 ${mode === 'work' ? 'border-red-500/30 shadow-[0_4px_20px_rgba(239,68,68,0.2)]' : 'border-blue-500/30 shadow-[0_4px_20px_rgba(59,130,246,0.2)]'}`}>
                    <span className={`text-[10px] tracking-[0.3em] font-heading font-bold uppercase drop-shadow-md flex items-center gap-2 ${mode === 'work' ? 'text-red-400' : 'text-blue-400'}`}>
                        {mode === 'work' ? <Skull size={10} /> : <Coffee size={10} />}
                        {mode === 'work' ? 'The Catacombs Focus' : 'Campfire Respite'}
                    </span>
                </div>

                {/* TOP HALF: BATTLE ARENA (60%) */}
                <div className="flex-grow-[3] relative bg-[#0a0510] border-b border-white/10 overflow-hidden group min-h-[50%]">
                    {/* Dungeon Background Art */}
                    <div className="absolute inset-0 opacity-80" style={{
                        backgroundImage: mode === 'work'
                            ? 'radial-gradient(circle at 20% 40%, rgba(180,80,20,0.2) 0%, transparent 40%), radial-gradient(circle at 80% 50%, rgba(180,80,20,0.15) 0%, transparent 40%), linear-gradient(180deg, #111, #000)'
                            : 'radial-gradient(circle at 50% 50%, rgba(59,130,246,0.1) 0%, transparent 60%), linear-gradient(180deg, #051020, #000)'
                    }}></div>

                    {/* Brick Texture Overlay */}
                    <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'linear-gradient(90deg, transparent 50%, rgba(255,255,255,.1) 50%), linear-gradient(rgba(255,255,255,.1) 50%, transparent 50%)', backgroundSize: '40px 20px' }}></div>

                    {/* Grid Floor */}
                    <div className={`absolute bottom-0 w-full h-1/2 transform perspective-500 rotate-x-60 opacity-60 transition-colors duration-500 ${mode === 'work' ? 'bg-[linear-gradient(rgba(0,0,0,0),rgba(239,68,68,0.1))] border-t border-red-900/40' : 'bg-[linear-gradient(rgba(0,0,0,0),rgba(59,130,246,0.1))] border-t border-blue-900/40'}`}></div>

                    {/* Battle Content - Only show battle during work */}
                    <div className="absolute inset-0 flex items-center justify-center z-10">
                        {mode === 'work' ? (
                            <div className="w-full h-full flex flex-col items-center justify-center">
                                {/* Dungeon Progress Bar */}
                                <div className="absolute top-12 left-1/2 -translate-x-1/2 w-64 h-4 bg-black/60 border border-white/20 rounded-full overflow-hidden shadow-2xl z-20">
                                    <div 
                                        className={`h-full transition-all duration-1000 ${isHatchMode ? 'bg-gradient-to-r from-amber-600 to-yellow-500 shadow-[0_0_15px_rgba(245,158,11,0.5)]' : isBossActive ? 'bg-gradient-to-r from-red-600 to-orange-500 shadow-[0_0_15px_rgba(239,68,68,0.5)]' : 'bg-gradient-to-r from-indigo-600 to-purple-500'}`}
                                        style={{ width: `${(timeLeft / (initialDuration * 60)) * 100}%` }}
                                    ></div>
                                    <div className="absolute inset-0 flex items-center justify-center text-[8px] font-bold text-white uppercase tracking-tighter mix-blend-overlay">
                                        {isHatchMode ? `INCUBATION: ${Math.floor(totalWorkSeconds / 60)} / ${initialDuration}m` : `DUNGEON DEPTH: ${Math.floor(totalWorkSeconds / 60)} / ${initialDuration}m`}
                                    </div>
                                </div>

                                {isHatchMode ? (
                                    // Shifted down (mt-20) so the bouncing egg stays inside the
                                    // visible battle arena instead of clipping under the progress bar.
                                    // Scale reduced 5 → 4 to fit short viewports (mobile).
                                    <div className="relative flex flex-col items-center mt-20">
                                        {/* Pulsing Egg Visual */}
                                        <div className="animate-bounce-slow drop-shadow-[0_0_30px_rgba(245,158,11,0.6)]">
                                            <ModernPixelPet type="dragon_egg" scale={4} isHatching />
                                        </div>
                                        <div className="mt-4 text-amber-400 font-heading font-black tracking-widest text-shadow-glow animate-pulse">
                                            INCUBATING...
                                        </div>
                                        <div className="mt-2 bg-black/60 px-4 py-1 rounded-full border border-amber-500/30 text-[10px] text-amber-200 font-bold uppercase tracking-widest">
                                            {state.character?.incubatingEgg?.sessions || 0}/3 Sessions
                                        </div>
                                    </div>
                                ) : (
                                    <AvatarBattle
                                        isActive={isActive}
                                        isBoss={isBossActive}
                                        onEnemyDefeated={() => {
                                            setEnemiesDefeated(prev => prev + 1);
                                            if (isBossActive) setIsBossActive(false); // Reset boss after defeat
                                        }}
                                    />
                                )}
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center opacity-80 animate-in fade-in zoom-in spin-in-12 duration-1000">
                                <PixelIcon name="clock" size={64} className="text-blue-400 drop-shadow-[0_0_20px_rgba(59,130,246,0.5)] mb-4" />
                                <div className="text-blue-200 font-heading tracking-widest animate-pulse">Restoring Stamina...</div>
                            </div>
                        )}
                    </div>

                    {/* Active Quests Overlay during work */}
                    {activeTasks.length > 0 && mode === 'work' && (
                        <div className="absolute top-4 left-4 right-4 md:right-auto z-40 md:max-w-[220px] bg-black/60 backdrop-blur-md rounded-xl border border-white/10 p-3 flex flex-col gap-2 shadow-2xl">
                            <div className="text-[10px] text-rpg-gold font-bold uppercase tracking-widest border-b border-white/10 pb-1 flex items-center justify-between">
                                <span>Active Quests</span>
                                <span className="text-gray-400 bg-black/40 px-1.5 rounded">{activeTasks.length}</span>
                            </div>
                            <div className="max-h-32 overflow-y-auto space-y-2 pr-1 custom-scrollbar pointer-events-auto">
                                {activeTasks.map(task => (
                                    <div
                                        key={task.id}
                                        className="flex items-start gap-2 group cursor-pointer p-1 rounded-md hover:bg-white/5 transition-colors"
                                        onClick={(e) => handleCompleteTask(e, task.id)}
                                        role="button"
                                        tabIndex={0}
                                        aria-label={`Complete quest: ${task.title}`}
                                        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleCompleteTask(e, task.id); } }}
                                    >
                                        <div className="w-4 h-4 rounded border border-white/30 flex-shrink-0 mt-0.5 group-hover:border-rpg-gold transition-colors flex items-center justify-center bg-black/50 overflow-hidden">
                                            <CheckCircle size={10} className="text-rpg-gold opacity-0 group-hover:opacity-100 transition-opacity" />
                                        </div>
                                        <span className="text-xs text-gray-300 group-hover:text-white transition-colors line-clamp-3 leading-tight font-sans">
                                            {task.title}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* FX Animations */}
                    {mode === 'work' && (
                        <>
                            <div className="absolute top-10 transform -translate-x-1/2 w-32 h-32 bg-orange-500/20 rounded-full blur-2xl animate-pulse mix-blend-screen pointer-events-none" style={{ left: '10%' }}></div>
                            <div className="absolute top-20 transform -translate-x-1/2 w-48 h-48 bg-orange-500/10 rounded-full blur-3xl animate-pulse mix-blend-screen pointer-events-none" style={{ left: '90%' }}></div>
                        </>
                    )}
                </div>

                {/* BOTTOM HALF: CONTROLS (40%) */}
                <div className="flex-grow-[2] bg-gradient-to-b from-rpg-panel to-rpg-panelDark p-4 pb-8 sm:p-6 flex flex-col items-center justify-between relative z-20 shrink-0 min-h-[220px]">

                    {/* Timer Display */}
                    <div className="z-10 flex flex-col items-center">
                        <h2 className="text-gray-500 font-bold tracking-[0.2em] text-[10px] uppercase mb-1">Focus Remaining</h2>
                        <div className={`text-6xl md:text-7xl font-display font-medium tracking-tight text-shadow-glow transition-colors duration-300 ${isActive ? 'text-white' : 'text-gray-500'}`}>
                            {formatTime(timeLeft)}
                        </div>
                        <div className="text-gray-400 font-mono text-xs tracking-wider mt-1 opacity-80 flex items-center gap-1.5 bg-black/30 px-3 py-1 rounded-full border border-white/5">
                            <PixelIcon name="clock" size={12} className="opacity-70" /> {formatClock(currentTime)}
                        </div>
                    </div>

                    {/* Loot / Status Ticker */}
                    <div className="z-10 w-full bg-white/5 rounded-xl border border-white/5 p-4 mb-6 flex justify-around text-center">
                        <div>
                            <div className="text-gray-500 text-[10px] uppercase font-bold tracking-wider mb-1">Defeated</div>
                            <div className="text-rpg-red font-display text-xl flex items-center justify-center gap-2">
                                <Skull size={18} /> {enemiesDefeated}
                            </div>
                        </div>
                        <div className="w-px bg-white/10 h-10"></div>
                        <div>
                            <div className="text-gray-500 text-[10px] uppercase font-bold tracking-wider mb-1">Potential Loot</div>
                            <div className="text-rpg-gold font-display text-xl text-shadow-sm">+{xpEarned} XP</div>
                        </div>
                    </div>

                    {/* Control Buttons (RPG Style) */}
                    <div className="z-10 w-full flex gap-4">
                        <button
                            onClick={() => setIsActive(!isActive)}
                            className="flex-1 glass-btn py-3.5 font-bold tracking-wider flex items-center justify-center gap-2 text-xs bg-white/5 hover:bg-white/10 border-white/10"
                        >
                            {isActive ? <><Pause size={16} /> PAUSE</> : <><Play size={16} /> RESUME</>}
                        </button>

                        <button
                            onClick={handleFinishEarly}
                            className="flex-1 glass-btn py-3.5 font-bold tracking-wider flex items-center justify-center gap-2 text-xs text-white border-white/30 hover:bg-white/10 group"
                        >
                            <CheckCircle size={16} className="group-hover:scale-110 transition-transform" /> CONCLUDE EXPEDITION
                        </button>
                    </div>
                </div>
            </div>
        </div>,
        document.body
    );
};

export default Pomodoro;
