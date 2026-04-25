import React from 'react';

const StatsRadarChart = ({ stats }) => {
    // Normalize stats to a 0-1 scale
    const MAX_VISUAL_STAT = 50;

    // clamp between 0.1 (min size) and 1 (max size)
    const normalize = (val) => Math.min(Math.max((val || 0) / MAX_VISUAL_STAT, 0.15), 1);

    const strRatio = normalize(stats?.str);
    const intRatio = normalize(stats?.int);
    const dexRatio = normalize(stats?.dex);
    const conRatio = normalize(stats?.con);
    const chaRatio = normalize(stats?.cha);
    const willRatio = normalize(stats?.will);

    // SVG Center and Radius constraints
    const cx = 50;
    const cy = 52;
    const maxR = 32;

    const d2r = Math.PI / 180;

    // Angles for 6 points: Top= -90, TopRight= -30, BotRight= 30, Bot= 90, BotLeft= 150, TopLeft= 210
    // STR (Top: -90), DEX (TopR: -30), CON (BotR: 30), INT (Bot: 90), WILL (BotL: 150), CHA (TopL: 210)

    const getPointX = (angle, ratio) => cx + maxR * Math.cos(angle * d2r) * ratio;
    const getPointY = (angle, ratio) => cy + maxR * Math.sin(angle * d2r) * ratio;

    const points = [
        { name: 'STR', angle: -90, ratio: strRatio, color: '#ef4444' }, // Red
        { name: 'DEX', angle: -30, ratio: dexRatio, color: '#22c55e' }, // Green
        { name: 'CON', angle: 30, ratio: conRatio, color: '#f97316' }, // Orange
        { name: 'INT', angle: 90, ratio: intRatio, color: '#3b82f6' },  // Blue
        { name: 'WILL', angle: 150, ratio: willRatio, color: '#a855f7' }, // Purple
        { name: 'CHA', angle: 210, ratio: chaRatio, color: '#eab308' },  // Yellow
    ];

    // Outer boundary points for rendering background grid
    const getHexagonPoints = (ratio) => {
        return points.map(p => `${getPointX(p.angle, ratio)},${getPointY(p.angle, ratio)}`).join(' ');
    };

    const outerPoints = getHexagonPoints(1);
    const midPoints = getHexagonPoints(0.66);
    const innerPoints = getHexagonPoints(0.33);

    const valuePoints = points.map(p => `${getPointX(p.angle, p.ratio)},${getPointY(p.angle, p.ratio)}`).join(' ');

    return (
        <div className="flex flex-col items-center justify-center p-4 glass-card relative overflow-hidden group">
            {/* Ambient Background Glow */}
            <div className="absolute inset-0 bg-blue-500/5 group-hover:bg-blue-500/10 transition-colors"></div>

            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 z-10 w-full text-center border-b border-white/10 pb-2">Hero Profile</h3>

            <div className="w-full h-44 relative z-10 flex items-center justify-center">
                <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-[0_0_15px_rgba(59,130,246,0.3)]">

                    {/* Background Gradients & Filters */}
                    <defs>
                        <linearGradient id="chartGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                            <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.8" />
                            <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0.4" />
                        </linearGradient>
                        <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                            <feGaussianBlur stdDeviation="2" result="blur" />
                            <feComposite in="SourceGraphic" in2="blur" operator="over" />
                        </filter>
                    </defs>

                    {/* Concentric Hexagons (Web) */}
                    <polygon points={outerPoints} fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="0.5" />
                    <polygon points={midPoints} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="0.5" strokeDasharray="1,1" />
                    <polygon points={innerPoints} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="0.5" strokeDasharray="1,1" />

                    {/* Axis Lines */}
                    {points.map((p, i) => (
                        <line key={`axis-${i}`} x1={cx} y1={cy} x2={getPointX(p.angle, 1)} y2={getPointY(p.angle, 1)} stroke="rgba(255,255,255,0.1)" strokeWidth="0.5" />
                    ))}

                    {/* Plotted Value Area */}
                    <polygon
                        points={valuePoints}
                        fill="url(#chartGradient)"
                        stroke="#60a5fa"
                        strokeWidth="1.5"
                        strokeLinejoin="round"
                        filter="url(#glow)"
                        className="transition-all duration-1000 ease-out"
                    />

                    {/* Datapoints */}
                    {points.map((p, i) => (
                        <circle key={`pt-${i}`} cx={getPointX(p.angle, p.ratio)} cy={getPointY(p.angle, p.ratio)} r="2" fill={p.color} stroke="#fff" strokeWidth="0.5" className="transition-all duration-1000 ease-out" />
                    ))}

                    {/* Labels */}
                    {points.map((p, i) => {
                        // Push labels slightly outwards from outer edge
                        const lx = getPointX(p.angle, 1.25);
                        const ly = getPointY(p.angle, 1.2) + 2; // +2 to center text vertically better
                        return (
                            <text key={`lbl-${i}`} x={lx} y={ly} fill={p.color} fontSize="5" fontWeight="bold" textAnchor="middle" className="uppercase drop-shadow-md">
                                {p.name}
                            </text>
                        );
                    })}
                </svg>
            </div>

            <p className="text-[9px] text-gray-500 uppercase tracking-wider mt-0 text-center font-bold">Attribute Distribution</p>
        </div>
    );
};

export default StatsRadarChart;
