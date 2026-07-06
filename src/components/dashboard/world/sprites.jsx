// =============================================================================
//  PIXEL SPRITES — pipeline for the Taskoria Pixel Studio editor
// =============================================================================
//
//  How to add a new sprite:
//  1. Open the Pixel Studio (the standalone HTML editor).
//  2. Draw your tile / prop on the 64×64 grid.
//  3. Click "Generar Código" — copy the JSON.
//  4. Paste it in the SPRITES object below as: <name>: [ ...buffer... ]
//     (a buffer is an array of 4096 color strings; 'transparent' for empty)
//  5. Reference it from MapData.js:
//        - As a floor tile:  `tileSprite: 'my_floor'`
//        - As a placed prop: `{ type: 'sprite', name: 'my_barrel', x, y, scale }`
//
// =============================================================================

import React from 'react';

export const SPRITE_GRID = 64; // editor grid is 64×64

// -----------------------------------------------------------------------------
//  Helpers
// -----------------------------------------------------------------------------

/**
 * Build a compact SVG body from a pixel buffer, merging horizontal runs of the
 * same color into a single <rect>. Keeps the SVG small and crisp.
 */
function bufferToSvgRects(buffer, size = SPRITE_GRID) {
    let body = '';
    for (let y = 0; y < size; y++) {
        let runColor = null;
        let runStart = 0;
        for (let x = 0; x <= size; x++) {
            const color = x < size ? buffer[y * size + x] : null;
            if (color !== runColor) {
                if (runColor && runColor !== 'transparent') {
                    body += `<rect x="${runStart}" y="${y}" width="${x - runStart}" height="1" fill="${runColor}"/>`;
                }
                runColor = color;
                runStart = x;
            }
        }
    }
    return body;
}

/**
 * Convert a pixel buffer into a `data:` URL suitable for CSS `background-image`.
 * Use this for tileable floors and walls.
 */
export function pixelBufferToDataUrl(buffer, size = SPRITE_GRID) {
    const body = bufferToSvgRects(buffer, size);
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" shape-rendering="crispEdges">${body}</svg>`;
    return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

// Buffers are immutable, so the merged-run <rect> list for a given buffer never
// changes. Cache it by buffer reference so we compute it once instead of on
// every render (the world re-renders frequently during movement).
const _rectCache = new WeakMap();
function buildRects(buffer, size) {
    if (typeof buffer === 'object' && buffer !== null) {
        const cached = _rectCache.get(buffer);
        if (cached) return cached;
    }
    const rects = [];
    for (let y = 0; y < size; y++) {
        let runColor = null;
        let runStart = 0;
        for (let x = 0; x <= size; x++) {
            const color = x < size ? buffer[y * size + x] : null;
            if (color !== runColor) {
                if (runColor && runColor !== 'transparent') {
                    rects.push(
                        <rect key={`${y}-${runStart}`} x={runStart} y={y} width={x - runStart} height={1} fill={runColor} />
                    );
                }
                runColor = color;
                runStart = x;
            }
        }
    }
    if (typeof buffer === 'object' && buffer !== null) _rectCache.set(buffer, rects);
    return rects;
}

/**
 * React component to render a pixel buffer as an inline SVG sprite.
 * Crisp at any scale, no rasterization blur.
 * Memoized: skips re-render when props are unchanged (e.g. during movement).
 */
export const PixelSprite = React.memo(function PixelSprite({ buffer, size = SPRITE_GRID, scale = 1, style, className }) {
    if (!buffer) return null;
    const rects = buildRects(buffer, size);
    return (
        <svg
            width={size * scale}
            height={size * scale}
            viewBox={`0 0 ${size} ${size}`}
            shapeRendering="crispEdges"
            style={{ imageRendering: 'pixelated', display: 'block', ...style }}
            className={className}
        >
            {rects}
        </svg>
    );
});

// -----------------------------------------------------------------------------
//  Procedural demo sprite — replace with your hand-drawn version when ready
// -----------------------------------------------------------------------------

/**
 * Procedural 64×64 cobblestone tile. Generates a 4-row brick pattern with
 * alternating offsets, per-stone highlight and shadow, dark mortar.
 * Returns a 4096-entry buffer compatible with the Pixel Studio format.
 */
function generateCobblestoneTile() {
    const S = 64;
    const buf = new Array(S * S).fill('#2a1a10'); // mortar (dark)

    const stoneTones = [
        { base: '#7a553b', hi: '#9a7858', sh: '#4d3322' },
        { base: '#6b4a33', hi: '#8a6b50', sh: '#43291a' },
        { base: '#86603f', hi: '#a8835a', sh: '#56381f' },
        { base: '#705032', hi: '#947254', sh: '#46291a' }
    ];

    const set = (x, y, c) => {
        if (x < 0 || x >= S || y < 0 || y >= S) return;
        buf[y * S + x] = c;
    };

    const drawStone = (sx, sy, w, h, t) => {
        for (let dy = 1; dy < h - 1; dy++) {
            for (let dx = 1; dx < w - 1; dx++) {
                let c = t.base;
                if (dy === 1 || dx === 1) c = t.hi;
                else if (dy >= h - 2 || dx >= w - 2) c = t.sh;
                // subtle speckle
                const seed = ((sx + dx) * 13 + (sy + dy) * 7) % 11;
                if (seed === 0) c = t.sh;
                else if (seed === 1) c = t.hi;
                set(sx + dx, sy + dy, c);
            }
        }
    };

    const ROW_H = 16;
    const COL_W = 16;
    for (let row = 0; row < 4; row++) {
        const offset = (row % 2) * 8;
        for (let col = -1; col < 5; col++) {
            const x = col * COL_W + offset;
            const y = row * ROW_H;
            const t = stoneTones[(row * 3 + col + 7) % stoneTones.length];
            drawStone(x, y, COL_W, ROW_H, t);
        }
    }

    return buf;
}

// -----------------------------------------------------------------------------
//  Procedural floor tiles — castle, forest, dungeon, tavern
// -----------------------------------------------------------------------------

function generateStoneFloorTile() {
    const S = 64;
    const buf = new Array(S * S).fill('#2a2a3a');
    const stoneTones = [
        { base: '#4a4860', hi: '#6a6880', sh: '#2a2840' },
        { base: '#3e3c52', hi: '#5e5c72', sh: '#1e1c32' },
        { base: '#524f6a', hi: '#726f8a', sh: '#322f4a' },
        { base: '#464460', hi: '#666480', sh: '#262440' },
    ];
    const set = (x, y, c) => {
        if (x < 0 || x >= S || y < 0 || y >= S) return;
        buf[y * S + x] = c;
    };
    const drawStone = (sx, sy, w, h, t) => {
        for (let dy = 1; dy < h - 1; dy++) {
            for (let dx = 1; dx < w - 1; dx++) {
                let c = t.base;
                if (dy === 1 || dx === 1) c = t.hi;
                else if (dy >= h - 2 || dx >= w - 2) c = t.sh;
                const seed = ((sx + dx) * 17 + (sy + dy) * 11) % 13;
                if (seed === 0) c = t.sh;
                else if (seed === 1) c = t.hi;
                set(sx + dx, sy + dy, c);
            }
        }
    };
    const ROW_H = 16;
    const COL_W = 32;
    for (let row = 0; row < 4; row++) {
        const offset = (row % 2) * 16;
        for (let col = -1; col < 4; col++) {
            const x = col * COL_W + offset;
            const y = row * ROW_H;
            const t = stoneTones[(row * 2 + col + 6) % stoneTones.length];
            drawStone(x, y, COL_W, ROW_H, t);
        }
    }
    return buf;
}

function generateGrassTile() {
    const S = 64;
    const buf = new Array(S * S).fill('#166534');
    const grassTones = [
        { base: '#166534', hi: '#15803d', sh: '#14532d' },
        { base: '#15803d', hi: '#16a34a', sh: '#166534' },
        { base: '#14532d', hi: '#166534', sh: '#052e16' },
    ];
    const set = (x, y, c) => {
        if (x < 0 || x >= S || y < 0 || y >= S) return;
        buf[y * S + x] = c;
    };
    for (let y = 0; y < S; y++) {
        for (let x = 0; x < S; x++) {
            const seed = (x * 13 + y * 7 + x * y * 3) % 17;
            const t = grassTones[seed % grassTones.length];
            let c = t.base;
            if (seed < 3) c = t.hi;
            else if (seed > 14) c = t.sh;
            set(x, y, c);
        }
    }
    const bladePositions = [5, 12, 19, 27, 34, 41, 49, 56, 8, 22, 38, 52];
    bladePositions.forEach(bx => {
        const height = 3 + ((bx * 7) % 4);
        const by = S - height - ((bx * 3) % 6);
        for (let i = 0; i < height; i++) {
            set(bx, by + i, '#22c55e');
            if (i === 0) set(bx - 1, by + 1, '#16a34a');
        }
    });
    [[10, 10], [30, 45], [55, 20], [20, 55], [48, 35]].forEach(([fx, fy]) => {
        set(fx, fy, '#fbbf24');
        set(fx + 1, fy, '#fbbf24');
    });
    return buf;
}

function generateDungeonFloorTile() {
    const S = 64;
    const buf = new Array(S * S).fill('#0a0a14');
    const set = (x, y, c) => {
        if (x < 0 || x >= S || y < 0 || y >= S) return;
        buf[y * S + x] = c;
    };
    const stoneTones = [
        { base: '#1a1a2e', hi: '#252540', sh: '#0a0a14' },
        { base: '#16162a', hi: '#202038', sh: '#080810' },
    ];
    const ROW_H = 16;
    const COL_W = 32;
    for (let row = 0; row < 4; row++) {
        const offset = (row % 2) * 16;
        for (let col = -1; col < 4; col++) {
            const x = col * COL_W + offset;
            const y = row * ROW_H;
            const t = stoneTones[(row + col + 4) % stoneTones.length];
            for (let dy = 1; dy < ROW_H - 1; dy++) {
                for (let dx = 1; dx < COL_W - 1; dx++) {
                    let c = t.base;
                    if (dy === 1 || dx === 1) c = t.hi;
                    else if (dy >= ROW_H - 2 || dx >= COL_W - 2) c = t.sh;
                    set(x + dx, y + dy, c);
                }
            }
        }
    }
    [[20, 8, 8], [44, 28, 6], [10, 44, 5], [50, 50, 7]].forEach(([cx, cy, len]) => {
        for (let i = 0; i < len; i++) {
            set(cx + i, cy + (i % 3 === 0 ? 1 : 0), '#0a0a14');
        }
    });
    [[15, 32], [48, 16], [32, 48]].forEach(([mx, my]) => {
        set(mx, my, '#12122a');
        set(mx + 1, my, '#12122a');
        set(mx, my + 1, '#12122a');
    });
    return buf;
}

function generateWoodFloorTile() {
    const S = 64;
    const buf = new Array(S * S).fill('#3d261b');
    const set = (x, y, c) => {
        if (x < 0 || x >= S || y < 0 || y >= S) return;
        buf[y * S + x] = c;
    };
    const PLANK_H = 8;
    const woodTones = [
        { base: '#4a3225', hi: '#5c3e2e', sh: '#3d261b', grain: '#3a2218' },
        { base: '#3d261b', hi: '#4a3225', sh: '#2e1a10', grain: '#2a1610' },
        { base: '#4f3628', hi: '#614030', sh: '#3d261b', grain: '#3a2218' },
        { base: '#422b1c', hi: '#52351f', sh: '#33200f', grain: '#2a1610' },
    ];
    for (let row = 0; row < 8; row++) {
        const t = woodTones[row % woodTones.length];
        for (let dy = 0; dy < PLANK_H; dy++) {
            for (let x = 0; x < S; x++) {
                const y = row * PLANK_H + dy;
                let c = t.base;
                if (dy === 0) c = t.hi;
                if (dy === PLANK_H - 1) c = t.sh;
                const veta = (x * 3 + row * 7) % 19;
                if (veta === 0 || veta === 1) c = t.grain;
                set(x, y, c);
            }
        }
    }
    return buf;
}

// -----------------------------------------------------------------------------
//  Registry
//  Paste your JSON exports below.  e.g.
//      barrel: [ "transparent", "transparent", ..., "#7c4a2b", ... ],
// -----------------------------------------------------------------------------

export const SPRITES = {
    cobblestone_tile: generateCobblestoneTile(),
    stone_floor_tile: generateStoneFloorTile(),
    grass_tile: generateGrassTile(),
    dungeon_floor_tile: generateDungeonFloorTile(),
    wood_floor_tile: generateWoodFloorTile(),
};
