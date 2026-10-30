import type { ExecuteContext } from "../../operations/context";
import { ITEM_STATE_TEMPLATES } from "../../templates/item-states/item-state-templates";
import type { DemoOrg } from "./types";

export type CheckDemoPipelineInput = { context: ExecuteContext; org: DemoOrg };

type CountInput = { slug: string; what: string; found: number; expected: number };

const countFailure = ({ slug, what, found, expected }: CountInput) =>
  found === expected ? [] : [`${slug}: ${found} ${what}, expected ${expected}`];

/** States the data files give the item types: a template's states, else the one "Active". */
function expectedStates({ org }: { org: DemoOrg }): number {
  return org.config.types
    .filter((type) => type.base === "ITEM")
    .reduce((sum, type) => sum + (type.states ? ITEM_STATE_TEMPLATES[type.states].length : 1), 0);
}

/** Counts and the minimum configuration of the statuses and the grid. */
async function statusFailures({ context, org }: CheckDemoPipelineInput): Promise<string[]> {
  const { slug, pipeline } = org;
  const statuses = await context.db.ticketStatus.findMany({ where: { status: "ACTIVE" } });
  const transitions = await context.db.ticketStatusTransition.count();
  const cells = await context.db.statusStateRule.count();
  const entries = statuses.filter((ticketStatus) => ticketStatus.entry).length;
  const failures = [
    ...countFailure({
      slug,
      what: "statuses",
      found: statuses.length,
      expected: pipeline.statuses.statuses.length,
    }),
    ...countFailure({
      slug,
      what: "status transitions",
      found: transitions,
      expected: pipeline.statuses.transitions.length,
    }),
    ...countFailure({ slug, what: "grid cells", found: cells, expected: pipeline.cells.length }),
    ...countFailure({ slug, what: "entry statuses", found: entries, expected: 1 }),
  ];
  if (!statuses.some((ticketStatus) => ticketStatus.closes))
    failures.push(`${slug}: no closing status`);
  // Every template transition carries the gates of its target (`gatesIn`, ADR 0067 §5).
  const gatesIn = new Map(pipeline.statuses.statuses.map((s) => [s.name, s.gatesIn ?? []]));
  const expected = pipeline.statuses.transitions.reduce(
    (sum, [, to]) => sum + (gatesIn.get(to)?.length ?? 0),
    0,
  );
  const found = await context.db.ticketStatusTransitionGate.count();
  failures.push(...countFailure({ slug, what: "transition gates", found, expected }));
  return failures;
}

/**
 * The status history (ADR 0054): every ticket's first change is its start (no `fromStatusId`, by
 * `TEMPLATE` for each ticket made from a predefined ticket, else `MANUAL`), and a ticket in a
 * status with a quote event got there by `QUOTE_EVENT` (or started there from a template). That `statusId` is the newest change is the
 * reconciliation's job.
 */
async function historyFailures({ context, org }: CheckDemoPipelineInput): Promise<string[]> {
  const { slug } = org;
  const tickets = await context.db.ticket.findMany({
    select: {
      reference: true,
      ticketStatus: { select: { event: true } },
      statusChanges: { select: { fromStatusId: true, trigger: true }, orderBy: { seq: "asc" } },
    },
  });
  const failures: string[] = [];
  for (const { reference, ticketStatus, statusChanges } of tickets) {
    const first = statusChanges[0];
    if (!first || first.fromStatusId !== null || !["MANUAL", "TEMPLATE"].includes(first.trigger)) {
      failures.push(`${slug}: ticket #${reference} has no start in its status history`);
    }
    const byEvent = statusChanges.some((change) => change.trigger === "QUOTE_EVENT");
    if (ticketStatus.event && !byEvent && first?.trigger !== "TEMPLATE") {
      failures.push(`${slug}: ticket #${reference} reached its event status by hand`);
    }
  }
  const found = tickets.filter((ticket) => ticket.statusChanges[0]?.trigger === "TEMPLATE").length;
  const expected = org.tickets.filter((ticket) => ticket.template).length;
  return [...failures, ...countFailure({ slug, what: "template starts", found, expected })];
}

/** The state count against the data files and one initial state per item type. */
async function stateFailures({ context, org }: CheckDemoPipelineInput): Promise<string[]> {
  const slug = org.slug;
  const types = await context.db.entityType.findMany({ where: { status: "ACTIVE", base: "ITEM" } });
  const states = await context.db.itemState.findMany({ where: { status: "ACTIVE" } });
  const failures = countFailure({
    slug,
    what: "item states",
    found: states.length,
    expected: expectedStates({ org }),
  });
  for (const type of types) {
    const initial = states.filter((state) => state.entityTypeId === type.id && state.initial);
    failures.push(
      ...countFailure({
        slug,
        what: `initial states of ${type.name}`,
        found: initial.length,
        expected: 1,
      }),
    );
  }
  return failures;
}

/**
 * ADR 0043 and 0044: the status, transition, state and grid cell counts against the data files,
 * the minimum configuration (one entry and one closing status) and that every item type has
 * exactly one initial state. Run before the grid checks move any ticket. Returns failures.
 */
export async function checkDemoPipeline({
  context,
  org,
}: CheckDemoPipelineInput): Promise<string[]> {
  const input = { context, org };
  return [
    ...(await statusFailures(input)),
    ...(await stateFailures(input)),
    ...(await historyFailures(input)),
  ];
}
