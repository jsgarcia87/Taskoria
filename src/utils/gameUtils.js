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
    return Math.floor(100 * Math.pow(level, 1.8)) + (level * 50);
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
    let newXp = character.xp.current + xpGain;
    let charClass = character.class;
    let stats = character.stats;

    let newChar = {
        ...character,
        gold: character.gold + goldGain,
        timePoints: (character.timePoints || 0) + timeGain,
    };

    let levelUp = false;
    let newLevel = character.level;
    let newStats = { ...stats };
    let currentMaxXp = character.xp.max;

    while (newXp >= currentMaxXp) {
        levelUp = true;
        newXp -= currentMaxXp;
        newLevel += 1;
        currentMaxXp = calculateXpReq(newLevel);

        if (charClass === 'Fighter') { newStats.str += 2; newStats.con += 1; }
        else if (charClass === 'Wizard') { newStats.int += 2; newStats.will += 1; }
        else if (charClass === 'Rogue') { newStats.dex += 2; newStats.cha += 1; }
        else if (charClass === 'Cleric') { newStats.will += 2; newStats.cha += 1; }
        else if (charClass === 'Paladin') { newStats.str += 1; newStats.con += 1; newStats.will += 1; }
        else { newStats.str += 1; newStats.int += 1; newStats.dex += 1; }
    }

    if (levelUp) {
        newChar.level = newLevel;
        newChar.stats = newStats;
        newChar.xp = { current: newXp, max: currentMaxXp };
        let newMaxHp = calculateMaxHp(newStats.con || 10, newLevel);
        newChar.hp = { max: newMaxHp, current: newMaxHp };
    } else {
        newChar.xp = { ...character.xp, current: newXp };
    }

    return { newChar, levelUp };
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
