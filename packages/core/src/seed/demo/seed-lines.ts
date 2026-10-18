import { ok, type Result } from "../../errors/result";
import { changeLineState } from "../../features/program-item/change-state-operation";
import { createProgramItem } from "../../features/program-item/write-operations";
import type { ExecuteContext } from "../../operations/context";
import { execute } from "../../operations/execute";
import { missing } from "./seed-fields";
import type { DemoLine } from "./ticket-types";

export type SeedLinesInput = {
  context: ExecuteContext;
  ticketId: string;
  lines: readonly DemoLine[];
  /** Local time `HH:MM` on the ticket's day → instant. */
  at: (input: { time: string }) => Date;
};

type OverrideInput = {
  context: ExecuteContext;
  line: DemoLine;
  lineId: string;
  item: { entityTypeId: string };
};

/** The line's state override by name (`line.changeState`), if the data sets one. */
async function overrideState({ context, line, lineId, item }: OverrideInput) {
  if (!line.state) return ok({ value: true });
  const state = await context.db.itemState.findFirst({
    where: { name: line.state, entityTypeId: item.entityTypeId },
  });
  if (!state) return missing({ what: `state ${line.state} of ${line.item}` });
  const input = { lineId, stateId: state.id };
  return execute({ operation: changeLineState, input, context });
}

/**
 * The ticket's lines (ADR 0044) via `programItem.create` as SYSTEM, in the organization's line
 * type: each starts in the entry phase's cell of the phase grid (else its type's initial state), so a room
 * line is a soft hold, and a line with `state` is then overridden to it.
 */
export async function seedDemoLines({
  context,
  ticketId,
  lines,
  at,
}: SeedLinesInput): Promise<Result<true>> {
  if (lines.length === 0) return ok({ value: true });
  const type = await context.db.entityType.findFirst({ where: { base: "PROGRAM_ITEM" } });
  if (!type) return missing({ what: "a line type (base PROGRAM_ITEM)" });
  for (const line of lines) {
    const item = await context.db.item.findFirst({ where: { name: line.item } });
    if (!item) return missing({ what: `item ${line.item}` });
    const input = {
      ...{ ticketId, entityTypeId: type.id, itemId: item.id, name: line.name },
      ...{ startsAt: at({ time: line.from }), endsAt: at({ time: line.to }) },
    };
    const created = await execute({ operation: createProgramItem, input, context });
    if (!created.ok) return created;
    const state = await overrideState({ context, line, lineId: created.value.id, item });
    if (!state.ok) return state;
  }
  return ok({ value: true });
}
