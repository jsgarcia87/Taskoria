// Checks that the class registry, the shipped blueprints and the perk engine
// agree with each other. Run after adding or editing a class:
//   node scripts/validate-classes.mjs
import { readFileSync } from 'node:fs';
import { CLASSES, CLASS_FAMILIES, STAT_KEYS } from '../src/data/classes.js';
import { getClassTaskBonus, getStreakDaysCap } from '../src/utils/classPerks.js';
import { Z_ORDER, OUTFIT_SLOT_IDS, APPEARANCE_SLOTS } from '../src/data/outfitSlots.js';

const blueprints = JSON.parse(readFileSync(new URL('../src/data/character_blueprints.json', import.meta.url), 'utf8'));
const errors = [];
const fail = (msg) => errors.push(msg);
const HEX = /^#[0-9a-f]{6}$/i;
const ROLES = ['skin', 'hair', 'primary'];

const ids = new Set();
const perkIds = new Set();
for (const c of CLASSES) {
    const at = `class "${c.id}"`;
    if (ids.has(c.id)) fail(`${at}: duplicate id`);
    ids.add(c.id);
    if (perkIds.has(c.perk?.id)) fail(`${at}: perk id "${c.perk.id}" reused`);
    perkIds.add(c.perk?.id);
    if (!CLASS_FAMILIES[c.family]) fail(`${at}: unknown family "${c.family}"`);
    for (const k of STAT_KEYS) if (typeof c.baseStats?.[k] !== 'number') fail(`${at}: baseStats.${k} missing`);
    const total = STAT_KEYS.reduce((s, k) => s + (c.baseStats?.[k] || 0), 0);
    if (total < 68 || total > 76) fail(`${at}: baseStats total ${total} outside 68–76 (balance band)`);
    for (const k of [...Object.keys(c.levelStats || {}), ...(c.combatStats || []), ...(c.affinity || [])]) {
        if (!STAT_KEYS.includes(k)) fail(`${at}: unknown stat "${k}"`);
    }
    if (!c.affinity?.length) fail(`${at}: needs at least one affinity stat`);
    if (!HEX.test(c.theme?.accent || '')) fail(`${at}: theme.accent must be #rrggbb`);
    if (!c.perk?.label || !c.perk?.desc) fail(`${at}: perk needs label + desc`);

    const bp = blueprints[c.id];
    if (!bp) { fail(`${at}: no blueprint in character_blueprints.json`); continue; }
    if (bp.blueprint.length !== 64 || bp.blueprint.some(r => r.length !== 64)) fail(`${at}: blueprint must be 64×64`);
    if ((bp.paleta.E || '').toLowerCase() !== '#ffdbac') fail(`${at}: palette E must be base skin #ffdbac`);
    const used = new Set(bp.blueprint.join(''));
    for (const L of used) if (!(L in bp.paleta)) fail(`${at}: letter "${L}" used but not in palette`);
    if (!bp.roles) { fail(`${at}: blueprint has no roles`); continue; }
    for (const [role, letters] of Object.entries(bp.roles)) {
        if (!ROLES.includes(role)) fail(`${at}: unknown role "${role}"`);
        for (const L of letters) if (!HEX.test(bp.paleta[L] || '')) fail(`${at}: role ${role} letter "${L}" is not a colour`);
    }
    if (bp.roles.skin?.[0] !== 'E') fail(`${at}: roles.skin must start with E`);
    if (!bp.roles.primary?.length) fail(`${at}: roles.primary is empty`);
}
for (const id of Object.keys(blueprints)) if (!ids.has(id)) fail(`blueprint "${id}" has no registry entry`);

// Perk engine smoke tests: each case must (or must not) trigger the perk.
const DAY = 864e5;
const now = new Date('2026-10-08T12:00:00').getTime();
const base = { id: String(now - 2 * 3600e3), difficulty: 2, recurrence: 'none', category: 'quest', attribute: 'none' };
const cases = [
    ['Fighter', {}, true],
    ['Paladin', { assignerId: 'p2' }, true],
    ['Paladin', {}, false],
    ['Wizard', { attribute: 'int', id: String(now - 3 * DAY), dueDate: '2026-10-09' }, true],
    ['Wizard', { attribute: 'int', id: String(now - 60e3), dueDate: '2026-10-09' }, false],
    ['Rogue', { dueDate: '2026-10-12' }, true],
    ['Rogue', { dueDate: '2026-10-08' }, false],
    ['Cleric', { recurrence: 'daily', lastCompletedDate: new Date(now - 4 * DAY).toDateString() }, true],
    ['Cleric', { recurrence: 'daily', lastCompletedDate: new Date(now - DAY).toDateString() }, false],
    ['Ranger', { projectId: 'proj1' }, true],
    ['Barbarian', { difficulty: 3 }, true, { hardDoneToday: 2 }],
    ['Barbarian', { difficulty: 3 }, false, { hardDoneToday: 1 }],
    ['Necromancer', { dueDate: '2026-09-01' }, true],
    ['Necromancer', { dueDate: '2026-10-01' }, false],
    ['Antipaladin', {}, true],
    ['Antipaladin', { dueDate: '2026-10-20' }, false],
    ['Sorcerer', {}, true],
    ['Scout', {}, true],
];
for (const [cls, patch, expected, ctx = {}] of cases) {
    const r = getClassTaskBonus({ class: cls }, { ...base, ...patch }, { now, ...ctx });
    const label = CLASSES.find(c => c.name === cls).perk.label;
    const hit = r.reasons.includes(label);
    if (hit !== expected) fail(`perk ${cls} ${JSON.stringify(patch)}: expected ${expected ? 'bonus' : 'no bonus'}, got ${JSON.stringify(r)}`);
}
const scout = getClassTaskBonus({ class: 'Scout', discoveries: ['quest:once:none'] }, base, { now });
if (scout.bonusXp) fail('perk Scout: discovery must only pay once per quest kind');
if (getStreakDaysCap('Monk') <= getStreakDaysCap('Fighter')) fail('perk Monk: streak cap must exceed default');
const syn = getClassTaskBonus({ class: 'Wizard' }, { ...base, attribute: 'int' }, { now });
if (!syn.reasons.includes('Wizard synergy')) fail('synergy: Wizard + INT task must get class synergy');

// Layer taxonomy: the Forja mirrors src/data/outfitSlots.js and proposals use only standard slots.
const forge = readFileSync(new URL('../public/admin-tools/character_builder.html', import.meta.url), 'utf8');
const forgeZ = JSON.parse((forge.match(/const Z_ORDER = (\[[^\]]*\]);/) || [])[1]?.replace(/'/g, '"') || '[]');
if (forgeZ.join() !== Z_ORDER.join()) fail(`Forja Z_ORDER ${forgeZ.join()} ≠ outfitSlots ${Z_ORDER.join()}`);
const slotBlock = (forge.match(/const SLOT_DEFS = \{([\s\S]*?)\n\};/) || [])[1] || '';
const forgeSlots = [...slotBlock.matchAll(/^\s*(\w+):/gm)].map(m => m[1]);
const allowed = new Set([...OUTFIT_SLOT_IDS, 'barba']);
for (const id of OUTFIT_SLOT_IDS) if (!forgeSlots.includes(id)) fail(`Forja SLOT_DEFS lacks slot "${id}"`);
for (const id of forgeSlots) if (!allowed.has(id)) fail(`Forja SLOT_DEFS has non-standard slot "${id}"`);
const pi = forge.indexOf('const PROPOSALS = ') + 'const PROPOSALS = '.length;
const proposals = JSON.parse(forge.slice(pi, forge.indexOf(';\n', pi)));
for (const [id, pr] of Object.entries(proposals)) {
    for (const sl of pr.slots) if (!allowed.has(sl)) fail(`proposal ${id}: non-standard slot "${sl}"`);
    if (pr.target && !CLASSES.some(c => c.id === pr.target)) fail(`proposal ${id}: unknown target class "${pr.target}"`);
}
const zSet = new Set(Z_ORDER);
for (const id of [...OUTFIT_SLOT_IDS, ...APPEARANCE_SLOTS.map(s => s.id)]) if (!zSet.has(id)) fail(`slot "${id}" missing from Z_ORDER`);

if (errors.length) {
    console.error(`✗ ${errors.length} class issue(s):\n  - ${errors.join('\n  - ')}`);
    process.exit(1);
}
console.log(`✓ ${CLASSES.length} classes, blueprints, ${cases.length + 3} perk checks, ${Object.keys(proposals).length} proposals on ${OUTFIT_SLOT_IDS.length} standard slots OK`);
