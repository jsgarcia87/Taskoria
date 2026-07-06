# Plan de animaciones — Taskoria + Motion

> Objetivo: llevar Taskoria de "tiene animaciones" a "responde como un producto cuidado" con **5 movimientos MVP**, usando [motion](https://motion.dev) (v11+, React). Sin tocar `PlayableWorld` (canvas/60fps intocable).

## 🧭 Principio rector — sutil y elegante

> **La diferencia entre algo cuidado y algo genérico se nota en la suavidad, no en la cantidad de efectos.**

- ✅ Cross-fades, layout morphs, springs suaves, count-ups discretos, glow ambient, hover/press con peso físico.
- ❌ Partículas explosivas, confetti, screen-shake, flashes blancos, sonidos épicos por defecto.
- **Spring por defecto:** `stiffness: 320, damping: 32` (respuesta suave, no bouncy).
- **Duraciones cortas:** 180-260ms para transiciones de UI, 500-800ms para count-ups y bars.
- Si dudas entre sutil y más notable → sutil siempre.

---

## 0 · Setup (una sola vez)

### 0.1 · Instalar

```bash
npm install motion
```

### 0.2 · Config global — `src/main.jsx` o `App.jsx` raíz

Envuelve tu árbol con `<MotionConfig>` para (a) respetar `prefers-reduced-motion` del sistema y (b) fijar un spring por defecto coherente para toda la app.

```jsx
// src/App.jsx — envolver el return final de <App />
import { MotionConfig } from 'motion/react';

// Envolver GameProvider / ProfileSelection / LandingPage:
<MotionConfig
  reducedMotion="user"
  transition={{ type: 'spring', stiffness: 320, damping: 32 }}
>
  {/* ...contenido App... */}
</MotionConfig>
```

**⚠️ Nota sobre `prefers-reduced-motion`:** en `index.css:383` ya tienes un override CSS que fuerza `animation-duration: 0.01ms`. Ese override solo afecta animaciones CSS — no toca las de Motion. Con `reducedMotion="user"` Motion también las respeta. Compatibilidad garantizada.

---

## 1 · Task Completion — feedback discreto ✓

**Dónde:** `src/components/dashboard/TaskList.jsx`.

**Filosofía:** completar una quest debe sentirse **satisfactorio pero silencioso**. Un checkbox que confirma con peso, la tarea que se desvanece con calma y la lista que se recoloca sola. El "premio" real va al HUD (gold/XP tickers, ver bloque #4), no a un show en pantalla.

**Descartado por el principio de sutileza:**
- ❌ Burst de partículas doradas explosivas.
- ❌ Ring ripple desde el punto de click.
- ❌ Sonidos de celebración por defecto.

### 1.1 · Checkbox con spring suave

En `TaskList.jsx` (línea ~22):

```jsx
import { motion, AnimatePresence } from 'motion/react';

<motion.button
  onClick={(e) => onComplete(task.id, e.clientX, e.clientY)}
  whileHover={{ scale: 1.08 }}
  whileTap={{ scale: 0.92 }}
  transition={{ type: 'spring', stiffness: 340, damping: 26 }}
  className="mt-0.5 w-5 h-5 rounded-md border-2 border-gray-500 hover:border-rpg-green hover:bg-rpg-green/20 flex items-center justify-center shrink-0"
  title="Complete Quest"
>
  <div className="w-2.5 h-2.5 rounded-sm bg-transparent group-hover:bg-rpg-green transition-colors" />
</motion.button>
```

`stiffness: 340 / damping: 26` es notablemente más contenido que un spring "juguetón". Se siente firme, no rebota.

### 1.2 · Slide-out elegante de la tarea + reflow con spring

Envolver el listado en `<AnimatePresence>`:

```jsx
<AnimatePresence mode="popLayout">
  {tasks.map((task) => (
    <motion.div
      key={task.id}
      layout
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{
        opacity: 0,
        x: 24,
        transition: { duration: 0.28, ease: [0.22, 1, 0.36, 1] }
      }}
      transition={{ type: 'spring', stiffness: 300, damping: 32 }}
    >
      <TaskRow task={task} ... />
    </motion.div>
  ))}
</AnimatePresence>
```

**Notas:**
- Salida corta (24px, no 60): la tarea "se retira" en lugar de "salir volando".
- `layout` hace que las tareas de debajo suban con spring — es lo que se siente premium sin ser vistoso.
- El burst de partículas queda documentado pero **no se implementa**. Si en el futuro se quiere un guiño mínimo, prever un **único destello dorado sutil** (un `motion.div` fadeando en la posición del check, no 12 partículas).

---

## 2 · Level Up Cinematic 👑

**Dónde:** `src/components/common/LevelUpModal.jsx` — reescritura completa.

**Secuencia:**
1. Flash blanco (200ms).
2. Glow púrpura que se expande desde el centro.
3. "LEVEL {N}" con letras stagger-in (spring bounce).
4. Stats aparecen una a una con count-up (delay 80ms cada una).
5. Confetti pixel-art dorado cayendo.
6. Botón "Continue Journey" con pulse.

```jsx
import { useEffect } from 'react';
import { motion, useAnimate, stagger } from 'motion/react';
import { ChevronUp } from 'lucide-react';
import { playLevelUpSound } from '../../utils/sound';
import { NumberTicker } from './NumberTicker';

const LEVEL_TEXT = 'LEVEL';

const LevelUpModal = ({ data, onClose }) => {
  const [scope, animate] = useAnimate();

  useEffect(() => {
    try { playLevelUpSound(); } catch (_) {}

    const run = async () => {
      // 1. Flash blanco
      animate('.flash', { opacity: [0, 0.7, 0] }, { duration: 0.5, ease: 'easeOut' });
      // 2. Glow radial
      animate('.glow', { scale: [0, 3], opacity: [0.9, 0] }, { duration: 0.8, ease: 'easeOut' });
      // 3. Letras stagger
      await animate(
        '.title-char',
        { opacity: 1, y: 0 },
        { delay: stagger(0.05, { startDelay: 0.25 }), type: 'spring', stiffness: 500, damping: 15 }
      );
      // 4. Stats stagger
      await animate(
        '.stat-card',
        { opacity: 1, y: 0, scale: 1 },
        { delay: stagger(0.07), type: 'spring', stiffness: 400, damping: 22 }
      );
    };
    run();
  }, [animate]);

  if (!data) return null;

  return (
    <div ref={scope} className="fixed inset-0 z-[200] flex items-center justify-center bg-black/85 backdrop-blur-md overflow-hidden">
      {/* Flash blanco full-screen */}
      <div className="flash absolute inset-0 bg-white pointer-events-none" style={{ opacity: 0 }} />

      {/* Glow radial expansivo */}
      <div
        className="glow absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-purple-500 rounded-full blur-3xl pointer-events-none"
        style={{ scale: 0, opacity: 0.9 }}
      />

      {/* Confetti dorado */}
      <Confetti />

      {/* Carta */}
      <motion.div
        initial={{ scale: 0.85, opacity: 0, y: 30 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 400, damping: 25, delay: 0.15 }}
        className="relative z-10 w-full max-w-sm bg-rpg-panel/80 border border-white/10 rounded-3xl p-8 backdrop-blur-xl shadow-2xl flex flex-col items-center"
      >
        <div className="text-gray-400 font-bold uppercase tracking-[0.3em] text-[10px] mb-1">Ascension</div>

        <div className="flex text-5xl font-display font-light text-white tracking-widest mb-2">
          {LEVEL_TEXT.split('').map((ch, i) => (
            <span
              key={`c-${i}`}
              className="title-char inline-block"
              style={{ opacity: 0, transform: 'translateY(24px)' }}
            >
              {ch === ' ' ? ' ' : ch}
            </span>
          ))}
          <span
            className="title-char inline-block ml-3 font-bold text-rpg-gold text-shadow-glow"
            style={{ opacity: 0, transform: 'translateY(24px)' }}
          >
            {data.level}
          </span>
        </div>

        <div className="flex items-center gap-4 w-full justify-center my-6">
          <div className="h-px w-16 bg-gradient-to-r from-transparent to-white/20" />
          <div className="w-2 h-2 rounded-full border border-rpg-gold shadow-[0_0_10px_rgba(251,191,36,0.6)]" />
          <div className="h-px w-16 bg-gradient-to-l from-transparent to-white/20" />
        </div>

        <div className="text-xs text-gray-500 uppercase tracking-widest font-bold mb-4">Stat Increases</div>

        <div className="w-full grid grid-cols-3 gap-3">
          {['str', 'int', 'dex', 'con', 'will', 'cha'].map((stat) => (
            <div
              key={stat}
              className="stat-card bg-black/40 border border-white/5 rounded-xl p-3 flex flex-col items-center"
              style={{ opacity: 0, transform: 'translateY(14px) scale(0.92)' }}
            >
              <span className="text-gray-500 text-[9px] font-bold uppercase tracking-widest">{stat}</span>
              <div className="text-white font-mono text-lg mt-1 flex items-center gap-1">
                <NumberTicker value={data.stats?.[stat] || 10} duration={0.7} />
                <ChevronUp size={12} className="text-green-400" />
              </div>
            </div>
          ))}
        </div>

        <motion.button
          onClick={onClose}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.97 }}
          transition={{ type: 'spring', stiffness: 500, damping: 22 }}
          className="mt-8 w-full bg-white/5 hover:bg-white/10 border border-white/10 py-3 text-sm text-gray-300 hover:text-white font-bold uppercase tracking-widest rounded-xl"
        >
          Continue Journey
        </motion.button>
      </motion.div>
    </div>
  );
};

// Confetti dorado pixel-art
function Confetti() {
  const COUNT = 36;
  const COLORS = ['#FFD700', '#8b5cf6', '#facc15', '#f97316'];
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {Array.from({ length: COUNT }).map((_, i) => {
        const startX = Math.random() * window.innerWidth;
        const drift = (Math.random() - 0.5) * 200;
        const size = 6 + Math.random() * 6;
        const delay = Math.random() * 0.6;
        const dur = 2 + Math.random() * 1.2;
        return (
          <motion.div
            key={i}
            initial={{ x: 0, y: -30, rotate: 0, opacity: 1 }}
            animate={{ x: drift, y: window.innerHeight + 40, rotate: Math.random() * 720, opacity: 0 }}
            transition={{ duration: dur, delay, ease: 'easeIn' }}
            style={{
              position: 'absolute',
              left: startX,
              top: 0,
              width: size,
              height: size,
              background: COLORS[i % COLORS.length],
              imageRendering: 'pixelated',
              boxShadow: `0 0 5px ${COLORS[i % COLORS.length]}`,
            }}
          />
        );
      })}
    </div>
  );
}

export default LevelUpModal;
```

---

## 3 · View Transitions + BottomNav Morph 🌊

### 3.1 · Cross-fade en cambios de vista — `App.jsx`

Envolver el bloque de `activeView === 'home' && …` con `AnimatePresence mode="wait"`:

```jsx
import { AnimatePresence, motion } from 'motion/react';

// dentro de GameContent, sustituir todo el bloque de vistas:
<AnimatePresence mode="wait">
  <motion.div
    key={activeView}
    initial={{ opacity: 0, y: 6 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -6 }}
    transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
    className="col-span-12 contents"
  >
    {activeView === 'home' && <Dashboard setActiveView={setActiveView} />}
    {activeView === 'profile' && (
      <div className="col-span-12 lg:col-span-10 lg:col-start-2"><CharacterSheet /></div>
    )}
    {activeView === 'party' && (
      <div className="col-span-12 lg:col-span-10 lg:col-start-2"><PartyView currentUser={currentUser} /></div>
    )}
    {/* ...resto igual... */}
  </motion.div>
</AnimatePresence>
```

**Feel:** `y: 6` (no `y: 10`) + `duration: 0.2` = transición **casi imperceptible pero presente**. El contenido "se desliza en su sitio", no "aterriza desde arriba".

**⚠️ Nota:** `contents` mantiene el grid layout de Tailwind (`grid grid-cols-12`). Si el fade se ve raro, alternativa: envolver solo el contenido, no el grid parent.

### 3.2 · BottomNav píldora con `layoutId` — `src/components/common/BottomNav.jsx`

Este es probablemente el cambio más "wow" de todo el MVP. La píldora dorada del tab activo hace **morph** desde su posición anterior a la nueva con spring.

```jsx
import React from 'react';
import { motion } from 'motion/react';
import PixelIcon from './PixelIcon';

export const NavItem = ({ iconName, label, active, onClick }) => (
  <motion.button
    onClick={onClick}
    whileTap={{ scale: 0.94 }}
    transition={{ type: 'spring', stiffness: 340, damping: 28 }}
    className="relative flex flex-col items-center justify-center p-2 min-w-[64px] rounded-xl"
  >
    {/* Píldora activa con layoutId — hace morph entre tabs */}
    {active && (
      <motion.div
        layoutId="active-nav-pill"
        className="absolute inset-0 bg-gradient-to-br from-rpg-gold/20 to-orange-500/20 ring-1 ring-rpg-gold/50 rounded-xl"
        transition={{ type: 'spring', stiffness: 320, damping: 34 }}
      />
    )}

    {/* Dot superior — también con layoutId */}
    {active && (
      <motion.div
        layoutId="active-nav-dot"
        className="absolute -top-1 w-1 h-1 bg-rpg-gold rounded-full shadow-glow-gold"
        transition={{ type: 'spring', stiffness: 320, damping: 34 }}
      />
    )}

    <div className={`relative z-10 p-2 rounded-full transition-all duration-200 ${active ? 'text-rpg-gold' : 'text-gray-400 group-hover:text-white'}`}>
      <PixelIcon name={iconName} size={active ? 24 : 20} className={active ? 'drop-shadow-glow' : ''} />
    </div>

    {active && (
      <motion.span
        layoutId="active-nav-label"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="absolute -bottom-4 text-[10px] font-bold tracking-wider text-rpg-gold z-10 whitespace-nowrap"
      >
        {label}
      </motion.span>
    )}
  </motion.button>
);
```

**Feel:** `damping: 34` sobre `28-30`. La píldora "planea" al nuevo tab en vez de rebotar. Es el detalle que separa "morph iOS" de "morph juguetón".

**Clave:** el `layoutId="active-nav-pill"` compartido entre todos los NavItems hace que Motion **anime la posición** de la píldora entre tabs, en vez de mount/unmount. Feel nativo.

---

## 4 · Number Tickers + Progress Bars con "juice" 🎲

**Dónde:** dos componentes reutilizables nuevos + reemplazo en HUD/CharacterSheet.

### 4.1 · `src/components/common/NumberTicker.jsx`

```jsx
import { useEffect } from 'react';
import { motion, useMotionValue, useTransform, animate, useReducedMotion } from 'motion/react';

export function NumberTicker({
  value,
  duration = 0.9,
  formatter = (v) => Math.round(v).toLocaleString(),
  className = '',
}) {
  const shouldReduce = useReducedMotion();
  const motionValue = useMotionValue(value);
  const display = useTransform(motionValue, formatter);

  useEffect(() => {
    if (shouldReduce) {
      motionValue.set(value);
      return;
    }
    const controls = animate(motionValue, value, {
      duration,
      ease: [0.22, 1, 0.36, 1],
    });
    return controls.stop;
  }, [value, duration, motionValue, shouldReduce]);

  return <motion.span className={className}>{display}</motion.span>;
}
```

**Uso:** en el HUD dorado, XP, level, stats de CharacterSheet:

```jsx
// Ejemplo Layout_v2 — HUD gold:
<span className="text-rpg-gold font-bold">
  <NumberTicker value={character.gold} />
</span>

// Ejemplo CharacterSheet — stat:
<NumberTicker value={character.stats.str} className="text-xl font-mono text-white" />
```

### 4.2 · `src/components/common/StatBar.jsx`

Reemplaza los `<div style={{width: X%}}>` lineales por spring animado con glow-pulse al 100%.

```jsx
import { useEffect, useRef } from 'react';
import { motion, useSpring, useTransform, useMotionValue } from 'motion/react';

const COLORS = {
  hp:  { grad: 'from-red-600 to-red-400',       glow: 'rgba(239,68,68,0.5)'  },
  xp:  { grad: 'from-amber-500 to-yellow-400',  glow: 'rgba(245,158,11,0.6)' },
  bond:{ grad: 'from-rose-500 to-pink-400',     glow: 'rgba(244,63,94,0.5)'  },
  mp:  { grad: 'from-blue-600 to-blue-400',     glow: 'rgba(59,130,246,0.5)' },
};

export function StatBar({ current, max, kind = 'hp', height = 'h-4' }) {
  const pctTarget = Math.max(0, Math.min(100, (current / max) * 100));
  const raw = useMotionValue(pctTarget);
  const spring = useSpring(raw, { stiffness: 120, damping: 20, mass: 0.6 });
  const width = useTransform(spring, (v) => `${v}%`);
  const prev = useRef(pctTarget);
  const barRef = useRef(null);

  useEffect(() => {
    raw.set(pctTarget);
    // Celebrate al llegar al 100%: pulse dorado
    if (pctTarget >= 100 && prev.current < 100 && barRef.current) {
      barRef.current.animate(
        [
          { boxShadow: '0 0 10px currentColor' },
          { boxShadow: '0 0 30px #FFD700, 0 0 60px #FFD700' },
          { boxShadow: '0 0 10px currentColor' },
        ],
        { duration: 700, easing: 'ease-out' }
      );
    }
    prev.current = pctTarget;
  }, [pctTarget, raw]);

  const c = COLORS[kind] || COLORS.hp;

  return (
    <div className={`w-full ${height} bg-black/40 rounded-full overflow-hidden`}>
      <motion.div
        ref={barRef}
        style={{ width, boxShadow: `0 0 10px ${c.glow}` }}
        className={`h-full bg-gradient-to-r ${c.grad}`}
      />
    </div>
  );
}
```

**Uso — CharacterSheet.jsx:297** (HP bar) y `:310` (XP bar):

```jsx
// Antes:
<div className="h-full bg-gradient-to-r from-red-600 to-red-400 shadow-[0_0_10px_rgba(239,68,68,0.5)] transition-all duration-500 ease-out" style={{ width: `${hpPct}%` }} />

// Después:
<StatBar current={character.hp.current} max={character.hp.max} kind="hp" />
```

---

## 5 · Springs globales en botones 🎮

**Dónde:** wrapper reutilizable + migración progresiva.

### 5.1 · `src/components/common/PressButton.jsx`

```jsx
import { forwardRef } from 'react';
import { motion } from 'motion/react';

/**
 * Botón con spring físico. Drop-in replacement de <button>.
 * Aplica whileTap/whileHover coherentes con el resto de la app.
 */
export const PressButton = forwardRef(function PressButton(
  { children, className = '', disabled, ...rest },
  ref
) {
  return (
    <motion.button
      ref={ref}
      whileHover={disabled ? undefined : { scale: 1.02 }}
      whileTap={disabled ? undefined : { scale: 0.95 }}
      transition={{ type: 'spring', stiffness: 500, damping: 22 }}
      disabled={disabled}
      className={className}
      {...rest}
    >
      {children}
    </motion.button>
  );
});
```

### 5.2 · Migración progresiva

**No hace falta migrar todo de golpe.** Empieza por los botones más visibles:
- `Continue Journey` en LevelUpModal (ya está en el snippet #2).
- Botones del **BottomNav** (ya en snippet #3.2).
- Botones del **Shop** (comprar, equipar).
- **Central Add Quest** de BottomNav.jsx:61 → `active:scale-95` ya funciona pero con spring físico se siente mejor.
- Botones `glass-btn` / `glass-btn-primary` conservan sus estilos CSS.

Ejemplo de reemplazo mecánico:

```jsx
// Antes:
<button
  onClick={handleBuy}
  className="glass-btn-primary px-6 py-3"
>
  Buy for {price} Gold
</button>

// Después:
<PressButton
  onClick={handleBuy}
  className="glass-btn-primary px-6 py-3"
>
  Buy for {price} Gold
</PressButton>
```

---

## 📋 Checklist de integración

- [ ] `npm install motion`
- [ ] Añadir `<MotionConfig reducedMotion="user" transition={{ type: 'spring', stiffness: 320, damping: 32 }}>` alrededor de App en `src/App.jsx`.
- [ ] Actualizar `TaskList.jsx` con `motion.button` (spring suave) + `AnimatePresence popLayout` con `layout` prop.
- [ ] Reescribir `src/components/common/LevelUpModal.jsx` con secuencia orquestada minimalista.
- [ ] Envolver switch de `activeView` en `App.jsx:183-278` con `<AnimatePresence mode="wait">`.
- [ ] Reescribir `NavItem` en `BottomNav.jsx` con `layoutId="active-nav-pill"`.
- [ ] Crear `src/components/common/NumberTicker.jsx`.
- [ ] Crear `src/components/common/StatBar.jsx` y reemplazar barras en `CharacterSheet.jsx:297,310,622,633,644,654`.
- [ ] Crear `src/components/common/PressButton.jsx` y migrar botones clave (LevelUp Continue, Shop CTAs, BottomNav Add).
- [ ] Probar con Chrome DevTools → Rendering → Emulate CSS media `prefers-reduced-motion` para verificar el gating.

---

## 💡 Notas de "feel" — tuning consistente

Toda la app respira con **el mismo lenguaje de springs**. Esto es lo que se percibe como "cuidado":

| Contexto | Stiffness | Damping | Sensación |
|----------|-----------|---------|-----------|
| MotionConfig por defecto | 320 | 32 | Suave, sin overshoot |
| BottomNav píldora morph | 320 | 34 | Planea, no rebota |
| PressButton (hover/tap) | 340 | 28 | Responde con peso |
| Task checkbox | 340 | 26 | Firme al pulsar |
| LevelUp letras stagger | 320 | 32 | Aterrizan, no caen |
| LevelUp modal entry | 300 | 34 | Se asienta |
| Cross-fade view | duration 0.2 | ease [0.22, 1, 0.36, 1] | Casi imperceptible |

**Regla general:** si dudas si un valor es "demasiado bouncy", sube el `damping` 2-4 puntos y vuelve a probar. Es más fácil detectar exceso de rebote que exceso de rigidez.

**Test rápido de calidad:** graba un GIF de 3 segundos de la app tras aplicar los cambios. Si el GIF se puede confundir con una web premium (Linear, Stripe, Framer), vamos bien. Si se parece a un juego de móvil freemium, algún parámetro está mal calibrado.

---

## 🚫 Fuera de scope MVP (fase 2)

Descartado también por principio de sutileza:

- ❌ **Boss damage feedback showy** — screen-shake y damage numbers voladores. Alternativa fase 2: HP bar con flash rojo sutil + shake mínimo del contenedor (2-3px, 150ms).
- ❌ **Cards con tilt 3D** — puede quedar "gimmicky". Alternativa: hover sutil con `translateY(-2px)` + sombra que se expande.
- ❌ **Profile selection avatares stagger + hover tilt** — el stagger sí encaja con el principio, el tilt no.
- ❌ **Modal backdrop blur ramp** — ya incluido en LevelUp, replicar en otros modales.
- ❌ **Achievement ribbon** — decidir en fase 2 si se hace sutil (slide-in lateral + fade) o se descarta.
- ❌ **Screensaver parallax** — pendiente de revisar el screensaver actual.

Regla para fase 2: **cada efecto nuevo debe pasar el test "¿esto lo haría Linear/Stripe?"** antes de implementarse.
