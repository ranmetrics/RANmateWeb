<?php
$sql = $_GET['query'];
$metrictype = $_GET['metrictype'];

//echo "<option value=\"". $MetricGroup . "\">" . $MetricGroup . "</option>";

//$conn = mysqli_connect('localhost:3307','dataduct','davy15','metrics');
$conn = mysqli_connect('localhost:3306','dataduct','Brearly16','metrics');      // OpenCell live server
if (!$conn) {
    die('Could not connect: ' . mysqli_error($con));
}
$export_file = fopen("data/RANmate_Export.csv", "w") or die("Unable to open file!");

// The Traffic SQL has a number of SQL statements in the same request, separated by ;\n
// The first statements populate temporary tables, only the final statement gathers the metrics
if (($metrictype === "Traffic") || ($metrictype === "Calls")) {
    $metrics_sql = substr($sql, strrpos($sql, "SELECT"));
} else {
    $metrics_sql = $sql;    
}

if (substr($metrics_sql, 0, 13) === "SELECT * FROM") { 
    // complex queries involving pivots and UNIONs are wrapped in a SELECT * FROM (..query here ...) ORDER BY measurement_time
    $metrics_end = strpos($metrics_sql, ' FROM ', 13);    
} else {
    $metrics_end = strpos($metrics_sql, ' FROM ');
}
if ($metrictype === "Traffic") {
    $tok = strtok(substr($metrics_sql, 7, ($metrics_end - 7)), ", ");    
} else {
    $tok = strtok(substr($metrics_sql, 7, ($metrics_end - 7)), ",");
}
$metric_names = array();

//burn off the measurement_time part which will always be first
$tok = strtok(",");    

// if it's a Femto PM single metric to multiple sites that's being pivoted we can't token on a single string since
// that's included in the SQL CONCAT(,,) function and breaks the logic
if ($metrictype === "FemtoRCA") {
    $metric_names[] = "Switch";
    $metric_names[] = "Port";
    $metric_names[] = "Location";
    $metric_names[] = "IMEI";
    $metric_names[] = "RATE";    
} elseif ($metrictype === "FemtoRCADetails") {
    $metric_names[] = "IMEI";
    $metric_names[] = "RATE";    
} else if ((strpos($sql, ' CONCAT(') !== false) && (strpos($sql, ' ROUND(') !== false)) {
    //$pieces = preg_split("/, /", substr($sql, 0, strpos($sql, ' FROM ')));
    $from_index = strpos($sql, ' FROM ');
    $sql_substr = substr($sql, 0, $from_index);
    $pieces = preg_split("/, /", $sql_substr);
    foreach($pieces as $metricIncAlias) {
//        fwrite($export_file, "metricIncAlias=" . $metricIncAlias . "\n");
        if (strpos($metricIncAlias, 'ROUND(') !== false) {
            if (strpos($metricIncAlias, ' AS ') !== false) {
                $metric = substr($metricIncAlias, strpos($metricIncAlias, ' AS ') + 4);
            } else {
                if ((strpos($metricIncAlias, 'COALESCE') === false) && (strpos($metricIncAlias, 'measurement_time') === false)) {
                    $metric = $metricIncAlias;
                }
            }
          if (strlen($metric) > 0) {
            $metric_names[] = $metric; 
          }
        } 
    }    
} else { // for all the existing metrics that were being processed ok
    //echo "Sanity check " . substr($sql, 7, ($metrics_end - 7));
    while ($tok !== false) {
        //echo "TOK IS " . $tok;
        $metricIncAlias = trim($tok);   
        if (strpos($metricIncAlias, 'ROUND(') === false) { // this should be !== false, but the end result is correct for some reason
            //echo "PHP Non-Traffic Metric detected " . $tok;        
            if (strpos($metricIncAlias, ' AS ') !== false) {
                //echo "Pos a";
                $metric = substr($metricIncAlias, strpos($metricIncAlias, ' AS ') + 4);
            } else {
                //echo "Pos b";
                if ((strpos($metricIncAlias, 'COALESCE') === false) && (strpos($metricIncAlias, 'measurement_time') === false)) {
                    if (substr($metricIncAlias, -1) != ')') { // probably a MNO-KPI metric
                        $metric = $metricIncAlias;
                    }
                }
            }
          //echo "Metric=" . $metric;
          if (strlen($metric) > 0) {
            $metric_names[] = $metric; 
          }
        } 
        // rubbish, don't know what I was thinking
        /* else if (($metrictype === "Traffic") && (strpos($metricIncAlias, ' AS ') !== false)) {
            //echo "PHP Traffic Metric detected ";        
            $metric = substr($metricIncAlias, strpos($metricIncAlias, ' AS ') + 4);
            //echo "PHP parsed Metric is " . $metric;        
        } else {
            echo "Fupping nothing detected ";                
        } */
        $tok = strtok(",");    
    }
}

//echo "Metric Names are " . $metric_names[];

$queryTok = strtok($sql, ";\n");
// echo "Refined SQL Query is " . $queryTok;
$prevTok;
$prevPrevTok;


while ($queryTok !== false) {
    fwrite($export_file, $queryTok . "\n");
    $result = $conn->query($queryTok);
//    $prevPrevTok = $queryTok;
    $prevTok = $queryTok;
    $queryTok = strtok(";\n");
}

//$result = $conn->query($sql);
$response = array();

// write the csv file header
if (($metrictype === "FemtoRCA")) {
    // $csv_string = "measurement_time";

} else { // might need to specialise this per metric type later
    $csv_string = "measurement_time";
}
foreach ($metric_names as &$value) {
    $csv_string = $csv_string . "," . $value;
} 
fwrite($export_file, $csv_string . "\n");
unset($value);

if ($result->num_rows > 0) {
    // output data of each row
    while($row = $result->fetch_assoc()) {
        if ($metrictype === "Traffic" || $metrictype === "FemtoRCADetails") {
            // Demo version used to just show the date part of the measurement time in a col named 'Date'
            // select DATE(measurement_time) AS Date
            // $dcn = array('time' => $row['Date']);
            // Delivered version will use the end of the measurement interval range as the measurement_time.
            // Can consolodate with the above if now probs later 
            $dcn = array('time' => $row['measurement_time']);
        } else if ($metrictype === "FemtoRCA") {
            $dcn = array('Switch' => $row['Switch']);
//        } else if ($metrictype === "FemtoRCADetails") {
//            $dcn = array('Switch' => $row['Switch']);
        } else {
            $dcn = array(
                'time' => $row['measurement_time'],
    //            'cell_x' => $row['VF_1'],
    //            'input_bytes' => $row['input_bytes']
            );
        }
        
        foreach ($metric_names as &$metric) {
            $csv_string = "";
            //$log = $log . ", metric=" . $metric;
            //$dcn[$metric] = $row[$metric];
            $dcn[str_replace("'", "", str_replace("`", "", $metric))] = $row[str_replace("'", "", str_replace("`", "", $metric))];
            //echo "PHP: dcn " . $metric . " entry is " . $row[str_replace("'", "", str_replace("`", "", $metric))];
            //fwrite($export_file, str_replace("'", "", str_replace("`", "", $metric))); // this file will be downloaded if someone clicks the 'Export' button
            foreach ($dcn as &$value) {
                $csv_string = $csv_string . $value . ",";
            } 
            unset($value);
        } 
        // push the final array onto the returning array
        array_push($response, $dcn);
        fwrite($export_file, rtrim($csv_string, ",") . "\n");
    }
    
    $responseString = json_encode($response);
    fwrite($export_file, $responseString); // this file will be downloaded if someone clicks the 'Export' button
//    echo strlen($responseString);        
      echo $responseString;        // commented out for testing UNCOMMENT
    //echo $log;        
    
//        $response[] = $row;
//        $iface = $row["interface"];
//        echo "<option value=\"". $iface . "\">" . $iface . "</option>";
//    }
//    $jsonData = json_encode($response);     
} else {
    // echo "<data>(No data available for query: \"$sql\")</data>";    
    echo "<data>(No data available for query: \"$prevTok\")</data>";    
}
fclose($export_file);
$conn->close();

?>
