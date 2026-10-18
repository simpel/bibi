import { expireTicketHolds } from "../../features/ticket/expire-holds-operation";
import type { ExecuteContext } from "../../operations/context";
import { execute } from "../../operations/execute";
import type { DemoLine } from "./ticket-types";
import type { DemoOrg } from "./types";

export type CheckDemoHoldsInput = { context: ExecuteContext; org: DemoOrg };

type Expected = DemoLine & { expired: boolean };

const SELECT = {
  id: true,
  name: true,
  heldAt: true,
  state: { select: { name: true, initial: true, released: true } },
} as const;

/** The seeded lines by name, in data order, with their state. */
async function loadLines({ context, lines }: { context: ExecuteContext; lines: Expected[] }) {
  const rows = await context.db.programItem.findMany({
    where: { name: { in: lines.map((line) => line.name) } },
    select: SELECT,
  });
  return lines.map((line) => ({ line, row: rows.find((row) => row.name === line.name) }));
}

type Loaded = Awaited<ReturnType<typeof loadLines>>;

/** Lines on one item at the same time are soft holds held in data order (no queue, ADR 0044). */
async function checkOverlaps({ context, loaded }: { context: ExecuteContext; loaded: Loaded }) {
  const failures: string[] = [];
  const key = ({ line }: { line: DemoLine }) => `${line.item} ${line.from}-${line.to}`;
  const keys = [...new Set(loaded.map(({ line }) => key({ line })))];
  for (const label of keys) {
    const group = loaded.filter(({ line }) => key({ line }) === label);
    if (group.length < 2) continue;
    const ids = group.flatMap(({ row }) => (row ? [row.id] : []));
    const soft = await context.db.occupancy.count({
      where: { sourceId: { in: ids }, type: "HOLD", holdKind: "SOFT" },
    });
    if (soft !== group.length) failures.push(`${label}: ${soft} soft holds`);
    const held = group.map(({ row }) => row?.heldAt.getTime() ?? 0);
    if (held.some((time, index) => index > 0 && time <= (held[index - 1] ?? 0))) {
      failures.push(`${label}: heldAt is not in the order the lines were held`);
    }
  }
  return failures;
}

/**
 * Checks 5 and 6 of `docs/demo-seed.md` (ADR 0044): every seeded line starts in its type's
 * initial state, overlapping lines are soft holds ordered by `heldAt`, and after
 * `ticket.expireHolds` the lines of tickets whose holdsUntil has passed are released while the
 * others keep their state. Returns failure messages.
 */
export async function checkDemoHolds({ context, org }: CheckDemoHoldsInput): Promise<string[]> {
  const lines = org.tickets.flatMap((ticket) =>
    (ticket.lines ?? []).map((line) => ({ ...line, expired: (ticket.holdsUntilDay ?? 0) < 0 })),
  );
  if (lines.length === 0) return [];
  const failures: string[] = [];
  const before = await loadLines({ context, lines });
  for (const { line, row } of before) {
    if (!row?.state?.initial)
      failures.push(`${org.slug}: ${line.name} is not in its initial state`);
  }
  failures.push(...(await checkOverlaps({ context, loaded: before })));
  const run = await execute({ operation: expireTicketHolds, input: {}, context });
  if (!run.ok) return [...failures, `${org.slug}: ticket.expireHolds failed`];
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
