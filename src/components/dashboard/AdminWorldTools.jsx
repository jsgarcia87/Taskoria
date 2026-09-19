import React, { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Home, Map, Users, ExternalLink, X, Hammer, Library, Loader, Copy, Trash2, Check, ArrowLeft, Edit3 } from 'lucide-react';
import { useToast } from '../common/Toast';
import { useConfirm } from '../../context/ConfirmContext';
import MapEditor from './admin/MapEditor';

const TOOLS = [
    {
        id: 'house',
        label: 'House Builder',
        icon: Home,
        src: 'admin-tools/house_builder.html',
        description: 'Diseña edificios pixel art. Exporta el snippet listo para prefab/prop.',
        color: 'amber',
        status: 'active',
    },
    {
        id: 'map',
        label: 'Map Editor',
        icon: Map,
        src: 'admin-tools/map_editor.html',
        description: 'Construye mapas completos con tiles, decoraciones y portales.',
        color: 'purple',
        status: 'active',
    },
    {
        id: 'character',
        label: 'Character Builder',
        icon: Users,
        src: 'admin-tools/character_builder.html',
        description: 'Forja de Clases — constructor de personajes, vestimentas y armas por capas.',
        color: 'rose',
        status: 'constructor',
    },
];

const COLOR_MAP = {
    amber:  { bg: 'bg-amber-500/10',  border: 'border-amber-500/30',  text: 'text-amber-400',  glow: 'hover:shadow-amber-500/10' },
    purple: { bg: 'bg-purple-500/10', border: 'border-purple-500/30', text: 'text-purple-400', glow: 'hover:shadow-purple-500/10' },
    rose:   { bg: 'bg-rose-500/10',   border: 'border-rose-500/30',   text: 'text-rose-400',   glow: 'hover:shadow-rose-500/10' },
};

const AdminWorldTools = ({ currentUser }) => {
    const toast = useToast();
    const confirm = useConfirm();
    const [openTool, setOpenTool] = useState(null);
    const [showLibrary, setShowLibrary] = useState(false);
    const [designs, setDesigns] = useState([]);
    const [libLoading, setLibLoading] = useState(false);
    const [copiedId, setCopiedId] = useState(null);
    const [pendingEdit, setPendingEdit] = useState(null);

    // Listen for save + library requests from the embedded editors
    useEffect(() => {
        const onMessage = async (e) => {
            if (e.origin && e.origin !== window.location.origin) return;
            const data = e?.data;
            if (!data) return;

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
                        if (showLibrary) loadDesigns();
                    } else {
                        toast.error(json.error || 'Failed to save design');
                    }
                } catch (err) {
                    toast.error('Network error saving design');
                }
                return;
            }

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
        window.addEventListener('message', onMessage);
        return () => window.removeEventListener('message', onMessage);
    }, [currentUser?.id, showLibrary]); // eslint-disable-line react-hooks/exhaustive-deps

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

    useEffect(() => {
        if (showLibrary) loadDesigns();
    }, [showLibrary, loadDesigns]);

    const copySnippet = async (d) => {
        try {
            await navigator.clipboard.writeText(d.snippet);
            setCopiedId(d.id);
            setTimeout(() => setCopiedId(null), 1500);
        } catch (e) { /* ignore */ }
    };

    const deleteDesign = async (d) => {
        if (!await confirm({ title: 'Delete Design?', message: `"${d.name}" will be permanently removed.`, variant: 'danger', confirmText: 'Delete' })) return;
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
        const toolId = d.tool
            || (d.category === 'maps' ? 'map'
                : d.category === 'characters' ? 'character'
                : 'house');

        // Map opens in the new React editor (fullscreen modal, WYSIWYG).
        // House still uses the legacy HTML editor in a modal iframe.
        if (toolId === 'map') {
            let pl = d.payload || d.params;
            if (typeof pl === 'string') {
                try { pl = JSON.parse(pl); } catch (_) { pl = {}; }
            }
            setPendingEdit({ id: d.id, name: d.name || '', payload: pl || {}, tool: 'map' });
            setOpenTool('map');
            setShowLibrary(false);
            return;
        }

        if (toolId === 'house') {
            let pl = d.payload || d.params;
            if (typeof pl === 'string') {
                try { pl = JSON.parse(pl); } catch (_) { pl = {}; }
            }
            const editSession = {
                type: 'taskoria_design_edit',
                tool: toolId,
                name: d.name || '',
                payload: pl || {}
            };
            localStorage.setItem('taskoria_edit_session', JSON.stringify(editSession));
            const tool = TOOLS.find(t => t.id === toolId);
            window.open(tool ? tool.src : 'admin-tools/house_builder.html', 'taskoria_editor');
            setShowLibrary(false);
            toast.success(`Opened "${d.name}" in editor tab`);
            return;
        }

        setPendingEdit({ ...d, tool: toolId });
        setOpenTool(toolId);
        setShowLibrary(false);
    };

    const handleIframeLoad = (e) => {
        console.log('[AdminWorldTools] handleIframeLoad fired, pendingEdit:', !!pendingEdit, 'openTool:', openTool);
        if (pendingEdit && pendingEdit.tool === openTool) {
            const sendPayload = () => {
                try {
                    let pl = pendingEdit.payload || pendingEdit.params;
                    console.log('[AdminWorldTools] payload type before parse:', typeof pl, 'length:', String(pl||'').length);
                    if (typeof pl === 'string') {
                        try { pl = JSON.parse(pl); } catch (_) { pl = {}; }
                    }
                    console.log('[AdminWorldTools] sending postMessage, payload keys:', Object.keys(pl||{}).join(','));
                    e.target.contentWindow.postMessage({
                        type: 'taskoria_design_edit',
                        tool: pendingEdit.tool,
                        name: pendingEdit.name,
                        payload: pl || {}
                    }, '*');
                } catch (err) {
                    console.error('[AdminWorldTools] postMessage error:', err);
                }
            };
            sendPayload();
            setTimeout(sendPayload, 300);
            toast.success(`Loaded "${pendingEdit.name}" for editing`);
            setPendingEdit(null);
        } else {
            console.log('[AdminWorldTools] skipped postMessage - pendingEdit null or tool mismatch');
        }
    };

    const activeTool = TOOLS.find(t => t.id === openTool);

    // Map Editor — new React component with WYSIWYG rendering that matches
    // production exactly (same PlayableWorld renderer under the hood).
    // When editing an existing library design, onSaved refreshes the list so
    // the library reflects the edit right away.
    if (openTool === 'map') {
        return createPortal(
            <MapEditor
                currentUser={currentUser}
                initialDesign={pendingEdit}
                onClose={() => { setOpenTool(null); setPendingEdit(null); }}
                onSaved={() => { if (showLibrary || pendingEdit?.id) loadDesigns(); }}
            />,
            document.body
        );
    }

    // Fullscreen tool overlay — rendered via portal to escape any stacking context
    if (openTool && activeTool) {
        const c = COLOR_MAP[activeTool.color] || COLOR_MAP.amber;
        return createPortal(
            <div className="fixed inset-0 z-[9999] flex flex-col bg-[#0c0a14]">
                {/* Toolbar */}
                <div className="flex items-center gap-3 px-4 py-2.5 bg-black/60 border-b border-white/10 backdrop-blur-sm flex-shrink-0">
                    <button
                        onClick={() => { setOpenTool(null); setPendingEdit(null); }}
                        className="flex items-center gap-1.5 text-xs font-bold text-gray-300 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 px-3 py-1.5 rounded-lg transition-all"
                    >
                        <ArrowLeft size={14}/> Back
                    </button>
                    <div className="flex items-center gap-2 flex-1">
                        <activeTool.icon size={16} className={c.text}/>
                        <span className="font-bold text-white text-sm">{activeTool.label}</span>
                        {activeTool.status === 'constructor' && (
                            <span className="text-[9px] uppercase tracking-widest font-bold px-2 py-0.5 rounded bg-rose-500/15 border border-rose-500/30 text-rose-400">
                                Constructor Mode
                            </span>
                        )}
                    </div>
                    <a
                        href={activeTool.src}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-[10px] uppercase tracking-widest font-bold text-gray-400 hover:text-white px-2 py-1"
                    >
                        <ExternalLink size={11}/> New Tab
                    </a>
                </div>

                {/* Iframe */}
                <div className="flex-1 min-h-0">
                    <iframe
                        key={openTool}
                        src={activeTool.src}
                        title={activeTool.label}
                        className="w-full h-full border-0 block"
                        sandbox="allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox allow-downloads allow-modals"
                        allow="clipboard-read; clipboard-write; fullscreen"
                        allowFullScreen
                        onLoad={handleIframeLoad}
                    />
                </div>
            </div>,
            document.body
        );
    }

    // Library overlay
    if (showLibrary) {
        return (
            <div className="glass-card border border-white/10 rounded-2xl overflow-hidden flex flex-col animate-in fade-in duration-300">
                <div className="p-4 border-b border-white/10 bg-black/40 flex items-center gap-3">
                    <button
                        onClick={() => setShowLibrary(false)}
                        className="flex items-center gap-1.5 text-xs font-bold text-gray-300 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 px-3 py-1.5 rounded-lg transition-all"
                    >
                        <ArrowLeft size={14}/> Back
                    </button>
                    <h3 className="text-lg font-bold text-rpg-gold flex items-center gap-2">
                        <Library size={18}/> Saved Designs
                    </h3>
                    <span className="text-xs text-gray-500 ml-auto font-mono">
                        {designs.length} design{designs.length !== 1 ? 's' : ''}
                    </span>
                </div>
                <div className="bg-black/20 max-h-[600px] overflow-auto">
                    {libLoading ? (
                        <div className="flex items-center justify-center py-16 text-rpg-gold"><Loader className="animate-spin" size={24}/></div>
                    ) : designs.length === 0 ? (
                        <div className="text-center text-gray-500 italic py-16 px-4">
                            No designs saved yet. Open a tool and click <strong className="text-rpg-gold">SAVE TO LIBRARY</strong>.
                        </div>
                    ) : (
                        <div className="p-4 space-y-2">
                            {designs.map(d => (
                                <div key={d.id} className="bg-black/40 border border-white/10 rounded-xl p-3 flex items-start gap-3 flex-wrap">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <span className="font-bold text-white truncate" title={d.name}>{d.name}</span>
                                            <span className={`text-[9px] uppercase tracking-widest font-bold px-2 py-0.5 rounded border ${
                                                d.tool === 'house' ? 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                                                    : d.tool === 'character' ? 'bg-rose-500/10 border-rose-500/30 text-rose-400'
                                                    : 'bg-purple-500/10 border-purple-500/30 text-purple-400'
                                            }`}>
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
                                        <button onClick={() => copySnippet(d)} className="flex items-center gap-1 text-[10px] uppercase tracking-widest font-bold bg-rpg-gold/15 hover:bg-rpg-gold/25 border border-rpg-gold/40 text-rpg-gold px-2.5 py-1.5 rounded">
                                            {copiedId === d.id ? <Check size={11}/> : <Copy size={11}/>} {copiedId === d.id ? 'Copied' : 'Copy'}
                                        </button>
                                        <button onClick={() => editDesign(d)} className="flex items-center gap-1 text-[10px] uppercase tracking-widest font-bold bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/30 text-blue-400 px-2.5 py-1.5 rounded">
                                            Edit
                                        </button>
                                        <button onClick={() => deleteDesign(d)} className="flex items-center gap-1 text-[10px] uppercase tracking-widest font-bold bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 px-2.5 py-1.5 rounded">
                                            <Trash2 size={11}/>
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        );
    }

    // Main view — Tool cards
    return (
        <div className="space-y-4 animate-in fade-in duration-300">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {TOOLS.map(t => {
                    const Icon = t.icon;
                    const c = COLOR_MAP[t.color] || COLOR_MAP.amber;
                    return (
                        <button
                            key={t.id}
                            onClick={() => {
                                if (t.id === 'map' || t.id === 'house') {
                                    window.open(t.src, 'taskoria_editor');
                                    return;
                                }
                                setOpenTool(t.id);
                            }}
                            className={`group text-left ${c.bg} border ${c.border} rounded-2xl p-5 transition-all hover:scale-[1.02] hover:shadow-lg ${c.glow} cursor-pointer`}
                        >
                            <div className="flex items-start justify-between mb-3">
                                <div className={`w-10 h-10 rounded-xl ${c.bg} border ${c.border} flex items-center justify-center`}>
                                    <Icon size={20} className={c.text}/>
                                </div>
                                {t.status === 'constructor' && (
                                    <span className="text-[8px] uppercase tracking-widest font-bold px-2 py-0.5 rounded bg-rose-500/15 border border-rose-500/30 text-rose-400">
                                        WIP
                                    </span>
                                )}
                            </div>
                            <h4 className="font-bold text-white text-sm mb-1 group-hover:text-rpg-gold transition-colors">{t.label}</h4>
                            <p className="text-xs text-gray-400 leading-relaxed">{t.description}</p>
                        </button>
                    );
                })}

                {/* Library card */}
                <button
                    onClick={() => setShowLibrary(true)}
                    className="group text-left bg-white/5 border border-white/10 rounded-2xl p-5 transition-all hover:scale-[1.02] hover:shadow-lg hover:shadow-white/5 cursor-pointer"
                >
                    <div className="flex items-start justify-between mb-3">
                        <div className="w-10 h-10 rounded-xl bg-rpg-gold/10 border border-rpg-gold/30 flex items-center justify-center">
                            <Library size={20} className="text-rpg-gold"/>
                        </div>
                        {designs.length > 0 && (
                            <span className="text-[9px] uppercase tracking-widest font-bold px-2 py-0.5 rounded bg-rpg-gold/15 border border-rpg-gold/30 text-rpg-gold">
                                {designs.length}
                            </span>
                        )}
                    </div>
                    <h4 className="font-bold text-white text-sm mb-1 group-hover:text-rpg-gold transition-colors">Saved Designs</h4>
                    <p className="text-xs text-gray-400 leading-relaxed">Diseños guardados desde los editores. Copia, edita o elimina.</p>
                </button>
            </div>

            <p className="text-[10px] text-gray-500 text-center px-4">
                Click a tool to open it fullscreen. Inside each editor, click <strong className="text-rpg-gold">SAVE TO LIBRARY</strong> to store your work.
            </p>
        </div>
    );
};

export default AdminWorldTools;
