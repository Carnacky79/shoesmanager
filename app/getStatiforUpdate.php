<?php

require_once 'db/dbConnection.php';
global $conn;

$sql = 'SELECT * FROM statolavoro';
$stati = $conn->query($sql)->fetch_all(MYSQLI_ASSOC);
