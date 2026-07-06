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
        spawn: { x: 800, y: 500 },
        // Simple rectangular obstacles { x, y, width, height }
        obstacles: [
            // Center well (approx at x:800, y:400, width:96, height:96)
            { x: 752, y: 352, width: 96, height: 96, type: 'well' },
            // Bulletin board (approx at right:100, top:64 -> x:1420, y:64, w:80, h:96)
            { x: 1420, y: 64, width: 80, height: 96, type: 'board' },
            // Item shop building (solid)
            { x: 170, y: 230, width: 280, height: 150, type: 'shop' },
            // North wall
            { x: 0, y: 0, width: 1600, height: 40 },
            // South wall
            { x: 0, y: 960, width: 1600, height: 40 },
            // West wall
            { x: 0, y: 0, width: 40, height: 1000 },
            // East wall
            { x: 1560, y: 0, width: 40, height: 1000 },
        ],
        // Proximity interaction zones (open app sections). target maps to a PartyView tab.
        interactables: [
            { x: 230, y: 390, width: 160, height: 120, radius: 120, target: 'shop', label: 'Item Shop' },
            { x: 1180, y: 780, width: 220, height: 130, radius: 130, target: 'sanctuary', label: 'Pet Sanctuary' }
        ],
        portals: [
            // Door to Tavern
            {
                x: 950, y: 40, width: 100, height: 60,
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
        // Composite scenes — buildings + their surroundings as a single unit
        prefabs: [
            { name: 'shop_complete',  x: 170,  y: 230 },
            { name: 'market_corner',  x: 520,  y: 760, accent: '#16a34a' },
            { name: 'market_corner',  x: 1050, y: 220, accent: '#7c3aed' },
            { name: 'sanctuary_pen',  x: 1120, y: 560, width: 360, height: 320 },
            // Coherent forest clusters that frame the plaza instead of loose trees
            { name: 'forest_grove',   x: 200,  y: 140, seed: 11 },
            { name: 'forest_grove',   x: 1450, y: 140, seed: 23 },
            { name: 'forest_grove',   x: 180,  y: 880, seed: 37 },
            { name: 'forest_grove',   x: 1480, y: 880, seed: 47 },
            // Residential blocks — give the town actual urban density
            { name: 'town_houses',    x: 460,  y: 820, count: 1, seed: 3 },
            { name: 'town_houses',    x: 920,  y: 820, count: 1, seed: 7 },
            // Decorative garden patches for empty space — coherent flower+bush+grass clusters
            { name: 'garden_patch',   x: 540,  y: 140, seed: 5 },
            { name: 'garden_patch',   x: 300,  y: 620, seed: 12 },
            { name: 'garden_patch',   x: 1080, y: 500, seed: 18 },
        ],
        decorations: [
            // --- ROADS — visible warm-sand paths carved across the cobblestone ---
            //   Central plaza around the well (round dirt circle)
            { type: 'rect', x: 600, y: 280, width: 400, height: 380, color: '#c8a878', opacity: 0.55, radius: '9999px', z: 0 },
            { type: 'rect', x: 620, y: 300, width: 360, height: 340, color: '#b89868', opacity: 0.45, radius: '9999px', z: 0 },
            //   Horizontal road across the town (east-west, from forest portal to sanctuary)
            { type: 'rect', x: 0, y: 470, width: 1600, height: 90, color: '#c8a878', opacity: 0.55, z: 0 },
            { type: 'rect', x: 0, y: 490, width: 1600, height: 50, color: '#b89868', opacity: 0.5, z: 0 },
            //   Vertical road across the town (north-south, from tavern/keep portals to bottom)
            { type: 'rect', x: 760, y: 0, width: 90, height: 1000, color: '#c8a878', opacity: 0.55, z: 0 },
            { type: 'rect', x: 780, y: 0, width: 50, height: 1000, color: '#b89868', opacity: 0.5, z: 0 },
            //   Side spur to the shop (from horizontal road, branching NW)
            { type: 'rect', x: 320, y: 380, width: 60, height: 180, color: '#c8a878', opacity: 0.5, z: 0 },
            //   Side spur to sanctuary
            { type: 'rect', x: 1100, y: 540, width: 60, height: 80, color: '#c8a878', opacity: 0.5, z: 0 },
            //   Side spur to south market
            { type: 'rect', x: 560, y: 560, width: 60, height: 220, color: '#c8a878', opacity: 0.5, z: 0 },
            //   Side spur to north market
            { type: 'rect', x: 1080, y: 320, width: 60, height: 180, color: '#c8a878', opacity: 0.5, z: 0 },

            // --- Worn patches & cracks on the roads ---
            { type: 'cobble_patch', x: 800, y: 500, width: 220, height: 140, color: '#8a6a40', opacity: 0.45, z: 0 },
            { type: 'crack', x: 700, y: 520, length: 80, angle: 15, z: 0 },
            { type: 'crack', x: 880, y: 580, length: 60, angle: -25, z: 0 },
            { type: 'puddle', x: 720, y: 660, size: 70, z: 0 },

            // --- Central well (anchored plaza centerpiece, flanked by benches) ---
            { type: 'well', x: 752, y: 352, width: 96, height: 96 },
            { type: 'bench', x: 624, y: 520, size: 60 },
            { type: 'bench', x: 920, y: 520, size: 60 },
            { type: 'flowers', x: 760, y: 470, size: 30 },

            // --- Lamps lighting the plaza corners (kept manual, paired with their glow) ---
            { type: 'lantern_glow', x: 600,  y: 320, radius: 130, color: 'rgba(253,224,71,0.32)', z: 1 },
            { type: 'lamp',         x: 600,  y: 300, size: 64 },
            { type: 'lantern_glow', x: 1000, y: 320, radius: 130, color: 'rgba(253,224,71,0.32)', z: 1 },
            { type: 'lamp',         x: 1000, y: 300, size: 64 },
            { type: 'lantern_glow', x: 600,  y: 780, radius: 130, color: 'rgba(253,224,71,0.32)', z: 1 },
            { type: 'lamp',         x: 600,  y: 760, size: 64 },
            { type: 'lantern_glow', x: 1000, y: 780, radius: 130, color: 'rgba(253,224,71,0.32)', z: 1 },
            { type: 'lamp',         x: 1000, y: 760, size: 64 },
            { type: 'lantern_glow', x: 800,  y: 400, radius: 120, color: 'rgba(255,200,120,0.22)', z: 1 },

            // --- Banners on the north wall ---
            { type: 'banner', x: 320,  y: 40, color: '#7c3aed', icon: '⚔' },
            { type: 'banner', x: 800,  y: 40, color: '#fbbf24', icon: '✦' },
            { type: 'banner', x: 1120, y: 40, color: '#dc2626', icon: '★' },
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
        decorations: [
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
        portals: [
            // Door to outside
            { 
                x: 350, y: 700, width: 100, height: 60, 
                targetMap: 'townSquare', 
                targetX: 950, targetY: 150,
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
            { x: 300, y: 550, type: 'rect', width: 200, height: 140, color: '#7f1d1d', opacity: 0.8, radius: '10px' }
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
            { x: 800, y: 600, width: 200, height: 300 }
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
            { x: 800, y: 0, type: 'rect', width: 200, height: 1000, color: '#3b82f6', opacity: 0.6 },
            // Bridge visual
            { x: 780, y: 400, type: 'rect', width: 240, height: 200, color: '#78350f' },
            // Bridge plank texture
            { x: 780, y: 420, type: 'rect', width: 240, height: 4, color: '#5c3a21', opacity: 0.8, z: 1 },
            { x: 780, y: 460, type: 'rect', width: 240, height: 4, color: '#5c3a21', opacity: 0.8, z: 1 },
            { x: 780, y: 500, type: 'rect', width: 240, height: 4, color: '#5c3a21', opacity: 0.8, z: 1 },
            { x: 780, y: 540, type: 'rect', width: 240, height: 4, color: '#5c3a21', opacity: 0.8, z: 1 },
            { x: 780, y: 580, type: 'rect', width: 240, height: 4, color: '#5c3a21', opacity: 0.8, z: 1 },
            // Path patches near portals
            { type: 'cobble_patch', x: 150, y: 460, width: 120, height: 80, color: '#8a7a5c', opacity: 0.35, z: 0 },
            { type: 'cobble_patch', x: 1830, y: 480, width: 120, height: 80, color: '#8a7a5c', opacity: 0.35, z: 0 },
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
            { type: 'sprite', name: 'skull', x: 900, y: 900, scale: 2.0, z: 900 }
        ]
    }
};
