import type { EntityTypeDto } from "@okazi/core";
import type { ItemBehaviour } from "@okazi/core/schemas";

export type HasBehaviourInput = { type: EntityTypeDto | undefined; behaviour: ItemBehaviour };

/** Whether the type switches on a behaviour; sections of the item form depend on it. */
export function hasBehaviour({ type, behaviour }: HasBehaviourInput): boolean {
  return type?.behaviours.includes(behaviour) ?? false;
}
