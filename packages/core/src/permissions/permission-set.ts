import { z } from "zod";
import { PERMISSION_ACTIONS, type PermissionAction, RESOURCES } from "./resources";

/** What a role or caller may do: `{ venue: ["read", "write"], item: ["read"] }`. */
export type PermissionSet = Partial<Record<string, readonly PermissionAction[]>>;

export const PermissionSetSchema = z
  .partialRecord(z.enum(RESOURCES), z.array(z.enum(PERMISSION_ACTIONS)).max(3))
  .describe('Actions per resource, e.g. { "venue": ["read", "write"] }. admin ⊃ write ⊃ read.');

const rank = ({ action }: { action: PermissionAction }): number =>
  PERMISSION_ACTIONS.indexOf(action);

export type NormalizePermissionsInput = { permissions: PermissionSet };

/**
 * Canonical form: actions imply the weaker ones (admin ⇒ write ⇒ read), listed weakest first,
 * resources in `RESOURCES` order, empty resources dropped.
 */
export function normalizePermissions({ permissions }: NormalizePermissionsInput): PermissionSet {
  const entries = RESOURCES.flatMap((resource) => {
    const granted = permissions[resource] ?? [];
    const top = Math.max(-1, ...granted.map((action) => rank({ action })));
    return top < 0 ? [] : [[resource, PERMISSION_ACTIONS.slice(0, top + 1)] as const];
  });
  return Object.fromEntries(entries);
}

export type GrantAllInput = { upTo: PermissionAction };

/** `upTo` (and the weaker actions) on every resource. `grantAll({ upTo: "admin" })` = owner. */
export function grantAll({ upTo }: GrantAllInput): PermissionSet {
  return normalizePermissions({
    permissions: Object.fromEntries(RESOURCES.map((resource) => [resource, [upTo]])),
  });
}

export type UnionPermissionsInput = { sets: readonly PermissionSet[] };

export function unionPermissions({ sets }: UnionPermissionsInput): PermissionSet {
  const merged: Record<string, PermissionAction[]> = {};
  for (const set of sets) {
    for (const [resource, actions] of Object.entries(set)) {
      merged[resource] = [...(merged[resource] ?? []), ...(actions ?? [])];
    }
  }
  return normalizePermissions({ permissions: merged });
}

export type IntersectPermissionsInput = { a: PermissionSet; b: PermissionSet };

export function intersectPermissions({ a, b }: IntersectPermissionsInput): PermissionSet {
  const left = normalizePermissions({ permissions: a });
  const right = normalizePermissions({ permissions: b });
  const entries = Object.entries(left).map(([resource, actions]) => [
    resource,
    (actions ?? []).filter((action) => right[resource]?.includes(action) ?? false),
  ]);
  return normalizePermissions({ permissions: Object.fromEntries(entries) });
}

export type IsSubsetInput = { subset: PermissionSet; of: PermissionSet };

/** True when every action in `subset` is also in `of` (after normalizing both). */
export function isPermissionSubset({ subset, of }: IsSubsetInput): boolean {
  const target = normalizePermissions({ permissions: of });
  return Object.entries(normalizePermissions({ permissions: subset })).every(
    ([resource, actions]) =>
      (actions ?? []).every((action) => target[resource]?.includes(action) ?? false),
  );
}
