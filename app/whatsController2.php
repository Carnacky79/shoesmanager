<?php

require_once 'whatsManager2.php';

if(!isset($_REQUEST['whats2'])) {
    echo readWhats();
}else{
    $whats = $_REQUEST['whats2'];

    updateWhats($whats);


    http_response_code(200);
    echo 'ok';
}