import { getIPFromXYZ } from "./ipv4";
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