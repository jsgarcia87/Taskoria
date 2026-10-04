import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useGame } from '../../../context/GameContext';
import { WorldSprite, WORLD_PROPS } from './worldProps';
import PixelIcon from '../../common/PixelIcon';

const BUILDING_TEMPLATES = [
    { id: 'shop_building', name: 'Cottage', cost: 100, desc: 'A cozy thatched cottage' },
    { id: 'house_wood', name: 'Wooden House', cost: 200, desc: 'A sturdy wooden dwelling' },
    { id: 'tavern', name: 'Tavern', cost: 350, desc: 'A welcoming tavern' },
    { id: 'smithy', name: 'Smithy', cost: 400, desc: 'A working forge' },
];

// Only offer buildings the world can actually draw — never charge for an invisible one.
const AVAILABLE_TEMPLATES = BUILDING_TEMPLATES.filter(t => WORLD_PROPS[t.id]);

const resolveBuildingSprite = (buildingId) => {
    if (WORLD_PROPS[buildingId]) return buildingId;
    if (import.meta.env.DEV) console.warn(`[PlotSystem] no sprite for building "${buildingId}", drawing the cottage instead`);
    return 'shop_building';
};

// Where a building sits on its plot — shared by the renderer and the collision layer.
const buildingPlacement = (plot) => {
    const scale = Math.min(plot.w / 80, 2.5);
    return { x: plot.x + plot.w / 2, y: plot.y + plot.h - 10, scale, w: 80 * scale, h: 60 * scale };
};

// Solid ground floor (facade + foundation); the roof stays walk-behind.
export const buildingFootprint = (plot) => {
    const b = buildingPlacement(plot);
    const wallH = (28 / 60) * b.h;
    return { x: b.x - b.w / 2 + 4, y: b.y - wallH, width: b.w - 8, height: wallH - 4, type: 'building' };
};

const BuildingPreview = ({ id, size = 56 }) => {
    const ref = useRef(null);
    useEffect(() => {
        const prop = WORLD_PROPS[id];
        const c = ref.current;
        if (!prop || !c) return;
        c.width = prop.w;
        c.height = prop.h;
        const ctx = c.getContext('2d');
        ctx.clearRect(0, 0, prop.w, prop.h);
        prop.buffer.forEach((color, i) => {
            if (!color || color === 'transparent') return;
            ctx.fillStyle = color;
            ctx.fillRect(i % prop.w, Math.floor(i / prop.w), 1, 1);
        });
    }, [id]);
    return <canvas ref={ref} style={{ width: size, height: size * 0.75, imageRendering: 'pixelated' }} aria-hidden="true" />;
};

const PlotOverlay = ({ plot, ownedData, onBuy, onBuild }) => {
    const [hovered, setHovered] = useState(false);
    const owned = !!ownedData;
    const hasBuilding = owned && ownedData.buildingId;

    return (
        <div
            className="absolute cursor-pointer transition-all duration-200"
            style={{
                left: plot.x,
                top: plot.y,
                width: plot.w,
                height: plot.h,
                zIndex: plot.y + 1,
                border: hasBuilding
                    ? '2px solid rgba(74, 222, 128, 0.3)'
                    : owned
                        ? '2px solid rgba(74, 222, 128, 0.6)'
                        : hovered
                            ? '2px solid rgba(250, 204, 21, 0.8)'
                            : '2px dashed rgba(250, 204, 21, 0.3)',
                background: hasBuilding
                    ? 'transparent'
                    : owned
                        ? 'rgba(74, 222, 128, 0.08)'
                        : hovered
                            ? 'rgba(250, 204, 21, 0.12)'
                            : 'rgba(250, 204, 21, 0.04)',
                borderRadius: 4,
            }}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            onClick={(e) => {
                e.stopPropagation();
                if (!owned) onBuy(plot);
                else if (!hasBuilding) onBuild(plot);
            }}
        >
            {/* Corner post markers */}
            {!hasBuilding && [
                { left: -3, top: -3 },
                { right: -3, top: -3 },
                { left: -3, bottom: -3 },
                { right: -3, bottom: -3 },
            ].map((pos, i) => (
                <div
                    key={i}
                    className="absolute"
                    style={{
                        ...pos,
                        width: 6, height: 6,
                        background: owned ? '#4ade80' : '#fbbf24',
                        borderRadius: 1,
                        imageRendering: 'pixelated',
                    }}
                />
            ))}

            {/* Label */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                {hasBuilding ? (
                    hovered && (
                        <span className="px-2 py-0.5 bg-black/70 rounded text-green-300 text-[10px] font-bold">
                            {ownedData.buildingName || 'Your Building'}
                        </span>
                    )
                ) : owned ? (
                    <>
                        <span className="text-green-400 text-xs font-bold uppercase tracking-wider opacity-70">
                            Your Plot
                        </span>
                        {hovered && (
                            <span className="mt-1 px-2 py-0.5 bg-black/70 rounded text-green-300 text-[10px] font-bold">
                                Click to build
                            </span>
                        )}
                    </>
                ) : (
                    <>
                        <span className="text-amber-200/60 text-[10px] font-bold uppercase tracking-wider">
                            Available
                        </span>
                        {hovered && (
                            <span className="mt-1 px-2 py-0.5 bg-black/70 rounded text-amber-200 text-xs font-bold">
                                {plot.price} gold
                            </span>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};

const PlotSystem = ({ plots }) => {
    const { state, dispatch } = useGame();
    const [confirmPlot, setConfirmPlot] = useState(null);
    const [buildPlot, setBuildPlot] = useState(null);

    if (!plots || plots.length === 0) return null;

    const ownedPlots = state.character?.ownedPlots || [];
    const gold = state.character?.gold || 0;

    const getOwnedData = (plotId) => ownedPlots.find(p => p.plotId === plotId) || null;

    const handleBuy = (plot) => {
        setConfirmPlot(plot);
    };

    const handleBuild = (plot) => {
        setBuildPlot(plot);
    };

    const confirmPurchase = () => {
        if (!confirmPlot) return;
        dispatch({
            type: 'BUY_PLOT',
            payload: {
                plotId: confirmPlot.id,
                cost: confirmPlot.price,
                mapId: 'freeDistrict',
            }
        });
        setConfirmPlot(null);
    };

    const confirmBuild = (template) => {
        if (!buildPlot || gold < template.cost) return;
        dispatch({
            type: 'BUILD_ON_PLOT',
            payload: {
                plotId: buildPlot.id,
                buildingId: template.id,
                buildingName: template.name,
                cost: template.cost,
            }
        });
        setBuildPlot(null);
    };

    return (
        <>
            {/* Building sprites for owned+built plots */}
            {plots.map(plot => {
                const data = getOwnedData(plot.id);
                if (!data?.buildingId) return null;
                const b = buildingPlacement(plot);
                return (
                    <WorldSprite
                        key={`bld_${plot.id}`}
                        name={resolveBuildingSprite(data.buildingId)}
                        x={b.x}
                        y={b.y}
                        scale={b.scale}
                    />
                );
            })}

            {plots.map(plot => (
                <PlotOverlay
                    key={plot.id}
                    plot={plot}
                    ownedData={getOwnedData(plot.id)}
                    onBuy={handleBuy}
                    onBuild={handleBuild}
                />
            ))}

            {/* Dialogs render at the page root: the map layer is transformed, which would
                trap `position: fixed` inside the moving camera. */}
            {/* Buy Plot Dialog */}
            {confirmPlot && createPortal(
                <div
                    className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60"
                    onClick={() => setConfirmPlot(null)}
                >
                    <div
                        className="bg-[#1a1025] border border-rpg-gold/30 rounded-xl p-6 max-w-sm w-full mx-4 shadow-2xl"
                        onClick={e => e.stopPropagation()}
                    >
                        <h3 className="text-rpg-gold font-bold text-lg mb-2">Buy Plot?</h3>
                        <p className="text-gray-300 text-sm mb-4">
                            Purchase this plot in the Free District for{' '}
                            <span className="text-rpg-gold font-bold">{confirmPlot.price} gold</span>?
                        </p>
                        <div className="flex items-center justify-between text-sm mb-4">
                            <span className="text-gray-400">Your gold:</span>
                            <span className={gold >= confirmPlot.price ? 'text-green-400 font-bold' : 'text-red-400 font-bold'}>
                                {gold}
                            </span>
                        </div>
                        {gold < confirmPlot.price ? (
                            <p className="text-red-400 text-xs mb-4">Not enough gold!</p>
                        ) : null}
                        <div className="flex gap-3">
                            <button
                                onClick={() => setConfirmPlot(null)}
                                className="flex-1 py-2 px-4 rounded-lg border border-gray-600 text-gray-300 text-sm font-bold hover:bg-gray-800 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={confirmPurchase}
                                disabled={gold < confirmPlot.price}
                                className="flex-1 py-2 px-4 rounded-lg bg-rpg-gold text-rpg-bg text-sm font-bold hover:bg-yellow-300 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                            >
                                Buy
                            </button>
                        </div>
                    </div>
                </div>,
                document.body
            )}

            {/* Build on Plot Dialog */}
            {buildPlot && createPortal(
                <div
                    className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60"
                    onClick={() => setBuildPlot(null)}
                >
                    <div
                        className="bg-[#1a1025] border border-green-500/30 rounded-xl p-6 max-w-md w-full mx-4 shadow-2xl"
                        onClick={e => e.stopPropagation()}
                    >
                        <h3 className="text-green-400 font-bold text-lg mb-1">Build on Your Plot</h3>
                        <p className="text-gray-400 text-xs mb-4">Choose a building to construct:</p>
                        <div className="space-y-2 max-h-60 overflow-y-auto">
                            {AVAILABLE_TEMPLATES.map(t => (
                                <button
                                    key={t.id}
                                    onClick={() => confirmBuild(t)}
                                    disabled={gold < t.cost}
                                    className="w-full flex items-center gap-3 p-3 rounded-lg border border-gray-700 hover:border-green-500/50 hover:bg-green-900/10 transition-colors text-left disabled:opacity-40 disabled:cursor-not-allowed"
                                >
                                    <div className="w-16 h-12 rounded-md bg-black/30 flex items-center justify-center shrink-0">
                                        <BuildingPreview id={t.id} size={56} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="text-white text-sm font-bold">{t.name}</div>
                                        <div className="text-gray-400 text-xs">{t.desc}</div>
                                    </div>
                                    <div className="text-rpg-gold text-sm font-bold whitespace-nowrap flex items-center gap-1">
                                        <PixelIcon name="coins" size={12} color="#fbbf24" /> {t.cost}
                                    </div>
                                </button>
                            ))}
                        </div>
                        <div className="flex items-center justify-between text-xs mt-4 pt-3 border-t border-gray-700/50">
                            <span className="text-gray-400">Your gold:</span>
                            <span className="text-rpg-gold font-bold">{gold}</span>
                        </div>
                        <button
                            onClick={() => setBuildPlot(null)}
                            className="mt-3 w-full py-2 rounded-lg border border-gray-600 text-gray-300 text-sm font-bold hover:bg-gray-800 transition-colors"
                        >
                            Cancel
                        </button>
                    </div>
                </div>,
                document.body
            )}
        </>
    );
};

export default PlotSystem;
