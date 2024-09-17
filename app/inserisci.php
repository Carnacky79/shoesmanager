<?php
require_once 'db/dbConnection.php';
global $conn;

$numero = $_POST['telefono'];
$codice = $_POST['cod_cliente'];
$alias = $_POST['alias'];

$resInserimento = inserisciCliente($conn, $numero, $codice, $alias);

if ($resInserimento) {
    $HTML = <<<HTML
    <div class="cliente">
        <h2>Cliente inserito con successo</h2>
        <p>Codice Cliente: <span id="resCodCliente">{$codice}</span></p>
        <p>Telefono: {$numero}</p>
        <p>Alias: {$alias}</p>
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
