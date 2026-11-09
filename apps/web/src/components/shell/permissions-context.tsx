"use client";

import type { Permission, PermissionSet } from "@bibi/core";
import { createContext, type ReactNode, useContext } from "react";
import { canPermission } from "@/lib/can";

const PermissionsContext = createContext<PermissionSet>({});

export type PermissionsProviderProps = { permissions: PermissionSet; children: ReactNode };

/**
 * The signed-in member's effective permissions (ADR 0050) for client islands rendered outside a
 * page's server props, such as the assistant's editable cards. Display only: every save is
 * checked again by the operation.
 */
export function PermissionsProvider({ permissions, children }: PermissionsProviderProps) {
  return <PermissionsContext.Provider value={permissions}>{children}</PermissionsContext.Provider>;
}

/** Whether the member holds `permission`, from the shell's permission set. */
export function useCan({ permission }: { permission: Permission }): boolean {
  return canPermission({ permissions: useContext(PermissionsContext), permission });
}
