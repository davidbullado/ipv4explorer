import { IPv4, getIPFromXYZ } from "../ipv4/index";
import { IDataIP, ip2lite } from "../ip2lite";
import { bisectLeft } from "d3-array";

function getColorFromWhois ({whois, designation}) {
  if (!designation || designation === ""){
    designation = "void";
  }
  var fillRect = "";
  
  switch (whois) {
    case 'IANA':
      fillRect="#f0f0f0";
      break;
    case 'APNIC':
      fillRect="#FFDDDD";
      break;
    case 'RIPE':
      fillRect="#BCD9D9";
      break;
    case 'AFRINIC':
      fillRect="#CCECCC";
      break;
    case 'ARIN':
      fillRect="#FFECDD";
      break;
    case 'LACNIC':
      fillRect="#C9BAD7";
      break;
    default:
     fillRect="#FFFFFF";
  }
  
  fillRect = colorObjectToString( meanColor(colorStringToObject(fillRect), stringToColour(designation)) );
  
  return fillRect;
}

function colorStringToObject (colorStr) {
  return {
    r: parseInt("0x"+colorStr.substr(1,2)),
    g: parseInt("0x"+colorStr.substr(3,2)),
    b: parseInt("0x"+colorStr.substr(5,2))
  }
}

function meanColor (c1, c2) {
  return {
    r: Math.round(Math.sqrt((c1.r*c1.r*0.9 + c2.r*c2.r*0.1))),
    g: Math.round(Math.sqrt((c1.g*c1.g*0.9 + c2.g*c2.g*0.1))),
    b: Math.round(Math.sqrt((c1.b*c1.b*0.9 + c2.b*c2.b*0.1)))
  }
}

function colorObjectToString (colorObj){
  
  return "#" + ("00"+colorObj.r.toString(16)).slice(-2) + ("00"+colorObj.g.toString(16)).slice(-2) + ("00"+colorObj.b.toString(16)).slice(-2);
  
}

var stringToColour = function(str) {

    var hash = 0;
    for (var i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    return {
      r: hash & 0xff,
      g: (hash >> 8) & 0xff,
      b: (hash >> 16) & 0xff
    };
}

// ip2lite:
function filterBetween(d) {
  return d.ipRangeStart.pVal <= this.value && this.value <= d.ipRangeEnd.pVal;
}
// ip2lite: strictly between
function filter(d) {
  return (d.ipRangeStart.pVal <= this.ipStart && this.ipEnd <= d.ipRangeEnd.pVal) ||
      (this.ipStart <= d.ipRangeStart.pVal && d.ipRangeEnd.pVal <= this.ipEnd) ||
      d.ipRangeStart.pVal <= this.ipStart && this.ipStart <= d.ipRangeEnd.pVal ||
      d.ipRangeStart.pVal <= this.ipEnd && this.ipEnd <= d.ipRangeEnd.pVal;
}

/**
 * Get a slice of ip/country array
 * @param ipStart first ip of a block
 * @param ipEnd last ip of a block
 */
function getCountriesRange(ipStart: number, ipEnd: number): IDataIP[] {
  // instead of doing an array.filter, which is time consuming,
  // we use bisect on an index.
  const idLo = bisectLeft( ip2lite.ipArrayIdx, ipStart ) ;
  const idHi = bisectLeft( ip2lite.ipArrayIdx, ipEnd ) ;
  const myRange = ip2lite.ipArray.slice(idLo, idHi + 1);

  return myRange;
}

function aggregateCountryRangeByLabel(myRange: IDataIP[]) {

  const countries = new Map();
  myRange.forEach((r) => {
      countries.set(r.countryCode, r.countryLabel);
  });
  return countries;
}

function getCountries(ipValue: number, zoom: number) {
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

function moreThanOneCountry(ipValue: number, zoom: number) {
  let moreThanOne = false;
  let ipEnd: IPv4;

  // get last ip of the block given zoom
  ipEnd = (new IPv4(ipValue)).getLastIPMask(zoom * 2);
  const myRange = getCountriesRange(ipValue, ipEnd.pVal);
  if (myRange.length > 1) {
      const myVal = myRange[0].countryCode ;
      for (var i = 0; i < myRange.length && !moreThanOne; i++) {
          moreThanOne = myVal != myRange[i].countryCode;
      }
  }
  return moreThanOne ;
}

var getTileInfo = (ipTile: IPv4, point) => {
  if (ipTile) {
      
      let strIP: string = ipTile.toString();
      // single ip scale
      if (point.z < 16) {
          strIP += "/" + (point.z * 2) + "\n";
      }
      // list all Regional Internet Registries where my ip belong
      const resWhois = ip2lite.ipWhois.filter(filter, { ipStart: ipTile.pVal, ipEnd: ipTile.getLastIPMask(point.z * 2).pVal } );
      let res= {x: point.x, y: point.y, z: point.z, desc: null, whois: resWhois[0].whois, date: null, ip: strIP};
      
      if ( point.z > 5 ) {
          res.desc = getCountries(ipTile.pVal,point.z) ;
          res.date = "";
      } else {
          //res.desc = resWhois[0].designation ;
          res.date = resWhois[0].date;

          const mapRIR = new Map();
          resWhois.forEach((r) => {
            mapRIR.set(r.designation, r.date);
          });
          // get the designation
          const arrRIRdes = Array.from(mapRIR.keys());
          // concat them into csv with a trailing ... if more than 4 designation.
          res.desc = arrRIRdes.slice(0, 4).join(", ") + (mapRIR.size > 4 ? ", " + arrRIRdes[4] + ", ..." : "");
          if (mapRIR.size > 1) {
            res.date = "";
          }

      }

      return res;

  } else {
      return null;
  }
};
var isTileInfoMoreThanOne = (point) => {
  const ipTile: IPv4 = getIPFromXYZ(point.x,point.y,point.z);
  if (ipTile) {
      if ( point.z > 5 ) {
          return moreThanOneCountry(ipTile.pVal, point.z);
      } else {
          const resWhois = ip2lite.ipWhois.filter(filter, { ipStart: ipTile.pVal, ipEnd: ipTile.getLastIPMask(point.z * 2).pVal } );
          let moreThanOne = false;
          if (resWhois.length > 1) {
              const myVal = resWhois[0].designation ;
              for (var i = 0; i < resWhois.length && !moreThanOne; i++) {
                  moreThanOne = myVal != resWhois[i].designation;
              }
          }
          return moreThanOne;
      }
  } else {
      return false;
  }
};
function getXYTile (point) {
  const ipTile: IPv4 = getIPFromXYZ(point.x,point.y,point.z);
  return getTileInfo(ipTile, point);
};
function compareTiles (tile1, tile2) {
  return tile1.desc === tile2.desc && tile1.whois === tile2.whois ;
};

/**
 * 
 * @param getXYTile 
 * @param compareTo 
 * @param coord 
 * @param colorRect 
 * @param z_level Information about z depth. When multiple sub tiles are computed, indicate at which level there are. z -> 0 indicates the tile will be very tiny. So it is not necessary to compute many details
 */
function tileConstructSVG (coord, colorRect, z_level) {

  var fillRect ;

  let whois: string = "";
  let designation: string = "";
  let date: string = "";
  let currentTile;
  let stroke = ""

  if (getXYTile) {
    currentTile = getXYTile(coord);
    whois       = currentTile.whois;
    designation = currentTile.desc;
    date        = currentTile.date;
  }

  if (colorRect){
    fillRect = colorRect;
  } else {
    fillRect = getColorFromWhois({whois,designation});
  }

  var join = "";
  var rect = {
    x:3,
    y:3,
    width:250,
    height:250
  } ;
  

  if (z_level > 0 && getXYTile) {
    var myNeighbors = [
        [null,null,null],
        [null,null,null],
        [null,null,null]
    ]
    var myNeighborsEquals = [
        [false,false,false],
        [false,false,false],
        [false,false,false]
    ];

    for (var y=-1; y <= 1 ; y++){
        for (var x=-1; x <= 1; x++){
            if (y===0 && x===0) {
              continue;
            }
            var neighborTile = getXYTile({x: currentTile.x+x, y: currentTile.y+y, z: currentTile.z});
            // store neighbors reference
            myNeighbors[y+1][x+1] = neighborTile;
            // If neighbor shares the same whois
            if (neighborTile && compareTiles (neighborTile, currentTile)){
                myNeighborsEquals[y+1][x+1] = true; 
            }
        }
    }

    var nbTop   = myNeighbors[0][1];
    var nbRight = myNeighbors[1][2];
    var nbBot   = myNeighbors[2][1];
    var nbLeft  = myNeighbors[1][0];

    var nbEqualsBtwThem = {
        topRigth: null,
        botRight: null,
        botLeft: null,
        topLeft: null
    }

    if (nbTop && nbRight && compareTiles (nbTop,nbRight)){
        nbEqualsBtwThem.topRigth = { whois: nbTop.whois, designation: nbTop.desc };
    }
    if (nbRight && nbBot && compareTiles (nbRight,nbBot)){
        nbEqualsBtwThem.botRight = { whois: nbRight.whois , designation: nbRight.desc };
    }
    if (nbBot && nbLeft && compareTiles (nbBot,nbLeft)){
        nbEqualsBtwThem.botLeft = { whois: nbBot.whois , designation: nbBot.desc };
    }
    if (nbLeft && nbTop && compareTiles (nbLeft,nbTop)){
        nbEqualsBtwThem.topLeft = { whois: nbLeft.whois , designation: nbLeft.desc };
    }

    
    
    // right
    if (myNeighborsEquals[1][2]) {
      rect.width+=15;
      stroke += `
      <line stroke-dasharray="4,4" x1="255" y1="10" x2="255" y2="245" />
      `
    }
    // left
    if (myNeighborsEquals[1][0]) {
      rect.x-=15;
      rect.width+=15;
    }
    // top
    if (myNeighborsEquals[0][1]) {
      rect.y-=15;
      rect.height+=15;
    }
    // bottom
    if (myNeighborsEquals[2][1]) {
      rect.height+=15;
      stroke += `
      <line stroke-dasharray="4,4" x1="10" y1="255" x2="245" y2="255" />
      `
    }

    
    // left top
    if (myNeighborsEquals[0][0]){
      join += `
      <rect x="0" y="0" width="18" height="18" fill="${fillRect}" />
      <circle cx="-18" cy="18" r="21" />
      <circle cx="18" cy="-18" r="21" />
      `
    }
    // right bottom
    if (myNeighborsEquals[2][2]){
      join += `
      <rect x="238" y="238" width="18" height="18" fill="${fillRect}" />
      <circle cx="238" cy="274" r="21" />
      <circle cx="274" cy="238" r="21" />
      `
    }

    // if current tile equals its top right neighbor,
    if (myNeighborsEquals[0][2]) {
      join += `
      <rect x="238" y="0" width="18" height="18" fill="${fillRect}" />
      <circle cx="238" cy="-18" r="21" />
      <circle cx="274" cy="18" r="21" />
      `
    }

    // bottom left
    if (myNeighborsEquals[2][0]) {
      join += `
      <rect x="0" y="238" width="18" height="18" fill="${fillRect}" />
      <circle cx="-18" cy="238" r="21" />
      <circle cx="18" cy="274" r="21" />
      `
    }
  
    // Left top
    if (!myNeighborsEquals[0][0] && nbEqualsBtwThem.topLeft) {
      join += `
      <polygon points="0,0 6,0 0,6" fill="${getColorFromWhois(nbEqualsBtwThem.topLeft)}" />
      `
    }

    // Right bottom
    if (!myNeighborsEquals[2][2] && nbEqualsBtwThem.botRight) {
      join += `
      <polygon points="256,256 250,256 256,250" fill="${getColorFromWhois(nbEqualsBtwThem.botRight)}" />
      `
    }

    // . . .          . . .
    // . = . ?   &&   = . . ?
    // = . .          . = .
    // cross : patch with triangle
    if (myNeighborsEquals[2][0] && nbEqualsBtwThem.botLeft ) {
      join += `
      <polygon points="0,256 0,250 6,256" fill="${getColorFromWhois(nbEqualsBtwThem.botLeft)}" />
      `
    } else {
      //  . . .
      //  = . . ?
      //  . = .
      // Trace a curve
      if (nbEqualsBtwThem.botLeft ) {
        join += `
        <rect x="0" y="250" width="6" height="6" fill="${getColorFromWhois(nbEqualsBtwThem.botLeft)}" />
        <circle cx="18" cy="238" r="21" />
        `
      }
    }

    // cross : patch with triangle
    if (myNeighborsEquals[0][2] &&  nbEqualsBtwThem.topRigth ) {
      join += `
      <polygon points="256,0 250,0 256,6" fill="${getColorFromWhois(nbEqualsBtwThem.topRigth)}" />
      `
    } else {
      // otherwise, top and rigth are equal
      if ( nbEqualsBtwThem.topRigth ) {
        join += `
        <rect x="250" y="0" width="6" height="6" fill="${getColorFromWhois(nbEqualsBtwThem.topRigth)}" />
        <circle cx="238" cy="18" r="21" />
        `
      }
    }
  }

  return `
  <defs>
    <style type="text/css">
    <![CDATA[
    text {
      font-family: "Open Sans",arial,x-locale-body,sans-serif;
      fill: #555;
    }
    line{
      stroke: black;
      stroke-width: 1;
    }
    circle{
      fill: black;
    }
    ]]>
  </style>
  </defs>

  ${join}

  <rect x="${rect.x}" y="${rect.y}" width="${rect.width}" height="${rect.height}" 
          rx="15" ry="15" fill="${fillRect}" />
  <text text-anchor="middle" x="128" y="64" font-size="22"  >
    ${whois}
  </text>
  <text text-anchor="middle" x="128" y="132" font-size="25" >
    ${currentTile.ip}
  </text>
  <text text-anchor="middle" x="128" y="190" font-size="13" >
  <![CDATA[${designation}]]>
  </text>
  <text text-anchor="end" x="240" y="240" font-size="16" >
    ${date}
  </text>
  ${stroke}
  
`;
}

function tileConstruct ( coord, colorRect) {
  
  let svgcontent ;

  if (isTileInfoMoreThanOne(coord)) {
    svgcontent = tileConstructSubSVG ( coord, colorRect, 2);
  } else {
    svgcontent = tileConstructSVG ( coord, colorRect,2);
  }

  return `<?xml version="1.0" standalone="no"?>
<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" 
  "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">

<svg width="256px" height="256px" version="1.1"
     viewBox="0 0 256 256" preserveAspectRatio="none"
     xmlns="http://www.w3.org/2000/svg" shape-rendering="geometricPrecision">
  ${svgcontent}
</svg>
`;
}

function tileConstructSubSVG (coord, colorRect, rec) {
  const nx = coord.x * 2;
  const ny = coord.y * 2;
  const nz = coord.z + 1;

  let topLeft    ;
  let topRight   ;
  let bottomRight;
  let bottomLeft ;
  
  const coordTopLeft = {x: nx,     y: ny,     z: nz} ;

  if (rec > 0 && isTileInfoMoreThanOne(coordTopLeft)) {
    topLeft     = tileConstructSubSVG ( coordTopLeft, colorRect, rec-1);
  } else {
    topLeft     = tileConstructSVG (coordTopLeft, colorRect, rec);
  }

  const coordTopRight = {x: nx + 1, y: ny,     z: nz} ;

  if (rec > 0 && isTileInfoMoreThanOne(coordTopRight)) {
    topRight     = tileConstructSubSVG ( coordTopRight, colorRect, rec-1);
  } else {
    topRight     = tileConstructSVG ( coordTopRight, colorRect, rec);
  }

  const coordBottomRight = {x: nx + 1, y: ny + 1, z: nz} ;

  if (rec > 0 && isTileInfoMoreThanOne(coordBottomRight)) {
    bottomRight     = tileConstructSubSVG ( coordBottomRight, colorRect, rec-1);
  } else {
    bottomRight     = tileConstructSVG ( coordBottomRight, colorRect, rec);
  }

  const coordBottomLeft = {x: nx,     y: ny + 1, z: nz} ;

  if (rec > 0 && isTileInfoMoreThanOne(coordBottomLeft)) {
    bottomLeft     = tileConstructSubSVG ( coordBottomLeft, colorRect, rec-1);
  } else {
    bottomLeft     = tileConstructSVG ( coordBottomLeft, colorRect, rec);
  }

  return `
  <svg width="256px" height="256px" viewBox="0 0 512 512" preserveAspectRatio="none">
    <svg width="256px" height="256px" viewBox="0 0 256 256" preserveAspectRatio="none">
      ${topLeft}
    </svg>
  </svg>
  <svg width="256px" height="256px" viewBox="-256 0 512 512" preserveAspectRatio="none">
    <svg width="256px" height="256px" viewBox="0 0 256 256" preserveAspectRatio="none">
      ${topRight}
    </svg>
  </svg>
  <svg width="256px" height="256px" viewBox="-256 -256 512 512" preserveAspectRatio="none">
    <svg width="256px" height="256px" viewBox="0 0 256 256" preserveAspectRatio="none">
      ${bottomRight}
    </svg>
  </svg>
  <svg width="256px" height="256px" viewBox="0 -256 512 512" preserveAspectRatio="none">
    <svg width="256px" height="256px" viewBox="0 0 256 256" preserveAspectRatio="none">
      ${bottomLeft}
    </svg>
  </svg>
`;
}

export { tileConstruct }