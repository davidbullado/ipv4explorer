
function getColorFromWhois (whois) {
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
     fillRect="white";
  }
  return fillRect;
}

module.exports = function (ip, whois, designation, date, neighbors, nbEqualsBtwThem) {

  var fillRect = getColorFromWhois(whois);

  var rect = {
    x:3,
    y:3,
    width:250,
    height:250
  }

  // right
  if (neighbors[1][2]) {
    rect.width+=15;
  }
  // left
  if (neighbors[1][0]) {
    rect.x-=15;
    rect.width+=15;
  }
  // top
  if (neighbors[0][1]) {
    rect.y-=15;
    rect.height+=15;
  }
  // bottom
  if (neighbors[2][1]) {
    rect.height+=15;
  }

  var join = "";
  // left top
  if (neighbors[0][0]){
    join += `
    <rect x="0" y="0" width="18" height="18" fill="${fillRect}" />
    <circle cx="-18" cy="18" r="21" fill="white" />
    <circle cx="18" cy="-18" r="21" fill="white" />
    `
  }
  // right bottom
  if (neighbors[2][2]){
    join += `
    <rect x="238" y="238" width="18" height="18" fill="${fillRect}" />
    <circle cx="238" cy="274" r="21" fill="white" />
    <circle cx="274" cy="238" r="21" fill="white" />
    `
  }

  // if current tile equals its top right neighbor,
  if (neighbors[0][2]) {
    join += `
    <rect x="238" y="0" width="18" height="18" fill="${fillRect}" />
    <circle cx="238" cy="-18" r="21" fill="white" />
    <circle cx="274" cy="18" r="21" fill="white" />
    `
  }

  // bottom left
  if (neighbors[2][0]) {
    join += `
    <rect x="0" y="238" width="18" height="18" fill="${fillRect}" />
    <circle cx="-18" cy="238" r="21" fill="white" />
    <circle cx="18" cy="274" r="21" fill="white" />
    `
  }
  /*var nbEqualsBtwThem = {
    topRigth: "",
    rigthBot: "",
    botLeft: "",
    leftTop: ""
}*/

  // Left top
  if (!neighbors[0][0] && nbEqualsBtwThem.leftTop.length > 0) {
    join += `
    <polygon points="0,0 6,0 0,6" fill="${getColorFromWhois(nbEqualsBtwThem.leftTop)}" />
    `
  }

  // Right bottom
  if (!neighbors[2][2] && nbEqualsBtwThem.rigthBot.length > 0) {
    join += `
    <polygon points="256,256 250,256 256,250" fill="${getColorFromWhois(nbEqualsBtwThem.rigthBot)}" />
    `
  }

  // cross : patch with triangle
  if (neighbors[2][0] && nbEqualsBtwThem.botLeft.length > 0) {
    join += `
    <polygon points="0,256 0,250 6,256" fill="${getColorFromWhois(nbEqualsBtwThem.botLeft)}" />
    `
  } else {
    if (nbEqualsBtwThem.botLeft.length > 0) {
      join += `
      <rect x="0" y="250" width="6" height="6" fill="${getColorFromWhois(nbEqualsBtwThem.botLeft)}" />
      <circle cx="18" cy="238" r="21" fill="white" />
      `
    }
  }

  // cross : patch with triangle
  if (neighbors[0][2] &&  nbEqualsBtwThem.topRigth.length > 0) {
    join += `
    <polygon points="256,0 250,0 256,6" fill="${getColorFromWhois(nbEqualsBtwThem.topRigth)}" />
    `
  } else {
    // otherwise, top and rigth are equal
    if ( nbEqualsBtwThem.topRigth.length > 0 ) {
      join += `
      <rect x="250" y="0" width="6" height="6" fill="${getColorFromWhois(nbEqualsBtwThem.topRigth)}" />
      <circle cx="238" cy="18" r="21" fill="white" />
      `
    }
  }


  /*// top right
  if (neighbors[0][2]) {
    nbEqualsBtwThem.topRigth = whois;
  }
  // right bottom
  if (neighbors[2][2]) {
    nbEqualsBtwThem.rigthBot = whois;
  }
  // bottom left
  if (neighbors[2][0]) {
    nbEqualsBtwThem.botLeft = whois;
  }
  // left top
  if (neighbors[0][0]) {
    nbEqualsBtwThem.leftTop = whois;
  }
  */

  return `<?xml version="1.0" standalone="no"?>
<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" 
  "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">

<svg width="256px" height="256px" version="1.1"
     viewBox="0 0 256 256" preserveAspectRatio="none"
     xmlns="http://www.w3.org/2000/svg">
  <defs>
    <style type="text/css">
    <![CDATA[
    text {
      font-family: "Open Sans",arial,x-locale-body,sans-serif;
      fill: #555;
    }
    ]]>
  </style>
  </defs>

  ${join}

  <rect x="${rect.x}" y="${rect.y}" width="${rect.width}" height="${rect.height}" 
          rx="15" ry="15" fill="${fillRect}" />
  <text text-anchor="middle" x="128" y="64" font-size="22"  >
    ${ip}/8
  </text>
  <text text-anchor="middle" x="128" y="132" font-size="25" >
    ${whois}
  </text>
  <text text-anchor="middle" x="128" y="190" font-size="13" >
  <![CDATA[${designation}]]>
  </text>
  <text text-anchor="end" x="240" y="240" font-size="16" >
    ${date}
  </text>
</svg>
`;
}