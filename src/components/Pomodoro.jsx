import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Play, Pause, Skull, Coffee, CheckCircle, Flame, X } from 'lucide-react';
import AvatarBattle from './common/AvatarBattle';
import PixelIcon from './common/PixelIcon';
import ModernPixelPet from './common/ModernPixelPet';
import { useGame } from '../context/GameContext';

const HATCH_STAGES = [
    { threshold: 0,    label: 'The egg rests quietly...', cssShake: '', glowColor: 'rgba(245,158,11,0.15)', glowSize: 15 },
    { threshold: 0.15, label: 'A faint warmth radiates...', cssShake: '', glowColor: 'rgba(245,158,11,0.25)', glowSize: 20 },
    { threshold: 0.30, label: 'Something stirs inside...', cssShake: 'animate-hatch-wobble-1', glowColor: 'rgba(245,158,11,0.35)', glowSize: 28 },
    { threshold: 0.50, label: 'Tiny cracks appear!', cssShake: 'animate-hatch-wobble-2', glowColor: 'rgba(245,170,11,0.45)', glowSize: 35 },
    { threshold: 0.70, label: 'The shell is breaking!', cssShake: 'animate-hatch-wobble-3', glowColor: 'rgba(255,180,20,0.55)', glowSize: 42 },
    { threshold: 0.85, label: 'Almost there...!', cssShake: 'animate-hatch-shake', glowColor: 'rgba(255,200,50,0.7)', glowSize: 55 },
];

function getHatchStage(warmth) {
    let stage = HATCH_STAGES[0];
    for (const s of HATCH_STAGES) {
        if (warmth >= s.threshold) stage = s;
    }
    return stage;
}

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

    // Hatch-specific UI states
    const [showAbandonConfirm, setShowAbandonConfirm] = useState(false);
    const [isHatching, setIsHatching] = useState(false);

    // Live tasks
    const activeTasks = state?.tasks?.filter(t => selectedTaskIds.includes(t.id) && !t.completed) || [];

    const handleCompleteTask = (e, taskId) => {
        e.stopPropagation();
        if (actions.completeTask) {
            actions.completeTask(taskId);
            setEnemiesDefeated(prev => prev + 1);
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
                        if (newTotal > 0 && newTotal % 300 === 0) {
                            setIsBossActive(true);
                        }
                        return newTotal;
                    });
                }
            }, 1000);
        } else if (timeLeft === 0 && isActive) {
            if (isHatchMode && mode === 'work') {
                // Trigger hatching sequence
                setIsActive(false);
                setIsHatching(true);
                setTimeout(() => {
                    setIsHatching(false);
                    setShowSummary(true);
                }, 3000);
            } else if (mode === 'work') {
                setMode('break');
                setTimeLeft(initialBreak * 60);
            } else {
                setMode('work');
                setTimeLeft(initialDuration * 60);
            }
        } else {
            interval = setInterval(() => {
                setCurrentTime(new Date());
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [isActive, timeLeft, mode, initialDuration, initialBreak, isHatchMode]);

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
        if (isHatchMode) {
            setShowAbandonConfirm(true);
            return;
        }
        setIsActive(false);
        setShowSummary(true);
    };

    const handleAbandonConfirm = () => {
        setShowAbandonConfirm(false);
        setIsActive(false);
        setShowSummary(true);
    };

    const handleClaim = () => {
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

    const totalMinutesWorked = Math.floor(totalWorkSeconds / 60);
    const xpEarned = Math.floor((totalWorkSeconds / 60 * 2) * (1 + Math.min(enemiesDefeated, 25) / 100));
    const goldEarned = (totalMinutesWorked * 1) + (enemiesDefeated * 3);
    const warmth = Math.min(totalWorkSeconds / (initialDuration * 60), 1);
    const hatchStage = getHatchStage(warmth);

    // --- HATCHING SEQUENCE ---
    if (isHatching) {
        return createPortal(
            <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black animate-in fade-in duration-300">
                <div className="flex flex-col items-center gap-6 animate-in zoom-in-95 duration-500">
                    <div className="animate-hatch-shake overflow-hidden" style={{ filter: `drop-shadow(0 0 60px rgba(255,200,50,0.9))` }}>
                        <ModernPixelPet type="mystic_egg" size={280} isHatching />
                    </div>
                    <div className="flex gap-1">
                        {[0,1,2].map(i => (
                            <div key={i} className="w-2 h-2 bg-amber-400 rounded-full animate-pulse" style={{ animationDelay: `${i * 200}ms` }} />
                        ))}
                    </div>
                    <div className="text-amber-300 font-heading font-black text-xl tracking-widest animate-pulse text-shadow-glow">
                        HATCHING...
                    </div>
                </div>
            </div>,
            document.body
        );
    }

    // --- SUMMARY SCREEN ---
    if (showSummary) {
        const enoughFocus = totalMinutesWorked >= Math.floor(initialDuration * 0.8);
        return createPortal(
            <div className="fixed inset-0 z-[9999] p-4 flex items-center justify-center bg-black/90 backdrop-blur-sm animate-in zoom-in-95 duration-300">
                <div className="w-full max-w-md glass-panel border border-rpg-gold shadow-glow-gold rounded-2xl relative p-6 sm:p-8 flex flex-col items-center gap-5 animate-in zoom-in-95 duration-300 overflow-y-auto max-h-[90vh] mt-4">
                    <div className={`px-6 py-1.5 rounded-full font-heading font-bold text-sm tracking-widest shadow-lg ${isHatchMode ? 'bg-amber-500 text-rpg-bg' : 'bg-rpg-gold text-rpg-bg'}`}>
                        {isHatchMode ? (enoughFocus ? 'HATCHED!' : 'INCUBATION INCOMPLETE') : 'EXPEDITION CONCLUDED'}
                    </div>

                    <h2 className="text-2xl sm:text-3xl text-white font-heading font-bold text-shadow-glow uppercase text-center">
                        {isHatchMode
                            ? (enoughFocus ? 'A New Companion!' : 'The egg grows cold...')
                            : 'Rewards Secured!'}
                    </h2>

                    {isHatchMode ? (
                        <div className="w-full bg-amber-500/10 p-5 rounded-xl border border-amber-500/20 text-center backdrop-blur-md flex flex-col items-center gap-3">
                            {enoughFocus ? (
                                <>
                                    <div className="text-amber-300/60 text-[10px] uppercase font-bold tracking-wider">Your companion has arrived</div>
                                    <div className="my-2 overflow-hidden" style={{ filter: 'drop-shadow(0 0 30px rgba(245,158,11,0.6))' }}>
                                        <ModernPixelPet type="mystic_egg" size={160} isHatching />
                                    </div>
                                    <div className="text-amber-200 text-xs font-bold">
                                        A new friend joins your adventure!
                                    </div>
                                </>
                            ) : (
                                <>
                                    <div className="text-amber-400/60 text-[10px] uppercase font-bold tracking-wider">Focus Time</div>
                                    <div className="text-white font-display text-3xl">{totalMinutesWorked}m</div>
                                    <div className="text-amber-300/80 text-xs font-bold">
                                        Complete a full session to hatch your egg.
                                    </div>
                                </>
                            )}
                        </div>
                    ) : (
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
                    )}

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

                    <button
                        onClick={handleClaim}
                        className="w-full glass-btn-primary py-3 text-lg font-bold tracking-wider shadow-lg hover:translate-y-[-2px] hover:shadow-glow-gold"
                    >
                        {isHatchMode ? (enoughFocus ? 'CLAIM COMPANION' : 'EXIT') : 'CLAIM LOOT & EXIT'}
                    </button>
                    <button
                        onClick={onCancel}
                        className="w-full mt-2 py-2 text-gray-500 hover:text-white text-xs font-bold uppercase tracking-wider transition-colors"
                    >
                        {isHatchMode ? 'Discard & Exit' : 'Discard Loot (Exit)'}
                    </button>
                </div>
            </div>,
            document.body
        );
    }

    // --- HATCH MODE MAIN SCREEN ---
    if (isHatchMode) {
        return createPortal(
            <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-rpg-panelDark/90 backdrop-blur-md animate-in fade-in duration-300">
                <div className="w-full h-full sm:h-[85vh] sm:max-w-lg overflow-hidden flex flex-col sm:rounded-2xl relative shadow-2xl border border-amber-500/20 ring-1 ring-amber-500/5 bg-gradient-to-b from-[#0d0800] via-[#0a0510] to-rpg-panelDark">

                    {/* Header */}
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 bg-black/80 border-b border-x border-amber-500/30 px-5 py-1.5 z-30 rounded-b-xl backdrop-blur-md shadow-[0_4px_20px_rgba(245,158,11,0.15)]">
                        <div className="flex flex-col items-center gap-0.5">
                            <Flame size={10} className="text-amber-400" />
                            <span className="text-[9px] tracking-[0.3em] font-heading font-bold uppercase drop-shadow-md text-amber-400">
                                Incubation Chamber
                            </span>
                        </div>
                    </div>

                    {/* EGG ARENA — takes all available space */}
                    <div className="flex-1 relative overflow-hidden flex flex-col items-center justify-center min-h-0">
                        {/* Warm ambient background */}
                        <div className="absolute inset-0 opacity-80" style={{
                            backgroundImage: `radial-gradient(circle at 50% 55%, ${hatchStage.glowColor} 0%, transparent 55%), radial-gradient(circle at 50% 40%, rgba(245,158,11,0.08) 0%, transparent 60%), linear-gradient(180deg, #110a00, #000)`
                        }} />
                        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'linear-gradient(90deg, transparent 50%, rgba(255,255,255,.1) 50%), linear-gradient(rgba(255,255,255,.1) 50%, transparent 50%)', backgroundSize: '40px 20px' }} />

                        {/* Floating particles when warm */}
                        {warmth > 0.3 && (
                            <div className="absolute inset-0 pointer-events-none overflow-hidden">
                                {[...Array(Math.min(Math.floor(warmth * 8), 6))].map((_, i) => (
                                    <div
                                        key={i}
                                        className="absolute w-1 h-1 bg-amber-400/40 rounded-full animate-float-up"
                                        style={{
                                            left: `${20 + (i * 12) % 60}%`,
                                            animationDelay: `${i * 0.7}s`,
                                            animationDuration: `${3 + (i % 3)}s`
                                        }}
                                    />
                                ))}
                            </div>
                        )}

                        {/* Grid floor */}
                        <div className="absolute bottom-0 w-full h-1/3 opacity-40 border-t border-amber-900/30" style={{
                            background: 'linear-gradient(rgba(0,0,0,0), rgba(245,158,11,0.06))'
                        }} />

                        {/* THE EGG — protagonist, using size prop for precise centering */}
                        <div className="relative z-10 flex flex-col items-center justify-center gap-2">
                            <div
                                className={`transition-all duration-1000 ${hatchStage.cssShake} overflow-hidden`}
                                style={{ filter: `drop-shadow(0 0 ${hatchStage.glowSize}px ${hatchStage.glowColor})` }}
                            >
                                <ModernPixelPet type="mystic_egg" size={240} isHatching />
                            </div>

                            {/* Crack overlay via CSS when warmth > 50% */}
                            {warmth >= 0.5 && (
                                <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                                    <div className="relative" style={{ width: 240, height: 240 }}>
                                        {warmth >= 0.5 && <div className="absolute top-[35%] left-[55%] w-[2px] h-[15%] bg-amber-300/60 rotate-[25deg] rounded-full" />}
                                        {warmth >= 0.6 && <div className="absolute top-[30%] left-[40%] w-[2px] h-[12%] bg-amber-200/50 rotate-[-15deg] rounded-full" />}
                                        {warmth >= 0.7 && <div className="absolute top-[40%] left-[60%] w-[2px] h-[18%] bg-amber-300/70 rotate-[40deg] rounded-full" />}
                                        {warmth >= 0.8 && (
                                            <>
                                                <div className="absolute top-[25%] left-[45%] w-[2px] h-[20%] bg-yellow-300/60 rotate-[-30deg] rounded-full" />
                                                <div className="absolute top-[42%] left-[35%] w-[2px] h-[14%] bg-yellow-200/50 rotate-[55deg] rounded-full" />
                                            </>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Contextual message */}
                        <div className={`z-10 mt-4 text-center px-6 transition-all duration-1000 ${warmth >= 0.85 ? 'animate-pulse' : ''}`}>
                            <div className={`font-heading font-bold text-sm tracking-wider ${warmth >= 0.85 ? 'text-amber-300' : 'text-amber-400/70'}`}>
                                {hatchStage.label}
                            </div>
                        </div>

                        {/* FX glows */}
                        <div className="absolute top-10 left-[10%] w-32 h-32 rounded-full blur-2xl animate-pulse mix-blend-screen pointer-events-none bg-amber-500/10" />
                        <div className="absolute top-20 right-[5%] w-48 h-48 rounded-full blur-3xl animate-pulse mix-blend-screen pointer-events-none bg-amber-500/8" />
                    </div>

                    {/* BOTTOM CONTROLS — compact, timer-focused */}
                    <div className="shrink-0 bg-gradient-to-b from-rpg-panel to-rpg-panelDark p-4 pb-6 sm:p-5 relative z-20 border-t border-white/5">
                        {/* Session indicator */}
                        <div className="flex justify-center mb-2">
                            <span className="text-[9px] text-amber-400/50 font-bold uppercase tracking-widest bg-amber-500/5 px-3 py-0.5 rounded-full border border-amber-500/10">
                                Session {(state.character?.incubatingEgg?.sessions || 0) + 1} / 3
                            </span>
                        </div>
                        {/* Unified progress: timer + warmth bar */}
                        <div className="flex flex-col items-center gap-2 mb-4">
                            <div className={`text-6xl sm:text-7xl font-pixel tracking-wider text-shadow-glow transition-colors duration-300 ${isActive ? 'text-white' : 'text-gray-500'}`}>
                                {formatTime(timeLeft)}
                            </div>
                            {/* Single warmth progress bar */}
                            <div className="w-full max-w-[280px] flex flex-col gap-1">
                                <div className="w-full h-2 bg-black/50 rounded-full overflow-hidden border border-amber-900/30">
                                    <div
                                        className="h-full bg-gradient-to-r from-amber-800 via-amber-500 to-yellow-400 rounded-full transition-all duration-1000 relative"
                                        style={{ width: `${warmth * 100}%` }}
                                    >
                                        {warmth > 0.05 && (
                                            <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1.5 h-3 bg-yellow-300 rounded-full shadow-[0_0_6px_rgba(253,224,71,0.8)]" />
                                        )}
                                    </div>
                                </div>
                                <div className="flex justify-between text-[9px] px-0.5">
                                    <span className="text-amber-200/40 font-bold uppercase tracking-wider">{totalMinutesWorked}m focused</span>
                                    <span className="text-amber-300/60 font-bold">{Math.floor(warmth * 100)}%</span>
                                </div>
                            </div>
                        </div>

                        {/* Buttons */}
                        <div className="flex gap-3">
                            <button
                                onClick={() => setIsActive(!isActive)}
                                className="flex-[2] glass-btn py-3 font-bold tracking-wider flex items-center justify-center gap-2 text-xs bg-amber-500/10 hover:bg-amber-500/20 border-amber-500/30 text-amber-100"
                            >
                                {isActive ? <><Pause size={16} /> PAUSE</> : <><Play size={16} /> RESUME</>}
                            </button>
                            <button
                                onClick={handleFinishEarly}
                                className="flex-1 glass-btn py-3 font-bold tracking-wider flex items-center justify-center gap-2 text-xs text-gray-400 hover:text-red-400 border-white/10 hover:border-red-500/30 transition-colors"
                            >
                                <X size={14} /> ABANDON
                            </button>
                        </div>
                    </div>

                    {/* Abandon Confirmation Modal */}
                    {showAbandonConfirm && (
                        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
                            <div className="glass-panel border border-red-500/30 rounded-2xl p-6 mx-6 max-w-sm w-full flex flex-col items-center gap-4 animate-in zoom-in-95 duration-200">
                                <div className="text-red-400 font-heading font-bold text-sm tracking-widest uppercase">Abandon Incubation?</div>
                                <p className="text-gray-400 text-xs text-center leading-relaxed">Your egg won't hatch. Progress will be lost.</p>
                                <div className="flex gap-3 w-full">
                                    <button
                                        onClick={() => setShowAbandonConfirm(false)}
                                        className="flex-1 glass-btn py-2.5 font-bold tracking-wider text-xs bg-amber-500/10 hover:bg-amber-500/20 border-amber-500/30 text-amber-100"
                                    >
                                        KEEP GOING
                                    </button>
                                    <button
                                        onClick={handleAbandonConfirm}
                                        className="flex-1 glass-btn py-2.5 font-bold tracking-wider text-xs text-red-400 hover:bg-red-500/10 border-red-500/30"
                                    >
                                        ABANDON
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>,
            document.body
        );
    }

    // --- BATTLE MODE ---
    const depthProgress = Math.min(totalWorkSeconds / (initialDuration * 60), 1);
    return createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-rpg-panelDark/90 backdrop-blur-md animate-in fade-in duration-300">
            <div className={`w-full h-full sm:h-[85vh] sm:max-w-lg overflow-hidden flex flex-col sm:rounded-2xl relative shadow-2xl transition-all duration-500 border ring-1 ${mode === 'work' ? 'border-red-500/20 ring-red-500/5' : 'border-blue-500/20 ring-blue-500/5'} bg-gradient-to-b from-[#0a0508] via-[#0a0510] to-rpg-panelDark`}>

                {/* Header */}
                <div className={`absolute top-0 left-1/2 -translate-x-1/2 bg-black/80 border-b border-x px-5 py-1.5 z-30 rounded-b-xl backdrop-blur-md transition-colors duration-500 ${mode === 'work' ? 'border-red-500/30 shadow-[0_4px_20px_rgba(239,68,68,0.15)]' : 'border-blue-500/30 shadow-[0_4px_20px_rgba(59,130,246,0.15)]'}`}>
                    <div className="flex flex-col items-center gap-0.5">
                        {mode === 'work' ? <Skull size={10} className="text-red-400" /> : <Coffee size={10} className="text-blue-400" />}
                        <span className={`text-[9px] tracking-[0.3em] font-heading font-bold uppercase drop-shadow-md ${mode === 'work' ? 'text-red-400' : 'text-blue-400'}`}>
                            {mode === 'work' ? 'Focus Dungeon' : 'Campfire Respite'}
                        </span>
                    </div>
                </div>

                {/* ARENA */}
                <div className="flex-1 relative overflow-hidden flex flex-col items-center justify-center min-h-0">
                    {/* Ambient background */}
                    <div className="absolute inset-0 opacity-80" style={{
                        backgroundImage: mode === 'work'
                            ? 'radial-gradient(circle at 50% 55%, rgba(180,40,20,0.15) 0%, transparent 50%), radial-gradient(circle at 50% 40%, rgba(180,80,20,0.08) 0%, transparent 60%), linear-gradient(180deg, #0a0508, #000)'
                            : 'radial-gradient(circle at 50% 50%, rgba(59,130,246,0.1) 0%, transparent 60%), linear-gradient(180deg, #051020, #000)'
                    }} />

                    {/* Floor gradient */}
                    <div className={`absolute bottom-0 w-full h-1/3 opacity-40 border-t ${mode === 'work' ? 'border-red-900/30' : 'border-blue-900/30'}`} style={{
                        background: mode === 'work'
                            ? 'linear-gradient(rgba(0,0,0,0), rgba(180,40,20,0.06))'
                            : 'linear-gradient(rgba(0,0,0,0), rgba(59,130,246,0.06))'
                    }} />

                    {/* Battle Content */}
                    <div className="relative z-10 w-full flex flex-col items-center justify-center flex-1">
                        {mode === 'work' ? (
                            <>
                                {/* Depth progress bar */}
                                <div className="absolute top-12 left-1/2 -translate-x-1/2 w-64 z-20">
                                    <div className="w-full h-2 bg-black/50 rounded-full overflow-hidden border border-red-900/30">
                                        <div
                                            className="h-full bg-gradient-to-r from-red-800 via-red-500 to-orange-400 rounded-full transition-all duration-1000 relative"
                                            style={{ width: `${depthProgress * 100}%` }}
                                        >
                                            {depthProgress > 0.05 && (
                                                <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1.5 h-3 bg-orange-300 rounded-full shadow-[0_0_6px_rgba(251,146,60,0.8)]" />
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex justify-between text-[9px] px-0.5 mt-1">
                                        <span className="text-red-200/40 font-bold uppercase tracking-wider">Depth {Math.floor(totalWorkSeconds / 60)}m</span>
                                        <span className="text-red-300/60 font-bold">{initialDuration}m</span>
                                    </div>
                                </div>

                                <AvatarBattle
                                    isActive={isActive}
                                    isBoss={isBossActive}
                                    onEnemyDefeated={() => {
                                        setEnemiesDefeated(prev => prev + 1);
                                        if (isBossActive) setIsBossActive(false);
                                    }}
                                />
                            </>
                        ) : (
                            <div className="flex flex-col items-center justify-center opacity-80 animate-in fade-in zoom-in duration-1000">
                                <PixelIcon name="clock" size={64} className="text-blue-400 drop-shadow-[0_0_20px_rgba(59,130,246,0.5)] mb-4" />
                                <div className="text-blue-200 font-heading tracking-widest animate-pulse text-sm">Restoring Stamina...</div>
                            </div>
                        )}
                    </div>

                    {/* Active Quests Overlay */}
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

                    {/* Ambient glow FX */}
                    {mode === 'work' && (
                        <>
                            <div className="absolute top-10 left-[10%] w-32 h-32 rounded-full blur-2xl animate-pulse mix-blend-screen pointer-events-none bg-red-500/10" />
                            <div className="absolute top-20 right-[5%] w-48 h-48 rounded-full blur-3xl animate-pulse mix-blend-screen pointer-events-none bg-orange-500/8" />
                        </>
                    )}
                </div>

                {/* BOTTOM CONTROLS */}
                <div className="shrink-0 bg-gradient-to-b from-rpg-panel to-rpg-panelDark p-4 pb-6 sm:p-5 relative z-20 border-t border-white/5">
                    {/* Timer */}
                    <div className="flex flex-col items-center gap-1 mb-4">
                        <span className="text-[9px] text-red-400/50 font-bold uppercase tracking-widest">Focus Remaining</span>
                        <div className={`text-6xl sm:text-7xl font-pixel tracking-wider text-shadow-glow transition-colors duration-300 ${isActive ? 'text-white' : 'text-gray-500'}`}>
                            {formatTime(timeLeft)}
                        </div>
                        <div className="text-gray-400 font-mono text-xs tracking-wider opacity-80 flex items-center gap-1.5 bg-black/30 px-3 py-1 rounded-full border border-white/5">
                            <PixelIcon name="clock" size={12} className="opacity-70" /> {formatClock(currentTime)}
                        </div>
                    </div>

                    {/* Stats */}
                    <div className="w-full bg-white/5 rounded-xl border border-white/5 p-3 mb-4 flex justify-around text-center">
                        <div>
                            <div className="text-red-300/40 text-[9px] uppercase font-bold tracking-wider mb-0.5">Defeated</div>
                            <div className="text-red-400 font-display text-xl flex items-center justify-center gap-1.5">
                                <Skull size={14} /> {enemiesDefeated}
                            </div>
                        </div>
                        <div className="w-px bg-white/10 h-10" />
                        <div>
                            <div className="text-amber-300/40 text-[9px] uppercase font-bold tracking-wider mb-0.5">Potential Loot</div>
                            <div className="text-rpg-gold font-display text-xl">+{xpEarned} XP</div>
                        </div>
                    </div>

                    {/* Buttons */}
                    <div className="flex gap-3">
                        <button
                            onClick={() => setIsActive(!isActive)}
                            className="flex-[2] glass-btn py-3 font-bold tracking-wider flex items-center justify-center gap-2 text-xs bg-red-500/10 hover:bg-red-500/20 border-red-500/30 text-red-100"
                        >
                            {isActive ? <><Pause size={16} /> PAUSE</> : <><Play size={16} /> RESUME</>}
                        </button>
                        <button
                            onClick={handleFinishEarly}
                            className="flex-1 glass-btn py-3 font-bold tracking-wider flex items-center justify-center gap-2 text-xs text-white group border-white/30 hover:bg-white/10"
                        >
                            <CheckCircle size={16} className="group-hover:scale-110 transition-transform" /> CONCLUDE
                        </button>
                    </div>
                </div>
            </div>
        </div>,
        document.body
    );
};

export default Pomodoro;
