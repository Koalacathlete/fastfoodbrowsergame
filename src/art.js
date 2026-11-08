const paths = {
  burger:
    '<path d="M4 10a8 8 0 0 1 16 0H4Zm0 4h16M5 18h14M8 6l1 1m4-2v1m3 0-1 1"/>',
  counter:
    '<path d="M3 10h18v10H3zM5 10V5h9v5m-6 4h3m6 0h1M2 20h20M16 6h4m-2-2v4"/>',
  menu: '<rect x="5" y="3" width="14" height="18" rx="2"/><path d="M9 7h6m-6 5h6m-6 4h4"/>',
  shop: '<path d="m3 9 2-6h14l2 6M4 12v8h16v-8M3 9c0 3 3 3 4 0 1 3 4 3 5 0 1 3 4 3 5 0 1 3 4 3 4 0M9 20v-6h6v6"/>',
  arrow: '<path d="M5 12h14m-5-5 5 5-5 5"/>',
  chevron: '<path d="m9 5 7 7-7 7"/>',
  coins:
    '<ellipse cx="12" cy="6" rx="8" ry="3"/><path d="M4 6v6c0 4 16 4 16 0V6M4 12v6c0 4 16 4 16 0"/>',
  wallet:
    '<path d="M20 7H5a2 2 0 0 1 0-4h13v4M3 5v14a2 2 0 0 0 2 2h15V7m-4 5h5v5h-5z"/>',
  people:
    '<circle cx="9" cy="7" r="3"/><path d="M3 20v-3a6 6 0 0 1 12 0v3m1-16a3 3 0 0 1 0 6m2 4a5 5 0 0 1 3 5v1"/>',
  trend: '<path d="m3 17 6-6 4 4 8-10m-6 0h6v6"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1 1m12 12 1 1M5 19l1-1M18 6l1-1"/>',
  star: '<path d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2L12 17.3l-5.6 2.9 1.1-6.2L3 9.6l6.2-.9Z"/>',
  check: '<path d="m5 12 4 4L19 6"/>',
  help: '<circle cx="12" cy="12" r="9"/><path d="M9.5 8a2.5 2.5 0 0 1 5 .5c0 2-2.5 2-2.5 4m0 4h.01"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  pause: '<path d="M8 5v14M16 5v14"/>',
  play: '<path d="m8 4 12 8-12 8Z"/>',
  close: '<path d="m6 6 12 12M6 18 18 6"/>',
  reset: '<path d="M3 11a9 9 0 1 1 3 8M3 4v7h7"/>',
  edit: '<path d="m14 5 5 5M4 20l5-1L21 7a2 2 0 0 0-5-5L4 14z"/>',
  chair:
    '<path d="M6 11V5a3 3 0 0 1 3-3h6a3 3 0 0 1 3 3v6M4 10v7h16v-7M7 17v5m10-5v5M4 13h16"/>',
  sign: '<path d="M6 2h12l4 19h-3L16 5H8L5 21H2ZM8 10h8m-9 5h10"/>',
  spatula: '<path d="m14 13-9 9m8-19 8 8-6 6-8-8zM12 7l5 5m-2-8 5 5"/>',
  plant:
    '<path d="M7 16h10l-2 6H9zm5 0V8c0-4 6-5 8-5 0 5-3 9-8 8M12 14C5 14 3 10 3 6c5 0 9 2 9 8"/>',
  spark:
    '<path d="m12 2 2.5 7.5L22 12l-7.5 2.5L12 22l-2.5-7.5L2 12l7.5-2.5Z"/>',
  lock: '<rect x="5" y="10" width="14" height="11" rx="2"/><path d="M8 10V6a4 4 0 0 1 8 0v4m-4 5v2"/>',
  leaf: '<path d="M20 3C5 2 1 10 6 16s16 1 14-13ZM5 21 16 8"/>',
  flag: '<path d="M5 22V3c5-4 9 4 15 0v11c-6 4-10-4-15 0"/>',
};
export function icon(name, cls = "", size = 20) {
  return `<svg class="icon ${cls}" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.65" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[name] || paths.burger}</svg>`;
}

export function burgerArt(item = {}, large = false) {
  const ingredients = item.ingredients || [
    "bun",
    "beef",
    "cheese",
    "lettuce",
    "tomato",
    "sauce",
  ];
  if (item.kind === "side")
    return `<svg class="food-art" viewBox="0 0 220 160" aria-hidden="true"><ellipse cx="110" cy="144" rx="64" ry="9" fill="#dfd9c9"/><g stroke="#be883d" stroke-width="2" fill="#f3c963"><path d="m64 98-7-69 13-2 10 73m1-1L78 18l14-1 4 83m4-1 2-87 14 1-1 87m9 1 10-80 14 2-9 79m4 0 13-68 13 4-13 65"/></g><path d="m55 77 110 1-15 65H71Z" fill="#cd6042" stroke="#ae4f35" stroke-width="2"/><path d="m63 83 10 54h74l11-54" stroke="#e9906c" stroke-width="2" fill="none"/><circle cx="110" cy="108" r="19" fill="#f9ebc8"/><path d="M99 108h22m-19 6h16m-18-12a10 10 0 0 1 20 0" stroke="#b9583b" fill="none" stroke-width="3" stroke-linecap="round"/></svg>`;
  if (item.kind === "drink")
    return `<svg class="food-art" viewBox="0 0 220 160" aria-hidden="true"><ellipse cx="110" cy="144" rx="52" ry="9" fill="#dfd9c9"/><path d="m85 21 48-4-9 126H94Z" fill="#f5d379" stroke="#c7a451" stroke-width="2"/><path d="m83 20 52-4 1 9-52 4Z" fill="#fff5d7" stroke="#c7a451" stroke-width="2"/><path d="m113 20 7-17h22" stroke="#57765a" stroke-width="5" fill="none" stroke-linecap="round"/><path d="m88 57 43-4-5 57-34 3Z" fill="#f9e9a3"/><circle cx="110" cy="82" r="18" fill="#f5c95e" stroke="#fff9db" stroke-width="3"/><path d="M110 65v34m-15-25 30 16m-30 0 30-16" stroke="#fff9db" stroke-width="2"/><path d="m98 40 7-1-1 8-7 1m19-10 7-1-1 8-7 1" fill="#fff8da" opacity=".8"/></svg>`;
  const has = (id) => ingredients.includes(id);
  return `<svg class="food-art ${large ? "large" : ""}" viewBox="0 0 220 160" aria-hidden="true">
    <ellipse cx="110" cy="142" rx="79" ry="10" fill="#bdb5a0" opacity=".25"/>
    <path d="M37 119h146c-2 20-14 24-73 24s-71-4-73-24Z" fill="#dfa05b" stroke="#a16b39" stroke-width="2"/><path d="M44 126c34 9 101 8 131-1" stroke="#f4c47e" stroke-width="5" fill="none" stroke-linecap="round"/>
    ${has("lettuce") ? '<path d="m34 111 14-7 15 4 15-5 17 6 17-7 17 6 15-5 16 5 15-5 12 9-9 10-18-5-14 6-18-6-18 7-16-6-16 6-17-7-16 4Z" fill="#83a753" stroke="#5e7d3c" stroke-width="2"/>' : ""}
    <path d="M39 98q71-14 142 0l-2 13c-42 7-99 7-138 0Z" fill="${has("veggie") ? "#79733f" : has("chicken") ? "#c18d47" : "#70503b"}" stroke="#58412e" stroke-width="2"/><path d="M49 102h122" stroke="#b6854f" stroke-width="3" stroke-linecap="round" stroke-dasharray="7 8"/>
    ${has("cheese") ? '<path d="m34 92 144-3 8 9-44 1-17 17-28-16-55 3Z" fill="#f5c94e" stroke="#d4a437" stroke-width="1.5"/>' : ""}
    ${has("bacon") ? '<path d="m40 88 23-5 24 5 22-5 23 5 23-5 24 5" stroke="#aa5b40" stroke-width="8" fill="none"/><path d="m40 88 23-5 24 5 22-5 23 5 23-5 24 5" stroke="#d89167" stroke-width="2" fill="none"/>' : ""}
    ${has("tomato") ? '<path d="M38 81q72-10 144 0v8q-72 9-144 0Z" fill="#d66c4c" stroke="#b6553a" stroke-width="2"/><path d="M49 83h118" stroke="#ef9a72" stroke-width="2" stroke-dasharray="22 10"/>' : ""}
    ${has("pickles") ? '<g fill="#9eae5e" stroke="#708341" stroke-width="2"><ellipse cx="76" cy="78" rx="28" ry="7"/><ellipse cx="142" cy="78" rx="29" ry="7"/></g>' : ""}
    ${has("sauce") ? '<path d="M41 74q17-6 29 0t29 0 29 0 29 0 23 0" fill="none" stroke="#e3b672" stroke-width="7" stroke-linecap="round"/>' : ""}
    <path d="M35 68c3-35 29-52 75-52s72 17 75 52c-25 13-123 14-150 0Z" fill="#edb66b" stroke="#b78246" stroke-width="2"/>
    <path d="M45 55c9-23 28-31 53-32" stroke="#f6ce91" stroke-width="5" fill="none" stroke-linecap="round"/>
    <g stroke="#fff0c8" stroke-width="3.5" stroke-linecap="round"><path d="m64 47 4-3m18-10 3 3m18 12 4-1m16-17 2 4m19 7 4 2m-1 13 3-1m-69 9 3-1m47-2 3-3m-20-31 4 1"/></g>
  </svg>`;
}

export function avatarArt(index = 0) {
  const colors = [
    "#bc714f",
    "#7b8867",
    "#dcad70",
    "#8b91aa",
    "#cc8676",
    "#6a8b88",
  ];
  const skin = ["#e5b085", "#bd835e", "#f0c5a0", "#a86948"][index % 4];
  return `<svg viewBox="0 0 64 64" aria-hidden="true"><rect width="64" height="64" rx="32" fill="${colors[index % colors.length]}30"/><path d="M10 64c0-21 10-28 22-28s22 7 22 28" fill="${colors[index % colors.length]}"/><path d="M26 39v8c4 4 8 4 12 0v-8" fill="${skin}"/><ellipse cx="32" cy="26" rx="14" ry="17" fill="${skin}"/><path d="M18 27c-6-22 25-30 29-9l-2 11-5-12c-4 6-11 7-18 5l-2 9Z" fill="${index % 3 === 0 ? "#4c382d" : index % 3 === 1 ? "#806044" : "#b77a43"}"/><path d="M26 29h1m10 0h1m-9 7q3 3 6 0" stroke="#523c30" stroke-width="2" stroke-linecap="round" fill="none"/>${index % 3 === 1 ? '<g stroke="#4c4c40" fill="none" stroke-width="1.5"><rect x="21" y="25" width="9" height="8" rx="3"/><rect x="34" y="25" width="9" height="8" rx="3"/><path d="M30 28h4"/></g>' : ""}</svg>`;
}

export function storefrontArt(open = false, plants = 0, seating = 0, sign = 0) {
  return `<svg class="storefront-art" viewBox="0 0 760 390" role="img" aria-label="An illustrated neighborhood burger shop with a striped awning, plants, and a sidewalk sign">
    <defs><pattern id="paving" width="100" height="36" patternUnits="userSpaceOnUse"><path d="M0 35h100M50 0v35" stroke="#c7c7b3" stroke-width="1" opacity=".55"/></pattern><pattern id="brick" width="60" height="32" patternUnits="userSpaceOnUse"><path d="M0 31h60M30 0v31" stroke="#c29b79" opacity=".16" fill="none"/></pattern></defs>
    <rect width="760" height="390" fill="#ecebdc"/>
    <circle cx="596" cy="103" r="72" fill="#edc797" opacity=".55"/>
    <path d="M0 286h760v104H0Z" fill="#dbdcca"/><path d="M0 315h760v75H0Z" fill="url(#paving)"/>
    <path d="M43 286V149h76V86h78v200m413 0V135h62v-33h88v184" fill="#d9ddcc"/>
    <path d="M67 168h19v34H67zm70-62h22v33h-22zm15 64h22v34h-22zm482-9h16v34h-16zm58-36h22v34h-22zm-9 70h22v34h-22z" fill="#bdc7af" opacity=".55"/>
    <ellipse cx="387" cy="324" rx="268" ry="18" fill="#9eaa8e" opacity=".2"/>
    <path d="M158 101h436v207H158Z" fill="#e7b58e" stroke="#8b7052" stroke-width="2"/><path d="M158 101h436v207H158Z" fill="url(#brick)"/>
    <rect x="172" y="70" width="410" height="39" rx="2" fill="#335b46" stroke="#294d3c" stroke-width="2"/>
    <text x="377" y="96" text-anchor="middle" font-family="Georgia,serif" font-size="23" fill="#f3e5be" letter-spacing="5">THE DAILY BUN</text>
    <path d="m155 110-19 43h480l-20-43Z" fill="#f6e7c7" stroke="#52654b" stroke-width="2"/>
    <g fill="#335b46"><path d="m166 111-13 41h34l10-41zm61 0-7 41h34l4-41zm61 0-1 41h34l-2-41zm61 0 4 41h34l-7-41zm61 0 10 41h34l-13-41zm61 0 16 41h34l-19-41zm61 0 22 41h34l-25-41z"/></g>
    <path d="M136 153h480v9q-16 17-33 0-16 17-33 0-16 17-33 0-16 17-33 0-16 17-33 0-16 17-33 0-16 17-33 0-16 17-33 0-16 17-33 0-16 17-33 0-16 17-33 0-16 17-33 0-16 17-33 0-16 17-33 0-16 17-18 0Z" fill="#335b46" stroke="#294d3c" stroke-width="1.5"/>
    <rect x="181" y="180" width="102" height="126" rx="2" fill="#395e4c"/><rect x="191" y="190" width="82" height="84" fill="#a8ba9b"/>
    <path d="m195 192 74 59v-59m-74 0v27l74 53" fill="#bfcbb0" opacity=".45"/>
    <rect x="224" y="226" width="49" height="23" rx="2" fill="#f8ead0" transform="rotate(-5 248 238)"/>
    <text x="249" y="241" font-family="sans-serif" font-size="9" font-weight="700" letter-spacing="1.5" text-anchor="middle" fill="#45644b" transform="rotate(-5 248 238)">${open ? "OPEN" : "HELLO!"}</text>
    <path d="M267 281v10" stroke="#edc58b" stroke-width="3" stroke-linecap="round"/>
    <rect x="300" y="180" width="263" height="107" rx="2" fill="#365b46"/><rect x="308" y="188" width="247" height="91" fill="#a3b197"/>
    <path d="m310 190 113 87h29l-115-87m99 0 117 87v-30l-91-67" fill="#c5d0b8" opacity=".4"/>
    <path d="M432 181v105" stroke="#365b46" stroke-width="6"/>
    <text x="370" y="211" text-anchor="middle" fill="#f9efce" font-family="sans-serif" font-weight="700" font-size="10" letter-spacing="2">GOOD FOOD.</text>
    <text x="370" y="226" text-anchor="middle" fill="#f9efce" font-family="sans-serif" font-weight="700" font-size="10" letter-spacing="2">GOOD MOOD.</text>
    <g transform="translate(344 237) scale(.43)"><path d="M0 28C0-10 120-10 120 28Z" fill="#e9b367" stroke="#89643d" stroke-width="3"/><path d="M0 39h120M0 53h120" stroke="#dca562" stroke-width="10" stroke-linecap="round"/><path d="M0 44h120" stroke="#51673c" stroke-width="5"/><path d="m30 10 6-2m18 3 5-3m20 4 6 2" stroke="#fff1c4" stroke-width="3" stroke-linecap="round"/></g>
    <path d="M489 188v23" stroke="#294d3c" stroke-width="2"/><path d="M473 226a16 16 0 0 1 32 0Z" fill="#e9b367"/><path d="M473 227h32" stroke="#d9a456" stroke-width="2"/>
    <rect x="466" y="250" width="57" height="29" rx="3" fill="#e8d3ac"/><path d="M477 258h34m-34 7h25" stroke="#af9670" stroke-width="2"/>
    <rect x="297" y="285" width="270" height="9" fill="#657e57"/><rect x="177" y="306" width="111" height="8" rx="2" fill="#a2a58b"/>
    <g transform="translate(115 235)"><path d="M10 78 3 42h44l-7 36Z" fill="#b77b53" stroke="#8d6849" stroke-width="2"/><path d="M24 44V-9M23 27C4 23 4 6 7 2c16 2 20 12 16 25m2-8C43 14 48 2 45-6 28-5 23 5 25 19M22 2C7-3 6-18 10-24 23-21 28-10 22 2" fill="#6e8960" stroke="#4e6c49" stroke-width="2"/></g>
    <g transform="translate(590 250)"><path d="m0 64-5-29h34l-5 29Z" fill="#cb9470" stroke="#8d6849" stroke-width="2"/><path d="M12 35V-8M12 27C-3 22-8 8-5 1 7 1 16 14 12 27m1-11C30 14 37 2 33-5 19-4 11 5 13 16" fill="#6e8960" stroke="#4e6c49" stroke-width="2"/></g>
    <g transform="translate(490 267)"><path d="m7 59 12-68h47l13 68m-61-68 11 68m-22-3h24" fill="#e3c29a" stroke="#765d40" stroke-width="3"/><path d="m24-2-8 48h49L58-2Z" fill="#335b46"/><text x="41" y="15" text-anchor="middle" fill="#e8dcba" font-family="Georgia,serif" font-size="11">${sign ? "COME ON" : "FRESH"}</text><text x="41" y="29" text-anchor="middle" fill="#e8dcba" font-family="Georgia,serif" font-size="11">${sign ? "IN!" : "DAILY"}</text><path d="M29 36h23" stroke="#d9cba7" stroke-width="1"/></g>
    <g transform="translate(312 304)"><path d="M0 4h93v8H0Z" fill="${seating ? "#b97852" : "#a78764"}" stroke="#7d6d50" stroke-width="2"/><path d="M9 12v23m75-23v23M0-11h93v9H0Z" stroke="#7d6d50" stroke-width="3" fill="#b59572"/></g>
    ${plants ? '<g fill="#718b5a"><circle cx="330" cy="279" r="12"/><circle cx="350" cy="279" r="10"/><circle cx="370" cy="279" r="12"/></g><path d="m316 280 4 14h62l4-14" fill="#b47955"/>' : ""}
    <g stroke="#839174" stroke-width="2" fill="none"><path d="m74 325 5-12 3 11m577 19 3-14 6 11m-438 19 4-12 5 11"/></g>
    <path d="M43 80h29m-14-14v28m609-33h18m-9-9v18" stroke="#a3ad8d" stroke-width="2" stroke-linecap="round"/>
    <text x="47" y="375" font-family="monospace" font-size="9" letter-spacing="2" fill="#849078">YOUR LITTLE CORNER OF THE NEIGHBORHOOD</text>
  </svg>`;
}
