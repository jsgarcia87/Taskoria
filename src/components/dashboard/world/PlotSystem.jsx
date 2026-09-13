import React, { useState } from 'react';
import { useGame } from '../../../context/GameContext';

const PlotOverlay = ({ plot, owned, onBuy }) => {
    const [hovered, setHovered] = useState(false);

    return (
        <div
            className="absolute cursor-pointer transition-all duration-200"
            style={{
                left: plot.x,
                top: plot.y,
                width: plot.w,
                height: plot.h,
                zIndex: plot.y + 1,
                border: owned
                    ? '2px solid rgba(74, 222, 128, 0.6)'
                    : hovered
                        ? '2px solid rgba(250, 204, 21, 0.8)'
                        : '2px dashed rgba(250, 204, 21, 0.3)',
                background: owned
                    ? 'rgba(74, 222, 128, 0.08)'
                    : hovered
                        ? 'rgba(250, 204, 21, 0.12)'
                        : 'rgba(250, 204, 21, 0.04)',
                borderRadius: 4,
            }}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            onClick={(e) => { e.stopPropagation(); if (!owned) onBuy(plot); }}
        >
            {/* Corner post markers */}
            {[
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
                {owned ? (
                    <span className="text-green-400 text-xs font-bold uppercase tracking-wider opacity-70">
                        Your Plot
                    </span>
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

    if (!plots || plots.length === 0) return null;

    const ownedPlots = state.character?.ownedPlots || [];
    const gold = state.character?.gold || 0;

    const handleBuy = (plot) => {
        setConfirmPlot(plot);
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

    return (
        <>
            {plots.map(plot => (
                <PlotOverlay
                    key={plot.id}
                    plot={plot}
                    owned={ownedPlots.some(p => p.plotId === plot.id)}
                    onBuy={handleBuy}
                />
            ))}

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
        </>
    );
};

export default PlotSystem;
