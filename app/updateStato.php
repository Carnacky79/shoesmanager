<?php
require_once 'db/dbConnection.php';
global $conn;

$id = $_POST['id'];
$stato_id = $_POST['stato_id'];

$sql = 'SELECT * FROM statolavoro where id = ?';
$prepared = $conn->prepare($sql);
$prepared->bind_param('i', $stato_id);
$prepared->execute();
$prepared->bind_result($stato_id, $stato);
$prepared->fetch();
$prepared->close();

$sql = 'UPDATE lavori SET stato_lavoro_id = ? WHERE id = ?';
$prepared = $conn->prepare($sql);
$prepared->bind_param('ii', $stato_id, $id);
$status = $prepared->execute();
$prepared->close();

if($status !== 'error') {
    http_response_code(200);
    echo 'ok';
} else {
    http_response_code(500);
    echo 'error';
}
