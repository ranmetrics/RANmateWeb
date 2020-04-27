<!DOCTYPE html>
<html>
<head></head>
<body>

<?php
$MetricGroup = strtok($_GET['group'], "-");
$granularity = $_GET['granularity']; // on
//echo "<option value=\"". $MetricGroup . "\">" . $MetricGroup . "</option>";

//$conn = mysqli_connect('localhost:3307','dataduct','davy15','metrics');
$conn = mysqli_connect('localhost:3306','dataduct','Brearly16','metrics');      // OpenCell live server
if (!$conn) {
    die('Could not connect: ' . mysqli_error($conn));
}

//if (($MetricGroup == 'Counter') || ($MetricGroup == 'Ping')) {
if ($MetricGroup == 'Counter') {
    $sql = "Select DISTINCT site_name from metrics.router_counters_sites ORDER BY site_name";
    //$sql = "Select DISTINCT Site from `ranmate-femto`.customer_config WHERE SwitchIP LIKE '10.%' ORDER BY Site";
} else if ($MetricGroup == 'Ping') {
    $sql = "Select ' Worst m..n Sites (last 24 hours)' as 'site_name' from metrics.router_counters_sites union "
            . "Select ' Worst m..n Sites (last 7 days)' as 'site_name' from metrics.router_counters_sites union "
            . "Select DISTINCT site_name from metrics.router_counters_sites ORDER BY site_name";
} else if ($MetricGroup == 'Buddy') {
    $sql = "Select DISTINCT site_name from metrics.buddy where NOT exclude ORDER BY site_name";
} else if (($MetricGroup == 'Femto') || ($MetricGroup == 'FemtoCounter') || ($MetricGroup == 'FemtoKPI')) {
     // $sql = "Select DISTINCT SwitchIP, Site, SwitchLocation, SiteRef from `ranmate-femto`.customer_config WHERE SwitchIP LIKE '10.%' AND SwitchLocation != '' ORDER BY Site, SwitchLocation";
//    $sql = "Select DISTINCT customer_config.SwitchIP, customer_config.Site, customer_config.SwitchLocation, customer_config.SiteRef "
//            . "from `ranmate-femto`.customer_config, `ranmate-femto`.sites "
//            . "WHERE SwitchIP LIKE '10.%' AND SwitchLocation != '' AND CONCAT(customer_config.Site,'-',customer_config.SwitchLocation) = sites.site_id "
//            . "AND sites.effective_to > NOW() ORDER BY Site, SwitchLocation";
//  //            . "AND sites.exclude='0' and sites.effective_to > NOW() ORDER BY Site, SwitchLocation";
    // added 19/7/18 to support virtual '+' switches
    if ($granularity == 'PerSite') {
        $sql = "Select DISTINCT (SUBSTRING_INDEX(site_id, '-', 1)) AS 'Site' from `ranmate-femto`.sites ORDER BY Site";        
    } else { // either PerFemto/PerSwitch or Femto packet/Poe
        $sql = "Select DISTINCT '', (SUBSTRING_INDEX(site_id, '-', 1)) AS 'Site', (SUBSTRING_INDEX(site_id, '-', -1)) AS 'SwitchLocation', '' from `ranmate-femto`.sites ORDER BY Site, SwitchLocation";               
    }
} else if ($MetricGroup == 'Mixed') {
    $sql = "Select DISTINCT router_counters_sites.site_name from metrics.router_counters_sites INNER JOIN metrics.buddy ON "
            . "router_counters_sites.site_name = buddy.site_name where NOT exclude ORDER BY router_counters_sites.site_name";
} else if (($MetricGroup == 'Traffic') || ($MetricGroup == 'Calls')) {
//    $sql = "Select ' All Sites' as 'site_name' from metrics.jflow_sites union "
//            . "Select DISTINCT site_name from metrics.jflow_sites ORDER BY site_name";
    $sql = "Select ' All Sites' as 'site_name' from metrics.routers union "
            . "Select DISTINCT site_name from metrics.routers ORDER BY site_name";
} else if ($MetricGroup == 'Reports') {
    //$sql = "SELECT CONCAT('(Customer) ', customer) as 'site_name' FROM OpenCellCM.Site GROUP BY customer HAVING count(*) > 1 union "
    //        . "Select DISTINCT site_name from metrics.routers ORDER BY site_name";
    // Every time a fixed period report is generated, it's stored in the metrics.generated_reports table
    $sql = "SELECT DISTINCT ' (MNO) Three' as 'site_name', '' union "
            . "SELECT DISTINCT CONCAT('(Customer) ', name) as 'site_name', customer FROM metrics.generated_reports where subject = 2 and name != 'Test' union "
            . "SELECT DISTINCT name as 'site_name', customer FROM metrics.generated_reports where subject = 1 ORDER BY site_name";
} else {
    echo "Unexpected Metric Group " . $MetricGroup . "\n";
}
//echo "sql=$sql";
$result = $conn->query($sql);

if ($result->num_rows > 0) {
    // output data of each row
    while($row = $result->fetch_assoc()) {
//        echo $row["Site"] . " - " . $row["SwitchLocation"] . " (" . $row["SwitchIP"] . ")\n";
        if (($MetricGroup == 'Counter') || ($MetricGroup == 'Buddy') || ($MetricGroup == 'Ping') || ($MetricGroup == 'Mixed') || ($MetricGroup == 'Traffic') || ($MetricGroup == 'Calls')) {
            $site = $row["site_name"];
            echo "<option value=\"". $site . "\">" . $site . "</option>";
        } else if ($MetricGroup == 'Reports') {
            $site = trim($row["site_name"]);
            $customer = $row["customer"];
            echo "<option value=\"". $customer . " " . $site . "\">" . $site . "</option>";
        } else if (($MetricGroup == 'Femto') || ($MetricGroup == 'FemtoCounter') || ($MetricGroup == 'FemtoKPI')) {
            if ($granularity == 'PerSite') {
                $site = $row["Site"];
            } else {
                $site = $row["Site"] . " - " . $row["SwitchLocation"];                
            }
            echo "<option value=\"". $site . "\">" . $site . "</option>";
        }            
    }
} else {
    echo "<option disabled>(No " . $MetricGroup . " Sites)</option>";    
}
$conn->close();

?>
</body>
</html>
