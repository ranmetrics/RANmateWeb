
<?php
$sql = $_GET['query'];
//echo "<option value=\"". $MetricGroup . "\">" . $MetricGroup . "</option>";

//$conn = mysqli_connect('localhost:3307','dataduct','davy15','metrics');
$conn = mysqli_connect('localhost:3306','dataduct','Brearly16','metrics');      // OpenCell live server
if (!$conn) {
    die('Could not connect: ' . mysqli_error($con));
}

$metrics_end = strpos($sql, ' FROM ');
$tok = strtok(substr($sql, 7, ($metrics_end - 7)), ",");
$metric_names = array();

//burn off the measurement_time part which will always be first
$tok = strtok(",");
while ($tok !== false) {
    $metricIncAlias = trim($tok);   
    if (strpos($metricIncAlias, ' AS ') !== false) {
        $metric = substr($metricIncAlias, strpos($metricIncAlias, ' AS ') + 4);
    } else {
        $metric = $metricIncAlias;
    }
//    echo "Metric=$metric<br />";
    $metric_names[] = $metric; 
    $tok = strtok(",");
}

$result = $conn->query($sql);
$response = array();

if ($result->num_rows > 0) {
    // output data of each row
    while($row = $result->fetch_assoc()) {
        $dcn = array(
            'time' => $row['measurement_time'],
//            'cell_x' => $row['VF_1'],
//            'input_bytes' => $row['input_bytes']
        );
        
        foreach ($metric_names as &$metric) {
            $dcn[$metric] = $row[$metric];
        }        
        
        // push the final array onto the returning array
        array_push($response, $dcn);
    }

    $responseString = json_encode($response);
//    echo strlen($responseString);        
    echo $responseString;        
    
//        $response[] = $row;
//        $iface = $row["interface"];
//        echo "<option value=\"". $iface . "\">" . $iface . "</option>";
//    }
//    $jsonData = json_encode($response);     
} else {
    echo "<data>(No data available for query: \"$sql\")</data>";    
}
$conn->close();

?>
