export interface IPoint {
    x: number;
    y: number;
}

class IPv4 {
    private ip_b3: number;
    private ip_b2: number;
    private ip_b1: number;
    private ip_b0: number;
    private point: IPoint;

    static pow_2_16 = Math.pow(2, 16);
    static pow_256_3 = Math.pow(256, 3);
    static pow_256_2 = Math.pow(256, 2);

    constructor(ipstring: string = '') {
        if (ipstring.length > 0) {
            this.pString = ipstring;
        }
    }

    public toString = (): string => {
        return this.pString;
    }

    get pPoint(): IPoint {
        return this.point;
    }

    set pPoint(p: IPoint) {
        this.point = p;

        const valIp = p.x + p.y * IPv4.pow_2_16;
        let rem;
        this.ip_b3 = Math.floor(valIp / IPv4.pow_256_3);
        rem = valIp - (this.ip_b3 * IPv4.pow_256_3);
        this.ip_b2 = Math.floor(rem / IPv4.pow_256_2);
        rem = rem - (this.ip_b2 * IPv4.pow_256_2);
        this.ip_b1 = Math.floor(rem / 256);
        this.ip_b0 = rem - (this.ip_b1 * 256);
    }

    get pString(): string {
        return this.ip_b3 + "." + this.ip_b2 + "." + this.ip_b1 + "." + this.ip_b0;
    }

    set pString(s: string) {
        const arr: string[] = s.split('.');
        this.ip_b3 = Number(arr[0]);
        this.ip_b2 = Number(arr[1]);
        this.ip_b1 = Number(arr[2]);
        this.ip_b0 = Number(arr[3]);

        const ipValue: number = IPv4.getIntValue(this.ip_b3, this.ip_b2, this.ip_b1, this.ip_b0);
        const y: number = Math.floor(ipValue / IPv4.pow_2_16);
        const x: number = ipValue - y * IPv4.pow_2_16;
        this.point = { y: y, x: x };
    }

    static getIntValue(ip_b3: number, ip_b2: number, ip_b1: number, ip_b0: number): number {

        return ip_b3 * IPv4.pow_256_3 + ip_b2 * IPv4.pow_256_2 + ip_b1 * 256 + ip_b0;
    }
}

export default IPv4;