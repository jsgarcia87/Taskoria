<?php
require_once 'db.php';

// Maps can be toggled active/inactive so builders keep several versions and can
// revert. Auto-migrate the flag if it doesn't exist yet.
try { $pdo->exec("ALTER TABLE admin_designs ADD COLUMN active TINYINT(1) NOT NULL DEFAULT 1"); } catch (PDOException $e) {}

// Public endpoint to fetch all map designs (the client decides what to apply).
try {
    $stmt = $pdo->prepare("SELECT id, name, payload, active FROM admin_designs WHERE tool = 'map' ORDER BY created_at ASC");
    $stmt->execute();
    $maps = $stmt->fetchAll();

    foreach ($maps as &$map) {
        if ($map['payload']) {
            $map['payload'] = json_decode($map['payload'], true);
        }
        $map['id'] = (int)$map['id'];
        $map['active'] = (int)$map['active'];
    }

    echo json_encode(['success' => true, 'maps' => $maps]);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Failed to fetch maps']);
}
