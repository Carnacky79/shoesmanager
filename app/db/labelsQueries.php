<?php

require_once 'dbConnection.php';
global $conn;

function CountLavoriTot($conn)
{
    $sql = 'SELECT COUNT(*) as totale FROM lavori WHERE data_fine IS NULL';
    return $conn->query($sql)->fetch_all(MYSQLI_ASSOC);
}

function CountLavoriAttesaMateriale($conn)
{
    $sql = 'SELECT COUNT(*) as totale FROM lavori WHERE data_fine IS NULL AND attributo_id = 3';
    return $conn->query($sql)->fetch_all(MYSQLI_ASSOC);
}

function CountLavoriChiusi($conn){
    $sql = 'SELECT COUNT(*) as totale FROM lavori WHERE data_fine IS NOT NULL';
    return $conn->query($sql)->fetch_all(MYSQLI_ASSOC);
}

function CountLavoriRitirati($conn){
    $sql = 'SELECT COUNT(*) as totale FROM lavori WHERE data_fine IS NOT NULL AND ritirato = 1';
    return $conn->query($sql)->fetch_all(MYSQLI_ASSOC);
}








