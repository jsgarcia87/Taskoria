<?php
require_once 'db.php';

$current_user_id = $_GET['current_user_id'] ?? null;
$search_query = $_GET['q'] ?? '';

if (!$current_user_id || empty($search_query)) {
    echo json_encode(['users' => []]);
    exit;
}

try {
    // Search users by username (partial match) and join with game_saves to get character info
    $sql = "
        SELECT u.id, u.username, gs.save_data, 
               CASE WHEN u.last_active_at >= NOW() - INTERVAL 5 MINUTE THEN 1 ELSE 0 END as is_online
        FROM users u 
        LEFT JOIN game_saves gs ON u.id = gs.user_id
        WHERE u.id != :uid AND u.username LIKE :query
        LIMIT 10
    ";
    
    $stmt = $pdo->prepare($sql);
    $searchTerm = '%' . $search_query . '%';
    $stmt->bindParam(':uid', $current_user_id);
    $stmt->bindParam(':query', $searchTerm);
    $stmt->execute();
    
    $results = $stmt->fetchAll();
    
    $users = [];
    foreach ($results as $row) {
        $charInfo = null;
        if ($row['save_data']) {
            $data = json_decode($row['save_data'], true);
            
            // Need to handle both old single-user format and new family format for compatibility
            // Default to the old legacy root if it exists
            $foundChar = isset($data['character']) ? $data['character'] : null;
            
            // If they are on the new Family format, grab their active profile (or the first one)
            if (!$foundChar && isset($data['profiles']) && count($data['profiles']) > 0) {
                $activeId = $data['lastActiveProfile'] ?? $data['profiles'][0]['id'];
                foreach ($data['profiles'] as $prof) {
                    if ($prof['id'] === $activeId && isset($prof['state']['character'])) {
                        $foundChar = $prof['state']['character'];
                        break;
                    }
                }
            }

            if ($foundChar) {
                $charInfo = [
                    'name' => $foundChar['name'],
                    'level' => $foundChar['level'],
                    'class' => $foundChar['class'],
                    'avatarId' => $foundChar['avatarId'],
                    'avatarColors' => $foundChar['avatarColors'] ?? null
                ];
            }
        }
        
        $users[] = [
            'id' => $row['id'],
            'username' => $row['username'],
            'character' => $charInfo,
            'is_online' => (bool)$row['is_online']
        ];
    }
    
    echo json_encode(['users' => $users]);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
}
?>
