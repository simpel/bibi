import type { ExecuteContext } from "../../operations/context";
import type { DemoLine } from "./ticket-types";
import type { DemoOrg } from "./types";

export type CheckDemoOptionQuantitiesInput = { context: ExecuteContext; org: DemoOrg };

type LineInput = { context: ExecuteContext; line: DemoLine };

/**
 * One seeded line with split options: each option line has its own quantity, and every quote of
 * its ticket that was sent froze each of them with that quantity (ADR 0082).
 */
async function checkLine({ context, line }: LineInput): Promise<string[]> {
  const parent = await context.db.line.findFirst({
    where: { name: line.name, item: { name: line.item } },
    select: { id: true, ticketId: true },
  });
  if (!parent) return [`line ${line.name} is missing`];
  const failures: string[] = [];
  const sent = await context.db.quote.findMany({
    where: { ticketId: parent.ticketId, quoteStatus: { not: "DRAFT" } },
    select: { id: true },
  });
  if (sent.length === 0) failures.push(`${line.name}: no sent quote`);
  for (const option of (line.options ?? []).filter((each) => each.quantity !== undefined)) {
    const row = await context.db.line.findFirst({
      where: { parentLineId: parent.id, item: { name: option.name } },
      select: { id: true, quantity: true },
    });
    if (!row || row.quantity !== option.quantity) {
      failures.push(`${line.name}: ${option.name} has quantity ${row?.quantity ?? "none"}`);
      continue;
    }
    for (const quote of sent) {
      const frozen = await context.db.orderLine.findFirst({
        where: { quoteId: quote.id, lineId: row.id },
        select: { quantity: true },
      });
      if (frozen?.quantity !== option.quantity) {
        const got = frozen?.quantity ?? "no order line";
        failures.push(`${line.name}: quote ${quote.id} froze ${option.name} as ${got}`);
      }
    }
  }
  return failures;
}

/**
 * ADR 0082: every line the data files give split options (L9's team dinner 10 + 4, L11's lunch
 * 7 + 3) stores each option's quantity, and its ticket's sent quote snapshots them. Returns failures.
 */
export async function checkDemoOptionQuantities({
  context,
  org,
}: CheckDemoOptionQuantitiesInput): Promise<string[]> {
  const lines = org.tickets
    .flatMap((ticket) => ticket.lines ?? [])
    .filter((line) => line.options?.some((option) => option.quantity !== undefined));
  const failures: string[] = [];
  for (const line of lines) failures.push(...(await checkLine({ context, line })));
  return failures.map((failure) => `${org.slug}: ${failure}`);
}
