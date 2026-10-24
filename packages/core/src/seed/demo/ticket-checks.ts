import type { ExecuteContext } from "../../operations/context";
import type { DemoOrg } from "./types";

export type CheckDemoTicketsInput = { context: ExecuteContext; org: DemoOrg };

type Counts = Map<string, number>;

const countBy = ({ names }: { names: readonly string[] }): Counts =>
  names.reduce((counts, name) => counts.set(name, (counts.get(name) ?? 0) + 1), new Map());

/**
 * ADR 0043: the minimum status configuration (one entry, one closing status), the number of
 * tickets and how many are in each status, against the data files. Returns failure messages.
 */
export async function checkDemoTickets({ context, org }: CheckDemoTicketsInput): Promise<string[]> {
  const failures: string[] = [];
  const statuses = await context.db.ticketStatus.findMany({});
  if (!statuses.some((ticketStatus) => ticketStatus.entry))
    failures.push(`${org.slug}: no entry status`);
  if (!statuses.some((ticketStatus) => ticketStatus.closes))
    failures.push(`${org.slug}: no closing status`);
  const entry = statuses.find((ticketStatus) => ticketStatus.entry)?.name ?? "";
  const rows = await context.db.ticket.findMany({
    select: { ticketStatus: { select: { name: true } } },
  });
  if (rows.length !== org.tickets.length) {
    failures.push(`${org.slug}: ${rows.length} tickets, expected ${org.tickets.length}`);
  }
  const actual = countBy({ names: rows.map((row) => row.ticketStatus.name) });
  const expected = countBy({ names: org.tickets.map((ticket) => ticket.status ?? entry) });
  for (const [name, count] of expected) {
    const found = actual.get(name) ?? 0;
    if (found !== count)
      failures.push(`${org.slug}: ${found} tickets in ${name}, expected ${count}`);
  }
  return failures;
}
