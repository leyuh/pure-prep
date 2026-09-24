/**
 * Quick verify: week-at-a-glance cannot go earlier than first scheduled plan.
 * Mirrors minWeekOffset / offsetFromWeekISO logic from index.html.
 */
"use strict";

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
function offsetFromWeekISO(weekISO, now) {
  if (!weekISO) return soonestSundayWeekOffset(now);
  const currentStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  currentStart.setDate(currentStart.getDate() - currentStart.getDay());
  const parts = String(weekISO).split("-");
  const target = new Date(+parts[0], +parts[1] - 1, +parts[2]);
  return Math.round((target - currentStart) / (7 * 24 * 60 * 60 * 1000));
}
function minWeekOffset(st, now) {
  const weeks = (st && st.scheduledWeeks) || [];
  if (weeks.length) return offsetFromWeekISO(weeks.slice().sort()[0], now);
  if (st && st.plan) return soonestSundayWeekOffset(now);
  return 0;
}

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

// Wednesday Sep 24 2026 → soonest Sunday offset = 1
const wed = new Date(2026, 8, 24);
assert(wed.getDay() === 4, "fixture should be Wednesday");
assert(soonestSundayWeekOffset(wed) === 1, "soonest Sunday from Wed is offset 1");

const firstISO = weekStartISO(1, wed);
const st = { plan: { id: 1 }, scheduledWeeks: [firstISO, weekStartISO(2, wed)] };
assert(minWeekOffset(st, wed) === 1, "min offset is first scheduled week (1)");

let weekOffset = 0;
const floor = minWeekOffset(st, wed);
if (weekOffset < floor) weekOffset = floor;
assert(weekOffset === 1, "clamp lifts 0 → 1");

// prev at floor does nothing
function tryPrev() {
  if (weekOffset <= minWeekOffset(st, wed)) return false;
  weekOffset -= 1;
  return true;
}
assert(tryPrev() === false, "prev disabled at floor");
assert(weekOffset === 1, "still at floor after prev");

weekOffset += 1;
assert(weekOffset === 2, "next still works");
assert(tryPrev() === true, "prev works above floor");
assert(weekOffset === 1, "back to floor");

// No scheduled weeks + plan → soonest Sunday
assert(minWeekOffset({ plan: {} }, wed) === 1, "no weeks → soonest Sunday");
assert(minWeekOffset({}, wed) === 0, "no plan → 0");

// Sunday: soonest = 0
const sun = new Date(2026, 8, 27);
assert(sun.getDay() === 0, "fixture Sunday");
const sunISO = weekStartISO(0, sun);
assert(minWeekOffset({ plan: {}, scheduledWeeks: [sunISO] }, sun) === 0, "Sunday start floor 0");

console.log("verify-week-min-doc21: OK");
