<?php

require_once 'db/dbConnection.php';
global $conn;

$id = $_POST['id'];
$titolo = $_POST['titolo'];

$sql = 'UPDATE statolavoro SET titolo = "'.$titolo.'" WHERE id = ' . $id;

$status = $conn->query($sql);

if($status) {
    http_response_code(200);
    echo 'ok';
} else {
    http_response_code(500);
    echo 'error';
}
