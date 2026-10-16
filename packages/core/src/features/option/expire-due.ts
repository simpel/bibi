import { ok } from "../../errors/result";
import { defineOperation } from "../../operations/define-operation";
import { leaveQueue } from "./leave-queue";
import { lockOptionQueue } from "./option-queue";
import { type OptionDto, OptionExpireDueInputSchema, OptionExpireDueOutputSchema } from "./schema";
import { toOptionDto } from "./to-option-dto";

export const expireDueOptions = defineOperation({
  name: "option.expireDue",
  kind: "command",
  description:
    "Expire every ACTIVE option whose expiry date has passed (ADR 0022): each becomes EXPIRED, " +
    "its occupancy is released and the options behind it move up. Runs every 15 minutes in the " +
    "scheduler and can be run by hand. Returns the options that expired.",
  input: OptionExpireDueInputSchema,
  output: OptionExpireDueOutputSchema,
  permission: "option:write",
  handler: async ({ context }) => {
    const due = { optionStatus: "ACTIVE" as const, expiresAt: { lte: new Date() } };
    const found = await context.db.option.findMany({ where: due, select: { itemId: true } });
    // Lock every affected queue up front, in a fixed order, so concurrent runs cannot deadlock.
    for (const itemId of [...new Set(found.map((row) => row.itemId))].sort()) {
      await lockOptionQueue({ context, itemId });
    }
    const rows = await context.db.option.findMany({ where: due, orderBy: { sequence: "asc" } });
    const items: OptionDto[] = [];
    for (const row of rows) {
      const expired = await leaveQueue({ context, before: toOptionDto({ row }), to: "EXPIRED" });
      if (!expired.ok) return expired;
      items.push(expired.value);
    }
    return ok({ value: { items } });
  },
});
