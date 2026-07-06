<?php
require_once 'db.php';

// Only POST is allowed
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed.']);
    exit;
}

$data = json_decode(file_get_contents('php://input'), true);

$message = isset($data['message']) ? trim($data['message']) : '';
if ($message === '' || mb_strlen($message) < 3) {
    http_response_code(400);
    echo json_encode(['error' => 'Please write a longer message.']);
    exit;
}
if (mb_strlen($message) > 4000) {
    http_response_code(400);
    echo json_encode(['error' => 'Message too long (max 4000 characters).']);
    exit;
}

$userId    = isset($data['user_id'])    ? (int)$data['user_id']    : null;
$profileId = isset($data['profile_id']) ? trim($data['profile_id']) : null;
$url       = isset($data['url'])        ? substr(trim($data['url']), 0, 500) : null;
$category  = isset($data['category'])   ? substr(trim($data['category']), 0, 40) : 'general';
$userAgent = isset($_SERVER['HTTP_USER_AGENT']) ? substr($_SERVER['HTTP_USER_AGENT'], 0, 400) : null;

try {
    // Create table if it doesn't exist yet — same pattern as waitlist.php
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS feedback (
            id INT AUTO_INCREMENT PRIMARY KEY,
            user_id INT DEFAULT NULL,
            profile_id VARCHAR(64) DEFAULT NULL,
            category VARCHAR(40) DEFAULT 'general',
            message TEXT NOT NULL,
            url VARCHAR(500) DEFAULT NULL,
            user_agent VARCHAR(400) DEFAULT NULL,
            reviewed TINYINT(1) DEFAULT 0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            INDEX idx_user_id (user_id),
            INDEX idx_reviewed (reviewed),
            INDEX idx_created_at (created_at)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    ");

    $stmt = $pdo->prepare("
        INSERT INTO feedback (user_id, profile_id, category, message, url, user_agent)
        VALUES (?, ?, ?, ?, ?, ?)
    ");
    $stmt->execute([$userId, $profileId, $category, $message, $url, $userAgent]);

    echo json_encode([
        'success' => true,
        'message' => 'Thanks! Your feedback reached the guild.',
    ]);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Database error: ' . $e->getMessage()]);
}
