/**
 * Pool of possible daily missions. Each is a stable shape:
 *   { kind, target, title, rewardXp, rewardGold }
 *
 * `kind` is checked by taskReducer / battleReducer to bump `progress`.
 * Three missions are picked per day, deterministically based on the date,
 * so all players on the same day see the same set (creates a shared cadence).
 */
const MISSION_POOL = [
    { kind: 'tasks',         target: 3,  title: 'Complete 3 quests',        rewardXp: 60,  rewardGold: 50 },
    { kind: 'tasks',         target: 5,  title: 'Complete 5 quests',        rewardXp: 120, rewardGold: 100 },
    { kind: 'habits',        target: 3,  title: 'Tick 3 habits',            rewardXp: 40,  rewardGold: 40 },
    { kind: 'habits',        target: 5,  title: 'Tick 5 habits',            rewardXp: 80,  rewardGold: 80 },
    { kind: 'pomodoro',      target: 1,  title: 'Run a Pomodoro session',   rewardXp: 60,  rewardGold: 60 },
    { kind: 'pomodoro',      target: 2,  title: 'Run 2 Pomodoro sessions',  rewardXp: 140, rewardGold: 120 },
    { kind: 'focus_minutes', target: 25, title: 'Focus for 25 minutes',     rewardXp: 80,  rewardGold: 80 },
    { kind: 'focus_minutes', target: 60, title: 'Focus for an hour',        rewardXp: 200, rewardGold: 180 },
    { kind: 'hard_tasks',    target: 1,  title: 'Slay 1 hard quest',        rewardXp: 80,  rewardGold: 70 },
    { kind: 'spend_gold',    target: 100, title: 'Spend 100 gold in shop',  rewardXp: 30,  rewardGold: 0 },
];

const generateDailyMissions = (todayStr) => {
    // Simple deterministic hash so the date drives a stable rotation.
    let seed = 0;
    for (let i = 0; i < todayStr.length; i++) seed = (seed * 31 + todayStr.charCodeAt(i)) | 0;
    const picks = [];
    const used = new Set();
    let s = Math.abs(seed);
    while (picks.length < 3 && picks.length < MISSION_POOL.length) {
        const idx = s % MISSION_POOL.length;
        s = (s * 1103515245 + 12345) >>> 0;
        if (used.has(MISSION_POOL[idx].kind + '_' + MISSION_POOL[idx].target)) continue;
        used.add(MISSION_POOL[idx].kind + '_' + MISSION_POOL[idx].target);
        picks.push({
            ...MISSION_POOL[idx],
            id: 'dm_' + idx,
            progress: 0,
            claimed: false,
        });
    }
    return picks;
};

export const systemReducer = (initialState) => (state, action) => {
    switch (action.type) {
        case 'TOGGLE_RESTING':
            return {
                ...state,
                character: { ...state.character, isResting: !state.character.isResting },
                log: [{ id: Date.now(), message: state.character.isResting ? `You have left the Inn.` : `You are now resting at the Inn.`, type: 'info' }, ...state.log]
            };

        case 'SPEND_TIME':
            return { ...state, character: { ...state.character, timePoints: state.character.timePoints - action.payload }, log: [{ id: Date.now(), message: `Spent ${action.payload}m on reward.`, type: 'info' }, ...state.log] };

        case 'ADD_REWARD':
            return { ...state, rewards: [...state.rewards, action.payload] };

        case 'DELETE_REWARD':
            return { ...state, rewards: state.rewards.filter(r => r.id !== action.payload) };

        case 'INIT_REWARDS':
            return { ...state, rewards: [{ id: 'netflix', name: '1 Episode of Netflix', cost: 30, type: 'time' }, { id: 'game', name: '30min Gaming', cost: 30, type: 'time' }] };

        case 'SET_FOCUS_MESSAGE':
            return { ...state, character: { ...state.character, focusMessage: action.payload } };

        case 'RESTORE_STATE': {
            const newState = {
                ...initialState,
                ...action.payload,
                tasks: action.payload?.tasks || [],
                completedTasks: action.payload?.completedTasks || [],
                habits: action.payload?.habits || [],
                rewards: action.payload?.rewards || initialState.rewards,
                log: action.payload?.log || [],
                screensaverSettings: action.payload?.screensaverSettings || initialState.screensaverSettings,
                activeDungeon: action.payload?.activeDungeon || initialState.activeDungeon,
                activeWorldBoss: action.payload?.activeWorldBoss || initialState.activeWorldBoss,
                // Always force modals closed on restore — otherwise a save that
                // happened while a modal was open re-opens it on every refresh.
                // CHECK_PENALTIES (dispatched right after) decides if the daily
                // reward should actually fire based on lastLoginDate.
                showDailyRewardModal: false,
                dailyRewardData: null,
                showLevelUpModal: false,
                newLevelData: null,
            };
            if (newState.character) {
                let safePets = newState.character.pets || [];
                if (newState.character.pet) { safePets.push({ ...newState.character.pet, id: 'pet_' + Date.now() }); delete newState.character.pet; }
                
                // Ensure character has all necessary sub-objects to prevent crashes
                newState.character = { 
                    ...newState.character, 
                    inventory: newState.character.inventory || [], 
                    gold: newState.character.gold || 0, 
                    timePoints: newState.character.timePoints || 0, 
                    pets: safePets.map(p => ({ ...p, showPet: p.showPet !== false })),
                    hp: newState.character.hp || { current: 100, max: 100 },
                    xp: newState.character.xp || { current: 0, max: 100 },
                    level: newState.character.level || 1,
                    stats: newState.character.stats || { str: 10, int: 10, dex: 10, con: 10, cha: 10, will: 10 },
                    baseStats: newState.character.baseStats || newState.character.stats || { str: 10, int: 10, dex: 10, con: 10, cha: 10, will: 10 },
                    equipment: newState.character.equipment || { mainHand: null, offHand: null, body: null, head: null, ring: null },
                    unlockedBadges: newState.character.unlockedBadges || [],
                    achievements: newState.character.achievements || { tasks: 0, habits: 0, goldEarned: 0 }
                };
            }
            return newState;
        }

        case 'CHECK_PENALTIES': {
            if (!state.character) return state; // Safety check for new profiles
            if (state.character.isResting) return state;
            const today = new Date().toLocaleDateString('en-CA');
            const now = new Date();
            let dmgTaken = 0;
            let updatedDungeon = state.activeDungeon || { hp: 1000, maxHp: 1000, name: "Weekly Dungeon", lastReset: null };

            if (updatedDungeon) {
                const dungeonLastReset = new Date(updatedDungeon.lastReset || Date.now());
                const dungeonDaysDiff = (now - dungeonLastReset) / (1000 * 60 * 60 * 24);
                if (!updatedDungeon.lastReset || dungeonDaysDiff >= 7) {
                    let newMaxHp = updatedDungeon.maxHp || 1000;
                    if (updatedDungeon.hp <= 0) newMaxHp += 250;
                    updatedDungeon = { ...updatedDungeon, maxHp: newMaxHp, hp: newMaxHp, lastReset: Date.now() };
                }
            }

            let showDailyReward = false;
            let dailyRewardGold = 0;
            let currentStreak = 1;
            let updatedChar = state.character;

            // Guard against repeating the daily reward when the persisted save
            // hasn't caught up yet (the action payload carries an atomic flag
            // sourced from localStorage in GameContext).
            const skipDailyReward = !!(action.payload && action.payload.skipDailyReward);

            if (updatedChar) {
                if (updatedChar.lastLoginDate !== today && !skipDailyReward) {
                    if (updatedChar.lastLoginDate) {
                        try {
                            const diffDays = Math.ceil(Math.abs(new Date(today) - new Date(updatedChar.lastLoginDate)) / (1000 * 60 * 60 * 24));
                            currentStreak = (diffDays === 1) ? (updatedChar.loginStreak || 0) + 1 : 1;
                        } catch (e) { currentStreak = 1; }
                    }
                    dailyRewardGold = 50 + (currentStreak * 10);
                    showDailyReward = true;
                    updatedChar = { ...updatedChar, loginStreak: currentStreak, lastLoginDate: today, gold: (updatedChar.gold || 0) + dailyRewardGold };
                } else {
                    // Either same day OR localStorage says we already gave reward.
                    // Still patch lastLoginDate to keep the saved state consistent.
                    currentStreak = updatedChar.loginStreak || 1;
                    if (skipDailyReward && updatedChar.lastLoginDate !== today) {
                        updatedChar = { ...updatedChar, lastLoginDate: today };
                    }
                }
            }

            // Daily missions — regenerate when the date changes (or first time)
            if (updatedChar && updatedChar.dailyMissionsDate !== today) {
                updatedChar = {
                    ...updatedChar,
                    dailyMissions: generateDailyMissions(today),
                    dailyMissionsDate: today,
                };
            }

            const updatedHabits = (state.habits || []).map(h => {
                const lastDate = new Date(h.lastReset || Date.now());
                const daysDiff = (now - lastDate) / (1000 * 60 * 60 * 24);
                let shouldReset = false;
                if ((h.frequency === 'daily' || !h.frequency) && lastDate.getDate() !== now.getDate()) shouldReset = true;
                else if (h.frequency === 'weekly' && daysDiff >= 7) shouldReset = true;
                else if (h.frequency === 'monthly' && lastDate.getMonth() !== now.getMonth()) shouldReset = true;
                return shouldReset ? { ...h, count: 0, completed: false, lastReset: Date.now() } : h;
            });

            const updatedTasks = (state.tasks || []).map(t => {
                if (!t.completed || !t.recurrence || t.recurrence === 'none') return t;
                const lastDate = new Date(t.lastCompleted);
                if (t.recurrence === 'daily' && lastDate.getDate() !== now.getDate()) return { ...t, completed: false };
                if (t.recurrence === 'weekly' && ((now - lastDate) / (1000 * 60 * 60 * 24)) >= 7) return { ...t, completed: false };
                return t;
            });

            // Overdue task penalty — capped to keep a bad week from one-shotting users.
            // Old behavior: diff×5 HP per overdue task, unlimited. 5 hard overdue = -75 HP.
            // New behavior:
            //   • diff×3 HP per overdue task (was ×5)
            //   • Total daily damage hard-capped at 20% of max HP (or 25 HP, whichever is more)
            //   • Resting at the Inn fully shields you (already handled by early return)
            const overdueTasks = updatedTasks.filter(t => t.dueDate && t.dueDate < today && !t.completed && !t.penalized);
            overdueTasks.forEach(t => { dmgTaken += (t.difficulty || 1) * 3; t.penalized = true; });
            const maxDailyDmg = Math.max(25, Math.floor((updatedChar.hp?.max || 100) * 0.2));
            const cappedDmg = Math.min(dmgTaken, maxDailyDmg);
            const dmgCapped = dmgTaken > cappedDmg;
            dmgTaken = cappedDmg;

            // Passive HP regeneration on day change — small, only if not penalized.
            // Encourages returning daily without forcing the Inn.
            let regenAmount = 0;
            if (dmgTaken === 0 && (updatedChar.hp?.current || 0) < (updatedChar.hp?.max || 100)) {
                regenAmount = Math.max(5, Math.floor((updatedChar.hp.max || 100) * 0.1));
            }

            let newHp = (updatedChar.hp?.current || 0) - dmgTaken + regenAmount;
            if (newHp > (updatedChar.hp?.max || 100)) newHp = updatedChar.hp.max;
            // Reduced gold penalty when KO'd (was 10% → now 5%, max 200 gold)
            let goldPenalty = (newHp <= 0) ? Math.min(200, Math.floor((updatedChar.gold || 0) * 0.05)) : 0;
            if (newHp <= 0) newHp = 1; // never KO completely — leave at 1 HP

            let updatedPets = updatedChar.pets ? updatedChar.pets.map(p => {
                if (p.inSanctuary) return p;
                // Slower hunger decay: 2/hour was 5/hour. Pets now survive a weekend trip.
                const hoursSinceFed = (now - new Date(p.lastFed || Date.now())) / (1000 * 60 * 60);
                return hoursSinceFed >= 1 ? { ...p, hunger: Math.max(0, (p.hunger || 0) - (Math.floor(hoursSinceFed) * 2)), lastFed: Date.now() } : p;
            }) : [];

            let logEntry = null;
            if (dmgTaken > 0) {
                logEntry = `Overdue Quests! Took ${dmgTaken} DMG${dmgCapped ? ' (daily cap reached)' : ''}.`;
            } else if (regenAmount > 0) {
                logEntry = `A new day. Recovered ${regenAmount} HP.`;
            }
            if (showDailyReward) {
                const rewardLog = `Daily Login! Streak: ${currentStreak}d. +${dailyRewardGold} G.`;
                logEntry = logEntry ? logEntry + " " + rewardLog : rewardLog;
            }

            return {
                ...state,
                tasks: updatedTasks,
                habits: updatedHabits,
                character: { 
                    ...updatedChar, 
                    hp: { ...(updatedChar.hp || { current: 100, max: 100 }), current: newHp }, 
                    gold: Math.max(0, (updatedChar.gold || 0) - goldPenalty), 
                    pets: updatedPets 
                },
                log: logEntry ? [{ id: Date.now(), message: logEntry, type: 'reward' }, ...state.log] : state.log,
                activeDungeon: updatedDungeon,
                ...(showDailyReward ? { showDailyRewardModal: true, dailyRewardData: { streak: currentStreak, gold: dailyRewardGold } } : {})
            };
        }

        default:
            return state;
    }
};
