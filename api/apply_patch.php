<?php
require_once 'db.php';

try {
    // Aumentar la longitud del varchar para el campo email en users y waitlist
    $pdo->exec("ALTER TABLE users MODIFY COLUMN username VARCHAR(255) NOT NULL UNIQUE");
    echo "Tabla users actualizada (username ampliado a 255).\n";
} catch (PDOException $e) {
    echo "Info (users): " . $e->getMessage() . "\n";
}

try {
    $pdo->exec("ALTER TABLE waitlist MODIFY COLUMN email VARCHAR(255) NOT NULL UNIQUE");
    echo "Tabla waitlist actualizada (email ampliado a 255).\n";
} catch (PDOException $e) {
    echo "Info (waitlist): " . $e->getMessage() . "\n";
}

try {
    $pdo->exec("ALTER TABLE waitlist ADD COLUMN temp_password VARCHAR(50) DEFAULT NULL");
    echo "Columna temp_password anadida a waitlist.\n";
} catch (PDOException $e) {
    echo "Info (waitlist temp_password): " . $e->getMessage() . "\n";
}

echo "Parche aplicado.\n";
?>
