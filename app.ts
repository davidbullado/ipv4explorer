import http2 = require('spdy');
import debug = require("debug");
import express = require("express");
import path = require("path");
import fs = require('fs');

import routes from "./routes/index";
import tiles from "./routes/tiles";
import whois from "./routes/whois";
import nslookup from "./routes/nslookup";

import {loadData} from "./ip2lite";
import { AddressInfo } from 'net';


//Load data from csv
loadData() ;

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'client/views'));
app.set('view engine', 'pug');

app.use(express.static(path.join(__dirname, 'dist')));

app.use('/', routes);
app.use('/tiles', tiles);
app.use('/whois', whois);
app.use('/nslookup', nslookup);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
    var err = new Error('Not Found');
    err['status'] = 404;
    next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
    app.use((err: any, req, res, next) => {
        res.status(err['status'] || 500);
        res.render('error', {
            message: err.message,
            error: err
        });
    });
}

// production error handler
// no stacktraces leaked to user
app.use((err: any, req, res, next) => {
    res.status(err.status || 500);
    res.render('error', {
        message: err.message,
        error: {}
    });
});



var options = {
    key: fs.readFileSync('./server.key'),
    cert: fs.readFileSync('./server.crt')
  }
/*http2
  .createServer(options, app)
  .listen(3000, ()=>{
    debug('Express server listening on port 3000');
  }
)*/

    app.set('port', process.env.PORT || 3000);

    var server = app.listen(app.get('port'), '127.0.0.1', null, function () {
        const { port } = server.address() as AddressInfo;
        debug('Express server listening on port ' + port);
    });
