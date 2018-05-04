"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var debug = require("debug");
var express = require("express");
var path = require("path");
var index_1 = require("./routes/index");
var tiles_1 = require("./routes/tiles");
var whois_1 = require("./routes/whois");
var ip2lite_1 = require("./ip2lite");
//Load data from csv
ip2lite_1.loadData();
var app = express();
// view engine setup
app.set('views', path.join(__dirname, 'client/views'));
app.set('view engine', 'pug');
app.use(express.static(path.join(__dirname, 'dist')));
app.use('/', index_1.default);
app.use('/tiles', tiles_1.default);
app.use('/whois', whois_1.default);
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
    app.use(function (err, req, res, next) {
        res.status(err['status'] || 500);
        res.render('error', {
            message: err.message,
            error: err
        });
    });
}
// production error handler
// no stacktraces leaked to user
app.use(function (err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
        message: err.message,
        error: {}
    });
});
app.set('port', process.env.PORT || 3000);
var server = app.listen(app.get('port'), '127.0.0.1', null, function () {
    debug('Express server listening on port ' + server.address().port);
});
//# sourceMappingURL=app.js.map