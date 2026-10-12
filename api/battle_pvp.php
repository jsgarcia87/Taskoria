<?php
// api/battle_pvp.php — duels between friends, played like a tabletop session.
//
// A duel is a challenge the rival has to take up:
//   POST {action:'preview',   attacker_id, defender_id [, today]}   → both heroes' sheets
//   POST {action:'challenge', attacker_id, defender_id, stance}     → sends the challenge (stance stays sealed)
//   GET  ?action=inbox&user_id= [&today=]   → incoming/outgoing challenges + finished duels
//   GET  ?action=pending_count&user_id=     → what the nav badge shows
//   POST {action:'respond',   user_id, challenge_id, decision:'accept'|'decline', stance [, today]}
//        → on accept the duel is rolled here and returned as an event list
//   POST {action:'cancel',    user_id, challenge_id}                → the challenger withdraws it
//   GET  ?action=watch&user_id=&challenge_id=   → replay of a finished duel (marks it as seen)
//   GET  ?action=history&user_id=               → the last duels of a hero
//
// The rules live in api/lib/duel.php (mirror of src/utils/duelEngine.js). Every die is
// rolled HERE with random_int(); the browser only replays what the server decided.
// Challenges are "honor" duels: nothing is taken from either save, so a rival's stale
// autosave can never undo the result.
require_once 'db.php';
require_once __DIR__ . '/lib/duel.php';

header('Content-Type: application/json');

const DUEL_CHALLENGE_TTL_HOURS = 24;
const DUEL_MAX_OUTGOING = 3;
const DUEL_RESULT_DAYS = 7;

function duel_fail(string $msg, int $code = 400): void {
    http_response_code($code);
    echo json_encode(['error' => $msg]);
    exit;
}

function &duel_character_ref(array &$saveData) {
    $null = null;
    if (isset($saveData['character'])) {
        return $saveData['character'];
    }
    if (isset($saveData['profiles']) && is_array($saveData['profiles']) && count($saveData['profiles']) > 0) {
        $activeId = $saveData['lastActiveProfile'] ?? $saveData['profiles'][0]['id'];
        foreach ($saveData['profiles'] as &$prof) {
            if (($prof['id'] ?? null) === $activeId) {
                if (!isset($prof['state'])) $prof['state'] = [];
                if (!isset($prof['state']['character'])) $prof['state']['character'] = null;
                return $prof['state']['character'];
            }
        }
    }
    return $null;
}

function duel_are_friends(PDO $pdo, int $a, int $b): bool {
    try {
        $s = $pdo->prepare("SELECT 1 FROM friendships WHERE status = 'accepted' AND ((requester_id = ? AND addressee_id = ?) OR (requester_id = ? AND addressee_id = ?)) LIMIT 1");
        $s->execute([$a, $b, $b, $a]);
        return (bool) $s->fetch();
    } catch (Exception $e) {
        return false;      // no friendships table yet → nobody is a friend yet
    }
}

function duel_ensure_table(PDO $pdo): void {
    $pdo->exec("CREATE TABLE IF NOT EXISTS duels (
        id INT AUTO_INCREMENT PRIMARY KEY,
        attacker_id INT NOT NULL,
        defender_id INT NOT NULL,
        winner VARCHAR(10) NOT NULL,
        rounds INT NOT NULL,
        events MEDIUMTEXT NOT NULL,
        spoils TEXT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_attacker (attacker_id),
        INDEX idx_defender (defender_id)
    )");
    $pdo->exec("CREATE TABLE IF NOT EXISTS duel_challenges (
        id INT AUTO_INCREMENT PRIMARY KEY,
        challenger_id INT NOT NULL,
        defender_id INT NOT NULL,
        challenger_stance VARCHAR(16) NOT NULL,
        defender_stance VARCHAR(16) NULL,
        status VARCHAR(12) NOT NULL DEFAULT 'pending',
        duel_id INT NULL,
        seen_by_challenger TINYINT NOT NULL DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        responded_at TIMESTAMP NULL,
        INDEX idx_defender_status (defender_id, status),
        INDEX idx_challenger_status (challenger_id, status)
    )");
}

// "Today" for the Inspiration count: the client's calendar day, but never further than a day from ours.
function duel_today(?string $clientToday): string {
    $server = date('Y-m-d');
    if ($clientToday && preg_match('/^\d{4}-\d{2}-\d{2}$/', $clientToday)) {
        $diff = abs((strtotime($clientToday) - strtotime($server)) / 86400);
        if ($diff <= 1) return $clientToday;
    }
    return $server;
}

/** Character sheets of several users, keyed by user id. Missing / character-less heroes are absent. */
function duel_sheets(PDO $pdo, array $ids, string $today): array {
    $ids = array_values(array_unique(array_map('intval', $ids)));
    if (!$ids) return [];
    $in = implode(',', array_fill(0, count($ids), '?'));
    $stmt = $pdo->prepare("SELECT user_id, save_data FROM game_saves WHERE user_id IN ($in)");
    $stmt->execute($ids);
    $out = [];
    foreach ($stmt->fetchAll() as $row) {
        $save = json_decode($row['save_data'], true);
        if (!is_array($save)) continue;
        $char = duel_character_ref($save);
        if ($char) $out[(int) $row['user_id']] = duel_build_combatant($char, $today);
    }
    return $out;
}

/** What the other side may see of a hero before the duel (never their stance). */
function duel_public_sheet(?array $c): ?array {
    if (!$c) return null;
    return [
        'name' => $c['name'], 'className' => $c['className'], 'family' => $c['family'], 'level' => $c['level'],
        'avatarId' => $c['avatarId'], 'avatarColors' => $c['avatarColors'],
        'maxHp' => $c['maxHp'], 'armorClass' => $c['armorClass'], 'attackBonus' => $c['attackBonus'], 'attackMod' => $c['attackMod'],
        'weaponDie' => $c['weaponDie'], 'weaponName' => $c['weaponName'], 'inspiration' => $c['inspiration'],
        'attackStat' => $c['attackStat'], 'defaultStance' => $c['defaultStance'],
    ];
}

function duel_expire_old(PDO $pdo): void {
    $cutoff = date('Y-m-d H:i:s', time() - DUEL_CHALLENGE_TTL_HOURS * 3600);
    $s = $pdo->prepare("UPDATE duel_challenges SET status = 'expired', responded_at = CURRENT_TIMESTAMP WHERE status = 'pending' AND created_at < ?");
    $s->execute([$cutoff]);
}

function duel_valid_stance($id): bool {
    return is_string($id) && isset(duel_stances()[$id]);
}

function duel_challenge_row(PDO $pdo, int $id): ?array {
    $s = $pdo->prepare("SELECT * FROM duel_challenges WHERE id = ?");
    $s->execute([$id]);
    $row = $s->fetch();
    return $row ?: null;
}

$body = json_decode(file_get_contents('php://input'), true) ?: [];
$action = $_GET['action'] ?? ($body['action'] ?? '');

try {
    if ($action === 'history') {
        $uid = (int) ($_GET['user_id'] ?? 0);
        if (!$uid) duel_fail('Missing user_id');
        duel_ensure_table($pdo);
        $s = $pdo->prepare("SELECT id, attacker_id, defender_id, winner, rounds, spoils, created_at FROM duels WHERE attacker_id = ? OR defender_id = ? ORDER BY id DESC LIMIT 10");
        $s->execute([$uid, $uid]);
        echo json_encode(['duels' => $s->fetchAll()]);
        exit;
    }

    // ── pending_count: the badge ─────────────────────────────────────────────
    if ($action === 'pending_count') {
        $uid = (int) ($_GET['user_id'] ?? 0);
        if (!$uid) duel_fail('Missing user_id');
        duel_ensure_table($pdo);
        duel_expire_old($pdo);
        $in = $pdo->prepare("SELECT COUNT(*) FROM duel_challenges WHERE defender_id = ? AND status = 'pending'");
        $in->execute([$uid]);
        $res = $pdo->prepare("SELECT COUNT(*) FROM duel_challenges WHERE challenger_id = ? AND seen_by_challenger = 0 AND status IN ('accepted','declined')");
        $res->execute([$uid]);
        echo json_encode(['incoming' => (int) $in->fetchColumn(), 'results' => (int) $res->fetchColumn()]);
        exit;
    }

    // ── inbox ────────────────────────────────────────────────────────────────
    if ($action === 'inbox') {
        $uid = (int) ($_GET['user_id'] ?? 0);
        if (!$uid) duel_fail('Missing user_id');
        $today = duel_today($_GET['today'] ?? null);
        duel_ensure_table($pdo);
        duel_expire_old($pdo);
        $since = date('Y-m-d H:i:s', time() - DUEL_RESULT_DAYS * 86400);
        $s = $pdo->prepare("SELECT c.*, d.winner AS duel_winner, d.rounds AS duel_rounds FROM duel_challenges c
            LEFT JOIN duels d ON d.id = c.duel_id
            WHERE (c.challenger_id = ? OR c.defender_id = ?) AND (c.status = 'pending' OR (c.status IN ('accepted','declined','expired') AND c.created_at >= ?))
            ORDER BY c.id DESC LIMIT 40");
        $s->execute([$uid, $uid, $since]);
        $rows = $s->fetchAll();
        $ids = [$uid];
        foreach ($rows as $r) { $ids[] = (int) $r['challenger_id']; $ids[] = (int) $r['defender_id']; }
        $sheets = duel_sheets($pdo, $ids, $today);

        $incoming = []; $outgoing = []; $finished = [];
        foreach ($rows as $r) {
            $mine = (int) $r['challenger_id'] === $uid ? 'challenger' : 'defender';
            $otherId = $mine === 'challenger' ? (int) $r['defender_id'] : (int) $r['challenger_id'];
            $item = [
                'id' => (int) $r['id'], 'status' => $r['status'], 'createdAt' => $r['created_at'], 'respondedAt' => $r['responded_at'],
                'me' => $mine, 'otherId' => $otherId, 'other' => duel_public_sheet($sheets[$otherId] ?? null),
                'duelId' => $r['duel_id'] !== null ? (int) $r['duel_id'] : null,
                'expiresAt' => date('c', strtotime($r['created_at']) + DUEL_CHALLENGE_TTL_HOURS * 3600),
            ];
            if ($r['duel_id'] !== null) {
                // winner is stored as attacker|defender; attacker = challenger
                $item['won'] = ($r['duel_winner'] === 'attacker') === ($mine === 'challenger');
                $item['rounds'] = (int) $r['duel_rounds'];
                $item['unseen'] = $mine === 'challenger' && (int) $r['seen_by_challenger'] === 0;
            }
            if ($r['status'] === 'declined') $item['unseen'] = $mine === 'challenger' && (int) $r['seen_by_challenger'] === 0;
            if ($r['status'] === 'pending') {
                if ($mine === 'defender') $incoming[] = $item; else $outgoing[] = $item;
            } else {
                $finished[] = $item;
            }
        }
        echo json_encode([
            'me' => duel_public_sheet($sheets[$uid] ?? null),
            'stances' => duel_stances(),
            'incoming' => $incoming, 'outgoing' => $outgoing, 'finished' => array_slice($finished, 0, 12),
        ]);
        exit;
    }

    // ── watch: replay of a finished duel ─────────────────────────────────────
    if ($action === 'watch') {
        $uid = (int) ($_GET['user_id'] ?? 0);
        $cid = (int) ($_GET['challenge_id'] ?? 0);
        if (!$uid || !$cid) duel_fail('Missing IDs');
        duel_ensure_table($pdo);
        $c = duel_challenge_row($pdo, $cid);
        if (!$c || ((int) $c['challenger_id'] !== $uid && (int) $c['defender_id'] !== $uid)) duel_fail('Duel not found.', 404);
        if ($c['duel_id'] === null) duel_fail('This challenge was never fought.', 404);
        $d = $pdo->prepare("SELECT * FROM duels WHERE id = ?");
        $d->execute([$c['duel_id']]);
        $duel = $d->fetch();
        if (!$duel) duel_fail('Duel not found.', 404);
        if ((int) $c['challenger_id'] === $uid && !(int) $c['seen_by_challenger']) {
            $pdo->prepare("UPDATE duel_challenges SET seen_by_challenger = 1 WHERE id = ?")->execute([$cid]);
        }
        $events = json_decode($duel['events'], true) ?: [];
        $end = null;
        foreach ($events as $ev) if (($ev['t'] ?? '') === 'end') $end = $ev;
        echo json_encode([
            'viewerSide' => (int) $c['challenger_id'] === $uid ? 'a' : 'b',
            'duel' => ['id' => (int) $duel['id'], 'events' => $events, 'reason' => $end['reason'] ?? 'ko', 'rounds' => (int) $duel['rounds'], 'hp' => $end['hp'] ?? null],
        ]);
        exit;
    }

    // ── cancel ───────────────────────────────────────────────────────────────
    if ($action === 'cancel') {
        $uid = (int) ($body['user_id'] ?? 0);
        $cid = (int) ($body['challenge_id'] ?? 0);
        if (!$uid || !$cid) duel_fail('Missing IDs');
        duel_ensure_table($pdo);
        $s = $pdo->prepare("UPDATE duel_challenges SET status = 'cancelled', responded_at = CURRENT_TIMESTAMP WHERE id = ? AND challenger_id = ? AND status = 'pending'");
        $s->execute([$cid, $uid]);
        if ($s->rowCount() === 0) duel_fail('That challenge is no longer pending.', 409);
        echo json_encode(['ok' => true]);
        exit;
    }

    // ── respond: accept (rolls the duel) or decline ──────────────────────────
    if ($action === 'respond') {
        $uid = (int) ($body['user_id'] ?? 0);
        $cid = (int) ($body['challenge_id'] ?? 0);
        $decision = $body['decision'] ?? '';
        if (!$uid || !$cid) duel_fail('Missing IDs');
        if (!in_array($decision, ['accept', 'decline'], true)) duel_fail('Unknown decision.');
        $stance = $body['stance'] ?? null;
        if ($decision === 'accept' && $stance !== null && !duel_valid_stance($stance)) duel_fail('Unknown stance.');
        $today = duel_today($body['today'] ?? null);

        $pdo->beginTransaction();
        duel_ensure_table($pdo);
        $lock = $pdo->prepare("SELECT * FROM duel_challenges WHERE id = ? FOR UPDATE");
        $lock->execute([$cid]);
        $c = $lock->fetch();
        if (!$c || (int) $c['defender_id'] !== $uid) { $pdo->rollBack(); duel_fail('Challenge not found.', 404); }
        if ($c['status'] !== 'pending') { $pdo->rollBack(); duel_fail('That challenge is no longer pending.', 409); }
        if (strtotime($c['created_at']) < time() - DUEL_CHALLENGE_TTL_HOURS * 3600) {
            $pdo->prepare("UPDATE duel_challenges SET status = 'expired', responded_at = CURRENT_TIMESTAMP WHERE id = ?")->execute([$cid]);
            $pdo->commit();
            duel_fail('That challenge has expired.', 410);
        }

        if ($decision === 'decline') {
            $pdo->prepare("UPDATE duel_challenges SET status = 'declined', responded_at = CURRENT_TIMESTAMP WHERE id = ?")->execute([$cid]);
            $pdo->commit();
            echo json_encode(['ok' => true, 'status' => 'declined']);
            exit;
        }

        $challengerId = (int) $c['challenger_id'];
        $sheets = duel_sheets($pdo, [$challengerId, $uid], $today);
        if (!isset($sheets[$challengerId], $sheets[$uid])) { $pdo->rollBack(); duel_fail('One of the heroes has no character yet.', 404); }
        $A = $sheets[$challengerId];
        $B = $sheets[$uid];
        $result = duel_run($A, $B, ['a' => $c['challenger_stance'], 'b' => $stance], fn(int $sides): int => random_int(1, $sides));
        $challengerWon = $result['winner'] === 'a';
        $usedStance = $result['events'][0]['stances']['b'];

        $pdo->prepare("INSERT INTO duels (attacker_id, defender_id, winner, rounds, events, spoils) VALUES (?, ?, ?, ?, ?, ?)")
            ->execute([$challengerId, $uid, $challengerWon ? 'attacker' : 'defender', $result['rounds'], json_encode($result['events']), json_encode(['type' => 'honor'])]);
        $duelId = (int) $pdo->lastInsertId();
        $pdo->prepare("UPDATE duel_challenges SET status = 'accepted', defender_stance = ?, duel_id = ?, responded_at = CURRENT_TIMESTAMP WHERE id = ?")
            ->execute([$usedStance, $duelId, $cid]);
        $pdo->commit();

        echo json_encode([
            'ok' => true, 'status' => 'accepted', 'viewerSide' => 'b',
            'won' => !$challengerWon,
            'duel' => ['id' => $duelId, 'events' => $result['events'], 'reason' => $result['reason'], 'rounds' => $result['rounds'], 'hp' => $result['hp']],
        ]);
        exit;
    }

    // ── preview / challenge: need both ids and a friendship ──────────────────
    $attacker_id = (int) ($body['attacker_id'] ?? 0);
    $defender_id = (int) ($body['defender_id'] ?? 0);
    if ($action === 'duel') duel_fail('Duels are now challenges: the rival has to accept. Update the app.', 410);
    if (!$attacker_id || !$defender_id) duel_fail('Missing IDs');
    if ($attacker_id === $defender_id) duel_fail('You cannot duel yourself.');
    if (!duel_are_friends($pdo, $attacker_id, $defender_id)) duel_fail('You can only challenge friends who accepted you.', 403);
    $today = duel_today($body['today'] ?? null);

    if ($action === 'preview') {
        $sheets = duel_sheets($pdo, [$attacker_id, $defender_id], $today);
        if (!isset($sheets[$attacker_id], $sheets[$defender_id])) duel_fail('One of the heroes has no character yet.', 404);
        echo json_encode(['a' => $sheets[$attacker_id], 'b' => duel_public_sheet($sheets[$defender_id]), 'stances' => duel_stances()]);
        exit;
    }

    if ($action === 'challenge') {
        $stance = $body['stance'] ?? null;
        if (!duel_valid_stance($stance)) duel_fail('Choose a stance first.');
        duel_ensure_table($pdo);
        duel_expire_old($pdo);
        $sheets = duel_sheets($pdo, [$attacker_id, $defender_id], $today);
        if (!isset($sheets[$attacker_id], $sheets[$defender_id])) duel_fail('One of the heroes has no character yet.', 404);

        $dup = $pdo->prepare("SELECT 1 FROM duel_challenges WHERE status = 'pending' AND ((challenger_id = ? AND defender_id = ?) OR (challenger_id = ? AND defender_id = ?)) LIMIT 1");
        $dup->execute([$attacker_id, $defender_id, $defender_id, $attacker_id]);
        if ($dup->fetch()) duel_fail('There is already an open challenge between you two.', 409);
        $cap = $pdo->prepare("SELECT COUNT(*) FROM duel_challenges WHERE challenger_id = ? AND status = 'pending'");
        $cap->execute([$attacker_id]);
        if ((int) $cap->fetchColumn() >= DUEL_MAX_OUTGOING) duel_fail('You already have ' . DUEL_MAX_OUTGOING . ' open challenges. Wait for an answer first.', 429);

        $pdo->prepare("INSERT INTO duel_challenges (challenger_id, defender_id, challenger_stance) VALUES (?, ?, ?)")
            ->execute([$attacker_id, $defender_id, $stance]);
        echo json_encode(['ok' => true, 'challengeId' => (int) $pdo->lastInsertId(), 'foe' => duel_public_sheet($sheets[$defender_id]),
            'expiresAt' => date('c', time() + DUEL_CHALLENGE_TTL_HOURS * 3600)]);
        exit;
    }

    duel_fail('Unknown action.');
} catch (Exception $e) {
    if ($pdo->inTransaction()) $pdo->rollBack();
    http_response_code(500);
    error_log('Duel error: ' . $e->getMessage());
    echo json_encode(['error' => 'The duel could not be fought.']);
}
