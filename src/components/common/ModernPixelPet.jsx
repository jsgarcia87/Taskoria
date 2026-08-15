import React, { useEffect, useRef, useState } from 'react';
import petBlueprints from '../../data/pet_blueprints.json';
import { fetchCustomBlueprints, getCustomBlueprintsCache } from '../../utils/blueprints.js';

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

const LEGACY_PET_TYPES = { dragon: 'emberwyrm_young', dragon_fire: 'emberwyrm', dragon_frost: 'frostcoil', dragon_egg: 'slime' };

const ModernPixelPet = ({ type: rawType = 'slime', scale = 1, size = null, customColors = null, isHatching = false }) => {
    const type = LEGACY_PET_TYPES[rawType] || rawType;
    const canvasRef = useRef(null);
    const animationFrameRef = useRef(null);
    const [cachedImage, setCachedImage] = useState(null);
    const [dbBlueprints, setDbBlueprints] = useState(getCustomBlueprintsCache());

    useEffect(() => {
        if (!getCustomBlueprintsCache()) {
            fetchCustomBlueprints().then(bp => {
                setDbBlueprints(bp);
            });
        }
    }, []);

    const customBp = dbBlueprints?.pets?.[type.toLowerCase()];
    const config = petBlueprints[type] || customBp || petBlueprints['slime'];
    const gridSize = config.gridSize || DEFAULT_GRID;

    const isContained = !!size;

    const normalizedScale = gridSize === 64 ? scale * 0.5 : scale;
    const S = S_BASE * normalizedScale;
    const nativeDiv = gridSize * S;
    const nativeCanvas = nativeDiv * 1.4;

    const CONTAIN_RATIO = 0.82;
    const renderCanvas = isContained ? Math.ceil(size) : Math.ceil(nativeCanvas);
    const renderModel = isContained ? size * CONTAIN_RATIO : nativeDiv;

    useEffect(() => {
        const blueprint = config.blueprint;
        const paleta = config.paleta ? { ...config.paleta } : null;
        const pixels = config.pixels;

        if (customColors?.primary && paleta) {
            const p = customColors.primary;
            if (type.includes('wolf')) {
                paleta['B'] = p;
                paleta['C'] = shadeHex(p, -0.3);
                paleta['D'] = shadeHex(p, 0.2);
            } else if (type.includes('lion')) {
                paleta['D'] = p;
                paleta['C'] = shadeHex(p, -0.3);
                paleta['B'] = shadeHex(p, -0.1);
            } else {
                paleta['A'] = p;
                paleta['B'] = shadeHex(p, -0.2);
                paleta['C'] = shadeHex(p, -0.4);
            }
        }

        const rawCanvas = document.createElement('canvas');
        rawCanvas.width = gridSize;
        rawCanvas.height = gridSize;
        const rawCtx = rawCanvas.getContext('2d');

        let minX = gridSize, maxX = 0, minY = gridSize, maxY = 0;

        if (blueprint && paleta) {
            for (let y = 0; y < blueprint.length && y < gridSize; y++) {
                const row = blueprint[y];
                if (!row) continue;
                for (let x = 0; x < row.length && x < gridSize; x++) {
                    const char = row[x];
                    if (char === ' ') continue;
                    const color = paleta[char];
                    if (color && color !== 'transparent') {
                        rawCtx.fillStyle = color;
                        rawCtx.fillRect(x, y, 1, 1);
                        if (x < minX) minX = x;
                        if (x > maxX) maxX = x;
                        if (y < minY) minY = y;
                        if (y > maxY) maxY = y;
                    }
                }
            }
        } else if (pixels) {
            let pxArr = pixels;
            if (Array.isArray(pxArr) && Array.isArray(pxArr[0])) pxArr = pxArr[0];
            if (Array.isArray(pxArr)) {
                for (const p of pxArr) {
                    if (!p || p.c === 'transparent') continue;
                    const x = p.x, y = p.y, c = p.c;
                    if (x == null || y == null || !c) continue;
                    if (x >= 0 && x < gridSize && y >= 0 && y < gridSize) {
                        rawCtx.fillStyle = c;
                        rawCtx.fillRect(x, y, 1, 1);
                        if (x < minX) minX = x;
                        if (x > maxX) maxX = x;
                        if (y < minY) minY = y;
                        if (y > maxY) maxY = y;
                    }
                }
            }
        }

        const contentW = maxX - minX + 1;
        const contentH = maxY - minY + 1;

        if (contentW <= 0 || contentH <= 0) {
            setCachedImage(rawCanvas);
            return;
        }

        const pad = 2;
        const usable = gridSize - pad * 2;
        const fitScale = Math.min(usable / contentW, usable / contentH);

        const offCanvas = document.createElement('canvas');
        offCanvas.width = gridSize;
        offCanvas.height = gridSize;
        const oCtx = offCanvas.getContext('2d');
        oCtx.imageSmoothingEnabled = false;
        oCtx.drawImage(rawCanvas, minX, minY, contentW, contentH,
            (gridSize - contentW * fitScale) / 2, (gridSize - contentH * fitScale) / 2,
            contentW * fitScale, contentH * fitScale);
        setCachedImage(offCanvas);
    }, [type, JSON.stringify(customColors), dbBlueprints]);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas || !cachedImage) return;
        const ctx = canvas.getContext('2d');

        ctx.imageSmoothingEnabled = false;

        let t = 0;
        const loop = () => {
            if (!canvasRef.current || !cachedImage) return;
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            const bobAmp = isContained
                ? size * 0.015
                : (isHatching ? 2 * S : 1.5 * S);
            const bob = isHatching
                ? Math.sin(t * 0.2) * bobAmp
                : Math.sin(t * 0.05) * bobAmp;
            const squash = isHatching ? Math.abs(Math.sin(t * 0.2)) * 0.1 : Math.sin(t * 0.03) * 0.06;

            const drawW = renderModel * (1 + squash);
            const drawH = renderModel * (1 - squash);

            const offsetX = (canvas.width - drawW) / 2;
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
    }, [cachedImage, renderModel, renderCanvas, isHatching, gridSize, isContained]);

    const wrapSize = size || nativeDiv;

    return (
        <div
            className="inline-flex items-center justify-center relative pointer-events-none"
            style={{
                width: wrapSize,
                height: wrapSize,
                overflow: isContained ? 'hidden' : 'visible'
            }}
        >
            <canvas
                ref={canvasRef}
                width={renderCanvas}
                height={renderCanvas}
                className="absolute"
                style={{
                    imageRendering: 'pixelated',
                    width: isContained ? size : nativeCanvas,
                    height: isContained ? size : nativeCanvas,
                    ...(isContained ? {} : {
                        marginLeft: -(nativeCanvas - wrapSize) / 2,
                        marginTop: -(nativeCanvas - wrapSize) / 2,
                    }),
                }}
            />
        </div>
    );
};

export default React.memo(ModernPixelPet);
