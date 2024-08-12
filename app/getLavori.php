<?php

require_once 'db/dbConnection.php';
global $conn;

$ended = $_GET['ended'] == 'true' ? 1 : 0;

$lavori = getLavori($conn, $ended);

foreach ($lavori as $key => $lavoro) {
    $lavori[$key]['giorni_trascorsi'] = 0;
    if ($lavoro['data_inizio'] != null) {
        $lavori[$key]['giorni_trascorsi'] = $ended ? getGiorniTrascorsi($lavoro['data_fine']) : getGiorniTrascorsi($lavoro['data_inizio']);
    }
}

echo json_encode(['data' => $lavori], JSON_PRETTY_PRINT);

