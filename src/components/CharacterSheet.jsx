import React, { useState } from 'react';
import { useGame } from '../context/GameContext';
import {
    BADGE_DEFS,
    SPECIES_PERKS,
    EVOLUTIONS,
    canEvolvePet,
    PET_BOND_MAX,
} from '../utils/gameUtils';
import { Edit2, Eye, EyeOff, X } from 'lucide-react';
import { PressButton } from './common/PressButton';
import { StatBar } from './common/StatBar';
import { useConfirm } from '../context/ConfirmContext';
import { NumberTicker } from './common/NumberTicker';
import PixelIcon from './common/PixelIcon';
import { CHARACTERS } from '../data/characters';
import { EQUIPMENT_SLOTS, ITEM_TYPES, SET_BONUSES } from '../data/items';
import ModernPixelAvatar from './common/ModernPixelAvatar';
import ModernPixelPet from './common/ModernPixelPet';
import { PET_EVOLUTION_CHAINS } from '../data/petSpecies';
import Sprite from './common/Sprite';
import AvatarSpeechBubble from './common/AvatarSpeechBubble';
import DailyProgressChart from './dashboard/DailyProgressChart';
import StatsRadarChart from './dashboard/StatsRadarChart';
import { useToast } from './common/Toast';

const CLASS_THEME = {
    Fighter:     { accent: '#ef4444', icon: 'sword',  skillsLabel: 'Battle Stances',  gearLabel: 'Armory' },
    Wizard:      { accent: '#818cf8', icon: 'book',   skillsLabel: 'Arcane Arts',     gearLabel: 'Arcanum' },
    Rogue:       { accent: '#10b981', icon: 'skull',  skillsLabel: 'Shadow Tricks',   gearLabel: 'Stash' },
    Cleric:      { accent: '#fbbf24', icon: 'zap',    skillsLabel: 'Divine Rites',    gearLabel: 'Vestments' },
    Paladin:     { accent: '#f59e0b', icon: 'shield', skillsLabel: 'Sacred Oaths',    gearLabel: 'Arsenal' },
    Ranger:      { accent: '#22c55e', icon: 'star',   skillsLabel: 'Wild Craft',      gearLabel: 'Kit' },
    Barbarian:   { accent: '#dc2626', icon: 'sword',  skillsLabel: 'Primal Fury',     gearLabel: 'War Spoils' },
    Bard:        { accent: '#a78bfa', icon: 'bell',   skillsLabel: 'Performances',    gearLabel: 'Repertoire' },
    Druid:       { accent: '#4ade80', icon: 'heart',  skillsLabel: 'Nature Bonds',    gearLabel: 'Grove Cache' },
    Monk:        { accent: '#f97316', icon: 'zap',    skillsLabel: 'Inner Forms',     gearLabel: 'Wrappings' },
    Necromancer: { accent: '#7c3aed', icon: 'skull',  skillsLabel: 'Dark Pacts',      gearLabel: 'Reliquary' },
    Antipaladin: { accent: '#991b1b', icon: 'shield', skillsLabel: 'Dread Vows',      gearLabel: 'Blight Forge' },
    Sorcerer:    { accent: '#c084fc', icon: 'zap',    skillsLabel: 'Raw Channeling',  gearLabel: 'Focus Array' },
    Scout:       { accent: '#06b6d4', icon: 'star',   skillsLabel: 'Recon Tactics',   gearLabel: 'Field Pack' },
};

const STAT_CONFIG = [
    { key: 'str', label: 'STR', full: 'Strength',     color: '#ef4444', bg: 'bg-red-500',    icon: 'sword'  },
    { key: 'int', label: 'INT', full: 'Intelligence',  color: '#3b82f6', bg: 'bg-blue-500',   icon: 'book'   },
    { key: 'dex', label: 'DEX', full: 'Dexterity',     color: '#22c55e', bg: 'bg-green-500',  icon: 'zap'    },
    { key: 'con', label: 'CON', full: 'Constitution',  color: '#f97316', bg: 'bg-orange-500', icon: 'shield' },
    { key: 'cha', label: 'CHA', full: 'Charisma',      color: '#eab308', bg: 'bg-yellow-500', icon: 'bell'   },
    { key: 'will', label: 'WILL', full: 'Willpower',   color: '#a855f7', bg: 'bg-purple-500', icon: 'star'   },
];

const TIER_COLORS = {
    bronze: { bg: 'from-amber-700 via-amber-600 to-amber-800', border: 'border-amber-600', text: 'text-amber-500' },
    silver: { bg: 'from-slate-400 via-slate-300 to-slate-500', border: 'border-slate-400', text: 'text-slate-400' },
    gold:   { bg: 'from-yellow-300 via-rpg-gold to-yellow-600', border: 'border-yellow-200', text: 'text-rpg-gold' },
};

const VitalRings = ({ xp, hp, level }) => {
    const size = 160;
    const cx = size / 2;
    const cy = size / 2;
    const strokeWidth = 11;
    const gap = 5;
    const outerR = (size - strokeWidth) / 2;
    const innerR = outerR - strokeWidth - gap;
    const xpPct = Math.min(xp.current / Math.max(xp.max, 1), 1);
    const hpPct = Math.min(hp.current / Math.max(hp.max, 1), 1);
    const outerCirc = 2 * Math.PI * outerR;
    const innerCirc = 2 * Math.PI * innerR;
    const xpToNext = xp.max - xp.current;

    return (
        <div className="flex items-center gap-4">
            <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="block shrink-0">
                <circle cx={cx} cy={cy} r={outerR} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={strokeWidth} />
                <circle cx={cx} cy={cy} r={outerR} fill="none" stroke="#f59e0b" strokeWidth={strokeWidth}
                    strokeLinecap="round" strokeDasharray={outerCirc} strokeDashoffset={outerCirc * (1 - xpPct)}
                    transform={`rotate(-90 ${cx} ${cy})`} className="transition-all duration-1000 ease-out" />
                <circle cx={cx} cy={cy} r={innerR} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={strokeWidth} />
                <circle cx={cx} cy={cy} r={innerR} fill="none" stroke="#ef4444" strokeWidth={strokeWidth}
                    strokeLinecap="round" strokeDasharray={innerCirc} strokeDashoffset={innerCirc * (1 - hpPct)}
                    transform={`rotate(-90 ${cx} ${cy})`} className="transition-all duration-1000 ease-out" />
                <text x={cx} y={cy - 4} textAnchor="middle" fill="white" fontSize="26" fontWeight="bold" fontFamily="VT323, monospace">
                    {level}
                </text>
                <text x={cx} y={cy + 14} textAnchor="middle" fill="rgba(255,255,255,0.4)" fontSize="9" fontWeight="bold" letterSpacing="0.12em">
                    LEVEL
                </text>
            </svg>
            <div className="flex flex-col gap-3 min-w-0">
                <div>
                    <div className="flex items-center gap-1.5 mb-1">
                        <div className="w-2.5 h-2.5 rounded-full bg-amber-500 shrink-0" />
                        <span className="text-[10px] font-bold text-amber-400/80 uppercase tracking-wider">Exp</span>
                    </div>
                    <p className="text-sm font-pixel text-white leading-none">{xp.current.toLocaleString()} <span className="text-gray-600">/ {xp.max.toLocaleString()}</span></p>
                    <p className="text-[9px] text-gray-600 mt-0.5">{xpToNext.toLocaleString()} to next</p>
                </div>
                <div>
                    <div className="flex items-center gap-1.5 mb-1">
                        <div className="w-2.5 h-2.5 rounded-full bg-red-500 shrink-0" />
                        <span className="text-[10px] font-bold text-red-400/80 uppercase tracking-wider">Health</span>
                    </div>
                    <p className="text-sm font-pixel text-white leading-none">{hp.current} <span className="text-gray-600">/ {hp.max}</span></p>
                </div>
            </div>
        </div>
    );
};

const SectionDivider = ({ label, icon, color }) => (
    <div className="flex items-center gap-2">
        <PixelIcon name={icon} size={10} color={color + '70'} />
        <span className="text-[10px] font-heading font-bold uppercase tracking-[0.15em]" style={{ color: color + '80' }}>{label}</span>
        <div className="h-px flex-1" style={{ backgroundColor: color + '15' }} />
    </div>
);

const getHeroTitle = (level, tasksCompleted, charClass) => {
    if (level >= 30) return `Legendary ${charClass}`;
    if (level >= 20) return `Veteran ${charClass}`;
    if (level >= 10) return `Seasoned ${charClass}`;
    if (level >= 5) return `Aspiring ${charClass}`;
    return `Fledgling ${charClass}`;
};

const getChronicleQuip = (tasksCompleted, habitsCompleted, goldEarned) => {
    const total = tasksCompleted + habitsCompleted;
    if (total >= 500) return 'A pillar of the Archive. The kingdom stands on your discipline.';
    if (total >= 200) return 'The Council speaks your name with reverence.';
    if (total >= 100) return 'Your deeds echo through the halls of the Archive.';
    if (total >= 50) return 'A rising force in the realm. The Council takes notice.';
    if (total >= 20) return 'The first chapters of your legend are being written.';
    if (total >= 5) return 'Every journey begins with a single quest.';
    return 'The Archive awaits your first mark.';
};

const petDisplayLabel = (type) => {
    for (const chain of Object.values(PET_EVOLUTION_CHAINS)) {
        const entry = chain.find(e => e.blueprintKey === type);
        if (entry) return entry.label;
    }
    return type.replace(/_/g, ' ');
};

const CharacterSheet = ({ setActiveView }) => {
    const { state, actions, activeProfileId, familyData } = useGame();
    const toast = useToast();
    const confirm = useConfirm();
    const { character } = state;
    const [activeTab, setActiveTab] = useState('overview');
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
        if (existing) existing.count += 1;
        else acc.push({ ...item, count: 1 });
        return acc;
    }, []) || [];

    const charData =
        CHARACTERS.find(c => c.id === character.avatarId) ||
        CHARACTERS.find(c => c.class === character.class) ||
        CHARACTERS.find(c => c.id === (character.avatarType || '').toLowerCase()) ||
        CHARACTERS[0];

    const theme = CLASS_THEME[character.class] || CLASS_THEME.Fighter;

    const startEditing = () => setIsEditModalOpen(true);

    const handleSaveAvatar = (newAvatarId, newColors, cost) => {
        actions.updateAvatar(newAvatarId, newColors, cost);
        setIsEditModalOpen(false);
    };

    const handleEquip = (item) => actions.equipItem(item, item.slot);

    const handleSellClick = (item) => {
        setItemToSell(item);
        setSellPrice(item.cost.toString());
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
        const currentProfile = familyData?.profiles?.find(p => p.id === activeProfileId);
        const sellerName = currentProfile ? currentProfile.name : character.name;
        const session = JSON.parse(localStorage.getItem('taskoria_session') || '{}');
        const userId = session.id || 1;
        try {
            const res = await fetch('api/market.php?action=sell', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ user_id: userId, profile_id: activeProfileId, seller_name: sellerName, item: itemToSell, price: parseInt(sellPrice) })
            });
            const data = await res.json();
            if (data.success) {
                actions.listMarketItem(itemToSell);
                setIsSellModalOpen(false);
                setItemToSell(null);
            } else {
                toast.error(data.error || "Coinhilda could not list this item at the Bazaar.");
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
        if (!await confirm({ title: isInSanctuary ? 'Recall Companion?' : 'Release to Sanctuary?', message: `Your companion will be ${isInSanctuary ? 'retrieved from' : 'deposited into'} the Wild Sanctuary.`, variant: 'warning', confirmText: isInSanctuary ? 'Recall' : 'Release' })) return;
        setIsReleasing(true);
        try {
            const currentProfile = familyData?.profiles?.find(p => p.id === activeProfileId);
            const ownerName = currentProfile ? currentProfile.name : character.name;
            const profileId = activeProfileId || 'default';
            const res = await fetch(`api/sanctuary.php?action=${actionText}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ profile_id: profileId, owner_name: ownerName, pet_type: pet.type, pet_level: pet.level, pet_xp: pet.xp.current, is_market: 0 })
            });
            const data = await res.json();
            if (data.success) actions.toggleSanctuaryPet(pet.id);
            else toast.error(data.error || `The Sanctuary could not ${actionText} your companion.`);
        } catch (e) {
            console.error(`Sanctuary ${actionText} error`, e);
            actions.toggleSanctuaryPet(pet.id);
        } finally {
            setIsReleasing(false);
        }
    };

    const confirmAdoption = async (pet) => {
        if (!pet) return;
        if (await confirm({ title: 'Put Up for Adoption?', message: `${petDisplayLabel(pet.type)} (Lvl ${pet.level}) will be given away. This cannot be undone.`, variant: 'danger', confirmText: 'Give Away' })) {
            setIsReleasing(true);
            try {
                const currentProfile = familyData?.profiles?.find(p => p.id === activeProfileId);
                const ownerName = currentProfile ? currentProfile.name : character.name;
                const profileId = activeProfileId || 'default';
                const price = pet.level * 100;
                const res = await fetch(`api/sanctuary.php?action=deposit`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ profile_id: profileId, owner_name: ownerName, pet_type: pet.type, pet_level: pet.level, pet_xp: pet.xp.current, price, is_market: 1 })
                });
                const data = await res.json();
                if (data.success) actions.releasePet(pet.id);
                else toast.error(data.error || "The Sanctuary could not process this adoption.");
            } catch (e) {
                console.error("Adoption error", e);
                actions.releasePet(pet.id);
            } finally {
                setIsReleasing(false);
            }
        }
    };

    const getSkills = (charClass) => {
        const skills = {
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
            ],
            'Ranger': [
                { name: 'Twin Arrows', type: 'Physical', desc: 'Hit twice at 80% DMG each', icon: 'star', color: '#22c55e' },
                { name: 'Trap Sense', type: 'Passive', desc: '+15% loot from quests', icon: 'zap', color: '#4ade80' },
                { name: 'Nature\'s Cloak', type: 'Utility', desc: 'Reduce penalty on overdue tasks', icon: 'shield', color: '#16a34a' }
            ],
            'Barbarian': [
                { name: 'Reckless Blow', type: 'Physical', desc: 'Deal 200% DMG, take 20% recoil', icon: 'sword', color: '#dc2626' },
                { name: 'Blood Rage', type: 'Buff', desc: '+30% DMG when HP below 50%', icon: 'heart', color: '#b91c1c' },
                { name: 'Unbreakable', type: 'Passive', desc: 'Survive a killing blow once per day', icon: 'shield', color: '#991b1b' }
            ],
            'Bard': [
                { name: 'Inspiring Ballad', type: 'Buff', desc: '+10% XP to all party members', icon: 'bell', color: '#a78bfa' },
                { name: 'Discordant Note', type: 'Magic', desc: 'Reduce enemy DEF by 25%', icon: 'zap', color: '#8b5cf6' },
                { name: 'Encore', type: 'Passive', desc: 'Streak bonuses last 1 extra day', icon: 'star', color: '#c084fc' }
            ],
            'Druid': [
                { name: 'Thornwall', type: 'Defense', desc: 'Reflect 30% DMG to attackers', icon: 'shield', color: '#4ade80' },
                { name: 'Wild Growth', type: 'Magic', desc: 'Heal 20 HP + remove 1 debuff', icon: 'heart', color: '#22c55e' },
                { name: 'Symbiosis', type: 'Passive', desc: 'Pet gains +25% Bond from tasks', icon: 'star', color: '#15803d' }
            ],
            'Monk': [
                { name: 'Flurry of Blows', type: 'Physical', desc: '3 hits at 60% DMG each', icon: 'zap', color: '#f97316' },
                { name: 'Inner Peace', type: 'Passive', desc: '+15% XP from Focus sessions', icon: 'star', color: '#ea580c' },
                { name: 'Iron Body', type: 'Defense', desc: 'Reduce all damage taken by 20%', icon: 'shield', color: '#c2410c' }
            ],
            'Necromancer': [
                { name: 'Life Drain', type: 'Magic', desc: 'Deal DMG and heal for 50% dealt', icon: 'skull', color: '#7c3aed' },
                { name: 'Bone Armor', type: 'Defense', desc: 'Absorb next 3 hits', icon: 'shield', color: '#6d28d9' },
                { name: 'Raise Dead', type: 'Utility', desc: 'Recover a failed task without penalty', icon: 'zap', color: '#5b21b6' }
            ],
            'Antipaladin': [
                { name: 'Smite the Worthy', type: 'Physical', desc: 'Deal 140% DMG, ignore DEF', icon: 'sword', color: '#991b1b' },
                { name: 'Aura of Dread', type: 'Buff', desc: 'Enemy damage reduced by 15%', icon: 'skull', color: '#7f1d1d' },
                { name: 'Dark Pact', type: 'Passive', desc: '+20% Gold from hard tasks', icon: 'star', color: '#450a0a' }
            ],
            'Sorcerer': [
                { name: 'Chain Lightning', type: 'Magic', desc: 'Hit 3 targets for 70% DMG each', icon: 'zap', color: '#c084fc' },
                { name: 'Mana Shield', type: 'Defense', desc: 'Absorb DMG using MP first', icon: 'shield', color: '#a855f7' },
                { name: 'Surge', type: 'Passive', desc: 'Crit chance +10% per completed streak', icon: 'star', color: '#9333ea' }
            ],
            'Scout': [
                { name: 'Quick Shot', type: 'Physical', desc: 'Always strike first in combat', icon: 'star', color: '#06b6d4' },
                { name: 'Cartography', type: 'Passive', desc: 'Reveal hidden loot in dungeons', icon: 'book', color: '#0891b2' },
                { name: 'Evasion', type: 'Defense', desc: '30% chance to dodge any attack', icon: 'zap', color: '#0e7490' }
            ],
        };
        return skills[charClass] || [];
    };

    const xpToNext = character.xp.max - character.xp.current;
    const equippedCount = character.equipment ? Object.values(character.equipment).filter(Boolean).length : 0;

    return (
        <div className="glass-panel h-full flex flex-col rounded-2xl overflow-hidden relative min-h-[600px] border border-white/10 shadow-2xl">

            {/* ═══════ HERO BANNER ═══════ */}
            <div className="px-5 pt-5 pb-4 border-b border-white/5">
                {/* Top row: currencies + actions */}
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2.5">
                        <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-black/30">
                            <PixelIcon name="coins" size={12} color="#fbbf24" />
                            <span className="font-pixel text-base text-amber-400 leading-none">
                                <NumberTicker value={character.gold} />
                            </span>
                        </div>
                        <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-black/30">
                            <PixelIcon name="clock" size={12} color="#60a5fa" />
                            <span className="font-pixel text-base text-blue-400 leading-none">{character.timePoints}m</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => actions.toggleResting()}
                            className={`px-2.5 py-1 rounded text-[10px] font-bold uppercase tracking-wider transition-colors ${character.isResting
                                ? 'bg-indigo-500/15 text-indigo-300'
                                : 'text-gray-500 hover:text-gray-300'}`}
                            title={character.isResting ? "Leave the Inn" : "Rest at the Inn"}
                        >
                            {character.isResting ? 'Resting' : 'Inn'}
                        </button>
                        <button onClick={startEditing} className="p-1.5 text-gray-500 hover:text-white transition-colors">
                            <Edit2 size={12} />
                        </button>
                    </div>
                </div>

                {/* Avatar + Identity */}
                <div className="flex items-center gap-4">
                    <div className="relative flex-shrink-0">
                        <div className="w-20 h-20 rounded-xl overflow-hidden bg-black/30 flex items-center justify-center"
                            style={{ border: `2px solid ${theme.accent}25` }}>
                            <AvatarSpeechBubble idleTimeMs={30000}>
                                <ModernPixelAvatar
                                    type={charData.avatarType || charData.id}
                                    headOnly
                                    scale={3.5}
                                    customColors={character?.avatarColors}
                                />
                            </AvatarSpeechBubble>
                        </div>
                        <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 bg-black/90 rounded px-1.5 py-0.5 flex items-center gap-0.5 whitespace-nowrap"
                            style={{ border: `1px solid ${theme.accent}40` }}>
                            <span className="text-[8px] font-bold uppercase tracking-wider text-gray-500">Lv</span>
                            <span className="font-pixel text-sm leading-none" style={{ color: theme.accent }}>
                                <NumberTicker value={character.level} />
                            </span>
                        </div>
                    </div>

                    <div className="flex-1 min-w-0">
                        <h2 className="text-lg font-heading font-bold text-white tracking-tight truncate leading-tight">{character.name}</h2>
                        <span className="text-[10px] font-bold uppercase tracking-wide" style={{ color: theme.accent }}>
                            <PixelIcon name={theme.icon} size={9} color={theme.accent} /> {character.class}
                        </span>
                    </div>
                </div>
            </div>

            {/* ═══════ TAB BAR ═══════ */}
            <div className="px-3 flex gap-0.5 border-b border-white/5 bg-black/20">
                {[
                    { id: 'overview', label: 'Hero', icon: 'star' },
                    { id: 'gear', label: 'Gear', icon: 'sword' },
                    { id: 'companion', label: 'Bond', icon: 'heart' },
                    { id: 'journal', label: 'Ledger', icon: 'book' },
                ].map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex-1 flex flex-col items-center gap-1 py-2 border-b-2 transition-all ${activeTab === tab.id
                            ? 'border-rpg-gold/60 text-white bg-white/5'
                            : 'border-transparent text-gray-500 hover:text-gray-300 hover:bg-white/[0.03]'}`}
                    >
                        <PixelIcon name={tab.icon} size={14} />
                        <span className="text-[9px] font-bold uppercase tracking-wide">{tab.label}</span>
                    </button>
                ))}
            </div>

            {/* ═══════ TAB CONTENT ═══════ */}
            <div className="flex-grow overflow-y-auto custom-scrollbar">

                {/* ─── OVERVIEW TAB ─── */}
                {activeTab === 'overview' && (
                    <div className="p-5 space-y-5 animate-tab-in">

                        {/* Vitals + Radar side by side on desktop */}
                        <div className="flex flex-col md:flex-row items-stretch gap-4">
                            <div className="flex-1 flex items-center justify-center p-4 rounded-xl bg-black/20 border border-white/5">
                                <VitalRings xp={character.xp} hp={character.hp} level={character.level || 1} />
                            </div>
                            <div className="flex-1 min-w-0">
                                <StatsRadarChart stats={character.stats || { str: 10, int: 10, dex: 10 }} />
                            </div>
                        </div>

                        {/* 6 Attribute Tiles */}
                        <div className="grid grid-cols-3 gap-2.5">
                            {STAT_CONFIG.map((stat, idx) => {
                                const baseValue = character.baseStats?.[stat.key] || 10;
                                const totalValue = character.stats?.[stat.key] || 10;
                                const bonus = totalValue - baseValue;
                                const pct = Math.min(totalValue / 50, 1);
                                return (
                                    <div key={stat.key} className="relative p-3 pb-2 rounded-xl bg-black/30 border border-white/5 overflow-hidden"
                                        style={{ animation: `statTileIn 0.5s ease-out ${idx * 60}ms both` }}>
                                        <div className="flex flex-col items-center">
                                            <div className="flex items-center gap-1 mb-0.5">
                                                <PixelIcon name={stat.icon} size={8} color={stat.color + '80'} />
                                                <span className="text-[9px] font-bold uppercase tracking-widest" style={{ color: stat.color + '99' }}>{stat.label}</span>
                                            </div>
                                            <div className="flex items-baseline gap-0.5">
                                                <NumberTicker value={totalValue} className="text-2xl font-pixel text-white leading-none" />
                                                {bonus > 0 && <span className="text-[9px] font-bold text-green-400">+{bonus}</span>}
                                            </div>
                                            <span className="text-[7px] font-bold uppercase tracking-widest mt-0.5 opacity-40" style={{ color: stat.color }}>{stat.full}</span>
                                        </div>
                                        {/* Bottom progress track */}
                                        <div className="mt-2 h-[3px] rounded-full bg-white/5 overflow-hidden">
                                            <div className="h-full rounded-full transition-all duration-1000 ease-out"
                                                style={{ width: `${pct * 100}%`, backgroundColor: stat.color, opacity: 0.6 }} />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Equipment Quick View */}
                        <div>
                            <div className="mb-3">
                                <SectionDivider label={theme.gearLabel} icon="shield" color={theme.accent} />
                                <div className="text-right mt-1">
                                    <span className="text-xs font-pixel text-gray-500">{equippedCount}/5 equipped</span>
                                </div>
                            </div>
                            <div className="grid grid-cols-5 gap-2">
                                {[
                                    { label: 'Head', slot: EQUIPMENT_SLOTS.HEAD, icon: 'shield' },
                                    { label: 'Body', slot: EQUIPMENT_SLOTS.BODY, icon: 'shirt' },
                                    { label: 'Main', slot: EQUIPMENT_SLOTS.MAIN_HAND, icon: 'sword' },
                                    { label: 'Off', slot: EQUIPMENT_SLOTS.OFF_HAND, icon: 'shield' },
                                    { label: 'Ring', slot: EQUIPMENT_SLOTS.RING, icon: 'zap' },
                                ].map((slotInfo) => {
                                    const equippedItem = character.equipment && character.equipment[slotInfo.slot];
                                    return (
                                        <div key={slotInfo.slot} className="flex flex-col items-center gap-1">
                                            <div className={`w-full aspect-square rounded-xl border flex items-center justify-center transition-all ${equippedItem
                                                ? 'bg-white/5 border-white/15 shadow-sm'
                                                : 'bg-black/30 border-white/5'}`}
                                                title={equippedItem ? `${equippedItem.name} (${slotInfo.label})` : `${slotInfo.label} - Empty`}>
                                                {equippedItem ? (
                                                    <Sprite src={equippedItem.sprite.src} x={equippedItem.sprite.x} y={equippedItem.sprite.y} width={equippedItem.sprite.width} height={equippedItem.sprite.height} scale={1} />
                                                ) : (
                                                    <PixelIcon name={slotInfo.icon} size={16} color="#4b5563" />
                                                )}
                                            </div>
                                            <span className="text-[8px] font-bold text-gray-600 uppercase tracking-wider">{slotInfo.label}</span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Active Set Bonuses */}
                        {character.activeSets && Object.keys(character.activeSets).length > 0 && (
                            <div>
                                <div className="mb-3">
                                    <SectionDivider label="Set Resonance" icon="star" color="#a78bfa" />
                                </div>
                                <div className="space-y-1.5">
                                    {Object.entries(character.activeSets).map(([setId, count]) => {
                                        const bonuses = SET_BONUSES[setId] || [];
                                        const activeBonuses = bonuses.filter(b => count >= b.count);
                                        if (activeBonuses.length === 0) return null;
                                        return (
                                            <div key={setId} className="p-2.5 rounded-lg bg-purple-500/5 border border-purple-500/10">
                                                <div className="flex justify-between items-center mb-1">
                                                    <span className="text-[10px] font-bold text-white uppercase tracking-wider">{setId}</span>
                                                    <span className="font-pixel text-sm text-purple-400">{count} pcs</span>
                                                </div>
                                                <div className="flex flex-wrap gap-1">
                                                    {activeBonuses.map((bonus, idx) => (
                                                        <span key={idx} className="text-[9px] font-medium text-purple-300/80 bg-purple-500/10 px-1.5 py-0.5 rounded">{bonus.label}</span>
                                                    ))}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {/* Skills */}
                        <div>
                            <div className="mb-3">
                                <SectionDivider label={theme.skillsLabel} icon={theme.icon} color={theme.accent} />
                            </div>
                            <div className="space-y-2">
                                {getSkills(character.class).map((skill, idx) => {
                                    const isLocked = character.level < (idx * 3 + 1);
                                    return (
                                        <div key={idx} className={`flex items-center gap-3 p-2.5 rounded-xl border transition-all ${isLocked
                                            ? 'opacity-40 grayscale border-white/5 bg-black/20'
                                            : 'border-white/5 bg-white/[0.02] hover:bg-white/[0.04] hover:border-white/10'}`}>
                                            <div className="w-9 h-9 flex items-center justify-center bg-black/40 rounded-lg border border-white/10 shrink-0">
                                                <PixelIcon name={skill.icon} size={18} color={isLocked ? '#6b7280' : skill.color} />
                                            </div>
                                            <div className="flex-grow min-w-0">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-bold text-white text-xs truncate">{skill.name}</span>
                                                    <span className="text-[8px] px-1.5 py-0.5 rounded bg-white/5 text-gray-400 border border-white/5 uppercase font-bold tracking-wider shrink-0">{skill.type}</span>
                                                </div>
                                                <p className="text-[10px] text-gray-500 mt-0.5">{isLocked ? `Unlocks at Level ${idx * 3 + 1}` : skill.desc}</p>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                )}

                {/* ─── GEAR TAB ─── */}
                {activeTab === 'gear' && (
                    <div className="p-5 space-y-5 animate-tab-in">
                        {/* Equipment Slots (detailed) */}
                        <div>
                            <div className="mb-3">
                                <SectionDivider label={theme.gearLabel} icon="shield" color={theme.accent} />
                            </div>
                            <div className="space-y-2">
                                {[
                                    { label: 'Head', slot: EQUIPMENT_SLOTS.HEAD, icon: 'shield', color: '#64748b' },
                                    { label: 'Armor', slot: EQUIPMENT_SLOTS.BODY, icon: 'shirt', color: '#94a3b8' },
                                    { label: 'Main Hand', slot: EQUIPMENT_SLOTS.MAIN_HAND, icon: 'sword', color: '#fbbf24' },
                                    { label: 'Off Hand', slot: EQUIPMENT_SLOTS.OFF_HAND, icon: 'shield', color: '#cbd5e1' },
                                    { label: 'Ring', slot: EQUIPMENT_SLOTS.RING, icon: 'zap', color: '#fbbf24' },
                                ].map((slotInfo) => {
                                    const equippedItem = character.equipment && character.equipment[slotInfo.slot];
                                    return (
                                        <div key={slotInfo.slot} className="flex items-center gap-3 p-2.5 rounded-xl bg-black/20 border border-white/5 group hover:border-white/10 transition-all">
                                            <div className="w-10 h-10 bg-black/40 rounded-lg border border-white/10 flex items-center justify-center shrink-0">
                                                {equippedItem ? (
                                                    <Sprite src={equippedItem.sprite.src} x={equippedItem.sprite.x} y={equippedItem.sprite.y} width={equippedItem.sprite.width} height={equippedItem.sprite.height} scale={1} />
                                                ) : (
                                                    <PixelIcon name={slotInfo.icon} size={16} color={slotInfo.color} className="opacity-30" />
                                                )}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-[9px] text-gray-500 uppercase font-bold tracking-wider">{slotInfo.label}</p>
                                                <p className={`text-xs font-bold truncate ${equippedItem ? 'text-white' : 'text-gray-600 italic'}`}>
                                                    {equippedItem ? equippedItem.name : 'Empty'}
                                                </p>
                                            </div>
                                            {equippedItem && (
                                                <button onClick={() => actions.unequipItem(slotInfo.slot)}
                                                    className="px-2 py-1 text-[9px] font-bold uppercase bg-red-500/5 hover:bg-red-500/20 text-red-400/60 hover:text-red-400 rounded-lg border border-red-500/10 transition-all opacity-0 group-hover:opacity-100">
                                                    Remove
                                                </button>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Inventory */}
                        <div>
                            <div className="mb-3">
                                <SectionDivider label="Satchel" icon="box" color="#94a3b8" />
                                {inventoryGroups.length > 0 && <div className="text-right mt-1"><span className="text-gray-600 font-pixel text-sm">{inventoryGroups.length} items</span></div>}
                            </div>
                            {inventoryGroups.length > 0 ? (
                                <div className="space-y-1.5">
                                    {inventoryGroups.map((item, index) => (
                                        <div key={index} className="flex items-center gap-3 p-2 rounded-xl bg-black/20 border border-white/5 group hover:bg-white/[0.03] transition-colors">
                                            <div className="w-9 h-9 bg-black/40 rounded-lg flex items-center justify-center border border-white/10 relative shrink-0">
                                                {item.sprite ? (
                                                    <Sprite src={item.sprite.src} x={item.sprite.x} y={item.sprite.y} width={item.sprite.width} height={item.sprite.height} scale={1} />
                                                ) : (
                                                    <PixelIcon name="box" size={18} className="text-gray-500" />
                                                )}
                                                {item.count > 1 && (
                                                    <span className="absolute -top-1.5 -right-1.5 bg-rpg-gold text-black text-[8px] font-bold px-1 py-px rounded-full border border-yellow-200 shadow-sm">
                                                        x{item.count}
                                                    </span>
                                                )}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-white font-bold text-xs truncate">{item.name}</p>
                                                <p className="text-gray-500 text-[9px] truncate">{item.description}</p>
                                            </div>
                                            <div className="flex gap-1.5 shrink-0 opacity-60 group-hover:opacity-100 transition-opacity">
                                                {item.type === ITEM_TYPES.GEAR && (
                                                    <button onClick={() => handleEquip(item)}
                                                        className="px-2 py-1 rounded-lg bg-purple-500/10 hover:bg-purple-500/30 text-[9px] font-bold text-purple-300 transition-colors border border-purple-500/20">
                                                        EQUIP
                                                    </button>
                                                )}
                                                {item.type === ITEM_TYPES.CONSUMABLE && (
                                                    <button onClick={() => actions.useItem(item)}
                                                        className="px-2 py-1 rounded-lg bg-green-500/10 hover:bg-green-500/30 text-[9px] font-bold text-green-300 transition-colors border border-green-500/20">
                                                        USE
                                                    </button>
                                                )}
                                                <button onClick={() => handleSellClick(item)}
                                                    className="px-2 py-1 rounded-lg bg-white/5 hover:bg-amber-500/20 text-[9px] font-bold text-gray-400 hover:text-amber-400 transition-colors border border-white/5">
                                                    SELL
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-8 px-4 rounded-xl border border-dashed border-white/10 flex flex-col items-center justify-center gap-2">
                                    <PixelIcon name="box" size={32} className="text-gray-600" />
                                    <div>
                                        <div className="text-xs font-bold text-gray-400 uppercase tracking-widest">Empty Satchel</div>
                                        <div className="text-[10px] text-gray-600 mt-0.5">Complete quests to find loot.</div>
                                    </div>
                                    {setActiveView && (
                                        <button onClick={() => setActiveView('shop')}
                                            className="mt-1 text-[10px] font-bold uppercase tracking-widest border border-rpg-gold/30 text-rpg-gold hover:bg-rpg-gold/10 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5">
                                            <PixelIcon name="coins" size={10} color="#fbbf24" /> Visit Shop
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* ─── COMPANION TAB ─── */}
                {activeTab === 'companion' && (
                    <div className="p-5 space-y-5 animate-tab-in">
                        {character.pets && character.pets.length > 0 ? (
                            character.pets.map((pet) => (
                                <div key={pet.id} className="flex flex-col items-center bg-black/20 p-5 rounded-2xl border border-white/5 relative">
                                    <button onClick={() => confirmAdoption(pet)} disabled={isReleasing}
                                        className="absolute top-3 right-3 text-[9px] font-bold uppercase tracking-wider text-red-400/60 hover:text-red-400 bg-red-500/5 hover:bg-red-500/15 px-2 py-1 rounded-lg border border-red-500/10 transition-all disabled:opacity-50">
                                        Give Away
                                    </button>

                                    {/* Pet Visual */}
                                    <div className="w-28 h-28 bg-black/30 rounded-full border border-white/10 flex items-center justify-center relative mb-3 overflow-hidden">
                                        <ModernPixelPet type={pet.type} size={110} />
                                    </div>
                                    <h3 className="text-lg font-display font-bold text-white capitalize">{petDisplayLabel(pet.type)}</h3>
                                    <span className="px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/20 uppercase tracking-wide mt-1 mb-3 font-pixel text-base">
                                        Lvl {pet.level}
                                    </span>

                                    {/* Toggle buttons row */}
                                    <div className="flex items-center gap-2 mb-4">
                                        <button onClick={() => actions.togglePetVisibility(pet.id)}
                                            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[9px] font-bold uppercase tracking-wider transition-all border ${pet.showPet !== false
                                                ? 'bg-green-500/15 border-green-500/30 text-green-400'
                                                : 'bg-white/5 border-white/10 text-gray-500 hover:text-white'}`}>
                                            {pet.showPet !== false ? <Eye size={12} /> : <EyeOff size={12} />}
                                            {pet.showPet !== false ? 'Visible' : 'Hidden'}
                                        </button>
                                        <button onClick={() => toggleSanctuary(pet)} disabled={isReleasing}
                                            className={`px-2.5 py-1 rounded-lg text-[9px] font-bold uppercase tracking-wider transition-all disabled:opacity-50 border ${pet.inSanctuary
                                                ? 'text-amber-400 border-amber-500/30 hover:bg-amber-500/10'
                                                : 'text-gray-400 border-white/10 hover:text-emerald-400 hover:border-emerald-500/20'}`}>
                                            {isReleasing ? '...' : (pet.inSanctuary ? 'Retrieve' : 'To Sanctuary')}
                                        </button>
                                    </div>

                                    {/* Pet Stats */}
                                    <div className="w-full space-y-3">
                                        <div>
                                            <div className="flex justify-between mb-1 text-[10px] font-bold uppercase tracking-wider">
                                                <span className="text-amber-400 flex items-center gap-1"><PixelIcon name="star" size={10} color="#fbbf24" /> Exp</span>
                                                <span className="text-gray-500 font-pixel text-sm">{Math.floor(pet.xp.current)}/{pet.xp.max}</span>
                                            </div>
                                            <StatBar current={pet.xp.current} max={pet.xp.max} kind="xp" celebrateAtMax={false} />
                                        </div>
                                        <div>
                                            <div className="flex justify-between mb-1 text-[10px] font-bold uppercase tracking-wider">
                                                <span className="text-rose-400 flex items-center gap-1"><PixelIcon name="heart" size={10} color="#fb7185" /> Bond</span>
                                                <span className="text-gray-500 font-pixel text-sm">{pet.bond || 0}/{PET_BOND_MAX}</span>
                                            </div>
                                            <StatBar current={pet.bond || 0} max={PET_BOND_MAX} kind="bond" height="h-1.5" />
                                        </div>
                                        <div className="grid grid-cols-3 gap-3">
                                            {[
                                                { label: 'Hunger', value: pet.hunger, color: 'text-orange-400', kind: 'hunger' },
                                                { label: 'Happy', value: pet.happiness || 100, color: 'text-pink-400', kind: 'happy' },
                                                { label: 'Clean', value: pet.hygiene || 100, color: 'text-blue-400', kind: 'hygiene' },
                                            ].map(s => (
                                                <div key={s.label}>
                                                    <div className="flex justify-between mb-0.5 text-[9px] font-bold uppercase tracking-wider">
                                                        <span className={s.color}>{s.label}</span>
                                                        <span className={`font-pixel text-sm ${Math.floor(s.value) < 20 ? "text-red-500" : "text-gray-500"}`}>{Math.floor(s.value)}%</span>
                                                    </div>
                                                    <StatBar current={s.value} max={100} kind={s.kind} dangerBelow={20} height="h-1.5" celebrateAtMax={false} />
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Interaction Buttons */}
                                    <div className="grid grid-cols-2 gap-2 w-full mt-4">
                                        <button onClick={() => actions.playWithPet(pet.id)} disabled={pet.inSanctuary}
                                            className="flex items-center justify-center gap-1.5 py-2 rounded-xl border border-white/10 bg-white/5 text-gray-300 hover:bg-pink-500/10 hover:border-pink-500/30 hover:text-pink-400 transition-all font-bold text-[10px] uppercase tracking-wider disabled:opacity-50">
                                            <PixelIcon name="heart" size={12} color="#f472b6" /> Play
                                        </button>
                                        <button onClick={() => actions.cleanPet(pet.id)} disabled={pet.inSanctuary}
                                            className="flex items-center justify-center gap-1.5 py-2 rounded-xl border border-white/10 bg-white/5 text-gray-300 hover:bg-blue-500/10 hover:border-blue-500/30 hover:text-blue-400 transition-all font-bold text-[10px] uppercase tracking-wider disabled:opacity-50">
                                            <PixelIcon name="zap" size={12} color="#60a5fa" /> Groom
                                        </button>
                                    </div>

                                    {/* Perks + Evolution */}
                                    {(SPECIES_PERKS[pet.type] || canEvolvePet(pet)) && (
                                        <div className="w-full mt-4 p-3 rounded-xl bg-gradient-to-br from-amber-500/5 via-transparent to-rose-500/5 border border-white/10">
                                            {SPECIES_PERKS[pet.type] && (
                                                <>
                                                    <h4 className="text-[9px] font-bold text-amber-400 uppercase tracking-widest mb-1.5 flex items-center gap-1">
                                                        <PixelIcon name="star" size={9} color="#fbbf24" /> Active Perks
                                                        {pet.inSanctuary && <span className="text-[8px] text-gray-500 normal-case font-normal italic">(disabled)</span>}
                                                        {!pet.showPet && !pet.inSanctuary && <span className="text-[8px] text-gray-500 normal-case font-normal italic">(hidden)</span>}
                                                    </h4>
                                                    <div className="flex flex-wrap gap-1">
                                                        {Object.entries(SPECIES_PERKS[pet.type]).map(([key, value]) => {
                                                            const label = { xpMult: `+${Math.round(value * 100)}% XP`, goldMult: `+${Math.round(value * 100)}% Gold`, dmgMult: `+${Math.round(value * 100)}% DMG`, hardDmgMult: `+${Math.round(value * 100)}% DMG (hard)` }[key] || `${key} ${value}`;
                                                            return (
                                                                <span key={key} className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/20">
                                                                    {label}
                                                                </span>
                                                            );
                                                        })}
                                                    </div>
                                                    {(pet.bond || 0) >= 25 && (
                                                        <p className="text-[8px] text-rose-300/60 mt-1.5 italic">
                                                            Bond {pet.bond}/100 amplifies perks x{pet.bond >= 100 ? '1.5' : pet.bond >= 75 ? '1.3' : pet.bond >= 50 ? '1.15' : '1.05'}
                                                        </p>
                                                    )}
                                                </>
                                            )}
                                            {canEvolvePet(pet) && (
                                                <button onClick={() => actions.evolvePet(pet.id)}
                                                    className="w-full mt-2.5 flex items-center justify-center gap-2 py-2 rounded-xl bg-gradient-to-r from-rpg-gold to-amber-400 text-rpg-bg hover:brightness-110 font-heading font-bold text-xs uppercase tracking-widest">
                                                    <PixelIcon name="zap" size={14} color="#1a102e" />
                                                    Evolve into {EVOLUTIONS[pet.type].label}
                                                </button>
                                            )}
                                        </div>
                                    )}

                                    {/* Feed Section */}
                                    <div className="w-full mt-4">
                                        <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 border-b border-white/5 pb-1.5">Pantry</h4>
                                        {pet.inSanctuary ? (
                                            <div className="bg-black/30 border border-emerald-500/15 rounded-xl p-3 text-center">
                                                <p className="text-emerald-400/80 text-xs font-bold uppercase tracking-widest mb-0.5">Resting at Sanctuary</p>
                                                <p className="text-gray-600 text-[9px]">Bring them back to resume feeding.</p>
                                            </div>
                                        ) : (
                                            <div className="space-y-1.5">
                                                {character.inventory && character.inventory.filter(i => i.type === ITEM_TYPES.PET_FOOD).length > 0 ? (
                                                    character.inventory.filter(i => i.type === ITEM_TYPES.PET_FOOD).map((food, idx) => (
                                                        <div key={idx} className="flex items-center gap-3 p-2 rounded-xl bg-black/20 border border-white/5 group hover:border-rpg-gold/20 transition-all">
                                                            <div className="w-8 h-8 bg-black/40 rounded-lg border border-white/10 flex items-center justify-center shrink-0">
                                                                <Sprite src={food.sprite.src} x={food.sprite.x} y={food.sprite.y} width={food.sprite.width} height={food.sprite.height} scale={1} />
                                                            </div>
                                                            <div className="flex-1 min-w-0">
                                                                <p className="text-white font-bold text-xs truncate">{food.name}</p>
                                                                <p className="text-gray-600 text-[9px] truncate">{food.description}</p>
                                                            </div>
                                                            <button onClick={() => actions.feedPet(pet.id, food)}
                                                                className="px-2.5 py-1 rounded-lg bg-green-500/15 hover:bg-green-500/30 text-[9px] font-bold text-green-400 transition-all border border-green-500/20 shrink-0">
                                                                FEED
                                                            </button>
                                                        </div>
                                                    ))
                                                ) : (
                                                    <p className="text-center text-[10px] text-gray-600 italic py-3 bg-black/20 rounded-xl border border-white/5">No pet food. Visit the Market!</p>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="text-center py-12">
                                <PixelIcon name="heart" size={40} className="mx-auto text-gray-700 mb-2" />
                                <p className="text-gray-500 text-sm">No companion yet.</p>
                            </div>
                        )}
                    </div>
                )}

                {/* ─── JOURNAL TAB (Progress + Medals) ─── */}
                {activeTab === 'journal' && (
                    <div className="p-5 space-y-5 animate-tab-in">
                        <DailyProgressChart />

                        {/* Hero Title + Chronicle Narrative */}
                        <div className="p-4 rounded-xl bg-black/20 border border-white/5">
                            <div className="text-center mb-2">
                                <span className="text-xs font-heading font-bold uppercase tracking-[0.2em]" style={{ color: theme.accent }}>
                                    {getHeroTitle(character.level, character.achievements?.tasks || 0, character.class)}
                                </span>
                            </div>
                            <p className="text-[10px] text-gray-400 text-center italic leading-relaxed">
                                "{getChronicleQuip(character.achievements?.tasks || 0, character.achievements?.habits || 0, character.achievements?.goldEarned || 0)}"
                            </p>
                        </div>

                        {/* Lifetime Stats */}
                        <div>
                            <div className="mb-3">
                                <SectionDivider label="Chronicle" icon="trophy" color="#94a3b8" />
                            </div>
                            <div className="grid grid-cols-3 gap-2">
                                {[
                                    { label: 'Quests Slain', value: character.achievements?.tasks || 0, color: 'text-white', icon: 'sword' },
                                    { label: 'Habits Forged', value: character.achievements?.habits || 0, color: 'text-white', icon: 'checkSquare' },
                                    { label: 'Gold Earned', value: character.achievements?.goldEarned || 0, color: 'text-rpg-gold', icon: 'coins' },
                                ].map(a => (
                                    <div key={a.label} className="bg-black/30 p-2.5 rounded-xl border border-white/5 text-center relative overflow-hidden">
                                        <div className="absolute -bottom-1 -right-1 opacity-[0.04] pointer-events-none">
                                            <PixelIcon name={a.icon} size={28} color="#fff" />
                                        </div>
                                        <div className={`text-xl font-pixel ${a.color} relative z-10`}><NumberTicker value={a.value} /></div>
                                        <div className="text-[7px] font-bold text-gray-500 uppercase tracking-widest relative z-10">{a.label}</div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Medals Grid */}
                        <div>
                            <div className="mb-3">
                                <SectionDivider label="Honors" icon="trophy" color="#fbbf24" />
                            </div>
                            <div className="grid grid-cols-3 gap-2">
                                {BADGE_DEFS.map(badge => {
                                    const isUnlocked = character.unlockedBadges?.includes(badge.id);
                                    const tier = TIER_COLORS[badge.tier] || TIER_COLORS.bronze;
                                    return (
                                        <div key={badge.id} className={`p-3 rounded-xl flex flex-col items-center text-center transition-all ${isUnlocked
                                            ? `bg-black/20 ${tier.border}/20 border`
                                            : 'bg-black/20 border border-white/5 opacity-40 grayscale'}`}
                                            style={isUnlocked ? { borderColor: badge.tier === 'gold' ? '#fbbf2430' : badge.tier === 'silver' ? '#94a3b830' : '#b4541430' } : undefined}>
                                            <div className="w-9 h-9 mb-1.5">
                                                {isUnlocked ? (
                                                    <div className={`w-full h-full bg-gradient-to-br ${tier.bg} rounded-full flex items-center justify-center border ${tier.border}`}>
                                                        <PixelIcon name={badge.icon || 'star'} size={14} color="#000" />
                                                    </div>
                                                ) : (
                                                    <div className="w-full h-full bg-gray-800/80 rounded-full flex items-center justify-center border border-gray-700">
                                                        <PixelIcon name="lock" size={12} color="#6b7280" />
                                                    </div>
                                                )}
                                            </div>
                                            <h4 className={`text-[9px] font-bold uppercase tracking-wider mb-0.5 ${isUnlocked ? tier.text : 'text-gray-500'}`}>{badge.name}</h4>
                                            <p className="text-[8px] text-gray-500 leading-tight">{badge.desc}</p>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* ═══════ SELL MODAL ═══════ */}
            {isSellModalOpen && itemToSell && (
                <div className="absolute inset-0 z-50 rounded-2xl bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
                    <div className="glass-panel max-w-sm w-full p-6 border border-rpg-gold/30">
                        <h3 className="text-xl font-heading font-bold text-rpg-gold text-center mb-1">Sell {itemToSell.name}</h3>
                        <p className="text-gray-400 text-xs text-center mb-6">Choose how to part with this item.</p>
                        <div className="space-y-4">
                            <div className="bg-black/40 border border-white/10 rounded-xl p-4 flex flex-col gap-2">
                                <div className="flex justify-between items-center">
                                    <span className="text-sm font-bold text-gray-300">Quick Sell</span>
                                    <span className="text-amber-400 font-pixel text-lg flex items-center gap-1"><PixelIcon name="coins" size={14} color="#fbbf24" /> +{Math.floor(itemToSell.cost * 0.5)}</span>
                                </div>
                                <p className="text-[10px] text-gray-500">Instantly sell for 50% base value.</p>
                                <button onClick={confirmQuickSell} className="w-full mt-2 py-2 bg-white/5 hover:bg-white/10 text-white rounded-lg text-xs font-bold transition-colors">Quick Sell</button>
                            </div>
                            <div className="text-center text-xs text-gray-600 font-bold uppercase">OR</div>
                            <div className="bg-indigo-900/20 border border-indigo-500/30 rounded-xl p-4 flex flex-col gap-3">
                                <span className="text-sm font-bold text-indigo-300">List on Market</span>
                                <p className="text-[10px] text-gray-400">Set a price. Gold arrives when someone buys.</p>
                                <div>
                                    <label className="text-[10px] text-indigo-400 font-bold uppercase tracking-wider mb-1 block">Price (Gold)</label>
                                    <input type="number" value={sellPrice} onChange={(e) => setSellPrice(e.target.value)}
                                        className="w-full bg-black/60 border border-indigo-500/30 rounded-lg p-2 text-white text-sm outline-none focus:border-indigo-400" min="1" />
                                </div>
                                <button onClick={confirmMarketListing} disabled={isListing || !sellPrice}
                                    className="w-full mt-1 py-2 bg-indigo-600/20 hover:bg-indigo-600 text-indigo-300 hover:text-white border border-indigo-500/50 rounded-lg text-xs font-bold transition-all disabled:opacity-50">
                                    {isListing ? 'Listing...' : 'Publish to Market'}
                                </button>
                            </div>
                        </div>
                        <button onClick={() => { setIsSellModalOpen(false); setItemToSell(null); }}
                            className="w-full mt-6 py-2 text-gray-500 hover:text-white text-xs font-bold uppercase tracking-wider transition-colors">Cancel</button>
                    </div>
                </div>
            )}

            {/* ═══════ AVATAR EDIT MODAL ═══════ */}
            {isEditModalOpen && (
                <AvatarEditModal character={character} onSave={handleSaveAvatar} onClose={() => setIsEditModalOpen(false)} />
            )}
        </div>
    );
};

const AvatarEditModal = ({ character, onSave, onClose }) => {
    const [selectedCharId, setSelectedCharId] = useState(character.avatarId);
    const [colors, setColors] = useState(character.avatarColors || { skin: '#ffdbac', hair: '#78350f', primary: '#e2e8f0' });
    const editCost = 500;
    const canAfford = character.gold >= editCost;

    const handleSave = () => {
        if (canAfford) onSave(selectedCharId, colors, editCost);
    };

    return (
        <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-300">
            <div className="glass-panel max-w-4xl w-full max-h-[90vh] overflow-y-auto p-8 border-rpg-gold/20 relative">
                <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"><X size={24} /></button>
                <h2 className="text-3xl font-heading font-bold text-rpg-gold text-center mb-8 tracking-widest uppercase">HERO REDESIGN</h2>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div className="grid grid-cols-3 gap-3 overflow-y-auto max-h-[400px] pr-2 custom-scrollbar">
                        {CHARACTERS.map(c => (
                            <div key={c.id} onClick={() => {
                                setSelectedCharId(c.id);
                                if (c.avatarType === 'mage') setColors({ ...colors, primary: '#818cf8' });
                                else if (c.avatarType === 'rogue') setColors({ ...colors, primary: '#94a3b8' });
                                else setColors({ ...colors, primary: '#e2e8f0' });
                            }}
                                className={`p-3 rounded-xl border-2 transition-all cursor-pointer flex flex-col items-center gap-2 ${selectedCharId === c.id ? 'border-rpg-gold bg-white/5 shadow-glow-gold' : 'border-white/5 hover:border-white/20'}`}>
                                <div className="scale-125 pb-2">
                                    <ModernPixelAvatar type={c.avatarType} scale={2} headOnly={true} customColors={selectedCharId === c.id ? colors : undefined} />
                                </div>
                                <span className={`text-[10px] font-bold uppercase transition-colors ${selectedCharId === c.id ? 'text-rpg-gold' : 'text-gray-400'}`}>{c.name}</span>
                            </div>
                        ))}
                    </div>
                    <div className="space-y-6">
                        <div className="flex justify-center p-8 bg-black/40 rounded-2xl border border-white/5 relative group">
                            <ModernPixelAvatar type={CHARACTERS.find(c => c.id === selectedCharId)?.avatarType || 'warrior'} scale={4} customColors={colors} />
                        </div>
                        <div className="grid grid-cols-1 gap-4">
                            {[{ label: 'Skin', key: 'skin' }, { label: 'Hair', key: 'hair' }, { label: 'Outfit', key: 'primary' }].map(item => (
                                <div key={item.key} className="flex items-center justify-between bg-black/40 p-3 rounded-xl border border-white/5">
                                    <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">{item.label} Color</label>
                                    <input type="color" value={colors[item.key]} onChange={(e) => setColors({ ...colors, [item.key]: e.target.value })} className="w-10 h-10 rounded cursor-pointer border-none bg-transparent" />
                                </div>
                            ))}
                        </div>
                        <div className="pt-6 border-t border-white/10 flex flex-col gap-4">
                            <div className="flex justify-between items-center px-2">
                                <span className="text-gray-400 text-sm">Transformation Fee:</span>
                                <span className={`font-bold flex items-center gap-1 ${canAfford ? 'text-rpg-gold font-pixel text-xl' : 'text-red-500 font-pixel text-xl'}`}>
                                    <PixelIcon name="coins" size={14} color={canAfford ? "#fbbf24" : "#ef4444"} /> {editCost} Gold
                                </span>
                            </div>
                            <PressButton onClick={handleSave} disabled={!canAfford} className="w-full py-4 bg-rpg-gold text-rpg-bg rounded-xl font-bold uppercase tracking-widest shadow-glow-gold disabled:opacity-50">
                                Mutate Appearance
                            </PressButton>
                            {!canAfford && <p className="text-red-500 text-[10px] text-center font-bold italic">Not enough gold for this transformation.</p>}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CharacterSheet;
