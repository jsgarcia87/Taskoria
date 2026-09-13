# Taskoria — architecture reference

**Stack:** React 18 + Vite · Tailwind CSS · PHP + MySQL · deploy Sangar Studio · URL taskoria.es.

## Project map
```
src/
├── App.jsx                       ← Router + auth guard
├── index.css                     ← CSS vars + global utilities
├── context/
│   ├── GameContext.jsx           ← global state: character, XP, gold, level
│   ├── TaskContext.jsx           ← tasks, quests, habits
│   ├── PetContext.jsx            ← pets: state, adoption, sanctuary
│   └── BattleContext.jsx         ← PvP + boss battles
├── components/
│   ├── Dashboard.jsx  Layout_v2.jsx  ProfileSelection.jsx  CharacterCreation.jsx
│   ├── CharacterSheet.jsx  Shop.jsx  Diary.jsx  Pomodoro.jsx
│   ├── common/
│   │   ├── ModernPixelAvatar.jsx  ← Canvas 64×64 characters (ALWAYS use)
│   │   ├── ModernPixelPet.jsx     ← Canvas 32/64×64 pets (ALWAYS use)
│   │   ├── PixelIcon.jsx          ← 8×8 pixel-art SVG icons
│   │   ├── PixelAvatar.jsx / PixelPet.jsx ← LEGACY spritesheet PNG, do NOT use
│   │   ├── AvatarBattle.jsx  BottomNav.jsx  LevelUpModal.jsx
│   └── dashboard/
│       ├── GardenView.jsx        ← Camp/Garden/Inn/Sanctuary (pure CSS)
│       ├── TaskList.jsx  TaskForm.jsx  BossArena.jsx  BossBattle.jsx
│       ├── PartyView.jsx  PetSanctuaryView.jsx  CreationStudio.jsx  CreationGallery.jsx
│       ├── CoFocusingArea.jsx  GuildView.jsx
│       └── world/
│           ├── PlayableWorld.jsx  ← top-down engine 60fps (React DOM)
│           ├── MapData.js         ← maps, tiles, portals
│           └── sprites.jsx        ← procedural tiles (64×64 arrays)
├── data/
│   ├── character_blueprints.json ← 64×64 pixel blueprints of the 14 classes
│   └── pet_blueprints.json       ← 32/64×64 pet blueprints
└── api/  (PHP) config.php db.php load_game.php save_game.php creations.php guilds.php battle_pvp.php
```

## Contexts
- **GameContext** — hero, XP, gold, level, attributes. **TaskContext** — tasks/quests/habits.
- **PetContext** — pet state, adoption, sanctuary, hatching. **BattleContext** — PvP + bosses.

## Design system (index.css)
```
--color-bg-main:#2D1B4E  --color-bg-secondary:#0f0a1a  --color-primary:#8b5cf6  --color-gold:#FFD700
--stat-str:#FF4D4D  --stat-dex:#2DCC70  --stat-int:#4D94FF  --stat-con:#FFB347
```
Global classes: `glass-panel glass-card glass-btn glass-btn-primary shadow-glow-* text-shadow-glow
animate-breathe animate-bubble-popup animate-flicker animate-sway animate-rise pixel-bubble`.
> ⚠️ These app CSS vars do NOT match the official brand palette (`#342c3e`/`#fedf8c`). Whether the UI
> migrates to brand colors or they coexist is an open decision — see **taskoria-brand**.

## PlayableWorld engine
React DOM (no canvas), 60fps via `requestAnimationFrame`. `TILE_SIZE=40px`, `SPEED=5px/frame`,
`NPC_SPEED=SPEED*0.35`. 5 maps: `townSquare` (cobblestone ✅), `taskoriaKeep`, `tavernInterior`,
`mysticForest`, `shadowCrypts`. Tiles + map structure live in **taskoria-worldbuilder**.

## Blueprint format (characters & pets)
`{ "<key>": { "paleta": { " ":"transparent", "A":"#000000"(contorno), "E":"#ffdbac"(piel), ... }, "blueprint": [ 64 strings × 64 chars ] } }`. Skin key `E` is recolored at runtime. Max 12 keys + space.
14 classes: fighter paladin wizard rogue cleric ranger barbarian bard druid monk necromancer
antipaladin sorcerer scout.

## Known cleanups / backlog
- 4/5 maps lack a real `tileSprite` (Keep, Mystic Forest, Shadow Crypts, Tavern).
- `GardenView.jsx` still uses legacy `PixelAvatar`/`PixelPet` — migrate to Modern*.
- Removed pet keys: `dragon`/`dragon_fire`/`dragon_frost`/`dragon_egg`. Canonical pets in **taskoria-lore**/**taskoria-rules**.
