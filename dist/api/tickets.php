<?php
require_once 'db.php';

$data = json_decode(file_get_contents('php://input'), true);
$action = $_GET['action'] ?? '';

// ---------- Auto-migrate ----------
try {
    $pdo->exec("CREATE TABLE IF NOT EXISTS tickets (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        username VARCHAR(255) NOT NULL,
        category ENUM('bug','feature','account','other') NOT NULL DEFAULT 'other',
        priority ENUM('low','normal','high','urgent') NOT NULL DEFAULT 'normal',
        subject VARCHAR(255) NOT NULL,
        message TEXT NOT NULL,
        status ENUM('open','in_progress','resolved','closed') NOT NULL DEFAULT 'open',
        admin_reply TEXT DEFAULT NULL,
        admin_id INT DEFAULT NULL,
        replied_at TIMESTAMP NULL DEFAULT NULL,
        resolved_at TIMESTAMP NULL DEFAULT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_status (status),
        INDEX idx_user (user_id),
        INDEX idx_priority (priority)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");
} catch (PDOException $e) { /* exists */ }

// ---------- Public: user submits a ticket ----------

if ($action === 'submit') {
    $user_id = (int)($data['user_id'] ?? 0);
    $username = trim($data['username'] ?? '');
    $subject = trim($data['subject'] ?? '');
    $message = trim($data['message'] ?? '');
    $category = in_array($data['category'] ?? '', ['bug','feature','account','other']) ? $data['category'] : 'other';
    $priority = in_array($data['priority'] ?? '', ['low','normal','high','urgent']) ? $data['priority'] : 'normal';

    if (!$user_id || !$username) { http_response_code(401); echo json_encode(['error' => 'Login required']); exit; }
    if (!$subject || !$message) { http_response_code(400); echo json_encode(['error' => 'Subject and message required']); exit; }
    if (strlen($subject) > 255) { http_response_code(400); echo json_encode(['error' => 'Subject too long']); exit; }

    try {
        $stmt = $pdo->prepare("INSERT INTO tickets (user_id, username, category, priority, subject, message) VALUES (?, ?, ?, ?, ?, ?)");
        $stmt->execute([$user_id, $username, $category, $priority, $subject, $message]);
        echo json_encode(['success' => true, 'id' => $pdo->lastInsertId()]);
    } catch (PDOException $e) {
        http_response_code(500); echo json_encode(['error' => 'Failed to create ticket']);
    }
    exit;
}

if ($action === 'my_tickets') {
    $user_id = (int)($data['user_id'] ?? 0);
    if (!$user_id) { http_response_code(401); echo json_encode(['error' => 'Login required']); exit; }
    try {
        $stmt = $pdo->prepare("SELECT id, category, priority, subject, status, admin_reply, replied_at, created_at FROM tickets WHERE user_id = ? ORDER BY created_at DESC LIMIT 50");
        $stmt->execute([$user_id]);
        echo json_encode(['success' => true, 'tickets' => $stmt->fetchAll()]);
    } catch (PDOException $e) {
        http_response_code(500); echo json_encode(['error' => 'Failed to fetch tickets']);
    }
    exit;
}

// ---------- Admin check ----------

$admin_id = (int)($data['admin_id'] ?? 0);
if (!$admin_id) { http_response_code(401); echo json_encode(['error' => 'Login required']); exit; }

$stmt = $pdo->prepare("SELECT is_admin FROM users WHERE id = ?");
$stmt->execute([$admin_id]);
$adminUser = $stmt->fetch();
if (!$adminUser || !$adminUser['is_admin']) {
    http_response_code(403); echo json_encode(['error' => 'Forbidden: Admins only']); exit;
}

// ---------- Admin: list all tickets ----------

if ($action === 'list') {
    $status_filter = $_GET['status'] ?? null;
    $sql = "SELECT id, user_id, username, category, priority, subject, message, status, admin_reply, admin_id, replied_at, resolved_at, created_at FROM tickets";
    $params = [];
    if ($status_filter && in_array($status_filter, ['open','in_progress','resolved','closed'])) {
        $sql .= " WHERE status = ?";
        $params[] = $status_filter;
    }
    $sql .= " ORDER BY FIELD(status,'open','in_progress','resolved','closed'), FIELD(priority,'urgent','high','normal','low'), created_at DESC";
    try {
        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);
        echo json_encode(['success' => true, 'tickets' => $stmt->fetchAll()]);
    } catch (PDOException $e) {
        http_response_code(500); echo json_encode(['error' => 'Failed to list tickets']);
    }
    exit;
}

// ---------- Admin: reply to ticket ----------

if ($action === 'reply') {
    $ticket_id = (int)($data['ticket_id'] ?? 0);
    $reply = trim($data['reply'] ?? '');
    $new_status = in_array($data['status'] ?? '', ['open','in_progress','resolved','closed']) ? $data['status'] : null;

    if (!$ticket_id || !$reply) { http_response_code(400); echo json_encode(['error' => 'Ticket ID and reply required']); exit; }

    try {
        $resolved_at = ($new_status === 'resolved' || $new_status === 'closed') ? date('Y-m-d H:i:s') : null;
        $sql = "UPDATE tickets SET admin_reply = ?, admin_id = ?, replied_at = CURRENT_TIMESTAMP";
        $params = [$reply, $admin_id];
        if ($new_status) {
            $sql .= ", status = ?";
            $params[] = $new_status;
        }
        if ($resolved_at) {
            $sql .= ", resolved_at = ?";
            $params[] = $resolved_at;
        }
        $sql .= " WHERE id = ?";
        $params[] = $ticket_id;
        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);
        echo json_encode(['success' => true]);
    } catch (PDOException $e) {
        http_response_code(500); echo json_encode(['error' => 'Failed to reply']);
    }
    exit;
}

// ---------- Admin: update ticket status ----------

if ($action === 'update_status') {
    $ticket_id = (int)($data['ticket_id'] ?? 0);
    $new_status = in_array($data['status'] ?? '', ['open','in_progress','resolved','closed']) ? $data['status'] : null;
    if (!$ticket_id || !$new_status) { http_response_code(400); echo json_encode(['error' => 'Invalid request']); exit; }

    try {
        $resolved_at = ($new_status === 'resolved' || $new_status === 'closed') ? date('Y-m-d H:i:s') : null;
        $stmt = $pdo->prepare("UPDATE tickets SET status = ?, resolved_at = COALESCE(?, resolved_at) WHERE id = ?");
        $stmt->execute([$new_status, $resolved_at, $ticket_id]);
        echo json_encode(['success' => true]);
    } catch (PDOException $e) {
        http_response_code(500); echo json_encode(['error' => 'Failed to update status']);
    }
    exit;
}

// ---------- Admin: delete ticket ----------

if ($action === 'delete') {
    $ticket_id = (int)($data['ticket_id'] ?? 0);
    if (!$ticket_id) { http_response_code(400); echo json_encode(['error' => 'Ticket ID required']); exit; }
    try {
        $pdo->prepare("DELETE FROM tickets WHERE id = ?")->execute([$ticket_id]);
        echo json_encode(['success' => true]);
    } catch (PDOException $e) {
        http_response_code(500); echo json_encode(['error' => 'Failed to delete']);
    }
    exit;
}

// ---------- Admin: stats ----------

if ($action === 'stats') {
    try {
        $counts = $pdo->query("SELECT status, COUNT(*) as count FROM tickets GROUP BY status")->fetchAll();
        $byCategory = $pdo->query("SELECT category, COUNT(*) as count FROM tickets GROUP BY category")->fetchAll();
        echo json_encode(['success' => true, 'by_status' => $counts, 'by_category' => $byCategory]);
    } catch (PDOException $e) {
        http_response_code(500); echo json_encode(['error' => 'Failed to get stats']);
    }
    exit;
}

echo json_encode(['error' => 'Unknown action']);
