// Class synergy + signature perks (taskoria-rules §5).
//
// Pure function: given the character, the task being completed and today's
// context, returns the class multipliers and the human-readable reasons.
// Every condition reads real data from the task — no reward for work not done.
import { getClass } from '../data/classes.js';

export const CLASS_SYNERGY = 0.10;
export const STREAK_DAYS_CAP = 30;
export const MONK_STREAK_DAYS_CAP = 45;
// A task created and completed faster than this never counts as "planned"
// or "impulsive" — protects the perks from create-and-tick farming.
const MIN_REAL_WORK_MS = 5 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;

// Task ids are Date.now() strings at creation; fall back to explicit fields.
const getCreatedAt = (task) => {
    if (task.createdAt) return new Date(task.createdAt).getTime();
    const n = Number(task.id);
    return Number.isFinite(n) && n > 1e12 ? n : null;
};

// `dueDate` is a 'YYYY-MM-DD' string from <input type="date">: treat it as
// the end of that local day.
const getDueAt = (task) => {
    if (!task.dueDate) return null;
    const d = new Date(`${task.dueDate}T23:59:59`);
    return Number.isNaN(d.getTime()) ? null : d.getTime();
};

export const getStreakDaysCap = (charClass) =>
    getClass(charClass)?.perk.id === 'discipline' ? MONK_STREAK_DAYS_CAP : STREAK_DAYS_CAP;

// Key used by the Scout's one-time discovery bonus.
export const getQuestKind = (task) =>
    `${task.category || 'quest'}:${task.recurrence && task.recurrence !== 'none' ? 'recurring' : 'once'}:${task.attribute || 'none'}`;

/**
 * @param {object} character  current character (needs .class, optional .focusMessage, .discoveries)
 * @param {object} task       task being completed
 * @param {object} ctx        { now: ms, hardDoneToday: number of hard quests already done today }
 * @returns {{ xpMult:number, goldMult:number, bonusXp:number, reasons:string[], discovery:string|null }}
 */
export const getClassTaskBonus = (character, task, ctx = {}) => {
    const result = { xpMult: 0, goldMult: 0, bonusXp: 0, reasons: [], discovery: null };
    const cls = getClass(character?.class);
    if (!cls || !task) return result;

    const now = ctx.now ?? Date.now();
    const createdAt = getCreatedAt(task);
    const dueAt = getDueAt(task);
    const isRecurring = task.recurrence && task.recurrence !== 'none';
    const workedFor = createdAt ? now - createdAt : 0;

    if (task.attribute && cls.affinity.includes(task.attribute)) {
        result.xpMult += CLASS_SYNERGY;
        result.reasons.push(`${cls.name} synergy`);
    }

    const add = (xp, gold = 0) => {
        result.xpMult += xp;
        result.goldMult += gold;
        result.reasons.push(cls.perk.label);
    };

    switch (cls.perk.id) {
        case 'steady':
            add(0.05);
            break;
        case 'oath':
            if (task.assignerId) add(0.15);
            break;
        case 'foresight':
            if (task.attribute === 'int' && dueAt && createdAt && dueAt - createdAt >= DAY_MS && workedFor >= MIN_REAL_WORK_MS) add(0.15);
            break;
        case 'early_bird':
            if (dueAt && dueAt - now >= DAY_MS) add(0, 0.25);
            break;
        case 'mend': {
            // Restarting a recurring quest whose streak had lapsed (last done before yesterday).
            if (isRecurring && task.lastCompletedDate) {
                const yesterday = new Date(now - DAY_MS).toDateString();
                const today = new Date(now).toDateString();
                if (task.lastCompletedDate !== today && task.lastCompletedDate !== yesterday) add(0.25);
            }
            break;
        }
        case 'trailblazer':
            if (task.projectId) add(0.15);
            break;
        case 'rage':
            if (task.difficulty >= 3 && (ctx.hardDoneToday || 0) >= 2) add(0.20);
            break;
        case 'ensemble':
            if (character.focusMessage) add(0.15);
            break;
        case 'cycles': {
            const h = new Date(now).getHours();
            if (isRecurring && (h < 9 || h >= 21)) add(0.10);
            break;
        }
        case 'raise_dead':
            if (dueAt && now - dueAt > 14 * DAY_MS) add(0.30);
            break;
        case 'off_plan':
            if (!task.dueDate && !task.projectId) add(0.10);
            break;
        case 'spark':
            if (!task.dueDate && createdAt && new Date(createdAt).toDateString() === new Date(now).toDateString() && workedFor >= MIN_REAL_WORK_MS) add(0.10);
            break;
        case 'discovery': {
            const kind = getQuestKind(task);
            if (!(character.discoveries || []).includes(kind)) {
                result.bonusXp += 10 * (task.difficulty || 1);
                result.discovery = kind;
                result.reasons.push(cls.perk.label);
            }
            break;
        }
        // 'discipline' (Monk) acts on the streak cap — see getStreakDaysCap.
        default:
            break;
    }
    return result;
};
