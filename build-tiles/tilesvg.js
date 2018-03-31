module.exports = function (ip, whois, designation, date) {

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
     fillRect="#f0f0f0";
  }
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
  <rect x="3" y="3" width="250" height="250" 
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