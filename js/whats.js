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

});

document.addEventListener('DOMContentLoaded', function() {
    var btnSubmitNote = document.getElementById('saveWhats');
    var form = document.getElementById('whatsForm');
    var note = document.getElementById('trx');

    var element = document.querySelector("trix-editor")

    var xhr = new XMLHttpRequest();
    xhr.open('GET', 'app/whatsController.php', true);
    xhr.onreadystatechange = function () {
        if (xhr.readyState === 4) {
            if (xhr.status === 200) {
                note.value = xhr.responseText;
                element.editor.setSelectedRange([0, 0])
                element.editor.insertHTML(note.value)
            } else {
                console.error('Errore durante la richiesta AJAX: ' + xhr.status);
            }
        }
    }
    xhr.send();
    
    
var numero;
var messaggio2;

    form.addEventListener('submit', function(event) {
        event.preventDefault();
    });

    btnSubmitNote.addEventListener('click', function() {
        var formData = new FormData();
        formData.append('whats', note.value);
        var xhr = new XMLHttpRequest();
        xhr.open('POST', 'app/whatsController.php', true);
        xhr.onreadystatechange = function () {
            if (xhr.readyState === 4) {
                if (xhr.status === 200) {
                    console.log(xhr.responseText);
                    document.getElementById('successMessage').style.display = 'block';
                    document.getElementById('successMessage').innerText = 'Nota salvata con successo';
                    setTimeout(function() {
                        document.getElementById('successMessage').style.display = 'none';
                    }, 3000);
                } else {
                    console.error('Errore durante la richiesta AJAX: ' + xhr.status);
                }
            }
        };
        xhr.send(formData);
    });
    
    const dataTable2 = document.getElementById('dataTable2');
    var not = 0;

    var myTable2 = new DataTable(dataTable2, {
        ajax: {
            url: 'app/getWhatsapp.php?display=not',
        },
        columns: [
            {data: 'id', visible: false},
            {data: 'cod_cliente'},
            {data: 'num_bigliettino'},
            {data: 'telefono', render: function(data, type, row) {
                    return data + '<button style="margin-left: 2px; border:none; background-color: transparent;" id="invioWhasapp" onclick="sendMessage(event, this)" data-id="'+ row['id'] +'"><i class="fa-brands fa-square-whatsapp fa-beat-fade fa-lg" style="color: #005239;"></i></button>';
                }
            },
            {data: 'giorni_trascorsi'},
            {data: 'titolo'},
            {data: 'data_fine'},
            {data: 'data_invio'},
        ],
        columnDefs: [
            {target: 1, width: '10px'},
            {target: 2, width: '10px'},

            {target: 4, width: '10px'},

            {target: 6, width: '200px'},
            {target: 7, width: '200px'},
            {
                targets: [6,7],
                render: function (data, type, row) {
                    var dataFormatted = new Date(data).toLocaleDateString();
                    var ora = new Date(data).toLocaleTimeString();
                    if (data == null){
                        return '';
                    }
                    return dataFormatted + ' - ' + ora;
                }
            }
        ],
        /*order: {
            name: 'giorni_trascorsi',
            dir: 'desc'
        },*/
         order: [
        [4, 'desc'], // Ordina per giorni_trascorsi (colonna 4) decrescente
        [6, 'asc']   // Poi per data_fine (colonna 6) crescente
        ],
        deferRender: true,
        createdRow: function (row, data, dataIndex, cells) {
            // Applica il colore solo se l'URL corrisponde
        if(not==0){
            if(data['giorni_trascorsi'] > 10) {
                $(row).addClass('bg-rosso');
            }else if(data['giorni_trascorsi'] >= 5 && data['giorni_trascorsi'] <= 10) {
                $(row).addClass('bg-arancione');
            }
        
        }
        },
        pageLength: 50

    });

    const ritiratiRadio = document.getElementsByName('ritirati');

    ritiratiRadio.forEach(function(radio){
        radio.addEventListener('change', function(){
            if(radio.value == 'not') {
                not=0;
                myTable2.ajax.url('app/getWhatsapp.php?display=not').load();
            }else{
                not=1;
                myTable2.ajax.url('app/getWhatsapp.php?display=all').load();
            }
        });
    });

});
//------------------------------------------------------------------------------------------------------------------------------
function addBusinessDaysExcludingHolidays(startDate, daysToAdd, holidays) {
    var currentDate = new Date(startDate);
    var addedDays = 0;

    // Continuare fino a raggiungere il numero di giorni lavorativi necessari
    while (addedDays < daysToAdd) {
        currentDate.setDate(currentDate.getDate() + 1); // Aggiungi un giorno

        // Format della data per confrontare con le date di chiusura
        var currentDateFormatted = currentDate.toISOString().split('T')[0]; // formato YYYY-MM-DD

        // Se il giorno è una data di chiusura, salta
        if (holidays.includes(currentDateFormatted)) {
            continue; // Salta il giorno di chiusura
        }

        addedDays++; // Contabilizza il giorno se non è chiuso
    }

    return currentDate;
}

function loadHolidays() {
    var holidays = [];
    var xhr = new XMLHttpRequest();
    xhr.open('GET', 'app/note/date.dat', false); // Carica il file in modo sincrono
    xhr.onreadystatechange = function () {
        if (xhr.readyState === 4 && xhr.status === 200) {
            // Dividi la stringa per virgola e rimuovi eventuali spazi prima e dopo le date
            holidays = xhr.responseText.split(',').map(date => date.trim());
        }
    };
    xhr.send();
    return holidays;
}

function sendMessage(e, button) {
    var id = button.getAttribute('data-id');
    var messaggio = document.getElementById('trx');
    var tempElement = document.createElement('div');
    tempElement.innerHTML = messaggio.value;

    var plainText = tempElement.innerHTML;
    plainText = plainText.replace(/<br>/g, '\n')
                         .replace(/&nbsp;/g, ' ')
                         .replace(/<div>/g, '')
                         .replace(/<\/div>/g, '');

    var data = e.target.closest('tr');
    dataTd = data.getElementsByTagName('td');
    var number = dataTd[2].innerText;
    numero = number;
    var codCliente = dataTd[0].innerText;
    var dataInizioString = dataTd[5].innerText.trim() !== "" ? dataTd[5].innerText : dataTd[6].innerText;

    var [datePart, timePart] = dataInizioString.split(" - ");
    var [day, month, year] = datePart.split("/");
    var [hours, minutes, seconds] = timePart.split(":");

    var dataInizio = new Date(year, month - 1, day, hours, minutes, seconds);

    // Carica le date di chiusura dal file
    var holidays = loadHolidays();

    // Ora aggiungiamo i giorni escludendo quelli di chiusura
    dataInizio = addBusinessDaysExcludingHolidays(dataInizio, 20, holidays);

    var dataCon20Giorni = dataInizio.toLocaleDateString('it-IT');
    plainText = plainText.replace('CC:', 'CC: ' + codCliente)
                         .replace('Data:', 'Data: ' + dataCon20Giorni);

    navigator.clipboard.writeText(plainText);
    messaggio2 = plainText;
    const myModal = new bootstrap.Modal('#staticBackdrop', {});
    const inviato = myModal._element.querySelector('#inviato');
    const messaggioModal = myModal._element.querySelector('#corpoModale');

    messaggioModal.innerHTML = '';
    messaggioModal.innerHTML = messaggioModal.innerHTML + plainText;

    inviato.setAttribute('data-cod-cliente', codCliente);
    inviato.setAttribute('data-id', id);

    myModal.show();

    const formattedMessage = encodeURIComponent(plainText)
        .replace(/%20/g, '+') 
        .replace(/%0A/g, '%0A');

    var whatsAppURl = 'https://wa.me/39' + number + '?text=' + formattedMessage;
    
    window.open(whatsAppURl, '_blank').focus();
}



/*function sendMessage(e, button){

    var id = button.getAttribute('data-id');
    //console.log(button.getAttribute('data-id'));
    var messaggio = document.getElementById('trx');
    // Create a temporary DOM element
    var tempElement = document.createElement('div');
    tempElement.innerHTML = '';

    // Assign HTML content to the element
    tempElement.innerHTML = messaggio.value;

    // Retrieve the text content from the element
    //var plainText = tempElement.textContent;
    
     // Retrieve the text content from the element
    var plainText = tempElement.innerHTML;
    
        plainText = plainText.replace(/<br>/g, '\n')  // Sostituisci i <br> con newline
                         .replace(/&nbsp;/g, ' ')
                          .replace(/<div>/g, '')    // Rimuovi <div>
        .replace(/<\/div>/g, '')  // Rimuovi </div>;
                         
    //console.log(plainText);
    var data = null;
    data = e.target.closest('tr');
    dataTd = data.getElementsByTagName('td');

    console.log("data: " + dataTd);

    var number = dataTd[2].innerText;
    var codCliente = dataTd[0].innerText;
    
    // Ottieni la data di inizio e calcola la nuova data aggiungendo 25 giorni
    //var dataInizioString = dataTd[6].innerText; // Supponendo che la data di inizio sia nella colonna 7 (indice 6)
    
    // Ottieni la data di inizio dalla colonna 5 o 6
    var dataInizioString = dataTd[5].innerText.trim() !== "" ? dataTd[5].innerText : dataTd[6].innerText;
    
    console.log("data: " + dataInizioString);
    
    // Estrai le parti della data e dell'ora
var [datePart, timePart] = dataInizioString.split(" - ");
var [day, month, year] = datePart.split("/");
var [hours, minutes, seconds] = timePart.split(":");

// Crea l'oggetto Date usando i valori estratti
var dataInizio = new Date(year, month - 1, day, hours, minutes, seconds);
//var dataInizio = new Date(year, month - 1);

// Aggiungi 20 giorni
dataInizio.setDate(dataInizio.getDate() + 20);
    
    console.log("data: " + dataInizio);

    // Format the new date (esempio: 14/11/2024)
    var dataCon25Giorni = dataInizio.toLocaleDateString('it-IT');
                         
    
    
    plainText = plainText.replace('CC:', 'CC: ' + codCliente)
                         .replace('Data:', 'Data: ' + dataCon25Giorni);
                            
    
    console.log(plainText);
    
    navigator.clipboard.writeText(plainText);


    const myModal = new bootstrap.Modal('#staticBackdrop', {});
    const inviato = myModal._element.querySelector('#inviato');
    const messaggioModal = myModal._element.querySelector('#corpoModale');

    messaggioModal.innerHTML = '';
    messaggioModal.innerHTML = messaggioModal.innerHTML + plainText;

    inviato.setAttribute('data-cod-cliente', codCliente);
    inviato.setAttribute('data-id', id);

    myModal.show();
    
   

    //var messageEncoded = encodeURIComponent(plainText).replaceAll('%20', '+');
     // Codifica il messaggio
    //var messageEncoded = encodeURIComponent(plainText);
    // Sostituisci gli accapo con %0A
    //messageEncoded = messageEncoded.replace(/%0D/g, '').replace(/%0A/g, '%0A');
    //messageEncoded = messageEncoded.replace('%20', '+');

    const formattedMessage = encodeURIComponent(plainText)
        .replace(/%20/g, '+')  // WhatsApp prefers '+' for spaces
        .replace(/%0A/g, '%0A');
    
    
    
    //var whatsAppURl = 'https://wa.me/39' + number + '?text=' + decodeEntities(messageEncoded);
    var whatsAppURl = 'https://wa.me/39' + number + '?text=' + formattedMessage;
    window.open(whatsAppURl, '_blank').focus();
}/*

----------------------------------------------------------------------------------------------------------------------------------------------------

/*function insertWhatsapp(btn){
    var formData = new FormData();
    var codCliente = btn.getAttribute('data-cod-cliente');
    console.log("cod_cliente: " + codCliente);
    if(formData.has('cod_cliente')) {
        formData.delete('cod_cliente');
    }
    formData.append('cod_cliente', codCliente);
    var xhr = new XMLHttpRequest();
    xhr.open('POST', 'app/whatsAddDB.php', true);
    xhr.onreadystatechange = function () {
        if (xhr.readyState === 4) {
            if (xhr.status === 200) {
                console.log(xhr.responseText);
            } else {
                console.error('Errore durante la richiesta AJAX: ' + xhr.status);
            }
        }
    };
    xhr.send(formData);

    var table = $('#dataTable2').DataTable();
    table.ajax.reload();
}*/

// Funzione per copiare il numero
document.getElementById('copiaNumero').addEventListener('click', function () {
    
    navigator.clipboard.writeText(numero)
        .then(() => {
            alert('Numero copiato negli appunti!');
        })
        .catch(err => {
            console.error('Errore durante la copia del numero:', err);
        });
});

// Funzione per copiare il messaggio
document.getElementById('copiaMessaggio').addEventListener('click', function () {
   
    navigator.clipboard.writeText(messaggio2)
        .then(() => {
            alert('Messaggio copiato negli appunti!');
        })
        .catch(err => {
            console.error('Errore durante la copia del messaggio:', err);
        });
});

function insertWhatsapp(btn) {
    var formData = new FormData();

    console.log(formData);
    // Recupera 'cod_cliente' dal bottone
    var codCliente = btn.getAttribute('data-cod-cliente');
    console.log("cod_cliente: " + codCliente);

    // Recupera 'id_lavoro' dal bottone
    var idLavoro = btn.getAttribute('data-id');
    console.log("id: " + idLavoro);

    // Aggiungi 'cod_cliente' e 'id_lavoro' ai dati da inviare
    if (formData.has('cod_cliente')) {
        formData.delete('cod_cliente');
    }
    formData.append('cod_cliente', codCliente);

    if (formData.has('id')) {
        formData.delete('id');
    }
    formData.append('id', idLavoro);

    // Invia la richiesta AJAX
    var xhr = new XMLHttpRequest();
    xhr.open('POST', 'app/whatsAddDB.php', true);
    xhr.onreadystatechange = function () {
        if (xhr.readyState === 4) {
            if (xhr.status === 200) {
                console.log(xhr.responseText);
            } else {
                console.error('Errore durante la richiesta AJAX: ' + xhr.status);
            }
        }
    };
    xhr.send(formData);

    // Ricarica la tabella dopo l'inserimento
    var table = $('#dataTable2').DataTable();
    const ritiratiRadio = document.getElementsByName('ritirati');

    const radioNot = document.getElementById('not');

    console.log(radioNot.checked);

    if(radioNot.checked) {
        table.ajax.url('app/getWhatsapp.php?display=not').load();
        table.ajax.reload();
        console.log("ricaricato not ");
    }else{
        table.ajax.url('app/getWhatsapp.php?display=all').load().draw();
        table.ajax.reload();
      console.log("ricaricato all ");
    }
    table.ajax.reload();
    window.location.reload(); 
    console.log("refresh all ");
    
}

var decodeEntities = (function() {
    // this prevents any overhead from creating the object each time
    var element = document.createElement('div');

    function decodeHTMLEntities (str) {
        if(str && typeof str === 'string') {
            // strip script/html tags
            str = str.replace(/<script[^>]*>([\S\s]*?)<\/script>/gmi, '');
            str = str.replace(/<\/?\w(?:[^"'>]|"[^"]*"|'[^']*')*>/gmi, '');
            element.innerHTML = str;
            str = element.textContent;
            element.textContent = '';
        }
        return str;
    }
    return decodeHTMLEntities;
})();

document.addEventListener('DOMContentLoaded', function() {
    var btnSubmitNote2 = document.getElementById('saveWhats2');
    var form = document.getElementById('whatsForm2');
    var note = document.getElementById('trx2');
    var element = form.querySelector("trix-editor");

    // Carica il contenuto iniziale tramite AJAX
    var xhr = new XMLHttpRequest();
    xhr.open('GET', 'app/whatsController2.php', true);
    xhr.onreadystatechange = function() {
        if (xhr.readyState === 4) {
            if (xhr.status === 200) {
                note.value = xhr.responseText; // Aggiorna il campo nascosto
                element.editor.setSelectedRange([0, 0]); // Imposta il cursore all'inizio
                element.editor.insertHTML(note.value); // Inserisce il contenuto nel Trix Editor
            } else {
                console.error('Errore durante la richiesta AJAX: ' + xhr.status);
            }
        }
    };
    xhr.send();

    // Gestione del submit del form
    form.addEventListener('submit', function(event) {
        event.preventDefault(); // Previene il comportamento di default del form
    });

    // Azione sul click del pulsante Salva
    btnSubmitNote2.addEventListener('click', function() {
        var formData = new FormData();
        formData.append('whats2', note.value); // Aggiungi il valore di 'note'

        var xhr = new XMLHttpRequest();
        xhr.open('POST', 'app/whatsController2.php', true);
        xhr.onreadystatechange = function() {
            if (xhr.readyState === 4) {
                if (xhr.status === 200) {
                    console.log(xhr.responseText);

                    // Mostra il messaggio di successo
                    var successMessage = document.getElementById('successMessage');
                    successMessage.style.display = 'block';
                    successMessage.innerText = 'Nota salvata con successo';
                    
                    // Nasconde il messaggio dopo 3 secondi
                    setTimeout(function() {
                        successMessage.style.display = 'none';
                    }, 3000);
                } else {
                    console.error('Errore durante la richiesta AJAX: ' + xhr.status);
                }
            }
        };

        // Invia i dati del form tramite POST
        xhr.send(formData);
    });
});