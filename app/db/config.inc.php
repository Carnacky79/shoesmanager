<?php
if($_SERVER['SERVER_NAME'] == 'calzolaio.local.com'){
    define("DB_HOST", 'localhost');
    define("DB_NAME", 'calzolaio');
    define("DB_USER", 'root');
    define("DB_PASSWORD", 'password');
}else{
    define("DB_HOST", 'sql.eggwebnapoli.it');
    define("DB_NAME", 'eggwebna45669');
    define("DB_USER", 'eggwebna45669');
    define("DB_PASSWORD", 'eggw28710');
}
