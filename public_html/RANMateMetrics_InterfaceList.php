<!DOCTYPE html>
<html>
<head></head>
<body>

<?php
$Site = $_GET['site'];
//echo "<option value=\"". $MetricGroup . "\">" . $MetricGroup . "</option>";

//$conn = mysqli_connect('localhost:3307','dataduct','davy15','metrics');
$conn = mysqli_connect('localhost:3306','dataduct','Brearly16','metrics');      // OpenCell live server
if (!$conn) {
    die('Could not connect: ' . mysqli_error($con));
}

$sql = "Select DISTINCT interface from `ranmate-femto`.customer_config, `metrics`.router_counters "
        . "WHERE customer_config.Site='" . $Site . "' and customer_config.RouterIp=router_counters.public_site_id";
$result = $conn->query($sql);

if ($result->num_rows > 0) {
    // output data of each row
    while($row = $result->fetch_assoc()) {
        $iface = $row["interface"];
        echo "<option value=\"". $iface . "\">" . $iface . "</option>";
    }
} else {
    echo "<option disabled>(No " . $Site . " interfaces)</option>";    
}
$conn->close();

?>
</body>
</html>
