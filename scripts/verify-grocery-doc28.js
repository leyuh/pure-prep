/**
 * doc28 (was verify-grocery-doc27/doc26): the "I already have some of these items" button
 *   becomes "Done adding what I have" in edit mode and the primary "Save what I have" button
 *   whenever there are unsaved drafts (typed amounts or ✕ removals); no separate bottom Save.
 * doc27: In stock edits are drafts until Save.
 * doc26 grocery list (headless, real index.html + onboarding.js):
 *  - No duplicate products on the suggested grocery list across many generated
 *    plans (eggs: egg + hard_boiled_egg; peanut butter/chia/hemp/walnuts tsp + tbsp),
 *    and older saved lists with duplicate lines are merged on display.
 *  - Inventory: "I already have some of these items" beside "Confirm groceries ordered";
 *    toggles a number input (unit, min 0, step) on every item.
 *  - Typing an amount (or ✕ on an In stock item) is only a draft: list amounts, prices,
 *    total and the In stock card do not change until Save.
 *  - Save: amounts go to "In stock" at the top; partial stock reduces the line
 *    (qty + package price), excess removes it; total updates. ✕ + Save restores.
 *  - Save persists (reload keeps In stock + reduced list); nothing persists before Save;
 *    leaving the tab / page with unsaved edits asks for confirmation.
 *  - Confirm groceries ordered orders the reduced amounts; inventory = in stock + ordered;
 *    In stock is cleared afterwards.
 *  - Cache-bust ?v=doc28, favicon ?v=leaf8.
 * Optional: SHOTS_DIR=/path saves screenshots. BASE_URL=https://… runs against a live site.
 * Run: node scripts/verify-grocery-doc28.js
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
  check(await page.$eval('script[src^="onboarding.js"]', (s) => s.getAttribute("src")) === "onboarding.js?v=doc28", "onboarding.js?v=doc28");
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
  const btn = () => page.$eval("#haveSomeBtn", (b) => ({ text: b.textContent.trim(), mode: b.dataset.mode, secondary: b.classList.contains("secondary") }));
  let hb = await btn();
  check(hb.text === "Done adding what I have" && hb.mode === "done" && hb.secondary, "edit mode, no changes: button reads 'Done adding what I have'");
  check(!(await page.$("#saveInStock")) && !(await page.$(".inv-save-actions")) && !(await page.$("#inStockDirtyNote")), "no separate Save button / 'Unsaved changes' label at the bottom");
  await page.click("#haveSomeBtn");
  check(await page.isHidden(".gr-have") && (await btn()).text === "I already have some of these items", "Done exits edit mode (inputs hidden, label restored)");
  await page.click("#haveSomeBtn");

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

  const pending = (k) => page.$eval(`.gr-have-input[data-key="${k}"]`, (i) => ({ value: i.value, pending: i.classList.contains("pending") }));
  const totalNow = async () => money(await page.textContent("#groceryTotal"));
  const savedStock = async () => { const m = {}; ((await getState()).inStock || []).forEach((r) => { m[r.key] = r.qty; }); return m; };
  const expectA = await page.evaluate(([k, q]) => window.MealPlanOnboarding.groceryLine(k, q), [A.key, A.qty - 2]);
  const haveA = 2;
  const haveB = Math.ceil(B.qty) + 3;
  const qtyA0 = (await rowQty(A.key)).trim();

  console.log("5) Typing is a draft: list, prices, total and In stock do NOT change before Save");
  await page.fill(`.gr-have-input[data-key="${A.key}"]`, String(haveA));
  await page.waitForTimeout(900); // longer than the old doc26 debounce
  check((await rowQty(A.key)).trim() === qtyA0 && money(await rowPrice(A.key)) === A.lineTotal, "partial draft: " + A.name + " still '" + qtyA0 + "' at $" + A.lineTotal);
  check(await totalNow() === total0, "total unchanged ($" + total0 + ")");
  check((await stockKeys()).length === 0 && !!(await page.$("#inStockEmpty")), "In stock card not updated before Save");
  const pa = await pending(A.key);
  check(pa.value === String(haveA) && pa.pending, "input keeps typed draft value (" + pa.value + ") with pending style");
  check(await page.isVisible("#groceryPendingNote") && /Save what I have/.test(await page.textContent("#groceryPendingNote")) && !/bottom/.test(await page.textContent("#groceryPendingNote")),
    "note above list points to 'Save what I have': " + (await page.textContent("#groceryPendingNote")).trim());
  hb = await btn();
  check(hb.text === "Save what I have" && hb.mode === "save" && !hb.secondary, "unsaved typed amount: the same button becomes primary 'Save what I have'");
  await page.fill(`.gr-have-input[data-key="${A.key}"]`, "");
  check((await btn()).mode === "done", "clearing the draft back to saved: button returns to 'Done adding what I have'");
  await page.fill(`.gr-have-input[data-key="${A.key}"]`, String(haveA));
  check((await btn()).mode === "save", "typing again: Save state");
  await page.fill(`.gr-have-input[data-key="${B.key}"]`, String(haveB));
  await page.press(`.gr-have-input[data-key="${B.key}"]`, "Tab");
  check(!(await rowHidden(B.key)) && money(await rowPrice(B.key)) === B.lineTotal && await totalNow() === total0, "excess draft: " + B.name + " still listed, total unchanged");
  check(!Object.keys(await savedStock()).length, "nothing persisted before Save");
  await shot("doc28-draft-local.png", false);

  console.log("6) Save applies: partial reduces, excess removes, In stock card fills");
  await page.click("#haveSomeBtn");
  await page.waitForSelector("#ppNotice");
  check(/Saved/.test(await page.textContent("#ppNoticeTitle")), "'Saved' notice after Save");
  await closeNotice();
  const qtyA = await rowQty(A.key);
  check(!(await rowHidden(A.key)) && qtyA.includes("buy " + expectA.qtyLabel), "partial: now '" + qtyA.trim() + "' (was " + A.qty + ")");
  check(money(await rowPrice(A.key)) === expectA.lineTotal, "partial: price re-computed with package logic ($" + expectA.lineTotal + ")");
  check(await rowHidden(B.key), "excess: " + B.name + " removed from the list");
  const total2 = await totalNow();
  const total1 = Math.round((total0 - A.lineTotal + expectA.lineTotal) * 100) / 100;
  check(Math.abs(total2 - (total1 - B.lineTotal)) < 0.011, "total updated on Save ($" + total0 + " → $" + total2 + ")");
  const isA = await page.textContent(`#inStockList .in-stock-item[data-key="${A.key}"]`);
  check(isA.includes(A.name) && (isA.includes(haveA + " " + A.unit) || isA.includes(haveA + " " + plural[A.unit])) && !!(await page.$(`#inStockList .in-stock-x[data-key="${A.key}"]`)), "In stock shows name, amount + unit and an X");
  check(JSON.stringify((await stockKeys()).sort()) === JSON.stringify([A.key, B.key].sort()), "In stock lists both items");
  const sv = await savedStock();
  check(sv[A.key] === haveA && sv[B.key] === haveB && Object.keys(sv).length === 2, "localStorage inStock = " + JSON.stringify(sv));
  check(await page.isHidden("#groceryPendingNote") && !(await pending(A.key)).pending, "hint cleared after Save");
  hb = await btn();
  check(hb.text === "I already have some of these items" && hb.secondary && await page.isHidden(".gr-have"), "Save exits edit mode; button back to 'I already have some of these items'");
  await shot("doc28-saved-local.png", false);

  console.log("7) ✕ is a draft too: marks 'Removes on Save' (Undo), list changes only on Save");
  await page.click(`#inStockList .in-stock-x[data-key="${B.key}"]`);
  const liB = `#inStockList .in-stock-item[data-key="${B.key}"]`;
  check(await page.$eval(liB, (n) => n.classList.contains("pending-remove")) && /Removes on Save/.test(await page.textContent(liB)) && !!(await page.$(`${liB} .in-stock-undo`)),
    "✕: item stays in card, struck through, 'Removes on Save' + Undo");
  check(await rowHidden(B.key) && Math.abs(await totalNow() - total2) < 0.011, "✕: list and total unchanged before Save");
  check(await page.isHidden(".gr-have") && (await btn()).text === "Save what I have" && await page.isVisible("#groceryPendingNote"), "✕ outside edit mode: button switches to 'Save what I have' + note");
  await page.click(`${liB} .in-stock-undo`);
  check(!(await page.$eval(liB, (n) => n.classList.contains("pending-remove"))) && await page.isHidden("#groceryPendingNote") && (await btn()).text === "I already have some of these items", "Undo: back to saved state, button restored");
  await page.click(`#inStockList .in-stock-x[data-key="${B.key}"]`);
  await page.click("#haveSomeBtn"); await page.waitForSelector("#ppNotice"); await closeNotice();
  check(!(await rowHidden(B.key)) && money(await rowPrice(B.key)) === B.lineTotal && !(await rowQty(B.key)).includes(" was "), "Save after ✕: " + B.name + " back on list at original amount/price");
  check((await stockKeys()).indexOf(B.key) === -1 && Math.abs(await totalNow() - total1) < 0.011, "Save after ✕: gone from In stock, total restored ($" + total1 + ")");
  check(Object.keys(await savedStock()).join() === A.key, "Save after ✕: localStorage only " + A.key);
  check((await pending(B.key)).value === "", "input for removed item cleared");

  console.log("8) Unsaved-leave prompts keep draft inputs");
  await page.click("#haveSomeBtn"); // reopen edit mode (Save closed it)
  await page.fill(`.gr-have-input[data-key="${B.key}"]`, String(haveB));
  dialogMode = "dismiss"; dialogs.length = 0;
  await nav("home");
  check(dialogs.some((d) => d.type === "confirm" && /unsaved In stock/i.test(d.message)), "leaving the tab asks for confirmation");
  check(await page.evaluate(() => window.PurePrepApp.screen()) === "inventory" && (await pending(B.key)).value === String(haveB) && !(await rowHidden(B.key)),
    "Cancel keeps Inventory, the typed draft, and the unchanged list");
  check(await page.evaluate(() => { const e = new Event("beforeunload", { cancelable: true }); window.dispatchEvent(e); return e.defaultPrevented; }),
    "beforeunload is blocked while drafts are unsaved");
  dialogMode = "accept";

  console.log("9) Save persists across reload");
  await page.click("#haveSomeBtn"); await page.waitForSelector("#ppNotice"); await closeNotice();
  check(await page.evaluate(() => { const e = new Event("beforeunload", { cancelable: true }); window.dispatchEvent(e); return !e.defaultPrevented; }), "no beforeunload prompt after saving");
  await page.reload();
  await nav("inventory");
  check(JSON.stringify((await stockKeys()).sort()) === JSON.stringify([A.key, B.key].sort()), "after reload: In stock lists both items");
  check((await rowQty(A.key)).includes("buy " + expectA.qtyLabel) && await rowHidden(B.key), "after reload: reduced list (A reduced, B removed)");
  check(Math.abs(await totalNow() - total2) < 0.011, "after reload: total $" + total2);
  check(await page.isHidden(".gr-have"), "after reload: edit mode off until toggled");

  console.log("10) Leave + accept discards drafts");
  await page.click("#haveSomeBtn");
  await page.click(`#inStockList .in-stock-x[data-key="${A.key}"]`);
  dialogs.length = 0;
  await nav("home");
  check(dialogs.some((d) => d.type === "confirm"), "confirm shown");
  await nav("inventory");
  check((await stockKeys()).indexOf(A.key) !== -1 && !(await page.$(".in-stock-item.pending-remove")), "pending removal discarded; saved In stock intact");

  console.log("11) Confirm groceries ordered: orders the list on screen (saved amounts)");
  await page.click("#haveSomeBtn");
  await page.fill(`.gr-have-input[data-key="${A.key}"]`, String(haveA + 3)); // unsaved draft
  dialogMode = "dismiss"; dialogs.length = 0;
  await page.click("#confirmGroceries2");
  check(dialogs.some((d) => d.type === "confirm" && /unsaved In stock/i.test(d.message)), "unsaved drafts: asks before confirming");
  check(!(await getState()).groceriesConfirmed && !!(await page.$("#confirmGroceries2")), "Cancel: nothing ordered, still on the suggested list");
  dialogMode = "accept";
  const stBefore = await getState();
  const invBefore = {}; (stBefore.inventory || []).forEach((i) => { invBefore[i.key] = i.qtyRemaining; });
  await page.click("#confirmGroceries2");
  const st2 = await getState();
  const ordered = {}; (st2.groceryList.items || []).forEach((i) => { ordered[i.key] = i.qty; });
  check(ordered[A.key] === expectA.qty, "ordered " + A.key + " = " + ordered[A.key] + " (saved reduction; unsaved draft discarded)");
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
  if (failures) { console.log("verify-grocery-doc28: " + failures + " FAILED"); process.exit(1); }
  console.log("verify-grocery-doc28: OK");
})().catch((e) => { console.error(e); process.exit(1); });
