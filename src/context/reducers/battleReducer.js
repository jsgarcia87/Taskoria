import { processRewardsAndLevelUp, recordActivity, bumpDailyMissions, getPetMoodBonus, getPetPerks } from '../../utils/gameUtils';

const uid = (prefix) => `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

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

            // Pomodoro rewards rebalanced: old formula gave ~250g for a single 25-min
            // session (= 2.5 Iron Swords!) which inflated the economy. New formula
            // pays well for time but isn't the dominant income source.
            //   25 min × quality 3 → XP ≈ 75, Gold ≈ 75
            //   50 min × quality 5 → XP ≈ 180, Gold ≈ 180
            const petBonus = getPetMoodBonus(state.character);
            const perks = getPetPerks(state.character);
            const xpGain = Math.floor(
                (totalMinutesWorked * 3 + enemiesDefeated * 2) *
                (1 + Math.min(enemiesDefeated, 25) / 100) *
                qualityMult * petBonus * (1 + perks.xpMult)
            );
            const goldGain = Math.floor(
                (totalMinutesWorked * 3 + enemiesDefeated * 2) * qualityMult * (1 + perks.goldMult)
            );
            const timeGain = totalMinutesWorked;

            const newDungeonHp = Math.max(0, (state.activeDungeon?.hp || 0) - damage);
            let updatedChar = { ...state.character };
            let rewardRes = null;

            if (xpGain > 0 || goldGain > 0) {
                rewardRes = processRewardsAndLevelUp(updatedChar, xpGain, goldGain, timeGain);
                if (rewardRes) updatedChar = rewardRes.newChar;
            }

            updatedChar = { ...updatedChar, focusMessage: null, activityHistory: recordActivity(updatedChar, 'minutes', totalMinutesWorked) };
            // Daily mission progress
            updatedChar = { ...updatedChar, dailyMissions: bumpDailyMissions(updatedChar.dailyMissions, 'pomodoro', 1) };
            updatedChar = { ...updatedChar, dailyMissions: bumpDailyMissions(updatedChar.dailyMissions, 'focus_minutes', totalMinutesWorked) };

            if (updatedChar.achievements) {
                updatedChar = {
                    ...updatedChar,
                    achievements: {
                        ...updatedChar.achievements,
                        goldEarned: (updatedChar.achievements.goldEarned || 0) + goldGain,
                        pomodoros: (updatedChar.achievements.pomodoros || 0) + 1,
                        focusMinutes: (updatedChar.achievements.focusMinutes || 0) + totalMinutesWorked,
                    }
                };
            }

            const initialLevel = state.character.level;
            let anyLevelUp = !!rewardRes?.levelUp;

            let newEpicQuests = state.epicQuests || [];
            let bossLogs = [];
            if (newEpicQuests.length > 0) {
                newEpicQuests = newEpicQuests.map(boss => {
                    if (boss.currentHp > 0) {
                        const newBossHp = Math.max(0, boss.currentHp - damage);
                        if (newBossHp === 0 && boss.currentHp > 0) {
                            bossLogs.push({ id: uid('log'), message: `🐉 Slayed Epic Boss: ${boss.title}! +${boss.rewardXp} XP, +${boss.rewardGold} Gold`, type: 'reward' });
                            const bossRes = processRewardsAndLevelUp(updatedChar, boss.rewardXp, boss.rewardGold, 0);
                            if (bossRes) {
                                updatedChar = bossRes.newChar;
                                if (bossRes.levelUp) anyLevelUp = true;
                            }
                        }
                        return { ...boss, currentHp: newBossHp };
                    }
                    return boss;
                }).filter(boss => boss.currentHp > 0);
            }

            const actualXpGain = rewardRes?.xpGained ?? xpGain;

            return {
                ...state,
                character: updatedChar,
                activeDungeon: { ...state.activeDungeon, hp: newDungeonHp },
                epicQuests: newEpicQuests,
                log: [{ id: uid('log'), message: `FOCUS CONCLUDED! (${totalMinutesWorked} mins). +${goldGain} G, +${timeGain} TP, +${actualXpGain} XP.`, type: 'reward' }, ...bossLogs, ...state.log],
                ...(anyLevelUp && updatedChar.level > initialLevel ? { showLevelUpModal: true, newLevelData: { level: updatedChar.level, stats: updatedChar.stats, class: updatedChar.class } } : {})
            };
        }

        default:
            return state;
    }
};
