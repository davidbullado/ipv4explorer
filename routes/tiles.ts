/*
 * GET tiles listing.
 */


import express = require("express");
import fs = require("fs");
import path = require("path");
import { tileConstruct } from "../build-tiles/tilesvg";
import { IDataIP, ip2lite } from "../ip2lite";
import { IPv4, getIPFromXYZ } from "../ipv4/index";
import { objectTypeAnnotation } from "babel-types";

const router: express.Router = express.Router();

function buildTileSVG (x: number, y: number, z: number) {
    const myIP: IPv4 = getIPFromXYZ(x, y, z);

    let svgTileContent;

    svgTileContent = tileConstruct( {x, y, z});

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
