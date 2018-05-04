"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var d3_dsv_1 = require("d3-dsv");
var index_1 = require("../ipv4/index");
var sync_request_1 = require("sync-request");
var fs = require("fs");
var urlLoc = "https://github.com/davidbullado/ip2location/raw/master/IP2LOCATION-LITE-DB1.CSV";
var ip2lite = { ipArray: null, ipArrayIdx: [], ipWhois: null };
exports.ip2lite = ip2lite;
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
    var myip = index_1.IPv4.newIPv4FromString(ip);
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
function loadData() {
    var body;
    if (!fs.existsSync("./IP2LOCATION-LITE-DB1.CSV")) {
        console.log("Download csv...");
        body = sync_request_1.default('GET', urlLoc).getBody();
        fs.writeFileSync("./IP2LOCATION-LITE-DB1.CSV", body.toString());
    }
    else {
        body = fs.readFileSync("./IP2LOCATION-LITE-DB1.CSV").toString();
    }
    console.log("Parse csv...");
    ip2lite.ipArray = d3_dsv_1.csvParseRows(body, function (row) {
        var ipRes = {
            ipRangeStart: new index_1.IPv4(Number(row[0])),
            ipRangeEnd: new index_1.IPv4(Number(row[1])),
            countryCode: row[2],
            countryLabel: row[3]
        };
        return ipRes;
    });
    // Index by end ip.
    ip2lite.ipArray.forEach(function (item) { ip2lite.ipArrayIdx.push(item.ipRangeEnd.pVal); });
    console.log("Parse csv ok: " + ip2lite.ipArray.length);
    console.log("Load: ipv4-address-space.csv");
    var buf = fs.readFileSync("./build-tiles/ipv4-address-space.csv");
    console.log("csvParse: ipv4-address-space.csv");
    ip2lite.ipWhois = d3_dsv_1.csvParse(buf.toString(), processRow);
    console.log("csvParse: ok");
}
exports.loadData = loadData;
//# sourceMappingURL=index.js.map