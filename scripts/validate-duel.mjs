// The duel rules live twice: src/utils/duelEngine.js (client, local sparring, replay) and
// api/lib/duel.php (server, the only one that decides network duels). This script
// feeds both the same heroes and the same dice and demands identical duels.
//   node scripts/validate-duel.mjs            parity + invariants
//   node scripts/validate-duel.mjs --balance  also prints win rates and duel length
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import assert from 'node:assert/strict';
import { CLASSES } from '../src/data/classes.js';
import { buildCombatant, runDuel, scriptedRoll, randomRoll, STANCES } from '../src/utils/duelEngine.js';
import { duelClassTable } from './sync-duel-classes.mjs';

const errors = [];
const fail = (m) => errors.push(m);

// 1. The class table the PHP side reads must match the registry.
const shipped = JSON.parse(readFileSync(new URL('../api/lib/duel_classes.json', import.meta.url), 'utf8'));
try { assert.deepStrictEqual(shipped, duelClassTable()); } catch { fail('api/lib/duel_classes.json is out of date — run node scripts/sync-duel-classes.mjs'); }

// 2. Deterministic pseudo-random generator so a failure can be reproduced.
let seed = 20261010;
const rnd = () => { seed = (seed * 1664525 + 1013904223) % 4294967296; return seed / 4294967296; };
const int = (a, b) => a + Math.floor(rnd() * (b - a + 1));
const today = '2026-10-10';
const randomHero = () => {
    const c = CLASSES[int(0, CLASSES.length - 1)];
    const stats = {};
    for (const k of ['str', 'dex', 'con', 'int', 'will', 'cha']) stats[k] = Math.max(6, (c.baseStats[k] || 10) + int(-2, 8));
    return {
        name: `Hero${int(1, 999)}`, class: c.name, level: int(1, 30), stats, avatarId: c.avatarType,
        activityHistory: { [today]: rnd() < 0.3 ? int(0, 12) : { tasks: int(0, 12), minutes: int(0, 150) } },
    };
};

const cases = [];
for (let i = 0; i < 400; i++) {
    const dice = Array.from({ length: 600 }, () => int(1, 20));
    const stanceIds = Object.keys(STANCES);
    cases.push({
        a: randomHero(), b: randomHero(), today, dice,
        stances: { a: rnd() < 0.3 ? undefined : stanceIds[int(0, 2)], b: rnd() < 0.5 ? undefined : stanceIds[int(0, 2)] },
    });
}
// Cases that force the rare branches: natural 1s, natural 20s, last stands, ties.
for (const pattern of [[1, 1, 1, 1, 1], [20, 20, 20, 20, 20], [10, 10, 10, 10], [1, 20, 1, 20, 3, 17, 5, 5, 19], [2, 19, 11, 13, 8, 8, 8, 1, 6]]) {
    cases.push({ a: randomHero(), b: randomHero(), today, dice: pattern.length ? pattern : [10], stances: {} });
}

let php;
try {
    php = JSON.parse(execFileSync('php', [new URL('./duel-parity.php', import.meta.url).pathname], {
        input: JSON.stringify({ cases }), maxBuffer: 1 << 28,
    }).toString());
} catch (e) {
    console.error('php is required for the parity check:', e.message);
    process.exit(1);
}

let rare = { fumble: 0, crit: 0, lastStand: 0, inspired: 0, rounds: 0 };
cases.forEach((c, i) => {
    const A = buildCombatant(c.a, { today }), B = buildCombatant(c.b, { today });
    const js = runDuel(A, B, c.stances, scriptedRoll(c.dice));
    // normalise undefined stances the way JSON would
    try { assert.deepStrictEqual(JSON.parse(JSON.stringify(js)), php[i]); }
    catch (e) { fail(`case ${i}: PHP and JS disagree (${c.a.class} vs ${c.b.class}) — ${String(e.message).split('\n').slice(0, 6).join(' | ')}`); }
    for (const ev of js.events) {
        if (ev.t === 'attack') { if (ev.fumble) rare.fumble++; if (ev.crit) rare.crit++; if (ev.inspired) rare.inspired++; }
        if (ev.t === 'lastStand') rare.lastStand++;
    }
    // invariants
    const end = js.events[js.events.length - 1];
    if (end.t !== 'end') fail(`case ${i}: duel does not end with an end event`);
    if (js.rounds > 10) fail(`case ${i}: more than 10 rounds`);
    for (const ev of js.events) if (ev.t === 'damage' && ev.total < 1) fail(`case ${i}: damage below 1`);
});
if (errors.length > 6) errors.splice(6, errors.length - 6, '… more');

if (process.argv.includes('--balance')) {
    const N = 4000;
    // Stats as a real hero has them: base stats plus the class's level-up gains.
    const hero = (c, level) => {
        const stats = { ...c.baseStats };
        for (const [k, v] of Object.entries(c.levelStats || {})) stats[k] += v * (level - 1);
        return { name: c.name, class: c.name, level, stats, activityHistory: {} };
    };
    for (const level of [1, 5, 10, 20]) {
        let totalRounds = 0, ko = 0, firstWins = 0;
        const wins = Object.fromEntries(CLASSES.map(c => [c.name, 0]));
        const games = Object.fromEntries(CLASSES.map(c => [c.name, 0]));
        for (let i = 0; i < N; i++) {
            const ca = CLASSES[int(0, CLASSES.length - 1)], cb = CLASSES[int(0, CLASSES.length - 1)];
            const r = runDuel(buildCombatant(hero(ca, level), { today }), buildCombatant(hero(cb, level), { today }), {}, randomRoll);
            totalRounds += r.rounds; if (r.reason === 'ko') ko++;
            if (r.winner === 'a') firstWins++;
            games[ca.name]++; games[cb.name]++;
            wins[r.winner === 'a' ? ca.name : cb.name]++;
        }
        const rates = Object.entries(wins).map(([k, v]) => [k, v / games[k]]).sort((x, y) => y[1] - x[1]);
        console.log(`\nlevel ${level}: avg ${ (totalRounds / N).toFixed(1) } rounds, ${(100 * ko / N).toFixed(0)}% end in a knock-out, challenger wins ${(100 * firstWins / N).toFixed(0)}%`);
        console.log('  win rate by class: ' + rates.map(([k, v]) => `${k} ${(100 * v).toFixed(0)}%`).join(' · '));
    }
}

if (errors.length) {
    console.error(`✗ ${errors.length} duel issue(s):\n  - ${errors.join('\n  - ')}`);
    process.exit(1);
}
console.log(`✓ duel engine: ${cases.length} duels identical in JS and PHP (fumbles ${rare.fumble}, crits ${rare.crit}, last stands ${rare.lastStand}, inspired rerolls ${rare.inspired})`);
