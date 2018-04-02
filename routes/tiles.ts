/*
 * GET tiles listing.
 */
import express = require("express");
import defaultExport from "../ip2lite";
import fs = require('fs');
import IPv4 from "../ipv4/index";
import path = require("path");
import tilesvg = require("../build-tiles/tilesvg.js");

const router: express.Router = express.Router();

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

function getCountries(ipValue: number, zoom: number) {
    let ipEnd: IPv4 = new IPv4(ipValue);
    let result: string = "";
    ipEnd = ipEnd.getLastIPMask(zoom * 2);

    let myRange = defaultExport.ipArray.filter(filter, { ipStart: ipValue, ipEnd: ipEnd.pVal }); // d => d.ipRangeStart.pVal <= ipval && ipEnd.pVal <= d.ipRangeEnd.pVal
    let countries = new Set();
    if (zoom === 16){
        myRange.forEach(r => countries.add(r.countryLabel));
    }   else {
        myRange.forEach(r => countries.add(r.countryCode));
    }
    
    return Array.from(countries).join(", ");
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
    console.log("Request: "+file);

    function getXYTile(point){
        let myip: IPv4 = getIPFromXYZ(point.x,point.y,z);
        if (myip) {

            const res = defaultExport.ipWhois.filter(filter, { ipStart: myip.pVal, ipEnd: myip.getLastIPMask(z * 2).pVal } );
            let whoistxt: string = "";
            if (res && res.length > 0){
                let whois = new Set();
                res.forEach(r => whois.add(r.whois));
                whoistxt = Array.from(whois).join(',');
            }
            return {x:point.x, y:point.y, desc:getCountries(myip.pVal,z), whois: whoistxt};
        } else {
            return null;
        }
        
    }
    function compareTo (row1, row2) {
        return row1.desc === row2.desc
    }
    res.type("svg");
    if (z===4){
        console.log("found: "+file)
        res.sendFile(file);
    } else {
        
        let myIP: IPv4 = getIPFromXYZ(x,y,z);
        let myCountryList: string = getCountries(myIP.pVal,z);

        let strip: string = myIP.toString();
        // single ip scale
        if (z === 16) {
    
        } else {
            strip += "/" + (z * 2) + "\n";
        }

        let folder = path.join(__dirname, "../tiles_svg");
        if (!fs.existsSync(folder)) {
            console.log("Create folder: "+folder);
            fs.mkdirSync(folder);
        }
        folder = path.join(__dirname, "../tiles_svg/", "" + z);
        if (!fs.existsSync(folder)) {
            console.log("Create folder: "+folder);
            fs.mkdirSync(folder);
        }
        folder += "/" + x;
        if (!fs.existsSync(folder)) {
            console.log("Create folder: "+folder);
            fs.mkdirSync(folder);
        }
    

        //getXYTile : pour un x et y donné, retourne une row (contient x, y + infos discriminantes)
        // x et y, quelle ip sachant z ?
        // ip + range
        // filter
        
        // (ip, whois, designation, date, getXYTile, compareTo, row)
        console.log("Build tile "+strip);

        const reswhois = defaultExport.ipWhois.filter(filter, { ipStart: myIP.pVal, ipEnd: myIP.getLastIPMask(z * 2).pVal } );
       if (!reswhois || reswhois.length === 0){
        console.log("error: whois cannot be found :"+myIP )
       }
        let data;
        if (reswhois.length > 1) {
                let whoistxt:string = "";
                let whois = new Set();
                reswhois.forEach(r => whois.add(r.whois));
                whoistxt = Array.from(whois).join(',');
            data = tilesvg(strip,whoistxt,myCountryList,"",getXYTile,compareTo, {x:x, y:y, desc: myCountryList});
        } else{
            data = tilesvg(strip,reswhois[0].whois,myCountryList,"",getXYTile,compareTo, {x:x, y:y, desc: myCountryList});
        }
        let callback = (err) => {
            res.type("svg");
            res.sendFile(file);
        }
        fs.writeFile(file, data,callback);
            
    }
});

export default router;