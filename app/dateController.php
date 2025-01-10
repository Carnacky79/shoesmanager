<?php
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    // Ricevi i dati JSON inviati dal client
    $data = json_decode(file_get_contents('php://input'), true);

    // Controlla se sono presenti le date e l'elenco di tutte le date
    if (isset($data['startDate'], $data['endDate'], $data['allDates'])) {
        $startDate = $data['startDate'];
        $endDate = $data['endDate'];
        $allDates = $data['allDates'];

        // Verifica che le date abbiano il formato corretto (YYYY-MM-DD)
        if (validateDate($startDate) && validateDate($endDate)) {
            // Percorso corretto del file per salvare le date
            $filePath = 'app/note/date.dat'; // Modifica questo percorso

            // Converti tutte le date in una stringa separata da virgola
            $datesString = implode(", ", $allDates);

            // Sovrascrivi il file con le nuove date
            file_put_contents($filePath, $datesString . PHP_EOL);

            echo 'Date salvate con successo!';
        } else {
            echo 'Formato data non valido.';
        }
    } else {
        echo 'Errore nei dati inviati.';
    }
} else {
    echo 'Metodo non supportato.';
}

// Funzione per validare il formato della data (YYYY-MM-DD)
function validateDate($date)
{
    // Imposta il formato della data
    $format = 'Y-m-d';
    $d = DateTime::createFromFormat($format, $date);
    
    // Verifica che la data sia valida e corrisponda al formato
    return $d && $d->format($format) === $date;
}
?>