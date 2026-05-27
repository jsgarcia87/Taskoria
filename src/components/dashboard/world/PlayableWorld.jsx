import React, { useState, useEffect, useRef } from 'react';
import PixelAvatar from '../../common/PixelAvatar';
import MobileJoystick from './MobileJoystick';
import { MAP_DATA } from './MapData';
import ChatModal from '../ChatModal';
import { X, MessageSquare } from 'lucide-react';

const TILE_SIZE = 40;
const SPEED = 5;
const NPC_SPEED = SPEED * 0.35; // ~1.75px/frame, more leisurely than player
const NPC_STOP_DIST = 5;

const PlayableWorld = ({ currentUser, activeProfile, familyMembers, friends, onClose, className }) => {
    // Engine State
    const [currentMapId, setCurrentMapId] = useState('townSquare');
    const map = MAP_DATA[currentMapId];

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
    const particleIdCounter = useRef(0);

    // Fade State for Map Transitions
    const [fadeState, setFadeState] = useState('none');
    const [particles, setParticles] = useState([]);

    // NPC State
    const [npcs, setNpcs] = useState([]);
    const npcDataRef = useRef({});  // { [id]: { x, y, tx, ty, facing, waitUntil } } — mutable, read in loop
    const npcDOMRefs = useRef({});  // { [id]: HTMLElement } — DOM refs for direct position updates

    // Interaction State
    const [selectedNpc, setSelectedNpc] = useState(null);
    const [chatNpc, setChatNpc] = useState(null);

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
            };
        });
        npcDataRef.current = newNpcData;
    }, [currentMapId, familyMembers, friends]);

    // Keyboard Listeners
    useEffect(() => {
        const down = (e) => {
            if (e.code) keys.current[e.code] = true;
            if (e.key) keys.current[e.key.toLowerCase()] = true;
        };
        const up = (e) => {
            if (e.code) keys.current[e.code] = false;
            if (e.key) keys.current[e.key.toLowerCase()] = false;
        };
        window.addEventListener('keydown', down);
        window.addEventListener('keyup', up);
        return () => { window.removeEventListener('keydown', down); window.removeEventListener('keyup', up); };
    }, []);

    // Box collision check
    const checkCollision = (newX, newY, mapRef) => {
        const pLeft = newX - TILE_SIZE / 2;
        const pRight = newX + TILE_SIZE / 2;
        const pTop = newY - TILE_SIZE / 2;
        const pBottom = newY + TILE_SIZE / 2;
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

    // Camera utility — shared between moving and idle branches
    const updateCamera = (px, py, currentMap) => {
        if (!mapDOMRef.current || viewportSizeRef.current.w <= 0) return;
        const viewW = viewportSizeRef.current.w;
        const viewH = viewportSizeRef.current.h;
        let camX = Math.max(0, Math.min(currentMap.width - viewW, px - viewW / 2));
        let camY = Math.max(0, Math.min(currentMap.height - viewH, py - viewH / 2));
        mapDOMRef.current.style.transform = `translate3d(-${camX}px, -${camY}px, 0)`;
    };

    // Viewport resize observer
    useEffect(() => {
        if (!viewportRef.current) return;
        viewportSizeRef.current = { w: viewportRef.current.clientWidth, h: viewportRef.current.clientHeight };
        const ro = new ResizeObserver(entries => {
            for (const e of entries) viewportSizeRef.current = { w: e.contentRect.width, h: e.contentRect.height };
        });
        ro.observe(viewportRef.current);
        return () => ro.disconnect();
    }, []);

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

                // Dust particles
                if (timestamp - lastParticleTime > 150) {
                    particleIdCounter.current++;
                    setParticles(prev => [...prev.slice(-10), { id: particleIdCounter.current, x: posRef.current.x, y: posRef.current.y }]);
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
                if (portal && fadeState === 'none') {
                    setFadeState('exit');
                    setTimeout(() => {
                        setCurrentMapId(portal.targetMap);
                        setPos({ x: portal.targetX, y: portal.targetY });
                        posRef.current = { x: portal.targetX, y: portal.targetY };
                        setFadeState('enter');
                        setTimeout(() => setFadeState('none'), 400);
                    }, 400);
                }
            } else {
                if (isMovingRef.current) { isMovingRef.current = false; setIsMoving(false); setPos({ ...posRef.current }); }
                updateCamera(posRef.current.x, posRef.current.y, currentMap);
            }

            // --- NPC wandering (DOM-direct, no setState) ---
            for (const [id, data] of Object.entries(npcDataRef.current)) {
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

            rafId = requestAnimationFrame(loop);
        };

        rafId = requestAnimationFrame(loop);
        return () => cancelAnimationFrame(rafId);
    }, [currentMapId, fadeState]);

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
                className={`origin-top-left will-change-transform ${map.className || ''}`}
                style={{ width: map.width, height: map.height, position: 'relative', ...(map.background || {}) }}
            >
                {/* Portals */}
                {map.portals?.map((portal, i) => (
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

                {/* Dust Particles */}
                {particles.map(p => (
                    <div
                        key={p.id}
                        className="absolute w-4 h-4 bg-white/20 rounded-full blur-md animate-dust"
                        style={{ left: p.x, top: p.y, transform: 'translate(-50%, -50%)', zIndex: 1 }}
                    />
                ))}

                {/* Decorations */}
                {map.decorations?.map((dec, i) => {
                    if (dec.type === 'rect') {
                        return (
                            <div key={`dec_${i}`} className="absolute shadow-xl" style={{ left: dec.x, top: dec.y, width: dec.width, height: dec.height, backgroundColor: dec.color, border: dec.border ? `4px solid ${dec.border}` : 'none', borderRadius: dec.radius || 0, opacity: dec.opacity || 1, zIndex: dec.y }}></div>
                        );
                    }
                    if (dec.type === 'pine_tree' || dec.type === 'oak_tree') {
                        return (
                            <div key={`dec_${i}`} className="absolute flex flex-col items-center justify-end pointer-events-none animate-sway" style={{ left: dec.x, top: dec.y, width: dec.width, height: dec.height, zIndex: dec.y + dec.height }}>
                                {dec.type === 'pine_tree' ? (
                                    <>
                                        <div className="flex flex-col items-center drop-shadow-2xl">
                                            <div className="w-[20%] h-[15%] bg-[#064e3b] shadow-inner"></div>
                                            <div className="w-[40%] h-[15%] bg-[#065f46] shadow-inner border-y border-[#047857]"></div>
                                            <div className="w-[60%] h-[15%] bg-[#064e3b] shadow-inner"></div>
                                            <div className="w-[80%] h-[15%] bg-[#065f46] shadow-[inset_0_-4px_rgba(0,0,0,0.3)] border-b-[3px] border-black/40"></div>
                                        </div>
                                        <div className="w-[20%] h-[25%] bg-[#451a03] border-x-4 border-[#290f01] shadow-[inset_4px_0_rgba(0,0,0,0.3)] z-10"></div>
                                    </>
                                ) : (
                                    <>
                                        <div className="w-[60%] h-[15%] bg-[#166534] rounded-t-md shadow-inner"></div>
                                        <div className="w-[80%] h-[20%] bg-[#15803d] border-b-[3px] border-[#14532d]"></div>
                                        <div className="w-[100%] h-[30%] bg-[#166534] shadow-[inset_0_-10px_#052e16] rounded-b-md border-b-[4px] border-black/40"></div>
                                        <div className="w-[30%] h-[30%] bg-[#451a03] border-x-4 border-[#290f01]"></div>
                                    </>
                                )}
                                <div className="absolute -bottom-2 w-[80%] h-4 bg-black/40 rounded-full blur-[2px] z-0"></div>
                            </div>
                        );
                    }
                    if (dec.type === 'torch') {
                        return (
                            <div key={`dec_${i}`} className="absolute flex flex-col items-center" style={{ left: dec.x, top: dec.y, width: dec.size, height: dec.size * 2, zIndex: dec.y }}>
                                <div className="w-[40%] h-[60%] bg-[#451a03] border-x-2 border-black/40 rounded-b-sm"></div>
                                <div className="w-full h-[40%] bg-orange-500 rounded-full animate-flicker shadow-[0_0_20px_rgba(249,115,22,0.8)]"></div>
                            </div>
                        );
                    }
                    if (dec.type === 'pillar') {
                        return (
                            <div key={`dec_${i}`} className="absolute flex flex-col items-center justify-end" style={{ left: dec.x, top: dec.y, width: dec.width, height: dec.height, zIndex: dec.y }}>
                                <div className="w-full h-4 bg-gray-800 border-b-2 border-black/50"></div>
                                <div className="w-[80%] h-full bg-gray-700 border-x-4 border-gray-900 shadow-inner relative">
                                    <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/20 to-black/40"></div>
                                </div>
                                <div className="w-full h-6 bg-gray-800 border-t-4 border-gray-600 rounded-sm"></div>
                            </div>
                        );
                    }
                    if (dec.type === 'statue') {
                        return (
                            <div key={`dec_${i}`} className="absolute flex flex-col items-center justify-end" style={{ left: dec.x, top: dec.y, width: dec.size, height: dec.size * 1.5, zIndex: dec.y }}>
                                <div className="w-[50%] h-[15%] bg-gray-600 border-x-2 border-gray-800"></div>
                                <div className="w-[70%] h-[45%] bg-gray-500 border-x-4 border-gray-700 relative">
                                    <div className="absolute top-2 left-1 w-[20%] h-[10%] bg-white/20"></div>
                                    <div className="absolute top-[20%] left-1/2 -translate-x-1/2 w-[40%] h-[20%] bg-gray-900/40 rounded-full"></div>
                                </div>
                                <div className="w-[40%] h-[25%] bg-gray-400 border-x-2 border-gray-600"></div>
                                <div className="w-full h-[15%] bg-gray-800 border-t-2 border-gray-600 rounded-sm shadow-xl"></div>
                                <div className="absolute -bottom-2 w-[120%] h-4 bg-black/30 rounded-full blur-md z-[-1]"></div>
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
                    if (dec.type === 'mug') return (
                        <div key={`dec_${i}`} className="absolute pointer-events-none" style={{ left: dec.x, top: dec.y, width: dec.size, height: dec.size, transform: 'translate(-50%, -50%)', zIndex: Math.floor(dec.y) }}>
                            <div className="absolute bottom-0 left-1/4 w-1/2 h-3/4 bg-[#92400e] border-x-2 border-black/20 rounded-sm"></div>
                            <div className="absolute top-[30%] left-[30%] w-[40%] h-[20%] bg-amber-400 opacity-80"></div>
                            <div className="absolute top-[15%] left-[30%] w-[40%] h-[15%] bg-white rounded-t-sm shadow-sm"></div>
                            <div className="absolute right-[15%] top-[40%] w-[15%] h-[35%] border-2 border-[#92400e] rounded-r-md"></div>
                        </div>
                    );
                    if (dec.type === 'stool') return (
                        <div key={`dec_${i}`} className="absolute pointer-events-none" style={{ left: dec.x, top: dec.y, width: dec.size, height: dec.size, transform: 'translate(-50%, -50%)', zIndex: Math.floor(dec.y) }}>
                            <div className="absolute top-0 left-0 w-full h-1/3 bg-[#78350f] rounded-sm border-b-2 border-black/40 shadow-sm"></div>
                            <div className="absolute bottom-0 left-[20%] w-[10%] h-2/3 bg-[#451a03]"></div>
                            <div className="absolute bottom-0 right-[20%] w-[10%] h-2/3 bg-[#451a03]"></div>
                        </div>
                    );
                    if (dec.type === 'fire') return (
                        <div key={`dec_${i}`} className="absolute pointer-events-none" style={{ left: dec.x, top: dec.y, width: dec.size, height: dec.size, transform: 'translate(-50%, -50%)', zIndex: Math.floor(dec.y) }}>
                            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[80%] h-1/4 bg-[#451a03] rounded-full"></div>
                            <div className="absolute bottom-[15%] left-1/2 -translate-x-1/2 w-[70%] h-full bg-orange-600 rounded-full animate-flicker mix-blend-screen blur-[1px]"></div>
                            <div className="absolute bottom-[25%] left-1/2 -translate-x-1/2 w-1/2 h-2/3 bg-yellow-400 rounded-full animate-pulse blur-[1px]"></div>
                        </div>
                    );
                    if (dec.type === 'bartender_npc') return (
                        <div key={`dec_${i}`} className="absolute flex flex-col items-center" style={{ left: dec.x, top: dec.y, transform: 'translate(-50%, -100%)', zIndex: Math.floor(dec.y) }}>
                            <div className="bg-black/60 text-white text-[8px] px-2 py-0.5 rounded-full mb-1 border border-white/10 font-bold uppercase tracking-wider">Tavern Keeper</div>
                            <div className="animate-world-bob">
                                <PixelAvatar type="monk" scale={1.1} customColors={{ primary: '#e8e8e8', primaryDark: '#c0c8d0', skin: '#d49060' }} />
                            </div>
                            <div className="w-8 h-2 bg-black/40 rounded-full blur-sm mt-[-4px]" />
                        </div>
                    );
                    return null;
                })}

                {/* NPCs (family & friends) — positions updated via DOM refs in game loop */}
                {npcs.map(npc => {
                    const npcChar = npc.state?.character || npc.character;
                    return (
                        <div
                            key={npc.id}
                            ref={el => { if (el) npcDOMRefs.current[npc.id] = el; else delete npcDOMRefs.current[npc.id]; }}
                            className="absolute will-change-transform cursor-pointer group"
                            onClick={() => setSelectedNpc(npc)}
                            style={{ left: npc.x, top: npc.y, transform: 'translate(-50%, -100%)', zIndex: Math.round(npc.y) }}
                        >
                            <div className="flex flex-col items-center">
                                <div className="bg-black/60 text-white text-[9px] px-2 py-0.5 rounded-full font-bold mb-1 border border-white/10 whitespace-nowrap group-hover:border-rpg-gold/50 group-hover:bg-rpg-gold/10 group-hover:text-rpg-gold transition-colors">
                                    {npc.username || npc.name}
                                </div>
                                <div
                                    className="npc-facing-wrapper animate-world-bob"
                                    style={{ transform: npc.facing === 'left' ? 'scaleX(-1)' : 'scaleX(1)' }}
                                >
                                    <PixelAvatar type={npcChar?.avatarId || 'warrior'} scale={1.0} customColors={npcChar?.avatarColors} />
                                </div>
                                <div className="w-8 h-2 bg-black/40 rounded-full blur-sm mt-[-4px]" />
                            </div>
                        </div>
                    );
                })}

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
                            <PixelAvatar type={charData.avatarId} scale={1.0} customColors={charData.avatarColors} />
                        </div>
                        <div className="w-10 h-2 bg-black/60 rounded-full blur-md mt-[-6px]" />
                    </div>
                </div>
            </div>

            {/* HUD — Area name */}
            <div className="sticky top-4 left-4 pointer-events-none float-left w-0">
                <div className="glass-panel px-4 py-2 flex items-center gap-3 backdrop-blur-xl bg-[#1a102e]/80 w-max shadow-xl">
                    <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.8)]"></div>
                    <div>
                        <div className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Current Area</div>
                        <div className="text-sm font-heading font-bold text-white text-shadow-sm">{map.name}</div>
                    </div>
                </div>
            </div>

            {/* HUD — Keyboard hint (desktop) */}
            <div className="sticky top-4 right-4 pointer-events-none text-right hidden lg:block float-right w-0">
                <div className="bg-black/60 backdrop-blur-md px-4 py-2 rounded-xl border border-white/10 text-[10px] text-gray-300 font-mono mb-2 w-max ml-auto relative right-8">
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
                                <PixelAvatar
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

            {/* Mobile Joystick */}
            <MobileJoystick
                onMove={jsPos => { joyInput.current = jsPos; }}
                onStop={() => { joyInput.current = { x: 0, y: 0 }; }}
            />
        </div>
    );
};

export default PlayableWorld;
