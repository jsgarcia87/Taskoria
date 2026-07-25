// =============================================================================
//  PREFABS — composite world assets ("scenes") built from WORLD_PROPS
// =============================================================================
//  Why: the open world used to be a flat list of scattered decorations, which
//  meant trees, benches and props floated without spatial coherence. A prefab
//  groups related sprites (a shop + its lamps + mat + sign + planters) into a
//  single unit. MapData.js places prefabs by origin; the prefab expands at
//  load time into decorations + obstacles. Result: less floating, scenes feel
//  composed instead of randomly sprinkled.
//
//  Usage in MapData.js:
//      prefabs: [
//        { name: 'shop_complete', x: 170, y: 230 },
//        { name: 'forest_grove',  x: 800, y: 400, seed: 7 },
//      ],
//
//  Each prefab returns:
//      { decorations: [...], obstacles: [...] }
//  PlayableWorld merges these with the map's own decorations/obstacles.
// =============================================================================

// Tiny deterministic PRNG so a (seed, index) pair always yields the same value
function rng(seed, salt = 0) {
    let s = ((seed | 0) * 73856093) ^ (salt * 19349663);
    return () => {
        s = (s * 1103515245 + 12345) | 0;
        return ((s >>> 16) & 0x7fff) / 0x7fff;
    };
}

// -----------------------------------------------------------------------------
//  Prefab definitions
//  Each function returns { decorations, obstacles } whose coordinates are
//  ABSOLUTE (origin already applied). Keep prefabs additive — don't mutate the
//  map; the caller merges arrays.
// -----------------------------------------------------------------------------

// Shop building with porch — replaces the floating shop + scattered crates pattern
function shopComplete(ox, oy) {
    return {
        decorations: [
            // Building (top-left anchor matches existing shop_building convention)
            { type: 'shop_building', x: ox, y: oy, width: 280, height: 150 },
            // Welcome mat / red carpet under the door
            { type: 'rug', x: ox + 140, y: oy + 165, width: 90, height: 40, color: '#7f1d1d', z: 1 },
            // Lamps flanking the door
            { type: 'lamp', x: ox + 60,  y: oy + 178, size: 64 },
            { type: 'lamp', x: ox + 220, y: oy + 178, size: 64 },
            // Sign on the right side
            { type: 'sign', x: ox + 300, y: oy + 130, label: 'SHOP' },
            // Two flower planters on the front
            { type: 'planter', x: ox + 80,  y: oy + 200, width: 60, height: 32 },
            { type: 'planter', x: ox + 200, y: oy + 200, width: 60, height: 32 },
            // Bench by the side
            { type: 'bench', x: ox + 30, y: oy + 220, size: 60 },
            // Barrel + crate stack to the left of the door (storage)
            { type: 'barrel', x: ox + 24, y: oy + 168, size: 38 },
            { type: 'crate',  x: ox + 24, y: oy + 196, size: 36 },
            // Subtle ground patch tying the porch to the floor
            { type: 'cobble_patch', x: ox + 140, y: oy + 175, width: 220, height: 90, color: '#6b5240', opacity: 0.45, z: 0 },
        ],
        obstacles: [
            // Building body
            { x: ox, y: oy, width: 280, height: 150, type: 'shop' },
        ],
    };
}

// A natural forest grove — cluster of trees with undergrowth, deterministic
function forestGrove(ox, oy, seed = 1) {
    const r = rng(seed, 17);
    const decorations = [];
    const obstacles = [];

    // Anchor tree (large oak)
    decorations.push({ type: 'oak_tree', x: ox - 30, y: oy - 40, width: 90, height: 120 });
    obstacles.push({ x: ox - 12, y: oy + 70, width: 30, height: 16 });

    // Surrounding pines/oaks in a soft ring
    const ringTrees = [
        { type: 'pine_tree', dx: -120, dy: 30, w: 80, h: 110 },
        { type: 'pine_tree', dx:  90,  dy: 40, w: 70, h: 100 },
        { type: 'oak_tree',  dx: -80,  dy: 100, w: 75, h: 100 },
        { type: 'pine_tree', dx:  60,  dy: 110, w: 65, h: 95 },
    ];
    ringTrees.forEach(t => {
        decorations.push({ type: t.type, x: ox + t.dx, y: oy + t.dy, width: t.w, height: t.h });
        obstacles.push({ x: ox + t.dx + t.w / 2 - 14, y: oy + t.dy + t.h - 14, width: 28, height: 14 });
    });

    // Undergrowth — bushes & flower clusters jittered by seed
    const bushSlots = [[-60, 60], [40, 50], [-100, 130], [70, 130]];
    bushSlots.forEach((s, i) => {
        const jx = (r() - 0.5) * 24;
        const jy = (r() - 0.5) * 12;
        decorations.push({ type: 'bush', x: ox + s[0] + jx, y: oy + s[1] + jy, size: 50 + Math.floor(r() * 12) });
    });

    const flowerSlots = [[-40, 80], [10, 100], [-90, 50], [50, 75], [0, 140]];
    flowerSlots.forEach(s => {
        decorations.push({ type: 'flowers', x: ox + s[0] + (r() - 0.5) * 20, y: oy + s[1] + (r() - 0.5) * 10, size: 28 + Math.floor(r() * 10) });
    });

    // A couple of mushrooms hidden inside
    decorations.push({ type: 'sprite', name: 'mushroom', x: ox - 70, y: oy + 90, scale: 1.5, z: oy + 90 });
    decorations.push({ type: 'sprite', name: 'mushroom', x: ox + 40, y: oy + 70, scale: 1.4, z: oy + 70 });

    return { decorations, obstacles };
}

// A small flower / herb garden patch — for filling empty plaza corners coherently
function gardenPatch(ox, oy, seed = 1) {
    const r = rng(seed, 31);
    const decorations = [];
    // Central planter as anchor
    decorations.push({ type: 'planter', x: ox, y: oy, width: 60, height: 32 });
    // Bush behind it
    decorations.push({ type: 'bush', x: ox - 30, y: oy - 10, size: 52 });
    decorations.push({ type: 'bush', x: ox + 30, y: oy - 10, size: 48 });
    // Flower clusters fanning out
    for (let i = 0; i < 4; i++) {
        decorations.push({
            type: 'flowers',
            x: ox - 50 + i * 25 + (r() - 0.5) * 8,
            y: oy + 20 + (r() - 0.5) * 6,
            size: 26 + Math.floor(r() * 8),
        });
    }
    // Grass tufts as filler
    for (let i = 0; i < 3; i++) {
        decorations.push({
            type: 'sprite', name: 'grass_tuft',
            x: ox - 35 + i * 30 + (r() - 0.5) * 8,
            y: oy + 28 + (r() - 0.5) * 4,
            scale: 1.4 + r() * 0.4,
        });
    }
    return { decorations, obstacles: [] };
}

// A market corner — pair of stalls with crates and a hay bale
function marketCorner(ox, oy, accent = '#16a34a') {
    return {
        decorations: [
            { type: 'market_stall', x: ox, y: oy, width: 130, height: 96, color: accent },
            { type: 'crate', x: ox + 35, y: oy + 110, size: 34 },
            { type: 'crate', x: ox + 95, y: oy + 110, size: 32 },
            { type: 'barrel', x: ox + 10, y: oy + 120, size: 36 },
            { type: 'hay', x: ox + 140, y: oy + 130, size: 40 },
            { type: 'flowers', x: ox + 65, y: oy + 130, size: 28 },
            { type: 'sign', x: ox + 145, y: oy + 60, label: 'MARKET' },
            // A small ground variation under the stall
            { type: 'cobble_patch', x: ox + 60, y: oy + 60, width: 160, height: 80, color: '#5c4033', opacity: 0.4, z: 0 },
        ],
        obstacles: [
            { x: ox, y: oy + 60, width: 130, height: 50, type: 'stall' },
        ],
    };
}

// Pet sanctuary pen — fence rectangle with critters, hay, planters, sign
function sanctuaryPen(ox, oy, w = 360, h = 320) {
    const decs = [];
    const obs = [];
    // Soft green ground tint
    decs.push({ type: 'rect', x: ox, y: oy, width: w, height: h, color: '#15803d', opacity: 0.32, radius: '20px', z: 1 });
    // Fence borders
    decs.push({ type: 'fence', x: ox, y: oy - 4, width: w, height: 16 });
    decs.push({ type: 'fence', x: ox - 4, y: oy, width: 16, height: h });
    decs.push({ type: 'fence', x: ox + w - 12, y: oy, width: 16, height: h });
    // Leave a gap in the south fence as entrance
    decs.push({ type: 'fence', x: ox, y: oy + h + 4, width: 120, height: 16 });
    decs.push({ type: 'fence', x: ox + w - 120, y: oy + h + 4, width: 120, height: 16 });
    // Sign
    decs.push({ type: 'sign', x: ox - 20, y: oy - 30, label: 'PETS' });
    // Caretaker
    decs.push({ type: 'vendor_npc', x: ox + w * 0.55, y: oy + 50, label: 'Caretaker',
        avatar: 'archer', colors: { primary: '#047857', primaryDark: '#065f46', skin: '#d49060' } });
    // Critters scattered
    decs.push({ type: 'critter', x: ox + 80,  y: oy + 140, variant: 'slime', color: '#22c55e' });
    decs.push({ type: 'critter', x: ox + 270, y: oy + 120, variant: 'cat',   color: '#f59e0b' });
    decs.push({ type: 'critter', x: ox + 150, y: oy + 230, variant: 'dog',   color: '#a16207' });
    decs.push({ type: 'critter', x: ox + 300, y: oy + 250, variant: 'slime', color: '#3b82f6' });
    // Furniture
    decs.push({ type: 'hay', x: ox + 60,  y: oy + 290, size: 44 });
    decs.push({ type: 'hay', x: ox + 320, y: oy + 310, size: 38 });
    decs.push({ type: 'flowers', x: ox + 120, y: oy + 200, size: 32 });
    decs.push({ type: 'flowers', x: ox + 260, y: oy + 180, size: 32 });
    return { decorations: decs, obstacles: obs };
}

// Tree-line backdrop — used to soften map edges with vegetation
function treeLine(ox, oy, length = 800, seed = 1) {
    const r = rng(seed, 53);
    const decs = [];
    const obs = [];
    const step = 110;
    for (let x = 0; x < length; x += step + Math.floor(r() * 40)) {
        const isPine = r() < 0.55;
        const w = isPine ? 70 + Math.floor(r() * 20) : 80 + Math.floor(r() * 20);
        const h = isPine ? 100 + Math.floor(r() * 25) : 95 + Math.floor(r() * 25);
        decs.push({
            type: isPine ? 'pine_tree' : 'oak_tree',
            x: ox + x + (r() - 0.5) * 12,
            y: oy + (r() - 0.5) * 20,
            width: w, height: h,
        });
        obs.push({ x: ox + x + w / 2 - 14, y: oy + h - 14, width: 28, height: 14 });
    }
    return { decorations: decs, obstacles: obs };
}

// Town houses — a row of 2-3 simple house facades (using shop_building variant)
// with fences, planters and a couple of barrels — gives perimeter density.
function townHouses(ox, oy, count = 2, seed = 1) {
    const r = rng(seed, 113);
    const decs = [];
    const obs = [];
    const SPACING = 300;
    for (let i = 0; i < count; i++) {
        const hx = ox + i * SPACING;
        const tint = (i * 7 + Math.floor(r() * 3)) % 3;
        // House (reuses shop_building sprite — varies in scale for size diversity)
        const w = 220 + Math.floor(r() * 40);
        const h = 130 + Math.floor(r() * 20);
        decs.push({ type: 'shop_building', x: hx, y: oy, width: w, height: h });
        obs.push({ x: hx, y: oy, width: w, height: h - 20, type: 'house' });
        // Front fence
        decs.push({ type: 'fence', x: hx - 4, y: oy + h + 4, width: w + 8, height: 16 });
        // Door planters
        decs.push({ type: 'planter', x: hx + w * 0.25, y: oy + h + 30, width: 50, height: 28 });
        decs.push({ type: 'planter', x: hx + w * 0.75, y: oy + h + 30, width: 50, height: 28 });
        // Small variation per house
        if (tint === 0) {
            decs.push({ type: 'barrel', x: hx + 16, y: oy + h - 4, size: 32 });
        } else if (tint === 1) {
            decs.push({ type: 'crate',  x: hx + w - 16, y: oy + h - 4, size: 32 });
        } else {
            decs.push({ type: 'flowers', x: hx + w / 2, y: oy + h + 56, size: 30 });
        }
        // Banner over door for some houses
        if (i % 2 === 0) {
            decs.push({ type: 'banner', x: hx + w / 2, y: oy + 20, color: '#dc2626', icon: '★' });
        }
    }
    return { decorations: decs, obstacles: obs };
}

// Royal dais — throne on raised platform, flanked by guards & wall torches.
// Anchor point is the CENTER of the dais base; the prefab extends upward (north)
// for the throne and outward for guards/torches/carpet.
function royalDais(ox, oy) {
    return {
        decorations: [
            // Long red ceremonial carpet running south from the throne
            { type: 'rug', x: ox, y: oy + 240, width: 220, height: 480, color: '#7f1d1d', z: 1 },
            { type: 'rect', x: ox - 110, y: oy + 240, width: 220, height: 8, color: '#fbbf24', opacity: 0.8, z: 1 },
            { type: 'rect', x: ox - 110, y: oy + 720, width: 220, height: 8, color: '#fbbf24', opacity: 0.8, z: 1 },
            // Raised dais platform (stone block under the throne)
            { type: 'rect', x: ox - 90, y: oy + 60, width: 180, height: 90, color: '#3a3a52', opacity: 0.85, radius: '6px', z: 1 },
            { type: 'rect', x: ox - 90, y: oy + 56, width: 180, height: 8, color: '#6a6a82', opacity: 0.9, z: 1 },
            // Throne itself
            { type: 'throne', x: ox, y: oy + 100, size: 110 },
            // Armor stand guards flanking the throne
            { type: 'sprite', name: 'armor_stand', x: ox - 130, y: oy + 120, scale: 1.5 },
            { type: 'sprite', name: 'armor_stand', x: ox + 130, y: oy + 120, scale: 1.5 },
            // Wall torches behind the throne with halos
            { type: 'sprite', name: 'wall_torch', x: ox - 80, y: oy + 30, scale: 1.6 },
            { type: 'sprite', name: 'wall_torch', x: ox + 80, y: oy + 30, scale: 1.6 },
            { type: 'lantern_glow', x: ox - 80, y: oy + 10, radius: 90, color: 'rgba(255,170,60,0.45)', z: 2 },
            { type: 'lantern_glow', x: ox + 80, y: oy + 10, radius: 90, color: 'rgba(255,170,60,0.45)', z: 2 },
            // Banners on the back wall, framing the throne
            { type: 'banner', x: ox - 200, y: oy - 10, color: '#7c3aed', icon: '⚔' },
            { type: 'banner', x: ox + 200, y: oy - 10, color: '#7c3aed', icon: '⚔' },
        ],
        obstacles: [
            // Throne platform — solid
            { x: ox - 90, y: oy + 60, width: 180, height: 90, type: 'throne_platform' },
        ],
    };
}

// Tavern corner — a complete dining cluster (table + chairs + mug + candle light)
function tavernCorner(ox, oy) {
    return {
        decorations: [
            // Wooden table (already a sprite prop, anchored by width/height)
            { type: 'table', x: ox, y: oy, width: 120, height: 80 },
            // Stools around the table — N, S, E, W
            { type: 'stool', x: ox + 60,  y: oy - 8,  size: 30 },
            { type: 'stool', x: ox + 60,  y: oy + 88, size: 30 },
            { type: 'stool', x: ox + 10,  y: oy + 40, size: 30 },
            { type: 'stool', x: ox + 110, y: oy + 40, size: 30 },
            // Mug on the table (candelabra is already part of the dining_table sprite,
            // but `table` is the plain woodenTable variant — we add a mug for life)
            { type: 'mug', x: ox + 50, y: oy + 38, size: 26 },
            { type: 'mug', x: ox + 78, y: oy + 38, size: 26 },
            // Warm candle glow over the table
            { type: 'lantern_glow', x: ox + 60, y: oy + 40, radius: 90, color: 'rgba(255,180,80,0.32)', z: 1 },
        ],
        obstacles: [
            // Table is solid
            { x: ox, y: oy, width: 120, height: 80, type: 'table' },
        ],
    };
}

// Crypt chamber — corner of a dungeon room with pillars, torches, ceremonial slab
function cryptChamber(ox, oy) {
    return {
        decorations: [
            // 4 stone pillars defining a square room
            { type: 'pillar', x: ox,       y: oy,       width: 80, height: 120 },
            { type: 'pillar', x: ox + 240, y: oy,       width: 80, height: 120 },
            { type: 'pillar', x: ox,       y: oy + 240, width: 80, height: 120 },
            { type: 'pillar', x: ox + 240, y: oy + 240, width: 80, height: 120 },
            // Wall torches between pillars (N + S walls)
            { type: 'torch', x: ox + 160, y: oy + 40, size: 40 },
            { type: 'torch', x: ox + 160, y: oy + 280, size: 40 },
            { type: 'lantern_glow', x: ox + 160, y: oy + 50, radius: 110, color: 'rgba(255,160,80,0.32)', z: 1 },
            { type: 'lantern_glow', x: ox + 160, y: oy + 290, radius: 110, color: 'rgba(255,160,80,0.32)', z: 1 },
            // Ceremonial slab in the middle (using the table sprite as stone coffin)
            { type: 'table', x: ox + 100, y: oy + 140, width: 120, height: 60 },
            // Cracked floor patches around the slab
            { type: 'cobble_patch', x: ox + 160, y: oy + 160, width: 200, height: 120, color: '#0a0a14', opacity: 0.5, z: 0 },
            { type: 'crack', x: ox + 80,  y: oy + 200, length: 80, angle: 25, z: 0 },
            { type: 'crack', x: ox + 240, y: oy + 200, length: 70, angle: -15, z: 0 },
            { type: 'puddle', x: ox + 60,  y: oy + 300, size: 50, z: 0 },
            { type: 'puddle', x: ox + 280, y: oy + 60,  size: 40, z: 0 },
        ],
        obstacles: [
            // Pillars are solid (kept from original map style)
            { x: ox,       y: oy,       width: 80, height: 80 },
            { x: ox + 240, y: oy,       width: 80, height: 80 },
            { x: ox,       y: oy + 240, width: 80, height: 80 },
            { x: ox + 240, y: oy + 240, width: 80, height: 80 },
            { x: ox + 100, y: oy + 140, width: 120, height: 60, type: 'slab' },
        ],
    };
}

// Forest clearing — open glade with one centerpiece oak + ring of life around it
function forestClearing(ox, oy, seed = 1) {
    const r = rng(seed, 97);
    const decorations = [];
    const obstacles = [];

    // Soft ground tint (lighter grass + a few flowers ring)
    decorations.push({ type: 'rect', x: ox - 180, y: oy - 130, width: 360, height: 260,
        color: '#9bc54a', opacity: 0.12, radius: '9999px', z: 0 });

    // Centerpiece old oak
    decorations.push({ type: 'oak_tree', x: ox - 30, y: oy - 60, width: 100, height: 130 });
    obstacles.push({ x: ox - 15, y: oy + 60, width: 30, height: 16 });

    // Mushroom ring (faerie ring) — 6 mushrooms at ~80px radius
    const N = 6;
    for (let i = 0; i < N; i++) {
        const angle = (i / N) * Math.PI * 2 + (r() - 0.5) * 0.4;
        const rad = 78 + (r() - 0.5) * 14;
        decorations.push({
            type: 'sprite', name: 'mushroom',
            x: ox + Math.cos(angle) * rad,
            y: oy + Math.sin(angle) * rad * 0.7,
            scale: 1.5 + r() * 0.4,
            z: oy + 50,
        });
    }

    // Outer bushes & flowers
    const outer = [
        [-150, -60], [-130, 80], [-40, -110], [110, -80],
        [140, 70], [70, 110], [-90, 120], [160, -20],
    ];
    outer.forEach((p, i) => {
        if (i % 2 === 0) {
            decorations.push({ type: 'bush', x: ox + p[0], y: oy + p[1], size: 46 + Math.floor(r() * 12) });
        } else {
            decorations.push({ type: 'flowers', x: ox + p[0], y: oy + p[1], size: 28 + Math.floor(r() * 8) });
        }
    });

    // A grass tuft or two for ground texture
    decorations.push({ type: 'sprite', name: 'grass_tuft', x: ox - 60, y: oy + 90, scale: 1.6 });
    decorations.push({ type: 'sprite', name: 'grass_tuft', x: ox + 80, y: oy + 90, scale: 1.5 });

    return { decorations, obstacles };
}

// -----------------------------------------------------------------------------
//  Registry + expander
// -----------------------------------------------------------------------------

const PREFAB_FNS = {
    shop_complete:  (p) => shopComplete(p.x, p.y),
    forest_grove:   (p) => forestGrove(p.x, p.y, p.seed ?? 1),
    garden_patch:   (p) => gardenPatch(p.x, p.y, p.seed ?? 1),
    market_corner:  (p) => marketCorner(p.x, p.y, p.accent),
    sanctuary_pen:  (p) => sanctuaryPen(p.x, p.y, p.width, p.height),
    tree_line:      (p) => treeLine(p.x, p.y, p.length ?? 800, p.seed ?? 1),
    royal_dais:     (p) => royalDais(p.x, p.y),
    tavern_corner:  (p) => tavernCorner(p.x, p.y),
    crypt_chamber:  (p) => cryptChamber(p.x, p.y),
    forest_clearing:(p) => forestClearing(p.x, p.y, p.seed ?? 1),
    town_houses:    (p) => townHouses(p.x, p.y, p.count ?? 2, p.seed ?? 1),
};

/**
 * Expand a list of `{ name, ...props }` prefab placements into flat
 * decorations + obstacles arrays. Unknown prefab names are ignored.
 */
export function expandPrefabs(placements = []) {
    const decorations = [];
    const obstacles = [];
    for (const p of placements) {
        const fn = PREFAB_FNS[p.name];
        if (!fn) continue;
        const out = fn(p);
        if (out.decorations) decorations.push(...out.decorations);
        if (out.obstacles)   obstacles.push(...out.obstacles);
    }
    return { decorations, obstacles };
}

export const PREFAB_NAMES = Object.keys(PREFAB_FNS);
