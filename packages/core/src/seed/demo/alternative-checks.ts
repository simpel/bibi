import type { ExecuteContext } from "../../operations/context";
import type { DemoAlternative } from "./ticket-types";
import type { DemoOrg } from "./types";

export type CheckDemoAlternativesInput = { context: ExecuteContext; org: DemoOrg };

const OPTION_SELECT = {
  id: true,
  name: true,
  state: { select: { hold: true, released: true } },
} as const;

type GroupInput = { context: ExecuteContext; group: DemoAlternative };

/**
 * One seeded group: open = every option soft-held; chosen = the pick is the group's
 * `chosenLineId`, still holds, and every other option is released and holds nothing.
 */
async function checkGroup({ context, group }: GroupInput): Promise<string[]> {
  const row = await context.db.alternativeGroup.findFirst({ where: { name: group.name } });
  if (!row) return [`alternative group ${group.name} is missing`];
  const options = await context.db.line.findMany({
    where: { alternativeGroupId: row.id },
    select: OPTION_SELECT,
  });
  const failures: string[] = [];
  if (options.length !== group.lines.length) {
    failures.push(`${group.name}: ${options.length} options, expected ${group.lines.length}`);
  }
  const chosen = options.find((option) => option.name === group.chosen);
  if (group.chosen && row.chosenLineId !== chosen?.id) {
    failures.push(`${group.name}: ${group.chosen} is not the chosen option`);
  }
  for (const option of options) {
    const holds = await context.db.occupancy.count({ where: { lineId: option.id } });
    const picked = !group.chosen || option.id === chosen?.id;
    const held = group.chosen ? option.state?.released === false : option.state?.hold === "SOFT";
    const released = option.state?.released === true && holds === 0;
    const ok = picked ? held : released;
    if (!ok) failures.push(`${group.name}: ${option.name} is not ${picked ? "held" : "released"}`);
  }
  return failures;
}

/**
 * Check 12 (ADR 0052): an open alternative group keeps a soft hold on every option; after the
 * seeded choice (`quote.accept` with the pick) the other options are released and hold nothing.
 */
export async function checkDemoAlternatives({
  context,
  org,
}: CheckDemoAlternativesInput): Promise<string[]> {
  const groups = org.tickets.flatMap((ticket) => ticket.alternatives ?? []);
  const failures: string[] = [];
  for (const group of groups) failures.push(...(await checkGroup({ context, group })));
  return failures.map((failure) => `${org.slug}: ${failure}`);
}
