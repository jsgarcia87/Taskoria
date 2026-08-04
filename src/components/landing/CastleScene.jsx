import { useEffect, useRef } from 'react';
import * as THREE from 'three';

const CastleScene = () => {
    const containerRef = useRef(null);

    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        const h = new Date().getHours();
        const skyColor = (h >= 21 || h < 6) ? 0x0e0f1e : (h >= 18 && h < 21) ? 0x1e1520 : (h >= 6 && h < 12) ? 0x1a1b2e : 0x1c1d30;
        const scene = new THREE.Scene();
        scene.background = new THREE.Color(skyColor);
        scene.fog = new THREE.FogExp2(skyColor, 0.012);

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

        // Time-based lighting
        const sceneHour = new Date().getHours();
        const sceneIsNight = sceneHour >= 21 || sceneHour < 6;
        const sceneIsEvening = sceneHour >= 18 && sceneHour < 21;
        const sceneIsMorning = sceneHour >= 6 && sceneHour < 12;

        const ambientColor = sceneIsNight ? 0x252540 : sceneIsEvening ? 0x3a2830 : sceneIsMorning ? 0x383040 : 0x383848;
        const ambientLight = new THREE.AmbientLight(ambientColor, sceneIsNight ? 1.4 : sceneIsEvening ? 1.6 : 1.8);
        scene.add(ambientLight);

        const dirColor = sceneIsNight ? 0x8899cc : sceneIsEvening ? 0xcc8866 : sceneIsMorning ? 0xccaa77 : 0x99aacc;
        const dirX = sceneIsMorning ? -15 : sceneIsEvening || sceneIsNight ? 15 : 5;
        const mainLight = new THREE.DirectionalLight(dirColor, sceneIsNight ? 0.6 : sceneIsEvening ? 1.0 : 0.8);
        mainLight.position.set(dirX, 25, 20);
        mainLight.castShadow = true;
        mainLight.shadow.mapSize.set(1024, 1024);
        mainLight.shadow.camera.near = 0.5;
        mainLight.shadow.camera.far = 60;
        mainLight.shadow.camera.left = -25;
        mainLight.shadow.camera.right = 25;
        mainLight.shadow.camera.top = 25;
        mainLight.shadow.camera.bottom = -5;
        scene.add(mainLight);

        const rimColor = sceneIsNight ? 0x4455aa : sceneIsEvening ? 0x553344 : 0x445588;
        const rimLight = new THREE.DirectionalLight(rimColor, 0.3);
        rimLight.position.set(-10, 10, -5);
        scene.add(rimLight);

        const castleGroup = new THREE.Group();

        // Materials
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
        wall.position.y = 6.5;
        wall.castShadow = true;
        wall.receiveShadow = true;
        castleGroup.add(wall);

        // Wall stone band (horizontal accent)
        const wallBand = new THREE.Mesh(new THREE.BoxGeometry(26.2, 0.6, 4.2), stoneAccentMat);
        wallBand.position.y = 9;
        castleGroup.add(wallBand);
        const wallBand2 = new THREE.Mesh(new THREE.BoxGeometry(26.2, 0.4, 4.2), stoneAccentMat);
        wallBand2.position.y = 3;
        castleGroup.add(wallBand2);

        // Towers
        const towerGeo = new THREE.BoxGeometry(7, 18, 7);
        [-13, 13].forEach(tx => {
            const tower = new THREE.Mesh(towerGeo, stoneDarkMat);
            tower.position.set(tx, 9, 1);
            tower.castShadow = true;
            tower.receiveShadow = true;
            castleGroup.add(tower);

            // Tower stone bands
            [6, 12, 16].forEach(by => {
                const band = new THREE.Mesh(new THREE.BoxGeometry(7.3, 0.4, 7.3), stoneAccentMat);
                band.position.set(tx, by, 1);
                castleGroup.add(band);
            });

            // Tower roof (pyramid)
            const roofGeo = new THREE.ConeGeometry(5.5, 5, 4);
            const roof = new THREE.Mesh(roofGeo, roofMat);
            roof.position.set(tx, 21, 1);
            roof.rotation.y = Math.PI / 4;
            roof.castShadow = true;
            castleGroup.add(roof);

            // Roof tip finial
            const finial = new THREE.Mesh(new THREE.SphereGeometry(0.4, 8, 6), ironMat);
            finial.position.set(tx, 23.7, 1);
            castleGroup.add(finial);

            // Tower battlements
            const crenelGeo = new THREE.BoxGeometry(1.3, 1.8, 1.3);
            for (let cx = -2.5; cx <= 2.5; cx += 2.5) {
                for (let cz = -2.5; cz <= 2.5; cz += 2.5) {
                    if (Math.abs(cx) < 2 && Math.abs(cz) < 2) continue;
                    const crenel = new THREE.Mesh(crenelGeo, stoneMat);
                    crenel.position.set(tx + cx, 18.9, 1 + cz);
                    crenel.castShadow = true;
                    castleGroup.add(crenel);
                }
            }

            // Tower windows (glowing)
            [8, 14].forEach(wy => {
                const winFrame = new THREE.Mesh(new THREE.BoxGeometry(1.2, 2, 0.3), stoneDarkMat);
                winFrame.position.set(tx, wy, 4.6);
                castleGroup.add(winFrame);
                const winGlow = new THREE.Mesh(new THREE.BoxGeometry(0.8, 1.6, 0.15), windowGlowMat);
                winGlow.position.set(tx, wy, 4.75);
                castleGroup.add(winGlow);
                const wLight = new THREE.PointLight(0xffcc66, 8, 6);
                wLight.position.set(tx, wy, 5.5);
                castleGroup.add(wLight);
            });
        });

        // Wall battlements
        for (let wx = -10; wx <= 10; wx += 2.8) {
            const wc = new THREE.Mesh(new THREE.BoxGeometry(1.3, 1.8, 1.3), stoneMat);
            wc.position.set(wx, 13.9, 0);
            wc.castShadow = true;
            castleGroup.add(wc);
        }

        // Gate arch
        const archGeo = new THREE.BoxGeometry(9, 2.5, 4.5);
        const arch = new THREE.Mesh(archGeo, stoneAccentMat);
        arch.position.set(0, 11, 0);
        arch.castShadow = true;
        castleGroup.add(arch);

        // Arch keystone
        const keystone = new THREE.Mesh(new THREE.BoxGeometry(1.5, 1.2, 0.5), ironMat);
        keystone.position.set(0, 12.3, 2.3);
        castleGroup.add(keystone);

        // Gate pillars
        [-4.8, 4.8].forEach(px => {
            const pillar = new THREE.Mesh(new THREE.BoxGeometry(1.2, 10, 1.2), stoneAccentMat);
            pillar.position.set(px, 5, 2.3);
            pillar.castShadow = true;
            castleGroup.add(pillar);
        });

        // Interior
        const interior = new THREE.Mesh(new THREE.BoxGeometry(8, 10, 4.5), darkInteriorMat);
        interior.position.set(0, 5, 0);
        castleGroup.add(interior);

        // Doors
        const doorGeo = new THREE.BoxGeometry(4, 10, 0.5);

        const leftDoorPivot = new THREE.Group();
        leftDoorPivot.position.set(-4, 5, 2.2);
        const leftDoorMesh = new THREE.Mesh(doorGeo, woodMat);
        leftDoorMesh.position.x = 2;
        leftDoorMesh.castShadow = true;
        leftDoorMesh.receiveShadow = true;
        leftDoorPivot.add(leftDoorMesh);

        // Door iron bands
        [-3, -1, 1, 3].forEach(dy => {
            const band = new THREE.Mesh(new THREE.BoxGeometry(4.1, 0.3, 0.55), ironMat);
            band.position.set(2, dy, 0);
            leftDoorPivot.add(band);
        });
        castleGroup.add(leftDoorPivot);

        const rightDoorPivot = new THREE.Group();
        rightDoorPivot.position.set(4, 5, 2.2);
        const rightDoorMesh = new THREE.Mesh(doorGeo, woodMat);
        rightDoorMesh.position.x = -2;
        rightDoorMesh.castShadow = true;
        rightDoorMesh.receiveShadow = true;
        rightDoorPivot.add(rightDoorMesh);

        [-3, -1, 1, 3].forEach(dy => {
            const band = new THREE.Mesh(new THREE.BoxGeometry(4.1, 0.3, 0.55), ironMat);
            band.position.set(-2, dy, 0);
            rightDoorPivot.add(band);
        });
        castleGroup.add(rightDoorPivot);

        // Torches
        const torchLightColor = 0xff8800;
        const baseIntensity = 100;
        const torches = [];

        function createTorch(x, y, z) {
            const torchGroup = new THREE.Group();
            torchGroup.position.set(x, y, z);

            // Wall bracket
            const bracket = new THREE.Mesh(
                new THREE.BoxGeometry(0.3, 0.3, 1),
                ironMat
            );
            bracket.position.set(0, 2.5, -0.3);
            torchGroup.add(bracket);

            const pole = new THREE.Mesh(
                new THREE.CylinderGeometry(0.15, 0.2, 3, 6),
                new THREE.MeshStandardMaterial({ color: 0x1a0a02 })
            );
            pole.position.y = 1.5;
            pole.castShadow = true;
            torchGroup.add(pole);

            // Multi-part fire
            const fireCore = new THREE.Mesh(
                new THREE.BoxGeometry(0.5, 0.8, 0.5),
                new THREE.MeshBasicMaterial({ color: 0xffdd44 })
            );
            fireCore.position.y = 3.4;
            torchGroup.add(fireCore);

            const fireOuter = new THREE.Mesh(
                new THREE.BoxGeometry(0.8, 1.2, 0.8),
                new THREE.MeshBasicMaterial({ color: 0xff8800, transparent: true, opacity: 0.7 })
            );
            fireOuter.position.y = 3.5;
            torchGroup.add(fireOuter);

            const light = new THREE.PointLight(torchLightColor, baseIntensity, 18);
            light.position.y = 3.8;
            light.castShadow = true;
            light.shadow.mapSize.set(256, 256);
            torchGroup.add(light);

            return { group: torchGroup, light, fireCore, fireOuter };
        }

        const leftTorch = createTorch(-6, 0, 4.5);
        castleGroup.add(leftTorch.group);
        torches.push(leftTorch);

        const rightTorch = createTorch(6, 0, 4.5);
        castleGroup.add(rightTorch.group);
        torches.push(rightTorch);

        // Side walls extending left and right
        [-1, 1].forEach(side => {
            const sideWall = new THREE.Mesh(new THREE.BoxGeometry(12, 10, 2), stoneMat);
            sideWall.position.set(side * 22, 5, 0);
            sideWall.castShadow = true;
            sideWall.receiveShadow = true;
            castleGroup.add(sideWall);

            for (let wx = -4; wx <= 4; wx += 4) {
                const wc = new THREE.Mesh(new THREE.BoxGeometry(1, 1.5, 1), stoneMat);
                wc.position.set(side * 22 + wx, 10.75, 0);
                castleGroup.add(wc);
            }
        });

        // Ground path (cobblestone approach)
        const pathMat = new THREE.MeshStandardMaterial({ color: 0x4a4a3e, roughness: 0.95 });
        const path = new THREE.Mesh(new THREE.PlaneGeometry(10, 30), pathMat);
        path.rotation.x = -Math.PI / 2;
        path.position.set(0, 0.02, 15);
        path.receiveShadow = true;
        castleGroup.add(path);

        // Path edge stones
        [-5.5, 5.5].forEach(px => {
            for (let pz = 2; pz < 28; pz += 3) {
                const edgeStone = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.3, 1.5), stoneDarkMat);
                edgeStone.position.set(px, 0.15, pz);
                edgeStone.receiveShadow = true;
                castleGroup.add(edgeStone);
            }
        });

        // Floor
        const floor = new THREE.Mesh(
            new THREE.PlaneGeometry(120, 120),
            new THREE.MeshStandardMaterial({ color: 0x2a3425, roughness: 1 })
        );
        floor.rotation.x = -Math.PI / 2;
        floor.receiveShadow = true;
        scene.add(floor);

        // Celestial body (sun or moon) — painted on a sky plane behind all geometry
        const hour = new Date().getHours();
        const isNight = hour >= 21 || hour < 6;
        const isEvening = hour >= 18 && hour < 21;
        const isMorning = hour >= 6 && hour < 12;

        const skyPlaneZ = -48;
        const cX = isMorning ? -22 : isEvening || isNight ? 22 : 10;
        const cY = 28;

        if (isNight) {
            const canvas = document.createElement('canvas');
            canvas.width = 512; canvas.height = 512;
            const ctx = canvas.getContext('2d');
            const cx = 256, cy = 256, r = 140;
            const glow = ctx.createRadialGradient(cx, cy, r * 0.8, cx, cy, r * 2.5);
            glow.addColorStop(0, 'rgba(140,170,255,0.25)');
            glow.addColorStop(1, 'rgba(140,170,255,0)');
            ctx.fillStyle = glow;
            ctx.fillRect(0, 0, 512, 512);
            ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2);
            ctx.fillStyle = '#c8d8ff'; ctx.fill();
            ctx.beginPath(); ctx.arc(cx + r * 0.2, cy - r * 0.1, r * 0.7, 0, Math.PI * 2);
            ctx.fillStyle = '#1a1b2e'; ctx.fill();
            const tex = new THREE.CanvasTexture(canvas);
            const mat = new THREE.MeshBasicMaterial({ map: tex, transparent: true, fog: false, depthWrite: false });
            const plane = new THREE.Mesh(new THREE.PlaneGeometry(20, 20), mat);
            plane.position.set(cX, cY, skyPlaneZ);
            plane.renderOrder = -1;
            scene.add(plane);
        } else {
            const sunColor = isEvening ? '#ff9a5c' : isMorning ? '#ffd666' : '#ffe48a';
            const canvas = document.createElement('canvas');
            canvas.width = 512; canvas.height = 512;
            const ctx = canvas.getContext('2d');
            const cx = 256, cy = 256, r = 120;
            const glow = ctx.createRadialGradient(cx, cy, r * 0.5, cx, cy, r * 2.5);
            glow.addColorStop(0, sunColor + '60');
            glow.addColorStop(0.3, sunColor + '20');
            glow.addColorStop(1, sunColor + '00');
            ctx.fillStyle = glow;
            ctx.fillRect(0, 0, 512, 512);
            const core = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
            core.addColorStop(0, '#fff8e0');
            core.addColorStop(0.6, sunColor);
            core.addColorStop(1, sunColor + '00');
            ctx.fillStyle = core;
            ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.fill();
            const tex = new THREE.CanvasTexture(canvas);
            const mat = new THREE.MeshBasicMaterial({ map: tex, transparent: true, fog: false, depthWrite: false });
            const plane = new THREE.Mesh(new THREE.PlaneGeometry(20, 20), mat);
            plane.position.set(cX, cY, skyPlaneZ);
            plane.renderOrder = -1;
            scene.add(plane);
        }

        // Particle-like stars (small spheres)
        const starMat = new THREE.MeshBasicMaterial({ color: 0xccccff });
        for (let i = 0; i < 60; i++) {
            const star = new THREE.Mesh(new THREE.SphereGeometry(0.08, 4, 4), starMat);
            star.position.set(
                (Math.random() - 0.5) * 80,
                15 + Math.random() * 30,
                -10 - Math.random() * 30
            );
            scene.add(star);
        }

        scene.add(castleGroup);

        // Scroll handling - synced exactly with LandingPage sticky scroll
        let scrollPercent = 0;
        let maxScroll = Math.max(1, (window.innerHeight * 3) - window.innerHeight);

        const handleScroll = () => {
            scrollPercent = Math.min(Math.max(window.scrollY / maxScroll, 0), 1);
        };
        window.addEventListener('scroll', handleScroll, { passive: true });

        const handleResize = () => {
            maxScroll = Math.max(1, (window.innerHeight * 3) - window.innerHeight);
            camera.aspect = window.innerWidth / window.innerHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(window.innerWidth, window.innerHeight);
        };
        window.addEventListener('resize', handleResize);

        const clock = new THREE.Clock();
        let animId;

        const animate = () => {
            animId = requestAnimationFrame(animate);
            const elapsed = clock.getElapsedTime();

            // Camera approach - flies from outside (z=35) through open doors into castle interior (z=-1)
            const targetZ = 35 - scrollPercent * 36;
            const targetY = 6 - scrollPercent * 2;
            camera.position.z += (targetZ - camera.position.z) * 0.08;
            camera.position.y += (targetY - camera.position.y) * 0.08;

            // Doors open smoothly between 10% and 75% scroll so they are wide open when entering
            const doorProgress = Math.min(Math.max((scrollPercent - 0.1) / 0.65, 0), 1);
            const doorEase = 1 - Math.pow(1 - doorProgress, 3);
            const doorAngle = doorEase * (Math.PI / 1.9);
            leftDoorPivot.rotation.y += (doorAngle - leftDoorPivot.rotation.y) * 0.08;
            rightDoorPivot.rotation.y += (-doorAngle - rightDoorPivot.rotation.y) * 0.08;

            // Torch flicker
            const f1 = Math.sin(elapsed * 12) * Math.cos(elapsed * 17);
            const f2 = Math.sin(elapsed * 23) * 0.5;
            const flicker = (f1 + f2) * 25;
            const scaleY = 1 + Math.sin(elapsed * 18) * 0.15;
            const scaleXZ = 1 + Math.cos(elapsed * 22) * 0.08;

            torches.forEach((t, i) => {
                const offset = i * 3;
                const localFlicker = flicker + Math.sin(elapsed * 10 + offset) * 10;
                t.light.intensity = baseIntensity + localFlicker;
                t.fireCore.scale.set(scaleXZ, scaleY, scaleXZ);
                t.fireOuter.scale.set(scaleXZ * 1.1, scaleY * 0.9, scaleXZ * 1.1);
                t.fireCore.rotation.y = elapsed * 2 + offset;
            });

            // Fade scene to dark RPG background as we enter inside the castle (0.82 -> 0.98)
            const fadeStart = 0.82;
            const sr = (skyColor >> 16) & 0xff, sg = (skyColor >> 8) & 0xff, sb = skyColor & 0xff;
            if (scrollPercent > fadeStart) {
                const fade = Math.min((scrollPercent - fadeStart) / 0.16, 1);
                const r = Math.round(sr + (0x0f - sr) * fade);
                const g = Math.round(sg + (0x0a - sg) * fade);
                const b = Math.round(sb + (0x1f - sb) * fade);
                const hexColor = r * 0x10000 + g * 0x100 + b;
                scene.background.setHex(hexColor);
                if (scene.fog) scene.fog.color.setHex(hexColor);
            } else {
                scene.background.setHex(skyColor);
                if (scene.fog) scene.fog.color.setHex(skyColor);
            }

            renderer.render(scene, camera);
        };

        animate();

        return () => {
            cancelAnimationFrame(animId);
            window.removeEventListener('scroll', handleScroll);
            window.removeEventListener('resize', handleResize);
            renderer.dispose();
            if (container.contains(renderer.domElement)) {
                container.removeChild(renderer.domElement);
            }
        };
    }, []);

    return (
        <div ref={containerRef} className="fixed inset-0 z-0" style={{ pointerEvents: 'none' }}>
            {/* CRT overlay */}
            <div className="absolute inset-0 pointer-events-none crt-overlay" />
        </div>
    );
};

export default CastleScene;
