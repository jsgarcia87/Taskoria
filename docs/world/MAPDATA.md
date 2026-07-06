# Taskoria World — MapData Completo

## Conexiones del Mundo

```
        [taskoriaKeep]
              ↕ norte/sur
        [townSquare] ←→ [tavernInterior]
              ↕ sur
        [mysticForest]
              ↕ cueva norte
        [shadowCrypts]
              ↕ pasaje secreto este
        [taskoriaKeep]  ← bucle cerrado
```

---

## Estado de Cada Mapa

### 1. townSquare — Hub principal ✅ mejor estado

```js
townSquare: {
  id: 'townSquare',
  name: 'Town Square',
  tileSprite: 'cobblestone_warm',
  width: 20, height: 22,
  bgColor: '#2a1f12',
  ambientLight: 0.85,
  spawn: { x: 9, y: 12 },

  obstacles: [
    // ── Taberna (noroeste) ──
    {
      x: 0, y: 0, w: 5, h: 5,
      type: 'shop_building',
      label: 'El Grifo Roto',
      roofType: 'thatch',
      facadeType: 'halftimber',
      wins: 1, chimney: true,
      doorType: 'arch',
      colors: { roofLight:'#e0c050', roofDark:'#786010', plaster:'#f0e8c0', beams:'#6a3e18', door:'#8a5228' },
    },
    // ── Armería (noreste) ──
    {
      x: 15, y: 0, w: 5, h: 5,
      type: 'shop_building',
      label: 'Armería Dorveth',
      roofType: 'wood',
      facadeType: 'halftimber',
      wins: 1, chimney: false,
      doorType: 'arch',
      colors: { roofLight:'#b07030', roofDark:'#603010', plaster:'#f8f0d8', beams:'#6a3e18', door:'#7a4820' },
    },
    // ── Pozo central ──
    { x: 8, y: 6, w: 3, h: 3, type: 'well', label: 'Pozo de Brumavalle' },
    // ── Banco plaza ──
    { x: 5, y: 11, w: 3, h: 1, type: 'bench' },
    { x: 12, y: 11, w: 3, h: 1, type: 'bench' },
    // ── Mercado oeste ──
    { x: 1, y: 9, w: 3, h: 2, type: 'market_stall', label: 'Puesto Frutas' },
    { x: 1, y: 13, w: 3, h: 2, type: 'market_stall', label: 'Puesto Especias' },
    // ── Mercado este ──
    { x: 16, y: 9, w: 3, h: 2, type: 'market_stall', label: 'Puesto Armas' },
    { x: 16, y: 13, w: 3, h: 2, type: 'market_stall', label: 'Puesto Pociones' },
    // ── Pilares entrada sur ──
    { x: 7, y: 19, w: 1, h: 2, type: 'pillar' },
    { x: 12, y: 19, w: 1, h: 2, type: 'pillar' },
    // ── Muralla sur ──
    { x: 0, y: 21, w: 7, h: 1, type: 'pillar' },
    { x: 13, y: 21, w: 7, h: 1, type: 'pillar' },
  ],

  decorations: [
    // Antorchas
    { type: 'torch', x: 5, y: 1 }, { type: 'torch', x: 14, y: 1 },
    { type: 'torch', x: 6, y: 5 }, { type: 'torch', x: 13, y: 5 },
    { type: 'torch', x: 0, y: 8 }, { type: 'torch', x: 19, y: 8 },
    { type: 'torch', x: 0, y: 15 }, { type: 'torch', x: 19, y: 15 },
    { type: 'torch', x: 6, y: 18 }, { type: 'torch', x: 13, y: 18 },
    // Flores
    { type: 'flowers', x: 6, y: 9 }, { type: 'flowers', x: 12, y: 9 },
    { type: 'flowers', x: 5, y: 4 }, { type: 'flowers', x: 15, y: 4 },
    { type: 'flowers', x: 8, y: 17 }, { type: 'flowers', x: 11, y: 17 },
    // Banners
    { type: 'banner', x: 2, y: 0 }, { type: 'banner', x: 17, y: 0 },
    // Critters
    { type: 'critter', x: 10, y: 3 }, { type: 'critter', x: 3, y: 17 },
    // NPCs
    { type: 'vendor_npc', x: 9, y: 2, npcId: 'torwald' },
    { type: 'bartender_npc', x: 1, y: 5, npcId: 'marga_ext' },
    { type: 'vendor_npc', x: 17, y: 5, npcId: 'herrero' },
    { type: 'vendor_npc', x: 2, y: 12, npcId: 'mercader_1' },
  ],

  portals: [
    { id: 'portal_to_tavern', x: 1, y: 4, w: 3, h: 1, target: 'tavernInterior', targetSpawn: { x: 5, y: 11 }, label: 'El Grifo Roto' },
    { id: 'portal_to_keep', x: 7, y: 0, w: 6, h: 1, target: 'taskoriaKeep', targetSpawn: { x: 9, y: 16 }, label: 'Castillo Dorveth', condition: { minLevel: 3 } },
    { id: 'portal_to_forest', x: 7, y: 21, w: 6, h: 1, target: 'mysticForest', targetSpawn: { x: 9, y: 1 }, label: 'Bosque de Ashenveil' },
  ],
},
```

### 2. tavernInterior ✅ aceptable

```js
tavernInterior: {
  id: 'tavernInterior',
  name: 'El Grifo Roto',
  tileSprite: 'wood_floor',
  width: 16, height: 14,
  bgColor: '#1a0e06',
  ambientLight: 0.50,
  spawn: { x: 4, y: 12 },

  obstacles: [
    { x: 1, y: 1, w: 12, h: 2, type: 'bench', label: 'Barra' },
    { x: 1, y: 9, w: 2, h: 2, type: 'well', label: 'Chimenea' },
    { x: 4, y: 4, w: 2, h: 2, type: 'stool', label: 'Mesa' },
    { x: 9, y: 4, w: 2, h: 2, type: 'stool', label: 'Mesa' },
    { x: 4, y: 7, w: 2, h: 2, type: 'stool', label: 'Mesa' },
    { x: 9, y: 7, w: 2, h: 2, type: 'stool', label: 'Mesa' },
    { x: 13, y: 1, w: 2, h: 3, type: 'bench', label: 'Escalera' },
  ],

  decorations: [
    { type: 'torch', x: 0, y: 3 }, { type: 'torch', x: 15, y: 3 },
    { type: 'torch', x: 0, y: 8 }, { type: 'torch', x: 15, y: 8 },
    { type: 'torch', x: 7, y: 0 },
    { type: 'vendor_npc', x: 7, y: 2, npcId: 'marga_inside' },
    { type: 'vendor_npc', x: 13, y: 10, npcId: 'bardo' },
  ],

  portals: [
    { id: 'portal_exit_tavern', x: 3, y: 13, w: 2, h: 1, target: 'townSquare', targetSpawn: { x: 3, y: 5 }, label: 'Salir a Brumavalle' },
  ],
},
```

### 3. taskoriaKeep ⚠️ necesita mejoras

```js
taskoriaKeep: {
  id: 'taskoriaKeep',
  name: 'Castillo Dorveth',
  tileSprite: 'royal_stone',  // ← AÑADIR a sprites.jsx
  width: 20, height: 18,
  bgColor: '#0d0d1a',
  ambientLight: 0.30,
  spawn: { x: 10, y: 13 },

  obstacles: [
    // Trono (norte centro)
    { x: 9, y: 2, w: 2, h: 2, type: 'throne', label: 'Trono Dorveth' },
    { x: 7, y: 3, w: 6, h: 1, type: 'bench', label: 'Estrado' },
    // Columnas simétricas
    { x: 3, y: 5, w: 1, h: 2, type: 'pillar' }, { x: 16, y: 5, w: 1, h: 2, type: 'pillar' },
    { x: 3, y: 9, w: 1, h: 2, type: 'pillar' }, { x: 16, y: 9, w: 1, h: 2, type: 'pillar' },
    // Estatuas guardianas
    { x: 6, y: 2, w: 1, h: 2, type: 'statue', label: 'Guardián' },
    { x: 13, y: 2, w: 1, h: 2, type: 'statue', label: 'Guardián' },
    // Muralla norte
    { x: 0, y: 0, w: 20, h: 1, type: 'pillar' },
  ],

  decorations: [
    // Alfombra roja central (type especial)
    { type: 'cobble_patch', x: 9, y: 5, variant: 'carpet_red' },
    { type: 'cobble_patch', x: 10, y: 5, variant: 'carpet_red' },
    { type: 'cobble_patch', x: 9, y: 6, variant: 'carpet_red' },
    { type: 'cobble_patch', x: 10, y: 6, variant: 'carpet_red' },
    { type: 'cobble_patch', x: 9, y: 7, variant: 'carpet_red' },
    { type: 'cobble_patch', x: 10, y: 7, variant: 'carpet_red' },
    { type: 'cobble_patch', x: 9, y: 8, variant: 'carpet_red' },
    { type: 'cobble_patch', x: 10, y: 8, variant: 'carpet_red' },
    // Antorchas
    { type: 'torch', x: 7, y: 1 }, { type: 'torch', x: 12, y: 1 },
    { type: 'torch', x: 2, y: 5 }, { type: 'torch', x: 17, y: 5 },
    { type: 'torch', x: 2, y: 9 }, { type: 'torch', x: 17, y: 9 },
    // Banners
    { type: 'banner', x: 1, y: 1 }, { type: 'banner', x: 18, y: 1 },
    // Estandarte caído (narrativa)
    { type: 'crack', x: 5, y: 10, label: 'estandarte_caido' },
    // Telarañas
    { type: 'puddle', x: 0, y: 14, label: 'telarana' },
    { type: 'puddle', x: 19, y: 14, label: 'telarana' },
    // Espectro
    { type: 'vendor_npc', x: 10, y: 3, npcId: 'rey_dorveth_fantasma' },
  ],

  portals: [
    { id: 'portal_keep_exit', x: 8, y: 17, w: 4, h: 1, target: 'townSquare', targetSpawn: { x: 12, y: 1 }, label: 'Salir al pueblo' },
    { id: 'portal_keep_crypts', x: 0, y: 12, w: 1, h: 2, target: 'shadowCrypts', targetSpawn: { x: 18, y: 7 }, label: 'Pasaje secreto…', condition: { questFlag: 'found_secret_passage' } },
  ],
},
```

### 4. mysticForest ❌ por construir

```js
mysticForest: {
  id: 'mysticForest',
  name: 'Bosque de Ashenveil',
  tileSprite: 'grass_dense',  // ← AÑADIR a sprites.jsx
  width: 24, height: 20,
  bgColor: '#060f06',
  ambientLight: 0.40,
  spawn: { x: 10, y: 1 },

  obstacles: [
    // Cinturón de árboles
    { x: 0, y: 0, w: 24, h: 1, type: 'pine_tree' },
    { x: 0, y: 0, w: 1, h: 20, type: 'pine_tree' },
    { x: 23, y: 0, w: 1, h: 20, type: 'pine_tree' },
    // Árboles interiores
    { x: 3, y: 3, w: 2, h: 2, type: 'oak_tree' },
    { x: 7, y: 5, w: 2, h: 2, type: 'oak_tree' },
    { x: 18, y: 4, w: 2, h: 2, type: 'oak_tree' },
    { x: 20, y: 7, w: 2, h: 2, type: 'pine_tree' },
    { x: 2, y: 10, w: 2, h: 2, type: 'pine_tree' },
    { x: 5, y: 14, w: 2, h: 2, type: 'oak_tree' },
    { x: 17, y: 12, w: 2, h: 2, type: 'oak_tree' },
    // Árbol muerto (zona pantano)
    { x: 2, y: 6, w: 2, h: 3, type: 'pine_tree', variant: 'dead' },
    // Ruinas druidas
    { x: 18, y: 2, w: 1, h: 1, type: 'pillar', label: 'ruina' },
    { x: 20, y: 2, w: 1, h: 1, type: 'pillar', label: 'ruina' },
    { x: 19, y: 4, w: 2, h: 1, type: 'bench', label: 'altar_druida' },
    // Hoguera campamento
    { x: 11, y: 9, w: 1, h: 1, type: 'well', label: 'hoguera' },
    // Cueva norte → Cripta
    { x: 10, y: 0, w: 4, h: 2, type: 'pillar', label: 'boca_cueva' },
  ],

  decorations: [
    // Flores en sendero
    { type: 'flowers', x: 9, y: 3 }, { type: 'flowers', x: 12, y: 3 },
    { type: 'flowers', x: 9, y: 7 }, { type: 'flowers', x: 14, y: 7 },
    // Charcos pantano
    { type: 'puddle', x: 1, y: 12 }, { type: 'puddle', x: 3, y: 14 },
    // Antorchas del sendero
    { type: 'torch', x: 10, y: 4 }, { type: 'torch', x: 10, y: 8 },
    { type: 'torch', x: 10, y: 12 }, { type: 'torch', x: 10, y: 16 },
    // Espíritu del bosque
    { type: 'critter', x: 12, y: 6, npcId: 'espiritu_bosque' },
    // Cofre campamento
    { type: 'stool', x: 10, y: 11, label: 'cofre' },
  ],

  portals: [
    { id: 'forest_to_town', x: 10, y: 19, w: 4, h: 1, target: 'townSquare', targetSpawn: { x: 12, y: 18 }, label: 'Volver a Brumavalle' },
    { id: 'forest_to_crypts', x: 10, y: 0, w: 4, h: 1, target: 'shadowCrypts', targetSpawn: { x: 10, y: 17 }, label: 'Entrar a la cueva…' },
  ],
},
```

### 5. shadowCrypts ❌ por construir

```js
shadowCrypts: {
  id: 'shadowCrypts',
  name: 'Mazmorras de Piedra Negra',
  tileSprite: 'dungeon_stone',  // ← AÑADIR a sprites.jsx
  width: 20, height: 22,
  bgColor: '#050508',
  ambientLight: 0.18,
  spawn: { x: 10, y: 17 },

  // Layout: 3 cámaras verticales
  // [BOSS ROOM]       y:0-5
  // [CÁMARA CENTRAL]  y:7-14
  // [ANTECÁMARA]      y:16-22

  obstacles: [
    // Muros exteriores
    { x: 0, y: 0, w: 20, h: 1, type: 'pillar' },
    { x: 0, y: 0, w: 1, h: 22, type: 'pillar' },
    { x: 19, y: 0, w: 1, h: 22, type: 'pillar' },
    // Separadores de cámaras con huecos (puertas)
    { x: 0, y: 5, w: 8, h: 1, type: 'pillar' },
    { x: 12, y: 5, w: 8, h: 1, type: 'pillar' },
    { x: 8, y: 5, w: 4, h: 1, type: 'pillar', label: 'puerta_boss', isTrigger: true },
    // Boss room — altar
    { x: 8, y: 1, w: 4, h: 2, type: 'throne', label: 'altar_oscuro' },
    { x: 5, y: 1, w: 1, h: 2, type: 'pillar' }, { x: 14, y: 1, w: 1, h: 2, type: 'pillar' },
    // Cámara central — sarcófago
    { x: 0, y: 7, w: 7, h: 1, type: 'pillar' }, { x: 13, y: 7, w: 7, h: 1, type: 'pillar' },
    { x: 7, y: 7, w: 6, h: 1, type: 'pillar', label: 'reja' },
    { x: 8, y: 9, w: 4, h: 3, type: 'bench', label: 'sarcofago' },
    { x: 3, y: 8, w: 1, h: 2, type: 'statue', label: 'guardian' },
    { x: 16, y: 8, w: 1, h: 2, type: 'statue', label: 'guardian' },
    // Antecámara
    { x: 0, y: 14, w: 7, h: 1, type: 'pillar' }, { x: 13, y: 14, w: 7, h: 1, type: 'pillar' },
    { x: 7, y: 14, w: 6, h: 1, type: 'pillar', label: 'reja' },
    { x: 3, y: 17, w: 2, h: 2, type: 'stool', label: 'cofre' },
  ],

  decorations: [
    // Boss room
    { type: 'torch', x: 6, y: 2, variant: 'dim' },
    { type: 'torch', x: 13, y: 2, variant: 'dim' },
    { type: 'crack', x: 9, y: 4 }, { type: 'crack', x: 10, y: 4 },
    { type: 'puddle', x: 7, y: 3 }, { type: 'puddle', x: 12, y: 3 },
    // Cámara central
    { type: 'torch', x: 1, y: 10 }, { type: 'torch', x: 18, y: 10 },
    { type: 'crack', x: 7, y: 9 }, { type: 'crack', x: 12, y: 9 },
    { type: 'banner', x: 9, y: 8, variant: 'torn' },
    // Antecámara
    { type: 'torch', x: 4, y: 15 }, { type: 'torch', x: 15, y: 15 },
    { type: 'torch', x: 1, y: 18 }, { type: 'torch', x: 18, y: 18 },
    { type: 'puddle', x: 0, y: 20, label: 'telarana' },
    { type: 'puddle', x: 19, y: 20, label: 'telarana' },
    // Boss NPC
    { type: 'statue', x: 10, y: 2, npcId: 'crypt_lord', isBoss: true },
  ],

  portals: [
    { id: 'crypts_to_forest', x: 8, y: 21, w: 4, h: 1, target: 'mysticForest', targetSpawn: { x: 11, y: 1 }, label: 'Salir al bosque' },
    { id: 'crypts_to_keep', x: 19, y: 7, w: 1, h: 2, target: 'taskoriaKeep', targetSpawn: { x: 1, y: 12 }, label: 'Pasaje al castillo', condition: { questFlag: 'found_secret_passage' } },
    { id: 'boss_trigger', x: 8, y: 5, w: 4, h: 1, target: null, isEvent: true, eventId: 'boss_crypt_lord', label: 'Boss Fight', condition: { questFlag: 'crypts_central_cleared' } },
  ],
},
```
