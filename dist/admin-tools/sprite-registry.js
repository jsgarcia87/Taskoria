// =============================================================================
//  SPRITE REGISTRY — Single source of truth for all procedural pixel sprites
// =============================================================================
//  Pure vanilla JS (no React / no DOM). Used by:
//    - worldProps.jsx  → game renderer (WorldSprite component)
//    - map_editor.html → admin tool (renders to canvas thumbnails)
//
//  Each generator returns { w, h, buffer } where buffer is a flat array of
//  hex color strings ('transparent' for empty), length === w * h.
// =============================================================================

// -----------------------------------------------------------------------------
//  Stardew-flavored palette (warm earth, saturated foliage)
// -----------------------------------------------------------------------------

export const PAL = {
    woodDark:  '#3a2412',
    woodBase:  '#5a3a1a',
    woodMid:   '#7a5a2a',
    woodHi:    '#9a7a3a',
    woodLite:  '#b89858',
    leafShade: '#2d4a16',
    leafDark:  '#3f6a20',
    leafBase:  '#5a8a2a',
    leafMid:   '#7aaa40',
    leafHi:    '#a8d05a',
    leafSpot:  '#c8e870',
    stoneShade:'#3a3a42',
    stoneDark: '#5a5a62',
    stoneBase: '#7a7a82',
    stoneMid:  '#9a9aa2',
    stoneHi:   '#babac2',
    ironDark:  '#22252a',
    ironBase:  '#3a3f48',
    ironHi:    '#5a6068',
    brassDark: '#7a5a18',
    brassBase: '#b48a28',
    brassHi:   '#e8c048',
    redDark:   '#6a1818',
    redBase:   '#9a2a2a',
    redHi:     '#c84040',
    blueDark:  '#1a3a6a',
    blueBase:  '#2a5a9a',
    blueHi:    '#4a8ac8',
    purpleDark:'#3a1a5a',
    purpleBase:'#6a2a9a',
    purpleHi:  '#9a5ad0',
    pink:      '#e87aa8',
    yellow:    '#f4c842',
    orange:    '#e88a28',
    white:     '#f4ecd8',
    outline:   '#1a0e08',
    shadow:    'rgba(0,0,0,0.35)',
};

// -----------------------------------------------------------------------------
//  Buffer helpers
// -----------------------------------------------------------------------------

export function makeBuf(w, h, fill = 'transparent') {
    return new Array(w * h).fill(fill);
}

export function setter(buf, w, h) {
    return (x, y, c) => {
        if (x < 0 || x >= w || y < 0 || y >= h) return;
        buf[y * w + x] = c;
    };
}

export function rect(buf, w, h, x, y, rw, rh, color) {
    const set = setter(buf, w, h);
    for (let dy = 0; dy < rh; dy++) for (let dx = 0; dx < rw; dx++) set(x + dx, y + dy, color);
}

export function disc(buf, w, h, cx, cy, r, color) {
    const set = setter(buf, w, h);
    const r2 = r * r;
    for (let dy = -r; dy <= r; dy++) {
        for (let dx = -r; dx <= r; dx++) {
            if (dx * dx + dy * dy <= r2) set(cx + dx, cy + dy, color);
        }
    }
}

export function ellipse(buf, w, h, cx, cy, rx, ry, color) {
    const set = setter(buf, w, h);
    for (let dy = -ry; dy <= ry; dy++) {
        for (let dx = -rx; dx <= rx; dx++) {
            if ((dx * dx) / (rx * rx) + (dy * dy) / (ry * ry) <= 1) set(cx + dx, cy + dy, color);
        }
    }
}

export const noise = (x, y, salt = 0) => ((x * 73856093) ^ (y * 19349663) ^ (salt * 83492791)) >>> 0;

// -----------------------------------------------------------------------------
//  Nature props
// -----------------------------------------------------------------------------

function oakTree() {
    // Stardew-style oak: trunk runs INTO the canopy (no gap), canopy is an
    // irregular clumped mass with a scalloped dark underside, light from
    // the upper-left.
    const w = 48, h = 64;
    const buf = makeBuf(w, h);
    const set = setter(buf, w, h);
    // --- Trunk: wide with root flare, reaching up to y=30 (under canopy) ---
    for (let y = 30; y < 64; y++) {
        const flare = y > 58 ? (y - 58) : 0;
        const half = 4 + Math.floor(flare * 0.8);
        rect(buf, w, h, 24 - half, y, half * 2, 1, PAL.woodMid);
        set(24 - half, y, PAL.woodDark);
        set(23 + half, y, PAL.woodDark);
        set(23 - half + 2, y, PAL.woodHi);
    }
    // Bark grain
    set(23, 40, PAL.woodDark); set(25, 46, PAL.woodDark); set(22, 52, PAL.woodDark);
    set(24, 44, PAL.woodDark); set(26, 56, PAL.woodDark);
    set(25, 38, PAL.woodHi); set(23, 50, PAL.woodHi);
    // A visible side branch entering the canopy
    rect(buf, w, h, 28, 30, 6, 2, PAL.woodBase);
    set(34, 29, PAL.woodBase); set(35, 28, PAL.woodDark);
    // --- Canopy: clumped mass, y 2..40, swallowing the trunk top ---
    // Dark silhouette base (irregular, made of overlapping discs)
    disc(buf, w, h, 24, 20, 17, PAL.leafShade);
    disc(buf, w, h, 13, 24, 9, PAL.leafShade);
    disc(buf, w, h, 36, 24, 9, PAL.leafShade);
    disc(buf, w, h, 18, 32, 8, PAL.leafShade);
    disc(buf, w, h, 31, 32, 8, PAL.leafShade);
    // Scalloped underside: eat notches out of the bottom edge
    for (let x = 8; x < 41; x += 5) {
        const dip = 38 + ((noise(x, 3, 2) % 3));
        for (let y = dip; y < 42; y++) {
            if (Math.abs(x - 24) > 3) { // keep leaves over the trunk joint
                if (buf[y * w + x] === PAL.leafShade) buf[y * w + x] = 'transparent';
                if (buf[y * w + x + 1] === PAL.leafShade) buf[y * w + (x + 1)] = 'transparent';
            }
        }
    }
    // Body volume
    disc(buf, w, h, 23, 19, 14, PAL.leafDark);
    disc(buf, w, h, 15, 25, 7, PAL.leafDark);
    disc(buf, w, h, 33, 26, 7, PAL.leafDark);
    disc(buf, w, h, 21, 17, 11, PAL.leafBase);
    disc(buf, w, h, 31, 21, 7, PAL.leafBase);
    disc(buf, w, h, 14, 22, 5, PAL.leafBase);
    // Light side (upper-left)
    disc(buf, w, h, 17, 13, 7, PAL.leafMid);
    disc(buf, w, h, 27, 10, 5, PAL.leafMid);
    disc(buf, w, h, 12, 18, 4, PAL.leafMid);
    disc(buf, w, h, 16, 10, 3, PAL.leafHi);
    disc(buf, w, h, 24, 7, 2, PAL.leafHi);
    // Leaf sparkle
    set(13, 12, PAL.leafSpot); set(20, 6, PAL.leafSpot);
    set(30, 9, PAL.leafSpot); set(10, 20, PAL.leafSpot); set(36, 18, PAL.leafSpot);
    // Clump texture: dithered dark specks in the midtones
    for (let i = 0; i < 40; i++) {
        const n = noise(i, 7);
        const x = 8 + (n % 32);
        const y = 6 + ((n >> 5) % 30);
        if (buf[y * w + x] === PAL.leafBase) buf[y * w + x] = PAL.leafDark;
    }
    // Shadow arc where canopy meets trunk (grounds the join)
    rect(buf, w, h, 18, 33, 13, 2, PAL.leafShade);
    return { w, h, buffer: buf };
}

function pineTree() {
    const w = 40, h = 72;
    const buf = makeBuf(w, h);
    const set = setter(buf, w, h);
    rect(buf, w, h, 18, 56, 4, 16, PAL.woodBase);
    rect(buf, w, h, 19, 56, 2, 16, PAL.woodMid);
    rect(buf, w, h, 18, 56, 1, 16, PAL.woodDark);
    rect(buf, w, h, 21, 56, 1, 16, PAL.woodDark);
    set(17, 70, PAL.woodBase); set(22, 70, PAL.woodBase);
    set(16, 71, PAL.woodDark); set(23, 71, PAL.woodDark);
    const drawTier = (cy, halfW, hgt) => {
        for (let dy = 0; dy < hgt; dy++) {
            const ww = Math.round(halfW * (dy / (hgt - 1)));
            for (let dx = -ww; dx <= ww; dx++) {
                set(20 + dx, cy + dy, PAL.leafDark);
            }
        }
    };
    drawTier(40, 18, 18);
    drawTier(24, 14, 16);
    drawTier(8, 10, 16);
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
    set(20, 8, PAL.leafHi); set(19, 9, PAL.leafHi); set(21, 9, PAL.leafHi);
    set(20, 24, PAL.leafMid); set(20, 40, PAL.leafMid);
    return { w, h, buffer: buf };
}

function bush() {
    const w = 32, h = 22;
    const buf = makeBuf(w, h);
    const set = setter(buf, w, h);
    ellipse(buf, w, h, 10, 16, 8, 5, PAL.leafShade);
    ellipse(buf, w, h, 22, 16, 8, 5, PAL.leafShade);
    ellipse(buf, w, h, 16, 12, 11, 7, PAL.leafShade);
    ellipse(buf, w, h, 10, 15, 7, 4, PAL.leafDark);
    ellipse(buf, w, h, 22, 15, 7, 4, PAL.leafDark);
    ellipse(buf, w, h, 16, 11, 10, 6, PAL.leafBase);
    ellipse(buf, w, h, 12, 8, 5, 3, PAL.leafMid);
    ellipse(buf, w, h, 10, 7, 2, 1, PAL.leafHi);
    set(14, 6, PAL.leafSpot); set(8, 9, PAL.leafSpot);
    set(20, 9, PAL.redHi); set(20, 10, PAL.redDark);
    set(24, 13, PAL.redHi); set(24, 14, PAL.redDark);
    return { w, h, buffer: buf };
}

function flowersCluster() {
    const w = 28, h = 18;
    const buf = makeBuf(w, h);
    const set = setter(buf, w, h);
    for (let i = 0; i < w; i++) {
        const tall = 2 + (noise(i, 3) % 3);
        for (let j = 0; j < tall; j++) set(i, h - 1 - j, PAL.leafBase);
        set(i, h - 1, PAL.leafDark);
    }
    const blooms = [
        { x: 5,  c: PAL.yellow, cd: PAL.orange },
        { x: 11, c: PAL.pink,   cd: PAL.redBase },
        { x: 17, c: PAL.white,  cd: PAL.stoneMid },
        { x: 23, c: PAL.purpleHi, cd: PAL.purpleBase },
    ];
    blooms.forEach(({ x, c, cd }) => {
        const stemTop = 6 + (noise(x, 5) % 3);
        for (let y = stemTop; y < h - 2; y++) set(x, y, PAL.leafDark);
        set(x, stemTop - 1, c); set(x - 1, stemTop, c); set(x + 1, stemTop, c);
        set(x, stemTop, cd);
        set(x, stemTop + 1, c);
        set(x - 1, stemTop - 1, c);
    });
    return { w, h, buffer: buf };
}

function mushroom() {
    const w = 16, h = 14;
    const buf = makeBuf(w, h);
    const set = setter(buf, w, h);
    rect(buf, w, h, 6, 9, 4, 4, PAL.white);
    rect(buf, w, h, 6, 9, 1, 4, PAL.stoneMid);
    ellipse(buf, w, h, 8, 6, 6, 4, PAL.redDark);
    ellipse(buf, w, h, 8, 5, 6, 3, PAL.redBase);
    ellipse(buf, w, h, 7, 4, 4, 2, PAL.redHi);
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
    ellipse(buf, w, h, 16, 30, 14, 4, PAL.stoneShade);
    ellipse(buf, w, h, 16, 30, 14, 3, PAL.stoneDark);
    rect(buf, w, h, 2, 22, 28, 9, PAL.stoneDark);
    for (let bx = 2; bx < 30; bx += 7) {
        rect(buf, w, h, bx, 22, 6, 4, PAL.stoneBase);
        rect(buf, w, h, bx, 22, 6, 1, PAL.stoneMid);
        rect(buf, w, h, bx, 25, 6, 1, PAL.stoneShade);
    }
    for (let bx = 5; bx < 30; bx += 7) {
        rect(buf, w, h, bx, 26, 6, 4, PAL.stoneBase);
        rect(buf, w, h, bx, 26, 6, 1, PAL.stoneMid);
    }
    ellipse(buf, w, h, 16, 22, 12, 3, PAL.blueDark);
    ellipse(buf, w, h, 16, 21, 11, 2, PAL.blueBase);
    set(12, 21, PAL.blueHi); set(20, 22, PAL.blueHi);
    ellipse(buf, w, h, 16, 20, 13, 2, PAL.stoneHi);
    ellipse(buf, w, h, 16, 20, 13, 1, PAL.stoneMid);
    rect(buf, w, h, 4, 6, 3, 16, PAL.woodBase);
    rect(buf, w, h, 4, 6, 1, 16, PAL.woodHi);
    rect(buf, w, h, 6, 6, 1, 16, PAL.woodDark);
    rect(buf, w, h, 25, 6, 3, 16, PAL.woodBase);
    rect(buf, w, h, 25, 6, 1, 16, PAL.woodHi);
    rect(buf, w, h, 27, 6, 1, 16, PAL.woodDark);
    rect(buf, w, h, 3, 4, 26, 3, PAL.woodBase);
    rect(buf, w, h, 3, 4, 26, 1, PAL.woodHi);
    for (let r = 0; r < 5; r++) {
        rect(buf, w, h, 2 + r, 3 - r, 28 - r * 2, 1, PAL.redBase);
    }
    rect(buf, w, h, 7, 4, 18, 1, PAL.redDark);
    set(15, 0, PAL.redHi); set(16, 0, PAL.redHi);
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
    rect(buf, w, h, 4, 30, 4, 2, PAL.ironDark);
    rect(buf, w, h, 3, 28, 6, 2, PAL.ironBase);
    rect(buf, w, h, 3, 28, 6, 1, PAL.ironHi);
    rect(buf, w, h, 5, 8, 2, 22, PAL.ironBase);
    rect(buf, w, h, 5, 8, 1, 22, PAL.ironHi);
    set(4, 7, PAL.ironBase); set(7, 7, PAL.ironBase);
    set(3, 6, PAL.ironBase); set(8, 6, PAL.ironBase);
    rect(buf, w, h, 3, 2, 6, 5, PAL.ironDark);
    rect(buf, w, h, 4, 1, 4, 1, PAL.ironDark);
    rect(buf, w, h, 4, 6, 4, 1, PAL.ironDark);
    rect(buf, w, h, 4, 3, 4, 3, PAL.brassHi);
    set(5, 3, PAL.white); set(6, 4, PAL.white);
    set(4, 4, PAL.ironDark); set(7, 4, PAL.ironDark);
    set(5, 0, PAL.ironBase); set(6, 0, PAL.ironBase);
    return { w, h, buffer: buf };
}

function woodenBench() {
    const w = 36, h = 18;
    const buf = makeBuf(w, h);
    const set = setter(buf, w, h);
    rect(buf, w, h, 2, 6, 32, 3, PAL.woodMid);
    rect(buf, w, h, 2, 6, 32, 1, PAL.woodLite);
    rect(buf, w, h, 2, 8, 32, 1, PAL.woodDark);
    rect(buf, w, h, 2, 9, 32, 1, PAL.woodBase);
    for (let x = 4; x < 32; x += 5) set(x, 7, PAL.woodDark);
    rect(buf, w, h, 4, 9, 3, 8, PAL.woodBase);
    rect(buf, w, h, 4, 9, 1, 8, PAL.woodHi);
    rect(buf, w, h, 6, 9, 1, 8, PAL.woodDark);
    rect(buf, w, h, 29, 9, 3, 8, PAL.woodBase);
    rect(buf, w, h, 29, 9, 1, 8, PAL.woodHi);
    rect(buf, w, h, 31, 9, 1, 8, PAL.woodDark);
    rect(buf, w, h, 5, 14, 26, 1, PAL.woodDark);
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
    ellipse(buf, w, h, 10, 22, 9, 2, PAL.woodDark);
    rect(buf, w, h, 1, 4, 18, 18, PAL.woodMid);
    rect(buf, w, h, 1, 4, 2, 18, PAL.woodDark);
    rect(buf, w, h, 17, 4, 2, 18, PAL.woodDark);
    rect(buf, w, h, 3, 4, 2, 18, PAL.woodBase);
    rect(buf, w, h, 15, 4, 2, 18, PAL.woodBase);
    rect(buf, w, h, 1, 3, 18, 2, PAL.woodHi);
    rect(buf, w, h, 1, 3, 18, 1, PAL.woodLite);
    ellipse(buf, w, h, 10, 4, 8, 2, PAL.woodDark);
    ellipse(buf, w, h, 10, 4, 7, 1, PAL.woodBase);
    rect(buf, w, h, 1, 8, 18, 2, PAL.ironDark);
    rect(buf, w, h, 1, 8, 18, 1, PAL.ironHi);
    rect(buf, w, h, 1, 16, 18, 2, PAL.ironDark);
    rect(buf, w, h, 1, 16, 18, 1, PAL.ironHi);
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
    rect(buf, w, h, 1, 1, 18, 1, PAL.woodHi);
    rect(buf, w, h, 1, 18, 18, 1, PAL.woodDark);
    rect(buf, w, h, 1, 1, 1, 18, PAL.woodHi);
    rect(buf, w, h, 18, 1, 1, 18, PAL.woodDark);
    rect(buf, w, h, 3, 3, 14, 1, PAL.woodDark);
    rect(buf, w, h, 3, 16, 14, 1, PAL.woodDark);
    rect(buf, w, h, 3, 3, 1, 14, PAL.woodDark);
    rect(buf, w, h, 16, 3, 1, 14, PAL.woodDark);
    for (let i = 0; i < 13; i++) {
        set(4 + i, 4 + i, PAL.woodDark);
        set(16 - i, 4 + i, PAL.woodDark);
    }
    set(4, 4, PAL.ironHi); set(15, 4, PAL.ironHi);
    set(4, 15, PAL.ironHi); set(15, 15, PAL.ironHi);
    return { w, h, buffer: buf };
}

function woodenSign() {
    const w = 28, h = 36;
    const buf = makeBuf(w, h);
    const set = setter(buf, w, h);
    rect(buf, w, h, 12, 18, 4, 18, PAL.woodBase);
    rect(buf, w, h, 12, 18, 1, 18, PAL.woodHi);
    rect(buf, w, h, 15, 18, 1, 18, PAL.woodDark);
    rect(buf, w, h, 4, 4, 20, 2, PAL.woodBase);
    rect(buf, w, h, 4, 4, 20, 1, PAL.woodHi);
    set(7, 6, PAL.ironDark); set(7, 7, PAL.ironDark); set(7, 8, PAL.ironDark);
    set(20, 6, PAL.ironDark); set(20, 7, PAL.ironDark); set(20, 8, PAL.ironDark);
    rect(buf, w, h, 4, 9, 20, 10, PAL.woodMid);
    rect(buf, w, h, 4, 9, 20, 1, PAL.woodLite);
    rect(buf, w, h, 4, 18, 20, 1, PAL.woodDark);
    rect(buf, w, h, 4, 9, 1, 10, PAL.woodHi);
    rect(buf, w, h, 23, 9, 1, 10, PAL.woodDark);
    for (let x = 6; x < 23; x += 4) {
        rect(buf, w, h, x, 12, 1, 4, PAL.woodDark);
    }
    return { w, h, buffer: buf };
}

function woodFence() {
    const w = 32, h = 18;
    const buf = makeBuf(w, h);
    rect(buf, w, h, 0, 4, 32, 2, PAL.woodBase);
    rect(buf, w, h, 0, 4, 32, 1, PAL.woodHi);
    rect(buf, w, h, 0, 12, 32, 2, PAL.woodBase);
    rect(buf, w, h, 0, 12, 32, 1, PAL.woodHi);
    for (let x = 2; x < 32; x += 10) {
        rect(buf, w, h, x, 0, 3, 18, PAL.woodMid);
        rect(buf, w, h, x, 0, 1, 18, PAL.woodHi);
        rect(buf, w, h, x + 2, 0, 1, 18, PAL.woodDark);
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
    rect(buf, w, h, 1, 6, 30, 11, PAL.woodMid);
    rect(buf, w, h, 1, 6, 30, 1, PAL.woodLite);
    rect(buf, w, h, 1, 16, 30, 1, PAL.woodDark);
    rect(buf, w, h, 1, 6, 1, 11, PAL.woodHi);
    rect(buf, w, h, 30, 6, 1, 11, PAL.woodDark);
    for (let x = 6; x < 30; x += 6) rect(buf, w, h, x, 8, 1, 8, PAL.woodDark);
    rect(buf, w, h, 2, 5, 28, 2, PAL.woodDark);
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
    ellipse(buf, w, h, 14, 20, 12, 2, PAL.shadow ? PAL.woodDark : PAL.brassDark);
    rect(buf, w, h, 2, 4, 24, 16, PAL.brassBase);
    rect(buf, w, h, 2, 4, 24, 2, PAL.brassHi);
    rect(buf, w, h, 2, 18, 24, 2, PAL.brassDark);
    for (let i = 0; i < 50; i++) {
        const n = noise(i, 12);
        const x = 3 + (n % 22);
        const y = 5 + ((n >> 5) % 14);
        const c = (n % 5 === 0) ? PAL.woodHi : PAL.brassHi;
        set(x, y, c);
    }
    rect(buf, w, h, 9, 4, 1, 16, PAL.brassDark);
    rect(buf, w, h, 19, 4, 1, 16, PAL.brassDark);
    return { w, h, buffer: buf };
}

function weaponRack() {
    const w = 22, h = 32;
    const buf = makeBuf(w, h);
    const set = setter(buf, w, h);
    rect(buf, w, h, 1, 2, 20, 2, PAL.woodBase);
    rect(buf, w, h, 1, 2, 20, 1, PAL.woodHi);
    rect(buf, w, h, 1, 28, 20, 2, PAL.woodBase);
    rect(buf, w, h, 1, 2, 2, 28, PAL.woodBase);
    rect(buf, w, h, 19, 2, 2, 28, PAL.woodBase);
    rect(buf, w, h, 1, 2, 1, 28, PAL.woodHi);
    rect(buf, w, h, 20, 2, 1, 28, PAL.woodDark);
    rect(buf, w, h, 6, 6, 1, 14, PAL.ironHi);
    rect(buf, w, h, 7, 6, 1, 14, PAL.ironBase);
    rect(buf, w, h, 4, 20, 5, 2, PAL.brassBase);
    rect(buf, w, h, 6, 22, 1, 4, PAL.woodDark);
    set(6, 5, PAL.ironHi);
    rect(buf, w, h, 13, 6, 1, 18, PAL.woodMid);
    rect(buf, w, h, 11, 6, 4, 4, PAL.ironBase);
    rect(buf, w, h, 11, 6, 4, 1, PAL.ironHi);
    rect(buf, w, h, 15, 8, 1, 2, PAL.ironHi);
    ellipse(buf, w, h, 16, 23, 3, 4, PAL.redBase);
    ellipse(buf, w, h, 16, 23, 2, 3, PAL.redHi);
    set(16, 23, PAL.brassHi);
    return { w, h, buffer: buf };
}

function marketStall(accent) {
    const w = 48, h = 40;
    const buf = makeBuf(w, h);
    const set = setter(buf, w, h);
    const c1 = accent || PAL.redBase;
    const c2 = PAL.white;
    rect(buf, w, h, 4, 4, 2, 18, PAL.woodBase);
    rect(buf, w, h, 42, 4, 2, 18, PAL.woodBase);
    rect(buf, w, h, 2, 2, 44, 8, c2);
    for (let x = 2; x < 46; x += 6) rect(buf, w, h, x, 2, 3, 8, c1);
    for (let x = 2; x < 46; x += 6) {
        rect(buf, w, h, x, 10, 3, 2, c1);
        rect(buf, w, h, x + 3, 10, 3, 1, c2);
        set(x + 1, 12, c1); set(x + 4, 11, c2);
    }
    rect(buf, w, h, 2, 1, 44, 1, PAL.woodDark);
    rect(buf, w, h, 4, 20, 40, 2, 'rgba(0,0,0,0.35)');
    rect(buf, w, h, 4, 22, 40, 14, PAL.woodMid);
    rect(buf, w, h, 4, 22, 40, 2, PAL.woodBase);
    rect(buf, w, h, 4, 34, 40, 2, PAL.woodDark);
    for (let x = 4; x < 44; x += 8) rect(buf, w, h, x, 24, 1, 10, PAL.woodDark);
    set(10, 21, PAL.redHi); set(11, 21, PAL.redHi); set(10, 20, PAL.redDark); set(11, 20, PAL.redDark);
    set(16, 21, PAL.brassHi); set(17, 21, PAL.brassHi); set(16, 20, PAL.brassDark);
    set(24, 21, PAL.leafMid); set(25, 21, PAL.leafBase); set(24, 20, PAL.leafDark);
    set(32, 21, PAL.purpleHi); set(33, 21, PAL.purpleHi); set(32, 20, PAL.purpleBase);
    set(38, 21, PAL.yellow); set(39, 21, PAL.yellow); set(38, 20, PAL.orange);
    ellipse(buf, w, h, 24, 38, 22, 2, 'rgba(0,0,0,0.3)');
    return { w, h, buffer: buf };
}

function shopBuilding() {
    // Tilted top-down (Stardew) anatomy: the ROOF PLANE seen from above takes
    // the top ~55%, then an eave shadow line, then a SHORT half-timber facade.
    const w = 80, h = 60;
    const buf = makeBuf(w, h);
    const set = setter(buf, w, h);
    // --- Roof plane (y 2..30): shingle rows, lighter at the ridge ---
    rect(buf, w, h, 0, 2, 80, 28, PAL.redBase);
    for (let y = 4; y < 30; y += 4) {
        rect(buf, w, h, 0, y, 80, 1, PAL.redDark);
        // Staggered shingle ticks
        for (let x = ((y / 4) % 2) * 4; x < 80; x += 8) set(x, y + 2, PAL.redDark);
    }
    // Ridge cap + highlight band under it
    rect(buf, w, h, 0, 2, 80, 2, PAL.redDark);
    rect(buf, w, h, 0, 4, 80, 2, PAL.redHi);
    // Side shading: right edge in shadow, left lit
    rect(buf, w, h, 78, 2, 2, 28, PAL.redDark);
    rect(buf, w, h, 0, 2, 1, 28, PAL.redHi);
    // Weathering specks
    for (let i = 0; i < 14; i++) {
        const n = noise(i, 11);
        set(2 + (n % 76), 6 + ((n >> 6) % 22), PAL.redDark);
    }
    // --- Chimney sitting ON the roof plane (top-right) ---
    rect(buf, w, h, 60, 0, 8, 8, PAL.stoneBase);
    rect(buf, w, h, 59, 0, 10, 2, PAL.stoneDark);
    rect(buf, w, h, 60, 2, 2, 6, PAL.stoneHi);
    rect(buf, w, h, 66, 2, 2, 6, PAL.stoneShade);
    rect(buf, w, h, 61, 8, 6, 2, PAL.stoneShade);
    // --- Eave: overhang shadow onto the facade ---
    rect(buf, w, h, 0, 30, 80, 2, PAL.outline);
    rect(buf, w, h, 1, 32, 78, 2, 'rgba(0,0,0,0.35)');
    // --- Facade (y 32..52): plaster + dark timber frame ---
    rect(buf, w, h, 2, 32, 76, 20, PAL.woodLite);
    // Vertical beams
    for (let x = 2; x <= 74; x += 12) rect(buf, w, h, x, 32, 2, 20, PAL.woodDark);
    rect(buf, w, h, 76, 32, 2, 20, PAL.woodDark);
    // Horizontal beam mid-facade
    rect(buf, w, h, 2, 41, 76, 1, PAL.woodDark);
    // Plaster shading under the eave
    rect(buf, w, h, 4, 34, 72, 1, PAL.woodMid);
    // --- Door (center, arched) ---
    rect(buf, w, h, 35, 38, 12, 14, PAL.woodDark);
    rect(buf, w, h, 36, 37, 10, 1, PAL.woodDark);
    rect(buf, w, h, 36, 39, 10, 13, PAL.woodBase);
    rect(buf, w, h, 37, 39, 1, 13, PAL.woodHi);
    rect(buf, w, h, 40, 40, 1, 12, PAL.woodDark);
    rect(buf, w, h, 43, 40, 1, 12, PAL.woodDark);
    set(44, 45, PAL.brassHi); set(44, 46, PAL.brassBase);
    // --- Windows: warm candlelit glass, timber sills ---
    rect(buf, w, h, 12, 36, 12, 9, PAL.woodDark);
    rect(buf, w, h, 13, 37, 10, 7, '#e8c060');
    rect(buf, w, h, 13, 40, 10, 1, PAL.woodDark);
    rect(buf, w, h, 17, 37, 1, 7, PAL.woodDark);
    rect(buf, w, h, 13, 37, 3, 2, '#f8e0a0');
    rect(buf, w, h, 11, 45, 14, 2, PAL.woodBase);
    rect(buf, w, h, 56, 36, 12, 9, PAL.woodDark);
    rect(buf, w, h, 57, 37, 10, 7, '#e8c060');
    rect(buf, w, h, 57, 40, 10, 1, PAL.woodDark);
    rect(buf, w, h, 61, 37, 1, 7, PAL.woodDark);
    rect(buf, w, h, 57, 37, 3, 2, '#f8e0a0');
    rect(buf, w, h, 55, 45, 14, 2, PAL.woodBase);
    // --- Stone foundation (y 52..58) ---
    rect(buf, w, h, 0, 52, 80, 6, PAL.stoneDark);
    rect(buf, w, h, 0, 52, 80, 1, PAL.stoneBase);
    for (let x = 3; x < 78; x += 7) set(x, 54 + (x % 3), PAL.stoneBase);
    // Door step
    rect(buf, w, h, 34, 52, 14, 3, PAL.stoneMid);
    return { w, h, buffer: buf };
}

function clothBanner(accent) {
    const w = 16, h = 32;
    const buf = makeBuf(w, h);
    const set = setter(buf, w, h);
    const c = accent || PAL.purpleBase;
    const cd = accent ? PAL.outline : PAL.purpleDark;
    rect(buf, w, h, 0, 0, 16, 2, PAL.brassBase);
    rect(buf, w, h, 0, 0, 16, 1, PAL.brassHi);
    rect(buf, w, h, 2, 2, 12, 24, c);
    rect(buf, w, h, 2, 2, 1, 24, cd);
    rect(buf, w, h, 13, 2, 1, 24, cd);
    rect(buf, w, h, 4, 4, 2, 20, accent ? PAL.white : PAL.purpleHi);
    rect(buf, w, h, 2, 26, 4, 2, c);
    rect(buf, w, h, 8, 26, 4, 2, c);
    set(3, 28, c); set(4, 29, c); set(10, 28, c); set(11, 29, c);
    rect(buf, w, h, 2, 26, 4, 1, cd);
    rect(buf, w, h, 8, 26, 4, 1, cd);
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
    rect(buf, w, h, 3, 6, 8, 13, PAL.woodMid);
    rect(buf, w, h, 3, 6, 8, 1, PAL.woodLite);
    rect(buf, w, h, 3, 18, 8, 1, PAL.woodDark);
    rect(buf, w, h, 3, 6, 1, 13, PAL.woodHi);
    rect(buf, w, h, 10, 6, 1, 13, PAL.woodDark);
    rect(buf, w, h, 3, 9, 8, 1, PAL.ironDark);
    rect(buf, w, h, 3, 15, 8, 1, PAL.ironDark);
    rect(buf, w, h, 3, 4, 8, 2, PAL.white);
    set(4, 3, PAL.white); set(6, 3, PAL.white); set(8, 3, PAL.white); set(9, 3, PAL.white);
    set(5, 5, PAL.stoneMid); set(8, 5, PAL.stoneMid);
    rect(buf, w, h, 5, 6, 1, 3, PAL.brassHi);
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
    ellipse(buf, w, h, 9, 5, 7, 3, PAL.woodBase);
    ellipse(buf, w, h, 9, 5, 7, 2, PAL.woodMid);
    ellipse(buf, w, h, 9, 4, 6, 1, PAL.woodHi);
    ellipse(buf, w, h, 9, 6, 7, 1, PAL.woodDark);
    set(6, 5, PAL.woodDark); set(11, 5, PAL.woodDark);
    rect(buf, w, h, 4, 7, 2, 10, PAL.woodBase);
    rect(buf, w, h, 4, 7, 1, 10, PAL.woodHi);
    rect(buf, w, h, 12, 7, 2, 10, PAL.woodBase);
    rect(buf, w, h, 13, 7, 1, 10, PAL.woodDark);
    rect(buf, w, h, 8, 7, 2, 10, PAL.woodMid);
    rect(buf, w, h, 5, 12, 8, 1, PAL.woodDark);
    return { w, h, buffer: buf };
}

function fireplace() {
    const w = 40, h = 48;
    const buf = makeBuf(w, h);
    const set = setter(buf, w, h);
    rect(buf, w, h, 0, 0, w, 6, PAL.stoneShade);
    rect(buf, w, h, 0, 6, w, 2, PAL.stoneDark);
    rect(buf, w, h, 0, 8, w, 36, PAL.stoneDark);
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
    rect(buf, w, h, 0, 4, w, 2, PAL.stoneMid);
    rect(buf, w, h, 0, 4, w, 1, PAL.stoneHi);
    rect(buf, w, h, 8, 14, 24, 30, PAL.ironDark);
    for (let i = 0; i < 6; i++) {
        rect(buf, w, h, 8 + i, 14 - i, 24 - i * 2, 1, PAL.stoneShade);
    }
    rect(buf, w, h, 10, 38, 20, 4, PAL.woodDark);
    rect(buf, w, h, 11, 36, 18, 3, PAL.woodBase);
    rect(buf, w, h, 13, 34, 14, 3, PAL.woodMid);
    set(10, 37, PAL.woodHi); set(29, 37, PAL.woodHi);
    set(11, 35, PAL.woodHi); set(28, 35, PAL.woodHi);
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
        set(20 - fw / 2 - 1, y + 2, c);
        set(20 + fw / 2, y + 2, c);
    });
    set(15, 22, PAL.yellow); set(25, 24, PAL.brassHi); set(18, 18, PAL.orange);
    return { w, h, buffer: buf };
}

function woodenTable() {
    const w = 56, h = 28;
    const buf = makeBuf(w, h);
    const set = setter(buf, w, h);
    rect(buf, w, h, 2, 4, 52, 8, PAL.woodMid);
    rect(buf, w, h, 2, 4, 52, 1, PAL.woodLite);
    rect(buf, w, h, 2, 11, 52, 1, PAL.woodDark);
    rect(buf, w, h, 2, 12, 52, 2, PAL.woodDark);
    rect(buf, w, h, 2, 7, 52, 1, PAL.woodDark);
    rect(buf, w, h, 2, 9, 52, 1, PAL.woodDark);
    for (let x = 4; x < 54; x += 6) set(x, 6, PAL.woodHi);
    for (let x = 7; x < 54; x += 6) set(x, 8, PAL.woodDark);
    rect(buf, w, h, 6, 14, 4, 13, PAL.woodBase);
    rect(buf, w, h, 6, 14, 1, 13, PAL.woodHi);
    rect(buf, w, h, 9, 14, 1, 13, PAL.woodDark);
    rect(buf, w, h, 46, 14, 4, 13, PAL.woodBase);
    rect(buf, w, h, 46, 14, 1, 13, PAL.woodHi);
    rect(buf, w, h, 49, 14, 1, 13, PAL.woodDark);
    rect(buf, w, h, 10, 14, 36, 2, PAL.woodDark);
    rect(buf, w, h, 26, 1, 4, 4, PAL.brassDark);
    rect(buf, w, h, 27, 0, 2, 1, PAL.yellow);
    set(28, 1, PAL.white);
    ellipse(buf, w, h, 18, 7, 4, 1, PAL.stoneHi);
    ellipse(buf, w, h, 38, 7, 4, 1, PAL.stoneHi);
    return { w, h, buffer: buf };
}

function barCounter() {
    const w = 100, h = 28;
    const buf = makeBuf(w, h);
    const set = setter(buf, w, h);
    rect(buf, w, h, 0, 0, w, 6, PAL.woodMid);
    rect(buf, w, h, 0, 0, w, 1, PAL.woodLite);
    rect(buf, w, h, 0, 5, w, 1, PAL.woodDark);
    rect(buf, w, h, 0, 6, w, 22, PAL.woodBase);
    rect(buf, w, h, 0, 6, w, 1, PAL.woodHi);
    rect(buf, w, h, 0, 26, w, 2, PAL.woodDark);
    for (let x = 8; x < w; x += 12) {
        rect(buf, w, h, x, 6, 1, 20, PAL.woodDark);
        set(x + 1, 7, PAL.woodHi);
    }
    rect(buf, w, h, 0, 22, w, 1, PAL.woodDark);
    rect(buf, w, h, 0, 23, w, 1, PAL.woodHi);
    for (let x = 4; x < w; x += 12) {
        set(x, 9, PAL.brassHi); set(x + 1, 9, PAL.brassBase);
    }
    return { w, h, buffer: buf };
}

// -----------------------------------------------------------------------------
//  Interior / Keep props
// -----------------------------------------------------------------------------

function wallTorch() {
    const w = 14, h = 32;
    const buf = makeBuf(w, h);
    const set = setter(buf, w, h);
    rect(buf, w, h, 4, 18, 6, 8, PAL.ironDark);
    rect(buf, w, h, 4, 18, 6, 1, PAL.ironHi);
    rect(buf, w, h, 4, 18, 1, 8, PAL.ironHi);
    rect(buf, w, h, 9, 18, 1, 8, PAL.ironBase);
    rect(buf, w, h, 6, 26, 2, 2, PAL.ironBase);
    rect(buf, w, h, 6, 10, 2, 10, PAL.woodDark);
    rect(buf, w, h, 6, 10, 1, 10, PAL.woodBase);
    const flame = [
        { y: 7, w: 4, c: PAL.redDark },
        { y: 5, w: 4, c: PAL.orange },
        { y: 3, w: 3, c: PAL.brassHi },
        { y: 1, w: 2, c: PAL.yellow },
    ];
    flame.forEach(({ y, w: fw, c }) => rect(buf, w, h, 7 - Math.floor(fw / 2), y, fw, 3, c));
    set(7, 0, PAL.white);
    set(4, 4, PAL.yellow); set(10, 5, PAL.orange);
    return { w, h, buffer: buf };
}

function bookshelf() {
    const w = 36, h = 56;
    const buf = makeBuf(w, h);
    const set = setter(buf, w, h);
    rect(buf, w, h, 0, 0, w, h, PAL.woodBase);
    rect(buf, w, h, 1, 1, w - 2, h - 2, PAL.woodMid);
    rect(buf, w, h, 0, 0, w, 3, PAL.woodDark);
    rect(buf, w, h, 0, 0, w, 1, PAL.woodHi);
    rect(buf, w, h, 0, h - 3, w, 3, PAL.woodDark);
    rect(buf, w, h, 0, 0, 2, h, PAL.woodHi);
    rect(buf, w, h, w - 2, 0, 2, h, PAL.woodDark);
    const shelfRows = [16, 30, 44];
    shelfRows.forEach(y => {
        rect(buf, w, h, 2, y, w - 4, 2, PAL.woodDark);
        rect(buf, w, h, 2, y, w - 4, 1, PAL.woodHi);
    });
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
            set(x + Math.floor(bw / 2), top + 2, PAL.brassHi);
            x += bw;
            i++;
        }
    };
    drawBookRow(4, 12);
    drawBookRow(18, 12);
    drawBookRow(32, 12);
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
    rect(buf, w, h, 0, 6, w, 22, PAL.woodBase);
    rect(buf, w, h, 0, 26, w, 4, PAL.woodDark);
    rect(buf, w, h, 0, 6, w, 1, PAL.woodHi);
    rect(buf, w, h, 0, 0, 6, 30, PAL.woodMid);
    rect(buf, w, h, 0, 0, 1, 30, PAL.woodHi);
    rect(buf, w, h, 5, 0, 1, 30, PAL.woodDark);
    rect(buf, w, h, 1, 1, 4, 5, PAL.woodDark);
    rect(buf, w, h, 1, 1, 4, 1, PAL.woodHi);
    rect(buf, w, h, 6, 8, w - 6, 18, PAL.blueBase);
    rect(buf, w, h, 6, 8, w - 6, 1, PAL.blueHi);
    rect(buf, w, h, 6, 25, w - 6, 1, PAL.blueDark);
    rect(buf, w, h, 6, 14, w - 6, 1, PAL.blueDark);
    rect(buf, w, h, 6, 15, w - 6, 1, PAL.blueHi);
    rect(buf, w, h, 8, 10, 10, 6, PAL.white);
    rect(buf, w, h, 8, 10, 10, 1, PAL.stoneHi);
    rect(buf, w, h, 8, 15, 10, 1, PAL.stoneMid);
    set(20, 10, PAL.blueHi); set(28, 12, PAL.blueHi);
    set(24, 18, PAL.blueDark); set(32, 20, PAL.blueDark);
    rect(buf, w, h, 7, 28, 3, 2, PAL.woodDark);
    rect(buf, w, h, w - 6, 28, 3, 2, PAL.woodDark);
    return { w, h, buffer: buf };
}

function diningChair() {
    const w = 14, h = 24;
    const buf = makeBuf(w, h);
    const set = setter(buf, w, h);
    rect(buf, w, h, 3, 0, 8, 12, PAL.woodBase);
    rect(buf, w, h, 3, 0, 8, 1, PAL.woodHi);
    rect(buf, w, h, 3, 0, 1, 12, PAL.woodHi);
    rect(buf, w, h, 10, 0, 1, 12, PAL.woodDark);
    rect(buf, w, h, 5, 4, 4, 4, PAL.outline);
    rect(buf, w, h, 2, 12, 10, 4, PAL.woodMid);
    rect(buf, w, h, 2, 12, 10, 1, PAL.woodLite);
    rect(buf, w, h, 2, 15, 10, 1, PAL.woodDark);
    rect(buf, w, h, 3, 16, 2, 8, PAL.woodBase);
    rect(buf, w, h, w - 5, 16, 2, 8, PAL.woodBase);
    rect(buf, w, h, 2, 23, 10, 1, PAL.shadow);
    return { w, h, buffer: buf };
}

function diningTable() {
    const w = 36, h = 32;
    const buf = makeBuf(w, h);
    const set = setter(buf, w, h);
    rect(buf, w, h, 2, 10, 32, 8, PAL.woodMid);
    rect(buf, w, h, 2, 10, 32, 1, PAL.woodLite);
    rect(buf, w, h, 2, 17, 32, 1, PAL.woodDark);
    rect(buf, w, h, 2, 18, 32, 2, PAL.woodDark);
    rect(buf, w, h, 4, 20, 3, 12, PAL.woodBase);
    rect(buf, w, h, 4, 20, 1, 12, PAL.woodHi);
    rect(buf, w, h, w - 7, 20, 3, 12, PAL.woodBase);
    rect(buf, w, h, w - 5, 20, 1, 12, PAL.woodDark);
    rect(buf, w, h, 7, 27, 22, 1, PAL.woodDark);
    rect(buf, w, h, 14, 7, 8, 3, PAL.brassDark);
    rect(buf, w, h, 14, 7, 8, 1, PAL.brassBase);
    rect(buf, w, h, 16, 6, 4, 1, PAL.brassHi);
    const candles = [
        { x: 12, h: 5 },
        { x: 18, h: 6 },
        { x: 24, h: 5 },
    ];
    candles.forEach(({ x, h: ch }) => {
        rect(buf, w, h, x, 7 - ch, 2, ch, PAL.white);
        set(x, 7 - ch, PAL.stoneHi);
        set(x, 7 - ch - 2, PAL.orange);
        set(x, 7 - ch - 1, PAL.yellow);
        set(x + 1, 7 - ch - 1, PAL.brassHi);
        set(x, 7 - ch - 3, PAL.yellow);
    });
    return { w, h, buffer: buf };
}

function redCarpet() {
    const w = 96, h = 56;
    const buf = makeBuf(w, h);
    const set = setter(buf, w, h);
    rect(buf, w, h, 0, 0, w, 3, PAL.brassDark);
    rect(buf, w, h, 0, h - 3, w, 3, PAL.brassDark);
    rect(buf, w, h, 0, 0, 3, h, PAL.brassDark);
    rect(buf, w, h, w - 3, 0, 3, h, PAL.brassDark);
    rect(buf, w, h, 1, 1, w - 2, 1, PAL.brassHi);
    rect(buf, w, h, 1, h - 2, w - 2, 1, PAL.brassHi);
    rect(buf, w, h, 1, 1, 1, h - 2, PAL.brassHi);
    rect(buf, w, h, w - 2, 1, 1, h - 2, PAL.brassHi);
    rect(buf, w, h, 3, 3, w - 6, h - 6, PAL.redDark);
    rect(buf, w, h, 6, 6, w - 12, h - 12, PAL.redBase);
    rect(buf, w, h, 8, 8, w - 16, 1, PAL.brassBase);
    rect(buf, w, h, 8, h - 9, w - 16, 1, PAL.brassBase);
    rect(buf, w, h, 8, 8, 1, h - 16, PAL.brassBase);
    rect(buf, w, h, w - 9, 8, 1, h - 16, PAL.brassBase);
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
    const w = 22, h = 36;
    const buf = makeBuf(w, h);
    const set = setter(buf, w, h);
    rect(buf, w, h, 4, 32, 14, 4, PAL.stoneDark);
    rect(buf, w, h, 4, 32, 14, 1, PAL.stoneBase);
    rect(buf, w, h, 5, 31, 12, 1, PAL.stoneMid);
    rect(buf, w, h, 10, 18, 2, 14, PAL.ironDark);
    rect(buf, w, h, 4, 12, 14, 12, PAL.ironBase);
    rect(buf, w, h, 4, 12, 14, 1, PAL.ironHi);
    rect(buf, w, h, 4, 12, 1, 12, PAL.ironHi);
    rect(buf, w, h, 17, 12, 1, 12, PAL.ironDark);
    rect(buf, w, h, 4, 23, 14, 1, PAL.ironDark);
    rect(buf, w, h, 2, 13, 3, 5, PAL.ironBase);
    rect(buf, w, h, 17, 13, 3, 5, PAL.ironBase);
    rect(buf, w, h, 2, 13, 3, 1, PAL.ironHi);
    rect(buf, w, h, 17, 13, 3, 1, PAL.ironHi);
    rect(buf, w, h, 9, 16, 4, 4, PAL.brassBase);
    rect(buf, w, h, 9, 16, 4, 1, PAL.brassHi);
    set(11, 18, PAL.redHi);
    rect(buf, w, h, 6, 2, 10, 8, PAL.ironBase);
    rect(buf, w, h, 6, 2, 10, 1, PAL.ironHi);
    rect(buf, w, h, 6, 9, 10, 1, PAL.ironDark);
    rect(buf, w, h, 8, 5, 6, 1, PAL.outline);
    rect(buf, w, h, 9, 0, 4, 3, PAL.redHi);
    set(10, -1 < 0 ? 0 : -1, PAL.redDark);
    return { w, h, buffer: buf };
}

function pixelSkull() {
    const w = 16, h = 16;
    const buf = makeBuf(w, h);
    const set = setter(buf, w, h);
    rect(buf, w, h, 4, 2, 8, 1, PAL.stoneShade);
    rect(buf, w, h, 3, 3, 10, 1, PAL.stoneBase);
    rect(buf, w, h, 2, 4, 12, 6, PAL.stoneHi);
    rect(buf, w, h, 2, 4, 1, 6, PAL.stoneShade);
    rect(buf, w, h, 13, 4, 1, 6, PAL.stoneShade);
    rect(buf, w, h, 3, 10, 10, 1, PAL.stoneBase);
    rect(buf, w, h, 4, 5, 3, 3, PAL.outline);
    rect(buf, w, h, 9, 5, 3, 3, PAL.outline);
    set(5, 6, '#c81616'); set(10, 6, '#c81616');
    rect(buf, w, h, 7, 8, 2, 2, PAL.outline);
    rect(buf, w, h, 4, 11, 8, 3, PAL.stoneBase);
    set(5, 12, PAL.outline); set(7, 12, PAL.outline); set(9, 12, PAL.outline); set(11, 12, PAL.outline);
    rect(buf, w, h, 4, 14, 8, 1, PAL.stoneShade);
    return { w, h, buffer: buf };
}

function stoneFloorPatch() {
    const w = 64, h = 32;
    const buf = makeBuf(w, h);
    for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
            const n = noise(x, y, 4) % 9;
            const c = n < 5 ? PAL.stoneBase : (n < 8 ? PAL.stoneMid : PAL.stoneHi);
            buf[y * w + x] = c;
        }
    }
    return { w, h, buffer: buf };
}

function ledgarStatue() {
    // Ledgar, First Archivist of the Council — hooded stone figure holding an
    // open ledger at chest height, atop a two-step pedestal. Town landmark.
    const w = 36, h = 58;
    const buf = makeBuf(w, h);
    const set = setter(buf, w, h);
    // Pedestal: two steps
    rect(buf, w, h, 2, 50, 32, 7, PAL.stoneBase);
    rect(buf, w, h, 2, 50, 32, 1, PAL.stoneHi);
    rect(buf, w, h, 2, 56, 32, 1, PAL.stoneShade);
    rect(buf, w, h, 7, 45, 22, 5, PAL.stoneMid);
    rect(buf, w, h, 7, 45, 22, 1, PAL.stoneHi);
    // Engraved brass plaque on the lower step
    rect(buf, w, h, 14, 52, 8, 3, PAL.brassDark);
    rect(buf, w, h, 15, 53, 6, 1, PAL.brassBase);
    // Robe: A-shaped taper, wide hem to narrow shoulders
    for (let y = 0; y < 24; y++) {
        const half = 4 + Math.round(y * 0.32);
        rect(buf, w, h, 18 - half, 21 + y, half * 2, 1, PAL.stoneMid);
    }
    // Shading: left lit, right shadowed
    for (let y = 2; y < 24; y++) {
        const half = 4 + Math.round(y * 0.32);
        set(18 - half, 21 + y, PAL.stoneHi);
        set(17 + half, 21 + y, PAL.stoneDark);
        set(16 + half, 21 + y, PAL.stoneDark);
    }
    // Central robe fold
    rect(buf, w, h, 18, 34, 1, 11, PAL.stoneDark);
    // Hem shadow on the pedestal
    rect(buf, w, h, 9, 44, 18, 1, PAL.stoneShade);
    // Hood: rounded, clearly wider than the neck
    disc(buf, w, h, 18, 15, 6, PAL.stoneMid);
    rect(buf, w, h, 12, 15, 12, 5, PAL.stoneMid);
    disc(buf, w, h, 16, 12, 3, PAL.stoneHi);
    // Deep face shadow inside the hood
    rect(buf, w, h, 15, 14, 7, 5, PAL.stoneShade);
    rect(buf, w, h, 16, 15, 5, 3, '#26262c');
    // Hood drapes onto shoulders
    rect(buf, w, h, 11, 20, 14, 2, PAL.stoneDark);
    // Arms angled in from the sides, meeting under the book
    rect(buf, w, h, 10, 26, 3, 6, PAL.stoneMid);
    rect(buf, w, h, 23, 26, 3, 6, PAL.stoneMid);
    set(10, 26, PAL.stoneHi); set(25, 26, PAL.stoneDark);
    // Open ledger: parchment pages spread wider than the body
    rect(buf, w, h, 7, 29, 22, 7, PAL.brassDark);
    rect(buf, w, h, 8, 30, 9, 5, PAL.white);
    rect(buf, w, h, 19, 30, 9, 5, PAL.white);
    rect(buf, w, h, 17, 29, 2, 7, PAL.brassDark);
    // Page bottom shade + text lines
    rect(buf, w, h, 8, 34, 9, 1, '#d8ccb0');
    rect(buf, w, h, 19, 34, 9, 1, '#d8ccb0');
    rect(buf, w, h, 9, 31, 6, 1, PAL.stoneDark);
    rect(buf, w, h, 20, 31, 6, 1, PAL.stoneDark);
    rect(buf, w, h, 9, 33, 5, 1, PAL.stoneDark);
    rect(buf, w, h, 20, 33, 5, 1, PAL.stoneDark);
    // Weathering: moss at the base, worn hood top
    set(4, 51, PAL.leafDark); set(5, 51, PAL.leafBase);
    set(30, 52, PAL.leafDark); set(29, 55, PAL.leafBase);
    set(8, 48, PAL.leafDark); set(27, 46, PAL.leafDark);
    return { w, h, buffer: buf };
}

function barrelTipped() {
    // A barrel on its side, lid off, apples spilled — market mishap microstory.
    const w = 34, h = 20;
    const buf = makeBuf(w, h);
    const set = setter(buf, w, h);
    // Body lying horizontally
    rect(buf, w, h, 2, 4, 20, 13, PAL.woodMid);
    rect(buf, w, h, 2, 4, 20, 2, PAL.woodHi);
    rect(buf, w, h, 2, 15, 20, 2, PAL.woodDark);
    // Iron hoops (vertical now)
    rect(buf, w, h, 5, 4, 2, 13, PAL.ironDark);
    rect(buf, w, h, 16, 4, 2, 13, PAL.ironDark);
    rect(buf, w, h, 5, 4, 1, 13, PAL.ironHi);
    rect(buf, w, h, 16, 4, 1, 13, PAL.ironHi);
    // Open mouth (dark interior ellipse facing right)
    ellipse(buf, w, h, 22, 10, 3, 7, PAL.woodDark);
    ellipse(buf, w, h, 22, 10, 2, 5, PAL.outline);
    // Plank seams
    rect(buf, w, h, 8, 8, 8, 1, PAL.woodDark);
    rect(buf, w, h, 8, 12, 8, 1, PAL.woodDark);
    // Spilled apples rolling out
    disc(buf, w, h, 26, 12, 2, PAL.redBase); set(25, 11, PAL.redHi);
    disc(buf, w, h, 30, 15, 2, PAL.redBase); set(29, 14, PAL.redHi);
    disc(buf, w, h, 27, 17, 1, PAL.redDark);
    set(26, 9, PAL.leafDark); set(30, 12, PAL.leafDark);
    // Ground shadow
    ellipse(buf, w, h, 12, 18, 11, 1, PAL.shadow);
    return { w, h, buffer: buf };
}

function catSleeping() {
    // Curled-up sleeping cat — shopkeeper's ginger mouser.
    const w = 20, h = 12;
    const buf = makeBuf(w, h);
    const set = setter(buf, w, h);
    const furDark = '#8a4a18', furBase = '#c07030', furHi = '#e09a50';
    // Curled body
    ellipse(buf, w, h, 10, 7, 8, 4, furBase);
    ellipse(buf, w, h, 10, 6, 7, 3, furHi);
    rect(buf, w, h, 3, 9, 14, 2, furDark);
    // Tail wrapped around the front
    rect(buf, w, h, 3, 8, 10, 2, furDark);
    set(2, 8, furDark); set(2, 7, furBase);
    // Head resting on paws (right side)
    ellipse(buf, w, h, 14, 6, 4, 3, furBase);
    // Ears
    set(12, 2, furDark); set(13, 3, furBase);
    set(16, 2, furDark); set(16, 3, furBase);
    // Closed eyes + nose
    set(13, 5, PAL.outline); set(16, 5, PAL.outline);
    set(15, 7, '#e87aa8');
    // Stripes
    set(7, 4, furDark); set(9, 4, furDark); set(11, 4, furDark);
    return { w, h, buffer: buf };
}

function councilBoard() {
    // Council notice board — roofed post board plastered with quest papers.
    const w = 44, h = 48;
    const buf = makeBuf(w, h);
    const set = setter(buf, w, h);
    // Posts
    rect(buf, w, h, 4, 14, 4, 32, PAL.woodBase);
    rect(buf, w, h, 36, 14, 4, 32, PAL.woodBase);
    rect(buf, w, h, 4, 14, 1, 32, PAL.woodHi);
    rect(buf, w, h, 39, 14, 1, 32, PAL.woodDark);
    // Little shingle roof
    rect(buf, w, h, 0, 6, 44, 3, PAL.woodDark);
    rect(buf, w, h, 2, 4, 40, 3, PAL.woodMid);
    rect(buf, w, h, 2, 4, 40, 1, PAL.woodHi);
    // Board panel
    rect(buf, w, h, 6, 10, 32, 26, PAL.woodMid);
    rect(buf, w, h, 6, 10, 32, 1, PAL.woodLite);
    rect(buf, w, h, 6, 35, 32, 1, PAL.woodDark);
    rect(buf, w, h, 6, 10, 1, 26, PAL.woodHi);
    rect(buf, w, h, 37, 10, 1, 26, PAL.woodDark);
    // Pinned papers, slightly askew
    rect(buf, w, h, 9, 13, 8, 10, PAL.white);
    rect(buf, w, h, 10, 15, 6, 1, PAL.stoneDark);
    rect(buf, w, h, 10, 17, 5, 1, PAL.stoneDark);
    rect(buf, w, h, 10, 19, 6, 1, PAL.stoneDark);
    set(12, 13, PAL.redBase);
    rect(buf, w, h, 20, 12, 9, 12, '#e8dcb8');
    rect(buf, w, h, 21, 14, 7, 1, PAL.stoneDark);
    rect(buf, w, h, 21, 16, 6, 1, PAL.stoneDark);
    rect(buf, w, h, 21, 18, 7, 1, PAL.stoneDark);
    rect(buf, w, h, 21, 20, 4, 1, PAL.stoneDark);
    set(24, 12, PAL.redBase);
    rect(buf, w, h, 31, 14, 5, 8, PAL.white);
    rect(buf, w, h, 32, 16, 3, 1, PAL.stoneDark);
    set(33, 14, PAL.redBase);
    // One paper half torn, corner hanging
    rect(buf, w, h, 12, 26, 7, 7, '#e8dcb8');
    rect(buf, w, h, 13, 28, 5, 1, PAL.stoneDark);
    set(12, 33, '#e8dcb8'); set(11, 34, '#d8c8a0');
    // Council seal (brass) on the frame
    disc(buf, w, h, 28, 30, 3, PAL.brassBase);
    set(28, 30, PAL.brassDark); set(27, 29, PAL.brassHi);
    return { w, h, buffer: buf };
}

function ancientTree() {
    // The Elderwood — massive gnarled oak, Mystic Forest landmark. Wide
    // canopy in three greens, thick knotted trunk with a face-like hollow,
    // spreading roots, and faint carved runes that glow brass.
    const w = 56, h = 72;
    const buf = makeBuf(w, h);
    const set = setter(buf, w, h);
    // Root flare
    rect(buf, w, h, 16, 66, 24, 4, PAL.woodDark);
    rect(buf, w, h, 12, 68, 8, 3, PAL.woodDark);
    rect(buf, w, h, 36, 68, 8, 3, PAL.woodDark);
    rect(buf, w, h, 14, 67, 4, 2, PAL.woodBase);
    rect(buf, w, h, 38, 67, 4, 2, PAL.woodBase);
    // Trunk: thick, tapering upward, gnarled edges
    for (let y = 0; y < 30; y++) {
        const half = 8 - Math.round(y * 0.12) + ((noise(3, y, 9) % 3) - 1);
        rect(buf, w, h, 28 - half, 38 + y, half * 2, 1, PAL.woodBase);
        set(28 - half, 38 + y, PAL.woodDark);
        set(27 + half, 38 + y, PAL.woodDark);
        set(29 - half, 38 + y, PAL.woodMid);
    }
    // Bark grain
    for (let y = 40; y < 66; y += 2) {
        set(24 + (noise(1, y, 5) % 3), y, PAL.woodDark);
        set(30 + (noise(2, y, 7) % 3), y, PAL.woodDark);
    }
    // Face-like hollow in the trunk
    ellipse(buf, w, h, 28, 50, 4, 5, PAL.woodDark);
    ellipse(buf, w, h, 28, 50, 3, 4, '#1a0e08');
    set(26, 48, PAL.woodDark); set(30, 48, PAL.woodDark);
    // Carved runes, faint brass glow
    set(22, 56, PAL.brassBase); set(22, 57, PAL.brassDark);
    set(34, 54, PAL.brassBase); set(34, 55, PAL.brassDark); set(35, 54, PAL.brassDark);
    set(24, 62, PAL.brassDark); set(25, 62, PAL.brassBase);
    // Canopy: three stacked blobs, dark to light
    disc(buf, w, h, 28, 22, 22, PAL.leafShade);
    disc(buf, w, h, 14, 26, 12, PAL.leafShade);
    disc(buf, w, h, 42, 26, 12, PAL.leafShade);
    disc(buf, w, h, 28, 18, 18, PAL.leafDark);
    disc(buf, w, h, 16, 24, 9, PAL.leafDark);
    disc(buf, w, h, 40, 24, 9, PAL.leafDark);
    disc(buf, w, h, 24, 14, 12, PAL.leafBase);
    disc(buf, w, h, 38, 18, 8, PAL.leafBase);
    disc(buf, w, h, 20, 10, 7, PAL.leafMid);
    disc(buf, w, h, 34, 12, 6, PAL.leafMid);
    // Light spots on the crown
    set(18, 6, PAL.leafHi); set(19, 6, PAL.leafHi); set(18, 7, PAL.leafHi);
    set(30, 8, PAL.leafHi); set(31, 8, PAL.leafHi);
    set(24, 4, PAL.leafSpot); set(36, 10, PAL.leafSpot); set(12, 20, PAL.leafSpot);
    set(44, 22, PAL.leafHi); set(10, 28, PAL.leafHi);
    // Canopy underside shadow meeting the trunk
    rect(buf, w, h, 20, 36, 16, 2, PAL.leafShade);
    // Hanging vine strands
    rect(buf, w, h, 10, 32, 1, 8, PAL.leafDark); set(10, 40, PAL.leafBase);
    rect(buf, w, h, 46, 30, 1, 10, PAL.leafDark); set(46, 40, PAL.leafBase);
    rect(buf, w, h, 38, 34, 1, 6, PAL.leafDark); set(38, 40, PAL.leafMid);
    return { w, h, buffer: buf };
}

// -----------------------------------------------------------------------------
//  Registry — single export consumed by both game and editor
// -----------------------------------------------------------------------------

export const SPRITE_REGISTRY = {
    oak_tree: oakTree(),
    pine_tree: pineTree(),
    bush: bush(),
    flowers: flowersCluster(),
    mushroom: mushroom(),
    grass_tuft: grassTuft(),
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
    mug: tavernMug(),
    stool: tavernStool(),
    fire: fireplace(),
    table: woodenTable(),
    bar_counter: barCounter(),
    wall_torch: wallTorch(),
    bookshelf: bookshelf(),
    bed: bed(),
    dining_chair: diningChair(),
    dining_table: diningTable(),
    red_carpet: redCarpet(),
    armor_stand: armorStand(),
    floor_patch: stoneFloorPatch(),
    skull: pixelSkull(),
    ledgar_statue: ledgarStatue(),
    barrel_tipped: barrelTipped(),
    cat_sleeping: catSleeping(),
    council_board: councilBoard(),
    ancient_tree: ancientTree(),
};

// -----------------------------------------------------------------------------
//  FLOOR TILES — the 5 real game floors, mirrored from sprites.jsx so the map
//  editor can paint WYSIWYG ground. Each is a flat 64×64 buffer of hex strings.
//  Keys match the runtime tileSprite keys, so a saved map's floor renders in the
//  game exactly as painted.
// -----------------------------------------------------------------------------

function floorCobblestone() {
    const S = 64, MORTAR = '#6d5f4e', buf = new Array(S * S).fill(MORTAR);
    const tones = [
        { base: '#7d6e5a', hi: '#8a7a64', sh: '#6f6150' },
        { base: '#847462', hi: '#90806c', sh: '#746556' },
        { base: '#78695a', hi: '#847460', sh: '#6a5c4e' },
        { base: '#81715c', hi: '#8e7d68', sh: '#726352' },
    ];
    const set = (x, y, c) => { if (x >= 0 && x < S && y >= 0 && y < S) buf[y * S + x] = c; };
    const stone = (sx, sy, w, h, t) => {
        for (let dy = 0; dy < h; dy++) for (let dx = 0; dx < w; dx++) {
            if ((dx === 0 || dx === w - 1) && (dy === 0 || dy === h - 1)) continue;
            let c = t.base;
            if (dy === 0) c = t.hi; else if (dy === h - 1) c = t.sh;
            const seed = ((sx + dx) * 13 + (sy + dy) * 7) % 17;
            if (seed === 0) c = t.sh; else if (seed === 1) c = t.hi;
            set(sx + dx, sy + dy, c);
        }
    };
    for (let row = 0; row < 8; row++) {
        const offset = (row % 2) * 4;
        for (let col = -1; col < 9; col++) {
            const x = col * 8 + offset, y = row * 8;
            const n = ((row * 31 + col * 17) >>> 0) % 23;
            const t = tones[(row * 3 + col + 7) % tones.length];
            stone(x + 1, y + 1, 7 - (n % 2), 7 - ((n >> 2) % 2), t);
        }
    }
    return buf;
}

function floorStone() {
    const S = 64, buf = new Array(S * S).fill('#2a2a3a');
    const tones = [
        { base: '#454a74', hi: '#666c9c', sh: '#282c50' },
        { base: '#3c4166', hi: '#5c628c', sh: '#20223e' },
        { base: '#4a507c', hi: '#6c72a4', sh: '#2e325c' },
        { base: '#42476e', hi: '#626892', sh: '#262a4c' },
    ];
    const set = (x, y, c) => { if (x >= 0 && x < S && y >= 0 && y < S) buf[y * S + x] = c; };
    const stone = (sx, sy, w, h, t) => {
        for (let dy = 1; dy < h - 1; dy++) for (let dx = 1; dx < w - 1; dx++) {
            let c = t.base;
            if (dy === 1 || dx === 1) c = t.hi; else if (dy >= h - 2 || dx >= w - 2) c = t.sh;
            const seed = ((sx + dx) * 17 + (sy + dy) * 11) % 13;
            if (seed === 0) c = t.sh; else if (seed === 1) c = t.hi;
            set(sx + dx, sy + dy, c);
        }
    };
    for (let row = 0; row < 4; row++) {
        const offset = (row % 2) * 16;
        for (let col = -1; col < 4; col++) {
            const t = tones[(row * 2 + col + 6) % tones.length];
            stone(col * 32 + offset, row * 16, 32, 16, t);
        }
    }
    return buf;
}

function floorGrass() {
    const S = 64, buf = new Array(S * S).fill('#166534');
    const tones = [
        { base: '#166534', hi: '#15803d', sh: '#14532d' },
        { base: '#15803d', hi: '#16a34a', sh: '#166534' },
        { base: '#14532d', hi: '#166534', sh: '#052e16' },
    ];
    const set = (x, y, c) => { if (x >= 0 && x < S && y >= 0 && y < S) buf[y * S + x] = c; };
    for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) {
        const seed = (x * 13 + y * 7 + x * y * 3) % 17;
        const t = tones[seed % tones.length];
        let c = t.base;
        if (seed < 3) c = t.hi; else if (seed > 14) c = t.sh;
        set(x, y, c);
    }
    [5, 12, 19, 27, 34, 41, 49, 56, 8, 22, 38, 52].forEach(bx => {
        const height = 3 + ((bx * 7) % 4), by = S - height - ((bx * 3) % 6);
        for (let i = 0; i < height; i++) { set(bx, by + i, '#22c55e'); if (i === 0) set(bx - 1, by + 1, '#16a34a'); }
    });
    [[10, 10], [30, 45], [55, 20], [20, 55], [48, 35]].forEach(([fx, fy]) => { set(fx, fy, '#fbbf24'); set(fx + 1, fy, '#fbbf24'); });
    return buf;
}

function floorDungeon() {
    const S = 64, buf = new Array(S * S).fill('#0a0a14');
    const set = (x, y, c) => { if (x >= 0 && x < S && y >= 0 && y < S) buf[y * S + x] = c; };
    const tones = [
        { base: '#1a1a2e', hi: '#252540', sh: '#0a0a14' },
        { base: '#16162a', hi: '#202038', sh: '#080810' },
    ];
    for (let row = 0; row < 4; row++) {
        const offset = (row % 2) * 16;
        for (let col = -1; col < 4; col++) {
            const x = col * 32 + offset, y = row * 16, t = tones[(row + col + 4) % tones.length];
            for (let dy = 1; dy < 15; dy++) for (let dx = 1; dx < 31; dx++) {
                let c = t.base;
                if (dy === 1 || dx === 1) c = t.hi; else if (dy >= 14 || dx >= 30) c = t.sh;
                set(x + dx, y + dy, c);
            }
        }
    }
    [[20, 8, 8], [44, 28, 6], [10, 44, 5], [50, 50, 7]].forEach(([cx, cy, len]) => {
        for (let i = 0; i < len; i++) set(cx + i, cy + (i % 3 === 0 ? 1 : 0), '#0a0a14');
    });
    [[15, 32], [48, 16], [32, 48]].forEach(([mx, my]) => { set(mx, my, '#12122a'); set(mx + 1, my, '#12122a'); set(mx, my + 1, '#12122a'); });
    return buf;
}

function floorWood() {
    const S = 64, buf = new Array(S * S).fill('#3d261b');
    const set = (x, y, c) => { if (x >= 0 && x < S && y >= 0 && y < S) buf[y * S + x] = c; };
    const PLANK_H = 8;
    const tones = [
        { base: '#4a3225', hi: '#5c3e2e', sh: '#3d261b', grain: '#3a2218' },
        { base: '#3d261b', hi: '#4a3225', sh: '#2e1a10', grain: '#2a1610' },
        { base: '#4f3628', hi: '#614030', sh: '#3d261b', grain: '#3a2218' },
        { base: '#422b1c', hi: '#52351f', sh: '#33200f', grain: '#2a1610' },
    ];
    for (let row = 0; row < 8; row++) {
        const t = tones[row % tones.length];
        for (let dy = 0; dy < PLANK_H; dy++) for (let x = 0; x < S; x++) {
            const y = row * PLANK_H + dy;
            let c = t.base;
            if (dy === 0) c = t.hi;
            if (dy === PLANK_H - 1) c = t.sh;
            const veta = (x * 3 + row * 7) % 19;
            if (veta === 0 || veta === 1) c = t.grain;
            set(x, y, c);
        }
    }
    return buf;
}

function floorWater() {
    const S = 64, buf = new Array(S * S).fill('#2a5a8a');
    const tones = ['#2a5a8a', '#3468a0', '#3f78b4', '#5a90c8'];
    for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) {
        const n = (x * 7 + y * 13 + Math.floor(y / 4) * 3) % 11;
        let c = tones[0];
        if (n < 2) c = tones[3]; else if (n < 4) c = tones[2]; else if (n < 7) c = tones[1];
        buf[y * S + x] = c;
    }
    for (let ry = 6; ry < S; ry += 12) for (let x = 2; x < S - 2; x++) if ((x + ry) % 7 < 3) buf[ry * S + x] = '#7aa8d8';
    return buf;
}

function floorDirt() {
    const S = 64, buf = new Array(S * S).fill('#b89868');
    const tones = ['#b89868', '#c8a878', '#a88858', '#d0b488'];
    for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) {
        const n = (x * 13 + y * 7 + x * y * 3) % 13;
        let c = tones[0];
        if (n < 2) c = tones[3]; else if (n < 5) c = tones[1]; else if (n > 10) c = tones[2];
        buf[y * S + x] = c;
    }
    [[10, 12], [30, 40], [50, 20], [20, 52], [44, 34]].forEach(([px, py]) => { buf[py * S + px] = '#8a7048'; buf[py * S + px + 1] = '#8a7048'; });
    return buf;
}

export const FLOOR_TILES = {
    cobblestone_tile: floorCobblestone(),
    stone_floor_tile: floorStone(),
    grass_tile: floorGrass(),
    dungeon_floor_tile: floorDungeon(),
    wood_floor_tile: floorWood(),
    water_tile: floorWater(),
    dirt_tile: floorDirt(),
};

// Convenience: render a buffer to a canvas (used by map_editor for thumbnails)
export function renderBufferToCanvas(buf, w, h, canvas, scale = 1) {
    canvas.width = w * scale;
    canvas.height = h * scale;
    const ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = false;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
            const c = buf[y * w + x];
            if (c && c !== 'transparent') {
                ctx.fillStyle = c;
                ctx.fillRect(x * scale, y * scale, scale, scale);
            }
        }
    }
}
