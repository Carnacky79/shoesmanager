<?php
require_once 'db/dbConnection.php';
global $conn;

$clienti = getClienti($conn);

//resultset for datatable

$dati = array();
while ($row = $clienti->fetch_assoc()) {
    $dati[] = $row;
}

echo json_encode(['data' => $dati], JSON_PRETTY_PRINT);


