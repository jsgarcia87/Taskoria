<?php
require_once 'db.php';

header('Content-Type: application/json');

// Auto-migrate
try {
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS world_creations (
            id INT AUTO_INCREMENT PRIMARY KEY,
            user_id INT NOT NULL,
            name VARCHAR(120) NOT NULL,
            category VARCHAR(40) NOT NULL,
            grid_size INT NOT NULL DEFAULT 64,
            pixels LONGTEXT NOT NULL,
            status ENUM('pending','approved','rejected') NOT NULL DEFAULT 'pending',
            reject_reason VARCHAR(255) DEFAULT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            reviewed_at TIMESTAMP NULL,
            INDEX idx_status (status),
            INDEX idx_user (user_id),
            INDEX idx_category (category),
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    ");
} catch (PDOException $e) {
    // ignore
}

$ALLOWED_CATEGORIES = ['casas','castillos','monturas','arboles','decoracion','props'];

function isAdmin($pdo, $userId) {
    if (!$userId) return false;
    $s = $pdo->prepare("SELECT is_admin FROM users WHERE id = ?");
    $s->execute([$userId]);
    $r = $s->fetch();
    return $r && (int)$r['is_admin'] === 1;
}

$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? '';

if ($method === 'GET') {
    if ($action === 'list_approved') {
        $cat = $_GET['category'] ?? null;
        if ($cat && in_array($cat, $ALLOWED_CATEGORIES, true)) {
            $stmt = $pdo->prepare("
                SELECT c.id, c.name, c.category, c.grid_size, c.pixels, c.created_at, u.username
                FROM world_creations c
                JOIN users u ON u.id = c.user_id
                WHERE c.status = 'approved' AND c.category = ?
                ORDER BY c.created_at DESC
                LIMIT 200
            ");
            $stmt->execute([$cat]);
        } else {
            $stmt = $pdo->query("
                SELECT c.id, c.name, c.category, c.grid_size, c.pixels, c.created_at, u.username
                FROM world_creations c
                JOIN users u ON u.id = c.user_id
                WHERE c.status = 'approved'
                ORDER BY c.created_at DESC
                LIMIT 200
            ");
        }
        echo json_encode(['success' => true, 'items' => $stmt->fetchAll()]);
        exit;
    }

    if ($action === 'list_mine') {
        $userId = (int)($_GET['user_id'] ?? 0);
        if (!$userId) { http_response_code(400); echo json_encode(['error' => 'user_id required']); exit; }
        $stmt = $pdo->prepare("
            SELECT id, name, category, grid_size, pixels, status, reject_reason, created_at, reviewed_at
            FROM world_creations
            WHERE user_id = ?
            ORDER BY created_at DESC
        ");
        $stmt->execute([$userId]);
        echo json_encode(['success' => true, 'items' => $stmt->fetchAll()]);
        exit;
    }

    if ($action === 'list_pending') {
        $adminId = (int)($_GET['admin_id'] ?? 0);
        if (!isAdmin($pdo, $adminId)) { http_response_code(403); echo json_encode(['error' => 'Admins only']); exit; }
        $stmt = $pdo->query("
            SELECT c.id, c.name, c.category, c.grid_size, c.pixels, c.created_at, u.username, c.user_id
            FROM world_creations c
            JOIN users u ON u.id = c.user_id
            WHERE c.status = 'pending'
            ORDER BY c.created_at ASC
        ");
        echo json_encode(['success' => true, 'items' => $stmt->fetchAll()]);
        exit;
    }

    http_response_code(400);
    echo json_encode(['error' => 'Unknown action']);
    exit;
}

if ($method === 'POST') {
    $data = json_decode(file_get_contents('php://input'), true) ?: [];

    if ($action === 'publish') {
        $userId = (int)($data['user_id'] ?? 0);
        $name = trim((string)($data['name'] ?? ''));
        $category = (string)($data['category'] ?? '');
        $gridSize = (int)($data['grid_size'] ?? 64);
        $pixels = $data['pixels'] ?? null;

        if (!$userId) { http_response_code(401); echo json_encode(['error' => 'Login required']); exit; }
        if ($name === '' || mb_strlen($name) > 120) { http_response_code(400); echo json_encode(['error' => 'Invalid name']); exit; }
        if (!in_array($category, $ALLOWED_CATEGORIES, true)) { http_response_code(400); echo json_encode(['error' => 'Invalid category']); exit; }
        if ($gridSize < 8 || $gridSize > 128) { http_response_code(400); echo json_encode(['error' => 'Invalid grid_size']); exit; }
        if (!is_array($pixels) || count($pixels) !== $gridSize * $gridSize) {
            http_response_code(400); echo json_encode(['error' => 'Invalid pixels']); exit;
        }

        // Reject empty canvases
        $hasContent = false;
        foreach ($pixels as $p) {
            if ($p !== 'transparent' && $p !== null && $p !== '') { $hasContent = true; break; }
        }
        if (!$hasContent) { http_response_code(400); echo json_encode(['error' => 'Empty canvas']); exit; }

        $stmt = $pdo->prepare("
            INSERT INTO world_creations (user_id, name, category, grid_size, pixels, status)
            VALUES (?, ?, ?, ?, ?, 'pending')
        ");
        $stmt->execute([$userId, $name, $category, $gridSize, json_encode($pixels)]);
        echo json_encode(['success' => true, 'id' => $pdo->lastInsertId()]);
        exit;
    }

    if ($action === 'moderate') {
        $adminId = (int)($data['admin_id'] ?? 0);
        if (!isAdmin($pdo, $adminId)) { http_response_code(403); echo json_encode(['error' => 'Admins only']); exit; }
        $id = (int)($data['id'] ?? 0);
        $decision = $data['decision'] ?? '';
        $reason = isset($data['reason']) ? substr((string)$data['reason'], 0, 255) : null;
        if (!$id || !in_array($decision, ['approved','rejected'], true)) {
            http_response_code(400); echo json_encode(['error' => 'Invalid request']); exit;
        }
        $stmt = $pdo->prepare("
            UPDATE world_creations
            SET status = ?, reject_reason = ?, reviewed_at = CURRENT_TIMESTAMP
            WHERE id = ?
        ");
        $stmt->execute([$decision, $decision === 'rejected' ? $reason : null, $id]);
        echo json_encode(['success' => true]);
        exit;
    }

    if ($action === 'delete_mine') {
        $userId = (int)($data['user_id'] ?? 0);
        $id = (int)($data['id'] ?? 0);
        if (!$userId || !$id) { http_response_code(400); echo json_encode(['error' => 'Bad request']); exit; }
        $stmt = $pdo->prepare("DELETE FROM world_creations WHERE id = ? AND user_id = ?");
        $stmt->execute([$id, $userId]);
        echo json_encode(['success' => true]);
        exit;
    }

    http_response_code(400);
    echo json_encode(['error' => 'Unknown action']);
    exit;
}

http_response_code(405);
echo json_encode(['error' => 'Method not allowed']);
