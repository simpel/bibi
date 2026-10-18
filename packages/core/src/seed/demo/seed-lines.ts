import { ok, type Result } from "../../errors/result";
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

/**
 * The ticket's lines (ADR 0044) via `programItem.create` as SYSTEM, in the organization's line
 * type: each starts in its item type's initial state, so a room line is a soft hold.
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
  }
  return ok({ value: true });
}
