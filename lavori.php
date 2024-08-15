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
        }

    </style>
</head>
<body class="sb-nav-fixed">
<div id="successMessage"></div>
<nav class="sb-topnav navbar navbar-expand navbar-dark bg-dark" style="justify-content: flex-end">
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
    <div id="layoutSidenav_nav">
        <nav class="sb-sidenav accordion sb-sidenav-dark" id="sidenavAccordion">
            <div class="sb-sidenav-menu">
                <div class="nav">
                    <div class="sb-sidenav-menu-heading">Principale</div>
                    <a class="nav-link" href="index.php">
                        <div class="sb-nav-link-icon"><i class="fas fa-tachometer-alt"></i></div>
                        Dashboard
                    </a>
                    <div class="sb-sidenav-menu-heading">Gestione</div>
                    <a class="nav-link" href="anagrafica.php">
                        <div class="sb-nav-link-icon"><i class="fas fa-users"></i></div>
                        Anagrafica Clienti
                    </a>

                    <a class="nav-link" href="lavori.php">
                        <div class="sb-nav-link-icon"><i class="fa-solid fa-shoe-prints"></i></div>
                        Lavori
                    </a>

                    <div class="sb-sidenav-menu-heading">Configurazione</div>
                    <a class="nav-link" href="charts.html">
                        <div class="sb-nav-link-icon"><i class="fas fa-chart-area"></i></div>
                        Stato Lavori
                    </a>
                    <a class="nav-link" href="tables.html">
                        <div class="sb-nav-link-icon"><i class="fas fa-table"></i></div>
                        Note Ordini
                    </a>
                    <a class="nav-link" href="tables.html">
                        <div class="sb-nav-link-icon"><i class="fas fa-table"></i></div>
                        Messaggio Whatsapp
                    </a>
                </div>
            </div>
        </nav>
    </div>
    <div id="layoutSidenav_content">
        <main>
            <div class="container-fluid px-4">
                <h1 class="mt-4">Gestione Lavori</h1>
                <ol class="breadcrumb mb-4">
                    <li class="breadcrumb-item"><a href="index.php">Principale</a></li>
                    <li class="breadcrumb-item active">Gestione Lavori</li>
                </ol>

                <div class="row">
                    <div class="col">
                        <div class="card mb-4">
                            <div class="card-header">
                                <i class="fa-solid fa-magnifying-glass me-1"></i>
                                Lavori Aperti
                            </div>
                            <div class="card-body">
                                <table id="dataTable1" class="display">
                                    <thead>
                                    <tr>
                                        <th></th>
                                        <th>C.C</th>
                                        <th>N.B</th>
                                        <th>ATTRIBUTI</th>
                                        <th>CELL</th>
                                        <th>G.T</th>
                                        <th>S.L</th>
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
                                        <th>S.L</th>
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
                <div class="row">
                    <div class="col-md-6"></div>
                    <div class="col-md-6"></div>
                </div>
                <div class="row">
                    <div class="col">
                        <div class="card mb-4">
                            <div class="card-header">
                                <i class="fa-solid fa-magnifying-glass me-1"></i>
                                Lavori chiusi
                            </div>
                            <div class="card-body">
                                <table id="dataTable2" class="display">
                                    <thead>
                                    <tr>
                                        <th>COD. CLIENTE</th>
                                        <th>NUM BIGLIETTO</th>
                                        <th>DATA INIZIO</th>
                                        <th>DATA FINE</th>
                                        <th>SCAFFALE</th>
                                        <th>RITIRATO</th>
                                        <th>STATO LAVORO</th>
                                        <th>NOTE</th>
                                        <th>TELEFONO</th>
                                        <th>DATA RITIRO</th>
                                        <th>GIORNI TRASCORSI</th>
                                    </tr>
                                    </thead>
                                    <tfoot>
                                    <tr>
                                        <th>COD. CLIENTE</th>
                                        <th>NUM BIGLIETTO</th>
                                        <th>DATA INIZIO</th>
                                        <th>DATA FINE</th>
                                        <th>SCAFFALE</th>
                                        <th>RITIRATO</th>
                                        <th>STATO LAVORO</th>
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
                </div>
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
<script src="js/datatables-simple-demo.js"></script>
<script src="js/lavori.js"></script>
</body>
</html>

