let mymap: L.Map = L.map("mapid").setView([0, 0], 1);/*.setMaxBounds([
    [-90, -180],
    [90, 180]
])*/

L.tileLayer("http://localhost:1337/tiles/{z}/{x}/{y}", {
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

class IPv4 {

    private ipval: number;
    private point: IPoint;

    static pow_2_16: number = Math.pow(2, 16);
    static pow_256_3: number = Math.pow(256, 3);
    static pow_256_2: number = Math.pow(256, 2);

    constructor(value: number = 0) {
        this.pVal = value;
    }

    public toString = (): string => {
        return this.pString;
    }

    get pVal(): number {
        return this.ipval;
    }
    set pVal(val: number) {
        this.ipval = val;
        this.point = IPv4.getPointFromVal(val);
    }

    get pPoint(): IPoint {
        return this.point;
    }
    set pPoint(p: IPoint) {
        this.point = p;
        this.ipval = getIpVal(p.x, p.y, 16);
    }

    get pString(): string {
        return [this.ipval >> 24 & 0xff, this.ipval >> 16 & 0xff, this.ipval >> 8 & 0xff, this.ipval & 0xff].join(".");
    }
    set pString(s: string) {
        const arr: string[] = s.split(".");
        this.pVal = IPv4.getIntValue(Number(arr[0]), Number(arr[1]), Number(arr[2]), Number(arr[3]));
    }

    public getLastIPMask(mask: number) {
        // number of lines
        let height: number = 1 << ((32 - mask) >> 1);
        let width: number = height;
        const ipEnd: IPv4 = new IPv4();
        ipEnd.pPoint = { x: this.pPoint.x + width - 1, y: this.pPoint.y + height - 1 };
        return ipEnd;
    }

    static getPointFromVal(ipval: number): IPoint {
        let twobit: number;
        let x: number = 0;
        let y: number = 0;

        for (let i: number = 15; i >= 0; i--) {
            twobit = (ipval >> i * 2) & 3;
            x += (twobit & 1) * Math.pow(2, i);
            y += ((twobit >> 1) & 1) * Math.pow(2, i);
        }

        return { y: y, x: x };
    }

    static newIPv4FromString(s: string): IPv4 {
        let myip: IPv4 = new IPv4();
        myip.pString = s;
        return myip;
    }

    static newIPv4FromPoint(p: IPoint): IPv4 {
        let myip: IPv4 = new IPv4();
        myip.pPoint = p;
        return myip;
    }

    static getIntValue(ip_b3: number, ip_b2: number, ip_b1: number, ip_b0: number): number {
        return ip_b3 * IPv4.pow_256_3 + ip_b2 * IPv4.pow_256_2 + ip_b1 * 256 + ip_b0;
    }
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

function poligonizify(ipCIDR: string, label: string, color: string):void {

    const twopart: string[] = ipCIDR.split("/");
    const ipTopLeft: IPv4 = IPv4.newIPv4FromString(twopart[0]);
    const ipBotLeft: IPv4 = new IPv4();
    const ipTopRight: IPv4 = new IPv4();
    const ipBotRight: IPv4 = new IPv4();
    let mask: number = Number(twopart[1]);
    const ipEnd: IPv4 = ipTopLeft.getLastIPMask(mask);

    // thanks https://stackoverflow.com/questions/4460586/javascript-regular-expression-to-check-for-ip-addresses
    let ipReg: string = "(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)";
    let fullReg: string = "^" + ipReg + "\." + ipReg + "\." + ipReg + "\." + ipReg + "$";

    if (!(new RegExp(fullReg)).test(twopart[0])) {
        throw new Error("IP CIDR must be defined as: 0.0.0.0/0, instead we got:'" + ipCIDR + "'");
    }
    if (isNaN(mask)) {
        throw new Error("Mask must be defined as: 0.0.0.0/0, instead we got:'" + ipCIDR +"'");
    }

    // number of lines
    let height: number = 1 << ((32 - mask) >> 1);
    let width: number = height ;

    ipBotLeft.pPoint = { x: ipTopLeft.pPoint.x, y: ipTopLeft.pPoint.y + height };
    ipTopRight.pPoint = { x: ipTopLeft.pPoint.x + width, y: ipTopLeft.pPoint.y };
    ipBotRight.pPoint = { x: ipTopLeft.pPoint.x + width, y: ipTopLeft.pPoint.y + height };

    L.polygon([
        getLatLng(mymap, ipTopLeft.pPoint),
        getLatLng(mymap, ipBotLeft.pPoint),
        getLatLng(mymap, ipBotRight.pPoint),
        getLatLng(mymap, ipTopRight.pPoint)
    ], { color: color,fillColor: color}).addTo(mymap).bindPopup(label+"<br/>"+ipTopLeft.toString() + " to " + ipEnd.toString());
}

var popup: L.Popup = L.popup();

function onMapClick(e: any):void {
    const mypoint: L.Point = mymap.project(e.latlng, mymap.getZoom());
    const myip: IPv4 = IPv4.newIPv4FromPoint( getAbsolutePoint(mymap, e.latlng) );

    popup
        .setLatLng(e.latlng)
        .setContent(myip.toString())
        .openOn(mymap);
}

mymap.on("click", onMapClick);

let myip: IPv4 = IPv4.newIPv4FromString(document.getElementById("ip").innerText);

L.marker(getLatLng(mymap, castLPoint(myip.pPoint), 0.5)).addTo(mymap)
    .bindPopup("You are here.<br/>" + myip).openPopup();


const arrCIDR: {
    ipr: string;
    lab: string;
    c: string;
}[] = [
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

for (let myRange of arrCIDR) {
    try {
        poligonizify(myRange.ipr, myRange.lab, myRange.c);
    } catch (e) {
        console.log(myRange.ipr + ": " + e);
        throw e;
    }
}

