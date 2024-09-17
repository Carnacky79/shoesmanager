<?php

require_once 'db/dbConnection.php';
global $conn;

$sql = 'SELECT * FROM statolavoro WHERE id <> 1';
$stati = $conn->query($sql)->fetch_all(MYSQLI_ASSOC);
