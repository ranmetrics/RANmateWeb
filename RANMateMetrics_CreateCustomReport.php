<!--<!DOCTYPE html>
<html>
<head></head>
<body>-->

<?php
error_reporting(E_ALL);
ini_set('display_errors', 'on');

$StartDateTime = $_GET['StartDateTime'];
$EndDateTime = $_GET['EndDateTime'];
$Site = $_GET['Site']; 
$Tech = $_GET['Tech'];

//$conn = mysqli_connect('localhost:3306','dataduct','Brearly16','ranmate-femto');
//if (!$conn) {
//    die('Could not connect: ' . mysqli_error($conn));
//}

//$sql = "select DISTINCT IP from OpenCellCM.Switch where site_name='" . $site . "' and name='" . $floor . "'"; // Concert Version
//$result = $conn->query($sql);

//$java = "java -classpath /opt/RANmate/lib/RANMate_multi.jar:/opt/RANmate/lib/ganymed-ssh2-build210.jar com.dataduct.invobroker.ranmate.FemtoReset " . $SwitchIp . " gi" . $Port;
//$java = "java -classpath /opt/RANmateReports/lib/RANmateReports.jar:/opt/RANmateReports/lib/jfreechart-1.0.19.jar:/opt/RANmateReports/lib/mysql-connector-java-5.1.15-bin.jar:/opt/RANmateReports/lib/jcommon-1.0.23.jar:/opt/RANmateReports/lib/pdfbox-2.0.13.jar:/opt/RANmateReports/lib/commons-logging-1.2.jar:/opt/RANmateReports/lib/fontbox-2.0.13.jar com.dataduct.invobroker.ranmatereports.PDFReportCreator4Mnos custom \"" . $Site . "\" \"" . $StartDateTime . "\" \"" . $EndDateTime . "\" 1"; // > RANmateReportsScreenOutput.log";

if ($Tech === "4G") {
    $java = "java -classpath /opt/RANmateReports/lib/RANmateReports.jar:/opt/RANmateReports/lib/jfreechart-1.0.19.jar:/opt/RANmateReports/lib/mysql-connector-java-5.1.15-bin.jar:/opt/RANmateReports/lib/jcommon-1.0.23.jar:/opt/RANmateReports/lib/pdfbox-2.0.13.jar:/opt/RANmateReports/lib/commons-logging-1.2.jar:/opt/RANmateReports/lib/fontbox-2.0.13.jar:/opt/RANmateReports/lib/slf4j.jar:/opt/RANmateReports/lib/jsoup-1.12.1.jar:/opt/RANmateReports/lib/com.google.collections.jar:/opt/RANmateReports/lib/commons-csv-1.7.jar:/opt/RANmateReports/lib/logback-classic-1.2.3.jar:/opt/RANmateReports/lib/logback-core-1.2.3.jar com.dataduct.invobroker.ranmatereports.PDFReportCreator4Mnos4G custom \"" . $Site . "\" \"" . $StartDateTime . "\" \"" . $EndDateTime . "\" 1"; // > RANmateReportsScreenOutput.log";    
} else {
    $java = "java -classpath /opt/RANmateReports/lib/RANmateReports.jar:/opt/RANmateReports/lib/jfreechart-1.0.19.jar:/opt/RANmateReports/lib/mysql-connector-java-5.1.15-bin.jar:/opt/RANmateReports/lib/jcommon-1.0.23.jar:/opt/RANmateReports/lib/pdfbox-2.0.13.jar:/opt/RANmateReports/lib/commons-logging-1.2.jar:/opt/RANmateReports/lib/fontbox-2.0.13.jar:/opt/RANmateReports/lib/slf4j.jar:/opt/RANmateReports/lib/jsoup-1.12.1.jar:/opt/RANmateReports/lib/com.google.collections.jar:/opt/RANmateReports/lib/commons-csv-1.7.jar:/opt/RANmateReports/lib/logback-classic-1.2.3.jar:/opt/RANmateReports/lib/logback-core-1.2.3.jar com.dataduct.invobroker.ranmatereports.PDFReportCreator4Mnos custom \"" . $Site . "\" \"" . $StartDateTime . "\" \"" . $EndDateTime . "\" 1"; // > RANmateReportsScreenOutput.log";    
}

//echo "java is " . $java . "\n";

$generate_output = exec($java, $output, $return);

if ($generate_output === NULL) {
   echo("Custom report generation failed for: " . $java . "\n");
} else { 
   echo("Custom report generation successful for: " . $java . "\n");    
}
echo("$return\n");    
echo("output: \n$generate_output\n");

?>
<!--</body>
</html>-->
