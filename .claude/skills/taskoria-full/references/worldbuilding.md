# Taskoria — worldbuilding reference

## PlayableWorld engine
React DOM (no canvas), 60fps via `requestAnimationFrame`. `TILE_SIZE=40px`, `SPEED=5px/frame`,
`NPC_SPEED=SPEED*0.35`. Maps + tiles + portals in `MapData.js`; procedural tiles (64×64 arrays) in
`sprites.jsx`.

### 5 playable maps
| ID | Name | tileSprite | State |
|----|------|-----------|-------|
| `townSquare` | Town Square (Plaza del Archivo) | `cobblestone_warm` ✅ | done |
| `taskoriaKeep` | Taskoria Keep (Fortaleza) | `royal_stone` (pending) | blue-grey stone + gold, throne room |
| `tavernInterior` | Tavern (Posada) | `wood_floor` (pending) | warm wood, hearth |
| `mysticForest` | Mystic Forest (Bosque) | `grass_dense` (pending) | dense grass + flowers |
| `shadowCrypts` | Shadow Crypts (Criptas) | `dungeon_stone` (pending) | cracked stone, sarcophagi |

### 6 LPC-quality tile generators (paste-ready targets in sprites.jsx)
`cobblestone_warm` → townSquare (warm beige cobble) · `stone_path` → city paths (grey slab) ·
`grass_dense` → mysticForest (grass with flowers) · `dungeon_stone` → shadowCrypts (cracked, mossy) ·
`wood_floor` → tavernInterior (planks with grain) · `royal_stone` → taskoriaKeep (blue-grey + gold).

### Decoration/prop types in PlayableWorld
`pine_tree oak_tree pillar statue mug stool bartender_npc shop_building market_stall banner critter
cobble_patch crack puddle weapon_rack vendor_npc bench flowers torch well throne`.

## Dungeon combat zones (own palettes — `DUNGEON_ZONES`)
| Zona | Paleta |
|---|---|
| Cripta | `#2a2535 #3d3548 #5c5068 #9080a0` |
| Caverna | `#1a1a1a #2d2d2d #3d3830 #8a7860` |
| Ruinas Élvicas | `#d0e8d0 #a0c8a0 #608060 #40c870` |
| Fortaleza Enana | `#4a4040 #6a5858 #a08040 #c0c0c0` |
| Templo del Caos | `#0a0a0a #300808 #600000 #ff6000` |
| Alcantarillas | `#2a2010 #504528 #304818 #102810` |
| Guarida de Dragón | `#1a0808 #c04000 #ffd700` |

Zone palette rules the tileset; the monster keeps its own material palette.

## Bestiary production status (`bestiary.js` is source of truth)
- **Cripta ✅ 3/3:** Esqueleto Soldado (`enemy_skeleton_footman_64`, minion) · Zombi de Cripta
  (`enemy_crypt_zombie_64`, minion) · Espectro Llorón (`enemy_wailing_specter_64`, elite).
- **Caverna ✅ 3/3:** Trasgo de Caverna (`enemy_cave_goblin_64`) · Jabalí Dorsudo (`enemy_ridgeback_boar_64`)
  · Trol de las Profundidades (`enemy_cave_troll_64`, elite).
- **Pending ⏳:** Ruinas Élvicas, Fortaleza Enana, Templo del Caos, Alcantarillas (0/2 each); Weekly
  Bosses 0/4 (Liche Archivista, Guardián de Hierro Fundido, Heraldo del Caos, Scaltha — dragón rojo).
Narrative archetypes (taskoria-lore §5.3: Procrastination Specters, Rusted Wardens, Shadow Mage, Weekly
Boss) map onto these production sprites.

## Blueprint format (characters, pets, enemies)
```json
{ "<key>": {
  "paleta": { " ":"transparent", "A":"#000000", "B":"...", "E":"#ffdbac", "...": "..." },
  "blueprint": [ "…64 chars…", "… × 64 rows …" ]
}}
```
- `A` = outline (always). `E` = skin (`#ffdbac`, recolored at runtime). Max 12 keys + space.
- 64×64; active zone rows ~9–58. Characters/pets render via `ModernPixelAvatar` / `ModernPixelPet`.
- Rendering script: blueprint → PNG at 8× for review; auto-flag isolated pixels (0 non-transparent
  neighbours) as artefacts to clean.

## Review protocol (before shipping a sprite)
1. Render 8× PNG. 2. Isolated-pixel check. 3. Judge silhouette, zone/material palette, dithering (≥2
tones), tier weight (elite heavier than minion). 4. Approve → set `spriteRef` in `bestiary.js` +
`// ✅ diseñado`. Order: minions per zone → elites → bosses (bosses inherit the established style).

## CreationStudio (players build the world)
In-app 64×64 pixel editor. Players design and publish assets; approved creations live on the map forever.
6 categories: `casas castillos monturas arboles decoracion props`. Hardcoded studio palette:
`#000000 #ffdbac #567194 #3a4e69 #253347 #bdc3c7 #7f8c8d #ffffff #5d4037 #f1c40f #2e8b57 #8b0000 #8a2be2 #f59e0b #3b82f6`.

## Heraldry Builder v2 (guild/family crests)
Diestro/siniestro from the bearer's view; pieles (`ermine`,`vair`) and `proper` exempt from contrast;
lines (engrailed, invected, wavy, indented, dancetty, embattled); ordinaries (chevron, pile, pall,
canton, bend sinister…); four lion attitudes; blazon written in correct Spanish heraldic terminology.
Pending: integrate its export into `MapData.js` / `heraldry.js`.

## Art ownership rule
Jesús hand-draws all pets, mounts and Guardians — never generate their pixel art unless explicitly asked.
Enemies, bosses, tiles, props and world assets ARE produced here following the protocol above.
