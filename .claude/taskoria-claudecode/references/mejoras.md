# Mejoras Urgentes — PlayableWorld & Tiles

Diagnóstico basado en el código real de `sprites.jsx` y `MapData.js` + capturas de la app.

---

## 🔴 PROBLEMA PRINCIPAL: Mapas sin tileSprite

**Estado actual:**
- `townSquare` → ✅ tiene `tileSprite: 'cobblestone_tile'` (tile procedural)
- `taskoriaKeep` → ❌ sin tileSprite, usa CSS grid azul `#1e1b4b` con líneas blancas
- `mysticForest` → ❌ sin tileSprite, usa CSS radial-gradient verde puntitos
- `shadowCrypts` → ❌ sin tileSprite, usa CSS radial-gradient azul puntitos
- `tavernInterior` → ⚠️ CSS stripe wood (aceptable, puede mejorar)

**Solución:** Añadir funciones generadoras de tiles en `sprites.jsx` + referenciarlos en `MapData.js`

---

## ✅ TILES A AÑADIR EN sprites.jsx

### 1. `stone_floor_tile` — Para Taskoria Keep (piedra de castillo)

```js
function generateStoneFloorTile() {
    const S = 64;
    const buf = new Array(S * S).fill('#2a2a3a'); // mortero azul-oscuro castillo

    const stoneTones = [
        { base: '#4a4860', hi: '#6a6880', sh: '#2a2840' },
        { base: '#3e3c52', hi: '#5e5c72', sh: '#1e1c32' },
        { base: '#524f6a', hi: '#726f8a', sh: '#322f4a' },
        { base: '#464460', hi: '#666480', sh: '#262440' },
    ];

    const set = (x, y, c) => {
        if (x < 0 || x >= S || y < 0 || y >= S) return;
        buf[y * S + x] = c;
    };

    const drawStone = (sx, sy, w, h, t) => {
        for (let dy = 1; dy < h - 1; dy++) {
            for (let dx = 1; dx < w - 1; dx++) {
                let c = t.base;
                if (dy === 1 || dx === 1) c = t.hi;
                else if (dy >= h - 2 || dx >= w - 2) c = t.sh;
                const seed = ((sx + dx) * 17 + (sy + dy) * 11) % 13;
                if (seed === 0) c = t.sh;
                else if (seed === 1) c = t.hi;
                set(sx + dx, sy + dy, c);
            }
        }
    };

    // Patron: piedras mas grandes y rectangulares para castillo
    const ROW_H = 16;
    for (let row = 0; row < 4; row++) {
        const offset = (row % 2) * 16;
        // Piedras anchas para castillo
        const COL_W = 32;
        for (let col = -1; col < 4; col++) {
            const x = col * COL_W + offset;
            const y = row * ROW_H;
            const t = stoneTones[(row * 2 + col + 6) % stoneTones.length];
            drawStone(x, y, COL_W, ROW_H, t);
        }
    }
    return buf;
}
```

**En MapData.js — taskoriaKeep:**
```js
taskoriaKeep: {
    // ...
    tileSprite: 'stone_floor_tile',  // ← añadir esta línea
    tileSize: 64,                    // ← añadir esta línea
    // quitar la propiedad 'background: { backgroundImage: gradient... }'
    baseColor: '#2a2a3a',           // ← cambiar a tono más cálido
```

---

### 2. `grass_tile` — Para Mystic Forest

```js
function generateGrassTile() {
    const S = 64;
    const buf = new Array(S * S).fill('#166534'); // verde oscuro base

    const grassTones = [
        { base: '#166534', hi: '#15803d', sh: '#14532d' },
        { base: '#15803d', hi: '#16a34a', sh: '#166534' },
        { base: '#14532d', hi: '#166534', sh: '#052e16' },
    ];

    const set = (x, y, c) => {
        if (x < 0 || x >= S || y < 0 || y >= S) return;
        buf[y * S + x] = c;
    };

    // Textura de hierba irregular (sin bordes duros)
    for (let y = 0; y < S; y++) {
        for (let x = 0; x < S; x++) {
            const seed = (x * 13 + y * 7 + x * y * 3) % 17;
            const t = grassTones[seed % grassTones.length];
            let c = t.base;
            if (seed < 3) c = t.hi;
            else if (seed > 14) c = t.sh;
            set(x, y, c);
        }
    }

    // Briznas de hierba (líneas verticales de 2-3px)
    const bladePositions = [5, 12, 19, 27, 34, 41, 49, 56, 8, 22, 38, 52];
    bladePositions.forEach(bx => {
        const height = 3 + ((bx * 7) % 4);
        const by = S - height - ((bx * 3) % 6);
        for (let i = 0; i < height; i++) {
            set(bx, by + i, '#22c55e');
            if (i === 0) set(bx - 1, by + 1, '#16a34a'); // sombra izq
        }
    });

    // Flores ocasionales (1px amarillo)
    [[10, 10], [30, 45], [55, 20], [20, 55], [48, 35]].forEach(([fx, fy]) => {
        set(fx, fy, '#fbbf24');
        set(fx + 1, fy, '#fbbf24');
    });

    return buf;
}
```

**En MapData.js — mysticForest:**
```js
mysticForest: {
    // ...
    tileSprite: 'grass_tile',  // ← añadir
    tileSize: 64,              // ← añadir
    baseColor: '#166534',
    // eliminar 'background: { ... }' ya que tileSprite lo reemplaza
```

---

### 3. `dungeon_floor_tile` — Para Shadow Crypts

```js
function generateDungeonFloorTile() {
    const S = 64;
    const buf = new Array(S * S).fill('#0a0a14'); // casi negro

    const set = (x, y, c) => {
        if (x < 0 || x >= S || y < 0 || y >= S) return;
        buf[y * S + x] = c;
    };

    // Piedra de mazmorra: bloques oscuros con grietas
    const stoneTones = [
        { base: '#1a1a2e', hi: '#252540', sh: '#0a0a14' },
        { base: '#16162a', hi: '#202038', sh: '#080810' },
    ];

    const ROW_H = 16;
    const COL_W = 32;
    for (let row = 0; row < 4; row++) {
        const offset = (row % 2) * 16;
        for (let col = -1; col < 4; col++) {
            const x = col * COL_W + offset;
            const y = row * ROW_H;
            const t = stoneTones[(row + col) % stoneTones.length];
            for (let dy = 1; dy < ROW_H - 1; dy++) {
                for (let dx = 1; dx < COL_W - 1; dx++) {
                    let c = t.base;
                    if (dy === 1 || dx === 1) c = t.hi;
                    else if (dy >= ROW_H - 2 || dx >= COL_W - 2) c = t.sh;
                    set(x + dx, y + dy, c);
                }
            }
        }
    }

    // Grietas
    [[20, 8, 8], [44, 28, 6], [10, 44, 5], [50, 50, 7]].forEach(([cx, cy, len]) => {
        for (let i = 0; i < len; i++) {
            set(cx + i, cy + (i % 3 === 0 ? 1 : 0), '#0a0a14');
        }
    });

    // Manchas de humedad ocasionales
    [[15, 32], [48, 16], [32, 48]].forEach(([mx, my]) => {
        set(mx, my, '#12122a');
        set(mx + 1, my, '#12122a');
        set(mx, my + 1, '#12122a');
    });

    return buf;
}
```

**En MapData.js — shadowCrypts:**
```js
shadowCrypts: {
    // ...
    tileSprite: 'dungeon_floor_tile',
    tileSize: 64,
    baseColor: '#0a0a14',
    // eliminar 'background: { ... }'
```

---

### 4. `wood_floor_tile` — Para Tavern Interior (mejora opcional)

```js
function generateWoodFloorTile() {
    const S = 64;
    const buf = new Array(S * S).fill('#3d261b');

    const set = (x, y, c) => {
        if (x < 0 || x >= S || y < 0 || y >= S) return;
        buf[y * S + x] = c;
    };

    // Tablones horizontales de 8px de alto
    const PLANK_H = 8;
    const woodTones = [
        { base: '#4a3225', hi: '#5c3e2e', sh: '#3d261b', grain: '#3a2218' },
        { base: '#3d261b', hi: '#4a3225', sh: '#2e1a10', grain: '#2a1610' },
        { base: '#4f3628', hi: '#614030', sh: '#3d261b', grain: '#3a2218' },
        { base: '#422b1c', hi: '#52351f', sh: '#33200f', grain: '#2a1610' },
    ];

    for (let row = 0; row < 8; row++) {
        const t = woodTones[row % woodTones.length];
        for (let dy = 0; dy < PLANK_H; dy++) {
            for (let x = 0; x < S; x++) {
                const y = row * PLANK_H + dy;
                let c = t.base;
                if (dy === 0) c = t.hi;       // highlight superior
                if (dy === PLANK_H - 1) c = t.sh; // sombra inferior
                // veta de madera
                const veta = (x * 3 + row * 7) % 19;
                if (veta === 0 || veta === 1) c = t.grain;
                set(x, y, c);
            }
        }
    }

    return buf;
}
```

**En MapData.js — tavernInterior:**
```js
tavernInterior: {
    tileSprite: 'wood_floor_tile',
    tileSize: 64,
    baseColor: '#3d261b',
    // eliminar 'background: { backgroundImage: gradient... }'
```

---

## ✅ REGISTRO COMPLETO en sprites.jsx

Una vez añadidas las 4 funciones, actualizar el export:

```js
export const SPRITES = {
    cobblestone_tile: generateCobblestoneTile(),
    stone_floor_tile: generateStoneFloorTile(),    // ← nuevo
    grass_tile: generateGrassTile(),               // ← nuevo
    dungeon_floor_tile: generateDungeonFloorTile(), // ← nuevo
    wood_floor_tile: generateWoodFloorTile(),       // ← nuevo
};
```

---

## 🎨 MEJORA DE LA ESTATUA (taskoriaKeep)

**Estado actual:** divs CSS apilados, muy genérico (gris plano).

**Mejora:** SVG pixel art de estatua de guerrero en pedestal.

En `PlayableWorld.jsx`, reemplazar el bloque `if (dec.type === 'statue')`:

```jsx
if (dec.type === 'statue') {
    const sz = dec.size || 80;
    return (
        <div key={`dec_${i}`} className="absolute pointer-events-none"
            style={{ left: dec.x - sz/2, top: dec.y - sz * 1.5, width: sz, height: sz * 1.5, zIndex: dec.y }}>
            <svg width={sz} height={sz * 1.5} viewBox="0 0 16 24" shapeRendering="crispEdges"
                style={{ imageRendering: 'pixelated', filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.6))' }}>
                {/* Pedestal */}
                <rect x="1" y="20" width="14" height="4" fill="#4a4a6a"/>
                <rect x="2" y="19" width="12" height="1" fill="#6a6a8a"/>
                <rect x="3" y="18" width="10" height="1" fill="#3a3a5a"/>
                {/* Columna */}
                <rect x="5" y="14" width="6" height="4" fill="#545470"/>
                <rect x="5" y="14" width="1" height="4" fill="#6a6a8a"/>
                {/* Cuerpo guerrero */}
                <rect x="4" y="9" width="8" height="5" fill="#585878"/>
                <rect x="4" y="9" width="1" height="5" fill="#7a7a9a"/>
                <rect x="11" y="9" width="1" height="5" fill="#3a3a5a"/>
                {/* Cabeza */}
                <rect x="5" y="5" width="6" height="4" fill="#606080"/>
                <rect x="5" y="5" width="1" height="4" fill="#808098"/>
                {/* Casco */}
                <rect x="4" y="4" width="8" height="2" fill="#4a4a6a"/>
                <rect x="5" y="3" width="6" height="2" fill="#585878"/>
                <rect x="6" y="2" width="4" height="1" fill="#4a4a6a"/>
                {/* Escudo (brazo izq) */}
                <rect x="2" y="10" width="3" height="4" fill="#4a4a6a"/>
                <rect x="2" y="10" width="1" height="4" fill="#6a6a8a"/>
                <rect x="3" y="11" width="1" height="2" fill="#c0a040"/>
                {/* Espada (brazo der) */}
                <rect x="11" y="8" width="1" height="6" fill="#8a8aaa"/>
                <rect x="10" y="9" width="3" height="1" fill="#6a6a8a"/>
                {/* Capa trasera */}
                <rect x="4" y="13" width="8" height="2" fill="#404060"/>
                {/* Sombra base */}
                <rect x="0" y="23" width="16" height="1" fill="rgba(0,0,0,0.3)"/>
            </svg>
        </div>
    );
}
```

---

## 🎨 MEJORA DE LA CORONA / TRONO (taskoriaKeep)

En `MapData.js`, reemplazar los decorados del trono con una versión más detallada:

```js
// Sustituir en taskoriaKeep.decorations:
// { x: 450, y: 180, type: 'text', value: '👑', size: 64 },  ← QUITAR

// AÑADIR en su lugar:
{ x: 500, y: 200, type: 'throne', size: 80 },  // ← nuevo tipo
```

Y en `PlayableWorld.jsx`, añadir el renderer del trono:

```jsx
if (dec.type === 'throne') {
    const sz = dec.size || 80;
    return (
        <div key={`dec_${i}`} className="absolute pointer-events-none"
            style={{ left: dec.x - sz/2, top: dec.y - sz, width: sz, height: sz, zIndex: dec.y }}>
            <svg width={sz} height={sz} viewBox="0 0 16 16" shapeRendering="crispEdges"
                style={{ imageRendering: 'pixelated', filter: 'drop-shadow(0 0 12px rgba(251,191,36,0.4))' }}>
                {/* Respaldo */}
                <rect x="1" y="1" width="14" height="10" fill="#92400e"/>
                <rect x="1" y="1" width="14" height="1" fill="#fbbf24"/>
                <rect x="1" y="1" width="1" height="10" fill="#fbbf24"/>
                <rect x="14" y="1" width="1" height="10" fill="#b45309"/>
                {/* Puntas de la corona del respaldo */}
                <rect x="1" y="0" width="2" height="2" fill="#fbbf24"/>
                <rect x="7" y="0" width="2" height="2" fill="#fbbf24"/>
                <rect x="13" y="0" width="2" height="2" fill="#fbbf24"/>
                {/* Gemas */}
                <rect x="3" y="3" width="2" height="2" fill="#ef4444"/>
                <rect x="7" y="3" width="2" height="2" fill="#3b82f6"/>
                <rect x="11" y="3" width="2" height="2" fill="#10b981"/>
                {/* Asiento */}
                <rect x="1" y="11" width="14" height="4" fill="#7c2d12"/>
                <rect x="1" y="11" width="14" height="1" fill="#b45309"/>
                {/* Alfombra bajo trono */}
                <rect x="0" y="14" width="16" height="2" fill="#7f1d1d"/>
                <rect x="1" y="15" width="14" height="1" fill="#991b1b"/>
            </svg>
        </div>
    );
}
```

---

## 🎨 MEJORA DEL GARDENVIEW

**Problema:** Usa `PixelAvatar` (legacy, spritesheet) en lugar de `ModernPixelAvatar` (canvas, blueprints).

**Fix en `GardenView.jsx`:**

```jsx
// Cambiar imports:
// import PixelAvatar from '../common/PixelAvatar';    ← QUITAR
// import PixelPet from '../common/PixelPet';          ← QUITAR
import ModernPixelAvatar from '../common/ModernPixelAvatar';  // ← AÑADIR
import ModernPixelPet from '../common/ModernPixelPet';        // ← AÑADIR

// Cambiar el render del avatar (buscar <PixelAvatar):
// ANTES:
<PixelAvatar type={charData.avatarType || charData.id} scale={2.4} customColors={character?.avatarColors} />

// DESPUÉS:
<ModernPixelAvatar type={character.class || charData.avatarType || charData.id} scale={2.4} customColors={character?.avatarColors} />

// Cambiar el render de la mascota (buscar <PixelPet):
// ANTES:
<PixelPet type={activePet.type} scale={1.25} level={activePet.level} mood={mood} />

// DESPUÉS:
<ModernPixelPet type={activePet.type} scale={1.25} customColors={activePet.customColors} />
```

**Nota:** `ModernPixelAvatar` y `ModernPixelPet` ya existen en el proyecto. El GardenView usa las versiones legacy (`PixelAvatar`, `PixelPet`) basadas en spritesheets PNG mientras que el PlayableWorld usa las modernas. Unificar a las modernas mejora la calidad visual y la consistencia.

---

## 🎨 REFERENCIAS VISUALES LPC (Liberated Pixel Cup)

El usuario proporcionó 3 capturas de referencia del estilo visual objetivo:

**Imagen 1 — Pueblo medieval cálido:**
- Adoquín beige/arena (NO gris frío) → paleta `#c8a87a` / `#bfa06e` / `#d4b484`
- Mortero oscuro cálido `#2a1f14`
- Piedras con highlight sup-izq y sombra inf-der
- Patrón alternado con variación de ancho

**Imagen 2 — Ciudad con personajes:**
- Suelo piedra gris `#7a7a8a` con losas grandes (32×16px)
- Mortero gris oscuro `#3a3a42`
- Personajes muy compactos (mucho más pequeños que los actuales de Taskoria)

**Imagen 3 — Aldea con posada:**
- Hierba densa con variación de tonos verdes
- Flores de 3×3px dispersas (amarillo, rosa, morado)
- Suelo de madera con tablas horizontales de 8px de alto y veta
- Mezcla de materiales (hierba + piedra + madera)

## Tiles LPC generados y listos para integrar

Ver `/mnt/user-data/outputs/taskoria-tiles.jsx` para el código completo.
Ver `/mnt/user-data/outputs/taskoria-tile-preview.html` para previsualización interactiva.

| ID | Mapa destino | Paleta base |
|----|-------------|-------------|
| `cobblestone_warm` | Town Square | Beige/arena cálido |
| `stone_path` | Village roads | Gris neutro |
| `grass_dense` | Mystic Forest | Verde vivo con flores |
| `dungeon_stone` | Shadow Crypts | Gris-azul oscuro |
| `wood_floor` | Tavern Interior | Caoba con veta |
| `royal_stone` | Taskoria Keep | Azul-gris con incrustaciones doradas |

### Integración en sprites.jsx (3 pasos)
```js
// 1. Copiar todas las funciones generate* de taskoria-tiles.jsx
// 2. Añadir al export SPRITES:
export const SPRITES = {
    cobblestone_tile: generateCobblestoneTile(), // ← mantener por compatibilidad
    cobblestone_warm: generateCobblestoneWarm(), // ← nuevo (reemplaza visualmente)
    stone_path: generateStonePath(),
    grass_dense: generateGrassDense(),
    dungeon_stone: generateDungeonStone(),
    wood_floor: generateWoodFloor(),
    royal_stone: generateRoyalStone(),
};
// 3. Actualizar MapData.js con los nuevos nombres de tileSprite
```
