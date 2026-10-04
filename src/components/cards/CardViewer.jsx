import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'motion/react';
import { X } from 'lucide-react';
import { CardFront, CardBack, CARD_W, CARD_H } from './BossCard';
import { useCardGestures } from './useCardGestures';

const HINT_KEY = 'taskoria_card_hint_seen';
const MODES = [
    { id: 'tilt', label: 'Tilt' },
    { id: 'move', label: 'Move' },
    { id: 'rotate', label: 'Rotate' },
];

const fitWidth = () => {
    const maxH = window.innerHeight - 250;
    const maxW = Math.min(window.innerWidth * 0.84, 360);
    return Math.max(180, Math.min(maxW, (maxH * CARD_W) / CARD_H));
};

const faceStyle = (k, back) => ({
    position: 'absolute', inset: 0, borderRadius: 16 * k,
    backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden',
    transform: back ? 'rotateY(180deg)' : undefined,
    boxShadow: '0 28px 44px -14px rgba(0,0,0,0.65), 0 0 0 1px rgba(0,0,0,0.4)',
});

const scaled = (k, child) => (
    <div style={{ width: CARD_W, height: CARD_H, transform: `scale(${k})`, transformOrigin: 'top left' }}>{child}</div>
);

/**
 * Full-screen card viewer. `locked` shows an unclaimed card; `reveal` starts
 * face-down and turns over on its own (a card that was just earned).
 */
const CardViewer = ({ card, locked = false, reveal = false, progress = null, onClose }) => {
    const cardRef = useRef(null);
    const closeRef = useRef(null);
    const [width, setWidth] = useState(fitWidth);
    const [showHint, setShowHint] = useState(() => {
        try { return !localStorage.getItem(HINT_KEY); } catch (e) { return true; }
    });
    const g = useCardGestures({ cardRef, startFlipped: reveal, onTapOutside: onClose });

    useEffect(() => {
        const onResize = () => setWidth(fitWidth());
        window.addEventListener('resize', onResize);
        return () => window.removeEventListener('resize', onResize);
    }, []);

    useEffect(() => {
        const prev = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        closeRef.current?.focus();
        return () => { document.body.style.overflow = prev; };
    }, []);

    useEffect(() => {
        if (!reveal) return;
        const t = setTimeout(() => g.flipCard(), 650);
        return () => clearTimeout(t);
    }, [reveal]); // eslint-disable-line react-hooks/exhaustive-deps

    useEffect(() => {
        if (!showHint) return;
        const t = setTimeout(() => {
            setShowHint(false);
            try { localStorage.setItem(HINT_KEY, '1'); } catch (e) { /* storage blocked */ }
        }, 6000);
        return () => clearTimeout(t);
    }, [showHint]);

    useEffect(() => {
        const onKey = (e) => {
            if (e.key === 'Escape') onClose();
            if (e.key === 'f' || e.key === 'F') g.flipCard();
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [onClose]); // eslint-disable-line react-hooks/exhaustive-deps

    const k = width / CARD_W;
    const height = CARD_H * k;
    const hpPct = progress ? Math.max(0, Math.min(100, (progress.hp / progress.maxHp) * 100)) : 0;

    // Portal: the app's views are transformed, which would trap `position: fixed` inside the page.
    return createPortal(
        <div
            role="dialog"
            aria-modal="true"
            aria-label={`${card.name} boss card`}
            className="fixed inset-0 z-[300] flex flex-col select-none"
            style={{ background: 'radial-gradient(ellipse at 50% 38%, #3a2f4a 0%, #15101c 72%)' }}
        >
            <div className="flex items-start justify-between gap-3 px-4 pt-[max(16px,env(safe-area-inset-top))]">
                <div className="min-w-0">
                    <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-gray-400">{reveal ? 'New boss card' : locked ? 'Boss card · unclaimed' : 'Boss card'}</p>
                    <h2 className="mt-1 font-herald text-2xl leading-none text-[#fedf8c] truncate">{card.name}</h2>
                </div>
                <button
                    ref={closeRef}
                    onClick={onClose}
                    aria-label="Close card"
                    className="w-11 h-11 shrink-0 rounded-xl flex items-center justify-center text-gray-300 hover:text-white bg-white/[0.06] hover:bg-white/10 transition-colors"
                >
                    <X size={20} />
                </button>
            </div>

            <div
                className="relative flex-1 min-h-0 grid place-items-center overflow-hidden cursor-grab active:cursor-grabbing"
                style={{ perspective: 1100, touchAction: 'none' }}
                {...g.handlers}
            >
                <motion.div
                    ref={cardRef}
                    style={{ ...g.motionStyle, width, height, transformStyle: 'preserve-3d' }}
                    initial={reveal ? { opacity: 0, y: 24 } : false}
                    animate={reveal ? { opacity: 1, y: 0 } : undefined}
                    transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                >
                    <div style={faceStyle(k, false)}>{scaled(k, <CardFront card={card} locked={locked} />)}</div>
                    <div style={faceStyle(k, true)}>{scaled(k, <CardBack />)}</div>
                </motion.div>

                <p
                    className={`absolute bottom-2 inset-x-4 text-center text-xs text-gray-300 transition-opacity duration-500 pointer-events-none ${showHint ? 'opacity-100' : 'opacity-0'}`}
                    aria-hidden={!showHint}
                >
                    Drag to tilt · two fingers to move, turn and zoom · tap to flip
                </p>
            </div>

            <div className="flex flex-col items-center gap-3 px-4 pt-3 pb-[max(16px,env(safe-area-inset-bottom))]">
                {locked && progress && (
                    <div className="w-full max-w-sm">
                        <div className="flex items-baseline justify-between mb-1.5">
                            <span className="text-sm font-semibold text-white">Defeat it to claim this card</span>
                            <span className="text-xs text-gray-400 tabular-nums">{Math.ceil(progress.hp).toLocaleString()} / {progress.maxHp.toLocaleString()} HP</span>
                        </div>
                        <div className="h-2 rounded-full bg-white/[0.08] overflow-hidden">
                            <div className="h-full rounded-full bg-gradient-to-r from-red-800 to-red-500" style={{ width: `${hpPct}%` }} />
                        </div>
                    </div>
                )}
                <div className="flex items-center gap-2 flex-wrap justify-center">
                    <div role="group" aria-label="What one finger does" className="flex p-1 rounded-xl bg-white/[0.06] ring-1 ring-white/10">
                        {MODES.map(m => (
                            <button
                                key={m.id}
                                onClick={() => g.setMode(m.id)}
                                aria-pressed={g.mode === m.id}
                                className={`min-h-[40px] px-4 rounded-lg text-sm font-semibold transition-colors ${g.mode === m.id ? 'bg-rpg-gold text-rpg-bg' : 'text-gray-300 hover:text-white'}`}
                            >
                                {m.label}
                            </button>
                        ))}
                    </div>
                    <button onClick={g.flipCard} className="min-h-[48px] px-4 rounded-xl text-sm font-semibold text-gray-200 hover:text-white bg-white/[0.06] hover:bg-white/10 ring-1 ring-white/10 transition-colors">
                        {g.flipped ? 'Show front' : 'Flip'}
                    </button>
                    <button onClick={g.reset} className="min-h-[48px] px-4 rounded-xl text-sm font-semibold text-gray-200 hover:text-white bg-white/[0.06] hover:bg-white/10 ring-1 ring-white/10 transition-colors">
                        Reset
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
};

export default CardViewer;
