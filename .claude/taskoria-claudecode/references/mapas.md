# MapData + World Sprites — Guía de Integración

## PlayableWorld — arquitectura del motor

### Stack tecnológico del motor
- React DOM (no canvas) — cada tile/prop es un `<div>` o `<PixelSprite>`
- 60fps via `requestAnimationFrame` + mutación directa de DOM refs
- `TILE_SIZE = 40px` (tamaño de cada tile en pantalla)
- Colisiones: rectangulares AABB contra array `obstacles`
- Portales: transición fade-negro entre mapas
- NPCs: wandering + path-to-player

---

## Estructura de un mapa (MapData.js)

```js
export const MAP_DATA = {
  nombreMapa: {
    id: 'nombreMapa',
    name: 'Nombre Visible',
    width: 1600,         // px totales del mapa (múltiplo de TILE_SIZE=40)
    height: 1000,
    baseColor: '#2b1f1a', // color de suelo fallback
    tileSprite: 'cobblestone_tile', // nombre de sprite en sprites.jsx (para suelo tileable)
    tileSize: 64,         // tamaño del tile en px en pantalla
    spawn: { x: 800, y: 500 }, // posición inicial del jugador

    // Colisiones — rectángulos sólidos
    obstacles: [
      { x: 0, y: 0, width: 1600, height: 40 },   // pared norte
      { x: 0, y: 960, width: 1600, height: 40 },  // pared sur
      { x: 0, y: 0, width: 40, height: 1000 },    // pared oeste
      { x: 1560, y: 0, width: 40, height: 1000 }, // pared este
      // Props sólidos:
      { x: 752, y: 352, width: 96, height: 96, type: 'well' },
      { x: 170, y: 230, width: 280, height: 150, type: 'shop' },
    ],

    // Zonas de interacción (acercar el personaje → botón E aparece)
    interactables: [
      { x: 230, y: 390, width: 160, height: 120, radius: 120, target: 'shop', label: 'Tienda' },
      { x: 1180, y: 780, width: 220, height: 130, radius: 130, target: 'sanctuary', label: 'Santuario' }
    ],

    // Portales (transición a otro mapa)
    portals: [
      {
        x: 950, y: 40, width: 100, height: 60,
        targetMap: 'tavernInterior',  // clave en MAP_DATA
        targetX: 400, targetY: 600,   // spawn en el mapa destino
        label: 'Tavern'
      }
    ],

    // Decoraciones visuales (no tienen colisión)
    decorations: [
      // Tiles de suelo personalizados
      { type: 'rect', x: 560, y: 200, width: 480, height: 480, color: '#8a7a5c', opacity: 0.18, radius: '9999px', z: 0 },

      // Props usando sprites de sprites.jsx
      { type: 'sprite', name: 'nombre_sprite', x: 800, y: 400, scale: 1.5, z: 2 },

      // Tipos especiales disponibles:
      { type: 'well', x: 752, y: 352, width: 96, height: 96 },
      { type: 'bench', x: 624, y: 520, size: 60 },
      { type: 'flowers', x: 760, y: 470, size: 30 },
      { type: 'torch', x: 200, y: 300 },
      { type: 'cobble_patch', x: 800, y: 500, width: 220, height: 140, color: '#6b5240', opacity: 0.55, z: 0 },
      { type: 'crack', x: 700, y: 520, length: 80, angle: 15, z: 0 },
      { type: 'puddle', x: 720, y: 660, size: 70, z: 0 },

      // Árboles / vegetación (JSX directo)
      // { type: 'tree_pixel', x: 400, y: 100 }  ← si se añade a sprites.jsx
    ]
  }
}
```

## Mapas existentes

```
townSquare    — Plaza central, hub principal. 1600×1000
tavernInterior — Interior de la taberna. Tono cálido
mysticForest  — Bosque místico. Verde oscuro
taskoriaKeep  — Castillo/fortaleza de Taskoria
```

## Añadir un nuevo mapa

### 1. Definir en MapData.js
```js
export const MAP_DATA = {
  // ... mapas existentes ...
  miNuevoMapa: {
    id: 'miNuevoMapa',
    name: 'Nombre del Lugar',
    width: 2000,
    height: 1200,
    baseColor: '#1a1a2e',    // fondo oscuro para dungeon
    tileSprite: null,        // o nombre de sprite si se crea uno
    spawn: { x: 1000, y: 600 },
    obstacles: [
      { x: 0, y: 0, width: 2000, height: 40 },
      { x: 0, y: 1160, width: 2000, height: 40 },
      { x: 0, y: 0, width: 40, height: 1200 },
      { x: 1960, y: 0, width: 40, height: 1200 },
    ],
    interactables: [],
    portals: [
      { x: 980, y: 1160, width: 40, height: 40, targetMap: 'townSquare', targetX: 950, targetY: 100, label: 'Volver' }
    ],
    decorations: []
  }
}
```

### 2. Añadir portal desde el mapa origen
```js
// En el mapa que conecta con el nuevo (ej: townSquare)
portals: [
  // ...existentes...
  { x: 500, y: 40, width: 80, height: 60, targetMap: 'miNuevoMapa', targetX: 1000, targetY: 500, label: 'Mi Nuevo Mapa' }
]
```

---

## World Sprites (sprites.jsx)

### Cómo se usan los sprites
Los sprites son **arrays de 4096 colores HEX** (64×64 píxeles, left-to-right, top-to-bottom).
- `'transparent'` = píxel vacío
- Cualquier string HEX = `'#RRGGBB'`

El **Pixel Studio** (`sangar.studio/rpg`) tiene botón "Generar Código" que exporta directamente este formato.

### Estructura en sprites.jsx
```js
export const SPRITES = {
  cobblestone_tile: [/* 4096 colores */],
  // Añadir aquí:
  mi_nuevo_sprite: [/* 4096 colores */],
};
```

### Uso en MapData.js (como tile de suelo)
```js
// Para suelo tileable (se repite en tile grid del mapa)
tileSprite: 'mi_nuevo_sprite',
tileSize: 64,
```

### Uso en MapData.js (como prop decorativo)
```js
// En decorations del mapa
{ type: 'sprite', name: 'mi_nuevo_sprite', x: 400, y: 300, scale: 2, z: 3 }
```

### Workflow recomendado para crear sprites

**Opción A (recomendada): Usar el Pixel Studio integrado**
1. Ir a `sangar.studio/rpg` → Studio (nav)
2. Dibujar el tile/prop en el editor 64×64
3. Click "Generar Código" → copia el JSON
4. Pegar en `SPRITES` en `sprites.jsx`

**Opción B: Generar programáticamente**
```js
// Ejemplo: crear un tile de piedra programáticamente
function makeStoneTile() {
  const buffer = new Array(64 * 64).fill('transparent');
  // ... lógica de generación ...
  return buffer;
}
export const SPRITES = {
  stone_tile: makeStoneTile(),
};
```

**Opción C: Generar con Claude (para este skill)**
Claude puede generar el array de colores directamente especificando:
- Diseño en ASCII con leyenda de colores
- Conversión programática al array de 4096

### Sprites sugeridos para añadir

```
dungeon_floor    — suelo de mazmorra (piedra gris con juntas oscuras)
dungeon_wall     — pared de mazmorra (bloques de piedra)
forest_floor     — suelo de bosque (hierba texturizada)
grass_tile       — hierba simple para exterior
wood_floor       — suelo de madera (tablas)
lava_tile        — lava con brillo animado
ice_tile         — hielo azul con reflejos
sand_tile        — arena del desierto
water_tile       — agua azul con ondas
```

---

## GardenView — Elementos CSS del Escenario

El GardenView es el escenario visual del **Dashboard principal** (no el mundo jugable). Es JSX+CSS puro, sin canvas.

### Escenarios disponibles
```js
let activeScenario = 'garden';       // campo base (default)
if (character?.isResting) activeScenario = 'inn';  // posada
// 'sanctuary' — santuario de mascotas (activado desde PartyView)
```

### Cómo añadir elementos visuales al Garden

Los elementos se añaden como JSX dentro del componente `GardenView.jsx`. Clases CSS disponibles:
- `animate-sway` — balanceo suave (árboles, plantas)
- `animate-flicker` — parpadeo (antorchas, fuego)
- `animate-breathe` — respiración/pulso suave
- `animate-rise` — humo ascendente
- `animate-bounce-slow` — rebote lento
- `image-rendering: pixelated` — crítico para pixel art escalado

**Ejemplo: añadir un árbol pixel art como div CSS**
```jsx
{/* Árbol pixel art — añadir dentro del return de GardenView */}
<div
  className="absolute animate-sway"
  style={{ left: '20%', bottom: '30%', zIndex: 3 }}
>
  {/* Copa */}
  <div style={{
    width: 48, height: 40,
    backgroundColor: '#27ae60',
    borderRadius: '50% 50% 30% 30%',
    boxShadow: 'inset -4px -4px 0 #1e8449, inset 4px 4px 0 #2ecc71',
    imageRendering: 'pixelated'
  }} />
  {/* Tronco */}
  <div style={{
    width: 12, height: 20,
    backgroundColor: '#8b5e3c',
    margin: '0 auto',
    boxShadow: 'inset -2px 0 0 #5c3a1e'
  }} />
</div>
```

**Añadir un nuevo escenario (ej: 'dungeon')**
```jsx
// En GardenView.jsx, añadir caso en el bloque de renderizado
{activeScenario === 'dungeon' && (
  <div className="absolute inset-0 bg-[#1a1a2e] ...">
    {/* elementos del dungeon */}
  </div>
)}
```
