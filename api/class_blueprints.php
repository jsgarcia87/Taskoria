<?php
require_once __DIR__ . '/db.php';

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(204); exit; }

// $pdo is provided by db.php

$pdo->exec("CREATE TABLE IF NOT EXISTS class_blueprints (
    class_id VARCHAR(64) NOT NULL PRIMARY KEY,
    class_name VARCHAR(128) NOT NULL,
    class_desc TEXT,
    class_silhouette TEXT,
    baked_payload JSON NOT NULL,
    project_data JSON,
    published TINYINT(1) DEFAULT 1,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    updated_by INT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");

$action = $_GET['action'] ?? '';

function verifyAdmin($pdo, $adminId) {
    if (!$adminId) return false;
    $stmt = $pdo->prepare("SELECT is_admin FROM users WHERE id = ?");
    $stmt->execute([$adminId]);
    $row = $stmt->fetch(PDO::FETCH_ASSOC);
    return $row && $row['is_admin'];
}

switch ($action) {

    case 'list':
        $stmt = $pdo->query("SELECT class_id, class_name, class_desc, class_silhouette, baked_payload, published, updated_at FROM class_blueprints ORDER BY class_name");
        $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
        foreach ($rows as &$r) {
            $r['baked_payload'] = json_decode($r['baked_payload'], true);
        }
        echo json_encode(['blueprints' => $rows]);
        break;

    case 'get':
        $classId = $_GET['class_id'] ?? '';
        if (!$classId) { echo json_encode(['error' => 'class_id required']); break; }
        $stmt = $pdo->prepare("SELECT * FROM class_blueprints WHERE class_id = ?");
        $stmt->execute([$classId]);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        if (!$row) { echo json_encode(['error' => 'Not found']); break; }
        $row['baked_payload'] = json_decode($row['baked_payload'], true);
        $row['project_data'] = $row['project_data'] ? json_decode($row['project_data'], true) : null;
        echo json_encode(['blueprint' => $row]);
        break;

    case 'publish':
        $input = json_decode(file_get_contents('php://input'), true);
        $adminId = $input['admin_id'] ?? null;
        if (!verifyAdmin($pdo, $adminId)) {
            echo json_encode(['error' => 'Admin access required']);
            break;
        }
        $classes = $input['classes'] ?? [];
        if (empty($classes)) {
            echo json_encode(['error' => 'No classes to publish']);
            break;
        }
        $results = [];
        foreach ($classes as $cls) {
            $classId = $cls['class_id'] ?? '';
            if (!$classId) { $results[] = ['class_id' => '?', 'error' => 'Missing class_id']; continue; }
            try {
                $stmt = $pdo->prepare("INSERT INTO class_blueprints (class_id, class_name, class_desc, class_silhouette, baked_payload, project_data, updated_by)
                    VALUES (?, ?, ?, ?, ?, ?, ?)
                    ON DUPLICATE KEY UPDATE
                        class_name = VALUES(class_name),
                        class_desc = VALUES(class_desc),
                        class_silhouette = VALUES(class_silhouette),
                        baked_payload = VALUES(baked_payload),
                        project_data = VALUES(project_data),
                        updated_by = VALUES(updated_by),
                        updated_at = CURRENT_TIMESTAMP");
                $stmt->execute([
                    $classId,
                    $cls['class_name'] ?? $classId,
                    $cls['class_desc'] ?? '',
                    $cls['class_silhouette'] ?? '',
                    json_encode($cls['baked_payload']),
                    isset($cls['project_data']) ? json_encode($cls['project_data']) : null,
                    $adminId
                ]);
                $results[] = ['class_id' => $classId, 'success' => true];
            } catch (Exception $e) {
                error_log("class_blueprints publish error: " . $e->getMessage());
                $results[] = ['class_id' => $classId, 'error' => 'Database error'];
            }
        }
        echo json_encode(['success' => true, 'results' => $results]);
        break;

    case 'delete':
        $input = json_decode(file_get_contents('php://input'), true);
        $adminId = $input['admin_id'] ?? null;
        if (!verifyAdmin($pdo, $adminId)) {
            echo json_encode(['error' => 'Admin access required']);
            break;
        }
        $classId = $input['class_id'] ?? '';
        if (!$classId) { echo json_encode(['error' => 'class_id required']); break; }
        $stmt = $pdo->prepare("DELETE FROM class_blueprints WHERE class_id = ?");
        $stmt->execute([$classId]);
        echo json_encode(['success' => true]);
        break;

    case 'load_workspace':
        $input = json_decode(file_get_contents('php://input'), true);
        $adminId = $input['admin_id'] ?? null;
        if (!verifyAdmin($pdo, $adminId)) {
            echo json_encode(['error' => 'Admin access required']);
            break;
        }
        $stmt = $pdo->query("SELECT class_id, class_name, class_desc, class_silhouette, baked_payload, project_data FROM class_blueprints");
        $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
        foreach ($rows as &$r) {
            $r['baked_payload'] = json_decode($r['baked_payload'], true);
            $r['project_data'] = $r['project_data'] ? json_decode($r['project_data'], true) : null;
        }
        echo json_encode(['classes' => $rows]);
        break;

    default:
        echo json_encode(['error' => 'Unknown action. Use: list, get, publish, delete, load_workspace']);
}
