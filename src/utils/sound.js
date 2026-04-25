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
