<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8" />
    <meta http-equiv="X-UA-Compatible" content="IE=edge" />
    <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no" />
    <meta name="description" content="" />
    <meta name="author" content="" />
    <title>Gestione Whatsapp - ShoesManager</title>
    <link href="css/styles.css" rel="stylesheet" />
    <link href="css/datatable.css" rel="stylesheet" />
    <script src="https://use.fontawesome.com/releases/v6.3.0/js/all.js" crossorigin="anonymous"></script>
    <link rel="stylesheet" type="text/css" href="https://unpkg.com/trix@2.0.8/dist/trix.css">
    <script type="text/javascript" src="https://unpkg.com/trix@2.0.8/dist/trix.umd.min.js"></script>
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
            line-height: 15px !important;
        }

    </style>
</head>
<body class="sb-nav-fixed">
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
                <h1 class="mt-4">Gestione Whatsapp</h1>
                <?php include 'includes/_navbar.php'; ?>

                <div class="row">
                    <div class="col-7">
                        <div class="card mb-4">
                            <div class="card-header">
                                <i class="fa-solid fa-magnifying-glass me-1"></i>
                                Whatsapp -
                                <input type="radio" class="btn-check" name="ritirati" id="not" autocomplete="off" checked value="not">
                                <label class="btn btn-outline-success" for="not">Non Inviati</label>

                                <input type="radio" class="btn-check" name="ritirati" id="tutti" autocomplete="off" value="all">
                                <label class="btn btn-outline-danger" for="tutti">Tutti</label>
                            </div>
                            <div class="card-body">
                                <table id="dataTable2" class="display">
                                    <thead>
                                    <tr>
                                        <th></th>
                                        <th>C.C</th>
                                        <th>N.B</th>
                                        <th>CELL</th>
                                        <th>G.T</th>
                                        <th>S.L</th>
                                        <th>D.F</th>
                                        <th>D.I</th>
                                    </tr>
                                    </thead>
                                    <tfoot>
                                    <tr>
                                        <th></th>
                                        <th>C.C</th>
                                        <th>N.B</th>
                                        <th>CELL</th>
                                        <th>G.T</th>
                                        <th>S.L</th>
                                        <th>D.F</th>
                                        <th>D.I</th>
                                    </tr>
                                    </tfoot>
                                    <tbody>
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                    <div class="col-5">
                        <form id="whatsForm">
                            <input type="hidden" id="trx" name="whats">
                            <trix-editor input="trx"></trix-editor>
                            <div class="d-grid gap-2 col-6 mx-auto mt-4">
                                <button id="saveWhats" type="submit" class="btn btn-primary">Salva</button>
                            </div>
                        </form>
                        <!-- Spaziatura tra i form -->
                        <div class="mt-4"></div>
                        
                         <form id="whatsForm2">
                            <input type="hidden" id="trx2" name="whats2">
                            <trix-editor input="trx2"></trix-editor>
                            <div class="d-grid gap-2 col-6 mx-auto mt-4">
                                <button id="saveWhats2" type="submit" class="btn btn-primary">Salva</button>
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
    <!-- Modal -->
    <div class="modal fade" id="staticBackdrop" data-bs-backdrop="static" data-bs-keyboard="false" tabindex="-1" aria-labelledby="staticBackdropLabel" aria-hidden="true">
        <div class="modal-dialog">
            <div class="modal-content">
                <div class="modal-header">
                    <h1 class="modal-title fs-5" id="staticBackdropLabel">Hai inviato il messaggio?</h1>
                    <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                </div>
                <div class="modal-body">
                    <p id="corpoModale">Sei sicuro di aver inviato questo messaggio? <br> </p>
                </div>
                <div class="modal-footer">
                    <div style="margin-right: auto;">
        <!-- Pulsanti a sinistra -->
        <button type="button" class="btn btn-secondary" id="copiaNumero">Copia numero</button>
        <button type="button" class="btn btn-secondary" id="copiaMessaggio">Copia messaggio</button>
    </div>
                    <!--<button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>-->
                    <button onclick="insertWhatsapp(this)" type="button" class="btn btn-primary" id="inviato" data-bs-dismiss="modal">Inviato!!!</button>
                </div>
            </div>
        </div>
    </div>
</div>
<script src="https://cdn.jsdelivr.net/npm/bootstrap@5.2.3/dist/js/bootstrap.bundle.min.js" crossorigin="anonymous"></script>

<script src="https://code.jquery.com/jquery-3.7.1.js" crossorigin="anonymous"></script>
<script src="https://cdn.datatables.net/v/dt/jqc-1.12.4/dt-2.1.2/b-3.1.0/sl-2.0.3/datatables.min.js"></script>
<script src="js/datatables-simple-demo.js"></script>
<script src='js/autosize/autosize.js'></script>
<script src="js/whats.js"></script>

</body>
</html>