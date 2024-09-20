<?php

require_once 'db/dbConnection.php';
global $conn;

var_dump($_POST['cod_cliente']);

$cliente_id = getClienteId($conn, $_POST['cod_cliente']);
var_dump($cliente_id);


$query = 'INSERT INTO whatsapp (cliente_id, data_invio) VALUES (?, NOW())';
$prepared = $conn->prepare($query);
$prepared->bind_param('d', $cliente_id);
$prepared->execute();
$prepared->close();

http_response_code(200);
echo 'ok';
