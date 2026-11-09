import { ok } from "../../errors/result";
import { defineOperation } from "../../operations/define-operation";
import { loadSettingsView } from "./load-settings-view";
import { SettingsViewInputSchema, SettingsViewSchema } from "./schema";

export const viewSettings = defineOperation({
  name: "settings.view",
  kind: "query",
  description:
    "The organization's settings the user asks about, by key (time zone, domain join, payment " +
    "operator, deposit, invoices, fiscal year, accounts, seats): prefer it to answer any " +
    "question about a setting, with only the keys asked. A view read model (ADR 0071): each " +
    "setting comes from its owner feature and is left out without that feature's read " +
    "(paymentAccount, finance, billing). Writes nothing; changes go through the owner's update.",
  input: SettingsViewInputSchema,
  output: SettingsViewSchema,
  // Shared vocabulary, always readable: the other features' settings are gated per key.
  permission: "configuration:read",
  handler: async ({ input, context }) =>
    ok({ value: await loadSettingsView({ context, keys: input.keys }) }),
});

/** The organization's settings, one by one (ADR 0071). */
export const settingsOperations = [viewSettings];
