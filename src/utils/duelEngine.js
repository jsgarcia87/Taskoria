// ─────────────────────────────────────────────────────────────────────────────
// Duel engine — a PvP duel played like a tabletop roleplaying session.
//
// Pure and deterministic: every die goes through the injected `roll(sides)`, so
// the same sequence of dice always gives the same duel. The server runs this
// same ruleset in PHP (api/lib/duel.php) with a real RNG; the client uses it for
// local family sparring and to replay what the server resolved.
// scripts/validate-duel.mjs feeds both engines the same dice and compares them.
//
// Rules (d20 system, in the spirit of the classic tabletop games):
//   · Initiative  d20 + DEX modifier. Highest acts first each round.
//   · Attack      d20 + attack bonus ≥ target's Armor Class → hit.
//                 Natural 20 = critical (always hits, damage dice doubled).
//                 Natural 1  = fumble (always misses, then a d6 mishap table).
//   · Damage      weapon die + attack modifier (min 1).
//   · Inspiration Heroic rerolls earned by REAL work today (tasks done, focus
//                 minutes). After a missed attack the hero spends one and
//                 rerolls; the new roll stands. The game never invents these.
//   · Last stand  At 0 HP a hero rolls d20 + WILL modifier against DC 12: success
//                 stays up at 1 HP (natural 20: 5 HP). Once per duel.
//   · End         Someone falls, or after 10 rounds the hero with more HP% wins.
// ─────────────────────────────────────────────────────────────────────────────
import { getClass } from '../data/classes.js';

export const DUEL_RULES = {
    maxRounds: 10,
    lastStandDc: 12,
    inspirationCap: 3,
    tasksPerInspiration: 3,
    focusMinutesPerInspiration: 45,
};

// Tabletop-style numbers per silhouette family.
// Tuned with scripts/validate-duel.mjs --balance so every class lands between ~36% and ~64%
// against the field at equal level (stats, class and level all matter; none decides alone).
export const FAMILY_SHEET = {
    armored: { armor: 4, weaponDie: 8,  weaponName: 'Heavy weapon' },
    common:  { armor: 3, weaponDie: 8,  weaponName: 'Light weapon' },
    robed:   { armor: 2, weaponDie: 10, weaponName: 'Arcane bolt' },
};

export const STANCES = {
    aggressive: { id: 'aggressive', label: 'Aggressive', attack: 2,  ac: -2, blurb: '+2 to hit, −2 Armor' },
    balanced:   { id: 'balanced',   label: 'Balanced',   attack: 0,  ac: 0,  blurb: 'No modifiers' },
    guarded:    { id: 'guarded',    label: 'Guarded',    attack: -2, ac: 2,  blurb: '+2 Armor, −2 to hit' },
};

// Used when the other hero is not there to choose: the class decides.
export const defaultStance = (family) => (family === 'armored' ? 'guarded' : family === 'robed' ? 'aggressive' : 'balanced');

// Ability modifier, tabletop style, but compressed: a hero's stats keep growing with every
// level while a d20 does not, so the modifier is capped (+3) and floored (−3).
export const TUNING = { modCap: 3, modFloor: -3, dexArmorCap: 2, hpBase: 8, hpPerLevel: 3, hpPerCon: 2 };
export const modOf = (score) => Math.max(TUNING.modFloor, Math.min(TUNING.modCap, Math.floor(((Number(score) || 10) - 10) / 2)));
export const proficiency = (level) => Math.min(6, 2 + Math.floor((Math.max(1, level) - 1) / 4));

export const inspirationFromWork = (char, today = new Date().toLocaleDateString('en-CA')) => {
    const day = char?.activityHistory?.[today];
    const tasks = typeof day === 'object' ? (day.tasks || 0) : (Number(day) || 0);
    const minutes = typeof day === 'object' ? (day.minutes || 0) : 0;
    return Math.min(
        DUEL_RULES.inspirationCap,
        Math.floor(tasks / DUEL_RULES.tasksPerInspiration) + Math.floor(minutes / DUEL_RULES.focusMinutesPerInspiration),
    );
};

/** The tabletop character sheet of a hero. Shown before the duel and used by the engine. */
export function buildCombatant(char, { today } = {}) {
    const cls = getClass(char?.class);
    const family = cls?.family || 'common';
    const sheet = FAMILY_SHEET[family];
    const stats = char?.stats || {};
    const level = Math.max(1, Number(char?.level) || 1);
    const combatKeys = cls?.combatStats?.length ? cls.combatStats : ['str'];
    const attackStat = combatKeys.reduce((best, k) => (modOf(stats[k]) > modOf(stats[best]) ? k : best), combatKeys[0]);
    const attackMod = modOf(stats[attackStat]);
    return {
        name: char?.name || 'Hero',
        className: cls?.name || char?.class || 'Adventurer',
        family,
        level,
        avatarId: char?.avatarId || cls?.avatarType || 'warrior',
        avatarColors: char?.avatarColors || null,
        attackStat,
        attackMod,
        attackBonus: attackMod + proficiency(level),
        dexMod: modOf(stats.dex),
        willMod: modOf(stats.will),
        armorClass: Math.max(8, 10 + Math.min(TUNING.dexArmorCap, modOf(stats.dex)) + sheet.armor),
        maxHp: Math.max(10, TUNING.hpBase + level * TUNING.hpPerLevel + modOf(stats.con) * TUNING.hpPerCon),
        weaponDie: sheet.weaponDie,
        weaponName: sheet.weaponName,
        inspiration: inspirationFromWork(char, today),
        defaultStance: defaultStance(family),
    };
}

const FUMBLES = [
    { id: 'slip',   text: 'loses their footing',        acPenalty: 2, attackPenalty: 0 },
    { id: 'slip',   text: 'loses their footing',        acPenalty: 2, attackPenalty: 0 },
    { id: 'weapon', text: 'fumbles their grip',         acPenalty: 0, attackPenalty: 2 },
    { id: 'weapon', text: 'fumbles their grip',         acPenalty: 0, attackPenalty: 2 },
    { id: 'none',   text: 'recovers with a nervous grin', acPenalty: 0, attackPenalty: 0 },
    { id: 'none',   text: 'recovers with a nervous grin', acPenalty: 0, attackPenalty: 0 },
];

/**
 * Plays a whole duel. `a` is the challenger, `b` the defender.
 * @param {object} a  combatant sheet (buildCombatant)
 * @param {object} b
 * @param {{a?:string,b?:string}} stances  stance ids; missing = the class default
 * @param {(sides:number)=>number} roll  returns an integer 1..sides
 * @returns {{events:object[], winner:'a'|'b', reason:'ko'|'rounds', hp:{a:number,b:number}, rounds:number}}
 */
export function runDuel(a, b, stances = {}, roll) {
    const side = { a, b };
    const stance = { a: STANCES[stances.a] || STANCES[a.defaultStance], b: STANCES[stances.b] || STANCES[b.defaultStance] };
    const hp = { a: a.maxHp, b: b.maxHp };
    const inspiration = { a: a.inspiration, b: b.inspiration };
    const lastStand = { a: false, b: false };
    const slip = { a: 0, b: 0 };     // Armor penalty until that hero's next turn
    const grip = { a: 0, b: 0 };     // attack penalty on that hero's next attack
    const other = (w) => (w === 'a' ? 'b' : 'a');
    const events = [];

    events.push({
        t: 'start',
        a: { ...a }, b: { ...b },
        stances: { a: stance.a.id, b: stance.b.id },
    });

    // Initiative: d20 + DEX. Ties go to the higher DEX, then to a fresh d20 each.
    const init = {};
    for (const w of ['a', 'b']) {
        const d20 = roll(20);
        init[w] = { who: w, d20, mod: side[w].dexMod, total: d20 + side[w].dexMod };
    }
    let order = ['a', 'b'];
    if (init.b.total > init.a.total) order = ['b', 'a'];
    else if (init.b.total === init.a.total) {
        if (b.dexMod > a.dexMod) order = ['b', 'a'];
        else if (b.dexMod === a.dexMod) {
            const ta = roll(20), tb = roll(20);
            init.a.tiebreak = ta; init.b.tiebreak = tb;
            if (tb > ta) order = ['b', 'a'];
        }
    }
    events.push({ t: 'initiative', rolls: [init.a, init.b], order });

    const damageFromHit = (who, crit) => {
        const dice = [];
        const n = crit ? 2 : 1;
        for (let i = 0; i < n; i++) dice.push(roll(side[who].weaponDie));
        const sum = dice.reduce((s, v) => s + v, 0);
        return { dice, mod: side[who].attackMod, total: Math.max(1, sum + side[who].attackMod) };
    };

    let rounds = 0;
    let winner = null;
    let reason = 'rounds';

    outer:
    for (let r = 1; r <= DUEL_RULES.maxRounds; r++) {
        rounds = r;
        events.push({ t: 'round', n: r });
        for (const who of order) {
            const foe = other(who);
            slip[who] = 0;                                       // a stumble lasts until your next turn
            const attackStance = stance[who].attack - grip[who];
            const targetAc = Math.max(5, side[foe].armorClass + stance[foe].ac - slip[foe]);

            const rolls = [roll(20)];
            let inspired = false;
            const needed = (d) => d === 20 || (d !== 1 && d + side[who].attackBonus + attackStance >= targetAc);
            if (!needed(rolls[0]) && inspiration[who] > 0) {
                inspiration[who] -= 1;
                inspired = true;
                rolls.push(roll(20));                            // the new roll stands, good or bad
            }
            const d20 = rolls[rolls.length - 1];
            const bonus = side[who].attackBonus + attackStance;
            const total = d20 + bonus;
            const crit = d20 === 20;
            const fumble = d20 === 1;
            const hit = crit || (!fumble && total >= targetAc);
            grip[who] = 0;
            const ev = {
                t: 'attack', who, target: foe, rolls, inspired, bonus, total, ac: targetAc,
                hit, crit, fumble, inspirationLeft: inspiration[who],
            };
            if (fumble) {
                const d6 = roll(6);
                const f = FUMBLES[d6 - 1];
                ev.fumbleRoll = d6; ev.fumbleText = f.text; ev.fumbleId = f.id;
                slip[who] = f.acPenalty; grip[who] = f.attackPenalty;
            }
            events.push(ev);

            if (hit) {
                const dmg = damageFromHit(who, crit);
                hp[foe] -= dmg.total;
                const dev = { t: 'damage', who, target: foe, die: side[who].weaponDie, dice: dmg.dice, mod: dmg.mod, total: dmg.total, crit, hp: { a: Math.max(0, hp.a), b: Math.max(0, hp.b) } };
                events.push(dev);
                if (hp[foe] <= 0) {
                    if (!lastStand[foe]) {
                        lastStand[foe] = true;
                        const ls = roll(20);
                        const lsTotal = ls + side[foe].willMod;
                        const saved = ls === 20 || (ls !== 1 && lsTotal >= DUEL_RULES.lastStandDc);
                        hp[foe] = saved ? (ls === 20 ? 5 : 1) : 0;
                        events.push({ t: 'lastStand', who: foe, d20: ls, mod: side[foe].willMod, total: lsTotal, dc: DUEL_RULES.lastStandDc, saved, hp: { a: Math.max(0, hp.a), b: Math.max(0, hp.b) } });
                    }
                    if (hp[foe] <= 0) { winner = who; reason = 'ko'; break outer; }
                }
            }
        }
    }

    if (!winner) {
        const pa = hp.a / a.maxHp, pb = hp.b / b.maxHp;
        winner = pa > pb ? 'a' : pb > pa ? 'b' : order[0];
    }
    events.push({ t: 'end', winner, reason, rounds, hp: { a: Math.max(0, hp.a), b: Math.max(0, hp.b) } });
    return { events, winner, reason, rounds, hp: { a: Math.max(0, hp.a), b: Math.max(0, hp.b) } };
}

/** Real random dice for the client (local sparring). The server never trusts this. */
export const randomRoll = (sides) => Math.floor(Math.random() * sides) + 1;

/** A fixed list of dice, for tests and replays. */
export const scriptedRoll = (values) => {
    let i = 0;
    return (sides) => {
        const v = values[i++ % values.length];
        return ((v - 1) % sides) + 1;
    };
};
