import { MONEY_NAMES, SALES_NAMES } from "./operation-names-sales";

/** API key, OAuth grant and permission operations (ADR 0005, 0050), kept apart so `operation-names.ts` fits. */
export const INTEGRATION_NAMES = [
  "apiKey.create",
  "apiKey.get",
  "apiKey.list",
  "apiKey.revoke",
  "apiKey.update",
  "oauthGrant.list",
  "oauthGrant.revoke",
  "permission.get",
  "permission.update",
];

/** Operations the AI actor may never run (`aiAllowed: false`, #88). */
export const AI_FORBIDDEN_NAMES = ["apiKey.create"];

/** The caller's own preferences and settings (`self`, ADR 0039, 0046). */
const SELF_NAMES = [
  "userPreference.list",
  "userPreference.set",
  "userSettings.get",
  "userSettings.update",
];

/** The audit trail and the change layer that applies approved change sets (ADR 0049). */
const CHANGE_NAMES = ["auditLog.get", "auditLog.list", "changeSet.apply"];

/** Every name kept outside `operation-names.ts`. */
export const EXTRA_NAMES = [
  ...SALES_NAMES,
  ...MONEY_NAMES,
  ...INTEGRATION_NAMES,
  ...SELF_NAMES,
  ...CHANGE_NAMES,
];
