<?php

require_once 'db/dbConnection.php';
global $conn;

$sql = 'SELECT * FROM attributi';
$attributi = $conn->query($sql)->fetch_all(MYSQLI_ASSOC);
