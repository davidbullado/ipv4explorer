"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/*
 * GET tiles listing.
 */
var express = require("express");
var text2png = require("../text2png/index.js");
var ip2lite_1 = require("../ip2lite");
var index_1 = require("../ipv4/index");
var router = express.Router();
router.get("/:z/:x/:y", function (req, res) {
    var x = Number(req.params.x);
    var y = Number(req.params.y);
    var z = Number(req.params.z);
    res.type("png");
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
    // single ip scale
    if (z === 16) {
        strip += "\n";
        var myRange = ip2lite_1.default.ipArray.filter(filterBetween, { value: ipval });
        if (myRange && myRange[0]) {
            strip += myRange[0].countryLabel;
        }
    }
    else {
        strip += "/" + (z * 2) + "\n";
        var ipEnd = new index_1.default(ipval);
        ipEnd = ipEnd.getLastIPMask(z * 2);
        var myRange = ip2lite_1.default.ipArray.filter(filter, { ipStart: ipval, ipEnd: ipEnd.pVal }); // d => d.ipRangeStart.pVal <= ipval && ipEnd.pVal <= d.ipRangeEnd.pVal
        if (myRange && myRange.length > 0) {
            if (myRange.length === 1) {
                strip += "\n";
                strip += myRange[0].countryLabel;
            }
            else {
                var countries_1 = new Set();
                myRange.forEach(function (r) { return countries_1.add(r.countryCode); });
                Array.from(countries_1).forEach(function (c, i, arr) {
                    if (i == 9 && arr.length > 10) {
                        strip += "...";
                    }
                    else if (i > 9 && arr.length > 10) {
                    }
                    else if (i === arr.length - 1) {
                        strip += c;
                    }
                    else {
                        if (i % 5 === 0) {
                            strip += "\n";
                        }
                        strip += c + ", ";
                    }
                });
            }
        }
    }
    res.send(text2png(strip, { color: "dark", width: 256, height: 256, borderWidth: 1, borderColor: "gray", lineSpacing: 13, padding: 7, font: '20px sans-serif' }));
});
exports.default = router;
//# sourceMappingURL=tiles.js.map