import { csvParseRows, csvParse } from "d3-dsv";
import fetch from "node-fetch";
import { IPv4 } from "../ipv4/index";
import express = require('express');
import request from 'sync-request';

import fs = require("fs");

export interface IDataIP {
    ipRangeStart: IPv4;
    ipRangeEnd: IPv4;
    countryCode: string;
    countryLabel: string;
}
export interface IDataIPASN {
    ipRangeStart: IPv4;
    ipRangeEnd: IPv4;
    ASNName: string;
}
export interface IWhois {
    ip: string,
    ipRangeStart: IPv4,
    ipRangeEnd: IPv4,
    whois: string,
    host: string,
    designation: string,
    date: string
}
let ip2lite: {
    ipArray: IDataIP[],
    ipArrayASN: IDataIPASN[],
    ipArrayIdx: number[],
    ipArrayASNIdx: number[],
    ipWhois: IWhois[]
} = { ipArray: null, ipArrayASN:null, ipArrayIdx: [], ipArrayASNIdx: [], ipWhois: null };

var processRow = (row) : IWhois => {
    var extractDigit = new RegExp(/0*(\d+)/) ;
    var r = extractDigit.exec(row.Prefix);
    if (!r || r.length != 2){
        throw new Error("format error column prefix: "+row.Prefix);
    }
    var ip = r[1]+".0.0.0";

    let host = row.WHOIS;
    var whois = "";
    if (row.WHOIS.length > 0) {
        var extractWhois = new RegExp(/whois\.([a-z]+)\./);
        var resWhois = extractWhois.exec(row.WHOIS);
        if (!resWhois || resWhois.length != 2){
            throw new Error("format error column WHOIS: "+row.WHOIS);
        }
        whois = resWhois[1].toUpperCase();
    }

    // we want to convert ip into coordinates:
    var myip = IPv4.newIPv4FromString(ip);
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
        host: host,
        designation: row.Designation,
        date: row.Date
    };
};

export function loadData() {
    var body ;
    var asn;

    body = fs.readFileSync("./IP2LOCATION-LITE-DB1.CSV").toString();
    asn = fs.readFileSync("./IP2LOCATION-LITE-ASN.CSV").toString();

    console.log("Parse csv...");

    ip2lite.ipArray = csvParseRows(body, (row) => {
        let ipRes: IDataIP = {
                ipRangeStart: new IPv4(Number(row[0])),
                ipRangeEnd: new IPv4(Number(row[1])),
                countryCode: row[2],
                countryLabel: row[3]
            }
        return ipRes;
    });
    // Index by end ip.
    ip2lite.ipArray.forEach(function (item) { ip2lite.ipArrayIdx.push(item.ipRangeEnd.pVal) });
    console.log("Parse csv ip country ok: "+ip2lite.ipArray.length);

    ip2lite.ipArrayASN = csvParseRows(asn, (row) => {
        let ipRes: IDataIPASN = {
                ipRangeStart: new IPv4(Number(row[0])),
                ipRangeEnd: new IPv4(Number(row[1])),
                ASNName: row[4]
            }
        return ipRes;
    });
    // Index by end ip.
    ip2lite.ipArrayASN.forEach(function (item) { ip2lite.ipArrayASNIdx.push(item.ipRangeEnd.pVal) });
    console.log("Parse csv ip asn ok: "+ip2lite.ipArrayASNIdx.length);


    console.log("Load: ipv4-address-space.csv");
    var buf = fs.readFileSync("./build-tiles/ipv4-address-space.csv");
    console.log("csvParse: ipv4-address-space.csv");
    ip2lite.ipWhois = csvParse(buf.toString(), processRow );
    console.log("csvParse: ok");

}

export { ip2lite };