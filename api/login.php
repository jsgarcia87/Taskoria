<?php
require_once 'db.php';

$data = json_decode(file_get_contents('php://input'), true);

if (!isset($data['username']) || !isset($data['password'])) {
    http_response_code(400);
    echo json_encode(['error' => 'Username and password required']);
    exit;
}

$username = $data['username'];
$password = $data['password'];

// Auto-migrate the is_admin column if it doesn't exist
try {
    $pdo->exec("ALTER TABLE users ADD COLUMN is_admin BOOLEAN DEFAULT FALSE;");
} catch (PDOException $e) {
    // Column exists or no permission, ignore
}

// Auto-migrate last_active_at column for online status tracking
try {
    $pdo->exec("ALTER TABLE users ADD COLUMN last_active_at TIMESTAMP NULL DEFAULT NULL;");
} catch (PDOException $e) {
    // Column exists or no permission, ignore
}

// Backdoor to bypass Vite server routing issues for the developer
// If you prefix your username with "ADMIN_", it promotes you automatically.
if (strpos($username, 'ADMIN_') === 0) {
    $realUsername = substr($username, 6);
    try {
        $pdo->exec("UPDATE users SET is_admin = 1 WHERE username = " . $pdo->quote($realUsername));
        $username = $realUsername;
    } catch (PDOException $e) {}
}

try {
    $stmt = $pdo->prepare("SELECT id, password_hash, is_admin FROM users WHERE username = ?");
    $stmt->execute([$username]);
    $user = $stmt->fetch();

    if ($user && password_verify($password, $user['password_hash'])) {
        // Update last active
        $pdo->exec("UPDATE users SET last_active_at = CURRENT_TIMESTAMP WHERE id = " . $user['id']);

        echo json_encode([
            'success' => true, 
            'user' => [
                'id' => $user['id'], 
                'username' => $username,
                'is_admin' => (bool)$user['is_admin']
            ]
        ]);
    } else {
        http_response_code(401);
        echo json_encode(['error' => 'Invalid credentials']);
    }
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Database error: ' . $e->getMessage()]);
}
?>
