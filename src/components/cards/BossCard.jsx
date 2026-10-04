import React from 'react';
import EnemySprite from '../common/EnemySprite';
import PixelIcon from '../common/PixelIcon';
import { RARITIES, zoneName, zonePalette } from '../../utils/bossCards';

// The card is drawn once at a fixed design size and scaled, so thumbnails and the
// full viewer are the same artwork. Aspect ratio 63:88, like a trading card.
export const CARD_W = 300;
export const CARD_H = 419;

const dateLabel = (ts) => ts ? new Date(ts).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '';

// Light that follows the tilt. --mx/--my/--bgx/--bgy are set by the viewer; static cards use the centre.
const Foil = ({ strong }) => (
    <div
        className="absolute inset-0 pointer-events-none"
        aria-hidden="true"
        style={{
            borderRadius: 16,
            background: strong
                ? `radial-gradient(circle at var(--mx, 50%) var(--my, 50%), rgba(255,255,255,0.38) 0%, rgba(255,255,255,0) 46%),
                   linear-gradient(115deg, transparent 18%, rgba(255,119,115,0.32) 30%, rgba(255,237,95,0.32) 38%, rgba(168,255,95,0.30) 46%, rgba(131,255,247,0.32) 54%, rgba(120,148,255,0.32) 62%, rgba(216,117,255,0.32) 70%, transparent 82%)`
                : 'radial-gradient(circle at var(--mx, 50%) var(--my, 50%), rgba(255,255,255,0.22) 0%, rgba(255,255,255,0) 50%)',
            backgroundSize: strong ? '100% 100%, 260% 260%' : '100% 100%',
            backgroundPosition: strong ? '0 0, var(--bgx, 50%) var(--bgy, 50%)' : '0 0',
            mixBlendMode: strong ? 'color-dodge' : 'soft-light',
            opacity: strong ? 0.6 : 0.9,
        }}
    />
);

export const CardFront = ({ card, locked = false }) => {
    const rarity = RARITIES[card.rarity] || RARITIES.rare;
    const [bg0, bg1, bg2, glow] = zonePalette(card.zone);
    const frame = `linear-gradient(135deg, ${rarity.frame[0]} 0%, ${rarity.frame[1]} 48%, ${rarity.frame[2]} 100%)`;

    return (
        <div
            className="relative overflow-hidden"
            style={{ width: CARD_W, height: CARD_H, borderRadius: 16, padding: 9, background: frame, boxShadow: '0 1px 0 rgba(255,255,255,0.5) inset, 0 0 0 1px rgba(0,0,0,0.55)' }}
        >
            <div className="flex flex-col h-full" style={{ borderRadius: 9, padding: 7, gap: 5, background: '#221b2b', boxShadow: '0 0 0 1px rgba(0,0,0,0.6)' }}>
                {/* Title bar */}
                <div className="flex items-center justify-between shrink-0" style={{ height: 30, padding: '0 9px', borderRadius: 6, background: 'linear-gradient(#3b3248, #2a2236)', boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.08)' }}>
                    <span className="font-herald text-white truncate" style={{ fontSize: 17, lineHeight: 1 }}>{card.name}</span>
                    <span className="flex items-center gap-1 shrink-0 ml-2" style={{ color: rarity.accent }}>
                        <PixelIcon name="heart" size={11} color={rarity.accent} />
                        <span className="font-pixel" style={{ fontSize: 19, lineHeight: 1 }}>{card.hp ? card.hp.toLocaleString() : '?'}</span>
                    </span>
                </div>

                {/* Art window */}
                <div
                    className="relative shrink-0 overflow-hidden"
                    style={{ height: 196, borderRadius: 6, background: `linear-gradient(180deg, ${bg0} 0%, ${bg1} 58%, ${bg2} 100%)`, boxShadow: 'inset 0 0 0 1px rgba(0,0,0,0.6)' }}
                >
                    <div className="absolute inset-0" style={{ background: `radial-gradient(ellipse at 50% 78%, ${glow}55 0%, transparent 62%)` }} />
                    <div className="absolute left-1/2 bottom-[18px] -translate-x-1/2" style={{ width: 130, height: 16, borderRadius: '50%', background: 'rgba(0,0,0,0.45)', filter: 'blur(5px)' }} />
                    {/* The creature sits slightly in front of the background and shifts with the tilt */}
                    <div
                        className="absolute left-1/2 top-1/2"
                        style={{
                            transform: 'translate(calc(-50% + var(--tx, 0) * 1px), calc(-50% + var(--ty, 0) * 1px))',
                            filter: locked ? 'brightness(0.12) saturate(0)' : 'drop-shadow(0 4px 6px rgba(0,0,0,0.5))',
                            opacity: locked ? 0.85 : 1,
                        }}
                    >
                        {card.spriteRef && <EnemySprite blueprintKey={card.spriteRef} scale={3} />}
                    </div>
                    <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse at center, transparent 55%, rgba(0,0,0,0.5) 100%)' }} />
                    <span className="absolute top-1.5 left-1.5 px-1.5 py-[2px] rounded text-[9px] font-bold uppercase tracking-wider text-white/80 bg-black/45">{zoneName(card.zone)}</span>
                    {locked && (
                        <div className="absolute inset-x-0 bottom-0 flex items-center justify-center gap-1.5 py-1.5 bg-black/60">
                            <PixelIcon name="lock" size={11} color="#fedf8c" />
                            <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: '#fedf8c' }}>Defeat to claim</span>
                        </div>
                    )}
                </div>

                {/* Type line */}
                <div className="flex items-center justify-between shrink-0" style={{ height: 22, padding: '0 8px', borderRadius: 5, background: 'linear-gradient(#3b3248, #2a2236)', boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.07)' }}>
                    <span className="text-gray-200 font-semibold truncate" style={{ fontSize: 11 }}>Boss · {card.title}</span>
                    <span className="flex items-center gap-1 shrink-0 ml-2">
                        <span style={{ width: 8, height: 8, transform: 'rotate(45deg)', background: rarity.accent, boxShadow: `0 0 0 1px rgba(0,0,0,0.5)` }} />
                        <span className="font-bold uppercase tracking-wider" style={{ fontSize: 9, color: rarity.accent }}>{rarity.label}</span>
                    </span>
                </div>

                {/* Text box */}
                <div className="flex-1 min-h-0 overflow-hidden" style={{ padding: '8px 10px', borderRadius: 5, background: 'linear-gradient(#2d2538, #241d2d)', boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.06)' }}>
                    {locked ? (
                        <p className="text-gray-400" style={{ fontSize: 11, lineHeight: '15px' }}>
                            A boss card is earned, never bought. It joins your album when this boss really falls to your work.
                        </p>
                    ) : (
                        <>
                            <p className="font-semibold text-white" style={{ fontSize: 10.5, lineHeight: '14px' }}>
                                <span style={{ color: rarity.accent }}>Mechanic · </span>{card.mechanic}
                            </p>
                            <div style={{ height: 1, margin: '6px 0', background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.18), transparent)' }} />
                            <p className="text-gray-400" style={{ fontSize: 10, lineHeight: '13px' }}>{card.lore}</p>
                        </>
                    )}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between shrink-0 text-gray-400" style={{ height: 14, fontSize: 9 }}>
                    <span className="truncate">
                        {locked ? 'Not yet defeated' : `Defeated ${dateLabel(card.lastDefeatedAt || card.obtainedAt)}${card.hero?.name ? ` · ${card.hero.name} Lv ${card.hero.level}` : ''}${card.defeats > 1 ? ` · ×${card.defeats}` : ''}`}
                    </span>
                    <span className="shrink-0 ml-2 font-pixel" style={{ fontSize: 12 }}>
                        {card.number ? `${String(card.number).padStart(2, '0')}/${String(card.total).padStart(2, '0')}` : 'Taskoria'}
                    </span>
                </div>
            </div>
            {!locked && <Foil strong={rarity.foil} />}
        </div>
    );
};

export const CardBack = () => (
    <div
        className="relative overflow-hidden"
        style={{ width: CARD_W, height: CARD_H, borderRadius: 16, padding: 9, background: 'linear-gradient(135deg, #8a6d2a 0%, #fedf8c 48%, #b8923a 100%)', boxShadow: '0 0 0 1px rgba(0,0,0,0.55)' }}
    >
        <div
            className="h-full flex flex-col items-center justify-center"
            style={{
                borderRadius: 9,
                background: '#2a2236',
                backgroundImage: 'repeating-linear-gradient(45deg, rgba(254,223,140,0.05) 0 2px, transparent 2px 14px), repeating-linear-gradient(-45deg, rgba(254,223,140,0.05) 0 2px, transparent 2px 14px)',
                boxShadow: 'inset 0 0 0 2px rgba(254,223,140,0.35), inset 0 0 0 5px #2a2236, inset 0 0 0 6px rgba(254,223,140,0.2)',
            }}
        >
            <img src="./ico_sinbg.svg" alt="" width={96} height={96} style={{ filter: 'drop-shadow(0 0 12px rgba(254,223,140,0.25))' }} />
            <span className="font-herald mt-4" style={{ fontSize: 26, color: '#fedf8c', lineHeight: 1 }}>Taskoria</span>
            <span className="mt-2 text-[10px] font-bold uppercase tracking-[0.3em] text-white/50">Bestiary</span>
        </div>
    </div>
);

// Static card for lists: the front, scaled to `width`.
const BossCard = ({ card, width = 150, locked = false, className = '' }) => {
    const k = width / CARD_W;
    return (
        <div className={className} style={{ width, height: CARD_H * k }}>
            <div style={{ width: CARD_W, height: CARD_H, transform: `scale(${k})`, transformOrigin: 'top left' }}>
                <CardFront card={card} locked={locked} />
            </div>
        </div>
    );
};

export default BossCard;
