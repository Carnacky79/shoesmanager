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
        order: {
            name: 'data_fine',
            dir: 'desc'
        },
        deferRender: true,
        createdRow: function (row, data, dataIndex, cells) {
            if(data['giorni_trascorsi'] > 30) {
                $(row).addClass('bg-rosso');
            }else if(data['giorni_trascorsi'] >= 20 && data['giorni_trascorsi'] <= 30) {
                $(row).addClass('bg-arancione');
            }
        },
        pageLength: 50

    });

    const ritiratiRadio = document.getElementsByName('ritirati');

    ritiratiRadio.forEach(function(radio){
        radio.addEventListener('change', function(){
            if(radio.value == 'not') {
                myTable2.ajax.url('app/getWhatsapp.php?display=not').load();
            }else{
                myTable2.ajax.url('app/getWhatsapp.php?display=all').load();
            }
        });
    });

});

function sendMessage(e, button){

    var id = button.getAttribute('data-id');
    //console.log(button.getAttribute('data-id'));
    var messaggio = document.getElementById('trx');
    // Create a temporary DOM element
    var tempElement = document.createElement('div');
    tempElement.innerHTML = '';

    // Assign HTML content to the element
    tempElement.innerHTML = messaggio.value;

    // Retrieve the text content from the element
    var plainText = tempElement.textContent;
    //console.log(plainText);
    var data = null;
    data = e.target.closest('tr');
    dataTd = data.getElementsByTagName('td');

    console.log("data: " + dataTd);

    var number = dataTd[2].innerText;
    var codCliente = dataTd[0].innerText;
    plainText = plainText.replace('CC:', 'CC: ' + codCliente);
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

    var messageEncoded = encodeURIComponent(plainText).replaceAll('%20', '+');
    var whatsAppURl = 'https://wa.me/39' + number + '?text=' + decodeEntities(messageEncoded);
    window.open(whatsAppURl, '_blank').focus();
}

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