<?php
require_once 'db.php';

$data = json_decode(file_get_contents('php://input'), true);
$action = $_GET['action'] ?? '';

// Auto-migrate studio_access column on users (early, before any action runs)
try {
    $pdo->exec("ALTER TABLE users ADD COLUMN studio_access ENUM('none','pending','approved','rejected') NOT NULL DEFAULT 'none'");
} catch (PDOException $e) { /* column exists */ }
try {
    $pdo->exec("ALTER TABLE users ADD COLUMN studio_reject_reason VARCHAR(255) DEFAULT NULL");
} catch (PDOException $e) { /* exists */ }
try {
    $pdo->exec("ALTER TABLE users ADD COLUMN studio_requested_at TIMESTAMP NULL DEFAULT NULL");
} catch (PDOException $e) { /* exists */ }

// --- Public (user-level) actions: no admin check required ---

if ($action === 'request_studio_access') {
    $user_id = (int)($data['user_id'] ?? 0);
    if (!$user_id) { http_response_code(401); echo json_encode(['error' => 'Login required']); exit; }
    try {
        $stmt = $pdo->prepare("SELECT studio_access FROM users WHERE id = ?");
        $stmt->execute([$user_id]);
        $row = $stmt->fetch();
        if (!$row) { http_response_code(404); echo json_encode(['error' => 'User not found']); exit; }
        if ($row['studio_access'] === 'approved') { echo json_encode(['success' => true, 'status' => 'approved']); exit; }
        if ($row['studio_access'] === 'pending') { echo json_encode(['success' => true, 'status' => 'pending']); exit; }
        // 'none' or 'rejected' → set to pending
        $up = $pdo->prepare("UPDATE users SET studio_access = 'pending', studio_reject_reason = NULL, studio_requested_at = CURRENT_TIMESTAMP WHERE id = ?");
        $up->execute([$user_id]);
        echo json_encode(['success' => true, 'status' => 'pending']);
    } catch (PDOException $e) {
        http_response_code(500); echo json_encode(['error' => 'Failed to request access']);
    }
    exit;
}

if ($action === 'my_studio_status') {
    $user_id = (int)($data['user_id'] ?? 0);
    if (!$user_id) { http_response_code(401); echo json_encode(['error' => 'Login required']); exit; }
    try {
        $stmt = $pdo->prepare("SELECT studio_access, studio_reject_reason, studio_requested_at FROM users WHERE id = ?");
        $stmt->execute([$user_id]);
        $row = $stmt->fetch();
        echo json_encode([
            'success' => true,
            'status' => $row['studio_access'] ?? 'none',
            'reject_reason' => $row['studio_reject_reason'] ?? null,
            'requested_at' => $row['studio_requested_at'] ?? null,
        ]);
    } catch (PDOException $e) {
        http_response_code(500); echo json_encode(['error' => 'Failed']);
    }
    exit;
}

if ($action === 'submit_suggestion') {
    $user_id = (int)($data['user_id'] ?? 0);
    $username = trim($data['username'] ?? '');
    $message = trim($data['message'] ?? '');

    if (!$user_id || !$username) { http_response_code(401); echo json_encode(['error' => 'Login required']); exit; }
    if ($message === '') { http_response_code(400); echo json_encode(['error' => 'Please write a suggestion before sending.']); exit; }
    if (mb_strlen($message) > 2000) { http_response_code(400); echo json_encode(['error' => 'Suggestion is too long (max 2000 characters).']); exit; }

    try {
        $pdo->exec("
            CREATE TABLE IF NOT EXISTS suggestions (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NOT NULL,
                username VARCHAR(255) NOT NULL,
                message TEXT NOT NULL,
                status ENUM('new','read','archived') NOT NULL DEFAULT 'new',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                INDEX idx_status (status)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
        ");

        $stmt = $pdo->prepare("INSERT INTO suggestions (user_id, username, message) VALUES (?, ?, ?)");
        $stmt->execute([$user_id, $username, $message]);

        // Best-effort notifications — a failed email should never block the submission.
        $safeMessage = nl2br(htmlspecialchars($message));
        $safeUsername = htmlspecialchars($username);

        try {
            require_once __DIR__ . '/send_email.php';
            send_taskoria_email(
                'taskoriaapp@gmail.com',
                "New suggestion from {$username}",
                "<div style='font-family: Arial, sans-serif;'><p><strong>{$safeUsername}</strong> submitted a new suggestion:</p><blockquote style='border-left: 3px solid #FFD700; margin: 10px 0; padding-left: 12px;'>{$safeMessage}</blockquote></div>"
            );
        } catch (Throwable $e) { /* notification is best-effort only */ }

        // Confirmation email back to the submitter (username doubles as the login email).
        try {
            require_once __DIR__ . '/send_email.php';
            $confirmationBody = "
            <html>
            <body style='font-family: Arial, sans-serif; background-color: #1a1a2e; color: #ffffff; padding: 20px;'>
                <div style='max-width: 600px; margin: 0 auto; background-color: #16213e; padding: 30px; border-radius: 10px; border: 1px solid #FFD700;'>
                    <h2 style='color: #FFD700; text-align: center;'>🧱 ¡Sugerencia Recibida!</h2>
                    <p>Saludos, {$safeUsername}:</p>
                    <p>Nuestros maestros canteros han recibido tu solicitud y se pondrán a revisarla lo antes posible.</p>
                    <div style='background-color: #0f3460; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 3px solid #FFD700;'>
                        {$safeMessage}
                    </div>
                    <p style='margin-top: 30px; font-size: 12px; color: #888; text-align: center;'>El Reino de Taskoria</p>
                </div>
            </body>
            </html>
            ";
            send_taskoria_email($username, 'Tu sugerencia ha llegado a Taskoria', $confirmationBody);
        } catch (Throwable $e) { /* confirmation is best-effort only */ }

        echo json_encode(['success' => true, 'message' => 'Thanks! Your suggestion reached the guild.']);
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['error' => 'Failed to save suggestion']);
    }
    exit;
}

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

// Auto-migrate waitlist to include temp_password
try {
    $pdo->exec("ALTER TABLE waitlist ADD COLUMN temp_password VARCHAR(255) DEFAULT NULL;");
} catch (PDOException $e) {
    // Ignore
}

// Auto-create settings table if not exists
try {
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS settings (
            setting_key VARCHAR(100) PRIMARY KEY,
            setting_value VARCHAR(255) NOT NULL
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8;
    ");
    $pdo->exec("INSERT IGNORE INTO settings (setting_key, setting_value) VALUES ('allow_registration', 'true')");
} catch (PDOException $e) {
    // Ignore
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

// --- Suggestion box (admin-side review) ---

if ($action === 'list_suggestions') {
    try {
        $pdo->exec("
            CREATE TABLE IF NOT EXISTS suggestions (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NOT NULL,
                username VARCHAR(255) NOT NULL,
                message TEXT NOT NULL,
                status ENUM('new','read','archived') NOT NULL DEFAULT 'new',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                INDEX idx_status (status)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
        ");
        $stmt = $pdo->query("SELECT id, user_id, username, message, status, created_at FROM suggestions ORDER BY created_at DESC");
        $suggestions = $stmt->fetchAll();
        echo json_encode(['success' => true, 'suggestions' => $suggestions]);
    } catch (PDOException $e) {
        echo json_encode(['error' => 'Failed to fetch suggestions']);
    }
    exit;
}

if ($action === 'mark_suggestion_read') {
    $target_id = $data['target_id'] ?? null;
    if (!$target_id) { echo json_encode(['error' => 'Target suggestion ID required']); exit; }
    try {
        $stmt = $pdo->prepare("UPDATE suggestions SET status = 'read' WHERE id = ?");
        $stmt->execute([$target_id]);
        echo json_encode(['success' => true]);
    } catch (PDOException $e) {
        echo json_encode(['error' => 'Failed to update suggestion']);
    }
    exit;
}

if ($action === 'delete_suggestion') {
    $target_id = $data['target_id'] ?? null;
    if (!$target_id) { echo json_encode(['error' => 'Target suggestion ID required']); exit; }
    try {
        $stmt = $pdo->prepare("DELETE FROM suggestions WHERE id = ?");
        $stmt->execute([$target_id]);
        echo json_encode(['success' => true]);
    } catch (PDOException $e) {
        echo json_encode(['error' => 'Failed to delete suggestion']);
    }
    exit;
}

// --- Admin design library (house / map editor saves) ---

try {
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS admin_designs (
            id INT AUTO_INCREMENT PRIMARY KEY,
            admin_id INT NOT NULL,
            tool VARCHAR(20) NOT NULL,
            name VARCHAR(120) NOT NULL,
            snippet LONGTEXT NOT NULL,
            payload LONGTEXT DEFAULT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            INDEX idx_admin (admin_id),
            INDEX idx_tool (tool)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    ");
} catch (PDOException $e) { /* ignore */ }

if ($action === 'save_design') {
    $tool = (string)($data['tool'] ?? '');
    $name = trim((string)($data['name'] ?? ''));
    $snippet = (string)($data['snippet'] ?? '');
    $payload = isset($data['payload']) ? json_encode($data['payload']) : null;
    if (!in_array($tool, ['house', 'map'], true)) { http_response_code(400); echo json_encode(['error' => 'Invalid tool']); exit; }
    if ($name === '') $name = $tool . '_' . date('Ymd_His');
    if ($snippet === '') { http_response_code(400); echo json_encode(['error' => 'Empty snippet']); exit; }
    try {
        $stmt = $pdo->prepare("INSERT INTO admin_designs (admin_id, tool, name, snippet, payload) VALUES (?, ?, ?, ?, ?)");
        $stmt->execute([$admin_id, $tool, $name, $snippet, $payload]);
        echo json_encode(['success' => true, 'id' => $pdo->lastInsertId(), 'name' => $name]);
    } catch (PDOException $e) {
        http_response_code(500); echo json_encode(['error' => 'Failed to save design']);
    }
    exit;
}

if ($action === 'list_designs') {
    $tool = $data['tool'] ?? null;
    try {
        if ($tool && in_array($tool, ['house', 'map'], true)) {
            $stmt = $pdo->prepare("SELECT id, tool, name, snippet, created_at FROM admin_designs WHERE tool = ? ORDER BY created_at DESC LIMIT 100");
            $stmt->execute([$tool]);
        } else {
            $stmt = $pdo->query("SELECT id, tool, name, snippet, created_at FROM admin_designs ORDER BY created_at DESC LIMIT 100");
        }
        echo json_encode(['success' => true, 'designs' => $stmt->fetchAll()]);
    } catch (PDOException $e) {
        http_response_code(500); echo json_encode(['error' => 'Failed to list designs']);
    }
    exit;
}

if ($action === 'delete_design') {
    $id = (int)($data['id'] ?? 0);
    if (!$id) { http_response_code(400); echo json_encode(['error' => 'id required']); exit; }
    try {
        $stmt = $pdo->prepare("DELETE FROM admin_designs WHERE id = ?");
        $stmt->execute([$id]);
        echo json_encode(['success' => true]);
    } catch (PDOException $e) {
        http_response_code(500); echo json_encode(['error' => 'Failed to delete']);
    }
    exit;
}

// --- Studio access moderation (admin-only) ---

if ($action === 'list_studio_requests') {
    try {
        $stmt = $pdo->query("
            SELECT id, username, studio_access AS status, studio_reject_reason, studio_requested_at, created_at
            FROM users
            WHERE studio_access IN ('pending','approved','rejected')
            ORDER BY FIELD(studio_access,'pending','rejected','approved'), studio_requested_at DESC
        ");
        echo json_encode(['success' => true, 'requests' => $stmt->fetchAll()]);
    } catch (PDOException $e) {
        http_response_code(500); echo json_encode(['error' => 'Failed to list requests']);
    }
    exit;
}

if ($action === 'moderate_studio_request') {
    $target_id = (int)($data['target_id'] ?? 0);
    $decision = $data['decision'] ?? '';
    $reason = isset($data['reason']) ? substr((string)$data['reason'], 0, 255) : null;
    if (!$target_id || !in_array($decision, ['approved','rejected','none'], true)) {
        http_response_code(400); echo json_encode(['error' => 'Invalid request']); exit;
    }
    try {
        $stmt = $pdo->prepare("UPDATE users SET studio_access = ?, studio_reject_reason = ? WHERE id = ?");
        $stmt->execute([$decision, $decision === 'rejected' ? $reason : null, $target_id]);
        echo json_encode(['success' => true]);
    } catch (PDOException $e) {
        http_response_code(500); echo json_encode(['error' => 'Failed to moderate']);
    }
    exit;
}

echo json_encode(['error' => 'Invalid action']);
?>
