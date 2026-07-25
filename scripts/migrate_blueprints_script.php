<?php
require_once __DIR__ . '/db.php';

function migrate_file($filename, $tool) {
    global $pdo;
    $json = file_get_contents(__DIR__ . '/../src/data/' . $filename);
    $items = json_decode($json, true);
    if (!$items) {
        echo "Failed to parse $filename\n";
        return;
    }

    $stmt = $pdo->query("SELECT id FROM users WHERE is_admin = 1 LIMIT 1");
    $adminUser = $stmt->fetch();
    $adminId = $adminUser ? $adminUser['id'] : 1;

    $insertStmt = $pdo->prepare("INSERT INTO admin_designs (admin_id, tool, name, snippet, payload, created_at) VALUES (?, ?, ?, ?, ?, NOW())");
    $updateStmt = $pdo->prepare("UPDATE admin_designs SET payload = ?, created_at = NOW() WHERE admin_id = ? AND tool = ? AND name = ? AND snippet = ?");
    $checkStmt = $pdo->prepare("SELECT id FROM admin_designs WHERE tool = ? AND name = ? AND snippet = ?");

    foreach ($items as $key => $itemData) {
        $name = $key;
        $snippet = 'SYSTEM_' . strtoupper($tool);
        $payload = json_encode($itemData);

        $checkStmt->execute([$tool, $name, $snippet]);
        if ($checkStmt->fetch()) {
            $updateStmt->execute([$payload, $adminId, $tool, $name, $snippet]);
            echo "Updated $tool: $name\n";
        } else {
            $insertStmt->execute([$adminId, $tool, $name, $snippet, $payload]);
            echo "Inserted $tool: $name\n";
        }
    }
}

migrate_file('character_blueprints.json', 'character');
migrate_file('pet_blueprints.json', 'pet');
echo "Migration complete.\n";
