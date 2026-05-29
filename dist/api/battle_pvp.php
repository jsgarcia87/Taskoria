<?php
require_once 'db.php';

$data = json_decode(file_get_contents('php://input'), true);
$attacker_id = $data['attacker_id'] ?? null;
$defender_id = $data['defender_id'] ?? null;

if (!$attacker_id || !$defender_id) {
    echo json_encode(['error' => 'Missing IDs']);
    exit;
}

try {
    $pdo->beginTransaction();

    // Fetch both users' data
    $stmt = $pdo->prepare("SELECT user_id, save_data FROM game_saves WHERE user_id IN (?, ?) FOR UPDATE");
    $stmt->execute([$attacker_id, $defender_id]);
    $saves = $stmt->fetchAll(PDO::FETCH_ASSOC);

    $attackerSave = null;
    $defenderSave = null;

    foreach ($saves as $s) {
        if ($s['user_id'] == $attacker_id) $attackerSave = json_decode($s['save_data'], true);
        if ($s['user_id'] == $defender_id) $defenderSave = json_decode($s['save_data'], true);
    }

    function &get_character_ref(&$saveData) {
        $null = null;
        if (isset($saveData['character'])) {
            return $saveData['character'];
        }
        if (isset($saveData['profiles']) && is_array($saveData['profiles']) && count($saveData['profiles']) > 0) {
            $activeId = $saveData['lastActiveProfile'] ?? $saveData['profiles'][0]['id'];
            foreach ($saveData['profiles'] as &$prof) {
                if ($prof['id'] === $activeId) {
                    if (!isset($prof['state'])) {
                        $prof['state'] = [];
                    }
                    if (!isset($prof['state']['character'])) {
                        $prof['state']['character'] = null;
                    }
                    return $prof['state']['character'];
                }
            }
        }
        return $null;
    }

    $attChar = &get_character_ref($attackerSave);
    $defChar = &get_character_ref($defenderSave);

    if (!$attChar || !$defChar) {
        throw new Exception("Invalid save data or users not found");
    }

    // Calculate Power
    // Simple formula: Sum of stats * Level
    $attStats = $attChar['stats'];
    $defStats = $defChar['stats'];
    
    $attPower = ($attStats['str'] + $attStats['int'] + $attStats['dex']) + ($attChar['level'] * 5);
    // Add some RNG (Roll D20)
    $attRoll = rand(1, 20);
    $attTotal = $attPower + $attRoll;

    $defPower = ($defStats['str'] + $defStats['int'] + $defStats['dex']) + ($defChar['level'] * 5);
    $defRoll = rand(1, 20);
    $defTotal = $defPower + $defRoll;

    $winner = $attTotal >= $defTotal ? 'attacker' : 'defender'; // Attacker wins ties
    $stolenItem = null;
    $logMsg = "";

    if ($winner === 'attacker') {
        // Attacker wins
        // Steal item logic
        if (!empty($defChar['inventory'])) {
            $randIndex = array_rand($defChar['inventory']);
            $stolenItem = $defChar['inventory'][$randIndex];
            
            // Remove from defender
            array_splice($defChar['inventory'], $randIndex, 1);
            
            // Add to attacker
            $attChar['inventory'][] = $stolenItem;
            
            $logMsg = "Victory! You defeated {$defChar['name']} and stole their {$stolenItem['name']}!";
        } else {
             $logMsg = "Victory! You defeated {$defChar['name']} but they had nothing to steal!";
             // Maybe gain some gold?
             $goldStolen = min(10, $defChar['gold']);
             $attChar['gold'] += $goldStolen;
             $defChar['gold'] -= $goldStolen;
             if ($goldStolen > 0) $logMsg .= " Stole {$goldStolen} gold instead.";
        }
        
    } else {
        // Defender wins (Attacker loses item)
        if (!empty($attChar['inventory'])) {
            $randIndex = array_rand($attChar['inventory']);
            $lostItem = $attChar['inventory'][$randIndex];
            
            // Remove from attacker
            array_splice($attChar['inventory'], $randIndex, 1);
            
            // Add to defender (Passively)
            $defChar['inventory'][] = $lostItem;
            
            $stolenItem = $lostItem; // Actually lost item
            $logMsg = "Defeat! {$defChar['name']} overpowered you and took your {$lostItem['name']}!";
        } else {
            $logMsg = "Defeat! {$defChar['name']} beat you up. You had nothing to lose but your pride.";
        }
    }

    // Save back to DB
    $updateStmt = $pdo->prepare("UPDATE game_saves SET save_data = ? WHERE user_id = ?");
    $updateStmt->execute([json_encode($attackerSave), $attacker_id]);
    $updateStmt->execute([json_encode($defenderSave), $defender_id]);

    $pdo->commit();

    echo json_encode([
        'winner' => $winner,
        'log' => $logMsg,
        'stolenItem' => $stolenItem,
        'battleDetails' => [
            'attacker' => ['name' => $attChar['name'], 'power' => $attPower, 'roll' => $attRoll, 'total' => $attTotal],
            'defender' => ['name' => $defChar['name'], 'power' => $defPower, 'roll' => $defRoll, 'total' => $defTotal]
        ],
        'newState' => $attackerSave // Return new state to update frontend immediately
    ]);

} catch (Exception $e) {
    $pdo->rollBack();
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
}
?>
