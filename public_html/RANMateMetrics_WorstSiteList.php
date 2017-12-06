<?php
$NumDays = $_GET['days'];
$Param = explode("-", $_GET['group']);
$MetricGroup = $Param[0];
$Metric = $Param[1];

//$conn = mysqli_connect('localhost:3307','dataduct','davy15','metrics');
$conn = mysqli_connect('localhost:3306','dataduct','Brearly16','metrics');      // OpenCell live server
if (!$conn) {
    die('Could not connect: ' . mysqli_error($conn));
}

//if (($MetricGroup == 'Counter') || ($MetricGroup == 'Ping')) {
if ($MetricGroup == 'Ping') {
    //$sql = "select site_name from ping where measurement_time >= NOW() - INTERVAL 1 DAY GROUP BY site_name order by SUM(packet_loss) DESC LIMIT 5";
    $sql = "select site_name from ping where measurement_time >= NOW() - INTERVAL " . $NumDays . " DAY GROUP BY site_name order by SUM(" . $Metric . ") DESC LIMIT 5";
} else {
    echo "Unexpected Metric Group " . $MetricGroup . "\n";
}
//echo "sql=$sql";
$result = $conn->query($sql);

if ($result->num_rows > 0) {
    // output data of each row
    while($row = $result->fetch_assoc()) {
        echo $row["site_name"] . ",";
    }
} else {
    echo "(No worst sites available for metric " . $Metric . ")";    
}
$conn->close();

?>