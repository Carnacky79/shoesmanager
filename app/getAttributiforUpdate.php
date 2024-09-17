<?php

require_once 'db/dbConnection.php';
global $conn;

$sql = 'SELECT * FROM attributi WHERE id > 0';
$attributi = $conn->query($sql)->fetch_all(MYSQLI_ASSOC);
