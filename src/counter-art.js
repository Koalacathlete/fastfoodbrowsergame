export function interiorArt(plants = 0, seating = 0) {
  return `<svg class="interior-art" viewBox="0 0 1440 760" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
  <defs>
    <pattern id="wallpaper" width="38" height="38" patternUnits="userSpaceOnUse"><path d="M19 16v6m-3-3h6" stroke="#b8b49b" stroke-width="1" opacity=".3"/></pattern>
    <pattern id="floor" width="140" height="100" patternUnits="userSpaceOnUse"><path d="M0 0h70v50H0Zm70 50h70v50H70Z" fill="#d5cfb7"/></pattern>
    <linearGradient id="wall-light" x2="0" y2="1"><stop stop-color="#f0e7cd"/><stop offset="1" stop-color="#e6d7b8"/></linearGradient>
    <linearGradient id="glass" x2="0" y2="1"><stop stop-color="#b9d1be"/><stop offset="1" stop-color="#e5e8c9"/></linearGradient>
  </defs>
  <path fill="url(#wall-light)" d="M0 0h1440v760H0z"/><path fill="url(#wallpaper)" d="M0 0h1440v440H0z"/>
  <path d="M0 375h1440v120H0Z" fill="#9aa17b"/><path d="M0 378h1440m-1440 9h1440" stroke="#727f5c" stroke-width="4"/>
  <g stroke="#828c66" stroke-width="1" opacity=".5">${Array.from({ length: 30 }, (_, i) => `<path d="M${i * 50} 390v100"/>`).join("")}</g>
  <path d="M0 483h1440v277H0Z" fill="#eee6d0"/><path d="M0 483h1440v277H0Z" fill="url(#floor)" opacity=".6"/>
  <path d="M55 67h240v421H55Z" fill="#647d64" stroke="#405c49" stroke-width="8"/><path d="M72 85h206v315H72Z" fill="url(#glass)"/>
  <path d="M75 277h200v120H75Z" fill="#c6cbb0"/><path d="M76 330h200m-200 42h200" stroke="#ece7cb" stroke-width="6"/><path d="M72 278c17-82 55-82 75-18 19-106 87-89 95-14 20-50 37-27 36 32Z" fill="#8fa386"/>
  <path d="m80 95 191 190v-46L124 92m-45 52 194 194v-19L80 125" fill="#eff4d6" opacity=".35"/>
  <path d="M62 404h224M176 82v318" stroke="#647d64" stroke-width="9"/><path d="M263 414v36" stroke="#d8c18f" stroke-width="7" stroke-linecap="round"/>
  <path d="m95 188 163-10 2 79-163 10Z" fill="#f9e9bf" stroke="#d6bd86" stroke-width="2"/><path d="m120 187 38-38 67 31" fill="none" stroke="#7b795a" stroke-width="2"/><text x="178" y="219" text-anchor="middle" fill="#61734e" font-family="Georgia,serif" font-size="19" transform="rotate(-4 178 220)">come on in</text><text x="179" y="242" text-anchor="middle" fill="#9d9b75" font-family="sans-serif" font-size="9" letter-spacing="2" transform="rotate(-4 178 242)">GOOD DAYS SERVED DAILY</text>
  <rect x="338" y="90" width="400" height="270" rx="75" fill="#617b61" stroke="#4c6650" stroke-width="7"/><rect x="350" y="103" width="376" height="245" rx="64" fill="url(#glass)"/>
  <path d="M350 292c34-91 77-70 88-6 31-95 90-90 109-9 36-100 90-63 100-3 24-50 64-54 80 17v55H350Z" fill="#a6b08e"/><path d="M350 323h376" stroke="#e9e4c8" stroke-width="10"/><path d="m374 111 233 234h46L407 104m73 0 247 244v-37L522 105" fill="#f5f7da" opacity=".3"/><path d="M538 103v245" stroke="#617b61" stroke-width="10"/>
  <path d="M325 356h425v13H325Z" fill="#c09c70" stroke="#9c7f58" stroke-width="2"/>
  <g transform="translate(802 223)"><path d="M0 120h139v78H0Z" fill="${seating ? "#b96d4f" : "#ad8a68"}" stroke="#906d4c" stroke-width="3"/><path d="M0 122V70q0-17 17-17h105q17 0 17 17v52" fill="${seating ? "#ca8e68" : "#c2a181"}" stroke="#906d4c" stroke-width="3"/><path d="M68 54v65M14 140v58m110-58v58" stroke="#906d4c" stroke-width="3"/><path d="m-10 122 159 1v17H-10Z" fill="#d0ac7d" stroke="#9c7d55" stroke-width="3"/></g>
  <path d="M0 25h1440" stroke="#b6a27a" stroke-width="9"/><path d="M0 32h1440" stroke="#f4e9ca" stroke-width="4"/>
  <g fill="#365844" stroke="#294b39" stroke-width="2"><path d="M405 0v73m-49 37q0-44 49-44t49 44Z"/><path d="M875 0v73m-49 37q0-44 49-44t49 44Z"/></g><path d="M360 110h90m380 0h90" stroke="#e9c789" stroke-width="6" stroke-linecap="round"/>
  <ellipse cx="405" cy="127" rx="35" ry="8" fill="#f7e2ac" opacity=".5"/><ellipse cx="875" cy="127" rx="35" ry="8" fill="#f7e2ac" opacity=".5"/>
  <path d="M530 29h220v41H530Z" fill="#f5e9c5" stroke="#c3ab7d" stroke-width="2"/><text x="640" y="56" text-anchor="middle" font-family="Georgia,serif" font-size="18" fill="#6b7955" letter-spacing="2">THE DAILY BUN</text>
  <g transform="translate(34 350)"><path d="m0 110-7-68h70l-7 68Z" fill="#bd8862" stroke="#8f7151" stroke-width="3"/><path d="M29 44V-89M27 17C-7 9-10-30-5-43 22-42 36-5 27 17m3-32C62-24 75-58 68-74 39-71 23-39 30-15m-2-28C0-53 0-87 9-97c26 10 29 36 19 54" fill="#7c956b" stroke="#536f4b" stroke-width="3"/></g>
  ${plants ? '<g transform="translate(1350 250)"><path d="m0 160-9-63h70l-9 63Z" fill="#ba825e"/><path d="M25 100V-10M25 58C-8 59-16 26-10 13c27 0 40 23 35 45m2-26C62 25 73-2 65-20 36-16 20 5 27 32m-2-40C1-8-5-36 2-50c24 1 31 24 23 42" fill="#738e5c" stroke="#567347" stroke-width="3"/></g>' : ""}
  </svg>`;
}

export function guestArt(index = 0, paying = false) {
  const skin = ["#e4ae83", "#b9805e", "#f1c6a2", "#a96e50"][index % 4];
  const shade = ["#c98c67", "#9e694a", "#d9a780", "#8c573e"][index % 4];
  const shirt = [
    "#bd7553",
    "#7c9473",
    "#d4ae68",
    "#858fa6",
    "#c58275",
    "#64958a",
  ][index % 6];
  const hair = ["#503c30", "#816142", "#bd8450", "#382e2a"][index % 4];
  return `<svg viewBox="0 0 310 390" role="img" aria-label="A customer standing across the counter${paying ? ", holding their cash" : ""}">
  <ellipse cx="156" cy="382" rx="133" ry="8" fill="#5b5237" opacity=".1"/>
  <path d="M53 389 49 275q-2-72 60-86h92q63 15 61 86l-4 114Z" fill="${shirt}" stroke="#4e5c4545" stroke-width="3"/>
  <path d="m108 192 47 35 47-35-9 68h-77Z" fill="${shirt}"/><path d="M130 160v39q25 22 51 0v-39" fill="${skin}" stroke="${shade}" stroke-width="2"/>
  <path d="m108 189 21-6q6 23 26 32l-22 26Zm94 0-21-6q-6 23-26 32l22 26Z" fill="#fff5d4" opacity=".35"/>
  <ellipse cx="155" cy="105" rx="64" ry="78" fill="${hair}"/>
  <ellipse cx="97" cy="118" rx="13" ry="21" fill="${skin}" stroke="${shade}" stroke-width="2"/><ellipse cx="213" cy="118" rx="13" ry="21" fill="${skin}" stroke="${shade}" stroke-width="2"/>
  <path d="M101 93q0-64 55-64t55 64v41q-6 54-56 58-48-6-54-58Z" fill="${skin}" stroke="${shade}" stroke-width="2"/>
  ${index % 3 === 0 ? `<path d="M94 113q-20-78 37-93 63-21 88 46l-5 48-14-38q-39 11-80-12l-15 50Z" fill="${hair}"/><path d="M117 34q38-20 62 2" stroke="#fff7dc" stroke-width="5" opacity=".1" fill="none"/>` : index % 3 === 1 ? `<path d="M95 109q-16-59 16-82 30-27 66-5 43-3 42 57l-6 37-14-52q-30 27-80 7l-12 44Z" fill="${hair}"/><path d="M117 36q23-13 39-1" stroke="#fff7dc" stroke-width="5" opacity=".12" fill="none"/>` : `<path d="M94 112q-15-70 36-91 55-25 84 32l4 60-17-43q-25-8-43-32-17 36-51 46l-1 32Z" fill="${hair}"/>`}
  <path d="m121 104 14-2m42 0 14 2" fill="none" stroke="${hair}" stroke-width="4" stroke-linecap="round"/>
  <g fill="#4e3f32"><ellipse cx="129" cy="119" rx="4" ry="6"/><ellipse cx="182" cy="119" rx="4" ry="6"/></g><g fill="#fff8e5"><circle cx="130" cy="117" r="1.5"/><circle cx="183" cy="117" r="1.5"/></g>
  <path d="m155 120-4 19h8" stroke="${shade}" stroke-width="2.5" fill="none" stroke-linecap="round"/>
  <path d="M138 153q17 17 35-1" fill="#faf1d6" stroke="#85553b" stroke-width="2.5" stroke-linecap="round"/><ellipse cx="120" cy="140" rx="10" ry="5" fill="#d9796140"/><ellipse cx="190" cy="140" rx="10" ry="5" fill="#d9796140"/>
  ${index % 3 === 1 ? '<g fill="none" stroke="#59634c" stroke-width="3"><rect x="111" y="109" width="34" height="25" rx="9"/><rect x="165" y="109" width="34" height="25" rx="9"/><path d="M145 117h20m-63 0 9 2m88-2 13-2"/></g>' : ""}
  <path d="M89 256 72 322q-3 16 12 18l32-3m105-81 17 67q3 15-12 17l-31-3" fill="none" stroke="#425740" stroke-width="3" opacity=".25"/>
  <path d="M51 299q-21 9-18 45l9 24q7 12 22 6l49-13-8-26-33 6 5-33" fill="${skin}" stroke="${shade}" stroke-width="2"/><path d="M259 299q21 9 18 45l-9 24q-7 12-22 6l-49-13 8-26 33 6-5-33" fill="${skin}" stroke="${shade}" stroke-width="2"/>
  <path d="M48 280h37l-6 35-38-4m184-31h37l7 31-38 4" fill="${shirt}" stroke="#4e5c4525" stroke-width="2"/>
  <path d="m102 337 26-6q11-1 12 7 10 1 7 10 4 10-8 13l-29 4Z" fill="${skin}" stroke="${shade}" stroke-width="2"/><path d="m207 337-26-6q-11-1-12 7-10 1-7 10-4 10 8 13l29 4Z" fill="${skin}" stroke="${shade}" stroke-width="2"/>
  ${paying ? '<g transform="translate(104 322) rotate(-9 53 25)"><rect width="108" height="48" rx="3" fill="#b2c78d" stroke="#6b8c59" stroke-width="2"/><rect x="6" y="5" width="96" height="38" rx="5" fill="none" stroke="#819c68"/><ellipse cx="54" cy="24" rx="15" ry="18" fill="#8da873"/><text x="54" y="31" text-anchor="middle" font-family="Georgia,serif" font-size="22" fill="#e2e8ba">$</text><path d="M13 13h20m43 21h19" stroke="#819c68" stroke-width="3"/></g>' : ""}
  </svg>`;
}

export function countertopArt() {
  return `<svg class="countertop-art" viewBox="0 0 1440 310" preserveAspectRatio="none" aria-hidden="true"><defs><linearGradient id="wood" x2="0" y2="1"><stop stop-color="#c99562"/><stop offset="1" stop-color="#ddb17e"/></linearGradient><linearGradient id="front-wood" x2="0" y2="1"><stop stop-color="#a16f48"/><stop offset="1" stop-color="#815d42"/></linearGradient></defs><path d="M0 0h1440v212H0Z" fill="url(#wood)"/><g stroke="#ae784e" stroke-width="2" opacity=".45"><path d="M0 52h1440M0 112h1440M0 176h1440M200 0 90 212M530 0l-20 212M930 0l40 212M1230 0l110 212"/></g><path d="M0 0h1440v8H0Z" fill="#f2d5a5" opacity=".7"/><path d="M0 211h1440v99H0Z" fill="url(#front-wood)"/><path d="M0 213h1440" stroke="#785a3e" stroke-width="7"/><path d="M0 223h1440" stroke="#d0a475" stroke-width="4"/><g stroke="#6b503b" opacity=".25"><path d="M0 280h1440M320 225v85m750-85v85"/></g></svg>`;
}

export function counterPropsArt() {
  return `<svg class="counter-props" viewBox="0 0 280 150" aria-hidden="true"><ellipse cx="135" cy="128" rx="122" ry="12" fill="#71513a" opacity=".16"/><path d="M18 57h64v66H18Z" fill="#aab2a2" stroke="#778773" stroke-width="2"/><path d="M18 57 33 42h63L82 57Z" fill="#ced0b9" stroke="#778773" stroke-width="2"/><path d="M82 57 96 42v66l-14 15Z" fill="#8b9b88" stroke="#778773" stroke-width="2"/><path d="M27 68h47v40H27Z" fill="#627c65"/><path d="M31 73h39l-2 26H34Z" fill="#eee8cd"/><path d="M36 79h27m-26 6h25m-24 6h23" stroke="#d0ceb7"/><path d="M131 78h34l5 45h-44Z" fill="#d5a84e" stroke="#b18a40" stroke-width="2"/><path d="M137 78V50h23v28" fill="#ead5a3" stroke="#b18a40" stroke-width="2"/><path d="M144 50V34h8v16" fill="#ddc289"/><path d="M185 70h34l5 53h-44Z" fill="#b9573c" stroke="#8f4b35" stroke-width="2"/><path d="M191 70V43h23v27" fill="#efc7a0" stroke="#8f4b35" stroke-width="2"/><path d="M198 43V27h8v16" fill="#e6bd92"/><path d="M129 97h39m13-5h41" stroke="#faf0cd" stroke-width="12"/></svg>`;
}
