import type { Permission } from "@bibi/core";
import type { ReactNode } from "react";
import { can, getCallerAbilities } from "@/server/caller-abilities";
import { ErrorState } from "./error-state";

export type PermissionGateProps = { permission: Permission; children: ReactNode };

/**
 * Renders `children` only when the caller holds `permission` (ADR 0050), otherwise the forbidden
 * state. Wraps create and update pages so staff never meet a form that fails on submit.
 */
export async function PermissionGate({ permission, children }: PermissionGateProps) {
  if (!can({ abilities: await getCallerAbilities(), permission })) {
    return <ErrorState errorKey="forbidden" />;
  }
  return children;
}
