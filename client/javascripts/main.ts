import { IPv4 } from "../../ipv4/index";
import * as L from "leaflet";
import {control, LatLngBounds} from "leaflet";
import {IPv4Range} from "../../ipv4/ipv4";

let mymap: L.Map = L.map("mapid").fitWorld();
let myip: IPv4 = IPv4.newIPv4FromString(document.getElementById("ip").innerText);
let initZoomLevel = parseInt(document.getElementById("zoomlevel").innerText) || 2;

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
var marker: L.Marker;
var selection;

function onMapClick(e: any):void {
    
    const mypoint: L.Point = getAbsolutePoint(mymap, e.latlng);
    const myip: IPv4 = IPv4.newIPv4FromPoint(mypoint);

    document.getElementById("show").className = "off";

    marker && mymap.removeLayer(marker);
    selection && mymap.removeLayer(selection);


    if (e.target._zoom <= 4) {
        let myrange = myip.deduceRange(8);
        let latlngf: L.LatLng = getLatLng(mymap, castLPoint(myrange.pIpStart.pPoint), 0.5);
        let latlngt: L.LatLng = getLatLng(mymap, castLPoint(myrange.pIpEnd.pPoint), 0.5);
        // define rectangle geographical bounds
        let bounds = new LatLngBounds (latlngf, latlngt);

        // create an orange rectangle
        selection = L.rectangle(bounds, {color: "#ff7800", weight: 1}).addTo(mymap);
        // zoom the map to the rectangle bounds
        //mymap.fitBounds(bounds);

        queryJson(`/info/${mypoint.x}/${mypoint.y}/${e.target._zoom}`,(r) => {
            let ir = IPv4Range.newIPv4RangeFromString(r.ip);
            showModalRange(ir);
            updateQueryParamIp(ir.toString());
        });
    } else {
        marker = L.marker(e.latlng).addTo(mymap);
        /*popup
            .setLatLng(e.latlng)
            .setContent(myip.toString())
            .openOn(mymap);*/

        showModal(myip);

        updateQueryParamIp(myip.toString());
    }
}


function getQueryParams(): URLSearchParams {
    // Get current parameters from the address bar
    return new URLSearchParams(window.location.pathname.substring(2));
}


function setQueryParams(queryParams: URLSearchParams) {
    // Replace current parameters with the new ones
    history.replaceState(null, null, "@"+queryParams.toString());
}

function updateQueryParamIp(ip: string) {
    // Get current parameters from the address bar
    var queryParams: URLSearchParams = getQueryParams();
    // Update the parameter ip
    queryParams.set("ip", ip);
    // Replace current parameters with the new ones
    setQueryParams(queryParams);
}


function query(ip, callback) {
    
    var request = new XMLHttpRequest();
    request.open('GET', '/whois/'+ip.replace('/','_-_'), true);
    
    request.onload = function() {
      if (request.status >= 200 && request.status < 400) {
        // Success!
        var resp = request.responseText;
        updateQueryParamIp(ip);
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


function queryNS(ns, callback) {
    
    var request = new XMLHttpRequest();
    request.open('GET', '/nslookup/'+ns, true);
    
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


function queryJson(url, callback) {

    const request = new XMLHttpRequest();
    request.responseType = 'json';
    request.open('GET', url, true);

    request.onload = function() {
        if (request.status >= 200 && request.status < 400) {
            // Success!
            var resp = request.response;
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

mymap.on('zoomend', function() {
    // Get current parameters from the address bar
    var queryParams: URLSearchParams = getQueryParams();
    // Update the parameter ip
    queryParams.set("zoom", mymap.getZoom().toString());
    // Replace current parameters with the new ones
    setQueryParams(queryParams);
});



window.onload = function () {
    if (myip.toString() !== "0.0.0.0") {
        let latlng: L.LatLng = getLatLng(mymap, castLPoint(myip.pPoint), 0.5);
        mymap.setView(latlng, initZoomLevel);
        marker = L.marker(latlng).addTo(mymap);
        marker.bindPopup("You are here.<br/>" + myip).openPopup();
    }
}



function showModal (search:IPv4) {
    document.getElementById("show").className = "mini";
    document.querySelector("#show ip").textContent = search.toString();
    document.querySelector("#show .range").textContent = '';
    document.querySelector("#show .whois").textContent = "";
}
function showModalRange (search:IPv4Range) {
    document.getElementById("show").className = "mini";
    document.querySelector("#show ip").textContent = search.toString();
    document.querySelector("#show .range").textContent = `${search.pIpStart} to ${search.pIpEnd} (${search.howMany} addresses)`;
    document.querySelector("#show .whois").textContent = "";
}


export function addMarkerForIP ( searchString:string ) {

    let ipReg: string = "(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)";
    let fullReg: string = "^" + ipReg + "\." + ipReg + "\." + ipReg + "\." + ipReg + "$";
    let nsReg: string = "^[a-zA-Z0-9][a-zA-Z0-9-]{1,61}[a-zA-Z0-9](?:\.[a-zA-Z]{2,})+$";

    if ((new RegExp(fullReg)).test(searchString)) {
        let ipString = searchString;
        let ip: IPv4 = IPv4.newIPv4FromString(ipString);
        let latlng: L.LatLng = getLatLng(mymap, castLPoint(ip.pPoint), 0.5);
        //L.marker(latlng).addTo(mymap);
        mymap.panTo(latlng);
        mymap.setView(latlng, 16);
        marker && mymap.removeLayer(marker);
        marker = L.marker(latlng).addTo(mymap);
        /*popup
            .setLatLng(latlng)
            .setContent(ip.toString())
            .openOn(mymap);*/
        showModal(ip);
    } else if ((new RegExp(nsReg)).test(searchString)) {
        let ns = searchString;
        queryNS(ns, function (ipString) {
            let ip: IPv4 = IPv4.newIPv4FromString(ipString);
            let latlng: L.LatLng = getLatLng(mymap, castLPoint(ip.pPoint), 0.5);
            mymap.panTo(latlng);
            mymap.setView(latlng, 16);
            marker && mymap.removeLayer(marker);
            marker = L.marker(latlng).addTo(mymap);
            /*popup
                .setLatLng(latlng)
                .setContent(ip.toString())
                .openOn(mymap);*/
            showModal(ip);
        });
    } else {

    }
}

export function whoisClick (){
    let whois: string = document.querySelector("#show .whois").textContent;
    if (whois !== "") {
        document.getElementById("show").className = "mini";
        document.querySelector("#show .whois").textContent = "";
    } else {
        document.getElementById("show").className = "full";
        let ip: string = document.querySelector("#show ip").textContent;
        query(ip, function (whois) {
            document.querySelector("#show .whois").textContent = whois;
        });
    }
}