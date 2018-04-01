/*global http*/
var request = require('sync-request');
var d3 = require("d3-dsv");
var fs = require("fs");
var tileConstruct = require("./tilesvg.js");
var IPv4 = require("../ipv4").default;
//var svg_to_png = require('svg-to-png');

var buf = fs.readFileSync("./ipv4-address-space.csv");
var processRow = (row) => {
    var extractDigit = new RegExp(/0*(\d+)/) ;
    var r = extractDigit.exec(row.Prefix);
    if (!r || r.length != 2){
        throw new Error("format error column prefix: "+row.Prefix);
    }
    var ip = r[1]+".0.0.0";

    var whois = "";
    if (row.WHOIS.length > 0) {
        var extractWhois = new RegExp(/whois\.([a-z]+)\./);
        var resWhois = extractWhois.exec(row.WHOIS);
        if (!resWhois || resWhois.length != 2){
            throw new Error("format error column WHOIS: "+row.WHOIS);
        }
        whois = resWhois[1].toUpperCase();
    }
    
    // we want to convert ip into coordinates
    var myip = IPv4.newIPv4FromString(ip);
    var dividby = Math.pow(2,12);
    var x = myip.point.x / dividby;
    var y = myip.point.y / dividby;

    if (!fs.existsSync('../tiles/4')) {
        fs.mkdirSync('../tiles/4');
    }
    if (!fs.existsSync(`../tiles/4/${x}`)) {
        fs.mkdirSync(`../tiles/4/${x}`);
    }
    
    var filename = `../tiles/4/${x}/${y}`;

    fs.writeFileSync(filename,tileConstruct(ip,whois,row.Designation,row.Date));


    return filename ;


    /*return {
        ip: ip,
        designation: row.Designation,
        date: row.Date,
        whois: whois
    };*/
};
var result = d3.csvParse(buf.toString(), processRow );
console.log(result[0])

/*
var sync = 0 ;


for (var i=9; i < 10; i++){
    var z = i+1;
    var max = Math.pow(2,z);
    
    for (var y=658; y < max ; y++){
        for (var x=0; x < max ; x++){
  
            console.log ('/tiles/'+z+"/"+x+"/"+y);
            
            var res = request('GET', 'http://127.0.0.1:3000'+'/tiles/'+z+"/"+x+"/"+y);
         
        }
    }
}
*/