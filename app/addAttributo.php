<?php
require_once 'db/dbConnection.php';
global $conn;

$arraArgs = $_REQUEST;

$sqlSel = 'SELECT MAX(posizione) as max FROM attributi';
$posizione = $conn->query($sqlSel)->fetch_assoc();
$arraArgs['posizione'] = $posizione['max'] + 1;

$sql = 'INSERT INTO attributi (';
foreach ($arraArgs as $key => $value) {
    if ($key != 'id') {
        $sql .= $key . ', ';
    }
}
$sql = substr($sql, 0, -2);
$sql .= ') VALUES (';

foreach ($arraArgs as $key => $value) {
    if ($key != 'id') {
        if($key == 'colore') {
            $value = substr($value, 1) ;
        }
        $sql .= '"' . addslashes($value) . '", ';
    }
}
$sql = substr($sql, 0, -2);
$sql .= ')';
$status = $conn->query($sql);

if($status) {
    $sql = 'SELECT * FROM attributi ORDER BY id DESC LIMIT 1';
    $result = $conn->query($sql)->fetch_assoc();

    http_response_code(200);
    echo json_encode($result);
} else {
    http_response_code(500);
    echo 'error';
}
