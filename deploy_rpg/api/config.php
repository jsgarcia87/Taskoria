<?php
// config.php
$db_host = 'localhost';
$db_name = 'rpg';
$db_user = 'Sangar';
$db_pass = 'SangarBD';

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *'); // For development.
header('Access-Control-Allow-Methods: POST, GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}
?>
