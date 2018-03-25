import { csvParseRows } from "d3-dsv";
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
let ip2lite: {
    ipArray: IDataIP[]
} = { ipArray: null };

console.log("Prepare fetching " + urlLoc);

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

            ip2lite.ipArray = ip2lite.ipArray.filter(value => {
                return value.countryCode != "-";
            });

            console.log("Successfully fetched elements: "+ip2lite.ipArray.length);
            callback();
        });
}

export default ip2lite;