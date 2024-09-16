<?php

require_once 'noteManager.php';

if(!isset($_REQUEST['note'])) {
    echo readNotes();
}else{
    $note = $_REQUEST['note'];

    updateNotes($note);


    http_response_code(200);
    echo 'ok';
}


