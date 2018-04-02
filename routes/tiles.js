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
    var myRange = ip2lite_1.default.ipArray.filter(filter, { ipStart: ipValue, ipEnd: ipEnd.pVal }); // d => d.ipRangeStart.pVal <= ipval && ipEnd.pVal <= d.ipRangeEnd.pVal
    var countries = new Set();
    if (zoom === 16) {
        myRange.forEach(function (r) { return countries.add(r.countryLabel); });
    }
    else {
        myRange.forEach(function (r) { return countries.add(r.countryCode); });
    }
    return Array.from(countries).join(", ");
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
    function getXYTile(point) {
        var myip = getIPFromXYZ(point.x, point.y, z);
        if (myip) {
            var res_1 = ip2lite_1.default.ipWhois.filter(filter, { ipStart: myip.pVal, ipEnd: myip.getLastIPMask(z * 2).pVal });
            var whoistxt = "";
            if (res_1 && res_1.length > 0) {
                var whois_1 = new Set();
                res_1.forEach(function (r) { return whois_1.add(r.whois); });
                whoistxt = Array.from(whois_1).join(',');
            }
            return { x: point.x, y: point.y, desc: getCountries(myip.pVal, z), whois: whoistxt };
        }
        else {
            return null;
        }
    }
    function compareTo(row1, row2) {
        return row1.desc === row2.desc;
    }
    res.type("svg");
    if (z === 4) {
        console.log("found: " + file);
        res.sendFile(file);
    }
    else {
        var myIP = getIPFromXYZ(x, y, z);
        var myCountryList = getCountries(myIP.pVal, z);
        var strip = myIP.toString();
        // single ip scale
        if (z === 16) {
        }
        else {
            strip += "/" + (z * 2) + "\n";
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
        console.log("Build tile " + strip);
        var reswhois = ip2lite_1.default.ipWhois.filter(filter, { ipStart: myIP.pVal, ipEnd: myIP.getLastIPMask(z * 2).pVal });
        if (!reswhois || reswhois.length === 0) {
            console.log("error: whois cannot be found :" + myIP);
        }
        var data = void 0;
        if (reswhois.length > 1) {
            var whoistxt = "";
            var whois_2 = new Set();
            reswhois.forEach(function (r) { return whois_2.add(r.whois); });
            whoistxt = Array.from(whois_2).join(',');
            data = tilesvg(strip, whoistxt, myCountryList, "", getXYTile, compareTo, { x: x, y: y, desc: myCountryList });
        }
        else {
            data = tilesvg(strip, reswhois[0].whois, myCountryList, "", getXYTile, compareTo, { x: x, y: y, desc: myCountryList });
        }
        var callback = function (err) {
            res.type("svg");
            res.sendFile(file);
        };
        fs.writeFile(file, data, callback);
    }
});
exports.default = router;
//# sourceMappingURL=tiles.js.map