<?php
require_once 'db/dbConnection.php';
global $conn;

$id = $_POST['id'];
$id_col = $_POST['index_column'];
$value = $_POST['value'];

$status = updateClienti($conn, $id, $id_col, $value);

if($status !== 'error') {
    http_response_code(200);
    echo 'ok';
} else {
    http_response_code(500);
    echo 'error';
}
