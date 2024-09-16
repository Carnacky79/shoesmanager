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

    });

});
