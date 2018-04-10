"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/*
 * GET home page.
 */
var express = require("express");
var router = express.Router();
router.get('/', function (req, res) {
    /*
    let renderIndex = () => res.render('index', { title: 'IPv4 Explorer', myip: req.header('x-forwarded-for') || req.connection.remoteAddress });

    if (!ip2lite.default.ipArray) {
        ip2lite.start(renderIndex);
        
    } else {
        //res.render('index', { title: 'Express', myip: req.header('x-forwarded-for') || req.connection.remoteAddress });
        renderIndex();
    }
    */
    res.render('index', { title: 'IPv4', myip: req.header('x-real-ip') || req.connection.remoteAddress });
});
router.get('/ip', function (req, res) {
    // thanks https://www.hacksparrow.com/node-js-get-ip-address.html
    console.log(JSON.stringify(req.headers));
    res.send(req.header('x-real-ip') || req.connection.remoteAddress);
});
exports.default = router;
//# sourceMappingURL=index.js.map