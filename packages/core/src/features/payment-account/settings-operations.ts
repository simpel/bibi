import { ok } from "../../errors/result";
import { defineOperation } from "../../operations/define-operation";
import {
  PaymentSettingsGetInputSchema,
  PaymentSettingsSchema,
  PaymentSettingsUpdateInputSchema,
} from "./settings-schema";
import { loadPaymentSettings, savePaymentSettings } from "./settings-store";

export const getPaymentSettings = defineOperation({
  name: "paymentSettings.get",
  entityType: "paymentSettings",
  kind: "query",
  description:
    "Read how the organization takes ticket money (ADR 0090): the deposit rule (depositPercent " +
    "of the ticket's total incl. VAT; a ticket below depositMinimumMinor is paid in full up " +
    "front) and the invoice provider used when both Stripe and Fortnox are connected.",
  input: PaymentSettingsGetInputSchema,
  output: PaymentSettingsSchema,
  permission: "paymentAccount:read",
  handler: async ({ context }) => ok({ value: await loadPaymentSettings({ context }) }),
});

export const updatePaymentSettings = defineOperation({
  name: "paymentSettings.update",
  entityType: "paymentSettings",
  kind: "command",
  description:
    "Change the deposit rule or the invoice provider. Omitted fields keep their value; null " +
    "clears one (no deposit rule, no minimum, or the provider follows what is connected).",
  input: PaymentSettingsUpdateInputSchema,
  output: PaymentSettingsSchema,
  permission: "paymentAccount:write",
  handler: async ({ input, context }) =>
    ok({ value: await savePaymentSettings({ context, data: input }) }),
});
