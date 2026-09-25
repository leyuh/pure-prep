/**
 * doc24: Profile replaces the "Plan" tab; onboarding questionnaire runs once.
 * Headless browser test against the real index.html + onboarding.js.
 *
 * Covers:
 *  - First-time flow: Profile tab opens the questionnaire; complete it and schedule a plan
 *  - "Profile" label exists, no "Plan" tab, no dashboard entry point back into the questionnaire
 *  - Returning user: going to onboarding redirects to the dashboard
 *  - Profile draft: edits + leave (nav tab / reload) without Save => nothing persisted
 *  - Save => notice text; existing planBlocks / grocery / coverage / inventory unchanged
 *  - New blocks (Repeat, Pick new) use the updated profile; old week display unchanged
 *  - Save with no changes => "No changes to save"; help-path conditional fields + validation
 *  - Migration: legacy blocks without snapshots get one on load
 *
 * Run: node scripts/verify-profile-doc24.js
 * Needs playwright-core (global install OK) and Chrome/Chromium
 * (CHROME_PATH or /usr/bin/google-chrome).
 */
"use strict";
const path = require("path");
const http = require("http");
const fs = require("fs");

function loadPlaywright() {
  const tries = ["playwright-core", "playwright", "/usr/local/lib/node_modules/playwright-core", "/usr/local/lib/node_modules/playwright"];
  for (const t of tries) {
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
  const page = await browser.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(String(e)));
  let dialogMode = "accept";
  const dialogs = [];
  page.on("dialog", async (d) => {
    dialogs.push(d.type() + ":" + d.message());
    if (dialogMode === "accept") await d.accept(); else await d.dismiss();
  });

  const getState = () => page.evaluate(() => JSON.parse(localStorage.getItem("purePrepState") || "null"));
  const visible = (sel) => page.evaluate((s) => { const n = document.querySelector(s); return !!n && !n.classList.contains("screen-hidden") && n.offsetParent !== null; }, sel);
  const nav = (name) => page.click(`.nav-btn[data-screen="${name}"]`);
  const next = () => page.click("#onboard-root .mp-next");

  await page.goto(base);
  await page.evaluate(() => localStorage.clear());
  await page.reload();

  console.log("1) Labels + first-time onboarding");
  const navLabels = await page.$$eval(".nav-btn", (bs) => bs.map((b) => b.textContent.trim()));
  check(navLabels.includes("Profile"), "bottom nav has a 'Profile' button (" + navLabels.join(", ") + ")");
  check(!navLabels.includes("Plan"), "no 'Plan' button remains");
  const scriptSrc = await page.$eval('script[src^="onboarding.js"]', (s) => s.getAttribute("src"));
  check(scriptSrc === "onboarding.js?v=doc24", "cache-bust onboarding.js?v=doc24");
  const fav = await page.$eval('link[rel="icon"][type="image/svg+xml"]', (l) => l.getAttribute("href"));
  check(fav === "assets/favicon.svg?v=leaf8", "favicon stays ?v=leaf8");
  const footer = await page.$$eval(".site-footer nav a", (as) => as.map((a) => a.getAttribute("href")));
  check(footer.join(",") === "about.html,privacy.html,disclosure.html", "footer links intact");

  await nav("profile"); // first-time: Profile starts the questionnaire
  check(await visible("#screen-onboard"), "first-time Profile tab opens the questionnaire");
  await page.fill("#budget", "400"); await next();
  await page.click('input[name="cadence"][value="weekly"]'); await next();
  await page.click('input[name="calorieMode"][value="known"]'); await next();
  await page.fill("#calories", "2000"); await next();
  await page.click('input[name="weightGoal"][value="maintain"]'); await next();
  await page.click('input[name="meals"][value="3m2s"]'); await next();
  await next(); // See my plan (default days)
  await page.waitForSelector("#saveClose");
  await page.click("#saveClose");
  await page.waitForSelector("#screen-home .macro-pie");
  let st = await getState();
  check(st.answers && st.answers.calories === 2000 && st.answers.cadence === "weekly", "profile saved from questionnaire");
  check(st.planBlocks.length === 1 && st.planBlocks[0].profile && st.planBlocks[0].profile.calories === 2000, "first block stores a profile snapshot");
  check(!Object.keys(st.answers).some((k) => k.charAt(0) === "_"), "profile has no transient fields");
  check(st.profileCompleted === true, "profileCompleted flag set");

  // Confirm groceries so coverage + inventory exist.
  await page.click("#confirmGroceries");
  st = await getState();
  check(st.groceriesConfirmed && st.groceryCoveredWeeks.length === 1 && st.inventory.length > 0, "groceries confirmed (covered week + inventory)");

  console.log("2) Questionnaire cannot be re-entered");
  const homeText = await page.textContent("#screen-home");
  check(!/Update questionnaire|Start questionnaire/.test(homeText), "dashboard has no questionnaire entry point");
  await page.evaluate(() => window.PurePrepApp.go("onboard"));
  check(await visible("#screen-home") && !(await visible("#screen-onboard")), "loading onboarding as a returning user redirects to dashboard");
  await page.reload();
  await nav("profile");
  check(await visible("#profileForm") && !(await visible("#screen-onboard")), "Profile tab shows Profile page (not questionnaire)");

  const before = await getState();
  const frozen = (s) => JSON.stringify({ planBlocks: s.planBlocks, plan: s.plan, groceryList: s.groceryList, groceryCoveredWeeks: s.groceryCoveredWeeks, inventory: s.inventory, nextOrderDate: s.nextOrderDate, lastOrderedAt: s.lastOrderedAt, scheduledWeeks: s.scheduledWeeks });
  const frozenBefore = frozen(before);

  console.log("3) Profile shows answers");
  const summary = await page.textContent("#profileSummary");
  check(/\$400/.test(summary) && /Weekly/.test(summary) && /2000/.test(summary) && /Maintain/.test(summary) && /3 meals, 2 snacks/.test(summary) && /6 days\/week/.test(summary), "summary lists budget, cadence, calories, goal, meals, days");
  check(await page.inputValue("#pf-calories") === "2000" && await page.inputValue("#pf-budget") === "400", "inputs prefilled with saved values");
  check(await page.isChecked('input[name="pf-weightGoal"][value="maintain"]'), "weight goal radio prefilled");
  const saveIsLast = await page.evaluate(() => { const f = document.getElementById("profileForm"); const b = document.getElementById("saveProfile"); return !!b && f.lastElementChild.contains(b); });
  check(saveIsLast, "Save button is at the bottom of the page");

  console.log("4) Leave without saving => discarded");
  await page.fill("#pf-calories", "2600");
  await page.fill("#pf-budget", "250");
  check(await page.isVisible("#profileDirtyNote"), "unsaved-changes note visible");
  dialogMode = "dismiss";
  await nav("home");
  check(await visible("#profileForm"), "cancel on leave-confirm keeps you on Profile");
  dialogMode = "accept";
  await nav("home");
  check(await visible("#screen-home"), "accepting leave-confirm goes to Home");
  check(dialogs.some((d) => /unsaved profile changes/i.test(d)), "leave-confirm was shown");
  st = await getState();
  check(st.answers.calories === 2000 && st.answers.budget === 400, "tab switch: profile not persisted");
  check(frozen(st) === frozenBefore, "tab switch: plans untouched");
  await nav("profile");
  check(await page.inputValue("#pf-calories") === "2000", "next visit shows saved values (2000)");
  await page.fill("#pf-calories", "3100");
  await page.reload();
  st = await getState();
  check(st.answers.calories === 2000, "reload: profile not persisted");
  await nav("profile");
  check(await page.inputValue("#pf-calories") === "2000", "after reload Profile shows saved values");

  console.log("5) Help path conditional fields + validation");
  await page.click('input[name="pf-calorieMode"][value="help"]');
  check(await page.isVisible("#pf-weightLbs") && await page.isVisible("#pf-activity") && !(await page.isVisible("#pf-calories")), "help path shows weight/goal/activity, hides calories");
  await page.click("#saveProfile");
  check((await page.textContent("#profileError")).includes("Fill in weight, weight goal, and activity."), "help path validation matches questionnaire");
  await page.fill("#pf-weightLbs", "180");
  await page.selectOption("#pf-weightGoalSel", "lose");
  await page.selectOption("#pf-activity", "moderate");
  const derived = await page.textContent("#profileDerived");
  check(/2200/.test(derived) && /33% p \/ 42% c \/ 25% f/.test(derived), "derived estimate (180×15−500=2200) and loss macros shown: " + derived.replace(/\s+/g, " ").trim());
  await page.click('input[name="pf-calorieMode"][value="known"]');
  await page.fill("#pf-calories", "700");
  await page.click("#saveProfile");
  check((await page.textContent("#profileError")).includes("Enter at least 800 calories."), "calorie validation matches questionnaire");
  st = await getState();
  check(st.answers.calories === 2000 && frozen(st) === frozenBefore, "failed validation persisted nothing");

  console.log("6) Save => notice; existing plans unchanged");
  await page.fill("#pf-calories", "2600");
  await page.click('input[name="pf-weightGoal"][value="lose"]');
  await page.fill("#pf-budget", "500");
  await page.click("#saveProfile");
  await page.waitForSelector("#ppNotice");
  const notice = await page.textContent("#ppNoticeMsg");
  check(notice.trim() === "Profile saved. Your changes apply to meal plans scheduled from now on. Meal plans and goals already scheduled stay the same.", "save notice text");
  const alerts = dialogs.filter((d) => d.startsWith("alert"));
  check(alerts.length === 0, "notice is an in-app modal, not alert()");
  await page.click("#ppNoticeOk");
  st = await getState();
  check(st.answers.calories === 2600 && st.answers.weightGoal === "lose" && st.answers.budget === 500 && st.answers.calorieMode === "known", "profile saved with new values");
  check(frozen(st) === frozenBefore, "planBlocks, plan, grocery list, covered weeks, inventory, order dates unchanged");
  check(st.planBlocks[0].plan.daily.calories === 2000 && st.planBlocks[0].profile.calories === 2000 && st.planBlocks[0].profile.budget === 400, "existing block keeps its 2000 kcal targets + snapshot");

  await page.click("#saveProfile");
  await page.waitForSelector("#ppNotice");
  check((await page.textContent("#ppNoticeTitle")).includes("No changes to save"), "second save => 'No changes to save'");
  await page.click("#ppNoticeOk");

  console.log("7) Dashboard for existing week reads its snapshot");
  await nav("home");
  const pieCals = await page.textContent("#screen-home .macro-pie-hole strong");
  check(pieCals.trim() === "2000", "scheduled week still shows 2000 cals (not 2600)");
  const legend = await page.textContent("#screen-home .macro-legend");
  check(/Protein 28%/.test(legend), "scheduled week still shows maintain macros (28% protein)");

  console.log("8) New plans use updated profile");
  await page.click("#nextWeek"); // unscheduled week
  await page.waitForSelector("#repeatMealPlan");
  await page.click("#repeatMealPlan");
  st = await getState();
  check(st.planBlocks.length === 2, "Repeat added a block");
  const repeatBlock = st.planBlocks[1];
  check(repeatBlock.plan.daily.calories === 2600 && repeatBlock.plan.daily.macros.p === 33 && repeatBlock.plan.budget === 500, "repeated block uses 2600 kcal / loss macros / $500");
  check(repeatBlock.profile && repeatBlock.profile.calories === 2600, "repeated block snapshot = updated profile");
  check(JSON.stringify(st.planBlocks[0]) === JSON.stringify(before.planBlocks[0]), "original block byte-identical after Repeat");
  check((await page.textContent("#screen-home .macro-pie-hole strong")).trim() === "2600", "new week shows 2600 cals");

  await page.click("#nextWeek");
  await page.waitForSelector("#pickNewMeals");
  await page.click("#pickNewMeals");
  await page.waitForSelector("#saveClose");
  const target = await page.textContent("#onboard-root .mp-cals");
  check(target.trim() === "2600", "Pick new builds from updated profile (2600 target)");
  await page.click("#saveClose");
  await page.waitForSelector("#screen-home .macro-pie");
  st = await getState();
  check(st.planBlocks.length === 3 && st.planBlocks[2].plan.daily.calories === 2600 && st.planBlocks[2].profile.budget === 500, "Pick-new block uses updated profile");
  check(st.answers.calories === 2600 && st.answers.budget === 500, "Pick new did not overwrite the profile");
  check(JSON.stringify(st.planBlocks[0]) === JSON.stringify(before.planBlocks[0]), "original block still identical");
  check(JSON.stringify(st.groceryCoveredWeeks) === JSON.stringify(before.groceryCoveredWeeks), "covered weeks still identical");

  console.log("9) Update meal plan on an existing (uncovered) week keeps its own goals");
  await page.click("#prevWeek"); // back to repeat week (uncovered, 2600)
  // Change profile again, then update the repeat week: it must keep 2600.
  await nav("profile");
  await page.fill("#pf-calories", "1800");
  await page.click("#saveProfile");
  await page.waitForSelector("#ppNotice");
  await page.click("#ppNoticeOk");
  await nav("home");
  const offsetBefore = await page.textContent("#screen-home .week-toggle strong");
  await page.click("#nextWeek"); await page.click("#prevWeek");
  check((await page.textContent("#screen-home .week-toggle strong")) === offsetBefore, "home week toggle usable");
  await page.evaluate(() => { const b = document.getElementById("updateMealPlan"); b && b.click(); });
  await page.waitForSelector("#saveClose");
  const updTarget = await page.textContent("#onboard-root .mp-cals");
  check(updTarget.trim() === "2600", "Update meal plan on scheduled week uses that week's snapshot (" + updTarget.trim() + "), not 1800");
  await page.click("#toDash");
  await page.waitForSelector("#screen-home .macro-pie");
  st = await getState();
  check(st.answers.calories === 1800, "Update meal plan did not overwrite the profile");
  check(st.planBlocks.every((b) => b.plan.daily.calories !== 1800), "no existing week picked up the 1800 profile");
  check(JSON.stringify(st.planBlocks[0]) === JSON.stringify(before.planBlocks[0]), "grocery-covered first block still identical");

  console.log("10) Migration of legacy blocks without snapshots");
  const legacy = JSON.parse(JSON.stringify(before));
  legacy.planBlocks.forEach((b) => { delete b.profile; delete b.scheduledAt; });
  delete legacy.profileCompleted;
  legacy.answers = Object.assign({}, legacy.answers, { _inventory: [{ key: "x" }], _rerollHistory: {} });
  await page.evaluate((s) => localStorage.setItem("purePrepState", JSON.stringify(s)), legacy);
  await page.reload();
  st = await getState();
  check(st.planBlocks.every((b) => b.profile && b.profile.calories === b.plan.daily.calories), "legacy blocks snapshotted on load");
  check(st.profileCompleted === true && !st.answers._inventory, "legacy state marked complete; transient answer fields dropped");
  check(JSON.stringify(st.planBlocks.map((b) => b.plan)) === JSON.stringify(legacy.planBlocks.map((b) => b.plan)), "legacy plans untouched by migration");
  await nav("profile");
  check(await visible("#profileForm"), "legacy user gets Profile, not questionnaire");

  check(errors.length === 0, "no page errors" + (errors.length ? ": " + errors.join(" | ") : ""));

  await browser.close();
  srv.close();
  if (failures) { console.log("verify-profile-doc24: " + failures + " FAILED"); process.exit(1); }
  console.log("verify-profile-doc24: OK");
})().catch((e) => { console.error(e); process.exit(1); });
