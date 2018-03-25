"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var d3_dsv_1 = require("d3-dsv");
var node_fetch_1 = require("node-fetch");
var index_1 = require("../ipv4/index");
var fs = require("fs");
var urlLoc = "https://github.com/davidbullado/ip2location/raw/master/IP2LOCATION-LITE-DB1.CSV";
var ip2lite = { ipArray: null };
console.log("Prepare fetching " + urlLoc);
//export function start(res: express.Response) {
function start(callback) {
    node_fetch_1.default(urlLoc)
        .then(function (res) { return res.text(); })
        .then(function (body) {
        console.log("Parse csv...");
        //: [number, number, string, string]
        ip2lite.ipArray = d3_dsv_1.csvParseRows(body, function (row) {
            var ipRes = {
                ipRangeStart: new index_1.default(Number(row[0])),
                ipRangeEnd: new index_1.default(Number(row[1])),
                countryCode: row[2],
                countryLabel: row[3]
            };
            return ipRes;
        });
        ip2lite.ipArray = ip2lite.ipArray.filter(function (value) {
            return value.countryCode != "-";
        });
        console.log("Successfully fetched elements: " + ip2lite.ipArray.length);
        callback();
    });
}
exports.start = start;
exports.default = ip2lite;
//# sourceMappingURL=index.js.map