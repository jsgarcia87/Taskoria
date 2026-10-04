// Dev-time sanity checks for a map. Pure JS (no JSX) so it also runs from Node.
// Catches the classes of bugs that silently break the world: unreachable
// portals, missing floor tiles, fields the engine never reads and decorations
// without a renderer.
import { FLOOR_TILES, SPRITE_REGISTRY } from '../../../data/sprite-registry.js';

// Movement is clamped this far inside the map edge (TILE_SIZE in PlayableWorld).
const EDGE = 40;

// Decoration types handled by DecorationsLayer in PlayableWorld.
const RENDERED_TYPES = new Set([
    'banner', 'bar_counter', 'barrel', 'bartender_npc', 'bench', 'bush', 'cobble_patch', 'crack', 'crate',
    'critter', 'emoji', 'fence', 'fire', 'flowers', 'hay', 'lamp', 'lantern_glow', 'ledgar_npc', 'market_stall',
    'mug', 'oak_tree', 'pillar', 'pine_tree', 'planter', 'puddle', 'rect', 'rug', 'shop_building', 'sign',
    'sprite', 'statue', 'stool', 'table', 'text', 'throne', 'torch', 'tree', 'vendor_npc', 'weapon_rack', 'well',
    'wall', 'light_shaft',
]);

const UNREAD_FIELDS = ['bgColor', 'ambientLight'];

export function validateMap(map) {
    const issues = [];
    if (!map) return issues;

    if (map.tileSprite && !FLOOR_TILES[map.tileSprite]) {
        issues.push(`floor tile "${map.tileSprite}" does not exist (available: ${Object.keys(FLOOR_TILES).join(', ')})`);
    }
    if (!map.tileSprite && !map.baseColor && !map.className) {
        issues.push('no tileSprite, baseColor or className — the map renders on black');
    }
    for (const field of UNREAD_FIELDS) {
        if (field in map) issues.push(`"${field}" is not read by the engine`);
    }

    const blocked = (x, y) => (map.obstacles || []).some(o =>
        x > o.x && x < o.x + o.width && y > o.y && y < o.y + o.height);
    const walkable = (x, y) =>
        x >= EDGE && x <= map.width - EDGE && y >= EDGE && y <= map.height - EDGE && !blocked(x, y);

    for (const p of map.portals || []) {
        let reachable = false;
        for (let x = p.x + 2; x < p.x + p.width && !reachable; x += 4) {
            for (let y = p.y + 2; y < p.y + p.height && !reachable; y += 4) {
                if (walkable(x, y)) reachable = true;
            }
        }
        if (!reachable) {
            issues.push(`portal "${p.label || p.targetMap}" cannot be reached — it sits inside obstacles or beyond the walkable edge`);
        }
    }

    for (const d of map.decorations || []) {
        if (d.type === 'sprite') {
            if (!SPRITE_REGISTRY[d.name]) issues.push(`sprite "${d.name}" is not in the sprite registry`);
        } else if (!RENDERED_TYPES.has(d.type)) {
            issues.push(`decoration type "${d.type}" has no renderer`);
        }
    }

    return issues;
}
