import { z } from "zod";
import {
  FEATURES,
  type Feature,
  featureActions,
  PERMISSION_ACTIONS,
  type PermissionAction,
} from "./features";

/** What a caller may do: `{ ticket: ["view", "edit"], item: ["view"] }` (ADR 0050). */
export type PermissionSet = Partial<Record<string, readonly PermissionAction[]>>;

export const PermissionSetSchema = z
  .partialRecord(z.enum(FEATURES), z.array(z.enum(PERMISSION_ACTIONS)).max(7))
  .describe('Actions per feature, e.g. { "ticket": ["view", "edit"] }. Every action implies view.');

export type NormalizePermissionsInput = { permissions: PermissionSet };

/**
 * Canonical form: only actions the feature has, any action implies `view`, actions in the
 * feature's order, features in `FEATURES` order, empty features dropped.
 */
export function normalizePermissions({ permissions }: NormalizePermissionsInput): PermissionSet {
  const entries = FEATURES.flatMap((feature) => {
    const granted = new Set(permissions[feature] ?? []);
    if (granted.size > 0) granted.add("view");
    const actions = featureActions({ feature }).filter((action) => granted.has(action));
    return actions.length === 0 ? [] : [[feature, actions] as const];
  });
  return Object.fromEntries(entries);
}

export type GrantAllInput = { features?: readonly Feature[]; only?: PermissionAction };

/** Every action (or only `only`) on `features` (default: all). `grantAll({})` = admin. */
export function grantAll({ features = FEATURES, only }: GrantAllInput): PermissionSet {
  const entries = features.map((feature) => {
    const actions = featureActions({ feature });
    return [feature, only ? actions.filter((action) => action === only) : actions] as const;
  });
  return normalizePermissions({ permissions: Object.fromEntries(entries) });
}

export type UnionPermissionsInput = { sets: readonly PermissionSet[] };

export function unionPermissions({ sets }: UnionPermissionsInput): PermissionSet {
  const merged: Record<string, PermissionAction[]> = {};
  for (const set of sets) {
    for (const [feature, actions] of Object.entries(set)) {
      merged[feature] = [...(merged[feature] ?? []), ...(actions ?? [])];
    }
  }
  return normalizePermissions({ permissions: merged });
}

export type IntersectPermissionsInput = { a: PermissionSet; b: PermissionSet };

export function intersectPermissions({ a, b }: IntersectPermissionsInput): PermissionSet {
  const right = normalizePermissions({ permissions: b });
  const entries = Object.entries(normalizePermissions({ permissions: a })).map(
    ([feature, actions]) => [
      feature,
      (actions ?? []).filter((action) => right[feature]?.includes(action) ?? false),
    ],
  );
  return normalizePermissions({ permissions: Object.fromEntries(entries) });
}

export type IsSubsetInput = { subset: PermissionSet; of: PermissionSet };

/** True when every action in `subset` is also in `of` (after normalizing both). */
export function isPermissionSubset({ subset, of }: IsSubsetInput): boolean {
  const target = normalizePermissions({ permissions: of });
  return Object.entries(normalizePermissions({ permissions: subset })).every(([feature, actions]) =>
    (actions ?? []).every((action) => target[feature]?.includes(action) ?? false),
  );
}
