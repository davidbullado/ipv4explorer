/*
 * GET home page.
 */
import express = require('express');
const router = express.Router();

router.get('/', (req: express.Request, res: express.Response) => {
    res.render('index', { title: 'Express', myip: req.header('x-forwarded-for') || req.connection.remoteAddress });
});

router.get('/ip', (req: express.Request, res: express.Response) => {
    // thanks https://www.hacksparrow.com/node-js-get-ip-address.html
    res.send(req.header('x-forwarded-for') || req.connection.remoteAddress)
})

export default router;