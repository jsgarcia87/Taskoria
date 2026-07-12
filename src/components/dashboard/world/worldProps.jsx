// =============================================================================
//  WORLD PROPS — React rendering layer for sprite-registry buffers
// =============================================================================
//  Generators and palette live in src/data/sprite-registry.js (shared with
//  map_editor.html). This file re-exports the registry as WORLD_PROPS and
//  provides the WorldSprite React component for the game renderer.
// =============================================================================

import React from 'react';
import { SPRITE_REGISTRY, PAL } from '../../../data/sprite-registry.js';

export { PAL };
export const WORLD_PROPS = SPRITE_REGISTRY;

// -----------------------------------------------------------------------------
//  WorldSprite — renders a registry prop as inline SVG (crisp at any scale)
// -----------------------------------------------------------------------------

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
