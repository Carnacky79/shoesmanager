<?php

require_once 'whatsManager.php';

if(!isset($_REQUEST['whats'])) {
    echo readWhats();
}else{
    $whats = $_REQUEST['whats'];

    updateWhats($whats);


    http_response_code(200);
    echo 'ok';
}


