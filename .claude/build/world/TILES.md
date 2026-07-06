# Taskoria World — Tiles LPC

## Estado Actual

Los tiles se definen en `src/components/dashboard/world/sprites.jsx` como funciones
que generan arrays de 4096 strings hex (64×64px).

### Tiles pendientes de integrar

| Key | Mapa | Estado |
|-----|------|--------|
| `cobblestone_warm` | townSquare | ✅ Existe como `cobblestone_tile` |
| `wood_floor` | tavernInterior | ⚠️ Posible, verificar |
| `grass_dense` | mysticForest | ❌ Falta |
| `dungeon_stone` | shadowCrypts | ❌ Falta |
| `royal_stone` | taskoriaKeep | ❌ Falta |
| `stone_path` | caminos | ❌ Falta |

---

## Helper Base (ya debe existir en sprites.jsx)

```js
function makeSprite(drawFn) {
  const size = 64;
  const pixels = new Array(size * size).fill('transparent');
  const set = (x, y, color) => {
    if (x < 0 || x >= size || y < 0 || y >= size) return;
    pixels[y * size + x] = color;
  };
  const rect = (x, y, w, h, color) => {
    for (let py = y; py < y + h; py++)
      for (let px = x; px < x + w; px++)
        set(px, py, color);
  };
  const hline = (y, x1, x2, color) => {
    for (let px = x1; px <= x2; px++) set(px, y, color);
  };
  const vline = (x, y1, y2, color) => {
    for (let py = y1; py <= y2; py++) set(x, py, color);
  };
  drawFn({ set, rect, hline, vline, size });
  return pixels;
}
```

---

## Tile 1: `cobblestone_warm` — Town Square

**Paleta:** beige cálido con juntas de mortero
**Patrón:** aparejo flamenco, grietas ocasionales, musgo en juntas

```js
export const cobblestone_warm = makeSprite(({ rect, hline, vline, set, size }) => {
  // Base mortero
  rect(0, 0, size, size, '#4a3e2e');

  const rows = [
    { y: 1,  h: 11, stones: [[1,17],[20,12],[34,17],[53,10]] },
    { y: 13, h: 11, stones: [[1,9],[12,18],[32,12],[46,17]] },
    { y: 25, h: 11, stones: [[1,13],[16,18],[36,9],[47,16]] },
    { y: 37, h: 11, stones: [[1,17],[20,12],[34,17],[53,10]] },
    { y: 49, h: 14, stones: [[1,9],[12,18],[32,12],[46,17]] },
  ];

  rows.forEach(({ y, h, stones }) => {
    stones.forEach(([x, w]) => {
      if (x + w > size - 1) w = size - 1 - x;
      rect(x, y, w, h, '#b8a882');
      hline(y,     x, x+w-1, '#d4c49c');  // highlight top
      hline(y+1,   x, x+w-1, '#c8b48e');
      vline(x,     y, y+h-1, '#ccc0a0');  // highlight left
      hline(y+h-1, x, x+w-1, '#8a7a62');  // shadow bottom
      hline(y+h-2, x, x+w-1, '#9e8e72');
      vline(x+w-1, y, y+h-1, '#9e8e72');  // shadow right
      // variación sutil
      if ((x+y) % 3 === 0) rect(x+2, y+2, Math.min(4,w-4), Math.min(4,h-4), '#c0b08a');
      // grieta
      if ((x*y) % 7 === 0 && w > 6) hline(y+Math.floor(h/2), x+2, x+5, '#6a5a48');
      // musgo
      if ((x+y) % 11 === 0) { set(x, y+h, '#3a5a20'); set(x+1, y+h, '#2a4a18'); }
    });
  });
});
```

---

## Tile 2: `wood_floor` — Tavern Interior

**Paleta:** tablones de madera oscura con veta y nudos
**Patrón:** 4 tablones horizontales, veta, juntas

```js
export const wood_floor = makeSprite(({ rect, hline, vline, set, size }) => {
  rect(0, 0, size, size, '#3a1e0a');

  const planks = [
    { y: 1,  h: 14, base: '#7a4820', hi: '#9a6030', sh: '#5a3010', vein: '#6a3a18' },
    { y: 16, h: 14, base: '#6b3c1a', hi: '#8b5228', sh: '#4a2808', vein: '#5a3010' },
    { y: 31, h: 14, base: '#7a4820', hi: '#9a6030', sh: '#5a3010', vein: '#6a3a18' },
    { y: 46, h: 17, base: '#6b3c1a', hi: '#8b5228', sh: '#4a2808', vein: '#5a3010' },
  ];

  planks.forEach(({ y, h, base, hi, sh, vein }) => {
    rect(0, y, size, h, base);
    hline(y,   0, size-1, hi);
    hline(y+1, 0, size-1, '#c08040');
    hline(y+h-1, 0, size-1, sh);
    hline(y+h-2, 0, size-1, '#4a2810');
    rect(2, y+2, size-4, h-4, base);
    rect(3, y+2, size-6, 3, hi);
    // veta de madera
    for (let vy = y+3; vy < y+h-2; vy += 4) hline(vy, 0, size-1, vein);
    // nudo
    const kx = ((y * 7) % (size - 12)) + 6;
    const ky = y + Math.floor(h / 2);
    rect(kx, ky-1, 6, 3, sh);
    rect(kx+1, ky, 4, 1, '#3a1e08');
    set(kx, ky, base); set(kx+5, ky, base);
    // separaciones verticales cada 16px
    for (let vx = 16; vx < size; vx += 16) {
      vline(vx,   y, y+h-1, sh);
      vline(vx+1, y, y+h-1, '#5a3218');
    }
  });
});
```

---

## Tile 3: `grass_dense` — Mystic Forest

**Paleta:** verde saturado estilo Stardew
**Patrón:** variación en 4 cuadrantes + briznas + flores estacionales

```js
export const grass_dense = makeSprite(({ rect, hline, set, size }) => {
  rect(0, 0, size, size, '#2d5a1b');

  // Variación en cuadrantes
  [
    { x:0,  y:0,  w:32, h:32, c:'#336620' },
    { x:32, y:0,  w:32, h:32, c:'#2a5218' },
    { x:0,  y:32, w:32, h:32, c:'#306018' },
    { x:32, y:32, w:32, h:32, c:'#38701e' },
  ].forEach(({ x, y, w, h, c }) => rect(x, y, w, h, c));

  // Briznas de hierba
  const blades = [
    [2,3],[5,1],[8,4],[11,2],[14,1],[17,3],[20,2],[23,4],[26,1],[29,3],
    [32,2],[35,4],[38,1],[41,3],[44,2],[47,4],[50,1],[53,3],[56,2],[59,4],
    [1,12],[4,14],[7,11],[10,15],[13,12],[16,14],[19,11],[22,13],[25,15],
    [28,12],[31,14],[34,11],[37,15],[40,12],[43,14],[46,11],[49,13],[52,15],
    [3,24],[6,22],[9,25],[12,22],[15,24],[18,23],[21,25],[24,22],[27,24],
    [30,22],[33,25],[36,23],[39,22],[42,24],[45,23],[48,25],[51,22],[54,24],
    [2,35],[5,33],[8,36],[11,34],[14,33],[17,35],[20,34],[23,36],[26,33],
    [29,35],[32,34],[35,36],[38,33],[41,35],[44,34],[47,36],[50,33],[53,35],
    [1,46],[4,48],[7,45],[10,47],[13,46],[16,48],[19,45],[22,47],[25,48],
    [28,46],[31,48],[34,45],[37,47],[40,48],[43,45],[46,47],[49,46],[52,48],
    [3,57],[6,55],[9,58],[12,56],[15,55],[18,57],[21,56],[24,58],[27,55],
    [30,57],[33,56],[36,58],[39,55],[42,57],[45,56],[48,58],[51,55],[54,57],
  ];
  blades.forEach(([x, y]) => {
    if (x >= size || y >= size) return;
    set(x, y,   '#4a9a28');
    set(x, y-1, '#5aaa30');
    if (y-2 >= 0) set(x, y-2, '#6ab838');
  });

  // Flores (primavera por defecto)
  [
    [8,8,'#ffff44'],[22,16,'#ff8888'],[36,6,'#ffffff'],
    [50,14,'#ffaa44'],[14,28,'#ffff44'],[44,26,'#ff88aa'],
    [6,42,'#ffffff'],[30,38,'#ffdd00'],[54,44,'#ff8888'],
    [18,54,'#ffff44'],[40,52,'#ffffff'],[62,50,'#ffaa44'],
  ].forEach(([x, y, c]) => {
    if (x+1 < size && y+1 < size) {
      set(x, y, c); set(x+1, y, c); set(x, y+1, c); set(x+1, y+1, c);
      set(x, y, '#ffffff');
    }
  });
});
```

---

## Tile 4: `dungeon_stone` — Shadow Crypts

**Paleta:** piedra oscura con grietas, humedad y musgo
**Patrón:** sillería con aparejo alternado

```js
export const dungeon_stone = makeSprite(({ rect, hline, vline, set, size }) => {
  rect(0, 0, size, size, '#0e0e16');

  const blockRows = [
    { y: 1,  h: 13, blocks: [[1,18],[21,12],[35,18],[55,8]] },
    { y: 15, h: 13, blocks: [[1,9],[12,18],[32,12],[46,17]] },
    { y: 29, h: 13, blocks: [[1,18],[21,12],[35,18],[55,8]] },
    { y: 43, h: 13, blocks: [[1,9],[12,18],[32,12],[46,17]] },
    { y: 57, h: 6,  blocks: [[1,18],[21,12],[35,18],[55,8]] },
  ];

  blockRows.forEach(({ y, h, blocks }) => {
    blocks.forEach(([x, w]) => {
      if (x + w > size - 1) w = size - 1 - x;
      rect(x, y, w, h, '#2e2e3e');
      rect(x+1, y+1, w-2, h-2, '#323244');
      hline(y,     x, x+w-1, '#3e3e52');
      vline(x,     y, y+h-1, '#3a3a4e');
      hline(y+h-1, x, x+w-1, '#1a1a26');
      vline(x+w-1, y, y+h-1, '#1e1e2a');
      set(x+w-1, y+h-1, '#14141e');
      // grieta
      if ((x+y) % 3 === 0 && w > 8) {
        const cy = y + Math.floor(h/2);
        const cx = x + 3;
        hline(cy,   cx, cx+6, '#10101a');
        hline(cy+1, cx+2, cx+5, '#10101a');
      }
      // humedad + musgo
      if ((x*y) % 5 === 0 && h > 4) {
        rect(x+2, y+h-4, 3, 3, '#1a1a2a');
        set(x+2, y+h-4, '#1a2e14');
        set(x+3, y+h-3, '#1e3418');
      }
      // marcas de cincel
      if (w > 10) {
        vline(x + Math.floor(w/3),   y+2, y+h-3, '#2a2a3a');
        vline(x + Math.floor(2*w/3), y+2, y+h-3, '#2a2a3a');
      }
    });
  });
});
```

---

## Tile 5: `royal_stone` — Taskoria Keep

**Paleta:** losas pulidas azul-gris con detalles dorados
**Patrón:** 4 losas grandes en 2×2, medallón dorado central, reflejos

```js
export const royal_stone = makeSprite(({ rect, hline, vline, set, size }) => {
  rect(0, 0, size, size, '#16162a');

  const slabs = [
    { x: 1,  y: 1,  w: 30, h: 30, base: '#242438', hi: '#30304c', sh: '#14142a' },
    { x: 33, y: 1,  w: 30, h: 30, base: '#222236', hi: '#2e2e4a', sh: '#12122a' },
    { x: 1,  y: 33, w: 30, h: 30, base: '#262640', hi: '#32324e', sh: '#16162c' },
    { x: 33, y: 33, w: 30, h: 30, base: '#242438', hi: '#30304c', sh: '#14142a' },
  ];

  slabs.forEach(({ x, y, w, h, base, hi, sh }) => {
    rect(x, y, w, h, base);
    rect(x+2, y+2, w-4, h-4, hi);
    hline(y,   x, x+w-1, '#3e3e5a');
    hline(y+1, x, x+w-1, '#38384e');
    vline(x,   y, y+h-1, '#38385a');
    vline(x+1, y, y+h-1, '#343448');
    hline(y+h-1, x, x+w-1, sh);
    hline(y+h-2, x, x+w-1, '#1a1a2e');
    vline(x+w-1, y, y+h-1, sh);
    vline(x+w-2, y, y+h-1, '#1c1c30');
    set(x+w-1, y+h-1, '#0e0e1c');
    // reflejo pulido
    rect(x+3, y+3, 6, 6, '#2e2e50');
    // inscripción geométrica
    hline(y + Math.floor(h/2), x+4, x+w-5, '#1e1e38');
    vline(x + Math.floor(w/2), y+4, y+h-5, '#1e1e38');
  });

  // Detalles dorados en juntas
  rect(30, 0, 4, size, '#ffd70015');
  rect(0, 30, size, 4, '#ffd70015');
  [[31,31],[32,31],[31,32],[32,32]].forEach(([x,y]) => set(x, y, '#ffd70044'));

  // Medallón central
  const cx = 32, cy = 32;
  set(cx,   cy-1, '#ffd70066'); set(cx-1, cy, '#ffd70066');
  set(cx+1, cy,   '#ffd70066'); set(cx,   cy+1, '#ffd70066');
  set(cx,   cy,   '#ffd700aa');

  // Esquinas decorativas
  [[3,3],[33,3],[3,33],[33,33]].forEach(([ox,oy]) => {
    set(ox,   oy,   '#ffd70033');
    set(ox+1, oy,   '#ffd70022');
    set(ox,   oy+1, '#ffd70022');
  });
});
```

---

## Tile 6: `stone_path` — Caminos exteriores

```js
export const stone_path = makeSprite(({ rect, hline, set, size }) => {
  rect(0, 0, size, size, '#4a4a58');

  const stones = [
    [2,3,12,6],[16,1,10,7],[28,2,9,7],
    [2,11,8,7],[12,10,14,8],[28,10,10,8],
    [2,20,10,7],[14,19,12,8],[28,20,9,7],
    [2,29,14,8],[18,28,10,8],[30,29,8,8],
  ];
  stones.forEach(([x,y,w,h]) => {
    rect(x, y, w, h, '#666678');
    hline(y,     x, x+w-1, '#7a7a8e');
    hline(y+h-1, x, x+w-1, '#3a3a48');
    set(x+w-1, y+h-1, '#2e2e3c');
  });
});
```

---

## Cómo Integrar en sprites.jsx

```js
// Al final de sprites.jsx, añadir al export:
export const SPRITES = {
  // ... sprites existentes ...
  cobblestone_warm,
  wood_floor,
  grass_dense,
  dungeon_stone,
  royal_stone,
  stone_path,
};

// En MapData.js, asignar:
townSquare:    { tileSprite: 'cobblestone_warm', ... }
tavernInterior:{ tileSprite: 'wood_floor', ... }
mysticForest:  { tileSprite: 'grass_dense', ... }
shadowCrypts:  { tileSprite: 'dungeon_stone', ... }
taskoriaKeep:  { tileSprite: 'royal_stone', ... }
```
