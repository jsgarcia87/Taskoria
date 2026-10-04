import React, { useState, useEffect, useRef } from 'react';

const IDLE_QUOTES = [
    "What are you waiting for?",
    "I'm falling asleep...",
    "Let's do some quests!",
    "I'm bored...",
    "Shall we keep working?"
];

const GREETING_QUOTES = [
    "Hello!",
    "I'm ready!",
    "Let's do this!",
    "Go for it!",
    "Welcome back!"
];

const POKE_QUOTES = ["Hey!", "What's up?", "Leave me alone...", "Equip me well!"];

const GREETED_KEY = 'taskoria_avatar_greeted';

const INK = '#342c3e';
const GOLD = '#fedf8c';

// Stepped pixel border: four 2px offsets leave the corners notched.
const PIXEL_FRAME = `0 -2px 0 0 ${GOLD}, 0 2px 0 0 ${GOLD}, -2px 0 0 0 ${GOLD}, 2px 0 0 0 ${GOLD}, 4px 4px 0 0 rgba(0,0,0,0.35)`;

const PixelTail = () => (
    <svg
        width="8" height="12" viewBox="0 0 4 6" shapeRendering="crispEdges"
        className="absolute -left-[8px] top-[10px]" style={{ imageRendering: 'pixelated' }}
        aria-hidden="true"
    >
        <rect x="3" y="0" width="1" height="1" fill={GOLD} />
        <rect x="2" y="1" width="1" height="1" fill={GOLD} />
        <rect x="3" y="1" width="1" height="1" fill={INK} />
        <rect x="1" y="2" width="1" height="2" fill={GOLD} />
        <rect x="2" y="2" width="2" height="2" fill={INK} />
        <rect x="2" y="4" width="1" height="1" fill={GOLD} />
        <rect x="3" y="4" width="1" height="1" fill={INK} />
        <rect x="3" y="5" width="1" height="1" fill={GOLD} />
    </svg>
);

/**
 * Dialog box beside the hero's head. Rendered inside the anchor (no portal),
 * so it moves, fades and clips with the stage. `bubbleStyle` places it.
 */
const AvatarSpeechBubble = ({ children, customQuotes = [], idleTimeMs = 30000, bubbleStyle }) => {
    const [currentQuote, setCurrentQuote] = useState('');
    const [isVisible, setIsVisible] = useState(false);
    const idleTimerRef = useRef(null);
    const hideTimerRef = useRef(null);

    const idlePool = customQuotes.length > 0 ? customQuotes : IDLE_QUOTES;

    const showQuote = (quoteText, duration = 4000) => {
        setCurrentQuote(quoteText);
        setIsVisible(true);
        if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
        hideTimerRef.current = setTimeout(() => setIsVisible(false), duration);
    };

    const resetIdleTimer = () => {
        if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
        idleTimerRef.current = setTimeout(() => {
            showQuote(idlePool[Math.floor(Math.random() * idlePool.length)], 5000);
        }, idleTimeMs);
    };

    useEffect(() => {
        // Greet once per browser session, not on every visit to the profile.
        let greetTimer;
        let alreadyGreeted = false;
        try { alreadyGreeted = sessionStorage.getItem(GREETED_KEY) === '1'; } catch (e) { /* storage blocked */ }
        if (!alreadyGreeted) {
            greetTimer = setTimeout(() => {
                showQuote(GREETING_QUOTES[Math.floor(Math.random() * GREETING_QUOTES.length)], 3000);
                try { sessionStorage.setItem(GREETED_KEY, '1'); } catch (e) { /* storage blocked */ }
            }, 900);
        }

        const events = ['mousemove', 'keydown', 'click', 'touchstart'];
        events.forEach(event => window.addEventListener(event, resetIdleTimer, { passive: true }));
        resetIdleTimer();

        return () => {
            clearTimeout(greetTimer);
            events.forEach(event => window.removeEventListener(event, resetIdleTimer));
            if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
            if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
        };
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    const handleManualPoke = (e) => {
        e?.stopPropagation?.();
        showQuote(POKE_QUOTES[Math.floor(Math.random() * POKE_QUOTES.length)]);
    };

    return (
        <div className="relative inline-block cursor-pointer" onClick={handleManualPoke}>
            {children}
            <div
                role="status"
                aria-live="polite"
                className={`absolute z-20 pointer-events-none w-max max-w-[9.5rem] sm:max-w-[12rem] transition-[opacity,transform] duration-200 ease-out ${isVisible
                    ? 'opacity-100 translate-y-0'
                    : 'opacity-0 translate-y-1'}`}
                style={bubbleStyle}
            >
                <div
                    className="relative px-3 py-2 text-xs font-medium leading-snug"
                    style={{ backgroundColor: INK, color: '#f6eedb', boxShadow: PIXEL_FRAME }}
                >
                    {currentQuote || ' '}
                    <PixelTail />
                </div>
            </div>
        </div>
    );
};

export default AvatarSpeechBubble;
