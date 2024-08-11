<?php

require_once 'db/dbConnection.php';
global $conn;

$lastBiglietto = getLastBiglietto($conn);

$biglietto = ($lastBiglietto['num_bigliettino'] + 1) == 1001 ? 1 : $lastBiglietto['num_bigliettino'] + 1;
