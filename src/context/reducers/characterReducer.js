import { 
    calculateMaxHp, 
    calculateXpReq, 
    calculateUpdatedStats,
    checkBadges
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
                    unlockedBadges: []
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
                    inventory: [...state.character.inventory, item]
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

            if (item.name === 'Health Potion') {
                newChar.hp = { ...newChar.hp, current: Math.min(newChar.hp.max, newChar.hp.current + 50) };
                logMsg += ` Restored 50 HP.`;
            } else if (item.name === 'Gold Pouch') {
                const goldAmount = Math.floor(Math.random() * 200) + 100;
                newChar.gold = (newChar.gold || 0) + goldAmount;
                logMsg += ` Found ${goldAmount} Gold!`;
            } else if (item.name === 'Mystery Chest') {
                const roll = Math.random();
                if (roll < 0.5) {
                    const goldAmount = Math.floor(Math.random() * 400) + 100;
                    newChar.gold = (newChar.gold || 0) + goldAmount;
                    logMsg += ` Found ${goldAmount} Gold!`;
                } else if (roll < 0.9) {
                    newChar.gold = (newChar.gold || 0) + 500;
                    logMsg += ` Jackpot: 500 Gold!`;
                }
                // Hatching is handled by petReducer
            }

            if (item.effect?.hp) {
                newChar.hp = { ...newChar.hp, current: Math.min(newChar.hp.max, newChar.hp.current + item.effect.hp) };
                logMsg += ` Restored ${item.effect.hp} HP.`;
            }

            return {
                ...state,
                character: newChar,
                log: [{ id: Date.now(), message: logMsg, type: 'info' }, ...state.log]
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
