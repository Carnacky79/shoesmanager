<?php

/*require_once 'db/dbConnection.php';
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
echo 'ok';*/


require_once 'db/dbConnection.php';
global $conn;

// Verifica se sono presenti 'cod_cliente' e 'id_lavoro' nei parametri POST
if (isset($_POST['cod_cliente']) && isset($_POST['id'])) {

    // Stampa il valore di cod_cliente per debug
    var_dump($_POST['cod_cliente']);

    // Recupera il cliente_id basato su cod_cliente (funzione che dovresti avere definito altrove)
    $cliente_id = getClienteId($conn, $_POST['cod_cliente']);
    var_dump($cliente_id); // Debug

    // Recupera id_lavoro dal POST
    $id_lavoro = $_POST['id'];
    var_dump($id_lavoro); // Debug

    // Query per l'inserimento con id_lavoro
    $query = 'INSERT INTO whatsapp (cliente_id, id_lavoro, data_invio) VALUES (?, ?, NOW())';

    // Prepara la query e aggiungi i parametri (cliente_id e id_lavoro)
    $prepared = $conn->prepare($query);

    // Usa il binding per il cliente_id (integer) e id_lavoro (integer)
    $prepared->bind_param('dd', $cliente_id, $id_lavoro);

    // Esegui la query
    if ($prepared->execute()) {
        http_response_code(200);
        echo 'Inserimento riuscito';
    } else {
        http_response_code(500);
        echo 'Errore durante l\'inserimento: ' . $prepared->error;
    }

    // Chiudi la query e la connessione
    $prepared->close();
} else {
    // Se mancano i parametri necessari
    http_response_code(400);
    echo 'Parametri mancanti!';
}




