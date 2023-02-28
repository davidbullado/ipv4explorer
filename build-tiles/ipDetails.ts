import { IPv4, getIPFromXYZ } from "../ipv4/index";
import { bisectLeft } from "d3-array";
import { IDataIP, ip2lite } from "../ip2lite";
import { IDataIPASN, IWhois } from "../ip2lite/ip2lite";

/**
 * Get a slice of ip/country array
 * @param ipStart first ip of a block
 * @param ipEnd last ip of a block
 */
function getCountriesRangeForIndex(idx: number[], arr: any[], ipStart: number, ipEnd: number): any[] {
    // instead of doing an array.filter, which is time consuming,
    // we use bisect on an index.
    const idLo = bisectLeft( idx, ipStart ) ;
    const idHi = bisectLeft( idx, ipEnd ) ;
    const myRange = arr.slice(idLo, idHi + 1);

    return myRange;
}

/**
 * Get a slice of ip/country array
 * @param ipStart first ip of a block
 * @param ipEnd last ip of a block
 */
export function getCountriesRange(ipStart: number, ipEnd: number): IDataIP[] {
    return getCountriesRangeForIndex(ip2lite.ipArrayIdx, ip2lite.ipArray, ipStart, ipEnd);
}
function getASNsRange(ipStart: number, ipEnd: number): IDataIPASN[] {
    return getCountriesRangeForIndex(ip2lite.ipArrayASNIdx, ip2lite.ipArrayASN, ipStart, ipEnd);
}

function aggregateCountryRangeByLabel(myRange: IDataIP[]) {

    const countries = new Map();
    myRange.forEach((r) => {
        countries.set(r.countryCode, r.countryLabel);
    });
    return countries;
}

export function getCountries(ipValue: number, zoom: number) {
    let res: string ;
    let ipEnd: IPv4;

    // get last ip of the block given zoom
    ipEnd = (new IPv4(ipValue)).getLastIPMask(zoom * 2);

    const m = aggregateCountryRangeByLabel(getCountriesRange(ipValue, ipEnd.pVal));

    if ( m.size === 1 ) {
        // get the full country name
        res = m.values().next().value;
    } else {
        // get the country codes
        const arrCountryCode = Array.from(m.keys());
        // concat them into csv with a trailing ... if more than 4 countries.
        res = arrCountryCode.slice(0, 4).join(", ") + (m.size > 4 ? ", " + arrCountryCode[4] + ", ..." : "");
    }

    return res;
}

function aggregateASNRangeByLabel(myRange: IDataIPASN[]) {

    const asns = new Map();
    myRange.forEach((r) => {
        asns.set(r.ASNName, r.ASNName);
    });
    return asns;
}

export function getASNs(ipValue: number, zoom: number): string {
    let res: string = "";
    let ipEnd: IPv4;

    // get last ip of the block given zoom
    ipEnd = (new IPv4(ipValue)).getLastIPMask(zoom * 2);

    const m = aggregateASNRangeByLabel(getASNsRange(ipValue, ipEnd.pVal));

    if ( m.size === 1 ) {
        // get the full asn name
        res = m.values().next().value;
    } else {
        // get the asn
        const arrASN = Array.from(m.keys());
        // concat them into csv with a trailing ... if more than 2 asn.
        res = arrASN.slice(0, 1).join(", ") + (m.size > 2 ? ", +" + (m.size-1) +" ASNs ..." : "");
    }

    return res;
}

// ip2lite:
function filterBetween(d) {
    return d.ipRangeStart.pVal <= this.value && this.value <= d.ipRangeEnd.pVal;
}
// ip2lite: strictly between
function filter(d:IWhois) {
    return (d.ipRangeStart.pVal <= this.ipStart && this.ipEnd <= d.ipRangeEnd.pVal) ||
        (this.ipStart <= d.ipRangeStart.pVal && d.ipRangeEnd.pVal <= this.ipEnd) ||
        d.ipRangeStart.pVal <= this.ipStart && this.ipStart <= d.ipRangeEnd.pVal ||
        d.ipRangeStart.pVal <= this.ipEnd && this.ipEnd <= d.ipRangeEnd.pVal;
}

export function filterOnIpWhois(ipStart: IPv4, ipEnd: IPv4): IWhois[] {
    // list all Regional Internet Registries where my ip belong
    return ip2lite.ipWhois.filter(filter,  { ipStart: ipStart.pVal, ipEnd: ipEnd.pVal });
}
