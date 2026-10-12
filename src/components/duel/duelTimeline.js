// Turns the duel events (src/utils/duelEngine.js / api/battle_pvp.php) into "beats": one die
// throw (or a short pause) each, with what the table shows while it rolls and once it lands.
//
// A beat:  { id, kind, actor, rollMs, holdMs, dice:[{sides,value,tone,label,sub,from}],
//            caption:{text,tone}|null, lines:[{icon,tone,text}], hp:{a,b}, hit:boolean }
// `hp` is the state AFTER the beat resolves; `lines` are appended to the transcript on resolve.

const sign = (n) => (n >= 0 ? `+ ${n}` : `− ${Math.abs(n)}`);

export function buildTimeline(events) {
    const start = events.find(e => e.t === 'start');
    const A = start.a, B = start.b;
    const name = (w) => (w === 'a' ? A.name : B.name);
    const beats = [];
    let hp = { a: A.maxHp, b: B.maxHp };
    const push = (b) => beats.push({ id: beats.length, actor: null, rollMs: 800, holdMs: 900, dice: [], caption: null, lines: [], hit: false, ...b, hp: { ...hp } });

    for (const ev of events) {
        if (ev.t === 'start') {
            push({ kind: 'intro', rollMs: 0, holdMs: 800, lines: [{ icon: 'scroll', tone: 'muted', text: `${A.name} the ${A.className} challenges ${B.name} the ${B.className}.` }] });
        }
        if (ev.t === 'initiative') {
            const [ia, ib] = ev.rolls;
            const first = ev.order[0];
            const tie = ia.tiebreak !== undefined;
            push({
                kind: 'initiative', rollMs: 900, holdMs: 1300,
                dice: [
                    { sides: 20, value: ia.d20, label: A.name, sub: `${ia.d20} ${sign(ia.mod)} = ${ia.total}`, from: 'left', tone: first === 'a' ? 'good' : 'dim' },
                    { sides: 20, value: ib.d20, label: B.name, sub: `${ib.d20} ${sign(ib.mod)} = ${ib.total}`, from: 'right', tone: first === 'b' ? 'good' : 'dim' },
                ],
                caption: { text: `${name(first)} acts first${tie ? ' (tie broken on a re-roll)' : ''}`, tone: 'gold' },
                lines: [{ icon: 'd20', tone: 'gold', text: `Initiative — ${A.name} ${ia.total}, ${B.name} ${ib.total}. ${name(first)} acts first.` }],
            });
        }
        if (ev.t === 'round') {
            push({ kind: 'round', round: ev.n, rollMs: 0, holdMs: 520, lines: [{ icon: 'round', tone: 'muted', text: `Round ${ev.n}` }] });
        }
        if (ev.t === 'attack') {
            const who = ev.who, foe = ev.target;
            const finalTone = ev.crit ? 'gold' : ev.fumble ? 'fumble' : ev.hit ? 'good' : 'bad';
            const verdict = ev.crit ? 'CRITICAL HIT' : ev.fumble ? 'FUMBLE' : ev.hit ? 'HIT' : 'MISS';
            const calc = `${ev.rolls[ev.rolls.length - 1]} ${sign(ev.bonus)} = ${ev.total} vs Armor ${ev.ac}`;
            if (ev.inspired) {
                push({
                    kind: 'attack', actor: who, rollMs: 750, holdMs: 700,
                    dice: [{ sides: 20, value: ev.rolls[0], tone: 'dim', label: `${name(who)} attacks`, sub: `${ev.rolls[0]} ${sign(ev.bonus)} = ${ev.rolls[0] + ev.bonus} vs Armor ${ev.ac}`, from: who === 'a' ? 'left' : 'right' }],
                    caption: { text: 'MISS', tone: 'bad' },
                });
                push({
                    kind: 'inspiration', actor: who, rollMs: 750, holdMs: 1000,
                    dice: [
                        { sides: 20, value: ev.rolls[0], tone: 'dim', label: 'First roll', rolled: true, rollMs: 0, from: 'center' },
                        { sides: 20, value: ev.rolls[1], tone: finalTone, label: 'Inspiration', sub: calc, from: who === 'a' ? 'left' : 'right' },
                    ],
                    caption: { text: verdict, tone: finalTone },
                    hit: ev.hit,
                    lines: [{ icon: 'spark', tone: 'gold', text: `${name(who)} spends Inspiration — earned by real work today — and rerolls.` }],
                });
            } else {
                push({
                    kind: 'attack', actor: who, rollMs: 800, holdMs: 1000,
                    dice: [{ sides: 20, value: ev.rolls[0], tone: finalTone, label: `${name(who)} attacks`, sub: calc, from: who === 'a' ? 'left' : 'right' }],
                    caption: { text: verdict, tone: finalTone },
                    hit: ev.hit,
                });
            }
            const last = beats[beats.length - 1];
            const attackText = `${name(who)} → ${name(foe)}: d20 ${calc} — ${verdict.toLowerCase()}.`;
            last.lines = [...(last.lines || []), { icon: ev.crit ? 'crit' : ev.fumble ? 'fumble' : ev.hit ? 'hit' : 'miss', tone: finalTone, text: attackText }];
            if (ev.fumble) {
                push({
                    kind: 'fumble', actor: who, rollMs: 700, holdMs: 1100,
                    dice: [{ sides: 6, value: ev.fumbleRoll, tone: 'fumble', label: 'Mishap', sub: ev.fumbleId === 'none' ? 'no harm done' : ev.fumbleId === 'slip' ? 'Armor −2' : 'next attack −2', from: who === 'a' ? 'left' : 'right' }],
                    caption: { text: `${name(who)} ${ev.fumbleText}`, tone: 'muted' },
                    lines: [{ icon: 'fumble', tone: 'fumble', text: `Mishap d6 ${ev.fumbleRoll}: ${name(who)} ${ev.fumbleText}.` }],
                });
            }
        }
        if (ev.t === 'damage') {
            hp = { ...ev.hp };
            const who = ev.who, foe = ev.target;
            const dicePart = ev.dice.join(' + ');
            push({
                kind: 'damage', actor: who, target: foe, rollMs: 700, holdMs: 1000, hit: true,
                dice: ev.dice.map((v, i) => ({ sides: ev.die, value: v, tone: ev.crit ? 'gold' : 'neutral', label: i === 0 ? (ev.crit ? 'Critical damage' : 'Damage') : '', sub: i === ev.dice.length - 1 ? `${dicePart} ${sign(ev.mod)} = ${ev.total}` : '', from: who === 'a' ? 'left' : 'right' })),
                caption: { text: `−${ev.total} HP`, tone: ev.crit ? 'gold' : 'bad' },
                lines: [{ icon: 'damage', tone: ev.crit ? 'gold' : 'bad', text: `${name(foe)} takes ${ev.total} damage (d${ev.die}: ${dicePart} ${sign(ev.mod)}).` }],
            });
        }
        if (ev.t === 'lastStand') {
            hp = { ...ev.hp };
            push({
                kind: 'lastStand', actor: ev.who, rollMs: 900, holdMs: 1500,
                dice: [{ sides: 20, value: ev.d20, tone: ev.saved ? 'good' : 'bad', label: `${name(ev.who)} — last stand`, sub: `${ev.d20} ${sign(ev.mod)} = ${ev.total} vs DC ${ev.dc}`, from: 'center' }],
                caption: { text: ev.saved ? 'STILL STANDING' : 'FALLS', tone: ev.saved ? 'good' : 'bad' },
                lines: [{ icon: 'heart', tone: ev.saved ? 'good' : 'bad', text: ev.saved ? `${name(ev.who)} refuses to fall and stays up at ${ev.hp[ev.who]} HP!` : `${name(ev.who)} cannot hold on.` }],
            });
        }
        if (ev.t === 'end') {
            hp = { ...ev.hp };
            const w = ev.winner;
            push({ kind: 'end', rollMs: 0, holdMs: 900, winner: w, reason: ev.reason, rounds: ev.rounds, lines: [{ icon: 'trophy', tone: 'gold', text: ev.reason === 'ko' ? `${name(w)} wins the duel.` : `Round limit reached — ${name(w)} wins on remaining health.` }] });
        }
    }
    // normalise: every beat exposes `lines` (array)
    return beats.map(b => ({ ...b, lines: b.lines || [] }));
}

/** Facts for the closing summary. */
export function summarize(events) {
    const start = events.find(e => e.t === 'start');
    const out = { crits: { a: 0, b: 0 }, fumbles: { a: 0, b: 0 }, inspired: { a: 0, b: 0 }, biggest: { a: 0, b: 0 }, damage: { a: 0, b: 0 }, hits: { a: 0, b: 0 }, attacks: { a: 0, b: 0 } };
    for (const e of events) {
        if (e.t === 'attack') {
            out.attacks[e.who]++;
            if (e.crit) out.crits[e.who]++;
            if (e.fumble) out.fumbles[e.who]++;
            if (e.inspired) out.inspired[e.who]++;
            if (e.hit) out.hits[e.who]++;
        }
        if (e.t === 'damage') {
            out.damage[e.who] += e.total;
            out.biggest[e.who] = Math.max(out.biggest[e.who], e.total);
        }
    }
    return { ...out, a: start.a, b: start.b, end: events.find(e => e.t === 'end') };
}
