/*
 * Taskoria Game Utilities
 * Shared constants and logic for RPG calculations.
 */

export const TASK_DIFFICULTY = {
    NORMAL: 1,
    HARD: 3
};

// Each badge has: id (stable), name, desc, tier (bronze|silver|gold), icon (PixelIcon name)
export const BADGE_DEFS = [
    // ─── Quests / Tasks ───
    { id: 'tasks_10',   name: 'Novice Slayer',     desc: 'Complete 10 Quests',  tier: 'bronze', icon: 'sword' },
    { id: 'tasks_50',   name: 'Master Slayer',     desc: 'Complete 50 Quests',  tier: 'silver', icon: 'sword' },
    { id: 'tasks_100',  name: 'Legendary Slayer',  desc: 'Complete 100 Quests', tier: 'gold',   icon: 'sword' },
    { id: 'hard_tasks_10', name: 'Hard Hitter',    desc: 'Slay 10 hard quests', tier: 'silver', icon: 'sword' },

    // ─── Habits ───
    { id: 'habits_10',  name: 'Disciplined',       desc: 'Complete 10 Habits',  tier: 'bronze', icon: 'checkSquare' },
    { id: 'habits_50',  name: 'Iron Will',         desc: 'Complete 50 Habits',  tier: 'silver', icon: 'checkSquare' },
    { id: 'habits_200', name: 'Habit Master',      desc: 'Complete 200 Habits', tier: 'gold',   icon: 'checkSquare' },

    // ─── Wealth ───
    { id: 'gold_1000',  name: 'Wealthy Merchant',  desc: 'Earn 1000 Gold',      tier: 'bronze', icon: 'coins' },
    { id: 'gold_5000',  name: 'Dragon Hoard',      desc: 'Earn 5000 Gold',      tier: 'silver', icon: 'coins' },
    { id: 'gold_25000', name: 'King of Coin',      desc: 'Earn 25k Gold',       tier: 'gold',   icon: 'coins' },

    // ─── Progression ───
    { id: 'level_10',   name: 'Seasoned Hero',     desc: 'Reach Level 10',      tier: 'silver', icon: 'trophy' },
    { id: 'level_30',   name: 'Realm Champion',    desc: 'Reach Level 30',      tier: 'gold',   icon: 'trophy' },

    // ─── Focus / Pomodoro ───
    { id: 'pomodoro_10',  name: 'Focused',         desc: 'Run 10 Pomodoro sessions', tier: 'bronze', icon: 'clock' },
    { id: 'pomodoro_50',  name: 'Deep Worker',     desc: 'Run 50 Pomodoro sessions', tier: 'silver', icon: 'clock' },
    { id: 'pomodoro_200', name: 'Time Sage',       desc: 'Run 200 Pomodoro sessions', tier: 'gold',  icon: 'clock' },
    { id: 'focus_minutes_500',  name: 'Half-day Hero', desc: '500 min total focus', tier: 'silver', icon: 'clock' },
    { id: 'focus_minutes_2000', name: 'Marathon Mind', desc: '2000 min total focus', tier: 'gold', icon: 'clock' },

    // ─── Social / Community ───
    { id: 'login_streak_7',   name: 'Week Warrior',  desc: '7-day login streak',  tier: 'bronze', icon: 'bell' },
    { id: 'login_streak_30',  name: 'Faithful',      desc: '30-day login streak', tier: 'silver', icon: 'bell' },
    { id: 'login_streak_100', name: 'Devoted',       desc: '100-day login streak', tier: 'gold',  icon: 'bell' },

    // ─── Collection ───
    { id: 'pets_1',  name: 'Pet Friend',           desc: 'Adopt your first pet', tier: 'bronze', icon: 'heart' },
    { id: 'pets_5',  name: 'Beast Master',          desc: 'Adopt 5 pets',        tier: 'silver', icon: 'heart' },
    { id: 'items_25', name: 'Collector',            desc: 'Own 25 items at once', tier: 'silver', icon: 'box' },
    { id: 'items_50', name: 'Vault Keeper',         desc: 'Own 50 items at once', tier: 'gold',   icon: 'box' },

    // ─── Daily missions ───
    { id: 'missions_all_5',  name: 'Disciplined Day', desc: 'Complete all daily missions 5 times', tier: 'silver', icon: 'star' },
];

export const calculateMaxHp = (con, level) => {
    return 100 + (con * 10) + (level * 5);
};

export const calculateXpReq = (level) => {
    return Math.floor(80 * Math.pow(level, 1.5)) + (level * 40);
};

/**
 * Bumps every daily mission of a matching `kind` by `amount`. Pure: returns a
 * new array (or the same array if no missions exist). Mission progress is
 * capped at its target so the UI never shows 4/3.
 */
export const bumpDailyMissions = (missions, kind, amount = 1) => {
    if (!Array.isArray(missions) || missions.length === 0) return missions;
    let changed = false;
    const next = missions.map(m => {
        if (m.kind !== kind || m.claimed) return m;
        const newProgress = Math.min(m.target, (m.progress || 0) + amount);
        if (newProgress === m.progress) return m;
        changed = true;
        return { ...m, progress: newProgress };
    });
    return changed ? next : missions;
};

// ─── PET SYSTEM HELPERS ──────────────────────────────────────────────────
// Centralised so taskReducer / battleReducer / characterReducer agree.

// Pet decay rates per hour. Halved from the original (4/2/1.5) so casual
// players don't return to a starved pet after 24h away.
export const PET_DECAY = { hunger: 2, happiness: 1, hygiene: 0.75 };

// Cooldowns (ms) between interactions — prevent button-spam to farm bond/XP.
export const PET_COOLDOWNS = {
    play:  30 * 60 * 1000,   // 30 min
    clean: 60 * 60 * 1000,   // 1 h
};

// Pet level cap — used to be 30. Raised so end-game progression continues.
export const PET_LEVEL_CAP = 50;

// Bond stat caps + the gain per qualifying interaction.
export const PET_BOND_MAX = 100;
export const PET_BOND_GAIN = { feed: 1, play: 2, clean: 1 };

// ─── Species perks (passive, only when showPet=true & not in sanctuary) ───
// Multipliers ADD up across active pets, so a player with multiple companions
// gets the union of their effects. Bond tier amplifies the magnitudes.
//
//   bond >= 25 → ×1.05    >= 50 → ×1.15    >= 75 → ×1.30    >= 100 → ×1.50
//
// Keys:
//   xpMult       → +N% XP on every reward grant
//   goldMult     → +N% gold on every reward grant
//   dmgMult      → +N% damage on COMPLETE_TASK rolls
//   hardDmgMult  → extra +N% damage on hard (difficulty 3) tasks
export const SPECIES_PERKS = {
    slime:        { xpMult: 0.05 },                            // companion's cheerful aura
    phoenix:      { xpMult: 0.03, goldMult: 0.03 },             // balanced rebirth bird
    wolf:         { dmgMult: 0.05 },                            // pack hunter
    wolf_arctic:  { dmgMult: 0.10 },                            // evolved alpha
    dragon:       { goldMult: 0.10 },                           // hoards treasure
    dragon_fire:  { goldMult: 0.05, hardDmgMult: 0.15 },        // burns hard quests
    dragon_frost: { goldMult: 0.10, xpMult: 0.03 },             // wise + greedy
    lion:         { goldMult: 0.05, xpMult: 0.02 },             // pride leader
    lion_desert:  { goldMult: 0.10, xpMult: 0.03 },             // evolved survivor
};

// Evolution chains — pets evolve automatically by player-triggered action
// once they hit the required level. Only chains whose target sprites exist
// in pet_blueprints.json are listed (no orphans).
export const EVOLUTIONS = {
    wolf:   { level: 10, evolveTo: 'wolf_arctic',  label: 'Arctic Alpha' },
    lion:   { level: 10, evolveTo: 'lion_desert',  label: 'Desert King'  },
    dragon: { level: 10, evolveTo: 'dragon_fire',  label: 'Fire Wyrm'    },
};

const bondMultiplier = (bond) => {
    if (bond >= 100) return 1.5;
    if (bond >= 75)  return 1.3;
    if (bond >= 50)  return 1.15;
    if (bond >= 25)  return 1.05;
    return 1.0;
};

/**
 * Aggregate passive perks from all currently-active (visible, not sanctuary)
 * pets. Returns a flat object reducers can read. Stable shape — zeros for any
 * key a pet doesn't grant.
 */
export const getPetPerks = (character) => {
    const acc = { xpMult: 0, goldMult: 0, dmgMult: 0, hardDmgMult: 0 };
    const pets = character?.pets;
    if (!Array.isArray(pets) || pets.length === 0) return acc;
    for (const p of pets) {
        if (!p || p.showPet === false || p.inSanctuary) continue;
        const base = SPECIES_PERKS[p.type];
        if (!base) continue;
        const mult = bondMultiplier(p.bond || 0);
        if (base.xpMult)      acc.xpMult      += base.xpMult      * mult;
        if (base.goldMult)    acc.goldMult    += base.goldMult    * mult;
        if (base.dmgMult)     acc.dmgMult     += base.dmgMult     * mult;
        if (base.hardDmgMult) acc.hardDmgMult += base.hardDmgMult * mult;
    }
    return acc;
};

/** True if a pet has hit the level required to evolve (and has a chain). */
export const canEvolvePet = (pet) => {
    if (!pet) return false;
    const chain = EVOLUTIONS[pet.type];
    return !!chain && pet.level >= chain.level;
};

// Pet mood multiplier applied to player XP rewards. Picks the BEST mood among
// all currently-visible (showPet) non-sanctuary pets so adopting more pets is
// strictly positive; sad pets only penalise if they're your only one.
//   happiness >= 80  → +5% XP
//   happiness <  25  → -5% XP
//   otherwise        → no change
export const getPetMoodBonus = (character) => {
    const pets = character?.pets;
    if (!Array.isArray(pets) || pets.length === 0) return 1;
    const active = pets.filter(p => p && p.showPet !== false && !p.inSanctuary);
    if (active.length === 0) return 1;
    let bonus = 1;
    let anySad = true;
    for (const p of active) {
        const h = p.happiness ?? 100;
        if (h >= 80) { bonus = Math.max(bonus, 1.05); anySad = false; break; }
        if (h >= 25) { anySad = false; bonus = Math.max(bonus, 1.0); }
    }
    if (anySad) bonus = 0.95;
    return bonus;
};

/**
 * Stat multiplier for rewards (XP / gold / etc.).
 * Returns `1 + ratio × stat`, hard-capped at `1 + maxBonus` to keep
 * end-game characters from snowballing past 2× rewards.
 * Used by every reducer that grants rewards so the cap is consistent.
 *
 * Default: 2% per stat point, capped at +50% bonus (= reached at stat 25).
 */
export const getStatBonus = (stat, ratio = 0.02, maxBonus = 0.5) => {
    const raw = Math.max(0, (stat || 0) * ratio);
    return 1 + Math.min(maxBonus, raw);
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

    // All counters live on character.achievements so reducers feed this with
    // a single source of truth. New triggers must bump the matching counter
    // (see taskReducer / battleReducer / characterReducer).
    const totalItems = (character.inventory?.length || 0)
        + Object.values(character.equipment || {}).filter(Boolean).length;
    const checks = {
        // Quests / Tasks
        'tasks_10':       () => stats.tasks >= 10,
        'tasks_50':       () => stats.tasks >= 50,
        'tasks_100':      () => stats.tasks >= 100,
        'hard_tasks_10':  () => (stats.hardTasks || 0) >= 10,
        // Habits
        'habits_10':      () => stats.habits >= 10,
        'habits_50':      () => stats.habits >= 50,
        'habits_200':     () => stats.habits >= 200,
        // Wealth
        'gold_1000':      () => stats.goldEarned >= 1000,
        'gold_5000':      () => stats.goldEarned >= 5000,
        'gold_25000':     () => stats.goldEarned >= 25000,
        // Level
        'level_10':       () => character.level >= 10,
        'level_30':       () => character.level >= 30,
        // Pomodoro
        'pomodoro_10':    () => (stats.pomodoros || 0) >= 10,
        'pomodoro_50':    () => (stats.pomodoros || 0) >= 50,
        'pomodoro_200':   () => (stats.pomodoros || 0) >= 200,
        'focus_minutes_500':  () => (stats.focusMinutes || 0) >= 500,
        'focus_minutes_2000': () => (stats.focusMinutes || 0) >= 2000,
        // Social
        'login_streak_7':   () => (character.loginStreak || 0) >= 7,
        'login_streak_30':  () => (character.loginStreak || 0) >= 30,
        'login_streak_100': () => (character.loginStreak || 0) >= 100,
        // Collection
        'pets_1':   () => (character.pets?.length || 0) >= 1,
        'pets_5':   () => (character.pets?.length || 0) >= 5,
        'items_25': () => totalItems >= 25,
        'items_50': () => totalItems >= 50,
        // Daily missions
        'missions_all_5': () => (stats.dailyMissionsCompletedDays || 0) >= 5,
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
