<?php

$Switch = $_GET['switch']; // Some sites like Corsham St have ' - ' in the name

//$conn = mysqli_connect('localhost:3307','dataduct','davy15','ranmate-femto');
$conn = mysqli_connect('localhost:3306','dataduct','Brearly16','ranmate-femto');
if (!$conn) {
    die('Could not connect: ' . mysqli_error($conn));
}

$pos = strrchr($Switch,'-');
$floor = trim(substr($pos, 1));
$site = trim(substr( $Switch , 0 , strlen($Switch) - strlen($pos) ));

$sql = "select DISTINCT IP from OpenCellCM.Switch where site_name='" . $site . "' and name='" . $floor . "'"; // Concert Version
$result = $conn->query($sql);

if ($result->num_rows > 0) {
    // output data of each row, there should only be 1 row
    while($row = $result->fetch_assoc()) {
        $SwitchIp = $row["IP"];
    }
    //echo "Switch IP sql is " . $sql . "\n";    
    echo "$SwitchIp";    
    
} else {
    //echo "(No corresponding IP found) sql=" . $sql . "\n";    
    $pos = strchr($Switch,'-');
    $floor = trim(substr($pos, 1));
    $site = trim(substr( $Switch , 0 , strlen($Switch) - strlen($pos) ));

    $sql = "select DISTINCT IP from OpenCellCM.Switch where site_name='" . $site . "' and name='" . $floor . "'"; // Concert Version
    $result = $conn->query($sql);

    if ($result->num_rows > 0) {
        // output data of each row, there should only be 1 row
        while($row = $result->fetch_assoc()) {
            $SwitchIp = $row["IP"];
        }
        
        echo "$SwitchIp";    
        
    } else {
        echo "(No corresponding IP found for switch/floor) sql=" . $sql . "\n";        
    }

}


?>
