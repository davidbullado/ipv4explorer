import express = require("express");
import path = require("path");
import whois = require('whois');
import dns = require('dns');
import exec = require('child_process');
import {IPv4} from "../ipv4";
import {filterOnIpWhois} from "../build-tiles/ipDetails";
import {IWhois} from "../ip2lite/ip2lite";

const router: express.Router = express.Router();

router.get("/:ip", (req: express.Request, res: express.Response) => {
    let ip = req.params.ip.replace('_-_','/');

    // thanks https://stackoverflow.com/questions/4460586/javascript-regular-expression-to-check-for-ip-addresses
    let ipReg: string = "(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)";
    let fullReg: string = "^" + ipReg + "\." + ipReg + "\." + ipReg + "\." + ipReg + "(/[0-9]{1,2})?$";

    let nsReg: string = "^[a-zA-Z0-9][a-zA-Z0-9-]{1,61}[a-zA-Z0-9](?:\.[a-zA-Z]{2,})+$";

    if ((new RegExp(fullReg)).test(ip)) {
        let iWhois: IWhois[];
        let iprange = IPv4.newIPv4FromRange(ip);
        if (iprange.length == 2) {
            iWhois = filterOnIpWhois(iprange[0], iprange[1]);
        } else {
            let myip = IPv4.newIPv4FromString(ip);
            iWhois = filterOnIpWhois(myip, myip);
        }
        let command: string;
        if (iWhois.length > 0) {
            command = "whois -s "+iWhois[0].host+" "+ip;
        } else {
            command = "whois "+ip;
        }
        exec.exec(command, function(error, stdout, stderr){ 
            res.type("text");
            res.send(stdout);
        });
        /*
        whois.lookup(req.params.ip, function(err, data) {
            res.type("text");
            res.send(data);
        });
        */
    } else if ((new RegExp(nsReg)).test(ip)) {
        dns.lookup(ip, function(err, data) {
            whois.lookup(data, function(err, data) {
                res.type("text");
                res.send(data);
            });
        });
    } else {
        res.status(204).send();
    }
});

export default router;