import React, { useState } from 'react';
import { useGame } from '../../../context/GameContext';
import { WorldSprite, WORLD_PROPS } from './worldProps';

const BUILDING_TEMPLATES = [
    { id: 'shop_building', name: 'Cottage', cost: 100, desc: 'A cozy thatched cottage' },
    { id: 'house_wood', name: 'Wooden House', cost: 200, desc: 'A sturdy wooden dwelling' },
    { id: 'tavern', name: 'Tavern', cost: 350, desc: 'A welcoming tavern' },
    { id: 'smithy', name: 'Smithy', cost: 400, desc: 'A working forge' },
];

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
                if (!data?.buildingId || !WORLD_PROPS[data.buildingId]) return null;
                return (
                    <WorldSprite
                        key={`bld_${plot.id}`}
                        name={data.buildingId}
                        x={plot.x + plot.w / 2}
                        y={plot.y + plot.h - 10}
                        scale={Math.min(plot.w / 80, 2.5)}
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

            {/* Buy Plot Dialog */}
            {confirmPlot && (
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
                </div>
            )}

            {/* Build on Plot Dialog */}
            {buildPlot && (
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
                            {BUILDING_TEMPLATES.map(t => (
                                <button
                                    key={t.id}
                                    onClick={() => confirmBuild(t)}
                                    disabled={gold < t.cost}
                                    className="w-full flex items-center gap-3 p-3 rounded-lg border border-gray-700 hover:border-green-500/50 hover:bg-green-900/10 transition-colors text-left disabled:opacity-40 disabled:cursor-not-allowed"
                                >
                                    <div className="w-10 h-10 rounded bg-gray-800 flex items-center justify-center text-lg" style={{ imageRendering: 'pixelated' }}>
                                        🏠
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="text-white text-sm font-bold">{t.name}</div>
                                        <div className="text-gray-400 text-xs">{t.desc}</div>
                                    </div>
                                    <div className="text-rpg-gold text-sm font-bold whitespace-nowrap">
                                        {t.cost} 🪙
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
                </div>
            )}
        </>
    );
};

export default PlotSystem;
