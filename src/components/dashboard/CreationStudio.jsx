import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Trash2, Image as ImageIcon, X, Upload, Save, Eraser, Pipette, PaintBucket, Undo2, Redo2 } from 'lucide-react';

const GRID_SIZE = 64;
const TOTAL = GRID_SIZE * GRID_SIZE;
const EMPTY = 'transparent';

const PALETTE = [
    '#000000','#ffdbac','#567194','#3a4e69','#253347',
    '#bdc3c7','#7f8c8d','#ffffff','#5d4037','#f1c40f',
    '#2e8b57','#8b0000','#8a2be2','#f59e0b','#3b82f6',
];

const CATEGORIES = [
    { id: 'casas', label: 'Houses' },
    { id: 'castillos', label: 'Castles' },
    { id: 'monturas', label: 'Mounts' },
    { id: 'arboles', label: 'Trees' },
    { id: 'decoracion', label: 'Decoration' },
    { id: 'props', label: 'Props' },
];

const emptyBuffer = () => new Array(TOTAL).fill(EMPTY);

const CreationStudio = ({ currentUser }) => {
    const [pixels, setPixels] = useState(emptyBuffer);
    const [color, setColor] = useState(PALETTE[0]);
    const [tool, setTool] = useState('pencil'); // pencil | eraser | fill | picker
    const [customColor, setCustomColor] = useState('#ff0000');
    const [name, setName] = useState('');
    const [category, setCategory] = useState(CATEGORIES[0].id);
    const [refImage, setRefImage] = useState(null);
    const [refOpacity, setRefOpacity] = useState(0.5);
    const [refScale, setRefScale] = useState(100);
    const [refX, setRefX] = useState(50);
    const [refY, setRefY] = useState(50);
    const [sessionDrawings, setSessionDrawings] = useState({});
    const [publishStatus, setPublishStatus] = useState({ state: 'idle', msg: '' });
    const [undoStack, setUndoStack] = useState([]);
    const [redoStack, setRedoStack] = useState([]);

    const canvasRef = useRef(null);
    const isDrawingRef = useRef(false);
    const pixelsRef = useRef(pixels);
    pixelsRef.current = pixels;
    const lastPaintedRef = useRef(-1);

    // Render the canvas whenever pixels change
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        ctx.imageSmoothingEnabled = false;
        ctx.clearRect(0, 0, GRID_SIZE, GRID_SIZE);
        for (let i = 0; i < TOTAL; i++) {
            const p = pixels[i];
            if (!p || p === EMPTY) continue;
            ctx.fillStyle = p;
            ctx.fillRect(i % GRID_SIZE, Math.floor(i / GRID_SIZE), 1, 1);
        }
    }, [pixels]);

    const pushUndo = (snapshot) => {
        setUndoStack(prev => {
            const next = [...prev, snapshot];
            return next.length > 50 ? next.slice(-50) : next;
        });
        setRedoStack([]);
    };

    const undo = () => {
        setUndoStack(prev => {
            if (prev.length === 0) return prev;
            const last = prev[prev.length - 1];
            setRedoStack(r => [...r, pixelsRef.current]);
            setPixels(last);
            return prev.slice(0, -1);
        });
    };

    const redo = () => {
        setRedoStack(prev => {
            if (prev.length === 0) return prev;
            const last = prev[prev.length - 1];
            setUndoStack(u => [...u, pixelsRef.current]);
            setPixels(last);
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
        if (idx < 0 || idx === lastPaintedRef.current) return;
        lastPaintedRef.current = idx;
        setPixels(prev => {
            const value = tool === 'eraser' ? EMPTY : color;
            if (prev[idx] === value) return prev;
            const next = [...prev];
            next[idx] = value;
            return next;
        });
    };

    const handlePointerDown = (e) => {
        e.preventDefault();
        const idx = getCellIndexFromEvent(e);
        if (idx < 0) return;

        if (tool === 'picker') {
            const c = pixelsRef.current[idx];
            if (c && c !== EMPTY) setColor(c);
            return;
        }

        if (tool === 'fill') {
            pushUndo(pixelsRef.current);
            const replacement = color;
            setPixels(floodFill(pixelsRef.current, idx, pixelsRef.current[idx], replacement));
            return;
        }

        pushUndo(pixelsRef.current);
        isDrawingRef.current = true;
        lastPaintedRef.current = -1;
        paintAt(idx);
    };

    const handlePointerMove = (e) => {
        if (!isDrawingRef.current) return;
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

    const clearCanvas = () => {
        if (!confirm('Clear canvas?')) return;
        pushUndo(pixelsRef.current);
        setPixels(emptyBuffer());
    };

    const saveToSession = () => {
        const finalName = (name || `sprite_${Date.now().toString().slice(-4)}`).trim();
        setName(finalName);
        setSessionDrawings(prev => ({ ...prev, [finalName]: [...pixelsRef.current] }));
    };

    const loadFromSession = (key) => {
        pushUndo(pixelsRef.current);
        setPixels([...sessionDrawings[key]]);
        setName(key);
    };

    const deleteFromSession = (key) => {
        setSessionDrawings(prev => {
            const next = { ...prev };
            delete next[key];
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

    const publish = async () => {
        const trimmed = (name || '').trim();
        if (!trimmed) { setPublishStatus({ state: 'error', msg: 'Name your creation first.' }); return; }
        if (!currentUser?.id) { setPublishStatus({ state: 'error', msg: 'You need to be logged in.' }); return; }
        const hasContent = pixelsRef.current.some(p => p && p !== EMPTY);
        if (!hasContent) { setPublishStatus({ state: 'error', msg: 'The canvas is empty.' }); return; }

        setPublishStatus({ state: 'loading', msg: '' });
        try {
            const res = await fetch('api/creations.php?action=publish', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    user_id: currentUser.id,
                    name: trimmed,
                    category,
                    grid_size: GRID_SIZE,
                    pixels: pixelsRef.current,
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
                        <div className="grid grid-cols-4 gap-2">
                            <ToolBtn active={tool==='pencil'} onClick={() => setTool('pencil')} title="Pencil">✏️</ToolBtn>
                            <ToolBtn active={tool==='eraser'} onClick={() => setTool('eraser')} title="Eraser"><Eraser size={16}/></ToolBtn>
                            <ToolBtn active={tool==='fill'} onClick={() => setTool('fill')} title="Bucket"><PaintBucket size={16}/></ToolBtn>
                            <ToolBtn active={tool==='picker'} onClick={() => setTool('picker')} title="Eyedropper"><Pipette size={16}/></ToolBtn>
                        </div>
                        <div className="grid grid-cols-2 gap-2 mt-2">
                            <button onClick={undo} disabled={undoStack.length===0} className="flex items-center justify-center gap-1 text-xs bg-white/5 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed border border-white/10 rounded px-2 py-1.5"><Undo2 size={14}/> Undo</button>
                            <button onClick={redo} disabled={redoStack.length===0} className="flex items-center justify-center gap-1 text-xs bg-white/5 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed border border-white/10 rounded px-2 py-1.5"><Redo2 size={14}/> Redo</button>
                        </div>
                    </div>

                    <div>
                        <div className="text-xs uppercase tracking-widest text-rpg-gold mb-2">Palette</div>
                        <div className="grid grid-cols-5 gap-2">
                            {PALETTE.map(c => (
                                <button
                                    key={c}
                                    onClick={() => { setColor(c); setTool(t => t === 'eraser' || t === 'picker' ? 'pencil' : t); }}
                                    className={`aspect-square rounded border-2 transition-transform ${color===c ? 'border-rpg-gold scale-110 shadow-[0_0_8px_rgba(240,192,64,0.5)]' : 'border-white/10 hover:scale-105'}`}
                                    style={{ backgroundColor: c }}
                                    title={c}
                                />
                            ))}
                        </div>
                        <div className="flex items-center gap-2 mt-2">
                            <input
                                type="color"
                                value={customColor}
                                onChange={(e) => { setCustomColor(e.target.value); setColor(e.target.value); setTool(t => t === 'eraser' || t === 'picker' ? 'pencil' : t); }}
                                className="w-9 h-9 rounded cursor-pointer bg-transparent border border-white/10"
                            />
                            <span className="text-xs text-gray-400">Custom color</span>
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
                                <Slider label="Opacity" min={0} max={1} step={0.05} value={refOpacity} onChange={setRefOpacity}/>
                                <Slider label="Scale" min={10} max={1000} step={5} value={refScale} onChange={setRefScale}/>
                                <Slider label="X Axis" min={0} max={100} step={0.5} value={refX} onChange={setRefX}/>
                                <Slider label="Y Axis" min={0} max={100} step={0.5} value={refY} onChange={setRefY}/>
                                <button onClick={clearRef} className="w-full text-xs bg-white/5 hover:bg-white/10 border border-white/10 rounded px-2 py-1.5 flex items-center justify-center gap-1"><X size={12}/> Remove guide</button>
                            </div>
                        )}
                    </div>

                    <button onClick={clearCanvas} className="w-full flex items-center justify-center gap-2 text-xs bg-red-900/20 hover:bg-red-900/30 border border-red-700/40 text-red-300 rounded px-3 py-2">
                        <Trash2 size={14}/> Clear canvas
                    </button>
                </aside>

                {/* CENTER: Canvas */}
                <main className="lg:col-span-6 flex flex-col items-center">
                    <div
                        className="relative w-full max-w-[640px] aspect-square border-4 border-black bg-[#12121e] shadow-2xl overflow-hidden touch-none"
                        style={{ cursor: tool === 'picker' ? 'crosshair' : 'cell' }}
                        onPointerDown={handlePointerDown}
                        onPointerMove={handlePointerMove}
                    >
                        <div className="absolute inset-0 pointer-events-none" style={refStyle}></div>
                        <canvas
                            ref={canvasRef}
                            width={GRID_SIZE}
                            height={GRID_SIZE}
                            className="absolute inset-0 w-full h-full"
                            style={{ imageRendering: 'pixelated' }}
                        />
                        {/* Grid overlay */}
                        <div className="absolute inset-0 pointer-events-none" style={{
                            backgroundImage: 'linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px)',
                            backgroundSize: `${100/GRID_SIZE}% ${100/GRID_SIZE}%`,
                        }}></div>
                    </div>
                    <div className="mt-2 text-[10px] text-gray-500 tracking-widest uppercase">{GRID_SIZE}×{GRID_SIZE}</div>
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

                        <button
                            onClick={publish}
                            disabled={publishStatus.state === 'loading'}
                            className="mt-3 w-full bg-rpg-gold hover:brightness-110 disabled:opacity-50 text-black font-bold uppercase tracking-widest text-sm py-3 rounded transition-all"
                        >
                            {publishStatus.state === 'loading' ? 'Publishing...' : 'Publish'}
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
