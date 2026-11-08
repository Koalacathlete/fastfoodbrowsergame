# The Daily Bun

A browser game about running a neighborhood burger shop and thinking on your feet. Design a menu, set your prices, do the cashier math, and turn your profits into a better little business.

## Run locally

Requires Node.js 20.19+ or 22.12+ (tested with Node.js 24).

```sh
npm ci
npm run dev
```

Vite serves the game on port 5173 by default. No database, API keys, backend, or external services are needed. Illustrations and fonts are bundled locally. The project uses a local, ignored npm cache so installation also works in restricted cloud workspaces.

For a production build:

```sh
npm run build
npm run preview
```

Deploy the generated `dist/` directory to any static web host.

## Deploy on Render

The game runs as a Render **Static Site**. The repository includes a `render.yaml` Blueprint and a `.node-version` file selecting Node.js 24. It does not need a database, secrets, or environment variables.

First, commit and push the game files, `package-lock.json`, `.node-version`, and `render.yaml` to `main` in `Koalacathlete/fastfoodbrowsergame`. Files that only exist in your development workspace are not available to Render. Keep `node_modules/`, `.npm-cache/`, and `dist/` untracked; Render builds the site from source.

For the dashboard setup:

1. In the [Render dashboard](https://dashboard.render.com/), select **New → Static Site** and connect the GitHub repository. Grant Render repository access if prompted.
2. Use these settings:

   | Setting           | Value                                                 |
   | ----------------- | ----------------------------------------------------- |
   | Name              | `the-daily-bun` (or another available name)           |
   | Branch            | `main`                                                |
   | Root directory    | Leave blank; `package.json` is at the repository root |
   | Build command     | `npm ci --include=dev && npm run build`               |
   | Publish directory | `dist`                                                |

3. Create the static site. When the deployment finishes, open the HTTPS address Render assigns to it, then click **Open for day 1**. Check that you can serve a customer and that refreshing restores the shift paused.

Alternatively, choose **New → Blueprint**, connect the repository, and let Render read `render.yaml`. Review the proposed static site and deploy it. The dashboard setup and Blueprint flow are two ways to create the same site; choose one.

The build explicitly includes development dependencies because Vite and the bundled fonts are needed to generate the site. There is no server start command for this static deployment. The current UI uses buttons rather than URL routes, so it needs no custom redirect or rewrite rules.

With automatic deploys enabled, later pushes to the selected branch rebuild the site. Render provides HTTPS for its assigned domain; custom domains can be added in the site's settings.

Saves remain local to each browser and origin. A save made during local development will not automatically appear on the Render domain, and moving to a custom domain creates a separate save location. Redeploying to the same domain preserves browser saves unless the player clears browser storage.

## Play

1. **Make your menu.** Start with three signature burgers, fries, and lemonade. Edit names and prices, choose a patty and individual toppings, or create a fourth burger. The menu builder shows ingredient costs, profit per sale, and margins. A burger needs one bun and one patty; toppings are optional. Prices must exceed food costs.
2. **Open for the day.** A shift lasts 90 seconds and opens with one customer in each of three lines. New visitors arrive roughly every four to six seconds and join a shorter line. Bargain hunters, lunch regulars, and customers treating themselves have different price tolerances. Some will visibly decline an expensive burger and leave without a sale. Value prices encourage larger burger quantities and more extras; overpriced sides can be skipped. From day three, orders can include both a side and a drink. The sidewalk sign brings in more visitors, including people who may decide not to buy.
3. **Work the till.** You play from behind the counter, with a customer in front of you and a cash register in the foreground. Read their order slip and add up quantities × unit prices. Enter the total on the numpad and press **TOTAL**. Only then does the customer hand over their cash. Subtract the accepted total from their payment, enter the change, and press **CHANGE** to complete the sale. You can click the keys or type dollar amounts with a decimal point (for example, `12.50`), then press Enter. **C** clears an entry; **⌫** removes the last character. Wrong answers allow another attempt while patience continues to run down. Money is only credited after both steps are complete.
4. **Keep all three lines moving.** Each line can hold three people, for nine visible customers at once, with a single till. Click a front customer or a numbered line button to choose whom to serve. Each line keeps its own first-in, first-out order. You can change lines before confirming a total, and your partial entry will be remembered. Once cash changes hands, finish giving that customer's change before switching. Waiting customers in every line lose patience. A full shop turns new arrivals away. A fast, first-try answer earns a $0.50 tip; patience becomes tighter over the first ten days. Pause at any time; visiting the menu/upgrades pages or hiding the browser tab pauses automatically.
5. **Close the books.** Ingredient costs are deducted only with completed sales; price refusals cost no ingredients. At closing, $12 in daily overhead is charged. The report reconciles sales + tips − ingredients − overhead and accounts for every visitor as served, refused on price, left waiting, or turned away by full lines. It also shows conversion, average order value, perfect streaks, and math retries. Closing early charges overhead and settles the remaining lines too.
6. **Invest in the shop.** Each upgrade has three permanent levels:

   | Upgrade       | Benefit per level                    |
   | ------------- | ------------------------------------ |
   | Cozy seating  | 6 extra seconds of customer patience |
   | Sidewalk sign | 18% more foot traffic                |
   | Kitchen tools | 5% lower ingredient costs            |
   | Happy plants  | $0.25 extra tip per customer served  |

Menu changes and purchases happen between shifts. Ingredients are bought as needed, so even a shop with a negative balance can keep operating and recover through profitable sales.

## Saves

Progress automatically saves to this browser's `localStorage`, including the menu, bank balance, upgrades, records, all three lines, the selected line, and whether the current customer is ordering or paying. Reloaded shifts start paused; time away is not simulated. Existing saves from the original single-queue counter are migrated without resetting progress. **Fresh start** resets progress after confirmation. If browser storage is blocked, the game remains playable but cannot persist progress. Saves are local to the device and browser; there is no cloud sync.

## Checks

```sh
npm test            # Money, economics, customers, shifts, upgrades, and persistence
npm run build      # Production bundle
npm run test:browser
```

The browser smoke test starts and stops its own Vite server on port 4174. It exercises recipe creation/editing, invalid prices, upgrades, both cashier stages, numpad keys, three visible lines, switching and restoring partial entries, payment locking, visible price refusals, reports, pause/resume, a full timed shift, early closing, reset, help, and mobile layouts. Engine tests also compare buyer conversion and basket sizes across seeded populations at different price levels. Screenshots are written to the ignored `test-results/` directory.

Browser tests use system Chromium at `/usr/bin/chromium` when present. Otherwise, install Playwright's Chromium with `npx playwright install chromium`, or set `CHROMIUM_PATH` to an installed Chromium executable.

## Project structure

- `src/game.js` — game rules and accounting; all money is stored as integer cents.
- `src/main.js` — browser interface, game clock, dialogs, and save orchestration.
- `src/counter-view.js` and `src/counter.css` — first-person counter, customers, order slips, and physical register interface.
- `src/counter-art.js` — shop interior and full-size customer illustrations.
- `src/market.css` — three visible lines, waiting customers, and pricing feedback.
- `src/cashier.js` — decimal entry and editing rules for the register numpad.
- `src/art.js` — original SVG shop, food, customer, and icon illustrations.
- `src/style.css` — responsive layout and locally bundled typography.
- `tests/` — engine tests and Chromium smoke tests.

This is the base management/cashier loop. Inventory planning, taxes, staffing, supply events, sound, and additional difficulty modes are future extensions.
