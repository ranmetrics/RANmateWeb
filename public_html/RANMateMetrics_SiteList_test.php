<!DOCTYPE html>
<html>
<head></head>
<body>

<?php
$MetricGroup = strtok($_GET['group'], "-");
//echo "<option value=\"". $MetricGroup . "\">" . $MetricGroup . "</option>";

//$conn = mysqli_connect('localhost:3307','dataduct','davy15','metrics');
$conn = mysqli_connect('localhost:3306','dataduct','Brearly16','metrics');      // OpenCell live server
if (!$conn) {
    die('Could not connect: ' . mysqli_error($conn));
}

if (($MetricGroup == 'Counter') || ($MetricGroup == 'Ping')) {
    $sql = "Select DISTINCT site_name from metrics.router_counters_sites ORDER BY site_name";
    //$sql = "Select DISTINCT Site from `ranmate-femto`.customer_config WHERE SwitchIP LIKE '10.%' ORDER BY Site";
} else if ($MetricGroup == 'Buddy') {
    $sql = "Select DISTINCT site_name from metrics.buddy where NOT exclude ORDER BY site_name";
} else if ($MetricGroup == 'Femto') {
     // $sql = "Select DISTINCT SwitchIP, Site, SwitchLocation, SiteRef from `ranmate-femto`.customer_config WHERE SwitchIP LIKE '10.%' AND SwitchLocation != '' ORDER BY Site, SwitchLocation";
//    $sql = "Select DISTINCT customer_config.SwitchIP, customer_config.Site, customer_config.SwitchLocation, customer_config.SiteRef "
//            . "from `ranmate-femto`.customer_config, `ranmate-femto`.sites "
//            . "WHERE SwitchIP LIKE '10.%' AND SwitchLocation != '' AND CONCAT(customer_config.Site,'-',customer_config.SwitchLocation) = sites.site_id "
//            . "AND sites.effective_to > NOW() ORDER BY Site, SwitchLocation";
//  //            . "AND sites.exclude='0' and sites.effective_to > NOW() ORDER BY Site, SwitchLocation";
    $sql = "Select DISTINCT '', (SUBSTRING_INDEX(site_id, '-', 1)) AS 'Site', (SUBSTRING_INDEX(site_id, '-', -1)) AS 'SwitchLocation', '' from `ranmate-femto`.sites ORDER BY Site, SwitchLocation";
} else if ($MetricGroup == 'Mixed') {
    $sql = "Select DISTINCT router_counters_sites.site_name from metrics.router_counters_sites INNER JOIN metrics.buddy ON "
            . "router_counters_sites.site_name = buddy.site_name where NOT exclude ORDER BY router_counters_sites.site_name";
} else {
    echo "Unexpected Metric Group " . $MetricGroup . "\n";
}
//echo "sql=$sql";
$result = $conn->query($sql);

if ($result->num_rows > 0) {
    // output data of each row
    while($row = $result->fetch_assoc()) {
//        echo $row["Site"] . " - " . $row["SwitchLocation"] . " (" . $row["SwitchIP"] . ")\n";
        if (($MetricGroup == 'Counter') || ($MetricGroup == 'Buddy') || ($MetricGroup == 'Ping') || ($MetricGroup == 'Mixed')) {
            $site = $row["site_name"];
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
