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
      fillRect="#EC3232";
      break;
    case 'RIPE':
      fillRect="#6320EE";
      break;
    case 'AFRINIC':
      fillRect="#31B793";
      break;
    case 'ARIN':
      fillRect="#FF9F1C";
      break;
    case 'LACNIC':
      fillRect="#FFFCF2";
      break;
    default:
     fillRect="#FFFFFF";
  }
  
  fillRect = colorObjectToString( meanColor(colorStringToObject(fillRect), stringToColour(designation)) );

  return fillRect;
}

function getTextColor(fillRect) {
  const colorFillRect = colorStringToObject(fillRect);
  let targetColor ;
  // if too bright
  if (colorFillRect.r*299+colorFillRect.g*587+colorFillRect.b*114 >= 128000 ){
    targetColor = colorStringToObject("#000000")
  } else {
    targetColor = colorStringToObject("#eeeeee")
  }
  const textColor = colorObjectToString( meanColor(targetColor, colorFillRect) );
  return textColor;
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


export function getXYZTileInfo (point,ipWhois){
  const ipTile: IPv4 = getIPFromXYZ(point.x,point.y,point.z);

  if (!ipTile) {
    return null;
  }

  let strIP: string = ipTile.toString();
  // single ip scale
  if (point.z < 16) {
      strIP += "/" + (point.z * 2) + "\n";
  }
  // list all Regional Internet Registries where my ip belong
  const resWhois = ipWhois.filter(filter, { ipStart: ipTile.pVal, ipEnd: ipTile.getLastIPMask(point.z * 2).pVal } );
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
}

export function getXYTile (point) {

  const ipTile: IPv4 = getIPFromXYZ(point.x,point.y,point.z);

  if (!ipTile) {
    return null;
  }

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
};
function isTileInfoMoreThanOne (point) {
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

function compareTiles (tile1, tile2) {
  return tile1.desc === tile2.desc && tile1.whois === tile2.whois ;
};

function genJoin(myNeighborsEquals, nbEqualsBtwThem, fillRect) {
  let join = "";
  // left top
  if (myNeighborsEquals[0][0] ||  ( myNeighborsEquals[1][0] && myNeighborsEquals[0][1] )){
    join += `
    <rect x="0" y="0" width="18" height="18" fill="${fillRect}" />
    `
    // if not equal left
    if (!myNeighborsEquals[1][0]){
      join += `
      <circle cx="-18" cy="18" r="21" />
      `
    }
    // if not equal top
    if (!myNeighborsEquals[0][1]){
      join += `
      <circle cx="18" cy="-18" r="21" />
      `
    }

  }

  
  // right bottom
  if (myNeighborsEquals[2][2] || ( myNeighborsEquals[1][2] && myNeighborsEquals[2][1] ) ){
    join += `
    <rect x="238" y="238" width="18" height="18" fill="${fillRect}" />
    `
    // if not equal with rigth
    if (!myNeighborsEquals[1][2]) {
      join += `
      <circle cx="274" cy="238" r="21" />
      `
    }
    // if not equal with bottom
    if (!myNeighborsEquals[2][1]) {
      join += `
      <circle cx="238" cy="274" r="21" />
      `
    }

  }

  // if current tile equals its top right neighbor,
  if (myNeighborsEquals[0][2] || ( myNeighborsEquals[0][1] && myNeighborsEquals[1][2] )) {
    join += `
    <rect x="238" y="0" width="18" height="18" fill="${fillRect}" />
    `
    // if not equal top
    if (!myNeighborsEquals[0][1]){
      join += `
      <circle cx="238" cy="-18" r="21" />
      `
    }
    // if not equal right
    if (!myNeighborsEquals[1][2]){
      join += `
      <circle cx="274" cy="18" r="21" />
      `
    }
  }

  // bottom left (or tile bottom and left equal)
  if (myNeighborsEquals[2][0] || ( myNeighborsEquals[2][1] && myNeighborsEquals[1][0] )) {
    join += `
    <rect x="0" y="238" width="18" height="18" fill="${fillRect}" />
    `
    // if not equal bottom
    if(!myNeighborsEquals[2][1]){
      join += `
      <circle cx="18" cy="274" r="21" />
      `
    }
    // if not equal left
    if (!myNeighborsEquals[1][0]){
      join += `
      <circle cx="-18" cy="238" r="21" />
      `
    }
    
  }

  if (!( myNeighborsEquals[1][0] && myNeighborsEquals[0][1] )){
    // Left top
    if (!myNeighborsEquals[0][0] && nbEqualsBtwThem.topLeft) {
      join += `
      <polygon points="0,0 6,0 0,6" fill="${getColorFromWhois(nbEqualsBtwThem.topLeft)}" />
      `
    }
  }

  if (!( myNeighborsEquals[1][2] && myNeighborsEquals[2][1] )) {
    // Right bottom
    if (!myNeighborsEquals[2][2] && nbEqualsBtwThem.botRight) {
      join += `
      <polygon points="256,256 250,256 256,250" fill="${getColorFromWhois(nbEqualsBtwThem.botRight)}" />
      `
    }
  }
    // . . .  
    // = = . not ? (because a rect fill it)
    // . = .  
  if (!(myNeighborsEquals[2][1] && myNeighborsEquals[1][0])){
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
  }

  if (!(myNeighborsEquals[0][1] && myNeighborsEquals[1][2])){
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
  return join;
}

function genMatrix (currentTile, zinit, bigTile){
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

  

  // ie: 10 - 8 = 2
  let deltaz = 0;
  if (bigTile){
    deltaz= currentTile.z - zinit;
  }

  for (var y=-1; y <= 1 ; y++){
      for (var x=-1; x <= 1; x++){
          if (y===0 && x===0) {
            continue;
          }
          const tileComp = {x: currentTile.x+x, y: currentTile.y+y, z: currentTile.z};
          if (deltaz > 0) {
            let tileAnsector = {x: tileComp.x >> deltaz,  y: tileComp.y >> deltaz,  z: zinit};
            if (!isTileInfoMoreThanOne(tileAnsector)) {
              continue;
            }
          }
          var neighborTile = getXYTile(tileComp);
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

  return {myNeighbors, myNeighborsEquals, nbEqualsBtwThem};
}

/**
 * Split a text into multiple lines given maximum length
 * @param myText Text to be cuted
 * @param maxLength Max length of a line
 */
export const splitTextMultipleLines = (myText, maxLength) => {
  const result = new Array();

  if ( myText.length > maxLength ) {
    
    const myStrings = myText.split(" ");
    let i = 0;

    do {
      let myLine = "";
      myLine = myStrings[i] ;
      i++;
      while (myLine.length < maxLength && i < myStrings.length) {          
        myLine += " " + myStrings[i] ;
        i++;
      }
      result.push(myLine);
    } while (i < myStrings.length) ;

  } else {
    result.push(myText);
  }
  return result;
}

/**
 * 
 * @param getXYTile 
 * @param compareTo 
 * @param coord 
 * @param colorRect 
 * @param z_level Information about z depth. When multiple sub tiles are computed, indicate at which level there are. z -> 0 indicates the tile will be very tiny. So it is not necessary to compute many details
 */
function tileConstructSVG (coord, z_level, zinit) {

  let stroke = "";
  let textcolor = "";

  const currentTile = getXYTile(coord);
  const whois       = currentTile.whois;
  let   designation = currentTile.desc;
  const date        = currentTile.date;

  const fillRect = getColorFromWhois({whois,designation});

  textcolor = getTextColor(fillRect);

  var join = "";
  var rect = {
    x:3,
    y:3,
    width:250,
    height:250
  } ;
  

  if (z_level > 0) {

    var {myNeighbors, myNeighborsEquals, nbEqualsBtwThem} = genMatrix (currentTile,zinit,false) ;

    const sizeMaskBorder = 16;
    
    var rectJoin = "";
    const offsetx = 2 ;
    const patchDepth = 2 ;
    const patchNbTiles = Math.pow(2, patchDepth);
    const patchWidth = (256-2*offsetx) / patchNbTiles ;
    const patchHeight = 15;
    const deeplevel = currentTile.z + patchDepth ;
    const comparable = z_level > 0 && currentTile.z <= 14 && ((currentTile.z <= 5 && deeplevel <= 5) || (currentTile.z > 5 && deeplevel > 5));
    let deepx;
    let deepy;

    // right
    if (myNeighborsEquals[1][2]) {
      rect.width+=sizeMaskBorder;
      stroke += `
      <line stroke-dasharray="4,4" x1="255" y1="10" x2="255" y2="245" />
      `
    } else {
      // big tile level
      if (comparable ) {
        deepx = (currentTile.x+1) * patchNbTiles ;
        deepy = currentTile.y * patchNbTiles ;
        for (let i =0 ; i < patchNbTiles ; i++){
          const tile1 = getXYTile({x: deepx  , y: deepy+i, z: deeplevel});
          const tile2 = getXYTile({x: deepx-1, y: deepy+i, z: deeplevel});
          if (tile1 && tile2 && compareTiles (tile1, tile2)) {
            rectJoin += `
            <rect x="${256-15}" y="${offsetx+i*patchWidth}" width="${patchHeight}" height="${patchWidth}" fill="${fillRect}" />
            <line stroke-dasharray="2,2" x1="255" y1="${offsetx+i*patchWidth}" x2="255" y2="${offsetx+(i+1)*patchWidth}" />
            `
          }
        }
      }
    }

    // left
    if (myNeighborsEquals[1][0]) {
      rect.x-=sizeMaskBorder;
      rect.width+=sizeMaskBorder;
    } else {
      // big tile level
      if (comparable ) {
        deepx = currentTile.x * patchNbTiles ;
        deepy = currentTile.y * patchNbTiles ;
        for (let i =0 ; i < patchNbTiles ; i++){
          const tile1 = getXYTile({x: deepx  , y: deepy+i, z: deeplevel});
          const tile2 = getXYTile({x: deepx-1, y: deepy+i, z: deeplevel});
          if (tile1 && tile2 && compareTiles (tile1, tile2)) {
            rectJoin += `
            <rect x="0" y="${offsetx+i*patchWidth}" width="${patchHeight}" height="${patchWidth}" fill="${fillRect}" />
            
            `
          }
        }
      }
    }

    // top
    if (myNeighborsEquals[0][1]) {
      rect.y-=sizeMaskBorder;
      rect.height+=sizeMaskBorder;
    } else {
      // big tile level
      if (comparable  ) {
        deepx = currentTile.x * patchNbTiles ;
        deepy = currentTile.y * patchNbTiles ;
        for (let i =0 ; i < patchNbTiles ; i++){
          const tile1 = getXYTile({x: deepx+i, y: deepy-1, z: deeplevel});
          const tile2 = getXYTile({x: deepx+i, y: deepy  , z: deeplevel});
          if (tile1 && tile2 && compareTiles (tile1, tile2)) {
            rectJoin += `
            <rect x="${offsetx+patchWidth*i}" y="0" width="${patchWidth}" height="${patchHeight}" fill="${fillRect}" />
            `
          }
        }
      }

    }

    // bottom
    if (myNeighborsEquals[2][1]) {
      rect.height+=16;
      stroke += `
      <line stroke-dasharray="4,4" x1="10" y1="255" x2="245" y2="255" />
      `
    } else {
      // big tile level
      if (comparable ) {
        deepx = currentTile.x * patchNbTiles ;
        deepy = (currentTile.y+1) * patchNbTiles ;
        for (let i =0 ; i < patchNbTiles ; i++){
          const tile1 = getXYTile({x: deepx+i, y: deepy-1, z: deeplevel});
          const tile2 = getXYTile({x: deepx+i, y: deepy  , z: deeplevel});
          if (tile1 && tile2 && compareTiles (tile1, tile2)) {
            rectJoin += `
            <rect x="${offsetx+patchWidth*i}" y="${256-15}" width="${patchWidth}" height="${patchHeight}" fill="${fillRect}" />
            <line stroke-dasharray="2,2" x1="${offsetx+i*patchWidth}" y1="255" x2="${offsetx+(i+1)*patchWidth}" y2="255" />
            `
          }
        }
      }
    }

    var {myNeighbors, myNeighborsEquals, nbEqualsBtwThem} = genMatrix (currentTile,zinit,true) ;
    join = genJoin(myNeighborsEquals, nbEqualsBtwThem, fillRect) ;


  }


  let arrDesign = splitTextMultipleLines(designation,25);
  let designationBloc = "";
  let designationStartY = 190;
  let designationLineHeight = 15;

  for (var i=0; i < arrDesign.length; i++ ){
    let result = `<text text-anchor="middle" x="128" y="${designationStartY+designationLineHeight*(i)}" font-size="13" fill="${textcolor}">
    <![CDATA[${arrDesign[i]}]]>
    </text>`;
    designationBloc += result;
  }

  return `

  ${join}

  <rect x="${rect.x}" y="${rect.y}" width="${rect.width}" height="${rect.height}" 
          rx="15" ry="15" fill="${fillRect}" />
  <text text-anchor="middle" x="128" y="64" font-size="22" fill="${textcolor}" >
    ${whois}
  </text>
  <text text-anchor="middle" x="128" y="132" font-size="25" fill="${textcolor}">
    ${currentTile.ip}
  </text>
  ${designationBloc}
  <text text-anchor="end" x="240" y="240" font-size="16" fill="${textcolor}">
    ${date}
  </text>
  ${rectJoin}
  ${stroke}
  
`;
}

function tileConstruct ( coord) {
  
  let svgcontent ;

  if (isTileInfoMoreThanOne(coord)) {
    svgcontent = tileConstructSubSVG ( coord, 2, coord.z);
  } else {
    svgcontent = tileConstructSVG ( coord, 3, coord.z);
  }

  return `<?xml version="1.0" standalone="no"?>
<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" 
  "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">

<svg width="256px" height="256px" version="1.1"
     viewBox="0 0 256 256" preserveAspectRatio="none"
     xmlns="http://www.w3.org/2000/svg" shape-rendering="geometricPrecision">
  <defs>
  <style type="text/css">
    <![CDATA[
    text {
      font-family: "Open Sans",arial,x-locale-body,sans-serif;
    
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
  ${svgcontent}
</svg>
`;
}

function tileConstructSubSVG (coord, rec, zinit) {
  const nx = coord.x * 2;
  const ny = coord.y * 2;
  const nz = coord.z + 1;

  let topLeft    ;
  let topRight   ;
  let bottomRight;
  let bottomLeft ;
  
  const coordTopLeft = {x: nx,     y: ny,     z: nz} ;

  if (rec > 0 && isTileInfoMoreThanOne(coordTopLeft)) {
    topLeft     = tileConstructSubSVG ( coordTopLeft, rec-1, zinit);
  } else {
    topLeft     = tileConstructSVG (coordTopLeft, rec, zinit);
  }

  const coordTopRight = {x: nx + 1, y: ny,     z: nz} ;

  if (rec > 0 && isTileInfoMoreThanOne(coordTopRight)) {
    topRight     = tileConstructSubSVG ( coordTopRight, rec-1, zinit);
  } else {
    topRight     = tileConstructSVG ( coordTopRight, rec, zinit);
  }

  const coordBottomRight = {x: nx + 1, y: ny + 1, z: nz} ;

  if (rec > 0 && isTileInfoMoreThanOne(coordBottomRight)) {
    bottomRight     = tileConstructSubSVG ( coordBottomRight, rec-1, zinit);
  } else {
    bottomRight     = tileConstructSVG ( coordBottomRight, rec, zinit);
  }

  const coordBottomLeft = {x: nx,     y: ny + 1, z: nz} ;

  if (rec > 0 && isTileInfoMoreThanOne(coordBottomLeft)) {
    bottomLeft     = tileConstructSubSVG ( coordBottomLeft, rec-1, zinit);
  } else {
    bottomLeft     = tileConstructSVG ( coordBottomLeft, rec, zinit);
  }

  const currentTile = getXYTile(coord);
  const whois       = currentTile.whois;
  const designation = currentTile.desc;
  //const date        = currentTile.date;

  const fillRect = getColorFromWhois({whois,designation});
  var {myNeighbors, myNeighborsEquals, nbEqualsBtwThem} = genMatrix (currentTile,zinit,true) ;
myNeighborsEquals = [
    [false,false,false],
    [false,false,false],
    [false,false,false]
];
  const join = genJoin(myNeighborsEquals, nbEqualsBtwThem, fillRect) ;

  const initSize = 256;
  const offset = 0 ;
  const sizeblock = initSize-offset;

  return `
  ${join}
  <svg width="${sizeblock}px" height="${sizeblock}px" viewBox="-${offset} -${offset} 512 512" preserveAspectRatio="none">
    <svg width="256px" height="256px" viewBox="0 0 256 256" preserveAspectRatio="none">
      ${topLeft}
    </svg>
  </svg>
  <svg width="${sizeblock}px" height="${sizeblock}px" viewBox="-${initSize+offset} -${offset} 512 512" preserveAspectRatio="none">
    <svg width="256px" height="256px" viewBox="0 0 256 256" preserveAspectRatio="none">
      ${topRight}
    </svg>
  </svg>
  <svg width="${sizeblock}px" height="${sizeblock}px" viewBox="-${initSize+offset} -${initSize+offset} 512 512" preserveAspectRatio="none">
    <svg width="256px" height="256px" viewBox="0 0 256 256" preserveAspectRatio="none">
      ${bottomRight}
    </svg>
  </svg>
  <svg width="${sizeblock}px" height="${sizeblock}px" viewBox="-${offset} -${initSize+offset} 512 512" preserveAspectRatio="none">
    <svg width="256px" height="256px" viewBox="0 0 256 256" preserveAspectRatio="none">
      ${bottomLeft}
    </svg>
  </svg>
`;
}

export { tileConstruct }