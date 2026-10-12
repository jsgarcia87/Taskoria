<?php
// Duel engine — PHP port of src/utils/duelEngine.js. Same rules, same order of
// dice, same event schema: scripts/validate-duel.mjs feeds both the same dice and
// compares the output. Change a rule in one place, change it in the other.
//
// Every die goes through the $roll callable (returns an int 1..sides); the API
// passes a real RNG, tests pass a scripted one.

const DUEL_MAX_ROUNDS = 10;
const DUEL_LAST_STAND_DC = 12;
const DUEL_INSPIRATION_CAP = 3;
const DUEL_TASKS_PER_INSPIRATION = 3;
const DUEL_FOCUS_MIN_PER_INSPIRATION = 45;

function duel_family_sheet(string $family): array {
    $sheets = [
        'armored' => ['armor' => 4, 'weaponDie' => 8,  'weaponName' => 'Heavy weapon'],
        'common'  => ['armor' => 3, 'weaponDie' => 8,  'weaponName' => 'Light weapon'],
        'robed'   => ['armor' => 2, 'weaponDie' => 10, 'weaponName' => 'Arcane bolt'],
    ];
    return $sheets[$family] ?? $sheets['common'];
}

function duel_stances(): array {
    return [
        'aggressive' => ['id' => 'aggressive', 'attack' => 2,  'ac' => -2],
        'balanced'   => ['id' => 'balanced',   'attack' => 0,  'ac' => 0],
        'guarded'    => ['id' => 'guarded',    'attack' => -2, 'ac' => 2],
    ];
}

function duel_default_stance(string $family): string {
    return $family === 'armored' ? 'guarded' : ($family === 'robed' ? 'aggressive' : 'balanced');
}

// Compressed modifier (cap +3, floor -3) and the light-armour DEX cap: same as the JS engine.
const DUEL_MOD_CAP = 3;
const DUEL_MOD_FLOOR = -3;
const DUEL_DEX_ARMOR_CAP = 2;

function duel_mod($score): int {
    return max(DUEL_MOD_FLOOR, min(DUEL_MOD_CAP, (int) floor((((float) ($score ?: 10)) - 10) / 2)));
}

function duel_proficiency($level): int {
    return min(6, 2 + (int) floor((max(1, (int) $level) - 1) / 4));
}

function duel_classes(): array {
    static $table = null;
    if ($table === null) {
        $table = json_decode(file_get_contents(__DIR__ . '/duel_classes.json'), true) ?: [];
    }
    return $table;
}

function duel_inspiration_from_work(array $char, string $today): int {
    $day = $char['activityHistory'][$today] ?? null;
    $tasks = is_array($day) ? (int) ($day['tasks'] ?? 0) : (int) $day;
    $minutes = is_array($day) ? (int) ($day['minutes'] ?? 0) : 0;
    return min(
        DUEL_INSPIRATION_CAP,
        intdiv($tasks, DUEL_TASKS_PER_INSPIRATION) + intdiv($minutes, DUEL_FOCUS_MIN_PER_INSPIRATION)
    );
}

/** The tabletop sheet of a hero (mirror of buildCombatant). */
function duel_build_combatant(array $char, string $today): array {
    $cls = duel_classes()[$char['class'] ?? ''] ?? null;
    $family = $cls['family'] ?? 'common';
    $sheet = duel_family_sheet($family);
    $stats = $char['stats'] ?? [];
    $level = max(1, (int) ($char['level'] ?? 1));
    $combatKeys = !empty($cls['combatStats']) ? $cls['combatStats'] : ['str'];
    $attackStat = $combatKeys[0];
    foreach ($combatKeys as $k) {
        if (duel_mod($stats[$k] ?? 10) > duel_mod($stats[$attackStat] ?? 10)) $attackStat = $k;
    }
    $attackMod = duel_mod($stats[$attackStat] ?? 10);
    return [
        'name' => $char['name'] ?? 'Hero',
        'className' => $cls ? ($char['class'] ?? 'Adventurer') : ($char['class'] ?? 'Adventurer'),
        'family' => $family,
        'level' => $level,
        'avatarId' => $char['avatarId'] ?? ($cls['avatarType'] ?? 'warrior'),
        'avatarColors' => $char['avatarColors'] ?? null,
        'attackStat' => $attackStat,
        'attackMod' => $attackMod,
        'attackBonus' => $attackMod + duel_proficiency($level),
        'dexMod' => duel_mod($stats['dex'] ?? 10),
        'willMod' => duel_mod($stats['will'] ?? 10),
        'armorClass' => max(8, 10 + min(DUEL_DEX_ARMOR_CAP, duel_mod($stats['dex'] ?? 10)) + $sheet['armor']),
        'maxHp' => max(10, 8 + $level * 3 + duel_mod($stats['con'] ?? 10) * 2),
        'weaponDie' => $sheet['weaponDie'],
        'weaponName' => $sheet['weaponName'],
        'inspiration' => duel_inspiration_from_work($char, $today),
        'defaultStance' => duel_default_stance($family),
    ];
}

function duel_fumble(int $d6): array {
    $slip = ['id' => 'slip', 'text' => 'loses their footing', 'acPenalty' => 2, 'attackPenalty' => 0];
    $weapon = ['id' => 'weapon', 'text' => 'fumbles their grip', 'acPenalty' => 0, 'attackPenalty' => 2];
    $none = ['id' => 'none', 'text' => 'recovers with a nervous grin', 'acPenalty' => 0, 'attackPenalty' => 0];
    return [$slip, $slip, $weapon, $weapon, $none, $none][$d6 - 1];
}

/**
 * Plays a whole duel. $a challenges $b. $stances = ['a' => id, 'b' => id] (missing = class default).
 * @return array{events: array, winner: string, reason: string, hp: array, rounds: int}
 */
function duel_run(array $a, array $b, array $stancesIn, callable $roll): array {
    $all = duel_stances();
    $side = ['a' => $a, 'b' => $b];
    $stance = [
        'a' => $all[$stancesIn['a'] ?? ''] ?? $all[$a['defaultStance']],
        'b' => $all[$stancesIn['b'] ?? ''] ?? $all[$b['defaultStance']],
    ];
    $hp = ['a' => $a['maxHp'], 'b' => $b['maxHp']];
    $inspiration = ['a' => $a['inspiration'], 'b' => $b['inspiration']];
    $lastStand = ['a' => false, 'b' => false];
    $slip = ['a' => 0, 'b' => 0];
    $grip = ['a' => 0, 'b' => 0];
    $other = fn($w) => $w === 'a' ? 'b' : 'a';
    $clamp = fn($h) => ['a' => max(0, $h['a']), 'b' => max(0, $h['b'])];
    $events = [];

    $events[] = ['t' => 'start', 'a' => $a, 'b' => $b, 'stances' => ['a' => $stance['a']['id'], 'b' => $stance['b']['id']]];

    $init = [];
    foreach (['a', 'b'] as $w) {
        $d20 = $roll(20);
        $init[$w] = ['who' => $w, 'd20' => $d20, 'mod' => $side[$w]['dexMod'], 'total' => $d20 + $side[$w]['dexMod']];
    }
    $order = ['a', 'b'];
    if ($init['b']['total'] > $init['a']['total']) $order = ['b', 'a'];
    elseif ($init['b']['total'] === $init['a']['total']) {
        if ($b['dexMod'] > $a['dexMod']) $order = ['b', 'a'];
        elseif ($b['dexMod'] === $a['dexMod']) {
            $ta = $roll(20); $tb = $roll(20);
            $init['a']['tiebreak'] = $ta; $init['b']['tiebreak'] = $tb;
            if ($tb > $ta) $order = ['b', 'a'];
        }
    }
    $events[] = ['t' => 'initiative', 'rolls' => [$init['a'], $init['b']], 'order' => $order];

    $rounds = 0;
    $winner = null;
    $reason = 'rounds';

    for ($r = 1; $r <= DUEL_MAX_ROUNDS && !$winner; $r++) {
        $rounds = $r;
        $events[] = ['t' => 'round', 'n' => $r];
        foreach ($order as $who) {
            $foe = $other($who);
            $slip[$who] = 0;
            $attackStance = $stance[$who]['attack'] - $grip[$who];
            $targetAc = max(5, $side[$foe]['armorClass'] + $stance[$foe]['ac'] - $slip[$foe]);

            $rolls = [$roll(20)];
            $inspired = false;
            $needed = fn($d) => $d === 20 || ($d !== 1 && $d + $side[$who]['attackBonus'] + $attackStance >= $targetAc);
            if (!$needed($rolls[0]) && $inspiration[$who] > 0) {
                $inspiration[$who] -= 1;
                $inspired = true;
                $rolls[] = $roll(20);
            }
            $d20 = $rolls[count($rolls) - 1];
            $bonus = $side[$who]['attackBonus'] + $attackStance;
            $total = $d20 + $bonus;
            $crit = $d20 === 20;
            $fumble = $d20 === 1;
            $hit = $crit || (!$fumble && $total >= $targetAc);
            $grip[$who] = 0;
            $ev = [
                't' => 'attack', 'who' => $who, 'target' => $foe, 'rolls' => $rolls, 'inspired' => $inspired,
                'bonus' => $bonus, 'total' => $total, 'ac' => $targetAc,
                'hit' => $hit, 'crit' => $crit, 'fumble' => $fumble, 'inspirationLeft' => $inspiration[$who],
            ];
            if ($fumble) {
                $d6 = $roll(6);
                $f = duel_fumble($d6);
                $ev['fumbleRoll'] = $d6; $ev['fumbleText'] = $f['text']; $ev['fumbleId'] = $f['id'];
                $slip[$who] = $f['acPenalty']; $grip[$who] = $f['attackPenalty'];
            }
            $events[] = $ev;

            if ($hit) {
                $dice = [];
                for ($i = 0, $n = $crit ? 2 : 1; $i < $n; $i++) $dice[] = $roll($side[$who]['weaponDie']);
                $dmgTotal = max(1, array_sum($dice) + $side[$who]['attackMod']);
                $hp[$foe] -= $dmgTotal;
                $events[] = [
                    't' => 'damage', 'who' => $who, 'target' => $foe, 'die' => $side[$who]['weaponDie'], 'dice' => $dice,
                    'mod' => $side[$who]['attackMod'], 'total' => $dmgTotal, 'crit' => $crit, 'hp' => $clamp($hp),
                ];
                if ($hp[$foe] <= 0) {
                    if (!$lastStand[$foe]) {
                        $lastStand[$foe] = true;
                        $ls = $roll(20);
                        $lsTotal = $ls + $side[$foe]['willMod'];
                        $saved = $ls === 20 || ($ls !== 1 && $lsTotal >= DUEL_LAST_STAND_DC);
                        $hp[$foe] = $saved ? ($ls === 20 ? 5 : 1) : 0;
                        $events[] = ['t' => 'lastStand', 'who' => $foe, 'd20' => $ls, 'mod' => $side[$foe]['willMod'], 'total' => $lsTotal, 'dc' => DUEL_LAST_STAND_DC, 'saved' => $saved, 'hp' => $clamp($hp)];
                    }
                    if ($hp[$foe] <= 0) { $winner = $who; $reason = 'ko'; break; }
                }
            }
        }
    }

    if (!$winner) {
        $pa = $hp['a'] / $a['maxHp'];
        $pb = $hp['b'] / $b['maxHp'];
        $winner = $pa > $pb ? 'a' : ($pb > $pa ? 'b' : $order[0]);
    }
    $final = $clamp($hp);
    $events[] = ['t' => 'end', 'winner' => $winner, 'reason' => $reason, 'rounds' => $rounds, 'hp' => $final];
    return ['events' => $events, 'winner' => $winner, 'reason' => $reason, 'rounds' => $rounds, 'hp' => $final];
}
