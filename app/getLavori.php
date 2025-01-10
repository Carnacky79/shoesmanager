<?php

require_once 'db/dbConnection.php';
global $conn;


$queries = array();
parse_str($_SERVER['QUERY_STRING'], $queries);

$ended = 0;
$display = 1;
$attributi = [];

if(isset($queries['ended'])) {
    $ended = $queries['ended'] == 'true' ? 1 : 0;
}

if(isset($queries['display'])) {
    $display = $queries['display'] == 'all' ? 1 : 0;
}

if(isset($queries['attributi']) && $queries['attributi'] != '') {
    $attributi = explode(',', $queries['attributi']);
    //$attributi = $queries['attributi'];
}


$lavori = getLavori($conn, $ended, $display, $attributi);

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

// Azione per aggiornare le note
if (isset($_POST['action']) && $_POST['action'] == 'update_notes') {
    $id = $_POST['id']; // ID del lavoro
    $notes = $_POST['notes']; // Le nuove note

    $query = "UPDATE lavori SET note = ? WHERE id = ?";
    $stmt = $conn->prepare($query);
    $stmt->bind_param("si", $notes, $id);

    if ($stmt->execute()) {
        echo json_encode(['success' => true]);
    } else {
        echo json_encode(['success' => false, 'error' => 'Errore nell\'aggiornamento delle note']);
    }
    exit;
}

// Azione per recuperare le note
if (isset($_POST['action']) && $_POST['action'] == 'get_notes') {
    $id = $_POST['id']; // ID del lavoro

    $query = "SELECT note FROM lavori WHERE id = ?";
    $stmt = $conn->prepare($query);
    $stmt->bind_param("i", $id);
    $stmt->execute();
    $result = $stmt->get_result();

    if ($result->num_rows > 0) {
        $row = $result->fetch_assoc();
        echo json_encode(['success' => true, 'notes' => $row['note']]);
    } else {
        echo json_encode(['success' => false, 'error' => 'Lavoro non trovato']);
    }
    exit;
}


echo json_encode(['data' => $lavori], JSON_PRETTY_PRINT);