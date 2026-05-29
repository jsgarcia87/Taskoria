import React, { useEffect, useRef, useState, useMemo } from 'react';
import blueprintsData from '../../data/character_blueprints.json';

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

const ModernPixelAvatar = ({ type = 'warrior', scale = 1, headOnly = false, customColors = null }) => {
    const canvasRef = useRef(null);
    const animationFrameRef = useRef(null);
    const customColorsStr = customColors ? JSON.stringify(customColors) : null;
    
    // We use useState to hold the pre-rendered 64x64 cache
    const [cachedImage, setCachedImage] = useState(null);

    // 1. Static Initial Render Pass (Offscreen Cache)
    useEffect(() => {
        const mappedType = TYPE_MAP[type] || 'fighter';
        const config = blueprintsData[mappedType] || blueprintsData['fighter'];
        const { blueprint } = config;
        const paleta = { ...config.paleta };
        
        if (customColorsStr) {
            const parsedColors = JSON.parse(customColorsStr);
            const baseSkin = config.paleta['E'] || '#ffdbac'; 
            
            // Apply custom palette overrides
            if (parsedColors) {
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
                if (parsedColors.hair) {
                    if (paleta['J']) paleta['J'] = parsedColors.hair;
                }
            }
        }

        // Render purely 1x1 pixels iteratively inside a 64x64 isolated canvas
        const offCanvas = document.createElement('canvas');
        offCanvas.width = GRID_SIZE;
        offCanvas.height = GRID_SIZE;
        const oCtx = offCanvas.getContext('2d');

        for (let y = 0; y < blueprint.length; y++) {
            const row = blueprint[y];
            if (!row) continue;
            for (let x = 0; x < row.length; x++) {
                const char = row[x];
                if (char === ' ') continue;
                const color = paleta[char];
                if (color && color !== 'transparent') {
                    oCtx.fillStyle = color;
                    oCtx.fillRect(x, y, 1, 1);
                }
            }
        }
        
        setCachedImage(offCanvas);
    }, [type, customColorsStr]);

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

export default ModernPixelAvatar;
