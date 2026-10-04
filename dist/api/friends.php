<?php
// api/friends.php — mutual friendships: a friend only counts once BOTH sides agreed.
//
//   GET  ?action=list&user_id=      → { friends, incoming, outgoing }
//   GET  ?action=pending_count&user_id=
//   POST ?action=request       { user_id, target_id }
//   POST ?action=respond       { user_id, request_id, accept }
//   POST ?action=remove        { user_id, other_id }      (unfriend / cancel / decline)
//   POST ?action=import_legacy { user_id, friend_ids[] }  (one-time move from the old local lists)
header('Content-Type: application/json');
require_once 'db.php';

// Auto-migrate (same convention as guilds.php / creations.php).
try {
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS friendships (
            id INT AUTO_INCREMENT PRIMARY KEY,
            requester_id INT NOT NULL,
            addressee_id INT NOT NULL,
            status VARCHAR(10) NOT NULL DEFAULT 'pending',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            responded_at TIMESTAMP NULL DEFAULT NULL,
            UNIQUE KEY uniq_pair (requester_id, addressee_id),
            KEY idx_addressee (addressee_id, status),
            FOREIGN KEY (requester_id) REFERENCES users(id) ON DELETE CASCADE,
            FOREIGN KEY (addressee_id) REFERENCES users(id) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8;
    ");
} catch (PDOException $e) {
    error_log('friends migrate: ' . $e->getMessage());
}

const MAX_OUTGOING_PENDING = 50;

// The ONE place that decides who is calling. The rest of the API trusts the
// client-supplied id today; when session tokens land, resolve it here and ignore the body.
function friends_caller_id(array $body): int {
    return (int)($_GET['user_id'] ?? ($body['user_id'] ?? 0));
}

function fail(string $msg, int $code = 400): void {
    http_response_code($code);
    echo json_encode(['error' => $msg]);
    exit;
}

function user_exists(PDO $pdo, int $id): bool {
    $s = $pdo->prepare('SELECT id FROM users WHERE id = ?');
    $s->execute([$id]);
    return (bool)$s->fetch();
}

// The active character of a save (old single-hero format or the family format).
function extract_character(?string $saveData): ?array {
    if (!$saveData) return null;
    $data = json_decode($saveData, true);
    if (!is_array($data)) return null;
    $char = $data['character'] ?? null;
    if (!$char && !empty($data['profiles'])) {
        $activeId = $data['lastActiveProfile'] ?? $data['profiles'][0]['id'];
        foreach ($data['profiles'] as $prof) {
            if (($prof['id'] ?? null) === $activeId && isset($prof['state']['character'])) {
                $char = $prof['state']['character'];
                break;
            }
        }
    }
    if (!$char) return null;
    return [
        'name' => $char['name'] ?? null,
        'level' => $char['level'] ?? 1,
        'class' => $char['class'] ?? null,
        'avatarId' => $char['avatarId'] ?? null,
        'avatarColors' => $char['avatarColors'] ?? null,
    ];
}

// Did $ownerId's old local list already contain $otherId?
function legacy_list_contains(PDO $pdo, int $ownerId, int $otherId): bool {
    $s = $pdo->prepare('SELECT save_data FROM game_saves WHERE user_id = ?');
    $s->execute([$ownerId]);
    $row = $s->fetch();
    if (!$row) return false;
    $data = json_decode($row['save_data'], true);
    foreach (($data['friends'] ?? []) as $f) {
        if ((string)($f['id'] ?? '') === (string)$otherId) return true;
    }
    return false;
}

function find_pair(PDO $pdo, int $a, int $b): ?array {
    $s = $pdo->prepare('SELECT * FROM friendships WHERE (requester_id = ? AND addressee_id = ?) OR (requester_id = ? AND addressee_id = ?)');
    $s->execute([$a, $b, $b, $a]);
    return $s->fetch() ?: null;
}

function insert_pair(PDO $pdo, int $requester, int $addressee, string $status): void {
    $s = $pdo->prepare('INSERT INTO friendships (requester_id, addressee_id, status, responded_at) VALUES (?, ?, ?, ?)');
    $s->execute([$requester, $addressee, $status, $status === 'accepted' ? date('Y-m-d H:i:s') : null]);
}

function accept_row(PDO $pdo, int $id): void {
    $pdo->prepare("UPDATE friendships SET status = 'accepted', responded_at = ? WHERE id = ?")
        ->execute([date('Y-m-d H:i:s'), $id]);
}

function outgoing_pending_count(PDO $pdo, int $me): int {
    $s = $pdo->prepare("SELECT COUNT(*) AS c FROM friendships WHERE requester_id = ? AND status = 'pending'");
    $s->execute([$me]);
    return (int)$s->fetch()['c'];
}

try {
    $action = $_GET['action'] ?? '';
    $body = $_SERVER['REQUEST_METHOD'] === 'POST'
        ? (json_decode(file_get_contents('php://input'), true) ?: [])
        : [];
    $me = friends_caller_id($body);
    if ($me <= 0 || !user_exists($pdo, $me)) fail('User ID required');

    if ($action === 'pending_count') {
        $s = $pdo->prepare("SELECT COUNT(*) AS c FROM friendships WHERE addressee_id = ? AND status = 'pending'");
        $s->execute([$me]);
        echo json_encode(['success' => true, 'incoming' => (int)$s->fetch()['c']]);
        exit;
    }

    if ($action === 'list') {
        $s = $pdo->prepare("
            SELECT f.id AS request_id, f.requester_id, f.addressee_id, f.status,
                   u.id, u.username, u.last_active_at, gs.save_data
            FROM friendships f
            JOIN users u ON u.id = CASE WHEN f.requester_id = ? THEN f.addressee_id ELSE f.requester_id END
            LEFT JOIN game_saves gs ON gs.user_id = u.id
            WHERE f.requester_id = ? OR f.addressee_id = ?
            ORDER BY f.created_at DESC
        ");
        $s->execute([$me, $me, $me]);

        $out = ['friends' => [], 'incoming' => [], 'outgoing' => []];
        foreach ($s->fetchAll() as $row) {
            $item = [
                'id' => (int)$row['id'],
                'username' => $row['username'],
                'character' => extract_character($row['save_data']),
                'is_online' => $row['last_active_at'] ? (time() - strtotime($row['last_active_at'])) < 300 : false,
            ];
            if ($row['status'] === 'accepted') {
                $out['friends'][] = $item;
            } elseif ((int)$row['requester_id'] === $me) {
                $out['outgoing'][] = $item;
            } else {
                $item['request_id'] = (int)$row['request_id'];
                $out['incoming'][] = $item;
            }
        }
        echo json_encode(['success' => true] + $out);
        exit;
    }

    if ($_SERVER['REQUEST_METHOD'] !== 'POST') fail('POST required', 405);

    if ($action === 'request') {
        $target = (int)($body['target_id'] ?? 0);
        if ($target <= 0 || $target === $me || !user_exists($pdo, $target)) fail('Hero not found');

        $pair = find_pair($pdo, $me, $target);
        if ($pair) {
            if ($pair['status'] === 'accepted') { echo json_encode(['success' => true, 'status' => 'accepted']); exit; }
            if ((int)$pair['requester_id'] === $me) { echo json_encode(['success' => true, 'status' => 'pending']); exit; }
            // They already asked me: asking back means we both agree.
            accept_row($pdo, (int)$pair['id']);
            echo json_encode(['success' => true, 'status' => 'accepted']);
            exit;
        }
        if (outgoing_pending_count($pdo, $me) >= MAX_OUTGOING_PENDING) fail('Too many pending requests. Wait for some replies first.', 429);
        insert_pair($pdo, $me, $target, 'pending');
        echo json_encode(['success' => true, 'status' => 'pending']);
        exit;
    }

    if ($action === 'respond') {
        $requestId = (int)($body['request_id'] ?? 0);
        $accept = !empty($body['accept']);
        $s = $pdo->prepare("SELECT * FROM friendships WHERE id = ? AND addressee_id = ? AND status = 'pending'");
        $s->execute([$requestId, $me]);
        $row = $s->fetch();
        if (!$row) fail('Request not found', 404);
        if ($accept) {
            accept_row($pdo, (int)$row['id']);
        } else {
            $pdo->prepare('DELETE FROM friendships WHERE id = ?')->execute([$row['id']]);
        }
        echo json_encode(['success' => true, 'status' => $accept ? 'accepted' : 'declined']);
        exit;
    }

    if ($action === 'remove') {
        $other = (int)($body['other_id'] ?? 0);
        if ($other <= 0) fail('Hero not found');
        $pdo->prepare('DELETE FROM friendships WHERE (requester_id = ? AND addressee_id = ?) OR (requester_id = ? AND addressee_id = ?)')
            ->execute([$me, $other, $other, $me]);
        echo json_encode(['success' => true]);
        exit;
    }

    if ($action === 'import_legacy') {
        $ids = array_slice(array_unique(array_map('intval', (array)($body['friend_ids'] ?? []))), 0, 200);
        $accepted = 0; $requested = 0;
        foreach ($ids as $other) {
            if ($other <= 0 || $other === $me || !user_exists($pdo, $other)) continue;
            $pair = find_pair($pdo, $me, $other);
            if ($pair) {
                // They asked me and I list them too → both agree.
                if ($pair['status'] === 'pending' && (int)$pair['addressee_id'] === $me) { accept_row($pdo, (int)$pair['id']); $accepted++; }
                continue;
            }
            // Both sides already had each other in the old lists → mutual from day one.
            if (legacy_list_contains($pdo, $other, $me)) { insert_pair($pdo, $me, $other, 'accepted'); $accepted++; }
            else { insert_pair($pdo, $me, $other, 'pending'); $requested++; }
        }
        echo json_encode(['success' => true, 'accepted' => $accepted, 'requested' => $requested]);
        exit;
    }

    fail('Unknown action');
} catch (PDOException $e) {
    error_log('friends error: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode(['error' => 'Friends service unavailable']);
}
