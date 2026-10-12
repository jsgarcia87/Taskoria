// Writes api/lib/duel_classes.json — the slice of the class registry the PHP duel engine needs.
// Run after editing src/data/classes.js:  node scripts/sync-duel-classes.mjs
// (scripts/validate-duel.mjs fails if the file is out of date.)
import { writeFileSync } from 'node:fs';
import { CLASSES } from '../src/data/classes.js';

export const duelClassTable = () => Object.fromEntries(
    CLASSES.map(c => [c.name, { id: c.id, family: c.family, combatStats: c.combatStats, avatarType: c.avatarType }]),
);

if (process.argv[1] && process.argv[1].endsWith('sync-duel-classes.mjs')) {
    writeFileSync(new URL('../api/lib/duel_classes.json', import.meta.url), JSON.stringify(duelClassTable(), null, 2) + '\n');
    console.log('api/lib/duel_classes.json written');
}
