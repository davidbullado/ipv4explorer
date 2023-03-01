export interface IPoint {
    x: number;
    y: number;
}

function getIpVal(x: number, y: number, z: number): number {
    let ipval: number = 0;
    let point: IPoint = { x: 0, y: 0 };

    for (var i: number = z; i > 0; i--) {

        point.x = x >> (i - 1) & 1;
        point.y = y >> (i - 1) & 1;

        let m: number = point.x | (point.y << 1);
        let n: number = point.x | point.y;

        ipval += m * Math.pow(2, n * (32 - ((z - i + 1) << 1)));

    }
    return ipval;
}
export function getIPFromXYZ(x: number, y: number, z: number) {
    const maxCoord: number = Math.pow(2,z);
    // out of bounds ?
    if (x >= maxCoord || y >= maxCoord) {
        return null;
    }
    let ipval: number = 0;
    const point: { x: number, y: number } = { x: 0, y: 0 };

    for (let i: number = z; i > 0; i--) {

        point.x = x >> (i - 1) & 1;
        point.y = y >> (i - 1) & 1;

        let m: number = point.x | (point.y << 1);
        let n: number = point.x | point.y;

        ipval += m * Math.pow(2, n * (32 - ((z - i + 1) << 1)));

    }

    let strip: string = (ipval >> 24 & 255) + "." + (ipval >> 16 & 255) + "." + (ipval >> 8 & 255) + "." + (ipval & 255);
    const myIP: IPv4 = new IPv4(ipval);

    return myIP;
}

export class IPv4 {

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
        this.point = null;
    }

    get pPoint(): IPoint {
        if (!this.point){
            this.point = IPv4.getPointFromVal(this.ipval);
        }
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
        /* number of lines
        let height: number = 1 << ((32 - mask) >> 1);
        let width: number = height;
        const ipEnd: IPv4 = new IPv4();
        ipEnd.pPoint = { x: this.pPoint.x + width - 1, y: this.pPoint.y + height - 1 };
        const ipTest: IPv4 = 
        console.log("test:"+ipTest.pVal+", "+ipEnd.pVal);
        */
        return new IPv4(this.pVal+ Math.pow(2,(32-mask))-1);
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

    static newIPv4FromRange(s:string): IPv4[] {

        let ipReg: string = "(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)";
        let fullReg: string = "^(" + ipReg + "\." + ipReg + "\." + ipReg + "\." + ipReg + ")/([0-9]{1,2})$";

        let regExpExecArray = (new RegExp(fullReg)).exec(s);
        if (regExpExecArray) {
            let r = regExpExecArray[6];
            let ipstart = IPv4.newIPv4FromString(regExpExecArray[1]);
            let ipend = new IPv4(ipstart.ipval+(Math.pow(2,  parseInt(r))-1));
            return [ipstart, ipend];
        }
        return [];
    }
}

export class IPv4Range {
    private ipStart: IPv4;
    private ipEnd: IPv4;
    private range: number;

    constructor(value: number = 0, range: number = 1) {
        this.ipStart = new IPv4(value);
        this.range = range;
    }
    public toString = (): string => {
        return this.ipStart.toString()+'/'+this.range;
    }

    get pIpStart(): IPv4 {
        return this.ipStart;
    }
    set pIpStart(s: IPv4) {
        this.ipStart =  s;
        this.ipEnd = null;
    }

    get pRange(): number {
        return this.range;
    }

    set pRange(r: number) {
        this.range = r;
    }

    get pIpEnd(): IPv4 {
        if (!this.ipEnd) {
            this.ipEnd = new IPv4(this.ipStart.pVal+(Math.pow(2,  32-this.range)-1));
        }
        return this.ipEnd;
    }
    set pIpEnd(e: IPv4) {
        let delta = e.pVal - this.ipStart.pVal;
        this.range = 32-Math.log2(delta+1);
    }

    static newIPv4RangeFromString(s:string): IPv4Range {
        let ipReg: string = "(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)";
        let fullReg: string = "^(" + ipReg + "\." + ipReg + "\." + ipReg + "\." + ipReg + ")/([0-9]{1,2})$";

        let regExpExecArray = (new RegExp(fullReg)).exec(s);
        if (regExpExecArray) {
            let r = regExpExecArray[6];
            let res = new IPv4Range();
            res.ipStart = IPv4.newIPv4FromString(regExpExecArray[1]);
            res.pRange = parseInt(r);
            return res;
        }
        return null;
    }
}

export default IPv4;