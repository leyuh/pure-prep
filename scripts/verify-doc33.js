/**
 * doc33: Claire's requests.
 *  1. Milk step in "Let's pick our meals": smoothies (almond / coconut / cow's) between carbs and fats;
 *     oats (cow's milk or None/water; dairy-free: soy milk or water) after fats. No almond milk in oats
 *     anywhere (generated, rerolls, prep, grocery). Restrictions: dairy-free/vegan hide cow's milk,
 *     nut-free hides almond. Coconut milk (USDA) added to foods + pricing.
 *  2. Home: suggested daily supplements on Week at a glance (compact, same plan-aware logic).
 *  3. Bug: Repeat previous meal plan after a meal-structure change keeps the previous meals.
 *  4. Bug: unscheduled weeks show the current profile targets on the pie.
 *  5. Bug: egg bowl capped at 2–3 whole eggs + liquid egg whites; fat within target.
 *  6. Greek yogurt: banana + mango, 1–2 fruits.  7. Nut snack: cashews, pistachios, pumpkin seeds.
 * Optional: SHOTS_DIR=/path saves screenshots. BASE_URL=https://… runs against a live site.
 * Run: node scripts/verify-doc33.js
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
  page.on("dialog", (d) => d.accept());
  const shots = process.env.SHOTS_DIR;
  if (shots) fs.mkdirSync(shots, { recursive: true });
  /** Viewport shot; `sel` is scrolled into view first (block: start, or center). */
  const shot = async (name, sel, block) => {
    if (!shots) return;
    if (sel) await page.$eval(sel, (e, b) => { e.scrollIntoView({ block: b || "start" }); if (!b) window.scrollBy(0, -12); }, block || null);
    else await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(120);
    await page.screenshot({ path: path.join(shots, name) });
  };
  const elShot = async (name, sel) => { if (shots) await (await page.$(sel)).screenshot({ path: path.join(shots, name) }); };
  const nav = (name) => page.click(`.nav-btn[data-screen="${name}"]`);
  const next = () => page.click("#onboard-root .mp-next");
  const nextDisabled = () => page.$eval("#onboard-root .mp-next", (b) => b.disabled);
  const getState = () => page.evaluate(() => JSON.parse(localStorage.getItem("purePrepState")));
  const ingState = () => page.evaluate(() => {
    const box = document.querySelector("#pickIngredientStep .mp-pick-ingredients");
    const ins = [...document.querySelectorAll('#pickIngredientStep input[name="pickIng"]')];
    return {
      step: box && box.dataset.step, min: box && +box.dataset.min, max: box && +box.dataset.max,
      type: ins.length ? ins[0].type : "", values: ins.map((n) => n.value),
      labels: [...document.querySelectorAll("#pickIngredientStep .mp-option")].map((l) => l.textContent.replace(/\s+/g, " ").trim()),
      checked: ins.filter((n) => n.checked).map((n) => n.value), disabled: ins.filter((n) => n.disabled).map((n) => n.value),
      note: (document.querySelector("#pickIngredientStep .mp-pick-note") || {}).textContent || "",
      title: (document.querySelector("#pickIngredientStep .mp-q") || {}).textContent || "",
    };
  });
  const tick = (v) => page.click(`#onboard-root input[name="pickIng"][value="${v}"]`);
  const chooseTemplate = async (t) => { await page.click(`#pickTemplateStep input[name="pickTemplate"][value="${t}"]`); await next(); await page.waitForSelector("#pickIngredientStep"); };
  const pickStep = async (want) => {
    const s = await ingState();
    const vals = (want || []).filter((v) => s.values.includes(v));
    const need = Math.max(s.min, vals.length ? 0 : 1);
    if (!vals.length) s.values.filter((v) => !s.checked.includes(v)).slice(0, Math.max(0, need - s.checked.length)).forEach((v) => vals.push(v));
    for (const v of vals) if (!(await page.isChecked(`#onboard-root input[name="pickIng"][value="${v}"]`))) await tick(v);
    return vals;
  };
  const questionnaire = async (o) => {
    await page.fill("#budget", String(o.budget)); await next();
    await page.click('input[name="cadence"][value="weekly"]'); await next();
    await page.click('input[name="calorieMode"][value="known"]'); await next();
    await page.fill("#calories", String(o.calories)); await next();
    await page.click(`input[name="weightGoal"][value="${o.goal || "maintain"}"]`); await next();
    await page.waitForSelector('input[name="restriction"]');
    for (const r of o.restrictions || []) await page.click(`input[name="restriction"][value="${r}"]`);
    await next();
    await page.click(`input[name="meals"][value="${o.meals || "3m2s"}"]`); await next();
    await next();
    await page.waitForSelector("#buildChoice");
  };
  const saveProfile = async () => {
    await page.click("#saveProfile");
    await page.waitForSelector("#ppNotice");
    await page.click("#ppNoticeOk");
  };
  const pieCals = () => page.$eval("#screen-home .macro-pie-hole strong", (n) => n.textContent.trim());
  const cardText = (i) => page.$eval(`.mp-slots > .mp-card[data-slot-index="${i}"]`, (n) => n.textContent.replace(/\s+/g, " "));

  await page.goto(base);
  await page.evaluate(() => localStorage.clear());
  await page.reload();

  console.log("0) Cache-bust");
  check(await page.$eval('script[src^="onboarding.js"]', (s) => s.getAttribute("src")) === "onboarding.js?v=doc33", "onboarding.js?v=doc33");
  check(await page.$eval('link[rel="icon"][type="image/svg+xml"]', (l) => l.getAttribute("href")) === "assets/favicon.svg?v=leaf8", "favicon stays ?v=leaf8");
  const pagesCss = await page.evaluate(async () => Promise.all(["about.html", "privacy.html", "disclosure.html"].map(async (f) => (await (await fetch(f, { cache: "no-store" })).text()).includes('pages.css?v=doc33'))));
  check(pagesCss.every(Boolean), "about/privacy/disclosure use pages.css?v=doc33");

  console.log("1) New foods (USDA) + pricing");
  const foods = await page.evaluate(() => {
    const M = window.MealPlanOnboarding;
    const F = M.FOOD, P = M.PRICE_CATALOG;
    return {
      coco: F.coconut_milk_oz, cocoPrice: P.coconut_milk_oz, white: F.egg_white, whitePrice: P.egg_white,
      nuts: ["cashews_oz", "pistachios_oz", "pumpkin_seeds_oz"].map((k) => [k, F[k] && F[k].kcal, !!P[k]]),
      fruit: ["banana", "mango_cup"].map((k) => [k, F[k] && F[k].kcal, !!P[k]]),
      tags: [M.FOOD_TAGS.coconut_milk_oz || [], M.FOOD_TAGS.egg_white || []],
    };
  });
  // USDA FDC: unsweetened coconutmilk beverage 40 kcal / 0 g P / 1 g C / 4 g F per 240 mL; large egg white 17 kcal / 3.6 g P.
  check(foods.coco && Math.abs(foods.coco.kcal * 8 - 40) <= 2 && foods.coco.p === 0 && Math.abs(foods.coco.f * 8 - 4) <= 0.2 && Math.abs(foods.coco.c * 8 - 1) <= 0.2,
    "coconut milk: " + foods.coco.kcal + " kcal/" + foods.coco.p + "p/" + foods.coco.c + "c/" + foods.coco.f + "f per oz (USDA ≈ 40 kcal, 4 g fat per cup)");
  check(foods.cocoPrice && /coconut milk/i.test(foods.cocoPrice.product) && foods.cocoPrice.packagePrice > 0, "coconut milk priced (" + foods.cocoPrice.product + " $" + foods.cocoPrice.packagePrice + ")");
  check(foods.white.kcal === 17 && foods.white.p === 3.6 && /liquid egg whites/i.test(foods.white.name) && /Liquid egg whites/.test(foods.whitePrice.product), "liquid egg whites: 17 kcal / 3.6 g protein per white; priced as a carton");
  check(foods.nuts.every((n) => n[1] > 150 && n[2]) && foods.fruit.every((n) => n[1] > 90 && n[2]), "cashews, pistachios, pumpkin seeds, banana, mango in the food list + priced");
  check(!foods.tags[0].length && foods.tags[1].join() === "egg", "coconut milk has no allergen tag (FDA no longer lists coconut as a tree nut); egg whites tagged egg");

  console.log("2) Pick steps: milk, yogurt fruits, nuts (+ restrictions)");
  const ps = await page.evaluate(() => {
    const M = window.MealPlanOnboarding;
    const o = (r) => ({ budget: 600, restrictions: r });
    const ids = (t, r) => M.pickStepsFor(t, {}, o(r)).map((s) => s.id).join(">");
    const milk = (t, r) => { const st = M.pickStepsFor(t, {}, o(r)).find((s) => s.id === "milk"); return st ? st.options.map((x) => x.value).join(",") + "|" + st.min + "-" + st.max : ""; };
    const step = (t, id, r, b) => M.pickStepsFor(t, {}, { budget: b || 600, restrictions: r }).find((s) => s.id === id);
    const greek = step("greek", "fruit", []);
    const greekLow = step("greek", "fruit", [], 150);
    return {
      smoothieOrder: ids("smoothie", []), oatOrder: ids("oatmeal", []),
      sm: milk("smoothie", []), smDairy: milk("smoothie", ["dairy_free"]), smVegan: milk("smoothie", ["vegan"]), smNut: milk("smoothie", ["nut_free"]), smDN: milk("smoothie", ["dairy_free", "nut_free"]),
      oat: milk("oatmeal", []), oatDairy: milk("oatmeal", ["dairy_free"]), oatVegan: milk("oatmeal", ["vegan"]), oatNut: milk("oatmeal", ["nut_free"]),
      smLabels: step("smoothie", "milk", []).options.map((x) => x.label).join(","), oatLabels: step("oatmeal", "milk", []).options.map((x) => x.label).join(","),
      greek: greek.options.map((x) => x.value).join(",") + "|" + greek.min + "-" + greek.max, greekLow: greekLow.options.map((x) => x.value).join(","),
      cottage: (() => { const c = step("cottage", "fruit", []); return c.min + "-" + c.max; })(),
      nuts: step("nut", "nut", []).options.map((x) => x.value).join(","), nutsLow: step("nut", "nut", [], 150).options.map((x) => x.value).join(","),
      nutFree: step("nut", "nut", ["nut_free"]).options.map((x) => x.value).join(","),
      eggFreeProteins: step("bowl", "protein", ["egg_free"]).options.map((x) => x.value).join(","),
      eggFreeSnacks: M.pickTemplatesFor("snack", o(["egg_free"])).map((t) => t.id).join(","),
    };
  });
  check(ps.smoothieOrder === "carbs>milk>fats", "smoothie steps follow the template: carbs → milk → fats");
  check(ps.oatOrder === "carbs>fats>milk", "oatmeal steps follow the template: carbs → fats → milk");
  check(ps.sm === "almond_milk_oz,coconut_milk_oz,milk_skim_oz|1-1" && ps.smLabels === "Almond milk,Coconut milk,Cow's milk", "smoothie milk: pick 1 of almond / coconut / cow's");
  check(ps.oat === "milk_skim_oz,water|1-1" && ps.oatLabels === "Cow's milk,None (water)", "oat milk: cow's milk or None (water) — no almond");
  check(ps.smDairy.startsWith("almond_milk_oz,coconut_milk_oz|") && ps.smVegan.startsWith("almond_milk_oz,coconut_milk_oz|"), "dairy-free / vegan smoothies hide cow's milk");
  check(ps.smNut.startsWith("coconut_milk_oz,milk_skim_oz|") && ps.smDN.startsWith("coconut_milk_oz|"), "nut-free hides almond milk (dairy+nut-free → coconut only)");
  check(ps.oatDairy.startsWith("soy_milk_oz,water|") && ps.oatVegan.startsWith("soy_milk_oz,water|") && ps.oatNut.startsWith("milk_skim_oz,water|"), "dairy-free/vegan oats: soy milk (already in the food list) or water; nut-free oats unchanged");
  check(ps.greek === "pineapple,peach,mango,berries,banana|1-2", "Greek yogurt: banana + mango added, pick 1–2 (" + ps.greek + ")");
  check(/banana/.test(ps.greekLow), "tight budget still offers banana for yogurt (" + ps.greekLow + ")");
  check(ps.cottage === "1-1", "cottage cheese keeps 1 fruit");
  check(ps.nuts === "almonds_oz,peanuts_oz,cashews_oz,pistachios_oz,pumpkin_seeds_oz" && ps.nutsLow === ps.nuts, "nut snack: almonds, peanuts, cashews, pistachios, pumpkin seeds (any budget)");
  check(ps.nutFree === "pumpkin_seeds_oz", "nut-free keeps only seeds");
  check(!/eggs|egg_whites/.test(ps.eggFreeProteins) && !/hb_egg/.test(ps.eggFreeSnacks), "egg-free hides whole eggs, egg whites and the egg snack");

  console.log("3) Generated plans + rerolls: milk, eggs, yogurt, nuts, restrictions");
  const gen = await page.evaluate(() => {
    const M = window.MealPlanOnboarding;
    const sets = [[], ["dairy_free"], ["nut_free"], ["vegan"], ["egg_free"], ["dairy_free", "nut_free"]];
    const out = { n: 0, almondOats: 0, oatMilks: {}, smMilks: {}, maxEggs: 0, eggBowls: 0, eggFatOver: [], whitesInEggBowls: 0, greek: 0, greek2: 0, fruitsInGreek: {}, nuts: {}, bad: [], dairyCow: 0, nutAlmond: 0, eggKeys: 0 };
    for (const r of sets) {
      const flags = M.restrictionFlags(r);
      for (const b of [150, 450, 900]) for (const mo of Object.keys(M.MEAL_OPTIONS)) for (const cal of [1600, 2400, 3400]) for (const v of [0, 1, 3, 4]) {
        const a = { budget: b, cadence: "weekly", calorieMode: "known", calories: cal, weightGoal: "maintain", mealOption: mo, meals: M.MEAL_OPTIONS[mo].meals, snacks: M.MEAL_OPTIONS[mo].snacks, daysPerWeek: 6, selectedDays: ["mon", "tue", "wed", "thu", "fri", "sat"], restrictions: r };
        const p0 = M.buildPlan(a, { variant: v });
        const plans = [p0, M.rerollSlot(p0, Object.assign({}, a), 0, v + 1), M.rerollDay(Object.assign({}, a), p0, v + 2)];
        for (const p of plans) {
          out.n++;
          for (const sl of p.schedule) {
            const s = sl.suggestion;
            const ks = s.ingredients.filter((i) => i && i._key);
            const keys = ks.map((i) => i._key);
            keys.forEach((k) => { if (!M.foodAllowed(k, flags)) out.bad.push(r.join("+") + ":" + k); });
            if (flags.dairy && keys.some((k) => /milk_(skim|2pct)/.test(k))) out.dairyCow++;
            if (flags.nut && keys.includes("almond_milk_oz")) out.nutAlmond++;
            if (flags.egg && keys.some((k) => /egg/.test(k))) out.eggKeys++;
            const eggs = ks.filter((i) => i._key === "egg" || i._key === "hard_boiled_egg").reduce((x, i) => x + i._qty, 0);
            out.maxEggs = Math.max(out.maxEggs, eggs);
            if (s.type === "oatmeal") keys.filter((k) => /milk/.test(k)).forEach((k) => { out.oatMilks[k] = (out.oatMilks[k] || 0) + 1; if (k === "almond_milk_oz") out.almondOats++; });
            if (s.type === "smoothie") keys.filter((k) => /milk/.test(k)).forEach((k) => { out.smMilks[k] = (out.smMilks[k] || 0) + 1; });
            if (s.type === "bowl" && s.protein === "eggs") {
              out.eggBowls++;
              if (keys.includes("egg_white")) out.whitesInEggBowls++;
              if (s.totals.f > sl.targetMacros.f + 5) out.eggFatOver.push(s.totals.f + ">" + sl.targetMacros.f);
            }
            if (s.type === "greek_yogurt") {
              out.greek++;
              const fr = keys.filter((k) => k === "banana" || /(pineapple|peach|mango|berries)_cup/.test(k));
              fr.forEach((k) => { out.fruitsInGreek[k] = 1; });
              if (fr.length === 2) out.greek2++;
            }
            if (s.type === "nut") keys.forEach((k) => { out.nuts[k] = 1; });
          }
        }
      }
    }
    out.badCount = out.bad.length;
    out.bad = out.bad.length + (out.bad.length ? " e.g. " + out.bad.slice(0, 3).join(",") : "");
    return out;
  });
  check(gen.almondOats === 0 && Object.keys(gen.oatMilks).sort().join(",") === "milk_skim_oz,soy_milk_oz", "no almond milk in any generated/rerolled oatmeal (" + JSON.stringify(gen.oatMilks) + ")");
  check(gen.smMilks.coconut_milk_oz > 0 && gen.smMilks.almond_milk_oz > 0 && (gen.smMilks.milk_skim_oz || 0) + (gen.smMilks.milk_2pct_oz || 0) > 0, "generated smoothies use all three milks (" + JSON.stringify(gen.smMilks) + ")");
  check(gen.dairyCow === 0 && gen.nutAlmond === 0 && gen.eggKeys === 0 && gen.badCount === 0, "restrictions: no cow's milk (dairy-free/vegan), no almond milk (nut-free), no eggs/egg whites (egg-free), no leaks (" + gen.bad + ")");
  check(gen.maxEggs <= 3, "whole eggs never above 3 per meal across " + gen.n + " plans (max " + gen.maxEggs + ")");
  check(gen.eggBowls > 20 && gen.whitesInEggBowls > gen.eggBowls * 0.8 && gen.eggFatOver.length === 0, "egg bowls (" + gen.eggBowls + "): liquid egg whites carry the protein, fat within the meal target (+5 g)" + (gen.eggFatOver.length ? " over: " + gen.eggFatOver.slice(0, 3) : ""));
  check(gen.greek2 > 0 && gen.fruitsInGreek.banana && gen.fruitsInGreek.mango_cup, "generated Greek yogurt uses 1–2 fruits incl. banana/mango (" + gen.greek2 + "/" + gen.greek + " with two)");
  check(gen.nuts.cashews_oz && gen.nuts.pistachios_oz && gen.nuts.pumpkin_seeds_oz, "generated nut snacks include cashews, pistachios, pumpkin seeds");

  console.log("4) Bug: egg bowl had 8 whole eggs / 39 g fat");
  const egg = await page.evaluate(() => {
    const M = window.MealPlanOnboarding;
    const res = [];
    // The old repro: tight budget, 2 meals + 1 snack at 2400 kcal → an 1000 kcal egg bowl.
    const a = { budget: 150, cadence: "weekly", calorieMode: "known", calories: 2400, weightGoal: "maintain", mealOption: "2m1s", meals: 2, snacks: 1, daysPerWeek: 7, selectedDays: ["mon", "tue", "wed", "thu", "fri", "sat", "sun"], restrictions: [] };
    let found = null;
    for (let v = 0; v < 40 && !found; v++) { const p = M.buildPlan(a, { variant: v }); const sl = p.schedule.find((x) => x.suggestion.protein === "eggs"); if (sl) found = { p, sl }; }
    const s = found.sl.suggestion;
    const byKey = (k) => (s.ingredients.find((i) => i._key === k) || {})._qty || 0;
    res.push({ eggs: byKey("egg"), whites: byKey("egg_white"), f: s.totals.f, tf: found.sl.targetMacros.f, p: s.totals.p, tp: found.sl.targetMacros.p, labels: s.ingredients.map((i) => i.label) });
    // Picked egg bowl at a large meal target + day tuning (calorie top-up).
    const picks = [{ template: "bowl", sel: { protein: ["eggs"], carb: ["rice_cup"], veg: ["broccoli_cup"], fat: ["avocado"] } }, { template: "bowl", sel: { protein: ["chicken"], carb: ["rice_cup"], veg: ["broccoli_cup"], fat: ["evoo"] } }];
    const pp = M.buildPickedPlan(Object.assign({}, a, { calories: 3600, mealOption: "2m", meals: 2, snacks: 0 }), picks, 0);
    const ps = pp.schedule[0].suggestion;
    const pk = (k) => (ps.ingredients.find((i) => i._key === k) || {})._qty || 0;
    res.push({ eggs: pk("egg"), whites: pk("egg_white"), f: ps.totals.f, tf: pp.schedule[0].targetMacros.f, p: ps.totals.p, tp: pp.schedule[0].targetMacros.p });
    // Reroll of the egg bowl slot keeps the cap.
    let maxR = 0;
    for (let v = 0; v < 10; v++) { const r = M.rerollSlot(found.p, Object.assign({}, a), found.p.schedule.indexOf(found.sl), v); r.schedule.forEach((sl) => sl.suggestion.ingredients.forEach((i) => { if (i._key === "egg" || i._key === "hard_boiled_egg") maxR = Math.max(maxR, i._qty); })); }
    // Guard: anything that asks for >3 whole eggs gets egg whites instead.
    const d = M.dedupeIngredients([{ _key: "egg", _qty: 5, label: "5 large eggs" }].map((i) => Object.assign(i, { kcal: 0, p: 0, c: 0, f: 0 })));
    const groc = found.p.grocery.items.find((i) => i.key === "egg_white");
    const prep = M.prepHtml(found.sl, { days: 7 }).replace(/<[^>]+>/g, " ").replace(/\s+/g, " ");
    return { res, maxR, guard: d.map((i) => i._key + ":" + i._qty).join(","), groc: groc && (groc.name + " — " + groc.qtyLabel), prep: (prep.match(/Egg bake:[^.]*\./) || [""])[0] };
  });
  const e0 = egg.res[0], e1 = egg.res[1];
  check(e0.eggs >= 2 && e0.eggs <= 3 && e0.whites > 0, "generated egg bowl: " + e0.eggs + " whole eggs + " + e0.whites + " egg whites (" + e0.labels.slice(0, 2).join(", ") + ")");
  check(e0.f <= e0.tf + 3 && e0.p >= e0.tp - 10, "fat " + e0.f + " g within target " + e0.tf + " g; protein " + e0.p + " g vs " + e0.tp + " g");
  check(e1.eggs >= 2 && e1.eggs <= 3 && e1.whites > 0 && e1.f <= e1.tf + 5, "picked egg bowl at 1800 kcal after day tuning: " + e1.eggs + " eggs + " + e1.whites + " whites, fat " + e1.f + "/" + e1.tf + " g");
  check(egg.maxR <= 3, "rerolls keep ≤ 3 whole eggs (max " + egg.maxR + ")");
  check(egg.guard === "egg:3,egg_white:4", "guard: 5 whole eggs → 3 eggs + 4 whites (" + egg.guard + ")");
  check(/Liquid egg whites/.test(egg.groc || "") && /whites/.test(egg.groc), "grocery list shows egg whites (" + egg.groc + ")");
  check(/whisk \d+ eggs and .*liquid egg whites/.test(egg.prep), "prep: " + egg.prep);

  console.log("5) Water oats, milk choices in picked plans");
  const pk = await page.evaluate(() => {
    const M = window.MealPlanOnboarding;
    const a = { budget: 600, cadence: "weekly", calorieMode: "known", calories: 2400, weightGoal: "maintain", mealOption: "2m", meals: 2, snacks: 0, daysPerWeek: 7, selectedDays: ["mon", "tue", "wed", "thu", "fri", "sat", "sun"], restrictions: [] };
    const mk = (milkOat, milkSm, r) => M.buildPickedPlan(Object.assign({}, a, { restrictions: r || [] }), [
      { template: "oatmeal", sel: { carbs: ["oats_cup", "banana"], fats: ["chia_tsp"], milk: [milkOat] } },
      { template: "smoothie", sel: { carbs: ["banana", "berries_cup"], milk: [milkSm], fats: ["chia_tsp"] } }], 0);
    const keys = (p, i) => p.schedule[i].suggestion.ingredients.map((x) => x._key);
    const w = mk("water", "coconut_milk_oz");
    const c = mk("milk_skim_oz", "almond_milk_oz");
    const d = mk("soy_milk_oz", "coconut_milk_oz", ["dairy_free"]);
    return {
      waterOat: keys(w, 0).filter((k) => /milk/.test(k)).join(","), waterNote: w.schedule[0].suggestion.notes.join(" "),
      coco: keys(w, 1).includes("coconut_milk_oz"), cowOat: keys(c, 0).includes("milk_skim_oz"), almondSm: keys(c, 1).includes("almond_milk_oz"),
      soyOat: keys(d, 0).includes("soy_milk_oz"), dairySm: keys(d, 1).includes("coconut_milk_oz"),
    };
  });
  check(pk.waterOat === "" && /water/.test(pk.waterNote), "oats with None (water): no milk, note '" + pk.waterNote + "'");
  check(pk.cowOat && pk.coco && pk.almondSm, "picked oat cow's milk / smoothie coconut or almond milk are kept");
  check(pk.soyOat && pk.dairySm, "dairy-free picks: soy milk oats, coconut milk smoothie");

  console.log("6) Pick wizard in the UI (screenshots)");
  await nav("profile");
  await questionnaire({ budget: 600, calories: 2400, meals: "3m2s" });
  await page.click('input[name="buildMode"][value="pick"]'); await next();
  await page.waitForSelector("#pickTemplateStep");
  await chooseTemplate("bowl");
  await pickStep(["eggs"]); await next(); await pickStep(["rice_cup"]); await next(); await pickStep(["broccoli_cup"]); await next();
  let s = await ingState();
  check(!s.values.includes("hbe"), "egg bowl: hard-boiled egg not offered as a fat");
  await pickStep(["evoo"]); await next();
  await page.waitForSelector("#pickTemplateStep");
  check(/Nuts & seeds/.test(await page.textContent("#pickTemplateStep")), "snack template reads 'Nuts & seeds'");
  await chooseTemplate("nut");
  s = await ingState();
  check(s.values.join(",") === "almonds_oz,peanuts_oz,cashews_oz,pistachios_oz,pumpkin_seeds_oz" && s.type === "radio", "nut step: " + s.labels.join(" / "));
  await tick("cashews_oz");
  await shot("doc33-nut-options.png", "#pickIngredientStep");
  await next();
  await chooseTemplate("smoothie");
  await pickStep(["banana", "berries_cup"]); await next();
  s = await ingState();
  check(s.step === "milk" && s.type === "radio" && s.labels.join("|").replace(/\s/g, "") === "Almondmilk|Coconutmilk|Cow'smilk", "smoothie milk step: " + s.labels.join(" / "));
  await tick("coconut_milk_oz");
  await shot("doc33-smoothie-milk-step.png", "#pickIngredientStep");
  await next();
  s = await ingState(); check(s.step === "fats", "then fats");
  await tick("chia_tsp"); await next();
  await chooseTemplate("greek");
  s = await ingState();
  check(s.step === "fruit" && s.type === "checkbox" && s.min === 1 && s.max === 2 && s.values.includes("banana") && s.values.includes("mango"), "yogurt fruit step: pick 1–2 (" + s.labels.join(" / ") + ")");
  await tick("banana"); await tick("mango");
  s = await ingState();
  check(s.disabled.length === s.values.length - 2, "2 fruits picked → the rest disabled");
  await shot("doc33-yogurt-fruit-step.png", "#pickIngredientStep");
  await next(); await next();
  await chooseTemplate("oatmeal");
  await pickStep(["banana"]); await next();
  s = await ingState(); check(s.step === "fats", "oatmeal: fats before milk");
  await tick("walnuts_tsp"); await next();
  s = await ingState();
  check(s.step === "milk" && s.values.join(",") === "milk_skim_oz,water" && s.labels.join("|").replace(/\s/g, "") === "Cow'smilk|None(water)", "oat milk step: " + s.labels.join(" / "));
  await tick("milk_skim_oz");
  await shot("doc33-oat-milk-step.png", "#pickIngredientStep");
  await next();
  await page.waitForSelector("#saveClose");
  const t0 = await cardText(0), t1 = await cardText(1), t2 = await cardText(2), t3 = await cardText(3), t4 = await cardText(4);
  const eggM = t0.match(/(\d+) large eggs/);
  check(/Egg bowl/.test(t0) && eggM && +eggM[1] <= 3 && /liquid egg whites/.test(t0), "egg bowl card: " + (eggM ? eggM[0] : "?") + " + liquid egg whites");
  const stP = await page.evaluate(() => window.__ppLastPlan || null);
  check(/Cashews/.test(t1), "snack 1: cashews");
  check(/coconut milk/.test(t2) && !/almond milk/.test(t2), "smoothie card uses the picked coconut milk");
  check(/Greek yogurt, (banana & mango|mango & banana)/.test(t3) && /medium banana/.test(t3) && /cup mango/.test(t3), "yogurt card: banana + mango (" + (t3.match(/Greek yogurt, [a-z &]+/) || [""])[0] + ")");
  check(/skim milk/.test(t4) && !/almond milk/.test(t4), "oatmeal card: cow's milk, no almond milk");
  await elShot("doc33-egg-bowl-card.png", '.mp-slots > .mp-card[data-slot-index="0"]');
  await page.click("#saveClose");
  await page.waitForSelector("#screen-home .macro-pie");
  let st = await getState();
  const eggSl = st.plan.schedule[0];
  const eggF = eggSl.suggestion.totals.f;
  check(eggF <= eggSl.targetMacros.f + 5, "saved egg bowl fat " + eggF + " g vs target " + eggSl.targetMacros.f + " g");
  const groc = JSON.stringify(st.groceryList || []);
  check(/Liquid egg whites/.test(groc) && /coconut milk/i.test(groc) && /Cashews/.test(groc) && /Mango/.test(groc) && !/almond milk/i.test(groc), "grocery list: egg whites, coconut milk, cashews, mango; no almond milk");

  console.log("7) Home: suggested supplements on Week at a glance");
  const home = await page.evaluate(() => {
    const st = JSON.parse(localStorage.getItem("purePrepState"));
    const M = window.MealPlanOnboarding;
    const want = M.supplementsForPlan(st.plan, st.answers).items.map((i) => i.id).join(",");
    const box = document.querySelector("#screen-home .home-supps");
    const panel = box && box.closest("section.panel");
    return {
      want, has: !!box, inGlance: !!panel && /Week at a glance/.test(panel.querySelector("h2").textContent),
      got: box ? [...box.querySelectorAll("li.home-supp")].map((l) => l.dataset.supp).join(",") : "",
      title: box ? box.querySelector(".home-supps-title").textContent : "",
      rows: box ? [...box.querySelectorAll("li.home-supp")].map((l) => l.textContent.replace(/\s+/g, " ").trim()) : [],
      height: box ? box.getBoundingClientRect().height : 0,
      note: box ? box.querySelector(".home-supps-note").textContent : "",
      prep: document.querySelector("#screen-home").textContent.replace(/\s+/g, " "),
    };
  });
  check(home.has && home.inGlance && /Suggested daily supplements/.test(home.title), "Week at a glance shows 'Suggested daily supplements'");
  check(home.got === home.want && home.got.length > 0, "same plan-aware list as the results page (" + home.got + ")");
  check(home.rows.every((r) => /\d/.test(r)) && home.height < 240, "compact: one row each with a dose (" + Math.round(home.height) + "px): " + home.rows.join(" | "));
  check(/Not medical advice/.test(home.note), "short not-medical-advice note");
  check(/liquid egg whites/.test(home.prep), "Home prep steps mention the liquid egg whites");
  await shot("doc33-home-supplements.png", "#screen-home .home-supps", "center");

  console.log("8) Bug: Repeat previous meal plan after changing the meal structure");
  const prior = st.plan.schedule.map((x) => ({ name: x.name, title: x.suggestion.title, type: x.suggestion.type }));
  await nav("profile");
  await page.click('input[name="pf-meals"][value="3m"]');
  await saveProfile();
  await nav("home");
  await page.click("#nextWeek");
  await page.waitForSelector("#repeatMealPlan");
  await page.click("#repeatMealPlan");
  await page.waitForSelector("#screen-home .meal-row");
  st = await getState();
  let blk = st.planBlocks[st.planBlocks.length - 1].plan;
  const rep = blk.schedule.map((x) => ({ name: x.name, title: x.suggestion.title, type: x.suggestion.type, kcal: x.suggestion.totals.kcal, cal: x.calories }));
  const priorMeals = prior.filter((x) => /^Meal/.test(x.name));
  check(rep.length === 3 && rep.every((x) => /^Meal/.test(x.name)), "3 meals + 2 snacks → 3 meals: snacks dropped (" + rep.map((x) => x.name).join(", ") + ")");
  check(rep.map((x) => x.title).join("|") === priorMeals.map((x) => x.title).join("|") && rep.map((x) => x.type).join() === priorMeals.map((x) => x.type).join(),
    "kept the previous meals: " + rep.map((x) => x.title).join(" | "));
  check(rep.every((x) => x.cal === 800), "slots re-targeted to 800 kcal each");
  check(Math.abs(blk.actual.kcal - 2400) <= 150 && rep.every((x) => x.kcal > 600), "scaled up to the current targets (day " + blk.actual.kcal + " / 2400; " + rep.map((x) => x.kcal).join(", ") + ")");
  const repEgg = blk.schedule[0].suggestion.ingredients.find((i) => i._key === "egg");
  check(repEgg && repEgg._qty <= 3, "scaled egg bowl still ≤ 3 whole eggs");

  console.log("9) Bug: Week-at-a-glance pie after changing the calorie goal");
  await nav("profile");
  await page.fill("#pf-calories", "2000");
  await saveProfile();
  await nav("home");
  // Walk from the earliest week: scheduled weeks keep 2400, the first empty week shows 2000.
  for (let g = 0; g < 8 && !(await page.$eval("#prevWeek", (b) => b.disabled)); g++) await page.click("#prevWeek");
  const weeks = [];
  for (let g = 0; g < 6; g++) {
    const empty = !!(await page.$("#repeatMealPlan"));
    weeks.push({ label: await page.textContent("#screen-home .week-toggle strong"), cal: await pieCals(), empty });
    if (empty) break;
    await page.click("#nextWeek");
  }
  const sched = weeks.filter((w) => !w.empty);
  check(sched.length >= 2 && sched.every((w) => w.cal === "2400"), "weeks that already have plans keep their plan's 2400 (" + sched.map((w) => w.label + ": " + w.cal).join("; ") + ")");
  check(weeks[weeks.length - 1].empty, "reached the next week with no plan (" + weeks[weeks.length - 1].label + ")");
  const pie = await page.evaluate(() => ({ cal: document.querySelector("#screen-home .macro-pie-hole strong").textContent.trim(), legend: document.querySelector("#screen-home .macro-legend").textContent.replace(/\s+/g, " ") }));
  const tg = await page.evaluate(() => window.MealPlanOnboarding.dailyTargetsFor({ calorieMode: "known", calories: 2000, weightGoal: "maintain" }));
  check(pie.cal === "2000", "unscheduled week shows the current profile's 2000 cals");
  check(pie.legend.includes(tg.protein_g + "g") && pie.legend.includes(tg.carbs_g + "g") && pie.legend.includes(tg.fat_g + "g"), "legend grams follow 2000 (" + pie.legend.trim() + ")");
  await shot("doc33-week-glance-2000.png", "#screen-home section.panel");

  console.log("10) Repeat with more slots than before");
  await nav("profile");
  await page.click('input[name="pf-meals"][value="3m2s"]');
  await saveProfile();
  await nav("home");
  await page.waitForSelector("#repeatMealPlan");
  await page.click("#repeatMealPlan");
  await page.waitForSelector("#screen-home .meal-row");
  check(await pieCals() === "2000", "newly repeated week uses 2000");
  st = await getState();
  blk = st.planBlocks[st.planBlocks.length - 1].plan;
  const rep2 = blk.schedule.map((x) => ({ name: x.name, title: x.suggestion.title, kind: x.kind }));
  check(rep2.length === 5 && rep2.filter((x) => x.kind === "snack").length === 2, "3 meals → 3 meals + 2 snacks: 5 slots");
  check(rep2.filter((x) => x.kind === "meal").map((x) => x.title).join("|") === rep.map((x) => x.title).join("|"), "existing meals kept (" + rep2.filter((x) => x.kind === "meal").map((x) => x.title).join(" | ") + ")");
  check(rep2.filter((x) => x.kind === "snack").every((x) => x.title), "new snack slots filled (" + rep2.filter((x) => x.kind === "snack").map((x) => x.title).join(", ") + ")");
  check(Math.abs(blk.actual.kcal - 2000) <= 150, "day fits 2000 (" + blk.actual.kcal + ")");

  console.log("11) Repeat helper edge cases");
  const edge = await page.evaluate(() => {
    const M = window.MealPlanOnboarding;
    const a = { budget: 600, cadence: "weekly", calorieMode: "known", calories: 2400, weightGoal: "maintain", mealOption: "3m2s", meals: 3, snacks: 2, daysPerWeek: 7, selectedDays: ["mon", "tue", "wed", "thu", "fri", "sat", "sun"], restrictions: [] };
    const p = M.buildPlan(a, { variant: 2 });
    const v = M.repeatPlanForProfile(p, Object.assign({}, a, { restrictions: ["vegan"] }), 2);
    const f = M.restrictionFlags(["vegan"]);
    const bad = v.schedule.flatMap((sl) => sl.suggestion.ingredients.map((i) => i._key)).filter((k) => !M.foodAllowed(k, f));
    // Old saved oatmeal with almond milk → repeat swaps it for cow's milk.
    const old = JSON.parse(JSON.stringify(p));
    const oat = old.schedule.find((sl) => sl.suggestion.type === "oatmeal");
    if (oat) oat.suggestion.ingredients = oat.suggestion.ingredients.map((i) => /milk/.test(i._key) ? Object.assign({}, i, { _key: "almond_milk_oz" }) : i);
    const r = M.repeatPlanForProfile(old, Object.assign({}, a, { calories: 2000 }), 2);
    const oatR = r.schedule.find((sl) => sl.suggestion.type === "oatmeal");
    return { bad: bad.length, kept: v.repeatKept.length, oatOk: !oat || !oatR.suggestion.ingredients.some((i) => i._key === "almond_milk_oz") };
  });
  check(edge.bad === 0 && edge.kept > 0, "new restriction: kept allowed meals (" + edge.kept + "), replaced ruled-out ones, no leaks");
  check(edge.oatOk, "repeating an older plan drops almond milk from oats");

  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1);
  check(!overflow, "no horizontal overflow at 390px");
  check(errors.length === 0, "no page errors" + (errors.length ? ": " + errors.join(" | ") : ""));
  await browser.close();
  srv.close();
  console.log(failures ? "\n" + failures + " FAILED" : "\nALL PASSED");
  process.exit(failures ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(1); });
