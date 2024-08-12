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
                {data: 'id',
                visible: false},
                {data: 'cod_cliente'},
                {data: 'num_bigliettino'},
                {data: 'attributo_id',
                    render: function(data, type, row) {
                    console.log(row['id']);
                    getAttributi(data, row['id']);
                        return '<div id="attributo_id_'+ row['id'] +'"></div>';
                    }
                },
                {data: 'telefono'},
                {data: 'giorni_trascorsi'},
                {data: 'titolo'},
                {data: 'note'},
                {data: 'data_inizio'},
            ],
            order: {
                name: 'data_inizio',
                dir: 'desc'
            },
            deferRender: true
        });

    const dataTableLavoriT = document.getElementById('dataTable2');
    var myTable2 = new DataTable(dataTableLavoriT, {
        ajax: {
            url: 'app/getLavori.php?ended=true',
        },
        columns: [
            {data: 'cod_cliente'},
            {data: 'num_bigliettino'},
            {data: 'data_inizio'},
            {data: 'data_fine'},
            {data: 'scaffale'},
            {data: 'ritirato'},
            {data: 'titolo'},
            {data: 'note'},
            {data: 'telefono'},
            {data: 'data_ritiro'},
            {data: 'giorni_trascorsi'},
        ],
        columnDefs: [],
        order: {
            name: 'data_inizio',
            dir: 'desc'
        },
        deferRender: true
    });


    /*myTable.on('click', 'tbody td:not(:first-child)', function (e) {
        e.preventDefault();
        var cell = myTable.cell(this);
        var row = myTable.row(this);
        var data = row.data();
        var col = myTable.column(this);
        var colData = col.data();
        var rowData = row.data();
        var cellData = cell.data();
        var cellIndex = cell.index();
        var rowIndex = row.index();

            var cellElement = cell.node();
            cellElement.innerHTML = '<input type="hidden" value="'+data.id+'" id="id_value"><input type="hidden" value="'+cellIndex.column+'" id="index_column"><input style="z-index:9999" type="text" value="' + cellData + '" autofocus /> <button class="btn btn-outline-dark" onclick="submitEdit(this)">Edit</button>';

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
        });*/

});

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

function renderAttributi(attributi, attr_id, row_id) {
    var attr = attributi.data;
    var max_id = Math.max(...attr.map(o => o.id))
    var innerDIV = document.getElementById('attributo_id_'+row_id);
    console.log('innerDIV', innerDIV);
    if(innerDIV.querySelector('input[type="radio"]#attributo_'+max_id+'_'+row_id)) {
        return;
    }else{
    attr.forEach(function (attributo) {
            var radio = document.createElement('input');
            radio.type = 'radio';
            radio.name = 'attributo_'+row_id;
            radio.value = attributo.id;
            radio.id = 'attributo_' + attributo.id + '_' + row_id;
            radio.className = 'btn-check';
            innerDIV.appendChild(radio);
            var label = document.createElement('label');
            label.htmlFor = 'attributo_' + attributo.id + '_' + row_id;
            label.className = 'btn btn-lavori';
            label.style.color = attributo.colore;
            label.innerHTML = attributo.attributo;
            innerDIV.appendChild(label);
    });
    }
}

function submitEdit(obj) {

    var row = obj.parentElement.parentElement;
    var cellElement = obj.parentElement;
    var input = cellElement.querySelector('input[type="text"]');
    var td = cellElement;
    var value = input.value;
    var id = row.querySelector('#id_value').value;
    var index_column = row.querySelector('#index_column').value;

    var formData = new FormData();
    formData.append('id', id);
    formData.append('index_column', index_column);
    formData.append('value', value);
    var xhr = new XMLHttpRequest();
    xhr.open('POST', 'app/updateClient.php', true);
    xhr.onload = function () {
        if (xhr.status === 200) {
            console.log('response', xhr.responseText);
            td.innerHTML = value;
            row.style.transition = "background-color 0.5s ease";
            row.style.backgroundColor = "green";

            setTimeout(function() {
                row.style.backgroundColor = "";
            }, 500);
        }else{
            console.log('error', xhr.responseText);
            row.style.transition = "background-color 0.5s ease";
            row.style.backgroundColor = "red";

            setTimeout(function() {
                row.style.backgroundColor = "";
            }, 500);
        }
    };
    xhr.send(formData);

}
