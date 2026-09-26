/**
 * doc25 UI tweaks (headless, real index.html):
 *  - Home: covered + stocked week shows a check mark + "Groceries in stock";
 *    no "This week's plan is locked..." note and no "Edit profile" button;
 *    lock behavior kept (Update meal plan disabled for covered weeks).
 *  - Inventory: new depletion copy, last/next grocery order dates, no percentages.
 *  - Schedule: "Next order: <date>" only (no "groceries last ...").
 *  - Profile: no "Saved answers" section.
 *  - Cache-bust ?v=doc25, favicon ?v=leaf8.
 * Optional: SHOTS_DIR=/path saves Home/Inventory/Schedule/Profile screenshots.
 * Run: node scripts/verify-ui-doc25.js
 */
"use strict";
const path = require("path");
const http = require("http");
const fs = require("fs");

function loadPlaywright() {
  for (const t of ["playwright-core", "playwright", "/usr/local/lib/node_modules/playwright-core", "/usr/local/lib/node_modules/playwright"]) {
    try { return require(t); } catch (_) {}
  }
  throw new Error("playwright-core not found");
}
const ROOT = path.resolve(__dirname, "..");
const MIME = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".png": "image/png", ".svg": "image/svg+xml", ".ico": "image/x-icon" };
function serve() {
  return new Promise((resolve) => {
    const srv = http.createServer((req, res) => {
      let p = decodeURIComponent(req.url.split("?")[0]);
      if (p === "/") p = "/index.html";
      const f = path.join(ROOT, p);
      if (!f.startsWith(ROOT) || !fs.existsSync(f)) { res.writeHead(404); res.end(); return; }
      res.writeHead(200, { "Content-Type": MIME[path.extname(f)] || "application/octet-stream" });
      fs.createReadStream(f).pipe(res);
    });
    srv.listen(0, "127.0.0.1", () => resolve(srv));
  });
}
let failures = 0;
function check(cond, msg) {
  if (cond) console.log("  ok  - " + msg);
  else { failures++; console.log("  FAIL- " + msg); }
}

(async () => {
  const { chromium } = loadPlaywright();
  const srv = await serve();
  const base = "http://127.0.0.1:" + srv.address().port + "/";
  const exe = process.env.CHROME_PATH || ["/usr/bin/google-chrome", "/usr/bin/chromium", "/usr/bin/chromium-browser"].find((p) => fs.existsSync(p));
  const browser = await chromium.launch(exe ? { executablePath: exe, headless: true } : { headless: true });
  const page = await browser.newPage({ viewport: { width: 430, height: 900 } });
  const errors = [];
  page.on("pageerror", (e) => errors.push(String(e)));
  page.on("dialog", (d) => d.accept());
  const shots = process.env.SHOTS_DIR;
  if (shots) fs.mkdirSync(shots, { recursive: true });
  const shot = async (name) => { if (shots) await page.screenshot({ path: path.join(shots, name), fullPage: true }); };
  const nav = (name) => page.click(`.nav-btn[data-screen="${name}"]`);
  const next = () => page.click("#onboard-root .mp-next");

  await page.goto(base);
  await page.evaluate(() => localStorage.clear());
  await page.reload();

  console.log("0) Cache-bust");
  check(await page.$eval('script[src^="onboarding.js"]', (s) => s.getAttribute("src")) === "onboarding.js?v=doc28", "onboarding.js?v=doc28 (cache-bust bumped in doc28)");
  const favs = await page.$$eval('link[rel~="icon"], link[rel="apple-touch-icon"]', (ls) => ls.map((l) => l.getAttribute("href")));
  check(favs.length && favs.every((h) => /\?v=leaf8$/.test(h)), "favicons stay ?v=leaf8");

  console.log("1) Seed: onboarding (weekly) + plan");
  await nav("profile");
  await page.fill("#budget", "400"); await next();
  await page.click('input[name="cadence"][value="weekly"]'); await next();
  await page.click('input[name="calorieMode"][value="known"]'); await next();
  await page.fill("#calories", "2000"); await next();
  await page.click('input[name="weightGoal"][value="maintain"]'); await next();
  await page.click('input[name="meals"][value="3m2s"]'); await next();
  await next();
  await page.waitForSelector("#saveClose");
  await page.click("#saveClose");
  await page.waitForSelector("#screen-home .macro-pie");

  console.log("2) Inventory before any order");
  await nav("inventory");
  check((await page.textContent("#lastOrderDate")).includes("None yet"), "last order placeholder 'None yet'");
  const st0 = await page.evaluate(() => JSON.parse(localStorage.getItem("purePrepState")));
  const nextTxt0 = await page.textContent("#nextOrderDate strong");
  check(/^[A-Z][a-z]{2}, [A-Z][a-z]{2} \d{1,2}/.test(nextTxt0.trim()), "next order date friendly format (" + nextTxt0.trim() + ", iso " + st0.nextOrderDate + ")");

  console.log("3) Confirm groceries -> Home shows check + 'Groceries in stock'");
  await nav("home");
  await page.click("#confirmGroceries");
  const homeText = await page.textContent("#screen-home");
  check(!!(await page.$("#stockOk svg")) && (await page.textContent("#stockOk")).trim() === "Groceries in stock", "check mark + 'Groceries in stock'");
  check(!/Inventory has the groceries required/.test(homeText), "old 'Inventory has the groceries…' text gone");
  check(!/This week's plan is locked/.test(homeText), "no 'This week's plan is locked…' note");
  check(!(await page.$("#editProfile")) && !/Edit profile/.test(homeText), "no 'Edit profile' button");
  check(await page.isDisabled("#updateMealPlan"), "lock behavior kept: Update meal plan disabled for covered week");
  await shot("home.png");

  console.log("4) Inventory page");
  await nav("inventory");
  const invText = await page.textContent("#screen-inventory");
  check(invText.includes("Your inventory automatically depletes as your plan days elapse."), "new depletion text");
  check(!/Depletes on plan days/.test(invText), "old depletion text gone");
  const st = await page.evaluate(() => JSON.parse(localStorage.getItem("purePrepState")));
  const lastTxt = (await page.textContent("#lastOrderDate strong")).trim();
  const nextTxt = (await page.textContent("#nextOrderDate strong")).trim();
  const fmt = (iso) => page.evaluate((i) => new Date(i + "T12:00:00").toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" }), iso);
  check(lastTxt === await fmt(st.lastOrderedAt), "last grocery order shown (" + lastTxt + ")");
  check(nextTxt === await fmt(st.nextOrderDate), "next grocery order shown (" + nextTxt + ")");
  check((await page.textContent("#lastOrderDate span")).trim() === "Last grocery order" && (await page.textContent("#nextOrderDate span")).trim() === "Next grocery order", "date labels");
  const itemTexts = await page.$$eval("#screen-inventory .inv-item", (ns) => ns.map((n) => n.textContent));
  // Quantity lines only (product names like "0% Greek yogurt" legitimately contain %).
  const qtyTexts = await page.$$eval("#screen-inventory .inv-item small", (ns) => ns.map((n) => n.textContent));
  check(qtyTexts.length > 0 && qtyTexts.every((t) => !/%|\(\d/.test(t)), "no percentages on " + qtyTexts.length + " inventory items");
  check(itemTexts.every((t) => /left/.test(t)), "quantities still shown");
  await shot("inventory.png");

  console.log("5) Schedule page");
  await nav("schedule");
  const schedTxt = (await page.textContent("#schedNextOrder")).replace(/\s+/g, " ").trim();
  check(schedTxt === "Next order: " + nextTxt, "schedule says only '" + schedTxt + "'");
  check(!/groceries last/i.test(await page.textContent("#screen-schedule")), "no 'groceries last…' text");
  await shot("schedule.png");

  console.log("6) Profile page");
  await nav("profile");
  const profText = await page.textContent("#screen-profile");
  check(!/Saved answers/.test(profText) && !(await page.$("#profileSummary")), "no 'Saved answers' section");
  check(!!(await page.$(".profile-intro")) && !!(await page.$("#profileForm #saveProfile")), "intro note + Save button remain");
  await shot("profile.png");

  check(errors.length === 0, "no page errors" + (errors.length ? ": " + errors.join(" | ") : ""));
  await browser.close();
  srv.close();
  if (failures) { console.log("verify-ui-doc25: " + failures + " FAILED"); process.exit(1); }
  console.log("verify-ui-doc25: OK");
})().catch((e) => { console.error(e); process.exit(1); });
