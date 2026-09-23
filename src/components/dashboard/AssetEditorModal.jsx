import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { X, Save, Edit3, Trash2 } from 'lucide-react';
import { useToast } from '../common/Toast';
import ModernPixelAvatar from '../common/ModernPixelAvatar';
import ModernPixelPet from '../common/ModernPixelPet';
import CreationStudio from './CreationStudio';
import MapEditor from './admin/MapEditor';
import { pixelsToDataUrl } from '../../utils/pixelFormat';

const AssetEditorModal = ({ asset, currentUser, onClose, onSaved }) => {
    const adminId = currentUser?.id || asset?.admin_id;
    const toast = useToast();
    const [name, setName] = useState(asset ? (asset.name || '') : '');
    const [category, setCategory] = useState(asset ? (asset.category || '') : '');
    const [saving, setSaving] = useState(false);

    // Parse payload synchronously
    const parsedPayload = useMemo(() => {
        if (!asset) return {};
        let p = asset.payload || {};
        if (typeof p === 'string') {
            try { p = JSON.parse(p); } catch (e) { p = {}; }
        }
        
        // Convert blueprint/paleta format to pixels array if needed
        if (p.blueprint && p.paleta && !p.pixels) {
            const pxArray = [];
            // Handle both single-frame (array of strings) and multi-frame (array of arrays of strings)
            if (Array.isArray(p.blueprint[0])) {
                // Multi-frame blueprint
                p.pixels = p.blueprint.map(frame => {
                    const framePixels = [];
                    frame.forEach((row, y) => {
                        for (let x = 0; x < row.length; x++) {
                            const c = p.paleta[row[x]];
                            if (c && c !== 'transparent') framePixels.push({ x, y, c });
                        }
                    });
                    return framePixels;
                });
            } else {
                // Single-frame blueprint
                p.blueprint.forEach((row, y) => {
                    for (let x = 0; x < row.length; x++) {
                        const c = p.paleta[row[x]];
                        if (c && c !== 'transparent') pxArray.push({ x, y, c });
                    }
                });
                p.pixels = pxArray;
            }
        }
        
        return p;
    }, [asset]);

    const [payload, setPayload] = useState(parsedPayload);
    const [stats, setStats] = useState(parsedPayload.stats || {
        hp: 100,
        damage: 10,
        speed: 5
    });

    useEffect(() => {
        if (!asset) return;
        setName(asset.name || '');
        setCategory(asset.category || '');
        setPayload(parsedPayload);
        setStats(parsedPayload.stats || { hp: 100, damage: 10, speed: 5 });
    }, [asset, parsedPayload]);

    // Auto-open editor in new tab only for house tool (map now renders inline
    // via the new React MapEditor — see the render branch below).
    useEffect(() => {
        if (!asset || asset.tool !== 'house') return;
        let p = asset.payload || {};
        if (typeof p === 'string') {
            try { p = JSON.parse(p); } catch (err) { p = {}; }
        }
        const editSession = {
            type: 'taskoria_design_edit',
            tool: asset.tool,
            name: asset.name || '',
            payload: p
        };
        localStorage.setItem('taskoria_edit_session', JSON.stringify(editSession));
        window.open('admin-tools/house_builder.html', 'taskoria_editor');
    }, [asset]);

    // MAP EDITOR SAVE LOGIC (handles messages from both iframe and new-tab editor)
    useEffect(() => {
        const handleMessage = async (e) => {
            if (e.data && e.data.type === 'taskoria_design_save' && (e.data.tool === 'map' || e.data.tool === 'house')) {
                if (saving) return;
                setSaving(true);
                try {
                    const res = await fetch('api/admin.php?action=save_design', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            admin_id: adminId,
                            id: asset.id,
                            tool: e.data.tool,
                            name: e.data.name || name,
                            snippet: e.data.snippet || `SYSTEM_${e.data.tool.toUpperCase()}`,
                            payload: e.data.payload
                        })
                    });
                    const data = await res.json();
                    if (data.success) {
                        toast.success('Map saved successfully!');
                        onSaved();
                    } else {
                        toast.error(data.error || 'Failed to save map');
                    }
                } catch (err) {
                    toast.error('Network error saving map');
                } finally {
                    setSaving(false);
                }
                return;
            }

            if (e.data && e.data.type === 'taskoria_request_designs') {
                try {
                    const res = await fetch('api/admin.php?action=list_designs', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            admin_id: adminId,
                            tool: e.data.tool || 'house',
                        }),
                    });
                    const json = await res.json();
                    let designs = json.designs || [];

                    try {
                        const mRes = await fetch(`api/creations.php?action=list_approved`);
                        const mJson = await mRes.json();
                        if (mJson.success && mJson.items) {
                            designs = [...designs, ...mJson.items];
                        }
                    } catch (err) { /* ignore */ }

                    if (json.success && e.source) {
                        e.source.postMessage({
                            type: 'taskoria_designs_loaded',
                            designs: designs,
                        }, '*');
                    }
                } catch (err) { /* ignore */ }
                return;
            }
        };
        window.addEventListener('message', handleMessage);
        return () => window.removeEventListener('message', handleMessage);
    }, [asset, name, saving, onSaved, toast, adminId]);

    const handleSaveStats = async () => {
        setSaving(true);
        
        if (asset.source === 'world_creations') {
            // Update name and category via API
            try {
                const res = await fetch('api/creations.php?action=update_meta', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        id: asset.id,
                        name: name,
                        category: category
                    })
                });
                const data = await res.json();
                if (data.success) {
                    toast.success('Creation updated successfully!');
                    onSaved();
                } else {
                    toast.error(data.error || 'Failed to update creation');
                }
            } catch (e) {
                toast.error('Network error');
            } finally {
                setSaving(false);
            }
            return;
        }

        const newPayload = { ...payload, stats };
        try {
            const res = await fetch('api/admin.php?action=save_design', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    admin_id: adminId,
                    id: asset.id,
                    tool: asset.tool,
                    name: name,
                    snippet: asset.snippet || `SYSTEM_${asset.tool.toUpperCase()}`,
                    payload: newPayload
                })
            });
            const data = await res.json();
            if (data.success) {
                toast.success('Stats saved successfully!');
                onSaved();
            } else {
                toast.error(data.error || 'Failed to save stats');
            }
        } catch (e) {
            toast.error('Network error');
        } finally {
            setSaving(false);
        }
    };

    if (!asset) return null;

    if (asset.tool === 'map') {
        // New React map editor — WYSIWYG, uses PlayableWorld's renderer.
        // onSaved refreshes AssetManager's grid so the edit shows up right
        // away; onClose goes back to the previous screen.
        return createPortal(
            <MapEditor
                currentUser={currentUser}
                initialDesign={{ name: asset.name, payload: parsedPayload, id: asset.id }}
                onClose={onClose}
                onSaved={onSaved}
            />,
            document.body
        );
    }

    if (asset.tool === 'house') {
        // House builder is still the legacy HTML editor — opens in a new tab.
        const openEditorTab = () => {
            let p = asset.payload || {};
            if (typeof p === 'string') {
                try { p = JSON.parse(p); } catch (err) { p = {}; }
            }
            const editSession = {
                type: 'taskoria_design_edit',
                tool: asset.tool,
                name: asset.name || '',
                payload: p
            };
            localStorage.setItem('taskoria_edit_session', JSON.stringify(editSession));
            window.open('admin-tools/house_builder.html', 'taskoria_editor');
        };

        return (
            <div className="fixed inset-x-0 top-0 z-50 bg-black/95 border-b border-white/10 px-4 py-3 flex items-center justify-between gap-4 shadow-lg">
                <div className="text-rpg-gold font-bold font-heading uppercase tracking-widest text-sm flex items-center gap-2">
                    <Edit3 size={16} /> Editing {asset.tool}: {name}
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={openEditorTab}
                        className="px-4 py-1.5 rounded-lg bg-rpg-gold/15 border border-rpg-gold/30 text-rpg-gold text-xs font-bold uppercase tracking-widest hover:bg-rpg-gold/25 transition-colors"
                    >
                        Open Editor
                    </button>
                    <button onClick={onClose} className="text-gray-400 hover:text-white bg-white/5 p-2 rounded-lg transition-colors">
                        <X size={20} />
                    </button>
                </div>
            </div>
        );
    }

    if (asset.source === 'world_creations' || asset.tool === 'character' || asset.tool === 'pet') {
        const isWorldCreation = asset.source === 'world_creations';
        const initialPixels = isWorldCreation ? asset.pixels : (payload.pixels || null);
        
        return (
            <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md overflow-y-auto">
                <div className="h-12 bg-black flex justify-between items-center px-4 border-b border-white/10 shrink-0 sticky top-0 z-10">
                    <div className="text-rpg-gold font-bold font-heading uppercase tracking-widest text-sm flex items-center gap-2">
                        <Edit3 size={16} /> Editing Pixel Art: {name}
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-white bg-white/5 p-2 rounded-lg transition-colors">
                        <X size={20} />
                    </button>
                </div>
                <div className="p-4 max-w-6xl mx-auto">
                    <CreationStudio 
                        currentUser={{ id: asset.user_id || 1 }} 
                        initialAsset={{
                            name: name,
                            category: category,
                            price: asset.price || 100,
                            pixels: initialPixels,
                            stats: payload.stats,
                        }}
                        onSave={async (updatedData) => {
                            setSaving(true);
                            try {
                                const endpoint = isWorldCreation ? 'api/creations.php?action=update' : 'api/admin.php?action=save_design';
                                const body = isWorldCreation ? {
                                    id: asset.id,
                                    user_id: adminId, // the endpoint requires admin rights
                                    ...updatedData
                                } : {
                                    admin_id: adminId,
                                    id: asset.id,
                                    tool: asset.tool,
                                    name: updatedData.name,
                                    snippet: asset.snippet || `SYSTEM_${asset.tool.toUpperCase()}`,
                                    payload: { ...payload, ...updatedData }
                                };

                                const res = await fetch(endpoint, {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify(body)
                                });
                                const data = await res.json();
                                if (data.success) {
                                    toast.success('Pixel art updated successfully!');
                                    onSaved();
                                } else {
                                    toast.error(data.error || 'Failed to update pixel art');
                                }
                            } catch (e) {
                                toast.error('Network error');
                            } finally {
                                setSaving(false);
                            }
                        }}
                    />
                </div>
            </div>
        );
    }

    // Modal for Characters and Pets
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
            <div className="bg-black/90 border border-white/10 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
                <div className="p-4 border-b border-white/10 flex justify-between items-center bg-white/5">
                    <h3 className="font-heading text-xl text-white font-bold uppercase tracking-widest flex items-center gap-2">
                        <Edit3 size={18} className="text-rpg-gold" /> Edit {asset.tool}: {name}
                    </h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
                        <X size={24} />
                    </button>
                </div>
                
                <div className="p-6 overflow-y-auto flex-1 custom-scrollbar">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* Visual Preview */}
                        <div className="flex flex-col items-center justify-center p-6 glass-card rounded-xl border border-white/5 bg-black/40">
                            <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4 w-full text-center">Preview</h4>
                            <div className="bg-black/80 rounded-xl p-8 border border-white/10 mb-4 shadow-inner">
                                {asset.source === 'world_creations' ? (
                                    <img
                                        src={(() => {
                                            try { return pixelsToDataUrl(asset.pixels, asset.grid_size || 64); }
                                            catch(e) { return ''; }
                                        })()}
                                        alt={name}
                                        className="w-32 h-32 object-contain render-pixelated"
                                    />
                                ) : asset.tool === 'character' ? (
                                    <ModernPixelAvatar type={name.toLowerCase()} scale={3} />
                                ) : (
                                    <ModernPixelPet type={name.toLowerCase()} scale={3} />
                                )}
                            </div>
                            <p className="text-xs text-gray-500 text-center">
                                To edit sprites, open Pixel Studio and save with the exact same name to overwrite.
                            </p>
                        </div>

                        {/* Stats Editor */}
                        <div className="flex flex-col gap-4">
                            <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2 border-b border-white/10 pb-2">Properties & Stats</h4>
                            
                            <div className="flex flex-col gap-1">
                                <label className="text-xs font-bold text-gray-400 uppercase">Display Name</label>
                                <input 
                                    type="text" 
                                    value={name} 
                                    onChange={e => setName(e.target.value)}
                                    className="bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-white focus:border-rpg-gold focus:ring-1 focus:ring-rpg-gold outline-none"
                                />
                            </div>

                            {asset.source === 'world_creations' ? (
                                <div className="flex flex-col gap-1">
                                    <label className="text-xs font-bold text-gray-400 uppercase">Category</label>
                                    <input 
                                        type="text" 
                                        value={category} 
                                        onChange={e => setCategory(e.target.value)}
                                        className="bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-white focus:border-rpg-gold focus:ring-1 focus:ring-rpg-gold outline-none"
                                        placeholder="e.g. TREES, WEAPONS"
                                    />
                                </div>
                            ) : (
                                <>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="flex flex-col gap-1">
                                            <label className="text-xs font-bold text-gray-400 uppercase">Base HP</label>
                                            <input 
                                                type="number" 
                                                value={stats.hp} 
                                                onChange={e => setStats({...stats, hp: parseInt(e.target.value) || 0})}
                                                className="bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-white focus:border-rpg-gold focus:ring-1 focus:ring-rpg-gold outline-none font-mono"
                                            />
                                        </div>
                                        <div className="flex flex-col gap-1">
                                            <label className="text-xs font-bold text-gray-400 uppercase">Base Damage</label>
                                            <input 
                                                type="number" 
                                                value={stats.damage} 
                                                onChange={e => setStats({...stats, damage: parseInt(e.target.value) || 0})}
                                                className="bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-white focus:border-rpg-gold focus:ring-1 focus:ring-rpg-gold outline-none font-mono"
                                            />
                                        </div>
                                    </div>

                                    <div className="flex flex-col gap-1">
                                        <label className="text-xs font-bold text-gray-400 uppercase">Movement Speed</label>
                                        <input 
                                            type="number" 
                                            value={stats.speed} 
                                            onChange={e => setStats({...stats, speed: parseFloat(e.target.value) || 0})}
                                            className="bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-white focus:border-rpg-gold focus:ring-1 focus:ring-rpg-gold outline-none font-mono"
                                        />
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </div>

                <div className="p-4 border-t border-white/10 bg-black/60 flex justify-end gap-3">
                    <button 
                        onClick={onClose}
                        className="px-6 py-2 rounded-xl text-gray-400 hover:text-white font-bold tracking-widest text-sm uppercase transition-colors"
                    >
                        Cancel
                    </button>
                    <button 
                        onClick={handleSaveStats}
                        disabled={saving}
                        className="px-6 py-2 rounded-xl bg-rpg-gold text-black font-bold tracking-widest text-sm uppercase flex items-center gap-2 hover:bg-yellow-400 transition-colors disabled:opacity-50"
                    >
                        {saving ? <span className="animate-pulse">Saving...</span> : <><Save size={16} /> Save Changes</>}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AssetEditorModal;
