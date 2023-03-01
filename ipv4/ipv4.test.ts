import {getIPFromXYZ, IPv4, IPv4Range} from "./ipv4";
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
});

describe("Range",function() {
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
    it("should deduce an IP Range from an IP", function() {
        const ip = IPv4.newIPv4FromString("1.1.1.1");
        let iPv4Range = ip.deduceRange(24);
        expect(iPv4Range.pRange).to.equal(24);
        expect(iPv4Range.pIpStart.toString()).to.equal('1.1.1.0');
        expect(iPv4Range.pIpEnd.toString()).to.equal('1.1.1.255');
        iPv4Range = ip.deduceRange(8);
        expect(iPv4Range.pRange).to.equal(8);
        expect(iPv4Range.pIpStart.toString()).to.equal('1.0.0.0');
        expect(iPv4Range.pIpEnd.toString()).to.equal('1.255.255.255');
    });
});

describe("Range2",function() {
    it("should parse an IP Range", function() {
        const r = new IPv4Range(16777216, 16);
        expect(r.toString()).to.equal("1.0.0.0/16");
    });
    it("Should compute range from ip end", function() {
        const r = new IPv4Range(16777216, 32);
        r.pIpEnd = IPv4.newIPv4FromString('1.0.0.255');
        expect(r.toString()).to.equal("1.0.0.0/24");
    });
    it("Should compute range from ip end", function() {
        const r = new IPv4Range(16777216, 32);
        r.pIpEnd = IPv4.newIPv4FromString('1.255.255.255');
        expect(r.toString()).to.equal("1.0.0.0/8");
    });
    it("Should construct a new ipv4 range", function() {
        let iPv4Range = IPv4Range.newIPv4RangeFromString("1.0.0.0/8");
        expect(iPv4Range.pRange).to.equal(8);
        expect(iPv4Range.pIpStart.toString()).to.equal('1.0.0.0');
        expect(iPv4Range.pIpEnd.toString()).to.equal('1.255.255.255');
        iPv4Range = IPv4Range.newIPv4RangeFromString("1.0.0.0/24");
        expect(iPv4Range.pRange).to.equal(24);
        expect(iPv4Range.pIpStart.toString()).to.equal('1.0.0.0');
        expect(iPv4Range.pIpEnd.toString()).to.equal('1.0.0.255');
    });
});