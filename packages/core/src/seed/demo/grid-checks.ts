import { changeTicketPhase } from "../../features/ticket/change-phase-operation";
import type { ExecuteContext } from "../../operations/context";
import { execute } from "../../operations/execute";
import type { DemoTicket } from "./ticket-types";
import type { DemoOrg } from "./types";

type Ctx = { context: ExecuteContext };

const SELECT = {
  name: true,
  ticketId: true,
  stateOverridden: true,
  state: { select: { name: true } },
  item: { select: { entityType: { select: { name: true } } } },
} as const;

/** The ticket's seeded lines by name, with state and item type. */
const loadLines = ({ context, ticket }: Ctx & { ticket: DemoTicket }) =>
  context.db.programItem.findMany({
    where: { name: { in: (ticket.lines ?? []).map((line) => line.name) } },
    select: SELECT,
  });

type Lines = Awaited<ReturnType<typeof loadLines>>;
type ExpectInput = { org: DemoOrg; ticket: DemoTicket; before: Lines; after: Lines };

/** What each line should be in after the move: its override, the target cell, or unchanged. */
function moveFailures({ org, ticket, before, after }: ExpectInput): string[] {
  const move = ticket.checkMove;
  if (!move) return [];
  return (ticket.lines ?? []).flatMap((line) => {
    const was = before.find((row) => row.name === line.name);
    const now = after.find((row) => row.name === line.name);
    const type = was?.item?.entityType.name;
    const cell = org.pipeline.find((row) => row.phase === move.to && row.type === type);
    const expected =
      move.blocked || line.state ? was?.state?.name : (cell?.state ?? was?.state?.name);
    if (now?.state?.name === expected && now?.stateOverridden === Boolean(line.state)) return [];
    return [
      `${ticket.ref}: ${line.name} is ${now?.state?.name ?? "stateless"}, expected ${expected}`,
    ];
  });
}

type CheckTicketInput = Ctx & { org: DemoOrg; ticket: DemoTicket };

async function checkTicket({ context, org, ticket }: CheckTicketInput): Promise<string[]> {
  const move = ticket.checkMove;
  const before = await loadLines({ context, ticket });
  const ticketId = before[0]?.ticketId;
  if (!move || !ticketId) return [`${ticket.ref}: no lines to move`];
  const phase = await context.db.ticketPhase.findFirst({ where: { name: move.to } });
  if (!phase) return [`${ticket.ref}: no phase ${move.to}`];
  const input = { ticketId, phaseId: phase.id };
  const result = await execute({ operation: changeTicketPhase, input, context });
  const lineBlockers = result.ok
    ? []
    : result.error.issues.filter((i) => i.path.startsWith("lines."));
  const failures: string[] = [];
  if (move.blocked && lineBlockers.length === 0)
    failures.push(`${ticket.ref}: the move was not blocked by a line`);
  if (!move.blocked && !result.ok) failures.push(`${ticket.ref}: ${result.error.message}`);
  const after = await loadLines({ context, ticket });
  return [...failures, ...moveFailures({ org, ticket, before, after })];
}

/**
 * The phase grid checks of `docs/demo-seed.md` (ADR 0044): every ticket with a `checkMove` is
 * moved with `ticket.changePhase`. A blocked move must be refused by a line (a hard hold
 * collision) and change nothing; an allowed one must move the lines to the target phase's cells,
 * keep lines whose cell is empty and skip overridden lines. Returns failure messages.
 */
export async function checkDemoGrid({ context, org }: Ctx & { org: DemoOrg }): Promise<string[]> {
  const failures: string[] = [];
  for (const ticket of org.tickets.filter((row) => row.checkMove)) {
    failures.push(...(await checkTicket({ context, org, ticket })));
  }
  return failures.map((failure) => `${org.slug}: ${failure}`);
}
