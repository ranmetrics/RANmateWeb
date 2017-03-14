<?php
$switch = str_replace(" - ", "-", $_GET['switch']);
$cell = $_GET['cell'] + 1;
$time24Hours = $_GET['time24Hours'];
//$time1Hour = $_GET['time1Hour'];

$conn = mysqli_connect('localhost:3307','dataduct','davy15','ranmate-femto');
//$conn = mysqli_connect('localhost:3306','dataduct','Brearly16','ranmate-femto');
if (!$conn) {
    die('Could not connect: ' . mysqli_error($conn));
}

$sql = "select reset_time, user, (select count(*) from reset_log where port_no=" . $cell . " and site_id='" . $switch . "' and reset_time > '" . $time24Hours . "') AS \"count\" " 
    . "from reset_log where port_no=" . $cell . " and site_id='" . $switch . "' and reset_time > '" . $time24Hours . "'  "
    . "ORDER BY reset_time DESC LIMIT 1";

$result = $conn->query($sql);

if ($result->num_rows > 0) {
    // output data of each row, there should only be 1 row
    while($row = $result->fetch_assoc()) {
        echo $row["count"] . '_' . $row["reset_time"] . '_' . $row["user"];
    }
} else {
    echo "(No Recent Resets) sql=" . $sql;    
}
    
$conn->close();

?>
