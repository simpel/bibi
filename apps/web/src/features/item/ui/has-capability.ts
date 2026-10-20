import type { EntityTypeDto } from "@okazi/core";
import type { ItemCapability } from "@okazi/core/schemas";

export type HasCapabilityInput = { type: EntityTypeDto | undefined; capability: ItemCapability };

/** Whether the type switches on a capability; sections of the item form depend on it. */
export function hasCapability({ type, capability }: HasCapabilityInput): boolean {
  return type?.capabilities.includes(capability) ?? false;
}
