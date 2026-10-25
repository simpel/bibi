import { ALLOCATION_NAMES } from "./operation-names-assignment";
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

/** Occupancy and the calendar read (ADR 0022, 0064), kept apart so `operation-names.ts` fits. */
export const BOOKING_NAMES = [
  "calendar.range",
  "occupancy.archive",
  "occupancy.create",
  "occupancy.get",
  "occupancy.list",
  "occupancy.update",
];

/** Operations the AI actor may never run (`aiAllowed: false`, #88). */
export const AI_FORBIDDEN_NAMES = ["apiKey.create"];

/** The caller's own preferences, profile, working hours and files (`self`, ADR 0039, 0061, 0063). */
const SELF_NAMES = [
  "userPreference.list",
  "userPreference.set",
  "userSettings.get",
  "userSettings.update",
  "profile.get",
  "profile.update",
  "workingHours.get",
  "workingHours.set",
  "file.upload",
  "file.get",
];

/** The organization's own facts and first setup status (ADR 0061). */
const ORGANIZATION_NAMES = [
  "organizationProfile.get",
  "organizationProfile.update",
  "organizationProfile.setSetupStatus",
];

/** A member's work in the organization: schedule kind and staff items (ADR 0068). */
const MEMBER_PROFILE_NAMES = [
  "memberProfile.get",
  "memberProfile.list",
  "memberProfile.update",
  "memberProfile.setItems",
];

/** The audit trail and the change layer that applies approved change sets (ADR 0049). */
const CHANGE_NAMES = ["auditLog.get", "auditLog.list", "changeSet.apply"];

/** Every name kept outside `operation-names.ts`. */
export const EXTRA_NAMES = [
  ...SALES_NAMES,
  ...ALLOCATION_NAMES,
  ...MEMBER_PROFILE_NAMES,
  ...MONEY_NAMES,
  ...INTEGRATION_NAMES,
  ...BOOKING_NAMES,
  ...SELF_NAMES,
  ...ORGANIZATION_NAMES,
  ...CHANGE_NAMES,
];
