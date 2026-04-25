<?php
require_once 'db.php';

$data = json_decode(file_get_contents('php://input'), true);

if (!isset($data['user_id']) || !isset($data['save_data'])) {
    http_response_code(400);
    echo json_encode(['error' => 'Missing data']);
    exit;
}

$user_id = $data['user_id'];
$save_data = json_encode($data['save_data']); // Ensure it's stringified JSON

// Upsert (Insert or Update)
$stmt = $pdo->prepare("
    INSERT INTO game_saves (user_id, save_data) 
    VALUES (?, ?) 
    ON DUPLICATE KEY UPDATE save_data = VALUES(save_data), last_updated = CURRENT_TIMESTAMP
");

try {
    $stmt->execute([$user_id, $save_data]);
    echo json_encode(['success' => true]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Failed to save game: ' . $e->getMessage()]);
}
?>
