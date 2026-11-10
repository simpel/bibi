import type { EntityTypeDto, ItemTypeGroupDto } from "@bibi/core";

/** The `?group=` value of the tab for item types without a group. */
export const OTHER_GROUP = "none";

export type GroupTab = { key: string; label: string };

export type ItemGroupView = {
  tabs: GroupTab[];
  /** The selected tab's key: a group id or `OTHER_GROUP`. */
  current: string;
  /** The selected tab's filter for `item.list`: a group id, or null for ungrouped types. */
  groupId: string | null;
  /** The item types of the selected tab. */
  types: EntityTypeDto[];
};

export type ItemGroupViewInput = {
  groups: ItemTypeGroupDto[];
  types: EntityTypeDto[];
  /** The `group` search param. */
  requested: string | undefined;
  otherLabel: string;
};

/**
 * The tabs of /items (ADR 0101): one per active group, plus "Other" when an item type has none.
 * Null when the organization has no groups: the page stays one list.
 */
export function itemGroupView({
  groups,
  types,
  requested,
  otherLabel,
}: ItemGroupViewInput): ItemGroupView | null {
  const first = groups[0];
  if (!first) return null;
  const tabs: GroupTab[] = groups.map(({ id, name }) => ({ key: id, label: name }));
  if (types.some((type) => type.groupId === null)) {
    tabs.push({ key: OTHER_GROUP, label: otherLabel });
  }
  const current = tabs.find((tab) => tab.key === requested)?.key ?? first.id;
  const groupId = current === OTHER_GROUP ? null : current;
  return { tabs, current, groupId, types: types.filter((type) => type.groupId === groupId) };
}
