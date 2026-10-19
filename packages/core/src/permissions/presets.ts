import { FEATURES, type Feature } from "./features";
import type { FixedRole } from "./fixed-roles";
import { grantAll, type PermissionSet, unionPermissions } from "./permission-set";

/** Features only admins see by default; `view` on them can still be allowed per member. */
const ADMIN_VIEW: readonly Feature[] = ["audit", "assistant", "apiKey"];

/** The daily work a manager does in full: bookings, selling and money (ADR 0050). */
const MANAGER_FEATURES: readonly Feature[] = [
  "ticket",
  "program",
  "customer",
  "quote",
  "payment",
  "sheet",
];

const member = grantAll({
  features: FEATURES.filter((feature) => !ADMIN_VIEW.includes(feature)),
  only: "view",
});

/**
 * The presets (ADR 0050): constant, not configurable per organization. Every member and every
 * API key has one; overrides (`applyOverrides`) fine-tune it.
 */
export const PRESET_PERMISSIONS: Readonly<Record<FixedRole, PermissionSet>> = {
  member,
  manager: unionPermissions({ sets: [member, grantAll({ features: MANAGER_FEATURES })] }),
  admin: grantAll({}),
};

export type PresetPermissionsInput = { preset: FixedRole | null };

/** What a preset grants; no preset grants nothing (fail closed). */
export function presetPermissions({ preset }: PresetPermissionsInput): PermissionSet {
  return preset ? PRESET_PERMISSIONS[preset] : {};
}
