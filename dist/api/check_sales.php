<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

require_once 'db.php';

try {
    // Asegurarse de que la tabla temporal de ventas existe
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS market_sales (
            id INT AUTO_INCREMENT PRIMARY KEY,
            seller_id INT NOT NULL,
            profile_id VARCHAR(50) NOT NULL,
            item_name VARCHAR(100) NOT NULL,
            gold_amount INT NOT NULL,
            processed BOOLEAN DEFAULT FALSE,
            sold_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8;
    ");
} catch (PDOException $e) {
    // Silently ignore if it exists or fails
}

$user_id = $_GET['user_id'] ?? null;
$profile_id = $_GET['profile_id'] ?? null;

if (!$user_id || !$profile_id) {
    echo json_encode(['error' => 'Missing user_id or profile_id']);
    exit;
}

try {
    // Check for unprocessed sales for this exact profile
    $stmt = $pdo->prepare("SELECT id, item_name, gold_amount FROM market_sales WHERE seller_id = ? AND profile_id = ? AND processed = 0");
    $stmt->execute([$user_id, $profile_id]);
    $sales = $stmt->fetchAll(PDO::FETCH_ASSOC);

    if (count($sales) > 0) {
        // Mark them as processed right away
        $sale_ids = array_column($sales, 'id');
        $placeholders = implode(',', array_fill(0, count($sale_ids), '?'));
        $upd = $pdo->prepare("UPDATE market_sales SET processed = 1 WHERE id IN ($placeholders)");
        $upd->execute($sale_ids);
        
        echo json_encode(['sales' => $sales]);
    } else {
        echo json_encode(['sales' => []]);
    }

} catch (PDOException $e) {
    echo json_encode(['error' => 'Failed to check sales']);
}
?>
