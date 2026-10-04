// Ambient world animals (slime, cat, dog, sleeping cat) drawn as small pixel sprites.
// Art is plain ASCII so it can be edited by eye. One drawing serves every colour:
// the base colour in MapData ({ variant, color }) generates the shaded palette.
//
// Legend:  . clear   o outline   b base   l light   d dark
//          k eye     w white     p pink (nose / inner ear)

const clamp = (n) => Math.max(0, Math.min(255, Math.round(n)));

export function shadeHex(hex, amount) {
    const h = hex.replace('#', '');
    const full = h.length === 3 ? h.split('').map(c => c + c).join('') : h;
    const n = parseInt(full, 16);
    const mix = (c) => clamp(amount >= 0 ? c + (255 - c) * amount : c * (1 + amount));
    const r = mix((n >> 16) & 255), g = mix((n >> 8) & 255), b = mix(n & 255);
    return `#${((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1)}`;
}

export function critterPalette(color) {
    return {
        o: shadeHex(color, -0.62),
        d: shadeHex(color, -0.32),
        b: color,
        l: shadeHex(color, 0.42),
        k: '#1a0e08',
        w: '#f4ecd8',
        p: '#e87aa8',
    };
}

function fromAscii(rows, palette) {
    const w = rows[0].length;
    const h = rows.length;
    rows.forEach((r, i) => {
        if (r.length !== w) throw new Error(`critter art row ${i} is ${r.length} wide, expected ${w}`);
    });
    const buffer = new Array(w * h).fill('transparent');
    rows.forEach((row, y) => {
        [...row].forEach((ch, x) => {
            if (ch !== '.') buffer[y * w + x] = palette[ch] || 'transparent';
        });
    });
    return { w, h, buffer };
}

// Slime: drawn as the left half and mirrored; the shine stays on the left only.
const SLIME_HALF = [
    '........',
    '.....ooo',
    '...ooblb',
    '..oblbbb',
    '.oblbbbb',
    '.obbbbbb',
    'obbbbkbb',
    'obbbbkbb',
    'obbbbbbo',
    'obbbbbbb',
    'oddddddd',
    '.ooooooo',
];
const SLIME = SLIME_HALF.map(half => {
    const right = [...half].reverse().join('').replace(/l/g, 'b');
    return half + right;
});

// Sitting cat, facing right.
const CAT = [
    '.........o...o..',
    '........obo.obo.',
    '........obbbbbo.',
    '.......obbbbbbbo',
    '.......obkbbbkbo',
    '.......obbbpbbbo',
    '........oblllbo.',
    '.......oobbbbbo.',
    '......obbbbbbbo.',
    '.o...obbbbbbbllo',
    'obbo.obbbbbbbblo',
    'obbdoobdbbdbbbo.',
    '.obbbbbbbbbbbbo.',
    '..obbbbbbbbblllo',
    '..oooooooooooooo',
];

// Standing dog, facing right: floppy ear on the near side, short snout, tail up.
const DOG = [
    '............oooo....',
    '...........obbbbbo..',
    '..........oddbkbbbo.',
    '..........oddbbbbbbk',
    '...........obbbllbbo',
    '...........oobbbbbo.',
    '..oo......obbbbbbbo.',
    '.obbo.ooooobbbbbbbo.',
    'obbbooobbbbbbbbbbbo.',
    '.oobbbbbbbbbbbbbbbo.',
    '..obbbbbbbbbbbllbbo.',
    '..obbbbbbbbbbbbbbbo.',
    '..obbo.obbo.obboobbo',
    '..obbo.obbo.obboobbo',
    '..oooo.oooo.oooooooo',
];

// Curled up asleep, facing right.
const CAT_SLEEPING = [
    '..................',
    '.......ooooo.o.o..',
    '.....ooblllbobbo..',
    '...oobbbbbbbbbbbo.',
    '..obbdbbdbbbbkkbo.',
    '.obbbbbbbbbbbbbpo.',
    '.obdddbbbbbbbllbo.',
    '..oobbbbbbbbbbbo..',
    '....ooooooooooo...',
];

export function makeCritter(variant, color) {
    const palette = critterPalette(color);
    if (variant === 'slime') return fromAscii(SLIME, palette);
    if (variant === 'cat') return fromAscii(CAT, palette);
    if (variant === 'dog') return fromAscii(DOG, palette);
    if (variant === 'cat_sleeping') return fromAscii(CAT_SLEEPING, palette);
    return fromAscii(SLIME, palette);
}
