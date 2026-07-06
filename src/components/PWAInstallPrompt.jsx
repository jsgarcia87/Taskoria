import React, { useEffect, useState } from 'react';
import { Download, X, Sparkles } from 'lucide-react';
import { useGame } from '../context/GameContext';

/**
 * PWAInstallPrompt — smart prompt to add Taskoria to the home screen.
 *
 * Listens for the standard `beforeinstallprompt` event and stashes it. The
 * banner only renders when ALL of these are true:
 *   • The browser supports installation (event was captured)
 *   • The user is past Level 1 (showing engagement — avoids prompt fatigue)
 *   • They haven't already installed (display-mode standalone check)
 *   • They haven't dismissed the prompt this session
 *
 * Persists the dismissal flag in localStorage under `taskoria_pwa_dismissed_at`
 * so a user who said "no" doesn't get spammed every visit.
 */
const DISMISS_KEY = 'taskoria_pwa_dismissed_at';
const RE_PROMPT_DAYS = 14; // re-show after N days if they dismissed

const PWAInstallPrompt = () => {
    const { state } = useGame();
    const [deferred, setDeferred] = useState(null);
    const [visible, setVisible] = useState(false);
    const character = state?.character;

    useEffect(() => {
        // Already installed → never prompt
        if (window.matchMedia?.('(display-mode: standalone)').matches) return;
        // Dismissed recently → wait the cooldown
        const lastDismiss = parseInt(localStorage.getItem(DISMISS_KEY) || '0', 10);
        const cooledDown = Date.now() - lastDismiss > RE_PROMPT_DAYS * 86_400_000;
        if (lastDismiss && !cooledDown) return;

        const onBeforeInstall = (e) => {
            e.preventDefault();      // suppress the browser's mini-infobar
            setDeferred(e);
        };
        window.addEventListener('beforeinstallprompt', onBeforeInstall);
        // If the user installs via the browser UI, hide our banner
        window.addEventListener('appinstalled', () => setVisible(false));
        return () => window.removeEventListener('beforeinstallprompt', onBeforeInstall);
    }, []);

    useEffect(() => {
        // Only surface the banner once the user is engaged (lvl > 1)
        if (!deferred) return;
        if (!character || (character.level || 1) < 2) return;
        // Wait a beat so it doesn't pop the moment they level up — let the
        // level-up modal land first.
        const t = setTimeout(() => setVisible(true), 2500);
        return () => clearTimeout(t);
    }, [deferred, character?.level]);

    if (!visible || !deferred) return null;

    const handleInstall = async () => {
        try {
            deferred.prompt();
            const { outcome } = await deferred.userChoice;
            // outcome: 'accepted' | 'dismissed'
            if (outcome === 'dismissed') {
                localStorage.setItem(DISMISS_KEY, String(Date.now()));
            }
        } catch (e) { /* user agent doesn't allow programmatic prompt */ }
        setDeferred(null);
        setVisible(false);
    };

    const handleDismiss = () => {
        localStorage.setItem(DISMISS_KEY, String(Date.now()));
        setVisible(false);
    };

    return (
        <div className="fixed bottom-4 right-4 z-[80] max-w-sm animate-in slide-in-from-bottom-4 fade-in duration-500">
            <div className="relative bg-gradient-to-br from-rpg-gold/20 via-rpg-panel to-rpg-panelDark border border-rpg-gold/40 rounded-2xl p-4 shadow-[0_0_30px_rgba(251,191,36,0.25)]">
                <button
                    onClick={handleDismiss}
                    className="absolute top-2 right-2 p-1.5 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                    aria-label="Dismiss"
                >
                    <X size={14} />
                </button>
                <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-rpg-gold/20 border border-rpg-gold/40 flex items-center justify-center text-rpg-gold shrink-0">
                        <Sparkles size={18} />
                    </div>
                    <div className="flex-1 min-w-0 pr-4">
                        <h4 className="text-sm font-heading font-bold text-white mb-0.5">Install Taskoria</h4>
                        <p className="text-[11px] text-gray-300 leading-snug">
                            Add it to your home screen for one-tap access — works offline.
                        </p>
                    </div>
                </div>
                <div className="flex gap-2 mt-3">
                    <button
                        onClick={handleDismiss}
                        className="flex-1 px-3 py-2 rounded-lg text-[10px] uppercase tracking-widest font-bold text-gray-400 hover:text-white border border-white/10 hover:bg-white/5 transition-colors"
                    >
                        Not now
                    </button>
                    <button
                        onClick={handleInstall}
                        className="flex-[2] flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-[10px] uppercase tracking-widest font-bold bg-rpg-gold text-rpg-bg hover:brightness-110 shadow-[0_0_15px_rgba(251,191,36,0.4)] transition-all"
                    >
                        <Download size={12} /> Install
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PWAInstallPrompt;
