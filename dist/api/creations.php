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
            price INT NOT NULL DEFAULT 100,
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
    // Idempotent add for existing installs — silently ignore if column already exists
    try {
        $pdo->exec("ALTER TABLE world_creations ADD COLUMN price INT NOT NULL DEFAULT 100 AFTER pixels;");
    } catch (PDOException $e) { /* already there */ }

    // Purchases ledger — records who bought which creation and at what price.
    // UNIQUE(user_id, creation_id) makes idempotent buys impossible; a second
    // "buy" call returns the existing purchase without double-charging.
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS creation_purchases (
            id INT AUTO_INCREMENT PRIMARY KEY,
            user_id INT NOT NULL,
            creation_id INT NOT NULL,
            price_paid INT NOT NULL,
            purchased_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            UNIQUE KEY uniq_owner (user_id, creation_id),
            INDEX idx_user (user_id),
            INDEX idx_creation (creation_id),
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
            FOREIGN KEY (creation_id) REFERENCES world_creations(id) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    ");
} catch (PDOException $e) {
    // ignore
}

$ALLOWED_CATEGORIES = ['casas','castillos','monturas','arboles','decoracion','props','monstruos'];

function isAdmin($pdo, $userId) {
    if (!$userId) return false;
    $s = $pdo->prepare("SELECT is_admin FROM users WHERE id = ?");
    $s->execute([$userId]);
    $r = $s->fetch();
    return $r && (int)$r['is_admin'] === 1;
}

function hasStudioAccess($pdo, $userId) {
    if (!$userId) return false;
    try {
        $s = $pdo->prepare("SELECT studio_access, is_admin FROM users WHERE id = ?");
        $s->execute([$userId]);
        $r = $s->fetch();
        if (!$r) return false;
        if ((int)$r['is_admin'] === 1) return true; // admins always have access
        return ($r['studio_access'] ?? 'none') === 'approved';
    } catch (PDOException $e) {
        // Column may not exist yet — fail closed
        return false;
    }
}

$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? '';

if ($method === 'GET') {
    if ($action === 'list_approved') {
        $cat = $_GET['category'] ?? null;
        if ($cat && in_array($cat, $ALLOWED_CATEGORIES, true)) {
            $stmt = $pdo->prepare("
                SELECT c.id, c.name, c.category, c.grid_size, c.pixels, c.price, c.created_at, u.username
                FROM world_creations c
                JOIN users u ON u.id = c.user_id
                WHERE c.status = 'approved' AND c.category = ?
                ORDER BY c.created_at DESC
                LIMIT 200
            ");
            $stmt->execute([$cat]);
        } else {
            $stmt = $pdo->query("
                SELECT c.id, c.name, c.category, c.grid_size, c.pixels, c.price, c.created_at, u.username
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
            SELECT id, name, category, grid_size, pixels, price, status, reject_reason, created_at, reviewed_at
            FROM world_creations
            WHERE user_id = ?
            ORDER BY created_at DESC
        ");
        $stmt->execute([$userId]);
        echo json_encode(['success' => true, 'items' => $stmt->fetchAll()]);
        exit;
    }

    if ($action === 'list_owned') {
        $userId = (int)($_GET['user_id'] ?? 0);
        if (!$userId) { http_response_code(400); echo json_encode(['error' => 'user_id required']); exit; }
        $stmt = $pdo->prepare("
            SELECT c.id, c.name, c.category, c.grid_size, c.pixels, c.price,
                   u.username, p.price_paid, p.purchased_at
            FROM creation_purchases p
            JOIN world_creations c ON c.id = p.creation_id
            JOIN users u ON u.id = c.user_id
            WHERE p.user_id = ?
            ORDER BY p.purchased_at DESC
        ");
        $stmt->execute([$userId]);
        echo json_encode(['success' => true, 'items' => $stmt->fetchAll()]);
        exit;
    }

    if ($action === 'list_pending') {
        $adminId = (int)($_GET['admin_id'] ?? 0);
        if (!isAdmin($pdo, $adminId)) { http_response_code(403); echo json_encode(['error' => 'Admins only']); exit; }
        $stmt = $pdo->query("
            SELECT c.id, c.name, c.category, c.grid_size, c.pixels, c.price, c.created_at, u.username, c.user_id
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

    if ($action === 'seed_object') {
        // Admin-only: extract a built-in procedural prop into the library as an
        // editable, already-approved pixel-art asset. Idempotent by (user, name)
        // so re-running refreshes instead of duplicating.
        $userId = (int)($data['user_id'] ?? 0);
        if (!$userId || !isAdmin($pdo, $userId)) { http_response_code(403); echo json_encode(['error' => 'Admins only']); exit; }
        $name = trim((string)($data['name'] ?? ''));
        $category = (string)($data['category'] ?? 'decoracion');
        $gridSize = (int)($data['grid_size'] ?? 64);
        $pixels = $data['pixels'] ?? null;
        if ($name === '' || !is_array($pixels)) { http_response_code(400); echo json_encode(['error' => 'Invalid payload']); exit; }
        if (!in_array($category, $ALLOWED_CATEGORIES, true)) $category = 'decoracion';
        if ($gridSize < 8 || $gridSize > 128) $gridSize = 64;

        $stmt = $pdo->prepare("SELECT id FROM world_creations WHERE user_id = ? AND name = ?");
        $stmt->execute([$userId, $name]);
        $existing = $stmt->fetch();
        if ($existing) {
            $up = $pdo->prepare("UPDATE world_creations SET category = ?, grid_size = ?, pixels = ?, status = 'approved' WHERE id = ?");
            $up->execute([$category, $gridSize, json_encode($pixels), $existing['id']]);
            echo json_encode(['success' => true, 'id' => (int)$existing['id'], 'updated' => true]);
        } else {
            $ins = $pdo->prepare("INSERT INTO world_creations (user_id, name, category, grid_size, pixels, price, status) VALUES (?, ?, ?, ?, ?, 0, 'approved')");
            $ins->execute([$userId, $name, $category, $gridSize, json_encode($pixels)]);
            echo json_encode(['success' => true, 'id' => $pdo->lastInsertId()]);
        }
        exit;
    }

    if ($action === 'publish') {
        $userId = (int)($data['user_id'] ?? 0);
        $name = trim((string)($data['name'] ?? ''));
        $category = (string)($data['category'] ?? '');
        $gridSize = (int)($data['grid_size'] ?? 64);
        $pixels = $data['pixels'] ?? null;
        // Creator-proposed price, capped 10-500. Admin may override at approval.
        $price = isset($data['price']) ? (int)$data['price'] : 100;
        if ($price < 10) $price = 10;
        if ($price > 500) $price = 500;

        if (!$userId) { http_response_code(401); echo json_encode(['error' => 'Login required']); exit; }
        if (!hasStudioAccess($pdo, $userId)) { http_response_code(403); echo json_encode(['error' => 'Studio access not approved']); exit; }
        if ($name === '' || mb_strlen($name) > 120) { http_response_code(400); echo json_encode(['error' => 'Invalid name']); exit; }
        if (!in_array($category, $ALLOWED_CATEGORIES, true)) { http_response_code(400); echo json_encode(['error' => 'Invalid category']); exit; }
        if ($gridSize < 8 || $gridSize > 128) { http_response_code(400); echo json_encode(['error' => 'Invalid grid_size']); exit; }
        if (!is_array($pixels)) {
            http_response_code(400); echo json_encode(['error' => 'Invalid pixels format']); exit;
        }

        // Determine if this is a single frame or a multi-frame animation
        $isAnimated = isset($pixels[0]) && is_array($pixels[0]);
        $frames = $isAnimated ? $pixels : [$pixels];

        foreach ($frames as $frame) {
            if (!is_array($frame) || count($frame) !== $gridSize * $gridSize) {
                http_response_code(400); echo json_encode(['error' => 'Invalid frame size']); exit;
            }
        }

        // Reject empty canvases
        $hasContent = false;
        foreach ($frames as $frame) {
            foreach ($frame as $p) {
                if ($p !== 'transparent' && $p !== null && $p !== '') { $hasContent = true; break 2; }
            }
        }
        if (!$hasContent) { http_response_code(400); echo json_encode(['error' => 'Empty canvas']); exit; }

        $stmt = $pdo->prepare("
            INSERT INTO world_creations (user_id, name, category, grid_size, pixels, price, status)
            VALUES (?, ?, ?, ?, ?, ?, 'pending')
        ");
        $stmt->execute([$userId, $name, $category, $gridSize, json_encode($pixels), $price]);
        echo json_encode(['success' => true, 'id' => $pdo->lastInsertId()]);
        exit;
    }

    if ($action === 'update') {
        $id = (int)($data['id'] ?? 0);
        $userId = (int)($data['user_id'] ?? 0);
        $name = trim((string)($data['name'] ?? ''));
        $category = (string)($data['category'] ?? '');
        $gridSize = (int)($data['gridSize'] ?? 64);
        $pixels = $data['pixels'] ?? null;
        $price = isset($data['price']) ? (int)$data['price'] : 100;
        if ($price < 10) $price = 10;
        if ($price > 500) $price = 500;

        if (!$userId || !$id) { http_response_code(400); echo json_encode(['error' => 'Missing ID or User ID']); exit; }
        if (!isAdmin($pdo, $userId)) { http_response_code(403); echo json_encode(['error' => 'Admins only for direct updates']); exit; }
        
        $stmt = $pdo->prepare("
            UPDATE world_creations
            SET name = ?, category = ?, grid_size = ?, pixels = ?, price = ?
            WHERE id = ?
        ");
        $stmt->execute([$name, $category, $gridSize, json_encode($pixels), $price, $id]);
        echo json_encode(['success' => true]);
        exit;
    }

    if ($action === 'update_meta') {
        $id = (int)($data['id'] ?? 0);
        $name = trim((string)($data['name'] ?? ''));
        $category = (string)($data['category'] ?? '');
        $stmt = $pdo->prepare("UPDATE world_creations SET name = ?, category = ? WHERE id = ?");
        $stmt->execute([$name, $category, $id]);
        echo json_encode(['success' => true]);
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

        // Admin-provided price override, only meaningful when approving.
        $override = null;
        if ($decision === 'approved' && isset($data['price'])) {
            $override = (int)$data['price'];
            if ($override < 10) $override = 10;
            if ($override > 500) $override = 500;
        }

        if ($override !== null) {
            $stmt = $pdo->prepare("
                UPDATE world_creations
                SET status = ?, reject_reason = NULL, price = ?, reviewed_at = CURRENT_TIMESTAMP
                WHERE id = ?
            ");
            $stmt->execute([$decision, $override, $id]);
        } else {
            $stmt = $pdo->prepare("
                UPDATE world_creations
                SET status = ?, reject_reason = ?, reviewed_at = CURRENT_TIMESTAMP
                WHERE id = ?
            ");
            $stmt->execute([$decision, $decision === 'rejected' ? $reason : null, $id]);
        }
        echo json_encode(['success' => true]);
        exit;
    }

    if ($action === 'buy') {
        // Client-authoritative gold check for MVP: frontend verifies gold >= price
        // and deducts locally, backend just records the purchase. When we move to
        // proper server-side gold tracking, this endpoint gains the auth check.
        $userId = (int)($data['user_id'] ?? 0);
        $creationId = (int)($data['creation_id'] ?? 0);
        if (!$userId || !$creationId) {
            http_response_code(400);
            echo json_encode(['error' => 'user_id and creation_id required']);
            exit;
        }

        // Only approved creations are purchasable.
        $stmt = $pdo->prepare("SELECT price, status FROM world_creations WHERE id = ?");
        $stmt->execute([$creationId]);
        $creation = $stmt->fetch();
        if (!$creation) {
            http_response_code(404);
            echo json_encode(['error' => 'Creation not found']);
            exit;
        }
        if ($creation['status'] !== 'approved') {
            http_response_code(400);
            echo json_encode(['error' => 'Creation is not available in the Bazaar']);
            exit;
        }

        // Idempotent — if the user already owns this, return success without
        // double-charging. Frontend interprets already_owned=true to skip the
        // local gold deduction it would otherwise apply.
        $check = $pdo->prepare("SELECT id, price_paid FROM creation_purchases WHERE user_id = ? AND creation_id = ?");
        $check->execute([$userId, $creationId]);
        $existing = $check->fetch();
        if ($existing) {
            echo json_encode([
                'success' => true,
                'already_owned' => true,
                'purchase_id' => (int)$existing['id'],
                'price_paid' => (int)$existing['price_paid'],
            ]);
            exit;
        }

        $price = (int)$creation['price'];
        $ins = $pdo->prepare("
            INSERT INTO creation_purchases (user_id, creation_id, price_paid)
            VALUES (?, ?, ?)
        ");
        $ins->execute([$userId, $creationId, $price]);
        echo json_encode([
            'success' => true,
            'already_owned' => false,
            'purchase_id' => (int)$pdo->lastInsertId(),
            'price_paid' => $price,
        ]);
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

    if ($action === 'delete') {
        // Admin delete: removes any creation regardless of owner.
        $userId = (int)($data['user_id'] ?? 0);
        $targetId = (int)($data['target_id'] ?? 0);
        if (!$userId || !$targetId) { http_response_code(400); echo json_encode(['error' => 'Bad request']); exit; }
        if (!isAdmin($pdo, $userId)) { http_response_code(403); echo json_encode(['error' => 'Admins only']); exit; }
        $stmt = $pdo->prepare("DELETE FROM world_creations WHERE id = ?");
        $stmt->execute([$targetId]);
        echo json_encode(['success' => true]);
        exit;
    }

    http_response_code(400);
    echo json_encode(['error' => 'Unknown action']);
    exit;
}

http_response_code(405);
echo json_encode(['error' => 'Method not allowed']);
