import { useEffect, useRef } from 'react';
import { useToast } from '../components/common/Toast';

/**
 * Watches the player's pets and fires a toast notification when any stat
 * (hunger / happiness / hygiene) crosses below 25%. The "below 25" check is
 * edge-triggered via a per-pet/per-stat memory ref so the user gets exactly
 * ONE warning per dip, not a spam every render.
 *
 * Resets the memory when the stat recovers above 35%, so the next dip warns again.
 *
 * Mount once at the app root (inside ToastProvider + GameProvider).
 */
const WARN_BELOW = 25;
const RESET_ABOVE = 35;

const LABELS = {
    hunger: 'is hungry',
    happiness: 'is sad',
    hygiene: 'needs a bath',
};

export function usePetWarnings(pets) {
    // The ToastProvider rebuilds its `api` object on every render, so the
    // useToast() return value is a NEW reference whenever any toast mounts/
    // dismisses. Putting `toast` in the effect deps would re-run on every
    // single toast — and since pushing a toast itself triggers a re-render,
    // we'd hit "Maximum update depth exceeded". Stash it in a ref instead.
    const toast = useToast();
    const toastRef = useRef(toast);
    toastRef.current = toast;
    const warnedRef = useRef({});   // { [petId]: { hunger: bool, happiness: bool, hygiene: bool } }

    useEffect(() => {
        if (!Array.isArray(pets) || pets.length === 0) return;

        for (const pet of pets) {
            if (!pet) continue;
            if (pet.inSanctuary) {
                // Sanctuary pets recover automatically; clear their warning memory
                delete warnedRef.current[pet.id];
                continue;
            }
            const memo = warnedRef.current[pet.id] = warnedRef.current[pet.id] || {};
            for (const stat of ['hunger', 'happiness', 'hygiene']) {
                const value = pet[stat] ?? 100;
                if (!memo[stat] && value <= WARN_BELOW) {
                    memo[stat] = true;
                    toastRef.current.error(`Your ${pet.type} ${LABELS[stat]}!`, { duration: 4000 });
                } else if (memo[stat] && value >= RESET_ABOVE) {
                    memo[stat] = false; // re-arm
                }
            }
        }
    }, [pets]); // intentionally NOT depending on toast — see note above
}
