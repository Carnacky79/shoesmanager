<?php
require_once 'db/dbConnection.php';
global $conn;

$numero = $_POST['telefono'];
$codice = $_POST['cod_cliente'];

$resInserimento = inserisciCliente($conn, $numero, $codice);

if ($resInserimento) {
    $HTML = <<<HTML
    <div class="cliente">
        <h2>Cliente inserito con successo</h2>
        <p>Codice Cliente: {$codice}</p>
        <p>Telefono: {$numero}</p>
    </div>
HTML;
} else {
    $HTML = <<<HTML
    <div class="cliente">
        <h2>Errore durante l'inserimento del cliente</h2>
    </div>
HTML;
}

echo $HTML;
