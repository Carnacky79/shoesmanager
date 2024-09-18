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
            {data: 'telefono'},
            {data: 'giorni_trascorsi'},
            {data: 'titolo'},
            {data: 'data_fine'},
            {data: 'data_invio'},
        ],
        columnDefs: [
            {target: 1, width: '10px'},
            {target: 2, width: '10px'},
            {target: 3, width: '50px'},
            {target: 4, width: '10px'},
            {target: 5, width: '50px'},
            {target: 6, width: '200px'},
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

    myTable2.on('click', 'tbody tr', (e) => {
        var messaggio = document.getElementById('trx');
        // Create a temporary DOM element
        var tempElement = document.createElement('div');

        // Assign HTML content to the element
        tempElement.innerHTML = messaggio.value;

        // Retrieve the text content from the element
        var plainText = tempElement.textContent;
        //console.log(plainText);
        var data = myTable2.row(e.target.closest('tr')).data();
        plainText = plainText.replace('CC:', 'CC: ' + data.cod_cliente);
        console.log(plainText);


        const myModal = new bootstrap.Modal('#staticBackdrop', {});
        const inviato = myModal._element.querySelector('#inviato');
        const messaggioModal = myModal._element.querySelector('#corpoModale');

        messaggioModal.innerHTML = messaggioModal.innerHTML + plainText;

        inviato.addEventListener('click', function(){
            var formData = new FormData();
            formData.append('id', data.id);
            var xhr = new XMLHttpRequest();
            xhr.open('POST', 'app/whatsAddDB.php', true);
            xhr.onreadystatechange = function () {
                if (xhr.readyState === 4) {
                    if (xhr.status === 200) {
                        console.log(xhr.responseText);
                        myTable2.ajax.reload();
                        myModal.hide();
                    } else {
                        console.error('Errore durante la richiesta AJAX: ' + xhr.status);
                    }
                }
            };
            xhr.send(formData);
           myModal.hide();
        });
        myModal.show();
    });
});
