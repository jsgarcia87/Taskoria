<?php
require_once 'db.php';
header('Content-Type: application/json');

$data = json_decode(file_get_contents('php://input'), true);

$user_id          = (int)($data['user_id'] ?? 0);
$current_password = $data['current_password'] ?? '';
$new_password     = $data['new_password'] ?? '';

if (!$user_id || $current_password === '' || $new_password === '') {
    http_response_code(400);
    echo json_encode(['error' => 'Missing fields.']);
    exit;
}

if (strlen($new_password) < 6) {
    http_response_code(400);
    echo json_encode(['error' => 'New password must be at least 6 characters.']);
    exit;
}

if ($current_password === $new_password) {
    http_response_code(400);
    echo json_encode(['error' => 'New password must be different from the current one.']);
    exit;
}

try {
    $stmt = $pdo->prepare("SELECT password_hash FROM users WHERE id = ?");
    $stmt->execute([$user_id]);
    $user = $stmt->fetch();

    if (!$user) {
        http_response_code(404);
        echo json_encode(['error' => 'User not found.']);
        exit;
    }

    if (!password_verify($current_password, $user['password_hash'])) {
        http_response_code(401);
        echo json_encode(['error' => 'Current password is incorrect.']);
        exit;
    }

    $newHash = password_hash($new_password, PASSWORD_DEFAULT);
    $upd = $pdo->prepare("UPDATE users SET password_hash = ? WHERE id = ?");
    $upd->execute([$newHash, $user_id]);

    echo json_encode(['success' => true, 'message' => 'Password updated.']);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Database error.']);
}
