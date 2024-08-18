<?php

require_once 'db/dbConnection.php';
global $conn;

$arraArgs = $_REQUEST;

$sql = 'UPDATE attributi SET ';
foreach ($arraArgs as $key => $value) {
    if ($key != 'id') {
        if($key == 'colore') {
            $value = substr($value, 1) ;
        }
        $sql .= $key . ' = "' . addslashes($value) . '", ';
    }
}
$sql = substr($sql, 0, -2);
$sql .= ' WHERE id = ' . $arraArgs['id'];

$status = $conn->query($sql);

if($status) {
    http_response_code(200);
    echo 'ok';
} else {
    http_response_code(500);
    echo 'error';
}
