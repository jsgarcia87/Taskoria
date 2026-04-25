<?php
require_once 'db.php';

$data = json_decode(file_get_contents('php://input'), true);

if (!isset($data['username']) || !isset($data['password'])) {
    http_response_code(400);
    echo json_encode(['error' => 'Username and password required']);
    exit;
}

$username = $data['username'];
$password = $data['password'];

$stmt = $pdo->prepare("SELECT id, password_hash FROM users WHERE username = ?");
$stmt->execute([$username]);
$user = $stmt->fetch();

if ($user && password_verify($password, $user['password_hash'])) {
    // In a real app, generate a JWT or Session ID here. 
    // For this simple example, we return the user ID.
    echo json_encode([
        'success' => true, 
        'user' => [
            'id' => $user['id'], 
            'username' => $username
        ]
    ]);
} else {
    http_response_code(401);
    echo json_encode(['error' => 'Invalid credentials']);
}
?>
