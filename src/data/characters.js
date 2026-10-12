// Derived from the class registry (data/classes.js) — edit classes there.
import { CLASSES } from './classes';

export const CHARACTER_CLASSES = Object.fromEntries(
    CLASSES.map(c => [c.id.toUpperCase(), c.name])
);

export const CHARACTERS = CLASSES.map(c => ({
    id: c.id,
    name: c.name,
    class: c.name,
    baseStats: c.baseStats,
    avatarType: c.avatarType,
}));
