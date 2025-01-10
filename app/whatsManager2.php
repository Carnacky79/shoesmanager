<?php

// Configurazione del percorso del file
$directory = 'whats';
$fileName = 'whats2.dat';
$filePath = $directory . '/' . $fileName;

// Funzione per leggere le note
function readWhats()
{
    global $filePath;

    $content = file_get_contents($filePath);


     return $content;
}

// Funzione per aggiungere una nuova nota
function addWhats($whats)
{
    global $filePath;
    $currentWhats = readWhats();
    $currentWhats .= $whats . PHP_EOL;
    file_put_contents($filePath, $currentWhats);
}

// Funzione per sovrascrivere tutte le note
function updateWhats($newContent)
{
    global $filePath;
    file_put_contents($filePath, $newContent);
}

// Funzione per cancellare tutte le note
function clearWhats()
{
    global $filePath;
    file_put_contents($filePath, "");
}