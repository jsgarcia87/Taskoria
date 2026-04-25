<?php
require_once 'db.php';

// Get current user ID to exclude from list
$current_user_id = $_GET['current_user_id'] ?? null;

try {
    // Join users with game_saves to get character info
    $sql = "
        SELECT u.id, u.username, gs.save_data 
        FROM users u 
        LEFT JOIN game_saves gs ON u.id = gs.user_id
        WHERE 1=1
    ";
    
    if ($current_user_id) {
        $sql .= " AND u.id != :uid";
    }
    
    $stmt = $pdo->prepare($sql);
    if ($current_user_id) {
        $stmt->bindParam(':uid', $current_user_id);
    }
    
    $stmt->execute();
    $results = $stmt->fetchAll();
    
    $users = [];
    foreach ($results as $row) {
        $charInfo = null;
        if ($row['save_data']) {
            $data = json_decode($row['save_data'], true);
            if (isset($data['character'])) {
                $char = $data['character'];
                $charInfo = [
                    'name' => $char['name'],
                    'level' => $char['level'],
                    'class' => $char['class'],
                    'avatarId' => $char['avatarId']
                ];
            }
        }
        
        $users[] = [
            'id' => $row['id'],
            'username' => $row['username'],
            'character' => $charInfo
        ];
    }
    
    echo json_encode(['users' => $users]);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
}
?>
