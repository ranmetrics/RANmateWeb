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
//var chart1upper, chart2upper, chart3upper, chart4upper, chart1lower, chart2lower, chart3lower, chart4lower;
var gridCharts = new Array(2); // a 2D array of charts charts[0][n] is the top row
var gridCanvas = new Array(2); // a 2D array of canvases canvas[0][n] is the top row
var gridCtx = new Array(2); // a 2D array of contexts txt[0][n] is the top row
// maps the ids in the html to the 2D array design that allows us to programatically populate each one inside the same loop
var volumeChartNames = [["chart1upper", "chart2upper", "chart3upper", "chart4upper"],["chart1lower", "chart2lower", "chart3lower", "chart4lower"]];
var callsChartNames = [["chart1", "chart2", "chart3"]]; // we might add a 2nd row of graphs in the future of the total number of call minutes
//var chartTitles = [["CS Inbound", "PS Inbound", "Signalling Inbound", "Total Inbound"],["CS Outbound", "PS Outbound", "Signalling Outbound", "Total Outbound"]];
// the femtoId will index this array
// Moved to the customer specific MnoLetters.js
//var fapNames = [' VF_1', ' O2_1', ' 3_1', ' EE_1', ' VF_2', ' O2_2', ' 3_2', ' EE_2', ' VF_3', ' O2_3', ' 3_3', 
//                ' EE_3', ' VF_4', ' O2_4', ' 3_4', ' EE_4', ' VF_5', ' O2_5', ' 3_5', ' EE_5', ' VF_6', ' O2_6', 
//                ' 3_6', ' EE_6', ' VF_7', ' O2_7', ' 3_7', ' EE_7', ' VF_8', ' O2_8', ' 3_8', ' EE_8'];

var startMillis;
var liveCells;
var currentMetricType;
var yLabelTitle = '';
var trafficTableOutput = false;
var trafficBarOutput = false;
var trafficPieOutput = true; // selected by default
var perDay = false;
var perSite = false;
var femtoCountersPerFemto = false; 
var femtoCountersPerSwitch = false;
var femtoCountersPerSite = false;
var trafficGroupBySQL = "GROUP BY metric_name ";
var trafficOrderBySQL = "";
var maxMBytesToChart = 0;
var maxCallsToChart = 0;
var customerReportSelected = true;

var granularity = "";
var femtoIds = [];

var timeGran15min = true;
var timeGranHour = false;
var timeGranDay = false;
var timeGranWeek = false;
var timeGranMonth = false;
var timeFormat = "YYYY-MM-DD hh:mm";
var currentTimeGranularity = 1;

function getNow() {
    return getDateTimeString(new Date());
//    return "2016-11-06 03:52";  // used when testing specific dates
}

function getYesterday() {
    return getEarlier(30);
}
    
// hours are the number of hours earlier to get
function getEarlier(hours) {
    var d = new Date();
    d.setHours(d.getHours() - hours);
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
    //return day.getFullYear()+'-'+mm+'-'+dd+' '+hh+':'+min;

    if (timeGran15min) { return day.getFullYear()+'-'+mm+'-'+dd+' '+hh+':'+min; }
    else if (timeGranHour) { return day.getFullYear()+'-'+mm+'-'+dd+' '+hh+':00'; }
    else if (timeGranDay) { return day.getFullYear()+'-'+mm+'-'+dd; }
    else if (timeGranWeek) { return day.getFullYear()+'-'+mm+'-'+dd; }
    else if (timeGranMonth) { return day.getFullYear()+'-'+mm+'-01'; }
    else {return day.getFullYear()+'-'+mm+'-'+dd+' '+hh+':'+min;}
};

function listIsEmpty(listName){
//    if (document.getElementById(listName).innerHTML === "<!DOCTYPE html><html><body></body></html>") {
    if (document.getElementById(listName).innerHTML.trim() === "") {
        console.log("The list is empty");
        return true;  
    } else {
        console.log("The list is NOT empty");
        return false;                 
    }
}

function showSites(justNowSelected) {
    showSites(justNowSelected, null, false);
}

function metricSelected(justNowSelected) {    
    // no option selected initially
    if (!femtoCountersPerFemto && !femtoCountersPerSwitch && !femtoCountersPerSite) {
        //console.log("Setting PerFemto");
        document.getElementById("PerFemto").checked = true;
        granularity = "PerFemto";
        femtoCountersPerFemto = true; // added 13/8 MW
    }
    showSites(justNowSelected, null, false);
}

// force forces the list to be rebuilt - used by PerSite even though the metric type remains the same
function showSites(justNowSelected, siteToBeSelected, force) {
    //console.log("showSites called, the first selected metric in the list is " + justNowSelected + ", and the site to be selected is " + siteToBeSelected);
    //console.log("showSites called with metrics " + $('#metric').val() + " and currentMetricType=" + currentMetricType);
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
        // Reports
        var period = document.getElementById("fixedperiod");
        var periodLabel = document.getElementById("FixedPeriodLabel");

        xmlhttp.onreadystatechange = function() {
            if (this.readyState == 4 && this.status === 200) {
                if (this.responseText.startsWith("<!DOCTYPE html>")) {
                    console.log("showSites() received response from server: " + this.responseText);
                    //console.log("Site List rebuilt because thisMetricType=" + thisMetricType + " and currentMetricType=" + currentMetricType);
                    console.log("Site List rebuilt: thisMetricType=" + thisMetricType + " and currentMetricType=" + currentMetricType);
                    document.getElementById("site").innerHTML = this.responseText;
                    document.getElementById("site").selectedIndex = -1;
                    $('#site').multiselect('rebuild');
                    if (siteToBeSelected !== null) {
                        $('#site').multiselect('select', siteToBeSelected, true);
                        //console.log("Site set to URL param, " + siteToBeSelected);    
                        $('#site').multiselect('updateButtonText');
                        //console.log("Site button updated");                        
                    }
                } else {
                    console.log("showSites() will not process non-html response from server: " + this.responseText);                    
                }
            }
        };

        // Parse all the selected metrics to check for conflicts
        // Buddy, the metric with the fewest sites should be listed first in the drop down so that metric groups with more
        var buddyMetricSelected = false;
        var pingOrCounterMetricSelected = false;
        previousMetricTypes = null;
        for (i = 0; i < $('#metric').val().length; i++) {
            selectedMetric = $('#metric').val()[i];
            if (selectedMetric.startsWith('Traffic-')) {
                $('#femtocounterperwrapper').hide();
                $('#worstwrapper').hide();
                $('#timegranularitywrapper').hide();
                if (previousMetricTypes === null) { 
                    thisMetricType = "Traffic";
                    pingOrCounterMetricSelected = false;
                    // console.log("Metric Types is now Traffic");
                    // MW next 2 lines probably can be deleted
                    //document.getElementById("PerDay").disabled = true;
                    //document.getElementById("PerSite").disabled = true;
                    document.getElementById("Pie").checked = true;                   // was 'Chart' previously
                    if ($('#metric').val().length > 1) {
                        alert("Multiple Traffic Metrics not yet supported, please deselect one or more metrics");
                        return;
                    }
                    // now create the 2 inner part of the Traffic array charts
                    for (var i = 0; i < 2; i++) {
                        //console.log("Creating the 2nd dimension in the array for traffic metric");
                        gridCharts[i] = new Array(4);
                        gridCanvas[i] = new Array(4);
                        gridCtx[i] = new Array(4);
                    }                                        
                } else {
                    alert("Traffic metrics cannot be selected with any other metric");
                    document.getElementById("site").innerHTML = "<!DOCTYPE html><html><body></body></html>";
                    document.getElementById("site").selectedIndex = -1;
                    $('#site').multiselect('rebuild');
                    thisMetricType = "";
                    return;                    
                }
            } else if (selectedMetric.startsWith('Calls-')) {
                $('#femtocounterperwrapper').hide();
                $('#worstwrapper').hide();
                $('#timegranularitywrapper').hide();                
                if (previousMetricTypes === null) { 
                    thisMetricType = "Calls";
                    pingOrCounterMetricSelected = false;
                    // console.log("Metric Types is now Traffic");
                    // MW next 2 lines probably can be deleted
                    //document.getElementById("PerDay").disabled = true;
                    //document.getElementById("PerSite").disabled = true;
                    document.getElementById("Bar").checked = true;                   // is 'Pie' for Traffic
                    outputFormatSelected("Bar");
                    if ($('#metric').val().length > 1) {
                        alert("Multiple Traffic Metrics not yet supported, please deselect one or more metrics");
                        return;
                    }
                    // now create the 2 inner part of the Traffic array charts
                    for (var i = 0; i < 2; i++) {
                        //console.log("Creating the 2nd dimension in the array for Calls metric");
                        gridCharts[i] = new Array(4);
                        gridCanvas[i] = new Array(4);
                        gridCtx[i] = new Array(4);
                    }                                        
                } else {
                    alert("Calls metrics cannot be selected with any other metric");
                    document.getElementById("site").innerHTML = "<!DOCTYPE html><html><body></body></html>";
                    document.getElementById("site").selectedIndex = -1;
                    $('#site').multiselect('rebuild');
                    thisMetricType = "";
                    return;                    
                }
            } else if (selectedMetric.startsWith('Reports')) {
                $('#femtocounterperwrapper').hide();
                $('#worstwrapper').hide();
                $('#timegranularitywrapper').hide();
                if (previousMetricTypes === null) { 
                    thisMetricType = "Reports";
                    pingOrCounterMetricSelected = false;
                    document.getElementById("FixedPeriod").checked = true;                   // is 'Pie' for Traffic
                    if ($('#metric').val().length > 1) {
                        alert("Multiple Traffic Metrics not yet supported, please deselect one or more metrics");
                        return;
                    }
//                    // now create the 2 inner part of the Traffic array charts
//                    for (var i = 0; i < 2; i++) {
//                        //console.log("Creating the 2nd dimension in the array for Calls metric");
//                        gridCharts[i] = new Array(4);
//                        gridCanvas[i] = new Array(4);
//                        gridCtx[i] = new Array(4);
//                    }                                        
                } else {
                    alert("Reports cannot be selected with any other metric");
                    document.getElementById("site").innerHTML = "<!DOCTYPE html><html><body></body></html>";
                    document.getElementById("site").selectedIndex = -1;
                    $('#site').multiselect('rebuild');
                    thisMetricType = "";
                    return;                    
                }
            } else if (selectedMetric.startsWith('Counter-')) {
                $('#femtocounterperwrapper').hide();
                $('#worstwrapper').hide();
                $('#timegranularitywrapper').hide();
                if (previousMetricTypes === 'Femto') { 
                    alert("Femto and non-Femto metrics cannot be selected together");
                    document.getElementById("site").innerHTML = "<!DOCTYPE html><html><body></body></html>";
                    document.getElementById("site").selectedIndex = -1;
                    $('#site').multiselect('rebuild');
                    thisMetricType = "";
                    return;
                } else {
                    thisMetricType = "Counter";
                    pingOrCounterMetricSelected = true;
                }
            } else if (selectedMetric.startsWith('Ping-')) {
                $('#timegranularitywrapper').hide();
                if (previousMetricTypes === 'Femto') { 
                    alert("Femto and non-Femto metrics cannot be selected together");
                    document.getElementById("site").innerHTML = "<!DOCTYPE html><html><body></body></html>";
                    document.getElementById("site").selectedIndex = -1;
                    $('#site').multiselect('rebuild');
                    thisMetricType = "";
                    return;
                } else {
                     thisMetricType = "Ping";
                     pingOrCounterMetricSelected = true;
                }
            } else if (selectedMetric.startsWith('Buddy-')) {
                $('#femtocounterperwrapper').hide();
                $('#worstwrapper').hide();
                $('#timegranularitywrapper').hide();
                if (previousMetricTypes === 'Femto') { 
                    alert("Femto and non-Femto metrics cannot be selected together");
                    document.getElementById("site").innerHTML = "<!DOCTYPE html><html><body></body></html>";
                    document.getElementById("site").selectedIndex = -1;
                    $('#site').multiselect('rebuild');
                    thisMetricType = "";
                    return;
                } else {
                    thisMetricType = "Buddy";
                    buddyMetricSelected = true;                
                }
            // look, when I started writing this, there were just Femto packets and poe. Imagine that, Femto Packets and Poe. It's grown into Frankenstein
            } else if ((selectedMetric.startsWith('FemtoCounter-')) || (selectedMetric.startsWith('FemtoKPI-'))) {
                console.log("Femto Counter selected ");
                if (selectedMetric.startsWith('FemtoCounter-')) {
                    thisMetricType = "FemtoCounter";
                } else {
                    thisMetricType = "FemtoKPI";
                }
                $('#femtocounterperwrapper').show();
                $('#timegranularitywrapper').show();
                $('#worstwrapper').hide();
                if (previousMetricTypes != null) {
                    // if all the metrics are not either all Femto-metrics or all non-Femto metrics
                    if ((previousMetricTypes !== 'FemtoCounter') || (previousMetricTypes !== 'FemtoKPI')) { // ||
                        alert("Femto Counter/KPI and non-Femto Counter/KPI metrics cannot be selected together");
    //                    document.getElementById("site").innerHTML = "<!DOCTYPE html><html><body><option>Invalid Metric Combination</option></body></html>";
                        document.getElementById("site").innerHTML = "<!DOCTYPE html><html><body></body></html>";
                        document.getElementById("site").selectedIndex = -1;
                        $('#site').multiselect('rebuild');
                        //console.log("Option 1, blanking thisMetricType");
                        thisMetricType = "";
                        return;
                    }
                }
            } else if (selectedMetric.startsWith('Femto-')) {
                thisMetricType = "Femto";
                $('#femtocounterperwrapper').hide();
                $('#timegranularitywrapper').hide();
                $('#worstwrapper').hide();
                $('#operators').show();
                $('#cells').show();        
                //console.log("Processing " + selectedMetric + ". thisMetricType=" + thisMetricType);
                if (previousMetricTypes != null) {
                    // if all the metrics are not either all Femto-metrics or all non-Femto metrics
                    if (previousMetricTypes !== 'Femto') { // ||
//                    if (((thisMetricType === 'Femto') && (previousMetricTypes !== 'Femto')) || ((previousMetricTypes === 'Femto') && (thisMetricType !== 'Femto'))) { // ||
    //                     (Femto-packets )   {
                        alert("Femto and non-Femto metrics cannot be selected together");
    //                    document.getElementById("site").innerHTML = "<!DOCTYPE html><html><body><option>Invalid Metric Combination</option></body></html>";
                        document.getElementById("site").innerHTML = "<!DOCTYPE html><html><body></body></html>";
                        document.getElementById("site").selectedIndex = -1;
                        $('#site').multiselect('rebuild');
                        //console.log("Option 1, blanking thisMetricType");
                        thisMetricType = "";
                        return;
                    } else if (($('#metric').val().toString().indexOf('Femto-packets') >= 0) && ($('#metric').val().toString().indexOf('Femto-poe') >= 0)) {
                        alert("Packets and PoE cannot be displayed on the same graph.\ PoE values are too small compared to Packet values");
                        document.getElementById("site").innerHTML = "<!DOCTYPE html><html><body></body></html>";
                        document.getElementById("site").selectedIndex = -1;
                        $('#site').multiselect('rebuild');
                        //console.log("Option 2, blanking thisMetricType");
                        thisMetricType = "";                    
                    } else {
                        // console.log("Option 3, not changing thisMetricType");
                    }
                } else {
                    // console.log("Option 4, not changing thisMetricType");
                    previousMetricTypes = thisMetricType;
                }
            }

            if (thisMetricType != "") { // added by MW 25/5/17 so that some of the Femto-Femto Femto-Router checking above isn't overwritten
                // Added by MW 17/4 Reuses 'thisMetricType' perhaps a little confusing but it means I don't have to make any destructive changes to the later block of code
                if (justNowSelected.startsWith('Counter-')) {
                   thisMetricType = "Counter";
                } else if (justNowSelected.startsWith('Ping-')) {
                   thisMetricType = "Ping";
                } else if (justNowSelected.startsWith('Buddy-')) {
                   thisMetricType = "Buddy";
                } else if (justNowSelected.startsWith('FemtoCounter-')) {
                   thisMetricType = "FemtoCounter";
                } else if (justNowSelected.startsWith('FemtoKPI-')) {
                   thisMetricType = "FemtoKPI";
                } else if (justNowSelected.startsWith('Femto-')) {
                   thisMetricType = "Femto";
                } else if (justNowSelected.startsWith('Traffic-')) {
                   thisMetricType = "Traffic";
                } else if (justNowSelected.startsWith('Calls-')) {
                   thisMetricType = "Calls"; // will probably need to change this to 'Calls' to remove the Pie Chart option and lay out the grpahs properly
                } else if (justNowSelected.startsWith('Reports')) {
                   thisMetricType = "Reports";
                }
            }

            // Determine what components should be displayed
            // console.log("Str=" + str + ", currentMetricType=" + currentMetricType);
            if (thisMetricType === "Counter") {
                iface.style.display = "block";
                iface.style.margin = "10px 0px 0px 0px";    // no idea why we now need a 10px top border instead of 5px to keep it inline
                ifaceLabel.style.display = "block";            
                $('#interfacewrapper').show();
                $('#femtocounterperwrapper').hide();
                $('#worstwrapper').hide();
                $('#timegranularitywrapper').hide();
            } else {
                iface.style.display = 'none';
                ifaceLabel.style.display = 'none';            
                $('#interfacewrapper').hide();
            }

            if ((thisMetricType === "Traffic") || (thisMetricType === "Calls")) {
                //iface.style.display = "block";
                //iface.style.margin = "10px 0px 0px 0px";    // no idea why we now need a 10px top border instead of 5px to keep it inline
                //ifaceLabel.style.display = "block";            
                $('#trafficwrapper').show();
                $('#reportwrapper').hide();
                $('#femtocounterperwrapper').hide();
                $('#worstwrapper').hide();
                $('#timegranularitywrapper').hide();
                document.getElementById("PerDay").checked = false;
                document.getElementById("PerSite").checked = false;
                //document.getElementById("Chart").checked = false;
                //document.getElementById("Table").checked = false;
            } else {
                //iface.style.display = 'none';
                //ifaceLabel.style.display = 'none';            
                $('#trafficwrapper').hide();
            }
            
            if (thisMetricType === "Reports") {                
                period.style.display = "block";
                period.style.margin = "10px 0px 0px 0px";    // no idea why we now need a 10px top border instead of 5px to keep it inline
                periodLabel.style.display = "block";            
                $('#reportwrapper').show();
                $('#trafficwrapper').hide();
                $('#femtocounterperwrapper').hide();
                $('#worstwrapper').hide();
                $('#timegranularitywrapper').hide();
                document.getElementById("FixedPeriod").checked = false;
                document.getElementById("CustomRange").checked = false;
            } else {
                period.style.display = 'none';
                periodLabel.style.display = 'none';            
                $('#reportwrapper').hide();
                hidePdfFixedPeriodList();
                customRangeSelected(); // this restores the to-from time components
            }

            // if (((thisMetricType === "Counter") || (thisMetricType === "Ping")) && ((currentMetricType !== "Counter") && (currentMetricType !== "Ping"))) {  // pre Traffic entry
            if ((((thisMetricType === "Counter") || (thisMetricType === "Ping")) && ((currentMetricType !== "Counter") && (currentMetricType !== "Ping"))) ||
                 (((thisMetricType === "Traffic") || (thisMetricType === "Calls")) && ((currentMetricType !== "Traffic") && (currentMetricType !== "Calls"))) || 
                 ((thisMetricType === "Reports") && (currentMetricType !== "Reports"))) { 
                console.log("Need to rebuild Site list for Counter/Ping/Traffic/Calls/Reports metric");
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
                    //console.log("Calling RANMateMetrics_SiteList.php with group=Mixed");            
                    xmlhttp.open("GET","RANMateMetrics_SiteList.php?group=Mixed",true);
                } else {
                    console.log("Calling RANMateMetrics_SiteList.php with group=" + selectedMetric);            
                    xmlhttp.open("GET","RANMateMetrics_SiteList.php?group="+selectedMetric,true);
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
                    //console.log("Calling RANMateMetrics_SiteList.php with group=Mixed");            
                    xmlhttp.open("GET","RANMateMetrics_SiteList.php?group=Mixed",true);
                } else {
                    //console.log("Calling RANMateMetrics_SiteList.php with group=" + selectedMetric);            
                    xmlhttp.open("GET","RANMateMetrics_SiteList.php?group="+selectedMetric,true);
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
                xmlhttp.open("GET","RANMateMetrics_SiteList.php?group="+str,true);
                xmlhttp.send();
            } */ 
            // else if ((thisMetricType === "Femto") && ((currentMetricType !== "Femto") || listIsEmpty("site"))) { // Femto metric
            else if (force ||
                    ((thisMetricType === "Femto") && ((currentMetricType !== "Femto") && (currentMetricType !== "FemtoCounter") && (currentMetricType !== "FemtoKPI")) || listIsEmpty("site")) ||  // Femto metric
                    ((thisMetricType === "FemtoCounter") && (granularity === "PerFemto") && (((currentMetricType !== "Femto") && (currentMetricType !== "FemtoCounter") && (currentMetricType !== "FemtoKPI")) || listIsEmpty("site"))) || // FemtoCounter Metric
                    ((thisMetricType === "FemtoKPI")  && (granularity === "PerFemto") && (((currentMetricType !== "Femto") && (currentMetricType !== "FemtoCounter") && (currentMetricType !== "FemtoKPI")) || listIsEmpty("site")))) { // FemtoKPI Metric
                //currentMetricType = "Femto";
                //console.log("Need to rebuild Site list for Femto metric");
                //console.log("The site list html is empty? " + listIsEmpty("site") );
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
                console.log("RANMateMetrics_SiteList.php called with group=" + selectedMetric + " and granularity=" + granularity);
                xmlhttp.open("GET","RANMateMetrics_SiteList.php?group="+ selectedMetric + "&granularity=" + granularity,true);
                xmlhttp.send();
            } else {
                console.log("Site List won't be rebuilt because the new MetricType=" + thisMetricType + " and the existing MetricType=" + currentMetricType);
                //console.log("The site list html is " + document.getElementById("site").innerHTML );
            }
            currentMetricType = thisMetricType;
        }
    }
}

function updateOpCoCells(str) {
    updateOpCoCells(str, null, null, null);
}

function updateOpCoCells(str, operatorToBeChecked, femtoToBeChecked, initSite) {
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
                if (operatorToBeChecked != null) {
                    document.getElementById(operatorToBeChecked).checked = true;
                }
                if (femtoToBeChecked != null) {
                    document.getElementById(femtoToBeChecked).checked = true;
                    showGraph('graph', true, initSite);
                }
            }
        };
        // if the operator and femto are specified (as URL params) use the site name in the param list
        //if ((operatorToBeChecked != null) && (femtoToBeChecked != null)) {
        if (initSite != null) {
            siteStr = "(site_id = \'" + initSite + '\')';
        } else {
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
        }

        //console.log("RANMateMetrics_OpCoCellList.php called with: " + siteStr);
        xmlhttp.open("GET","RANMateMetrics_OpCoCellList.php?switches="+encodeURIComponent(siteStr),true);
        xmlhttp.send();
    }
}

function populateUpperLimitWorst(min) {
    var nSelect = document.getElementById('nSelect');
    var n = nSelect.options[nSelect.selectedIndex].value;            
    // delete all the existing options
    removeOptions(nSelect);
    // recreate all valid options preserving the selected option if valid
    for (var i = min; i<=10; i++) {
        var opt = document.createElement('option');
        opt.value = i;
        opt.innerHTML = i;
        nSelect.appendChild(opt);
    }
    if (n > min) {
        nSelect.value = n;
    } else {
        nSelect.value = min;        
    }
}

function removeOptions(selectbox) {
    var i;
    for(i = selectbox.options.length - 1 ; i >= 0 ; i--) {
        selectbox.remove(i);
    }
}

function showInterfaces(str) {
    //console.log("showInterfaces called with " + str);
    if (str == "") {
        return;
    } else {
        var metric = document.getElementById("metric").value;
        if ((metric.substring(0,6) == "Femto-") || (metric.substring(0,9) == "FemtoKPI-") || (metric.substring(0,13) == "FemtoCounter-")) {
            //console.log("Will update the OpCo cells");
//            console.log("Hiding the worst selection boxes, pos a");
            $('#worstwrapper').hide();
            updateOpCoCells(str);
        } else {
            
            if ($('#site').val().length == 1 && $('#site').val()[0].startsWith(" Worst m")) {
                //console.log("Showing the worst selection boxes, pos b");
                $('#worstwrapper').show();
            } else {
                //console.log("Hiding the worst selection boxes, pos c");
                $('#worstwrapper').hide();
            }
            
            if (metric.substring(0,8) == "Counter-") {
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
            } else if (metric.startsWith("Reports")) {
                document.getElementById("FixedPeriod").checked = false;                
            }
        }
    }
}

function fixedPeriodSelected() {
    if (document.getElementById("FixedPeriod").checked === true) {
        $('#starttimewrapper').hide();
        $('#endtimewrapper').hide();
        $('#fixedperiodwrapper').show();
        // showGeneratedReportList($('#site').val()[0]); // $('#site').val()[0] includes the customer name
        showGeneratedReportList($('#site :selected').text());
        // console.log("Calling showGeneratedReportList() with site=" + $('#site :selected').text());
    }
}

function customRangeSelected() {
    if (document.getElementById("CustomRange").checked === true) {
        if ($('#site :selected').text().startsWith("(Customer)")) {
            customerReportSelected = true;
            alert("Custom period report generation is not yet available for customers, only individual sites");
            document.getElementById("CustomRange").checked = false;
        } else if ($('#site').val().length > 1) {
            alert("Multiple Site selection not yet supported, please select only 1");
            document.getElementById("CustomRange").checked = false;
        } else {
            customerReportSelected = false;
            hidePdfFixedPeriodList();    
        }
    }
}

function outputTimeGranularitySelected(timeGranularity) {
    console.log("Time Granularity changed to " + timeGranularity + " from " + currentTimeGranularity);
    displayStartTime = document.getElementById("startTime").value;
    displayEndTime = document.getElementById("endTime").value;
    if (timeGranularity == 1) {
        document.getElementById('timegranularitylabel').innerHTML = '15 min'; 
        timeGran15min = true;
        timeGranHour = false;
        timeGranDay = false;
        timeGranWeek = false;
        timeGranMonth = false;
        timeFormat = "YYYY-MM-DD hh:mm";
    } else if (timeGranularity == 2) {
        document.getElementById('timegranularitylabel').innerHTML = 'Hourly';        
        timeGran15min = false;
        timeGranHour = true;
        timeGranDay = false;
        timeGranWeek = false;
        timeGranMonth = false;
        timeFormat = "YYYY-MM-DD hh";
    } else if (timeGranularity == 3) {
        document.getElementById('timegranularitylabel').innerHTML = 'Daily';        
        timeGran15min = false;
        timeGranHour = false;
        timeGranDay = true;
        timeGranWeek = false;
        timeGranMonth = false;
        timeFormat = "YYYY-MM-DD";
    } else if (timeGranularity == 4) {
        document.getElementById('timegranularitylabel').innerHTML = 'Weekly';        
        timeGran15min = false;
        timeGranHour = false;
        timeGranDay = false;
        timeGranWeek = true;
        timeGranMonth = false;
        timeFormat = "YYYY-MM-DD";
    } else if (timeGranularity == 5) {
        document.getElementById('timegranularitylabel').innerHTML = 'Monthly';        
        timeGran15min = false;
        timeGranHour = false;
        timeGranDay = false;
        timeGranWeek = false;
        timeGranMonth = true;
        timeFormat = "YYYY-MM";
    }
    if (timeGranularity > currentTimeGranularity) {
        if (timeGranularity > 2) {
            document.getElementById("startTime").value = displayStartTime.substring(0,10);
            document.getElementById("endTime").value = displayEndTime.substring(0,10); 
        } else if (timeGranularity == 2) {
            document.getElementById("startTime").value = displayStartTime.substring(0,14) + '00';
            document.getElementById("endTime").value = displayEndTime.substring(0,14) + '00'; 
        }
    } else if (timeGranularity < currentTimeGranularity) {
        if (currentTimeGranularity > 2) {
            if (timeGranularity < 3 ) {
                document.getElementById("startTime").value = displayStartTime + " 00:00";
                document.getElementById("endTime").value = displayEndTime + " 00:00";
            }
        }        
    }
    currentTimeGranularity = timeGranularity;
}

function hidePdfFixedPeriodList() {
    $('#starttimewrapper').show();
    $('#endtimewrapper').show();
    $('#fixedperiodwrapper').hide();        
}
function showGeneratedReportList(str) {
    console.log("showGeneratedReportList called with " + str);
    if (str == "") {
        return;
    } else {
        if ($('#site').val().length > 1) {
            alert("Multiple Customer/Site selection not yet supported, please select only 1");
            document.getElementById("FixedPeriod").checked = false;
        } else {
            if (window.XMLHttpRequest) {
                xmlhttp = new XMLHttpRequest();                     // code for IE7+, Firefox, Chrome, Opera, Safari
            } else {                
                xmlhttp = new ActiveXObject("Microsoft.XMLHTTP");    // code for IE6, IE5
            }
            xmlhttp.onreadystatechange = function() {
                if (this.readyState == 4 && this.status == 200) {
                    //console.log("showGeneratedReportList() response=" + this.responseText);
                    // MW add logic here to remove a dummy first element if one exists
                    // this dummy element is used to get all sites into the list of possibles so that SOC can generate custom reports before the first fixed one is  (end of month)
                    document.getElementById("fixedperiod").innerHTML = this.responseText;
    //                document.getElementById("interface").selectedIndex = 0;
                    $('#fixedperiod').multiselect('rebuild');
                }
            };
            if (str.startsWith("(Customer)")) {
                customerReportSelected = true;
                str = str.substring(10).trim();
                type=2;
            } else {
                customerReportSelected = false;
                type=1;
            }
            xmlhttp.open("GET","RANMateMetrics_GeneratedReportList.php?site="+encodeURIComponent(str)+"&type="+type,true);
            xmlhttp.send();
        }
    }
}

function initPageRANmate() {
    clearTickBoxes();
    document.getElementById("metric").selectedIndex = 0;  // was previously 1    
    // so that the metrics drop down is cleared when the page is refreshed
    $('#metric').multiselect('deselectAll', false);
    var metricParam = getURLParameter('metric');

//    Chart.plugins.register({
//        id: 'labels'
//    });    
    
    if (metricParam != null) {
        initWithParams(metricParam);
    } else {
        console.log("metric name is not specified, ignoring any other URL params");        
    }
    $('#metric').multiselect('updateButtonText');
    console.log("Enabling the graph button");
    document.getElementById("graphButton").disabled = false;
}

function initWithParams(metricParam) {
    //console.log("metric name is " + metricParam);
    $('#metric').multiselect('select', metricParam, true);
    // temporarliy changing the %2B to a ^ before the pluses get URL decocded and then convert ^ back to + when we're finished
    var siteParam = decodeURIComponent(getURLParameter('site').replace(/%2B/g, '^')).replace(/\+/g, " ").replace(/%28/g, '(').replace(/%29/g,')').replace(/\^/g, '+');
    // console.log("Parsed site name is " + siteParam);

    showSites(metricParam, siteParam.replace(/([^ ])-([^ ])/, "$1 - $2"));    
    var opcoParam = getURLParameter('operator');
    var femtoParam = getURLParameter('femto');
    if (opcoParam != null) {
        if (femtoParam != null) {
            //updateOpCoCells(siteParam, decodeURIComponent(opcoParam), decodeURIComponent(femtoParam), siteParam);
            updateOpCoCells(siteParam, decodeURIComponent(opcoParam), decodeURIComponent(femtoParam), siteParam.replace(/([^ ])-([^ ])/, "$1 - $2"));
        } else {
            updateOpCoCells(siteParam, null, null, siteParam);        
            alert("The required Femto was not included in the launch URL");
        }
    } else {
            updateOpCoCells(siteParam, null, null, siteParam);        
        alert("The required Operator was not included in the launch URL");
    }
    // instead of displaying the default 30 hours, display either 6 hours previous or the number of hours if requested by RANmate Outage Screen
    var rangeParam = getURLParameter('range');          // range should be passed as a number of minutes
    if ((rangeParam != null) && (isInt(rangeParam))) {
        document.getElementById("startTime").value = getEarlier(Math.ceil(rangeParam/60) + 1);
    } else {
        document.getElementById("startTime").value = getEarlier(6); 
    }
}

function isInt(value) {
  return !isNaN(value) && 
         parseInt(Number(value)) == value && 
         !isNaN(parseInt(value, 10));
}

function getURLParameter(sParam) {
    var sPageURL = window.location.search.substring(1);
    var sURLVariables = sPageURL.split('&');
    for (var i = 0; i < sURLVariables.length; i++) {
        var sParameterName = sURLVariables[i].split('=');
        if (sParameterName[0] == sParam) {
            return sParameterName[1];
        }
    }
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

function femtoCounterPerSelected(newGranularity) {
    var force = false;
    //console.log(granularity + " granularity selected");
    if (newGranularity == "") {
        return;
    }
    if (newGranularity == "PerFemto") {
        femtoCountersPerFemto= true;
        femtoCountersPerSwitch = false;
        femtoCountersPerSite = false;
        $('#operators').show();
        $('#cells').show();        
        force = (granularity == "PerSite");
    } else if (newGranularity == "PerSwitch") {
        femtoCountersPerFemto = false;
        femtoCountersPerSwitch = true;
        femtoCountersPerSite = false;
        $('#operators').hide();
        $('#cells').hide();        
        force = (granularity == "PerSite");
    } else {
        femtoCountersPerFemto = false;
        femtoCountersPerSwitch = false;
        femtoCountersPerSite = true;
        $('#operators').hide();
        $('#cells').hide();        
        force = (granularity != "PerSite");
    }
    console.log("Changing granularity from " + granularity + " to " + newGranularity);
    granularity = newGranularity;
    showSites(currentMetricType, null, force);
}

function outputFormatSelected(format) {
    //console.log(format + " format selected");
    if (format == "") {
        return;
    } else if (format == "Table") {
        trafficTableOutput = true;
        trafficPieOutput = false;
        trafficBarOutput = false;
    } else if (format == "Bar") {
        trafficBarOutput = true;
        trafficPieOutput = false;
        trafficTableOutput = false;
    } else {
        trafficPieOutput = true;
        trafficBarOutput = false;
        trafficTableOutput = false;
    }        
}

function perDayOrSiteChecked(checkBox) {
//    if (document.getElementById("PerDay") != null) {
        if ((document.getElementById("PerDay").checked) || (document.getElementById("PerSite").checked)) {
            trafficTableOutput = true;
            trafficPieOutput = false;
            trafficBarOutput = false;        
            document.getElementById("Pie").disabled = true;
            document.getElementById("Bar").disabled = true;
            document.getElementById("BarLabel").style.color = "lightgrey";
            document.getElementById("PieLabel").style.color = "lightgrey";
            document.getElementById("Table").disabled = false;
            document.getElementById("Table").checked = true;
        } else {
            //trafficTableOutput = false;
            //trafficPieOutput = true;
            //trafficBarOutput = false;                
            document.getElementById("Pie").disabled = false;
            document.getElementById("Bar").disabled = false;
            document.getElementById("BarLabel").style.color = "black";
            document.getElementById("PieLabel").style.color = "black";
        }
        if ((document.getElementById('PerDay').checked) && (document.getElementById('PerSite').checked)) {
            trafficGroupBySQL = "GROUP BY measurement_time, site_name, metric_name ";        
            trafficOrderBySQL = "ORDER BY site_name, measurement_time;\n";
            perDay = true;
            perSite = true;
        } else if ((document.getElementById('PerDay').checked)) {
            trafficGroupBySQL = "GROUP BY measurement_time, metric_name ";
            trafficOrderBySQL = "ORDER BY NULL;\n";
            perDay = true;
            perSite = false;
        } else if ((document.getElementById('PerSite').checked)) {
            trafficGroupBySQL = "GROUP BY site_name, metric_name ";
            trafficOrderBySQL = "ORDER BY site_name;\n";
            perDay = false;
            perSite = true;
        } else {
            trafficGroupBySQL = "GROUP BY metric_name ";
            trafficOrderBySQL = "ORDER BY NULL;\n";
            perDay = false;
            perSite = false;
        }
//    }
}

function isValidDateTimeString(day) {
    var dateTimeRegExp = new RegExp("^([1-2]\\d{3}-([0]?[1-9]|1[0-2])-([0-2]?[0-9]|3[0-1])) (20|21|22|23|[0-1]?\\d{1}):([0-5]?\\d{1})$");
    var hourlyDateTimeRegExp = new RegExp("^([1-2]\\d{3}-([0]?[1-9]|1[0-2])-([0-2]?[0-9]|3[0-1])) (20|21|22|23|[0-1]?\\d{1})$");
    var dailyDateTimeRegExp = new RegExp("^([1-2]\\d{3}-([0]?[1-9]|1[0-2])-([0-2]?[0-9]|3[0-1]))$");
    var monthlyDateTimeRegExp = new RegExp("^([1-2]\\d{3}-([0]?[1-9]|1[0-2]))$");
    return (dateTimeRegExp.test(day) || (timeGranHour && hourlyDateTimeRegExp.test(day)) || ((timeGranDay || timeGranWeek) && dailyDateTimeRegExp.test(day)) || (timeGranMonth && monthlyDateTimeRegExp.test(day)) );
}

function showGraph(id, visible) {
    showGraph(id, visible, null);
}

function getCallsSQL(metricName, startDateTime, endDateTime, allSites, perDay, perSite) {
    var sitesWhereClause = "";
    if (!allSites) {
        for (i = 0; i < $('#site').val().length; i++) {
            if ($('#site').val()[i].startsWith("Fora -")) {
                selectedSite = $('#site').val()[i];
            } else {
                selectedSite = $('#site').val()[i].replace(" - ", "-");                
            }
            if (i == 0) {
                siteFloorStr = "\'^" + selectedSite;
            } else {
                siteFloorStr += "|^" + selectedSite;
            }
        }
        siteFloorStr += '\''; // old version that incorrectly matched Bishopsgate with 15 Bishopsgate
        //console.log("siteFloorStr=" + siteFloorStr);
        sitesWhereClause = " AND jflow.site_name REGEXP " + siteFloorStr + " ";    
    }
    return getCallsCommonSql("jflow", startDateTime, endDateTime, "", "", sitesWhereClause, trafficGroupBySQL, trafficOrderBySQL);
}

function getCallsCommonSql(metricName, startDateTime, endDateTime, additionalFields, additionalFrom, additionalWhereClause, additionalGroupBy, additionalOrderBy) {
    var mergeSQLtoUse = "";
    if (trafficPieOutput) {
        mergeSQLtoUse = getTrafficMergePercentageSql();
    } else {
        mergeSQLtoUse = getCallsMergeSql(additionalGroupBy, additionalOrderBy);
    }
    return "DELETE FROM metrics.jflow_viewer_output_aggregated;\n" +
            "INSERT INTO metrics.jflow_viewer_output_aggregated (" +
                "SELECT DATE(measurement_time), site_name, operator_id, " +
                "SUM(cs_inbound) AS 'Calls Inbound', SUM(ps_inbound) AS 'Data Inbound', SUM(signalling_inbound) AS 'Remainder Inbound',  SUM(total_inbound) AS 'Total Inbound'," +
                "SUM(cs_outbound) AS 'Calls Outbound', SUM(ps_outbound) AS 'Data Outbound', SUM(signalling_outbound) AS 'Remainder Outbound',  SUM(total_outbound) AS 'Total Outbound'" +
                "FROM metrics." + metricName +
                additionalFrom +
                " WHERE measurement_time BETWEEN '" + startDateTime + "' AND '" + endDateTime + "' " +
                additionalWhereClause +
                "GROUP BY DATE(measurement_time), site_name, operator_id " +
                "order by measurement_time, site_name, operator_id" +
            ");\n" + 
            getCallsPivotSqlAll() +
            mergeSQLtoUse;
}

function getCallsPivotSqlAll() {
    return "DELETE FROM metrics.jflow_viewer_output_pivoted;\n" +
            getTrafficPivotSqlSingle("Num Calls Inbound", "cs_inbound") +
            getTrafficPivotSqlSingle("Num Calls Outbound", "cs_outbound") +
            getCallsTotalSql("Total Num Calls");
}

function getCallsTotalSql() {
    return "INSERT INTO metrics.jflow_viewer_output_pivoted (SELECT measurement_time, 'Total Num Calls ' AS Metric, site_name, " + 
            "sum(operator1), sum(operator2), sum(operator3), sum(operator4) FROM metrics.jflow_viewer_output_pivoted);\n";
}

function getCallsMergeSql (additionalGroupBy, additionalOrderBy) {
    var siteField = "";
    if (perSite) {
        siteField = "site_name, ";
    }
    // added a multiplier (0.3) to convert Megabyte volumes into number of calls 
    // changed from 0.3 to 0.6 3/6/19 after Andy's request https://dataduct.atlassian.net/browse/OC-85 
    return "SELECT (DATE(measurement_time)) AS measurement_time, " + siteField + " metric_name, " +
        "COALESCE(ROUND(SUM(operator1)/(1048576 * 0.6)),0) AS VF, " +
        "COALESCE(ROUND(SUM(operator2)/(1048576 * 0.6)),0) AS O2, " +
        "COALESCE(ROUND(SUM(operator3)/(1048576 * 0.6)),0) AS THREE, " +
        "COALESCE(ROUND(SUM(operator4)/(1048576 * 0.6)),0) AS EE " +
        "FROM jflow_viewer_output_pivoted " +
//        "GROUP BY metric_name " +
        additionalGroupBy +
        "ORDER BY NULL;\n";
}

// getTrafficCommonSQL(metricName, startDateTime, endDateTime);
function getTrafficSQL(metricName, startDateTime, endDateTime, allSites, perDay, perSite) {
    var sitesWhereClause = "";
    if (!allSites) {
        for (i = 0; i < $('#site').val().length; i++) {
            if ($('#site').val()[i].startsWith("Fora -")) {
                selectedSite = $('#site').val()[i];
            } else {
                selectedSite = $('#site').val()[i].replace(" - ", "-");                
            }
            if (i == 0) {
                siteFloorStr = "\'^" + selectedSite;
            } else {
                siteFloorStr += "|^" + selectedSite;
            }
        }
        siteFloorStr += '\''; // old version that incorrectly matched Bishopsgate with 15 Bishopsgate
        //console.log("siteFloorStr=" + siteFloorStr);
        sitesWhereClause = " AND jflow.site_name REGEXP " + siteFloorStr + " ";    
    }
    return getTrafficCommonSql("jflow", startDateTime, endDateTime, "", "", sitesWhereClause, trafficGroupBySQL, trafficOrderBySQL);
}

function getTrafficCommonSqlFull(metricName, startDateTime, endDateTime, additionalFields, additionalFrom, additionalWhereClause, additionalGroupBy, additionalOrderBy) {
    var mergeSQLtoUse = "";
    if (trafficPieOutput) {
        mergeSQLtoUse = getTrafficMergePercentageSql();
    } else {
        mergeSQLtoUse = getTrafficMergeSql(additionalGroupBy, additionalOrderBy);
    }
    return "DELETE FROM metrics.jflow_viewer_output_aggregated;\n" +
            "INSERT INTO metrics.jflow_viewer_output_aggregated (" +
//                "SELECT MAX(measurement_time), site_name, operator_id, " +
                "SELECT DATE(measurement_time), site_name, operator_id, " +
                "SUM(cs_inbound) AS 'Calls Inbound', SUM(ps_inbound) AS 'Data Inbound', SUM(signalling_inbound) AS 'Remainder Inbound',  SUM(total_inbound) AS 'Total Inbound'," +
                "SUM(cs_outbound) AS 'Calls Outbound', SUM(ps_outbound) AS 'Data Outbound', SUM(signalling_outbound) AS 'Remainder Outbound',  SUM(total_outbound) AS 'Total Outbound'" +
//                "from jflow " +
//                "WHERE measurement_time BETWEEN '2018-03-05 07:03' AND '2018-03-06 13:03' "+ 
//                "AND jflow.site_name REGEXP '66 Chiltern St'  
//                "group by operator_id" +
//                "order by operator_id"; 
                "FROM metrics." + metricName +
                additionalFrom +
                " WHERE measurement_time BETWEEN '" + startDateTime + "' AND '" + endDateTime + "' " +
                additionalWhereClause +
                "GROUP BY DATE(measurement_time), site_name, operator_id " +
                "order by measurement_time, site_name, operator_id" +
            ");\n" + 
            getTrafficPivotSqlAll() +
            mergeSQLtoUse;
}

function getTrafficCommonSqlTest(metricName, startDateTime, endDateTime, additionalFields, additionalFrom, additionalWhereClause, additionalGroupBy, additionalOrderBy) {
    return getTrafficMergeSql();
}

function getTrafficCommonSql(metricName, startDateTime, endDateTime, additionalFields, additionalFrom, additionalWhereClause, additionalGroupBy, additionalOrderBy) {
    var mergeSQLtoUse = "";
    if (trafficPieOutput) {
        mergeSQLtoUse = getTrafficMergePercentageSql();
    } else {
        mergeSQLtoUse = getTrafficMergeSql(additionalGroupBy, additionalOrderBy);
    }
    return "DELETE FROM metrics.jflow_viewer_output_aggregated;\n" +
            "INSERT INTO metrics.jflow_viewer_output_aggregated (" +
//                "SELECT MAX(measurement_time), site_name, operator_id, " +
                "SELECT DATE(measurement_time), site_name, operator_id, " +
                "SUM(cs_inbound) AS 'Calls Inbound', SUM(ps_inbound) AS 'Data Inbound', SUM(signalling_inbound) AS 'Remainder Inbound',  SUM(total_inbound) AS 'Total Inbound'," +
                "SUM(cs_outbound) AS 'Calls Outbound', SUM(ps_outbound) AS 'Data Outbound', SUM(signalling_outbound) AS 'Remainder Outbound',  SUM(total_outbound) AS 'Total Outbound'" +
//                "from jflow " +
//                "WHERE measurement_time BETWEEN '2018-03-05 07:03' AND '2018-03-06 13:03' "+ 
//                "AND jflow.site_name REGEXP '66 Chiltern St'  
//                "group by operator_id" +
//                "order by operator_id"; 
                "FROM metrics." + metricName +
                additionalFrom +
                " WHERE measurement_time BETWEEN '" + startDateTime + "' AND '" + endDateTime + "' " +
                additionalWhereClause +
                "GROUP BY DATE(measurement_time), site_name, operator_id " +
                "order by measurement_time, site_name, operator_id" +
            ");\n" + 
            getTrafficPivotSqlAll() +
            mergeSQLtoUse;
}

function getTrafficPivotSqlAll() {
    return "DELETE FROM metrics.jflow_viewer_output_pivoted;\n" +
            getTrafficPivotSqlSingle("Calls Inbound", "cs_inbound") +
            getTrafficPivotSqlSingle("Data Inbound", "ps_inbound") +
            getTrafficPivotSqlSingle("Remainder Inbound", "signalling_inbound") +
            getTrafficPivotSqlSingle("Total Inbound", "total_inbound") +
            getTrafficPivotSqlSingle("Calls Outbound", "cs_outbound") +
            getTrafficPivotSqlSingle("Data Outbound", "ps_outbound") +
            getTrafficPivotSqlSingle("Remainder Outbound", "signalling_outbound") +
            getTrafficPivotSqlSingle("Total Outbound", "total_outbound");
 }
 
function getTrafficMergeSql (additionalGroupBy, additionalOrderBy) {
    //console.log("Using absolute SQL");
    var siteField = "";
    if (perSite) {
        siteField = "site_name, ";
    }
    return "SELECT (DATE(measurement_time)) AS measurement_time, " + siteField + " metric_name, " +
        "COALESCE(ROUND(SUM(operator1)/1048576),0) AS VF, " +
        "COALESCE(ROUND(SUM(operator2)/1048576),0) AS O2, " +
        "COALESCE(ROUND(SUM(operator3)/1048576),0) AS THREE, " +
        "COALESCE(ROUND(SUM(operator4)/1048576),0) AS EE " +
        "FROM jflow_viewer_output_pivoted " +
//        "GROUP BY metric_name " +
        additionalGroupBy +
        "ORDER BY NULL;\n";
}

function getTrafficMergePercentageSql () {
    console.log("Using percentage SQL");
    return "SELECT DATE(measurement_time) AS measurement_time, metric_name, " +
        "COALESCE((SUM(operator1) * 100),0)/(COALESCE(SUM(operator1),0) + COALESCE(SUM(operator2),0) + COALESCE(SUM(operator3),0) + COALESCE(SUM(operator4),0)) AS VF, " +
        "COALESCE((SUM(operator2) * 100),0)/(COALESCE(SUM(operator1),0) + COALESCE(SUM(operator2),0) + COALESCE(SUM(operator3),0) + COALESCE(SUM(operator4),0)) AS O2, " +
        "COALESCE((SUM(operator3) * 100),0)/(COALESCE(SUM(operator1),0) + COALESCE(SUM(operator2),0) + COALESCE(SUM(operator3),0) + COALESCE(SUM(operator4),0)) AS THREE, " +
        "COALESCE((SUM(operator4) * 100),0)/(COALESCE(SUM(operator1),0) + COALESCE(SUM(operator2),0) + COALESCE(SUM(operator3),0) + COALESCE(SUM(operator4),0)) AS EE " +
        "FROM jflow_viewer_output_pivoted " +
        "GROUP BY metric_name ORDER BY NULL;\n";
}

function getTrafficPivotSqlSingle(metricTitle, metricCol) {
    return "INSERT INTO metrics.jflow_viewer_output_pivoted (SELECT DATE(measurement_time), '" + metricTitle + "' AS Metric, site_name, case when operator_id = 1 then " + metricCol + " end, " +
            "case when operator_id = 2 then " + metricCol + " end,case when operator_id = 3 then " + metricCol + " end, case when operator_id = 4 then " + metricCol + " end " +
            "FROM metrics.jflow_viewer_output_aggregated);\n";
}
    
//#select DATE(measurement_time) AS Date, sites.node_id AS SiteId,
function getTrafficCommonSqlOld(metricName, startDateTime, endDateTime, additionalFields, additionalFrom, additionalWhereClause, additionalGroupBy) {
    //return "select DATE(measurement_time) AS Date, " +
    return "select DATE(measurement_time) AS Date, 'CS Inbound' AS Metric, " +
    additionalFields +
    "ROUND(((SUM(cell_0 + cell_4 + cell_8 + cell_12 + cell_16 + cell_20 + cell_24 + cell_28)/ " +
    "SUM(cell_0 + cell_4 + cell_8 + cell_12 + cell_16 + cell_20 + cell_24 + cell_28 + " +
    "cell_1 + cell_5 + cell_9 + cell_13 + cell_17 + cell_21 + cell_25 + cell_29 + cell_2 + cell_6 + " +
    "cell_10 + cell_14 + cell_18 + cell_22 + cell_26 + cell_30 + cell_3 + cell_7 + cell_11 + cell_15 + " +
    "cell_19 + cell_23 + cell_27 + cell_31)) * 100),1) AS 'VF', " +
    "ROUND(((SUM(cell_1 + cell_5 + cell_9 + cell_13 + cell_17 + cell_21 + cell_25 + cell_29)/" +
    "SUM(cell_0 + cell_4 + cell_8 + cell_12 + cell_16 + cell_20 + cell_24 + cell_28 + " +
    "cell_1 + cell_5 + cell_9 + cell_13 + cell_17 + cell_21 + cell_25 + cell_29 + cell_2 + cell_6 + " +
    "cell_10 + cell_14 + cell_18 + cell_22 + cell_26 + cell_30 + cell_3 + cell_7 + cell_11 + cell_15 + " +
    "cell_19 + cell_23 + cell_27 + cell_31)) * 100),1) AS 'O2', " +
    "ROUND(((SUM(cell_2 + cell_6 + cell_10 + cell_14 + cell_18 + cell_22 + cell_26 + cell_30)/" +
    "SUM(cell_0 + cell_4 + cell_8 + cell_12 + cell_16 + cell_20 + cell_24 + cell_28 + " +
    "cell_1 + cell_5 + cell_9 + cell_13 + cell_17 + cell_21 + cell_25 + cell_29 + cell_2 + cell_6 + " +
    "cell_10 + cell_14 + cell_18 + cell_22 + cell_26 + cell_30 + cell_3 + cell_7 + cell_11 + cell_15 + " +
    "cell_19 + cell_23 + cell_27 + cell_31)) * 100),1) AS 'THREE', " +
    "ROUND(((SUM(cell_3 + cell_7 + cell_11 + cell_15 + cell_19 + cell_23 + cell_27 + cell_31)/" +
    "SUM(cell_0 + cell_4 + cell_8 + cell_12 + cell_16 + cell_20 + cell_24 + cell_28 + " +
    "cell_1 + cell_5 + cell_9 + cell_13 + cell_17 + cell_21 + cell_25 + cell_29 + cell_2 + cell_6 + " +
    "cell_10 + cell_14 + cell_18 + cell_22 + cell_26 + cell_30 + cell_3 + cell_7 + cell_11 + cell_15 + " +
    "cell_19 + cell_23 + cell_27 + cell_31)) * 100),1) AS 'EE' " + 
    "FROM metrics." + metricName +
    additionalFrom +
    " WHERE measurement_time BETWEEN '" + startDateTime + "' AND '" + endDateTime + "' " +
    additionalWhereClause +
    additionalGroupBy;
}

function convertMonthName(str) {
    if (str.endsWith('(Jan)')) { return str.replace('(Jan)','January'); }
    else if (str.endsWith('(Feb)')) { return str.replace('(Feb)','February'); }
    else if (str.endsWith('(Mar)')) { return str.replace('(Mar)','March'); }
    else if (str.endsWith('(Apr)')) { return str.replace('(Apr)','April'); }
    else if (str.endsWith('(May)')) { return str.replace('(May)','May'); }
    else if (str.endsWith('(Jun)')) { return str.replace('(Jun)','June'); }
    else if (str.endsWith('(Jul)')) { return str.replace('(Jul)','July'); }
    else if (str.endsWith('(Aug)')) { return str.replace('(Aug)','August'); }
    else if (str.endsWith('(Sep)')) { return str.replace('(Sep)','September'); }
    else if (str.endsWith('(Oct)')) { return str.replace('(Oct)','October'); }
    else if (str.endsWith('(Nov)')) { return str.replace('(Nov)','November'); }
    else if (str.endsWith('(Dec)')) { return str.replace('(Dec)','December'); }
}

//https://mozilla.github.io/pdf.js/examples/
function showReport() {
    // no need to check if a report has been selected, by default the first report is automatically selected when the fixed period radio button is pressed
    if (document.getElementById("FixedPeriod").checked === true) {
//        alert("Can't display preprepared PDF reports yet, sorry");    
        // this code will open the PDF files in a new tab
        // window.open('./WorkspaceLadbrokeGrove201808.pdf'); // what originally worked !!!!
        subdir = $('#site :selected').text();
        siteOrCustomer = document.getElementById("site").value;
        var selectedMonth = convertMonthName($('#fixedperiod :selected').text());
        if (customerReportSelected) {
            siteOrCustomer = siteOrCustomer.substring(10).trim();
            customer = subdir.substring(10).trim();
            window.open('reports/customers/' + customer + '/StrattoOpenCell Service Report - ' + customer + ' ' + selectedMonth +'.pdf');
        } else {
            // window.open('/var/Concert/reports/sites/StrattoOpenCell Service Report - ' + siteOrCustomer + ' ' + selectedMonth +'.pdf');
            window.open('reports/sites/' + subdir + '/StrattoOpenCell Service Report - ' + siteOrCustomer + ' ' + selectedMonth +'.pdf');
        }
        
        // This code SHOULD open up the PDF in the RANmetrics page using the same canvas as the Packets and PoE
        // However it doesn't. No errors are displayed.
        // Parked for an expert :)
//        var url = 'min.pdf';        
////        var url = 'ConcertTasks.pdf';        
////        var url = './WorkspaceLadbrokeGrove201808.pdf'
//        pdfjsLib.GlobalWorkerOptions.workerSrc = 'js/pdf.worker.js';
//
//        // Asynchronous download of PDF
//        var loadingTask = pdfjsLib.getDocument(url);
//        loadingTask.promise.then(function(pdf) {
//          console.log('PDF loaded');
//
//          // Fetch the first page
//          var pageNumber = 1;
//          pdf.getPage(pageNumber).then(function(page) {
//            console.log('Page loaded');
//            
//            detroyOldCharts();
//            var scale = 1.5;
//            var viewport = page.getViewport({scale: scale});
//
//            // Prepare canvas using PDF page dimensions
//            var canvas = document.getElementById('graph');
//            var context = canvas.getContext('2d');
//            canvas.height = viewport.height;
//            canvas.width = viewport.width;
//
//            // Render PDF page into canvas context
//            var renderContext = {
//              canvasContext: context,
//              viewport: viewport
//            };
//            $('#CallsChartWrap').show();            
//            var renderTask = page.render(renderContext);
//            renderTask.promise.then(function () {
//              console.log('Page rendered');
//            });
//            $('#CallsChartWrap').show();            
//          });
//        }, function (reason) {
//          // PDF loading error
//          console.error(reason);
//        });          
    } else if (document.getElementById("CustomRange").checked === true) {
        var startDateTime = document.getElementById("startTime").value;
        if (!isValidDateTimeString(startDateTime)) {
            alert("The Start Date (" + startDateTime + ") is not correctly specified (YYYY-MM-DD hh:mm)")
        } else {
            // check that the end date-time is valid
            var endDateTime = document.getElementById("endTime").value;
            if (!isValidDateTimeString(endDateTime)) {
                alert("The End Date (" + endDateTime + ") is not correctly specified (YYYY-MM-DD hh:mm)")
            } else {
                if (endDateTime <= startDateTime) {
                    alert("The End Date-Time is before the Start Date-Time")
                } else {            
                    subdir = $('#site :selected').text().trim();
                    siteOrCustomer = document.getElementById("site").value;
                    xmlhttp.open("GET","RANMateMetrics_CreateCustomReport.php?Site=" + subdir + "&StartDateTime=" + startDateTime + "&EndDateTime=" + endDateTime,false);
                    xmlhttp.send();

                    if (xmlhttp.status === 200) {
                        //console.log("RANMateMetrics_CreateCustomReport.php response is " + xmlhttp.responseText);
                        fileNameDate = startDateTime.substring(0,10).replace(/-/g, '') + "-" + endDateTime.substring(0,10).replace(/-/g, '');
                        if (customerReportSelected) {
                            siteOrCustomer = siteOrCustomer.substring(10).trim();
                            customer = subdir.substring(10).trim();
                            window.open('reports/custom/' + customer + '/StrattoOpenCell Service Report - ' + customer + ' ' + fileNameDate +'.pdf');
                        } else {
                            // window.open('/var/Concert/reports/sites/StrattoOpenCell Service Report - ' + siteOrCustomer + ' ' + selectedMonth +'.pdf');
                            window.open('reports/custom/' + subdir + '/StrattoOpenCell Service Report - ' + subdir + ' ' + fileNameDate +'.pdf');
                        }
                    } else {
                        console.log("Error invoking RANMateMetrics_CreateCustomReport.php: " + xmlhttp.status);
                    }
                 
                    //                    
//                    https://stackoverflow.com/questions/46012054/how-to-convert-html-page-to-pdf-then-download-it
//                    https://www.sitepoint.com/generating-pdfs-from-web-pages-on-the-fly-with-jspdf/                    
                    
//                    <div id="content">
//                      <h1 style="color:red">Hello World</h1>
//                      <p>this is a PDF</p>
//                    </div>            
                }
            }
        }
    } else {
        alert("A valid report type must be selected");
    }    
}

function showGraph(id, visible, siteParam) {
    // check that the start date-time is valid
    yLabelTitle = ''; // clear the label, just in case
    var metric = document.getElementById("metric").value;
    if (metric == "") {
        alert("A metric must be selected");
    } else {
        var site;
        if (siteParam == null) {
             site = document.getElementById("site").value;
        } else {
            site = siteParam;
        }
        if (site == "") {
            alert("A site must be selected");
        } else {
            if ($('#site').val().length > 1 && $('#site').val()[0].startsWith(" 5 Worst")) {
                alert("The \"5 Worst Sites\" cannot be selected with any other sites");
            } else if ($('#site').val().length > 1 && $('#site').val()[0].startsWith(" All Sites")) {
                alert("\"All Sites\" cannot be selected with any other sites");
            } else if (metric == "Reports") {
                // this function is already cluttered enough without trying to add PDF report handling
                showReport();
            } else {            
                var startDateTime = document.getElementById("startTime").value;
                if (!isValidDateTimeString(startDateTime)) {
                    alert("The Start Date (" + startDateTime + ") is not correctly specified (" + timeFormat + ")")
                } else {
                    // check that the end date-time is valid
                    var endDateTime = document.getElementById("endTime").value;
                    if (!isValidDateTimeString(endDateTime)) {
                        alert("The End Date (" + endDateTime + ") is not correctly specified (" + timeFormat + ")")
                    } else {
                        // check that the start time is before the end time
                        var metricTypesForPhp = new HashSet();                            
                        if (endDateTime <= startDateTime) {
                            alert("The End Date-Time is before the Start Date-Time")
                        } else {
                            // if it's a Femto metric get all the values of the tick boxes
                            var query;
                            if ((metric.substring(0,6) == "Femto-") || (metric.substring(0,9) == "FemtoKPI-") || (metric.substring(0,13) == "FemtoCounter-")) {
//                                ((metric.substring(0,9) == "FemtoKPI-") && (granularity == "PerFemto")) || 
//                                ((metric.substring(0,13) == "FemtoCounter-") && (granularity == "PerFemto"))) {
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
                                if (metric.substring(0,6) == "Femto-") {
                                    var metricName = metric.substring(6);
                                } // FemtoKPI and FemtosCounter metrics are now handled in separate dedicated functions and invoked from further on in the code

                                if (!(vfChecked || o2Checked || thChecked || eeChecked) && (granularity != "PerSwitch") && (granularity != "PerSite") ) {
                                    console.log("At least 1 operator must be ticked");
                                    alert("At least 1 operator must be ticked");
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

                                    if (!(fap1Checked || fap2Checked || fap3Checked || fap4Checked || fap5Checked || fap6Checked || fap7Checked || fap8Checked)  && (granularity != "PerSwitch") && (granularity != "PerSite")) {
                                        alert("At least 1 Femto Number must be ticked")
                                        return;
                                    } else {
                                        if ((metric.substring(0,9) == "FemtoKPI-") || (metric.substring(0,13) == "FemtoCounter-")) {
                                            femtoIds = [];
                                            if (vfChecked && fap1Checked) { femtoIds.push("1"); cells = ' AS VF_1'; }
                                            if (o2Checked && fap1Checked) { femtoIds.push("2"); cells = ' AS O2_1'; }
                                            if (thChecked && fap1Checked) { femtoIds.push("3"); cells = ' AS 3_1'; }
                                            if (eeChecked && fap1Checked) { femtoIds.push("4"); cells = ' AS EE_1'; }
                                            if (vfChecked && fap2Checked) { femtoIds.push("5"); cells = ' AS VF_2'; }
                                            if (o2Checked && fap2Checked) { femtoIds.push("6"); cells = ' AS O2_2'; }
                                            if (thChecked && fap2Checked) { femtoIds.push("7"); cells = ' AS 3_2'; }
                                            if (eeChecked && fap2Checked) { femtoIds.push("8"); cells = ' AS EE_2'; }
                                            if (vfChecked && fap3Checked) { femtoIds.push("9"); cells = ' AS VF_3'; }
                                            if (o2Checked && fap3Checked) { femtoIds.push("10"); cells = ' AS O2_3'; }
                                            if (thChecked && fap3Checked) { femtoIds.push("11"); cells = ' AS 3_3'; }
                                            if (eeChecked && fap3Checked) { femtoIds.push("12"); cells = ' AS EE_3'; }
                                            if (vfChecked && fap4Checked) { femtoIds.push("13"); cells = ' AS VF_4'; }
                                            if (o2Checked && fap4Checked) { femtoIds.push("14"); cells = ' AS O2_4'; }
                                            if (thChecked && fap4Checked) { femtoIds.push("15"); cells = ' AS 3_4'; }
                                            if (eeChecked && fap4Checked) { femtoIds.push("16"); cells = ' AS EE_4'; }
                                            if (vfChecked && fap5Checked) { femtoIds.push("17"); cells = ' AS VF_5'; }
                                            if (o2Checked && fap5Checked) { femtoIds.push("18"); cells = ' AS O2_5'; }
                                            if (thChecked && fap5Checked) { femtoIds.push("19"); cells = ' AS 3_5'; }
                                            if (eeChecked && fap5Checked) { femtoIds.push("20"); cells = ' AS EE_5'; }
                                            if (vfChecked && fap6Checked) { femtoIds.push("21"); cells = ' AS VF_6'; }
                                            if (o2Checked && fap6Checked) { femtoIds.push("22"); cells = ' AS O2_6'; }
                                            if (thChecked && fap6Checked) { femtoIds.push("23"); cells = ' AS 3_6'; }
                                            if (eeChecked && fap6Checked) { femtoIds.push("24"); cells = ' AS EE_6'; }
                                            if (vfChecked && fap7Checked) { femtoIds.push("25"); cells = ' AS VF_7'; }
                                            if (o2Checked && fap7Checked) { femtoIds.push("26"); cells = ' AS O2_7'; }
                                            if (thChecked && fap7Checked) { femtoIds.push("27"); cells = ' AS 3_7'; }
                                            if (eeChecked && fap7Checked) { femtoIds.push("28"); cells = ' AS EE_7'; }
                                            if (vfChecked && fap8Checked) { femtoIds.push("29"); cells = ' AS VF_8'; }
                                            if (o2Checked && fap8Checked) { femtoIds.push("30"); cells = ' AS O2_8'; }
                                            if (thChecked && fap8Checked) { femtoIds.push("31"); cells = ' AS 3_8'; }
                                            if (eeChecked && fap8Checked) { femtoIds.push("32"); cells = ' AS EE_8'; }                                                
                                            //console.log("femtoIds are now populated " + femtoIds);
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
                                        }

    //                                    query = "SELECT measurement_time" + cells + " FROM metrics." + metric.substring(6) +
    //                                            " WHERE " + metric.substring(6) + ".site_id=(SELECT SwitchIP from `ranmate-femto`.customer_config where customer_config.Site='" + siteOnly + "' AND customer_config.SwitchLocation='" + floorOnly + "' GROUP BY SwitchIP) " +
    //                                            "AND measurement_time BETWEEN '" + startDateTime + "' AND '" + endDateTime + "' " +
    //                                            "GROUP BY measurement_time;";
                                        // siteFloorStr = "((customer_config.Site = ";
                                        // siteFloorStr = siteFloorStr + ')';

                                        if ((metric.substring(0,6) == "Femto-") && (siteParam == null) && ($('#site').val().length > 1)) { // this is going to be tough, pivot needed
                                            console.log("Pivoting");
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
                                                            // pivotStr = " case when " + metricName + ".site_name = \'" + selectedSite + "\' then " + metricName + "." + cellList[j][0] + " end AS `" + columnName + '`';
                                                            pivotStr = " case when " + metricName + ".site_name = \'" + selectedSite + "\' then ROUND(" + metricName + "." + cellList[j][0] + ",3) end AS `" + columnName + '`';
                                                        } else {
                                                            // pivotStr += ", case when " + metricName + ".site_name = \'" + selectedSite + "\' then " + metricName + "." + cellList[j][0] + " end AS `" + columnName + '`';
                                                            pivotStr += ", case when " + metricName + ".site_name = \'" + selectedSite + "\' then ROUND(" + metricName + "." + cellList[j][0] + ",3) end AS `" + columnName + '`';
                                                        }
                                                        //columnsStr += ",\n sum(`" + columnName + "`) AS `" + columnName + '`';
                                                        columnsStr += ", sum(`" + columnName + "`) AS `" + columnName + '`';
                                                    }
                                                } else {
                                                    // siteFloorStr = siteFloorStr + '\'' + siteOnly + "\' AND customer_config.SwitchLocation = \'" + floorOnly + '\')';
                                                    // siteFloorStr += ',\'' + selectedSite.replace(" - ", "-") + '\'';
                                                    siteFloorStr += ',\'' + selectedSite + '\'';
                                                    for (j = 0; j < cellList.length; j++) {
                                                        columnName = selectedSite + ' ' + cellList[j][1];
                                                        //pivotStr += ", case when " + metricName + ".site_name = \'" + selectedSite + "\' then " + metricName + "." + cellList[j][0] + " end AS `" + columnName + '`';
                                                        pivotStr += ", case when " + metricName + ".site_name = \'" + selectedSite + "\' then ROUND(" + metricName + "." + cellList[j][0] + ",3) end AS `" + columnName + '`';
                                                        columnsStr += ", sum(`" + columnName + "`) AS `" + columnName + '`';
                                                    }
                                                }
                                            }

            // MW IF needed here to handle FemtoCounter logic
                                            query = "drop view if exists " + metricName + "_tmp;" +
                                                    "create view " + metricName + "_tmp as ( SELECT measurement_time, " +
                                                    pivotStr +
                                                    " FROM metrics." + metricName + 
                                                    " WHERE " + metricName + ".site_name IN (" + siteFloorStr + ") " +
                                                    "AND measurement_time BETWEEN '" + startDateTime + "' AND '" + endDateTime + "' " +
                                                    "ORDER BY measurement_time, site_id);" +
                                                    "select measurement_time" +
                                                    columnsStr +
                                                    " from " + metricName + "_tmp " +
                                                    "group by measurement_time";

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

                                        } else { // just the usual single site
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

// packets SQL for multiple cells
// sql is SELECT measurement_time, cell_19 AS EE_5, cell_23 AS EE_6 FROM metrics.packets WHERE packets.site_name = '15 Bishopsgate-1st Floor IT Room SW1' AND measurement_time BETWEEN '2019-07-20 18:07' AND '2019-07-22 00:07' GROUP BY measurement_time;
// Single Femto counter single cell
// sql is SELECT measurement_time, NUMBEROFTXBYTES FROM OpenCellCM.Femto, metrics.mno_counters WHERE Femto.IMEI != 'N/A' AND mno_counters.IMEI = Femto.IMEI AND Femto.id = 3 AND 'South Bank Central-Alto Tower 3rd Floor' = CONCAT(Femto.site_name, '-', switch_id) AND measurement_time BETWEEN '2019-07-16 18:07' AND '2019-07-22 00:07' GROUP BY measurement_time;
// Multiple Femto counters single cell
// sql is SELECT measurement_time, NUMBEROFRXBYTES,NUMBEROFTXBYTES FROM OpenCellCM.Femto, metrics.mno_counters WHERE Femto.IMEI != 'N/A' AND mno_counters.IMEI = Femto.IMEI AND Femto.id = 3 AND 'South Bank Central-Alto Tower 3rd Floor' = CONCAT(Femto.site_name, '-', switch_id) AND measurement_time BETWEEN '2019-07-16 18:44' AND '2019-07-22 00:44' GROUP BY measurement_time;
// Multiple Femto counters multiple cells (cell counts aggregated) maybe they'll want to pivot this one
// SELECT measurement_time, SUM(NUMBEROFTXBYTES),SUM(NUMBEROFRXBYTES) FROM OpenCellCM.Femto, metrics.mno_counters WHERE Femto.IMEI != 'N/A' AND mno_counters.IMEI = Femto.IMEI AND (Femto.id = 3 OR Femto.id = 7) AND 'South Bank Central-Alto Tower 3rd Floor' = CONCAT(Femto.site_name, '-', switch_id) AND measurement_time BETWEEN '2019-07-16 18:44' AND '2019-07-22 00:44' GROUP BY measurement_time;
                                            if ((metric.substring(0,9) == "FemtoKPI-") || (metric.substring(0,13) == "FemtoCounter-")) {
                                                if (metric.substring(0,9) == "FemtoKPI-") {
                                                    var metricTypeLength = 9;
                                                    var tableName = 'mno_kpis';
                                                } else {
                                                    var metricTypeLength = 13;
                                                    var tableName = 'mno_counters';
                                                }                 
                                                //console.log("Just to decide Femto PM metric type: " + $('#metric').val().length + " " + $('#site').val().length + " " + femtoCountersPerFemto);
                                                // 1 Metric 1 site - have to handle here also where there's only 1 site but it's per Femto and there's multiple cells checked                                                
                                                console.log("Decide Femto PM metric type: #metrics=" + $('#metric').val().length + ", #sites=" + $('#site').val().length + ", femtoCountersPerFemto=" + femtoCountersPerFemto + ", #femtoIds=" + femtoIds.length);
                                                if (($('#metric').val().length == 1) && ((($('#site').val().length == 1) && (!femtoCountersPerFemto)) || (femtoCountersPerFemto && ($('#site').val().length == 1) && (femtoIds.length == 1)))) {
                                                    console.log("getSQL_FemtoPM_SingleMetric_SingleSite()");
                                                    query = getSQL_FemtoPM_SingleMetric_SingleSite(metricTypeLength, $('#metric').val(), tableName, $('#site').val(), femtoIds, startDateTime, endDateTime);
                                                } else if (($('#metric').val().length > 1) && ($('#site').val().length == 1) ) { // Multiple metrics 1 site
                                                    console.log("getSQL_FemtoPM_MultiMetric_SingleSite()");
                                                    query = getSQL_FemtoPM_MultiMetric_SingleSite(metricTypeLength, $('#metric').val(), tableName, $('#site').val(), femtoIds, startDateTime, endDateTime);
                                                } else if (($('#metric').val().length == 1) && (($('#site').val().length > 1) || (femtoCountersPerFemto && femtoIds.length > 1))) { 
                                                    // 1 Metric multiple sites
                                                    console.log("getSQL_FemtoPM_SingleMetric_MultiSite()");
                                                    query = getSQL_FemtoPM_SingleMetric_MultiSites(metricTypeLength, $('#metric').val(), tableName, $('#site').val(), femtoIds, startDateTime, endDateTime);
                                                } else { // Multiple metrics multiple sites
                                                    console.log("getSQL_FemtoPM_MultiMetric_MultiSite()");
                                                    query = getSQL_FemtoPM_MultiMetric_MultiSites(metricTypeLength, $('#metric').val(), tableName, $('#site').val(), femtoIds, startDateTime, endDateTime);
                                                }
                                            } else {
                                                query = "SELECT measurement_time" + cells + " FROM metrics." + metricName +
                                                        //" WHERE " + metricName + ".site_name = '" + site.replace(" - ", "-") +
                                                        " WHERE " + metricName + ".site_name = '" + site.replace(/ - ([^ ])/, "-$1") +
                                                        "' AND measurement_time BETWEEN '" + startDateTime + "' AND '" + endDateTime + "' " +
                                                        "GROUP BY measurement_time;";
                                            }
                                        }
                                        //console.log("showGraph() SQL is " + query);
                                    }
                                }
                            } else if (metric.substring(0,8) == "Traffic-") {
                                metricTypesForPhp.add("Traffic");
                                query = getTrafficSQL(metricName, startDateTime, endDateTime, ($('#site').val()[0] == " All Sites"), false, false);
                                //console.log("Traffic SQL is " + query);
                            } else if (metric.substring(0,6) == "Calls-") {
                                metricTypesForPhp.add("Calls");
                                query = getCallsSQL(metricName, startDateTime, endDateTime, ($('#site').val()[0] == " All Sites"), false, false);
                                //console.log("Calls SQL is " + query);
                                                               
                                
//                                query += "UNION " + 
//                                        "select DATE(measurement_time) AS Date, ROUND(((SUM(cell_0 + cell_4 + cell_8 + cell_12 + cell_16 + cell_20 + cell_24 + cell_28)/ SUM(cell_0 + cell_4 + cell_8 + cell_12 + cell_16 + cell_20 + cell_24 + cell_28 + cell_1 + cell_5 + cell_9 + cell_13 + cell_17 + cell_21 + cell_25 + cell_29 + cell_2 + cell_6 + cell_10 + cell_14 + cell_18 + cell_22 + cell_26 + cell_30 + cell_3 + cell_7 + cell_11 + cell_15 + cell_19 + cell_23 + cell_27 + cell_31)) * 100),1) AS 'VF', ROUND(((SUM(cell_1 + cell_5 + cell_9 + cell_13 + cell_17 + cell_21 + cell_25 + cell_29)/SUM(cell_0 + cell_4 + cell_8 + cell_12 + cell_16 + cell_20 + cell_24 + cell_28 + cell_1 + cell_5 + cell_9 + cell_13 + cell_17 + cell_21 + cell_25 + cell_29 + cell_2 + cell_6 + cell_10 + cell_14 + cell_18 + cell_22 + cell_26 + cell_30 + cell_3 + cell_7 + cell_11 + cell_15 + cell_19 + cell_23 + cell_27 + cell_31)) * 100),1) AS 'O2', ROUND(((SUM(cell_2 + cell_6 + cell_10 + cell_14 + cell_18 + cell_22 + cell_26 + cell_30)/SUM(cell_0 + cell_4 + cell_8 + cell_12 + cell_16 + cell_20 + cell_24 + cell_28 + cell_1 + cell_5 + cell_9 + cell_13 + cell_17 + cell_21 + cell_25 + cell_29 + cell_2 + cell_6 + cell_10 + cell_14 + cell_18 + cell_22 + cell_26 + cell_30 + cell_3 + cell_7 + cell_11 + cell_15 + cell_19 + cell_23 + cell_27 + cell_31)) * 100),1) AS 'THREE', ROUND(((SUM(cell_3 + cell_7 + cell_11 + cell_15 + cell_19 + cell_23 + cell_27 + cell_31)/SUM(cell_0 + cell_4 + cell_8 + cell_12 + cell_16 + cell_20 + cell_24 + cell_28 + cell_1 + cell_5 + cell_9 + cell_13 + cell_17 + cell_21 + cell_25 + cell_29 + cell_2 + cell_6 + cell_10 + cell_14 + cell_18 + cell_22 + cell_26 + cell_30 + cell_3 + cell_7 + cell_11 + cell_15 + cell_19 + cell_23 + cell_27 + cell_31)) * 100),1) AS 'EE' " +
//                                        "FROM metrics.packets WHERE measurement_time BETWEEN '2018-02-09 06:40' AND '2018-02-10 12:40'  AND packets.site_name REGEXP 'Aldwych';";
//                                if (metric.substring(metric.length - 7) == "(Daily)") {
//                                    if ($('#site').val()[0] == " All Sites") {
//                                        query = getTrafficCommonSQL(metricName, startDateTime, endDateTime);                                        
//                                    } else {
//                                        query = getTrafficCommonSQL(metricName, startDateTime, endDateTime);
//                                    }                                
//                                } else {
//                                    if ($('#site').val()[0] == " All Sites") {
//                                        query = getTrafficCommonSQL(metricName, startDateTime, endDateTime);
//                                        
//                                    } else {
//                                        query = getTrafficCommonSQL(metricName, startDateTime, endDateTime);
//                                    }                                                                   
//                                } 
//                              // [MW] THIS IS THE IMPORTANT ONE TO UNCOMMENT FOR TRACING
                                //console.log("Traffic SQL is " + query);
                                //console.log("Metric Type is " + metricTypes.values()[0]);
                            } else { // Separate the Backhaul metrics into 1 Metrics : 1 Site, 1 Metrics : N Sites, N Metrics : 1 Site and N Metrics : N Sites
                                //console.log("#metrics=" + $('#metric').val().length + ", and #sites=" + $('#site').val().length)
                                // 1 Metric : 1 Site
                                if (($('#metric').val().length == 1) && ($('#site').val().length == 1) ) { 
                                    if (metric.substring(0,6) == "Buddy-") { 
                                        metricTypesForPhp.add("Buddy");
                                        query = getSQL_Buddy_SingleMetric_SingleSite(metric, site, startDateTime, endDateTime);
                                        //console.log("Buddy SQL is " + query);
                                    } else if (metric.substring(0,5) == "Ping-"){  // Backhaul Counter Metric
                                        metricTypesForPhp.add("Ping");
                                        query = getSQL_Ping_SingleMetric_SingleSite(metric, site, startDateTime, endDateTime);
                                        //console.log("Ping SQL is " + query);
                                    } else if (metric.substring(0,8) == "Counter-"){  // Backhaul Counter Metric
                                        metricTypesForPhp.add("Counter");
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
                                        metricTypesForPhp.add("Ping");
                                        query = getSQL_Ping_SingleMetric_MultiSites(metric, $('#site').val(), startDateTime, endDateTime);
                                        console.log("Ping SQL is " + query + " for " + $('#site').val());
                                    } else if (metric.substring(0,6) == "Buddy-") { 
                                        metricTypesForPhp.add("Buddy");
                                        query = getSQL_Buddy_SingleMetric_MultiSites(metric, $('#site').val(), startDateTime, endDateTime);
                                        console.log("Buddy SQL is " + query);
                                    } else if (metric.substring(0,8) == "Counter-"){  // Backhaul Counter Metric
                                        metricTypesForPhp.add("Counter");
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
                                            metricTypesForPhp.add("Buddy");
                                            if ($('#metric').val().length > 3) {
                                                alert("The maximum number of Buddy metrics that can be displayed on the same graph is 3");
                                                return;
                                            } else {
                                                query = getSQL_Buddy_MultiMetrics_SingleSite($('#metric').val(), site, startDateTime, endDateTime);
                                                if (query === null) { return; }
                                                console.log("Buddy SQL is " + query);
                                            }
                                        } else if (metricTypes[0] == "Ping") {
                                            metricTypesForPhp.add("Ping");
                                            query = getSQL_Ping_MultiMetrics_SingleSite($('#metric').val(), site, startDateTime, endDateTime);
                                        } else if (metricTypes[0] == "Counter") {
                                            metricTypesForPhp.add("Counter");
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
                                        metricTypesForPhp.add("Mixed");
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
                                    //console.log("showGraph() data=" + this.responseText.substring(0,5000));
                                    // response string
                                    // [{"time":"2016-11-05 03:55:00","VF_1":"152","O2_1":"90"},{"time":"2016-11-05 04:00:00","VF_1":"157","O2_1":"90"},{"tim...
                                    // console.log("The index is " + this.responseText.indexOf("<data>(No data available for query"));
                                    // disable the graph button
                                    //console.log("Enabling the graph button");
                                    document.getElementById("graphButton").disabled = false;
                                    document.getElementById("graphButton").value = 'Show';
                                    //gb.display = 'block';
                                    // var g = document.getElementById("graph");
                                    // g.display = 'block';
                                    if (this.responseText.indexOf("No data available for query") > -1) {
                                        alert("Metrics data does not exist for this interval at this site");
                                    } else {
                                        //console.log("response text is " + this.responseText);
                                        var metrics = JSON.parse(this.responseText);
                                        if ((metric.substring(0,8) !== "Traffic-") && (metric.substring(0,6) !== "Calls-")) {
                                            var graphTimes = new Array();
                                            var graphValues = new Map(); // one entry for each metric
                                            for (var key in metrics) {
                                                var measurement = metrics[key];
                                                var dataPoints;
                                                for (var entry in measurement) {
                                                    if (entry === 'time') {
                                                        graphTimes.push(measurement[entry]);
                                                        //console.log("Adding time " + measurement[entry]);
                                                    } else {
                                                        // add the data point to a Map, null or missing values will get "spanned" (spanGap)
                                                        if (graphValues.has(entry)) {
                                                            graphValues.get(entry).push(measurement[entry]);
                                                            //console.log("   Adding measurement " + entry + "=" + measurement[entry]);
                                                        } else {
            //                                                console.log("   How is measurement " + entry + "=" + measurement[entry] + " being stored?");
                                                            graphValues.set(entry, new Array(measurement[entry]));
                                                        }
                                                    }
                                                }
                                            }
                                        } else {                                            
                                            // prepare the chart
                                            var trafficTableDef ="<table align=\"center\" style=\"width:90%\">"; // ;table-layout:auto had no effect
                                            var trafficTableCols = "";
                                            var trafficTableRows = "";
                                            
                                            // prepare the chart
                                            var chartLabels = new Array();
                                            var trafficChartTitles = new Array();
                                            if (metric.substring(0,8) == "Traffic-") {
                                                var numCharts = 8;                                               
                                            } else if (metric.substring(0,6) == "Calls-") {
                                                var numCharts = 3;
                                            }
                                            console.log(numCharts + " traffic charts being initialised");
                                            var trafficCharts = new Array(numCharts);
                                            for (nero=0; nero < numCharts; nero++) {
                                                trafficCharts[nero] = new Array();
                                            }
                                            trafficCharts[0] = new Array();
                                            var chartColours = ['rgba(255,36,36,1)','rgba(42,137,192,1)','rgba(182,95,194,1)','rgba(43,172,177, 1)'];
                                            maxMBytesToChart = 0;
                                            for (var kpi in metrics) {
                                                //console.log("JS: 'kpi in metrics' is " + kpi); // Output says it's 0
                                                var chartValues = new Array();
                                                var measurement = metrics[kpi];
                                                var dataPoints;
                                                var trafficTableRow = "";
                                                var date;
                                                for (var entry in measurement) {
                                                    if (entry !== 'time') {
                                                        if (entry === 'metric_name') {
                                                            trafficChartTitles.push(measurement[entry]);
                                                            date = measurement[entry];
                                                            //console.log("Adding metric " + measurement[entry]);                                                            
                                                        } else if (entry === 'site_name') {
                                                            console.log("site_name filtered out");
                                                        } else {
                                                            // console.log("   Adding measurement " + entry + "=" + measurement[entry]);
                                                            if (kpi == 0) {
                                                                chartLabels.push(entry);
                                                                trafficTableCols += "<th>" + entry + "</th>"
                                                            }
                                                            // GROUP BY SQL required by table output format generates more rows than can be anticipated for charts
                                                            if (!trafficTableOutput) {
                                                                trafficCharts[kpi].push(measurement[entry]);
                                                            }
                                                            chartValues.push(measurement[entry]);
                                                            var numMbytes = parseFloat(measurement[entry]);
                                                            if (numMbytes > maxMBytesToChart) {
                                                                maxMBytesToChart = numMbytes;
                                                                //console.log("maxMBytesToChart is now " + maxMBytesToChart);
                                                            } 
                                                        }
                                                    } 
                                                    trafficTableRow += "<td>" + measurement[entry] + "</td>"
                                                }
                                                trafficTableRows += "<tr>" + trafficTableRow + "</tr>";
                                            }
                                            if (perSite) {
                                                trafficTableCols = "<tr><th>Date</th><th>Site</th><th>Metric</th>" + trafficTableCols + "</tr>";
                                            } else {
                                                trafficTableCols = "<tr><th>Date</th><th>Metric</th>" + trafficTableCols + "</tr>";                                                
                                            }
                                            trafficTableRows += "</table>";
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
            //                                        alert(entry + ' ' + measurement[entry]);

        //                                var ctx = document.getElementById("graph");
                                        var canvas = document.getElementById("graph");
                                        var ctx = canvas.getContext("2d"); // Get the context to draw on.
                                        destroyOldCharts();
//                                        if (typeof myChart !== 'undefined') {
//                                            console.log("Destroying the Single Graph Chart");
//                                            myChart.destroy();
//                                        } else {
//                                            try {
//                                                myChart.destroy();                                                                 
//                                            } catch (err) {
//                                                console.log("Error destroying the single graph chart, " + err.message);
//                                            }                                            
//                                        }
                                        if ((metric.substring(0,8) == "Traffic-") || (metric.substring(0,6) == "Calls-")) {
                                            $('#GraphWrap').hide();
                                            if (trafficTableOutput) {
                                                //console.log("Outputting metrics data in table format");
                                                $('#TrafficTableWrap').show();
                                                $('#TrafficChartWrap').hide();
                                                $('#CallsChartWrap').hide();
                                                // console.log("Table HTML is " + trafficTableDef + trafficTableCols + trafficTableRows);
                                                document.getElementById("TrafficTableWrap").innerHTML = trafficTableDef + trafficTableCols + trafficTableRows;
                                            } else if (metric.substring(0,8) == "Traffic-") {
                                                var chartType, legendDisplay;
                                                if (trafficBarOutput) {
                                                    chartType = 'bar';
                                                    legendDisplay = false;
                                                } else {
                                                    chartType = 'pie';
                                                    legendDisplay = true;
                                                }                                                    
                                                //console.log("Outputting metrics data in chart format");
                                                $('#TrafficChartWrap').show();
                                                $('#TrafficTableWrap').hide();
                                                $('#CallsChartWrap').hide();

                                                var inc = 10;
                                                if (maxMBytesToChart < 100) {            inc = 10; 
                                                } else if (maxMBytesToChart < 200) {     inc = 20;
                                                } else if (maxMBytesToChart < 500) {     inc = 50;
                                                } else if (maxMBytesToChart < 1000) {    inc = 100;
                                                } else if (maxMBytesToChart < 2000) {    inc = 200;
                                                } else if (maxMBytesToChart < 5000) {    inc = 500;
                                                } else if (maxMBytesToChart < 10000) {   inc = 1000;
                                                } else if (maxMBytesToChart < 20000) {   inc = 2000;
                                                } else if (maxMBytesToChart < 50000) {   inc = 5000;
                                                } else if (maxMBytesToChart < 100000) {  inc = 10000;
                                                } else if (maxMBytesToChart < 200000) {  inc = 20000;
                                                } else if (maxMBytesToChart < 500000) {  inc = 50000;
                                                } else if (maxMBytesToChart < 1000000) { inc = 100000;
                                                } else { inc = 200000;
                                                }
                                                // MW - extend this with more clauses if necessary
                                                var r1 = Math.round(maxMBytesToChart / inc) * inc;
                                                if (r1 > maxMBytesToChart) {
                                                    //console.log("The upper range should be " + r1);
                                                } else {
                                                    r1 += inc;
                                                    //console.log("The upper range should be " + r1);  
                                                }

                                                destroyOldCharts();
                                                for (row = 0; row < 2; row++) {
                                                    for (col = 0; col < 4; col++) {
//                                                        console.log("volumeChartNames[" + row + "][" + col + "] is " + document.getElementById(volumeChartNames[row][col]));
                                                        gridCanvas[row][col] = document.getElementById(volumeChartNames[row][col]);
                                                        gridCtx[row][col] = gridCanvas[row][col].getContext("2d"); // Get the context to draw on.
                                                        
//                                                        if (typeof gridCharts[row][col] !== 'undefined') { 
//                                                            console.log("Destroying the multiple (2d) Traffic Charts");
//                                                            gridCharts[row][col].destroy(); 
//                                                        } else {
//                                                            try {
//                                                                gridCharts[row][col].destroy();                                                                 
//                                                            } catch (err) {
//                                                                console.log("Error destroying one of multiple traffic charts [" + row + "][" + col + "], " + err.message);
//                                                            }                                                            
//                                                        }

                                                        //console.log("trafficCharts[" + (col + (4 * row)) + "] = " + trafficCharts[(col + (4 * row))]);
                                                        //console.log("The typeof maxMBytesToChart is " + typeof maxMBytesToChart + " and value is " + maxMBytesToChart);
                                                         
                                                        gridCharts[row][col] = new Chart(gridCtx[row][col], {
                                                            type: chartType,
                                                            data: {
                                                                labels: chartLabels,
//                                                                datasets: [{ data: chartValues, backgroundColor: chartColours }],                                                    
                                                                datasets: [{ 
                                                                        data: trafficCharts[(col + (4 * row))],
                                                                        //data: [38.8, 26.5, 15.4, 19.2],                                                                        
                                                                        backgroundColor: chartColours }],                                                    
                                                             },
                                                           options: {
                                                                title: {
                                                                    display: true,
//                                                                    text: chartTitles[row][col],
                                                                    text: trafficChartTitles[col + (4 * row)],
                                                                    fontSize: 20,
                                                                    position: 'bottom'
                                                                },
                                                                scales: {
                                                                    xAxes: [{ display:!legendDisplay, gridLines: { display: false } }],
                                                                    yAxes: [{
                                                                        display:!legendDisplay,
                                                                        gridLines: { display:!legendDisplay },
//                                                                        ticks: { beginAtZero:true },
//                                                                        ticks: { beginAtZero:true, max: maxMBytesToChart },
                                                                        ticks: { beginAtZero:true, max: r1 },
//                                                                        ticks: { beginAtZero:true, max: 500 },
                                                                        scaleLabel: {
                                                                            display: true,
                                                                            labelString: 'MBytes'
                                                                        }
                                                                    }]
                                                                },                                                                
                                                                legend: {
                                                                    display: legendDisplay,
                                                                    width: 15,
                                                                    labels: { boxWidth: 25 }
                                                                },
                                                                plugins: {
                                                                    labels: {
                                                                        // configurable parameters and their possible values https://github.com/emn178/chartjs-plugin-labels
                                                                        render: 'percentage',
                                                                        fontColor: ['white', 'white', 'white', 'white'],
                                                                        position: 'border',
                                                                        precision: 0
                                                                    }
                                                                }                                                                      
                                                            }
                                                        });                                            
                                                    }                                                    
                                                }                                                                                                
                                            } else { // metric.substring(0,6) == "Calls-")
                                                var chartType, legendDisplay;
                                                if (trafficBarOutput) {
                                                    chartType = 'bar';
                                                    legendDisplay = false;
                                                } else {
                                                    chartType = 'pie';
                                                    legendDisplay = true;
                                                }                                                    
                                                $('#CallsChartWrap').show();
                                                $('#TrafficChartWrap').hide();
                                                $('#TrafficTableWrap').hide();

                                                var inc = 10;
                                                if (maxMBytesToChart < 100) {            inc = 10; 
                                                } else if (maxMBytesToChart < 200) {     inc = 20;
                                                } else if (maxMBytesToChart < 500) {     inc = 50;
                                                } else if (maxMBytesToChart < 1000) {    inc = 100;
                                                } else if (maxMBytesToChart < 2000) {    inc = 200;
                                                } else if (maxMBytesToChart < 5000) {    inc = 500;
                                                } else if (maxMBytesToChart < 10000) {   inc = 1000;
                                                } else if (maxMBytesToChart < 20000) {   inc = 2000;
                                                } else if (maxMBytesToChart < 50000) {   inc = 5000;
                                                } else if (maxMBytesToChart < 100000) {  inc = 10000;
                                                } else if (maxMBytesToChart < 200000) {  inc = 20000;
                                                } else if (maxMBytesToChart < 500000) {  inc = 50000;
                                                } else if (maxMBytesToChart < 1000000) { inc = 100000;
                                                } else if (maxMBytesToChart < 2000000) { inc = 200000;
                                                } else if (maxMBytesToChart < 4000000) { inc = 400000;
                                                } else if (maxMBytesToChart < 8000000) { inc = 800000;
                                                } else { inc = 1600000;
                                                }
                                                // MW - extend this with more clauses if necessary
                                                var r1 = Math.round(maxMBytesToChart / inc) * inc;
                                                if (r1 > maxMBytesToChart) {
                                                    //console.log("The upper range should be " + r1);
                                                } else {
                                                    r1 += inc;
                                                    //console.log("The upper range should be " + r1);  
                                                }

                                                destroyOldCharts();
                                                row = 0;
                                                //for (row = 0; row < 2; row++) { // not needed unless we adopt Keith's idea
                                                    for (col = 0; col < 3; col++) {
                                                        //console.log("volumeChartNames[" + row + "][" + col + "] is " + document.getElementById(callsChartNames[row][col]));
                                                        gridCanvas[row][col] = document.getElementById(callsChartNames[row][col]);
                                                        gridCtx[row][col] = gridCanvas[row][col].getContext("2d"); // Get the context to draw on.

//                                                        if (typeof gridCharts[row][col] !== 'undefined') { 
//                                                            console.log("Destroying the multiple (1d) Calls Charts");
//                                                            gridCharts[row][col].destroy(); 
//                                                        } else { // let's destroy it anyway
//                                                            try {
//                                                                gridCharts[row][col].destroy();                                                                 
//                                                            } catch (err) {
//                                                                console.log("Error destroying one of multiple calls charts [" + row + "][" + col + "], " + err.message);
//                                                            }
//                                                        }

                                                        //console.log("trafficCharts[" + (col + (4 * row)) + "] = " + trafficCharts[(col + (4 * row))]);
                                                        //console.log("The typeof maxMBytesToChart is " + typeof maxMBytesToChart + " and value is " + maxMBytesToChart);
                                                         
                                                        gridCharts[row][col] = new Chart(gridCtx[row][col], {
                                                            type: chartType,
                                                            data: {
                                                                labels: chartLabels,
//                                                                datasets: [{ data: chartValues, backgroundColor: chartColours }],                                                    
                                                                datasets: [{ 
                                                                        data: trafficCharts[(col + (4 * row))],
                                                                        //data: [38.8, 26.5, 15.4, 19.2],                                                                        
                                                                        backgroundColor: chartColours }],                                                    
                                                             },
                                                            options: {
                                                                title: {
                                                                    display: true,
//                                                                    text: chartTitles[row][col],
                                                                    text: trafficChartTitles[col + (4 * row)],
                                                                    fontSize: 20,
                                                                    position: 'bottom'
                                                                },
                                                                scales: {
                                                                    xAxes: [{ display:!legendDisplay, gridLines: { display: false } }],
                                                                    yAxes: [{
                                                                        display:!legendDisplay,
                                                                        gridLines: { display:!legendDisplay },
//                                                                        ticks: { beginAtZero:true },
//                                                                        ticks: { beginAtZero:true, max: maxMBytesToChart },
                                                                        ticks: { beginAtZero:true, max: r1 },
//                                                                        ticks: { beginAtZero:true, max: 500 },
                                                                        scaleLabel: {
                                                                            display: true,
                                                                            labelString: '# Calls'
                                                                        }
                                                                    }]
                                                                },                                                                
                                                                legend: {
                                                                    display: legendDisplay,
                                                                    width: 15,
                                                                    labels: { boxWidth: 25 }
                                                                },
                                                                plugins: {
                                                                    labels: {
                                                                        // configurable parameters and their possible values https://github.com/emn178/chartjs-plugin-labels
                                                                        render: 'percentage',
                                                                        fontColor: ['white', 'white', 'white', 'white'],
                                                                        position: 'border',                                                                        
                                                                        precision: 0
                                                                    }
                                                                }
                                                            }
                                                        });                                            
                                                    }                                                    
                                                // } // for 2 rows                                                                                                
                                            }
                                        } else {
                                            var graphLines = new Array();
                                            // add the collection to graphLines
                                            for (var [key, value] of graphValues) {
                                                // console.log("Processing " + key + " value=" + value);
                                                graphLines.push(formatGraphLine(key, value));
                                            }
                                            $('#TrafficChartWrap').hide();
                                            $('#TrafficTableWrap').hide();
                                            $('#CallsChartWrap').hide();
                                            $('#GraphWrap').show();
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
                                                    },
                                                    animation: {
                                                        onComplete: save
                                                    }
                                                }
                                            });
                                        }
                                        // for testing PDF doc generation
                                        //if ((metric.substring(0,8) == "Traffic-") || (metric.substring(0,6) == "Calls-")) {
                                        if (false) {
                                            // following code produces blank reports
                                            // var htmlpdfdoc = new jsPDF('p','pt','a4');
                                            //htmlpdfdoc.addHTML(document.getElementById('TrafficChartWrap'),function() {
                                            // basic and poor quality
//                                            htmlpdfdoc.addHTML(document.getElementsByTagName('body'),function() {
//                                                htmlpdfdoc.save('html_report.pdf');
//                                            });                                                            

                                            var testCanvas = gridCanvas[0][0];
                                            var testChart = gridCharts[0][0];
                                           //https://stackoverflow.com/questions/34897515/chartjs-jspdf-blurry-image
                                            var htmlpdfdoc = new jsPDF('l', 'mm',[210, 297]);
                                                //html2canvas($("#myChart"), {
                                                html2canvas($("#testChart"), {
                                                    onrendered: function(testCanvas) {         
                                                        var imgData = testCanvas.toDataURL('image/png',1.0);                  
                                                        htmlpdfdoc.text(130,15,"First PDF");
                                                        htmlpdfdoc.addImage(imgData, 'PNG',20,30,0,130); 
                                                        htmlpdfdoc.addHTML(testCanvas);
                                                        htmlpdfdoc.save('html_report.pdf');             
                                                    }       
                                            });
                                            
                                        }
                                        
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
                            destroyOldCharts();
                            
//                            if (typeof myChart !== 'undefined') {
//                                myChart.destroy();
//                            } else {
//                                try {
//                                    myChart.destroy();
//                                } catch (err) {
//                                    console.log("Error destroying chart, " + err.message);
//                                }                                
//                            }
                            var d = new Date();
                            startMillis = d.getTime();
                            // xmlhttp.open("GET","RANMateMetrics_MetricsDataSet.php?query="+query,true); 
                            console.log("sql is " + query);
                            xmlhttp.open("GET","RANMateMetrics_MetricsDataSet.php?query="+encodeURIComponent(query)+"&metrictype="+metricTypesForPhp.values()[0],true);
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
}

function save() {

}

// Takes no prisoners
function destroyOldCharts() {
    try { 
        if (typeof myChart !== 'undefined') {
            // console.log("Destroying the Single Graph Chart");
            myChart.destroy();
            // console.log("Destroyed the Single Graph Chart");
        } else {
            try {
                myChart.destroy();                                                                 
            } catch (err) {
                console.log("Error destroying the single graph chart, " + err.message);
            }
        }    
        for (row = 0; row < 2; row++) { 
            for (col = 0; col < 4; col++) {
                if (typeof gridCharts[row][col] !== 'undefined') { 
                    console.log("Destroying chart[" + row + "][" + col + "]");
                    gridCharts[row][col].destroy(); 
                    console.log("Destroyed chart[" + row + "][" + col + "]");
                } else { // let's destroy it anyway
                    try {
                        gridCharts[row][col].destroy();                                                                 
                    } catch (err) {
                        console.log("Error destroying charts [" + row + "][" + col + "], " + err.message);
                    }
                }
            }
        }
    } catch (unexpectedErr) {
        // commented out to quieten constant "gridCharts[row] is undefined" error
        // console.log("Unexpected error destroying charts, " + unexpectedErr.message);
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
    // if  it's a "5 worst sites" selection, then get the 5 worst sites before calling getSQL_Ping_SingleMetric_MultiSites() with them
    
//    console.log("getSQL_Ping_SingleMetric_SingleSite() site=" + site);
    if (site.length > 1 && site.startsWith(" Worst")) {
        //alert("\"5 Worst Sites\" functionality not yet activated");
        var mSel = document.getElementById("mSelect");
        var m = mSel.options[mSel.selectedIndex].value;            
        var nSel = document.getElementById("nSelect");
        var n = nSel.options[nSel.selectedIndex].value;            
//        console.log("m=" + m, "n=" + n);
        if (site.endsWith("24 hours)")) {
//            console.log("getSQL_Ping_SingleMetric_SingleSite() 24 hours");
            xmlhttp.open("GET","RANMateMetrics_WorstSiteList.php?group=" + metric + "&days=1&m=" + m + "&n=" + n,false);
            //xmlhttp.open("GET","RANMateMetrics_WorstSiteList.php?group=" + metric + "&days=1",false);
            endDateTime = document.getElementById("endTime").value = getNow();
            startDateTime = document.getElementById("startTime").value = getEarlier(24);   
        } else if (site.endsWith("7 days)")) {
//            console.log("getSQL_Ping_SingleMetric_SingleSite() 7 days");
            xmlhttp.open("GET","RANMateMetrics_WorstSiteList.php?group=" + metric + "&days=7&m=" + m + "&n=" + n,false);
            //xmlhttp.open("GET","RANMateMetrics_WorstSiteList.php?group=" + metric + "&days=7",false);
            endDateTime = document.getElementById("endTime").value = getNow();
            startDateTime = document.getElementById("startTime").value = getEarlier(168);            
        } else {
            console.log("Unsupported server timeframe " + site);
        }
        xmlhttp.send();

        if (xmlhttp.status === 200) {
            console.log("RANMateMetrics_WorstSiteList.php response is " + xmlhttp.responseText);
            // strip off the surplus ',', ugly I know...
            var worstSites = xmlhttp.responseText.substring(0, xmlhttp.responseText.length - 1).split(",");
            query = getSQL_Ping_SingleMetric_MultiSites(metric, worstSites, startDateTime, endDateTime);
            console.log("query is " + query);
            return query;
            //return getSQL_Ping_SingleMetric_MultiSites(metric, worstSites, startDateTime, endDateTime);
        } else {
            console.log("Error invoking RANMateReset_WorstSiteList.php: " + xmlhttp.status);
        }
    } else { 
        console.log("Not a worst metric");
        return getSQL_Ping_AllScenarios(metric.substring(5), site, startDateTime, endDateTime);
    }
}

function getSQL_Ping_MultiMetrics_SingleSite(metrics, site, startDateTime, endDateTime) {
    return getSQL_Ping_AllScenarios(pingMetricsToString(metrics), site, startDateTime, endDateTime);
}

function getSQL_Ping_AllScenarios(metric, site, startDateTime, endDateTime) {
    if (metric.endsWith("packet_loss")) {
        console.log("packet_loss detected for " + metric);
        yLabelTitle = 'percent';
    } else {
        console.log("packet_loss NOT detected for " + metric);
        yLabelTitle = 'milliseconds';
    }
//    return "SELECT measurement_time, " + metric + " FROM `metrics`.ping WHERE ping.site_name='" + site +
//        "' AND measurement_time BETWEEN '" + startDateTime + "' AND '" + endDateTime + "' GROUP BY measurement_time;";
    return "SELECT measurement_time, " + metric + " FROM metrics.ping WHERE ping.site_name='" + site +
        "' AND measurement_time BETWEEN '" + startDateTime + "' AND '" + endDateTime + "' GROUP BY measurement_time;";
}

function getSQL_Ping_SingleMetric_MultiSites(metric, sites, startDateTime, endDateTime) {
    // console.log("cellList has " + cellList.length + " entries which are " + cellList.toString());
    console.log("getSQL_Ping_SingleMetric_MultiSites() sites has " + sites.length + " entries which are " + sites.toString());
    if (metric.endsWith("packet_loss")) {
        console.log("packet_loss detected for " + metric);
        yLabelTitle = 'percent';
    } else {
        console.log("packet_loss NOT detected for " + metric);
        yLabelTitle = 'milliseconds';
    }
    var columnsStr = "";
    var metricName = metric.substring(5);
    var tableName = 'ping'; // all ping metrics are columns in the ping table
    for (i = 0; i < sites.length; i++) {
        selectedSite = sites[i].replace(" - ", "-");
        if (i == 0) {
            siteFloorStr = '\'' + selectedSite + '\'';
            //columnName = selectedSite;
            //pivotStr = "\n case when " + tableName + ".site_name = \'" + selectedSite + "\' then " + metricName + " end AS `" + selectedSite + '`';
            //columnsStr += ",\n sum(`" + selectedSite + "`) AS `" + selectedSite + '`';
            pivotStr = " case when " + tableName + ".site_name = \'" + selectedSite + "\' then ROUND(" + metricName + ",3) end AS `" + selectedSite + '`';
            columnsStr += ", sum(`" + selectedSite + "`) AS `" + selectedSite + '`';
        } else {
            siteFloorStr += ',\'' + selectedSite + '\'';
            //pivotStr += ",\n case when " + tableName + ".site_name = \'" + selectedSite + "\' then " + metricName + " end AS `" + selectedSite + '`';
            //columnsStr += ",\n sum(`" + selectedSite + "`) AS `" + selectedSite + '`';
            pivotStr += ", case when " + tableName + ".site_name = \'" + selectedSite + "\' then ROUND(" + metricName + ",3) end AS `" + selectedSite + '`';
            columnsStr += ", sum(`" + selectedSite + "`) AS `" + selectedSite + '`';
        }
    }

    query = "drop view if exists " + metricName + "_tmp;" +
            "create view " + metricName + "_tmp as ( SELECT measurement_time, " +
            pivotStr +
            " FROM metrics." + tableName + 
            " WHERE " + tableName + ".site_name IN (" + siteFloorStr + ") " +
            "AND measurement_time BETWEEN '" + startDateTime + "' AND '" + endDateTime + "' " +
            "ORDER BY measurement_time, site_id);" +
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
/****** FEMTO PM (KPIs/Counter) SQL FUNCS *********/
/**************************************************/

function femtoPMMetricsToString(metrics, cutPoint, isKpi) {
    var metricsString = "";
    var func = "SUM(";
    if (isKpi) {
        func = "AVG(";
    }
    for (var i = 0; i < metrics.length; i++) {
        // using SUM() here because when combined with GROUPING by measurement time that will aggregate the various counter/KPI columns
        if (i == 0) {
            //metricsString += "SUM(" + metrics[i].substring(cutPoint) + ") AS " + metrics[i].substring(cutPoint);
            metricsString += func + metrics[i].substring(cutPoint) + ") AS " + metrics[i].substring(cutPoint);
        } else {
            //metricsString += ", SUM(" + metrics[i].substring(cutPoint) + ") AS " + metrics[i].substring(cutPoint);
            metricsString += ", " + func + metrics[i].substring(cutPoint) + ") AS " + metrics[i].substring(cutPoint);
        }
    }    
    return metricsString;
}

function getSQL_FemtoPM_FemtoIdSQL(ids) {
    var sql = "";
    console.log("getSQL_FemtoPM_FemtoIdSQL() " + femtoCountersPerFemto + " " + femtoCountersPerSwitch + " " + femtoCountersPerSite);
    if (!femtoCountersPerSwitch && !femtoCountersPerSite) {
        sql += " AND (";
        for (i = 0; i < ids.length; i++ ) {
            if (i != 0) { sql += " || "; }
            sql += " Femto.id = " + ids[i];
        }
        sql += ")";
    }
    return sql;
}

function getSQL_FemtoPM_SiteSQL(sites) {
    var sql = "(";
    for (i = 0; i < sites.length; i++ ) {
        if (i != 0) { sql += " || "; }
        if (femtoCountersPerSite) {
            sql += "'" + sites[i].replace(/ - ([^ ])/, "-$1") + "' = CONCAT(Femto.site_name)";            
        } else {
            sql += "'" + sites[i].replace(/ - ([^ ])/, "-$1") + "' = CONCAT(Femto.site_name,'-',switch_id)";            
        }
    }
    sql += ")";
    return sql;
}

// only 1 site
function getSQL_FemtoPM_SiteSQL_ForPivot(site) {
    var sql = "(";
    if (femtoCountersPerSite) {
        sql += "'" + site.replace(/ - ([^ ])/, "-$1") + "' = CONCAT(Femto.site_name)";            
    } else {
        sql += "'" + site.replace(/ - ([^ ])/, "-$1") + "' = CONCAT(Femto.site_name,'-',switch_id)";            
    }
    sql += ")";
    return sql;
}

getSQL_FemtoPM_SiteSQL

function getSQL_FemtoPM_Common(metricTypeLength, metrics, tableName, sites, femtoIds, startDateTime, endDateTime) {
    metricNames = femtoPMMetricsToString(metrics, metricTypeLength, tableName == 'mno_kpis');
    return "SELECT measurement_time, " + metricNames + " FROM OpenCellCM.Femto, metrics." + tableName +
            " WHERE Femto.IMEI != 'N/A' AND " + tableName + ".IMEI = Femto.IMEI" + 
            getSQL_FemtoPM_FemtoIdSQL(femtoIds) +
            " AND " + getSQL_FemtoPM_SiteSQL(sites) + 
            " AND measurement_time BETWEEN '" + startDateTime + "' AND '" + endDateTime + "' " +
//            "GROUP BY measurement_time;";
            getTimeGranularityGrouping() +
            " ORDER BY measurement_time;";
}

function getTimeGranularityGrouping() {
    if (timeGran15min) { return "GROUP BY measurement_time" }
    else if (timeGranHour) { return "GROUP BY HOUR(measurement_time), DAY(measurement_time)" }
    else if (timeGranDay) { return "GROUP BY DAY(measurement_time)" }
    else if (timeGranWeek) { return "GROUP BY WEEK(measurement_time)" }
    else if (timeGranMonth) { return "GROUP BY MONTH(measurement_time)" }
}

function getSQL_FemtoPM_SingleMetric_SingleSite(metricTypeLength, metrics, tableName, sites, femtoIds, startDateTime, endDateTime) {
    return getSQL_FemtoPM_Common(metricTypeLength, metrics, tableName, sites, femtoIds, startDateTime, endDateTime);
}

function getSQL_FemtoPM_MultiMetric_SingleSite(metricTypeLength, metrics, tableName, sites, femtoIds, startDateTime, endDateTime) {
    return getSQL_FemtoPM_Common(metricTypeLength, metrics, tableName, sites, femtoIds, startDateTime, endDateTime);
}

/* 
 */
function getSQL_FemtoPM_SingleMetric_MultiSites(metricTypeLength, metrics, tableName, sites, femtoIds, startDateTime, endDateTime) {
    // for this one we want to do pivoting
        metricName = metrics[0].substring(metricTypeLength);
        // console.log("The metric name is " + metricName);
        var columnsStr = "";
        var func = "SUM";
        if (tableName == 'mno_kpis') {
            func = "AVG";
        }
        if (femtoCountersPerSwitch || femtoCountersPerSite) {
            for (i = 0; i < sites.length; i++) {
                selectedSite = sites[i].replace(" - ", "-");
                if (i == 0) {
                    pivotStr = " case when ((" + tableName + ".imei = Femto.imei) AND " + getSQL_FemtoPM_SiteSQL_ForPivot(selectedSite) + ") then ROUND(" + metricName + ",3) end AS `" + selectedSite + '`';
                    columnsStr += ", " + func + "(`" + selectedSite + "`) AS `" + selectedSite + '`';
                } else {
                    pivotStr += ", case when ((" + tableName + ".imei = Femto.imei) AND " + getSQL_FemtoPM_SiteSQL_ForPivot(selectedSite) + ") then ROUND(" + metricName + ",3) end AS `" + selectedSite + '`';
                    columnsStr += ", " + func + "(`" + selectedSite + "`) AS `" + selectedSite + '`';
                }
            }
        } else { // perFemto
            //create view NUMBEROFRXPACKETS_tmp as ( SELECT measurement_time,  
            //case when ((mno_counters.imei = Femto.imei) AND ('207 Old Street (LON26)-Old Street Switch 1' = CONCAT(Femto.site_name,'-',switch_id)) AND (Femto.id = 3)) then ROUND(NUMBEROFRXPACKETS,3) end AS `207 Old Street (LON26)-Old Street Switch 1 3_1`,
            //case when ((mno_counters.imei = Femto.imei) AND ('207 Old Street (LON26)-Old Street Switch 1' = CONCAT(Femto.site_name,'-',switch_id)) AND (Femto.id = 7)) then ROUND(NUMBEROFRXPACKETS,3) end AS `207 Old Street (LON26)-Old Street Switch 1 3_2`
            //FROM OpenCellCM.Femto, metrics.mno_counters WHERE Femto.IMEI != 'N/A' AND mno_counters.IMEI = Femto.IMEI 
            //AND ( Femto.id = 3 ||  Femto.id = 7) AND ('207 Old Street (LON26)-Old Street Switch 1' = CONCAT(Femto.site_name,'-',switch_id)) 
            //AND measurement_time BETWEEN '2019-08-06 06:39' AND '2019-08-08 12:39' ORDER BY measurement_time, site_id);
            //#select measurement_time, SUM(`207 Old Street (LON26)-Old Street Switch 1 3_1`) AS `207 Old Street (LON26)-Old Street Switch 1 3_1`, SUM(`207 Old Street (LON26)-Old Street Switch 1 3_2`) AS `207 Old Street (LON26)-Old Street Switch 1 3_2` FROM NUMBEROFRXPACKETS_tmp GROUP BY measurement_time ORDER BY measurement_time;
            console.log("*** fapName logic section entered ***");
            for (i = 0; i < sites.length; i++) {
                for (j = 0; j < femtoIds.length; j++) {
                selectedSite = sites[i].replace(" - ", "-");
                    if (i == 0 && j == 0) {
                        pivotStr = " case when ((" + tableName + ".imei = Femto.imei) AND " + getSQL_FemtoPM_SiteSQL_ForPivot(selectedSite) + " AND (Femto.id = " + femtoIds[j] + ")) then ROUND(" + metricName + ",3) end AS `" + selectedSite + fapNames[femtoIds[j] - 1] + '`';
                        columnsStr += ", " + func + "(`" + selectedSite + fapNames[femtoIds[j] - 1] + "`) AS `" + selectedSite + fapNames[femtoIds[j] - 1] + '`';
                    } else {
                        pivotStr += ", case when ((" + tableName + ".imei = Femto.imei) AND " + getSQL_FemtoPM_SiteSQL_ForPivot(selectedSite) + " AND (Femto.id = " + femtoIds[j] + ")) then ROUND(" + metricName + ",3) end AS `" + selectedSite + fapNames[femtoIds[j] - 1] + '`';
                        columnsStr += ", " + func + "(`" + selectedSite + fapNames[femtoIds[j] - 1] + "`) AS `" + selectedSite + fapNames[femtoIds[j] - 1] + '`';
                    }
                }
            }
        }
        
        query = "drop view if exists " + metricName + "_tmp;" +
                "create view " + metricName + "_tmp as ( SELECT measurement_time, " +
                pivotStr +
                " FROM OpenCellCM.Femto, metrics." + tableName +
                //" WHERE " + tableName + ".site_name IN (" + siteFloorStr + ") " +
                " WHERE Femto.IMEI != 'N/A' AND " + tableName + ".IMEI = Femto.IMEI" + 
                getSQL_FemtoPM_FemtoIdSQL(femtoIds) +
                " AND " + getSQL_FemtoPM_SiteSQL(sites) + 

                " AND measurement_time BETWEEN '" + startDateTime + "' AND '" + endDateTime + "' " +
                "ORDER BY measurement_time, site_id);" +
                "select measurement_time" +
                columnsStr +
                " FROM " + metricName + "_tmp " +
                //"group by measurement_time";
                getTimeGranularityGrouping() +
                " ORDER BY measurement_time;";
                
        return query;        
/*    } else {     // perFemto
        metricName = metrics[0].substring(metricTypeLength);
        //console.log("The metric name is " + metricName);
        var columnsStr = "";
        var func = "SUM";
        if (tableName == 'mno_kpis') {
            func = "AVG";
        }


        query = "drop view if exists " + metricName + "_tmp;" +
                "create view " + metricName + "_tmp as ( SELECT measurement_time, " +
                pivotStr +
                " FROM OpenCellCM.Femto, metrics." + tableName +
                //" WHERE " + tableName + ".site_name IN (" + siteFloorStr + ") " +
                " WHERE Femto.IMEI != 'N/A' AND " + tableName + ".IMEI = Femto.IMEI" + 
                getSQL_FemtoPM_FemtoIdSQL(femtoIds) +
                " AND " + getSQL_FemtoPM_SiteSQL(sites) + 

                " AND measurement_time BETWEEN '" + startDateTime + "' AND '" + endDateTime + "' " +
                "ORDER BY measurement_time, site_id);" +
                "select measurement_time" +
                columnsStr +
                " FROM " + metricName + "_tmp " +
                //"group by measurement_time";
                getTimeGranularityGrouping() +
                " ORDER BY measurement_time;";

        //return getSQL_FemtoPM_Common(metricTypeLength, metrics, tableName, sites, femtoIds, startDateTime, endDateTime);
        return query;
    } */
}

function getSQL_FemtoPM_MultiMetric_MultiSites(metricTypeLength, metrics, tableName, sites, femtoIds, startDateTime, endDateTime) {
    return getSQL_FemtoPM_Common(metricTypeLength, metrics, tableName, sites, femtoIds, startDateTime, endDateTime);
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
            //pivotStr = "\n case when " + tableName + ".site_name = \'" + selectedSite + "\' then " + metricName + " end AS `" + selectedSite + '`';
            //columnsStr += ",\n sum(`" + selectedSite + "`) AS `" + selectedSite + '`';
            pivotStr = " case when " + tableName + ".site_name = \'" + selectedSite + "\' then ROUND(" + metricName + ",3) end AS `" + selectedSite + '`';
            columnsStr += ", sum(`" + selectedSite + "`) AS `" + selectedSite + '`';
        } else {
            siteFloorStr += ',\'' + selectedSite + '\'';
            pivotStr += ", case when " + tableName + ".site_name = \'" + selectedSite + "\' then ROUND(" + metricName + ",3) end AS `" + selectedSite + '`';
            columnsStr += ", sum(`" + selectedSite + "`) AS `" + selectedSite + '`';
        }
    }

    query = "drop view if exists " + metricName + "_tmp;" +
            "create view " + metricName + "_tmp as ( SELECT measurement_time, " +
            pivotStr +
            " FROM metrics." + tableName + 
            " WHERE " + tableName + ".site_name IN (" + siteFloorStr + ") " +
            "AND measurement_time BETWEEN '" + startDateTime + "' AND '" + endDateTime + "' " +
            "ORDER BY measurement_time, site_id);" +
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
    if (field === 'loss_pct') { yLabelTitle = 'percentage packet loss (at 20Mb/s)'; } 
    else if (field === 'jitter') { yLabelTitle = 'milliseconds'; } 
    else if (field === 'bandwidth') { yLabelTitle = 'MBytes'; } 
    else if (table.endsWith('latency')) { yLabelTitle = 'milliseconds'; } 
    return "SELECT " + table + ".measurement_time, " + field + " FROM " + table + " WHERE " + table + ".site_name='" + site + "' AND " + 
            table + ".measurement_time BETWEEN '" + startDateTime + "' AND '" + endDateTime + "' GROUP BY " + table + ".measurement_time;";  
    //return getSQL_Buddy_AllScenarios(table, table, field, table + ".site_name='" + site + "'", startDateTime, endDateTime);
}

function getSQL_Buddy_MultiMetrics_SingleSite(metrics, site, startDateTime, endDateTime) {
    fields = buddyMetricsToFieldsArray(metrics);
    fieldsString = buddyMetricsToFieldsString(metrics);

    // console.log("fieldsString is: " + fieldsString);
    if (fieldsString.indexOf('loss_pct') >= 0) { yLabelTitle = 'percentage packet loss (at 20Mb/s)'; } 
    if (fieldsString.indexOf('.bandwidth') >= 0) { 
        if (yLabelTitle !== '') { yLabelTitle += ' / '; }
        yLabelTitle += 'MBytes'; 
    } 
    if ((fieldsString.indexOf('latency') >= 0) || (fieldsString.indexOf('jitter') >= 0)) {  
        if (yLabelTitle !== '') { yLabelTitle += ' / '; }
        yLabelTitle += 'milliseconds';
    } 
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
    
    if (metricName === 'loss_pct') { yLabelTitle = 'percentage packet loss (@ 20Mb/s)'; } 
    else if (metricName === 'jitter') { yLabelTitle = 'milliseconds'; } 
    else if (metricName === 'bandwidth') { yLabelTitle = 'MBytes'; } 
    else if (tableName.endsWith('latency')) { yLabelTitle = 'milliseconds'; } 
    
    for (i = 0; i < sites.length; i++) {
        selectedSite = sites[i].replace(" - ", "-");
        if (i == 0) {
            siteFloorStr = '\'' + selectedSite + '\'';
            //pivotStr = " case when " + tableName + ".site_name = \'" + selectedSite + "\' then " + metricName + " end AS `" + selectedSite + '`';
            pivotStr = " case when " + tableName + ".site_name = \'" + selectedSite + "\' then ROUND(" + metricName + ",3) end AS `" + selectedSite + '`';
            columnsStr += ", sum(`" + selectedSite + "`) AS `" + selectedSite + '`';
        } else {
            siteFloorStr += ',\'' + selectedSite + '\'';
            //pivotStr += ", case when " + tableName + ".site_name = \'" + selectedSite + "\' then " + metricName + " end AS `" + selectedSite + '`';
            pivotStr += ", case when " + tableName + ".site_name = \'" + selectedSite + "\' then ROUND(" + metricName + ",3) end AS `" + selectedSite + '`';
            columnsStr += ", sum(`" + selectedSite + "`) AS `" + selectedSite + '`';
        }
    }

    query = "drop view if exists " + metricName + "_tmp;" +
            "create view " + metricName + "_tmp as ( SELECT measurement_time, " +
            pivotStr +
            " FROM metrics." + tableName + 
            " WHERE " + tableName + ".site_name IN (" + siteFloorStr + ") " +
            "AND measurement_time BETWEEN '" + startDateTime + "' AND '" + endDateTime + "' " +
            "ORDER BY measurement_time, site_id);" +
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
    } else if (theMetric.startsWith('FemtoCounter-')) {
       thisMetricType = "FemtoCounter";
    } else if (theMetric.startsWith('FemtoKPI-')) {
       thisMetricType = "FemtoKPI";
    } else if (theMetric.startsWith('Femto-')) {
       thisMetricType = "Femto";
    } else if (theMetric.startsWith('RPM-')) {
       thisMetricType = "RPM";
    } else if (theMetric.startsWith('Traffic-')) {
       thisMetricType = "Traffic";
    } else if (theMetric.startsWith('Calls-')) {
       thisMetricType = "Calls";
    } else if (theMetric.startsWith('Reports')) {
       thisMetricType = "Reports";
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