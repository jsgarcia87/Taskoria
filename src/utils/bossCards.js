// Boss cards: a collectible earned only when a boss really falls.
// Cards live in `character.bossCards` (saved with the hero). A card keeps a
// snapshot of the boss so custom/epic bosses survive after they are deleted.
import { bosses as WEEKLY_BOSSES, DUNGEON_ZONES } from '../data/bestiary';
import { processRewardsAndLevelUp } from './gameUtils';

export const RARITIES = {
    rare:   { id: 'rare',   label: 'Rare',   frame: ['#8a6d2a', '#fedf8c', '#b8923a'], accent: '#fedf8c', foil: false },
    mythic: { id: 'mythic', label: 'Mythic', frame: ['#fedf8c', '#fff4cf', '#d4a24a'], accent: '#fff0b8', foil: true },
    epic:   { id: 'epic',   label: 'Epic',   frame: ['#6d4cc4', '#c4b5fd', '#7c3aed'], accent: '#c4b5fd', foil: true },
};

const RARITY_BY_DANGER = { 'HIGH DANGER': 'rare', CATACLYSMIC: 'mythic', ABERRANT: 'mythic' };

const uid = (p) => `${p}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
const slug = (s) => String(s || 'boss').toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');

const heroSnapshot = (character) => ({
    name: character?.name || 'Hero',
    level: character?.level || 1,
    class: character?.class || '',
});

export const zoneName = (zoneId) => DUNGEON_ZONES[zoneId]?.name || 'The Archive';
export const zonePalette = (zoneId) => DUNGEON_ZONES[zoneId]?.palette || ['#2a2535', '#3d3548', '#5c5068', '#9080a0'];

// The static look of a boss card (no ownership info). `locked` previews are built from this.
export function weeklyCardBase(boss) {
    const index = WEEKLY_BOSSES.findIndex(b => b.id === boss.id);
    return {
        id: `boss:${boss.id}`, kind: 'weekly', bossId: boss.id,
        name: boss.name, title: boss.title, zone: boss.zone, spriteRef: boss.spriteRef,
        hp: boss.hp, danger: boss.dangerLabel, rarity: RARITY_BY_DANGER[boss.dangerLabel] || 'rare',
        lore: boss.lore, mechanic: boss.mechanic,
        number: index >= 0 ? index + 1 : null, total: WEEKLY_BOSSES.length,
    };
}

export function epicCardBase(epic) {
    return {
        id: `epic:${epic.id}`, kind: 'epic', bossId: epic.id,
        name: epic.title || epic.name || 'Epic Boss', title: epic.isProject ? 'A project, finished' : 'A long quest, slain',
        zone: epic.zone || 'chaosTemple',
        spriteRef: epic.spriteType && String(epic.spriteType).startsWith('boss_') ? epic.spriteType : 'boss_chaos_herald_64',
        hp: epic.maxHp || 0, danger: 'EPIC', rarity: 'epic',
        lore: 'Not every hero faces ancient dragons. Some face their own Leviathan — and this one fell to real work.',
        mechanic: epic.isProject ? 'Fell as the project tasks were completed.' : 'Fell to the quests and focus sessions you completed.',
        number: null, total: null,
    };
}

export function worldCardBase(boss) {
    return {
        id: `world:${slug(boss.id || boss.name)}`, kind: 'world', bossId: boss.id || slug(boss.name),
        name: boss.name, title: 'A threat to the whole realm', zone: 'chaosTemple',
        spriteRef: boss.spriteRef || 'boss_chaos_herald_64',
        hp: boss.hp?.max || boss.maxHp || 0, danger: 'WORLD BOSS', rarity: 'rare',
        lore: 'Every hero of Taskoria struck at once. This one was brought down by the work of the realm.',
        mechanic: 'Your Strength decided how hard each completed task hit.',
        number: null, total: null,
    };
}

// For the album and for unclaimed previews: the card as the bestiary describes it today.
export const weeklyAlbumSlots = () => WEEKLY_BOSSES.map(weeklyCardBase);

// A stored card with the live bestiary text on top (so wording fixes reach old cards).
export function resolveCard(stored) {
    if (stored.kind === 'weekly') {
        const boss = WEEKLY_BOSSES.find(b => b.id === stored.bossId);
        if (boss) return { ...stored, ...weeklyCardBase(boss), obtainedAt: stored.obtainedAt, lastDefeatedAt: stored.lastDefeatedAt, defeats: stored.defeats, hero: stored.hero, seen: stored.seen };
    }
    return stored;
}

// Adds a card (or one more defeat of the same boss). Returns the updated hero and whether it is new.
export function addCardToCollection(character, base) {
    const collection = character.bossCards || [];
    const now = Date.now();
    const existing = collection.find(c => c.id === base.id);
    if (existing) {
        const updated = { ...existing, defeats: (existing.defeats || 1) + 1, lastDefeatedAt: now };
        return { character: { ...character, bossCards: collection.map(c => c.id === base.id ? updated : c) }, isNew: false, card: updated };
    }
    const card = { ...base, obtainedAt: now, lastDefeatedAt: now, defeats: 1, hero: heroSnapshot(character), seen: false };
    return { character: { ...character, bossCards: [...collection, card] }, isNew: true, card };
}

// Weekly boss: when its HP crosses to 0, pay the reward its card announces, grant the card, stamp the defeat.
export function resolveWeeklyDefeat({ prevDungeon, nextDungeon, character }) {
    const fallen = prevDungeon && nextDungeon && prevDungeon.hp > 0 && nextDungeon.hp <= 0;
    const boss = fallen && WEEKLY_BOSSES.find(b => b.id === prevDungeon.bossId);
    if (!boss) return { character, dungeon: nextDungeon, logs: [], levelUp: false };

    let updated = character;
    let levelUp = false;
    const { xp, gold } = boss.reward;
    const res = processRewardsAndLevelUp(updated, xp, gold, 0);
    if (res) { updated = res.newChar; levelUp = !!res.levelUp; }
    const added = addCardToCollection(updated, weeklyCardBase(boss));
    return {
        character: added.character,
        dungeon: { ...nextDungeon, defeatedAt: Date.now() },
        levelUp,
        logs: [{ id: uid('log'), message: `Defeated ${boss.name}! +${xp} XP, +${gold} Gold.${added.isNew ? ' A new boss card joins your album.' : ''}`, type: 'reward' }],
    };
}

export const unseenCard = (character) => (character?.bossCards || []).find(c => !c.seen) || null;
