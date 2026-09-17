// Small, original vector illustrations, included directly in the static HTML.
const wrap = (body, viewBox = '0 0 400 300') => `<svg viewBox="${viewBox}" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">${body}</svg>`;
export const brandIcon = `<svg class="brand-icon" viewBox="0 0 44 44" fill="none" aria-hidden="true"><circle cx="22" cy="22" r="21" fill="#b81d34"/><path d="M22 31s-11-7-11-14a6 6 0 0 1 11-3 6 6 0 0 1 11 3c0 7-11 14-11 14Z" fill="#f5ead8"/></svg>`;
export const tableArt = wrap(`
  <defs><pattern id="cloth" width="44" height="44" patternUnits="userSpaceOnUse"><path d="M0 0h22v44H0zM0 0h44v22H0z" fill="#dba69f" fill-opacity=".48"/></pattern></defs>
  <path fill="url(#cloth)" d="M0 300h540v220H0z"/>
  <g transform="translate(61 35) rotate(-14 195 175)">
    <rect x="55" y="65" width="278" height="265" rx="3" fill="#f8faf6"/>
    <path d="M70 70v253m8-253v253M308 70v253m8-253v253" stroke="#c98a86" stroke-width="2"/>
    <circle cx="192" cy="190" r="111" fill="#c98a86" fill-opacity=".35"/>
    <circle cx="187" cy="181" r="111" fill="#fcfcf7" stroke="#78101f" stroke-width="2"/>
    <circle cx="187" cy="181" r="97" stroke="#78101f" stroke-width="1.5"/>
    <circle cx="187" cy="181" r="78" stroke="#dba69f" stroke-width="1"/>
    <path d="M187 204s-27-17-27-34c0-14 19-20 27-7 8-13 27-7 27 7 0 17-27 34-27 34Z" fill="#b81d34"/>
    <path d="M34 123v151m-10-151v40c0 13 20 13 20 0v-40m-10 0v44M343 121v153m0-153c-17 15-17 58 0 58" stroke="#78101f" stroke-width="3" stroke-linecap="round"/>
  </g>
  <g transform="translate(335 28) rotate(16 60 75)">
    <path d="M28 20h66l-4 46c-3 29-53 29-57 0z" fill="#fcfcf7" fill-opacity=".6" stroke="#78101f" stroke-width="2"/>
    <path d="M34 54h54l-2 13c-4 20-46 20-49 0z" fill="#b46b53" fill-opacity=".75"/>
    <path d="M61 90v58m-25 0h50" stroke="#78101f" stroke-width="2" stroke-linecap="round"/>
  </g>
  <g transform="translate(320 307) rotate(12)">
    <circle cx="58" cy="57" r="80" fill="#fbfcf7" stroke="#78101f" stroke-width="2"/>
    <circle cx="58" cy="57" r="67" stroke="#78101f"/>
    <path d="M25 34c12-15 37-20 51-11 9 6 16 23 11 34-5 12-40 23-56 15-13-7-17-27-6-38Z" fill="#dec198" stroke="#78101f" stroke-width="1.5"/>
    <path d="m42 28 8 40m8-45 7 39m9-34 7 24" stroke="#fcfcf7" stroke-width="6" stroke-linecap="round"/>
  </g>
  <path d="M80 374c29-43 62-17 83-36m-75 38c19 7 27 13 33 24m-10-45c-7-22-3-31 1-41" stroke="#527366" stroke-width="3" stroke-linecap="round"/>
  <path d="M87 372c-19-20-25-6-8 7m29-27c17-17 28-10 9 0m-6-17c-20-11-18-23-1-10m18 23c12 20 20 12 9 0m-23 40c-17 7-15 19 2 8" fill="#527366"/>
`, '0 0 540 500');

const arts = {
  daikaya: `<ellipse cx="203" cy="244" rx="122" ry="13" fill="#b58068" opacity=".18"/><path d="M85 140c5 75 48 105 114 105s110-30 116-105" fill="#fcfcf5" stroke="#78101f" stroke-width="2.5"/><path d="M101 175c46 30 154 30 198 0M109 193c42 26 135 26 181 0" stroke="#b81d34" stroke-width="3"/><ellipse cx="200" cy="140" rx="115" ry="43" fill="#fcfcf5" stroke="#78101f" stroke-width="2.5"/><ellipse cx="200" cy="141" rx="101" ry="33" fill="#bd794b"/><g stroke="#f5d78c" stroke-width="4" stroke-linecap="round"><path d="M122 142c20-30 43 30 65-3s42 21 72-5M120 150c27-30 48 28 68 0s43 21 87-7M144 161c20-28 39 11 61-9s39 19 58 2M148 121c15 21 27-4 44 7s28 3 35-3"/></g><ellipse cx="244" cy="128" rx="22" ry="30" transform="rotate(30 244 128)" fill="#fcfcf5" stroke="#78101f" stroke-width="1.5"/><ellipse cx="244" cy="129" rx="13" ry="16" fill="#edb143"/><path d="m129 120 12-32 37 15-12 25" fill="#466052"/><path d="m183 136 10 4m-28 4 9 4m29 6 10-8" stroke="#66834f" stroke-width="6"/><path d="m181 68 146 36M177 78l147 34" stroke="#78101f" stroke-width="5" stroke-linecap="round"/><path d="M194 51c-13-12 7-19 0-30m24 31c-12-12 8-20 2-31" stroke="#9f6a51" stroke-width="2" stroke-linecap="round"/>`,
  'carusos-grocery': `<ellipse cx="200" cy="169" rx="133" ry="97" fill="#fafaf3" stroke="#78101f" stroke-width="2"/><ellipse cx="200" cy="169" rx="117" ry="82" stroke="#668274" stroke-width="2"/><ellipse cx="200" cy="169" rx="91" ry="62" fill="#cf805d"/><g stroke="#f2d288" stroke-width="6" stroke-linecap="round"><path d="M136 163c30-43 74 63 114 2s-71-24-61 13 53 21 65-7M147 195c-42-41 37-78 81-48s-64 79-76 11M135 177c44 58 96-80 126-11s-73 53-75-1M159 128c-6 26 74 7 79 49s-94 25-83-12M129 171c13-26 31-32 52-28"/></g><path d="M189 144c-6-24 14-32 18-12 22-13 30 11 2 18" fill="#52785a" stroke="#78101f" stroke-width="1.3"/><path d="m155 189 6-3m68 4 6-3m-63-30 5-2" stroke="#fcfcf7" stroke-width="5"/><g transform="rotate(24 303 106)" stroke="#78101f" stroke-width="3" stroke-linecap="round"><path d="M303 40v162m-9-162v38c0 11 18 11 18 0V40m-6 0v39m-6-39v39"/></g>`,
  'le-diplomate': `<ellipse cx="183" cy="224" rx="121" ry="19" fill="#b49d60" opacity=".2"/><path d="M215 49h66l-3 54c-2 30-59 30-60 0z" fill="#fcfcf7" fill-opacity=".75" stroke="#78101f" stroke-width="2"/><path d="M219 84h59l-2 17c-2 24-53 24-55 0z" fill="#9e484d"/><path d="M248 126v78m-27 0h54" stroke="#78101f" stroke-width="2" stroke-linecap="round"/><ellipse cx="163" cy="202" rx="101" ry="42" fill="#fcfcf7" stroke="#78101f" stroke-width="2"/><ellipse cx="163" cy="202" rx="88" ry="31" stroke="#c98a86"/><path d="M96 204c-13-22 60-94 82-85 17 7 16 20 2 38l-58 57c-12 9-21-2-26-10Z" fill="#c99156" stroke="#78101f" stroke-width="2"/><path d="m145 140 18 13m-38 4 20 15m-39 6 21 14" stroke="#f5dfad" stroke-width="7" stroke-linecap="round"/><path d="m171 188 53-15 11 38-55 7z" fill="#efd68c" stroke="#78101f" stroke-width="1.5"/><circle cx="199" cy="195" r="3" fill="#cfa856"/><circle cx="222" cy="201" r="4" fill="#cfa856"/><path d="M100 106h28m-14-14v28" stroke="#78101f" stroke-width="1.5"/>`,
  perrys: `<path d="m65 136 198-32 80 90-211 47z" fill="#fafaf6" stroke="#78101f" stroke-width="2"/><path d="m80 139 182-28 68 80-197 42z" stroke="#a8b4bb"/><g transform="translate(122 144) rotate(-12)"><rect width="70" height="45" rx="19" fill="#fafaf3" stroke="#78101f" stroke-width="1.7"/><path d="M-5 5c4-20 63-20 77 0l-3 13C53 5 16 5-3 17Z" fill="#d68d7c" stroke="#78101f" stroke-width="1.7"/><path d="m13-5 12 18m10-22 12 19m8-13 9 14" stroke="#f3c1a7" stroke-width="3"/></g><g transform="translate(203 151) rotate(-12)"><rect width="70" height="45" rx="19" fill="#fafaf3" stroke="#78101f" stroke-width="1.7"/><path d="M-5 5c4-20 63-20 77 0l-3 13C53 5 16 5-3 17Z" fill="#d68d7c" stroke="#78101f" stroke-width="1.7"/><path d="m13-5 12 18m10-22 12 19m8-13 9 14" stroke="#f3c1a7" stroke-width="3"/></g><path d="m245 220 15-18 17 12-10 12z" fill="#859968"/><path d="m106 96 204-29m-205 37 207-29" stroke="#78101f" stroke-width="4" stroke-linecap="round"/><ellipse cx="99" cy="216" rx="28" ry="19" fill="#78101f" stroke="#fcfcf7" stroke-width="5"/>`,
};
export const restaurantArt = (id) => wrap(arts[id]);
