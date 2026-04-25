import React, { useState, useEffect, useRef } from 'react';
import PixelAvatar from '../../common/PixelAvatar';
import MobileJoystick from './MobileJoystick';
import { MAP_DATA } from './MapData';

const TILE_SIZE = 40; // Collision buffer size
const SPEED = 5; // Pixels per frame (~300px per sec at 60fps)

const PlayableWorld = ({ currentUser, activeProfile, familyMembers, friends, onClose, className }) => {
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

    // Maintain viewport size cache for Camera centering
    useEffect(() => {
        if (!viewportRef.current) return;
        
        // Initial setup
        viewportSizeRef.current = {
            w: viewportRef.current.clientWidth,
            h: viewportRef.current.clientHeight
        };

        const ro = new ResizeObserver(entries => {
            for (let entry of entries) {
                viewportSizeRef.current = {
                    w: entry.contentRect.width,
                    h: entry.contentRect.height
                };
            }
        });
        ro.observe(viewportRef.current);
        return () => ro.disconnect();
    }, []);

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
                                style={{ left: dec.x, top: dec.y, width: dec.width, height: dec.height, backgroundColor: dec.color, border: dec.border ? `4px solid ${dec.border}` : 'none', borderRadius: dec.radius || 0, opacity: dec.opacity || 1, zIndex: dec.y }}
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
            <div className="sticky top-4 left-4 pointer-events-none float-left w-0">
                <div className="glass-panel px-4 py-2 flex items-center gap-3 backdrop-blur-xl bg-[#1a102e]/80 w-max shadow-xl">
                    <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.8)]"></div>
                    <div>
                        <div className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Current Area</div>
                        <div className="text-sm font-heading font-bold text-white text-shadow-sm">{map.name}</div>
                    </div>
                </div>
            </div>

            <div className="sticky top-4 right-4 pointer-events-none text-right hidden lg:block float-right w-0">
                <div className="bg-black/60 backdrop-blur-md px-4 py-2 rounded-xl border border-white/10 text-[10px] text-gray-300 font-mono mb-2 w-max ml-auto relative right-8">
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
