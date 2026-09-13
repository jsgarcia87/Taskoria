<?php
require_once 'db.php';

$data = json_decode(file_get_contents('php://input'), true);
$action = $_GET['action'] ?? '';

// ---------- Auto-migrate ----------
try {
    $pdo->exec("CREATE TABLE IF NOT EXISTS email_templates (
        id INT AUTO_INCREMENT PRIMARY KEY,
        slug VARCHAR(100) NOT NULL UNIQUE,
        name VARCHAR(255) NOT NULL,
        subject VARCHAR(255) NOT NULL,
        body_html TEXT NOT NULL,
        variables TEXT DEFAULT NULL,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_slug (slug)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");

    $check = $pdo->query("SELECT COUNT(*) FROM email_templates")->fetchColumn();
    if ($check == 0) {
        $defaults = [
            [
                'welcome',
                'Welcome Email',
                'Welcome to The Taskoria Beta!',
                "<html><head><title>Welcome to The Taskoria</title></head><body style='font-family: Arial, sans-serif; background-color: #1a1a2e; color: #ffffff; padding: 20px;'><div style='max-width: 600px; margin: 0 auto; background-color: #16213e; padding: 30px; border-radius: 10px; border: 1px solid #e94560;'><h2 style='color: #e94560; text-align: center;'>Welcome to The Taskoria Beta!</h2><p>Greetings Adventurer,</p><p>Your beta account has been created successfully. Prepare to gamify your life and defeat epic bosses!</p><div style='background-color: #0f3460; padding: 15px; border-radius: 5px; margin: 20px 0;'><p style='margin: 5px 0;'><strong>Username:</strong> {{username}}</p><p style='margin: 5px 0;'><strong>Password:</strong> {{password}}</p></div><p>Keep these credentials safe. You can log in immediately and start your journey.</p><p style='margin-top: 30px; font-size: 12px; color: #888; text-align: center;'>The Taskoria Realm</p></div></body></html>",
                'username,password'
            ],
            [
                'waitlist_approved',
                'Waitlist Approved',
                'Welcome to The Taskoria Beta!',
                "<html><head><title>Welcome to The Taskoria</title></head><body style='font-family: Arial, sans-serif; background-color: #1a1a2e; color: #ffffff; padding: 20px;'><div style='max-width: 600px; margin: 0 auto; background-color: #16213e; padding: 30px; border-radius: 10px; border: 1px solid #e94560;'><h2 style='color: #e94560; text-align: center;'>Welcome to The Taskoria Beta!</h2><p>Greetings Adventurer,</p><p>You joined the waitlist, but we decided you belonged to our guild already! Your beta account has been created.</p><div style='background-color: #0f3460; padding: 15px; border-radius: 5px; margin: 20px 0;'><p style='margin: 5px 0;'><strong>Username (Email):</strong> {{email}}</p><p style='margin: 5px 0;'><strong>Temporary Password:</strong> {{password}}</p></div><p>Keep these credentials safe. You can log in immediately and start your journey.</p><p style='margin-top: 30px; font-size: 12px; color: #888; text-align: center;'>The Taskoria Realm</p></div></body></html>",
                'email,password'
            ],
        ];
        $stmt = $pdo->prepare("INSERT INTO email_templates (slug, name, subject, body_html, variables) VALUES (?, ?, ?, ?, ?)");
        foreach ($defaults as $d) $stmt->execute($d);
    }
} catch (PDOException $e) { /* exists */ }

// ---------- Admin check ----------

$admin_id = (int)($data['admin_id'] ?? 0);
if (!$admin_id) { http_response_code(401); echo json_encode(['error' => 'Login required']); exit; }

$stmt = $pdo->prepare("SELECT is_admin FROM users WHERE id = ?");
$stmt->execute([$admin_id]);
$adminUser = $stmt->fetch();
if (!$adminUser || !$adminUser['is_admin']) {
    http_response_code(403); echo json_encode(['error' => 'Forbidden']); exit;
}

// ---------- List templates ----------

if ($action === 'list') {
    try {
        $rows = $pdo->query("SELECT id, slug, name, subject, variables, updated_at FROM email_templates ORDER BY slug")->fetchAll();
        echo json_encode(['success' => true, 'templates' => $rows]);
    } catch (PDOException $e) {
        http_response_code(500); echo json_encode(['error' => 'Failed to list templates']);
    }
    exit;
}

// ---------- Get single template ----------

if ($action === 'get') {
    $slug = trim($data['slug'] ?? '');
    if (!$slug) { http_response_code(400); echo json_encode(['error' => 'Slug required']); exit; }
    try {
        $stmt = $pdo->prepare("SELECT * FROM email_templates WHERE slug = ?");
        $stmt->execute([$slug]);
        $row = $stmt->fetch();
        if (!$row) { http_response_code(404); echo json_encode(['error' => 'Template not found']); exit; }
        echo json_encode(['success' => true, 'template' => $row]);
    } catch (PDOException $e) {
        http_response_code(500); echo json_encode(['error' => 'Failed to get template']);
    }
    exit;
}

// ---------- Save template ----------

if ($action === 'save') {
    $slug = trim($data['slug'] ?? '');
    $name = trim($data['name'] ?? '');
    $subject = trim($data['subject'] ?? '');
    $body_html = $data['body_html'] ?? '';
    $variables = trim($data['variables'] ?? '');

    if (!$slug || !$name || !$subject || !$body_html) {
        http_response_code(400); echo json_encode(['error' => 'All fields required']); exit;
    }

    try {
        $stmt = $pdo->prepare("SELECT id FROM email_templates WHERE slug = ?");
        $stmt->execute([$slug]);
        if ($stmt->fetch()) {
            $stmt = $pdo->prepare("UPDATE email_templates SET name = ?, subject = ?, body_html = ?, variables = ? WHERE slug = ?");
            $stmt->execute([$name, $subject, $body_html, $variables, $slug]);
        } else {
            $stmt = $pdo->prepare("INSERT INTO email_templates (slug, name, subject, body_html, variables) VALUES (?, ?, ?, ?, ?)");
            $stmt->execute([$slug, $name, $subject, $body_html, $variables]);
        }
        echo json_encode(['success' => true]);
    } catch (PDOException $e) {
        http_response_code(500); echo json_encode(['error' => 'Failed to save template']);
    }
    exit;
}

// ---------- Delete template ----------

if ($action === 'delete') {
    $slug = trim($data['slug'] ?? '');
    if (!$slug) { http_response_code(400); echo json_encode(['error' => 'Slug required']); exit; }
    try {
        $pdo->prepare("DELETE FROM email_templates WHERE slug = ?")->execute([$slug]);
        echo json_encode(['success' => true]);
    } catch (PDOException $e) {
        http_response_code(500); echo json_encode(['error' => 'Failed to delete']);
    }
    exit;
}

// ---------- Send test email ----------

if ($action === 'test_send') {
    $slug = trim($data['slug'] ?? '');
    $to = trim($data['to'] ?? '');
    if (!$slug || !$to) { http_response_code(400); echo json_encode(['error' => 'Slug and recipient required']); exit; }

    try {
        $stmt = $pdo->prepare("SELECT subject, body_html, variables FROM email_templates WHERE slug = ?");
        $stmt->execute([$slug]);
        $tpl = $stmt->fetch();
        if (!$tpl) { http_response_code(404); echo json_encode(['error' => 'Template not found']); exit; }

        $body = $tpl['body_html'];
        $vars = array_filter(array_map('trim', explode(',', $tpl['variables'] ?? '')));
        foreach ($vars as $v) {
            $body = str_replace('{{' . $v . '}}', '[TEST_' . strtoupper($v) . ']', $body);
        }

        require_once __DIR__ . '/send_email.php';
        $sent = send_taskoria_email($to, '[TEST] ' . $tpl['subject'], $body);
        echo json_encode(['success' => $sent, 'message' => $sent ? 'Test email sent' : 'Failed to send']);
    } catch (Exception $e) {
        http_response_code(500); echo json_encode(['error' => 'Send failed']);
    }
    exit;
}

echo json_encode(['error' => 'Unknown action']);
