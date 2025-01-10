<?php
require_once 'app/db/dbConnection.php'; // Connessione al database

// Verifica che la connessione sia aperta
if (!$conn) {
    die("Connessione al database fallita: " . mysqli_connect_error());
}

// Ottieni l'anno selezionato tramite GET, se non selezionato usa l'anno corrente
$currentYear = isset($_GET['year']) ? $_GET['year'] : date('Y');

// Recupera gli anni disponibili nel database (opzionale)
$yearQuery = "SELECT DISTINCT YEAR(data_inizio) AS year FROM lavori ORDER BY year DESC";
$yearResult = $conn->query($yearQuery);

// Funzione per ottenere "I" e "O" per un giorno specifico
function getIandO($day, $month) {
    global $conn, $currentYear;

    $currentDate = "$currentYear-$month-" . str_pad($day, 2, '0', STR_PAD_LEFT);
    
    $query = "SELECT 
                (SELECT COUNT(*) FROM lavori WHERE DATE(data_inizio) = ?) AS I, 
                (SELECT COUNT(*) FROM lavori WHERE DATE(data_fine) = ?) AS O";
    
    if ($stmt = $conn->prepare($query)) {
        $stmt->bind_param('ss', $currentDate, $currentDate);
        $stmt->execute();
        $result = $stmt->get_result();

        if ($result && $row = $result->fetch_assoc()) {
            return [
                'I' => $row['I'] ?? 0,
                'O' => $row['O'] ?? 0
            ];
        } else {
            return [
                'I' => 0,
                'O' => 0
            ];
        }

        $stmt->close();
    } else {
        return [
            'error' => true,
            'message' => 'Errore nella preparazione della query.'
        ];
    }
}

?>

<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8" />
    <meta http-equiv="X-UA-Compatible" content="IE=edge" />
    <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no" />
    <title>Report Lavori - ShoesManager</title>
    <link href="css/styles.css" rel="stylesheet" />
    <link href="css/datatable.css" rel="stylesheet" />
    <script src="https://use.fontawesome.com/releases/v6.3.0/js/all.js" crossorigin="anonymous"></script>
    <style>
        .label-i {
            color: blue;
        }
        .label-o {
            color: green;
        }
        .table th, .table td {
            text-align: center;
            vertical-align: middle;
        }
        .table th {
            background-color: #f1f1f1;
        }
        .table td {
            height: 25px;
            padding: 2px;
        }
        .table td .i-o-wrapper {
            display: flex;
            justify-content: space-evenly;
            gap: 5px;
        }
    </style>
</head>
<body class="sb-nav-fixed sb-sidenav-toggled">
    <div id="successMessage"></div>
    <nav class="sb-topnav navbar navbar-expand navbar-dark bg-dark">
        <a class="navbar-brand ps-3" href="index.php">Shoes Manager</a>
        <button class="btn btn-link btn-sm order-1 order-lg-0 me-4 me-lg-0" id="sidebarToggle" href="#"><i class="fas fa-bars"></i></button>
    </nav>
    <div id="layoutSidenav">
        <?php include 'includes/_sidebar.php'; ?>
        <div id="layoutSidenav_content">
            <main>
                <div class="container-fluid px-4">
                    <?php include 'includes/_navbar.php'; ?>
                    <form method="get" action="">
                        <div class="form-group">
                            <label for="year">Seleziona Anno:</label>
                            <select name="year" id="year" class="form-control" onchange="this.form.submit()">
                                <?php
                                while ($row = $yearResult->fetch_assoc()) {
                                    $selected = ($row['year'] == $currentYear) ? 'selected' : '';
                                    echo "<option value='{$row['year']}' $selected>{$row['year']}</option>";
                                }
                                ?>
                            </select>
                        </div>
                    </form>
                    <div class="card mb-4">
                        <div class="card-header">
                            <i class="fa-solid fa-calendar-day me-1"></i>
                            Calendario Annuo
                        </div>
                        <div class="card-body">
                            <table class="table table-bordered">
                                <thead>
                                    <tr>
                                        <th>Giorno</th>
                                        <?php for ($month = 1; $month <= 12; $month++) echo "<th>$month</th>"; ?>
                                    </tr>
                                </thead>
                                <tbody>
                                    <?php
                                    for ($day = 1; $day <= 31; $day++) {
                                        echo "<tr><td>$day</td>";
                                        for ($month = 1; $month <= 12; $month++) {
                                            $daysInMonth = date('t', strtotime("$currentYear-$month-01"));
                                            if ($day <= $daysInMonth) {
                                                $stats = getIandO($day, $month);
                                                echo "<td><div class='i-o-wrapper'><span class='label-i'>I: {$stats['I']}</span><span class='label-o'>O: {$stats['O']}</span></div></td>";
                                            } else {
                                                echo "<td></td>";
                                            }
                                        }
                                        echo "</tr>";
                                    }
                                    ?>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    </div>
    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.2.3/dist/js/bootstrap.bundle.min.js" crossorigin="anonymous"></script>
    <script src="https://code.jquery.com/jquery-3.7.1.js" crossorigin="anonymous"></script>
    <script src="js/stati.js"></script>
</body>
</html>