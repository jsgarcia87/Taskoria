import spriteSheet from '../assets/sprites_items.png';

export const ITEM_TYPES = {
    GEAR: 'gear',
    CONSUMABLE: 'consumable',
    PET_FOOD: 'pet_food'
};

export const RARITY = {
    COMMON: 'common',
    RARE: 'rare',
    EPIC: 'epic'
};

export const EQUIPMENT_SLOTS = {
    MAIN_HAND: 'mainHand',
    OFF_HAND: 'offHand',
    BODY: 'body',
    HEAD: 'head',
    RING: 'ring'
};

export const ITEMS = [
    // Consumables
    {
        id: 'potion_hp_small',
        name: 'Minor Health Potion',
        cost: 25,
        description: 'Restores 25 HP',
        type: ITEM_TYPES.CONSUMABLE,
        effect: { hp: 25 },
        sprite: { src: spriteSheet, x: 0, y: 0, width: 32, height: 32 }
    },
    {
        id: 'pet_egg_mystery',
        name: 'Mystery Pet Egg',
        cost: 500,
        description: 'Hatch a random companion!',
        type: ITEM_TYPES.CONSUMABLE,
        effect: { hatch: true },
        sprite: { src: spriteSheet, x: 64, y: 32, width: 32, height: 32 },
        rarity: RARITY.EPIC
    },

    // Weapons
    {
        id: 'sword_iron',
        name: 'Iron Sword',
        cost: 100,
        description: '+2 STR',
        type: ITEM_TYPES.GEAR,
        slot: EQUIPMENT_SLOTS.MAIN_HAND,
        stats: { str: 2 },
        sprite: { src: spriteSheet, x: 32, y: 0, width: 32, height: 32 },
        icon: 'sword', color: '#94a3b8',
        setId: 'iron',
        visualType: 'sword_basic'
    },
    {
        id: 'shield_wood',
        name: 'Wooden Shield',
        cost: 80,
        description: '+1 CON | +5 HP',
        type: ITEM_TYPES.GEAR,
        slot: EQUIPMENT_SLOTS.OFF_HAND,
        stats: { con: 1, hp: 5 },
        sprite: { src: spriteSheet, x: 0, y: 32, width: 32, height: 32 },
        icon: 'shield', color: '#9a3412',
        visualType: 'shield_basic'
    },
    {
        id: 'helm_iron',
        name: 'Iron Helmet',
        cost: 120,
        description: '+2 CON | +10 HP',
        type: ITEM_TYPES.GEAR,
        slot: EQUIPMENT_SLOTS.HEAD,
        stats: { con: 2, hp: 10 },
        sprite: { src: spriteSheet, x: 32, y: 32, width: 32, height: 32 },
        icon: 'shield', color: '#cbd5e1',
        setId: 'iron',
        visualType: 'helm_basic'
    },
    {
        id: 'staff_wood',
        name: 'Wooden Staff',
        cost: 100,
        description: '+2 INT',
        type: ITEM_TYPES.GEAR,
        slot: EQUIPMENT_SLOTS.MAIN_HAND,
        stats: { int: 2 },
        sprite: { src: spriteSheet, x: 64, y: 0, width: 32, height: 32 },
        icon: 'zap', color: '#8b5cf6',
        setId: 'scholar',
        visualType: 'staff_basic'
    },
    {
        id: 'dagger_iron',
        name: 'Iron Dagger',
        cost: 100,
        description: '+2 DEX',
        type: ITEM_TYPES.GEAR,
        slot: EQUIPMENT_SLOTS.MAIN_HAND,
        stats: { dex: 2 },
        sprite: { src: spriteSheet, x: 96, y: 0, width: 32, height: 32 },
        icon: 'sword', color: '#10b981',
        setId: 'rogue',
        visualType: 'dagger_basic'
    },

    // Armor
    {
        id: 'armor_leather',
        name: 'Leather Armor',
        cost: 150,
        description: '+1 DEX | +10 HP',
        type: ITEM_TYPES.GEAR,
        slot: EQUIPMENT_SLOTS.BODY,
        stats: { dex: 1, hp: 10 },
        sprite: { src: spriteSheet, x: 0, y: 32, width: 32, height: 32 },
        icon: 'shirt', color: '#4b5563',
        setId: 'rogue',
        visualType: 'armor_basic'
    },
    {
        id: 'armor_plate',
        name: 'Plate Armor',
        cost: 600,
        description: '+3 CON | +30 HP',
        type: ITEM_TYPES.GEAR,
        slot: EQUIPMENT_SLOTS.BODY,
        stats: { con: 3, hp: 30 },
        sprite: { src: spriteSheet, x: 64, y: 32, width: 32, height: 32 },
        rarity: RARITY.RARE,
        icon: 'shirt', color: '#e2e8f0',
        setId: 'iron',
        visualType: 'armor_plate'
    },

    // New Set Items
    {
        id: 'hood_rogue',
        name: 'Rogue Hood',
        cost: 150,
        description: '+1 DEX | +5 HP',
        type: ITEM_TYPES.GEAR,
        slot: EQUIPMENT_SLOTS.HEAD,
        stats: { dex: 1, hp: 5 },
        sprite: { src: spriteSheet, x: 0, y: 32, width: 32, height: 32 },
        icon: 'shield', color: '#111827',
        setId: 'rogue',
        visualType: 'helm_hood'
    },
    {
        id: 'robe_scholar',
        name: 'Scholar Robe',
        cost: 250,
        description: '+1 INT | +10 HP',
        type: ITEM_TYPES.GEAR,
        slot: EQUIPMENT_SLOTS.BODY,
        stats: { int: 1, hp: 10 },
        sprite: { src: spriteSheet, x: 32, y: 32, width: 32, height: 32 },
        icon: 'shirt', color: '#4338ca',
        setId: 'scholar',
        visualType: 'armor_robe'
    },

    // Accessories & Special
    {
        id: 'ring_str',
        name: 'Ring of Might',
        cost: 200,
        description: '+1 STR | +5% Gold',
        type: ITEM_TYPES.GEAR,
        slot: EQUIPMENT_SLOTS.RING,
        stats: { str: 1 },
        bonuses: { gold: 5 },
        sprite: { src: spriteSheet, x: 32, y: 32, width: 32, height: 32 },
        rarity: RARITY.COMMON,
        icon: 'zap', color: '#fbbf24'
    },
    {
        id: 'pendant_xp',
        name: 'Sage Pendant',
        cost: 350,
        description: '+1 INT | +10% XP',
        type: ITEM_TYPES.GEAR,
        slot: EQUIPMENT_SLOTS.RING,
        stats: { int: 1 },
        bonuses: { xp: 10 },
        sprite: { src: spriteSheet, x: 128, y: 32, width: 32, height: 32 },
        rarity: RARITY.RARE,
        icon: 'star', color: '#818cf8',
        setId: 'scholar'
    },
    // Rare / Epic Weapons
    {
        id: 'sword_crystal',
        name: 'Crystal Blade',
        cost: 800,
        description: '+8 STR | Rare',
        type: ITEM_TYPES.GEAR,
        slot: EQUIPMENT_SLOTS.MAIN_HAND,
        stats: { str: 8 },
        sprite: { src: spriteSheet, x: 128, y: 0, width: 32, height: 32 },
        rarity: RARITY.RARE,
        icon: 'sword', color: '#60a5fa',
        visualType: 'sword_basic'
    },
    {
        id: 'staff_void',
        name: 'Void Staff',
        cost: 1200,
        description: '+12 INT | Epic',
        type: ITEM_TYPES.GEAR,
        slot: EQUIPMENT_SLOTS.MAIN_HAND,
        stats: { int: 12 },
        sprite: { src: spriteSheet, x: 160, y: 0, width: 32, height: 32 },
        rarity: RARITY.EPIC,
        icon: 'zap', color: '#4c1d95',
        visualType: 'staff_basic'
    },

    // Pet Food
    {
        id: 'pet_food_meat',
        name: 'Monster Meat',
        cost: 50,
        description: 'Restores Pet Hunger',
        type: ITEM_TYPES.PET_FOOD,
        effect: { hunger: 40 },
        sprite: { src: spriteSheet, x: 0, y: 64, width: 32, height: 32 },
        rarity: RARITY.COMMON
    },
    {
        id: 'pet_food_golden_apple',
        name: 'Golden Apple',
        cost: 150,
        description: 'Restores fully + grants Pet XP',
        type: ITEM_TYPES.PET_FOOD,
        effect: { hunger: 100, xp: 50 },
        sprite: { src: spriteSheet, x: 32, y: 64, width: 32, height: 32 },
        rarity: RARITY.RARE
    }
];

export const SET_BONUSES = {
    'iron': [
        { count: 2, label: '+5 HP', stats: { hp: 5 } },
        { count: 3, label: '+10% Attack', bonuses: { dmg: 10 } }
    ],
    'scholar': [
        { count: 2, label: '+10% XP', bonuses: { xp: 10 } },
        { count: 3, label: '+20% Int', stats: { int: 1.2, isMultiplier: true } }
    ],
    'rogue': [
        { count: 2, label: '+5% Gold', bonuses: { gold: 5 } },
        { count: 3, label: '+10% Dex', stats: { dex: 1.1, isMultiplier: true } }
    ]
};
