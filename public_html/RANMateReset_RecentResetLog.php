<?php

//$conn = mysqli_connect('localhost:3307','dataduct','davy15','ranmate-femto');
$conn = mysqli_connect('localhost:3306','dataduct','Brearly16','ranmate-femto');
if (!$conn) {
    die('Could not connect: ' . mysqli_error($conn));
}

$sql = "select * from reset_log ORDER BY reset_time DESC LIMIT 100";

$result = $conn->query($sql);

echo "<table align=\"center\" style=\"width:90%\">";
echo "<tr><th>Reset Time</th><th>Switch</th><th>Operator</th><th>FAP</th><th>User</th><th>User Comment</th><th>RANmate Note</th></tr>";
if ($result->num_rows > 0) {
    // output data of each row, there should only be 1 row
    while($row = $result->fetch_assoc()) {
//        $time = str_replace("-", "&#8209", substr(str_replace(" ", "&nbsp",$row["reset_time"]),  0, -3));        // remove the seconds part from the display
        $time = "<nobr>" . substr($row["reset_time"],  0, -3) . "</nobr>";
//        $site = str_replace("-", "&#8209", str_replace(" ", "&nbsp",$row["site_id"]));
        $site = "<nobr>" . $row["site_id"] . "</nobr>";
        // str_replace("-", "&#8209", str_replace(" ", "&nbsp",$row["site_id"]));
//        echo '<tr><td>'.$row["reset_time"].'</td><td>'.$row["site_id"].'</td><td>'.$row["opco"].'</td><td>'.$row["femto_no"].'</td><td>'.$row["user"].'</td><td>'.$row["comment"].'</td><td>'.$row["note"].'</td></tr>';
        echo '<tr><td>'.$time.'</td><td>'.$site.'</td><td>'.$row["opco"].'</td><td>'.$row["femto_no"].'</td><td>'.$row["user"].'</td><td>'.$row["comment"].'</td><td>'.$row["note"].'</td></tr>';
    }
} else {
//    echo "(No Log entries) sql=" . $sql;    
}
echo "</table>";
    
$conn->close();

?>
