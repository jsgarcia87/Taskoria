import spriteSheet from '../assets/sprites_items.png';

export const ITEM_TYPES = {
    GEAR: 'gear',
    CONSUMABLE: 'consumable',
    PET_FOOD: 'pet_food',
    MATERIAL: 'material'
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
    },

    // ─────────────────────────────────────────────────────────────────
    //  EXPANSION — 11 themed sets (1 per class without one) + consumables
    //  Each set: helm + body + signature weapon, sharing a setId for bonuses
    // ─────────────────────────────────────────────────────────────────

    // PALADIN — "sacred" set (gold + white, holy theme)
    { id: 'helm_sacred', name: 'Sacred Helm', cost: 180, description: '+2 CON | +1 WILL', type: ITEM_TYPES.GEAR, slot: EQUIPMENT_SLOTS.HEAD, stats: { con: 2, will: 1 }, sprite: { src: spriteSheet, x: 32, y: 32, width: 32, height: 32 }, icon: 'shield', color: '#fbbf24', setId: 'sacred', visualType: 'helm_basic' },
    { id: 'armor_sacred', name: 'Sacred Plate', cost: 320, description: '+3 CON | +1 WILL', type: ITEM_TYPES.GEAR, slot: EQUIPMENT_SLOTS.BODY, stats: { con: 3, will: 1 }, sprite: { src: spriteSheet, x: 64, y: 32, width: 32, height: 32 }, rarity: RARITY.RARE, icon: 'shirt', color: '#fde68a', setId: 'sacred', visualType: 'armor_plate' },
    { id: 'mace_sacred', name: 'Sacred Mace', cost: 240, description: '+4 STR | +1 WILL', type: ITEM_TYPES.GEAR, slot: EQUIPMENT_SLOTS.MAIN_HAND, stats: { str: 4, will: 1 }, sprite: { src: spriteSheet, x: 32, y: 0, width: 32, height: 32 }, icon: 'zap', color: '#fbbf24', setId: 'sacred', visualType: 'sword_basic' },

    // BARBARIAN — "savage" set (fur + bone, brutal theme)
    { id: 'helm_savage', name: 'Bone Helm', cost: 150, description: '+2 STR | +1 CON', type: ITEM_TYPES.GEAR, slot: EQUIPMENT_SLOTS.HEAD, stats: { str: 2, con: 1 }, sprite: { src: spriteSheet, x: 32, y: 32, width: 32, height: 32 }, icon: 'shield', color: '#a16207', setId: 'savage', visualType: 'helm_basic' },
    { id: 'armor_savage', name: 'Furred Hide', cost: 260, description: '+2 STR | +2 CON', type: ITEM_TYPES.GEAR, slot: EQUIPMENT_SLOTS.BODY, stats: { str: 2, con: 2 }, sprite: { src: spriteSheet, x: 0, y: 32, width: 32, height: 32 }, icon: 'shirt', color: '#7c2d12', setId: 'savage', visualType: 'armor_basic' },
    { id: 'axe_savage', name: 'Greataxe', cost: 280, description: '+6 STR', type: ITEM_TYPES.GEAR, slot: EQUIPMENT_SLOTS.MAIN_HAND, stats: { str: 6 }, sprite: { src: spriteSheet, x: 32, y: 0, width: 32, height: 32 }, rarity: RARITY.RARE, icon: 'sword', color: '#dc2626', setId: 'savage', visualType: 'sword_basic' },

    // DRUID — "wildbloom" set (green + wood, nature theme)
    { id: 'helm_wildbloom', name: 'Leafcrown', cost: 160, description: '+1 WILL | +1 CON', type: ITEM_TYPES.GEAR, slot: EQUIPMENT_SLOTS.HEAD, stats: { will: 1, con: 1 }, sprite: { src: spriteSheet, x: 0, y: 32, width: 32, height: 32 }, icon: 'shield', color: '#22c55e', setId: 'wildbloom', visualType: 'helm_hood' },
    { id: 'armor_wildbloom', name: 'Bark Vestment', cost: 240, description: '+2 WILL | +1 CON | +5 HP', type: ITEM_TYPES.GEAR, slot: EQUIPMENT_SLOTS.BODY, stats: { will: 2, con: 1, hp: 5 }, sprite: { src: spriteSheet, x: 32, y: 32, width: 32, height: 32 }, icon: 'shirt', color: '#15803d', setId: 'wildbloom', visualType: 'armor_robe' },
    { id: 'staff_wildbloom', name: 'Living Branch', cost: 220, description: '+4 WILL | +1 INT', type: ITEM_TYPES.GEAR, slot: EQUIPMENT_SLOTS.MAIN_HAND, stats: { will: 4, int: 1 }, sprite: { src: spriteSheet, x: 64, y: 0, width: 32, height: 32 }, icon: 'zap', color: '#16a34a', setId: 'wildbloom', visualType: 'staff_basic' },

    // MONK — "ascetic" set (cloth, simple)
    { id: 'helm_ascetic', name: "Pilgrim's Bandana", cost: 120, description: '+1 DEX | +1 WILL', type: ITEM_TYPES.GEAR, slot: EQUIPMENT_SLOTS.HEAD, stats: { dex: 1, will: 1 }, sprite: { src: spriteSheet, x: 0, y: 32, width: 32, height: 32 }, icon: 'shield', color: '#e8a05a', setId: 'ascetic', visualType: 'helm_hood' },
    { id: 'armor_ascetic', name: 'Spirit Gi', cost: 200, description: '+2 DEX | +2 WILL', type: ITEM_TYPES.GEAR, slot: EQUIPMENT_SLOTS.BODY, stats: { dex: 2, will: 2 }, sprite: { src: spriteSheet, x: 32, y: 32, width: 32, height: 32 }, icon: 'shirt', color: '#f97316', setId: 'ascetic', visualType: 'armor_robe' },
    { id: 'staff_ascetic', name: 'Bo Staff', cost: 210, description: '+3 DEX | +2 WILL', type: ITEM_TYPES.GEAR, slot: EQUIPMENT_SLOTS.MAIN_HAND, stats: { dex: 3, will: 2 }, sprite: { src: spriteSheet, x: 64, y: 0, width: 32, height: 32 }, icon: 'zap', color: '#c2410c', setId: 'ascetic', visualType: 'staff_basic' },

    // NECROMANCER — "bone" set (gray + purple, death theme)
    { id: 'helm_bone', name: 'Skullcap', cost: 200, description: '+2 INT | +1 CHA', type: ITEM_TYPES.GEAR, slot: EQUIPMENT_SLOTS.HEAD, stats: { int: 2, cha: 1 }, sprite: { src: spriteSheet, x: 32, y: 32, width: 32, height: 32 }, icon: 'shield', color: '#6b21a8', setId: 'bone', visualType: 'helm_basic' },
    { id: 'robe_bone', name: 'Shroud of Bone', cost: 320, description: '+3 INT | +1 CHA', type: ITEM_TYPES.GEAR, slot: EQUIPMENT_SLOTS.BODY, stats: { int: 3, cha: 1 }, sprite: { src: spriteSheet, x: 32, y: 32, width: 32, height: 32 }, rarity: RARITY.RARE, icon: 'shirt', color: '#4c1d95', setId: 'bone', visualType: 'armor_robe' },
    { id: 'staff_bone', name: 'Bonewand', cost: 340, description: '+5 INT | +1 CHA', type: ITEM_TYPES.GEAR, slot: EQUIPMENT_SLOTS.MAIN_HAND, stats: { int: 5, cha: 1 }, sprite: { src: spriteSheet, x: 64, y: 0, width: 32, height: 32 }, rarity: RARITY.RARE, icon: 'zap', color: '#7e22ce', setId: 'bone', visualType: 'staff_basic' },

    // ANTIPALADIN — "corrupted" set (dark red + black)
    { id: 'helm_corrupted', name: 'Cursed Helm', cost: 220, description: '+2 STR | +1 CHA', type: ITEM_TYPES.GEAR, slot: EQUIPMENT_SLOTS.HEAD, stats: { str: 2, cha: 1 }, sprite: { src: spriteSheet, x: 32, y: 32, width: 32, height: 32 }, icon: 'shield', color: '#7f1d1d', setId: 'corrupted', visualType: 'helm_basic' },
    { id: 'armor_corrupted', name: 'Blackened Mail', cost: 360, description: '+3 STR | +1 CHA | +10 HP', type: ITEM_TYPES.GEAR, slot: EQUIPMENT_SLOTS.BODY, stats: { str: 3, cha: 1, hp: 10 }, sprite: { src: spriteSheet, x: 64, y: 32, width: 32, height: 32 }, rarity: RARITY.RARE, icon: 'shirt', color: '#450a0a', setId: 'corrupted', visualType: 'armor_plate' },
    { id: 'sword_corrupted', name: 'Vile Blade', cost: 400, description: '+5 STR | +2 CHA', type: ITEM_TYPES.GEAR, slot: EQUIPMENT_SLOTS.MAIN_HAND, stats: { str: 5, cha: 2 }, sprite: { src: spriteSheet, x: 32, y: 0, width: 32, height: 32 }, rarity: RARITY.RARE, icon: 'sword', color: '#991b1b', setId: 'corrupted', visualType: 'sword_basic' },

    // SORCERER — "ember" set (red + fire)
    { id: 'helm_ember', name: 'Ember Hood', cost: 180, description: '+1 CHA | +2 WILL', type: ITEM_TYPES.GEAR, slot: EQUIPMENT_SLOTS.HEAD, stats: { cha: 1, will: 2 }, sprite: { src: spriteSheet, x: 0, y: 32, width: 32, height: 32 }, icon: 'shield', color: '#ea580c', setId: 'ember', visualType: 'helm_hood' },
    { id: 'robe_ember', name: 'Robe of Flames', cost: 280, description: '+2 CHA | +1 INT | +1 WILL', type: ITEM_TYPES.GEAR, slot: EQUIPMENT_SLOTS.BODY, stats: { cha: 2, int: 1, will: 1 }, sprite: { src: spriteSheet, x: 32, y: 32, width: 32, height: 32 }, icon: 'shirt', color: '#dc2626', setId: 'ember', visualType: 'armor_robe' },
    { id: 'wand_ember', name: 'Searing Wand', cost: 300, description: '+4 CHA | +2 INT', type: ITEM_TYPES.GEAR, slot: EQUIPMENT_SLOTS.MAIN_HAND, stats: { cha: 4, int: 2 }, sprite: { src: spriteSheet, x: 64, y: 0, width: 32, height: 32 }, icon: 'zap', color: '#f97316', setId: 'ember', visualType: 'staff_basic' },

    // SCOUT — "shadow" set (dark green + leather)
    { id: 'helm_shadow', name: 'Shadow Cowl', cost: 140, description: '+2 DEX | +1 INT', type: ITEM_TYPES.GEAR, slot: EQUIPMENT_SLOTS.HEAD, stats: { dex: 2, int: 1 }, sprite: { src: spriteSheet, x: 0, y: 32, width: 32, height: 32 }, icon: 'shield', color: '#14532d', setId: 'shadow', visualType: 'helm_hood' },
    { id: 'armor_shadow', name: 'Ranger Leather', cost: 220, description: '+2 DEX | +1 INT | +5 HP', type: ITEM_TYPES.GEAR, slot: EQUIPMENT_SLOTS.BODY, stats: { dex: 2, int: 1, hp: 5 }, sprite: { src: spriteSheet, x: 0, y: 32, width: 32, height: 32 }, icon: 'shirt', color: '#166534', setId: 'shadow', visualType: 'armor_basic' },
    { id: 'bow_shadow', name: 'Shadow Bow', cost: 260, description: '+5 DEX', type: ITEM_TYPES.GEAR, slot: EQUIPMENT_SLOTS.MAIN_HAND, stats: { dex: 5 }, sprite: { src: spriteSheet, x: 96, y: 0, width: 32, height: 32 }, icon: 'sword', color: '#15803d', setId: 'shadow', visualType: 'dagger_basic' },

    // CLERIC — "divine" set (white + gold)
    { id: 'helm_divine', name: 'Halo Circlet', cost: 200, description: '+2 WILL | +1 CHA', type: ITEM_TYPES.GEAR, slot: EQUIPMENT_SLOTS.HEAD, stats: { will: 2, cha: 1 }, sprite: { src: spriteSheet, x: 32, y: 32, width: 32, height: 32 }, icon: 'shield', color: '#fde68a', setId: 'divine', visualType: 'helm_basic' },
    { id: 'robe_divine', name: 'Vestments of Light', cost: 300, description: '+3 WILL | +1 CHA', type: ITEM_TYPES.GEAR, slot: EQUIPMENT_SLOTS.BODY, stats: { will: 3, cha: 1 }, sprite: { src: spriteSheet, x: 32, y: 32, width: 32, height: 32 }, rarity: RARITY.RARE, icon: 'shirt', color: '#f5f5f4', setId: 'divine', visualType: 'armor_robe' },
    { id: 'mace_divine', name: 'Mace of Dawn', cost: 280, description: '+3 WILL | +2 CHA | +1 STR', type: ITEM_TYPES.GEAR, slot: EQUIPMENT_SLOTS.MAIN_HAND, stats: { will: 3, cha: 2, str: 1 }, sprite: { src: spriteSheet, x: 32, y: 0, width: 32, height: 32 }, icon: 'zap', color: '#fbbf24', setId: 'divine', visualType: 'sword_basic' },

    // RANGER — "forest" set (green + brown)
    { id: 'helm_forest', name: 'Forester Cap', cost: 140, description: '+2 DEX | +1 CON', type: ITEM_TYPES.GEAR, slot: EQUIPMENT_SLOTS.HEAD, stats: { dex: 2, con: 1 }, sprite: { src: spriteSheet, x: 0, y: 32, width: 32, height: 32 }, icon: 'shield', color: '#65a30d', setId: 'forest', visualType: 'helm_hood' },
    { id: 'armor_forest', name: 'Greenmail', cost: 230, description: '+2 DEX | +2 CON', type: ITEM_TYPES.GEAR, slot: EQUIPMENT_SLOTS.BODY, stats: { dex: 2, con: 2 }, sprite: { src: spriteSheet, x: 0, y: 32, width: 32, height: 32 }, icon: 'shirt', color: '#3f6212', setId: 'forest', visualType: 'armor_basic' },
    { id: 'bow_forest', name: 'Longbow', cost: 250, description: '+4 DEX | +1 CON', type: ITEM_TYPES.GEAR, slot: EQUIPMENT_SLOTS.MAIN_HAND, stats: { dex: 4, con: 1 }, sprite: { src: spriteSheet, x: 96, y: 0, width: 32, height: 32 }, icon: 'sword', color: '#84cc16', setId: 'forest', visualType: 'dagger_basic' },

    // BARD — "royal" set (purple + gold)
    { id: 'helm_royal', name: "Minstrel's Hat", cost: 160, description: '+2 CHA | +1 INT', type: ITEM_TYPES.GEAR, slot: EQUIPMENT_SLOTS.HEAD, stats: { cha: 2, int: 1 }, sprite: { src: spriteSheet, x: 0, y: 32, width: 32, height: 32 }, icon: 'shield', color: '#a855f7', setId: 'royal', visualType: 'helm_hood' },
    { id: 'robe_royal', name: 'Royal Doublet', cost: 240, description: '+2 CHA | +1 INT | +1 DEX', type: ITEM_TYPES.GEAR, slot: EQUIPMENT_SLOTS.BODY, stats: { cha: 2, int: 1, dex: 1 }, sprite: { src: spriteSheet, x: 32, y: 32, width: 32, height: 32 }, icon: 'shirt', color: '#7e22ce', setId: 'royal', visualType: 'armor_robe' },
    { id: 'lute_royal', name: 'Enchanted Lute', cost: 280, description: '+5 CHA | +1 INT', type: ITEM_TYPES.GEAR, slot: EQUIPMENT_SLOTS.MAIN_HAND, stats: { cha: 5, int: 1 }, sprite: { src: spriteSheet, x: 64, y: 0, width: 32, height: 32 }, icon: 'zap', color: '#c084fc', setId: 'royal', visualType: 'staff_basic' },

    // ─────────────────────────────────────────────────────────────────
    //  CONSUMABLES — buyable potions, eggs, scrolls
    // ─────────────────────────────────────────────────────────────────
    {
        id: 'potion_hp_medium',
        name: 'Health Potion',
        cost: 60,
        description: 'Restores 50 HP',
        type: ITEM_TYPES.CONSUMABLE,
        effect: { hp: 50 },
        sprite: { src: spriteSheet, x: 0, y: 0, width: 32, height: 32 },
        icon: 'heart', color: '#dc2626',
        rarity: RARITY.COMMON,
    },
    {
        id: 'potion_hp_large',
        name: 'Greater Health Potion',
        cost: 150,
        description: 'Restores 100 HP',
        type: ITEM_TYPES.CONSUMABLE,
        effect: { hp: 100 },
        sprite: { src: spriteSheet, x: 0, y: 0, width: 32, height: 32 },
        icon: 'heart', color: '#b91c1c',
        rarity: RARITY.RARE,
    },
    {
        id: 'pet_egg_common',
        name: 'Common Pet Egg',
        cost: 200,
        description: 'Hatches a common companion',
        type: ITEM_TYPES.CONSUMABLE,
        effect: { hatch: true },
        sprite: { src: spriteSheet, x: 64, y: 32, width: 32, height: 32 },
        icon: 'box', color: '#a8a29e',
        rarity: RARITY.COMMON,
    },
    {
        id: 'gold_pouch_consumable',
        name: 'Pouch of Coins',
        cost: 0,
        description: 'Grants 100-300 Gold (random)',
        type: ITEM_TYPES.CONSUMABLE,
        effect: { gold: 200 },
        sprite: { src: spriteSheet, x: 0, y: 0, width: 32, height: 32 },
        icon: 'coins', color: '#fbbf24',
        rarity: RARITY.COMMON,
    },
    {
        id: 'mystery_chest',
        name: 'Mystery Chest',
        cost: 350,
        description: 'Contains a random treasure',
        type: ITEM_TYPES.CONSUMABLE,
        effect: { mysteryChest: true },
        sprite: { src: spriteSheet, x: 64, y: 32, width: 32, height: 32 },
        icon: 'box', color: '#9333ea',
        rarity: RARITY.RARE,
    },
    {
        id: 'tome_of_insight',
        name: 'Tome of Insight',
        cost: 400,
        description: 'Instant +200 XP',
        type: ITEM_TYPES.CONSUMABLE,
        effect: { xp: 200 },
        sprite: { src: spriteSheet, x: 64, y: 0, width: 32, height: 32 },
        icon: 'book', color: '#3b82f6',
        rarity: RARITY.RARE,
    },

    // ─────────────────────────────────────────────────────────────────
    //  MATERIALS — droppable crafting ingredients (not buyable)
    // ─────────────────────────────────────────────────────────────────
    { id: 'iron_ore', name: 'Iron Ore', cost: 0, description: 'Ore refined in the forge', type: ITEM_TYPES.MATERIAL, sprite: { src: spriteSheet, x: 0, y: 0, width: 32, height: 32 }, icon: 'hammer', color: '#94a3b8', rarity: RARITY.COMMON },
    { id: 'ancient_wood', name: 'Ancient Wood', cost: 0, description: 'Timber from the Mystic Forest', type: ITEM_TYPES.MATERIAL, sprite: { src: spriteSheet, x: 0, y: 0, width: 32, height: 32 }, icon: 'tree-pine', color: '#65a30d', rarity: RARITY.COMMON },
    { id: 'crystal_shard', name: 'Crystal Shard', cost: 0, description: 'A shard humming with magic', type: ITEM_TYPES.MATERIAL, sprite: { src: spriteSheet, x: 0, y: 0, width: 32, height: 32 }, icon: 'diamond', color: '#38bdf8', rarity: RARITY.COMMON },
    { id: 'shadow_silk', name: 'Shadow Silk', cost: 0, description: 'Thread spun from shadow', type: ITEM_TYPES.MATERIAL, sprite: { src: spriteSheet, x: 0, y: 0, width: 32, height: 32 }, icon: 'wind', color: '#6b21a8', rarity: RARITY.RARE },
    { id: 'dragon_scale', name: 'Dragon Scale', cost: 0, description: 'Scale of a fallen world boss', type: ITEM_TYPES.MATERIAL, sprite: { src: spriteSheet, x: 0, y: 0, width: 32, height: 32 }, icon: 'flame', color: '#dc2626', rarity: RARITY.EPIC },
    { id: 'void_essence', name: 'Void Essence', cost: 0, description: 'Essence of the crypts', type: ITEM_TYPES.MATERIAL, sprite: { src: spriteSheet, x: 0, y: 0, width: 32, height: 32 }, icon: 'skull', color: '#4c1d95', rarity: RARITY.EPIC },
];

export const SET_BONUSES = {
    // Original 3 sets — kept for backwards compatibility
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
    ],
    // ─── New class-themed sets (1 per remaining class) ───
    'sacred': [
        { count: 2, label: '+10 HP', stats: { hp: 10 } },
        { count: 3, label: '+15% Holy Damage', bonuses: { dmg: 15 } }
    ],
    'savage': [
        { count: 2, label: '+15 HP', stats: { hp: 15 } },
        { count: 3, label: '+20% Attack', bonuses: { dmg: 20 } }
    ],
    'wildbloom': [
        { count: 2, label: '+10% XP', bonuses: { xp: 10 } },
        { count: 3, label: '+15% Will', stats: { will: 1.15, isMultiplier: true } }
    ],
    'ascetic': [
        { count: 2, label: '+5% XP', bonuses: { xp: 5 } },
        { count: 3, label: '+10% Dex & Will', stats: { dex: 1.1, will: 1.1, isMultiplier: true } }
    ],
    'bone': [
        { count: 2, label: '+10% XP', bonuses: { xp: 10 } },
        { count: 3, label: '+15% Int', stats: { int: 1.15, isMultiplier: true } }
    ],
    'corrupted': [
        { count: 2, label: '+10% Gold', bonuses: { gold: 10 } },
        { count: 3, label: '+15% Attack', bonuses: { dmg: 15 } }
    ],
    'ember': [
        { count: 2, label: '+10% XP', bonuses: { xp: 10 } },
        { count: 3, label: '+15% Cha', stats: { cha: 1.15, isMultiplier: true } }
    ],
    'shadow': [
        { count: 2, label: '+10% Gold', bonuses: { gold: 10 } },
        { count: 3, label: '+15% Dex', stats: { dex: 1.15, isMultiplier: true } }
    ],
    'divine': [
        { count: 2, label: '+15 HP', stats: { hp: 15 } },
        { count: 3, label: '+15% Will', stats: { will: 1.15, isMultiplier: true } }
    ],
    'forest': [
        { count: 2, label: '+10 HP', stats: { hp: 10 } },
        { count: 3, label: '+10% Dex & Con', stats: { dex: 1.1, con: 1.1, isMultiplier: true } }
    ],
    'royal': [
        { count: 2, label: '+10% Gold', bonuses: { gold: 10 } },
        { count: 3, label: '+15% Cha', stats: { cha: 1.15, isMultiplier: true } }
    ],
};
