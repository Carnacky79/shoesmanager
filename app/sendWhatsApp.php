<?php
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $to = $_POST['to'];
    $message = $_POST['message'];

    require 'twilio_script.php'; // Questo è il file che contiene la funzione sendWhatsAppMessage

    $result = sendWhatsAppMessage($to, $message);

    header('Content-Type: application/json');
    echo json_encode($result);
}