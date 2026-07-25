<?php
require_once __DIR__ . '/db.php';

$json = file_get_contents(__DIR__ . '/../maps.json');
$maps = json_decode($json, true);

if (!$maps) {
    die("Failed to decode maps.json\n");
}

// Find an admin user
$stmt = $pdo->query("SELECT id FROM users WHERE is_admin = 1 LIMIT 1");
$adminUser = $stmt->fetch();
$adminId = $adminUser ? $adminUser['id'] : 1;

$insertStmt = $pdo->prepare("INSERT INTO admin_designs (admin_id, tool, name, snippet, payload, created_at) VALUES (?, 'map', ?, 'SYSTEM_MAP', ?, NOW())");
$updateStmt = $pdo->prepare("UPDATE admin_designs SET payload = ?, created_at = NOW() WHERE admin_id = ? AND tool = 'map' AND name = ? AND snippet = 'SYSTEM_MAP'");
$checkStmt = $pdo->prepare("SELECT id FROM admin_designs WHERE tool = 'map' AND name = ? AND snippet = 'SYSTEM_MAP'");

foreach ($maps as $key => $mapData) {
    $name = $mapData['name'] ?? $key;
    $payload = json_encode($mapData);
    
    // check if it already exists
    $checkStmt->execute([$name]);
    if ($checkStmt->fetch()) {
        $updateStmt->execute([$payload, $adminId, $name]);
        echo "Updated map: $name\n";
    } else {
        $insertStmt->execute([$adminId, $name, $payload]);
        echo "Inserted map: $name\n";
    }
}
echo "Migration complete.\n";
