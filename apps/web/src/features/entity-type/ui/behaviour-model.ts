import { BEHAVIOUR_REQUIRES, ITEM_BEHAVIOURS, type ItemBehaviour } from "@okazi/core/schemas";

export type ToggleBehaviourInput = {
  current: readonly ItemBehaviour[];
  behaviour: ItemBehaviour;
  checked: boolean;
};

/**
 * Behaviours after switching one on or off. Switching on pulls in the behaviour it requires
 * (CHOICES → COMPOSABLE, SETUPS → BOOKABLE); switching off drops the ones that depend on it.
 */
export function toggleBehaviour({
  current,
  behaviour,
  checked,
}: ToggleBehaviourInput): ItemBehaviour[] {
  const next = new Set(current);
  if (checked) {
    next.add(behaviour);
    const required = BEHAVIOUR_REQUIRES[behaviour];
    if (required) next.add(required);
  } else {
    next.delete(behaviour);
    for (const dependent of ITEM_BEHAVIOURS) {
      if (BEHAVIOUR_REQUIRES[dependent] === behaviour) next.delete(dependent);
    }
  }
  return ITEM_BEHAVIOURS.filter((item) => next.has(item));
}
