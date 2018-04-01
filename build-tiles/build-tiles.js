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

    // we want to convert ip into coordinates:
    var myip = IPv4.newIPv4FromString(ip);
    // we have to scale to zoom 4, i.e. divide by 2^12.
    // (because point.x E [0, 2^16], and we want x E [0, 2^4])
    var x = myip.point.x / 0x1000; // 0x1000 = 2^12
    var y = myip.point.y / 0x1000;

    return {
        ip: ip,
        whois: whois,
        designation: row.Designation,
        date: row.Date,
        x: x,
        y: y
    };
};
var result = d3.csvParse(buf.toString(), processRow );

function findXY (row) {
    return row.x === this.x && row.y === this.y;
}
function compareTo (row1, row2) {
    return row1.whois === row2.whois && row1.designation === row2.designation
}


result.forEach(function(row) {

    var myNeighbors = [
        [null,null,null],
        [null,null,null],
        [null,null,null]
    ]
    var myNeighborsEquals = [
        [false,false,false],
        [false,false,false],
        [false,false,false]
    ];

    for (var y=-1; y <= 1 ; y++){
        for (var x=-1; x <= 1; x++){
            var neighborTile = result.find(findXY,{x: row.x+x, y: row.y+y});
            // store neighbors reference
            myNeighbors[y+1][x+1] = neighborTile;
            // If neighbor shares the same whois
            if (neighborTile && compareTo (neighborTile, row)){
                myNeighborsEquals[y+1][x+1] = true; 
            }
        }
    }
    var nbTop = myNeighbors[0][1];
    var nbRight = myNeighbors[1][2];
    var nbBot = myNeighbors[2][1];
    var nbLeft = myNeighbors[1][0];

    var nbEqualsBtwThem = {
        topRigth: "",
        rigthBot: "",
        botLeft: "",
        leftTop: ""
    }

    if (nbTop && nbRight && compareTo (nbTop,nbRight)){
        nbEqualsBtwThem.topRigth = nbTop.whois;
    }
    if (nbRight && nbBot && compareTo (nbRight,nbBot)){
        nbEqualsBtwThem.rigthBot = nbRight.whois;
    }
    if (nbBot && nbLeft && compareTo (nbBot,nbLeft)){
        nbEqualsBtwThem.botLeft = nbBot.whois;
    }
    if (nbLeft && nbTop && compareTo (nbLeft,nbTop)){
        nbEqualsBtwThem.leftTop = nbLeft.whois;
    }

    if (!fs.existsSync('../tiles/4')) {
        fs.mkdirSync('../tiles/4');
    }
    if (!fs.existsSync(`../tiles/4/${row.x}`)) {
        fs.mkdirSync(`../tiles/4/${row.x}`);
    }
    
    var filename = `../tiles/4/${row.x}/${row.y}`;

    fs.writeFileSync(filename,tileConstruct(row.ip,row.whois,row.designation,row.date,myNeighborsEquals,nbEqualsBtwThem));

  });

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