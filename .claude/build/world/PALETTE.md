# Taskoria World — Paletas y Técnicas Visuales

## Paleta Base por Bioma

### Town Square — Adoquín cálido
```
Mortero:     #4a3e2e
Piedra base: #b8a882
Highlight:   #d4c49c  #c8b48e
Sombra:      #9e8e72  #8a7a62
Variación:   #c0b08a
Grietas:     #6a5a48
Musgo:       #3a5a20  #2a4a18
```

### Tavern Interior — Madera oscura
```
Junta:       #3a1e0a
Tablón A:    #7a4820  (claro)
Tablón B:    #6b3c1a  (oscuro)
Highlight:   #9a6030  #c08040
Sombra:      #5a3010  #4a2808
Veta:        #6a3a18  #5a3010
Nudo:        #3a1e08
Separación:  #5a3218
```

### Mystic Forest — Hierba saturada
```
Base:        #2d5a1b
Cuadrante 1: #336620  (más claro)
Cuadrante 2: #2a5218  (más oscuro)
Cuadrante 3: #306018
Cuadrante 4: #38701e
Brizna base: #4a9a28
Brizna mid:  #5aaa30
Brizna hi:   #6ab838
Flores:      ver sección Estaciones
```

### Shadow Crypts — Piedra de mazmorra
```
Mortero:     #0e0e16
Bloque:      #2e2e3e
Cara:        #323244
Highlight:   #3e3e52  #3a3a4e
Sombra:      #1a1a26  #1e1e2a
Corner:      #14141e
Grieta:      #10101a
Humedad:     #1a1a2a
Musgo:       #1a2e14  #1e3418
Cincel:      #2a2a3a
```

### Taskoria Keep — Losas reales
```
Junta:       #16162a
Losa A:      #242438
Losa B:      #222236
Cara A:      #30304c  #2e2e4a
Cara B:      #32324e
Highlight:   #3e3e5a  #38384e  #38385a  #343448
Sombra:      #14142a  #12122a  #16162c  #1a1a2e  #1c1c30
Corner:      #0e0e1c
Gold accent: #ffd70066  #ffd70044  #ffd700aa  #ffd70033
```

### Stardew Village — Paja y madera
```
Paja cima:   #f0d870
Paja base:   #e0c050
Paja mid:    #c8a030
Paja alero:  #a07820
Paja sombra: #785a10
Paja dark:   #504008

Vigas hi:    #e0a060
Vigas claro: #c07840
Vigas mid:   #905828
Vigas base:  #6a3e18  ← COLOR PRINCIPAL
Vigas sombra:#4a2a0a
Vigas dark:  #2e1806

Yeso hi:     #faf4e0
Yeso base:   #f0e4c8
Yeso sombra: #dcd0a8
Yeso dark:   #c8ba90

Tejado marrón hi:  #e09858
Tejado marrón base:#c07838
Tejado marrón mid: #9a5828
Tejado marrón sh:  #784018
Tejado marrón dk:  #58280c
```

---

## Paleta de Hierba por Estación

```js
const SEASON_GRASS = {
  spring: ['#4a9a28','#5ab030','#70c840','#84d848'],  // verde saturado
  summer: ['#3a8020','#4a9428','#5aaa30','#6aba38'],  // verde más oscuro
  fall:   ['#8a8830','#9a9838','#aaa840','#bab848'],  // amarillo-verde
  winter: ['#c8d4d8','#d4e0e4','#e0ecf0','#ecf4f8'],  // blanco-azulado
};
```

## Flores por Estación

```js
const SEASON_FLOWERS = {
  spring: ['#f878a0','#f8e060','#c0f0e0','#d0a0f8'],  // rosa, amarillo, celeste, lavanda
  summer: ['#f89030','#f8e040','#50d060','#f86050'],  // naranja, amarillo, verde, rojo
  fall:   ['#e86020','#d08020','#e09020','#c04020'],  // terracota, marrón, ámbar, rojo
  winter: ['#d0e8f8','#c8e0f0','#b8d8e8','#e8f4fc'],  // azules helados
};
```

---

## Técnicas de Dithering

### Bayer 4×4 (la estándar para Taskoria)

```js
const BAYER4 = [
  [ 0,  8,  2, 10],
  [12,  4, 14,  6],
  [ 3, 11,  1,  9],
  [15,  7, 13,  5],
];

// threshold: 0-15
// bajo threshold (0-5) → casi todo c2
// threshold 8 → 50/50
// alto threshold (10-15) → casi todo c1
function dither(x, y, c1, c2, threshold) {
  const bv = BAYER4[y % 4][x % 4];
  return bv < threshold ? c2 : c1;
}
```

### Cuándo usar dithering en Taskoria

| Elemento | Dithering | Notas |
|----------|-----------|-------|
| Tejado paja | ✅ SÍ | Transición entre bandas de color |
| Tejado madera | ✅ SÍ | Borde entre tejas |
| Fachada iluminada→sombra | ✅ SÍ | ~35% de altura |
| Suelo piedra | ✅ SÍ | Variación de color entre bloques |
| Suelo hierba | ✅ SÍ | Transición entre cuadrantes |
| Agua | ❌ NO | Ondas animadas, no dithering |
| Cristal ventana | ❌ NO | Superficie pulida |
| Armaduras NPC | ❌ NO | Metal pulido |
| Piel NPC | ❌ NO | Textura suave |
| Alero del tejado | ✅ SÍ | Borde fibras→sombra |

### Perspectiva 3/4

```js
// La cara sur de cada edificio se ve en perspectiva 3/4
// perspH: píxeles de cara visible (típico: 8-12px)

// Color de la cara sur = roofDark oscurecido ~30%
function darken(hex, factor) {
  const r = parseInt(hex.slice(1,3),16) * factor;
  const g = parseInt(hex.slice(3,5),16) * factor;
  const b = parseInt(hex.slice(5,7),16) * factor;
  return `rgb(${Math.round(r)},${Math.round(g)},${Math.round(b)})`;
}

const southFaceColor = darken(roofDark, 0.7);
// Pintar franja perspH píxeles de altura bajo el alero
```

---

## Iluminación Ambiental por Mapa

| Mapa | Día | Noche | Notas |
|------|-----|-------|-------|
| townSquare | 0.85 | 0.35 | Luz solar + antorchas |
| tavernInterior | 0.60 | 0.40 | Luz de velas siempre |
| taskoriaKeep | 0.35 | 0.15 | Muy oscuro, antorchas focales |
| mysticForest | 0.45 | 0.20 | Dosel de árboles |
| shadowCrypts | 0.18 | 0.08 | Casi oscuridad total |

### Cómo aplicar iluminación

```js
// 1. Oscurecer todo el frame con ImageData
const imageData = ctx.getImageData(0, 0, W, H);
const d = imageData.data;
for (let i = 0; i < d.length; i += 4) {
  d[i]   = d[i]   * ambientLight;
  d[i+1] = d[i+1] * ambientLight;
  d[i+2] = d[i+2] * ambientLight;
}
ctx.putImageData(imageData, 0, 0);

// 2. Añadir halos de antorcha encima (composite 'lighter')
decorations.filter(d => d.type === 'torch').forEach(torch => {
  const lx = (torch.x + 0.5) * TILE_SIZE;
  const ly = (torch.y + 0.5) * TILE_SIZE - 8;
  const radius = TILE_SIZE * (1.8 + Math.sin(frame * 0.07 + torch.x) * 0.12);
  const flicker = 0.55 + Math.sin(frame * 0.1 + torch.y) * 0.08;

  const grd = ctx.createRadialGradient(lx, ly, 0, lx, ly, radius);
  grd.addColorStop(0,   `rgba(255,200,80,${flicker})`);
  grd.addColorStop(0.4, `rgba(255,140,40,0.22)`);
  grd.addColorStop(0.7, `rgba(255,80,20,0.08)`);
  grd.addColorStop(1,   `rgba(0,0,0,0)`);

  ctx.globalCompositeOperation = 'lighter';
  ctx.fillStyle = grd;
  ctx.beginPath();
  ctx.ellipse(lx, ly, radius, radius * 0.85, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalCompositeOperation = 'source-over';
});
```

---

## Sub-pixel Highlighting (nivel profesional)

Para ventanas, armaduras y superficies pulidas:

```js
// Cristal de ventana — 3px en diagonal top-left
ctx.fillStyle = '#e8f4fc';
ctx.fillRect(wx+4, wy+4, 5, 1);  // horizontal
ctx.fillStyle = '#d8eef8';
ctx.fillRect(wx+4, wy+4, 1, 5);  // vertical
ctx.fillStyle = 'rgba(255,255,255,0.3)';
ctx.fillRect(wx+4, wy+4, 3, 3);  // esquina brillante

// Metal de armadura — highlight puntual
ctx.fillStyle = '#ffffff';
ctx.fillRect(armorX + 2, armorY + 1, 1, 1);  // solo 1px

// Losa de piedra — reflejo sutil
ctx.fillStyle = '#ffffff08';
ctx.fillRect(slabX+3, slabY+3, 8, 8);
```
