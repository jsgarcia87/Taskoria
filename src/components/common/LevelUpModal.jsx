import { useEffect } from 'react';
import { motion, useAnimate, stagger } from 'motion/react';
import { ChevronUp } from 'lucide-react';
import { playLevelUpSound } from '../../utils/sound';

const LEVEL_TEXT = 'LEVEL';
const STATS = ['str', 'int', 'dex', 'con', 'will', 'cha'];

// Springs coherentes con el resto de la app.
const MODAL_SPRING = { type: 'spring', stiffness: 300, damping: 34 };
const TITLE_SPRING = { type: 'spring', stiffness: 320, damping: 32 };
const STAT_SPRING  = { type: 'spring', stiffness: 300, damping: 34 };

/**
 * LevelUp minimalista.
 *
 * Secuencia (~1.2s en total):
 *   1. Backdrop: opacidad + blur van juntos de 0 → 12px (280ms).
 *   2. Carta: scale 0.98 → 1 + y 12 → 0 con spring (delay 100ms).
 *   3. Título "LEVEL {N}": letras con stagger de 45ms (delay 180ms).
 *   4. Stats: 6 cards con stagger de 60ms.
 *
 * Sin flash blanco, sin confetti, sin glow expansivo — solo respiración.
 */
const LevelUpModal = ({ data, onClose }) => {
    const [scope, animate] = useAnimate();

    useEffect(() => {
        try { playLevelUpSound(); } catch (_) {}

        const run = async () => {
            await animate(
                '.title-char',
                { opacity: 1, y: 0 },
                {
                    delay: stagger(0.045, { startDelay: 0.18 }),
                    ...TITLE_SPRING,
                }
            );
            await animate(
                '.stat-card',
                { opacity: 1, y: 0 },
                { delay: stagger(0.06), ...STAT_SPRING }
            );
        };
        run();
    }, [animate]);

    if (!data) return null;

    return (
        <motion.div
            ref={scope}
            initial={{ opacity: 0, backdropFilter: 'blur(0px)' }}
            animate={{ opacity: 1, backdropFilter: 'blur(12px)' }}
            exit={{ opacity: 0, backdropFilter: 'blur(0px)' }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            className="fixed inset-0 z-[200] flex items-center justify-center bg-black/70 overflow-hidden"
        >
            <motion.div
                initial={{ opacity: 0, y: 12, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 6, scale: 0.99 }}
                transition={{ ...MODAL_SPRING, delay: 0.1 }}
                className="relative z-10 w-full max-w-sm bg-rpg-panel/80 border border-white/10 rounded-3xl p-8 backdrop-blur-xl shadow-2xl flex flex-col items-center"
            >
                {/* Glow ambient estático detrás del texto — atmósfera, no efecto */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 bg-purple-500/15 rounded-full blur-3xl pointer-events-none" />

                <div className="text-gray-400 font-bold uppercase tracking-[0.3em] text-[10px] mb-1 z-10">Ascension</div>

                <div className="flex text-5xl font-display font-light text-white tracking-widest z-10 mb-2">
                    {LEVEL_TEXT.split('').map((ch, i) => (
                        <span
                            key={`c-${i}`}
                            className="title-char inline-block"
                            style={{ opacity: 0, transform: 'translateY(14px)' }}
                        >
                            {ch}
                        </span>
                    ))}
                    <span
                        className="title-char inline-block ml-3 font-bold text-rpg-gold text-shadow-glow"
                        style={{ opacity: 0, transform: 'translateY(14px)' }}
                    >
                        {data.level}
                    </span>
                </div>

                {/* Decorative Divider — estático, aparece con el modal */}
                <div className="flex items-center gap-4 w-full justify-center my-6 z-10">
                    <div className="h-px w-16 bg-gradient-to-r from-transparent to-white/20" />
                    <div className="w-2 h-2 rounded-full border border-rpg-gold shadow-[0_0_10px_rgba(251,191,36,0.6)]" />
                    <div className="h-px w-16 bg-gradient-to-l from-transparent to-white/20" />
                </div>

                <div className="text-xs text-gray-500 uppercase tracking-widest font-bold mb-4 z-10">Stat Increases</div>

                <div className="w-full grid grid-cols-3 gap-3 z-10">
                    {STATS.map((stat) => (
                        <div
                            key={stat}
                            className="stat-card bg-black/40 border border-white/5 rounded-xl p-3 flex flex-col items-center"
                            style={{ opacity: 0, transform: 'translateY(8px)' }}
                        >
                            <span className="text-gray-500 text-[9px] font-bold uppercase tracking-widest">{stat}</span>
                            <div className="text-white font-mono text-lg mt-1 flex items-center gap-1">
                                {data.stats?.[stat] || 10}
                                <ChevronUp size={12} className="text-gray-400" />
                            </div>
                        </div>
                    ))}
                </div>

                <motion.button
                    onClick={onClose}
                    whileHover={{ scale: 1.015 }}
                    whileTap={{ scale: 0.97 }}
                    transition={{ type: 'spring', stiffness: 340, damping: 28 }}
                    className="mt-8 w-full bg-white/5 hover:bg-white/10 border border-white/10 py-3 text-sm text-gray-300 hover:text-white font-bold uppercase tracking-widest rounded-xl transition-colors z-10"
                >
                    Continue Journey
                </motion.button>
            </motion.div>
        </motion.div>
    );
};

export default LevelUpModal;
