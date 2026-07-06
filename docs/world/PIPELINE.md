# Taskoria World — Pipeline de Construcción

## Regla Fundamental

**Sprites primero, MapData después.**
Si el sprite no existe en sprites.jsx, el MapData no sirve de nada.

---

## Orden de Trabajo (en este orden exacto)

```
Fase 1 — SPRITES
  └─ sprites.jsx: añadir tiles de suelo faltantes
  └─ sprites.jsx: añadir props críticos (shop_building, torch, oak_tree...)

Fase 2 — LAYOUT
  └─ Diseñar el mapa en ASCII antes de tocar código
  └─ Validar distribución, flujo, portales

Fase 3 — MAPDATA
  └─ Transliterar el ASCII a coordenadas en MapData.js
  └─ obstacles[], decorations[], portals[], npcs[]

Fase 4 — PREVIEW
  └─ Abrir el previsualizador HTML para verificar
  └─ Ajustar coordenadas si es necesario
  └─ Pegar en producción
```

---

## Sprites Críticos (Fase 1)

### Sin estos, nada se ve

| Key en sprites.jsx | Uso en MapData | Estado |
|--------------------|----------------|--------|
| `cobblestone_warm` | tileSprite townSquare | ✅ existe |
| `wood_floor`       | tileSprite tavernInterior | ✅ verificar |
| `grass_dense`      | tileSprite mysticForest | ❌ añadir |
| `dungeon_stone`    | tileSprite shadowCrypts | ❌ añadir |
| `royal_stone`      | tileSprite taskoriaKeep | ❌ añadir |
| `shop_building`    | type en obstacles | ❌ añadir |
| `torch`            | type en decorations | ❌ añadir |
| `oak_tree`         | type en decorations | ❌ añadir |
| `market_stall`     | type en decorations | ❌ añadir |

---

## Técnicas de Renderizado en PlayableWorld.jsx

### Y-Sorting

**Problema actual:** todo se renderiza en un solo pass, los objetos
al sur no tapan a los del norte.

**Solución:** ordenar la cola de renderizado por `y + height` antes de pintar:

```js
// En PlayableWorld.jsx — función de render
const renderQueue = [
  ...obstacles.map(ob => ({ ...ob, sortY: ob.y + ob.h })),
  ...decorations.map(dc => ({ ...dc, sortY: dc.y + 1 })),
  ...npcs.map(npc => ({ ...npc, sortY: npc.y + 1 })),
  { ...player, sortY: player.y + 1 },
].sort((a, b) => a.sortY - b.sortY);

renderQueue.forEach(obj => {
  switch(obj.type || obj.role) {
    case 'building': drawBuilding(ctx, obj); break;
    case 'npc':      drawNPC(ctx, obj); break;
    case 'player':   drawPlayer(ctx, obj); break;
    // ...
  }
});
```

### Sprite Cache

**Problema:** los sprites se recalculan cada frame → lento.

**Solución:** generar sprites UNA vez al inicializar:

```js
// Al inicializar PlayableWorld
const SPRITE_CACHE = {};

function getCachedSprite(key, season) {
  const cacheKey = `${key}_${season}`;
  if (!SPRITE_CACHE[cacheKey]) {
    SPRITE_CACHE[cacheKey] = generateSprite(key, season);
  }
  return SPRITE_CACHE[cacheKey];
}

// Invalidar al cambiar estación
function invalidateCache() {
  Object.keys(SPRITE_CACHE).forEach(k => delete SPRITE_CACHE[k]);
}
```

### Bitmask Autotiling para caminos

**Problema:** todos los tiles de camino se ven iguales, no se conectan.

**Solución:** cada tile detecta sus vecinos y elige la variante correcta:

```js
const pathSet = new Set(); // 'x,y' de tiles que son camino

function isPath(tx, ty) { return pathSet.has(`${tx},${ty}`); }

function drawPathTile(ctx, x, y, tx, ty) {
  const N = isPath(tx, ty-1), S = isPath(tx, ty+1);
  const W = isPath(tx-1, ty), E = isPath(tx+1, ty);

  // Base
  ctx.drawImage(getCachedSprite('stone_path'), x, y);

  // Bordes de transición con hierba
  const edgeColor = '#4a9a2888';
  if (!N) { ctx.fillStyle = edgeColor; ctx.fillRect(x, y, TILE_SIZE, 3); }
  if (!S) { ctx.fillStyle = edgeColor; ctx.fillRect(x, y+TILE_SIZE-3, TILE_SIZE, 3); }
  if (!W) { ctx.fillStyle = edgeColor; ctx.fillRect(x, y, 3, TILE_SIZE); }
  if (!E) { ctx.fillStyle = edgeColor; ctx.fillRect(x+TILE_SIZE-3, y, 3, TILE_SIZE); }
}
```

### Perspectiva 3/4 en Edificios

**Añadir en PlayableWorld.jsx al renderizar buildings:**

```js
function drawBuilding3D(ctx, building, config) {
  const { x, y, w, h } = building;
  const px = x * TILE_SIZE, py = y * TILE_SIZE;
  const pw = w * TILE_SIZE, ph = h * TILE_SIZE;
  const roofH = Math.round(ph * 0.40);
  const perspH = 8; // px de cara sur visible

  // 1. Tejado
  drawRoof(ctx, px, py, pw, roofH, config);

  // 2. Cara sur (perspectiva 3/4)
  const southFace = darken(config.roofDark, 0.7);
  ctx.fillStyle = southFace;
  ctx.fillRect(px - config.eaveSize, py + roofH, pw + config.eaveSize*2, perspH);

  // 3. Fachada
  drawFacade(ctx, px, py + roofH + perspH, pw, ph - roofH - perspH, config);

  // 4. Ventanas y puerta
  // ...

  // 5. Sombra proyectada
  ctx.fillStyle = 'rgba(0,0,0,0.18)';
  ctx.fillRect(px + 6, py + ph, pw - 12, 6);
}
```

---

## Capas de Renderizado (orden obligatorio)

```
0. Background/sky color
1. Tiles de suelo (ground layer)
2. Agua con animación
3. Sombras de edificios en suelo
4. Props de suelo: cultivos, vallas, caminos
5. [Y-SORTED] Edificios base (muros, puertas)
5. [Y-SORTED] Props medios: barriles, bancos, arbustos
5. [Y-SORTED] NPCs y animales
5. [Y-SORTED] Player
6. Overhead: tejados que tapan al player
7. Copas de árboles (overhead)
8. Efectos: fuego, partículas, humo
9. Iluminación / oscuridad ambiental
10. HUD
```

---

## Formato MapData.js

```js
export const MAPS = {
  townSquare: {
    id: 'townSquare',
    name: 'Town Square',
    tileSprite: 'cobblestone_warm',  // key en sprites.jsx
    width: 20,   // en tiles
    height: 16,  // en tiles
    bgColor: '#2a1f12',
    ambientLight: 0.85,
    spawn: { x: 10, y: 12 },  // en tiles

    obstacles: [
      {
        x: 1, y: 1,     // en tiles
        w: 5, h: 4,     // en tiles
        type: 'shop_building',
        label: 'El Grifo Roto',
        // config del House Builder:
        roofType: 'thatch',
        facadeType: 'halftimber',
        wins: 1,
        chimney: true,
        doorType: 'arch',
        colors: {
          roofLight: '#e0c050',
          roofDark:  '#806010',
          plaster:   '#f0e8c0',
          beams:     '#6a3e18',
          door:      '#8a5228',
        },
      },
      // Obstáculos simples (sin sprite de edificio):
      { x: 8, y: 6, w: 3, h: 3, type: 'well', label: 'Pozo' },
    ],

    decorations: [
      { type: 'torch',   x: 6,  y: 5 },
      { type: 'flowers', x: 9,  y: 8 },
      { type: 'oak_tree',x: 3,  y: 3 },
      { type: 'bench',   x: 7,  y: 10 },
    ],

    portals: [
      {
        id: 'portal_to_tavern',
        x: 1, y: 4, w: 3, h: 1,
        target: 'tavernInterior',
        targetSpawn: { x: 5, y: 11 },
        label: 'El Grifo Roto',
      },
    ],

    npcs: [
      {
        id: 'torwald',
        type: 'vendor_npc',
        x: 9, y: 14,
        name: 'Torwald',
        dialogue: [
          'Alto, forastero.',
          'Completa tus quests.',
        ],
      },
    ],
  },
  // ... otros mapas
};
```

---

## Checklist antes de Hacer Push

- [ ] Sprite nuevo añadido a sprites.jsx Y exportado en SPRITES
- [ ] MapData.js: tileSprite apunta a key existente en sprites.jsx
- [ ] MapData.js: obstacle types existen en PlayableWorld.jsx switch
- [ ] spawn coordinates están en zona sin obstáculos
- [ ] Portales tienen targetSpawn válido en el mapa destino
- [ ] Y-sorting activado para objetos con height > 1 tile
- [ ] Sprite cache implementado (no recalcular cada frame)
- [ ] Iluminación ambiental entre 0.1 (muy oscuro) y 1.0 (pleno día)
