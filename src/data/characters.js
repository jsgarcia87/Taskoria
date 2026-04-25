import spriteSheet from '../assets/sprites_characters.png';

export const CHARACTER_CLASSES = {
    FIGHTER: 'Fighter',
    WIZARD: 'Wizard',
    ROGUE: 'Rogue',
    CLERIC: 'Cleric',
    PALADIN: 'Paladin',
    RANGER: 'Ranger',
    BARBARIAN: 'Barbarian',
    BARD: 'Bard',
    DRUID: 'Druid',
    MONK: 'Monk',
    NECROMANCER: 'Necromancer',
    ANTIPALADIN: 'Antipaladin',
    SORCERER: 'Sorcerer',
    SCOUT: 'Scout'
};

export const CHARACTERS = [
    {
        id: 'fighter',
        name: 'Fighter',
        class: CHARACTER_CLASSES.FIGHTER,
        baseStats: { str: 16, int: 8, dex: 12, con: 15, cha: 10, will: 10 },
        avatarType: 'warrior'
    },
    {
        id: 'paladin',
        name: 'Paladin',
        class: CHARACTER_CLASSES.PALADIN,
        baseStats: { str: 15, int: 10, dex: 9, con: 14, cha: 12, will: 14 },
        avatarType: 'paladin'
    },
    {
        id: 'wizard',
        name: 'Wizard',
        class: CHARACTER_CLASSES.WIZARD,
        baseStats: { str: 8, int: 16, dex: 10, con: 10, cha: 12, will: 14 },
        avatarType: 'mage'
    },
    {
        id: 'rogue',
        name: 'Rogue',
        class: CHARACTER_CLASSES.ROGUE,
        baseStats: { str: 10, int: 10, dex: 16, con: 12, cha: 14, will: 10 },
        avatarType: 'rogue'
    },
    {
        id: 'cleric',
        name: 'Cleric',
        class: CHARACTER_CLASSES.CLERIC,
        baseStats: { str: 10, int: 14, dex: 10, con: 12, cha: 15, will: 15 },
        avatarType: 'cleric'
    },
    {
        id: 'ranger',
        name: 'Ranger',
        class: CHARACTER_CLASSES.RANGER,
        baseStats: { str: 12, int: 10, dex: 16, con: 12, cha: 10, will: 12 },
        avatarType: 'ranger'
    },
    {
        id: 'barbarian',
        name: 'Barbarian',
        class: CHARACTER_CLASSES.BARBARIAN,
        baseStats: { str: 18, int: 6, dex: 12, con: 16, cha: 8, will: 8 },
        avatarType: 'barbarian'
    },
    {
        id: 'bard',
        name: 'Bard',
        class: CHARACTER_CLASSES.BARD,
        baseStats: { str: 8, int: 12, dex: 14, con: 10, cha: 18, will: 12 },
        avatarType: 'bard'
    },
    {
        id: 'druid',
        name: 'Druid',
        class: CHARACTER_CLASSES.DRUID,
        baseStats: { str: 10, int: 15, dex: 10, con: 13, cha: 11, will: 15 },
        avatarType: 'druid'
    },
    {
        id: 'monk',
        name: 'Monk',
        class: CHARACTER_CLASSES.MONK,
        baseStats: { str: 12, int: 10, dex: 16, con: 14, cha: 10, will: 14 },
        avatarType: 'monk'
    },
    {
        id: 'necromancer',
        name: 'Necromancer',
        class: CHARACTER_CLASSES.NECROMANCER,
        baseStats: { str: 6, int: 18, dex: 10, con: 10, cha: 8, will: 16 },
        avatarType: 'necromancer'
    },
    {
        id: 'antipaladin',
        name: 'Antipaladin',
        class: CHARACTER_CLASSES.ANTIPALADIN,
        baseStats: { str: 16, int: 10, dex: 10, con: 15, cha: 12, will: 12 },
        avatarType: 'antipaladin'
    },
    {
        id: 'sorcerer',
        name: 'Sorcerer',
        class: CHARACTER_CLASSES.SORCERER,
        baseStats: { str: 8, int: 17, dex: 12, con: 10, cha: 16, will: 12 },
        avatarType: 'sorcerer'
    },
    {
        id: 'scout',
        name: 'Scout',
        class: CHARACTER_CLASSES.SCOUT,
        baseStats: { str: 10, int: 12, dex: 18, con: 12, cha: 10, will: 10 },
        avatarType: 'scout'
    }
];
