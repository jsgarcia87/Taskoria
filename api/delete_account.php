<?php
require_once 'db.php';
header('Content-Type: application/json');

$data = json_decode(file_get_contents('php://input'), true);

$user_id  = (int)($data['user_id'] ?? 0);
$password = $data['password'] ?? '';
// Client must send the literal string "DELETE" as a second guard so an
// accidental request never wipes an account without explicit confirmation.
$confirm  = $data['confirm'] ?? '';

if (!$user_id || $password === '' || $confirm !== 'DELETE') {
    http_response_code(400);
    echo json_encode(['error' => 'Missing confirmation.']);
    exit;
}

try {
    $stmt = $pdo->prepare("SELECT password_hash FROM users WHERE id = ?");
    $stmt->execute([$user_id]);
    $user = $stmt->fetch();

    if (!$user) {
        http_response_code(404);
        echo json_encode(['error' => 'User not found.']);
        exit;
    }

    if (!password_verify($password, $user['password_hash'])) {
        http_response_code(401);
        echo json_encode(['error' => 'Password is incorrect.']);
        exit;
    }

    $pdo->beginTransaction();

    // Clean up profile-scoped tables from the save data (pet sanctuary keys by profile_id)
    $stmt = $pdo->prepare("SELECT save_data FROM game_saves WHERE user_id = ?");
    $stmt->execute([$user_id]);
    $saveRow = $stmt->fetch();
    if ($saveRow && !empty($saveRow['save_data'])) {
        $saveData = json_decode($saveRow['save_data'], true);
        if (isset($saveData['profiles']) && is_array($saveData['profiles'])) {
            foreach ($saveData['profiles'] as $profile) {
                if (!empty($profile['id'])) {
                    $pdo->prepare("DELETE FROM pet_sanctuary WHERE profile_id = ?")->execute([$profile['id']]);
                }
            }
        }
    }

    // Delete user-scoped rows across known tables. Wrapped individually so a
    // missing table (fresh installs) doesn't block the account deletion.
    $userTables = ['game_saves', 'suggestions', 'messages', 'admin_designs'];
    foreach ($userTables as $t) {
        try {
            $pdo->prepare("DELETE FROM $t WHERE user_id = ?")->execute([$user_id]);
        } catch (PDOException $e) {
            // Table might not exist or use a different column — ignore.
        }
    }

    // Finally delete the account itself
    $pdo->prepare("DELETE FROM users WHERE id = ?")->execute([$user_id]);

    $pdo->commit();
    echo json_encode(['success' => true, 'message' => 'Account deleted.']);
} catch (PDOException $e) {
    if ($pdo->inTransaction()) $pdo->rollBack();
    http_response_code(500);
    echo json_encode(['error' => 'Database error while deleting the account.']);
}
