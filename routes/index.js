"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/*
 * GET home page.
 */
var express = require("express");
var ip2lite = require("../ip2lite");
var router = express.Router();
router.get('/', function (req, res) {
    var renderIndex = function () { return res.render('index', { title: 'IPv4 Explorer', myip: req.header('x-forwarded-for') || req.connection.remoteAddress }); };
    if (!ip2lite.default.ipArray) {
        ip2lite.start(renderIndex);
    }
    else {
        //res.render('index', { title: 'Express', myip: req.header('x-forwarded-for') || req.connection.remoteAddress });
        renderIndex();
    }
});
router.get('/ip', function (req, res) {
    // thanks https://www.hacksparrow.com/node-js-get-ip-address.html
    res.send(req.header('x-forwarded-for') || req.connection.remoteAddress);
});
exports.default = router;
//# sourceMappingURL=index.js.map