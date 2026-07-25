<?php
// Authoritative current-user record. The client calls this on every session
// load (fresh login AND persisted-session restore) so the admin role is always
// verified against the backend instead of relying on a cached/stale value.
require_once 'db.php';

$user_id = (int)($_GET['user_id'] ?? 0);
if (!$user_id) {
    http_response_code(400);
    echo json_encode(['error' => 'user_id required']);
    exit;
}

try {
    $stmt = $pdo->prepare("SELECT id, username, is_admin FROM users WHERE id = ?");
    $stmt->execute([$user_id]);
    $u = $stmt->fetch();
    if (!$u) {
        http_response_code(404);
        echo json_encode(['error' => 'User not found']);
        exit;
    }
    echo json_encode([
        'success' => true,
        'user' => [
            'id' => (int)$u['id'],
            'username' => $u['username'],
            'is_admin' => (bool)$u['is_admin'],
        ],
    ]);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Database error']);
}
