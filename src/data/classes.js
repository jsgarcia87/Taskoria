// ─────────────────────────────────────────────────────────────────────────────
// Class registry — the single source of truth for Taskoria's hero classes.
//
// Everything class-related derives from here: creation screen (characters.js),
// level-up and combat mechanics (gameUtils CLASS_CONFIG), the profile theme
// (CharacterSheet), signature perks (utils/classPerks.js) and the Forja de
// Clases roster (public/admin-tools/character_builder.html mirrors `forge`).
//
// Adding a class = one entry here + one blueprint in character_blueprints.json
// (with `roles`). Run `node scripts/validate-classes.mjs` to check both agree.
//
// Canon: taskoria-lore §4 (archetypes) · taskoria-rules §5 (synergy + perks).
// Keep this file free of JSX/asset imports so node scripts can load it.
// ─────────────────────────────────────────────────────────────────────────────

export const STAT_KEYS = ['str', 'dex', 'con', 'int', 'will', 'cha'];

// Silhouette families share a base body/rig in the Forge and the same
// blueprint palette-role layout. New classes should pick one.
export const CLASS_FAMILIES = {
    armored: 'Helmet + plate, shield or heavy weapon',
    robed:   'Hood + long robe, staff with focus',
    common:  'Bare head + tunic, light gear',
};

export const CLASSES = [
    {
        id: 'fighter', name: 'Fighter', avatarType: 'warrior', family: 'armored',
        archetype: 'The constant — shows up every day and does the work.',
        baseStats: { str: 16, int: 8, dex: 12, con: 15, cha: 10, will: 10 },
        levelStats: { str: 2, con: 1 },
        combatStats: ['str'],
        affinity: ['str', 'con'],
        perk: { id: 'steady', label: 'Steady Hand', desc: '+5% XP on every completed quest.' },
        theme: { accent: '#ef4444', icon: 'swords', skillsLabel: 'Battle Stances', gearLabel: 'Armory' },
        forge: { silhouette: 'Closed helmet + plated torso + large shield.' },
    },
    {
        id: 'paladin', name: 'Paladin', avatarType: 'paladin', family: 'armored',
        archetype: 'The committed — keeps promises made to others.',
        baseStats: { str: 15, int: 10, dex: 9, con: 14, cha: 12, will: 14 },
        levelStats: { str: 1, con: 1, will: 1 },
        combatStats: ['str', 'will'],
        affinity: ['will', 'cha'],
        perk: { id: 'oath', label: 'Oathkeeper', desc: '+15% XP on quests assigned by someone else.' },
        theme: { accent: '#f59e0b', icon: 'cross', skillsLabel: 'Sacred Oaths', gearLabel: 'Arsenal' },
        forge: { silhouette: 'Crested helm + heraldic shield + short ceremonial cape.' },
    },
    {
        id: 'wizard', name: 'Wizard', avatarType: 'mage', family: 'robed',
        archetype: 'The planner — schedules deep work ahead of time.',
        baseStats: { str: 8, int: 16, dex: 10, con: 10, cha: 12, will: 14 },
        levelStats: { int: 2, will: 1 },
        combatStats: ['int'],
        affinity: ['int'],
        perk: { id: 'foresight', label: 'Foresight', desc: '+15% XP on INT quests planned at least a day ahead.' },
        theme: { accent: '#818cf8', icon: 'hat', skillsLabel: 'Arcane Arts', gearLabel: 'Arcanum' },
        forge: { silhouette: 'Pointed hood + long cape + staff with glowing orb.' },
    },
    {
        id: 'rogue', name: 'Rogue', avatarType: 'rogue', family: 'common',
        archetype: 'The efficient — finds the legitimate shortcut.',
        baseStats: { str: 10, int: 10, dex: 16, con: 12, cha: 14, will: 10 },
        levelStats: { dex: 2, cha: 1 },
        combatStats: ['dex'],
        affinity: ['dex'],
        perk: { id: 'early_bird', label: 'Clean Getaway', desc: '+25% gold on quests finished a day or more before the deadline.' },
        theme: { accent: '#10b981', icon: 'dagger', skillsLabel: 'Shadow Tricks', gearLabel: 'Stash' },
        forge: { silhouette: 'Low hood + light bracers + short hidden blade.' },
    },
    {
        id: 'cleric', name: 'Cleric', avatarType: 'cleric', family: 'robed',
        archetype: 'The healer — mends broken streaks.',
        baseStats: { str: 10, int: 14, dex: 10, con: 12, cha: 15, will: 15 },
        levelStats: { will: 2, cha: 1 },
        combatStats: ['will', 'cha'],
        affinity: ['con', 'will'],
        perk: { id: 'mend', label: 'Mending Light', desc: '+25% XP when a broken streak is restarted.' },
        theme: { accent: '#fbbf24', icon: 'chalice', skillsLabel: 'Divine Rites', gearLabel: 'Vestments' },
        forge: { silhouette: 'Simple hood + staff with holy symbol + wide robe, no blades.' },
    },
    {
        id: 'ranger', name: 'Ranger', avatarType: 'ranger', family: 'common',
        archetype: 'The long-haul organizer — advances multi-day projects.',
        baseStats: { str: 12, int: 10, dex: 16, con: 12, cha: 10, will: 12 },
        levelStats: { dex: 1, con: 1, will: 1 },
        combatStats: ['dex'],
        affinity: ['dex', 'will'],
        perk: { id: 'trailblazer', label: 'Trailblazer', desc: '+15% XP on quests that belong to a project.' },
        theme: { accent: '#22c55e', icon: 'bow', skillsLabel: 'Wild Craft', gearLabel: 'Kit' },
        forge: { silhouette: 'Fur hood + crossed quiver + tall leather boots.' },
    },
    {
        id: 'barbarian', name: 'Barbarian', avatarType: 'barbarian', family: 'armored',
        archetype: 'The burst — intense sprints of heavy work.',
        baseStats: { str: 18, int: 6, dex: 12, con: 16, cha: 8, will: 8 },
        levelStats: { str: 2, con: 2 },
        combatStats: ['str'],
        affinity: ['str'],
        perk: { id: 'rage', label: 'Battle Rage', desc: '+20% XP on hard quests once 3 hard quests are done today.' },
        theme: { accent: '#dc2626', icon: 'axe', skillsLabel: 'Primal Fury', gearLabel: 'War Spoils' },
        forge: { silhouette: 'Huge shoulders + wild hair + axe.' },
    },
    {
        id: 'bard', name: 'Bard', avatarType: 'bard', family: 'common',
        archetype: 'The social one — works best alongside others.',
        baseStats: { str: 8, int: 12, dex: 14, con: 10, cha: 18, will: 12 },
        levelStats: { cha: 2, int: 1 },
        combatStats: ['cha'],
        affinity: ['cha'],
        perk: { id: 'ensemble', label: 'Ensemble', desc: '+15% XP on quests completed while your focus status is shared with the party.' },
        theme: { accent: '#a78bfa', icon: 'note', skillsLabel: 'Performances', gearLabel: 'Repertoire' },
        forge: { silhouette: 'Wide-brim hat with feather + instrument on back + short colourful cape.' },
    },
    {
        id: 'druid', name: 'Druid', avatarType: 'druid', family: 'robed',
        archetype: 'The cyclical — habits tied to the rhythm of the day.',
        baseStats: { str: 10, int: 15, dex: 10, con: 13, cha: 11, will: 15 },
        levelStats: { will: 2, con: 1 },
        combatStats: ['will'],
        affinity: ['con', 'will'],
        perk: { id: 'cycles', label: 'Dawn & Dusk', desc: '+10% XP on recurring quests done before 9:00 or after 21:00.' },
        theme: { accent: '#4ade80', icon: 'leaf', skillsLabel: 'Nature Bonds', gearLabel: 'Grove Cache' },
        forge: { silhouette: 'Antlers or branches on the head + leaf robe + gnarled staff.' },
    },
    {
        id: 'monk', name: 'Monk', avatarType: 'monk', family: 'common',
        archetype: 'The disciplined — repetition until mastery.',
        baseStats: { str: 12, int: 10, dex: 16, con: 14, cha: 10, will: 14 },
        levelStats: { dex: 1, will: 1, con: 1 },
        combatStats: ['dex', 'will'],
        affinity: ['will', 'con'],
        perk: { id: 'discipline', label: 'Inner Discipline', desc: 'Streak bonus keeps growing for 45 days instead of 30.' },
        theme: { accent: '#f97316', icon: 'lotus', skillsLabel: 'Inner Forms', gearLabel: 'Wrappings' },
        forge: { silhouette: 'No cape or helmet — wrapped hands/feet, belt as the only ornament.' },
    },
    {
        id: 'necromancer', name: 'Necromancer', avatarType: 'necromancer', family: 'robed',
        archetype: 'The reviver — brings dead tasks back to life.',
        baseStats: { str: 6, int: 18, dex: 10, con: 10, cha: 8, will: 16 },
        levelStats: { int: 2, cha: 1 },
        combatStats: ['int'],
        affinity: ['int', 'will'],
        perk: { id: 'raise_dead', label: 'Raise the Dead', desc: '+30% XP on quests more than 14 days overdue.' },
        theme: { accent: '#7c3aed', icon: 'skull', skillsLabel: 'Dark Pacts', gearLabel: 'Reliquary' },
        forge: { silhouette: 'Dark pointed hood + skull sceptre + tattered cape.' },
    },
    {
        id: 'antipaladin', name: 'Antipaladin', avatarType: 'antipaladin', family: 'armored',
        archetype: 'The rule-breaker — gets it done off the plan.',
        baseStats: { str: 16, int: 10, dex: 10, con: 15, cha: 12, will: 12 },
        levelStats: { str: 1, cha: 1, will: 1 },
        combatStats: ['str', 'cha'],
        affinity: ['str', 'cha'],
        perk: { id: 'off_plan', label: 'Own Path', desc: '+10% XP on quests with no deadline and no project.' },
        theme: { accent: '#991b1b', icon: 'horns', skillsLabel: 'Dread Vows', gearLabel: 'Blight Forge' },
        forge: { silhouette: 'Horned dark helm + spiked shield + ragged black cape.' },
    },
    {
        id: 'sorcerer', name: 'Sorcerer', avatarType: 'sorcerer', family: 'robed',
        archetype: 'The impulsive talent — new idea, done the same day.',
        baseStats: { str: 8, int: 17, dex: 12, con: 10, cha: 16, will: 12 },
        levelStats: { cha: 2, will: 1 },
        combatStats: ['cha'],
        affinity: ['cha', 'int'],
        perk: { id: 'spark', label: 'Wild Spark', desc: '+10% XP on unplanned quests created and finished the same day.' },
        theme: { accent: '#c084fc', icon: 'orb', skillsLabel: 'Raw Channeling', gearLabel: 'Focus Array' },
        forge: { silhouette: 'Open hood with flame trim + bare focus crystal in hand + flowing sash.' },
    },
    {
        id: 'scout', name: 'Scout', avatarType: 'scout', family: 'common',
        archetype: 'The explorer — tries every new kind of quest.',
        baseStats: { str: 10, int: 12, dex: 18, con: 12, cha: 10, will: 10 },
        levelStats: { dex: 2, int: 1 },
        combatStats: ['dex'],
        affinity: ['dex', 'int'],
        perk: { id: 'discovery', label: 'First Steps', desc: 'One-time bonus XP the first time you complete a new kind of quest.' },
        theme: { accent: '#06b6d4', icon: 'eye', skillsLabel: 'Recon Tactics', gearLabel: 'Field Pack' },
        forge: { silhouette: 'Tight hood + bow on shoulder + short asymmetric cape.' },
    },
];

export const CLASSES_BY_ID = Object.fromEntries(CLASSES.map(c => [c.id, c]));
// Characters store the display name in `character.class` (e.g. 'Wizard').
export const CLASSES_BY_NAME = Object.fromEntries(CLASSES.map(c => [c.name, c]));

export const getClass = (nameOrId) =>
    CLASSES_BY_NAME[nameOrId] || CLASSES_BY_ID[String(nameOrId || '').toLowerCase()] || null;
