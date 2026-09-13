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
import { FLOOR_TILES } from '../../../data/sprite-registry.js';

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
//  Floor tile registry — canonical source is sprite-registry.js
// -----------------------------------------------------------------------------

export const SPRITES = FLOOR_TILES;
