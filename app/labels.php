<?php

require_once 'db/labelsQueries.php';
global $conn;

$type = $_GET['id'];

switch($type){
    case "totali":
        $result = CountLavoriTot($conn)[0];
        echo json_encode(['data' => $result['totale']], JSON_PRETTY_PRINT);
        break;
    default:
        echo json_encode(['data' => 'HOLA'], JSON_PRETTY_PRINT);
        break;
}
