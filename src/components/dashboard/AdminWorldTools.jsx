import React, { useState, useEffect, useCallback } from 'react';
import { Home, Map, ExternalLink, Maximize2, Minimize2, Hammer, Library, Loader, Copy, Trash2, Check } from 'lucide-react';
import { useToast } from '../common/Toast';

/**
 * AdminWorldTools
 * Embeds the standalone HTML world-building tools (house builder + map editor)
 * inside the admin panel via iframes, and listens for postMessage events from
 * those iframes to save designs into the admin library (admin_designs table).
 *
 * Communication contract (iframe → parent):
 *   window.parent.postMessage({
 *     type: 'taskoria_design_save',
 *     tool: 'house' | 'map',
 *     name: 'My building',
 *     snippet: '// MapData.js code…',
 *     payload: { ...rawConfig },
 *   }, '*')
 *
 * The parent posts to api/admin.php?action=save_design and shows a toast.
 */

// Use RELATIVE paths (no leading slash) because vite.config has `base: './'`,
// which means the app may be served under a sub-path like /rpg/ in production.
// Absolute paths like '/admin-tools/...' would 404 when the SPA lives at /rpg/.
const TOOLS = [
    { id: 'house',   label: 'House Builder', icon: Home,    src: 'admin-tools/house_builder.html', description: 'Diseña edificios pixel art. Exporta el snippet listo para prefab/prop.' },
    { id: 'map',     label: 'Map Editor',    icon: Map,     src: 'admin-tools/map_editor.html',    description: 'Construye mapas completos con tiles, decoraciones y portales.' },
    { id: 'library', label: 'Library',       icon: Library, src: null,                             description: 'Diseños guardados desde los editores. Copia el snippet o elimina.' },
];

const AdminWorldTools = ({ currentUser }) => {
    const toast = useToast();
    const [activeTool, setActiveTool] = useState('house');
    const [fullscreen, setFullscreen] = useState(false);
    const [designs, setDesigns] = useState([]);
    const [libLoading, setLibLoading] = useState(false);
    const [copiedId, setCopiedId] = useState(null);
    const [pendingEdit, setPendingEdit] = useState(null);
    const tool = TOOLS.find(t => t.id === activeTool) || TOOLS[0];

    // Listen for save + library requests from the embedded editors
    useEffect(() => {
        const onMessage = async (e) => {
            if (e.origin && e.origin !== window.location.origin) return;
            const data = e?.data;
            if (!data) return;

            // Editor → save a new design
            if (data.type === 'taskoria_design_save') {
                try {
                    const res = await fetch('api/admin.php?action=save_design', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            admin_id: currentUser.id,
                            tool: data.tool,
                            name: data.name,
                            snippet: data.snippet,
                            payload: data.payload,
                        }),
                    });
                    const json = await res.json();
                    if (json.success) {
                        toast.success(`Design "${json.name}" saved to library`, { duration: 3500 });
                        if (activeTool === 'library') loadDesigns();
                    } else {
                        toast.error(json.error || 'Failed to save design');
                    }
                } catch (err) {
                    toast.error('Network error saving design');
                }
                return;
            }

            // Editor → request the saved-design library (used by Map Editor to
            // expose House Builder creations as palette items).
            if (data.type === 'taskoria_request_designs') {
                try {
                    const res = await fetch('api/admin.php?action=list_designs', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            admin_id: currentUser.id,
                            tool: data.tool || 'house',
                        }),
                    });
                    const json = await res.json();
                    let designs = json.designs || [];

                    // Fetch approved monsters to include in the Map Editor palette
                    try {
                        const mRes = await fetch(`api/creations.php?action=list_approved&category=monstruos`);
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
                } catch (err) { /* iframe will just show no library items */ }
                return;
            }
        };
        window.addEventListener('message', onMessage);
        return () => window.removeEventListener('message', onMessage);
    }, [currentUser?.id, activeTool]); // eslint-disable-line react-hooks/exhaustive-deps

    const loadDesigns = useCallback(async () => {
        setLibLoading(true);
        try {
            const res = await fetch('api/admin.php?action=list_designs', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ admin_id: currentUser.id }),
            });
            const json = await res.json();
            if (json.success) setDesigns(json.designs || []);
        } catch (e) {
            // ignore
        } finally {
            setLibLoading(false);
        }
    }, [currentUser?.id]);

    // Load library when tab is opened
    useEffect(() => {
        if (activeTool === 'library') loadDesigns();
    }, [activeTool, loadDesigns]);

    const copySnippet = async (d) => {
        try {
            await navigator.clipboard.writeText(d.snippet);
            setCopiedId(d.id);
            setTimeout(() => setCopiedId(null), 1500);
        } catch (e) { /* ignore */ }
    };

    const deleteDesign = async (d) => {
        if (!confirm(`Delete "${d.name}"?`)) return;
        try {
            await fetch('api/admin.php?action=delete_design', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ admin_id: currentUser.id, id: d.id }),
            });
            setDesigns(prev => prev.filter(x => x.id !== d.id));
        } catch (e) { /* ignore */ }
    };

    const editDesign = (d) => {
        setPendingEdit(d);
        setActiveTool(d.tool);
    };

    const handleIframeLoad = (e) => {
        if (pendingEdit && pendingEdit.tool === activeTool) {
            try {
                e.target.contentWindow.postMessage({
                    type: 'taskoria_design_edit',
                    tool: pendingEdit.tool,
                    name: pendingEdit.name,
                    payload: pendingEdit.payload
                }, '*');
                toast.success(`Loaded "${pendingEdit.name}" for editing`);
            } catch (err) {
                toast.error('Failed to load design for editing');
            }
            setPendingEdit(null);
        }
    };

    return (
        <div className={`glass-card border border-white/10 rounded-2xl overflow-hidden flex flex-col ${fullscreen ? 'fixed inset-4 z-50 shadow-2xl' : ''}`}>
            {/* Header */}
            <div className="p-4 border-b border-white/10 bg-black/40 flex items-center justify-between flex-wrap gap-3">
                <div>
                    <h3 className="text-xl font-bold text-rpg-gold flex items-center gap-2">
                        <Hammer size={18}/> World Building Tools
                    </h3>
                    <p className="text-xs text-gray-400">{tool.description}</p>
                </div>
                <div className="flex items-center gap-2">
                    {tool.src && (
                        <a
                            href={tool.src}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1.5 text-[10px] uppercase tracking-widest font-bold bg-white/5 hover:bg-white/10 border border-white/20 text-gray-300 px-2.5 py-1.5 rounded"
                        >
                            <ExternalLink size={11}/> New tab
                        </a>
                    )}
                    <button
                        onClick={() => setFullscreen(f => !f)}
                        className="flex items-center gap-1.5 text-[10px] uppercase tracking-widest font-bold bg-rpg-gold/15 hover:bg-rpg-gold/25 border border-rpg-gold/40 text-rpg-gold px-2.5 py-1.5 rounded"
                    >
                        {fullscreen ? <Minimize2 size={11}/> : <Maximize2 size={11}/>}
                        {fullscreen ? 'Exit FS' : 'Fullscreen'}
                    </button>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-0 border-b border-white/10 bg-black/30">
                {TOOLS.map(t => {
                    const Icon = t.icon;
                    const isActive = t.id === activeTool;
                    const count = t.id === 'library' && designs.length > 0 ? ` · ${designs.length}` : '';
                    return (
                        <button
                            key={t.id}
                            onClick={() => setActiveTool(t.id)}
                            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-heading font-bold uppercase tracking-wider transition-colors border-b-2 ${
                                isActive
                                    ? 'text-rpg-gold border-rpg-gold bg-rpg-gold/5'
                                    : 'text-gray-400 border-transparent hover:text-white hover:bg-white/5'
                            }`}
                        >
                            <Icon size={14}/> {t.label}{count}
                        </button>
                    );
                })}
            </div>

            {/* Stage — iframe for editor tools, table for library */}
            {tool.src ? (
                <div className={`bg-[#1a1208] flex-1 ${fullscreen ? '' : 'h-[720px]'}`}>
                    <iframe
                        key={tool.id}
                        src={tool.src}
                        title={tool.label}
                        className="w-full h-full border-0 block"
                        sandbox="allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox allow-downloads allow-modals"
                        allow="clipboard-read; clipboard-write"
                        onLoad={handleIframeLoad}
                    />
                </div>
            ) : (
                <div className={`bg-black/20 ${fullscreen ? 'flex-1 overflow-auto' : 'max-h-[720px] overflow-auto'}`}>
                    {libLoading ? (
                        <div className="flex items-center justify-center py-16 text-rpg-gold"><Loader className="animate-spin" size={24}/></div>
                    ) : designs.length === 0 ? (
                        <div className="text-center text-gray-500 italic py-16 px-4">
                            No designs saved yet. Open House Builder or Map Editor and click<br/>
                            <strong className="text-rpg-gold">SAVE TO LIBRARY</strong> to start collecting designs here.
                        </div>
                    ) : (
                        <div className="p-4 space-y-2">
                            {designs.map(d => (
                                <div key={d.id} className="bg-black/40 border border-white/10 rounded-xl p-3 flex items-start gap-3 flex-wrap">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <span className="font-bold text-white truncate" title={d.name}>{d.name}</span>
                                            <span className={`text-[9px] uppercase tracking-widest font-bold px-2 py-0.5 rounded border ${d.tool === 'house' ? 'bg-amber-500/10 border-amber-500/30 text-amber-400' : 'bg-purple-500/10 border-purple-500/30 text-purple-400'}`}>
                                                {d.tool}
                                            </span>
                                            <span className="text-[10px] text-gray-500">{new Date(d.created_at).toLocaleString()}</span>
                                        </div>
                                        <details className="mt-2 group">
                                            <summary className="cursor-pointer text-[10px] uppercase tracking-widest text-gray-400 hover:text-rpg-gold">Show snippet</summary>
                                            <pre className="mt-2 text-[10px] font-mono bg-black/60 border border-white/5 rounded p-3 overflow-x-auto text-gray-300 max-h-64">{d.snippet}</pre>
                                        </details>
                                    </div>
                                    <div className="flex gap-1.5">
                                        <button
                                            onClick={() => copySnippet(d)}
                                            className="flex items-center gap-1 text-[10px] uppercase tracking-widest font-bold bg-rpg-gold/15 hover:bg-rpg-gold/25 border border-rpg-gold/40 text-rpg-gold px-2.5 py-1.5 rounded"
                                        >
                                            {copiedId === d.id ? <Check size={11}/> : <Copy size={11}/>}
                                            {copiedId === d.id ? 'Copied' : 'Copy'}
                                        </button>
                                        <button
                                            onClick={() => editDesign(d)}
                                            className="flex items-center gap-1 text-[10px] uppercase tracking-widest font-bold bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/30 text-blue-400 px-2.5 py-1.5 rounded"
                                        >
                                            Edit
                                        </button>
                                        <button
                                            onClick={() => deleteDesign(d)}
                                            className="flex items-center gap-1 text-[10px] uppercase tracking-widest font-bold bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 px-2.5 py-1.5 rounded"
                                        >
                                            <Trash2 size={11}/>
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Footer help */}
            <div className="px-4 py-2.5 border-t border-white/10 bg-black/30 text-[10px] text-gray-500 flex justify-between flex-wrap gap-2">
                <span>
                    Inside each editor, click <strong className="text-rpg-gold">SAVE TO LIBRARY</strong> to send the design to your admin library (no manual copy-paste).
                </span>
                <span className="font-mono">Admin: {currentUser?.username}</span>
            </div>
        </div>
    );
};

export default AdminWorldTools;
