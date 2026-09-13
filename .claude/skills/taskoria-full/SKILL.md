---
name: taskoria
description: Complete expert knowledge of Taskoria (sangar.studio/rpg · taskoria.es), a gamified RPG task manager in React + Vite + Tailwind + PHP/MySQL. Covers the codebase & architecture, the brand identity, the world lore (the Bible), the D&D-style XP/reward rules, and the pixel-art worldbuilder. Use for ANY Taskoria work — implementing or debugging code, writing lore/NPC dialogue, designing XP/economy/balance, building maps/tiles/sprites, or producing brand materials. Triggers on "Taskoria", "la app RPG", "el gestor de tareas", GameContext/TaskContext/PetContext/BattleContext, PlayableWorld, sprites.jsx, MapData, blueprints, GardenView, the Keep/crypt/tavern/Town Square, the Guardians, XP/rewards, the Bible/lore, brand/colours/fonts.
---

# Taskoria — global knowledge skill

Taskoria is a **utility-first task manager with a motivating RPG layer** (React 18 + Vite · Tailwind ·
PHP + MySQL; live at taskoria.es). Real tasks become quests; completing them earns XP and gold, levels
the hero, unlocks classes and companions, and builds a shared pixel-art world. This skill carries the
whole domain; each area has a detailed reference file — **open the matching file before doing focused
work in that area.**

> **THE GOLDEN RULE (binding across everything):** the game never lies about the real world. No reward,
> line, mechanic, or asset may imply progress the player did not truly earn. Every reward is auditable
> back to a real completed action.

> **Two layers, never mixed for the player:** every software system has a technical layer (what the code
> does) and a narrative layer (how the player lives it). The player never sees "error 500" — they see a
> "crack in the Archive". Route technical events through a Guardian/NPC voice.

## Reference map — open the right file
| Working on… | Read |
|---|---|
| Code, architecture, contexts, the PlayableWorld engine, blueprint format | `references/architecture.md` |
| Brand: colours, the 3 fonts, logo, voice, branded documents | `references/brand.md` |
| Lore: cosmology, domains, the six Guardians, 14 classes, bestiary, tone, NPC dialogue | `references/biblia.md` (narrative source of truth) |
| Rules: XP, gold, levels, attributes, difficulty, streaks, pet perks, boss/Focus math, balance | `references/rules-xp.md` |
| World: tiles, maps, dungeons, 64×64 sprites, zone palettes, production protocol, CreationStudio | `references/worldbuilding.md` |

## What Taskoria is (one screen)
- **The Archive** receives real intentions and turns them into quests; the kingdom is built from
  fulfilled intentions, and abandoned ones become cracks, ruins and monsters. The player is a **Hero of
  the Archive**, bonded to their real self by **the Anchor**.
- **Five domains:** Town Square (civic hub), Taskoria Keep (progression), Tavern (rest), Mystic Forest
  (streaks/habits), Shadow Crypts (overdue tasks). Plus Wild Sanctuary and Family Estate.
- **Six Guardians** guide the hero: Cartograph (explore), Chronos (focus/time), Ledgar
  (habits/tasks/diary), Notifus (notifications + party/guilds), Patchsmith (Pixel Studio + dev),
  Matriarch (families + data protection). Guardian statues and the interactive Archive Council NPCs
  (incl. Sysmara, Coinhilda, Onboardin) **coexist**.
- **14 hero classes** = archetypes of *how a person tackles tasks*. **6 companion species** (+ evolutions)
  hatch from the **Mystic Egg** via real focus sessions; **Phoenix** is rebirth; **Griffin** is a mount.

## Brand in brief (full spec in references/brand.md)
- Colours: **Archive Ink `#342c3e`** (primary) + **Quest Gold `#fedf8c`** (secondary). ⚠️ These differ
  from the app's current CSS vars (`#2D1B4E`/`#8b5cf6`/`#FFD700`) — open decision, keep it flagged.
- Type system (3 fonts): **Handjet** (display), **VT323** (HUD/numbers), **Inter** (body). Retired: Outfit, Poppins.
- Logo: pixel shield + sword; wordmark "TASKORIA". Voice: medieval-archive fantasy, honest, no guru clichés.

## Rules in brief (full system in references/rules-xp.md)
- Completing a real task pays a **compensation packet**: XP + gold + 1 attribute point + streak + pet
  Bond + egg heat (if in a focus session) + a loot roll, narrated by a Guardian.
- Difficulty tiers (base XP): Trivial 5 · Easy 10 · Medium 20 · Hard 35 · Epic 60. Six attributes
  (STR/DEX/CON/INT/WILL/CHA) fed by task category. Multipliers stack (streak, on-time priority, class
  synergy, focus-dungeon). Combat = productivity: Focus Dungeon HP = minutes×10; Epic Boss HP = declared
  effort. Anti-grind caps; the shop never sells XP or levels.

## Working conventions
- Pixel art always `imageRendering: 'pixelated'`; characters/pets via **ModernPixelAvatar/ModernPixelPet**
  (never the legacy PNG-spritesheet components).
- **Jesús hand-draws pets, mounts and Guardians — do NOT generate their pixel art unless explicitly
  asked.** Enemies/bosses/tiles/props ARE produced here (worldbuilder protocol).
- Deliver code/asset output ready to paste into the exact file, with the insertion point named.
- Blueprint format: `{"<key>":{"paleta":{" ":"transparent","A":"#000000",...,"E":"#ffdbac"},"blueprint":[64×64]}}`; `A`=outline, `E`=skin (recolored at runtime), ≤12 keys + space.

Canonical pet keys: `wolf`(+`wolf_arctic`), `lion`(+`lion_desert`), `emberwyrm`(+`emberwyrm_young`),
`frostcoil`(+`frostcoil_young`), `tidewyrm`(+`tidewyrm_young`), `slime`, `phoenix`, `mystic_egg`; mount
`mount_griffin`. Discarded legacy keys: `dragon`/`dragon_fire`/`dragon_frost`/`dragon_egg`.
