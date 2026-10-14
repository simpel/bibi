import {
  PERMISSION_ACTIONS,
  type PermissionAction,
  type PermissionSetSchema,
  RESOURCES,
  type Resource,
} from "@okazi/core/schemas";
import type { z } from "zod";

export type PermissionSetValue = z.infer<typeof PermissionSetSchema>;
export type PermissionActionValue = PermissionAction;
export type ResourceKey = Resource;

/** Weakest to strongest; a higher action implies the lower ones. */
export const MATRIX_ACTIONS: readonly PermissionActionValue[] = PERMISSION_ACTIONS;

/** Every resource a role can grant (client-safe export of core). */
export const MATRIX_RESOURCES: readonly ResourceKey[] = RESOURCES;

export type ToggleActionInput = {
  permissions: PermissionSetValue;
  resource: ResourceKey;
  action: PermissionActionValue;
  checked: boolean;
};

/** Checking an action grants the weaker ones; unchecking removes the stronger ones. */
export function toggleAction({
  permissions,
  resource,
  action,
  checked,
}: ToggleActionInput): PermissionSetValue {
  const index = MATRIX_ACTIONS.indexOf(action);
  const actions = checked ? MATRIX_ACTIONS.slice(0, index + 1) : MATRIX_ACTIONS.slice(0, index);
  const next = { ...permissions };
  if (actions.length === 0) delete next[resource];
  else next[resource] = [...actions];
  return next;
}

export type HasActionInput = {
  permissions: PermissionSetValue;
  resource: ResourceKey;
  action: PermissionActionValue;
};

export function hasAction({ permissions, resource, action }: HasActionInput): boolean {
  return permissions[resource]?.includes(action) ?? false;
}
