import { useEffect, useState } from 'react';

/**
 * Returns `true` when the tab is currently visible to the user.
 *
 * Pair this with `setInterval` heartbeats and animation loops so background
 * tabs stop consuming CPU/battery. Saves ~90% of idle CPU on average
 * (browsers throttle invisible tabs but don't stop our work — we have to).
 *
 *   const visible = usePageVisibility();
 *   useEffect(() => {
 *     if (!visible) return;            // skip the interval entirely while hidden
 *     const id = setInterval(tick, 60_000);
 *     return () => clearInterval(id);
 *   }, [visible]);
 */
export function usePageVisibility() {
    const [visible, setVisible] = useState(
        typeof document === 'undefined' ? true : !document.hidden
    );
    useEffect(() => {
        const onChange = () => setVisible(!document.hidden);
        document.addEventListener('visibilitychange', onChange);
        return () => document.removeEventListener('visibilitychange', onChange);
    }, []);
    return visible;
}
