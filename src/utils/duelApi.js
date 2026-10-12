// Client for api/battle_pvp.php — a duel between friends is a challenge the rival has to answer.
const URL = 'api/battle_pvp.php';

const post = async (body) => {
    const res = await fetch(URL, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || data.error) throw new Error(data.error || 'The arena is unreachable. Try again in a moment.');
    return data;
};
const get = async (query) => {
    const res = await fetch(`${URL}?${query}`);
    const data = await res.json().catch(() => ({}));
    if (!res.ok || data.error) throw new Error(data.error || 'The arena is unreachable. Try again in a moment.');
    return data;
};

export const localToday = () => new Date().toLocaleDateString('en-CA');

export const previewDuel = (userId, foeId) => post({ action: 'preview', attacker_id: userId, defender_id: foeId, today: localToday() });
export const sendChallenge = (userId, foeId, stance) => post({ action: 'challenge', attacker_id: userId, defender_id: foeId, stance, today: localToday() });
export const answerChallenge = (userId, challengeId, decision, stance) => post({ action: 'respond', user_id: userId, challenge_id: challengeId, decision, stance, today: localToday() });
export const cancelChallenge = (userId, challengeId) => post({ action: 'cancel', user_id: userId, challenge_id: challengeId });
export const fetchDuelInbox = (userId) => get(`action=inbox&user_id=${userId}&today=${localToday()}`);
export const fetchDuelCounts = (userId) => get(`action=pending_count&user_id=${userId}`);
export const watchDuel = (userId, challengeId) => get(`action=watch&user_id=${userId}&challenge_id=${challengeId}`);

/** Lets the nav badge refresh right after the player answers / sends / watches something. */
export const DUELS_CHANGED = 'taskoria:duels-changed';
export const announceDuelsChanged = () => window.dispatchEvent(new Event(DUELS_CHANGED));
