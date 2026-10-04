import React, { useEffect, useState, useRef } from 'react';
import { CheckCircle2, Clock, XCircle, Trash2 } from 'lucide-react';
import { useConfirm } from '../../context/ConfirmContext';
import PixelIcon from '../common/PixelIcon';

const CATEGORIES = [
    { id: 'all', label: 'All' },
    { id: 'houses', label: 'Houses' },
    { id: 'castles', label: 'Castles' },
    { id: 'mounts', label: 'Mounts' },
    { id: 'trees', label: 'Trees' },
    { id: 'decoration', label: 'Decoration' },
    { id: 'props', label: 'Props' },
];

// Older creations were saved with Spanish ids; the Studio now saves English ones.
const LEGACY_CATEGORY = {
    casas: 'houses', edificios: 'houses', castillos: 'castles', monturas: 'mounts',
    arboles: 'trees', decoracion: 'decoration', monstruos: 'monsters', mascotas: 'pets', personajes: 'characters',
};
const normalizeCategory = (c) => {
    const key = String(c || '').toLowerCase();
    return LEGACY_CATEGORY[key] || key;
};

const CATEGORY_LABEL = Object.fromEntries(CATEGORIES.map(c => [c.id, c.label]));

const PreviewCanvas = ({ pixels, gridSize }) => {
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
            style={{ width: '100%', height: '100%', imageRendering: 'pixelated' }}
        />
    );
};

const StatusBadge = ({ status }) => {
    if (status === 'approved') return <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-green-400"><CheckCircle2 size={11}/> Approved</span>;
    if (status === 'rejected') return <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-red-400"><XCircle size={11}/> Rejected</span>;
    return <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-400"><Clock size={11}/> In review</span>;
};

const CreationGallery = ({ currentUser, setActiveView }) => {
    const confirm = useConfirm();
    const [tab, setTab] = useState('public'); // public | mine
    const [category, setCategory] = useState('all');
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(false);

    const load = async () => {
        setLoading(true);
        try {
            let url;
            if (tab === 'public') {
                url = 'api/creations.php?action=list_approved';
            } else {
                if (!currentUser?.id) { setItems([]); setLoading(false); return; }
                url = `api/creations.php?action=list_mine&user_id=${currentUser.id}`;
            }
            const res = await fetch(url);
            const data = await res.json();
            if (data.success) {
                let list = data.items || [];
                if (category !== 'all') list = list.filter(i => normalizeCategory(i.category) === category);
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
        if (!await confirm({ title: 'Destroy Creation?', message: 'This artwork will be permanently deleted.', variant: 'danger', confirmText: 'Destroy' })) return;
        await fetch('api/creations.php?action=delete_mine', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ user_id: currentUser.id, id }),
        });
        load();
    };

    const chip = (active) => `shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${active
        ? 'bg-rpg-gold/15 text-rpg-gold ring-1 ring-rpg-gold/40'
        : 'bg-white/[0.05] text-gray-300 hover:text-white hover:bg-white/10'}`;

    return (
        <div className="text-white max-w-5xl mx-auto">
            <header className="mb-6 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
                <div>
                    <p className="text-[10px] uppercase tracking-[0.3em] text-gray-400 font-bold mb-1.5">Community</p>
                    <h1 className="font-herald text-4xl leading-none text-rpg-gold">World</h1>
                    <p className="mt-2 text-sm text-gray-400 max-w-[46ch]">Houses, castles, mounts and props forged by heroes for the realm.</p>
                </div>
                {setActiveView && (
                    <button
                        onClick={() => setActiveView('studio')}
                        className="self-start sm:self-auto inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-rpg-gold text-rpg-bg text-sm font-bold whitespace-nowrap hover:brightness-105 transition-[filter]"
                    >
                        <PixelIcon name="hammer" size={14} color="#1c1622" />
                        Open Pixel Studio
                    </button>
                )}
            </header>

            {currentUser?.id && (
                <div role="tablist" aria-label="Creations" className="inline-flex p-1 mb-3 rounded-xl bg-white/[0.05] ring-1 ring-white/10">
                    {[{ id: 'public', label: 'Gallery' }, { id: 'mine', label: 'My creations' }].map(t => (
                        <button
                            key={t.id}
                            role="tab"
                            aria-selected={tab === t.id}
                            onClick={() => setTab(t.id)}
                            className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-colors ${tab === t.id ? 'bg-rpg-panelLight text-white' : 'text-gray-400 hover:text-white'}`}
                        >
                            {t.label}
                        </button>
                    ))}
                </div>
            )}

            <div className="-mx-4 px-4 mb-5 flex gap-2 overflow-x-auto scrollbar-hide">
                {CATEGORIES.map(c => (
                    <button key={c.id} onClick={() => setCategory(c.id)} aria-pressed={category === c.id} className={chip(category === c.id)}>
                        {c.label}
                    </button>
                ))}
            </div>

            {loading ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3" aria-busy="true" aria-label="Loading creations">
                    {Array.from({ length: 8 }).map((_, i) => (
                        <div key={i} className="rounded-2xl bg-black/20 ring-1 ring-white/[0.06] p-2.5">
                            <div className="aspect-square rounded-xl bg-white/[0.04]" />
                            <div className="mt-3 h-3 w-2/3 rounded bg-white/[0.06]" />
                            <div className="mt-2 h-2.5 w-1/3 rounded bg-white/[0.04]" />
                        </div>
                    ))}
                </div>
            ) : items.length === 0 ? (
                <div className="rounded-2xl bg-black/15 ring-1 ring-white/[0.06] py-14 px-6 flex flex-col items-center text-center">
                    <PixelIcon name="hammer" size={28} color="#6b7280" />
                    <p className="mt-4 text-sm font-semibold text-gray-200">
                        {tab === 'public' ? 'Nothing forged here yet' : 'Your workshop is empty'}
                    </p>
                    <p className="mt-1 text-sm text-gray-400 max-w-[36ch]">
                        {tab === 'public'
                            ? 'Be the first to add a creation to this category.'
                            : 'Design a house, a mount or a prop and send it to the realm.'}
                    </p>
                    {setActiveView && (
                        <button onClick={() => setActiveView('studio')} className="mt-5 px-4 py-2 rounded-xl bg-rpg-gold/15 text-rpg-gold ring-1 ring-rpg-gold/40 text-sm font-semibold hover:bg-rpg-gold/25 transition-colors">
                            Create something
                        </button>
                    )}
                </div>
            ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                    {items.map(item => (
                        <div key={item.id} className="rounded-2xl bg-black/20 ring-1 ring-white/[0.06] p-2.5 flex flex-col">
                            <div className="aspect-square w-full rounded-xl bg-[#0f0a1f] overflow-hidden">
                                <PreviewCanvas pixels={item.pixels} gridSize={item.grid_size || 64} />
                            </div>
                            <div className="mt-2.5 px-0.5 min-w-0">
                                <p className="text-sm font-semibold text-white truncate" title={item.name}>{item.name}</p>
                                <p className="text-xs text-gray-400 truncate">
                                    {CATEGORY_LABEL[normalizeCategory(item.category)] || normalizeCategory(item.category)}
                                    {item.username && tab === 'public' ? ` · by ${item.username}` : ''}
                                </p>
                                {tab === 'mine' && (
                                    <div className="mt-2 flex items-center justify-between gap-2">
                                        <StatusBadge status={item.status} />
                                        <button onClick={() => deleteMine(item.id)} aria-label={`Delete ${item.name}`} className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-500 hover:text-red-300 hover:bg-red-500/10 transition-colors">
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                )}
                                {tab === 'mine' && item.status === 'rejected' && item.reject_reason && (
                                    <p className="mt-1 text-xs text-red-300/80">{item.reject_reason}</p>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default CreationGallery;
