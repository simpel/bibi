import { ok } from "../../errors/result";
import { defineOperation } from "../../operations/define-operation";
import { loadAccountingSettings } from "./load-settings";
import { saveAccountingSettings } from "./save-settings";
import {
  AccountingSettingsGetInputSchema,
  AccountingSettingsSchema,
  AccountingSettingsUpdateInputSchema,
} from "./settings-schema";

export const getAccountingSettings = defineOperation({
  name: "accountingSettings.get",
  entityType: "accountingSettings",
  kind: "query",
  description:
    "Read the accounts the SIE export posts to: receivables, payment clearing, customer " +
    "advances, fees, rounding, default revenue, output VAT per rate, the fiscal year's first " +
    "month and the revenue account of each mapped item type or item. BAS defaults until saved.",
  input: AccountingSettingsGetInputSchema,
  output: AccountingSettingsSchema,
  permission: "finance:read",
  handler: async ({ context }) => ok({ value: await loadAccountingSettings({ context }) }),
});

export const updateAccountingSettings = defineOperation({
  name: "accountingSettings.update",
  entityType: "accountingSettings",
  kind: "command",
  description:
    "Change the accounts the SIE export posts to (four-digit account numbers). Omitted fields " +
    "keep their value. revenueAccounts, when given, replaces every item type and item mapping.",
  input: AccountingSettingsUpdateInputSchema,
  output: AccountingSettingsSchema,
  permission: "finance:write",
  handler: ({ input, context }) => saveAccountingSettings({ context, data: input }),
});
