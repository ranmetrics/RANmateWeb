<?php

function old_str_replace_first($from, $to, $subject) {
    $from = '/'.preg_quote($from, '/').'/';
    return preg_replace($from, $to, $subject, 1);
}

function str_replace_first($needle, $replace, $haystack) {
    $pos = strpos($haystack, $needle);
    //echo "First pos of '$needle' in '$haystack' is $pos\n";
    if ($pos !== false) {
        return substr_replace($haystack, $replace, $pos, strlen($needle));
    } else {
        return $haystack;
    }   
}

function str_replace_last($needle, $replace, $haystack) {
    $pos = strrpos($haystack, $needle);
    //echo "Last pos of '$needle' in '$haystack' is $pos\n";
    if ($pos !== false) {
        return substr_replace($haystack, $replace, $pos, strlen($needle));
    } else {
        return $haystack;
    }   
}

//$conn = mysqli_connect('localhost:3307','dataduct','davy15','ranmate-femto');
$conn = mysqli_connect('localhost:3306','dataduct','Brearly16','ranmate-femto');
if (!$conn) {
    die('Could not connect: ' . mysqli_error($conn));
}
$switch = str_replace_first(" - ", "-", $_GET['switch']); // Some sites like Corsham St have ' - ' in the name
//$switch = str_replace(" - ", "-", $_GET['switch']); 
 
//echo "switch is now $switch\n";
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
    $switch = str_replace_last(" - ", "-", $_GET['switch']); // Some sites like Fora have ' - ' in the floor name
    $sql = "select DISTINCT cell_no from `ranmate-femto`.cells where site_id = '" . $switch . "' and exist and effective_to > NOW() ORDER BY cell_no";
    $result = $conn->query($sql);
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
}
    
$conn->close();

?>
