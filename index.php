<!DOCTYPE html>
<html lang="en">
    <head>
        <meta charset="utf-8" />
        <meta http-equiv="X-UA-Compatible" content="IE=edge" />
        <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no" />
        <meta name="description" content="" />
        <meta name="author" content="" />
        <title>Dashboard - ShoesManager</title>
        <link href="https://cdn.jsdelivr.net/npm/simple-datatables@7.1.2/dist/style.min.css" rel="stylesheet" />
        <link href="css/styles.css" rel="stylesheet" />
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
        </style>
    </head>
    <body class="sb-nav-fixed">
    <div id="successMessage">Inserimento avvenuto con successo!</div>
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
                            <a class="nav-link" href="index.html">
                                <div class="sb-nav-link-icon"><i class="fas fa-tachometer-alt"></i></div>
                                Dashboard
                            </a>
                            <div class="sb-sidenav-menu-heading">Gestione</div>
                            <a class="nav-link" href="anagrafica.php" >
                                <div class="sb-nav-link-icon"><i class="fas fa-users"></i></div>
                                Anagrafica Clienti
                            </a>

                            <a class="nav-link" href="#" data-bs-toggle="collapse" data-bs-target="#collapsePages" aria-expanded="false" aria-controls="collapsePages">
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
                        <h1 class="mt-4">Gestione Principale</h1>
                        <ol class="breadcrumb mb-4">
                            <li class="breadcrumb-item active">Home</li>
                        </ol>

                        <div class="row">
                            <div class="col-xl-6">
                                <div class="card mb-4">
                                    <div class="card-header">
                                        <i class="fa-solid fa-magnifying-glass me-1"></i>
                                        Ricerca Clienti
                                    </div>
                                    <div class="card-body">
                                        <form id="formRicerca">
                                            <div class="form-group mb-4">
                                                <label for="numero" class="mb-2">Ricerca per numero telefonico</label>
                                                <input class="form-control" id="numero" name="numero"
                                                       type="text" placeholder="Inserisci il numero di telefono" />
                                            </div>
                                            <div class="form-group mb-4">
                                                <label for="cod_cliente" class="mb-2">Ricerca per codice cliente</label>
                                                <input class="form-control" id="cod_cliente" name="cod_cliente"
                                                       type="text" placeholder="Inserisci il codice del cliente" />
                                            </div>
                                            <div class="form-group mb-4">
                                                <button class="btn btn-primary" type="button" id="btnRicerca">Cerca</button>
                                            </div>
                                        </form>
                                    </div>
                                </div>
                            </div>
                            <div class="col-xl-6">
                                <div class="card mb-4">
                                    <div class="card-header">
                                        <i class="fas fa-user me-1"></i>
                                        Risultati Ricerca
                                    </div>
                                    <div class="card-body" id="risultato_ricerca">

                                    </div>
                                </div>
                            </div>
                        </div>
                        <div class="card mb-4  col-8 offset-2">
                            <div class="card-header">
                                <i class="fa-solid fa-shoe-prints me-1"></i>
                                Inserimento Lavoro
                            </div>
                            <div class="card-body">
                                <form id="formLavoroIns">
                                    <div class="row">
                                        <div class="form-group mb-4 col-md-6">
                                            <label for="num_cliente" class="mb-2">Codice Cliente</label>
                                            <input class="form-control" id="num_cliente" name="num_cliente"
                                                   type="text" placeholder="Inserisci il Codice Cliente" />
                                        </div>
                                        <div class="form-group mb-4 col-md-6">
                                            <label for="num_biglietto" class="mb-2">Bigliettino</label>
                                            <input class="form-control" id="num_biglietto" name="num_biglietto"
                                                   type="text" placeholder="Inserisci il numero del bigliettino" />
                                        </div>
                                    </div>
                                    <div class="row">
                                        <div class="form-group mb-4 col-md-6">
                                            <label for="stato_lavoro" class="mb-2">Stato Lavoro</label>
                                            <select class="form-select" id="stato_lavoro" name="stato_lavoro">
                                                <option selected value="0"></option>
                                                <option value="1">In Attesa di Pagamento</option>
                                                <option value="2">Pagata</option>
                                                <option value="3">Spedita</option>
                                            </select>
                                        </div>
                                        <div class="form-group mb-4 col-md-6">
                                            <label for="note_ordine" class="mb-2">Note</label>
                                            <textarea class="form-control" id="note_ordine" name="note_ordine"
                                                      placeholder="Inserisci le note relative all'ordine"></textarea>
                                        </div>
                                    </div>
                                    <div class="form-group mb-4">
                                        <button class="btn btn-primary" type="submit">Inserisci</button>
                                    </div>
                                </form>
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
        <script src="js/scripts.js"></script>
    </body>
</html>
