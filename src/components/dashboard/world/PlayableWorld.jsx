import React, { useState, useEffect, useRef } from 'react';
import PixelAvatar from '../../common/PixelAvatar';
import MobileJoystick from './MobileJoystick';
import { MAP_DATA } from './MapData';

const TILE_SIZE = 40; // Collision buffer size
const SPEED = 5; // Pixels per frame (~300px per sec at 60fps)

const PlayableWorld = ({ currentUser, activeProfile, familyMembers, friends, onClose, onInteract, className }) => {
    // Engine State
    const [currentMapId, setCurrentMapId] = useState('townSquare');
    const map = MAP_DATA[currentMapId];
    
    // Player State
    const [pos, setPos] = useState({ x: map?.spawn?.x || 0, y: map?.spawn?.y || 0 });
    const [facing, setFacing] = useState('right');
    const [isMoving, setIsMoving] = useState(false);
    
    // Input States (Refs for game loop access)
    const keys = useRef({ w: false, a: false, s: false, d: false, ArrowUp: false, ArrowLeft: false, ArrowDown: false, ArrowRight: false });
    const joyInput = useRef({ x: 0, y: 0 });
    const viewportRef = useRef(null);
    const viewportSizeRef = useRef({ w: 600, h: 400 }); // Default fallback size cache
    const posRef = useRef(pos); // Keep latest pos for loop
    const mapDOMRef = useRef(null); // Ref to shift the map container (Camera)

    // Fade State for Map Transitions
    const [fadeState, setFadeState] = useState('none'); // 'none' | 'exit' | 'enter'
    const [particles, setParticles] = useState([]); // {id, x, y}

    // Refs for 60fps loop to read React state instantlyce DOM Refs
    const playerDOMRef = useRef(null);
    const isMovingRef = useRef(false);
    const facingRef = useRef('right');
    const particleIdCounter = useRef(0);

    // NPC generation
    const [npcs, setNpcs] = useState([]);

    // Proximity interaction (shop / pet sanctuary NPCs)
    const [nearTarget, setNearTarget] = useState(null);
    const nearTargetRef = useRef(null);
    const onInteractRef = useRef(onInteract);
    useEffect(() => { onInteractRef.current = onInteract; });

    const triggerInteract = () => {
        const target = nearTargetRef.current;
        if (target && onInteractRef.current) onInteractRef.current(target);
    };

    // Keep posRef updated
    useEffect(() => { posRef.current = pos; }, [pos]);

    // Handle Map Changes (Spawn NPCs)
    useEffect(() => {
        const currentMap = MAP_DATA[currentMapId];
        if (!currentMap) return;

        // Place all users randomly in this map
        const allOthers = [...(familyMembers || []), ...(friends || [])];
        
        // Random placement avoiding borders
        const generatedNpcs = allOthers.map(u => ({
            ...u,
            x: 200 + Math.random() * (currentMap.width - 400),
            y: 200 + Math.random() * (currentMap.height - 400),
            facing: Math.random() > 0.5 ? 'right' : 'left'
        }));
        
        setNpcs(generatedNpcs);
    }, [currentMapId, familyMembers, friends]);

    // Keyboard Listeners
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.code) keys.current[e.code] = true;
            if (e.key) keys.current[e.key.toLowerCase()] = true;
            if (e.key && e.key.toLowerCase() === 'e') triggerInteract();
        };
        const handleKeyUp = (e) => {
            if (e.code) keys.current[e.code] = false;
            if (e.key) keys.current[e.key.toLowerCase()] = false;
        };

        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('keyup', handleKeyUp);
        };
    }, []);

    // Helper: Box Collision
    const checkCollision = (newX, newY, mapRef) => {
        // Player hitbox buffer (centered)
        const pLeft = newX - TILE_SIZE/2;
        const pRight = newX + TILE_SIZE/2;
        const pTop = newY - TILE_SIZE/2;
        const pBottom = newY + TILE_SIZE/2;

        for (const obs of mapRef.obstacles) {
            if (pRight > obs.x && 
                pLeft < obs.x + obs.width &&
                pBottom > obs.y && 
                pTop < obs.y + obs.height) {
                return true; // Collision
            }
        }
        return false;
    };

    // Helper: nearest interaction zone within its radius
    const checkInteractables = (x, y, mapRef) => {
        if (!mapRef.interactables) return null;
        for (const it of mapRef.interactables) {
            const cx = it.x + it.width / 2;
            const cy = it.y + it.height / 2;
            const dist = Math.hypot(x - cx, y - cy);
            if (dist < (it.radius || 90)) return it;
        }
        return null;
    };

    // Helper: Portal Collision
    const checkPortals = (x, y, mapRef) => {
        for (const portal of mapRef.portals) {
            if (x > portal.x && x < portal.x + portal.width &&
                y > portal.y && y < portal.y + portal.height) {
                return portal;
            }
        }
        return null;
    };

    // Snap the camera to the current player position (used on resize / map change)
    const centerCamera = () => {
        const currentMap = MAP_DATA[currentMapId];
        if (!mapDOMRef.current || !currentMap || !(viewportSizeRef.current.w > 0)) return;
        const viewW = viewportSizeRef.current.w;
        const viewH = viewportSizeRef.current.h;
        let camX = posRef.current.x - viewW / 2;
        let camY = posRef.current.y - viewH / 2;
        camX = Math.max(0, Math.min(currentMap.width - viewW, camX));
        camY = Math.max(0, Math.min(currentMap.height - viewH, camY));
        mapDOMRef.current.style.transform = `translate3d(-${camX}px, -${camY}px, 0)`;
    };

    // Maintain viewport size cache for Camera centering
    useEffect(() => {
        if (!viewportRef.current) return;

        // Initial setup
        viewportSizeRef.current = {
            w: viewportRef.current.clientWidth,
            h: viewportRef.current.clientHeight
        };
        centerCamera();

        const ro = new ResizeObserver(entries => {
            for (let entry of entries) {
                viewportSizeRef.current = {
                    w: entry.contentRect.width,
                    h: entry.contentRect.height
                };
            }
            // Keep the player framed when the playable area is resized (orientation, keyboard, layout shifts)
            centerCamera();
        });
        ro.observe(viewportRef.current);
        return () => ro.disconnect();
    }, [currentMapId]);

    // MAIN GAME LOOP (60fps)
    useEffect(() => {
        let animationFrameId;
        let lastParticleTime = 0;

        const loop = (timestamp) => {
            const currentMap = MAP_DATA[currentMapId];
            if (!currentMap) return;

            let dx = 0;
            let dy = 0;

            // Keyboard input
            if (keys.current['KeyW'] || keys.current['ArrowUp'] || keys.current['w']) dy -= 1;
            if (keys.current['KeyS'] || keys.current['ArrowDown'] || keys.current['s']) dy += 1;
            if (keys.current['KeyA'] || keys.current['ArrowLeft'] || keys.current['a']) dx -= 1;
            if (keys.current['KeyD'] || keys.current['ArrowRight'] || keys.current['d']) dx += 1;

            // Joystick input
            if (joyInput.current.x !== 0 || joyInput.current.y !== 0) {
                dx = joyInput.current.x;
                dy = joyInput.current.y;
            }

            // Normalize diagonal speed
            if (dx !== 0 && dy !== 0 && joyInput.current.x === 0 && joyInput.current.y === 0) {
                const length = Math.sqrt(dx * dx + dy * dy);
                dx /= length;
                dy /= length;
            }

            if (dx !== 0 || dy !== 0) {
                let newX = posRef.current.x + dx * SPEED;
                let newY = posRef.current.y + dy * SPEED;
                
                newX = Math.max(TILE_SIZE, Math.min(currentMap.width - TILE_SIZE, newX));
                newY = Math.max(TILE_SIZE, Math.min(currentMap.height - TILE_SIZE, newY));

                if (!checkCollision(newX, posRef.current.y, currentMap)) posRef.current.x = newX;
                if (!checkCollision(posRef.current.x, newY, currentMap)) posRef.current.y = newY;
                
                // Particles System
                if (timestamp - lastParticleTime > 150) {
                    const pid = particleIdCounter.current++;
                    setParticles(prev => [...prev.slice(-10), { id: pid, x: posRef.current.x, y: posRef.current.y }]);
                    lastParticleTime = timestamp;
                }

                if (playerDOMRef.current) {
                    playerDOMRef.current.style.left = `${posRef.current.x}px`;
                    playerDOMRef.current.style.top = `${posRef.current.y}px`;
                    playerDOMRef.current.style.zIndex = Math.round(posRef.current.y);
                }

                if (!isMovingRef.current) {
                    isMovingRef.current = true;
                    setIsMoving(true);
                }
                if (dx > 0 && facingRef.current !== 'right') {
                    facingRef.current = 'right';
                    setFacing('right');
                }
                if (dx < 0 && facingRef.current !== 'left') {
                    facingRef.current = 'left';
                    setFacing('left');
                }

                // CAMERA
                if (mapDOMRef.current && viewportSizeRef.current.w > 0) {
                    const plX = posRef.current.x;
                    const plY = posRef.current.y;
                    const viewW = viewportSizeRef.current.w;
                    const viewH = viewportSizeRef.current.h;
                    let camX = plX - viewW / 2;
                    let camY = plY - viewH / 2;
                    camX = Math.max(0, Math.min(currentMap.width - viewW, camX));
                    camY = Math.max(0, Math.min(currentMap.height - viewH, camY));
                    mapDOMRef.current.style.transform = `translate3d(-${camX}px, -${camY}px, 0)`;
                }

                // Portal check
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
                if (isMovingRef.current) {
                    isMovingRef.current = false;
                    setIsMoving(false);
                    setPos({ ...posRef.current });
                }
                if (mapDOMRef.current && viewportSizeRef.current.w > 0) {
                    const plX = posRef.current.x;
                    const plY = posRef.current.y;
                    const viewW = viewportSizeRef.current.w;
                    const viewH = viewportSizeRef.current.h;
                    let camX = plX - viewW / 2;
                    let camY = plY - viewH / 2;
                    camX = Math.max(0, Math.min(currentMap.width - viewW, camX));
                    camY = Math.max(0, Math.min(currentMap.height - viewH, camY));
                    mapDOMRef.current.style.transform = `translate3d(-${camX}px, -${camY}px, 0)`;
                }
            }

            // Proximity to interaction zones (shop / pet sanctuary)
            const near = checkInteractables(posRef.current.x, posRef.current.y, currentMap);
            const prevTarget = nearTargetRef.current?.target || null;
            if ((near?.target || null) !== prevTarget) {
                nearTargetRef.current = near;
                setNearTarget(near);
            }

            animationFrameId = requestAnimationFrame(loop);
        };

        animationFrameId = requestAnimationFrame(loop);
        return () => cancelAnimationFrame(animationFrameId);
    }, [currentMapId, fadeState]);

    if (!map) return <div className="text-white p-10">Loading map...</div>;

    const charData = activeProfile?.state?.character || { name: 'Player', class: 'Novice', avatarId: 'warrior' };

    return (
        <div 
            className={(className || "w-full h-full relative") + " overflow-hidden transition-colors duration-1000"}
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
                style={{
                    width: map.width,
                    height: map.height,
                    position: 'relative',
                    ...(map.background || {})
                }}
            >
                {/* Render Portals (Visuals) */}
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

                {/* Render Dust Particles */}
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
                            <div 
                                key={`dec_${i}`} 
                                className="absolute shadow-xl" 
                                style={{ left: dec.x, top: dec.y, width: dec.width, height: dec.height, backgroundColor: dec.color, border: dec.border ? `4px solid ${dec.border}` : 'none', borderRadius: dec.radius || 0, opacity: dec.opacity || 1, zIndex: dec.z !== undefined ? dec.z : dec.y }}
                            ></div>
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
                                {/* Pixel Art Stone Knight Statue */}
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
                    if (dec.type === 'stool' || dec.type === 'mug' || dec.type === 'fire' || dec.type === 'bartender_npc' || dec.type === 'emoji' || dec.type === 'text') {
                        if (dec.type === 'text') {
                            // Specialized Pixel Art for specific icons used as text
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
                    }

                    if (dec.type === 'well') {
                        return (
                            <div key={`dec_${i}`} className="absolute flex flex-col items-center justify-end" style={{ left: dec.x, top: dec.y, width: dec.width, height: dec.height, zIndex: Math.floor(dec.y + dec.height) }}>
                                <div className="w-[90%] h-[28%] bg-red-800 border-b-4 border-red-950 rounded-t-sm relative overflow-hidden shadow-lg z-30">
                                    <div className="absolute inset-0 opacity-30" style={{ backgroundImage: 'linear-gradient(90deg, transparent 50%, rgba(0,0,0,0.5) 50%)', backgroundSize: '10px 10px' }} />
                                </div>
                                <div className="flex justify-between w-[68%] -mt-1 z-20">
                                    <div className="w-2 h-7 bg-[#5c3a21] border-x border-[#3d261b]" />
                                    <div className="w-2 h-7 bg-[#5c3a21] border-x border-[#3d261b]" />
                                </div>
                                <div className="w-full h-[42%] bg-gray-500 border-t-4 border-gray-400 border-b-4 border-gray-700 rounded-md shadow-xl flex items-center justify-center relative z-10">
                                    <div className="w-[70%] h-[55%] bg-black/80 rounded-md shadow-inner" />
                                </div>
                            </div>
                        );
                    }

                    if (dec.type === 'shop_building') {
                        return (
                            <div key={`dec_${i}`} className="absolute flex flex-col items-center" style={{ left: dec.x, top: dec.y, width: dec.width, height: dec.height, zIndex: Math.floor(dec.y + dec.height) }}>
                                <div className="w-[108%] h-[26%] bg-[#7c2d12] border-b-4 border-[#431407] rounded-t-md shadow-lg relative overflow-hidden">
                                    <div className="absolute inset-0 opacity-25" style={{ backgroundImage: 'linear-gradient(90deg, transparent 50%, rgba(0,0,0,0.4) 50%)', backgroundSize: '14px 14px' }} />
                                </div>
                                <div className="w-full flex-1 bg-[#d6c3a1] border-x-4 border-[#a1856a] relative flex items-end justify-center">
                                    <div className="absolute top-0 left-0 w-full h-5 border-b-2 border-black/20" style={{ backgroundImage: 'repeating-linear-gradient(90deg,#dc2626 0 16px,#fef3c7 16px 32px)' }} />
                                    <div className="absolute top-9 left-5 w-10 h-10 bg-sky-300/70 border-4 border-[#7c2d12] rounded-sm shadow-inner" />
                                    <div className="absolute top-8 right-5 w-10 h-10 rounded-full bg-rpg-gold border-4 border-yellow-700 flex items-center justify-center font-black text-yellow-900 text-lg shadow-md">$</div>
                                    <div className="w-[34%] h-[60%] bg-[#5c3a21] border-4 border-[#3d261b] rounded-t-lg shadow-inner relative">
                                        <div className="absolute right-1.5 top-1/2 w-1.5 h-1.5 rounded-full bg-rpg-gold" />
                                    </div>
                                </div>
                            </div>
                        );
                    }

                    if (dec.type === 'market_stall') {
                        return (
                            <div key={`dec_${i}`} className="absolute flex flex-col items-center" style={{ left: dec.x, top: dec.y, width: dec.width, height: dec.height, zIndex: Math.floor(dec.y + dec.height) }}>
                                <div className="w-[110%] h-[34%] rounded-t-sm shadow-md border-b-2 border-black/30" style={{ backgroundImage: `repeating-linear-gradient(90deg, ${dec.color} 0 14px, #f8fafc 14px 28px)` }} />
                                <div className="w-full flex-1 flex flex-col items-center justify-end">
                                    <div className="flex justify-between w-full px-1 flex-1">
                                        <div className="w-2 bg-[#5c3a21]" />
                                        <div className="w-2 bg-[#5c3a21]" />
                                    </div>
                                    <div className="w-full h-5 bg-[#7c4a2b] border-t-2 border-[#a16207] rounded-sm shadow" />
                                </div>
                            </div>
                        );
                    }

                    if (dec.type === 'fence') {
                        const horizontal = dec.width >= dec.height;
                        return (
                            <div key={`dec_${i}`} className="absolute" style={{ left: dec.x, top: dec.y, width: dec.width, height: dec.height, zIndex: Math.floor(dec.y + dec.height) }}>
                                <div className="w-full h-full border border-[#5c3a21] rounded-sm shadow-sm" style={{ backgroundImage: horizontal ? 'repeating-linear-gradient(90deg,#7c4a2b 0 18px,#5c3a21 18px 22px)' : 'repeating-linear-gradient(0deg,#7c4a2b 0 18px,#5c3a21 18px 22px)' }} />
                            </div>
                        );
                    }

                    if (dec.type === 'sign') {
                        return (
                            <div key={`dec_${i}`} className="absolute flex flex-col items-center pointer-events-none" style={{ left: dec.x, top: dec.y, transform: 'translate(-50%, -100%)', zIndex: Math.floor(dec.y) }}>
                                <div className="px-2 py-1 bg-[#7c4a2b] border-2 border-[#3d261b] rounded text-[9px] font-black text-yellow-100 uppercase tracking-wider shadow whitespace-nowrap">{dec.label}</div>
                                <div className="w-1.5 h-5 bg-[#3d261b]" />
                            </div>
                        );
                    }

                    if (dec.type === 'barrel') {
                        return (
                            <div key={`dec_${i}`} className="absolute pointer-events-none" style={{ left: dec.x, top: dec.y, width: dec.size, height: dec.size, transform: 'translate(-50%, -100%)', zIndex: Math.floor(dec.y) }}>
                                <div className="w-full h-full bg-[#7c4a2b] rounded-md border-x-4 border-[#5c3a21] shadow relative overflow-hidden">
                                    <div className="absolute top-0 w-full h-2 bg-[#a16207]" />
                                    <div className="absolute top-[30%] w-full h-1.5 bg-[#3d261b]" />
                                    <div className="absolute top-[64%] w-full h-1.5 bg-[#3d261b]" />
                                </div>
                            </div>
                        );
                    }

                    if (dec.type === 'crate') {
                        return (
                            <div key={`dec_${i}`} className="absolute pointer-events-none" style={{ left: dec.x, top: dec.y, width: dec.size, height: dec.size, transform: 'translate(-50%, -100%)', zIndex: Math.floor(dec.y) }}>
                                <div className="w-full h-full bg-[#a16207] border-4 border-[#7c4a2b] shadow relative">
                                    <div className="absolute inset-1 border-2 border-[#7c4a2b]" />
                                    <div className="absolute top-1/2 left-0 w-full h-1 bg-[#7c4a2b]" />
                                </div>
                            </div>
                        );
                    }

                    if (dec.type === 'lamp') {
                        return (
                            <div key={`dec_${i}`} className="absolute flex flex-col items-center pointer-events-none" style={{ left: dec.x, top: dec.y, width: dec.size * 0.5, height: dec.size, transform: 'translate(-50%, -100%)', zIndex: Math.floor(dec.y) }}>
                                <div className="w-3 h-3 rounded-full bg-yellow-300 shadow-[0_0_18px_rgba(253,224,71,0.9)] animate-flicker" />
                                <div className="w-4 h-3 bg-[#374151] -mt-0.5 rounded-sm" />
                                <div className="w-1.5 flex-1 bg-[#374151]" />
                                <div className="w-5 h-1.5 bg-[#1f2937] rounded-sm" />
                            </div>
                        );
                    }

                    if (dec.type === 'flowers') {
                        return (
                            <div key={`dec_${i}`} className="absolute pointer-events-none" style={{ left: dec.x, top: dec.y, width: dec.size, height: dec.size * 0.6, transform: 'translate(-50%, -100%)', zIndex: Math.floor(dec.y) }}>
                                <div className="relative w-full h-full">
                                    <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-full h-1/2 bg-green-700/50 rounded-full blur-[1px]" />
                                    <span className="absolute bottom-1 left-1 w-2 h-2 rounded-full bg-pink-400" />
                                    <span className="absolute bottom-2 left-1/2 w-2 h-2 rounded-full bg-yellow-300" />
                                    <span className="absolute bottom-1 right-1 w-2 h-2 rounded-full bg-sky-300" />
                                </div>
                            </div>
                        );
                    }

                    if (dec.type === 'bush') {
                        return (
                            <div key={`dec_${i}`} className="absolute pointer-events-none" style={{ left: dec.x, top: dec.y, width: dec.size, height: dec.size * 0.8, transform: 'translate(-50%, -100%)', zIndex: Math.floor(dec.y) }}>
                                <div className="w-full h-full bg-[#166534] rounded-full border-b-4 border-[#14532d] shadow-md relative">
                                    <div className="absolute top-1 left-2 w-1/3 h-1/3 bg-[#22c55e]/40 rounded-full" />
                                </div>
                            </div>
                        );
                    }

                    if (dec.type === 'bench') {
                        return (
                            <div key={`dec_${i}`} className="absolute pointer-events-none" style={{ left: dec.x, top: dec.y, width: dec.size, height: dec.size * 0.5, transform: 'translate(-50%, -100%)', zIndex: Math.floor(dec.y) }}>
                                <div className="relative w-full h-full">
                                    <div className="absolute top-0 w-full h-2 bg-[#8a5a2b] rounded-sm" />
                                    <div className="absolute top-2 w-full h-2 bg-[#7c4a2b] rounded-sm" />
                                    <div className="absolute bottom-0 left-1 w-2 h-3 bg-[#5c3a21]" />
                                    <div className="absolute bottom-0 right-1 w-2 h-3 bg-[#5c3a21]" />
                                </div>
                            </div>
                        );
                    }

                    if (dec.type === 'banner') {
                        return (
                            <div key={`dec_${i}`} className="absolute flex flex-col items-center pointer-events-none" style={{ left: dec.x, top: dec.y, transform: 'translate(-50%, 0)', zIndex: 5 }}>
                                <div className="w-10 h-1.5 bg-[#3d261b] rounded-full" />
                                <div className="w-9 h-16 flex items-center justify-center text-white text-lg shadow-lg" style={{ backgroundColor: dec.color, clipPath: 'polygon(0 0,100% 0,100% 82%,50% 100%,0 82%)' }}>{dec.icon}</div>
                            </div>
                        );
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

                    if (dec.type === 'vendor_npc') {
                        return (
                            <div key={`dec_${i}`} className="absolute flex flex-col items-center" style={{ left: dec.x, top: dec.y, transform: 'translate(-50%, -100%)', zIndex: Math.floor(dec.y) }}>
                                <div className="text-rpg-gold text-lg font-black animate-bounce drop-shadow mb-0.5">!</div>
                                <div className="bg-black/60 text-white text-[8px] px-2 py-0.5 rounded-full mb-1 border border-white/10 font-bold uppercase tracking-wider whitespace-nowrap">{dec.label}</div>
                                <div className="animate-world-bob">
                                    <PixelAvatar type={dec.avatar || 'monk'} scale={1.1} customColors={dec.colors} />
                                </div>
                                <div className="w-8 h-2 bg-black/40 rounded-full blur-sm mt-[-4px]" />
                            </div>
                        );
                    }

                    return null;
                })}

                {/* Render NPCs */}
                {npcs.map(npc => {
                    const npcChar = npc.state?.character || npc.character;
                    return (
                        <div key={npc.id} className="absolute transition-transform" style={{ left: npc.x, top: npc.y, transform: 'translate(-50%, -100%)', zIndex: Math.round(npc.y) }}>
                            <div className="flex flex-col items-center">
                                <div className="bg-black/60 text-white text-[9px] px-2 py-0.5 rounded-full font-bold mb-1 border border-white/10 whitespace-nowrap">{npc.username || npc.name}</div>
                                <div className="animate-world-bob" style={{ transform: npc.facing === 'left' ? 'scaleX(-1)' : 'scaleX(1)' }}>
                                    <PixelAvatar type={npcChar?.avatarId || 'warrior'} scale={1.0} customColors={npcChar?.avatarColors} />
                                </div>
                                <div className="w-8 h-2 bg-black/40 rounded-full blur-sm mt-[-4px]" />
                            </div>
                        </div>
                    );
                })}

                {/* Render Player Container */}
                <div 
                    ref={playerDOMRef}
                    className="absolute z-50 will-change-transform"
                    style={{ 
                        left: pos.x, 
                        top: pos.y, 
                        transform: 'translate(-50%, -100%)',
                        zIndex: Math.round(pos.y)
                    }}
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

            {/* UI Overlay */}
            <div className="absolute top-4 left-4 z-40 pointer-events-none">
                <div className="glass-panel px-4 py-2 flex items-center gap-3 backdrop-blur-xl bg-[#1a102e]/80 w-max shadow-xl">
                    <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.8)]"></div>
                    <div>
                        <div className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Current Area</div>
                        <div className="text-sm font-heading font-bold text-white text-shadow-sm">{map.name}</div>
                    </div>
                </div>
            </div>

            <div className="absolute top-4 right-16 z-40 pointer-events-none text-right hidden lg:block">
                <div className="bg-black/60 backdrop-blur-md px-4 py-2 rounded-xl border border-white/10 text-[10px] text-gray-300 font-mono w-max ml-auto">
                    <span className="font-bold text-white">W A S D</span> or <span className="font-bold text-white">ARROWS</span> to move<br/>
                </div>
            </div>

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

            {/* Mobile Controls */}
            <MobileJoystick
                onMove={(jsPos) => {
                    joyInput.current = jsPos;
                }}
                onStop={() => {
                    joyInput.current = { x: 0, y: 0 };
                }}
            />
        </div>
    );
};

export default PlayableWorld;
