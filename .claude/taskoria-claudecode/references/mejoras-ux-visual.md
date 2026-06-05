# MEJORA 2 — Family Selector (ProfileSelection.jsx)
## Diagnóstico: Avatares idénticos

En la pantalla "Taskoria Family" (imagen 6), Jesús y Leo muestran el **mismo avatar** (paladín blanco) aunque tienen clases distintas.

### Causa raíz
`ProfileSelection.jsx` usa `profile.state.character.avatarId` para el tipo del avatar:
```jsx
<PixelAvatar type={profile.state.character.avatarId} ... headOnly={true} />
```

El `avatarId` es un string como `'fighter'`, `'wizard'`, etc. Si `avatarId` no está bien guardado en el estado del perfil o se guarda como el `id` del personaje seleccionado (que puede ser igual para varios perfiles que eligieron el mismo tipo), todos se ven igual.

### Fix 1 — Migrar de PixelAvatar legacy a ModernPixelAvatar

```jsx
// En src/components/ProfileSelection.jsx

// QUITAR import:
// import PixelAvatar from './common/PixelAvatar';   ← si existe
// AÑADIR:
import ModernPixelAvatar from './common/ModernPixelAvatar';
```

### Fix 2 — Mejorar la resolución del tipo de avatar

Reemplazar el bloque de renderizado del avatar en el selector de perfil:

```jsx
// ANTES:
{profile.state?.character?.avatarId ? (
    <PixelAvatar
        type={profile.state.character.avatarId}
        scale={4.0}
        customColors={profile.state.character.avatarColors}
        headOnly={true}
    />
) : (
    <User size={48} className="text-gray-500 group-hover:text-rpg-gold transition-colors" />
)}

// DESPUÉS — con ModernPixelAvatar y fallback chain más robusto:
{(() => {
    const char = profile.state?.character;
    // Fallback chain: avatarId → class (en minúscula) → 'warrior'
    const avatarType = char?.avatarId
        || char?.class?.toLowerCase()
        || 'warrior';
    
    return char ? (
        <ModernPixelAvatar
            type={avatarType}
            scale={3.5}
            headOnly={true}
            customColors={char.avatarColors}
        />
    ) : (
        <div className="flex items-center justify-center w-full h-full">
            <svg width="48" height="48" viewBox="0 0 12 12" shapeRendering="crispEdges"
                style={{ imageRendering: 'pixelated', opacity: 0.4 }}>
                {/* Silueta de personaje genérico */}
                <rect x="4" y="1" width="4" height="4" fill="#6b7280"/>
                <rect x="3" y="5" width="6" height="5" fill="#4b5563"/>
                <rect x="2" y="8" width="3" height="3" fill="#374151"/>
                <rect x="7" y="8" width="3" height="3" fill="#374151"/>
            </svg>
        </div>
    );
})()}
```

### Fix 3 — Asegurarse de que avatarId se guarda correctamente al crear personaje

Buscar en `CharacterCreation.jsx` o donde se haga dispatch de creación de personaje y verificar que `avatarId` se guarda igual que el `id` del personaje de `CHARACTERS`:

```js
// En el dispatch de crear personaje, debe incluir:
dispatch({
    type: 'CREATE_CHARACTER',
    payload: {
        // ...otros campos...
        avatarId: selectedCharacter.id,   // ← ej: 'wizard', 'paladin', 'fighter'
        avatarType: selectedCharacter.avatarType,  // ← ej: 'mage', 'paladin', 'warrior'
        class: selectedCharacter.class,    // ← ej: 'Wizard', 'Paladin', 'Fighter'
    }
});
```

Si `avatarId` se guarda como `'paladin'` y `ModernPixelAvatar` lo busca en `TYPE_MAP`, encontrará `'paladin' → 'paladin'` y renderizará el paladín correctamente.

---

# MEJORA 3 — Banners Town Square (PlayableWorld.jsx)
## Diagnóstico: Banner como rectángulo rojo plano

En la imagen 4 (Town Square, zona norte), el banner aparece como un **rectángulo rojo sólido** sin forma de estandarte. El código actual:

```jsx
// Implementación actual — solo una forma clipPath básica:
<div className="w-9 h-16 flex items-center justify-center text-white text-lg shadow-lg"
    style={{ backgroundColor: dec.color, clipPath: 'polygon(0 0,100% 0,100% 82%,50% 100%,0 82%)' }}>
    {dec.icon}
</div>
```

**Problema:** El emoji `{dec.icon}` ('⚔', '✦', '★') no se renderiza de forma consistente pixel art, y el clipPath es muy grueso visualmente.

### Fix — Reemplazar el renderer del banner con SVG pixel art

En `src/components/dashboard/world/PlayableWorld.jsx`, reemplazar el bloque `if (dec.type === 'banner')`:

```jsx
if (dec.type === 'banner') {
    const bannerColor = dec.color || '#7c3aed';
    // Calcular color más oscuro para detalles
    const darkColor = bannerColor.replace(/#/, '');
    
    // Elegir el icono SVG según dec.icon
    const iconPath = (() => {
        switch(dec.icon) {
            case '⚔': // Espadas cruzadas
                return (
                    <>
                        <rect x="3" y="3" width="1" height="6" fill="white" transform="rotate(45 5 6)"/>
                        <rect x="3" y="3" width="1" height="6" fill="white" transform="rotate(-45 5 6)"/>
                        <rect x="2" y="5" width="6" height="1" fill="white" transform="rotate(45 5 6)"/>
                        <rect x="2" y="5" width="6" height="1" fill="white" transform="rotate(-45 5 6)"/>
                    </>
                );
            case '★': // Estrella
                return (
                    <>
                        <rect x="4" y="1" width="2" height="3" fill="#fbbf24"/>
                        <rect x="2" y="3" width="6" height="2" fill="#fbbf24"/>
                        <rect x="3" y="5" width="4" height="1" fill="#fbbf24"/>
                        <rect x="2" y="6" width="2" height="2" fill="#fbbf24"/>
                        <rect x="6" y="6" width="2" height="2" fill="#fbbf24"/>
                    </>
                );
            case '✦': // Diamante
            default:
                return (
                    <>
                        <rect x="4" y="1" width="2" height="2" fill="#fbbf24"/>
                        <rect x="3" y="3" width="4" height="2" fill="#fbbf24"/>
                        <rect x="2" y="5" width="6" height="2" fill="#fbbf24"/>
                        <rect x="3" y="7" width="4" height="2" fill="#fbbf24"/>
                        <rect x="4" y="9" width="2" height="1" fill="#fbbf24"/>
                    </>
                );
        }
    })();

    return (
        <div
            key={`dec_${i}`}
            className="absolute flex flex-col items-center pointer-events-none"
            style={{ left: dec.x, top: dec.y, transform: 'translate(-50%, 0)', zIndex: 5 }}
        >
            {/* Barra horizontal de soporte */}
            <div className="w-14 h-2 rounded-full shadow-md" style={{ backgroundColor: '#5c3a1e' }} />
            {/* Poste vertical */}
            <div className="w-2 h-3 -mt-1" style={{ backgroundColor: '#3d2210' }} />
            {/* Estandarte SVG pixel art */}
            <svg
                width={44}
                height={64}
                viewBox="0 0 11 16"
                shapeRendering="crispEdges"
                style={{
                    imageRendering: 'pixelated',
                    filter: `drop-shadow(0 2px 6px ${bannerColor}60)`,
                    marginTop: -4
                }}
            >
                {/* Cuerpo del estandarte con forma de punta */}
                <rect x="0" y="0" width="11" height="12" fill={bannerColor}/>
                {/* Punta inferior */}
                <rect x="1" y="12" width="9" height="1" fill={bannerColor}/>
                <rect x="2" y="13" width="7" height="1" fill={bannerColor}/>
                <rect x="3" y="14" width="5" height="1" fill={bannerColor}/>
                <rect x="4" y="15" width="3" height="1" fill={bannerColor}/>
                {/* Borde superior más claro (highlight) */}
                <rect x="0" y="0" width="11" height="1" fill="rgba(255,255,255,0.3)"/>
                {/* Borde izquierdo highlight */}
                <rect x="0" y="0" width="1" height="12" fill="rgba(255,255,255,0.15)"/>
                {/* Borde derecho sombra */}
                <rect x="10" y="0" width="1" height="12" fill="rgba(0,0,0,0.25)"/>
                {/* Icono centrado */}
                <g transform="translate(1, 1)">
                    {iconPath}
                </g>
            </svg>
            {/* Sombra bajo el estandarte */}
            <div className="w-8 h-1.5 bg-black/20 rounded-full blur-sm -mt-1" />
        </div>
    );
}
```

### Actualizar posición de banners en MapData.js

Los banners actuales están en `y: 40` (zona norte, muy arriba). Para que se vean mejor y encima del tile de suelo:

```js
// En MapData.js → townSquare.decorations
// ANTES:
{ type: 'banner', x: 320, y: 40, color: '#7c3aed', icon: '⚔' },
{ type: 'banner', x: 800, y: 40, color: '#fbbf24', icon: '✦' },
{ type: 'banner', x: 1120, y: 40, color: '#dc2626', icon: '★' },

// DESPUÉS (ajustar y a la pared norte, bajando un poco):
{ type: 'banner', x: 320,  y: 50, color: '#7c3aed', icon: '⚔' },
{ type: 'banner', x: 800,  y: 50, color: '#7c3aed', icon: '✦' },
{ type: 'banner', x: 1120, y: 50, color: '#7c3aed', icon: '★' },
// Todos violeta para coherencia con la marca Taskoria
// O bien:
{ type: 'banner', x: 320,  y: 50, color: '#7c3aed', icon: '⚔' },  // violeta - espada
{ type: 'banner', x: 800,  y: 50, color: '#fbbf24', icon: '✦' },  // dorado - emblema
{ type: 'banner', x: 1120, y: 50, color: '#dc2626', icon: '★' },  // rojo - estrella
```

---

## Resumen de los 3 archivos a modificar

| # | Mejora | Archivo | Cambio |
|---|--------|---------|--------|
| 1 | Wild Sanctuary | `PetSanctuaryView.jsx` | Fondo nocturno + colinas CSS + flores SVG + partículas nítidas + ModernPixelPet |
| 2 | Family Selector | `ProfileSelection.jsx` | PixelAvatar → ModernPixelAvatar + fallback chain más robusto |
| 3 | Banners Town Square | `PlayableWorld.jsx` + `MapData.js` | Renderer SVG pixel art completo para banners |
