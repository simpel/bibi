import type { EntityTypeDto } from "@bibi/core";
import type { ItemCapability } from "@bibi/core/schemas";

export type HasCapabilityInput = { type: EntityTypeDto | undefined; capability: ItemCapability };

/** Whether the type switches on a capability; sections of the item form depend on it. */
export function hasCapability({ type, capability }: HasCapabilityInput): boolean {
  return type?.capabilities.includes(capability) ?? false;
}
