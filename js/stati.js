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

function updateStato(t) {
    const row = t.parentNode.parentNode;
    var inputs = row.querySelectorAll('input, textarea');
    var values = [];
    var ids = [];
    inputs.forEach(function (input) {
        ids.push(input.id);
        values.push(input.value)
    });
    ajaxStatoUpdate(values, ids);
}


function ajaxStatoUpdate(arrayValues, arrayIds) {
    var xhr = new XMLHttpRequest();
    var formData = new FormData();
    arrayValues.forEach(function (value, index) {
        formData.append(arrayIds[index], value);
    });
    xhr.open('POST', 'app/updateStati.php', true);
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
}

function addStato(t) {
    var form = document.getElementById("addStato")
    var formData = new FormData(form);

    var xhr = new XMLHttpRequest();
    xhr.open('POST', 'app/addStato.php', true);
    xhr.onreadystatechange = function () {
        if (xhr.readyState === 4) {
            if (xhr.status === 200) {
                console.log(xhr.responseText);
                let inputs = form.querySelectorAll('input[type="text"]');
                inputs.forEach(function (input) {
                    input.value = '';
                });
                var myCollapse = document.getElementById('collapseExample')
                var bsCollapse = new bootstrap.Collapse(myCollapse, {
                    hide: true
                });
                renderStatiTable(JSON.parse(xhr.responseText));
            } else {
                console.error('Errore durante la richiesta AJAX: ' + xhr.status);
            }
        }
    };
    /*for (let keyValue of formData.entries()) {
        console.log(keyValue);
    }*/
    xhr.send(formData);

}

function renderStatiTable(data) {
    var table = document.getElementById("statiTable");

    console.log(data);
    // Creazione del div principale con classe row e py-2
    var row = document.createElement("div");
    row.className = "row py-2";

    // Creazione del campo input hidden per l'id
    var hiddenInput = document.createElement("input");
    hiddenInput.type = "hidden";
    hiddenInput.id = "id";
    hiddenInput.name = "id";
    hiddenInput.value = data.id;
    row.appendChild(hiddenInput);

    // Creazione della colonna per l'attributo
    var col1 = document.createElement("div");
    col1.className = "col-md-4";
    var divInline = document.createElement("div");
    divInline.className = "d-inline-flex align-items-center";
    var textInput = document.createElement("input");
    textInput.type = "text";
    textInput.className = "form-control";
    textInput.id = "titolo";
    textInput.name = "titolo";
    textInput.value = data.titolo;
    divInline.appendChild(textInput);
    col1.appendChild(divInline);
    row.appendChild(col1);



    // Creazione della colonna per il bottone
    var col4 = document.createElement("div");
    col4.className = "col-md-4";
    var button = document.createElement("button");
    button.className = "btn btn-primary btn-sm";
    button.type = "button";
    button.setAttribute("onclick", "updateStato(this)");
    button.textContent = "Aggiorna";
    col4.appendChild(button);

    var deleteButton = document.createElement("button");
    deleteButton.className = "mx-1 btn btn-danger btn-sm";
    deleteButton.type = "button";
    deleteButton.setAttribute("onclick", "deleteStato(this)");
    deleteButton.innerHTML = '<i class="fa-solid fa-trash-can"></i>';
        col4.appendChild(deleteButton);
    row.appendChild(col4);

    table.appendChild(row);
}

function deleteStato(t) {
    var yerOrNo = confirm("Sei sicuro di voler eliminare lo stato?");

    if (!yerOrNo) {
        return;
    }

    const row = t.parentNode.parentNode;
    var inputs = row.querySelectorAll('input[type="hidden"]');
    var formData = new FormData();
    inputs.forEach(function (input) {
        formData.append(input.id, input.value);
    });

    var xhr = new XMLHttpRequest();
    xhr.open('POST', 'app/deleteStato.php', true);
    xhr.onreadystatechange = function () {
        if (xhr.readyState === 4) {
            if (xhr.status === 200) {
                console.log(xhr.responseText);
                row.remove();
            } else {
                console.error('Errore durante la richiesta AJAX: ' + xhr.status);
            }
        }
    };

    xhr.send(formData);
}


