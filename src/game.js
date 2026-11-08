export const SHIFT_SECONDS = 90;
export const DAILY_RENT = 1200;
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
    effect: "+18% customer demand per level",
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
    lifetime: { served: 0, revenue: 0, profit: 0, bestStreak: 0 },
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

export function demand(state) {
  // Guests judge the menu's value, independent of the kitchen's waste savings.
  // Burgers carry more weight; sides and drinks have higher normal markups.
  const normalMarkup = { burger: 2.6, side: 4, drink: 5.4 };
  let weight = 0;
  const weightedValue = state.menu.reduce((sum, item) => {
    const importance = item.kind === "burger" ? 2 : 1;
    weight += importance;
    return (
      sum +
      (importance * item.price) / (baseItemCost(item) * normalMarkup[item.kind])
    );
  }, 0);
  const ratio = weightedValue / weight;
  return Math.max(
    0.35,
    Math.min(1.6, 1.05 - (ratio - 1) * 0.65 + state.upgrades.sign * 0.18),
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

export function createOrder(state, random = Math.random) {
  const burgers = state.menu.filter((i) => i.kind === "burger");
  const extras = state.menu.filter((i) => i.kind !== "burger");
  const burger = burgers[Math.floor(random() * burgers.length)];
  const selections = [{ item: burger, qty: random() < 0.3 ? 2 : 1 }];
  if (random() < 0.85)
    selections.push({
      item: extras[Math.floor(random() * extras.length)],
      qty: random() < 0.25 ? 2 : 1,
    });
  if (state.day > 2 && random() < 0.4) {
    const extra = extras.find(
      (i) => !selections.some((s) => s.item.id === i.id),
    );
    if (extra) selections.push({ item: extra, qty: 1 });
  }
  const lines = selections.map(({ item, qty }) => ({
    id: item.id,
    name: item.name,
    price: item.price,
    cost: itemCost(item, state),
    qty,
  }));
  const total = lines.reduce((sum, i) => sum + i.price * i.qty, 0);
  const cost = lines.reduce((sum, i) => sum + i.cost * i.qty, 0);
  const cash =
    [1000, 2000, 3000, 4000, 5000, 6000].find((amount) => amount > total) ??
    Math.ceil(total / 1000) * 1000 + 1000;
  const maxPatience =
    Math.max(20, 36 - Math.min(10, state.day - 1)) + state.upgrades.seating * 6;
  const seq = ++state.shift.arrived;
  const avatar = Math.floor(random() * CUSTOMERS.length);
  return {
    id: seq,
    customer: CUSTOMERS[avatar],
    avatar,
    lines,
    total,
    cost,
    cash,
    patience: maxPatience,
    maxPatience,
    mistakes: 0,
  };
}

export function startShift(state, random = Math.random) {
  if (state.shift) return "A shift is already in progress.";
  state.shift = {
    remaining: SHIFT_SECONDS,
    paused: false,
    elapsed: 0,
    queue: [],
    nextArrival: 9 / demand(state),
    arrived: 0,
    served: 0,
    lost: 0,
    revenue: 0,
    costs: 0,
    tips: 0,
    mistakes: 0,
    streak: 0,
    bestStreak: 0,
  };
  state.shift.queue.push(createOrder(state, random));
  return null;
}

export function tick(state, seconds, random = Math.random) {
  const shift = state.shift;
  if (!shift || shift.paused || seconds <= 0) return [];
  const dt = Math.min(seconds, shift.remaining);
  shift.elapsed += dt;
  shift.remaining = Math.max(0, shift.remaining - dt);
  const events = [];
  for (const order of shift.queue) order.patience -= dt;
  const left = shift.queue.filter((i) => i.patience <= 0);
  if (left.length) {
    shift.queue = shift.queue.filter((i) => i.patience > 0);
    shift.lost += left.length;
    shift.streak = 0;
    events.push({
      type: "left",
      count: left.length,
      ids: left.map((i) => i.id),
    });
  }
  shift.nextArrival -= dt;
  if (shift.nextArrival <= 0 && shift.remaining > 12) {
    if (shift.queue.length < 3) {
      shift.queue.push(createOrder(state, random));
      events.push({ type: "arrived" });
    }
    shift.nextArrival = (10 + random() * 4) / demand(state);
  }
  if (shift.remaining <= 0) {
    finishShift(state);
    events.push({ type: "closed" });
  }
  return events;
}

export function serveOrder(state, totalInput, changeInput) {
  const shift = state.shift;
  if (!shift || shift.paused || !shift.queue.length)
    return { ok: false, message: "Wait for a customer, then ring them up." };
  const order = shift.queue[0];
  const total = parseMoney(totalInput);
  const change = parseMoney(changeInput);
  if (total === null || change === null)
    return { ok: false, message: "Enter both amounts in dollars, like 12.50." };
  if (total !== order.total || change !== order.cash - order.total) {
    order.mistakes += 1;
    shift.mistakes += 1;
    shift.streak = 0;
    return {
      ok: false,
      message:
        total !== order.total
          ? "The order total is a little off. Check quantities and try again."
          : "Check your change: cash received minus the order total.",
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
  shift.queue.shift();
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
  shift.lost += shift.queue.length;
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
  };
  state.lastReport = report;
  state.lifetime.served += report.served;
  state.lifetime.revenue += report.revenue;
  state.lifetime.profit += report.profit;
  state.lifetime.bestStreak = Math.max(
    state.lifetime.bestStreak,
    report.bestStreak,
  );
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
        state.shift.queue.length > 3 ||
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
