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
    "Read how the organization takes order money (ADR 0090): the deposit rule (depositPercent " +
    "of the order's total incl. VAT; an order below depositMinimumMinor is paid in full up " +
    "front) and the routes: which connected provider takes each payment method (CARD, SWISH, " +
    "INVOICE; null = the connected one that can).",
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
    "Change the deposit rule or the routes (which provider takes each payment method). Omitted " +
    "fields and methods keep their value; null clears one (no deposit rule, no minimum, or the " +
    "method goes to the connected provider that can take it). VALIDATION when a provider " +
    "cannot take the method.",
  input: PaymentSettingsUpdateInputSchema,
  output: PaymentSettingsSchema,
  permission: "paymentAccount:write",
  handler: ({ input, context }) => savePaymentSettings({ context, data: input }),
});
