import React, { useCallback, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { getDie, IDENTITY, matMul, matVec, rotX, rotY, axisAngle, toMatrix3d, faceToViewer, dot } from './dieGeometry';

// A real polyhedron built from CSS 3D transforms (same idea as the pure-CSS d20 by Vicente Mundim):
// every face is a clipped, numbered polygon placed in 3D. The roll is a decaying tumble that ends exactly
// on the face of the result, and each face is lit from the table lamp as it turns.

const TONES = {
    neutral: { top: '#5b4e7a', bottom: '#2a2236', edge: '#bfae8a', text: '#f4ecd8', glow: 'transparent' },
    gold:    { top: '#f0cf7a', bottom: '#a8742c', edge: '#fff0b8', text: '#2a1c08', glow: 'rgba(254,223,140,0.55)' },
    fumble:  { top: '#5c3a4b', bottom: '#2a1620', edge: '#a64d5d', text: '#e7b3bb', glow: 'transparent' },
    good:    { top: '#4a8466', bottom: '#1f3d33', edge: '#9ad9b5', text: '#eafff3', glow: 'transparent' },
    bad:     { top: '#6e4646', bottom: '#2c1c1c', edge: '#c98b8b', text: '#ffeaea', glow: 'transparent' },
    dim:     { top: '#463f58', bottom: '#25212f', edge: '#6c647e', text: '#8f87a1', glow: 'transparent' },
};

const LIGHT = (() => { const l = [-0.4, -0.6, 0.7]; const m = Math.hypot(...l); return l.map(x => x / m); })();
const REST_TILT = matMul(rotX(-0.2), rotY(0.22));         // a slight three-quarter view so the neighbouring faces show

const hexToRgb = (h) => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
const mix = (a, b, k) => a.map((v, i) => Math.round(v + (b[i] - v) * k));
const easeOut = (p) => 1 - (1 - p) ** 3;

const prefersReducedMotion = () => typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

/** Lays a face out in px: element box, clip polygon, and the matrix that stands it up in 3D. */
const layoutFace = (face, radius) => {
    const grow = 1.02;                                      // faces overlap a hair so no seam shows between them
    const pts = face.poly.map(([x, y]) => [x * radius * grow, y * radius * grow]);
    const xs = pts.map(p => p[0]), ys = pts.map(p => p[1]);
    const minX = Math.min(...xs), maxX = Math.max(...xs), minY = Math.min(...ys), maxY = Math.max(...ys);
    let inradius = Infinity;
    for (let i = 0; i < pts.length; i++) {
        const a = pts[i], b = pts[(i + 1) % pts.length];
        const ex = b[0] - a[0], ey = b[1] - a[1];
        inradius = Math.min(inradius, Math.abs(a[0] * ey - a[1] * ex) / Math.hypot(ex, ey));
    }
    const { x, y, z } = face.axes;
    const c = face.centre.map(v => v * radius);
    return {
        w: maxX - minX, h: maxY - minY, ox: -minX, oy: -minY, inradius,
        points: pts.map(([px, py]) => [px - minX, py - minY]),
        matrix: `matrix3d(${x[0]},${x[1]},${x[2]},0,${y[0]},${y[1]},${y[2]},0,${z[0]},${z[1]},${z[2]},0,${c[0]},${c[1]},${c[2]},1)`,
    };
};

/**
 * A polyhedral die. When `rollKey` changes it is thrown onto the table: it tumbles in an arc and settles
 * on the face that shows `value`. `from` is the side it is thrown from.
 */
const Die = ({ sides = 20, value, rollKey, rollMs = 800, tone = 'neutral', size = 76, from = 'left', label, sub, rolled = true }) => {
    const geo = useMemo(() => getDie(sides), [sides]);
    const box = Math.round(size * 1.35);
    const radius = box * geo.fit;
    const faces = useMemo(() => geo.faces.map(f => layoutFace(f, radius)), [geo, radius]);
    const t = TONES[tone] || TONES.neutral;
    const rgb = useMemo(() => ({ top: hexToRgb(t.top), bottom: hexToRgb(t.bottom) }), [t]);

    const bodyRef = useRef(null);
    const faceRefs = useRef([]);
    const rotRef = useRef(null);
    const rafRef = useRef(0);
    const [rolling, setRolling] = useState(false);

    const faceIndex = geo.byValue[Math.min(geo.sides, Math.max(1, value))] ?? 0;
    const restRotation = useCallback(() => matMul(REST_TILT, faceToViewer(geo.faces[faceIndex])), [geo, faceIndex]);

    // Applies a rotation to the die and lights every face from where its normal now points.
    const paint = useCallback((R) => {
        rotRef.current = R;
        if (bodyRef.current) bodyRef.current.style.transform = toMatrix3d(R);
        geo.faces.forEach((f, i) => {
            const el = faceRefs.current[i];
            if (!el) return;
            const b = Math.max(0, dot(matVec(R, f.normal), LIGHT));
            const k = 0.12 + 0.88 * Math.pow(b, 0.85);
            const c = mix(rgb.bottom, rgb.top, k);
            el.style.backgroundColor = `rgb(${c[0]},${c[1]},${c[2]})`;
        });
    }, [geo, rgb]);

    useLayoutEffect(() => {
        cancelAnimationFrame(rafRef.current);
        const rest = restRotation();
        if (!rolled || prefersReducedMotion() || rollMs <= 0) { setRolling(false); paint(rest); return undefined; }

        // two spins about random axes that die away together, so the die ends exactly on `rest`
        const rnd = () => Math.random() * 2 - 1;
        const axisA = [rnd(), rnd(), rnd()], axisB = [rnd(), rnd(), rnd()];
        const turnsA = (1.6 + Math.random() * 0.8) * 2 * Math.PI * (Math.random() < 0.5 ? -1 : 1);
        const turnsB = (1 + Math.random() * 0.8) * 2 * Math.PI * (Math.random() < 0.5 ? -1 : 1);
        const start = performance.now();
        setRolling(true);
        const frame = (now) => {
            const p = Math.min(1, (now - start) / rollMs);
            const left = 1 - easeOut(p);
            const spin = matMul(axisAngle(axisA, turnsA * left), axisAngle(axisB, turnsB * left));
            paint(matMul(spin, rest));
            if (p < 1) rafRef.current = requestAnimationFrame(frame);
            else { paint(rest); setRolling(false); }
        };
        paint(matMul(matMul(axisAngle(axisA, turnsA), axisAngle(axisB, turnsB)), rest));
        rafRef.current = requestAnimationFrame(frame);
        return () => cancelAnimationFrame(rafRef.current);
    }, [rollKey, value, sides, rollMs, rolled, restRotation, paint]);

    // the tone changes when the roll lands: re-light the die in its new colours without moving it
    useLayoutEffect(() => { if (rotRef.current) paint(rotRef.current); }, [paint]);

    const dx = from === 'left' ? -90 : from === 'right' ? 90 : 0;
    const crackIndex = tone === 'fumble' && !rolling ? faceIndex : -1;
    return (
        <div className="flex flex-col items-center gap-2" style={{ minWidth: box + 8 }}>
            <div
                key={rollKey}
                className={`duel-die ${rolling ? 'duel-die--rolling' : ''} ${tone === 'gold' && !rolling ? 'duel-die--glow' : ''}`}
                style={{ width: box, height: box, '--throw-x': `${dx}px`, '--roll-ms': `${rollMs}ms`, '--glow': t.glow }}
            >
                <div className="duel-die-shadow" style={{ opacity: rolling ? 0.5 : 1 }} aria-hidden="true" />
                <div className="duel-die-stage" style={{ perspective: box * 3.2 }} aria-hidden="true">
                    <div ref={bodyRef} className="duel-die-body">
                        {faces.map((f, i) => (
                            <div key={i} ref={el => { faceRefs.current[i] = el; }} className="duel-die-face"
                                style={{ left: -f.ox + 0, top: -f.oy + 0, width: f.w, height: f.h, transformOrigin: `${f.ox}px ${f.oy}px`, transform: f.matrix,
                                    clipPath: `polygon(${f.points.map(([x, y]) => `${x}px ${y}px`).join(',')})` }}>
                                <svg width={f.w} height={f.h} className="absolute inset-0" style={{ overflow: 'visible' }}>
                                    <polygon points={f.points.map(p => p.join(',')).join(' ')} fill="none" stroke={t.edge} strokeOpacity="0.55" strokeWidth="1.6" strokeLinejoin="round" />
                                    {i === crackIndex && (
                                        <polyline points={`${f.ox - f.inradius * 0.9},${f.oy - f.inradius * 0.5} ${f.ox - f.inradius * 0.2},${f.oy - f.inradius * 0.1} ${f.ox - f.inradius * 0.5},${f.oy + f.inradius * 0.3} ${f.ox + f.inradius * 0.3},${f.oy + f.inradius * 0.8}`}
                                            fill="none" stroke="#e7b3bb" strokeOpacity="0.6" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                                    )}
                                </svg>
                                <span className="duel-die-num" style={{ left: f.ox, top: f.oy, color: t.text, fontSize: Math.round(f.inradius * geo.font) }}>{geo.faces[i].value}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
            {label && <span className="text-[10px] font-heading font-bold uppercase tracking-[0.18em] text-gray-400 text-center leading-tight">{label}</span>}
            {sub && <span className="font-pixel text-lg leading-none text-rpg-gold text-center whitespace-nowrap">{sub}</span>}
        </div>
    );
};

export default Die;
