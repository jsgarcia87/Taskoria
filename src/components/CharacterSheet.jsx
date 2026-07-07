import React, { useState } from 'react';
import { useGame } from '../context/GameContext';
import {
    BADGE_DEFS,
    SPECIES_PERKS,
    EVOLUTIONS,
    canEvolvePet,
    PET_BOND_MAX,
} from '../utils/gameUtils';
import { Edit2, Eye, EyeOff, X } from 'lucide-react'; // keeping small utility icons
import { PressButton } from './common/PressButton';
import { StatBar } from './common/StatBar';
import { NumberTicker } from './common/NumberTicker';
import PixelIcon from './common/PixelIcon';
import { CHARACTERS } from '../data/characters';
import { EQUIPMENT_SLOTS, ITEM_TYPES, SET_BONUSES } from '../data/items';
import ModernPixelAvatar from './common/ModernPixelAvatar';
import ModernPixelPet from './common/ModernPixelPet';
import Sprite from './common/Sprite';
import AvatarSpeechBubble from './common/AvatarSpeechBubble';
import DailyProgressChart from './dashboard/DailyProgressChart';
import StatsRadarChart from './dashboard/StatsRadarChart';
import { useToast } from './common/Toast';

const CharacterSheet = ({ setActiveView }) => {
    const { state, actions, activeProfileId, familyData } = useGame();
    const toast = useToast();
    const { character } = state;
    const [activeTab, setActiveTab] = useState('stats'); // stats | inventory | skills
    const [isSellModalOpen, setIsSellModalOpen] = useState(false);
    const [itemToSell, setItemToSell] = useState(null);
    const [sellPrice, setSellPrice] = useState('');
    const [isListing, setIsListing] = useState(false);
    const [isReleasing, setIsReleasing] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);

    if (!character) {
        return <div className="p-8 text-center text-gray-400">Loading Profile...</div>;
    }

    const inventoryGroups = character.inventory?.reduce((acc, item) => {
        const existing = acc.find(i => i.id === item.id);
        if (existing) {
            existing.count += 1;
        } else {
            acc.push({ ...item, count: 1 });
        }
        return acc;
    }, []) || [];

    const charData = CHARACTERS.find(c => c.id === character.avatarId);

    // Calculate percentages for bars with safety checks
    const hpPercent = character.hp ? (character.hp.current / character.hp.max) * 100 : 0;
    const xpPercent = character.xp ? (character.xp.current / character.xp.max) * 100 : 0;

    const startEditing = () => {
        setIsEditModalOpen(true);
    };

    const handleSaveAvatar = (newAvatarId, newColors, cost) => {
        actions.updateAvatar(newAvatarId, newColors, cost);
        setIsEditModalOpen(false);
    };

    const handleEquip = (item) => {
        actions.equipItem(item, item.slot);
    };

    const handleSellClick = (item) => {
        setItemToSell(item);
        setSellPrice(item.cost.toString()); // default to original cost
        setIsSellModalOpen(true);
    };

    const confirmQuickSell = () => {
        if (itemToSell) {
            actions.sellItem(itemToSell);
            setIsSellModalOpen(false);
            setItemToSell(null);
        }
    };

    const confirmMarketListing = async () => {
        if (!itemToSell || !sellPrice) return;

        setIsListing(true);
        // Find seller info from family data
        const currentProfile = familyData?.profiles?.find(p => p.id === activeProfileId);
        const sellerName = currentProfile ? currentProfile.name : character.name;
        // In this single-user but multi-profile mock, the overall user ID isn't directly exposed here, 
        // we can grab it from localStorage session or pass it down via GameContext.
        const session = JSON.parse(localStorage.getItem('taskoria_session') || '{}');
        const userId = session.id || 1;

        try {
            const res = await fetch('api/market.php?action=sell', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    user_id: userId,
                    profile_id: activeProfileId,
                    seller_name: sellerName,
                    item: itemToSell,
                    price: parseInt(sellPrice)
                })
            });

            const data = await res.json();
            if (data.success) {
                // Must remove item from inventory
                // To do this simply, we can re-use a variant of sellItem but for 0 gold, 
                // or just call a new action `REMOVE_ITEM`.
                // For now, let's just use sellItem but we'd need to modify context slightly.
                // Or we can add a simple remove action. Let's add and call listMarketItem
                actions.listMarketItem(itemToSell);
                setIsSellModalOpen(false);
                setItemToSell(null);
            } else {
                toast.error(data.error || "Failed to list item");
            }
        } catch (e) {
            console.error("Market listing error", e);
        } finally {
            setIsListing(false);
        }
    };

    const toggleSanctuary = async (pet) => {
        if (!pet) return;
        const isInSanctuary = pet.inSanctuary;
        const actionText = isInSanctuary ? "retrieve" : "deposit";
        if (!confirm(`Are you sure you want to ${actionText} your pet ${isInSanctuary ? "from" : "to"} the Wild Sanctuary?`)) return;

        setIsReleasing(true); // Using same loading state
        try {
            const currentProfile = familyData?.profiles?.find(p => p.id === activeProfileId);
            const ownerName = currentProfile ? currentProfile.name : character.name;
            const profileId = activeProfileId || 'default'; // Fallback

            const res = await fetch(`api/sanctuary.php?action=${actionText}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    profile_id: profileId,
                    owner_name: ownerName,
                    pet_type: pet.type,
                    pet_level: pet.level,
                    pet_xp: pet.xp.current,
                    is_market: 0
                })
            });

            const data = await res.json();
            if (data.success) {
                actions.toggleSanctuaryPet(pet.id);
            } else {
                toast.error(data.error || `Failed to ${actionText} pet`);
            }
        } catch (e) {
            console.error(`Sanctuary ${actionText} error`, e);
            // Fallback for offline mode or syntax errors
            actions.toggleSanctuaryPet(pet.id);
        } finally {
            setIsReleasing(false);
        }
    };

    const confirmAdoption = async (pet) => {
        if (!pet) return;
        if (confirm(`Are you sure you want to give ${pet.type} (Lvl ${pet.level}) up for adoption? This cannot be undone.`)) {
            setIsReleasing(true);
            try {
                const currentProfile = familyData?.profiles?.find(p => p.id === activeProfileId);
                const ownerName = currentProfile ? currentProfile.name : character.name;
                const profileId = activeProfileId || 'default';

                // Adoption fee/price logic: level * 100
                const price = pet.level * 100;

                const res = await fetch(`api/sanctuary.php?action=deposit`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        profile_id: profileId,
                        owner_name: ownerName,
                        pet_type: pet.type,
                        pet_level: pet.level,
                        pet_xp: pet.xp.current,
                        price: price,
                        is_market: 1 // This IS for the adoption market
                    })
                });

                const data = await res.json();
                if (data.success) {
                    actions.releasePet(pet.id);
                } else {
                    toast.error(data.error || "Failed to list pet for adoption");
                }
            } catch (e) {
                console.error("Adoption error", e);
                actions.releasePet(pet.id);
            } finally {
                setIsReleasing(false);
            }
        }
    };

    // Mock Skills Data based on Class
    const getSkills = (charClass) => {
        const skills = {
            // Skill icons reference PixelIcon names (sword/shield/zap/bell/book/skull/trophy/star/heart)
            'Fighter': [
                { name: 'Power Strike', type: 'Physical', desc: 'Deal 150% DMG', icon: 'sword', color: '#ef4444' },
                { name: 'Shield Wall', type: 'Defense', desc: '+50 Defense for 1 turn', icon: 'shield', color: '#94a3b8' },
                { name: 'War Cry', type: 'Buff', desc: '+10% STR to Party', icon: 'bell', color: '#fbbf24' }
            ],
            'Wizard': [
                { name: 'Fireball', type: 'Magic', desc: 'Deal AoE Fire DMG', icon: 'zap', color: '#f97316' },
                { name: 'Ice Barrier', type: 'Defense', desc: 'Absorb next hit', icon: 'shield', color: '#60a5fa' },
                { name: 'Arcane Wisdom', type: 'Passive', desc: '+20% XP Gain', icon: 'book', color: '#a78bfa' }
            ],
            'Rogue': [
                { name: 'Backstab', type: 'Physical', desc: 'Critical Hit Chance +50%', icon: 'sword', color: '#10b981' },
                { name: 'Stealth', type: 'Utility', desc: 'Avoid next combat encounter', icon: 'skull', color: '#64748b' },
                { name: 'Poison Weapon', type: 'Buff', desc: 'Add poison damage to attacks', icon: 'skull', color: '#84cc16' }
            ],
            'Cleric': [
                { name: 'Holy Light', type: 'Magic', desc: 'Heal Party for 30 HP', icon: 'zap', color: '#fde047' },
                { name: 'Divine Shield', type: 'Defense', desc: 'Block 100% DMG for 1 turn', icon: 'shield', color: '#fcd34d' },
                { name: 'Blessing', type: 'Buff', desc: '+15% All Stats', icon: 'trophy', color: '#fbbf24' }
            ],
            'Paladin': [
                { name: 'Smite', type: 'Physical', desc: 'Deal 120% Holy DMG', icon: 'zap', color: '#fbbf24' },
                { name: 'Aura of Courage', type: 'Passive', desc: 'Party is immune to fear', icon: 'shield', color: '#f59e0b' },
                { name: 'Lay on Hands', type: 'Utility', desc: 'Massive single-target heal', icon: 'trophy', color: '#fde68a' }
            ]
        };
        return skills[charClass] || [];
    };

    return (
        <div className="glass-panel h-full flex flex-col rounded-2xl overflow-hidden relative min-h-[600px] border border-white/10 shadow-2xl">
            {/* Background Decoration */}
            <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-purple-900/40 to-transparent pointer-events-none"></div>

            {/* Header */}
            <div className="p-6 pb-2 relative z-10">
                <div className="flex items-start justify-between">
                    <div className="flex gap-5 items-center">
                        <div className="w-20 h-20 bg-gradient-to-br from-purple-500/20 to-blue-500/20 rounded-2xl border border-white/10 flex items-center justify-center shadow-lg relative overflow-hidden group">
                            <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                            {charData && (
                                <AvatarSpeechBubble idleTimeMs={30000}>
                                    <ModernPixelAvatar
                                        type={charData.id}
                                        scale={1.8}
                                        customColors={character?.avatarColors}
                                        headOnly={true}
                                    />
                                </AvatarSpeechBubble>
                            )}
                        </div>
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <h2 className="text-3xl font-display font-bold text-white tracking-tight">{character.name}</h2>
                                <button
                                    onClick={startEditing}
                                    className="p-1.5 text-gray-400 hover:text-white bg-white/5 rounded-full hover:bg-white/10 transition-all"
                                >
                                    <Edit2 size={12} />
                                </button>
                            </div>
                            <div className="flex items-center gap-3">
                                <span className="px-2 py-0.5 rounded textxs font-bold bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-sm border border-white/10 text-xs uppercase tracking-wide flex-shrink-0">
                                    Lvl {character.level} {character.class}
                                </span>
                                <button
                                    onClick={() => actions.toggleResting()}
                                    className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all border shadow-lg whitespace-nowrap ${character.isResting ? 'bg-indigo-600/30 border-indigo-500/50 text-indigo-300 hover:bg-indigo-500/40' : 'bg-black/30 border-white/10 text-gray-400 hover:text-white hover:border-white/30'}`}
                                    title={character.isResting ? "Leave the Inn" : "Rest at the Inn (Halts Penalties)"}
                                >
                                    {character.isResting ? '🌙 Resting' : '🏕️ Go to Inn'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Status Bars */}
                <div className="mt-6 space-y-3">
                    <div className="relative group">
                        <div className="flex justify-between mb-1 text-xs font-bold uppercase tracking-wider">
                            <span className="text-red-400 flex items-center gap-1"><PixelIcon name="heart" size={12} color="#f87171" className="fill-current" /> Health</span>
                            <span className="text-gray-400">
                                <NumberTicker value={character.hp.current} /> / {character.hp.max}
                            </span>
                        </div>
                        <StatBar current={character.hp.current} max={character.hp.max} kind="hp" />
                    </div>

                    <div className="relative group">
                        <div className="flex justify-between mb-1 text-xs font-bold uppercase tracking-wider">
                            <span className="text-amber-400 flex items-center gap-1"><PixelIcon name="star" size={12} color="#fbbf24" className="fill-current" /> Experience</span>
                            <span className="text-gray-400">
                                <NumberTicker value={character.xp.current} /> / {character.xp.max}
                            </span>
                        </div>
                        <StatBar current={character.xp.current} max={character.xp.max} kind="xp" />
                    </div>
                </div>
            </div>

            {/* Navigation Tabs */}
            <div className="px-6 flex gap-1 border-b border-white/5 mt-2">
                {[
                    { id: 'stats', label: 'Stats', icon: 'zap' },
                    { id: 'skills', label: 'Skills', icon: 'book' },
                    { id: 'inventory', label: 'Gear', icon: 'gear' },
                    { id: 'companion', label: 'Pet', icon: 'heart' },
                    { id: 'medals', label: 'Medals', icon: 'star' },
                ].map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`
                            flex-1 py-3 text-sm font-bold uppercase tracking-wide transition-all border-b-2 flex items-center justify-center gap-2
                            ${activeTab === tab.id
                                ? 'border-purple-500 text-white bg-white/5 rounded-t-lg'
                                : 'border-transparent text-gray-500 hover:text-gray-300 hover:bg-white/5'}
                        `}
                    >
                        <PixelIcon name={tab.icon} size={14} /> {tab.label}
                    </button>
                ))}
            </div>

            {/* Content Area */}
            <div className="flex-grow overflow-y-auto p-6 custom-scrollbar">
                {activeTab === 'stats' && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">

                        {/* Daily Progress Chart */}
                        <DailyProgressChart />

                        {/* Attribute Radar Chart */}
                        <StatsRadarChart stats={character.stats || { str: 10, int: 10, dex: 10 }} />

                        {/* Attribute Stats Grid */}
                        <div className="grid grid-cols-3 gap-4">
                            {[
                                { key: 'str', label: 'STR', color: 'red' },
                                { key: 'int', label: 'INT', color: 'blue' },
                                { key: 'dex', label: 'DEX', color: 'green' },
                                { key: 'con', label: 'CON', color: 'orange' },
                                { key: 'cha', label: 'CHA', color: 'yellow' },
                                { key: 'will', label: 'WILL', color: 'purple' },
                            ].map(stat => {
                                const baseValue = character.baseStats[stat.key] || 0;
                                const totalValue = character.stats[stat.key] || 0;
                                const bonus = totalValue - baseValue;
                                return (
                                    <div key={stat.key} className={`glass-card p-4 flex flex-col items-center relative overflow-hidden group border-t-2 border-t-${stat.color}-500 hover:-translate-y-1 transition-transform`}>
                                        <div className={`absolute inset-0 bg-${stat.color}-500/5 group-hover:bg-${stat.color}-500/10 transition-colors`}></div>
                                        <span className="text-xs font-bold text-gray-400 font-display uppercase tracking-widest mb-1 z-10">{stat.label}</span>
                                        <div className="flex items-baseline gap-1 z-10">
                                            {(() => {
                                                const baseValue = character.baseStats?.[stat.key] || 10;
                                                const totalValue = character.stats?.[stat.key] || 10;
                                                const bonus = totalValue - baseValue;
                                                return (
                                                    <>
                                                        <span className="text-3xl font-display font-bold text-white">{totalValue}</span>
                                                        {bonus > 0 && <span className="text-[10px] font-bold text-green-400">+{bonus}</span>}
                                                    </>
                                                );
                                            })()}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>


                            {/* Active Set Bonuses */}
                            {character.activeSets && Object.keys(character.activeSets).length > 0 && (
                                <div className="mt-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
                                    <h3 className="text-purple-400 text-[10px] font-bold uppercase tracking-widest mb-3 flex items-center gap-2">
                                        <PixelIcon name="star" size={12} color="#a855f7" /> Active Set Bonuses
                                    </h3>
                                    <div className="grid grid-cols-1 gap-2">
                                        {Object.entries(character.activeSets).map(([setId, count]) => {
                                            const bonuses = SET_BONUSES[setId] || [];
                                            const activeBonuses = bonuses.filter(b => count >= b.count);
                                            
                                            if (activeBonuses.length === 0) return null;

                                            return (
                                                <div key={setId} className="glass-card p-3 border-l-2 border-l-purple-500 bg-purple-500/5">
                                                    <div className="flex justify-between items-center mb-2">
                                                        <span className="text-[10px] font-bold text-white uppercase tracking-wider">{setId} Set</span>
                                                        <span className="text-[10px] font-bold text-purple-400">{count} Items</span>
                                                    </div>
                                                    <div className="space-y-1">
                                                        {activeBonuses.map((bonus, idx) => (
                                                            <div key={idx} className="flex items-center gap-2">
                                                                <div className="w-1 h-1 rounded-full bg-purple-400"></div>
                                                                <span className="text-[11px] text-gray-300 font-medium">{bonus.label}</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                            {/* Equipment Section (The Doll) */}
                        <div className="mt-8">
                            <h3 className="text-gray-400 text-[10px] font-bold uppercase tracking-widest mb-4 flex items-center gap-2">
                                <PixelIcon name="shield" size={12} color="#94a3b8" /> Equipment Slots
                            </h3>
                            <div className="grid grid-cols-2 gap-3">
                                {[
                                    { label: 'Head', slot: EQUIPMENT_SLOTS.HEAD, icon: 'shield', color: '#64748b' },
                                    { label: 'Armor', slot: EQUIPMENT_SLOTS.BODY, icon: 'shirt', color: '#94a3b8' },
                                    { label: 'Main Hand', slot: EQUIPMENT_SLOTS.MAIN_HAND, icon: 'sword', color: '#fbbf24' },
                                    { label: 'Off Hand', slot: EQUIPMENT_SLOTS.OFF_HAND, icon: 'shield', color: '#cbd5e1' },
                                    { label: 'Ring', slot: EQUIPMENT_SLOTS.RING, icon: 'zap', color: '#fbbf24' },
                                ].map((slotInfo) => {
                                    const equippedItem = character.equipment && character.equipment[slotInfo.slot];
                                    return (
                                        <div key={slotInfo.slot} className="flex flex-col gap-2 p-3 glass-card bg-black/30 border border-white/5 group hover:border-purple-500/30 transition-all">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 bg-black/40 rounded border border-white/10 flex items-center justify-center shrink-0">
                                                    {equippedItem ? (
                                                        <Sprite
                                                            src={equippedItem.sprite.src}
                                                            x={equippedItem.sprite.x}
                                                            y={equippedItem.sprite.y}
                                                            width={equippedItem.sprite.width}
                                                            height={equippedItem.sprite.height}
                                                            scale={1}
                                                        />
                                                    ) : (
                                                        <PixelIcon name={slotInfo.icon} size={16} color={slotInfo.color} className="opacity-30" />
                                                    )}
                                                </div>
                                                <div className="flex-1 overflow-hidden">
                                                    <p className="text-[9px] text-gray-500 uppercase font-bold tracking-wider">{slotInfo.label}</p>
                                                    <p className={`text-[11px] font-bold truncate ${equippedItem ? 'text-white' : 'text-gray-600 italic'}`}>
                                                        {equippedItem ? equippedItem.name : 'Empty'}
                                                    </p>
                                                </div>
                                            </div>
                                            {equippedItem && (
                                                <button
                                                    onClick={() => actions.unequipItem(slotInfo.slot)}
                                                    className="w-full py-1 text-[9px] font-bold uppercase tracking-tighter bg-red-500/5 hover:bg-red-500/20 text-red-500 rounded border border-red-500/10 transition-all mt-1"
                                                >
                                                    Unequip
                                                </button>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'skills' && (
                    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                        {getSkills(character.class).map((skill, idx) => {
                            const isLocked = character.level < (idx * 3 + 1);
                            return (
                                <div key={idx} className={`glass-card p-4 flex items-start gap-4 ${isLocked ? 'opacity-50 grayscale' : ''} group hover:border-white/20 transition-all`}>
                                    <div className="w-12 h-12 flex items-center justify-center bg-black/30 rounded-xl border border-white/10 shrink-0">
                                        <PixelIcon name={skill.icon} size={22} color={skill.color || '#fbbf24'} />
                                    </div>
                                    <div className="flex-grow">
                                        <div className="flex justify-between items-center mb-1">
                                            <h4 className="font-bold text-white text-sm">{skill.name}</h4>
                                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 text-gray-300 border border-white/5 uppercase font-bold tracking-wider">{skill.type}</span>
                                        </div>
                                        <p className="text-xs text-gray-400 leading-relaxed">{skill.desc}</p>
                                        {isLocked && (
                                            <p className="text-xs text-red-400 mt-2 font-bold flex items-center gap-1">
                                                <PixelIcon name="shield" size={10} color="#f87171" /> Unlocks at Level {idx * 3 + 1}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                {activeTab === 'inventory' && (
                    <div className="space-y-2 animate-in fade-in slide-in-from-bottom-2 duration-300">
                        {inventoryGroups.length > 0 ? (
                            inventoryGroups.map((item, index) => (
                                <div key={index} className="glass-card p-2 pr-4 flex justify-between items-center group hover:bg-white/5 transition-colors">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-black/30 rounded-lg flex items-center justify-center border border-white/10 relative">
                                            <Sprite
                                                src={item.sprite.src}
                                                x={item.sprite.x}
                                                y={item.sprite.y}
                                                width={item.sprite.width}
                                                height={item.sprite.height}
                                                scale={1}
                                            />
                                            {item.count > 1 && (
                                                <span className="absolute -top-2 -right-2 bg-rpg-gold text-black text-[9px] font-bold px-1.5 py-0.5 rounded-full border border-yellow-200 shadow-md">
                                                    x{item.count}
                                                </span>
                                            )}
                                        </div>
                                        <div>
                                            <p className="text-white font-bold text-xs">{item.name}</p>
                                            <p className="text-gray-500 text-[10px]">{item.description}</p>
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        {item.type === ITEM_TYPES.GEAR && (
                                            <button
                                                onClick={() => handleEquip(item)}
                                                className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-purple-600/50 hover:text-white text-[10px] font-bold text-gray-300 transition-colors border border-white/5"
                                            >
                                                EQUIP
                                            </button>
                                        )}
                                        {item.type === ITEM_TYPES.CONSUMABLE && (
                                            <button
                                                onClick={() => actions.useItem(item)}
                                                className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-green-600/50 hover:text-white text-[10px] font-bold text-gray-300 transition-colors border border-white/5"
                                            >
                                                USE
                                            </button>
                                        )}
                                        <button
                                            onClick={() => handleSellClick(item)}
                                            className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-yellow-500/20 hover:text-yellow-400 text-[10px] font-bold text-gray-400 transition-colors border border-white/5"
                                        >
                                            SELL
                                        </button>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="text-center py-10 px-4 glass-panel border-dashed border-white/10 opacity-80 flex flex-col items-center justify-center gap-3">
                                <PixelIcon name="box" size={40} className="text-gray-500" />
                                <div>
                                    <div className="text-sm font-bold text-gray-300 uppercase tracking-widest">Empty Satchel</div>
                                    <div className="text-xs text-gray-500 mt-1 max-w-[260px] mx-auto">Complete quests and defeat bosses to find loot.</div>
                                </div>
                                {setActiveView && (
                                    <button
                                        onClick={() => setActiveView('shop')}
                                        className="text-[11px] font-bold uppercase tracking-widest border border-rpg-gold/40 text-rpg-gold hover:bg-rpg-gold/10 hover:border-rpg-gold px-3 py-1.5 rounded-lg transition-colors flex items-center gap-2"
                                    >
                                        <PixelIcon name="coins" size={12} color="#fbbf24" /> Visit the Shop
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'companion' && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                        {character.pets && character.pets.length > 0 ? (
                            character.pets.map((pet) => (
                                <div key={pet.id} className="flex flex-col items-center bg-black/20 p-6 rounded-2xl border border-white/5 relative mb-6">
                                    <button
                                        onClick={() => confirmAdoption(pet)}
                                        disabled={isReleasing}
                                        className="absolute top-4 right-4 text-[10px] font-bold uppercase tracking-wider text-red-400 hover:text-red-300 bg-red-500/10 hover:bg-red-500/20 px-3 py-1.5 rounded-lg border border-red-500/20 transition-all disabled:opacity-50"
                                    >
                                        Give for Adoption
                                    </button>
                                    <div className="w-32 h-32 bg-gradient-to-br from-green-500/20 to-emerald-500/20 rounded-full border border-white/10 flex items-center justify-center shadow-lg relative mb-4">
                                        <div className="flex items-center justify-center transform translate-y-2">
                                            <ModernPixelPet type={pet.type} scale={1.8} />
                                        </div>
                                    </div>
                                    <h3 className="text-xl font-display font-bold text-white capitalize">{pet.type}</h3>
                                    <div className="flex items-center gap-3 mb-4">
                                        <span className="px-2 py-0.5 rounded text-xs font-bold bg-gradient-to-r from-green-600 to-emerald-600 text-white shadow-sm border border-white/10 uppercase tracking-wide">
                                            Lvl {pet.level}
                                        </span>
                                    </div>
                                    <div className="mb-6 bg-black/40 p-2 rounded-xl border border-white/5 flex items-center gap-3">
                                        <span className="text-xs text-gray-400 font-bold uppercase tracking-widest pl-2">Display Next to Hero</span>
                                        <button
                                            onClick={() => actions.togglePetVisibility(pet.id)}
                                            className={`flex items-center justify-center p-2 rounded-lg transition-colors border ${pet.showPet !== false ? 'bg-green-500/20 border-green-500/50 text-green-400' : 'bg-white/5 border-white/10 text-gray-500 hover:text-white'}`}
                                        >
                                            {pet.showPet !== false ? <Eye size={16} /> : <EyeOff size={16} />}
                                        </button>
                                    </div>

                                    <div className="mb-6 w-full flex justify-center">
                                        <button
                                            onClick={() => toggleSanctuary(pet)}
                                            disabled={isReleasing}
                                            className={`text-xs font-bold uppercase tracking-widest px-4 py-2 rounded-xl transition-all disabled:opacity-50 border ${pet.inSanctuary
                                                ? 'text-amber-400 hover:text-amber-300 border-amber-500/30 hover:bg-amber-500/10'
                                                : 'text-emerald-400 hover:text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/10'
                                                }`}
                                        >
                                            {isReleasing
                                                ? 'Processing...'
                                                : (pet.inSanctuary ? 'Retrieve from Sanctuary' : 'Send to Sanctuary (Rest)')}
                                        </button>
                                    </div>

                                    {/* Pet Stats */}
                                    <div className="w-full space-y-4">
                                        <div className="relative group">
                                            <div className="flex justify-between mb-1 text-xs font-bold uppercase tracking-wider">
                                                <span className="text-amber-400 flex items-center gap-1"><PixelIcon name="star" size={12} color="#fbbf24" className="fill-current" /> Exp</span>
                                                <span className="text-gray-400">{Math.floor(pet.xp.current)} / {pet.xp.max}</span>
                                            </div>
                                            <StatBar current={pet.xp.current} max={pet.xp.max} kind="xp" celebrateAtMax={false} />
                                        </div>

                                        {/* Bond — grows with every interaction, amplifies pet perks */}
                                        <div className="relative group">
                                            <div className="flex justify-between mb-1 text-xs font-bold uppercase tracking-wider">
                                                <span className="text-rose-400 flex items-center gap-1"><PixelIcon name="heart" size={12} color="#fb7185" /> Bond</span>
                                                <span className="text-gray-400">{pet.bond || 0} / {PET_BOND_MAX}</span>
                                            </div>
                                            <StatBar current={pet.bond || 0} max={PET_BOND_MAX} kind="bond" height="h-2" />
                                        </div>

                                        <div className="grid grid-cols-3 gap-4">
                                            <div className="relative group">
                                                <div className="flex justify-between mb-1 text-[10px] font-bold uppercase tracking-wider">
                                                    <span className="text-orange-400 flex items-center gap-1">Hunger</span>
                                                    <span className={pet.hunger < 20 ? "text-red-500 animate-pulse" : "text-gray-400"}>{Math.floor(pet.hunger)}%</span>
                                                </div>
                                                <StatBar current={pet.hunger} max={100} kind="hunger" dangerBelow={20} height="h-2" celebrateAtMax={false} />
                                            </div>

                                            <div className="relative group">
                                                <div className="flex justify-between mb-1 text-[10px] font-bold uppercase tracking-wider">
                                                    <span className="text-pink-400 flex items-center gap-1">Happy</span>
                                                    <span className={(pet.happiness || 100) < 20 ? "text-red-500 animate-pulse" : "text-gray-400"}>{Math.floor(pet.happiness || 100)}%</span>
                                                </div>
                                                <StatBar current={pet.happiness || 100} max={100} kind="happy" dangerBelow={20} height="h-2" celebrateAtMax={false} />
                                            </div>

                                            <div className="relative group">
                                                <div className="flex justify-between mb-1 text-[10px] font-bold uppercase tracking-wider">
                                                    <span className="text-blue-400 flex items-center gap-1">Clean</span>
                                                    <span className={(pet.hygiene || 100) < 20 ? "text-red-500 animate-pulse" : "text-gray-400"}>{Math.floor(pet.hygiene || 100)}%</span>
                                                </div>
                                                <StatBar current={pet.hygiene || 100} max={100} kind="hygiene" dangerBelow={20} height="h-2" celebrateAtMax={false} />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Interaction Buttons */}
                                    <div className="grid grid-cols-2 gap-3 w-full mt-6">
                                        <button
                                            onClick={() => actions.playWithPet(pet.id)}
                                            disabled={pet.inSanctuary}
                                            className="flex items-center justify-center gap-2 py-2 rounded-xl border border-white/10 bg-white/5 text-gray-300 hover:bg-pink-500/10 hover:border-pink-500/30 hover:text-pink-400 transition-all font-bold text-[10px] uppercase tracking-wider disabled:opacity-50"
                                        >
                                            <PixelIcon name="heart" size={14} color="#f472b6" />
                                            Play
                                        </button>
                                        <button
                                            onClick={() => actions.cleanPet(pet.id)}
                                            disabled={pet.inSanctuary}
                                            className="flex items-center justify-center gap-2 py-2 rounded-xl border border-white/10 bg-white/5 text-gray-300 hover:bg-blue-500/10 hover:border-blue-500/30 hover:text-blue-400 transition-all font-bold text-[10px] uppercase tracking-wider disabled:opacity-50"
                                        >
                                            <PixelIcon name="zap" size={14} color="#60a5fa" />
                                            Groom
                                        </button>
                                    </div>

                                    {/* PERKS + EVOLUTION */}
                                    {(SPECIES_PERKS[pet.type] || canEvolvePet(pet)) && (
                                        <div className="w-full mt-4 p-3 rounded-xl bg-gradient-to-br from-amber-500/5 via-transparent to-rose-500/5 border border-white/10">
                                            {SPECIES_PERKS[pet.type] && (
                                                <>
                                                    <h4 className="text-[10px] font-bold text-amber-400 uppercase tracking-widest mb-2 flex items-center gap-1">
                                                        <PixelIcon name="star" size={10} color="#fbbf24" /> Active Perks
                                                        {pet.inSanctuary && <span className="text-[9px] text-gray-500 normal-case font-normal italic">(disabled while resting)</span>}
                                                        {!pet.showPet && !pet.inSanctuary && <span className="text-[9px] text-gray-500 normal-case font-normal italic">(disabled while hidden)</span>}
                                                    </h4>
                                                    <div className="flex flex-wrap gap-1.5">
                                                        {Object.entries(SPECIES_PERKS[pet.type]).map(([key, value]) => {
                                                            const label = {
                                                                xpMult:      `+${Math.round(value * 100)}% XP`,
                                                                goldMult:    `+${Math.round(value * 100)}% Gold`,
                                                                dmgMult:     `+${Math.round(value * 100)}% DMG`,
                                                                hardDmgMult: `+${Math.round(value * 100)}% DMG (hard)`,
                                                            }[key] || `${key} ${value}`;
                                                            const color = {
                                                                xpMult: 'amber', goldMult: 'yellow', dmgMult: 'red', hardDmgMult: 'orange',
                                                            }[key] || 'gray';
                                                            return (
                                                                <span key={key} className={`text-[10px] font-bold px-2 py-0.5 rounded border bg-${color}-500/10 text-${color}-300 border-${color}-500/30`}>
                                                                    {label}
                                                                </span>
                                                            );
                                                        })}
                                                    </div>
                                                    {(pet.bond || 0) >= 25 && (
                                                        <p className="text-[9px] text-rose-300/70 mt-2 italic">
                                                            Bond {pet.bond}/100 amplifies these perks ×{pet.bond >= 100 ? '1.5' : pet.bond >= 75 ? '1.3' : pet.bond >= 50 ? '1.15' : '1.05'}
                                                        </p>
                                                    )}
                                                </>
                                            )}

                                            {/* Evolution CTA — shows only once the pet hits the level threshold */}
                                            {canEvolvePet(pet) && (
                                                <button
                                                    onClick={() => actions.evolvePet(pet.id)}
                                                    className="w-full mt-3 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-gradient-to-r from-rpg-gold to-amber-400 text-rpg-bg hover:brightness-110 font-heading font-bold text-xs uppercase tracking-widest shadow-[0_0_20px_rgba(251,191,36,0.4)] animate-pulse"
                                                >
                                                    <PixelIcon name="zap" size={14} color="#1a102e" />
                                                    Evolve into {EVOLUTIONS[pet.type].label}
                                                </button>
                                            )}
                                        </div>
                                    )}

                                    {/* Feed Section */}
                                    <div className="w-full mt-6">
                                        <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 border-b border-white/10 pb-2">Pantry (Pet Food)</h4>

                                        {pet.inSanctuary ? (
                                            <div className="bg-black/30 border border-emerald-500/20 rounded-xl p-4 text-center">
                                                <p className="text-emerald-400/80 text-sm font-bold uppercase tracking-widest mb-1">Resting at Sanctuary</p>
                                                <p className="text-gray-500 text-[10px]">Your pet is currently recovering happiness and fullness. Bring them back to resume feeding.</p>
                                            </div>
                                        ) : (
                                            <div className="space-y-2">
                                                {character.inventory && character.inventory.filter(i => i.type === ITEM_TYPES.PET_FOOD).length > 0 ? (
                                                    character.inventory.filter(i => i.type === ITEM_TYPES.PET_FOOD).map((food, idx) => (
                                                        <div key={idx} className="glass-card p-2 pr-4 flex justify-between items-center bg-black/20 group hover:border-rpg-gold/30 transition-all">
                                                            <div className="flex items-center gap-3">
                                                                <div className="w-8 h-8 bg-black/30 rounded border border-white/10 flex items-center justify-center">
                                                                    <Sprite src={food.sprite.src} x={food.sprite.x} y={food.sprite.y} width={food.sprite.width} height={food.sprite.height} scale={1} />
                                                                </div>
                                                                <div>
                                                                    <p className="text-white font-bold text-xs">{food.name}</p>
                                                                    <p className="text-gray-500 text-[10px]">{food.description}</p>
                                                                </div>
                                                            </div>
                                                            <button onClick={() => actions.feedPet(pet.id, food)} className="px-3 py-1.5 rounded-lg bg-green-500/20 hover:bg-green-500 hover:text-white text-[10px] font-bold text-green-400 transition-all border border-green-500/30 whitespace-nowrap group-hover:shadow-[0_0_10px_rgba(34,197,94,0.3)]">
                                                                FEED PET
                                                            </button>
                                                        </div>
                                                    ))
                                                ) : (
                                                    <p className="text-center text-xs text-gray-500 italic py-4 bg-black/20 rounded-xl border border-white/5">No pet food in inventory. Visit the Market!</p>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="text-center py-12">
                                <PixelIcon name="heart" size={48} className="mx-auto text-gray-700 mb-2" />
                                <p className="text-gray-500 text-sm">You do not have a companion yet.</p>
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'medals' && (
                    <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                        <div className="mb-4">
                            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-1">Lifetime Achievements</h3>
                            <div className="flex gap-4 text-xs mt-2">
                                <span className="bg-black/40 px-3 py-1.5 rounded-lg border border-white/5">Quests: <span className="text-white font-bold">{character.achievements?.tasks || 0}</span></span>
                                <span className="bg-black/40 px-3 py-1.5 rounded-lg border border-white/5">Habits: <span className="text-white font-bold">{character.achievements?.habits || 0}</span></span>
                                <span className="bg-black/40 px-3 py-1.5 rounded-lg border border-white/5">Gold: <span className="text-rpg-gold font-bold">{character.achievements?.goldEarned || 0}</span></span>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
                            {BADGE_DEFS.map(badge => {
                                const isUnlocked = character.unlockedBadges?.includes(badge.id);
                                return (
                                    <div key={badge.id} className={`glass-card p-4 flex flex-col items-center justify-center text-center relative overflow-hidden transition-all duration-300 ${isUnlocked ? 'border-rpg-gold/30 bg-rpg-gold/5' : 'opacity-50 grayscale'}`}>
                                        <div className="w-16 h-16 mb-3 relative">
                                            {isUnlocked ? (
                                                <>
                                                    <div className="absolute inset-0 bg-rpg-gold blur-md opacity-30 animate-pulse"></div>
                                                    <div className="w-full h-full bg-gradient-to-br from-yellow-300 via-rpg-gold to-yellow-600 rounded-full flex items-center justify-center border-4 border-yellow-200 shadow-glow-gold relative z-10">
                                                        <PixelIcon name="star" size={24} color="#000" />
                                                    </div>
                                                </>
                                            ) : (
                                                <div className="w-full h-full bg-gray-800 rounded-full flex items-center justify-center border-4 border-gray-600 relative z-10">
                                                    <PixelIcon name="lock" size={24} color="#6b7280" />
                                                </div>
                                            )}
                                        </div>
                                        <h4 className={`text-sm font-bold uppercase tracking-wider mb-1 ${isUnlocked ? 'text-rpg-gold' : 'text-gray-400'}`}>{badge.name}</h4>
                                        <p className="text-[10px] text-gray-400">{badge.desc}</p>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>

            {/* Footer Currencies */}
            <div className="p-4 bg-black/40 border-t border-white/5 flex grid grid-cols-2 gap-4">
                <div className="flex items-center gap-3 justify-center text-amber-400 bg-amber-500/10 py-2 rounded-xl border border-amber-500/20">
                    <PixelIcon name="coins" size={16} color="#fbbf24" />
                    <span className="font-bold font-mono">{character.gold}</span>
                </div>
                <div className="flex items-center gap-3 justify-center text-blue-400 bg-blue-500/10 py-2 rounded-xl border border-blue-500/20">
                    <PixelIcon name="clock" size={16} color="#60a5fa" />
                    <span className="font-bold font-mono">{character.timePoints}m</span>
                </div>
            </div>

            {/* Sell Modal */}
            {
                isSellModalOpen && itemToSell && (
                    <div className="absolute inset-0 z-50 rounded-2xl bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
                        <div className="glass-panel max-w-sm w-full p-6 border border-rpg-gold/50 shadow-[0_0_30px_rgba(255,215,0,0.1)]">
                            <h3 className="text-xl font-heading font-bold text-rpg-gold text-center mb-1">Sell {itemToSell.name}</h3>
                            <p className="text-gray-400 text-xs text-center mb-6">Choose how you want to part with this item.</p>

                            <div className="space-y-4">
                                {/* Quick Sell */}
                                <div className="bg-black/40 border border-white/10 rounded-xl p-4 flex flex-col gap-2">
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm font-bold text-gray-300">Quick Sell (to the Void)</span>
                                        <span className="text-amber-400 font-bold flex items-center gap-1"><PixelIcon name="coins" size={14} color="#fbbf24" /> +{Math.floor(itemToSell.cost * 0.5)}</span>
                                    </div>
                                    <p className="text-[10px] text-gray-500">Instantly sell this item back to the void for 50% of its base value.</p>
                                    <button
                                        onClick={confirmQuickSell}
                                        className="w-full mt-2 py-2 bg-white/5 hover:bg-white/10 text-white rounded-lg text-xs font-bold transition-colors"
                                    >
                                        Quick Sell
                                    </button>
                                </div>

                                <div className="text-center text-xs text-gray-600 font-bold uppercase">OR</div>

                                {/* Market Listing */}
                                <div className="bg-indigo-900/20 border border-indigo-500/30 rounded-xl p-4 flex flex-col gap-3">
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm font-bold text-indigo-300">List on Community Market</span>
                                    </div>
                                    <p className="text-[10px] text-gray-400">Set a custom price and list it globally. You get the gold when a player buys it.</p>

                                    <div>
                                        <label className="text-[10px] text-indigo-400 font-bold uppercase tracking-wider mb-1 block">Asking Price (Gold)</label>
                                        <input
                                            type="number"
                                            value={sellPrice}
                                            onChange={(e) => setSellPrice(e.target.value)}
                                            className="w-full bg-black/60 border border-indigo-500/30 rounded-lg p-2 text-white text-sm outline-none focus:border-indigo-400"
                                            min="1"
                                        />
                                    </div>

                                    <button
                                        onClick={confirmMarketListing}
                                        disabled={isListing || !sellPrice}
                                        className="w-full mt-1 py-2 bg-indigo-600/20 hover:bg-indigo-600 text-indigo-300 hover:text-white border border-indigo-500/50 rounded-lg text-xs font-bold transition-all disabled:opacity-50"
                                    >
                                        {isListing ? 'Listing...' : 'Publish to Market'}
                                    </button>
                                </div>
                            </div>

                            <button
                                onClick={() => { setIsSellModalOpen(false); setItemToSell(null); }}
                                className="w-full mt-6 py-2 text-gray-500 hover:text-white text-xs font-bold uppercase tracking-wider transition-colors"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                )
            }

            {isEditModalOpen && (
                <AvatarEditModal
                    character={character}
                    onSave={handleSaveAvatar}
                    onClose={() => setIsEditModalOpen(false)}
                />
            )}
        </div>
    );
};

const AvatarEditModal = ({ character, onSave, onClose }) => {
    const [selectedCharId, setSelectedCharId] = useState(character.avatarId);
    const [colors, setColors] = useState(character.avatarColors || {
        skin: '#ffdbac',
        hair: '#78350f',
        primary: '#e2e8f0'
    });
    const editCost = 500;
    const canAfford = character.gold >= editCost;

    const handleSave = () => {
        if (canAfford) {
            onSave(selectedCharId, colors, editCost);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-300">
            <div className="glass-panel max-w-4xl w-full max-h-[90vh] overflow-y-auto p-8 border-rpg-gold/20 relative">
                <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors">
                    <X size={24} />
                </button>

                <h2 className="text-3xl font-heading font-bold text-rpg-gold text-center mb-8 tracking-widest uppercase">
                    HERO REDESIGN
                </h2>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Left: Selection */}
                    <div className="grid grid-cols-3 gap-3 overflow-y-auto max-h-[400px] pr-2 custom-scrollbar">
                        {CHARACTERS.map(c => (
                            <div
                                key={c.id}
                                onClick={() => {
                                    setSelectedCharId(c.id);
                                    if (c.avatarType === 'mage') setColors({ ...colors, primary: '#818cf8' });
                                    else if (c.avatarType === 'rogue') setColors({ ...colors, primary: '#94a3b8' });
                                    else setColors({ ...colors, primary: '#e2e8f0' });
                                }}
                                className={`p-3 rounded-xl border-2 transition-all cursor-pointer flex flex-col items-center gap-2 ${selectedCharId === c.id ? 'border-rpg-gold bg-white/5 shadow-glow-gold' : 'border-white/5 hover:border-white/20'}`}
                            >
                                <div className="scale-125 pb-2">
                                <ModernPixelAvatar type={c.avatarType} scale={2} headOnly={true} customColors={selectedCharId === c.id ? colors : undefined} />
                                </div>
                                <span className={`text-[10px] font-bold uppercase transition-colors ${selectedCharId === c.id ? 'text-rpg-gold' : 'text-gray-400'}`}>{c.name}</span>
                            </div>
                        ))}
                    </div>

                    {/* Right: Customization & Preview */}
                    <div className="space-y-6">
                        <div className="flex justify-center p-8 bg-black/40 rounded-2xl border border-white/5 relative group">
                            <ModernPixelAvatar type={CHARACTERS.find(c => c.id === selectedCharId)?.avatarType || 'warrior'} scale={4} customColors={colors} />
                        </div>

                        <div className="grid grid-cols-1 gap-4">
                            {[
                                { label: 'Skin', key: 'skin' },
                                { label: 'Hair', key: 'hair' },
                                { label: 'Outfit', key: 'primary' }
                            ].map(item => (
                                <div key={item.key} className="flex items-center justify-between bg-black/40 p-3 rounded-xl border border-white/5">
                                    <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">{item.label} Color</label>
                                    <input
                                        type="color"
                                        value={colors[item.key]}
                                        onChange={(e) => setColors({ ...colors, [item.key]: e.target.value })}
                                        className="w-10 h-10 rounded cursor-pointer border-none bg-transparent"
                                    />
                                </div>
                            ))}
                        </div>

                        <div className="pt-6 border-t border-white/10 flex flex-col gap-4">
                            <div className="flex justify-between items-center px-2">
                                <span className="text-gray-400 text-sm">Transformation Fee:</span>
                                <span className={`font-bold flex items-center gap-1 ${canAfford ? 'text-rpg-gold font-pixel text-xl' : 'text-red-500 font-pixel text-xl'}`}>
                                    <div className="w-5 h-5 flex items-center justify-center">
                                        <PixelIcon name="coins" size={14} color={canAfford ? "#fbbf24" : "#ef4444"} />
                                    </div>
                                    {editCost} Gold
                                </span>
                            </div>

                            <PressButton
                                onClick={handleSave}
                                disabled={!canAfford}
                                className="w-full py-4 bg-rpg-gold text-rpg-bg rounded-xl font-bold uppercase tracking-widest shadow-glow-gold disabled:opacity-50"
                            >
                                Mutate Appearance
                            </PressButton>
                            {!canAfford && <p className="text-red-500 text-[10px] text-center font-bold italic">You lack the necessary gold for this transformation.</p>}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
export default CharacterSheet;
