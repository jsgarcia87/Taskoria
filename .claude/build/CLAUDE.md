# Taskoria — Contexto para Claude Code

> Instala este archivo en la raíz del proyecto como `CLAUDE.md`.
> Claude Code lo lee automáticamente al arrancar en este directorio.

---

## El Proyecto

**Taskoria** es un gestor de tareas gamificado RPG.
- **URL:** `sangar.studio/rpg`
- **Repo:** `github.com/jsgarcia87/Taskoria`
- **Stack:** React 18 + Vite · Tailwind CSS · PHP + MySQL

---

## Estructura Clave

```
src/
├── components/dashboard/world/
│   ├── PlayableWorld.jsx   ← Motor top-down 60fps (React DOM, NO canvas)
│   ├── MapData.js          ← Definición de mapas, obstacles, decorations, portals
│   └── sprites.jsx         ← Tiles procedurales (arrays 64×64 hex strings)
├── data/
│   ├── character_blueprints.json
│   └── pet_blueprints.json
└── context/
    ├── GameContext.jsx
    ├── TaskContext.jsx
    ├── PetContext.jsx
    └── BattleContext.jsx
```

---

## Motor PlayableWorld

- **React DOM** (no canvas global) · 60fps via `requestAnimationFrame`
- `TILE_SIZE = 40px` · `SPEED = 5px/frame`
- Sprites: arrays planos de **4096 strings hex** (`'#rrggbb'` o `'transparent'`) → 64×64px
- Cada sprite se renderiza pixel a pixel como divs o canvas inline
- `tileSprite` en MapData → se repite en grid para el suelo
- `decorations[].type` → busca función generadora en sprites.jsx

---

## Estado Actual de los 5 Mapas

| ID | Nombre | tileSprite | Estado visual |
|----|--------|-----------|---------------|
| `townSquare` | Town Square | `cobblestone_tile` ✅ | Mejor estado |
| `tavernInterior` | Tavern Interior | `wood_floor` ✅ | Aceptable |
| `taskoriaKeep` | Taskoria Keep | `royal_stone` ⚠️ | Alfombra CSS, estatua genérica |
| `mysticForest` | Mystic Forest | `grass_dense` ⚠️ | Sparse |
| `shadowCrypts` | Shadow Crypts | `dungeon_stone` ⚠️ | Sin props |

---

## Reglas Críticas

1. **NUNCA usar `PixelAvatar` ni `PixelPet`** — son LEGACY. Usar siempre `ModernPixelAvatar` y `ModernPixelPet`.
2. **Clave `E` en blueprints** = siempre piel `#ffdbac` (se recolorea en runtime).
3. **Sprites 64×64** = array de exactamente 4096 elementos.
4. **`imageRendering: 'pixelated'`** en todo canvas/img/svg de pixel art.
5. **GardenView.jsx** usa componentes legacy — bug conocido, migrar cuando se toque.

---

## Archivos de Referencia

Lee estos archivos antes de trabajar en el mundo:

- `docs/world/HOUSES.md` — Anatomía de casas, presets, paleta SDV
- `docs/world/TILES.md` — 6 generadores de tiles LPC listos para sprites.jsx
- `docs/world/MAPDATA.md` — Formato exacto de MapData.js + los 5 mapas completos
- `docs/world/PIPELINE.md` — Pipeline de construcción: orden correcto de trabajo
- `docs/world/PALETTE.md` — Paletas de color por bioma + técnicas dithering

---

## Proceso Estándar para Tareas de Mundo

```
1. Leer el archivo de referencia correspondiente en docs/world/
2. Identificar el archivo exacto a modificar
3. Mantener coherencia de paleta (CSS vars del design system)
4. Output siempre listo para copy-paste en el archivo correcto
5. Indicar línea/bloque exacto donde insertar
```
