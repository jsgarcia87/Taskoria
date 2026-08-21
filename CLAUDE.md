# Taskoria — Contexto para Claude Code

> Instala este archivo en la raíz del proyecto como `CLAUDE.md`.
> Claude Code lo lee automáticamente al arrancar en este directorio.

---

## El Proyecto

**Taskoria** es un gestor de tareas gamificado RPG.
- **URL:** `taskoria.es`
- **Repo:** `github.com/jsgarcia87/Taskoria`
- **Stack:** React 18 + Vite · Tailwind CSS · PHP + MySQL

---

## Estructura Clave

```
src/
├── components/
│   ├── common/
│   │   ├── ModernPixelAvatar.jsx  ← Avatares (NUNCA usar PixelAvatar)
│   │   ├── ModernPixelPet.jsx     ← Mascotas (NUNCA usar PixelPet)
│   │   ├── NumberTicker.jsx       ← Animación count-up desde 0
│   │   └── StatBar.jsx            ← Barras con animación de entrada
│   ├── dashboard/
│   │   ├── world/
│   │   │   ├── PlayableWorld.jsx  ← Motor top-down 60fps (React DOM, NO canvas)
│   │   │   ├── MapData.js         ← Mapas, obstacles, decorations, portals
│   │   │   └── sprites.jsx        ← Tiles procedurales (arrays 64x64 hex)
│   │   ├── GardenView.jsx         ← Camp con avatar + mascota activa
│   │   ├── PetSanctuaryView.jsx   ← Adopciones comunitarias
│   │   └── FocusHero.jsx          ← Panel pomodoro/focus
│   ├── CharacterSheet.jsx         ← Perfil: stats, inventario, mascotas
│   └── LandingPage.jsx            ← Landing pública
├── context/
│   ├── GameContext.jsx             ← Provider principal
│   └── reducers/
│       ├── taskReducer.js          ← COMPLETE_TASK, TICK_HABIT (+ pet XP)
│       ├── petReducer.js           ← FEED, PLAY, CLEAN, DECAY, EVOLVE
│       ├── battleReducer.js        ← DEAL_DAMAGE, FINISH_POMODORO
│       └── systemReducer.js        ← CHECK_PENALTIES, día nuevo
├── data/
│   ├── character_blueprints.json
│   ├── pet_blueprints.json         ← gridSize 32 o 64 por especie
│   └── petSpecies.js               ← Cadenas de evolución, labels
└── utils/
    ├── gameUtils.js                ← XP, perks, bond, combat, badges
    └── lootUtils.js                ← Drops de items/gear/comida
```

---

## Sistema de Mascotas

### Stats y cuidado
- **hunger** (decae 2/h), **happiness** (1/h), **hygiene** (0.75/h)
- Acciones: Feed (consume item), Play (cd 30min), Clean (cd 1h)
- Si hunger o happiness llegan a 0 → mascota huye al Sanctuary
- **bond** (0-100): sube con interacciones, escala perks pasivos

### Loop tareas → mascota
- **COMPLETE_TASK**: mascota activa gana XP (dificultad × 5), happiness (+2 a +5), bond +1
- **TICK_HABIT**: mascota activa gana XP (dificultad × 3), happiness +2
- Perks de especie aplican multiplicadores a XP/gold/damage del jugador
- Mascota contenta (happiness >= 80) da +5% XP global; triste (< 25) penaliza -5%

### Evolución
- Todas al nivel 10: wolf→arctic, lion→desert, wyrms joven→adulto
- Slime y Phoenix no evolucionan

### Eclosión
- Solo por pomodoro (3 sesiones focus = eclosión)
- Especies aleatorias de HATCHABLE_TYPES

### ModernPixelPet — prop `size`
- `size={px}` → el canvas se escala por CSS para encajar en un contenedor de ese tamaño
- Sin `size` → comportamiento libre (div + canvas 1.4x con márgenes negativos)
- Usar `size` siempre que haya `overflow-hidden` en el padre

---

## Motor PlayableWorld

- **React DOM** (no canvas global) · 60fps via `requestAnimationFrame`
- `TILE_SIZE = 40px` · `SPEED = 5px/frame`
- Sprites: arrays planos de **4096 strings hex** (`'#rrggbb'` o `'transparent'`) → 64x64px
- Cada sprite se renderiza pixel a pixel como divs o canvas inline
- `tileSprite` en MapData → se repite en grid para el suelo
- `decorations[].type` → busca función generadora en sprites.jsx

---

## Estado Actual de los 5 Mapas

| ID | Nombre | tileSprite | Estado visual |
|----|--------|-----------|---------------|
| `townSquare` | Town Square | `cobblestone_tile` | Mejor estado |
| `tavernInterior` | Tavern Interior | `wood_floor` | Aceptable |
| `taskoriaKeep` | Taskoria Keep | `royal_stone` | Alfombra CSS, estatua genérica |
| `mysticForest` | Mystic Forest | `grass_dense` | Sparse |
| `shadowCrypts` | Shadow Crypts | `dungeon_stone` | Sin props |

---

## Reglas Criticas

1. **NUNCA usar `PixelAvatar` ni `PixelPet`** — son LEGACY. Usar siempre `ModernPixelAvatar` y `ModernPixelPet`.
2. **Clave `E` en blueprints** = siempre piel `#ffdbac` (se recolorea en runtime).
3. **Sprites 64x64** = array de exactamente 4096 elementos.
4. **`imageRendering: 'pixelated'`** en todo canvas/img/svg de pixel art.
5. **GardenView.jsx** usa componentes legacy — bug conocido, migrar cuando se toque.
6. **`npm run build`** para producción (nunca `vite build` directo). El postbuild copia `api/` a `dist/`.
7. **Deploy manual**: el usuario sube `dist/` al servidor. Nunca proponer rsync/ssh/CI.

---

## Archivos de Referencia

Lee estos archivos antes de trabajar en el mundo:

- `docs/world/HOUSES.md` — Anatomia de casas, presets, paleta SDV
- `docs/world/TILES.md` — 6 generadores de tiles LPC listos para sprites.jsx
- `docs/world/MAPDATA.md` — Formato exacto de MapData.js + los 5 mapas completos
- `docs/world/PIPELINE.md` — Pipeline de construccion: orden correcto de trabajo
- `docs/world/PALETTE.md` — Paletas de color por bioma + tecnicas dithering

---

## Proceso Estandar para Tareas de Mundo

```
1. Leer el archivo de referencia correspondiente en docs/world/
2. Identificar el archivo exacto a modificar
3. Mantener coherencia de paleta (CSS vars del design system)
4. Output siempre listo para copy-paste en el archivo correcto
5. Indicar linea/bloque exacto donde insertar
```
