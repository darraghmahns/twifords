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
