export const MAP_DATA = {
    townSquare: {
        id: 'townSquare',
        name: 'Town Square',
        width: 1600,
        height: 1000,
        className: 'medieval-town-bg', // fallback if no tileSprite is set
        baseColor: '#2b1f1a',
        background: {}, // Relies on CSS class (overridden when tileSprite is set)
        tileSprite: 'cobblestone_tile', // pixel-art floor tile from sprites.js
        tileSize: 64, // px per tile on screen (1:1 with source grid)
        spawn: { x: 800, y: 560 },
        // Simple rectangular obstacles { x, y, width, height }
        obstacles: [
            // Central well (on the plaza grass island)
            { x: 752, y: 352, width: 96, height: 96, type: 'well' },
            // Plaza oak trunk (shares the island with the well, NE so it z-sorts behind)
            { x: 845, y: 348, width: 40, height: 22, type: 'tree' },
            // Ledgar statue base (plaza south edge, off-center landmark)
            { x: 632, y: 662, width: 56, height: 28, type: 'statue' },
            // Tavern building (north row — its door hosts the tavern portal)
            { x: 880, y: 70, width: 240, height: 130, type: 'tavern' },
            // Keep gate pillars (NE) — frame the road up to the castle
            { x: 1270, y: 110, width: 34, height: 70, type: 'pillar' },
            { x: 1436, y: 110, width: 34, height: 70, type: 'pillar' },
            // Council bulletin board (by the gate)
            { x: 1500, y: 64, width: 80, height: 96, type: 'board' },
            // Item shop building (south-west lane)
            { x: 150, y: 590, width: 280, height: 150, type: 'shop' },
            // Canal water (south edge) — pier gap at x 760–850
            { x: 40, y: 890, width: 716, height: 80 },
            { x: 854, y: 890, width: 706, height: 80 },
            // North wall
            { x: 0, y: 0, width: 1600, height: 40 },
            // South bank
            { x: 0, y: 970, width: 1600, height: 30 },
            // West wall
            { x: 0, y: 0, width: 40, height: 1000 },
            // East wall
            { x: 1560, y: 0, width: 40, height: 1000 },
        ],
        // Proximity interaction zones (open app sections). target maps to a PartyView tab.
        interactables: [
            { x: 210, y: 745, width: 160, height: 120, radius: 120, target: 'shop', label: 'Item Shop' },
            { x: 1180, y: 780, width: 220, height: 130, radius: 130, target: 'sanctuary', label: 'Pet Sanctuary' },
            // --- Environmental storytelling (examine-style, no app section) ---
            { id: 'fx_ledgar', x: 640, y: 645, width: 40, height: 40, radius: 85, label: 'Read the plaque',
              flavor: '"What goes unwritten, time will steal." — Ledgar, First Archivist of the Council' },
            { id: 'fx_well', x: 770, y: 370, width: 60, height: 60, radius: 95, label: 'Look into the well',
              flavor: 'Copper coins glint at the bottom. Coinhilda logs every wish — interest included.' },
            { id: 'fx_board', x: 1510, y: 80, width: 60, height: 60, radius: 95, label: 'Quest board',
              flavor: '"Heroes wanted. Rewards guaranteed. Slacking will be noted." — Notifus, Council Herald' },
            { id: 'fx_barrel', x: 355, y: 700, width: 40, height: 30, radius: 75, label: 'Tipped barrel',
              flavor: '"FREE APPLES", the sign said. The sign is gone. So are most of the apples.' },
            { id: 'fx_cat', x: 305, y: 748, width: 24, height: 16, radius: 60, label: 'Sleeping cat',
              flavor: "The shopkeeper's cat. It has never caught a mouse. It has never needed to." },
            { id: 'fx_canal', x: 775, y: 915, width: 50, height: 40, radius: 80, label: 'Canal pier',
              flavor: 'Boats used to moor here once. Coinhilda still keeps the mooring ledger — just in case they return.' },
            { id: 'fx_market', x: 1150, y: 260, width: 50, height: 40, radius: 85, label: 'Market stall',
              flavor: 'Everything costs "two coins". The haggling is ceremonial. The two coins are not.' }
        ],
        portals: [
            // Tavern door (in the north building row)
            {
                x: 950, y: 175, width: 100, height: 55,
                targetMap: 'tavernInterior',
                targetX: 400, targetY: 600,
                label: 'Tavern'
            },
            // Path to Mystic Forest
            {
                x: 40, y: 250, width: 60, height: 100,
                targetMap: 'mysticForest',
                targetX: 1800, targetY: 400,
                label: 'Mystic Forest'
            },
            // Portal to Castle
            {
                x: 1300, y: 40, width: 100, height: 60,
                targetMap: 'taskoriaKeep',
                targetX: 500, targetY: 850,
                label: 'Taskoria Keep'
            }
        ],
        // Composite scenes — kept to the bare-minimum that gives Town Square
        // its identity while staying under paint budget on lower-end devices.
        // These maps are provisional (user-built maps will replace them via
        // the map editor), so we err hard toward performance over decoration.
        // Layout grammar (ref: classic RPG town): building mass frames the
        // streets, plaza in the middle, canal closes the south. Props always
        // hug a facade — nothing floats in the open.
        prefabs: [
            // North-west residential row — the town's built edge
            { name: 'town_houses',    x: 100,  y: 70, count: 2, seed: 3 },
            // Item shop moved to the south-west lane, facing east toward the plaza
            { name: 'shop_complete',  x: 150,  y: 590 },
            { name: 'sanctuary_pen',  x: 1120, y: 560, width: 360, height: 320 },
            // West-edge planting frames the forest portal
            { name: 'garden_patch',   x: 120,  y: 450, seed: 21 },
            // Market by the keep road (NE) — reason to walk that street
            { name: 'market_corner',  x: 1130, y: 240, accent: '#9a2a2a' },
            // Green pockets against the plaza corners
            { name: 'garden_patch',   x: 640,  y: 300, seed: 5 },
            { name: 'garden_patch',   x: 1020, y: 660, seed: 9 },
        ],
        decorations: [
            // --- STREETS — warm-sand paths between the building masses ---
            //   East-west main street: forest portal → plaza → sanctuary
            { type: 'rect', x: 0, y: 470, width: 1600, height: 90, color: '#c8a878', opacity: 0.55, z: 0 },
            { type: 'rect', x: 0, y: 490, width: 1600, height: 50, color: '#b89868', opacity: 0.5, z: 0 },
            //   North-south street: tavern → plaza → canal pier
            { type: 'rect', x: 760, y: 100, width: 90, height: 800, color: '#c8a878', opacity: 0.55, z: 0 },
            { type: 'rect', x: 780, y: 100, width: 50, height: 800, color: '#b89868', opacity: 0.5, z: 0 },
            //   Spur: tavern door joins the north-south street
            { type: 'rect', x: 850, y: 210, width: 150, height: 60, color: '#c8a878', opacity: 0.5, z: 0 },
            //   Spur: keep-gate road down to the main street
            { type: 'rect', x: 1290, y: 100, width: 60, height: 400, color: '#c8a878', opacity: 0.45, z: 0 },
            //   Spur: shop lane (south-west)
            { type: 'rect', x: 430, y: 690, width: 330, height: 60, color: '#c8a878', opacity: 0.5, z: 0 },
            //   Spur: sanctuary entrance
            { type: 'rect', x: 1100, y: 540, width: 60, height: 80, color: '#c8a878', opacity: 0.5, z: 0 },

            // --- West-edge trees framing the forest portal ---
            { type: 'sprite', name: 'oak_tree', x: 130, y: 240, scale: 1.8, z: 240 },
            { type: 'sprite', name: 'pine_tree', x: 110, y: 400, scale: 1.7, z: 400 },

            // --- PLAZA — grass island holding the old well and its oak ---
            { type: 'rect', x: 672, y: 296, width: 256, height: 216, color: '#8a9a6a', opacity: 0.6, radius: '9999px', z: 0 },
            { type: 'rect', x: 684, y: 306, width: 232, height: 196, color: '#5a8a3a', opacity: 0.55, radius: '9999px', z: 0 },
            { type: 'well', x: 752, y: 352, width: 96, height: 96 },
            { type: 'sprite', name: 'oak_tree', x: 865, y: 370, scale: 2.0, z: 370 },
            { type: 'sprite', name: 'grass_tuft', x: 700, y: 460, scale: 1.4, z: 460 },
            { type: 'flowers', x: 700, y: 330, size: 30 },
            { type: 'bench', x: 624, y: 540, size: 60 },
            { type: 'bench', x: 950, y: 540, size: 60 },

            // --- Lamps at the plaza corners ---
            { type: 'lamp', x: 600,  y: 300, size: 64 },
            { type: 'lamp', x: 1000, y: 300, size: 64 },
            { type: 'lamp', x: 600,  y: 760, size: 64 },
            { type: 'lamp', x: 1000, y: 760, size: 64 },

            // --- Ledgar statue: Council landmark on the plaza south edge ---
            { type: 'sprite', name: 'ledgar_statue', x: 660, y: 690, scale: 1.6, z: 690 },

            // --- Tavern (north row) — the building the portal lives in ---
            { type: 'shop_building', x: 880, y: 70, width: 240, height: 150 },
            { type: 'banner', x: 1000, y: 90, color: '#fbbf24', icon: '✦' },
            { type: 'sign', x: 1140, y: 180, label: 'INN' },
            { type: 'barrel', x: 896, y: 214, size: 34 },
            { type: 'crate', x: 932, y: 220, size: 30 },

            // --- Keep gate (NE): stone pillars + gold banners frame the road ---
            { type: 'pillar', x: 1270, y: 110, width: 34, height: 90 },
            { type: 'pillar', x: 1436, y: 110, width: 34, height: 90 },
            { type: 'sprite', name: 'banner_gold', x: 1287, y: 208, scale: 1.5, z: 208 },
            { type: 'sprite', name: 'banner_gold', x: 1453, y: 208, scale: 1.5, z: 208 },

            // --- Council quest board (by the gate) ---
            { type: 'sprite', name: 'council_board', x: 1540, y: 165, scale: 2, z: 165 },

            // --- Shop-lane microstory: tipped cider barrel + the shop cat ---
            { type: 'sprite', name: 'barrel_tipped', x: 370, y: 735, scale: 1.6, z: 735 },
            { type: 'sprite', name: 'crate', x: 408, y: 718, scale: 1.4, z: 718 },
            { type: 'sprite', name: 'cat_sleeping', x: 315, y: 758, scale: 1.6, z: 758 },

            // --- CANAL (south edge) — stone-rimmed water with a wooden pier ---
            { type: 'rect', x: 40, y: 890, width: 1520, height: 80, color: '#4682b4', opacity: 0.6, z: 0 },
            { type: 'rect', x: 40, y: 886, width: 1520, height: 6, color: '#9aa8b2', opacity: 0.8, z: 1 },
            { type: 'rect', x: 40, y: 966, width: 1520, height: 6, color: '#9aa8b2', opacity: 0.8, z: 1 },
            //   Pier planks (the walkable gap in the water)
            { type: 'rect', x: 756, y: 886, width: 98, height: 88, color: '#78350f', z: 1 },
            { type: 'rect', x: 756, y: 908, width: 98, height: 4, color: '#5c3a21', opacity: 0.8, z: 2 },
            { type: 'rect', x: 756, y: 932, width: 98, height: 4, color: '#5c3a21', opacity: 0.8, z: 2 },
            { type: 'rect', x: 756, y: 956, width: 98, height: 4, color: '#5c3a21', opacity: 0.8, z: 2 },
            { type: 'bench', x: 800, y: 916, size: 54 },
            //   Reeds on the north bank + a couple of lily pads
            { type: 'sprite', name: 'grass_tuft', x: 140,  y: 888, scale: 1.5, z: 888 },
            { type: 'sprite', name: 'grass_tuft', x: 420,  y: 886, scale: 1.4, z: 886 },
            { type: 'sprite', name: 'grass_tuft', x: 1010, y: 888, scale: 1.5, z: 888 },
            { type: 'sprite', name: 'grass_tuft', x: 1240, y: 886, scale: 1.4, z: 886 },
            { type: 'sprite', name: 'grass_tuft', x: 1480, y: 888, scale: 1.5, z: 888 },
            { type: 'rect', x: 600,  y: 930, width: 26, height: 14, color: '#16a34a', opacity: 0.7, radius: '50%', z: 1 },
            { type: 'rect', x: 1150, y: 925, width: 26, height: 14, color: '#16a34a', opacity: 0.7, radius: '50%', z: 1 },
        ]
    },
    taskoriaKeep: {
        id: 'taskoriaKeep',
        name: 'Taskoria Keep',
        width: 1000,
        height: 1000,
        baseColor: '#2a2a3a',
        tileSprite: 'stone_floor_tile',
        tileSize: 64,
        spawn: { x: 500, y: 850 },
        obstacles: [
            { x: 0, y: 0, width: 1000, height: 100 }, // Top
            { x: 0, y: 900, width: 1000, height: 100 }, // Bottom
            { x: 0, y: 0, width: 100, height: 1000 }, // Left
            { x: 900, y: 0, width: 100, height: 1000 }, // Right
        ],
        portals: [
            {
                x: 450, y: 900, width: 100, height: 60,
                targetMap: 'townSquare',
                targetX: 1350, targetY: 150,
                label: 'Exit to Town'
            }
        ],
        // Composite scenes — throne hall + flanking library wings
        prefabs: [
            { name: 'royal_dais', x: 500, y: 130 },
        ],
        // Environmental storytelling — the Council's seat of (mostly clerical) power
        interactables: [
            { id: 'fx_throne', x: 480, y: 230, width: 40, height: 40, radius: 110, label: 'The Council seat',
              flavor: 'The Council seat. Ledgar counts, Coinhilda funds, Notifus announces. The chair itself does nothing — magnificently.' },
            { id: 'fx_archives', x: 140, y: 370, width: 40, height: 40, radius: 90, label: 'Council archives',
              flavor: 'Council records, alphabetized twice. Ledgar does not trust the first alphabet.' },
            { id: 'fx_armor', x: 270, y: 490, width: 40, height: 40, radius: 85, label: 'Ceremonial armor',
              flavor: 'Ceremonial armor. Never worn in battle. Polished daily. Priorities.' }
        ],
        decorations: [
            // Council banners flanking the dais — gold for the Council seal
            { type: 'sprite', name: 'banner_gold', x: 400, y: 250, scale: 1.6, z: 250 },
            { type: 'sprite', name: 'banner_gold', x: 600, y: 250, scale: 1.6, z: 250 },
            { type: 'sprite', name: 'banner_purple', x: 300, y: 280, scale: 1.5, z: 280 },
            { type: 'sprite', name: 'banner_purple', x: 700, y: 280, scale: 1.5, z: 280 },

            // Bookshelves along the side walls — library corners flanking the throne hall
            { type: 'sprite', name: 'bookshelf', x: 150, y: 380, scale: 1.6, z: 380 },
            { type: 'sprite', name: 'bookshelf', x: 850, y: 380, scale: 1.6, z: 380 },
            { type: 'sprite', name: 'bookshelf', x: 150, y: 580, scale: 1.6, z: 580 },
            { type: 'sprite', name: 'bookshelf', x: 850, y: 580, scale: 1.6, z: 580 },

            // Wall torches with halos along the side walls (rhythm + light)
            { type: 'sprite', name: 'wall_torch', x: 130, y: 480, scale: 1.6, z: 480 },
            { type: 'sprite', name: 'wall_torch', x: 870, y: 480, scale: 1.6, z: 480 },
            { type: 'sprite', name: 'wall_torch', x: 130, y: 720, scale: 1.6, z: 720 },
            { type: 'sprite', name: 'wall_torch', x: 870, y: 720, scale: 1.6, z: 720 },
            { type: 'lantern_glow', x: 130, y: 480, radius: 110, color: 'rgba(255,170,60,0.32)', z: 1 },
            { type: 'lantern_glow', x: 870, y: 480, radius: 110, color: 'rgba(255,170,60,0.32)', z: 1 },
            { type: 'lantern_glow', x: 130, y: 720, radius: 110, color: 'rgba(255,170,60,0.32)', z: 1 },
            { type: 'lantern_glow', x: 870, y: 720, radius: 110, color: 'rgba(255,170,60,0.32)', z: 1 },

            // Decorative armor stands deeper into the hall (not the dais guards)
            { type: 'sprite', name: 'armor_stand', x: 280, y: 500, scale: 1.7, z: 500 },
            { type: 'sprite', name: 'armor_stand', x: 720, y: 500, scale: 1.7, z: 500 },
            { type: 'sprite', name: 'armor_stand', x: 280, y: 760, scale: 1.7, z: 760 },
            { type: 'sprite', name: 'armor_stand', x: 720, y: 760, scale: 1.7, z: 760 },

            // Ground texture variation — break the empty stone field
            { type: 'cobble_patch', x: 500, y: 500, width: 280, height: 180, color: '#1a1a2a', opacity: 0.35, z: 0 },
            { type: 'crack', x: 400, y: 520, length: 70, angle: 12, z: 0 },
            { type: 'crack', x: 600, y: 580, length: 60, angle: -22, z: 0 },
        ]
    },
    tavernInterior: {
        id: 'tavernInterior',
        name: 'The Rusty Sword Inn',
        width: 800,
        height: 800,
        baseColor: '#3d261b',
        tileSprite: 'wood_floor_tile',
        tileSize: 64,
        spawn: { x: 400, y: 600 },
        obstacles: [
            // Walls
            { x: 0, y: 0, width: 800, height: 100 }, // Top
            { x: 0, y: 700, width: 800, height: 100 }, // Bottom (except door)
            { x: 0, y: 0, width: 100, height: 800 }, // Left
            { x: 700, y: 0, width: 100, height: 800 }, // Right
            // Bar counter
            { x: 200, y: 200, width: 400, height: 80 },
            // Tables
            { x: 200, y: 400, width: 120, height: 80 },
            { x: 500, y: 400, width: 120, height: 80 }
        ],
        // Council interaction zones. Ledgar sits in the right nook past the
        // bar and opens the beta-feedback modal when the hero speaks with him.
        interactables: [
            { x: 640, y: 210, width: 80, height: 100, radius: 80, target: 'ledgar', label: 'Send word to Ledgar' },
            // Environmental storytelling
            { id: 'fx_hearth', x: 110, y: 90, width: 40, height: 40, radius: 85, label: 'The hearth',
              flavor: 'Nobody remembers lighting this fire. It refuses to go out. The innkeeper stopped asking.' },
            { id: 'fx_bar_mugs', x: 440, y: 140, width: 40, height: 30, radius: 80, label: 'Warm mugs',
              flavor: 'Three mugs, still warm. The Night Shift Guild was here a minute ago. They always are.' },
            { id: 'fx_dropped_mug', x: 330, y: 505, width: 30, height: 20, radius: 65, label: 'Dropped mug',
              flavor: 'A dropped mug. The ale never reached its destination. A moment of silence.' }
        ],
        portals: [
            // Door to outside
            {
                x: 350, y: 700, width: 100, height: 60,
                targetMap: 'townSquare',
                targetX: 990, targetY: 275,
                label: 'Exit'
            }
        ],
        decorations: [
            // Bar counter
            { x: 200, y: 200, type: 'bar_counter', width: 400, height: 80 },
            { x: 400, y: 150, type: 'mug', size: 40 },
            { x: 450, y: 150, type: 'mug', size: 40 },
            { x: 500, y: 150, type: 'mug', size: 40 },
            { x: 350, y: 130, type: 'bartender_npc', size: 60 },

            // Tables
            { x: 200, y: 400, type: 'table', width: 120, height: 80 },
            { x: 500, y: 400, type: 'table', width: 120, height: 80 },
            
            // Chairs
            { x: 180, y: 420, type: 'stool', size: 30 },
            { x: 300, y: 420, type: 'stool', size: 30 },
            { x: 480, y: 420, type: 'stool', size: 30 },
            { x: 600, y: 420, type: 'stool', size: 30 },

            // Fireplace
            { x: 120, y: 100, type: 'fire', size: 60 },

            // Rug
            { x: 300, y: 550, type: 'rect', width: 200, height: 140, color: '#7f1d1d', opacity: 0.8, radius: '10px', z: 0 },

            // Archivist Ledgar of the Parchment — Council NPC for bug reports.
            // Placed in the right nook so he's visible on entry but not blocking
            // the bar or the tables.
            { x: 680, y: 310, type: 'ledgar_npc', size: 60 },

            // ─── Microstory: someone left the left table in a hurry ────────
            // A stool shoved away from the table and a mug on the floor by
            // the rug. Whatever the news was, it couldn't wait.
            { x: 240, y: 515, type: 'stool', size: 30 },
            { x: 335, y: 512, type: 'mug', size: 28 },
            // The inn's own cat, asleep in the warmest spot by the fire
            { type: 'sprite', name: 'cat_sleeping', x: 185, y: 165, scale: 1.5, z: 165 }
        ]
    },
    mysticForest: {
        id: 'mysticForest',
        name: 'Mystic Forest',
        width: 2000,
        height: 1000,
        baseColor: '#166534',
        tileSprite: 'grass_tile',
        tileSize: 64,
        spawn: { x: 1800, y: 400 },
        obstacles: [
            // Bounds
            { x: 0, y: 0, width: 2000, height: 100 },
            { x: 0, y: 900, width: 2000, height: 100 },
            { x: 0, y: 0, width: 100, height: 1000 },
            { x: 1900, y: 0, width: 100, height: 1000 },
            // River (blocks passage except on bridge)
            { x: 800, y: 100, width: 200, height: 300 },
            { x: 800, y: 600, width: 200, height: 300 },
            // Elderwood trunk (east clearing landmark)
            { x: 1320, y: 445, width: 60, height: 25, type: 'tree' }
        ],
        // Environmental storytelling — examine points with Council-flavored voice
        interactables: [
            { id: 'fx_elderwood', x: 1330, y: 430, width: 40, height: 40, radius: 100, label: 'The Elderwood',
              flavor: 'The Elderwood. Its rings remember every quest ever completed. There is room for more.' },
            { id: 'fx_fairy_ring', x: 1600, y: 700, width: 40, height: 40, radius: 90, label: 'Mushroom ring',
              flavor: 'A ring of mushrooms. The fair folk trade in finished tasks. Leave nothing half-done here.' },
            { id: 'fx_shrine', x: 220, y: 280, width: 40, height: 40, radius: 95, label: 'Ancient shrine',
              flavor: 'A shrine older than the Council. The name on it has been scratched out. Twice.' },
            { id: 'fx_river', x: 880, y: 470, width: 40, height: 40, radius: 85, label: 'Old bridge',
              flavor: 'The river hums an old work song. It has never once missed its deadline to the sea.' }
        ],
        portals: [
            // Back to town
            {
                x: 1800, y: 350, width: 80, height: 300,
                targetMap: 'townSquare',
                targetX: 200, targetY: 850,
                label: 'To Town'
            },
            // Portal to Dungeon
            {
                x: 100, y: 400, width: 80, height: 120,
                targetMap: 'shadowCrypts',
                targetX: 1000, targetY: 1300,
                label: 'Shadow Crypts'
            }
        ],
        // Composite scenes — densify the 2000×1000 forest with coherent clusters
        prefabs: [
            // West side (between portal-to-crypts and the river) — 4 groves + 1 clearing
            { name: 'forest_grove',    x: 220,  y: 180, seed: 11 },
            { name: 'forest_grove',    x: 220,  y: 780, seed: 23 },
            { name: 'forest_grove',    x: 520,  y: 200, seed: 37 },
            { name: 'forest_grove',    x: 520,  y: 760, seed: 41 },
            { name: 'forest_clearing', x: 380,  y: 480, seed: 7 },

            // East side (between river bridge and town portal) — 4 groves + 1 clearing
            { name: 'forest_grove',    x: 1180, y: 200, seed: 53 },
            { name: 'forest_grove',    x: 1180, y: 780, seed: 59 },
            { name: 'forest_grove',    x: 1500, y: 180, seed: 67 },
            { name: 'forest_grove',    x: 1500, y: 800, seed: 73 },
            { name: 'forest_clearing', x: 1350, y: 480, seed: 83 },

            // Garden patches — filler clusters of flowers/bushes in the gaps
            { name: 'garden_patch',    x: 360,  y: 320, seed: 5 },
            { name: 'garden_patch',    x: 360,  y: 640, seed: 9 },
            { name: 'garden_patch',    x: 1350, y: 320, seed: 14 },
            { name: 'garden_patch',    x: 1350, y: 640, seed: 18 },
        ],
        decorations: [
            // River visual
            { x: 800, y: 0, type: 'rect', width: 200, height: 1000, color: '#3b82f6', opacity: 0.6, z: 0 },
            // Bridge visual
            { x: 780, y: 400, type: 'rect', width: 240, height: 200, color: '#78350f', z: 0 },
            // Bridge plank texture
            { x: 780, y: 420, type: 'rect', width: 240, height: 4, color: '#5c3a21', opacity: 0.8, z: 1 },
            { x: 780, y: 460, type: 'rect', width: 240, height: 4, color: '#5c3a21', opacity: 0.8, z: 1 },
            { x: 780, y: 500, type: 'rect', width: 240, height: 4, color: '#5c3a21', opacity: 0.8, z: 1 },
            { x: 780, y: 540, type: 'rect', width: 240, height: 4, color: '#5c3a21', opacity: 0.8, z: 1 },
            { x: 780, y: 580, type: 'rect', width: 240, height: 4, color: '#5c3a21', opacity: 0.8, z: 1 },
            // Path patches near portals
            { type: 'cobble_patch', x: 150, y: 460, width: 120, height: 80, color: '#8a7a5c', opacity: 0.35, z: 0 },
            { type: 'cobble_patch', x: 1830, y: 480, width: 120, height: 80, color: '#8a7a5c', opacity: 0.35, z: 0 },

            // ─── Stone trail — town portal ↔ bridge ↔ crypts portal ────────
            // Small worn patches trace the well-trod route so the map reads as
            // a "path with two edges" instead of an aimless grove field.
            { type: 'cobble_patch', x: 1650, y: 490, width: 120, height: 70, color: '#8a7a5c', opacity: 0.30, z: 0 },
            { type: 'cobble_patch', x: 1450, y: 500, width: 120, height: 70, color: '#8a7a5c', opacity: 0.30, z: 0 },
            { type: 'cobble_patch', x: 1240, y: 490, width: 120, height: 70, color: '#8a7a5c', opacity: 0.30, z: 0 },
            { type: 'cobble_patch', x: 1080, y: 500, width: 90,  height: 70, color: '#8a7a5c', opacity: 0.30, z: 0 },
            { type: 'cobble_patch', x: 700,  y: 500, width: 90,  height: 70, color: '#8a7a5c', opacity: 0.30, z: 0 },
            { type: 'cobble_patch', x: 540,  y: 495, width: 120, height: 70, color: '#8a7a5c', opacity: 0.30, z: 0 },
            { type: 'cobble_patch', x: 340,  y: 490, width: 120, height: 70, color: '#8a7a5c', opacity: 0.30, z: 0 },

            // ─── River banks — reeds + lily pads ───────────────────────────
            // Grass tufts on both shores break the flat blue rectangle, and
            // a few dark-green ellipses read as floating lily pads on the water.
            { type: 'sprite', name: 'grass_tuft', x: 770, y: 140, scale: 1.6, z: 140 },
            { type: 'sprite', name: 'grass_tuft', x: 770, y: 260, scale: 1.5, z: 260 },
            { type: 'sprite', name: 'grass_tuft', x: 770, y: 670, scale: 1.6, z: 670 },
            { type: 'sprite', name: 'grass_tuft', x: 770, y: 790, scale: 1.5, z: 790 },
            { type: 'sprite', name: 'grass_tuft', x: 770, y: 890, scale: 1.4, z: 890 },
            { type: 'sprite', name: 'grass_tuft', x: 1030, y: 150, scale: 1.5, z: 150 },
            { type: 'sprite', name: 'grass_tuft', x: 1030, y: 270, scale: 1.6, z: 270 },
            { type: 'sprite', name: 'grass_tuft', x: 1030, y: 680, scale: 1.5, z: 680 },
            { type: 'sprite', name: 'grass_tuft', x: 1030, y: 800, scale: 1.4, z: 800 },
            { type: 'sprite', name: 'grass_tuft', x: 1030, y: 895, scale: 1.5, z: 895 },
            // Lily pads — small dark-green ovals floating on the river surface
            { type: 'rect', x: 856, y: 200, width: 28, height: 14, color: '#16a34a', opacity: 0.75, radius: '50%', z: 1 },
            { type: 'rect', x: 934, y: 320, width: 26, height: 14, color: '#16a34a', opacity: 0.75, radius: '50%', z: 1 },
            { type: 'rect', x: 880, y: 700, width: 28, height: 14, color: '#16a34a', opacity: 0.75, radius: '50%', z: 1 },
            { type: 'rect', x: 928, y: 830, width: 26, height: 14, color: '#16a34a', opacity: 0.75, radius: '50%', z: 1 },

            // ─── Forest glow — filtered light through the canopy ───────────
            // Soft yellow-green halos scattered on the ground. Sells the
            // "magic forest" bioma without needing a canopy sprite pass.
            { type: 'lantern_glow', x: 380,  y: 200, radius: 110, color: 'rgba(180,255,140,0.14)', z: 1 },
            { type: 'lantern_glow', x: 580,  y: 660, radius: 100, color: 'rgba(180,255,140,0.14)', z: 1 },
            { type: 'lantern_glow', x: 1230, y: 200, radius: 110, color: 'rgba(180,255,140,0.14)', z: 1 },
            { type: 'lantern_glow', x: 1520, y: 860, radius: 100, color: 'rgba(180,255,140,0.14)', z: 1 },
            { type: 'lantern_glow', x: 350,  y: 500, radius: 90,  color: 'rgba(180,255,140,0.14)', z: 1 },
            { type: 'lantern_glow', x: 1650, y: 400, radius: 100, color: 'rgba(180,255,140,0.14)', z: 1 },

            // ─── The Elderwood (east clearing landmark) ────────────────────
            // Massive rune-carved oak. The forest's reason to be remembered.
            { type: 'sprite', name: 'ancient_tree', x: 1350, y: 470, scale: 2, z: 470 },

            // ─── Fairy mushroom circle (east narrative point) ──────────────
            // 8 mushrooms in a ring around a soft green glow — the "wondrous"
            // side of the forest, closer to town. Places a spot the player
            // will remember without needing a quest hook attached.
            { type: 'lantern_glow', x: 1620, y: 720, radius: 55, color: 'rgba(120,255,120,0.28)', z: 1 },
            { type: 'sprite', name: 'mushroom', x: 1620, y: 660, scale: 1.4, z: 660 },
            { type: 'sprite', name: 'mushroom', x: 1665, y: 675, scale: 1.4, z: 675 },
            { type: 'sprite', name: 'mushroom', x: 1680, y: 720, scale: 1.4, z: 720 },
            { type: 'sprite', name: 'mushroom', x: 1665, y: 765, scale: 1.4, z: 765 },
            { type: 'sprite', name: 'mushroom', x: 1620, y: 780, scale: 1.4, z: 780 },
            { type: 'sprite', name: 'mushroom', x: 1575, y: 765, scale: 1.4, z: 765 },
            { type: 'sprite', name: 'mushroom', x: 1560, y: 720, scale: 1.4, z: 720 },
            { type: 'sprite', name: 'mushroom', x: 1575, y: 675, scale: 1.4, z: 675 },
            // Small flower ring right next to the circle to soften the edge
            { type: 'flowers', x: 1620, y: 620, size: 32 },
            { type: 'flowers', x: 1620, y: 820, size: 32 },

            // ─── Ancient shrine (west narrative point) ─────────────────────
            // Weathered statue flanked by two pillars — foreshadows the Shadow
            // Crypts on the other side of the west portal. Cracks and a dim
            // violet glow mark it as "old and haunted", not "friendly rest".
            { type: 'lantern_glow', x: 240, y: 300, radius: 90, color: 'rgba(120,80,180,0.22)', z: 1 },
            { type: 'statue', x: 240, y: 300, size: 60 },
            { type: 'pillar', x: 165, y: 355, width: 40, height: 90 },
            { type: 'pillar', x: 315, y: 355, width: 40, height: 90 },
            { type: 'crack', x: 240, y: 380, length: 90, angle: 0, z: 0 },
            { type: 'crack', x: 195, y: 420, length: 60, angle: -18, z: 0 },
            { type: 'crack', x: 285, y: 420, length: 60, angle: 18, z: 0 },
            // Scattered skulls near the shrine — ominous
            { type: 'sprite', name: 'skull', x: 175, y: 460, scale: 1.6, z: 460 },
            { type: 'sprite', name: 'skull', x: 310, y: 470, scale: 1.4, z: 470 },

            // ─── Wandering critters ────────────────────────────────────────
            // Wild slimes prowl the west (closer to the crypts); rabbits play
            // in the east (closer to the friendly town). One lonely blue
            // slime hangs by the river as a stress-test for the crossing.
            { type: 'critter', variant: 'slime', color: '#22c55e', x: 320, y: 250 },
            { type: 'critter', variant: 'slime', color: '#22c55e', x: 460, y: 720 },
            { type: 'critter', variant: 'slime', color: '#166534', x: 600, y: 300 },
            { type: 'critter', variant: 'slime', color: '#3b82f6', x: 760, y: 440 },
            { type: 'critter', variant: 'cat',   color: '#e2e8f0', x: 1300, y: 300 },
            { type: 'critter', variant: 'cat',   color: '#f5deb3', x: 1440, y: 720 },
            { type: 'critter', variant: 'cat',   color: '#e2e8f0', x: 1720, y: 500 },

            // ─── Density fill — scattered undergrowth between prefabs ──────
            // Loose mushrooms, flowers and bushes fill the empty strips
            // between the seeded grove clusters so the eye never lands on a
            // patch of pure grass tile.
            { type: 'sprite', name: 'mushroom', x: 280, y: 400, scale: 1.2, z: 400 },
            { type: 'sprite', name: 'mushroom', x: 620, y: 380, scale: 1.3, z: 380 },
            { type: 'sprite', name: 'mushroom', x: 1130, y: 380, scale: 1.2, z: 380 },
            { type: 'sprite', name: 'mushroom', x: 1420, y: 360, scale: 1.3, z: 360 },
            { type: 'sprite', name: 'mushroom', x: 700, y: 720, scale: 1.2, z: 720 },
            { type: 'sprite', name: 'mushroom', x: 1100, y: 700, scale: 1.4, z: 700 },
            { type: 'sprite', name: 'grass_tuft', x: 420, y: 380, scale: 1.4, z: 380 },
            { type: 'sprite', name: 'grass_tuft', x: 660, y: 640, scale: 1.5, z: 640 },
            { type: 'sprite', name: 'grass_tuft', x: 1160, y: 640, scale: 1.4, z: 640 },
            { type: 'sprite', name: 'grass_tuft', x: 1400, y: 340, scale: 1.5, z: 340 },
            { type: 'flowers', x: 470, y: 330, size: 30 },
            { type: 'flowers', x: 650, y: 620, size: 32 },
            { type: 'flowers', x: 1150, y: 340, size: 30 },
            { type: 'flowers', x: 1430, y: 620, size: 32 },
            { type: 'bush', x: 260, y: 660, size: 46 },
            { type: 'bush', x: 640, y: 260, size: 44 },
            { type: 'bush', x: 1240, y: 640, size: 46 },
            { type: 'bush', x: 1500, y: 260, size: 44 },
        ]
    },
    shadowCrypts: {
        id: 'shadowCrypts',
        name: 'The Shadow Crypts',
        width: 1200,
        height: 1500,
        baseColor: '#0a0a14',
        tileSprite: 'dungeon_floor_tile',
        tileSize: 64,
        spawn: { x: 600, y: 1400 },
        obstacles: [
            { x: 0, y: 0, width: 1200, height: 100 },
            { x: 0, y: 1400, width: 1200, height: 100 },
            { x: 0, y: 0, width: 100, height: 1500 },
            { x: 1100, y: 0, width: 100, height: 1500 },
            // Pillars
            { x: 300, y: 300, width: 80, height: 80 },
            { x: 800, y: 300, width: 80, height: 80 },
            { x: 300, y: 700, width: 80, height: 80 },
            { x: 800, y: 700, width: 80, height: 80 },
            { x: 300, y: 1100, width: 80, height: 80 },
            { x: 800, y: 1100, width: 80, height: 80 }
        ],
        portals: [
            {
                x: 550, y: 1400, width: 100, height: 60,
                targetMap: 'mysticForest',
                targetX: 250, targetY: 450,
                label: 'Exit to Forest'
            }
        ],
        // Environmental storytelling — the mausoleum of everything left undone
        interactables: [
            { id: 'fx_altar', x: 580, y: 460, width: 40, height: 40, radius: 100, label: 'The Broken Vows',
              flavor: '"Here lie the Broken Vows — every task abandoned, every streak lost." The tome is still warm.' },
            { id: 'fx_shelves', x: 580, y: 270, width: 40, height: 40, radius: 95, label: 'Collapsed archive',
              flavor: 'The shelves collapsed under the weight of unfinished lists. Some scrolls still twitch.' },
            { id: 'fx_pool', x: 175, y: 1255, width: 40, height: 40, radius: 85, label: 'Necrotic pool',
              flavor: 'The ooze hums softly. It sounds almost exactly like a reminder notification.' }
        ],
        decorations: [
            // Torches (flickering)
            { x: 150, y: 200, type: 'torch', size: 40 },
            { x: 1050, y: 200, type: 'torch', size: 40 },
            { x: 150, y: 600, type: 'torch', size: 40 },
            { x: 1050, y: 600, type: 'torch', size: 40 },
            { x: 150, y: 1000, type: 'torch', size: 40 },
            { x: 1050, y: 1000, type: 'torch', size: 40 },
            
            // Pillars visual
            { x: 300, y: 300, type: 'pillar', width: 80, height: 120 },
            { x: 800, y: 300, type: 'pillar', width: 80, height: 120 },
            { x: 300, y: 700, type: 'pillar', width: 80, height: 120 },
            { x: 800, y: 700, type: 'pillar', width: 80, height: 120 },
            { x: 300, y: 1100, type: 'pillar', width: 80, height: 120 },
            { x: 800, y: 1100, type: 'pillar', width: 80, height: 120 },

            // Skeletons
            { type: 'sprite', name: 'skull', x: 200, y: 400, scale: 2.0, z: 400 },
            { type: 'sprite', name: 'skull', x: 900, y: 900, scale: 2.0, z: 900 },

            // ─── Central aisle runner + spawn approach ─────────────────────
            // Dark red rug from the altar down to the spawn portal.
            // Reads as a ceremonial descent — the hero enters the crypt on a
            // path that leads straight to what the Archive Council mourns.
            { type: 'rect', x: 540, y: 520, width: 120, height: 880, color: '#450a0a', opacity: 0.55, z: 0 },
            { type: 'rect', x: 450, y: 260, width: 300, height: 100, color: '#450a0a', opacity: 0.45, z: 0 },
            // Aisle worn stone patches
            { type: 'cobble_patch', x: 600, y: 400, width: 100, height: 80, color: '#0f0f18', opacity: 0.45, z: 0 },
            { type: 'cobble_patch', x: 600, y: 800, width: 100, height: 80, color: '#0f0f18', opacity: 0.45, z: 0 },
            { type: 'cobble_patch', x: 600, y: 1200, width: 100, height: 80, color: '#0f0f18', opacity: 0.45, z: 0 },

            // ─── The Archive of Broken Vows (central altar) ────────────────
            // Sarcophagus-altar with the "cursed tome" (skull as stand-in
            // sprite) glowing red. Every unresolved Archive rift ends here.
            // This is the crypt's WHY: it's not a monster den — it's a mausoleum
            // for the app's promises the world couldn't keep.
            { type: 'rect', x: 540, y: 440, width: 120, height: 80, color: '#1a1a24', z: 0 },
            { type: 'rect', x: 540, y: 440, width: 120, height: 4, color: '#3a3a4a', z: 1 },
            { type: 'rect', x: 540, y: 516, width: 120, height: 4, color: '#050508', z: 1 },
            { type: 'lantern_glow', x: 600, y: 480, radius: 110, color: 'rgba(220,60,60,0.35)', z: 1 },
            { type: 'sprite', name: 'skull', x: 600, y: 470, scale: 1.6, z: 470 },

            // Ring of fractures around the altar — the ground can't hold what's inside
            { type: 'crack', x: 460, y: 470, length: 80, angle: 30, z: 0 },
            { type: 'crack', x: 740, y: 470, length: 80, angle: -30, z: 0 },
            { type: 'crack', x: 600, y: 380, length: 100, angle: 0, z: 0 },
            { type: 'crack', x: 600, y: 560, length: 100, angle: 0, z: 0 },

            // ─── Collapsed bookshelves behind the altar ────────────────────
            // Three broken shelves in a semicircle. The scrolls scattered on
            // the floor are the physical form of every Archive rift Ledgar
            // couldn't seal in time.
            { type: 'sprite', name: 'bookshelf', x: 450, y: 300, scale: 1.4, z: 300 },
            { type: 'sprite', name: 'bookshelf', x: 600, y: 260, scale: 1.4, z: 260 },
            { type: 'sprite', name: 'bookshelf', x: 750, y: 300, scale: 1.4, z: 300 },
            { type: 'rect', x: 420, y: 340, width: 22, height: 8, color: '#c9a86a', opacity: 0.7, radius: '3px', z: 1 },
            { type: 'rect', x: 500, y: 380, width: 20, height: 6, color: '#c9a86a', opacity: 0.7, radius: '3px', z: 1 },
            { type: 'rect', x: 680, y: 360, width: 24, height: 7, color: '#c9a86a', opacity: 0.7, radius: '3px', z: 1 },
            { type: 'rect', x: 760, y: 340, width: 22, height: 8, color: '#c9a86a', opacity: 0.7, radius: '3px', z: 1 },
            { type: 'rect', x: 540, y: 400, width: 18, height: 6, color: '#c9a86a', opacity: 0.7, radius: '3px', z: 1 },

            // ─── Wall torches on the pillars + warm halos ──────────────────
            // Bolts the existing torch decorations onto the pillar tops with
            // a per-pillar halo so the crypt has a rhythmic light cadence
            // instead of pure black voids between the pillars.
            { type: 'sprite', name: 'wall_torch', x: 300, y: 260, scale: 1.4, z: 260 },
            { type: 'sprite', name: 'wall_torch', x: 800, y: 260, scale: 1.4, z: 260 },
            { type: 'sprite', name: 'wall_torch', x: 300, y: 660, scale: 1.4, z: 660 },
            { type: 'sprite', name: 'wall_torch', x: 800, y: 660, scale: 1.4, z: 660 },
            { type: 'sprite', name: 'wall_torch', x: 300, y: 1060, scale: 1.4, z: 1060 },
            { type: 'sprite', name: 'wall_torch', x: 800, y: 1060, scale: 1.4, z: 1060 },
            { type: 'lantern_glow', x: 300, y: 260, radius: 130, color: 'rgba(255,140,60,0.28)', z: 1 },
            { type: 'lantern_glow', x: 800, y: 260, radius: 130, color: 'rgba(255,140,60,0.28)', z: 1 },
            { type: 'lantern_glow', x: 300, y: 660, radius: 130, color: 'rgba(255,140,60,0.28)', z: 1 },
            { type: 'lantern_glow', x: 800, y: 660, radius: 130, color: 'rgba(255,140,60,0.28)', z: 1 },
            { type: 'lantern_glow', x: 300, y: 1060, radius: 130, color: 'rgba(255,140,60,0.28)', z: 1 },
            { type: 'lantern_glow', x: 800, y: 1060, radius: 130, color: 'rgba(255,140,60,0.28)', z: 1 },

            // ─── Necrotic pools in the lower corners ───────────────────────
            // Sickly green ooze puddles + green halos + skulls scattered
            // around them. Signals "sealed evil bleeds out here".
            { type: 'rect', x: 150, y: 1250, width: 90, height: 50, color: '#22c55e', opacity: 0.18, radius: '50%', z: 0 },
            { type: 'lantern_glow', x: 195, y: 1275, radius: 70, color: 'rgba(80,255,120,0.16)', z: 1 },
            { type: 'rect', x: 960, y: 1250, width: 90, height: 50, color: '#22c55e', opacity: 0.18, radius: '50%', z: 0 },
            { type: 'lantern_glow', x: 1005, y: 1275, radius: 70, color: 'rgba(80,255,120,0.16)', z: 1 },
            { type: 'sprite', name: 'skull', x: 180, y: 1200, scale: 1.3, z: 1200 },
            { type: 'sprite', name: 'skull', x: 220, y: 1240, scale: 1.4, z: 1240 },
            { type: 'sprite', name: 'skull', x: 980, y: 1200, scale: 1.3, z: 1200 },
            { type: 'sprite', name: 'skull', x: 1020, y: 1240, scale: 1.4, z: 1240 },

            // ─── Wandering shadow oozes ────────────────────────────────────
            // Dark purple slimes patrolling. Reuses the critter type with a
            // cursed palette so no new sprite is needed.
            { type: 'critter', variant: 'slime', color: '#4c1d95', x: 400, y: 900 },
            { type: 'critter', variant: 'slime', color: '#4c1d95', x: 800, y: 900 },
            { type: 'critter', variant: 'slime', color: '#1e1b4b', x: 500, y: 1200 },

            // ─── Ground grime — cracks, puddles, wear ──────────────────────
            { type: 'crack', x: 400, y: 500, length: 60, angle: 15, z: 0 },
            { type: 'crack', x: 800, y: 500, length: 60, angle: -15, z: 0 },
            { type: 'crack', x: 350, y: 900, length: 70, angle: 45, z: 0 },
            { type: 'crack', x: 850, y: 900, length: 70, angle: -45, z: 0 },
            { type: 'crack', x: 500, y: 1000, length: 80, angle: 0, z: 0 },
            { type: 'crack', x: 700, y: 1000, length: 80, angle: 0, z: 0 },
            { type: 'crack', x: 200, y: 500, length: 60, angle: 30, z: 0 },
            { type: 'crack', x: 1000, y: 500, length: 60, angle: -30, z: 0 },
            { type: 'crack', x: 500, y: 1350, length: 100, angle: 5, z: 0 },
            { type: 'crack', x: 700, y: 1350, length: 100, angle: -5, z: 0 },
            { type: 'puddle', x: 400, y: 200, size: 60, z: 0 },
            { type: 'puddle', x: 900, y: 300, size: 55, z: 0 },
            { type: 'puddle', x: 500, y: 700, size: 65, z: 0 },
            { type: 'puddle', x: 700, y: 1300, size: 60, z: 0 },

            // ─── Broken barrels & crates in shadowed side aisles ───────────
            { type: 'barrel', x: 180, y: 500, size: 40 },
            { type: 'crate', x: 220, y: 550, size: 40 },
            { type: 'barrel', x: 980, y: 500, size: 40 },
            { type: 'crate', x: 1020, y: 550, size: 40 },
            { type: 'barrel', x: 180, y: 900, size: 40 },
            { type: 'crate', x: 1020, y: 900, size: 40 },

            // ─── Scattered bone piles ──────────────────────────────────────
            { type: 'sprite', name: 'skull', x: 240, y: 700, scale: 1.5, z: 700 },
            { type: 'sprite', name: 'skull', x: 960, y: 700, scale: 1.5, z: 700 },
            { type: 'sprite', name: 'skull', x: 260, y: 300, scale: 1.4, z: 300 },
            { type: 'sprite', name: 'skull', x: 940, y: 300, scale: 1.4, z: 300 }
        ]
    }
};
