// =============================================================================
//  WORLD PROPS — Stardew-inspired pixel art for PlayableWorld
// =============================================================================
//  All props are procedurally generated pixel buffers (HEX colors + 'transparent').
//  Each generator returns { w, h, buffer } where buffer.length === w * h.
//  WorldSprite renders the buffer as crisp inline SVG, anchored bottom-center.
// =============================================================================

import React from 'react';

// -----------------------------------------------------------------------------
//  Stardew-flavored palette (warm earth, saturated foliage)
// -----------------------------------------------------------------------------

export const PAL = {
    // Wood tones (trunks, planks, posts)
    woodDark:  '#3a2412',
    woodBase:  '#5a3a1a',
    woodMid:   '#7a5a2a',
    woodHi:    '#9a7a3a',
    woodLite:  '#b89858',
    // Foliage (canopies, bushes, grass details)
    leafShade: '#2d4a16',
    leafDark:  '#3f6a20',
    leafBase:  '#5a8a2a',
    leafMid:   '#7aaa40',
    leafHi:    '#a8d05a',
    leafSpot:  '#c8e870',
    // Stone (walls, paths, structures)
    stoneShade:'#3a3a42',
    stoneDark: '#5a5a62',
    stoneBase: '#7a7a82',
    stoneMid:  '#9a9aa2',
    stoneHi:   '#babac2',
    // Metal (iron, lanterns, weapons)
    ironDark:  '#22252a',
    ironBase:  '#3a3f48',
    ironHi:    '#5a6068',
    brassDark: '#7a5a18',
    brassBase: '#b48a28',
    brassHi:   '#e8c048',
    // Cloth / banners / rugs
    redDark:   '#6a1818',
    redBase:   '#9a2a2a',
    redHi:     '#c84040',
    blueDark:  '#1a3a6a',
    blueBase:  '#2a5a9a',
    blueHi:    '#4a8ac8',
    purpleDark:'#3a1a5a',
    purpleBase:'#6a2a9a',
    purpleHi:  '#9a5ad0',
    // Flowers / accents
    pink:      '#e87aa8',
    yellow:    '#f4c842',
    orange:    '#e88a28',
    white:     '#f4ecd8',
    // Shadow / outline
    outline:   '#1a0e08',
    shadow:    'rgba(0,0,0,0.35)',
};

// -----------------------------------------------------------------------------
//  Buffer helpers
// -----------------------------------------------------------------------------

function makeBuf(w, h, fill = 'transparent') {
    return new Array(w * h).fill(fill);
}

function setter(buf, w, h) {
    return (x, y, c) => {
        if (x < 0 || x >= w || y < 0 || y >= h) return;
        buf[y * w + x] = c;
    };
}

function rect(buf, w, h, x, y, rw, rh, color) {
    const set = setter(buf, w, h);
    for (let dy = 0; dy < rh; dy++) for (let dx = 0; dx < rw; dx++) set(x + dx, y + dy, color);
}

// Filled circle (Bresenham-ish), great for canopies/bushes
function disc(buf, w, h, cx, cy, r, color) {
    const set = setter(buf, w, h);
    const r2 = r * r;
    for (let dy = -r; dy <= r; dy++) {
        for (let dx = -r; dx <= r; dx++) {
            if (dx * dx + dy * dy <= r2) set(cx + dx, cy + dy, color);
        }
    }
}

// Ellipse (filled) with separate radii
function ellipse(buf, w, h, cx, cy, rx, ry, color) {
    const set = setter(buf, w, h);
    for (let dy = -ry; dy <= ry; dy++) {
        for (let dx = -rx; dx <= rx; dx++) {
            if ((dx * dx) / (rx * rx) + (dy * dy) / (ry * ry) <= 1) set(cx + dx, cy + dy, color);
        }
    }
}

// Hash for cheap deterministic noise
const noise = (x, y, salt = 0) => ((x * 73856093) ^ (y * 19349663) ^ (salt * 83492791)) >>> 0;

// -----------------------------------------------------------------------------
//  Nature props
// -----------------------------------------------------------------------------

function oakTree() {
    const w = 48, h = 64;
    const buf = makeBuf(w, h);
    const set = setter(buf, w, h);

    // Trunk: thick, slight taper, gnarled
    rect(buf, w, h, 21, 44, 7, 20, PAL.woodBase);
    rect(buf, w, h, 22, 44, 5, 20, PAL.woodMid);
    rect(buf, w, h, 23, 44, 1, 20, PAL.woodHi);
    rect(buf, w, h, 27, 44, 1, 20, PAL.woodDark);
    // Canopy occlusion — the leaves above cast a dark ring on the top of
    // the trunk. Cheap 3/4 volume cue: this is what makes the canopy feel
    // like a 3D dome instead of a flat sticker glued to the trunk.
    rect(buf, w, h, 21, 44, 7, 2, PAL.woodDark);
    rect(buf, w, h, 22, 46, 5, 1, PAL.woodBase);
    // Roots flare
    set(20, 62, PAL.woodBase); set(20, 63, PAL.woodBase);
    set(28, 62, PAL.woodBase); set(28, 63, PAL.woodBase);
    set(19, 63, PAL.woodDark); set(29, 63, PAL.woodDark);
    // Bark texture
    set(23, 48, PAL.woodDark); set(25, 52, PAL.woodDark); set(24, 56, PAL.woodDark);
    set(26, 50, PAL.woodHi); set(24, 54, PAL.woodHi);

    // Canopy: layered discs for irregular silhouette
    disc(buf, w, h, 24, 22, 18, PAL.leafShade);  // outer dark
    disc(buf, w, h, 24, 22, 17, PAL.leafDark);
    disc(buf, w, h, 22, 24, 14, PAL.leafBase);
    disc(buf, w, h, 28, 18, 10, PAL.leafBase);
    disc(buf, w, h, 18, 18, 9, PAL.leafMid);
    disc(buf, w, h, 30, 26, 7, PAL.leafMid);
    disc(buf, w, h, 24, 12, 6, PAL.leafMid);
    // Highlights (sunlight from top-left)
    disc(buf, w, h, 18, 14, 5, PAL.leafHi);
    disc(buf, w, h, 26, 10, 3, PAL.leafHi);
    disc(buf, w, h, 14, 22, 3, PAL.leafHi);
    set(20, 10, PAL.leafSpot); set(15, 16, PAL.leafSpot);
    set(28, 8, PAL.leafSpot); set(12, 20, PAL.leafSpot);
    // Speckle shadows
    for (let i = 0; i < 30; i++) {
        const n = noise(i, 7);
        const x = 8 + (n % 32);
        const y = 6 + ((n >> 5) % 30);
        if (buf[y * w + x] === PAL.leafBase) buf[y * w + x] = PAL.leafDark;
    }

    return { w, h, buffer: buf };
}

function pineTree() {
    const w = 40, h = 72;
    const buf = makeBuf(w, h);
    const set = setter(buf, w, h);

    // Trunk
    rect(buf, w, h, 18, 56, 4, 16, PAL.woodBase);
    rect(buf, w, h, 19, 56, 2, 16, PAL.woodMid);
    rect(buf, w, h, 18, 56, 1, 16, PAL.woodDark);
    rect(buf, w, h, 21, 56, 1, 16, PAL.woodDark);
    // Roots
    set(17, 70, PAL.woodBase); set(22, 70, PAL.woodBase);
    set(16, 71, PAL.woodDark); set(23, 71, PAL.woodDark);

    // Three triangle tiers (each tier: narrow at top, widest at bottom — skirt shape)
    const drawTier = (cy, halfW, hgt) => {
        for (let dy = 0; dy < hgt; dy++) {
            const ww = Math.round(halfW * (dy / (hgt - 1))); // 0 at top → halfW at bottom
            for (let dx = -ww; dx <= ww; dx++) {
                set(20 + dx, cy + dy, PAL.leafDark);
            }
        }
    };
    drawTier(40, 18, 18);  // bottom tier
    drawTier(24, 14, 16);  // middle tier
    drawTier(8, 10, 16);   // top tier
    // Highlight on left side (sun)
    const drawHi = (cy, halfW, hgt) => {
        for (let dy = 1; dy < hgt - 1; dy++) {
            const ww = Math.round(halfW * (dy / (hgt - 1)));
            if (ww < 2) continue;
            for (let dx = -ww; dx <= -ww + 3; dx++) {
                set(20 + dx, cy + dy, PAL.leafBase);
            }
            set(20 - ww + 1, cy + dy, PAL.leafMid);
        }
    };
    drawHi(40, 18, 18);
    drawHi(24, 14, 16);
    drawHi(8, 10, 16);
    // Snowy tips / highlights
    set(20, 8, PAL.leafHi); set(19, 9, PAL.leafHi); set(21, 9, PAL.leafHi);
    set(20, 24, PAL.leafMid); set(20, 40, PAL.leafMid);

    return { w, h, buffer: buf };
}

function bush() {
    const w = 32, h = 22;
    const buf = makeBuf(w, h);
    const set = setter(buf, w, h);

    // Three overlapping discs as squashed dome
    ellipse(buf, w, h, 10, 16, 8, 5, PAL.leafShade);
    ellipse(buf, w, h, 22, 16, 8, 5, PAL.leafShade);
    ellipse(buf, w, h, 16, 12, 11, 7, PAL.leafShade);
    ellipse(buf, w, h, 10, 15, 7, 4, PAL.leafDark);
    ellipse(buf, w, h, 22, 15, 7, 4, PAL.leafDark);
    ellipse(buf, w, h, 16, 11, 10, 6, PAL.leafBase);
    // Highlight top-left
    ellipse(buf, w, h, 12, 8, 5, 3, PAL.leafMid);
    ellipse(buf, w, h, 10, 7, 2, 1, PAL.leafHi);
    set(14, 6, PAL.leafSpot); set(8, 9, PAL.leafSpot);
    // Tiny berries (random)
    set(20, 9, PAL.redHi); set(20, 10, PAL.redDark);
    set(24, 13, PAL.redHi); set(24, 14, PAL.redDark);

    return { w, h, buffer: buf };
}

function flowersCluster() {
    const w = 28, h = 18;
    const buf = makeBuf(w, h);
    const set = setter(buf, w, h);

    // Grass tufts at base
    for (let i = 0; i < w; i++) {
        const tall = 2 + (noise(i, 3) % 3);
        for (let j = 0; j < tall; j++) set(i, h - 1 - j, PAL.leafBase);
        set(i, h - 1, PAL.leafDark);
    }

    // Flowers: stem + bloom (4 of them, varied colors)
    const blooms = [
        { x: 5,  c: PAL.yellow, cd: PAL.orange },
        { x: 11, c: PAL.pink,   cd: PAL.redBase },
        { x: 17, c: PAL.white,  cd: PAL.stoneMid },
        { x: 23, c: PAL.purpleHi, cd: PAL.purpleBase },
    ];
    blooms.forEach(({ x, c, cd }) => {
        const stemTop = 6 + (noise(x, 5) % 3);
        for (let y = stemTop; y < h - 2; y++) set(x, y, PAL.leafDark);
        // Bloom: 3x3 cross with center
        set(x, stemTop - 1, c); set(x - 1, stemTop, c); set(x + 1, stemTop, c);
        set(x, stemTop, cd); // center
        set(x, stemTop + 1, c);
        // Petal highlight
        set(x - 1, stemTop - 1, c);
    });

    return { w, h, buffer: buf };
}

function mushroom() {
    const w = 16, h = 14;
    const buf = makeBuf(w, h);
    const set = setter(buf, w, h);
    // Stem
    rect(buf, w, h, 6, 9, 4, 4, PAL.white);
    rect(buf, w, h, 6, 9, 1, 4, PAL.stoneMid);
    // Cap
    ellipse(buf, w, h, 8, 6, 6, 4, PAL.redDark);
    ellipse(buf, w, h, 8, 5, 6, 3, PAL.redBase);
    ellipse(buf, w, h, 7, 4, 4, 2, PAL.redHi);
    // Spots
    set(5, 5, PAL.white); set(10, 6, PAL.white); set(8, 3, PAL.white);
    return { w, h, buffer: buf };
}

function grassTuft() {
    const w = 14, h = 10;
    const buf = makeBuf(w, h);
    const set = setter(buf, w, h);
    const blades = [[2, 6], [4, 4], [6, 2], [8, 5], [10, 3], [12, 6]];
    blades.forEach(([x, top]) => {
        for (let y = top; y < h - 1; y++) set(x, y, PAL.leafBase);
        set(x, top, PAL.leafMid);
        set(x - 1, top + 2, PAL.leafDark);
    });
    // Base
    for (let i = 1; i < w - 1; i++) set(i, h - 1, PAL.leafDark);
    return { w, h, buffer: buf };
}

// -----------------------------------------------------------------------------
//  Town structures
// -----------------------------------------------------------------------------

function stoneWell() {
    const w = 32, h = 36;
    const buf = makeBuf(w, h);
    const set = setter(buf, w, h);
    // Base ring (cylindrical perspective)
    ellipse(buf, w, h, 16, 30, 14, 4, PAL.stoneShade);
    ellipse(buf, w, h, 16, 30, 14, 3, PAL.stoneDark);
    rect(buf, w, h, 2, 22, 28, 9, PAL.stoneDark);
    // Stone blocks pattern on wall
    for (let bx = 2; bx < 30; bx += 7) {
        rect(buf, w, h, bx, 22, 6, 4, PAL.stoneBase);
        rect(buf, w, h, bx, 22, 6, 1, PAL.stoneMid);
        rect(buf, w, h, bx, 25, 6, 1, PAL.stoneShade);
    }
    for (let bx = 5; bx < 30; bx += 7) {
        rect(buf, w, h, bx, 26, 6, 4, PAL.stoneBase);
        rect(buf, w, h, bx, 26, 6, 1, PAL.stoneMid);
    }
    // Water inside (top oval)
    ellipse(buf, w, h, 16, 22, 12, 3, PAL.blueDark);
    ellipse(buf, w, h, 16, 21, 11, 2, PAL.blueBase);
    set(12, 21, PAL.blueHi); set(20, 22, PAL.blueHi);
    // Rim
    ellipse(buf, w, h, 16, 20, 13, 2, PAL.stoneHi);
    ellipse(buf, w, h, 16, 20, 13, 1, PAL.stoneMid);
    // Wooden support posts
    rect(buf, w, h, 4, 6, 3, 16, PAL.woodBase);
    rect(buf, w, h, 4, 6, 1, 16, PAL.woodHi);
    rect(buf, w, h, 6, 6, 1, 16, PAL.woodDark);
    rect(buf, w, h, 25, 6, 3, 16, PAL.woodBase);
    rect(buf, w, h, 25, 6, 1, 16, PAL.woodHi);
    rect(buf, w, h, 27, 6, 1, 16, PAL.woodDark);
    // Roof beam
    rect(buf, w, h, 3, 4, 26, 3, PAL.woodBase);
    rect(buf, w, h, 3, 4, 26, 1, PAL.woodHi);
    // Sloped roof (peaked)
    for (let r = 0; r < 5; r++) {
        rect(buf, w, h, 2 + r, 3 - r, 28 - r * 2, 1, PAL.redBase);
    }
    rect(buf, w, h, 7, 4, 18, 1, PAL.redDark);
    set(15, 0, PAL.redHi); set(16, 0, PAL.redHi);
    // Rope + bucket hanging
    set(16, 5, PAL.woodDark);
    for (let y = 6; y < 12; y++) set(16, y, PAL.woodHi);
    rect(buf, w, h, 14, 12, 5, 4, PAL.woodMid);
    rect(buf, w, h, 14, 12, 5, 1, PAL.woodHi);
    rect(buf, w, h, 14, 15, 5, 1, PAL.woodDark);
    return { w, h, buffer: buf };
}

function ironLamp() {
    const w = 12, h = 32;
    const buf = makeBuf(w, h);
    const set = setter(buf, w, h);
    // Base
    rect(buf, w, h, 4, 30, 4, 2, PAL.ironDark);
    rect(buf, w, h, 3, 28, 6, 2, PAL.ironBase);
    rect(buf, w, h, 3, 28, 6, 1, PAL.ironHi);
    // Post
    rect(buf, w, h, 5, 8, 2, 22, PAL.ironBase);
    rect(buf, w, h, 5, 8, 1, 22, PAL.ironHi);
    // Bracket (top curl)
    set(4, 7, PAL.ironBase); set(7, 7, PAL.ironBase);
    set(3, 6, PAL.ironBase); set(8, 6, PAL.ironBase);
    // Lantern body (rounded square)
    rect(buf, w, h, 3, 2, 6, 5, PAL.ironDark);
    rect(buf, w, h, 4, 1, 4, 1, PAL.ironDark);
    rect(buf, w, h, 4, 6, 4, 1, PAL.ironDark);
    // Glass with warm glow
    rect(buf, w, h, 4, 3, 4, 3, PAL.brassHi);
    set(5, 3, PAL.white); set(6, 4, PAL.white);
    // Bars across glass
    set(4, 4, PAL.ironDark); set(7, 4, PAL.ironDark);
    // Top cap
    set(5, 0, PAL.ironBase); set(6, 0, PAL.ironBase);
    return { w, h, buffer: buf };
}

function woodenBench() {
    const w = 36, h = 18;
    const buf = makeBuf(w, h);
    const set = setter(buf, w, h);
    // Seat slat
    rect(buf, w, h, 2, 6, 32, 3, PAL.woodMid);
    rect(buf, w, h, 2, 6, 32, 1, PAL.woodLite);
    rect(buf, w, h, 2, 8, 32, 1, PAL.woodDark);
    // Front edge thin
    rect(buf, w, h, 2, 9, 32, 1, PAL.woodBase);
    // Wood grain
    for (let x = 4; x < 32; x += 5) set(x, 7, PAL.woodDark);
    // Legs
    rect(buf, w, h, 4, 9, 3, 8, PAL.woodBase);
    rect(buf, w, h, 4, 9, 1, 8, PAL.woodHi);
    rect(buf, w, h, 6, 9, 1, 8, PAL.woodDark);
    rect(buf, w, h, 29, 9, 3, 8, PAL.woodBase);
    rect(buf, w, h, 29, 9, 1, 8, PAL.woodHi);
    rect(buf, w, h, 31, 9, 1, 8, PAL.woodDark);
    // Lower brace
    rect(buf, w, h, 5, 14, 26, 1, PAL.woodDark);
    // Backrest (two vertical planks)
    rect(buf, w, h, 6, 0, 3, 6, PAL.woodMid);
    rect(buf, w, h, 6, 0, 1, 6, PAL.woodHi);
    rect(buf, w, h, 27, 0, 3, 6, PAL.woodMid);
    rect(buf, w, h, 27, 0, 1, 6, PAL.woodHi);
    rect(buf, w, h, 2, 1, 32, 1, PAL.woodBase);
    rect(buf, w, h, 2, 1, 32, 1, PAL.woodDark);
    return { w, h, buffer: buf };
}

function woodenBarrel() {
    const w = 20, h = 24;
    const buf = makeBuf(w, h);
    const set = setter(buf, w, h);
    // Body
    ellipse(buf, w, h, 10, 22, 9, 2, PAL.woodDark);
    rect(buf, w, h, 1, 4, 18, 18, PAL.woodMid);
    // Side curvature shading
    rect(buf, w, h, 1, 4, 2, 18, PAL.woodDark);
    rect(buf, w, h, 17, 4, 2, 18, PAL.woodDark);
    rect(buf, w, h, 3, 4, 2, 18, PAL.woodBase);
    rect(buf, w, h, 15, 4, 2, 18, PAL.woodBase);
    // Top rim
    rect(buf, w, h, 1, 3, 18, 2, PAL.woodHi);
    rect(buf, w, h, 1, 3, 18, 1, PAL.woodLite);
    ellipse(buf, w, h, 10, 4, 8, 2, PAL.woodDark);
    ellipse(buf, w, h, 10, 4, 7, 1, PAL.woodBase);
    // Iron bands
    rect(buf, w, h, 1, 8, 18, 2, PAL.ironDark);
    rect(buf, w, h, 1, 8, 18, 1, PAL.ironHi);
    rect(buf, w, h, 1, 16, 18, 2, PAL.ironDark);
    rect(buf, w, h, 1, 16, 18, 1, PAL.ironHi);
    // Wood plank seams
    for (let x = 4; x < 18; x += 3) {
        for (let y = 4; y < 22; y++) {
            if (y < 8 || (y > 9 && y < 16) || y > 17) set(x, y, PAL.woodDark);
        }
    }
    return { w, h, buffer: buf };
}

function woodenCrate() {
    const w = 20, h = 20;
    const buf = makeBuf(w, h);
    const set = setter(buf, w, h);
    rect(buf, w, h, 1, 1, 18, 18, PAL.woodMid);
    // Outer border
    rect(buf, w, h, 1, 1, 18, 1, PAL.woodHi);
    rect(buf, w, h, 1, 18, 18, 1, PAL.woodDark);
    rect(buf, w, h, 1, 1, 1, 18, PAL.woodHi);
    rect(buf, w, h, 18, 1, 1, 18, PAL.woodDark);
    // Frame planks
    rect(buf, w, h, 3, 3, 14, 1, PAL.woodDark);
    rect(buf, w, h, 3, 16, 14, 1, PAL.woodDark);
    rect(buf, w, h, 3, 3, 1, 14, PAL.woodDark);
    rect(buf, w, h, 16, 3, 1, 14, PAL.woodDark);
    // Diagonal cross
    for (let i = 0; i < 13; i++) {
        set(4 + i, 4 + i, PAL.woodDark);
        set(16 - i, 4 + i, PAL.woodDark);
    }
    // Nail dots
    set(4, 4, PAL.ironHi); set(15, 4, PAL.ironHi);
    set(4, 15, PAL.ironHi); set(15, 15, PAL.ironHi);
    return { w, h, buffer: buf };
}

function woodenSign() {
    const w = 28, h = 36;
    const buf = makeBuf(w, h);
    const set = setter(buf, w, h);
    // Post
    rect(buf, w, h, 12, 18, 4, 18, PAL.woodBase);
    rect(buf, w, h, 12, 18, 1, 18, PAL.woodHi);
    rect(buf, w, h, 15, 18, 1, 18, PAL.woodDark);
    // Crossbeam top
    rect(buf, w, h, 4, 4, 20, 2, PAL.woodBase);
    rect(buf, w, h, 4, 4, 20, 1, PAL.woodHi);
    // Hanging chains
    set(7, 6, PAL.ironDark); set(7, 7, PAL.ironDark); set(7, 8, PAL.ironDark);
    set(20, 6, PAL.ironDark); set(20, 7, PAL.ironDark); set(20, 8, PAL.ironDark);
    // Sign board
    rect(buf, w, h, 4, 9, 20, 10, PAL.woodMid);
    rect(buf, w, h, 4, 9, 20, 1, PAL.woodLite);
    rect(buf, w, h, 4, 18, 20, 1, PAL.woodDark);
    rect(buf, w, h, 4, 9, 1, 10, PAL.woodHi);
    rect(buf, w, h, 23, 9, 1, 10, PAL.woodDark);
    // Wood grain on board
    for (let x = 6; x < 23; x += 4) {
        rect(buf, w, h, x, 12, 1, 4, PAL.woodDark);
    }
    return { w, h, buffer: buf };
}

function woodFence() {
    // Tileable horizontal fence section
    const w = 32, h = 18;
    const buf = makeBuf(w, h);
    // Horizontal beams
    rect(buf, w, h, 0, 4, 32, 2, PAL.woodBase);
    rect(buf, w, h, 0, 4, 32, 1, PAL.woodHi);
    rect(buf, w, h, 0, 12, 32, 2, PAL.woodBase);
    rect(buf, w, h, 0, 12, 32, 1, PAL.woodHi);
    // Vertical posts
    for (let x = 2; x < 32; x += 10) {
        rect(buf, w, h, x, 0, 3, 18, PAL.woodMid);
        rect(buf, w, h, x, 0, 1, 18, PAL.woodHi);
        rect(buf, w, h, x + 2, 0, 1, 18, PAL.woodDark);
        // Pointed top
        const set = setter(buf, w, h);
        set(x, 0, 'transparent'); set(x + 2, 0, 'transparent');
        set(x + 1, 0, PAL.woodHi);
    }
    return { w, h, buffer: buf };
}

function planter() {
    const w = 32, h = 18;
    const buf = makeBuf(w, h);
    const set = setter(buf, w, h);
    // Wooden box
    rect(buf, w, h, 1, 6, 30, 11, PAL.woodMid);
    rect(buf, w, h, 1, 6, 30, 1, PAL.woodLite);
    rect(buf, w, h, 1, 16, 30, 1, PAL.woodDark);
    rect(buf, w, h, 1, 6, 1, 11, PAL.woodHi);
    rect(buf, w, h, 30, 6, 1, 11, PAL.woodDark);
    // Plank seams
    for (let x = 6; x < 30; x += 6) rect(buf, w, h, x, 8, 1, 8, PAL.woodDark);
    // Soil
    rect(buf, w, h, 2, 5, 28, 2, PAL.woodDark);
    // Flowers / herbs sticking out
    const blooms = [
        { x: 6, c: PAL.leafBase, top: PAL.yellow },
        { x: 11, c: PAL.leafMid, top: PAL.pink },
        { x: 17, c: PAL.leafBase, top: PAL.white },
        { x: 22, c: PAL.leafMid, top: PAL.redHi },
        { x: 27, c: PAL.leafBase, top: PAL.purpleHi },
    ];
    blooms.forEach(({ x, c, top }) => {
        for (let y = 1; y < 6; y++) set(x, y, c);
        set(x - 1, 2, c); set(x + 1, 3, c);
        set(x, 0, top); set(x - 1, 1, top); set(x + 1, 1, top);
    });
    return { w, h, buffer: buf };
}

function hayBale() {
    const w = 28, h = 22;
    const buf = makeBuf(w, h);
    const set = setter(buf, w, h);
    // Body
    ellipse(buf, w, h, 14, 20, 12, 2, PAL.shadow ? PAL.woodDark : PAL.brassDark);
    rect(buf, w, h, 2, 4, 24, 16, PAL.brassBase);
    rect(buf, w, h, 2, 4, 24, 2, PAL.brassHi);
    rect(buf, w, h, 2, 18, 24, 2, PAL.brassDark);
    // Hay strands
    for (let i = 0; i < 50; i++) {
        const n = noise(i, 12);
        const x = 3 + (n % 22);
        const y = 5 + ((n >> 5) % 14);
        const c = (n % 5 === 0) ? PAL.woodHi : PAL.brassHi;
        set(x, y, c);
    }
    // Rope wraps
    rect(buf, w, h, 9, 4, 1, 16, PAL.brassDark);
    rect(buf, w, h, 19, 4, 1, 16, PAL.brassDark);
    return { w, h, buffer: buf };
}

function weaponRack() {
    const w = 22, h = 32;
    const buf = makeBuf(w, h);
    const set = setter(buf, w, h);
    // Wooden frame
    rect(buf, w, h, 1, 2, 20, 2, PAL.woodBase);
    rect(buf, w, h, 1, 2, 20, 1, PAL.woodHi);
    rect(buf, w, h, 1, 28, 20, 2, PAL.woodBase);
    rect(buf, w, h, 1, 2, 2, 28, PAL.woodBase);
    rect(buf, w, h, 19, 2, 2, 28, PAL.woodBase);
    rect(buf, w, h, 1, 2, 1, 28, PAL.woodHi);
    rect(buf, w, h, 20, 2, 1, 28, PAL.woodDark);
    // Sword 1
    rect(buf, w, h, 6, 6, 1, 14, PAL.ironHi);
    rect(buf, w, h, 7, 6, 1, 14, PAL.ironBase);
    rect(buf, w, h, 4, 20, 5, 2, PAL.brassBase);
    rect(buf, w, h, 6, 22, 1, 4, PAL.woodDark);
    set(6, 5, PAL.ironHi);
    // Axe
    rect(buf, w, h, 13, 6, 1, 18, PAL.woodMid);
    rect(buf, w, h, 11, 6, 4, 4, PAL.ironBase);
    rect(buf, w, h, 11, 6, 4, 1, PAL.ironHi);
    rect(buf, w, h, 15, 8, 1, 2, PAL.ironHi);
    // Shield
    ellipse(buf, w, h, 16, 23, 3, 4, PAL.redBase);
    ellipse(buf, w, h, 16, 23, 2, 3, PAL.redHi);
    set(16, 23, PAL.brassHi);
    return { w, h, buffer: buf };
}

function marketStall(accent) {
    // Stardew-style stall: striped awning + wooden counter
    const w = 48, h = 40;
    const buf = makeBuf(w, h);
    const set = setter(buf, w, h);
    const c1 = accent || PAL.redBase;
    const c2 = PAL.white;
    // Roof poles
    rect(buf, w, h, 4, 4, 2, 18, PAL.woodBase);
    rect(buf, w, h, 42, 4, 2, 18, PAL.woodBase);
    // Striped awning
    rect(buf, w, h, 2, 2, 44, 8, c2);
    for (let x = 2; x < 46; x += 6) rect(buf, w, h, x, 2, 3, 8, c1);
    // Awning bottom scallop
    for (let x = 2; x < 46; x += 6) {
        rect(buf, w, h, x, 10, 3, 2, c1);
        rect(buf, w, h, x + 3, 10, 3, 1, c2);
        set(x + 1, 12, c1); set(x + 4, 11, c2);
    }
    // Roof beam
    rect(buf, w, h, 2, 1, 44, 1, PAL.woodDark);
    // Awning shadow — the striped awning above projects a soft shadow onto the
    // ground / counter top. Angled top-down (Pokémon RSE) reads volume by shade.
    rect(buf, w, h, 4, 20, 40, 2, 'rgba(0,0,0,0.35)');
    // Counter
    rect(buf, w, h, 4, 22, 40, 14, PAL.woodMid);
    rect(buf, w, h, 4, 22, 40, 2, PAL.woodBase);
    rect(buf, w, h, 4, 34, 40, 2, PAL.woodDark);
    // Counter front panels
    for (let x = 4; x < 44; x += 8) rect(buf, w, h, x, 24, 1, 10, PAL.woodDark);
    // Items on counter (apples / loaves)
    set(10, 21, PAL.redHi); set(11, 21, PAL.redHi); set(10, 20, PAL.redDark); set(11, 20, PAL.redDark);
    set(16, 21, PAL.brassHi); set(17, 21, PAL.brassHi); set(16, 20, PAL.brassDark);
    set(24, 21, PAL.leafMid); set(25, 21, PAL.leafBase); set(24, 20, PAL.leafDark);
    set(32, 21, PAL.purpleHi); set(33, 21, PAL.purpleHi); set(32, 20, PAL.purpleBase);
    set(38, 21, PAL.yellow); set(39, 21, PAL.yellow); set(38, 20, PAL.orange);
    // Shadow ground
    ellipse(buf, w, h, 24, 38, 22, 2, 'rgba(0,0,0,0.3)');
    return { w, h, buffer: buf };
}

function shopBuilding() {
    const w = 80, h = 60;
    const buf = makeBuf(w, h);
    const set = setter(buf, w, h);
    // Foundation
    rect(buf, w, h, 0, 52, 80, 8, PAL.stoneDark);
    rect(buf, w, h, 0, 52, 80, 1, PAL.stoneBase);
    // Wall
    rect(buf, w, h, 2, 22, 76, 32, PAL.woodLite);
    // Wall planks (vertical)
    for (let x = 4; x < 78; x += 6) rect(buf, w, h, x, 22, 1, 30, PAL.woodMid);
    // Eave shadow — the roof projects out and casts a dark band on the
    // wall top. This is what sells the 3/4 angled top-down (Pokémon RSE) look.
    rect(buf, w, h, 2, 22, 76, 2, PAL.woodBase);
    rect(buf, w, h, 2, 23, 76, 1, PAL.woodDark);
    // Wall horizontal beam
    rect(buf, w, h, 2, 36, 76, 2, PAL.woodBase);
    rect(buf, w, h, 2, 36, 76, 1, PAL.woodHi);
    // Roof (sloped, tiled)
    for (let r = 0; r < 18; r++) {
        const rw = 80 - r * 2;
        rect(buf, w, h, r, 22 - r, rw, 1, (r % 2 === 0) ? PAL.redDark : PAL.redBase);
    }
    // Roof tile rows highlight
    for (let r = 0; r < 18; r += 3) {
        rect(buf, w, h, r, 22 - r, 80 - r * 2, 1, PAL.redHi);
    }
    // Chimney
    rect(buf, w, h, 60, 0, 6, 12, PAL.stoneBase);
    rect(buf, w, h, 60, 0, 6, 1, PAL.stoneShade);
    rect(buf, w, h, 59, 0, 8, 2, PAL.stoneDark);
    // Door
    rect(buf, w, h, 36, 38, 10, 14, PAL.woodDark);
    rect(buf, w, h, 36, 38, 10, 1, PAL.woodBase);
    rect(buf, w, h, 36, 38, 1, 14, PAL.woodHi);
    rect(buf, w, h, 38, 41, 1, 8, PAL.woodMid);
    rect(buf, w, h, 42, 41, 1, 8, PAL.woodMid);
    set(44, 45, PAL.brassHi); // doorknob
    // Windows (left and right of door)
    rect(buf, w, h, 12, 30, 14, 10, PAL.ironDark);
    rect(buf, w, h, 13, 31, 12, 8, PAL.blueHi);
    rect(buf, w, h, 19, 31, 1, 8, PAL.ironBase);
    rect(buf, w, h, 13, 35, 12, 1, PAL.ironBase);
    rect(buf, w, h, 54, 30, 14, 10, PAL.ironDark);
    rect(buf, w, h, 55, 31, 12, 8, PAL.blueHi);
    rect(buf, w, h, 61, 31, 1, 8, PAL.ironBase);
    rect(buf, w, h, 55, 35, 12, 1, PAL.ironBase);
    // Window frames
    rect(buf, w, h, 12, 29, 14, 1, PAL.woodBase);
    rect(buf, w, h, 12, 40, 14, 1, PAL.woodBase);
    rect(buf, w, h, 54, 29, 14, 1, PAL.woodBase);
    rect(buf, w, h, 54, 40, 14, 1, PAL.woodBase);
    // Awning over door
    rect(buf, w, h, 32, 37, 18, 2, PAL.redBase);
    rect(buf, w, h, 33, 36, 16, 1, PAL.redHi);
    return { w, h, buffer: buf };
}

function clothBanner(accent) {
    const w = 16, h = 32;
    const buf = makeBuf(w, h);
    const set = setter(buf, w, h);
    const c = accent || PAL.purpleBase;
    const cd = accent ? PAL.outline : PAL.purpleDark;
    // Pole holder
    rect(buf, w, h, 0, 0, 16, 2, PAL.brassBase);
    rect(buf, w, h, 0, 0, 16, 1, PAL.brassHi);
    // Cloth
    rect(buf, w, h, 2, 2, 12, 24, c);
    rect(buf, w, h, 2, 2, 1, 24, cd);
    rect(buf, w, h, 13, 2, 1, 24, cd);
    // Highlight stripe
    rect(buf, w, h, 4, 4, 2, 20, accent ? PAL.white : PAL.purpleHi);
    // Bottom scallops
    rect(buf, w, h, 2, 26, 4, 2, c);
    rect(buf, w, h, 8, 26, 4, 2, c);
    set(3, 28, c); set(4, 29, c); set(10, 28, c); set(11, 29, c);
    rect(buf, w, h, 2, 26, 4, 1, cd);
    rect(buf, w, h, 8, 26, 4, 1, cd);
    // Emblem (4-pointed star)
    set(8, 12, PAL.brassHi);
    set(7, 13, PAL.brassHi); set(8, 13, PAL.white); set(9, 13, PAL.brassHi);
    set(8, 14, PAL.brassHi);
    return { w, h, buffer: buf };
}

// -----------------------------------------------------------------------------
//  Tavern interior props
// -----------------------------------------------------------------------------

function tavernMug() {
    const w = 16, h = 20;
    const buf = makeBuf(w, h);
    const set = setter(buf, w, h);
    // Body
    rect(buf, w, h, 3, 6, 8, 13, PAL.woodMid);
    rect(buf, w, h, 3, 6, 8, 1, PAL.woodLite);
    rect(buf, w, h, 3, 18, 8, 1, PAL.woodDark);
    rect(buf, w, h, 3, 6, 1, 13, PAL.woodHi);
    rect(buf, w, h, 10, 6, 1, 13, PAL.woodDark);
    // Iron bands
    rect(buf, w, h, 3, 9, 8, 1, PAL.ironDark);
    rect(buf, w, h, 3, 15, 8, 1, PAL.ironDark);
    // Foam top
    rect(buf, w, h, 3, 4, 8, 2, PAL.white);
    set(4, 3, PAL.white); set(6, 3, PAL.white); set(8, 3, PAL.white); set(9, 3, PAL.white);
    set(5, 5, PAL.stoneMid); set(8, 5, PAL.stoneMid);
    // Ale shine
    rect(buf, w, h, 5, 6, 1, 3, PAL.brassHi);
    // Handle (right side)
    rect(buf, w, h, 11, 8, 2, 1, PAL.woodDark);
    rect(buf, w, h, 13, 9, 1, 6, PAL.woodMid);
    rect(buf, w, h, 11, 15, 2, 1, PAL.woodDark);
    rect(buf, w, h, 12, 10, 1, 4, PAL.woodHi);
    return { w, h, buffer: buf };
}

function tavernStool() {
    const w = 18, h = 18;
    const buf = makeBuf(w, h);
    const set = setter(buf, w, h);
    // Top seat (round)
    ellipse(buf, w, h, 9, 5, 7, 3, PAL.woodBase);
    ellipse(buf, w, h, 9, 5, 7, 2, PAL.woodMid);
    ellipse(buf, w, h, 9, 4, 6, 1, PAL.woodHi);
    // Seat edge shadow
    ellipse(buf, w, h, 9, 6, 7, 1, PAL.woodDark);
    // Wood grain on seat
    set(6, 5, PAL.woodDark); set(11, 5, PAL.woodDark);
    // Legs (3 visible, slight perspective)
    rect(buf, w, h, 4, 7, 2, 10, PAL.woodBase);
    rect(buf, w, h, 4, 7, 1, 10, PAL.woodHi);
    rect(buf, w, h, 12, 7, 2, 10, PAL.woodBase);
    rect(buf, w, h, 13, 7, 1, 10, PAL.woodDark);
    rect(buf, w, h, 8, 7, 2, 10, PAL.woodMid);
    // Cross brace
    rect(buf, w, h, 5, 12, 8, 1, PAL.woodDark);
    return { w, h, buffer: buf };
}

function fireplace() {
    const w = 40, h = 48;
    const buf = makeBuf(w, h);
    const set = setter(buf, w, h);
    // Stone mantle/back wall
    rect(buf, w, h, 0, 0, w, 6, PAL.stoneShade);
    rect(buf, w, h, 0, 6, w, 2, PAL.stoneDark);
    rect(buf, w, h, 0, 8, w, 36, PAL.stoneDark);
    // Stone block pattern on outer wall
    for (let r = 0; r < 6; r++) {
        const off = (r % 2) * 4;
        for (let c = -1; c < 5; c++) {
            const x = off + c * 8;
            const y = 10 + r * 6;
            rect(buf, w, h, x, y, 7, 5, PAL.stoneBase);
            rect(buf, w, h, x, y, 7, 1, PAL.stoneMid);
            rect(buf, w, h, x, y + 4, 7, 1, PAL.stoneShade);
        }
    }
    // Mantle shelf
    rect(buf, w, h, 0, 4, w, 2, PAL.stoneMid);
    rect(buf, w, h, 0, 4, w, 1, PAL.stoneHi);
    // Hearth arch (cutout)
    rect(buf, w, h, 8, 14, 24, 30, PAL.ironDark);
    // Arch top
    for (let i = 0; i < 6; i++) {
        rect(buf, w, h, 8 + i, 14 - i, 24 - i * 2, 1, PAL.stoneShade);
    }
    // Fire bed (logs)
    rect(buf, w, h, 10, 38, 20, 4, PAL.woodDark);
    rect(buf, w, h, 11, 36, 18, 3, PAL.woodBase);
    rect(buf, w, h, 13, 34, 14, 3, PAL.woodMid);
    // Log ends
    set(10, 37, PAL.woodHi); set(29, 37, PAL.woodHi);
    set(11, 35, PAL.woodHi); set(28, 35, PAL.woodHi);
    // Flames
    const flameLayers = [
        { y: 30, w: 12, c: PAL.redDark },
        { y: 28, w: 10, c: PAL.orange },
        { y: 26, w: 8, c: PAL.brassHi },
        { y: 24, w: 6, c: PAL.yellow },
        { y: 22, w: 4, c: PAL.yellow },
        { y: 20, w: 2, c: PAL.white },
    ];
    flameLayers.forEach(({ y, w: fw, c }) => {
        rect(buf, w, h, 20 - fw / 2, y, fw, 4, c);
        // Round tops
        set(20 - fw / 2 - 1, y + 2, c);
        set(20 + fw / 2, y + 2, c);
    });
    // Sparks
    set(15, 22, PAL.yellow); set(25, 24, PAL.brassHi); set(18, 18, PAL.orange);
    return { w, h, buffer: buf };
}

function woodenTable() {
    const w = 56, h = 28;
    const buf = makeBuf(w, h);
    const set = setter(buf, w, h);
    // Top
    rect(buf, w, h, 2, 4, 52, 8, PAL.woodMid);
    rect(buf, w, h, 2, 4, 52, 1, PAL.woodLite);
    rect(buf, w, h, 2, 11, 52, 1, PAL.woodDark);
    rect(buf, w, h, 2, 12, 52, 2, PAL.woodDark);
    // Wood planks (3 slats)
    rect(buf, w, h, 2, 7, 52, 1, PAL.woodDark);
    rect(buf, w, h, 2, 9, 52, 1, PAL.woodDark);
    // Top grain dots
    for (let x = 4; x < 54; x += 6) set(x, 6, PAL.woodHi);
    for (let x = 7; x < 54; x += 6) set(x, 8, PAL.woodDark);
    // Legs
    rect(buf, w, h, 6, 14, 4, 13, PAL.woodBase);
    rect(buf, w, h, 6, 14, 1, 13, PAL.woodHi);
    rect(buf, w, h, 9, 14, 1, 13, PAL.woodDark);
    rect(buf, w, h, 46, 14, 4, 13, PAL.woodBase);
    rect(buf, w, h, 46, 14, 1, 13, PAL.woodHi);
    rect(buf, w, h, 49, 14, 1, 13, PAL.woodDark);
    // Apron
    rect(buf, w, h, 10, 14, 36, 2, PAL.woodDark);
    // Items on table (candle + plate)
    rect(buf, w, h, 26, 1, 4, 4, PAL.brassDark);
    rect(buf, w, h, 27, 0, 2, 1, PAL.yellow);
    set(28, 1, PAL.white);
    ellipse(buf, w, h, 18, 7, 4, 1, PAL.stoneHi);
    ellipse(buf, w, h, 38, 7, 4, 1, PAL.stoneHi);
    return { w, h, buffer: buf };
}

function barCounter() {
    // Wider tavern bar counter, replaces the dark rect
    const w = 100, h = 28;
    const buf = makeBuf(w, h);
    const set = setter(buf, w, h);
    // Counter top (richer wood, polished)
    rect(buf, w, h, 0, 0, w, 6, PAL.woodMid);
    rect(buf, w, h, 0, 0, w, 1, PAL.woodLite);
    rect(buf, w, h, 0, 5, w, 1, PAL.woodDark);
    // Front
    rect(buf, w, h, 0, 6, w, 22, PAL.woodBase);
    rect(buf, w, h, 0, 6, w, 1, PAL.woodHi);
    rect(buf, w, h, 0, 26, w, 2, PAL.woodDark);
    // Vertical plank seams
    for (let x = 8; x < w; x += 12) {
        rect(buf, w, h, x, 6, 1, 20, PAL.woodDark);
        set(x + 1, 7, PAL.woodHi);
    }
    // Trim band
    rect(buf, w, h, 0, 22, w, 1, PAL.woodDark);
    rect(buf, w, h, 0, 23, w, 1, PAL.woodHi);
    // Brass studs
    for (let x = 4; x < w; x += 12) {
        set(x, 9, PAL.brassHi); set(x + 1, 9, PAL.brassBase);
    }
    return { w, h, buffer: buf };
}

// -----------------------------------------------------------------------------
//  Interior / Keep props (reference-image style)
// -----------------------------------------------------------------------------

function wallTorch() {
    const w = 14, h = 32;
    const buf = makeBuf(w, h);
    const set = setter(buf, w, h);
    // Iron sconce bracket against wall
    rect(buf, w, h, 4, 18, 6, 8, PAL.ironDark);
    rect(buf, w, h, 4, 18, 6, 1, PAL.ironHi);
    rect(buf, w, h, 4, 18, 1, 8, PAL.ironHi);
    rect(buf, w, h, 9, 18, 1, 8, PAL.ironBase);
    // Handle pin
    rect(buf, w, h, 6, 26, 2, 2, PAL.ironBase);
    // Wooden torch shaft going up from sconce
    rect(buf, w, h, 6, 10, 2, 10, PAL.woodDark);
    rect(buf, w, h, 6, 10, 1, 10, PAL.woodBase);
    // Flame layers
    const flame = [
        { y: 7, w: 4, c: PAL.redDark },
        { y: 5, w: 4, c: PAL.orange },
        { y: 3, w: 3, c: PAL.brassHi },
        { y: 1, w: 2, c: PAL.yellow },
    ];
    flame.forEach(({ y, w: fw, c }) => rect(buf, w, h, 7 - Math.floor(fw / 2), y, fw, 3, c));
    set(7, 0, PAL.white);
    // Sparks/glow dots
    set(4, 4, PAL.yellow); set(10, 5, PAL.orange);
    return { w, h, buffer: buf };
}

function bookshelf() {
    const w = 36, h = 56;
    const buf = makeBuf(w, h);
    const set = setter(buf, w, h);
    // Outer wooden frame
    rect(buf, w, h, 0, 0, w, h, PAL.woodBase);
    rect(buf, w, h, 1, 1, w - 2, h - 2, PAL.woodMid);
    // Top/bottom thick boards
    rect(buf, w, h, 0, 0, w, 3, PAL.woodDark);
    rect(buf, w, h, 0, 0, w, 1, PAL.woodHi);
    rect(buf, w, h, 0, h - 3, w, 3, PAL.woodDark);
    // Side rails
    rect(buf, w, h, 0, 0, 2, h, PAL.woodHi);
    rect(buf, w, h, w - 2, 0, 2, h, PAL.woodDark);
    // Shelves (3 rows)
    const shelfRows = [16, 30, 44];
    shelfRows.forEach(y => {
        rect(buf, w, h, 2, y, w - 4, 2, PAL.woodDark);
        rect(buf, w, h, 2, y, w - 4, 1, PAL.woodHi);
    });
    // Books on each shelf row above the shelf line
    const bookColors = [
        [PAL.redBase, PAL.redHi],
        [PAL.blueBase, PAL.blueHi],
        [PAL.leafBase, PAL.leafMid],
        [PAL.purpleBase, PAL.purpleHi],
        [PAL.brassBase, PAL.brassHi],
        [PAL.woodHi, PAL.woodLite],
    ];
    const drawBookRow = (rowTop, rowH) => {
        let x = 3;
        let i = 0;
        while (x < w - 4) {
            const bw = 3 + (noise(x, rowTop) % 3);
            const [c, hi] = bookColors[i % bookColors.length];
            const bh = rowH - 1 - (noise(x, rowTop, 1) % 2);
            const top = rowTop + (rowH - bh);
            rect(buf, w, h, x, top, bw, bh, c);
            rect(buf, w, h, x, top, 1, bh, hi);
            // Title band
            set(x + Math.floor(bw / 2), top + 2, PAL.brassHi);
            x += bw;
            i++;
        }
    };
    drawBookRow(4, 12);
    drawBookRow(18, 12);
    drawBookRow(32, 12);
    // Bottom row — scroll/jar/decoration
    rect(buf, w, h, 6, 46, 6, 6, PAL.brassBase);
    rect(buf, w, h, 6, 46, 6, 1, PAL.brassHi);
    set(8, 49, PAL.white);
    rect(buf, w, h, 16, 47, 4, 5, PAL.leafDark);
    set(17, 46, PAL.leafMid); set(18, 46, PAL.leafMid);
    rect(buf, w, h, 24, 46, 6, 6, PAL.redDark);
    rect(buf, w, h, 24, 46, 6, 1, PAL.redHi);
    return { w, h, buffer: buf };
}

function bed() {
    const w = 40, h = 30;
    const buf = makeBuf(w, h);
    const set = setter(buf, w, h);
    // Wooden frame
    rect(buf, w, h, 0, 6, w, 22, PAL.woodBase);
    rect(buf, w, h, 0, 26, w, 4, PAL.woodDark);
    rect(buf, w, h, 0, 6, w, 1, PAL.woodHi);
    // Headboard (left)
    rect(buf, w, h, 0, 0, 6, 30, PAL.woodMid);
    rect(buf, w, h, 0, 0, 1, 30, PAL.woodHi);
    rect(buf, w, h, 5, 0, 1, 30, PAL.woodDark);
    rect(buf, w, h, 1, 1, 4, 5, PAL.woodDark);
    rect(buf, w, h, 1, 1, 4, 1, PAL.woodHi);
    // Mattress (blue covers, reference-style)
    rect(buf, w, h, 6, 8, w - 6, 18, PAL.blueBase);
    rect(buf, w, h, 6, 8, w - 6, 1, PAL.blueHi);
    rect(buf, w, h, 6, 25, w - 6, 1, PAL.blueDark);
    // Cover trim
    rect(buf, w, h, 6, 14, w - 6, 1, PAL.blueDark);
    rect(buf, w, h, 6, 15, w - 6, 1, PAL.blueHi);
    // Pillow
    rect(buf, w, h, 8, 10, 10, 6, PAL.white);
    rect(buf, w, h, 8, 10, 10, 1, PAL.stoneHi);
    rect(buf, w, h, 8, 15, 10, 1, PAL.stoneMid);
    // Fold details
    set(20, 10, PAL.blueHi); set(28, 12, PAL.blueHi);
    set(24, 18, PAL.blueDark); set(32, 20, PAL.blueDark);
    // Legs
    rect(buf, w, h, 7, 28, 3, 2, PAL.woodDark);
    rect(buf, w, h, w - 6, 28, 3, 2, PAL.woodDark);
    return { w, h, buffer: buf };
}

function diningChair() {
    const w = 14, h = 24;
    const buf = makeBuf(w, h);
    const set = setter(buf, w, h);
    // Back rest (tall, with decorative top)
    rect(buf, w, h, 3, 0, 8, 12, PAL.woodBase);
    rect(buf, w, h, 3, 0, 8, 1, PAL.woodHi);
    rect(buf, w, h, 3, 0, 1, 12, PAL.woodHi);
    rect(buf, w, h, 10, 0, 1, 12, PAL.woodDark);
    // Cutout in backrest
    rect(buf, w, h, 5, 4, 4, 4, PAL.outline);
    // Seat
    rect(buf, w, h, 2, 12, 10, 4, PAL.woodMid);
    rect(buf, w, h, 2, 12, 10, 1, PAL.woodLite);
    rect(buf, w, h, 2, 15, 10, 1, PAL.woodDark);
    // Legs
    rect(buf, w, h, 3, 16, 2, 8, PAL.woodBase);
    rect(buf, w, h, w - 5, 16, 2, 8, PAL.woodBase);
    // Foot shadow
    rect(buf, w, h, 2, 23, 10, 1, PAL.shadow);
    return { w, h, buffer: buf };
}

function diningTable() {
    // Square-ish dining table with candelabra (3 candles) on top
    const w = 36, h = 32;
    const buf = makeBuf(w, h);
    const set = setter(buf, w, h);
    // Tabletop
    rect(buf, w, h, 2, 10, 32, 8, PAL.woodMid);
    rect(buf, w, h, 2, 10, 32, 1, PAL.woodLite);
    rect(buf, w, h, 2, 17, 32, 1, PAL.woodDark);
    // Apron
    rect(buf, w, h, 2, 18, 32, 2, PAL.woodDark);
    // Legs
    rect(buf, w, h, 4, 20, 3, 12, PAL.woodBase);
    rect(buf, w, h, 4, 20, 1, 12, PAL.woodHi);
    rect(buf, w, h, w - 7, 20, 3, 12, PAL.woodBase);
    rect(buf, w, h, w - 5, 20, 1, 12, PAL.woodDark);
    // Cross brace
    rect(buf, w, h, 7, 27, 22, 1, PAL.woodDark);
    // Candelabra base
    rect(buf, w, h, 14, 7, 8, 3, PAL.brassDark);
    rect(buf, w, h, 14, 7, 8, 1, PAL.brassBase);
    rect(buf, w, h, 16, 6, 4, 1, PAL.brassHi);
    // 3 candles
    const candles = [
        { x: 12, h: 5 },
        { x: 18, h: 6 },
        { x: 24, h: 5 },
    ];
    candles.forEach(({ x, h: ch }) => {
        rect(buf, w, h, x, 7 - ch, 2, ch, PAL.white);
        set(x, 7 - ch, PAL.stoneHi);
        // Flame
        set(x, 7 - ch - 2, PAL.orange);
        set(x, 7 - ch - 1, PAL.yellow);
        set(x + 1, 7 - ch - 1, PAL.brassHi);
        set(x, 7 - ch - 3, PAL.yellow);
    });
    return { w, h, buffer: buf };
}

function redCarpet() {
    // Tileable red carpet with gold trim — sized to mark a ceremonial zone
    const w = 96, h = 56;
    const buf = makeBuf(w, h);
    const set = setter(buf, w, h);
    // Outer trim (gold border)
    rect(buf, w, h, 0, 0, w, 3, PAL.brassDark);
    rect(buf, w, h, 0, h - 3, w, 3, PAL.brassDark);
    rect(buf, w, h, 0, 0, 3, h, PAL.brassDark);
    rect(buf, w, h, w - 3, 0, 3, h, PAL.brassDark);
    rect(buf, w, h, 1, 1, w - 2, 1, PAL.brassHi);
    rect(buf, w, h, 1, h - 2, w - 2, 1, PAL.brassHi);
    rect(buf, w, h, 1, 1, 1, h - 2, PAL.brassHi);
    rect(buf, w, h, w - 2, 1, 1, h - 2, PAL.brassHi);
    // Carpet body (dark red with pattern)
    rect(buf, w, h, 3, 3, w - 6, h - 6, PAL.redDark);
    // Lighter middle field
    rect(buf, w, h, 6, 6, w - 12, h - 12, PAL.redBase);
    // Inner ornamental border
    rect(buf, w, h, 8, 8, w - 16, 1, PAL.brassBase);
    rect(buf, w, h, 8, h - 9, w - 16, 1, PAL.brassBase);
    rect(buf, w, h, 8, 8, 1, h - 16, PAL.brassBase);
    rect(buf, w, h, w - 9, 8, 1, h - 16, PAL.brassBase);
    // Diamond medallion in center
    const cx = w / 2, cy = h / 2;
    for (let dy = -6; dy <= 6; dy++) {
        const span = 6 - Math.abs(dy);
        for (let dx = -span; dx <= span; dx++) {
            set(cx + dx, cy + dy, PAL.redHi);
        }
    }
    for (let dy = -4; dy <= 4; dy++) {
        const span = 4 - Math.abs(dy);
        for (let dx = -span; dx <= span; dx++) {
            set(cx + dx, cy + dy, PAL.brassDark);
        }
    }
    set(cx, cy, PAL.brassHi);
    set(cx - 1, cy, PAL.brassBase); set(cx + 1, cy, PAL.brassBase);
    set(cx, cy - 1, PAL.brassBase); set(cx, cy + 1, PAL.brassBase);
    return { w, h, buffer: buf };
}

function armorStand() {
    // Decorative armor stand (statue-like) — used to flank doors
    const w = 22, h = 36;
    const buf = makeBuf(w, h);
    const set = setter(buf, w, h);
    // Pedestal
    rect(buf, w, h, 4, 32, 14, 4, PAL.stoneDark);
    rect(buf, w, h, 4, 32, 14, 1, PAL.stoneBase);
    rect(buf, w, h, 5, 31, 12, 1, PAL.stoneMid);
    // Stand pole
    rect(buf, w, h, 10, 18, 2, 14, PAL.ironDark);
    // Cuirass body
    rect(buf, w, h, 4, 12, 14, 12, PAL.ironBase);
    rect(buf, w, h, 4, 12, 14, 1, PAL.ironHi);
    rect(buf, w, h, 4, 12, 1, 12, PAL.ironHi);
    rect(buf, w, h, 17, 12, 1, 12, PAL.ironDark);
    rect(buf, w, h, 4, 23, 14, 1, PAL.ironDark);
    // Pauldrons
    rect(buf, w, h, 2, 13, 3, 5, PAL.ironBase);
    rect(buf, w, h, 17, 13, 3, 5, PAL.ironBase);
    rect(buf, w, h, 2, 13, 3, 1, PAL.ironHi);
    rect(buf, w, h, 17, 13, 3, 1, PAL.ironHi);
    // Chest emblem
    rect(buf, w, h, 9, 16, 4, 4, PAL.brassBase);
    rect(buf, w, h, 9, 16, 4, 1, PAL.brassHi);
    set(11, 18, PAL.redHi);
    // Helmet
    rect(buf, w, h, 6, 2, 10, 8, PAL.ironBase);
    rect(buf, w, h, 6, 2, 10, 1, PAL.ironHi);
    rect(buf, w, h, 6, 9, 10, 1, PAL.ironDark);
    // Visor slit
    rect(buf, w, h, 8, 5, 6, 1, PAL.outline);
    // Plume
    rect(buf, w, h, 9, 0, 4, 3, PAL.redHi);
    set(10, -1 < 0 ? 0 : -1, PAL.redDark);
    return { w, h, buffer: buf };
}

function pixelSkull() {
    const w = 16, h = 16;
    const buf = makeBuf(w, h);
    const set = setter(buf, w, h);
    // Cranium
    rect(buf, w, h, 4, 2, 8, 1, PAL.stoneShade);
    rect(buf, w, h, 3, 3, 10, 1, PAL.stoneBase);
    rect(buf, w, h, 2, 4, 12, 6, PAL.stoneHi);
    rect(buf, w, h, 2, 4, 1, 6, PAL.stoneShade);
    rect(buf, w, h, 13, 4, 1, 6, PAL.stoneShade);
    rect(buf, w, h, 3, 10, 10, 1, PAL.stoneBase);
    // Eye sockets
    rect(buf, w, h, 4, 5, 3, 3, PAL.outline);
    rect(buf, w, h, 9, 5, 3, 3, PAL.outline);
    set(5, 6, '#c81616'); set(10, 6, '#c81616'); // red glow in eyes
    // Nose
    rect(buf, w, h, 7, 8, 2, 2, PAL.outline);
    // Teeth row
    rect(buf, w, h, 4, 11, 8, 3, PAL.stoneBase);
    set(5, 12, PAL.outline); set(7, 12, PAL.outline); set(9, 12, PAL.outline); set(11, 12, PAL.outline);
    rect(buf, w, h, 4, 14, 8, 1, PAL.stoneShade);
    return { w, h, buffer: buf };
}

function stoneFloorPatch() {
    // Small standalone floor highlight tile — useful for layering
    const w = 64, h = 32;
    const buf = makeBuf(w, h);
    // Lighter stone variation for accents
    for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
            const n = noise(x, y, 4) % 9;
            const c = n < 5 ? PAL.stoneBase : (n < 8 ? PAL.stoneMid : PAL.stoneHi);
            buf[y * w + x] = c;
        }
    }
    return { w, h, buffer: buf };
}

// -----------------------------------------------------------------------------
//  Registry
// -----------------------------------------------------------------------------

export const WORLD_PROPS = {
    // Wave 1 — nature
    oak_tree: oakTree(),
    pine_tree: pineTree(),
    bush: bush(),
    flowers: flowersCluster(),
    mushroom: mushroom(),
    grass_tuft: grassTuft(),
    // Wave 2 — town structures
    well: stoneWell(),
    lamp: ironLamp(),
    bench: woodenBench(),
    barrel: woodenBarrel(),
    crate: woodenCrate(),
    sign: woodenSign(),
    fence: woodFence(),
    planter: planter(),
    hay: hayBale(),
    weapon_rack: weaponRack(),
    shop_building: shopBuilding(),
    market_stall_red: marketStall(PAL.redBase),
    market_stall_green: marketStall(PAL.leafBase),
    market_stall_purple: marketStall(PAL.purpleBase),
    banner_purple: clothBanner(PAL.purpleBase),
    banner_red: clothBanner(PAL.redBase),
    banner_gold: clothBanner(PAL.brassBase),
    banner_blue: clothBanner(PAL.blueBase),
    // Wave 3 — tavern interior
    mug: tavernMug(),
    stool: tavernStool(),
    fire: fireplace(),
    table: woodenTable(),
    bar_counter: barCounter(),
    // Wave 4 — keep / interior
    wall_torch: wallTorch(),
    bookshelf: bookshelf(),
    bed: bed(),
    dining_chair: diningChair(),
    dining_table: diningTable(),
    red_carpet: redCarpet(),
    armor_stand: armorStand(),
    floor_patch: stoneFloorPatch(),
    skull: pixelSkull(),
};

// -----------------------------------------------------------------------------
//  WorldSprite — renders a registry prop as inline SVG (crisp at any scale)
// -----------------------------------------------------------------------------

// Prop buffers are immutable, so the merged-run <rect> list never changes for a
// given buffer. Cache by buffer reference so we build it once instead of on
// every render (the world re-renders often during movement / transitions).
const _propRectCache = new WeakMap();
function bufferToRects(buffer, w, h) {
    const cached = _propRectCache.get(buffer);
    if (cached) return cached;
    const rects = [];
    for (let y = 0; y < h; y++) {
        let runColor = null;
        let runStart = 0;
        for (let x = 0; x <= w; x++) {
            const color = x < w ? buffer[y * w + x] : null;
            if (color !== runColor) {
                if (runColor && runColor !== 'transparent') {
                    rects.push(<rect key={`${y}-${runStart}`} x={runStart} y={y} width={x - runStart} height={1} fill={runColor} />);
                }
                runColor = color;
                runStart = x;
            }
        }
    }
    _propRectCache.set(buffer, rects);
    return rects;
}

/**
 * Renders a WORLD_PROPS entry. Anchored bottom-center at (x, y) so trees/posts
 * "stand on" their ground coordinate. Z-sorted by y like the rest of the world.
 */
export const WorldSprite = React.memo(function WorldSprite({ name, x, y, scale = 1, sway = false, opacity = 1, shadow = true }) {
    const prop = WORLD_PROPS[name];
    if (!prop) return null;
    const { w, h, buffer } = prop;
    const drawW = w * scale;
    const drawH = h * scale;
    const left = x - drawW / 2;
    const top = y - drawH;

    return (
        <div
            className={`absolute pointer-events-none ${sway ? 'animate-sway' : ''}`}
            style={{ left, top, width: drawW, height: drawH, zIndex: Math.floor(y), opacity }}
        >
            {shadow && (
                <div
                    style={{
                        position: 'absolute',
                        left: drawW * 0.15,
                        bottom: -drawH * 0.04,
                        width: drawW * 0.7,
                        height: drawH * 0.08,
                        background: 'radial-gradient(ellipse at center, rgba(0,0,0,0.45) 0%, rgba(0,0,0,0) 70%)',
                        pointerEvents: 'none',
                    }}
                />
            )}
            <svg
                width={drawW}
                height={drawH}
                viewBox={`0 0 ${w} ${h}`}
                shapeRendering="crispEdges"
                style={{ imageRendering: 'pixelated', display: 'block' }}
            >
                {bufferToRects(buffer, w, h)}
            </svg>
        </div>
    );
});
