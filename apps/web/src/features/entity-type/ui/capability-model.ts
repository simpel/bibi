import { CAPABILITY_REQUIRES, ITEM_CAPABILITIES, type ItemCapability } from "@bibi/core/schemas";

export type ToggleCapabilityInput = {
  current: readonly ItemCapability[];
  capability: ItemCapability;
  checked: boolean;
};

/**
 * Capabilities after switching one on or off. Switching on pulls in the capability it requires
 * (CUSTOMISATIONS → BUNDLE, SETUPS → BOOKABLE); switching off drops the ones that depend on it.
 */
export function toggleCapability({
  current,
  capability,
  checked,
}: ToggleCapabilityInput): ItemCapability[] {
  const next = new Set(current);
  if (checked) {
    next.add(capability);
    const required = CAPABILITY_REQUIRES[capability];
    if (required) next.add(required);
  } else {
    next.delete(capability);
    for (const dependent of ITEM_CAPABILITIES) {
      if (CAPABILITY_REQUIRES[dependent] === capability) next.delete(dependent);
    }
  }
  return ITEM_CAPABILITIES.filter((item) => next.has(item));
}
