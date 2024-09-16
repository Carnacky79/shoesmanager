<?php

require_once 'db/dbConnection.php';
global $conn;


$queries = array();
parse_str($_SERVER['QUERY_STRING'], $queries);

$display = 1;

if(isset($queries['display'])) {
    $display = $queries['display'] == 'not' ? 1 : 0;
}


$lavori = getWhats($conn, $display);


/*foreach ($lavori as $key => $lavoro) {
    $lavori[$key]['giorni_trascorsi'] = 0;
    if ($lavoro['data_inizio'] != null) {
        $lavori[$key]['giorni_trascorsi'] = $ended ? getGiorniTrascorsi($lavoro['data_fine']) : getGiorniTrascorsi($lavoro['data_inizio']);
    }
}*/

foreach ($lavori as $key => $lavoro) {
    // Inizializza giorni_trascorsi a 0
    $lavori[$key]['giorni_trascorsi'] = 0;

    //differenza tra i giorni trascorsi da data fine e la data odierna
    $lavori[$key]['giorni_trascorsi'] = $lavoro['data_fine'] != null ? getGiorniTrascorsi($lavoro['data_fine']) : 0;

    if(!isset($lavoro['data_invio'])){
        $lavori[$key]['data_invio'] = null;
    }
}

echo json_encode(['data' => $lavori], JSON_PRETTY_PRINT);


