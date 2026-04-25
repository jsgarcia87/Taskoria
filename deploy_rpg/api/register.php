<?php
require_once 'db.php';

$data = json_decode(file_get_contents('php://input'), true);

if (!isset($data['username']) || !isset($data['password'])) {
    http_response_code(400);
    echo json_encode(['error' => 'Username and password required']);
    exit;
}

$username = trim($data['username']);
$password = $data['password'];

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
    echo json_encode(['success' => true, 'message' => 'User registered successfully']);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Registration failed']);
}
?>
