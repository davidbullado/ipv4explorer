"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
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
var IPv4 = /** @class */ (function () {
    function IPv4(value) {
        if (value === void 0) { value = 0; }
        var _this = this;
        this.toString = function () {
            return _this.pString;
        };
        this.pVal = value;
    }
    Object.defineProperty(IPv4.prototype, "pVal", {
        get: function () {
            return this.ipval;
        },
        set: function (val) {
            this.ipval = val;
            this.point = null;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(IPv4.prototype, "pPoint", {
        get: function () {
            if (!this.point) {
                this.point = IPv4.getPointFromVal(this.ipval);
            }
            return this.point;
        },
        set: function (p) {
            this.point = p;
            this.ipval = getIpVal(p.x, p.y, 16);
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(IPv4.prototype, "pString", {
        get: function () {
            return [this.ipval >> 24 & 0xff, this.ipval >> 16 & 0xff, this.ipval >> 8 & 0xff, this.ipval & 0xff].join(".");
        },
        set: function (s) {
            var arr = s.split(".");
            this.pVal = IPv4.getIntValue(Number(arr[0]), Number(arr[1]), Number(arr[2]), Number(arr[3]));
        },
        enumerable: true,
        configurable: true
    });
    IPv4.prototype.getLastIPMask = function (mask) {
        /* number of lines
        let height: number = 1 << ((32 - mask) >> 1);
        let width: number = height;
        const ipEnd: IPv4 = new IPv4();
        ipEnd.pPoint = { x: this.pPoint.x + width - 1, y: this.pPoint.y + height - 1 };
        const ipTest: IPv4 =
        console.log("test:"+ipTest.pVal+", "+ipEnd.pVal);
        */
        return new IPv4(this.pVal + Math.pow(2, (32 - mask)) - 1);
    };
    IPv4.getPointFromVal = function (ipval) {
        var twobit;
        var x = 0;
        var y = 0;
        for (var i = 15; i >= 0; i--) {
            twobit = (ipval >> i * 2) & 3;
            x += (twobit & 1) * Math.pow(2, i);
            y += ((twobit >> 1) & 1) * Math.pow(2, i);
        }
        return { y: y, x: x };
    };
    IPv4.newIPv4FromString = function (s) {
        var myip = new IPv4();
        myip.pString = s;
        return myip;
    };
    IPv4.newIPv4FromPoint = function (p) {
        var myip = new IPv4();
        myip.pPoint = p;
        return myip;
    };
    IPv4.getIntValue = function (ip_b3, ip_b2, ip_b1, ip_b0) {
        return ip_b3 * IPv4.pow_256_3 + ip_b2 * IPv4.pow_256_2 + ip_b1 * 256 + ip_b0;
    };
    IPv4.pow_2_16 = Math.pow(2, 16);
    IPv4.pow_256_3 = Math.pow(256, 3);
    IPv4.pow_256_2 = Math.pow(256, 2);
    return IPv4;
}());
exports.default = IPv4;
//# sourceMappingURL=index.js.map