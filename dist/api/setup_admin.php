<?php
require_once 'db.php';

// Asegurarnos de que la columna existe en la base de datos
try {
    $pdo->exec("ALTER TABLE users ADD COLUMN is_admin BOOLEAN DEFAULT FALSE;");
} catch (PDOException $e) {
    // La columna ya existe, ignorar
}

// Asegurarnos de que las tablas para Mercado y Santuario existen
try {
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS community_market (
            id INT AUTO_INCREMENT PRIMARY KEY,
            seller_id INT NOT NULL,
            profile_id VARCHAR(50) NOT NULL,
            seller_name VARCHAR(100) NOT NULL,
            item_data JSON NOT NULL,
            price INT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8;
    ");

    $pdo->exec("
        CREATE TABLE IF NOT EXISTS pet_sanctuary (
            id INT AUTO_INCREMENT PRIMARY KEY,
            profile_id VARCHAR(50) NOT NULL,
            owner_name VARCHAR(100) NOT NULL,
            pet_type VARCHAR(50) NOT NULL,
            pet_level INT NOT NULL,
            pet_xp INT NOT NULL,
            released_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8;
    ");

    // Crear tabla de ajustes globales (Configuración del Servidor)
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS settings (
            setting_key VARCHAR(50) PRIMARY KEY,
            setting_value VARCHAR(255) NOT NULL
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8;
    ");

    // Crear tablas del Sistema de Gremios
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS guilds (
            id INT AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(50) NOT NULL UNIQUE,
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
            user_id INT NOT NULL,
            role ENUM('leader', 'officer', 'member') DEFAULT 'member',
            joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (guild_id, user_id),
            FOREIGN KEY (guild_id) REFERENCES guilds(id) ON DELETE CASCADE,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8;
    ");

    // Insertar el estado por defecto del registro (Cerrado por defecto para Beta privada)
    $pdo->exec("INSERT IGNORE INTO settings (setting_key, setting_value) VALUES ('allow_registration', 'false')");

    // Crear tabla de Lista de Espera (Waitlist)
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS waitlist (
            id INT AUTO_INCREMENT PRIMARY KEY,
            email VARCHAR(255) NOT NULL UNIQUE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8;
    ");

} catch (PDOException $e) {
    echo "<b>Error inicializando base de datos comunitaria:</b> " . $e->getMessage() . "<br>";
}

$username = 'AdminMaster';
$password = 'SecretTaskoria26'; // Puedes cambiar esta contraseña aquí antes de subirlo

// Comprobar si este usuario ya existe
$stmt = $pdo->prepare("SELECT id FROM users WHERE username = ?");
$stmt->execute([$username]);
if ($stmt->fetch()) {
    echo "<div style='font-family:sans-serif; text-align:center; padding:50px;'>";
    echo "<h1>El usuario de administración '$username' ya existe.</h1>";
    echo "<p>Vuelve al juego para iniciar sesión.</p>";
    echo "</div>";
    exit;
}

$hash = password_hash($password, PASSWORD_DEFAULT);

try {
    $stmt = $pdo->prepare("INSERT INTO users (username, password_hash, is_admin) VALUES (?, ?, 1)");
    $stmt->execute([$username, $hash]);
    
    echo "<div style='font-family:sans-serif; text-align:center; padding:50px; background-color:#1a102e; color:white; border-radius:15px; max-width:500px; margin:auto; margin-top:50px; box-shadow:0 0 20px rgba(0,0,0,0.5);'>";
    echo "<h1 style='color:#fbbf24; margin-bottom:10px;'>🛡️ ¡Cuenta Creada!</h1>";
    echo "<p>Has sido bendecido con el escudo de Súper-Usuario.</p>";
    echo "<div style='background-color:rgba(255,255,255,0.1); padding:20px; border-radius:10px; margin:20px 0;'>";
    echo "<p><b>Usuario:</b> <span style='color:#60a5fa;'>$username</span></p>";
    echo "<p><b>Contraseña:</b> <span style='color:#60a5fa;'>$password</span></p>";
    echo "</div>";
    echo "<p style='color:#ef4444; font-size:12px; font-weight:bold; margin-bottom:20px;'>⚠ URGENTE: Por seguridad extrema, borra este archivo (setup_admin.php) de tu servidor FTP después de ver esto.</p>";
    echo "<a href='../' style='display:inline-block; padding:10px 20px; background-color:#fbbf24; color:black; text-decoration:none; font-weight:bold; border-radius:8px;'>Volver a Jugar</a>";
    echo "</div>";
    
} catch (PDOException $e) {
    echo "<div style='font-family:sans-serif; text-align:center; padding:50px; color:red;'>";
    echo "<h1>Error al crear la cuenta</h1>";
    echo "<p>" . $e->getMessage() . "</p>";
    echo "</div>";
}
?>
