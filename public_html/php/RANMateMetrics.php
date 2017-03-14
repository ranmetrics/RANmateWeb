<?php
$servername = "localhost:3307";
$username = "dataduct";
$password = "davy15";

$cell = "cell_2";
$site = "'10.10.5.19'";
$start = "'2016-09-10 00:00:00'";
$end = "'2016-09-10 23:55:00'";

// Create connection
$conn = new mysqli($servername, $username, $password);

// Check connection
if ($conn->connect_error) {
    die("Connection failed: " . $conn->connect_error);
}
echo "Connected successfully";

$sql = "SELECT measurement_time, $cell from metrics.packetsmean WHERE site_id = $site AND (measurement_time BETWEEN $start AND $end) ORDER BY measurement_time";
$result = $conn->query($sql);

if ($result->num_rows > 0) {
    // output data of each row
    while($row = $result->fetch_assoc()) {
        echo "time: " . $row["measurement_time"]. " - $cell: " . $row[$cell] . "\n";
    }
} else {
    echo "0 results";
}
$conn->close();

?> 