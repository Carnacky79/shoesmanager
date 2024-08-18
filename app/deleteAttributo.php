<?php

require_once 'db/dbConnection.php';
global $conn;

$id = $_POST['id'];

$lavoriSql = 'SELECT count(*) as totaleLavori FROM lavori WHERE attributo_id = ?';
$prepared = $conn->prepare($lavoriSql);
$prepared->bind_param('i', $id);
$prepared->execute();
$prepared->bind_result($totaleLavori);
$prepared->fetch();
$prepared->close();

var_dump($totaleLavori);


if($totaleLavori > 0) {
    $setAttributoSql = 'UPDATE lavori SET attributo_id = 0 WHERE attributo_id = ?';
    $prepared = $conn->prepare($setAttributoSql);
    $prepared->bind_param('i', $id);
    $status = $prepared->execute();
    $prepared->close();


    if(!$status) {
        http_response_code(500);
        echo 'error';
        return;
    }
}


$deleteSql = 'DELETE FROM attributi WHERE id = ?';
$prepared = $conn->prepare($deleteSql);
$prepared->bind_param('i', $id);
$status = $prepared->execute();
$prepared->close();

if($status) {
    http_response_code(200);
    echo 'ok';
} else {
    http_response_code(500);
    echo 'error';
}
