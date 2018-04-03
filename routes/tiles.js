"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/*
 * GET tiles listing.
 */
var express = require("express");
var ip2lite_1 = require("../ip2lite");
var fs = require("fs");
var index_1 = require("../ipv4/index");
var path = require("path");
var tilesvg = require("../build-tiles/tilesvg.js");
var router = express.Router();
function filterBetween(d) {
    return d.ipRangeStart.pVal <= this.value && this.value <= d.ipRangeEnd.pVal;
}
// strictly between
function filter(d) {
    return (d.ipRangeStart.pVal <= this.ipStart && this.ipEnd <= d.ipRangeEnd.pVal) ||
        (this.ipStart <= d.ipRangeStart.pVal && d.ipRangeEnd.pVal <= this.ipEnd) ||
        filterBetween.call({ value: this.ipStart }, d) ||
        filterBetween.call({ value: this.ipEnd }, d);
}
function getCountries(ipValue, zoom) {
    var ipEnd = new index_1.default(ipValue);
    var result = "";
    ipEnd = ipEnd.getLastIPMask(zoom * 2);
    var myRange = ip2lite_1.default.ipArray.filter(filter, { ipStart: ipValue, ipEnd: ipEnd.pVal });
    var countryCode = new Set();
    var countryLabels = new Set();
    myRange.forEach(function (r) {
        countryCode.add(r.countryCode);
        countryLabels.add(r.countryLabel);
    });
    var res = "";
    if (countryLabels.size === 1) {
        res = countryLabels.values().next().value;
    }
    else {
        var arrCountryCode = Array.from(countryCode);
        res = arrCountryCode.slice(0, 4).join(", ") + (countryCode.size > 4 ? ", " + arrCountryCode[4] + ", ..." : "");
    }
    return res;
}
function getIPFromXYZ(x, y, z) {
    var ipval = 0;
    var point = { x: 0, y: 0 };
    for (var i = z; i > 0; i--) {
        point.x = x >> (i - 1) & 1;
        point.y = y >> (i - 1) & 1;
        var m = point.x | (point.y << 1);
        var n = point.x | point.y;
        ipval += m * Math.pow(2, n * (32 - ((z - i + 1) << 1)));
    }
    var strip = (ipval >> 24 & 255) + "." + (ipval >> 16 & 255) + "." + (ipval >> 8 & 255) + "." + (ipval & 255);
    var myIP = new index_1.default(ipval);
    return myIP;
}
router.get("/:z/:x/:y", function (req, res) {
    var x = Number(req.params.x);
    var y = Number(req.params.y);
    var z = Number(req.params.z);
    var file = path.join(__dirname, "../tiles_svg/", z + "/" + x + "/" + y);
    console.log("Request: " + file);
    res.type("svg");
    /*if (z===4) {
        console.log("found: "+file);
        res.sendFile(file);
    } else */ if (fs.existsSync(file)) {
        console.log("found: " + file);
        res.sendFile(file);
    }
    else {
        var myIP = getIPFromXYZ(x, y, z);
        var myCountryList = "";
        if (z > 4) {
            myCountryList = getCountries(myIP.pVal, z);
        }
        var strIP = myIP.toString();
        // single ip scale
        if (z < 16) {
            strIP += "/" + (z * 2) + "\n";
        }
        var folder = path.join(__dirname, "../tiles_svg");
        if (!fs.existsSync(folder)) {
            console.log("Create folder: " + folder);
            fs.mkdirSync(folder);
        }
        folder = path.join(__dirname, "../tiles_svg/", "" + z);
        if (!fs.existsSync(folder)) {
            console.log("Create folder: " + folder);
            fs.mkdirSync(folder);
        }
        folder += "/" + x;
        if (!fs.existsSync(folder)) {
            console.log("Create folder: " + folder);
            fs.mkdirSync(folder);
        }
        //getXYTile : pour un x et y donné, retourne une row (contient x, y + infos discriminantes)
        // x et y, quelle ip sachant z ?
        // ip + range
        // filter
        // (ip, whois, designation, date, getXYTile, compareTo, row)
        console.log("Build tile " + strIP);
        var svgTileContent = void 0;
        var getTileInfo = function (ipTile, point) {
            if (ipTile) {
                var res_1 = ip2lite_1.default.ipWhois.filter(filter, { ipStart: ipTile.pVal, ipEnd: ipTile.getLastIPMask(z * 2).pVal });
                return { x: point.x, y: point.y, desc: getCountries(ipTile.pVal, z), whois: res_1[0].whois };
            }
            else {
                return null;
            }
        };
        var getXYTile = function (point) {
            var ipTile = getIPFromXYZ(point.x, point.y, z);
            return getTileInfo(ipTile, point);
        };
        var compareTiles = function (tile1, tile2) {
            return tile1.desc === tile2.desc && tile1.whois === tile2.whois;
        };
        // 
        if (z >= 4) {
            // list all Regional Internet Registries where my ip belong
            var myRIRs = ip2lite_1.default.ipWhois.filter(filter, { ipStart: myIP.pVal, ipEnd: myIP.getLastIPMask(z * 2).pVal });
            if (!myRIRs || myRIRs.length === 0) {
                console.log("error: whois cannot be found :" + myIP);
            }
            if (myRIRs.length > 0) {
                console.log("error: too much values for RIR: " + myRIRs.length);
            }
            var myRIR = myRIRs[0];
            var date = "";
            var designation = "";
            var title = "";
            if (z === 4) {
                date = myRIR.date;
                designation = myRIR.designation;
                title = myRIR.whois;
                getTileInfo = function (ipTile, point) {
                    if (ipTile) {
                        var res_2 = ip2lite_1.default.ipWhois.filter(filter, { ipStart: ipTile.pVal, ipEnd: ipTile.getLastIPMask(z * 2).pVal });
                        return { x: point.x, y: point.y, desc: res_2[0].designation, whois: res_2[0].whois };
                    }
                    else {
                        return null;
                    }
                };
            }
            else {
                designation = myCountryList;
                title = myRIR.whois;
            }
            var row = getTileInfo(myIP, { x: x, y: y });
            // 
            svgTileContent = tilesvg(strIP, title, designation, date, getXYTile, compareTiles, row);
        }
        else {
            svgTileContent = tilesvg(strIP, "", "", "", null, null, { x: x, y: y, desc: myCountryList }, "#f0f0f0");
        }
        /*
                // more than one
                if (myRIRs.length > 1) {
                    
                    let setRIR = new Set();
                    // remove duplicates
                    myRIRs.forEach(r => setRIR.add(r.whois));
                    // concat whois
                    const strRIRlist: string = Array.from(setRIR).join(', ');
                    
                    svgTileContent = tilesvg(strIP, strRIRlist, myCountryList, "", getXYTile, (row1, row2) => row1.desc === row2.desc , {x:x, y:y, desc: myCountryList});
                    
                } else{

                    svgTileContent = tilesvg(strIP, myRIRs[0].whois, myCountryList, "", getXYTile, (row1, row2) => row1.desc === row2.desc , {x:x, y:y, desc: myCountryList});

                }
        */
        var callback = function (err) {
            res.type("svg");
            res.sendFile(file);
        };
        fs.writeFile(file, svgTileContent, callback);
    }
});
exports.default = router;
//# sourceMappingURL=tiles.js.map