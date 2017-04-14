<?php

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
//$conn = mysqli_connect('185.171.220.1:3306','dataduct','Brearly16','ranmate-femto');      // OpenCell live server
if (!$conn) {
    die('Could not connect: ' . mysqli_error($conn));
}

if (substr_count($_GET['switches'], "||") > 0) {
    //echo "There are multiple switches, using basic replace\n";
    $switches = str_replace(" - ", "-", $_GET['switches']);
} else {
    //echo "There is only one switch, using 1st replace only\n";
    $switches = str_replace_first(" - ", "-", $_GET['switches']);
}
$sql = "select DISTINCT cell_no from `ranmate-femto`.cells where " . $switches . " and exist and effective_to > NOW() ORDER BY cell_no";
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
    if (substr_count($_GET['switches'], '||') == 0) {
        //echo "Still only one switch, using 2nd replace\n";
        $switches = str_replace_last(" - ", "-", $_GET['switches']);
        $sql = "select DISTINCT cell_no from `ranmate-femto`.cells where " . $switches . " and exist and effective_to > NOW() ORDER BY cell_no";
        $result = $conn->query($sql);
        if ($result->num_rows > 0) {
            // output data of each row
            while($row = $result->fetch_assoc()) {
                //echo $row["cell_no"];
                $liveCells .= $row["cell_no"] . " ";
            }
            echo $liveCells;
        } else {
            echo "(No Cells for single site) sql=" . $sql;    
        }
    } else {
        echo "(No Cells for multiple sites) sql=" . $sql;    
    } 
} 
    
$conn->close();

?>
