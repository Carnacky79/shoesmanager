<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8" />
    <meta http-equiv="X-UA-Compatible" content="IE=edge" />
    <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no" />
    <meta name="description" content="" />
    <meta name="author" content="" />
    <title>Gestione Lavori - ShoesManager</title>
    <link href="css/styles.css" rel="stylesheet" />
    <link href="css/datatable.css" rel="stylesheet" />
    <script src="https://use.fontawesome.com/releases/v6.3.0/js/all.js" crossorigin="anonymous"></script>
    <style>
        <?php
        require_once 'app/db/dbConnection.php';
            require_once 'css/styleAttr.css.php';
        ?>
        /* Stile per il messaggio di successo */
        #successMessage {
            display: none;
            position: fixed;
            top: 60px;
            right: 20px;
            background-color: green;
            color: white;
            padding: 10px;
            border-radius: 5px;
            z-index: 9999;
        }

        input[type="radio"].btn-check:checked + label {
            border-color: black;
            border-width: 4px;
            border-style: dot-dot-dash;
            border-radius: 10%;
            line-height: 15px !important;
        }

    </style>
</head>
<body class="sb-nav-fixed sb-sidenav-toggled">
    <div id="notePopup" style="display: none; position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); background: white; border: 1px solid #ccc; border-radius: 10px; padding: 20px; z-index: 2000;">
    <textarea id="noteInput" style="width: 100%; height: 100px; margin-bottom: 10px;"></textarea>
    <div style="display: flex; justify-content: flex-end; gap: 10px;">
        <button id="cancelNote" style="padding: 5px 10px; background: #ccc; border: none; border-radius: 5px; cursor: pointer;">Annulla</button>
        <button id="saveNote" style="padding: 5px 10px; background: #007bff; color: white; border: none; border-radius: 5px; cursor: pointer;">Salva</button>
    </div>
</div>
<div id="overlay" style="display: none; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0, 0, 0, 0.5); z-index: 1999;"></div>
<div id="successMessage"></div>
<nav class="sb-topnav navbar navbar-expand navbar-dark bg-dark" style="justify-content: flex-start">
    <!-- Navbar Brand-->
    <a class="navbar-brand ps-3" href="index.php">Shoes Manager</a>
    <!-- Sidebar Toggle-->
    <button class="btn btn-link btn-sm order-1 order-lg-0 me-4 me-lg-0" id="sidebarToggle" href="#!"><i class="fas fa-bars"></i></button>
    <!-- Navbar Search-->
    <!--<form class="d-none d-md-inline-block form-inline ms-auto me-0 me-md-3 my-2 my-md-0">
        <div class="input-group">
            <input class="form-control" type="text" placeholder="Search for..." aria-label="Search for..." aria-describedby="btnNavbarSearch" />
            <button class="btn btn-primary" id="btnNavbarSearch" type="button"><i class="fas fa-search"></i></button>
        </div>
    </form>-->
    <!-- Navbar-->
    <ul class="navbar-nav ms-auto ms-md-0 me-3 me-lg-4">
        <li class="nav-item dropdown">
            <a class="nav-link dropdown-toggle" id="navbarDropdown" href="#" role="button" data-bs-toggle="dropdown" aria-expanded="false"><i class="fas fa-user fa-fw"></i></a>
            <ul class="dropdown-menu dropdown-menu-end" aria-labelledby="navbarDropdown">
                <li><a class="dropdown-item" href="#!">Settings</a></li>
                <!--<li><a class="dropdown-item" href="#!">Activity Log</a></li>-->
                <!--<li><hr class="dropdown-divider" /></li>-->
                <!--<li><a class="dropdown-item" href="#!">Logout</a></li>-->
            </ul>
        </li>
    </ul>
</nav>
<div id="layoutSidenav">
    <?php include 'includes/_sidebar.php'; ?>
    <div id="layoutSidenav_content">
        <main>
            <div class="container-fluid px-4">
                <h1 class="mt-4">Gestione Lavori</h1>
                <?php include 'includes/_navbar.php'; ?>

              <div class="row">
    <div class="col">
        <div class="card mb-4">
            <div class="card-header d-flex align-items-center justify-content-between">
                <div>
                    <i class="fa-solid fa-magnifying-glass me-1"></i>
                    Lavori Aperti
                </div>
                <div class="d-flex align-items-center">
    <!-- Label "I" con il valore dinamico -->
    <label for="infoI" class="me-2">I:</label>
    <span id="infoI" class="badge bg-primary me-3">0</span>

    <!-- Label "O" con il valore dinamico -->
    <label for="infoO" class="me-2">O:</label>
    <span id="infoO" class="badge bg-success me-3">0</span>

    <!--<input onchange="toggleAperti(this)" type="checkbox" role="switch" class="form-check-input" checked="checked" id="aperti_toggle">-->
    <button class="btn btn-primary ms-2" type="button" id="btnDuplica">Duplica</button>
</div>
            </div>
            <div class="card-body" id="lavoriApertiCB">
                <table id="dataTable1" class="display">
                    <thead>
                        <tr>
                            <th></th>
                            <th>C.C</th>
                            <th>N.B</th>
                            <th>ATTRIBUTI</th>
                            <th>CELL</th>
                            <th>G.T</th>
                            <th>S.</th>
                            <th>NOTE</th>
                            <th>DATA I.</th>
                        </tr>
                    </thead>
                    <tfoot>
                        <tr>
                            <th></th>
                            <th>C.C</th>
                            <th>N.B</th>
                            <th>ATTRIBUTI</th>
                            <th>CELL</th>
                            <th>G.T</th>
                            <th>S.</th>
                            <th>NOTE</th>
                            <th>DATA I.</th>
                        </tr>
                    </tfoot>
                    <tbody>
                    </tbody>
                </table>
            </div>
        </div>
    </div>
</div>
                
                <div id="labels_1" class="d-flex flex-row flex-nowrap justify-content-between my-5 text-center">

                    <div id="totali" style="width:15%; background-color: rgba(248,209,1,0.25) ; margin-left: 10px">

                    </div>
                    <div id="attesa" style="width:15%; background-color: rgba(255,114,0,0.25);">

                    </div>
                    <div id="chiusi" style="width:15%; background-color: rgba(25,255,0,0.50);">

                    </div>
                    <div id="differenzaac" style="width:15%; background-color: rgba(255,41,41,0.30)">

                    </div>
                    <div id="ritirati" style="width:15%; background-color: rgba(0,159,147,0.45);">

                    </div>
                    <div id="differenzacr" style="width:15%; background-color: rgba(133,0,125,0.25); margin-right:10px">

                    </div>
                </div>
                <div id="labels_2" class="d-flex flex-row flex-nowrap justify-content-between my-5 text-center">

                </div>
                <!--<div class="row">
                    <div class="col">
                        <div class="card mb-4">
                            <div class="card-header">
                                <i class="fa-solid fa-magnifying-glass me-1"></i>
                                Lavori chiusi -
                                <input type="radio" class="btn-check" name="ritirati" id="all" autocomplete="off" checked value="all">
                                <label class="btn btn-outline-success" for="all">Tutti</label>

                                <input type="radio" class="btn-check" name="ritirati" id="nonritirati" autocomplete="off" value="non">
                                <label class="btn btn-outline-danger" for="nonritirati">Non Ritirati</label>
                            </div>
                            <div class="card-body">
                                <table id="dataTable2" class="display">
                                    <thead>
                                    <tr>
                                        <th></th>
                                        <th>COD. CLIENTE</th>
                                        <th>NUM BIGLIETTO</th>
                                        <th>DATA INIZIO</th>
                                        <th>DATA FINE</th>
                                        <th>SCAFFALE</th>
                                        <th>RITIRATO</th>
                                        <th>NOTE</th>
                                        <th>TELEFONO</th>
                                        <th>DATA RITIRO</th>
                                        <th>GIORNI TRASCORSI</th>
                                    </tr>
                                    </thead>
                                    <tfoot>
                                    <tr>
                                        <th></th>
                                        <th>COD. CLIENTE</th>
                                        <th>NUM BIGLIETTO</th>
                                        <th>DATA INIZIO</th>
                                        <th>DATA FINE</th>
                                        <th>SCAFFALE</th>
                                        <th>RITIRATO</th>
                                        <th>NOTE</th>
                                        <th>TELEFONO</th>
                                        <th>DATA RITIRO</th>
                                        <th>GIORNI TRASCORSI</th>
                                    </tr>
                                    </tfoot>
                                    <tbody>
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>-->
            </div>
        </main>
        <footer class="py-4 bg-light mt-auto">
            <div class="container-fluid px-4">
                <div class="d-flex align-items-center justify-content-between small">
                    <div class="text-muted">Copyright &copy; Pit 2024</div>
                    <div>
                        <a href="#">Privacy Policy</a>
                        &middot;
                        <a href="#">Terms &amp; Conditions</a>
                    </div>
                </div>
            </div>
        </footer>
    </div>
</div>
<script src="https://cdn.jsdelivr.net/npm/bootstrap@5.2.3/dist/js/bootstrap.bundle.min.js" crossorigin="anonymous"></script>

<script src="https://code.jquery.com/jquery-3.7.1.js" crossorigin="anonymous"></script>
<script src="https://cdn.datatables.net/v/dt/jqc-1.12.4/dt-2.1.2/b-3.1.0/sl-2.0.3/datatables.min.js"></script>
<script src="js/luxon.js"></script>
<script src="js/datatables-simple-demo.js"></script>
<script src='js/autosize/autosize.js'></script>
<script src="js/lavori.js"></script>

</body>
</html>