/*
 * GET tiles listing.
 */

import { bisectLeft } from "d3-array";
import express = require("express");
import fs = require("fs");
import path = require("path");
import { tileConstruct } from "../build-tiles/tilesvg";
import { IDataIP, ip2lite } from "../ip2lite";
import IPv4 from "../ipv4/index";
import { objectTypeAnnotation } from "babel-types";

const router: express.Router = express.Router();

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
function getCountriesRange(ipStart: number, ipEnd: number): IDataIP[] {
    // instead of doing an array.filter, which is time consuming,
    // we use bisect on an index.
    const idLo = bisectLeft( ip2lite.ipArrayIdx, ipStart ) ;
    const idHi = bisectLeft( ip2lite.ipArrayIdx, ipEnd ) ;
    const myRange = ip2lite.ipArray.slice(idLo, idHi + 1);

    return myRange;
}

function aggregateCountryRangeByLabel(myRange: IDataIP[]) {

    const countries = new Map();
    myRange.forEach((r) => {
        countries.set(r.countryCode, r.countryLabel);
    });
    return countries;
}

function getCountries(ipValue: number, zoom: number) {
    let res: string ;
    let ipEnd: IPv4;

    // get last ip of the block given zoom
    ipEnd = (new IPv4(ipValue)).getLastIPMask(zoom * 2);

    const m = aggregateCountryRangeByLabel(getCountriesRange(ipValue, ipEnd.pVal));

    if ( m.size === 1 ) {
        // get the full country name
        res = m.values().next().value;
    } else {
        // get the country codes
        const arrCountryCode = Array.from(m.keys());
        // concat them into csv with a trailing ... if more than 4 countries.
        res = arrCountryCode.slice(0, 4).join(", ") + (m.size > 4 ? ", " + arrCountryCode[4] + ", ..." : "");
    }

    return res;
}

function moreThanOneCountry(ipValue: number, zoom: number) {
    let moreThanOne = false;
    let ipEnd: IPv4;

    // get last ip of the block given zoom
    ipEnd = (new IPv4(ipValue)).getLastIPMask(zoom * 2);
    const myRange = getCountriesRange(ipValue, ipEnd.pVal);
    if (myRange.length > 1) {
        const myVal = myRange[0].countryCode ;
        for (var i = 0; i < myRange.length && !moreThanOne; i++) {
            moreThanOne = myVal != myRange[i].countryCode;
        }
    }
    return moreThanOne ;
}

function getIPFromXYZ(x, y, z) {

    let ipval: number = 0;
    const point: { x: number, y: number } = { x: 0, y: 0 };

    for (let i: number = z; i > 0; i--) {

        point.x = x >> (i - 1) & 1;
        point.y = y >> (i - 1) & 1;

        let m: number = point.x | (point.y << 1);
        let n: number = point.x | point.y;

        ipval += m * Math.pow(2, n * (32 - ((z - i + 1) << 1)));

    }

    let strip: string = (ipval >> 24 & 255) + "." + (ipval >> 16 & 255) + "." + (ipval >> 8 & 255) + "." + (ipval & 255);
    const myIP: IPv4 = new IPv4(ipval);

    return myIP;
}

/*
router.get("/:z/:x/:y", (req: express.Request, res: express.Response) => {
    const x: number = Number(req.params.x);
    const y: number = Number(req.params.y);
    const z: number = Number(req.params.z);

    const file: string = path.join(__dirname, "../tiles_svg/", z + "/" + x + "/" + y);

    res.type("svg");

    if (false && fs.existsSync(file)) {
        res.sendFile(file);
    } else {

        const myIP: IPv4 = getIPFromXYZ(x, y, z);

        let strIP: string = myIP.toString();
        // single ip scale
        if (z < 16) {
            strIP += "/" + (z * 2) + "\n";
        }

        let folder = path.join(__dirname, "../tiles_svg");
        if (!fs.existsSync(folder)) {
            fs.mkdirSync(folder);
        }
        folder = path.join(__dirname, "../tiles_svg/", "" + z);
        if (!fs.existsSync(folder)) {
            fs.mkdirSync(folder);
        }
        folder += "/" + x;
        if (!fs.existsSync(folder)) {
            fs.mkdirSync(folder);
        }

        let svgTileContent;

        if (z >= 4) {
            
            var getTileInfo ;
             
            if ( z > 6 ) {
                getTileInfo = (ipTile: IPv4, point) => {
                    if (ipTile) {
                        // list all Regional Internet Registries where my ip belong
                        const resWhois = ip2lite.ipWhois.filter(filter, { ipStart: ipTile.pVal, ipEnd: ipTile.getLastIPMask(z * 2).pVal } );
                        let res= {x: point.x, y: point.y, desc: getCountries(ipTile.pVal,z), whois: resWhois[0].whois, date: ""};
                        return res;
                    } else {
                        return null;
                    }
                };
            } else  {
                getTileInfo = (ipTile: IPv4, point) => {
                    if (ipTile) {
                        // list all Regional Internet Registries where my ip belong
                        const res = ip2lite.ipWhois.filter(filter, { ipStart: ipTile.pVal, ipEnd: ipTile.getLastIPMask(z * 2).pVal } );
                        return {x: point.x, y: point.y, desc: res[0].designation, whois: res[0].whois, date: res[0].date};
                    } else {
                        return null;
                    }
                };
            }
            let row = getTileInfo(myIP, {x:x, y:y});
           
            var getXYTile = (point) => {
                const ipTile: IPv4 = getIPFromXYZ(point.x,point.y,z);
                return getTileInfo(ipTile, point);
            };
            var compareTiles = (tile1, tile2) => {
                return tile1.desc === tile2.desc && tile1.whois === tile2.whois ;
            };
            svgTileContent = tileConstruct(strIP, row.whois, row.desc, row.date, getXYTile, compareTiles, row, null);
        } else {

            svgTileContent = tileConstruct(strIP, "", "", "", null, null, {x:x, y:y, desc: ""}, "#e0e0e0");
        }

        let callback = (err) => {
            res.type("svg");
            res.sendFile(file);
        }
        fs.writeFile(file, svgTileContent,callback);
            
    }
});
*/

function buildTileSVG (x: number, y: number, z: number) {
    const myIP: IPv4 = getIPFromXYZ(x, y, z);

    let strIP: string = myIP.toString();

    // single ip scale
    if (z < 16) {
        strIP += "/" + (z * 2) + "\n";
    }

    let svgTileContent;

    if (z >= 4) {
       var getTileInfo = (ipTile: IPv4, point) => {
            if (ipTile) {
                // list all Regional Internet Registries where my ip belong
                const resWhois = ip2lite.ipWhois.filter(filter, { ipStart: ipTile.pVal, ipEnd: ipTile.getLastIPMask(z * 2).pVal } );
                let res= {x: point.x, y: point.y, desc: getCountries(ipTile.pVal,z), whois: resWhois[0].whois, date: ""};
                
                if ( z > 6 ) {
                    res.desc = getCountries(ipTile.pVal,z) ;
                } else {
                    res.desc = resWhois[0].designation ;
                    res.date = resWhois[0].date
                }

                return res;

            } else {
                return null;
            }
        };
        var getXYTile = (point) => {
            const ipTile: IPv4 = getIPFromXYZ(point.x,point.y,z);
            return getTileInfo(ipTile, point);
        };
        var compareTiles = (tile1, tile2) => {
            return tile1.desc === tile2.desc && tile1.whois === tile2.whois ;
        };

        svgTileContent = tileConstruct(strIP, getXYTile, compareTiles, {x:x, y:y}, null);
    } else {

        svgTileContent = tileConstruct(strIP, null, null, {x:x, y:y}, "#e0e0e0");
    }

    return svgTileContent;
}

router.get("/:z/:x/:y", (req: express.Request, res: express.Response) => {
    const x: number = Number(req.params.x);
    const y: number = Number(req.params.y);
    const z: number = Number(req.params.z);

   
    res.type("svg");
    res.send(buildTileSVG (x, y, z));
});


export default router;
