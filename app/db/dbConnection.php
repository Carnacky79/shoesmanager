<?php
    require_once 'config.inc.php';

    $conn = new mysqli(DB_HOST, DB_USER, DB_PASSWORD, DB_NAME);

    /*function ricercaCliente($conn, $numero, $codice) {
        $sql = 'SELECT * FROM clienti WHERE ';
        if (!is_null($numero)) {
            $param = $numero;
            $sql .= 'telefono = ?';
            $bind = 's';
        } else {
            $param = $codice;
            $sql .= 'cod_cliente = ?';
            $bind = 'i';
        }
            $prepared = $conn->prepare($sql);
            $prepared->bind_param($bind, $param);
            $prepared->execute();
            $result = $prepared->get_result();
            $prepared->close();
            return $result->fetch_assoc();
    }*/

function ricercaCliente($conn, $numero, $codice) {
    $sql = 'SELECT * FROM clienti WHERE ';
    if ($numero) {
        $param = $numero;
        $sql .= 'telefono = ?';
    } else {
        $param = $codice;
        $sql .= 'cod_cliente = ?';
    }
    $prepared = $conn->prepare($sql);
    $prepared->bind_param('s', $param);
    $prepared->execute();
    $result = $prepared->get_result();
    $prepared->close();
    return $result->fetch_assoc();
}

    function getLastCodCliente($conn) {
        $sql = 'SELECT cod_cliente FROM clienti ORDER BY cod_cliente DESC LIMIT 1';
        return $conn->query($sql)->fetch_assoc();
    }

    function inserisciCliente($conn, $telefono, $cod_cliente, $alias) {
        $sql = 'INSERT INTO clienti (telefono, cod_cliente, alias) VALUES (?, ?, ?)';

        if (empty($alias)) {
            $alias = 'Cliente ' . $cod_cliente;
        }

        $prepared = $conn->prepare($sql);
        $prepared->bind_param('sis', $telefono, $cod_cliente, $alias);
        $status = $prepared->execute();
        $prepared->close();

        return $status;
    }

    function getClienti($conn) {
        $sql = 'SELECT * FROM clienti';
        return $conn->query($sql);
    }

    function updateClienti($conn, $id, $id_col, $value) {
        switch($id_col) {
            case 2:
                $toChange = 'telefono';
                $bind = 'si';
                break;
            case 1:
                $toChange = 'alias';
                $bind = 'si';
                break;
            default:
                return false;
        }

        $sql = 'UPDATE clienti SET ' . $toChange . ' = ? WHERE id = ?';
        $prepared = $conn->prepare($sql);
        $prepared->bind_param($bind, $value, $id);
        $status = $prepared->execute();
        $prepared->close();
        return $status;
    }

    // Gestione Lavori

    function getLavori($conn, $ended = false, $display = 1, $attributi = []) {
        $sql = 'SELECT l.scaffale, l.id as lid, l.data_inizio, l.data_fine, l.note, l.num_bigliettino, l.ritirato, l.data_ritiro,
c.cod_cliente, c.telefono, s.titolo, s.id as sid, l.attributo_id, a.id as aid, a.attributo, a.colore FROM lavori AS l
JOIN clienti AS c on c.id = l.cliente_id JOIN statolavoro AS s ON s.id = l.stato_lavoro_id
JOIN attributi AS a on a.id = l.attributo_id WHERE l.data_fine IS ' . ($ended ? 'NOT ' : '') . 'NULL';

        if ($display == 0) {
            $sql .= ' AND l.ritirato = 0';
        }

        if (count($attributi) > 0 && $attributi[0] != '') {
            $sql .= ' AND l.attributo_id IN (' . implode(',', $attributi) . ')';
        }

        $sql .= ' ORDER BY l.data_inizio;';

        return $conn->query($sql)->fetch_all(MYSQLI_ASSOC);
    }

    function inserisciLavoro($conn, $cliente_id, $num_bigliettino, $stato, $note) {
        $now = getNowDate();
        $sql = 'INSERT INTO lavori (data_inizio, cliente_id, num_bigliettino, stato_lavoro_id, note) VALUES ("'.$now.'", ?, ?, ?, ?)';
        $prepared = $conn->prepare($sql);
        $prepared->bind_param('iiis', $cliente_id, $num_bigliettino, $stato, $note);
        $status = $prepared->execute();
        $prepared->close();
        return $status;
    }

function getClienteId($conn, $num_cliente) {
        $id = null;
        $sql = 'SELECT id FROM clienti WHERE cod_cliente = ?';
        $prepared = $conn->prepare($sql);
        $prepared->bind_param('d', $num_cliente);
        $prepared->execute();
        $prepared->bind_result($id);
        $prepared->fetch();
        $prepared->close();
        return $id;
    }

    function updateLavoro($conn, $id, $id_col, $value) {
        switch($id_col) {
            case 2:
                $toChange = 'num_bigliettino';
                $bind = 'ii';
                break;
            case 7:
                $toChange = 'note';
                $bind = 'si';
                break;
            case 5:
                $toChange = 'scaffale';
                $bind = 'ii';
                break;
            default:
                return false;
        }

        $sql = 'UPDATE lavori SET ' . $toChange . ' = ? WHERE id = ?';
        $prepared = $conn->prepare($sql);
        $prepared->bind_param($bind, $value, $id);
        $status = $prepared->execute();
        $prepared->close();
        return $status;
    }

    function getStatoLavoroId($conn, $stato)
    {
        $statusId = null;
        $sql = 'SELECT id FROM statolavoro WHERE UPPER(titolo) = ?';
        $prepared = $conn->prepare($sql);
        $prepared->bind_param('s', strtoupper($stato));
        $prepared->execute();
        $prepared->bind_result($statusId);
        $prepared->fetch();
        $prepared->close();
        return $stato;
    }

    function setLavoroEnd($conn, $id, $scaffale) {
        $now = getNowDate();
        $sql = 'UPDATE lavori SET attributo_id = 0, data_fine = ?, scaffale = ? WHERE id = ?';
        $prepared = $conn->prepare($sql);
        $prepared->bind_param('ssi', $now, $scaffale, $id);
        $status = $prepared->execute();
        $prepared->close();
        return $status;
    }

    function setLavoroReOpened($conn, $id){
        $sql = 'UPDATE lavori SET data_fine = NULL, attributo_id = 0, scaffale = NULL WHERE id = ?';
        $prepared = $conn->prepare($sql);
        $prepared->bind_param('i', $id);
        $status = $prepared->execute();
        $prepared->close();
        return $status;
    }

    function setLavoroRitirato($conn, $id, $ritirato){
        $now = $ritirato == 'true' ? getNowDate() : NULL;
        $rit = $ritirato == 'true' ? 1 : 0;
        $sql = 'UPDATE lavori SET ritirato = ?, data_ritiro = ? WHERE id = ?';
        $prepared = $conn->prepare($sql);
        $prepared->bind_param('isi', $rit, $now, $id);
        $status = $prepared->execute();
        $prepared->close();
        return $status;
    }


    function updateAttributo($conn, $id, $attr_id) {
        //var_dump($id, $attr_id);
        $sql = 'UPDATE lavori SET attributo_id = ? WHERE id = ?';
        $prepared = $conn->prepare($sql);
        $prepared->bind_param('ii', $attr_id, $id);
        $status = $prepared->execute();
        $prepared->close();
        return $status;
    }

    function getNowDate() {
        return date('Y-m-d H:i:s');
    }

    function getLastBiglietto($conn) {
        $sql = 'SELECT num_bigliettino FROM lavori ORDER BY id DESC LIMIT 1';
        return $conn->query($sql)->fetch_assoc();
    }

    function getGiorniTrascorsi($data){
        return date_diff(date_create($data), date_create(date('Y-m-d')))->days +1;
    }

function getWhats($conn, $display = 1) {
        if($display == 1) {
            //$sql = 'SELECT l.id, c.cod_cliente, l.num_bigliettino, c.telefono, l.data_fine, s.titolo from clienti as c join lavori as l on c.id = l.cliente_id join statolavoro as s on l.stato_lavoro_id = s.id where l.data_fine is NOT NULL AND l.ritirato = 0';
            $sql = 'SELECT l.id, c.cod_cliente, l.num_bigliettino, c.telefono, l.data_fine, s.titolo FROM clienti AS c JOIN lavori AS l ON c.id = l.cliente_id JOIN statolavoro AS s ON l.stato_lavoro_id = s.id LEFT JOIN whatsapp AS w ON w.id_lavoro = l.id WHERE l.data_fine IS NOT NULL AND l.ritirato = 0  AND (w.data_invio IS NULL OR w.id_lavoro IS NULL)';
        } else {
            //$sql = 'SELECT l.id, c.cod_cliente, l.num_bigliettino, c.telefono, l.data_fine, s.titolo, w.data_invio from clienti as c join lavori as l on c.id = l.cliente_id join statolavoro as s on l.stato_lavoro_id = s.id join whatsapp as w on w.cliente_id = c.id where w.data_invio is NOT NULL';
            $sql = 'SELECT l.id, c.cod_cliente, l.num_bigliettino, c.telefono, l.data_fine, s.titolo, w.data_invio FROM clienti AS c JOIN lavori AS l ON c.id = l.cliente_id JOIN statolavoro AS s ON l.stato_lavoro_id = s.id JOIN whatsapp AS w ON w.id_lavoro = l.id WHERE w.data_invio IS NOT NULL';
        }

    return $conn->query($sql)->fetch_all(MYSQLI_ASSOC);
}

function duplicaLavoro($conn, $id_lavoro) {
    // Step 1: Seleziona i dati del lavoro originale
    $sql_select = "SELECT cliente_id, stato_lavoro_id, data_inizio, data_fine, note, num_bigliettino, ritirato, data_ritiro, attributo_id, scaffale FROM lavori WHERE id = ?";
    $stmt_select = $conn->prepare($sql_select);
    $stmt_select->bind_param('i', $id_lavoro);
    $stmt_select->execute();
    $result = $stmt_select->get_result();

    if ($result->num_rows === 0) {
        // Nessun lavoro trovato con quell'ID
        return false;
    }

    // Recupera i dati del lavoro
    $row = $result->fetch_assoc();
    $stmt_select->close();

    // Step 2: Inserisci i dati in un nuovo record, escludendo l'ID
    $sql_insert = "INSERT INTO lavori (cliente_id, stato_lavoro_id, data_inizio, data_fine, note, num_bigliettino, ritirato, data_ritiro, attributo_id, scaffale) 
                   VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
    $stmt_insert = $conn->prepare($sql_insert);

    // Associa i valori dalla riga originale, escluso l'ID
    $stmt_insert->bind_param(
        'iissssissi',
        $row['cliente_id'],
        $row['stato_lavoro_id'],
        $row['data_inizio'],
        $row['data_fine'],
        $row['note'],
        $row['num_bigliettino'],
        $row['ritirato'],
        $row['data_ritiro'],
        $row['attributo_id'],
        $row['scaffale']
    );

    // Esegui l'insert
    $status = $stmt_insert->execute();
    $stmt_insert->close();

    return $status;
}


function insertWhatsapp(){

}