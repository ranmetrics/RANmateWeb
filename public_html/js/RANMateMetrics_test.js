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
var yLabelTitle = '';

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

function showSites(justNowSelected) {
    //console.log("showSites called with the last selected metric being " + justNowSelected);
    console.log("showSites called with metrics " + $('#metric').val() + " and currentMetricType=" + currentMetricType);
    if (justNowSelected == "") {
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
            if (this.readyState == 4 && this.status === 200) {
                //console.log("showSites() received response from server: " + this.responseText);
                console.log("Site List rebuilt because thisMetricType=" + thisMetricType + " and currentMetricType=" + currentMetricType);
                document.getElementById("site").innerHTML = this.responseText;
                document.getElementById("site").selectedIndex = -1;
                $('#site').multiselect('rebuild');
            }
        };

        // Parse all the selected metrics to check for conflicts
        // Buddy, the metric with the fewest sites should be listed first in the drop down so that metric groups with more
        var buddyMetricSelected = false;
        var pingOrCounterMetricSelected = false;
        previousMetricTypes = null;
        for (i = 0; i < $('#metric').val().length; i++) {
            selectedMetric = $('#metric').val()[i];
            if (selectedMetric.startsWith('Counter-')) {
               thisMetricType = "Counter";
               pingOrCounterMetricSelected = true;
            } else if (selectedMetric.startsWith('Ping-')) {
               thisMetricType = "Ping";
               pingOrCounterMetricSelected = true;
            } else if (selectedMetric.startsWith('Buddy-')) {
               thisMetricType = "Buddy";
               buddyMetricSelected = true;
            } else if (selectedMetric.startsWith('Femto-'))
               thisMetricType = "Femto";
            //console.log("Processing " + selectedMetric + ". thisMetricType=" + thisMetricType);
            if (previousMetricTypes != null) {
                // if all the metrics are not either all Femto-metrics or all non-Femto metrics
                if (((thisMetricType === 'Femto') && (previousMetricTypes !== 'Femto')) || ((previousMetricTypes === 'Femto') && (thisMetricType !== 'Femto'))) { // ||
//                     (Femto-packets )   {
                    alert("Femto and non-Femto metrics cannot be selected together");
//                    document.getElementById("site").innerHTML = "<!DOCTYPE html><html><body><option>Invalid Metric Combination</option></body></html>";
                    document.getElementById("site").innerHTML = "<!DOCTYPE html><html><body></body></html>";
                    document.getElementById("site").selectedIndex = -1;
                    $('#site').multiselect('rebuild');
                    thisMetricType = "";
                    return;
                } else if (($('#metric').val().toString().indexOf('Femto-packets') >= 0) && ($('#metric').val().toString().indexOf('Femto-poe') >= 0)) {
                    alert("Packets and PoE cannot be displayed on the same graph.\ PoE values are too small compared to Packet values");
                    document.getElementById("site").innerHTML = "<!DOCTYPE html><html><body></body></html>";
                    document.getElementById("site").selectedIndex = -1;
                    $('#site').multiselect('rebuild');
                    thisMetricType = "";                    
                }
            } else {
                previousMetricTypes = thisMetricType;
            }
        }

        // Added by MW 17/4 Reuses 'thisMetricType' perhaps a little confusing but it means I dont; have to make any destructive changes to the later block of code
        if (justNowSelected.startsWith('Counter-')) {
           thisMetricType = "Counter";
        } else if (justNowSelected.startsWith('Ping-')) {
           thisMetricType = "Ping";
        } else if (justNowSelected.startsWith('Buddy-')) {
           thisMetricType = "Buddy";
        } else if (justNowSelected.startsWith('Femto-')) {
           thisMetricType = "Femto";
        } 

        // Determine what components should be displayed
        // console.log("Str=" + str + ", currentMetricType=" + currentMetricType);
        if (thisMetricType === "Counter") {
            iface.style.display = "block";
            iface.style.margin = "10px 0px 0px 0px";    // no idea why we now need a 10px top border instead of 5px to keep it inline
            ifaceLabel.style.display = "block";            
            $('#interfacewrapper').show();
        } else {
            iface.style.display = 'none';
            ifaceLabel.style.display = 'none';            
            $('#interfacewrapper').hide();
        }
        if (((thisMetricType === "Counter") || (thisMetricType === "Ping")) && ((currentMetricType !== "Counter") && (currentMetricType !== "Ping"))) { 
            console.log("Need to rebuild Site list for Counter/Ping metric");
            clearTickBoxes();
            cellNum.style.display = 'none';
            opCoName.style.display = 'none';
            V.style.display = O.style.display = T.style.display = E.style.display = 'none';
            fap1.style.display = fap2.style.display = fap3.style.display = fap4.style.display = 'none';
            fap5.style.display = fap6.style.display = fap7.style.display = fap8.style.display = 'none';
            //iface.style.display = "block";
            //iface.style.margin = "10px 0px 0px 0px";    // no idea why we now need a 10px top border instead of 5px to keep it inline
            //ifaceLabel.style.display = "block";
            //$('#interfacewrapper').show();
            if (pingOrCounterMetricSelected && buddyMetricSelected) {
                console.log("Calling RANMateMetrics_SiteList_test.php with group=Mixed");            
                xmlhttp.open("GET","RANMateMetrics_SiteList_test.php?group=Mixed",true);
            } else {
                console.log("Calling RANMateMetrics_SiteList_test.php with group=" + selectedMetric);            
                xmlhttp.open("GET","RANMateMetrics_SiteList_test.php?group="+selectedMetric,true);
            }
            xmlhttp.send();
        } else if ((thisMetricType === "Buddy") && (currentMetricType !== "Buddy")) { 
            console.log("Need to rebuild Site list for Buddy metric");
            clearTickBoxes();
            cellNum.style.display = 'none';
            opCoName.style.display = 'none';
            V.style.display = O.style.display = T.style.display = E.style.display = 'none';
            fap1.style.display = fap2.style.display = fap3.style.display = fap4.style.display = 'none';
            fap5.style.display = fap6.style.display = fap7.style.display = fap8.style.display = 'none';
            //iface.style.display = "block";
            //iface.style.margin = "10px 0px 0px 0px";    // no idea why we now need a 10px top border instead of 5px to keep it inline
            //ifaceLabel.style.display = "block";
            //$('#interfacewrapper').show();
            if (pingOrCounterMetricSelected && buddyMetricSelected) {
                console.log("Calling RANMateMetrics_SiteList_test.php with group=Mixed");            
                xmlhttp.open("GET","RANMateMetrics_SiteList_test.php?group=Mixed",true);
            } else {
                console.log("Calling RANMateMetrics_SiteList_test.php with group=" + selectedMetric);            
                xmlhttp.open("GET","RANMateMetrics_SiteList_test.php?group="+selectedMetric,true);
            }
            xmlhttp.send();
        } 
        /* else if ((thisMetricType === "Ping") && (currentMetricType !== "Ping")) {
            currentMetricType = "Ping";
            clearTickBoxes();
            cellNum.style.display = 'none';
            opCoName.style.display = 'none';
            iface.style.display = 'none';
            ifaceLabel.style.display = 'none';
            V.style.display = O.style.display = T.style.display = E.style.display = 'none';
            fap1.style.display = fap2.style.display = fap3.style.display = fap4.style.display = 'none';
            fap5.style.display = fap6.style.display = fap7.style.display = fap8.style.display = 'none';
            $('#interfacewrapper').hide();
            xmlhttp.open("GET","RANMateMetrics_SiteList_test.php?group="+str,true);
            xmlhttp.send();
        } */ else if ((thisMetricType === "Femto") && (currentMetricType !== "Femto")) { // Femto metric
            //currentMetricType = "Femto";
            cellNum.style.display = 'block';
            opCoName.style.display = 'block';
            V.style.display = O.style.display = T.style.display = E.style.display = 'block';
            fap1.style.display = fap2.style.display = fap3.style.display = fap4.style.display = 'block';
            fap5.style.display = fap6.style.display = fap7.style.display = fap8.style.display = 'block';
            V.style.visibility = O.style.visibility = T.style.visibility = E.style.visibility = 'visible';
            fap1.style.visibility = fap2.style.visibility = fap3.style.visibility = fap4.style.visibility = 'visible';
            fap5.style.visibility = fap6.style.visibility = fap7.style.visibility = fap8.style.visibility = 'visible';
            //iface.style.display = 'none';
            //ifaceLabel.style.display = 'none';
            //$('#interfacewrapper').hide();
            // this PHP call is included in the if check since we don't want to call it and reset the list if the user isn't changing from Femto -> Router stats or vice versa.
            xmlhttp.open("GET","RANMateMetrics_SiteList_test.php?group="+selectedMetric,true);
            xmlhttp.send();
        } else {
            console.log("Site List won't be rebuilt because the new MetricType=" + thisMetricType + " and the existing MetricType=" + currentMetricType);
        }
        currentMetricType = thisMetricType;
    }
}

function updateOpCoCells(str) {
    // console.log("updateOpCoCells() called with str=" + str);
    //console.log("updateOpCoCells() called with sites " + $('#site').val());
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
                console.log("updateOpCoCells() received response from server: " + this.responseText);
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
        // (site_id = 'Bishopsgate-Floor 1' or site_id = 'Bishopsgate-Floor 3')
        siteStr = "(site_id = ";
        for (i = 0; i < $('#site').val().length; i++) {
            if (i > 0) {
                siteStr = siteStr + " || site_id = ";
            }
            selectedSite = $('#site').val()[i];
            console.log(selectedSite + " contains " + (selectedSite.match(/\-/g) || []).length + " dashes");
            if (((selectedSite.match(/\-/g) || []).length > 1) && ($('#site').val().length > 1)){
                alert("Switches with '-' in the site/floor name can't be included in multiple selections");
            } else {
                // console.log("Switch " + selectedSite + " does not have a dash in the name or is a single selection");
            }
            siteStr = siteStr + '\'' + selectedSite + '\'';
        }
        siteStr = siteStr + ')';

        // console.log("RANMateMetrics_OpCoCellList_test.php called with: " + siteStr);
        xmlhttp.open("GET","RANMateMetrics_OpCoCellList_test.php?switches="+encodeURIComponent(siteStr),true);
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
    //console.log("showInterfaces called with " + str);
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
                    $('#interface').multiselect('rebuild');
                }
            };
            xmlhttp.open("GET","RANMateMetrics_InterfaceList.php?site="+encodeURIComponent(str),true);
            xmlhttp.send();
            // hardcoded before the above was redesigned
            // document.getElementById("interface").innerHTML = "<!DOCTYPE html><html><head></head><body><option value=ge-0/0/15>ge-0/0/15</option></body></html>";
            //$('#interface').multiselect('rebuild');
        }
    }
}

function initPage() {
    clearTickBoxes();
    document.getElementById("metric").selectedIndex = 0;  // was previously 1
    // so that the metrics drop down is cleared when the page is refreshed
    $('#metric').multiselect('deselectAll', false);
    $('#metric').multiselect('updateButtonText');
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
    yLabelTitle = ''; // clear the label, just in case
    var metric = document.getElementById("metric").value;
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
//                            var siteOnly = site.substring(0, site.indexOf(' - '));
//                            var floorOnly = site.substring(site.indexOf(' - ') + 3);

//                            var vfChecked = document.getElementById('Vodafone').checked;
//                            var o2Checked = document.getElementById('O2').checked;
//                            var thChecked = document.getElementById('Three').checked;
//                            var eeChecked = document.getElementById('EE').checked;
                            var vfChecked = document.getElementById(0).checked;
                            var o2Checked = document.getElementById(1).checked;
                            var thChecked = document.getElementById(2).checked;
                            var eeChecked = document.getElementById(3).checked;
                            var metricName = metric.substring(6);

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
                                    alert("At least 1 Femto Number must be ticked")
                                    return;
                                } else {
                                    var cellList = new Array();
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

//                                    query = "SELECT measurement_time" + cells + " FROM metrics." + metric.substring(6) +
//                                            " WHERE " + metric.substring(6) + ".site_id=(SELECT SwitchIP from `ranmate-femto`.customer_config where customer_config.Site='" + siteOnly + "' AND customer_config.SwitchLocation='" + floorOnly + "' GROUP BY SwitchIP) " +
//                                            "AND measurement_time BETWEEN '" + startDateTime + "' AND '" + endDateTime + "' " +
//                                            "GROUP BY measurement_time;";
                                    // siteFloorStr = "((customer_config.Site = ";
                                    // siteFloorStr = siteFloorStr + ')';

                                    if ($('#site').val().length > 1) { // this is going to be tough, pivot needed

                                        var cellList = new Array();
                                        if (vfChecked && fap1Checked) cellList.push(new Array('cell_0','VF_1'));
                                        if (o2Checked && fap1Checked) cellList.push(new Array('cell_1','O2_1'));
                                        if (thChecked && fap1Checked) cellList.push(new Array('cell_2','3_1'));
                                        if (eeChecked && fap1Checked) cellList.push(new Array('cell_3','EE_1'));
                                        if (vfChecked && fap2Checked) cellList.push(new Array('cell_4','VF_2'));
                                        if (o2Checked && fap2Checked) cellList.push(new Array('cell_5','O2_2'));
                                        if (thChecked && fap2Checked) cellList.push(new Array('cell_6','3_2'));
                                        if (eeChecked && fap2Checked) cellList.push(new Array('cell_7','EE_2'));
                                        if (vfChecked && fap3Checked) cellList.push(new Array('cell_8','VF_3'));
                                        if (o2Checked && fap3Checked) cellList.push(new Array('cell_9','O2_3'));
                                        if (thChecked && fap3Checked) cellList.push(new Array('cell_10','3_3'));
                                        if (eeChecked && fap3Checked) cellList.push(new Array('cell_11','EE_3'));
                                        if (vfChecked && fap4Checked) cellList.push(new Array('cell_12','VF_4'));
                                        if (o2Checked && fap4Checked) cellList.push(new Array('cell_13','O2_4'));
                                        if (thChecked && fap4Checked) cellList.push(new Array('cell_14','3_4'));
                                        if (eeChecked && fap4Checked) cellList.push(new Array('cell_15','EE_4'));
                                        if (vfChecked && fap5Checked) cellList.push(new Array('cell_16','VF_5'));
                                        if (o2Checked && fap5Checked) cellList.push(new Array('cell_17','O2_5'));
                                        if (thChecked && fap5Checked) cellList.push(new Array('cell_18','3_5'));
                                        if (eeChecked && fap5Checked) cellList.push(new Array('cell_19','EE_5'));
                                        if (vfChecked && fap6Checked) cellList.push(new Array('cell_20','VF_6'));
                                        if (o2Checked && fap6Checked) cellList.push(new Array('cell_21','O2_6'));
                                        if (thChecked && fap6Checked) cellList.push(new Array('cell_22','3_6'));
                                        if (eeChecked && fap6Checked) cellList.push(new Array('cell_23','EE_6'));
                                        if (vfChecked && fap7Checked) cellList.push(new Array('cell_24','VF_7'));
                                        if (o2Checked && fap7Checked) cellList.push(new Array('cell_25','O2_7'));
                                        if (thChecked && fap7Checked) cellList.push(new Array('cell_26','3_7'));
                                        if (eeChecked && fap7Checked) cellList.push(new Array('cell_27','EE_7'));
                                        if (vfChecked && fap8Checked) cellList.push(new Array('cell_28','VF_8'));
                                        if (o2Checked && fap8Checked) cellList.push(new Array('cell_29','O2_8'));
                                        if (thChecked && fap8Checked) cellList.push(new Array('cell_30','3_8'));
                                        if (eeChecked && fap8Checked) cellList.push(new Array('cell_31','EE_8'));

                                        // console.log("cellList has " + cellList.length + " entries which are " + cellList.toString());
                                        var columnsStr = "";
                                        for (i = 0; i < $('#site').val().length; i++) {
                                            selectedSite = $('#site').val()[i].replace(" - ", "-");
                                            siteOnly = selectedSite.substring(0, selectedSite.indexOf(' - '));
                                            floorOnly = selectedSite.substring(selectedSite.indexOf(' - ') + 3);
                                            if (i == 0) {
                                                // siteFloorStr = siteFloorStr + " || (customer_config.Site = ";
                                                // siteFloorStr = '\'' + selectedSite.replace(" - ", "-") + '\'';
                                                siteFloorStr = '\'' + selectedSite + '\'';
                                                for (j = 0; j < cellList.length; j++) {
                                                    columnName = selectedSite + ' ' + cellList[j][1];
                                                    if (j == 0) {
                                                        pivotStr = "\n case when " + metricName + ".site_name = \'" + selectedSite + "\' then " + metricName + "." + cellList[j][0] + " end AS `" + columnName + '`';
                                                    } else {
                                                        pivotStr += ",\n case when " + metricName + ".site_name = \'" + selectedSite + "\' then " + metricName + "." + cellList[j][0] + " end AS `" + columnName + '`';
                                                    }
                                                    columnsStr += ",\n sum(`" + columnName + "`) AS `" + columnName + '`';
                                                }
                                            } else {
                                                // siteFloorStr = siteFloorStr + '\'' + siteOnly + "\' AND customer_config.SwitchLocation = \'" + floorOnly + '\')';
                                                // siteFloorStr += ',\'' + selectedSite.replace(" - ", "-") + '\'';
                                                siteFloorStr += ',\'' + selectedSite + '\'';
                                                for (j = 0; j < cellList.length; j++) {
                                                    columnName = selectedSite + ' ' + cellList[j][1];
                                                    pivotStr += ",\n case when " + metricName + ".site_name = \'" + selectedSite + "\' then " + metricName + "." + cellList[j][0] + " end AS `" + columnName + '`';
                                                    columnsStr += ",\n sum(`" + columnName + "`) AS `" + columnName + '`';
                                                }
                                            }
                                        }

                                        query = "drop view if exists " + metricName + "_tmp;\n" +
                                                "create view " + metricName + "_tmp as ( SELECT measurement_time, " +
                                                // Replace the next line with auto generated 'case' - now is the case from the previous loop?
                                                //" case when packets.site_name = 'Bishopsgate-Floor 1' then packets.cell_0 end AS Bishop1_VF_1," +
                                                //" case when packets.site_name = 'Bishopsgate-Floor 2' then packets.cell_0 end AS Bishop2_VF_1" +
                                                pivotStr +
                                                //+ cells + \n\
                                                "\n FROM metrics." + metricName + 
                                                //" WHERE " + metric.substring(6) + ".site_id IN (SELECT SwitchIP from `ranmate-femto`.customer_config where " + siteFloorStr + " GROUP BY SwitchIP) " +
                                                " WHERE " + metricName + ".site_name IN (" + siteFloorStr + ") " +
                                                "AND measurement_time BETWEEN '" + startDateTime + "' AND '" + endDateTime + "' " +
                                                "ORDER BY measurement_time, site_id);\n" +
                                                //"drop view if exists packets_tmp_pivot;\n" +
                                                //"create view packets_tmp_pivot as (" +
                                                "select measurement_time" +
                                                columnsStr +
//                                                "sum(Bishop1_VF_1) AS Bishop1_VF_1," +
//                                                "sum(Bishop2_VF_1) AS Bishop2_VF_1 " +
                                                " from " + metricName + "_tmp " +
                                                "group by measurement_time";
                                                //+ ");"
                                                //"select measurement_time,Bishop1_VF_1,Bishop2_VF_1 from packets_tmp_pivot";

                                        /* drop view if exists packet_tmp;
                                        create view packet_tmp as (
                                        select measurement_time,
                                        case when packets.site_id = '10.10.5.11' then packets.cell_0 end AS `10.10.5.11 VF_1`,
                                        case when packets.site_id = '10.10.5.12' then packets.cell_0 end AS `10.10.5.12 VF_1`
                                        from metrics.packets
                                        where (site_id in (select SwitchIP from `ranmate-femto`.customer_config
                                        where ((customer_config.Site = 'Bishopsgate' and customer_config.SwitchLocation = 'Floor 1') or
                                        (customer_config.Site = 'Bishopsgate' and customer_config.SwitchLocation = 'Floor 2'))
                                        group by SwitchIP))
                                        and measurement_time between '2017-03-22 07:10' and '2017-03-23 13:10'
                                        order by measurement_time
                                        );

                                        drop view if exists packet_tmp_pivot;
                                        create view packet_tmp_pivot as (
                                        select measurement_time,
                                        sum(`10.10.5.11 VF_1`) AS `10.10.5.11 VF_1`,
                                        sum(`10.10.5.12 VF_1`) AS `10.10.5.12 VF_1`
                                        from packet_tmp
                                        group by measurement_time
                                        ); */

                                    } else { // just the usuual single site
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

//                                        query = "SELECT measurement_time" + cells + " FROM metrics." + metric.substring(6) +
//                                                " WHERE " + metric.substring(6) + ".site_id=(SELECT SwitchIP from `ranmate-femto`.customer_config where customer_config.Site='" + siteOnly + "' AND customer_config.SwitchLocation='" + floorOnly + "' GROUP BY SwitchIP) " +
//                                                "AND measurement_time BETWEEN '" + startDateTime + "' AND '" + endDateTime + "' " +
//                                                "GROUP BY measurement_time;";
                                        query = "SELECT measurement_time" + cells + " FROM metrics." + metricName +
                                                " WHERE " + metricName + ".site_name = '" + site.replace(" - ", "-") +
                                                "' AND measurement_time BETWEEN '" + startDateTime + "' AND '" + endDateTime + "' " +
                                                "GROUP BY measurement_time;";
                                    }
                                    console.log("showGraph() SQL is " + query);
                                }
                            }
                        } else { // Separate the Backhaul metrics into 1 Metrics : 1 Site, 1 Metrics : N Sites, N Metrics : 1 Site and N Metrics : N Sites
                            //console.log("#metrics=" + $('#metric').val().length + ", and #sites=" + $('#site').val().length)
                            // 1 Metric : 1 Site
                            if (($('#metric').val().length == 1) && ($('#site').val().length == 1) ) {                                                          
                                if (metric.substring(0,6) == "Buddy-") { 
                                    query = getSQL_Buddy_SingleMetric_SingleSite(metric, site, startDateTime, endDateTime);
                                    //console.log("Buddy SQL is " + query);
                                } else if (metric.substring(0,5) == "Ping-"){  // Backhaul Counter Metric
                                    query = getSQL_Ping_SingleMetric_SingleSite(metric, site, startDateTime, endDateTime);
                                    //console.log("Ping SQL is " + query);
                                } else if (metric.substring(0,8) == "Counter-"){  // Backhaul Counter Metric
                                    var interface = document.getElementById("interface").value;
                                    if (interface == "") {
                                        alert("An interface must be selected");
                                        return;
                                    } else {
                                        query = getSQL_Counter_SingleMetric_SingleSite(metric, site, interface, startDateTime, endDateTime);
                                    }
                                    //console.log("Counter SQL is " + query);
                                }
                            // 1 Metric : N Sites
                            } else if (($('#metric').val().length == 1) && ($('#site').val().length > 1) ) {
                                if (metric.substring(0,5) == "Ping-") { // Router to Router Ping
                                    query = getSQL_Ping_SingleMetric_MultiSites(metric, $('#site').val(), startDateTime, endDateTime);
                                    console.log("Ping SQL is " + query);
                                } else if (metric.substring(0,6) == "Buddy-") { 
                                    query = getSQL_Buddy_SingleMetric_MultiSites(metric, $('#site').val(), startDateTime, endDateTime);
                                    console.log("Buddy SQL is " + query);
                                } else if (metric.substring(0,8) == "Counter-"){  // Backhaul Counter Metric
                                    query = getSQL_Counter_SingleMetric_MultiSites(metric, $('#site').val(), startDateTime, endDateTime);
                                    console.log("Counter SQL is " + query);                                    
                                } else {
                                    //alert("Multiple Sites are not yet supported for Counter metrics");
                                    alert("Unexpected Metric Group");
                                    return;
                                }
                            // N Metrics : 1 Site
                            } else if (($('#metric').val().length > 1) && ($('#site').val().length == 1) ) {
                                // if metrics all the same type
                                metricTypes = getMetricTypes($('#metric').val());
                                if (metricTypes.length == 1) {
                                    console.log("Only " + metricTypes[0] + " metrics required");
                                    if (metricTypes[0] == "Buddy") {
                                        if ($('#metric').val().length > 3) {
                                            alert("The maximum number of Buddy metrics that can be displayed on the same graph is 3");
                                            return;
                                        } else {
                                            query = getSQL_Buddy_MultiMetrics_SingleSite($('#metric').val(), site, startDateTime, endDateTime);
                                            if (query === null) { return; }
                                            console.log("Buddy SQL is " + query);
                                        }
                                    } else if (metricTypes[0] == "Ping") {
                                        query = getSQL_Ping_MultiMetrics_SingleSite($('#metric').val(), site, startDateTime, endDateTime);
                                    } else if (metricTypes[0] == "Counter") {
                                        var interface = document.getElementById("interface").value;
                                        if (interface == "") {
                                            alert("An interface must be selected");
                                            return;
                                        } else {
                                            query = getSQL_Counter_MultiMetrics_SingleSite($('#metric').val(), site, interface, startDateTime, endDateTime);
                                            console.log("Counter SQL is " + query);
                                        }
                                    }
                                } else {
                                    query = getSQL_Mixed_MultiMetrics_SingleSite($('#metric').val(), site, startDateTime, endDateTime);
                                    if (query === null) { return; }
                                    console.log("Mixed SQL is " + query);
                                }
                            // N Metrics : N Sites
                            } else if (($('#metric').val().length > 1) && ($('#site').val().length > 1) ) {
                                alert("Graphing multiple metrics for multiple sites is not supported");
                                return;
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
                                console.log("showGraph() data=" + this.responseText.substring(0,500));
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
                                                // add the data point to a Map, null or missing values will get "spanned" (spanGap)
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
                                    if ($('#site').val().length > 1) {
                                        siteLabel = $('#site').val().toString();
                                    } else {
                                        siteLabel = site;
                                    }
                                    if ($('#metric').val().length > 1) {
                                        metricLabel = $('#metric').val().toString();
                                    } else {
                                        metricLabel = metric;
                                    }
                                    var graphLines = new Array();
                                    // add the collection to graphLines
                                    for (var [key, value] of graphValues) {
                                        // console.log("Processing " + key + " value=" + value);
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
                                                //text: site + " :: " + metric,
                                                text: siteLabel + " :: " + metricLabel,
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
                        // xmlhttp.open("GET","RANMateMetrics_MetricsDataSet_test.php?query="+query,true); 
                        xmlhttp.open("GET","RANMateMetrics_MetricsDataSet_test.php?query="+encodeURIComponent(query),true);
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

function getMetricTypes(metrics) {
    var metricsTypeSet = new HashSet();
    for (var i = 0; i < metrics.length; i++) {
        console.log("Adding metric type " + metrics[i].substring(0, metrics[i].indexOf('-')) + " to metrics set");
        metricsTypeSet.add(metrics[i].substring(0, metrics[i].indexOf('-')));
    }    
    return metricsTypeSet.values();    
}

function metricsToString(metrics, length) {
    var metricsString = "";
    for (var i = 0; i < metrics.length; i++) {
        if (i == 0) {
            metricsString += metrics[i].substring(length);
        } else {
            metricsString += ", " + metrics[i].substring(length);        
        }
    }    
    return metricsString;
}

/**************************************************/
/*************** PING SQL FUNCS *******************/
/**************************************************/

function getSQL_Ping_SingleMetric_SingleSite(metric, site, startDateTime, endDateTime) {
    return getSQL_Ping_AllScenarios(metric.substring(5), site, startDateTime, endDateTime);
}

function getSQL_Ping_MultiMetrics_SingleSite(metrics, site, startDateTime, endDateTime) {
    return getSQL_Ping_AllScenarios(pingMetricsToString(metrics), site, startDateTime, endDateTime);
}

function getSQL_Ping_AllScenarios(metric, site, startDateTime, endDateTime) {
    yLabelTitle = 'milliseconds';
//    return "SELECT measurement_time, " + metric + " FROM `metrics`.ping WHERE ping.site_name='" + site +
//        "' AND measurement_time BETWEEN '" + startDateTime + "' AND '" + endDateTime + "' GROUP BY measurement_time;";
    return "SELECT measurement_time, " + metric + " FROM metrics.ping WHERE ping.site_name='" + site +
        "' AND measurement_time BETWEEN '" + startDateTime + "' AND '" + endDateTime + "' GROUP BY measurement_time;";
}

function getSQL_Ping_SingleMetric_MultiSites(metric, sites, startDateTime, endDateTime) {
    // console.log("cellList has " + cellList.length + " entries which are " + cellList.toString());
    var columnsStr = "";
    var metricName = metric.substring(5);
    var tableName = 'ping'; // all ping metrics are columns in the ping table
    for (i = 0; i < sites.length; i++) {
        selectedSite = sites[i].replace(" - ", "-");
        if (i == 0) {
            siteFloorStr = '\'' + selectedSite + '\'';
            //columnName = selectedSite;
            pivotStr = "\n case when " + tableName + ".site_name = \'" + selectedSite + "\' then " + metricName + " end AS `" + selectedSite + '`';
            columnsStr += ",\n sum(`" + selectedSite + "`) AS `" + selectedSite + '`';
        } else {
            siteFloorStr += ',\'' + selectedSite + '\'';
            pivotStr += ",\n case when " + tableName + ".site_name = \'" + selectedSite + "\' then " + metricName + " end AS `" + selectedSite + '`';
            columnsStr += ",\n sum(`" + selectedSite + "`) AS `" + selectedSite + '`';
        }
    }

    query = "drop view if exists " + metricName + "_tmp;\n" +
            "create view " + metricName + "_tmp as ( SELECT measurement_time, " +
            pivotStr +
            "\n FROM metrics." + tableName + 
            " WHERE " + tableName + ".site_name IN (" + siteFloorStr + ") " +
            "AND measurement_time BETWEEN '" + startDateTime + "' AND '" + endDateTime + "' " +
            "ORDER BY measurement_time, site_id);\n" +
            "select measurement_time" +
            columnsStr +
            " from " + metricName + "_tmp " +
            "group by measurement_time";
    return query;
}

function pingMetricsToString(metrics) {
    return metricsToString(metrics, 5);
}

/**************************************************/
/************* COUNTER SQL FUNCS ******************/
/**************************************************/

function getSQL_Counter_SingleMetric_SingleSite(metric, site, interface, startDateTime, endDateTime) {
    return getSQL_Counter_AllScenarios(metric.substring(8), site, interface, startDateTime, endDateTime);
}

function getSQL_Counter_MultiMetrics_SingleSite(metrics, site, interface, startDateTime, endDateTime) {
    return getSQL_Counter_AllScenarios(counterMetricsToString(metrics), site, interface, startDateTime, endDateTime);
}

function getSQL_Counter_SingleMetric_MultiSites(metric, sites, startDateTime, endDateTime) {
    // console.log("cellList has " + cellList.length + " entries which are " + cellList.toString());
    var columnsStr = "";
    var metricName = metric.substring(metric.indexOf('-') + 1).toLowerCase();
    var tableName = 'router_counters'; // all ping metrics are columns in the ping table
    for (i = 0; i < sites.length; i++) {
        selectedSite = sites[i].replace(" - ", "-");
        if (i == 0) {
            siteFloorStr = '\'' + selectedSite + '\'';
            //columnName = selectedSite;
            pivotStr = "\n case when " + tableName + ".site_name = \'" + selectedSite + "\' then " + metricName + " end AS `" + selectedSite + '`';
            columnsStr += ",\n sum(`" + selectedSite + "`) AS `" + selectedSite + '`';
        } else {
            siteFloorStr += ',\'' + selectedSite + '\'';
            pivotStr += ",\n case when " + tableName + ".site_name = \'" + selectedSite + "\' then " + metricName + " end AS `" + selectedSite + '`';
            columnsStr += ",\n sum(`" + selectedSite + "`) AS `" + selectedSite + '`';
        }
    }

    query = "drop view if exists " + metricName + "_tmp;\n" +
            "create view " + metricName + "_tmp as ( SELECT measurement_time, " +
            pivotStr +
            "\n FROM metrics." + tableName + 
            " WHERE " + tableName + ".site_name IN (" + siteFloorStr + ") " +
            "AND measurement_time BETWEEN '" + startDateTime + "' AND '" + endDateTime + "' " +
            "ORDER BY measurement_time, site_id);\n" +
            "select measurement_time" +
            columnsStr +
            " from " + metricName + "_tmp " +
            "group by measurement_time";
    return query;
}

function getSQL_Counter_AllScenarios(metric, site, interface, startDateTime, endDateTime) {
//    return "SELECT measurement_time, " + metric + " FROM metrics.router_counters WHERE router_counters.site_name='" + site + 
//            "' AND router_counters.interface='" + interface + "' AND measurement_time BETWEEN '" + startDateTime + 
//            "' AND '" + endDateTime + "' GROUP BY measurement_time;";
    return "SELECT measurement_time, " + metric + " FROM metrics.router_counters WHERE router_counters.site_name='" + site + 
            "' AND router_counters.interface='" + interface + "' AND measurement_time BETWEEN '" + startDateTime + 
            "' AND '" + endDateTime + "' GROUP BY measurement_time;";
}

function counterMetricsToString(metrics) {
    return metricsToString(metrics, 8);
}

/**************************************************/
/*************** BUDDY SQL FUNCS ******************/
/**************************************************/

function getSQL_Buddy_SingleMetric_SingleSite(metric, site, startDateTime, endDateTime) {
    //table = metric.substring(0,metric.indexOf('_')).replace('-', '_').toLowerCase(); str.replace(/foo/g, "bar")
    table = metric.substring(0,metric.indexOf('_')).replace(/-/g, "_").toLowerCase();
    field = metric.substring(metric.indexOf('_') + 1).toLowerCase();
    if (field === 'loss_pct') { yLabelTitle = 'percentage packet loss'; } 
    else if (field === 'jitter') { yLabelTitle = 'milliseconds'; } 
    else if (table.endsWith('latency')) { yLabelTitle = 'milliseconds'; } 
    return "SELECT " + table + ".measurement_time, " + field + " FROM " + table + " WHERE " + table + ".site_name='" + site + "' AND " + 
            table + ".measurement_time BETWEEN '" + startDateTime + "' AND '" + endDateTime + "' GROUP BY " + table + ".measurement_time;";  
    //return getSQL_Buddy_AllScenarios(table, table, field, table + ".site_name='" + site + "'", startDateTime, endDateTime);
}

function getSQL_Buddy_MultiMetrics_SingleSite(metrics, site, startDateTime, endDateTime) {
    fields = buddyMetricsToFieldsArray(metrics);
    fieldsString = buddyMetricsToFieldsString(metrics);
    if (fields.indexOf('loss_pct') >= 0) { yLabelTitle = 'percentage packet loss/milliseconds'; } 
    else { yLabelTitle = 'milliseconds'; } 
//    return getSQL_Buddy_AllScenarios(metrics[0].substring(0, metrics[0].indexOf('_')).replace('-', '_').toLowerCase(), tables, fields, buddyMetricsToTableSitesString(metrics, site), startDateTime, endDateTime);
    var returnString;
    // set for testing only
    //startDateTime = '2017-04-01 20:58:00';
    //endDateTime = '2017-04-01 21:21:00';
    
    distinctTables = buddyMetricsToTableSet(metrics);
    //console.log("Distinct tables are " + distinctTables.toString);
    console.log("There are " + distinctTables.length + " distinct tables");
    if (distinctTables.length == 1) {
        // all the buddy metrics are in the same table
//        returnString = "SELECT " + distinctTables[0] + ".measurement_time, " + fieldsString + " FROM metrics." + distinctTables[0] + 
//                " WHERE " + distinctTables[0] + ".site_name='" + site + "' AND " + distinctTables[0] + ".measurement_time BETWEEN '" + 
//                startDateTime + "' AND '" + endDateTime + "' ORDER BY " + distinctTables[0] + ".measurement_time;";  
        returnString = "SELECT measurement_time, " + fieldsString + " FROM metrics." + distinctTables[0] + " WHERE site_name='" + site + 
                "' AND measurement_time BETWEEN '" + startDateTime + "' AND '" + endDateTime + "' ORDER BY measurement_time;";  
    } else {
        tables = buddyMetricsToTablesArray(metrics);
        returnString = "SELECT * FROM (";
        if (fields.length == 2) {
            /*for (int i=0; i < tables.length; i++) {
                if (i > 0) { returnString += "\n UNION ALL"; }
                returnString += "SELECT " + tables[i] + ".measurement_time, " + fields + " FROM " + tables[0] + 
            } */
            returnString += "SELECT " + tables[0] + ".measurement_time, " + fieldsString + " FROM metrics." + tables[0] + " LEFT JOIN metrics." + tables[1] +
                " ON (" + tables[0] + ".measurement_time = " + tables[1] + ".measurement_time AND " + tables[0] + ".site_name = " + tables[1] + ".site_name)" +
                " WHERE " + tables[0] + ".measurement_time BETWEEN '" + startDateTime + "' AND '" + endDateTime + "'" +
                " AND " + tables[0] + ".site_name = '" + site + "' UNION ALL " +
                "SELECT " + tables[1] + ".measurement_time, " + fieldsString + " FROM metrics." + tables[0] + " RIGHT JOIN metrics." + tables[1] +
                " ON (" + tables[0] + ".measurement_time = " + tables[1] + ".measurement_time AND " + tables[0] + ".site_name = " + tables[1] + ".site_name)" +
                " WHERE " + tables[1] + ".measurement_time BETWEEN '" + startDateTime + "' AND '" + endDateTime + "'" +
//                " AND " + tables[1] + ".site_name = '" + site + "' AND " + tables[0] + "." + fields[0] +
                " AND " + tables[1] + ".site_name = '" + site + "' AND " + fields[0] +
                " IS NULL) a order by measurement_time;";
        } else if (fields.length == 3) {
        // 3 table full outer join - http://stackoverflow.com/questions/30497230/how-to-full-outer-join-multiple-tables-in-mysql 
            returnString += "SELECT " + tables[0] + ".measurement_time, " + fieldsString + " FROM metrics." + tables[0] + 
                " LEFT JOIN metrics." + tables[1] +
                " ON (" + tables[0] + ".measurement_time = " + tables[1] + ".measurement_time AND " + tables[0] + ".site_name = " + tables[1] + ".site_name)" + 
                " LEFT JOIN metrics." + tables[2] + 
                " ON (" + tables[0] + ".measurement_time = " + tables[2] + ".measurement_time AND " + tables[0] + ".site_name = " + tables[2] + ".site_name)" +
                " WHERE " + tables[0] + ".measurement_time BETWEEN '" + startDateTime + "' AND '" + endDateTime + "'" +
                " AND " + tables[0] + ".site_name = '" + site + 
                "' UNION ALL " +
                "SELECT " + tables[1] + ".measurement_time, " + fieldsString + " FROM metrics." + tables[1] + 
                " LEFT JOIN metrics." + tables[0] +
                " ON (" + tables[0] + ".measurement_time = " + tables[1] + ".measurement_time AND " + tables[0] + ".site_name = " + tables[1] + ".site_name)" +
                " LEFT JOIN metrics." + tables[2] +
                " ON (" + tables[1] + ".measurement_time = " + tables[2] + ".measurement_time AND " + tables[1] + ".site_name = " + tables[2] + ".site_name)" +
                " WHERE " + tables[1] + ".measurement_time BETWEEN '" + startDateTime + "' AND '" + endDateTime + "'" +
                " AND " + tables[1] + ".site_name = '" + site + 
                "' AND " + fields[0] + " IS NULL " +
                " UNION ALL " +
                "SELECT " + tables[2] + ".measurement_time, " + fieldsString + " FROM metrics." + tables[2] + 
                " LEFT JOIN metrics." + tables[0] +
                " ON (" + tables[0] + ".measurement_time = " + tables[2] + ".measurement_time AND " + tables[0] + ".site_name = " + tables[2] + ".site_name)" +
                " LEFT JOIN metrics." + tables[1] +
                " ON (" + tables[1] + ".measurement_time = " + tables[2] + ".measurement_time AND " + tables[1] + ".site_name = " + tables[2] + ".site_name)" +
                " WHERE " + tables[2] + ".measurement_time BETWEEN '" + startDateTime + "' AND '" + endDateTime + "'" +
                " AND " + tables[2] + ".site_name = '" + site + 
                "' AND " + fields[0] + " IS NULL AND " + fields[1] + " IS NULL " +
                ") a order by measurement_time;";

// nicely formatted for debugging, the same as above, however PHP doesn't like getting the \n s
            /* returnString += "\nSELECT " + tables[0] + ".measurement_time, " + fieldsString + " \nFROM metrics." + tables[0] + 
                "\n LEFT JOIN metrics." + tables[1] +
                " ON (" + tables[0] + ".measurement_time = " + tables[1] + ".measurement_time AND " + tables[0] + ".site_name = " + tables[1] + ".site_name)\n" + 
                " LEFT JOIN metrics." + tables[2] + 
                " ON (" + tables[0] + ".measurement_time = " + tables[2] + ".measurement_time AND " + tables[0] + ".site_name = " + tables[2] + ".site_name)\n" +
                " WHERE " + tables[0] + ".measurement_time BETWEEN '" + startDateTime + "' AND '" + endDateTime + "'\n" +
                " AND " + tables[0] + ".site_name = '" + site + 
                "'\n UNION ALL \n" +
                "SELECT " + tables[1] + ".measurement_time, " + fieldsString + " \nFROM metrics." + tables[1] + 
                "\n LEFT JOIN metrics." + tables[0] +
                " ON (" + tables[0] + ".measurement_time = " + tables[1] + ".measurement_time AND " + tables[0] + ".site_name = " + tables[1] + ".site_name)\n" +
                " LEFT JOIN metrics." + tables[2] +
                " ON (" + tables[1] + ".measurement_time = " + tables[2] + ".measurement_time AND " + tables[1] + ".site_name = " + tables[2] + ".site_name)\n" +
                " WHERE " + tables[1] + ".measurement_time BETWEEN '" + startDateTime + "' AND '" + endDateTime + "'\n" +
                " AND " + tables[1] + ".site_name = '" + site + 
                "'\n AND " + fields[0] + " IS NULL " +
                "\n UNION ALL \n" +
                "SELECT " + tables[2] + ".measurement_time, " + fieldsString + " \nFROM metrics." + tables[2] + 
                " LEFT JOIN metrics." + tables[0] +
                " ON (" + tables[0] + ".measurement_time = " + tables[2] + ".measurement_time AND " + tables[0] + ".site_name = " + tables[2] + ".site_name)\n" +
                " LEFT JOIN metrics." + tables[1] +
                " ON (" + tables[1] + ".measurement_time = " + tables[2] + ".measurement_time AND " + tables[1] + ".site_name = " + tables[2] + ".site_name)\n" +
                " WHERE " + tables[2] + ".measurement_time BETWEEN '" + startDateTime + "' AND '" + endDateTime + "'\n" +
                " AND " + tables[2] + ".site_name = '" + site + 
                "'\n AND " + fields[0] + " IS NULL AND " + fields[1] + " IS NULL " +
                "\n) a order by measurement_time;"; */

/*SELECT * FROM (
SELECT buddy_bandwidth.measurement_time, buddy_bandwidth.loss_pct AS 'loss_pct', buddy_jitter.jitter AS 'jitter', buddy_latency.rtt_mdev AS 'rtt_mdev'
FROM metrics.buddy_bandwidth 
LEFT JOIN metrics.buddy_jitter 
ON (buddy_bandwidth.measurement_time = buddy_jitter.measurement_time AND buddy_bandwidth.site_name = buddy_jitter.site_name) 
LEFT JOIN metrics.buddy_latency 
ON (buddy_bandwidth.measurement_time = buddy_latency.measurement_time AND buddy_bandwidth.site_name = buddy_latency.site_name) 
WHERE buddy_bandwidth.measurement_time BETWEEN '2017-04-15 18:45' AND '2017-04-15 20:45' 
AND buddy_bandwidth.site_name = 'Moor Place' 
#AND (buddy_jitter.jitter IS NULL or buddy_latency.rtt_mdev IS NULL)
UNION ALL
SELECT buddy_jitter.measurement_time, buddy_bandwidth.loss_pct AS 'loss_pct', buddy_jitter.jitter AS 'jitter', buddy_latency.rtt_mdev AS 'rtt_mdev' 
FROM metrics.buddy_jitter 
LEFT JOIN metrics.buddy_bandwidth 
ON (buddy_bandwidth.measurement_time = buddy_jitter.measurement_time AND buddy_bandwidth.site_name = buddy_jitter.site_name) 
LEFT JOIN metrics.buddy_latency 
ON (buddy_jitter.measurement_time = buddy_latency.measurement_time AND buddy_jitter.site_name = buddy_latency.site_name) 
WHERE buddy_jitter.measurement_time BETWEEN '2017-04-15 18:45' AND '2017-04-15 20:45' 
AND buddy_jitter.site_name = 'Moor Place' 
AND buddy_bandwidth.loss_pct IS NULL
UNION ALL
SELECT buddy_latency.measurement_time, buddy_bandwidth.loss_pct AS 'loss_pct', buddy_jitter.jitter AS 'jitter', buddy_latency.rtt_mdev AS 'rtt_mdev' 
FROM metrics.buddy_latency 
LEFT JOIN metrics.buddy_bandwidth 
ON (buddy_bandwidth.measurement_time = buddy_latency.measurement_time AND buddy_bandwidth.site_name = buddy_latency.site_name) 
LEFT JOIN metrics.buddy_jitter 
ON (buddy_latency.measurement_time = buddy_jitter.measurement_time AND buddy_latency.site_name = buddy_jitter.site_name) 
WHERE buddy_latency.measurement_time BETWEEN '2017-04-15 18:45' AND '2017-04-15 20:45' 
AND buddy_latency.site_name = 'Moor Place' 
AND (buddy_bandwidth.loss_pct IS NULL AND buddy_jitter.jitter IS NULL)
) a 
order by measurement_time; */            
        } else {
            console.log("getSQL_Buddy_MultiMetrics_SingleSite() called with too many fields (" + fields.length + "), maximum is 3");
            alert("The maximum number of Buddy metrics that can be displayed on the same graph is 3");
            returnString = null;
        }
    } 
    return returnString;
}

function getSQL_Buddy_SingleMetric_MultiSites(metric, sites, startDateTime, endDateTime) {
    // console.log("cellList has " + cellList.length + " entries which are " + cellList.toString());
    var columnsStr = "";
    var metricName = metric.substring(metric.indexOf('_') + 1).toLowerCase();
    var tableName = metric.substring(0,metric.indexOf('_')).replace(/-/g, "_").toLowerCase();
    for (i = 0; i < sites.length; i++) {
        selectedSite = sites[i].replace(" - ", "-");
        if (i == 0) {
            siteFloorStr = '\'' + selectedSite + '\'';
            //columnName = selectedSite;
            pivotStr = "\n case when " + tableName + ".site_name = \'" + selectedSite + "\' then " + metricName + " end AS `" + selectedSite + '`';
            columnsStr += ",\n sum(`" + selectedSite + "`) AS `" + selectedSite + '`';
        } else {
            siteFloorStr += ',\'' + selectedSite + '\'';
            pivotStr += ",\n case when " + tableName + ".site_name = \'" + selectedSite + "\' then " + metricName + " end AS `" + selectedSite + '`';
            columnsStr += ",\n sum(`" + selectedSite + "`) AS `" + selectedSite + '`';
        }
    }

    query = "drop view if exists " + metricName + "_tmp;\n" +
            "create view " + metricName + "_tmp as ( SELECT measurement_time, " +
            pivotStr +
            "\n FROM metrics." + tableName + 
            " WHERE " + tableName + ".site_name IN (" + siteFloorStr + ") " +
            "AND measurement_time BETWEEN '" + startDateTime + "' AND '" + endDateTime + "' " +
            "ORDER BY measurement_time, site_id);\n" +
            "select measurement_time" +
            columnsStr +
            " from " + metricName + "_tmp " +
            "group by measurement_time";
    return query;
}

function getSQL_Buddy_AllScenarios(measTimeTable, tables, fields, tableSiteNames, startDateTime, endDateTime) {
//    return "SELECT measurement_time, " + fields + " FROM metrics." + tables + " WHERE " + tables + ".site_name='" + site + 
//        "' AND measurement_time BETWEEN '" + startDateTime + "' AND '" + endDateTime + "' GROUP BY measurement_time;";
    return "SELECT " + measTimeTable + ".measurement_time, " + fields + " FROM " + tables + " WHERE " + tableSiteNames + 
        " AND " + measTimeTable + ".measurement_time BETWEEN '" + startDateTime + "' AND '" + endDateTime + "' GROUP BY " + measTimeTable + ".measurement_time;";
}

function buddyMetricsToTablesString(metrics) {
    var tableString = "";
    for (var i = 0; i < metrics.length; i++) {
        if (i == 0) {
            //tableString += "metrics." + metrics[i].substring(0, metrics[i].indexOf('_')).replace('-', '_').toLowerCase();
            tableString += metrics[i].substring(0, metrics[i].indexOf('_')).replace(/-/g, "_").toLowerCase();
        } else {
            //tableString += ", metrics." + metrics[i].substring(0, metrics[i].indexOf('_')).replace('-', '_').toLowerCase();
            tableString += ", " + metrics[i].substring(0, metrics[i].indexOf('_')).replace(/-/g, "_").toLowerCase();
        }
    }    
    return tableString;
}

function buddyMetricsToTablesArray(metrics) {
    var tableArray = new Array();
    for (var i = 0; i < metrics.length; i++) {
        //tableArray[i] = "metrics." + metrics[i].substring(0, metrics[i].indexOf('_')).replace('-', '_').toLowerCase();
        tableArray[i] = metrics[i].substring(0, metrics[i].indexOf('_')).replace(/-/g, "_").toLowerCase();
    }    
    return tableArray;
}

function buddyMetricsToTableSet(metrics) {
    var tableSet = new HashSet();
    //console.log("buddyMetricsToTableSet() called with " + metrics.length + " values: " + metrics.toString());
    for (var i = 0; i < metrics.length; i++) {
        //tableArray[i] = "metrics." + metrics[i].substring(0, metrics[i].indexOf('_')).replace('-', '_').toLowerCase();
        //console.log("Adding " + metrics[i].substring(0, metrics[i].indexOf('_')).replace('-', '_').toLowerCase() + " to table set");
        tableSet.add(metrics[i].substring(0, metrics[i].indexOf('_')).replace(/-/g, "_").toLowerCase());
        console.log("Added " + metrics[i].substring(0, metrics[i].indexOf('_')).replace(/-/g, "_").toLowerCase() + " to table set");
    }    
    return tableSet.values();
}

function buddyMetricsToTableSitesString(metrics, site) {
    var tableSiteString = "";
    for (var i = 0; i < metrics.length; i++) {
        if (i == 0) {
            tableSiteString += metrics[i].substring(0, metrics[i].indexOf('_')).replace(/-/g, "_").toLowerCase() + ".site_name = '" + site + "'";
        } else {
            //tableSiteString += " AND metrics." + metrics[i].substring(0, metrics[i].indexOf('_')).replace('-', '_').toLowerCase() + ".site_name = '" + site + "'";
            tableSiteString += " AND " + metrics[i].substring(0, metrics[i].indexOf('_')).replace(/-/g, "_").toLowerCase() + ".site_name = '" + site + "'";
        }
    }    
    return tableSiteString;
}

function buddyMetricsToFieldsString(metrics) {
    var fieldString = "";
    for (var i = 0; i < metrics.length; i++) {
        fieldName = metrics[i].substring(metrics[i].indexOf('_') + 1).toLowerCase();
        if (i == 0) {
            fieldString += metrics[i].substring(0, metrics[i].indexOf('_')).replace(/-/g, "_").toLowerCase() + "." + fieldName + " AS '" + fieldName + "'";
            //fieldString += metrics[i].substring(metrics[i].indexOf('_') + 1).toLowerCase(); // field name only can be ambiguous
        } else {
            fieldString += ", " + metrics[i].substring(0, metrics[i].indexOf('_')).replace(/-/g, "_").toLowerCase() + "." + fieldName + " AS '" + fieldName + "'";
            //fieldString += ", " + metrics[i].substring(metrics[i].indexOf('_') + 1).toLowerCase(); // field name only can be ambiguous
        }
    }    
    return fieldString;
}

function buddyMetricsToFieldsArray(metrics) {
    var fieldArray = new Array();
    for (var i = 0; i < metrics.length; i++) {
        fieldArray[i] = metrics[i].substring(0, metrics[i].indexOf('_')).replace(/-/g, "_").toLowerCase() + "." + metrics[i].substring(metrics[i].indexOf('_') + 1).toLowerCase();
    }    
    return fieldArray;
}

//function getSQL_Ping_SingleSite(metric, site, startDateTime, endDateTime) {
//    yLabelTitle = 'milliseconds';
//    return "SELECT measurement_time, " + metric.substring(5) + " FROM `metrics`.ping " +
//        //" WHERE ping.public_site_id=(SELECT RouterIP from `ranmate-femto`.customer_config where customer_config.Site='" + site + "' GROUP BY RouterIP) " +
//        " WHERE ping.site_name='" + site +
//        "' AND measurement_time BETWEEN '" + startDateTime + "' AND '" + endDateTime + "' " +
//        "GROUP BY measurement_time;";
//}

//function getSQL_Buddy_SingleMetric_SingleSite(metric, site, startDateTime, endDateTime) {
//    table = metric.substring(0,metric.indexOf('_')).replace('-', '_').toLowerCase();
//    field = metric.substring(metric.indexOf('_') + 1).toLowerCase();
//    if (field === 'loss_pct') { yLabelTitle = 'percentage packet loss'; } 
//    else if (field === 'jitter') { yLabelTitle = 'milliseconds'; } 
//    else if (table.endsWith('latency')) { yLabelTitle = 'milliseconds'; } 
//    return "SELECT measurement_time, " + field + " FROM metrics." + table + 
//        " WHERE " + table + ".site_name='" + site + 
//        "' AND measurement_time BETWEEN '" + startDateTime + "' AND '" + endDateTime + "' " +
//        "GROUP BY measurement_time;";
//}

/**************************************************/
/*************** MIXED SQL FUNCS ******************/
/**************************************************/

function getSQL_Mixed_MultiMetrics_SingleSite(metrics, site, startDateTime, endDateTime) {
    tablesFields = mixedMetricsToTablesFields(metrics);
    var returnString = "SELECT * FROM (";
    if (metrics.length === 2) {
        returnString += "SELECT " + tablesFields[0][0] + ".measurement_time, " + tablesFields[2] + " FROM metrics." + tablesFields[0][0] + " LEFT JOIN metrics." + tablesFields[0][1] +
            " ON (" + tablesFields[0][0] + ".measurement_time = " + tablesFields[0][1] + ".measurement_time AND " + tablesFields[0][0] + ".site_name = " + tablesFields[0][1] + ".site_name)" +
            " WHERE " + tablesFields[0][0] + ".measurement_time BETWEEN '" + startDateTime + "' AND '" + endDateTime + "'" +
            " AND " + tablesFields[0][0] + ".site_name = '" + site + "' UNION ALL " +
            "SELECT " + tablesFields[0][1] + ".measurement_time, " + tablesFields[2] + " FROM metrics." + tablesFields[0][0] + " RIGHT JOIN metrics." + tablesFields[0][1] +
            " ON (" + tablesFields[0][0] + ".measurement_time = " + tablesFields[0][1] + ".measurement_time AND " + tablesFields[0][0] + ".site_name = " + tablesFields[0][1] + ".site_name)" +
            " WHERE " + tablesFields[0][1] + ".measurement_time BETWEEN '" + startDateTime + "' AND '" + endDateTime + "'" +
//            " AND " + tablesFields[0][1] + ".site_name = '" + site + "' AND " + tablesFields[0][0] + "." + tablesFields[1][0] +
            " AND " + tablesFields[0][1] + ".site_name = '" + site + "' AND " + tablesFields[1][0] +
            " IS NULL) a order by measurement_time;";
    } else if (metrics.length === 3) {
        // 3 table full outer join - http://stackoverflow.com/questions/30497230/how-to-full-outer-join-multiple-tables-in-mysql 
            returnString += "SELECT " + tablesFields[0][0] + ".measurement_time, " + tablesFields[2] + " FROM metrics." + tablesFields[0][0] + 
                " LEFT JOIN metrics." + tablesFields[0][1] +
                " ON (" + tablesFields[0][0] + ".measurement_time = " + tablesFields[0][1] + ".measurement_time AND " + tablesFields[0][0] + ".site_name = " + tablesFields[0][1] + ".site_name)" + 
                " LEFT JOIN metrics." + tablesFields[0][2] + 
                " ON (" + tablesFields[0][0] + ".measurement_time = " + tablesFields[0][2] + ".measurement_time AND " + tablesFields[0][0] + ".site_name = " + tablesFields[0][2] + ".site_name)" +
                " WHERE " + tablesFields[0][0] + ".measurement_time BETWEEN '" + startDateTime + "' AND '" + endDateTime + "'" +
                " AND " + tablesFields[0][0] + ".site_name = '" + site + 
                "' UNION ALL " +
                "SELECT " + tablesFields[0][1] + ".measurement_time, " + tablesFields[2] + " FROM metrics." + tablesFields[0][1] + 
                " LEFT JOIN metrics." + tablesFields[0][0] +
                " ON (" + tablesFields[0][0] + ".measurement_time = " + tablesFields[0][1] + ".measurement_time AND " + tablesFields[0][0] + ".site_name = " + tablesFields[0][1] + ".site_name)" +
                " LEFT JOIN metrics." + tablesFields[0][2] +
                " ON (" + tablesFields[0][1] + ".measurement_time = " + tablesFields[0][2] + ".measurement_time AND " + tablesFields[0][1] + ".site_name = " + tablesFields[0][2] + ".site_name)" +
                " WHERE " + tablesFields[0][1] + ".measurement_time BETWEEN '" + startDateTime + "' AND '" + endDateTime + "'" +
                " AND " + tablesFields[0][1] + ".site_name = '" + site + 
                "' AND " + tablesFields[1][0] + " IS NULL " +
                " UNION ALL " +
                "SELECT " + tablesFields[0][2] + ".measurement_time, " + tablesFields[2] + " FROM metrics." + tablesFields[0][2] + 
                " LEFT JOIN metrics." + tablesFields[0][0] +
                " ON (" + tablesFields[0][0] + ".measurement_time = " + tablesFields[0][2] + ".measurement_time AND " + tablesFields[0][0] + ".site_name = " + tablesFields[0][2] + ".site_name)" +
                " LEFT JOIN metrics." + tablesFields[0][1] +
                " ON (" + tablesFields[0][1] + ".measurement_time = " + tablesFields[0][2] + ".measurement_time AND " + tablesFields[0][1] + ".site_name = " + tablesFields[0][2] + ".site_name)" +
                " WHERE " + tablesFields[0][2] + ".measurement_time BETWEEN '" + startDateTime + "' AND '" + endDateTime + "'" +
                " AND " + tablesFields[0][2] + ".site_name = '" + site + 
                "' AND " + tablesFields[1][0] + " IS NULL AND " + tablesFields[1][1] + " IS NULL " +
                ") a order by measurement_time;";
    } else {
        console.log("getSQL_Mixed_MultiMetrics_SingleSite() called with too many fields (" + tablesFields[1].length + "), maximum is 3");
        alert("The maximum number of Mixed metrics that can be displayed on the same graph is 3");
        returnString = null;
    }
    return returnString;
}

function mixedMetricsToTablesFields(metrics) {
    var tableFieldsArray = new Array();
    var tableArray = new Array();
    var fieldArray = new Array();
    var fieldName = "";
    var fieldString = "";
    var prefix = "";
    for (var i = 0; i < metrics.length; i++) {
        if (i === 1) {
            prefix = ", ";
        }
        var metricType = getMetricType(metrics[i]);
        if (metricType === 'Buddy') {
            tableArray[i] = metrics[i].substring(0, metrics[i].indexOf('_')).replace(/-/g, "_").toLowerCase();
            fieldName = metrics[i].substring(metrics[i].indexOf('_') + 1).toLowerCase();
            fieldArray[i] = tableArray[i] + "." + fieldName;
            fieldString += prefix + fieldArray[i] + " AS '" + metricType + "-" + fieldName + "'";
            //fieldString += prefix + fieldArray[i] + " AS " + metricType + "-" + fieldName;
        } else if (metricType === 'Counter') {
            tableArray[i] = 'router_counters'; // all ping metrics are columns in the ping table
            fieldName = metrics[i].substring(metrics[i].indexOf('-') + 1).toLowerCase()
            fieldArray[i] = tableArray[i] + "." + fieldName;
            fieldString += prefix + fieldArray[i] + " AS '" + metricType + "-" + fieldName + "'";
            //fieldString += prefix + fieldArray[i] + " AS " + metricType + "-" + fieldName;
        } else if (metricType === 'Ping') {
            tableArray[i] = 'ping'; // all ping metrics are columns in the ping table
            fieldName = metrics[i].substring(5);
            fieldArray[i] = tableArray[i] + "." + fieldName;
            fieldString += prefix + fieldArray[i] + " AS '" + metricType + "-" + fieldName + "'";
            //fieldString += prefix + fieldArray[i] + " AS " + metricType + "-" + fieldName;
        } else if (metricType === 'RPM') {
            alert("RPM metrics not yet supported");
        }
    }
    tableFieldsArray[0] = tableArray;
    tableFieldsArray[1] = fieldArray;
    tableFieldsArray[2] = fieldString;
    return tableFieldsArray;
}

function getMetricType(theMetric) {
    var thisMetricType = "Unknown";
    if (theMetric.startsWith('Counter-')) {
       thisMetricType = "Counter";
    } else if (theMetric.startsWith('Ping-')) {
       thisMetricType = "Ping";
    } else if (theMetric.startsWith('Buddy-')) {
       thisMetricType = "Buddy";
    } else if (theMetric.startsWith('Femto-')) {
       thisMetricType = "Femto";
    } else if (theMetric.startsWith('RPM-')) {
       thisMetricType = "RPM";
    } else {
        alert("Unknown metric type: " + theMetric);
    }
    return thisMetricType;
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
                    data: values,
                    spanGaps: true,
                };

}

var dynamicColors = function() {
    var r = Math.floor(Math.random() * 255);
    var g = Math.floor(Math.random() * 255);
    var b = Math.floor(Math.random() * 255);
    return "rgba(" + r + "," + g + "," + b + ",1)";
}