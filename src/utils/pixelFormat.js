// =============================================================================
//  Pixel format helpers — normalize the two storage formats used by
//  world_creations: sparse arrays of {x,y,c} (current Pixel Studio export)
//  and flat buffers of color strings (legacy/migrated data).
//  Multi-frame data is an array of frames in either format.
// =============================================================================

/** Returns the first frame of possibly multi-frame pixel data, parsing JSON strings. */
export function firstFrame(pixels) {
    let pxs = pixels;
    if (typeof pxs === 'string') {
        try { pxs = JSON.parse(pxs); } catch (e) { return null; }
    }
    if (!Array.isArray(pxs)) return null;
    if (Array.isArray(pxs[0])) pxs = pxs[0];
    return pxs;
}

/** True if the frame is a sparse array of {x,y,c} objects. */
export function isSparseFrame(frame) {
    return Array.isArray(frame) && frame.length > 0 && typeof frame[0] === 'object' && frame[0] !== null;
}

/** Converts one frame (sparse or flat) into a flat buffer of gridSize*gridSize colors. */
export function frameToBuffer(frame, gridSize) {
    const gs = gridSize || 64;
    const buf = new Array(gs * gs).fill('transparent');
    if (!Array.isArray(frame)) return buf;
    if (isSparseFrame(frame)) {
        frame.forEach(p => {
            if (p && p.x !== undefined && p.y !== undefined && p.c && p.c !== 'transparent') {
                buf[p.y * gs + p.x] = p.c;
            }
        });
    } else {
        const n = Math.min(frame.length, buf.length);
        for (let i = 0; i < n; i++) {
            if (frame[i] && frame[i] !== 'transparent' && frame[i] !== 'EMPTY') buf[i] = frame[i];
        }
    }
    return buf;
}

/** Renders pixel data (any format, first frame) to a PNG data URL for previews. */
export function pixelsToDataUrl(pixels, gridSize) {
    const frame = firstFrame(pixels);
    if (!frame) return '';
    const gs = gridSize || 64;
    const buf = frameToBuffer(frame, gs);
    const canvas = document.createElement('canvas');
    canvas.width = gs;
    canvas.height = gs;
    const ctx = canvas.getContext('2d');
    for (let i = 0; i < buf.length; i++) {
        if (buf[i] !== 'transparent') {
            ctx.fillStyle = buf[i];
            ctx.fillRect(i % gs, Math.floor(i / gs), 1, 1);
        }
    }
    return canvas.toDataURL();
}
