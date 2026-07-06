import React, { useState } from 'react';
import { CHARACTERS } from '../data/characters';
import ModernPixelAvatar from './common/ModernPixelAvatar';
import { PressButton } from './common/PressButton';

const CharacterCreation = ({ onComplete }) => {
    const [name, setName] = useState('');
    const [selectedCharId, setSelectedCharId] = useState(CHARACTERS[0].id);
    const [colors, setColors] = useState({
        skin: '#ffdbac',
        hair: '#78350f',
        primary: '#e2e8f0' // Base armor/robe
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        if (name.trim()) {
            const charData = CHARACTERS.find(c => c.id === selectedCharId);
            if (charData) {
                onComplete(name, charData.class, charData.id, charData.baseStats, colors, null);
            }
        }
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-screen p-4 space-y-8 bg-dark-900 overflow-y-auto">
            <h1 className="text-4xl text-rpg-green mt-8 md:mt-0 font-pixel text-center text-shadow-glow">CHOOSE YOUR HERO</h1>

            <div className="flex flex-col xl:flex-row gap-8 w-full max-w-7xl items-start">
                {/* Left Side: Class Selection */}
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 flex-1">
                    {CHARACTERS.map((c) => (
                        <div
                            key={c.id}
                            onClick={() => {
                                setSelectedCharId(c.id);
                                // Set initial default colors based on class
                                if (c.avatarType === 'mage') setColors({ skin: '#ffdbac', hair: '#e2e8f0', primary: '#818cf8' });
                                else if (c.avatarType === 'rogue') setColors({ skin: '#ffdbac', hair: '#0f172a', primary: '#94a3b8' });
                                else setColors({ skin: '#ffdbac', hair: '#78350f', primary: '#e2e8f0' });
                            }}
                            className={`
                  cursor-pointer border-4 p-4 flex flex-col items-center space-y-4 transition-all rounded-xl
                  ${selectedCharId === c.id ? 'border-rpg-gold bg-white/10 shadow-glow-gold scale-105' : 'border-gray-700 bg-black/40 hover:border-gray-500'}
                `}
                        >
                            <div className="transition-transform duration-300 pb-2">
                                <ModernPixelAvatar
                                    type={c.avatarType}
                                    scale={1.2}
                                    customColors={selectedCharId === c.id ? colors : undefined}
                                    headOnly={selectedCharId !== c.id}
                                />
                            </div>
                            <h2 className={`text-lg md:text-xl font-heading font-bold ${selectedCharId === c.id ? 'text-rpg-gold' : 'text-white'}`}>{c.name}</h2>
                            <div className="text-center text-gray-400 text-xs space-y-1 w-full bg-black/50 p-2 rounded-lg grid grid-cols-2 gap-x-2">
                                <p>STR: <span className="text-white font-bold">{c.baseStats.str}</span></p>
                                <p>INT: <span className="text-white font-bold">{c.baseStats.int}</span></p>
                                <p>DEX: <span className="text-white font-bold">{c.baseStats.dex}</span></p>
                                <p>CON: <span className="text-white font-bold">{c.baseStats.con}</span></p>
                                <p>CHA: <span className="text-white font-bold">{c.baseStats.cha}</span></p>
                                <p>WIL: <span className="text-white font-bold">{c.baseStats.will}</span></p>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Right Side: Customization */}
                <div className="w-full xl:w-96 glass-panel p-6 flex flex-col space-y-6">
                    <h2 className="text-2xl font-heading text-rpg-gold text-center border-b border-white/10 pb-4">APPEARANCE</h2>

                    <div className="space-y-4">
                        <div className="flex items-center justify-between bg-black/40 p-3 rounded-xl border border-white/5">
                            <label className="text-sm font-bold text-gray-400 uppercase tracking-wider">Skin Color</label>
                            <input
                                type="color"
                                value={colors.skin}
                                onChange={(e) => setColors({ ...colors, skin: e.target.value })}
                                className="w-10 h-10 rounded cursor-pointer border-none bg-transparent"
                            />
                        </div>

                        <div className="flex items-center justify-between bg-black/40 p-3 rounded-xl border border-white/5">
                            <label className="text-sm font-bold text-gray-400 uppercase tracking-wider">Hair Color</label>
                            <input
                                type="color"
                                value={colors.hair}
                                onChange={(e) => setColors({ ...colors, hair: e.target.value })}
                                className="w-10 h-10 rounded cursor-pointer border-none bg-transparent"
                            />
                        </div>

                        <div className="flex items-center justify-between bg-black/40 p-3 rounded-xl border border-white/5">
                            <label className="text-sm font-bold text-gray-400 uppercase tracking-wider">Outfit / Armor</label>
                            <input
                                type="color"
                                value={colors.primary}
                                onChange={(e) => setColors({ ...colors, primary: e.target.value })}
                                className="w-10 h-10 rounded cursor-pointer border-none bg-transparent"
                            />
                        </div>

                    </div>

                    <form onSubmit={handleSubmit} className="flex flex-col items-center space-y-4 w-full mt-4 pt-4 border-t border-white/10">
                        <label className="text-sm font-bold text-gray-400 uppercase tracking-wider w-full text-left">Hero Name</label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full bg-black/60 border border-white/20 rounded-xl p-4 text-xl focus:border-rpg-gold focus:ring-1 focus:ring-rpg-gold outline-none text-center text-white font-heading font-bold"
                            placeholder="Enter Name..."
                            maxLength={15}
                            required
                        />
                        <PressButton
                            type="submit"
                            className="bg-rpg-gold text-rpg-bg text-xl px-8 py-4 font-bold rounded-xl w-full shadow-glow-gold uppercase tracking-widest font-heading mt-4"
                        >
                            Start Adventure
                        </PressButton>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default CharacterCreation;
