<!DOCTYPE html>
<html>
<head></head>
<body>

<?php
//$conn = mysqli_connect('localhost:3307','dataduct','davy15','ranmate-femto');
$conn = mysqli_connect('localhost:3306','dataduct','Brearly16','ranmate-femto');
//$conn = mysqli_connect('185.171.220.1:3306','dataduct','Brearly16','ranmate-femto');      // OpenCell live server
if (!$conn) {
    die('Could not connect: ' . mysqli_error($conn));
}
        
//$sql = "Select DISTINCT customer_config.SwitchIP, customer_config.Site, customer_config.SwitchLocation, customer_config.SiteRef "
//        . "from `ranmate-femto`.customer_config, `ranmate-femto`.sites "
//        . "WHERE SwitchIP LIKE '10.%' AND SwitchLocation != '' AND CONCAT(customer_config.Site,'-',customer_config.SwitchLocation) = sites.site_id "
//        . "AND sites.effective_to > NOW() ORDER BY Site, SwitchLocation";
// //        . "AND sites.exclude='0' and sites.effective_to > NOW() ORDER BY Site, SwitchLocation";
//    $sql = "Select DISTINCT customer_config.SwitchIP, customer_config.Site, customer_config.SwitchLocation, customer_config.SiteRef "
//            . "from `ranmate-femto`.customer_config, `ranmate-femto`.sites "
//            . "WHERE SwitchIP LIKE '10.%' AND SwitchLocation != '' AND CONCAT(customer_config.Site,'-',customer_config.SwitchLocation) = sites.site_id "
//            . "AND sites.effective_to > NOW() ORDER BY Site, SwitchLocation";
//  //            . "AND sites.exclude='0' and sites.effective_to > NOW() ORDER BY Site, SwitchLocation";
    // added 19/7/18 to support virtual '+' switches
    $sql = "Select DISTINCT '', (SUBSTRING_INDEX(site_id, '-', 1)) AS 'Site', (SUBSTRING_INDEX(site_id, '-', -1)) AS 'SwitchLocation', '' from `ranmate-femto`.sites ORDER BY Site, SwitchLocation";

$result = $conn->query($sql);

$sites = "";

if ($result->num_rows > 0) {
    // output data of each row
    while($row = $result->fetch_assoc()) {
        //echo $row["Site"] . " - " . $row["SwitchLocation"] . " (" . $row["SwitchIP"] . ")\n";
        $site = $row["Site"] . " - " . $row["SwitchLocation"];
        // echo "<option value=\"". $site . "\">" . $site . "</option>";        
        $sites .= "<option value=\"" . $site . "\">" . $site . "</option>\n";
    }
    echo $sites;         // maybe 1 echo is more efficient - client side reports 30 - 50 milliseconds regardless of which approach is taken
} else {
    echo "<option disabled>(No Femto Sites)</option>";    
    //echo "(No Cells) sql=" . $sql;        
}
$conn->close();

?>
</body>
</html>
