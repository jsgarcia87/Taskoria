<?php
require_once 'db.php';

// Check for admin param or similar in real world, skipping for this demo
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
