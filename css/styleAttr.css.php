<?php
global $conn;

$sql = 'SELECT * FROM attributi';
$attributi = $conn->query($sql)->fetch_all(MYSQLI_ASSOC);

foreach ($attributi as $key => $attributo) {

    if($attributo['colore'] == 'ffffff'){
        echo "#attrSearch_". $attributo['id'] .":checked ~ label[for='attrSearch_". $attributo['id'] ."']";
        echo "{ border: 2px solid black;";
        echo "}";
    }else{
    echo "#attrSearch_". $attributo['id'] .":checked ~ label[for='attrSearch_". $attributo['id'] ."']";
    echo "{ background: #". $attributo['colore'] .";";
    echo "color: #fff; }";
    }


}
