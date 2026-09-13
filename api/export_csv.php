<?php
require_once 'db.php';

$admin_id = (int)($_GET['admin_id'] ?? 0);
if (!$admin_id) { http_response_code(401); echo json_encode(['error' => 'Login required']); exit; }
$stmt = $pdo->prepare("SELECT is_admin FROM users WHERE id = ?");
$stmt->execute([$admin_id]);
$adminUser = $stmt->fetch();
if (!$adminUser || !$adminUser['is_admin']) { http_response_code(403); echo json_encode(['error' => 'Forbidden']); exit; }

header('Content-Type: text/csv');
header('Content-Disposition: attachment; filename="users_export.csv"');

$output = fopen('php://output', 'w');

// Header row
fputcsv($output, ['ID', 'Username', 'Created At', 'Last Save Date']);

// Fetch users and their last save time
$sql = "
    SELECT u.id, u.username, u.created_at, g.last_updated 
    FROM users u 
    LEFT JOIN game_saves g ON u.id = g.user_id
    ORDER BY u.id ASC
";

$stmt = $pdo->query($sql);

while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
    fputcsv($output, $row);
}

fclose($output);
?>
