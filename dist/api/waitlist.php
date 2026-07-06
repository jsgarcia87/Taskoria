<?php
require_once 'db.php';

$data = json_decode(file_get_contents('php://input'), true);

if (!isset($data['email']) || !filter_var($data['email'], FILTER_VALIDATE_EMAIL)) {
    http_response_code(400);
    echo json_encode(['error' => 'Please enter a valid email address.']);
    exit;
}

$email = trim($data['email']);

try {
    // Asegurar que la tabla existe por si no se ejecutó setup_admin.php
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS waitlist (
            id INT AUTO_INCREMENT PRIMARY KEY,
            email VARCHAR(255) NOT NULL UNIQUE,
            temp_password VARCHAR(255) DEFAULT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8;
    ");

    try {
        $pdo->exec("ALTER TABLE waitlist ADD COLUMN temp_password VARCHAR(255) DEFAULT NULL;");
    } catch (PDOException $e) {
        // Already exists
    }

    // Check if the email is already in the waitlist
    $stmt = $pdo->prepare("SELECT id FROM waitlist WHERE email = ?");
    $stmt->execute([$email]);
    if ($stmt->fetch()) {
        http_response_code(409); // Conflict
        echo json_encode(['error' => 'That email is already on the Taskoria beta list.']);
        exit;
    }

    // Check if user exists before attempting to register as user
    $stmtUser = $pdo->prepare("SELECT id FROM users WHERE username = ?");
    $stmtUser->execute([$email]);
    if ($stmtUser->fetch()) {
        http_response_code(409); // Conflict
        echo json_encode(['error' => 'A user with that email is already registered. Try signing in instead.']);
        exit;
    }

    // Auto-Register the Citizen
    $password = bin2hex(random_bytes(4)); // 8 characters random password
    $hash = password_hash($password, PASSWORD_DEFAULT);
    
    // Insert the email and password into waitlist (we keep tracking for historical/early-adapters logs AND for admin review)
    try {
        $stmt = $pdo->prepare("INSERT INTO waitlist (email, temp_password) VALUES (?, ?)");
        $stmt->execute([$email, $password]);
    } catch (PDOException $e) {
        // Ignore waitlist duplicate / errors as we care about user creation
    }

    $stmtUserInsert = $pdo->prepare("INSERT INTO users (username, password_hash) VALUES (?, ?)");
    $stmtUserInsert->execute([$email, $hash]);

    // Send email with credentials
    $to = $email;
    $subject = "Welcome to The Taskoria Beta!";
    
    $message = "
    <html>
    <head>
    <title>Welcome to The Taskoria</title>
    </head>
    <body style='font-family: Arial, sans-serif; background-color: #1a1a2e; color: #ffffff; padding: 20px;'>
        <div style='max-width: 600px; margin: 0 auto; background-color: #16213e; padding: 30px; border-radius: 10px; border: 1px solid #e94560;'>
            <h2 style='color: #e94560; text-align: center;'>Welcome to The Taskoria Beta! 🗡️</h2>
            <p>Greetings Adventurer,</p>
            <p>You have joined the waitlist, but we decided you belonged to our guild already! Your beta account has been created successfully. Prepare to gamify your life and defeat epic bosses!</p>
            <div style='background-color: #0f3460; padding: 15px; border-radius: 5px; margin: 20px 0;'>
                <p style='margin: 5px 0;'><strong>Username (Email):</strong> {$email}</p>
                <p style='margin: 5px 0;'><strong>Temporary Password:</strong> {$password}</p>
            </div>
            <p>Keep these credentials safe. You can log in immediately and start your journey.</p>
            <p style='margin-top: 30px; font-size: 12px; color: #888; text-align: center;'>The Taskoria Realm</p>
        </div>
    </body>
    </html>
    ";

    // Require the email script
    require_once __DIR__ . '/send_email.php';

    // Send the email and catch warnings
    $emailSent = send_taskoria_email($to, $subject, $message);

    echo json_encode(['success' => true, 'message' => 'Check your inbox — your hero credentials just went out. See you in Taskoria!']);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Database error: ' . $e->getMessage()]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Something went wrong: ' . $e->getMessage()]);
}
?>
