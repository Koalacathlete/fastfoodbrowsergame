import "./style.css";
import {
  SHIFT_SECONDS,
  DAILY_RENT,
  INGREDIENTS,
  UPGRADES,
  money,
  initialState,
  parseMoney,
  itemCost,
  demand,
  updateItem,
  buyUpgrade,
  startShift,
  tick,
  serveOrder,
  finishShift,
  loadState,
  saveState,
} from "./game.js";
import { icon, burgerArt, avatarArt, storefrontArt } from "./art.js";

let storage;
try {
  storage = window.localStorage;
} catch {
  storage = {
    getItem: () => null,
    setItem: () => {
      throw new Error("Storage unavailable");
    },
  };
}
let state = loadState(storage);
let page = "counter";
let editing = null;
let modalFocus = null;
let toastTimeout;
let saved = true;
let cashierDraft = { orderId: null, total: "", change: "" };
let lastTick = performance.now();
let saveElapsed = 0;
const app = document.querySelector("#app");
const modalRoot = document.querySelector("#modal-root");
const esc = (value) =>
  String(value).replace(
    /[&<>"']/g,
    (char) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        char
      ],
  );
const dayName = () =>
  [
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
    "Sunday",
  ][(state.day - 1) % 7];
const timeText = (seconds) =>
  `${Math.floor(Math.ceil(seconds) / 60)}:${String(Math.ceil(seconds) % 60).padStart(2, "0")}`;
const badge = (text, cls = "") => `<span class="badge ${cls}">${text}</span>`;
const button = (text, action, cls = "btn-primary", extra = "") =>
  `<button class="btn ${cls}" data-action="${action}" ${extra}>${text}</button>`;

function persist() {
  saved = saveState(state, storage);
  const label = document.querySelector("#save-label");
  if (label)
    label.textContent = saved
      ? "Saved on this device"
      : "Playing without a save";
}

function toast(message) {
  const el = document.querySelector("#toast");
  el.innerHTML = `${icon("check")}<span>${esc(message)}</span>`;
  el.classList.add("visible");
  clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => el.classList.remove("visible"), 3800);
}

function render() {
  const navItems = [
    ["counter", "counter", "The counter"],
    ["menu", "menu", "Menu builder"],
    ["upgrades", "shop", "Shop upgrades"],
  ];
  app.innerHTML = `<div class="app-shell">
    <aside class="sidebar">
      <a href="#" class="brand" data-action="nav" data-page="counter" aria-label="The Daily Bun home"><span class="brand-symbol">${icon("burger", "", 32)}</span><span>the daily bun<span class="brand-sub">A LITTLE BUSINESS. A LOT OF HEART.</span></span></a>
      <span class="sidebar-label">YOUR WORKSPACE</span>
      <nav aria-label="Main navigation">${navItems.map(([id, i, label]) => `<button class="nav-item ${page === id ? "active" : ""}" data-action="nav" data-page="${id}" ${page === id ? 'aria-current="page"' : ""}>${icon(i)}<span>${label}</span>${page === id ? '<span class="nav-dot"></span>' : ""}${id === "upgrades" ? '<span class="nav-new">4</span>' : ""}</button>`).join("")}</nav>
      <div class="sidebar-guide"><span class="mini-spark">${icon("spark", "", 23)}</span><h3>Small shop.<br>Big possibilities.</h3><p>Build your menu. Trust your math. Make it your own.</p><button data-action="help">The owner's handbook ${icon("arrow", "", 17)}</button></div>
      <div class="sidebar-bottom"><button class="subtle-button" data-action="help">${icon("help", "", 18)} How to play</button><button class="subtle-button" data-action="reset">${icon("reset", "", 16)} Fresh start</button><div class="sidebar-footer"><span class="status-dot"></span> INDEPENDENTLY OWNED, BY YOU.</div></div>
    </aside>
    <main class="main-content">
      <header class="topbar"><div class="breadcrumb">YOUR SHOP <span>/</span> <strong>${page === "counter" ? "THE COUNTER" : page === "menu" ? "MENU BUILDER" : "SHOP UPGRADES"}</strong></div><div class="topbar-right"><span class="save-state">${icon("check", "", 15)}<span id="save-label">${saved ? "Saved on this device" : "Playing without a save"}</span></span><button class="icon-button" data-action="help" aria-label="Open how to play">${icon("help", "", 20)}</button><span class="owner-avatar" title="That's you, the owner">YOU</span></div></header>
      ${page === "counter" ? counterPage() : page === "menu" ? menuPage() : upgradesPage()}
      <footer class="page-footer"><span>${icon("burger", "", 15)} A good day starts with a good bun.</span><span>THE DAILY BUN <span class="footer-separator">·</span> EST. TODAY</span></footer>
    </main>
  </div>`;
  updateLive();
}

function pageHeading(kicker, title, subtitle, aside = "") {
  return `<section class="page-heading"><div><div class="eyebrow">${kicker}</div><h1>${title}</h1><p>${subtitle}</p></div>${aside}</section>`;
}

function stats() {
  return `<div class="stats-grid">
    <div class="stat-card"><span class="stat-icon">${icon("wallet")}</span><div><span class="stat-label">Shop balance</span><strong id="stat-balance">${money(state.balance)}</strong><span class="stat-foot">A little seed money. A lot of potential.</span></div></div>
    <div class="stat-card"><span class="stat-icon peach">${icon("trend")}</span><div><span class="stat-label">${state.shift ? "Today’s sales" : "Last shift’s sales"}</span><strong id="stat-sales">${money(state.shift?.revenue ?? state.lastReport?.revenue ?? 0)}</strong><span class="stat-foot" id="stat-sales-foot">${state.lastReport && !state.shift ? `Day ${state.lastReport.day} is in the books` : "Every order is a fresh opportunity"}</span></div></div>
    <div class="stat-card"><span class="stat-icon yellow">${icon("people")}</span><div><span class="stat-label">Customers served</span><strong id="stat-served">${state.shift?.served ?? state.lifetime.served}<small>${state.shift ? "this shift" : "all time"}</small></strong><span class="stat-foot" id="stat-served-foot">${state.shift ? "One happy customer at a time" : "Your neighborhood is waiting"}</span></div></div>
    <div class="stat-card"><span class="stat-icon lavender">${icon("star")}</span><div><span class="stat-label">Best perfect streak</span><strong id="stat-streak">${Math.max(state.lifetime.bestStreak, state.shift?.bestStreak ?? 0)}<small>orders</small></strong><span class="stat-foot">First try. Right total. Right change.</span></div></div>
  </div>`;
}

function counterPage() {
  return `${pageHeading("A FRESH DAY. A FRESH START.", "Good food. Quick thinking.", "Your neighborhood burger shop, with a side of mental math.", `<div class="day-card">${icon("sun", "", 22)}<div><strong>Day ${String(state.day).padStart(2, "0")}</strong><span>${dayName()} <span>·</span> ${state.shift ? "On the clock" : "Let’s make it a good one"}</span></div></div>`)}
    ${stats()}
    <div class="counter-grid ${state.shift ? "is-live" : ""}">
      <section class="shop-card" aria-label="Your restaurant">
        <div class="panel-heading"><div><span class="eyebrow">YOUR LITTLE EMPIRE</span><h2>The Daily Bun ${icon("leaf", "", 19)}</h2></div><span id="shop-status" class="badge"><span class="status-dot"></span>${state.shift ? (state.shift.paused ? "Shift paused" : "Open for business") : "Getting ready"}</span></div>
        <div class="shop-scene">${storefrontArt(!!state.shift, state.upgrades.plants, state.upgrades.seating, state.upgrades.sign)}<div class="scene-label">${icon("sun", "", 14)} A fine day for a burger</div></div>
        <div class="shift-panel" id="shift-panel">${shiftPanel()}</div>
      </section>
      <section class="register-card" aria-label="Cash register" id="register-card">${registerContent()}</section>
    </div>
    <section class="menu-overview"><div class="section-heading"><div><span class="eyebrow">MADE WITH LOVE. PRICED BY YOU.</span><h2>On the menu <span class="count-label">${state.menu.filter((i) => i.kind === "burger").length} signatures</span></h2></div><button class="text-button" data-action="nav" data-page="menu">Manage menu ${icon("arrow", "", 17)}</button></div>
    <div class="menu-preview-grid">${state.menu
      .filter((i) => i.kind === "burger")
      .map(
        (item, index) =>
          `<button class="menu-preview-card" data-action="edit" data-id="${esc(item.id)}"><div class="preview-art art-${index % 4}">${burgerArt(item)}<span class="recipe-number">NO. 0${index + 1}</span></div><div class="preview-info"><div><h3>${esc(item.name)}</h3><p>${item.ingredients.length} ingredients <span>·</span> ${money(itemCost(item, state))} food cost</p></div><strong>${money(item.price)}</strong></div><div class="preview-bottom"><span><span class="little-dot"></span>${Math.round(((item.price - itemCost(item, state)) / item.price) * 100)}% profit margin</span><span class="edit-recipe">View recipe ${icon("chevron", "", 13)}</span></div></button>`,
      )
      .join("")}</div>
    <div class="menu-note">${icon("spark", "", 16)} On the side: ${state.menu
      .filter((i) => i.kind !== "burger")
      .map((i) => `${esc(i.name)} <strong>${money(i.price)}</strong>`)
      .join(
        '<span class="note-divider">/</span>',
      )}<span class="rent-note">Daily overhead ${money(DAILY_RENT)} <span>·</span> Ingredients charged per sale</span></div></section>`;
}

function shiftPanel() {
  if (!state.shift)
    return `<div class="prep-copy"><span class="prep-icon">${icon("shop", "", 24)}</span><div><h3>Your next chapter is on the grill.</h3><p>Menu set? Apron on? Your first customer is just outside.</p></div></div><div class="shift-actions"><span>${icon("clock", "", 15)} 90-second shifts <span>·</span> ${money(DAILY_RENT)} overhead</span>${button(`Open for day ${state.day} ${icon("arrow", "", 18)}`, "start")}</div>`;
  return `<div class="shift-live-heading"><div class="shift-live-title"><span class="live-dot"></span><strong id="shift-title">${state.shift.paused ? "Take a breather. You’ve got this." : "The grill is hot. You’re up."}</strong></div><strong class="shift-timer" id="shift-time">${timeText(state.shift.remaining)}</strong></div><div class="shift-track"><span id="shift-progress" style="width:${(state.shift.remaining / SHIFT_SECONDS) * 100}%"></span></div><div class="shift-controls"><span id="shift-detail">${state.shift.served} served <span>·</span> ${state.shift.lost} walked away</span><div>${button(`${icon(state.shift.paused ? "play" : "pause", "", 15)} ${state.shift.paused ? "Resume" : "Pause"}`, "pause", "btn-small btn-ghost")}${button("Close early", "close-shift", "btn-small btn-ghost")}</div></div><div id="customer-queue" class="customer-queue">${queueContent()}</div>`;
}

function queueContent() {
  const shift = state.shift;
  if (!shift) return "";
  return `<span class="queue-label">THE LINEUP</span>${shift.queue.length ? shift.queue.map((order, index) => `<div class="queue-person ${index === 0 ? "current" : ""}"><div class="customer-avatar">${avatarArt(order.avatar)}</div><div><strong>${esc(order.customer)}</strong><span>${index === 0 ? "At the counter" : "Waiting their turn"}</span></div>${index === 0 ? '<span class="at-counter-dot"></span>' : ""}</div>`).join("") : '<span class="empty-queue">A moment to breathe. Someone will be along soon.</span>'}`;
}

function registerContent() {
  const shift = state.shift;
  const order = shift?.queue[0];
  const orderKey = order ? `${state.day}-${order.id}` : null;
  if (order && cashierDraft.orderId !== orderKey)
    cashierDraft = { orderId: orderKey, total: "", change: "" };
  if (!shift || !order)
    return `<div class="register-heading"><span>${icon("counter", "", 18)} THE REGISTER</span>${badge(shift?.paused ? "PAUSED" : shift ? "READY" : "STANDBY", "badge-neutral")}</div><div class="register-empty"><div class="receipt-illustration"><div class="receipt-logo">${icon("burger", "", 30)}</div><div class="receipt-dash"></div><div class="receipt-line"></div><div class="receipt-line short"></div><div class="receipt-dash"></div><span>GOOD THINGS<br>ARE ON THE WAY.</span><div class="receipt-dash"></div><div class="receipt-star">✳</div></div><h3>${shift ? (shift.paused ? "A well-earned breather." : "A quiet moment.") : "Ready to take an order?"}</h3><p>${shift ? (shift.paused ? "Resume your shift to welcome the next customer." : "The next customer will be here shortly. Keep an eye on the lineup.") : "Open your shop, greet your customers, and give that brain a little workout."}</p></div><div class="register-tip">${icon("spark", "", 18)}<p>${shift ? "Quick, accurate orders earn a $0.50 tip. Happy plants add a little extra." : "<strong>The house rule</strong>Calculate the order total, then the change. Get both right to make the sale."}</p></div>${shift?.paused ? button(`${icon("play", "", 16)} Resume shift`, "pause", "btn-primary full-width") : ""}`;
  return `<div class="register-heading"><span>${icon("counter", "", 18)} THE REGISTER</span>${badge(shift.paused ? "PAUSED" : `ORDER #${String(order.id).padStart(3, "0")}`, "badge-neutral")}</div>
    <div class="customer-heading"><div class="customer-avatar large-avatar">${avatarArt(order.avatar)}</div><div><h3>${esc(order.customer)}’s order</h3><p>${order.mistakes ? "No rush. Double-check your math." : "“Hey! Could I get…”"}</p></div><span class="patience-tag" id="patience-label">${Math.ceil(order.patience)}s</span></div>
    <div class="patience-track"><span id="patience-progress" style="width:${(order.patience / order.maxPatience) * 100}%"></span></div>
    <div class="order-ticket"><div class="ticket-columns"><span>ITEM</span><span>QTY × PRICE</span></div><div id="order-lines">${order.lines.map((line) => `<div class="order-line" data-price="${line.price}" data-qty="${line.qty}"><span>${esc(line.name)}</span><strong>${line.qty} <span>×</span> ${money(line.price)}</strong></div>`).join("")}</div><div class="cash-tendered"><span>${icon("wallet", "", 17)} Cash received</span><strong id="cash-received" data-cents="${order.cash}">${money(order.cash)}</strong></div></div>
    <form id="cashier-form" novalidate><div class="cashier-inputs"><label for="order-total">Order total<div class="money-input"><span>$</span><input id="order-total" name="total" value="${esc(cashierDraft.total)}" inputmode="decimal" type="text" placeholder="0.00" autocomplete="off" ${shift.paused ? "disabled" : ""} maxlength="8" required aria-describedby="cashier-feedback" /></div></label><label for="change-due">Change due<div class="money-input"><span>$</span><input id="change-due" name="change" value="${esc(cashierDraft.change)}" inputmode="decimal" type="text" placeholder="0.00" autocomplete="off" ${shift.paused ? "disabled" : ""} maxlength="8" required aria-describedby="cashier-feedback" /></div></label></div><p class="cashier-feedback" id="cashier-feedback" role="status">${shift.paused ? "Your shift is paused. Resume when you’re ready." : "A little mental math. You’ve got this."}</p><button type="submit" class="btn btn-primary full-width" ${shift.paused ? "disabled" : ""}>${icon("check", "", 19)} Serve customer <kbd>↵</kbd></button></form><div class="register-footnote">${icon("spark", "", 14)} Fast + accurate = happy customers & extra tips</div>`;
}

function menuPage() {
  const d = demand(state);
  return `${pageHeading("THE SECRET INGREDIENT IS YOU.", "Something for every appetite.", "Choose your ingredients. Find your price. Make a name for yourself.", button(`${icon("plus", "", 18)} Create a burger`, "new-burger", "btn-primary", state.menu.filter((i) => i.kind === "burger").length >= 4 || state.shift ? "disabled" : ""))}
    ${state.shift ? pausedNotice() : ""}
    <div class="menu-strategy"><div class="strategy-icon">${icon("trend", "", 25)}</div><div><h3>A good menu is a balancing act.</h3><p>High margins feel good. Fair prices keep the neighborhood coming back. Ingredients are charged only when you make a sale.</p></div><div class="demand-meter"><span>NEIGHBORHOOD DEMAND</span><strong>${d > 1.15 ? "Looking lively" : d > 0.8 ? "A steady appetite" : "Price-sensitive"}</strong><div><i style="width:${Math.min((d / 1.6) * 100, 100)}%"></i></div></div></div>
    <div class="section-heading"><h2>Your signature burgers</h2><span class="muted">${state.menu.filter((i) => i.kind === "burger").length} of 4 menu slots filled</span></div>
    <div class="recipe-grid">${state.menu
      .filter((i) => i.kind === "burger")
      .map(
        (item, index) =>
          `<article class="recipe-card"><div class="recipe-art art-${index % 4}"><span class="recipe-number">SIGNATURE NO. 0${index + 1}</span>${burgerArt(item, true)}<span class="recipe-price">${money(item.price)}</span></div><div class="recipe-body"><h2>${esc(item.name)}</h2><p>${item.ingredients
            .filter((id) => id !== "bun")
            .map((id) => INGREDIENTS.find((i) => i.id === id).name)
            .join(
              " · ",
            )}</p><div class="recipe-economics"><div><span>Ingredient cost</span><strong>${money(itemCost(item, state))}</strong></div><div><span>Profit per burger</span><strong class="green-text">${money(item.price - itemCost(item, state))}</strong></div><div><span>Margin</span><strong>${Math.round(((item.price - itemCost(item, state)) / item.price) * 100)}%</strong></div></div>${button(`${icon("edit", "", 16)} Edit recipe & price`, "edit", "btn-secondary full-width", `data-id="${esc(item.id)}" ${state.shift ? "disabled" : ""}`)}</div></article>`,
      )
      .join("")}</div>
    <div class="section-heading sides-heading"><div><span class="eyebrow">BETTER TOGETHER</span><h2>A little something on the side</h2></div></div><div class="sides-grid">${state.menu
      .filter((i) => i.kind !== "burger")
      .map(
        (item) =>
          `<article class="side-card"><div class="side-art">${burgerArt(item)}</div><div><h3>${esc(item.name)}</h3><p>${money(itemCost(item, state))} cost <span>·</span> ${money(item.price - itemCost(item, state))} profit</p><strong>${money(item.price)}</strong></div><button class="icon-button" data-action="edit" data-id="${item.id}" aria-label="Edit ${esc(item.name)} price" ${state.shift ? "disabled" : ""}>${icon("edit", "", 19)}</button></article>`,
      )
      .join("")}</div>`;
}

function pausedNotice() {
  return `<div class="notice">${icon("pause", "", 18)} Your shift is paused. Menu changes and upgrades are available between shifts.<button data-action="nav" data-page="counter">Back to the counter ${icon("arrow", "", 16)}</button></div>`;
}

function upgradesPage() {
  return `${pageHeading("REINVEST IN YOUR LITTLE EMPIRE.", "Make this place your place.", "Small improvements. Happier customers. A shop worth coming back to.", `<div class="available-funds"><span>AVAILABLE TO INVEST</span><strong>${money(state.balance)}</strong></div>`)}${state.shift ? pausedNotice() : ""}<div class="upgrade-banner"><div><span class="eyebrow">A BUSINESS WITH ROOM TO GROW</span><h2>Good things grow<br>one upgrade at a time.</h2><p>Every upgrade sticks around for future days.<br>Start small, and make every dollar work harder.</p></div><div class="banner-plant">${icon("plant", "", 130)}</div><span class="banner-caption">YOUR NEXT CHAPTER, GROWING.</span></div><div class="upgrades-grid">${UPGRADES.map(
    (u, index) => {
      const level = state.upgrades[u.id];
      const maxed = level === 3;
      const price = u.prices[level];
      return `<article class="upgrade-card"><div class="upgrade-card-top"><div class="upgrade-art upgrade-art-${index}">${icon(u.icon, "", 48)}</div><div class="upgrade-level"><span>LEVEL ${level} / 3</span><div>${[1, 2, 3].map((i) => `<i class="${i <= level ? "filled" : ""}"></i>`).join("")}</div></div></div><h2>${u.name}</h2><p>${u.description}</p><div class="upgrade-effect">${icon("plus", "", 15)} ${u.effect}</div><div class="upgrade-purchase"><span>${maxed ? "The best on the block" : `Next: level ${level + 1}`}<strong>${maxed ? "Fully upgraded" : money(price)}</strong></span>${button(maxed ? `${icon("check", "", 16)} Maxed out` : `Upgrade ${icon("arrow", "", 16)}`, "buy", maxed ? "btn-secondary" : "btn-primary", `data-id="${u.id}" ${maxed || state.balance < price || state.shift ? "disabled" : ""}`)}</div>${!maxed && state.balance < price ? `<span class="funding-note">${money(price - state.balance)} more to make it yours</span>` : ""}</article>`;
    },
  ).join("")}</div>`;
}

function updateLive() {
  const shift = state.shift;
  if (!shift || page !== "counter") return;
  setText("stat-balance", money(state.balance));
  setText("stat-sales", money(shift.revenue));
  setHTML("stat-served", `${shift.served}<small>this shift</small>`);
  setHTML(
    "stat-streak",
    `${Math.max(state.lifetime.bestStreak, shift.bestStreak)}<small>orders</small>`,
  );
  setText("shift-time", timeText(shift.remaining));
  setHTML(
    "shift-detail",
    `${shift.served} served <span>·</span> ${shift.lost} walked away`,
  );
  const track = document.querySelector("#shift-progress");
  if (track) track.style.width = `${(shift.remaining / SHIFT_SECONDS) * 100}%`;
  const order = shift.queue[0];
  if (order) {
    setText("patience-label", `${Math.ceil(order.patience)}s`);
    const patience = document.querySelector("#patience-progress");
    if (patience) {
      patience.style.width = `${(order.patience / order.maxPatience) * 100}%`;
      patience.classList.toggle("urgent", order.patience < 10);
    }
    document
      .querySelector("#patience-label")
      ?.classList.toggle("urgent-text", order.patience < 10);
  }
}

function setText(id, value) {
  const el = document.getElementById(id);
  if (el) el.textContent = value;
}
function setHTML(id, value) {
  const el = document.getElementById(id);
  if (el) el.innerHTML = value;
}

function modal(content, cls = "") {
  modalFocus = document.activeElement;
  modalRoot.innerHTML = `<dialog class="modal ${cls}" aria-labelledby="modal-title"><button class="modal-close icon-button" data-action="dismiss" aria-label="Close dialog">${icon("close")}</button>${content}</dialog>`;
  const el = modalRoot.querySelector("dialog");
  el.addEventListener("click", (event) => {
    if (
      event.target === el &&
      (event.clientX < el.getBoundingClientRect().left ||
        event.clientX > el.getBoundingClientRect().right ||
        event.clientY < el.getBoundingClientRect().top ||
        event.clientY > el.getBoundingClientRect().bottom)
    )
      closeModal();
  });
  el.addEventListener("cancel", (event) => {
    event.preventDefault();
    closeModal();
  });
  el.showModal();
}

function closeModal() {
  modalRoot.querySelector("dialog")?.close();
  modalRoot.innerHTML = "";
  editing = null;
  if (modalFocus?.isConnected) modalFocus.focus();
}

function openEditor(id) {
  if (state.shift) {
    toast("Your menu is set for this shift. Make changes after closing.");
    return;
  }
  if (!id && state.menu.filter((i) => i.kind === "burger").length >= 4) return;
  editing = id
    ? structuredClone(state.menu.find((i) => i.id === id))
    : {
        id: `burger-${Date.now()}`,
        name: "Your signature burger",
        kind: "burger",
        price: 700,
        ingredients: ["bun", "beef", "cheese", "lettuce", "sauce"],
      };
  if (!editing) return;
  const burger = editing.kind === "burger";
  modal(
    `<div class="eyebrow">${burger ? "A LITTLE RECIPE FOR SUCCESS" : "THE PERFECT SIDEKICK"}</div><h2 id="modal-title">${id ? "Make it your own." : "Meet your next signature."}</h2><p class="modal-intro">${burger ? "Build a burger worth coming back for. Every ingredient adds up." : "The small things make a meal. Give yours a name and a price."}</p><form id="recipe-form" novalidate><div class="editor-layout"><div class="editor-preview"><div id="editor-art">${burgerArt(editing, true)}</div><div class="editor-economics"><span>INGREDIENT COST<strong id="editor-cost">${money(itemCost(editing, state))}</strong></span><span>PROFIT PER SALE<strong id="editor-profit" class="green-text">${money(editing.price - itemCost(editing, state))}</strong></span></div><p>Charged per sale. No upfront stock costs.</p></div><div class="editor-fields"><label for="recipe-name">On the menu as<input class="text-input" id="recipe-name" name="name" maxlength="24" value="${esc(editing.name)}" required /></label>${
      burger
        ? `<fieldset class="ingredient-fieldset"><legend>The foundation <span>Choose one patty</span></legend><div class="fixed-ingredient"><span>${icon("check", "", 15)} Brioche bun</span><strong>${money(INGREDIENTS[0].cost)}</strong></div>${INGREDIENTS.filter(
            (i) => i.group === "protein",
          )
            .map((i) => ingredientOption(i, true))
            .join(
              "",
            )}</fieldset><fieldset class="ingredient-fieldset"><legend>Make it yours <span>Mix & match</span></legend>${INGREDIENTS.filter(
            (i) => i.group === "topping",
          )
            .map((i) => ingredientOption(i, false))
            .join("")}</fieldset>`
        : '<div class="side-editor-note">Your supplier handles the recipe. You handle the price.</div>'
    }<label for="recipe-price">Selling price<div class="money-input editor-price"><span>$</span><input id="recipe-price" name="price" inputmode="decimal" value="${(editing.price / 100).toFixed(2)}" maxlength="6" required /></div></label><p class="field-hint">A higher price means more margin, but fewer customers.</p></div></div><p id="recipe-error" class="form-error" role="status"></p><div class="modal-actions">${id && burger && state.menu.filter((i) => i.kind === "burger").length > 1 ? button("Remove from menu", "delete-recipe", "btn-text danger-text", `data-id="${esc(id)}"`) : "<span></span>"}<div>${button("Cancel", "dismiss", "btn-secondary")}<button class="btn btn-primary" type="submit">${icon("check", "", 17)} Save to menu</button></div></div></form>`,
    "recipe-modal",
  );
}

function ingredientOption(ingredient, radio) {
  return `<label class="ingredient-option"><input type="${radio ? "radio" : "checkbox"}" ${radio ? 'name="protein"' : ""} data-ingredient="${ingredient.id}" ${editing.ingredients.includes(ingredient.id) ? "checked" : ""}/><span class="ingredient-swatch" style="background:${ingredient.color}"></span><span>${ingredient.name}</span><strong>${money(ingredient.cost)}</strong></label>`;
}

function updateEditor() {
  if (!editing) return;
  const cost = itemCost(editing, state);
  setHTML("editor-art", burgerArt(editing, true));
  setText("editor-cost", money(cost));
  setText(
    "editor-profit",
    Number.isInteger(editing.price) ? money(editing.price - cost) : "—",
  );
}

function showHelp() {
  if (state.shift && !state.shift.paused) {
    state.shift.paused = true;
    persist();
    render();
  }
  modal(
    `<span class="handbook-icon">${icon("burger", "", 38)}</span><div class="eyebrow">THE OWNER’S HANDBOOK</div><h2 id="modal-title">A little hustle.<br>A lot of heart.</h2><p class="modal-intro">Welcome to The Daily Bun. Your shop, your menu, your math.</p><div class="handbook-steps"><div><span>01</span><div><h3>Build something delicious.</h3><p>Choose a patty and toppings in Menu builder. Every ingredient has a cost. Set a selling price above that cost, but keep it fair to attract customers.</p></div></div><div><span>02</span><div><h3>Open up. Think on your feet.</h3><p>Each shift lasts 90 seconds. Add up quantities × menu prices, then subtract the total from the cash received to find the change. Enter both amounts to serve.</p><div class="math-example">2 burgers × $6.50 + 1 fries × $2.50 = <strong>$15.50</strong><br>$20.00 cash − $15.50 total = <strong>$4.50 change</strong></div></div></div><div><span>03</span><div><h3>Turn good math into a good business.</h3><p>Ingredients are deducted with each sale; ${money(DAILY_RENT)} overhead is charged at closing. Fast, first-try answers earn a $0.50 tip. Reinvest your profit in upgrades.</p></div></div></div><div class="handbook-note">${icon("clock", "", 18)} Customers in the lineup lose patience too. Pause whenever you need a breather. Progress saves on this device; reloaded shifts resume paused.</div>${button("Let’s make something good " + icon("arrow", "", 17), "dismiss", "btn-primary full-width")}`,
    "help-modal",
  );
}

function showReport() {
  const report = state.lastReport;
  if (!report) return;
  modal(
    `<div class="report-badge">${icon(report.profit >= 0 ? "star" : "sun", "", 38)}</div><div class="eyebrow">DAY ${String(report.day).padStart(2, "0")} · THAT’S A WRAP</div><h2 id="modal-title">${report.served === 0 ? "Tomorrow is a fresh start." : report.profit < 0 ? "A little wiser. A little better." : "Now that’s a good day."}</h2><p class="modal-intro">${report.served === 0 ? "Your next great shift is still ahead of you." : `You fed ${report.served} hungry ${report.served === 1 ? "neighbor" : "neighbors"}. Here’s how it all adds up.`}</p><div class="report-profit ${report.profit < 0 ? "negative" : ""}"><span>NET PROFIT</span><strong>${report.profit >= 0 ? "+" : "−"}${money(Math.abs(report.profit))}</strong><span>After ingredients and daily overhead</span></div><div class="report-ledger"><div><span>Menu sales</span><strong>${money(report.revenue)}</strong></div><div><span>A little extra in tips</span><strong class="green-text">+${money(report.tips)}</strong></div><div><span>Ingredient costs</span><strong>−${money(report.costs)}</strong></div><div><span>Daily overhead</span><strong>−${money(report.rent)}</strong></div></div><div class="report-metrics"><div><strong>${report.served}</strong><span>Served</span></div><div><strong>${report.lost}</strong><span>Walked away</span></div><div><strong>${report.bestStreak}</strong><span>Best streak</span></div><div><strong>${report.mistakes}</strong><span>Math retries</span></div></div><p class="report-balance">Your shop balance <strong>${money(state.balance)}</strong></p><div class="report-actions">${button("Invest in your shop " + icon("arrow", "", 17), "report-upgrades", "btn-primary full-width")}${button("Back to the counter", "dismiss", "btn-text full-width")}</div>`,
    "report-modal",
  );
}

function actionHandler(event) {
  const target = event.target.closest("[data-action]");
  if (!target || target.disabled) return;
  event.preventDefault();
  const action = target.dataset.action;
  if (action === "nav") {
    const next = target.dataset.page;
    if (next !== "counter" && state.shift && !state.shift.paused) {
      state.shift.paused = true;
      persist();
    }
    page = next;
    render();
    window.scrollTo({ top: 0, behavior: "instant" });
  } else if (action === "start") {
    startShift(state);
    lastTick = performance.now();
    persist();
    render();
    document.querySelector("#order-total")?.focus({ preventScroll: true });
  } else if (action === "pause") {
    if (!state.shift) return;
    state.shift.paused = !state.shift.paused;
    lastTick = performance.now();
    persist();
    render();
    if (!state.shift.paused)
      document.querySelector("#order-total")?.focus({ preventScroll: true });
  } else if (action === "edit") openEditor(target.dataset.id);
  else if (action === "new-burger") openEditor();
  else if (action === "help") showHelp();
  else if (action === "dismiss") closeModal();
  else if (action === "buy") {
    const id = target.dataset.id;
    const error = buyUpgrade(state, id);
    if (error) toast(error);
    else {
      persist();
      render();
      toast(
        `${UPGRADES.find((i) => i.id === id).short} upgraded. Here’s to the next good day!`,
      );
    }
  } else if (action === "delete-recipe") {
    if (
      state.shift ||
      state.menu.filter((i) => i.kind === "burger").length <= 1
    )
      return;
    state.menu = state.menu.filter((i) => i.id !== target.dataset.id);
    persist();
    closeModal();
    render();
    toast("Menu updated. Room for something new.");
  } else if (action === "report-upgrades") {
    closeModal();
    page = "upgrades";
    render();
    window.scrollTo({ top: 0, behavior: "instant" });
  } else if (action === "close-shift") {
    if (!state.shift) return;
    state.shift.paused = true;
    persist();
    render();
    modal(
      `<div class="eyebrow">CALLING IT A DAY?</div><h2 id="modal-title">Hang up the apron?</h2><p class="modal-intro">Your earnings so far will be kept. Waiting customers will leave, and the ${money(DAILY_RENT)} daily overhead will still be charged.</p><div class="confirm-actions">${button("Keep going", "keep-going", "btn-secondary")}${button("Close the shop", "confirm-close")}</div>`,
      "confirm-modal",
    );
  } else if (action === "keep-going") {
    closeModal();
    if (state.shift) {
      state.shift.paused = false;
      lastTick = performance.now();
      persist();
      render();
    }
  } else if (action === "confirm-close") {
    finishShift(state);
    persist();
    closeModal();
    render();
    showReport();
  } else if (action === "reset") {
    if (state.shift && !state.shift.paused) {
      state.shift.paused = true;
      persist();
      render();
    }
    modal(
      `<div class="eyebrow">A CLEAN SLATE</div><h2 id="modal-title">Start a new little story?</h2><p class="modal-intro">This resets your balance, menu, days, and upgrades on this device. You’ll start again with $120 and a whole lot of possibility.</p><div class="confirm-actions">${button("Keep my shop", "dismiss", "btn-secondary")}${button("Reset my progress", "confirm-reset", "btn-danger")}</div>`,
      "confirm-modal",
    );
  } else if (action === "confirm-reset") {
    state = initialState();
    persist();
    closeModal();
    page = "counter";
    render();
    toast("A fresh start. Make this one yours.");
  }
}
app.addEventListener("click", actionHandler);
modalRoot.addEventListener("click", actionHandler);

app.addEventListener("input", (event) => {
  if (event.target.id === "order-total")
    cashierDraft.total = event.target.value;
  if (event.target.id === "change-due")
    cashierDraft.change = event.target.value;
});

app.addEventListener("submit", (event) => {
  if (event.target.id !== "cashier-form") return;
  event.preventDefault();
  const result = serveOrder(
    state,
    event.target.elements.total.value,
    event.target.elements.change.value,
  );
  if (!result.ok) {
    setText("cashier-feedback", result.message);
    document.querySelector("#cashier-feedback")?.classList.add("error-text");
    document.querySelector("#cashier-form")?.classList.add("has-error");
    setTimeout(
      () =>
        document.querySelector("#cashier-form")?.classList.remove("has-error"),
      400,
    );
    persist();
    return;
  }
  persist();
  setHTML("register-card", registerContent());
  setHTML("customer-queue", queueContent());
  updateLive();
  toast(
    `${result.customer} says thanks! +${money(result.profit)} profit${result.tip ? ` (includes ${money(result.tip)} tip)` : ""}`,
  );
  document.querySelector("#order-total")?.focus({ preventScroll: true });
});

modalRoot.addEventListener("input", (event) => {
  if (!editing) return;
  const target = event.target;
  if (target.id === "recipe-name") editing.name = target.value;
  if (target.id === "recipe-price") editing.price = parseMoney(target.value);
  if (target.dataset.ingredient) {
    const id = target.dataset.ingredient;
    const ingredient = INGREDIENTS.find((i) => i.id === id);
    if (ingredient.group === "protein")
      editing.ingredients = editing.ingredients
        .filter((i) => INGREDIENTS.find((x) => x.id === i).group !== "protein")
        .concat(id);
    else
      editing.ingredients = target.checked
        ? [...new Set([...editing.ingredients, id])]
        : editing.ingredients.filter((i) => i !== id);
  }
  updateEditor();
});
modalRoot.addEventListener("submit", (event) => {
  if (event.target.id !== "recipe-form" || !editing) return;
  event.preventDefault();
  const error = updateItem(state, editing);
  if (error) {
    setText("recipe-error", error);
    return;
  }
  persist();
  closeModal();
  render();
  toast("Looking delicious. Your menu is updated.");
});

document.addEventListener("visibilitychange", () => {
  if (document.hidden && state.shift && !state.shift.paused) {
    state.shift.paused = true;
    persist();
    render();
  }
  lastTick = performance.now();
});
window.addEventListener("pagehide", persist);
setInterval(() => {
  const now = performance.now();
  const dt = Math.min((now - lastTick) / 1000, 2);
  lastTick = now;
  if (!state.shift || state.shift.paused) return;
  const previous = state.shift.queue[0]?.id;
  const events = tick(state, dt);
  if (events.some((i) => i.type === "closed")) {
    persist();
    render();
    showReport();
    return;
  }
  if (events.length && page === "counter") {
    setHTML("customer-queue", queueContent());
    if (previous !== state.shift.queue[0]?.id)
      setHTML("register-card", registerContent());
  }
  if (events.some((i) => i.type === "left"))
    toast("A customer had to leave. The next one is a fresh start.");
  updateLive();
  saveElapsed += dt;
  if (saveElapsed > 2) {
    persist();
    saveElapsed = 0;
  }
}, 250);

render();
if (state.shift)
  toast("Welcome back! Your shift is paused and ready when you are.");
