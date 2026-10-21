import { expireTicketHolds } from "../../features/ticket/expire-holds-operation";
import type { ExecuteContext } from "../../operations/context";
import { execute } from "../../operations/execute";
import { lineHoldsReconciliation } from "./line-holds-reconcile";
import { runReconciliations } from "./reconcile";
import type { DemoLine, DemoTicket } from "./ticket-types";
import type { DemoOrg } from "./types";

export type CheckDemoHoldsInput = { context: ExecuteContext; org: DemoOrg };

/**
 * `initial`: the line should still be in its type's initial state (a lead without override).
 * `expired`: it should be released after expiry, or already by the customer's pick (ADR 0052).
 */
type Expected = DemoLine & { day: number; expired: boolean; initial: boolean };

/** An option the customer did not pick in a chosen alternative group (released, ADR 0052). */
const pickedAway = ({ ticket, line }: { ticket: DemoTicket; line: DemoLine }) =>
  (ticket.alternatives ?? []).some(
    (group) => group.chosen && group.chosen !== line.name && group.lines.includes(line.name),
  );

const SELECT = {
  id: true,
  name: true,
  // "Held since" is the newest state change (ADR 0054); `seq` orders changes strictly.
  stateChanges: { select: { seq: true }, orderBy: { seq: "desc" }, take: 1 },
  state: { select: { name: true, initial: true, released: true, hold: true } },
} as const;

/** The seeded lines by name, in data order, with their state. */
async function loadLines({ context, lines }: { context: ExecuteContext; lines: Expected[] }) {
  const rows = await context.db.line.findMany({
    where: { name: { in: lines.map((line) => line.name) } },
    select: SELECT,
  });
  return lines.map((line) => ({ line, row: rows.find((row) => row.name === line.name) }));
}

type Loaded = Awaited<ReturnType<typeof loadLines>>;

/**
 * Lines on one item at the same time are in soft-hold states, held in data order (no queue, ADR
 * 0044). That their occupancy matches is the reconciliation's job (ADR 0053).
 */
function checkOverlaps({ loaded }: { loaded: Loaded }) {
  const failures: string[] = [];
  const key = ({ line }: { line: Expected }) => `${line.day} ${line.item} ${line.from}-${line.to}`;
  const keys = [...new Set(loaded.map(({ line }) => key({ line })))];
  for (const label of keys) {
    const group = loaded.filter(({ line }) => key({ line }) === label);
    if (group.length < 2) continue;
    const soft = group.filter(({ row }) => row?.state?.hold === "SOFT").length;
    if (soft !== group.length) failures.push(`${label}: ${soft} soft holds`);
    const held = group.map(({ row }) => row?.stateChanges[0]?.seq ?? 0);
    if (held.some((time, index) => index > 0 && time <= (held[index - 1] ?? 0))) {
      failures.push(`${label}: held since is not in the order the lines were held`);
    }
  }
  return failures;
}

/**
 * Checks 5 and 6 of `docs/demo-seed.md` (ADR 0044): every seeded line of a lead without an
 * override starts in its type's initial state, overlapping lines are soft holds ordered by when they were held (state history), and after
 * `ticket.expireHolds` the lines of tickets whose holdsUntil has passed are released while the
 * others keep their state. Returns failure messages.
 */
export async function checkDemoHolds({ context, org }: CheckDemoHoldsInput): Promise<string[]> {
  const lines = org.tickets.flatMap((ticket) =>
    (ticket.lines ?? []).map((line) => ({
      ...line,
      day: ticket.day,
      expired: (ticket.holdsUntilDay ?? 0) < 0 || pickedAway({ ticket, line }),
      initial: !ticket.phase && !line.state,
    })),
  );
  if (lines.length === 0) return [];
  const failures: string[] = [];
  const before = await loadLines({ context, lines });
  for (const { line, row } of before) {
    if (line.initial && !row?.state?.initial) {
      failures.push(`${org.slug}: ${line.name} is not in its initial state`);
    }
  }
  failures.push(...checkOverlaps({ loaded: before }));
  const run = await execute({ operation: expireTicketHolds, input: {}, context });
  if (!run.ok) return [...failures, `${org.slug}: ticket.expireHolds failed`];
  // The released lines' holds are gone, the others' kept: checked against the lines.
  failures.push(...(await runReconciliations({ context, checks: [lineHoldsReconciliation] })));
  for (const { line, row } of await loadLines({ context, lines })) {
    const released = row?.state?.released ?? false;
    if (released !== line.expired) {
      failures.push(`${org.slug}: ${line.name} is ${row?.state?.name ?? "stateless"} after expiry`);
    }
  }
  return failures.map((failure) =>
    failure.startsWith(org.slug) ? failure : `${org.slug}: ${failure}`,
  );
}
