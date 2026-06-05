import React, { useEffect, useState, useRef } from 'react';
import { Loader2, CheckCircle2, Clock, XCircle, Trash2 } from 'lucide-react';

const CATEGORIES = [
    { id: 'all', label: 'All' },
    { id: 'casas', label: 'Houses' },
    { id: 'castillos', label: 'Castles' },
    { id: 'monturas', label: 'Mounts' },
    { id: 'arboles', label: 'Trees' },
    { id: 'decoracion', label: 'Decoration' },
    { id: 'props', label: 'Props' },
];

const PreviewCanvas = ({ pixels, gridSize, size = 128 }) => {
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

const StatusBadge = ({ status }) => {
    if (status === 'approved') return <span className="inline-flex items-center gap-1 text-[10px] uppercase font-bold text-green-400"><CheckCircle2 size={10}/> Approved</span>;
    if (status === 'rejected') return <span className="inline-flex items-center gap-1 text-[10px] uppercase font-bold text-red-400"><XCircle size={10}/> Rejected</span>;
    return <span className="inline-flex items-center gap-1 text-[10px] uppercase font-bold text-amber-400"><Clock size={10}/> Pending</span>;
};

const CreationGallery = ({ currentUser }) => {
    const [tab, setTab] = useState('public'); // public | mine
    const [category, setCategory] = useState('all');
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(false);

    const load = async () => {
        setLoading(true);
        try {
            let url;
            if (tab === 'public') {
                url = `api/creations.php?action=list_approved${category !== 'all' ? `&category=${category}` : ''}`;
            } else {
                if (!currentUser?.id) { setItems([]); setLoading(false); return; }
                url = `api/creations.php?action=list_mine&user_id=${currentUser.id}`;
            }
            const res = await fetch(url);
            const data = await res.json();
            if (data.success) {
                let list = data.items || [];
                if (tab === 'mine' && category !== 'all') list = list.filter(i => i.category === category);
                setItems(list);
            } else {
                setItems([]);
            }
        } catch (e) {
            setItems([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { load(); }, [tab, category]); // eslint-disable-line react-hooks/exhaustive-deps

    const deleteMine = async (id) => {
        if (!confirm('Delete this creation?')) return;
        await fetch('api/creations.php?action=delete_mine', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ user_id: currentUser.id, id }),
        });
        load();
    };

    return (
        <div className="text-white">
            <header className="mb-6 text-center">
                <h1 className="text-3xl font-display font-bold tracking-wide text-rpg-gold">Taskoria Creations</h1>
                <p className="text-sm text-gray-400">What the community is building for the world.</p>
            </header>

            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                <div className="flex gap-2">
                    <button onClick={() => setTab('public')} className={`text-xs uppercase tracking-widest px-3 py-1.5 rounded border ${tab==='public' ? 'bg-rpg-gold/20 border-rpg-gold text-rpg-gold' : 'bg-white/5 hover:bg-white/10 border-white/10'}`}>Public Gallery</button>
                    {currentUser?.id && (
                        <button onClick={() => setTab('mine')} className={`text-xs uppercase tracking-widest px-3 py-1.5 rounded border ${tab==='mine' ? 'bg-rpg-gold/20 border-rpg-gold text-rpg-gold' : 'bg-white/5 hover:bg-white/10 border-white/10'}`}>My Creations</button>
                    )}
                </div>
                <div className="flex flex-wrap gap-1">
                    {CATEGORIES.map(c => (
                        <button
                            key={c.id}
                            onClick={() => setCategory(c.id)}
                            className={`text-[10px] uppercase tracking-widest px-2 py-1 rounded border ${category===c.id ? 'bg-rpg-gold/20 border-rpg-gold text-rpg-gold' : 'bg-white/5 hover:bg-white/10 border-white/10'}`}
                        >{c.label}</button>
                    ))}
                </div>
            </div>

            {loading ? (
                <div className="flex items-center justify-center py-20 text-gray-400"><Loader2 className="animate-spin mr-2" size={18}/> Loading...</div>
            ) : items.length === 0 ? (
                <div className="text-center py-20 text-gray-500 text-sm">
                    {tab === 'public' ? 'No approved creations in this category yet.' : 'You haven\'t published anything yet.'}
                </div>
            ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                    {items.map(item => (
                        <div key={item.id} className="glass-panel rounded-xl p-3 flex flex-col items-center text-center">
                            <PreviewCanvas pixels={item.pixels} gridSize={item.grid_size || 64} size={140}/>
                            <div className="mt-2 font-bold text-sm text-white truncate w-full" title={item.name}>{item.name}</div>
                            <div className="text-[10px] uppercase tracking-widest text-rpg-gold">{item.category}</div>
                            {item.username && tab === 'public' && (
                                <div className="text-[10px] text-gray-400 mt-1">by {item.username}</div>
                            )}
                            {tab === 'mine' && (
                                <div className="mt-2 flex flex-col items-center gap-1 w-full">
                                    <StatusBadge status={item.status}/>
                                    {item.status === 'rejected' && item.reject_reason && (
                                        <div className="text-[10px] text-red-300/80 italic">"{item.reject_reason}"</div>
                                    )}
                                    <button onClick={() => deleteMine(item.id)} className="mt-1 text-[10px] text-red-300 hover:text-red-200 inline-flex items-center gap-1">
                                        <Trash2 size={10}/> Delete
                                    </button>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default CreationGallery;
