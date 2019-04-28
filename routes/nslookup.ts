import express = require("express");
import path = require("path");
import dns = require('dns');

const router: express.Router = express.Router();

router.get("/:ns", (req: express.Request, res: express.Response) => {
    
    let nsReg: string = "^[a-zA-Z0-9][a-zA-Z0-9-]{1,61}[a-zA-Z0-9](?:\.[a-zA-Z]{2,})+$";

    if ((new RegExp(nsReg)).test(req.params.ns)) {
        dns.lookup(req.params.ns, function(err, data) {
            res.type("text");
            res.send(data);
        });
    } else {
        res.status(204).send();
    }
});

export default router;