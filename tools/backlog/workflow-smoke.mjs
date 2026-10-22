// Smoke test for .claude/workflows/work-backlog.js with a mocked agent(): no GitHub, no worktrees.
// Run: node tools/backlog/workflow-smoke.mjs
import { readFileSync } from "node:fs";

const SRC = readFileSync(
  new URL("../../.claude/workflows/work-backlog.js", import.meta.url),
  "utf8",
).replace("export const meta =", "const meta =");
const AsyncFunction = Object.getPrototypeOf(async () => {}).constructor;

const green = { green: true, failures: [] };
const red = (text) => ({ green: false, failures: [{ check: "typecheck", output: text }] });

async function runScript({ args = {}, tickets, impl, review, hook }) {
  const calls = [];
  const logs = [];
  const agent = async (prompt, opts) => {
    calls.push({ prompt, ...opts });
    const custom = hook?.(opts, prompt);
    if (custom !== undefined) return custom;
    if (opts.label === "gate") return { path: "workflow", reason: "test", ready: [] };
    if (opts.label.startsWith("select")) {
      const excluded = (prompt.match(/--exclude ([\d,]+)/)?.[1] ?? "").split(",").map(Number);
      return { ok: true, tickets: tickets.filter((t) => !excluded.includes(t.number)) };
    }
    if (opts.label.startsWith("residue")) return { matches: [] };
    if (opts.phase === "Implement") return impl(opts, prompt);
    if (opts.phase === "Verify") return impl(opts, prompt);
    if (opts.phase === "Review") return review ? review(opts) : { ok: true, findings: [] };
    if (opts.phase === "Land") {
      if (opts.label.startsWith("arm")) return { state: "armed", pr: 101 };
      if (/^(resolve|land-fix|ci-fix)/.test(opts.label) && prompt.includes("arm.sh"))
        return { state: "armed", pr: 101 };
      return { state: "opened", pr: 101, url: "https://github.com/simpel/bibi/pull/101" };
    }
    if (opts.phase === "Park") return { state: "parked", branch: "parked/x" };
    return { created: [] };
  };
  const fn = new AsyncFunction("args", "agent", "phase", "log", "parallel", SRC);
  const result = await fn(
    args,
    agent,
    () => {},
    (m) => logs.push(m),
    (fns) => Promise.all(fns.map((f) => f())),
  );
  return { calls, logs, result };
}

const T = (number, title, labels, size = "M", extra = {}) => ({
  number,
  title,
  labels,
  size,
  itemId: `item${number}`,
  priority: "P1",
  status: "Todo",
  openBlockers: [],
  ...extra,
});
const done = () => ({ status: "done", summary: "ok", files: ["a.ts"], checks: green });
const docsDone = () => ({ status: "done", summary: "ok", files: ["docs/a.md"], checks: green });
let failed = 0;
const check = (name, ok, detail = "") => {
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${ok ? "" : `  -> ${detail}`}`);
  if (!ok) failed++;
};

// 1. model choice
{
  const tickets = [
    T(1, "Add a feature", ["area:core", "type:feature"], "XL"),
    T(2, "Small fix", ["area:web"], "S"),
    T(3, "Override", ["area:db"], "L", { model: "Sonnet" }),
    T(4, "Rename things", ["area:db", "area:core"], "XL", { kind: "Codemod" }),
    T(5, "Auth bug", ["area:auth"], "S"),
  ];
  const { logs, calls } = await runScript({ args: { batchSize: 5 }, tickets, impl: done });
  const batch = logs.filter((l) => l.startsWith("Batch")).join("\n");
  check("XL without area:db is Opus", /#1 \(opus\/high, alone\)/.test(batch), batch);
  check("small web ticket is Sonnet", /#2 \(sonnet\/medium\)/.test(batch), batch);
  check(
    "Model=Sonnet beats area:db and size L",
    /#3 \(sonnet\/high; challenge: Model=Sonnet/.test(batch),
    batch,
  );
  check("Kind=Codemod runs on Sonnet", /#4 \(sonnet\/medium, codemod, alone\)/.test(batch), batch);
  check("area:auth is Opus", /#5 \(opus\/high\)/.test(batch), batch);
  const impl4 = calls.find((c) => c.phase === "Implement" && c.label.startsWith("#4 "));
  check(
    "codemod prompt only on the codemod ticket",
    impl4?.prompt.includes("mechanical rename") &&
      !calls.find((c) => c.label.startsWith("#2 ")).prompt.includes("mechanical rename"),
  );
  check(
    "codemod prompt points at the codemod skill and the Renames table",
    impl4?.prompt.includes("codemod skill") && impl4.prompt.includes("### Renames"),
  );
  check(
    "codemod script lives outside the git tree",
    impl4?.prompt.includes("bibi-worktrees/.scratch/t-4"),
  );
  const rev4 = calls.find((c) => c.phase === "Review" && c.label === "tenancy #4");
  const rev1 = calls.find((c) => c.phase === "Review" && c.label === "tenancy #1");
  check(
    "codemod review on Sonnet, others on Opus",
    rev4 && rev4.model === "sonnet" && rev1 && rev1.model === "opus",
  );
}

// 2. exclusive ticket runs alone, first
{
  const tickets = [
    T(1, "Normal", ["area:core"]),
    T(9, "Big rename", ["area:db"], "XL", { kind: "Codemod" }),
  ];
  const { logs } = await runScript({ tickets, impl: done });
  const batch = logs.find((l) => l.startsWith("Batch 1")) || "";
  check(
    "codemod or XL ticket is the whole batch",
    batch.includes("#9") && !batch.includes("#1 "),
    batch,
  );
}

// 3. co-author follows the model that did the work
{
  const { calls } = await runScript({
    tickets: [T(1, "Small", ["area:web"], "S"), T(2, "Big", ["area:core"], "XL")],
    impl: done,
  });
  const land1 = calls.find((c) => c.label === "ship #1");
  const land2 = calls.find((c) => c.label === "ship #2");
  check("Sonnet ticket lands with a Sonnet co-author", land1?.prompt.includes("Claude Sonnet 5.5"));
  check("Opus ticket lands with an Opus co-author", land2?.prompt.includes("Claude Opus 5.5"));
}

// 4. fix loop: rounds by size, early stop on identical failures, escalation on the last round
{
  let n = 0;
  const impl = (opts) =>
    opts.phase === "Implement"
      ? { status: "done", summary: "s", files: ["a.ts"], checks: red("boom") }
      : { status: "done", summary: "s", files: ["a.ts"], checks: red(`boom ${n++}`) };
  const { calls, result } = await runScript({ tickets: [T(1, "Normal", ["area:web"], "M")], impl });
  const fixes = calls.filter((c) => c.phase === "Verify");
  check(
    "M ticket gets 2 fix rounds and parks",
    fixes.length === 2 && result.parked.length === 1,
    `fixes=${fixes.length}`,
  );
  check(
    "last round escalates Sonnet to Opus",
    fixes[1] && fixes[1].model === "opus",
    fixes.map((f) => f.model).join(","),
  );
}
{
  const impl = (_opts) => ({
    status: "done",
    summary: "s",
    files: ["a.ts"],
    checks: red("same failure every time"),
  });
  const { calls, result } = await runScript({ tickets: [T(1, "Normal", ["area:web"], "M")], impl });
  const fixes = calls.filter((c) => c.phase === "Verify");
  check(
    "identical failures after a round stop the loop early",
    fixes.length === 1 && result.parked.length === 1,
    `fixes=${fixes.length}`,
  );
}
{
  let n = 0;
  const impl = (opts) => ({
    status: "done",
    summary: "s",
    files: ["a.ts"],
    checks: opts.phase === "Implement" ? red("a") : red(`b${n++}`),
  });
  const { calls } = await runScript({
    tickets: [T(1, "Rename things", ["area:core"], "XL")],
    impl,
  });
  check(
    "codemod or XL ticket gets 3 fix rounds",
    calls.filter((c) => c.phase === "Verify").length === 3,
  );
}

// 5. adopt: continue a dead run's worktree
{
  const tickets = [
    T(390, "Rename behaviours to capabilities", ["kind:codemod", "run:alone"], "XL", {
      status: "In progress",
    }),
    T(316, "Other in progress", ["area:web"], "M", { status: "In progress" }),
  ];
  const { calls, logs } = await runScript({
    args: { only: [390], adopt: [390] },
    tickets,
    impl: done,
  });
  const batch = logs.find((l) => l.startsWith("Batch 1")) || "";
  const impl = calls.find((c) => c.phase === "Implement");
  check(
    "adopted In progress ticket is picked, others in progress are not",
    batch.includes("#390") && !batch.includes("#316"),
    batch,
  );
  check(
    "adopt prompt uses prep.sh --adopt and says not to start over",
    impl?.prompt.includes("prep.sh --adopt 390") &&
      impl.prompt.includes("ADOPTED TICKET") &&
      impl.prompt.includes("Do not start over"),
  );
  check(
    "adopted codemod ticket reuses the scratch script",
    impl?.prompt.includes("may still be in") && impl.prompt.includes(".scratch/t-390"),
  );
  const none = await runScript({ args: { only: [390] }, tickets, impl: done });
  check(
    "without adopt an In progress ticket is never picked",
    none.logs.some((l) => l.startsWith("Board drained")),
    none.logs.join(" | "),
  );
  const plain = await runScript({ tickets: [T(5, "Normal", ["area:web"], "S")], impl: done });
  const p5 = plain.calls.find((c) => c.phase === "Implement");
  check(
    "normal ticket does not get the adopt text or flag",
    p5 && !p5.prompt.includes("ADOPTED") && p5.prompt.includes("prep.sh 5"),
  );
}

// 6. fallbacks and challenges
{
  const tickets = [
    T(1, "Rename the thing", ["area:web"], "M"),
    T(2, "Big risky", ["area:db"], "XL", { model: "Sonnet" }),
  ];
  const { logs, calls } = await runScript({ args: { batchSize: 5 }, tickets, impl: done });
  const log1 = logs.find((l) => l.includes("#1 (")) || "";
  check(
    "empty Kind plus Rename title falls back to codemod and says so",
    /#1 \(sonnet\/medium, codemod, alone; challenge: Kind empty/.test(log1),
    log1,
  );
  const second = logs.find((l) => l.startsWith("Batch 2")) || "";
  check(
    "Model=Sonnet on an XL ticket is followed but challenged",
    /#2 \(sonnet\/high, alone; challenge: Model=Sonnet on a large or risky ticket/.test(second),
    second,
  );
  check(
    "XL ticket runs alone even when it is not a codemod",
    calls.filter((c) => c.phase === "Implement").length === 2,
  );
}

// 7. follow-ups are filed through the ticket helper
{
  const withFollowUp = () => ({
    ...done(),
    followUps: [{ title: "x", problem: "p", where: "a.ts:1", kind: "bug" }],
  });
  const { calls } = await runScript({
    tickets: [T(1, "Normal", ["area:web"], "S")],
    impl: withFollowUp,
  });
  const filing = calls.find((c) => c.phase === "Follow-ups");
  check(
    "follow-up filing uses tools/backlog/ticket.mjs",
    filing?.prompt.includes("ticket.mjs create") && !filing.prompt.includes("gh issue create"),
  );
}

// 8. Haiku is a valid explicit choice
{
  let n = 0;
  const failing = (opts) => ({
    status: "done",
    summary: "s",
    files: ["a.md"],
    checks: red(opts.phase === "Implement" ? "a" : `b${n++}`),
  });
  const docs = [
    T(1, "Update the docs guide", ["area:docs"], "S", { model: "Haiku", kind: "Docs" }),
  ];
  const { calls } = await runScript({ tickets: docs, impl: failing });
  check(
    "Model=Haiku runs the implementer on Haiku",
    calls.find((c) => c.phase === "Implement")?.model === "haiku",
  );
  const fixes = calls.filter((c) => c.phase === "Verify");
  check(
    "Haiku ticket gets 3 fix rounds and escalates to Sonnet on the last",
    fixes.length === 3 && fixes[2].model === "sonnet",
    fixes.map((f) => f.model).join(","),
  );
  const green = await runScript({ tickets: docs, impl: docsDone });
  const land = green.calls.find((c) => c.label === "ship #1");
  check("a green Haiku ticket is credited to Haiku", land?.prompt.includes("Claude Haiku 5.5"));
  const big = await runScript({
    tickets: [T(2, "Big", ["area:db"], "L", { model: "Haiku" })],
    impl: done,
  });
  check(
    "Model=Haiku on a large or risky ticket is followed but challenged",
    big.logs.some((l) => l.includes("challenge: Model=Haiku")),
    big.logs.join(" | "),
  );
}

// 9. effort per ticket
{
  const eff = async (ticket, impl = done) => {
    const { calls } = await runScript({ tickets: [ticket], impl });
    return calls.find((c) => c.phase === "Implement")?.effort;
  };
  check(
    "Docs defaults to low effort",
    (await eff(T(1, "Docs", [], "S", { kind: "Docs" }))) === "low",
  );
  check(
    "a plain feature defaults to medium",
    (await eff(T(2, "Feature", ["area:web"], "M"))) === "medium",
  );
  check("a risky ticket defaults to high", (await eff(T(3, "Risky", ["area:db"], "M"))) === "high");
  check(
    "a codemod defaults to medium even when XL",
    (await eff(T(4, "Rename x", [], "XL", { kind: "Codemod" }))) === "medium",
  );
  check(
    "Effort=Extra is passed as xhigh",
    (await eff(T(5, "Hard", [], "S", { effort: "Extra" }))) === "xhigh",
  );
  check(
    "Effort=Low wins over a risky default",
    (await eff(T(6, "Risky", ["area:db"], "M", { effort: "Low" }))) === "low",
  );
  const failing = (opts) => ({
    status: "done",
    summary: "s",
    files: ["a.ts"],
    checks: red(`x${Math.random()}`.slice(0, 3) + opts.label),
  });
  const { calls } = await runScript({
    tickets: [T(7, "Normal", ["area:web"], "M")],
    impl: failing,
  });
  const fixes = calls.filter((c) => c.phase === "Verify");
  check(
    "the last fix round raises effort and model",
    fixes.length === 2 &&
      fixes[0].effort === "medium" &&
      fixes[1].effort === "high" &&
      fixes[1].model === "opus",
    fixes.map((f) => `${f.model}/${f.effort}`).join(","),
  );
  const risky = await runScript({
    tickets: [T(8, "Risky", ["area:db"], "M", { effort: "Low" })],
    impl: done,
  });
  check(
    "Effort=Low on a risky ticket is challenged",
    risky.logs.some((l) => l.includes("challenge: Effort=Low")),
    risky.logs.join(" | "),
  );
  const rev = (
    await runScript({ tickets: [T(9, "Core", ["area:core"], "M")], impl: done })
  ).calls.find((c) => c.phase === "Review");
  check("tenancy review runs at high effort", rev?.effort === "high");
}

// 10. paths: the PR flow and what a Kind changes
{
  const feature = await runScript({
    tickets: [T(1, "A feature", ["area:web"], "M", { kind: "Feature" })],
    impl: done,
  });
  const labels = feature.calls.filter((c) => c.phase === "Land").map((c) => c.label);
  check(
    "a feature is shipped, armed without waiting for CI",
    labels.join(",") === "ship #1,arm #1",
    labels.join(","),
  );
  check(
    "the result carries the PR",
    feature.result.armed[0]?.pr === "https://github.com/simpel/bibi/pull/101",
    JSON.stringify(feature.result.armed),
  );

  const docs = await runScript({
    tickets: [T(2, "Docs", ["area:core"], "S", { kind: "Docs" })],
    impl: docsDone,
  });
  const docsImpl = docs.calls.find((c) => c.phase === "Implement");
  check("docs run the light checks", docsImpl.prompt.includes("checks.sh --light"));
  check(
    "docs ship with light checks and no review",
    docs.calls.find((c) => c.label === "ship #2").prompt.includes("CHECKS_ARGS='--light'") &&
      !docs.calls.some((c) => c.phase === "Review"),
  );
  check(
    "docs skip the new-feature skill",
    !docsImpl.prompt.includes("new-feature skill") && docsImpl.prompt.includes("write-docs skill"),
  );

  const docsBad = await runScript({
    tickets: [T(3, "Docs", [], "S", { kind: "Docs" })],
    impl: (opts) => (opts.phase === "Implement" ? done() : docsDone()),
  });
  const fix3 = docsBad.calls.find((c) => c.phase === "Verify");
  check(
    "a code file in a docs ticket fails the docs-only gate and goes to a fix round",
    fix3?.prompt.includes("docs-only") && fix3.prompt.includes("a.ts"),
  );
  check("the docs ticket then ships", docsBad.result.armed.length === 1);

  const tests = await runScript({
    tickets: [T(4, "Tests", ["area:core"], "S", { kind: "Test" })],
    impl: (opts) =>
      opts.phase === "Implement" ? done() : { ...done(), files: ["packages/core/test/a.test.ts"] },
  });
  check(
    "a test ticket with a production file fails the tests-only gate",
    tests.calls.find((c) => c.phase === "Verify")?.prompt.includes("tests-only"),
  );
  check("a test ticket has no tenancy review", !tests.calls.some((c) => c.phase === "Review"));

  const decision = await runScript({
    tickets: [T(5, "Choose X", ["type:decision"], "S")],
    impl: () => ({ ...done(), files: ["docs/decisions/0061-x.md"] }),
  });
  const dl = decision.calls.filter((c) => c.phase === "Land").map((c) => c.label);
  check(
    "a decision PR is opened for review: no CI wait, no merge",
    dl.join(",") === "ship #5",
    dl.join(","),
  );
  check(
    "a decision ticket is reported as opened and runs review-only",
    decision.result.opened.length === 1 &&
      decision.calls.find((c) => c.label === "ship #5").prompt.includes("REVIEW_ONLY=1"),
  );
  check(
    "a decision PR is titled as docs even when Kind says Feature",
    decision.calls.find((c) => c.label === "ship #5").prompt.includes("KIND='Docs'"),
  );
  check(
    "decision tickets are picked, not skipped",
    decision.calls.find((c) => c.phase === "Implement")?.prompt.includes("Status: Proposed"),
  );

  const noAdr = await runScript({
    tickets: [T(6, "Choose Y", ["type:decision"], "S")],
    impl: (opts) =>
      opts.phase === "Implement"
        ? { ...done(), files: ["docs/notes.md"] }
        : { ...done(), files: ["docs/decisions/0062-y.md"] },
  });
  check(
    "a decision without an ADR file is sent back",
    noAdr.calls.find((c) => c.phase === "Verify")?.prompt.includes("adr-file"),
  );

  const bug = await runScript({
    tickets: [T(7, "Fix it", [], "S", { kind: "Bugfix" })],
    impl: (opts) =>
      opts.phase === "Implement"
        ? done()
        : { ...done(), repro: { test: "a.test.ts", failedBefore: true } },
  });
  check(
    "a bugfix without a failing test first is sent back for a repro",
    bug.calls.find((c) => c.phase === "Verify")?.prompt.includes("No failing test was shown"),
  );
  check("a bugfix with a repro ships", bug.result.armed.length === 1);
  const bugOk = await runScript({
    tickets: [T(8, "Fix it", [], "S", { kind: "Bugfix" })],
    impl: () => ({ ...done(), repro: { test: "a.test.ts", failedBefore: true } }),
  });
  check(
    "a bugfix that proved the bug needs no fix round",
    !bugOk.calls.some((c) => c.phase === "Verify"),
  );
  const bugSkip = await runScript({
    tickets: [T(9, "Fix it", [], "S", { kind: "Bugfix" })],
    impl: () => ({
      ...done(),
      repro: { test: "", failedBefore: false, skippedReason: "layout only" },
    }),
  });
  check(
    "a bugfix may skip the repro with a reason",
    !bugSkip.calls.some((c) => c.phase === "Verify"),
  );

  const techDebt = await runScript({
    tickets: [T(10, "Tidy", [], "S", { kind: "Tech debt" })],
    impl: done,
  });
  check(
    "tech debt gets the behaviour-preserving rules",
    techDebt.calls.find((c) => c.phase === "Implement").prompt.includes("refactor skill"),
  );
}

// 11. codemod residue gate and CI / merge recovery
{
  let n = 0;
  const hook = (opts) =>
    opts.label.startsWith("residue")
      ? { matches: n++ === 0 ? [{ name: "OldName", count: 3, files: ["a.ts"] }] : [] }
      : undefined;
  const r = await runScript({
    tickets: [
      T(1, "Rename a thing", [], "L", { kind: "Codemod", renames: ["OldName", "oldThing"] }),
    ],
    impl: done,
    hook,
  });
  const residueCall = r.calls.find((c) => c.label.startsWith("residue"));
  check(
    "the residue gate runs the script with the old names",
    residueCall?.prompt.includes("residue.sh") &&
      residueCall.prompt.includes("'OldName'") &&
      residueCall.prompt.includes("'oldThing'"),
  );
  check(
    "leftover old names go to a fix round, then ship",
    r.calls
      .find((c) => c.phase === "Verify" && c.label.startsWith("fix"))
      ?.prompt.includes("rename residue") && r.result.armed.length === 1,
  );

  const noRenames = await runScript({
    tickets: [T(2, "Rename b", [], "M", { kind: "Codemod" })],
    impl: done,
  });
  check(
    "a codemod without a Renames table skips the residue gate",
    !noRenames.calls.some((c) => c.label.startsWith("residue")),
  );

  const noWait = await runScript({
    tickets: [T(3, "No CI wait", [], "S", { kind: "Feature" })],
    impl: done,
  });
  check(
    "the run never polls CI: arm follows ship",
    noWait.calls
      .filter((c) => c.phase === "Land")
      .map((c) => c.label)
      .join(",") === "ship #3,arm #3" && noWait.result.armed.length === 1,
  );

  let merges = 0;
  const mergeHook = (opts) =>
    opts.label.startsWith("arm #")
      ? merges++ === 0
        ? { state: "conflict", files: "a.ts" }
        : { state: "armed", pr: 6 }
      : undefined;
  const conflict = await runScript({
    tickets: [T(6, "Merge conflict", [], "S", { kind: "Feature" })],
    impl: done,
    hook: mergeHook,
  });
  const resolve = conflict.calls.find((c) => c.label.startsWith("resolve"));
  check(
    "a conflict is resolved and the arm script resumed",
    resolve?.prompt.includes("arm.sh 6 --title") &&
      resolve.prompt.includes("--resume") &&
      conflict.result.armed.length === 1,
  );

  const two = await runScript({
    args: { batchSize: 3 },
    tickets: [T(7, "One", [], "S", { kind: "Feature" }), T(8, "Two", [], "S", { kind: "Feature" })],
    impl: done,
  });
  const order = two.calls.filter((c) => c.label.startsWith("arm")).map((c) => c.label);
  check("both tickets are armed", order.length === 2, order.join(","));
}

// 12. the run never merges and never waits for main after a ticket
{
  const green = await runScript({
    tickets: [T(1, "One", [], "S", { kind: "Feature" })],
    impl: done,
  });
  check(
    "no merge or main wait after a ticket",
    !green.calls.some((c) => /^(merge|main-ci p)/.test(c.label)),
  );
  check(
    "the ticket's PR gets auto-merge armed",
    green.calls.some((c) => c.label === "arm #1" && c.prompt.includes("arm.sh 1 --title")) &&
      green.result.armed.length === 1,
  );
  const decision = await runScript({
    tickets: [T(2, "Choose", ["type:decision"], "S")],
    impl: () => ({ ...done(), files: ["docs/decisions/0063-z.md"] }),
  });
  check(
    "a decision PR is opened, never armed",
    !decision.calls.some((c) => c.label.startsWith("arm")) && decision.result.opened.length === 1,
  );
}

// 12b. the workload gate
{
  const t = [T(1, "One", [], "S", { kind: "Feature" })];
  const inline = await runScript({
    tickets: t,
    impl: done,
    hook: (opts) =>
      opts.label === "gate"
        ? { path: "inline", reason: "1 ready", ready: [1], bundle: [] }
        : undefined,
  });
  check(
    "a small workload is refused before anything runs",
    !inline.calls.some((c) => c.phase === "Implement" || c.label.startsWith("select")) &&
      inline.result.fallback?.includes("work-tickets") &&
      inline.result.gate.path === "inline",
  );
  const none = await runScript({
    tickets: t,
    impl: done,
    hook: (opts) =>
      opts.label === "gate" ? { path: "none", reason: "empty", ready: [] } : undefined,
  });
  check("an empty board ends at the gate", none.result.fallback === null);
  const forced = await runScript({
    args: { force: true },
    tickets: t,
    impl: done,
    hook: (opts) =>
      opts.label === "gate" ? { path: "inline", reason: "x", ready: [1] } : undefined,
  });
  check(
    "force skips the gate",
    !forced.calls.some((c) => c.label === "gate") &&
      forced.calls.some((c) => c.phase === "Implement"),
  );
  const broken = await runScript({
    tickets: t,
    impl: done,
    hook: (opts) =>
      opts.label === "gate" ? { path: "failed", reason: "gh down", ready: [] } : undefined,
  });
  check(
    "a gate that cannot decide lets the run continue",
    broken.calls.some((c) => c.phase === "Implement"),
  );
  const adopt = await runScript({
    args: { adopt: [1] },
    tickets: [T(1, "One", [], "S", { kind: "Feature", status: "In progress" })],
    impl: done,
    hook: (opts) =>
      opts.label === "gate" ? { path: "inline", reason: "x", ready: [1] } : undefined,
  });
  check("adopt skips the gate", !adopt.calls.some((c) => c.label === "gate"));
}

// 12c. every run is recorded for later evaluation
{
  const rec = await runScript({
    tickets: [T(1, "One", [], "S", { kind: "Feature" })],
    impl: done,
    hook: (opts) =>
      opts.label === "gate"
        ? { path: "workflow", reason: "t", ready: [1], at: "2026-10-22T10:00:00.000Z" }
        : undefined,
  });
  const call = rec.calls.find((c) => c.label === "metrics");
  check(
    "a finished run is appended to the metrics log with its start",
    call?.prompt.includes("metrics.mjs record --path workflow --since 2026-10-22T10:00:00.000Z") &&
      call.prompt.includes('"outcome":"armed"') &&
      call.prompt.includes('"pr":101'),
    call?.prompt,
  );
  const refused = await runScript({
    tickets: [T(1, "One", [], "S", { kind: "Feature" })],
    impl: done,
    hook: (opts) =>
      opts.label === "gate"
        ? { path: "inline", reason: "1 ready", ready: [1], at: "2026-10-22T10:00:00.000Z" }
        : undefined,
  });
  check(
    "a gate refusal is recorded too",
    refused.calls.some((c) => c.label === "metrics" && c.prompt.includes("--path gate-inline")),
  );
}

// 13. the run does not start while main is red
{
  const t = [T(1, "One", [], "S", { kind: "Feature" })];
  const redMain = (opts) =>
    opts.label === "main-ci start"
      ? { state: "red", sha: "abc", url: "https://x/run/1" }
      : undefined;
  const blocked = await runScript({ tickets: t, impl: done, hook: redMain });
  check(
    "a red main stops the run before any ticket starts",
    !blocked.calls.some((c) => c.phase === "Implement") && blocked.result.mainRed?.sha === "abc",
  );
  check(
    "the refusal says how to continue",
    blocked.logs.some((l) => l.includes("ignoreMainRed")),
  );
  const forced = await runScript({
    args: { ignoreMainRed: true },
    tickets: t,
    impl: done,
    hook: redMain,
  });
  check(
    "ignoreMainRed starts anyway",
    forced.calls.some((c) => c.phase === "Implement") &&
      !forced.calls.some((c) => c.label === "main-ci start"),
  );
  const fine = await runScript({ tickets: t, impl: done });
  check(
    "a green or unknown main starts normally",
    fine.calls.some((c) => c.phase === "Implement"),
  );
  const off = await runScript({
    args: { mainCheck: false },
    tickets: t,
    impl: done,
    hook: redMain,
  });
  check(
    "mainCheck: false skips the start check too",
    off.calls.some((c) => c.phase === "Implement"),
  );
}

console.log(failed ? `\n${failed} FAILED` : "\nall passed");
process.exit(failed ? 1 : 0);
