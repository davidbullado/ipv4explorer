/*
 * GET tiles listing.
 */

import express = require("express");
import {getXYZTileInfo} from "../build-tiles/tilesvg";


const router: express.Router = express.Router();

function retrieveDetails (x: number, y: number, z: number) {
    return getXYZTileInfo({x, y, z});
}

router.get("/:x/:y/:z", (req: express.Request, res: express.Response) => {
    let x: number = Number(req.params.x);
    let y: number = Number(req.params.y);
    const z: number = Number(req.params.z);
    let alpha = Math.pow(2,(2+Math.floor(z/2)));
    x = Math.floor((x/65535)*alpha);
    y = Math.floor((y/65535)*alpha);
    res.type("text/javascript");
    res.send(retrieveDetails (x, y, z));
});

export default router;
