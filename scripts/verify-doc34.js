/**
 * doc34: Claire's requests + the fresh Meal Templates doc (export 2026-09-29).
 *  1. Doc changes: Sweet/Savory groups with 6 meal templates (new Greek yogurt bowl + Lunch box),
 *     flax seeds as a fat, cottage cheese as a bowl fat, "Oatmeal prep" vs "Overnight oats prep".
 *  2. Cacao in every chocolate cherry smoothie/oats/yogurt bowl (generated, rerolled, picked),
 *     USDA macros, grocery pricing, prep.
 *  3. Pick wizard: Sweet/Savory template groups. Meal 1 and the last meal on 4/5-meal plans list
 *     Sweet first; every other meal lists Savory first. Snacks stay one ungrouped list.
 *  4. Flavor step after fats: optional multi-select 0–3 (sweet or savory options), on the card,
 *     in prep and on the grocery list (cacao priced; spices are pantry items).
 *  5. Oat prep shows both warm oatmeal and overnight oats.
 * Optional: SHOTS_DIR=/path saves screenshots. BASE_URL=https://… runs against a live site.
 * Run: node scripts/verify-doc34.js
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

  const tplState = () => page.evaluate(() => ({
    groups: [...document.querySelectorAll("#pickTemplateStep .mp-pick-group")].map((g) => g.dataset.group),
    values: [...document.querySelectorAll('#pickTemplateStep input[name="pickTemplate"]')].map((n) => n.value),
    title: (document.querySelector("#pickTemplateStep .mp-q") || {}).textContent || "",
  }));
  const SWEET = "smoothie,yogurt_bowl,oatmeal", SAVORY = "lunch_box,salad_jar,bowl";

  await page.goto(base);
  await page.evaluate(() => localStorage.clear());
  await page.reload();

  console.log("0) Cache-bust");
  check(await page.$eval('script[src^="onboarding.js"]', (s) => s.getAttribute("src")) === "onboarding.js?v=doc34", "onboarding.js?v=doc34");
  check(await page.$eval('link[rel="icon"][type="image/svg+xml"]', (l) => l.getAttribute("href")) === "assets/favicon.svg?v=leaf8", "favicon stays ?v=leaf8");
  const pagesCss = await page.evaluate(async () => Promise.all(["about.html", "privacy.html", "disclosure.html"].map(async (f) => (await (await fetch(f, { cache: "no-store" })).text()).includes("pages.css?v=doc34"))));
  check(pagesCss.every(Boolean), "about/privacy/disclosure use pages.css?v=doc34");

  console.log("1) Doc copy + new foods (USDA, pricing, tags)");
  const docTxt = await page.evaluate(async () => (await (await fetch("docs/meal-templates.txt", { cache: "no-store" })).text()));
  check(/Sweet:\s*\nOption 1 - Smoothie/.test(docTxt) && /Option 2 - Greek yogurt bowl/.test(docTxt) && /Savory:\s*\nOption 3 - Lunch box/.test(docTxt) && /Option 5 - Bowl/.test(docTxt),
    "docs/meal-templates.txt is the new export (Sweet/Savory, Greek yogurt bowl, Lunch box, Bowl last)");
  check(/Overnight oats prep/.test(docTxt) && /hard boiled egg, cottage cheese/.test(docTxt) && /chia seeds\/hemp hearts\/flax seeds/.test(docTxt), "doc: overnight oats heading, cottage cheese bowl fat, flax seeds");
  const foods = await page.evaluate(() => {
    const M = window.MealPlanOnboarding;
    const keys = ["flax_tsp", "flax_tbsp", "dates_cup", "grapes_cup", "apple", "orange", "celery_cup", "snap_peas_cup", "tuna_oz", "canned_chicken_oz", "canned_salmon_oz",
      "deli_turkey_oz", "sourdough_bread_slice", "sourdough_crackers_oz", "hummus_tbsp", "cheddar_oz", "cottage_full_cup",
      "cinnamon_tsp", "vanilla_tsp", "pumpkin_spice_tsp", "salt_pinch", "pepper_pinch", "garlic_powder_tsp", "paprika_tsp", "mustard_tsp", "lemon_juice_tsp", "cacao_tsp"];
    const missing = keys.filter((k) => !M.FOOD[k] || !M.PRICE_CATALOG[k] || !M.UNIT_GRAMS[k]);
    const T = (k) => (M.FOOD_TAGS[k] || []).join("+");
    return {
      missing, cacao: M.FOOD.cacao_tsp, cacaoG: M.UNIT_GRAMS.cacao_tsp,
      tags: [T("tuna_oz"), T("canned_salmon_oz"), T("canned_chicken_oz"), T("deli_turkey_oz"), T("cheddar_oz"), T("cottage_full_cup"), T("sourdough_bread_slice"), T("sourdough_crackers_oz")].join(","),
      pantry: ["cinnamon_tsp", "vanilla_tsp", "salt_pinch", "pepper_pinch", "garlic_powder_tsp", "paprika_tsp", "mustard_tsp", "lemon_juice_tsp", "pumpkin_spice_tsp"].every((k) => M.PRICE_CATALOG[k].pantry),
      cacaoPantry: !!M.PRICE_CATALOG.cacao_tsp.pantry,
      flaxTbsp: M.FOOD.flax_tbsp.kcal, tuna: M.FOOD.tuna_oz.p,
    };
  });
  check(foods.missing.length === 0, "every new food has USDA macros, grams and a price" + (foods.missing.length ? " (missing " + foods.missing + ")" : ""));
  check(Math.abs(foods.cacao.kcal - 4.1) < 0.01 && foods.cacao.p === 0.35 && foods.cacaoG === 1.8, "cacao powder uses USDA [19165] per 1.8 g tsp (4.1 kcal, 0.35 g protein)");
  check(foods.tags === "fish,fish,meat,meat,dairy,dairy,gluten,gluten", "tags: tuna/salmon fish, chicken/deli meat, cheese/cottage dairy, sourdough gluten (" + foods.tags + ")");
  check(foods.pantry && !foods.cacaoPantry, "spices, salt, vanilla, mustard, lemon juice are pantry items; cacao is a priced purchase");
  check(foods.flaxTbsp === 37 && foods.tuna === 7.2, "flax (USDA 12220) and canned tuna (USDA 15121) values");

  console.log("2) Sweet / Savory template groups by slot");
  const ord = await page.evaluate(() => {
    const M = window.MealPlanOnboarding;
    const o = (r) => ({ budget: 600, restrictions: r || [] });
    const ids = (mi, mc, r) => M.pickTemplatesFor("meal", o(r), { mealIndex: mi, mealCount: mc }).map((t) => t.id).join(",");
    const grp = (mi, mc) => M.pickTemplateGroups("meal", o(), { mealIndex: mi, mealCount: mc }).map((g) => g.label).join(">");
    const out = {};
    [2, 3, 4, 5].forEach((mc) => { for (let mi = 1; mi <= mc; mi++) out[mc + ":" + mi] = ids(mi, mc); });
    out.g31 = grp(1, 3); out.g32 = grp(2, 3); out.g44 = grp(4, 4); out.g55 = grp(5, 5); out.g54 = grp(4, 5);
    out.snack = M.pickTemplateGroups("snack", o(), { mealIndex: 1, mealCount: 3 }).map((g) => g.label + ":" + g.templates.map((t) => t.id).join(",")).join("|");
    out.vegan = ids(1, 3, ["vegan"]); out.dairy = ids(1, 3, ["dairy_free"]);
    out.veg = ids(2, 3, ["vegetarian"]); out.vegEgg = ids(2, 3, ["vegetarian", "egg_free"]);
    const lp = (r) => M.pickStepsFor("lunch_box", {}, o(r)).find((s) => s.id === "protein").options.map((x) => x.value).join(",");
    out.lpAll = lp([]); out.lpVeg = lp(["vegetarian"]); out.lpFish = lp(["fish_free"]); out.lpEgg = lp(["egg_free"]);
    out.glutenCarbs = M.pickStepsFor("lunch_box", {}, o(["gluten_free"])).find((s) => s.id === "carbs").options.length;
    return out;
  });
  const sw = SWEET + "," + SAVORY, sv = SAVORY + "," + SWEET;
  check(ord["3:1"] === sw && ord["3:2"] === sv && ord["3:3"] === sv, "3 meals: Meal 1 Sweet first; Meals 2–3 Savory first");
  check(ord["4:1"] === sw && ord["4:2"] === sv && ord["4:3"] === sv && ord["4:4"] === sw, "4 meals: Meal 1 + Meal 4 Sweet first; Meals 2–3 Savory first");
  check(ord["5:1"] === sw && ["5:2", "5:3", "5:4"].every((k) => ord[k] === sv) && ord["5:5"] === sw, "5 meals: Meal 1 + Meal 5 Sweet first; Meals 2–4 Savory first");
  check(ord["2:1"] === sw && ord["2:2"] === sv, "2 meals (+1 snack): Meal 1 Sweet first; Meal 2 Savory first (last-meal rule is only for 4/5 meals)");
  check(ord.g31 === "Sweet>Savory" && ord.g32 === "Savory>Sweet" && ord.g44 === "Sweet>Savory" && ord.g55 === "Sweet>Savory" && ord.g54 === "Savory>Sweet", "group headings follow the same order");
  check(ord.snack === ":nut,greek,cottage,hb_egg", "snacks: one ungrouped list (" + ord.snack + ")");
  check(ord.vegan === "smoothie,oatmeal,salad_jar,bowl" && ord.dairy === "smoothie,oatmeal,lunch_box,salad_jar,bowl", "vegan: no yogurt bowl / lunch box; dairy-free: no yogurt bowl");
  check(ord.veg === "lunch_box,salad_jar,bowl,smoothie,yogurt_bowl,oatmeal" && ord.lpVeg === "hb_eggs", "vegetarian lunch box: hard-boiled eggs only");
  check(ord.vegEgg === "salad_jar,bowl,smoothie,yogurt_bowl,oatmeal", "vegetarian + egg-free: no lunch box");
  check(ord.lpAll === "tuna,canned_chicken,canned_salmon,hb_eggs,deli_turkey" && ord.lpFish === "canned_chicken,hb_eggs,deli_turkey" && ord.lpEgg === "tuna,canned_chicken,canned_salmon",
    "lunch box proteins (deli turkey only alongside eggs): " + ord.lpAll + " | fish-free " + ord.lpFish + " | egg-free " + ord.lpEgg);
  check(ord.glutenCarbs === 0, "gluten-free hides the sourdough crackers/bread");

  console.log("3) Flavor step after fats (0–3, sweet vs savory)");
  const fs3 = await page.evaluate(() => {
    const M = window.MealPlanOnboarding;
    const o = { budget: 600, restrictions: [] };
    const out = {};
    ["smoothie", "yogurt_bowl", "oatmeal", "lunch_box", "salad_jar", "bowl"].forEach((t) => {
      const st = M.pickStepsFor(t, {}, o);
      const f = st[st.length - 1];
      out[t] = { order: st.map((s) => s.id).join(">"), vals: f.options.map((x) => x.value).join(","), labels: f.options.map((x) => x.label).join(","), mm: f.min + "-" + f.max, id: f.id };
    });
    out.cherry = M.pickStepsFor("smoothie", { carbs: ["banana", "cherries_cup"] }, o).find((s) => s.id === "flavor").defaults.join(",");
    out.noCherry = M.pickStepsFor("smoothie", { carbs: ["banana"] }, o).find((s) => s.id === "flavor").defaults.join(",");
    out.snackFlavor = ["nut", "greek", "cottage", "hb_egg"].some((t) => M.pickStepsFor(t, {}, o).some((s) => s.id === "flavor"));
    out.valid0 = M.pickStepValid(M.pickStepsFor("bowl", {}, o).find((s) => s.id === "flavor"), []);
    out.valid4 = M.pickStepValid(M.pickStepsFor("bowl", {}, o).find((s) => s.id === "flavor"), ["salt_pinch", "pepper_pinch", "paprika_tsp", "garlic_powder_tsp"]);
    return out;
  });
  check(fs3.smoothie.order === "carbs>milk>fats>flavor" && fs3.oatmeal.order === "carbs>fats>milk>flavor" && fs3.bowl.order === "protein>carb>veg>fat>flavor" &&
    fs3.salad_jar.order === "protein>greens>veg>extras>fat>flavor" && fs3.yogurt_bowl.order === "carbs>extras>fats>flavor" && fs3.lunch_box.order === "protein>carbs>fruit>veg>fats>flavor",
    "Flavor is the step after fats on every meal template (oats: after the milk that follows fats)");
  const sweetVals = "cinnamon_tsp,cacao_tsp,vanilla_tsp,pumpkin_spice_tsp,salt_pinch", savoryVals = "salt_pinch,pepper_pinch,garlic_powder_tsp,paprika_tsp,lemon_juice_tsp,mustard_tsp";
  check(["smoothie", "yogurt_bowl", "oatmeal"].every((t) => fs3[t].vals === sweetVals), "sweet templates: " + fs3.smoothie.labels);
  check(["lunch_box", "salad_jar", "bowl"].every((t) => fs3[t].vals === savoryVals), "savory templates: " + fs3.bowl.labels);
  check(Object.keys(fs3).filter((k) => fs3[k].mm).every((k) => fs3[k].mm === "0-3"), "multi-select 0–3");
  check(fs3.valid0 && !fs3.valid4, "none is allowed; a 4th flavor is not");
  check(fs3.cherry === "cacao_tsp" && fs3.noCherry === "", "cherries preselect cacao");
  check(!fs3.snackFlavor, "snacks have no flavor step");

  console.log("4) Cacao in every chocolate cherry (generated, rerolled, picked) + grocery + prep");
  const cc = await page.evaluate(() => {
    const M = window.MealPlanOnboarding;
    const out = { gen: 0, genBad: [], rr: 0, rrBad: 0, types: {} };
    for (const b of [450, 900]) for (const mo of Object.keys(M.MEAL_OPTIONS)) for (const v of [0, 1, 2, 3, 4, 5, 6, 7]) {
      const a = { budget: b, cadence: "weekly", calorieMode: "known", calories: 2400, weightGoal: "maintain", mealOption: mo, meals: M.MEAL_OPTIONS[mo].meals, snacks: M.MEAL_OPTIONS[mo].snacks, daysPerWeek: 6, selectedDays: ["mon", "tue", "wed", "thu", "fri", "sat"], restrictions: [] };
      const p = M.buildPlan(a, { variant: v });
      const scan = (pl, rr) => pl.schedule.forEach((sl) => {
        const s = sl.suggestion;
        if (!/chocolate cherry/i.test(s.title)) return;
        out.types[s.type] = 1;
        const ok = s.ingredients.some((i) => i._key === "cacao_tsp" && i._qty >= 1);
        if (rr) { out.rr++; if (!ok) out.rrBad++; } else { out.gen++; if (!ok) out.genBad.push(s.title); }
      });
      scan(p, false);
      for (let k = 0; k < 3; k++) scan(M.rerollSlot(p, Object.assign({}, a), 0, v * 3 + k + 1), true);
      scan(M.rerollDay(Object.assign({}, a), p, v + 9), true);
    }
    const a = { budget: 600, cadence: "weekly", calorieMode: "known", calories: 2400, weightGoal: "maintain", mealOption: "3m", meals: 3, snacks: 0, daysPerWeek: 7, selectedDays: ["mon", "tue", "wed", "thu", "fri", "sat", "sun"], restrictions: [] };
    const pp = M.buildPickedPlan(a, [
      { template: "smoothie", sel: { carbs: ["banana", "cherries_cup"], milk: ["almond_milk_oz"], fats: ["chia_tsp"] } },
      { template: "oatmeal", sel: { carbs: ["oats_cup", "cherries_cup"], fats: ["walnuts_tsp"], milk: ["milk_skim_oz"], flavor: ["cacao_tsp", "cinnamon_tsp"] } },
      { template: "yogurt_bowl", sel: { carbs: ["cherries_cup"], extras: [], fats: ["flax_tsp"], flavor: ["cacao_tsp"] } },
    ], 0);
    const cards = pp.schedule.map((sl) => ({ title: sl.suggestion.title, cacao: (sl.suggestion.ingredients.find((i) => i._key === "cacao_tsp") || {}).label || "", labels: sl.suggestion.ingredients.map((i) => i.label) }));
    const off = M.buildPickedPlan(a, [
      { template: "smoothie", sel: { carbs: ["banana", "cherries_cup"], milk: ["almond_milk_oz"], fats: ["chia_tsp"], flavor: [] } },
      { template: "bowl", sel: { protein: ["chicken"], carb: ["rice_cup"], veg: ["broccoli_cup"], fat: ["evoo"] } },
      { template: "bowl", sel: { protein: ["beef"], carb: ["rice_cup"], veg: ["broccoli_cup"], fat: ["evoo"] } },
    ], 0).schedule[0].suggestion;
    const g = pp.grocery.items;
    const cac = g.find((i) => i.key === "cacao_tsp"), cin = g.find((i) => i.key === "cinnamon_tsp");
    const prep = M.prepHtml(pp.schedule[0], { days: 7 }).replace(/<[^>]+>/g, " ").replace(/\s+/g, " ");
    return Object.assign(out, { cards, offTitle: off.title, offCacao: off.ingredients.some((i) => i._key === "cacao_tsp"),
      cac: cac && { total: cac.lineTotal, name: cac.name, pantry: cac.pantry }, cin: cin && { total: cin.lineTotal, pantry: cin.pantry, label: cin.qtyLabel }, prep });
  });
  check(cc.gen > 0 && cc.genBad.length === 0, "generated: all " + cc.gen + " chocolate cherry meals include cacao (" + Object.keys(cc.types).join(", ") + ")");
  check(cc.rr > 0 && cc.rrBad === 0, "rerolled: all " + cc.rr + " chocolate cherry meals include cacao");
  check(cc.cards[0].title === "Chocolate banana cherry smoothie" || /^Chocolate .*cherry smoothie$/.test(cc.cards[0].title), "picked cherry smoothie (no flavor step answer) → '" + cc.cards[0].title + "' with " + cc.cards[0].cacao);
  check(/^2 tsp cacao powder \(4g\)$/.test(cc.cards[0].cacao) && /cacao/.test(cc.cards[1].cacao) && /cacao/.test(cc.cards[2].cacao), "picked smoothie, oats and yogurt bowl all list 2 tsp cacao powder (" + cc.cards.map((c) => c.title).join(" | ") + ")");
  check(cc.offTitle === "Banana cherry smoothie" && !cc.offCacao, "taking cacao off the flavor step drops 'chocolate' from the title (" + cc.offTitle + ")");
  check(cc.cac && cc.cac.total > 0 && !cc.cac.pantry, "grocery: cacao powder is priced ($" + (cc.cac && cc.cac.total) + ")");
  check(cc.cin && cc.cin.total === 0 && cc.cin.pantry, "grocery: cinnamon listed as a pantry item (" + (cc.cin && cc.cin.label) + ", not priced)");
  check(/Each jar: .*2 tsp cacao powder/.test(cc.prep), "prep: cacao goes in the smoothie jar");

  console.log("5) Oat prep: warm + overnight");
  const oat = await page.evaluate(() => {
    const M = window.MealPlanOnboarding;
    const a = { budget: 600, cadence: "weekly", calorieMode: "known", calories: 2400, weightGoal: "maintain", mealOption: "3m", meals: 3, snacks: 0, daysPerWeek: 5, selectedDays: ["mon", "tue", "wed", "thu", "fri"], restrictions: [] };
    let sl = null;
    for (let v = 0; v < 12 && !sl; v++) sl = M.buildPlan(a, { variant: v }).schedule.find((x) => x.suggestion.type === "oatmeal");
    const r = M.prepForSlot(sl, { days: 5 });
    const html = M.prepHtml(sl, { days: 5 });
    const water = M.buildPickedPlan(a, [{ template: "oatmeal", sel: { carbs: ["oats_cup", "banana"], fats: ["chia_tsp"], milk: ["water"] } },
      { template: "bowl", sel: { protein: ["chicken"], carb: ["rice_cup"], veg: ["broccoli_cup"], fat: ["evoo"] } },
      { template: "bowl", sel: { protein: ["beef"], carb: ["rice_cup"], veg: ["broccoli_cup"], fat: ["evoo"] } }], 0).schedule[0];
    const rw = M.prepForSlot(water, { days: 5 });
    return { daily: r.daily, labels: r.labels, versions: [...html.matchAll(/data-prep-version="([^"]+)"/g)].map((m) => m[1]), doc: M.PREP_DOC.oatmeal, water: rw.daily };
  });
  check(oat.daily.length === 2 && oat.labels.join("|") === "Warm oatmeal|Overnight oats" && oat.versions.join("|") === "Warm oatmeal|Overnight oats", "daily prep lists both versions: " + oat.labels.join(" + "));
  check(/^Empty jar into bowl and add milk or water \(.*\)\. Microwave for 1-2 minutes until oats are soft\./.test(oat.daily[0]), "warm = the doc's Oatmeal prep wording (" + oat.daily[0].slice(0, 70) + "…)");
  check(/^The night before, empty jar into a lidded jar or container and stir in the milk \(.*\)\. Refrigerate overnight/.test(oat.daily[1]) && /eat cold, or microwave about 1 minute to warm/i.test(oat.daily[1]), "overnight (improvised; doc heading has no steps): " + oat.daily[1].slice(0, 90) + "…");
  check(/stir in the water \(about \d+ oz water\)/.test(oat.water[1]), "water oats: overnight version uses the water");

  console.log("6) New templates: Greek yogurt bowl, Lunch box, flax, cottage cheese bowl fat");
  const nt = await page.evaluate(() => {
    const M = window.MealPlanOnboarding;
    const a = { budget: 600, cadence: "weekly", calorieMode: "known", calories: 2400, weightGoal: "maintain", mealOption: "3m", meals: 3, snacks: 0, daysPerWeek: 5, selectedDays: ["mon", "tue", "wed", "thu", "fri"], restrictions: [] };
    const pp = M.buildPickedPlan(a, [
      { template: "yogurt_bowl", sel: { carbs: ["berries_cup", "dates_cup"], extras: ["yogurt_oats", "honey_tsp"], fats: ["chia_tsp", "flax_tsp"], flavor: ["cinnamon_tsp", "vanilla_tsp"] } },
      { template: "lunch_box", sel: { protein: ["tuna"], carbs: ["sourdough_crackers_oz"], fruit: ["apple"], veg: ["carrots_cup", "celery_cup"], fats: ["hummus_tbsp"], flavor: ["lemon_juice_tsp", "pepper_pinch"] } },
      { template: "bowl", sel: { protein: ["chicken"], carb: ["rice_cup"], veg: ["broccoli_cup"], fat: ["cottage"], flavor: ["salt_pinch", "garlic_powder_tsp"] } },
    ], 0);
    const keys = (i) => pp.schedule[i].suggestion.ingredients.map((x) => x._key);
    const labels = (i) => pp.schedule[i].suggestion.ingredients.map((x) => x.label);
    const prep = (i) => { const r = M.prepForSlot(pp.schedule[i], { days: 5 }); return r.weekly.concat(r.daily).join(" "); };
    const fl = (t) => M.pickStepsFor(t, {}, { budget: 600 }).find((s) => /fat/.test(s.id)).options.map((x) => x.value);
    const deli = M.buildPickedSuggestion({ template: "lunch_box", sel: { protein: ["deli_turkey"], carbs: [], fruit: ["orange"], veg: ["snap_peas_cup"], fats: ["cheddar_oz"] } }, 700, { p: 50, c: 70, f: 23 }, { budget: 600 });
    return {
      titles: pp.schedule.map((s) => s.suggestion.title), k0: keys(0), k1: keys(1), k2: keys(2), l0: labels(0), l1: labels(1), l2: labels(2),
      p0: prep(0), p1: prep(1), p2: prep(2), within: pp.compliance.calOk, kcal: pp.actual.kcal,
      flaxIn: ["smoothie", "oatmeal", "yogurt_bowl"].every((t) => fl(t).includes("flax_tsp")), cottageBowl: fl("bowl").includes("cottage"),
      deli: deli.ingredients.map((x) => x._key + ":" + x._qty), groc: pp.grocery.items.map((i) => i.key + (i.pantry ? "(pantry)" : "")),
    };
  });
  check(nt.titles[0] === "Berry date yogurt bowl" && nt.k0[0] === "greek_2pct_cup" && nt.k0.includes("dates_cup") && nt.k0.includes("oats_cup") && nt.k0.includes("honey_tsp"), "Greek yogurt bowl: 2% Greek yogurt base + berries, dates, 2 tbsp oats, honey (" + nt.l0.join("; ") + ")");
  check(nt.k0.some((k) => /^flax_/.test(k)) && nt.k0.includes("cinnamon_tsp") && nt.k0.includes("vanilla_tsp"), "…with flax seeds and the picked flavors (cinnamon, vanilla)");
  check(nt.titles[1] === "Tuna lunch box" && ["tuna_oz", "apple", "carrots_cup", "celery_cup", "sourdough_crackers_oz", "hummus_tbsp", "lemon_juice_tsp", "pepper_pinch"].every((k) => nt.k1.includes(k)), "Lunch box: " + nt.l1.join("; "));
  check(/Pinch of black pepper \(0\.3g\)/.test(nt.l1.join("|")), "a pinch shows its grams (0.3g)");
  check(nt.deli.some((d) => /^hard_boiled_egg:[12]$/.test(d)) && nt.deli.some((d) => /^deli_turkey_oz:(1|1\.5|2|2\.5|3)$/.test(d)), "deli turkey stays ≤ 3 oz and comes with hard-boiled eggs (" + nt.deli.join(", ") + ")");
  check(nt.k2.includes("cottage_full_cup") && nt.cottageBowl, "cottage cheese is a bowl fat (" + nt.l2.join("; ") + ")");
  check(nt.flaxIn, "flax seeds offered as a fat for smoothie, oatmeal and yogurt bowl");
  check(/Portion the dry toppings into 5 small jars/.test(nt.p0) && /Spoon .*2% Greek yogurt into a bowl/.test(nt.p0), "yogurt bowl prep: topping jars + assemble cold");
  check(/Drain .*canned tuna/.test(nt.p1) && /Pack 3 lunch boxes/.test(nt.p1) && /sourdough crackers in the pantry/.test(nt.p1) && /Season with 2 tsp lemon juice and a pinch of black pepper/.test(nt.p1), "lunch box prep: drain, pack (3 days for opened fish), crackers kept dry, season");
  check(/Season the chicken breast lightly with .*salt.*garlic powder/.test(nt.p2) && /Top with .*4% cottage cheese after reheating/.test(nt.p2), "bowl prep: seasoning before cooking; cottage cheese added after reheating");
  check(nt.groc.includes("tuna_oz") && nt.groc.includes("hummus_tbsp") && nt.groc.includes("garlic_powder_tsp(pantry)") && nt.groc.includes("salt_pinch(pantry)"), "grocery: new foods + pantry flavors listed");

  console.log("7) Generated plans: new templates, flavors, restrictions, budget");
  const gp = await page.evaluate(() => {
    const M = window.MealPlanOnboarding;
    const out = { types: {}, low: {}, bad: [], sweetSlot: 0, flavLines: 0, salad: 0, saladFl: 0, bowl: 0, bowlFl: 0, eggs: 0 };
    const sets = [[], ["dairy_free"], ["gluten_free"], ["vegetarian"], ["vegan"], ["fish_free"], ["egg_free", "vegetarian"], ["nut_free"]];
    for (const r of sets) {
      const flags = M.restrictionFlags(r);
      for (const b of [150, 450, 900]) for (const mo of Object.keys(M.MEAL_OPTIONS)) for (const v of [0, 1, 2, 3, 4, 5]) {
        const a = { budget: b, cadence: "weekly", calorieMode: "known", calories: 2400, weightGoal: "maintain", mealOption: mo, meals: M.MEAL_OPTIONS[mo].meals, snacks: M.MEAL_OPTIONS[mo].snacks, daysPerWeek: 6, selectedDays: ["mon", "tue", "wed", "thu", "fri", "sat"], restrictions: r };
        const p = M.buildPlan(a, { variant: v });
        const pls = [p, M.rerollSlot(p, Object.assign({}, a), 1, v + 1)];
        pls.forEach((pl, pi) => pl.schedule.forEach((sl) => {
          const s = sl.suggestion;
          const keys = s.ingredients.map((i) => i._key).filter(Boolean);
          keys.forEach((k) => { if (!M.foodAllowed(k, flags)) out.bad.push(r.join("+") + ":" + k); });
          if (pi === 0) {
            if (b === 150) out.low[s.type] = (out.low[s.type] || 0) + 1; else out.types[s.type] = (out.types[s.type] || 0) + 1;
            if (s.type === "yogurt_bowl" && sl.index !== 1 && !(mo === "3m2s" && sl.name === "Meal 3")) out.sweetSlot++;
            if (s.type === "salad_jar") { out.salad++; if (keys.some((k) => k === "lemon_juice_tsp" || k === "mustard_tsp")) out.saladFl++; }
            if (s.type === "bowl") { out.bowl++; if (keys.includes("salt_pinch")) out.bowlFl++; }
            out.eggs = Math.max(out.eggs, s.ingredients.filter((i) => i._key === "egg" || i._key === "hard_boiled_egg").reduce((x, i) => x + i._qty, 0));
          }
        }));
      }
    }
    out.badN = out.bad.length; out.bad = out.bad.slice(0, 4).join(",");
    return out;
  });
  check(gp.types.yogurt_bowl > 0 && gp.types.lunch_box > 0, "mid/high budgets: generated days include Greek yogurt bowls (" + gp.types.yogurt_bowl + ") and lunch boxes (" + gp.types.lunch_box + ")");
  check(!gp.low.yogurt_bowl && !gp.low.lunch_box, "tight budget ($150) keeps the cheaper original templates");
  check(gp.sweetSlot === 0, "generated yogurt bowls only take sweet slots (Meal 1 / 3m2s Meal 3)");
  check(gp.badN === 0, "no restriction leaks in generated/rerolled plans incl. new foods (" + gp.badN + (gp.bad ? " e.g. " + gp.bad : "") + ")");
  check(gp.saladFl > 0 && gp.saladFl < gp.salad && gp.bowlFl === gp.bowl, "generated flavors: salad jars get 0–1 of mustard/lemon (" + gp.saladFl + "/" + gp.salad + "), bowls are seasoned (" + gp.bowlFl + "/" + gp.bowl + ")");
  check(gp.eggs <= 3, "whole eggs still ≤ 3 per meal (max " + gp.eggs + ")");

  console.log("8) Pick wizard in the UI: 4 meals (screenshots)");
  await nav("profile");
  await questionnaire({ budget: 600, calories: 2400, meals: "4m" });
  await page.click('input[name="buildMode"][value="pick"]'); await next();
  await page.waitForSelector("#pickTemplateStep");
  let t = await tplState();
  check(t.groups.join(">") === "sweet>savory" && t.values.join(",") === sw, "Meal 1: Sweet group first (" + t.values.join(", ") + ")");
  await shot("doc34-templates-meal1-sweet-first.png", "#pickTemplateStep");
  await chooseTemplate("smoothie");
  await pickStep(["banana", "cherries_cup"]); await next();
  await tick("almond_milk_oz"); await next();
  await tick("chia_tsp"); await next();
  let s = await ingState();
  check(s.step === "flavor" && s.type === "checkbox" && s.min === 0 && s.max === 3 && s.values.join(",") === sweetVals, "smoothie flavor step (after fats): " + s.labels.join(" / "));
  check(s.checked.join(",") === "cacao_tsp", "cherries → cacao preselected");
  await tick("cinnamon_tsp"); await tick("vanilla_tsp");
  s = await ingState();
  check(s.checked.length === 3 && s.disabled.length === s.values.length - 3, "3 flavors picked → the rest disabled (max 3)");
  await shot("doc34-flavor-step-sweet.png", "#pickIngredientStep");
  await tick("vanilla_tsp");
  await next();
  await page.waitForSelector("#pickTemplateStep");
  t = await tplState();
  check(t.groups.join(">") === "savory>sweet" && t.values.join(",") === sv, "Meal 2: Savory group first (" + t.values.join(", ") + ")");
  await shot("doc34-templates-meal2-savory-first.png", "#pickTemplateStep");
  await chooseTemplate("lunch_box");
  await pickStep(["tuna"]); await next();
  s = await ingState(); check(s.step === "carbs" && s.min === 0, "lunch box: sourdough is optional");
  await tick("sourdough_crackers_oz"); await next();
  await pickStep(["apple"]); await next();
  await pickStep(["carrots_cup", "celery_cup"]); await next();
  await pickStep(["hummus_tbsp"]); await next();
  s = await ingState();
  check(s.step === "flavor" && s.values.join(",") === savoryVals && s.checked.length === 0, "lunch box flavor step (savory, nothing preselected): " + s.labels.join(" / "));
  await tick("lemon_juice_tsp"); await tick("pepper_pinch");
  await shot("doc34-flavor-step-savory.png", "#pickIngredientStep");
  await next();
  await page.waitForSelector("#pickTemplateStep");
  t = await tplState();
  check(t.groups.join(">") === "savory>sweet", "Meal 3 of 4: Savory first");
  await chooseTemplate("oatmeal");
  await pickStep(["banana"]); await next();
  await tick("flax_tsp"); await next();
  await tick("milk_skim_oz"); await next();
  s = await ingState();
  check(s.step === "flavor" && !(await nextDisabled()), "oat flavor step: Next works with no flavor picked");
  await next();
  await page.waitForSelector("#pickTemplateStep");
  t = await tplState();
  check(t.groups.join(">") === "sweet>savory" && t.values[0] === "smoothie", "Meal 4 of 4 (last meal): Sweet first");
  await chooseTemplate("yogurt_bowl");
  await pickStep(["berries_cup", "dates_cup"]); await next();
  await next(); // no add-ins
  await pickStep(["chia_tsp"]); await next();
  await tick("cinnamon_tsp");
  await next();
  await page.waitForSelector("#saveClose");
  const c0 = await cardText(0), c1 = await cardText(1), c2 = await cardText(2), c3 = await cardText(3);
  check(/Chocolate .*cherry smoothie/.test(c0) && /2 tsp cacao powder/.test(c0) && /ground cinnamon/.test(c0), "card: chocolate cherry smoothie with cacao + cinnamon");
  check(/Tuna lunch box/.test(c1) && /lemon juice/.test(c1) && /Pinch of black pepper/.test(c1) && /sourdough crackers/.test(c1), "card: tuna lunch box with lemon juice + pepper");
  check(/oatmeal/i.test(c2) && /flax/.test(c2) && !/cinnamon|cacao powder/.test(c2.replace(/Optional[^.]*/g, "")), "card: oatmeal with flax, no flavor lines" + (process.env.DBG ? " :: " + c2 : ""));
  check(/yogurt bowl/i.test(c3) && /2% Greek yogurt/.test(c3) && /dates/.test(c3) && /ground cinnamon/.test(c3), "card: Greek yogurt bowl with dates + cinnamon");
  await elShot("doc34-chocolate-cherry-card.png", '.mp-slots > .mp-card[data-slot-index="0"]');
  await page.$eval('.mp-slots > .mp-card[data-slot-index="2"] details.mp-prep', (d) => { d.open = true; });
  const oatPrep = await page.$eval('.mp-slots > .mp-card[data-slot-index="2"] details.mp-prep', (d) => ({
    versions: [...d.querySelectorAll("[data-prep-version]")].map((l) => l.dataset.prepVersion), text: d.textContent.replace(/\s+/g, " "),
  }));
  check(oatPrep.versions.join("|") === "Warm oatmeal|Overnight oats" && /Microwave for 1-2 minutes/.test(oatPrep.text) && /Refrigerate overnight/.test(oatPrep.text), "oatmeal card prep (expanded): Warm oatmeal + Overnight oats");
  await elShot("doc34-oat-prep-expanded.png", '.mp-slots > .mp-card[data-slot-index="2"] details.mp-prep');
  await page.click("#saveClose");
  await page.waitForSelector("#screen-home .macro-pie");
  const st = await getState();
  const groc = (st.groceryList && st.groceryList.items) || [];
  const gk = (k) => groc.find((i) => i.key === k);
  check(gk("cacao_tsp") && gk("cacao_tsp").lineTotal > 0 && gk("cinnamon_tsp") && gk("cinnamon_tsp").pantry && gk("tuna_oz") && gk("dates_cup"), "saved grocery list: cacao priced, cinnamon pantry, tuna, dates");
  await nav("inventory");
  await page.waitForSelector("#groceryRows");
  const gRow = await page.evaluate(() => {
    const r = document.querySelector('.grocery-row[data-key="cinnamon_tsp"]');
    const c = document.querySelector('.grocery-row[data-key="cacao_tsp"]');
    return { cin: r ? r.textContent.replace(/\s+/g, " ") : "", cac: c ? c.textContent.replace(/\s+/g, " ") : "" };
  });
  check(/pantry item/.test(gRow.cin) && /pantry$|pantry\s*I have/.test(gRow.cin.trim()) || /pantry/.test(gRow.cin), "grocery screen: cinnamon shows as a pantry item (" + gRow.cin.trim().slice(0, 70) + ")");
  check(/\$\d/.test(gRow.cac), "grocery screen: cacao powder has a price (" + gRow.cac.trim().slice(0, 70) + ")");
  await shot("doc34-grocery-pantry.png", '.grocery-row[data-key="cacao_tsp"]', "center");

  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1);
  check(!overflow, "no horizontal overflow at 390px");
  check(errors.length === 0, "no page errors" + (errors.length ? ": " + errors.join(" | ") : ""));
  await browser.close();
  srv.close();
  console.log(failures ? "\n" + failures + " FAILED" : "\nALL PASSED");
  process.exit(failures ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(1); });
