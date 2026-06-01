import React, { useState, useEffect } from 'react';
import PixelAvatar from '../common/PixelAvatar';
import PixelPet from '../common/PixelPet';
import PixelIcon from '../common/PixelIcon';
import { CHARACTERS } from '../../data/characters';
import { useGame } from '../../context/GameContext';

const GardenView = ({ forceScenario }) => {
    const { state } = useGame();
    const { character } = state;
    const [message, setMessage] = useState("");
    const [messageVisible, setMessageVisible] = useState(true);

    // Determine the active scenario
    let activeScenario = forceScenario || 'garden';
    if (!forceScenario && character?.isResting) {
        activeScenario = 'inn';
    }

    // Calculate counts outside memoization
    const pendingTasks = state?.tasks?.filter(t => !t.completed).length || 0;
    const pendingHabits = state?.habits?.filter(h => h.target ? (!h.completed && h.count < h.target) : !h.completed).length || 0;
    const charName = character?.name || "";

    // Generate possible messages dynamically and stably
    const possibleMessages = React.useMemo(() => {
        if (!character) return [];
        const msgs = [
            `Hello, ${charName}! What shall we begin with today?`,
            "The focus dungeon awaits for you to gain experience!",
        ];

        if (activeScenario === 'inn') {
            msgs.push(`Resting at the inn... zZz...`);
            msgs.push(`The fire is warm today.`);
        } else if (activeScenario === 'sanctuary') {
            msgs.push(`What a magical place!`);
            msgs.push(`Our friends are resting here.`);
        } else {
            if (pendingTasks > 0) {
                msgs.push(`You have ${pendingTasks} quests pending for today.`);
            } else {
                msgs.push(`All quests completed! Take a breather.`);
            }
        }

        if (pendingHabits > 0) {
            msgs.push(`Don't forget to complete your daily habits.`);
        }
        return msgs;
    }, [charName, activeScenario, pendingTasks, pendingHabits]);

    // Keep possibleMessages in a ref so the interval timer never restarts on component ticks
    const msgsRef = React.useRef(possibleMessages);
    useEffect(() => {
        msgsRef.current = possibleMessages;
    }, [possibleMessages]);

    useEffect(() => {
        if (possibleMessages.length === 0) return;
        
        // Initialize first message
        setMessage(possibleMessages[0]);
        setMessageVisible(true);

        let msgIndex = 0;
        let timeoutId;
        
        const interval = setInterval(() => {
            setMessageVisible(false);
            timeoutId = setTimeout(() => {
                const currentMsgs = msgsRef.current;
                if (currentMsgs.length > 0) {
                    msgIndex = (msgIndex + 1) % currentMsgs.length;
                    setMessage(currentMsgs[msgIndex]);
                    setMessageVisible(true);
                }
            }, 500);
        }, 8000);

        return () => {
            clearInterval(interval);
            clearTimeout(timeoutId);
        };
    }, [charName]);

    if (!character) return null;

    const charData = CHARACTERS.find(c => c.id === character.avatarId) || CHARACTERS[0]; // Fallback to first char if ID mismatch

    // Scenario configurations
    const configs = {
        garden: {
            bgGradient: 'from-[#2f3b33]/80 to-[#1a2e22]/90',
            pattern: {
                backgroundImage: 'linear-gradient(45deg, #4ade80 25%, #22c55e 25%, #22c55e 50%, #4ade80 50%, #4ade80 75%, #22c55e 75%, #22c55e)',
                backgroundSize: '20px 20px',
                opacity: 0.1
            },
            badge: 'Garden Lv. 1',
            badgeClass: 'text-rpg-green bg-rpg-green/10 border-rpg-green/20'
        },
        inn: {
            bgGradient: 'from-[#1a102e]/95 to-[#0f0a1a]/95',
            pattern: {
                // Wooden floor / dark cobblestone vibe
                backgroundImage: 'linear-gradient(45deg, #4a3225 25%, #3d261b 25%, #3d261b 50%, #4a3225 50%, #4a3225 75%, #3d261b 75%, #3d261b)',
                backgroundSize: '30px 30px',
                opacity: 0.3
            },
            badge: 'The Inn',
            badgeClass: 'text-rpg-gold bg-rpg-gold/10 border-rpg-gold/20'
        },
        sanctuary: {
            bgGradient: 'from-[#14532d]/60 to-[#022c22]/90',
            pattern: {
                // Mystical grass vibe
                backgroundImage: 'radial-gradient(circle, #34d399 10%, transparent 20%), radial-gradient(circle, #10b981 10%, transparent 20%)',
                backgroundSize: '40px 40px',
                backgroundPosition: '0 0, 20px 20px',
                opacity: 0.15
            },
            badge: 'Sanctuary',
            badgeClass: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
        }
    };

    const currentConfig = configs[activeScenario];

    return (
        <div className="relative glass-card p-0 h-64 flex items-end justify-center pb-6 overflow-hidden group shadow-2xl ring-1 ring-white/10">
            {/* Decorative Background */}
            <div className={`absolute inset-0 bg-gradient-to-b ${currentConfig.bgGradient} transition-all duration-1000 group-hover:scale-110`} />
            <div className="absolute inset-0 transition-opacity duration-1000" style={currentConfig.pattern}></div>
            <div className="absolute top-0 left-0 right-0 h-16 bg-gradient-to-b from-black/50 to-transparent z-0"></div>

            {/* Special Atmosphere Effects */}
            {activeScenario === 'inn' && (
                <div className="absolute inset-0 pointer-events-none flex justify-center items-end pb-10">
                    {/* Fake campfire glow behind avatar */}
                    <div className="w-32 h-32 bg-orange-500/10 rounded-full blur-2xl animate-pulse" style={{ animationDuration: '4s' }}></div>
                </div>
            )}
            {activeScenario === 'sanctuary' && (
                <div className="absolute inset-0 pointer-events-none">
                    {/* Magical floating motes */}
                    <div className="absolute top-10 left-10 w-2 h-2 bg-emerald-300 rounded-full blur-[2px] animate-bounce" style={{ animationDuration: '3s' }}></div>
                    <div className="absolute top-20 right-20 w-3 h-3 bg-emerald-200 rounded-full blur-[3px] animate-bounce" style={{ animationDuration: '5s' }}></div>
                </div>
            )}

            {/* Avatar & Pet */}
            <div className="relative z-10 flex items-end justify-center mt-4 gap-4">
                {/* Pet (Left side of Avatar) */}
                {character.pets && character.pets.find(p => p.showPet !== false && !p.inSanctuary) && (
                    <div className="flex flex-col items-center translate-y-2 relative group/pet">
                        {(() => {
                            const activePet = character.pets.find(p => p.showPet !== false && !p.inSanctuary);
                            const mood = (activePet.happiness < 30 || activePet.hunger < 20 || activePet.hygiene < 20) ? 'sad' : 'happy';
                            
                            return (
                                <>
                                    {/* Status Bubbles */}
                                    <div className="absolute -top-10 left-1/2 -translate-x-1/2 flex gap-1 animate-bounce pointer-events-none">
                                        {activePet.hunger < 30 && (
                                            <div className="bg-orange-500 rounded-full p-1 shadow-lg border border-white/20">
                                                <PixelIcon name="apple" size={10} color="white" />
                                            </div>
                                        )}
                                        {activePet.happiness < 30 && (
                                            <div className="bg-pink-500 rounded-full p-1 shadow-lg border border-white/20">
                                                <PixelIcon name="heart" size={10} color="white" />
                                            </div>
                                        )}
                                        {activePet.hygiene < 30 && (
                                            <div className="bg-blue-500 rounded-full p-1 shadow-lg border border-white/20 text-[10px] leading-none flex items-center justify-center w-4 h-4">
                                                💩
                                            </div>
                                        )}
                                    </div>

                                    <div className="transform hover:scale-110 transition-transform duration-300 filter drop-shadow-xl animate-bounce" style={{ animationDuration: mood === 'sad' ? '5s' : '3s' }}>
                                        <PixelPet type={activePet.type} scale={1.25} level={activePet.level} mood={mood} />
                                    </div>
                                    <div className="w-10 h-2 bg-black/50 rounded-[50%] blur-md mt-[-4px]" />
                                </>
                            );
                        })()}
                    </div>
                )}

                {/* Main Avatar */}
                <div 
                    className="flex flex-col items-center relative cursor-pointer group/avatar"
                    onClick={() => setActiveView && setActiveView('profile')}
                >
                    {/* Speech Bubble */}
                    {messageVisible && message && (
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 pixel-bubble z-50 whitespace-normal w-max max-w-[150px] md:max-w-[200px] pointer-events-none animate-bubble-popup">
                            <div className="bubble-body normal-case tracking-wide text-center">
                                {message}
                            </div>
                            {/* Tail pointing down */}
                            <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 text-[#2a2a2a] text-xl leading-none" style={{ textShadow: '2px 2px 0 rgba(0,0,0,0.5)' }}>
                                ▼
                            </div>
                        </div>
                    )}

                    {charData && (
                        <div className="relative transform group-hover/avatar:scale-110 transition-transform duration-300 flex justify-center filter drop-shadow-2xl md:drop-shadow-none md:group-hover/avatar:drop-shadow-2xl">
                            <PixelAvatar
                                type={charData.avatarType || charData.id}
                                scale={2.4}
                                customColors={character?.avatarColors}
                            />
                            {/* Mobile visual cue */}
                            <div className="md:hidden absolute -inset-2 rounded-full border-2 border-rpg-gold/0 group-hover/avatar:border-rpg-gold/50 transition-all animate-pulse"></div>
                        </div>
                    )}
                    {/* Simple shadow */}
                    <div className="w-16 h-2.5 bg-black/60 rounded-[50%] blur-md mt-[-8px] group-hover/avatar:scale-110 transition-transform" />
                    
                    {/* Mobile "Edit" Hint */}
                    <div className="md:hidden absolute -bottom-8 opacity-0 group-hover/avatar:opacity-100 transition-opacity text-[10px] text-rpg-gold font-bold uppercase tracking-widest whitespace-nowrap">
                        View Hero
                    </div>
                </div>
            </div>

            {/* Date/Info overlay */}
            <div className="absolute bottom-4 left-4 right-4 flex justify-between items-end z-20">
                <div className="glass-panel px-3 py-1.5 backdrop-blur-md bg-black/40 border-white/5">
                    <div className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-0.5">Today</div>
                    <div className="text-xs text-white font-heading font-medium">
                        {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
                    </div>
                </div>
            </div>

            <div className="absolute top-4 right-4 z-20">
                <span className={`text-[10px] uppercase font-bold tracking-widest px-2 py-1 rounded-lg border backdrop-blur-md shadow-lg transition-colors ${currentConfig.badgeClass}`}>
                    {currentConfig.badge}
                </span>
            </div>
        </div>
    );
};

export default GardenView;
