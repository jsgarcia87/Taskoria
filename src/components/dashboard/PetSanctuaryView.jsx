import React, { useEffect, useState } from 'react';
import PixelPet from '../common/PixelPet';
import PixelIcon from '../common/PixelIcon';
import { useGame } from '../../context/GameContext';

const PetSanctuaryView = ({ currentUser }) => {
    const { state, actions } = useGame();
    const [abandonedPets, setAbandonedPets] = useState([]);
    const [loading, setLoading] = useState(true);

    const myPets = state.character?.pets || [];

    const formatCountdown = (secondsPassed) => {
        const totalSeconds = 3 * 24 * 60 * 60; // 3 days
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
        if (!confirm("CRITICAL WARNING: This will permanently delete ALL pets from ALL users in the game and clear the sanctuary. Are you 100% sure?")) return;
        
        setLoading(true);
        try {
            const res = await fetch('api/sanctuary.php?action=reset_all', { 
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ admin_id: currentUser?.id }) 
            });
            const data = await res.json();
            if (data.success) {
                alert(data.message);
                setAbandonedPets([]);
                // Reload window to clear context states
                window.location.reload();
            } else {
                alert(data.error || "Failed to reset");
            }
        } catch (e) {
            console.error("Reset error", e);
        } finally {
            setLoading(false);
        }
    };

    // Mystical grass vibe
    const handleAdopt = async (pet) => {
        const adoptionPrice = pet.price || 0;
        const currentGold = state.character?.gold || 0;

        if (currentGold < adoptionPrice) {
            alert(`You need ${adoptionPrice} Gold to adopt this companion!`);
            return;
        }

        if (!confirm(`Adopt ${pet.pet_type} (Lvl ${pet.pet_level}) for ${adoptionPrice} Gold?`)) return;

        try {
            const res = await fetch('api/sanctuary.php?action=adopt', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: pet.id })
            });
            const data = await res.json();

            if (data.success) {
                // Remove from local list
                setAbandonedPets(prev => prev.filter(p => p.id !== pet.id));
                // Add to user via GameContext
                // Simulate GameContext adopt by buying an egg and auto-hatching, or adding to pets list directly
                const adoptedPet = {
                    id: `pet_${Date.now()}`,
                    type: pet.pet_type,
                    level: pet.pet_level,
                    xp: { current: 0, max: pet.pet_level * 100 },
                    hunger: 100,
                    happiness: 100,
                    hygiene: 100,
                    inSanctuary: true, // starts in sanctuary
                    showPet: false
                };
                
                // We must deduct gold and add pet.
                // We can use a direct context action if it exists, or dispatch standard events.
                // In context we have ADOPT_PET
                actions.dispatch({ type: 'ADOPT_PET', payload: { ...pet, cost: adoptionPrice, adoptedData: adoptedPet } });
            } else {
                alert(data.error || 'Failed to adopt pet');
            }
        } catch (e) {
            console.error("Failed to adopt pet", e);
        }
    };
    const sanctuaryPattern = {
        backgroundImage: 'radial-gradient(circle, #34d399 10%, transparent 20%), radial-gradient(circle, #10b981 10%, transparent 20%)',
        backgroundSize: '40px 40px',
        backgroundPosition: '0 0, 20px 20px',
        opacity: 0.15
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-300">
            <div className="text-center mb-6">
                <h2 className="text-2xl font-heading font-bold text-emerald-400 text-shadow-glow">The Wild Sanctuary</h2>
                <p className="text-gray-400 text-xs mt-2 max-w-sm mx-auto">
                    A peaceful meadow where released companions roam free and play together.
                </p>
            </div>

            {/* Sanctuary Grass Background */}
            <div className="relative w-full h-48 sm:h-64 rounded-2xl overflow-hidden border-4 border-[#022c22] shadow-[0_15px_40px_rgba(0,0,0,0.5)]">
                {/* Admin Reset Engine */}
                {currentUser?.is_admin && (
                    <div className="absolute top-2 right-2 z-50">
                        <button 
                            onClick={handleResetAll}
                            className="bg-red-900/80 hover:bg-red-600 text-red-100 px-3 py-1.5 rounded-lg border border-red-500/50 shadow-xl font-bold uppercase tracking-widest text-[9px] transition-all"
                        >
                            ⚠ Reset All Pets
                        </button>
                    </div>
                )}
                {/* Decorative Background */}
                <div className="absolute inset-0 bg-gradient-to-b from-[#14532d]/60 to-[#022c22]/90 transition-all duration-1000" />
                <div className="absolute inset-0" style={sanctuaryPattern}></div>
                <div className="absolute top-0 left-0 right-0 h-16 bg-gradient-to-b from-black/50 to-transparent z-0"></div>

                {/* Magical Particles Overlay */}
                <div className="absolute inset-0 pointer-events-none overflow-hidden">
                    <div className="absolute top-10 left-10 w-2 h-2 bg-emerald-300 rounded-full blur-[2px] animate-bounce" style={{ animationDuration: '3s' }}></div>
                    <div className="absolute top-[20%] right-[20%] w-3 h-3 bg-emerald-200 rounded-full blur-[3px] animate-bounce" style={{ animationDuration: '5s' }}></div>
                    <div className="absolute bottom-[20%] left-[30%] w-4 h-4 bg-emerald-400 rounded-full blur-[4px] animate-pulse" style={{ animationDuration: '4s' }}></div>
                    <div className="absolute top-[40%] right-[10%] w-2 h-2 bg-teal-300 rounded-full blur-[2px] animate-ping" style={{ animationDuration: '7s' }}></div>
                </div>

                {myPets.length > 0 ? (
                    <div className="absolute inset-0 pt-10 px-10 pb-20 relative">
                        {myPets.map((pet, idx) => {
                            // Assign a random deterministic position based on ID string length or index
                            const seed = pet.id.length + idx;
                            const leftPos = Math.abs(Math.sin(seed * 123)) * 80 + 10; // 10% to 90%
                            const topPos = Math.abs(Math.cos(seed * 321)) * 60 + 20; // 20% to 80%
                            const delay = Math.abs(Math.sin(seed)) * 2; // Desync bounce animations

                            return (
                                <div
                                    key={pet.id}
                                    className="absolute flex flex-col items-center group transition-all duration-300 pointer-events-none"
                                    style={{
                                        left: `${leftPos}%`,
                                        top: `${topPos}%`,
                                        zIndex: Math.floor(topPos)
                                    }}
                                >
                                    {/* Nameplate */}
                                    <div className="bg-black/60 text-emerald-300 font-bold text-[9px] uppercase tracking-wider px-2 py-0.5 rounded-full mb-1 border border-emerald-500/30 whitespace-nowrap">
                                        Lvl {pet.level} {pet.type}
                                    </div>

                                    {/* Pet Sprite */}
                                    <div
                                        className="transform transition-transform duration-300 filter drop-shadow-xl animate-bounce"
                                        style={{ animationDuration: '3s', animationDelay: `${delay}s` }}
                                    >
                                        <PixelPet type={pet.type} scale={2} level={pet.level} />
                                    </div>
                                    <div className="w-12 h-2 bg-black/40 rounded-[50%] blur-sm mt-[-4px]" />
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6">
                        <PixelIcon name="heart" size={48} className="text-emerald-500/30 mb-4" />
                        <p className="text-emerald-500/50 font-bold tracking-widest uppercase text-sm">Your sanctuary is empty.</p>
                        <p className="text-gray-500 text-xs mt-2">Adopt or hatch pets to see them roam here.</p>
                    </div>
                )}
            </div>

            {/* Total Count */}
            {myPets.length > 0 && (
                <div className="flex justify-center mt-4">
                    <div className="px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center gap-3">
                        <span className="text-emerald-300 font-bold text-xs uppercase tracking-widest">{myPets.length} Owned Pets in Sanctuary</span>
                    </div>
                </div>
            )}

            {/* Adoption Center List */}
            <div className="mt-12">
                <div className="flex items-center gap-3 mb-6">
                    <div className="h-px bg-gradient-to-r from-transparent via-emerald-500/50 to-transparent flex-grow"></div>
                    <h3 className="text-xl font-heading font-bold text-emerald-400 text-shadow-sm px-4">Adoption Center</h3>
                    <div className="h-px bg-gradient-to-r from-emerald-500/50 via-emerald-500/50 to-transparent flex-grow"></div>
                </div>

                {loading ? (
                    <div className="flex justify-center p-8">
                        <PixelIcon name="clock" size={32} className="text-emerald-500/50 animate-spin" />
                    </div>
                ) : abandonedPets.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {abandonedPets.map((pet) => (
                            <div key={pet.id} className="glass-card p-4 flex items-center justify-between group hover:border-emerald-500/50 transition-all">
                                <div className="flex items-center gap-4">
                                    <div className="w-16 h-16 bg-gradient-to-br from-emerald-500/10 to-teal-500/20 rounded-xl flex items-center justify-center border border-emerald-500/20 shadow-inner overflow-hidden">
                                        <div className="transform scale-[1.5]">
                                            <PixelPet type={pet.pet_type} level={pet.pet_level} />
                                        </div>
                                    </div>
                                    <div>
                                        <h4 className="text-white font-bold text-sm uppercase tracking-wide">{pet.pet_type}</h4>
                                        <span className="bg-emerald-500/20 text-emerald-300 text-[10px] font-bold px-2 py-0.5 rounded-sm uppercase mb-1 inline-block">Lvl {pet.pet_level}</span>
                                        <p className="text-[10px] text-gray-500">From: <span className="text-gray-300">{pet.owner_name}</span></p>
                                    </div>
                                </div>
                                    <div className="flex flex-col items-end">
                                        <p className="text-rpg-gold font-bold text-xs mb-1 flex items-center gap-1">
                                            <PixelIcon name="coins" size={12} color="#fbbf24" /> {pet.price || 0}
                                        </p>
                                        <div className={`text-[9px] font-bold uppercase tracking-widest mb-2 px-1.5 py-0.5 rounded ${parseInt(pet.seconds_passed) > 172800 ? 'text-red-400 bg-red-400/10' : 'text-gray-400 bg-white/5'}`}>
                                            ⏱ {formatCountdown(pet.seconds_passed)}
                                        </div>
                                        <button
                                            onClick={() => handleAdopt(pet)}
                                            className="bg-emerald-500/20 hover:bg-emerald-500 text-emerald-300 hover:text-white border border-emerald-500/50 hover:border-emerald-400 text-[10px] uppercase font-bold py-1.5 px-3 rounded transition-all shadow-sm"
                                        >
                                            Adopt
                                        </button>
                                    </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="glass-card p-8 text-center border-dashed border-emerald-500/30">
                        <p className="text-gray-400 text-sm">No pets are currently looking for a home.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default PetSanctuaryView;
