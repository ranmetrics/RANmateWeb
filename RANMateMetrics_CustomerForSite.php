<?php
$Site = trim($_GET['site']);

//$conn = mysqli_connect('localhost:3306','dataduct','Brearly16','metrics');      // OpenCell live server
$conn = mysqli_connect('localhost:3306','admin','16characters4admin','metrics');      // OpenCell live server
if (!$conn) {
    die('Could not connect: ' . mysqli_error($conn));
}

$sql = "select customer from Concert.Site where name = '" . $Site . "'";

//echo "sql=$sql";
$result = $conn->query($sql);

$rowNum = 0;
if ($result->num_rows > 0) {
    // output data of first row
    $row = $result->fetch_assoc();
    echo $row["customer"];
} else {
    echo "(No customer available for site " . $Site . " using SQL " . $sql . ")";    
}
$conn->close();

?>
