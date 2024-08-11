<?php
require_once 'db/dbConnection.php';
global $conn;

$numero = $_POST['numero'] ?? null;
$codice = $_POST['cod_cliente'] ?? null;

$cliente = ricercaCliente($conn, $numero, $codice);

$ResCodCliente = getLastCodCliente($conn);
$CodCliente = $ResCodCliente['cod_cliente'] + 1;

if ($cliente) {
    $HTML = <<<HTML
    <div class="cliente">
        <h2>Cliente Trovato</h2>
        <p>Codice Cliente: <span id="resCodCliente">{$cliente['cod_cliente']}</span></p>
        <p>Telefono: {$cliente['telefono']}</p>
    </div>
HTML;

} else {
    if($numero){
        $HTML = <<<HTML
    <div class="cliente">
        <h2>Cliente non trovato</h2>
        <form id="inserisciCliente">
        

        <div class="input-group mb-3">
  <span class="input-group-text" id="inputGroup-sizing-default" style="width:40%">Numero Telefonico</span>
  <input type="text" class="form-control" name="telefono" placeholder="Telefono" value="{$numero}">
</div>
<div class="input-group mb-3">
  <span class="input-group-text" id="inputGroup-sizing-default" style="width:40%">Codice Cliente</span>
  <input type="text" class="form-control" name="cod_cliente" placeholder="Codice Cliente" value="{$CodCliente}">
</div>
<div class="form-group mb-4">
                                                <button class="btn btn-primary" type="button" id="btnInserisci">Inserisci</button>
                                            </div>

        </form>
    </div>
HTML;
    } else {
        $HTML = <<<HTML
<div class="cliente">
        <h2>Cliente non trovato</h2>
</div>
HTML;
    }
}

echo $HTML;
