// ─────────────────────────────────────────────────────────────────────────────
// Outfit slots — the layer taxonomy shared by the Forja de Clases and the game.
//
// Every class outfit and every cosmetic is a set of parts, one per slot, drawn
// on the shared 64×64 body. Rules for artists (checked by the Forja/validator):
//   · one element per slot — a belt is never painted inside the torso;
//   · each part is drawn COMPLETE, even where other parts cover it, so any part
//     can be swapped or removed without leaving holes;
//   · parts never contain skin or hair (that is appearance, not clothing).
//
// Keys keep the Forja's historic names (capucha, brazaletes…) so drafts and
// published workspaces stay valid. The public label is what players see.
// Mirror: public/admin-tools/character_builder.html (SLOT_DEFS / Z_ORDER) —
// `node scripts/validate-classes.mjs` checks both stay in sync.
// ─────────────────────────────────────────────────────────────────────────────

export const APPEARANCE_SLOTS = [
    { id: 'cuerpo_base', label: 'Cuerpo' },
    { id: 'brazos',      label: 'Pose de brazos' },
    { id: 'barba',       label: 'Barba' },
    { id: 'pelo',        label: 'Pelo' },
];

// The 9 standard clothing slots + off-hand. `equip` maps to the stat-gear slot
// in data/items.js (EQUIPMENT_SLOTS) when that slot also has a visual.
export const OUTFIT_SLOTS = [
    { id: 'capucha',    label: 'Cabeza',               equip: 'head' },
    { id: 'torso',      label: 'Torso',                equip: 'body' },
    { id: 'hombreras',  label: 'Hombreras' },
    { id: 'cinturon',   label: 'Cinturón' },
    { id: 'brazaletes', label: 'Guantes / brazaletes' },
    { id: 'piernas',    label: 'Piernas' },
    { id: 'botas',      label: 'Botas' },
    { id: 'capa',       label: 'Capa' },
    { id: 'arma',       label: 'Arma',                 equip: 'mainHand' },
    { id: 'escudo',     label: 'Escudo / mano secundaria', equip: 'offHand' },
];

// Back-to-front compositing order for the whole character. Hair sits under the
// clothing so long hair never paints over armour; shield and weapon stay on top
// and the hand is redrawn over the weapon grip (see utils/avatarLayers.js).
export const Z_ORDER = [
    'capa', 'cuerpo_base', 'brazos', 'piernas', 'botas', 'pelo', 'torso',
    'cinturon', 'brazaletes', 'barba', 'hombreras', 'capucha', 'escudo', 'arma',
];

// Rows of the hands in the relaxed arm pose (used to redraw the fist over a weapon).
export const HAND_ROWS = [37, 41];

export const OUTFIT_SLOT_IDS = OUTFIT_SLOTS.map(s => s.id);
export const SLOT_LABELS = Object.fromEntries([...APPEARANCE_SLOTS, ...OUTFIT_SLOTS].map(s => [s.id, s.label]));
