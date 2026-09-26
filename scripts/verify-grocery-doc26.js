/**
 * doc26 grocery list (headless, real index.html + onboarding.js):
 *  - No duplicate products on the suggested grocery list across many generated
 *    plans (eggs: egg + hard_boiled_egg; peanut butter/chia/hemp/walnuts tsp + tbsp),
 *    and older saved lists with duplicate lines are merged on display.
 *  - Inventory: "I already have some of these items" beside "Confirm groceries ordered";
 *    toggles a number input (unit, min 0, step) on every item.
 *  - Entering an amount adds it to "In stock" at the top; partial stock reduces the
 *    line (qty + package price), excess removes it; total updates live.
 *  - X on an In stock item restores the suggested amount.
 *  - Save persists (reload keeps In stock + reduced list); nothing persists before Save;
 *    leaving the tab / page with unsaved edits asks for confirmation.
 *  - Confirm groceries ordered orders the reduced amounts; inventory = in stock + ordered;
 *    In stock is cleared afterwards.
 *  - Cache-bust ?v=doc26, favicon ?v=leaf8.
 * Optional: SHOTS_DIR=/path saves screenshots. BASE_URL=https://… runs against a live site.
 * Run: node scripts/verify-grocery-doc26.js
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
const money = (s) => Number(String(s).replace(/[^0-9.]/g, ""));

(async () => {
  const { chromium } = loadPlaywright();
  const srv = await serve();
  const base = process.env.BASE_URL || ("http://127.0.0.1:" + srv.address().port + "/");
  const exe = process.env.CHROME_PATH || ["/usr/bin/google-chrome", "/usr/bin/chromium", "/usr/bin/chromium-browser"].find((p) => fs.existsSync(p));
  const browser = await chromium.launch(exe ? { executablePath: exe, headless: true } : { headless: true });
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(String(e)));
  let dialogMode = "accept";
  const dialogs = [];
  page.on("dialog", (d) => { dialogs.push({ type: d.type(), message: d.message() }); if (dialogMode === "accept") d.accept(); else d.dismiss(); });
  const shots = process.env.SHOTS_DIR;
  if (shots) fs.mkdirSync(shots, { recursive: true });
  const shot = async (name, full) => { if (shots) await page.screenshot({ path: path.join(shots, name), fullPage: full !== false }); };
  const nav = (name) => page.click(`.nav-btn[data-screen="${name}"]`);
  const next = () => page.click("#onboard-root .mp-next");
  const getState = () => page.evaluate(() => JSON.parse(localStorage.getItem("purePrepState")));
  const closeNotice = async () => { if (await page.$("#ppNoticeOk")) await page.click("#ppNoticeOk"); };

  await page.goto(base);
  await page.evaluate(() => localStorage.clear());
  await page.reload();

  console.log("0) Cache-bust");
  check(await page.$eval('script[src^="onboarding.js"]', (s) => s.getAttribute("src")) === "onboarding.js?v=doc26", "onboarding.js?v=doc26");
  const favs = await page.$$eval('link[rel~="icon"], link[rel="apple-touch-icon"]', (ls) => ls.map((l) => l.getAttribute("href")));
  check(favs.length && favs.every((h) => /\?v=leaf8$/.test(h)), "favicons stay ?v=leaf8");

  console.log("1) No duplicate grocery items across generated plans");
  const dupReport = await page.evaluate(() => {
    const M = window.MealPlanOnboarding;
    const days = [["mon", "tue", "wed", "thu", "fri"], ["mon", "tue", "wed", "thu", "fri", "sat", "sun"], ["sat", "sun"]];
    let plans = 0, withDup = 0, egglessPlans = 0, eggPlans = 0, mixedEggPlans = 0, spoonMixed = 0;
    const dupNames = {};
    for (const budget of [150, 300, 450, 800])
      for (const cadence of ["weekly", "every_other_week", "monthly"])
        for (const mo of Object.keys(M.MEAL_OPTIONS))
          for (const goal of ["lose", "maintain", "gain"])
            for (let v = 0; v < 3; v++) {
              const a = { budget, cadence, calorieMode: "known", calories: [1500, 2100, 2900][v], weightGoal: goal,
                mealOption: mo, selectedDays: days[(v + plans) % 3] };
              const p = M.buildPlan(a, { variant: v + (plans % 4) });
              plans++;
              const items = p.grocery.items;
              const names = items.map((i) => i.name.toLowerCase().trim());
              const keys = items.map((i) => i.key);
              const seenN = {}, seenK = {};
              let dup = false;
              names.forEach((n) => { if (seenN[n]) { dup = true; dupNames[n] = (dupNames[n] || 0) + 1; } seenN[n] = 1; });
              keys.forEach((k) => { if (seenK[k]) dup = true; seenK[k] = 1; });
              if (dup) withDup++;
              const ingKeys = {};
              p.schedule.forEach((s) => s.suggestion.ingredients.forEach((i) => { if (i._key) ingKeys[i._key] = 1; }));
              if (ingKeys.egg || ingKeys.hard_boiled_egg) eggPlans++; else egglessPlans++;
              if (ingKeys.egg && ingKeys.hard_boiled_egg) mixedEggPlans++;
              if (["chia", "hemp", "walnuts", "pb"].some((f) => ingKeys[f + "_tsp"] && ingKeys[f + "_tbsp"])) spoonMixed++;
              // Each list line equals the summed (converted) need for its product.
              const need = M.dailyGroceryNeeds(p.schedule);
              const planDays = p.grocery.planDays;
              items.forEach((it) => {
                const expect = M.roundBuyQty(it.key, need[it.key] * planDays);
                if (Math.abs(expect - it.qty) > 1e-6) { dup = true; dupNames["qty-mismatch:" + it.key] = 1; }
              });
            }
    return { plans, withDup, dupNames, eggPlans, egglessPlans, mixedEggPlans, spoonMixed };
  });
  console.log("     " + JSON.stringify(dupReport));
  check(dupReport.plans >= 400 && dupReport.withDup === 0, "no duplicate names/keys and quantities sum correctly in " + dupReport.plans + " plans");
  check(dupReport.mixedEggPlans > 0, "covers plans that mix eggs + hard boiled eggs (" + dupReport.mixedEggPlans + ")");

  console.log("2) Seed: onboarding (weekly) + plan");
  await nav("profile");
  await page.fill("#budget", "500"); await next();
  await page.click('input[name="cadence"][value="weekly"]'); await next();
  await page.click('input[name="calorieMode"][value="known"]'); await next();
  await page.fill("#calories", "2600"); await next();
  await page.click('input[name="weightGoal"][value="maintain"]'); await next();
  // 3 meals @ 2600, $500: this plan mixes eggs (bowls) and hard boiled eggs — the reported duplicate.
  await page.click('input[name="meals"][value="3m"]'); await next();
  await next();
  await page.waitForSelector("#saveClose");
  await page.click("#saveClose");
  await page.waitForSelector("#screen-home .macro-pie");

  // Swap in a plan that mixes eggs (bowls) + hard boiled eggs (snack/fat) — the reported duplicate case.
  const swapped = await page.evaluate(() => {
    const M = window.MealPlanOnboarding;
    const st = JSON.parse(localStorage.getItem("purePrepState"));
    for (const cal of [2600, 2200, 2400, 2000, 2800])
      for (const budget of [500, 400, 300, 600]) {
        const a = Object.assign({}, st.answers, { calories: cal, budget, mealOption: "3m", meals: 3, snacks: 0 });
        const p = M.buildPlan(a);
        const ks = {};
        p.schedule.forEach((sl) => sl.suggestion.ingredients.forEach((i) => { ks[i._key] = 1; }));
        if (ks.egg && ks.hard_boiled_egg) {
          st.plan = p; st.groceryList = p.grocery;
          st.planBlocks.forEach((b) => { b.plan = p; });
          localStorage.setItem("purePrepState", JSON.stringify(st));
          return cal + "/$" + budget;
        }
      }
    return null;
  });
  check(!!swapped, "using a mixed eggs + hard-boiled-eggs plan (" + swapped + ")");
  await page.reload();
  {
    const st = await getState();
    const ingKeys = {};
    st.plan.schedule.forEach((sl) => sl.suggestion.ingredients.forEach((i) => { if (i._key) ingKeys[i._key] = (ingKeys[i._key] || 0) + i._qty; }));
    const eggLines = st.plan.grocery.items.filter((i) => /egg/i.test(i.name) && !/white/i.test(i.name));
    const expectEggs = Math.ceil(((ingKeys.egg || 0) + (ingKeys.hard_boiled_egg || 0)) * st.plan.grocery.planDays);
    check(!!ingKeys.egg && !!ingKeys.hard_boiled_egg, "seed plan uses eggs AND hard boiled eggs");
    check(eggLines.length === 1 && eggLines[0].key === "egg" && eggLines[0].qty === expectEggs,
      "grocery list: one 'Large eggs' line with the combined count (" + (eggLines[0] && eggLines[0].qty) + " = " + expectEggs + ")");
  }

  console.log("3) Legacy saved list with eggs twice is merged on the Inventory page");
  {
    const st = await getState();
    const saved = JSON.stringify(st);
    const legacy = JSON.parse(saved);
    const items = legacy.plan.grocery.items.filter((i) => i.key !== "egg" && i.key !== "hard_boiled_egg");
    items.push({ key: "egg", name: "Large eggs", qty: 10, qtyLabel: "10 egg", unit: "egg", packages: 1, lineTotal: 2.98 });
    items.push({ key: "hard_boiled_egg", name: "Large eggs", qty: 6, qtyLabel: "6 egg", unit: "egg", packages: 1, lineTotal: 2.98 });
    legacy.plan.grocery.items = items;
    await page.evaluate((s) => localStorage.setItem("purePrepState", s), JSON.stringify(legacy));
    await page.reload();
    await nav("inventory");
    const names = await page.$$eval("#groceryRows .grocery-row:not([hidden]) .gr-main", (ns) => ns.map((n) => n.childNodes[0].textContent.trim()));
    const eggRows = names.filter((n) => n === "Large eggs");
    check(eggRows.length === 1, "Large eggs listed once (" + eggRows.length + ")");
    check(new Set(names).size === names.length, "every row unique (" + names.length + " rows)");
    const eggQty = await page.textContent('#groceryRows .grocery-row[data-key="egg"] .gr-qty');
    check(/buy 16 egg/.test(eggQty), "legacy egg lines summed (" + eggQty.trim() + ")");
    await page.evaluate((s) => localStorage.setItem("purePrepState", s), saved);
    await page.reload();
  }

  console.log("4) Inventory: button + edit mode inputs");
  await nav("inventory");
  const rowNames = await page.$$eval("#groceryRows .grocery-row:not([hidden]) .gr-main", (ns) => ns.map((n) => n.childNodes[0].textContent.trim()));
  check(rowNames.length > 3 && new Set(rowNames).size === rowNames.length, "suggested list has no duplicates (" + rowNames.length + " items)");
  const haveTxt = (await page.textContent("#haveSomeBtn")).trim();
  check(haveTxt === "I already have some of these items", "secondary button label: " + haveTxt);
  check(await page.evaluate(() => {
    const a = document.getElementById("confirmGroceries2"), b = document.getElementById("haveSomeBtn");
    return a.parentElement === b.parentElement && b.classList.contains("secondary") && a.nextElementSibling === b;
  }), "button sits beside 'Confirm groceries ordered'");
  check((await page.$$("#groceryRows .gr-have-input:visible")).length === 0, "no inputs before clicking");
  check(await page.isHidden("#inStockPanel"), "In stock hidden while empty");
  await page.click("#haveSomeBtn");
  const inputs = await page.$$eval("#groceryRows .grocery-row", (rows) => rows.map((r) => {
    const i = r.querySelector(".gr-have-input");
    const lab = r.querySelector(".gr-have");
    return { key: r.dataset.key, visible: !!(lab && lab.offsetParent), type: i && i.type, min: i && i.min, step: i && Number(i.step),
      unit: r.querySelector(".gr-unit") && r.querySelector(".gr-unit").textContent, dataUnit: i && i.dataset.unit };
  }));
  check(inputs.length === rowNames.length && inputs.every((x) => x.visible && x.type === "number" && x.min === "0" && x.step > 0),
    "number input (min 0, step) shown on all " + inputs.length + " items");
  const plural = { egg: "eggs", white: "whites" };
  check(inputs.every((x) => x.unit && (x.unit === x.dataUnit || x.unit === plural[x.dataUnit])), "unit shown next to each input");
  check(inputs.filter((x) => x.dataUnit === "egg" || x.dataUnit === "oz" || x.dataUnit === "medium").every((x) => x.step === 1) &&
        inputs.filter((x) => x.dataUnit === "cup").every((x) => x.step === 0.25), "sensible steps (1 for eggs/oz/each, 0.25 cup)");
  check(await page.isVisible("#inStockPanel"), "In stock section appears at top in edit mode");
  check(await page.evaluate(() => document.querySelector("#screen-inventory").firstElementChild.id === "inStockPanel"), "In stock is the first section on the page");
  check(await page.isVisible("#saveInStock") && await page.evaluate(() => {
    const s = document.getElementById("saveInStock").closest(".inv-save-actions");
    return s && s === document.querySelector("#screen-inventory").lastElementChild;
  }), "Save button at the bottom of the page");

  // Pick a partial item (whole-number unit, qty >= 3) and a different item to over-cover.
  const lines = await page.evaluate(() => {
    const M = window.MealPlanOnboarding;
    const st = JSON.parse(localStorage.getItem("purePrepState"));
    return M.normalizeGroceryList(st.plan.grocery).items.map((i) => ({ key: i.key, name: i.name, qty: i.qty, unit: i.unit, lineTotal: i.lineTotal, step: M.groceryUnitStep(i.key) }));
  });
  const A = lines.find((l) => l.step === 1 && l.qty >= 3 && l.key === "egg") || lines.find((l) => l.step === 1 && l.qty >= 3);
  const B = lines.find((l) => l !== A && l.lineTotal > 0);
  check(!!A && !!B, "test items: partial=" + (A && A.key + " " + A.qty) + ", excess=" + (B && B.key + " " + B.qty));
  const total0 = money(await page.textContent("#groceryTotal"));
  const rowQty = (k) => page.textContent(`#groceryRows .grocery-row[data-key="${k}"] .gr-qty`);
  const rowPrice = (k) => page.textContent(`#groceryRows .grocery-row[data-key="${k}"] .gr-price`);
  const rowHidden = (k) => page.$eval(`#groceryRows .grocery-row[data-key="${k}"]`, (r) => r.hidden);
  const stockKeys = () => page.$$eval("#inStockList .in-stock-item", (ns) => ns.map((n) => n.dataset.key));

  console.log("5) Partial stock reduces the amount (live while typing)");
  const haveA = 2;
  await page.fill(`.gr-have-input[data-key="${A.key}"]`, String(haveA));
  await page.waitForFunction((k) => !!document.querySelector(`#inStockList .in-stock-item[data-key="${k}"]`), A.key, { timeout: 3000 });
  const expectA = await page.evaluate(([k, q]) => window.MealPlanOnboarding.groceryLine(k, q), [A.key, A.qty - haveA]);
  const qtyA = await rowQty(A.key);
  check(!(await rowHidden(A.key)) && qtyA.includes("buy " + expectA.qtyLabel), "partial: row stays, now '" + qtyA.trim() + "' (was " + A.qty + ")");
  check(money(await rowPrice(A.key)) === expectA.lineTotal, "partial: price re-computed with package logic ($" + expectA.lineTotal + ")");
  const isA = await page.textContent(`#inStockList .in-stock-item[data-key="${A.key}"]`);
  check(isA.includes(A.name) && (isA.includes(haveA + " " + A.unit) || isA.includes(haveA + " " + plural[A.unit])) && !!(await page.$(`#inStockList .in-stock-x[data-key="${A.key}"]`)), "In stock shows name, amount + unit and an X");
  const total1 = money(await page.textContent("#groceryTotal"));
  check(Math.abs(total1 - (total0 - A.lineTotal + expectA.lineTotal)) < 0.011, "total updated ($" + total0 + " → $" + total1 + ")");

  console.log("6) Excess stock removes the item");
  const haveB = Math.ceil(B.qty) + 3;
  await page.fill(`.gr-have-input[data-key="${B.key}"]`, String(haveB));
  await page.press(`.gr-have-input[data-key="${B.key}"]`, "Tab");
  check(await rowHidden(B.key), "excess: " + B.name + " removed from suggested list");
  check((await stockKeys()).indexOf(B.key) !== -1, "excess: " + B.name + " in In stock");
  const total2 = money(await page.textContent("#groceryTotal"));
  check(Math.abs(total2 - (total1 - B.lineTotal)) < 0.011, "total drops by the removed line ($" + total2 + ")");
  check(await page.isVisible("#inStockDirtyNote"), "'Unsaved changes' shown");
  check(!((await getState()).inStock || []).length, "nothing persisted before Save");
  await shot("doc26-edit-local.png", false);

  console.log("7) X restores the suggested amount");
  await page.click(`#inStockList .in-stock-x[data-key="${B.key}"]`);
  check(!(await rowHidden(B.key)) && (await stockKeys()).indexOf(B.key) === -1, "X: " + B.name + " back on list, gone from In stock");
  check(money(await rowPrice(B.key)) === B.lineTotal && (await rowQty(B.key)).trim().startsWith("buy ") && !(await rowQty(B.key)).includes("gr-was"), "X: original amount/price restored");
  check(await page.$eval(`.gr-have-input[data-key="${B.key}"]`, (i) => i.value === ""), "X: input cleared");
  check(Math.abs(money(await page.textContent("#groceryTotal")) - total1) < 0.011, "X: total restored");
  await page.fill(`.gr-have-input[data-key="${B.key}"]`, String(haveB));
  await page.press(`.gr-have-input[data-key="${B.key}"]`, "Tab");

  console.log("8) Unsaved-leave prompts");
  dialogMode = "dismiss"; dialogs.length = 0;
  await nav("home");
  check(dialogs.some((d) => d.type === "confirm" && /unsaved In stock/i.test(d.message)), "leaving the tab asks for confirmation");
  check(await page.evaluate(() => window.PurePrepApp.screen()) === "inventory" && !(await rowHidden(A.key)) && await rowHidden(B.key), "Cancel keeps you on Inventory with edits intact");
  // beforeunload (reload / close with unsaved edits)
  check(await page.evaluate(() => {
    const e = new Event("beforeunload", { cancelable: true });
    window.dispatchEvent(e);
    return e.defaultPrevented;
  }), "beforeunload is blocked while edits are unsaved");
  dialogMode = "accept";

  console.log("9) Save persists across reload");
  await page.click("#saveInStock");
  await page.waitForSelector("#ppNotice");
  check(/Saved/.test(await page.textContent("#ppNoticeTitle")), "brief confirmation after saving: " + (await page.textContent("#ppNoticeTitle")).trim());
  await closeNotice();
  check(await page.isHidden("#inStockDirtyNote"), "dirty note cleared");
  const stSaved = await getState();
  const savedMap = {}; (stSaved.inStock || []).forEach((r) => { savedMap[r.key] = r.qty; });
  check(savedMap[A.key] === haveA && savedMap[B.key] === haveB && Object.keys(savedMap).length === 2, "localStorage inStock = " + JSON.stringify(savedMap));
  check(await page.evaluate(() => {
    const e = new Event("beforeunload", { cancelable: true }); window.dispatchEvent(e); return !e.defaultPrevented;
  }), "no beforeunload prompt after saving");
  await page.reload();
  await nav("inventory");
  check(await page.isVisible("#inStockPanel") && JSON.stringify((await stockKeys()).sort()) === JSON.stringify([A.key, B.key].sort()), "after reload: In stock lists both items");
  check((await rowQty(A.key)).includes("buy " + expectA.qtyLabel) && await rowHidden(B.key), "after reload: reduced list (A reduced, B removed)");
  check(Math.abs(money(await page.textContent("#groceryTotal")) - total2) < 0.011, "after reload: total $" + total2);
  check(await page.isHidden(".gr-have"), "after reload: edit mode off (inputs hidden) until toggled");
  await shot("doc26-inventory-local.png", false);

  console.log("10) Discarding: leave + accept drops unsaved edits");
  await page.click("#haveSomeBtn");
  await page.click(`#inStockList .in-stock-x[data-key="${A.key}"]`);
  dialogs.length = 0;
  await nav("home");
  check(dialogs.some((d) => d.type === "confirm"), "confirm shown");
  await nav("inventory");
  check((await stockKeys()).indexOf(A.key) !== -1, "unsaved removal discarded; saved In stock intact");

  console.log("11) Confirm groceries ordered uses reduced amounts");
  const stBefore = await getState();
  const invBefore = {}; (stBefore.inventory || []).forEach((i) => { invBefore[i.key] = i.qtyRemaining; });
  await page.click("#confirmGroceries2");
  const st2 = await getState();
  const ordered = {}; (st2.groceryList.items || []).forEach((i) => { ordered[i.key] = i.qty; });
  check(ordered[A.key] === expectA.qty, "ordered " + A.key + " = " + ordered[A.key] + " (reduced from " + A.qty + ")");
  check(!(B.key in ordered), "ordered list omits fully-stocked " + B.key);
  const inv = {}; (st2.inventory || []).forEach((i) => { inv[i.key] = i.qtyRemaining; });
  check(Math.abs(inv[A.key] - ((invBefore[A.key] || 0) + haveA + expectA.qty)) < 1e-6, "inventory " + A.key + " = in stock + ordered (" + inv[A.key] + ")");
  check(Math.abs(inv[B.key] - ((invBefore[B.key] || 0) + haveB)) < 1e-6, "inventory " + B.key + " = in stock only (" + inv[B.key] + ")");
  const invKeys = (st2.inventory || []).map((i) => i.key);
  check(new Set(invKeys).size === invKeys.length, "inventory has one row per product");
  check(Array.isArray(st2.inStock) && st2.inStock.length === 0 && (st2.groceryList.inStockApplied || []).length === 2, "In stock consumed into inventory and cleared");
  check(st2.groceriesConfirmed && (st2.groceryCoveredWeeks || []).length > 0, "order confirmed + weeks covered (plan-lock unaffected)");
  check(/Your inventory/.test(await page.textContent("#screen-inventory")), "Inventory view switches to 'Your inventory'");

  console.log("12) Legacy inventory rows merge onto one product key");
  {
    const legacy = await getState();
    legacy.inventory = [
      { key: "egg", name: "Large eggs", unit: "egg", qtyRemaining: 5, initialQty: 5 },
      { key: "hard_boiled_egg", name: "Large eggs", unit: "egg", qtyRemaining: 4, initialQty: 4 },
      { key: "pb_tsp", name: "Peanut butter", unit: "tsp", qtyRemaining: 6, initialQty: 6 },
    ];
    await page.evaluate((s) => localStorage.setItem("purePrepState", JSON.stringify(s)), legacy);
    await page.reload();
    await nav("inventory");
    const txt = await page.$$eval("#screen-inventory .inv-item", (ns) => ns.map((n) => n.innerText.replace(/\s+/g, " ").trim()));
    check(txt.filter((t) => /Large eggs/.test(t)).length === 1 && txt.some((t) => /Large eggs 9 egg left/.test(t)), "eggs merged: " + txt.join(" | "));
    check(txt.some((t) => /Peanut butter 2 tbsp left/.test(t)), "6 tsp peanut butter → 2 tbsp");
  }

  check(errors.length === 0, "no page errors" + (errors.length ? ": " + errors.join(" | ") : ""));
  await browser.close();
  srv.close();
  if (failures) { console.log("verify-grocery-doc26: " + failures + " FAILED"); process.exit(1); }
  console.log("verify-grocery-doc26: OK");
})().catch((e) => { console.error(e); process.exit(1); });
