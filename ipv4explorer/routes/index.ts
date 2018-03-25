/*
 * GET home page.
 */
import express = require('express');
import * as ip2lite from "../ip2lite";
const router = express.Router();

router.get('/', (req: express.Request, res: express.Response) => {

    let renderIndex = () => res.render('index', { title: 'Express', myip: req.header('x-forwarded-for') || req.connection.remoteAddress });

    if (!ip2lite.default.ipArray) {
        ip2lite.start(renderIndex);
        
    } else {
        //res.render('index', { title: 'Express', myip: req.header('x-forwarded-for') || req.connection.remoteAddress });
        renderIndex();
    }

    
});

router.get('/ip', (req: express.Request, res: express.Response) => {
    // thanks https://www.hacksparrow.com/node-js-get-ip-address.html
    res.send(req.header('x-forwarded-for') || req.connection.remoteAddress);
});

export default router;