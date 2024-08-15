<?php

require_once 'db/dbConnection.php';
global $conn;

$sql = 'SELECT * FROM statolavoro order by id';
$stati = $conn->query($sql)->fetch_all(MYSQLI_ASSOC);

echo json_encode(['data' => $stati], JSON_PRETTY_PRINT);
