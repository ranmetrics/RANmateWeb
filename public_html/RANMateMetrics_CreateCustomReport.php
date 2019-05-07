<!--<!DOCTYPE html>
<html>
<head></head>
<body>-->

<?php

$StartDateTime = $_GET['StartDateTime'];
$EndDateTime = $_GET['EndDateTime'];
$Site = $_GET['Site']; 

//$conn = mysqli_connect('localhost:3306','dataduct','Brearly16','ranmate-femto');
//if (!$conn) {
//    die('Could not connect: ' . mysqli_error($conn));
//}

//$sql = "select DISTINCT IP from OpenCellCM.Switch where site_name='" . $site . "' and name='" . $floor . "'"; // Concert Version
//$result = $conn->query($sql);

//$java = "java -classpath /opt/RANmate/lib/RANMate_multi.jar:/opt/RANmate/lib/ganymed-ssh2-build210.jar com.dataduct.invobroker.ranmate.FemtoReset " . $SwitchIp . " gi" . $Port;
$java = "java -classpath /opt/RANmateReports/lib/RANmateReports.jar:/opt/RANmateReports/lib/jfreechart-1.0.19.jar:/opt/RANmateReports/lib/mysql-connector-java-5.1.15-bin.jar:/opt/RANmateReports/lib/jcommon-1.0.23.jar:/opt/RANmateReports/lib/pdfbox-2.0.13.jar:/opt/RANmateReports/lib/commons-logging-1.2.jar:/opt/RANmateReports/lib/fontbox-2.0.13.jar com.dataduct.invobroker.ranmatereports.PDFReportCreator custom \"" . $Site . "\" \"" . $StartDateTime . "\" \"" . $EndDateTime . "\" 1"; // > RANmateReportsScreenOutput.log";
//echo "java is " . $java . "\n";

$generate_output = exec($java, $output, $return);

if ($generate_output === NULL) {
   echo("Custom report generation failed for: " + $java + "\n");
} else { 
   echo("Custom report generation successful for: " + $java + "\n");    
}
echo("$return\n");    

?>
<!--</body>
</html>-->
