---
name: taskoria
description: >
  Experto completo en Taskoria (sangar.studio/rpg), un gestor de tareas gamificado RPG
  en React + Vite + Tailwind + PHP/MySQL. Conoce la arquitectura entera: blueprints pixel
  art 64×64 de 14 clases de personaje, 10 mascotas, 16 PixelIcons 8×8, 5 mapas del
  PlayableWorld, sistema de tiles procedurales, GardenView CSS, CreationStudio, y todos
  los contextos (GameContext, TaskContext, PetContext, BattleContext). Usa esta skill
  siempre que el usuario pida implementar, modificar o crear cualquier cosa relacionada
  con Taskoria: tiles del mundo, sprites, personajes, mascotas, iconos, mejoras de UI,
  nuevas features, bugs del PlayableWorld, assets pixel art, o cualquier cambio en el
  codebase. Detecta el proyecto también con: "la app RPG", "el gestor de tareas", "el
  mundo pixel art", "sprites.jsx", "MapData", "blueprints", "GardenView", "el Keep",
  "la mazmorra", "la taberna", "Town Square".
---

# Taskoria — Skill Completo

**URL:** `sangar.studio/rpg` · **Repo:** `github.com/jsgarcia87/Taskoria`
**Stack:** React 18 + Vite · Tailwind CSS · PHP + MySQL · Deploy: Sangar Studio

---

## 🗺️ Arquitectura del Proyecto

```
src/
├── App.jsx                          ← Router principal + auth guard
├── main.jsx
├── index.css                        ← CSS vars + utilidades globales
├── context/
│   ├── GameContext.jsx              ← Estado global: personaje, XP, gold, nivel
│   ├── TaskContext.jsx              ← Tareas, quests, hábitos
│   ├── PetContext.jsx               ← Mascotas: estado, adopción, sanctuary
│   └── BattleContext.jsx            ← Combate PvP, boss battles
├── components/
│   ├── Dashboard.jsx                ← Hub principal, routing de vistas
│   ├── Layout_v2.jsx                ← Shell + BottomNav
│   ├── ProfileSelection.jsx         ← Pantalla "Taskoria Family"
│   ├── CharacterCreation.jsx        ← Selector de clase al crear perfil
│   ├── CharacterSheet.jsx           ← Ficha del héroe: stats, equipamiento
│   ├── Shop.jsx                     ← Tienda de items y mascotas
│   ├── Diary.jsx                    ← Diario de sesión / journal
│   ├── Pomodoro.jsx                 ← Timer pomodoro integrado
│   ├── common/
│   │   ├── ModernPixelAvatar.jsx    ← Canvas 64×64 de personajes (USAR SIEMPRE)
│   │   ├── ModernPixelPet.jsx       ← Canvas 32/64×64 de mascotas (USAR SIEMPRE)
│   │   ├── PixelIcon.jsx            ← SVG iconos 8×8 pixel art
│   │   ├── PixelAvatar.jsx          ← LEGACY — spritesheet PNG, no usar
│   │   ├── PixelPet.jsx             ← LEGACY — spritesheet PNG, no usar
│   │   ├── AvatarBattle.jsx         ← Animación de combate
│   │   ├── BottomNav.jsx            ← Navegación inferior 5 tabs
│   │   └── LevelUpModal.jsx         ← Modal subida de nivel
│   └── dashboard/
│       ├── GardenView.jsx           ← Camp/Garden/Inn/Sanctuary (CSS puro)
│       ├── TaskList.jsx             ← Lista de quests/tareas
│       ├── TaskForm.jsx             ← Formulario nueva tarea
│       ├── BossArena.jsx            ← Arena de jefes
│       ├── BossBattle.jsx           ← Combate contra boss
│       ├── PartyView.jsx            ← Vista social: guild, party
│       ├── PetSanctuaryView.jsx     ← Wild Sanctuary (adopción + mascotas)
│       ├── CreationStudio.jsx       ← Editor pixel art 64×64 in-app
│       ├── CreationGallery.jsx      ← Galería de creaciones del usuario
│       ├── CoFocusingArea.jsx       ← Co-working con Twitch integrado
│       ├── GuildView.jsx            ← Gestión de gremios
│       └── world/
│           ├── PlayableWorld.jsx    ← Motor top-down 60fps (React DOM)
│           ├── MapData.js           ← Definición de mapas, tiles, portales
│           └── sprites.jsx          ← Tiles procedurales (arrays 64×64)
├── data/
│   ├── character_blueprints.json   ← Blueprints pixel art 64×64 de personajes
│   └── pet_blueprints.json         ← Blueprints 32/64×64 de mascotas
└── api/                             ← PHP backend
    ├── config.php / db.php          ← Conexión BD
    ├── load_game.php / save_game.php
    ├── creations.php                ← CRUD de creaciones del studio
    ├── guilds.php
    └── battle_pvp.php
```

---

## 🎨 Design System

### CSS Variables (index.css)
```css
--color-bg-main:       #2D1B4E   /* Fondo principal — púrpura oscuro */
--color-bg-secondary:  #0f0a1a   /* Fondo deep — negro violáceo */
--color-glass:         rgba(255,255,255,0.05)
--color-glass-border:  rgba(255,255,255,0.1)
--color-primary:       #8b5cf6   /* Violeta acento */
--color-gold:          #FFD700   /* Dorado — XP, highlights, CTAs */
--stat-str:            #FF4D4D   /* Fuerza */
--stat-dex:            #2DCC70   /* Destreza */
--stat-int:            #4D94FF   /* Inteligencia */
--stat-con:            #FFB347   /* Constitución */
```

### Clases CSS globales disponibles
`glass-panel` `glass-card` `glass-btn` `glass-btn-primary`
`shadow-glow-red` `shadow-glow-amber` `shadow-glow-gold`
`text-shadow-glow` `animate-breathe` `animate-bubble-popup`
`animate-flicker` `animate-sway` `animate-rise` `pixel-bubble`

### Tipografía
- **Outfit** 700/800 → headings RPG, labels
- **Inter** 400–700 → cuerpo
- Pixel art: siempre `imageRendering: 'pixelated'` en canvas/img/svg

---

## 👤 Sistema de Personajes

### 14 clases en character_blueprints.json
`fighter` `paladin` `wizard` `rogue` `cleric` `ranger`
`barbarian` `bard` `druid` `monk` `necromancer` `antipaladin`
`sorcerer` `scout`

### TYPE_MAP en ModernPixelAvatar.jsx
```js
{ 'warrior':'fighter', 'paladin':'paladin', 'mage':'wizard',
  'rogue':'rogue', 'cleric':'cleric', 'ranger':'ranger',
  'barbarian':'barbarian', 'bard':'bard', 'druid':'druid',
  'monk':'monk', 'necromancer':'necromancer', 'antipaladin':'antipaladin',
  'sorcerer':'sorcerer', 'scout':'scout', 'dragon':'antipaladin' }
```

### Estructura blueprint
```json
{
  "fighter": {
    "paleta": {
      " ": "transparent",
      "A": "#000000",    // contorno — SIEMPRE A
      "B": "#567194",    // color primario clase
      "C": "#3a4e69",    // sombra primario
      "D": "#253347",    // profundidad
      "E": "#ffdbac",    // piel — SIEMPRE E (se customiza en runtime)
      "F": "#bdc3c7",    // material complementario claro
      "G": "#e4e7ec",    // highlight complementario
      "H": "#7f8c8d",    // sombra complementario
      "I": "#ffffff",    // blanco puro
      "J": "#5d4037"     // cuero/madera (compartido entre clases)
    },
    "blueprint": [ /* 64 strings × 64 chars */ ]
  }
}
```

**Reglas críticas:**
- Canvas 64×64, zona activa filas 9–58, cols ~12–52
- Clave `E` = piel, siempre `#ffdbac` (ModernPixelAvatar la recolorea)
- Máx. 12 claves + `" "` (transparente)
- Ver `references/personajes.md` para añadir clase nueva

### Paletas de referencia por clase (extraídas del JSON real)
```
fighter:     B=#567194  C=#3a4e69  F=#bdc3c7  G=#e4e7ec
paladin:     B=#f1c40f  C=#f39c12  F=#ffffff  G=#ecf0f1
wizard:      B=#8a2be2  C=#4f1c78  G=#09eeff  I=#d395e9
rogue:       B=#5d4037  C=#301b03  G=#355f02  H=#274106
cleric:      B=#ffffff  C=#f1c40f  G=#09eeff  H=#ecf0f1
ranger:      B=#5d4037  C=#301b03  G=#27ae60  H=#1e8449
barbarian:   B=#cb4335  C=#a93226  F=#ffdbac  G=#e5c298
bard:        B=#f1c40f  C=#301b03  G=#9b59b6  H=#8e44ad
druid:       B=#27ae60  C=#1e8449  G=#2ecc71  H=#8e44ad
monk:        B=#5d4037  C=#301b03  E=#f1c40f  G=#e67e22
necromancer: B=#2c3e50  C=#1a252f  G=#8e44ad  I=#9b59b6
antipaladin: B=#2c3e50  C=#1a252f  F=#c0392b  G=#e74c3c
sorcerer:    B=#c0392b  C=#922b21  G=#f1c40f  H=#e67e22
scout:       B=#8d6e63  C=#301b03  G=#7cb342  H=#558b2f
```

---

## 🐾 Sistema de Mascotas

### 10 mascotas en pet_blueprints.json
**32×32:** `slime` `phoenix` `dragon_egg`
**64×64:** `wolf` `dragon` `lion` `dragon_fire` `dragon_frost` `wolf_arctic` `lion_desert`

### Recolorización en ModernPixelPet.jsx
```js
dragon* → recolorea C, D, B
wolf*   → recolorea B, C, D
lion*   → recolorea D, C, B
otros   → recolorea A, B, C (fallback)
```
Los 64×64 se normalizan con `scale * 0.5` para igualar visualmente los 32×32.

---

## 🔷 PixelIcon (8×8)

### 16 iconos existentes
`sword` `home` `user` `shoppingBag` `checkSquare` `skull`
`trophy` `book` `zap` `box` `coins` `clock` `shield` `shirt`
`bell` `users`

### Añadir icono nuevo
```js
// En ICONS dentro de PixelIcon.jsx:
nuevoIcono: [
  "........",  // 8 strings de 8 chars
  ".######.",  // # = relleno, . = transparente
  "##....##",
  "##....##",
  "##....##",
  ".######.",
  "........",
  "........"
]
```
Reglas: grosor 1-2px, silueta legible a 14px, sin antialiasing.

---

## 🗺️ PlayableWorld — Motor

**Motor:** React DOM (no canvas) · 60fps vía `requestAnimationFrame`
`TILE_SIZE = 40px` · `SPEED = 5px/frame` · `NPC_SPEED = SPEED * 0.35`

### 5 mapas en MapData.js
| ID | Nombre | tileSprite actual | Estado |
|----|--------|-------------------|--------|
| `townSquare` | Town Square | `cobblestone_tile` ✅ | Completo |
| `taskoriaKeep` | Taskoria Keep | ❌ sin tile | Fondo azul plano |
| `tavernInterior` | Tavern Interior | CSS stripe | Aceptable |
| `mysticForest` | Mystic Forest | ❌ sin tile | Fondo CSS puntitos |
| `shadowCrypts` | Shadow Crypts | ❌ sin tile | Fondo CSS puntitos |

### Tiles LPC-quality pendientes de integrar (sprites.jsx)
Ver `references/tiles-lpc.md` — 6 funciones generadoras listas para pegar:
```js
cobblestone_warm → townSquare    (adoquín beige cálido)
stone_path       → caminos       (losa gris ciudad)
grass_dense      → mysticForest  (hierba con flores)
dungeon_stone    → shadowCrypts  (mazmorra con grietas)
wood_floor       → tavernInterior(tablas con veta)
royal_stone      → taskoriaKeep  (piedra azul-gris + oro)
```

### Tipos de decoraciones en PlayableWorld.jsx
`pine_tree` `oak_tree` `pillar` `statue` `mug` `stool`
`bartender_npc` `shop_building` `market_stall` `banner`
`critter` `cobble_patch` `crack` `puddle` `weapon_rack`
`vendor_npc` `bench` `flowers` `torch` `well` `throne`(nuevo)

---

## 🌿 GardenView (Camp)

**Renderizado:** JSX + CSS puro (no canvas)
**Escenarios:** `garden` (default) · `inn` (isResting) · `sanctuary`

⚠️ **Bug conocido:** GardenView usa `PixelAvatar` y `PixelPet` (LEGACY).
Migrar a `ModernPixelAvatar` + `ModernPixelPet` para mayor calidad visual.

---

## 🎨 CreationStudio

Editor pixel art 64×64 integrado. Los usuarios crean sprites guardados vía `api/creations.php`.

**Paleta hardcoded del Studio:**
```js
['#000000','#ffdbac','#567194','#3a4e69','#253347',
 '#bdc3c7','#7f8c8d','#ffffff','#5d4037','#f1c40f',
 '#2e8b57','#8b0000','#8a2be2','#f59e0b','#3b82f6']
```
Categorías: `casas` `castillos` `monturas` `arboles` `decoracion` `props`

---

## 🔴 Mejoras Pendientes (por prioridad)

### ALTA — impacto visual inmediato
1. **sprites.jsx** → añadir 5 tiles LPC (ver `references/tiles-lpc.md`)
2. **MapData.js** → asignar `tileSprite` a los 4 mapas sin él
3. **PlayableWorld.jsx** → estatua SVG pixel art (reemplazar divs CSS)
4. **PlayableWorld.jsx** → banner SVG pixel art (reemplazar emoji+clipPath)

### MEDIA — calidad de UI
5. **GardenView.jsx** → migrar `PixelAvatar`→`ModernPixelAvatar`, `PixelPet`→`ModernPixelPet`
6. **PetSanctuaryView.jsx** → fondo con cielo nocturno + colinas CSS + flores SVG

### BAJA — bug de avatar
7. **ProfileSelection.jsx** → fallback chain robusto para avatares idénticos:
   ```js
   const avatarType = char?.avatarId || char?.class?.toLowerCase() || 'warrior';
   ```

---

## 📐 Proceso estándar para cualquier tarea visual

```
1. Identificar archivo exacto a modificar
2. Consultar referencia correspondiente en references/
3. Mantener coherencia: paleta CSS vars, imageRendering: pixelated
4. Output siempre listo para copiar-pegar en el archivo correcto
5. Indicar línea/bloque exacto donde insertar
```

---

## 📚 Referencias (leer antes de tareas complejas)

- `references/personajes.md` — Guía completa + script para nuevas clases
- `references/mascotas.md` — Integración de mascotas + PixelIcons
- `references/tiles-lpc.md` — 6 tiles LPC listos para sprites.jsx
- `references/mapas.md` — Estructura MapData + guía nuevos mapas
- `references/mejoras.md` — Código listo para las mejoras pendientes
- `references/sanctuary.md` — Rediseño completo de PetSanctuaryView
