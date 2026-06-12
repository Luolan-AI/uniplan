import test from "node:test";
import assert from "node:assert/strict";
import { calculateStats, planFromCsv, validatePlan } from "./utils.js";

test("calculateStats separates completed, planned, and remaining credits", () => {
  const plan = {
    profile: { totalCredits: 30 },
    modules: [
      {
        id: "core",
        courses: [
          { id: "a", credits: 10, status: "completed", grade: "1.3", countsTowardGpa: true },
          { id: "b", credits: 5, status: "completed", grade: "2.3", countsTowardGpa: true },
          { id: "c", credits: 5, status: "planned", grade: "", countsTowardGpa: true },
        ],
      },
    ],
  };

  const stats = calculateStats(plan);
  assert.equal(stats.completed, 15);
  assert.equal(stats.planned, 5);
  assert.equal(stats.remaining, 10);
  assert.equal(stats.average.toFixed(2), "1.63");
});

test("calculateStats excludes pass/fail courses from the weighted grade", () => {
  const plan = {
    profile: { totalCredits: 10 },
    modules: [
      {
        id: "core",
        courses: [
          { id: "a", credits: 5, status: "completed", grade: "1.0", countsTowardGpa: true },
          { id: "b", credits: 5, status: "completed", grade: "4.0", countsTowardGpa: false },
        ],
      },
    ],
  };

  assert.equal(calculateStats(plan).average, 1);
});

test("planFromCsv groups courses into modules", () => {
  const csv = `module,moduleRequiredCredits,code,course,credits,status,semester
Core,10,CS1,Course One,5,completed,1
Core,10,CS2,Course Two,5,planned,2`;
  const plan = planFromCsv(csv, { totalCredits: 10, language: "en" });

  assert.equal(plan.modules.length, 1);
  assert.equal(plan.modules[0].courses.length, 2);
  assert.equal(plan.modules[0].courses[1].semester, 2);
  assert.doesNotThrow(() => validatePlan(plan));
});

test("validatePlan rejects malformed imports", () => {
  assert.throws(() => validatePlan({ profile: {} }), /Missing plan fields/);
});
