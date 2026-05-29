<?php
// api/guilds.php
header('Content-Type: application/json');
require_once 'db.php';

// Auto-migrate tables if not exist
try {
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS guilds (
            id INT AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(100) NOT NULL UNIQUE,
            description TEXT,
            emblem VARCHAR(50) DEFAULT 'shield',
            leader_id INT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (leader_id) REFERENCES users(id) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8;
    ");

    $pdo->exec("
        CREATE TABLE IF NOT EXISTS guild_members (
            guild_id INT NOT NULL,
            user_id INT NOT NULL UNIQUE,
            role VARCHAR(50) DEFAULT 'member',
            joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (guild_id, user_id),
            FOREIGN KEY (guild_id) REFERENCES guilds(id) ON DELETE CASCADE,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8;
    ");
} catch (PDOException $e) {
    // Ignore
}

$action = $_GET['action'] ?? '';
$user_id = $_GET['user_id'] ?? 0;

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $data = json_decode(file_get_contents('php://input'), true);

    if ($action === 'create') {
        $leader_id = $data['leader_id'] ?? 0;
        $name = trim($data['name'] ?? '');
        $description = trim($data['description'] ?? '');
        $emblem = trim($data['emblem'] ?? 'shield');

        if (!$leader_id || empty($name)) {
            echo json_encode(['error' => 'Missing guild name or creator ID']);
            exit;
        }

        $pdo->beginTransaction();
        try {
            // Check if user is already in a guild
            $stmt = $pdo->prepare("SELECT guild_id FROM guild_members WHERE user_id = ?");
            $stmt->execute([$leader_id]);
            if ($stmt->fetch(PDO::FETCH_ASSOC)) {
                throw new Exception("You are already in a guild.");
            }

            // Create guild
            $stmt = $pdo->prepare("INSERT INTO guilds (name, description, emblem, leader_id) VALUES (?, ?, ?, ?)");
            if (!$stmt->execute([$name, $description, $emblem, $leader_id])) {
                throw new Exception("Error creating guild.");
            }
            $guild_id = $pdo->lastInsertId();

            // Insert member as leader
            $stmt = $pdo->prepare("INSERT INTO guild_members (guild_id, user_id, role) VALUES (?, ?, 'leader')");
            if (!$stmt->execute([$guild_id, $leader_id])) {
                throw new Exception("Error joining newly created guild.");
            }

            $pdo->commit();
            echo json_encode(['success' => true, 'guild_id' => $guild_id]);

        } catch (PDOException $e) {
            $pdo->rollBack();
            if (isset($e->errorInfo) && $e->errorInfo[1] === 1062) {
                echo json_encode(['error' => 'Guild name already exists.']);
            } else {
                echo json_encode(['error' => $e->getMessage()]);
            }
        } catch (Exception $e) {
            $pdo->rollBack();
            echo json_encode(['error' => $e->getMessage()]);
        }
        exit;
    }

    if ($action === 'join') {
        $user_id = $data['user_id'] ?? 0;
        $guild_id = $data['guild_id'] ?? 0;

        if (!$user_id || !$guild_id) {
            echo json_encode(['error' => 'Missing identifiers']);
            exit;
        }

        try {
            $stmt = $pdo->prepare("INSERT INTO guild_members (guild_id, user_id, role) VALUES (?, ?, 'member')");
            if ($stmt->execute([$guild_id, $user_id])) {
                echo json_encode(['success' => true]);
            } else {
                echo json_encode(['error' => 'Could not join guild.']);
            }
        } catch (PDOException $e) {
            if (isset($e->errorInfo) && $e->errorInfo[1] === 1062) {
                echo json_encode(['error' => 'You are already a member!']);
            } else {
                echo json_encode(['error' => 'Backend error joining guild.']);
            }
        }
        exit;
    }

    if ($action === 'leave') {
        $user_id = $data['user_id'] ?? 0;

        if (!$user_id) {
             echo json_encode(['error' => 'Missing ID']);
             exit;
        }

        try {
            $stmt = $pdo->prepare("DELETE FROM guild_members WHERE user_id = ?");
            if ($stmt->execute([$user_id])) {
                 echo json_encode(['success' => true]);
            } else {
                 echo json_encode(['error' => 'Could not leave guild']);
            }
        } catch (PDOException $e) {
             echo json_encode(['error' => 'Could not leave guild']);
        }
        exit;
    }
}

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    
    // Get ALL guilds (to explore)
    if ($action === 'list') {
        try {
            $stmt = $pdo->prepare("
                SELECT g.*, 
                       (SELECT COUNT(*) FROM guild_members WHERE guild_id = g.id) as member_count,
                       u.username as leader_name
                FROM guilds g
                JOIN users u ON g.leader_id = u.id
                ORDER BY member_count DESC
                LIMIT 50
            ");
            $stmt->execute();
            $guilds = $stmt->fetchAll(PDO::FETCH_ASSOC);
            echo json_encode(['success' => true, 'guilds' => $guilds]);
        } catch (PDOException $e) {
            echo json_encode(['error' => 'Failed to list guilds']);
        }
        exit;
    }

    // Get specific guild info for current user
    if ($action === 'my_guild') {
        if (!$user_id) {
             echo json_encode(['error' => 'No user_id']);
             exit;
        }

        try {
            // Find which guild user is in
            $stmt = $pdo->prepare("SELECT guild_id FROM guild_members WHERE user_id = ?");
            $stmt->execute([$user_id]);
            $myGuildRes = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if (!$myGuildRes) {
                 echo json_encode(['success' => true, 'guild' => null]);
                 exit;
            }

            $guild_id = $myGuildRes['guild_id'];

            // Get guild details
            $stmt = $pdo->prepare("SELECT * FROM guilds WHERE id = ?");
            $stmt->execute([$guild_id]);
            $guild = $stmt->fetch(PDO::FETCH_ASSOC);

            // Get guild members complete info
            $stmt = $pdo->prepare("
                SELECT u.id, u.username, gs.save_data, gm.role, gm.joined_at, u.last_active_at 
                FROM guild_members gm 
                JOIN users u ON gm.user_id = u.id 
                LEFT JOIN game_saves gs ON u.id = gs.user_id
                WHERE gm.guild_id = ?
            ");
            $stmt->execute([$guild_id]);
            $res = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            $members = [];
            foreach($res as $row) {
                $foundChar = null;
                if ($row['save_data']) {
                    $data = json_decode($row['save_data'], true);
                    $foundChar = isset($data['character']) ? $data['character'] : null;
                    if (!$foundChar && isset($data['profiles']) && count($data['profiles']) > 0) {
                        $activeId = $data['lastActiveProfile'] ?? $data['profiles'][0]['id'];
                        foreach ($data['profiles'] as $prof) {
                            if ($prof['id'] === $activeId && isset($prof['state']['character'])) {
                                $foundChar = $prof['state']['character'];
                                break;
                            }
                        }
                    }
                }
                $row['character'] = $foundChar;
                
                // Add is_online approximation
                $row['is_online'] = $row['last_active_at'] ? (time() - strtotime($row['last_active_at'])) < 300 : false; 
                unset($row['save_data']); // clean response
                unset($row['last_active_at']); // clean response
                $members[] = $row;
            }
            
            $guild['members'] = $members;

            echo json_encode(['success' => true, 'guild' => $guild]);
        } catch (PDOException $e) {
            echo json_encode(['error' => 'Failed to fetch your guild details.']);
        }
        exit;
    }
}

echo json_encode(['error' => 'Invalid action']);
?>
