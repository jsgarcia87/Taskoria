import { useEffect, useRef } from 'react';
import * as THREE from 'three';

// Camera waypoints driven by page scroll — each maps to a narrative chapter.
// { pos: [x,y,z], lookAt: [x,y,z], range: [scrollStart, scrollEnd] }
// Hero = approach & enter the castle. From Ch01 onwards camera lives INSIDE
// the castle hall. Ch03 is a full 360° orbit around the council altar,
// so it takes ~3x the scroll of the others.
const COUNCIL_CENTER = [0, 3, -26];
const COUNCIL_ORBIT_RADIUS = 8;
const COUNCIL_RANGE = [0.33, 0.67];

const WAYPOINTS = [
    // Hero start — camera far, castle framed
    { pos: [0, 7, 48], lookAt: [0, 8, 0], range: [0, 0.04] },
    // Hero end — approach the gate (zoom in effect)
    { pos: [0, 5, 22], lookAt: [0, 6, 0], range: [0.04, 0.11] },
    // Ch01 Quest Log — crossed the threshold, wide view down the main hall
    { pos: [0, 6, -2], lookAt: [0, 4, -22], range: [0.11, 0.22] },
    // Ch02 Archive — pan to the library alcove (left side of hall)
    { pos: [4, 4, -8], lookAt: [-7, 4, -14], range: [0.22, 0.33] },
    // Ch03 Council — [special: orbital] handled separately in getCameraTarget
    { pos: [8, 4.5, -26], lookAt: COUNCIL_CENTER, range: COUNCIL_RANGE },
    // Ch04 Studio — turn to the workshop alcove (right side of hall)
    { pos: [-4, 4, -14], lookAt: [8, 4, -20], range: [0.67, 0.78] },
    // Ch05 The Call — dramatic pullback rising through the roof
    { pos: [0, 28, 12], lookAt: [0, 4, -18], range: [0.78, 1.0] },
];

function lerp(a, b, t) { return a + (b - a) * t; }
function easeInOut(t) { return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2; }

function lerpVec(out, a, b, t) {
    out[0] = lerp(a[0], b[0], t);
    out[1] = lerp(a[1], b[1], t);
    out[2] = lerp(a[2], b[2], t);
}

function getCameraTarget(scroll) {
    // Special case: Council chamber — full 360° orbit around the altar
    if (scroll >= COUNCIL_RANGE[0] && scroll <= COUNCIL_RANGE[1]) {
        const t = (scroll - COUNCIL_RANGE[0]) / (COUNCIL_RANGE[1] - COUNCIL_RANGE[0]);
        // Start at guardian 0 (angle -π/2, facing +Z) and orbit clockwise
        const angle = -Math.PI / 2 + t * Math.PI * 2;
        return {
            pos: [
                COUNCIL_CENTER[0] + Math.cos(angle) * COUNCIL_ORBIT_RADIUS,
                4.5,
                COUNCIL_CENTER[2] + Math.sin(angle) * COUNCIL_ORBIT_RADIUS,
            ],
            look: [COUNCIL_CENTER[0], COUNCIL_CENTER[1], COUNCIL_CENTER[2]],
        };
    }

    const pos = [0, 6, 35];
    const look = [0, 8, 0];
    for (let i = 0; i < WAYPOINTS.length; i++) {
        const wp = WAYPOINTS[i];
        const next = WAYPOINTS[i + 1];
        if (scroll >= wp.range[0] && scroll <= wp.range[1]) {
            pos[0] = wp.pos[0]; pos[1] = wp.pos[1]; pos[2] = wp.pos[2];
            look[0] = wp.lookAt[0]; look[1] = wp.lookAt[1]; look[2] = wp.lookAt[2];
            break;
        }
        if (next && scroll > wp.range[1] && scroll <= next.range[0]) {
            const t = easeInOut((scroll - wp.range[1]) / (next.range[0] - wp.range[1]));
            lerpVec(pos, wp.pos, next.pos, t);
            lerpVec(look, wp.lookAt, next.lookAt, t);
            break;
        }
    }
    if (scroll > WAYPOINTS[WAYPOINTS.length - 1].range[1]) {
        const last = WAYPOINTS[WAYPOINTS.length - 1];
        pos[0] = last.pos[0]; pos[1] = last.pos[1]; pos[2] = last.pos[2];
        look[0] = last.lookAt[0]; look[1] = last.lookAt[1]; look[2] = last.lookAt[2];
    }
    return { pos, look };
}

// ─── Particle system ────────────────────────────────────────────────
function createParticles(scene, count, opts) {
    const geo = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);
    const velocities = new Float32Array(count * 3);
    const phases = new Float32Array(count);

    for (let i = 0; i < count; i++) {
        positions[i * 3] = opts.center[0] + (Math.random() - 0.5) * opts.spread[0];
        positions[i * 3 + 1] = opts.center[1] + (Math.random() - 0.5) * opts.spread[1];
        positions[i * 3 + 2] = opts.center[2] + (Math.random() - 0.5) * opts.spread[2];
        velocities[i * 3] = (Math.random() - 0.5) * opts.speed;
        velocities[i * 3 + 1] = Math.random() * opts.speed * (opts.rise ? 1 : 0.3);
        velocities[i * 3 + 2] = (Math.random() - 0.5) * opts.speed;
        phases[i] = Math.random() * Math.PI * 2;
    }

    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const mat = new THREE.PointsMaterial({
        color: opts.color,
        size: opts.size || 0.15,
        transparent: true,
        opacity: opts.opacity || 0.8,
        depthWrite: false,
        sizeAttenuation: true,
        blending: THREE.AdditiveBlending,
    });

    const points = new THREE.Points(geo, mat);
    scene.add(points);

    return { points, geo, velocities, phases, opts, positions };
}

function updateParticles(system, elapsed) {
    const pos = system.geo.attributes.position.array;
    const v = system.velocities;
    const p = system.phases;
    const o = system.opts;
    const count = pos.length / 3;

    for (let i = 0; i < count; i++) {
        const i3 = i * 3;
        pos[i3] += v[i3] * 0.016 + Math.sin(elapsed * 0.5 + p[i]) * 0.003;
        pos[i3 + 1] += v[i3 + 1] * 0.016;
        pos[i3 + 2] += v[i3 + 2] * 0.016 + Math.cos(elapsed * 0.3 + p[i]) * 0.003;

        // Reset particles that drift too far
        const dx = pos[i3] - o.center[0];
        const dy = pos[i3 + 1] - o.center[1];
        const dz = pos[i3 + 2] - o.center[2];
        if (Math.abs(dx) > o.spread[0] * 0.6 ||
            Math.abs(dy) > o.spread[1] * 0.6 ||
            Math.abs(dz) > o.spread[2] * 0.6) {
            pos[i3] = o.center[0] + (Math.random() - 0.5) * o.spread[0] * 0.3;
            pos[i3 + 1] = o.center[1] - o.spread[1] * 0.3;
            pos[i3 + 2] = o.center[2] + (Math.random() - 0.5) * o.spread[2] * 0.3;
        }
    }
    system.geo.attributes.position.needsUpdate = true;
}

// ─── World builders ─────────────────────────────────────────────────

function buildCastle(scene) {
    const castleGroup = new THREE.Group();

    const stoneMat = new THREE.MeshStandardMaterial({ color: 0x6a6a7c, roughness: 0.95, metalness: 0.05 });
    const stoneDarkMat = new THREE.MeshStandardMaterial({ color: 0x555566, roughness: 0.95, metalness: 0.05 });
    const stoneAccentMat = new THREE.MeshStandardMaterial({ color: 0x8a8a9c, roughness: 0.85, metalness: 0.1 });
    const woodMat = new THREE.MeshStandardMaterial({ color: 0x5c3a21, roughness: 1 });
    const darkInteriorMat = new THREE.MeshBasicMaterial({ color: 0x050508 });
    const ironMat = new THREE.MeshStandardMaterial({ color: 0x3a3a4a, roughness: 0.6, metalness: 0.7 });
    const roofMat = new THREE.MeshStandardMaterial({ color: 0x4a3028, roughness: 0.9 });
    const windowGlowMat = new THREE.MeshBasicMaterial({ color: 0xffcc66 });

    // Main wall
    const wall = new THREE.Mesh(new THREE.BoxGeometry(26, 13, 4), stoneMat);
    wall.position.y = 6.5; wall.castShadow = true; wall.receiveShadow = true;
    castleGroup.add(wall);

    // Wall bands
    const wallBand = new THREE.Mesh(new THREE.BoxGeometry(26.2, 0.6, 4.2), stoneAccentMat);
    wallBand.position.y = 9; castleGroup.add(wallBand);
    const wallBand2 = new THREE.Mesh(new THREE.BoxGeometry(26.2, 0.4, 4.2), stoneAccentMat);
    wallBand2.position.y = 3; castleGroup.add(wallBand2);

    // Towers
    const towerGeo = new THREE.BoxGeometry(7, 18, 7);
    [-13, 13].forEach(tx => {
        const tower = new THREE.Mesh(towerGeo, stoneDarkMat);
        tower.position.set(tx, 9, 1); tower.castShadow = true; tower.receiveShadow = true;
        castleGroup.add(tower);

        [6, 12, 16].forEach(by => {
            const band = new THREE.Mesh(new THREE.BoxGeometry(7.3, 0.4, 7.3), stoneAccentMat);
            band.position.set(tx, by, 1); castleGroup.add(band);
        });

        const roof = new THREE.Mesh(new THREE.ConeGeometry(5.5, 5, 4), roofMat);
        roof.position.set(tx, 21, 1); roof.rotation.y = Math.PI / 4; roof.castShadow = true;
        castleGroup.add(roof);

        const finial = new THREE.Mesh(new THREE.SphereGeometry(0.4, 8, 6), ironMat);
        finial.position.set(tx, 23.7, 1); castleGroup.add(finial);

        const crenelGeo = new THREE.BoxGeometry(1.3, 1.8, 1.3);
        for (let cx = -2.5; cx <= 2.5; cx += 2.5) {
            for (let cz = -2.5; cz <= 2.5; cz += 2.5) {
                if (Math.abs(cx) < 2 && Math.abs(cz) < 2) continue;
                const crenel = new THREE.Mesh(crenelGeo, stoneMat);
                crenel.position.set(tx + cx, 18.9, 1 + cz); crenel.castShadow = true;
                castleGroup.add(crenel);
            }
        }

        [8, 14].forEach(wy => {
            const winFrame = new THREE.Mesh(new THREE.BoxGeometry(1.2, 2, 0.3), stoneDarkMat);
            winFrame.position.set(tx, wy, 4.6); castleGroup.add(winFrame);
            const winGlow = new THREE.Mesh(new THREE.BoxGeometry(0.8, 1.6, 0.15), windowGlowMat);
            winGlow.position.set(tx, wy, 4.75); castleGroup.add(winGlow);
            const wLight = new THREE.PointLight(0xffcc66, 8, 6);
            wLight.position.set(tx, wy, 5.5); castleGroup.add(wLight);
        });
    });

    // Wall battlements
    for (let wx = -10; wx <= 10; wx += 2.8) {
        const wc = new THREE.Mesh(new THREE.BoxGeometry(1.3, 1.8, 1.3), stoneMat);
        wc.position.set(wx, 13.9, 0); wc.castShadow = true; castleGroup.add(wc);
    }

    // Gate arch
    const arch = new THREE.Mesh(new THREE.BoxGeometry(9, 2.5, 4.5), stoneAccentMat);
    arch.position.set(0, 11, 0); arch.castShadow = true; castleGroup.add(arch);
    const keystone = new THREE.Mesh(new THREE.BoxGeometry(1.5, 1.2, 0.5), ironMat);
    keystone.position.set(0, 12.3, 2.3); castleGroup.add(keystone);

    [-4.8, 4.8].forEach(px => {
        const pillar = new THREE.Mesh(new THREE.BoxGeometry(1.2, 10, 1.2), stoneAccentMat);
        pillar.position.set(px, 5, 2.3); pillar.castShadow = true; castleGroup.add(pillar);
    });

    // (Interior hall built later — see below, after torch helpers are defined)

    // Doors
    const doorGeo = new THREE.BoxGeometry(4, 10, 0.5);
    const leftDoorPivot = new THREE.Group();
    leftDoorPivot.position.set(-4, 5, 2.2);
    const leftDoorMesh = new THREE.Mesh(doorGeo, woodMat);
    leftDoorMesh.position.x = 2; leftDoorMesh.castShadow = true; leftDoorMesh.receiveShadow = true;
    leftDoorPivot.add(leftDoorMesh);
    [-3, -1, 1, 3].forEach(dy => {
        const band = new THREE.Mesh(new THREE.BoxGeometry(4.1, 0.3, 0.55), ironMat);
        band.position.set(2, dy, 0); leftDoorPivot.add(band);
    });
    castleGroup.add(leftDoorPivot);

    const rightDoorPivot = new THREE.Group();
    rightDoorPivot.position.set(4, 5, 2.2);
    const rightDoorMesh = new THREE.Mesh(doorGeo, woodMat);
    rightDoorMesh.position.x = -2; rightDoorMesh.castShadow = true; rightDoorMesh.receiveShadow = true;
    rightDoorPivot.add(rightDoorMesh);
    [-3, -1, 1, 3].forEach(dy => {
        const band = new THREE.Mesh(new THREE.BoxGeometry(4.1, 0.3, 0.55), ironMat);
        band.position.set(-2, dy, 0); rightDoorPivot.add(band);
    });
    castleGroup.add(rightDoorPivot);

    // Torches
    const torchLightColor = 0xff8800;
    const baseIntensity = 100;
    const torches = [];

    function createTorch(x, y, z) {
        const torchGroup = new THREE.Group();
        torchGroup.position.set(x, y, z);
        const bracket = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.3, 1), ironMat);
        bracket.position.set(0, 2.5, -0.3); torchGroup.add(bracket);
        const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.2, 3, 6),
            new THREE.MeshStandardMaterial({ color: 0x1a0a02 }));
        pole.position.y = 1.5; pole.castShadow = true; torchGroup.add(pole);
        const fireCore = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.8, 0.5),
            new THREE.MeshBasicMaterial({ color: 0xffdd44 }));
        fireCore.position.y = 3.4; torchGroup.add(fireCore);
        const fireOuter = new THREE.Mesh(new THREE.BoxGeometry(0.8, 1.2, 0.8),
            new THREE.MeshBasicMaterial({ color: 0xff8800, transparent: true, opacity: 0.7 }));
        fireOuter.position.y = 3.5; torchGroup.add(fireOuter);
        const light = new THREE.PointLight(torchLightColor, baseIntensity, 18);
        light.position.y = 3.8; light.castShadow = true; light.shadow.mapSize.set(256, 256);
        torchGroup.add(light);
        return { group: torchGroup, light, fireCore, fireOuter };
    }

    const leftTorch = createTorch(-6, 0, 4.5);
    castleGroup.add(leftTorch.group); torches.push(leftTorch);
    const rightTorch = createTorch(6, 0, 4.5);
    castleGroup.add(rightTorch.group); torches.push(rightTorch);

    // Side walls
    [-1, 1].forEach(side => {
        const sideWall = new THREE.Mesh(new THREE.BoxGeometry(12, 10, 2), stoneMat);
        sideWall.position.set(side * 22, 5, 0); sideWall.castShadow = true; sideWall.receiveShadow = true;
        castleGroup.add(sideWall);
        for (let wx = -4; wx <= 4; wx += 4) {
            const wc = new THREE.Mesh(new THREE.BoxGeometry(1, 1.5, 1), stoneMat);
            wc.position.set(side * 22 + wx, 10.75, 0); castleGroup.add(wc);
        }
    });

    // ─── Interior hall (behind the gate, extending into -Z) ───
    // A large stone chamber that hosts the Archive, Council and Studio alcoves.
    const hallLen = 32;
    const hallWidth = 26;
    const hallHeight = 12;
    const hallCenterZ = -17;

    const hallStoneMat = new THREE.MeshStandardMaterial({ color: 0x4a4552, roughness: 0.95 });
    const hallFloorMat = new THREE.MeshStandardMaterial({ color: 0x3a3540, roughness: 0.95 });
    const carpetMat = new THREE.MeshStandardMaterial({ color: 0x6b1e1e, roughness: 0.9 });

    // Floor
    const hallFloor = new THREE.Mesh(new THREE.PlaneGeometry(hallWidth, hallLen), hallFloorMat);
    hallFloor.rotation.x = -Math.PI / 2;
    hallFloor.position.set(0, 0.03, hallCenterZ);
    hallFloor.receiveShadow = true;
    castleGroup.add(hallFloor);

    // Central red carpet down the hall
    const carpet = new THREE.Mesh(new THREE.PlaneGeometry(4.5, hallLen - 2), carpetMat);
    carpet.rotation.x = -Math.PI / 2;
    carpet.position.set(0, 0.06, hallCenterZ);
    carpet.receiveShadow = true;
    castleGroup.add(carpet);

    // Back wall
    const backWall = new THREE.Mesh(new THREE.BoxGeometry(hallWidth, hallHeight, 1), hallStoneMat);
    backWall.position.set(0, hallHeight / 2, hallCenterZ - hallLen / 2);
    backWall.castShadow = true; backWall.receiveShadow = true;
    castleGroup.add(backWall);

    // Sky-colored windows — the world's actual time of day bleeds through
    // (real-time cue that connects the story to the user's actual moment)
    const _h = new Date().getHours();
    const skyIsNight = _h >= 21 || _h < 6;
    const skyIsEvening = _h >= 18 && _h < 21;
    const skyIsMorning = _h >= 6 && _h < 12;
    const skyTint = skyIsNight ? 0x3a4a80 : skyIsEvening ? 0xff9a5c : skyIsMorning ? 0xffd699 : 0x9ac0ff;
    const skyLightColor = skyIsNight ? 0x5566aa : skyIsEvening ? 0xff8855 : skyIsMorning ? 0xffcc88 : 0x88aadd;
    const skyLightIntensity = skyIsNight ? 4 : 8;
    const skyWindowMat = new THREE.MeshBasicMaterial({ color: skyTint });

    // Side walls with pilasters, torches and clerestory windows
    [-1, 1].forEach(side => {
        const wall = new THREE.Mesh(new THREE.BoxGeometry(1, hallHeight, hallLen), hallStoneMat);
        wall.position.set(side * (hallWidth / 2), hallHeight / 2, hallCenterZ);
        wall.castShadow = true; wall.receiveShadow = true;
        castleGroup.add(wall);

        // Pilasters + torches every 7 units
        for (let z = hallCenterZ + hallLen / 2 - 4; z > hallCenterZ - hallLen / 2 + 2; z -= 7) {
            const pilaster = new THREE.Mesh(new THREE.BoxGeometry(0.6, hallHeight, 1), stoneAccentMat);
            pilaster.position.set(side * (hallWidth / 2 - 0.5), hallHeight / 2, z);
            castleGroup.add(pilaster);

            const torch = createTorch(side * (hallWidth / 2 - 1.5), 2, z);
            castleGroup.add(torch.group); torches.push(torch);
        }

        // Tall clerestory windows between pilasters (3 per side)
        [-5, -13, -21].forEach(zOff => {
            const winZ = hallCenterZ + hallLen / 2 + zOff;
            // Window pane — flush against the interior face of the wall
            const win = new THREE.Mesh(new THREE.PlaneGeometry(2.2, 4), skyWindowMat);
            win.position.set(side * (hallWidth / 2 - 0.45), 8, winZ);
            win.rotation.y = side === -1 ? Math.PI / 2 : -Math.PI / 2;
            castleGroup.add(win);

            // Stone frame around the window
            const frameTop = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.4, 2.5), stoneAccentMat);
            frameTop.position.set(side * (hallWidth / 2 - 0.45), 10.2, winZ);
            castleGroup.add(frameTop);
            const frameBot = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.4, 2.5), stoneAccentMat);
            frameBot.position.set(side * (hallWidth / 2 - 0.45), 5.8, winZ);
            castleGroup.add(frameBot);
            // Mullion (vertical divider — cathedral style)
            const mullion = new THREE.Mesh(new THREE.BoxGeometry(0.35, 4, 0.25), stoneAccentMat);
            mullion.position.set(side * (hallWidth / 2 - 0.45), 8, winZ);
            castleGroup.add(mullion);

            // Sky-colored light spilling in from the window
            const skyLight = new THREE.PointLight(skyLightColor, skyLightIntensity, 12);
            skyLight.position.set(side * (hallWidth / 2 - 2), 7.5, winZ);
            castleGroup.add(skyLight);
        });
    });

    // Ground path
    const pathMat = new THREE.MeshStandardMaterial({ color: 0x4a4a3e, roughness: 0.95 });
    const path = new THREE.Mesh(new THREE.PlaneGeometry(10, 30), pathMat);
    path.rotation.x = -Math.PI / 2; path.position.set(0, 0.02, 15); path.receiveShadow = true;
    castleGroup.add(path);

    [-5.5, 5.5].forEach(px => {
        for (let pz = 2; pz < 28; pz += 3) {
            const edgeStone = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.3, 1.5), stoneDarkMat);
            edgeStone.position.set(px, 0.15, pz); edgeStone.receiveShadow = true;
            castleGroup.add(edgeStone);
        }
    });

    scene.add(castleGroup);
    return { castleGroup, leftDoorPivot, rightDoorPivot, torches, baseIntensity };
}

function buildArchive(scene) {
    // Library alcove on the LEFT side of the castle hall
    const group = new THREE.Group();
    group.position.set(-9, 0, -12);

    const darkWood = new THREE.MeshStandardMaterial({ color: 0x3a2215, roughness: 1 });
    const shelfWood = new THREE.MeshStandardMaterial({ color: 0x5c3a21, roughness: 0.95 });
    const goldAccent = new THREE.MeshStandardMaterial({ color: 0xb8962e, roughness: 0.4, metalness: 0.6 });
    const bookMats = [
        new THREE.MeshStandardMaterial({ color: 0x8b1e1e, roughness: 0.8 }),
        new THREE.MeshStandardMaterial({ color: 0x1e4b7a, roughness: 0.8 }),
        new THREE.MeshStandardMaterial({ color: 0x2a5a2a, roughness: 0.8 }),
        new THREE.MeshStandardMaterial({ color: 0x6b3d1e, roughness: 0.8 }),
    ];

    // Bookshelf against the left wall — 3 shelves stacked
    const shelfBack = new THREE.Mesh(new THREE.BoxGeometry(0.3, 8, 6), shelfWood);
    shelfBack.position.set(-2.3, 4, 0); shelfBack.castShadow = true;
    group.add(shelfBack);

    for (let sy = 1.5; sy <= 7; sy += 2) {
        const shelf = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.15, 6), shelfWood);
        shelf.position.set(-1.5, sy, 0); shelf.castShadow = true;
        group.add(shelf);

        // Books on each shelf
        for (let bz = -2.5; bz < 2.5; bz += 0.35) {
            const bookH = 1.1 + Math.random() * 0.5;
            const book = new THREE.Mesh(new THREE.BoxGeometry(1.2, bookH, 0.3), bookMats[Math.floor(Math.random() * bookMats.length)]);
            book.position.set(-1.5, sy + bookH / 2 + 0.08, bz);
            book.castShadow = true;
            group.add(book);
        }
    }

    // Reading desk with an open book (golden glow)
    const desk = new THREE.Mesh(new THREE.BoxGeometry(3, 0.3, 1.6), darkWood);
    desk.position.set(0.5, 1.5, 2); desk.castShadow = true;
    group.add(desk);
    [[-1.2, 1.4], [1.2, 1.4], [-1.2, 2.6], [1.2, 2.6]].forEach(([x, z]) => {
        const leg = new THREE.Mesh(new THREE.BoxGeometry(0.15, 1.35, 0.15), darkWood);
        leg.position.set(0.5 + x, 0.7, z - 2 + 2); leg.castShadow = true;
        group.add(leg);
    });

    const openBook = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.15, 1.1), goldAccent);
    openBook.position.set(0.5, 1.75, 2); openBook.castShadow = true;
    group.add(openBook);

    // Warm light over the desk
    const deskLight = new THREE.PointLight(0xffcc66, 20, 10);
    deskLight.position.set(0.5, 3.5, 2);
    group.add(deskLight);

    scene.add(group);
    return group;
}

function makeSignTexture(name, colorHex) {
    // Canvas-drawn pixel-style plate with the guardian's name.
    const size = 256;
    const canvas = document.createElement('canvas');
    canvas.width = size; canvas.height = size / 2;
    const ctx = canvas.getContext('2d');
    // Stone plate background
    ctx.fillStyle = '#2a2530';
    ctx.fillRect(0, 0, size, size / 2);
    // Inner bevel
    ctx.fillStyle = '#1a1620';
    ctx.fillRect(6, 6, size - 12, size / 2 - 12);
    // Name in pixel font
    ctx.fillStyle = colorHex;
    ctx.font = 'bold 40px "VT323", monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(name.toUpperCase(), size / 2, size / 4);
    const tex = new THREE.CanvasTexture(canvas);
    tex.magFilter = THREE.NearestFilter;
    tex.minFilter = THREE.LinearFilter;
    return tex;
}

function buildCouncil(scene) {
    // Central council chamber at the FAR end of the hall
    const group = new THREE.Group();
    group.position.set(0, 0, -26);

    const stoneMat = new THREE.MeshStandardMaterial({ color: 0x5a5566, roughness: 0.9 });
    const pedestalMat = new THREE.MeshStandardMaterial({ color: 0x4a4556, roughness: 0.8, metalness: 0.1 });
    const signStoneMat = new THREE.MeshStandardMaterial({ color: 0x3a3540, roughness: 0.95 });

    // Small circular platform
    const platform = new THREE.Mesh(new THREE.CylinderGeometry(5, 5.5, 0.6, 24), stoneMat);
    platform.position.y = 0.3; platform.receiveShadow = true;
    group.add(platform);

    // 6 guardian statues in a smaller circle
    const guardianData = [
        { name: 'Ledgar',     color: 0x6699ff, hex: '#6699ff' },
        { name: 'Chronos',    color: 0xff5544, hex: '#ff5544' },
        { name: 'Cartograph', color: 0x44cc88, hex: '#44cc88' },
        { name: 'Notifus',    color: 0x8866dd, hex: '#8866dd' },
        { name: 'Patchsmith', color: 0xffaa33, hex: '#ffaa33' },
        { name: 'Matriarch',  color: 0xff6699, hex: '#ff6699' },
    ];
    const statueCount = 6;
    const guardians = [];
    for (let i = 0; i < statueCount; i++) {
        const angle = (i / statueCount) * Math.PI * 2 - Math.PI / 2;
        const r = 3.5;
        const x = Math.cos(angle) * r;
        const z = Math.sin(angle) * r;
        const { name, color, hex } = guardianData[i];

        const pedestal = new THREE.Mesh(new THREE.BoxGeometry(1.2, 1.8, 1.2), pedestalMat);
        pedestal.position.set(x, 1.2, z); pedestal.castShadow = true;
        group.add(pedestal);

        const bodyMat = new THREE.MeshStandardMaterial({ color, roughness: 0.5, metalness: 0.3, emissive: color, emissiveIntensity: 0 });
        const body = new THREE.Mesh(new THREE.BoxGeometry(0.7, 2, 0.6), bodyMat);
        body.position.set(x, 3.1, z); body.castShadow = true;
        // Orient the statue so it faces outward (away from the altar)
        body.rotation.y = -angle - Math.PI / 2;
        group.add(body);

        const head = new THREE.Mesh(new THREE.SphereGeometry(0.35, 8, 8), bodyMat);
        head.position.set(x, 4.4, z);
        group.add(head);

        const glow = new THREE.PointLight(color, 3, 5);
        glow.position.set(x, 2.2, z);
        group.add(glow);

        // Stone signpost — placed in front of the pedestal, facing outward
        const signOffset = 1.35;
        const sx = Math.cos(angle) * (r + signOffset);
        const sz = Math.sin(angle) * (r + signOffset);

        const signPost = new THREE.Mesh(new THREE.BoxGeometry(0.15, 1.4, 0.15), signStoneMat);
        signPost.position.set(sx, 0.7, sz); signPost.castShadow = true;
        group.add(signPost);

        const signPlate = new THREE.Mesh(
            new THREE.PlaneGeometry(1.6, 0.8),
            new THREE.MeshBasicMaterial({ map: makeSignTexture(name, hex), transparent: false })
        );
        signPlate.position.set(sx, 1.6, sz);
        signPlate.rotation.y = -angle - Math.PI / 2;
        group.add(signPlate);

        guardians.push({ angle, bodyMat, glow, baseGlowIntensity: 3, awakeGlowIntensity: 18 });
    }

    // Central altar with golden glow
    const altar = new THREE.Mesh(
        new THREE.CylinderGeometry(0.8, 1.1, 1.4, 6),
        new THREE.MeshStandardMaterial({ color: 0x8a8a9c, roughness: 0.7, metalness: 0.2 })
    );
    altar.position.y = 0.7; altar.castShadow = true;
    group.add(altar);

    const altarCore = new THREE.Mesh(
        new THREE.SphereGeometry(0.4, 12, 12),
        new THREE.MeshBasicMaterial({ color: 0xffd700 })
    );
    altarCore.position.y = 1.7;
    group.add(altarCore);

    const altarLight = new THREE.PointLight(0xffd700, 25, 12);
    altarLight.position.set(0, 2.5, 0);
    group.add(altarLight);

    scene.add(group);
    return { group, guardians, altarCore };
}

function buildStudio(scene) {
    // Workshop alcove on the RIGHT side of the castle hall
    const group = new THREE.Group();
    group.position.set(9, 0, -18);

    const woodMat = new THREE.MeshStandardMaterial({ color: 0x6b4226, roughness: 0.95 });
    const darkWood = new THREE.MeshStandardMaterial({ color: 0x3a2215, roughness: 1 });
    const metalMat = new THREE.MeshStandardMaterial({ color: 0x8a8a9a, roughness: 0.5, metalness: 0.5 });

    // Workshop table
    const tableTop = new THREE.Mesh(new THREE.BoxGeometry(6, 0.4, 4), woodMat);
    tableTop.position.y = 3; tableTop.castShadow = true; tableTop.receiveShadow = true;
    group.add(tableTop);

    // Table legs
    [[-2.5, -1.5], [2.5, -1.5], [-2.5, 1.5], [2.5, 1.5]].forEach(([x, z]) => {
        const leg = new THREE.Mesh(new THREE.BoxGeometry(0.4, 2.8, 0.4), darkWood);
        leg.position.set(x, 1.4, z); leg.castShadow = true;
        group.add(leg);
    });

    // Tools on table
    const anvil = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.8, 0.8), metalMat);
    anvil.position.set(-1, 3.6, 0); anvil.castShadow = true;
    group.add(anvil);

    const hammer = new THREE.Mesh(new THREE.BoxGeometry(0.3, 1.5, 0.3), darkWood);
    hammer.position.set(1, 3.4, -0.5); hammer.rotation.z = 0.3;
    group.add(hammer);

    // Pixel canvas (a flat glowing square — "the studio screen")
    const canvasMat = new THREE.MeshBasicMaterial({ color: 0x222233 });
    const easel = new THREE.Mesh(new THREE.BoxGeometry(3, 3, 0.2), canvasMat);
    easel.position.set(0, 5.5, -2.5); easel.castShadow = true;
    group.add(easel);

    // Pixel grid glow on canvas
    const gridGlow = new THREE.Mesh(new THREE.BoxGeometry(2.6, 2.6, 0.05),
        new THREE.MeshBasicMaterial({ color: 0x4a3a6a, transparent: true, opacity: 0.6 }));
    gridGlow.position.set(0, 5.5, -2.38);
    group.add(gridGlow);

    // Warm workshop light
    const wLight = new THREE.PointLight(0xffaa55, 30, 15);
    wLight.position.set(0, 6, -1);
    group.add(wLight);

    scene.add(group);
    return group;
}

// ─── Main component ─────────────────────────────────────────────────

const CastleScene = () => {
    const containerRef = useRef(null);

    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        const h = new Date().getHours();
        const skyColor = (h >= 21 || h < 6) ? 0x0e0f1e : (h >= 18 && h < 21) ? 0x1e1520 : (h >= 6 && h < 12) ? 0x1a1b2e : 0x1c1d30;

        const scene = new THREE.Scene();
        scene.background = new THREE.Color(skyColor);
        scene.fog = new THREE.FogExp2(skyColor, 0.006);

        const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
        camera.position.set(0, 6, 35);

        const renderer = new THREE.WebGLRenderer({ antialias: true });
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        renderer.shadowMap.enabled = true;
        renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        renderer.toneMapping = THREE.ACESFilmicToneMapping;
        renderer.toneMappingExposure = 0.9;
        container.appendChild(renderer.domElement);

        // ── Lighting ──
        const sceneIsNight = h >= 21 || h < 6;
        const sceneIsEvening = h >= 18 && h < 21;
        const sceneIsMorning = h >= 6 && h < 12;

        const ambientColor = sceneIsNight ? 0x252540 : sceneIsEvening ? 0x3a2830 : sceneIsMorning ? 0x383040 : 0x383848;
        scene.add(new THREE.AmbientLight(ambientColor, sceneIsNight ? 1.4 : sceneIsEvening ? 1.6 : 1.8));

        const dirColor = sceneIsNight ? 0x8899cc : sceneIsEvening ? 0xcc8866 : sceneIsMorning ? 0xccaa77 : 0x99aacc;
        const dirX = sceneIsMorning ? -15 : sceneIsEvening || sceneIsNight ? 15 : 5;
        const mainLight = new THREE.DirectionalLight(dirColor, sceneIsNight ? 0.6 : sceneIsEvening ? 1.0 : 0.8);
        mainLight.position.set(dirX, 25, 20);
        mainLight.castShadow = true;
        mainLight.shadow.mapSize.set(1024, 1024);
        mainLight.shadow.camera.near = 0.5; mainLight.shadow.camera.far = 80;
        mainLight.shadow.camera.left = -40; mainLight.shadow.camera.right = 40;
        mainLight.shadow.camera.top = 30; mainLight.shadow.camera.bottom = -5;
        scene.add(mainLight);

        const rimLight = new THREE.DirectionalLight(sceneIsNight ? 0x4455aa : sceneIsEvening ? 0x553344 : 0x445588, 0.3);
        rimLight.position.set(-10, 10, -5);
        scene.add(rimLight);

        // ── Ground ──
        const floor = new THREE.Mesh(
            new THREE.PlaneGeometry(200, 200),
            new THREE.MeshStandardMaterial({ color: 0x2a3425, roughness: 1 })
        );
        floor.rotation.x = -Math.PI / 2; floor.receiveShadow = true;
        scene.add(floor);

        // ── Celestial body ──
        const isNight = h >= 21 || h < 6;
        const isEvening = h >= 18 && h < 21;
        const isMorning = h >= 6 && h < 12;
        const cX = isMorning ? -22 : isEvening || isNight ? 22 : 10;
        {
            const cSize = 1024;
            const canvas = document.createElement('canvas');
            canvas.width = cSize; canvas.height = cSize;
            const ctx = canvas.getContext('2d');
            const mid = cSize / 2;
            if (isNight) {
                const r = 100;
                const glow = ctx.createRadialGradient(mid, mid, 0, mid, mid, mid * 0.95);
                glow.addColorStop(0, 'rgba(140,170,255,0.35)');
                glow.addColorStop(0.15, 'rgba(140,170,255,0.18)');
                glow.addColorStop(0.4, 'rgba(140,170,255,0.06)');
                glow.addColorStop(1, 'rgba(140,170,255,0)');
                ctx.fillStyle = glow; ctx.fillRect(0, 0, cSize, cSize);
                ctx.beginPath(); ctx.arc(mid, mid, r, 0, Math.PI * 2);
                ctx.fillStyle = '#c8d8ff'; ctx.fill();
                ctx.beginPath(); ctx.arc(mid + r * 0.2, mid - r * 0.1, r * 0.7, 0, Math.PI * 2);
                ctx.fillStyle = '#1a1b2e'; ctx.fill();
            } else {
                const sunColor = isEvening ? '#ff9a5c' : isMorning ? '#ffd666' : '#ffe48a';
                const r = 90;
                const glow = ctx.createRadialGradient(mid, mid, 0, mid, mid, mid * 0.95);
                glow.addColorStop(0, sunColor + '60'); glow.addColorStop(0.2, sunColor + '25');
                glow.addColorStop(0.5, sunColor + '08'); glow.addColorStop(1, sunColor + '00');
                ctx.fillStyle = glow; ctx.fillRect(0, 0, cSize, cSize);
                const core = ctx.createRadialGradient(mid, mid, 0, mid, mid, r);
                core.addColorStop(0, '#fff8e0'); core.addColorStop(0.6, sunColor); core.addColorStop(1, sunColor + '00');
                ctx.fillStyle = core; ctx.beginPath(); ctx.arc(mid, mid, r, 0, Math.PI * 2); ctx.fill();
            }
            const tex = new THREE.CanvasTexture(canvas);
            const mat = new THREE.MeshBasicMaterial({ map: tex, transparent: true, fog: false, depthWrite: false });
            const plane = new THREE.Mesh(new THREE.PlaneGeometry(40, 40), mat);
            plane.position.set(cX, 28, -48); plane.renderOrder = -1;
            scene.add(plane);
        }

        // Stars
        const starMat = new THREE.MeshBasicMaterial({ color: 0xccccff });
        for (let i = 0; i < 80; i++) {
            const star = new THREE.Mesh(new THREE.SphereGeometry(0.08, 4, 4), starMat);
            star.position.set((Math.random() - 0.5) * 120, 15 + Math.random() * 35, -10 - Math.random() * 40);
            scene.add(star);
        }

        // ── Build world pieces ──
        const castle = buildCastle(scene);
        buildArchive(scene);
        const council = buildCouncil(scene);
        buildStudio(scene);

        // ── Particle systems ──
        const isMobile = window.innerWidth < 768;
        const pMul = isMobile ? 0.5 : 1;

        const particleSystems = [
            // Embers near castle gate torches (hero)
            createParticles(scene, Math.floor(200 * pMul), {
                center: [0, 5, 6], spread: [16, 12, 8],
                speed: 0.3, color: 0xff6622, size: 0.12, opacity: 0.9, rise: true,
            }),
            // Fireflies drifting through the main hall (Ch01)
            createParticles(scene, Math.floor(150 * pMul), {
                center: [0, 4, -8], spread: [20, 8, 14],
                speed: 0.08, color: 0xffdd44, size: 0.18, opacity: 0.7, rise: false,
            }),
            // Dust motes above the library desk (Ch02)
            createParticles(scene, Math.floor(120 * pMul), {
                center: [-9, 4, -12], spread: [8, 6, 6],
                speed: 0.05, color: 0xffcc88, size: 0.1, opacity: 0.6, rise: true,
            }),
            // Magical sparks around the council altar (Ch03)
            createParticles(scene, Math.floor(180 * pMul), {
                center: [0, 4, -26], spread: [8, 6, 8],
                speed: 0.15, color: 0xaa88ff, size: 0.14, opacity: 0.8, rise: false,
            }),
            // Pixel particles at the workshop easel (Ch04)
            createParticles(scene, Math.floor(100 * pMul), {
                center: [9, 4, -18], spread: [6, 5, 6],
                speed: 0.1, color: 0x88ddff, size: 0.2, opacity: 0.7, rise: false,
            }),
        ];

        // ── Ritual signal ── (waitlist signature triggers a world reaction)
        let ritualFlash = 0; // 0..1 decaying over time
        const onSigned = () => { ritualFlash = 1; };
        window.addEventListener('taskoria:signed', onSigned);

        // ── Scroll ──
        let scrollPercent = 0;
        const getMaxScroll = () => {
            const docH = document.documentElement.scrollHeight;
            const winH = window.innerHeight;
            return Math.max(1, docH - winH);
        };
        let maxScroll = getMaxScroll();

        const handleScroll = () => { scrollPercent = Math.min(Math.max(window.scrollY / maxScroll, 0), 1); };
        window.addEventListener('scroll', handleScroll, { passive: true });

        const handleResize = () => {
            maxScroll = getMaxScroll();
            camera.aspect = window.innerWidth / window.innerHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(window.innerWidth, window.innerHeight);
        };
        window.addEventListener('resize', handleResize);

        // ── Render loop ──
        const clock = new THREE.Clock();
        const lookTarget = new THREE.Vector3();
        let animId;

        const animate = () => {
            animId = requestAnimationFrame(animate);
            const elapsed = clock.getElapsedTime();

            // Camera
            const target = getCameraTarget(scrollPercent);
            camera.position.x += (target.pos[0] - camera.position.x) * 0.04;
            camera.position.y += (target.pos[1] - camera.position.y) * 0.04;
            camera.position.z += (target.pos[2] - camera.position.z) * 0.04;
            lookTarget.x += (target.look[0] - lookTarget.x) * 0.04;
            lookTarget.y += (target.look[1] - lookTarget.y) * 0.04;
            lookTarget.z += (target.look[2] - lookTarget.z) * 0.04;
            camera.lookAt(lookTarget);

            // Castle doors
            const doorProgress = Math.min(Math.max((scrollPercent - 0.02) / 0.10, 0), 1);
            const doorEase = 1 - Math.pow(1 - doorProgress, 3);
            const doorAngle = doorEase * (Math.PI / 1.9);
            castle.leftDoorPivot.rotation.y += (doorAngle - castle.leftDoorPivot.rotation.y) * 0.08;
            castle.rightDoorPivot.rotation.y += (-doorAngle - castle.rightDoorPivot.rotation.y) * 0.08;

            // Torch flicker
            const f1 = Math.sin(elapsed * 12) * Math.cos(elapsed * 17);
            const f2 = Math.sin(elapsed * 23) * 0.5;
            const flicker = (f1 + f2) * 25;
            const scaleY = 1 + Math.sin(elapsed * 18) * 0.15;
            const scaleXZ = 1 + Math.cos(elapsed * 22) * 0.08;
            castle.torches.forEach((t, i) => {
                const offset = i * 3;
                t.light.intensity = castle.baseIntensity + flicker + Math.sin(elapsed * 10 + offset) * 10;
                t.fireCore.scale.set(scaleXZ, scaleY, scaleXZ);
                t.fireOuter.scale.set(scaleXZ * 1.1, scaleY * 0.9, scaleXZ * 1.1);
                t.fireCore.rotation.y = elapsed * 2 + offset;
            });

            // Particles — fade opacity by distance from active chapter
            particleSystems.forEach((sys, idx) => {
                updateParticles(sys, elapsed);
                // Approximate chapter centers under the new (Ch03-expanded) scroll layout
                const chapterCenter = [0.04, 0.16, 0.28, 0.50, 0.72][idx] || 0.5;
                const dist = Math.abs(scrollPercent - chapterCenter);
                const fade = Math.max(0, 1 - dist * 3);
                sys.points.material.opacity = sys.opts.opacity * fade;
            });

            // Ritual flash — after signature, altar core pulses gold and torches surge
            if (ritualFlash > 0) {
                ritualFlash = Math.max(0, ritualFlash - 0.008);
                const glow = ritualFlash * ritualFlash * (3 - 2 * ritualFlash);
                // Altar surge
                council.altarCore.scale.setScalar(1 + glow * 0.6);
                council.altarCore.material.color.setRGB(1, 0.85 + glow * 0.15, 0.3 + glow * 0.4);
                // Boost every torch briefly
                castle.torches.forEach(t => {
                    t.light.intensity = castle.baseIntensity + glow * 120;
                });
            }

            // Council guardian awakening — the one the camera faces glows brighter
            if (scrollPercent >= COUNCIL_RANGE[0] && scrollPercent <= COUNCIL_RANGE[1]) {
                const t = (scrollPercent - COUNCIL_RANGE[0]) / (COUNCIL_RANGE[1] - COUNCIL_RANGE[0]);
                const camAngle = -Math.PI / 2 + t * Math.PI * 2;
                // Guardian we're facing is directly opposite the camera
                const facingAngle = camAngle + Math.PI;
                council.guardians.forEach(g => {
                    let delta = Math.abs(((g.angle - facingAngle) + Math.PI * 3) % (Math.PI * 2) - Math.PI);
                    // proximity 0..1 (1 = fully facing)
                    const prox = Math.max(0, 1 - delta / (Math.PI / 3));
                    const eased = prox * prox * (3 - 2 * prox);
                    g.glow.intensity = g.baseGlowIntensity + (g.awakeGlowIntensity - g.baseGlowIntensity) * eased;
                    g.bodyMat.emissiveIntensity = 0.4 * eased;
                });
                // Altar core pulses subtly during the council orbit
                council.altarCore.scale.setScalar(1 + Math.sin(elapsed * 2) * 0.08);
            } else {
                // Rest state — statues dim
                council.guardians.forEach(g => {
                    g.glow.intensity = g.baseGlowIntensity;
                    g.bodyMat.emissiveIntensity = 0;
                });
            }

            renderer.render(scene, camera);
        };

        // Recalc max scroll once layout settles
        const rafResize = requestAnimationFrame(() => { maxScroll = getMaxScroll(); });

        animate();

        return () => {
            cancelAnimationFrame(animId);
            cancelAnimationFrame(rafResize);
            window.removeEventListener('scroll', handleScroll);
            window.removeEventListener('resize', handleResize);
            window.removeEventListener('taskoria:signed', onSigned);
            renderer.dispose();
            if (container.contains(renderer.domElement)) {
                container.removeChild(renderer.domElement);
            }
        };
    }, []);

    return (
        <div ref={containerRef} className="fixed inset-0 z-0" style={{ pointerEvents: 'none' }}>
            <div className="absolute inset-0 pointer-events-none crt-overlay" />
        </div>
    );
};

export default CastleScene;
