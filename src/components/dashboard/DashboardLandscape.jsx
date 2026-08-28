import React, { memo, useState, useEffect, useMemo } from 'react';

// =============================================================================
//  DashboardLandscape — silueta pixel-art procedural del Camp
//  Réplica del castillo + dragón + montañas, dibujada con rects sobre una
//  rejilla gruesa (chunky) usando la paleta del design system para que
//  recede al fondo sin sobreexponerse al contenido.
// =============================================================================

const SCENE_W = 480; // ancha (≈5:1) para llenar de borde a borde con `contain`
const SCENE_H = 96;

// Paleta derivada del bg #342C3E — pasos suaves para que la escena recede.
const C = {
    farRidge: '#4a4059',   // cordillera lejana (bruma, la más clara)
    midRidge: '#40374f',   // cordillera media
    plinth: '#382f44',     // roca base del castillo
    castle: '#574b68',     // muro iluminado
    castleDark: '#443a56', // cara en sombra / hueco
    battle: '#665a7a',     // remate / merlones
    roof: '#6a5580',       // tejados y agujas (tinte violeta)
    nearRidge: '#2c2436',  // loma delantera (la más oscura, ancla el suelo)
    window: '#fddf8c',     // brillo dorado de ventanas
    dragon: '#382f4c',     // silueta del dragón
};

// --- Cordillera escalonada (columnas gruesas) --------------------------------
function ridgeRects(step, seed, amp, base, color, key) {
    const r = [];
    for (let x = 0; x < SCENE_W; x += step) {
        const n = (Math.sin(x * 0.11 + seed) * 0.5
            + Math.sin(x * 0.05 + seed * 1.7) * 0.35
            + Math.sin(x * 0.23 + seed * 2.3) * 0.15 + 1) / 2;
        let h = base - n * amp;
        h = Math.round(h / 2) * 2; // cuantiza para look chunky
        r.push(<rect key={key + x} x={x} y={h} width={step + 0.6} height={SCENE_H - h} fill={color} />);
    }
    return r;
}

// --- Merlones (almenas) ------------------------------------------------------
function Merlons({ x0, x1, y, color, mw = 2, gap = 2, h = 3 }) {
    const r = [];
    for (let x = x0; x + mw <= x1; x += mw + gap) {
        r.push(<rect key={'m' + x} x={x} y={y - h} width={mw} height={h} fill={color} />);
    }
    return <>{r}</>;
}

// --- Aguja / tejado cónico (triángulo escalonado) ----------------------------
function Spire({ cx, baseY, apexY, halfW, color }) {
    const rows = baseY - apexY;
    const r = [];
    for (let i = 0; i < rows; i++) {
        const t = rows > 1 ? i / (rows - 1) : 0;
        const w = Math.max(1, Math.round(halfW * 2 * (1 - t)));
        r.push(<rect key={'s' + apexY + i} x={Math.round(cx - w / 2)} y={baseY - 1 - i} width={w} height={1} fill={color} />);
    }
    return <>{r}</>;
}

// --- Dragón (silueta chunky) -------------------------------------------------
function dragonRects(dx, dy, c) {
    const parts = [
        [dx - 2, dy - 1, 6, 4],           // cuerpo
        [dx + 4, dy - 2, 3, 2],           // cuello
        [dx + 7, dy - 3, 3, 3],           // cabeza
        [dx + 10, dy - 2, 2, 2],          // hocico
        [dx + 9, dy - 5, 1, 2],           // cuerno
        [dx - 6, dy + 1, 4, 2],           // cola 1
        [dx - 10, dy + 2, 4, 2],          // cola 2
        [dx - 13, dy + 4, 3, 2],          // cola 3
        [dx - 15, dy + 3, 2, 2],          // punta cola
        [dx - 1, dy - 6, 4, 2],           // ala sup A
        [dx + 1, dy - 8, 3, 2],           // ala sup B
        [dx - 3, dy - 4, 4, 2],           // ala sup C
        [dx - 2, dy + 3, 4, 2],           // ala inf A
        [dx - 5, dy + 5, 4, 2],           // ala inf B
        [dx + 1, dy + 4, 3, 2],           // ala inf C
        [dx, dy + 3, 2, 2],               // pata 1
        [dx + 3, dy + 3, 2, 2],           // pata 2
    ];
    return parts.map(([x, y, w, h], i) => <rect key={'d' + i} x={x} y={y} width={w} height={h} fill={c} />);
}

const starData = [
    [30, 14, 2], [70, 28, 1], [110, 9, 2], [150, 32, 1], [190, 16, 2], [230, 38, 1],
    [270, 11, 2], [310, 30, 1], [350, 20, 2], [390, 8, 1], [430, 40, 2], [460, 22, 1],
    [50, 44, 1], [130, 46, 1], [210, 6, 2], [290, 48, 1], [330, 44, 2], [410, 18, 1],
    [90, 40, 1], [170, 42, 1], [250, 20, 1], [370, 34, 1], [10, 26, 1], [450, 10, 2],
];

const cssText = `
@keyframes ls-twinkle { 0%,100%{opacity:0.5} 50%{opacity:0.1} }
@keyframes ls-float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-2px)} }
.ls-float{animation:ls-float 7s ease-in-out infinite}
`;

const DashboardLandscape = memo(function DashboardLandscape() {
    const [hour, setHour] = useState(() => new Date().getHours());

    useEffect(() => {
        const id = setInterval(() => {
            const h = new Date().getHours();
            setHour(prev => (prev !== h ? h : prev));
        }, 60000);
        return () => clearInterval(id);
    }, []);

    const time = useMemo(() => {
        const isDawn = hour >= 5 && hour < 11;
        const isDay = hour >= 11 && hour < 16;
        const isSunset = hour >= 16 && hour < 20;
        const isNight = !isDawn && !isDay && !isSunset;

        let sunX = null, sunY = null;
        if (!isNight) {
            const t = Math.max(0, Math.min(1, (hour - 5) / 15));
            sunX = 60 + t * 360;
            sunY = 14 + 46 * (2 * t - 1) * (2 * t - 1);
        }

        let hz, hzOp, sunFill;
        if (isDawn) { hz = '#c08050'; hzOp = 0.14; sunFill = '#ffc060'; }
        else if (isDay) { hz = '#6080c0'; hzOp = 0.09; sunFill = '#ffe070'; }
        else if (isSunset) { hz = '#c05030'; hzOp = 0.13; sunFill = '#ff7040'; }
        else { hz = '#4838a0'; hzOp = 0.11; sunFill = null; }

        // Ventanas encendidas salvo a plena luz del día.
        const windowOp = isDay ? 0.12 : (isNight ? 0.85 : 0.5);

        return { isNight, sunX, sunY, hz, hzOp, sunFill, windowOp };
    }, [hour]);

    const cx = 240; // castillo centrado en la escena ancha

    return (
        <div
            className="hidden md:block fixed bottom-0 left-0 right-0 pointer-events-none select-none"
            style={{ zIndex: 0 }}
            aria-hidden="true"
        >
            <style>{cssText}</style>

            <div className="relative w-full" style={{ height: '40vh', maxHeight: 400 }}>
                {/* Fundido superior: integra el borde con el fondo de la app */}
                <div
                    className="absolute top-0 left-0 w-full z-10"
                    style={{
                        height: '42%',
                        background: 'linear-gradient(to bottom, #342C3E 0%, rgba(52,44,62,0.55) 45%, transparent 100%)',
                    }}
                />
                <svg
                    viewBox={`0 0 ${SCENE_W} ${SCENE_H}`}
                    preserveAspectRatio="xMidYMax meet"
                    className="absolute bottom-0 left-0 w-full h-full"
                    style={{ imageRendering: 'pixelated', opacity: 0.6 }}
                    shapeRendering="crispEdges"
                >
                    <defs>
                        <linearGradient id="lsHz" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor={time.hz} stopOpacity="0" />
                            <stop offset="55%" stopColor={time.hz} stopOpacity={time.hzOp} />
                            <stop offset="100%" stopColor={time.hz} stopOpacity="0" />
                        </linearGradient>
                        <radialGradient id="lsSunG">
                            <stop offset="0%" stopColor={time.sunFill || '#fff'} stopOpacity="0.3" />
                            <stop offset="100%" stopColor={time.sunFill || '#fff'} stopOpacity="0" />
                        </radialGradient>
                    </defs>

                    {/* Resplandor de horizonte */}
                    <rect x="0" y="0" width={SCENE_W} height={SCENE_H} fill="url(#lsHz)" shapeRendering="auto" />

                    {/* Estrellas — solo de noche */}
                    {time.isNight && (
                        <g fill="#cbc2e8">
                            {starData.map(([x, y, s], i) => (
                                <rect
                                    key={i} x={x} y={y} width={s} height={s}
                                    style={{ animation: `ls-twinkle ${2.5 + (i % 3)}s ease-in-out infinite`, animationDelay: `${(i * 0.4) % 4}s` }}
                                />
                            ))}
                        </g>
                    )}

                    {/* Sol / Luna */}
                    {time.sunX != null ? (
                        <g className="ls-float">
                            <circle cx={time.sunX} cy={time.sunY} r={22} fill="url(#lsSunG)" shapeRendering="auto" />
                            <g fill={time.sunFill} opacity="0.5">
                                <rect x={time.sunX - 4} y={time.sunY - 3} width={8} height={6} />
                                <rect x={time.sunX - 3} y={time.sunY - 4} width={6} height={8} />
                            </g>
                        </g>
                    ) : (
                        <g className="ls-float">
                            <g fill="#d7cff0" opacity="0.55">
                                <rect x="88" y="16" width="7" height="7" />
                                <rect x="90" y="15" width="5" height="9" />
                                <rect x="89" y="17" width="7" height="5" />
                                {/* muesca creciente */}
                                <rect x="93" y="15" width="4" height="4" fill="#342C3E" />
                            </g>
                        </g>
                    )}

                    {/* Dragón — silueta lejana y sutil */}
                    <g opacity="0.6" className="ls-float">
                        {dragonRects(340, 28, C.dragon)}
                    </g>

                    {/* Cordillera lejana (bruma) */}
                    <g>{ridgeRects(6, 1.2, 20, 54, C.farRidge, 'far')}</g>

                    {/* Cordillera media */}
                    <g>{ridgeRects(5, 4.7, 15, 66, C.midRidge, 'mid')}</g>

                    {/* ── CASTILLO ─────────────────────────────────────────── */}
                    <g transform={`translate(${cx - 120}, 0)`}>
                        {/* Plinto de roca */}
                        <rect x="90" y="64" width="60" height={SCENE_H - 64} fill={C.plinth} />

                        {/* Torre izquierda */}
                        <rect x="98" y="42" width="10" height="24" fill={C.castle} />
                        <rect x="105" y="42" width="3" height="24" fill={C.castleDark} />
                        <Merlons x0={98} x1={108} y={42} color={C.battle} />
                        <Spire cx={103} baseY={42} apexY={34} halfW={4} color={C.roof} />

                        {/* Torre derecha */}
                        <rect x="132" y="42" width="10" height="24" fill={C.castle} />
                        <rect x="139" y="42" width="3" height="24" fill={C.castleDark} />
                        <Merlons x0={132} x1={142} y={42} color={C.battle} />
                        <Spire cx={137} baseY={42} apexY={34} halfW={4} color={C.roof} />

                        {/* Muros cortina */}
                        <rect x="108" y="52" width="6" height="14" fill={C.castle} />
                        <rect x="126" y="52" width="6" height="14" fill={C.castle} />
                        <Merlons x0={108} x1={114} y={52} color={C.battle} />
                        <Merlons x0={126} x1={132} y={52} color={C.battle} />

                        {/* Torre del homenaje (keep) */}
                        <rect x="114" y="30" width="12" height="36" fill={C.castle} />
                        <rect x="122" y="30" width="4" height="36" fill={C.castleDark} />
                        <Merlons x0={114} x1={126} y={30} color={C.battle} />
                        <Spire cx={120} baseY={30} apexY={14} halfW={6} color={C.roof} />
                        <rect x="119" y="15" width="2" height="3" fill={C.battle} />{/* asta */}

                        {/* Portón */}
                        <rect x="116" y="54" width="8" height="12" fill={C.castleDark} />
                        <rect x="117" y="53" width="6" height="2" fill={C.castleDark} />

                        {/* Ventanas encendidas */}
                        <g fill={C.window} opacity={time.windowOp}>
                            <rect x="118" y="40" width="2" height="3" />
                            <rect x="121" y="46" width="2" height="3" />
                            <rect x="101" y="50" width="2" height="3" />
                            <rect x="136" y="50" width="2" height="3" />
                        </g>
                    </g>

                    {/* Loma delantera — ancla el suelo */}
                    <g>{ridgeRects(4, 9.3, 10, 86, C.nearRidge, 'near')}</g>
                </svg>
            </div>
        </div>
    );
});

export default DashboardLandscape;
