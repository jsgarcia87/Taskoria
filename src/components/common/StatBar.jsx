import { useEffect, useRef } from 'react';
import { motion, useSpring, useTransform, useMotionValue } from 'motion/react';

const COLORS = {
  hp:      { grad: 'from-red-600 to-red-400',       glow: 'rgba(239,68,68,0.5)'  },
  xp:      { grad: 'from-amber-500 to-yellow-400',  glow: 'rgba(245,158,11,0.6)' },
  bond:    { grad: 'from-rose-500 to-pink-400',     glow: 'rgba(244,63,94,0.5)'  },
  mp:      { grad: 'from-blue-600 to-blue-400',     glow: 'rgba(59,130,246,0.5)' },
  hunger:  { grad: 'from-orange-500 to-orange-400', glow: 'rgba(249,115,22,0.4)' },
  happy:   { grad: 'from-pink-500 to-pink-400',     glow: 'rgba(236,72,153,0.4)' },
  hygiene: { grad: 'from-blue-400 to-cyan-400',     glow: 'rgba(56,189,248,0.4)' },
  danger:  { grad: 'from-red-500 to-red-500',       glow: 'rgba(239,68,68,0.5)'  },
};

const SPRING = { stiffness: 120, damping: 20, mass: 0.6 };

/**
 * Progress bar animada con spring físico.
 * - Cambios de valor: spring suave (no lineal).
 * - Al alcanzar 100%: pulse dorado sutil (single-shot, no infinito).
 * - `dangerBelow`: umbral (%) por debajo del cual el gradiente cambia a rojo.
 */
export function StatBar({
  current,
  max,
  kind = 'hp',
  dangerBelow = 0,
  height = 'h-3',
  celebrateAtMax = true,
}) {
  const pct = Math.max(0, Math.min(100, (current / max) * 100));
  const raw = useMotionValue(pct);
  const spring = useSpring(raw, SPRING);
  const width = useTransform(spring, (v) => `${v}%`);
  const prev = useRef(pct);
  const barRef = useRef(null);

  useEffect(() => {
    raw.set(pct);
    if (celebrateAtMax && pct >= 100 && prev.current < 100 && barRef.current) {
      barRef.current.animate(
        [
          { boxShadow: '0 0 10px currentColor' },
          { boxShadow: '0 0 22px #FFD700, 0 0 44px rgba(255,215,0,0.4)' },
          { boxShadow: '0 0 10px currentColor' },
        ],
        { duration: 700, easing: 'ease-out' }
      );
    }
    prev.current = pct;
  }, [pct, raw, celebrateAtMax]);

  const activeKind = dangerBelow > 0 && pct < dangerBelow ? 'danger' : kind;
  const c = COLORS[activeKind] || COLORS.hp;

  return (
    <div className={`w-full ${height} bg-black/40 rounded-full overflow-hidden border border-white/5`}>
      <motion.div
        ref={barRef}
        style={{ width, boxShadow: `0 0 10px ${c.glow}` }}
        className={`h-full bg-gradient-to-r ${c.grad}`}
      />
    </div>
  );
}

export default StatBar;
