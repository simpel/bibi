import { ok, type Result } from "../../errors/result";
import { expandLineBundle } from "../../features/line/expand-operation";
import type { ExecuteContext } from "../../operations/context";
import { execute } from "../../operations/execute";
import { missing } from "./seed-fields";
import type { DemoTicket } from "./ticket-types";

export type SeedBundleLinesInput = {
  context: ExecuteContext;
  ticketId: string;
  ticket: Pick<DemoTicket, "bundles">;
  /** Local time `HH:MM` on the ticket's day → instant. */
  at: (input: { time: string }) => Date;
};

/**
 * ADR 0059: each of the ticket's bundles through `line.expandBundle` as SYSTEM, in the
 * organization's line type: one bundle line and its part lines, each in its entry phase's cell.
 */
export async function seedDemoBundleLines({
  context,
  ticketId,
  ticket,
  at,
}: SeedBundleLinesInput): Promise<Result<true>> {
  const bundles = ticket.bundles ?? [];
  if (bundles.length === 0) return ok({ value: true });
  const type = await context.db.entityType.findFirst({ where: { base: "LINE" } });
  if (!type) return missing({ what: "a line type (base LINE)" });
  for (const bundle of bundles) {
    const item = await context.db.item.findFirst({ where: { name: bundle.item } });
    if (!item) return missing({ what: `bundle ${bundle.item}` });
    const input = {
      ...{ ticketId, entityTypeId: type.id, itemId: item.id },
      ...{ startsAt: at({ time: bundle.from }), endsAt: at({ time: bundle.to }) },
    };
    const expanded = await execute({ operation: expandLineBundle, input, context });
    if (!expanded.ok) return expanded;
  }
  return ok({ value: true });
}
