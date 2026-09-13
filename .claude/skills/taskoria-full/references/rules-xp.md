# Taskoria — rules & rewards reference (v0.1, design from scratch)

A complete, tunable D&D-style compensation system for turning real task completion into hero progress.
It is a **design proposal** grounded in the Bible's honesty rule and the numbers already shown on the
landing (XP values +10/+15/+25/+30/+50; a 12-day streak; ~100 XP per level around L15–20). Treat every
number as a starting point exposed as config, not a hard truth.

> **Golden rule (binding):** rewards flow only from *real* completion. Abandoning pays 0. No retroactive
> XP, no self-granted progress, no reward for a task that was not actually done.

---

## 1. Task difficulty tiers
The player sets a tier when creating a task (default Medium). Base pay:

| Tier | Base XP | Base Gold | Typical use |
|---|---|---|---|
| Trivial (T1) | 5 | 2 | 2-min chores, tick-boxes |
| Easy (T2) | 10 | 4 | short errands |
| Medium (T3) | 20 | 8 | a normal task/habit |
| Hard (T4) | 35 | 15 | a demanding task |
| Epic (T5) | 60 | 25 | a big, effortful task / milestone |

## 2. The six attributes (D&D-style) and task categories
Every task is tagged with a category; completing it grants XP to the hero **and +1 point to the matching
attribute**. Attributes are an *honest cumulative mirror* of what the player actually does.

| Attribute | Feeds on (category) | Examples |
|---|---|---|
| **STR** Fuerza | physical / effort | exercise, chores, moving, cleaning |
| **DEX** Destreza | errands / logistics / quick wins | emails, calls, admin, quick fixes |
| **CON** Constitución | health / routine / self-care | sleep, meals, hydration, breaks |
| **INT** Inteligencia | study / deep work / learning | reading, courses, writing, coding |
| **WILL** Voluntad | focus / discipline / finishing hard things | focus sessions, resisting distraction, shipping |
| **CHA** Carisma | social / communication / relationships | meetings, messages, helping, coworking |

Attribute soft bonus (optional, keep small): every **10 points** in an attribute → **+1% XP** on that
attribute's category (your strengths compound gently). Some content may gate on thresholds (e.g. a guild
officer role needs CHA ≥ X) — optional.

## 3. XP multipliers (they stack, applied to base XP)
`finalXP = round(baseXP × (1 + Σ bonuses))`, then apply anti-grind caps.

| Bonus | Value | Condition |
|---|---|---|
| Streak | +2% per consecutive day, **cap +30%** (reached at day 15) | habit completed today continuing a streak |
| On-time priority | +15% | a deadlined **high-priority** task finished before its deadline |
| Class synergy | +10% | task category matches the hero class archetype (§5) |
| Focus-dungeon | +20% | task completed inside a **completed** Pomodoro session |

Streak break = narrative "crack in the Forest": the streak bonus resets to 0 (unless a Phoenix/Cleric
effect applies, §6). Pet perks do **not** add to raw XP — they modify specific stats (§6) to avoid
inflation.

## 4. Leveling curve
XP required for level L → L+1:
- **L1–10:** 100 each (gentle onboarding; the bar reads "/100").
- **L11–25:** `100 + 15·(L−10)`  (e.g. L15 → 175, L20 → 250).
- **L26+:** `round(150 · 1.06^(L−25))`  (smooth exponential; L30 ≈ 190, L40 ≈ 340, L50 ≈ 610).

Level-up grants a `LevelUpModal`, a gold bonus (`= 10·L`), and may unlock class/feature milestones.
Cumulative XP to reach L: sum the per-level costs (compute in code; keep the formula, not a giant table).

## 5. Class synergy (each of the 14 classes)
Matching-category tasks get the **+10% class synergy**; on top, each class has a **signature perk** that
rewards *its* way of working. (Ties classes to real behaviour — see taskoria-lore for the archetypes.)

| Class | Signature perk (on top of +10% synergy) |
|---|---|
| Fighter | +5% XP on **every** completed task (the constant, reliable) |
| Paladin | +15% on tasks tagged *promise / for someone else* |
| Wizard | +15% on INT tasks that had a due-date set ≥1 day in advance (planned) |
| Rogue | +25% **gold** on tasks finished well before deadline (efficient) |
| Cleric | +25% XP when recovering a broken streak or redoing an abandoned task |
| Ranger | +15% on milestones of multi-day projects / weekly goals |
| Barbarian | +20% XP for the day when 3+ Hard/Epic tasks are done that day (burst) |
| Bard | +15% on tasks done in co-focus / party |
| Druid | +10% on habits tied to a time-of-day cycle (morning/night) |
| Monk | streak cap raised from +30% to **+45%** (deep constancy) |
| Necromancer | +30% on completing a task overdue **>14 days** (a "dead task") |
| Antipaladin | +10% on tasks finished with no subtasks / off the plan (their way) |
| Sorcerer | +10% on unplanned tasks created and done the same day (impulsive talent) |
| Scout | +discovery bonus (one-time XP) the first time a new feature/task type is used |

## 6. Pet & mount perks (how they plug into the rules)
Perks modify **specific** stats, not raw XP. Magnitude scales slightly with `Bond`.

| Companion | Perk in rules terms |
|---|---|
| Wolf → **Arctic Alpha** | +5% **damage in boss battles** (faster boss kills) |
| Lion → **Desert Sovereign** | +5% **resistance** → Shadow Mage chips less of the concentration bar |
| **Emberwyrm** | +8% reward on **STR-category** tasks / +8% boss damage |
| **Frostcoil** | +5 **INT** flat + **10% focus regen** (concentration recovers faster in Focus Dungeons) |
| **Tidewyrm** | +8% focus regen + **+5 stamina** (more focus sessions/day before fatigue) |
| **Phoenix** | on streak recovery, restores a % of the lost streak bonus (second chance; cumulative) |
| **Slime** | starter, no perk yet (roadmap) |
| **Griffin** (mount) | traversal/cosmetic; no combat perk (see `mountSpecies.js`) |

Hatching link: completing focus sessions adds **egg heat**; species is swayed by real effectiveness
(constancy, completed sessions, streak). See `resolveHatchSpecies` and taskoria-lore §5.

## 7. Combat math (productivity narrated as battle)
- **Focus Dungeon (Pomodoro):** `enemyHP = minutes × 10`; sustained focus deals `10 dmg/min` → finishing
  a full session defeats the enemy and drops **gold + a loot roll**. Distraction spawns/empowers the
  **Shadow Mage**, which chips a **concentration bar** (focus lost to distraction); `Lion resist` and focus-regen pets soften it.
  Pausing = tactical retreat (no penalty). Abandoning = dungeon unconquered, **no reward** (honesty).
- **Weekly Boss:** `HP = Σ committed weekly effort` of the party/guild; each completed quest deals its
  **finalXP as damage**. Collective — the boss falls as the group really works.
- **Epic Boss ("Summon an Epic Boss" — a user's long project):** `HP = user-declared effort points`;
  each completed **subtask/milestone** deals damage = its **tier value**. HP is bound to real declared
  scope, never a fixed script.

## 8. Gold economy
`gold ≈ round(finalXP × 0.40)` (plus tier base gold and Rogue's gold perk). Spent with **Coinhilda /
the Vault**: consumables, cosmetics, **pet adoption tokens**, Pixel-Studio/worldbuilding unlocks. The
shop **never** sells XP, levels, or attribute points — buying progress would break the golden rule.
Prices scale with hero level to keep gold meaningful.

## 9. Anti-grind & integrity guards
- **Trivial soft cap:** Trivial (T1) tasks beyond **8 completed per day** pay **0 XP/gold** (habit
  padding shouldn't farm levels).
- **Spam guard:** a task created and completed within a few seconds, repeatedly, is flagged and pays 0.
- **No retroactivity:** past-dated completions do not grant streak bonuses they didn't earn in real time.
- **Diminishing dailies:** optional soft decay if the *same* trivial habit is logged many times per day.

## 10. Tunable constants (expose in GameContext)
```js
export const RULES = {
  TIER_XP:   { trivial:5, easy:10, medium:20, hard:35, epic:60 },
  TIER_GOLD: { trivial:2, easy:4,  medium:8,  hard:15, epic:25 },
  GOLD_RATIO: 0.40,
  STREAK_PER_DAY: 0.02, STREAK_CAP: 0.30, MONK_STREAK_CAP: 0.45,
  ONTIME_PRIORITY: 0.15, CLASS_SYNERGY: 0.10, FOCUS_DUNGEON: 0.20,
  ATTR_SOFT_BONUS_PER_10: 0.01,
  LEVEL: { flatUntil:10, flatCost:100, midSlope:15, expBase:1.06, expAnchorLvl:25, expAnchorCost:150 },
  LEVELUP_GOLD_PER_LVL: 10,
  TRIVIAL_DAILY_CAP: 8,
  FOCUS: { dmgPerMin:10, hpPerMin:10 },
};
```
All values above are a starting balance; playtest and tune. Keep every reward auditable back to a real
completed action — that auditability *is* the design.
