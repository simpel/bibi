import { getLine } from "../../features/line/operations";
import type { ExecuteContext } from "../../operations/context";
import { execute } from "../../operations/execute";
import type { DemoOrg } from "./types";

export type CheckDemoChoiceDefaultsInput = { context: ExecuteContext; org: DemoOrg };

type Ctx = { context: ExecuteContext };

/** Each package line's stored defaults match the data files, by option item name. */
async function templateFailures({ context, org }: CheckDemoChoiceDefaultsInput) {
  const failures: string[] = [];
  for (const line of org.templates.flatMap((template) => template.lines)) {
    const rows = await context.db.ticketTemplateLineOption.findMany({
      where: { templateLine: { name: line.name } },
      select: { item: { select: { name: true } } },
      orderBy: { position: "asc" },
    });
    const got = rows.map((row) => row.item.name).join(", ");
    const want = (line.options ?? []).join(", ");
    if (got !== want) failures.push(`${line.name}: defaults "${got}", expected "${want}"`);
  }
  return failures;
}

/** A line made from a package with a default has it as its option line (createFromTemplate). */
async function appliedFailures({ context, org }: CheckDemoChoiceDefaultsInput) {
  const failures: string[] = [];
  const used = new Set(org.tickets.flatMap((ticket) => (ticket.template ? [ticket.template] : [])));
  const lines = org.templates
    .filter((template) => used.has(template.name))
    .flatMap((template) => template.lines.filter((line) => (line.options ?? []).length > 0));
  for (const line of lines) {
    const row = await context.db.line.findFirst({ where: { name: line.name, role: null } });
    const options = await context.db.line.findMany({
      where: { parentLineId: row?.id ?? "", role: "OPTION" },
      select: { item: { select: { name: true } } },
    });
    const got = options.map((option) => option.item?.name).join(", ");
    if (got !== (line.options ?? []).join(", ")) failures.push(`${line.name}: chose "${got}"`);
  }
  return failures;
}

/** Lines the data files leave with an open required choice carry the warning. */
async function openFailures({ context }: Ctx) {
  const row = await context.db.line.findFirst({ where: { name: "Morning coffee", role: null } });
  if (!row) return [];
  const line = await execute({ operation: getLine, input: { id: row.id }, context });
  const open = line.ok && line.value.warnings.some((w) => w.kind === "UNCHOSEN_REQUIRED_GROUP");
  return open ? [] : ["Morning coffee: no UNCHOSEN_REQUIRED_GROUP warning"];
}

/**
 * ADR 0089: the packages' default choices are stored as the data files say, a ticket made from
 * such a package chose them, and a line left with its snack open warns. Returns failures.
 */
export async function checkDemoChoiceDefaults({ context, org }: CheckDemoChoiceDefaultsInput) {
  const input = { context, org };
  return [
    ...(await templateFailures(input)),
    ...(await appliedFailures(input)),
    ...(await openFailures(input)),
  ];
}
