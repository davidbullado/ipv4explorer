/*
 * GET tiles listing.
 */


import express = require("express");
import fs = require("fs");
import path = require("path");
import { tileConstruct} from "../build-tiles/tilesvg";
import { IDataIP, ip2lite } from "../ip2lite";
import { IPv4, getIPFromXYZ } from "../ipv4/index";
import { objectTypeAnnotation } from "babel-types";

const router: express.Router = express.Router();


function buildTileSVG (x: number, y: number, z: number) {
    const myIP: IPv4 = getIPFromXYZ(x, y, z);

    let svgTileContent;

    let tile = tileConstruct( {x, y, z});

    svgTileContent = `<?xml version="1.0" standalone="no"?>
<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" 
  "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">

<svg width="256px" height="256px" version="1.1"
     viewBox="0 0 256 256" preserveAspectRatio="none"
     xmlns="http://www.w3.org/2000/svg" shape-rendering="geometricPrecision">
  <defs>
  <style type="text/css">
    <![CDATA[
    text {
      font-family: "Open Sans",arial,x-locale-body,sans-serif;
    
    }
    line{
      stroke: black;
      stroke-width: 1;
    }
    circle{
      fill: black;
    }
    ]]>
  </style>
  </defs>
  ${tile.svg}
</svg>
`;

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
