/*
 * GET home page.
 */
import express = require('express');

const router = express.Router();


function myIp(req) {
    const ips = req.header('x-forwarded-for') ;
    const tabIp = ips ? ips.split(', ') : [] ;
    for (let i=0; i < tabIp.length; i++){
        if (req.header('x-real-ip') !== tabIp[i]) {
            return tabIp[i] ;
        }
    }
    return req.connection.remoteAddress;
}


router.get('/', (req: express.Request, res: express.Response) => {
    /*
    let renderIndex = () => res.render('index', { title: 'IPv4 Explorer', myip: req.header('x-forwarded-for') || req.connection.remoteAddress });

    if (!ip2lite.default.ipArray) {
        ip2lite.start(renderIndex);
        
    } else {
        //res.render('index', { title: 'Express', myip: req.header('x-forwarded-for') || req.connection.remoteAddress });
        renderIndex();
    }
    */
    res.render('index', { title: 'IPv4', myip: myIp(req)});
    
});

router.get('/@zoom=:zoom&ip=:ip', (req: express.Request, res: express.Response) => {
    var ip = req.params.ip;
    var zoom = req.params.zoom;
    console.log("zoom: "+zoom);
    res.render('index', { title: 'IPv4 '+ip, myip: ip, zoomlevel:zoom});
});

router.get('/ip', (req: express.Request, res: express.Response) => {
    // thanks https://www.hacksparrow.com/node-js-get-ip-address.html
    console.log(JSON.stringify(req.headers));
    res.send(myIp(req));
});

export default router;