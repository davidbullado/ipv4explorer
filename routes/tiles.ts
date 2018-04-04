/*
 * GET tiles listing.
 */
import express = require("express");
import defaultExport from "../ip2lite";
import fs = require('fs');
import IPv4 from "../ipv4/index";
import path = require("path");
import tilesvg = require("../build-tiles/tilesvg.js");
import { bisectLeft } from "d3-array";

const router: express.Router = express.Router();

function filterBetween(d) {
    return d.ipRangeStart.pVal <= this.value && this.value <= d.ipRangeEnd.pVal;
}
// strictly between
function filter(d) {
    return (d.ipRangeStart.pVal <= this.ipStart && this.ipEnd <= d.ipRangeEnd.pVal) ||
        (this.ipStart <= d.ipRangeStart.pVal && d.ipRangeEnd.pVal <= this.ipEnd) ||
        d.ipRangeStart.pVal <= this.ipStart && this.ipStart <= d.ipRangeEnd.pVal||
        d.ipRangeStart.pVal <= this.ipEnd && this.ipEnd <= d.ipRangeEnd.pVal;
}

function getCountries(ipValue: number, zoom: number) {
    let res: string ;
    let ipEnd: IPv4 = new IPv4(ipValue);
    let result: string = "";
    ipEnd = ipEnd.getLastIPMask(zoom * 2);
    let ipValueEnd: number = ipEnd.pVal;

    //let myRange = defaultExport.ipArray.filter(filter, { ipStart: ipValue, ipEnd: ipEnd.pVal });
    //console.log(myRange[0].ipRangeStart);
    
    let idLo = bisectLeft( defaultExport.ipArrayIdx, ipValue ) ;
    let idHi = bisectLeft( defaultExport.ipArrayIdx, ipEnd.pVal ) ;
    
    let myRange = defaultExport.ipArray.slice(idLo,idHi+1);
    
   // console.log(myRange1[0].ipRangeStart);
    
    let countryCode= new Set();
    let countryLabels = new Set();

    myRange.forEach(r => { 
        countryCode.add(r.countryCode);
        countryLabels.add(r.countryLabel);
    });

    if (countryLabels.size === 1){
        res = countryLabels.values().next().value; 
    } else {
        let arrCountryCode = Array.from(countryCode);
        res = arrCountryCode.slice(0,4).join(", ")+(countryCode.size > 4 ? ", "+arrCountryCode[4]+", ...": ""   );
    }
    return res;
}

function getIPFromXYZ(x,y,z){

    let ipval: number = 0;
    let point: { x: number, y: number } = { x: 0, y: 0 };

    for (var i: number = z; i > 0; i--) {

        point.x = x >> (i - 1) & 1;
        point.y = y >> (i - 1) & 1;

        let m: number = point.x | (point.y << 1);
        let n: number = point.x | point.y;

        ipval += m * Math.pow(2, n * (32 - ((z - i + 1) << 1)));

    }
    
    let strip: string = (ipval >> 24 & 255) + "." + (ipval >> 16 & 255) + "." + (ipval >> 8 & 255) + "." + (ipval & 255);
    let myIP: IPv4 = new IPv4(ipval);

    return myIP;
}

router.get("/:z/:x/:y", (req: express.Request, res: express.Response) => {
    const x: number = Number(req.params.x);
    const y: number = Number(req.params.y);
    const z: number = Number(req.params.z);
    
    const file: string = path.join(__dirname, "../tiles_svg/", z + "/" + x + "/" + y);

    res.type("svg");
    if (fs.existsSync(file)) {
        res.sendFile(file);
    } else {

        let myIP: IPv4 = getIPFromXYZ(x,y,z);


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

        // 
        if (z >= 4) {
            // list all Regional Internet Registries where my ip belong
            const myRIRs = defaultExport.ipWhois.filter(filter, { ipStart: myIP.pVal, ipEnd: myIP.getLastIPMask(z * 2).pVal } );
            if (!myRIRs || myRIRs.length === 0){
                console.log("error: whois cannot be found :"+myIP );
            }
            if (myRIRs.length > 1){
                console.log("error: too much values for RIR: "+myRIRs.length);
            }
            let myRIR = myRIRs[0] ;
            
            let date: string = "";
            let designation: string = "";
            let title: string = "";
            
             var getTileInfo ;
             
             if ( z > 6 ) {
                designation =  getCountries(myIP.pVal,z);
                title = myRIR.whois;
                getTileInfo = (ipTile: IPv4, point) => {
                    if (ipTile) {
                        const resWhois = defaultExport.ipWhois.filter(filter, { ipStart: ipTile.pVal, ipEnd: ipTile.getLastIPMask(z * 2).pVal } );
                        let res= {x:point.x, y:point.y, desc:getCountries(ipTile.pVal,z), whois: resWhois[0].whois};
                        return res;
                    } else {
                        return null;
                    }
                };
            } else  {
                date = myRIR.date;
                designation = myRIR.designation;
                title = myRIR.whois;
                getTileInfo = (ipTile: IPv4, point) => {
                    if (ipTile) {
                        const res = defaultExport.ipWhois.filter(filter, { ipStart: ipTile.pVal, ipEnd: ipTile.getLastIPMask(z * 2).pVal } );
                        return {x:point.x, y:point.y, desc:res[0].designation, whois: res[0].whois};
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
            // 
            svgTileContent = tilesvg(strIP, title, designation, date, getXYTile, compareTiles, row);
        } else {

            svgTileContent = tilesvg(strIP, "", "", "", null, null, {x:x, y:y, desc: ""}, "#f0f0f0");
        }

        /*
                // more than one 
                if (myRIRs.length > 1) {
                    
                    let setRIR = new Set();
                    // remove duplicates
                    myRIRs.forEach(r => setRIR.add(r.whois));
                    // concat whois
                    const strRIRlist: string = Array.from(setRIR).join(', ');
                    
                    svgTileContent = tilesvg(strIP, strRIRlist, myCountryList, "", getXYTile, (row1, row2) => row1.desc === row2.desc , {x:x, y:y, desc: myCountryList});
                    
                } else{

                    svgTileContent = tilesvg(strIP, myRIRs[0].whois, myCountryList, "", getXYTile, (row1, row2) => row1.desc === row2.desc , {x:x, y:y, desc: myCountryList});

                }
        */

        let callback = (err) => {
            res.type("svg");
            res.sendFile(file);
        }
        fs.writeFile(file, svgTileContent,callback);
            
    }
});

export default router;