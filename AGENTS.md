# AGENTS.md — Taskoria

Guía para cualquier agente de código (Claude Code, Codex, Cursor…) que trabaje en este repo.
Complementa a `CLAUDE.md`; si algo difiere, **este archivo es el más reciente**.

## Qué es

**Taskoria**: gestor de tareas gamificado con capa RPG. Producción: `taskoria.es`.
Principio de producto: **utility first**. Primero es un gestor de tareas, después un juego.
Las tareas deben verse en 2 s al abrir la app y la gamificación nunca tapa la usabilidad.

**Regla de oro:** el juego nunca miente. Ninguna recompensa, texto o mecánica puede implicar un progreso que el jugador no ha conseguido de verdad.

## Stack

- React 19 + Vite, Tailwind CSS, `motion/react` (animación), `lucide-react`, Three.js (solo el castillo 3D de la landing).
- PHP + MySQL en `api/` (endpoints sueltos, sin framework). Las tablas se migran solas con `CREATE TABLE IF NOT EXISTS`.
- PWA (vite-plugin-pwa). `dev-dist/` y `dist/` son salida de build.

## Comandos

```bash
npm run dev          # servidor local (puerto 5173)
npm run build        # producción — usar SIEMPRE este, nunca `vite build` suelto
npm run lint
```

- `npm run build` copia `api/` a `dist/api` y `sprite-registry.js`/`prefabs.js` a `dist/admin-tools` (plugins en `vite.config.js`). Sin eso el login devuelve HTML.
- **Deploy manual:** el usuario sube `dist/` al servidor. No proponer rsync/ssh/CI ni hacer push al remoto.
- No hay suite de tests. Se verifica en el navegador, importando módulos desde `/src/...` en la página y, para PHP, con `php -S` + SQLite.
- El dev server se cae entre turnos: si hay `ERR_CONNECTION_REFUSED`, reiniciarlo antes de culpar al código.

## Mapa del código

```
src/
├── App.jsx                     # routing por estado (landing/auth/app), login e invitado
├── components/
│   ├── LandingPage.jsx         # landing pública (+ landing/CastleScene.jsx, 3D)
│   ├── Auth.jsx · Settings.jsx · CharacterSheet.jsx · Dashboard.jsx · Layout_v2.jsx
│   ├── cards/                  # cartas coleccionables de jefes (BossCard, CardViewer, CardAlbum, CardReveal, useCardGestures)
│   ├── common/                 # ModernPixelAvatar/Pet, PixelIcon, EnemySprite, BottomNav, navDestinations.js…
│   └── dashboard/              # Questbook, TaskList, TaskForm, PartyView, GardenView, BossBattle, admin…
│       └── world/              # PlayableWorld.jsx, MapData.js, sprites.jsx, worldProps.jsx, PlotSystem.jsx, validateMap.js, prefabs.js
├── context/
│   ├── GameContext.jsx         # provider principal
│   └── reducers/               # rootReducer → character → task → pet → battle → system
├── data/                       # blueprints (.json), bestiary, petSpecies, items, critter-sprites, sprite-registry
└── utils/                      # gameUtils (XP, perks, combate), lootUtils, bossCards, friendsApi
api/                            # PHP: login, save_game/load_game, friends, guilds, settings, waitlist, cms, admin…
docs/world/                     # HOUSES, TILES, MAPDATA, PIPELINE, PALETTE — leer antes de tocar el mundo
```

Navegación unificada móvil/escritorio: los destinos viven en `src/components/common/navDestinations.js`. No duplicar listas de destinos en `BottomNav` o `Layout_v2`.

## Diseño y tipografía

4 fuentes con roles estrictos:

| Fuente | Clase Tailwind | Uso |
|---|---|---|
| **Taskoria Herald** (`public/fonts/taskoria-herald.otf`) | `font-herald` | Titulares de marca: landing, nombres de carta, perfil. **Un solo peso: no usar `font-bold`** (se sintetiza). |
| **Outfit** | `font-heading` | Títulos y UI del dashboard |
| **Inter** | `font-sans` | Cuerpo, botones, labels |
| **VT323** | `font-pixel` | Solo números de juego (HP, XP, oro, contadores) |

- Handjet queda solo en texto diegético dentro de pergaminos. **Sin serif y sin cursiva.**
- Animaciones: sutiles y elegantes. Sin confeti, sin partículas explosivas, sin screen-shake.
- Pixel art: siempre `imageRendering: 'pixelated'`.
- Copys de la landing en inglés. Evitar lo que suena a plantilla de IA: pills decorativas, "plazas limitadas", estadísticas de relleno, brillos dorados por todas partes. Si un texto promete algo (perks, olas de invitaciones), debe ser verdad hoy.

## Reglas críticas

1. **Avatares y mascotas:** usar `ModernPixelAvatar` y `ModernPixelPet`. `PixelAvatar`/`PixelPet` son legacy. (`GardenView.jsx` aún los usa: migrar al tocarlo.)
2. Blueprints: clave `E` = piel `#ffdbac` (se recolorea en runtime). Sprites de 64×64 = array de exactamente 4096 elementos.
3. Las mascotas y los guardianes los dibuja Jesús a mano: no generar su pixel art salvo petición explícita. Enemigos, jefes, tiles y props sí se producen aquí.
4. **Lore:** el nombre "Sangar" solo aparece en legal/copyright y en créditos del pie. Las funciones técnicas hablan por su miembro del Council (Ledgar, Coinhilda, Notifus, Chronos, Cartograph, Patchsmith, Matriarch).
5. **Modo invitado:** lo controla el admin con `allow_guest_mode` (`api/settings.php`, por defecto `false`). Los botones "Play free" de la landing solo se muestran si está activo. Usuario invitado: `{ id: 'guest', username: 'Adventurer', is_guest: true }` → `App.handleLogin`.
6. **Amistad mutua:** parcelas compartidas, chat y PvP deben ir solo entre amigos mutuos (`api/friends.php`, `src/utils/friendsApi.js`). El chat y el PvP aún no lo aplican.

## Trampas conocidas

- **`position: fixed` dentro de ancestros con `transform`** se queda atrapado: modales y visores van con `createPortal(…, document.body)` (ver `CardViewer`).
- **`overflow-x: hidden` en `html`/`body` rompe `position: sticky`.** Usar `overflow-x: clip` (ya aplicado en `index.css`). La landing (capítulo Council, 300vh) depende de ello.
- Keyframes CSS duplicados pisan a los existentes (un `breathe` repetido volvió semitransparentes a las mascotas). Comprobar el nombre antes de crear uno.
- Estado de personaje: se guarda entero por autosave. `RESTORE_STATE` fuerza los modales cerrados. Al añadir campos al personaje, ponerlos en `characterReducer` y comprobar que no se pierden al restaurar.
- La API **no tiene autenticación**: confía en el `user_id` del cliente. No añadir endpoints que expongan datos sensibles hasta que haya tokens.
- Cargar la landing pide `api/settings.php` y `api/cms.php`; en `npm run dev` esas rutas devuelven el PHP como texto y fallan (esperado, la UI tiene fallback).

## Duelos PvP (partida de rol)

- Reglas d20 en **dos sitios que deben coincidir**: `src/utils/duelEngine.js` (cliente: duelos locales y repetición) y `api/lib/duel.php` (servidor: **el único que decide** los duelos entre amigos, con `random_int`). Cualquier cambio de reglas se hace en ambos y se comprueba con `npm run validate:duel` (mismos dados → mismos duelos; `--balance` imprime el balance por clase).
- La tabla de clases que lee PHP es `api/lib/duel_classes.json`; se regenera con `node scripts/sync-duel-classes.mjs` al tocar `src/data/classes.js`.
- Modificadores comprimidos (tope +3, suelo −3) y DEX limitado en la CA: así las clases quedan entre ~36 % y ~64 % de victorias a igual nivel. No quitar los topes sin repasar el balance.
- La **Inspiración** (repeticiones heroicas) sale de trabajo real de hoy (`activityHistory`): nunca se regala ni se vende.
- **El rival decide:** un duelo entre amigos es un desafío asíncrono. El retador elige postura (queda sellada) y la envía; el amigo la ve en Party → Duels (con insignia en la barra), elige **su** postura y acepta (el servidor tira los dados en ese momento) o rechaza. Caduca a las 24 h; máx. 3 desafíos abiertos por retador y uno por pareja.
- **Solo duelos de honor:** no se quita nada de ningún guardado. Un autosave obsoleto del rival puede pisar cualquier edición del servidor sobre su `save_data`, así que no añadir botín/oro a los desafíos sin antes resolver esa carrera (p. ej. reclamos idempotentes aplicados por el cliente).
- API: `api/battle_pvp.php` con `action: preview | challenge | inbox | pending_count | respond | cancel | watch | history` (la antigua `duel` inmediata responde 410). Solo entre amigos con amistad aceptada. Tablas `duels` (eventos completos, para repetirlo) y `duel_challenges` (estado, posturas, visto/no visto); se crean solas.
- Cliente: `src/utils/duelApi.js`; `PartyView` pinta el panel Duels y abre `DuelArena` con `mode`: `fight` (sparring familiar local), `send`, `answer`, `watch`. App.jsx suma los avisos de duelo a la insignia de Party.
- UI: `src/components/duel/` (`DuelArena`, `Die`, `duelTimeline`). Los dados (`Die`, `dieGeometry`) son poliedros reales en CSS 3D (d6/d8/d10/d12/d20, caras opuestas suman N+1): la tirada es un giro que se frena y termina exactamente en la cara del resultado; la luz se recalcula por cara en cada frame. Animaciones sutiles: sin shake ni partículas.

## Cómo trabajar

1. Para el mundo, leer primero el doc de `docs/world/` que toque y mantener la paleta del design system.
2. Empezar por el código existente y su estilo (densidad de comentarios, nombres, idioma). No añadir abstracciones nuevas si ya hay una.
3. Verificar en el navegador a ~1280 px y 375 px antes de dar algo por hecho. Para estados que dependen de la API, sembrar `localStorage` (`taskoria_session`, `taskoria_family_data_<id>`) o parchear `fetch` antes de cargar.
4. Entregar código listo para pegar en el archivo correcto, indicando dónde va.
5. Commits en `main` (flujo actual del repo). No hacer push. `dist/` no se commitea desde aquí: lo genera el usuario.
6. Ante un fallo de verificación, decirlo con la salida real; no dar por bueno lo que no se ha visto funcionar.

## Agentes y skills del repo

- `.claude/agents/`: `design-director` (revisión visual), `pixel-rpg-worldbuilder` (mapas/sprites), `ux-ui-specialist` (flujos y usabilidad).
- `.claude/skills/` y `.agents/skills/`: conocimiento del dominio (`taskoria-full`, `taskoria-world`) y de diseño (`impeccable`, `design-taste-frontend`, `high-end-visual-design`…).
