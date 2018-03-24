/*
 * GET tiles listing.
 */
import express = require('express');
import text2png = require('../text2png/index.js');

const router = express.Router();

router.get('/:z/:x/:y', (req: express.Request, res: express.Response) => {
    const x: number = Number(req.params.x);
    const y: number = Number(req.params.y);
    const z: number = Number(req.params.z);

    res.type('png');
  
    let ipval = 0;
    let point = { x: 0, y: 0 };
 
    for (var i = z; i > 0; i--) {
   
        point.x = x >> (i - 1) & 1;
        point.y = y >> (i - 1) & 1;
  
        let m = point.x | (point.y << 1);
        let n = point.x | point.y;
  
        ipval += m << n * (32 - ((z - i + 1) << 1));
   
    }
    
    let strip = (ipval >> 24 & 255) + "." + (ipval >> 16 & 255) + "." + (ipval >> 8 & 255) + "." + (ipval & 255) + "/" + (z * 2);

    res.send(text2png(strip, { color: 'dark', width: 256, height: 256, borderWidth: 1, borderColor: 'gray', lineSpacing: 13, padding:7 }));

});

export default router;