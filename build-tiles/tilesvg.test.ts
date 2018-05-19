import { splitTextMultipleLines } from "./tilesvg";
import { expect } from 'chai';
import 'mocha';

describe("cut text into multiple line", function() {
    it.only("should return one line", function() {
        const result = splitTextMultipleLines("Lorem ipsum dolor sit amet",26) ;
        expect(result.length).to.equal(1);
        expect(result[0]).to.equal("Lorem ipsum dolor sit amet");
    });

    it.only("should return two lines", function() {
        const result = splitTextMultipleLines("Lorem ipsum dolor sit amet, consectetur adipiscing elit",27) ;
        expect(result.length).to.equal(2);
        expect(result[0]).to.equal("Lorem ipsum dolor sit amet,");
        expect(result[1]).to.equal("consectetur adipiscing elit");
    });
});