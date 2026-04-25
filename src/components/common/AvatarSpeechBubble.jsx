import React, { useState, useEffect, useRef } from 'react';
import PixelIcon from './PixelIcon';

// Default idle quotes
const IDLE_QUOTES = [
    "What are you waiting for?",
    "I'm falling asleep...",
    "Let's do some quests!",
    "I'm bored...",
    "My sword needs action.",
    "Shall we keep working?"
];

// Default greeting quotes
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
    const idleTimerRef = useRef(null);
    const hideTimerRef = useRef(null);

    // Combine custom quotes with defaults for more variety if provided
    const idlePool = customQuotes.length > 0 ? customQuotes : IDLE_QUOTES;

    const showQuote = (quoteText, duration = 4000) => {
        setCurrentQuote(quoteText);
        setIsVisible(true);

        if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
        hideTimerRef.current = setTimeout(() => {
            setIsVisible(false);
        }, duration);
    };

    const resetIdleTimer = () => {
        // Hide on activity
        setIsVisible(false);

        if (idleTimerRef.current) clearTimeout(idleTimerRef.current);

        idleTimerRef.current = setTimeout(() => {
            // Pick random idle quote
            const randomQuote = idlePool[Math.floor(Math.random() * idlePool.length)];
            showQuote(randomQuote, 5000); // Show longer for idle
        }, idleTimeMs);
    };

    useEffect(() => {
        // Initial greeting
        const randomGreeting = GREETING_QUOTES[Math.floor(Math.random() * GREETING_QUOTES.length)];
        setTimeout(() => showQuote(randomGreeting, 3000), 500);

        // Event listeners for activity
        const events = ['mousemove', 'keydown', 'click', 'scroll'];
        events.forEach(event => window.addEventListener(event, resetIdleTimer));

        // Start initial idle timer
        resetIdleTimer();

        return () => {
            events.forEach(event => window.removeEventListener(event, resetIdleTimer));
            if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
            if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
        };
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    // Optional: allow child to be clicked to trigger a manual quote
    const handleManualPoke = () => {
        const pokeQuotes = ["Hey!", "What's up?", "Leave me alone...", "Equip me well!"];
        showQuote(pokeQuotes[Math.floor(Math.random() * pokeQuotes.length)]);
    };

    return (
        <div className="relative inline-block cursor-help" onClick={handleManualPoke}>
            {children}

            {/* Speech Bubble */}
            <div
                className={`absolute bottom-full left-1/2 -translate-x-1/2 mb-4 w-max max-w-[150px] transition-all duration-300 pointer-events-none z-50 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}`}
            >
                <div className="bg-white text-black font-pixel text-[10px] sm:text-xs px-3 py-2 border-4 border-black border-dashed rounded-lg shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] text-center leading-snug">
                    {currentQuote}
                </div>
                {/* Pointer tail */}
                <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[8px] border-t-black mt-0.5"></div>
                <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-l-[4px] border-l-transparent border-r-[4px] border-r-transparent border-t-[6px] border-t-white mt-0.5"></div>
            </div>
        </div>
    );
};

export default AvatarSpeechBubble;
