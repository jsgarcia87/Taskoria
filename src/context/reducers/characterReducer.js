import {
    calculateMaxHp,
    calculateXpReq,
    calculateUpdatedStats,
    checkBadges,
    processRewardsAndLevelUp,
    bumpDailyMissions
} from '../../utils/gameUtils';
import { SET_BONUSES } from '../../data/items';

export const characterReducer = (state, action) => {
    switch (action.type) {
        case 'ADD_FLOATING_TEXT':
            return {
                ...state,
                floatingTexts: [...(state.floatingTexts || []), action.payload]
            };
        case 'REMOVE_FLOATING_TEXT':
            return {
                ...state,
                floatingTexts: (state.floatingTexts || []).filter(ft => ft.id !== action.payload)
            };

        case 'UPDATE_CHARACTER':
            return {
                ...state,
                character: {
                    ...state.character,
                    ...action.payload,
                }
            };

        case 'CREATE_CHARACTER': {
            const baseStats = action.payload.stats || { str: 10, int: 10, dex: 10, con: 10, cha: 10, will: 10 };
            const maxHp = calculateMaxHp(baseStats.con || 10, 1);

            return {
                ...state,
                character: {
                    name: action.payload.name,
                    class: action.payload.class,
                    avatarId: action.payload.avatarId,
                    avatarColors: action.payload.colors || {},
                    baseStats: baseStats,
                    stats: { ...baseStats },
                    hp: { current: maxHp, max: maxHp },
                    xp: { current: 0, max: calculateXpReq(1) },
                    level: 1,
                    gold: 100,
                    timePoints: 0,
                    equipment: {
                        mainHand: null,
                        offHand: null,
                        body: null,
                        head: null,
                        ring: null
                    },
                    pets: [],
                    incubatingEgg: null,
                    inventory: [],
                    activeSets: {},
                    bonuses: { gold: 0, xp: 0 },
                    achievements: { tasks: 0, habits: 0, goldEarned: 100 },
                    unlockedBadges: [],
                    // Onboarding: trigger interactive tutorial for fresh characters
                    hasSeenTutorial: false,
                    // Daily missions — auto-generated each day
                    dailyMissions: null,
                    dailyMissionsDate: null,
                },
            };
        }

        case 'BUY_ITEM': {
            const item = action.payload;
            if (state.character.gold < item.cost) return state;

            return {
                ...state,
                character: {
                    ...state.character,
                    gold: state.character.gold - item.cost,
                    inventory: [...state.character.inventory, item],
                    dailyMissions: bumpDailyMissions(state.character.dailyMissions, 'spend_gold', item.cost),
                },
                log: [{ id: Date.now(), message: `Bought ${item.name}`, type: 'info' }, ...state.log]
            };
        }

        case 'BUY_ITEM_CUSTOM_PRICE': {
            const { item, price } = action.payload;
            return {
                ...state,
                character: {
                    ...state.character,
                    gold: state.character.gold - price,
                    inventory: [...state.character.inventory, item]
                },
                log: [{ id: Date.now(), message: `Bought ${item.name} from Market for ${price} Gold`, type: 'info' }, ...state.log]
            };
        }

        case 'SELL_ITEM': {
            const item = action.payload;
            const sellPrice = Math.floor(item.cost * 0.5);
            let newInventory = [...state.character.inventory];
            const itemIndex = newInventory.findIndex(i => i.id === item.id);
            if (itemIndex > -1) newInventory.splice(itemIndex, 1);

            return {
                ...state,
                character: {
                    ...state.character,
                    gold: state.character.gold + sellPrice,
                    inventory: newInventory
                },
                log: [{ id: Date.now(), message: `Sold ${item.name} to the void for ${sellPrice} Gold`, type: 'info' }, ...state.log]
            };
        }

        case 'MARKET_SALE_REWARD': {
            const { amount, item_name } = action.payload;
            return {
                ...state,
                character: {
                    ...state.character,
                    gold: state.character.gold + amount
                },
                log: [{ id: Date.now(), message: `Market Sale: ${item_name} sold for ${amount} Gold!`, type: 'reward' }, ...state.log]
            };
        }

        case 'LIST_MARKET_ITEM': {
            const item = action.payload;
            let newInventory = [...state.character.inventory];
            const itemIndex = newInventory.findIndex(i => i.id === item.id);
            if (itemIndex > -1) newInventory.splice(itemIndex, 1);

            return {
                ...state,
                character: {
                    ...state.character,
                    inventory: newInventory
                },
                log: [{ id: Date.now(), message: `Listed ${item.name} on the Community Market`, type: 'info' }, ...state.log]
            };
        }

        case 'EQUIP_ITEM': {
            const { item, slot } = action.payload;
            const char = state.character;
            if (!char) return state;

            let newInventory = [...char.inventory];
            let newEquipment = { ...char.equipment };

            const currentEquipped = newEquipment[slot];
            if (currentEquipped) newInventory.push(currentEquipped);

            const itemIndex = newInventory.findIndex(i => i.id === item.id);
            if (itemIndex > -1) newInventory.splice(itemIndex, 1);
            else return state;

            newEquipment[slot] = item;
            const { stats: newStats, hp: newHp, bonuses: newBonuses, activeSets } = calculateUpdatedStats(char.baseStats, newEquipment, char.hp, char.level, SET_BONUSES);

            return {
                ...state,
                character: {
                    ...char,
                    inventory: newInventory,
                    equipment: newEquipment,
                    stats: newStats,
                    hp: newHp,
                    bonuses: newBonuses,
                    activeSets
                },
                log: [{ id: Date.now(), message: `Equipped ${item.name}`, type: 'info' }, ...state.log]
            };
        }

        case 'UNEQUIP_ITEM': {
            const { slot } = action.payload;
            const char = state.character;
            if (!char || !char.equipment[slot]) return state;

            const item = char.equipment[slot];
            const newInventory = [...char.inventory, item];
            const newEquipment = { ...char.equipment };
            delete newEquipment[slot];

            const { stats: newStats, hp: newHp, bonuses: newBonuses, activeSets } = calculateUpdatedStats(char.baseStats, newEquipment, char.hp, char.level, SET_BONUSES);

            return {
                ...state,
                character: {
                    ...char,
                    inventory: newInventory,
                    equipment: newEquipment,
                    stats: newStats,
                    hp: newHp,
                    bonuses: newBonuses,
                    activeSets
                },
                log: [{ id: Date.now(), message: `Unequipped ${item.name}`, type: 'info' }, ...state.log]
            };
        }

        case 'UPDATE_SCREENSAVER_SETTINGS':
            return {
                ...state,
                screensaverSettings: {
                    ...state.screensaverSettings,
                    ...action.payload
                }
            };

        case 'USE_ITEM': {
            const item = action.payload;
            let newInventory = [...state.character.inventory];
            const itemIndex = newInventory.findIndex(i => i.id === item.id);
            if (itemIndex > -1) newInventory.splice(itemIndex, 1);
            else return state;

            let newChar = { ...state.character, inventory: newInventory };
            let logMsg = `Used ${item.name}.`;
            let levelUpData = null;

            // Legacy name-based effects (kept for items that came from loot drops)
            if (item.name === 'Health Potion' && !item.effect?.hp) {
                newChar.hp = { ...newChar.hp, current: Math.min(newChar.hp.max, newChar.hp.current + 50) };
                logMsg += ` Restored 50 HP.`;
            } else if (item.name === 'Gold Pouch' && !item.effect?.gold) {
                const goldAmount = Math.floor(Math.random() * 200) + 100;
                newChar.gold = (newChar.gold || 0) + goldAmount;
                logMsg += ` Found ${goldAmount} Gold!`;
            }

            // Effect-based handlers (preferred for new items)
            const eff = item.effect || {};

            if (eff.hp) {
                newChar.hp = { ...newChar.hp, current: Math.min(newChar.hp.max, newChar.hp.current + eff.hp) };
                logMsg += ` Restored ${eff.hp} HP.`;
            }

            if (eff.gold) {
                // Allow randomised pouches via effect.gold (treated as the mean)
                const variance = Math.floor(eff.gold * 0.5);
                const goldAmount = (eff.gold - variance) + Math.floor(Math.random() * (variance * 2 + 1));
                newChar.gold = (newChar.gold || 0) + goldAmount;
                logMsg += ` Found ${goldAmount} Gold!`;
            }

            if (eff.xp) {
                const res = processRewardsAndLevelUp(newChar, eff.xp, 0, 0);
                if (res) {
                    newChar = res.newChar;
                    logMsg += ` Gained ${res.xpGained} XP!`;
                    if (res.levelUp) {
                        levelUpData = { level: newChar.level, stats: newChar.stats };
                    }
                }
            }

            if (eff.mysteryChest || item.name === 'Mystery Chest') {
                const roll = Math.random();
                if (roll < 0.55) {
                    const goldAmount = Math.floor(Math.random() * 400) + 200;
                    newChar.gold = (newChar.gold || 0) + goldAmount;
                    logMsg += ` Found ${goldAmount} Gold!`;
                } else if (roll < 0.85) {
                    newChar.gold = (newChar.gold || 0) + 800;
                    logMsg += ` Jackpot: 800 Gold!`;
                } else {
                    // 15% chance: 300 XP boost
                    const res = processRewardsAndLevelUp(newChar, 300, 0, 0);
                    if (res) {
                        newChar = res.newChar;
                        logMsg += ` Ancient knowledge! +${res.xpGained} XP.`;
                        if (res.levelUp) levelUpData = { level: newChar.level, stats: newChar.stats };
                    }
                }
            }

            return {
                ...state,
                character: newChar,
                log: [{ id: Date.now(), message: logMsg, type: 'info' }, ...state.log],
                ...(levelUpData ? { showLevelUpModal: true, newLevelData: levelUpData } : {})
            };
        }

        case 'DISMISS_TUTORIAL':
            if (!state.character) return state;
            return { ...state, character: { ...state.character, hasSeenTutorial: true } };

        case 'CLAIM_DAILY_MISSION': {
            if (!state.character?.dailyMissions) return state;
            const missionId = action.payload;
            const mission = state.character.dailyMissions.find(m => m.id === missionId);
            if (!mission || mission.claimed || mission.progress < mission.target) return state;

            const xpGain = mission.rewardXp || 0;
            const goldGain = mission.rewardGold || 0;
            const res = processRewardsAndLevelUp(state.character, xpGain, goldGain, 0);
            let updatedChar = res ? res.newChar : state.character;
            const updatedMissions = updatedChar.dailyMissions.map(m =>
                m.id === missionId ? { ...m, claimed: true } : m
            );
            updatedChar = { ...updatedChar, dailyMissions: updatedMissions };

            // Bump "completed all daily missions today" counter — used by the
            // "Disciplined Day" badge. Only counts once per day per character.
            const allDone = updatedMissions.every(m => m.claimed);
            const today = updatedChar.dailyMissionsDate;
            const lastAllDoneDay = updatedChar.achievements?.lastAllMissionsDay;
            if (allDone && today && today !== lastAllDoneDay) {
                updatedChar = {
                    ...updatedChar,
                    achievements: {
                        ...(updatedChar.achievements || {}),
                        dailyMissionsCompletedDays:
                            (updatedChar.achievements?.dailyMissionsCompletedDays || 0) + 1,
                        lastAllMissionsDay: today,
                    },
                };
            }

            return {
                ...state,
                character: updatedChar,
                log: [{ id: Date.now(), message: `Mission claimed: ${mission.title}! +${xpGain} XP, +${goldGain} G`, type: 'reward' }, ...state.log],
                ...(res?.levelUp ? { showLevelUpModal: true, newLevelData: { level: updatedChar.level, stats: updatedChar.stats } } : {}),
            };
        }

        case 'CLOSE_LEVEL_UP_MODAL':
            return { ...state, showLevelUpModal: false, newLevelData: null };

        case 'CLOSE_DAILY_REWARD':
            return { ...state, showDailyRewardModal: false, dailyRewardData: null };

        case 'UPDATE_AVATAR': {
            const { avatarId, colors, cost } = action.payload;
            if (cost && state.character.gold < cost) return state;

            return {
                ...state,
                character: {
                    ...state.character,
                    avatarId: avatarId || state.character.avatarId,
                    avatarColors: colors || state.character.avatarColors,
                    gold: state.character.gold - (cost || 0)
                },
                log: [{ id: Date.now(), message: `Updated avatar appearance${cost ? ` for ${cost} Gold` : ''}`, type: 'info' }, ...state.log]
            };
        }

        default:
            return state;
    }
};
