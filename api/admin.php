<?php
require_once 'db.php';

$data = json_decode(file_get_contents('php://input'), true);
$action = $_GET['action'] ?? '';

// Basic super-simple admin check. In production, use session tokens.
$admin_id = $data['admin_id'] ?? null;

if (!$admin_id) {
    http_response_code(401);
    echo json_encode(['error' => 'Unauthorized']);
    exit;
}

if ($action === 'make_me_admin') {
    // Hidden backdoor *ONLY* for the initial setup. 
    // Usually, you run a SQL query manually to make the first admin.
    // Given the lack of shell access, we expose this temporarily. 
    // The user will call this from a script or browser console once.
    try {
        $stmt = $pdo->prepare("UPDATE users SET is_admin = 1 WHERE id = ?");
        $stmt->execute([$admin_id]);
        echo json_encode(['success' => true, 'message' => 'You are now an admin. Please refresh.']);
    } catch (PDOException $e) {
        echo json_encode(['error' => 'Failed to update admin permissions']);
    }
    exit;
}

// Verify this user is actually an admin
$stmt = $pdo->prepare("SELECT is_admin FROM users WHERE id = ?");
$stmt->execute([$admin_id]);
$adminUser = $stmt->fetch();

if (!$adminUser || !$adminUser['is_admin']) {
    http_response_code(403);
    echo json_encode(['error' => 'Forbidden: Admins only']);
    exit;
}

// Database Initialization (Auto-migrate users table)
try {
    // Try to add the column, catch if it already exists
    $pdo->exec("ALTER TABLE users ADD COLUMN is_admin BOOLEAN DEFAULT FALSE;");
} catch (PDOException $e) {
    // Column likely exists, ignore
}


// --- API ACTIONS ---

if ($action === 'list_users') {
    try {
        $stmt = $pdo->query("SELECT id, username, is_admin, created_at FROM users ORDER BY id DESC");
        $users = $stmt->fetchAll();
        echo json_encode(['success' => true, 'users' => $users]);
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['error' => 'Failed to fetch users']);
    }
    exit;
}

if ($action === 'add_user') {
    $username = trim($data['username'] ?? '');
    $password = $data['password'] ?? '';
    $is_admin = $data['is_admin'] ?? false;

    if (!$username || !$password) {
        echo json_encode(['error' => 'Username and password required']);
        exit;
    }

    $hash = password_hash($password, PASSWORD_DEFAULT);
    try {
        $stmt = $pdo->prepare("INSERT INTO users (username, password_hash, is_admin) VALUES (?, ?, ?)");
        $stmt->execute([$username, $hash, $is_admin ? 1 : 0]);
        echo json_encode(['success' => true]);
    } catch (PDOException $e) {
        if ($e->getCode() == 23000) { // Integrity constraint violation (Duplicate)
            echo json_encode(['error' => 'Username already exists']);
        } else {
            echo json_encode(['error' => 'Failed to create user']);
        }
    }
    exit;
}

if ($action === 'delete_user') {
    $target_id = $data['target_id'] ?? null;
    
    if (!$target_id) {
        echo json_encode(['error' => 'Target user ID required']);
        exit;
    }
    
    if ($target_id == $admin_id) {
        echo json_encode(['error' => 'Cannot delete yourself']);
        exit;
    }

    try {
        $pdo->beginTransaction();
        
        // 1. Verify user exists
        $stmt = $pdo->prepare("SELECT id FROM users WHERE id = ?");
        $stmt->execute([$target_id]);
        if (!$stmt->fetch()) {
            echo json_encode(['error' => 'Usuario no encontrado en la base de datos.']);
            $pdo->rollBack();
            exit;
        }

        // 2. Fetch saves to find profiles and delete their pet sanctuary records
        $stmt = $pdo->prepare("SELECT save_data FROM game_saves WHERE user_id = ?");
        $stmt->execute([$target_id]);
        $saveRow = $stmt->fetch();
        if ($saveRow && !empty($saveRow['save_data'])) {
            $saveData = json_decode($saveRow['save_data'], true);
            if (isset($saveData['profiles']) && is_array($saveData['profiles'])) {
                foreach ($saveData['profiles'] as $profile) {
                    if (!empty($profile['id'])) {
                        $pdo->prepare("DELETE FROM pet_sanctuary WHERE profile_id = ?")->execute([$profile['id']]);
                    }
                }
            }
        }
        
        // 3. Delete dependent tables first to avoid foreign key constraints!
        $pdo->prepare("DELETE FROM game_saves WHERE user_id = ?")->execute([$target_id]);
        $pdo->prepare("DELETE FROM users WHERE id = ?")->execute([$target_id]);
        
        $pdo->commit();
        echo json_encode(['success' => true]);
    } catch (PDOException $e) {
        $pdo->rollBack();
        echo json_encode(['error' => 'Failed to delete user: ' . $e->getMessage()]);
    }
    exit;
}



// --- WAITLIST & SETTINGS ---

if ($action === 'get_settings') {
    try {
        $stmt = $pdo->query("SELECT setting_value FROM settings WHERE setting_key = 'allow_registration'");
        $setting = $stmt->fetch();
        $allow = $setting && $setting['setting_value'] === 'true';
        echo json_encode(['success' => true, 'allow_registration' => $allow]);
    } catch (PDOException $e) {
        echo json_encode(['success' => true, 'allow_registration' => false]);
    }
    exit;
}

if ($action === 'toggle_registration') {
    $newStatus = $data['allow_registration'] ? 'true' : 'false';
    try {
        $stmt = $pdo->prepare("INSERT INTO settings (setting_key, setting_value) VALUES ('allow_registration', ?) ON DUPLICATE KEY UPDATE setting_value = ?");
        $stmt->execute([$newStatus, $newStatus]);
        echo json_encode(['success' => true]);
    } catch (PDOException $e) {
        echo json_encode(['error' => 'Failed to update settings']);
    }
    exit;
}

if ($action === 'list_waitlist') {
    try {
        $stmt = $pdo->query("SELECT id, email, temp_password, created_at FROM waitlist ORDER BY id ASC");
        $waitlist = $stmt->fetchAll();
        echo json_encode(['success' => true, 'waitlist' => $waitlist]);
    } catch (PDOException $e) {
        echo json_encode(['error' => 'Failed to fetch waitlist']);
    }
    exit;
}

if ($action === 'delete_waitlist') {
    $target_id = $data['target_id'] ?? null;
    if (!$target_id) {
        echo json_encode(['error' => 'Target waitlist ID required']);
        exit;
    }
    try {
        $stmt = $pdo->prepare("DELETE FROM waitlist WHERE id = ?");
        $stmt->execute([$target_id]);
        echo json_encode(['success' => true]);
    } catch (PDOException $e) {
        echo json_encode(['error' => 'Failed to delete waitlist entry']);
    }
    exit;
}

echo json_encode(['error' => 'Invalid action']);
?>
