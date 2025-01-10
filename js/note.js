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
    var startDateInput = document.getElementById('startDate');
    var endDateInput = document.getElementById('endDate');
    
    // Funzione per leggere le date dal file 'date.dat'
    function loadDates() {
        var xhr = new XMLHttpRequest();
        xhr.open('GET', 'app/note/date.dat', true);  // Percorso del file 'date.dat'
        xhr.onreadystatechange = function() {
            if (xhr.readyState === 4 && xhr.status === 200) {
                var datesString = xhr.responseText.trim();
                console.log('Contenuto di date.dat:', datesString);  // Aggiungi questo log
                
                // Se il file contiene delle date, impostiamole nei calendari
                if (datesString.length > 0) {
                    var datesArray = datesString.split(", ");
                    console.log('Array di date:', datesArray);  // Aggiungi questo log
                    
                    // Impostiamo la data di inizio e fine (la prima e l'ultima data)
                    if (datesArray.length > 0) {
                        startDateInput.value = datesArray[0]; // Data di inizio
                        endDateInput.value = datesArray[datesArray.length - 1]; // Data di fine
                    }
                } else {
                    console.log('Nessuna data trovata nel file');
                }
            } else {
                console.error('Errore nel caricamento delle date: ' + xhr.status);
            }
        };
        xhr.send();
    }

    // Carica le date al caricamento della pagina
    loadDates();

    // Aggiungi l'evento di salvataggio per le date
    var btnSaveDates = document.getElementById('saveDates');
    var dateForm = document.getElementById('dateForm');

    btnSaveDates.addEventListener('click', function(event) {
        event.preventDefault();
        
        var startDate = startDateInput.value;
        var endDate = endDateInput.value;

        // Genera tutte le date tra startDate e endDate
        var allDates = getDatesBetween(startDate, endDate);
        console.log('Tutte le date:', allDates);  // Aggiungi questo log

        // Invia i dati via AJAX al server
        var xhr = new XMLHttpRequest();
        xhr.open('POST', 'app/dateController.php', true);
        xhr.setRequestHeader('Content-Type', 'application/json');
        xhr.onreadystatechange = function() {
            if (xhr.readyState === 4 && xhr.status === 200) {
                console.log(xhr.responseText);
            } else {
                console.error('Errore durante il salvataggio delle date: ' + xhr.status);
            }
        };

        var data = {
            startDate: startDate,
            endDate: endDate,
            allDates: allDates
        };

        xhr.send(JSON.stringify(data));
    });

    // Funzione per ottenere tutte le date tra due date
    function getDatesBetween(startDate, endDate) {
        var dates = [];
        var currentDate = new Date(startDate);
        var endDateObj = new Date(endDate);

        while (currentDate <= endDateObj) {
            dates.push(currentDate.toISOString().split('T')[0]); // Formato YYYY-MM-DD
            currentDate.setDate(currentDate.getDate() + 1);
        }

        return dates;
    }
});
//-------------------------------------------------------------------------------------

document.addEventListener('DOMContentLoaded', function() {
    var btnSubmitNote = document.getElementById('saveNotes');
    var form = document.getElementById('noteForm');
    var note = document.getElementById('trx');

    var element = document.querySelector("trix-editor")

    var xhr = new XMLHttpRequest();
    xhr.open('GET', 'app/noteController.php', true);
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
        formData.append('note', note.value);
        var xhr = new XMLHttpRequest();
        xhr.open('POST', 'app/noteController.php', true);
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

});