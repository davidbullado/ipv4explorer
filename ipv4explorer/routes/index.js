"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/*
 * GET home page.
 */
var express = require("express");
var router = express.Router();
router.get('/', function (req, res) {
    res.render('index', { title: 'Express', myip: req.header('x-forwarded-for') || req.connection.remoteAddress });
});
router.get('/ip', function (req, res) {
    // thanks https://www.hacksparrow.com/node-js-get-ip-address.html
    res.send(req.header('x-forwarded-for') || req.connection.remoteAddress);
});
exports.default = router;
//# sourceMappingURL=index.js.map