#!/usr/bin/env node
// How the loop runs one ticket: model, effort, skill and budget, from the board fields.
//   node tools/loop/model.mjs '<ticket json from pick.mjs>'   prints { model, effort, skill, budgetUsd }
// The rules are the ones work-backlog used: the Model field wins; a codemod is Sonnet; L/XL, area:auth and area:db are Opus.

const MODELS = ["haiku", "sonnet", "opus"];
const EFFORT_OF = { low: "low", medium: "medium", high: "high", extra: "xhigh" };
// Dollars one session may spend before it is stopped and the ticket parked.
const BUDGET_USD = { XS: 2, S: 4, M: 8, L: 15, XL: 25 };
const SKILL_OF = {
  bugfix: "fix-bug",
  "tech debt": "refactor",
  test: "add-tests",
  docs: "write-docs",
  codemod: "codemod",
};

const kindOf = ({ ticket }) => (ticket.kind ?? "").toLowerCase();
const isCodemod = ({ ticket }) =>
  kindOf({ ticket }) === "codemod" || (!kindOf({ ticket }) && /^rename\b/i.test(ticket.title));
const isBig = ({ ticket }) => ["L", "XL"].includes(ticket.size);
const riskyArea = ({ ticket }) =>
  ticket.labels.includes("area:auth") || ticket.labels.includes("area:db");

export function pickModel({ ticket }) {
  const field = (ticket.model ?? "").toLowerCase();
  if (MODELS.includes(field)) return field;
  if (isCodemod({ ticket })) return "sonnet";
  if (isBig({ ticket }) || riskyArea({ ticket })) return "opus";
  return "sonnet";
}

export function pickEffort({ ticket, model }) {
  const field = EFFORT_OF[(ticket.effort ?? "").toLowerCase()];
  if (field) return field;
  if (kindOf({ ticket }) === "docs") return "low";
  if (isCodemod({ ticket })) return "medium";
  if (model === "opus" || isBig({ ticket }) || riskyArea({ ticket })) return "high";
  return "medium";
}

export function pickSkill({ ticket }) {
  if (ticket.labels.includes("type:decision")) return "add-adr";
  if (isCodemod({ ticket })) return "codemod";
  return SKILL_OF[kindOf({ ticket })] ?? "new-feature";
}

export function profile({ ticket }) {
  const model = pickModel({ ticket });
  return {
    model,
    effort: pickEffort({ ticket, model }),
    skill: pickSkill({ ticket }),
    budgetUsd: BUDGET_USD[ticket.size] ?? BUDGET_USD.M,
  };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  console.log(JSON.stringify(profile({ ticket: JSON.parse(process.argv[2]) })));
}
