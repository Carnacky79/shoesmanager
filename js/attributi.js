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

function updateAttr(t){
    const row = t.parentNode.parentNode;
    var inputs = row.querySelectorAll('input, textarea');
    var values = [];
    var ids = [];
    inputs.forEach(function(input){
        ids.push(input.id);
        values.push(input.value)
    });
    ajaxAttrUpdate(values, ids);
}



function ajaxAttrUpdate(arrayValues, arrayIds){
    var xhr = new XMLHttpRequest();
    var formData = new FormData();
    arrayValues.forEach(function(value, index){
        formData.append(arrayIds[index], value);
    });
    xhr.open('POST', 'app/updateAttributi.php', true);
    xhr.onreadystatechange = function() {
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

