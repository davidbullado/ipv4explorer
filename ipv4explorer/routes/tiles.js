"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/*
 * GET tiles listing.
 */
var express = require("express");
var text2png = require("../text2png/index.js");
var router = express.Router();
router.get('/:z/:x/:y', function (req, res) {
    var x = Number(req.params.x);
    var y = Number(req.params.y);
    var z = Number(req.params.z);
    res.type('png');
    var ipval = 0;
    var point = { x: 0, y: 0 };
    for (var i = z; i > 0; i--) {
        point.x = x >> (i - 1) & 1;
        point.y = y >> (i - 1) & 1;
        var m = point.x | (point.y << 1);
        var n = point.x | point.y;
        ipval += m << n * (32 - ((z - i + 1) << 1));
    }
    var strip = (ipval >> 24 & 255) + "." + (ipval >> 16 & 255) + "." + (ipval >> 8 & 255) + "." + (ipval & 255) + "/" + (z * 2);
    res.send(text2png(strip, { color: 'dark', width: 256, height: 256, borderWidth: 1, borderColor: 'gray', lineSpacing: 13, padding: 7 }));
});
exports.default = router;
//# sourceMappingURL=tiles.js.map