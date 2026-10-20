// Tests for verify.mjs: node --test tools/ci/verify.test.mjs
import assert from "node:assert/strict";
import test from "node:test";
import { loadManifest, matchesPaths, runChecks, selectChecks } from "./verify.mjs";

const checks = loadManifest();
const ids = (list) => list.map((c) => c.id);

test("the manifest keeps lint, structure, typecheck, migrate, test, build and storybook", () => {
  assert.deepEqual(ids(checks), [
    "lint",
    "structure",
    "typecheck",
    "migrate",
    "test",
    "build",
    "storybook",
  ]);
});

test("--all runs everything except checks that have their own CI job", () => {
  assert.deepEqual(ids(selectChecks({ checks, mode: "all", only: [], changed: [] })), [
    "lint",
    "structure",
    "typecheck",
    "migrate",
    "test",
    "build",
  ]);
});

test("--only runs exactly the named checks, also a job check", () => {
  assert.deepEqual(
    ids(selectChecks({ checks, mode: "only", only: ["storybook"], changed: null })),
    ["storybook"],
  );
});

test("--light runs lint and structure only", () => {
  assert.deepEqual(ids(selectChecks({ checks, mode: "light", only: [], changed: null })), [
    "lint",
    "structure",
  ]);
});

test("auto mode skips build when only core or docs changed", () => {
  const picked = ids(
    selectChecks({
      checks,
      mode: "auto",
      only: [],
      changed: ["packages/core/src/features/item/schema.ts", "docs/x.md"],
    }),
  );
  assert.ok(!picked.includes("build"));
  assert.ok(picked.includes("test"));
});

test("auto mode runs build when the web app changed", () => {
  assert.ok(
    ids(
      selectChecks({ checks, mode: "auto", only: [], changed: ["apps/web/src/app/page.tsx"] }),
    ).includes("build"),
  );
});

test("auto mode runs build when the client-safe core schemas changed", () => {
  assert.ok(
    ids(
      selectChecks({ checks, mode: "auto", only: [], changed: ["packages/core/src/schemas.ts"] }),
    ).includes("build"),
  );
});

test("unknown changed files run everything", () => {
  assert.ok(ids(selectChecks({ checks, mode: "auto", only: [], changed: null })).includes("build"));
});

test("matchesPaths", () => {
  assert.equal(
    matchesPaths({ paths: ["^packages/ui/"], changed: ["packages/ui/src/a.tsx"] }),
    true,
  );
  assert.equal(matchesPaths({ paths: ["^packages/ui/"], changed: ["packages/uix/a.tsx"] }), false);
});

const fake =
  (failing = []) =>
  ({ check }) => ({ ok: !failing.includes(check.id), output: `out ${check.id}` });

test("a fast failure is reported with the other fast checks and skips the rest", () => {
  const report = runChecks({ checks, json: true, run: fake(["lint", "typecheck"]) });
  assert.equal(report.green, false);
  assert.deepEqual(
    report.failures.map((f) => f.check),
    ["pnpm lint", "pnpm typecheck"],
  );
  assert.deepEqual(report.ran, ["lint", "structure", "typecheck"]);
  assert.deepEqual(report.skipped, ["migrate", "test", "build", "storybook"]);
});

test("slow checks all run, and a failing one skips the last stage", () => {
  const report = runChecks({ checks, json: true, run: fake(["migrate"]) });
  assert.deepEqual(report.ran, ["lint", "structure", "typecheck", "migrate", "test"]);
  assert.deepEqual(report.skipped, ["build", "storybook"]);
});

test("a green run runs every selected check", () => {
  const report = runChecks({ checks, json: true, run: fake() });
  assert.equal(report.green, true);
  assert.equal(report.ran.length, checks.length);
});
