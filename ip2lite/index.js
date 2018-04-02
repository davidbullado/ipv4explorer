"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var d3_dsv_1 = require("d3-dsv");
var node_fetch_1 = require("node-fetch");
var index_1 = require("../ipv4/index");
var fs = require("fs");
var urlLoc = "https://github.com/davidbullado/ip2location/raw/master/IP2LOCATION-LITE-DB1.CSV";
var ip2lite = { ipArray: null, ipWhois: null };
var processRow = function (row) {
    var extractDigit = new RegExp(/0*(\d+)/);
    var r = extractDigit.exec(row.Prefix);
    if (!r || r.length != 2) {
        throw new Error("format error column prefix: " + row.Prefix);
    }
    var ip = r[1] + ".0.0.0";
    var whois = "";
    if (row.WHOIS.length > 0) {
        var extractWhois = new RegExp(/whois\.([a-z]+)\./);
        var resWhois = extractWhois.exec(row.WHOIS);
        if (!resWhois || resWhois.length != 2) {
            throw new Error("format error column WHOIS: " + row.WHOIS);
        }
        whois = resWhois[1].toUpperCase();
    }
    // we want to convert ip into coordinates:
    var myip = index_1.default.newIPv4FromString(ip);
    /*// we have to scale to zoom 4, i.e. divide by 2^12.
    // (because point.x E [0, 2^16], and we want x E [0, 2^4])
    var x = myip.point.x / 0x1000; // 0x1000 = 2^12
    var y = myip.point.y / 0x1000;
*/
    return {
        ip: ip,
        ipRangeStart: myip,
        ipRangeEnd: myip.getLastIPMask(8),
        whois: whois,
        designation: row.Designation,
        date: row.Date
    };
};
//export function start(res: express.Response) {
function start(callback) {
    console.log("Load: ipv4-address-space.csv");
    var buf = fs.readFileSync("./build-tiles/ipv4-address-space.csv");
    console.log("csvParse: ipv4-address-space.csv");
    ip2lite.ipWhois = d3_dsv_1.csvParse(buf.toString(), processRow);
    console.log("csvParse: ok");
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