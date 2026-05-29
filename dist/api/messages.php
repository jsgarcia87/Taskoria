<?php
// api/messages.php
header('Content-Type: application/json');
require_once 'db.php';

// Create table if not exists
$pdo->query("CREATE TABLE IF NOT EXISTS messages (
    id INT AUTO_INCREMENT PRIMARY KEY,
    sender_id INT NOT NULL,
    receiver_id INT NOT NULL,
    sender_profile_id VARCHAR(50) DEFAULT NULL,
    receiver_profile_id VARCHAR(50) DEFAULT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (receiver_id) REFERENCES users(id) ON DELETE CASCADE
)");

// Support legacy tables
try {
    @$pdo->query("ALTER TABLE messages ADD COLUMN sender_profile_id VARCHAR(50) DEFAULT NULL");
    @$pdo->query("ALTER TABLE messages ADD COLUMN receiver_profile_id VARCHAR(50) DEFAULT NULL");
} catch (Exception $e) {}

$action = $_GET['action'] ?? '';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $data = json_decode(file_get_contents('php://input'), true);

    if ($action === 'send') {
        $sender_id = isset($data['sender_id']) ? (int)$data['sender_id'] : 0;
        $receiver_id = isset($data['receiver_id']) ? (int)$data['receiver_id'] : 0;
        $sender_profile_id = (!empty($data['sender_profile_id']) && $data['sender_profile_id'] !== 'null') ? $data['sender_profile_id'] : null;
        $receiver_profile_id = (!empty($data['receiver_profile_id']) && $data['receiver_profile_id'] !== 'null') ? $data['receiver_profile_id'] : null;
        $message = trim($data['message'] ?? '');

        if (!$sender_id || !$receiver_id || empty($message)) {
            echo json_encode(['error' => 'Missing sender, receiver, or message', 'received' => ['sender' => $sender_id, 'receiver' => $receiver_id]]);
            exit;
        }

        try {
            $stmt = $pdo->prepare("INSERT INTO messages (sender_id, receiver_id, sender_profile_id, receiver_profile_id, message) VALUES (?, ?, ?, ?, ?)");
            if ($stmt->execute([$sender_id, $receiver_id, $sender_profile_id, $receiver_profile_id, $message])) {
                echo json_encode(['success' => true, 'message_id' => $pdo->lastInsertId()]);
            } else {
                echo json_encode(['error' => 'Failed to send message: Statement execution failed']);
            }
        } catch (PDOException $e) {
            echo json_encode(['error' => 'Database error: ' . $e->getMessage()]);
        }
        exit;
    }

    if ($action === 'mark_read') {
        $user_id = $data['user_id'] ?? 0;
        $other_id = $data['other_id'] ?? 0;
        $profile_id = (!empty($data['profile_id']) && $data['profile_id'] !== 'null') ? $data['profile_id'] : null; 
        $other_profile_id = (!empty($data['other_profile_id']) && $data['other_profile_id'] !== 'null') ? $data['other_profile_id'] : null;

        if (!$user_id || !$other_id) {
            echo json_encode(['error' => 'Missing user identifiers']);
            exit;
        }

        try {
            // Mark messages SENT BY other_id TO user_id as read
            $sql = "UPDATE messages SET is_read = TRUE WHERE receiver_id = ? AND sender_id = ? AND is_read = FALSE";
            $params = [$user_id, $other_id];
            
            if ($user_id == $other_id) {
                if ($profile_id) { 
                    $sql .= " AND receiver_profile_id = ?"; 
                    $params[] = $profile_id; 
                } else {
                    $sql .= " AND (receiver_profile_id IS NULL OR receiver_profile_id = '')";
                }
                
                if ($other_profile_id) { 
                    $sql .= " AND sender_profile_id = ?"; 
                    $params[] = $other_profile_id; 
                } else {
                    $sql .= " AND (sender_profile_id IS NULL OR sender_profile_id = '')";
                }
            } else {
                // External Chat: Only isolate read status by the receiver's current profile
                if ($profile_id) { 
                    $sql .= " AND receiver_profile_id = ?"; 
                    $params[] = $profile_id; 
                }
            }

            $stmt = $pdo->prepare($sql);
            $stmt->execute($params);
            echo json_encode(['success' => true]);
        } catch (PDOException $e) {
            echo json_encode(['error' => 'Failed to mark messages read: ' . $e->getMessage()]);
        }
        exit;
    }
}

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    
    if ($action === 'get_chat') {
        $user1 = $_GET['user1'] ?? 0;
        $user2 = $_GET['user2'] ?? 0;
        $p1 = (!empty($_GET['p1']) && $_GET['p1'] !== 'null') ? $_GET['p1'] : null;
        $p2 = (!empty($_GET['p2']) && $_GET['p2'] !== 'null') ? $_GET['p2'] : null;
        $last_id = isset($_GET['last_id']) ? intval($_GET['last_id']) : 0;

        if (!$user1 || !$user2) {
            echo json_encode(['error' => 'Missing user identifiers']);
            exit;
        }

        try {
            if ($user1 == $user2) {
                $where = "((sender_id = ? AND receiver_id = ? ";
                $params = [$user1, $user2];
                
                if ($p1) { $where .= "AND sender_profile_id = ? "; $params[] = $p1; } 
                else { $where .= "AND (sender_profile_id IS NULL OR sender_profile_id = '') "; }
                
                if ($p2) { $where .= "AND receiver_profile_id = ? "; $params[] = $p2; } 
                else { $where .= "AND (receiver_profile_id IS NULL OR receiver_profile_id = '') "; }
                
                $where .= ") OR (sender_id = ? AND receiver_id = ? ";
                $params[] = $user2; $params[] = $user1;
                
                if ($p2) { $where .= "AND sender_profile_id = ? "; $params[] = $p2; } 
                else { $where .= "AND (sender_profile_id IS NULL OR sender_profile_id = '') "; }
                
                if ($p1) { $where .= "AND receiver_profile_id = ? "; $params[] = $p1; } 
                else { $where .= "AND (receiver_profile_id IS NULL OR receiver_profile_id = '') "; }
                
                $where .= "))";
            } else {
                // External Chat: Only isolate by the current user's profile ID ($p1)
                $where = "((sender_id = ? AND receiver_id = ? ";
                $params = [$user1, $user2];
                if ($p1) { $where .= "AND sender_profile_id = ? "; $params[] = $p1; }
                
                $where .= ") OR (sender_id = ? AND receiver_id = ? ";
                $params[] = $user2; $params[] = $user1;
                if ($p1) { $where .= "AND receiver_profile_id = ? "; $params[] = $p1; }
                
                $where .= "))";
            }

            if ($last_id > 0) {
                $sql = "SELECT * FROM messages WHERE $where AND id > ? ORDER BY created_at ASC";
                $params[] = $last_id;
                $stmt = $pdo->prepare($sql);
                $stmt->execute($params);
            } else {
                $sql = "SELECT * FROM (SELECT * FROM messages WHERE $where ORDER BY created_at DESC LIMIT 50) sub ORDER BY created_at ASC";
                $stmt = $pdo->prepare($sql);
                $stmt->execute($params);
            }

            $messages = $stmt->fetchAll(PDO::FETCH_ASSOC);
            echo json_encode(['success' => true, 'messages' => $messages]);
        } catch (PDOException $e) {
            echo json_encode(['error' => 'Failed to fetch messages: ' . $e->getMessage()]);
        }
        exit;
    }

    if ($action === 'unread_count') {
        $user_id = $_GET['user_id'] ?? 0;
        $profile_id = (!empty($_GET['profile_id']) && $_GET['profile_id'] !== 'null') ? $_GET['profile_id'] : null;

        if (!$user_id) {
            echo json_encode(['error' => 'Missing user ID']);
            exit;
        }

        try {
            $sqlTotal = "SELECT COUNT(*) as count FROM messages WHERE receiver_id = ? AND is_read = FALSE";
            $paramsTotal = [$user_id];
            if ($profile_id) { 
                $sqlTotal .= " AND (receiver_profile_id = ? OR receiver_profile_id IS NULL OR receiver_profile_id = '')"; 
                $paramsTotal[] = $profile_id; 
            }
            
            $stmt = $pdo->prepare($sqlTotal);
            $stmt->execute($paramsTotal);
            $totalRow = $stmt->fetch();
            $total = (int)($totalRow['count'] ?? 0);

            // Breakdown by sender user
            $sqlSender = "SELECT sender_id, COUNT(*) as count FROM messages WHERE receiver_id = ? AND is_read = FALSE ";
            $paramsSender = [$user_id];
            if ($profile_id) {
                $sqlSender .= " AND (receiver_profile_id = ? OR receiver_profile_id IS NULL OR receiver_profile_id = '') ";
                $paramsSender[] = $profile_id;
            }
            $sqlSender .= " GROUP BY sender_id";
            
            $stmt = $pdo->prepare($sqlSender);
            $stmt->execute($paramsSender);
            $res = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            $by_sender = [];
            foreach ($res as $row) {
                $by_sender[$row['sender_id']] = (int)$row['count'];
            }

            // Breakdown by sender profile
            $sqlProf = "SELECT sender_profile_id, COUNT(*) as count FROM messages WHERE receiver_id = ? AND is_read = FALSE AND sender_profile_id IS NOT NULL ";
            $paramsProf = [$user_id];
            if ($profile_id) {
                $sqlProf .= " AND (receiver_profile_id = ? OR receiver_profile_id IS NULL OR receiver_profile_id = '') ";
                $paramsProf[] = $profile_id;
            }
            $sqlProf .= " GROUP BY sender_profile_id";
            
            $stmt = $pdo->prepare($sqlProf);
            $stmt->execute($paramsProf);
            $resProf = $stmt->fetchAll(PDO::FETCH_ASSOC);
            $by_profile = [];
            foreach ($resProf as $row) {
                $by_profile[$row['sender_profile_id']] = (int)$row['count'];
            }

            echo json_encode(['success' => true, 'total' => $total, 'by_sender' => $by_sender, 'by_profile' => $by_profile]);
        } catch (PDOException $e) {
            echo json_encode(['error' => 'Failed to fetch unread count: ' . $e->getMessage()]);
        }
        exit;
    }
}

echo json_encode(['error' => 'Invalid action']);
?>
