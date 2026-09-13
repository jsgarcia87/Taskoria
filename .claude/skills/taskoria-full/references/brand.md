# Taskoria — brand reference

## Palette
| Token | Hex | Role |
|---|---|---|
| Archive Ink | `#342c3e` | Primary — deep aubergine. Logo fill, dark grounds, ink text. |
| Quest Gold | `#fedf8c` | Secondary — warm gold. XP, highlights, CTAs, accents. |
| Parchment | `#f6edd6` / `#efe3c4` | Reading grounds for long-form (docs, panels). |
| Deep | `#241d2d` | Deeper aubergine for gradients/covers. |
| Gold accent | `#c79a3b` | Kickers, small labels on parchment. |

**Conflict to keep flagged:** the app's `index.css` uses `--color-bg-main #2D1B4E`,
`--color-primary #8b5cf6`, `--color-gold #FFD700` — different from the brand palette. Decide per project
whether to migrate the UI to brand or treat identity vs product as two palettes. Do not merge silently.

## Typography system (3 fonts)
| Font | Source | Role | Notes |
|---|---|---|---|
| **Handjet** | Google Fonts, variable | Display / branding (titles, hero, wordmark voice) | Pixel/dot-matrix. Sharpen with `font-variation-settings:"ELSH" 0,"ELGR" 1`. Reads as art via the logo image too. |
| **VT323** | Google Fonts, mono | HUD, numbers, counters, retro labels | XP, levels, streaks, tags. |
| **Inter** | Google Fonts, sans | UI + body copy | All readable text. |

Retired: **Outfit** (role folded into Inter) and **Poppins** (was self-hosted, unused — remove its
`@font-face`). Rule of use: Handjet only for impact (never body); VT323 only for short/numeric; Inter for
everything else.

**Embedding for offline PDFs:** the container proxy often blocks `fonts.googleapis.com` at render time,
but GitHub `raw.githubusercontent.com/google/fonts/main/ofl/<family>/…ttf` is reachable. Download the
TTFs, install to `~/.fonts` (+`fc-cache -f`) and/or inline them as base64 `@font-face`, then render
HTML→PDF with headless Chromium. This guarantees the three fonts appear correctly in any viewer.

## Logo system
- **Isotype:** pixel shield bearing a vertical sword (protection + action).
- **Wordmark:** "TASKORIA" in blocky pixel letters (Handjet approximates it for live text).
- Variants (families `ico_Taskoria_*` = shield, `ico_Taskoria_logotipo_*` = wordmark): `_color` (ink on
  transparent), `_blanco` (white/cream for dark grounds), `_bg` (with container), `_bg_amarillo` (on gold).
- Formats: SVG + PNG @4x, in Google Drive `Taskoria/01 Identidad/Exportados/{SVG,4x}`.
- Clear space: one shield-width. Never recolour outside the palette; never stretch or add effects.

## Voice & positioning
- **Tone:** medieval-archive fantasy, warm and honest, with personality — never desk-calendar motivation.
- **Lexicon:** Archive / Royal Archive, Council, Guardians, Quest, Chronicle, register, raven, founding
  citizens, kingdom, saga, threshold.
- **Positioning:** utility-first task manager + motivating RPG layer; explicitly **ADHD-friendly**;
  Progressive Web App (installable desktop + mobile); free during closed beta, onboarding in waves
  ("founding citizens"); 5 maps; players build the world in the collaborative Pixel Studio.
- **Taglines:** "Turn your tasks into an RPG adventure." · "Every checkbox is a chapter. Every day, a saga."

## Reusable HTML→PDF brand-book skeleton
A/A4 pages; cover on `--deep`→`--ink` radial gradient with cream emblem; interior on parchment; section
headers in Handjet; HUD/labels in VT323; body in Inter. Colour swatches, type specimens, and asset
galleries (pets/guardians/monsters) render pixel-perfect with `image-rendering: pixelated`. A working
build already exists as `Taskoria — Brand & World Bible.pdf` (design director output).
