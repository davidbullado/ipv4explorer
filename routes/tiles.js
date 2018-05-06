"use strict";
/*
 * GET tiles listing.
 */
Object.defineProperty(exports, "__esModule", { value: true });
var express = require("express");
var tilesvg_1 = require("../build-tiles/tilesvg");
var index_1 = require("../ipv4/index");
var router = express.Router();
//function filterBetween(d) {
//    return d.ipRangeStart.pVal <= this.value && this.value <= d.ipRangeEnd.pVal;
//}
//// strictly between
//function filter(d) {
//    return (d.ipRangeStart.pVal <= this.ipStart && this.ipEnd <= d.ipRangeEnd.pVal) ||
//        (this.ipStart <= d.ipRangeStart.pVal && d.ipRangeEnd.pVal <= this.ipEnd) ||
//        d.ipRangeStart.pVal <= this.ipStart && this.ipStart <= d.ipRangeEnd.pVal ||
//        d.ipRangeStart.pVal <= this.ipEnd && this.ipEnd <= d.ipRangeEnd.pVal;
//}
///**
// * Get a slice of ip/country array
// * @param ipStart first ip of a block
// * @param ipEnd last ip of a block
// */
//function getCountriesRange(ipStart: number, ipEnd: number): IDataIP[] {
//    // instead of doing an array.filter, which is time consuming,
//    // we use bisect on an index.
//    const idLo = bisectLeft( ip2lite.ipArrayIdx, ipStart ) ;
//    const idHi = bisectLeft( ip2lite.ipArrayIdx, ipEnd ) ;
//    const myRange = ip2lite.ipArray.slice(idLo, idHi + 1);
//
//    return myRange;
//}
//
//function aggregateCountryRangeByLabel(myRange: IDataIP[]) {
//
//    const countries = new Map();
//    myRange.forEach((r) => {
//        countries.set(r.countryCode, r.countryLabel);
//    });
//    return countries;
//}
//
//function getCountries(ipValue: number, zoom: number) {
//    let res: string ;
//    let ipEnd: IPv4;
//
//    // get last ip of the block given zoom
//    ipEnd = (new IPv4(ipValue)).getLastIPMask(zoom * 2);
//
//    const m = aggregateCountryRangeByLabel(getCountriesRange(ipValue, ipEnd.pVal));
//
//    if ( m.size === 1 ) {
//        // get the full country name
//        res = m.values().next().value;
//    } else {
//        // get the country codes
//        const arrCountryCode = Array.from(m.keys());
//        // concat them into csv with a trailing ... if more than 4 countries.
//        res = arrCountryCode.slice(0, 4).join(", ") + (m.size > 4 ? ", " + arrCountryCode[4] + ", ..." : "");
//    }
//
//    return res;
//}
//
//function moreThanOneCountry(ipValue: number, zoom: number) {
//    let moreThanOne = false;
//    let ipEnd: IPv4;
//
//    // get last ip of the block given zoom
//    ipEnd = (new IPv4(ipValue)).getLastIPMask(zoom * 2);
//    const myRange = getCountriesRange(ipValue, ipEnd.pVal);
//    if (myRange.length > 1) {
//        const myVal = myRange[0].countryCode ;
//        for (var i = 0; i < myRange.length && !moreThanOne; i++) {
//            moreThanOne = myVal != myRange[i].countryCode;
//        }
//    }
//    return moreThanOne ;
//}
//function getIPFromXYZ(x, y, z) {
//
//    let ipval: number = 0;
//    const point: { x: number, y: number } = { x: 0, y: 0 };
//
//    for (let i: number = z; i > 0; i--) {
//
//        point.x = x >> (i - 1) & 1;
//        point.y = y >> (i - 1) & 1;
//
//        let m: number = point.x | (point.y << 1);
//        let n: number = point.x | point.y;
//
//        ipval += m * Math.pow(2, n * (32 - ((z - i + 1) << 1)));
//
//    }
//
//    let strip: string = (ipval >> 24 & 255) + "." + (ipval >> 16 & 255) + "." + (ipval >> 8 & 255) + "." + (ipval & 255);
//    const myIP: IPv4 = new IPv4(ipval);
//
//    return myIP;
//}
function buildTileSVG(x, y, z) {
    var myIP = index_1.getIPFromXYZ(x, y, z);
    var svgTileContent;
    //var getTileInfo = (ipTile: IPv4, point) => {
    //    if (ipTile) {
    //        
    //        let strIP: string = ipTile.toString();
    //        // single ip scale
    //        if (point.z < 16) {
    //            strIP += "/" + (point.z * 2) + "\n";
    //        }
    //        // list all Regional Internet Registries where my ip belong
    //        const resWhois = ip2lite.ipWhois.filter(filter, { ipStart: ipTile.pVal, ipEnd: ipTile.getLastIPMask(point.z * 2).pVal } );
    //        let res= {x: point.x, y: point.y, z: point.z, desc: null, whois: resWhois[0].whois, date: null, ip: strIP};
    //        
    //        if ( point.z > 5 ) {
    //            res.desc = getCountries(ipTile.pVal,point.z) ;
    //            res.date = "";
    //        } else {
    //            res.desc = resWhois[0].designation ;
    //            res.date = resWhois[0].date;
    //        }
    //
    //        return res;
    //
    //    } else {
    //        return null;
    //    }
    //};
    //var isTileInfoMoreThanOne = (point) => {
    //    const ipTile: IPv4 = getIPFromXYZ(point.x,point.y,point.z);
    //    if (ipTile) {
    //        if ( point.z > 5 ) {
    //            return moreThanOneCountry(ipTile.pVal, point.z);
    //        } else {
    //            const resWhois = ip2lite.ipWhois.filter(filter, { ipStart: ipTile.pVal, ipEnd: ipTile.getLastIPMask(point.z * 2).pVal } );
    //            let moreThanOne = false;
    //            if (resWhois.length > 1) {
    //                const myVal = resWhois[0].designation ;
    //                for (var i = 0; i < resWhois.length && !moreThanOne; i++) {
    //                    moreThanOne = myVal != resWhois[i].designation;
    //                }
    //            }
    //            return moreThanOne;
    //        }
    //    } else {
    //        return false;
    //    }
    //};
    //var getXYTile = (point) => {
    //    const ipTile: IPv4 = getIPFromXYZ(point.x,point.y,point.z);
    //    return getTileInfo(ipTile, point);
    //};
    //var compareTiles = (tile1, tile2) => {
    //    return tile1.desc === tile2.desc && tile1.whois === tile2.whois ;
    //};
    svgTileContent = tilesvg_1.tileConstruct({ x: x, y: y, z: z });
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