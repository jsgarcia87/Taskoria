import React, { useState, useEffect, useCallback } from 'react';

const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);

const StatsRadarChart = ({ stats }) => {
    const [progress, setProgress] = useState(0);

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

    const MAX_VISUAL_STAT = 50;
    const normalize = (val) => Math.min(Math.max((val || 0) / MAX_VISUAL_STAT, 0.15), 1);

    const strRatio = normalize(stats?.str) * progress;
    const intRatio = normalize(stats?.int) * progress;
    const dexRatio = normalize(stats?.dex) * progress;
    const conRatio = normalize(stats?.con) * progress;
    const chaRatio = normalize(stats?.cha) * progress;
    const willRatio = normalize(stats?.will) * progress;

    const cx = 50;
    const cy = 52;
    const maxR = 32;
    const d2r = Math.PI / 180;

    const getPointX = (angle, ratio) => cx + maxR * Math.cos(angle * d2r) * ratio;
    const getPointY = (angle, ratio) => cy + maxR * Math.sin(angle * d2r) * ratio;

    const points = [
        { name: 'STR', angle: -90, ratio: strRatio, color: '#ef4444' },
        { name: 'DEX', angle: -30, ratio: dexRatio, color: '#22c55e' },
        { name: 'CON', angle: 30, ratio: conRatio, color: '#f97316' },
        { name: 'INT', angle: 90, ratio: intRatio, color: '#3b82f6' },
        { name: 'WILL', angle: 150, ratio: willRatio, color: '#a855f7' },
        { name: 'CHA', angle: 210, ratio: chaRatio, color: '#eab308' },
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
        <div className="flex flex-col items-center justify-center p-4 rounded-xl bg-black/20 border border-white/5">
            <div className="w-full h-44 flex items-center justify-center">
                <svg viewBox="0 0 100 100" className="w-full h-full">

                    <defs>
                        <linearGradient id="chartGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                            <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.6" />
                            <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0.25" />
                        </linearGradient>
                    </defs>

                    <polygon points={outerPoints} fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="0.5" />
                    <polygon points={midPoints} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="0.5" strokeDasharray="1,1" />
                    <polygon points={innerPoints} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="0.5" strokeDasharray="1,1" />

                    {staticPoints.map((p, i) => (
                        <line key={`axis-${i}`} x1={cx} y1={cy} x2={getPointX(p.angle, 1)} y2={getPointY(p.angle, 1)} stroke="rgba(255,255,255,0.1)" strokeWidth="0.5" />
                    ))}

                    {progress > 0 && (
                        <polygon
                            points={valuePoints}
                            fill="url(#chartGradient)"
                            stroke="#60a5fa"
                            strokeWidth="1"
                            strokeLinejoin="round"
                        />
                    )}

                    {points.map((p, i) => (
                        <circle key={`pt-${i}`} cx={getPointX(p.angle, p.ratio)} cy={getPointY(p.angle, p.ratio)} r="2" fill={p.color} stroke="#fff" strokeWidth="0.5" opacity={dotOpacity} />
                    ))}

                    {staticPoints.map((p, i) => {
                        const lx = getPointX(p.angle, 1.25);
                        const ly = getPointY(p.angle, 1.2) + 2;
                        return (
                            <text key={`lbl-${i}`} x={lx} y={ly} fill={points[i].color} fontSize="5" fontWeight="bold" textAnchor="middle" className="uppercase">
                                {points[i].name}
                            </text>
                        );
                    })}
                </svg>
            </div>

            <p className="text-[8px] text-gray-600 uppercase tracking-widest mt-1 text-center">Attributes</p>
        </div>
    );
};

export default StatsRadarChart;
