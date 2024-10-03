<!DOCTYPE html>
<html>
<head></head>
<body>

<?php
$MetricGroup = strtok($_GET['group'], "-");
//echo "<option value=\"". $MetricGroup . "\">" . $MetricGroup . "</option>";

$conn = mysqli_connect('localhost:3306','dataduct','Brearly16','metrics');
if (!$conn) {
    die('Could not connect: ' . mysqli_error($con));
}

if ($MetricGroup == 'DCN') {
    $sql = "Select DISTINCT Site, SiteRef from `ranmate-femto`.customer_config WHERE SwitchIP LIKE '10.%' ORDER BY Site";
} else if ($MetricGroup == 'Femto') {
    // $sql = "Select DISTINCT SwitchIP, Site, FloorNo, SiteRef from `ranmate-femto`.customer_config WHERE SwitchIP LIKE '10.%' ORDER BY Site, FloorNo";    // original and now old
     $sql = "Select DISTINCT SwitchIP, Site, SwitchLocation, SiteRef from `ranmate-femto`.customer_config WHERE SwitchIP LIKE '10.%' AND SwitchLocation != '' ORDER BY Site, SwitchLocation";

} 
$result = $conn->query($sql);

if ($result->num_rows > 0) {
    // output data of each row
    while($row = $result->fetch_assoc()) {
//        echo $row["Site"] . " - " . $row["SwitchLocation"] . " (" . $row["SwitchIP"] . ")\n";
        if ($MetricGroup == 'DCN') {
            $site = $row["Site"];
        } else if ($MetricGroup == 'Femto') {
            $site = $row["Site"] . " - " . $row["SwitchLocation"];
        }            
        echo "<option value=\"". $site . "\">" . $site . "</option>";
    }
} else {
    echo "<option disabled>(No " . $MetricGroup . " Sites)</option>";    
}
$conn->close();

?>
</body>
</html>
