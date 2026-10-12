import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { X, FastForward, ChevronDown, Swords, Dices, Send, Hourglass } from 'lucide-react';
import ModernPixelAvatar from '../common/ModernPixelAvatar';
import Die from './Die';
import { buildTimeline, summarize } from './duelTimeline';
import { STANCES, DUEL_RULES } from '../../utils/duelEngine';

const TONE_TEXT = {
    gold: 'text-rpg-gold', good: 'text-emerald-300', bad: 'text-red-300', fumble: 'text-rose-300', muted: 'text-gray-400', neutral: 'text-gray-200',
};
const CAPTION_BG = {
    gold: 'bg-rpg-gold/15 text-rpg-gold border-rpg-gold/40', good: 'bg-emerald-400/10 text-emerald-300 border-emerald-400/30',
    bad: 'bg-red-400/10 text-red-300 border-red-400/30', fumble: 'bg-rose-400/10 text-rose-300 border-rose-400/30', muted: 'bg-white/5 text-gray-300 border-white/10',
};

const useIsNarrow = () => {
    const [narrow, setNarrow] = useState(() => typeof window !== 'undefined' && window.innerWidth < 640);
    useEffect(() => {
        const on = () => setNarrow(window.innerWidth < 640);
        window.addEventListener('resize', on);
        return () => window.removeEventListener('resize', on);
    }, []);
    return narrow;
};

// ── small pieces ─────────────────────────────────────────────────────────────

const Tokens = ({ count, max = DUEL_RULES.inspirationCap }) => (
    <span className="inline-flex items-center gap-1" aria-label={`${count} Inspiration`}>
        {Array.from({ length: max }, (_, i) => (
            <span key={i} className={`w-2.5 h-2.5 rotate-45 border ${i < count ? 'bg-rpg-gold border-rpg-gold shadow-[0_0_6px_rgba(254,223,140,0.6)]' : 'border-white/25'}`} />
        ))}
    </span>
);

const HpBar = ({ hp, max, align = 'left' }) => {
    const pct = Math.max(0, Math.min(100, (hp / max) * 100));
    const color = pct > 55 ? 'bg-emerald-400' : pct > 25 ? 'bg-amber-400' : 'bg-red-500';
    return (
        <div className="w-full">
            <div className={`flex items-baseline gap-1.5 mb-1 ${align === 'right' ? 'justify-end' : ''}`}>
                <span className="font-pixel text-2xl leading-none text-white tabular-nums">{hp}</span>
                <span className="text-[10px] text-gray-500 font-heading font-bold tracking-widest">/ {max} HP</span>
            </div>
            <div className="h-2.5 rounded-full bg-black/50 border border-white/10 overflow-hidden">
                <div className={`h-full rounded-full ${color} transition-[width] duration-700 ease-out ${align === 'right' ? 'ml-auto' : ''}`} style={{ width: `${pct}%` }} />
            </div>
        </div>
    );
};

const Stat = ({ label, value, hint }) => (
    <div className="rounded-xl bg-black/25 border border-white/[0.07] px-1.5 sm:px-3 py-1.5 sm:py-2">
        <div className="text-[8px] sm:text-[9px] uppercase tracking-[0.12em] sm:tracking-[0.18em] font-heading font-bold text-gray-500">{label}</div>
        <div className="font-pixel text-2xl leading-none text-white mt-1 tabular-nums">{value}</div>
        {hint && <div className="text-[10px] text-gray-500 mt-0.5">{hint}</div>}
    </div>
);

const SheetCard = ({ hero, note, narrow, you }) => (
    <div className="rounded-2xl bg-white/[0.04] border border-white/10 p-2.5 sm:p-4 flex flex-col items-center text-center min-w-0">
        <div className="h-[104px] sm:h-[150px] flex items-end justify-center mb-2">
            <ModernPixelAvatar type={hero.avatarId} scale={narrow ? 1.15 : 1.75} customColors={hero.avatarColors} />
        </div>
        <h3 className="font-herald text-lg sm:text-xl text-white leading-none truncate max-w-full">{hero.name}</h3>
        <p className="text-[10px] sm:text-[11px] uppercase tracking-[0.12em] sm:tracking-[0.16em] text-gray-400 font-heading font-bold mt-1.5">{you && <span className="text-rpg-gold">You · </span>}Lvl {hero.level} · {hero.className}</p>
        <div className="grid grid-cols-2 gap-1.5 sm:gap-2 w-full mt-3 sm:mt-4">
            <Stat label="Hit points" value={hero.maxHp} />
            <Stat label="Armor class" value={hero.armorClass} />
            <Stat label="To hit" value={`+${hero.attackBonus}`} hint={hero.attackStat.toUpperCase()} />
            <Stat label="Weapon" value={`d${hero.weaponDie}`} hint={`+${hero.attackMod} damage`} />
        </div>
        <div className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 mt-3 text-[10px] sm:text-[11px] text-gray-400 font-heading font-bold uppercase tracking-widest">
            Inspiration <Tokens count={hero.inspiration} />
        </div>
        {note && <p className="text-[10px] text-gray-500 mt-2 leading-snug">{note}</p>}
    </div>
);

const SEALED_NOTE = 'Stance sealed until the first die falls.';

const RULES = [
    ['Initiative', 'Both heroes roll a d20 + DEX. The higher total strikes first every round.'],
    ['Attack', `d20 + your to-hit bonus against the other hero's Armor Class. Hit or miss is decided by the die, not by who is stronger on paper.`],
    ['Critical & fumble', 'A natural 20 always hits and doubles the damage dice. A natural 1 always misses — and a d6 decides what goes wrong.'],
    ['Inspiration', `Earned by real work today: 1 per ${DUEL_RULES.tasksPerInspiration} tasks and 1 per ${DUEL_RULES.focusMinutesPerInspiration} focus minutes (max ${DUEL_RULES.inspirationCap}). After a miss, spend one to reroll — the new roll stands.`],
    ['Last stand', `At 0 HP a hero rolls d20 + WILL against DC ${DUEL_RULES.lastStandDc}. Succeed and you stay up at 1 HP. Once per duel.`],
    ['Ending', `The duel lasts until someone falls, or ${DUEL_RULES.maxRounds} rounds pass — then the hero with more health left wins.`],
];

// ── the arena ────────────────────────────────────────────────────────────────

/**
 * @param {object} p
 * @param {'fight'|'send'|'answer'|'watch'} p.mode
 *        fight  — sparring: pick a stance and roll right now (family)
 *        send   — challenger: pick a stance (sealed) and send the challenge to a friend
 *        answer — the challenged friend: pick their own stance, accept (rolls) or decline
 *        watch  — replay of a finished duel (`initial` holds its events)
 * @param {object} p.me         sheet of the viewer
 * @param {object} p.foe        sheet of the opponent
 * @param {string} p.stakes     one line about what is at stake
 * @param {'a'|'b'} p.viewerSide which side of the table the viewer sits on (challenger = 'a')
 * @param {(stance:string)=>Promise<object>} p.onFight  fight/answer: resolves with {events, spoils?, log?}; send: with {message}
 * @param {()=>Promise<void>} p.onDecline  answer mode only
 * @param {{events:object[]}} p.initial  watch mode only
 * @param {(result:object|null)=>void} p.onClose  called with the fight result (or null if never fought)
 */
const DuelArena = ({ mode = 'fight', me, foe, stakes, viewerSide = 'a', onFight, onDecline, initial = null, onClose }) => {
    const narrow = useIsNarrow();
    const [phase, setPhase] = useState(initial ? 'playing' : 'sheet');   // sheet | loading | sent | playing | result
    const [stance, setStance] = useState(me?.defaultStance || 'balanced');
    const [sentNote, setSentNote] = useState('');
    const [showRules, setShowRules] = useState(false);
    const [result, setResult] = useState(initial);
    const [speed, setSpeed] = useState(1);
    const [idx, setIdx] = useState(0);
    const [stage, setStage] = useState('roll');           // roll | hold (within the current beat)
    const resultRef = useRef(initial);

    const beats = useMemo(() => (result ? buildTimeline(result.events) : []), [result]);
    const summary = useMemo(() => (result ? summarize(result.events) : null), [result]);

    useEffect(() => {
        const prev = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        return () => { document.body.style.overflow = prev; };
    }, []);

    const finish = useCallback(() => onClose(resultRef.current), [onClose]);
    useEffect(() => {
        const onKey = (e) => { if (e.key === 'Escape' && phase !== 'loading') finish(); };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [phase, finish]);

    const startFight = async () => {
        setPhase('loading');
        try {
            const res = await onFight(stance);
            if (mode === 'send') { setSentNote(res?.message || ''); setPhase('sent'); return; }
            resultRef.current = res;
            setResult(res); setIdx(0); setStage('roll'); setPhase('playing');
        } catch {
            setPhase('sheet');
        }
    };

    // Playback clock: each beat has a throw (rollMs) and a hold (holdMs).
    useEffect(() => {
        if (phase !== 'playing' || !beats.length) return undefined;
        const beat = beats[idx];
        if (!beat) return undefined;
        if (stage === 'roll') {
            const t = setTimeout(() => setStage('hold'), beat.rollMs / speed);
            return () => clearTimeout(t);
        }
        const t = setTimeout(() => {
            if (idx >= beats.length - 1) setPhase('result');
            else { setIdx(idx + 1); setStage('roll'); }
        }, beat.holdMs / speed);
        return () => clearTimeout(t);
    }, [phase, idx, stage, speed, beats]);

    const skip = () => { setIdx(beats.length - 1); setStage('hold'); setPhase('result'); };
    const replay = () => { setIdx(0); setStage('roll'); setPhase('playing'); };

    const decline = async () => {
        setPhase('loading');
        try { await onDecline(); } catch { setPhase('sheet'); }
    };

    // Once the duel exists, the sheets the server (or engine) actually fought with are the truth.
    const sheets = summary ? { a: summary.a, b: summary.b } : { a: me, b: foe };
    const beat = beats[idx];
    const resolved = phase === 'result' || stage === 'hold';
    const lastBeat = beats[beats.length - 1];
    const upTo = phase === 'result' ? beats.length : idx + (resolved ? 1 : 0);
    const hp = phase === 'result' ? lastBeat?.hp : (resolved ? beat?.hp : (beats[idx - 1]?.hp || { a: sheets.a.maxHp, b: sheets.b.maxHp }));
    const log = useMemo(() => beats.slice(0, upTo).flatMap(b => b.lines.map((l, i) => ({ ...l, key: `${b.id}-${i}` }))), [beats, upTo]);
    const spent = useMemo(() => {
        const s = { a: 0, b: 0 };
        for (const b of beats.slice(0, upTo)) if (b.kind === 'inspiration') s[b.actor] += 1;
        return s;
    }, [beats, upTo]);
    const logRef = useRef(null);
    useEffect(() => { if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight; }, [log.length]);

    const youWon = result && summary?.end?.winner === viewerSide;
    const round = useMemo(() => beats.slice(0, idx + 1).reduce((r, b) => (b.kind === 'round' ? b.round : r), 0), [beats, idx]);

    const lunge = phase === 'playing' && stage === 'hold' && beat?.kind === 'damage' ? beat.actor : null;
    const struck = lunge ? beat.target : null;

    const avatarScale = narrow ? 1.35 : 1.9;
    const alt = idx % 2 ? '-alt' : '';       // alternate the keyframe name so the animation restarts on every blow
    const renderFighter = (side) => {
        const h = sheets[side];
        const cls = `${lunge === side ? `duel-lunge-${side}${alt}` : ''} ${struck === side ? `duel-struck${alt}` : ''}`;
        const fallen = phase === 'result' && summary?.end?.winner !== side;
        return (
            <div key={side} className="flex flex-col items-center min-w-0 flex-1 basis-0">
                <div className={`h-[124px] sm:h-[176px] flex items-end justify-center mb-2 transition-opacity duration-700 ${fallen ? 'opacity-55 saturate-50' : ''}`}>
                    <div className={cls}><div style={side === 'b' ? { transform: 'scaleX(-1)' } : undefined}><ModernPixelAvatar type={h.avatarId} scale={avatarScale} customColors={h.avatarColors} /></div></div>
                </div>
                <div className="font-herald text-lg sm:text-xl text-white leading-none truncate max-w-full">{h.name}</div>
                <div className="text-[10px] uppercase tracking-[0.16em] text-gray-500 font-heading font-bold mt-1 mb-2.5">{side === viewerSide ? <span className="text-rpg-gold">You</span> : 'Rival'} · AC {h.armorClass} · +{h.attackBonus}</div>
                <div className="w-full max-w-[210px]">
                    <HpBar hp={hp?.[side] ?? h.maxHp} max={h.maxHp} align={side === 'b' ? 'right' : 'left'} />
                    <div className={`mt-2 flex ${side === 'b' ? 'justify-end' : ''}`}><Tokens count={Math.max(0, h.inspiration - spent[side])} /></div>
                </div>
            </div>
        );
    };

    const foeNote = mode === 'send' ? 'Chooses their stance when they answer.'
        : mode === 'fight' ? `Fights ${STANCES[foe.defaultStance].label.toLowerCase()} · ${STANCES[foe.defaultStance].blurb}` : undefined;

    return createPortal(
        <div role="dialog" aria-modal="true" aria-label="Duel" className="fixed inset-0 z-[300] flex flex-col bg-[#14101b] text-white select-none">
            {/* top bar */}
            <div className="flex items-center gap-3 px-4 pt-[max(14px,env(safe-area-inset-top))] pb-3 border-b border-white/10">
                <Swords size={18} className="text-rpg-gold shrink-0" />
                <h2 className="font-herald text-xl sm:text-2xl leading-none whitespace-nowrap">{phase === 'sheet' || phase === 'loading' || phase === 'sent' ? (mode === 'answer' ? 'Challenged' : 'The Challenge') : (narrow ? 'Duel' : 'The Duel')}</h2>
                {phase === 'playing' && round > 0 && <span className="px-2.5 py-1 rounded-full border border-white/15 text-[11px] font-heading font-bold uppercase tracking-widest text-gray-300 whitespace-nowrap">Round {round}</span>}
                <div className="flex-1" />
                {phase === 'playing' && (
                    <>
                        <button onClick={() => setSpeed(speed === 1 ? 2 : speed === 2 ? 3 : 1)} className="h-10 px-3 rounded-xl bg-white/[0.06] hover:bg-white/10 text-xs font-heading font-bold tabular-nums" aria-label="Change speed">{speed}×</button>
                        <button onClick={skip} className="h-10 px-3 rounded-xl bg-white/[0.06] hover:bg-white/10 text-xs font-heading font-bold flex items-center gap-1.5"><FastForward size={14} /> Skip</button>
                    </>
                )}
                <button onClick={finish} disabled={phase === 'loading'} aria-label="Close" className="w-10 h-10 rounded-xl bg-white/[0.06] hover:bg-white/10 flex items-center justify-center text-gray-300 disabled:opacity-40"><X size={18} /></button>
            </div>

            {/* ── sheet ── */}
            {(phase === 'sheet' || phase === 'loading') && (
                <div className="flex-1 overflow-y-auto">
                    <div className="max-w-3xl mx-auto px-4 py-5 pb-8 space-y-5">
                        <p className="text-sm text-gray-300 leading-relaxed">
                            {mode === 'answer' ? `${foe.name} has thrown down the gauntlet. ` : 'Two heroes, one table. '}Dice decide every blow. {stakes}
                        </p>
                        <div className="grid grid-cols-2 gap-2 sm:gap-3 duel-fade-in">
                            <SheetCard hero={viewerSide === 'a' ? me : foe} narrow={narrow} you={viewerSide === 'a'} note={viewerSide === 'a' ? undefined : SEALED_NOTE} />
                            <SheetCard hero={viewerSide === 'a' ? foe : me} narrow={narrow} you={viewerSide === 'b'}
                                note={viewerSide === 'a' ? foeNote : undefined} />
                        </div>

                        <div>
                            <h3 className="text-[11px] uppercase tracking-[0.2em] font-heading font-bold text-gray-400 mb-2">{mode === 'send' ? 'Choose your opening stance' : mode === 'answer' ? 'Choose how you meet them' : 'Choose your stance'}</h3>
                            {mode === 'send' && <p className="text-xs text-gray-500 -mt-1 mb-2">Sealed until {foe.name} has picked theirs.</p>}
                            <div className="grid grid-cols-3 gap-2">
                                {Object.values(STANCES).map(s => (
                                    <button key={s.id} onClick={() => setStance(s.id)} aria-pressed={stance === s.id}
                                        className={`rounded-xl border px-2 py-3 text-center transition-colors ${stance === s.id ? 'border-rpg-gold bg-rpg-gold/10' : 'border-white/10 bg-white/[0.03] hover:bg-white/[0.07]'}`}>
                                        <div className={`font-heading font-bold text-sm ${stance === s.id ? 'text-rpg-gold' : 'text-white'}`}>{s.label}</div>
                                        <div className="text-[10px] text-gray-400 mt-1 leading-snug">{s.blurb}</div>
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="rounded-xl border border-white/10 bg-white/[0.03]">
                            <button onClick={() => setShowRules(v => !v)} className="w-full flex items-center justify-between px-4 py-3 text-sm font-heading font-bold text-gray-200" aria-expanded={showRules}>
                                <span className="flex items-center gap-2"><Dices size={16} className="text-rpg-gold" /> How the dice work</span>
                                <ChevronDown size={16} className={`transition-transform ${showRules ? 'rotate-180' : ''}`} />
                            </button>
                            {showRules && (
                                <dl className="px-4 pb-4 space-y-2.5">
                                    {RULES.map(([k, v]) => (
                                        <div key={k}><dt className="text-[11px] uppercase tracking-[0.16em] font-heading font-bold text-rpg-gold">{k}</dt><dd className="text-xs text-gray-400 leading-relaxed mt-0.5">{v}</dd></div>
                                    ))}
                                </dl>
                            )}
                        </div>
                    </div>
                </div>
            )}
            {(phase === 'sheet' || phase === 'loading') && (
                <div className="px-4 pt-3 pb-[max(16px,env(safe-area-inset-bottom))] border-t border-white/10 bg-[#1c1622]">
                    <div className="max-w-3xl mx-auto flex gap-3">
                        {mode === 'answer' ? (
                            <button onClick={decline} disabled={phase === 'loading'} className="px-5 h-14 rounded-xl border border-white/15 text-sm font-heading font-bold uppercase tracking-widest text-gray-300 hover:bg-white/5 disabled:opacity-40">Decline</button>
                        ) : (
                            <button onClick={finish} disabled={phase === 'loading'} className="px-5 h-14 rounded-xl border border-white/15 text-sm font-heading font-bold uppercase tracking-widest text-gray-300 hover:bg-white/5 disabled:opacity-40">Cancel</button>
                        )}
                        <button onClick={startFight} disabled={phase === 'loading'}
                            className="flex-1 h-14 rounded-xl bg-rpg-gold text-rpg-panel border-b-[5px] border-yellow-600 active:border-b-0 active:translate-y-[5px] font-heading font-extrabold uppercase tracking-widest transition-all flex items-center justify-center gap-2.5 disabled:opacity-70">
                            {mode === 'send' ? <Send size={19} /> : <Dices size={20} />}
                            {phase === 'loading' ? (mode === 'send' ? 'Sending…' : 'Rolling…') : mode === 'send' ? 'Send the challenge' : mode === 'answer' ? 'Accept & roll' : 'Roll for initiative'}
                        </button>
                    </div>
                </div>
            )}

            {/* ── sent ── */}
            {phase === 'sent' && (
                <div className="flex-1 overflow-y-auto flex items-center justify-center px-6">
                    <div className="max-w-sm text-center duel-fade-in">
                        <div className="mx-auto w-14 h-14 rounded-full border border-rpg-gold/40 bg-rpg-gold/10 flex items-center justify-center text-rpg-gold mb-5"><Hourglass size={22} /></div>
                        <h3 className="font-herald text-3xl leading-none text-white">Challenge sent</h3>
                        <p className="text-sm text-gray-300 leading-relaxed mt-3">{sentNote || `${foe.name} will see it the next time they open Taskoria.`}</p>
                        <p className="text-xs text-gray-500 leading-relaxed mt-2">Your stance stays sealed. When they answer, the duel is rolled and you can watch it from your Party tab.</p>
                        <button onClick={finish} className="mt-6 h-12 px-8 rounded-xl bg-white/10 hover:bg-white/15 text-sm font-heading font-bold uppercase tracking-widest">Done</button>
                    </div>
                </div>
            )}

            {/* ── table ── */}
            {(phase === 'playing' || phase === 'result') && (
                <div className="flex-1 min-h-0 flex flex-col">
                    <div className="px-4 pt-4 flex gap-3 max-w-3xl w-full mx-auto">
                        {renderFighter('a')}{renderFighter('b')}
                    </div>

                    {/* dice tray */}
                    <div className="px-4 py-3 max-w-3xl w-full mx-auto">
                        <div className="rounded-2xl border border-white/10 bg-[radial-gradient(ellipse_at_center,rgba(60,48,80,0.55),rgba(20,16,27,0.9))] min-h-[200px] sm:min-h-[236px] flex flex-col items-center justify-center gap-2 py-3 px-2">
                            {phase === 'playing' && beat && (beat.dice.length > 0 ? (
                                <>
                                    <div className="flex items-start justify-center gap-3 sm:gap-6">
                                        {beat.dice.map((d, i) => (
                                            <Die key={`${beat.id}-${i}`} sides={d.sides} value={d.value} rollKey={`${beat.id}-${i}`} rollMs={(d.rollMs ?? beat.rollMs) / speed}
                                                tone={stage === 'roll' && d.rollMs !== 0 ? 'neutral' : d.tone} label={d.label} sub={stage === 'hold' || d.rollMs === 0 ? d.sub : ''} from={d.from} size={narrow ? 78 : 104} />
                                        ))}
                                    </div>
                                    <div className="h-7 flex items-center">
                                        {stage === 'hold' && beat.caption && (
                                            <span className={`duel-fade-in px-3 py-1 rounded-full border text-xs font-heading font-extrabold uppercase tracking-[0.16em] ${CAPTION_BG[beat.caption.tone] || CAPTION_BG.muted}`}>{beat.caption.text}</span>
                                        )}
                                    </div>
                                </>
                            ) : (
                                <span className="font-herald text-2xl text-gray-300 duel-fade-in" key={beat.id}>{beat.kind === 'round' ? `Round ${beat.round}` : beat.kind === 'intro' ? 'Take your places…' : ''}</span>
                            ))}
                            {phase === 'result' && (
                                <div className="text-center duel-fade-in">
                                    <div className={`font-herald text-4xl sm:text-5xl leading-none ${youWon ? 'text-rpg-gold' : 'text-red-300'}`}>{youWon ? 'Victory' : 'Defeat'}</div>
                                    <p className="text-sm text-gray-300 mt-2">{summary.end.reason === 'ko' ? `${sheets[summary.end.winner].name} won in ${summary.end.rounds} round${summary.end.rounds === 1 ? '' : 's'}.` : `${sheets[summary.end.winner].name} won on health after ${summary.end.rounds} rounds.`}</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* transcript */}
                    <div ref={logRef} className="flex-1 min-h-0 overflow-y-auto px-4 pb-3 max-w-3xl w-full mx-auto" aria-live="polite">
                        <ol className="space-y-1.5">
                            {log.map(l => (
                                <li key={l.key} className={`duel-fade-in text-[13px] leading-snug ${TONE_TEXT[l.tone] || 'text-gray-300'}`}>{l.text}</li>
                            ))}
                        </ol>
                        {phase === 'result' && (
                            <div className="mt-4 grid grid-cols-2 gap-2 duel-fade-in">
                                {['a', 'b'].map(w => (
                                    <div key={w} className="rounded-xl bg-white/[0.04] border border-white/10 p-3 text-xs text-gray-300 space-y-1">
                                        <div className="font-heading font-bold text-white text-sm truncate">{sheets[w].name}</div>
                                        <div>Hits <b className="text-white">{summary.hits[w]}</b> / {summary.attacks[w]}</div>
                                        <div>Damage <b className="text-white">{summary.damage[w]}</b> · best <b className="text-white">{summary.biggest[w]}</b></div>
                                        <div>Crits <b className="text-rpg-gold">{summary.crits[w]}</b> · Fumbles <b className="text-rose-300">{summary.fumbles[w]}</b> · Inspired <b className="text-rpg-gold">{summary.inspired[w]}</b></div>
                                    </div>
                                ))}
                                {result?.spoils && result.spoils.type !== 'none' && (
                                    <div className="col-span-2 rounded-xl border border-rpg-gold/30 bg-rpg-gold/[0.07] p-3 text-sm text-rpg-gold">
                                        {result.spoils.type === 'item'
                                            ? (youWon ? `Spoils: you took their ${result.spoils.item?.name}.` : `They took your ${result.spoils.item?.name}.`)
                                            : (youWon ? `Spoils: ${result.spoils.gold} gold.` : `You lost ${result.spoils.gold} gold.`)}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {phase === 'result' && (
                        <div className="px-4 pt-3 pb-[max(16px,env(safe-area-inset-bottom))] border-t border-white/10 bg-[#1c1622]">
                            <div className="max-w-3xl mx-auto flex gap-3">
                                <button onClick={replay} className="px-5 h-12 rounded-xl border border-white/15 text-sm font-heading font-bold uppercase tracking-widest text-gray-300 hover:bg-white/5">Watch again</button>
                                <button onClick={finish} className="flex-1 h-12 rounded-xl bg-white/10 hover:bg-white/15 text-sm font-heading font-bold uppercase tracking-widest">Close</button>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>,
        document.body,
    );
};

export default DuelArena;
