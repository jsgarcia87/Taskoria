import React, { useState, useEffect, useRef } from 'react';
import ModernPixelAvatar from '../../common/ModernPixelAvatar';
import MobileJoystick from './MobileJoystick';
import { MAP_DATA } from './MapData';
import { expandPrefabs } from './prefabs';
import { SPRITES, PixelSprite, pixelBufferToDataUrl } from './sprites';
import { WorldSprite } from './worldProps';
import ChatModal from '../ChatModal';
import { X, MessageSquare } from 'lucide-react';

const TILE_SIZE = 40;
const SPEED = 5;
const NPC_SPEED = SPEED * 0.35; // ~1.75px/frame, more leisurely than player
const NPC_STOP_DIST = 5;

// Angled top-down (Pokémon Gen 3/4) collision: narrow band at the player's feet,
// not a full-body box. Lets you walk close to obstacles from the sides / above.
const FOOT_W = 26;
const FOOT_H = 14;

// Viewport culling — quantum for camera-position-triggered re-renders. Camera
// moves in single-pixel steps, but we only re-cull the decoration list when
// it crosses a CULL_CHUNK boundary. CULL_MARGIN is the buffer around the
// visible rectangle inside which decorations still render — keeps props from
// popping in at the screen edge during fast movement and covers offset from
// bottom-center / center anchoring on WorldSprite props.
const CULL_CHUNK = 240;
const CULL_MARGIN = 320;

// Avatars re-run their rect generation on every render. Memoize so they only
// re-render when their own props actually change (not when the world re-renders).
const MemoAvatar = ModernPixelAvatar;

// Self-contained dust layer. Owns its particle state so spawning dust does NOT
// re-render the whole world (which holds 150+ heavy SVG props). The game loop
// pushes particles imperatively via the ref; each one removes itself when its
// fade animation ends.
const DustParticles = React.forwardRef(function DustParticles(_props, ref) {
    const [particles, setParticles] = useState([]);
    const idRef = useRef(0);
    React.useImperativeHandle(ref, () => ({
        spawn(x, y) {
            const id = ++idRef.current;
            setParticles(prev => [...prev.slice(-9), { id, x, y }]);
            setTimeout(() => {
                setParticles(prev => prev.filter(p => p.id !== id));
            }, 700);
        },
    }), []);
    return (
        <>
            {particles.map(p => (
                <div
                    key={p.id}
                    className="absolute w-4 h-4 bg-white/20 rounded-full blur-md animate-dust"
                    style={{ left: p.x, top: p.y, transform: 'translate(-50%, -50%)', zIndex: 1 }}
                />
            ))}
        </>
    );
});

// Decorations don't change while the player walks around — only when the
// map itself changes. Isolating them behind React.memo means the (large)
// per-decoration switch + reconciliation is skipped on every movement-driven
// re-render (isMoving/facing/pos/nearTarget), which was the main source of
// Town lag — without this, ~150-250 decoration elements were fully re-diffed
// every time the player started/stopped walking or turned.
const DecorationsLayer = React.memo(function DecorationsLayer({ decorations }) {
    return (
        <>
            {decorations?.map((dec, i) => {
                    if (dec.type === 'rect') {
                        return (
                            <div key={`dec_${i}`} className="absolute shadow-xl" style={{ left: dec.x, top: dec.y, width: dec.width, height: dec.height, backgroundColor: dec.color, border: dec.border ? `4px solid ${dec.border}` : 'none', borderRadius: dec.radius || 0, opacity: dec.opacity || 1, zIndex: dec.z !== undefined ? dec.z : dec.y }}></div>
                        );
                    }
                    if (dec.type === 'pine_tree' || dec.type === 'oak_tree') {
                        const cx = dec.x + (dec.width || 80) / 2;
                        const by = dec.y + (dec.height || 120);
                        const sc = (dec.height || 120) / (dec.type === 'pine_tree' ? 72 : 64);
                        return (
                            <WorldSprite key={`dec_${i}`} name={dec.type} x={cx} y={by} scale={sc} sway />
                        );
                    }
                    if (dec.type === 'torch') {
                        return (
                            <div key={`dec_${i}`} className="absolute flex flex-col items-center" style={{ left: dec.x, top: dec.y, width: dec.size, height: dec.size * 2, zIndex: dec.y + dec.size * 2 }}>
                                <div className="w-[40%] h-[60%] bg-[#451a03] border-x-2 border-black/40 rounded-b-sm"></div>
                                <div className="w-full h-[40%] bg-orange-500 rounded-full animate-flicker shadow-[0_0_20px_rgba(249,115,22,0.8)]"></div>
                            </div>
                        );
                    }
                    if (dec.type === 'pillar') {
                        return (
                            <div key={`dec_${i}`} className="absolute flex flex-col items-center justify-end" style={{ left: dec.x, top: dec.y, width: dec.width, height: dec.height, zIndex: dec.y + dec.height }}>
                                <div className="w-full h-4 bg-gray-800 border-b-2 border-black/50"></div>
                                <div className="w-[80%] h-full bg-gray-700 border-x-4 border-gray-900 shadow-inner relative">
                                    <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/20 to-black/40"></div>
                                </div>
                                <div className="w-full h-6 bg-gray-800 border-t-4 border-gray-600 rounded-sm"></div>
                            </div>
                        );
                    }
                    if (dec.type === 'statue') {
                        const sz = dec.size || 80;
                        return (
                            <div key={`dec_${i}`} className="absolute pointer-events-none"
                                style={{ left: dec.x - sz / 2, top: dec.y - sz * 0.5, width: sz, height: sz * 1.5, zIndex: dec.y + sz }}>
                                <svg width={sz} height={sz * 1.5} viewBox="0 0 16 24" shapeRendering="crispEdges"
                                    style={{ imageRendering: 'pixelated', filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.6))' }}>
                                    <rect x="1" y="20" width="14" height="4" fill="#4a4a6a" />
                                    <rect x="2" y="19" width="12" height="1" fill="#6a6a8a" />
                                    <rect x="3" y="18" width="10" height="1" fill="#3a3a5a" />
                                    <rect x="5" y="14" width="6" height="4" fill="#545470" />
                                    <rect x="5" y="14" width="1" height="4" fill="#6a6a8a" />
                                    <rect x="4" y="9" width="8" height="5" fill="#585878" />
                                    <rect x="4" y="9" width="1" height="5" fill="#7a7a9a" />
                                    <rect x="11" y="9" width="1" height="5" fill="#3a3a5a" />
                                    <rect x="5" y="5" width="6" height="4" fill="#606080" />
                                    <rect x="5" y="5" width="1" height="4" fill="#808098" />
                                    <rect x="4" y="4" width="8" height="2" fill="#4a4a6a" />
                                    <rect x="5" y="3" width="6" height="2" fill="#585878" />
                                    <rect x="6" y="2" width="4" height="1" fill="#4a4a6a" />
                                    <rect x="2" y="10" width="3" height="4" fill="#4a4a6a" />
                                    <rect x="2" y="10" width="1" height="4" fill="#6a6a8a" />
                                    <rect x="3" y="11" width="1" height="2" fill="#c0a040" />
                                    <rect x="11" y="8" width="1" height="6" fill="#8a8aaa" />
                                    <rect x="10" y="9" width="3" height="1" fill="#6a6a8a" />
                                    <rect x="4" y="13" width="8" height="2" fill="#404060" />
                                    <rect x="0" y="23" width="16" height="1" fill="rgba(0,0,0,0.3)" />
                                </svg>
                            </div>
                        );
                    }
                    if (dec.type === 'throne') {
                        const sz = dec.size || 80;
                        return (
                            <div key={`dec_${i}`} className="absolute pointer-events-none"
                                style={{ left: dec.x - sz / 2, top: dec.y - sz, width: sz, height: sz, zIndex: dec.y }}>
                                <svg width={sz} height={sz} viewBox="0 0 16 16" shapeRendering="crispEdges"
                                    style={{ imageRendering: 'pixelated', filter: 'drop-shadow(0 0 12px rgba(251,191,36,0.4))' }}>
                                    <rect x="1" y="1" width="14" height="10" fill="#92400e" />
                                    <rect x="1" y="1" width="14" height="1" fill="#fbbf24" />
                                    <rect x="1" y="1" width="1" height="10" fill="#fbbf24" />
                                    <rect x="14" y="1" width="1" height="10" fill="#b45309" />
                                    <rect x="1" y="0" width="2" height="2" fill="#fbbf24" />
                                    <rect x="7" y="0" width="2" height="2" fill="#fbbf24" />
                                    <rect x="13" y="0" width="2" height="2" fill="#fbbf24" />
                                    <rect x="3" y="3" width="2" height="2" fill="#ef4444" />
                                    <rect x="7" y="3" width="2" height="2" fill="#3b82f6" />
                                    <rect x="11" y="3" width="2" height="2" fill="#10b981" />
                                    <rect x="1" y="11" width="14" height="4" fill="#7c2d12" />
                                    <rect x="1" y="11" width="14" height="1" fill="#b45309" />
                                    <rect x="0" y="14" width="16" height="2" fill="#7f1d1d" />
                                    <rect x="1" y="15" width="14" height="1" fill="#991b1b" />
                                </svg>
                            </div>
                        );
                    }
                    if (dec.type === 'text') {
                        if (dec.value === '💀') {
                            return (
                                <div key={`dec_${i}`} className="absolute pointer-events-none opacity-60" style={{ left: dec.x, top: dec.y, transform: 'translate(-50%, -50%)', zIndex: Math.floor(dec.y) }}>
                                    <svg width={dec.size || 24} height={dec.size || 24} viewBox="0 0 16 16">
                                        <rect x="2" y="2" width="12" height="10" fill="#cbd5e1" />
                                        <rect x="4" y="12" width="8" height="3" fill="#cbd5e1" />
                                        <rect x="5" y="6" width="2" height="2" fill="#1e293b" />
                                        <rect x="9" y="6" width="2" height="2" fill="#1e293b" />
                                        <rect x="7" y="10" width="2" height="1" fill="#1e293b" />
                                        <rect x="6" y="13" width="1" height="2" fill="#94a3b8" />
                                        <rect x="9" y="13" width="1" height="2" fill="#94a3b8" />
                                    </svg>
                                </div>
                            );
                        }
                        if (dec.value === '👑') {
                            return (
                                <div key={`dec_${i}`} className="absolute pointer-events-none drop-shadow-md" style={{ left: dec.x, top: dec.y, transform: 'translate(-50%, -50%)', zIndex: Math.floor(dec.y) }}>
                                    <svg width={dec.size || 48} height={dec.size || 48} viewBox="0 0 16 16">
                                        <rect x="2" y="6" width="12" height="8" fill="#fbbf24" />
                                        <rect x="2" y="4" width="2" height="2" fill="#fbbf24" />
                                        <rect x="7" y="3" width="2" height="3" fill="#fbbf24" />
                                        <rect x="12" y="4" width="2" height="2" fill="#fbbf24" />
                                        <rect x="2" y="12" width="12" height="2" fill="#d97706" />
                                        <rect x="5" y="8" width="2" height="2" fill="#ef4444" />
                                        <rect x="9" y="8" width="2" height="2" fill="#3b82f6" />
                                    </svg>
                                </div>
                            );
                        }
                        return <div key={`dec_${i}`} className={`absolute pointer-events-none font-heading font-bold ${dec.shadow ? 'drop-shadow-lg' : ''}`} style={{ left: dec.x, top: dec.y, fontSize: dec.size || 16, color: dec.color || 'white', transform: 'translate(-50%, -50%)', zIndex: Math.floor(dec.y), opacity: dec.opacity || 1 }}>{dec.value}</div>;
                    }
                    if (dec.type === 'emoji') return <div key={`dec_${i}`} className="absolute pointer-events-none" style={{ left: dec.x, top: dec.y, fontSize: dec.size || 24, transform: 'translate(-50%, -50%)', zIndex: Math.floor(dec.y) }}>{dec.value}</div>;
                    if (dec.type === 'mug') {
                        const sc = (dec.size || 40) / 20;
                        return <WorldSprite key={`dec_${i}`} name="mug" x={dec.x} y={dec.y + (dec.size || 40) / 2} scale={sc} shadow={false} />;
                    }
                    if (dec.type === 'stool') {
                        const sc = (dec.size || 30) / 18;
                        return <WorldSprite key={`dec_${i}`} name="stool" x={dec.x} y={dec.y + (dec.size || 30) / 2} scale={sc} />;
                    }
                    if (dec.type === 'fire') {
                        const sc = (dec.size || 60) / 48;
                        return (
                            <React.Fragment key={`dec_${i}`}>
                                <div className="absolute pointer-events-none rounded-full animate-flicker" style={{
                                    left: dec.x - 100, top: dec.y - 60, width: 200, height: 200,
                                    background: 'radial-gradient(circle, rgba(255,150,40,0.35) 0%, rgba(255,150,40,0) 65%)',
                                    zIndex: Math.floor(dec.y) - 1,
                                }} />
                                <WorldSprite name="fire" x={dec.x} y={dec.y + (dec.size || 60) / 2} scale={sc} />
                            </React.Fragment>
                        );
                    }
                    if (dec.type === 'bartender_npc') return (
                        <div key={`dec_${i}`} className="absolute flex flex-col items-center" style={{ left: dec.x, top: dec.y, transform: 'translate(-50%, -100%)', zIndex: Math.floor(dec.y) }}>
                            <div className="bg-black/60 text-white text-[8px] px-2 py-0.5 rounded-full mb-1 border border-white/10 font-bold uppercase tracking-wider">Tavern Keeper</div>
                            <div className="animate-world-bob">
                                <ModernPixelAvatar type="monk" scale={1.1} customColors={{ primary: '#e8e8e8', primaryDark: '#c0c8d0', skin: '#d49060' }} />
                            </div>
                            <div className="w-8 h-2 bg-black/40 rounded-full blur-sm mt-[-4px]" />
                        </div>
                    );
                    if (dec.type === 'ledgar_npc') return (
                        // Archivist Ledgar of the Parchment — Council member for bug reports.
                        // Scholarly parchment/burgundy palette; a floating quill hovers to signal
                        // "he's the one who writes things down" without an extra sprite.
                        <div key={`dec_${i}`} className="absolute flex flex-col items-center" style={{ left: dec.x, top: dec.y, transform: 'translate(-50%, -100%)', zIndex: Math.floor(dec.y) }}>
                            <div className="bg-black/70 text-rpg-gold text-[8px] px-2 py-0.5 rounded-full mb-1 border border-rpg-gold/40 font-bold uppercase tracking-wider">Archivist Ledgar</div>
                            <div className="animate-world-bob relative">
                                <ModernPixelAvatar
                                    type="mage"
                                    scale={1.05}
                                    customColors={{ primary: '#8b3a2a', primaryDark: '#5a2418', skin: '#f0c090', hair: '#4a3020' }}
                                />
                                {/* Floating quill — pixel diamond that gently bobs. Marks him as
                                    "the scribe" at a glance across a full tavern. */}
                                <div className="absolute -top-1 -right-2 text-[10px] leading-none rotate-[-25deg] animate-pulse text-rpg-gold/90 select-none">✒</div>
                            </div>
                            <div className="w-8 h-2 bg-black/40 rounded-full blur-sm mt-[-4px]" />
                        </div>
                    );

                    if (dec.type === 'well') {
                        const cx = dec.x + (dec.width || 96) / 2;
                        const by = dec.y + (dec.height || 96);
                        const sc = (dec.height || 96) / 36;
                        return <WorldSprite key={`dec_${i}`} name="well" x={cx} y={by} scale={sc} />;
                    }

                    if (dec.type === 'shop_building') {
                        const cx = dec.x + (dec.width || 280) / 2;
                        const by = dec.y + (dec.height || 150);
                        const sc = (dec.height || 150) / 60;
                        return <WorldSprite key={`dec_${i}`} name="shop_building" x={cx} y={by} scale={sc} />;
                    }

                    if (dec.type === 'market_stall') {
                        const cx = dec.x + (dec.width || 130) / 2;
                        const by = dec.y + (dec.height || 96);
                        const sc = (dec.height || 96) / 40;
                        const variant = dec.color === '#16a34a' ? 'market_stall_green'
                            : dec.color === '#7c3aed' ? 'market_stall_purple'
                            : 'market_stall_red';
                        return <WorldSprite key={`dec_${i}`} name={variant} x={cx} y={by} scale={sc} />;
                    }

                    if (dec.type === 'fence') {
                        // Tile the fence sprite along the requested length
                        const horizontal = (dec.width || 0) >= (dec.height || 0);
                        const len = horizontal ? (dec.width || 32) : (dec.height || 32);
                        const sc = (horizontal ? (dec.height || 16) : (dec.width || 16)) / 18;
                        const segPx = 32 * sc;
                        const segs = Math.max(1, Math.ceil(len / segPx));
                        const items = [];
                        for (let s = 0; s < segs; s++) {
                            const offset = s * segPx;
                            const sx = horizontal ? (dec.x + offset + segPx / 2) : (dec.x + (dec.width || 16) / 2);
                            const sy = horizontal ? (dec.y + (dec.height || 16)) : (dec.y + offset + segPx);
                            items.push(<WorldSprite key={`fence_${i}_${s}`} name="fence" x={sx} y={sy} scale={sc} shadow={false} />);
                        }
                        return <React.Fragment key={`dec_${i}`}>{items}</React.Fragment>;
                    }

                    if (dec.type === 'sign') {
                        return <WorldSprite key={`dec_${i}`} name="sign" x={dec.x} y={dec.y + 4} scale={1.2} />;
                    }

                    if (dec.type === 'barrel') {
                        const sc = (dec.size || 38) / 24;
                        return <WorldSprite key={`dec_${i}`} name="barrel" x={dec.x} y={dec.y} scale={sc} />;
                    }

                    if (dec.type === 'crate') {
                        const sc = (dec.size || 42) / 20;
                        return <WorldSprite key={`dec_${i}`} name="crate" x={dec.x} y={dec.y} scale={sc} />;
                    }

                    if (dec.type === 'lamp') {
                        const sc = (dec.size || 64) / 32;
                        return (
                            <React.Fragment key={`dec_${i}`}>
                                <div className="absolute pointer-events-none rounded-full animate-flicker" style={{
                                    left: dec.x - 60, top: dec.y - dec.size * sc + 6, width: 120, height: 120,
                                    background: 'radial-gradient(circle, rgba(253,224,71,0.45) 0%, rgba(253,224,71,0) 65%)',
                                    zIndex: Math.floor(dec.y) - 1,
                                }} />
                                <WorldSprite name="lamp" x={dec.x} y={dec.y} scale={sc} />
                            </React.Fragment>
                        );
                    }

                    if (dec.type === 'flowers') {
                        const sc = (dec.size || 30) / 28;
                        return <WorldSprite key={`dec_${i}`} name="flowers" x={dec.x} y={dec.y} scale={sc} shadow={false} />;
                    }

                    if (dec.type === 'bush') {
                        const sc = (dec.size || 50) / 32;
                        return <WorldSprite key={`dec_${i}`} name="bush" x={dec.x} y={dec.y} scale={sc} sway />;
                    }

                    if (dec.type === 'bench') {
                        const sc = (dec.size || 60) / 36;
                        return <WorldSprite key={`dec_${i}`} name="bench" x={dec.x} y={dec.y} scale={sc} />;
                    }

                    if (dec.type === 'table') {
                        const cx = dec.x + (dec.width || 120) / 2;
                        const by = dec.y + (dec.height || 80);
                        const sc = (dec.width || 120) / 56;
                        return <WorldSprite key={`dec_${i}`} name="table" x={cx} y={by} scale={sc} />;
                    }

                    if (dec.type === 'bar_counter') {
                        const cx = dec.x + (dec.width || 400) / 2;
                        const by = dec.y + (dec.height || 80);
                        const sc = (dec.width || 400) / 100;
                        return <WorldSprite key={`dec_${i}`} name="bar_counter" x={cx} y={by} scale={sc} shadow={false} />;
                    }

                    if (dec.type === 'banner') {
                        // Banner hangs from the wall — anchor is top-center
                        const variant = dec.color === '#fbbf24' ? 'banner_gold'
                            : dec.color === '#dc2626' ? 'banner_red'
                            : dec.color === '#7c3aed' ? 'banner_purple'
                            : 'banner_blue';
                        const sc = 2;
                        return <WorldSprite key={`dec_${i}`} name={variant} x={dec.x} y={dec.y + 32 * sc} scale={sc} shadow={false} />;
                    }

                    if (dec.type === 'critter') {
                        const c = dec.color || '#22c55e';
                        return (
                            <div key={`dec_${i}`} className="absolute pointer-events-none animate-world-bob" style={{ left: dec.x, top: dec.y, transform: 'translate(-50%, -100%)', zIndex: Math.floor(dec.y) }}>
                                {dec.variant === 'slime' ? (
                                    <div className="relative w-7 h-6 rounded-[45%] shadow" style={{ backgroundColor: c }}>
                                        <div className="absolute top-2 left-1.5 w-1 h-1 bg-black rounded-full" />
                                        <div className="absolute top-2 right-1.5 w-1 h-1 bg-black rounded-full" />
                                    </div>
                                ) : dec.variant === 'cat' ? (
                                    <div className="relative w-7 h-6">
                                        <div className="absolute top-0 left-0 w-2 h-2" style={{ backgroundColor: c, clipPath: 'polygon(0 100%,50% 0,100% 100%)' }} />
                                        <div className="absolute top-0 right-0 w-2 h-2" style={{ backgroundColor: c, clipPath: 'polygon(0 100%,50% 0,100% 100%)' }} />
                                        <div className="absolute bottom-0 w-full h-4 rounded-md" style={{ backgroundColor: c }} />
                                        <div className="absolute bottom-1.5 left-1.5 w-1 h-1 bg-black rounded-full" />
                                        <div className="absolute bottom-1.5 right-1.5 w-1 h-1 bg-black rounded-full" />
                                    </div>
                                ) : (
                                    <div className="relative w-8 h-6">
                                        <div className="absolute top-0 left-0 w-2.5 h-3 rounded-md" style={{ backgroundColor: c }} />
                                        <div className="absolute bottom-0 w-full h-4 rounded-md" style={{ backgroundColor: c }} />
                                        <div className="absolute bottom-1.5 left-1 w-1 h-1 bg-black rounded-full" />
                                    </div>
                                )}
                                <div className="w-6 h-1.5 bg-black/30 rounded-full blur-[1px] mx-auto" />
                            </div>
                        );
                    }

                    if (dec.type === 'sprite') {
                        // Render a hand-drawn pixel sprite from the SPRITES registry.
                        // dec.name = registry key; dec.scale = pixels per source-pixel (default 4)
                        // anchor: 'bottom' (default, feet at dec.y) | 'center' | 'top'
                        const buffer = SPRITES[dec.name];
                        if (!buffer) return null;
                        const scale = dec.scale || 4;
                        const px = 64 * scale;
                        const anchor = dec.anchor || 'bottom';
                        const transform = anchor === 'center'
                            ? 'translate(-50%, -50%)'
                            : anchor === 'top'
                                ? 'translate(-50%, 0)'
                                : 'translate(-50%, -100%)';
                        return (
                            <div
                                key={`dec_${i}`}
                                className={`absolute pointer-events-none ${dec.animate || ''}`}
                                style={{ left: dec.x, top: dec.y, width: px, height: px, transform, zIndex: dec.z !== undefined ? dec.z : Math.floor(dec.y) }}
                            >
                                <PixelSprite buffer={buffer} scale={scale} />
                            </div>
                        );
                    }

                    if (dec.type === 'lantern_glow') {
                        // Soft warm glow on the ground beneath a lamp/torch
                        const r = dec.radius || 110;
                        return (
                            <div
                                key={`dec_${i}`}
                                className="absolute pointer-events-none animate-flicker"
                                style={{
                                    left: dec.x, top: dec.y,
                                    width: r * 2, height: r * 2,
                                    transform: 'translate(-50%, -50%)',
                                    background: `radial-gradient(circle, ${dec.color || 'rgba(253,224,71,0.35)'} 0%, transparent 65%)`,
                                    mixBlendMode: 'screen',
                                    zIndex: dec.z !== undefined ? dec.z : 2
                                }}
                            />
                        );
                    }

                    if (dec.type === 'cobble_patch') {
                        // A small worn stone patch breaking the ground monotony
                        return (
                            <div
                                key={`dec_${i}`}
                                className="absolute pointer-events-none"
                                style={{
                                    left: dec.x, top: dec.y,
                                    width: dec.width || 120, height: dec.height || 80,
                                    transform: 'translate(-50%, -50%)',
                                    backgroundColor: dec.color || '#6b5240',
                                    backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.08) 1px, transparent 2px), radial-gradient(circle, rgba(0,0,0,0.25) 1px, transparent 2px)',
                                    backgroundSize: '10px 10px, 14px 14px',
                                    backgroundPosition: '0 0, 7px 7px',
                                    borderRadius: dec.radius || '50%',
                                    boxShadow: 'inset 0 0 18px rgba(0,0,0,0.55)',
                                    opacity: dec.opacity ?? 0.7,
                                    zIndex: dec.z !== undefined ? dec.z : 1
                                }}
                            />
                        );
                    }

                    if (dec.type === 'puddle') {
                        return (
                            <div
                                key={`dec_${i}`}
                                className="absolute pointer-events-none"
                                style={{
                                    left: dec.x, top: dec.y,
                                    width: dec.size || 60, height: (dec.size || 60) * 0.55,
                                    transform: 'translate(-50%, -50%)',
                                    background: 'radial-gradient(ellipse at center, rgba(96,165,250,0.45) 0%, rgba(30,58,138,0.35) 60%, transparent 80%)',
                                    borderRadius: '50%',
                                    boxShadow: 'inset 0 2px 4px rgba(255,255,255,0.25), inset 0 -2px 4px rgba(0,0,0,0.4)',
                                    zIndex: dec.z !== undefined ? dec.z : 1
                                }}
                            />
                        );
                    }

                    if (dec.type === 'crack') {
                        // A thin crack line on the ground
                        const angle = dec.angle || 0;
                        return (
                            <div
                                key={`dec_${i}`}
                                className="absolute pointer-events-none"
                                style={{
                                    left: dec.x, top: dec.y,
                                    width: dec.length || 60, height: 2,
                                    transform: `translate(-50%, -50%) rotate(${angle}deg)`,
                                    background: 'linear-gradient(90deg, transparent, rgba(0,0,0,0.7) 30%, rgba(0,0,0,0.85) 60%, transparent)',
                                    borderRadius: '2px',
                                    zIndex: dec.z !== undefined ? dec.z : 1
                                }}
                            />
                        );
                    }

                    if (dec.type === 'planter') {
                        const cx = dec.x + (dec.width || 60) / 2;
                        const by = dec.y + (dec.height || 36);
                        const sc = (dec.width || 60) / 32;
                        return <WorldSprite key={`dec_${i}`} name="planter" x={cx} y={by} scale={sc} />;
                    }

                    if (dec.type === 'hay') {
                        const sc = (dec.size || 48) / 28;
                        return <WorldSprite key={`dec_${i}`} name="hay" x={dec.x} y={dec.y} scale={sc} />;
                    }

                    if (dec.type === 'rug') {
                        // Entry rug
                        return (
                            <div
                                key={`dec_${i}`}
                                className="absolute pointer-events-none"
                                style={{
                                    left: dec.x, top: dec.y,
                                    width: dec.width || 80, height: dec.height || 50,
                                    transform: 'translate(-50%, -50%)',
                                    backgroundColor: dec.color || '#7f1d1d',
                                    backgroundImage: 'repeating-linear-gradient(90deg, rgba(0,0,0,0.0) 0 8px, rgba(0,0,0,0.18) 8px 10px), linear-gradient(180deg, rgba(255,255,255,0.08), transparent)',
                                    border: '3px solid #fbbf24',
                                    borderRadius: '4px',
                                    boxShadow: '0 2px 6px rgba(0,0,0,0.55)',
                                    opacity: 0.92,
                                    zIndex: dec.z !== undefined ? dec.z : 1
                                }}
                            />
                        );
                    }

                    if (dec.type === 'weapon_rack') {
                        const w = dec.width || 60, h = dec.height || 70;
                        const cx = dec.x + w / 2;
                        const by = dec.y + h;
                        const sc = h / 32;
                        return <WorldSprite key={`dec_${i}`} name="weapon_rack" x={cx} y={by} scale={sc} />;
                    }

                    if (dec.type === 'tree') {
                        const w = dec.width || 70, h = dec.height || 90;
                        const cx = dec.x + w / 2;
                        const by = dec.y + h;
                        const sc = h / 64;
                        return <WorldSprite key={`dec_${i}`} name="oak_tree" x={cx} y={by} scale={sc} sway />;
                    }

                    if (dec.type === 'vendor_npc') {
                        return (
                            <div key={`dec_${i}`} className="absolute flex flex-col items-center" style={{ left: dec.x, top: dec.y, transform: 'translate(-50%, -100%)', zIndex: Math.floor(dec.y) }}>
                                <div className="text-rpg-gold text-lg font-black animate-bounce drop-shadow mb-0.5">!</div>
                                <div className="bg-black/60 text-white text-[8px] px-2 py-0.5 rounded-full mb-1 border border-white/10 font-bold uppercase tracking-wider whitespace-nowrap">{dec.label}</div>
                                <div className="animate-world-bob">
                                    <ModernPixelAvatar type={dec.avatar || 'monk'} scale={1.1} customColors={dec.colors} />
                                </div>
                                <div className="w-8 h-2 bg-black/40 rounded-full blur-sm mt-[-4px]" />
                            </div>
                        );
                    }

                    return null;
            })}
        </>
    );
});

// Portals are static per map — memoized for the same reason as decorations.
const PortalsLayer = React.memo(function PortalsLayer({ portals }) {
    return (
        <>
            {portals?.map((portal, i) => (
                    <div
                        key={`portal_${i}`}
                        className="absolute flex items-center justify-center pointer-events-none"
                        style={{ left: portal.x, top: portal.y, width: portal.width, height: portal.height, zIndex: portal.y }}
                    >
                        <div className="w-full h-full border-2 border-dashed border-white/50 rounded-lg animate-pulse shadow-[0_0_15px_rgba(255,255,255,0.3)] bg-white/5 flex flex-col items-center justify-center">
                            <span className="text-[8px] font-bold text-white uppercase tracking-tighter opacity-70 mb-1">Portal</span>
                            <span className="text-[10px] font-bold text-rpg-gold text-shadow-glow whitespace-nowrap">{portal.label}</span>
                        </div>
                    </div>
            ))}
        </>
    );
});

// NPC list only changes on map/family/friends change (movement is applied via
// direct DOM refs in the game loop, not state) — memoized so it doesn't get
// re-diffed on every player movement re-render either.
const NpcLayer = React.memo(function NpcLayer({ npcs, npcDOMRefs, onSelectNpc }) {
    return (
        <>
            {npcs.map(npc => {
                    const npcChar = npc.state?.character || npc.character;
                    const isAsleep = !npc.is_online;
                    return (
                        <div
                            key={npc.id}
                            ref={el => { if (el) npcDOMRefs.current[npc.id] = el; else delete npcDOMRefs.current[npc.id]; }}
                            className="absolute will-change-transform cursor-pointer group"
                            onClick={() => onSelectNpc(npc)}
                            style={{ left: npc.x, top: npc.y, transform: 'translate(-50%, -100%)', zIndex: Math.round(npc.y) }}
                        >
                            <div className="flex flex-col items-center relative">
                                {/* Floating Z's for sleeping (offline) friends */}
                                {isAsleep && (
                                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 pointer-events-none select-none" aria-hidden="true">
                                        <span className="sleep-z sleep-z-1 text-rpg-gold font-heading font-black text-base">z</span>
                                        <span className="sleep-z sleep-z-2 text-rpg-gold/80 font-heading font-black text-sm">z</span>
                                        <span className="sleep-z sleep-z-3 text-rpg-gold/60 font-heading font-black text-xs">z</span>
                                    </div>
                                )}
                                <div className={`text-[9px] px-2 py-0.5 rounded-full font-bold mb-1 border whitespace-nowrap transition-colors ${
                                    isAsleep
                                      ? 'bg-black/40 text-gray-400 border-white/5 italic'
                                      : 'bg-black/60 text-white border-white/10 group-hover:border-rpg-gold/50 group-hover:bg-rpg-gold/10 group-hover:text-rpg-gold'
                                }`}>
                                    {npc.username || npc.name}{isAsleep && ' · zzz'}
                                </div>
                                <div
                                    className={`npc-facing-wrapper ${isAsleep ? '' : 'animate-world-bob'}`}
                                    style={{
                                        transform: npc.facing === 'left' ? 'scaleX(-1)' : 'scaleX(1)',
                                        filter: isAsleep ? 'brightness(0.6) saturate(0.7)' : 'none',
                                        opacity: isAsleep ? 0.75 : 1,
                                    }}
                                >
                                    <MemoAvatar type={npcChar?.avatarId || 'warrior'} scale={1.0} customColors={npcChar?.avatarColors} />
                                </div>
                                <div className="w-8 h-2 bg-black/40 rounded-full blur-sm mt-[-4px]" />
                            </div>
                        </div>
                    );
            })}
        </>
    );
});

const PlayableWorld = ({ currentUser, activeProfile, familyMembers, friends, onClose, onInteract, className }) => {
    // Engine State
    const [currentMapId, setCurrentMapId] = useState('townSquare');
    // Resolve the map with any prefab placements expanded into raw decorations
    // and obstacles. Memoised so we don't re-expand on every render.
    const map = React.useMemo(() => {
        const raw = MAP_DATA[currentMapId];
        if (!raw) return raw;
        if (!raw.prefabs || raw.prefabs.length === 0) return raw;
        const expanded = expandPrefabs(raw.prefabs);
        return {
            ...raw,
            decorations: [...(raw.decorations || []), ...expanded.decorations],
            obstacles: [...(raw.obstacles || []), ...expanded.obstacles],
        };
    }, [currentMapId]);

    // Player State
    const [pos, setPos] = useState({ x: map?.spawn?.x || 0, y: map?.spawn?.y || 0 });
    const [facing, setFacing] = useState('right');
    const [isMoving, setIsMoving] = useState(false);

    // Input Refs (read in 60fps loop, no React state overhead)
    const keys = useRef({ w: false, a: false, s: false, d: false });
    const joyInput = useRef({ x: 0, y: 0 });
    const viewportRef = useRef(null);
    const viewportSizeRef = useRef({ w: 600, h: 400 });
    const posRef = useRef(pos);
    const mapDOMRef = useRef(null);
    const playerDOMRef = useRef(null);
    const isMovingRef = useRef(false);
    const facingRef = useRef('right');
    // When a teleport spawns the player INSIDE the destination portal's hitbox,
    // the next frame would re-trigger the portal and bounce them back. We arm
    // this cooldown after every teleport and release it only once the player
    // has stepped OUT of every portal on the current map.
    const portalCooldownRef = useRef(true);
    const dustRef = useRef(null);

    // Fade State for Map Transitions
    const [fadeState, setFadeState] = useState('none');
    // Mirror fadeState in a ref so the game loop can read it without being
    // listed as an effect dependency (which would tear down & rebuild the RAF
    // loop on every transition).
    const fadeStateRef = useRef('none');
    useEffect(() => { fadeStateRef.current = fadeState; }, [fadeState]);

    // NPC State
    const [npcs, setNpcs] = useState([]);
    const npcDataRef = useRef({});  // { [id]: { x, y, tx, ty, facing, waitUntil } } — mutable, read in loop
    const npcDOMRefs = useRef({});  // { [id]: HTMLElement } — DOM refs for direct position updates

    // Interaction State
    const [selectedNpc, setSelectedNpc] = useState(null);
    const [chatNpc, setChatNpc] = useState(null);

    // Viewport culling — track which chunk of the map is visible so the
    // decoration layer can render only the props inside (plus a margin) and
    // skip the rest. State updates only when the camera crosses a chunk
    // boundary, so this adds ~one re-render per second of walking, not per
    // frame. Bigger CULL_CHUNK = fewer re-renders + more over-render;
    // 240 px is a sweet spot for the current map scales.
    const [visibleChunk, setVisibleChunk] = useState({ x: 0, y: 0 });
    const visibleChunkRef = useRef({ x: -999, y: -999 });

    // Filtered decoration list — only what falls inside the visible chunk's
    // rectangle plus CULL_MARGIN. AABB test uses whatever size the decoration
    // exposes (width/height/size/length) with a small padding to catch the
    // bottom-center anchor used by WorldSprite props. Big floor rects (roads,
    // rugs) survive naturally because their width extends across the whole map.
    const visibleDecorations = React.useMemo(() => {
        if (!map?.decorations) return null;
        const viewW = viewportSizeRef.current.w || 800;
        const viewH = viewportSizeRef.current.h || 600;
        const camX = visibleChunk.x * CULL_CHUNK;
        const camY = visibleChunk.y * CULL_CHUNK;
        const minX = camX - CULL_MARGIN;
        const maxX = camX + viewW + CULL_MARGIN;
        const minY = camY - CULL_MARGIN;
        const maxY = camY + viewH + CULL_MARGIN;
        return map.decorations.filter(d => {
            const x = d.x ?? 0;
            const y = d.y ?? 0;
            const w = d.width || d.size || d.length || (d.radius ? d.radius * 2 : 100);
            const h = d.height || d.size || (d.radius ? d.radius * 2 : 100);
            // AABB overlap: dec box [x, x+w] × [y, y+h] vs visible box.
            // Padded upward to account for bottom-center anchoring on sprites
            // (their visual extends up-and-left from the anchor point).
            return (x + w) >= minX && (x - w) <= maxX &&
                   (y + h) >= minY && (y - h) <= maxY;
        });
    }, [map, visibleChunk]);

    // Proximity interaction (shop / pet sanctuary zones)
    const [nearTarget, setNearTarget] = useState(null);
    const nearTargetRef = useRef(null);
    const onInteractRef = useRef(onInteract);
    useEffect(() => { onInteractRef.current = onInteract; });
    const triggerInteract = () => {
        const target = nearTargetRef.current;
        if (target && onInteractRef.current) onInteractRef.current(target);
    };

    // Keep posRef synced for the game loop
    useEffect(() => { posRef.current = pos; }, [pos]);

    // On map change: spawn NPCs + seed their wandering data
    useEffect(() => {
        const currentMap = MAP_DATA[currentMapId];
        if (!currentMap) return;
        setSelectedNpc(null);

        const allOthers = [...(familyMembers || []), ...(friends || [])];

        const generatedNpcs = allOthers.map(u => {
            const x = 200 + Math.random() * (currentMap.width - 400);
            const y = 200 + Math.random() * (currentMap.height - 400);
            return { ...u, x, y, facing: Math.random() > 0.5 ? 'right' : 'left' };
        });

        setNpcs(generatedNpcs);

        // Seed movement data in ref (not state — no re-renders during wandering)
        const newNpcData = {};
        generatedNpcs.forEach(npc => {
            newNpcData[npc.id] = {
                x: npc.x,
                y: npc.y,
                tx: 150 + Math.random() * (currentMap.width - 300),
                ty: 150 + Math.random() * (currentMap.height - 300),
                facing: npc.facing,
                waitUntil: null,
                isOnline: !!npc.is_online, // gated: offline NPCs don't wander
            };
        });
        npcDataRef.current = newNpcData;
    }, [currentMapId, familyMembers, friends]);

    // Keyboard Listeners
    useEffect(() => {
        const down = (e) => {
            if (e.code) keys.current[e.code] = true;
            if (e.key) keys.current[e.key.toLowerCase()] = true;
            if (e.key && e.key.toLowerCase() === 'e') triggerInteract();
        };
        const up = (e) => {
            if (e.code) keys.current[e.code] = false;
            if (e.key) keys.current[e.key.toLowerCase()] = false;
        };
        window.addEventListener('keydown', down);
        window.addEventListener('keyup', up);
        return () => { window.removeEventListener('keydown', down); window.removeEventListener('keyup', up); };
    }, []);

    // Foot hitbox — narrow band anchored at the player's feet (pos.y).
    // In angled top-down the player collides with what their FEET touch,
    // not what their head/body overlaps.
    const checkCollision = (newX, newY, mapRef) => {
        const pLeft = newX - FOOT_W / 2;
        const pRight = newX + FOOT_W / 2;
        const pTop = newY - FOOT_H;
        const pBottom = newY;
        for (const obs of mapRef.obstacles) {
            if (pRight > obs.x && pLeft < obs.x + obs.width && pBottom > obs.y && pTop < obs.y + obs.height) return true;
        }
        return false;
    };

    // Portal collision check
    const checkPortals = (x, y, mapRef) => {
        for (const portal of mapRef.portals) {
            if (x > portal.x && x < portal.x + portal.width && y > portal.y && y < portal.y + portal.height) return portal;
        }
        return null;
    };

    // Nearest interaction zone within its radius (shop / pet sanctuary)
    const checkInteractables = (x, y, mapRef) => {
        if (!mapRef.interactables) return null;
        for (const it of mapRef.interactables) {
            const cx = it.x + it.width / 2;
            const cy = it.y + it.height / 2;
            if (Math.hypot(x - cx, y - cy) < (it.radius || 90)) return it;
        }
        return null;
    };

    // Camera utility — shared between moving and idle branches
    const updateCamera = (px, py, currentMap) => {
        if (!mapDOMRef.current || viewportSizeRef.current.w <= 0) return;
        const viewW = viewportSizeRef.current.w;
        const viewH = viewportSizeRef.current.h;
        let camX = Math.max(0, Math.min(currentMap.width - viewW, px - viewW / 2));
        let camY = Math.max(0, Math.min(currentMap.height - viewH, py - viewH / 2));
        mapDOMRef.current.style.transform = `translate3d(-${camX}px, -${camY}px, 0)`;
        // Culling: only trigger a React update when the camera crosses a
        // chunk boundary. Cheap per-frame arithmetic; near-zero re-renders.
        const cx = Math.floor(camX / CULL_CHUNK);
        const cy = Math.floor(camY / CULL_CHUNK);
        if (cx !== visibleChunkRef.current.x || cy !== visibleChunkRef.current.y) {
            visibleChunkRef.current = { x: cx, y: cy };
            setVisibleChunk({ x: cx, y: cy });
        }
    };

    // Viewport resize observer
    useEffect(() => {
        if (!viewportRef.current) return;
        viewportSizeRef.current = { w: viewportRef.current.clientWidth, h: viewportRef.current.clientHeight };
        const ro = new ResizeObserver(entries => {
            for (const e of entries) viewportSizeRef.current = { w: e.contentRect.width, h: e.contentRect.height };
            // Keep the player framed when the playable area is resized (orientation, layout shifts)
            updateCamera(posRef.current.x, posRef.current.y, MAP_DATA[currentMapId]);
        });
        ro.observe(viewportRef.current);
        return () => ro.disconnect();
    }, [currentMapId]);

    // MAIN GAME LOOP (60fps)
    useEffect(() => {
        let rafId;
        let lastParticleTime = 0;

        const loop = (timestamp) => {
            const currentMap = MAP_DATA[currentMapId];
            if (!currentMap) { rafId = requestAnimationFrame(loop); return; }

            // --- Player input ---
            let dx = 0, dy = 0;
            if (keys.current['KeyW'] || keys.current['ArrowUp'] || keys.current['w']) dy -= 1;
            if (keys.current['KeyS'] || keys.current['ArrowDown'] || keys.current['s']) dy += 1;
            if (keys.current['KeyA'] || keys.current['ArrowLeft'] || keys.current['a']) dx -= 1;
            if (keys.current['KeyD'] || keys.current['ArrowRight'] || keys.current['d']) dx += 1;
            if (joyInput.current.x !== 0 || joyInput.current.y !== 0) { dx = joyInput.current.x; dy = joyInput.current.y; }

            // Normalize diagonal (keyboard only)
            if (dx !== 0 && dy !== 0 && joyInput.current.x === 0) {
                const len = Math.sqrt(dx * dx + dy * dy);
                dx /= len; dy /= len;
            }

            if (dx !== 0 || dy !== 0) {
                let nx = Math.max(TILE_SIZE, Math.min(currentMap.width - TILE_SIZE, posRef.current.x + dx * SPEED));
                let ny = Math.max(TILE_SIZE, Math.min(currentMap.height - TILE_SIZE, posRef.current.y + dy * SPEED));
                if (!checkCollision(nx, posRef.current.y, currentMap)) posRef.current.x = nx;
                if (!checkCollision(posRef.current.x, ny, currentMap)) posRef.current.y = ny;

                // Dust particles — pushed into the isolated dust layer so they
                // don't re-render the whole world while walking.
                if (timestamp - lastParticleTime > 150) {
                    dustRef.current?.spawn(posRef.current.x, posRef.current.y);
                    lastParticleTime = timestamp;
                }

                if (playerDOMRef.current) {
                    playerDOMRef.current.style.left = `${posRef.current.x}px`;
                    playerDOMRef.current.style.top = `${posRef.current.y}px`;
                    playerDOMRef.current.style.zIndex = Math.round(posRef.current.y);
                }

                if (!isMovingRef.current) { isMovingRef.current = true; setIsMoving(true); }
                if (dx > 0 && facingRef.current !== 'right') { facingRef.current = 'right'; setFacing('right'); }
                if (dx < 0 && facingRef.current !== 'left') { facingRef.current = 'left'; setFacing('left'); }

                updateCamera(posRef.current.x, posRef.current.y, currentMap);

                const portal = checkPortals(posRef.current.x, posRef.current.y, currentMap);
                if (portal) {
                    // After teleport the player can spawn inside the destination
                    // portal's hitbox; suppress triggers until they've walked out.
                    if (portalCooldownRef.current) {
                        // still inside a portal — keep cooldown armed
                    } else if (fadeStateRef.current === 'none') {
                        portalCooldownRef.current = true;
                        setFadeState('exit');
                        setTimeout(() => {
                            setCurrentMapId(portal.targetMap);
                            setPos({ x: portal.targetX, y: portal.targetY });
                            posRef.current = { x: portal.targetX, y: portal.targetY };
                            setFadeState('enter');
                            setTimeout(() => setFadeState('none'), 400);
                        }, 400);
                    }
                } else if (portalCooldownRef.current) {
                    // Player has cleared all portal hitboxes — re-arm portal triggers
                    portalCooldownRef.current = false;
                }
            } else {
                if (isMovingRef.current) { isMovingRef.current = false; setIsMoving(false); setPos({ ...posRef.current }); }
                updateCamera(posRef.current.x, posRef.current.y, currentMap);
            }

            // --- NPC wandering (DOM-direct, no setState) ---
            for (const [id, data] of Object.entries(npcDataRef.current)) {
                if (!data.isOnline) continue; // offline NPCs are asleep — no movement
                const ndx = data.tx - data.x;
                const ndy = data.ty - data.y;
                const dist = Math.sqrt(ndx * ndx + ndy * ndy);

                if (dist < NPC_STOP_DIST) {
                    // Arrived — wait, then pick new target
                    if (!data.waitUntil) data.waitUntil = timestamp + 1500 + Math.random() * 2500;
                    if (timestamp > data.waitUntil) {
                        data.waitUntil = null;
                        data.tx = 150 + Math.random() * (currentMap.width - 300);
                        data.ty = 150 + Math.random() * (currentMap.height - 300);
                    }
                } else {
                    data.waitUntil = null;
                    data.x += (ndx / dist) * NPC_SPEED;
                    data.y += (ndy / dist) * NPC_SPEED;

                    const newFacing = ndx > 0 ? 'right' : 'left';
                    if (newFacing !== data.facing) {
                        data.facing = newFacing;
                        const domEl = npcDOMRefs.current[id];
                        if (domEl) {
                            const wrapper = domEl.querySelector('.npc-facing-wrapper');
                            if (wrapper) wrapper.style.transform = newFacing === 'left' ? 'scaleX(-1)' : 'scaleX(1)';
                        }
                    }

                    const domEl = npcDOMRefs.current[id];
                    if (domEl) {
                        domEl.style.left = `${data.x}px`;
                        domEl.style.top = `${data.y}px`;
                        domEl.style.zIndex = Math.round(data.y);
                    }
                }
            }

            // --- Proximity to interaction zones (shop / pet sanctuary) ---
            const near = checkInteractables(posRef.current.x, posRef.current.y, currentMap);
            const prevTarget = nearTargetRef.current?.target || null;
            if ((near?.target || null) !== prevTarget) {
                nearTargetRef.current = near;
                setNearTarget(near);
            }

            rafId = requestAnimationFrame(loop);
        };

        rafId = requestAnimationFrame(loop);
        return () => cancelAnimationFrame(rafId);
    }, [currentMapId]);

    // Pre-compute the floor tile data URL once per map (expensive: 4096 cells → SVG)
    const tileBackground = React.useMemo(() => {
        if (!map?.tileSprite) return null;
        const buffer = SPRITES[map.tileSprite];
        if (!buffer) return null;
        const tilePx = map.tileSize || 64;
        return {
            backgroundColor: map.baseColor || '#000',
            backgroundImage: `url("${pixelBufferToDataUrl(buffer, 64)}")`,
            backgroundSize: `${tilePx}px ${tilePx}px`,
            backgroundRepeat: 'repeat',
            imageRendering: 'pixelated'
        };
    }, [map?.tileSprite, map?.tileSize, map?.baseColor]);

    if (!map) return <div className="text-white p-10">Loading map...</div>;

    const charData = activeProfile?.state?.character || { name: 'Player', class: 'Novice', avatarId: 'warrior' };

    return (
        <div
            className={(className || 'w-full h-full relative') + ' overflow-hidden transition-colors duration-1000'}
            style={{ backgroundColor: map?.baseColor || '#000' }}
            ref={viewportRef}
        >
            {/* Map Transition Overlay */}
            {fadeState !== 'none' && (
                <div className={`map-transition-overlay ${fadeState === 'exit' ? 'map-fade-exit' : 'map-fade-enter'}`} />
            )}

            {/* Map Container (Camera Layer) */}
            <div
                ref={mapDOMRef}
                className={`origin-top-left will-change-transform ${tileBackground ? '' : (map.className || '')}`}
                style={{ width: map.width, height: map.height, position: 'relative', ...(map.background || {}), ...(tileBackground || {}) }}
            >
                {/* Ambient atmosphere: warm wash + soft vignette (only on outdoor cobbled maps) */}
                {map.className === 'medieval-town-bg' && (
                    <>
                        <div
                            className="absolute inset-0 pointer-events-none"
                            style={{
                                background: 'radial-gradient(ellipse at 50% 40%, rgba(255,180,90,0.10) 0%, transparent 55%)',
                                mixBlendMode: 'screen',
                                zIndex: 0
                            }}
                        />
                        <div
                            className="absolute inset-0 pointer-events-none"
                            style={{
                                background: 'radial-gradient(ellipse at center, transparent 45%, rgba(0,0,0,0.55) 100%)',
                                zIndex: 0
                            }}
                        />
                    </>
                )}

                {/* Portals */}
                <PortalsLayer portals={map.portals} />

                {/* Dust Particles — isolated layer, owns its own state */}
                <DustParticles ref={dustRef} />

                {/* Decorations — viewport-culled to only what's visible + margin */}
                <DecorationsLayer decorations={visibleDecorations || map.decorations} />

                {/* NPCs (family & friends) — positions updated via DOM refs in game loop */}
                <NpcLayer npcs={npcs} npcDOMRefs={npcDOMRefs} onSelectNpc={setSelectedNpc} />

                {/* Player */}
                <div
                    ref={playerDOMRef}
                    className="absolute will-change-transform"
                    style={{ left: pos.x, top: pos.y, transform: 'translate(-50%, -100%)', zIndex: Math.round(pos.y) }}
                >
                    <div className="flex flex-col items-center relative">
                        <div className="bg-rpg-gold text-rpg-bg text-[10px] uppercase tracking-wider px-3 py-0.5 rounded-full font-bold mb-1 border border-rpg-gold/20 shadow-glow flex items-center gap-1 whitespace-nowrap">
                            <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse"></span>
                            {charData.name}
                        </div>
                        <div
                            className={`transform origin-bottom transition-transform duration-100 ${isMoving ? 'animate-world-bob' : ''}`}
                            style={{ transform: facing === 'left' ? 'scaleX(-1)' : 'scaleX(1)' }}
                        >
                            <MemoAvatar type={charData.avatarId} scale={1.0} customColors={charData.avatarColors} />
                        </div>
                        <div className="w-10 h-2 bg-black/60 rounded-full blur-md mt-[-6px]" />
                    </div>
                </div>
            </div>

            {/* HUD — Area name */}
            <div className="absolute top-4 left-4 z-40 pointer-events-none">
                <div className="glass-panel px-4 py-2 flex items-center gap-3 backdrop-blur-xl bg-rpg-panel/80 w-max shadow-xl">
                    <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.8)]"></div>
                    <div>
                        <div className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Current Area</div>
                        <div className="text-sm font-heading font-bold text-white text-shadow-sm">{map.name}</div>
                    </div>
                </div>
            </div>

            {/* HUD — Keyboard hint (desktop) */}
            <div className="absolute top-4 right-16 z-40 pointer-events-none text-right hidden lg:block">
                <div className="bg-black/60 backdrop-blur-md px-4 py-2 rounded-xl border border-white/10 text-[10px] text-gray-300 font-mono w-max ml-auto">
                    <span className="font-bold text-white">W A S D</span> or <span className="font-bold text-white">ARROWS</span> to move
                </div>
            </div>

            {/* Close button */}
            {onClose && (
                <div className="absolute top-4 right-4 z-50 md:top-20">
                    <button
                        onClick={onClose}
                        className="w-10 h-10 bg-red-500/20 hover:bg-red-500/40 border border-red-500/50 text-red-500 rounded-full flex items-center justify-center transition-all hover:scale-110 shadow-lg pointer-events-auto"
                    >
                        ×
                    </button>
                </div>
            )}

            {/* NPC Profile Popup */}
            {selectedNpc && (() => {
                const npcChar = selectedNpc.state?.character || selectedNpc.character || {};
                const isFriend = friends?.some(f => String(f.id) === String(selectedNpc.id));
                return (
                    <div className="absolute top-16 left-1/2 -translate-x-1/2 z-[9998] w-72 glass-panel p-4 border border-white/10 shadow-2xl animate-in fade-in slide-in-from-top-2 duration-200">
                        <button
                            onClick={() => setSelectedNpc(null)}
                            className="absolute top-3 right-3 text-gray-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors"
                        >
                            <X size={16} />
                        </button>

                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-14 h-14 bg-gradient-to-br from-purple-500/20 to-blue-500/20 rounded-xl border border-white/10 flex items-center justify-center flex-shrink-0">
                                <ModernPixelAvatar
                                    type={npcChar.avatarId || 'warrior'}
                                    scale={1.5}
                                    customColors={npcChar.avatarColors}
                                    headOnly={true}
                                />
                            </div>
                            <div>
                                <div className="text-white font-bold text-sm">{selectedNpc.username || selectedNpc.name}</div>
                                <div className="text-[10px] px-2 py-0.5 rounded bg-purple-600/40 text-purple-300 font-bold uppercase tracking-wide inline-block mt-1">
                                    Lvl {npcChar.level || 1} {npcChar.class || 'Adventurer'}
                                </div>
                            </div>
                        </div>

                        {npcChar.stats && (
                            <div className="grid grid-cols-3 gap-2 mb-4">
                                {[['STR', npcChar.stats.str], ['INT', npcChar.stats.int], ['DEX', npcChar.stats.dex], ['CON', npcChar.stats.con], ['CHA', npcChar.stats.cha], ['WIL', npcChar.stats.will]].map(([label, val]) => (
                                    <div key={label} className="glass-card p-2 text-center">
                                        <div className="text-[9px] text-gray-400 font-bold uppercase">{label}</div>
                                        <div className="text-white font-bold text-sm">{val ?? '?'}</div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {isFriend && (
                            <button
                                onClick={() => { setChatNpc(selectedNpc); setSelectedNpc(null); }}
                                className="w-full py-2 bg-indigo-600/20 hover:bg-indigo-600 text-indigo-300 hover:text-white border border-indigo-500/50 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2"
                            >
                                <MessageSquare size={14} /> Send Message
                            </button>
                        )}
                    </div>
                );
            })()}

            {/* Chat Modal (launched from NPC interaction) */}
            {chatNpc && (
                <ChatModal
                    isOpen={!!chatNpc}
                    onClose={() => setChatNpc(null)}
                    currentUser={currentUser}
                    friend={chatNpc}
                />
            )}

            {/* Interaction prompt (proximity to shop / pet sanctuary) */}
            {nearTarget && (
                <button
                    onClick={triggerInteract}
                    className="absolute bottom-28 left-1/2 -translate-x-1/2 z-[60] pointer-events-auto flex items-center gap-2 px-4 py-2.5 bg-rpg-gold text-rpg-bg rounded-full font-bold uppercase tracking-wider text-xs shadow-[0_0_20px_rgba(250,204,21,0.5)] border border-yellow-200/50 animate-in fade-in slide-in-from-bottom-2 active:scale-95 transition-transform"
                >
                    <span className="hidden md:inline-flex items-center justify-center w-5 h-5 rounded bg-rpg-bg/20 text-[10px] font-black">E</span>
                    <span className="md:hidden inline-flex items-center justify-center w-5 h-5 rounded bg-rpg-bg/20 text-[10px] font-black">👆</span>
                    {nearTarget.label}
                </button>
            )}

            {/* Mobile Joystick */}
            <MobileJoystick
                onMove={jsPos => { joyInput.current = jsPos; }}
                onStop={() => { joyInput.current = { x: 0, y: 0 }; }}
            />
        </div>
    );
};

export default PlayableWorld;
