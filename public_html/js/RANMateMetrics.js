/*
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */

/*!
 * Uses Chart.js
 * http://chartjs.org/
 * Version: 2.2.2
 *
 * Copyright 2016 Nick Downie
 * Released under the MIT license
 * https://github.com/chartjs/Chart.js/blob/master/LICENSE.md
 */
var myChart;
var startMillis;
var liveCells;
var currentMetricType;

function getNow() {
    return getDateTimeString(new Date());
//    return "2016-11-06 03:52";  // used when testing specific dates
}
function getYesterday() {
    var d = new Date();
    d.setHours(d.getHours() - 30);
    // return "2016-11-05 03:52";    // used when testing specific dates
    return getDateTimeString(d);
}

function getDateTimeString(day) {
//    var today = new Date();
    var mm = day.getMonth() + 1;
    var dd = day.getDate();
    var hh = day.getHours();
    var min = day.getMinutes();
    if(dd<10){dd='0'+dd}
    if(mm<10){mm='0'+mm}
    if(hh<10){hh='0'+hh}
    if(min<10){min='0'+min}
//    return day.getFullYear()+'-'+mm+'-'+dd+' '+hh+':'+min+':00Z';
//    return day.getFullYear()+'-'+mm+'-'+dd+' '+hh+':'+min+':00';
    return day.getFullYear()+'-'+mm+'-'+dd+' '+hh+':'+min;
};

function showSites(str) {
    if (str == "") {
        //document.getElementById("metric").innerHTML = "";
        return;
    } else {
        if (window.XMLHttpRequest) {
            xmlhttp = new XMLHttpRequest();                     // code for IE7+, Firefox, Chrome, Opera, Safari
        } else {
            xmlhttp = new ActiveXObject("Microsoft.XMLHTTP");   // code for IE6, IE5
        }
        var iface = document.getElementById("interface");
        var ifaceLabel = document.getElementById("IfaceName");
        var cellNum = document.getElementById("CellNum");
        var opCoName = document.getElementById("OpCoName");
        var V = document.getElementById("V");
        var O = document.getElementById("O");
        var T = document.getElementById("T");
        var E = document.getElementById("E");
        var fap1 = document.getElementById("FAP1");
        var fap2 = document.getElementById("FAP2");
        var fap3 = document.getElementById("FAP3");
        var fap4 = document.getElementById("FAP4");
        var fap5 = document.getElementById("FAP5");
        var fap6 = document.getElementById("FAP6");
        var fap7 = document.getElementById("FAP7");
        var fap8 = document.getElementById("FAP8");

        xmlhttp.onreadystatechange = function() {
            if (this.readyState == 4 && this.status == 200) {
                document.getElementById("site").innerHTML = this.responseText;
                document.getElementById("site").selectedIndex = -1;
            }
        };

        // console.log("Str=" + str + ", currentMetricType=" + currentMetricType);
        if (str.startsWith("Counter-") && (currentMetricType !== "Counter")) {
            currentMetricType = "Counter";
            clearTickBoxes();
            cellNum.style.display = 'none';
            opCoName.style.display = 'none';
            V.style.display = O.style.display = T.style.display = E.style.display = 'none';
            fap1.style.display = fap2.style.display = fap3.style.display = fap4.style.display = 'none';
            fap5.style.display = fap6.style.display = fap7.style.display = fap8.style.display = 'none';
            iface.style.display = "block";
            iface.style.margin = "10px 0px 0px 0px";    // no idea why we now need a 10px top border instead of 5px to keep it inline
            ifaceLabel.style.display = "block";
            xmlhttp.open("GET","RANMateMetrics_SiteList.php?group="+str,true);
            xmlhttp.send();
        } else if (str.startsWith("Ping-") && (currentMetricType !== "Ping")) {
            currentMetricType = "Ping";
            clearTickBoxes();
            cellNum.style.display = 'none';
            opCoName.style.display = 'none';
            iface.style.display = 'none';
            ifaceLabel.style.display = 'none';
            V.style.display = O.style.display = T.style.display = E.style.display = 'none';
            fap1.style.display = fap2.style.display = fap3.style.display = fap4.style.display = 'none';
            fap5.style.display = fap6.style.display = fap7.style.display = fap8.style.display = 'none';
            xmlhttp.open("GET","RANMateMetrics_SiteList.php?group="+str,true);
            xmlhttp.send();
        } else if (str.startsWith("Femto-") && (currentMetricType !== "Femto")) { // Femto metric
            currentMetricType = "Femto";
            cellNum.style.display = 'block';
            opCoName.style.display = 'block';
            V.style.display = O.style.display = T.style.display = E.style.display = 'block';
            fap1.style.display = fap2.style.display = fap3.style.display = fap4.style.display = 'block';
            fap5.style.display = fap6.style.display = fap7.style.display = fap8.style.display = 'block';
            V.style.visibility = O.style.visibility = T.style.visibility = E.style.visibility = 'visible'; 
            fap1.style.visibility = fap2.style.visibility = fap3.style.visibility = fap4.style.visibility = 'visible'; 
            fap5.style.visibility = fap6.style.visibility = fap7.style.visibility = fap8.style.visibility = 'visible'; 
            iface.style.display = 'none';
            ifaceLabel.style.display = 'none';
            xmlhttp.open("GET","RANMateMetrics_SiteList.php?group="+str,true);
            xmlhttp.send();
        } 
    }
}

function updateOpCoCells(str) {
    if (str == "") {
        return;
    } else {
        if (window.XMLHttpRequest) {
            // code for IE7+, Firefox, Chrome, Opera, Safari
            xmlhttp = new XMLHttpRequest();
        } else {
            // code for IE6, IE5
            xmlhttp = new ActiveXObject("Microsoft.XMLHTTP");
        }
        xmlhttp.onreadystatechange = function() {
            if (this.readyState == 4 && this.status == 200) {
                liveCells = new Map();
                liveCells.set(0, new Set()); 
                liveCells.set(1, new Set());
                liveCells.set(2, new Set());
                liveCells.set(3, new Set());

                var V = document.getElementById("V");
                var O = document.getElementById("O");
                var T = document.getElementById("T");
                var E = document.getElementById("E");
                
                // clear any radio buttons that may have been checked previously
//                document.getElementById("Vodafone").checked = false;
//                document.getElementById("O2").checked = false;
//                document.getElementById("Three").checked = false;
//                document.getElementById("EE").checked = false;
                document.getElementById(0).checked = false;
                document.getElementById(1).checked = false;
                document.getElementById(2).checked = false;
                document.getElementById(3).checked = false;
                document.getElementById("Femto1").checked = false;
                document.getElementById("Femto2").checked = false;
                document.getElementById("Femto3").checked = false;
                document.getElementById("Femto4").checked = false;
                document.getElementById("Femto5").checked = false;
                document.getElementById("Femto6").checked = false;
                document.getElementById("Femto7").checked = false;
                document.getElementById("Femto8").checked = false;

                var fap1 = document.getElementById("FAP1");
                var fap2 = document.getElementById("FAP2");
                var fap3 = document.getElementById("FAP3");
                var fap4 = document.getElementById("FAP4");
                var fap5 = document.getElementById("FAP5");
                var fap6 = document.getElementById("FAP6");
                var fap7 = document.getElementById("FAP7");
                var fap8 = document.getElementById("FAP8");
                
                var cellSet = new Set();
                //console.log("This is the list of cells\n" + this.responseText);
                var cellList = this.responseText.split(" ");
                var arrayLength = cellList.length;
                for (var i = 0; i < arrayLength; i++) {
                    var aCell = cellList[i].trim();
                    if (aCell.length > 0) {
                        var cellNum = parseInt(aCell);
                        cellSet.add(cellNum);
                        // pointless - chck boxes behave differently to the tick boxes on the reset screen - more complex and combinations
                        //liveCells.get(cellNum % 4).add(Math.floor(cellNum/4));
                    }                    
                }
                V.style.visibility = O.style.visibility = T.style.visibility = E.style.visibility = 'hidden';
                fap1.style.visibility = fap2.style.visibility = fap3.style.visibility = fap4.style.visibility = 'hidden';
                fap5.style.visibility = fap6.style.visibility = fap7.style.visibility = fap8.style.visibility = 'hidden';
                // now let's go through all the cells and work out what needs to be displayed and what doesn't
                for (var i = 0; i < 32; i++) {
                    if (cellSet.has(i)) {
                        // Display the correct V, O, T, E
                        switch (i % 4) {
                            case 0: V.style.visibility = 'visible'; break; 
                            case 1: O.style.visibility = 'visible'; break;
                            case 2: T.style.visibility = 'visible'; break;
                            case 3: E.style.visibility = 'visible'; break;
                        }
                        // Display the correct FAP number (a superset of all OPCos)
                        switch (Math.floor(i/4)) {
                            case 0: fap1.style.visibility = 'visible'; break; 
                            case 1: fap2.style.visibility = 'visible'; break;
                            case 2: fap3.style.visibility = 'visible'; break;
                            case 3: fap4.style.visibility = 'visible'; break;
                            case 4: fap5.style.visibility = 'visible'; break; 
                            case 5: fap6.style.visibility = 'visible'; break;
                            case 6: fap7.style.visibility = 'visible'; break;
                            case 7: fap8.style.visibility = 'visible'; break;
                        }
                    } 
                }
                // console.log(cellList.length + " cells in that list");
            }
        };
        xmlhttp.open("GET","RANMateMetrics_OpCoCellList.php?switch="+encodeURIComponent(str),true);
        xmlhttp.send();
    }
}

// pointless checkboxes are more complex to do this for than radio boxes
function opcoSelected(opco) {
//    if (opco == "") {
//        return;
//    } else {
////        console.log("OpCo " + opco + " selected");
//        selectedOpCo = opco;
//        var cellSet = liveCells.get(parseInt(opco));
//        var fap1 = document.getElementById('FAP1');
//        var fap2 = document.getElementById('FAP2');
//        var fap3 = document.getElementById('FAP3');
//        var fap4 = document.getElementById('FAP4');
//        var fap5 = document.getElementById('FAP5');
//        var fap6 = document.getElementById('FAP6');
//        var fap7 = document.getElementById('FAP7');
//        var fap8 = document.getElementById('FAP8');
//        if (cellSet.has(0)) { fap1.style.visibility = 'visible'; } else { fap1.style.visibility = 'hidden'; }
//        if (cellSet.has(1)) { fap2.style.visibility = 'visible'; } else { fap2.style.visibility = 'hidden'; }
//        if (cellSet.has(2)) { fap3.style.visibility = 'visible'; } else { fap3.style.visibility = 'hidden'; }
//        if (cellSet.has(3)) { fap4.style.visibility = 'visible'; } else { fap4.style.visibility = 'hidden'; }
//        if (cellSet.has(4)) { fap5.style.visibility = 'visible'; } else { fap5.style.visibility = 'hidden'; }
//        if (cellSet.has(5)) { fap6.style.visibility = 'visible'; } else { fap6.style.visibility = 'hidden'; }
//        if (cellSet.has(6)) { fap7.style.visibility = 'visible'; } else { fap7.style.visibility = 'hidden'; }
//        if (cellSet.has(7)) { fap8.style.visibility = 'visible'; } else { fap8.style.visibility = 'hidden'; }
//        document.getElementById("resetButton").disabled = true;            
//        document.getElementById('Femto1').checked = false;
//        document.getElementById('Femto2').checked = false;
//        document.getElementById('Femto3').checked = false;
//        document.getElementById('Femto4').checked = false;
//        document.getElementById('Femto5').checked = false;
//        document.getElementById('Femto6').checked = false;
//        document.getElementById('Femto7').checked = false;
//        document.getElementById('Femto8').checked = false;
//    }
}

function showInterfaces(str) {
    console.log("showInterfaces called with " + str);
    if (str == "") {
        return;
    } else {
        var metric = document.getElementById("metric").value;
        if (metric.substring(0,6) == "Femto-") {
            //console.log("Will update the OpCo cells");
            updateOpCoCells(str);
        } else {
            if (window.XMLHttpRequest) {
                // code for IE7+, Firefox, Chrome, Opera, Safari
                xmlhttp = new XMLHttpRequest();
            } else {
                // code for IE6, IE5
                xmlhttp = new ActiveXObject("Microsoft.XMLHTTP");
            }
            xmlhttp.onreadystatechange = function() {
                if (this.readyState == 4 && this.status == 200) {
                    document.getElementById("interface").innerHTML = this.responseText;
    //                document.getElementById("interface").selectedIndex = 0;
                }
            };
            // Takes a very long time to query, let's hardocde for now
//            xmlhttp.open("GET","RANMateMetrics_InterfaceList.php?site="+encodeURIComponent(str),true);
//            xmlhttp.send();
            document.getElementById("interface").innerHTML = "<!DOCTYPE html><html><head></head><body><option value=ge-0/0/15>ge-0/0/15</option></body></html>";
            
        }
    }
}

function initPage() {
    clearTickBoxes();
    document.getElementById("metric").selectedIndex = 0;  // was previously 1
    console.log("Enabling the graph button");
    document.getElementById("graphButton").disabled = false;    
}

function clearTickBoxes() {
    // clear any previously selected inputs - page refresh scenario
    document.getElementById(0).checked = false;
    document.getElementById(1).checked = false;
    document.getElementById(2).checked = false;
    document.getElementById(3).checked = false;
    document.getElementById('Femto1').checked = false;
    document.getElementById('Femto2').checked = false;
    document.getElementById('Femto3').checked = false;
    document.getElementById('Femto4').checked = false;
    document.getElementById('Femto5').checked = false;
    document.getElementById('Femto6').checked = false;
    document.getElementById('Femto7').checked = false;
    document.getElementById('Femto8').checked = false;
}

function isValidDateTimeString(day) {
    var dateTimeRegExp = new RegExp("^([1-2]\\d{3}-([0]?[1-9]|1[0-2])-([0-2]?[0-9]|3[0-1])) (20|21|22|23|[0-1]?\\d{1}):([0-5]?\\d{1})$");
    return dateTimeRegExp.test(day);
}

function showGraph(id, visible) {
    // check that the start date-time is valid
    var metric = document.getElementById("metric").value;
    var yLabelTitle = '';
    if (metric == "") {
        alert("A metric must be selected");
    } else {
        var site = document.getElementById("site").value;
        if (site == "") {
            alert("A site must be selected");
        } else {
            var startDateTime = document.getElementById("startTime").value;
            if (!isValidDateTimeString(startDateTime)) {
                alert("The Start Date (" + startDateTime + ") is not correctly specified (YYYY-MM-DD hh:mm)")
            } else {
                // check that the end date-time is valid
                var endDateTime = document.getElementById("endTime").value;
                if (!isValidDateTimeString(endDateTime)) {
                    alert("The End Date (" + endDateTime + ") is not correctly specified (YYYY-MM-DD hh:mm)")
                } else {
                    // check that the start time is before the end time
                    if (endDateTime <= startDateTime) {
                        alert("The End Date-Time is before the Start Date-Time")
                    } else {
                        // if it's a Femto metric get all the values of the tick boxes
                        var query;
                        if (metric.substring(0,6) == "Femto-") {
                            var siteOnly = site.substring(0, site.indexOf(' - '));
                            var floorOnly = site.substring(site.indexOf(' - ') + 3);

//                            var vfChecked = document.getElementById('Vodafone').checked;
//                            var o2Checked = document.getElementById('O2').checked;
//                            var thChecked = document.getElementById('Three').checked;
//                            var eeChecked = document.getElementById('EE').checked;
                            var vfChecked = document.getElementById(0).checked;
                            var o2Checked = document.getElementById(1).checked;
                            var thChecked = document.getElementById(2).checked;
                            var eeChecked = document.getElementById(3).checked;

                            if (!(vfChecked || o2Checked || thChecked || eeChecked)) {
                                alert("At least 1 operator must be ticked")
                                return;
                            } else {

                                var fap1Checked = document.getElementById('Femto1').checked;
                                var fap2Checked = document.getElementById('Femto2').checked;
                                var fap3Checked = document.getElementById('Femto3').checked;
                                var fap4Checked = document.getElementById('Femto4').checked;
                                var fap5Checked = document.getElementById('Femto5').checked;
                                var fap6Checked = document.getElementById('Femto6').checked;
                                var fap7Checked = document.getElementById('Femto7').checked;
                                var fap8Checked = document.getElementById('Femto8').checked;

                                if (!(fap1Checked || fap2Checked || fap3Checked || fap4Checked || fap5Checked || fap6Checked || fap7Checked || fap8Checked)) {
                                    alert("At least 1 Femto Number be ticked")
                                    return;
                                } else {

                                    var cells = vfChecked && fap1Checked ? ', cell_0 AS VF_1' : "";
                                    cells += o2Checked && fap1Checked ? ', cell_1 AS O2_1' : "";
                                    cells += thChecked && fap1Checked ? ', cell_2 AS 3_1' : "";
                                    cells += eeChecked && fap1Checked ? ', cell_3 AS EE_1' : "";
                                    cells += vfChecked && fap2Checked ? ', cell_4 AS VF_2' : "";
                                    cells += o2Checked && fap2Checked ? ', cell_5 AS O2_2' : "";
                                    cells += thChecked && fap2Checked ? ', cell_6 AS 3_2' : "";
                                    cells += eeChecked && fap2Checked ? ', cell_7 AS EE_2' : "";
                                    cells += vfChecked && fap3Checked ? ', cell_8 AS VF_3' : "";
                                    cells += o2Checked && fap3Checked ? ', cell_9 AS O2_3' : "";
                                    cells += thChecked && fap3Checked ? ', cell_10 AS 3_3' : "";
                                    cells += eeChecked && fap3Checked ? ', cell_11 AS EE_3' : "";
                                    cells += vfChecked && fap4Checked ? ', cell_12 AS VF_4' : "";
                                    cells += o2Checked && fap4Checked ? ', cell_13 AS O2_4' : "";
                                    cells += thChecked && fap4Checked ? ', cell_14 AS 3_4' : "";
                                    cells += eeChecked && fap4Checked ? ', cell_15 AS EE_4' : "";
                                    cells += vfChecked && fap5Checked ? ', cell_16 AS VF_5' : "";
                                    cells += o2Checked && fap5Checked ? ', cell_17 AS O2_5' : "";
                                    cells += thChecked && fap5Checked ? ', cell_18 AS 3_5' : "";
                                    cells += eeChecked && fap5Checked ? ', cell_19 AS EE_5' : "";
                                    cells += vfChecked && fap6Checked ? ', cell_20 AS VF_6' : "";
                                    cells += o2Checked && fap6Checked ? ', cell_21 AS O2_6' : "";
                                    cells += thChecked && fap6Checked ? ', cell_22 AS 3_6' : "";
                                    cells += eeChecked && fap6Checked ? ', cell_23 AS EE_6' : "";
                                    cells += vfChecked && fap7Checked ? ', cell_24 AS VF_7' : "";
                                    cells += o2Checked && fap7Checked ? ', cell_25 AS O2_7' : "";
                                    cells += thChecked && fap7Checked ? ', cell_26 AS 3_7' : "";
                                    cells += eeChecked && fap7Checked ? ', cell_27 AS EE_7' : "";
                                    cells += vfChecked && fap8Checked ? ', cell_28 AS VF_8' : "";
                                    cells += o2Checked && fap8Checked ? ', cell_29 AS O2_8' : "";
                                    cells += thChecked && fap8Checked ? ', cell_30 AS 3_8' : "";
                                    cells += eeChecked && fap8Checked ? ', cell_31 AS EE_8' : "";

                                    query = "SELECT measurement_time" + cells + " FROM metrics." + metric.substring(6) +
                                            " WHERE " + metric.substring(6) + ".site_id=(SELECT SwitchIP from `ranmate-femto`.customer_config where customer_config.Site='" + siteOnly + "' AND customer_config.SwitchLocation='" + floorOnly + "' GROUP BY SwitchIP) " +
                                            "AND measurement_time BETWEEN '" + startDateTime + "' AND '" + endDateTime + "' " +
                                            "GROUP BY measurement_time;";
                                    // console.log("SQL is " + query);
                                }
                            }
                        } else if (metric.substring(0,5) == "Ping-") { // Router to Router Ping
                            yLabelTitle = 'milliseconds';
                            query = "SELECT measurement_time, " + metric.substring(5) + " FROM `metrics`.ping " +
                                    " WHERE ping.public_site_id=(SELECT RouterIP from `ranmate-femto`.customer_config where customer_config.Site='" + site + "' GROUP BY RouterIP) " +
                                    "AND measurement_time BETWEEN '" + startDateTime + "' AND '" + endDateTime + "' " +
                                    "GROUP BY measurement_time;";
                            console.log("SQL is " + query);
//                                alert("SQL is " + query);
                        } else {  // Backhaul Counter Metric
                            var interface = document.getElementById("interface").value;
                            if (interface == "") {
                                alert("An interface must be selected");
                                return;
                            } else {                                                                
                                query = "SELECT measurement_time, " + metric.substring(8) + " FROM `metrics`.router_counters " +
                                        " WHERE router_counters.public_site_id=(SELECT RouterIP from `ranmate-femto`.customer_config where customer_config.Site='" + site + "' GROUP BY RouterIP) " +
                                        "AND router_counters.interface='" + interface + "' " +
                                        "AND measurement_time BETWEEN '" + startDateTime + "' AND '" + endDateTime + "' " +
                                        "GROUP BY measurement_time;";
                                console.log("SQL is " + query);
//                                alert("SQL is " + query);
                            }
                        }

                        if (window.XMLHttpRequest) {
                            xmlhttp = new XMLHttpRequest();                     // code for IE7+, Firefox, Chrome, Opera, Safari
                        } else {
                            xmlhttp = new ActiveXObject("Microsoft.XMLHTTP");   // code for IE6, IE5
                        }
                        xmlhttp.onreadystatechange = function() {
                            if (this.readyState == 4 && this.status == 200) {
                                var d = new Date();
                                var endMillis = d.getTime(); 
                                console.log(endMillis - startMillis + " millis taken to run query");
                                // console.log(this.responseText.substring(0,1000));
                                // alert(this.responseText.substring(0,1000));
                                // response string
                                // [{"time":"2016-11-05 03:55:00","VF_1":"152","O2_1":"90"},{"time":"2016-11-05 04:00:00","VF_1":"157","O2_1":"90"},{"tim...
                                // console.log("The index is " + this.responseText.indexOf("<data>(No data available for query"));
                                // disable the graph button
                                //console.log("Enabling the graph button");
                                document.getElementById("graphButton").disabled = false;
                                document.getElementById("graphButton").value = 'Graph';
                                //gb.display = 'block';
                                // var g = document.getElementById("graph");
                                // g.display = 'block';
                                if (this.responseText.indexOf("No data available for query") > -1) {
                                    alert("Metrics data does not exist for this interval at this site");
                                } else {
                                    var metrics = JSON.parse(this.responseText);
                                    var graphTimes = new Array(); 
                                    var graphValues = new Map(); // one entry for each metric 
                                    for (var key in metrics) {
                                        var measurement = metrics[key];
                                        var dataPoints;
                                        for (var entry in measurement) {
                                            if (entry === 'time') {
                                                graphTimes.push(measurement[entry]);
    //                                            console.log("Adding time " + measurement[entry]);
                                            } else {
                                                // add the data point to a Map
                                                if (graphValues.has(entry)) {
                                                    graphValues.get(entry).push(measurement[entry]);
    //                                                console.log("   Adding measurement " + entry + "=" + measurement[entry]);
                                                } else {
    //                                                console.log("   How is measurement " + entry + "=" + measurement[entry] + " being stored?");
                                                    graphValues.set(entry, new Array(measurement[entry]));
                                                }
                                            }
                                        }
                                    }
                                    var graphLines = new Array();
                                    // add the collection to graphLines
                                    for (var [key, value] of graphValues) {
    //                                    console.log("          Processing " + key + " value=" + value);
                                        graphLines.push(formatGraphLine(key, value));
                                    }
        //                                        alert(entry + ' ' + measurement[entry]);

    //                                var ctx = document.getElementById("graph");
                                    var canvas = document.getElementById("graph");
                                    var ctx = canvas.getContext("2d"); // Get the context to draw on.                                
                                    if (typeof myChart !== 'undefined') {                                    
                                        myChart.destroy();
                                    }
                                    myChart = new Chart(ctx, {
                                        type: 'line',
                                        data: {
    //                                        labels: ["16:00", "16:05", "16:10", "16:15", "16:20", "16:25", "16:30", "16:35"],
                                            labels: graphTimes,
    //                                        datasets: [
    //                                            {
    //                                                label: 'VF_1',
    //                                                fill: false,
    //                                                lineTension: 0,
    //                                                borderColor: "rgba(75,192,192,1)",
    //                                                pointBorderWidth: 0.5,
    //                                                data: [13.5, 15, 13, 16, 16, 15.5, 14, 15],
    //                                            },
    //                                            {
    //                                                label: 'O2_1',
    //                                                fill: false,
    //                                                lineTension: 0,
    //                                                borderColor: "rgba(250,92,157,1)",
    //                                                pointBorderWidth: 0.5,
    //                                                data: [6.5, 6, 6, 5.5, 7, 6.5, 6.5, 7],
    //                                            }
    //                                        ]
                                            datasets: graphLines
                                        },
                                        options: {
                                            title: {
                                                display: true,
                                                text: site + " :: " + metric,
                                                fontSize: 20,
                                                position: 'bottom'
                                            },
                                            scales: {
                                                yAxes: [{
                                                    ticks: {
                                                        beginAtZero:true
                                                    },
                                                    scaleLabel: {
                                                        display: true,
                                                        labelString: yLabelTitle
                                                    }
                                                }]
                                            },
                                            legend: {
                                                width: 15,
                                            }                                        
                                        }
                                    });
                                    d = new Date();
                                    var endMillis2 = d.getTime(); 
                                    console.log(endMillis2 - endMillis + " millis taken to create Graph");                                    
                                }                                
                            }
                        };
                        // disable the graph button
                        // console.log("Disabling the graph button");
                        document.getElementById("graphButton").value = 'Wait...';
                        document.getElementById("graphButton").disabled = true;
                        // gb.display = 'none';
                        //var g = document.getElementById("graph");
                        //g.display = 'none';
                        if (typeof myChart !== 'undefined') {                                    
                            myChart.destroy();
                        }
                        var d = new Date();
                        startMillis = d.getTime(); 
                        xmlhttp.open("GET","RANMateMetrics_MetricsDataSet.php?query="+query,true);
                        xmlhttp.send();

                        // construct a suitable query
                        // do some clever xmlhttp stuff

//                        var img = document.getElementById(id);
//                        img.style.visibility = (visible ? 'visible' : 'hidden');
                    }
                }
            }
        }
    }
}


function formatGraphLine(label, values) {
    var lineColour = dynamicColors();
    return {
//                    label: 'VF_1',
                    label: label,
                    fill: false,
                    lineTension: 0,
//                    borderColor: "rgba(75,192,192,1)",
                    borderColor: lineColour,
                    backgroundColor: lineColour,  // even though we don't want a background colour on the graph, we need this here so that the legend box is filled
                    pointBorderWidth: 0.5,
                    pointRadius: 0,
                    pointHoverRadius: 5,
                    pointHitRadius: 5,
                    borderWidth: 2,
                    data: values
                };

}

var dynamicColors = function() {
    var r = Math.floor(Math.random() * 255);
    var g = Math.floor(Math.random() * 255);
    var b = Math.floor(Math.random() * 255);
    return "rgba(" + r + "," + g + "," + b + ",1)";
}