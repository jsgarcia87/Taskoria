<?php
require_once 'db.php';

// Public endpoint to fetch all active character, pet, and object blueprints
try {
    $stmt = $pdo->prepare("SELECT tool, id, name, payload FROM admin_designs WHERE tool IN ('character', 'pet', 'house') ORDER BY created_at ASC");
    $stmt->execute();
    $designs = $stmt->fetchAll();
    
    $characters = [];
    $pets = [];
    $objects = [];

    foreach ($designs as $design) {
        $payload = json_decode($design['payload'], true);
        if ($design['tool'] === 'character') {
            $characters[strtolower($design['name'])] = $payload;
        } else if ($design['tool'] === 'pet') {
            $pets[strtolower($design['name'])] = $payload;
        } else if ($design['tool'] === 'house') {
            $objects['lib_' . $design['id']] = [
                'type' => 'house',
                'name' => $design['name'],
                'payload' => $payload
            ];
        }
    }

    // Fetch approved world_creations (Pixel Studio creations)
    $stmt2 = $pdo->prepare("SELECT id, name, category, pixels, grid_size FROM world_creations WHERE status = 'approved' ORDER BY created_at ASC");
    $stmt2->execute();
    $creations = $stmt2->fetchAll();

    foreach ($creations as $creation) {
        $objects['lib_pixel_' . $creation['id']] = [
            'type' => 'pixelart',
            'name' => $creation['name'],
            'pixels' => json_decode($creation['pixels'], true),
            'gridSize' => $creation['grid_size']
        ];
    }
    
    echo json_encode(['success' => true, 'characters' => $characters, 'pets' => $pets, 'objects' => $objects]);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Failed to fetch blueprints']);
}
