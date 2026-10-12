import React, { useEffect, useRef, useState, useMemo } from 'react';
import blueprintsData from '../../data/character_blueprints.json';
import { fetchCustomBlueprints, getCustomBlueprintsCache } from '../../utils/blueprints.js';
import { composeAvatar } from '../../utils/avatarLayers.js';

const S_BASE = 1.8;
const GRID_SIZE = 64;

const TYPE_MAP = {
    'warrior': 'fighter',
    'paladin': 'paladin',
    'mage': 'wizard',
    'rogue': 'rogue',
    'cleric': 'cleric',
    'ranger': 'ranger',
    'barbarian': 'barbarian',
    'bard': 'bard',
    'druid': 'druid',
    'monk': 'monk',
    'necromancer': 'necromancer',
    'antipaladin': 'antipaladin',
    'sorcerer': 'sorcerer',
    'scout': 'scout',
    'fighter': 'fighter',
    'wizard': 'wizard',
    'dragon': 'antipaladin', // Boss fallback
};

const shadeHex = (color, percent) => {
    if (!color || typeof color !== 'string' || !color.startsWith('#')) return color;
    try {
        let f = parseInt(color.slice(1), 16), t = percent < 0 ? 0 : 255, p = percent < 0 ? percent * -1 : percent;
        let R = f >> 16, G = f >> 8 & 0x00FF, B = f & 0x0000FF;
        return "#" + (0x1000000 + (Math.round((t - R) * p) + R) * 0x10000 + (Math.round((t - G) * p) + G) * 0x100 + (Math.round((t - B) * p) + B)).toString(16).slice(1);
    } catch(e) { return color; }
}

const hexToHsl = (hex) => {
    const n = parseInt(hex.slice(1), 16);
    const r = (n >> 16) / 255, g = ((n >> 8) & 255) / 255, b = (n & 255) / 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    const l = (max + min) / 2;
    if (max === min) return [0, 0, l];
    const d = max - min;
    const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    const h = max === r ? (g - b) / d + (g < b ? 6 : 0) : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
    return [h / 6, s, l];
};

const hslToHex = (h, s, l) => {
    const f = (n) => {
        const k = (n + h * 12) % 12;
        const a = s * Math.min(l, 1 - l);
        const c = l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1));
        return Math.round(c * 255).toString(16).padStart(2, '0');
    };
    return `#${f(0)}${f(8)}${f(4)}`;
};

// Recolors a ramp of palette letters toward `target`: the first letter is the
// reference tone and takes the target colour; the others keep their lightness
// offset from it, so shading reads the same in any colour.
const retintRamp = (paleta, letters, target) => {
    const valid = (letters || []).filter(L => /^#[0-9a-f]{6}$/i.test(paleta[L] || ''));
    if (!valid.length || !/^#[0-9a-f]{6}$/i.test(target)) return {};
    const [th, ts, tl] = hexToHsl(target);
    const refL = hexToHsl(paleta[valid[0]])[2];
    const out = {};
    valid.forEach(L => {
        const l = Math.min(0.97, Math.max(0.03, tl + hexToHsl(paleta[L])[2] - refL));
        out[L] = L === valid[0] ? target : hslToHex(th, ts, l);
    });
    return out;
};

// `cosmetics`: { slot: { id, part } | null } from character.cosmetics. Only used
// when the class has layered parts published from the Forja.
const ModernPixelAvatar = ({ type = 'warrior', scale = 1, headOnly = false, customColors = null, cosmetics = null }) => {
    const canvasRef = useRef(null);
    const animationFrameRef = useRef(null);
    const customColorsStr = customColors ? JSON.stringify(customColors) : null;
    const cosmeticsKey = cosmetics ? Object.entries(cosmetics).map(([s, c]) => `${s}:${c ? c.id : '-'}`).sort().join('|') : '';
    
    // We use useState to hold the pre-rendered 64x64 cache
    const [cachedImage, setCachedImage] = useState(null);
    const [dbBlueprints, setDbBlueprints] = useState(getCustomBlueprintsCache());

    useEffect(() => {
        if (!getCustomBlueprintsCache()) {
            fetchCustomBlueprints().then(bp => {
                setDbBlueprints(bp);
            });
        }
    }, []);

    // 1. Static Initial Render Pass (Offscreen Cache)
    useEffect(() => {
        const mappedType = TYPE_MAP[type] || 'fighter';
        const customBp = dbBlueprints?.characters?.[mappedType.toLowerCase()];
        const liveBp = dbBlueprints?.liveClasses?.[mappedType];
        // Priority: a Forja design explicitly marked "En el juego" (validated
        // 64×64 frame) > the shipped blueprint > other DB designs. Generic DB
        // designs only fill in types the JSON doesn't define — they never
        // silently replace a shipped avatar (the old "broken heroes" bug).
        let config = liveBp || blueprintsData[mappedType] || customBp || blueprintsData['fighter'];
        if (liveBp?.parts) {
            // Layered class: compose body + outfit parts + equipped cosmetics.
            const overrides = Object.fromEntries(Object.entries(cosmetics || {}).map(([slot, c]) => [slot, c ? c.part : null]));
            config = composeAvatar({ parts: liveBp.parts, appearance: liveBp.appearance }, overrides);
        }
        const blueprint = config.blueprint;
        const pixels = config.pixels;
        const paleta = config.paleta ? { ...config.paleta } : {};

        if (customColorsStr && config.paleta) {
            const parsedColors = JSON.parse(customColorsStr);
            if (parsedColors) {
                if (config.roles) {
                    // Blueprints declare which palette letters are skin / hair /
                    // primary outfit. Each ramp is shifted as a whole so its
                    // highlights and shadows survive the recolor.
                    const ROLE_COLOR = { skin: parsedColors.skin, hair: parsedColors.hair, primary: parsedColors.primary };
                    Object.entries(config.roles).forEach(([role, letters]) => {
                        if (ROLE_COLOR[role]) Object.assign(paleta, retintRamp(config.paleta, letters, ROLE_COLOR[role]));
                    });
                } else {
                    // Legacy contract for blueprints without `roles`
                    // (e.g. older DB designs): E = skin, B/C/D = outfit, J = hair.
                    const baseSkin = config.paleta['E'] || '#ffdbac';
                    if (parsedColors.skin) {
                        Object.keys(paleta).forEach(k => {
                            if (paleta[k].toLowerCase() === baseSkin.toLowerCase()) paleta[k] = parsedColors.skin;
                        });
                    }
                    if (parsedColors.primary) {
                        paleta['B'] = parsedColors.primary;
                        paleta['C'] = shadeHex(parsedColors.primary, -0.2);
                        paleta['D'] = shadeHex(parsedColors.primary, -0.4);
                    }
                    if (parsedColors.hair && paleta['J']) paleta['J'] = parsedColors.hair;
                }
            }
        }

        // Render purely 1x1 pixels iteratively inside a 64x64 isolated canvas
        const offCanvas = document.createElement('canvas');
        offCanvas.width = GRID_SIZE;
        offCanvas.height = GRID_SIZE;
        const oCtx = offCanvas.getContext('2d');

        if (Array.isArray(blueprint)) {
            for (let y = 0; y < blueprint.length && y < GRID_SIZE; y++) {
                const row = blueprint[y];
                if (!row) continue;
                for (let x = 0; x < row.length && x < GRID_SIZE; x++) {
                    const char = row[x];
                    if (char === ' ') continue;
                    const color = paleta[char];
                    if (color && color !== 'transparent') {
                        oCtx.fillStyle = color;
                        oCtx.fillRect(x, y, 1, 1);
                    }
                }
            }
        } else if (pixels) {
            // Custom studio designs store a sparse [{x,y,c}] frame. Draw each
            // painted pixel at its authored grid position (no re-centering —
            // headOnly cropping depends on the sprite's absolute placement).
            let pxArr = pixels;
            if (Array.isArray(pxArr) && Array.isArray(pxArr[0])) pxArr = pxArr[0];
            if (Array.isArray(pxArr)) {
                for (const p of pxArr) {
                    if (!p || p.c === 'transparent') continue;
                    const { x, y, c } = p;
                    if (x == null || y == null || !c) continue;
                    if (x >= 0 && x < GRID_SIZE && y >= 0 && y < GRID_SIZE) {
                        oCtx.fillStyle = c;
                        oCtx.fillRect(x, y, 1, 1);
                    }
                }
            }
        }

        setCachedImage(offCanvas);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- cosmeticsKey stands in for `cosmetics`
    }, [type, customColorsStr, dbBlueprints, cosmeticsKey]);

    // 2. Ultra-Fast Render Loop 
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas || !cachedImage) return;
        const ctx = canvas.getContext('2d');
        const S = S_BASE * scale;

        // Force crisp pixel scaling logic globally per-frame
        ctx.imageSmoothingEnabled = false;

        let t = 0;
        const loop = () => {
            if (!canvasRef.current || !cachedImage) return;
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            const bob = headOnly ? 0 : Math.sin(t * 0.07) * (1.2 * S) | 0;

            // Draw the FULL 64x64 cached sprite - no distortion!
            // We'll use CSS positioning (top/left) to "crop" to the head for headOnly mode.
            ctx.drawImage(
                cachedImage, 
                0, 0, GRID_SIZE, GRID_SIZE,
                0, bob, canvas.width, canvas.height
            );

            t++;
            animationFrameRef.current = requestAnimationFrame(loop);
        };

        loop();

        return () => {
            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current);
            }
        };
    }, [cachedImage, scale, headOnly]);

    const S = S_BASE * scale;
    
    // UI Layout Placeholder Size - More compact to prevent grid overlap
    const wrapperWidth = headOnly ? 14 * S : 22 * S;
    const wrapperHeight = headOnly ? 14 * S : 48 * S;

    // Standard 1:1 zoom for most views, high scale will do the heavy lifting for portraits
    const zoomFactor = 1.0;
    const canvasActualSize = GRID_SIZE * S * zoomFactor;

    // Mathematical Centering: Stably position based on mode
    const posX = (wrapperWidth / 2) - (32 * S);
    const posY = headOnly 
        ? (wrapperHeight / 2) - (13 * S) 
        : (wrapperHeight / 2) - (32 * S);

    const mappedType = TYPE_MAP[type] || 'fighter';
    const config = blueprintsData[mappedType] || blueprintsData['fighter'];

    return (
        <div 
            className={`inline-block relative pointer-events-none ${headOnly ? 'overflow-hidden rounded-lg' : ''}`}
            style={{ 
                width: wrapperWidth, 
                height: wrapperHeight
            }}
        >
            <canvas
                ref={canvasRef}
                width={canvasActualSize}
                height={canvasActualSize}
                style={{ 
                    position: 'absolute',
                    top: posY,
                    left: posX,
                    imageRendering: 'pixelated'
                }}
            />
        </div>
    );
};

// Memoized: skips re-render when props are unchanged. Avatars appear in lists
// and in frequently-re-rendering parents; without this each parent render
// re-runs the component (and its effect-dependency recompute) needlessly.
export default React.memo(ModernPixelAvatar);
