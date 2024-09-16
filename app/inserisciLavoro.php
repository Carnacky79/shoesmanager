<?php

require_once 'db/dbConnection.php';
global $conn;


$num_cliente = $_POST['num_cliente'];

$cliente_id = getClienteId($conn, $num_cliente);

$num_bigliettino = $_POST['num_biglietto'];
$stato = 0;
$note = $_POST['note_ordine'];

$resInserimento = inserisciLavoro($conn, $cliente_id, $num_bigliettino, $stato, $note);


