"use strict";
/*
 * GET tiles listing.
 */
Object.defineProperty(exports, "__esModule", { value: true });
var d3_array_1 = require("d3-array");
var express = require("express");
var tilesvg_1 = require("../build-tiles/tilesvg");
var ip2lite_1 = require("../ip2lite");
var index_1 = require("../ipv4/index");
var router = express.Router();
function filterBetween(d) {
    return d.ipRangeStart.pVal <= this.value && this.value <= d.ipRangeEnd.pVal;
}
// strictly between
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
    var myIP = new index_1.IPv4(ipval);
    return myIP;
}
function buildTileSVG(x, y, z) {
    var myIP = getIPFromXYZ(x, y, z);
    var svgTileContent;
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
                res.desc = resWhois[0].designation;
                res.date = resWhois[0].date;
            }
            return res;
        }
        else {
            return null;
        }
    };
    var isTileInfoMoreThanOne = function (point) {
        var ipTile = getIPFromXYZ(point.x, point.y, point.z);
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
    };
    var getXYTile = function (point) {
        var ipTile = getIPFromXYZ(point.x, point.y, point.z);
        return getTileInfo(ipTile, point);
    };
    var compareTiles = function (tile1, tile2) {
        return tile1.desc === tile2.desc && tile1.whois === tile2.whois;
    };
    svgTileContent = tilesvg_1.tileConstruct(getXYTile, compareTiles, isTileInfoMoreThanOne, { x: x, y: y, z: z }, null);
    return svgTileContent;
}
router.get("/:z/:x/:y", function (req, res) {
    var x = Number(req.params.x);
    var y = Number(req.params.y);
    var z = Number(req.params.z);
    res.type("svg");
    res.send(buildTileSVG(x, y, z));
});
exports.default = router;
//# sourceMappingURL=tiles.js.map