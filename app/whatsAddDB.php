<?php

require_once 'db/dbConnection.php';
global $conn;

$cliente_id = getClienteId($conn, $_POST['cod_cliente']);

$query = 'INSERT INTO whatsapp (cliente_id, data_invio) VALUES (?, NOW())';
$prepared = $conn->prepare($query);
$prepared->bind_param('i', $cliente_id);
$prepared->execute();
$prepared->close();

http_response_code(200);
echo 'ok';
