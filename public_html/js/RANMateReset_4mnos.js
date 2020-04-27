/*
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */
var SLEEPING_THRESHOLD = 3000;
var myChart;
var startMillis;
var liveCells;
var selectedOpCo;
var selectedFemto;
//var opcos = ["Vodafone","O2","Three","EE"];
var username = 'RANmate';
var virtualSwitchChars = '';

function getNow() {
    return getDateTimeString(new Date());
}

function getHoursAgo(hours) {
    var d = new Date();
    d.setHours(d.getHours() - hours);
    // console.log(hours + " ago was " + getDateTimeString(d));
    return getDateTimeString(d);
}

function getDateTimeString(day) {
    var mm = day.getMonth() + 1;
    var dd = day.getDate();
    var hh = day.getHours();
    var min = day.getMinutes();
    var sec = day.getSeconds();
    if(dd<10){dd='0'+dd}
    if(mm<10){mm='0'+mm}
    if(hh<10){hh='0'+hh}
    if(min<10){min='0'+min}
    if(sec<10){sec='0'+sec}
    return day.getFullYear()+'-'+mm+'-'+dd+' '+hh+':'+min+':'+sec;
}

function initPage() {
    if (window.XMLHttpRequest) {
        xmlhttp = new XMLHttpRequest();                     // code for IE7+, Firefox, Chrome, Opera, Safari
    } else {
        xmlhttp = new ActiveXObject("Microsoft.XMLHTTP");   // code for IE6, IE5
    }

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

    xmlhttp.open("GET","RANMateReset_SiteList.php",false);
    //startMillis = new Date().getTime();
    xmlhttp.send();

    if (xmlhttp.status === 200) {
        //console.log("initPage() response is " + xmlhttp.responseText);
        document.getElementById("site").innerHTML = xmlhttp.responseText;
        document.getElementById("site").selectedIndex = -1;
    } else {
        console.log("Error invoking RANMateReset_SiteList.php: " + xmlhttp.status);
    }

    var siteParam = getURLParameter('site');
    if (siteParam != null) {
        console.log("Original  siteParam is " + siteParam);    
        //var siteParam = decodeURIComponent(getURLParameter('site').replace(/%2B/g, '^')).replace(/\+/g, " ").replace(/%28/g, '(').replace(/%29/g,')').replace(/\^/g, '+');        
        initWithParams(decodeURIComponent(siteParam.replace(/%2B/g, '^')).replace(/\+/g, " ").replace(/%28/g, '(').replace(/%29/g,')').replace(/\^/g, '+'));
    } else {
        console.log("site name is not specified, ignoring any other URL params");
    }

    updateLogDisplay();
}

function initWithParams(siteParam) {
    //showSites(metricParam, siteParam.replace("-", " - "));
    document.getElementById("site").value = siteParam.replace("-", " - ");  // I haven't a clue what this line is doing
    // I need to update siteParam to replace all <non whitespace>'-'<non whitespace> combinations with ' - '
    var opcoParam = getURLParameter('operator');
    var femtoParam = getURLParameter('femto');
    var userParam = getURLParameter('checksum');
    //siteParam = siteParam.replace(/([a-zA-Z0-9])-([a-zA-Z0-9])([a-zA-Z0-9]* - )/g, "$1 - $2");
    siteParam = siteParam.replace(/([a-zA-Z0-9])-([a-zA-Z0-9]* - )/g, "$1 - $2");
    console.log("Corrected siteParam to " + siteParam);
    if (opcoParam != null) {
        if (femtoParam != null) {
            updateOpCoCells(siteParam, decodeURIComponent(opcoParam), decodeURIComponent(femtoParam), siteParam);
        } else {
            updateOpCoCells(siteParam, null, null, siteParam);
            alert("The required Femto was not included in the launch URL");
        }
    } else {
        updateOpCoCells(siteParam, null, null, siteParam);
        alert("The required Operator was not included in the launch URL");
    }
    if ((userParam != null) && (userParam.length > 2)) {
        username = caesarShift(decodeURIComponent(userParam).replace(/\+/g, " ").replace(/%28/g, '(').replace(/%29/g,')'), -5).replace(/([A-Z])/g, " $1").trim();
        //console.log("Encoded username " + userParam + " is decoded as " + username);
    }
}

function caesarShift(str, amount) {
    if (amount < 0)                                             // Wrap the amount
        return caesarShift(str, amount + 26);
    var output = '';
    for (var i = 0; i < str.length; i ++) {                     // Go through each character
            var c = str[i];                                     // Get the character we'll be appending
            if (c.match(/[a-z]/i)) {                            // If it's a letter...
                    var code = str.charCodeAt(i);               // Get its code
                    if ((code >= 65) && (code <= 90))           // Uppercase letters
                            c = String.fromCharCode(((code - 65 + amount) % 26) + 65);
                    else if ((code >= 97) && (code <= 122))     // Lowercase letters
                            c = String.fromCharCode(((code - 97 + amount) % 26) + 97);
            }
            output += c;                                        // Append
    }
    return output;
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

function updateLogDisplay() {
    if (window.XMLHttpRequest) {
        xmlhttp = new XMLHttpRequest();                     // code for IE7+, Firefox, Chrome, Opera, Safari
    } else {
        xmlhttp = new ActiveXObject("Microsoft.XMLHTTP");   // code for IE6, IE5
    }
    xmlhttp.onreadystatechange = function() {
        // console.log("Received " + this.responseText);
        if (this.readyState == 4 && this.status == 200) {
            console.log("Log Contents\n" + this.responseText.substring(1000));
            document.getElementById("TableWrap").innerHTML = this.responseText;
        }
    };

    xmlhttp.open("GET","RANMateReset_RecentResetLog.php",true);
    xmlhttp.send();
}

function opcoSelected(opco) {
    if (opco == "") {
        return;
    } else {
//        console.log("OpCo " + opco + " selected");
        selectedOpCo = opco;
        var cellSet = liveCells.get(parseInt(opco));
        var fap1 = document.getElementById('FAP1');
        var fap2 = document.getElementById('FAP2');
        var fap3 = document.getElementById('FAP3');
        var fap4 = document.getElementById('FAP4');
        var fap5 = document.getElementById('FAP5');
        var fap6 = document.getElementById('FAP6');
        var fap7 = document.getElementById('FAP7');
        var fap8 = document.getElementById('FAP8');
        if (cellSet.has(0)) { fap1.style.visibility = 'visible'; } else { fap1.style.visibility = 'hidden'; }
        if (cellSet.has(1)) { fap2.style.visibility = 'visible'; } else { fap2.style.visibility = 'hidden'; }
        if (cellSet.has(2)) { fap3.style.visibility = 'visible'; } else { fap3.style.visibility = 'hidden'; }
        if (cellSet.has(3)) { fap4.style.visibility = 'visible'; } else { fap4.style.visibility = 'hidden'; }
        if (cellSet.has(4)) { fap5.style.visibility = 'visible'; } else { fap5.style.visibility = 'hidden'; }
        if (cellSet.has(5)) { fap6.style.visibility = 'visible'; } else { fap6.style.visibility = 'hidden'; }
        if (cellSet.has(6)) { fap7.style.visibility = 'visible'; } else { fap7.style.visibility = 'hidden'; }
        if (cellSet.has(7)) { fap8.style.visibility = 'visible'; } else { fap8.style.visibility = 'hidden'; }
        document.getElementById('Femto1').checked = false;
        document.getElementById('Femto2').checked = false;
        document.getElementById('Femto3').checked = false;
        document.getElementById('Femto4').checked = false;
        document.getElementById('Femto5').checked = false;
        document.getElementById('Femto6').checked = false;
        document.getElementById('Femto7').checked = false;
        document.getElementById('Femto8').checked = false;
    }
}

function femtoSelected(cell) {
    if (cell == "") {
        return;
    } else {
//        console.log("Femto " + cell + " selected");
        selectedFemto = cell;
        if (selectedOpCo != null)  {
            document.getElementById("resetButton").disabled = false;
        } else {
            document.getElementById("resetButton").disabled = true;
        }
    }
}

function updateOpCoCells(str) {
    updateOpCoCells(str, null, null, null);
}

function updateOpCoCells(str, operatorToBeChecked, femtoToBeChecked, initSite) {

    console.log("updateOpCoCells() called with " + str);
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
                //console.log("RANMateReset_OpCoCellList() returned " + this.responseText);
                liveCells = new Map();
                liveCells.set(0, new Set());
                liveCells.set(1, new Set());
                liveCells.set(2, new Set());
                liveCells.set(3, new Set());

//                var V = document.getElementById('V');
//                var O = document.getElementById('O');
//                var T = document.getElementById('T');
//                var E = document.getElementById('E');
                var mno1 = document.getElementById("MNO1");
                var mno2 = document.getElementById("MNO2");
                var mno3 = document.getElementById("MNO3");
                var mno4 = document.getElementById("MNO4");


                // clear any radio buttons that may have been checked previously
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

                selectedOpCo = null;
                selectedFemto = null;
                document.getElementById("resetButton").disabled = true;

                var fap1 = document.getElementById('FAP1');
                var fap2 = document.getElementById('FAP2');
                var fap3 = document.getElementById('FAP3');
                var fap4 = document.getElementById('FAP4');
                var fap5 = document.getElementById('FAP5');
                var fap6 = document.getElementById('FAP6');
                var fap7 = document.getElementById('FAP7');
                var fap8 = document.getElementById('FAP8');

                var cellSet = new Set();
                //console.log("RANMateReset_OpCoCellList() returned " + this.responseText);
                var cellList = this.responseText.split(' ');
                var arrayLength = cellList.length;
                for (var i = 0; i < arrayLength; i++) {
                    var aCell = cellList[i].trim();
                    // console.log("    processing " + aCell);
                    if (aCell.length > 0) {
                        var cellNum = parseInt(aCell);
                        cellSet.add(cellNum);
                        //console.log("Adding FAP " + Math.floor(cellNum/4) + " to OpCo " + cellNum%4);
                        liveCells.get(cellNum % 4).add(Math.floor(cellNum/4));
                    }
                }
                mno1.style.visibility = mno2.style.visibility = mno3.style.visibility = mno4.style.visibility = 'hidden';
                fap1.style.visibility = fap2.style.visibility = fap3.style.visibility = fap4.style.visibility = 'hidden';
                fap5.style.visibility = fap6.style.visibility = fap7.style.visibility = fap8.style.visibility = 'hidden';
                // now let's go through all the cells and work out what needs to be displayed and what doesn't
                for (var i = 0; i < 32; i++) {
                    if (cellSet.has(i)) {
                        // Display the correct V, O, T, E
                        switch (i % 4) {
                            case 0: mno1.style.visibility = 'visible'; break;
                            case 1: mno2.style.visibility = 'visible'; break;
                            case 2: mno3.style.visibility = 'visible'; break;
                            case 3: mno4.style.visibility = 'visible'; break;
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
                    selectedOpCo = operatorToBeChecked;
                }
                if (femtoToBeChecked != null) {
                    document.getElementById(femtoToBeChecked).checked = true;
                    femtoSelected(femtoToBeChecked);
//                    document.getElementById("resetButton").disabled = false;
                }
            }
        };
        xmlhttp.open("GET","RANMateReset_OpCoCellList.php?switch="+encodeURIComponent(str),true);
        xmlhttp.send();
    }
}

function getLatestPackets(site, cellNum) {

    if (window.XMLHttpRequest) {        // code for IE7+, Firefox, Chrome, Opera, Safari
        xmlhttp = new XMLHttpRequest();
    } else {                            // code for IE6, IE5
        xmlhttp = new ActiveXObject("Microsoft.XMLHTTP");
    }
    // 0 1 = 0
    // 0 2 = 4
    // 0 3 = 8
    // 1 1 = 1
    // 1 2 = 5
    // 1 3 = 9
    //console.log("Sending " + "RANMateReset_CurrentPackets.php?switch=" + site + "&cell=" + cellNum);
    xmlhttp.open("GET","RANMateReset_CurrentPackets.php?switch=" + site + "&cell=" + cellNum, false);
    xmlhttp.send(null);

    if (xmlhttp.status === 200) {
        // console.log("Response " + xmlhttp.responseText);
    } else {
        console.log("Error invoking RANMateReset_CurrentPackets.php: " + xmlhttp.status);
    }
    return xmlhttp.responseText;
}

function getRecentResets(site, cellNum) {

    var resetsMsg = "";
    if (window.XMLHttpRequest) {        // code for IE7+, Firefox, Chrome, Opera, Safari
        xmlhttp = new XMLHttpRequest();
    } else {                            // code for IE6, IE5
        xmlhttp = new ActiveXObject("Microsoft.XMLHTTP");
    }
    //console.log("Sending " + "RANMateReset_CurrentPackets.php?switch=" + site + "&cell=" + cellNum);
    //xmlhttp.open("GET","RANMateReset_RecentResets.php?switch=" + site + "&cell=" + cellNum + "&time24Hours=" + getHoursAgo(24) + "&time1Hour=" + getHoursAgo(24), false);
    xmlhttp.open("GET","RANMateReset_RecentResets.php?switch=" + site + "&cell=" + cellNum + "&time24Hours=" + getHoursAgo(24), false);
    xmlhttp.send(null);

    if (xmlhttp.status === 200) {
        console.log("Response " + xmlhttp.responseText);
        if (xmlhttp.responseText.substring(0, 10) != "(No Recent") {
            // tokenise according to \t
            var res = xmlhttp.responseText.split("_");
            resetsMsg = "- This femto has been reset " + res[0] + " time(s) in the past 24 hours and was last reset\n   at " + res[1].slice(0, -3) + " by " + res[2];
        }
    } else {
        console.log("Error invoking RANMateReset_CurrentPackets.php: " + xmlhttp.status);
    }
    return resetsMsg;
}

function resetFemto() {

    if (window.XMLHttpRequest) {
        // code for IE7+, Firefox, Chrome, Opera, Safari
        xmlhttp = new XMLHttpRequest();
    } else {
        // code for IE6, IE5
        xmlhttp = new ActiveXObject("Microsoft.XMLHTTP");
    }
    xmlhttp.onreadystatechange = function() {
        if (this.readyState == 4 && this.status == 200) {
            //document.getElementById("interface").innerHTML = this.responseText;
//                document.getElementById("interface").selectedIndex = 0;
        }
    };
    var site = document.getElementById("site").value;
    var femtoNum = parseInt(selectedFemto.slice(-1));
    var cellNum = parseInt(selectedOpCo) + ((femtoNum -1) * 4);
    virtualSwitchChars = '';
    if (site.endsWith('+')) {
        site = site.replace(/\+/g, "");
        femtoNum += 8;
        cellNum += 33;        
        alert("52 port switch (" + site + ") detected, resetting port " + cellNum);
    } else if (site.endsWith('>>>')) {
        alert("Virtual switch (" + site + ") detected, resetting port " + (cellNum + 3) + " (not " + cellNum + ")");
        site = site.replace(/\>/g, "");
        cellNum += 3;
        virtualSwitchChars = '>>>';
    } else if (site.endsWith('>>')) {
        alert("Virtual switch (" + site + ") detected, resetting port " + (cellNum + 2) + " (not " + cellNum + ")");
        site = site.replace(/\>/g, "");
        cellNum += 2;
        virtualSwitchChars = '>>';
    } else if (site.endsWith('>')) {
        alert("Virtual switch (" + site + ") detected, resetting port " + (cellNum + 1) + " (not " + cellNum + ")");
        site = site.replace(/\>/g, "");
        cellNum += 1;
        virtualSwitchChars = '>';
    } else if (site.endsWith('<<')) {
        alert("Virtual switch (" + site + ") detected, resetting port " + (cellNum - 2) + " (not " + cellNum + ")");
        site = site.replace(/\</g, "");
        cellNum = cellNum - 2;
        virtualSwitchChars = '<<';
    } else if (site.endsWith('<')) {
        alert("Virtual switch (" + site + ") detected, resetting port " + (cellNum - 1) + " (not " + cellNum + ")");
        site = site.replace(/\</g, "");
        cellNum = cellNum - 1;
        virtualSwitchChars = '<';
    }
    // check the time is between office hours
    var day = new Date().getDay();
    var hour = new Date().getHours();
    var warningMsg = "";
    if ((day > 0 && day < 6) && (hour > 7 && hour < 18)) {
        warningMsg += "- It is during business hours\n";
    }
    // check the most recent number of packets
    var packets = getLatestPackets(site, cellNum);
    if (packets > SLEEPING_THRESHOLD) {
        warningMsg +=  "- The most recent packet count (" + packets + ") indicates femto is currently in use\n";
    }
    // check if it's asleep
    // check if it's been reset recently

    warningMsg += getRecentResets(site, cellNum);

//    if (warningMsg.length > 0) {
//        confirm(warningMsg);
//    }

    if (warningMsg.length > 0) {
        warningMsg += "\n\n";
    }
    var comment = prompt(warningMsg +"\t\t\tIt will take up to 90 seconds to reset and verify " + MnosFull[selectedOpCo] +
            "_" + femtoNum + "\nYou can change tabs/application during this time, but do not close this screen\n\n", "(Optional <200 char comment)");
    if (comment != null) {
        //console.log("Comment is " + comment);
        if (comment === "(Optional <200 char comment)") {
            comment = "";
        } else {
            comment = comment.replace(/'/g, '\\\'');  // replacing single quotes with \' so that it can be stored in mariadb
        }
        // MW handle overloaded switches here
        // adjust the port number
        //if (site.endsWith())
        // replace any trailing > or < with nothing
        console.log("Calling RANMateReset_Reset.php with time=" + getNow() + "&switch=" + site + "&cell=" + cellNum + "&opco=" + parseInt(selectedOpCo) + "&femtoNum=" + femtoNum);
        //console.log("Disabling the reset button");
        document.getElementById("resetButton").value = 'Wait...';
        document.getElementById("resetButton").disabled = true;
        //document.body.style.cursor = "wait";
        xmlhttp.open("GET","RANMateReset_Reset.php?time=" + getNow() + "&switch=" + site + "&cell=" +
                cellNum + "&opco=" + MnosFull[parseInt(selectedOpCo)] + "&femtoNum=" + femtoNum + "&user=" + username + "&comment=" +
                comment.substring(0,198) + "&note=" + warningMsg.substring(0,298) + "&virtualSwitchChars=" + virtualSwitchChars, false);
        xmlhttp.send();

        var response = xmlhttp.responseText.trim();
        //document.body.style.cursor = "default";
        if (xmlhttp.status === 200) {
            console.log("Reset Response: ->" + response + "<-");
        } else {
            console.log("Error invoking RANMateReset_Reset.php: " + xmlhttp.status);
        }
        //console.log("Re-enabling the reset button");
        document.getElementById("resetButton").value = 'Reset';
        document.getElementById("resetButton").disabled = false;

        updateLogDisplay();
        if (response === "0") {
            alert(MnosFull[parseInt(selectedOpCo)] + "_" + femtoNum + " at " + site + " has been (successfully) reset");
        } else if (response === '0') {
            alert(MnosFull[parseInt(selectedOpCo)] + "_" + femtoNum + " at " + site + " has been (successfully) reset (char)");
        } else if (parseInt(response) === 0) {
            alert(MnosFull[parseInt(selectedOpCo)] + "_" + femtoNum + " at " + site + " has been (successfully) reset (int)");
        } else if (response.includes("No corresponding IP found")) {
// Reset Response: ->(No corresponding IP found for switch/floor) sql=select DISTINCT SwitchIP from customer_config where Site='8 Devonshire Square' and SwitchLocation='7th Floor comms'<-            
            alert("Cannot find IP address for " + site + " in Concert (switch database table)");
        } else {
            if (confirm ("\t\t" + MnosFull[parseInt(selectedOpCo)] + "_" + femtoNum + " at " + site + " has NOT been successfully reset\nMore details may be available in /opt/RANmate/logs/RANmateReset.log on the RANmate server\nDo you want to reset via the web console?")) {
                xmlhttp.open("GET","RANMateReset_GetSiteIp.php?switch="+site,false);
                xmlhttp.send();

                var switchIP = xmlhttp.responseText.trim();
                //document.body.style.cursor = "default";
                if (xmlhttp.status === 200) {
                    console.log("Reset Response: ->" + switchIP + "<-");
                } else {
                    console.log("Error invoking RANMateReset_GetSwitchIp.php: " + xmlhttp.status);
                }

                alert("username is dataduct and the password has been copied to the clipboard (Ctrl-V to paste)\n" 
                      + " 1. configure\n"
                      + " 2. interface " + (cellNum + 1) + "\n"
                      + " 3. power inline never\n"
                      + " 4. power inline auto\n");
                var el = document.createElement('textarea');
                el.value = "DaTa2015!";
                el.setAttribute('readonly', '');
                el.style = {position: 'absolute', left: '-9999px'};
                document.body.appendChild(el);
                el.select();
                document.execCommand('copy');
                document.body.removeChild(el);
                window.open("http://" + switchIP);                
            }
        }

    }
    //}
}

//var dynamicColors = function() {
//    var r = Math.floor(Math.random() * 255);
//    var g = Math.floor(Math.random() * 255);
//    var b = Math.floor(Math.random() * 255);
//    return "rgba(" + r + "," + g + "," + b + ",1)";
//}