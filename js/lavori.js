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


    const dataTableLavoriA = document.getElementById('dataTable1');
        var myTable = new DataTable(dataTableLavoriA, {
            ajax: {
                url: 'app/getLavori.php',
            },
            columns: [
                {data: 'lid',
                visible: false},
                {data: 'cod_cliente'},
                {data: 'num_bigliettino'},
                {data: 'attributo_id',
                    render: function(data, type, row) {
                    console.log(row['lid']);
                    getAttributi(data, row['lid']);
                        return '<div style="display:flex; flex-wrap: wrap" id="attributo_id_'+ row['lid'] +'"></div>';
                    }
                },
                {data: 'telefono', render: function(data, type, row) {
                        return data + '<a style="margin-left: 2px;" href="https://wa.me/39'+data+'" target="_blank"><i class="fa-brands fa-square-whatsapp fa-beat-fade fa-lg" style="color: #005239;"></i></a>';
                    }
                },
                {data: 'giorni_trascorsi'},
                {data: 'sid', render: function(data, type, row) {
                        getStati(data, row['lid']);
                    return '<select name="stato_id" id="stato_id_'+ row['lid'] + '"></select>';}
                },
                {data: 'note'},
                {data: 'data_inizio',
                    type: 'datetime', // Forza DataTable a trattare questa colonna come data
                render: function(data, type, row) {
                var dataFormatted = new Date(data).toLocaleDateString();
                        var ora = new Date(data).toLocaleTimeString();
                        return dataFormatted + ' - ' + ora; // Assicurati che i dati siano formattati come data leggibile
            }
                },
            ],
            /*order: [
                ['8', 'asc'],
            ],*/
            columnDefs: [
                {target: 1, width: '10px'},
                {target: 2, width: '10px'},
                {target: 3, width: '400px'},
                {target: 4, width: '120px'},
                {target: 5, width: '10px'},

                {target: 8, width: '250px'},
                {
                   targets: 8,
                    render: function (data, type, row) {
                        var dataFormatted = new Date(data).toLocaleDateString();
                        var ora = new Date(data).toLocaleTimeString();
                        return dataFormatted + ' - ' + ora;
                    }
                }
            ],
            deferRender: true,
            lengthMenu: [
                [10, 25, 50, -1],
                [100, 200, 250, 'All']
            ],
            layout: {
                topStart: null
            },
            initComplete: function () {
                this.api()
                    .columns()
                    .every(function () {
                        let column = this;
                        let title = column.header().textContent;
                        if(title.toLowerCase() == 'attributi') {
                            columnSearchCheckboxes(column);

                            // Create input element
                            /*let input = document.createElement('input');
                            input.style.width = '100px';
                            input.placeholder = title.toLowerCase();

                            column.header().replaceChildren(input);


                            // Event listener for user input
                            input.addEventListener('keyup', () => {
                                if (column.search() !== this.value) {
                                    column.search(input.value).draw();
                                }
                            });*/
                        }
                    });
            },
            pageLength: 200
            //autoWidth: true
        });

        let selectedTd = [];

    myTable.on('click', 'tbody tr', (e) => {
        let classList = e.currentTarget.classList;

        if (classList.contains('selected')) {
            classList.remove('selected');
        }
        else {
            myTable.rows('.selected').nodes().each((row) => row.classList.remove('selected'));
            classList.add('selected');
        }
    });

    document.querySelector('#btnDuplica').addEventListener('click', function () {
        // Ottieni la riga selezionata
        var selectedRowData = myTable.row('.selected').data();

        var idlavoro = selectedRowData.lid;  // Supponendo che l'id sia nella prima colonna

        console.log('lavoroId', idlavoro);

        DuplicaLavoro(idlavoro);

        myTable.ajax.reload();
    });

    function DuplicaLavoro(id){
        var formData = new FormData();
        formData.append('id', id);
        var xhr = new XMLHttpRequest();
        xhr.open('POST', 'app/duplicaLavoro.php', true);
        xhr.onload = function () {
            if (xhr.status === 200) {
                console.log('response', xhr.responseText);
            }else{
                console.log('error', xhr.responseText);
            }
        };
        xhr.send(formData);
    }

    myTable.on('dblclick', 'tbody tr textarea', function (e) {

    e.stopPropagation();

        // Seleziona tutto il contenuto della textarea
        $(this).select();
    });

        myTable.on('dblclick', 'tbody tr', function (e) {
            var lavoroId = myTable.row(this).data().lid;
            var confirm = window.confirm("Vuoi chiudere il lavoro?");
            if(!confirm) {
                return;
            }
            var scaffale = prompt("Inserisci lo scaffale", "");
            if(scaffale == "") {
                return;
            }
            setLavoroEnded(lavoroId, myTable, myTable2, scaffale);

            console.log('lavoroId', lavoroId);

        });


    myTable.on('click', 'tbody td:not(:first-child)', function (e) {

        var cell = myTable.cell(this);
        var row = myTable.row(this);
        var data = row.data();
        var col = myTable.column(this);
        var colData = col.data();
        var rowData = row.data();
        var cellData = cell.data();
        var cellIndex = cell.index();
        var rowIndex = row.index();
        var cellElement = null;
        if((cellIndex.column == 2) ) {
            e.preventDefault();

    cellElement = cell.node();
    cellElement.innerHTML = '<input type="hidden" value="' + data.lid + '" id="id_value"><input type="hidden" value="' + cellIndex.column + '" id="index_column"><input style="width: 80%; z-index:9999" type="text" value="' + cellData + '" autofocus /> <button class="customBtn btn btn-outline-dark" onclick="submitEdit(this)">Edit</button>';

    cellElement.querySelector('input[type="text"]').focus();
    cellElement.querySelector('input[type="text"]').addEventListener("click", function (e) {
        e.stopPropagation();
    });


        console.log('cell', cell);
        console.log('row', row);
        console.log('data', data);
        console.log('col', col);
        console.log('colData', colData);
        console.log('rowData', rowData);
        console.log('cellData', cellData);
        console.log('cellIndex', cellIndex);
        console.log('rowIndex', rowIndex);
        }else if((cellIndex.column == 7)){
            e.preventDefault();

            cellElement = cell.node();
            cellElement.innerHTML = '<input type="hidden" value="' + data.lid +
                '" id="id_value"><input type="hidden" value="' + cellIndex.column +
                '" id="index_column"><textarea style="z-index:9999; width:100%" autofocus onfocusout="submitEditFalse(this)" onfocusin="autosize(this)">' + cellData + '</textarea> <button class="customBtn btn btn-outline-dark" onclick="submitEdit(this)">Edit</button>';

            cellElement.querySelector('textarea').focus();
            cellElement.querySelector('textarea').addEventListener("click", function (e) {
                e.stopPropagation();
            });
        }
    });

    const dataTableLavoriT = document.getElementById('dataTable2');
    const ritiratiRadio = document.getElementsByName('ritirati');

    var myTable2 = new DataTable(dataTableLavoriT, {
        ajax: {
            url: 'app/getLavori.php?ended=true&display=non',
        },
        columns: [
            {data: 'lid',
                visible: false},
            {data: 'cod_cliente'},
            {data: 'num_bigliettino'},
            {data: 'data_inizio'},
            {data: 'data_fine'},
            {data: 'scaffale'},
            {
                data: 'ritirato',
                render: function (data, type, row) {
                    console.log("cazzo" , data);
                    if (row['ritirato'] == 1) {
                        return '<div class="form-check form-switch d-flex flex-row justify-content-center">'+
                            '<input onchange="setRitirato(this, '+row['lid']+')" type="checkbox" role="switch" class="form-check-input" checked="checked" id="switch_'+ row['lid'] +'"></div>';
                    } else {
                        return '<div class="form-check form-switch d-flex flex-row justify-content-center">'+
                            '<input onchange="setRitirato(this, '+row['lid']+')" type="checkbox" role="switch" class="form-check-input" id="switch_'+ row['lid'] +'"></div>';
                    }
                }
            },

            {data: 'note'},
            /*{data: 'telefono'},*/
            {data: 'telefono', render: function(data, type, row) {
                        return data + '<a style="margin-left: 2px;" href="https://wa.me/39'+data+'" target="_blank"><i class="fa-brands fa-square-whatsapp fa-beat-fade fa-lg" style="color: #005239;"></i></a>';
                    }
            },
            {data: 'data_ritiro'},
            {data: 'giorni_trascorsi'},

        ],
        columnDefs: [
            {
                targets: [3,4,9],
                render: function (data, type, row) {
                    var dataFormatted = new Date(data).toLocaleDateString();
                    var ora = new Date(data).toLocaleTimeString();
                    return dataFormatted + ' - ' + ora;
                }
            }
        ],
        order: {
            name: 'data_inizio',
            dir: 'desc'
        },
        deferRender: true,
        createdRow: function (row, data, dataIndex, cells) {
            console.log("capocchia",data['giorni_trascorsi']);
            if(data['giorni_trascorsi'] > 30) {
                $(row).addClass('bg-rosso');
            }else if(data['giorni_trascorsi'] >= 20 && data['giorni_trascorsi'] <= 30) {
                $(row).addClass('bg-arancione');
            }
        },
        initComplete: function () {
            this.api()
                .columns()
                .every(function () {
                    let column = this;
                    let title = column.header().textContent;
                    if(title.toLowerCase() == 'num biglietto' || title.toLowerCase() == 'cod. cliente') {
                    // Create input element
                    let input = document.createElement('input');
                    input.style.width = '50px';
                    input.placeholder = title.toLowerCase();

                        column.header().replaceChildren(input);


                    // Event listener for user input
                    input.addEventListener('keyup', () => {
                        if (column.search() !== this.value) {
                            column.search(input.value).draw();
                        }
                    });
                    }
                });
        },
        pageLength: 100
        /*drawCallback: function() {
            colorizeRows(); // Chiama la funzione di colorazione dopo che la tabella è stata disegnata
        }*/
    });

    myTable2.on('click', 'tbody td:not(:first-child)', function (e) {

        var cell = myTable2.cell(this);
        var row = myTable2.row(this);
        var data = row.data();
        var col = myTable2.column(this);
        var colData = col.data();
        var rowData = row.data();
        var cellData = cell.data();
        var cellIndex = cell.index();
        var rowIndex = row.index();
        var cellElement = null;
        if((cellIndex.column == 5) ) {
            e.preventDefault();

            cellElement = cell.node();
            cellElement.innerHTML = '<input type="hidden" value="' + data.lid + '" id="id_value"><input type="hidden" value="' + cellIndex.column + '" id="index_column"><input style="width: 80%; z-index:9999" type="text" value="' + cellData + '" autofocus onfocusout="submitEditFalse(this)" /> <button class="customBtn btn btn-outline-dark" onclick="submitEdit(this)">Edit</button>';

            cellElement.querySelector('input[type="text"]').focus();
            cellElement.querySelector('input[type="text"]').addEventListener("click", function (e) {
                e.stopPropagation();
            });


            console.log('cell', cell);
            console.log('row', row);
            console.log('data', data);
            console.log('col', col);
            console.log('colData', colData);
            console.log('rowData', rowData);
            console.log('cellData', cellData);
            console.log('cellIndex', cellIndex);
            console.log('rowIndex', rowIndex);
        }
    });

    ritiratiRadio.forEach(function(radio){
        radio.addEventListener('change', function(){
            if(radio.value == 'all') {
                myTable2.ajax.url('app/getLavori.php?ended=true&display=all').load();
            }else{
                myTable2.ajax.url('app/getLavori.php?ended=true&display=non').load();
            }
        });
    });

    myTable2.on('dblclick', 'tbody tr', function (e) {
        var lavoroId = myTable2.row(this).data().lid;
        var confirm = window.confirm("Vuoi riaprire il lavoro?");
        if(!confirm) {
            return;
        }
        setLavoroReOpened(lavoroId, myTable, myTable2);

        console.log('lavoroId', lavoroId);

    });


});

document.addEventListener('DOMContentLoaded', function() {
    console.log('document - DOMContentLoaded - bubble'); // 2nd
});

document.addEventListener('DOMContentLoaded', function() {
    //popolamento div labels 1 e 2
    var labels1 = document.getElementById('labels_1');
    var divLabels1 = labels1.querySelectorAll('div');
    divLabels1.forEach(function(div){
        let idChiamante = div.getAttribute('id');
        ajaxLabels1(idChiamante);
    });

});

function ajaxLabels1(idChiamante) {
    var xhr = new XMLHttpRequest();
    xhr.open('GET', 'app/labels.php?id='+idChiamante, true);
    xhr.onload = function () {
        if (xhr.status === 200) {
            var response = JSON.parse(xhr.responseText);
            console.log('response labels', response);
            renderLabel(response, idChiamante);
        }else{
            console.log('error', xhr.responseText);
        }
    };
    xhr.send();
}

function renderLabel(labels, idChiamante) {
    var labelData = labels.data;
    var divLabels = document.getElementById('labels_1');
    var div = divLabels.querySelector('div#'+idChiamante);
    div.innerHTML = idChiamante + ' ' + labelData;
}

function addEventToRadio(){
    var radios = document.querySelectorAll('input[id^=\'attributo_\']');
    radios.forEach(function(radio){
        radio.addEventListener('change', function(){
            //console.log('radio', radio);
            var row_id = radio.id.split('_')[2];
            var attributo_id = radio.id.split('_')[1];
            var row = radio.parentElement.parentElement;
            var innerDIV = document.getElementById('attributo_id_'+row_id);
            var actualRow = innerDIV.parentElement.parentElement;
            var formData = new FormData();
            formData.append('id', row_id);
            formData.append('attributo_id', attributo_id);
            var xhr = new XMLHttpRequest();
            xhr.open('POST', 'app/updateAttributo.php', true);
            xhr.onload = function () {
                if (xhr.status === 200) {
                    console.log('response', xhr.responseText);
                    actualRow.style.transition = "background-color 0.5s ease";
                    actualRow.style.backgroundColor = hexToRgba(xhr.responseText, 80);
                }else{
                    console.log('error', xhr.responseText);
                    actualRow.style.transition = "background-color 0.5s ease";
                    actualRow.style.backgroundColor = "red";
                    setTimeout(function() {
                        actualRow.style.backgroundColor = "";
                    }, 500);
                }
            };
            xhr.send(formData);
        });
    });

}

function setRitirato(switc, id){
    
     // Funzione per rilevare se il client è offline
    if (!navigator.onLine) {
        alert('Nessuna connessione a Internet. Controlla la tua connessione e riprova.');
        return; // Se non c'è connessione, interrompi l'esecuzione della funzione
    }
    
    
    var formData = new FormData();
    formData.append('id', id);
    formData.append('ritirato', switc.checked);
    var xhr = new XMLHttpRequest();
    xhr.open('POST', 'app/setRitirato.php', true);
    xhr.onload = function () {
        if (xhr.status === 200) {
            console.log('response', xhr.responseText);
            window.location.reload(); // Ricarica la pagina dopo che la richiesta ha avuto successo
        }else{
            console.log('error', xhr.responseText);
             alert('Ritirato non Set nel Database.');
        }
    };
    xhr.send(formData);
}

function getAttributi(attr, row_id) {
    var xhr = new XMLHttpRequest();
    xhr.open('GET', 'app/getAttributi.php', true);
    xhr.onload = function () {
        if (xhr.status === 200) {
            var response = JSON.parse(xhr.responseText);
            renderAttributi(response, attr, row_id);
        }else{
            console.log('error', xhr.responseText);
        }
    };
    xhr.send();
}
function getStati(stato, row_id) {
    console.log('statiiiii', stato);
    var xhr = new XMLHttpRequest();
    xhr.open('GET', 'app/getStati.php', true);
    xhr.onload = function () {
        if (xhr.status === 200) {
            var response = JSON.parse(xhr.responseText);
            renderStati(response, stato, row_id);
        }else{
            console.log('error', xhr.responseText);
        }
    };
    xhr.send();
}


function renderAttributi(attributi, attr_id, row_id) {
    var attr = attributi.data;
    var max_id = Math.max(...attr.map(o => o.id))
    var innerDIV = document.getElementById('attributo_id_'+row_id);
    var actualRow = innerDIV.parentElement.parentElement;
    console.log('innerDIV', innerDIV.parentElement.parentElement);
    if(innerDIV.querySelector('input[type="radio"]#attributo_'+max_id+'_'+row_id)) {
        return;
    }else{
    attr.forEach(function (attributo) {
            var radio = document.createElement('input');
            radio.type = 'radio';
            radio.name = 'attributo_' + row_id;
            radio.value = attributo.id;
            radio.id = 'attributo_' + attributo.id + '_' + row_id;
            radio.className = 'btn-check';
            if(attributo.id == attr_id) {
                radio.checked = true;
                actualRow.style.backgroundColor = hexToRgba(attributo.colore, 80);
            }

            innerDIV.appendChild(radio);
            var label = document.createElement('label');
            label.htmlFor = 'attributo_' + attributo.id + '_' + row_id;
            label.className = 'btn btn-lavori';
            label.style.backgroundColor = "#" + attributo.colore;
            label.style.marginBottom = '0';
            label.style.marginTop = '2px';

             // Impostazioni delle dimensioni a piacere
            label.style.width = '25px';  // Imposta la larghezza della label
            label.style.height = '25px';  // Imposta l'altezza della label
            label.style.padding = '0px';  // Imposta il padding della label
            label.style.fontSize = '10px';  // Imposta la dimensione del testo della label
            label.style.fontWeight = 'bold';  // Imposta la dimensione del testo della label
            label.style.lineHeight = '20px';  // Imposta l'altezza della riga per centrare verticalmente il testo


            label.innerHTML = attributo.attributo;
            innerDIV.appendChild(label);
    });
        addEventToRadio();
    }
}

function renderStati(stati, stato_id, row_id) {
    var stat = stati.data;
    console.log('statoIDSDELECTED', stato_id);
    var max_id = Math.max(...stat.map(o => o.id))
    var innerSelect = document.getElementById('stato_id_'+row_id);
    var actualRow = innerSelect.parentElement.parentElement;
    console.log('innerSelect', stati);
    let optionValues = [...innerSelect.options].map(o => o.value)
    if(optionValues.includes(max_id.toString())) {
        return;
    }else {

        stat.forEach(function (stato) {

            console.log('statoID', stato.id)
            var option = document.createElement('option');
            option.value = stato.id;
            option.innerText = stato.titolo;
            if (stato.id == stato_id) {
                option.selected = 'selected';
            }

            innerSelect.appendChild(option);

        });
        addEventToDropdown();
    }
}

function addEventToDropdown(){
    var dropdown = document.querySelectorAll('select[id^=\'stato_id_\']');
    dropdown.forEach(function(drop){
        drop.addEventListener('change', function(){
            //console.log('radio', radio);
            var row_id = drop.id.split('_')[2];
            var stato_id = drop.value;
            var formData = new FormData();
            formData.append('id', row_id);
            formData.append('stato_id', stato_id);
            var xhr = new XMLHttpRequest();
            xhr.open('POST', 'app/updateStato.php', true);
            xhr.onload = function () {
                if (xhr.status === 200) {
                    console.log('response', xhr.responseText);

                }else{
                    console.log('error', xhr.responseText);

                }
            };
            xhr.send(formData);
        });
    });

}

function setLavoroEnded(idLavoro, mtable1, mtable2, scaffale) {
    var formData = new FormData();
    formData.append('id', idLavoro);
    formData.append('scaffale', scaffale);
    var xhr = new XMLHttpRequest();
    xhr.open('POST', 'app/setLavoroEnd.php', true);
    xhr.onload = function () {
        if (xhr.status === 200) {
            console.log('response', xhr.responseText);
            mtable1.ajax.reload();

            mtable2.ajax.reload();
        }else{
            console.log('error', xhr.responseText);
        }
    };
    xhr.send(formData);

}

function setLavoroReOpened(idLavoro, mtable1, mtable2) {
    var formData = new FormData();
    formData.append('id', idLavoro);
    var xhr = new XMLHttpRequest();
    xhr.open('POST', 'app/setLavoroReOpened.php', true);
    xhr.onload = function () {
        if (xhr.status === 200) {
            console.log('response', xhr.responseText);
            mtable1.ajax.reload();

            mtable2.ajax.reload();
        }else{
            console.log('error', xhr.responseText);
        }
    };
    xhr.send(formData);

}

function submitEditFalse(obj) {
    var sib = obj.previousElementSibling;
    var row = obj.parentElement.parentElement;
    var cellElement = obj.parentElement;
    var input = null;
    var value = null;

    if(obj.type == "text"){
        input = cellElement.querySelector('input[type="text"]');
        value = input.value;
    }else {
        if (sib.type == 'text') {
            input = cellElement.querySelector('input[type="text"]');
            value = input.value;
            console.log("type tyext", value);
        } else {
            input = cellElement.querySelector('textarea');
            value = input.value;
            console.log("type textarea", value);
        }
    }
    var td = cellElement;

    setTimeout(function () {
        td.innerHTML = value;
    }, 2000);



}

function submitEdit(obj, num=1) {


        var sib = obj.previousElementSibling;
        var row = obj.parentElement.parentElement;
        var cellElement = obj.parentElement;
        var input = null;
        var value = null;
        if (sib.type == 'text') {
            input = cellElement.querySelector('input[type="text"]');
            value = input.value;
            console.log("type tyext", value);
        } else {
            input = cellElement.querySelector('textarea');
            value = input.value;
            console.log("type textarea", value);
        }
        var td = cellElement;
    if(num == 1) {

        var id = row.querySelector('#id_value').value;
        var index_column = row.querySelector('#index_column').value;
        console.log('td', td);
        var formData = new FormData();
        formData.append('id', id);
        formData.append('index_column', index_column);
        formData.append('value', value);
        var xhr = new XMLHttpRequest();
        xhr.open('POST', 'app/updateLavoro.php', true);
        xhr.onload = function () {
            if (xhr.status === 200) {
                console.log('response', xhr.responseText);
                td.innerHTML = value;
                row.style.transition = "background-color 0.5s ease";
                //row.style.backgroundColor = "green";

                setTimeout(function () {
                    //row.style.backgroundColor = "";
                }, 500);
            } else {
                console.log('error', xhr.responseText);
                row.style.transition = "background-color 0.5s ease";
                row.style.backgroundColor = "red";

                setTimeout(function () {
                    row.style.backgroundColor = "";
                }, 500);
            }
        };
        xhr.send(formData);
    }
}

//Funzione per creare la lista di checkbox sull'intestazione, per cercare

function columnSearchCheckboxes(column){
    var jsonAttribute = null;

    var xhr = new XMLHttpRequest();
    xhr.open('GET', 'app/getAttributi.php', true);
    xhr.onload = function () {
        if (xhr.status === 200) {

            jsonAttribute = JSON.parse(xhr.responseText);
            console.log('response ATTRIBUTI', jsonAttribute);

            var div = document.createElement('div');
            div.style.display = 'flex';
            div.style.flexWrap = 'wrap';
            div.setAttribute('id', 'attrSearch');
            console.log('jsonAttribute', jsonAttribute);
            jsonAttribute['data'].forEach(function (attr) {
                var input = document.createElement('input');
                input.type = 'checkbox';
                input.name = 'attrSearch';
                input.value = attr.id;
                input.id = 'attrSearch_' + attr.id;
                input.style.margin = '2px';
                input.style.width = '20px';
                input.style.height = '20px';
                input.style.cursor = 'pointer';
                input.style.float = 'left';
                input.style.marginLeft = '10px';

                input.addEventListener('change', function(){
                    var checkboxes = document.querySelectorAll('input[name=attrSearch]:checked');
                    var values = [];
                    checkboxes.forEach(function(checkbox){
                        values.push(checkbox.value);
                    });
                    console.log('values', values);
                    searchFromAttrCheck(values);
                });

                var label = document.createElement('label');
                label.htmlFor = 'attrSearch_' + attr.id;
                label.innerText = attr.attributo;
                label.style.margin = '2px';
                label.style.float = 'left';
                label.style.marginLeft = '10px';

                div.appendChild(input);
                div.appendChild(label);
            });

            console.log("attributi replace header");
            column.header().replaceChildren(div);

        } else {
            console.log('error', xhr.responseText);

        }
    };
    xhr.send();


}

function searchFromAttrCheck(values){
    var table = $('#dataTable1').DataTable();
    table.ajax.url('app/getLavori.php?attributi='+values).load();
    table.ajax.reload();
}

//converte il colore da hex a rgba

function hexToRgba(hex, opacity) {
    var r = parseInt(hex.substring(0, 2), 16);
    var g = parseInt(hex.substring(2, 4), 16);
    var b = parseInt(hex.substring(4, 6), 16);

    var a = opacity / 100;

    return `rgba(${r}, ${g}, ${b}, ${a})`;
}

function toggleAperti(t){
    var table = document.getElementById('lavoriApertiCB');
    if(t.checked) {
        table.style.display = 'block';
    }else{
        table.style.display = 'none';
    }
}