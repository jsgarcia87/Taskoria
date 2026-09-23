import React, { useMemo, useRef, useEffect, useState } from 'react';
import { DecorationsLayer, PortalsLayer } from './PlayableWorld';
import { expandPrefabs } from './prefabs';
import { SPRITES, pixelBufferToDataUrl } from './sprites';
import { WorldSprite, WORLD_PROPS } from './worldProps';

// Pure visual renderer for a map. Renders exactly what PlayableWorld renders,
// minus the interactive parts (player, NPCs, input, camera-follow).
// This is the same pipeline production uses — so what you see here IS what
// players see. Used by the Map Editor for WYSIWYG editing.
//
// Props:
//   map        — a Taskoria map object (raw, with prefabs / decorations / etc.).
//                Prefabs are expanded internally to match production.
//   fit        — 'width' | 'height' | 'contain' | 'none' (default: 'contain').
//                Scales the whole map to fit the containing element.
//   zoom       — extra zoom multiplier on top of the fit scale (default: 1).
//   showGrid   — draws a faint grid overlay for editing (default: false).
//   gridSize   — grid cell size in map-pixels (default: map.tileSize || 64).
//   showObstacles — draws obstacle rectangles as red overlays (default: false).
//   showPortals — renders the portal frames (default: true).
//   children   — rendered on top of everything, positioned in map coordinates
//                (i.e. inside the map coordinate system). Use for edit overlays
//                like selection handles, cursor preview, etc.
//   onCanvasClick — (mapX, mapY, event) => void. Fires when the map area is
//                   clicked. Coordinates are already in map space.
//   onCanvasMouseMove — same signature, fires on mouse move over the canvas.
export default function WorldCanvas({
    map,
    fit = 'contain',
    zoom = 1,
    showGrid = false,
    gridSize = null,
    showObstacles = false,
    showPortals = true,
    className = '',
    children,
    onCanvasClick,
    onCanvasMouseMove,
    onScaleChange,
    pan = { x: 0, y: 0 },
    onWheel,
    onMouseDown,
    onMouseUp,
    onMouseLeave,
}) {
    const wrapRef = useRef(null);
    const [containerSize, setContainerSize] = useState({ w: 0, h: 0 });

    // Observe the wrapper size so we can fit-scale the map to it.
    useEffect(() => {
        if (!wrapRef.current) return;
        const el = wrapRef.current;
        const ro = new ResizeObserver(entries => {
            const rect = entries[0].contentRect;
            setContainerSize({ w: rect.width, h: rect.height });
        });
        ro.observe(el);
        setContainerSize({ w: el.clientWidth, h: el.clientHeight });
        return () => ro.disconnect();
    }, []);

    // Expand prefabs so what we see matches what PlayableWorld renders.
    const expandedMap = useMemo(() => {
        if (!map) return null;
        if (!map.prefabs || map.prefabs.length === 0) return map;
        const expanded = expandPrefabs(map.prefabs);
        return {
            ...map,
            decorations: [...(map.decorations || []), ...expanded.decorations],
            obstacles: [...(map.obstacles || []), ...expanded.obstacles],
        };
    }, [map]);

    // Same tile-background computation as PlayableWorld.
    const tileBackground = useMemo(() => {
        if (!expandedMap?.tileSprite) return null;
        const buffer = SPRITES[expandedMap.tileSprite];
        if (!buffer) return null;
        const tilePx = expandedMap.tileSize || 64;
        return {
            backgroundColor: expandedMap.baseColor || '#000',
            backgroundImage: `url("${pixelBufferToDataUrl(buffer, 64)}")`,
            backgroundSize: `${tilePx}px ${tilePx}px`,
            backgroundRepeat: 'repeat',
            imageRendering: 'pixelated'
        };
    }, [expandedMap?.tileSprite, expandedMap?.tileSize, expandedMap?.baseColor]);

    // Compute the fit scale. The map's internal coordinate space is always
    // its own width x height in pixels; we scale the whole thing to fit.
    const fitScale = useMemo(() => {
        if (!expandedMap || !containerSize.w || !containerSize.h) return 1;
        const mw = expandedMap.width || 1600;
        const mh = expandedMap.height || 1000;
        const sx = containerSize.w / mw;
        const sy = containerSize.h / mh;
        if (fit === 'width') return sx;
        if (fit === 'height') return sy;
        if (fit === 'contain') return Math.min(sx, sy);
        return 1;
    }, [expandedMap, containerSize, fit]);

    const totalScale = fitScale * zoom;

    // Notify parent of scale changes so it can position overlay elements.
    useEffect(() => {
        if (onScaleChange) onScaleChange(totalScale);
    }, [totalScale, onScaleChange]);

    const mapW = expandedMap?.width || 1600;
    const mapH = expandedMap?.height || 1000;

    // Center the scaled map inside the container by absolute positioning —
    // simpler and more accurate than translate(-50%) tricks when the map is
    // wider or taller than the container.
    const offsetX = ((containerSize.w - mapW * totalScale) / 2) + pan.x;
    const offsetY = ((containerSize.h - mapH * totalScale) / 2) + pan.y;

    // DOM click → map coords: subtract centering offset then invert scale.
    const toMapCoords = (clientX, clientY) => {
        const rect = wrapRef.current.getBoundingClientRect();
        const cx = clientX - rect.left;
        const cy = clientY - rect.top;
        return {
            x: (cx - offsetX) / totalScale,
            y: (cy - offsetY) / totalScale,
        };
    };

    const handleClick = (e) => {
        if (!onCanvasClick || !wrapRef.current) return;
        const { x, y } = toMapCoords(e.clientX, e.clientY);
        onCanvasClick(x, y, e);
    };

    const handleMouseMove = (e) => {
        if (!onCanvasMouseMove || !wrapRef.current) return;
        const { x, y } = toMapCoords(e.clientX, e.clientY);
        onCanvasMouseMove(x, y, e);
    };

    if (!expandedMap) return <div ref={wrapRef} className={className} />;

    const effectiveGridSize = gridSize || expandedMap.tileSize || 64;

    return (
        <div
            ref={wrapRef}
            className={className}
            onClick={handleClick}
            onMouseMove={handleMouseMove}
            onWheel={onWheel}
            onMouseDown={onMouseDown}
            onMouseUp={onMouseUp}
            onMouseLeave={onMouseLeave}
            style={{
                backgroundColor: expandedMap.baseColor || '#0c0a14',
                overflow: 'hidden',
            }}
        >
            {/* Scaled map container — same structure as PlayableWorld's mapDOMRef div. */}
            <div
                className={`will-change-transform ${tileBackground ? '' : (expandedMap.className || '')}`}
                style={{
                    width: mapW,
                    height: mapH,
                    position: 'absolute',
                    left: offsetX,
                    top: offsetY,
                    transformOrigin: 'top left',
                    transform: `scale(${totalScale})`,
                    ...(expandedMap.background || {}),
                    ...(tileBackground || {}),
                }}
            >
                {/* Ambient wash — mirror of PlayableWorld's medieval-town-bg treatment. */}
                {expandedMap.className === 'medieval-town-bg' && (
                    <>
                        <div
                            className="absolute inset-0 pointer-events-none"
                            style={{
                                background: 'radial-gradient(ellipse at 50% 40%, rgba(255,180,90,0.10) 0%, transparent 55%)',
                                mixBlendMode: 'screen',
                                zIndex: 0,
                            }}
                        />
                        <div
                            className="absolute inset-0 pointer-events-none"
                            style={{
                                background: 'radial-gradient(ellipse at center, transparent 45%, rgba(0,0,0,0.55) 100%)',
                                zIndex: 0,
                            }}
                        />
                    </>
                )}

                {/* Portals — kept behind decorations, same as production. */}
                {showPortals && <PortalsLayer portals={expandedMap.portals} />}

                {/* Decorations — same component production uses. */}
                <DecorationsLayer decorations={expandedMap.decorations} />

                {/* Custom instances — same rendering as PlayableWorld. */}
                {expandedMap.instances && expandedMap.instances.map((inst, i) => {
                    const isHouse = inst.type?.startsWith('lib_') && !inst.type?.startsWith('lib_pixel_');
                    const spriteName = (isHouse && WORLD_PROPS[inst.type]) ? inst.type : isHouse ? 'shop_building' : inst.type;

                    let drawX = inst.x;
                    let drawY = inst.y;

                    const prop = WORLD_PROPS[spriteName];
                    if (prop) {
                        const w = prop.w * (inst.scale || 1);
                        const h = prop.h * (inst.scale || 1);
                        drawX += w / 2;
                        drawY += h;
                    } else if (isHouse) {
                        drawX += 140;
                        drawY += 150;
                    }

                    return (
                        <WorldSprite
                            key={`inst_${i}`}
                            name={spriteName}
                            x={drawX}
                            y={drawY}
                            scale={inst.scale || 1}
                        />
                    );
                })}

                {/* Obstacles overlay — off by default; on for editing sanity checks. */}
                {showObstacles && expandedMap.obstacles?.map((ob, i) => (
                    <div
                        key={`ob_${i}`}
                        className="absolute pointer-events-none"
                        style={{
                            left: ob.x,
                            top: ob.y,
                            width: ob.width,
                            height: ob.height,
                            border: '1px dashed rgba(239,68,68,0.7)',
                            background: 'rgba(239,68,68,0.08)',
                            zIndex: 99998,
                        }}
                    />
                ))}

                {/* Editing grid — off by default; on when the editor turns it on. */}
                {showGrid && (
                    <svg
                        className="absolute inset-0 pointer-events-none"
                        width={mapW}
                        height={mapH}
                        style={{ zIndex: 99999 }}
                    >
                        <defs>
                            <pattern
                                id={`world-canvas-grid-${effectiveGridSize}`}
                                width={effectiveGridSize}
                                height={effectiveGridSize}
                                patternUnits="userSpaceOnUse"
                            >
                                <path
                                    d={`M ${effectiveGridSize} 0 L 0 0 0 ${effectiveGridSize}`}
                                    fill="none"
                                    stroke="rgba(255,255,255,0.08)"
                                    strokeWidth="1"
                                />
                            </pattern>
                        </defs>
                        <rect width="100%" height="100%" fill={`url(#world-canvas-grid-${effectiveGridSize})`} />
                    </svg>
                )}

                {/* Edit overlays supplied by the editor — rendered in map coords. */}
                {children}
            </div>
        </div>
    );
}
