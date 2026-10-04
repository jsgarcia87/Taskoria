<?php
require_once 'db.php';

// Auto-create settings table if not exists
try {
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS settings (
            setting_key VARCHAR(100) PRIMARY KEY,
            setting_value VARCHAR(255) NOT NULL
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8;
    ");
    $pdo->exec("INSERT IGNORE INTO settings (setting_key, setting_value) VALUES ('allow_registration', 'true')");
    $pdo->exec("INSERT IGNORE INTO settings (setting_key, setting_value) VALUES ('allow_guest_mode', 'false')");
} catch (PDOException $e) {
    // Ignore
}

// Endpoint super sencillo para conocer el estado público de cara al cliente
try {
    $stmt = $pdo->query("SELECT setting_key, setting_value FROM settings WHERE setting_key IN ('allow_registration', 'allow_guest_mode')");
    $rows = $stmt->fetchAll(PDO::FETCH_KEY_PAIR);

    $allow_registration = isset($rows['allow_registration']) && $rows['allow_registration'] === 'true';
    $allow_guest_mode = isset($rows['allow_guest_mode']) && $rows['allow_guest_mode'] === 'true';

    echo json_encode([
        'success' => true,
        'allow_registration' => $allow_registration,
        'allow_guest_mode' => $allow_guest_mode,
    ]);
} catch (PDOException $e) {
    echo json_encode(['success' => true, 'allow_registration' => false, 'allow_guest_mode' => false]);
}
?>
