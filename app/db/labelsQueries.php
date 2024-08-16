<?php

require_once 'dbConnection.php';
global $conn;

function CountLavoriTot($conn)
{
    $sql = 'SELECT COUNT(*) as totale FROM lavori WHERE data_fine IS NULL';
    return $conn->query($sql)->fetch_all(MYSQLI_ASSOC);
}

function CountLavoriSenzaAttributi($conn)
{
    $sql = 'SELECT COUNT(*) as totale FROM lavori WHERE data_fine IS NULL AND attributo_id = 0';
    return $conn->query($sql)->fetch_all(MYSQLI_ASSOC);
}

function CountLavoriAttributi($conn, $id_attributo){
    $sql = 'SELECT COUNT(*) FROM lavori WHERE data_fine IS NULL AND attributo_id = ?';
    $prepared = $conn->prepare($sql);
    $prepared->bind_param('i', $id_attributo);
    $prepared->execute();
    return $prepared->get_result();
}








