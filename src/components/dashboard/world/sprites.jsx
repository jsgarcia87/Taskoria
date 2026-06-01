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

/**
 * React component to render a pixel buffer as an inline SVG sprite.
 * Crisp at any scale, no rasterization blur.
 */
export function PixelSprite({ buffer, size = SPRITE_GRID, scale = 1, style, className }) {
    if (!buffer) return null;
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
}

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
//  Registry
//  Paste your JSON exports below.  e.g.
//      barrel: [ "transparent", "transparent", ..., "#7c4a2b", ... ],
// -----------------------------------------------------------------------------

export const SPRITES = {
    cobblestone_tile: generateCobblestoneTile(),
    // grass_tile: [ ... ],
    // wood_floor_tile: [ ... ],
    // barrel: [ ... ],
    // lantern: [ ... ],
    // tree_oak: [ ... ],
};
