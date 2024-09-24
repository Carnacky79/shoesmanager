/*!
    * Start Bootstrap - SB Admin v7.0.7 (https://startbootstrap.com/template/sb-admin)
    * Copyright 2013-2023 Start Bootstrap
    * Licensed under MIT (https://github.com/StartBootstrap/startbootstrap-sb-admin/blob/master/LICENSE)
    */
    // 
// Scripts
// 

window.addEventListener('DOMContentLoaded', event => {

    // Toggle the side navigation
    const sidebarToggle = document.body.querySelector('#sidebarToggle');
    if (sidebarToggle) {
        // Uncomment Below to persist sidebar toggle between refreshes
        // if (localStorage.getItem('sb|sidebar-toggle') === 'true') {
        //     document.body.classList.toggle('sb-sidenav-toggled');
        // }
        sidebarToggle.addEventListener('click', event => {
            event.preventDefault();
            document.body.classList.toggle('sb-sidenav-toggled');
            localStorage.setItem('sb|sidebar-toggle', document.body.classList.contains('sb-sidenav-toggled'));
        });
    }

    //CHIAMATA AJAX RICERCA
    document.getElementById('btnRicerca').addEventListener('click', function() {
        // Ottieni il form e i suoi dati
        var form = document.getElementById('formRicerca');
        var formData = new FormData(form);

        // Crea un oggetto XMLHttpRequest
        var xhr = new XMLHttpRequest();

        // Configura la richiesta
        xhr.open('POST', 'app/ricerca.php', true);

        // Definisci cosa fare quando la risposta è pronta
        xhr.onreadystatechange = function() {
            // Verifica se la richiesta è completata e la risposta è pronta
            if (xhr.readyState === 4) {
                // Verifica se la richiesta ha avuto successo
                if (xhr.status === 200) {
                    // Popola il div con ID "risultato_ricerca" con il contenuto della risposta
                    document.getElementById('risultato_ricerca').innerHTML = xhr.responseText;

                    var form = document.getElementById('inserisciCliente');
                    if(form) {
                        addEventToInserisci();
                    }
                    if(document.getElementById('resCodCliente')) {
                        var cod_cliente = document.getElementById('resCodCliente').innerHTML;
                        document.getElementById('num_cliente').value = cod_cliente;
                    }
                } else {
                    // Gestisci l'errore
                    console.error('Errore durante la richiesta AJAX: ' + xhr.status);
                }
            }
        };

        // Invia la richiesta con i dati del form
        xhr.send(formData);
    });
});

/*function addEventToInserisci() {
    document.getElementById('btnInserisci').addEventListener('click', function () {
        // Ottieni il form e i suoi dati
        var form = document.getElementById('inserisciCliente');
        var formData = new FormData(form);

        // Crea un oggetto XMLHttpRequest
        var xhr = new XMLHttpRequest();

        // Configura la richiesta
        xhr.open('POST', 'app/inserisci.php', true);

        // Definisci cosa fare quando la risposta è pronta
        xhr.onreadystatechange = function () {
            // Verifica se la richiesta è completata e la risposta è pronta
            if (xhr.readyState === 4) {
                // Verifica se la richiesta ha avuto successo
                if (xhr.status === 200) {
                    // Mostra il messaggio di successo
                    var successMessage = document.getElementById('successMessage');
                    successMessage.style.display = 'block';

                    // Fai lampeggiare il messaggio
                    setTimeout(function () {
                        successMessage.style.display = 'none';
                    }, 3000); // Mostra il messaggio per 3 secondi

                    // Popola il div con ID "risultato_ricerca" con il contenuto della risposta
                    document.getElementById('risultato_ricerca').innerHTML = xhr.responseText;
                    var cod_cliente = document.getElementById('resCodCliente').innerHTML;
                    document.getElementById('num_cliente').value = cod_cliente;
                } else {
                    // Gestisci l'errore
                    console.error('Errore durante la richiesta AJAX: ' + xhr.status);
                }
            }
        };

        // Invia la richiesta con i dati del form
        xhr.send(formData);
    });
}*/

function addEventToInserisci() {
    document.getElementById('btnInserisci').addEventListener('click', function () {
        // Ottieni il form e i suoi dati
        var form = document.getElementById('inserisciCliente');
        var formData = new FormData(form);

        // Crea un oggetto XMLHttpRequest
        var xhr = new XMLHttpRequest();

        // Configura la richiesta
        xhr.open('POST', 'app/inserisci.php', true);

        // Definisci cosa fare quando la risposta è pronta
        xhr.onreadystatechange = function () {
            // Verifica se la richiesta è completata e la risposta è pronta
            if (xhr.readyState === 4) {
                // Verifica se la richiesta ha avuto successo
                if (xhr.status === 200) {
                    // Mostra il messaggio di successo
                    var successMessage = document.getElementById('successMessage');
                    successMessage.style.display = 'block';

                    // Fai lampeggiare il messaggio
                    setTimeout(function () {
                        successMessage.style.display = 'none';
                    }, 3000); // Mostra il messaggio per 3 secondi

                    // Popola il div con ID "risultato_ricerca" con il contenuto della risposta
                    document.getElementById('risultato_ricerca').innerHTML = xhr.responseText;
                    var cod_cliente = document.getElementById('resCodCliente').innerHTML;
                    document.getElementById('num_cliente').value = cod_cliente;

                    // Prendi il numero di telefono dall'input (ad esempio da un campo del form)
                    var telefono = document.getElementById('telefono').innerHTML;

                    // Verifica se il numero di telefono esiste
                   if (telefono) {
                        // Formatta il messaggio di benvenuto con il codice cliente
                        var messaggio = "Benvenuto da Robi il Calzolaio, questo è il suo codice cliente è: " + cod_cliente;
                        
                         // Copia il messaggio nella clipboard
                        navigator.clipboard.writeText(messaggio).then(function() {
                            console.log('Messaggio copiato nella clipboard: ' + messaggio);
                        }).catch(function(err) {
                            console.error('Errore nel copiare il messaggio nella clipboard: ', err);
                        });

                        // Codifica il messaggio per l'URL di WhatsApp
                        var messaggioEncoded = encodeURIComponent(messaggio);

                        // Formatta il link per WhatsApp
                        var whatsappLink = "https://wa.me/39" + telefono + "?text=" + messaggioEncoded;
                        
                        // Apri WhatsApp in una nuova finestra o scheda
                        window.open(whatsappLink, '_blank');
                    } else {
                        console.error("Numero di telefono non trovato.");
                    }

                } else {
                    // Gestisci l'errore
                    console.error('Errore durante la richiesta AJAX: ' + xhr.status);
                }
            }
        };

        // Invia la richiesta con i dati del form
        xhr.send(formData);
    });
}

document.getElementById('btnInserisciLavoro').addEventListener('click', function () {
    var button = this;

    // Disabilita subito il pulsante per evitare clic multipli
    button.disabled = true;

    // Ottieni il form e i suoi dati
    var form = document.getElementById('formLavoroIns');
    var formData = new FormData(form);

    // Crea un oggetto XMLHttpRequest
    var xhr = new XMLHttpRequest();

    // Configura la richiesta
    xhr.open('POST', 'app/inserisciLavoro.php', true);

    // Definisci cosa fare quando la risposta è pronta
    xhr.onreadystatechange = function () {
        if (xhr.readyState === 4) {
            // Verifica se la richiesta ha avuto successo
            if (xhr.status === 200) {
                // Mostra il messaggio di successo
                var successMessage = document.getElementById('successMessage');
                successMessage.style.display = 'block';

                // Fai lampeggiare il messaggio
                setTimeout(function () {
                    successMessage.style.display = 'none';
                    window.location.href = "lavori.php";
                }, 3000); // Mostra il messaggio per 3 secondi

            } else {
                // Gestisci l'errore
                console.error('Errore durante la richiesta AJAX: ' + xhr.status);
            }
        }
    };

    // Invia la richiesta con i dati del form
    xhr.send(formData);

    // Timeout fisso di 5 secondi prima di poter cliccare di nuovo
    setTimeout(function() {
        button.disabled = false;
    }, 5000); // Cambia il tempo come desideri (5000ms = 5 secondi)
});





       /* document.getElementById('btnInserisciLavoro').addEventListener('click', function () {
            // Ottieni il form e i suoi dati
            var form = document.getElementById('formLavoroIns');
            var formData = new FormData(form);

            // Crea un oggetto XMLHttpRequest
            var xhr = new XMLHttpRequest();

            // Configura la richiesta
            xhr.open('POST', 'app/inserisciLavoro.php', true);

            // Definisci cosa fare quando la risposta è pronta
            xhr.onreadystatechange = function () {
                // Verifica se la richiesta è completata e la risposta è pronta
                if (xhr.readyState === 4) {
                    // Verifica se la richiesta ha avuto successo
                    if (xhr.status === 200) {
                        // Mostra il messaggio di successo
                        var successMessage = document.getElementById('successMessage');
                        successMessage.style.display = 'block';

                        // Fai lampeggiare il messaggio
                        setTimeout(function () {
                            successMessage.style.display = 'none';
                            window.location.href = "lavori.php";
                        }, 3000); // Mostra il messaggio per 3 secondi

                    } else {
                        // Gestisci l'errore
                        console.error('Errore durante la richiesta AJAX: ' + xhr.status);
                    }
                }
            };

            // Invia la richiesta con i dati del form
            xhr.send(formData);

        });*/

document.addEventListener('DOMContentLoaded', function() {
    // Funzione per la chiamata AJAX
    function avviaRicerca() {
        // Ottieni il form e i suoi dati
        var form = document.getElementById('formRicerca');
        var formData = new FormData(form);

        // Crea un oggetto XMLHttpRequest
        var xhr = new XMLHttpRequest();

        // Configura la richiesta
        xhr.open('POST', 'app/ricerca.php', true);

        // Definisci cosa fare quando la risposta è pronta
        xhr.onreadystatechange = function() {
            // Verifica se la richiesta è completata e la risposta è pronta
            if (xhr.readyState === 4) {
                // Verifica se la richiesta ha avuto successo
                if (xhr.status === 200) {
                    // Popola il div con ID "risultato_ricerca" con il contenuto della risposta
                    document.getElementById('risultato_ricerca').innerHTML = xhr.responseText;

                    var form = document.getElementById('inserisciCliente');
                    if(form) {
                        addEventToInserisci();
                    }
                    if(document.getElementById('resCodCliente')) {
                        var cod_cliente = document.getElementById('resCodCliente').innerHTML;
                        document.getElementById('num_cliente').value = cod_cliente;
                    }
                } else {
                    // Gestisci l'errore
                    console.error('Errore durante la richiesta AJAX: ' + xhr.status);
                }
            }
        };

        // Invia la richiesta con i dati del form
        xhr.send(formData);
    }

    // Aggiungi l'event listener per il click sul bottone
    document.getElementById('btnRicerca').addEventListener('click', avviaRicerca);

    // Seleziona tutti i campi di input all'interno del form
    const inputs = document.querySelectorAll('#formRicerca input[type="text"]');

    // Aggiungi un listener per l'evento keydown a ciascun input
    inputs.forEach(function(input) {
        input.addEventListener('keydown', function(event) {
            if (event.key === 'Enter') {
                event.preventDefault(); // Previeni il comportamento predefinito del tasto Enter
                avviaRicerca(); // Chiama la funzione di ricerca
            }
        });
    });
});