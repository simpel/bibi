/** A customisation group of a template line's item, as the defaults are read against it. */
export type DefaultsGroup = {
  maxPick: number;
  split: boolean;
  options: readonly { itemId: string }[];
};

/** A default choice of a template line (ADR 0089); `stale` = it no longer fits the item. */
export type LineDefault = { itemId: string; stale: boolean };

export type LineDefaultsInput = {
  /** The stored defaults' items, in order. */
  itemIds: readonly string[];
  /** The line's item's groups now (none without an item). */
  groups: readonly DefaultsGroup[];
};

/**
 * The defaults with whether each still fits (ADR 0089 decision 8): a default is stale when no
 * group of the item offers it, when its group is split (split groups get no defaults), or when
 * its group now has more defaults than its maxPick (then all of that group's are stale).
 */
export function lineDefaults({ itemIds, groups }: LineDefaultsInput): LineDefault[] {
  const groupOf = ({ itemId }: { itemId: string }) =>
    groups.find((group) => group.options.some((option) => option.itemId === itemId));
  return itemIds.map((itemId) => {
    const group = groupOf({ itemId });
    if (!group || group.split) return { itemId, stale: true };
    const inGroup = itemIds.filter((id) => groupOf({ itemId: id }) === group).length;
    return { itemId, stale: inGroup > group.maxPick };
  });
}

/** The defaults that still fit, as `order.create` draft line options. */
export const freshDefaults = ({ options }: { options: readonly LineDefault[] }) =>
  options.filter((option) => !option.stale).map(({ itemId }) => ({ itemId }));
