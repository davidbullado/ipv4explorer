"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function getColorFromWhois(whois, designation) {
    if (!designation || designation === "") {
        designation = "void";
    }
    var fillRect = "";
    switch (whois) {
        case 'IANA':
            fillRect = "#f0f0f0";
            break;
        case 'APNIC':
            fillRect = "#FFDDDD";
            break;
        case 'RIPE':
            fillRect = "#BCD9D9";
            break;
        case 'AFRINIC':
            fillRect = "#CCECCC";
            break;
        case 'ARIN':
            fillRect = "#FFECDD";
            break;
        case 'LACNIC':
            fillRect = "#C9BAD7";
            break;
        default:
            fillRect = "#FFFFFF";
    }
    fillRect = colorObjectToString(meanColor(colorStringToObject(fillRect), stringToColour(designation)));
    return fillRect;
}
function colorStringToObject(colorStr) {
    return {
        r: parseInt("0x" + colorStr.substr(1, 2)),
        g: parseInt("0x" + colorStr.substr(3, 2)),
        b: parseInt("0x" + colorStr.substr(5, 2))
    };
}
function meanColor(c1, c2) {
    return {
        r: Math.round(Math.sqrt((c1.r * c1.r * 0.9 + c2.r * c2.r * 0.1))),
        g: Math.round(Math.sqrt((c1.g * c1.g * 0.9 + c2.g * c2.g * 0.1))),
        b: Math.round(Math.sqrt((c1.b * c1.b * 0.9 + c2.b * c2.b * 0.1)))
    };
}
function colorObjectToString(colorObj) {
    return "#" + ("00" + colorObj.r.toString(16)).slice(-2) + ("00" + colorObj.g.toString(16)).slice(-2) + ("00" + colorObj.b.toString(16)).slice(-2);
}
var stringToColour = function (str) {
    var hash = 0;
    for (var i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    return {
        r: hash & 0xff,
        g: (hash >> 8) & 0xff,
        b: (hash >> 16) & 0xff
    };
};
// function tileConstruct (ip, whois, designation, date, getXYTile, compareTo, row, colorRect) {
function tileConstruct(ip, getXYTile, compareTo, coord, colorRect) {
    var fillRect;
    var whois = "";
    var designation = "";
    var date = "";
    var currentTile;
    if (getXYTile) {
        currentTile = getXYTile(coord);
        whois = currentTile.whois;
        designation = currentTile.desc;
        date = currentTile.date;
    }
    if (colorRect) {
        fillRect = colorRect;
    }
    else {
        fillRect = getColorFromWhois(whois, designation);
    }
    var join = "";
    var rect = {
        x: 3,
        y: 3,
        width: 250,
        height: 250
    };
    if (getXYTile && compareTo) {
        var myNeighbors = [
            [null, null, null],
            [null, null, null],
            [null, null, null]
        ];
        var myNeighborsEquals = [
            [false, false, false],
            [false, false, false],
            [false, false, false]
        ];
        for (var y = -1; y <= 1; y++) {
            for (var x = -1; x <= 1; x++) {
                if (y === 0 && x === 0) {
                    continue;
                }
                var neighborTile = getXYTile({ x: currentTile.x + x, y: currentTile.y + y });
                // store neighbors reference
                myNeighbors[y + 1][x + 1] = neighborTile;
                // If neighbor shares the same whois
                if (neighborTile && compareTo(neighborTile, currentTile)) {
                    myNeighborsEquals[y + 1][x + 1] = true;
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
        };
        if (nbTop && nbRight && compareTo(nbTop, nbRight)) {
            nbEqualsBtwThem.topRigth = nbTop.whois;
        }
        if (nbRight && nbBot && compareTo(nbRight, nbBot)) {
            nbEqualsBtwThem.rigthBot = nbRight.whois;
        }
        if (nbBot && nbLeft && compareTo(nbBot, nbLeft)) {
            nbEqualsBtwThem.botLeft = nbBot.whois;
        }
        if (nbLeft && nbTop && compareTo(nbLeft, nbTop)) {
            nbEqualsBtwThem.leftTop = nbLeft.whois;
        }
        // right
        if (myNeighborsEquals[1][2]) {
            rect.width += 15;
        }
        // left
        if (myNeighborsEquals[1][0]) {
            rect.x -= 15;
            rect.width += 15;
        }
        // top
        if (myNeighborsEquals[0][1]) {
            rect.y -= 15;
            rect.height += 15;
        }
        // bottom
        if (myNeighborsEquals[2][1]) {
            rect.height += 15;
        }
        // left top
        if (myNeighborsEquals[0][0]) {
            join += "\n      <rect x=\"0\" y=\"0\" width=\"18\" height=\"18\" fill=\"" + fillRect + "\" />\n      <circle cx=\"-18\" cy=\"18\" r=\"21\" fill=\"white\" />\n      <circle cx=\"18\" cy=\"-18\" r=\"21\" fill=\"white\" />\n      ";
        }
        // right bottom
        if (myNeighborsEquals[2][2]) {
            join += "\n      <rect x=\"238\" y=\"238\" width=\"18\" height=\"18\" fill=\"" + fillRect + "\" />\n      <circle cx=\"238\" cy=\"274\" r=\"21\" fill=\"white\" />\n      <circle cx=\"274\" cy=\"238\" r=\"21\" fill=\"white\" />\n      ";
        }
        // if current tile equals its top right neighbor,
        if (myNeighborsEquals[0][2]) {
            join += "\n      <rect x=\"238\" y=\"0\" width=\"18\" height=\"18\" fill=\"" + fillRect + "\" />\n      <circle cx=\"238\" cy=\"-18\" r=\"21\" fill=\"white\" />\n      <circle cx=\"274\" cy=\"18\" r=\"21\" fill=\"white\" />\n      ";
        }
        // bottom left
        if (myNeighborsEquals[2][0]) {
            join += "\n      <rect x=\"0\" y=\"238\" width=\"18\" height=\"18\" fill=\"" + fillRect + "\" />\n      <circle cx=\"-18\" cy=\"238\" r=\"21\" fill=\"white\" />\n      <circle cx=\"18\" cy=\"274\" r=\"21\" fill=\"white\" />\n      ";
        }
        // Left top
        if (!myNeighborsEquals[0][0] && nbEqualsBtwThem.leftTop.length > 0) {
            join += "\n      <polygon points=\"0,0 6,0 0,6\" fill=\"" + getColorFromWhois(nbEqualsBtwThem.leftTop, designation) + "\" />\n      ";
        }
        // Right bottom
        if (!myNeighborsEquals[2][2] && nbEqualsBtwThem.rigthBot.length > 0) {
            join += "\n      <polygon points=\"256,256 250,256 256,250\" fill=\"" + getColorFromWhois(nbEqualsBtwThem.rigthBot, designation) + "\" />\n      ";
        }
        // cross : patch with triangle
        if (myNeighborsEquals[2][0] && nbEqualsBtwThem.botLeft.length > 0) {
            join += "\n      <polygon points=\"0,256 0,250 6,256\" fill=\"" + getColorFromWhois(nbEqualsBtwThem.botLeft, designation) + "\" />\n      ";
        }
        else {
            if (nbEqualsBtwThem.botLeft.length > 0) {
                join += "\n        <rect x=\"0\" y=\"250\" width=\"6\" height=\"6\" fill=\"" + getColorFromWhois(nbEqualsBtwThem.botLeft, designation) + "\" />\n        <circle cx=\"18\" cy=\"238\" r=\"21\" fill=\"white\" />\n        ";
            }
        }
        // cross : patch with triangle
        if (myNeighborsEquals[0][2] && nbEqualsBtwThem.topRigth.length > 0) {
            join += "\n      <polygon points=\"256,0 250,0 256,6\" fill=\"" + getColorFromWhois(nbEqualsBtwThem.topRigth, designation) + "\" />\n      ";
        }
        else {
            // otherwise, top and rigth are equal
            if (nbEqualsBtwThem.topRigth.length > 0) {
                join += "\n        <rect x=\"250\" y=\"0\" width=\"6\" height=\"6\" fill=\"" + getColorFromWhois(nbEqualsBtwThem.topRigth, designation) + "\" />\n        <circle cx=\"238\" cy=\"18\" r=\"21\" fill=\"white\" />\n        ";
            }
        }
    }
    return "<?xml version=\"1.0\" standalone=\"no\"?>\n<!DOCTYPE svg PUBLIC \"-//W3C//DTD SVG 1.1//EN\" \n  \"http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd\">\n\n<svg width=\"256px\" height=\"256px\" version=\"1.1\"\n     viewBox=\"0 0 256 256\" preserveAspectRatio=\"none\"\n     xmlns=\"http://www.w3.org/2000/svg\">\n  <defs>\n    <style type=\"text/css\">\n    <![CDATA[\n    text {\n      font-family: \"Open Sans\",arial,x-locale-body,sans-serif;\n      fill: #555;\n    }\n    ]]>\n  </style>\n  </defs>\n\n  " + join + "\n\n  <rect x=\"" + rect.x + "\" y=\"" + rect.y + "\" width=\"" + rect.width + "\" height=\"" + rect.height + "\" \n          rx=\"15\" ry=\"15\" fill=\"" + fillRect + "\" />\n  <text text-anchor=\"middle\" x=\"128\" y=\"64\" font-size=\"22\"  >\n    " + whois + "\n  </text>\n  <text text-anchor=\"middle\" x=\"128\" y=\"132\" font-size=\"25\" >\n    " + ip + "\n  </text>\n  <text text-anchor=\"middle\" x=\"128\" y=\"190\" font-size=\"13\" >\n  <![CDATA[" + designation + "]]>\n  </text>\n  <text text-anchor=\"end\" x=\"240\" y=\"240\" font-size=\"16\" >\n    " + date + "\n  </text>\n  <path stroke-dasharray=\"4,4\" d=\"M255 0 l0 255\" stroke=\"white\" fill=\"none\" />\n  <path stroke-dasharray=\"4,4\" d=\"M0 255 l255 0\" stroke=\"white\" fill=\"none\" />\n</svg>\n";
}
exports.tileConstruct = tileConstruct;
//# sourceMappingURL=tilesvg.js.map