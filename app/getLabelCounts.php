<?php
// Usa __DIR__ per evitare problemi di percorso
require_once 'db/dbConnection.php';
global $conn;

// Ottieni la data corrente
$currentDate = date('Y-m-d');

// Esegui la query per calcolare I e O, usando la funzione DATE per confrontare solo la parte della data
$query = "SELECT 
            (SELECT COUNT(*) FROM lavori WHERE DATE(data_inizio) = ?) AS I, 
            (SELECT COUNT(*) FROM lavori WHERE DATE(data_fine) = ?) AS O";

$stmt = $conn->prepare($query);
$stmt->bind_param('ss', $currentDate, $currentDate);
$stmt->execute();

$result = $stmt->get_result();

if ($result && $row = $result->fetch_assoc()) {
    echo json_encode([
        'I' => $row['I'] ?? 0,
        'O' => $row['O'] ?? 0
    ]);
} else {
    echo json_encode([
        'I' => 0,
        'O' => 0,
        'error' => true,
        'message' => 'Nessun risultato dalla query.'
    ]);
}

$stmt->close();
$conn->close();
?>