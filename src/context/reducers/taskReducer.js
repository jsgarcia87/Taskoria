import { 
    getEffectiveStats, 
    processRewardsAndLevelUp, 
    recordActivity, 
    checkBadges, 
    rollD20,
    TASK_DIFFICULTY 
} from '../../utils/gameUtils';

export const taskReducer = (state, action) => {
    switch (action.type) {
        case 'ADD_TASK':
            return { ...state, tasks: [...state.tasks, action.payload] };

        case 'EDIT_TASK':
            return {
                ...state,
                tasks: state.tasks.map(t => t.id === action.payload.id ? { ...t, ...action.payload.updates } : t)
            };

        case 'DELETE_TASK':
            return { ...state, tasks: state.tasks.filter(t => t.id !== action.payload) };

        case 'UPDATE_TASK_STATUS':
            return {
                ...state,
                tasks: state.tasks.map(t => t.id === action.payload.id ? { ...t, status: action.payload.status } : t)
            };

        case 'ADD_HABIT':
            return { ...state, habits: [...state.habits, action.payload] };

        case 'EDIT_HABIT':
            return {
                ...state,
                habits: state.habits.map(h => h.id === action.payload.id ? { ...h, ...action.payload.updates } : h)
            };

        case 'DELETE_HABIT':
            return { ...state, habits: state.habits.filter(h => h.id !== action.payload) };

        case 'ADD_EPIC_QUEST':
            return { ...state, epicQuests: [...(state.epicQuests || []), action.payload] };

        case 'EDIT_EPIC_QUEST':
            return {
                ...state,
                epicQuests: (state.epicQuests || []).map(b => b.id === action.payload.id ? { ...b, ...action.payload.updates } : b)
            };

        case 'ADD_EPIC_PROJECT':
            return { 
                ...state, 
                tasks: [...state.tasks, ...action.payload.projectTasks], 
                epicQuests: [...(state.epicQuests || []), action.payload.boss] 
            };

        case 'TICK_HABIT': {
            const { id: habitId, x = null, y = null } = action.payload;
            const habit = state.habits.find(h => h.id === habitId);
            const difficulty = habit ? (habit.target > 3 ? TASK_DIFFICULTY.HARD : TASK_DIFFICULTY.NORMAL) : TASK_DIFFICULTY.NORMAL;

            const effStats = getEffectiveStats(state.character);
            const intBonus = 1 + ((effStats.int || 10) * 0.02);
            const chaBonus = 1 + ((effStats.cha || 10) * 0.02);

            let xpGain = Math.floor(difficulty * 15 * intBonus);
            let goldGain = Math.floor(difficulty * 3 * chaBonus);

            let rewardRes = processRewardsAndLevelUp(state.character, xpGain, goldGain);
            let updatedChar = rewardRes ? rewardRes.newChar : state.character;

            if (updatedChar.achievements) {
                updatedChar.achievements = {
                    ...updatedChar.achievements,
                    habits: (updatedChar.achievements.habits || 0) + 1,
                    goldEarned: (updatedChar.achievements.goldEarned || 0) + goldGain
                };
            }
            updatedChar.activityHistory = recordActivity(updatedChar, 'task', 1);

            const badgeCheck = checkBadges(updatedChar);
            updatedChar = badgeCheck.newChar;

            let logEntry = { id: Date.now(), message: `HABIT COMPLETED! +${xpGain} XP, +${goldGain} Gold.`, type: 'reward' };
            let newFloatingTexts = [...(state.floatingTexts || [])];

            if (habit && habit.attribute && habit.attribute !== 'none') {
                const stat = habit.attribute;
                updatedChar.baseStats[stat] = (updatedChar.baseStats[stat] || 0) + 1;
                updatedChar.stats[stat] = (updatedChar.stats[stat] || 0) + 1;
                logEntry.message += ` +1 ${stat.toUpperCase()}!`;
                if (x !== null && y !== null) {
                    newFloatingTexts.push({ id: Date.now() + 3, text: `+1 ${stat.toUpperCase()}`, x: x + 40, y: y - 20, color: '#3b82f6' });
                }
            }

            let logs = [logEntry, ...badgeCheck.newBadges.map(b => ({ id: Date.now() + Math.random(), message: `🏆 Badge Unlocked: ${b.name}!`, type: 'reward' }))];

            if (x !== null && y !== null) {
                newFloatingTexts.push({ id: Date.now() + 1, text: `+${xpGain} XP`, x, y, color: '#fbbf24' });
                newFloatingTexts.push({ id: Date.now() + 2, text: `+${goldGain} G`, x, y: y + 20, color: '#fcd34d' });
            }

            return {
                ...state,
                character: updatedChar,
                floatingTexts: newFloatingTexts,
                habits: state.habits.map(h => h.id === habitId ? { ...h, count: h.count + 1, completed: (h.count + 1) >= h.target } : h),
                log: [...logs, ...state.log],
                ...(rewardRes?.levelUp ? { showLevelUpModal: true, newLevelData: { level: updatedChar.level, stats: updatedChar.stats } } : {})
            };
        }

        case 'COMPLETE_TASK': {
            const { id: taskId, x = null, y = null } = action.payload;
            const task = state.tasks.find(t => t.id === taskId);
            if (!task || !state.character) return state;

            const effStats = getEffectiveStats(state.character);
            const { class: charClass } = state.character;

            let modifier = 0;
            if (charClass === 'Fighter') modifier = effStats.str;
            else if (charClass === 'Wizard') modifier = effStats.int;
            else if (charClass === 'Rogue') modifier = effStats.dex;
            else if (charClass === 'Cleric') modifier = Math.floor((effStats.will + effStats.cha) / 2);
            else if (charClass === 'Paladin') modifier = Math.floor((effStats.str + effStats.will) / 2);

            const d20 = rollD20();
            const damage = (d20 + modifier) * task.difficulty;

            const intBonus = 1 + ((effStats.int || 10) * 0.02);
            const chaBonus = 1 + ((effStats.cha || 10) * 0.02);
            let xpGain = Math.floor(task.difficulty * (task.recurrence === 'daily' ? 12 : 8) * intBonus);
            let goldGain = Math.floor(task.difficulty * 5 * chaBonus);

            const rewardRes = processRewardsAndLevelUp(state.character, xpGain, goldGain);
            let updatedChar = rewardRes ? rewardRes.newChar : state.character;

            let logMessage = state.activeDungeon?.hp > 0 
                ? `Dealt ${damage} DMG! (d20:${d20} + ${modifier}). +${xpGain} XP, +${goldGain} Gold.` 
                : `Completed Quest! +${xpGain} XP, +${goldGain} Gold.`;

            let newFloatingTexts = [...(state.floatingTexts || [])];
            if (task.attribute && task.attribute !== 'none') {
                const stat = task.attribute;
                updatedChar.baseStats[stat] = (updatedChar.baseStats[stat] || 0) + 1;
                updatedChar.stats[stat] = (updatedChar.stats[stat] || 0) + 1;
                logMessage += ` +1 ${stat.toUpperCase()}!`;
                if (x !== null && y !== null) newFloatingTexts.push({ id: Date.now() + 4, text: `+1 ${stat.toUpperCase()}`, x: x + 20, y: y - 40, color: '#3b82f6' });
            }

            // Loot
            if (Math.random() < (task.difficulty === 3 ? 0.35 : (task.difficulty > 3 ? 0.50 : 0.15))) {
                const roll = Math.random();
                const droppedItem = roll < 0.10 ? { id: 'item_' + Date.now(), name: 'Mystery Chest', type: 'consumable', cost: 0, description: 'Contains mysterious treasures.', icon: 'box' } 
                               : roll < 0.40 ? { id: 'item_' + Date.now(), name: 'Gold Pouch', type: 'consumable', cost: 0, description: 'Grants 100-300 Gold.', icon: 'coins' }
                               : { id: 'item_' + Date.now(), name: 'Health Potion', type: 'consumable', cost: 0, description: 'Restores 50 HP.', icon: 'heart' };
                updatedChar.inventory = [...(updatedChar.inventory || []), droppedItem];
                logMessage += ` 🎁 Found a ${droppedItem.name}!`;
            }

            const todayStr = new Date().toDateString();
            let newCompletedTasks = [...(state.completedTasks || [])];
            let remainingTasks;

            if (task.recurrence && task.recurrence !== 'none') {
                remainingTasks = state.tasks.map(t => {
                    if (t.id === taskId) {
                        let newStreak = t.streakCount || 0;
                        if (t.lastCompletedDate !== todayStr) {
                            const yesterday = new Date(); yesterday.setDate(yesterday.getDate() - 1);
                            newStreak = (t.lastCompletedDate === yesterday.toDateString()) ? newStreak + 1 : 1;
                        }
                        return { ...t, completed: true, lastCompleted: Date.now(), lastCompletedDate: todayStr, streakCount: newStreak };
                    }
                    return t;
                });
            } else {
                if (task.projectId) remainingTasks = state.tasks.map(t => t.id === taskId ? { ...t, completed: true, lastCompleted: Date.now() } : t);
                else {
                    remainingTasks = state.tasks.filter(t => t.id !== taskId);
                    newCompletedTasks.unshift({ ...task, completed: true, lastCompleted: Date.now() });
                }
            }

            if (updatedChar.achievements) {
                updatedChar.achievements = { ...updatedChar.achievements, tasks: (updatedChar.achievements.tasks || 0) + 1, goldEarned: (updatedChar.achievements.goldEarned || 0) + goldGain };
            }
            updatedChar.activityHistory = recordActivity(updatedChar, 'task', 1);

            const badgeCheck = checkBadges(updatedChar);
            updatedChar = badgeCheck.newChar;

            let bossLogs = [];
            let newEpicQuests = (state.epicQuests || []).map(boss => {
                if (boss.isProject && task.projectId === boss.projectId) {
                    const allProjectTasks = remainingTasks.filter(t => t.projectId === boss.projectId);
                    const completedRatio = allProjectTasks.length > 0 ? (allProjectTasks.filter(t => t.completed).length / allProjectTasks.length) : 1;
                    const newBossHp = Math.max(0, Math.floor(boss.maxHp - (boss.maxHp * completedRatio)));
                    if (newBossHp === 0 && boss.currentHp > 0) {
                        bossLogs.push({ id: Date.now() + Math.random(), message: `🐉 Project Boss Defeated: ${boss.title}! +${boss.rewardXp} XP, +${boss.rewardGold} Gold`, type: 'reward' });
                        let bossRes = processRewardsAndLevelUp(updatedChar, boss.rewardXp, boss.rewardGold, 0);
                        if (bossRes) updatedChar = bossRes.newChar;
                    }
                    return { ...boss, currentHp: newBossHp };
                } else if (!task.projectId && boss.currentHp > 0) {
                    const newBossHp = Math.max(0, boss.currentHp - damage);
                    if (newBossHp === 0 && boss.currentHp > 0) {
                        bossLogs.push({ id: Date.now() + Math.random(), message: `🐉 Epic Boss Defeated: ${boss.title}! +${boss.rewardXp} XP, +${boss.rewardGold} Gold`, type: 'reward' });
                        let bossRes = processRewardsAndLevelUp(updatedChar, boss.rewardXp, boss.rewardGold, 0);
                        if (bossRes) updatedChar = bossRes.newChar;
                    }
                    return { ...boss, currentHp: newBossHp };
                }
                return boss;
            }).filter(boss => boss.currentHp > 0);

            if (x !== null && y !== null) {
                newFloatingTexts.push({ id: Date.now() + 1, text: `+${xpGain} XP`, x, y, color: '#fbbf24' });
                newFloatingTexts.push({ id: Date.now() + 2, text: `+${goldGain} G`, x, y: y + 20, color: '#fcd34d' });
                if (state.activeDungeon?.hp > 0) newFloatingTexts.push({ id: Date.now() + 3, text: `-${damage} HP`, x: x + 40, y: y - 20, color: '#ef4444' });
            }

            return {
                ...state,
                character: updatedChar,
                floatingTexts: newFloatingTexts,
                tasks: remainingTasks,
                completedTasks: newCompletedTasks,
                epicQuests: newEpicQuests,
                log: [...bossLogs, { id: Date.now(), message: logMessage, type: 'info' }, ...badgeCheck.newBadges.map(b => ({ id: Date.now() + Math.random(), message: `🏆 Badge Unlocked: ${b.name}!`, type: 'reward' })), ...state.log],
                activeDungeon: { ...state.activeDungeon, hp: Math.max(0, state.activeDungeon.hp - damage) },
                ...(rewardRes?.levelUp ? { showLevelUpModal: true, newLevelData: { level: updatedChar.level, stats: updatedChar.stats, class: updatedChar.class } } : {})
            };
        }

        default:
            return state;
    }
};
