/**
 * doc31: "Prep steps" blocks start collapsed on results cards and Home meal rows;
 *    tapping the summary expands them (steps unchanged).
 * doc30: Meal Templates doc prep instructions (fresh export in docs/meal-templates.txt)
 *    applied via PREP_DOC: smoothie + oatmeal use the doc's jar method ("Portion out dry
 *    ingredients into N jars." / "Empty jar into blender…" / "Empty jar into bowl and add milk
 *    or water…") with the plan's specifics appended; jar count = servings for the prep week;
 *    dry items in the jar, perishables (milk, banana, frozen fruit, nut butter, pumpkin,
 *    honey/maple) added daily. The doc's bowl "Daily prep" line (a copy of oatmeal's) is NOT
 *    applied; bowls, salad jars and snacks stay improvised.
 * doc29: weekly + daily prep instructions for every meal and snack.
 *  - Across many generated plans (budgets, cadences, every meal structure, goals,
 *    calories, variants, 1–7 plan days) every meal/snack has non-empty "Weekly prep"
 *    and "Daily" steps; all 8 templates are covered.
 *  - Amounts match the plan: every ingredient's week total (per serving × plan days)
 *    or its per-serving amount appears in the steps; tsp/tbsp are whole numbers.
 *  - Food safety: cooked fish past 3 days / meat past 4 days → freeze + thaw the night
 *    before; avocado/banana only in the daily steps; all oven work at one temperature.
 *  - Templates with instructions in the Meal Templates doc (PREP_DOC) use them.
 *  - Results page: each card has the prep block + a prep-day checklist; rerolling a
 *    meal updates its instructions; Home meal rows show the same steps as the saved plan.
 *  - Cache-bust ?v=doc31, favicon ?v=leaf8.
 * Optional: SHOTS_DIR=/path saves screenshots. BASE_URL=https://… runs against a live site.
 * Run: node scripts/verify-prep-doc31.js
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
  const nav = (name) => page.click(`.nav-btn[data-screen="${name}"]`);
  const next = () => page.click("#onboard-root .mp-next");
  const getState = () => page.evaluate(() => JSON.parse(localStorage.getItem("purePrepState")));

  await page.goto(base);
  await page.evaluate(() => localStorage.clear());
  await page.reload();

  console.log("0) Cache-bust");
  check(await page.$eval('script[src^="onboarding.js"]', (s) => s.getAttribute("src")) === "onboarding.js?v=doc31", "onboarding.js?v=doc31");
  const favs = await page.$$eval('link[rel~="icon"], link[rel="apple-touch-icon"]', (ls) => ls.map((l) => l.getAttribute("href")));
  check(favs.length && favs.every((h) => /\?v=leaf8$/.test(h)), "favicons stay ?v=leaf8");
  check(typeof (await page.evaluate(() => typeof window.MealPlanOnboarding.prepForSlot)) === "string" &&
    await page.evaluate(() => typeof window.MealPlanOnboarding.prepForSlot === "function" && typeof window.MealPlanOnboarding.prepDayPlan === "function"), "prepForSlot / prepDayPlan exported");

  console.log("1) Every meal/snack in many plans has weekly + daily steps with matching amounts");
  const rep = await page.evaluate(() => {
    const M = window.MealPlanOnboarding;
    const ALL = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];
    const out = { plans: 0, slots: 0, types: {}, empty: [], amount: [], spoon: [], safety: [], freshDaily: [], temp: [], prepDay: [], bad: [], docWord: [], jarCount: [], jarSplit: [] };
    const push = (arr, x) => { if (arr.length < 5) arr.push(x); arr.count = (arr.count || 0) + 1; };
    for (const budget of [120, 250, 500, 900])
      for (const cadence of ["weekly", "every_other_week", "monthly"])
        for (const mo of Object.keys(M.MEAL_OPTIONS))
          for (const goal of ["lose", "maintain", "gain"])
            for (let v = 0; v < 4; v++) {
              const nDays = 1 + ((out.plans * 3 + v) % 7);
              const a = { budget, cadence, calorieMode: "known", calories: [1500, 1900, 2400, 3000][v], weightGoal: goal, mealOption: mo, selectedDays: ALL.slice(0, nDays) };
              const p = M.buildPlan(a, { variant: v + (out.plans % 5) });
              out.plans++;
              const n = M.prepDaysFor(p);
              if (n !== nDays) push(out.bad, "days " + n + " vs " + nDays);
              p.schedule.forEach((slot) => {
                out.slots++;
                const s = slot.suggestion;
                out.types[s.type] = (out.types[s.type] || 0) + 1;
                const r = M.prepForSlot(slot, { days: n });
                const all = r.weekly.concat(r.daily);
                if (!r.weekly.length || !r.daily.length || all.some((t) => !t || !String(t).trim())) push(out.empty, s.type + ":" + s.title);
                if (all.some((t) => /undefined|NaN|null|\[object/.test(t))) push(out.bad, s.title + ": " + all.join(" / "));
                const txt = all.join(" ");
                s.ingredients.forEach((i) => {
                  if (!i._key) return;
                  const tot = M.prepAmountLabel(i._key, i._qty * n), per = M.prepAmountLabel(i._key, i._qty);
                  if (!txt.includes(tot) && !txt.includes(per)) push(out.amount, s.type + ":" + i._key + " " + tot + "/" + per);
                });
                if (/(\d+\.\d+|[½¼¾⅓⅔⅛])\s*(tsp|tbsp)\b/.test(txt)) push(out.spoon, txt);
                const keys = s.ingredients.map((i) => i._key);
                if ((s.type === "bowl" || s.type === "salad_jar")) {
                  const fish = keys.some((k) => /salmon|cod|shrimp|tuna/.test(k || ""));
                  const cooked = keys.some((k) => /chicken|beef|turkey|salmon|cod|shrimp|egg$|egg_white/.test(k || ""));
                  const lim = s.type === "salad_jar" ? (fish ? 3 : 4) : (fish ? 3 : 4);
                  if (cooked && n > lim && !/freeze/i.test(txt)) push(out.safety, s.title + " n=" + n);
                }
                if (/banana|avocado/.test(keys.join(","))) {
                  if (r.weekly.some((t) => /avocado|banana/i.test(t) && !/^Uses |^For \d/.test(t))) push(out.freshDaily, s.title + ": " + r.weekly.join(" / "));
                  if (!r.daily.some((t) => /avocado|banana/i.test(t))) push(out.freshDaily, s.title + " (no daily fresh-cut step)");
                }
                const temps = (txt.match(/\d{3}°F/g) || []).filter((t) => t !== "165°F" && t !== "145°F");
                if (temps.some((t) => t !== "400°F")) push(out.temp, s.title + ": " + temps.join(","));
                if (s.type === "smoothie" || s.type === "oatmeal") {
                  out.jarSlots = (out.jarSlots || 0) + 1;
                  const jar = r.weekly[0] || "";
                  const m = jar.match(/^Portion out dry ingredients into (\d+) jars?\./);
                  if (r.source !== "doc" || !m) push(out.docWord, s.title + ": " + jar);
                  else if (Number(m[1]) !== n) push(out.jarCount, s.title + " jars=" + m[1] + " servings=" + n);
                  const d0 = r.daily.join(" ");
                  const docDaily = s.type === "smoothie"
                    ? ["Empty jar into blender and add remaining ingredients", "Blend until smooth and enjoy."]
                    : ["Empty jar into bowl and add milk or water", "Microwave for 1-2 minutes until oats are soft.", "Add toppings and enjoy"];
                  if (!docDaily.every((w) => d0.includes(w))) push(out.docWord, s.title + " daily: " + d0);
                  // Dry items (protein powder, oats, seeds, walnuts, raisins, cacao) in the jar; perishables daily.
                  s.ingredients.forEach((i) => {
                    if (!i._key) return;
                    const label = M.prepAmountLabel(i._key, i._qty);
                    const dry = /^(protein_scoop|oats_cup|chia_|hemp_|walnuts_|raisins_cup|cacao_tsp)/.test(i._key);
                    if (dry && !jar.includes(label)) push(out.jarSplit, s.title + ": " + i._key + " not in jar");
                    if (!dry && (/Each jar:|In the jar:/.test(jar) && jar.split(/Each jar:|In the jar:/)[1].includes(label + " "))) {
                      const name = i._key === "banana" ? "banana" : (i._key.match(/milk|berries|cherries|pb|pumpkin|maple|honey|spinach|mango/) || [""])[0];
                      if (name && new RegExp(name, "i").test(jar.split(/Each jar:|In the jar:/)[1])) push(out.jarSplit, s.title + ": " + i._key + " in jar");
                    }
                    if (!dry && !d0.includes(label)) push(out.jarSplit, s.title + ": " + i._key + " missing from daily");
                    if (/berries|cherries|mango/.test(i._key) && !d0.includes("(from the freezer bag)")) push(out.jarSplit, s.title + ": frozen fruit not from freezer bag");
                  });
                } else {
                  if (r.source !== "improvised") push(out.docWord, s.type + " should be improvised");
                  if (/Empty jar into bowl|oats are soft/.test(txt)) push(out.docWord, s.type + " got the oatmeal doc line");
                }
              });
              const d = M.prepDayPlan(p);
              const ovenUsed = p.schedule.some((sl) => M.prepForSlot(sl, { days: n }).tasks.some((t) => t.kind === "oven" || t.kind === "eggbake"));
              if (!d.steps.length || d.steps.some((st) => !st.text || /undefined|NaN/.test(st.text))) push(out.prepDay, "empty/bad");
              if (ovenUsed && !/Preheat/.test(d.steps[0].text)) push(out.prepDay, "oven used but step 1 is not preheat");
              if (d.days !== n) push(out.prepDay, "days mismatch");
              p.schedule.forEach((sl) => {
                if (sl.suggestion.type !== "smoothie" && sl.suggestion.type !== "oatmeal") return;
                const want = "make " + n + " " + sl.suggestion.type + " " + (n === 1 ? "jar" : "jars") + " of dry ingredients";
                if (!d.steps.some((st) => st.text.includes(want))) push(out.prepDay, "checklist missing '" + want + "'");
              });
            }
    ["empty", "amount", "spoon", "safety", "freshDaily", "temp", "prepDay", "bad", "docWord", "jarCount", "jarSplit"].forEach((k) => { out[k + "Count"] = out[k].count || 0; });
    return out;
  });
  console.log("     " + JSON.stringify({ plans: rep.plans, slots: rep.slots, types: rep.types }));
  ["empty", "amount", "spoon", "safety", "freshDaily", "temp", "prepDay", "bad", "docWord", "jarCount", "jarSplit"].forEach((k) => { if (rep[k + "Count"]) console.log("     " + k + ": " + JSON.stringify(rep[k])); });
  check(rep.plans >= 500, rep.plans + " plans / " + rep.slots + " meals+snacks generated");
  check(["bowl", "salad_jar", "smoothie", "oatmeal", "nut", "greek_yogurt", "cottage_cheese", "hb_egg_snack"].every((t) => rep.types[t] > 0), "all 8 templates covered");
  check(rep.emptyCount === 0 && rep.badCount === 0, "every meal/snack has non-empty weekly + daily steps");
  check(rep.amountCount === 0, "every ingredient amount (week total or per serving) appears in the steps");
  check(rep.spoonCount === 0, "tsp/tbsp amounts are whole numbers");
  check(rep.safetyCount === 0, "cooked meat >4 days / fish >3 days → freeze + thaw the night before");
  check(rep.freshDailyCount === 0, "avocado / banana are cut fresh in the daily steps (not weekly)");
  check(rep.tempCount === 0, "all oven steps share one temperature (400°F)");
  check(rep.prepDayCount === 0, "prep-day checklist is ordered (preheat first when the oven is used), non-empty, and lists the smoothie/oatmeal jars");
  check(rep.jarSlots > 100 && rep.docWordCount === 0, rep.jarSlots + " smoothie/oatmeal items use the doc wording (weekly + daily); bowls/jars/snacks stay improvised");
  check(rep.jarCountCount === 0, "jar count = servings for the prep week");
  check(rep.jarSplitCount === 0, "dry items in the jar; milk/banana/nut butter/pumpkin/sweetener daily; frozen fruit 'from the freezer bag'");

  console.log("2) Combined cooking (salmon + potatoes on one sheet pan)");
  const combo = await page.evaluate(() => {
    const M = window.MealPlanOnboarding;
    const slot = { name: "Meal 1", suggestion: { type: "bowl", title: "Salmon bowl", ingredients: [
      { _key: "salmon_oz", _qty: 5 }, { _key: "potato_oz", _qty: 8 }, { _key: "broccoli_cup", _qty: 1.5 }, { _key: "evoo_tsp", _qty: 2 }] } };
    const r = M.prepForSlot(slot, { days: 6 });
    return { weekly: r.weekly, daily: r.daily };
  });
  const pan = combo.weekly.find((t) => /sheet pan/.test(t)) || "";
  check(/start 48 oz potato/.test(pan) && /add 30 oz salmon/.test(pan) && /add 9 cups broccoli/.test(pan) && (pan.match(/°F/g) || []).length >= 1 && !/\b(425|350|375)°F/.test(pan),
    "one pan, one temperature: potatoes first, broccoli + salmon added so all finish together — " + pan.slice(0, 120) + "…");
  check(/12 tsp olive oil|4 tbsp olive oil/.test(pan), "oil total = 2 tsp × 6 days");
  check(combo.weekly.some((t) => /days 1–3; freeze the other 3/.test(t)), "salmon: fridge days 1–3, freeze the rest");
  check(combo.daily.some((t) => /Microwave/.test(t)), "daily = reheat");

  console.log("3) Meal Templates doc instructions are used when listed (PREP_DOC)");
  const doc = await page.evaluate(() => {
    const M = window.MealPlanOnboarding;
    const types = Object.keys(M.PREP_DOC);
    const slot = { name: "Snack 1", suggestion: { type: "nut", title: "Almonds", ingredients: [{ _key: "almonds_oz", _qty: 1.5 }] } };
    const before = M.prepForSlot(slot, { days: 5 });
    M.PREP_DOC.nut = { weekly: ["DOC: portion into {n} bags."], daily: ["DOC: grab a bag."] };
    const withDoc = M.prepForSlot(slot, { days: 5 });
    delete M.PREP_DOC.nut;
    const after = M.prepForSlot(slot, { days: 5 });
    return { types, before, withDoc, after };
  });
  console.log("     templates with doc instructions: " + (doc.types.length ? doc.types.join(", ") : "none (doc copy has none; all improvised)"));
  check(JSON.stringify(doc.types.sort()) === JSON.stringify(["oatmeal", "smoothie"]), "PREP_DOC has the doc's smoothie + oatmeal entries only (bowl's copy-pasted oatmeal line not applied)");
  check(doc.before.source === "improvised", "source flag reflects PREP_DOC");
  const docTxt = fs.readFileSync(path.join(ROOT, "docs", "meal-templates.txt"), "utf8");
  check(/Weekly prep: Portion out dry ingredients into plan_days_count jars\./.test(docTxt) && /Empty jar into blender and add remaining ingredients/.test(docTxt), "docs/meal-templates.txt is the fresh export with prep lines");
  const docSrc = await page.evaluate(() => window.MealPlanOnboarding.PREP_DOC);
  check(docTxt.includes(docSrc.smoothie.weekly[0].replace("{n}", "plan_days_count")) && docTxt.includes(docSrc.smoothie.daily[0]) &&
    docTxt.includes(docSrc.oatmeal.daily[0]), "PREP_DOC text matches the doc verbatim");
  check(doc.withDoc.source === "doc" && doc.withDoc.weekly.includes("DOC: portion into 5 bags.") && doc.withDoc.daily[0] === "DOC: grab a bag." &&
    /7½ oz almonds/.test(doc.withDoc.weekly[0]), "doc steps used (with {n} filled) + plan amounts line");
  check(doc.after.source === "improvised" && doc.after.weekly.join() === doc.before.weekly.join(), "removing the doc entry restores improvised steps");

  console.log("4) Results page: prep blocks, prep-day checklist, reroll updates instructions");
  await nav("profile");
  await page.fill("#budget", "600"); await next();
  await page.click('input[name="cadence"][value="weekly"]'); await next();
  await page.click('input[name="calorieMode"][value="known"]'); await next();
  await page.fill("#calories", "2400"); await next();
  await page.click('input[name="weightGoal"][value="maintain"]'); await next();
  await page.click('input[name="meals"][value="3m2s"]'); await next();
  await next();
  await page.waitForSelector("#saveClose");
  const cards = await page.$$eval(".mp-slots > .mp-card", (cs) => cs.map((c) => ({
    title: c.querySelector(".mp-card-head strong").textContent,
    prep: !!c.querySelector("details.mp-prep"),
    open: !!c.querySelector("details.mp-prep[open]"),
    weekly: [...c.querySelectorAll(".mp-prep-weekly li")].map((l) => l.textContent.trim()),
    daily: [...c.querySelectorAll(".mp-prep-daily li")].map((l) => l.textContent.trim()),
  })));
  check(cards.length === 5, "5 cards (3 meals + 2 snacks)");
  check(cards.every((c) => c.prep && c.weekly.length && c.daily.length && c.weekly.every(Boolean) && c.daily.every(Boolean)), "every results card has Weekly prep + Daily steps");
  check(cards.every((c) => !c.open), "every results card's Prep steps block starts collapsed");
  check(!(await page.isVisible(".mp-slots > .mp-card:first-child .mp-prep-weekly")), "collapsed: weekly steps hidden until tapped");
  await page.tap(".mp-slots > .mp-card:first-child details.mp-prep > summary");
  check(await page.$eval(".mp-slots > .mp-card:first-child details.mp-prep", (d) => d.open) &&
    await page.isVisible(".mp-slots > .mp-card:first-child .mp-prep-weekly li") && await page.isVisible(".mp-slots > .mp-card:first-child .mp-prep-daily li"),
    "tapping 'Prep steps' expands the Weekly prep + Daily steps");
  await page.tap(".mp-slots > .mp-card:first-child details.mp-prep > summary");
  check(!(await page.$eval(".mp-slots > .mp-card:first-child details.mp-prep", (d) => d.open)), "tapping again collapses it");
  const pd = await page.$$eval(".mp-result details.mp-prepday .mp-prepday-list li", (ls) => ls.map((l) => l.textContent.trim()));
  const bf = cards.find((c) => /smoothie|oatmeal/i.test(c.title));
  check(!!bf && /^Portion out dry ingredients into 6 jars\./.test(bf.weekly[0]) && /^Empty jar into (blender|bowl)/.test(bf.daily[0]),
    "results card (" + (bf ? bf.title.replace(/^.*- /, "") : "none") + ") shows the doc jar steps for 6 servings");
  check(pd.length >= 2 && (await page.$(".mp-result details.mp-prepday + .mp-slots")) !== null, "prep-day checklist (" + pd.length + " steps) sits above the meal cards");
  const overflow = await page.evaluate(() => [...document.querySelectorAll(".mp-prep, .mp-prepday")].some((e) => e.getBoundingClientRect().right > window.innerWidth + 1));
  check(!overflow, "prep blocks fit the 390px viewport");
  if (shots) await page.screenshot({ path: path.join(shots, "doc31-results-local.png"), fullPage: true });

  // Reroll meal 1 until the title changes; instructions must change with it.
  let idx = 0, before = cards[0], afterCard = before;
  for (let k = 0; k < 8 && afterCard.title === before.title; k++) {
    await page.click(`.mp-reroll-slot[data-slot="${idx}"]`);
    await page.waitForSelector("#saveClose");
    afterCard = await page.$eval(`.mp-slots > .mp-card[data-slot-index="${idx}"]`, (c) => ({
      title: c.querySelector(".mp-card-head strong").textContent,
      weekly: [...c.querySelectorAll(".mp-prep-weekly li")].map((l) => l.textContent.trim()),
      daily: [...c.querySelectorAll(".mp-prep-daily li")].map((l) => l.textContent.trim()),
    }));
  }
  check(afterCard.title !== before.title, "reroll changed meal 1 (" + before.title.replace(/^.*- /, "") + " → " + afterCard.title.replace(/^.*- /, "") + ")");
  check(afterCard.weekly.join("|") !== before.weekly.join("|"), "rerolled meal's weekly steps changed");
  const resultsTexts = await page.$$eval(".mp-slots > .mp-card", (cs) => cs.map((c) => [...c.querySelectorAll(".mp-prep li")].map((l) => l.textContent.trim()).join("|")));
  await page.click("#saveClose");
  await page.waitForSelector("#screen-home .macro-pie");
  const st = await getState();
  const expected = await page.evaluate((plan) => {
    const M = window.MealPlanOnboarding;
    const n = M.prepDaysFor(plan);
    return { slots: plan.schedule.map((sl) => { const r = M.prepForSlot(sl, { days: n }); return r.weekly.concat(r.daily).join("|"); }), day: M.prepDayPlan(plan).steps.length };
  }, st.plan);
  check(JSON.stringify(expected.slots) === JSON.stringify(resultsTexts), "results-page steps (after reroll) = steps computed from the saved plan");

  console.log("5) Home meal rows + prep-day checklist");
  const home = await page.evaluate(() => {
    document.querySelectorAll("#screen-home details.meal-row").forEach((d) => { d.open = true; });
    const prepOpen = [...document.querySelectorAll("#screen-home details.meal-row details.mp-prep")].map((d) => d.open);
    return {
      rows: [...document.querySelectorAll("#screen-home details.meal-row")].map((r) => [...r.querySelectorAll(".mp-prep li")].map((l) => l.textContent.trim()).join("|")),
      weeklyOk: [...document.querySelectorAll("#screen-home details.meal-row")].every((r) => r.querySelectorAll(".mp-prep-weekly li").length && r.querySelectorAll(".mp-prep-daily li").length),
      prepDay: document.querySelectorAll("#screen-home details.mp-prepday .mp-prepday-list li").length,
      prepOpen,
    };
  });
  check(home.rows.length === 5 && home.weeklyOk, "every Home meal row has Weekly prep + Daily");
  check(home.prepOpen.length === 5 && home.prepOpen.every((o) => !o), "Home Prep steps blocks start collapsed (even with the meal row expanded)");
  await page.tap("#screen-home details.meal-row:first-of-type details.mp-prep > summary");
  check(await page.isVisible("#screen-home details.meal-row:first-of-type .mp-prep-weekly li"), "tapping Prep steps on Home expands it");
  check(JSON.stringify(home.rows) === JSON.stringify(expected.slots), "Home steps match the saved plan");
  check(home.prepDay === expected.day && home.prepDay > 0, "Home prep-day checklist (" + home.prepDay + " steps)");
  await page.click("#screen-home details.mp-prepday summary");
  await page.click("#screen-home .mp-prepday-list li:first-child label");
  check(await page.$eval("#screen-home .mp-prepday-list li:first-child input", (i) => i.checked), "checklist items can be ticked off");
  if (shots) await page.screenshot({ path: path.join(shots, "doc31-home-local.png"), fullPage: true });

  console.log("6) Existing flows still intact");
  const st2 = await getState();
  check(st2.plan && st2.plan.grocery && st2.plan.grocery.items.length > 0, "plan + grocery list saved");
  const names = st2.plan.grocery.items.map((i) => i.name.toLowerCase());
  check(new Set(names).size === names.length, "grocery list still de-duplicated");
  await nav("inventory");
  check(!!(await page.$("#haveSomeBtn")), "Inventory 'I already have some of these items' still present");
  await nav("home");
  check(errors.length === 0, "no page errors" + (errors.length ? ": " + errors.join(" | ") : ""));

  await browser.close();
  srv.close();
  console.log(failures ? "\n" + failures + " FAILED" : "\nALL PASSED");
  process.exit(failures ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(1); });
