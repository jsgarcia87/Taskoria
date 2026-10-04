import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Trash2, Image as ImageIcon, X, Upload, Save, Eraser, Pipette, PaintBucket, Undo2, Redo2, Play, Square, Plus, Copy, FileJson, FlipHorizontal } from 'lucide-react';
import { frameToBuffer } from '../../utils/pixelFormat';
import { useConfirm } from '../../context/ConfirmContext';
import ModernPixelAvatar from '../common/ModernPixelAvatar';

const GRID_SIZE = 64;
const TOTAL = GRID_SIZE * GRID_SIZE;
const EMPTY = 'transparent';

const OFFICIAL_PALETTES = {
    'Basic Colors': ['#000000', '#ffffff', '#ffdbac', '#5d4037', '#bdc3c7', '#7f8c8d'],
    'Warrior Iron': ['#253347', '#3a4e69', '#567194', '#94a3b8'],
    'Mage Royal': ['#8a2be2', '#3b82f6', '#1e3a8a', '#d8b4fe'],
    'Ranger Forest': ['#2e8b57', '#064e3b', '#65a30d', '#14532d'],
    'Paladin Gold': ['#f1c40f', '#f59e0b', '#b45309', '#fef3c7'],
    'Dragon Crimson (Locked)': ['#8b0000', '#ef4444', '#7f1d1d', '#fca5a5']
};

const CATEGORIES = [
    { id: 'characters', label: 'Characters' },
    { id: 'pets', label: 'Pets' },
    { id: 'houses', label: 'Houses' },
    { id: 'castles', label: 'Castles' },
    { id: 'mounts', label: 'Mounts' },
    { id: 'trees', label: 'Trees' },
    { id: 'decoration', label: 'Decoration' },
    { id: 'props', label: 'Props' },
    { id: 'monsters', label: 'Monsters' },
    { id: 'cosmetics', label: 'Cosmetics / Gear' },
];

const LEGACY_CAT_MAP = {
    casas: 'houses', castillos: 'castles', monturas: 'mounts',
    arboles: 'trees', decoracion: 'decoration', monstruos: 'monsters',
    MASCOTAS: 'pets', PERSONAJES: 'characters', EDIFICIOS: 'houses',
    MAPAS: 'maps', PROPS: 'props',
};

const emptyBuffer = () => new Array(TOTAL).fill(EMPTY);

const CreationStudio = ({ currentUser, initialAsset = null, onSave = null }) => {
    const confirm = useConfirm();
    const [frames, setFrames] = useState(() => {
        if (initialAsset && initialAsset.pixels) {
            // handle single frame or multiple frames, in sparse {x,y,c} or flat buffer format
            let px = initialAsset.pixels;
            if (typeof px === 'string') {
                try { px = JSON.parse(px); } catch(e) {}
            }

            if (Array.isArray(px) && Array.isArray(px[0])) {
                return px.map(f => frameToBuffer(f, GRID_SIZE));
            } else if (Array.isArray(px)) {
                return [frameToBuffer(px, GRID_SIZE)];
            }
        }
        return [emptyBuffer()];
    });
    const [activeFrame, setActiveFrame] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);
    
    const [color, setColor] = useState(OFFICIAL_PALETTES['Basic Colors'][0]);
    const [tool, setTool] = useState('pencil'); // pencil | eraser | fill | picker
    const [symmetryMode, setSymmetryMode] = useState(false);
    const [customColor, setCustomColor] = useState('#ff0000');
    const [activePalette, setActivePalette] = useState('Basic Colors');
    const [name, setName] = useState(initialAsset ? initialAsset.name : '');
    const [category, setCategory] = useState(() => {
        const raw = initialAsset ? initialAsset.category : CATEGORIES[0].id;
        return LEGACY_CAT_MAP[raw] || (CATEGORIES.some(c => c.id === raw) ? raw : CATEGORIES[0].id);
    });
    const [price, setPrice] = useState(initialAsset ? initialAsset.price || 100 : 100);
    const [cosmeticClass, setCosmeticClass] = useState(() => {
        if (initialAsset && initialAsset.params) {
            try { const p = typeof initialAsset.params === 'string' ? JSON.parse(initialAsset.params) : initialAsset.params; return p.cosmeticClass || 'warrior'; } catch (e) {}
        }
        return 'warrior';
    });
    const [cosmeticSlot, setCosmeticSlot] = useState(() => {
        if (initialAsset && initialAsset.params) {
            try { const p = typeof initialAsset.params === 'string' ? JSON.parse(initialAsset.params) : initialAsset.params; return p.cosmeticSlot || 'head'; } catch (e) {}
        }
        return 'head';
    });
    const [showCosmeticGuide, setShowCosmeticGuide] = useState(true);
    const [refImage, setRefImage] = useState(null);
    const [refOpacity, setRefOpacity] = useState(0.5);
    const [refScale, setRefScale] = useState(100);
    const [refX, setRefX] = useState(50);
    const [refY, setRefY] = useState(50);
    const [refOnion, setRefOnion] = useState(true);
    const [sessionDrawings, setSessionDrawings] = useState(() => {
        try { return JSON.parse(localStorage.getItem('taskoria_studio_sessions') || '{}'); } catch { return {}; }
    });
    const [publishStatus, setPublishStatus] = useState({ state: 'idle', msg: '' });
    const [undoStack, setUndoStack] = useState([]);
    const [redoStack, setRedoStack] = useState([]);

    const canvasRef = useRef(null);
    const isDrawingRef = useRef(false);
    
    const framesRef = useRef(frames);
    framesRef.current = frames;
    const activeFrameRef = useRef(activeFrame);
    activeFrameRef.current = activeFrame;
    const isPlayingRef = useRef(isPlaying);
    isPlayingRef.current = isPlaying;

    const lastPaintedRef = useRef(-1);

    const [ownedCreations, setOwnedCreations] = useState([]);
    const [showRemixMenu, setShowRemixMenu] = useState(false);

    useEffect(() => {
        const session = JSON.parse(localStorage.getItem('taskoria_session') || '{}');
        if (session.id) {
            fetch(`api/creations.php?action=list_owned&user_id=${session.id}`)
                .then(res => res.json())
                .then(data => {
                    if (data.success) {
                        setOwnedCreations(data.items);
                    }
                })
                .catch(console.error);
        }
    }, []);

    const importFromBazaar = (item) => {
        pushUndo(framesRef.current, activeFrame);
        let px;
        try { px = typeof item.pixels === 'string' ? JSON.parse(item.pixels) : item.pixels; } catch (e) { px = []; }
        
        let newFrames;
        if (Array.isArray(px) && px.length > 0) {
            if (Array.isArray(px[0])) {
                newFrames = px.map(f => frameToBuffer(f, GRID_SIZE));
            } else if (typeof px[0] === 'string' && px[0].startsWith('#')) {
                // Flat palette buffer? Unlikely from DB, but just in case
                newFrames = [px];
            } else {
                newFrames = [frameToBuffer(px, GRID_SIZE)];
            }
        } else {
            newFrames = [emptyBuffer()];
        }
        
        setFrames(newFrames);
        setActiveFrame(0);
        setIsPlaying(false);
        setName(`${item.name} Remix`);
        setCategory(item.category);
        setShowRemixMenu(false);
    };

    // Playback loop
    useEffect(() => {
        if (!isPlaying) return;
        const interval = setInterval(() => {
            setActiveFrame(prev => (prev + 1) % framesRef.current.length);
        }, 1000 / 6); // 6 FPS
        return () => clearInterval(interval);
    }, [isPlaying]);

    // Render the canvas
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        ctx.imageSmoothingEnabled = false;
        ctx.clearRect(0, 0, GRID_SIZE, GRID_SIZE);

        const renderBuffer = (buf, opacity) => {
            ctx.globalAlpha = opacity;
            for (let i = 0; i < TOTAL; i++) {
                const p = buf[i];
                if (!p || p === EMPTY) continue;
                ctx.fillStyle = p;
                ctx.fillRect(i % GRID_SIZE, Math.floor(i / GRID_SIZE), 1, 1);
            }
        };

        if (!isPlaying && activeFrame > 0 && frames[activeFrame - 1]) {
            renderBuffer(frames[activeFrame - 1], 0.3); // Onion skin
        }

        if (frames[activeFrame]) {
            renderBuffer(frames[activeFrame], 1.0);
        }
        ctx.globalAlpha = 1.0;
    }, [frames, activeFrame, isPlaying]);

    const pushUndo = (fSnap, aSnap) => {
        // Deep copy frames
        const snap = fSnap.map(f => [...f]);
        setUndoStack(prev => {
            const next = [...prev, { frames: snap, activeFrame: aSnap }];
            return next.length > 50 ? next.slice(-50) : next;
        });
        setRedoStack([]);
    };

    const undo = () => {
        setUndoStack(prev => {
            if (prev.length === 0) return prev;
            const last = prev[prev.length - 1];
            setRedoStack(r => [...r, { frames: framesRef.current.map(f=>[...f]), activeFrame: activeFrameRef.current }]);
            setFrames(last.frames.map(f=>[...f]));
            setActiveFrame(last.activeFrame);
            return prev.slice(0, -1);
        });
    };

    const redo = () => {
        setRedoStack(prev => {
            if (prev.length === 0) return prev;
            const last = prev[prev.length - 1];
            setUndoStack(u => [...u, { frames: framesRef.current.map(f=>[...f]), activeFrame: activeFrameRef.current }]);
            setFrames(last.frames.map(f=>[...f]));
            setActiveFrame(last.activeFrame);
            return prev.slice(0, -1);
        });
    };

    const getCellIndexFromEvent = (e) => {
        const canvas = canvasRef.current;
        if (!canvas) return -1;
        const rect = canvas.getBoundingClientRect();
        const x = Math.floor(((e.clientX - rect.left) / rect.width) * GRID_SIZE);
        const y = Math.floor(((e.clientY - rect.top) / rect.height) * GRID_SIZE);
        if (x < 0 || x >= GRID_SIZE || y < 0 || y >= GRID_SIZE) return -1;
        return y * GRID_SIZE + x;
    };

    const floodFill = (buffer, idx, target, replacement) => {
        if (target === replacement) return buffer;
        const out = [...buffer];
        const stack = [idx];
        while (stack.length) {
            const i = stack.pop();
            if (i < 0 || i >= TOTAL) continue;
            if (out[i] !== target) continue;
            out[i] = replacement;
            const x = i % GRID_SIZE;
            const y = (i / GRID_SIZE) | 0;
            if (x > 0) stack.push(i - 1);
            if (x < GRID_SIZE - 1) stack.push(i + 1);
            if (y > 0) stack.push(i - GRID_SIZE);
            if (y < GRID_SIZE - 1) stack.push(i + GRID_SIZE);
        }
        return out;
    };

    const paintAt = (idx) => {
        if (idx < 0 || idx === lastPaintedRef.current || isPlayingRef.current) return;
        lastPaintedRef.current = idx;
        setFrames(prev => {
            const af = activeFrameRef.current;
            const currentBuf = prev[af];
            const value = tool === 'eraser' ? EMPTY : color;
            
            let mirrorIdx = -1;
            if (symmetryMode) {
                const x = idx % GRID_SIZE;
                const y = Math.floor(idx / GRID_SIZE);
                const mirrorX = GRID_SIZE - 1 - x;
                mirrorIdx = y * GRID_SIZE + mirrorX;
            }

            if (currentBuf[idx] === value && (mirrorIdx === -1 || currentBuf[mirrorIdx] === value)) return prev;
            
            const nextBuf = [...currentBuf];
            nextBuf[idx] = value;
            if (mirrorIdx !== -1) nextBuf[mirrorIdx] = value;

            const nextFrames = [...prev];
            nextFrames[af] = nextBuf;
            return nextFrames;
        });
    };

    const handlePointerDown = (e) => {
        if (isPlaying) return;
        e.preventDefault();
        const idx = getCellIndexFromEvent(e);
        if (idx < 0) return;

        const currentBuf = framesRef.current[activeFrame];

        if (tool === 'picker') {
            const c = currentBuf[idx];
            if (c && c !== EMPTY) setColor(c);
            return;
        }

        if (tool === 'fill') {
            pushUndo(framesRef.current, activeFrame);
            const replacement = color;
            
            let mirrorIdx = -1;
            if (symmetryMode) {
                const x = idx % GRID_SIZE;
                const y = Math.floor(idx / GRID_SIZE);
                const mirrorX = GRID_SIZE - 1 - x;
                mirrorIdx = y * GRID_SIZE + mirrorX;
            }

            setFrames(prev => {
                let nextBuf = floodFill(currentBuf, idx, currentBuf[idx], replacement);
                if (mirrorIdx !== -1) {
                    nextBuf = floodFill(nextBuf, mirrorIdx, nextBuf[mirrorIdx], replacement);
                }
                const nextFrames = [...prev];
                nextFrames[activeFrame] = nextBuf;
                return nextFrames;
            });
            return;
        }

        pushUndo(framesRef.current, activeFrame);
        isDrawingRef.current = true;
        lastPaintedRef.current = -1;
        paintAt(idx);
    };

    const handlePointerMove = (e) => {
        if (!isDrawingRef.current || isPlaying) return;
        const idx = getCellIndexFromEvent(e);
        paintAt(idx);
    };

    const handlePointerUp = () => {
        isDrawingRef.current = false;
        lastPaintedRef.current = -1;
    };

    useEffect(() => {
        window.addEventListener('pointerup', handlePointerUp);
        return () => window.removeEventListener('pointerup', handlePointerUp);
    }, []);

    useEffect(() => {
        const onKey = (e) => {
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'SELECT') return;
            if (e.ctrlKey || e.metaKey) {
                if (e.key === 'z') { e.preventDefault(); undo(); }
                if (e.key === 'y') { e.preventDefault(); redo(); }
                return;
            }
            const key = e.key.toLowerCase();
            if (key === 'p') setTool('pencil');
            else if (key === 'e') setTool('eraser');
            else if (key === 'b') setTool('fill');
            else if (key === 'i') setTool('picker');
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [undoStack, redoStack]);

    const clearCanvas = async () => {
        if (!await confirm({ title: 'Clear Canvas?', message: 'All frames will be wiped clean.', variant: 'warning', confirmText: 'Clear All' })) return;
        pushUndo(framesRef.current, activeFrame);
        setFrames([emptyBuffer()]);
        setActiveFrame(0);
        setIsPlaying(false);
    };

    const addFrame = () => {
        pushUndo(framesRef.current, activeFrame);
        setFrames(prev => [...prev, emptyBuffer()]);
        setActiveFrame(frames.length);
        setIsPlaying(false);
    };

    const duplicateFrame = () => {
        pushUndo(framesRef.current, activeFrame);
        setFrames(prev => {
            const next = [...prev];
            next.splice(activeFrame + 1, 0, [...prev[activeFrame]]);
            return next;
        });
        setActiveFrame(activeFrame + 1);
        setIsPlaying(false);
    };

    const deleteFrame = async () => {
        if (frames.length <= 1) return;
        if (!await confirm({ title: 'Delete Frame?', message: 'This frame will be removed.', variant: 'warning', confirmText: 'Delete' })) return;
        pushUndo(framesRef.current, activeFrame);
        setFrames(prev => prev.filter((_, i) => i !== activeFrame));
        setActiveFrame(Math.max(0, activeFrame - 1));
        setIsPlaying(false);
    };

    const persistSessions = (obj) => {
        try { localStorage.setItem('taskoria_studio_sessions', JSON.stringify(obj)); } catch {}
    };

    const saveToSession = () => {
        const finalName = (name || `sprite_${Date.now().toString().slice(-4)}`).trim();
        setName(finalName);
        setSessionDrawings(prev => {
            const next = { ...prev, [finalName]: framesRef.current.map(f=>[...f]) };
            persistSessions(next);
            return next;
        });
    };

    const loadFromSession = (key) => {
        pushUndo(framesRef.current, activeFrame);
        const data = sessionDrawings[key];
        if (data && data.length > 0 && !Array.isArray(data[0])) {
            setFrames([[...data]]);
        } else {
            setFrames(data.map(f=>[...f]));
        }
        setActiveFrame(0);
        setIsPlaying(false);
        setName(key);
    };

    const deleteFromSession = (key) => {
        setSessionDrawings(prev => {
            const next = { ...prev };
            delete next[key];
            persistSessions(next);
            return next;
        });
    };

    const handleRefUpload = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (ev) => {
            setRefImage(ev.target.result);
            setRefScale(100); setRefX(50); setRefY(50);
        };
        reader.readAsDataURL(file);
    };

    const clearRef = () => setRefImage(null);

    const handleJsonImport = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (ev) => {
            try {
                let json = JSON.parse(ev.target.result);

                // If the file wraps multiple blueprints ({ key: { paleta, blueprint } }),
                // let the user pick or grab the first one.
                const keys = Object.keys(json);
                if (keys.length > 0 && json[keys[0]]?.blueprint) {
                    if (keys.length > 1) {
                        const pick = prompt(`Multiple blueprints found:\n${keys.join(', ')}\n\nType the key to import:`);
                        if (!pick || !json[pick]) return;
                        json = json[pick];
                    } else {
                        json = json[keys[0]];
                    }
                }

                const { paleta, blueprint } = json;
                if (!paleta || !Array.isArray(blueprint)) {
                    alert('Invalid blueprint JSON — needs "paleta" and "blueprint" fields.');
                    return;
                }

                const gs = blueprint.length;
                if (gs !== GRID_SIZE) {
                    alert(`Blueprint is ${gs}×${gs} but editor is ${GRID_SIZE}×${GRID_SIZE}. Only ${GRID_SIZE}×${GRID_SIZE} can be imported.`);
                    return;
                }

                pushUndo(framesRef.current, activeFrame);
                const buf = emptyBuffer();
                for (let y = 0; y < blueprint.length; y++) {
                    const row = blueprint[y];
                    if (!row) continue;
                    for (let x = 0; x < row.length; x++) {
                        const ch = row[x];
                        if (ch === ' ') continue;
                        const c = paleta[ch];
                        if (c && c !== 'transparent') buf[y * GRID_SIZE + x] = c;
                    }
                }
                setFrames([buf]);
                setActiveFrame(0);
                setIsPlaying(false);

                // Add imported colors to palette display
                const imported = Object.values(paleta).filter(c => c && c !== 'transparent' && c.startsWith('#'));
                if (imported.length > 0) setColor(imported[0]);
            } catch (err) {
                alert('Failed to parse JSON: ' + err.message);
            }
        };
        reader.readAsText(file);
        e.target.value = '';
    };

    const handleJsonExport = () => {
        const buf = framesRef.current[activeFrameRef.current];
        if (!buf || buf.every(p => !p || p === EMPTY)) {
            alert('Canvas is empty — nothing to export.');
            return;
        }

        const colors = new Set();
        for (const p of buf) {
            if (p && p !== EMPTY) colors.add(p);
        }
        const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        const paleta = { ' ': 'transparent' };
        const colorToChar = { transparent: ' ' };
        let idx = 0;
        for (const c of [...colors].sort()) {
            const ch = letters[idx++] || `Z${idx}`;
            paleta[ch] = c;
            colorToChar[c] = ch;
        }

        const blueprint = [];
        for (let y = 0; y < GRID_SIZE; y++) {
            let row = '';
            for (let x = 0; x < GRID_SIZE; x++) {
                const p = buf[y * GRID_SIZE + x];
                row += (!p || p === EMPTY) ? ' ' : (colorToChar[p] || ' ');
            }
            blueprint.push(row);
        }

        const key = (name || 'sprite').trim().toLowerCase().replace(/\s+/g, '_');
        const json = JSON.stringify({ [key]: { paleta, blueprint } }, null, 2);
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${key}_blueprint.json`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const publish = async () => {
        const trimmed = (name || '').trim();
        if (!trimmed) { setPublishStatus({ state: 'error', msg: 'Name your creation first.' }); return; }
        if (!currentUser?.id) { setPublishStatus({ state: 'error', msg: 'You need to be logged in.' }); return; }
        
        let hasContent = false;
        for (let f of framesRef.current) {
            if (f.some(p => p && p !== EMPTY)) { hasContent = true; break; }
        }
        if (!hasContent) { setPublishStatus({ state: 'error', msg: 'The canvas is empty.' }); return; }

        setPublishStatus({ state: 'loading', msg: '' });
        
        // Convert buffers to sparse array of {x,y,c} for saving
        const formatBuffer = (buf) => {
            const out = [];
            for (let i = 0; i < TOTAL; i++) {
                if (buf[i] && buf[i] !== EMPTY) {
                    out.push({ x: i % GRID_SIZE, y: Math.floor(i / GRID_SIZE), c: buf[i] });
                }
            }
            return out;
        };
        const exportPixels = framesRef.current.length === 1 ? formatBuffer(framesRef.current[0]) : framesRef.current.map(formatBuffer);
        const finalPrice = Math.max(10, Math.min(500, parseInt(price, 10) || 100));

        const payloadParams = category === 'cosmetics' ? { cosmeticClass, cosmeticSlot } : undefined;

        if (onSave) {
            onSave({
                name: trimmed,
                category,
                price: finalPrice,
                pixels: exportPixels,
                gridSize: GRID_SIZE,
                params: payloadParams
            });
            return;
        }

        try {
            const res = await fetch('api/creations.php?action=publish', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    user_id: currentUser.id,
                    name: trimmed,
                    category,
                    grid_size: GRID_SIZE,
                    pixels: exportPixels,
                    price: finalPrice,
                    params: payloadParams
                }),
            });
            const data = await res.json();
            if (res.ok && data.success) {
                setPublishStatus({ state: 'success', msg: 'Published! Awaiting moderation.' });
            } else {
                setPublishStatus({ state: 'error', msg: data.error || 'Failed to publish.' });
            }
        } catch (err) {
            setPublishStatus({ state: 'error', msg: 'Connection error.' });
        }
    };

    const refStyle = useMemo(() => refImage ? {
        backgroundImage: `url(${refImage})`,
        backgroundSize: `${refScale}%`,
        backgroundPosition: `${refX}% ${refY}%`,
        backgroundRepeat: 'no-repeat',
        opacity: refOpacity,
        imageRendering: 'pixelated',
    } : { display: 'none' }, [refImage, refScale, refX, refY, refOpacity]);

    const sessionKeys = Object.keys(sessionDrawings);

    return (
        <div className="text-white">
            <header className="mb-6 text-center">
                <h1 className="text-3xl font-display font-bold tracking-wide text-rpg-gold">Taskoria Pixel Studio</h1>
                <p className="text-sm text-gray-400">Design props, houses, mounts and more for the world of Taskoria. Your creation will go through moderation before it appears in the world.</p>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                {/* LEFT PANEL: tools, palette, reference */}
                <aside className="lg:col-span-3 glass-panel p-4 rounded-2xl space-y-4">
                    <div>
                        <div className="text-xs uppercase tracking-widest text-rpg-gold mb-2">Tools</div>
                        <div className="grid grid-cols-5 gap-2">
                            <ToolBtn active={tool==='pencil'} onClick={() => setTool('pencil')} title="Pencil">✏️</ToolBtn>
                            <ToolBtn active={tool==='eraser'} onClick={() => setTool('eraser')} title="Eraser"><Eraser size={16}/></ToolBtn>
                            <ToolBtn active={tool==='fill'} onClick={() => setTool('fill')} title="Bucket"><PaintBucket size={16}/></ToolBtn>
                            <ToolBtn active={tool==='picker'} onClick={() => setTool('picker')} title="Eyedropper"><Pipette size={16}/></ToolBtn>
                            <ToolBtn active={symmetryMode} onClick={() => setSymmetryMode(s => !s)} title="Symmetry (Mirror)">
                                <FlipHorizontal size={16} className={symmetryMode ? 'text-rpg-gold' : ''} />
                            </ToolBtn>
                        </div>
                        <div className="grid grid-cols-2 gap-2 mt-2">
                            <button onClick={undo} disabled={undoStack.length===0} className="flex items-center justify-center gap-1 text-xs bg-white/5 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed border border-white/10 rounded px-2 py-1.5"><Undo2 size={14}/> Undo</button>
                            <button onClick={redo} disabled={redoStack.length===0} className="flex items-center justify-center gap-1 text-xs bg-white/5 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed border border-white/10 rounded px-2 py-1.5"><Redo2 size={14}/> Redo</button>
                        </div>
                    </div>

                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-xs uppercase tracking-widest text-rpg-gold">Palette</span>
                            <select 
                                value={activePalette}
                                onChange={(e) => setActivePalette(e.target.value)}
                                className="bg-black/40 border border-white/10 text-[10px] rounded px-1 py-0.5 text-gray-300 focus:outline-none"
                            >
                                {Object.keys(OFFICIAL_PALETTES).map(p => (
                                    <option key={p} value={p}>{p}</option>
                                ))}
                            </select>
                        </div>
                        {activePalette.includes('Locked') ? (
                            <div className="w-full text-center py-4 bg-black/40 border border-red-900/30 rounded text-red-500/50 text-[10px] font-bold tracking-widest">
                                🔒 Lote Premium / Loot
                            </div>
                        ) : (
                            <div className="grid grid-cols-6 gap-2">
                                {OFFICIAL_PALETTES[activePalette].map(c => (
                                    <button
                                        key={c}
                                        onClick={() => { setColor(c); setTool(t => t === 'eraser' || t === 'picker' ? 'pencil' : t); }}
                                        className={`aspect-square rounded border-2 transition-transform ${color===c ? 'border-rpg-gold scale-110 shadow-[0_0_8px_rgba(240,192,64,0.5)]' : 'border-white/10 hover:scale-105'}`}
                                        style={{ backgroundColor: c }}
                                        title={c}
                                    />
                                ))}
                            </div>
                        )}
                        <div className="flex items-center gap-2 mt-2 opacity-50 hover:opacity-100 transition-opacity">
                            <input
                                type="color"
                                value={customColor}
                                onChange={(e) => { setCustomColor(e.target.value); setColor(e.target.value); setTool(t => t === 'eraser' || t === 'picker' ? 'pencil' : t); }}
                                className="w-7 h-7 rounded cursor-pointer bg-transparent border border-white/10"
                            />
                            <span className="text-[10px] text-gray-400">Custom (Non-canon)</span>
                        </div>
                    </div>

                    <div>
                        <div className="text-xs uppercase tracking-widest text-rpg-gold mb-2 flex items-center gap-1"><ImageIcon size={14}/> Reference image</div>
                        <label className="flex items-center justify-center gap-2 cursor-pointer text-xs bg-white/5 hover:bg-white/10 border border-white/10 rounded px-3 py-2">
                            <Upload size={14}/> Upload image
                            <input type="file" accept="image/*" onChange={handleRefUpload} className="hidden"/>
                        </label>
                        {refImage && (
                            <div className="space-y-2 mt-2 text-xs text-gray-400">
                                <button
                                    onClick={() => setRefOnion(o => !o)}
                                    className={`w-full text-xs border rounded px-2 py-1.5 flex items-center justify-center gap-1 transition-colors ${refOnion ? 'bg-rpg-gold/20 border-rpg-gold/40 text-rpg-gold' : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10'}`}
                                >
                                    {refOnion ? 'Onion skin ON' : 'Onion skin OFF'}
                                </button>
                                <Slider label="Opacity" min={0} max={1} step={0.05} value={refOpacity} onChange={setRefOpacity}/>
                                <Slider label="Scale" min={10} max={1000} step={5} value={refScale} onChange={setRefScale}/>
                                <Slider label="X Axis" min={0} max={100} step={0.5} value={refX} onChange={setRefX}/>
                                <Slider label="Y Axis" min={0} max={100} step={0.5} value={refY} onChange={setRefY}/>
                                <button onClick={clearRef} className="w-full text-xs bg-white/5 hover:bg-white/10 border border-white/10 rounded px-2 py-1.5 flex items-center justify-center gap-1"><X size={12}/> Remove guide</button>
                            </div>
                        )}
                    </div>

                    <div>
                        <div className="text-xs uppercase tracking-widest text-rpg-gold mb-2 flex items-center gap-1"><FileJson size={14}/> Blueprint JSON</div>
                        <div className="grid grid-cols-2 gap-2">
                            <label className="flex items-center justify-center gap-1 cursor-pointer text-xs bg-white/5 hover:bg-white/10 border border-white/10 rounded px-2 py-2">
                                <Upload size={14}/> Import
                                <input type="file" accept=".json,application/json" onChange={handleJsonImport} className="hidden"/>
                            </label>
                            <button onClick={handleJsonExport} className="flex items-center justify-center gap-1 text-xs bg-white/5 hover:bg-white/10 border border-white/10 rounded px-2 py-2">
                                <Save size={14}/> Export
                            </button>
                        </div>
                        <p className="text-[10px] text-gray-500 mt-1">Import/export blueprint JSON (paleta + rows).</p>
                    </div>

                    <div>
                        <div className="text-xs uppercase tracking-widest text-rpg-gold mb-2 flex items-center justify-between">
                            <span className="flex items-center gap-1"><Save size={14}/> Local Drafts</span>
                            <button onClick={saveToSession} className="text-[10px] bg-rpg-gold/20 hover:bg-rpg-gold/30 text-rpg-gold px-2 py-0.5 rounded border border-rpg-gold/30 transition-colors">Save</button>
                        </div>
                        {sessionKeys.length === 0 ? (
                            <p className="text-[10px] text-gray-500 italic">No saved drafts yet.</p>
                        ) : (
                            <div className="space-y-1.5 max-h-32 overflow-y-auto custom-scrollbar pr-1">
                                {sessionKeys.map(key => (
                                    <div key={key} className="flex items-center justify-between bg-black/40 border border-white/5 rounded px-2 py-1.5 hover:bg-white/[0.03] transition-colors group">
                                        <button onClick={() => loadFromSession(key)} className="flex-1 text-left text-xs text-gray-300 truncate hover:text-white transition-colors">{key}</button>
                                        <button onClick={() => deleteFromSession(key)} className="text-red-500/50 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all px-1"><Trash2 size={12}/></button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <div>
                        <button 
                            onClick={() => setShowRemixMenu(!showRemixMenu)}
                            className="w-full text-xs bg-indigo-900/20 hover:bg-indigo-900/30 border border-indigo-700/40 text-indigo-300 rounded px-2 py-2 flex items-center justify-center gap-1 transition-colors"
                        >
                            Remix from Bazaar
                        </button>
                        {showRemixMenu && (
                            <div className="mt-2 space-y-1.5 max-h-32 overflow-y-auto custom-scrollbar pr-1">
                                {ownedCreations.length === 0 ? (
                                    <p className="text-[10px] text-gray-500 italic">No creations owned yet. Buy some at the Bazaar!</p>
                                ) : (
                                    ownedCreations.map(item => (
                                        <button 
                                            key={item.id}
                                            onClick={() => importFromBazaar(item)} 
                                            className="w-full text-left bg-black/40 border border-white/5 rounded px-2 py-1.5 hover:bg-white/[0.03] transition-colors text-xs text-gray-300 hover:text-white truncate flex items-center gap-2"
                                        >
                                            <span className="text-[10px] bg-white/10 px-1 rounded">{item.category}</span>
                                            <span className="truncate">{item.name}</span>
                                        </button>
                                    ))
                                )}
                            </div>
                        )}
                    </div>

                    <button onClick={clearCanvas} className="w-full flex items-center justify-center gap-2 text-xs bg-red-900/20 hover:bg-red-900/30 border border-red-700/40 text-red-300 rounded px-3 py-2">
                        <Trash2 size={14}/> Clear canvas
                    </button>
                </aside>

                {/* CENTER: Canvas & Timeline */}
                <main className="lg:col-span-6 flex flex-col items-center">
                    <div
                        className={`relative w-full max-w-[640px] aspect-square border-4 ${isPlaying ? 'border-rpg-gold' : 'border-black'} bg-[#12121e] shadow-2xl overflow-hidden touch-none transition-colors`}
                        style={{ cursor: tool === 'picker' ? 'crosshair' : 'cell' }}
                        onPointerDown={handlePointerDown}
                        onPointerMove={handlePointerMove}
                    >
                        {!refOnion && <div className="absolute inset-0 pointer-events-none" style={refStyle}></div>}
                        
                        {category === 'cosmetics' && showCosmeticGuide && (
                            <div className="absolute inset-0 pointer-events-none opacity-[0.25] [&>div]:!w-full [&>div]:!h-full [&_canvas]:!w-full [&_canvas]:!h-full">
                                <ModernPixelAvatar type={cosmeticClass} scale={1} />
                            </div>
                        )}

                        <canvas
                            ref={canvasRef}
                            width={GRID_SIZE}
                            height={GRID_SIZE}
                            className="absolute inset-0 w-full h-full"
                            style={{ imageRendering: 'pixelated' }}
                        />
                        {refOnion && <div className="absolute inset-0 pointer-events-none z-10" style={refStyle}></div>}
                        {/* Grid overlay */}
                        {!isPlaying && (
                            <div className="absolute inset-0 pointer-events-none" style={{
                                backgroundImage: 'linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px)',
                                backgroundSize: `${100/GRID_SIZE}% ${100/GRID_SIZE}%`,
                            }}></div>
                        )}
                    </div>
                    <div className="mt-2 text-[10px] text-gray-500 tracking-widest uppercase mb-1">{GRID_SIZE}×{GRID_SIZE} | {frames.length} {frames.length === 1 ? 'Frame' : 'Frames'}</div>
                    <div className="text-[9px] text-purple-400/60 mb-3">P pencil · E eraser · B bucket · I eyedropper · Ctrl+Z undo · Ctrl+Y redo</div>
                    
                    {/* TIMELINE CONTROLS */}
                    <div className="w-full max-w-[640px] glass-panel p-3 rounded-xl flex flex-col gap-3">
                        <div className="flex items-center justify-between">
                            <div className="flex gap-2">
                                <button onClick={() => setIsPlaying(!isPlaying)} className={`flex items-center justify-center gap-1 text-xs px-3 py-1.5 rounded border transition-colors ${isPlaying ? 'bg-rpg-gold text-black border-rpg-gold' : 'bg-white/5 border-white/10 hover:bg-white/10'}`}>
                                    {isPlaying ? <Square size={14}/> : <Play size={14}/>} {isPlaying ? 'Stop' : 'Play'}
                                </button>
                            </div>
                            <div className="flex gap-2">
                                <button onClick={addFrame} title="Add blank frame" className="flex items-center justify-center p-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded"><Plus size={16}/></button>
                                <button onClick={duplicateFrame} title="Duplicate current frame" className="flex items-center justify-center p-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded"><Copy size={16}/></button>
                                <button onClick={deleteFrame} disabled={frames.length <= 1} title="Delete current frame" className="flex items-center justify-center p-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded disabled:opacity-30 text-red-400"><Trash2 size={16}/></button>
                            </div>
                        </div>
                        <div className="flex overflow-x-auto gap-2 pb-1 custom-scrollbar">
                            {frames.map((f, i) => (
                                <button 
                                    key={i} 
                                    onClick={() => { setActiveFrame(i); setIsPlaying(false); }} 
                                    className={`w-12 h-12 flex-shrink-0 flex items-center justify-center rounded text-xs font-mono border-2 transition-all ${i === activeFrame ? 'border-rpg-gold bg-rpg-gold/10 text-rpg-gold scale-105' : 'border-white/10 bg-black/40 text-gray-400 hover:border-white/30'}`}
                                >
                                    {i + 1}
                                </button>
                            ))}
                        </div>
                    </div>
                </main>

                {/* RIGHT PANEL: name, category, publish, session */}
                <aside className="lg:col-span-3 glass-panel p-4 rounded-2xl space-y-4">
                    <div>
                        <div className="text-xs uppercase tracking-widest text-rpg-gold mb-2">Publish to Taskoria</div>
                        <label className="block text-xs text-gray-400 mb-1">Name</label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Blacksmith's house..."
                            className="w-full bg-black/40 border border-white/10 rounded px-3 py-2 text-sm focus:border-rpg-gold focus:outline-none"
                            maxLength={120}
                        />
                        <label className="block text-xs text-gray-400 mb-1 mt-3">Category</label>
                        <select
                            value={category}
                            onChange={(e) => setCategory(e.target.value)}
                            className="w-full bg-black/40 border border-white/10 rounded px-3 py-2 text-sm focus:border-rpg-gold focus:outline-none"
                        >
                            {CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
                        </select>

                        {category === 'cosmetics' && (
                            <div className="mt-3 space-y-2 p-3 bg-black/40 border border-white/10 rounded-xl">
                                <div>
                                    <label className="block text-xs text-rpg-gold mb-1">Target Class</label>
                                    <select
                                        value={cosmeticClass}
                                        onChange={(e) => setCosmeticClass(e.target.value)}
                                        className="w-full bg-black/40 border border-white/10 rounded px-2 py-1 text-sm focus:border-rpg-gold focus:outline-none"
                                    >
                                        <option value="warrior">Warrior</option>
                                        <option value="mage">Mage</option>
                                        <option value="rogue">Rogue</option>
                                        <option value="ranger">Ranger</option>
                                        <option value="cleric">Cleric</option>
                                        <option value="paladin">Paladin</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs text-rpg-gold mb-1">Equipment Slot</label>
                                    <select
                                        value={cosmeticSlot}
                                        onChange={(e) => setCosmeticSlot(e.target.value)}
                                        className="w-full bg-black/40 border border-white/10 rounded px-2 py-1 text-sm focus:border-rpg-gold focus:outline-none"
                                    >
                                        <option value="head">Cabeza (Cascos, sombreros)</option>
                                        <option value="torso">Torso (Armaduras, camisas)</option>
                                        <option value="legs">Piernas (Pantalones, botas)</option>
                                        <option value="weapon">Arma principal</option>
                                        <option value="shield">Escudo / Secundario</option>
                                        <option value="accessory">Accesorio</option>
                                    </select>
                                </div>
                                <button 
                                    onClick={() => setShowCosmeticGuide(p => !p)} 
                                    className={`w-full text-xs border rounded px-2 py-1.5 flex items-center justify-center transition-colors ${showCosmeticGuide ? 'bg-rpg-gold/20 border-rpg-gold/40 text-rpg-gold' : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10'}`}
                                >
                                    {showCosmeticGuide ? 'Ocultar guía del personaje' : 'Mostrar guía del personaje'}
                                </button>
                            </div>
                        )}

                        <label className="block text-xs text-gray-400 mb-1 mt-3">Bazaar price</label>
                        <div className="flex items-center gap-2">
                            <input
                                type="number"
                                min={10}
                                max={500}
                                step={10}
                                value={price}
                                onChange={(e) => setPrice(e.target.value)}
                                className="flex-1 bg-black/40 border border-white/10 rounded px-3 py-2 text-sm focus:border-rpg-gold focus:outline-none font-mono"
                            />
                            <span className="text-[10px] uppercase tracking-widest text-rpg-gold whitespace-nowrap">gold</span>
                        </div>
                        <p className="text-[10px] text-gray-500 mt-1">Between 10 and 500. Quartermistress Coinhilda may adjust at approval — the Treasury guards a fair rate.</p>

                        <button 
                            onClick={publish}
                            disabled={publishStatus.state === 'loading'}
                            className="w-full bg-rpg-gold text-black font-bold uppercase tracking-widest text-sm py-4 rounded-xl flex justify-center items-center gap-2 hover:bg-yellow-400 disabled:opacity-50 transition-colors mt-3"
                        >
                            {publishStatus.state === 'loading' ? <span className="animate-pulse">Saving...</span> : (onSave ? 'Save Changes' : 'Publish Creation')}
                        </button>
                        {publishStatus.msg && (
                            <p className={`text-xs mt-2 ${publishStatus.state === 'success' ? 'text-green-400' : 'text-red-400'}`}>{publishStatus.msg}</p>
                        )}
                        <p className="text-[10px] text-gray-500 mt-2 leading-relaxed">
                            Your creation will go through moderation. If approved, it may appear in the world of Taskoria.
                        </p>
                    </div>

                    <div>
                        <div className="text-xs uppercase tracking-widest text-rpg-gold mb-2 flex items-center justify-between">
                            <span>Current session</span>
                            <span className="text-gray-500 normal-case">{sessionKeys.length}</span>
                        </div>
                        <button onClick={saveToSession} className="w-full flex items-center justify-center gap-2 text-xs bg-white/5 hover:bg-white/10 border border-white/10 rounded px-3 py-2 mb-2">
                            <Save size={14}/> Save to session
                        </button>
                        <div className="space-y-1 max-h-40 overflow-y-auto">
                            {sessionKeys.length === 0 && <p className="text-[10px] text-gray-600 text-center">Empty.</p>}
                            {sessionKeys.map(k => (
                                <div key={k} className="flex items-center justify-between bg-black/40 border border-white/10 rounded px-2 py-1.5">
                                    <span className="text-xs font-mono truncate text-green-400">{k}</span>
                                    <div className="flex gap-1 flex-shrink-0">
                                        <button onClick={() => loadFromSession(k)} className="text-[10px] bg-white/5 hover:bg-white/15 px-2 py-1 rounded">Load</button>
                                        <button onClick={() => deleteFromSession(k)} className="text-[10px] bg-red-900/20 hover:bg-red-900/40 text-red-300 px-2 py-1 rounded">X</button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </aside>
            </div>
        </div>
    );
};

const ToolBtn = ({ active, onClick, children, title }) => (
    <button
        onClick={onClick}
        title={title}
        className={`aspect-square flex items-center justify-center rounded border text-sm transition-all ${active ? 'bg-rpg-gold/20 border-rpg-gold text-rpg-gold' : 'bg-white/5 hover:bg-white/10 border-white/10'}`}
    >
        {children}
    </button>
);

const Slider = ({ label, min, max, step, value, onChange }) => (
    <div className="flex items-center gap-2">
        <span className="w-14 text-[10px]">{label}</span>
        <input
            type="range"
            min={min} max={max} step={step}
            value={value}
            onChange={(e) => onChange(parseFloat(e.target.value))}
            className="flex-grow accent-rpg-gold"
        />
    </div>
);

export default CreationStudio;
