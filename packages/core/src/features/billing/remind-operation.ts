import { ok } from "../../errors/result";
import { defineOperation } from "../../operations/define-operation";
import { REMIND_INTERVAL_MS } from "./plan";
import { BillingGetInputSchema, BillingReminderSchema } from "./schema";

/**
 * Any member may nudge the admins to pay (ADR 0095 §7). The mail itself goes out after the
 * commit through `billingMailHook` in `@bibi/auth` when `sent` is true; at most once an hour.
 */
export const remindBillingAdmins = defineOperation({
  name: "billing.remindAdmins",
  kind: "command",
  entityType: "billingAccount",
  description:
    "Send the organization's admins a friendly email asking them to add payment details for " +
    "Bibi. At most once an hour; sent is false when they were reminded just now.",
  input: BillingGetInputSchema,
  output: BillingReminderSchema,
  permission: "self:write",
  handler: async ({ context }) => {
    const { organizationId } = context;
    const now = new Date();
    const before = await context.db.billingAccount.upsert({
      where: { organizationId },
      create: { organizationId },
      update: {},
    });
    const cutoff = new Date(now.getTime() - REMIND_INTERVAL_MS);
    // Only one of two concurrent reminders wins the write, so only one mail goes out.
    const { count } = await context.db.billingAccount.updateMany({
      where: { OR: [{ remindedAt: null }, { remindedAt: { lt: cutoff } }] },
      data: { remindedAt: now },
    });
    if (count === 0) {
      return ok({ value: { organizationId, sent: false, remindedAt: before.remindedAt } });
    }
    context.recordChange({ entityId: before.id, before, after: { ...before, remindedAt: now } });
    return ok({ value: { organizationId, sent: true, remindedAt: now } });
  },
});
