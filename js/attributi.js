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

function updateAttr(t) {
    const row = t.parentNode.parentNode;
    var inputs = row.querySelectorAll('input, textarea');
    var values = [];
    var ids = [];
    inputs.forEach(function (input) {
        ids.push(input.id);
        values.push(input.value)
    });
    ajaxAttrUpdate(values, ids);
}


function ajaxAttrUpdate(arrayValues, arrayIds) {
    var xhr = new XMLHttpRequest();
    var formData = new FormData();
    arrayValues.forEach(function (value, index) {
        formData.append(arrayIds[index], value);
    });
    xhr.open('POST', 'app/updateAttributi.php', true);
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

function addAttr(t) {
    var form = document.getElementById("addAttributo")
    var formData = new FormData(form);

    var xhr = new XMLHttpRequest();
    xhr.open('POST', 'app/addAttributo.php', true);
    xhr.onreadystatechange = function () {
        if (xhr.readyState === 4) {
            if (xhr.status === 200) {
                console.log(xhr.responseText);
                let inputs = form.querySelectorAll('input[type="text"], input[type="color"], textarea');
                inputs.forEach(function (input) {
                    input.value = '';
                });
                var myCollapse = document.getElementById('collapseExample')
                var bsCollapse = new bootstrap.Collapse(myCollapse, {
                    hide: true
                });
                renderAttrTable(JSON.parse(xhr.responseText));
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

function renderAttrTable(data) {
    var table = document.getElementById("attributiTable");

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
    col1.className = "col-md-3";
    var divInline = document.createElement("div");
    divInline.className = "d-inline-flex align-items-center";
    var label = document.createElement("label");
    label.setAttribute("for", "attributo");
    label.textContent = "attributo";
    var textInput = document.createElement("input");
    textInput.type = "text";
    textInput.className = "form-control";
    textInput.id = "attributo";
    textInput.name = "attributo";
    textInput.value = data.attributo;
    divInline.appendChild(label);
    divInline.appendChild(textInput);
    col1.appendChild(divInline);
    row.appendChild(col1);

    // Creazione della colonna per il colore
    var col2 = document.createElement("div");
    col2.className = "col-md-3";
    var colorInput = document.createElement("input");
    colorInput.type = "color";
    colorInput.className = "form-control";
    colorInput.id = "colore";
    colorInput.name = "colore";
    colorInput.value = "#" + data.colore;
    col2.appendChild(colorInput);
    row.appendChild(col2);

    // Creazione della colonna per la descrizione
    var col3 = document.createElement("div");
    col3.className = "col-md-4";
    var textArea = document.createElement("textarea");
    textArea.className = "form-control";
    textArea.id = "descrizione";
    textArea.name = "descrizione";
    textArea.value = data.descrizione;
    col3.appendChild(textArea);
    row.appendChild(col3);



    // Creazione della colonna per il bottone
    var col4 = document.createElement("div");
    col4.className = "col-md-2";
    var button = document.createElement("button");
    button.className = "btn btn-primary btn-sm";
    button.type = "button";
    button.setAttribute("onclick", "updateAttr(this)");
    button.textContent = "Aggiorna";
    col4.appendChild(button);

    var deleteButton = document.createElement("button");
    deleteButton.className = "mx-1 btn btn-danger btn-sm";
    deleteButton.type = "button";
    deleteButton.setAttribute("onclick", "deleteAttr(this)");
    deleteButton.innerHTML = '<i class="fa-solid fa-trash-can"></i>';
        col4.appendChild(deleteButton);
    row.appendChild(col4);

    table.appendChild(row);
}

function deleteAttr(t) {
    var yerOrNo = confirm("Sei sicuro di voler eliminare l'attributo?");

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
    xhr.open('POST', 'app/deleteAttributo.php', true);
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


