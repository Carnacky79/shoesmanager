<?php

require_once 'db/dbConnection.php';
global $conn;


$queries = array();
parse_str($_SERVER['QUERY_STRING'], $queries);

$ended = 0;
$display = 1;

if(isset($queries['ended'])) {
    $ended = $queries['ended'] == 'true' ? 1 : 0;
}

if(isset($queries['display'])) {
    $display = $queries['display'] == 'all' ? 1 : 0;
}


$lavori = getLavori($conn, $ended, $display);

/*foreach ($lavori as $key => $lavoro) {
    $lavori[$key]['giorni_trascorsi'] = 0;
    if ($lavoro['data_inizio'] != null) {
        $lavori[$key]['giorni_trascorsi'] = $ended ? getGiorniTrascorsi($lavoro['data_fine']) : getGiorniTrascorsi($lavoro['data_inizio']);
    }
}*/

foreach ($lavori as $key => $lavoro) {
    // Inizializza giorni_trascorsi a 0
    $lavori[$key]['giorni_trascorsi'] = 0;

    // Verifica se data_inizio è impostata
    if ($lavoro['data_inizio'] != null) {
        // Se data_fine è impostata e ritirato è 1, i giorni devono essere 0
        if ($lavoro['data_fine'] != null && $lavoro['ritirato'] == 1) {
            $lavori[$key]['giorni_trascorsi'] = 0;
        } else {
            // Calcola i giorni trascorsi normalmente
            $lavori[$key]['giorni_trascorsi'] = $ended ? getGiorniTrascorsi($lavoro['data_fine']) : getGiorniTrascorsi($lavoro['data_inizio']);
        }
    }
}

echo json_encode(['data' => $lavori], JSON_PRETTY_PRINT);

