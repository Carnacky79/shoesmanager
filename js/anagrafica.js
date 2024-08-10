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


    const datatablesSimple = document.getElementById('dataTable');
    if (datatablesSimple) {
        var myTable = new DataTable(datatablesSimple, {
            ajax: {
                url: 'app/getClient.php',
            },
            columns: [

                { data: 'cod_cliente' },
                { data: 'alias' },
                { data: 'telefono' }
            ],
            columnDefs: [{ width: '220px', targets: 0 }]
        });


        myTable.on('click', 'tbody td:not(:first-child)', function (e) {
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
        });




        //new simpleDatatables.DataTable(datatablesSimple);
    }
});

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

