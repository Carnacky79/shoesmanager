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
