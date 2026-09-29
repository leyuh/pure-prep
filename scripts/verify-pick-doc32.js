/**
 * doc32: "Let's pick our meals" / "Give me some ideas", Suggested supplements, dietary restrictions.
 *  - Questionnaire asks "Any dietary restrictions?" (None + 8 options, multi-select, None exclusive).
 *  - After the questionnaire (and from Pick new meals / Update meal plan) a build-choice screen;
 *    "ideas" = the old generated plan, "pick" = slot-by-slot template + ingredient wizard with
 *    per-step limits, Back, Next disabled until valid.
 *  - Suggested supplements section (between Meals & snacks and Nutrition overview), plan- and
 *    restriction-aware, with a not-medical-advice disclaimer.
 *  - Restrictions respected in generation, rerolls, top-ups, pick options (impossible templates
 *    hidden), protein powder (plant protein) and milk (no almond milk when nut-free); Profile edits
 *    apply to future plans only.
 *  - Cache-bust ?v=doc32, favicon ?v=leaf8.
 * Optional: SHOTS_DIR=/path saves screenshots. BASE_URL=https://… runs against a live site.
 * Run: node scripts/verify-pick-doc32.js
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
  // Viewport shots for question steps; full-page for plans. `sel` scrolls that element (or its heading) to the top.
  const shot = async (name, sel, full) => {
    if (!shots) return;
    if (sel) await page.$eval(sel, (e) => { const h = e.previousElementSibling; (h && h.tagName === "H2" ? h : e).scrollIntoView({ block: "start" }); window.scrollBy(0, -12); });
    else if (!full) await page.evaluate(() => window.scrollTo(0, 0));
    await page.screenshot({ path: path.join(shots, name), fullPage: !!full });
  };
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
      checked: ins.filter((n) => n.checked).map((n) => n.value), disabled: ins.filter((n) => n.disabled).map((n) => n.value),
      count: (document.querySelector("#pickIngredientStep .mp-pick-count") || {}).textContent || "",
      note: (document.querySelector("#pickIngredientStep .mp-pick-note") || {}).textContent || "",
      next: (document.querySelector("#onboard-root .mp-next") || {}).textContent || "",
      label: (document.querySelector("#pickIngredientStep .step-label") || {}).textContent || "",
    };
  });
  const templates = () => page.$$eval('#pickTemplateStep input[name="pickTemplate"]', (ns) => ns.map((n) => n.value));
  const tick = (v) => page.click(`#onboard-root input[name="pickIng"][value="${v}"]`);
  const chooseTemplate = async (t) => { await page.click(`#pickTemplateStep input[name="pickTemplate"][value="${t}"]`); await next(); await page.waitForSelector("#pickIngredientStep"); };
  /** Pick `want` (or the first option(s) when missing) on the current ingredient step. */
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
    await next(); // default days → build choice
    await page.waitForSelector("#buildChoice");
  };

  await page.goto(base);
  await page.evaluate(() => localStorage.clear());
  await page.reload();

  console.log("1) Build + cache-bust");
  check(/^onboarding\.js\?v=doc(3[2-9])$/.test(await page.$eval('script[src^="onboarding.js"]', (s) => s.getAttribute("src"))), "onboarding.js?v=doc32+");
  check(await page.$eval('link[rel="icon"][type="image/svg+xml"]', (l) => l.getAttribute("href")) === "assets/favicon.svg?v=leaf8", "favicon stays ?v=leaf8");

  console.log("2) Dietary restrictions question");
  await nav("profile");
  await page.fill("#budget", "600"); await next();
  await page.click('input[name="cadence"][value="weekly"]'); await next();
  await page.click('input[name="calorieMode"][value="known"]'); await next();
  await page.fill("#calories", "2400"); await next();
  await page.click('input[name="weightGoal"][value="maintain"]'); await next();
  await page.waitForSelector('input[name="restriction"]');
  check((await page.textContent("#onboard-root .mp-q")).trim() === "Any dietary restrictions?", "restrictions question comes after the goal step");
  const rVals = await page.$$eval('input[name="restriction"]', (ns) => ns.map((n) => n.value + ":" + n.type));
  check(rVals.join(",") === ["none", "dairy_free", "gluten_free", "egg_free", "nut_free", "fish_free", "vegetarian", "vegan", "pork_free"].map((v) => v + ":checkbox").join(","),
    "multi-select: None + 8 options (no 'Other')");
  const rLabels = await page.$$eval("#onboard-root .mp-restrictions .mp-option", (ls) => ls.map((l) => l.textContent.replace(/\s+/g, " ").trim()));
  check(rLabels.some((t) => /Nut-free \(tree nuts \+ peanuts\)/.test(t)) && rLabels.some((t) => /Fish\/shellfish-free/.test(t)), "labels include nut-free (tree nuts + peanuts) and fish/shellfish-free");
  check(await page.isChecked('input[name="restriction"][value="none"]'), "None preselected");
  await page.click('input[name="restriction"][value="dairy_free"]');
  await page.click('input[name="restriction"][value="nut_free"]');
  check(!(await page.isChecked('input[name="restriction"][value="none"]')) && await page.isChecked('input[name="restriction"][value="dairy_free"]') && await page.isChecked('input[name="restriction"][value="nut_free"]'),
    "picking restrictions unchecks None; several can be picked");
  await shot("doc32-restrictions.png");
  await page.click('input[name="restriction"][value="none"]');
  const afterNone = await page.$$eval('input[name="restriction"]:checked', (ns) => ns.map((n) => n.value));
  check(afterNone.join(",") === "none", "checking None clears the others");
  await page.click('input[name="restriction"][value="none"]');
  await next();
  check(/Pick at least one option \(or None\)/.test(await page.textContent("#onboard-root")), "nothing checked → validation message");
  await page.click('input[name="restriction"][value="none"]');
  await next();
  await page.click('input[name="meals"][value="3m2s"]'); await next();
  await next();

  console.log("3) Build choice screen");
  await page.waitForSelector("#buildChoice");
  const modes = await page.$$eval('#buildChoice input[name="buildMode"]', (ns) => ns.map((n) => n.value));
  const modeText = await page.textContent("#buildChoice");
  check(modes.join(",") === "pick,ideas" && /Let's pick our meals/.test(modeText) && /Give me some ideas/.test(modeText), "two choices: Let's pick our meals / Give me some ideas");
  check(await nextDisabled(), "Next disabled until a choice is made");
  await shot("doc32-choice.png");
  await page.click("#buildChoice .mp-back");
  check(!(await page.$("#buildChoice")) && (await page.$('input[name="planDay"]')) !== null, "Back returns to the last questionnaire step");
  await next();
  await page.waitForSelector("#buildChoice");
  await page.click('input[name="buildMode"][value="pick"]');
  check(!(await nextDisabled()), "choosing enables Next");
  await next();

  console.log("4) Pick path: slot-by-slot templates + ingredients");
  await page.waitForSelector("#pickTemplateStep");
  // doc34: 6 meal templates, Sweet group first on Meal 1.
  check((await templates()).join(",") === "smoothie,yogurt_bowl,oatmeal,lunch_box,salad_jar,bowl", "meal 1 offers the 6 doc34 templates, sweet first");
  check(await nextDisabled(), "template Next disabled until one is chosen");
  check(/Meal 1/.test(await page.textContent("#pickTemplateStep .step-label")), "step label names the slot (Meal 1)");
  await shot("doc32-template.png");
  await chooseTemplate("bowl");
  let s = await ingState();
  check(s.step === "protein" && s.type === "radio" && s.min === 1 && s.max === 1, "bowl step 1: pick exactly 1 protein (radios)");
  check(await nextDisabled(), "ingredient Next disabled until valid");
  const protein = s.values.includes("chicken") ? "chicken" : s.values[0];
  await tick(protein); check(!(await nextDisabled()), "protein chosen → Next enabled");
  await next();
  s = await ingState(); check(s.step === "carb" && s.type === "radio", "bowl step 2: 1 carb");
  const carb = (await pickStep())[0]; await next();
  s = await ingState(); check(s.step === "veg" && s.type === "radio", "bowl step 3: 1 vegetable");
  const veg = (await pickStep())[0]; await next();
  s = await ingState();
  check(s.step === "fat" && s.type === "checkbox" && s.min === 1 && s.max === 2 && s.values.length === 4, "bowl step 4: 1–2 fats of 4 (doc34: + cottage cheese)");
  await tick("evoo"); await tick("avocado");
  s = await ingState();
  check(s.disabled.length === 2 && !s.disabled.some((d) => s.checked.includes(d)) && /\(max\)/.test(s.count), "2 fats picked → the rest are disabled (max 2): " + s.count.trim());
  check(/Chicken|Lean|Salmon|Cod|Shrimp|egg/i.test(await page.textContent("#pickIngredientStep .mp-pick-sofar")), "'so far' line shows earlier picks");
  await shot("doc32-ingredients-bowl.png");
  await next();
  await next(); // doc34: optional Flavor step

  await page.waitForSelector("#pickTemplateStep");
  check((await templates()).join(",") === "nut,greek,cottage,hb_egg", "snack offers nuts, Greek yogurt, cottage cheese, hard-boiled eggs");
  await chooseTemplate("nut");
  s = await ingState(); check(s.step === "nut" && s.type === "radio", "nuts: pick 1");
  const nut = (await pickStep(["almonds_oz"]))[0]; await next();

  await page.waitForSelector("#pickTemplateStep");
  check(/Meal 2/.test(await page.textContent("#pickTemplateStep .step-label")), "moves on to Meal 2");
  await chooseTemplate("smoothie");
  s = await ingState();
  check(s.step === "carbs" && s.type === "checkbox" && s.max === 4 && /protein powder is always included/i.test(s.note), "smoothie: no protein step (powder automatic), carbs 1–4");
  for (const v of s.values.slice(0, 4)) await tick(v);
  s = await ingState();
  check(s.checked.length === 4 && s.disabled.length === s.values.length - 4, "4 carbs picked → the rest disabled");
  await shot("doc32-ingredients-smoothie.png");
  const smoothiePicked = s.checked.slice();
  await page.click("#onboard-root .mp-back");
  await page.waitForSelector("#pickTemplateStep");
  check(await page.isChecked('#pickTemplateStep input[name="pickTemplate"][value="smoothie"]'), "Back → template step keeps Smoothie selected");
  await next();
  s = await ingState();
  check(s.checked.join(",") === smoothiePicked.join(","), "…and returning keeps the 4 carbs picked");
  for (const v of smoothiePicked.slice(2)) await tick(v);
  s = await ingState(); check(s.checked.length === 2 && !s.disabled.length, "unchecking re-enables options");
  const smoothieCarbs = s.checked.slice();
  await next();
  // doc33: a milk step sits between carbs and fats.
  s = await ingState(); check(s.step === "milk" && s.type === "radio", "smoothie milk step (doc33)");
  await pickStep(); await next();
  s = await ingState(); check(s.step === "fats" && s.max === 2, "smoothie fats 1–2");
  await tick("chia_tsp"); await next();
  await next(); // doc34: Flavor step

  await page.waitForSelector("#pickTemplateStep");
  await chooseTemplate("greek");
  s = await ingState(); check(s.step === "fruit" && s.min === 1 && s.max === 2, "yogurt: 1–2 fruits (doc33)");
  await pickStep(); await next();
  s = await ingState();
  check(s.step === "sweet" && s.min === 0 && !(await nextDisabled()), "sweetener optional (Next enabled with none)");
  await next();
  await page.waitForSelector("#pickTemplateStep");
  await chooseTemplate("oatmeal");
  s = await ingState();
  check(s.checked.includes("oats_cup") && s.disabled.includes("oats_cup"), "oatmeal: oats are the locked base");
  check(!(await nextDisabled()), "oats alone is valid");
  await tick("banana"); await next();
  s = await ingState(); check(s.step === "fats", "oatmeal fats step");
  await tick("walnuts_tsp"); await next();
  s = await ingState(); check(s.step === "milk", "oatmeal milk step after fats (doc33)");
  await pickStep(); await next();
  s = await ingState(); check(s.step === "flavor" && s.min === 0, "doc34: optional Flavor step after the oatmeal milk");
  check((await ingState()).next.trim() === "See my plan", "last step's button says 'See my plan'");
  await next();
  await page.waitForSelector("#saveClose");

  await page.waitForSelector("#saveClose");

  console.log("5) Finished plan uses the picks");
  const titles = await page.$$eval(".mp-slots > .mp-card .mp-card-head strong", (ns) => ns.map((n) => n.textContent.trim()));
  check(titles.length === 5, "5 cards");
  check(/bowl/i.test(titles[0]) && /Almond/i.test(titles[1]) && /smoothie/i.test(titles[2]) && /Greek/i.test(titles[3]) && /oatmeal/i.test(titles[4]),
    "cards follow the picked templates: " + titles.map((t) => t.replace(/^.*- /, "")).join(" | "));
  await shot("doc32-plan.png", null, true);

  console.log("6) Suggested supplements");
  const order = await page.evaluate(() => {
    const r = document.querySelector(".mp-result");
    const hs = [...r.querySelectorAll("h2")];
    const sup = hs.find((h) => /Suggested supplements/i.test(h.textContent));
    const nut = hs.find((h) => /Nutrition overview/i.test(h.textContent));
    const slots = r.querySelector(".mp-slots");
    const card = r.querySelector(".mp-supps");
    const before = (a, b) => !!(a && b && (a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING));
    return { ok: before(slots, sup) && before(sup, card) && before(card, nut), has: !!sup && !!card };
  });
  check(order.has && order.ok, "SUGGESTED SUPPLEMENTS sits between Meals & snacks and Nutrition overview");
  const supp = await page.$$eval(".mp-supps li.mp-supp", (ls) => ls.map((l) => l.dataset.supp));
  check(supp.includes("vitamin_d") && supp.includes("creatine") && (supp.includes("fish_oil") || supp.includes("omega3")), "items: " + supp.join(", "));
  check(await page.$$eval(".mp-supps li.mp-supp", (ls) => ls.every((l) => l.querySelector("strong") && l.querySelector(".mp-supp-why").textContent.trim() && /Typical dose/.test(l.textContent))),
    "each item has a name, a why, and a typical dose");
  check(/Not medical advice/.test(await page.textContent(".mp-supps .mp-supp-disclaimer")), "not-medical-advice disclaimer");
  check(!(await page.$(".mp-supps a")), "no brands/links");
  await shot("doc32-supplements.png", ".mp-supps");

  console.log("7) Reroll still works on a picked plan");
  const t0 = titles[0];
  let t1 = t0;
  for (let k = 0; k < 8 && t1 === t0; k++) {
    await page.click('.mp-reroll-slot[data-slot="0"]');
    await page.waitForSelector("#saveClose");
    t1 = await page.$eval('.mp-slots > .mp-card[data-slot-index="0"] .mp-card-head strong', (n) => n.textContent.trim());
  }
  check(t1 !== t0, "reroll changed meal 1 (" + t0.replace(/^.*- /, "") + " → " + t1.replace(/^.*- /, "") + ")");
  check((await page.$(".mp-supps")) !== null, "supplements still shown after reroll");
  await page.click("#saveClose");
  await page.waitForSelector("#screen-home .macro-pie");
  let st = await getState();
  const keysOf = (sl) => ((sl.suggestion && sl.suggestion.ingredients) || []).map((i) => i._key);
  check(st.plan && st.plan.builtBy === "pick" && st.plan.schedule.length === 5, "saved plan is the picked plan");
  const s1 = keysOf(st.plan.schedule[2]);
  check(s1.some((k) => /^chia_/.test(k)) && s1.includes("protein_scoop"), "smoothie keeps picked chia + protein powder");
  check(keysOf(st.plan.schedule[4]).some((k) => /^walnuts_/.test(k)) && keysOf(st.plan.schedule[4]).includes("oats_cup"), "oatmeal keeps oats + walnuts");
  check(keysOf(st.plan.schedule[1]).includes(nut), "snack 1 is the picked nut");
  check(Array.isArray(st.answers.restrictions) && st.answers.restrictions.length === 0, "profile saved restrictions = [] (None)");

  console.log("8) 'Give me some ideas' keeps the old behavior");
  const ideas = await page.evaluate(() => {
    const M = window.MealPlanOnboarding;
    const a = { budget: 600, cadence: "weekly", calorieMode: "known", calories: 2400, weightGoal: "maintain", mealOption: "3m2s", meals: 3, snacks: 2, daysPerWeek: 6, selectedDays: ["mon", "tue", "wed", "thu", "fri", "sat"] };
    const p1 = M.buildPlan(a, { variant: 5 });
    const p2 = M.buildPlan(Object.assign({}, a, { restrictions: [] }), { variant: 5 });
    return JSON.stringify(p1.schedule) === JSON.stringify(p2.schedule) && !p1.builtBy;
  });
  check(ideas, "no restrictions → generated plan identical to before");

  console.log("9) Supplement logic (fish oil soft/skip, algae omega-3, vegan D/B12, iron)");
  const sup = await page.evaluate(() => {
    const M = window.MealPlanOnboarding;
    const a = { budget: 900, cadence: "weekly", calorieMode: "known", calories: 2400, weightGoal: "maintain", mealOption: "3m2s", meals: 3, snacks: 2, daysPerWeek: 6, selectedDays: ["mon", "tue", "wed", "thu", "fri", "sat"] };
    const ids = (p, ans) => M.supplementsForPlan(p, ans || a).items;
    let salmon = null, none = null;
    for (let v = 0; v < 400 && (!salmon || !none); v++) {
      const p = M.buildPlan(a, { variant: v });
      const keys = p.schedule.flatMap((sl) => sl.suggestion.ingredients.map((i) => i._key));
      if (!salmon && keys.includes("salmon_oz")) salmon = p;
      if (!none && !keys.some((k) => k === "salmon_oz" || k === "cod_oz")) none = p;
    }
    const out = {};
    if (salmon) { const it = ids(salmon).find((x) => x.id === "fish_oil"); out.salmon = it && it.soft && it.tag === "Optional"; }
    if (none) { const it = ids(none).find((x) => x.id === "fish_oil"); out.none = it && !it.soft && it.tag === "Low in your plan"; }
    const pv = M.buildPlan(Object.assign({}, a, { restrictions: ["vegan"] }), { variant: 3 });
    const iv = ids(pv);
    out.vegan = iv.some((x) => x.id === "omega3" && /Algae/.test(x.name)) && !iv.some((x) => x.id === "fish_oil") &&
      iv.some((x) => x.id === "b12") && /vegan/i.test(iv.find((x) => x.id === "vitamin_d").name) && iv.some((x) => x.id === "iron");
    const pf = M.buildPlan(Object.assign({}, a, { restrictions: ["fish_free"] }), { variant: 3 });
    const iff = ids(pf);
    out.fishFree = iff.some((x) => x.id === "omega3") && !iff.some((x) => x.id === "fish_oil" || x.id === "b12") && iff.find((x) => x.id === "vitamin_d").name === "Vitamin D3";
    const pl = M.buildPlan(Object.assign({}, a, { weightGoal: "lose" }), { variant: 3 });
    out.lose = ids(pl, Object.assign({}, a, { weightGoal: "lose" })).some((x) => x.id === "iron" && x.conditional);
    return out;
  });
  check(sup.salmon === true, "salmon in the plan → fish oil softened to 'Optional'");
  check(sup.none === true, "no fish → fish oil 'Low in your plan'");
  check(sup.vegan === true, "vegan → algae omega-3 (no fish oil), vegan D3/D2, B12, iron note");
  check(sup.fishFree === true, "fish/shellfish-free → algae omega-3, regular D3, no B12");
  check(sup.lose === true, "cut → conditional iron note");

  console.log("10) Restrictions: generation, rerolls, top-ups, pick options");
  const gen = await page.evaluate(() => {
    const M = window.MealPlanOnboarding;
    const sets = [["dairy_free"], ["gluten_free"], ["egg_free"], ["nut_free"], ["fish_free"], ["vegetarian"], ["vegan"], ["pork_free"],
      ["vegan", "nut_free"], ["vegan", "nut_free", "gluten_free"], ["dairy_free", "egg_free", "nut_free", "fish_free"], ["vegetarian", "egg_free", "nut_free"]];
    const opts = ["3m2s", "3m", "2m1s", "4m", "3m1s", "2m2s"].filter((o) => M.MEAL_OPTIONS[o]);
    let bad = [], n = 0, empty = 0;
    const flagsOK = { plantPowder: true, noAlmondMilkNutFree: true, veganNoHoney: true };
    for (const r of sets) {
      const flags = M.restrictionFlags(r);
      for (const b of [150, 450, 900]) for (const mo of opts) for (const cal of [1500, 2600, 3600]) for (const v of [0, 7]) {
        const a = { budget: b, cadence: "weekly", calorieMode: "known", calories: cal, weightGoal: "gain", mealOption: mo, meals: M.MEAL_OPTIONS[mo].meals, snacks: M.MEAL_OPTIONS[mo].snacks, daysPerWeek: 6, selectedDays: ["mon", "tue", "wed", "thu", "fri", "sat"], restrictions: r };
        const plans = [M.buildPlan(a, { variant: v })];
        plans.push(M.rerollSlot(plans[0], Object.assign({}, a), 0, v + 1));
        plans.push(M.rerollDay(Object.assign({}, a), plans[0], v + 2));
        for (const p of plans) {
          n++;
          if (!p.schedule.every((sl) => sl.suggestion && sl.suggestion.ingredients.length)) empty++;
          const keys = p.schedule.flatMap((sl) => sl.suggestion.ingredients.map((i) => i._key));
          keys.forEach((k) => { if (!M.foodAllowed(k, flags)) bad.push(r.join("+") + ":" + k); });
          if (flags.dairy && keys.includes("protein_scoop")) flagsOK.plantPowder = false;
          if (flags.nut && keys.includes("almond_milk_oz")) flagsOK.noAlmondMilkNutFree = false;
          if (flags.vegan && keys.includes("honey_tsp")) flagsOK.veganNoHoney = false;
        }
      }
    }
    const dairyPlan = M.buildPlan({ budget: 600, cadence: "weekly", calorieMode: "known", calories: 2400, weightGoal: "maintain", mealOption: "3m2s", meals: 3, snacks: 2, daysPerWeek: 6, selectedDays: ["mon", "tue", "wed", "thu", "fri", "sat"], restrictions: ["dairy_free"] }, { variant: 1 });
    const allKeys = [];
    for (let v = 0; v < 30; v++) {
      const p = M.buildPlan({ budget: 600, cadence: "weekly", calorieMode: "known", calories: 2400, weightGoal: "maintain", mealOption: "3m2s", meals: 3, snacks: 2, daysPerWeek: 6, selectedDays: ["mon", "tue", "wed", "thu", "fri", "sat"], restrictions: ["dairy_free"] }, { variant: v });
      p.schedule.forEach((sl) => sl.suggestion.ingredients.forEach((i) => allKeys.push(i._key)));
    }
    return { bad: bad.slice(0, 5), badCount: bad.length, n, empty, flagsOK, plantSeen: allKeys.includes("plant_protein_scoop"), dairyPlanOk: !!dairyPlan };
  });
  check(gen.badCount === 0, "no restricted food in " + gen.n + " generated/rerolled plans across 12 restriction sets" + (gen.badCount ? " — " + gen.bad.join(", ") : ""));
  check(gen.empty === 0, "every slot still gets a meal (no empty slots)");
  check(gen.flagsOK.plantPowder && gen.plantSeen, "dairy-free/vegan → plant protein powder, never whey");
  check(gen.flagsOK.noAlmondMilkNutFree, "nut-free → never almond milk");
  check(gen.flagsOK.veganNoHoney, "vegan → no honey");
  const po = await page.evaluate(() => {
    const M = window.MealPlanOnboarding;
    const vals = (st) => st.options.map((o) => o.value);
    const v = { budget: 600, restrictions: ["vegan"] };
    const nf = { budget: 600, restrictions: ["nut_free"] };
    const vg = M.pickStepsFor("bowl", {}, v);
    const sm = M.pickStepsFor("smoothie", {}, nf);
    const oat = M.pickStepsFor("oatmeal", {}, { budget: 600, restrictions: ["vegan"] });
    const jar = M.pickStepsFor("salad_jar", {}, v);
    return {
      veganMeals: M.pickTemplatesFor("meal", v).map((t) => t.id).join(","),
      veganSnacks: M.pickTemplatesFor("snack", v).map((t) => t.id).join(","),
      dairySnacks: M.pickTemplatesFor("snack", { budget: 600, restrictions: ["dairy_free"] }).map((t) => t.id).join(","),
      eggSnacks: M.pickTemplatesFor("snack", { budget: 600, restrictions: ["egg_free"] }).map((t) => t.id).join(","),
      veganProteins: vals(vg[0]).join(","), veganBowlFats: vals(vg[3]).join(","),
      veganJarFats: vals(jar[4]).join(","), veganOatCarbs: vals(oat[0]).join(","),
      nutSeeds: vals(M.pickStepsFor("nut", {}, nf)[0]).join(","),
      nutSmoothieFats: vals(sm.find((x) => x.id === "fats")).join(","), nutSmoothieMilk: vals(sm.find((x) => x.id === "milk")).join(","),
      veganNote: M.pickStepsFor("smoothie", {}, v)[0].note,
      fishFreeProteins: vals(M.pickStepsFor("bowl", {}, { budget: 900, restrictions: ["fish_free"] })[0]).join(","),
    };
  });
  check(po.veganMeals === "smoothie,oatmeal,salad_jar,bowl" && po.veganSnacks === "nut", "vegan: the 4 plant-compatible meal templates, sweet first (doc34; tofu), snacks = nuts only (" + po.veganSnacks + ")");
  check(po.dairySnacks === "nut,hb_egg" && po.eggSnacks === "nut,greek,cottage", "impossible snack templates hidden (dairy-free: " + po.dairySnacks + "; egg-free: " + po.eggSnacks + ")");
  check(po.veganProteins === "tofu", "vegan bowl proteins = tofu only (meat/fish/eggs hidden)");
  check(!/hbe/.test(po.veganBowlFats) && !/hbe|feta|parmesan/.test(po.veganJarFats), "vegan: egg/cheese fats hidden (" + po.veganJarFats + ")");
  check(!/honey/.test(po.veganOatCarbs) && /maple/.test(po.veganOatCarbs), "vegan oatmeal: honey hidden, maple offered");
  check(po.nutSeeds === "pumpkin_seeds_oz", "nut-free nut snack → pumpkin seeds only");
  check(!/walnuts|pb_tsp/.test(po.nutSmoothieFats) && !/almond/.test(po.nutSmoothieMilk) && /coconut/.test(po.nutSmoothieMilk), "nut-free smoothie: no walnuts/peanut butter; no almond milk (doc33: coconut/cow's)");
  check(/plant protein powder/.test(po.veganNote), "vegan smoothie note says plant protein powder");
  check(!/salmon|cod|shrimp/.test(po.fishFreeProteins) && /chicken/.test(po.fishFreeProteins), "fish/shellfish-free hides salmon, cod, shrimp");

  console.log("11) Vegan + nut-free user through the UI");
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await nav("profile");
  await questionnaire({ budget: 600, calories: 2200, restrictions: ["vegan", "nut_free"] });
  await page.click('input[name="buildMode"][value="pick"]'); await next();
  await page.waitForSelector("#pickTemplateStep");
  check((await templates()).join(",") === "smoothie,oatmeal,salad_jar,bowl", "vegan meal templates shown (doc34: no yogurt bowl / lunch box; sweet first)");
  await chooseTemplate("bowl");
  s = await ingState();
  check(s.values.join(",") === "tofu" && s.checked.join(",") === "tofu" && !(await nextDisabled()), "vegan bowl: tofu is the only protein (preselected)");
  await next(); await pickStep(); await next(); await pickStep(); await next();
  s = await ingState();
  check(s.values.join(",") === "evoo,avocado", "vegan bowl fats: olive oil + avocado only");
  await tick("avocado"); await next();
  await next(); // doc34: Flavor step
  await page.waitForSelector("#pickTemplateStep");
  check((await templates()).join(",") === "nut", "snack: only the seeds template remains");
  check(/Nuts/.test(await page.textContent("#pickTemplateStep")), "template listed");
  await chooseTemplate("nut");
  s = await ingState();
  check(s.values.join(",") === "pumpkin_seeds_oz", "nut snack → pumpkin seeds");
  await next();
  await chooseTemplate("smoothie");
  s = await ingState();
  check(/plant protein powder/.test(s.note), "smoothie note: plant protein");
  await pickStep(); await next();
  s = await ingState();
  check(s.step === "milk" && s.values.join(",") === "coconut_milk_oz", "vegan + nut-free smoothie milk: coconut only (doc33)");
  await pickStep(); await next();
  s = await ingState();
  check(!s.values.some((v) => /walnuts|pb_tsp/.test(v)), "no nut fats offered");
  await pickStep(); await next();
  await next(); // doc34: Flavor step
  await chooseTemplate("nut"); await next();
  await chooseTemplate("oatmeal"); await next(); await pickStep(); await next(); await pickStep(); await next();
  await next(); // doc34: Flavor step
  await page.waitForSelector("#saveClose");
  const vsupp = await page.$$eval(".mp-supps li.mp-supp", (ls) => ls.map((l) => l.dataset.supp + ":" + l.querySelector("strong").textContent));
  check(vsupp.some((x) => /^omega3:Algae/.test(x)) && vsupp.some((x) => /^b12/.test(x)) && vsupp.some((x) => /^vitamin_d:.*vegan/.test(x)) && !vsupp.some((x) => /^fish_oil/.test(x)),
    "vegan supplements: " + vsupp.map((x) => x.split(":")[0]).join(", "));
  await shot("doc32-plan-vegan.png", null, true);
  await shot("doc32-supplements-vegan.png", ".mp-supps");
  // Reroll every slot once; still nothing restricted.
  for (let i = 0; i < 5; i++) { await page.click(`.mp-reroll-slot[data-slot="${i}"]`); await page.waitForSelector("#saveClose"); }
  await page.click("#reroll"); await page.waitForSelector("#saveClose");
  await page.click("#saveClose");
  await page.waitForSelector("#screen-home .macro-pie");
  st = await getState();
  const leak = await page.evaluate((plan) => {
    const M = window.MealPlanOnboarding;
    const f = M.restrictionFlags(plan.restrictions);
    const keys = plan.schedule.flatMap((sl) => sl.suggestion.ingredients.map((i) => i._key));
    return { bad: keys.filter((k) => !M.foodAllowed(k, f)), plant: keys.includes("plant_protein_scoop"), almond: keys.includes("almond_milk_oz") };
  }, st.plan);
  check(st.plan.restrictions.join(",") === "nut_free,vegan" && st.answers.restrictions.join(",") === "nut_free,vegan", "plan + profile store the restrictions");
  check(!leak.bad.length && !leak.almond, "after rerolls the saved plan has no restricted food / almond milk" + (leak.bad.length ? " (" + leak.bad.join(",") + ")" : ""));
  const grocery = JSON.stringify(st.groceryList || []);
  check(!/Almond milk|Whey|Walnut|Peanut|Honey|Egg|Greek|Cottage|Chicken|Beef|Salmon/i.test(grocery), "grocery list has no restricted items");

  console.log("12) Profile: edit restrictions → future plans only");
  await nav("profile");
  const pfChecked = await page.$$eval('input[name="pf-restriction"]:checked', (ns) => ns.map((n) => n.value));
  check(pfChecked.join(",") === "nut_free,vegan", "Profile shows saved restrictions (" + pfChecked.join(",") + ")");
  await shot("doc32-profile-restrictions.png", '[data-group="restrictions"]');
  const frozen = (x) => JSON.stringify({ planBlocks: x.planBlocks, plan: x.plan, groceryList: x.groceryList });
  const before = frozen(st);
  await page.click('input[name="pf-restriction"][value="none"]');
  check((await page.$$eval('input[name="pf-restriction"]:checked', (ns) => ns.map((n) => n.value))).join(",") === "none", "Profile: None clears the others");
  await page.click('input[name="pf-restriction"][value="fish_free"]');
  check(!(await page.isChecked('input[name="pf-restriction"][value="none"]')), "Profile: picking one unchecks None");
  await page.click("#saveProfile");
  await page.waitForSelector("#ppNotice");
  await page.click("#ppNoticeOk");
  st = await getState();
  check(st.answers.restrictions.join(",") === "fish_free", "profile saved with fish/shellfish-free");
  check(frozen(st) === before, "existing plans + grocery list unchanged");
  await nav("home");
  await page.click("#updateMealPlan");
  await page.waitForSelector("#buildChoice");
  check(await nextDisabled(), "Update meal plan shows the build choice (Next disabled)");
  await page.click('input[name="buildMode"][value="pick"]'); await next();
  await page.waitForSelector("#pickTemplateStep");
  await chooseTemplate("bowl");
  s = await ingState();
  check(s.values.join(",") === "tofu", "update on this already-scheduled week uses its vegan snapshot in the wizard (tofu only)");
  await page.click("#onboard-root .mp-back");
  await page.waitForSelector("#pickTemplateStep");
  await page.click("#pickTemplateStep .mp-back");
  await page.waitForSelector("#buildChoice");
  await page.click('input[name="buildMode"][value="ideas"]'); await next();
  await page.waitForSelector("#saveClose");
  const updRestr = await page.evaluate(() => [...document.querySelectorAll(".mp-supps li.mp-supp")].map((l) => l.dataset.supp).join(","));
  check(/b12/.test(updRestr), "updating this (already scheduled) week keeps its vegan snapshot (" + updRestr + ")");
  await page.click("#toDash");
  await page.waitForSelector("#screen-home .macro-pie");
  await page.click("#nextWeek");
  await page.waitForSelector("#pickNewMeals");
  await page.click("#pickNewMeals");
  await page.waitForSelector("#buildChoice");
  await page.click('input[name="buildMode"][value="pick"]'); await next();
  await page.waitForSelector("#pickTemplateStep");
  check((await templates()).join(",") === "smoothie,yogurt_bowl,oatmeal,lunch_box,salad_jar,bowl", "Pick new meals (next week) follows the updated profile");
  await chooseTemplate("bowl");
  s = await ingState();
  check(s.values.includes("chicken") && !s.values.some((v) => /salmon|cod|shrimp/.test(v)) && !s.values.includes("tofu"), "new week: fish hidden, meat back (" + s.values.join(",") + ")");
  // Finish quickly with defaults.
  for (let guard = 0; guard < 40 && !(await page.$("#saveClose")); guard++) {
    if (await page.$("#pickTemplateStep")) { await page.click('#pickTemplateStep input[name="pickTemplate"]'); await next(); continue; }
    await pickStep(); await next();
  }
  await page.waitForSelector("#saveClose");
  await page.click("#saveClose");
  await page.waitForSelector("#screen-home .macro-pie");
  st = await getState();
  const nb = st.planBlocks[st.planBlocks.length - 1];
  check(st.planBlocks.length === 2 && nb.plan.restrictions.join(",") === "fish_free" && nb.plan.builtBy === "pick", "new block: picked plan with fish/shellfish-free");
  check(JSON.stringify(st.planBlocks[0].plan.restrictions) === JSON.stringify(["nut_free", "vegan"]), "first block keeps vegan + nut-free");

  console.log("13) Locked (grocery-ordered) weeks stay locked");
  await page.click("#confirmGroceries");
  await page.waitForSelector("#screen-home .macro-pie");
  st = await getState();
  const covered = st.groceryCoveredWeeks[0];
  // Find the covered week on Home and check it can't be updated.
  let wkOk = false;
  for (let k = 0; k < 3 && !wkOk; k++) {
    const disabled = await page.$eval("#updateMealPlan", (b) => b.disabled);
    const note = /Meal plan updates are disabled/.test(await page.textContent("#screen-home"));
    if (disabled && note) wkOk = true;
    else if (await page.$eval("#prevWeek", (b) => b.disabled)) break;
    else await page.click("#prevWeek");
  }
  check(!!covered && wkOk, "grocery-ordered week (" + covered + "): Update meal plan disabled, so the pick wizard can't change it");
  await page.evaluate(() => { const b = document.getElementById("updateMealPlan"); b && b.click(); });
  check(!(await page.$("#buildChoice")), "clicking it anyway does nothing");

  console.log("14) Layout");
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1);
  check(!overflow, "no horizontal overflow at 390px");

  check(errors.length === 0, "no page errors" + (errors.length ? ": " + errors.join(" | ") : ""));
  await browser.close();
  srv.close();
  console.log(failures ? "\n" + failures + " FAILED" : "\nALL PASSED");
  process.exit(failures ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(1); });
