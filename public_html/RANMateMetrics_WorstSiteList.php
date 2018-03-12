<?php
$NumDays = $_GET['days'];
$Param = explode("-", $_GET['group']);
$MetricGroup = $Param[0];
$Metric = $Param[1];
$m = $_GET['m']; // number of sites to retrieve
$n = $_GET['n'];

//$conn = mysqli_connect('localhost:3307','dataduct','davy15','metrics');
$conn = mysqli_connect('localhost:3306','dataduct','Brearly16','metrics');      // OpenCell live server
if (!$conn) {
    die('Could not connect: ' . mysqli_error($conn));
}

//if (($MetricGroup == 'Counter') || ($MetricGroup == 'Ping')) {
if ($MetricGroup == 'Ping') {
    $sql = "select site_name from ping where measurement_time >= NOW() - INTERVAL " . $NumDays . " DAY GROUP BY site_name order by SUM(" . $Metric . ") DESC LIMIT " . $n;
    //$sql = "select site_name from ping where measurement_time >= NOW() - INTERVAL " . $NumDays . " DAY GROUP BY site_name order by SUM(" . $Metric . ") DESC LIMIT 5";
} else {
    echo "Unexpected Metric Group " . $MetricGroup . "\n";
}
//echo "sql=$sql";
$result = $conn->query($sql);

$rowNum = 0;
if ($result->num_rows > 0) {
    // output data of each row
    while($row = $result->fetch_assoc()) {
        if ($rowNum > ($m - 2)) {
            echo $row["site_name"] . ",";
        }
        $rowNum++;
    }
} else {
    echo "(No worst sites available for metric " . $Metric . ", sql is " .$sql . ")";    
}
$conn->close();

?>