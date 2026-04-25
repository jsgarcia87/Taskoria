import React, { useEffect, useRef, useState } from 'react';
import petBlueprints from '../../data/pet_blueprints.json';

const S_BASE = 1.8;
const DEFAULT_GRID = 32;

const shadeHex = (color, percent) => {
    if (!color || typeof color !== 'string' || !color.startsWith('#')) return color;
    try {
        let f = parseInt(color.slice(1), 16), t = percent < 0 ? 0 : 255, p = percent < 0 ? percent * -1 : percent;
        let R = f >> 16, G = f >> 8 & 0x00FF, B = f & 0x0000FF;
        return "#" + (0x1000000 + (Math.round((t - R) * p) + R) * 0x10000 + (Math.round((t - G) * p) + G) * 0x100 + (Math.round((t - B) * p) + B)).toString(16).slice(1);
    } catch(e) { return color; }
}

const ModernPixelPet = ({ type = 'slime', scale = 1, customColors = null, isHatching = false }) => {
    const canvasRef = useRef(null);
    const animationFrameRef = useRef(null);
    const [cachedImage, setCachedImage] = useState(null);

    const config = petBlueprints[type] || petBlueprints['slime'];
    const gridSize = config.gridSize || DEFAULT_GRID;

    // Normalización: Si es un diseño de 64x64, multiplicamos la escala visual por 0.5 
    // para que sea proporcional a los de 32x32 en la UI.
    const normalizedScale = gridSize === 64 ? scale * 0.5 : scale;

    // 1. Static Initial Render Pass (Offscreen Cache)
    useEffect(() => {
        const { blueprint } = config;
        const paleta = { ...config.paleta };
        
        if (customColors) {
            // Lógica de recolor mejorada para diseños high-fidelity
            if (customColors.primary) {
                const p = customColors.primary;
                // Mapeo inteligente por tipo o por letras comunes
                // Para 32x32 (Legacy): A, B, C
                // Para 64x64 (Nuevos): C/D (Dragon), B/C (Wolf), D (Lion)
                
                if (type.includes('dragon')) {
                    paleta['C'] = p;
                    paleta['D'] = shadeHex(p, -0.3);
                    paleta['B'] = shadeHex(p, -0.1);
                } else if (type.includes('wolf')) {
                    paleta['B'] = p;
                    paleta['C'] = shadeHex(p, -0.3);
                    paleta['D'] = shadeHex(p, 0.2);
                } else if (type.includes('lion')) {
                    paleta['D'] = p;
                    paleta['C'] = shadeHex(p, -0.3);
                    paleta['B'] = shadeHex(p, -0.1);
                } else {
                    // Fallback para Slime y otros 32x32
                    paleta['A'] = p;
                    paleta['B'] = shadeHex(p, -0.2);
                    paleta['C'] = shadeHex(p, -0.4);
                }
            }
        }

        const offCanvas = document.createElement('canvas');
        offCanvas.width = gridSize;
        offCanvas.height = gridSize;
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
    }, [type, JSON.stringify(customColors)]);

    // 2. Animation Render Loop
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas || !cachedImage) return;
        const ctx = canvas.getContext('2d');
        const S = S_BASE * normalizedScale;

        ctx.imageSmoothingEnabled = false;

        let t = 0;
        const loop = () => {
            if (!canvasRef.current || !cachedImage) return;
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            // Subtle breathing/floating for pets
            const bob = isHatching ? Math.sin(t * 0.2) * (2 * S) : Math.sin(t * 0.05) * (1.5 * S);
            const squash = isHatching ? Math.abs(Math.sin(t * 0.2)) * 0.1 : Math.sin(t * 0.03) * 0.06;

            // Use a base unit that represents the model size at current scale
            const modelSize = gridSize * S;
            const drawW = modelSize * (1 + squash);
            const drawH = modelSize * (1 - squash);
            
            // Centering logic: (CanvasSize - DrawSize) / 2
            const offsetX = (canvas.width - drawW) / 2;
            // For Y, we anchor at the bottom but lift it slightly with 'bob'
            const offsetY = (canvas.height - drawH) / 2 + bob;

            ctx.drawImage(
                cachedImage, 
                0, 0, gridSize, gridSize,
                offsetX, offsetY, drawW, drawH
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
    }, [cachedImage, normalizedScale, isHatching, gridSize]);

    // Canvas buffer: ensure the canvas is 40% larger than the base model to accommodate squash/stretch/bob
    // Usamos normalizedScale para el renderizado real pero mantenemos S_BASE para el espacio
    const canvasSize = gridSize * S_BASE * normalizedScale * 1.4;
    const divSize = gridSize * S_BASE * normalizedScale;

    return (
        <div 
            className="inline-flex items-center justify-center relative pointer-events-none"
            style={{ 
                width: divSize, 
                height: divSize,
                overflow: 'visible'
            }}
        >
            <canvas
                ref={canvasRef}
                width={canvasSize}
                height={canvasSize}
                className="absolute"
                style={{ 
                    imageRendering: 'pixelated',
                    // Centrado perfecto de la base mayor del canvas sobre el contenedor
                    marginLeft: -(canvasSize - divSize) / 2,
                    marginTop: -(canvasSize - divSize) / 2
                }}
            />
        </div>
    );
};

export default ModernPixelPet;
