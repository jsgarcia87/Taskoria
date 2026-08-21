import { useEffect, useState, useCallback } from 'react';

/**
 * usePWAInstall — shared PWA install state.
 *
 * `beforeinstallprompt` fires exactly once and only if we call preventDefault
 * synchronously. If it lands before any component mounts (or after one has
 * unmounted), a per-component listener would miss it. This module captures
 * the event at import time and any hook consumer gets notified — so both the
 * floating banner and the Settings block can offer to install independently.
 */

let deferredPrompt = null;
const listeners = new Set();

const notify = () => listeners.forEach(fn => fn());

const isStandalone = () =>
    typeof window !== 'undefined' &&
    (window.matchMedia?.('(display-mode: standalone)').matches ||
     window.navigator?.standalone === true);

if (typeof window !== 'undefined') {
    window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault();
        deferredPrompt = e;
        notify();
    });
    window.addEventListener('appinstalled', () => {
        deferredPrompt = null;
        notify();
    });
}

export function usePWAInstall() {
    // Force a re-render when the shared state changes
    const [, setTick] = useState(0);

    useEffect(() => {
        const fn = () => setTick(t => t + 1);
        listeners.add(fn);
        return () => listeners.delete(fn);
    }, []);

    const install = useCallback(async () => {
        if (!deferredPrompt) return null;
        try {
            deferredPrompt.prompt();
            const { outcome } = await deferredPrompt.userChoice;
            if (outcome === 'accepted') {
                deferredPrompt = null;
                notify();
            }
            return outcome;
        } catch {
            return null;
        }
    }, []);

    return {
        canInstall: !!deferredPrompt && !isStandalone(),
        isInstalled: isStandalone(),
        install,
    };
}
