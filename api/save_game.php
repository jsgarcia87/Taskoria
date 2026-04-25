<?php
require_once 'db.php';

header('Content-Type: application/json');

// Get raw input
$input = file_get_contents('php://input');
$data = json_decode($input, true);

if (!isset($data['user_id']) || !isset($data['save_data'])) {
    http_response_code(400);
    echo json_encode(['error' => 'Missing data', 'received' => $data]);
    exit;
}

$user_id = $data['user_id'];
// Validate save_data is an array/object before encoding
if (!is_array($data['save_data']) && !is_object($data['save_data'])) {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid save_data format']);
    exit;
}

$save_data = json_encode($data['save_data']); 

try {
    // Check if user exists in game_saves
    $checkStmt = $pdo->prepare("SELECT id FROM game_saves WHERE user_id = ?");
    $checkStmt->execute([$user_id]);
    $exists = $checkStmt->fetch();

    if ($exists) {
        // Update
        $stmt = $pdo->prepare("UPDATE game_saves SET save_data = ?, last_updated = CURRENT_TIMESTAMP WHERE user_id = ?");
        $stmt->execute([$save_data, $user_id]);
    } else {
        // Insert
        $stmt = $pdo->prepare("INSERT INTO game_saves (user_id, save_data) VALUES (?, ?)");
        $stmt->execute([$user_id, $save_data]);
    }

    // Also update their last_active_at timestamp so they show as "online"
    $pdo->exec("UPDATE users SET last_active_at = CURRENT_TIMESTAMP WHERE id = " . $user_id);

    echo json_encode(['success' => true]);

} catch (Exception $e) {
    http_response_code(500);
    error_log("Save Game Error: " . $e->getMessage()); 
    echo json_encode(['error' => 'Failed to save game: ' . $e->getMessage()]);
}
?>
