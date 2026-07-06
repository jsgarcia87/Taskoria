import { motion } from 'motion/react';

/**
 * Pixel-art empty-state illustrations. Each is a 16×16 SVG scene rendered
 * pixel-perfect at any size. Subtle Motion animations (opacity flicker,
 * gentle sway) match the app's "subtle and elegant" motion vocabulary —
 * never showy.
 *
 * Palette pulls from the existing dark-purple + gold + amber system.
 */

const P = {
  gold:      '#fbbf24',
  goldDim:   '#b45309',
  amber:     '#f59e0b',
  ember:     '#dc2626',
  emberDim:  '#7f1d1d',
  flame:     '#fef3c7',
  stone:     '#4a4458',
  stoneLit:  '#6b6478',
  stoneDark: '#241d33',
  wood:      '#78350f',
  woodLit:   '#a16207',
  parchment: '#eab676',
  parchmentDark: '#a67736',
  metal:     '#cbd5e1',
  metalLit:  '#f8fafc',
  metalDark: '#64748b',
  steam:     '#94a3b8',
  paper:     '#f1e9c8',
  candleWax: '#fde68a',
  ceramicLit: '#fbbf24',
  ceramic:    '#d97706',
  ceramicDark:'#7c2d12',
};

const Px = ({ x, y, c, w = 1, h = 1 }) => (
  <rect x={x} y={y} width={w} height={h} fill={c} />
);

const svgBase = (size) => ({
  viewBox: '0 0 16 16',
  width: size,
  height: size,
  shapeRendering: 'crispEdges',
  style: { imageRendering: 'pixelated' },
});

// ─────────────────────────────────────────────────────────────
// 1. Peaceful Realm — campfire under stars ("no active quests")
// ─────────────────────────────────────────────────────────────
export const PeacefulRealm = ({ size = 96 }) => (
  <svg {...svgBase(size)}>
    {/* Twinkling stars — two groups on opposite phases */}
    <motion.g
      animate={{ opacity: [0.35, 1, 0.35] }}
      transition={{ duration: 3.4, repeat: Infinity, ease: 'easeInOut' }}
    >
      <Px x={2}  y={1} c={P.gold} />
      <Px x={11} y={2} c={P.gold} />
      <Px x={7}  y={3} c={P.gold} />
    </motion.g>
    <motion.g
      animate={{ opacity: [1, 0.3, 1] }}
      transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut', delay: 0.9 }}
    >
      <Px x={14} y={2} c={P.gold} />
      <Px x={4}  y={4} c={P.gold} />
    </motion.g>

    {/* Ground */}
    <Px x={0} y={13} c={P.stoneDark} w={16} h={3} />
    <Px x={0} y={12} c={P.stone}     w={16} h={1} />
    <Px x={3} y={12} c={P.stoneLit}  w={2}  h={1} />
    <Px x={11} y={12} c={P.stoneLit} w={3}  h={1} />

    {/* Logs */}
    <Px x={5}  y={11} c={P.wood}    w={6} h={1} />
    <Px x={4}  y={12} c={P.woodLit} w={8} h={1} />
    <Px x={6}  y={10} c={P.wood}    w={4} h={1} />

    {/* Flame — flickers via opacity + subtle color shift */}
    <motion.g
      animate={{ opacity: [1, 0.75, 1, 0.85, 1] }}
      transition={{ duration: 0.55, repeat: Infinity, ease: 'linear' }}
    >
      <Px x={7} y={9}  c={P.flame} w={2} h={1} />
      <Px x={7} y={8}  c={P.amber} w={2} h={1} />
      <Px x={7} y={7}  c={P.ember} w={2} h={1} />
      <Px x={8} y={6}  c={P.emberDim} />
    </motion.g>

    {/* Ambient glow around the fire — softer, slower */}
    <motion.g
      animate={{ opacity: [0.4, 0.7, 0.4] }}
      transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
    >
      <Px x={5} y={9}  c={P.goldDim} />
      <Px x={10} y={9} c={P.goldDim} />
      <Px x={4} y={10} c={P.goldDim} />
      <Px x={11} y={10} c={P.goldDim} />
    </motion.g>
  </svg>
);

// ─────────────────────────────────────────────────────────────
// 2. Clean Tavern — steaming mug on a shelf ("no chores")
// ─────────────────────────────────────────────────────────────
export const CleanTavern = ({ size = 96 }) => (
  <svg {...svgBase(size)}>
    {/* Rising steam — three wisps offset in time */}
    <motion.g
      animate={{ opacity: [0, 0.8, 0], y: [0, -1, -2] }}
      transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
    >
      <Px x={6} y={3} c={P.steam} />
      <Px x={7} y={1} c={P.steam} />
    </motion.g>
    <motion.g
      animate={{ opacity: [0, 0.6, 0], y: [0, -1, -2] }}
      transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut', delay: 0.7 }}
    >
      <Px x={9} y={2} c={P.steam} />
      <Px x={10} y={4} c={P.steam} />
    </motion.g>
    <motion.g
      animate={{ opacity: [0, 0.7, 0], y: [0, -1, -2] }}
      transition={{ duration: 2.6, repeat: Infinity, ease: 'easeInOut', delay: 1.4 }}
    >
      <Px x={8} y={3} c={P.steam} />
    </motion.g>

    {/* Mug body */}
    <Px x={5}  y={6}  c={P.ceramicDark} w={6} h={1} />
    <Px x={5}  y={7}  c={P.ceramic}     w={1} h={5} />
    <Px x={10} y={7}  c={P.ceramic}     w={1} h={5} />
    <Px x={6}  y={7}  c={P.ceramicLit}  w={4} h={5} />
    <Px x={5}  y={12} c={P.ceramicDark} w={6} h={1} />

    {/* Handle */}
    <Px x={11} y={8}  c={P.ceramicDark} w={2} h={1} />
    <Px x={13} y={9}  c={P.ceramicDark} w={1} h={2} />
    <Px x={11} y={11} c={P.ceramicDark} w={2} h={1} />
    <Px x={12} y={9}  c={P.ceramic}     w={1} h={2} />

    {/* Wooden shelf */}
    <Px x={2}  y={13} c={P.wood}    w={12} h={1} />
    <Px x={2}  y={14} c={P.woodLit} w={12} h={1} />
    <Px x={2}  y={15} c={P.wood}    w={12} h={1} />
  </svg>
);

// ─────────────────────────────────────────────────────────────
// 3. No Rituals — candle + open book ("no habits")
// ─────────────────────────────────────────────────────────────
export const NoRituals = ({ size = 96 }) => (
  <svg {...svgBase(size)}>
    {/* Candle flame — flickers */}
    <motion.g
      animate={{ opacity: [1, 0.65, 1, 0.85, 1] }}
      transition={{ duration: 0.6, repeat: Infinity, ease: 'linear' }}
    >
      <Px x={3} y={2} c={P.flame} />
      <Px x={3} y={3} c={P.amber} />
      <Px x={3} y={4} c={P.ember} />
    </motion.g>

    {/* Candle wick */}
    <Px x={3} y={5} c={P.stoneDark} />

    {/* Candle wax */}
    <Px x={2} y={6}  c={P.candleWax} w={3} h={1} />
    <Px x={2} y={7}  c={P.candleWax} w={3} h={1} />
    <Px x={2} y={8}  c={P.candleWax} w={3} h={1} />
    <Px x={4} y={7}  c={P.paper}     w={1} h={2} />

    {/* Candle holder */}
    <Px x={1} y={9}  c={P.metalDark} w={5} h={1} />
    <Px x={2} y={10} c={P.metal}     w={3} h={1} />
    <Px x={1} y={11} c={P.metalDark} w={5} h={1} />

    {/* Book — open on right */}
    {/* Left page */}
    <Px x={7}  y={9}  c={P.paper}     w={3} h={2} />
    <Px x={7}  y={9}  c={P.parchment} w={1} h={2} />
    {/* Right page */}
    <Px x={11} y={9}  c={P.paper}     w={3} h={2} />
    <Px x={13} y={9}  c={P.parchment} w={1} h={2} />
    {/* Spine */}
    <Px x={10} y={9}  c={P.parchmentDark} w={1} h={2} />
    {/* Cover / edge */}
    <Px x={7}  y={11} c={P.parchmentDark} w={7} h={1} />

    {/* Ambient glow — very soft */}
    <motion.g
      animate={{ opacity: [0.3, 0.55, 0.3] }}
      transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
    >
      <Px x={1} y={4} c={P.goldDim} />
      <Px x={5} y={4} c={P.goldDim} />
    </motion.g>

    {/* Surface */}
    <Px x={0} y={13} c={P.wood}    w={16} h={1} />
    <Px x={0} y={14} c={P.woodLit} w={16} h={1} />
    <Px x={0} y={15} c={P.wood}    w={16} h={1} />
  </svg>
);

// ─────────────────────────────────────────────────────────────
// 4. No Threats — sword in stone ("no active bosses")
// ─────────────────────────────────────────────────────────────
export const NoThreats = ({ size = 96 }) => (
  <svg {...svgBase(size)}>
    {/* Ambient glow — pulses slowly */}
    <motion.g
      animate={{ opacity: [0.25, 0.55, 0.25] }}
      transition={{ duration: 2.8, repeat: Infinity, ease: 'easeInOut' }}
    >
      <Px x={5} y={2} c={P.goldDim} />
      <Px x={10} y={2} c={P.goldDim} />
      <Px x={4} y={5} c={P.goldDim} />
      <Px x={11} y={5} c={P.goldDim} />
    </motion.g>

    {/* Sword pommel */}
    <Px x={7} y={1} c={P.gold} w={2} h={1} />
    <Px x={7} y={2} c={P.goldDim} w={2} h={1} />

    {/* Cross-guard */}
    <Px x={5} y={3} c={P.gold}    w={6} h={1} />
    <Px x={5} y={4} c={P.goldDim} w={6} h={1} />

    {/* Grip */}
    <Px x={7} y={5} c={P.wood} w={2} h={1} />

    {/* Blade */}
    <Px x={7} y={6}  c={P.metalLit} w={2} h={5} />
    <Px x={6} y={6}  c={P.metal}    w={1} h={5} />
    <Px x={9} y={6}  c={P.metal}    w={1} h={5} />
    <Px x={7} y={11} c={P.metalDark} w={2} h={1} />

    {/* Stone — irregular top edge */}
    <Px x={2}  y={11} c={P.stone}     w={2} h={1} />
    <Px x={4}  y={10} c={P.stone}     w={2} h={2} />
    <Px x={6}  y={11} c={P.stoneDark} w={4} h={1} />
    <Px x={10} y={10} c={P.stone}     w={2} h={2} />
    <Px x={12} y={11} c={P.stone}     w={2} h={1} />

    {/* Stone body */}
    <Px x={2}  y={12} c={P.stone}     w={12} h={1} />
    <Px x={2}  y={13} c={P.stoneLit}  w={12} h={1} />
    <Px x={2}  y={14} c={P.stone}     w={12} h={1} />
    <Px x={3}  y={13} c={P.stoneDark} w={1}  h={1} />
    <Px x={12} y={13} c={P.stoneDark} w={1}  h={1} />
    <Px x={1}  y={15} c={P.stoneDark} w={14} h={1} />
  </svg>
);
