/*!
    * Start Bootstrap - SB Admin v7.0.7 (https://startbootstrap.com/template/sb-admin)
    * Copyright 2013-2023 Start Bootstrap
    * Licensed under MIT (https://github.com/StartBootstrap/startbootstrap-sb-admin/blob/master/LICENSE)
    */
    // 
// Scripts
// 

window.addEventListener('DOMContentLoaded', event => {
    
     getAttributi(null);
     getStati();

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

function getStati() {
    var xhr = new XMLHttpRequest();
    xhr.open('GET', 'app/getStati.php', true);
    xhr.onload = function () {
        if (xhr.status === 200) {
            var response = JSON.parse(xhr.responseText);
            console.log('Risposta ricevuta:', response); // Verifica la struttura della risposta
            if (Array.isArray(response.data)) {
                populateSelectWithStati(response.data);
            } else {
                console.error('La proprietà "data" non è un array:', response.data);
            }
        } else {
            console.log('Errore nel recupero degli stati:', xhr.responseText);
        }
    };
    xhr.send();
}

function populateSelectWithStati(stati) {
    if (!Array.isArray(stati)) {
        console.error('La risposta non è un array:', stati);
        return;
    }

    var select = document.getElementById('stato_lavoro');
    select.innerHTML = ''; // Pulisce la lista esistente

    stati.forEach(function (stato) {
        var option = document.createElement('option');
        option.value = stato.id;
        option.textContent = stato.titolo;
        select.appendChild(option);
    });
}

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
                      /* 
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
                        */
                         // Carica il messaggio da whats2.dat
                        fetch('/admin/app/whats/whats2.dat')
                            .then(response => {
                                if (!response.ok) {
                                    throw new Error('Errore nel caricamento del messaggio da whats2.dat');
                                }
                                return response.text();
                            })
                            .then(messaggio => {
                                // Formatta il messaggio
                                messaggio = messaggio
                                    .replace(/<br>/g, '\n')         // Sostituisci <br> con newline
                                    .replace(/&nbsp;/g, ' ')        // Sostituisci &nbsp; con spazio
                                    .replace(/<div>/g, '')          // Rimuovi <div>
                                    .replace(/<\/div>/g, '');       // Rimuovi </div>

                                // Aggiungi il codice cliente accanto a CC:
                                messaggio = messaggio.replace('CC:', 'CC: ' + cod_cliente);
                                
                              // Copia il messaggio nella clipboard
                        navigator.clipboard.writeText(messaggio).then(function() {
                            console.log('Messaggio copiato nella clipboard: ' + messaggio);
                        }).catch(function(err) {
                            console.error('Errore nel copiare il messaggio nella clipboard: ', err);
                        });

                                // Codifica il messaggio per WhatsApp
                                const formattedMessage = encodeURIComponent(messaggio)
                                    .replace(/%20/g, '+')  // WhatsApp preferisce '+' per spazi
                                    .replace(/%0A/g, '%0A'); // Mantenere newline

                        
                                // Formatta il link per WhatsApp
                                const whatsappLink = "https://wa.me/39" + telefono + "?text=" + formattedMessage;

                                // Apri WhatsApp in una nuova finestra o scheda
                                window.open(whatsappLink, '_blank');
                            })
                        
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

/*document.getElementById('btnInserisciLavoro').addEventListener('click', function () {
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
                    /*window.location.href = "lavori.php";*//*
                    window.location.reload(); 
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
});*/
/*-----------------------------------------------------------------------------------------------------------------------------------------------*/
document.getElementById('btnInserisciLavoro').addEventListener('click', function () {
    var button = this;

    // Disabilita subito il pulsante per evitare clic multipli
    button.disabled = true;

    // Ottieni il form e i suoi dati
    var form = document.getElementById('formLavoroIns');
    var formData = new FormData(form);

    // Recupera i dati dei campi del form
    var numCliente = formData.get('num_cliente');
    var attributoSelezionato = form.querySelector('input[name="attributo"]:checked'); // Recupera il radio selezionato
    var statoSelezionato = formData.get('stato_lavoro');
    var note = formData.get('note_ordine');

    // Verifica se il numero cliente è presente
    if (!numCliente) {
        alert('Numero cliente mancante. Inserisci un numero cliente valido.');
        button.disabled = false;
        return; // Esce dalla funzione
    }

   // Se un attributo non è selezionato, imposta 0 come valore
    var attributoValore = attributoSelezionato ? attributoSelezionato.value : 0;
    
    // Debug: Log dei dati per il controllo
    console.log('Attributo selezionato:', attributoValore);
    console.log('Stato selezionato:', statoSelezionato);
    console.log('Note:', note);

    // Aggiungi l'attributo selezionato a formData
    formData.append('attributo_id', attributoValore);

    // Crea e invia la richiesta AJAX
    var xhr = new XMLHttpRequest();
    xhr.open('POST', 'app/inserisciLavoro.php', true);
    xhr.onreadystatechange = function () {
        if (xhr.readyState === 4) {
            if (xhr.status === 200) {
                var successMessage = document.getElementById('successMessage');
                successMessage.style.display = 'block';
                setTimeout(function () {
                    successMessage.style.display = 'none';
                    window.location.reload();
                }, 3000);
            } else {
                console.error('Errore durante la richiesta AJAX: ' + xhr.status);
            }
        }
    };

    // Invia la richiesta con i dati del form
    xhr.send(formData);

    // Riabilita il pulsante dopo un timeout
    setTimeout(function () {
        button.disabled = false;
    }, 5000);
});


/*document.getElementById('btnInserisciLavoro').addEventListener('click', function () {
    var button = this;

    // Disabilita subito il pulsante per evitare clic multipli
    button.disabled = true;

    // Ottieni il form e i suoi dati
    var form = document.getElementById('formLavoroIns');
    var formData = new FormData(form);

    // Verifica se il campo numero cliente è vuoto
    var numCliente = formData.get('num_cliente'); // Sostituisci 'numero_cliente' con il name corretto del campo
    if (!numCliente) {
        alert('Numero cliente mancante. Inserisci un numero cliente valido.');
        button.disabled = false; // Riabilita subito il pulsante se manca il numero cliente
        return; // Esce dalla funzione e non invia la richiesta
    }

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
                    //window.location.href = "lavori.php";
                    window.location.reload(); 
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
});*/


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
function getAttributi(attr) {
    var xhr = new XMLHttpRequest();
    xhr.open('GET', 'app/getAttributi.php', true);
    xhr.onload = function () {
        if (xhr.status === 200) {
            var response = JSON.parse(xhr.responseText);
            renderAttributi(response, attr);
        } else {
            console.log('error', xhr.responseText);
        }
    };
    xhr.send();
}

function renderAttributi(attributi, attr_id) {
    var attr = attributi.data;
    var innerDIV = document.getElementById('attributo_id');
    innerDIV.innerHTML = ''; // Pulisci l'elemento prima di aggiungere nuovi attributi

    attr.forEach(function (attributo) {
        var radio = document.createElement('input');
        radio.type = 'radio';
        radio.name = 'attributo';
        radio.value = attributo.id;
        radio.id = 'attributo_' + attributo.id; // Assicurati che l'ID sia unico
        radio.className = 'btn-check';

        // Se l'ID dell'attributo corrisponde a quello passato, seleziona il radio
        if (attributo.id == attr_id) {
            radio.checked = true;
            innerDIV.parentElement.parentElement.style.backgroundColor = hexToRgba(attributo.colore, 80);
        }

        innerDIV.appendChild(radio);

        var label = document.createElement('label');
        label.htmlFor = 'attributo_' + attributo.id; // Assicurati che l'ID corrisponda
        label.className = 'btn btn-lavori';
        label.style.backgroundColor = "#" + attributo.colore;
        label.style.marginBottom = '0';
        label.style.marginTop = '2px';
        label.style.width = '25px';
        label.style.height = '25px';
        label.style.padding = '0px';
        label.style.fontSize = '10px';
        label.style.fontWeight = 'bold';
        label.style.lineHeight = '20px';

        label.innerHTML = attributo.attributo;
        innerDIV.appendChild(label);
    });

    addEventToRadio();
}

function hexToRgba(hex, alpha) {
    // Converte un colore esadecimale in RGBA
    var r = parseInt(hex.substring(0, 2), 16);
    var g = parseInt(hex.substring(2, 4), 16);
    var b = parseInt(hex.substring(4, 6), 16);
    return 'rgba(' + r + ',' + g + ',' + b + ',' + alpha + ')';
}

function addEventToRadio() {
    var radios = document.querySelectorAll('input[type="radio"][name="attributo"]');
    radios.forEach(function (radio) {
        radio.addEventListener('change', function () {
            // Mostra il valore selezionato del radio
            console.log('Attributo selezionato:', this.value);
        });
    });
}

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