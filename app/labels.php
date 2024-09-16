<?php

require_once 'db/labelsQueries.php';
global $conn;

$type = $_GET['id'];

switch($type){
    case "totali":
        $result = CountLavoriTot($conn)[0];
        echo json_encode(['data' => $result['totale']], JSON_PRETTY_PRINT);
        break;
    case "attesa":
        $result = CountLavoriAttesaMateriale($conn)[0];
        echo json_encode(['data' => $result['totale']], JSON_PRETTY_PRINT);
        break;
    case "chiusi":
        $result = CountLavoriChiusi($conn)[0];
        echo json_encode(['data' => $result['totale']], JSON_PRETTY_PRINT);
        break;
    case "differenzaac":
        $resultC = CountLavoriAttesaMateriale($conn)[0];
        $resultA = CountLavoriTot($conn)[0];
        $diff = $resultA['totale'] - $resultC['totale'];
        echo json_encode(['data' => $diff], JSON_PRETTY_PRINT);
        break;
    case "ritirati":
        $result = CountLavoriRitirati($conn)[0];
        echo json_encode(['data' => $result['totale']], JSON_PRETTY_PRINT);
        break;
    case "differenzacr":
        $resultC = CountLavoriRitirati($conn)[0];
        $resultA = CountLavoriChiusi($conn)[0];
        $diff = $resultA['totale'] - $resultC['totale'];
        echo json_encode(['data' => $diff], JSON_PRETTY_PRINT);
        break;
    default:
        echo json_encode(['data' => 'HOLA'], JSON_PRETTY_PRINT);
        break;
}
