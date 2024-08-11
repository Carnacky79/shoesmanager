<?php

require_once 'db/dbConnection.php';
global $conn;


$cliente_id = $_POST['num_cliente'];
$num_bigliettino = $_POST['num_biglietto'];
$stato = $_POST['stato_lavoro'];
$note = $_POST['note_ordine'];

$resInserimento = inserisciLavoro($conn, $cliente_id, $num_bigliettino, $stato, $note);


