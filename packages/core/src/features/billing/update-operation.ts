import { ok } from "../../errors/result";
import { defineOperation } from "../../operations/define-operation";
import { invalid } from "../../shared/errors";
import { loadBillingRow } from "./load-billing";
import { BILLING_PLAN } from "./plan";
import { BillingSchema, BillingUpdateInputSchema } from "./schema";
import { seatUsage } from "./seats";
import { syncSeats } from "./sync-seats";
import { loadBillingDto } from "./to-billing-dto";

export const updateBilling = defineOperation({
  name: "billing.update",
  kind: "command",
  entityType: "billingAccount",
  description:
    "Change how seats are handled: autoAssignSeats (on: an invitation beyond the seats adds a " +
    "paid seat of 49 SEK a month; off: admins approve each one) and extraSeats (paid seats " +
    "beyond the included 10, never below the seats in use).",
  input: BillingUpdateInputSchema,
  output: BillingSchema,
  permission: "billing:write",
  handler: async ({ input, context }) => {
    const before = await loadBillingRow({ context });
    // The row lock first (as in `claimSeat`), so a concurrent invitation is counted.
    await context.db.billingAccount.upsert({
      where: { organizationId: context.organizationId },
      create: { organizationId: context.organizationId },
      update: { updatedAt: new Date() },
    });
    if (input.extraSeats !== undefined) {
      const { used } = await seatUsage({ context });
      const needed = Math.max(0, used - BILLING_PLAN.includedSeats);
      if (input.extraSeats < needed) {
        const message = `${used} seats are in use, so at least ${needed} extra seats are needed`;
        return invalid({ message, issues: [{ path: "extraSeats", message }] });
      }
    }
    const row = await context.db.billingAccount.upsert({
      where: { organizationId: context.organizationId },
      create: { organizationId: context.organizationId, ...input },
      update: input,
    });
    context.recordChange({ entityId: row.id, before, after: row });
    return ok({ value: await loadBillingDto({ context, row }) });
  },
  // The subscription follows the stored seats; a failure is logged and the next change retries.
  followUp: ({ context }) => syncSeats({ context }),
});
