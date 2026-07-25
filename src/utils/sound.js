// Simple synthetic 8-bit sound generator using Web Audio API
// No external dependencies or files required!

const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

const playTone = (freq, type, duration, vol) => {
    if (audioCtx.state === 'suspended') {
        audioCtx.resume();
    }
    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();

    oscillator.type = type;
    oscillator.frequency.setValueAtTime(freq, audioCtx.currentTime);

    gainNode.gain.setValueAtTime(vol, audioCtx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + duration);

    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);

    oscillator.start();
    oscillator.stop(audioCtx.currentTime + duration);
};

export const playCoinSound = () => {
    playTone(987.77, 'square', 0.1, 0.1); // B5
    setTimeout(() => playTone(1318.51, 'square', 0.2, 0.1), 100); // E6
};

export const playHitSound = () => {
    playTone(150, 'sawtooth', 0.1, 0.2);
    setTimeout(() => playTone(100, 'sawtooth', 0.1, 0.2), 50);
};

export const playLevelUpSound = () => {
    playTone(440, 'square', 0.1, 0.1); // A4
    setTimeout(() => playTone(554.37, 'square', 0.1, 0.1), 100); // C#5
    setTimeout(() => playTone(659.25, 'square', 0.1, 0.1), 200); // E5
    setTimeout(() => playTone(880, 'square', 0.3, 0.1), 300); // A5
};

export const playHealSound = () => {
    playTone(523.25, 'sine', 0.1, 0.1); // C5
    setTimeout(() => playTone(659.25, 'sine', 0.1, 0.1), 100); // E5
    setTimeout(() => playTone(783.99, 'sine', 0.2, 0.1), 200); // G5
};

export const playErrorSound = () => {
    playTone(200, 'sawtooth', 0.1, 0.2);
    setTimeout(() => playTone(150, 'sawtooth', 0.2, 0.2), 100);
};

// ---------------------------------------------------------------------------
//  Footsteps — procedural, per-surface. Filtered noise bursts kept very quiet
//  so they read as texture, not as an effect.
// ---------------------------------------------------------------------------

// One shared noise buffer (0.15s of white noise), built lazily.
let noiseBuffer = null;
const getNoiseBuffer = () => {
    if (!noiseBuffer) {
        const len = Math.floor(audioCtx.sampleRate * 0.15);
        noiseBuffer = audioCtx.createBuffer(1, len, audioCtx.sampleRate);
        const data = noiseBuffer.getChannelData(0);
        for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
    }
    return noiseBuffer;
};

// surface presets: [filterType, centerFreq, freqJitter, duration, volume]
const FOOTSTEP_PRESETS = {
    stone:   ['bandpass', 1500, 400, 0.05, 0.040],
    wood:    ['bandpass', 620,  150, 0.07, 0.050],
    grass:   ['highpass', 3200, 600, 0.09, 0.028],
    dungeon: ['bandpass', 900,  250, 0.11, 0.045],
};

export const playFootstep = (surface = 'stone') => {
    if (audioCtx.state === 'suspended') audioCtx.resume();
    const [type, freq, jitter, dur, vol] = FOOTSTEP_PRESETS[surface] || FOOTSTEP_PRESETS.stone;

    const src = audioCtx.createBufferSource();
    src.buffer = getNoiseBuffer();

    const filter = audioCtx.createBiquadFilter();
    filter.type = type;
    filter.frequency.value = freq + (Math.random() * 2 - 1) * jitter;
    filter.Q.value = type === 'bandpass' ? 1.4 : 0.8;

    const gain = audioCtx.createGain();
    const t = audioCtx.currentTime;
    gain.gain.setValueAtTime(vol * (0.85 + Math.random() * 0.3), t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + dur);

    src.connect(filter);
    filter.connect(gain);
    gain.connect(audioCtx.destination);
    src.start(t);
    src.stop(t + dur);

    // Wood gets a faint low knock under the noise — sells the plank floor
    if (surface === 'wood') playTone(85 + Math.random() * 12, 'sine', 0.05, 0.030);
};

// Soft two-tone chime for map transitions — quiet, no fanfare.
export const playPortalSound = () => {
    playTone(392, 'sine', 0.18, 0.05);      // G4
    setTimeout(() => playTone(523.25, 'sine', 0.25, 0.04), 120); // C5
};

// Maps a MapData tileSprite key to a footstep surface.
export const surfaceForTile = (tileSprite) => {
    if (!tileSprite) return 'stone';
    if (tileSprite.includes('wood')) return 'wood';
    if (tileSprite.includes('grass')) return 'grass';
    if (tileSprite.includes('dungeon')) return 'dungeon';
    return 'stone';
};
