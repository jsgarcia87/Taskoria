// Geometry of the polyhedral dice (d6, d8, d10, d12, d20) for the CSS-3D die in Die.jsx.
// Everything lives in CSS space: x → right, y ↓ down, z → towards the viewer.
//
// buildDie(sides) → { fit, faces:[{ value, normal, axes:{x,y,z}, centre, poly }], byValue }
//   - every face is a planar polygon given in the face's own 2D frame (poly), plus the matrix
//     columns (axes) and centre that place it in 3D; the face's frame has y pointing down so a
//     number laid out in it reads upright when the face looks at the viewer.
//   - faces are numbered so opposite faces add up to sides + 1, like a real die.

const PHI = (1 + Math.sqrt(5)) / 2;

const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const add = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const mul = (a, k) => [a[0] * k, a[1] * k, a[2] * k];
const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const unit = (a) => { const l = Math.hypot(a[0], a[1], a[2]) || 1; return [a[0] / l, a[1] / l, a[2] / l]; };
const mean = (pts) => mul(pts.reduce(add, [0, 0, 0]), 1 / pts.length);

// ── solids ───────────────────────────────────────────────────────────────────

const icosahedron = () => ({
    verts: [[-1, PHI, 0], [1, PHI, 0], [-1, -PHI, 0], [1, -PHI, 0], [0, -1, PHI], [0, 1, PHI], [0, -1, -PHI], [0, 1, -PHI], [PHI, 0, -1], [PHI, 0, 1], [-PHI, 0, -1], [-PHI, 0, 1]],
    faces: [[0, 11, 5], [0, 5, 1], [0, 1, 7], [0, 7, 10], [0, 10, 11], [1, 5, 9], [5, 11, 4], [11, 10, 2], [10, 7, 6], [7, 1, 8],
        [3, 9, 4], [3, 4, 2], [3, 2, 6], [3, 6, 8], [3, 8, 9], [4, 9, 5], [2, 4, 11], [6, 2, 10], [8, 6, 7], [9, 8, 1]],
});

const octahedron = () => ({
    verts: [[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]],
    faces: [[0, 2, 4], [2, 1, 4], [1, 3, 4], [3, 0, 4], [2, 0, 5], [1, 2, 5], [3, 1, 5], [0, 3, 5]],
});

/** The dual: one vertex per face, one face per vertex (cube = dual of the octahedron, d12 = dual of the d20). */
const dual = ({ verts, faces }) => {
    const centres = faces.map(f => unit(mean(f.map(i => verts[i]))));
    const out = verts.map((v, vi) => {
        const axis = unit(v);
        const ring = faces.map((f, fi) => (f.includes(vi) ? fi : -1)).filter(i => i >= 0);
        const e1 = unit(sub(centres[ring[0]], mul(axis, dot(centres[ring[0]], axis))));
        const e2 = cross(axis, e1);
        return ring.sort((a, b) => Math.atan2(dot(centres[a], e2), dot(centres[a], e1)) - Math.atan2(dot(centres[b], e2), dot(centres[b], e1)));
    });
    return { verts: centres, faces: out };
};

/** Pentagonal trapezohedron: ten kite faces around two poles. The pole height makes every kite flat. */
const trapezohedron = () => {
    const h = 0.12, pole = 9.472 * h;
    const ring = (k, y) => [Math.cos(k * Math.PI / 5), y, Math.sin(k * Math.PI / 5)];
    const verts = [[0, pole, 0], [0, -pole, 0]];                // 0 = top pole, 1 = bottom pole
    for (let i = 0; i < 5; i++) { verts.push(ring(2 * i, h)); verts.push(ring(2 * i + 1, -h)); }   // 2 + 2i = high, 3 + 2i = low
    const hi = (i) => 2 + 2 * (((i % 5) + 5) % 5), lo = (i) => 3 + 2 * (((i % 5) + 5) % 5);
    const faces = [];
    for (let i = 0; i < 5; i++) {
        faces.push([0, hi(i), lo(i), hi(i + 1)]);
        faces.push([1, lo(i), hi(i + 1), lo(i + 1)]);
    }
    return { verts, faces };
};

const SOLIDS = {
    20: { make: icosahedron, fit: 0.56, up: 'vertex', font: 1.5 },
    12: { make: () => dual(icosahedron()), fit: 0.56, up: 'vertex', font: 1.25 },
    10: { make: trapezohedron, fit: 0.56, up: 'vertex', font: 1.2 },
    8: { make: octahedron, fit: 0.58, up: 'vertex', font: 1.4 },
    6: { make: () => dual(octahedron()), fit: 0.5, up: 'edge', font: 1.3 },
};

// ── faces ────────────────────────────────────────────────────────────────────

const buildDie = (sides) => {
    const spec = SOLIDS[sides] || SOLIDS[20];
    const n = SOLIDS[sides] ? sides : 20;
    const { verts, faces } = spec.make();
    const r = Math.max(...verts.map(v => Math.hypot(...v)));

    const built = faces.map((idx) => {
        const pts = idx.map(i => mul(verts[i], 1 / r));       // circumradius 1
        const centre = mean(pts);
        let normal = unit(cross(sub(pts[1], pts[0]), sub(pts[2], pts[0])));
        if (dot(normal, centre) < 0) normal = mul(normal, -1);
        const towards = spec.up === 'edge' ? mean([pts[0], pts[1]]) : pts[0];
        const rel = sub(towards, centre);
        const upDir = unit(sub(rel, mul(normal, dot(rel, normal))));
        const y = mul(upDir, -1);                              // local "down"
        const x = cross(y, normal);
        const poly = pts.map(p => [dot(sub(p, centre), x), dot(sub(p, centre), y)]);
        return { normal, centre, axes: { x, y, z: normal }, poly };
    });

    // number the faces so that opposite faces add up to n + 1
    const values = new Array(built.length).fill(0);
    let next = 1;
    for (let i = 0; i < built.length; i++) {
        if (values[i]) continue;
        let best = -1, bestDot = 2;
        for (let j = 0; j < built.length; j++) {
            if (j === i || values[j]) continue;
            const d = dot(built[i].normal, built[j].normal);
            if (d < bestDot) { bestDot = d; best = j; }
        }
        values[i] = next; values[best] = n + 1 - next; next += 1;
    }
    built.forEach((f, i) => { f.value = values[i]; });
    const byValue = {};
    built.forEach((f, i) => { byValue[f.value] = i; });
    return { sides: n, fit: spec.fit, font: spec.font, faces: built, byValue };
};

// ── small matrix kit (3×3, row-major, applied to column vectors) ─────────────

export const IDENTITY = [[1, 0, 0], [0, 1, 0], [0, 0, 1]];
export const matMul = (A, B) => A.map((row) => [0, 1, 2].map(j => row[0] * B[0][j] + row[1] * B[1][j] + row[2] * B[2][j]));
export const matVec = (A, v) => [dot(A[0], v), dot(A[1], v), dot(A[2], v)];
export const rotX = (a) => [[1, 0, 0], [0, Math.cos(a), -Math.sin(a)], [0, Math.sin(a), Math.cos(a)]];
export const rotY = (a) => [[Math.cos(a), 0, Math.sin(a)], [0, 1, 0], [-Math.sin(a), 0, Math.cos(a)]];
export const axisAngle = (axis, a) => {
    const [x, y, z] = unit(axis), c = Math.cos(a), s = Math.sin(a), t = 1 - c;
    return [[t * x * x + c, t * x * y - s * z, t * x * z + s * y], [t * x * y + s * z, t * y * y + c, t * y * z - s * x], [t * x * z - s * y, t * y * z + s * x, t * z * z + c]];
};
/** CSS matrix3d() for a rotation (+ optional translation in px). */
export const toMatrix3d = (R, t = [0, 0, 0]) => `matrix3d(${R[0][0]},${R[1][0]},${R[2][0]},0,${R[0][1]},${R[1][1]},${R[2][1]},0,${R[0][2]},${R[1][2]},${R[2][2]},0,${t[0]},${t[1]},${t[2]},1)`;
/** The rotation that turns a face towards the viewer with its number upright. */
export const faceToViewer = (face) => [face.axes.x, face.axes.y, face.axes.z];

const cache = {};
export const getDie = (sides) => (cache[sides] ||= buildDie(sides));
export { dot };
