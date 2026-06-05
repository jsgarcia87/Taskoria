# MEJORA 1 — Wild Sanctuary (PetSanctuaryView.jsx)

## Diagnóstico
El Wild Sanctuary (imagen captura 3) muestra:
- Fondo verde oscuro con puntitos radial-gradient — muy vacío
- Partículas mágicas apenas visibles (blur demasiado alto)
- Estado vacío: solo texto plano sin personalidad visual
- Usa `PixelPet` legacy (no `ModernPixelPet`)

## Qué cambiar

### 1. Importar ModernPixelPet en lugar de PixelPet

```jsx
// QUITAR:
import PixelPet from '../common/PixelPet';

// AÑADIR:
import ModernPixelPet from '../common/ModernPixelPet';
```

### 2. Reemplazar el fondo del sanctuary — zona del recuadro h-48/h-64

Sustituir todo el bloque `{/* Sanctuary Grass Background */}` por esta versión mejorada:

```jsx
{/* Sanctuary Visual */}
<div className="relative w-full h-52 sm:h-64 rounded-2xl overflow-hidden border-2 border-emerald-800/60 shadow-[0_15px_40px_rgba(0,0,0,0.6),inset_0_0_60px_rgba(0,255,128,0.04)]">

    {/* Admin Reset */}
    {currentUser?.is_admin && (
        <div className="absolute top-2 right-2 z-50">
            <button onClick={handleResetAll}
                className="bg-red-900/80 hover:bg-red-600 text-red-100 px-3 py-1.5 rounded-lg border border-red-500/50 font-bold uppercase tracking-widest text-[9px] transition-all">
                ⚠ Reset All Pets
            </button>
        </div>
    )}

    {/* Fondo: cielo nocturno + hierba */}
    <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom, #071a10 0%, #0d2e1a 40%, #14532d 100%)' }} />

    {/* Estrellas / partículas de fondo */}
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {[
            { top: '8%',  left: '12%', size: 2, dur: '4s' },
            { top: '15%', left: '35%', size: 1, dur: '6s' },
            { top: '6%',  left: '60%', size: 2, dur: '3s' },
            { top: '20%', left: '80%', size: 1, dur: '5s' },
            { top: '12%', left: '90%', size: 2, dur: '7s' },
            { top: '5%',  left: '50%', size: 1, dur: '4s' },
        ].map((s, i) => (
            <div key={i} className="absolute rounded-full bg-white animate-pulse"
                style={{ top: s.top, left: s.left, width: s.size, height: s.size, animationDuration: s.dur, opacity: 0.6 }} />
        ))}
    </div>

    {/* Colinas de hierba CSS (capas) */}
    <div className="absolute bottom-0 left-0 right-0 h-20 rounded-b-2xl" style={{ background: 'linear-gradient(to top, #166534 0%, #15803d 60%, transparent 100%)' }} />
    <div className="absolute bottom-0 left-[-10%] right-[-5%] h-16" style={{
        background: '#15803d',
        borderRadius: '60% 80% 0 0 / 40px 40px 0 0',
        opacity: 0.8
    }} />
    <div className="absolute bottom-0 left-[20%] right-[-20%] h-12" style={{
        background: '#166534',
        borderRadius: '80% 40% 0 0 / 30px 20px 0 0',
        opacity: 0.6
    }} />

    {/* Flores decorativas (SVG pixel art inline) */}
    <div className="absolute bottom-6 left-[8%] pointer-events-none">
        <svg width="12" height="14" viewBox="0 0 6 7" shapeRendering="crispEdges" style={{ imageRendering: 'pixelated' }}>
            <rect x="2" y="0" width="2" height="2" fill="#fbbf24"/>
            <rect x="1" y="1" width="4" height="2" fill="#fde68a"/>
            <rect x="2" y="2" width="2" height="5" fill="#16a34a"/>
        </svg>
    </div>
    <div className="absolute bottom-8 left-[15%] pointer-events-none">
        <svg width="10" height="12" viewBox="0 0 5 6" shapeRendering="crispEdges" style={{ imageRendering: 'pixelated' }}>
            <rect x="1" y="0" width="3" height="2" fill="#f472b6"/>
            <rect x="2" y="1" width="1" height="4" fill="#15803d"/>
        </svg>
    </div>
    <div className="absolute bottom-5 right-[10%] pointer-events-none">
        <svg width="12" height="14" viewBox="0 0 6 7" shapeRendering="crispEdges" style={{ imageRendering: 'pixelated' }}>
            <rect x="2" y="0" width="2" height="2" fill="#60a5fa"/>
            <rect x="1" y="1" width="4" height="2" fill="#93c5fd"/>
            <rect x="2" y="2" width="2" height="5" fill="#15803d"/>
        </svg>
    </div>
    <div className="absolute bottom-7 right-[22%] pointer-events-none">
        <svg width="10" height="12" viewBox="0 0 5 6" shapeRendering="crispEdges" style={{ imageRendering: 'pixelated' }}>
            <rect x="1" y="0" width="3" height="2" fill="#a78bfa"/>
            <rect x="2" y="1" width="1" height="4" fill="#166534"/>
        </svg>
    </div>

    {/* Aura mágica del sanctuary */}
    <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-3/4 h-20 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse, rgba(52,211,153,0.12) 0%, transparent 70%)' }} />

    {/* Partículas mágicas pequeñas y nítidas */}
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {[
            { top: '55%', left: '20%', color: '#34d399', dur: '3s', del: '0s' },
            { top: '40%', left: '70%', color: '#6ee7b7', dur: '5s', del: '1s' },
            { top: '65%', left: '45%', color: '#a7f3d0', dur: '4s', del: '2s' },
            { top: '50%', left: '85%', color: '#34d399', dur: '6s', del: '0.5s' },
            { top: '70%', left: '10%', color: '#10b981', dur: '3.5s', del: '1.5s' },
        ].map((p, i) => (
            <div key={i} className="absolute w-1.5 h-1.5 rounded-full animate-bounce"
                style={{ top: p.top, left: p.left, backgroundColor: p.color, animationDuration: p.dur, animationDelay: p.del, opacity: 0.85 }} />
        ))}
    </div>

    {/* Contenido: Mascotas o estado vacío */}
    {myPets.length > 0 ? (
        <div className="absolute inset-0 pt-4 px-6 pb-16">
            {myPets.map((pet, idx) => {
                const seed = pet.id.length + idx;
                const leftPos = Math.abs(Math.sin(seed * 123)) * 75 + 10;
                const topPos = Math.abs(Math.cos(seed * 321)) * 40 + 35;
                const delay = Math.abs(Math.sin(seed)) * 2;
                return (
                    <div key={pet.id} className="absolute flex flex-col items-center pointer-events-none"
                        style={{ left: `${leftPos}%`, top: `${topPos}%`, zIndex: Math.floor(topPos) }}>
                        <div className="bg-black/50 text-emerald-300 font-bold text-[8px] uppercase tracking-wider px-1.5 py-0.5 rounded-full mb-1 border border-emerald-500/30 whitespace-nowrap backdrop-blur-sm">
                            Lv{pet.level} {pet.type}
                        </div>
                        <div className="filter drop-shadow-xl animate-bounce" style={{ animationDuration: '3s', animationDelay: `${delay}s` }}>
                            <ModernPixelPet type={pet.type} scale={1.8} customColors={pet.customColors} />
                        </div>
                        <div className="w-8 h-1.5 bg-black/30 rounded-[50%] blur-[2px] mt-[-2px]" />
                    </div>
                );
            })}
        </div>
    ) : (
        /* Estado vacío mejorado */
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6 z-10">
            {/* Huevo pixel art SVG */}
            <svg width="48" height="56" viewBox="0 0 12 14" shapeRendering="crispEdges"
                style={{ imageRendering: 'pixelated', marginBottom: 12, opacity: 0.5 }}>
                <rect x="4" y="0" width="4" height="2" fill="#34d399"/>
                <rect x="2" y="2" width="8" height="2" fill="#34d399"/>
                <rect x="1" y="4" width="10" height="4" fill="#10b981"/>
                <rect x="2" y="8" width="8" height="3" fill="#059669"/>
                <rect x="4" y="11" width="4" height="2" fill="#047857"/>
                {/* Brillo */}
                <rect x="3" y="3" width="2" height="2" fill="#6ee7b7"/>
                <rect x="3" y="3" width="1" height="1" fill="#a7f3d0"/>
            </svg>
            <p className="text-emerald-400/70 font-bold tracking-widest uppercase text-xs">Sanctuary is empty</p>
            <p className="text-gray-500 text-[11px] mt-1.5 max-w-[180px] leading-relaxed">
                Hatch eggs or adopt companions to see them roam here
            </p>
        </div>
    )}
</div>
```

### 3. Actualizar el render de mascotas en el Adoption Center

En la sección de Adoption Center, cambiar `PixelPet` → `ModernPixelPet`:

```jsx
// ANTES:
<PixelPet type={pet.pet_type} level={pet.pet_level} />

// DESPUÉS:
<ModernPixelPet type={pet.pet_type} scale={1} />
```

---

## Resultado esperado
- Fondo con cielo nocturno degradado + colinas de hierba en capas
- Flores pixel art decorativas en la hierba
- Partículas mágicas nítidas y visibles (sin blur excesivo)
- Estado vacío con huevo SVG pixel art animado
- Mascotas usando `ModernPixelPet` (canvas, más nítido)
