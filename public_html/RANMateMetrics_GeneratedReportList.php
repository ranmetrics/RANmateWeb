<!DOCTYPE html>
<html>
<head></head>
<body>

<?php
$SiteOrCustomer = $_GET['site'];
$Type = $_GET['type'];
//echo "<option value=\"". $MetricGroup . "\">" . $MetricGroup . "</option>";

//$conn = mysqli_connect('localhost:3307','dataduct','davy15','metrics');
$conn = mysqli_connect('localhost:3306','dataduct','Brearly16','metrics');      // OpenCell live server
if (!$conn) {
    die('Could not connect: ' . mysqli_error($con));
}

//$sql = "Select DISTINCT interface from `ranmate-femto`.customer_config, `metrics`.router_counters "
//        . "WHERE customer_config.Site='" . $Site . "' and customer_config.RouterIp=router_counters.public_site_id";
$sql = "Select period from metrics.generated_reports WHERE period != '' and subject='" . $Type . "' and name='" . $SiteOrCustomer . "' ORDER BY period DESC";
//echo "$sql";
$result = $conn->query($sql);

if ($result->num_rows > 0) {
    // output data of each row
    while($row = $result->fetch_assoc()) {
        $period = $row["period"];
        echo "<option value=\"". $SiteOrCustomer . ' ' . substr($period, 0, 6) . "\">" . $period . "</option>";
    }
} else {
    echo "<option disabled>(No " . $Site . " reports)</option>";    
}
$conn->close();

?>
</body>
</html>
