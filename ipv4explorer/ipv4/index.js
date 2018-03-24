"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var IPv4 = /** @class */ (function () {
    function IPv4(ipstring) {
        if (ipstring === void 0) { ipstring = ''; }
        var _this = this;
        this.toString = function () {
            return _this.pString;
        };
        if (ipstring.length > 0) {
            this.pString = ipstring;
        }
    }
    Object.defineProperty(IPv4.prototype, "pPoint", {
        get: function () {
            return this.point;
        },
        set: function (p) {
            this.point = p;
            var valIp = p.x + p.y * IPv4.pow_2_16;
            var rem;
            this.ip_b3 = Math.floor(valIp / IPv4.pow_256_3);
            rem = valIp - (this.ip_b3 * IPv4.pow_256_3);
            this.ip_b2 = Math.floor(rem / IPv4.pow_256_2);
            rem = rem - (this.ip_b2 * IPv4.pow_256_2);
            this.ip_b1 = Math.floor(rem / 256);
            this.ip_b0 = rem - (this.ip_b1 * 256);
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(IPv4.prototype, "pString", {
        get: function () {
            return this.ip_b3 + "." + this.ip_b2 + "." + this.ip_b1 + "." + this.ip_b0;
        },
        set: function (s) {
            var arr = s.split('.');
            this.ip_b3 = Number(arr[0]);
            this.ip_b2 = Number(arr[1]);
            this.ip_b1 = Number(arr[2]);
            this.ip_b0 = Number(arr[3]);
            var ipValue = IPv4.getIntValue(this.ip_b3, this.ip_b2, this.ip_b1, this.ip_b0);
            var y = Math.floor(ipValue / IPv4.pow_2_16);
            var x = ipValue - y * IPv4.pow_2_16;
            this.point = { y: y, x: x };
        },
        enumerable: true,
        configurable: true
    });
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