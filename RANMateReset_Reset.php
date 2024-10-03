<?php

$Timestamp = $_GET['time'];
//$Switch = $_GET['switch'];
//$Switch = str_replace_first(" - ", "-", $_GET['switch']); // Some sites like Corsham St have ' - ' in the name
//$Switch = str_replace(" - ", "-", $_GET['switch']); // Maybe we don't need to do this replace here, we can just trim the floor and site later on?
$Switch = $_GET['switch']; // Some sites like Corsham St have ' - ' in the name
$Port = $_GET['cell'] + 1;
$OpCo = $_GET['opco'];
$FemtoNum = $_GET['femtoNum'];
$User = $_GET['user'];
$Comment = $_GET['comment'];
$Note = $_GET['note'];
$VirtualSwitchChars = $_GET['virtualSwitchChars']; // <, <<, ., >>, >>> for overloaded switches
//$Timestamp = '2017-01-28 12:03';
//$Switch = '111 Salusbury Rd - 1st Floor';
//$Port = 30;
//$OpCo = 'O2';
//$FemtoNum = 6;
//
//echo("Sanity Check");    

//$conn = mysqli_connect('localhost:3307','dataduct','davy15','ranmate-femto');
$conn = mysqli_connect('localhost:3306','dataduct','Brearly16','ranmate-femto');
if (!$conn) {
    die('Could not connect: ' . mysqli_error($conn));
}

$pos = strrchr($Switch,'-');
$floor = trim(substr($pos, 1));
$site = trim(substr( $Switch , 0 , strlen($Switch) - strlen($pos) ));

// type added 29/9/19 for OC-77 so that FemtoReset.java knows the switch type since 2960 and 3650 use 'terminal length 0' instead of 'terminal datadump'
$sql = "select DISTINCT IP, type from Concert.Switch where site_name='" . $site . "' and name='" . $floor . "'"; // Concert Version
//echo "Switch IP sql (1st attempt) is: $sql \n";    
$result = $conn->query($sql);

if ($result->num_rows > 0) {
    // output data of each row, there should only be 1 row
    while($row = $result->fetch_assoc()) {
        $SwitchIp = $row["IP"];
        $SwitchType = $row["type"];
    }
    //echo "Switch IP sql is " . $sql . "\n";    
    //echo "Switch IP is " . $SwitchIp . "\n";    

    //$java = "java -classpath /opt/RANmate/lib/RANMate_multi.jar:/opt/RANmate/lib/ganymed-ssh2-build210.jar com.dataduct.invobroker.ranmate.FemtoReset " . $SwitchIp . " gi" . $Port . " " . $SwitchType;
    $java = "java -classpath /opt/RANmate/lib/RANmate.jar:/opt/RANmate/lib/ganymed-ssh2-build210.jar com.dataduct.invobroker.ranmate.FemtoReset " . $SwitchIp . " gi" . $Port . " " . $SwitchType;
    //echo "java is " . $java . "\n";

    $reset_output = exec($java, $output, $return);

    if ($reset_output === NULL) {
        //echo("Execution of Reset failed");
    } else { // only update the log on a successful reset
        $sql = "INSERT INTO reset_log (reset_time, site_id, port_no, opco, femto_no, user, comment, note) "
                ."VALUES ('" . $Timestamp . "', '" . $Switch . $VirtualSwitchChars . "', " . $Port . ", '" . $OpCo . "', " . $FemtoNum . ", '" . $User . "', '" . $Comment . "', '" . $Note . "')";

        //echo ("sql is " . $sql);
        if ($conn->query($sql) === TRUE) {
        //    // echo("Database reset_log table updated");
        } else {
        //    // echo("Error updating database reset_log table, sql is " + $sql);    
        }
        echo("$return\n");    
    }
    
} else {
    //echo "(No corresponding IP found) sql=" . $sql . "\n";    
    $pos = strchr($Switch,'-');
    $floor = trim(substr($pos, 1));
    $site = trim(substr( $Switch , 0 , strlen($Switch) - strlen($pos) ));

    // type added 29/9/19 for OC-77 so that FemtoReset.java knows the switch type since 2960 and 3650 use 'terminal length 0' instead of 'terminal datadump'
    $sql = "select DISTINCT IP, type from Concert.Switch where site_name='" . $site . "' and name='" . $floor . "'"; // Concert Version
    //echo "Switch IP sql (2nd attempt) is: $sql \n";    
    $result = $conn->query($sql);

    if ($result->num_rows > 0) {
        // output data of each row, there should only be 1 row
        while($row = $result->fetch_assoc()) {
            $SwitchIp = $row["IP"];
            $SwitchType = $row["type"];
        }
        
        // echo "Switch IP is " . $SwitchIp . "\n";    
        $java = "java -classpath /opt/RANmate/lib/RANMate_multi.jar:/opt/RANmate/lib/ganymed-ssh2-build210.jar com.dataduct.invobroker.ranmate.FemtoReset " . $SwitchIp . " gi" . $Port . " " . $SwitchType;
        //echo "java is " . $java . "\n";

        $reset_output = exec($java, $output, $return);

        if ($reset_output === NULL) {
            //echo("Execution of Reset failed");
        } else { // only update the log on a successful reset
            $sql = "INSERT INTO reset_log (reset_time, site_id, port_no, opco, femto_no, user, comment, note) "
                    ."VALUES ('" . $Timestamp . "', '" . $Switch . $VirtualSwitchChars . "', " . $Port . ", '" . $OpCo . "', " . $FemtoNum . ", '" . $User . "', '" . $Comment . "', '" . $Note . "')";

            //echo ("sql is " . $sql);
            if ($conn->query($sql) === TRUE) {
            //    // echo("Database reset_log table updated");
            } else {
            //    // echo("Error updating database reset_log table, sql is " + $sql);    
            }
            echo("$return\n");    
        }
        
    } else {
        echo "(No corresponding IP found for switch/floor) sql=" . $sql . "\n";        
    }

}


?>
