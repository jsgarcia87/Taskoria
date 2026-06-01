import React, { useEffect, useState, useRef } from 'react';
import { Loader, Check, X } from 'lucide-react';

const PreviewCanvas = ({ pixels, gridSize, size = 96 }) => {
    const ref = useRef(null);
    useEffect(() => {
        const c = ref.current;
        if (!c) return;
        const ctx = c.getContext('2d');
        ctx.imageSmoothingEnabled = false;
        ctx.clearRect(0, 0, gridSize, gridSize);
        let arr = pixels;
        if (typeof pixels === 'string') {
            try { arr = JSON.parse(pixels); } catch (e) { arr = []; }
        }
        if (!Array.isArray(arr)) return;
        for (let i = 0; i < arr.length; i++) {
            const p = arr[i];
            if (!p || p === 'transparent') continue;
            ctx.fillStyle = p;
            ctx.fillRect(i % gridSize, Math.floor(i / gridSize), 1, 1);
        }
    }, [pixels, gridSize]);
    return (
        <canvas
            ref={ref}
            width={gridSize}
            height={gridSize}
            style={{ width: size, height: size, imageRendering: 'pixelated' }}
            className="bg-[#0f0a1f] border border-white/10 rounded"
        />
    );
};

const CreationsModeration = ({ currentUser }) => {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [working, setWorking] = useState({});

    const load = async () => {
        setLoading(true);
        try {
            const res = await fetch(`api/creations.php?action=list_pending&admin_id=${currentUser.id}`);
            const data = await res.json();
            if (data.success) setItems(data.items || []);
            else setItems([]);
        } catch (e) {
            setItems([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { load(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

    const moderate = async (id, decision) => {
        let reason = null;
        if (decision === 'rejected') {
            reason = prompt('Motivo del rechazo (opcional):') || '';
        }
        setWorking(w => ({ ...w, [id]: true }));
        try {
            await fetch('api/creations.php?action=moderate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ admin_id: currentUser.id, id, decision, reason }),
            });
            setItems(prev => prev.filter(it => it.id !== id));
        } finally {
            setWorking(w => { const n = { ...w }; delete n[id]; return n; });
        }
    };

    return (
        <div className="glass-card p-0 overflow-hidden border border-white/10 rounded-2xl flex flex-col">
            <div className="p-4 border-b border-white/10 bg-black/40 flex items-center justify-between">
                <div>
                    <h3 className="text-xl font-bold text-rpg-gold">Pixel Studio · Cola de moderación</h3>
                    <p className="text-xs text-gray-400">Aprueba o rechaza las creaciones de la comunidad.</p>
                </div>
                <span className="text-[10px] uppercase tracking-widest bg-amber-500/10 border border-amber-500/30 text-amber-400 px-2 py-1 rounded">{items.length} pendientes</span>
            </div>
            <div className="p-4">
                {loading ? (
                    <div className="flex items-center justify-center py-10 text-rpg-gold"><Loader className="animate-spin" size={24}/></div>
                ) : items.length === 0 ? (
                    <div className="text-center text-gray-500 italic py-10">Nada pendiente. ¡La cola está vacía!</div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {items.map(item => (
                            <div key={item.id} className="bg-black/40 border border-white/10 rounded-xl p-3 flex gap-3 items-center">
                                <PreviewCanvas pixels={item.pixels} gridSize={item.grid_size || 64} size={96}/>
                                <div className="flex-1 min-w-0">
                                    <div className="font-bold text-white truncate" title={item.name}>{item.name}</div>
                                    <div className="text-[10px] uppercase tracking-widest text-rpg-gold">{item.category}</div>
                                    <div className="text-[10px] text-gray-400">por {item.username}</div>
                                    <div className="text-[10px] text-gray-500">{new Date(item.created_at).toLocaleDateString()}</div>
                                    <div className="mt-2 flex gap-1">
                                        <button
                                            disabled={!!working[item.id]}
                                            onClick={() => moderate(item.id, 'approved')}
                                            className="flex items-center gap-1 text-[10px] uppercase tracking-widest font-bold bg-green-500/20 hover:bg-green-500/30 border border-green-500/40 text-green-400 px-2 py-1 rounded disabled:opacity-50"
                                        ><Check size={10}/> Aprobar</button>
                                        <button
                                            disabled={!!working[item.id]}
                                            onClick={() => moderate(item.id, 'rejected')}
                                            className="flex items-center gap-1 text-[10px] uppercase tracking-widest font-bold bg-red-500/20 hover:bg-red-500/30 border border-red-500/40 text-red-400 px-2 py-1 rounded disabled:opacity-50"
                                        ><X size={10}/> Rechazar</button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default CreationsModeration;
