import { listLines } from "../../features/line/operations";
import type { LineDto } from "../../features/line/schema";
import type { ExecuteContext } from "../../operations/context";
import { execute } from "../../operations/execute";
import type { DemoOrg } from "./types";

export type CheckDemoPricesInput = { context: ExecuteContext; org: DemoOrg };

type Ctx = { context: ExecuteContext };

/** Every active line through `line.list`, page by page. */
async function allLines({ context }: Ctx): Promise<LineDto[] | null> {
  const lines: LineDto[] = [];
  let cursor: string | undefined;
  do {
    const page = await execute({
      operation: listLines,
      input: { limit: 100, ...(cursor ? { cursor } : {}) },
      context,
    });
    if (!page.ok) return null;
    lines.push(...page.value.items);
    cursor = page.value.nextCursor ?? undefined;
  } while (cursor);
  return lines;
}

type Expected = { value: number | null; source: LineDto["unitPriceSource"] };

/** The price each line should show, read straight from the owned rows (ADR 0052). */
async function expectedPrice({ context, line }: Ctx & { line: LineDto }): Promise<Expected> {
  if (line.unitPriceMinor !== null) return { value: line.unitPriceMinor, source: "LINE" };
  if (!line.itemId) return { value: null, source: null };
  const ticket = await context.db.ticket.findFirst({ where: { id: line.ticketId } });
  const agreed = await context.db.priceListItem.findFirst({
    where: { itemId: line.itemId, priceList: { customerId: ticket?.customerId ?? "" } },
  });
  if (agreed) return { value: agreed.priceMinor, source: "PRICE_LIST" };
  const item = await context.db.item.findFirst({ where: { id: line.itemId } });
  const price = item?.priceMinor ?? null;
  return { value: price, source: price === null ? null : "ITEM" };
}

/** A line without its own quantity counts the ticket's headcount. */
const quantityFailure = ({ line }: { line: LineDto }) =>
  line.quantity === null && line.quantitySource === "LINE"
    ? [`${line.name}: has no quantity but its source is LINE`]
    : [];

/**
 * Check 11 (ADR 0052): the effective price of every line equals its expected source (the line's
 * override, else the customer's agreed price, else the item's), lines without a quantity inherit
 * the headcount, and the data's price overrides and untimed lines (which hold nothing) are as given.
 */
export async function checkDemoPrices({ context, org }: CheckDemoPricesInput): Promise<string[]> {
  const lines = await allLines({ context });
  if (!lines) return [`${org.slug}: could not list lines`];
  const failures: string[] = [];
  for (const line of lines) {
    const expected = await expectedPrice({ context, line });
    if (
      line.effectiveUnitPriceMinor !== expected.value ||
      line.unitPriceSource !== expected.source
    ) {
      failures.push(
        `${org.slug}: ${line.name} costs ${line.effectiveUnitPriceMinor} (${line.unitPriceSource}), ` +
          `expected ${expected.value} (${expected.source})`,
      );
    }
    failures.push(...quantityFailure({ line }));
  }
  const want = org.tickets.flatMap((ticket) => ticket.lines ?? []);
  failures.push(...(await checkSpecials({ context, org, lines, want })));
  return failures;
}

type SpecialsInput = CheckDemoPricesInput & {
  lines: LineDto[];
  want: { name: string; from?: string; unitPriceKr?: number }[];
};

/** The data's price overrides and untimed lines exist as given; untimed ones hold nothing. */
async function checkSpecials({ context, org, lines, want }: SpecialsInput) {
  const failures: string[] = [];
  for (const line of want) {
    const row = lines.find((candidate) => candidate.name === line.name);
    if (line.unitPriceKr !== undefined && row?.unitPriceMinor !== line.unitPriceKr * 100) {
      failures.push(`${org.slug}: ${line.name} lacks its price override`);
    }
    if (line.from || !row) continue;
    const holds = await context.db.occupancy.count({ where: { sourceId: row.id } });
    if (row.startsAt !== null || holds > 0)
      failures.push(`${org.slug}: ${line.name} is not untimed`);
  }
  return failures;
}
