<?php

require_once 'db/dbConnection.php';
global $conn;


$num_cliente = $_POST['num_cliente'];

$cliente_id = getClienteId($conn, $num_cliente);

$num_bigliettino = $_POST['num_biglietto'];
$note = $_POST['note_ordine'];
//$stato = 1;
$stato = $_POST['stato_lavoro']; // Recupera lo stato selezionato
$attributo_id = $_POST['attributo_id']; // Recupera l'attributo selezionato



//$resInserimento = inserisciLavoro($conn, $cliente_id, $num_bigliettino, $stato, $note);
// Aggiungi la logica per inserire il nuovo lavoro con i dati ricevuti
$resInserimento = inserisciLavoro($conn, $cliente_id, $num_bigliettino, $stato, $attributo_id, $note);

if ($resInserimento) {
    echo 'Lavoro inserito con successo!';
} else {
    echo 'Errore durante l\'inserimento del lavoro.';
}