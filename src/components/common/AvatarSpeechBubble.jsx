import React, { useState, useEffect, useRef, useLayoutEffect } from 'react';
import { createPortal } from 'react-dom';

const IDLE_QUOTES = [
    "What are you waiting for?",
    "I'm falling asleep...",
    "Let's do some quests!",
    "I'm bored...",
    "My sword needs action.",
    "Shall we keep working?"
];

const GREETING_QUOTES = [
    "Hello!",
    "I'm ready!",
    "Let's do this!",
    "Go for it!",
    "Welcome back!"
];

const AvatarSpeechBubble = ({ children, customQuotes = [], idleTimeMs = 30000 }) => {
    const [currentQuote, setCurrentQuote] = useState('');
    const [isVisible, setIsVisible] = useState(false);
    const [anchorRect, setAnchorRect] = useState(null);
    const idleTimerRef = useRef(null);
    const hideTimerRef = useRef(null);
    const anchorRef = useRef(null);

    const idlePool = customQuotes.length > 0 ? customQuotes : IDLE_QUOTES;

    const updateAnchorRect = () => {
        if (anchorRef.current) {
            const rect = anchorRef.current.getBoundingClientRect();
            if (rect.width > 0 || rect.height > 0) {
                setAnchorRect({ top: rect.top, left: rect.left, width: rect.width, height: rect.height });
            }
        }
    };

    const showQuote = (quoteText, duration = 4000) => {
        updateAnchorRect();
        setCurrentQuote(quoteText);
        setIsVisible(true);

        if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
        hideTimerRef.current = setTimeout(() => {
            setIsVisible(false);
        }, duration);
    };

    const resetIdleTimer = () => {
        if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
        idleTimerRef.current = setTimeout(() => {
            const randomQuote = idlePool[Math.floor(Math.random() * idlePool.length)];
            showQuote(randomQuote, 5000);
        }, idleTimeMs);
    };

    // Measure as soon as the DOM is committed
    useLayoutEffect(() => {
        updateAnchorRect();
        // Re-measure after fonts/sprites settle
        const t1 = setTimeout(updateAnchorRect, 100);
        const t2 = setTimeout(updateAnchorRect, 500);
        return () => { clearTimeout(t1); clearTimeout(t2); };
    }, []);

    useEffect(() => {
        // Initial greeting
        const greetTimer = setTimeout(() => {
            const randomGreeting = GREETING_QUOTES[Math.floor(Math.random() * GREETING_QUOTES.length)];
            showQuote(randomGreeting, 3000);
        }, 800);

        const events = ['mousemove', 'keydown', 'click'];
        events.forEach(event => window.addEventListener(event, resetIdleTimer));
        window.addEventListener('resize', updateAnchorRect);
        window.addEventListener('scroll', updateAnchorRect, true);

        // Observe anchor size changes (sprite finishes loading, layout shifts)
        let ro;
        if (anchorRef.current && typeof ResizeObserver !== 'undefined') {
            ro = new ResizeObserver(updateAnchorRect);
            ro.observe(anchorRef.current);
        }

        resetIdleTimer();

        return () => {
            clearTimeout(greetTimer);
            events.forEach(event => window.removeEventListener(event, resetIdleTimer));
            window.removeEventListener('resize', updateAnchorRect);
            window.removeEventListener('scroll', updateAnchorRect, true);
            if (ro) ro.disconnect();
            if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
            if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
        };
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    const handleManualPoke = (e) => {
        e?.stopPropagation?.();
        const pokeQuotes = ["Hey!", "What's up?", "Leave me alone...", "Equip me well!"];
        showQuote(pokeQuotes[Math.floor(Math.random() * pokeQuotes.length)]);
    };

    const bubbleStyle = {
        position: 'fixed',
        top: anchorRect ? anchorRect.top - 12 : -9999,
        left: anchorRect ? anchorRect.left + anchorRect.width / 2 : -9999,
        transform: 'translate(-50%, -100%)',
        zIndex: 9999,
        pointerEvents: 'none',
        visibility: anchorRect ? 'visible' : 'hidden',
    };

    return (
        <div ref={anchorRef} className="relative inline-block cursor-help" onClick={handleManualPoke}>
            {children}

            {createPortal(
                <div
                    style={bubbleStyle}
                    className={`w-max max-w-[200px] transition-opacity duration-200 ${isVisible ? 'opacity-100' : 'opacity-0'}`}
                >
                    <div className="relative bg-white text-black font-pixel text-[10px] sm:text-xs px-3 py-2 border-4 border-black border-dashed rounded-lg shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] text-center leading-snug">
                        {currentQuote || ' '}
                        <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[8px] border-t-black"></div>
                        <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-l-[4px] border-l-transparent border-r-[4px] border-r-transparent border-t-[6px] border-t-white -mt-[2px]"></div>
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
};

export default AvatarSpeechBubble;
