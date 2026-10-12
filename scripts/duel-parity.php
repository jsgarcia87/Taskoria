<?php
// Reads {cases:[...]} on stdin, plays each duel with a scripted dice list, prints the results.
// Used by scripts/validate-duel.mjs to prove the PHP engine matches the JS one.
require __DIR__ . '/../api/lib/duel.php';
$in = json_decode(stream_get_contents(STDIN), true);
$out = [];
foreach ($in['cases'] as $c) {
    $dice = $c['dice']; $i = 0; $n = count($dice);
    $roll = function (int $sides) use (&$i, $dice, $n) { $v = $dice[$i++ % $n]; return (($v - 1) % $sides) + 1; };
    $a = duel_build_combatant($c['a'], $c['today']);
    $b = duel_build_combatant($c['b'], $c['today']);
    $out[] = duel_run($a, $b, $c['stances'], $roll);
}
echo json_encode($out);
