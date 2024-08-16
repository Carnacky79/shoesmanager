<?php

require_once 'dbConnection.php';
global $conn;

function CountLavoriTot($conn)
{
    $sql = 'SELECT COUNT(*) FROM Lavori WHERE DataFine IS NULL';
    return $conn->query($sql);
}

function CountLavoriSenzaAttributi($conn)
{
    $sql = 'SELECT COUNT(*) FROM Lavori WHERE DataFine IS NULL AND attributi = 0';
    return $conn->query($sql);
}

function CountLavoriAttributi($conn)
{
    $sql = 'SELECT COUNT(*) FROM Lavori WHERE DataFine IS NULL AND attributi = 0';
    return $conn->query($sql);
}





