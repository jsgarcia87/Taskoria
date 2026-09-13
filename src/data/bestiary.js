// =============================================================================
//  BESTIARY — Source of truth for enemies, bosses, zones, and combat spawning
//  Based on Jesús's hand-drawn bestiary + game design
// =============================================================================

export const DUNGEON_ZONES = {
  crypt:         { id: 'crypt',         name: 'Crypt',           palette: ['#2a2535','#3d3548','#5c5068','#9080a0'], unlockLevel: 1,  mapId: 'shadowCrypts' },
  cavern:        { id: 'cavern',        name: 'Cavern',          palette: ['#1a1a1a','#2d2d2d','#3d3830','#8a7860'], unlockLevel: 5,  mapId: null },
  elvenRuins:    { id: 'elvenRuins',    name: 'Elven Ruins',     palette: ['#d0e8d0','#a0c8a0','#608060','#40c870'], unlockLevel: 10, mapId: null },
  dwarfFortress: { id: 'dwarfFortress', name: 'Dwarf Fortress',  palette: ['#4a4040','#6a5858','#a08040','#c0c0c0'], unlockLevel: 15, mapId: null },
  chaosTemple:   { id: 'chaosTemple',   name: 'Chaos Temple',    palette: ['#0a0a0a','#300808','#600000','#ff6000'], unlockLevel: 20, mapId: null },
  sewer:         { id: 'sewer',         name: 'Sewers',          palette: ['#2a2010','#504528','#304818','#102810'], unlockLevel: 8,  mapId: null },
  dragonLair:    { id: 'dragonLair',    name: 'Dragon Lair',     palette: ['#1a0808','#c04000','#ffd700'],           unlockLevel: 25, mapId: null },
};

export const enemies = [
  // ── CRYPT ──
  { id: 'skeleton_footman', name: 'Skeleton Footman', zone: 'crypt', tier: 'minion',
    hp: 40, dmgPerFocusMin: 2, xp: 10, gold: 4,
    lore: 'Animated remains of a soldier fallen in the War of Ashes. Attacks in formation, never alone.',
    resist: ['piercing'], weak: ['bludgeoning'],
    spriteRef: 'enemy_skeleton_footman_64' },
  { id: 'crypt_zombie', name: 'Crypt Zombie', zone: 'crypt', tier: 'minion',
    hp: 55, dmgPerFocusMin: 1.5, xp: 12, gold: 3,
    lore: 'Slow but tireless. They say it still remembers fragments of its life — none of them pleasant.',
    resist: ['poison'], weak: ['fire'],
    spriteRef: 'enemy_crypt_zombie_64' },
  { id: 'wailing_specter', name: 'Wailing Specter', zone: 'crypt', tier: 'elite',
    hp: 90, dmgPerFocusMin: 3, xp: 25, gold: 10,
    lore: 'Its wail drains willpower before life. Only appears when the hero\'s streak has been broken.',
    resist: ['physical'], weak: ['radiant'],
    spriteRef: 'enemy_wailing_specter_64' },

  // ── CAVERN ──
  { id: 'cave_goblin', name: 'Cave Goblin', zone: 'cavern', tier: 'minion',
    hp: 30, dmgPerFocusMin: 2, xp: 8, gold: 6,
    lore: 'Cowardly alone, lethal in a pack. Collects shiny objects from its victims.',
    resist: [], weak: ['fire'],
    spriteRef: 'enemy_cave_goblin_64' },
  { id: 'ridgeback_boar', name: 'Ridgeback Boar', zone: 'cavern', tier: 'minion',
    hp: 45, dmgPerFocusMin: 2.5, xp: 12, gold: 5,
    lore: 'Territorial beast with curved tusks. Charges without warning.',
    resist: [], weak: [],
    spriteRef: 'enemy_ridgeback_boar_64' },
  { id: 'cave_troll', name: 'Deep Troll', zone: 'cavern', tier: 'elite',
    hp: 120, dmgPerFocusMin: 4, xp: 30, gold: 15,
    lore: 'Regenerates what fire doesn\'t cauterize. Accidental guardian of ore veins.',
    resist: ['physical'], weak: ['fire'],
    spriteRef: 'enemy_cave_troll_64' },

  // ── ELVEN RUINS ──
  { id: 'rune_wisp', name: 'Rune Wisp', zone: 'elvenRuins', tier: 'minion',
    hp: 25, dmgPerFocusMin: 3, xp: 10, gold: 7,
    lore: 'Fragment of a ward spell that was never deactivated. Attacks from range.',
    resist: ['magic'], weak: ['physical'],
    spriteRef: 'enemy_rune_wisp_64' },
  { id: 'thornguard', name: 'Thornguard', zone: 'elvenRuins', tier: 'elite',
    hp: 95, dmgPerFocusMin: 3, xp: 26, gold: 12,
    lore: 'Vine animated by forgotten elven magic. Guards ruins no one remembers why they were sacred.',
    resist: ['piercing'], weak: ['fire'],
    spriteRef: 'enemy_thornguard_64' },

  // ── DWARF FORTRESS ──
  { id: 'clockwork_sentinel', name: 'Clockwork Sentinel', zone: 'dwarfFortress', tier: 'minion',
    hp: 50, dmgPerFocusMin: 2, xp: 14, gold: 8,
    lore: 'Automaton of bronze and gears. Still following its patrol route programmed three centuries ago.',
    resist: ['slashing'], weak: ['lightning'],
    spriteRef: 'enemy_clockwork_sentinel_64' },
  { id: 'forge_golem', name: 'Forge Golem', zone: 'dwarfFortress', tier: 'elite',
    hp: 130, dmgPerFocusMin: 4, xp: 32, gold: 16,
    lore: 'Core of eternal embers. Its fist can crush stone without effort.',
    resist: ['physical', 'fire'], weak: ['cold'],
    spriteRef: 'enemy_forge_golem_64' },

  // ── CHAOS TEMPLE ──
  { id: 'cultist_acolyte', name: 'Chaos Acolyte', zone: 'chaosTemple', tier: 'minion',
    hp: 35, dmgPerFocusMin: 2.5, xp: 12, gold: 6,
    lore: 'Gave up its name in exchange for borrowed power. Casts minor curses.',
    resist: [], weak: ['radiant'],
    spriteRef: 'enemy_cultist_acolyte_64' },
  { id: 'lesser_fiend', name: 'Lesser Fiend', zone: 'chaosTemple', tier: 'elite',
    hp: 100, dmgPerFocusMin: 3.5, xp: 28, gold: 14,
    lore: 'Summoned and then abandoned by its masters. Now it drifts aimlessly through the temple ruins.',
    resist: ['fire'], weak: ['radiant', 'cold'],
    spriteRef: 'enemy_lesser_fiend_64' },

  // ── SEWERS ──
  { id: 'sewer_rat_swarm', name: 'Rat Swarm', zone: 'sewer', tier: 'minion',
    hp: 20, dmgPerFocusMin: 1.5, xp: 6, gold: 3,
    lore: 'Individually harmless. In numbers, a serious problem.',
    resist: [], weak: ['area'],
    spriteRef: 'enemy_sewer_rat_swarm_64' },
  { id: 'sludge_ooze', name: 'Sludge Ooze', zone: 'sewer', tier: 'minion',
    hp: 40, dmgPerFocusMin: 2, xp: 10, gold: 4,
    lore: 'Corrosive mass that seeps through the cracks of the sewers.',
    resist: ['piercing'], weak: ['fire'],
    spriteRef: 'enemy_sludge_ooze_64' },
];

export const bosses = [
  { id: 'lich_archivist', name: 'Forgotten Archivist Lich', title: 'He Who Cataloged His Own Tomb',
    zone: 'crypt', hp: 1500, dangerLabel: 'HIGH DANGER',
    lore: 'In life, the first Archivist of Taskoria. In death, still cataloging — now souls, not scrolls.',
    mechanic: 'Every failed quest restores 2% of its HP; every completed quest deals proportional damage.',
    reward: { xp: 800, gold: 300, dropTable: ['mystic_egg', 'rare_gear'] },
    spriteRef: 'boss_lich_archivist_64' },
  { id: 'ironclad_warden', name: 'Ironclad Warden', title: 'The Last Automaton Still Lit',
    zone: 'dwarfFortress', hp: 1800, dangerLabel: 'HIGH DANGER',
    lore: 'Built to protect the Dwarf Fortress from invaders who never came.',
    mechanic: 'Immune to damage from trivial quests; only Normal/Hard quests deal damage.',
    reward: { xp: 900, gold: 350, dropTable: ['griffin_egg_shard', 'rare_gear'] },
    spriteRef: 'boss_ironclad_warden_64' },
  { id: 'chaos_herald', name: 'Herald of the Whispering Chaos', title: 'The Faceless Voice',
    zone: 'chaosTemple', hp: 1600, dangerLabel: 'HIGH DANGER',
    lore: 'It has no fixed form — every hero sees it as their own procrastination personified.',
    mechanic: 'HP does not decrease with passive focus: only with Focus Dungeons of 25+ min completed without pausing.',
    reward: { xp: 850, gold: 320, dropTable: ['phoenix_feather', 'rare_gear'] },
    spriteRef: 'boss_chaos_herald_64' },
  { id: 'red_wyrm_scaltha', name: 'Scaltha, Scourge of Ashes', title: 'Red Dragon of the Volcanic Lair',
    zone: 'dragonLair', hp: 2500, dangerLabel: 'CATACLYSMIC',
    lore: 'Its hoard includes the armor of a hundred heroes who never completed their streak.',
    mechanic: 'Only appears after 4 consecutive weeks of Weekly Boss defeated.',
    reward: { xp: 2000, gold: 1000, dropTable: ['dragon_hoard_cosmetic', 'legendary_gear'] },
    spriteRef: 'boss_red_wyrm_scaltha_64' },
];

export const rareBosses = [
  { id: 'beholder_unblinking', name: 'The Sleepless Watcher', title: 'Aberration from No Plane',
    zone: null, hp: 2000, dangerLabel: 'ABERRANT', spawnChance: 0.02,
    lore: 'It belongs neither to Taskoria nor any known realm. A single eye, enormous and lidless, sees all.',
    mechanic: 'Can appear in any Focus Dungeon with a 2% chance. HP drops twice as fast if you complete without switching apps.',
    reward: { xp: 1200, gold: 500, dropTable: ['aberrant_eye_trophy', 'legendary_gear'] },
    spriteRef: 'boss_beholder_unblinking_64' },
];

export const epicBossTemplate = {
  createFields: {
    name: { type: 'string', maxLen: 32, placeholder: 'E.g. "My Thesis Dragon"' },
    hpFromEstimatedHours: (hours) => Math.round(hours * 40),
    zone: { type: 'select', options: Object.keys(DUNGEON_ZONES), default: 'chaosTemple' },
    deadline: { type: 'date', optional: true },
  },
  mechanic: 'HP only decreases with quests tagged as belonging to this project.',
  reward: {
    xpFormula: (totalHp) => Math.round(totalHp * 0.6),
    goldFormula: (totalHp) => Math.round(totalHp * 0.25),
    dropTable: ['custom_trophy_cosmetic'],
  },
  lore: 'Not every hero faces ancient dragons. Some face their own Leviathan: a thesis, a move, a product launch.',
};

// =============================================================================
//  HELPER FUNCTIONS — used by AvatarBattle.jsx for Focus Dungeon combat
// =============================================================================

const ELITE_SPAWN_CHANCE_BASE = 0.15;
const ELITE_SPAWN_CHANCE_PER_LEVEL = 0.005;

const enemiesByZone = {};
for (const e of enemies) {
  if (!enemiesByZone[e.zone]) enemiesByZone[e.zone] = { minions: [], elites: [] };
  enemiesByZone[e.zone][e.tier === 'elite' ? 'elites' : 'minions'].push(e);
}

export function pickEnemy(zoneId = 'crypt', heroLevel = 1) {
  const pool = enemiesByZone[zoneId] || enemiesByZone.crypt;
  const eliteChance = Math.min(0.4, ELITE_SPAWN_CHANCE_BASE + (heroLevel * ELITE_SPAWN_CHANCE_PER_LEVEL));
  const isElite = pool.elites.length > 0 && Math.random() < eliteChance;

  const candidates = isElite ? pool.elites : pool.minions;
  return candidates[Math.floor(Math.random() * candidates.length)];
}

export function spawnBestiaryEnemy(zoneId = 'crypt', heroLevel = 1) {
  const enemy = pickEnemy(zoneId, heroLevel);
  const hp = enemy.hp;

  return {
    id: Date.now(),
    speciesKey: enemy.id,
    blueprintKey: enemy.spriteRef,
    name: enemy.name,
    tier: enemy.tier,
    zone: enemy.zone,
    hp,
    maxHp: hp,
    xp: enemy.xp,
    gold: enemy.gold,
  };
}

export function getUnlockedZones(heroLevel = 1) {
  return Object.values(DUNGEON_ZONES).filter(z => heroLevel >= z.unlockLevel);
}

export default { DUNGEON_ZONES, enemies, bosses, epicBossTemplate, rareBosses };
