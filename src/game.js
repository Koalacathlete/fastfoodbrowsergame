export const SHIFT_SECONDS = 90;
export const DAILY_RENT = 1200;
export const LANE_COUNT = 3;
export const LANE_CAPACITY = 3;
export const SAVE_KEY = "daily-bun-save-v1";
export const money = (cents) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(
    cents / 100,
  );
export const INGREDIENTS = [
  { id: "bun", name: "Brioche bun", cost: 45, group: "base", color: "#e9ad62" },
  {
    id: "beef",
    name: "Beef patty",
    cost: 155,
    group: "protein",
    color: "#694632",
  },
  {
    id: "chicken",
    name: "Crispy chicken",
    cost: 140,
    group: "protein",
    color: "#bd7937",
  },
  {
    id: "veggie",
    name: "Veggie patty",
    cost: 120,
    group: "protein",
    color: "#7b743e",
  },
  {
    id: "cheese",
    name: "Cheddar",
    cost: 35,
    group: "topping",
    color: "#f5c64b",
  },
  {
    id: "lettuce",
    name: "Lettuce",
    cost: 15,
    group: "topping",
    color: "#75a45c",
  },
  {
    id: "tomato",
    name: "Tomato",
    cost: 20,
    group: "topping",
    color: "#d36545",
  },
  {
    id: "pickles",
    name: "Pickles",
    cost: 15,
    group: "topping",
    color: "#8fa653",
  },
  {
    id: "bacon",
    name: "Smoked bacon",
    cost: 70,
    group: "topping",
    color: "#a65c42",
  },
  {
    id: "sauce",
    name: "House sauce",
    cost: 20,
    group: "topping",
    color: "#e5ab6e",
  },
];
export const UPGRADES = [
  {
    id: "seating",
    name: "Make yourself comfy",
    short: "Cozy seating",
    icon: "chair",
    description: "A soft seat makes the wait a little sweeter.",
    effect: "+6 seconds of patience per level",
    prices: [3500, 6500, 11000],
  },
  {
    id: "sign",
    name: "Word on the sidewalk",
    short: "Sidewalk sign",
    icon: "sign",
    description: "Give the neighborhood something to talk about.",
    effect: "+18% foot traffic per level",
    prices: [4500, 8000, 12500],
  },
  {
    id: "kitchen",
    name: "A smoother operation",
    short: "Kitchen tools",
    icon: "spatula",
    description: "Less waste. Better prep. Every little bit adds up.",
    effect: "−5% ingredient costs per level",
    prices: [5000, 9000, 14000],
  },
  {
    id: "plants",
    name: "A little green goes far",
    short: "Happy plants",
    icon: "plant",
    description: "Good vibes have a way of turning into good tips.",
    effect: "+$0.25 tip per served customer per level",
    prices: [3000, 6000, 10000],
  },
];
const CUSTOMERS = [
  "Jamie",
  "Alex",
  "Morgan",
  "Sam",
  "Jordan",
  "Riley",
  "Taylor",
  "Casey",
  "Robin",
  "Charlie",
  "Drew",
  "Avery",
];

export function initialState() {
  return {
    version: 1,
    balance: 12000,
    day: 1,
    menu: [
      {
        id: "classic",
        name: "The House Classic",
        kind: "burger",
        ingredients: ["bun", "beef", "lettuce", "tomato", "sauce"],
        price: 650,
      },
      {
        id: "cheese",
        name: "The Cheesy One",
        kind: "burger",
        ingredients: ["bun", "beef", "cheese", "pickles", "sauce"],
        price: 750,
      },
      {
        id: "garden",
        name: "The Garden Club",
        kind: "burger",
        ingredients: ["bun", "veggie", "lettuce", "tomato", "pickles", "sauce"],
        price: 600,
      },
      { id: "fries", name: "Golden Fries", kind: "side", cost: 65, price: 250 },
      {
        id: "lemonade",
        name: "House Lemonade",
        kind: "drink",
        cost: 55,
        price: 300,
      },
    ],
    upgrades: { seating: 0, sign: 0, kitchen: 0, plants: 0 },
    lifetime: {
      served: 0,
      revenue: 0,
      profit: 0,
      bestStreak: 0,
      visitors: 0,
      rejected: 0,
      lost: 0,
      turnedAway: 0,
    },
    lastReport: null,
    shift: null,
  };
}

export function parseMoney(value) {
  const cleaned = String(value).trim().replace(/^\$/, "");
  if (!/^\d{1,5}(\.\d{1,2})?$/.test(cleaned)) return null;
  const [whole, decimal = ""] = cleaned.split(".");
  return Number(whole) * 100 + Number(decimal.padEnd(2, "0"));
}

function baseItemCost(item) {
  return item.kind === "burger"
    ? item.ingredients.reduce(
        (sum, id) => sum + (INGREDIENTS.find((i) => i.id === id)?.cost ?? 0),
        0,
      )
    : item.cost;
}

export function itemCost(item, state) {
  return Math.round(baseItemCost(item) * (1 - state.upgrades.kitchen * 0.05));
}

const clamp = (low, high, value) => Math.max(low, Math.min(high, value));

export function referencePrice(item) {
  return Math.round(
    baseItemCost(item) * { burger: 2.6, side: 4, drink: 5.4 }[item.kind],
  );
}

export function priceRatio(item) {
  return item.price / referencePrice(item);
}

function menuDemand(state) {
  let weight = 0;
  const value =
    state.menu.reduce((sum, item) => {
      const importance = item.kind === "burger" ? 2 : 1;
      weight += importance;
      return sum + importance * priceRatio(item);
    }, 0) / weight;
  return clamp(0.35, 1.6, 1.05 - (value - 1) * 0.65);
}

export function demand(state) {
  return menuDemand(state) * (1 + state.upgrades.sign * 0.18);
}

export function footTraffic(state) {
  // A busy street still has visitors when prices are high; they can say no.
  return (0.88 + menuDemand(state) * 0.12) * (1 + state.upgrades.sign * 0.18);
}

export function laneQueue(state, lane) {
  return state.shift?.queue.filter((order) => order.lane === lane) ?? [];
}

export function activeOrder(state) {
  return laneQueue(state, state.shift?.activeLane)[0];
}

function ensureActiveLane(state) {
  if (!activeOrder(state) && state.shift.queue.length)
    state.shift.activeLane = state.shift.queue[0].lane;
}

export function selectLane(state, lane) {
  if (!state.shift || state.shift.paused)
    return "Resume your shift to serve a line.";
  if (!Number.isInteger(lane) || lane < 0 || lane >= LANE_COUNT)
    return "Choose a checkout line.";
  if (lane === state.shift.activeLane) return null;
  if (activeOrder(state)?.stage === "change")
    return "Finish giving this customer their change before switching lines.";
  if (!laneQueue(state, lane).length)
    return "This line is empty. Pick a customer who is waiting.";
  state.shift.activeLane = lane;
  return null;
}

const PROFILES = [
  { name: "Bargain hunter", base: 0.85, spread: 0.35, extra: 0.05 },
  { name: "Lunch regular", base: 1.1, spread: 0.4, extra: 0 },
  { name: "Treat-yourself", base: 1.45, spread: 0.55, extra: 0.1 },
];

function valuePick(items, random) {
  const weights = items.map((item) => Math.pow(1 / priceRatio(item), 2));
  let target = random() * weights.reduce((sum, value) => sum + value, 0);
  return (
    items.find((item, index) => (target -= weights[index]) <= 0) ?? items.at(-1)
  );
}

export function validateItem(item, state) {
  if (!item.name.trim() || item.name.trim().length > 24)
    return "Give your creation a name (up to 24 characters).";
  if (item.kind === "burger") {
    const ids = item.ingredients;
    if (
      new Set(ids).size !== ids.length ||
      ids.some((id) => !INGREDIENTS.some((i) => i.id === id))
    )
      return "Choose each ingredient only once.";
    if (
      !ids.includes("bun") ||
      ids.filter(
        (id) => INGREDIENTS.find((i) => i.id === id).group === "protein",
      ).length !== 1
    )
      return "Every burger needs a bun and one patty.";
  }
  if (!Number.isInteger(item.price) || item.price > 3000 || item.price < 50)
    return "Set a price between $0.50 and $30.00.";
  if (item.price <= itemCost(item, state))
    return "Price above your ingredient cost to make a profit.";
  return null;
}

export function updateItem(state, item) {
  if (state.shift) return "Finish your shift before changing the menu.";
  const error = validateItem(item, state);
  if (error) return error;
  const index = state.menu.findIndex((i) => i.id === item.id);
  if (index < 0) {
    if (state.menu.filter((i) => i.kind === "burger").length >= 4)
      return "Your menu has room for four burgers.";
    state.menu.push({ ...item, name: item.name.trim() });
  } else state.menu[index] = { ...item, name: item.name.trim() };
  return null;
}

export function buyUpgrade(state, id) {
  if (state.shift) return "Shop for upgrades between shifts.";
  const upgrade = UPGRADES.find((i) => i.id === id);
  if (!upgrade) return "Unknown upgrade.";
  const level = state.upgrades[id];
  if (level >= upgrade.prices.length)
    return "This upgrade is already maxed out.";
  if (state.balance < upgrade.prices[level])
    return "A few more orders and this one is yours.";
  state.balance -= upgrade.prices[level];
  state.upgrades[id] += 1;
  return null;
}

export function createOrder(state, random = Math.random, lane = 0) {
  const segment = random();
  const profile = PROFILES[segment < 0.35 ? 0 : segment < 0.8 ? 1 : 2];
  const burgers = state.menu.filter((item) => item.kind === "burger");
  const extras = state.menu.filter((item) => item.kind !== "burger");
  const burger = valuePick(burgers, random);
  const limitFactor = profile.base + random() * profile.spread;
  const limit = Math.round((referencePrice(burger) * limitFactor) / 25) * 25;
  const declined = burger.price > limit;
  const value = priceRatio(burger);
  const selections = [];
  if (!declined) {
    const extraBurgerChance = clamp(
      0.08,
      0.9,
      0.3 + (1 - value) * 1.0 + profile.extra,
    );
    let qty = 1 + (random() < extraBurgerChance ? 1 : 0);
    if (value < 0.8 && random() < 0.22) qty += 1;
    selections.push({ item: burger, qty });
    const affordableExtras = extras.filter(
      (item) => item.price <= referencePrice(item) * limitFactor,
    );
    if (affordableExtras.length) {
      const extra = valuePick(affordableExtras, random);
      const extraValue = priceRatio(extra);
      if (random() < clamp(0.08, 0.96, 0.72 + (1 - extraValue) * 0.75)) {
        selections.push({
          item: extra,
          qty:
            random() < clamp(0.08, 0.7, 0.2 + (1 - extraValue) * 0.7) ? 2 : 1,
        });
      }
      const second = affordableExtras.find(
        (item) =>
          !selections.some((selection) => selection.item.id === item.id),
      );
      if (
        state.day > 2 &&
        second &&
        random() < clamp(0.05, 0.85, 0.32 + (1 - priceRatio(second)) * 0.8)
      )
        selections.push({ item: second, qty: 1 });
    }
  }
  const lines = selections.map(({ item, qty }) => ({
    id: item.id,
    name: item.name,
    price: item.price,
    cost: itemCost(item, state),
    qty,
  }));
  const total = lines.reduce((sum, item) => sum + item.price * item.qty, 0);
  const cost = lines.reduce((sum, item) => sum + item.cost * item.qty, 0);
  const cash = declined
    ? 0
    : ([1000, 2000, 3000, 4000, 5000, 6000].find((amount) => amount > total) ??
      Math.ceil(total / 1000) * 1000 + 1000);
  const maxPatience =
    Math.max(20, 36 - Math.min(10, state.day - 1)) + state.upgrades.seating * 6;
  let avatar = Math.floor(random() * CUSTOMERS.length);
  const used = new Set(state.shift.queue.map((order) => order.avatar));
  while (used.has(avatar)) avatar = (avatar + 1) % CUSTOMERS.length;
  const quote = declined
    ? `“${money(burger.price)} for a burger? A bit much for me. I’ll pass.”`
    : value < 0.9 && lines[0].qty > 1
      ? `“At these prices, make it ${lines[0].qty === 2 ? "two" : "three"}!”`
      : value < 0.9
        ? "“These prices look good. Count me in!”"
        : "“Hey! Could I get…”";
  return {
    id: ++state.shift.arrived,
    lane,
    customer: CUSTOMERS[avatar],
    avatar,
    profile: profile.name,
    quote,
    considered: { name: burger.name, price: burger.price, limit },
    lines,
    total,
    cost,
    cash,
    patience: maxPatience,
    maxPatience,
    mistakes: 0,
    stage: declined ? "declined" : "total",
    refusalRemaining: declined ? 3.5 : 0,
    acceptedTotal: null,
  };
}

export function startShift(state, random = Math.random) {
  if (state.shift) return "A shift is already in progress.";
  state.shift = {
    remaining: SHIFT_SECONDS,
    paused: false,
    elapsed: 0,
    queue: [],
    activeLane: 0,
    nextArrival: 4.5 / footTraffic(state),
    arrived: 0,
    served: 0,
    lost: 0,
    rejected: 0,
    turnedAway: 0,
    revenue: 0,
    costs: 0,
    tips: 0,
    mistakes: 0,
    streak: 0,
    bestStreak: 0,
    notice: null,
  };
  for (let lane = 0; lane < LANE_COUNT; lane++)
    state.shift.queue.push(createOrder(state, random, lane));
  return null;
}

export function tick(state, seconds, random = Math.random) {
  const shift = state.shift;
  if (!shift || shift.paused || seconds <= 0) return [];
  const dt = Math.min(seconds, shift.remaining);
  shift.elapsed += dt;
  shift.remaining = Math.max(0, shift.remaining - dt);
  const events = [];
  if (shift.notice) {
    shift.notice.remaining -= dt;
    if (shift.notice.remaining <= 0) {
      shift.notice = null;
      events.push({ type: "notice" });
    }
  }
  const heads = new Set(
    Array.from(
      { length: LANE_COUNT },
      (_, lane) => laneQueue(state, lane)[0]?.id,
    ),
  );
  for (const order of shift.queue) {
    if (heads.has(order.id) && order.stage === "declined")
      order.refusalRemaining -= dt;
    else order.patience -= dt;
  }
  const refusals = shift.queue.filter(
    (order) => order.stage === "declined" && order.refusalRemaining <= 0,
  );
  const left = shift.queue.filter(
    (order) =>
      order.patience <= 0 &&
      !(heads.has(order.id) && order.stage === "declined"),
  );
  if (refusals.length) {
    shift.rejected += refusals.length;
    const last = refusals.at(-1);
    shift.notice = { text: `${last.customer}: ${last.quote}`, remaining: 5 };
    events.push({
      type: "rejected",
      count: refusals.length,
      ids: refusals.map((order) => order.id),
    });
  }
  if (left.length) {
    shift.lost += left.length;
    shift.streak = 0;
    events.push({
      type: "left",
      count: left.length,
      ids: left.map((order) => order.id),
    });
  }
  const removed = new Set([...refusals, ...left].map((order) => order.id));
  shift.queue = shift.queue.filter((order) => !removed.has(order.id));
  shift.nextArrival -= dt;
  if (shift.nextArrival <= 0 && shift.remaining > 10) {
    const sizes = Array.from(
      { length: LANE_COUNT },
      (_, lane) => laneQueue(state, lane).length,
    );
    const shortest = Math.min(...sizes);
    if (shortest < LANE_CAPACITY) {
      const options = sizes
        .map((size, lane) => (size === shortest ? lane : -1))
        .filter((lane) => lane >= 0);
      const lane = options[Math.floor(random() * options.length)];
      shift.queue.push(createOrder(state, random, lane));
      events.push({ type: "arrived" });
    } else {
      shift.arrived += 1;
      shift.turnedAway += 1;
      events.push({ type: "full" });
    }
    shift.nextArrival = (4.4 + random() * 1.6) / footTraffic(state);
  }
  ensureActiveLane(state);
  if (shift.remaining <= 0) {
    finishShift(state);
    events.push({ type: "closed" });
  }
  return events;
}

export function submitOrderTotal(state, totalInput) {
  const shift = state.shift;
  if (!shift || shift.paused || !shift.queue.length)
    return { ok: false, message: "Wait for a customer, then ring them up." };
  const order = activeOrder(state);
  if (!order || order.stage === "declined")
    return {
      ok: false,
      message: "This customer is passing on the prices. Serve another line.",
    };
  if (order.stage !== "total")
    return {
      ok: false,
      message: "The total is rung up. Enter their change next.",
    };
  const total = parseMoney(totalInput);
  if (total === null)
    return { ok: false, message: "Enter the total in dollars, like 12.50." };
  if (total !== order.total) {
    order.mistakes += 1;
    shift.mistakes += 1;
    shift.streak = 0;
    return {
      ok: false,
      message: "The total is a little off. Check the quantities and try again.",
    };
  }
  order.stage = "change";
  order.acceptedTotal = total;
  return { ok: true, stage: "change", total, cash: order.cash };
}

export function serveOrder(state, changeInput) {
  const shift = state.shift;
  if (!shift || shift.paused || !shift.queue.length)
    return { ok: false, message: "Wait for a customer, then ring them up." };
  const order = activeOrder(state);
  if (!order || order.stage !== "change" || order.acceptedTotal !== order.total)
    return {
      ok: false,
      message: "Ring up the order total before taking payment.",
    };
  const change = parseMoney(changeInput);
  if (change === null)
    return { ok: false, message: "Enter the change in dollars, like 4.50." };
  if (change !== order.cash - order.total) {
    order.mistakes += 1;
    shift.mistakes += 1;
    shift.streak = 0;
    return {
      ok: false,
      message: "Check the change: cash received minus the total.",
    };
  }
  const speedTip =
    order.patience / order.maxPatience > 0.6 && !order.mistakes ? 50 : 0;
  const tip = speedTip + state.upgrades.plants * 25;
  state.balance += order.total - order.cost + tip;
  shift.revenue += order.total;
  shift.costs += order.cost;
  shift.tips += tip;
  shift.served += 1;
  shift.streak = order.mistakes ? 0 : shift.streak + 1;
  shift.bestStreak = Math.max(shift.bestStreak, shift.streak);
  shift.queue.splice(
    shift.queue.findIndex((item) => item.id === order.id),
    1,
  );
  ensureActiveLane(state);
  return {
    ok: true,
    tip,
    profit: order.total - order.cost + tip,
    customer: order.customer,
  };
}

export function finishShift(state) {
  const shift = state.shift;
  if (!shift) return null;
  const refusingHeads = new Set(
    Array.from({ length: LANE_COUNT }, (_, lane) => laneQueue(state, lane)[0])
      .filter((order) => order?.stage === "declined")
      .map((order) => order.id),
  );
  shift.rejected += refusingHeads.size;
  shift.lost += shift.queue.length - refusingHeads.size;
  const profit = shift.revenue + shift.tips - shift.costs - DAILY_RENT;
  state.balance -= DAILY_RENT;
  const report = {
    day: state.day,
    revenue: shift.revenue,
    costs: shift.costs,
    tips: shift.tips,
    rent: DAILY_RENT,
    profit,
    served: shift.served,
    lost: shift.lost,
    mistakes: shift.mistakes,
    bestStreak: shift.bestStreak,
    visitors: shift.arrived,
    rejected: shift.rejected,
    turnedAway: shift.turnedAway,
  };
  state.lastReport = report;
  state.lifetime.served += report.served;
  state.lifetime.revenue += report.revenue;
  state.lifetime.profit += report.profit;
  state.lifetime.bestStreak = Math.max(
    state.lifetime.bestStreak,
    report.bestStreak,
  );
  for (const key of ["visitors", "rejected", "lost", "turnedAway"])
    state.lifetime[key] = (state.lifetime[key] ?? 0) + report[key];
  state.day += 1;
  state.shift = null;
  return report;
}

export function loadState(storage) {
  try {
    const raw = storage.getItem(SAVE_KEY);
    if (!raw) return initialState();
    const state = JSON.parse(raw);
    if (
      state.version !== 1 ||
      !Number.isFinite(state.balance) ||
      !Number.isInteger(state.day) ||
      state.day < 1 ||
      !Array.isArray(state.menu) ||
      !state.upgrades ||
      !state.lifetime
    )
      throw new Error("Invalid save");
    if (
      !UPGRADES.every(
        (u) =>
          Number.isInteger(state.upgrades[u.id]) &&
          state.upgrades[u.id] >= 0 &&
          state.upgrades[u.id] <= 3,
      )
    )
      throw new Error("Invalid upgrades");
    if (
      state.menu.length < 3 ||
      state.menu.length > 6 ||
      !state.menu.some((i) => i.kind === "burger") ||
      !["side", "drink"].every((kind) =>
        state.menu.some((i) => i.kind === kind),
      )
    )
      throw new Error("Invalid menu");
    if (
      new Set(state.menu.map((i) => i.id)).size !== state.menu.length ||
      state.menu.some(
        (i) =>
          !["burger", "side", "drink"].includes(i.kind) ||
          typeof i.name !== "string" ||
          (i.kind === "burger" && !Array.isArray(i.ingredients)) ||
          (i.kind !== "burger" && !Number.isInteger(i.cost)) ||
          validateItem(i, state),
      )
    )
      throw new Error("Invalid item");
    if (state.shift) {
      if (
        !Number.isFinite(state.shift.remaining) ||
        state.shift.remaining <= 0 ||
        state.shift.remaining > SHIFT_SECONDS ||
        !Array.isArray(state.shift.queue) ||
        state.shift.queue.length > LANE_COUNT * LANE_CAPACITY ||
        state.shift.queue.some(
          (i) =>
            !Number.isFinite(i.total) ||
            !Number.isFinite(i.cost) ||
            !Number.isFinite(i.cash) ||
            !Number.isFinite(i.patience) ||
            !Array.isArray(i.lines),
        )
      )
        throw new Error("Invalid shift");
      state.shift.activeLane ??= 0;
      state.shift.rejected ??= 0;
      state.shift.turnedAway ??= 0;
      state.shift.notice ??= null;
      if (
        !Number.isInteger(state.shift.activeLane) ||
        state.shift.activeLane < 0 ||
        state.shift.activeLane >= LANE_COUNT
      )
        throw new Error("Invalid lane");
      for (const [index, order] of state.shift.queue.entries()) {
        order.lane ??= index % LANE_COUNT;
        if (
          !Number.isInteger(order.lane) ||
          order.lane < 0 ||
          order.lane >= LANE_COUNT
        )
          throw new Error("Invalid lane");
        // Existing saves predate the two-step register. Keep their progress.
        order.stage ??= "total";
        order.acceptedTotal ??= null;
        if (
          !["total", "change", "declined"].includes(order.stage) ||
          (order.stage === "change" && order.acceptedTotal !== order.total) ||
          (order.stage === "declined" &&
            (!order.considered || !Number.isFinite(order.refusalRemaining)))
        )
          throw new Error("Invalid cashier stage");
      }
      if (
        Array.from(
          { length: LANE_COUNT },
          (_, lane) => laneQueue(state, lane).length,
        ).some((size) => size > LANE_CAPACITY)
      )
        throw new Error("Invalid lane capacity");
      ensureActiveLane(state);
      state.shift.paused = true;
    }
    return state;
  } catch {
    return initialState();
  }
}

export function saveState(state, storage) {
  try {
    storage.setItem(SAVE_KEY, JSON.stringify(state));
    return true;
  } catch {
    return false;
  }
}
