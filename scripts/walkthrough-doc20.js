/**
 * Walkthrough for doc20 bug fixes:
 * 1) First save: nextOrderDate = plan-start Sunday (order before), not end of cadence window
 * 2) Schedule weeks 0–1, then Pick new for 2–3: weeks 0–1 plan intact; 2–3 get new plan
 */
"use strict";

function cadenceDays(cadence) {
  if (cadence === "every_other_week") return 14;
  if (cadence === "monthly") return 28;
  return 7;
}
function cadenceWeeks(cadence) {
  if (cadence === "every_other_week") return 2;
  if (cadence === "monthly") return 4;
  return 1;
}
function soonestSundayWeekOffset(now) {
  return now.getDay() === 0 ? 0 : 1;
}
function weekStartISO(offset, now) {
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  start.setDate(start.getDate() - start.getDay());
  start.setDate(start.getDate() + offset * 7);
  const y = start.getFullYear();
  const m = String(start.getMonth() + 1).padStart(2, "0");
  const day = String(start.getDate()).padStart(2, "0");
  return y + "-" + m + "-" + day;
}
function buildWeekStarts(fromOffset, n, now) {
  const out = [];
  for (let i = 0; i < n; i++) out.push(weekStartISO(fromOffset + i, now));
  return out;
}
function addDays(iso, n) {
  const d = new Date(iso + "T12:00:00");
  d.setDate(d.getDate() + n);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return y + "-" + m + "-" + day;
}
function rebuildScheduledWeeks(st) {
  const set = {};
  (st.planBlocks || []).forEach((b) => {
    (b.weeks || []).forEach((w) => { set[w] = true; });
  });
  st.scheduledWeeks = Object.keys(set).sort();
  return st.scheduledWeeks;
}
function planForWeekISO(st, weekISO) {
  const blocks = (st && st.planBlocks) || [];
  for (let i = 0; i < blocks.length; i++) {
    const b = blocks[i];
    if (b && b.plan && b.weeks && b.weeks.indexOf(weekISO) !== -1) return b.plan;
  }
  if (st && st.plan && (st.scheduledWeeks || []).indexOf(weekISO) !== -1) return st.plan;
  return null;
}
function upsertPlanBlock(st, weekStarts, plan) {
  if (!st.planBlocks) st.planBlocks = [];
  const take = {};
  (weekStarts || []).forEach((w) => { take[w] = true; });
  st.planBlocks = st.planBlocks
    .map((b) => ({
      weeks: (b.weeks || []).filter((w) => !take[w]),
      plan: b.plan,
    }))
    .filter((b) => b.weeks && b.weeks.length && b.plan);
  const weeks = (weekStarts || []).slice().sort();
  if (weeks.length && plan) st.planBlocks.push({ weeks: weeks, plan: plan });
  rebuildScheduledWeeks(st);
  return st;
}

function fakePlan(id) {
  return {
    id: id,
    daily: { calories: 2000, macros: { p: 28, c: 42, f: 30 }, protein_g: 140, carbs_g: 210, fat_g: 67 },
    selectedDays: ["mon", "tue", "wed", "thu", "fri", "sat"],
    daysPerWeek: 6,
    schedule: [
      {
        name: "Meal 1",
        suggestion: {
          title: "Plan " + id + " Smoothie",
          totals: { kcal: 500, p: 40, c: 40, f: 15 },
          ingredients: [{ label: "protein", kcal: 120, p: 24, c: 3, f: 1, _key: "protein_scoop", _qty: 1 }],
        },
      },
    ],
    grocery: { items: [{ key: "protein_scoop", name: "Protein", unit: "scoop", qty: 14, qtyLabel: "14 scoops", lineTotal: 20 }] },
  };
}

function applySave(state, plan, answers, fromOffset, now) {
  const prevNextOrder = state.nextOrderDate;
  const prevInventory = state.inventory || [];
  const prevConfirmed = state.groceriesConfirmed;
  const prevCovered = (state.groceryCoveredWeeks || []).slice();
  const prevOrderedAt = state.lastOrderedAt;
  const prevDepleted = state.lastDepletedDate;
  const nWeeks = cadenceWeeks(answers && answers.cadence);
  const newWeeks = buildWeekStarts(fromOffset, nWeeks, now);
  const isAppend =
    fromOffset > 0 &&
    ((state.planBlocks && state.planBlocks.length) || (state.scheduledWeeks && state.scheduledWeeks.length));

  state.answers = answers || state.answers;
  state.plan = plan;
  state.groceryList = plan.grocery || state.groceryList;
  state._pendingScheduleFromOffset = null;
  upsertPlanBlock(state, newWeeks, plan);

  if (isAppend) {
    state.inventory = prevInventory;
    state.groceriesConfirmed = prevConfirmed;
    state.groceryCoveredWeeks = prevCovered;
    state.lastOrderedAt = prevOrderedAt;
    state.lastDepletedDate = prevDepleted;
    state.nextOrderDate = prevNextOrder || state.nextOrderDate;
  } else {
    state.inventory = prevInventory;
    state.groceriesConfirmed = false;
    state.lastOrderedAt = null;
    state.lastDepletedDate = null;
    const take = {};
    newWeeks.forEach((w) => { take[w] = true; });
    state.groceryCoveredWeeks = prevCovered.filter((w) => !take[w]);
    state.nextOrderDate = weekStartISO(fromOffset, now);
  }
  return state;
}

function assert(cond, msg) {
  if (!cond) throw new Error("FAIL: " + msg);
  console.log("OK:", msg);
}

const NOW = new Date(2026, 8, 23); // Wed Sep 23, 2026
assert(NOW.getDay() === 3, "fixture is Wednesday");

const answers = { cadence: "every_other_week", selectedDays: ["mon", "tue", "wed", "thu", "fri", "sat"] };
const from0 = soonestSundayWeekOffset(NOW); // 1
const planStart = weekStartISO(from0, NOW);
const endOfWindow = addDays(planStart, cadenceDays(answers.cadence));

console.log("planStart Sunday:", planStart);
console.log("endOfWindow (old buggy date):", endOfWindow);

let state = {
  answers: null,
  plan: null,
  planBlocks: [],
  inventory: [],
  lastOrderedAt: null,
  nextOrderDate: null,
  groceryList: null,
  groceriesConfirmed: false,
  lastDepletedDate: null,
  scheduledWeeks: [],
  groceryCoveredWeeks: [],
  _pendingScheduleFromOffset: null,
};

const planA = fakePlan("A");
state = applySave(state, planA, answers, from0, NOW);

assert(state.nextOrderDate === planStart, "BUG1: nextOrderDate is plan-start Sunday " + planStart);
assert(state.nextOrderDate !== endOfWindow, "BUG1: nextOrderDate is NOT end of cadence window " + endOfWindow);
assert(!state.groceriesConfirmed, "BUG1: groceries not yet confirmed after first save");
assert(
  state.scheduledWeeks.length === 2 &&
    state.scheduledWeeks[0] === weekStartISO(from0, NOW) &&
    state.scheduledWeeks[1] === weekStartISO(from0 + 1, NOW),
  "BUG1: scheduled weeks are first cadence window"
);
assert(state.planBlocks.length === 1, "BUG1: one plan block after first save");
assert(planForWeekISO(state, state.scheduledWeeks[0]) === planA, "BUG1: week0 has plan A");
assert(planForWeekISO(state, state.scheduledWeeks[1]) === planA, "BUG1: week1 has plan A");

const msg = state.groceriesConfirmed
  ? "Next grocery order: " + state.nextOrderDate
  : "Order groceries before " + state.nextOrderDate + " (plan start).";
assert(msg.indexOf("Order groceries before") === 0, "BUG1 UI: " + msg);

const weeks01 = state.scheduledWeeks.slice();
const planB = fakePlan("B");
const from2 = from0 + 2;
state._pendingScheduleFromOffset = from2;
state = applySave(state, planB, answers, from2, NOW);

assert(state.planBlocks.length === 2, "BUG2: two plan blocks after Pick new");
assert(state.scheduledWeeks.length === 4, "BUG2: four scheduled weeks total");

const w0 = weekStartISO(from0, NOW);
const w1 = weekStartISO(from0 + 1, NOW);
const w2 = weekStartISO(from2, NOW);
const w3 = weekStartISO(from2 + 1, NOW);

assert(planForWeekISO(state, w0) === planA, "BUG2: week0 still plan A");
assert(planForWeekISO(state, w1) === planA, "BUG2: week1 still plan A");
assert(planForWeekISO(state, w2) === planB, "BUG2: week2 has plan B");
assert(planForWeekISO(state, w3) === planB, "BUG2: week3 has plan B");
assert(
  weeks01.every((w) => state.scheduledWeeks.indexOf(w) !== -1),
  "BUG2: original weeks 0-1 still scheduled"
);
assert(state.nextOrderDate === planStart, "BUG2: append keeps prior nextOrderDate");
assert(state.plan === planB, "BUG2: active plan pointer is latest (B)");

console.log("\nAll walkthrough checks passed.");
console.log(JSON.stringify({
  planStart: planStart,
  nextOrderDate: state.nextOrderDate,
  scheduledWeeks: state.scheduledWeeks,
  blocks: state.planBlocks.map((b) => ({ weeks: b.weeks, planId: b.plan.id })),
}, null, 2));
