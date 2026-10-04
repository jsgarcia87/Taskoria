import { useRef, useState } from 'react';
import { useMotionValue, useTransform, animate, useReducedMotion } from 'motion/react';

const MAX_TILT = 24;
const MIN_SCALE = 0.6;
const MAX_SCALE = 2.4;
const TAP_MS = 400;
const TAP_SLOP = 8;

const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
const wrapAngle = (a) => (a > Math.PI ? a - 2 * Math.PI : a < -Math.PI ? a + 2 * Math.PI : a);

/**
 * Touch + mouse control of a 3D card.
 *   one finger  → by mode: tilt (default) · move · rotate
 *   two fingers → move + turn + zoom together
 *   tap         → flip (tapping outside the card calls onTapOutside)
 *   wheel       → zoom;  mouse hover tilts the card toward the cursor
 */
export function useCardGestures({ cardRef, startFlipped = false, onTapOutside }) {
    const reduce = useReducedMotion();
    const x = useMotionValue(0);
    const y = useMotionValue(0);
    const rotZ = useMotionValue(0);
    const scale = useMotionValue(1);
    const tiltX = useMotionValue(0);
    const tiltY = useMotionValue(0);
    const flip = useMotionValue(startFlipped ? 180 : 0);

    const rotateY = useTransform([flip, tiltY], ([f, t]) => f + t);
    // Light and depth react to the tilt (consumed as CSS variables by the card faces).
    const vars = {
        '--mx': useTransform(tiltY, (v) => `${50 + v * 2.2}%`),
        '--my': useTransform(tiltX, (v) => `${50 - v * 2.2}%`),
        '--bgx': useTransform(tiltY, (v) => `${50 + v * 3}%`),
        '--bgy': useTransform(tiltX, (v) => `${50 - v * 3}%`),
        '--tx': useTransform(tiltY, (v) => -v * 0.8),
        '--ty': useTransform(tiltX, (v) => v * 0.8),
    };

    const [mode, setModeState] = useState('tilt');
    const modeRef = useRef('tilt');
    const [flipped, setFlipped] = useState(startFlipped);
    const flippedRef = useRef(startFlipped);
    const pointers = useRef(new Map());
    const gesture = useRef({});

    const ease = (opts) => (reduce ? { duration: 0.2 } : opts);
    const SPRING = { type: 'spring', stiffness: 150, damping: 15 };

    const setMode = (m) => { modeRef.current = m; setModeState(m); };

    const cardBox = () => {
        const r = cardRef.current?.getBoundingClientRect();
        return r ? { cx: r.left + r.width / 2, cy: r.top + r.height / 2, w: r.width, h: r.height, r } : { cx: 0, cy: 0, w: 1, h: 1, r: null };
    };

    const tiltToward = (clientX, clientY) => {
        const { cx, cy, w, h } = cardBox();
        tiltY.set(clamp((clientX - cx) / (w / 2), -1.3, 1.3) * MAX_TILT);
        tiltX.set(clamp(-(clientY - cy) / (h / 2), -1.3, 1.3) * MAX_TILT);
    };
    const settle = () => {
        animate(tiltX, 0, ease(SPRING));
        animate(tiltY, 0, ease(SPRING));
    };

    const beginSingle = (p) => {
        const { cx, cy } = cardBox();
        gesture.current = { kind: 'single', sx: p.x, sy: p.y, lx: p.x, ly: p.y, t: performance.now(), moved: false, lastAngle: Math.atan2(p.y - cy, p.x - cx) };
    };
    const beginPinch = () => {
        const [a, b] = [...pointers.current.values()];
        gesture.current = {
            kind: 'pinch', moved: true,
            dist: Math.hypot(b.x - a.x, b.y - a.y) || 1, scale0: scale.get(),
            lastAngle: Math.atan2(b.y - a.y, b.x - a.x),
            mx: (a.x + b.x) / 2, my: (a.y + b.y) / 2,
        };
    };

    const onPointerDown = (e) => {
        try { e.currentTarget.setPointerCapture?.(e.pointerId); } catch (err) { /* pointer already gone */ }
        pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
        if (pointers.current.size === 1) {
            beginSingle({ x: e.clientX, y: e.clientY });
            if (modeRef.current === 'tilt') tiltToward(e.clientX, e.clientY);
        } else if (pointers.current.size === 2) {
            beginPinch();
            settle();
        }
    };

    const onPointerMove = (e) => {
        const tracked = pointers.current.has(e.pointerId);
        if (tracked) pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
        const g = gesture.current;

        if (pointers.current.size >= 2 && g.kind === 'pinch') {
            const [a, b] = [...pointers.current.values()];
            const dist = Math.hypot(b.x - a.x, b.y - a.y) || 1;
            const angle = Math.atan2(b.y - a.y, b.x - a.x);
            const mx = (a.x + b.x) / 2;
            const my = (a.y + b.y) / 2;
            scale.set(clamp(g.scale0 * (dist / g.dist), MIN_SCALE, MAX_SCALE));
            rotZ.set(rotZ.get() + wrapAngle(angle - g.lastAngle) * (180 / Math.PI));
            x.set(x.get() + (mx - g.mx));
            y.set(y.get() + (my - g.my));
            g.lastAngle = angle; g.mx = mx; g.my = my;
            return;
        }

        if (tracked && pointers.current.size === 1 && g.kind === 'single') {
            if (Math.hypot(e.clientX - g.sx, e.clientY - g.sy) > TAP_SLOP) g.moved = true;
            const m = modeRef.current;
            if (m === 'tilt') {
                tiltToward(e.clientX, e.clientY);
            } else if (m === 'move') {
                x.set(x.get() + (e.clientX - g.lx));
                y.set(y.get() + (e.clientY - g.ly));
            } else if (m === 'rotate') {
                const { cx, cy } = cardBox();
                const angle = Math.atan2(e.clientY - cy, e.clientX - cx);
                rotZ.set(rotZ.get() + wrapAngle(angle - g.lastAngle) * (180 / Math.PI));
                g.lastAngle = angle;
            }
            g.lx = e.clientX; g.ly = e.clientY;
        } else if (!tracked && e.pointerType === 'mouse' && modeRef.current === 'tilt') {
            tiltToward(e.clientX, e.clientY); // hover
        }
    };

    const flipCard = () => {
        const next = !flippedRef.current;
        flippedRef.current = next;
        setFlipped(next);
        animate(flip, next ? 180 : 0, ease({ type: 'spring', stiffness: 110, damping: 17 }));
    };

    const onPointerUp = (e) => {
        const g = gesture.current;
        const wasSingle = pointers.current.size === 1 && g.kind === 'single';
        pointers.current.delete(e.pointerId);
        if (pointers.current.size === 0) {
            if (wasSingle && !g.moved && performance.now() - g.t < TAP_MS) {
                const { r } = cardBox();
                const inside = r && e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom;
                if (inside) flipCard(); else onTapOutside?.();
            }
            if (e.pointerType !== 'mouse') settle();
            gesture.current = {};
        } else if (pointers.current.size === 1) {
            beginSingle([...pointers.current.values()][0]); // one finger lifted: keep going with the other
            gesture.current.moved = true; // …but lifting the second finger of a pinch is never a tap
        }
    };

    const onPointerLeave = (e) => {
        if (e.pointerType === 'mouse' && pointers.current.size === 0) settle();
    };

    const onWheel = (e) => {
        scale.set(clamp(scale.get() * Math.exp(-e.deltaY * 0.0015), MIN_SCALE, MAX_SCALE));
    };

    const reset = () => {
        const t = ease({ type: 'spring', stiffness: 160, damping: 20 });
        [x, y, rotZ, tiltX, tiltY].forEach(mv => animate(mv, 0, t));
        animate(scale, 1, t);
    };

    return {
        motionStyle: { x, y, rotateZ: rotZ, rotateX: tiltX, rotateY, scale, ...vars },
        handlers: { onPointerDown, onPointerMove, onPointerUp, onPointerCancel: onPointerUp, onPointerLeave, onWheel },
        mode, setMode, flipped, flipCard, reset,
    };
}
