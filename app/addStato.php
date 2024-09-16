<?php
require_once 'db/dbConnection.php';
global $conn;

$arraArgs = $_REQUEST;


$sql = 'INSERT INTO statolavoro (titolo) VALUES ("'.$arraArgs['titolo'].'")';
$status = $conn->query($sql);

if($status) {
    $sql = 'SELECT * FROM statolavoro ORDER BY id DESC LIMIT 1';
    $result = $conn->query($sql)->fetch_assoc();

    http_response_code(200);
    echo json_encode($result);
} else {
    http_response_code(500);
    echo 'error';
}
