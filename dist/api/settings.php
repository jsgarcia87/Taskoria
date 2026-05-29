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
} catch (PDOException $e) {
    // Ignore
}

// Endpoint super sencillo para conocer el estado público de cara al cliente
try {
    $stmt = $pdo->query("SELECT setting_value FROM settings WHERE setting_key = 'allow_registration'");
    $setting = $stmt->fetch();
    
    $allow_registration = false; // default if missing
    if ($setting && $setting['setting_value'] === 'true') {
        $allow_registration = true;
    }

    echo json_encode(['success' => true, 'allow_registration' => $allow_registration]);
} catch (PDOException $e) {
    // Si la tabla no existe aún, asumimos cerrado por seguridad
    echo json_encode(['success' => true, 'allow_registration' => false]);
}
?>
