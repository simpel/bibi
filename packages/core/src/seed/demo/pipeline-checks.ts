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
  return failures;
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
  return [...(await phaseFailures(input)), ...(await stateFailures(input))];
}
