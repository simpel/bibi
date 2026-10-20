import { ok, type Result } from "../../errors/result";
import { changeLineState } from "../../features/line/change-state-operation";
import { createLine } from "../../features/line/write-operations";
import type { ExecuteContext } from "../../operations/context";
import { execute } from "../../operations/execute";
import { seedDemoAlternatives } from "./seed-alternatives";
import { missing } from "./seed-fields";
import type { DemoLine, DemoTicket } from "./ticket-types";

export type SeedLinesInput = {
  context: ExecuteContext;
  ticketId: string;
  /** Its `lines`, then its `alternatives` (ADR 0052). */
  ticket: Pick<DemoTicket, "lines" | "alternatives">;
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
 * The ticket's lines (ADR 0044) via `line.create` as SYSTEM, in the organization's line
 * type: each starts in the entry phase's cell of the phase grid (else its type's initial state), so a room
 * line is a soft hold, and a line with `state` is then overridden to it. A line without times is
 * untimed and holds nothing; its own quantity and price are set only when the data gives them.
 * Lines named in `alternatives` are then grouped (ADR 0052).
 */
export async function seedDemoLines({
  context,
  ticketId,
  ticket,
  at,
}: SeedLinesInput): Promise<Result<true>> {
  const lines = ticket.lines ?? [];
  if (lines.length === 0) return ok({ value: true });
  const type = await context.db.entityType.findFirst({ where: { base: "LINE" } });
  if (!type) return missing({ what: "a line type (base LINE)" });
  for (const line of lines) {
    const item = await context.db.item.findFirst({ where: { name: line.item } });
    if (!item) return missing({ what: `item ${line.item}` });
    const input = {
      ...{ ticketId, entityTypeId: type.id, itemId: item.id, name: line.name },
      ...(line.from && line.to
        ? { startsAt: at({ time: line.from }), endsAt: at({ time: line.to }) }
        : {}),
      ...(line.quantity === undefined ? {} : { quantity: line.quantity }),
      ...(line.unitPriceKr === undefined ? {} : { unitPriceMinor: line.unitPriceKr * 100 }),
    };
    const created = await execute({ operation: createLine, input, context });
    if (!created.ok) return created;
    const state = await overrideState({ context, line, lineId: created.value.id, item });
    if (!state.ok) return state;
  }
  const alternatives = ticket.alternatives ?? [];
  return seedDemoAlternatives({ context, ticketId, alternatives });
}
