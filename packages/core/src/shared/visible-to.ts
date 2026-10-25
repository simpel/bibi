import type { OperationContext } from "../operations/types";
import type { Feature } from "../permissions/features";
import { canView } from "./can-view";

export type VisibleToInput<T> = {
  context: Pick<OperationContext, "permissions">;
  feature: Feature;
  value: T;
};

/**
 * A view read model's field from another feature (ADR 0071): the value when the caller may read
 * that feature, else `null`. The one place the gate lives, so a view cannot leak a field.
 */
export function visibleTo<T>({ context, feature, value }: VisibleToInput<T>): T | null {
  return canView({ context, feature }) ? value : null;
}
