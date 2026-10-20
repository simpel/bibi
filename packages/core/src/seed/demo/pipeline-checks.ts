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

/** Counts and the minimum configuration of the phases and the grid. */
async function phaseFailures({ context, org }: CheckDemoPipelineInput): Promise<string[]> {
  const { slug, pipeline } = org;
  const phases = await context.db.ticketPhase.findMany({ where: { status: "ACTIVE" } });
  const transitions = await context.db.ticketPhaseTransition.count();
  const cells = await context.db.phaseStateRule.count();
  const entries = phases.filter((phase) => phase.entry).length;
  const failures = [
    ...countFailure({
      slug,
      what: "phases",
      found: phases.length,
      expected: pipeline.phases.phases.length,
    }),
    ...countFailure({
      slug,
      what: "phase transitions",
      found: transitions,
      expected: pipeline.phases.transitions.length,
    }),
    ...countFailure({ slug, what: "grid cells", found: cells, expected: pipeline.cells.length }),
    ...countFailure({ slug, what: "entry phases", found: entries, expected: 1 }),
  ];
  if (!phases.some((phase) => phase.terminal)) failures.push(`${slug}: no terminal phase`);
  const guarded = pipeline.phases.phases.filter((phase) => phase.requiresAcceptedQuote).length;
  const found = phases.filter((phase) => phase.requiresAcceptedQuote).length;
  failures.push(...countFailure({ slug, what: "accepted-quote phases", found, expected: guarded }));
  return failures;
}

/**
 * The phase history (ADR 0054): every ticket's first change is its start (no `fromPhaseId`, by
 * `TEMPLATE` for each ticket made from a predefined ticket, else `MANUAL`), and a ticket in a
 * phase with a quote event got there by `QUOTE_EVENT` (or started there from a template). That `phaseId` is the newest change is the
 * reconciliation's job.
 */
async function historyFailures({ context, org }: CheckDemoPipelineInput): Promise<string[]> {
  const { slug } = org;
  const tickets = await context.db.ticket.findMany({
    select: {
      reference: true,
      phase: { select: { event: true } },
      phaseChanges: { select: { fromPhaseId: true, trigger: true }, orderBy: { seq: "asc" } },
    },
  });
  const failures: string[] = [];
  for (const { reference, phase, phaseChanges } of tickets) {
    const first = phaseChanges[0];
    if (!first || first.fromPhaseId !== null || !["MANUAL", "TEMPLATE"].includes(first.trigger)) {
      failures.push(`${slug}: ticket #${reference} has no start in its phase history`);
    }
    const byEvent = phaseChanges.some((change) => change.trigger === "QUOTE_EVENT");
    if (phase.event && !byEvent && first?.trigger !== "TEMPLATE") {
      failures.push(`${slug}: ticket #${reference} reached its event phase by hand`);
    }
  }
  const found = tickets.filter((ticket) => ticket.phaseChanges[0]?.trigger === "TEMPLATE").length;
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
 * ADR 0043 and 0044: the phase, transition, state and grid cell counts against the data files,
 * the minimum configuration (one entry and one terminal phase) and that every item type has
 * exactly one initial state. Run before the grid checks move any ticket. Returns failures.
 */
export async function checkDemoPipeline({
  context,
  org,
}: CheckDemoPipelineInput): Promise<string[]> {
  const input = { context, org };
  return [
    ...(await phaseFailures(input)),
    ...(await stateFailures(input)),
    ...(await historyFailures(input)),
  ];
}
