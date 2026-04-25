import { processRewardsAndLevelUp, recordActivity } from '../../utils/gameUtils';

export const battleReducer = (state, action) => {
    switch (action.type) {
        case 'DEAL_DAMAGE': {
            const damage = action.payload;
            if (!state.activeWorldBoss || !state.activeWorldBoss.isActive) return state;

            const newHp = Math.max(0, state.activeWorldBoss.hp.current - damage);
            let logs = [{ id: Date.now(), message: `Dealt ${damage} DMG to ${state.activeWorldBoss.name}!`, type: 'damage' }];

            let bossDefeated = newHp === 0;
            let updatedChar = state.character;
            let showLevelUp = false;

            if (bossDefeated) {
                logs.push({ id: Date.now() + 1, message: `Defeated ${state.activeWorldBoss.name}! +${state.activeWorldBoss.rewards.gold} Gold, +${state.activeWorldBoss.rewards.xp} XP.`, type: 'reward' });
                let rewardRes = processRewardsAndLevelUp(state.character, state.activeWorldBoss.rewards.xp, state.activeWorldBoss.rewards.gold);
                if (rewardRes) {
                    updatedChar = rewardRes.newChar;
                    showLevelUp = rewardRes.levelUp;
                }
            }

            return {
                ...state,
                character: updatedChar,
                activeWorldBoss: { ...state.activeWorldBoss, hp: { ...state.activeWorldBoss.hp, current: newHp }, isActive: !bossDefeated },
                log: [...logs, ...state.log],
                ...(showLevelUp ? { showLevelUpModal: true, newLevelData: { level: updatedChar.level, stats: updatedChar.stats } } : {})
            };
        }

        case 'FINISH_POMODORO': {
            const { enemiesDefeated = 0, totalMinutesWorked = 0, focusQuality = 3 } = action.payload || {};
            const qualityMult = 0.7 + (focusQuality * 0.1);
            const damage = Math.floor((50 + (enemiesDefeated * 10)) * qualityMult);

            const xpGain = Math.floor(totalMinutesWorked * 2 * (1 + Math.min(enemiesDefeated, 25) / 100) * qualityMult);
            const goldGain = Math.floor(((totalMinutesWorked * 10) + (enemiesDefeated * 5)) * qualityMult);
            const timeGain = totalMinutesWorked;

            const newDungeonHp = Math.max(0, (state.activeDungeon?.hp || 0) - damage);
            let updatedChar = { ...state.character };
            let rewardRes = null;

            if (xpGain > 0 || goldGain > 0) {
                rewardRes = processRewardsAndLevelUp(updatedChar, xpGain, goldGain, timeGain);
                if (rewardRes) updatedChar = rewardRes.newChar;
            }

            updatedChar = { ...updatedChar, focusMessage: null, activityHistory: recordActivity(updatedChar, 'minutes', totalMinutesWorked) };

            if (updatedChar.achievements) {
                updatedChar.achievements = { ...updatedChar.achievements, goldEarned: (updatedChar.achievements.goldEarned || 0) + goldGain };
            }

            let newEpicQuests = state.epicQuests || [];
            let bossLogs = [];
            if (newEpicQuests.length > 0) {
                newEpicQuests = newEpicQuests.map(boss => {
                    if (boss.currentHp > 0) {
                        const newBossHp = Math.max(0, boss.currentHp - damage);
                        if (newBossHp === 0 && boss.currentHp > 0) {
                            bossLogs.push({ id: Date.now() + Math.random(), message: `🐉 Slayed Epic Boss: ${boss.title}! +${boss.rewardXp} XP, +${boss.rewardGold} Gold`, type: 'reward' });
                            let bossRes = processRewardsAndLevelUp(updatedChar, boss.rewardXp, boss.rewardGold, 0);
                            if (bossRes) { updatedChar = bossRes.newChar; if (bossRes.levelUp) rewardRes = bossRes; }
                        }
                        return { ...boss, currentHp: newBossHp };
                    }
                    return boss;
                }).filter(boss => boss.currentHp > 0);
            }

            return {
                ...state,
                character: updatedChar,
                activeDungeon: { ...state.activeDungeon, hp: newDungeonHp },
                epicQuests: newEpicQuests,
                log: [{ id: Date.now(), message: `FOCUS CONCLUDED! (${totalMinutesWorked} mins). +${goldGain} G, +${timeGain} TP, +${xpGain} XP.`, type: 'reward' }, ...bossLogs, ...state.log],
                ...(rewardRes?.levelUp ? { showLevelUpModal: true, newLevelData: { level: updatedChar.level, stats: updatedChar.stats, class: updatedChar.class } } : {})
            };
        }

        default:
            return state;
    }
};
