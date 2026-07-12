import { ITEMS, ITEM_TYPES, RARITY } from '../data/items.js';

const uid = (prefix) => `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

const DROPPABLE_ITEMS = ITEMS.filter(i =>
    i.type === ITEM_TYPES.GEAR ||
    i.type === ITEM_TYPES.CONSUMABLE ||
    i.type === ITEM_TYPES.MATERIAL
);

const LOOT_BY_RARITY = {
    [RARITY.COMMON]: DROPPABLE_ITEMS.filter(i => !i.rarity || i.rarity === RARITY.COMMON),
    [RARITY.RARE]:   DROPPABLE_ITEMS.filter(i => i.rarity === RARITY.RARE),
    [RARITY.EPIC]:   DROPPABLE_ITEMS.filter(i => i.rarity === RARITY.EPIC),
};

const POMODORO_POOL = {
    [RARITY.COMMON]: LOOT_BY_RARITY[RARITY.COMMON].filter(i => i.type !== ITEM_TYPES.GEAR),
    [RARITY.RARE]:   LOOT_BY_RARITY[RARITY.RARE].filter(i => i.type !== ITEM_TYPES.GEAR),
    [RARITY.EPIC]:   LOOT_BY_RARITY[RARITY.EPIC].filter(i => i.type !== ITEM_TYPES.GEAR),
};

function rollRarity(difficulty) {
    const hard = difficulty >= 3;
    const roll = Math.random();
    if (hard) {
        if (roll < 0.15) return RARITY.EPIC;
        if (roll < 0.50) return RARITY.RARE;
        return RARITY.COMMON;
    }
    if (roll < 0.05) return RARITY.EPIC;
    if (roll < 0.30) return RARITY.RARE;
    return RARITY.COMMON;
}

function pickFrom(pool) {
    if (!pool.length) return null;
    return pool[Math.floor(Math.random() * pool.length)];
}

export function generateLoot(difficulty, context) {
    let dropChance;
    if (context === 'pomodoro') {
        dropChance = Math.min(0.40, 0.10 + (difficulty || 0) * 0.05);
    } else {
        dropChance = difficulty === 3 ? 0.35 : (difficulty > 3 ? 0.50 : 0.15);
    }

    if (Math.random() >= dropChance) return null;

    const rarity = rollRarity(difficulty);
    const pool = context === 'pomodoro' ? POMODORO_POOL[rarity] : LOOT_BY_RARITY[rarity];
    const template = pickFrom(pool);
    if (!template) return null;

    return { ...template, id: uid('loot') };
}
