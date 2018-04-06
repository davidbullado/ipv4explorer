"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var index_1 = require("../../ipv4/index");
var L = require("leaflet");
var mymap = L.map("mapid").setView([0, 0], 1); /*.setMaxBounds([
    [-90, -180],
    [90, 180]
])*/
L.tileLayer("/tiles/{z}/{x}/{y}", {
    maxZoom: 16,
    attribution: "",
    id: "mapbox.streets",
    noWrap: true,
    bounds: [
        [-90, -180],
        [90, 180]
    ]
}).addTo(mymap);
function getIpVal(x, y, z) {
    var ipval = 0;
    var point = { x: 0, y: 0 };
    for (var i = z; i > 0; i--) {
        point.x = x >> (i - 1) & 1;
        point.y = y >> (i - 1) & 1;
        var m = point.x | (point.y << 1);
        var n = point.x | point.y;
        ipval += m * Math.pow(2, n * (32 - ((z - i + 1) << 1)));
    }
    return ipval;
}
function getAbsolutePoint(map, latlng) {
    var p = map.project(latlng, map.getZoom());
    return p.multiplyBy(Math.pow(2, map.getMaxZoom() - map.getZoom() - 8)).floor();
}
function getLatLng(map, point, offset) {
    if (offset === void 0) { offset = 0; }
    var ret;
    try {
        var p = new L.Point(point.x + offset, point.y + offset);
        var mypoint = p.divideBy(Math.pow(2, map.getMaxZoom() - map.getZoom() - 8));
        ret = mymap.unproject(mypoint, map.getZoom());
    }
    catch (e) {
        throw e;
    }
    return ret;
}
function castLPoint(p) {
    var point = new L.Point(p.x, p.y);
    return point;
}
function poligonizify(ipCIDR, label, color) {
    var twopart = ipCIDR.split("/");
    var ipTopLeft = index_1.default.newIPv4FromString(twopart[0]);
    var ipBotLeft = new index_1.default();
    var ipTopRight = new index_1.default();
    var ipBotRight = new index_1.default();
    var mask = Number(twopart[1]);
    var ipEnd = ipTopLeft.getLastIPMask(mask);
    // thanks https://stackoverflow.com/questions/4460586/javascript-regular-expression-to-check-for-ip-addresses
    var ipReg = "(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)";
    var fullReg = "^" + ipReg + "\." + ipReg + "\." + ipReg + "\." + ipReg + "$";
    if (!(new RegExp(fullReg)).test(twopart[0])) {
        throw new Error("IP CIDR must be defined as: 0.0.0.0/0, instead we got:'" + ipCIDR + "'");
    }
    if (isNaN(mask)) {
        throw new Error("Mask must be defined as: 0.0.0.0/0, instead we got:'" + ipCIDR + "'");
    }
    // number of lines
    var height = 1 << ((32 - mask) >> 1);
    var width = height;
    ipBotLeft.pPoint = { x: ipTopLeft.pPoint.x, y: ipTopLeft.pPoint.y + height };
    ipTopRight.pPoint = { x: ipTopLeft.pPoint.x + width, y: ipTopLeft.pPoint.y };
    ipBotRight.pPoint = { x: ipTopLeft.pPoint.x + width, y: ipTopLeft.pPoint.y + height };
    L.polygon([
        getLatLng(mymap, ipTopLeft.pPoint),
        getLatLng(mymap, ipBotLeft.pPoint),
        getLatLng(mymap, ipBotRight.pPoint),
        getLatLng(mymap, ipTopRight.pPoint)
    ], { color: color, fillColor: color }).addTo(mymap).bindPopup(label + "<br/>" + ipTopLeft.toString() + " to " + ipEnd.toString());
}
var popup = L.popup();
function onMapClick(e) {
    var mypoint = mymap.project(e.latlng, mymap.getZoom());
    var myip = index_1.default.newIPv4FromPoint(getAbsolutePoint(mymap, e.latlng));
    popup
        .setLatLng(e.latlng)
        .setContent(myip.toString())
        .openOn(mymap);
}
mymap.on("click", onMapClick);
var myip = index_1.default.newIPv4FromString(document.getElementById("ip").innerText);
L.marker(getLatLng(mymap, castLPoint(myip.pPoint), 0.5)).addTo(mymap)
    .bindPopup("You are here.<br/>" + myip).openPopup();
var arrCIDR = [
    { ipr: "0.0.0.0/8", lab: "Current network (only valid as source address)", c: "#001f3f" },
    { ipr: "10.0.0.0/8", lab: "Private network", c: "#0074D9" },
    { ipr: "100.64.0.0/10", lab: "Shared address space for carrier-grade NAT", c: "#7FDBFF" },
    { ipr: "127.0.0.0/8", lab: "Loopback", c: "#39CCCC" },
    { ipr: "169.254.0.0/16", lab: "Link-local", c: "#3D9970" },
    { ipr: "172.16.0.0/12", lab: "Private network", c: "black" },
    { ipr: "192.0.0.0/24", lab: "IETF Protocol Assignments", c: "#2ECC40" },
    { ipr: "192.0.2.0/24", lab: "TEST-NET-1, documentation and examples", c: "gray" },
    { ipr: "192.88.99.0/24", lab: "IPv6 to IPv4 relay (includes 2002::/16)", c: "#01FF70" },
    { ipr: "192.168.0.0/16", lab: "Private network", c: "#FFDC00" },
    { ipr: "198.18.0.0/15", lab: "Network benchmark tests", c: "#FF851B" },
    { ipr: "198.51.100.0/24", lab: "TEST-NET-2, documentation and examples", c: "gray" },
    { ipr: "203.0.113.0/24", lab: "TEST-NET-3, documentation and examples", c: "gray" },
    { ipr: "224.0.0.0/4", lab: "IP multicast (former Class D network)", c: "#FF4136" },
    { ipr: "240.0.0.0/4", lab: "Reserved (former Class E network)", c: "#85144b" },
    { ipr: "255.255.255.255/32", lab: "Broadcast", c: "#F012BE" }
];
for (var _i = 0, arrCIDR_1 = arrCIDR; _i < arrCIDR_1.length; _i++) {
    var myRange = arrCIDR_1[_i];
    try {
        poligonizify(myRange.ipr, myRange.lab, myRange.c);
    }
    catch (e) {
        console.log(myRange.ipr + ": " + e);
        throw e;
    }
}
//# sourceMappingURL=main.js.map