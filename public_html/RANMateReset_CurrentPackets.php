<?php
$switch = str_replace(" - ", "-", $_GET['switch']);
$cell = $_GET['cell'];
//$switch = 'Bishopsgate-Floor 2'; // for testing
//$cell = 0; // for testing

$conn = mysqli_connect('localhost:3307','dataduct','davy15','ranmate-femto');
//$conn = mysqli_connect('localhost:3306','dataduct','Brearly16','ranmate-femto');
if (!$conn) {
    die('Could not connect: ' . mysqli_error($conn));
}

// for live
$sql = "select cell_" . $cell . " from metrics.packets, customer_config where packets.measurement_time > DATE_SUB(NOW(), INTERVAL 15 MINUTE) "
// for local testing
// $sql = "select cell_" . $cell . " from metrics.packets, customer_config where packets.measurement_time > '2016-11-10 11:20:00' "        
        . "and packets.site_id=customer_config.SwitchIP "
        . "AND CONCAT(customer_config.Site,'-',customer_config.SwitchLocation) = '" . $switch 
        . "' ORDER BY packets.measurement_time DESC LIMIT 1"; 
$result = $conn->query($sql);

if ($result->num_rows > 0) {
    // output data of each row, there should only be 1 row
    while($row = $result->fetch_assoc()) {
        echo $row["cell_" . $cell];
    }
} else {
    echo "(No Packet Measurement) sql=" . $sql;    
}
    
$conn->close();

?>
