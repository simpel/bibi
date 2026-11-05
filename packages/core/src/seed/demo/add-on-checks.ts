import type { ExecuteContext } from "../../operations/context";
import type { DemoLine } from "./order-types";
import { seededOrderLines } from "./seeded-order-lines";
import type { DemoOrg } from "./types";

export type CheckDemoAddOnsInput = { context: ExecuteContext; org: DemoOrg };

type Db = { context: ExecuteContext };
type Parent = { id: string; orderId: string; startsAt: Date | null };

/** The parent's sub-lines: options are OPTION, the data's add-ons ADD_ON with its period or own. */
async function checkRoles({ context, line, parent }: Db & { line: DemoLine; parent: Parent }) {
  const failures: string[] = [];
  const subLines = await context.db.line.findMany({
    where: { parentLineId: parent.id },
    select: { name: true, role: true, startsAt: true },
  });
  for (const option of line.options ?? []) {
    const row = subLines.find((each) => each.name === option.name);
    if (row?.role !== "OPTION") failures.push(`${option.name} is not an OPTION line`);
  }
  for (const addOn of line.addOns ?? []) {
    const row = subLines.find((each) => each.name === addOn.name);
    if (row?.role !== "ADD_ON") {
      failures.push(`${addOn.name} is not an ADD_ON line`);
      continue;
    }
    const inherits = addOn.from === undefined;
    if (inherits && row.startsAt?.getTime() !== parent.startsAt?.getTime()) {
      failures.push(`${addOn.name} does not take its line's period`);
    }
  }
  return failures;
}

type Row = { lineId: string; parentLineId: string | null; position: number };

/** The parent's sub-lines come right after it on the quote (ADR 0088: shown indented under it). */
function followsParent({ rows, parentId }: { rows: readonly Row[]; parentId: string }) {
  const sorted = [...rows].sort((a, b) => a.position - b.position);
  const at = sorted.findIndex((row) => row.lineId === parentId);
  const count = rows.filter((row) => row.parentLineId === parentId).length;
  const next = sorted.slice(at + 1, at + 1 + count);
  return at >= 0 && next.every((row) => row.parentLineId === parentId);
}

/** Every quote of the order that was sent froze each add-on under its parent, in the total. */
async function checkQuotes({ context, line, parent }: Db & { line: DemoLine; parent: Parent }) {
  const quotes = await context.db.quote.findMany({
    where: { orderId: parent.orderId, quoteStatus: { not: "DRAFT" } },
    select: { id: true, totalExclVatMinor: true, lines: true },
  });
  if (quotes.length === 0) return ["no sent quote"];
  const failures: string[] = [];
  for (const quote of quotes) {
    const counted = quote.lines.filter((row) => row.inTotal);
    const sum = counted.reduce((total, row) => total + row.totalExclVatMinor, 0);
    if (sum !== quote.totalExclVatMinor) failures.push(`quote ${quote.id}: total ≠ its lines`);
    if (!followsParent({ rows: quote.lines, parentId: parent.id })) {
      failures.push(`quote ${quote.id}: the sub-lines do not follow their line`);
    }
    for (const addOn of line.addOns ?? []) {
      const row = quote.lines.find((each) => each.name === addOn.name);
      const nested = row?.role === "ADD_ON" && row.parentLineId === parent.id && row.inTotal;
      if (!nested || row.totalExclVatMinor <= 0) {
        failures.push(`quote ${quote.id}: ${addOn.name} is not a counted ADD_ON under its line`);
      }
    }
  }
  return failures;
}

/**
 * ADR 0088: every line the data files give add-ons (L11's board meeting and break buffet) has
 * them as ADD_ON lines under it (its options as OPTION lines), and its order's sent quotes
 * freeze each add-on as an order line with role ADD_ON under that line, counted in the totals.
 * Returns failures.
 */
export async function checkDemoAddOns({ context, org }: CheckDemoAddOnsInput): Promise<string[]> {
  const lines = await seededOrderLines({
    ...{ context, org },
    where: ({ line }) => (line.addOns ?? []).length > 0,
  });
  const failures: string[] = [];
  for (const { line, orderId } of lines) {
    const parent = orderId
      ? await context.db.line.findFirst({
          where: { orderId, name: line.name, item: { name: line.item }, role: null },
          select: { id: true, orderId: true, startsAt: true },
        })
      : null;
    const found = parent
      ? [
          ...(await checkRoles({ context, line, parent })),
          ...(await checkQuotes({ context, line, parent })),
        ]
      : ["is missing"];
    failures.push(...found.map((failure) => `${org.slug}: ${line.name}: ${failure}`));
  }
  return failures;
}
