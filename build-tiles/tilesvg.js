"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var index_1 = require("../ipv4/index");
var ip2lite_1 = require("../ip2lite");
var d3_array_1 = require("d3-array");
function getColorFromWhois(_a) {
    var whois = _a.whois, designation = _a.designation;
    if (!designation || designation === "") {
        designation = "void";
    }
    var fillRect = "";
    //switch (whois) {
    //  case 'IANA':
    //    fillRect="#f0f0f0";
    //    break;
    //  case 'APNIC':
    //    fillRect="#FFDDDD";
    //    break;
    //  case 'RIPE':
    //    fillRect="#BCD9D9";
    //    break;
    //  case 'AFRINIC':
    //    fillRect="#CCECCC";
    //    break;
    //  case 'ARIN':
    //    fillRect="#FFECDD";
    //    break;
    //  case 'LACNIC':
    //    fillRect="#C9BAD7";
    //    break;
    //  default:
    //   fillRect="#FFFFFF";
    //}
    switch (whois) {
        case 'IANA':
            fillRect = "#f0f0f0";
            break;
        case 'APNIC':
            fillRect = "#EC3232";
            break;
        case 'RIPE':
            fillRect = "#6320EE";
            break;
        case 'AFRINIC':
            fillRect = "#31B793";
            break;
        case 'ARIN':
            fillRect = "#FF9F1C";
            break;
        case 'LACNIC':
            fillRect = "#FFFCF2";
            break;
        default:
            fillRect = "#FFFFFF";
    }
    fillRect = colorObjectToString(meanColor(colorStringToObject(fillRect), stringToColour(designation)));
    return fillRect;
}
function getTextColor(fillRect) {
    var colorFillRect = colorStringToObject(fillRect);
    var targetColor;
    // if too bright
    if (colorFillRect.r * 299 + colorFillRect.g * 587 + colorFillRect.b * 114 >= 128000) {
        targetColor = colorStringToObject("#000000");
    }
    else {
        targetColor = colorStringToObject("#eeeeee");
    }
    var textColor = colorObjectToString(meanColor(targetColor, colorFillRect));
    return textColor;
}
function colorStringToObject(colorStr) {
    return {
        r: parseInt("0x" + colorStr.substr(1, 2)),
        g: parseInt("0x" + colorStr.substr(3, 2)),
        b: parseInt("0x" + colorStr.substr(5, 2))
    };
}
function meanColor(c1, c2) {
    return {
        r: Math.round(Math.sqrt((c1.r * c1.r * 0.9 + c2.r * c2.r * 0.1))),
        g: Math.round(Math.sqrt((c1.g * c1.g * 0.9 + c2.g * c2.g * 0.1))),
        b: Math.round(Math.sqrt((c1.b * c1.b * 0.9 + c2.b * c2.b * 0.1)))
    };
}
function colorObjectToString(colorObj) {
    return "#" + ("00" + colorObj.r.toString(16)).slice(-2) + ("00" + colorObj.g.toString(16)).slice(-2) + ("00" + colorObj.b.toString(16)).slice(-2);
}
var stringToColour = function (str) {
    var hash = 0;
    for (var i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    return {
        r: hash & 0xff,
        g: (hash >> 8) & 0xff,
        b: (hash >> 16) & 0xff
    };
};
// ip2lite:
function filterBetween(d) {
    return d.ipRangeStart.pVal <= this.value && this.value <= d.ipRangeEnd.pVal;
}
// ip2lite: strictly between
function filter(d) {
    return (d.ipRangeStart.pVal <= this.ipStart && this.ipEnd <= d.ipRangeEnd.pVal) ||
        (this.ipStart <= d.ipRangeStart.pVal && d.ipRangeEnd.pVal <= this.ipEnd) ||
        d.ipRangeStart.pVal <= this.ipStart && this.ipStart <= d.ipRangeEnd.pVal ||
        d.ipRangeStart.pVal <= this.ipEnd && this.ipEnd <= d.ipRangeEnd.pVal;
}
/**
 * Get a slice of ip/country array
 * @param ipStart first ip of a block
 * @param ipEnd last ip of a block
 */
function getCountriesRange(ipStart, ipEnd) {
    // instead of doing an array.filter, which is time consuming,
    // we use bisect on an index.
    var idLo = d3_array_1.bisectLeft(ip2lite_1.ip2lite.ipArrayIdx, ipStart);
    var idHi = d3_array_1.bisectLeft(ip2lite_1.ip2lite.ipArrayIdx, ipEnd);
    var myRange = ip2lite_1.ip2lite.ipArray.slice(idLo, idHi + 1);
    return myRange;
}
function aggregateCountryRangeByLabel(myRange) {
    var countries = new Map();
    myRange.forEach(function (r) {
        countries.set(r.countryCode, r.countryLabel);
    });
    return countries;
}
function getCountries(ipValue, zoom) {
    var res;
    var ipEnd;
    // get last ip of the block given zoom
    ipEnd = (new index_1.IPv4(ipValue)).getLastIPMask(zoom * 2);
    var m = aggregateCountryRangeByLabel(getCountriesRange(ipValue, ipEnd.pVal));
    if (m.size === 1) {
        // get the full country name
        res = m.values().next().value;
    }
    else {
        // get the country codes
        var arrCountryCode = Array.from(m.keys());
        // concat them into csv with a trailing ... if more than 4 countries.
        res = arrCountryCode.slice(0, 4).join(", ") + (m.size > 4 ? ", " + arrCountryCode[4] + ", ..." : "");
    }
    return res;
}
function moreThanOneCountry(ipValue, zoom) {
    var moreThanOne = false;
    var ipEnd;
    // get last ip of the block given zoom
    ipEnd = (new index_1.IPv4(ipValue)).getLastIPMask(zoom * 2);
    var myRange = getCountriesRange(ipValue, ipEnd.pVal);
    if (myRange.length > 1) {
        var myVal = myRange[0].countryCode;
        for (var i = 0; i < myRange.length && !moreThanOne; i++) {
            moreThanOne = myVal != myRange[i].countryCode;
        }
    }
    return moreThanOne;
}
var getTileInfo = function (ipTile, point) {
    if (ipTile) {
        var strIP = ipTile.toString();
        // single ip scale
        if (point.z < 16) {
            strIP += "/" + (point.z * 2) + "\n";
        }
        // list all Regional Internet Registries where my ip belong
        var resWhois = ip2lite_1.ip2lite.ipWhois.filter(filter, { ipStart: ipTile.pVal, ipEnd: ipTile.getLastIPMask(point.z * 2).pVal });
        var res = { x: point.x, y: point.y, z: point.z, desc: null, whois: resWhois[0].whois, date: null, ip: strIP };
        if (point.z > 5) {
            res.desc = getCountries(ipTile.pVal, point.z);
            res.date = "";
        }
        else {
            //res.desc = resWhois[0].designation ;
            res.date = resWhois[0].date;
            var mapRIR_1 = new Map();
            resWhois.forEach(function (r) {
                mapRIR_1.set(r.designation, r.date);
            });
            // get the designation
            var arrRIRdes = Array.from(mapRIR_1.keys());
            // concat them into csv with a trailing ... if more than 4 designation.
            res.desc = arrRIRdes.slice(0, 4).join(", ") + (mapRIR_1.size > 4 ? ", " + arrRIRdes[4] + ", ..." : "");
            if (mapRIR_1.size > 1) {
                res.date = "";
            }
        }
        return res;
    }
    else {
        return null;
    }
};
function isTileInfoMoreThanOne(point) {
    var ipTile = index_1.getIPFromXYZ(point.x, point.y, point.z);
    if (ipTile) {
        if (point.z > 5) {
            return moreThanOneCountry(ipTile.pVal, point.z);
        }
        else {
            var resWhois = ip2lite_1.ip2lite.ipWhois.filter(filter, { ipStart: ipTile.pVal, ipEnd: ipTile.getLastIPMask(point.z * 2).pVal });
            var moreThanOne = false;
            if (resWhois.length > 1) {
                var myVal = resWhois[0].designation;
                for (var i = 0; i < resWhois.length && !moreThanOne; i++) {
                    moreThanOne = myVal != resWhois[i].designation;
                }
            }
            return moreThanOne;
        }
    }
    else {
        return false;
    }
}
;
function getXYTile(point) {
    var ipTile = index_1.getIPFromXYZ(point.x, point.y, point.z);
    return getTileInfo(ipTile, point);
}
;
function compareTiles(tile1, tile2) {
    return tile1.desc === tile2.desc && tile1.whois === tile2.whois;
}
;
function genJoin(myNeighborsEquals, nbEqualsBtwThem, fillRect) {
    var join = "";
    // left top
    if (myNeighborsEquals[0][0] || (myNeighborsEquals[1][0] && myNeighborsEquals[0][1])) {
        join += "\n    <rect x=\"0\" y=\"0\" width=\"18\" height=\"18\" fill=\"" + fillRect + "\" />\n    ";
        // if not equal left
        if (!myNeighborsEquals[1][0]) {
            join += "\n      <circle cx=\"-18\" cy=\"18\" r=\"21\" />\n      ";
        }
        // if not equal top
        if (!myNeighborsEquals[0][1]) {
            join += "\n      <circle cx=\"18\" cy=\"-18\" r=\"21\" />\n      ";
        }
    }
    // right bottom
    if (myNeighborsEquals[2][2] || (myNeighborsEquals[1][2] && myNeighborsEquals[2][1])) {
        join += "\n    <rect x=\"238\" y=\"238\" width=\"18\" height=\"18\" fill=\"" + fillRect + "\" />\n    ";
        // if not equal with rigth
        if (!myNeighborsEquals[1][2]) {
            join += "\n      <circle cx=\"274\" cy=\"238\" r=\"21\" />\n      ";
        }
        // if not equal with bottom
        if (!myNeighborsEquals[2][1]) {
            join += "\n      <circle cx=\"238\" cy=\"274\" r=\"21\" />\n      ";
        }
    }
    // if current tile equals its top right neighbor,
    if (myNeighborsEquals[0][2] || (myNeighborsEquals[0][1] && myNeighborsEquals[1][2])) {
        join += "\n    <rect x=\"238\" y=\"0\" width=\"18\" height=\"18\" fill=\"" + fillRect + "\" />\n    ";
        // if not equal top
        if (!myNeighborsEquals[0][1]) {
            join += "\n      <circle cx=\"238\" cy=\"-18\" r=\"21\" />\n      ";
        }
        // if not equal right
        if (!myNeighborsEquals[1][2]) {
            join += "\n      <circle cx=\"274\" cy=\"18\" r=\"21\" />\n      ";
        }
    }
    // bottom left (or tile bottom and left equal)
    if (myNeighborsEquals[2][0] || (myNeighborsEquals[2][1] && myNeighborsEquals[1][0])) {
        join += "\n    <rect x=\"0\" y=\"238\" width=\"18\" height=\"18\" fill=\"" + fillRect + "\" />\n    ";
        // if not equal bottom
        if (!myNeighborsEquals[2][1]) {
            join += "\n      <circle cx=\"18\" cy=\"274\" r=\"21\" />\n      ";
        }
        // if not equal left
        if (!myNeighborsEquals[1][0]) {
            join += "\n      <circle cx=\"-18\" cy=\"238\" r=\"21\" />\n      ";
        }
    }
    if (!(myNeighborsEquals[1][0] && myNeighborsEquals[0][1])) {
        // Left top
        if (!myNeighborsEquals[0][0] && nbEqualsBtwThem.topLeft) {
            join += "\n      <polygon points=\"0,0 6,0 0,6\" fill=\"" + getColorFromWhois(nbEqualsBtwThem.topLeft) + "\" />\n      ";
        }
    }
    if (!(myNeighborsEquals[1][2] && myNeighborsEquals[2][1])) {
        // Right bottom
        if (!myNeighborsEquals[2][2] && nbEqualsBtwThem.botRight) {
            join += "\n      <polygon points=\"256,256 250,256 256,250\" fill=\"" + getColorFromWhois(nbEqualsBtwThem.botRight) + "\" />\n      ";
        }
    }
    // . . .  
    // = = . not ? (because a rect fill it)
    // . = .  
    if (!(myNeighborsEquals[2][1] && myNeighborsEquals[1][0])) {
        // . . .          . . .
        // . = . ?   &&   = . . ?
        // = . .          . = .
        // cross : patch with triangle
        if (myNeighborsEquals[2][0] && nbEqualsBtwThem.botLeft) {
            join += "\n      <polygon points=\"0,256 0,250 6,256\" fill=\"" + getColorFromWhois(nbEqualsBtwThem.botLeft) + "\" />\n      ";
        }
        else {
            //  . . .
            //  = . . ?
            //  . = .
            // Trace a curve
            if (nbEqualsBtwThem.botLeft) {
                join += "\n        <rect x=\"0\" y=\"250\" width=\"6\" height=\"6\" fill=\"" + getColorFromWhois(nbEqualsBtwThem.botLeft) + "\" />\n        <circle cx=\"18\" cy=\"238\" r=\"21\" />\n        ";
            }
        }
    }
    if (!(myNeighborsEquals[0][1] && myNeighborsEquals[1][2])) {
        // cross : patch with triangle
        if (myNeighborsEquals[0][2] && nbEqualsBtwThem.topRigth) {
            join += "\n      <polygon points=\"256,0 250,0 256,6\" fill=\"" + getColorFromWhois(nbEqualsBtwThem.topRigth) + "\" />\n      ";
        }
        else {
            // otherwise, top and rigth are equal
            if (nbEqualsBtwThem.topRigth) {
                join += "\n        <rect x=\"250\" y=\"0\" width=\"6\" height=\"6\" fill=\"" + getColorFromWhois(nbEqualsBtwThem.topRigth) + "\" />\n        <circle cx=\"238\" cy=\"18\" r=\"21\" />\n        ";
            }
        }
    }
    return join;
}
function genMatrix(currentTile, zinit, bigTile) {
    var myNeighbors = [
        [null, null, null],
        [null, null, null],
        [null, null, null]
    ];
    var myNeighborsEquals = [
        [false, false, false],
        [false, false, false],
        [false, false, false]
    ];
    // ie: 10 - 8 = 2
    var deltaz = 0;
    if (bigTile) {
        deltaz = currentTile.z - zinit;
    }
    for (var y = -1; y <= 1; y++) {
        for (var x = -1; x <= 1; x++) {
            if (y === 0 && x === 0) {
                continue;
            }
            var tileComp = { x: currentTile.x + x, y: currentTile.y + y, z: currentTile.z };
            if (deltaz > 0) {
                var tileAnsector = { x: tileComp.x >> deltaz, y: tileComp.y >> deltaz, z: zinit };
                if (!isTileInfoMoreThanOne(tileAnsector)) {
                    continue;
                }
            }
            var neighborTile = getXYTile(tileComp);
            // store neighbors reference
            myNeighbors[y + 1][x + 1] = neighborTile;
            // If neighbor shares the same whois
            if (neighborTile && compareTiles(neighborTile, currentTile)) {
                myNeighborsEquals[y + 1][x + 1] = true;
            }
        }
    }
    var nbTop = myNeighbors[0][1];
    var nbRight = myNeighbors[1][2];
    var nbBot = myNeighbors[2][1];
    var nbLeft = myNeighbors[1][0];
    var nbEqualsBtwThem = {
        topRigth: null,
        botRight: null,
        botLeft: null,
        topLeft: null
    };
    if (nbTop && nbRight && compareTiles(nbTop, nbRight)) {
        nbEqualsBtwThem.topRigth = { whois: nbTop.whois, designation: nbTop.desc };
    }
    if (nbRight && nbBot && compareTiles(nbRight, nbBot)) {
        nbEqualsBtwThem.botRight = { whois: nbRight.whois, designation: nbRight.desc };
    }
    if (nbBot && nbLeft && compareTiles(nbBot, nbLeft)) {
        nbEqualsBtwThem.botLeft = { whois: nbBot.whois, designation: nbBot.desc };
    }
    if (nbLeft && nbTop && compareTiles(nbLeft, nbTop)) {
        nbEqualsBtwThem.topLeft = { whois: nbLeft.whois, designation: nbLeft.desc };
    }
    return { myNeighbors: myNeighbors, myNeighborsEquals: myNeighborsEquals, nbEqualsBtwThem: nbEqualsBtwThem };
}
/**
 *
 * @param getXYTile
 * @param compareTo
 * @param coord
 * @param colorRect
 * @param z_level Information about z depth. When multiple sub tiles are computed, indicate at which level there are. z -> 0 indicates the tile will be very tiny. So it is not necessary to compute many details
 */
function tileConstructSVG(coord, z_level, zinit) {
    var stroke = "";
    var textcolor = "";
    var currentTile = getXYTile(coord);
    var whois = currentTile.whois;
    var designation = currentTile.desc;
    var date = currentTile.date;
    var fillRect = getColorFromWhois({ whois: whois, designation: designation });
    textcolor = getTextColor(fillRect);
    var join = "";
    var rect = {
        x: 3,
        y: 3,
        width: 250,
        height: 250
    };
    if (z_level > 0 && getXYTile) {
        var _a = genMatrix(currentTile, zinit, false), myNeighbors = _a.myNeighbors, myNeighborsEquals = _a.myNeighborsEquals, nbEqualsBtwThem = _a.nbEqualsBtwThem;
        //var nbTop   = myNeighbors[0][1];
        //var nbRight = myNeighbors[1][2];
        //var nbBot   = myNeighbors[2][1];
        //var nbLeft  = myNeighbors[1][0];
        //var nbEqualsBtwThem = {
        //    topRigth: null,
        //    botRight: null,
        //    botLeft: null,
        //    topLeft: null
        //}
        //
        //if (nbTop && nbRight && compareTiles (nbTop,nbRight)){
        //    nbEqualsBtwThem.topRigth = { whois: nbTop.whois, designation: nbTop.desc };
        //}
        //if (nbRight && nbBot && compareTiles (nbRight,nbBot)){
        //    nbEqualsBtwThem.botRight = { whois: nbRight.whois , designation: nbRight.desc };
        //}
        //if (nbBot && nbLeft && compareTiles (nbBot,nbLeft)){
        //    nbEqualsBtwThem.botLeft = { whois: nbBot.whois , designation: nbBot.desc };
        //}
        //if (nbLeft && nbTop && compareTiles (nbLeft,nbTop)){
        //    nbEqualsBtwThem.topLeft = { whois: nbLeft.whois , designation: nbLeft.desc };
        //}
        var sizeMaskBorder = 16;
        var rectJoin = "";
        var offsetx = 2;
        var patchDepth = 2;
        var patchNbTiles = Math.pow(2, patchDepth);
        var patchWidth = (256 - 2 * offsetx) / patchNbTiles;
        var patchHeight = 15;
        var deeplevel = currentTile.z + patchDepth;
        var comparable = z_level === 3 && currentTile.z <= 14 && ((currentTile.z <= 5 && patchDepth <= 5) || (currentTile.z > 5 && patchDepth > 5));
        var deepx = void 0;
        var deepy = void 0;
        // right
        if (myNeighborsEquals[1][2]) {
            rect.width += sizeMaskBorder;
            stroke += "\n      <line stroke-dasharray=\"4,4\" x1=\"255\" y1=\"10\" x2=\"255\" y2=\"245\" />\n      ";
        }
        else {
            // big tile level
            if (comparable) {
                deepx = (currentTile.x + 1) * patchNbTiles;
                deepy = currentTile.y * patchNbTiles;
                for (var i = 0; i < patchNbTiles; i++) {
                    var tile1 = getXYTile({ x: deepx, y: deepy + i, z: deeplevel });
                    var tile2 = getXYTile({ x: deepx - 1, y: deepy + i, z: deeplevel });
                    if (tile1 && tile2 && compareTiles(tile1, tile2)) {
                        rectJoin += "\n            <rect x=\"" + (256 - 15) + "\" y=\"" + (offsetx + i * patchWidth) + "\" width=\"" + patchHeight + "\" height=\"" + patchWidth + "\" fill=\"" + fillRect + "\" />\n            <line stroke-dasharray=\"2,2\" x1=\"255\" y1=\"" + (offsetx + i * patchWidth) + "\" x2=\"255\" y2=\"" + (offsetx + (i + 1) * patchWidth) + "\" />\n            ";
                    }
                }
            }
        }
        // left
        if (myNeighborsEquals[1][0]) {
            rect.x -= sizeMaskBorder;
            rect.width += sizeMaskBorder;
        }
        else {
            // big tile level
            if (comparable) {
                deepx = currentTile.x * patchNbTiles;
                deepy = currentTile.y * patchNbTiles;
                for (var i = 0; i < patchNbTiles; i++) {
                    var tile1 = getXYTile({ x: deepx, y: deepy + i, z: deeplevel });
                    var tile2 = getXYTile({ x: deepx - 1, y: deepy + i, z: deeplevel });
                    if (tile1 && tile2 && compareTiles(tile1, tile2)) {
                        rectJoin += "\n            <rect x=\"0\" y=\"" + (offsetx + i * patchWidth) + "\" width=\"" + patchHeight + "\" height=\"" + patchWidth + "\" fill=\"" + fillRect + "\" />\n            \n            ";
                    }
                }
            }
        }
        // top
        if (myNeighborsEquals[0][1]) {
            rect.y -= sizeMaskBorder;
            rect.height += sizeMaskBorder;
        }
        else {
            // big tile level
            if (comparable) {
                deepx = currentTile.x * patchNbTiles;
                deepy = currentTile.y * patchNbTiles;
                for (var i = 0; i < patchNbTiles; i++) {
                    var tile1 = getXYTile({ x: deepx + i, y: deepy - 1, z: deeplevel });
                    var tile2 = getXYTile({ x: deepx + i, y: deepy, z: deeplevel });
                    if (tile1 && tile2 && compareTiles(tile1, tile2)) {
                        rectJoin += "\n            <rect x=\"" + (offsetx + patchWidth * i) + "\" y=\"0\" width=\"" + patchWidth + "\" height=\"" + patchHeight + "\" fill=\"" + fillRect + "\" />\n            ";
                    }
                }
            }
        }
        // bottom
        if (myNeighborsEquals[2][1]) {
            rect.height += 16;
            stroke += "\n      <line stroke-dasharray=\"4,4\" x1=\"10\" y1=\"255\" x2=\"245\" y2=\"255\" />\n      ";
        }
        else {
            // big tile level
            if (comparable) {
                deepx = currentTile.x * patchNbTiles;
                deepy = (currentTile.y + 1) * patchNbTiles;
                for (var i = 0; i < patchNbTiles; i++) {
                    var tile1 = getXYTile({ x: deepx + i, y: deepy - 1, z: deeplevel });
                    var tile2 = getXYTile({ x: deepx + i, y: deepy, z: deeplevel });
                    if (tile1 && tile2 && compareTiles(tile1, tile2)) {
                        rectJoin += "\n            <rect x=\"" + (offsetx + patchWidth * i) + "\" y=\"" + (256 - 15) + "\" width=\"" + patchWidth + "\" height=\"" + patchHeight + "\" fill=\"" + fillRect + "\" />\n            <line stroke-dasharray=\"2,2\" x1=\"" + (offsetx + i * patchWidth) + "\" y1=\"255\" x2=\"" + (offsetx + (i + 1) * patchWidth) + "\" y2=\"255\" />\n            ";
                    }
                }
            }
        }
        var _b = genMatrix(currentTile, zinit, true), myNeighbors = _b.myNeighbors, myNeighborsEquals = _b.myNeighborsEquals, nbEqualsBtwThem = _b.nbEqualsBtwThem;
        join = genJoin(myNeighborsEquals, nbEqualsBtwThem, fillRect);
    }
    if (designation.length > 40) {
        //designation.split(" ")
        // for 
    }
    return "\n\n  " + join + "\n\n  <rect x=\"" + rect.x + "\" y=\"" + rect.y + "\" width=\"" + rect.width + "\" height=\"" + rect.height + "\" \n          rx=\"15\" ry=\"15\" fill=\"" + fillRect + "\" />\n  <text text-anchor=\"middle\" x=\"128\" y=\"64\" font-size=\"22\" fill=\"" + textcolor + "\" >\n    " + whois + "\n  </text>\n  <text text-anchor=\"middle\" x=\"128\" y=\"132\" font-size=\"25\" fill=\"" + textcolor + "\">\n    " + currentTile.ip + "\n  </text>\n  <text text-anchor=\"middle\" x=\"128\" y=\"190\" font-size=\"13\" fill=\"" + textcolor + "\">\n  <![CDATA[" + designation + "]]>\n  </text>\n  <text text-anchor=\"end\" x=\"240\" y=\"240\" font-size=\"16\" fill=\"" + textcolor + "\">\n    " + date + "\n  </text>\n  " + rectJoin + "\n  " + stroke + "\n  \n";
}
function tileConstruct(coord) {
    var svgcontent;
    if (isTileInfoMoreThanOne(coord)) {
        svgcontent = tileConstructSubSVG(coord, 2, coord.z);
    }
    else {
        svgcontent = tileConstructSVG(coord, 3, coord.z);
    }
    return "<?xml version=\"1.0\" standalone=\"no\"?>\n<!DOCTYPE svg PUBLIC \"-//W3C//DTD SVG 1.1//EN\" \n  \"http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd\">\n\n<svg width=\"256px\" height=\"256px\" version=\"1.1\"\n     viewBox=\"0 0 256 256\" preserveAspectRatio=\"none\"\n     xmlns=\"http://www.w3.org/2000/svg\" shape-rendering=\"geometricPrecision\">\n  <defs>\n  <style type=\"text/css\">\n    <![CDATA[\n    text {\n      font-family: \"Open Sans\",arial,x-locale-body,sans-serif;\n    \n    }\n    line{\n      stroke: black;\n      stroke-width: 1;\n    }\n    circle{\n      fill: black;\n    }\n    ]]>\n  </style>\n  </defs>\n  " + svgcontent + "\n</svg>\n";
}
exports.tileConstruct = tileConstruct;
function tileConstructSubSVG(coord, rec, zinit) {
    var nx = coord.x * 2;
    var ny = coord.y * 2;
    var nz = coord.z + 1;
    var topLeft;
    var topRight;
    var bottomRight;
    var bottomLeft;
    var coordTopLeft = { x: nx, y: ny, z: nz };
    if (rec > 0 && isTileInfoMoreThanOne(coordTopLeft)) {
        topLeft = tileConstructSubSVG(coordTopLeft, rec - 1, zinit);
    }
    else {
        topLeft = tileConstructSVG(coordTopLeft, rec, zinit);
    }
    var coordTopRight = { x: nx + 1, y: ny, z: nz };
    if (rec > 0 && isTileInfoMoreThanOne(coordTopRight)) {
        topRight = tileConstructSubSVG(coordTopRight, rec - 1, zinit);
    }
    else {
        topRight = tileConstructSVG(coordTopRight, rec, zinit);
    }
    var coordBottomRight = { x: nx + 1, y: ny + 1, z: nz };
    if (rec > 0 && isTileInfoMoreThanOne(coordBottomRight)) {
        bottomRight = tileConstructSubSVG(coordBottomRight, rec - 1, zinit);
    }
    else {
        bottomRight = tileConstructSVG(coordBottomRight, rec, zinit);
    }
    var coordBottomLeft = { x: nx, y: ny + 1, z: nz };
    if (rec > 0 && isTileInfoMoreThanOne(coordBottomLeft)) {
        bottomLeft = tileConstructSubSVG(coordBottomLeft, rec - 1, zinit);
    }
    else {
        bottomLeft = tileConstructSVG(coordBottomLeft, rec, zinit);
    }
    var currentTile = getXYTile(coord);
    var whois = currentTile.whois;
    var designation = currentTile.desc;
    //const date        = currentTile.date;
    var fillRect = getColorFromWhois({ whois: whois, designation: designation });
    var _a = genMatrix(currentTile, zinit, true), myNeighbors = _a.myNeighbors, myNeighborsEquals = _a.myNeighborsEquals, nbEqualsBtwThem = _a.nbEqualsBtwThem;
    var join = genJoin(myNeighborsEquals, nbEqualsBtwThem, fillRect);
    var initSize = 256;
    var offset = 0;
    var sizeblock = initSize - offset;
    return "\n  " + join + "\n  <svg width=\"" + sizeblock + "px\" height=\"" + sizeblock + "px\" viewBox=\"-" + offset + " -" + offset + " 512 512\" preserveAspectRatio=\"none\">\n    <svg width=\"256px\" height=\"256px\" viewBox=\"0 0 256 256\" preserveAspectRatio=\"none\">\n      " + topLeft + "\n    </svg>\n  </svg>\n  <svg width=\"" + sizeblock + "px\" height=\"" + sizeblock + "px\" viewBox=\"-" + (initSize + offset) + " -" + offset + " 512 512\" preserveAspectRatio=\"none\">\n    <svg width=\"256px\" height=\"256px\" viewBox=\"0 0 256 256\" preserveAspectRatio=\"none\">\n      " + topRight + "\n    </svg>\n  </svg>\n  <svg width=\"" + sizeblock + "px\" height=\"" + sizeblock + "px\" viewBox=\"-" + (initSize + offset) + " -" + (initSize + offset) + " 512 512\" preserveAspectRatio=\"none\">\n    <svg width=\"256px\" height=\"256px\" viewBox=\"0 0 256 256\" preserveAspectRatio=\"none\">\n      " + bottomRight + "\n    </svg>\n  </svg>\n  <svg width=\"" + sizeblock + "px\" height=\"" + sizeblock + "px\" viewBox=\"-" + offset + " -" + (initSize + offset) + " 512 512\" preserveAspectRatio=\"none\">\n    <svg width=\"256px\" height=\"256px\" viewBox=\"0 0 256 256\" preserveAspectRatio=\"none\">\n      " + bottomLeft + "\n    </svg>\n  </svg>\n";
}
//# sourceMappingURL=tilesvg.js.map