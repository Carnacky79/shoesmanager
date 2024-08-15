<?php
require_once 'db/dbConnection.php';
global $conn;

$id = $_POST['id'];
$ritirato = $_POST['ritirato'];

$status = setLavoroRitirato($conn, $id, $ritirato);

if($status !== 'error') {
    http_response_code(200);
    echo 'ok';
} else {
    http_response_code(500);
    echo 'error';
}
