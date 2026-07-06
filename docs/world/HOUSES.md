# Taskoria World — Casas y Edificios

## Decisión de Diseño

Las casas siguen la estética **Stardew Valley** adaptada a medievalismo:
- Tejados de **paja dorada** (signature SDV) o madera/piedra
- Fachada **half-timber**: yeso crema + vigas diagonales X en madera oscura
- **Macetero de flores** en cada ventana (cambia por estación)
- Perspectiva **3/4**: franja oscura visible bajo el alero
- **Dithering Bayer 4×4** en transiciones de tejado

---

## Paleta Oficial (Stardew Valley)

```js
// TEJADO PAJA (5 tonos — de cima oscura a alero)
sw0: '#f0d870'  // highlight cima
sw1: '#e0c050'  // base cima
sw2: '#c8a030'  // medio
sw3: '#a07820'  // base alero
sw4: '#785a10'  // sombra alero
sw5: '#504008'  // alero máximo

// MADERA HALF-TIMBER (5 tonos)
hw0: '#e0a060'  // highlight
hw1: '#c07840'  // medio claro
hw2: '#905828'  // medio
hw3: '#6a3e18'  // base (COLOR PRINCIPAL VIGAS)
hw4: '#4a2a0a'  // sombra
hw5: '#2e1806'  // sombra profunda

// FACHADA CREMA (4 tonos)
pl0: '#faf4e0'  // iluminado
pl1: '#f0e4c8'  // base
pl2: '#dcd0a8'  // sombra
pl3: '#c8ba90'  // sombra profunda

// TEJADO MARRÓN — taberna/iglesia (5 tonos)
br0: '#e09858'  // highlight
br1: '#c07838'  // base clara
br2: '#9a5828'  // base
br3: '#784018'  // sombra
br4: '#58280c'  // sombra profunda

// PUERTA (2 tonos)
door_base:  '#8a5228'
door_light: '#aa6838'
door_dark:  '#5a3010'
door_knob:  '#d8a030'  // pomo dorado
```

---

## Anatomía de una Casa (vista top-down 3/4)

```
┌─────────────────────────────────┐
│  CHIMENEA (opcional, lado N)    │ ← overhead, se pinta encima del jugador
├─────────────────────────────────┤
│  TEJADO PAJA / MADERA / PIEDRA  │ ← rh = H * 0.40
│  (haces horizontales + alero)   │
├─────────────────────────────────┤ ← CARA SUR (perspectiva 3/4, 8px oscuros)
│  [V] FACHADA [V] [FACHADA] [V]  │ ← pl1 + vigas hw3
│  half-timber: X diagonal + H    │
│  [VENTANA+FLORES] [VENTANA]     │
│           [PUERTA+ESCALÓN]      │
└─────────────────────────────────┘
       ↓ sombra proyectada (SE)
```

### Capas de renderizado (orden correcto)
1. Sombra en suelo
2. Tejado
3. Cara sur (perspectiva 3/4) — franja oscura bajo alero
4. Fachada crema
5. Entramado half-timber (vigas)
6. Ventanas + maceteros
7. Puerta + escalón
8. Chimenea + humo (se pinta en overhead layer)

---

## Tipos de Tejado

### `thatch` — Paja dorada (casas de aldeano, granja)
- Haces de 4px ancho, horizontales
- 5 bandas de color de cima a alero
- Dithering Bayer 4×4 entre bandas
- Alero: sobresale 4px a cada lado, fibras visibles
- Cumbrera: 2px oscuros en el borde superior

### `wood` — Tablones de madera (taberna, tienda)
- Tejas de 8×6px en damero
- 2 tonos alternados por fila
- Highlight en borde superior, sombra en inferior
- Alero: viga de madera hw2

### `stone` — Pizarra (iglesia, manor, castillo)
- Sillería irregular: bloques de 14-20px ancho × 8px alto
- Aparejo alternado (offset en filas pares)
- Grietas ocasionales
- Alero: moldura de piedra

### `dark` — Pizarra oscura (herrería, almacén)
- Como `stone` pero paleta más oscura
- Sin highlight en tejas

---

## Tipos de Fachada

### `halftimber` — Half-timber (casa estándar)
- Base: `pl1` (#f0e4c8)
- Zona superior iluminada (35%): `pl0`
- Dithering en transición iluminado/sombra
- Pilares verticales: `hw3`, 3px ancho, en bordes + intermedios
- Viga horizontal top + mid + zócalo
- Diagonales X en cada sección (TL→BR y TR→BL)
- Zócalo inferior: `hw3` 6px, highlight `hw2`

### `plaster` — Yeso liso (casas pobres)
- Sin vigas diagonales
- Solo pilares laterales
- Líneas de rejuntado horizontales cada 8px

### `wood` — Tablones verticales (almacén, establo)
- Tablas de 8px, alternando 2 tonos
- Sin yeso visible

### `stone` — Sillería (iglesia, ruinas)
- Bloques de piedra con aparejo
- Sin yeso ni vigas

---

## Ventana con Macetero (Stardew signature)

```
┌────────────────────┐
│  hw3 marco externo │
│ ┌──────────────┐   │
│ │ cristal azul │   │ ← 'b0d8e8' día / 'f8d870' noche
│ │ [highlight]  │   │ ← 3px diagonal top-left
│ │──────────────│   │ ← parteluz horizontal
│ └──────────────┘   │
│ ┌──macetero───┐    │ ← terracota '#b86030'
│ │ [fl][fl][fl]│    │ ← 3 flores por estación
│ └─────────────┘    │
└────────────────────┘
```

### Flores por estación
```js
spring: ['#f878a0', '#f8e060', '#c0f0e0']  // rosa, amarillo, celeste
summer: ['#f89030', '#f8e040', '#50d060']  // naranja, amarillo, verde
fall:   ['#e86020', '#d08020', '#e09020']  // terracota, marrón, ámbar
winter: ['#d0e8f8', '#c8e0f0', '#b8d8e8']  // azules gélidos / nieve
```

---

## Presets del House Builder

### `farmhouse` — Casa de granja
```js
{
  roofType: 'thatch',
  roofRatio: 38,        // tejado ocupa 38% de la altura
  eaveSize: 6,          // alero 6px
  perspH: 10,           // cara sur 10px
  facadeType: 'halftimber',
  beamCount: 3,
  winCount: 1,
  flowerBox: true,
  doorType: 'arch',
  chimney: true,
  smoke: true,
  roofLight: '#e0c050',
  roofDark: '#786010',
  plasterCol: '#f0e8c0',
  beamCol: '#6a3e18',
  doorCol: '#8a5228',
}
```

### `tavern` — Taberna
```js
{
  roofType: 'wood',
  roofRatio: 42,
  eaveSize: 7,
  perspH: 12,
  facadeType: 'halftimber',
  beamCount: 4,
  winCount: 2,
  flowerBox: true,
  doorType: 'double',
  chimney: true,
  smoke: true,
  sign: true,
  roofLight: '#c87838',
  roofDark: '#6a3010',
  plasterCol: '#f0e8c0',
  beamCol: '#5a3010',
  doorCol: '#6a3818',
}
```

### `church` — Iglesia
```js
{
  roofType: 'stone',
  roofRatio: 50,
  eaveSize: 4,
  perspH: 8,
  facadeType: 'stone',
  beamCount: 2,
  winCount: 2,
  flowerBox: false,
  doorType: 'arch',
  chimney: false,
  roofLight: '#989898',
  roofDark: '#484848',
  plasterCol: '#c8c8c0',
  beamCol: '#484848',
  doorCol: '#5a3810',
}
```

### `smithy` — Herrería
```js
{
  roofType: 'dark',
  roofRatio: 35,
  eaveSize: 4,
  perspH: 8,
  facadeType: 'wood',
  beamCount: 2,
  winCount: 1,
  flowerBox: false,
  doorType: 'flat',
  chimney: true,
  smoke: true,
  roofLight: '#585858',
  roofDark: '#202020',
  plasterCol: '#a09080',
  beamCol: '#483020',
  doorCol: '#3a2010',
}
```

### `shop` — Tienda / comercio
```js
{
  roofType: 'wood',
  roofRatio: 36,
  eaveSize: 5,
  perspH: 10,
  facadeType: 'halftimber',
  beamCount: 3,
  winCount: 2,
  flowerBox: true,
  doorType: 'arch',
  chimney: false,
  sign: true,
  roofLight: '#b07030',
  roofDark: '#603010',
  plasterCol: '#f8f0d8',
  beamCol: '#6a3e18',
  doorCol: '#7a4820',
}
```

### `manor` — Manor / noble
```js
{
  roofType: 'stone',
  roofRatio: 45,
  eaveSize: 8,
  perspH: 14,
  facadeType: 'halftimber',
  beamCount: 4,
  winCount: 3,
  flowerBox: true,
  doorType: 'double',
  chimney: true,
  smoke: true,
  roofLight: '#4868a0',
  roofDark: '#1a2848',
  plasterCol: '#e8e0c8',
  beamCol: '#483020',
  doorCol: '#5a3010',
}
```

---

## Output del House Builder → MapData.js

El House Builder exporta este formato. Integrarlo en `MapData.js`:

```js
// Ejemplo — añadir en decorations[] o como obstáculo con renderer propio
{
  type: 'building',
  roofType: 'wood',
  facadeType: 'halftimber',
  wins: 2,
  chimney: true,
  doorType: 'arch',
  colors: {
    roofLight: '#e0c050',
    roofDark:  '#806010',
    plaster:   '#f0e8c0',
    beams:     '#6a3e18',
    door:      '#8a5228',
  },
  x: 5,   // en tiles
  y: 3,
  w: 3,   // ancho en tiles
  h: 5,   // alto en tiles
}
```

---

## Técnicas de Renderizado

### Dithering Bayer 4×4
```js
const BAYER = [
  [ 0, 8, 2,10],
  [12, 4,14, 6],
  [ 3,11, 1, 9],
  [15, 7,13, 5],
];

// Usar en transiciones de tejado:
for(let px=0; px<w; px++){
  const bv = BAYER[y%4][(x+px)%4];
  ctx.fillStyle = bv < threshold ? c2 : c1;
  ctx.fillRect(x+px, y, 1, 1);
}
```

### Perspectiva 3/4
```js
// Franja oscura debajo del alero
const perspH = 8; // px de cara sur visible
const southFaceColor = darken(roofDark, 0.7);
ctx.fillRect(bx - eave, by + roofH, bw + eave*2, perspH);
// Dithering en la transición
// → resultado: sensación de volumen y profundidad
```

### Y-Sorting (orden de renderizado)
```js
// Ordenar todos los objetos por su base antes de pintar
const queue = objects.sort((a, b) => 
  (a.y + a.h) - (b.y + b.h)
);
queue.forEach(obj => obj.draw(ctx));
// → los objetos al norte se pintan debajo de los del sur
```

---

## Proceso para Añadir un Edificio Nuevo

1. Definir el preset en el House Builder
2. Ajustar visualmente en el editor (zoom 4×)
3. Validar en el strip de estaciones (4 variantes)
4. Exportar con "📋 COPIAR MapData"
5. Pegar en `MapData.js` en el array `obstacles[]` del mapa correspondiente
6. En `PlayableWorld.jsx`, añadir case en el switch de renderizado de buildings
7. Verificar colisiones con los tiles adyacentes
