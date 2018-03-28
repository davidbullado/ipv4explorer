/*
 * GET tiles listing.
 */
import express = require("express");
import text2png = require("../text2png/index.js");
import defaultExport from "../ip2lite";
import fs = require('fs');
import IPv4 from "../ipv4/index";
import path = require("path");

const router: express.Router = express.Router();

router.get("/:z/:x/:y", (req: express.Request, res: express.Response) => {
    const x: number = Number(req.params.x);
    const y: number = Number(req.params.y);
    const z: number = Number(req.params.z);

    const file: string = path.join(__dirname, "../tiles/", z + "/" + x + "/" + y);

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

    if (fs.existsSync(file)) {
        res.type("png");
        res.sendFile(file);
    }
    else {
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

        // single ip scale
        if (z === 16) {
            strip += "\n";
            let myRange = defaultExport.ipArray.filter(filterBetween, { value: ipval });
            if (myRange && myRange[0]) {
                strip += myRange[0].countryLabel;
            }

        } else {
            strip += "/" + (z * 2) + "\n";

            let ipEnd: IPv4 = new IPv4(ipval);
            ipEnd = ipEnd.getLastIPMask(z * 2);

            let myRange = defaultExport.ipArray.filter(filter, { ipStart: ipval, ipEnd: ipEnd.pVal }); // d => d.ipRangeStart.pVal <= ipval && ipEnd.pVal <= d.ipRangeEnd.pVal

            if (myRange && myRange.length > 0) {
                if (myRange.length === 1) {
                    strip += "\n";
                    strip += myRange[0].countryLabel;
                } else {
                    let countries = new Set();
                    myRange.forEach(r => countries.add(r.countryCode));

                    Array.from(countries).forEach((c, i, arr) => {

                        if (i == 9 && arr.length > 10) {
                            strip += "...";
                        } else if (i > 9 && arr.length > 10) {
                        } else if (i === arr.length - 1) { // last line
                            strip += c;
                        } else {
                            if (i % 5 === 0) {
                                strip += "\n";
                            }
                            strip += c + ", ";
                        }

                    });
                }
            }
        }

        let folder = path.join(__dirname, "../tiles/", "" + z);
        if (!fs.existsSync(folder)) {
            fs.mkdirSync(folder);
        }
        folder += "/" + x;
        if (!fs.existsSync(folder)) {
            fs.mkdirSync(folder);
        }
        let callback = (err) => {
            res.type("png");
            res.sendFile(file);
        }
        let data = text2png(strip, { color: "dark", width: 256, height: 256, borderWidth: 1, borderColor: "gray", lineSpacing: 13, padding: 7, font: '20px sans-serif' });
        fs.writeFile(file, data,callback);
    }
 
});

export default router;