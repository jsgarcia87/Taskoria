<?php
require_once 'db.php';

$user_id = $_GET['user_id'] ?? null;

if (!$user_id) {
    http_response_code(400);
    echo json_encode(['error' => 'User ID required']);
    exit;
}

$stmt = $pdo->prepare("SELECT save_data FROM game_saves WHERE user_id = ?");
$stmt->execute([$user_id]);
$result = $stmt->fetch();

if ($result) {
    echo $result['save_data']; // Return the raw JSON saved
} else {
    echo json_encode(['error' => 'No save found', 'empty' => true]);
}
?>
