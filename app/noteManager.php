<?php

// Configurazione del percorso del file
$directory = 'note';
$fileName = 'note.dat';
$filePath = $directory . '/' . $fileName;

// Funzione per leggere le note
function readNotes()
{
    global $filePath;

    $content = file_get_contents($filePath);


     return $content;
}

// Funzione per aggiungere una nuova nota
function addNote($note)
{
    global $filePath;
    $currentNotes = readNotes();
    $currentNotes .= $note . PHP_EOL;
    file_put_contents($filePath, $currentNotes);
}

// Funzione per sovrascrivere tutte le note
function updateNotes($newContent)
{
    global $filePath;
    file_put_contents($filePath, $newContent);
}

// Funzione per cancellare tutte le note
function clearNotes()
{
    global $filePath;
    file_put_contents($filePath, "");
}
