/**
 * Verify: weeks in groceryCoveredWeeks cannot be updated;
 * uncovered weeks remain editable. Mirrors lock + save-guard logic.
 */
"use strict";

function weekStartISO(offset, now) {
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  start.setDate(start.getDate() - start.getDay());
  start.setDate(start.getDate() + offset * 7);
  const y = start.getFullYear();
  const m = String(start.getMonth() + 1).padStart(2, "0");
  const day = String(start.getDate()).padStart(2, "0");
  return y + "-" + m + "-" + day;
}

function isGroceryOrderedForWeek(st, offset, now) {
  const ws = weekStartISO(offset, now);
  return (st.groceryCoveredWeeks || []).indexOf(ws) !== -1;
}

function isWeekScheduled(st, offset, now) {
  return ((st.scheduledWeeks || []).indexOf(weekStartISO(offset, now)) !== -1);
}

/** UI: Update meal plan disabled when viewing a scheduled + grocery-covered week. */
function updateMealPlanDisabled(st, weekOffset, now) {
  if (!st.plan) return true;
  return isWeekScheduled(st, weekOffset, now) && isGroceryOrderedForWeek(st, weekOffset, now);
}

function upsertPlanBlock(st, weekStarts, plan) {
  if (!st.planBlocks) st.planBlocks = [];
  const covered = {};
  (st.groceryCoveredWeeks || []).forEach((w) => { covered[w] = true; });
  weekStarts = (weekStarts || []).filter((w) => !covered[w]);
  const take = {};
  weekStarts.forEach((w) => { take[w] = true; });
  st.planBlocks = st.planBlocks
    .map((b) => ({
      weeks: (b.weeks || []).filter((w) => !take[w]),
      plan: b.plan,
    }))
    .filter((b) => b.weeks && b.weeks.length && b.plan);
  const weeks = weekStarts.slice().sort();
  if (weeks.length && plan) {
    st.planBlocks.push({ weeks: weeks, plan: plan });
  }
  const set = {};
  st.planBlocks.forEach((b) => (b.weeks || []).forEach((w) => { set[w] = true; }));
  st.scheduledWeeks = Object.keys(set).sort();
  return st;
}

/** Save guard: strip covered weeks; abort when none writable. */
function applySave(st, fromOffset, nWeeks, newPlan, now) {
  const newWeeks = [];
  for (let i = 0; i < nWeeks; i++) newWeeks.push(weekStartISO(fromOffset + i, now));
  const coveredSet = {};
  (st.groceryCoveredWeeks || []).forEach((w) => { coveredSet[w] = true; });
  const writableWeeks = newWeeks.filter((w) => !coveredSet[w]);
  if (!writableWeeks.length) {
    return { blocked: true, state: st };
  }
  const prevPlanBlocks = JSON.parse(JSON.stringify(st.planBlocks || []));
  upsertPlanBlock(st, writableWeeks, newPlan);
  st.plan = newPlan;
  return { blocked: false, state: st, writableWeeks, prevPlanBlocks };
}

function planForWeekISO(st, weekISO) {
  for (const b of st.planBlocks || []) {
    if (b.plan && (b.weeks || []).indexOf(weekISO) !== -1) return b.plan;
  }
  return null;
}

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

const now = new Date(2026, 8, 24); // Wed
const w0 = weekStartISO(1, now); // soonest Sunday
const w1 = weekStartISO(2, now);
const w2 = weekStartISO(3, now);
const w3 = weekStartISO(4, now);

const oldPlan = { id: "old", schedule: [] };
const newPlan = { id: "new", schedule: [] };

const st = {
  plan: oldPlan,
  scheduledWeeks: [w0, w1, w2],
  groceryCoveredWeeks: [w0, w1], // first cadence window ordered
  planBlocks: [
    { weeks: [w0, w1], plan: oldPlan },
    { weeks: [w2], plan: oldPlan },
  ],
};

// Covered week → Update disabled
assert(updateMealPlanDisabled(st, 1, now) === true, "covered week 1 → update disabled");
assert(isGroceryOrderedForWeek(st, 1, now) === true, "week 1 ordered");

// Uncovered scheduled week → Update allowed
assert(updateMealPlanDisabled(st, 3, now) === false, "uncovered week 3 → update allowed");
assert(isGroceryOrderedForWeek(st, 3, now) === false, "week 3 not ordered");

// Empty / unscheduled week → Update not locked by coverage (still has plan)
assert(updateMealPlanDisabled(st, 5, now) === false, "empty week → update not coverage-locked");

// Save targeting covered weeks only → blocked, planBlocks unchanged
const before = JSON.stringify(st.planBlocks);
const blocked = applySave(st, 1, 2, newPlan, now);
assert(blocked.blocked === true, "save covering only ordered weeks is blocked");
assert(JSON.stringify(st.planBlocks) === before, "planBlocks unchanged on block");
assert(planForWeekISO(st, w0) === oldPlan, "covered week plan untouched");
assert(planForWeekISO(st, w1) === oldPlan, "covered week 2 plan untouched");

// Save targeting uncovered week → allowed; covered weeks preserved
const ok = applySave(st, 3, 2, newPlan, now); // w2 and w3
assert(ok.blocked === false, "save for uncovered weeks allowed");
assert(planForWeekISO(st, w0) === oldPlan, "covered w0 still old after uncovered save");
assert(planForWeekISO(st, w1) === oldPlan, "covered w1 still old");
assert(planForWeekISO(st, w2) === newPlan, "uncovered w2 updated");
assert(planForWeekISO(st, w3) === newPlan, "new w3 written");

// First-time save (no coverage) → editable
const fresh = {
  plan: null,
  scheduledWeeks: [],
  groceryCoveredWeeks: [],
  planBlocks: [],
};
const first = applySave(fresh, 1, 2, newPlan, now);
assert(first.blocked === false, "first save before confirm allowed");
assert(planForWeekISO(fresh, w0) === newPlan, "first-save wrote plan");

console.log("verify-plan-lock-doc22: OK");
