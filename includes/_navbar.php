<?php
$currentPage = basename($_SERVER['PHP_SELF']);

$menu = [
    'Home' => 'index.php',
    'Gestione Lavori' => 'lavori.php',
    'Whatsapp' => 'whatsapp.php'
];

?>

<nav class="navbar navbar-expand-lg bg-body-tertiary">
    <div class="container-fluid">
        <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNavAltMarkup" aria-controls="navbarNavAltMarkup" aria-expanded="false" aria-label="Toggle navigation">
            <span class="navbar-toggler-icon"></span>
        </button>
        <div class="collapse navbar-collapse" id="navbarNavAltMarkup">
            <div class="navbar-nav">
                <?php foreach($menu as $label => $link): ?>
                    <a class="nav-link <?php echo $currentPage === $link ? 'active' : '' ?>" href="<?php echo $link ?>"><?php echo $label ?></a>
                <?php endforeach; ?>

            </div>
        </div>
    </div>
</nav>
