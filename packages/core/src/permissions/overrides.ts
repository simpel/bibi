import { z } from "zod";
import {
  FEATURES,
  type Feature,
  featureActions,
  isLocked,
  PERMISSION_ACTIONS,
  type PermissionAction,
  parseFeature,
} from "./features";
import type { FixedRole } from "./fixed-roles";
import { normalizePermissions, type PermissionSet } from "./permission-set";
import { presetPermissions } from "./presets";

export const OVERRIDE_EFFECTS = ["allow", "deny"] as const;
export type OverrideEffect = (typeof OVERRIDE_EFFECTS)[number];

export const PermissionOverrideSchema = z.object({
  feature: z.enum(FEATURES).describe("The feature, e.g. item"),
  action: z.enum(PERMISSION_ACTIONS).describe("The action, e.g. edit"),
  effect: z.enum(OVERRIDE_EFFECTS).describe("allow adds it to the preset, deny takes it away"),
});
export type PermissionOverride = z.infer<typeof PermissionOverrideSchema>;

export type IsValidOverrideInput = { feature: string; action: string };

/** A real `feature:action` that is not admin-only locked (ADR 0050). */
export function isValidOverride({ feature, action }: IsValidOverrideInput): boolean {
  const known = parseFeature({ feature });
  if (!known) return false;
  const exists = featureActions({ feature: known }).includes(action as PermissionAction);
  return exists && !isLocked({ feature: known, action: action as PermissionAction });
}

export type ApplyOverridesInput = {
  preset: FixedRole | null;
  overrides: readonly { feature: string; action: string; effect: string }[];
};

/**
 * Effective permissions: the preset, plus `allow`, minus `deny`. Locked and unknown overrides
 * are ignored; denying `view` takes the whole feature away (every action implies view).
 */
export function applyOverrides({ preset, overrides }: ApplyOverridesInput): PermissionSet {
  const granted = new Map<Feature, Set<PermissionAction>>();
  for (const [feature, actions] of Object.entries(presetPermissions({ preset }))) {
    granted.set(feature as Feature, new Set(actions));
  }
  const valid = overrides.filter((override) => isValidOverride(override));
  for (const { feature, action, effect } of valid) {
    const actions = granted.get(feature as Feature) ?? new Set<PermissionAction>();
    if (effect === "allow") actions.add(action as PermissionAction);
    if (effect === "deny") actions.delete(action as PermissionAction);
    granted.set(feature as Feature, actions);
  }
  const deniedView = new Set(valid.filter((o) => o.effect === "deny" && o.action === "view"));
  const entries = [...granted].map(([feature, actions]) => {
    const hidden = [...deniedView].some((override) => override.feature === feature);
    return [feature, hidden ? [] : [...actions]] as const;
  });
  return normalizePermissions({ permissions: Object.fromEntries(entries) });
}
