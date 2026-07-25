<?php
require 'api/db.php';
$stmt = $pdo->query("SELECT name, tool, payload FROM admin_designs WHERE tool='character' LIMIT 1");
file_put_contents('test.json', json_encode($stmt->fetchAll(PDO::FETCH_ASSOC)));
