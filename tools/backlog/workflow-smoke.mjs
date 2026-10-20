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

async function runScript({ args = {}, tickets, impl, review }) {
  const calls = [];
  const logs = [];
  const agent = async (prompt, opts) => {
    calls.push({ prompt, ...opts });
    if (opts.label.startsWith("select")) {
      const excluded = (prompt.match(/--exclude ([\d,]+)/)?.[1] ?? "").split(",").map(Number);
      return { ok: true, tickets: tickets.filter((t) => !excluded.includes(t.number)) };
    }
    if (opts.phase === "Implement") return impl(opts, prompt);
    if (opts.phase === "Verify") return impl(opts, prompt);
    if (opts.phase === "Review") return review ? review(opts) : { ok: true, findings: [] };
    if (opts.phase === "Land") return { state: "landed", sha: "abc1234" };
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
  check("XL without area:db is Opus", /#1 \(opus, alone\)/.test(batch), batch);
  check("small web ticket is Sonnet", /#2 \(sonnet\)/.test(batch), batch);
  check(
    "Model=Sonnet beats area:db and size L",
    /#3 \(sonnet; challenge: Model=Sonnet/.test(batch),
    batch,
  );
  check("Kind=Codemod runs on Sonnet", /#4 \(sonnet, codemod, alone\)/.test(batch), batch);
  check("area:auth is Opus", /#5 \(opus\)/.test(batch), batch);
  const impl4 = calls.find((c) => c.phase === "Implement" && c.label.startsWith("#4 "));
  check(
    "codemod prompt only on the codemod ticket",
    impl4?.prompt.includes("mechanical rename") &&
      !calls.find((c) => c.label.startsWith("#2 ")).prompt.includes("mechanical rename"),
  );
  check(
    "codemod prompt renames symbols with the compiler, not a text replace",
    impl4?.prompt.includes("ts-morph") && impl4.prompt.includes("Let the compiler find the rest"),
  );
  check(
    "codemod script lives outside the git tree",
    impl4?.prompt.includes("okazi-worktrees/.scratch/t-4"),
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
  const land1 = calls.find((c) => c.label === "land #1");
  const land2 = calls.find((c) => c.label === "land #2");
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
    /#1 \(sonnet, codemod, alone; challenge: Kind empty/.test(log1),
    log1,
  );
  const second = logs.find((l) => l.startsWith("Batch 2")) || "";
  check(
    "Model=Sonnet on an XL ticket is followed but challenged",
    /#2 \(sonnet, alone; challenge: Model=Sonnet on a large or risky ticket/.test(second),
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

console.log(failed ? `\n${failed} FAILED` : "\nall passed");
process.exit(failed ? 1 : 0);
