"use strict";
/*
 * GET tiles listing.
 */
Object.defineProperty(exports, "__esModule", { value: true });
var express = require("express");
var tilesvg_1 = require("../build-tiles/tilesvg");
var index_1 = require("../ipv4/index");
var router = express.Router();
function buildTileSVG(x, y, z) {
    var myIP = index_1.getIPFromXYZ(x, y, z);
    var svgTileContent;
    svgTileContent = tilesvg_1.tileConstruct({ x: x, y: y, z: z });
    return svgTileContent;
}
router.get("/:z/:x/:y", function (req, res) {
    var x = Number(req.params.x);
    var y = Number(req.params.y);
    var z = Number(req.params.z);
    res.type("svg");
    res.send(buildTileSVG(x, y, z));
});
exports.default = router;
//# sourceMappingURL=tiles.js.map