<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

require_once 'db.php';

// Auto-migrate/create table if not exists
try {
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS pet_sanctuary (
            id INT AUTO_INCREMENT PRIMARY KEY,
            profile_id VARCHAR(50) NOT NULL,
            owner_name VARCHAR(100) NOT NULL,
            pet_type VARCHAR(100) NOT NULL,
            pet_level INT DEFAULT 1,
            pet_xp INT DEFAULT 0,
            price INT DEFAULT 0,
            is_market TINYINT DEFAULT 0,
            released_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8;
    ");
} catch (PDOException $e) {
    // Ignore
}

$action = $_GET['action'] ?? '';

// Basic automatic schema update for columns
try {
    $pdo->exec("ALTER TABLE pet_sanctuary ADD COLUMN IF NOT EXISTS price INT DEFAULT 0");
    $pdo->exec("ALTER TABLE pet_sanctuary ADD COLUMN IF NOT EXISTS is_market TINYINT DEFAULT 0");
    $pdo->exec("ALTER TABLE pet_sanctuary ADD COLUMN IF NOT EXISTS released_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP");
} catch (PDOException $e) {
    // Column might already exist
}

if ($_SERVER['REQUEST_METHOD'] === 'GET' && $action === 'list') {
    try {
        // Only list pets that are marked as for adoption (market) and less than 3 days old
        $stmt = $pdo->query("SELECT *, TIMESTAMPDIFF(SECOND, released_at, NOW()) as seconds_passed FROM pet_sanctuary WHERE is_market = 1 AND released_at > DATE_SUB(NOW(), INTERVAL 3 DAY) ORDER BY released_at DESC LIMIT 50");
        $pets = $stmt->fetchAll(PDO::FETCH_ASSOC);
        echo json_encode(['pets' => $pets]);
    } catch (PDOException $e) {
        echo json_encode(['error' => 'Failed to fetch market pets: ' . $e->getMessage()]);
    }
    exit;
}

if ($_SERVER['REQUEST_METHOD'] === 'POST' && $action === 'reset_all') {
    // Admin override: reset all pets
    $data = json_decode(file_get_contents("php://input"), true);
    $admin_id = $data['admin_id'] ?? null;
    
    if (!$admin_id) {
        http_response_code(401);
        echo json_encode(['error' => 'Unauthorized']);
        exit;
    }
    
    $stmt = $pdo->prepare("SELECT is_admin FROM users WHERE id = ?");
    $stmt->execute([$admin_id]);
    $adminUser = $stmt->fetch();
    
    if (!$adminUser || !$adminUser['is_admin']) {
        http_response_code(403);
        echo json_encode(['error' => 'Forbidden: Admins only']);
        exit;
    }

    try {
        $stmt = $pdo->query("SELECT * FROM game_saves");
        $saves = $stmt->fetchAll(PDO::FETCH_ASSOC);
        $count = 0;
        foreach ($saves as $save) {
            $data = json_decode($save['save_data'], true);
            $modified = false;
            if (isset($data['profiles'])) {
                foreach ($data['profiles'] as &$profile) {
                    if (isset($profile['state']['character']['pets'])) {
                        $profile['state']['character']['pets'] = [];
                        $modified = true;
                    }
                }
            }
            if (isset($data['character']['pets'])) {
                $data['character']['pets'] = [];
                $modified = true;
            }
            if ($modified) {
                $newSave = json_encode($data);
                $updateStmt = $pdo->prepare("UPDATE game_saves SET save_data = ? WHERE id = ?");
                $updateStmt->execute([$newSave, $save['id']]);
                $count++;
            }
        }
        $pdo->exec("DELETE FROM pet_sanctuary"); // Changed from sanctuary_pets to pet_sanctuary based on existing table name
        echo json_encode(['success' => true, 'message' => "Reset $count game saves and cleared pet_sanctuary."]);
    } catch (PDOException $e) {
        echo json_encode(['error' => 'Failed to reset all pets: ' . $e->getMessage()]);
    }
    exit;
}

if ($_SERVER['REQUEST_METHOD'] === 'POST' && $action === 'deposit') {
    $data = json_decode(file_get_contents("php://input"), true);
    
    $profile_id = $data['profile_id'] ?? '';
    $owner_name = $data['owner_name'] ?? 'Unknown Hero';
    $pet_type = $data['pet_type'] ?? '';
    $pet_level = $data['pet_level'] ?? 1;
    $pet_xp = $data['pet_xp'] ?? 0;
    $price = $data['price'] ?? 0;
    $is_market = $data['is_market'] ?? 0; // 1 for adoption market, 0 for resting
    
    if (!$pet_type || !$profile_id) {
        echo json_encode(['error' => 'Missing pet_type or profile_id']);
        exit;
    }
    
    try {
        $stmt = $pdo->prepare("INSERT INTO pet_sanctuary (profile_id, owner_name, pet_type, pet_level, pet_xp, price, is_market, released_at) VALUES (?, ?, ?, ?, ?, ?, ?, NOW())");
        $stmt->execute([$profile_id, $owner_name, $pet_type, $pet_level, $pet_xp, $price, $is_market]);
        echo json_encode(['success' => true]);
    } catch (PDOException $e) {
        echo json_encode(['error' => 'Failed to deposit pet: ' . $e->getMessage()]);
    }
    exit;
}

if ($_SERVER['REQUEST_METHOD'] === 'POST' && $action === 'retrieve') {
    $data = json_decode(file_get_contents("php://input"), true);
    $profile_id = $data['profile_id'] ?? '';
    $pet_type = $data['pet_type'] ?? '';

    if (!$profile_id) {
        echo json_encode(['error' => 'Missing profile_id']);
        exit;
    }

    try {
        // Only allow retrieving private resting pets
        $stmt = $pdo->prepare("DELETE FROM pet_sanctuary WHERE profile_id = ? AND is_market = 0 AND pet_type = ? LIMIT 1");
        $stmt->execute([$profile_id, $pet_type]);
        echo json_encode(['success' => true]);
    } catch (PDOException $e) {
        echo json_encode(['error' => 'Failed to retrieve pet']);
    }
    exit;
}

if ($_SERVER['REQUEST_METHOD'] === 'POST' && $action === 'adopt') {
    $data = json_decode(file_get_contents("php://input"), true);
    $pet_id = $data['id'] ?? $data['pet_id'] ?? ''; // Pet table ID

    if (!$pet_id) {
        echo json_encode(['error' => 'Missing pet identifier']);
        exit;
    }

    try {
        // Only allow adopting from market
        $stmt = $pdo->prepare("DELETE FROM pet_sanctuary WHERE id = ? AND is_market = 1");
        $stmt->execute([$pet_id]);
        echo json_encode(['success' => true]);
    } catch (PDOException $e) {
        echo json_encode(['error' => 'Failed to adopt pet']);
    }
    exit;
}

echo json_encode(['error' => 'Invalid action']);
