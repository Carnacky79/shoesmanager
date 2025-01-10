<?php

require_once 'db/dbConnection.php';
global $conn;

//$id = $_POST['id'];
//$titolo = $_POST['titolo'];
//$colore = $_POST['colore']; // Aggiungi la variabile colore

// Assicurati che la variabile $colore venga sanificata e validata per evitare SQL Injection (è sempre consigliato)
//$colore = htmlspecialchars($colore, ENT_QUOTES, 'UTF-8');

//$sql = 'UPDATE statolavoro SET titolo = "'.$titolo.'" WHERE id = ' . $id;

//$sql = 'UPDATE statolavoro SET titolo = "' . $titolo . '", colore = "' . $colore . '" WHERE id = ' . $id;

//$status = $conn->query($sql);

$arraArgs = $_REQUEST;

$sql = 'UPDATE statolavoro SET ';
foreach ($arraArgs as $key => $value) {
    if ($key != 'id') {
        if($key == 'colore') {
            $value = substr($value, 1) ;
        }
        $sql .= $key . ' = "' . addslashes($value) . '", ';
    }
}
$sql = substr($sql, 0, -2);
$sql .= ' WHERE id = ' . $arraArgs['id'];

$status = $conn->query($sql);

if($status) {
    http_response_code(200);
    echo 'ok';
} else {
    http_response_code(500);
    echo 'error';
}