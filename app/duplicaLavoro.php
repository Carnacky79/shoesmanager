<?php
require_once 'db/dbConnection.php';
global $conn;

$id = $_POST['id'];

$status = duplicaLavoro($conn, $id,);

if($status !== 'error') {
    http_response_code(200);
    echo 'ok';
} else {
    http_response_code(500);
    echo 'error';
}