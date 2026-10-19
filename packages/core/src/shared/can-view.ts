import { hasPermission } from "../operations/permission";
import type { OperationContext } from "../operations/types";
import type { Feature } from "../permissions/features";

export type CanViewInput = { context: Pick<OperationContext, "permissions">; feature: Feature };

/** Whether the caller may view `feature`'s data (ADR 0050, feature scope). */
export function canView({ context, feature }: CanViewInput): boolean {
  return hasPermission({ permissions: context.permissions, permission: `${feature}:view` });
}
