<?php
require_once 'db.php';

$data = json_decode(file_get_contents('php://input'), true);

if (!isset($data['username'])) {
    http_response_code(400);
    echo json_encode(['error' => 'Email (username) required']);
    exit;
}

$username = trim($data['username']); // Treating username as email
// Generate a secure random password if not provided
$password = isset($data['password']) && !empty($data['password']) ? $data['password'] : bin2hex(random_bytes(8));

// Primero: comprobar si el registro público está cerrado
$stmtSetting = $pdo->query("SELECT setting_value FROM settings WHERE setting_key = 'allow_registration'");
$setting = $stmtSetting->fetch();
if (!$setting || $setting['setting_value'] !== 'true') {
    http_response_code(403);
    echo json_encode(['error' => 'El registro está cerrado. Por favor, apúntate a la Lista de Espera en la pantalla principal.']);
    exit;
}

// Check if user exists
$stmt = $pdo->prepare("SELECT id FROM users WHERE username = ?");
$stmt->execute([$username]);
if ($stmt->fetch()) {
    http_response_code(409); // Conflict
    echo json_encode(['error' => 'Username already exists']);
    exit;
}

// Create user
$hash = password_hash($password, PASSWORD_DEFAULT);
$stmt = $pdo->prepare("INSERT INTO users (username, password_hash) VALUES (?, ?)");

try {
    $stmt->execute([$username, $hash]);
    
    // Send email with credentials
    $to = $username;
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
            <p>Your beta account has been created successfully. Prepare to gamify your life and defeat epic bosses!</p>
            <div style='background-color: #0f3460; padding: 15px; border-radius: 5px; margin: 20px 0;'>
                <p style='margin: 5px 0;'><strong>Username (Email):</strong> {$username}</p>
                <p style='margin: 5px 0;'><strong>Password:</strong> {$password}</p>
            </div>
            <p>Keep these credentials safe. You can log in immediately and start your journey.</p>
            <p style='margin-top: 30px; font-size: 12px; color: #888; text-align: center;'>The Taskoria Realm</p>
        </div>
    </body>
    </html>
    ";
    // Require the email helper
    require_once __DIR__ . '/send_email.php';

    // Send the email
    send_taskoria_email($to, $subject, $message);

    echo json_encode(['success' => true, 'message' => 'User registered successfully. Credentials sent to email.']);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Registration failed']);
}
?>
