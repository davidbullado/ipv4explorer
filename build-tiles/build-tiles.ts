/*global http*/
import request = require('sync-request');
import d3 = require("d3-dsv");
import fs = require("fs");
import { tileConstruct } from "./tilesvg";
import {IPv4} from "../ipv4";

var buf = fs.readFileSync("./ipv4-address-space.csv");

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

    // we have to scale to zoom 4, i.e. divide by 2^12.
    // (because point.x E [0, 2^16], and we want x E [0, 2^4])
    var x = myip.pPoint.x / 0x1000; // 0x1000 = 2^12
    var y = myip.pPoint.y / 0x1000;

    return {
        ip: ip,
        whois: whois,
        designation: row.Designation,
        date: row.Date,
        x: x,
        y: y
    };
};
var result = d3.csvParse(buf.toString(), processRow );


function compareTo (row1, row2) {
    return row1.whois === row2.whois && row1.designation === row2.designation
}
function findXY (row) {
    return row.x === this.x && row.y === this.y;
}
function getXYTile (point) {
    return result.find(findXY,point);
}

result.forEach(function(row) {

    if (!fs.existsSync('../tiles_svg/4')) {
        fs.mkdirSync('../tiles_svg/4');
    }
    if (!fs.existsSync(`../tiles_svg/4/${row.x}`)) {
        fs.mkdirSync(`../tiles_svg/4/${row.x}`);
    }
    
    var filename = `../tiles_svg/4/${row.x}/${row.y}`;
  
   // fs.writeFileSync(filename,tileConstruct(row.ip,row.whois,row.designation,row.date,getXYTile,compareTo, row, null));

  });
