import { IPv4 } from "../../ipv4/index";
import * as L from "leaflet";

let mymap: L.Map = L.map("mapid").fitWorld();
/*.setView([0, 0], 1);.setMaxBounds([
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

interface IPoint {
    x: number;
    y: number;
}

function getIpVal(x: number, y: number, z: number): number {
    let ipval: number = 0;
    let point: IPoint = { x: 0, y: 0 };

    for (var i:number = z; i > 0; i--) {

        point.x = x >> (i - 1) & 1;
        point.y = y >> (i - 1) & 1;

        let m:number = point.x | (point.y << 1);
        let n: number = point.x | point.y;

        ipval += m * Math.pow(2, n * (32 - ((z - i + 1) << 1)));

    }
    return ipval;
}

function getAbsolutePoint(map: L.Map, latlng: L.LatLng ): L.Point {
    const p: L.Point = map.project(latlng, map.getZoom());
    return p.multiplyBy(Math.pow(2, map.getMaxZoom() - map.getZoom() - 8)).floor();
}

function getLatLng(map: L.Map, point: IPoint, offset: number=0): L.LatLng {
    let ret: L.LatLng;
    try {
        let p: L.Point = new L.Point(point.x + offset, point.y + offset);
        let mypoint: L.Point = p.divideBy(Math.pow(2, map.getMaxZoom() - map.getZoom() - 8));
        ret = mymap.unproject(mypoint, map.getZoom());
    } catch (e) {
        throw e;
    }
    return ret;
}
function castLPoint(p: IPoint): L.Point {
    const point: L.Point = new L.Point(p.x, p.y);
    return point;
}

var popup: L.Popup = L.popup();

function onMapClick(e: any):void {
    
    
    
    const mypoint: L.Point = mymap.project(e.latlng, mymap.getZoom());
    const myip: IPv4 = IPv4.newIPv4FromPoint( getAbsolutePoint(mymap, e.latlng) );

    query(myip.toString(), function (whois) {
        popup
        .setLatLng(e.latlng)
        .setContent('<div class="whois">'+whois+'</div>')
        .openOn(mymap);
    });
}

function query(ip, callback) {
    
    var request = new XMLHttpRequest();
    request.open('GET', '/whois/'+ip, true);
    
    request.onload = function() {
      if (request.status >= 200 && request.status < 400) {
        // Success!
        var resp = request.responseText;
        callback(resp);
      } else {
        // We reached our target server, but it returned an error
        console.log('We reached our target server, but it returned an error');
      }
    };
    
    request.onerror = function() {
      // There was a connection error of some sort
      console.log('There was a connection error of some sort');
    };
    
    request.send();

}

mymap.on("click", onMapClick);

let myip: IPv4 = IPv4.newIPv4FromString(document.getElementById("ip").innerText);

window.onload = function () {
    L.marker(getLatLng(mymap, castLPoint(myip.pPoint), 0.5)).addTo(mymap)
    .bindPopup("You are here.<br/>" + myip).openPopup();
}