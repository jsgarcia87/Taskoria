<?php
// config.php
$db_host = 'localhost';
$db_name = 'rpg';
$db_user = 'Sangar';
$db_pass = 'SangarBD';

// Emergency first-admin bootstrap secret. Leave EMPTY to keep make_me_admin
// disabled (recommended). To promote the first admin once, set a long random
// value here on the server and call:
//   POST api/admin.php?action=make_me_admin  { admin_id, secret: '<this value>' }
// then clear it again.
$admin_bootstrap_secret = '';

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *'); // For development.
header('Access-Control-Allow-Methods: POST, GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}
?>
