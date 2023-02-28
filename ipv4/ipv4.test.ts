import { getIPFromXYZ, IPv4 } from "./ipv4";
import { expect } from 'chai';
import 'mocha';

describe("Get IP from x, y, z coordinates",function() {
    it("should return an IP", function() {
        const result = getIPFromXYZ(0,0,1) ;
        expect(result).not.null;
        expect(result.pString).to.equal("0.0.0.0");
    });
    it("should return null when out of bounds", function() {
        const result = getIPFromXYZ(1,0,0) ;
        expect(result).null;
    });
});describe("Range",function() {
    it("should parse an IP Range", function() {
        const result = IPv4.newIPv4FromRange('1.0.0.0/16') ;
        expect(result.length).to.equal(2);
        expect(result[0].pString).to.equal("1.0.0.0");
        expect(result[1].pString).to.equal("1.0.255.255");
    });    it("should parse an IP Range", function() {
        const result = IPv4.newIPv4FromRange('1.0.0.0/9') ;
        expect(result.length).to.equal(2);
        expect(result[0].pString).to.equal("1.0.0.0");
        expect(result[1].pString).to.equal("1.0.1.255");
    });
});