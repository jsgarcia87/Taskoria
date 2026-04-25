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
                activeWorldBoss: action.payload?.activeWorldBoss || initialState.activeWorldBoss
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

            if (updatedChar) {
                if (updatedChar.lastLoginDate !== today) {
                    if (updatedChar.lastLoginDate) {
                        try {
                            const diffDays = Math.ceil(Math.abs(new Date(today) - new Date(updatedChar.lastLoginDate)) / (1000 * 60 * 60 * 24));
                            currentStreak = (diffDays === 1) ? (updatedChar.loginStreak || 0) + 1 : 1;
                        } catch (e) { currentStreak = 1; }
                    }
                    dailyRewardGold = 50 + (currentStreak * 10);
                    showDailyReward = true;
                    updatedChar = { ...updatedChar, loginStreak: currentStreak, lastLoginDate: today, gold: (updatedChar.gold || 0) + dailyRewardGold };
                } else currentStreak = updatedChar.loginStreak || 1;
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

            const overdueTasks = updatedTasks.filter(t => t.dueDate && t.dueDate < today && !t.completed && !t.penalized);
            overdueTasks.forEach(t => { dmgTaken += (t.difficulty || 1) * 5; t.penalized = true; });

            let newHp = (updatedChar.hp?.current || 0) - dmgTaken;
            let goldPenalty = (newHp <= 0) ? Math.floor((updatedChar.gold || 0) * 0.1) : 0;
            if (newHp < 0) newHp = 0;

            let updatedPets = updatedChar.pets ? updatedChar.pets.map(p => {
                if (p.inSanctuary) return p;
                const hoursSinceFed = (now - new Date(p.lastFed || Date.now())) / (1000 * 60 * 60);
                return hoursSinceFed >= 1 ? { ...p, hunger: Math.max(0, (p.hunger || 0) - (Math.floor(hoursSinceFed) * 5)), lastFed: Date.now() } : p;
            }) : [];

            let logEntry = dmgTaken > 0 ? `Overdue Quests! Took ${dmgTaken} DMG.` : null;
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
