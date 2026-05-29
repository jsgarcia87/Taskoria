export const MAP_DATA = {
    townSquare: {
        id: 'townSquare',
        name: 'Town Square',
        width: 1600,
        height: 1000,
        className: 'medieval-town-bg',
        baseColor: '#2b1f1a',
        background: {}, // Relies on CSS class
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
            { x: 230, y: 390, width: 160, height: 120, radius: 120, target: 'shop', label: 'Tienda de Objetos' },
            { x: 1180, y: 780, width: 220, height: 130, radius: 130, target: 'sanctuary', label: 'Santuario de Mascotas' }
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
        decorations: [
            // --- Ground & paths (kept under everything via explicit z) ---
            { type: 'rect', x: 560, y: 200, width: 480, height: 480, color: '#8a7a5c', opacity: 0.18, radius: '9999px', z: 0 },
            { type: 'rect', x: 0, y: 470, width: 1600, height: 90, color: '#7a6a52', opacity: 0.15, z: 0 },
            { type: 'rect', x: 760, y: 0, width: 90, height: 1000, color: '#7a6a52', opacity: 0.15, z: 0 },

            // --- Central well (now visible) ---
            { type: 'well', x: 752, y: 352, width: 96, height: 96 },
            { type: 'bench', x: 624, y: 520, size: 60 },
            { type: 'bench', x: 920, y: 520, size: 60 },

            // --- Item Shop (building + keeper + sign + props) ---
            { type: 'shop_building', x: 170, y: 230, width: 280, height: 150 },
            { type: 'vendor_npc', x: 310, y: 420, label: 'Tendero', avatar: 'mage', colors: { primary: '#b91c1c', primaryDark: '#7f1d1d', skin: '#e8b08a' } },
            { type: 'sign', x: 470, y: 360, label: 'TIENDA' },
            { type: 'barrel', x: 150, y: 400, size: 38 },
            { type: 'crate', x: 440, y: 400, size: 42 },

            // --- Extra market stalls (ambiance) ---
            { type: 'market_stall', x: 520, y: 760, width: 130, height: 96, color: '#16a34a' },
            { type: 'market_stall', x: 1050, y: 220, width: 130, height: 96, color: '#7c3aed' },

            // --- Pet Sanctuary zone (right side) ---
            { type: 'rect', x: 1120, y: 560, width: 360, height: 320, color: '#15803d', opacity: 0.35, radius: '20px', z: 1 },
            { type: 'fence', x: 1120, y: 556, width: 360, height: 16 },
            { type: 'fence', x: 1116, y: 560, width: 16, height: 320 },
            { type: 'fence', x: 1468, y: 560, width: 16, height: 320 },
            { type: 'fence', x: 1120, y: 872, width: 120, height: 16 },
            { type: 'fence', x: 1360, y: 872, width: 120, height: 16 },
            { type: 'sign', x: 1100, y: 520, label: 'MASCOTAS' },
            { type: 'vendor_npc', x: 1300, y: 610, label: 'Cuidadora', avatar: 'archer', colors: { primary: '#047857', primaryDark: '#065f46', skin: '#d49060' } },
            { type: 'critter', x: 1200, y: 700, variant: 'slime', color: '#22c55e' },
            { type: 'critter', x: 1390, y: 680, variant: 'cat', color: '#f59e0b' },
            { type: 'critter', x: 1270, y: 790, variant: 'dog', color: '#a16207' },
            { type: 'critter', x: 1420, y: 810, variant: 'slime', color: '#3b82f6' },

            // --- Lamps ---
            { type: 'lamp', x: 600, y: 300, size: 64 },
            { type: 'lamp', x: 1000, y: 300, size: 64 },
            { type: 'lamp', x: 600, y: 760, size: 64 },
            { type: 'lamp', x: 1000, y: 760, size: 64 },

            // --- Greenery ---
            { type: 'flowers', x: 520, y: 560, size: 40 },
            { type: 'flowers', x: 1080, y: 500, size: 40 },
            { type: 'flowers', x: 300, y: 620, size: 40 },
            { type: 'flowers', x: 900, y: 820, size: 40 },
            { type: 'bush', x: 480, y: 160, size: 52 },
            { type: 'bush', x: 1120, y: 150, size: 52 },
            { type: 'bush', x: 260, y: 840, size: 52 },
            { type: 'bush', x: 980, y: 900, size: 52 },

            // --- Banners on the north wall ---
            { type: 'banner', x: 320, y: 40, color: '#7c3aed', icon: '⚔' },
            { type: 'banner', x: 1120, y: 40, color: '#dc2626', icon: '★' }
        ]
    },
    taskoriaKeep: {
        id: 'taskoriaKeep',
        name: 'Taskoria Keep',
        width: 1000,
        height: 1000,
        baseColor: '#1e1b4b',
        background: {
            backgroundColor: '#1e1b4b',
            backgroundImage: 'linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)',
            backgroundSize: '50px 50px'
        },
        spawn: { x: 500, y: 850 },
        obstacles: [
            { x: 0, y: 0, width: 1000, height: 100 }, // Top
            { x: 0, y: 900, width: 1000, height: 100 }, // Bottom
            { x: 0, y: 0, width: 100, height: 1000 }, // Left
            { x: 900, y: 0, width: 100, height: 1000 }, // Right
            // Throne platform
            { x: 350, y: 150, width: 300, height: 150 }
        ],
        portals: [
            {
                x: 450, y: 900, width: 100, height: 60,
                targetMap: 'townSquare',
                targetX: 1350, targetY: 150,
                label: 'Exit to Town'
            }
        ],
        decorations: [
            // Royal Carpet
            { x: 400, y: 300, type: 'rect', width: 200, height: 600, color: '#7f1d1d', opacity: 0.8 },
            // Throne
            { x: 450, y: 180, type: 'text', value: '👑', size: 64 },
            { x: 500, y: 140, type: 'text', value: 'THE ROYAL THRONE', size: 12, color: '#fbbf24' },
            // Statues
            { x: 250, y: 400, type: 'statue', size: 80 },
            { x: 750, y: 400, type: 'statue', size: 80 },
            { x: 250, y: 700, type: 'statue', size: 80 },
            { x: 750, y: 700, type: 'statue', size: 80 },
            // Guards (static for now, just text/emoji or custom type)
            { x: 300, y: 250, type: 'text', value: '🛡️', size: 40 },
            { x: 700, y: 250, type: 'text', value: '🛡️', size: 40 }
        ]
    },
    tavernInterior: {
        id: 'tavernInterior',
        name: 'The Rusty Sword Inn',
        width: 800,
        height: 800,
        baseColor: '#1a102e',
        background: {
            // Wood floor
            backgroundImage: 'linear-gradient(45deg, #4a3225 25%, #3d261b 25%, #3d261b 50%, #4a3225 50%, #4a3225 75%, #3d261b 75%, #3d261b)',
            backgroundSize: '40px 40px',
            backgroundColor: '#1a102e'
        },
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
            // Bar visual
            { x: 200, y: 200, type: 'rect', width: 400, height: 80, color: '#271c19', border: '#4a3225' },
            { x: 400, y: 150, type: 'mug', size: 40 },
            { x: 450, y: 150, type: 'mug', size: 40 },
            { x: 500, y: 150, type: 'mug', size: 40 },
            { x: 350, y: 130, type: 'bartender_npc', size: 60 },
            
            // Tables visuals
            { x: 200, y: 400, type: 'rect', width: 120, height: 80, color: '#3d261b', border: '#78350f', radius: '20px' },
            { x: 500, y: 400, type: 'rect', width: 120, height: 80, color: '#3d261b', border: '#78350f', radius: '20px' },
            
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
        baseColor: '#022c22',
        background: {
            backgroundColor: '#022c22',
            backgroundImage: 'radial-gradient(circle, #065f46 2px, transparent 2px)',
            backgroundSize: '30px 30px'
        },
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
        decorations: [
            // River visual
            { x: 800, y: 0, type: 'rect', width: 200, height: 1000, color: '#3b82f6', opacity: 0.6 },
            // Bridge visual
            { x: 780, y: 400, type: 'rect', width: 240, height: 200, color: '#78350f' },
            // Trees
            { x: 200, y: 150, type: 'pine_tree', width: 80, height: 120 },
            { x: 400, y: 100, type: 'pine_tree', width: 100, height: 140 },
            { x: 250, y: 560, type: 'oak_tree', width: 120, height: 150 },
            { x: 550, y: 650, type: 'pine_tree', width: 90, height: 130 },
            { x: 1200, y: 150, type: 'pine_tree', width: 70, height: 110 },
            { x: 1450, y: 550, type: 'oak_tree', width: 140, height: 160 }
        ]
    },
    shadowCrypts: {
        id: 'shadowCrypts',
        name: 'The Shadow Crypts',
        width: 1200,
        height: 1500,
        baseColor: '#0f172a',
        background: {
            backgroundColor: '#0f172a',
            backgroundImage: 'radial-gradient(circle, #1e293b 1px, transparent 1px)',
            backgroundSize: '20px 20px'
        },
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
            { x: 200, y: 400, type: 'text', value: '💀', size: 30, opacity: 0.5 },
            { x: 900, y: 900, type: 'text', value: '💀', size: 30, opacity: 0.5 }
        ]
    }
};
