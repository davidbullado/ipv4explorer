import express = require("express");
import path = require("path");
import whois = require('whois');
import dns = require('dns');
import exec = require('child_process');

const router: express.Router = express.Router();

router.get("/:ip", (req: express.Request, res: express.Response) => {
    
    // thanks https://stackoverflow.com/questions/4460586/javascript-regular-expression-to-check-for-ip-addresses
    let ipReg: string = "(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)";
    let fullReg: string = "^" + ipReg + "\." + ipReg + "\." + ipReg + "\." + ipReg + "$";

    let nsReg: string = "^[a-zA-Z0-9][a-zA-Z0-9-]{1,61}[a-zA-Z0-9](?:\.[a-zA-Z]{2,})+$";

    if ((new RegExp(fullReg)).test(req.params.ip)) {
        let command = "whois "+req.params.ip;
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
    } else if ((new RegExp(nsReg)).test(req.params.ip)) {
        dns.lookup(req.params.ip, function(err, data) {
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