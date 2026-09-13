import React, { useEffect, useRef, useState } from 'react';
import enemyBlueprints from '../../data/enemy_blueprints.json';

const GRID_SIZE = 64;

const EnemySprite = ({ blueprintKey, scale = 2, flip = false }) => {
    const canvasRef = useRef(null);
    const [cachedImage, setCachedImage] = useState(null);

    useEffect(() => {
        const config = enemyBlueprints[blueprintKey];
        if (!config) return;

        const offCanvas = document.createElement('canvas');
        offCanvas.width = GRID_SIZE;
        offCanvas.height = GRID_SIZE;
        const ctx = offCanvas.getContext('2d');

        const pixels = config.current;
        if (!Array.isArray(pixels)) return;

        for (let i = 0; i < pixels.length && i < GRID_SIZE * GRID_SIZE; i++) {
            const color = pixels[i];
            if (!color || color === 'transparent') continue;
            const x = i % GRID_SIZE;
            const y = Math.floor(i / GRID_SIZE);
            ctx.fillStyle = color;
            ctx.fillRect(x, y, 1, 1);
        }

        setCachedImage(offCanvas);
    }, [blueprintKey]);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas || !cachedImage) return;
        const ctx = canvas.getContext('2d');
        ctx.imageSmoothingEnabled = false;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(cachedImage, 0, 0, GRID_SIZE, GRID_SIZE, 0, 0, canvas.width, canvas.height);
    }, [cachedImage, scale]);

    const size = GRID_SIZE * scale;

    return (
        <div
            className="inline-block pointer-events-none"
            style={{
                width: size,
                height: size,
                transform: flip ? 'scaleX(-1)' : undefined,
            }}
        >
            <canvas
                ref={canvasRef}
                width={size}
                height={size}
                style={{
                    width: size,
                    height: size,
                    imageRendering: 'pixelated',
                }}
            />
        </div>
    );
};

export default EnemySprite;
