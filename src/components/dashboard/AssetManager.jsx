import React, { useState, useEffect } from 'react';
import { Library, Edit3, Trash2, Check, X, Loader, Search, RefreshCw, Download, FileJson } from 'lucide-react';
import { useToast } from '../common/Toast';
import AssetEditorModal from './AssetEditorModal';
import { pixelsToDataUrl } from '../../utils/pixelFormat';

const LEGACY_CAT_MAP = {
    casas: 'HOUSES', castillos: 'CASTLES', monturas: 'MOUNTS',
    arboles: 'TREES', decoracion: 'DECORATION', monstruos: 'MONSTERS',
    MASCOTAS: 'PETS', PERSONAJES: 'CHARACTERS', EDIFICIOS: 'HOUSES',
    MAPAS: 'MAPS', VARIOS: 'PROPS', props: 'PROPS',
    houses: 'HOUSES', castles: 'CASTLES', mounts: 'MOUNTS',
    trees: 'TREES', decoration: 'DECORATION', monsters: 'MONSTERS',
    pets: 'PETS', characters: 'CHARACTERS', maps: 'MAPS',
};
const normalizeCategory = (cat) => {
    if (!cat) return 'PROPS';
    const upper = cat.toUpperCase();
    return LEGACY_CAT_MAP[cat] || LEGACY_CAT_MAP[upper] || upper;
};

const AssetManager = ({ currentUser }) => {
    const toast = useToast();
    const [assets, setAssets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [activeTab, setActiveTab] = useState('ALL');
    const [editingAsset, setEditingAsset] = useState(null);
    const [editForm, setEditForm] = useState({ name: '', category: '' });

    const fetchAssets = async () => {
        setLoading(true);
        try {
            // Fetch pixel art creations (world_creations)
            const resC = await fetch('api/creations.php?action=list_approved');
            const dataC = await resC.json();
            const creations = (dataC.items || []).map(item => ({
                ...item,
                source: 'world_creations',
                assetId: `lib_pixel_${item.id}`,
                displayCategory: normalizeCategory(item.category)
            }));

            // Fetch house/map designs (admin_designs)
            const resD = await fetch('api/admin.php?action=list_designs', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ admin_id: currentUser.id })
            });
            const dataD = await resD.json();
            const designs = (dataD.designs || []).map(item => {
                let category = 'HOUSES';
                if (item.tool === 'map') category = 'MAPS';
                else if (item.tool === 'character') category = 'CHARACTERS';
                else if (item.tool === 'pet') category = 'PETS';

                return {
                    ...item,
                    source: 'admin_designs',
                    assetId: `lib_${item.id}`,
                    category: category.toLowerCase(),
                    displayCategory: category
                };
            });

            setAssets([...creations, ...designs].sort((a, b) => new Date(b.created_at) - new Date(a.created_at)));
        } catch (e) {
            toast.error("Failed to fetch assets");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAssets();
    }, []);

    const handleDelete = async (asset) => {
        if (!confirm(`Are you sure you want to delete '${asset.name}'? This may break maps that rely on it.`)) return;
        
        try {
            let url, body;
            if (asset.source === 'world_creations') {
                url = 'api/creations.php?action=delete';
                body = { user_id: currentUser.id, target_id: asset.id }; // Assume admin has rights to delete
            } else {
                url = 'api/admin.php?action=delete_design';
                body = { admin_id: currentUser.id, id: asset.id };
            }

            const res = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });
            const data = await res.json();
            if (data.success) {
                toast.success("Asset deleted");
                fetchAssets();
            } else {
                toast.error(data.error || "Failed to delete");
            }
        } catch (e) {
            toast.error("Network error");
        }
    };

    const handleEditSave = async () => {
        // This is now handled inside AssetEditorModal
        setEditingAsset(null);
    };

    // Built-in decorative props grouped into library categories.
    const OBJECT_CATEGORIES = {
        trees: ['oak_tree','pine_tree','ancient_tree','bush','flowers','mushroom','grass_tuft','hay','planter'],
        houses: ['shop_building','well','market_stall_red','market_stall_green','market_stall_purple','fence','sign'],
        props: ['bench','barrel','crate','table','stool','bed','bookshelf','dining_table','dining_chair','bar_counter','weapon_rack','armor_stand','red_carpet'],
        decoration: ['lamp','wall_torch','fire','ledgar_statue','council_board','banner_gold','banner_red','banner_purple','banner_blue','mug','cat_sleeping','barrel_tipped','skull','floor_patch'],
    };

    // Embed a registry prop (any size) into a 64×64 editable canvas — bottom-
    // centered, scaled down only if it exceeds 64 — and return sparse pixels.
    const embedTo64 = (spr) => {
        const GRID = 64, { w, h, buffer } = spr;
        const scale = Math.min(1, GRID / Math.max(w, h));
        const dw = Math.max(1, Math.round(w * scale)), dh = Math.max(1, Math.round(h * scale));
        const ox = Math.floor((GRID - dw) / 2), oy = GRID - dh;
        const src = document.createElement('canvas'); src.width = w; src.height = h;
        const sctx = src.getContext('2d');
        for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
            const c = buffer[y * w + x];
            if (c && c !== 'transparent') { sctx.fillStyle = c; sctx.fillRect(x, y, 1, 1); }
        }
        const dst = document.createElement('canvas'); dst.width = GRID; dst.height = GRID;
        const dctx = dst.getContext('2d'); dctx.imageSmoothingEnabled = false;
        dctx.drawImage(src, 0, 0, w, h, ox, oy, dw, dh);
        const d = dctx.getImageData(0, 0, GRID, GRID).data, px = [];
        for (let i = 0; i < d.length; i += 4) {
            if (d[i + 3] > 10) { const idx = i / 4; px.push({ x: idx % GRID, y: Math.floor(idx / GRID), c: `rgb(${d[i]},${d[i + 1]},${d[i + 2]})` }); }
        }
        return px;
    };

    const extractObjects = async () => {
        if (!confirm('¿Extraer los objetos decorativos a la biblioteca como pixel art editable? Los ya extraídos se actualizan (no se duplican).')) return;
        setLoading(true);
        try {
            const { SPRITE_REGISTRY } = await import('../../data/sprite-registry.js');
            const catOf = (k) => {
                for (const [cat, keys] of Object.entries(OBJECT_CATEGORIES)) if (keys.includes(k)) return cat;
                return 'decoration';
            };
            let n = 0;
            for (const key of Object.keys(SPRITE_REGISTRY)) {
                const px = embedTo64(SPRITE_REGISTRY[key]);
                if (!px.length) continue;
                try {
                    const res = await fetch('api/creations.php?action=seed_object', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ user_id: currentUser.id, name: key, category: catOf(key), grid_size: 64, pixels: px })
                    });
                    const j = await res.json();
                    if (j.success) n++;
                } catch (e) { /* skip this one */ }
            }
            toast.success(`${n} objetos extraídos a la biblioteca — ya editables`);
            fetchAssets();
        } catch (e) {
            console.error(e);
            toast.error('Extracción fallida');
        } finally {
            setLoading(false);
        }
    };

    const categories = ['ALL', ...new Set(assets.map(a => a.displayCategory))].sort();

    const filteredAssets = assets.filter(a => {
        const matchesTab = activeTab === 'ALL' || a.displayCategory === activeTab;
        const matchesSearch = a.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                              (a.username && a.username.toLowerCase().includes(searchQuery.toLowerCase()));
        return matchesTab && matchesSearch;
    });

    const renderAssetPreview = (asset) => {
        if (asset.source === 'world_creations') {
            try {
                return <img src={pixelsToDataUrl(asset.pixels, asset.grid_size || 64)} alt={asset.name} className="w-16 h-16 object-contain render-pixelated" />;
            } catch (e) {
                return <div className="w-16 h-16 bg-red-500/20 text-red-400 flex items-center justify-center text-xs text-center border border-red-500/30">Error</div>;
            }
        } else if (asset.tool === 'character' || asset.tool === 'pet') {
            try {
                const payload = typeof asset.payload === 'string' ? JSON.parse(asset.payload) : asset.payload;
                // The Pixel Studio saves edits into `pixels`; prefer them so the
                // card shows the modified version, not the original blueprint.
                if (payload.pixels) {
                    const gs = payload.gridSize || (asset.tool === 'pet' ? 32 : 64);
                    return <img src={pixelsToDataUrl(payload.pixels, gs)} alt={asset.name} className="w-16 h-16 object-contain render-pixelated" />;
                }
                const bp = payload.blueprint;
                const paleta = payload.paleta;
                const size = bp.length; // usually 64
                const canvas = document.createElement('canvas');
                canvas.width = size; canvas.height = size;
                const ctx = canvas.getContext('2d');
                for (let y = 0; y < size; y++) {
                    for (let x = 0; x < size; x++) {
                        const char = bp[y][x];
                        if (char && char !== ' ') {
                            ctx.fillStyle = paleta[char] || '#000';
                            ctx.fillRect(x, y, 1, 1);
                        }
                    }
                }
                return <img src={canvas.toDataURL()} alt={asset.name} className="w-16 h-16 object-contain render-pixelated" />;
            } catch (e) {
                return <div className="w-16 h-16 bg-red-500/20 text-red-400 flex items-center justify-center text-xs text-center border border-red-500/30">Error</div>;
            }
        } else {
            return (
                <div className="w-16 h-16 bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold text-xl border border-blue-500/30 rounded-lg">
                    {asset.tool === 'map' ? 'M' : 'H'}
                </div>
            );
        }
    };

    const isAdmin = currentUser?.is_admin;

    const exportAssetPNG = (asset) => {
        let dataUrl = '';
        if (asset.source === 'world_creations') {
            dataUrl = pixelsToDataUrl(asset.pixels, asset.grid_size || 64);
        } else if (asset.tool === 'character' || asset.tool === 'pet') {
            const p = typeof asset.payload === 'string' ? JSON.parse(asset.payload) : (asset.payload || {});
            if (p.pixels) {
                dataUrl = pixelsToDataUrl(p.pixels, p.gridSize || (asset.tool === 'pet' ? 32 : 64));
            } else if (p.blueprint && p.paleta) {
                const size = p.blueprint.length;
                const c = document.createElement('canvas'); c.width = size; c.height = size;
                const ctx = c.getContext('2d');
                for (let y = 0; y < size; y++) for (let x = 0; x < p.blueprint[y].length; x++) {
                    const ch = p.blueprint[y][x];
                    if (ch && ch !== ' ') { ctx.fillStyle = p.paleta[ch] || '#000'; ctx.fillRect(x, y, 1, 1); }
                }
                dataUrl = c.toDataURL();
            }
        } else if (asset.tool === 'house') {
            const p = typeof asset.payload === 'string' ? JSON.parse(asset.payload) : (asset.payload || {});
            if (p.previewImage) dataUrl = p.previewImage;
        }
        if (!dataUrl) { toast.error('No image data to export'); return; }
        const a = document.createElement('a');
        a.href = dataUrl;
        a.download = `${asset.name.replace(/\s+/g, '_').toLowerCase()}.png`;
        a.click();
    };

    const exportAssetJSON = (asset) => {
        const obj = {
            name: asset.name,
            category: asset.category || asset.displayCategory,
            source: asset.source,
            tool: asset.tool || 'pixel',
        };
        if (asset.source === 'world_creations') {
            obj.grid_size = asset.grid_size || 64;
            obj.pixels = typeof asset.pixels === 'string' ? JSON.parse(asset.pixels) : asset.pixels;
            obj.price = asset.price;
        } else {
            obj.payload = typeof asset.payload === 'string' ? JSON.parse(asset.payload) : asset.payload;
        }
        const blob = new Blob([JSON.stringify(obj, null, 2)], { type: 'application/json' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = `${asset.name.replace(/\s+/g, '_').toLowerCase()}.json`;
        a.click();
        URL.revokeObjectURL(a.href);
    };

    const exportAllFiltered = async (format) => {
        for (const asset of filteredAssets) {
            if (format === 'png') exportAssetPNG(asset);
            else exportAssetJSON(asset);
            await new Promise(r => setTimeout(r, 100));
        }
        toast.success(`Exported ${filteredAssets.length} assets as ${format.toUpperCase()}`);
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-300">
            <div className="flex flex-col sm:flex-row gap-4 justify-between items-center">
                <div className="relative w-full sm:w-96">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                    <input
                        type="text"
                        placeholder="Search assets by name or author..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-black/40 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white placeholder-gray-500 hover:border-rpg-gold/30 focus:border-rpg-gold focus:outline-none focus:ring-1 focus:ring-rpg-gold transition-all"
                    />
                </div>
                <button
                    onClick={async () => {
                        try {
                            // Migrate Maps
                            const { MAP_DATA } = await import('./world/MapData.js');
                            for (const [key, mapObj] of Object.entries(MAP_DATA)) {
                                const payload = JSON.stringify(mapObj);
                                await fetch('api/admin.php?action=save_design', {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({
                                        admin_id: currentUser.id,
                                        tool: 'map',
                                        name: mapObj.name || key,
                                        snippet: 'SYSTEM_MAP',
                                        payload: JSON.parse(payload)
                                    })
                                });
                            }
                            
                            // Migrate Characters
                            const charactersRes = await import('../../data/character_blueprints.json');
                            const characters = charactersRes.default || charactersRes;
                            for (const [key, obj] of Object.entries(characters)) {
                                await fetch('api/admin.php?action=save_design', {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({
                                        admin_id: currentUser.id,
                                        tool: 'character',
                                        name: key.toUpperCase(),
                                        snippet: 'SYSTEM_CHARACTER',
                                        payload: obj
                                    })
                                });
                            }
                            
                            // Migrate Pets
                            const petsRes = await import('../../data/pet_blueprints.json');
                            const pets = petsRes.default || petsRes;
                            for (const [key, obj] of Object.entries(pets)) {
                                await fetch('api/admin.php?action=save_design', {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({
                                        admin_id: currentUser.id,
                                        tool: 'pet',
                                        name: key.toUpperCase(),
                                        snippet: 'SYSTEM_PET',
                                        payload: obj
                                    })
                                });
                            }

                            toast.success(`System data migrated successfully!`);
                            fetchAssets();
                        } catch(e) {
                            console.error(e);
                            toast.error("Migration failed");
                        }
                    }}
                    className="flex-1 sm:flex-none bg-blue-500/20 text-blue-400 hover:text-white px-4 py-3 rounded-xl font-bold uppercase tracking-widest text-sm flex items-center justify-center gap-2 transition-all border border-blue-500/30"
                >
                    Migrate System Data
                </button>
                <button
                    onClick={extractObjects}
                    title="Copia los objetos decorativos del juego a la biblioteca como pixel art editable"
                    className="flex-1 sm:flex-none bg-emerald-500/20 text-emerald-400 hover:text-white px-4 py-3 rounded-xl font-bold uppercase tracking-widest text-sm flex items-center justify-center gap-2 transition-all border border-emerald-500/30"
                >
                    <Library size={18} /> Extraer Objetos
                </button>
                <button
                    onClick={async () => {
                        if (!confirm('Remove empty designs and collapse duplicate names (keeping the version with the most content)?')) return;
                        try {
                            const res = await fetch('api/admin.php?action=cleanup_designs', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ admin_id: currentUser.id })
                            });
                            const data = await res.json();
                            if (data.success) {
                                toast.success(`Library cleaned: ${data.deleted} removed, ${data.kept} kept`);
                                fetchAssets();
                            } else {
                                toast.error(data.error || 'Cleanup failed');
                            }
                        } catch (e) {
                            toast.error('Network error');
                        }
                    }}
                    className="flex-1 sm:flex-none bg-red-500/10 text-red-400 hover:text-white px-4 py-3 rounded-xl font-bold uppercase tracking-widest text-sm flex items-center justify-center gap-2 transition-all border border-red-500/30"
                >
                    <Trash2 size={18} />
                    Clean Library
                </button>
                <button
                    onClick={fetchAssets}
                    className="flex-1 sm:flex-none bg-black/40 text-gray-400 hover:text-white px-4 py-3 rounded-xl font-bold uppercase tracking-widest text-sm flex items-center justify-center gap-2 transition-all border border-white/10 hover:border-white/30"
                >
                    <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
                    Refresh
                </button>
                {isAdmin && (
                    <>
                        <button
                            onClick={() => exportAllFiltered('png')}
                            className="flex-1 sm:flex-none bg-cyan-500/10 text-cyan-400 hover:text-white px-4 py-3 rounded-xl font-bold uppercase tracking-widest text-sm flex items-center justify-center gap-2 transition-all border border-cyan-500/30"
                            title="Export all visible assets as PNG"
                        >
                            <Download size={18} /> Export PNG
                        </button>
                        <button
                            onClick={() => exportAllFiltered('json')}
                            className="flex-1 sm:flex-none bg-violet-500/10 text-violet-400 hover:text-white px-4 py-3 rounded-xl font-bold uppercase tracking-widest text-sm flex items-center justify-center gap-2 transition-all border border-violet-500/30"
                            title="Export all visible assets as JSON"
                        >
                            <FileJson size={18} /> Export JSON
                        </button>
                    </>
                )}
            </div>

            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin">
                {categories.map(cat => (
                    <button
                        key={cat}
                        onClick={() => setActiveTab(cat)}
                        className={`px-4 py-2 rounded-xl text-xs font-bold tracking-widest uppercase whitespace-nowrap transition-all ${
                            activeTab === cat 
                            ? 'bg-rpg-gold text-rpg-bg shadow-[0_0_10px_rgba(251,191,36,0.3)]' 
                            : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10 border border-white/5'
                        }`}
                    >
                        {cat}
                    </button>
                ))}
            </div>

            {loading ? (
                <div className="flex flex-col items-center justify-center py-20 text-rpg-gold gap-4">
                    <Loader className="animate-spin" size={32} />
                    <span className="font-heading uppercase tracking-widest text-sm animate-pulse">Loading Library...</span>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {filteredAssets.map(asset => (
                        <div key={asset.assetId} className="glass-card p-4 rounded-xl border border-white/10 flex flex-col gap-3 group hover:border-rpg-gold/40 transition-colors">
                            <div className="flex justify-between items-start">
                                <div className="bg-black/50 p-2 rounded-lg border border-white/5">
                                    {renderAssetPreview(asset)}
                                </div>
                                <div className="flex flex-col items-end gap-2">
                                    <span className="text-[10px] font-mono bg-white/5 text-gray-400 px-2 py-1 rounded">
                                        {asset.assetId}
                                    </span>
                                    <span className="text-[10px] font-bold uppercase tracking-widest text-rpg-gold bg-rpg-gold/10 border border-rpg-gold/20 px-2 py-0.5 rounded-full">
                                        {asset.displayCategory}
                                    </span>
                                </div>
                            </div>

                            {/* Standard Asset Card Display */}
                            <div className="flex flex-col flex-1">
                                <h4 className="font-bold text-white truncate" title={asset.name}>{asset.name}</h4>
                                <p className="text-xs text-gray-400 mt-1">By: <span className="text-gray-300">{asset.username || 'System Admin'}</span></p>
                                <p className="text-[10px] text-gray-500 mt-1">{new Date(asset.created_at).toLocaleDateString()}</p>
                                
                                <div className="flex gap-2 mt-auto pt-3 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button
                                        onClick={() => {
                                            setEditingAsset(asset);
                                        }}
                                        className="flex-1 bg-white/5 text-white hover:bg-white/10 rounded py-1.5 flex items-center justify-center gap-1 text-xs font-bold uppercase tracking-wider transition-colors"
                                    >
                                        <Edit3 size={14} /> Edit
                                    </button>
                                    {isAdmin && (
                                        <>
                                            <button
                                                onClick={() => exportAssetPNG(asset)}
                                                className="p-1.5 bg-cyan-500/10 text-cyan-400 hover:bg-cyan-500/20 rounded transition-colors"
                                                title="Export PNG"
                                            >
                                                <Download size={14} />
                                            </button>
                                            <button
                                                onClick={() => exportAssetJSON(asset)}
                                                className="p-1.5 bg-violet-500/10 text-violet-400 hover:bg-violet-500/20 rounded transition-colors"
                                                title="Export JSON"
                                            >
                                                <FileJson size={14} />
                                            </button>
                                        </>
                                    )}
                                    <button
                                        onClick={() => handleDelete(asset)}
                                        className="p-1.5 bg-red-500/10 text-red-400 hover:bg-red-500/20 rounded transition-colors"
                                        title="Delete Asset"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                    {filteredAssets.length === 0 && (
                        <div className="col-span-full py-20 text-center text-gray-500 italic">
                            No assets found for the given filters.
                        </div>
                    )}
                </div>
            )}

            {editingAsset && (
                <AssetEditorModal
                    asset={editingAsset}
                    currentUser={currentUser}
                    onClose={() => setEditingAsset(null)}
                    onSaved={() => {
                        setEditingAsset(null);
                        fetchAssets();
                    }}
                />
            )}
        </div>
    );
};

export default AssetManager;
