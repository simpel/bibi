import { ok, type Result } from "../../errors/result";
import { createAlternativeGroup } from "../../features/alternative-group/operations";
import type { ExecuteContext } from "../../operations/context";
import { execute } from "../../operations/execute";
import { missing } from "./seed-fields";
import type { DemoAlternative } from "./ticket-types";

type Ctx = { context: ExecuteContext; ticketId: string };

export type LineIdsByNameInput = Ctx & { names: readonly string[] };

/** The ids of the ticket's lines with these names, in the same order, or the first missing one. */
export async function lineIdsByName({
  context,
  ticketId,
  names,
}: LineIdsByNameInput): Promise<Result<string[]>> {
  const rows = await context.db.line.findMany({
    where: { ticketId, name: { in: [...names] } },
    select: { id: true, name: true },
  });
  const ids: string[] = [];
  for (const name of names) {
    const row = rows.find((candidate) => candidate.name === name);
    if (!row) return missing({ what: `line ${name}` });
    ids.push(row.id);
  }
  return ok({ value: ids });
}

export type SeedAlternativesInput = Ctx & { alternatives: readonly DemoAlternative[] };

/** The ticket's alternative groups (ADR 0052) via `alternativeGroup.create` as SYSTEM. */
export async function seedDemoAlternatives({
  context,
  ticketId,
  alternatives,
}: SeedAlternativesInput): Promise<Result<true>> {
  for (const { name, lines } of alternatives) {
    const lineIds = await lineIdsByName({ context, ticketId, names: lines });
    if (!lineIds.ok) return lineIds;
    const input = { ticketId, name, lineIds: lineIds.value };
    const created = await execute({ operation: createAlternativeGroup, input, context });
    if (!created.ok) return created;
  }
  return ok({ value: true });
}

/** The line ids of the options the customer picks on accept (`chosen`), for `quote.accept`. */
export async function chosenLineIds({
  context,
  ticketId,
  alternatives,
}: SeedAlternativesInput): Promise<Result<string[]>> {
  const names = alternatives.flatMap((group) => (group.chosen ? [group.chosen] : []));
  return lineIdsByName({ context, ticketId, names });
}
