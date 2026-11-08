import {
  money,
  SHIFT_SECONDS,
  LANE_COUNT,
  laneQueue,
  activeOrder,
} from "./game.js";
import { icon, avatarArt } from "./art.js";
import {
  interiorArt,
  guestArt,
  countertopArt,
  counterPropsArt,
} from "./counter-art.js";

const esc = (value) =>
  String(value).replace(
    /[&<>"']/g,
    (char) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        char
      ],
  );
const clock = (seconds) =>
  `${Math.floor(Math.ceil(seconds) / 60)}:${String(Math.ceil(seconds) % 60).padStart(2, "0")}`;

export function queueView(state) {
  return `<span class="lineup-label">${icon("people", "", 17)} 3 LINES · 1 TILL</span>${Array.from(
    { length: LANE_COUNT },
    (_, lane) => {
      const queue = laneQueue(state, lane);
      const selected = !!state.shift && state.shift.activeLane === lane;
      return `<button class="lineup-lane ${selected ? "selected" : ""}" data-action="select-line" data-lane="${lane}" aria-pressed="${selected}" ${!queue.length || state.shift?.paused ? "disabled" : ""}><span class="lineup-lane-number">0${lane + 1}</span><span class="lineup-faces">${queue.map((order) => `<span class="customer-avatar">${avatarArt(order.avatar)}</span>`).join("")}</span><span>${queue.length ? `${queue.length} in line` : "Line open"}<small>${selected && queue.length ? "SERVING" : queue.length ? "SELECT LINE" : "WAITING"}</small></span></button>`;
    },
  ).join("")}`;
}

export function noticeView(state) {
  return state.shift?.notice
    ? `${icon("coins", "", 15)}<span>${esc(state.shift.notice.text)}</span>`
    : "";
}

export function speechView(state) {
  const order = activeOrder(state);
  if (!state.shift)
    return `<div class="welcome-speech"><span class="eyebrow">APRON ON. GAME FACE ON.</span><h2>Welcome to your<br>side of the counter.</h2><p>Three lines. One till. Pick a customer,<br>ring them up, and keep the neighborhood moving.</p><button class="btn btn-primary" data-action="start">Open for day ${state.day} ${icon("arrow", "", 19)}</button><span class="opening-details">90-second shifts · $12 daily overhead</span></div>`;
  if (!order)
    return `<div class="quiet-speech"><span>${icon("sun", "", 26)}</span><h2>A moment to breathe.</h2><p>Someone will be along in a second.<br>Keep that register warm.</p></div>`;
  if (order.stage === "declined")
    return `<section class="customer-speech price-refusal" aria-label="Customer declined the price"><div class="speech-top"><span>LINE ${order.lane + 1} · PRICE CHECK</span><span>NO SALE</span></div><span class="shopper-profile">${esc(order.profile ?? "Price-conscious customer")}</span><h2>${esc(order.customer)} <span>says…</span></h2><p class="refusal-quote">${esc(order.quote)}</p><div class="price-comparison"><span>${esc(order.considered.name)}<strong>${money(order.considered.price)}</strong></span><span>Their price limit<strong>${money(order.considered.limit)}</strong></span></div><p class="slip-footer">They’ll head out in a moment. Try another line.</p></section>`;
  const paying = order.stage === "change";
  return `<section class="customer-speech ${paying ? "is-paying" : ""}" aria-label="Customer order">
    <div class="speech-top"><span>ORDER #${String(order.id).padStart(3, "0")}</span><span>${icon("clock", "", 13)} <strong id="patience-label">${Math.ceil(order.patience)}s</strong></span></div>
    <span class="shopper-profile">LINE ${order.lane + 1} · ${esc(order.profile ?? "Lunch regular")}</span><h2>${esc(order.customer)} <span>says…</span></h2><p class="spoken-line">${paying ? "“Here’s my cash. Thank you!”" : esc(order.quote ?? "“Hey! Could I get…”")}</p>
    <div class="patience-track"><span id="patience-progress" style="width:${(order.patience / order.maxPatience) * 100}%"></span></div>
    <div id="order-lines">${order.lines.map((line) => `<div class="order-line" data-price="${line.price}" data-qty="${line.qty}"><span><b>${line.qty}×</b> ${esc(line.name)}</span><strong>${money(line.price)}<small>each</small></strong></div>`).join("")}</div>
    ${paying ? `<div class="confirmed-total"><span>Rung up correctly</span><strong>${money(order.acceptedTotal)}</strong>${icon("check", "", 14)}</div><div class="cash-tendered"><span>Cash received</span><strong id="cash-received" data-cents="${order.cash}">${money(order.cash)}</strong></div>` : '<p class="slip-footer">What’s the total? Ring it up on your till.</p>'}
  </section>`;
}

export function guestView(state) {
  if (!state.shift) return "";
  return Array.from({ length: LANE_COUNT }, (_, lane) => {
    const queue = laneQueue(state, lane);
    const head = queue[0];
    const selected = state.shift.activeLane === lane;
    return `<section class="service-lane ${selected ? "selected" : ""} ${head?.stage === "declined" ? "declining" : ""}" aria-label="Checkout line ${lane + 1}"><div class="lane-sign"><span>LINE ${lane + 1}</span><small>${queue.length}/${3}</small></div>${queue
      .slice(1)
      .reverse()
      .map(
        (order) =>
          `<div class="waiting-guest" style="--depth:${queue.indexOf(order)}" aria-hidden="true">${guestArt(order.avatar)}</div>`,
      )
      .join(
        "",
      )}${head ? `<button class="lane-front" data-action="select-line" data-lane="${lane}" aria-pressed="${selected}" aria-label="Serve line ${lane + 1}: ${esc(head.customer)}, ${queue.length} in line" ${state.shift.paused ? "disabled" : ""}>${guestArt(head.avatar, head.stage === "change")}<span class="lane-guest-label"><strong>${esc(head.customer)}</strong><small>${head.stage === "declined" ? "TOO PRICEY" : head.stage === "change" ? "PAYING CASH" : selected ? "AT YOUR TILL" : "READY TO ORDER"}</small><i class="lane-patience"><span data-patience-id="${head.id}" style="width:${head.stage === "declined" ? 100 : (head.patience / head.maxPatience) * 100}%"></span></i><span class="lane-clock" data-clock-id="${head.id}">${head.stage === "declined" ? "No thanks!" : `${Math.ceil(head.patience)}s`}</span></span></button>` : `<div class="empty-service-lane">${icon("people", "", 30)}<span>Line open</span></div>`}</section>`;
  }).join("");
}

function keypad(active, paying) {
  const keys = [
    "7",
    "8",
    "9",
    "backspace",
    "4",
    "5",
    "6",
    "clear",
    "1",
    "2",
    "3",
    "enter",
    "00",
    "0",
    ".",
  ];
  return `<div class="register-keypad" role="group" aria-label="Cash register numpad">${keys.map((key) => (key === "enter" ? `<button class="till-key till-enter" type="submit" ${active ? "" : "disabled"} aria-label="${paying ? "Give change and complete sale" : "Confirm order total"}">${icon("check", "", 23)}<span>${paying ? "CHANGE" : "TOTAL"}</span><small>ENTER ↵</small></button>` : `<button class="till-key ${["clear", "backspace"].includes(key) ? "till-utility" : ""}" type="button" data-action="register-key" data-key="${key}" ${active ? "" : "disabled"} ${key === "clear" ? 'aria-label="Clear amount"' : key === "backspace" ? 'aria-label="Backspace"' : `aria-label="${key === "." ? "Decimal point" : key}"`}>${key === "clear" ? "C" : key === "backspace" ? "⌫" : key}</button>`)).join("")}</div>`;
}

export function registerView(state, draft) {
  const customer = activeOrder(state);
  const declined = customer?.stage === "declined";
  const order = declined ? null : customer;
  const paying = order?.stage === "change";
  const active = !!order && !state.shift.paused;
  return `<div class="register-housing"><div class="register-maker"><span>BUN-O-MATIC <small>2000</small></span><span class="register-led ${active ? "on" : ""}"></span></div>
    <div class="terminal-steps"><span class="${!paying ? "current-step" : "complete-step"}">${paying ? icon("check", "", 12) : "<b>1</b>"} Ring up total</span><i></i><span class="${paying ? "current-step" : ""}"><b>2</b> Give change</span></div>
    <form id="cashier-form" novalidate><div class="till-screen ${order ? "" : "idle-screen"}"><div class="lcd-status"><span>${order ? (paying ? "CHANGE DUE" : "ENTER ORDER TOTAL") : declined ? "CUSTOMER PASSED" : state.shift ? "WAITING FOR CUSTOMER" : "LET’S MAKE A GOOD DAY"}</span><span>${state.shift?.paused ? "Ⅱ PAUSED" : order ? "● READY" : "STANDBY"}</span></div>
    ${order ? `<label class="lcd-entry" for="register-amount"><span>$</span><input id="register-amount" name="amount" aria-label="${paying ? "Change due" : "Order total"}" inputmode="decimal" autocomplete="off" maxlength="8" placeholder="0.00" value="${esc(draft.amount)}" ${active ? "" : "disabled"} aria-describedby="cashier-feedback" /></label><div class="lcd-context">${paying ? `<span>TOTAL ${money(order.acceptedTotal)}</span><span>CASH ${money(order.cash)}</span>` : "<span>ITEMS × MENU PRICE</span><span>STEP 01 / 02</span>"}</div>` : `<div class="lcd-idle-message">${declined ? "A little<br>too pricey." : state.shift ? "Hello, neighbor." : "Doors open.<br>Possibilities, too."}</div><div class="lcd-context"><span>THE DAILY BUN</span><span>READY WHEN YOU ARE</span></div>`}</div>
    <p class="cashier-feedback" id="cashier-feedback" role="status">${state.shift?.paused ? "Shift paused. Your place is saved." : order ? (paying ? "Cash in hand. Work out their change." : "Add up the order, then hit TOTAL.") : declined ? "They’re passing. Select another line to serve." : state.shift ? "Select a customer in one of the three lines." : "Open your shop to welcome your first customer."}</p>
    ${keypad(active, paying)}</form><div class="register-bottom"><span class="printer-slot"></span><span>THANK YOU • COME AGAIN</span>${icon("burger", "", 18)}</div></div><div class="register-base"><div class="register-drawer"><span>—</span><span class="drawer-lock">◉</span><span>—</span></div></div>`;
}

export function counterView(state, { register, saved }) {
  const shift = state.shift;
  const dayName = [
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
    "Sunday",
  ][(state.day - 1) % 7];
  return `<div class="counter-app"><header class="counter-topbar"><a href="#" class="counter-brand" data-action="nav" data-page="counter">${icon("burger", "", 35)}<span>the daily bun<small>GOOD FOOD. QUICK THINKING.</small></span></a><nav class="counter-navigation" aria-label="Main navigation"><button class="selected" data-action="nav" data-page="counter" aria-current="page">${icon("counter", "", 18)} The counter</button><button data-action="nav" data-page="menu">${icon("menu", "", 18)} Menu builder</button><button data-action="nav" data-page="upgrades">${icon("shop", "", 18)} Shop upgrades</button></nav><div class="counter-bank">${icon("wallet", "", 21)}<span>SHOP BALANCE<strong id="stat-balance">${money(state.balance)}</strong></span></div></header>
    <main class="counter-workspace"><div class="counter-hud"><div class="counter-day day-card">${icon("sun", "", 21)}<div><strong>Day ${String(state.day).padStart(2, "0")}</strong><span>${dayName}</span></div></div><h1>Your side of the counter.</h1><div class="counter-records"><span>SALES<strong id="stat-sales">${money(shift?.revenue ?? state.lastReport?.revenue ?? 0)}</strong></span><span>SERVED<strong id="stat-served">${shift?.served ?? state.lifetime.served}</strong></span><span>REFUSED<strong id="stat-refused">${shift?.rejected ?? state.lastReport?.rejected ?? 0}</strong></span><span>BEST STREAK<strong id="stat-streak">${Math.max(state.lifetime.bestStreak, shift?.bestStreak ?? 0)}</strong></span></div></div>
    <section class="pov-stage ${shift ? "shop-open" : "shop-closed"} ${shift?.paused ? "shop-paused" : ""}" aria-label="First-person view from behind your shop counter">
      ${interiorArt(state.upgrades.plants, state.upgrades.seating)}
      <div class="wall-menu"><span class="wall-menu-title">the good stuff.</span><div>${state.menu.map((item) => `<span>${esc(item.name)}<i></i><strong>${money(item.price)}</strong></span>`).join("")}</div><small>MADE FRESH. MADE WITH LOVE.</small></div>
      <div class="scene-shift-bar"><span id="shop-status"><i class="status-dot"></i>${shift ? (shift.paused ? "Shift paused" : "Open for business") : "Getting ready"}</span>${shift ? `<div class="shift-clock">${icon("clock", "", 16)}<strong id="shift-time">${clock(shift.remaining)}</strong><div class="shift-track"><span id="shift-progress" style="width:${(shift.remaining / SHIFT_SECONDS) * 100}%"></span></div></div><div class="pov-controls"><button data-action="pause">${icon(shift.paused ? "play" : "pause", "", 16)}${shift.paused ? "Resume" : "Pause"}</button><button data-action="close-shift" aria-label="Close shift early">${icon("flag", "", 15)}<span>Close early</span></button></div>` : '<span class="station-note">YOUR SHOP. YOUR MENU. YOUR MATH.</span>'}</div>
      <div id="market-note" class="market-note" role="status">${noticeView(state)}</div>
      <div id="order-speech" class="speech-position">${speechView(state)}</div><div id="counter-guest" class="customer-lanes">${guestView(state)}</div>
      <div class="countertop">${countertopArt()}</div>${counterPropsArt()}
      <section id="register-card" class="cash-register" aria-label="Cash register">${register}</section>
      <div id="customer-queue" class="lineup-strip">${queueView(state)}</div>
      ${shift?.paused ? `<div class="pov-pause"><span>${icon("pause", "", 26)}</span><h2>A little breather.</h2><p>Your customers and your math can wait.</p><button class="btn btn-primary" data-action="pause">${icon("play", "", 16)} Back to the till</button></div>` : ""}
    </section><footer class="counter-footer"><span class="keyboard-tip">${icon("counter", "", 15)} Pick a line · Click keys or type an amount <kbd>↵</kbd> to confirm</span><span class="counter-save">${icon("check", "", 14)}<span id="save-label">${saved ? "Saved on this device" : "Playing without a save"}</span></span><button data-action="help">${icon("help", "", 16)} How to play</button><button data-action="reset" aria-label="Reset progress">${icon("reset", "", 15)}</button></footer></main></div>`;
}
