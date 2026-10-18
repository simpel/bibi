import type { ExecuteContext } from "../../operations/context";
import type { DemoOrg } from "./types";

export type CheckDemoTicketsInput = { context: ExecuteContext; org: DemoOrg };

type Counts = Map<string, number>;

const countBy = ({ names }: { names: readonly string[] }): Counts =>
  names.reduce((counts, name) => counts.set(name, (counts.get(name) ?? 0) + 1), new Map());

/**
 * ADR 0043: the minimum phase configuration (one entry, one terminal phase), the number of
 * tickets and how many are in each phase, against the data files. Returns failure messages.
 */
export async function checkDemoTickets({ context, org }: CheckDemoTicketsInput): Promise<string[]> {
  const failures: string[] = [];
  const phases = await context.db.ticketPhase.findMany({});
  if (!phases.some((phase) => phase.entry)) failures.push(`${org.slug}: no entry phase`);
  if (!phases.some((phase) => phase.terminal)) failures.push(`${org.slug}: no terminal phase`);
  const entry = phases.find((phase) => phase.entry)?.name ?? "";
  const rows = await context.db.ticket.findMany({ select: { phase: { select: { name: true } } } });
  if (rows.length !== org.tickets.length) {
    failures.push(`${org.slug}: ${rows.length} tickets, expected ${org.tickets.length}`);
  }
  const actual = countBy({ names: rows.map((row) => row.phase.name) });
  const expected = countBy({ names: org.tickets.map((ticket) => ticket.phase ?? entry) });
  for (const [name, count] of expected) {
    const found = actual.get(name) ?? 0;
    if (found !== count)
      failures.push(`${org.slug}: ${found} tickets in ${name}, expected ${count}`);
  }
  return failures;
}
