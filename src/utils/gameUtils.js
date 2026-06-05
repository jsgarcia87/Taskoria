/*
 * Taskoria Game Utilities
 * Shared constants and logic for RPG calculations.
 */

export const TASK_DIFFICULTY = {
    NORMAL: 1,
    HARD: 3
};

export const BADGE_DEFS = [
    { id: 'tasks_10', name: 'Novice Slayer', desc: 'Complete 10 Quests' },
    { id: 'tasks_50', name: 'Master Slayer', desc: 'Complete 50 Quests' },
    { id: 'tasks_100', name: 'Legendary Slayer', desc: 'Complete 100 Quests' },
    { id: 'habits_10', name: 'Disciplined', desc: 'Complete 10 Habits' },
    { id: 'habits_50', name: 'Iron Will', desc: 'Complete 50 Habits' },
    { id: 'gold_1000', name: 'Wealthy Merchant', desc: 'Earn 1000 Gold' },
    { id: 'gold_5000', name: 'Dragon Hoard', desc: 'Earn 5000 Gold' },
    { id: 'level_10', name: 'Seasoned Hero', desc: 'Reach Level 10' },
    { id: 'level_30', name: 'Realm Champion', desc: 'Reach Level 30' },
];

export const calculateMaxHp = (con, level) => {
    return 100 + (con * 10) + (level * 5);
};

export const calculateXpReq = (level) => {
    return Math.floor(80 * Math.pow(level, 1.5)) + (level * 40);
};

// Single source of truth for class-driven mechanics.
// `levelStats`: stat increments granted on every level up.
// `combatStats`: array of stat keys averaged to produce the damage modifier in COMPLETE_TASK.
export const CLASS_CONFIG = {
    Fighter:     { levelStats: { str: 2, con: 1 },             combatStats: ['str'] },
    Paladin:     { levelStats: { str: 1, con: 1, will: 1 },    combatStats: ['str', 'will'] },
    Wizard:      { levelStats: { int: 2, will: 1 },            combatStats: ['int'] },
    Rogue:       { levelStats: { dex: 2, cha: 1 },             combatStats: ['dex'] },
    Cleric:      { levelStats: { will: 2, cha: 1 },            combatStats: ['will', 'cha'] },
    Ranger:      { levelStats: { dex: 1, con: 1, will: 1 },    combatStats: ['dex'] },
    Barbarian:   { levelStats: { str: 2, con: 2 },             combatStats: ['str'] },
    Bard:        { levelStats: { cha: 2, int: 1 },             combatStats: ['cha'] },
    Druid:       { levelStats: { will: 2, con: 1 },            combatStats: ['will'] },
    Monk:        { levelStats: { dex: 1, will: 1, con: 1 },    combatStats: ['dex', 'will'] },
    Necromancer: { levelStats: { int: 2, cha: 1 },             combatStats: ['int'] },
    Antipaladin: { levelStats: { str: 1, cha: 1, will: 1 },    combatStats: ['str', 'cha'] },
    Sorcerer:    { levelStats: { cha: 2, will: 1 },            combatStats: ['cha'] },
    Scout:       { levelStats: { dex: 2, int: 1 },             combatStats: ['dex'] },
};

const DEFAULT_CLASS = { levelStats: { str: 1, int: 1, dex: 1 }, combatStats: ['str'] };

export const getClassConfig = (charClass) => CLASS_CONFIG[charClass] || DEFAULT_CLASS;

// Damage modifier for the COMPLETE_TASK roll, derived from class combat stats.
export const getCombatModifier = (charClass, effStats) => {
    const keys = getClassConfig(charClass).combatStats;
    if (!keys.length) return 0;
    const sum = keys.reduce((acc, k) => acc + (effStats[k] || 0), 0);
    return Math.floor(sum / keys.length);
};

export const rollD20 = () => Math.floor(Math.random() * 20) + 1;

export const recordActivity = (char, type = 'task', value = 1) => {
    if (!char) return {};
    const today = new Date().toLocaleDateString('en-CA');
    const history = char.activityHistory || {};
    const current = typeof history[today] === 'object' ? { ...history[today] } : { tasks: (history[today] || 0), minutes: 0 };
    
    if (type === 'task') current.tasks = (current.tasks || 0) + value;
    if (type === 'minutes') current.minutes = (current.minutes || 0) + value;
    
    return {
        ...history,
        [today]: current
    };
};

export const calculateUpdatedStats = (baseStats, equipment, currentHpObj, level, SET_BONUSES) => {
    let newStats = { ...baseStats };
    let goldBonus = 0;
    let xpBonus = 0;
    let multipliers = { str: 1, int: 1, dex: 1, con: 1, cha: 1, will: 1 };

    Object.values(equipment).forEach(item => {
        if (item && item.stats) {
            Object.keys(item.stats).forEach(statKey => {
                newStats[statKey] = (newStats[statKey] || 0) + item.stats[statKey];
            });
        }
        if (item && item.bonuses) {
            if (item.bonuses.gold) goldBonus += item.bonuses.gold;
            if (item.bonuses.xp) xpBonus += item.bonuses.xp;
        }
    });

    const activeSets = {};
    Object.values(equipment).forEach(item => {
        if (item && item.setId) {
            activeSets[item.setId] = (activeSets[item.setId] || 0) + 1;
        }
    });

    Object.keys(activeSets).forEach(setId => {
        const count = activeSets[setId];
        const bonuses = SET_BONUSES[setId] || [];
        bonuses.forEach(bonus => {
            if (count >= bonus.count) {
                if (bonus.stats) {
                    Object.keys(bonus.stats).forEach(statKey => {
                        if (bonus.stats.isMultiplier) {
                            multipliers[statKey] *= bonus.stats[statKey];
                        } else {
                            newStats[statKey] = (newStats[statKey] || 0) + bonus.stats[statKey];
                        }
                    });
                }
                if (bonus.bonuses) {
                    if (bonus.bonuses.gold) goldBonus += bonus.bonuses.gold;
                    if (bonus.bonuses.xp) xpBonus += bonus.bonuses.xp;
                }
            }
        });
    });

    Object.keys(multipliers).forEach(statKey => {
        newStats[statKey] = Math.floor(newStats[statKey] * multipliers[statKey]);
    });

    const previousMaxHp = currentHpObj.max;
    const newMaxHp = calculateMaxHp(newStats.con || 10, level);
    
    return { 
        stats: newStats, 
        hp: { 
            ...currentHpObj, 
            max: newMaxHp,
            current: Math.min(newMaxHp, (currentHpObj.current / previousMaxHp) * newMaxHp)
        },
        bonuses: { gold: goldBonus, xp: xpBonus },
        activeSets
    };
};

export const getEffectiveStats = (character) => {
    if (!character) return { str: 0, int: 0, dex: 0, con: 0, cha: 0, will: 0 };
    const baseStats = character.stats || { str: 10, int: 10, dex: 10, con: 10, cha: 10, will: 10 };
    const effStats = { ...baseStats };

    if (character.equipment) {
        Object.values(character.equipment).forEach(item => {
            if (item && item.stats) {
                Object.keys(item.stats).forEach(stat => {
                    effStats[stat] = (effStats[stat] || 0) + item.stats[stat];
                });
            }
        });
    }
    return effStats;
};

export const processRewardsAndLevelUp = (character, xpGain, goldGain, timeGain = 0) => {
    if (!character) return null;

    // Apply equipment XP bonus (percentage) before anything else.
    const xpBonusPct = character.bonuses?.xp || 0;
    const adjustedXpGain = Math.floor((xpGain || 0) * (1 + xpBonusPct / 100));

    const startingLevel = character.level;
    const startingMaxXp = character.xp.max || calculateXpReq(startingLevel);
    let newXp = (character.xp.current || 0) + adjustedXpGain;
    let newLevel = startingLevel;
    let currentMaxXp = startingMaxXp;

    // Clone stats/baseStats so we never mutate the previous character.
    let newStats = { ...character.stats };
    let newBaseStats = { ...character.baseStats };

    const classCfg = getClassConfig(character.class);

    while (newXp >= currentMaxXp) {
        newXp -= currentMaxXp;
        newLevel += 1;
        currentMaxXp = calculateXpReq(newLevel);

        Object.entries(classCfg.levelStats).forEach(([stat, inc]) => {
            newStats[stat] = (newStats[stat] || 0) + inc;
            newBaseStats[stat] = (newBaseStats[stat] || 0) + inc;
        });
    }

    const levelUp = newLevel > startingLevel;

    const newChar = {
        ...character,
        gold: (character.gold || 0) + goldGain,
        timePoints: (character.timePoints || 0) + timeGain,
        xp: { current: newXp, max: currentMaxXp },
    };

    if (levelUp) {
        newChar.level = newLevel;
        newChar.stats = newStats;
        newChar.baseStats = newBaseStats;
        const newMaxHp = calculateMaxHp(newStats.con || 10, newLevel);
        newChar.hp = { max: newMaxHp, current: newMaxHp };
    }

    return { newChar, levelUp, xpGained: adjustedXpGain, levelsGained: newLevel - startingLevel };
};

export const checkBadges = (character) => {
    if (!character || !character.achievements) return { newChar: character, newBadges: [] };

    let stats = character.achievements;
    let unlocked = [...(character.unlockedBadges || [])];
    let newBadges = [];

    const checks = {
        'tasks_10': () => stats.tasks >= 10,
        'tasks_50': () => stats.tasks >= 50,
        'tasks_100': () => stats.tasks >= 100,
        'habits_10': () => stats.habits >= 10,
        'habits_50': () => stats.habits >= 50,
        'gold_1000': () => stats.goldEarned >= 1000,
        'gold_5000': () => stats.goldEarned >= 5000,
        'level_10': () => character.level >= 10,
        'level_30': () => character.level >= 30,
    };

    BADGE_DEFS.forEach(badge => {
        if (!unlocked.includes(badge.id) && checks[badge.id]()) {
            unlocked.push(badge.id);
            newBadges.push(badge);
        }
    });

    return {
        newChar: { ...character, unlockedBadges: unlocked },
        newBadges
    };
};
