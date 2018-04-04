import { csvParseRows, csvParse } from "d3-dsv";
import fetch from "node-fetch";
import IPv4 from "../ipv4/index";
import express = require('express');

var fs:any = require("fs");

const urlLoc: string = "https://github.com/davidbullado/ip2location/raw/master/IP2LOCATION-LITE-DB1.CSV";

interface IDataIP {
    ipRangeStart: IPv4;
    ipRangeEnd: IPv4;
    countryCode: string;
    countryLabel: string;
}
interface IWhois {
    ip: string,
    ipStart: number,
    ipEnd: number,
    whois: string,
    designation: string,
    date: string
}
let ip2lite: {
    ipArray: IDataIP[],
    ipArrayIdx: number[],
    ipWhois: IWhois[]
} = { ipArray: null, ipArrayIdx: [], ipWhois: null };

var processRow = (row) => {
    var extractDigit = new RegExp(/0*(\d+)/) ;
    var r = extractDigit.exec(row.Prefix);
    if (!r || r.length != 2){
        throw new Error("format error column prefix: "+row.Prefix);
    }
    var ip = r[1]+".0.0.0";

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
        designation: row.Designation,
        date: row.Date
    };
};


//export function start(res: express.Response) {
export function start(callback) {

    fetch(urlLoc)
        .then(res => res.text())
        .then(body => {
            console.log("Parse csv...");
            //: [number, number, string, string]
            ip2lite.ipArray = csvParseRows(body, (row) => {
                let ipRes: IDataIP = {
                        ipRangeStart: new IPv4(Number(row[0])),
                        ipRangeEnd: new IPv4(Number(row[1])),
                        countryCode: row[2],
                        countryLabel: row[3]
                    }
                return ipRes;
            });
            
            ip2lite.ipArray.forEach(function (item) { ip2lite.ipArrayIdx.push(item.ipRangeEnd.pVal) });
       
          /*  ip2lite.ipArray = ip2lite.ipArray.filter(value => {
                return value.countryCode != "-";
            });
            */
            console.log("Successfully fetched elements: "+ip2lite.ipArray.length);
            callback();
        });
        
    console.log("Load: ipv4-address-space.csv");
    var buf = fs.readFileSync("./build-tiles/ipv4-address-space.csv");
    console.log("csvParse: ipv4-address-space.csv");
    ip2lite.ipWhois = csvParse(buf.toString(), processRow );
    console.log("csvParse: ok");

}

export default ip2lite;