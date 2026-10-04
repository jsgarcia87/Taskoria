import React, { useEffect, useState } from 'react';
import ModernPixelPet from '../common/ModernPixelPet';
import PixelIcon from '../common/PixelIcon';
import { PET_EVOLUTION_CHAINS } from '../../data/petSpecies';
import { useGame } from '../../context/GameContext';
import { useToast } from '../common/Toast';
import { useConfirm } from '../../context/ConfirmContext';

const petLabel = (type) => {
    for (const chain of Object.values(PET_EVOLUTION_CHAINS)) {
        const entry = chain.find(e => e.blueprintKey === type);
        if (entry) return entry.label;
    }
    return type.replace(/_/g, ' ');
};

const evolutionScale = (level) => {
    if (level >= 20) return 1.4;
    if (level >= 10) return 1.2;
    return 1;
};

const getDayNightOverlay = (h) => {
    if (h >= 21 || h < 5)       return 'rgba(10,10,40,0.45)';
    if (h >= 5 && h < 7)        return 'rgba(255,160,60,0.12)';
    if (h >= 7 && h < 17)       return 'transparent';
    if (h >= 17 && h < 19)      return 'rgba(255,130,50,0.14)';
    if (h >= 19 && h < 21)      return 'rgba(30,20,60,0.25)';
    return 'transparent';
};

const TREES = [
    { x: 2, h: 110, w: 36, type: 'pine' },
    { x: 9, h: 85, w: 28, type: 'pine' },
    { x: 17, h: 130, w: 44, type: 'oak' },
    { x: 28, h: 75, w: 24, type: 'pine' },
    { x: 38, h: 95, w: 34, type: 'oak' },
    { x: 50, h: 70, w: 22, type: 'pine' },
    { x: 60, h: 120, w: 40, type: 'oak' },
    { x: 71, h: 90, w: 30, type: 'pine' },
    { x: 81, h: 105, w: 36, type: 'oak' },
    { x: 92, h: 80, w: 26, type: 'pine' },
    { x: 98, h: 95, w: 32, type: 'oak' },
];

const TreeSilhouette = ({ x, h, w, type }) => {
    const clipPath = type === 'pine'
        ? 'polygon(50% 0%, 15% 65%, 25% 65%, 5% 100%, 95% 100%, 75% 65%, 85% 65%)'
        : 'polygon(50% 0%, 30% 10%, 15% 25%, 8% 45%, 10% 65%, 20% 80%, 35% 95%, 40% 100%, 60% 100%, 65% 95%, 80% 80%, 90% 65%, 92% 45%, 85% 25%, 70% 10%)';
    return (
        <div className="absolute bottom-0 pointer-events-none" style={{
            left: `${x}%`,
            width: `${w}px`,
            height: `${h}px`,
            transform: 'translateX(-50%)',
            clipPath,
            background: 'linear-gradient(to bottom, rgba(2,20,10,0.7), rgba(2,20,10,0.9))',
        }} />
    );
};

const CelestialBody = ({ hour }) => {
    const isNight = hour >= 21 || hour < 5;
    const isDawn = hour >= 5 && hour < 7;
    const isDusk = hour >= 17 && hour < 19;
    const isTwilight = hour >= 19 && hour < 21;

    if (isNight) {
        return (
            <div className="absolute top-4 right-6 sm:top-5 sm:right-8 pointer-events-none z-10">
                <div className="relative w-5 h-5 sm:w-6 sm:h-6">
                    <div className="absolute inset-0 rounded-full bg-gray-200" />
                    <div className="absolute top-[-1px] right-[-2px] w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-[#0a2618]" />
                    <div className="absolute inset-[-4px] rounded-full opacity-30" style={{
                        boxShadow: '0 0 12px 4px rgba(200,210,255,0.4)'
                    }} />
                </div>
                {[0, 1, 2].map(i => (
                    <div key={i} className="absolute w-[2px] h-[2px] bg-white/40 rounded-full" style={{
                        top: `${-4 + i * 12}px`,
                        right: `${20 + i * 14}px`,
                    }} />
                ))}
            </div>
        );
    }

    if (isDawn || isDusk) {
        return (
            <div className="absolute top-6 pointer-events-none z-10" style={{ right: isDawn ? '15%' : '20%' }}>
                <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-gradient-to-b from-amber-300 to-orange-400 opacity-70" style={{
                    boxShadow: '0 0 20px 6px rgba(255,160,60,0.3)'
                }} />
            </div>
        );
    }

    if (isTwilight) {
        return (
            <div className="absolute top-4 right-[12%] pointer-events-none z-10">
                <div className="relative w-5 h-5 sm:w-6 sm:h-6">
                    <div className="absolute inset-0 rounded-full bg-gray-300 opacity-50" />
                    <div className="absolute top-[-1px] right-[-2px] w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-[#0a2618] opacity-60" />
                </div>
            </div>
        );
    }

    return (
        <div className="absolute top-4 right-[18%] sm:top-5 pointer-events-none z-10">
            <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-gradient-to-b from-yellow-200 to-amber-300 opacity-50" style={{
                boxShadow: '0 0 16px 6px rgba(255,220,80,0.2)'
            }} />
        </div>
    );
};

const PetSanctuaryView = ({ currentUser }) => {
    const { state, actions } = useGame();
    const toast = useToast();
    const confirm = useConfirm();
    const [abandonedPets, setAbandonedPets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [hour, setHour] = useState(() => new Date().getHours());
    const [selectedPet, setSelectedPet] = useState(null);

    const myPets = state.character?.pets || [];

    const formatCountdown = (secondsPassed) => {
        const totalSeconds = 3 * 24 * 60 * 60;
        const remaining = totalSeconds - parseInt(secondsPassed || 0);
        if (remaining <= 0) return "Expired";

        const days = Math.floor(remaining / (24 * 3600));
        const hours = Math.floor((remaining % (24 * 3600)) / 3600);
        const minutes = Math.floor((remaining % 3600) / 60);

        if (days > 0) return `${days}d ${hours}h left`;
        if (hours > 0) return `${hours}h ${minutes}m left`;
        return `${minutes}m left`;
    };

    useEffect(() => {
        const id = setInterval(() => setHour(new Date().getHours()), 60_000);
        return () => clearInterval(id);
    }, []);

    useEffect(() => {
        const fetchSanctuary = async () => {
            try {
                const res = await fetch('api/sanctuary.php?action=list');
                const data = await res.json();
                if (data.pets) {
                    setAbandonedPets(data.pets);
                }
            } catch (e) {
                console.error("Failed to fetch sanctuary", e);
            } finally {
                setLoading(false);
            }
        };
        fetchSanctuary();
    }, []);

    const handleResetAll = async () => {
        if (!await confirm({ title: 'Nuclear Reset', message: 'This will permanently delete ALL pets from ALL users and clear the sanctuary. This is irreversible.', variant: 'danger', confirmText: 'Reset Everything' })) return;

        setLoading(true);
        try {
            const res = await fetch('api/sanctuary.php?action=reset_all', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ admin_id: currentUser?.id })
            });
            const data = await res.json();
            if (data.success) {
                toast.success(data.message);
                setAbandonedPets([]);
                window.location.reload();
            } else {
                toast.error(data.error || "Failed to reset");
            }
        } catch (e) {
            console.error("Reset error", e);
        } finally {
            setLoading(false);
        }
    };

    const handleAdopt = async (pet) => {
        const adoptionPrice = pet.price || 0;
        const currentGold = state.character?.gold || 0;

        if (currentGold < adoptionPrice) {
            toast.error(`Coinhilda requires ${adoptionPrice}g for this adoption.`);
            return;
        }

        if (!await confirm({ title: 'Adopt Companion?', message: `Welcome ${pet.pet_type} (Lvl ${pet.pet_level}) into your party for ${adoptionPrice} Gold?`, variant: 'quest', confirmText: 'Adopt' })) return;

        try {
            const res = await fetch('api/sanctuary.php?action=adopt', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: pet.id })
            });
            const data = await res.json();

            if (data.success) {
                setAbandonedPets(prev => prev.filter(p => p.id !== pet.id));
                const adoptedPet = {
                    id: `pet_${Date.now()}`,
                    type: pet.pet_type,
                    level: pet.pet_level,
                    xp: { current: 0, max: pet.pet_level * 100 },
                    hunger: 100,
                    happiness: 100,
                    hygiene: 100,
                    inSanctuary: true,
                    showPet: false
                };
                actions.dispatch({ type: 'ADOPT_PET', payload: { ...pet, cost: adoptionPrice, adoptedData: adoptedPet } });
            } else {
                toast.error(data.error || 'The Sanctuary could not complete this adoption.');
            }
        } catch (e) {
            console.error("Failed to adopt pet", e);
        }
    };

    const isNight = hour >= 21 || hour < 5;

    return (
        <div className="space-y-8 animate-in fade-in duration-300">
            {/* Header */}
            <div className="text-center">
                <div className="inline-flex items-center gap-2.5 mb-2">
                    <div className="h-px w-8 bg-gradient-to-r from-transparent to-emerald-500/40" />
                    <span className="text-[10px] text-emerald-500/60 uppercase tracking-[0.3em] font-bold">Companion Haven</span>
                    <div className="h-px w-8 bg-gradient-to-l from-transparent to-emerald-500/40" />
                </div>
                <h2 className="text-2xl font-herald text-emerald-400">The Wild Sanctuary</h2>
                <p className="text-gray-500 text-xs mt-2 max-w-xs mx-auto leading-relaxed">
                    A protected meadow where your companions roam free between adventures.
                </p>
            </div>

            {/* Sanctuary Meadow */}
            <div className="relative w-full rounded-2xl overflow-hidden border border-emerald-900/40 shadow-[0_8px_32px_rgba(0,0,0,0.4)]">
                {/* Admin Controls */}
                {currentUser?.is_admin && (
                    <div className="absolute top-3 right-3 z-50">
                        <button
                            onClick={handleResetAll}
                            className="bg-red-900/80 hover:bg-red-600 text-red-100 px-3 py-1.5 rounded-lg border border-red-500/50 shadow-xl font-bold uppercase tracking-widest text-[9px] transition-all"
                        >
                            Reset All
                        </button>
                    </div>
                )}

                {/* Layered background */}
                <div className="absolute inset-0 bg-gradient-to-b from-[#0a2618] via-[#0f3524] to-[#071f14]" />
                <div className="absolute inset-0 opacity-[0.06]" style={{
                    backgroundImage: 'radial-gradient(circle at 2px 2px, #34d399 1px, transparent 0)',
                    backgroundSize: '24px 24px'
                }} />
                <div className="absolute top-0 left-0 right-0 h-20 bg-gradient-to-b from-black/40 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-black/50 to-transparent" />

                {/* Sun / Moon */}
                <CelestialBody hour={hour} />

                {/* Tree silhouettes in background */}
                <div className="absolute inset-0 pointer-events-none z-[5]">
                    {TREES.map((tree, i) => (
                        <TreeSilhouette key={i} {...tree} />
                    ))}
                </div>

                {/* Firefly particles — brighter at night */}
                <div className="absolute inset-0 pointer-events-none overflow-hidden z-[15]">
                    {[0, 1, 2, 3, 4, 5, 6].map(i => {
                        const isDusk = hour >= 19 && hour < 21;
                        const opacity = isNight ? 0.6 : isDusk ? 0.4 : 0.2;
                        return (
                            <div key={i} className="absolute rounded-full animate-pulse" style={{
                                width: isNight ? '2.5px' : '1.5px',
                                height: isNight ? '2.5px' : '1.5px',
                                backgroundColor: `rgba(52,211,153,${opacity})`,
                                boxShadow: isNight ? '0 0 6px rgba(52,211,153,0.4)' : 'none',
                                left: `${10 + ((i * 13 + 7) % 80)}%`,
                                top: `${15 + ((i * 17 + 3) % 65)}%`,
                                animationDuration: `${3 + i * 0.6}s`,
                                animationDelay: `${i * 0.4}s`
                            }} />
                        );
                    })}
                </div>

                {/* Day/night ambient overlay */}
                {getDayNightOverlay(hour) !== 'transparent' && (
                    <div className="pointer-events-none absolute inset-0 z-20 transition-colors duration-[60000ms]" style={{ background: getDayNightOverlay(hour) }} />
                )}

                {/* CRT scanline overlay */}
                <div className="retro-crt-filter pointer-events-none absolute inset-0 z-30" />

                {/* Ground strip */}
                <div className="absolute bottom-[40px] left-0 right-0 h-[60px] sm:h-[80px] z-[4]" style={{
                    background: 'linear-gradient(to bottom, transparent, rgba(4,30,16,0.5) 30%, rgba(4,30,16,0.7))'
                }} />

                {/* Pet meadow area */}
                <div className="relative min-h-[200px] sm:min-h-[280px] z-10" onClick={() => setSelectedPet(null)}>
                    {myPets.length > 0 ? (
                        <div className="relative h-[200px] sm:h-[280px]">
                            {myPets.map((pet, idx) => {
                                const total = myPets.length;
                                const spacing = 70 / Math.max(total, 2);
                                const leftPos = 15 + idx * spacing;
                                const bottomPos = 48 + (idx % 2 === 0 ? 0 : 12);
                                const isSelected = selectedPet?.id === pet.id;

                                return (
                                    <div
                                        key={pet.id}
                                        className="absolute flex flex-col items-center cursor-pointer"
                                        style={{
                                            left: `${leftPos}%`,
                                            bottom: `${bottomPos}px`,
                                            zIndex: isSelected ? 100 : 10 + idx,
                                            transform: 'translateX(-50%)'
                                        }}
                                        onClick={(e) => { e.stopPropagation(); setSelectedPet(isSelected ? null : pet); }}
                                    >
                                        {/* Info card ABOVE the pet */}
                                        {isSelected && (
                                            <div className="absolute bottom-full mb-2 bg-rpg-panel/95 backdrop-blur-xl border border-emerald-500/30 rounded-xl p-3 min-w-[140px] shadow-[0_8px_24px_rgba(0,0,0,0.6)] animate-in fade-in zoom-in-95 duration-150 z-50" onClick={(e) => e.stopPropagation()}>
                                                <div className="flex items-center gap-2 mb-2">
                                                    <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center overflow-hidden shrink-0">
                                                        <ModernPixelPet type={pet.type} size={28} />
                                                    </div>
                                                    <div className="min-w-0">
                                                        <p className="text-[11px] font-bold text-white truncate">{petLabel(pet.type)}</p>
                                                        <p className="text-[9px] text-emerald-400 font-bold uppercase">Level {pet.level}</p>
                                                    </div>
                                                </div>
                                                <div className="space-y-1 border-t border-white/5 pt-2">
                                                    <div className="flex justify-between text-[9px]">
                                                        <span className="text-gray-500">Owner</span>
                                                        <span className="text-gray-300 font-bold">{state.character?.name || 'You'}</span>
                                                    </div>
                                                    <div className="flex justify-between text-[9px]">
                                                        <span className="text-gray-500">Bond</span>
                                                        <span className="text-gray-300 font-bold">{pet.bond ?? 0}</span>
                                                    </div>
                                                    <div className="flex justify-between text-[9px]">
                                                        <span className="text-gray-500">Happiness</span>
                                                        <span className={`font-bold ${(pet.happiness ?? 100) >= 80 ? 'text-emerald-400' : (pet.happiness ?? 100) < 25 ? 'text-red-400' : 'text-amber-400'}`}>{Math.round(pet.happiness ?? 100)}%</span>
                                                    </div>
                                                    <div className="flex justify-between text-[9px]">
                                                        <span className="text-gray-500">XP</span>
                                                        <span className="text-gray-300 font-bold">{pet.xp?.current ?? 0} / {pet.xp?.max ?? 100}</span>
                                                    </div>
                                                </div>
                                                {/* Arrow pointing down */}
                                                <div className="absolute left-1/2 -translate-x-1/2 -bottom-1.5 w-3 h-3 bg-rpg-panel/95 border-r border-b border-emerald-500/30 rotate-45" />
                                            </div>
                                        )}

                                        <div className="drop-shadow-[0_3px_4px_rgba(0,0,0,0.5)] sanctuary-idle" style={{
                                            animationDuration: `${3 + (idx % 3) * 0.5}s`,
                                            animationDelay: `${idx * 0.4}s`
                                        }}>
                                            <ModernPixelPet type={pet.type} scale={1.0 * evolutionScale(pet.level)} />
                                        </div>
                                        <div className="w-8 h-1.5 bg-black/40 rounded-[50%] blur-[2px] mt-[-2px]" />
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-[200px] sm:h-[280px] text-center">
                            <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/15 flex items-center justify-center mb-4">
                                <PixelIcon name="heart" size={24} className="text-emerald-500/40" />
                            </div>
                            <p className="text-emerald-500/50 font-bold tracking-widest uppercase text-[11px]">The Sanctuary Awaits</p>
                            <p className="text-gray-600 text-[10px] mt-1.5 max-w-[240px]">Hatch an egg or adopt a companion to bring life here.</p>
                        </div>
                    )}
                </div>

                {/* Pet count footer */}
                {myPets.length > 0 && (
                    <div className="relative border-t border-emerald-900/40 bg-black/30 backdrop-blur-sm px-4 py-2.5 flex items-center justify-between z-30">
                        <span className="text-[10px] text-emerald-400/70 font-bold uppercase tracking-wider">
                            {myPets.length} Companion{myPets.length !== 1 ? 's' : ''} Roaming
                        </span>
                        <div className="flex -space-x-2">
                            {myPets.slice(0, 5).map(pet => (
                                <div key={pet.id} className="w-6 h-6 rounded-full bg-emerald-900/50 border border-emerald-500/20 flex items-center justify-center overflow-hidden">
                                    <ModernPixelPet type={pet.type} size={20} />
                                </div>
                            ))}
                            {myPets.length > 5 && (
                                <div className="w-6 h-6 rounded-full bg-emerald-900/50 border border-emerald-500/20 flex items-center justify-center text-[8px] text-emerald-400 font-bold">
                                    +{myPets.length - 5}
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* Adoption Center */}
            <div>
                <div className="flex items-center gap-3 mb-5">
                    <PixelIcon name="heart" size={14} className="text-emerald-400/60" />
                    <h3 className="text-sm font-heading font-bold text-gray-300 uppercase tracking-wider">Adoption Center</h3>
                    <div className="h-px flex-1 bg-white/5" />
                    <span className="text-[10px] text-gray-600 font-bold">{abandonedPets.length} available</span>
                </div>

                {loading ? (
                    <div className="flex justify-center py-12">
                        <div className="w-5 h-5 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                    </div>
                ) : abandonedPets.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {abandonedPets.map((pet) => (
                            <div key={pet.id} className="bg-rpg-panel/60 backdrop-blur-md border border-white/10 rounded-2xl p-4 flex items-center gap-4 hover:border-emerald-500/30 transition-all group">
                                <div className="w-14 h-14 sm:w-16 sm:h-16 bg-gradient-to-br from-emerald-500/10 to-teal-500/5 rounded-xl border border-emerald-500/15 flex items-center justify-center overflow-hidden shrink-0">
                                    <ModernPixelPet type={pet.pet_type} size={48} />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h4 className="text-sm font-bold text-white truncate">{petLabel(pet.pet_type)}</h4>
                                    <div className="flex items-center gap-2 mt-1">
                                        <span className="text-[9px] bg-emerald-500/15 text-emerald-400 px-1.5 py-0.5 rounded font-bold uppercase">Lvl {pet.pet_level}</span>
                                        <span className="text-[9px] text-gray-500">from {pet.owner_name}</span>
                                    </div>
                                    <div className={`text-[9px] font-bold uppercase tracking-wider mt-1 ${parseInt(pet.seconds_passed) > 172800 ? 'text-red-400' : 'text-gray-500'}`}>
                                        {formatCountdown(pet.seconds_passed)}
                                    </div>
                                </div>
                                <div className="flex flex-col items-end gap-2 shrink-0">
                                    <span className="text-rpg-gold font-bold text-xs flex items-center gap-1">
                                        <PixelIcon name="coins" size={10} color="#fbbf24" />
                                        {pet.price || 0}
                                    </span>
                                    <button
                                        onClick={() => handleAdopt(pet)}
                                        className="bg-emerald-500/15 hover:bg-emerald-500/30 text-emerald-400 border border-emerald-500/30 hover:border-emerald-500/50 text-[10px] uppercase font-bold py-1.5 px-3 rounded-lg transition-all"
                                    >
                                        Adopt
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="bg-rpg-panel/40 border border-white/5 rounded-2xl p-8 sm:p-10 text-center">
                        <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/15 flex items-center justify-center mx-auto mb-4">
                            <PixelIcon name="heart" size={20} className="text-emerald-500/30" />
                        </div>
                        <p className="text-sm font-bold text-gray-400 uppercase tracking-wider">The Sanctuary is Quiet</p>
                        <p className="text-gray-600 text-xs mt-2 max-w-[260px] mx-auto">No companions are looking for a home right now. Check back soon.</p>
                    </div>
                )}
            </div>

            <style>{`
                @keyframes sanctuaryIdle {
                    0%, 100% { transform: scaleY(1); }
                    50% { transform: scaleY(0.97); }
                }
                .sanctuary-idle {
                    animation: sanctuaryIdle 3s ease-in-out infinite;
                    transform-origin: bottom center;
                }
            `}</style>
        </div>
    );
};

export default PetSanctuaryView;
