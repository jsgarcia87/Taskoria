import React, { useMemo } from 'react';
import ModernPixelAvatar from '../common/ModernPixelAvatar';
import PixelIcon from '../common/PixelIcon';

const FOCUS_MESSAGES = [
    "FINISH THAT CHAPTER!",
    "LETS LOCK THE F IN",
    "PAW-SITIVELY FOCUSED!",
    "GRINDING XP...",
    "DO NOT DISTURB",
    "READING SPELLBOOK",
    "POTION BREWING..."
];

const CoFocusingArea = ({ currentUser, activeProfile, familyMembers, friends }) => {

    // Combine everyone into a single array with random positions
    const fieldCharacters = useMemo(() => {
        let chars = [];

        // Add active user
        if (activeProfile && activeProfile.state?.character) {
            chars.push({
                id: 'me',
                name: 'You',
                avatarId: activeProfile.state.character.avatarId,
                colors: activeProfile.state.character.avatarColors,
                isFocusing: !!activeProfile.state.character.focusMessage,
                message: activeProfile.state.character.focusMessage || null,
                // fixed center-ish position
                left: 50,
                top: 50
            });
        }

        // Add family
        familyMembers.forEach((fm, index) => {
            if (!fm.state?.character) return;
            const isFoc = !!fm.state.character.focusMessage || Math.random() > 0.5;
            chars.push({
                id: fm.id,
                name: fm.state.character.name,
                avatarId: fm.state.character.avatarId,
                colors: fm.state.character.avatarColors,
                isFocusing: isFoc,
                message: fm.state.character.focusMessage || (isFoc ? FOCUS_MESSAGES[Math.floor(Math.random() * FOCUS_MESSAGES.length)] : null),
                // random spread 15-85% for x, 20-80% for y
                left: 15 + Math.random() * 70,
                top: 20 + Math.random() * 60
            });
        });

        // Add friends
        friends.forEach((fr, index) => {
            if (!fr.character) return;
            const isFoc = !!fr.character.focusMessage || Math.random() > 0.3; // Friends slightly more likely to be focusing in this simulation
            chars.push({
                id: fr.id,
                name: fr.character.name || fr.username,
                avatarId: fr.character.avatarId,
                colors: fr.character.avatarColors,
                isFocusing: isFoc,
                message: fr.character.focusMessage || (isFoc ? FOCUS_MESSAGES[Math.floor(Math.random() * FOCUS_MESSAGES.length)] : null),
                left: 10 + Math.random() * 80,
                top: 20 + Math.random() * 60
            });
        });

        return chars;
    }, [activeProfile, familyMembers, friends]);

    return (
        <div className="mb-10">
            <h2 className="text-xl font-heading font-bold text-rpg-gold mb-2 uppercase tracking-widest flex items-center gap-2 drop-shadow-md">
                <PixelIcon name="home" size={24} className="text-orange-400" />
                Village Square (Co-Focusing)
            </h2>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">A bustling medieval hub for your party!</p>

            {/* The Field */}
            <div className="relative w-full h-96 medieval-town-bg border-4 border-rpg-panel rounded-xl overflow-hidden shadow-[0_10px_30px_rgba(0,0,0,0.5)]">

                {/* Environmental Props (Fake CSS buildings/props) */}
                {/* Town Bulletin Board */}
                <div className="absolute top-8 right-12 w-20 h-24 flex flex-col items-center z-[5] opacity-90 drop-shadow-xl">
                    <div className="w-16 h-12 bg-[#8b5a2b] border-[3px] border-[#5c3a21] rounded-sm relative shadow-lg">
                        {/* Papers */}
                        <div className="absolute top-2 left-2 w-4 h-5 bg-yellow-100 rotate-[-5deg] shadow-sm"></div>
                        <div className="absolute top-4 right-2 w-5 h-4 bg-white rotate-[10deg] shadow-sm"></div>
                        <div className="absolute top-1 right-5 w-2 h-2 rounded-full bg-red-500"></div>
                    </div>
                    {/* Posts */}
                    <div className="flex justify-between w-12 h-12">
                        <div className="w-3 h-full bg-[#5c3a21] shadow-inner border-x border-[#3d261b]"></div>
                        <div className="w-3 h-full bg-[#5c3a21] shadow-inner border-x border-[#3d261b]"></div>
                    </div>
                </div>

                {/* Village Well */}
                <div className="absolute top-[40%] left-[25%] transform -translate-x-1/2 -translate-y-1/2 w-24 h-24 z-[10] flex flex-col items-center justify-end drop-shadow-xl">
                    {/* Roof */}
                    <div className="w-24 h-8 bg-red-800 border-b-4 border-red-950 rounded-t-sm rotate-0 absolute top-0 z-20 overflow-hidden">
                        {/* Shingles */}
                        <div className="w-full h-full opacity-30" style={{ backgroundImage: 'linear-gradient(90deg, transparent 50%, rgba(0,0,0,0.5) 50%)', backgroundSize: '10px 10px' }}></div>
                    </div>
                    {/* Pillars */}
                    <div className="flex justify-between w-16 h-16 absolute top-4 z-10">
                        <div className="w-3 h-full bg-[#5c3a21] border-x border-[#3d261b]"></div>
                        <div className="w-3 h-full bg-[#5c3a21] border-x border-[#3d261b]"></div>
                    </div>
                    {/* Stone Base */}
                    <div className="w-20 h-10 bg-gray-500 border-t-4 border-gray-400 rounded-lg border-b-4 border-gray-700 shadow-xl relative z-30 flex items-center justify-center">
                        <div className="w-16 h-4 bg-black rounded-lg opacity-80 shadow-inner"></div>
                    </div>
                </div>

                {/* Grass Patches */}
                <div className="absolute bottom-4 left-4 w-16 h-8 bg-green-800/40 rounded-full blur-sm"></div>
                <div className="absolute top-4 left-1/2 w-24 h-12 bg-green-800/30 rounded-full blur-sm"></div>
                <div className="absolute bottom-12 right-1/4 w-20 h-10 bg-green-800/40 rounded-full blur-sm"></div>

                {/* Live Status Indicator */}
                <div className="absolute top-4 right-4 bg-black/60 px-3 py-1 rounded-sm border border-white/20 text-[10px] font-bold text-white uppercase flex items-center gap-2 z-[100] backdrop-blur-sm">
                    <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></div>
                    LIVE
                </div>

                {fieldCharacters.map((char) => (
                    <div
                        key={char.id}
                        className="absolute transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center hover:z-50 transition-all duration-300"
                        style={{ left: `${char.left}%`, top: `${char.top}%`, zIndex: Math.floor(char.top) }}
                    >
                        {/* Status Bubbles */}
                        {char.isFocusing ? (
                            <div className="absolute left-full ml-2 top-0 pixel-bubble animate-float whitespace-nowrap z-50">
                                <div className="bubble-header">FOCUSING...</div>
                                <div className="bubble-body whitespace-nowrap flex items-center gap-2">
                                    {char.message} <PixelIcon name="star" size={12} className="text-white opacity-50" />
                                </div>
                                <div className="absolute top-4 -left-3 text-[#2a2a2a] text-xl leading-none" style={{ textShadow: '-2px 2px 0 rgba(0,0,0,0.5)' }}>◀</div>
                            </div>
                        ) : (
                            <div className="absolute -top-6 -right-4 flex font-bold text-gray-400 text-sm">
                                <span className="animate-sleep-z" style={{ animationDelay: '0s' }}>Z</span>
                                <span className="animate-sleep-z" style={{ animationDelay: '0.4s' }}>z</span>
                                <span className="animate-sleep-z" style={{ animationDelay: '0.8s' }}>z</span>
                            </div>
                        )}

                        {/* Avatar */}
                        <div className={`transition-transform duration-500 hover:scale-125 ${!char.isFocusing ? 'opacity-60 saturate-50' : ''}`}>
                            <ModernPixelAvatar type={char.avatarId || 'warrior'} scale={1.5} customColors={char.colors} />
                        </div>

                        {/* Name tag */}
                        <div className="mt-1 px-2 py-0.5 bg-black/50 rounded font-bold text-[8px] text-white uppercase tracking-wider backdrop-blur-sm">
                            {char.name}
                        </div>
                    </div>
                ))}
            </div>

            {/* Legend / Status bar */}
            <div className="bg-[#2b254a] p-3 border-x-4 border-b-4 border-rpg-panel rounded-b-lg flex justify-between items-center text-xs text-gray-400 font-bold uppercase tracking-widest">
                <div className="flex items-center gap-4">
                    <span className="flex items-center gap-1"><div className="w-2 h-2 bg-green-500"></div> Focused</span>
                    <span className="flex items-center gap-1"><div className="w-2 h-2 bg-gray-500"></div> Resting</span>
                </div>
                <div>{fieldCharacters.length} Heroes Online</div>
            </div>
        </div>
    );
};

export default CoFocusingArea;
