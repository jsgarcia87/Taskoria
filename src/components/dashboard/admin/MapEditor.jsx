import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import {
    ArrowLeft, Save, FileUp, FileDown, Trash2, MousePointer2, Plus,
    Move, Grid, Eye, EyeOff, Layers, Info, Sparkles, MapPin, Home,
    Compass, TreePine, Package, Loader, X, Blocks, Magnet, Edit3,
    ZoomIn, ZoomOut,
} from 'lucide-react';
import WorldCanvas from '../world/WorldCanvas';
import { MAP_DATA } from '../world/MapData';
import { WORLD_PROPS, WorldSprite } from '../world/worldProps';
import { SPRITES, pixelBufferToDataUrl } from '../world/sprites';
import { PREFAB_NAMES } from '../world/prefabs';
import { useToast } from '../../common/Toast';

// Bounding-box defaults for each prefab type — used both for click hit-testing
// and drawing the selection outline. These are approximations of the composite
// footprint so the operator has a real handle to grab; the actual sprites are
// still rendered by expandPrefabs and match production exactly.
const PREFAB_META = {
    shop_complete:  { w: 360, h: 260, label: 'Tienda completa',    params: [] },
    forest_grove:   { w: 300, h: 300, label: 'Bosquecillo',        params: ['seed'] },
    garden_patch:   { w: 120, h: 120, label: 'Jardín',             params: ['seed'] },
    market_corner:  { w: 220, h: 220, label: 'Esquina mercado',    params: ['accent'] },
    sanctuary_pen:  { w: 360, h: 320, label: 'Santuario',          params: ['width', 'height'] },
    tree_line:      { w: 800, h: 100, label: 'Línea de árboles',   params: ['length', 'seed'] },
    royal_dais:     { w: 200, h: 150, label: 'Estrado real',       params: [] },
    tavern_corner:  { w: 250, h: 200, label: 'Esquina taverna',    params: [] },
    crypt_chamber:  { w: 200, h: 200, label: 'Cámara cripta',      params: [] },
    forest_clearing:{ w: 250, h: 250, label: 'Claro del bosque',   params: ['seed'] },
    town_houses:    { w: 240, h: 100, label: 'Casas del pueblo',   params: ['count', 'seed'] },
};

const prefabDefaults = (name) => {
    switch (name) {
        case 'sanctuary_pen': return { width: 360, height: 320 };
        case 'tree_line':     return { length: 800, seed: 1 };
        case 'town_houses':   return { count: 2, seed: 3 };
        case 'market_corner': return { accent: '#9a2a2a' };
        case 'forest_grove':
        case 'garden_patch':
        case 'forest_clearing': return { seed: 1 };
        default: return {};
    }
};

/**
 * The map editor's asset palette. Grouped by category. Each entry names a
 * decoration type that PlayableWorld knows how to render — placing one here
 * yields exactly what production shows, at production scale, with no
 * translation layer between us and the shipping renderer.
 *
 * NOTE: 'sprite' is the generic wrapper for any WorldSprite name (oak_tree,
 * bench, cat_sleeping, etc.). Otherwise the type triggers a specific rendering
 * branch in DecorationsLayer (well → WorldSprite well, bench → WorldSprite bench
 * with sizing rules, and so on).
 */
const PALETTE = {
    tiles: {
        label: 'Suelos',
        icon: Grid,
        // Tiles are set via the map's tileSprite property, not placed. Listed
        // here so the operator can flip the base surface.
        items: [
            { id: 'cobblestone_tile',    label: 'Adoquín' },
            { id: 'grass_tile',          label: 'Hierba' },
            { id: 'stone_floor_tile',    label: 'Piedra' },
            { id: 'wood_floor_tile',     label: 'Madera' },
            { id: 'dungeon_floor_tile',  label: 'Mazmorra' },
            { id: 'dirt_tile',           label: 'Tierra' },
        ],
    },
    nature: {
        label: 'Naturaleza',
        icon: TreePine,
        items: [
            { id: 'oak_tree',    label: 'Roble',        defaults: { scale: 1.8 } },
            { id: 'pine_tree',   label: 'Pino',         defaults: { scale: 1.7 } },
            { id: 'dead_tree',   label: 'Árbol seco',   defaults: { scale: 1.6 } },
            { id: 'ancient_tree',label: 'Árbol ancest.',defaults: { scale: 2.0 } },
            { id: 'bush',        label: 'Arbusto',      defaults: { scale: 1.2 } },
            { id: 'grass_tuft',  label: 'Hierba alta',  defaults: { scale: 1.4 } },
            { id: 'flowers',     label: 'Flores',       defaults: { scale: 1.0 } },
        ],
    },
    props: {
        label: 'Props',
        icon: Package,
        items: [
            { id: 'well',            label: 'Pozo',           defaults: { width: 96, height: 96 } },
            { id: 'bench',           label: 'Banco',          defaults: { size: 60 } },
            { id: 'lamp',            label: 'Farola',         defaults: { size: 64 } },
            { id: 'barrel',          label: 'Barril',         defaults: { size: 40 } },
            { id: 'crate',           label: 'Caja',           defaults: { size: 40 } },
            { id: 'barrel_tipped',   label: 'Barril volcado', defaults: { scale: 1.6 } },
            { id: 'sign',            label: 'Cartel',         defaults: { label: 'SIGN' } },
            { id: 'signpost',        label: 'Poste' },
            { id: 'fountain',        label: 'Fuente',         defaults: { scale: 1.5 } },
            { id: 'bridge',          label: 'Puente',         defaults: { scale: 1.5 } },
            { id: 'fire',            label: 'Fogata',         defaults: { scale: 1.2 } },
            { id: 'campfire',        label: 'Hoguera',        defaults: { scale: 1.4 } },
        ],
    },
    buildings: {
        label: 'Edificios',
        icon: Home,
        items: [
            { id: 'shop_building',    label: 'Tienda',   defaults: { width: 240, height: 150 } },
            { id: 'tavern',           label: 'Taverna',  defaults: { scale: 3.0 } },
            { id: 'house_thatch',     label: 'Casa paja',defaults: { scale: 2.5 } },
            { id: 'house_wood',       label: 'Casa mad.',defaults: { scale: 2.5 } },
            { id: 'church',           label: 'Iglesia',  defaults: { scale: 2.5 } },
            { id: 'smithy',           label: 'Herrería', defaults: { scale: 2.5 } },
            { id: 'windmill',         label: 'Molino',   defaults: { scale: 2.5 } },
            { id: 'market_stall_red',   label: 'Puesto rojo',   defaults: { scale: 1.4 } },
            { id: 'market_stall_green', label: 'Puesto verde',  defaults: { scale: 1.4 } },
            { id: 'market_stall_purple',label: 'Puesto morado', defaults: { scale: 1.4 } },
        ],
    },
    council: {
        label: 'Consejo',
        icon: Sparkles,
        items: [
            { id: 'ledgar_statue', label: 'Estatua Ledgar', defaults: { scale: 1.6 } },
            { id: 'council_board', label: 'Tablón',         defaults: { scale: 2.0 } },
            { id: 'banner_gold',   label: 'Estandarte oro', defaults: { scale: 1.5 } },
            { id: 'banner_red',    label: 'Estandarte rojo',defaults: { scale: 1.5 } },
            { id: 'banner_blue',   label: 'Estandarte azul',defaults: { scale: 1.5 } },
            { id: 'banner_purple', label: 'Estandarte púrp.',defaults: { scale: 1.5 } },
            { id: 'pillar',        label: 'Pilar',          defaults: { width: 34, height: 90 } },
            { id: 'cat_sleeping',  label: 'Gato dormido',   defaults: { scale: 1.6 } },
        ],
    },
    zones: {
        label: 'Zonas',
        icon: MapPin,
        items: [
            { id: '__portal',       label: 'Portal',      special: true },
            { id: '__interactable', label: 'Interacción', special: true },
            { id: '__rect',         label: 'Rectángulo',  special: true },
        ],
    },
    prefabs: {
        label: 'Prefabs',
        icon: Blocks,
        // Prefabs are composite scenes — dropping one adds a single entry to
        // `map.prefabs[]` that expands into many decorations at render time.
        items: PREFAB_NAMES.map(name => ({
            id: name,
            label: PREFAB_META[name]?.label || name,
            prefab: true,
        })),
    },
};

// Common target maps for portal destinations.
const KNOWN_MAP_IDS = ['townSquare','tavernInterior','taskoriaKeep','mysticForest','shadowCrypts','freeDistrict'];

// Which categories place as top-level `decorations` (with a specific type key)
// vs `instances` (generic sprite reference). Anything not listed becomes an
// instance with a WorldSprite name. This matches PlayableWorld's branches.
const DECORATION_TYPES = new Set([
    'well','bench','lamp','barrel','crate','sign','signpost','fountain','bridge','fire',
    'shop_building','pillar','pine_tree','oak_tree','flowers','bush','fence',
    'market_stall_red','market_stall_green','market_stall_purple',
]);

const emptyMap = () => ({
    id: 'newMap',
    name: 'Nuevo Mapa',
    width: 1600,
    height: 1000,
    baseColor: '#2b1f1a',
    className: 'medieval-town-bg',
    tileSprite: 'cobblestone_tile',
    tileSize: 64,
    spawn: { x: 800, y: 500 },
    obstacles: [],
    interactables: [],
    portals: [],
    prefabs: [],
    decorations: [],
});

export default function MapEditor({ currentUser, initialDesign, onClose, onSaved }) {
    const toast = useToast();
    const [map, setMap] = useState(() => {
        if (initialDesign?.payload) {
            const p = typeof initialDesign.payload === 'string'
                ? (() => { try { return JSON.parse(initialDesign.payload); } catch { return {}; } })()
                : initialDesign.payload;
            return { ...emptyMap(), ...p };
        }
        return emptyMap();
    });

    const [mapName, setMapName] = useState(() => initialDesign?.name || map.name || 'Nuevo Mapa');
    const [tool, setTool] = useState('select'); // 'select' | 'place'
    const [selectedCategory, setSelectedCategory] = useState('nature');
    const [selectedAsset, setSelectedAsset] = useState(null);
    const [selectedItem, setSelectedItem] = useState(null); // {kind, index}
    const [showGrid, setShowGrid] = useState(true);
    const [showObstacles, setShowObstacles] = useState(false);
    const [zoom, setZoom] = useState(1);
    const [hoverPos, setHoverPos] = useState(null);
    const [saving, setSaving] = useState(false);
    const [history, setHistory] = useState([]);
    const [redoHistory, setRedoHistory] = useState([]);
    const [showLoadMenu, setShowLoadMenu] = useState(false);
    // Clipboard for copy/paste — carries the last-copied element (kind + data).
    // Not persisted; cleared when the editor unmounts.
    const clipboardRef = useRef(null);
    const [showImportText, setShowImportText] = useState(false);
    const [snapToGrid, setSnapToGrid] = useState(false);
    // Snap a coordinate to the current tile grid when snap mode is on.
    const snap = (v) => snapToGrid ? Math.round(v / (map.tileSize || 64)) * (map.tileSize || 64) : Math.round(v);
    // Scale reported by WorldCanvas (fit-to-container × zoom). Used to convert
    // screen-pixel deltas into map-pixel deltas when the operator drags.
    const scaleRef = useRef(1);
    
    // Pan state for middle-click/shift drag panning
    const [pan, setPan] = useState({ x: 0, y: 0 });
    const isPanning = useRef(false);

    // Live drag state (null when idle). Directly mutates the selected element;
    // pushed to history at drag start so undo restores the pre-drag position.
    const [dragState, setDragState] = useState(null);

    // Save a snapshot for undo before applying a mutation. Any fresh mutation
    // clears the redo stack — otherwise we'd redo into a diverged timeline.
    const pushHistory = useCallback(() => {
        setHistory(h => [...h.slice(-49), JSON.parse(JSON.stringify(map))]);
        setRedoHistory([]);
    }, [map]);

    useEffect(() => {
        let hasMousePanned = false;
        const onMouseMove = (e) => {
            if (isPanning.current) {
                if (Math.abs(e.movementX) > 1 || Math.abs(e.movementY) > 1) hasMousePanned = true;
                setPan(p => ({ x: p.x + e.movementX, y: p.y + e.movementY }));
            }
        };
        const onMouseUp = (e) => {
            if (isPanning.current) {
                isPanning.current = false;
                if (hasMousePanned) suppressNextClickRef.current = true;
                hasMousePanned = false;
            }
        };
        
        // Touch panning support
        let lastTouch = null;
        let hasPanned = false;
        const onTouchMove = (e) => {
            if (e.touches.length === 1 && isPanning.current) {
                const touch = e.touches[0];
                if (lastTouch) {
                    const dx = touch.clientX - lastTouch.x;
                    const dy = touch.clientY - lastTouch.y;
                    if (Math.abs(dx) > 2 || Math.abs(dy) > 2) hasPanned = true;
                    setPan(p => ({ x: p.x + dx, y: p.y + dy }));
                }
                lastTouch = { x: touch.clientX, y: touch.clientY };
            } else if (e.touches.length > 1) {
                lastTouch = null; // Pinch zooming handled separately if needed
            }
        };
        const onTouchEnd = () => {
            if (isPanning.current) {
                isPanning.current = false;
                if (hasPanned) suppressNextClickRef.current = true;
                lastTouch = null;
                hasPanned = false;
            }
        };

        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);
        document.addEventListener('touchmove', onTouchMove, { passive: false });
        document.addEventListener('touchend', onTouchEnd);
        return () => {
            document.removeEventListener('mousemove', onMouseMove);
            document.removeEventListener('mouseup', onMouseUp);
            document.removeEventListener('touchmove', onTouchMove);
            document.removeEventListener('touchend', onTouchEnd);
        };
    }, []);

    const undo = () => {
        setHistory(h => {
            if (h.length === 0) return h;
            const prev = h[h.length - 1];
            setRedoHistory(r => [...r.slice(-49), JSON.parse(JSON.stringify(map))]);
            setMap(prev);
            return h.slice(0, -1);
        });
    };

    const redo = () => {
        setRedoHistory(r => {
            if (r.length === 0) return r;
            const next = r[r.length - 1];
            setHistory(h => [...h.slice(-49), JSON.parse(JSON.stringify(map))]);
            setMap(next);
            return r.slice(0, -1);
        });
    };

    const updateMap = (mutator) => {
        pushHistory();
        setMap(prev => {
            const next = { ...prev };
            mutator(next);
            return next;
        });
    };

    // Load an existing MAP_DATA entry as the editable state — this lets the
    // operator start from a system map (Town Square, Keep, etc.) rather than
    // an empty canvas.
    const importFromMapData = (mapId) => {
        const src = MAP_DATA[mapId];
        if (!src) return;
        pushHistory();
        // Deep clone so mutations don't touch the module-level MAP_DATA.
        setMap(JSON.parse(JSON.stringify({ ...emptyMap(), ...src })));
        setMapName(src.name || mapId);
        setSelectedItem(null);
        toast.success(`Cargado "${src.name || mapId}" desde MapData.js`);
        setShowLoadMenu(false);
    };

    // Turn the current editable state into a MapData.js snippet.
    const exportMapData = () => {
        const key = (map.id || 'newMap').replace(/[^a-zA-Z0-9_]/g, '_');
        const clone = { ...map };
        // Strip meta the engine doesn't care about.
        delete clone.__editorMeta;
        const code = `// MapData generado por Taskoria Map Editor\nexport const ${key} = ${JSON.stringify(clone, null, 2)};\n`;
        navigator.clipboard.writeText(code).then(() => {
            toast.success('Snippet copiado al portapapeles');
        }).catch(() => {
            toast.error('No se pudo copiar; snippet impreso en la consola');
            console.log(code);
        });
    };

    // Persist to the admin library. Uses the same endpoint as the HTML editor.
    // When editing an existing design (initialDesign.id) we pass the id back so
    // the endpoint UPDATEs in place instead of inserting a duplicate row.
    const saveDesign = async () => {
        if (!currentUser?.id) { toast.error('Necesitas sesión admin'); return; }
        setSaving(true);
        try {
            const payload = { ...map, name: mapName };
            const snippet = `export const ${(map.id || 'newMap').replace(/[^a-zA-Z0-9_]/g, '_')} = ${JSON.stringify(payload, null, 2)};`;
            const body = {
                admin_id: currentUser.id,
                tool: 'map',
                name: mapName,
                snippet,
                payload,
            };
            if (initialDesign?.id) body.id = initialDesign.id;
            const res = await fetch('api/admin.php?action=save_design', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            });
            const json = await res.json();
            if (json.success) {
                toast.success(`"${mapName}" guardado en la biblioteca`);
                if (onSaved) onSaved();
            }
            else toast.error(json.error || 'Fallo al guardar');
        } catch (e) {
            toast.error('Error de red al guardar');
        } finally {
            setSaving(false);
        }
    };

    // Place an asset in the map at (x, y). Routes decorations vs instances vs
    // prefabs depending on the asset — decorations use type-specific branches
    // in PlayableWorld's DecorationsLayer; instances use the generic
    // WorldSprite; prefabs expand into many decorations at render time.
    const placeAsset = (x, y, asset) => {
        if (!asset) return;
        pushHistory();
        const sx = snap(x);
        const sy = snap(y);

        // Special zone types
        if (asset.special) {
            if (asset.id === '__portal') {
                setMap(prev => ({
                    ...prev,
                    portals: [...(prev.portals || []), {
                        x: sx, y: sy,
                        width: 100, height: 60,
                        targetMap: 'townSquare', targetX: 800, targetY: 500,
                        label: 'Nuevo Portal',
                    }],
                }));
                setSelectedItem({ kind: 'portal', index: (map.portals || []).length });
                return;
            }
            if (asset.id === '__interactable') {
                setMap(prev => ({
                    ...prev,
                    interactables: [...(prev.interactables || []), {
                        x: sx, y: sy,
                        width: 60, height: 60, radius: 90,
                        label: 'Nueva Zona', flavor: '',
                    }],
                }));
                setSelectedItem({ kind: 'interactable', index: (map.interactables || []).length });
                return;
            }
            if (asset.id === '__rect') {
                setMap(prev => ({
                    ...prev,
                    decorations: [...(prev.decorations || []), {
                        type: 'rect', x: sx, y: sy,
                        width: 200, height: 100, color: '#c8a878', opacity: 0.5, z: 0,
                    }],
                }));
                setSelectedItem({ kind: 'decoration', index: (map.decorations || []).length });
                return;
            }
        }

        if (asset.prefab) {
            setMap(prev => ({
                ...prev,
                prefabs: [...(prev.prefabs || []), {
                    name: asset.id, x: sx, y: sy, ...prefabDefaults(asset.id),
                }],
            }));
            setSelectedItem({ kind: 'prefab', index: (map.prefabs || []).length });
            return;
        }

        const isDecoration = DECORATION_TYPES.has(asset.id);
        if (isDecoration) {
            const dec = { type: asset.id, x: sx, y: sy, ...(asset.defaults || {}) };
            setMap(prev => ({
                ...prev,
                decorations: [...(prev.decorations || []), dec],
            }));
            setSelectedItem({ kind: 'decoration', index: (map.decorations || []).length });
        } else {
            // Generic instance — rendered by PlayableWorld as a WorldSprite.
            const inst = {
                type: asset.id,
                x: sx, y: sy,
                scale: asset.defaults?.scale || 1,
                rotation: 0,
                label: '',
            };
            setMap(prev => ({
                ...prev,
                instances: [...(prev.instances || []), inst],
            }));
            setSelectedItem({ kind: 'instance', index: (map.instances || []).length });
        }
    };

    // Find the topmost element at (x, y) for select-mode clicks. Priority:
    // portals, interactables, instances (by y desc), decorations (by y desc),
    // prefabs last so top-level sprites always win over their macro group.
    const pickAt = (x, y) => {
        const hit = (px, py, w, h) =>
            x >= px && x <= px + w && y >= py && y <= py + h;
        if (map.portals) {
            for (let i = map.portals.length - 1; i >= 0; i--) {
                const p = map.portals[i];
                if (hit(p.x, p.y, p.width, p.height)) return { kind: 'portal', index: i };
            }
        }
        if (map.interactables) {
            for (let i = map.interactables.length - 1; i >= 0; i--) {
                const iz = map.interactables[i];
                if (hit(iz.x, iz.y, iz.width, iz.height)) return { kind: 'interactable', index: i };
            }
        }
        if (map.instances) {
            const sorted = map.instances.map((ins, i) => ({ ins, i })).sort((a, b) => b.ins.y - a.ins.y);
            for (const { ins, i } of sorted) {
                const prop = WORLD_PROPS[ins.type];
                const w = (prop?.w || 40) * (ins.scale || 1);
                const h = (prop?.h || 40) * (ins.scale || 1);
                if (hit(ins.x, ins.y, w, h)) return { kind: 'instance', index: i };
            }
        }
        if (map.decorations) {
            const sorted = map.decorations.map((d, i) => ({ d, i })).sort((a, b) => (b.d.y || 0) - (a.d.y || 0));
            for (const { d, i } of sorted) {
                const w = d.width || d.size || 60;
                const h = d.height || d.size || 60;
                if (hit(d.x, d.y, w, h)) return { kind: 'decoration', index: i };
            }
        }
        if (map.prefabs) {
            for (let i = map.prefabs.length - 1; i >= 0; i--) {
                const pf = map.prefabs[i];
                const meta = PREFAB_META[pf.name] || { w: 200, h: 200 };
                const w = pf.width || meta.w;
                const h = pf.height || meta.h;
                if (hit(pf.x, pf.y, w, h)) return { kind: 'prefab', index: i };
            }
        }
        return null;
    };

    const handleCanvasClick = (mapX, mapY) => {
        // Any click that immediately follows a drag or pan is the mouseup — swallow it
        // so the user's careful position isn't cleared as a "click elsewhere".
        if (suppressNextClickRef.current) {
            suppressNextClickRef.current = false;
            return;
        }
        if (mapX < 0 || mapY < 0 || mapX > map.width || mapY > map.height) return;

        if (tool === 'place' && selectedAsset) {
            placeAsset(mapX, mapY, selectedAsset);
        } else {
            const picked = pickAt(mapX, mapY);
            setSelectedItem(picked);
        }
    };

    const handleCanvasMouseMove = (mapX, mapY) => {
        setHoverPos({ x: mapX, y: mapY });
    };

    // Bounding box of any item — matches pickAt's calculation so drag handles
    // sit exactly where the click hit tests do.
    const boundsOf = (kind, data) => {
        if (kind === 'instance') {
            const prop = WORLD_PROPS[data.type];
            return { x: data.x, y: data.y, w: (prop?.w || 40) * (data.scale || 1), h: (prop?.h || 40) * (data.scale || 1) };
        }
        if (kind === 'decoration') {
            return { x: data.x, y: data.y, w: data.width || data.size || 60, h: data.height || data.size || 60 };
        }
        if (kind === 'prefab') {
            const meta = PREFAB_META[data.name] || { w: 200, h: 200 };
            return { x: data.x, y: data.y, w: data.width || meta.w, h: data.height || meta.h };
        }
        return { x: data.x, y: data.y, w: data.width, h: data.height };
    };

    // Start dragging (move or resize) from a mousedown on the selection outline
    // or a handle. Records the pre-drag snapshot so the whole drag is one undo.
    const beginDrag = (mode) => (e) => {
        if (!selectedItem || !selectedData) return;
        e.stopPropagation();
        if (e.type !== 'touchstart') e.preventDefault();
        pushHistory();
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;
        setDragState({
            mode,
            startX: clientX,
            startY: clientY,
            startData: { ...selectedData },
        });
    };

    // Global mouse tracking during a drag — bypasses React's event system so
    // the drag keeps working even when the cursor leaves the canvas.
    useEffect(() => {
        if (!dragState) return;
        const scale = scaleRef.current || 1;
        const onMove = (e) => {
            const clientX = e.touches ? e.touches[0].clientX : e.clientX;
            const clientY = e.touches ? e.touches[0].clientY : e.clientY;
            const dx = (clientX - dragState.startX) / scale;
            const dy = (clientY - dragState.startY) / scale;
            const start = dragState.startData;
            const patch = {};
            switch (dragState.mode) {
                case 'move':
                    patch.x = snap(start.x + dx);
                    patch.y = snap(start.y + dy);
                    break;
                case 'nw':
                    patch.x = Math.round(start.x + dx);
                    patch.y = Math.round(start.y + dy);
                    patch.width  = Math.max(16, Math.round((start.width  || 0) - dx));
                    patch.height = Math.max(16, Math.round((start.height || 0) - dy));
                    break;
                case 'ne':
                    patch.y = Math.round(start.y + dy);
                    patch.width  = Math.max(16, Math.round((start.width  || 0) + dx));
                    patch.height = Math.max(16, Math.round((start.height || 0) - dy));
                    break;
                case 'sw':
                    patch.x = Math.round(start.x + dx);
                    patch.width  = Math.max(16, Math.round((start.width  || 0) - dx));
                    patch.height = Math.max(16, Math.round((start.height || 0) + dy));
                    break;
                case 'se':
                    patch.width  = Math.max(16, Math.round((start.width  || 0) + dx));
                    patch.height = Math.max(16, Math.round((start.height || 0) + dy));
                    break;
                case 'scale': {
                    // For instances (WorldSprites) we resize via the scale
                    // property — the underlying sprite has a fixed pixel size,
                    // so width/height would be ignored.
                    const prop = WORLD_PROPS[start.type];
                    const baseW = prop?.w || 40;
                    const newScale = Math.max(0.1, (start.scale || 1) + dx / baseW);
                    patch.scale = Math.round(newScale * 100) / 100;
                    break;
                }
                default: break;
            }
            setMap(prev => {
                const key = kindToKey(selectedItem.kind);
                const arr = prev[key] || [];
                if (!arr[selectedItem.index]) return prev;
                const nextArr = arr.map((el, i) => (i === selectedItem.index ? { ...el, ...patch } : el));
                return { ...prev, [key]: nextArr };
            });
        };
        const onUp = () => setDragState(null);
        // Prevent selecting text on the page while dragging.
        document.body.style.userSelect = 'none';
        document.addEventListener('mousemove', onMove);
        document.addEventListener('mouseup', onUp);
        document.addEventListener('touchmove', onMove, { passive: false });
        document.addEventListener('touchend', onUp);
        return () => {
            document.removeEventListener('mousemove', onMove);
            document.removeEventListener('mouseup', onUp);
            document.removeEventListener('touchmove', onMove);
            document.removeEventListener('touchend', onUp);
            document.body.style.userSelect = '';
        };
    }, [dragState, selectedItem]);

    // If a click ends a drag, swallow the click so it doesn't deselect.
    const suppressNextClickRef = useRef(false);
    useEffect(() => {
        if (dragState) suppressNextClickRef.current = true;
    }, [dragState]);

    // Import a raw MapData snippet the user pastes (either the export from the
    // old HTML editor or a slice of MapData.js). We extract the first object
    // literal with `new Function` — same as `eval` but scoped to a function.
    const importFromText = (text) => {
        if (!text?.trim()) { toast.error('Pega un fragmento de código'); return; }
        try {
            // Accept: "{ ... }", "export const x = { ... };", or the entire MAP_DATA export
            let src = text.trim();
            // Strip leading "export const NAME = " if present.
            src = src.replace(/^\s*export\s+const\s+\w+\s*=\s*/, '');
            // Strip trailing semicolons.
            src = src.replace(/;\s*$/, '');
            // Wrap in parens so `{ ... }` parses as an object, not a block.
            const parsed = new Function(`return (${src});`)();
            if (!parsed || typeof parsed !== 'object') throw new Error('No es un objeto');
            pushHistory();
            setMap(prev => ({ ...emptyMap(), ...parsed }));
            setMapName(parsed.name || parsed.id || 'Mapa importado');
            setSelectedItem(null);
            toast.success('Mapa importado desde código');
            setShowImportText(false);
        } catch (e) {
            toast.error(`Código inválido: ${e.message}`);
        }
    };

    // Selected element's current props — declared BEFORE the clipboard/keyboard
    // helpers so their closures don't hit the temporal dead zone.
    const selectedData = useMemo(() => {
        if (!selectedItem) return null;
        const { kind, index } = selectedItem;
        if (kind === 'decoration') return map.decorations?.[index];
        if (kind === 'instance')   return map.instances?.[index];
        if (kind === 'portal')     return map.portals?.[index];
        if (kind === 'interactable') return map.interactables?.[index];
        if (kind === 'prefab')     return map.prefabs?.[index];
        return null;
    }, [selectedItem, map]);

    // Duplicate the selected element at (dx, dy) offset — used by Ctrl+D and
    // by paste. Returns the index of the new element so the caller can select it.
    const cloneSelectedTo = (data, kind, dx = 40, dy = 40) => {
        pushHistory();
        const copy = JSON.parse(JSON.stringify(data));
        copy.x = snap((copy.x || 0) + dx);
        copy.y = snap((copy.y || 0) + dy);
        let newIndex = 0;
        setMap(prev => {
            const key = kindToKey(kind);
            if (!key) return prev;
            const arr = prev[key] || [];
            newIndex = arr.length;
            return { ...prev, [key]: [...arr, copy] };
        });
        setSelectedItem({ kind, index: newIndex });
    };

    const doCopy = () => {
        if (!selectedItem || !selectedData) return;
        clipboardRef.current = { kind: selectedItem.kind, data: JSON.parse(JSON.stringify(selectedData)) };
        toast.success(`Copiado: ${selectedData.type || selectedData.name || selectedItem.kind}`, { duration: 1500 });
    };

    const doPaste = () => {
        const cb = clipboardRef.current;
        if (!cb) return;
        cloneSelectedTo(cb.data, cb.kind, 40, 40);
    };

    const doDuplicate = () => {
        if (!selectedItem || !selectedData) return;
        cloneSelectedTo(selectedData, selectedItem.kind, 40, 40);
    };

    // Keyboard shortcuts — Delete/Cmd-Z/Cmd-Shift-Z/Cmd-C/Cmd-V/Cmd-D + toggles.
    useEffect(() => {
        const onKey = (e) => {
            const inField = ['INPUT','TEXTAREA','SELECT'].includes(document.activeElement?.tagName);
            const mod = e.metaKey || e.ctrlKey;

            if (e.key === 'Delete' || e.key === 'Backspace') {
                if (!selectedItem || inField) return;
                pushHistory();
                setMap(prev => {
                    const key = kindToKey(selectedItem.kind);
                    if (!key) return prev;
                    return {
                        ...prev,
                        [key]: (prev[key] || []).filter((_, i) => i !== selectedItem.index),
                    };
                });
                setSelectedItem(null);
            } else if (mod && e.shiftKey && (e.key === 'Z' || e.key === 'z')) {
                e.preventDefault();
                redo();
            } else if (mod && (e.key === 'z' || e.key === 'Z')) {
                e.preventDefault();
                undo();
            } else if (mod && (e.key === 'y' || e.key === 'Y')) {
                e.preventDefault();
                redo();
            } else if (mod && (e.key === 'c' || e.key === 'C')) {
                if (inField) return;
                e.preventDefault();
                doCopy();
            } else if (mod && (e.key === 'v' || e.key === 'V')) {
                if (inField) return;
                e.preventDefault();
                doPaste();
            } else if (mod && (e.key === 'd' || e.key === 'D')) {
                if (inField) return;
                e.preventDefault();
                doDuplicate();
            } else if (e.key === '+' || e.key === '=') {
                setZoom(z => Math.min(3, z + 0.25));
            } else if (e.key === '-') {
                setZoom(z => Math.max(0.25, z - 0.25));
            } else if (e.key === 'g' || e.key === 'G') {
                if (inField) return;
                setShowGrid(v => !v);
            } else if (e.key === 's' || e.key === 'S') {
                if (inField) return;
                setSnapToGrid(v => !v);
            }
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [selectedItem, selectedData, pushHistory]);

    // Selected element's current props (for the properties panel).
    const patchSelected = (patch) => {
        if (!selectedItem) return;
        setMap(prev => {
            const { kind, index } = selectedItem;
            const key = kindToKey(kind);
            const arr = prev[key] || [];
            if (!arr[index]) return prev;
            const nextArr = arr.map((el, i) => (i === index ? { ...el, ...patch } : el));
            return { ...prev, [key]: nextArr };
        });
    };

    // Full-name flag from the caller — when the editor is opened for an
    // existing library asset (edit-in-place), we show a bigger, more
    // prominent "Back" button and echo the asset name in the header so the
    // operator sees at a glance which map they're on. Same pattern as the
    // character editor's fullscreen shell.
    const isEditingExisting = !!initialDesign?.id;

    return (
        <div className="fixed inset-0 z-[9999] flex flex-col bg-[#0c0a14] text-white">
            {/* Toolbar */}
            <header className="flex items-center gap-2 px-4 py-2 bg-black/60 border-b border-white/10 backdrop-blur flex-shrink-0 overflow-x-auto no-scrollbar">
                <button
                    onClick={onClose}
                    className="flex items-center gap-1.5 text-xs font-bold text-gray-200 hover:text-white bg-rpg-gold/15 hover:bg-rpg-gold/25 border border-rpg-gold/40 text-rpg-gold px-3 py-1.5 rounded-lg transition-all"
                    title="Volver a la pantalla anterior"
                >
                    <ArrowLeft size={14}/> Volver
                </button>

                <div className="w-px h-6 bg-white/10 mx-1" />

                {isEditingExisting && (
                    <div className="flex items-center gap-2 text-rpg-gold font-heading uppercase tracking-widest text-[11px] mr-2">
                        <Edit3 size={13}/>
                        <span>Editando mapa</span>
                        <span className="text-white/40">·</span>
                    </div>
                )}

                <input
                    value={mapName}
                    onChange={e => setMapName(e.target.value)}
                    className="bg-transparent border border-white/10 rounded-md px-2 py-1 text-sm font-bold text-white outline-none focus:border-rpg-gold/50 min-w-[220px]"
                    placeholder="Nombre del mapa"
                />

                <div className="flex items-center gap-1 ml-2 bg-black/40 border border-white/10 rounded-lg p-1">
                    <ToolButton active={tool === 'select'} onClick={() => setTool('select')} icon={MousePointer2} label="Seleccionar (V)" />
                    <ToolButton active={tool === 'place'} onClick={() => setTool('place')} icon={Plus} label="Colocar (B)" />
                </div>

                <div className="w-px h-6 bg-white/10 mx-1" />

                <div className="relative">
                    <button
                        onClick={() => setShowLoadMenu(v => !v)}
                        className="flex items-center gap-1.5 text-xs font-bold text-gray-300 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 px-3 py-1.5 rounded-lg transition-all"
                    >
                        <FileUp size={13}/> Importar
                    </button>
                    {showLoadMenu && (
                        <div className="absolute left-0 top-full mt-1 bg-[#151220] border border-white/10 rounded-lg shadow-2xl p-2 min-w-[220px] z-50">
                            <div className="text-[10px] font-bold uppercase tracking-wider text-gray-400 px-2 py-1">Mapas del sistema</div>
                            {Object.values(MAP_DATA).map(m => (
                                <button
                                    key={m.id}
                                    onClick={() => importFromMapData(m.id)}
                                    className="w-full text-left px-2 py-1.5 text-sm text-gray-200 hover:bg-white/10 rounded"
                                >
                                    {m.name}
                                </button>
                            ))}
                            <div className="border-t border-white/10 my-1" />
                            <button
                                onClick={() => { setShowLoadMenu(false); setShowImportText(true); }}
                                className="w-full text-left px-2 py-1.5 text-sm text-rpg-gold hover:bg-white/10 rounded flex items-center gap-2"
                            >
                                <FileUp size={12}/> Pegar código MapData…
                            </button>
                        </div>
                    )}
                </div>

                <button onClick={exportMapData} className="flex items-center gap-1.5 text-xs font-bold text-gray-300 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 px-3 py-1.5 rounded-lg transition-all">
                    <FileDown size={13}/> Exportar
                </button>

                <button onClick={saveDesign} disabled={saving} className="flex items-center gap-1.5 text-xs font-bold bg-rpg-gold/20 text-rpg-gold border border-rpg-gold/40 hover:bg-rpg-gold/30 px-3 py-1.5 rounded-lg transition-all disabled:opacity-50">
                    {saving ? <Loader size={13} className="animate-spin"/> : <Save size={13}/>}
                    Guardar
                </button>

                <div className="flex-1" />
                
                {/* View controls */}
                <div className="flex items-center gap-1 bg-black/40 border border-white/10 rounded-lg p-1 mr-2">
                    <button onClick={() => setZoom(z => Math.max(0.2, z - 0.2))} className="p-1 text-gray-400 hover:text-white hover:bg-white/10 rounded transition-all" title="Alejar (-)">
                        <ZoomOut size={13}/>
                    </button>
                    <span className="text-[10px] font-mono text-gray-400 w-10 text-center select-none">{Math.round(zoom * 100)}%</span>
                    <button onClick={() => setZoom(z => Math.min(3, z + 0.2))} className="p-1 text-gray-400 hover:text-white hover:bg-white/10 rounded transition-all" title="Acercar (+)">
                        <ZoomIn size={13}/>
                    </button>
                </div>

                <button onClick={() => setShowGrid(v => !v)} className={`flex items-center gap-1.5 text-xs font-bold border px-3 py-1.5 rounded-lg transition-all ${showGrid ? 'bg-blue-500/20 text-blue-300 border-blue-500/40' : 'bg-white/5 text-gray-400 border-white/10 hover:text-white'}`} title="Grid (G)">
                    <Grid size={13}/>
                </button>
                <button onClick={() => setSnapToGrid(v => !v)} className={`flex items-center gap-1.5 text-xs font-bold border px-3 py-1.5 rounded-lg transition-all ${snapToGrid ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' : 'bg-white/5 text-gray-400 border-white/10 hover:text-white'}`} title="Snap al grid (S)">
                    <Magnet size={13}/>
                </button>
                <button onClick={() => setShowObstacles(v => !v)} className={`flex items-center gap-1.5 text-xs font-bold border px-3 py-1.5 rounded-lg transition-all ${showObstacles ? 'bg-red-500/20 text-red-300 border-red-500/40' : 'bg-white/5 text-gray-400 border-white/10 hover:text-white'}`} title="Obstáculos">
                    {showObstacles ? <Eye size={13}/> : <EyeOff size={13}/>}
                </button>

                <div className="flex items-center gap-1 ml-2 bg-black/40 border border-white/10 rounded-lg p-1">
                    <button onClick={() => setZoom(z => Math.max(0.25, z - 0.25))} className="px-2 text-sm text-gray-400 hover:text-white">−</button>
                    <span className="text-xs font-mono text-gray-300 min-w-[42px] text-center">{(zoom * 100).toFixed(0)}%</span>
                    <button onClick={() => setZoom(z => Math.min(3, z + 0.25))} className="px-2 text-sm text-gray-400 hover:text-white">+</button>
                </div>
            </header>

            <div className="flex-1 min-h-0 flex">
                {/* Left palette */}
                <aside className="w-[260px] flex-shrink-0 border-r border-white/10 bg-[#0f0c17] flex flex-col overflow-hidden">
                    <div className="flex items-center gap-1 p-2 border-b border-white/10 bg-black/40 overflow-x-auto">
                        {Object.entries(PALETTE).map(([key, cat]) => {
                            const Icon = cat.icon;
                            return (
                                <button
                                    key={key}
                                    onClick={() => setSelectedCategory(key)}
                                    className={`flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-1.5 rounded-lg transition-all whitespace-nowrap ${
                                        selectedCategory === key
                                            ? 'bg-rpg-gold/20 text-rpg-gold border border-rpg-gold/40'
                                            : 'text-gray-400 hover:text-white hover:bg-white/5 border border-transparent'
                                    }`}
                                    title={cat.label}
                                >
                                    <Icon size={12}/> {cat.label}
                                </button>
                            );
                        })}
                    </div>

                    <div className="flex-1 overflow-y-auto p-2 grid grid-cols-2 gap-1 content-start">
                        {selectedCategory === 'tiles' ? (
                            PALETTE.tiles.items.map(item => (
                                <button
                                    key={item.id}
                                    onClick={() => updateMap(m => { m.tileSprite = item.id; })}
                                    className={`flex flex-col items-center gap-1 p-2 rounded-lg border transition-all ${
                                        map.tileSprite === item.id
                                            ? 'bg-rpg-gold/15 border-rpg-gold/40 text-rpg-gold'
                                            : 'bg-white/5 border-white/10 text-gray-300 hover:bg-white/10 hover:text-white'
                                    }`}
                                >
                                    <div className="w-8 h-8 rounded border border-white/20" style={{
                                        backgroundImage: SPRITES[item.id] ? `url("${pixelBufferToDataUrl(SPRITES[item.id], 64)}")` : 'none',
                                        backgroundSize: '100% 100%',
                                        imageRendering: 'pixelated'
                                    }}/>
                                    <span className="text-[9px] font-bold text-center leading-tight truncate w-full">{item.label}</span>
                                </button>
                            ))
                        ) : (
                            PALETTE[selectedCategory].items.map(item => {
                                const prop = WORLD_PROPS[item.id];
                                // We use a scaled down SVG or the WorldSprite for preview.
                                // For prefabs or non-props, we just show a box.
                                return (
                                <button
                                    key={item.id}
                                    onClick={() => {
                                        setSelectedAsset(item);
                                        setTool('place');
                                    }}
                                    className={`flex flex-col items-center p-2 rounded-lg border transition-all ${
                                        selectedAsset?.id === item.id && tool === 'place'
                                            ? 'bg-rpg-gold/15 border-rpg-gold/40 text-rpg-gold'
                                            : 'bg-white/5 border-white/10 text-gray-300 hover:bg-white/10 hover:text-white'
                                    }`}
                                >
                                    <div className="h-12 w-full flex items-center justify-center overflow-hidden mb-1 relative">
                                        {prop ? (
                                            <div style={{ position: 'absolute', transform: 'scale(0.8)' }}>
                                                <WorldSprite name={item.id} x={0} y={20} scale={1} shadow={false} />
                                            </div>
                                        ) : item.prefab ? (
                                            <Blocks size={20} className="text-gray-500 opacity-50" />
                                        ) : item.special ? (
                                            <MapPin size={20} className="text-gray-500 opacity-50" />
                                        ) : (
                                            <div className="w-6 h-6 border border-dashed border-gray-500"/>
                                        )}
                                    </div>
                                    <span className="text-[9px] font-bold text-center leading-tight w-full truncate">{item.label}</span>
                                </button>
                                );
                            })
                        )}
                    </div>
                </aside>

                {/* Canvas area */}
                <main 
                    className="flex-1 relative min-w-0 bg-[#0a0812] overflow-hidden"
                    onWheel={(e) => {
                        if (e.ctrlKey || e.metaKey) {
                            e.preventDefault();
                            setZoom(z => Math.min(3, Math.max(0.25, z - e.deltaY * 0.01)));
                        } else {
                            setPan(p => ({ x: p.x - e.deltaX, y: p.y - e.deltaY }));
                        }
                    }}
                    onMouseDown={(e) => {
                        if (e.button === 1 || (e.button === 0 && e.shiftKey)) {
                            e.preventDefault();
                            isPanning.current = true;
                        }
                    }}
                    onTouchStart={(e) => {
                        // Two finger touch is for pinch zooming, one finger for panning (or click if no move)
                        if (e.touches.length === 1) {
                            isPanning.current = true;
                        }
                    }}
                >
                    <WorldCanvas
                        map={map}
                        fit="contain"
                        zoom={zoom}
                        pan={pan}
                        showGrid={showGrid}
                        showObstacles={showObstacles}
                        className="absolute inset-0"
                        onCanvasClick={handleCanvasClick}
                        onCanvasMouseMove={handleCanvasMouseMove}
                        onScaleChange={s => { scaleRef.current = s; }}
                    >
                        {/* Selection outline with drag + resize handles */}
                        {selectedData && (
                            <SelectionOutline
                                item={selectedItem}
                                data={selectedData}
                                onBeginDrag={beginDrag}
                            />
                        )}

                        {/* Place-mode ghost — the actual sprite semi-transparent at the cursor. */}
                        {tool === 'place' && selectedAsset && hoverPos && (
                            <PlacementGhost asset={selectedAsset} pos={hoverPos} snapFn={snap} />
                        )}
                    </WorldCanvas>

                    {/* HUD */}
                    <div className="absolute bottom-3 left-3 flex items-center gap-2 bg-black/70 backdrop-blur border border-white/10 rounded-lg px-3 py-1.5 text-[11px] font-mono text-gray-400">
                        <span>{map.width}×{map.height}px</span>
                        <span className="text-white/20">·</span>
                        <span>tile {map.tileSize}px</span>
                        <span className="text-white/20">·</span>
                        <span>
                            {(map.decorations?.length || 0) + (map.instances?.length || 0)} objetos
                            {map.prefabs?.length ? ` · ${map.prefabs.length} prefabs` : ''}
                        </span>
                        {hoverPos && <>
                            <span className="text-white/20">·</span>
                            <span>{Math.round(hoverPos.x)}, {Math.round(hoverPos.y)}</span>
                        </>}
                    </div>
                </main>

                {/* Right properties panel */}
                <aside className="w-[280px] flex-shrink-0 border-l border-white/10 bg-[#0f0c17] flex flex-col overflow-hidden">
                    <div className="p-3 border-b border-white/10 bg-black/40 flex items-center gap-2">
                        {selectedData ? <Move size={14} className="text-rpg-gold"/> : <Info size={14} className="text-gray-500"/>}
                        <span className="text-xs font-bold uppercase tracking-wider text-gray-300">
                            {selectedData ? 'Selección' : 'Propiedades del mapa'}
                        </span>
                    </div>

                    <div className="flex-1 overflow-y-auto p-3 space-y-3">
                        {selectedData ? (
                            <SelectionProperties
                                item={selectedItem}
                                data={selectedData}
                                onPatch={patchSelected}
                            />
                        ) : (
                            <MapProperties map={map} onPatch={patch => updateMap(m => Object.assign(m, patch))} />
                        )}
                    </div>
                </aside>
            </div>

            {showImportText && (
                <ImportTextModal
                    onCancel={() => setShowImportText(false)}
                    onConfirm={importFromText}
                />
            )}
        </div>
    );
}

function ToolButton({ active, onClick, icon: Icon, label }) {
    return (
        <button
            onClick={onClick}
            title={label}
            className={`flex items-center justify-center w-8 h-8 rounded transition-all ${
                active ? 'bg-rpg-gold/25 text-rpg-gold' : 'text-gray-400 hover:text-white hover:bg-white/10'
            }`}
        >
            <Icon size={14}/>
        </button>
    );
}

function kindToKey(kind) {
    if (kind === 'decoration')   return 'decorations';
    if (kind === 'instance')     return 'instances';
    if (kind === 'portal')       return 'portals';
    if (kind === 'interactable') return 'interactables';
    if (kind === 'prefab')       return 'prefabs';
    return null;
}

function SelectionOutline({ item, data, onBeginDrag }) {
    if (!data) return null;
    let w, h, x, y;
    if (item.kind === 'instance') {
        const prop = WORLD_PROPS[data.type];
        w = (prop?.w || 40) * (data.scale || 1);
        h = (prop?.h || 40) * (data.scale || 1);
        x = data.x; y = data.y;
    } else if (item.kind === 'decoration') {
        w = data.width || data.size || 60;
        h = data.height || data.size || 60;
        x = data.x; y = data.y;
    } else if (item.kind === 'prefab') {
        const meta = PREFAB_META[data.name] || { w: 200, h: 200 };
        w = data.width || meta.w;
        h = data.height || meta.h;
        x = data.x; y = data.y;
    } else {
        w = data.width; h = data.height; x = data.x; y = data.y;
    }

    // Instances resize via `scale`, not width/height — one southeast handle
    // adjusts the scale property. Everything else with a real width/height gets
    // four corner handles for free rectangular resizing. Prefabs whose width/
    // height doesn't drive their actual footprint (e.g. shop_complete) still
    // get handles but they'll only affect the click bbox, not the sprites.
    const isInstance = item.kind === 'instance';
    // Only `sanctuary_pen` and `tree_line` actually respect width/height/length
    // in their prefab function — for the others, hide handles to avoid the
    // illusion that dragging them would resize the composition.
    const isPrefab = item.kind === 'prefab';
    const prefabResizable = isPrefab && (data.name === 'sanctuary_pen' || data.name === 'tree_line');
    const HANDLE = 12;

    return (
        <div
            className="absolute"
            style={{
                left: x, top: y, width: w, height: h,
                border: '2px solid #fedf8c',
                background: 'rgba(254,223,140,0.06)',
                zIndex: 99996,
                boxShadow: '0 0 12px rgba(254,223,140,0.5)',
                pointerEvents: 'auto',
                cursor: 'move',
            }}
            onMouseDown={onBeginDrag('move')}
            onTouchStart={onBeginDrag('move')}
        >
            {isInstance ? (
                <ResizeHandle style={{ right: -HANDLE / 2, bottom: -HANDLE / 2, cursor: 'nwse-resize' }} onMouseDown={onBeginDrag('scale')} onTouchStart={onBeginDrag('scale')} />
            ) : (isPrefab && !prefabResizable) ? null : (
                <>
                    <ResizeHandle style={{ left: -HANDLE / 2, top: -HANDLE / 2, cursor: 'nwse-resize' }} onMouseDown={onBeginDrag('nw')} onTouchStart={onBeginDrag('nw')} />
                    <ResizeHandle style={{ right: -HANDLE / 2, top: -HANDLE / 2, cursor: 'nesw-resize' }} onMouseDown={onBeginDrag('ne')} onTouchStart={onBeginDrag('ne')} />
                    <ResizeHandle style={{ left: -HANDLE / 2, bottom: -HANDLE / 2, cursor: 'nesw-resize' }} onMouseDown={onBeginDrag('sw')} onTouchStart={onBeginDrag('sw')} />
                    <ResizeHandle style={{ right: -HANDLE / 2, bottom: -HANDLE / 2, cursor: 'nwse-resize' }} onMouseDown={onBeginDrag('se')} onTouchStart={onBeginDrag('se')} />
                </>
            )}
        </div>
    );
}

function PlacementGhost({ asset, pos, snapFn }) {
    // Snap the ghost position so what you see is where it lands on click.
    const x = snapFn ? snapFn(pos.x) : pos.x;
    const y = snapFn ? snapFn(pos.y) : pos.y;

    // Prefabs: show a labeled bbox — we can't cheaply expand the composition
    // just for the cursor, and the operator sees the real prefab the moment
    // they click.
    if (asset.prefab) {
        const meta = PREFAB_META[asset.id] || { w: 200, h: 200, label: asset.id };
        return (
            <div
                className="absolute pointer-events-none"
                style={{
                    left: x, top: y, width: meta.w, height: meta.h, zIndex: 99997,
                    border: '2px dashed rgba(254,223,140,0.7)',
                    background: 'rgba(254,223,140,0.08)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
            >
                <span className="text-[10px] font-bold uppercase tracking-wider text-rpg-gold bg-black/40 px-2 py-0.5 rounded">
                    {meta.label}
                </span>
            </div>
        );
    }

    // Special zones: draw the outline that will land at click.
    if (asset.special) {
        const specSize = asset.id === '__portal' ? { w: 100, h: 60 }
            : asset.id === '__interactable' ? { w: 60, h: 60 }
            : { w: 200, h: 100 };
        return (
            <div
                className="absolute pointer-events-none"
                style={{
                    left: x, top: y, width: specSize.w, height: specSize.h, zIndex: 99997,
                    border: '2px dashed rgba(254,223,140,0.7)',
                    background: 'rgba(254,223,140,0.10)',
                }}
            />
        );
    }

    // Sprite/prop/instance: render the actual sprite semi-transparent so the
    // operator sees exactly what they're about to place.
    const prop = WORLD_PROPS[asset.id];
    if (!prop) {
        return (
            <div
                className="absolute pointer-events-none"
                style={{
                    left: x - 20, top: y - 20, width: 40, height: 40, zIndex: 99997,
                    border: '2px solid #fedf8c',
                    background: 'rgba(254,223,140,0.15)',
                }}
            />
        );
    }

    const scale = asset.defaults?.scale || 1;
    // WorldSprite anchors at bottom-center of (x, y). Placement stores (x, y)
    // as the top-left of a bounding box, and the DecorationsLayer computes
    // `cx = x + w/2, by = y + h`. Mirror that so the ghost lands where it
    // will land on click.
    const w = prop.w * scale;
    const h = prop.h * scale;
    const cx = x + w / 2;
    const by = y + h;
    return (
        <div className="absolute pointer-events-none" style={{ inset: 0, zIndex: 99997, opacity: 0.55 }}>
            <WorldSprite name={asset.id} x={cx} y={by} scale={scale} shadow={false} />
        </div>
    );
}

function ResizeHandle({ style, onMouseDown, onTouchStart }) {
    return (
        <div
            onMouseDown={onMouseDown}
            onTouchStart={onTouchStart}
            style={{
                position: 'absolute',
                width: 12, height: 12,
                background: '#fedf8c',
                border: '2px solid #0c0a14',
                borderRadius: 2,
                zIndex: 99997,
                pointerEvents: 'auto',
                ...style,
            }}
        />
    );
}

function ImportTextModal({ onCancel, onConfirm }) {
    // Uncontrolled textarea — we read its value at confirm time. Keeps typing
    // fast (no re-render per keystroke) and avoids "stale state at click"
    // problems when the user pastes fast.
    const taRef = useRef(null);
    return (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/70 backdrop-blur-sm p-6" onClick={onCancel}>
            <div
                className="w-full max-w-2xl bg-[#151220] border border-white/10 rounded-2xl shadow-2xl overflow-hidden"
                onClick={e => e.stopPropagation()}
            >
                <div className="px-5 py-3 border-b border-white/10 flex items-center justify-between">
                    <div className="text-sm font-bold text-white">Importar código MapData</div>
                    <button onClick={onCancel} className="text-gray-400 hover:text-white">
                        <X size={16}/>
                    </button>
                </div>
                <div className="p-5 space-y-3">
                    <div className="text-[11px] text-gray-400 leading-relaxed">
                        Pega el fragmento de <code className="text-rpg-gold">MapData.js</code> — puede ser <code className="text-rpg-gold">{'{ ... }'}</code>,
                        <code className="text-rpg-gold"> export const foo = {'{ ... }'}</code>, o el objeto completo con obstáculos, portales, decoraciones e instancias.
                    </div>
                    <textarea
                        ref={taRef}
                        defaultValue=""
                        placeholder="{ id: 'myMap', name: 'Mi Mapa', width: 1600, height: 1000, ... }"
                        rows={14}
                        className="w-full bg-black/60 border border-white/10 rounded-lg px-3 py-2 text-xs font-mono text-white outline-none focus:border-rpg-gold/50 resize-none"
                        autoFocus
                    />
                </div>
                <div className="px-5 py-3 border-t border-white/10 bg-black/30 flex items-center justify-end gap-2">
                    <button onClick={onCancel} className="px-3 py-1.5 rounded-lg text-xs font-bold text-gray-300 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10">
                        Cancelar
                    </button>
                    <button
                        onClick={() => onConfirm(taRef.current?.value || '')}
                        className="px-3 py-1.5 rounded-lg text-xs font-bold bg-rpg-gold/25 text-rpg-gold border border-rpg-gold/40 hover:bg-rpg-gold/35"
                    >
                        Importar
                    </button>
                </div>
            </div>
        </div>
    );
}

function NumField({ label, value, onChange, step = 1 }) {
    return (
        <label className="block">
            <span className="block text-[10px] uppercase tracking-wider font-bold text-gray-400 mb-1">{label}</span>
            <input
                type="number"
                step={step}
                value={value ?? ''}
                onChange={e => onChange(e.target.value === '' ? undefined : Number(e.target.value))}
                className="w-full bg-black/40 border border-white/10 rounded px-2 py-1 text-xs text-white outline-none focus:border-rpg-gold/50"
            />
        </label>
    );
}

function TextField({ label, value, onChange, placeholder }) {
    return (
        <label className="block">
            <span className="block text-[10px] uppercase tracking-wider font-bold text-gray-400 mb-1">{label}</span>
            <input
                type="text"
                value={value ?? ''}
                onChange={e => onChange(e.target.value)}
                placeholder={placeholder}
                className="w-full bg-black/40 border border-white/10 rounded px-2 py-1 text-xs text-white outline-none focus:border-rpg-gold/50"
            />
        </label>
    );
}

function SelectField({ label, value, onChange, options }) {
    return (
        <label className="block">
            <span className="block text-[10px] uppercase tracking-wider font-bold text-gray-400 mb-1">{label}</span>
            <select
                value={value || ''}
                onChange={e => onChange(e.target.value)}
                className="w-full bg-black/40 border border-white/10 rounded px-2 py-1 text-xs text-white outline-none focus:border-rpg-gold/50"
            >
                {options.map(o => <option key={o} value={o}>{o}</option>)}
            </select>
        </label>
    );
}

function SelectionProperties({ item, data, onPatch }) {
    if (!data) return null;
    return (
        <>
            <div className="text-[10px] font-bold uppercase tracking-wider text-gray-500 flex items-center gap-1">
                <span className="px-1.5 py-0.5 bg-white/10 rounded text-white/60">{item.kind}</span>
                <span>{data.type || data.label || item.kind}</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
                <NumField label="x" value={data.x} onChange={v => onPatch({ x: v })} />
                <NumField label="y" value={data.y} onChange={v => onPatch({ y: v })} />
            </div>
            {item.kind === 'instance' && (
                <NumField label="Escala" step={0.1} value={data.scale} onChange={v => onPatch({ scale: v })} />
            )}
            {(item.kind === 'portal' || item.kind === 'interactable' || item.kind === 'decoration') && (
                <div className="grid grid-cols-2 gap-2">
                    <NumField label="width" value={data.width} onChange={v => onPatch({ width: v })} />
                    <NumField label="height" value={data.height} onChange={v => onPatch({ height: v })} />
                </div>
            )}
            {item.kind === 'portal' && (
                <>
                    <SelectField label="Destino" value={data.targetMap} onChange={v => onPatch({ targetMap: v })} options={KNOWN_MAP_IDS} />
                    <div className="grid grid-cols-2 gap-2">
                        <NumField label="targetX" value={data.targetX} onChange={v => onPatch({ targetX: v })} />
                        <NumField label="targetY" value={data.targetY} onChange={v => onPatch({ targetY: v })} />
                    </div>
                    <TextField label="Etiqueta" value={data.label} onChange={v => onPatch({ label: v })} />
                </>
            )}
            {item.kind === 'interactable' && (
                <>
                    <TextField label="Etiqueta" value={data.label} onChange={v => onPatch({ label: v })} />
                    <TextField label="Target (shop/sanctuary/...)" value={data.target} onChange={v => onPatch({ target: v })} />
                    <NumField label="Radio" value={data.radius} onChange={v => onPatch({ radius: v })} />
                    <label className="block">
                        <span className="block text-[10px] uppercase tracking-wider font-bold text-gray-400 mb-1">Flavor</span>
                        <textarea
                            value={data.flavor || ''}
                            onChange={e => onPatch({ flavor: e.target.value })}
                            rows={3}
                            className="w-full bg-black/40 border border-white/10 rounded px-2 py-1 text-xs text-white outline-none focus:border-rpg-gold/50 resize-none"
                        />
                    </label>
                </>
            )}
            {item.kind === 'decoration' && data.type === 'rect' && (
                <>
                    <TextField label="Color (hex/rgb)" value={data.color} onChange={v => onPatch({ color: v })} />
                    <NumField label="Opacidad" step={0.1} value={data.opacity} onChange={v => onPatch({ opacity: v })} />
                    <NumField label="z-index" value={data.z} onChange={v => onPatch({ z: v })} />
                </>
            )}
            {item.kind === 'prefab' && (
                <>
                    <div className="text-[10px] text-gray-500 leading-snug">
                        {PREFAB_META[data.name]?.label || data.name} — este prefab
                        expande a varios sprites al renderizar. La caja de arriba
                        es su ancla; edita los parámetros abajo para regenerar.
                    </div>
                    {(PREFAB_META[data.name]?.params || []).map(p => {
                        if (p === 'accent') return (
                            <TextField key={p} label="Color acento" value={data.accent} onChange={v => onPatch({ accent: v })} />
                        );
                        return <NumField key={p} label={p} value={data[p]} onChange={v => onPatch({ [p]: v })} />;
                    })}
                </>
            )}
            <div className="pt-2 border-t border-white/10 text-[10px] text-gray-500">
                Supr: eliminar · Cmd/Ctrl+Z: deshacer
            </div>
        </>
    );
}

function MapProperties({ map, onPatch }) {
    return (
        <>
            <TextField label="ID del mapa" value={map.id} onChange={v => onPatch({ id: v })} />
            <TextField label="Nombre visible" value={map.name} onChange={v => onPatch({ name: v })} />
            <div className="grid grid-cols-2 gap-2">
                <NumField label="Ancho (px)" value={map.width} onChange={v => onPatch({ width: v })} />
                <NumField label="Alto (px)" value={map.height} onChange={v => onPatch({ height: v })} />
            </div>
            <NumField label="Tile size" value={map.tileSize} onChange={v => onPatch({ tileSize: v })} />
            <TextField label="Base color" value={map.baseColor} onChange={v => onPatch({ baseColor: v })} />
            <TextField label="className" value={map.className} onChange={v => onPatch({ className: v })} placeholder="medieval-town-bg" />
            <div className="grid grid-cols-2 gap-2">
                <NumField label="Spawn x" value={map.spawn?.x} onChange={v => onPatch({ spawn: { ...map.spawn, x: v } })} />
                <NumField label="Spawn y" value={map.spawn?.y} onChange={v => onPatch({ spawn: { ...map.spawn, y: v } })} />
            </div>
            <div className="pt-2 border-t border-white/10 text-[10px] text-gray-500">
                Selecciona un elemento del mapa para editarlo. Usa la paleta para colocar assets nuevos.
            </div>
        </>
    );
}
