<?php
$switch = str_replace(" - ", "-", $_GET['switch']);
//$switch = 'Bishopsgate-Floor 2';

//$conn = mysqli_connect('localhost:3307','dataduct','davy15','ranmate-femto');
$conn = mysqli_connect('localhost:3306','dataduct','Brearly16','ranmate-femto');
//$conn = mysqli_connect('185.171.220.1:3306','dataduct','Brearly16','ranmate-femto');      // OpenCell live server
if (!$conn) {
    die('Could not connect: ' . mysqli_error($conn));
}
        
$sql = "select DISTINCT cell_no from `ranmate-femto`.cells where site_id = '" . $switch . "' and exist and effective_to > NOW() ORDER BY cell_no";
$result = $conn->query($sql);

$liveCells = "";

if ($result->num_rows > 0) {
    // output data of each row
    while($row = $result->fetch_assoc()) {
        //echo $row["cell_no"];
        $liveCells .= $row["cell_no"] . " ";
    }
    echo $liveCells;
} else {
    echo "(No Cells) sql=" . $sql;    
}
    
$conn->close();

?>
