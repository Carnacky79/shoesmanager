<?php
    require_once 'config.inc.php';

    $conn = new mysqli(DB_HOST, DB_USER, DB_PASSWORD, DB_NAME);

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

    function inserisciCliente($conn, $telefono, $cod_cliente) {
        $sql = 'INSERT INTO clienti (telefono, cod_cliente, alias) VALUES (?, ?, ?)';
        $alias = 'Cliente ' . $cod_cliente;

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

    function getLavori($conn, $ended = false) {
        $sql = 'SELECT l.scaffale, l.id, l.data_inizio, l.data_fine, l.note, l.num_bigliettino, l.ritirato, l.data_ritiro,
c.cod_cliente, c.telefono, s.titolo, s.id, l.attributo_id, a.id, a.attributo, a.colore FROM lavori AS l
JOIN clienti AS c on c.id = l.cliente_id JOIN statolavoro AS s ON s.id = l.stato_lavoro_id
JOIN attributi AS a on a.id = l.attributo_id WHERE l.data_fine IS ' . ($ended ? 'NOT ' : '') . 'NULL';
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

    function getNowDate() {
        return date('Y-m-d');
    }

    function getLastBiglietto($conn) {
        $sql = 'SELECT num_bigliettino FROM lavori WHERE data_fine IS NULL ORDER BY num_bigliettino DESC, data_inizio DESC LIMIT 1';
        return $conn->query($sql)->fetch_assoc();
    }

    function getGiorniTrascorsi($data){
        return date_diff(date_create($data), date_create(date('Y-m-d')))->days +1;
    }

