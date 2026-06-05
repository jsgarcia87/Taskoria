# Nueva Mascota + Catálogo PixelIcon — Guía de Integración

---

# 🐾 NUEVA MASCOTA

## Mascotas existentes y sus formatos
```
32×32: slime, phoenix, dragon_egg
64×64: wolf, dragon, lion, dragon_fire, dragon_frost, wolf_arctic, lion_desert
```

## Estructura en pet_blueprints.json

### Formato 32×32 (mascotas simples/chibis)
```json
{
  "NuevaMascota": {
    "paleta": {
      " ": "transparent",
      "A": "#COLOR_PRINCIPAL",
      "B": "#COLOR_SOMBRA",
      "C": "#COLOR_OSCURO",
      "D": "#COLOR_HIGHLIGHT",
      "E": "#ffffff",
      "F": "#000000"
    },
    "blueprint": [
      "                                ",  ← 32 strings de 32 chars
      "            FFFFFF              ",
      "           FXXXXF               ",
      ...
      "                                "
    ],
    "gridSize": 32
  }
}
```

### Formato 64×64 (mascotas detalladas)
```json
{
  "NuevaMascota": {
    "paleta": { ... hasta 12 claves ... },
    "blueprint": [
      /* 64 strings de 64 chars */
    ],
    "gridSize": 64
  }
}
```
**Nota:** Los 64×64 se normalizan con `scale * 0.5` en `ModernPixelPet.jsx` para igualar visualmente a los 32×32.

## Customización de color — actualizar ModernPixelPet.jsx

Añadir el caso para la nueva mascota en la lógica de recolor:
```js
// En ModernPixelPet.jsx, dentro del bloque de customColors
} else if (type.includes('NombreMascota')) {
    paleta['B'] = p;                    // color primario customizado
    paleta['C'] = shadeHex(p, -0.3);   // sombra auto-calculada
    paleta['A'] = shadeHex(p, -0.1);   // semi-sombra
}
```

## Registro en PetContext / opciones de creación de personaje

Buscar en el proyecto donde se listan las mascotas disponibles para el usuario y añadir la entrada correspondiente.

## Paletas de referencia para mascotas

### Mascotas de tipo elemental
```
FUEGO:   primario=#e74c3c  sombra=#c0392b  highlight=#ff6b6b  detalles=#f39c12
AGUA:    primario=#3498db  sombra=#2980b9  highlight=#74b9ff  detalles=#00cec9
TIERRA:  primario=#8b4513  sombra=#5d2e0a  highlight=#a0522d  detalles=#27ae60
AIRE:    primario=#dfe6e9  sombra=#b2bec3  highlight=#ffffff  detalles=#74b9ff
```

### Mascotas mágicas
```
HADA:    primario=#fd79a8  sombra=#e84393  highlight=#fdcfe8  detalles=#a29bfe
FANTASMA: primario=#636e72 sombra=#2d3436  highlight=#b2bec3  detalles=#00cec9
ESPECTRO DORADO: primario=#f9ca24 sombra=#f0932b highlight=#ffed4a detalles=#ffffff
```

### Mascotas animales fantásticos (extensiones de existentes)
```
wolf_shadow:  primario=#2d3436  sombra=#1a1a2e  highlight=#636e72  (variante oscura)
dragon_void:  primario=#6c5ce7  sombra=#5a4fcf  highlight=#a29bfe   (variante arcana)
lion_storm:   primario=#2d3436  sombra=#636e72  highlight=#b2bec3   (variante tormenta)
```

---

# 🔷 PIXELICON — Catálogo y Guía

## Iconos existentes (PixelIcon.jsx)

### Mapa de iconos actuales
```
sword     → espada diagonal (nav: Studio)
home      → casa con tejado (nav: Camp)
user      → silueta persona (nav: Hero)
shoppingBag → bolsa tienda (nav: Shop)
checkSquare → check tick (Quest Log)
skull     → calavera RPG (Boss Battle)
trophy    → trofeo (nav: World)
book      → libro abierto (nav: Diary)
zap       → rayo (stats Dex/velocidad)
box       → caja 3D (inventory/items)
coins     → monedas stack (gold display)
clock     → reloj circular (timer/time)
shield    → escudo (defensa/admin)
shirt     → camiseta (equipamiento)
bell      → campana (notificaciones)
users     → dos personas (party/social)
```

## Añadir nuevo PixelIcon en PixelIcon.jsx

### Ubicación exacta en el código
```js
// En src/components/common/PixelIcon.jsx
// Dentro del objeto ICONS = { ... }
// Añadir al final, antes del cierre }

  nuevoIcono: [
    "........",
    ".######.",
    "##....##",
    "........",
    "........",
    "##....##",
    ".######.",
    "........"
  ],
```

### Reglas de diseño 8×8

**Estructurales:**
- Resolución: exactamente 8×8 caracteres
- `#` = píxel relleno, `.` = transparente
- El color se hereda del padre (`color` prop o `className`)
- Sin antialiasing: bordes duros únicamente

**Visuales (coherencia con iconos existentes):**
- Grosor de línea: 1-2px (#)
- Silueta legible a 14px (tamaño mínimo de uso)
- Estilo flat pixel art (no gradientes, no sombreado)
- Centrado en la grid cuando es posible
- Usar formas geométricas limpias

**Anatomía de iconos existentes (referencia):**
```
home (casa):           sword (espada diagonal):
...##...               ......#.
..####..               .....##.
.######.               ....##..
########               ..###...
.##..##.               .##.##..
.##..##.               ##...#..
.######.               #.......
........               ........
```

### Iconos sugeridos para añadir a Taskoria

#### `star` — para favoritear tareas
```
"...##...",
"..####..",
"########",
".######.",
"..####..",
".##..##.",
"##....##",
"........"
```

#### `map` — para el mundo/mapa
```
"........",
".##..##.",
"###..###",
"##.##.##",
"##.##.##",
"###..###",
".##..##.",
"........"
```

#### `potion` — para pociones/health
```
"...##...",
"..####..",
".##GG##.",
"##GGGG##",
"##GGGG##",
"##GGGG##",
".######.",
"........"
```
(reemplaza G con # para versión monocolor)

#### `sword_up` — espada vertical (para combate)
```
"...##...",
"..####..",
"...##...",
"...##...",
".######.",
"...##...",
"...##...",
"........"
```

#### `gem` — para recursos preciosos
```
"..####..",
".##..##.",
"##....##",
"##....##",
".##..##.",
"..####..",
"........",
"........"
```

#### `heart` — para HP/vida
```
"........",
".##..##.",
"########",
"########",
".######.",
"..####..",
"...##...",
"........"
```

#### `fire` — para rachas/streaks
```
"...##...",
"..####..",
".##.####",
"###.####",
"########",
".######.",
"..####..",
"........"
```

#### `calendar` — para fechas límite
```
"########",
"#.#..#.#",
"########",
"#......#",
"#.##...#",
"#......#",
"########",
"........"
```

#### `arrow_up` — para level up / progreso
```
"...##...",
"..####..",
".######.",
"########",
"...##...",
"...##...",
"...##...",
"........"
```

#### `lightning` — para bonuses/buff
```
"..####..",
"..####..",
".######.",
"########",
"...####.",
"...####.",
"....##..",
"........"
```

## Uso en componentes

```jsx
// Importar
import PixelIcon from '../common/PixelIcon';

// Uso básico
<PixelIcon name="nuevoIcono" size={24} />

// Con color explícito
<PixelIcon name="nuevoIcono" size={16} color="#FFD700" />

// Con clase Tailwind para color
<PixelIcon name="nuevoIcono" size={20} className="text-rpg-gold drop-shadow-glow" />

// En nav activo (drop-shadow-glow para el efecto brillante)
<PixelIcon name="nuevoIcono" size={18} className={activeView === 'x' ? "drop-shadow-glow" : ""} />
```
