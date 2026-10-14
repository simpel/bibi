import { SALES_NAMES } from "./operation-names-sales";

/** API key and OAuth grant operations (ADR 0005), kept apart so `operation-names.ts` fits. */
export const INTEGRATION_NAMES = [
  "apiKey.create",
  "apiKey.list",
  "apiKey.revoke",
  "oauthGrant.list",
  "oauthGrant.revoke",
];

/** Operations the AI actor may never run (`aiAllowed: false`, #88). */
export const AI_FORBIDDEN_NAMES = ["apiKey.create"];

/** Every name kept outside `operation-names.ts`. */
export const EXTRA_NAMES = [...SALES_NAMES, ...INTEGRATION_NAMES];
