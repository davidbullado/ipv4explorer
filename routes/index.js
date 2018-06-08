"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/*
 * GET home page.
 */
var express = require("express");
var router = express.Router();
function myIp(req) {
    var ips = req.header('x-forwarded-for');
    var tabIp = ips.split(', ');
    for (var i = 0; i < tabIp.length; i++) {
        if (req.header('x-real-ip') !== tabIp[i]) {
            return tabIp[i];
        }
    }
    return req.connection.remoteAddress;
}
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
    res.render('index', { title: 'IPv4', myip: myIp(req) });
});
router.get('/ip', function (req, res) {
    // thanks https://www.hacksparrow.com/node-js-get-ip-address.html
    console.log(JSON.stringify(req.headers));
    res.send(myIp(req));
});
exports.default = router;
//# sourceMappingURL=index.js.map