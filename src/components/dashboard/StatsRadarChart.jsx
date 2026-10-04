import React, { useState, useEffect } from 'react';

const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);

const StatsRadarChart = ({ stats, accentColor }) => {
    const [progress, setProgress] = useState(0);
    const accent = accentColor || '#60a5fa';

    useEffect(() => {
        let start = null;
        let raf;
        const duration = 900;

        const step = (ts) => {
            if (!start) start = ts;
            const t = Math.min((ts - start) / duration, 1);
            setProgress(easeOutCubic(t));
            if (t < 1) raf = requestAnimationFrame(step);
        };

        raf = requestAnimationFrame(step);
        return () => cancelAnimationFrame(raf);
    }, []);

    // Scale to the hero's own range so the shape reads; outer ring = top stat + 25%, rounded to 5.
    const highest = Math.max(...['str', 'int', 'dex', 'con', 'cha', 'will'].map(k => stats?.[k] || 0), 1);
    const scaleMax = Math.max(20, Math.ceil((highest * 1.25) / 5) * 5);
    const normalize = (val) => Math.min((val || 0) / scaleMax, 1);

    const strRatio = normalize(stats?.str) * progress;
    const intRatio = normalize(stats?.int) * progress;
    const dexRatio = normalize(stats?.dex) * progress;
    const conRatio = normalize(stats?.con) * progress;
    const chaRatio = normalize(stats?.cha) * progress;
    const willRatio = normalize(stats?.will) * progress;

    const cx = 50;
    const cy = 50;
    const maxR = 34;
    const d2r = Math.PI / 180;

    const getPointX = (angle, ratio) => cx + maxR * Math.cos(angle * d2r) * ratio;
    const getPointY = (angle, ratio) => cy + maxR * Math.sin(angle * d2r) * ratio;

    const points = [
        { name: 'STR', value: stats?.str || 0, angle: -90, ratio: strRatio, color: '#ef4444' },
        { name: 'DEX', value: stats?.dex || 0, angle: -30, ratio: dexRatio, color: '#22c55e' },
        { name: 'CON', value: stats?.con || 0, angle: 30, ratio: conRatio, color: '#f97316' },
        { name: 'INT', value: stats?.int || 0, angle: 90, ratio: intRatio, color: '#3b82f6' },
        { name: 'WILL', value: stats?.will || 0, angle: 150, ratio: willRatio, color: '#a855f7' },
        { name: 'CHA', value: stats?.cha || 0, angle: 210, ratio: chaRatio, color: '#eab308' },
    ];

    const staticPoints = [
        { angle: -90 }, { angle: -30 }, { angle: 30 },
        { angle: 90 }, { angle: 150 }, { angle: 210 },
    ];

    const getHexagonPoints = (ratio) => {
        return staticPoints.map(p => `${getPointX(p.angle, ratio)},${getPointY(p.angle, ratio)}`).join(' ');
    };

    const outerPoints = getHexagonPoints(1);
    const midPoints = getHexagonPoints(0.66);
    const innerPoints = getHexagonPoints(0.33);

    const valuePoints = points.map(p => `${getPointX(p.angle, p.ratio)},${getPointY(p.angle, p.ratio)}`).join(' ');

    const dotOpacity = Math.max(0, (progress - 0.3) / 0.7);

    return (
        <div className="flex flex-col items-center justify-center p-3 rounded-xl bg-black/20 border border-white/5">
            <div className="w-full max-w-[240px] aspect-square flex items-center justify-center">
                <svg viewBox="0 0 100 100" className="w-full h-full">
                    <defs>
                        <linearGradient id="chartGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                            <stop offset="0%" stopColor={accent} stopOpacity="0.5" />
                            <stop offset="100%" stopColor={accent} stopOpacity="0.12" />
                        </linearGradient>
                    </defs>

                    <polygon points={outerPoints} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="0.4" />
                    <polygon points={midPoints} fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="0.4" strokeDasharray="1,1" />
                    <polygon points={innerPoints} fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="0.4" strokeDasharray="1,1" />

                    {staticPoints.map((p, i) => (
                        <line key={`axis-${i}`} x1={cx} y1={cy} x2={getPointX(p.angle, 1)} y2={getPointY(p.angle, 1)} stroke="rgba(255,255,255,0.06)" strokeWidth="0.4" />
                    ))}

                    {progress > 0 && (
                        <polygon
                            points={valuePoints}
                            fill="url(#chartGradient)"
                            stroke={accent}
                            strokeWidth="0.8"
                            strokeLinejoin="round"
                            strokeOpacity="0.7"
                        />
                    )}

                    {points.map((p, i) => (
                        <circle key={`pt-${i}`} cx={getPointX(p.angle, p.ratio)} cy={getPointY(p.angle, p.ratio)} r="1.8" fill={p.color} stroke="#fff" strokeWidth="0.4" opacity={dotOpacity} />
                    ))}

                    {staticPoints.map((p, i) => {
                        const labelDist = 1.22;
                        const lx = getPointX(p.angle, labelDist);
                        const ly = getPointY(p.angle, labelDist) + 1;
                        return (
                            <g key={`lbl-${i}`}>
                                <text x={lx} y={ly} fill={points[i].color} fontSize="4" fontWeight="bold" textAnchor="middle" className="uppercase">
                                    {points[i].name}
                                </text>
                            </g>
                        );
                    })}
                </svg>
            </div>
        </div>
    );
};

export default StatsRadarChart;
