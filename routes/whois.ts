import express = require("express");
import path = require("path");
import whois = require('whois');

const router: express.Router = express.Router();

router.get("/:ip", (req: express.Request, res: express.Response) => {
    
    // thanks https://stackoverflow.com/questions/4460586/javascript-regular-expression-to-check-for-ip-addresses
    let ipReg: string = "(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)";
    let fullReg: string = "^" + ipReg + "\." + ipReg + "\." + ipReg + "\." + ipReg + "$";

    if (!(new RegExp(fullReg)).test(req.params.ip)) {
        res.status(204).send();
    } else {
        whois.lookup(req.params.ip, function(err, data) {
            res.type("text");
            res.send(data);
        });
    }
});

export default router;