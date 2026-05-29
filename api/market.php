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
        CREATE TABLE IF NOT EXISTS community_market (
            id INT AUTO_INCREMENT PRIMARY KEY,
            seller_id INT NOT NULL,
            profile_id VARCHAR(50) NOT NULL,
            seller_name VARCHAR(100) NOT NULL,
            item_data JSON NOT NULL,
            price INT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (seller_id) REFERENCES users(id) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8;
    ");
} catch (PDOException $e) {
    // Ignore
}

$action = $_GET['action'] ?? '';

if ($_SERVER['REQUEST_METHOD'] === 'GET' && $action === 'list') {
    try {
        $stmt = $pdo->query("SELECT * FROM community_market ORDER BY created_at DESC LIMIT 100");
        $items = $stmt->fetchAll();
        foreach ($items as &$item) {
            $item['item_data'] = json_decode($item['item_data'], true);
        }
        echo json_encode(['items' => $items]);
    } catch (PDOException $e) {
        echo json_encode(['error' => 'Failed to fetch market items']);
    }
    exit;
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $data = json_decode(file_get_contents("php://input"), true);
    
    if ($action === 'sell') {
        $seller_id = $data['user_id'] ?? null;
        $profile_id = $data['profile_id'] ?? null;
        $seller_name = $data['seller_name'] ?? null;
        $item_data = $data['item'] ?? null;
        $price = $data['price'] ?? null;
        
        if (!$seller_id || !$profile_id || !$seller_name || !$item_data || !$price) {
            echo json_encode(['error' => 'Missing required fields']);
            exit;
        }
        
        try {
            $stmt = $pdo->prepare("INSERT INTO community_market (seller_id, profile_id, seller_name, item_data, price) VALUES (?, ?, ?, ?, ?)");
            $stmt->execute([$seller_id, $profile_id, $seller_name, json_encode($item_data), $price]);
            echo json_encode(['success' => true]);
        } catch (PDOException $e) {
            echo json_encode(['error' => 'Failed to list item']);
        }
        exit;
    }
    
    if ($action === 'buy') {
        $listing_id = $data['listing_id'] ?? null;
        if (!$listing_id) {
            echo json_encode(['error' => 'Missing listing_id']);
            exit;
        }
        
        try {
            $pdo->beginTransaction();
            
            $stmt = $pdo->prepare("SELECT * FROM community_market WHERE id = ? FOR UPDATE");
            $stmt->execute([$listing_id]);
            $listing = $stmt->fetch();
            
            if (!$listing) {
                $pdo->rollBack();
                echo json_encode(['error' => 'Item not found or already sold']);
                exit;
            }
            
            // Delete from market
            $delStmt = $pdo->prepare("DELETE FROM community_market WHERE id = ?");
            $delStmt->execute([$listing_id]);
            
            // Give seller the gold safely via market_sales table (avoiding JSON race condition)
            $seller_id = $listing['seller_id'];
            $seller_profile = $listing['profile_id'];
            $price = $listing['price'];
            $item_data_decoded = json_decode($listing['item_data'], true);
            $item_name = $item_data_decoded['name'] ?? 'Unknown Item';
            
            // Insert into pending sales
            // table format: id, seller_id, profile_id, item_name, gold_amount, processed
            $insStmt = $pdo->prepare("INSERT INTO market_sales (seller_id, profile_id, item_name, gold_amount, processed) VALUES (?, ?, ?, ?, 0)");
            $insStmt->execute([$seller_id, $seller_profile, $item_name, $price]);
            
            $pdo->commit();
            echo json_encode(['success' => true, 'item' => $item_data_decoded]);
        } catch (Exception $e) {
            $pdo->rollBack();
            echo json_encode(['error' => 'Transaction failed']);
        }
        exit;
    }
}
