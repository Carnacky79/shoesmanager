<?php
require_once 'db/dbConnection.php';
global $conn;

$id = $_POST['id'];
$attributo_id = $_POST['attributo_id'];

$sql = "Select colore from attributi where id = ?";
$prepared = $conn->prepare($sql);
$prepared->bind_param('i', $attributo_id);
$prepared->execute();
$prepared->bind_result($colore);
$prepared->fetch();
$prepared->close();

$status = updateAttributo($conn, $id, $attributo_id);

if($status !== 'error') {
    http_response_code(200);
    echo $colore;
} else {
    http_response_code(500);
    echo 'error';
}
