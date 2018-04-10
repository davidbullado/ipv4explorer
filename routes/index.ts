/*
 * GET home page.
 */
import express = require('express');

const router = express.Router();

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
    res.render('index', { title: 'IPv4', myip: req.header('x-real-ip') || req.connection.remoteAddress });
    
});

router.get('/ip', (req: express.Request, res: express.Response) => {
    // thanks https://www.hacksparrow.com/node-js-get-ip-address.html
    console.log(JSON.stringify(req.headers));
    res.send(req.header('x-real-ip') || req.connection.remoteAddress);
});

export default router;