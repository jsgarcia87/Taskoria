// Runtime layered avatar: body + hair + class outfit parts, with equipped
// cosmetics replacing parts slot by slot (data/outfitSlots.js).
//
// Parts use the Forja's compact format: { b:[x0,y0,w,h], l:{char:hex}, r:[rows] }
// with '.' as empty. The output is a regular blueprint ({ paleta, roles,
// blueprint }) so ModernPixelAvatar renders and recolours it like any other.
import bodyParts from '../data/body_parts.json';
import { Z_ORDER, HAND_ROWS } from '../data/outfitSlots';

const K = '#000000';
const BASE_SKIN = '#ffdbac';
const SKIN_TONES = ['#ffdbac', '#f7d5b3', '#f0b374', '#efb677', '#eeb677'];
const LETTER_POOL = 'BCDFGHIJKLMNOPQRSTUVWXYZbcdefghijklmnopqrstuvwxyz0123456789'.split('');
const BODY = { male: 'base_body_male', female: 'base_body_female' };
const ARMS = { relajados: 'arms_relaxed', ambos_flex: 'arms_both_flex', izq_flex: 'arm_left_flex' };
const HAIR = { pelo_m1: 'hair_male_1', pelo_f1: 'hair_female_1' };

const partCache = new WeakMap();

export const decodePart = (part) => {
    if (!part || !Array.isArray(part.b) || !Array.isArray(part.r)) return null;
    if (partCache.has(part)) return partCache.get(part);
    const out = new Array(4096).fill(null);
    const [x0, y0] = part.b;
    part.r.forEach((row, dy) => {
        for (let dx = 0; dx < row.length; dx++) {
            const ch = row[dx];
            const x = x0 + dx, y = y0 + dy;
            if (ch !== '.' && x >= 0 && x < 64 && y >= 0 && y < 64) out[y * 64 + x] = part.l[ch] || null;
        }
    });
    partCache.set(part, out);
    return out;
};

// A Pixel Studio creation stores sparse [{x,y,c}] pixels; turn it into a part.
export const partFromPixels = (pixels) => {
    let px = pixels;
    if (Array.isArray(px) && Array.isArray(px[0])) px = px[0];
    if (!Array.isArray(px) || !px.length) return null;
    const pts = px.filter(p => p && p.c && p.c !== 'transparent' && p.x >= 0 && p.x < 64 && p.y >= 0 && p.y < 64);
    if (!pts.length) return null;
    const x0 = Math.min(...pts.map(p => p.x)), y0 = Math.min(...pts.map(p => p.y));
    const x1 = Math.max(...pts.map(p => p.x)), y1 = Math.max(...pts.map(p => p.y));
    const grid = Array.from({ length: y1 - y0 + 1 }, () => new Array(x1 - x0 + 1).fill('.'));
    const legend = {}, inv = {};
    pts.forEach(p => {
        const c = p.c.toLowerCase();
        if (!inv[c]) { inv[c] = LETTER_POOL[Object.keys(inv).length] || '?'; legend[inv[c]] = c; }
        grid[p.y - y0][p.x - x0] = inv[c];
    });
    return { b: [x0, y0, x1 - x0 + 1, y1 - y0 + 1], l: legend, r: grid.map(r => r.join('')) };
};

const hexHue = (hex) => {
    const n = parseInt(hex.slice(1), 16);
    const r = n >> 16, g = (n >> 8) & 255, b = n & 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b), d = max - min;
    if (!d) return { h: 0, s: 0 };
    const h = max === r ? ((g - b) / d + 6) % 6 : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
    return { h: h * 60, s: d / max };
};

// Same rule as the Forja export: the player-tintable outfit ramp is the torso's
// dominant colour plus the torso tones of the same hue family.
const torsoRamp = (flat, from) => {
    const count = {};
    for (let i = 0; i < 4096; i++) {
        const c = flat[i];
        if (from[i] === 'torso' && c && c !== K && !SKIN_TONES.includes(c)) count[c] = (count[c] || 0) + 1;
    }
    const colors = Object.keys(count).sort((a, b) => count[b] - count[a]);
    if (!colors.length) return [];
    const base = hexHue(colors[0]);
    return colors.filter(c => {
        const t = hexHue(c), dh = Math.min(Math.abs(t.h - base.h), 360 - Math.abs(t.h - base.h));
        return base.s < 0.12 ? t.s < 0.12 : (t.s >= 0.12 && dh < 22 && Math.abs(t.s - base.s) < 0.35);
    });
};

/**
 * @param {object} outfit      { parts: {slot: part}, appearance?: { gender, armPose, hairId, hair } }
 * @param {object} cosmetics   { slot: part | null } — a part replaces the class part, null hides the slot
 * @returns {{ paleta, roles, blueprint }}
 */
export const composeAvatar = (outfit, cosmetics = {}) => {
    const app = outfit.appearance || {};
    const layers = {
        cuerpo_base: decodePart(bodyParts[BODY[app.gender] || BODY.male]),
        brazos: decodePart(bodyParts[ARMS[app.armPose] || ARMS.relajados]),
        pelo: app.hairId === 'ninguno' ? null
            : app.hair ? decodePart(app.hair)
            : decodePart(bodyParts[HAIR[app.hairId] || HAIR.pelo_m1]),
    };
    for (const [slot, part] of Object.entries(outfit.parts || {})) layers[slot] = decodePart(part);
    for (const [slot, part] of Object.entries(cosmetics || {})) layers[slot] = part ? decodePart(part) : null;
    if (app.gender === 'female') layers.barba = null; // a beard belongs to the male body only

    const flat = new Array(4096).fill(null);
    const from = new Array(4096).fill(null);
    for (const slot of Z_ORDER) {
        const arr = layers[slot];
        if (!arr) continue;
        for (let i = 0; i < 4096; i++) if (arr[i]) { flat[i] = arr[i]; from[i] = slot; }
    }
    // The weapon is drawn on top; where it crosses a relaxed hand, put the hand (or its
    // glove) back over it so the fist closes on the grip.
    if ((app.armPose || 'relajados') === 'relajados' && layers.arma && layers.brazos) {
        for (let y = HAND_ROWS[0]; y <= HAND_ROWS[1]; y++) {
            for (let x = 0; x < 64; x++) {
                const i = y * 64 + x;
                if (!layers.arma[i] || !layers.brazos[i] || from[i] !== 'arma') continue;
                const glove = layers.brazaletes && layers.brazaletes[i];
                flat[i] = glove || layers.brazos[i];
                from[i] = glove ? 'brazaletes' : 'brazos';
            }
        }
    }

    const ramp = torsoRamp(flat, from);
    const paleta = { ' ': 'transparent', A: K };
    const roles = { skin: [], hair: [], primary: [] };
    const keyToLetter = {};
    const pool = LETTER_POOL.slice();
    const claim = (key, letter, color, role) => {
        keyToLetter[key] = letter; paleta[letter] = color;
        if (roles[role]) roles[role].push(letter);
    };
    claim(`skin|${BASE_SKIN}`, 'E', BASE_SKIN, 'skin');
    const roleOf = (slot, c) => {
        if (slot === 'pelo' || slot === 'barba') return 'hair';
        if ((slot === 'cuerpo_base' || slot === 'brazos') && SKIN_TONES.includes(c)) return 'skin';
        if (slot === 'torso' && ramp.includes(c)) return 'primary';
        return 'other';
    };
    const blueprint = [];
    for (let y = 0; y < 64; y++) {
        let row = '';
        for (let x = 0; x < 64; x++) {
            const i = y * 64 + x, c = flat[i];
            if (!c) { row += ' '; continue; }
            if (c === K) { row += 'A'; continue; }
            const role = roleOf(from[i], c);
            const key = `${role}|${c}`;
            if (!keyToLetter[key]) {
                const L = pool.shift();
                if (!L) { row += ' '; continue; }
                claim(key, L, c, role);
            }
            row += keyToLetter[key];
        }
        blueprint.push(row);
    }
    // Ramps recolour relative to their first letter: lead with the dominant torso tone.
    roles.primary = ramp.map(c => keyToLetter[`primary|${c}`]).filter(Boolean);
    if (!roles.hair.length) delete roles.hair;
    if (!roles.primary.length) delete roles.primary;
    return { paleta, roles, blueprint };
};
